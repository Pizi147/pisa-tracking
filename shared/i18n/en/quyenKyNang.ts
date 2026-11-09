/** QUYEN-KY-NANG + GIAO-VIEC-CN (chủ SP 10/11, plan.md B' 7 + 9) — chữ web + câu lỗi máy chủ. */
import type { Dich } from '../en.ts';

export const EN_QUYEN_KY_NANG = {
  'Đã lưu kỹ năng': 'Skills saved',
  'Quản lý hoặc Quản trị hệ thống sửa.': 'Edited by a manager or the system admin.',
  'Kỹ năng do Quản lý hoặc Quản trị hệ thống sửa.': 'Skills are edited by a manager or the system admin.',
  'Chỉ Quản lý chi nhánh của giáo viên hoặc Quản trị hệ thống sửa được kỹ năng.': 'Only a manager of the teacher\'s branch or the system admin can edit skills.',
  '{label} phải có vai ở chi nhánh của công việc — chọn lại người.': '{label} must have a role in the task\'s branch — choose someone else.',
} satisfies Record<string, Dich>;
