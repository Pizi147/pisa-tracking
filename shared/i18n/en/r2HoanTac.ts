/** R2 (rà 24/11) — Hoàn tác các chỗ chặn cứng. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R2_HOAN_TAC = {
  'Đã thêm {n} học viên': 'Added {n} students',
  'Bỏ {ok} học viên, lỗi {loi}: {ly}': 'Removed {ok} students, {loi} failed: {ly}',
  'Đã bỏ {n} học viên vừa thêm': 'Removed {n} just-added students',
  'Không còn lô thêm học viên này.': 'This batch of added students is no longer available.',
  'Đã quá {n} phút — xoá từng em ở danh sách học viên.': 'More than {n} minutes have passed — delete students one by one from the student list.',
  'Thiếu lô cần hoàn tác.': 'Missing the batch to undo.',
  '{x} của {nhan} đã huỷ phần thi — mở lại {x} rồi khôi phục kết quả?': '{x} of {nhan} was cancelled — reopen {x} and restore the result?',
  'Mở lại và khôi phục': 'Reopen and restore',
  'Chỉ người ghi, Head tutor hoặc Head chi nhánh của tutor sửa được nhận xét này.': 'Only the author, the tutor Head or the branch Head of the tutor can edit this comment.',
  'Chỉ người ghi xoá được nhận xét này.': 'Only the author can delete this comment.',
  'Chỉ Head tutor hoặc Quản trị khôi phục được.': 'Only the tutor Head or Admin can restore this.',
  'Chỉ người ghi khôi phục được nhận xét này.': 'Only the author can restore this comment.',
  'Chỉ người giao hoặc Head của chi nhánh khôi phục được việc này.': 'Only the assigner or the branch Head can restore this task.',
  'Chỉ người giao hoặc Head của chi nhánh xoá được việc này.': 'Only the assigner or the branch Head can delete this task.',
  'Việc đã có cập nhật — dùng Dừng hẳn.': 'The task has updates — use Stop for good.',
  'Việc có việc con / việc lặp — xoá việc con trước, hoặc Dừng hẳn.': 'The task has sub-tasks / recurrences — delete them first, or Stop for good.',
  'Việc đã sinh PA cho học viên — dùng Dừng hẳn.': 'The task created a plan for a student — use Stop for good.',
  'Đã xoá việc': 'Task deleted',
  'Xoá việc': 'Delete task',
} satisfies Record<string, Dich>;
