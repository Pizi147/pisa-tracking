/**
 * HD-b — Hướng dẫn QUẢN TRỊ HỆ THỐNG: chỉ ghi phần hơn QL (chủ SP: Quản trị chỉ hơn phần hệ thống). Theo màn / Luật / Thuật ngữ = của QL +
 * màn Quản trị hệ thống; Việc hằng tuần riêng (việc QL gộp một dòng). Trang Quản trị phần lớn chưa dịch: bản Anh giữ nhãn Việt trong <b>.
 */
import { HD_QL } from './ql.ts';
import type { HuongDan } from './kieu.ts';

export const HD_QT: HuongDan = {
  viec: [
    {
      id: 'qt-dang-ky', ten: 'Duyệt tài khoản đăng ký', khi: 'khi có đăng ký',
      buoc: ['Menu Tài khoản › <b>Quản trị hệ thống</b> › tab <b>Tài khoản</b>: khối <b>Đăng ký chờ duyệt</b>.',
        'Ô <b>Vai trò</b> điền sẵn vai người đăng ký đề nghị — đổi được (không có Quản trị hệ thống).',
        'Chọn chi nhánh (CX: toàn hệ thống, không cần) → <b>Duyệt</b>; sai thì <b>Không duyệt</b>, ghi lý do → <b>Gửi từ chối</b>.'],
      chi: { hd: 'qt-dang-ky', duong: '/quan-tri', chu: 'Đăng ký mới hiện ở khối này.' },
    },
    {
      id: 'qt-tai-khoan', ten: 'Tạo / sửa tài khoản', khi: 'khi có người mới · đổi việc',
      buoc: ['<b>+ Tạo tài khoản</b>: Họ và tên, Email đăng nhập (đuôi .pisa@gmail.com), Mật khẩu ban đầu.',
        '<b>Vai trò và chi nhánh</b>: mỗi vai gắn một chi nhánh; Quản trị và CX là toàn hệ thống.',
        'GV: chọn <b>Kỹ năng phụ trách được</b>. Người nghỉ: <b>⋯ › Xoá tài khoản</b>.'],
      chi: { hd: 'qt-tab', duong: '/quan-tri', chu: 'Ba tab: <b>Tài khoản</b> · <b>Chương trình</b> · <b>Quyền & nhật ký</b>.' },
    },
    {
      id: 'qt-viec-ql', ten: 'Việc QL ở mọi chi nhánh', khi: 'mỗi ngày',
      buoc: ['5 việc của QL, ở mọi chi nhánh — đọc ở <b>Xem vai</b> › Quản lý.',
        'Lọc <b>Chi nhánh</b> ở Tổng quan, Chờ duyệt, Công việc.',
        'Bạn nhận báo khi thẻ duyệt quá hạn và khi QL tự duyệt thẻ của mình.'],
      chi: { hd: 'cd-loc', duong: '/cong-viec/cho-duyet', chu: 'Hộp Chờ duyệt của mọi chi nhánh.' },
    },
    {
      id: 'qt-nhap-bu', ten: 'Nhập bù / sửa điểm', khi: 'khi GV vắng',
      buoc: ['Mở lưới điểm của lớp (Test › Lịch Test / Chấm Test, hoặc ⋯ hàng lớp › Nhập điểm).',
        'Nhập bù hoặc sửa ô ngoài phân công; ghi <b>Lý do sửa</b> (tuỳ chọn).', 'Nhật ký ghi "Sửa điểm".'],
      chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Bấm dòng lớp để mở lưới điểm.' },
    },
    {
      id: 'qt-quyen', ten: 'Quyền & nhật ký', khi: 'khi cần',
      buoc: ['Tab <b>Quyền & nhật ký</b> › <b>Sửa quyền</b>: bật / tắt quyền theo vai, <b>Lưu</b> (có hộp xác nhận).',
        'Một người cần thêm quyền: <b>Sửa</b> tài khoản › <b>Quyền cấp riêng cho người này</b> + <b>Lý do đổi quyền</b>.',
        '<b>Nhật ký thay đổi gần nhất</b>: ai đổi gì, lúc nào.'],
      chi: { hd: 'qt-tab', duong: '/quan-tri', chu: 'Bấm tab <b>Quyền & nhật ký</b>.' },
    },
  ],
  man: [
    ...HD_QL.man,
    {
      id: 'quan-tri', ten: 'Quản trị hệ thống', duong: ['/quan-tri'],
      muc: [
        { id: 'qt-qt-tab', ten: 'Ba tab', buoc: ['<b>Tài khoản</b> · <b>Chương trình</b> · <b>Quyền & nhật ký</b>.', 'Mở từ menu Tài khoản › <b>Quản trị hệ thống</b>.'],
          chi: { hd: 'qt-tab', duong: '/quan-tri', chu: 'Chọn tab ở đây.' } },
        { id: 'qt-qt-loc', ten: 'Tìm tài khoản', buoc: ['Ô tìm theo tên, mã, email; lọc <b>Chi nhánh</b>, <b>Vai trò</b>, <b>Kỹ năng</b>.', 'Chip <b>Chưa có vai trò</b> · <b>Chưa có email</b> · <b>Chưa có kỹ năng</b>: tài khoản cần bổ sung.'] },
        { id: 'qt-qt-ct', ten: 'Chương trình', buoc: ['Bảng chương trình: Cách chấm, Độ dài, Mốc Test, số lớp đang chạy.', '<b>+ Chương trình</b> hoặc <b>Sửa</b>.'] },
        { id: 'qt-qt-chi', ten: 'Chỉ Quản trị', buoc: ['Xoá lớp (<b>⋯</b> đầu hồ sơ lớp), xoá học viên (<b>⋯</b> hồ sơ em).', 'Danh sách <b>Đơn vị báo cáo</b> chỉ xem.'] },
      ],
    },
  ],
  luat: [
    ...HD_QL.luat,
    { id: 'qt-luat-dang-ky', ten: 'Đăng ký tài khoản', buoc: ['Người đăng ký tự chọn vai GV · QL · TVV · CX · Admin, không có Quản trị.', 'Chi nhánh bắt buộc, trừ CX.', 'Không duyệt: lý do bắt buộc, người đăng ký đọc được.'] },
    { id: 'qt-luat-quyen', ten: 'Đổi quyền', buoc: ['Quyền theo vai: đổi cho mọi người của vai đó.', 'Quyền cấp riêng: lý do bắt buộc; nhật ký ghi lại.'] },
  ],
  tu: [
    ...HD_QL.tu,
    { ten: 'Quyền cấp riêng', nghia: 'Quyền thêm cho một người ngoài quyền của vai, có lý do.' },
    { ten: 'Toàn hệ thống', nghia: 'Vai không gắn chi nhánh (Quản trị, CX): thấy mọi chi nhánh.' },
  ],
};
