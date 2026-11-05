/**
 * Hướng dẫn QUẢN LÝ — HD-V2 (b). Đặc tả `docs/superpowers/specs/2026-11-05-huong-dan-v2/de-xuat.md` mục 3, 4, 9, 10; mockup `thiet-ke/v14/huong-dan.html`
 * (trạng thái B: QL đang mở Case); bảng lối chính đã đối chiếu mã ở `thiet-ke/v14/huong-dan-ghi-chu.md`. `lam` là MỘT nguồn — "Việc làm ở đây" của
 * mỗi màn dựng từ `loiChinh` / `loiTat` (phép HD-LOI, HD-MOT). Màn trùng GV (Học viên & Lớp, Hồ sơ…) lấy mục chung của GV (`mucGv`), chỉ viết phần hơn.
 * QT dùng lại cả tệp này (`qt.ts`). PR đổi màn / nhãn nào thì sửa ở đây; `data-hd` phải có thật trong web/src (HD-CHI).
 */
import { HD_GV } from './gv.ts';
import type { HuongDan, MucHd } from './kieu.ts';

const CV = '/cong-viec';
const HV = '/hoc-vien';
const TEST = '/test/lich';
const KH = '/test/ke-hoach';
const DA_XOA = '/quan-tri?tab=da-xoa';
const KHONG_QT = { ten: 'Xoá lớp, xoá học viên', cua: 'việc của Quản trị' } as const;
const DEN_KH = { ten: 'Xếp, dời lịch Test', den: { chu: 'Kế hoạch Test', duong: KH } } as const;

/** Mục chung của màn GV (không có `viec`) — QL dùng nguyên. */
const mucGv = (man: string, id: string): MucHd => HD_GV.man.find((m) => m.id === man)!.muc.find((m) => m.id === id)!;
export const luatGv = (...ids: string[]): MucHd[] => ids.map((id) => HD_GV.luat.find((m) => m.id === id)!);

