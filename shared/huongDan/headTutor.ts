/**
 * Hướng dẫn Head tutor — HD-V2 (c). TU2-6 (chủ SP 19/11, TU12–TU14): trang Tutor mở lại — Tổng quan, Tutor, Hồ sơ cá nhân, Hướng dẫn (không Học viên & Lớp, Test, Công việc).
 * LG-7 (chủ SP 14/11 "Head tutor vẫn là GV là chính"): dạy lớp thì Quản trị cấp thêm vai Giáo viên (khi đó trang đầu + Hướng dẫn GV, N43).
 * N56 ⑦ (chủ SP 20/11): tài khoản CHỈ có vai Head tutor → trang đầu mở thẳng Tutor. `lam` là MỘT nguồn (xem `ql.ts`).
 */
import { mucGv } from './tvv.ts';
import type { HuongDan, ManHd, ViecHd } from './kieu.ts';

const TUTOR = '/tutor';
/** TU2-6: việc ở trang Tutor — MỘT nguồn cho Head tutor, Head (`ql.ts`, Quản trị theo QL) và CX (`cx.ts`). */
export const VIEC_TUTOR: Record<'xem' | 'nhanXet' | 'danhBa' | 'xuat', ViecHd> = {
  xem: {
    id: 'tutor-xem', ten: 'Xem người dạy tutor', nhom: 'khac',
    loiChinh: { man: 'tutor', chu: 'Tutor', duong: TUTOR, chi: { hd: 'tutor-loc', duong: TUTOR, chu: 'Chọn nhóm người dạy ở hàng này.' } },
    buoc: ['Mở <b>Tutor</b>: một bảng <b>Người dạy</b> (tutor và GV có buổi) trong khoảng tuần ở đầu trang.',
      'Chip <b>Cần chú ý</b> · <b>Đang dạy</b> · <b>Ngừng</b> · <b>Tất cả</b>; <b>Lọc</b> theo nơi dạy, kỹ năng, loại.',
      'Bấm một hàng: panel số buổi, nhận xét và <b>Kết quả đã ghi</b>.'],
    tuKhac: ['tutor', 'người dạy', 'gia sư', 'tỉ lệ', 'teacher'],
  },
  nhanXet: {
    id: 'tutor-nhan-xet', ten: 'Nhận xét người dạy cần chú ý', nhom: 'khac',
    loiChinh: { man: 'tutor', chu: 'Tutor › Cần chú ý', duong: TUTOR, chi: { hd: 'tutor-loc', duong: TUTOR, chu: 'Trang mở sẵn ở Cần chú ý khi có người.' } },
    buoc: ['Trang mở ở chip <b>Cần chú ý</b>; bấm hàng một người dạy.', 'Chọn <b>Kết luận</b>, gõ <b>Nhận xét</b> (ít nhất 8 ký tự), bấm <b>Lưu nhận xét</b>.',
      'Bấm <b>Người cần chú ý tiếp</b> để sang người kế.'],
    tuKhac: ['nhận xét', 'kết luận', 'cần chú ý', 'đánh giá tutor', 'review'],
  },
  danhBa: {
    id: 'tutor-danh-ba', ten: 'Thêm tutor, gộp tên gõ tay', nhom: 'khac',
    loiChinh: { man: 'tutor', chu: 'Tutor › Thêm tutor', duong: TUTOR, chi: { hd: 'tutor-them', duong: TUTOR, chu: 'Thêm một người; nhiều người thì Tải danh sách.' } },
    buoc: ['<b>Thêm tutor</b>: Tên và Kỹ năng bắt buộc; nhiều người thì <b>Tải danh sách</b> từ Excel.',
      'Dải tên gõ tay: bấm <b>Gộp…</b>, chọn tutor hoặc GV cho từng tên, bấm <b>Gộp</b>; sai thì <b>Hoàn tác</b>.'],
    tuKhac: ['thêm tutor', 'danh sách tutor', 'gộp', 'tên gõ tay', 'excel', 'import'],
  },
  xuat: {
    id: 'tutor-xuat', ten: 'Xuất số buổi theo tháng', nhom: 'khac',
    loiChinh: { man: 'tutor', chu: 'Tutor › Xuất số buổi', duong: TUTOR, chi: { hd: 'tutor-xuat', duong: TUTOR, chu: 'Chọn khoảng tháng rồi xuất.' } },
    buoc: ['Bấm <b>Xuất số buổi</b>, chọn <b>Từ tháng</b> → <b>Đến tháng</b>.', 'Bấm <b>Xuất Excel</b>: mỗi người dạy một dòng, mỗi tháng một cột, theo phạm vi của bạn.'],
    tuKhac: ['số buổi', 'xuất', 'excel', 'tháng', 'export'],
  },
};
/** Màn Tutor của một vai (Head tutor nhận xét; Head sửa danh bạ chi nhánh mình; CX chỉ xem). */
export const manTutor = (vai: 'ht' | 'ql' | 'cx'): ManHd => ({
  id: 'tutor', ten: 'Tutor', duong: [TUTOR],
  dangO: { cau: vai === 'cx' ? 'Người dạy tutor trong phạm vi của bạn — chỉ xem, xuất số buổi.' : 'Người dạy tutor: số buổi, tỉ lệ, nhận xét; danh bạ tutor.', truoc: { chu: 'Tổng quan', duong: '/' } },
  muc: [
    { id: `${vai}-tutor-bang`, ten: 'Bảng Người dạy', buoc: ['Ba cột <b>Chuẩn bị</b> · <b>Tài liệu</b> · <b>Feedback GV</b> ghi số lần có trên số lần có trả lời; số cam bấm được — panel lọc sẵn lần ghi Không.',
      vai === 'ht' ? 'Nhận xét và kết luận: Head tutor, Quản trị.' : vai === 'ql' ? 'Head thêm, sửa tutor chi nhánh mình; nhận xét chỉ đọc.' : 'CX chỉ xem; không sửa danh bạ, không nhận xét.'],
      chi: { hd: 'tutor-trang', duong: TUTOR, chu: 'Một bảng cho cả tutor và GV có buổi.' } },
  ],
});

