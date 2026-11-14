/**
 * Hướng dẫn CX — HD-V2 (c), HD-V3-C (13/11, đối chiếu `docs/superpowers/specs/2026-11-13-huong-dan-v3/doi-chieu-tvv-cx.md`). Như TVV nhưng toàn hệ thống và KHÔNG có
 * Công việc, không Báo cáo PH, không đổi Lộ trình / Môn học, không chọn Bước tiếp: Tổng quan V5 (5 ô + Theo chi nhánh), Học viên & Lớp mọi chi nhánh, Kết quả
 * thi thật ở Hồ sơ HV (nút trên đầu hồ sơ). CX giữ quyền sửa thông tin, Target, Tạm dừng, thi thật; chỉ XEM Case, điểm, Ý thức, Phối hợp SOS. Việc, màn, luật
 * dùng lại của `tvv.ts` (`lam` là MỘT nguồn — xem `ql.ts`).
 */
import { HD_TVV, LUAT_TVV, TU_TVV, VAI_KHAC_TVV, VIEC_TVV, manHoSoVai, manPanelTvvCx } from './tvv.ts';
import type { HuongDan, ViecHd } from './kieu.ts';

const HV = '/hoc-vien';
const tvv = (id: string): ViecHd => VIEC_TVV.find((v) => v.id === id)!;
const KHONG = [{ ten: 'Nhập điểm, ghi Case, PA', cua: 'việc của GV' }, { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của QL' }] as const;

const VIEC_CX: ViecHd[] = [
  {
    id: 'xem-so', ten: 'Xem Tổng quan mỗi sáng', nhom: 'hv',
    loiChinh: { man: 'tong-quan', chu: 'Tổng quan', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
    buoc: ['Mở <b>Tổng quan</b>: đầu trang chọn <b>Chi nhánh</b> (mặc định tất cả) và khung Fast Track / Lớp thường khi có cả hai.',
      'Năm ô: <b>Đạt MT</b> · <b>Đạt Target thi thật</b> · <b>HV SOS 2–3 ›</b> · <b>Chờ KQ thi thật ›</b> · <b>Chưa chốt lộ trình tiếp ›</b>; bấm ô mở danh sách (hai ô đầu chỉ Fast Track).',
      'Dưới ô: bảng <b>Theo chi nhánh</b> (chọn chi nhánh ở ô <b>Chi nhánh</b>) hoặc <b>Lớp cần chú ý</b> khi đã chọn chi nhánh.'],
    tuKhac: ['sáng', 'số liệu', 'chi nhánh', 'numbers', 'branch', 'đạt target', 'sos'],
  },
  {
    id: 'loc-hv', ten: 'Theo dõi em, gọi phụ huynh', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › lọc', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
    buoc: ['Ô <b>Xem</b>: <b>Mọi chi nhánh</b> (mặc định) hoặc một chi nhánh; đoạn <b>Tất cả</b> · <b>Đang SOS</b> · <b>Lịch thi</b> · <b>Phân công GV</b> (chỉ xem).',
      'Chip: <b>Thi tháng này</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> · <b>Đã thi · chờ KQ</b>; <b>Bộ lọc thêm</b> › <b>Theo vai</b>: <b>Thiếu thông tin</b> · <b>Chờ chọn bước tiếp</b>.',
      'Bấm <b>tên</b> em mở hồ sơ; cột <b>Phụ huynh</b>: bấm số để gọi; <b>⋯</b> cuối dòng: <b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Quay lại học</b> · <b>Mở hồ sơ</b>.'],
    tuKhac: ['cần chú ý', 'sos', 'tạm dừng', 'sắp thi', 'filter', 'phụ huynh', 'gọi'],
  },
  {
    id: 'meeting', ten: 'Theo dõi meeting CX/GĐCN', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Ý thức & Phối hợp' },
    buoc: ['GVCN bấm <b>Xác nhận meeting</b> (MT3 SOS 3: có cả phụ huynh) thì TVV của em báo PH, xếp họp, báo lại kết quả; hạn 5 ngày.',
      'Xem tiến độ: hồ sơ em › tab <b>Ý thức & Phối hợp</b> › <b>Phối hợp SOS</b>; cột báo PH ghi “Chờ TVV” hoặc kết quả.', 'CX chỉ xem; ghi kết quả là việc của TVV (em chưa có TVV: GVCN).'],
    tuKhac: ['sos 3', 'ý thức', 'gđcn', 'họp', 'report 4', 'meeting'],
  },
  {
    id: 'thi-that', ten: 'Ghi kết quả thi thật', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Kết quả thi thật' },
    loiTat: ['hoc-vien', 'p-sau-thi'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em (lộ trình FT hoặc KET / PET), bấm <b>Kết quả thi thật</b>.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>; nhập được cả khi em đã Lưu trữ.',
      'Lưu đủ kết quả: panel chuyển sang <b>Bước tiếp</b> — QL hoặc TVV chọn; CX chỉ xem.'],
    tuKhac: ['ielts', 'điểm thi', 'kết quả thi', 'exam result', 'ket', 'pet'],
  },
  {
    ...tvv('sua-hv'),
    buoc: ['Ở hồ sơ em, bấm <b>Sửa thông tin</b> (liên hệ, Dự kiến thi, Target, ghi chú).', 'Đổi Target: ghi <b>Lý do đổi Target</b>. Lộ trình đang học, Môn học: TVV hoặc QL đổi.',
      'Cả lớp: hồ sơ lớp › ⋯ <b>Thao tác khác</b> › <b>Sửa thông tin học viên</b>.'],
  },
  { ...tvv('them-hv'), buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Thêm học viên</b> (một em, hoặc <b>Dán vùng bảng từ Excel / Google Sheets</b> rồi <b>Đọc nội dung đã dán</b>).',
    'Lớp mới: <b>⋯</b> › <b>Thao tác trang</b> › <b>+ Lớp mới</b>. Mọi chi nhánh; Dán Excel chỉ để thêm học viên; phân công giáo viên do QL làm.'] },
  { ...tvv('xuat-ds'), buoc: ['Mở <b>Học viên & Lớp</b>, đặt bộ lọc, bấm <b>Xuất Excel</b>.', 'Ngăn xuất đúng danh sách đang lọc (CX không có mẫu Báo cáo PH).'] },
  { ...tvv('phan-tich'), buoc: ['Mở <b>Phân tích</b>; mọi chi nhánh; tab <b>Chi nhánh</b> · <b>Thi thật</b> (thêm <b>Theo GV</b>) · <b>SOS</b> (lớp thường: <b>Test</b>).',
    'Kỳ: <b>Toàn bộ</b> hoặc <b>Chọn khoảng tuần</b>; Chi nhánh mặc định một tháng, tab khác 2 tuần.', 'Bấm số mở danh sách tại trang; <b>Xuất Excel</b> ở hàng lọc.'] },
];

const THU_TU = ['xem-so', 'loc-hv', 'thi-that', 'meeting', 'sua-hv', 'tam-dung', 'xem-case', 'lich-su', 'them-hv', 'tim-kiem', 'luu-tru', 'xuat-ds', 'phan-tich'];

export const HD_CX: HuongDan = {
  viec: [],
  lam: THU_TU.map((id) => [...VIEC_CX, ...VIEC_TVV].find((v) => v.id === id)!),
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-so', 'loc-hv'] },
    { nhip: 'Khi có', viec: ['sua-hv', 'xem-case', 'meeting', 'them-hv', 'lich-su', 'tim-kiem', 'luu-tru'] },
    { nhip: 'Khi gia đình báo', viec: ['tam-dung'] },
    { nhip: 'Sau khi em thi', viec: ['thi-that'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich', 'xuat-ds'] },
  ],
  vaiKhac: [
    ...VAI_KHAC_TVV,
    { ten: 'Báo PH vi phạm, chốt ngày thi', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'ngày thi', 'parent', 'exam date'] },
    { ten: 'Xuất báo cáo PH, đổi lộ trình đang học', cua: 'việc của TVV', tuKhac: ['báo cáo phụ huynh', 'lộ trình', 'môn học', 'route'] },
    { ten: 'Chọn bước tiếp sau thi', cua: 'việc của QL, TVV', tuKhac: ['bước tiếp', 'lộ trình mới', 'next step'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Năm ô toàn hệ thống và bảng Theo chi nhánh.', sau: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [...KHONG],
      muc: [
        { id: 'cx-tq-so', ten: 'Theo chi nhánh', buoc: ['Bảng (cùng bảng Quản trị): Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa có PA · Thi tháng này; hàng cuối <b>Toàn hệ thống</b>.', 'Bấm dòng một chi nhánh: trang chuyển sang chi nhánh đó (như ô <b>Chi nhánh</b> đầu trang).'] },
        { id: 'cx-tq-dau', ten: 'Đầu trang', buoc: ['Link <b>Lịch thi ›</b> · <b>Báo cáo ›</b> (mở tab <b>Chi nhánh</b> của Phân tích).', 'Chuông chỉ có khối <b>Cập nhật</b>: CX không có Công việc nên không có <b>Việc cần làm</b>.'] },
      ],
    },
    { ...HD_TVV.man.find((m) => m.id === 'phan-tich')!, /* GD-8: TVV không còn Tổng quan (Trước = Công việc) — CX còn. */ dangO: { cau: 'Thống kê theo kỳ: chi nhánh, thi thật, SOS.', truoc: { chu: 'Tổng quan', duong: '/' } }, muc: [{ id: 'cx-pt', ten: 'Tab phân tích', buoc: ['<b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> (Phân tích V2); thêm <b>Theo GV</b> ở tab Thi thật, không có tab Giáo viên.',
      'Mọi chi nhánh; <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>; bấm số mở danh sách ngay tại trang; <b>Xuất Excel</b> ở hàng lọc.'],
      chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }] },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp mọi chi nhánh; thêm lớp, học viên; xuất Excel; xem nhanh một em.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [...KHONG],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em, lớp', buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Không thấy: <b>Tìm trong HV lưu trữ ›</b>.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'cx-hvl-menu', ten: 'Bảng và thao tác dòng', buoc: ['Cột <b>Phụ huynh</b>: bấm số để gọi; bấm <b>tên</b> em mở hồ sơ.',
          '<b>⋯</b> cuối dòng (<b>Thao tác khác</b>): <b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> (FT hoặc KET / PET) · <b>Quay lại học</b> · <b>Mở hồ sơ</b>.'] },
      ],
    },
    ...manHoSoVai(true),
    ...manPanelTvvCx(true),
  ],
  luat: [
    ...LUAT_TVV.filter((m) => m.id !== 'tvv-luat-thi-that' && m.id !== 'tvv-luat-bao-ph' && m.id !== 'tvv-luat-lo-trinh'),
    { id: 'cx-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['CX nhập được, cả khi em đã Lưu trữ.', 'Bước tiếp: QL hoặc TVV chọn, hạn 7 ngày từ ngày có kết quả (<b>Gia hạn</b> được); CX chỉ xem.'] },
    { id: 'cx-luat-lo-trinh', ten: 'Lộ trình, môn học', buoc: ['TVV, GVCN, QL đổi Lộ trình đang học và Môn học; CX không.'] },
  ],
  tu: [
    ...TU_TVV.filter((x) => x.ten !== 'HV của tôi'),
    { ten: 'Meeting CX/GĐCN', nghia: 'Buổi gặp em (có thể cả phụ huynh) với CX hoặc Giám đốc chi nhánh — SOS 3 hoặc Ý thức bậc 4.' },
  ],
};
