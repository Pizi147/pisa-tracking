/**
 * HD-b — Hướng dẫn CX: như TVV nhưng toàn hệ thống, Tổng quan V5 (4 số + Theo chi nhánh); không chọn Bước tiếp (chỉ xem). Hồ sơ lớp / em, Luật dùng lại của TVV.
 */
import { HD_GV } from './gv.ts';
import { HD_TVV, LUAT_TVV, MAN_HO_SO_TVV } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

const hvTim = HD_GV.man.find((m) => m.id === 'hoc-vien')!.muc.find((m) => m.id === 'hv-tim')!;
const hvLichThi = HD_GV.man.find((m) => m.id === 'hoc-vien')!.muc.find((m) => m.id === 'hv-lich-thi')!;

export const HD_CX: HuongDan = {
  viec: [
    {
      id: 'cx-sang', ten: 'Xem Tổng quan mỗi sáng', khi: 'mỗi ngày',
      buoc: ['<b>Tổng quan</b>: chọn <b>Chi nhánh</b> (mặc định tất cả).',
        'Bốn số: <b>Đạt MT</b> · <b>Đạt Target thi thật</b> · <b>HV SOS 2–3</b> · <b>Chờ KQ · bước tiếp</b>; bấm số mở danh sách.',
        'Dưới: bảng <b>Theo chi nhánh</b> (bấm hàng xem một chi nhánh) hoặc <b>Lớp cần chú ý</b> khi đã chọn chi nhánh.'],
      chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' },
    },
    {
      id: 'cx-can-chu-y', ten: 'Theo dõi em Cần chú ý', khi: 'mỗi ngày',
      buoc: ['<b>Học viên & Lớp</b> mở ở <b>Tất cả</b>, phạm vi <b>Tất cả</b> chi nhánh; bấm lọc <b>Cần chú ý</b>.',
        'Bấm tên em mở hồ sơ.', 'Cần xem sâu: mở hồ sơ em.'],
      chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn và lọc phụ ở hàng này.' },
    },
    {
      id: 'cx-meeting', ten: 'Meeting CX/GĐCN', khi: 'khi em SOS 3 hoặc Ý thức bậc 4',
      buoc: ['GVCN hẹn meeting với em (MT3 SOS 3: có cả phụ huynh) hoặc Report 4 + Meeting CX/GĐCN.',
        'Xem việc: hồ sơ em › <b>Ý thức & Phối hợp</b> › <b>Phối hợp SOS</b>.', 'GVCN bấm <b>Xác nhận meeting</b> kèm ghi chú; hạn 5 ngày.'],
    },
    {
      id: 'cx-thi-that', ten: 'Kết quả thi thật', khi: 'sau khi em thi',
      buoc: ['Hồ sơ em › <b>Kết quả thi thật</b>: <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), <b>Lưu</b>.',
        '<b>Bước tiếp</b> do QL hoặc TVV chọn; hồ sơ em ghi "Chờ QL / TVV chọn bước tiếp" tới khi có.'],
      chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Tìm em rồi mở hồ sơ.' },
    },
    {
      id: 'cx-sua-tt', ten: 'Sửa thông tin, Target, Tạm dừng', khi: 'khi có thay đổi',
      buoc: ['Một em: hồ sơ › <b>Sửa thông tin</b>; đổi Target ghi <b>Lý do đổi Target</b>.',
        'Cả lớp: hồ sơ lớp › tab <b>Học viên</b> › <b>Sửa thông tin</b>.', 'Nghỉ / dừng: <b>Tạm dừng / Thôi học</b>; xem lại: <b>Lịch sử</b>.'],
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'cx-tq-o', ten: 'Bốn số', buoc: ['Chọn <b>Chi nhánh</b>; <b>Đạt MT</b> · <b>Đạt Target thi thật</b> · <b>HV SOS 2–3</b> · <b>Chờ KQ · bước tiếp</b>.', 'Bấm số mở danh sách ngay tại trang.'],
          chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
        { id: 'cx-tq-so', ten: 'Theo chi nhánh', buoc: ['Bảng: Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa PA; bấm hàng xem một chi nhánh.'] },
      ],
    },
    { ...HD_TVV.man.find((m) => m.id === 'phan-tich')!, muc: [{ id: 'cx-pt', ten: 'Tab phân tích', buoc: ['<b>Báo cáo HV</b> · <b>Test + SOS</b> · <b>Kết quả Test / Thi</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>.', 'Mọi chi nhánh; <b>Từ tuần → Đến tuần</b> cho mọi tab (mặc định 2 tuần vừa qua), thêm <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>; bấm số mở danh sách ngay tại trang.'],
      chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }] },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        hvTim,
        hvLichThi,
        { id: 'cx-hvl-goc', ten: 'Góc nhìn và phạm vi', buoc: ['<b>Tất cả</b> (mặc định) · <b>Đang SOS</b> · <b>Lịch thi</b>; lọc <b>Cần chú ý</b>, <b>Tạm dừng</b>, <b>Sắp thi</b>, <b>Thi tháng này</b>, <b>Đã thi · chờ kết quả</b>, <b>Thiếu thông tin</b>.', 'Phạm vi <b>Tất cả</b> chi nhánh hoặc một chi nhánh.', '<b>⋯</b> cuối dòng: <b>Sửa thông tin</b> · <b>Tạm dừng / Thôi học</b> · <b>Kết quả thi thật</b> (FT) · <b>Mở hồ sơ</b>.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
        { id: 'cx-hvl-them', ten: 'Tạo lớp, thêm học viên', buoc: ['<b>+ Lớp mới</b> · <b>+ Học viên</b> (một em hoặc dán danh sách): mọi chi nhánh. Phân công giáo viên do QL làm.'] },
      ],
    },
    ...MAN_HO_SO_TVV,
  ],
  luat: [
    ...LUAT_TVV.filter((m) => m.id !== 'tvv-luat-thi-that'),
    { id: 'cx-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['CX nhập được, cả khi em đã Lưu trữ.', 'Bước tiếp: QL hoặc TVV chọn, hạn ngày thi + <b>7 ngày</b> (<b>Gia hạn</b> được); CX chỉ xem.'] },
  ],
  tu: [
    ...HD_TVV.tu.filter((x) => x.ten !== 'HV của tôi'),
    { ten: 'Meeting CX/GĐCN', nghia: 'Buổi gặp em (có thể cả phụ huynh) với CX hoặc Giám đốc chi nhánh — SOS 3 hoặc Ý thức bậc 4.' },
  ],
};
