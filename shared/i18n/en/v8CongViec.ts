/** V8-CV (chủ SP duyệt mockup `thiet-ke/v8/cong-viec-ql.html` #688, 29/10): Công việc QL — Chờ bạn duyệt trong cột trái, panel duyệt bên phải. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_V8_CONG_VIEC = {
  'Một GV': 'One teacher',
  'Mọi khung': 'All tracks',
  'Đánh dấu ô ở dòng để duyệt nhiều yêu cầu cùng loại một lần.': 'Tick rows to approve several requests of the same type at once.',
  'Chọn một việc hoặc yêu cầu ở danh sách.': 'Pick a task or request from the list.',
  'Làm tại đây, không đổi trang.': 'Work here without leaving the page.',
  'Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại.': 'Connection lost, nothing saved. Check the network and try again.',
  '{n} yêu cầu ở chi nhánh khác': (b) => `${so(b.n, 'request', 'requests')} in other branches`,
  'Xem ›': 'View ›',
  'Xem thêm {n} yêu cầu': (b) => `See ${so(b.n, 'more request', 'more requests')}`,
  'Mở hộp duyệt ›': 'Open approval inbox ›',
  'Yêu cầu tiếp ›': 'Next request ›',
  'Yêu cầu vừa mở không còn trong danh sách này — có thể đã được xử lý hoặc tự đóng.': 'This request is no longer in the list — it may have been handled or closed automatically.',
  'Xem ở Đã xử lý': 'View in Handled',
  'Yêu cầu chờ duyệt': 'Requests awaiting approval',
  '{ai} gửi': 'sent by {ai}',
  'Mở ›': 'Open ›',
} satisfies Record<string, Dich>;
