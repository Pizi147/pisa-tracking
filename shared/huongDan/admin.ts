/**
 * Hướng dẫn ADMIN — HD-V2 (b). Admin chi nhánh lo Mock Test: Tổng quan "Mock Test", Test đủ ba tab, Công việc chỉ nhóm Chấm điểm. Không huỷ / khôi phục
 * lượt, không đổi Target / lộ trình, Case / Ý thức chỉ xem (seed/data.ts `office_admin`). `lam` là MỘT nguồn (xem `ql.ts`); mục chung của màn GV lấy qua `mucGv`.
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
      buoc: ['Mở <b>Công việc</b> (chỉ nhóm <b>Chấm điểm</b> của chi nhánh): bài GV chưa nhập; ô <b>▾</b> chọn một GV.', 'Bấm <b>Nhập hộ</b> ở dòng, gõ điểm; em vắng gõ <b>-</b>.',
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
      loiChinh: { man: 'tong-quan', chu: 'Tổng quan › Mock Test', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Ba số Mock Test của chi nhánh — bấm để mở.' } },
      buoc: ['Ba ô: <b>Lượt MT tuần này</b> · <b>Bài chưa nhập điểm</b> · <b>HV chưa đủ MT</b>; bấm số mở đúng chỗ.', '<b>Lịch sắp tới</b>: <b>Xem toàn bộ lịch ›</b> mở Kế hoạch Test.'],
      tuKhac: ['số liệu', 'mock test', 'thống kê', 'numbers'],
    },
    {
      id: 'xep-lich', ten: 'Xếp, dời lịch MT', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test', duong: KH, chi: { hd: 'kht-loc', duong: KH, chu: 'Lọc lớp và xếp nhiều MT ở hàng này.' } },
      buoc: ['Mở <b>Test › Kế hoạch Test</b>: <b>Xếp nhiều MT…</b> (FT) · <b>Xếp lịch Test…</b> (lớp thường); chip <b>Chưa đủ MT</b> chỉ lớp có em cần xếp tiếp.',
        'Một kỹ năng: bấm ô MT — mỗi môn <b>Dời</b> (chọn tuần = xếp lại từ đầu) · <b>Vắng</b>, rồi <b>Lưu</b>.', '<b>⋯</b>: <b>Huỷ điểm</b> · <b>Nhật ký</b> · <b>Xóa lịch</b>; mục ghi "Chỉ Quản lý" thì nhờ QL.'],
      tuKhac: ['dời lịch', 'xếp lịch', 'lịch mt', 'schedule', 'reschedule'],
    },
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này, bài quá hạn chấm', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: TEST },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới (hạn dd/mm trên từng lớp); bấm dòng lớp mở lưới điểm.'],
      tuKhac: ['lịch test', 'quá hạn', 'schedule'],
    },
    {
      id: 'xuat-test', ten: 'Xuất Excel kế hoạch, điểm Test', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test › Xuất Excel', duong: KH },
      loiTat: ['lich-test'], cung: 'xuất kết quả Test.',
      buoc: ['<b>Xuất Excel</b>: Kế hoạch Test 13 cột theo bộ lọc đang xem.', '<b>Xuất điểm Test</b>: <b>Điểm + nhận xét</b> hoặc <b>Chỉ điểm</b>; theo tuần, theo lớp hoặc lớp + khoảng tuần.'],
      tuKhac: ['excel', 'xuất', 'export', 'download'],
    },
    /* ---------------------------------------------------------------- Học viên và lớp */
    {
      id: 'sua-hv', ten: 'Sửa thông tin học viên', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Sửa thông tin' },
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Sửa thông tin</b>: họ tên, ngày sinh, liên hệ.', 'Target, lộ trình: chỉ xem — Quản lý / TVV sửa.'],
      tuKhac: ['họ tên', 'ngày sinh', 'liên hệ', 'edit student'],
    },
    {
      id: 'lich-thi', ten: 'Xem lịch thi, xuất Excel', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Lịch thi', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      buoc: ['Mở <b>Học viên & Lớp</b>, góc <b>Lịch thi</b>.', '<b>Xuất Excel · n HV</b>: xuất đúng danh sách đang lọc.'],
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
      id: 'phan-tich', ten: 'Xem thống kê theo kỳ', nhom: 'khac',
      loiChinh: { man: 'phan-tich', chu: 'Tổng quan › Phân tích', duong: '/phan-tich', chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
      buoc: ['Mở <b>Phân tích</b>; chọn <b>Từ tuần → Đến tuần</b> cho mọi tab (mặc định 2 tuần vừa qua).', 'Sáu tab: <b>Báo cáo HV</b> · <b>Phân tích GV</b> · <b>Test + SOS</b> · <b>Kết quả Test / Thi</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>; bấm số mở danh sách tại trang.'],
      tuKhac: ['thống kê', 'báo cáo', 'analytics', 'report'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-so-mt', 'xem-gv-tre'] },
    { nhip: 'Sau mỗi tuần Test', viec: ['nhap-ho', 'xem-lich-test'] },
    { nhip: 'Mỗi tuần', viec: ['xep-lich', 'xuat-test'] },
    { nhip: 'Khi có', viec: ['sua-hv', 'lich-thi', 'tim-kiem'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich'] },
  ],
  vaiKhac: [
    { ten: 'Duyệt yêu cầu, đề xuất PA', cua: 'việc của QL', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Dời hạn chấm, huỷ lượt', cua: 'việc của QL', tuKhac: ['dời hạn', 'huỷ điểm', 'reschedule'] },
    { ten: 'Đổi Target, lộ trình', cua: 'việc của QL', tuKhac: ['target', 'lộ trình', 'tutor'] },
    { ten: 'Chuyển lớp', cua: 'việc của QL', tuKhac: ['đổi lớp', 'chuyển lớp', 'change class', 'transfer'] },
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
      dangO: { cau: 'Thống kê theo kỳ: học viên, GV, Test, PA, Ý thức.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_QL],
      muc: [{ id: 'ad-pt', viec: 'phan-tich', ten: 'Sáu tab phân tích', buoc: ['<b>Từ tuần → Đến tuần</b> cho mọi tab, thêm <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>.', 'Bấm số mở danh sách ngay tại trang.'] }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp trong chi nhánh; xem nhanh một em.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [{ ten: 'Chuyển lớp, Target', cua: 'việc của QL' }],
      muc: [mucGv('hoc-vien', 'hv-tim'), { id: 'ad-hvl-goc', ten: 'Góc nhìn', buoc: ['<b>Tất cả</b> · <b>Cần làm</b>; phạm vi chi nhánh của bạn.', 'Bấm dòng em mở panel một em.'], chi: { hd: 'hvl-goc', duong: HV, chu: 'Góc nhìn ở hàng này.' } }],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: em và điểm Mock Test của lớp.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Chuyển lớp, Target', cua: 'việc của QL' }],
      muc: [{ id: 'ad-lop-xem', ten: 'Xem lớp', buoc: ['Tab <b>Học viên</b>: Cách xem <b>Tổng hợp</b>, <b>Thông tin lớp</b>.', 'Cuối trang: <b>Điểm Mock Test của lớp</b>.'] }],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: điểm, Case, ý thức, lộ trình (chỉ xem); sửa thông tin.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Đổi Target, lộ trình', cua: 'việc của QL' }, { ten: 'Xác nhận Case, PA', cua: 'việc của GV' }],
      muc: [{ id: 'ad-hv', ten: 'Hồ sơ em', buoc: ['<b>Sửa thông tin</b> (Target chỉ xem) · <b>Lịch sử</b>.', 'Ba tab <b>Học thuật</b> · <b>Ý thức & Phối hợp</b> · <b>Lộ trình & lớp</b>: chỉ xem.'] }],
    },
    {
      /* Khối "Test tuần này" chỉ có khi tuần có Test — chi nhánh nhỏ thường trống, nên Lịch Test tuần không "Chỉ cho tôi". */
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', TEST],
      dangO: { cau: 'Test của một tuần cả chi nhánh: quá hạn chấm, lớp có Test.', truoc: { chu: 'Kế hoạch Test', duong: KH }, sau: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_QL],
      muc: [
        { id: 'lt-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Bấm dòng lớp: lưới điểm mở ngay dưới.', 'Gõ điểm; sửa ô ngoài phân công: ghi <b>Lý do sửa</b>.'] },
        { id: 'lt-xuat', viec: 'xuat-test', ten: 'Xuất Excel kết quả Test', buoc: ['<b>Xuất Excel</b> kết quả Test theo phạm vi của bạn; cột <b>Email</b> ngay sau Tên.'] },
      ],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: [KH],
      dangO: { cau: 'Xếp, dời lịch MT, Progress, Final các lớp.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [KHONG_QL],
      muc: [
        { id: 'ad-kh-xoa', ten: 'Xóa lịch, ghi chú', buoc: ['⋯ đầu hộp › <b>Xóa lịch</b> → đợt về <b>Chưa xếp</b> (đã có điểm / đã làm bài: mục mờ).', 'Ô <b>Ghi chú lịch Test</b> trong hộp; <b>+ Ghi chú lớp</b> dưới bảng.'] },
        { id: 'ad-kh-tim', ten: 'Tìm lớp, học viên', buoc: ['Gõ vào <b>Tìm lớp, học viên hoặc email…</b>: chọn em → lớp mở, hàng em được đánh dấu.'] },
      ],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp', duong: ['/test/diem-lop'],
      dangO: { cau: 'Gõ điểm một lượt Test của cả lớp.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'dl-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>).', '<b>Chỉ ô còn trống</b> để nhập nốt.'] }],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test của một em.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'nd-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Gõ điểm; Enter sang ô còn nhập kế.', 'Em vắng: gõ <b>-</b>.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Bài chấm của GV trong chi nhánh (nhóm Chấm điểm).', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_QL, { ten: 'Xác nhận Case, PA', cua: 'việc của GV' }],
      muc: [{ id: 'ad-cv', ten: 'Lọc bài chấm', buoc: ['Chip <b>⚠ quá hạn</b>; ô <b>▾</b> chọn một GV.'] }],
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
      muc: [{ id: 'pn-go', viec: 'nhap-ho', ten: 'Nhập hộ, nhập bù điểm', buoc: ['Gõ điểm em còn trống; Enter sang ô kế.', 'Em vắng: gõ <b>-</b>.', 'Xong: <b>Lớp tiếp</b> / <b>Việc tiếp</b>.'] }],
    },
  ],
  luat: [
    ...luatGv('han-cham', 'dau-gach'),
    { id: 'ad-luat-quyen', ten: 'Admin làm / không làm', buoc: ['Làm: xếp / dời lịch Test, nhập bù / sửa điểm, sửa thông tin HV.', 'Chỉ Quản lý: dời hạn chấm, huỷ / khôi phục lượt, Target, lộ trình.', 'Case, Ý thức, Phối hợp: chỉ xem.'] },
  ],
  tu: HD_GV.tu.filter((x) => ['MT (Mock Test)', 'Lớp thường (không phải FT)', 'Kỳ vọng', 'SOS 1 · 2 · 3', 'GVCN · GVBM', 'Speaking chấm chéo', 'KCK', 'Mã tuần', 'QL (Quản lý)'].includes(x.ten)),
};
