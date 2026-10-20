import { db } from '../db.ts';
import { CASE_CATEGORY_SKILL } from '../../../shared/domain/index.ts';

/**
 * GỢI Ý NGƯỜI PHỤ TRÁCH CHÍNH cho một Case mới (mục 2.3).
 *
 * Quy tắc do owner chốt, và cố ý rất hẹp:
 *   · giáo viên ĐANG DẠY ĐÚNG KỸ NĂNG đó ở lớp của em; chưa phân công ai thì giáo viên chủ nhiệm
 *   (Ý thức không còn Case nên không còn người phụ trách Case Ý thức — 21/09/2026.)
 *
 * KHÔNG suy ra từ "mọi giáo viên dạy lớp đó". Một lớp có năm giáo viên, gán cả năm người
 * làm người phụ trách nghĩa là năm người cùng nợ một việc — và cuối cùng không ai làm.
 *
 * Không tìm được ai thì trả về NULL, và màn hình nói thẳng "chưa có người phụ trách" kèm
 * đường phân công. Thà nói thật là chưa ai nhận, còn hơn gán bừa một cái tên rồi người đó
 * không biết mình đang giữ việc gì.
 */
export function suggestCaseOwner(input: {
  classId: number | null; category: string | null;
}): number | null {
  if (!input.classId) return null;
  const conn = db();
  const core = () =>
    (conn
      .prepare(
        `SELECT user_id FROM teacher_assignments
          WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`,
      )
      .get(input.classId) as any)?.user_id ?? null;

  const skill = CASE_CATEGORY_SKILL[input.category as keyof typeof CASE_CATEGORY_SKILL] ?? null;
  if (!skill) return core();
  const bySkill = conn
    .prepare(
      `SELECT user_id FROM teacher_assignments
        WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`,
    )
    .get(input.classId, skill) as any;
  /* Chưa phân công ai dạy kỹ năng đó thì về GVCN — vẫn là một người cụ thể, không phải cả lớp. */
  return bySkill?.user_id ?? core();
}

/**
 * CV-LOI (02 mục 4.7 A13, X-63): Case còn mở mà CHƯA có người phụ trách → gán theo đúng luật lúc tạo Case (`suggestCaseOwner`: GV môn → GVCN).
 * Gọi trong giao dịch ghi phân công (`ghiPhanCong`) và ở migrate ghi bù dữ liệu cũ. Mỗi lần gán một dòng `sos_case_history` (null → người;
 * `actorId` null = hệ thống). Lớp vẫn chưa có ai (không GV môn, không GVCN) thì Case để trống — Công việc của QL hiện "Phân công GV {môn}".
 * Trả số Case đã gán.
 */
export function ganChuCaseThieu(o: { classId?: number; actorId: number | null; luc: string }): number {
  const conn = db();
  const rows = conn.prepare(
    `SELECT sc.id, sc.category, COALESCE(a.class_id, cur.class_id) AS class_id
       FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN enrollments cur ON cur.student_id = COALESCE(sc.student_id, a.student_id) AND cur.status = 'active'
      WHERE sc.status != 'done' AND sc.owner_user_id IS NULL AND (? IS NULL OR COALESCE(a.class_id, cur.class_id) = ?)`,
  ).all(o.classId ?? null, o.classId ?? null) as any[];
  let n = 0;
  for (const r of rows) {
    const chu = suggestCaseOwner({ classId: r.class_id ?? null, category: r.category ?? null });
    if (chu === null) continue;
    conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ? AND owner_user_id IS NULL').run(chu, r.id);
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'owner_user_id', NULL, ?, ?, ?)`)
      .run(r.id, String(chu), o.actorId, o.luc);
    n += 1;
  }
  return n;
}
