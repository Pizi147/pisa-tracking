/**
 * Hướng dẫn ADMIN — HD-V2 (b), HD-V3-B (13/11, đối chiếu `docs/superpowers/specs/2026-11-13-huong-dan-v3/doi-chieu-ql-admin.md`). Admin chi nhánh lo Mock Test: Tổng quan "Mock Test", Test đủ hai tab,
 * Công việc chỉ nhóm Chấm điểm + Xuất báo cáo PH. Không huỷ / khôi phục lượt, không đổi Target / môn học, Case / Ý thức chỉ xem; ĐƯỢC đổi lộ trình (chủ SP 11/11) và sửa lịch lớp thường
 * (seed/data.ts `office_admin`, `monDangKy.ts`, `permissions.ts`). `lam` là MỘT nguồn (xem `ql.ts`); mục chung của màn GV lấy qua `mucGv`.
 */
import { HD_GV } from './gv.ts';
import { luatGv } from './ql.ts';
import type { HuongDan, MucHd } from './kieu.ts';

const CV = '/cong-viec';
const HV = '/hoc-vien';
const TEST = '/test/lich';
const KH = '/test/ke-hoach';
const KHONG_QL = { ten: 'Dời hạn chấm, huỷ lượt', cua: 'việc của QL' } as const;

const mucGv = (man: string, id: string): MucHd => HD_GV.man.find((m) => m.id === man)!.muc.find((m) => m.id === id)!;

