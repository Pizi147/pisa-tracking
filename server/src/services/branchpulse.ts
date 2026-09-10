import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listCases } from './cases.ts';
import { listAttempts } from './attempts.ts';

/**
 * KHỐI RIÊNG CỦA QUẢN LÝ — "chi nhánh đang tắc ở đâu", và "ai đang tắc".
 *
 * Hai cách nhìn cùng một chuyện, và Quản lý cần cả hai vào những lúc khác nhau:
 *
 *   THEO LỚP    — trả lời câu hỏi mỗi sáng: lớp nào đang nặng, mở ra xem ngay.
 *   THEO NGƯỜI  — trả lời câu hỏi khi phải thúc: ai còn nợ gì.
 *
 * Bảng theo người CỐ TÌNH không có màu tốt/xấu và không xếp hạng. Một bảng "giáo viên nào
 * chậm nhất" là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào; nó biến một công cụ điều
 * phối thành một công cụ đánh giá, và giáo viên sẽ học cách làm đẹp số thay vì làm việc.
 */
export function branchPulse(p: Principal, f: { branchId?: number | null } = {}) {
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return null;
  const today = demoToday();

  const cases = listCases(p, { branchId: f.branchId ?? undefined }).rows.filter((c) => c.state !== 'done');
  const attempts = listAttempts(p, { branchId: f.branchId ?? undefined }).rows
    .filter((a: any) => a.status !== 'cancelled');

  /* ------------------------------------------------------------------ theo lớp */
  const classes = new Map<number, {
    id: number; code: string; branchName: string;
    needScores: number; noPlan: number; overdueReview: number; pendingApproval: number;
  }>();
  const touch = (id: number | null, code: string | null, branchName: string) => {
    if (!id) return null;
    if (!classes.has(id)) {
      classes.set(id, {
        id, code: code ?? `Lớp ${id}`, branchName,
        needScores: 0, noPlan: 0, overdueReview: 0, pendingApproval: 0,
      });
    }
    return classes.get(id)!;
  };
  for (const a of attempts as any[]) {
    const row = touch(a.classId ?? null, a.classCode ?? null, a.branchName ?? '');
    if (row && (a.pendingSkills?.length || a.myPendingDetail?.length)) {
      row.needScores += (a.pendingSkills?.length ?? a.myPendingDetail?.length ?? 0);
    }
  }
  for (const c of cases) {
    const row = touch(c.classId, c.classCode, '');
    if (!row) continue;
    if (c.state === 'no_plan') row.noPlan += 1;
    if (c.dueOverdue) row.overdueReview += 1;
  }
  for (const r of conn
    .prepare(
      `SELECT sc.id AS case_id, COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.approval_state = 'pending' GROUP BY sc.id`,
    )
    .all() as any[]) {
    const c = cases.find((x) => x.id === r.case_id);
    if (c?.classId && classes.has(c.classId)) classes.get(c.classId)!.pendingApproval += r.n;
  }

  /* ------------------------------------------------------------------ theo người */
  const people = new Map<number, {
    id: number; name: string; classCount: number;
    needScores: number; needResult: number; waitingOnMe: number;
  }>();
  const person = (id: number, name: string) => {
    if (!people.has(id)) {
      people.set(id, { id, name, classCount: 0, needScores: 0, needResult: 0, waitingOnMe: 0 });
    }
    return people.get(id)!;
  };
  const branchIds = [...new Set(cases.map((c) => c.branchId).filter(Boolean))] as number[];
  const scopeSql = f.branchId ? 'AND cl.branch_id = ?' : (branchIds.length
    ? `AND cl.branch_id IN (${branchIds.map(() => '?').join(',')})` : 'AND 1=0');
  const scopeArgs = f.branchId ? [f.branchId] : branchIds;
  for (const r of conn
    .prepare(
      `SELECT u.id, u.full_name, COUNT(DISTINCT ta.class_id) n
         FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id
         JOIN classes cl ON cl.id = ta.class_id
        WHERE ta.status = 'active' AND u.status = 'active' ${scopeSql}
        GROUP BY u.id ORDER BY u.full_name`,
    )
    .all(...scopeArgs) as any[]) {
    person(r.id, r.full_name).classCount = r.n;
  }
  /* Ô điểm quá hạn, quy về NGƯỜI ĐƯỢC PHÂN CÔNG kỹ năng đó ở lớp đó. */
  for (const r of conn
    .prepare(
      `SELECT ta.user_id, COUNT(*) n
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.status = 'active'
         JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = ta.skill AND s.band IS NULL
        WHERE a.status != 'cancelled' AND ta.skill IS NOT NULL ${scopeSql}
        GROUP BY ta.user_id`,
    )
    .all(...scopeArgs) as any[]) {
    if (people.has(r.user_id)) people.get(r.user_id)!.needScores = r.n;
  }
  /* Phương án đã tới hẹn xem lại mà người thực hiện chưa cập nhật. */
  for (const r of conn
    .prepare(
      `SELECT COALESCE(iv.performer_user_id, iv.recorded_by) AS uid, COUNT(*) n
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
         LEFT JOIN classes cl ON cl.id = e.class_id
        WHERE iv.followup_due IS NOT NULL AND iv.followup_due <= ? AND iv.status != 'cancelled'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND NOT EXISTS (SELECT 1 FROM case_followups fu WHERE fu.intervention_id = iv.id)
          ${scopeSql}
        GROUP BY uid`,
    )
    .all(today, ...scopeArgs) as any[]) {
    if (r.uid && people.has(r.uid)) people.get(r.uid)!.needResult = r.n;
  }
  /* Đề xuất của họ đang chờ CHÍNH NGƯỜI ĐANG XEM trả lời. */
  for (const r of conn
    .prepare(
      `SELECT iv.recorded_by AS uid, COUNT(*) n FROM case_interventions iv
        WHERE iv.approval_state = 'pending' GROUP BY uid`,
    )
    .all() as any[]) {
    if (r.uid && people.has(r.uid) && can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) {
      people.get(r.uid)!.waitingOnMe = r.n;
    }
  }

  const classRows = [...classes.values()]
    .map((c) => ({ ...c, total: c.needScores + c.noPlan + c.overdueReview + c.pendingApproval }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const peopleRows = [...people.values()]
    .map((x) => ({ ...x, total: x.needScores + x.needResult + x.waitingOnMe }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return { classes: classRows, people: peopleRows };
}
