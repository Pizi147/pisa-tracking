/**
 * Hướng dẫn Head tutor — HD-V2 (c). AN-TUTOR (chủ SP 22/10): trang Tutor ẩn khỏi web — chỉ còn Tổng quan, Hồ sơ cá nhân, Hướng dẫn (không Học viên & Lớp, Test, Công việc).
 * UI-TONG-QUAN (chủ SP 23/10): Tổng quan tạm dùng góc nhìn GV. `lam` là MỘT nguồn (xem `ql.ts`).
 */
import { mucGv } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

export const HD_HT: HuongDan = {
  viec: [],
  lam: [
    {
      id: 'xem-tong-quan', ten: 'Xem trang đầu', nhom: 'khac',
      loiChinh: { man: 'tong-quan', chu: 'Tổng quan', duong: '/' },
      buoc: ['Mở <b>Tổng quan</b>: Case đang xử lý của bạn.', 'Khối lớp chỉ hiện khi bạn có lớp dạy; trang Tutor tạm ẩn, dữ liệu tutor vẫn giữ nguyên.'],
      tuKhac: ['tutor', 'case', 'trang đầu', 'home'],
    },
    {
      id: 'sua-ho-so', ten: 'Sửa hồ sơ cá nhân', nhom: 'khac',
      loiChinh: { man: 'ho-so-ca-nhan', chu: 'Tài khoản › Hồ sơ cá nhân', duong: '/ho-so-ca-nhan', chi: { hd: 'tai-khoan', chu: 'Bấm tên bạn › <b>Hồ sơ cá nhân</b>.' } },
      buoc: ['Bấm tên bạn › <b>Hồ sơ cá nhân</b>.', 'Đổi họ tên, điện thoại, mật khẩu.', 'Ngôn ngữ: menu Tài khoản › <b>VI | EN</b>. Giao diện: <b>Theo máy · Sáng · Tối</b> ở cùng menu.'],
      tuKhac: ['mật khẩu', 'họ tên', 'điện thoại', 'password', 'profile'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-tong-quan'] },
    { nhip: 'Khi có', viec: ['sua-ho-so'] },
  ],
  vaiKhac: [
    { ten: 'Nhập điểm, xử lý Case', cua: 'việc của GV', tuKhac: ['điểm', 'case', 'score'] },
    { ten: 'Duyệt yêu cầu', cua: 'việc của QL', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Tạo, sửa, xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Trang đầu tạm dùng góc nhìn GV: Case đang xử lý của bạn.' },
      khongLam: [{ ten: 'Nhập điểm, xử lý Case', cua: 'việc của GV' }],
      muc: [],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.', truoc: { chu: 'Tổng quan', duong: '/' } },
      muc: [mucGv('ho-so-ca-nhan', 'hs-sua')],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [mucGv('huong-dan', 'hd-dung')],
    },
  ],
  luat: [],
  tu: [],
};
