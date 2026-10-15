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
  'Sửa riêng': 'Edit individually',
  'Như ô chung': 'Same as shared field',
  'Nội dung riêng': 'Own content',
  'Trống = nội dung chung': 'Empty = shared content',
  'Đề xuất PA khác cho em này…': 'Propose another PA for this student…',
  'Nhập điểm · {tuan}': 'Enter scores · {tuan}',
  '{n} lớp': (b) => `${b.n} ${Number(b.n) === 1 ? 'class' : 'classes'}`,
} satisfies Record<string, Dich>;
