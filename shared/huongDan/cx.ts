/**
 * HD-b — Hướng dẫn CX: như TVV nhưng toàn hệ thống, Tổng quan là "Số liệu"; không chọn Bước tiếp (chỉ xem). Hồ sơ lớp / em, Luật dùng lại của TVV.
 */
import { HD_GV } from './gv.ts';
import { HD_TVV, LUAT_TVV, MAN_HO_SO_TVV } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

const hvTim = HD_GV.man.find((m) => m.id === 'hoc-vien')!.muc.find((m) => m.id === 'hv-tim')!;

export const HD_CX: HuongDan = {
  viec: [
    {
      id: 'cx-sang', ten: 'Xem Số liệu mỗi sáng', khi: 'mỗi ngày',
      buoc: ['<b>Tổng quan › Số liệu</b>: chọn <b>Chi nhánh</b> (mặc định tất cả).',
        'Ô <b>Cần chú ý</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> · <b>Thiếu thông tin</b>; bấm ô mở đúng nhóm em.',
        'Dưới: bốn số học thuật, <b>Điểm đáng chú ý</b>, <b>Lịch sắp tới</b>.'],
      chi: { hd: 'tq-hv-so', duong: '/', chu: 'Bấm một ô để xem đúng nhóm em.' },
    },
    {
      id: 'cx-can-chu-y', ten: 'Theo dõi em Cần chú ý', khi: 'mỗi ngày',
      buoc: ['<b>Học viên & Lớp</b> mở sẵn <b>Cần chú ý</b>, phạm vi <b>Tất cả chi nhánh</b>.',
        'Bấm dòng em mở panel một em, không rời trang.', 'Cần xem sâu: mở hồ sơ em.'],
      chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn và lọc phụ ở hàng này.' },
    },
    {
      id: 'cx-meeting', ten: 'Meeting CX / GĐCN', khi: 'khi em SOS 3 hoặc Ý thức bậc 4',
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
        'Cả lớp: hồ sơ lớp › tab <b>Học viên</b> › <b>Sửa thông tin</b>.', 'Nghỉ / dừng: <b>Tạm dừng / Thôi học</b>; xem lại: <b>Lịch sử sửa</b>.'],
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'cx-tq-o', ten: 'Số liệu học viên', buoc: ['Chọn <b>Chi nhánh</b>; ô <b>Cần chú ý</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> · <b>Thiếu thông tin</b>.', 'Bấm ô mở Học viên & Lớp đúng nhóm em.'],
          chi: { hd: 'tq-hv-so', duong: '/', chu: 'Bấm một ô để xem đúng nhóm em.' } },
        { id: 'cx-tq-so', ten: 'Số liệu học thuật', buoc: ['Bốn ô: dưới kỳ vọng, Case đang mở, Case chờ duyệt, PA chưa có kết quả.', '<b>Điểm đáng chú ý</b> · <b>Lịch sắp tới</b>.'] },
      ],
    },
    { ...HD_TVV.man.find((m) => m.id === 'phan-tich')!, muc: [{ id: 'cx-pt', ten: 'Góc phân tích', buoc: ['<b>Tổng hợp Test + SOS</b> · <b>Tổng hợp vấn đề HV</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>.', 'Mọi chi nhánh; bấm số xem danh sách em.'],
      chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn góc phân tích ở hàng này.' } }] },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        hvTim,
        { id: 'cx-hvl-goc', ten: 'Góc nhìn và phạm vi', buoc: ['<b>Tất cả</b> · <b>Đang SOS</b> · <b>Cần chú ý</b> (mặc định); lọc phụ <b>Tạm dừng</b>, <b>Sắp thi</b>, <b>Thiếu thông tin</b>.', 'Phạm vi <b>Tất cả chi nhánh</b> hoặc một chi nhánh.', 'Bấm dòng em mở panel một em.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
      ],
    },
    ...MAN_HO_SO_TVV,
  ],
  luat: [
    ...LUAT_TVV.filter((m) => m.id !== 'tvv-luat-thi-that'),
    { id: 'cx-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['CX nhập được, cả khi em đã Lưu trữ.', 'Bước tiếp: QL hoặc TVV chọn trong <b>7 ngày</b>; CX chỉ xem.'] },
  ],
  tu: [
    ...HD_TVV.tu.filter((x) => x.ten !== 'HV của tôi'),
    { ten: 'Meeting CX/GĐCN', nghia: 'Buổi gặp em (có thể cả phụ huynh) với CX hoặc Giám đốc chi nhánh — SOS 3 hoặc Ý thức bậc 4.' },
  ],
};
