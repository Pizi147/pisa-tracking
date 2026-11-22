/** NHẸ HƠN PR-6 (mockup `thiet-ke/v23/thang-y-thuc.html`) — thanh bước thang Ý thức, Phối hợp SOS N58. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_NHE_HON_Y_THUC = {
  'xác nhận {ngay}{x}': 'confirmed {ngay}{x}',
  'khai': 'declared',
  'xác nhận từ trước': 'confirmed earlier',
  'Thang xử lý vi phạm: {a}, kế tiếp {b}': 'Incident ladder: {a}, next {b}',
  'đang ở {x}': 'at {x}',
  'chưa xử lý lần nào': 'never actioned',
  'Tên đầy đủ các bậc': 'Full step names',
  'Xác nhận xử lý: lưu ngay bậc kế tiếp. WL 3, phương án khác: qua Đề xuất Head duyệt.': 'Confirm action: saves the next step now. WL 3 and other options: via Propose to Head.',
  'Các lần xử lý': 'Actions taken',
  '{n} lần · mới nhất {ngay} {nhan}': '{n} times · latest {ngay} {nhan}',
  '{n} vi phạm chưa xử lý': '{n} incidents not actioned',
  'Chờ:': 'Waiting:',
  'GVCN · chưa xác nhận': 'Homeroom · not confirmed',
  'Tiến độ: đã xong {a}; chờ {b}': 'Progress: done {a}; waiting {b}',
  'đã xếp lịch': 'scheduled',
  'chờ {ds}': 'waiting on {ds}',
  'đã xử lý': 'actioned',
} satisfies Record<string, Dich>;