export const HD_QL: HuongDan = {
  viec: [],
  lam: [
    /* ---------------------------------------------------------------- Duyệt */
    {
      id: 'duyet', ten: 'Duyệt yêu cầu, đề xuất PA, chuyển lớp, Ý thức', nhom: 'duyet',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chờ bạn duyệt', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Nhóm <b>Chờ bạn duyệt</b> ở đầu — bấm dòng để duyệt.' } },
      loiTat: ['tong-quan', 'cho-duyet', 'ho-so-hv'], tatThem: ['Thông báo'], cung: 'mở cùng panel duyệt.',
      buoc: ['Mở <b>Công việc</b>, nhóm <b>Chờ bạn duyệt</b>; quá hạn xếp trước.', 'Bấm dòng: panel mở bên phải, thẻ ghi "Nếu duyệt: …".',
        '<b>Duyệt</b> (<b>Duyệt…</b> khi cần chọn thêm) hoặc <b>Từ chối…</b> kèm lý do; <b>Xin ý kiến</b>: <b>Trả lời…</b>.',
        'Ý thức: duyệt xong GVCN bấm <b>Đã thực hiện</b>; thẻ <b>Báo QL</b> chỉ để biết.'],
      tuKhac: ['duyệt', 'từ chối', 'đề xuất', 'xin ý kiến', 'xin xoá', 'ý thức', 'wl 3', 'dời lịch', 'approve', 'reject', 'request'],
    },
    /* ---------------------------------------------------------------- Điểm */
    {
      id: 'nhap-ho', ten: 'Nhập hộ bài quá hạn', nhom: 'diem',
      loiChinh: { man: 'tong-quan', chu: 'Tổng quan › Bài chấm quá hạn', duong: '/', chi: { hd: 'tq-gv-tre', duong: '/', chu: 'Bấm số ở cột <b>Bài chấm quá hạn</b> của GV.' } },
      loiTat: ['cong-viec', 'p-nhap-diem'], tatThem: ['Công việc › Của GV'], cung: 'mở cùng lưới nhập.',
      buoc: ['Ở <b>Tổng quan</b>, bảng <b>Giáo viên</b>: bấm số ở cột <b>Bài chấm quá hạn</b>.', 'Panel <b>Chấm quá hạn</b>: bấm dòng lớp · lượt · kỹ năng, xem em còn trống.',
        'Bấm <b>Nhập hộ</b>, gõ điểm; em vắng gõ <b>-</b>, rồi lưu.'],
      tuKhac: ['chấm thay', 'nhập thay', 'quá hạn', 'điểm', 'nhập điểm', 'enter score', 'overdue'],
    },
    {
      id: 'sua-diem', ten: 'Nhập điểm, sửa điểm một lớp', nhom: 'diem',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: TEST, chi: { hd: 'lich-test-tuan', duong: TEST, chu: 'Mỗi lớp một dòng — bấm dòng để mở lưới điểm.' } },
      loiTat: ['diem-lop', 'ho-so-lop', 'nhap-diem'], tatThem: ['⋯ dòng em'], cung: 'mở cùng lưới điểm.',
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b>, bấm dòng lớp: lưới điểm mở ngay dưới.', 'Ô còn trống: gõ điểm; em vắng gõ <b>-</b>.',
        'Sửa hoặc xoá một điểm đã có (chỉ QL): bấm ô, sửa, ghi <b>Lý do sửa</b> (tuỳ chọn); nhật ký ghi lại.'],
      tuKhac: ['sửa điểm', 'chấm', 'điểm', 'mock test', 'progress test', 'final test', 'edit score', 'grade'],
    },
    /* ---------------------------------------------------------------- Case và PA */
    {
      id: 'case-lam-thay', ten: 'Xác nhận PA, ghi kết quả thay GV', nhom: 'case',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Của GV › Case học thuật', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Chọn <b>Của GV</b>, việc Case nằm ở nhóm <b>Case học thuật</b>.' } },
      loiTat: ['ho-so-hv', 'p-case'], cung: 'mở cùng Case.',
      buoc: ['Mở <b>Công việc</b>, chọn <b>Của GV</b>, nhóm <b>Case học thuật</b>.', 'Bấm dòng: <b>Xác nhận Case</b>, <b>Mô tả Case</b>, <b>Xác nhận PA</b> hoặc <b>Ghi kết quả PA</b>.', 'Ghi nội dung, bấm nút lưu ở chân.'],
      tuKhac: ['phương án', 'sos', 'kết quả', 'xác nhận', 'làm thay', 'confirm'],
    },
    {
      id: 'xem-case', ten: 'Xem mọi Case của em', nhom: 'case',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Case & phương án' },
      loiTat: ['hoc-vien'], cung: 'mở cùng Case.',
      buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>.', 'Bấm ô kỹ năng; khối <b>Case & phương án</b> hiện Case của kỹ năng đó.', 'Bấm Case để mở ngay trong cột.'],
      tuKhac: ['lịch sử Case', 'Case history'],
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
      id: 'doi-chu-case', ten: 'Đổi người phụ trách Case', nhom: 'case',
      loiChinh: { man: 'p-case', chu: 'Trong Case › Đổi người…' },
      buoc: ['Mở Case, bấm <b>Đổi người…</b> ở dải đầu.', 'Chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.', 'Việc <b>Chọn người phụ trách</b> ở Công việc mở đúng hộp này.'],
      tuKhac: ['phụ trách', 'giao Case', 'owner'],
    },
    {
      id: 'ket-thuc-pa', ten: 'Kết thúc PA sớm', nhom: 'case',
      loiChinh: { man: 'p-case', chu: 'Trong Case › ⋯ ở dòng PA' },
      buoc: ['Chỉ PA quy chế đang chạy: <b>⋯</b> ở dòng PA › <b>Kết thúc PA</b>.', '<b>Lý do</b> bắt buộc, từ 10 ký tự; nhật ký PA ghi lại.'],
      tuKhac: ['dừng PA', 'end PA', 'stop'],
    },
    /* ---------------------------------------------------------------- Học viên và lớp */
    {
      id: 'chuyen-lop', ten: 'Chuyển lớp một em', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Chuyển lớp…' },
      loiTat: ['ho-so-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Chuyển lớp…</b>', 'Chọn <b>Lớp chuyển đến</b>, <b>Tuần bắt đầu</b>, ghi <b>Lý do</b>.', '<b>Ngay hôm nay</b> → <b>Chuyển ngay</b> (không hoàn tác); tuần khác → <b>Quyết định chuyển lớp</b>.'],
      tuKhac: ['đổi lớp', 'chuyển lớp', 'sang lớp', 'bàn giao', 'change class', 'transfer'],
    },
    {
      id: 'sua-hv', ten: 'Sửa thông tin em, đổi Target', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Sửa thông tin' },
      loiTat: ['ho-so-lop'], cung: 'sửa cả lớp một lần.',
      buoc: ['Ở hồ sơ em, bấm <b>⋯ › Sửa thông tin</b>.', 'Đổi Target: ghi <b>Lý do đổi Target</b>; GVCN sửa thì thành đề xuất chờ bạn quyết.', 'Cả lớp: hồ sơ lớp, tab <b>Học viên</b> › <b>Sửa thông tin</b>.'],
      tuKhac: ['target', 'họ tên', 'ngày sinh', 'liên hệ', 'edit student'],
    },
    {
      id: 'them-hv', ten: 'Thêm lớp, thêm học viên', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › + Lớp mới · + Học viên', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Nút thêm lớp, thêm học viên ở hàng này.' } },
      buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Lớp mới</b> · <b>+ Học viên</b> (điện thoại: trong <b>⋯</b>).', '<b>+ Học viên</b>: dán vùng bảng từ Excel hoặc gõ từng em.', 'Thiếu <b>Email</b> vẫn lưu; em có việc <b>Thiếu email</b>.'],
      tuKhac: ['lớp mới', 'dán excel', 'import', 'new student', 'new class'],
    },
    {
      id: 'luu-tru', ten: 'Lưu trữ, bỏ lưu trữ', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Lưu trữ' },
      loiTat: ['ho-so-lop', 'luu-tru'], cung: 'mở cùng chỗ.',
      buoc: ['Em đã học xong: <b>⋯ › Lưu trữ</b> ở hồ sơ em (có <b>Hoàn tác</b>).', 'Nhiều em: hồ sơ lớp, <b>Chọn nhiều học viên</b> › <b>Lưu trữ</b>.', 'Xem lại: <b>⋯ › Lưu trữ</b> ở Học viên & Lớp; mỗi em <b>Tổng kết</b> · <b>Học lại</b> · <b>Bỏ lưu trữ</b>.'],
      tuKhac: ['cất', 'học lại', 'archive', 'restore student'],
    },
    {
      id: 'lich-su', ten: 'Xem Lịch sử', nhom: 'hv',
      loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › ⋯ › Lịch sử' },
      loiTat: ['ho-so-lop'], cung: 'mở cùng chỗ.',
      buoc: ['Hồ sơ em: <b>⋯ › Lịch sử</b>; hồ sơ lớp: <b>⋯ › Lịch sử</b> hoặc <b>⋯ › Lịch sử góp ý tuần</b>.', 'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau; lô / Excel bấm <b>Xem</b> mở từng em.'],
      tuKhac: ['nhật ký', 'ai sửa', 'history', 'audit', 'log'],
    },
    {
      id: 'lich-thi', ten: 'Xem lịch thi, xuất Excel', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Lịch thi', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      buoc: ['Mở <b>Học viên & Lớp</b>, góc <b>Lịch thi</b>.', '<b>Xuất Excel · n HV</b>: xuất đúng danh sách đang lọc.'],
      tuKhac: ['excel', 'xuất', 'export', 'ngày thi'],
    },
    {
      id: 'chot-lo-trinh', ten: 'Chốt lộ trình lớp thường', nhom: 'hv',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chốt lộ trình', duong: CV },
      loiTat: ['ho-so-lop'], cung: 'mở cùng bảng lộ trình.',
      buoc: ['Lớp thường sắp hết khoá: mở <b>Công việc</b>, bấm dòng <b>Chốt lộ trình</b> (hạn 7 ngày).', 'Chọn hướng từng em (Lên lớp, Học lại, Lên FT…).', 'Lớp cũ có phiếu bàn giao; xong bấm lưu.'],
      tuKhac: ['hết khoá', 'lên lớp', 'học lại', 'lộ trình tiếp theo', 'end of course'],
    },
    {
      id: 'buoc-tiep', ten: 'Chọn bước tiếp sau thi', nhom: 'hv',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chọn bước tiếp', duong: CV },
      loiTat: ['ho-so-hv'], cung: 'mở cùng chỗ.',
      buoc: ['Em FT đã thi: mở <b>Công việc</b>, bấm dòng <b>Cập nhật kết quả thi thật</b>, rồi <b>Chọn bước tiếp</b> (QL hoặc TVV chọn).', 'Panel <b>Sau thi</b>: ô <b>Bước tiếp</b> chọn Lộ trình mới hoặc Tạm dừng / Kết thúc học, ghi chú, lưu.', 'Hạn ngày thi + 7 ngày, <b>Gia hạn</b> được.'],
      tuKhac: ['thi thật', 'kết quả thi', 'tạm dừng', 'thôi học', 'next step', 'sau thi'],
    },
    /* ---------------------------------------------------------------- Lịch Test */
    {
      id: 'xep-lich', ten: 'Xếp, dời lịch Test nhiều lớp', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test', duong: KH, chi: { hd: 'kht-loc', duong: KH, chu: 'Chọn chương trình, lọc lớp, xếp nhiều MT ở hàng này.' } },
      buoc: ['Mở <b>Test › Kế hoạch Test</b>; chip <b>Cần xếp lại</b> chỉ lớp có em cần xếp.', 'Fast Track: <b>Xếp nhiều MT…</b>; lớp thường: <b>Xếp lịch Test…</b>.',
        'Một kỹ năng: bấm ô MT, mỗi môn <b>Dời</b> · <b>Vắng</b> · <b>Bỏ khỏi đợt</b>, rồi <b>Lưu</b>.', '<b>⋯</b> có <b>Dời hạn chấm</b>, <b>Huỷ điểm</b>, <b>Nhật ký</b>, <b>Xóa lịch</b>.'],
      tuKhac: ['dời lịch', 'xếp lịch', 'lịch mt', 'dời hạn chấm', 'schedule', 'reschedule'],
    },
    {
      id: 'thi-lai-s-ex', ten: 'Thi lại, thêm S Ex', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test › ô MT · cột S Ex', duong: KH },
      buoc: ['Môn đã có điểm mà em thi lại: bấm ô MT, bấm <b>Thi lại</b> ở môn đó (điểm cũ giữ trong Lịch sử).', 'Thêm lượt Speaking Expert: <b>+ MT</b> cuối hàng em › <b>S Ex</b>, chọn ngày, <b>Lưu</b>.', 'Điểm S Ex không vào Overall, không vào SOS.'],
      tuKhac: ['thi lại', 'retake', 'speaking expert', 's expert', 'mt thêm'],
    },
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này, bài quá hạn chấm', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: TEST },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới — mỗi lớp một dòng; <b>Mở tất cả lớp</b> mở hết lưới.'],
      tuKhac: ['lịch test', 'quá hạn', 'schedule'],
    },
    {
      id: 'xuat-test', ten: 'Xuất Excel kế hoạch, điểm Test', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test › Xuất Excel', duong: KH },
      loiTat: ['lich-test'], cung: 'xuất kết quả Test.',
      buoc: ['<b>Xuất Excel</b>: Kế hoạch Test 13 cột theo bộ lọc đang xem.', '<b>Xuất điểm Test</b>: <b>Điểm + nhận xét</b> hoặc <b>Chỉ điểm</b>; theo tuần, theo lớp hoặc lớp + khoảng tuần.'],
      tuKhac: ['excel', 'xuất', 'export', 'download'],
    },
    /* ---------------------------------------------------------------- Khác */
    {
      id: 'xem-viec', ten: 'Xem việc của bạn và của GV', nhom: 'khac',
      loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV, chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc ở đây.' } },
      buoc: ['Mở <b>Công việc</b>: <b>Của tôi · Của GV · Tất cả</b>; ô <b>▾</b> chọn một GV.', '<b>Chờ bạn duyệt</b> ở đầu; quá hạn có ⚠; chip <b>⚠ quá hạn</b> lọc hết quá hạn.'],
      tuKhac: ['việc', 'todo', 'tasks'],
    },
    {
      id: 'phan-cong', ten: 'Phân công người phụ trách', nhom: 'khac',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Chưa có người phụ trách', duong: CV },
      buoc: ['Mở <b>Công việc</b>; việc <b>Chưa có người</b> có nút <b>Phân công…</b>', 'Chọn GV dạy môn của lớp, lưu.'],
      tuKhac: ['phân công gv', 'chưa có người', 'assign'],
    },
    {
      id: 'van-hanh', ten: 'Giao việc, theo dõi vận hành', nhom: 'khac',
      loiChinh: { man: 'van-hanh', chu: 'Công việc › Vận hành', duong: '/cong-viec/van-hanh', chi: { hd: 'vh-so', duong: '/cong-viec/van-hanh', chu: 'Bấm một số để lọc việc.' } },
      buoc: ['Bốn số lọc: <b>Quá hạn</b> · <b>Chờ người khác</b> · <b>Cần quyết định</b> · <b>Vừa hoàn thành (7 ngày)</b>.', '<b>+ Giao việc</b>: việc ngoài học viên (giáo trình, tutor…), có người phụ trách, hạn.'],
      tuKhac: ['giao việc', 'giáo trình', 'tutor', 'task', 'operations'],
    },
    {
      id: 'bao-cao-tuan', ten: 'Báo cáo họp đơn vị', nhom: 'khac',
      loiChinh: { man: 'bao-cao', chu: 'Công việc › Họp đơn vị', duong: '/cong-viec/bao-cao' },
      buoc: ['Chọn <b>Tuần</b> / <b>Tháng</b>, ‹ › đổi kỳ.', 'Bảng <b>Tình hình đơn vị</b>: đơn vị nào đã nộp, đang nhập, chưa báo cáo; nộp muộn gắn "nộp muộn".'],
      tuKhac: ['họp', 'báo cáo', 'meeting', 'report'],
    },
    {
      id: 'phan-tich', ten: 'Xem thống kê theo kỳ', nhom: 'khac',
      loiChinh: { man: 'phan-tich', chu: 'Tổng quan › Phân tích', duong: '/phan-tich', chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
      buoc: ['Mở <b>Phân tích</b>; chọn <b>Từ tuần → Đến tuần</b> cho mọi tab.', 'Sáu tab: <b>Báo cáo HV</b> · <b>Phân tích GV</b> · <b>Test + SOS</b> · <b>Kết quả Test / Thi</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>.', 'Bấm số mở danh sách tại trang; <b>In</b> ra A4 ngang.'],
      tuKhac: ['thống kê', 'báo cáo', 'in', 'analytics', 'report'],
    },
    {
      id: 'khoi-phuc', ten: 'Khôi phục thứ đã xoá', nhom: 'khac',
      loiChinh: { man: 'quan-tri', chu: 'Tài khoản › Đã xoá', duong: DA_XOA, chi: { hd: 'tai-khoan', chu: 'Bấm tên bạn › <b>Đã xoá</b>.' } },
      tatThem: ['Hoàn tác (5 giây)', 'Bảng quy đổi band › tab Đã xoá'], cung: 'mở cùng danh sách.',
      buoc: ['Xoá nhầm: bấm <b>Hoàn tác</b> ngay trong 5 giây.', 'Quá 5 giây: menu Tài khoản › <b>Đã xoá</b>.', 'Chọn mục, bấm <b>Khôi phục</b>.'],
      tuKhac: ['thùng rác', 'đã xoá', 'xoá nhầm', 'restore', 'undo', 'trash'],
    },
    {
      id: 'tim-kiem', ten: 'Tìm em, lớp, GV', nhom: 'khac',
      loiChinh: { chu: 'Ô tìm trên thanh trên', chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
      buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp · GV</b>; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.'],
      tuKhac: ['tìm', 'search', 'find', 'ft101'],
    },
  ],
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-viec', 'duyet', 'nhap-ho'] },
    { nhip: 'Mỗi tuần', viec: ['xep-lich', 'xem-lich-test', 'sua-diem', 'case-lam-thay'] },
    { nhip: 'Khi có', viec: ['chuyen-lop', 'sua-hv', 'them-hv', 'tao-case', 'case-hoan-thanh', 'doi-chu-case', 'ket-thuc-pa', 'thi-lai-s-ex', 'phan-cong', 'khoi-phuc', 'luu-tru'] },
    { nhip: 'Lớp sắp hết khoá', viec: ['chot-lo-trinh', 'buoc-tiep'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich', 'bao-cao-tuan', 'van-hanh', 'xuat-test', 'lich-thi'] },
    { nhip: 'Khi cần tra', viec: ['xem-case', 'lich-su', 'tim-kiem'] },
  ],
  vaiKhac: [
    { ten: 'Tạo, sửa, xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account', 'xoá tài khoản'] },
    { ten: 'Đổi quyền', cua: 'việc của Quản trị', tuKhac: ['quyền', 'permission'] },
    { ten: 'Xoá lớp, xoá học viên', cua: 'việc của Quản trị', tuKhac: ['xoá lớp', 'xoá học viên', 'delete class'] },
    { ten: 'Báo PH vi phạm', cua: 'việc của TVV', tuKhac: ['phụ huynh', 'gọi', 'parent'] },
    { ten: 'Chốt ngày thi', cua: 'việc của TVV', tuKhac: ['ngày thi', 'exam date'] },
    { ten: 'Đề xuất chuyển lớp, xin hỗ trợ QL', cua: 'việc của GV', tuKhac: ['đề xuất', 'xin hỗ trợ'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Số của chi nhánh, GV chấm quá hạn và việc chờ bạn duyệt.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [DEN_KH, { ten: 'Xem thống kê theo kỳ', den: { chu: 'Phân tích', duong: '/phan-tich' } }],
      muc: [
        { id: 'ql-tq-cho-duyet', ten: 'Chỉ số', buoc: ['Dải đầu trang: <b>Đạt MT</b> · <b>Case có PA</b> · <b>Chờ duyệt</b> · <b>Thi tháng này</b>.', 'Bấm số mở danh sách ngay tại trang.'],
          chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để mở đúng danh sách.' } },
        { id: 'tq-duyet', viec: 'duyet', ten: 'Chờ bạn duyệt', buoc: ['<b>Chờ bạn duyệt</b> (cột phải): bấm dòng mở panel <b>Duyệt / Từ chối</b>.', '<b>Hộp duyệt ›</b> xem hết.'],
          chi: { hd: 'tq-can-xu-ly', duong: '/', chu: 'Chờ bạn duyệt — bấm dòng để duyệt.' } },
        { id: 'ql-tq-so-lieu', ten: 'Lớp cần chú ý · Giáo viên', buoc: ['<b>Lớp cần chú ý</b>: Đạt MT, SOS 1 · 2 · 3, Case chưa PA, Thi tháng này; 5 lớp cần chú ý nhất.', '<b>Giáo viên</b>: <b>Hành chính</b> / <b>Học thuật</b>; bấm số ở <b>Bài chấm quá hạn</b> để nhập hộ.'],
          chi: { hd: 'tq-lop-chu-y', duong: '/', chu: 'Mỗi lớp một hàng; bấm số để xử lý.' } },
      ],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      dangO: { cau: 'Thống kê theo kỳ: học viên, GV, Test, PA, Ý thức.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [{ ten: 'Duyệt yêu cầu', den: { chu: 'Công việc › Chờ bạn duyệt', duong: CV } }, { ten: 'Nhập hộ, sửa điểm', den: { chu: 'Lịch Test tuần', duong: TEST } }],
      muc: [
        { id: 'ql-pt-goc', viec: 'phan-tich', ten: 'Sáu tab phân tích', buoc: ['<b>Báo cáo HV</b> (mặc định): 5 số như Tổng quan, <b>Kết quả MT</b>, <b>Tiến bộ theo kỹ năng</b>; <b>In</b> ra A4 ngang.', '<b>Phân tích GV</b>: bảng <b>Gọn</b> / <b>Đầy đủ</b> — Hành chính | Học thuật.'],
          chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
        { id: 'ql-pt-thoi-gian', ten: 'Khoảng thời gian', buoc: ['<b>Từ tuần → Đến tuần</b> cho mọi tab (mặc định 2 tuần vừa qua), thêm <b>Toàn bộ</b> · <b>Chọn khoảng tuần</b>.', 'Bảng dài: 10 dòng một trang, chọn 20 / 50 ở đầu hoặc cuối bảng.'],
          chi: { hd: 'pt-thoi-gian', duong: '/phan-tich', chu: 'Đổi khoảng cho mọi tab ở đây.' } },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp; thêm lớp, học viên; xem nhanh một em không rời trang.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [DEN_KH, KHONG_QT],
      muc: [
        mucGv('hoc-vien', 'hv-tim'), mucGv('hoc-vien', 'hv-goc'),
        { id: 'hvl-xem-case', viec: 'xem-case', ten: 'Xem mọi Case của em', buoc: ['Bấm dòng em: panel một em mở bên phải, không rời trang.', 'Khối <b>Case & phương án</b>: bấm Case để mở.'] },
        { id: 'ql-hvl-pham-vi', ten: 'Phạm vi và Lưu trữ', buoc: ['<b>Phạm vi</b>: Lớp tôi dạy · Chi nhánh.', '<b>Cần làm</b> chia <b>Quá hạn · Chờ duyệt · Thiếu thông tin</b> (gồm <b>Thiếu email</b>).', '<b>⋯ › Lưu trữ</b>: lớp đã kết thúc, em đã lưu trữ.'],
          chi: { hd: 'hvl-goc', duong: HV, chu: 'Ba góc nhìn và lọc phụ ở hàng này.' } },
      ],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: em, điểm các lượt, việc của lớp.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [DEN_KH, KHONG_QT],
      muc: [
        { id: 'lop-nhap-diem', viec: 'sua-diem', ten: 'Nhập điểm, sửa điểm một lớp', buoc: ['Bấm nút <b>Nhập điểm</b> đầu trang, hoặc <b>⋯</b> ở dòng em › <b>Nhập điểm</b>.', 'Chọn lượt và môn, gõ điểm; sửa điểm đã có: bấm ô.'] },
        mucGv('ho-so-lop', 'lop-hoc-vien'),
        { id: 'lop-tao-case', viec: 'tao-case', ten: 'Tạo Case tay', buoc: ['Ở dòng em bấm <b>⋯ › + Case</b>.', 'Ghi mô tả, lưu.'] },
        { id: 'lop-chuyen', viec: 'chuyen-lop', ten: 'Chuyển lớp một em', buoc: ['Ở dòng em bấm <b>⋯ › Chuyển lớp…</b>; nhiều em: <b>Chọn nhiều học viên</b> › <b>Chuyển lớp…</b>.', 'Chọn <b>Lớp chuyển đến</b>, <b>Tuần bắt đầu</b>, ghi <b>Lý do</b>.'] },
        { id: 'lop-sua', viec: 'sua-hv', ten: 'Sửa thông tin cả lớp', buoc: ['Tab <b>Học viên</b> › <b>Sửa thông tin</b>: bảng cả lớp, sửa nhiều em một lần.', 'Đổi Target nhiều em: một <b>Lý do đổi Target</b> chung.'] },
        { id: 'lop-luu-tru', viec: 'luu-tru', ten: 'Lưu trữ nhiều em', buoc: ['<b>Chọn nhiều học viên</b> › <b>Lưu trữ</b>.', 'Xem lại ở <b>Học viên & Lớp</b> › <b>⋯ › Lưu trữ</b>.'] },
        { id: 'lop-lich-su', viec: 'lich-su', ten: 'Xem Lịch sử', buoc: ['<b>⋯ › Lịch sử</b>: thông tin lớp, tiến độ, phân công; <b>⋯ › Lịch sử góp ý tuần</b>: góp ý cũ.', 'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau.'] },
        { id: 'lop-chot', viec: 'chot-lo-trinh', ten: 'Chốt lộ trình lớp thường', buoc: ['Hồ sơ lớp › <b>Chốt lộ trình</b>: chọn hướng từng em (Lên lớp, Học lại, Lên FT…).', 'Lớp cũ có phiếu bàn giao.'] },
        { id: 'ql-lop-chon-nhieu', ten: 'Chọn nhiều học viên', buoc: ['<b>Chọn nhiều học viên</b> → <b>Chuyển lớp…</b> · <b>Lưu trữ</b> · <b>Kết thúc học</b> · <b>Huỷ chuyển lớp</b> · <b>Xoá</b>.'] },
        { id: 'ql-lop-ban-giao', ten: 'Bàn giao khi chuyển lớp', buoc: ['Dải <b>Bàn giao</b> trên đầu hồ sơ lớp → <b>Mở phiếu</b>.', 'GVCN lớp cũ viết nhận xét chung, GVBM mỗi môn một dòng; QL điền thay được.'] },
      ],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: điểm, Case, ý thức, lộ trình; sửa, chuyển lớp, lưu trữ.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [{ ten: 'Duyệt đề xuất PA', den: { chu: 'Công việc › Chờ bạn duyệt', duong: CV } }, { ten: 'Xoá học viên', cua: 'việc của Quản trị' }],
      muc: [
        mucGv('ho-so-hv', 'hv-hoc-thuat'),
        { id: 'hv-duyet', viec: 'duyet', ten: 'Duyệt thẻ của em', buoc: ['Thanh <b>Việc cần làm</b> dưới đầu trang: thẻ chờ bạn duyệt của em này.', 'Bấm mở panel, <b>Duyệt</b> hoặc <b>Từ chối…</b>.'] },
        { id: 'hv-case-thay', viec: 'case-lam-thay', ten: 'Xác nhận PA, ghi kết quả thay GV', buoc: ['Khối <b>Case & phương án</b>: bấm Case mở ngay trong cột.', 'Ghi nội dung, bấm nút lưu ở chân.'] },
        { id: 'hv-buoc-tiep', viec: 'buoc-tiep', ten: 'Chọn bước tiếp sau thi', buoc: ['Thanh <b>Việc cần làm</b>: dòng <b>Chọn bước tiếp ›</b>.', 'Chọn Lộ trình mới hoặc Tạm dừng / Kết thúc học, lưu.'] },
        { id: 'ql-hv-menu', ten: 'Thao tác với em', buoc: ['<b>⋯</b> trên đầu hồ sơ: <b>Sửa thông tin</b> · <b>Chuyển lớp…</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Lịch sử</b> · <b>Lưu trữ</b>.'] },
        mucGv('ho-so-hv', 'hv-y-thuc'), mucGv('ho-so-hv', 'hv-hanh-trinh'),
      ],
    },
    {
      id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
      dangO: { cau: 'Lớp đã kết thúc và em đã lưu trữ.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      muc: [{ id: 'ql-luu-tru', viec: 'luu-tru', ten: 'Lưu trữ, bỏ lưu trữ', buoc: ['Hai tab: <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b>.', 'Mỗi em: <b>Tổng kết</b> · <b>Học lại</b> · <b>Bỏ lưu trữ</b>.'] }],
    },
    {
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', TEST],
      dangO: { cau: 'Test của một tuần cả chi nhánh: quá hạn chấm, lớp có Test.', truoc: { chu: 'Kế hoạch Test', duong: KH }, sau: { chu: 'Công việc', duong: CV } },
      khongLam: [{ ten: 'Nhập hộ bài quá hạn', den: { chu: 'Tổng quan › Bài chấm quá hạn', duong: '/' } }],
      muc: [
        { id: 'lt-nhap-diem', viec: 'sua-diem', ten: 'Nhập điểm, sửa điểm một lớp', buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', 'Bấm dòng lớp: lưới điểm mở ngay dưới.', 'Gõ điểm; sửa điểm đã có: bấm ô, ghi <b>Lý do sửa</b>.'],
          chi: { hd: 'lich-test-tuan', duong: TEST, chu: 'Mỗi lớp một dòng — bấm dòng để mở lưới điểm.' } },
        { id: 'lt-xuat', viec: 'xuat-test', ten: 'Xuất Excel kết quả Test', buoc: ['<b>Xuất Excel</b> kết quả Test theo phạm vi của bạn; cột <b>Email</b> ngay sau Tên.', 'Điện thoại: nút nằm trong <b>Lọc</b>.'] },
      ],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: [KH],
      dangO: { cau: 'Xếp, dời lịch MT, Progress, Final các lớp; thi lại; S Ex.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [{ ten: 'Nhập hộ bài quá hạn', den: { chu: 'Tổng quan › Bài chấm quá hạn', duong: '/' } }],
      muc: [
        { id: 'ql-kh-ky-nang', ten: 'Một kỹ năng', buoc: ['Bấm ô MT: mỗi môn có <b>Dời</b> · <b>Vắng</b> · <b>Bỏ khỏi đợt</b>, rồi <b>Lưu</b>.', '<b>Dời</b> = chọn tuần = xếp lại từ đầu — cả môn vắng, huỷ vắng 2 lần, bỏ khỏi đợt.', '<b>⋯</b>: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b> · <b>Nhật ký</b>.'] },
        { id: 'ql-kh-luat', ten: 'Luật xếp lịch, tìm lớp', buoc: ['Link <b>Luật xếp lịch Test</b> trên hàng lọc.', 'Gõ mã lớp, tên (có / không dấu) hoặc email vào <b>Tìm lớp, học viên hoặc email…</b>; chọn em: lớp mở, hàng em được đánh dấu.'] },
        { id: 'ql-kh-xoa', ten: 'Xóa lịch một đợt', buoc: ['Bấm ô MT, ⋯ đầu hộp › <b>Xóa lịch</b> → đợt về <b>Chưa xếp</b>, lịch sử giữ; có <b>Hoàn tác</b>.', 'Đã có điểm / đã làm bài: mục mờ.'] },
        { id: 'ql-kh-ghi-chu', ten: 'Ghi chú lịch Test', buoc: ['Ô <b>Ghi chú lịch Test</b> trong hộp; ghi chú hiện một dòng dưới chip, bấm để sửa (Enter lưu · Esc huỷ).', '<b>+ Ghi chú lớp</b> dưới bảng. Chỉ là ghi chú, không dời lịch.'] },
      ],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp', duong: ['/test/diem-lop'],
      dangO: { cau: 'Gõ điểm một lượt Test của cả lớp.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'dl-nhap-diem', viec: 'sua-diem', ten: 'Nhập điểm, sửa điểm một lớp', buoc: ['Chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>).', '<b>Chỉ ô còn trống</b> để nhập nốt; sửa điểm đã có: bấm ô.'] }],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test của một em.', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'nd-go', viec: 'sua-diem', ten: 'Nhập điểm, sửa điểm một lớp', buoc: ['Gõ điểm; Enter sang ô còn nhập kế.', 'Em vắng: gõ <b>-</b>.', 'Sửa hoặc xoá một điểm đã có: bấm ô, ghi <b>Lý do sửa</b> (chỉ QL).'] }],
    },
    {
      id: 'cho-duyet', ten: 'Hộp duyệt', duong: ['/cong-viec/cho-duyet'],
      dangO: { cau: 'Thẻ cần bạn quyết, thẻ để biết, thẻ đã xử lý.', truoc: { chu: 'Tổng quan', duong: '/' } },
      muc: [
        { id: 'ql-cd-loc', viec: 'duyet', ten: 'Duyệt yêu cầu, đề xuất PA, chuyển lớp, Ý thức', buoc: ['<b>Chờ duyệt</b> · <b>Báo QL</b> (để biết) · <b>Đã xử lý (30 ngày)</b>; loại: <b>Tất cả · Học thuật · Ý thức · Dời lịch Test · Thông tin HV</b>.',
          '<b>Duyệt</b> / <b>Duyệt…</b> · <b>Từ chối…</b> (lý do bắt buộc) · <b>Mở</b>; <b>Xin ý kiến</b>: <b>Trả lời…</b> hoặc <b>+ Thêm PA</b>.', 'Đã xử lý: <b>Huỷ quyết định</b> · <b>Sửa trả lời…</b>.'],
          chi: { hd: 'cd-loc', duong: '/cong-viec/cho-duyet', chu: 'Chọn trạng thái và loại thẻ ở đây.' } },
        { id: 'ql-cd-nhieu', ten: 'Duyệt nhiều', buoc: ['Đề xuất PA, Dời lịch Test lần 2: đánh dấu ô ở thẻ cùng loại.', '<b>Duyệt n yêu cầu</b> hoặc <b>Từ chối n…</b>.'] },
      ],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Mọi việc của bạn và của GV; Chờ bạn duyệt ở đầu.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [DEN_KH, { ten: 'Tạo, sửa, xoá tài khoản', cua: 'việc của Quản trị' }],
      muc: [
        { id: 'ql-cv-cua-gv', ten: 'Việc của GV', buoc: ['<b>Của tôi · Của GV · Tất cả</b>; ô <b>▾</b> chọn một GV.', '<b>Việc quản lý</b> cuối (gập) có <b>+ Giao việc</b>, <b>Vận hành ›</b>, <b>Họp đơn vị ›</b>.'],
          chi: { hd: 'cv-loc-them', duong: CV, chu: 'Chọn việc của ai, lọc quá hạn ở đây.' } },
        { id: 'cv-nhap-ho', viec: 'nhap-ho', ten: 'Nhập hộ bài quá hạn', buoc: ['Chọn <b>Của GV</b>, nhóm <b>Chấm điểm</b>: dòng quá hạn có ⚠.', 'Bấm <b>Nhập hộ</b>, gõ điểm; em vắng gõ <b>-</b>.'] },
        mucGv('cong-viec', 'cv-gop'), mucGv('cong-viec', 'cv-qua-han'),
      ],
    },
    {
      id: 'van-hanh', ten: 'Vận hành', duong: ['/cong-viec/van-hanh'],
      dangO: { cau: 'Việc ngoài học viên: giáo trình, tutor… có người phụ trách, hạn.', truoc: { chu: 'Công việc', duong: CV } },
      muc: [],
    },
    {
      id: 'bao-cao', ten: 'Họp đơn vị', duong: ['/cong-viec/bao-cao'],
      dangO: { cau: 'Báo cáo tuần / tháng của các đơn vị.', truoc: { chu: 'Công việc', duong: CV } },
      muc: [],
    },
    {
      id: 'quan-tri', ten: 'Đã xoá', duong: ['/quan-tri'],
      dangO: { cau: 'Case, em, lớp đã xoá — khôi phục tại đây.', truoc: { chu: 'Tổng quan', duong: '/' } },
      muc: [{ id: 'ql-da-xoa', viec: 'khoi-phuc', ten: 'Khôi phục thứ đã xoá', buoc: ['Chọn mục đã xoá, bấm <b>Khôi phục</b>.', 'Mục khôi phục về đúng chỗ cũ; nhật ký ghi lại.'] }],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.' },
      muc: [mucGv('ho-so-ca-nhan', 'hs-sua'), { id: 'ql-goc-nhin', ten: 'Góc nhìn', buoc: ['Bạn kiêm thêm vai (vd GV): menu Tài khoản › <b>Góc nhìn</b> — xem web như vai đó.', 'Chọn lại vai gốc để làm việc bằng mọi vai.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [mucGv('huong-dan', 'hd-dung'), { id: 'ql-hd-xem-vai', ten: 'Xem vai khác', buoc: ['Ô <b>Vai</b> ở đầu: đọc hướng dẫn của GV, TVV, CX, Admin.'] }],
    },
    /* ---------------------------------------------------------------- panel đang mở (`KhungPanel hd=…`, đặc tả 8 + 10.1; mockup B) */
    {
      id: 'p-case', ten: 'Case đang mở', duong: [], panel: 'ngan-case',
      dangO: { cau: 'Một Case của em: PA, kết quả, người phụ trách.' },
      khongLam: [{ ten: 'Duyệt đề xuất PA', den: { chu: 'Công việc › Chờ bạn duyệt', duong: CV } }, { ten: 'Khôi phục Case đã xoá', den: { chu: 'Tài khoản › Đã xoá', duong: DA_XOA } }],
      muc: [{ id: 'pc-lam-thay', viec: 'case-lam-thay', ten: 'Xác nhận PA, ghi kết quả thay GV', buoc: ['Trong Case: ghi nội dung <b>Xác nhận PA</b> hoặc <b>Ghi kết quả PA</b>.', 'Bấm nút lưu ở chân.'] }],
    },
    {
      id: 'p-nhap-diem', ten: 'Nhập điểm đang mở', duong: [], panel: 'nhap-diem',
      dangO: { cau: 'Gõ điểm từng em cho một lượt Test.' },
      khongLam: [DEN_KH],
      muc: [{ id: 'pn-go', viec: 'nhap-ho', ten: 'Nhập hộ bài quá hạn', buoc: ['Gõ điểm em còn trống; Enter sang ô kế.', 'Em vắng: gõ <b>-</b>.', 'Xong: <b>Lớp tiếp</b> / <b>Việc tiếp</b>.'] }],
    },
  ],
  luat: [
    ...luatGv('han-cham', 'han-xac-nhan', 'han-ket-qua', 'han-vi-pham', 'dau-gach', 'sos-case', 'nhan-xet'),
    { id: 'ql-han-duyet', ten: 'Hạn trả lời thẻ', buoc: ['<b>5 ngày</b> tính cả ngày gửi.', '<b>Dời lịch Test</b> (thẻ cũ, trước 05/11 — "-" nay không tạo thẻ): hết Chủ nhật tuần gửi; quá hạn thì kỹ năng bị huỷ.', '<b>Báo QL</b>: không hạn, tự đóng khi việc gốc xong.'] },
    { id: 'ql-tu-choi', ten: 'Từ chối', buoc: ['Lý do bắt buộc; người gửi đọc được.', 'Từ chối đề xuất PA: việc cũ của GV quay lại kèm lý do.', 'Từ chối Ý thức: vi phạm về <b>Cần xử lý</b>, bậc giữ nguyên.'] },
    { id: 'ql-de-xuat-pa', ten: 'Đề xuất PA khác', buoc: ['GV gửi khi Xác nhận PA hoặc khi PA đang chạy; Case "Chờ duyệt đổi PA".', 'Duyệt: PA mới chạy từ ngày duyệt.', '<b>Xin ý kiến</b>: chỉ trả lời, PA vẫn chạy; câu trả lời ghi vào lịch sử em.'] },
    { id: 'ql-tu-duyet', ten: 'QL tự gửi', buoc: ['Thẻ bạn tự gửi: "Bạn tự gửi · tự duyệt được".', 'Có nhật ký, báo Quản trị.'] },
    { id: 'ql-ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['Chỉ PA quy chế đang chạy; GVCN hoặc QL.', 'Lý do bắt buộc, từ <b>10</b> ký tự; nhật ký PA ghi lại.'] },
    { id: 'ql-chuyen-lop', ten: 'Chuyển lớp + bàn giao', buoc: ['<b>Ngay hôm nay</b>: chuyển ngay, không hoàn tác.', 'Hạn bàn giao = muộn hơn của (ngày quyết định + <b>7 ngày</b>) và mốc cũ.', 'Bàn giao quá hạn không chặn chuyển lớp; QL nhận thẻ Báo QL.'] },
    { id: 'ql-sua-diem', ten: 'Sửa điểm sau hoàn tất', buoc: ['GV vẫn nhập ô trống; sửa hoặc xoá một điểm đã có: chỉ QL.', 'Gỡ "-" lúc nào cũng được.'] },
    { id: 'ql-target', ten: 'Đổi Target', buoc: ['QL, TVV, CX sửa thẳng, ghi <b>Lý do đổi Target</b>.', 'GVCN sửa → thành Đề xuất sửa, QL duyệt rồi mới đổi.', 'Target mới tính từ hôm nay; kỳ vọng các lượt đã làm bài giữ nguyên.'] },
    { id: 'ql-buoc-tiep', ten: 'Bước tiếp sau thi', buoc: ['Đã thi (từ hôm sau ngày thi) → <b>Cập nhật kết quả thi thật</b>; có kết quả → <b>Chọn bước tiếp</b>. Cùng hạn: ngày thi + <b>7 ngày</b>, <b>Gia hạn</b> được.', 'QL hoặc TVV chọn; GVCN, CX chỉ xem ("Chờ QL / TVV chọn bước tiếp").', 'Lộ trình mới bắt đầu ngay: tuần này là tuần 1; lớp khác thì GV lớp cũ làm phiếu bàn giao.', 'Tạm dừng: đóng lộ trình, mọi hạn dừng; sau này <b>Quay lại học</b> mở Lộ trình mới.'] },
    { id: 'ql-y-thuc-bao', ten: 'Ý thức: QL nhận gì', buoc: ['Cần QL duyệt: WL 3, Meeting CX/GĐCN, Đình chỉ học tạm thời, Khác.', 'Để biết: GVCN xử lý WL 1, Report 4 + Meeting, WL 2.'] },
  ],
  tu: [
    ...HD_GV.tu.filter((x) => x.ten !== 'QL (Quản lý)'),
    { ten: 'Chờ duyệt', nghia: 'Hộp thẻ cần QL quyết: Đề xuất PA, đề xuất sửa, chuyển lớp, dời lịch Test lần 2, Ý thức cần duyệt.' },
    { ten: 'Báo QL', nghia: 'Thẻ để biết (Case / Ý thức / bàn giao quá hạn…): không có nút Duyệt, tự đóng khi việc gốc xong.' },
    { ten: 'Xin ý kiến', nghia: 'GV hỏi QL về PA đang chạy (nút Xin hỗ trợ QL); QL trả lời, PA không đổi.' },
    { ten: 'Đề xuất PA khác', nghia: 'GV muốn PA khác PA quy chế; QL duyệt thì PA mới chạy từ ngày duyệt.' },
    { ten: 'Chốt lộ trình', nghia: 'Việc QL trước Final Test lớp thường: chọn hướng tiếp cho từng em.' },
    { ten: 'Bàn giao', nghia: 'Phiếu lớp cũ ghi về em khi em chuyển lớp: nhận xét chung GVCN + một dòng mỗi môn.' },
    { ten: 'Lưu trữ', nghia: 'Em đã học xong, cất khỏi danh sách đang học; Bỏ lưu trữ được.' },
  ],
};
