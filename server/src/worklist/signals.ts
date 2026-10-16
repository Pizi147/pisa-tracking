import { db, theoLo } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { bangLop, require_, scopeFor, type Principal } from '../permissions.ts';
import { reportEditWindow } from '../platform/week.ts';
import { metricSet } from './metrics.ts';
import { lopCuaTap } from './chuongTrinh.ts';
import { listCases } from '../cases/cases.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

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
  kind: 'no_plan' | 'missing_scores' | 'sos_open' | 'pa_can_cap_nhat' | 'report_due';
  label: string;
  count: number;
  /** Vai trò nào cần xử lý — để mỗi người thấy đúng việc của mình. */
  owner: 'manager' | 'teacher';
  tone: 'danger' | 'warn' | 'info';
  branchId: number | null;
  branchName: string | null;
  /** Đường dẫn mở đúng những bản ghi tạo nên con số này. */
  href: string;
  /**
   * PR-UXF-a K1-37 (Q12): tín hiệu lấy số từ SỔ CHỈ SỐ — web mở danh sách bằng chính chỉ số này (`/metrics/:id?branchId=`), nên
   * `count` = số dòng mở ra. null = tín hiệu riêng của trang (chưa có tuần MT, báo cáo tuần), mở bằng `href`.
   */
  metricId: string | null;
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
    label: string, owner: Signal['owner'], tone: Signal['tone'], href: string, metricId: string | null = null,
  ) => {
    if (count > 0) {
      out.push({
        key: `${kind}:branch:${branchId}`, kind, label, count, owner, tone,
        branchId, branchName: nameOf.get(branchId) ?? null, href, metricId,
      });
    }
  };
  /*
   * PR-UXF-a K1-37 (Q12): (b), (c) đọc sổ chỉ số — một cửa, cùng tập với ô Cần xử lý ở Tổng quan; không SQL đếm riêng.
   * PR-S6F-b: `metricSet` MỘT lần cho cả phạm vi (không một lần mỗi chi nhánh — N+1), rồi chia theo ĐÚNG chi nhánh mà bộ lọc `branchId`
   * của chỉ số dùng (số mỗi chi nhánh = `metricSet({ branchId })` — phép kiểm hai đường):
   *   Case / PA → `homeBranchId` của `listCases` (= `COALESCE(lớp hiện tại, lớp của lượt)`, biểu thức lọc của `listCases`; trong request dùng
   *   chung bộ nhớ với lần `listCases` của chính `metricSet`) · bài → chi nhánh của lớp (`overdueScoreBai` lọc theo lớp).
   */
  let nhaCase: Map<number, number | null> | null = null;
  const chiNhanhCua = (unit: string, ids: number[]): Map<number, number | null> => {
    if (unit === 'case' || unit === 'phuong-an') {
      nhaCase ??= new Map(listCases(p, {}).rows.map((c) => [c.id as number, (c.homeBranchId ?? null) as number | null]));
      if (unit === 'case') return new Map(ids.map((id) => [id, nhaCase!.get(id) ?? null]));
      const out = new Map<number, number | null>();
      theoLo(ids, (lo, ph) => {
        for (const r of conn.prepare(`SELECT id, case_id FROM case_interventions WHERE id IN (${ph})`).all(...lo) as any[]) out.set(r.id, nhaCase!.get(r.case_id) ?? null);
      });
      return out;
    }
    const lop = lopCuaTap(unit as any, ids);
    const bl = bangLop();
    return new Map(ids.map((id) => [id, bl.get(lop.get(id)?.classId ?? -1)?.branchId ?? null]));
  };
  const tuSo = (kind: Signal['kind'], metricId: string, owner: Signal['owner'], tone: Signal['tone'], nhan: (n: number) => string) => {
    const r = metricSet(p, metricId, f.branchId ? { branchId: f.branchId } : {});
    const dem = new Map<number, number>();
    for (const b of chiNhanhCua(r.unit, r.ids).values()) if (b != null) dem.set(b, (dem.get(b) ?? 0) + 1);
    for (const b of branches) {
      const n = dem.get(b.id) ?? 0;
      push(kind, b.id, n, nhan(n), owner, tone, `/metrics/${metricId}?branchId=${b.id}`, metricId);
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
        WHERE ${HV_DANG_HOC_SQL('s')} AND c.branch_id IN (${ph})
          AND COALESCE(pg.scoring_mode, '') != 'ratio'
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts a
                           WHERE a.cycle_id = cy.id AND a.status='planned')
        GROUP BY c.branch_id`,
    )
    .all(...ids) as any[]) {
    push('no_plan', r.branch_id, r.n, `${r.n} học viên chưa có tuần MT tiếp theo`,
         'manager', 'info', `/hoc-vien?view=no_plan&branchId=${r.branch_id}`);
  }

  // 2. Bài chưa nhập điểm quá hạn — đơn vị BÀI (ô điểm), tự hết khi giáo viên nhập. MT lịch sử, em Tạm dừng không phải nợ (sổ chỉ số).
  tuSo('missing_scores', 'bai-qua-han-nhap-diem', 'teacher', 'warn', (n) => `${n} bài quá hạn chưa nhập điểm`);

  // 3. Case / PA quá hạn — đếm CASE và PA (hai đơn vị, hai dòng), không học viên.
  tuSo('sos_open', 'case-xac-dinh-nguyen-nhan-qua-han', 'teacher', 'danger', (n) => `${n} Case chưa chốt PA quá hạn`);   // OV-12d: cùng ⚠ cột Chờ duyệt Tổng hợp
  tuSo('pa_can_cap_nhat', 'pa-can-cap-nhat', 'teacher', 'warn', (n) => `${n} PA cần cập nhật kết quả`);

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
