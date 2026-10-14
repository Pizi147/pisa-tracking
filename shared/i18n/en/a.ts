/** PR-EN đợt a — khung chung, đăng nhập, thanh trên, menu Tài khoản, Hồ sơ cá nhân, câu lỗi hạ tầng. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_A = {
  'Lưu': 'Save',
  'quá hạn {n} ngày': (b) => `${soNhieu(b.n, 'day', 'days')} overdue`,
  'Ngôn ngữ': 'Language',
  'Đang sửa dở — đổi ngôn ngữ sẽ tải lại trang và mất phần chưa lưu. Vẫn đổi?': 'You have unsaved changes — switching language reloads the page and loses them. Switch anyway?',

  /* Câu lỗi hạ tầng (máy chủ gửi khoá = chữ Việt) */
  'Có lỗi · mã {ma}. Thử lại sau ít phút; nếu vẫn lỗi, báo Quản trị hệ thống kèm mã này.': 'Error · code {ma}. Try again in a few minutes; if it persists, send this code to the system admin.',
  'Dữ liệu gửi lên không đọc được. Tải lại trang rồi thử lại.': 'The data sent could not be read. Reload the page and try again.',
  'Dữ liệu gửi lên quá lớn.': 'The data sent is too large.',
  'Dữ liệu bị trùng hoặc vi phạm ràng buộc.': 'Duplicate data or a rule was broken.',
  'Không tìm thấy endpoint.': 'Endpoint not found.',
  'Mất kết nối máy chủ — kiểm tra mạng rồi thử lại.': 'Cannot reach the server — check your network and try again.',
  'Ngôn ngữ không hợp lệ.': 'Invalid language.',
  '{ten}: Tối đa {toiDa} ký tự (đang có {n}).': '{ten}: max {toiDa} characters (now {n}).',
  'Lỗi {status}': 'Error {status}',
  'Không gọi được máy chủ.': 'Cannot reach the server.',
} satisfies Record<string, Dich>;
