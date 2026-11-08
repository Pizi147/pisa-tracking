/**
 * Hướng dẫn GIÁO VIÊN (GVBM + GVCN + GV Speaking). HD-V2 (đặc tả `2026-11-05-huong-dan-v2/de-xuat.md`, mockup `thiet-ke/v14/huong-dan.html`,
 * bảng lối chính đã đối chiếu mã ở `thiet-ke/v14/huong-dan-ghi-chu.md` mục 1 + 3b): `lam` là MỘT nguồn — "Việc làm ở đây" của mỗi màn dựng từ
 * `loiChinh` / `loiTat` (phép HD-LOI, HD-MOT). PR đổi màn / nhãn nào thì sửa ở đây; `data-hd` phải có thật trong web/src (HD-CHI).
 */
import type { HuongDan } from './kieu.ts';

const CV = '/cong-viec';
const KHONG_XEP_MT = { ten: 'Xếp, dời lịch MT', cua: 'việc của QL' } as const;

export const HD_GV: HuongDan = {
  viec: [],
  lam: [
    /* ---------------------------------------------------------------- Điểm */
    {
      id: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final', nhom: 'diem',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chấm điểm', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Dòng <b>Nhập điểm</b> ở nhóm <b>Chấm điểm</b> — bấm để gõ điểm.' } },
      loiTat: ['lich-test', 'diem-lop', 'ho-so-lop', 'nhap-diem', 'p-nhap-diem'], tatThem: ['⋯ dòng em'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, nhóm <b>Chấm điểm</b>.', 'Bấm <b>Nhập điểm</b> ở dòng lớp.', 'Gõ điểm; em vắng gõ <b>-</b>; <b>Lưu · bài tiếp ›</b>.'],
      tuKhac: ['chấm', 'chấm bài', 'điểm', 'sửa điểm', 'mock test', 'progress test', 'final test', 'score', 'grade', 'marks'],
    },
    {
      id: 'nhap-mt-cu', ten: 'Nhập điểm MT cũ', nhom: 'diem', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Nhập điểm MT cũ', duong: CV },
      loiTat: ['lich-test'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, nhóm <b>Thiếu dữ liệu đánh giá</b>.', 'Dòng <b>Nhập điểm MT cũ</b> › <b>Nhập điểm</b>.', 'Gõ điểm các MT em đã làm, rồi lưu.'],
      tuKhac: ['mt cu', 'điểm cũ', 'old mock'],
    },
    {
      id: 'cham-s', ten: 'Chấm Speaking chéo', nhom: 'diem', chiS: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Speaking chấm chéo', duong: CV },
      loiTat: ['lich-test'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, nhóm <b>Speaking chấm chéo</b>, dòng <b>Chấm Speaking · n bài</b>.', 'Tìm em (tên, email), lọc lớp, bấm ô S để chấm.', '<b>Enter</b> sang em chưa chấm kế; không tính quá hạn.'],
      tuKhac: ['speaking', 'chấm chéo', 'cross marking'],
    },
    /* ---------------------------------------------------------------- Case và PA */
    {
      id: 'case-xac-nhan', ten: 'Xác nhận Case, PA', nhom: 'case',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Case học thuật', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Việc Case, PA nằm ở nhóm <b>Case học thuật</b>.' } },
      loiTat: ['ho-so-hv', 'ho-so-lop', 'p-case'], tatThem: ['Thông báo'], cung: 'mở cùng Case.',
      buoc: ['Mở <b>Công việc</b>, nhóm <b>Case học thuật</b>.', 'Bấm dòng: <b>Xác nhận Case</b>, <b>Mô tả Case</b>, <b>Xác nhận PA</b> hoặc <b>Thêm PA học thuật</b>.', 'Ghi nội dung, bấm nút lưu ở chân; hạn ở cuối dòng.'],
      tuKhac: ['phương án', 'sos', 'mô tả', 'confirm'],
    },
    {
      id: 'ket-qua-pa', ten: 'Ghi kết quả PA', nhom: 'case',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Case học thuật', duong: CV },
      loiTat: ['ho-so-hv', 'p-case'], cung: 'mở cùng Case.',
      buoc: ['PA đang chạy: ghi mỗi kỳ <b>2 tuần</b>, hạn <b>Thứ Ba</b> sau kỳ.', 'Bấm dòng <b>Ghi kết quả PA</b>: <b>Tiến triển (2 tuần)</b>, <b>Nhận xét</b>, <b>Lưu</b>.', 'Tới mốc: dòng "Kết quả cuối · tên PA", nút <b>Kết quả cuối</b>.'],
      tuKhac: ['kết quả', 'tiến triển', 'tutor', 'result'],
    },
    {
      id: 'tao-case', ten: 'Tạo Case tay', nhom: 'case',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › + Case cho một kỹ năng' },
      loiTat: ['ho-so-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng form Case.',
      buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>; bấm ô kỹ năng.', 'Bấm <b>+ Case cho …</b> ở khối <b>Case & phương án</b>.', 'Ghi mô tả, lưu.'],
      tuKhac: ['thêm Case', 'mở Case', 'new Case'],
    },
    {
      id: 'case-hoan-thanh', ten: 'Hoàn thành, mở lại, xoá Case', nhom: 'case',
      loiChinh: { man: 'p-case', chu: 'Trong Case' },
      buoc: ['<b>Hoàn thành Case</b>: chọn hướng xử lý, ghi kết luận.', 'Case đã xong: bấm <b>Mở lại</b>.', '<b>⋯ › Xoá Case</b>; xoá nhầm: <b>Hoàn tác</b> trong 5 giây.'],
      tuKhac: ['đóng Case', 'kết thúc Case', 'close Case', 'delete'],
    },
    {
      id: 'doi-chu-case', ten: 'Đổi người phụ trách Case', nhom: 'case', chiGvcn: true,
      loiChinh: { man: 'p-case', chu: 'Trong Case › Đổi người…' },
      buoc: ['Mở Case, bấm <b>Đổi người…</b> ở dải đầu.', 'Chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.'],
      tuKhac: ['phụ trách', 'giao Case', 'owner'],
    },
    /* ---------------------------------------------------------------- Học viên và lớp */
    {
      id: 'xem-case', ten: 'Xem mọi Case của em', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Case & phương án' },
      loiTat: ['hoc-vien'], cung: 'mở cùng Case.',
      buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>.', 'Bấm ô kỹ năng; khối <b>Case & phương án</b> hiện Case của kỹ năng đó.', 'Bấm Case để mở ngay trong cột.'],
      tuKhac: ['lịch sử Case', 'Case history'],
    },
    {
      id: 'vi-pham', ten: 'Ghi vi phạm', nhom: 'hv',
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ dòng em' },
      buoc: ['Mở hồ sơ lớp, tab <b>Học viên</b>.', 'Ở dòng em bấm <b>⋯ › + Ghi vi phạm</b>; hạn xử lý <b>5 ngày</b>.'],
      tuKhac: ['ý thức', 'kỷ luật', 'violation'],
    },
    {
      id: 'de-xuat-chuyen-lop', ten: 'Đề xuất chuyển lớp', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Đề xuất chuyển lớp…' },
      loiTat: ['ho-so-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Đề xuất chuyển lớp…</b>', 'Chọn <b>Lớp chuyển đến</b>, <b>Tuần bắt đầu</b>, ghi <b>Lý do</b>.', '<b>Gửi đề xuất</b>: QL duyệt trong 5 ngày.'],
      tuKhac: ['đổi lớp', 'chuyển lớp', 'sang lớp', 'change class', 'transfer'],
    },
    {
      id: 'ghi-mini-test', ten: 'Ghi Mini Test', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Ghi Mini Test', duong: CV },
      loiTat: ['ho-so-hv'], cung: 'mở cùng ô Mini Test.',
      buoc: ['Mở <b>Công việc</b>, bấm dòng <b>Ghi Mini Test</b>.', 'Gõ điểm Mini Test của em, rồi lưu.'],
      tuKhac: ['mini test', 'kết luận khoá'],
    },
    {
      id: 'thi-that', ten: 'Ghi kết quả thi thật', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Kết quả thi thật' },
      loiTat: ['hoc-vien'], cung: 'mở cùng panel.',
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Kết quả thi thật</b>.', 'Gõ điểm từng kỹ năng, lưu.'],
      tuKhac: ['ielts', 'điểm thi', 'exam result'],
    },
    {
      id: 'lich-thi', ten: 'Xem lịch thi, xuất Excel', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Lịch thi', duong: '/hoc-vien', chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      buoc: ['Mở <b>Học viên & Lớp</b>, góc <b>Lịch thi</b>.', '<b>Xuất Excel · n HV</b>: xuất đúng danh sách đang lọc.'],
      tuKhac: ['excel', 'xuất', 'export', 'ngày thi'],
    },
    /* ---------------------------------------------------------------- Lịch Test */
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này, bài quá hạn chấm', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: '/test/lich', chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Mỗi lớp một dòng — bấm dòng để gõ điểm.' } },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới — mỗi lớp một dòng.'],
      tuKhac: ['lịch test', 'quá hạn', 'schedule'],
    },
    /* ---------------------------------------------------------------- Khác */
    {
      id: 'xem-viec', ten: 'Xem việc của bạn', nhom: 'khac',
      loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV, chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' } },
      buoc: ['Mở <b>Công việc</b>: việc theo nhóm, quá hạn ở đầu, có ⚠.', 'Bấm dòng để làm ngay; lưu xong việc rời danh sách.'],
      tuKhac: ['việc', 'todo', 'tasks'],
    },
    {
      id: 'yeu-cau', ten: 'Theo dõi yêu cầu đã gửi', nhom: 'khac',
      loiChinh: { man: 'yeu-cau', chu: 'Công việc › Yêu cầu của tôi', duong: '/cong-viec/yeu-cau' },
      buoc: ['Mở <b>Công việc › Yêu cầu của tôi</b>.', 'Chờ duyệt · Đã duyệt · Bị từ chối (kèm lý do); bị từ chối: sửa và gửi lại.'],
      tuKhac: ['đề nghị', 'request'],
    },
    {
      id: 'so-cua-toi', ten: 'Xem số của bạn', nhom: 'khac',
      loiChinh: { man: 'ho-so-gv', chu: 'Tài khoản › Hồ sơ giáo viên' },
      loiTat: ['tong-quan'], cung: 'cùng số, gọn hơn.',
      buoc: ['Bấm tên bạn › <b>Hồ sơ giáo viên</b>.', 'Chọn <b>Từ tuần → Đến tuần</b>; bấm số mở danh sách.'],
      tuKhac: ['chỉ số', 'thống kê', 'kpi'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-viec', 'xem-lich-test'] },
    { nhip: 'Sau tuần Test', viec: ['nhap-diem', 'cham-s', 'case-xac-nhan'] },
    { nhip: '2 tuần một lần', viec: ['ket-qua-pa'] },
    { nhip: 'Khi có', viec: ['vi-pham', 'tao-case', 'de-xuat-chuyen-lop', 'nhap-mt-cu', 'case-hoan-thanh'] },
    { nhip: 'Cuối khoá', viec: ['ghi-mini-test', 'thi-that'] },
  ],
  vaiKhac: [
    { ...KHONG_XEP_MT, tuKhac: ['dời lịch', 'lịch mt', 'reschedule'] },
    { ten: 'Duyệt yêu cầu, đề xuất PA', cua: 'việc của QL', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Duyệt / chuyển lớp', cua: 'việc của QL', tuKhac: ['đổi lớp', 'chuyển lớp', 'change class', 'transfer'] },
    { ten: 'Khôi phục thứ đã xoá', cua: 'việc của QL', tuKhac: ['thùng rác', 'đã xoá', 'restore', 'undo'] },
    { ten: 'Xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
    { ten: 'Báo PH vi phạm', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'parent'] },
    { ten: 'Chốt ngày thi', cua: 'việc của TVV', tuKhac: ['ngày thi', 'exam date'] },
  ],
  man: [
    {
      /* NEN-V5 K10 + SV-TQ-GV #561: GV có Tổng quan — 4 số + hai khối lớp. */
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Số của bạn và các lớp bạn dạy, chủ nhiệm.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_XEP_MT],
      muc: [
        { id: 'tq-viec', ten: 'Bốn số của bạn', buoc: ['<b>Việc của tôi</b> · <b>Case đang xử lý</b> · <b>Đạt kỳ vọng Test</b> · <b>Tiến bộ</b>; bấm số mở danh sách.'],
          chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
        { id: 'tq-hai-khoi', ten: 'Kỹ năng tôi dạy · Lớp tôi chủ nhiệm', buoc: ['<b>Kỹ năng tôi dạy</b>: mỗi lớp một dòng — Đạt kỳ vọng Test, Tiến bộ, bài chờ chấm, Test sắp tới.', '<b>Lớp tôi chủ nhiệm</b>: Dưới kỳ vọng, SOS, Case, Thi tháng này; bấm số mở danh sách em.'],
          chi: { hd: 'tq-lop-toi-day', duong: '/', chu: 'Hai khối lớp của bạn ở đây.' } },
      ],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Mọi việc của bạn, quá hạn ở đầu.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_XEP_MT, { ten: 'Duyệt yêu cầu', cua: 'việc của QL' }],
      muc: [
        { id: 'cv-gop', ten: 'Làm cả lớp một lần', buoc: ['Dòng "n em" mở danh sách em; làm từng em hoặc cùng lúc.'] },
        { id: 'cv-qua-han', ten: 'Vì sao việc quá hạn', buoc: ['Qua hạn mà chưa Lưu: chữ cam + ⚠ ở cột hạn, nằm đầu nhóm.', 'Lưu xong là hết quá hạn ở mọi nơi.'] },
        { id: 'cv-loc', ten: 'Lọc việc', buoc: ['Chip <b>⚠ quá hạn</b> lọc mọi việc quá hạn; bấm lại để bỏ.', 'Nhóm việc gập / mở ở đầu nhóm.'],
          chi: { hd: 'cv-loc-them', duong: CV, chu: 'Lọc việc quá hạn ở đây.' } },
        { id: 'tq-lop', ten: 'Lớp tôi dạy', buoc: ['Cuối Công việc: các lớp bạn dạy và số bài chờ chấm.', 'Bấm tên lớp mở hồ sơ lớp.'],
          chi: { hd: 'tq-lop-toi-day', duong: CV, chu: 'Bấm tên lớp để mở hồ sơ lớp.' } },
      ],
    },
    {
      id: 'yeu-cau', ten: 'Yêu cầu của tôi', duong: ['/cong-viec/yeu-cau'],
      dangO: { cau: 'Đề nghị bạn đã gửi QL và kết quả.', truoc: { chu: 'Công việc', duong: CV } },
      khongLam: [{ ten: 'Duyệt yêu cầu', cua: 'việc của QL' }],
      muc: [],
    },
    {
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', '/test/lich'],
      dangO: { cau: 'Xem Test của một tuần và gõ điểm lớp bạn dạy.', truoc: { chu: 'Kế hoạch Test', duong: '/test/ke-hoach' }, sau: { chu: 'Công việc › Case học thuật', duong: CV } },
      khongLam: [KHONG_XEP_MT],
      muc: [
        { id: 'lt-nhap-diem', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', 'Bấm dòng lớp: lưới điểm mở ngay dưới.', 'Gõ điểm; em vắng gõ <b>-</b>.'],
          chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Mỗi lớp một dòng — bấm dòng để gõ điểm.' } },
      ],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: ['/test/ke-hoach'],
      dangO: { cau: 'Lịch MT, Progress, Final các lớp — bạn chỉ xem.', sau: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      khongLam: [KHONG_XEP_MT],
      muc: [{ id: 'kh-xem', ten: 'Xem lịch Test của lớp', buoc: ['Mỗi lớp một hàng, mỗi tuần một cột; ô có lượt Test.', 'Cần dời lịch: nhờ QL.'] }],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp', duong: ['/test/diem-lop'],
      dangO: { cau: 'Gõ điểm một lượt Test của cả lớp.', truoc: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      muc: [
        { id: 'dl-nhap-diem', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['Chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>).', '<b>Chỉ ô còn trống</b> để nhập nốt.'] },
      ],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test của một em.', truoc: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      muc: [
        { id: 'nd-go', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['Gõ điểm; Enter sang ô còn nhập kế.', 'Em vắng: gõ <b>-</b>; ô đã dời ghi "vắng W3 SEP".', 'MT mới nhất: ô thiếu <b>nhận xét</b> viền vàng — nên ghi, không chặn lưu.'] },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      dangO: { cau: 'Tìm em, lớp; xem nhanh một em không rời trang.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [{ ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em, lớp, GV', buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp · GV</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'hv-goc', ten: 'Ba góc nhìn', buoc: ['<b>Tất cả</b> (lọc <b>Đã thi · chờ kết quả</b>) · <b>Đang SOS</b> (SOS hiện tại, mỗi em một dòng) · <b>Cần làm</b>.', 'Bấm dòng em mở panel một em, không rời trang.'] },
      ],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: em, điểm các lượt, việc của lớp.', truoc: { chu: 'Học viên & Lớp', duong: '/hoc-vien' } },
      khongLam: [KHONG_XEP_MT],
      muc: [
        { id: 'lop-nhap-diem', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final', buoc: ['Bấm nút <b>Nhập điểm</b> đầu trang, hoặc <b>⋯</b> ở dòng em › <b>Nhập điểm</b>.', 'Chọn lượt và môn, gõ điểm.'] },
        { id: 'lop-hoc-vien', ten: 'Học viên của lớp', buoc: ['Đầu trang: thanh <b>Việc cần làm</b> của lớp — bấm việc làm ngay tại trang.', 'Bảng em: W1 · W2 riêng, bấm điểm W / S xem điểm thành phần; Case + PA mở dưới hàng.', 'Cuối trang: <b>Điểm Mock Test của lớp</b> (lớp thường: <b>Điểm Test của lớp</b>).'] },
        { id: 'lop-lich-su', ten: 'Xem lịch sử', buoc: ['Hồ sơ lớp › <b>⋯ › Lịch sử</b>: thông tin lớp, tiến độ, phân công.', 'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau.'] },
      ],
    },
    {
      /* Đặc tả 9.4: tab theo tham số → một mục, chia khối theo tab trong "Việc làm ở đây". */
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: điểm, Case, ý thức, lộ trình.', truoc: { chu: 'Học viên & Lớp', duong: '/hoc-vien' } },
      khongLam: [{ ten: 'Duyệt đề xuất PA', cua: 'việc của QL' }, { ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'hv-ghi-mini', viec: 'ghi-mini-test', ten: 'Ghi Mini Test', buoc: ['Tab <b>Học thuật</b>, khối kết luận khoá: nút <b>Ghi Mini Test</b>.', 'Gõ điểm, lưu.'] },
        { id: 'hv-hoc-thuat', ten: 'Tab Học thuật', buoc: ['Ô điểm <b>Overall · L · R · W1 · W2 · S</b>: bấm một ô đổi kỹ năng cho cả phần dưới.', '<b>Hành trình</b>: điểm từng MT của kỹ năng, kỳ vọng dạng bậc thang mờ.', '<b>Tiến độ trên lớp</b>: ghi / sửa / xoá bài trên lớp (không vào MT).'] },
        { id: 'hv-y-thuc', ten: 'Tab Ý thức & Phối hợp', buoc: ['Vi phạm, lần xử lý và Phối hợp SOS của em.'] },
        { id: 'hv-hanh-trinh', ten: 'Tab Lộ trình & lớp', buoc: ['Lưới tuần theo lớp: chương đang học, mọi lượt Test, Case / PA theo tuần.'] },
      ],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.' },
      muc: [{ id: 'hs-sua', ten: 'Sửa hồ sơ', buoc: ['Đổi họ tên, điện thoại, mật khẩu.', 'Ngôn ngữ: menu Tài khoản › <b>VI | EN</b>, nhớ theo tài khoản. Giao diện: <b>Theo máy · Sáng · Tối</b> ở cùng menu.'] }],
    },
    {
      id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
      dangO: { cau: 'Lớp bạn dạy và số của bạn theo khoảng tuần.', truoc: { chu: 'Tổng quan', duong: '/' } },
      muc: [{ id: 'hsgv-so', ten: 'Khối của trang', buoc: ['Khối <b>Lớp đang dạy</b>: lớp · kỹ năng · số HV · GVCN.', '<b>Chỉ số</b> và bảng <b>Học thuật</b> theo lớp / theo kỹ năng; bấm số mở danh sách.', 'Khối <b>Case đang phụ trách</b> và <b>Yêu cầu đã gửi</b>.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [{ id: 'hd-dung', ten: 'Dùng Hướng dẫn', buoc: ['Bấm <b>?</b> trên thanh trên ở mọi màn: mở đúng mục của màn đó.', '<b>Chỉ cho tôi</b> khoanh nút cần bấm; Esc để tắt.', '<b>In</b> để có bản giấy.'],
        chi: { hd: 'nut-hd', chu: 'Bấm <b>?</b> ở mọi màn.' } }],
    },
    /* ---------------------------------------------------------------- panel đang mở (`KhungPanel hd=…`, đặc tả 8 + 10.1) */
    {
      id: 'p-case', ten: 'Case đang mở', duong: [], panel: 'ngan-case',
      dangO: { cau: 'Một Case của em: PA, kết quả, người phụ trách.' },
      khongLam: [{ ten: 'Duyệt đề xuất PA', cua: 'việc của QL' }, { ten: 'Khôi phục Case đã xoá', cua: 'việc của QL' }],
      muc: [],
    },
    {
      id: 'p-nhap-diem', ten: 'Nhập điểm đang mở', duong: [], panel: 'nhap-diem',
      dangO: { cau: 'Gõ điểm từng em cho một lượt Test.' },
      khongLam: [KHONG_XEP_MT],
      muc: [
        { id: 'pn-go', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['<b>Lưu · bài tiếp ›</b> (Enter) sang bài còn thiếu kế.', 'Em vắng: gõ <b>-</b>.', 'Xong phần của bạn: <b>Lớp tiếp</b> / <b>Việc tiếp</b>.'] },
      ],
    },
  ],
  luat: [
    { id: 'han-cham', ten: 'Hạn chấm Mock Test', buoc: ['Bài của tuần Test: chấm xong trước hết <b>Thứ Tư</b> tuần kế.', 'MT0: hết <b>Thứ Tư</b> tuần sau.', 'Speaking chấm chéo không tính quá hạn.'] },
    { id: 'han-xac-nhan', ten: 'Hạn Xác nhận PA', buoc: ['<b>5 ngày</b> từ ngày chốt lượt, tính cả ngày đầu.', 'SOS 3 / Gấp: <b>3 ngày</b>.', 'Progress Test lớp thường: Xác nhận Case trong 5 ngày.'] },
    { id: 'han-ket-qua', ten: 'Hạn Ghi kết quả PA', buoc: ['Kỳ <b>2 tuần</b>; hạn <b>Thứ Ba</b> sau kỳ.', 'Kỹ năng đạt ở MT sau → <b>Ghi kết quả cuối</b>, rồi Hoàn thành Case.', 'Chưa có ngày thi → mốc là MT cuối lộ trình.'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc có chip hạn ở cuối dòng.' } },
    { id: 'han-vi-pham', ten: 'Hạn Xử lý vi phạm', buoc: ['<b>5 ngày</b> từ ngày ghi nhận, tính cả ngày đầu.', 'Bậc cần QL thì QL duyệt.'] },
    { id: 'han-ql', ten: 'QL trả lời đề xuất', buoc: ['QL trả lời Đề xuất PA / Xin hỗ trợ trong <b>5 ngày</b>, tính cả ngày gửi.'] },
    { id: 'dau-gach', ten: 'Dấu "-" (vắng)', buoc: ['Gõ "-" = vắng, chốt ngay: lần 1 dời sang tuần sau tuần Test.', 'MT vắng 2 lần thì huỷ (không thẻ, không nhắc); lớp thường dời tiếp. Tuần Test đã qua 2 tuần: "-" không dời, không tính lần vắng.', 'Chọn tuần cho kỹ năng (Dời) = xếp lại từ đầu. Gỡ vắng: xoá "-", lúc nào cũng được.'] },
    { id: 'sos-case', ten: 'SOS và Case', buoc: ['Số kỹ năng dưới kỳ vọng ở MT: 1 → SOS 1, 2 → SOS 2, 3–4 → SOS 3.', 'Lượt chưa chốt: Case tạm "Chờ chốt SOS" — chưa hạn, chưa việc.', 'Lượt chốt → "Chờ xác nhận PA"; Overall đạt mà chưa xác nhận PA → Case tự xoá.',
      'Bấm <b>chip SOS</b> ở mọi màn: hộp "Vì sao SOS n" — kỹ năng dưới kỳ vọng, điểm từng kỹ năng, lối mở hồ sơ MT.'] },
    { id: 'ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['PA quy chế: GVCN / QL vào <b>⋯ › Kết thúc PA</b>.', 'Lý do bắt buộc, từ <b>10</b> ký tự; nhật ký PA ghi lại.'] },
    { id: 'ban-giao', ten: 'Bàn giao khi em chuyển lớp', buoc: ['Hạn bàn giao = muộn hơn của (ngày quyết định chuyển lớp + 7 ngày) và mốc cũ.'] },
    { id: 'sua-diem', ten: 'Sửa điểm sau hoàn tất', buoc: ['Ô còn trống: nhập được cả sau hoàn tất.', 'Sửa hoặc xoá một điểm đã có: nhờ QL sửa.', 'Gỡ "-" lúc nào cũng được.'] },
    { id: 'nhan-xet', ten: 'Nhận xét MT', buoc: ['Ô có điểm nên có nhận xét từ <b>10</b> ký tự — chỉ MT mới nhất của em (chỉ nhắc, không chặn).', 'Ô dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.', 'Nhận xét + nhóm là nguyên nhân của Case.'] },
  ],
  tu: [
    { ten: 'MT (Mock Test)', nghia: 'Mock Test 4 kỹ năng L R W S của lớp Fast Track; MT0 là mốc đầu vào.' },
    { ten: 'Lớp thường (không phải FT)', nghia: 'Pre FOU, FOU, BE, ELE — làm Progress Test và Final Test, đếm theo môn.' },
    { ten: 'Kỳ vọng', nghia: 'Band em cần đạt ở mỗi MT theo lộ trình.' },
    { ten: 'SOS 1 · 2 · 3', nghia: 'Theo số kỹ năng dưới kỳ vọng: 1, 2, hoặc 3–4. SOS 1 viền mảnh · SOS 2 viền dày nền cam nhạt · SOS 3 nền đỏ đậm chữ trắng; SOS tạm viền đứt.' },
    { ten: '✓ / ✗ cạnh điểm', nghia: '✓ xanh lá vượt kỳ vọng · ✓ xanh dương bằng · ✗ đỏ dưới. Hộp nhập điểm: ▲ / ▼ so kỳ vọng.' },
    { ten: 'Case (hồ sơ vấn đề)', nghia: 'Hồ sơ một vấn đề học thuật của em: nguyên nhân, PA, kết quả.' },
    { ten: 'Case tạm / SOS tạm', nghia: 'Lượt MT chưa chốt: SOS và Case chỉ tạm ("Chờ chốt SOS") — chưa hạn, chưa việc, chưa vào số đếm; chốt lượt mới thành thật.' },
    { ten: 'KCK', nghia: 'Không cam kết Target: không kỳ vọng MT, không SOS tự động; vẫn có lịch MT, nhập điểm, Case tay, Ý thức.' },
    { ten: 'PA (phương án)', nghia: 'Cách hỗ trợ em: Xếp tự học, Bổ trợ, Tutor…' },
    { ten: 'PA quy chế', nghia: 'PA mặc định theo mức SOS, chạy tới mốc quy chế.' },
    { ten: 'PA Bổ trợ', nghia: 'PA của lớp thường sau Progress Test, chạy đến Cuối khoá.' },
    { ten: 'Tutor (học kèm)', nghia: 'PA học kèm; ghi kết quả từng buổi.' },
    { ten: 'GVCN · GVBM', nghia: 'Giáo viên chủ nhiệm lớp · giáo viên dạy một kỹ năng.' },
    { ten: 'Speaking chấm chéo', nghia: 'GV có kỹ năng Speaking chấm S Mock mọi lớp FT chi nhánh mình.' },
    { ten: 'Mã tuần', nghia: '<b>W2 OCT</b> = tuần thứ 2 của tháng 10; tuần thuộc tháng chứa Thứ Năm.' },
    { ten: 'QL (Quản lý)', nghia: 'Quản lý chi nhánh — duyệt Case, PA, đề xuất, lịch Test.' },
  ],
};
