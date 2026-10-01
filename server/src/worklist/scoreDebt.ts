import { db } from '../db.ts';
import { LUOT_TINH_NO_SQL, boMonLich } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { settleNoShows } from '../fasttrack/absence.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { allProgrammes } from '../normal/regular.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

/**
 * Ô ĐIỂM CÒN NỢ — một ô = một kỹ năng một lượt, tuần thi đã bắt đầu, người được phân công chưa nhập (S12 + đặc tả §6).
 *
 * KHÔNG tự đếm. Đi qua ĐÚNG hàm mà bảng chấm dùng để vẽ ô: `skillCells` (FT — band, dấu "-", cặp W1/W2) và `regularSkillViews`
 * (lớp thường — số câu đúng, hạn Chủ nhật tuần thi của CHÍNH môn đó). Trước đây bảng chi nhánh tự viết một câu SQL "ước lượng thô":
 * lớp thường không bao giờ có `band` nên mọi môn treo mãi, hạn tính kiểu FT, và ô "-" bị loại mà không xét cặp W1/W2.
 *
 * `branchIds = null` là không lọc; `[]` là phạm vi rỗng → rỗng (hợp đồng số liệu, luật 3).
 */
/** `userId` null = môn CHƯA PHÂN CÔNG giáo viên — vẫn là nợ (PR-UXF-a Q8: không giấu nợ; bảng Theo giáo viên có hàng "Chưa phân công"). */
export type DebtCell = { attemptId: number; classId: number; skill: string; userId: number | null; overdue: boolean;
  /** PR-VAI-a (Q24): hạn nhập của ô — cột Hạn "quá hạn a–b ngày" ở Cần xử lý đọc từ chính tập này. */
  han: string | null };

/** Tiến độ KHÔNG phải nợ điểm: vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, đang chờ Quản lý duyệt dời, MT lịch sử (T34). */
const NOT_DEBT = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending', 'lich_su']);

export function scoreDebtCells(p: Principal, today: string, branchIds: number[] | null): DebtCell[] {
  if (Array.isArray(branchIds) && branchIds.length === 0) return [];
  /* Chốt "không dự thi" trước khi đọc — cùng khuôn với `classScoreSheet`; hàm idempotent. */
  settleNoShows(today);
  const conn = db();
  /* PR-MT (M3, K4-01): MT lịch sử không bao giờ là nợ — bỏ từ câu SQL (phủ Theo giáo viên, bai-qua-han-nhap-diem, Tổng quan). */
  /* PR-UXF-a T65 → PR-S6F-a Q2: em không đang học (Tạm dừng, Kết thúc học, lưu trữ) không sinh nợ điểm. Hồ sơ HV vẫn hiện ô (đường riêng). */
  const where = [`a.status != 'cancelled'`, `cl.status = 'active'`, HV_DANG_HOC_SQL('s'), LUOT_TINH_NO_SQL('a')];
  const args: unknown[] = [];
  if (branchIds) { where.push(`cl.branch_id IN (${branchIds.map(() => '?').join(',')})`); args.push(...branchIds); }
  const rows = conn
    .prepare(
      `SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where.join(' AND ')}
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start <= ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start <= ?))
          /*
           * LỌC TRƯỚC, CHỈ BỎ LƯỢT CHẮC CHẮN KHÔNG NỢ: mọi ô của bộ kỹ năng đã có điểm (lớp thường: số câu đúng ở mọi môn của chương
           * trình — bảng programme_skills, Pre FOU một ô (K5-39); FT: band ở
           * L R W1 W2 S). Không có dòng này thì mọi lượt đã chấm xong từ đầu khoá đều bị nạp lại mỗi lần mở bảng chi nhánh (Turso).
           * Luật "còn nợ" vẫn nằm ở \`skillCells\`/\`regularSkillViews\` bên dưới — đây chỉ là tập cha an toàn.
           */
          AND (SELECT COUNT(*) FROM assessment_scores sx
                WHERE sx.attempt_id = a.id
                  AND CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
                        THEN sx.raw_score IS NOT NULL
                             AND sx.skill IN (SELECT ps.skill FROM programme_skills ps WHERE ps.programme_code = cl.programme_code)
                        ELSE sx.band IS NOT NULL AND sx.skill IN ('listening', 'reading', 'writing1', 'writing2', 'speaking')
                      END)
              < CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
                  THEN (SELECT COUNT(*) FROM programme_skills ps2 WHERE ps2.programme_code = cl.programme_code) ELSE 5 END`,
    )
    .all(...args, today, today) as any[];
  if (!rows.length) return [];

  /* PR-UXF-a: phân công ĐANG HIỆU LỰC (như `lopCuaGv`) — GV hết hiệu lực không còn bị gán bài. */
  const teacherOf = new Map<string, number>();
  for (const r of conn
    .prepare(`SELECT class_id, skill, user_id FROM teacher_assignments
               WHERE status = 'active' AND skill IS NOT NULL AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id`)
    .all(today, today) as any[]) {
    const k = `${r.class_id}|${r.skill}`;
    if (!teacherOf.has(k)) teacherOf.set(k, r.user_id);
  }

  const bundle = loadBundle(rows.map((r) => r.id));
  const programmes = allProgrammes();          // một lần cho cả bảng, không mỗi lượt một câu
  const out: DebtCell[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const skillRows = bundle.skillRows.get(a.id);
    if (scoringModeOf(a) === 'ratio') {
      const bo = boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills);
      const views = regularSkillViews(a, skillRows, scores, today, bo);
      for (const skill of bo) {
        const v = views.get(skill);
        if (!v || !v.required || v.scored || !v.weekStart || v.weekStart > today || NOT_DEBT.has(v.progress)) continue;
        out.push({ attemptId: a.id, classId: a.class_id, skill, userId: teacherOf.get(`${a.class_id}|${skill}`) ?? null, overdue: v.overdue, han: v.deadline ?? null });
      }
    } else {
      /* Không truyền `hoanTat` (R11) có chủ ý: nợ điểm đọc band/noShow/lịch, không đọc canEdit/khoa — đỡ 3 câu SQL. */
      for (const c of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], today, skillRows)) {
        if (!c.required || c.band !== null || c.noShow !== null || !c.weekStart || c.weekStart > today || NOT_DEBT.has(c.progress)) continue;
        out.push({ attemptId: a.id, classId: a.class_id, skill: c.skill, userId: teacherOf.get(`${a.class_id}|${c.skill}`) ?? null, overdue: c.overdue, han: c.deadline ?? null });
      }
    }
  }
  return out;
}
