/** OV-12e — chữ MỚI của hệ panel v3 (chân trạng thái lưu, panel số liệu mở rộng dòng, Quyết định 3 nút). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV12E = {
  'Chưa lưu được': 'Not saved',
  'Huỷ sửa': 'Discard changes',
  'Chưa lưu': 'Unsaved',
  'Danh sách': 'List',
  'Đã xác nhận': 'Confirmed',
  'Đã xác nhận PA · {ten}': 'Plan confirmed · {ten}',
  'Xác nhận PA': 'Confirm plan',
  'Sửa PA': 'Edit plan',
  'Xem hồ sơ': 'View profile',
  'Mở trang': 'Open page',
  '{n} quá hạn': '{n} overdue',
  'quá hạn lên đầu': 'overdue first',
} satisfies Record<string, Dich>;
