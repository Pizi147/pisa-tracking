/**
 * Hướng dẫn CX — HD-V2 (c), HD-V3-C (13/11, đối chiếu `docs/superpowers/specs/2026-11-13-huong-dan-v3/doi-chieu-tvv-cx.md`). Như TVV nhưng theo chi nhánh của
 * CX (bỏ trống = toàn hệ thống): Tổng quan V5 (5 ô + Theo chi nhánh), Học viên & Lớp, Kết quả thi thật ở Hồ sơ HV. N52 (chủ SP 18/11): xem mọi thứ như QL (Test,
 * Công việc, phần GV); sửa phía TVV (Bước tiếp, lộ trình, môn, Báo PH…) + Ý thức + lớp / chuyển lớp; không học thuật (điểm, Case / PA). N58 + N63 (21/11): CX có việc riêng — Kết quả meeting
 * và việc được giao; Cuối khoá / Xét lại: chỉ xem.
 * Việc, màn, luật dùng lại của `tvv.ts` (`lam` là MỘT nguồn — xem `ql.ts`).
 */
import { HD_TVV, LUAT_TVV, TINH_HUONG_CX, TU_TVV, VAI_KHAC_TVV, VIEC_TVV, manHoSoVai, manPanelTvvCx } from './tvv.ts';
import { VIEC_TUTOR, manTutor } from './headTutor.ts';
import type { HuongDan, ViecHd } from './kieu.ts';

const HV = '/hoc-vien';
const CV = '/cong-viec';
const TEST = '/test/lich';
const tvv = (id: string): ViecHd => VIEC_TVV.find((v) => v.id === id)!;
const KHONG = [{ ten: 'Nhập điểm, ghi Case, PA', cua: 'việc của GV' }, { ten: 'Phân công GV, duyệt yêu cầu', cua: 'việc của Head' }] as const;