export const HD_HT: HuongDan = {
  viec: [],
  lam: [
    {
      id: 'xem-tong-quan', ten: 'Xem trang đầu', nhom: 'khac',
      loiChinh: { man: 'tutor', chu: 'Tutor', duong: TUTOR },
      buoc: ['Đăng nhập hoặc bấm <b>Tổng quan</b>: trang đầu mở thẳng <b>Tutor</b>.', 'Dạy lớp: nhờ Quản trị cấp thêm vai <b>Giáo viên</b> — trang đầu thành Công việc như GV; Tutor vẫn ở menu.'],
      tuKhac: ['case', 'trang đầu', 'home'],
    },
    VIEC_TUTOR.nhanXet, VIEC_TUTOR.danhBa, VIEC_TUTOR.xuat,
    {
      id: 'sua-ho-so', ten: 'Sửa hồ sơ cá nhân', nhom: 'khac',
      loiChinh: { man: 'ho-so-ca-nhan', chu: 'Tài khoản › Hồ sơ cá nhân', duong: '/ho-so-ca-nhan', chi: { hd: 'tai-khoan', chu: 'Bấm tên bạn › <b>Hồ sơ cá nhân</b>.' } },
      buoc: ['Bấm tên bạn › <b>Hồ sơ cá nhân</b>.', 'Đổi họ tên, điện thoại, mật khẩu.', 'Ngôn ngữ: menu Tài khoản › <b>VI | EN</b>. Giao diện: <b>Theo máy · Sáng · Tối</b> ở cùng menu.'],
      tuKhac: ['mật khẩu', 'họ tên', 'điện thoại', 'password', 'profile'],
    },
  ],
  tuan: [
    { nhip: 'Hằng ngày', viec: ['xem-tong-quan', 'tutor-nhan-xet'] },
    { nhip: 'Hằng tháng', viec: ['tutor-xuat'] },
    { nhip: 'Khi có', viec: ['tutor-danh-ba', 'sua-ho-so'] },
  ],
  vaiKhac: [
    { ten: 'Nhập điểm, xử lý Case', cua: 'việc của GV', tuKhac: ['điểm', 'case', 'score'] },
    { ten: 'Duyệt yêu cầu', cua: 'việc của Head', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Tạo, sửa, xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Trang đầu như GV: lớp của bạn (chưa có lớp thì trống).' },
      khongLam: [{ ten: 'Nhập điểm, xử lý Case', cua: 'việc của GV' }],
      muc: [],
    },
    manTutor('ht'),
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
