/**
 * Hướng dẫn TƯ VẤN VIÊN — HD-V2 (c). Đặc tả `docs/superpowers/specs/2026-11-05-huong-dan-v2/de-xuat.md` mục 3, 4, 9, 10; mockup `thiet-ke/v14/huong-dan.html`
 * (trạng thái D: Tuần của tôi). Đối chiếu mã main 05/11: TVV không có Test; Công việc CHỈ việc của mình (nhóm Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ);
 * Case, điểm chỉ xem; ở Hồ sơ HV các việc là NÚT trên đầu hồ sơ (không phải ⋯ — `vaiXemHocVien`): Sửa thông tin · Tạm dừng/ Kết thúc học · Kết quả thi thật · Lịch sử.
 * `lam` là MỘT nguồn (xem `ql.ts`). CX dùng lại phần lớn tệp này (`cx.ts`), Head tutor lấy Hồ sơ cá nhân (`headTutor.ts`).
 */
import { HD_GV } from './gv.ts';
import type { HuongDan, ManHd, MucHd, TuHd, ViecHd, ViecVaiKhac } from './kieu.ts';

const CV = '/cong-viec';
const HV = '/hoc-vien';

export const mucGv = (man: string, id: string): MucHd => HD_GV.man.find((m) => m.id === man)!.muc.find((m) => m.id === id)!;
const KHONG_GV = { ten: 'Nhập điểm, ghi Case, PA', cua: 'việc của GV' } as const;
const KHONG_QL = { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của QL' } as const;

/** Việc dùng chung TVV / CX (CX lấy lại, đổi chỗ khác nhau) — mỗi việc một lối chính. */
export const VIEC_TVV: ViecHd[] = [
  /* ---------------------------------------------------------------- Học viên và lớp */
  {
    id: 'xem-viec', ten: 'Xem việc của bạn', nhom: 'khac',
    loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV, chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' } },
    buoc: ['Mở <b>Công việc</b>: <b>Báo PH</b> · <b>Sau thi</b> · <b>Chốt ngày thi</b> · <b>Bổ sung hồ sơ</b>.', 'Bấm dòng em: panel mở bên phải, xong không rời trang.', 'Quá hạn có ⚠, nằm đầu nhóm.'],
    tuKhac: ['việc', 'todo', 'tasks'],
  },
  {
    id: 'xem-thi-thang', ten: 'Xem em thi tháng này', nhom: 'hv',
    loiChinh: { man: 'tong-quan', chu: 'Tổng quan › Thi tháng này', duong: '/', chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
    loiTat: ['hoc-vien'], cung: 'mở cùng danh sách.',
    buoc: ['Mở <b>Tổng quan</b>: <b>Báo PH đúng hạn</b> · <b>Thi tháng này</b> · <b>Chờ KQ · Lộ trình tiếp</b>.', 'Bấm số: danh sách em mở ngay tại trang.'],
    tuKhac: ['sắp thi', 'ngày thi', 'exam month', 'thi'],
  },
  {
    id: 'bao-ph', ten: 'Báo PH vi phạm', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Báo PH', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Bấm dòng em ở nhóm <b>Báo PH</b> để báo.' } },
    buoc: ['Mở <b>Công việc</b>, nhóm <b>Báo PH</b>, bấm dòng em (hạn 5 ngày).', 'Gọi PH theo số trong panel; chọn <b>Đã báo PH</b> hoặc <b>Chưa liên hệ được</b>, ghi chú.',
      '<b>Lưu · việc tiếp ›</b>; chưa liên hệ được thì việc vẫn mở, giữ hạn.'],
    tuKhac: ['báo phụ huynh', 'phụ huynh', 'gọi', 'vi phạm', 'parent', 'call'],
  },
  {
    id: 'bo-sung', ten: 'Bổ sung hồ sơ thiếu', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Bổ sung hồ sơ', duong: CV },
    loiTat: ['hoc-vien'], cung: 'mở cùng chỗ.',
    buoc: ['Mở <b>Công việc</b>, nhóm <b>Bổ sung hồ sơ</b>, bấm dòng em.', 'Điền phần còn thiếu, lưu; đủ là việc hết.', 'Xem cả nhóm: <b>Học viên & Lớp</b>, lọc <b>Thiếu thông tin</b>.'],
    tuKhac: ['thiếu', 'hồ sơ', 'missing', 'profile'],
  },
  {
    id: 'sua-hv', ten: 'Sửa thông tin, đổi Target', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Sửa thông tin' },
    loiTat: ['hoc-vien', 'ho-so-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em, bấm <b>Sửa thông tin</b> (liên hệ, Dự kiến thi, Target).', 'Đổi Target: ghi <b>Lý do đổi Target</b>.', 'Cả lớp: hồ sơ lớp, tab <b>Học viên</b> › <b>Sửa thông tin</b>.'],
    tuKhac: ['target', 'liên hệ', 'họ tên', 'dự kiến thi', 'edit student'],
  },
  {
    id: 'tam-dung', ten: 'Tạm dừng/ Kết thúc học', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Tạm dừng/ Kết thúc học' },
    loiTat: ['hoc-vien'], tatThem: ['⋯ dòng em'], cung: 'mở cùng hộp.',
    buoc: ['Ở hồ sơ em, bấm <b>Tạm dừng/ Kết thúc học</b>.', 'Ô <b>Có thể quay lại học</b> bật là Tạm dừng, tắt là Kết thúc học; ghi <b>Lý do</b>, <b>Từ ngày</b>.',
      'Em đang Tạm dừng, về học: bấm <b>Quay lại học</b> ở đầu hồ sơ.'],
    tuKhac: ['nghỉ học', 'thôi học', 'dừng', 'pause', 'stop', 'quit'],
  },
  {
    id: 'xem-case', ten: 'Xem Case của em, gọi PH', nhom: 'case',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Case & phương án' },
    loiTat: ['hoc-vien'], cung: 'mở cùng Case.',
    buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>, bấm ô kỹ năng.', 'Khối <b>Case & phương án</b>: bấm Case để xem — chỉ xem, GV và QL ghi.', 'Cần gọi PH: số điện thoại nằm trong Case.'],
    tuKhac: ['Case', 'phương án', 'sos', 'phụ huynh', 'gọi'],
  },
  {
    id: 'lich-su', ten: 'Xem Lịch sử', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Lịch sử' },
    buoc: ['Ở hồ sơ em, bấm <b>Lịch sử</b>: ai sửa gì, lúc nào.', 'Lọc <b>Thông tin · Target / lộ trình · Trạng thái</b>.'],
    tuKhac: ['nhật ký', 'ai sửa', 'history', 'audit', 'log'],
  },
  {
    id: 'loc-hv', ten: 'Lọc nhóm em cần theo dõi', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › lọc', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
    buoc: ['<b>Tất cả</b> · <b>Đang SOS</b> · <b>Lịch thi</b>; lọc <b>Cần chú ý</b>, <b>Tạm dừng</b>, <b>Sắp thi</b>, <b>Có việc quá hạn</b>, <b>Thiếu thông tin</b>, <b>Chờ chọn bước tiếp</b>.',
      '<b>Phạm vi</b>: <b>HV của tôi</b> (mặc định) · <b>Chi nhánh</b>.', 'Bấm dòng em mở panel một em; <b>⋯</b> cuối dòng: <b>Sửa thông tin</b> · <b>Tạm dừng/ Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Mở hồ sơ</b>.'],
    tuKhac: ['cần chú ý', 'sos', 'quá hạn', 'hv của tôi', 'filter'],
  },
  {
    id: 'them-hv', ten: 'Thêm lớp, thêm học viên', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › + Lớp mới · + Học viên', duong: HV },
    buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Lớp mới</b> · <b>+ Học viên</b> (một em hoặc dán danh sách).', 'Lớp chi nhánh mình; phân công giáo viên do QL làm.'],
    tuKhac: ['lớp mới', 'dán excel', 'import', 'new student', 'new class'],
  },
  {
    id: 'tim-kiem', ten: 'Tìm em, lớp', nhom: 'khac',
    loiChinh: { chu: 'Ô tìm trên thanh trên', chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
    buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp</b>; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.'],
    tuKhac: ['tìm', 'search', 'find', 'ft101'],
  },
  {
    id: 'phan-tich', ten: 'Xem thống kê theo kỳ', nhom: 'khac',
    loiChinh: { man: 'phan-tich', chu: 'Tổng quan › Phân tích', duong: '/phan-tich', chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
    buoc: ['Mở <b>Phân tích</b>; chọn <b>Từ tuần → Đến tuần</b> cho mọi tab (mặc định 2 tuần vừa qua).', 'Tab <b>Báo cáo HV</b> · <b>Test + SOS</b> · <b>Kết quả Test / Thi</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>; bấm số mở danh sách tại trang.'],
    tuKhac: ['thống kê', 'báo cáo', 'analytics', 'report'],
  },
];

/** Việc chỉ của TVV: nằm ở Công việc (CX không có Công việc). */
const VIEC_CONG_VIEC: ViecHd[] = [
  {
    id: 'chot-ngay-thi', ten: 'Chốt ngày thi', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Chốt ngày thi', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Bấm dòng em ở nhóm <b>Chốt ngày thi</b>.' } },
    buoc: ['Mở <b>Công việc</b>, nhóm <b>Chốt ngày thi</b>, bấm dòng em.', 'Ô <b>Chốt</b>: <b>Ngày thi</b> (chọn ngày) hoặc <b>Dời tháng dự kiến</b> (chọn tháng).', 'Lưu ở chân panel; việc tự hết.'],
    tuKhac: ['ngày thi', 'lịch thi', 'dời tháng', 'exam date'],
  },
  {
    id: 'thi-that', ten: 'Cập nhật kết quả thi thật', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Sau thi', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Dòng <b>Cập nhật kết quả thi thật</b> ở nhóm <b>Sau thi</b>.' } },
    loiTat: ['ho-so-hv', 'hoc-vien'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Mở <b>Công việc</b>, nhóm <b>Sau thi</b>, bấm dòng <b>Cập nhật kết quả thi thật</b>.', 'Gõ điểm L R W S, bấm <b>Lưu điểm</b>; em không thi: <b>Không thi</b>.', 'Điểm lưu riêng, chưa cần chọn bước tiếp.'],
    tuKhac: ['ielts', 'điểm thi', 'kết quả thi', 'exam result'],
  },
  {
    id: 'buoc-tiep', ten: 'Chọn bước tiếp sau thi', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Sau thi', duong: CV },
    loiTat: ['ho-so-hv'], cung: 'mở cùng chỗ.',
    buoc: ['Lưu điểm xong, panel <b>Bước tiếp</b> mở ngay (hạn: ngày thi + <b>7 ngày</b>, <b>Gia hạn</b> được).', 'Chọn <b>Lộ trình mới</b> hoặc <b>Tạm dừng/ Kết thúc học</b>, ghi chú, lưu.',
      'Làm sau: dòng <b>Chọn bước tiếp</b> ở Công việc, hoặc <b>Chọn bước tiếp ›</b> ở hồ sơ em.'],
    tuKhac: ['lộ trình mới', 'thi thật', 'next step', 'sau thi'],
  },
];

