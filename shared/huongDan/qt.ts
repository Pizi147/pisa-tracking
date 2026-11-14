/**
 * Hướng dẫn QUẢN TRỊ HỆ THỐNG — HD-V2 (b). QT = QL + phần hệ thống (chủ SP: Quản trị chỉ hơn phần hệ thống): dùng lại `HD_QL` (việc, màn, luật, thuật ngữ),
 * thêm việc Quản trị và thay màn "Đã xoá" của QL bằng màn "Quản trị hệ thống" đủ các tab (QTV2 11/11). Trang Quản trị phần lớn chưa dịch: bản Anh giữ nhãn Việt trong <b>.
 */
import { HD_QL } from './ql.ts';
import type { HuongDan, MucHd, ViecHd } from './kieu.ts';

/** Tổng quan QT mặc định "Tất cả chi nhánh" (bảng Theo chi nhánh) — Chờ bạn duyệt, Lớp cần chú ý, bảng Giáo viên chỉ hiện khi chọn một chi nhánh (HD-CHI). */
const KHONG_CHI = ['tq-duyet', 'ql-tq-so-lieu'];
const KHONG_CHI_VIEC = ['nhap-ho'];
const boChi = <T extends { chi?: unknown }>({ chi: _, ...m }: T) => m as Omit<T, 'chi'>;
const QT_TAB = { hd: 'qt-tab', duong: '/quan-tri', chu: 'Các tab: <b>Tài khoản</b> · <b>Chương trình</b> · <b>Chi nhánh</b> · <b>Band & ngưỡng</b> · <b>Hạn mặc định</b> · <b>Case & SOS</b> · <b>Quyền & nhật ký</b> · <b>Đã xoá</b>.' } as const;

const VIEC_QT: ViecHd[] = [
  {
    id: 'dang-ky', ten: 'Duyệt tài khoản đăng ký', nhom: 'duyet',
    loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Quản trị hệ thống › Tài khoản', duong: '/quan-tri', chi: { hd: 'qt-dang-ky', duong: '/quan-tri', chu: 'Đăng ký mới hiện ở khối này.' } },
    buoc: ['Mở tab <b>Tài khoản</b>, khối <b>Đăng ký chờ duyệt</b>.', 'Ô <b>Vai trò</b> điền sẵn vai người đăng ký đề nghị — đổi được (không có Quản trị hệ thống).',
      'Chọn chi nhánh (CX: toàn hệ thống, không cần) → <b>Duyệt</b>; sai thì <b>Không duyệt</b>, ghi lý do → <b>Gửi từ chối</b>.'],
    tuKhac: ['đăng ký', 'duyệt tài khoản', 'tài khoản mới', 'sign up', 'register', 'approve account'],
  },
  {
    id: 'tai-khoan', ten: 'Tạo, sửa, xoá tài khoản', nhom: 'khac',
    loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Quản trị hệ thống › Tài khoản', duong: '/quan-tri', chi: QT_TAB },
    buoc: ['<b>+ Tạo tài khoản</b>: Họ và tên, Email đăng nhập (đuôi .pisa@gmail.com), Mật khẩu ban đầu.', 'Đổi vai: bấm ô <b>Vai trò · chi nhánh</b> ở dòng tài khoản — mỗi vai gắn một chi nhánh; Quản trị và CX là toàn hệ thống. GV: bấm ô <b>Kỹ năng</b>.',
      'Sửa: <b>Sửa</b> ở dòng tài khoản. Người nghỉ: <b>⋯ › Xoá tài khoản</b> (có thể khôi phục ở <b>Đã xoá</b>).'],
    tuKhac: ['tài khoản', 'account', 'người mới', 'nghỉ việc', 'xoá tài khoản', 'phân công kỹ năng', 'create account'],
  },
  {
    id: 'quyen', ten: 'Đổi quyền, xem nhật ký', nhom: 'khac',
    loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Quản trị hệ thống › Quyền & nhật ký', duong: '/quan-tri', chi: QT_TAB },
    buoc: ['Tab <b>Quyền & nhật ký</b> › <b>Theo từng vai</b>: chọn vai, bật / tắt quyền, <b>Lưu</b> (có hộp xác nhận). <b>So sánh mọi vai</b>: xem cả bảng.', 'Một người cần thêm quyền: <b>Sửa</b> tài khoản › <b>Quyền cấp riêng</b> + <b>Lý do đổi quyền</b>.', '<b>Nhật ký chung</b>: ai đổi gì, lúc nào — lọc theo <b>Mục</b>, <b>Người</b>.'],
    tuKhac: ['quyền', 'phân quyền', 'nhật ký', 'permission', 'audit'],
  },
  {
    id: 'chuong-trinh', ten: 'Sửa chương trình', nhom: 'khac',
    loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Quản trị hệ thống › Chương trình', duong: '/quan-tri', chi: QT_TAB },
    buoc: ['Tab <b>Chương trình</b>: bấm thẳng ô Tên · Môn · Đạt từ · Độ dài · Mốc Test để sửa tại chỗ; công tắc <b>Còn dùng</b> (có Hoàn tác).', '<b>+ Chương trình</b>: tạo mới trong panel.'],
    tuKhac: ['programme', 'mốc test', 'độ dài', 'program'],
  },
  {
    id: 'cau-hinh', ten: 'Sửa hạn mặc định, kỳ vọng, ngưỡng', nhom: 'khac',
    loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Quản trị hệ thống › Hạn mặc định · Band & ngưỡng', duong: '/quan-tri', chi: QT_TAB },
    buoc: ['Tab <b>Hạn mặc định</b> hoặc <b>Band & ngưỡng</b>: bấm ô giá trị, sửa, Enter lưu (Esc để thôi).',
      'Chỉ áp cho cái sinh sau: hạn cho việc sinh từ ngày lưu; kỳ vọng MT cho lộ trình mở từ nay; ngưỡng lớp thường cho lớp mở từ nay.',
      'Sai thì <b>Hoàn tác</b> trên thông báo hoặc <b>Về gốc</b> ở dòng; mọi lần đổi có ở cột <b>Nhật ký</b>.'],
    tuKhac: ['hạn mặc định', 'kỳ vọng', 'ngưỡng', 'band', 'deadline', 'threshold', 'expectation'],
  },
  {
    id: 'xoa-lop', ten: 'Xoá lớp', nhom: 'hv',
    loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ › Xoá lớp' },
    buoc: ['Mở hồ sơ lớp, bấm <b>⋯</b> đầu trang › <b>Xoá lớp</b>.', 'Gõ lại mã lớp để xác nhận, bấm <b>Xoá lớp</b> — xoá hẳn, không hoàn tác. Lớp đã có dữ liệu: dùng Kết thúc lớp.'],
    tuKhac: ['xoá lớp', 'delete class'],
  },
  {
    id: 'xoa-hv', ten: 'Xoá học viên', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Xoá học viên' },
    buoc: ['Mở hồ sơ em, bấm <b>⋯</b> đầu trang › <b>Xoá học viên</b>.', 'Gõ <b>XOÁ</b> để xác nhận, bấm <b>Xoá</b>. Em đã học xong: nên <b>Lưu trữ</b>.'],
    tuKhac: ['xoá học viên', 'xoá em', 'delete student'],
  },
];

