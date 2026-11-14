/**
 * Hướng dẫn GIÁO VIÊN (GVBM + GVCN + GV Speaking). HD-V2 (đặc tả `2026-11-05-huong-dan-v2/de-xuat.md`, mockup `thiet-ke/v14/huong-dan.html`):
 * `lam` là MỘT nguồn — "Việc làm ở đây" của mỗi màn dựng từ `loiChinh` / `loiTat` (phép HD-LOI, HD-MOT). HD-V3-A (13/11): đối chiếu lại với mã main
 * ở `docs/superpowers/specs/2026-11-13-huong-dan-v3/doi-chieu-gv.md`; mục panel làm việc (`p-*`, `KhungPanel hd=…`). PR đổi màn / nhãn nào thì sửa
 * ở đây; `data-hd` phải có thật trong web/src (HD-CHI), chữ đậm là nhãn có thật (HD-NHAN).
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
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chấm điểm', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Dòng <b>Nhập điểm</b> ở tab <b>Chấm điểm</b> — bấm để gõ điểm.' } },
      loiTat: ['lich-test', 'diem-lop', 'ho-so-lop', 'nhap-diem', 'p-nhap-diem'], tatThem: ['⋯ dòng em'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Chấm điểm</b> (mục Mock Test · Progress / Final Test · Checkpoint).', 'Bấm <b>Nhập điểm</b> ở dòng lớp.', 'Gõ điểm; em vắng gõ <b>-</b>; <b>Lưu · bài tiếp ›</b>, hết lớp: <b>Lớp tiếp</b>.'],
      tuKhac: ['chấm', 'chấm bài', 'điểm', 'sửa điểm', 'mock test', 'progress test', 'final test', 'score', 'grade', 'marks'],
    },
    {
      id: 'nhap-mt-cu', ten: 'Nhập điểm MT cũ', nhom: 'diem', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Vận hành › Thiếu dữ liệu', duong: CV },
      loiTat: ['lich-test'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Vận hành</b>, mục <b>Thiếu dữ liệu</b>.', 'Dòng <b>Nhập điểm MT cũ</b> › <b>Nhập điểm</b>.', 'Gõ điểm các MT em đã làm, rồi lưu; không tính hạn.'],
      tuKhac: ['mt cu', 'điểm cũ', 'old mock'],
    },
    {
      id: 'cham-s', ten: 'Chấm Speaking chéo', nhom: 'diem', chiS: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Speaking', duong: CV },
      loiTat: ['lich-test', 'p-nhap-diem'], cung: 'mở cùng ô điểm.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Chấm Speaking</b>, bấm dòng <b>Chấm Speaking · n bài</b>.', 'Tìm em (tên, email), lọc lớp, bấm ô S để chấm.', '<b>Lưu · bài tiếp ›</b> sang em chưa chấm kế; không tính quá hạn.'],
      tuKhac: ['speaking', 'chấm chéo', 'cross marking'],
    },
    /* ---------------------------------------------------------------- Case và PA */
    {
      id: 'case-xac-nhan', ten: 'Xác nhận Case, PA', nhom: 'case',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Case học thuật', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Việc Case, PA nằm ở tab <b>Case học thuật</b>.' } },
      loiTat: ['ho-so-hv', 'ho-so-lop', 'p-case'], tatThem: ['Thông báo'], cung: 'mở cùng Case.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Case học thuật</b> (mục Mô tả Case · Phương án).', 'Bấm dòng: <b>Xác nhận Case</b>, <b>Mô tả Case</b>, <b>Xác nhận PA</b>, <b>Chọn PA</b> hoặc <b>Thêm PA học thuật</b>.', 'Nhiều em cùng PA: <b>Xác nhận PA cùng lúc</b>, sửa riêng em nào cần.', 'Ghi nội dung, bấm nút lưu ở chân; hạn ở cuối dòng.'],
      tuKhac: ['phương án', 'sos', 'mô tả', 'chọn pa', 'confirm'],
    },
    {
      id: 'ket-qua-pa', ten: 'Ghi kết quả PA', nhom: 'case',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Case học thuật › Kết quả PA', duong: CV },
      loiTat: ['ho-so-hv', 'p-case', 'p-ket-qua-pa'], cung: 'mở cùng Case.',
      buoc: ['PA đang chạy: ghi mỗi kỳ <b>2 tuần</b>, hạn <b>Thứ Ba</b> sau kỳ. Bấm dòng <b>Ghi kết quả PA</b>.', 'Ghi <b>Tiến triển (2 tuần)</b>, <b>Nhận xét</b>, chọn <b>Quyết định</b>, rồi <b>Lưu kết quả</b>.', 'Chưa xong: <b>Lưu nháp</b> — ghi lại nhiều lần, chưa chốt; dòng việc có chip <b>Có nháp</b>.', 'Bấm Lưu là lưu (không Hoàn tác); cần đổi thì <b>Sửa kết quả</b> ở thẻ PA.'],
      tuKhac: ['kết quả', 'tiến triển', 'nháp', 'feedback', 'tutor', 'result', 'draft'],
    },
    {
      id: 'tao-case', ten: 'Tạo Case tay', nhom: 'case',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › + Case cho một kỹ năng' },
      loiTat: ['ho-so-lop'], tatThem: ['⋯ dòng em'], cung: 'có nút + Task › Case ở đầu trang.',
      buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>; bấm ô kỹ năng.', 'Bấm <b>+ Case cho …</b> ở khối <b>Case & phương án</b> (hoặc <b>+ Task › Case</b> đầu hồ sơ).', 'Ghi mô tả, lưu.'],
      tuKhac: ['thêm Case', 'mở Case', 'new Case'],
    },
    {
      id: 'case-hoan-thanh', ten: 'Hoàn thành, xoá Case', nhom: 'case',
      loiChinh: { man: 'p-case', chu: 'Trong Case' },
      buoc: ['<b>Hoàn thành Case</b>: chọn hướng xử lý, ghi kết luận.', 'Nút <b>Xoá Case</b> ở cuối Case: Case còn PA thì hỏi một lần, nêu đúng các PA.', 'Xoá nhầm: <b>Hoàn tác</b> ngay trên dải báo; QL khôi phục được trong 30 ngày.'],
      tuKhac: ['đóng Case', 'kết thúc Case', 'close Case', 'delete'],
    },
    {
      id: 'doi-chu-case', ten: 'Đổi người phụ trách Case', nhom: 'case', chiGvcn: true,
      loiChinh: { man: 'p-case', chu: 'Trong Case › Đổi người…' },
      buoc: ['Mở Case, bấm <b>Đổi người…</b> ở dải đầu.', 'Chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.'],
      tuKhac: ['phụ trách', 'giao Case', 'owner'],
    },
    {
      id: 'bao-ph-test', ten: 'Báo PH kết quả Test', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Ý thức & Phối hợp › Báo PH', duong: CV },
      buoc: ['Lớp thường sau Progress Test: dòng <b>Báo PH kết quả Test</b> ở tab <b>Ý thức & Phối hợp</b>, mục <b>Báo PH</b>.', 'Bấm <b>Phối hợp</b>, báo phụ huynh, rồi <b>Đánh dấu đã làm</b>; không tính hạn.'],
      tuKhac: ['phụ huynh', 'báo ph', 'progress', 'parent'],
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
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ dòng em › + Ghi vi phạm' },
      loiTat: ['ho-so-hv', 'p-vi-pham'], cung: 'mở cùng panel ghi vi phạm.',
      buoc: ['Hồ sơ lớp, ở dòng em bấm <b>⋯ › + Ghi vi phạm</b> (hoặc tab <b>Ý thức & Phối hợp</b> › <b>+ Ghi vi phạm</b>).', 'Chọn <b>Ngày</b>, <b>Nhóm</b>, ghi <b>Vi phạm</b>; <b>+ Thêm vi phạm</b> nếu nhiều.', 'Ô <b>Môn</b>: dạy một môn ở lớp thì tự điền; dạy từ 2 môn thì phải chọn.', '<b>Lưu</b>. Ghi không có hạn; xử lý là việc của GVCN.'],
      tuKhac: ['ý thức', 'kỷ luật', 'vi phạm', 'violation'],
    },
    {
      id: 'xu-ly-vi-pham', ten: 'Xử lý vi phạm', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Ý thức & Phối hợp › Vi phạm', duong: CV },
      loiTat: ['ho-so-lop', 'p-xu-ly'], tatThem: ['⋯ dòng em › Xác nhận xử lý'], cung: 'mở cùng panel xử lý.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Ý thức & Phối hợp</b>, mục <b>Vi phạm</b>.', '<b>Xử lý vi phạm</b> (em có từ 3 vi phạm trong tuần này + tuần trước): <b>Xác nhận xử lý</b>; bậc cần QL thì <b>Gửi Quản lý duyệt</b>.', '<b>Xem vi phạm mới</b>: <b>Đã xem</b>. QL đã duyệt đề xuất xử lý: <b>Lưu · Đã thực hiện</b>.', 'Em mới vào lớp: <b>Xác nhận cấp bậc</b> vi phạm cũ. Hạn 5 ngày, tính cả ngày ghi.'],
      tuKhac: ['xử lý', 'cấp bậc', 'kỷ luật', 'discipline'],
    },
    {
      id: 'phoi-hop-sos', ten: 'Phối hợp SOS', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Ý thức & Phối hợp › Phối hợp SOS', duong: CV },
      loiTat: ['ho-so-lop', 'ho-so-hv', 'p-phoi-hop'], cung: 'mở cùng bảng phối hợp.',
      buoc: ['Mở <b>Công việc</b>, tab <b>Ý thức & Phối hợp</b>, mục <b>Phối hợp SOS</b>; bấm <b>Xác nhận</b> ở dòng lớp.', 'Bảng mỗi em một dòng: <b>Xác nhận</b> việc đã làm, ghi nội dung, <b>Lưu</b>; sai thì <b>Sửa</b>.', 'Meeting CX / GĐCN: TVV của em báo gia đình, sắp họp, ghi kết quả — bạn đọc ở cột <b>Kết quả</b>.'],
      tuKhac: ['phối hợp', 'sos', 'meeting', 'họp phụ huynh', 'coordination'],
    },
    {
      id: 'ban-giao', ten: 'Bàn giao khi em chuyển lớp', nhom: 'hv',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Vận hành › Bàn giao', duong: CV },
      loiTat: ['p-ban-giao'],
      buoc: ['Mở <b>Công việc</b>, tab <b>Vận hành</b>, mục <b>Bàn giao</b>.', 'GV bộ môn: dòng <b>Bàn giao môn …</b> — một câu mỗi em cho môn mình (dạy W1 + W2: một bảng hai cột).', 'GVCN: dòng <b>Bàn giao n em</b> — đọc câu các môn, viết <b>Nhận xét chung của GVCN</b>, rồi xác nhận.', 'Đổi GV dạy lớp: dòng Bàn giao của lớp và môn đó › <b>Xác nhận bàn giao</b>.'],
      tuKhac: ['bàn giao', 'chuyển lớp', 'handover'],
    },
    {
      id: 'de-xuat-chuyen-lop', ten: 'Đề xuất chuyển lớp', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Đề xuất chuyển lớp…' },
      loiTat: ['ho-so-lop', 'p-chuyen-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Đề xuất chuyển lớp…</b>', 'Chọn <b>Lớp chuyển đến</b>, <b>Tuần bắt đầu</b>, ghi <b>Lý do</b>.', '<b>Gửi đề xuất</b>: QL duyệt trong hạn duyệt (mặc định 5 ngày, Quản trị đổi được); xem ở Yêu cầu của tôi.'],
      tuKhac: ['đổi lớp', 'chuyển lớp', 'sang lớp', 'change class', 'transfer'],
    },
    {
      id: 'sua-thong-tin', ten: 'Sửa thông tin, lộ trình đang học', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Sửa thông tin' },
      loiTat: ['ho-so-lop', 'p-sua-thong-tin', 'p-sua-ca-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng panel.',
      buoc: ['GVCN: <b>⋯ › Sửa thông tin</b> — liên hệ, Target, môn học, <b>Lộ trình đang học</b> (LT1 · LT2 · RF, lộ trình theo em, không theo lớp).', 'Cả lớp: Hồ sơ lớp › <b>⋯ › Sửa thông tin học viên</b>.', 'GV bộ môn: <b>⋯ › Đề xuất sửa thông tin…</b> — QL duyệt rồi mới đổi.', 'Mọi lần sửa có <b>⋯ › Lịch sử</b>.'],
      tuKhac: ['sửa', 'thông tin', 'lộ trình', 'target', 'môn học', 'edit'],
    },
    {
      id: 'them-hv', ten: 'Thêm học viên, dán Excel', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ › + Học viên' },
      loiTat: ['hoc-vien', 'p-them-hv'], cung: 'có nút + Thêm học viên.',
      buoc: ['Hồ sơ lớp, bấm <b>⋯ › + Học viên</b>.', 'Gõ từng em, hoặc dán danh sách từ Excel (dán Excel chỉ dùng để thêm học viên).', 'Xem lại các dòng, rồi lưu.'],
      tuKhac: ['thêm em', 'excel', 'dán', 'nhập danh sách', 'add student'],
    },
    {
      id: 'tam-dung', ten: 'Tạm dừng, kết thúc học, quay lại học', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Tạm dừng/ Kết thúc học' },
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Tạm dừng/ Kết thúc học</b>; tick “Có thể quay lại học” nếu em sẽ học lại.', 'Cả hai vào Lưu trữ; em tạm dừng giữ lớp và lộ trình.', 'Em quay lại: <b>⋯ › Quay lại học</b>.'],
      tuKhac: ['nghỉ học', 'thôi học', 'tạm dừng', 'lưu trữ', 'pause'],
    },
    {
      /* GV-CU-BO-TRO (chủ SP 13/11): Người dạy PA Bổ trợ miễn phí (GV cũ) ghi — không còn chỉ GVCN; GVCN lớp mới làm thay được. */
      id: 'ghi-mini-test', ten: 'Ghi Mini Test', nhom: 'hv',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Case học thuật › Phương án', duong: CV },
      loiTat: ['ho-so-hv', 'ho-so-gv', 'p-ket-qua-pa'], cung: 'mở cùng ô Mini Test.',
      buoc: ['Mở <b>Công việc</b>, bấm dòng <b>Ghi Mini Test</b> (hoặc nút <b>Ghi Mini Test</b> ở hồ sơ em).', 'Gõ điểm Mini Test của em, rồi lưu.',
        'Người dạy bổ trợ ghi; GVCN lớp mới thấy dòng của Người dạy, bấm <b>Làm thay</b> khi cần.'],
      tuKhac: ['mini test', 'kết luận khoá'],
    },
    {
      id: 'bo-tro-mien-phi', ten: 'Dạy bổ trợ miễn phí (em đã chuyển lớp)', nhom: 'hv',
      loiChinh: { man: 'ho-so-gv', chu: 'Hồ sơ giáo viên › Em đang bổ trợ' },
      loiTat: ['cong-viec', 'ho-so-lop', 'ho-so-hv'], cung: 'có lối vào hồ sơ em.',
      buoc: ['Em lên lớp có PA Bổ trợ miễn phí: bạn (GV cũ) vẫn là Người dạy tới khi ghi Mini Test — có chuông khi em chuyển lớp.',
        'Vào hồ sơ em: dòng việc ở <b>Công việc</b>, khối <b>Em đang bổ trợ</b> ở Hồ sơ giáo viên, hoặc <b>Đã chuyển · đang bổ trợ</b> ở hồ sơ lớp cũ.',
        'Ghi kết quả từng kỳ, buổi cuối ghi Mini Test. Hồ sơ lớp mới của em: chỉ xem.'],
      tuKhac: ['bổ trợ', 'bổ trợ miễn phí', 'gv cũ', 'chuyển lớp', 'free extra class'],
    },
    {
      id: 'cuoi-khoa', ten: 'Cuối khoá lớp thường', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ › Cuối khoá…' },
      buoc: ['Hồ sơ lớp thường, bấm <b>⋯ › Cuối khoá…</b>: hướng từng em do QL chốt.', 'Bạn ghi nhận xét (không bắt buộc), chọn nhiều em rồi <b>Lưu nhận xét</b>.'],
      tuKhac: ['lên lớp', 'học lại', 'final', 'end of course'],
    },
    {
      id: 'thi-that', ten: 'Ghi kết quả thi thật', nhom: 'hv', chiGvcn: true,
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Kết quả thi thật' },
      loiTat: ['hoc-vien', 'p-sau-thi'], cung: 'mở cùng panel.',
      buoc: ['Việc của TVV của em; bạn ghi được khi có kết quả trước: <b>⋯ › Kết quả thi thật</b>.', 'Gõ điểm từng kỹ năng, lưu.'],
      tuKhac: ['ielts', 'điểm thi', 'exam result'],
    },
    {
      id: 'lich-thi', ten: 'Xem lịch thi, xuất danh sách', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Lịch thi', duong: '/hoc-vien', chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      loiTat: ['p-xuat-ds'],
      buoc: ['Mở <b>Học viên & Lớp</b>, góc <b>Lịch thi</b>.', '<b>Xuất Excel</b> ở đầu trang: xuất đúng danh sách đang lọc.'],
      tuKhac: ['excel', 'xuất', 'export', 'ngày thi'],
    },
    /* ---------------------------------------------------------------- Lịch Test */
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này, bài quá hạn chấm', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: '/test/lich', chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Mỗi lớp một dòng — bấm dòng để gõ điểm.' } },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>; <b>Lớp tôi dạy</b> / <b>Tất cả</b>.', '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới — mỗi lớp một dòng.'],
      tuKhac: ['lịch test', 'quá hạn', 'schedule'],
    },
    {
      id: 'xuat-excel', ten: 'Xuất Excel điểm Test', nhom: 'lich', chiGvcn: true,
      loiChinh: { man: 'lich-test', chu: 'Test › Xuất Excel…', duong: '/test/lich' },
      loiTat: ['ke-hoach', 'ho-so-lop', 'p-xuat'], tatThem: ['Hồ sơ lớp › ⋯ › Xuất Excel'], cung: 'mở cùng panel xuất.',
      buoc: ['Bấm <b>Xuất Excel…</b> cạnh tiêu đề Test (lớp bạn chủ nhiệm).', 'Chọn lớp, lượt, kiểu bảng, rồi xuất.'],
      tuKhac: ['excel', 'xuất', 'export', 'bảng điểm'],
    },
    /* ---------------------------------------------------------------- Khác */
    {
      id: 'xem-viec', ten: 'Xem việc của bạn', nhom: 'khac',
      loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV, chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' } },
      buoc: ['Mở <b>Công việc</b>: mỗi tab một nhóm việc, quá hạn ở đầu mục, chữ đỏ.', 'Bấm dòng để làm ngay; lưu xong việc rời danh sách.'],
      tuKhac: ['việc', 'todo', 'tasks'],
    },
    {
      id: 'xem-chuong', ten: 'Xem chuông thông báo', nhom: 'khac',
      loiChinh: { chu: 'Chuông trên thanh trên' },
      buoc: ['Bấm chuông: <b>Việc cần làm</b> — mỗi loại việc một dòng, số mới, quá hạn tô đỏ; bấm dòng mở đúng việc.', '<b>Cập nhật</b>: báo một chiều; <b>Đánh dấu đã đọc</b>, <b>Xem tất cả</b>.'],
      tuKhac: ['thông báo', 'chuông', 'notification', 'bell'],
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
      buoc: ['Bấm tên bạn › <b>Hồ sơ giáo viên</b>.', 'Chọn <b>Từ tuần → Đến tuần</b>; bấm số mở danh sách.'],
      tuKhac: ['chỉ số', 'thống kê', 'kpi'],
    },
    {
      id: 'bao-cao-ph', ten: 'Viết Báo cáo PH', nhom: 'khac',
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › Báo cáo PH' },
      loiTat: ['p-bao-cao-ph'],
      buoc: ['Hồ sơ lớp, tab <b>Báo cáo PH</b>: chọn đợt.', 'Bấm <b>Viết …</b> ở cột phần của bạn (GV môn viết môn mình, GVCN viết phần Chung).', 'Chữ tự lưu khi rời ô; <b>Lưu · em tiếp ›</b> sang em kế. Admin xuất gửi phụ huynh.'],
      tuKhac: ['báo cáo', 'phụ huynh', 'nhận xét', 'report', 'parent'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-viec', 'xem-chuong', 'xem-lich-test'] },
    { nhip: 'Sau tuần Test', viec: ['nhap-diem', 'cham-s', 'case-xac-nhan', 'bao-ph-test'] },
    { nhip: '2 tuần một lần', viec: ['ket-qua-pa'] },
    { nhip: 'Khi có', viec: ['vi-pham', 'xu-ly-vi-pham', 'phoi-hop-sos', 'tao-case', 'ban-giao', 'de-xuat-chuyen-lop', 'sua-thong-tin', 'nhap-mt-cu', 'case-hoan-thanh'] },
    { nhip: 'Theo đợt', viec: ['bao-cao-ph', 'xuat-excel'] },
    { nhip: 'Cuối khoá', viec: ['cuoi-khoa', 'ghi-mini-test', 'thi-that'] },
  ],
  vaiKhac: [
    { ...KHONG_XEP_MT, tuKhac: ['dời lịch', 'lịch mt', 'reschedule'] },
    { ten: 'Duyệt yêu cầu, đề xuất PA', cua: 'việc của QL', tuKhac: ['duyệt', 'approve'] },
    { ten: 'Duyệt / chuyển lớp', cua: 'việc của QL', tuKhac: ['đổi lớp', 'chuyển lớp', 'change class', 'transfer'] },
    { ten: 'Chốt hướng ở trang Cuối khoá', cua: 'việc của QL', tuKhac: ['lên ft', 'học lại', 'end of course'] },
    { ten: 'Khôi phục thứ đã xoá', cua: 'việc của QL', tuKhac: ['thùng rác', 'đã xoá', 'restore', 'undo'] },
    { ten: 'Xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
    { ten: 'Báo PH vi phạm', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'parent'] },
    { ten: 'Chốt ngày thi', cua: 'việc của TVV', tuKhac: ['ngày thi', 'exam date'] },
    { ten: 'Chọn bước tiếp sau thi', cua: 'việc của TVV', tuKhac: ['bước tiếp', 'lộ trình mới', 'next step'] },
    { ten: 'Xuất báo cáo PH', cua: 'việc của Admin', tuKhac: ['xuất báo cáo', 'export report'] },
  ],
  man: [
    {
      /* GD-1 (Overhaul V6): Công việc là trang đầu của GV (thay Tổng quan); hai bảng số sang Hồ sơ giáo viên. */
      id: 'cong-viec', ten: 'Công việc', duong: [CV, '/'],   // `/` chuyển thẳng sang Công việc (GD-1)
      dangO: { cau: 'Trang đầu của bạn: việc theo tab bên trái, Lớp của tôi bên phải.' },
      khongLam: [KHONG_XEP_MT, { ten: 'Duyệt yêu cầu', cua: 'việc của QL' }],
      muc: [
        { id: 'cv-gop', ten: 'Làm cả lớp một lần', buoc: ['Dòng "n em" mở danh sách em; làm từng em hoặc cùng lúc.'] },
        { id: 'cv-qua-han', ten: 'Vì sao việc quá hạn', buoc: ['Qua hạn mà chưa Lưu: chữ đỏ ở cột hạn, nằm đầu mục.', 'Lưu xong là hết quá hạn ở mọi nơi.'] },
        { id: 'cv-loc', ten: 'Lọc việc', buoc: ['Ô hạn: <b>Mọi hạn</b> · <b>Quá hạn</b> · <b>Hôm nay</b> · hạn đến một ngày; <b>Lọc thêm</b> cho khung, chi nhánh.', 'Đầu trang đếm “n việc · m quá hạn” và việc xong hôm nay.'],
          chi: { hd: 'cv-loc-them', duong: CV, chu: 'Lọc việc ở hàng này.' } },
        { id: 'cv-lop', ten: 'Lớp của tôi', buoc: ['Khung phải khi chưa chọn việc (điện thoại: nút <b>Lớp của tôi</b>): mỗi lớp một dòng — bạn dạy gì, Test, <b>Việc cần làm</b>.', 'Bấm một nút việc (Nhập điểm, Case, Ý thức, Vận hành) mở đúng việc đó; bấm tên lớp mở hồ sơ lớp.'],
          chi: { hd: 'cv-lop-cua-toi', duong: CV, chu: 'Bấm nút việc của một lớp để làm ngay.' } },
        { id: 'cv-quy-che', ten: 'Dòng quy chế ở panel việc', buoc: ['Ngay trên nút lưu: <b>Quy chế</b> · một câu — lưu xong ai nhận việc, hạn nào. Câu đổi theo lựa chọn; <b>ⓘ</b> xem chi tiết.', 'Chân panel: <b>Đóng</b> · nút việc · <b>Lưu · việc tiếp ›</b> khi còn việc kế.'] },
        { id: 'cv-task', ten: '+ Task', buoc: ['Nút <b>+ Task</b> đầu trang: <b>Case</b> · <b>Vi phạm / Nhắc nhở</b> · <b>Tình hình học tập</b>.', 'Gõ tên em: kết quả nhóm theo từng lớp của bạn (lớp chủ nhiệm ghi rõ), rồi điền form như ở hồ sơ lớp. Trên điện thoại: nút tròn <b>+ Task</b>, menu mở ở đáy màn.', '<b>Tình hình học tập</b>: chọn em (tối đa 8) và gõ nội dung ngay trong một hộp, rồi <b>Gửi TVV</b>.'] },
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
        { id: 'lt-thi-that', ten: 'Lịch thi thật', buoc: ['<b>Lịch thi thật ›</b> ở hàng tuần: em thi tháng này.'],
          chi: { hd: 'test-lich-thi-that', duong: '/test/lich', chu: 'Lịch thi thật ở đây.' } },
      ],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: ['/test/ke-hoach'],
      dangO: { cau: 'Lịch MT, Progress, Final các lớp bạn dạy — chủ yếu để xem.', sau: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      khongLam: [KHONG_XEP_MT],
      muc: [{ id: 'kh-xem', ten: 'Xem lịch Test của lớp', buoc: ['Mỗi lớp một hàng, mỗi tuần một cột; ô có lượt Test. Lớp thường ghi tuần đang học / số tuần (vd tuần 5/8).', 'GVCN dời được kỹ năng MT có tuần Test đã qua (sang tuần đã qua hoặc tuần này); còn lại nhờ QL.', 'Khi Quản trị bật “Mở sửa lịch Test”: GVCN sửa lịch lớp mình như QL.'] }],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp', duong: ['/test/diem-lop'],
      dangO: { cau: 'Gõ điểm một lượt Test của cả lớp.', truoc: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      muc: [
        { id: 'dl-nhap-diem', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['Chọn lượt (MT1, MT2…) và môn.', 'Gõ điểm vào ô còn trống; em vắng gõ <b>-</b>.'] },
      ],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test của một em.', truoc: { chu: 'Lịch Test tuần', duong: '/test/lich' } },
      muc: [
        { id: 'nd-go', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final',
          buoc: ['Gõ điểm; Enter sang ô còn nhập kế.', 'Em vắng: gõ <b>-</b>; ô đã dời ghi "vắng W3 SEP".', 'MT mới nhất: ô thiếu nhận xét viền vàng — nên ghi, không chặn lưu.'] },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      dangO: { cau: 'Tìm em, lớp; xem nhanh một em không rời trang.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [{ ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em, lớp, GV', buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp · GV</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Không thấy: <b>Tìm trong HV lưu trữ ›</b>.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'hv-goc', ten: 'Ba góc nhìn', buoc: ['<b>Tất cả</b> · <b>Đang SOS</b> (SOS hiện tại, mỗi em một dòng) · <b>Lịch thi</b>.', 'Bấm dòng em mở panel một em, không rời trang; việc cần làm ở Công việc.'] },
      ],
    },
    {
      id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
      dangO: { cau: 'Lớp đã kết thúc và em đã tạm dừng / kết thúc học — để xem lại.', truoc: { chu: 'Học viên & Lớp', duong: '/hoc-vien' } },
      khongLam: [{ ten: 'Khôi phục thứ đã xoá', cua: 'việc của QL' }],
      muc: [{ id: 'lt-xem', ten: 'Xem lớp, em đã lưu trữ', buoc: ['Tab <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b>; chỉ lớp bạn từng dạy.', 'Bấm em mở hồ sơ; em tạm dừng quay lại: hồ sơ › <b>⋯ › Quay lại học</b> (GVCN).'] }],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: em, điểm các lượt, ý thức, báo cáo PH.', truoc: { chu: 'Học viên & Lớp', duong: '/hoc-vien' } },
      khongLam: [KHONG_XEP_MT],
      muc: [
        { id: 'lop-nhap-diem', viec: 'nhap-diem', ten: 'Nhập điểm MT · Progress · Final', buoc: ['Bấm nút <b>Nhập điểm</b> đầu trang, hoặc <b>⋯</b> ở dòng em › <b>Nhập điểm</b>.', 'Chọn lượt và môn, gõ điểm.'] },
        { id: 'lop-hoc-vien', ten: 'Các tab của lớp', buoc: ['Đầu trang: thanh <b>Việc của tôi</b> của lớp — bấm việc làm ngay tại trang. Lớp thường ghi tuần 5/8 (tuần đang học / số tuần).', 'Tab <b>Học viên</b> · <b>Ý thức & Phối hợp</b> · <b>Phân tích lớp</b> · <b>Báo cáo PH</b>; lớp đã kết thúc có <b>Tổng kết</b>.', 'Bảng em: W1 · W2 riêng, bấm điểm W / S xem điểm thành phần; Case + PA mở dưới dòng.'] },
        { id: 'lop-menu', ten: 'Nút ⋯ của lớp', buoc: ['GVCN: <b>Thông tin lớp</b> · <b>Sửa thông tin học viên</b> · <b>+ Học viên</b> · <b>Cuối khoá…</b> (lớp thường) · <b>Xuất Excel</b>.', 'Mọi GV: <b>Lịch sử</b> — mỗi lần lưu: ai · lúc · nguồn · lý do · trước → sau.'] },
      ],
    },
    {
      /* Đặc tả 9.4: tab theo tham số → một mục, chia khối theo tab trong "Việc làm ở đây". */
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: điểm, Case, ý thức, lộ trình.', truoc: { chu: 'Học viên & Lớp', duong: '/hoc-vien' } },
      khongLam: [{ ten: 'Duyệt đề xuất PA', cua: 'việc của QL' }, { ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'hv-ghi-mini', viec: 'ghi-mini-test', ten: 'Ghi Mini Test', buoc: ['Tab <b>Học thuật</b>, khối kết luận khoá: nút <b>Ghi Mini Test</b>.', 'Gõ điểm, lưu.'] },
        { id: 'hv-viec', ten: 'Việc cần làm · + Task', buoc: ['Thanh <b>Việc cần làm</b> dưới ô điểm: mọi việc của bạn với em (Case, Nhập điểm, Trả lời tình hình, Ý thức), quá hạn đỏ lên đầu; bấm dòng mở panel ngay tại hồ sơ.', '<b>+ Task</b> đầu hồ sơ: <b>Case</b> · <b>Vi phạm / Nhắc nhở</b> · <b>Tình hình học tập</b> — em điền sẵn, không chọn lại.', 'Em chưa có Target: ô <b>Target</b> ghi <b>Chưa có</b> · <b>Đề xuất sửa</b> (GV lớp gửi QL / TVV).'] },
        { id: 'hv-hoc-thuat', ten: 'Tab Học thuật', buoc: ['Ô điểm <b>Overall · L · R · W1 · W2 · S</b>: bấm một ô đổi kỹ năng cho cả phần dưới.', '<b>Hành trình</b>: điểm từng MT của kỹ năng, kỳ vọng dạng bậc thang mờ.', '<b>Tiến độ trên lớp</b>: ghi / sửa / xoá bài trên lớp (không vào MT).'] },
        { id: 'hv-y-thuc', ten: 'Tab Ý thức & Phối hợp', buoc: ['Vi phạm, lần xử lý, kết quả báo phụ huynh và Phối hợp SOS của em.', 'Một bảng: <b>Đang chờ</b> trên, <b>Lịch sử · n</b> gập dưới — mở ra có lọc loại · Lộ trình | Cả lịch sử · nhóm.', 'Lần xử lý sai: mở lần đó, <b>Thu hồi…</b> ghi lý do, gửi QL; QL quá hạn chưa quyết thì máy thu hồi theo bạn.'] },
        { id: 'hv-hanh-trinh', ten: 'Tab Lộ trình & lớp', buoc: ['Lưới tuần theo lớp: chương đang học, mọi lượt Test, Case / PA theo tuần.'] },
      ],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.' },
      muc: [{ id: 'hs-sua', ten: 'Sửa hồ sơ', buoc: ['Đổi họ tên, điện thoại, mật khẩu.', 'Menu Tài khoản: <b>Ngôn ngữ</b> VI / EN (nhớ theo tài khoản) · <b>Giao diện</b> Theo máy / Sáng / Tối.'] }],
    },
    {
      id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
      dangO: { cau: 'Lớp bạn dạy và số của bạn theo khoảng tuần.', truoc: { chu: 'Công việc', duong: CV } },
      muc: [{ id: 'hsgv-hai-khoi', ten: 'Kỹ năng tôi dạy · Lớp tôi chủ nhiệm', buoc: ['<b>Kỹ năng tôi dạy</b>: mỗi lớp một dòng — Đạt kỳ vọng Test, Tiến bộ, bài chờ chấm.', '<b>Lớp tôi chủ nhiệm</b>: Dưới kỳ vọng, SOS hiện tại, Case, Thi tháng này; bấm số mở danh sách em.'],
        chi: { hd: 'tq-lop-toi-day', duong: '/giao-vien', chu: 'Hai khối lớp của bạn ở đây.' } }, { id: 'hsgv-so', ten: 'Khối của trang', buoc: ['Dải chỉ số theo <b>Từ tuần → Đến tuần</b>; bấm số mở danh sách.', 'Khối <b>Lớp đang dạy</b> · <b>Học thuật</b> · <b>Việc đang tồn</b> (<b>Mở Công việc ›</b>).', 'Khối <b>Case đang phụ trách</b> và <b>Yêu cầu đã gửi</b>.',
        'Khối <b>Em đang bổ trợ</b> (khi bạn dạy PA Bổ trợ miễn phí): tên em mở hồ sơ, kể cả em đã chuyển lớp.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [{ id: 'hd-dung', ten: 'Dùng Hướng dẫn', buoc: ['Bấm <b>?</b> trên thanh trên ở mọi màn: mở đúng mục của màn — hoặc của panel đang mở.', '<b>Chỉ cho tôi</b> khoanh nút cần bấm; Esc để tắt.', '<b>In</b> để có bản giấy.'],
        chi: { hd: 'nut-hd', chu: 'Bấm <b>?</b> ở mọi màn.' } }],
    },
    /* ---------------------------------------------------------------- panel đang mở (`KhungPanel hd=…`, đặc tả 8 + 10.1; HD-V3 thêm) */
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
          buoc: ['<b>Lưu · bài tiếp ›</b> (Enter) sang bài còn thiếu kế.', 'Em vắng: gõ <b>-</b>.', 'Xong phần của bạn: <b>Lớp tiếp</b> / <b>Việc tiếp ›</b>.'] },
      ],
    },
    {
      id: 'p-ket-qua-pa', ten: 'Ghi kết quả PA đang mở', duong: [], panel: 'ket-qua-pa',
      dangO: { cau: 'Kết quả một kỳ PA (hoặc Kết quả cuối) của một em.' },
      khongLam: [{ ten: 'Duyệt đổi PA', cua: 'việc của QL' }],
      muc: [
        { id: 'pk-ghi', viec: 'ket-qua-pa', ten: 'Ghi kết quả PA',
          buoc: ['Ghi <b>Tiến triển (2 tuần)</b>, <b>Nhận xét</b>; chọn <b>Quyết định</b> (giữ, điều chỉnh, thay PA, kết thúc, cần QL).', '<b>Lưu nháp</b>: ghi tạm sau từng buổi, chưa chốt, không đổi hạn.', 'Nút lưu ở chân là chốt — không Hoàn tác; cần đổi: <b>Sửa kết quả</b> ở thẻ PA.'] },
      ],
    },
    {
      id: 'p-phoi-hop', ten: 'Phối hợp SOS đang mở', duong: [], panel: 'phoi-hop-sos',
      dangO: { cau: 'Việc phối hợp theo mức SOS của các em một lớp.' },
      khongLam: [{ ten: 'Báo gia đình, ghi kết quả Meeting', cua: 'việc của TVV' }],
      muc: [
        { id: 'pp-xn', viec: 'phoi-hop-sos', ten: 'Phối hợp SOS',
          buoc: ['Cột Học viên · Đã làm · Kết quả.', 'Bấm <b>Xác nhận</b> ở dòng em, ghi nội dung, <b>Lưu</b>; cần đổi: <b>Sửa</b>.', 'Không cần làm: <b>Bỏ việc…</b> (ghi lý do).'] },
      ],
    },
    {
      id: 'p-vi-pham', ten: 'Ghi vi phạm đang mở', duong: [], panel: 'vi-pham',
      dangO: { cau: 'Ghi một hay nhiều vi phạm của một em.' },
      khongLam: [{ ten: 'Báo PH vi phạm', cua: 'việc của TVV' }],
      muc: [
        { id: 'pv-ghi', viec: 'vi-pham', ten: 'Ghi vi phạm',
          buoc: ['Mỗi dòng: <b>Ngày</b> · <b>Môn</b> · <b>Nhóm</b> · <b>Vi phạm</b>; ô có * là bắt buộc.', '<b>Môn</b> tự điền khi bạn dạy một môn ở lớp; dạy từ 2 môn thì chọn.', '<b>+ Thêm vi phạm</b> cho dòng mới; <b>Bằng chứng</b> đính tệp nếu có; <b>Lưu</b>.'] },
      ],
    },
    {
      id: 'p-xu-ly', ten: 'Xử lý vi phạm đang mở', duong: [], panel: 'xu-ly-vi-pham',
      dangO: { cau: 'Xử lý, xem vi phạm, ghi việc đã làm của em.' },
      khongLam: [{ ten: 'Duyệt xử lý cần QL', cua: 'việc của QL' }, { ten: 'Báo PH vi phạm', cua: 'việc của TVV' }],
      muc: [
        { id: 'px-xl', viec: 'xu-ly-vi-pham', ten: 'Xử lý vi phạm',
          buoc: ['Đọc các vi phạm và bậc kế tiếp, chọn cách xử lý.', '<b>Xác nhận xử lý</b>; bậc cần QL: <b>Gửi Quản lý duyệt</b>. Lưu xong: TVV có việc báo phụ huynh.', '<b>Lưu · Đã thực hiện</b>: ghi ngày, người làm việc QL đã duyệt.'] },
      ],
    },
    {
      id: 'p-ban-giao', ten: 'Bàn giao đang mở', duong: [], panel: 'ban-giao',
      dangO: { cau: 'Bàn giao các em chuyển lớp cho lớp mới.' },
      khongLam: [{ ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'pb-viet', viec: 'ban-giao', ten: 'Bàn giao khi em chuyển lớp',
          buoc: ['Mỗi em một dòng; ô môn của bạn: một câu, rời ô là lưu.', 'GVCN: <b>Nhận xét chung của GVCN</b>, rồi xác nhận; ô của GV khác: <b>Điền thay</b> khi cần.', 'Bàn giao do đổi GV: <b>Xác nhận bàn giao</b>.'] },
      ],
    },
    {
      id: 'p-bao-cao-ph', ten: 'Báo cáo PH đang viết', duong: [], panel: 'bao-cao-ph',
      dangO: { cau: 'Phần báo cáo phụ huynh của bạn, từng em.' },
      khongLam: [{ ten: 'Xuất báo cáo PH', cua: 'việc của Admin' }],
      muc: [
        { id: 'pbc-viet', viec: 'bao-cao-ph', ten: 'Viết Báo cáo PH',
          buoc: ['Điểm tự điền từ lượt Test; bạn ghi nhận xét theo tiêu chí.', 'Chữ tự lưu khi rời ô; <b>Lưu · em tiếp ›</b> sang em kế.'] },
      ],
    },
    {
      id: 'p-chuyen-lop', ten: 'Đề xuất chuyển lớp đang mở', duong: [], panel: 'chuyen-lop',
      dangO: { cau: 'Đề xuất chuyển một em sang lớp khác.' },
      khongLam: [{ ten: 'Duyệt / chuyển lớp', cua: 'việc của QL' }],
      muc: [
        { id: 'pc-dx', viec: 'de-xuat-chuyen-lop', ten: 'Đề xuất chuyển lớp',
          buoc: ['Chọn <b>Lớp chuyển đến</b> và <b>Tuần bắt đầu</b>, ghi <b>Lý do</b>.', '<b>Gửi đề xuất</b>: QL duyệt trong hạn duyệt (mặc định 5 ngày, Quản trị đổi được), kết quả ở chuông và Yêu cầu của tôi.'] },
      ],
    },
    {
      id: 'p-xuat', ten: 'Xuất Excel đang mở', duong: [], panel: 'xuat-excel',
      dangO: { cau: 'Xuất điểm Test các lớp bạn chủ nhiệm.' },
      khongLam: [{ ten: 'Xuất lịch MT', cua: 'việc của QL' }],
      muc: [
        { id: 'px-xuat', viec: 'xuat-excel', ten: 'Xuất Excel điểm Test',
          buoc: ['Chọn lớp, lượt và kiểu bảng.', 'Bấm xuất: tệp Excel tải về máy.'] },
      ],
    },
    {
      id: 'p-sua-thong-tin', ten: 'Sửa thông tin đang mở', duong: [], panel: 'sua-thong-tin',
      dangO: { cau: 'Thông tin, Target, môn học, lộ trình đang học của một em.' },
      khongLam: [{ ten: 'Sửa Target không cần duyệt', cua: 'việc của QL' }],
      muc: [{ id: 'pst-sua', viec: 'sua-thong-tin', ten: 'Sửa thông tin, lộ trình đang học', buoc: ['GVCN sửa thẳng; đổi Target cần ghi lý do.', '<b>Lộ trình đang học</b>: lượt MT đã có điểm giữ nguyên, lượt chưa thi xếp lại theo lộ trình mới.', 'GV bộ môn: panel <b>Đề xuất sửa thông tin</b> — QL duyệt trong hạn duyệt (mặc định 5 ngày, Quản trị đổi được).'] }],
    },
    {
      id: 'p-sua-ca-lop', ten: 'Sửa thông tin cả lớp đang mở', duong: [], panel: 'sua-ca-lop',
      dangO: { cau: 'Sửa một cột cho nhiều em của lớp cùng lúc.' },
      khongLam: [{ ten: 'Chuyển lớp', cua: 'việc của QL' }],
      muc: [{ id: 'psc-sua', viec: 'sua-thong-tin', ten: 'Sửa thông tin, lộ trình đang học', buoc: ['Mỗi em một dòng; sửa ô cần đổi, ô không đổi để nguyên.', 'Đổi Target nhiều em: một lý do chung cho các em đó.', 'Lưu một lần cho cả lớp.'] }],
    },
    {
      id: 'p-sau-thi', ten: 'Kết quả thi thật đang mở', duong: [], panel: 'sau-thi',
      dangO: { cau: 'Điểm thi thật của một em và bước tiếp sau thi.' },
      khongLam: [{ ten: 'Chọn bước tiếp sau thi', cua: 'việc của TVV' }],
      muc: [{ id: 'pkt-ghi', viec: 'thi-that', ten: 'Ghi kết quả thi thật', buoc: ['Gõ điểm từng kỹ năng (KET / PET: điểm Cambridge), lưu.', 'Bước tiếp (Tạm dừng/ Kết thúc học, Lộ trình mới) do TVV của em chọn — bạn chỉ xem.'] }],
    },
    {
      id: 'p-them-hv', ten: 'Thêm học viên đang mở', duong: [], panel: 'them-hv',
      dangO: { cau: 'Thêm em mới vào lớp.' },
      khongLam: [{ ten: 'Xoá học viên', cua: 'việc của QL' }],
      muc: [{ id: 'pth-them', viec: 'them-hv', ten: 'Thêm học viên, dán Excel', buoc: ['Gõ từng em, hoặc dán danh sách từ Excel (chỉ ở đây).', 'Dòng lỗi báo tại ô; dòng trùng em có sẵn được gợi ý, không tự gộp.', 'Lưu: các dòng đúng được thêm, dòng lỗi giữ lại để sửa.'] }],
    },
    {
      id: 'p-xuat-ds', ten: 'Xuất danh sách đang mở', duong: [], panel: 'xuat-ds',
      dangO: { cau: 'Xuất Excel đúng danh sách học viên đang lọc.' },
      muc: [{ id: 'pxd-xuat', viec: 'lich-thi', ten: 'Xem lịch thi, xuất danh sách', buoc: ['Chọn mẫu bảng, rồi xuất: tệp Excel tải về máy.', 'Muốn ít em hơn: đóng panel, lọc lại danh sách.'] }],
    },
  ],
  luat: [
    { id: 'han-cham', ten: 'Hạn chấm Mock Test', buoc: ['Bài của tuần Test: chấm xong trước hết <b>Thứ Tư</b> tuần kế.', 'MT0: hết <b>Thứ Tư</b> tuần sau.', 'Speaking chấm chéo không tính quá hạn.'] },
    { id: 'han-xac-nhan', ten: 'Hạn Xác nhận PA', buoc: ['<b>5 ngày</b> từ ngày chốt lượt, tính cả ngày đầu.', 'SOS 3 / Gấp: <b>3 ngày</b>.', 'Progress Test lớp thường: Xác nhận Case trong 5 ngày.'] },
    { id: 'han-ket-qua', ten: 'Hạn Ghi kết quả PA', buoc: ['Kỳ <b>2 tuần</b>; hạn <b>Thứ Ba</b> sau kỳ. Lưu nháp không đổi hạn.', 'Kỹ năng đạt ở MT sau → <b>Kết quả cuối</b>, rồi Hoàn thành Case.', 'Chưa có ngày thi → mốc là MT cuối lộ trình.'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc có chip hạn ở cuối dòng.' } },
    { id: 'han-vi-pham', ten: 'Hạn Xử lý vi phạm', buoc: ['Em có từ 3 vi phạm trong tuần này + tuần trước → GVCN xử lý trong <b>5 ngày</b>, tính cả ngày ghi.', 'Bậc cần QL thì QL duyệt; lưu xử lý → TVV báo phụ huynh trong 5 ngày.'] },
    { id: 'han-ql', ten: 'QL trả lời đề xuất', buoc: ['QL trả lời Đề xuất PA / Xin hỗ trợ trong <b>hạn duyệt</b> (mặc định 5 ngày, Quản trị đổi được), tính cả ngày gửi.'] },
    { id: 'dau-gach', ten: 'Dấu "-" (vắng)', buoc: ['Gõ "-" = vắng, chốt ngay: lần 1 dời sang tuần sau tuần Test.', 'MT, MT0 vắng 2 lần thì huỷ (không thẻ, không nhắc). Progress / Final lớp thường không tự huỷ — cần dừng thì ⋯ › Huỷ môn (Hoàn tác / Khôi phục được). Tuần Test đã qua 2 tuần: "-" không dời, không tính lần vắng.', 'Chọn tuần cho kỹ năng (Dời) = xếp lại từ đầu. Gỡ vắng: xoá "-", lúc nào cũng được.'] },
    { id: 'sos-case', ten: 'SOS và Case', buoc: ['Số kỹ năng dưới kỳ vọng ở MT: 1 → SOS 1, 2 → SOS 2, 3–4 → SOS 3.', 'Lượt chưa chốt: Case tạm “Chờ chốt SOS” — ghi / sửa mô tả, đặt / sửa PA được; chưa hạn, chưa việc.', 'Lượt chốt: PA của bạn cùng loại PA quy chế thì giữ; khác → việc <b>Chọn PA</b> (Theo quy chế / Giữ PA của tôi — QL duyệt trong 3 ngày, quá hạn tự duyệt).',
      'Bấm chip SOS ở mọi màn: hộp “Vì sao SOS n” — kỹ năng dưới kỳ vọng, điểm từng kỹ năng, lối mở hồ sơ MT.'] },
    { id: 'ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['PA quy chế: GVCN / QL bấm <b>Kết thúc sớm…</b> ở thẻ PA.', 'Lý do bắt buộc, từ <b>8</b> ký tự; nhật ký PA ghi lại.'] },
    { id: 'ban-giao', ten: 'Bàn giao khi em chuyển lớp', buoc: ['GV bộ môn và GVCN cùng một hạn: Cấu hình hệ thống › <b>Hạn mặc định</b> (gốc <b>7 ngày</b>), tính cả ngày ra quyết định; quá hạn QL được báo, em vẫn chuyển đúng tuần.', 'Kỹ năng ở lớp mới vẫn do đúng GV cũ dạy → không cần bàn giao.'] },
    { id: 'sua-diem', ten: 'Sửa điểm sau hoàn tất', buoc: ['Ô còn trống: nhập được cả sau hoàn tất.', 'Sửa hoặc xoá một điểm đã có: nhờ QL sửa.', 'Gỡ "-" lúc nào cũng được.'] },
    { id: 'nhan-xet', ten: 'Nhận xét MT', buoc: ['Ô có điểm nên có nhận xét từ <b>10</b> ký tự, tối đa 300 — chỉ MT mới nhất của em (chỉ nhắc, không chặn).', 'Ô dưới kỳ vọng thêm nhóm nguyên nhân.', 'Nhận xét + nhóm thành mô tả Case khi Case chưa có mô tả.'] },
  ],
  tu: [
    { ten: 'MT (Mock Test)', nghia: 'Mock Test 4 kỹ năng L R W S của lớp Fast Track; MT0 là mốc đầu vào.' },
    { ten: 'Lớp thường (không phải FT)', nghia: 'Pre FOU, FOU, BE, ELE — làm Progress Test và Final Test, đếm theo môn; “tuần 5/8” = tuần đang học / số tuần của khoá.' },
    { ten: 'Kỳ vọng', nghia: 'Band em cần đạt ở mỗi MT theo lộ trình.' },
    { ten: 'SOS 1 · 2 · 3', nghia: 'Theo số kỹ năng dưới kỳ vọng: 1, 2, hoặc 3–4. SOS 1 viền mảnh · SOS 2 viền dày nền cam nhạt · SOS 3 nền đỏ đậm chữ trắng; SOS tạm viền đứt.' },
    { ten: '✓ / ✗ cạnh điểm', nghia: '✓ xanh lá vượt kỳ vọng · ✓ xanh dương bằng · ✗ đỏ dưới. Hộp nhập điểm: ▲ / ▼ so kỳ vọng.' },
    { ten: 'Case (hồ sơ vấn đề)', nghia: 'Hồ sơ một vấn đề học thuật của em: nguyên nhân, PA, kết quả.' },
    { ten: 'Case tạm / SOS tạm', nghia: 'Lượt MT chưa chốt: SOS và Case chỉ tạm (“Chờ chốt SOS”) — sửa mô tả, đặt / sửa PA được; chưa hạn, chưa việc, chưa vào số đếm. Chốt: PA của GV cùng loại PA quy chế thì giữ, khác thì “Chọn PA”.' },
    { ten: 'KCK', nghia: 'Không cam kết Target: không kỳ vọng MT, không SOS tự động; vẫn có lịch MT, nhập điểm, Case tay, Ý thức.' },
    { ten: 'PA (phương án)', nghia: 'Cách hỗ trợ em: Xếp tự học, Bổ trợ, Tutor…' },
    { ten: 'PA quy chế', nghia: 'PA mặc định theo mức SOS, chạy tới mốc quy chế.' },
    { ten: 'PA Bổ trợ', nghia: 'PA của lớp thường sau Progress Test, chạy đến Cuối khoá.' },
    { ten: 'Tutor (học kèm)', nghia: 'PA học kèm; ghi kết quả từng buổi.' },
    { ten: 'Nháp kết quả PA', nghia: 'Kết quả PA ghi tạm (Lưu nháp): lưu trên máy chủ, sửa nhiều lần, chưa chốt; dòng việc có chip “Có nháp”.' },
    { ten: 'GVCN · GVBM', nghia: 'Giáo viên chủ nhiệm lớp · giáo viên dạy một kỹ năng.' },
    { ten: 'Chấm Speaking', nghia: 'GV có kỹ năng Speaking chấm S Mock mọi lớp FT chi nhánh mình.' },
    { ten: 'Mã tuần', nghia: '<b>W2 OCT</b> = tuần thứ 2 của tháng 10; tuần thuộc tháng chứa Thứ Năm.' },
    { ten: 'QL (Quản lý)', nghia: 'Quản lý chi nhánh — duyệt Case, PA, đề xuất, lịch Test.' },
  ],
};