/** Việc của vai khác — chỉ hiện trong kết quả tìm. */
export const VAI_KHAC_TVV: ViecVaiKhac[] = [
  { ten: 'Nhập điểm, chấm Test', cua: 'việc của GV', tuKhac: ['chấm', 'điểm', 'score', 'grade'] },
  { ten: 'Xác nhận Case, PA', cua: 'việc của GV', tuKhac: ['case', 'phương án', 'sos'] },
  { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của QL', tuKhac: ['đổi lớp', 'chuyển lớp', 'duyệt', 'change class', 'approve'] },
  { ten: 'Xếp, dời lịch Test', cua: 'việc của QL', tuKhac: ['dời lịch', 'lịch mt', 'reschedule'] },
  { ten: 'Xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
];

const THI_THAT_CX: MucHd = { id: 'cx-hv-thi-that', viec: 'thi-that', ten: 'Ghi kết quả thi thật', buoc: ['Bấm <b>Kết quả thi thật</b> trên đầu hồ sơ.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>.', '<b>Bước tiếp</b> do QL hoặc TVV chọn; hồ sơ ghi "Chờ QL / TVV chọn bước tiếp".'] };
const THI_THAT_TVV: MucHd = { id: 'tvv-hv-thi-that', viec: 'thi-that', ten: 'Cập nhật kết quả thi thật', buoc: ['Bấm <b>Kết quả thi thật</b> trên đầu hồ sơ.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>.', 'Lưu xong, mở bước tiếp ở Công việc › Sau thi.'] };

/** Màn chung TVV / CX: Hồ sơ lớp, Hồ sơ HV (CX: Kết quả thi thật là lối chính), Hồ sơ cá nhân, Hướng dẫn. */
export const manHoSoHv = (cx = false): ManHd => ({
  id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: [`${HV}/`],
  dangO: { cau: cx ? 'Một em: điểm, Case, ý thức, lộ trình; sửa thông tin, Tạm dừng, ghi kết quả thi thật.' : 'Một em: điểm, Case, ý thức, lộ trình; sửa thông tin, Tạm dừng, kết quả thi thật.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
  khongLam: [KHONG_GV, KHONG_QL],
  muc: [
    { id: 'tvv-hv-nut', ten: 'Nút trên đầu hồ sơ', buoc: ['<b>Sửa thông tin</b> · <b>Tạm dừng/ Kết thúc học</b> · <b>Kết quả thi thật</b> (FT) · <b>Lịch sử</b>.', 'Em đang Tạm dừng: <b>Quay lại học</b> ở đầu hồ sơ.'] },
    cx ? THI_THAT_CX : THI_THAT_TVV,
    { id: 'tvv-hv-tab', ten: 'Ba tab', buoc: ['<b>Học thuật</b>: điểm, Case, PA — chỉ xem.', '<b>Ý thức & Phối hợp</b>: vi phạm và Phối hợp SOS GVCN làm với em, gia đình.', '<b>Lộ trình & lớp</b>: lưới tuần theo lớp, mọi lượt Test.'] },
  ],
});

export const MAN_HO_SO_TVV: ManHd[] = [
  {
    id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: [`${HV}/lop`],
    dangO: { cau: 'Một lớp: em, điểm các lượt (chỉ xem); sửa thông tin cả lớp.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
    khongLam: [KHONG_GV, KHONG_QL],
    muc: [
      { id: 'tvv-lop-sua', viec: 'sua-hv', ten: 'Sửa thông tin cả lớp', buoc: ['Tab <b>Học viên</b> › <b>Sửa thông tin</b>: bảng cả lớp, sửa nhiều em một lần.', 'Cột Target: đổi nhiều em, một <b>Lý do đổi Target</b> chung.'] },
      { id: 'tvv-lop-xem', ten: 'Cách xem', buoc: ['<b>Thông tin lớp</b>: liên hệ, Target, dự kiến thi của cả lớp.', '<b>Tổng hợp</b> · <b>Cần hỗ trợ</b> · <b>Kết quả đầu ra</b>: chỉ xem.'] },
    ],
  },
  manHoSoHv(),
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
];

export const LUAT_TVV: MucHd[] = [
  { id: 'tvv-luat-target', ten: 'Đổi Target', buoc: ['TVV, CX, QL sửa thẳng; <b>Lý do đổi Target</b> bắt buộc.', 'Target mới tính từ hôm nay; kỳ vọng các lượt đã làm bài giữ nguyên.'] },
  { id: 'tvv-luat-tam-dung', ten: 'Tạm dừng', buoc: ['Em Tạm dừng: mọi hạn của em dừng, việc ẩn, không quá hạn.', 'Bấm nhầm: <b>Hoàn tác</b> ngay trên thông báo.'] },
  { id: 'tvv-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['Nhập được cả khi em đã Lưu trữ.', 'Có kết quả → việc <b>Chọn bước tiếp</b>; QL hoặc TVV chọn. Hạn: ngày thi + <b>7 ngày</b>, <b>Gia hạn</b> được.'] },
  { id: 'tvv-luat-phoi-hop', ten: 'Phối hợp SOS', buoc: ['SOS 1: <b>Trao đổi ngắn với HV</b> + <b>Trao đổi với gia đình</b>.', 'SOS 2–3: <b>Trao đổi với gia đình</b>, từ MT2 thêm <b>GVCN meeting với HV</b> (MT1: chỉ SOS 3) — không còn Trao đổi ngắn với HV (GVCN tự thêm được).', 'SOS 3 từ MT2 thêm <b>Meeting CX/GĐCN (sau Mock)</b> (MT3 có phụ huynh); GVCN xác nhận, hạn 5 ngày.'] },
  { id: 'tvv-luat-hoc-thuat', ten: 'Học thuật', buoc: ['Điểm, Case, PA, Ý thức: GV và QL ghi; TVV xem.'] },
];

export const TU_TVV: TuHd[] = [
  ...HD_GV.tu,   // UX-1: đủ như GV (TVV / CX đọc cùng hồ sơ, Case, PA)
  { ten: 'HV của tôi', nghia: 'Em có TVV là bạn (ô TVV trong Sửa thông tin).' },
  { ten: 'Cần chú ý', nghia: 'Em đang SOS, có Case mới hoặc vi phạm Ý thức.' },
  { ten: 'Sắp thi', nghia: 'Em thi IELTS trong 6 tuần tới.' },
  { ten: 'Thiếu thông tin', nghia: 'Hồ sơ chưa đủ để theo dõi; điền đủ là hết.' },
  { ten: 'Bước tiếp', nghia: 'Hướng sau thi thật: Lộ trình mới · Tạm dừng · Thôi học.' },
  { ten: 'Phối hợp SOS', nghia: 'Việc GVCN làm với em, gia đình khi em SOS (trao đổi, meeting).' },
];

const THU_TU = ['xem-viec', 'xem-thi-thang', 'bao-ph', 'chot-ngay-thi', 'bo-sung', 'thi-that', 'buoc-tiep', 'sua-hv', 'tam-dung', 'xem-case', 'lich-su', 'loc-hv', 'them-hv', 'tim-kiem', 'phan-tich'];

export const HD_TVV: HuongDan = {
  viec: [],
  lam: THU_TU.map((id) => [...VIEC_TVV, ...VIEC_CONG_VIEC].find((v) => v.id === id)!),
  tuan: [
    { nhip: 'Mỗi sáng', viec: ['xem-viec', 'xem-thi-thang', 'loc-hv'] },
    { nhip: 'Khi có', viec: ['bao-ph', 'bo-sung', 'sua-hv', 'xem-case', 'them-hv', 'lich-su', 'tim-kiem'] },
    { nhip: 'Khi gia đình báo', viec: ['tam-dung'] },
    { nhip: 'Trước khi em thi', viec: ['chot-ngay-thi'] },
    { nhip: 'Sau khi em thi', viec: ['thi-that', 'buoc-tiep'] },
    { nhip: 'Mỗi kỳ', viec: ['phan-tich'] },
  ],
  vaiKhac: VAI_KHAC_TVV,
  man: [
    {
      /* UI-CV-TVV (C05): TVV có Công việc — chỉ việc của mình. */
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Mọi việc của bạn: Báo PH, sau thi, chốt ngày thi, bổ sung hồ sơ.', truoc: { chu: 'Tổng quan', duong: '/' }, sau: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [KHONG_GV, KHONG_QL],
      muc: [{ id: 'tvv-cv-nhom', ten: 'Cách làm một việc', buoc: ['Bấm dòng em: panel mở bên phải, làm xong không rời trang.', 'Nút ⓘ cạnh tên nhóm nói hạn của nhóm đó.'] }],
    },
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      dangO: { cau: 'Ba số của HV bạn phụ trách và thi thật.', sau: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_GV, KHONG_QL],
      muc: [{ id: 'tvv-tq-o', ten: 'Ba số của TVV', buoc: ['Chỉ HV của bạn: <b>Báo PH đúng hạn</b> · <b>Thi tháng này</b> · <b>Chờ KQ · Lộ trình tiếp</b>.', '<b>Điều hướng</b>: n việc của tôi (Công việc) · HV của tôi (Học viên & Lớp đúng nhóm em).'],
        chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } }],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      dangO: { cau: 'Thống kê theo kỳ: học viên, Test, PA, Ý thức.', truoc: { chu: 'Tổng quan', duong: '/' } },
      khongLam: [KHONG_GV],
      muc: [{ id: 'tvv-pt', ten: 'Tab phân tích', buoc: ['<b>Báo cáo HV</b> · <b>Test + SOS</b> · <b>Kết quả Test / Thi</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b>.', 'Bấm số mở danh sách ngay tại trang.'],
        chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp; thêm lớp, học viên; xem nhanh một em không rời trang.', truoc: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_GV, KHONG_QL],
      muc: [mucGv('hoc-vien', 'hv-tim')],
    },
    ...MAN_HO_SO_TVV,
  ],
  luat: LUAT_TVV,
  tu: TU_TVV,
};
