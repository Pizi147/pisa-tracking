/**
 * Hướng dẫn CX — HD-V2 (c). Như TVV nhưng toàn hệ thống và KHÔNG có Công việc: Tổng quan V5 (4 số + Theo chi nhánh), Học viên & Lớp mọi chi nhánh, Kết quả thi thật
 * ở Hồ sơ HV (nút trên đầu hồ sơ); không chọn Bước tiếp (QL / TVV). Việc, màn, luật dùng lại của `tvv.ts` (`lam` là MỘT nguồn — xem `ql.ts`).
 */
import { HD_TVV, LUAT_TVV, MAN_HO_SO_TVV, TU_TVV, VAI_KHAC_TVV, VIEC_TVV, manHoSoHv, mucGv } from './tvv.ts';
import type { HuongDan, ViecHd } from './kieu.ts';

const HV = '/hoc-vien';
const tvv = (id: string): ViecHd => VIEC_TVV.find((v) => v.id === id)!;
const KHONG = [{ ten: 'Nhập điểm, ghi Case, PA', cua: 'việc của GV' }, { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của QL' }] as const;

const VIEC_CX: ViecHd[] = [
  {
    id: 'xem-so', ten: 'Xem Tổng quan mỗi sáng', nhom: 'hv',
    loiChinh: { man: 'tong-quan', chu: 'Tổng quan', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
    buoc: ['Mở <b>Tổng quan</b>: chọn <b>Chi nhánh</b> (mặc định tất cả).', 'Bốn số: <b>Đạt MT</b> · <b>Đạt Target thi thật</b> · <b>HV SOS 2–3</b> · <b>Chờ KQ · Lộ trình tiếp</b>; bấm số mở danh sách.',
      'Dưới: bảng <b>Theo chi nhánh</b> (bấm hàng xem một chi nhánh) hoặc <b>Lớp cần chú ý</b> khi đã chọn chi nhánh.'],
    tuKhac: ['sáng', 'số liệu', 'chi nhánh', 'numbers', 'branch'],
  },
  {
    id: 'loc-hv', ten: 'Theo dõi em Cần chú ý', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Cần chú ý', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
    buoc: ['<b>Học viên & Lớp</b> mở ở <b>Tất cả</b>; bấm lọc <b>Cần chú ý</b>. Phạm vi: <b>Tất cả</b> chi nhánh hoặc một chi nhánh.',
      'Lọc khác: <b>Tạm dừng</b>, <b>Sắp thi</b>, <b>Thi tháng này</b>, <b>Đã thi · chờ kết quả</b>, <b>Thiếu thông tin</b>.', 'Bấm tên em mở hồ sơ.'],
    tuKhac: ['cần chú ý', 'sos', 'tạm dừng', 'sắp thi', 'filter'],
  },
  {
    id: 'meeting', ten: 'Meeting CX/GĐCN', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Ý thức & Phối hợp' },
    buoc: ['GVCN hẹn meeting với em (MT3 SOS 3: có cả phụ huynh) hoặc Report 4 + Meeting CX/GĐCN.', 'Xem việc: hồ sơ em › tab <b>Ý thức & Phối hợp</b> › <b>Phối hợp SOS</b>.', 'GVCN bấm <b>Xác nhận meeting</b> kèm ghi chú; hạn 5 ngày.'],
    tuKhac: ['sos 3', 'ý thức', 'gđcn', 'họp', 'report 4'],
  },
  {
    id: 'thi-that', ten: 'Ghi kết quả thi thật', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Kết quả thi thật' },
    loiTat: ['hoc-vien'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em, bấm <b>Kết quả thi thật</b>.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>.', '<b>Bước tiếp</b> do QL hoặc TVV chọn; CX chỉ xem.'],
    tuKhac: ['ielts', 'điểm thi', 'kết quả thi', 'exam result'],
  },
  { ...tvv('them-hv'), buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Lớp mới</b> · <b>+ Học viên</b> (một em hoặc dán danh sách).', 'Mọi chi nhánh; phân công giáo viên do QL làm.'] },
  { ...tvv('phan-tich'), buoc: ['Mở <b>Phân tích</b>; mọi chi nhánh. Chọn <b>Từ tuần → Đến tuần</b> cho mọi tab (mặc định 2 tuần vừa qua).', ...tvv('phan-tich').buoc.slice(1)] },
];

const THU_TU = ['xem-so', 'loc-hv', 'thi-that', 'meeting', 'sua-hv', 'tam-dung', 'xem-case', 'lich-su', 'them-hv', 'tim-kiem', 'phan-tich'];

export const HD_CX: HuongDan = {
  viec: [],
  lam: THU_TU.map((id) => [...VIEC_CX, ...VIEC_TVV].find((v) => v.id === id)!),
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-so', 'loc-hv'] },
    { nhip: 'Khi có', viec: ['sua-hv', 'xem-case', 'meeting', 'them-hv', 'lich-su', 'tim-kiem'] },
    { nhip: 'Khi gia đình báo', viec: ['tam-dung'] },
    { nhip: 'Sau khi em thi', viec: ['thi-that'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich'] },
  ],
  vaiKhac: [
    ...VAI_KHAC_TVV,
    { ten: 'Báo PH vi phạm, chốt ngày thi', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'ngày thi', 'parent', 'exam date'] },
    { ten: 'Chọn bước tiếp sau thi', cua: 'việc của QL, TVV', tuKhac: ['bước tiếp', 'lộ trình mới', 'next step'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Bốn số toàn hệ thống và bảng Theo chi nhánh.', sau: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [...KHONG],
      muc: [{ id: 'cx-tq-so', ten: 'Theo chi nhánh', buoc: ['Bảng: Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa PA; bấm hàng xem một chi nhánh.'] }],
    },
    { ...HD_TVV.man.find((m) => m.id === 'phan-tich')!, muc: [{ id: 'cx-pt', ten: 'Tab phân tích', buoc: ['<b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> (Phân tích V2).', 'Mọi chi nhánh; <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>; bấm số mở danh sách ngay tại trang.'],
      chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }] },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp mọi chi nhánh; thêm lớp, học viên; xem nhanh một em.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [...KHONG],
      muc: [mucGv('hoc-vien', 'hv-tim'), { id: 'cx-hvl-menu', ten: 'Thao tác ở cuối dòng', buoc: ['<b>⋯</b> cuối dòng: <b>Sửa thông tin</b> · <b>Tạm dừng/ Kết thúc học</b> · <b>Kết quả thi thật</b> (FT) · <b>Mở hồ sơ</b>.'] }],
    },
    ...MAN_HO_SO_TVV.map((m) => (m.id === 'ho-so-hv' ? manHoSoHv(true) : m)),
  ],
  luat: [
    ...LUAT_TVV.filter((m) => m.id !== 'tvv-luat-thi-that'),
    { id: 'cx-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['CX nhập được, cả khi em đã Lưu trữ.', 'Bước tiếp: QL hoặc TVV chọn, hạn ngày thi + <b>7 ngày</b> (<b>Gia hạn</b> được); CX chỉ xem.'] },
  ],
  tu: [
    ...TU_TVV.filter((x) => x.ten !== 'HV của tôi'),
    { ten: 'Meeting CX/GĐCN', nghia: 'Buổi gặp em (có thể cả phụ huynh) với CX hoặc Giám đốc chi nhánh — SOS 3 hoặc Ý thức bậc 4.' },
  ],
};
