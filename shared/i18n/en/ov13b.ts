/** OV-13b — chữ MỚI: ghi kết quả gọn, Case gọn, Xác nhận PA panel, Đề xuất PA khác, "Việc tiếp ›". Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV13B = {
  'Chờ duyệt đổi PA': 'Awaiting PA change approval',
  'Lý do đổi PA cần ít nhất {n} ký tự.': 'Reason for changing the PA needs at least {n} characters.',
  'Đổi PA': 'PA changed',
  'Đã kết thúc · Đổi PA': 'Ended · PA changed',
  '{n} việc quá hạn': '{n} overdue tasks',
  'Việc đã quá hạn (xác nhận, kết quả, xử lý vi phạm)': 'Overdue tasks (confirmations, results, incidents)',
  '{n} việc': '{n} tasks',
} satisfies Record<string, Dich>;