export const HD_QT: HuongDan = {
  viec: [],
  lam: [...HD_QL.lam!.map((v) => (KHONG_CHI_VIEC.includes(v.id) ? { ...v, loiChinh: boChi(v.loiChinh) } : v)), ...VIEC_QT],
  tuan: HD_QL.tuan!.map((n) => (n.nhip === 'Mỗi sáng' ? { ...n, viec: [...n.viec, 'dang-ky'] } : n.nhip === 'Khi có' ? { ...n, viec: [...n.viec, 'tai-khoan', 'quyen', 'chuong-trinh', 'cau-hinh', 'xoa-lop', 'xoa-hv'] } : n)),
  vaiKhac: HD_QL.vaiKhac!.filter((v) => v.cua !== 'việc của Quản trị'),
  man: [
    ...HD_QL.man.filter((m) => m.id !== 'quan-tri').map((m) => (m.id === 'tong-quan' ? { ...m, muc: m.muc.map((x) => (KHONG_CHI.includes(x.id) ? boChi(x) as MucHd : x)) } : m)),
    {
      id: 'quan-tri', ten: 'Quản trị hệ thống', duong: ['/quan-tri'],
      dangO: { cau: 'Tài khoản, quyền; cấu hình hệ thống (chương trình, chi nhánh, band, hạn, Case & SOS); thùng rác đã xoá.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [{ ten: 'Duyệt đề xuất PA, chuyển lớp', den: { chu: 'Công việc › Chờ bạn duyệt', duong: '/cong-viec' } }],
      muc: [
        { id: 'qt-qt-loc', ten: 'Tìm tài khoản', buoc: ['Ô tìm theo tên, mã, email; lọc <b>Chi nhánh</b>, <b>Vai trò</b>, <b>Kỹ năng</b>.', 'Chip <b>Chưa có vai trò</b> · <b>Chưa có email</b> · <b>Chưa có kỹ năng</b>: tài khoản cần bổ sung.'] },
        { id: 'qt-qt-da-xoa', viec: 'khoi-phuc', ten: 'Khôi phục thứ đã xoá', buoc: ['Chọn tab <b>Đã xoá</b>.', 'Chọn mục, bấm <b>Khôi phục</b>.'] },
        { id: 'qt-qt-chi', ten: 'Đơn vị báo cáo', buoc: ['Danh sách <b>Đơn vị báo cáo</b> chỉ xem.'] },
      ],
    },
  ],
  luat: [
    ...HD_QL.luat,
    { id: 'qt-luat-dang-ky', ten: 'Đăng ký tài khoản', buoc: ['Người đăng ký tự chọn vai GV · QL · TVV · CX · Admin, không có Quản trị.', 'Chi nhánh bắt buộc, trừ CX.', 'Không duyệt: lý do bắt buộc, người đăng ký đọc được.'] },
    { id: 'qt-luat-quyen', ten: 'Đổi quyền', buoc: ['Quyền theo vai: đổi cho mọi người của vai đó.', 'Quyền cấp riêng: lý do bắt buộc; nhật ký ghi lại.'] },
    { id: 'qt-luat-bao', ten: 'Quản trị nhận báo gì', buoc: ['Thẻ duyệt quá hạn của mọi chi nhánh.', 'QL tự duyệt thẻ của mình: có nhật ký, báo Quản trị.'] },
  ],
  tu: [
    ...HD_QL.tu,
    { ten: 'Quyền cấp riêng', nghia: 'Quyền thêm cho một người ngoài quyền của vai, có lý do.' },
    { ten: 'Toàn hệ thống', nghia: 'Vai không gắn chi nhánh (Quản trị, CX): thấy mọi chi nhánh.' },
  ],
};
