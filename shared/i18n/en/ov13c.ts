/** OV-13c — chữ MỚI của Xác nhận PA cùng lúc + Nhập điểm theo tuần thi (Công việc). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const em = (n: unknown) => `${n} ${Number(n) === 1 ? 'student' : 'students'}`;

export const EN_OV13C = {
  'Xác nhận PA cùng lúc': 'Confirm PAs together',
  'Xác nhận PA · {n} em': (b) => `Confirm PA · ${em(b.n)}`,
  'Thử lại · {n} em': (b) => `Retry · ${em(b.n)}`,
  'Đã xác nhận {n} em': (b) => `Confirmed ${em(b.n)}`,
  'quy chế SOS {sos}': 'SOS {sos} rule',
  'Nội dung / hướng dẫn': 'Content / guidance',
  'Ghi nội dung / hướng dẫn': 'Enter content / guidance',
  'Nội dung cần ít nhất {n} ký tự': 'Content needs at least {n} characters',
  'Em đã có người dạy giữ nguyên': 'Students who already have a teacher keep theirs',
  'bỏ tick': 'unticked',
  'Như ô chung': 'Same as shared field',
  'Nội dung riêng': 'Own content',
  'Trống = nội dung chung': 'Empty = shared content',
  'Đề xuất PA khác cho em này…': 'Propose another PA for this student…',
  'Nhập điểm · {tuan}': 'Enter scores · {tuan}',
  'Chọn từ 1 đến {n} PA để xác nhận.': 'Select 1 to {n} PAs to confirm.',
  'Chọn từ 1 đến {n} PA để hoàn tác.': 'Select 1 to {n} PAs to undo.',   // HOAN-TAC-XN
  'Ngày bắt đầu chỉ được lùi tối đa 7 ngày, tới tối đa 30 ngày.': 'Start date can be at most 7 days back and 30 days ahead.',
  'Đang xác nhận {n}/{m} em': 'Confirming {n}/{m} students',
  'Chọn người dạy': 'Choose a teacher',
  'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.': 'The server is busy, nothing was saved. Try again in a few minutes.',
  'Mã PA không hợp lệ.': 'Invalid PA id.',
  'Không xác nhận được.': 'Could not confirm.',
} satisfies Record<string, Dich>;
