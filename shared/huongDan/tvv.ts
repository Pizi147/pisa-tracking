/**
 * HD-b — Hướng dẫn TƯ VẤN VIÊN. TVV không có Test, Công việc: việc của TVV nằm ở Tổng quan "Học viên của tôi" và Học viên & Lớp › Cần làm
 * (panel mở tại chỗ). Học thuật (điểm, Case, PA) chỉ xem; thông tin em, Target, Tạm dừng / Thôi học, kết quả thi thật, Bước tiếp sửa được.
 */
import { HD_GV } from './gv.ts';
import type { HuongDan, ManHd, MucHd } from './kieu.ts';

const mucGv = (man: string, id: string): MucHd => HD_GV.man.find((m) => m.id === man)!.muc.find((m) => m.id === id)!;

/** Màn chung TVV / CX (CX lấy lại, đổi Tổng quan + Học viên & Lớp). */
export const MAN_HO_SO_TVV: ManHd[] = [
  {
    id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
    muc: [
      { id: 'tvv-lop-sua', ten: 'Sửa thông tin cả lớp', buoc: ['Tab <b>Học viên</b> › <b>Sửa thông tin</b>: bảng cả lớp, sửa nhiều em một lần.', 'Cột Target: đổi nhiều em, một <b>Lý do đổi Target</b> chung.'] },
      { id: 'tvv-lop-xem', ten: 'Cách xem', buoc: ['<b>Thông tin lớp</b>: liên hệ, Target, dự kiến thi của cả lớp.', '<b>Tổng hợp</b> · <b>Cần hỗ trợ</b> · <b>Kết quả đầu ra</b>: chỉ xem.'] },
    ],
  },
  {
    id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
    muc: [
      { id: 'tvv-hv-nut', ten: 'Nút trên đầu hồ sơ', buoc: ['<b>Sửa thông tin</b> · <b>Tạm dừng / Thôi học</b> · <b>Kết quả thi thật</b> (FT) · <b>Lịch sử</b>.', 'Em đang Tạm dừng: <b>Quay lại học</b> ở dải vàng.'] },
      { id: 'tvv-hv-sua', ten: 'Sửa thông tin', buoc: ['Khối <b>Học viên</b> · <b>Liên hệ</b> · <b>Lộ trình đang học</b> (Dự kiến thi, Target).', 'Đổi Target: ghi <b>Lý do đổi Target</b>.'] },
      { id: 'tvv-hv-tab', ten: 'Ba tab', buoc: ['<b>Học thuật</b>: điểm, Case, PA — chỉ xem.', '<b>Ý thức & Phối hợp</b>: vi phạm và Phối hợp SOS GVCN làm với em, gia đình.', '<b>Hành trình</b>: mọi lượt Test trên một lưới.'] },
      { id: 'tvv-hv-lich-su', ten: 'Lịch sử', buoc: ['<b>Lịch sử</b>: ai sửa gì, lúc nào.', 'Lọc <b>Thông tin · Target / lộ trình · Trạng thái</b>.'] },
    ],
  },
  { id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'], muc: [mucGv('ho-so-ca-nhan', 'hs-sua')] },
  { id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'], muc: [mucGv('huong-dan', 'hd-dung')] },
];

export const LUAT_TVV: MucHd[] = [
  { id: 'tvv-luat-target', ten: 'Đổi Target', buoc: ['TVV, CX, QL sửa thẳng; <b>Lý do đổi Target</b> bắt buộc.', 'Target mới tính từ hôm nay; kỳ vọng các lượt đã làm bài giữ nguyên.'] },
  { id: 'tvv-luat-tam-dung', ten: 'Tạm dừng', buoc: ['Em Tạm dừng: mọi hạn của em dừng, việc ẩn, không quá hạn.', 'Bấm nhầm: <b>Hoàn tác</b> ngay trên thông báo.'] },
  { id: 'tvv-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['Nhập được cả khi em đã Lưu trữ.', 'Có kết quả → việc <b>Chọn bước tiếp</b>; QL hoặc TVV chọn. Hạn: ngày thi + <b>7 ngày</b>, <b>Gia hạn</b> được.'] },
  { id: 'tvv-luat-phoi-hop', ten: 'Phối hợp SOS', buoc: ['SOS 1: <b>Trao đổi ngắn với HV</b> + <b>Trao đổi với gia đình</b>.', 'SOS 2–3: <b>Trao đổi với gia đình</b>, từ MT2 thêm <b>GVCN meeting với HV</b> (MT1: chỉ SOS 3) — không còn Trao đổi ngắn với HV (GVCN tự thêm được).', 'SOS 3 từ MT2 thêm <b>Meeting CX/GĐCN (sau Mock)</b> (MT3 có phụ huynh); GVCN xác nhận, hạn 5 ngày.'] },
  { id: 'tvv-luat-hoc-thuat', ten: 'Học thuật', buoc: ['Điểm, Case, PA, Ý thức: GV và QL ghi; TVV xem.'] },
];

export const HD_TVV: HuongDan = {
  viec: [
    {
      id: 'tvv-sang', ten: 'Mở Học viên của tôi mỗi sáng', khi: 'mỗi ngày',
      buoc: ['<b>Tổng quan › Học viên của tôi</b>: ô <b>Cần chú ý</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> · <b>Đã thi · chờ kết quả</b> · <b>Thiếu thông tin</b>.',
        'Bấm một ô: Học viên & Lớp mở sẵn đúng nhóm em.', 'Chưa được gán em nào: <b>Xem cả chi nhánh</b>.'],
      chi: { hd: 'tq-hv-so', duong: '/', chu: 'Bấm một ô để xem đúng nhóm em.' },
    },
    {
      id: 'tvv-can-lam', ten: 'Làm việc ở Cần làm', khi: 'mỗi ngày',
      buoc: ['<b>Học viên & Lớp</b> › <b>Cần làm</b>: <b>Chọn bước tiếp</b> · <b>Kết quả thi thật</b> · <b>Thiếu email</b> · <b>Thiếu thông tin</b>.',
        'Bấm dòng: panel mở ngay trên trang, xong không rời trang.', '<b>Phạm vi</b>: <b>HV của tôi</b> hoặc <b>Chi nhánh</b>.'],
      chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Bấm <b>Cần làm</b> để xem việc của bạn.' },
    },
    {
      id: 'tvv-thi-that', ten: 'Kết quả thi thật + Bước tiếp', khi: 'sau khi em thi',
      buoc: ['Hồ sơ em › <b>Kết quả thi thật</b>: <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), <b>Lưu</b>.',
        'Lưu xong, panel <b>Bước tiếp</b> mở ngay (hạn: ngày thi + <b>7 ngày</b>): <b>Lộ trình mới</b> · <b>Tạm dừng</b> · <b>Thôi học</b>; làm sau: hồ sơ › <b>Chọn bước tiếp ›</b>.',
        '<b>Lộ trình mới</b>: <b>Lớp này</b> / <b>Lớp khác</b>; <b>Bắt đầu</b> <b>Ngay bây giờ</b> hoặc hẹn một tuần (<b>Huỷ hẹn</b> được tới lúc đó).'],
      chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: '<b>Cần làm</b> có dòng "Chọn bước tiếp" khi tới lúc.' },
    },
    {
      id: 'tvv-sua-tt', ten: 'Sửa thông tin + Target', khi: 'khi có thay đổi',
      buoc: ['Một em: hồ sơ › <b>Sửa thông tin</b> (liên hệ, Dự kiến thi, Target); đổi Target ghi lý do.',
        'Cả lớp: hồ sơ lớp › tab <b>Học viên</b> › <b>Sửa thông tin</b>.', 'Xem ai đã sửa gì: hồ sơ em › <b>Lịch sử</b>.'],
    },
    {
      id: 'tvv-tam-dung', ten: 'Tạm dừng / Thôi học', khi: 'khi gia đình báo',
      buoc: ['Hồ sơ em › <b>Tạm dừng / Thôi học</b>: chọn tab, ghi <b>Lý do</b>, <b>Có hiệu lực từ</b>.',
        'Em Tạm dừng: mọi hạn dừng, việc ẩn; về học thì <b>Quay lại học</b>.'],
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [{ id: 'tvv-tq-o', ten: 'Học viên của tôi', buoc: ['Em được gán cho bạn: <b>Cần chú ý</b> (SOS · Case mới · Ý thức) · <b>Tạm dừng</b> · <b>Sắp thi</b> (6 tuần tới) · <b>Đã thi · chờ kết quả</b> · <b>Thiếu thông tin</b>.', 'Có em chờ bạn: thêm ô <b>Chờ chọn bước tiếp</b>.'],
        chi: { hd: 'tq-hv-so', duong: '/', chu: 'Bấm một ô để xem đúng nhóm em.' } }],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      muc: [{ id: 'tvv-pt', ten: 'Tab phân tích', buoc: ['<b>Báo cáo</b> · <b>Test + SOS</b> · <b>Kết quả Test</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>.', 'Một <b>Khoảng thời gian</b> cho mọi tab (mặc định 2 tuần vừa qua); bấm số mở danh sách, làm tại chỗ.'],
        chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        mucGv('hoc-vien', 'hv-tim'),
        mucGv('hoc-vien', 'hv-lich-thi'),
        { id: 'tvv-hvl-goc', ten: 'Góc nhìn và phạm vi', buoc: ['<b>Tất cả</b> · <b>Đang SOS</b> · <b>Cần làm</b>; lọc phụ <b>Cần chú ý</b>, <b>Tạm dừng</b>, <b>Sắp thi</b>, <b>Đã thi · chờ kết quả</b>.', '<b>Phạm vi</b>: <b>HV của tôi</b> (mặc định) · <b>Chi nhánh</b>.', 'Bấm dòng em mở panel một em, không rời trang.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
        { id: 'tvv-hvl-them', ten: 'Tạo lớp, thêm học viên', buoc: ['<b>+ Lớp mới</b> · <b>+ Học viên</b> (một em hoặc dán danh sách): lớp chi nhánh mình. Phân công giáo viên do QL làm.'] },
      ],
    },
    ...MAN_HO_SO_TVV,
  ],
  luat: LUAT_TVV,
  tu: [
    ...HD_GV.tu,   // UX-1: đủ như GV (TVV / CX đọc cùng hồ sơ, Case, PA)
    { ten: 'HV của tôi', nghia: 'Em có TVV là bạn (ô TVV trong Sửa thông tin).' },
    { ten: 'Cần chú ý', nghia: 'Em đang SOS, có Case mới hoặc vi phạm Ý thức.' },
    { ten: 'Sắp thi', nghia: 'Em thi IELTS trong 6 tuần tới.' },
    { ten: 'Thiếu thông tin', nghia: 'Hồ sơ chưa đủ để theo dõi; điền đủ là hết.' },
    { ten: 'Bước tiếp', nghia: 'Hướng sau thi thật: Lộ trình mới · Tạm dừng · Thôi học.' },
    { ten: 'Phối hợp SOS', nghia: 'Việc GVCN làm với em, gia đình khi em SOS (trao đổi, meeting).' },
  ],
};
