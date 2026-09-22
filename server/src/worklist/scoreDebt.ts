import { db } from '../db.ts';
import { REGULAR_SKILLS } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { settleNoShows } from '../fasttrack/absence.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';

/**
 * Ô ĐIỂM CÒN NỢ — một ô = một kỹ năng một lượt, tuần thi đã bắt đầu, người được phân công chưa nhập (S12 + đặc tả §6).
 *
 * KHÔNG tự đếm. Đi qua ĐÚNG hàm mà bảng chấm dùng để vẽ ô: `skillCells` (FT — band, dấu "-", cặp W1/W2) và `regularSkillViews`
 * (lớp thường — số câu đúng, hạn Chủ nhật tuần thi của CHÍNH môn đó). Trước đây bảng chi nhánh tự viết một câu SQL "ước lượng thô":
 * lớp thường không bao giờ có `band` nên mọi môn treo mãi, hạn tính kiểu FT, và ô "-" bị loại mà không xét cặp W1/W2.
 *
 * `branchIds = null` là không lọc; `[]` là phạm vi rỗng → rỗng (hợp đồng số liệu, luật 3).
 */
export type DebtCell = { attemptId: number; classId: number; skill: string; userId: number; overdue: boolean };

/** Tiến độ KHÔNG phải nợ điểm: vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, đang chờ Quản lý duyệt dời. */
const NOT_DEBT = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending']);

export function scoreDebtCells(p: Principal, today: string, branchIds: number[] | null): DebtCell[] {
  if (Array.isArray(branchIds) && branchIds.length === 0) return [];
  /* Chốt "không dự thi" trước khi đọc — cùng khuôn với `classScoreSheet`; hàm idempotent. */
  settleNoShows(today);
  const conn = db();
  const where = [`a.status != 'cancelled'`, `cl.status = 'active'`];
  const args: unknown[] = [];
  if (branchIds) { where.push(`cl.branch_id IN (${branchIds.map(() => '?').join(',')})`); args.push(...branchIds); }
  const rows = conn
    .prepare(
      `SELECT a.*, pg.scoring_mode, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where.join(' AND ')}
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start <= ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start <= ?))`,
    )
    .all(...args, today, today) as any[];
  if (!rows.length) return [];

  const teacherOf = new Map<string, number>();
  for (const r of conn
    .prepare(`SELECT class_id, skill, user_id FROM teacher_assignments WHERE status = 'active' AND skill IS NOT NULL ORDER BY id`)
    .all() as any[]) {
    const k = `${r.class_id}|${r.skill}`;
    if (!teacherOf.has(k)) teacherOf.set(k, r.user_id);
  }

  const bundle = loadBundle(rows.map((r) => r.id));
  const out: DebtCell[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const skillRows = bundle.skillRows.get(a.id);
    if (scoringModeOf(a) === 'ratio') {
      const views = regularSkillViews(a, skillRows, scores, today);
      for (const skill of REGULAR_SKILLS) {
        const v = views.get(skill);
        if (!v || !v.required || v.scored || !v.weekStart || v.weekStart > today || NOT_DEBT.has(v.progress)) continue;
        const userId = teacherOf.get(`${a.class_id}|${skill}`);
        if (userId) out.push({ attemptId: a.id, classId: a.class_id, skill, userId, overdue: v.overdue });
      }
    } else {
      for (const c of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], today, skillRows)) {
        if (!c.required || c.band !== null || c.noShow !== null || !c.weekStart || c.weekStart > today || NOT_DEBT.has(c.progress)) continue;
        const userId = teacherOf.get(`${a.class_id}|${c.skill}`);
        if (userId) out.push({ attemptId: a.id, classId: a.class_id, skill: c.skill, userId, overdue: c.overdue });
      }
    }
  }
  return out;
}