const VIEC_CX: ViecHd[] = [
  {
    id: 'xem-so', ten: 'Xem Tổng quan mỗi sáng', nhom: 'hv',
    loiChinh: { man: 'tong-quan', chu: 'Tổng quan', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
    buoc: ['Mở <b>Tổng quan</b>: đầu trang chọn <b>Chi nhánh</b> (mặc định tất cả) và khung Fast Track / Lớp thường khi có cả hai.',
      'Năm ô: <b>Đạt MT</b> · <b>Đạt Target thi thật</b> · <b>HV SOS 2–3 ›</b> · <b>Chờ KQ thi thật ›</b> · <b>Chưa chốt bước tiếp ›</b>; bấm ô mở danh sách (hai ô đầu chỉ Fast Track).',
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
    buoc: ['GVCN bấm <b>Xác nhận meeting</b> (MT3 SOS 3: có cả phụ huynh) thì BPXL xếp lịch họp, bạn ghi kết quả meeting, TVV của em báo PH; hạn theo Hạn mặc định.',
      'Xem tiến độ: hồ sơ em › tab <b>Ý thức & Phối hợp</b> › <b>Phối hợp SOS</b>; cột báo PH ghi “Chờ TVV” hoặc kết quả.', 'Kết quả meeting là việc của bạn: <b>Công việc › Báo PH</b>, ghi kết quả rồi <b>Hoàn thành</b> (chi nhánh chưa có CX: Head).'],
    tuKhac: ['sos 3', 'ý thức', 'gđcn', 'họp', 'report 4', 'meeting'],
  },
  {
    id: 'thi-that', ten: 'Ghi kết quả thi thật', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Kết quả thi thật' },
    loiTat: ['hoc-vien', 'p-sau-thi'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em (lộ trình FT hoặc KET / PET), bấm <b>Kết quả thi thật</b>.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>; nhập được cả khi em đã Lưu trữ.',
      'Lưu đủ kết quả: panel chuyển sang <b>Bước tiếp</b> — việc của Head hoặc TVV; CX chọn thay được.'],
    tuKhac: ['ielts', 'điểm thi', 'kết quả thi', 'exam result', 'ket', 'pet'],
  },
  {
    ...tvv('sua-hv'),
    buoc: ['Ở hồ sơ em, bấm <b>Sửa thông tin</b> (liên hệ, Dự kiến thi, Target, ghi chú).', 'Đổi Target: ghi <b>Lý do đổi Target</b>. Đổi được cả Lộ trình đang học, Môn học.',
      'Cả lớp: hồ sơ lớp › ⋯ <b>Thao tác khác</b> › <b>Sửa thông tin học viên</b>.'],
  },
  { ...tvv('them-hv'), buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Thêm học viên</b> (một em, hoặc <b>Dán vùng bảng từ Excel / Google Sheets</b> rồi <b>Đọc nội dung đã dán</b>).',
    'Lớp mới: <b>⋯</b> › <b>Thao tác trang</b> › <b>+ Lớp mới</b>. Mọi chi nhánh; Dán Excel chỉ để thêm học viên; phân công giáo viên do Head làm.'] },
  { ...tvv('xuat-ds'), buoc: ['Mở <b>Học viên & Lớp</b>, đặt bộ lọc, bấm <b>Xuất Excel</b>.', 'Ngăn xuất đúng danh sách đang lọc (CX không có mẫu Báo cáo PH).'] },
  { ...tvv('phan-tich'), buoc: ['Mở <b>Phân tích</b>; chi nhánh của bạn; tab <b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> (lớp thường: <b>Test</b>) · <b>Giáo viên</b> · <b>Ý thức</b>.',
    'Kỳ: <b>Toàn bộ</b> hoặc <b>Chọn khoảng tuần</b>; Chi nhánh mặc định một tháng, tab khác 2 tuần.', 'Bấm số mở danh sách tại trang; <b>Xuất Excel</b> ở hàng lọc.'] },
];

const THU_TU = ['xem-so', 'loc-hv', 'thi-that', 'meeting', 'tra-lai-vi-pham', 'doi-nguoi-han', 'dang-theo-doi', 'sua-hv', 'tam-dung', 'xem-case', 'lich-su', 'them-hv', 'tim-kiem', 'luu-tru', 'xuat-ds', 'phan-tich', 'tutor-xem', 'tutor-xuat'];

export const HD_CX: HuongDan = {
  viec: [],
  lam: THU_TU.map((id) => [...VIEC_CX, ...VIEC_TVV, VIEC_TUTOR.xem, VIEC_TUTOR.xuat].find((v) => v.id === id)!),   // TU12: CX xem trang Tutor, xuất số buổi
  tuan: [
    { nhip: 'Hằng ngày', viec: ['xem-so', 'loc-hv'] },
    { nhip: 'Hằng tháng', viec: ['phan-tich', 'xuat-ds', 'tutor-xuat'] },
    { nhip: 'Khi có', viec: ['sua-hv', 'xem-case', 'meeting', 'tra-lai-vi-pham', 'doi-nguoi-han', 'dang-theo-doi', 'them-hv', 'lich-su', 'tim-kiem', 'luu-tru', 'tam-dung', 'thi-that', 'tutor-xem'] },
  ],
  /* HD3-3: chỉ trường hợp CX gặp (nguồn: `docs/anh/hd3-3-tvv-cx/khop-khac.md`); N52: CX không có việc của mình. */
  tinhHuong: TINH_HUONG_CX,
  vaiKhac: [
    ...VAI_KHAC_TVV,
    { ten: 'Báo PH vi phạm, chốt ngày thi', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'ngày thi', 'parent', 'exam date'] },
    { ten: 'Xuất báo cáo PH, đổi lộ trình đang học', cua: 'việc của TVV', tuKhac: ['báo cáo phụ huynh', 'lộ trình', 'môn học', 'route'] },
    { ten: 'Chọn bước tiếp sau thi', cua: 'việc của Head, TVV', tuKhac: ['bước tiếp', 'lộ trình mới', 'next step'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Năm ô toàn hệ thống và bảng Theo chi nhánh.', sau: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [...KHONG],
      muc: [
        { id: 'cx-tq-so', ten: 'Theo chi nhánh', buoc: ['Bảng (cùng bảng Quản trị): Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa có PA · Thi tháng này; hàng cuối <b>Toàn hệ thống</b>.', 'Bấm dòng một chi nhánh: trang chuyển sang chi nhánh đó (như ô <b>Chi nhánh</b> đầu trang).'] },
        { id: 'cx-tq-dau', ten: 'Đầu trang', buoc: ['Link <b>Lịch thi ›</b> · <b>Báo cáo ›</b> (mở tab <b>Chi nhánh</b> của Phân tích).', 'Chuông: khối <b>Việc cần làm</b> (Kết quả meeting, việc được giao cho bạn) và khối <b>Cập nhật</b>.'] },
      ],
    },
    { ...HD_TVV.man.find((m) => m.id === 'phan-tich')!, /* GD-8: TVV không còn Tổng quan (Trước = Công việc) — CX còn. */ dangO: { cau: 'Thống kê theo kỳ: chi nhánh, thi thật, SOS.', truoc: { chu: 'Tổng quan', duong: '/' } }, muc: [{ id: 'cx-pt', ten: 'Tab phân tích', buoc: ['<b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> · <b>Giáo viên</b> · <b>Ý thức</b> (Phân tích V2), như Head.',
      'Mọi chi nhánh; <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>; bấm số mở danh sách ngay tại trang; <b>Xuất Excel</b> ở hàng lọc.'],
      chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }] },
    manTutor('cx'),
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
    /* N52: CX xem Test, Công việc (xem / làm thay), Họp đơn vị như QL — không việc của mình. */
    {
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', TEST, '/nhap-diem', '/bang-diem-thuong'],
      dangO: { cau: 'Test của một tuần: lớp có Test, bài chưa chấm.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [...KHONG],
      muc: [{ id: 'cx-lt', ten: 'Xem Test tuần', buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>; bấm dòng lớp mở lưới điểm để xem.', 'Nhập điểm, xếp / dời lịch Test là việc của GV, Admin.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Mọi việc trong phạm vi của bạn — xem, làm thay khi cần; Kết quả meeting và việc được giao là của bạn.', truoc: { chu: 'Tổng quan', duong: '/' } },
      muc: [{ id: 'cx-cv', ten: 'Xem, làm thay', buoc: ['Mặc định <b>Của tôi</b> khi bạn có việc riêng (Kết quả meeting, việc được giao), không có thì <b>Tất cả</b>; <b>Của GV</b> chỉ việc GV giữ; một GV: <b>Lọc thêm</b>.',
        'Bấm dòng mở việc ngay tại trang; lưu là làm thay — lịch sử ghi tên bạn, việc vẫn của người giữ.', '<b>Kết quả meeting</b> (nhóm Báo PH) và việc được giao ở <b>Vận hành</b> là việc bạn làm; việc bạn giao người khác theo dõi ở bảng Vận hành.'] }],
    },
    { id: 'yeu-cau', ten: 'Yêu cầu của tôi', duong: [`${CV}/yeu-cau`], dangO: { cau: 'Đề nghị bạn đã gửi và kết quả.', truoc: { chu: 'Công việc', duong: CV } },
      muc: [{ id: 'cx-yc', ten: 'Xem yêu cầu đã gửi', buoc: ['Mỗi dòng một đề nghị: trạng thái <b>Chờ</b> · <b>Đã duyệt</b> · <b>Từ chối</b>; bấm dòng xem chi tiết.'] }] },
    { id: 'van-hanh', ten: 'Vận hành', duong: [`${CV}/van-hanh`], dangO: { cau: 'Việc ngoài học viên, chia theo nhóm: người phụ trách, hạn, việc con.', truoc: { chu: 'Công việc', duong: CV } },
      muc: [{ id: 'cx-vh', ten: 'Giao việc, theo dõi', buoc: ['<b>+ Giao việc</b>: chọn <b>Hạng mục</b>, người phụ trách, hạn; thêm việc con, <b>Lặp lại</b>, tệp khi cần.', 'Bấm hàng nhóm để gập / mở; bấm dòng mở chi tiết, <b>Cập nhật tiến độ</b>.', '<b>Nhóm…</b>: tạo, đổi tên, sắp ▲▼, ẩn nhóm của chi nhánh.'] }] },
    { id: 'bao-cao', ten: 'Họp đơn vị', duong: [`${CV}/bao-cao`], dangO: { cau: 'Báo cáo tuần / tháng của các đơn vị (chỉ xem).', truoc: { chu: 'Công việc', duong: CV } },
      muc: [{ id: 'cx-bc', ten: 'Xem báo cáo đơn vị', buoc: ['Chọn kỳ và chi nhánh ở hàng lọc; bấm số mở danh sách ngay tại trang.'] }] },
    ...manHoSoVai(true),
    ...manPanelTvvCx(true),
  ],
  luat: [
    ...LUAT_TVV.filter((m) => m.id !== 'tvv-luat-thi-that' && m.id !== 'tvv-luat-bao-ph' && m.id !== 'tvv-luat-lo-trinh'),
    { id: 'cx-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['CX nhập được, cả khi em đã Lưu trữ.', 'Bước tiếp: việc của Head hoặc TVV, hạn {han:buoc_tiep_sau_thi} từ ngày có kết quả (<b>Gia hạn</b> được); CX chọn thay được.'] },
    { id: 'cx-luat-lo-trinh', ten: 'Lộ trình, môn học', buoc: ['TVV, GVCN, Head, CX đổi được Lộ trình đang học và Môn học.', 'Cuối khoá: CX chỉ xem, Head chốt. Xét lại lộ trình: CX chỉ xem.'] },
  ],
  tu: [
    ...TU_TVV.filter((x) => x.ten !== 'HV của tôi'),
    { ten: 'Meeting CX/GĐCN', nghia: 'Buổi gặp em (có thể cả phụ huynh) với CX hoặc Giám đốc chi nhánh — SOS 3 hoặc Ý thức bậc 4.' },
  ],
};