export const HD_ADMIN: HuongDan = {
  viec: [],
  lam: [
    /* ---------------------------------------------------------------- Điểm */
    {
      id: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', nhom: 'diem',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chấm điểm', duong: CV, chi: { hd: 'cv-loc-them', duong: CV, chu: 'Lọc bài chấm theo một GV ở đây.' } },
      loiTat: ['tong-quan', 'lich-test', 'diem-lop', 'nhap-diem', 'p-nhap-diem'], tatThem: ['⋯ hàng lớp › Nhập điểm'], cung: 'mở cùng lưới nhập.',
      buoc: ['Mở <b>Công việc</b> (tab <b>Chấm điểm</b> của chi nhánh): bài GV chưa nhập; ô <b>▾</b> chọn một GV.', 'Bấm <b>Nhập hộ</b> ở dòng, gõ điểm; em vắng gõ <b>-</b>.',
        'Nhập bù hoặc sửa ô ngoài phân công: ghi <b>Lý do sửa</b> (tuỳ chọn); nhật ký ghi lại người sửa.'],
      tuKhac: ['nhập bù', 'chấm thay', 'sửa điểm', 'điểm', 'enter score', 'grade'],
    },
    {
      id: 'xem-gv-tre', ten: 'Xem GV nào còn nợ điểm', nhom: 'diem',
      loiChinh: { man: 'tong-quan', chu: 'Tổng quan › GV chấm quá hạn', duong: '/' },
      buoc: ['Ở <b>Tổng quan</b>, khối <b>GV chấm quá hạn</b>: ai còn bài quá hạn, bao lâu.', 'Bấm số GV mở panel; bấm dòng lớp để xem em còn trống rồi <b>Nhập hộ</b>.', 'GV quá hạn tự nhận thông báo; việc tự hết khi GV nhập đủ điểm.'],
      tuKhac: ['quá hạn', 'nợ điểm', 'chấm trễ', 'overdue', 'late'],
    },
    /* ---------------------------------------------------------------- Lịch Test */
    {
      id: 'xem-so-mt', ten: 'Xem số Mock Test của chi nhánh', nhom: 'lich',
      loiChinh: { man: 'tong-quan', chu: 'Tổng quan › Mock Test', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Các số Mock Test của chi nhánh — bấm để mở.' } },
      buoc: ['Dải đầu trang: <b>Việc của tôi ›</b> · <b>Lượt MT tuần này</b> · <b>Bài chưa nhập điểm</b> · <b>HV chưa đủ MT</b>; bấm số mở đúng chỗ.', '<b>Lịch sắp tới</b>: <b>Xem toàn bộ lịch ›</b> mở Kế hoạch Test.'],
      tuKhac: ['số liệu', 'mock test', 'thống kê', 'numbers'],
    },
    {
      id: 'xep-lich', ten: 'Xếp, dời lịch MT', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test', duong: KH, chi: { hd: 'kht-loc', duong: KH, chu: 'Lọc lớp và xếp nhiều MT ở hàng này.' } },
      loiTat: ['p-xep-lich-mt'],
      buoc: ['Mở <b>Test › Kế hoạch Test</b>: <b>Xếp nhiều MT…</b> (FT) · <b>Xếp lịch Test…</b> (lớp thường); chip <b>Chưa đủ MT</b> chỉ lớp có em cần xếp tiếp.',
        'Một kỹ năng: bấm ô MT — mỗi môn <b>Dời</b> (chọn tuần = xếp lại từ đầu) · <b>Vắng</b>, rồi <b>Lưu</b>.', '<b>⋯</b>: <b>Huỷ điểm</b> · <b>Lịch sử</b> · <b>Xóa lịch</b>; mục ghi "Chỉ Quản lý" thì nhờ QL.'],
      tuKhac: ['dời lịch', 'xếp lịch', 'lịch mt', 'schedule', 'reschedule'],
    },
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này, bài quá hạn chấm', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: TEST },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới (hạn dd/mm trên từng lớp); bấm dòng lớp mở lưới điểm.'],
      tuKhac: ['lịch test', 'quá hạn', 'schedule'],
    },
    {
      id: 'xuat-test', ten: 'Xuất Excel điểm Test, lịch Test', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test › Xuất Excel…', duong: KH, chi: { hd: 'test-xuat', duong: KH, chu: 'Bấm <b>Xuất Excel…</b> ở hàng tiêu đề.' } },
      loiTat: ['lich-test', 'p-xuat'], cung: 'cùng nút Xuất Excel… ở hai trang Test.',
      buoc: ['Bấm <b>Xuất Excel…</b> ở hàng tiêu đề Lịch Test tuần hoặc Kế hoạch Test; panel có hai tab <b>Điểm Test</b> · <b>Lịch Test</b>.',
        'Tab <b>Điểm Test</b>: chọn khung lớp, chi nhánh, lớp; thời gian <b>Theo tuần</b> · <b>Theo tháng</b> · <b>Theo đợt</b>; <b>Mọi lượt</b> hoặc <b>Chỉ lượt đủ điểm</b>; cột <b>Gọn</b> · <b>Gọn + nhận xét</b> (chỉ Fast Track) · <b>Đầy đủ</b>.',
        'Tab <b>Lịch Test</b> (Fast Track): lịch MT các lớp theo bộ lọc; bấm <b>Xuất Excel</b> ở chân panel.'],
      tuKhac: ['excel', 'xuất', 'export', 'download', 'điểm test', 'lịch mt'],
    },
    /* ---------------------------------------------------------------- Học viên và lớp */
    {
      id: 'xuat-bc-ph', ten: 'Xuất báo cáo PH của lớp', nhom: 'hv',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Vận hành › Báo cáo PH', duong: CV },
      loiTat: ['ho-so-lop'], cung: 'mở cùng danh sách báo cáo.',
      buoc: ['Lớp đã đủ báo cáo: mở <b>Công việc</b>, tab <b>Vận hành</b>, mục <b>Báo cáo PH</b>, dòng <b>Xuất báo cáo PH</b> (hiện 7 ngày kể từ ngày lớp đủ; đợt quá hạn còn thiếu em cũng hiện 7 ngày).',
        'Bấm <b>Xuất PDF lớp</b> hoặc <b>Xuất Excel lớp</b>: file tải ngay, không chuyển trang.', 'Thêm hoặc bỏ đợt: hồ sơ lớp, tab <b>Báo cáo PH</b> › <b>+ Đợt báo cáo</b> · <b>Không báo cáo đợt này</b>; viết hộ là việc của QL.'],
      tuKhac: ['báo cáo ph', 'phụ huynh', 'pdf', 'parent report', 'export'],
    },
    {
      id: 'sua-lich-lop', ten: 'Sửa lịch lớp thường', nhom: 'hv',
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ › Thông tin lớp' },
      buoc: ['Mở hồ sơ lớp thường, bấm <b>⋯ › Thông tin lớp</b>.', 'Đổi tuần khai giảng, tuần Progress, tuần Final; lớp Fast Track nhờ Quản lý.'],
      tuKhac: ['lịch lớp', 'tuần final', 'tuần progress', 'khai giảng', 'class schedule'],
    },
    {
      id: 'sua-hv', ten: 'Sửa thông tin học viên, đổi lộ trình', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Sửa thông tin' },
      loiTat: ['p-sua-thong-tin'],
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Sửa thông tin</b>: họ tên, ngày sinh, liên hệ.', '<b>Lộ trình đang học</b> là của em, không theo lớp: Admin đổi được (LT1 · LT2 · RF). Target, môn học: nhờ Quản lý / TVV.'],
      tuKhac: ['họ tên', 'ngày sinh', 'liên hệ', 'lộ trình', 'edit student'],
    },
    {
      id: 'lich-thi', ten: 'Xem lịch thi, xuất Excel', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Lịch thi', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Bấm tab <b>Lịch thi</b> ở hàng này.' } },
      loiTat: ['p-xuat-ds'],
      buoc: ['Mở <b>Học viên & Lớp</b>, tab <b>Lịch thi</b>.', '<b>Xuất Excel</b>: mẫu <b>Danh sách</b> hoặc <b>Báo cáo PH</b> (chọn tháng), theo bộ lọc đang xem; bấm nút xuất ở chân panel.'],
      tuKhac: ['excel', 'xuất', 'export', 'ngày thi'],
    },
    {
      id: 'tim-kiem', ten: 'Tìm em, lớp, GV', nhom: 'hv',
      loiChinh: { chu: 'Ô tìm trên thanh trên', chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
      buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp · GV</b>; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.'],
      tuKhac: ['tìm', 'search', 'find', 'ft101'],
    },
    /* ---------------------------------------------------------------- Khác */
    {
      id: 'chuong', ten: 'Xem việc cần làm ở chuông', nhom: 'khac',
      loiChinh: { chu: 'Chuông trên thanh trên' },
      buoc: ['Bấm chuông cạnh <b>?</b>: khối <b>Việc cần làm</b> gom theo loại, ghi chi nhánh, quá hạn tô đỏ, hôm nay tô vàng; số trên chuông bằng số ở <b>Công việc</b>.', 'Khối <b>Cập nhật</b> là tin cần biết: <b>Xem tất cả</b>, <b>Đánh dấu đã đọc</b>.'],
      tuKhac: ['thông báo', 'chuông', 'notification', 'bell'],
    },
    {
      id: 'phan-tich', ten: 'Xem thống kê theo kỳ, xuất Excel', nhom: 'khac',
      loiChinh: { man: 'phan-tich', chu: 'Phân tích', duong: '/phan-tich', chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
      buoc: ['Mở <b>Phân tích</b>, chọn tab: <b>Chi nhánh</b> (mặc định một tháng) · <b>SOS</b> · <b>Thi thật</b> · <b>Giáo viên</b> (mặc định 2 tuần); bạn không có tab Ý thức.',
        'Đổi khoảng bằng <b>Từ tuần</b> → <b>Đến tuần</b>, <b>Toàn bộ</b> hoặc <b>Chọn khoảng tuần</b>; bấm một số là mở danh sách ngay tại trang.', '<b>Xuất Excel</b> ở mọi tab; <b>In</b> ra A4 ngang ở tab Chi nhánh.'],
      tuKhac: ['thống kê', 'báo cáo', 'excel', 'analytics', 'report'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-so-mt', 'xem-gv-tre', 'chuong'] },
    { nhip: 'Sau mỗi tuần Test', viec: ['nhap-ho', 'xem-lich-test'] },
    { nhip: 'Mỗi tuần', viec: ['xep-lich', 'xuat-test', 'xuat-bc-ph'] },
    { nhip: 'Khi có', viec: ['sua-hv', 'sua-lich-lop', 'lich-thi', 'tim-kiem'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich'] },
  ],
  vaiKhac: [
    { ten: 'Duyệt yêu cầu, đề xuất PA', cua: 'việc của QL', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Dời hạn chấm, huỷ lượt', cua: 'việc của QL', tuKhac: ['dời hạn', 'huỷ điểm', 'reschedule'] },
    { ten: 'Đổi Target, môn học', cua: 'việc của QL', tuKhac: ['target', 'môn học', 'tutor'] },
    { ten: 'Chuyển lớp', cua: 'việc của QL', tuKhac: ['đổi lớp', 'chuyển lớp', 'change class', 'transfer'] },
    { ten: 'Viết hộ báo cáo PH', cua: 'việc của QL', tuKhac: ['viết hộ', 'báo cáo ph'] },
    { ten: 'Xác nhận Case, PA', cua: 'việc của GV', tuKhac: ['case', 'phương án', 'sos'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Số Mock Test của chi nhánh và GV chấm quá hạn.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [{ ten: 'Xếp, dời lịch Test', den: { chu: 'Kế hoạch Test', duong: KH } }, KHONG_QL],
      muc: [{ id: 'ad-tq-gv', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Khối <b>GV chấm quá hạn</b>: bấm số GV mở panel, bấm dòng lớp.', 'Bấm <b>Nhập hộ</b>, gõ điểm em còn trống.'] }],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      dangO: { cau: 'Thống kê theo kỳ: chi nhánh, SOS, thi thật, giáo viên.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_QL],
      muc: [{ id: 'ad-pt', viec: 'phan-tich', ten: 'Bốn tab phân tích', buoc: ['<b>Từ tuần</b> → <b>Đến tuần</b> cho mọi tab, thêm <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>.', 'Bấm số mở danh sách ngay tại trang; <b>Xuất Excel</b> ở cuối hàng lọc.'] }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp trong chi nhánh; xem nhanh một em.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [{ ten: 'Chuyển lớp, Target', cua: 'việc của QL' }],
      muc: [mucGv('hoc-vien', 'hv-tim'), { id: 'ad-hvl-goc', ten: 'Xem và lọc', buoc: ['Ô <b>Xem</b>: phạm vi chi nhánh của bạn; tab <b>Tất cả</b> · <b>Lịch thi</b>.', 'Bấm dòng em mở panel một em.'], chi: { hd: 'hvl-goc', duong: HV, chu: 'Tab và lọc của trang ở hàng này.' } }],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: em, điểm Mock Test của lớp, Báo cáo PH.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Chuyển lớp, Target', cua: 'việc của QL' }],
      muc: [
        { id: 'ad-lop-xem', ten: 'Xem lớp', buoc: ['Tab <b>Học viên</b>: bảng em của lớp.', 'Cuối trang: <b>Điểm Mock Test của lớp</b>.'] },
        { id: 'ad-lop-sua-lich', viec: 'sua-lich-lop', ten: 'Sửa lịch lớp thường', buoc: ['<b>⋯ › Thông tin lớp</b>: tuần khai giảng, Progress, Final.'] },
        { id: 'ad-lop-bc-ph', viec: 'xuat-bc-ph', ten: 'Báo cáo PH của lớp', buoc: ['Tab <b>Báo cáo PH</b>: chọn <b>Đợt báo cáo</b>; <b>Xuất PDF lớp</b> · <b>Xuất Excel lớp</b>.', '<b>+ Đợt báo cáo</b> · <b>Không báo cáo đợt này</b>.'] },
      ],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: điểm, Case, ý thức, lộ trình; sửa thông tin và lộ trình.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Đổi Target, môn học', cua: 'việc của QL' }, { ten: 'Xác nhận Case, PA', cua: 'việc của GV' }],
      muc: [{ id: 'ad-hv', viec: 'sua-hv', ten: 'Sửa thông tin, đổi lộ trình', buoc: ['<b>⋯ › Sửa thông tin</b> (có <b>Lộ trình đang học</b>) · <b>⋯ › Lịch sử</b>.', 'Ba tab <b>Học thuật</b> · <b>Ý thức & Phối hợp</b> · <b>Lộ trình & lớp</b>: chỉ xem.'] }],
    },
    {
      id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
      dangO: { cau: 'Lớp đã kết thúc và em đã lưu trữ (từ ô tìm “Tìm trong HV lưu trữ ›”); chỉ xem.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Tạm dừng, kết thúc học, Quay lại học', cua: 'việc của QL' }],
      muc: [{ id: 'ad-luu-tru', ten: 'Xem Lưu trữ', buoc: ['Ba tab: <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b> · <b>Đã xoá</b>; chia theo chi nhánh, học viên theo lớp cuối.', 'Bấm tên em hoặc lớp mở hồ sơ.'] }],
    },
    {
      id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
      dangO: { cau: 'Một GV: lớp dạy, số theo khoảng tuần (chỉ xem).', truoc: { chu: 'Phân tích', duong: '/phan-tich' } },
      khongLam: [{ ten: 'Sửa kỹ năng của GV', cua: 'việc của QL' }],
      muc: [{ id: 'ad-hsgv', ten: 'Xem hồ sơ giáo viên', buoc: ['<b>Từ tuần</b> → <b>Đến tuần</b>: số đúng hạn, đạt kỳ vọng Test, Case theo khoảng đó.', 'Bấm số mở danh sách.'] }],
    },
    {
      /* Khối "Test tuần này" chỉ có khi tuần có Test — chi nhánh nhỏ thường trống, nên Lịch Test tuần không "Chỉ cho tôi". */
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', TEST],
      dangO: { cau: 'Test của một tuần cả chi nhánh: quá hạn chấm, lớp có Test.', truoc: { chu: 'Kế hoạch Test', duong: KH }, sau: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_QL],
      muc: [
        { id: 'lt-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Bấm dòng lớp: lưới điểm mở ngay dưới.', 'Gõ điểm; sửa ô ngoài phân công: ghi <b>Lý do sửa</b>.'] },
        { id: 'lt-xuat', viec: 'xuat-test', ten: 'Xuất Excel kết quả Test', buoc: ['<b>Xuất Excel…</b> ở hàng tiêu đề: tab <b>Điểm Test</b> theo phạm vi của bạn; cột <b>Email</b> ngay sau Tên.'] },
      ],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: [KH],
      dangO: { cau: 'Xếp, dời lịch MT, Progress, Final các lớp.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [KHONG_QL],
      muc: [
        { id: 'ad-kh-xoa', ten: 'Xóa lịch, ghi chú', buoc: ['⋯ đầu hộp › <b>Xóa lịch</b> → đợt về <b>Chưa xếp</b> (đã có điểm / đã làm bài: mục mờ).', 'Ô <b>Ghi chú lịch Test</b> trong hộp; <b>+ Ghi chú lớp</b> dưới bảng.'] },
        { id: 'ad-kh-tim', ten: 'Tìm lớp, học viên', buoc: ['Gõ vào <b>Tìm lớp, học viên hoặc email…</b>: chọn em → lớp mở, hàng em được đánh dấu.'] },
        { id: 'ad-kh-xuat', viec: 'xuat-test', ten: 'Xuất Excel kế hoạch, điểm Test', buoc: ['<b>Xuất Excel…</b> cạnh <b>Xếp nhiều MT…</b>: tab <b>Lịch Test</b> mở sẵn.'] },
      ],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp (link cũ)', duong: ['/test/diem-lop'],
      dangO: { cau: 'Link cũ: mở Lịch Test tuần cùng panel Nhập điểm của một lớp.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'dl-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>).', '<b>Chỉ ô còn trống</b> để nhập nốt.'] }],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test của một em.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'nd-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Gõ điểm; Enter sang ô còn nhập kế.', 'Em vắng: gõ <b>-</b>.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Bài chấm của GV trong chi nhánh (tab Chấm điểm) và việc Xuất báo cáo PH (tab Vận hành).', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_QL, { ten: 'Xác nhận Case, PA', cua: 'việc của GV' }],
      muc: [
        { id: 'ad-cv', ten: 'Lọc bài chấm', buoc: ['Ô <b>Mọi hạn</b> › <b>Quá hạn</b>; ô <b>▾</b> chọn một GV.'] },
        { id: 'ad-cv-bc-ph', viec: 'xuat-bc-ph', ten: 'Xuất báo cáo PH', buoc: ['Tab <b>Vận hành</b>, mục <b>Báo cáo PH</b>: dòng <b>Xuất báo cáo PH</b> của lớp đã đủ.', 'Bấm <b>Xuất PDF lớp</b> hoặc <b>Xuất Excel lớp</b>.'] },
      ],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.' },
      muc: [mucGv('ho-so-ca-nhan', 'hs-sua')],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [mucGv('huong-dan', 'hd-dung')],
    },
    /* ---------------------------------------------------------------- panel đang mở */
    {
      id: 'p-nhap-diem', ten: 'Nhập điểm đang mở', duong: [], panel: 'nhap-diem',
      dangO: { cau: 'Gõ điểm từng em cho một lượt Test.' },
      khongLam: [KHONG_QL],
      muc: [{ id: 'pn-go', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Gõ điểm em còn trống; Enter sang ô kế (lớp thường: ô môn hai tầng, kết quả dưới tên).', 'Em vắng: gõ <b>-</b>.', 'Xong: <b>Lớp tiếp</b> / <b>Việc tiếp</b>.'] }],
    },
    {
      id: 'p-xep-lich-mt', ten: 'Xếp lịch Test đang mở', duong: [], panel: 'xep-lich-mt',
      dangO: { cau: 'Xếp lịch MT cho một hay nhiều lớp.' },
      khongLam: [KHONG_QL],
      muc: [{ id: 'pxl-xep', viec: 'xep-lich', ten: 'Xếp, dời lịch MT', buoc: ['Chọn lớp, tuần từng MT; hai đợt trùng tuần thì máy chặn, cách đúng một tuần thì hỏi lại.', 'Lưu: đợt về lịch mới; khoá cuối tuần T6–CN theo công tắc <b>Mở sửa lịch Test</b>.'] }],
    },
    {
      id: 'p-sua-thong-tin', ten: 'Sửa thông tin đang mở', duong: [], panel: 'sua-thong-tin',
      dangO: { cau: 'Sửa thông tin và lộ trình của một em.' },
      khongLam: [{ ten: 'Chuyển lớp, Target', cua: 'việc của QL' }],
      muc: [{ id: 'pst-sua', viec: 'sua-hv', ten: 'Sửa thông tin học viên, đổi lộ trình', buoc: ['Sửa họ tên, ngày sinh, liên hệ; <b>Lộ trình đang học</b> đổi được (LT1 · LT2 · RF).', 'Target, môn học: nhờ Quản lý / TVV; <b>Lưu</b>.'] }],
    },
    {
      id: 'p-xuat-ds', ten: 'Xuất Excel học viên đang mở', duong: [], panel: 'xuat-ds',
      dangO: { cau: 'Xuất danh sách hoặc báo cáo PH của học viên theo bộ lọc.' },
      khongLam: [{ ten: 'Xuất điểm Test', den: { chu: 'Test › Kế hoạch Test › Xuất Excel…', duong: KH } }],
      muc: [{ id: 'pxd-xuat', viec: 'lich-thi', ten: 'Xem lịch thi, xuất Excel', buoc: ['Chọn <b>Mẫu</b>: <b>Danh sách</b> hoặc <b>Báo cáo PH</b> (chọn <b>Tháng</b>); <b>Phạm vi</b> theo bộ lọc hay cả chi nhánh.', 'Bấm nút xuất ở chân panel: tệp tải về máy, nhật ký ghi lại.'] }],
    },
    {
      id: 'p-xuat', ten: 'Xuất Excel đang mở', duong: [], panel: 'xuat-excel',
      dangO: { cau: 'Xuất điểm Test hoặc lịch Test các lớp trong chi nhánh của bạn.' },
      khongLam: [{ ten: 'Xếp, dời lịch Test', den: { chu: 'Kế hoạch Test', duong: KH } }],
      muc: [{ id: 'px-xuat', viec: 'xuat-test', ten: 'Xuất Excel điểm Test, lịch Test', buoc: ['Tab <b>Điểm Test</b> hoặc <b>Lịch Test</b>; chọn khung lớp, chi nhánh, lớp, thời gian.', 'Bấm <b>Xuất Excel</b> ở chân panel: tệp tải về máy, nhật ký ghi lại.'] }],
    },
  ],
  luat: [
    ...luatGv('han-cham', 'dau-gach'),
    { id: 'ad-luat-quyen', ten: 'Admin làm / không làm', buoc: ['Làm: xếp / dời lịch Test, nhập bù / sửa điểm, sửa thông tin HV, đổi lộ trình, sửa lịch lớp thường, xuất Excel và báo cáo PH.', 'Chỉ Quản lý: dời hạn chấm, huỷ / khôi phục lượt, Target, môn học.', 'Case, Ý thức, Phối hợp: chỉ xem.'] },
  ],
  tu: HD_GV.tu.filter((x) => ['MT (Mock Test)', 'Lớp thường (không phải FT)', 'Kỳ vọng', 'SOS 1 · 2 · 3', 'GVCN · GVBM', 'Chấm Speaking', 'KCK', 'Mã tuần', 'QL (Quản lý)'].includes(x.ten)),
};
