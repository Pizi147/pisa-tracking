import { db } from '../db.ts';
import { LUOT_TINH_NO_SQL, PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { require_, scopeFor, type Principal } from '../permissions.ts';
import { reportEditWindow } from '../platform/week.ts';

/**
 * VIỆC SINH RA TỪ DỮ LIỆU.
 *
 * Đây không phải task: không có người được giao, không có nút "Đã xong". Mỗi tín hiệu là
 * một câu hỏi đọc thẳng từ dữ liệu nguồn, và TỰ HẾT khi nguồn được xử lý — giáo viên nhập
 * đủ điểm thì "thiếu điểm" biến mất, không ai phải bấm gì.
 *
 * Vì vậy KHÔNG ghi tín hiệu thành bản ghi mới mỗi lần mở trang. "5 MT chưa đủ điểm" là một
 * cách đếm nhóm attempt cụ thể; nhập một em thì còn 4, chứ không sinh thêm năm bản sao.
 *
 * Mỗi tín hiệu có `key` ỔN ĐỊNH, để sau này muốn ghi lại "đã xem" thì gắn vào khoá đó,
 * còn trạng thái thật vẫn đọc từ nguồn.
 */

export type Signal = {
  /** Khoá ổn định theo nguồn, không đổi giữa các lần tải trang. */
  key: string;
  kind: 'no_plan' | 'missing_scores' | 'sos_open' | 'report_due';
  label: string;
  count: number;
  /** Vai trò nào cần xử lý — để mỗi người thấy đúng việc của mình. */
  owner: 'manager' | 'teacher';
  tone: 'danger' | 'warn' | 'info';
  branchId: number | null;
  branchName: string | null;
  /** Đường dẫn mở đúng những bản ghi tạo nên con số này. */
  href: string;
};

/** Chi nhánh người dùng được nhìn, theo đúng phạm vi của grant. */
function branchesInScope(p: Principal): { id: number; name: string }[] {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return [];
  const all = db().prepare(`SELECT id, name FROM branches WHERE status='active' ORDER BY id`).all() as any[];
  return scope.all ? all : all.filter((b) => scope.branchIds.includes(b.id));
}

export function signalsFor(p: Principal, f: { branchId?: number | null; periodId?: number | null } = {}): Signal[] {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { anyScope: true }, 'Bạn không có quyền xem tình hình hệ thống.');
  const conn = db();
  const today = demoToday();
  const out: Signal[] = [];

  let branches = branchesInScope(p);
  if (f.branchId) branches = branches.filter((b) => b.id === f.branchId);
  if (!branches.length) return out;

  const ids = branches.map((b) => b.id);
  const ph = ids.map(() => '?').join(',');
  const nameOf = new Map(branches.map((b) => [b.id, b.name]));

  const push = (
    kind: Signal['kind'], branchId: number, count: number,
    label: string, owner: Signal['owner'], tone: Signal['tone'], href: string,
  ) => {
    if (count > 0) {
      out.push({
        key: `${kind}:branch:${branchId}`, kind, label, count, owner, tone,
        branchId, branchName: nameOf.get(branchId) ?? null, href,
      });
    }
  };

  // 1. Chưa có tuần MT — việc của QUẢN LÝ, không phải Admin chi nhánh.
  /* Lớp thường xếp lịch Test theo LỚP (planRegularTests), không theo từng em — không phải việc "chưa có tuần MT" của Quản lý. */
  for (const r of conn
    .prepare(
      `SELECT c.branch_id, COUNT(*) AS n FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status='active'
         JOIN classes c ON c.id = e.class_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status='active'
        WHERE s.status='active' AND s.archived_at IS NULL AND c.branch_id IN (${ph})
          AND COALESCE(pg.scoring_mode, '') != 'ratio'
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts a
                           WHERE a.cycle_id = cy.id AND a.status='planned')
        GROUP BY c.branch_id`,
    )
    .all(...ids) as any[]) {
    push('no_plan', r.branch_id, r.n, `${r.n} học viên chưa có tuần MT tiếp theo`,
         'manager', 'info', `/hoc-vien?view=no_plan&branchId=${r.branch_id}`);
  }

  // 2. Thiếu điểm — tự hết khi giáo viên nhập đủ. Lớp thường "có điểm" = có SỐ CÂU ĐÚNG (không bao giờ có band); FT giữ nguyên luật cũ.
  //    MT lịch sử (T34) không phải nợ điểm — nhắc riêng bằng dòng mờ ở Lịch Test.
  for (const r of conn
    .prepare(
      `SELECT c.branch_id, COUNT(*) AS n FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
         JOIN students s ON s.id = a.student_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.status != 'cancelled' AND s.archived_at IS NULL AND c.branch_id IN (${ph})
          AND a.planned_period_id IS NOT NULL AND rp.week_start <= ? AND ${LUOT_TINH_NO_SQL('a')}
          AND CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
                THEN (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.raw_score IS NOT NULL)
                     < (SELECT COUNT(*) FROM programme_skills ps WHERE ps.programme_code = c.programme_code)
                ELSE (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.band IS NOT NULL)
                     < (4 - (SELECT COUNT(*) FROM attempt_skill_skips k WHERE k.attempt_id = a.id))
              END
        GROUP BY c.branch_id`,
    )
    .all(...ids, today) as any[]) {
    push('missing_scores', r.branch_id, r.n, `${r.n} bài Test còn thiếu điểm`,
         'teacher', 'warn', `/hoc-vien?view=missing_scores&branchId=${r.branch_id}`);
  }

  // 3. Case SOS chưa xử lý xong — đếm CASE, không phải học viên.
  for (const r of conn
    .prepare(
      `SELECT c.branch_id, COUNT(*) AS n FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id
         JOIN classes c ON c.id = a.class_id
        WHERE sc.status != 'done' AND sc.sos_level > 0 AND c.branch_id IN (${ph})
        GROUP BY c.branch_id`,
    )
    .all(...ids) as any[]) {
    push('sos_open', r.branch_id, r.n, `${r.n} case SOS chưa xử lý xong`,
         'manager', 'danger', `/hoc-vien?view=sos_open&branchId=${r.branch_id}`);
  }

  // 4. Báo cáo tuần còn trống — chỉ nhắc khi cửa sổ cập nhật ĐANG MỞ.
  if (f.periodId) {
    const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(f.periodId) as any;
    if (period && reportEditWindow(period, today).open) {
      for (const r of conn
        .prepare(
          /* PR-Ra Q13: "đã báo cáo" nghĩa là ĐÃ NỘP — một ô còn nháp không được tính là đã hoàn thiện. */
          `SELECT ru.branch_id, COUNT(*) AS n FROM reporting_units ru
             LEFT JOIN unit_reports r ON r.reporting_unit_id = ru.id AND r.period_id = ? AND r.submitted_at IS NOT NULL
            WHERE ru.status='active' AND ru.branch_id IN (${ph}) AND r.id IS NULL
            GROUP BY ru.branch_id`,
        )
        .all(f.periodId, ...ids) as any[]) {
        push('report_due', r.branch_id, r.n, `Báo cáo tuần ${period.code} chưa hoàn thiện`,
             'manager', 'info', `/cong-viec/bao-cao?periodId=${f.periodId}`);
      }
    }
  }

  const order: Record<Signal['tone'], number> = { danger: 0, warn: 1, info: 2 };
  return out.sort((a, b) => order[a.tone] - order[b.tone] || b.count - a.count);
}
