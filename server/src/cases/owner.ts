import { db } from '../db.ts';
import { CASE_CATEGORY_SKILL } from '../../../shared/domain/index.ts';

/**
 * GỢI Ý NGƯỜI PHỤ TRÁCH CHÍNH cho một case mới (mục 2.3).
 *
 * Quy tắc do owner chốt, và cố ý rất hẹp:
 *   · giáo viên ĐANG DẠY ĐÚNG KỸ NĂNG đó ở lớp của em; chưa phân công ai thì giáo viên chủ nhiệm
 *   (Ý thức không còn case nên không còn người phụ trách case Ý thức — 21/09/2026.)
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
