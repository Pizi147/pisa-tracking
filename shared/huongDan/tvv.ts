/**
 * Hướng dẫn TƯ VẤN VIÊN — HD-V2 (c), HD-V3-C (13/11). Đặc tả `docs/superpowers/specs/2026-11-05-huong-dan-v2/de-xuat.md`; mockup `thiet-ke/v14/huong-dan.html`.
 * Đối chiếu từng việc / màn / panel với mã main ở `docs/superpowers/specs/2026-11-13-huong-dan-v3/doi-chieu-tvv-cx.md` (SAI / CŨ / THIẾU → sửa ở đây).
 * Sự thật mã (kiểm 13/11): TVV có Công việc CHỈ việc của mình — một tab, bốn nhóm (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ); không Test;
 * Case, điểm, Ý thức, Phối hợp SOS chỉ xem (ngoại lệ: ghi kết quả Báo PH); sửa thông tin / Target / Tạm dừng / thi thật / Lộ trình đang học / Môn học;
 * ở Hồ sơ HV các việc là NÚT trên đầu hồ sơ (không phải ⋯ — `vaiXemHocVien`). `lam` là MỘT nguồn (xem `ql.ts`). CX dùng lại phần lớn tệp này
 * (`cx.ts`, CX KHÔNG đổi Lộ trình / Môn học, không Báo cáo PH), Head tutor lấy Hồ sơ cá nhân (`headTutor.ts`).
 */
import { HD_GV } from './gv.ts';
import type { HuongDan, ManHd, MucHd, TinhHuongHd, TuHd, ViecHd, ViecVaiKhac } from './kieu.ts';

const CV = '/cong-viec';
const HV = '/hoc-vien';

export const mucGv = (man: string, id: string): MucHd => HD_GV.man.find((m) => m.id === man)!.muc.find((m) => m.id === id)!;
const KHONG_GV = { ten: 'Nhập điểm, ghi Case, PA', cua: 'việc của GV' } as const;
const KHONG_QL = { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của Head' } as const;
const KHONG_VI_PHAM = { ten: 'Ghi vi phạm, xác nhận xử lý', cua: 'việc của GVCN' } as const;

/** Việc dùng chung TVV / CX (CX lấy lại, đổi chỗ khác nhau) — mỗi việc một lối chính. */
export const VIEC_TVV: ViecHd[] = [
  /* ---------------------------------------------------------------- Học viên và lớp */
  {
    id: 'xem-viec', ten: 'Xem việc của bạn', nhom: 'khac',
    loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV, chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' } },
    buoc: ['Mở <b>Công việc</b>: <b>Báo PH</b> · <b>Sau thi</b> · <b>Chốt ngày thi</b> · <b>Bổ sung hồ sơ</b>; nhóm trống ẩn.',
      'Bấm dòng em: panel mở bên phải, xong không rời trang. Lọc: <b>Mọi hạn</b> · <b>Quá hạn</b> · <b>Hôm nay</b>.',
      'Chuông cạnh <b>?</b>: số = việc quá hạn + hôm nay; khối <b>Việc cần làm</b> mở thẳng đúng loại việc.'],
    tuKhac: ['việc', 'todo', 'tasks', 'chuông', 'thông báo', 'bell'],
  },
  {
    id: 'xem-thi-thang', ten: 'Xem em thi tháng này', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc', duong: CV },
    loiTat: ['hoc-vien'], cung: 'mở cùng danh sách.',
    buoc: ['Dải số đầu <b>Công việc</b>: <b>Việc</b> · <b>Báo PH đúng hạn</b> · <b>Thi tháng này ›</b> · <b>Chờ KQ ›</b> · <b>Chưa chốt lộ trình tiếp ›</b>.',
      'Bấm số: <b>Báo PH đúng hạn</b> mở panel tại trang; ba số HV mở <b>Học viên & Lớp</b> đúng nhóm em. Khung <b>HV của tôi</b> bên phải ghi tình trạng từng em.'],
    tuKhac: ['sắp thi', 'ngày thi', 'exam month', 'thi', 'chờ kết quả'],
  },
  {
    /* HD3-3: một thẻ cho dòng "Báo PH" (vi phạm · báo lại sau thu hồi · tình hình học tập — cùng panel, nút, hạn). Sửa câu cũ "có việc ngay kể cả khi Chờ QL
       duyệt": chỉ Nâng 1 bậc có việc ngay, cách khác khi QL duyệt / máy chốt (`xuLy.ts:206, 1086`). */
    id: 'bao-ph', ten: 'Báo PH', nhom: 'hv', tab: 'bao-ph', viecWeb: ['bao_ph_yt'],
    tep: ['web/src/modules/congViec/PanelBaoPhTvv.tsx', 'web/src/ui/DongHan.tsx', 'server/src/worklist/mywork.ts', 'server/src/yThuc/baoPhTvv.ts'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Báo PH', duong: CV, chi: { hd: ['p-bao-ph-kq', 'cv-dong'], duong: CV, chu: 'Chọn <b>Kết quả</b> trong panel Báo PH (mở bằng dòng ở nhóm <b>Báo PH</b>).' } },
    loiTat: ['p-bao-ph'], cung: 'mở cùng panel.',
    khiCo: 'GVCN xử lý vi phạm, thu hồi cần báo lại, hoặc GV báo tình hình.',
    buoc: ['Gọi số phụ huynh trong panel.', 'Chọn <b>Đã báo PH</b> hoặc <b>Chưa liên hệ được</b>, gõ <b>Nội dung</b>.', 'Bấm <b>Lưu · việc tiếp ›</b>.'],
    xong: 'Đã lưu Đã báo PH.',
    han: '{han:bao_ph_vi_pham} tính cả ngày có việc; đổi ở <b>Sửa hạn</b>.',
    sai: 'Vừa lưu: <b>Sửa</b>; bỏ nhầm: <b>Khôi phục</b>.',
    khongDuoc: ['Chưa gọi được: <b>Chưa liên hệ được</b>, việc mở.', 'Em chưa có TVV: Head chi nhánh; TVV cùng chi nhánh ghi được.'],
    sau: 'GVCN hoặc người báo tình hình nhận tin.',
    tuKhac: ['báo phụ huynh', 'phụ huynh', 'gọi', 'vi phạm', 'ý thức', 'tình hình', 'parent', 'call', 'thu hồi'],
  },
  {
    id: 'bao-ph-meeting', ten: 'Báo PH · Meeting CX/GĐCN', nhom: 'hv', tab: 'bao-ph', viecWeb: ['phoi_hop_tvv'],
    tep: ['web/src/modules/yThuc/BangPhoiHop.tsx', 'server/src/worklist/mywork.ts', 'server/src/yThuc/baoPhTvv.ts'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Báo PH', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Dòng <b>Báo PH · Meeting CX/GĐCN</b> ở nhóm <b>Báo PH</b>.' } },
    loiTat: ['p-phoi-hop'], cung: 'mở cùng bảng.',
    khiCo: 'GVCN xác nhận Meeting CX/GĐCN của em sau lượt Mock có SOS.',
    buoc: ['Bấm <b>Ghi KQ</b> ở dòng.', 'Ở em chờ bạn: <b>Ghi kết quả</b>, chọn <b>Đã báo PH</b> hoặc <b>Chưa liên hệ được</b>, gõ <b>Nội dung</b>.', 'Bấm <b>Lưu</b>.'],
    xong: 'Đã lưu Đã báo PH kèm Nội dung.',
    han: 'Theo cấu hình Case & SOS, tính từ ngày GVCN xác nhận.',
    sai: 'Bấm <b>Sửa</b> ở ô kết quả.',
    khongDuoc: ['Em chưa có TVV: GVCN lớp em báo, lớp chưa có GVCN thì Head.'],
    sau: 'Kết quả hiện ở Phối hợp SOS, GV đọc được Nội dung.',
    tuKhac: ['meeting', 'gđcn', 'cx', 'họp', 'sos 3', 'phối hợp sos', 'báo phụ huynh'],
  },
  {
    id: 'han-bao-ph', ten: 'Sửa hạn, bỏ việc Báo PH', nhom: 'hv',
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Báo PH', duong: CV },
    loiTat: ['p-bao-ph'], cung: 'mở cùng panel.',
    buoc: ['Trong panel Báo PH vi phạm, bấm <b>Sửa hạn</b> › chọn <b>Hạn mới</b> › <b>Lưu hạn</b>; <b>Về mặc định</b> được, không trần, không xin duyệt.',
      'Không cần báo nữa: <b>Thao tác phụ</b> › <b>Bỏ việc…</b>, chọn lý do; <b>Hoàn tác</b> hoặc <b>Khôi phục</b> được.'],
    tuKhac: ['hạn', 'gia hạn', 'bỏ việc', 'deadline', 'extend'],
  },
  {
    id: 'bo-sung', ten: 'Bổ sung hồ sơ thiếu', nhom: 'hv', tab: 'bo-sung', viecWeb: ['bo_sung_ho_so'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Bổ sung hồ sơ', duong: CV },
    loiTat: ['hoc-vien', 'p-sua-thong-tin'], cung: 'mở cùng chỗ.',
    khiCo: 'Em của TVV thiếu Ngày sinh, Email, Tuần bắt đầu hoặc Target (FT).',
    buoc: ['Bấm <b>Bổ sung</b> ở dòng: mở lần lượt từng em.', 'Điền ô thiếu; đổi Target cần lý do.', 'Bấm <b>Lưu · em tiếp ›</b> hoặc <b>Bỏ qua ›</b>.'],
    xong: 'Mọi em đủ bốn thông tin.',
    sai: 'Bấm <b>Hoàn tác</b> sau khi lưu; về sau sửa lại, xem <b>Lịch sử</b>.',
    khongDuoc: ['Em chưa có TVV: Head chi nhánh làm.'],
    sau: 'Có Target thì máy tính được kỳ vọng MT của em.',
    tuKhac: ['thiếu', 'hồ sơ', 'missing', 'profile'],
  },
  {
    id: 'sua-hv', ten: 'Sửa thông tin, đổi Target', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Sửa thông tin' },
    loiTat: ['hoc-vien', 'ho-so-lop', 'luu-tru', 'p-sua-thong-tin', 'p-sua-ca-lop'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em, bấm <b>Sửa thông tin</b> (liên hệ, Dự kiến thi, Target, ghi chú).', 'Đổi Target: ghi <b>Lý do đổi Target</b>.',
      'Cả lớp: hồ sơ lớp › ⋯ <b>Thao tác khác</b> › <b>Sửa thông tin học viên</b>.'],
    tuKhac: ['target', 'liên hệ', 'họ tên', 'dự kiến thi', 'edit student', 'ghi chú'],
  },
  {
    id: 'tam-dung', ten: 'Tạm dừng / Kết thúc học', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Tạm dừng / Kết thúc học' },
    loiTat: ['hoc-vien', 'luu-tru'], tatThem: ['⋯ dòng em'], cung: 'mở cùng hộp.',
    buoc: ['Ở hồ sơ em, bấm <b>Tạm dừng / Kết thúc học</b>.', 'Ô <b>Có thể quay lại học</b> bật là Tạm dừng, tắt là Kết thúc học; ghi <b>Lý do</b>, <b>Từ ngày</b>.',
      'Em Tạm dừng về học: bấm <b>Quay lại học</b> (đầu hồ sơ, ⋯ dòng em hoặc trang Lưu trữ). Em Kết thúc học: Head mở lại.'],
    tuKhac: ['nghỉ học', 'thôi học', 'dừng', 'pause', 'stop', 'quit', 'quay lại học'],
  },
  {
    id: 'xem-case', ten: 'Xem Case của em, gọi PH', nhom: 'case',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Case & phương án' },
    loiTat: ['hoc-vien', 'p-case'], cung: 'mở cùng Case.',
    buoc: ['Mở hồ sơ em, tab <b>Học thuật</b>, bấm ô kỹ năng.', 'Khối <b>Case & phương án</b>: bấm Case để xem — chỉ xem, GV và Head ghi.',
      'Cần gọi PH: nút gọi trong panel <b>Báo PH</b>, hoặc ở panel một em (khối <b>Phụ huynh</b> › <b>Gọi</b>).'],
    tuKhac: ['Case', 'phương án', 'sos', 'phụ huynh', 'gọi'],
  },
  {
    id: 'lich-su', ten: 'Xem Lịch sử', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Lịch sử' },
    loiTat: ['ho-so-lop'], cung: 'mở cùng chỗ.',
    buoc: ['Ở hồ sơ em hoặc hồ sơ lớp, bấm <b>Lịch sử</b>: ai sửa gì, lúc nào, nguồn, lý do.', 'Lọc ở ô <b>Lọc lịch sử</b>; <b>Xem thêm</b> để đọc bản cũ hơn.'],
    tuKhac: ['nhật ký', 'ai sửa', 'history', 'audit', 'log'],
  },
  {
    id: 'loc-hv', ten: 'Lọc nhóm em cần theo dõi', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › lọc', duong: HV, chi: { hd: 'hvl-goc', duong: HV, chu: 'Góc nhìn và lọc phụ ở hàng này.' } },
    buoc: ['Ô <b>Xem</b>: <b>HV của tôi</b> (mặc định, khi bạn có em được gán) hoặc một chi nhánh; đoạn <b>Tất cả</b> · <b>Đang SOS</b> · <b>Lịch thi</b>.',
      'Chip: <b>Thi tháng này</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> · <b>Có việc quá hạn</b>; <b>Bộ lọc thêm</b> › <b>Theo vai</b>: <b>Thiếu thông tin</b> · <b>Chờ chọn bước tiếp</b>.',
      'Bấm <b>tên</b> em mở hồ sơ; <b>⋯</b> cuối dòng (<b>Thao tác khác</b>): <b>Hỏi tình hình học tập</b> (gửi GVCN, em điền sẵn) · <b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Quay lại học</b> · <b>Mở hồ sơ</b>.'],
    tuKhac: ['quá hạn', 'sos', 'hv của tôi', 'filter', 'chi nhánh'],
  },
  {
    id: 'them-hv', ten: 'Thêm lớp, thêm học viên', nhom: 'hv',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › + Thêm học viên', duong: HV },
    loiTat: ['p-them-hv'], cung: 'mở cùng panel.',
    buoc: ['Mở <b>Học viên & Lớp</b>: <b>+ Thêm học viên</b> (một em, hoặc <b>Dán vùng bảng từ Excel / Google Sheets</b> rồi <b>Đọc nội dung đã dán</b>).',
      'Lớp mới: <b>⋯</b> › <b>Thao tác trang</b> › <b>+ Lớp mới</b>. Ở một lớp: <b>⋯</b> › <b>+ Học viên</b> (lớp điền sẵn).', 'Dán Excel chỉ để thêm học viên. Phân công giáo viên do Head làm.'],
    tuKhac: ['lớp mới', 'dán excel', 'import', 'new student', 'new class', 'thêm em'],
  },
  {
    id: 'tim-kiem', ten: 'Tìm em, lớp', nhom: 'khac',
    loiChinh: { chu: 'Ô tìm trên thanh trên', chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
    buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.',
      'Không thấy em: <b>Tìm trong HV lưu trữ ›</b> mở trang Lưu trữ.'],
    tuKhac: ['tìm', 'search', 'find', 'ft101'],
  },
  {
    id: 'luu-tru', ten: 'Xem học viên, lớp đã lưu trữ', nhom: 'hv',
    loiChinh: { man: 'luu-tru', chu: 'Ô tìm › Tìm trong HV lưu trữ', duong: '/hoc-vien/luu-tru' },
    buoc: ['Ở ô tìm trên thanh trên, gõ tên em rồi bấm <b>Tìm trong HV lưu trữ ›</b>.', 'Tab <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b>; bấm tên em mở hồ sơ.',
      'Em Tạm dừng: <b>Quay lại học</b> (hoặc <b>Chọn nhiều học viên</b>). Em Kết thúc học: Head mở lại.'],
    tuKhac: ['lưu trữ', 'đã nghỉ', 'archive', 'lớp cũ'],
  },
  {
    id: 'xuat-ds', ten: 'Xuất Excel danh sách học viên', nhom: 'khac',
    loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp › Xuất Excel', duong: HV, chi: { hd: 'hvl-xuat', duong: HV, chu: 'Nút <b>Xuất Excel</b> ở đầu trang.' } },
    loiTat: ['p-xuat-ds'], cung: 'mở cùng ngăn.',
    buoc: ['Mở <b>Học viên & Lớp</b>, đặt bộ lọc, bấm <b>Xuất Excel</b>.', 'Khối <b>Mẫu</b>: <b>Danh sách</b> hoặc <b>Báo cáo PH</b> (chọn <b>Tháng</b>); bấm nút xuất.'],
    tuKhac: ['excel', 'xuất', 'export', 'báo cáo ph', 'danh sách'],
  },
  {
    id: 'phan-tich', ten: 'Xem thống kê theo kỳ', nhom: 'khac',
    loiChinh: { man: 'phan-tich', chu: 'Phân tích', duong: '/phan-tich', chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
    buoc: ['Mở <b>Phân tích</b>; tab <b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> (lớp thường: <b>Test</b>).',
      'Kỳ: <b>Toàn bộ</b> hoặc <b>Chọn khoảng tuần</b> (hai ô tuần); Chi nhánh mặc định một tháng, tab khác 2 tuần.',
      'Bấm số mở danh sách tại trang; <b>Xuất Excel</b> ở hàng lọc.'],
    tuKhac: ['thống kê', 'báo cáo', 'analytics', 'report', 'excel'],
  },
];

/** Việc chỉ của TVV: nằm ở Công việc (CX không có Công việc) hoặc quyền riêng của TVV. */
const VIEC_RIENG_TVV: ViecHd[] = [
  {
    id: 'chot-ngay-thi', ten: 'Chốt ngày thi', nhom: 'hv', tab: 'chot-ngay-thi', viecWeb: ['chot_ngay_thi'],
    tep: ['web/src/modules/congViec/PanelSauThi.tsx', 'server/src/worklist/viecTvv.ts'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Chốt ngày thi', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Bấm dòng ở nhóm <b>Chốt ngày thi</b>.' } },
    loiTat: ['p-chot-ngay-thi'], cung: 'mở cùng panel.',
    khiCo: 'Em FT đã tới tháng Dự kiến thi mà chưa có ngày thi.',
    buoc: ['Bấm <b>Chốt ngày</b> ở dòng.', 'Chọn <b>Ngày thi</b>, hoặc <b>Dời tháng dự kiến</b>.', 'Bấm <b>Chốt ngày</b>.'],
    xong: 'Có ngày thi, hoặc đã dời sang tháng mới.',
    sai: 'Sửa ngày ở Học viên & Lớp, góc Lịch thi.',
    khongDuoc: ['Em chưa có TVV: Head chi nhánh làm.'],
    sau: 'Hôm sau ngày thi → việc Cập nhật kết quả thi thật.',
    tuKhac: ['ngày thi', 'lịch thi', 'dời tháng', 'exam date'],
  },
  {
    id: 'thi-that', ten: 'Cập nhật kết quả thi thật', nhom: 'hv', tab: 'sau-thi', viecWeb: ['thi_that'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Sau thi', duong: CV, chi: { hd: 'cv-dong', duong: CV, chu: 'Dòng <b>Cập nhật kết quả thi thật</b> ở nhóm <b>Sau thi</b>.' } },
    loiTat: ['ho-so-hv', 'hoc-vien', 'p-sau-thi'], tatThem: ['⋯ dòng em'], cung: 'mở cùng chỗ.',
    khiCo: 'Hôm sau ngày thi của em FT, khi chưa đủ kết quả.',
    buoc: ['Bấm <b>Nhập KQ thi</b> ở dòng.', 'Gõ L R W S rồi <b>Lưu điểm</b>; em không thi: <b>Không thi</b>.'],
    xong: 'Đủ bốn kỹ năng, hoặc đã ghi Không thi.',
    sai: 'Bấm <b>Sửa điểm</b>; panel ở hồ sơ em có <b>Hoàn tác</b>.',
    khongDuoc: ['Em chưa có TVV: Head chi nhánh làm; TVV khác, GVCN, CX nhập được từ hồ sơ em.'],
    sau: 'Bước <b>Bước tiếp</b> mở ngay trong panel.',
    tuKhac: ['ielts', 'điểm thi', 'kết quả thi', 'exam result', 'ket', 'pet'],
  },
  {
    id: 'buoc-tiep', ten: 'Chọn bước tiếp', nhom: 'hv', tab: 'sau-thi', viecWeb: ['buoc_tiep'],
    loiChinh: { man: 'cong-viec', chu: 'Công việc › Sau thi', duong: CV },
    loiTat: ['ho-so-hv', 'p-sau-thi', 'p-lo-trinh'], cung: 'mở cùng chỗ.',
    khiCo: 'Em FT có kết quả thi thật mà chưa chọn bước tiếp.',
    buoc: ['Chọn <b>Tạm dừng / Kết thúc học</b> hoặc <b>Lộ trình mới</b>.', 'Tạm dừng: bật <b>Có thể quay lại học</b>; ghi chú.', 'Bấm nút lưu ở chân panel.'],
    xong: 'Đã chọn một bước tiếp.',
    han: '{han:buoc_tiep_sau_thi} từ ngày có kết quả; <b>Gia hạn</b> ở dòng.',
    sai: 'Vừa chốt: <b>Hoàn tác</b>; về sau: hồ sơ em, <b>Đổi</b>.',
    khongDuoc: ['Em chưa có TVV: Head; TVV khác cùng chi nhánh chọn được ở hồ sơ em.'],
    sau: 'Tạm dừng, kết thúc: em vào Lưu trữ.',
    tuKhac: ['lộ trình mới', 'thi thật', 'next step', 'sau thi', 'gia hạn'],
  },
  {
    id: 'doi-lo-trinh', ten: 'Đổi lộ trình, môn học đang học', nhom: 'hv',
    loiChinh: { man: 'ho-so-hv', chu: 'Hồ sơ HV › Sửa thông tin' },
    loiTat: ['hoc-vien', 'p-sua-thong-tin'], cung: 'mở cùng hộp.',
    buoc: ['Ở hồ sơ em, bấm <b>Sửa thông tin</b>, khối <b>Lộ trình đang học</b>: chọn LT1, LT2 hoặc RF; ô <b>Môn học</b> chỉ TVV, Head, GVCN đổi.',
      'Lượt MT đã có điểm giữ nguyên lịch; lượt chưa thi xếp lại theo lộ trình mới, không về tuần đã qua.',
      'Môn, Target, điểm đầu vào giữ nguyên; xem lại ở <b>Lịch sử</b>.'],
    tuKhac: ['lt1', 'lt2', 'rf', 'đổi lộ trình', 'môn', 'route'],
  },
  {
    id: 'bao-cao-ph-lop', ten: 'Xem, xuất báo cáo PH của lớp', nhom: 'hv',
    loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › Báo cáo PH' },
    buoc: ['Mở hồ sơ lớp có mẫu (FT, FOU, BE, ELE), tab <b>Báo cáo PH</b>; chọn đợt ở chip đầu tab.',
      'Bấm <b>Xuất Excel lớp</b> hoặc <b>Xuất PDF lớp</b>; từng em: cột <b>Xuất</b> › <b>Excel</b> / <b>PDF</b>.', 'Bạn chỉ xem và xuất; viết báo cáo là việc của giáo viên.'],
    tuKhac: ['báo cáo phụ huynh', 'pdf', 'excel', 'parent report', 'đợt'],
  },
];

/** Việc của vai khác — chỉ hiện trong kết quả tìm. */
export const VAI_KHAC_TVV: ViecVaiKhac[] = [
  { ten: 'Nhập điểm, chấm Test', cua: 'việc của GV', tuKhac: ['chấm', 'điểm', 'score', 'grade'] },
  { ten: 'Xác nhận Case, PA', cua: 'việc của GV', tuKhac: ['case', 'phương án', 'sos'] },
  { ten: 'Ghi vi phạm, xác nhận xử lý', cua: 'việc của GVCN', tuKhac: ['vi phạm', 'xử lý', 'ý thức', 'discipline'] },
  { ten: 'Phối hợp SOS (xác nhận meeting)', cua: 'việc của GVCN', tuKhac: ['phối hợp', 'meeting', 'sos 3'] },
  { ten: 'Chuyển lớp, duyệt yêu cầu', cua: 'việc của Head', tuKhac: ['đổi lớp', 'chuyển lớp', 'duyệt', 'change class', 'approve'] },
  { ten: 'Xếp, dời lịch Test', cua: 'việc của Head', tuKhac: ['dời lịch', 'lịch mt', 'reschedule'] },
  { ten: 'Xoá tài khoản', cua: 'việc của Quản trị', tuKhac: ['tài khoản', 'account'] },
];

/* ---------------------------------------------------------------- Màn dùng chung TVV / CX */

const THI_THAT_CX: MucHd = { id: 'cx-hv-thi-that', viec: 'thi-that', ten: 'Ghi kết quả thi thật', buoc: ['Bấm <b>Kết quả thi thật</b> trên đầu hồ sơ (lộ trình FT hoặc KET / PET).', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>.', 'Lưu đủ kết quả: panel chuyển sang <b>Bước tiếp</b> — Head hoặc TVV chọn; CX chỉ xem.'] };
const THI_THAT_TVV: MucHd = { id: 'tvv-hv-thi-that', viec: 'thi-that', ten: 'Cập nhật kết quả thi thật', buoc: ['Bấm <b>Kết quả thi thật</b> trên đầu hồ sơ (lộ trình FT hoặc KET / PET), hoặc <b>Cập nhật kết quả thi thật ›</b> ở thanh Việc cần làm.', 'Gõ <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), bấm <b>Lưu</b>.', 'Lưu đủ kết quả: panel chuyển sang <b>Bước tiếp</b> ngay.'] };

/** Phần CHỈ của TVV (CX không có): mảng literal được gõ theo kiểu đích — spread `cx ? [] : […]` làm chuỗi thành `string`. */
/* ponytail: hai hàm chỉ để TypeScript gõ literal theo `ManHd` / `MucHd` (spread `cx ? [] : […]` làm chuỗi thành `string`); gộp khi vai thứ ba dùng chung. */
const chiTvvMan = (cx: boolean, x: ManHd[]): ManHd[] => (cx ? [] : x);
const chiTvvMuc = (cx: boolean, x: MucHd[]): MucHd[] => (cx ? [] : x);

/** Màn chung TVV / CX: Hồ sơ HV (CX: Kết quả thi thật là lối chính, không Bước tiếp / Lộ trình), Hồ sơ lớp, Hồ sơ cá nhân, Hướng dẫn, Lưu trữ… */
export const manHoSoHv = (cx = false): ManHd => ({
  id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: [`${HV}/`],
  dangO: { cau: cx ? 'Một em: điểm, Case, ý thức, lộ trình; sửa thông tin, Tạm dừng, ghi kết quả thi thật.' : 'Một em: điểm, Case, ý thức, lộ trình; sửa thông tin, Tạm dừng, kết quả thi thật, bước tiếp.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
  khongLam: [KHONG_GV, KHONG_QL],
  muc: [
    { id: 'tvv-hv-nut', ten: 'Nút trên đầu hồ sơ', buoc: cx
      ? ['<b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Lịch sử</b>; em đang Tạm dừng: <b>Quay lại học</b>.', 'CX không đổi Lộ trình đang học, Môn học; không chọn Bước tiếp.']
      : ['<b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Bước tiếp…</b> (khi đã chọn) · <b>Kết quả thi thật</b> · <b>Lịch sử</b>; em đang Tạm dừng: <b>Quay lại học</b>.',
        'Thanh <b>Việc cần làm</b> đầu hồ sơ: <b>Chọn bước tiếp ›</b> · <b>Cập nhật kết quả thi thật ›</b> khi là việc của bạn; bấm dòng mở panel ngay tại hồ sơ.',
        '<b>+ Task</b> đầu hồ sơ: <b>Hỏi tình hình học tập</b> — gửi GVCN của em.'] },
    cx ? THI_THAT_CX : THI_THAT_TVV,
    { id: 'tvv-hv-tab', ten: 'Ba tab', buoc: ['<b>Học thuật</b>: điểm, Case, PA — chỉ xem.',
      cx ? '<b>Ý thức & Phối hợp</b>: <b>Vi phạm</b> và <b>Phối hợp SOS</b> — chỉ xem; cột báo PH ghi “Chờ TVV” hoặc kết quả.'
        : '<b>Ý thức & Phối hợp</b>: <b>Vi phạm</b> › nhóm <b>Chờ TVV báo PH</b> › <b>Ghi kết quả báo PH</b>; <b>Phối hợp SOS</b> chỉ xem (trừ <b>Ghi kết quả</b> sau meeting).',
      '<b>Lộ trình & lớp</b>: lưới tuần theo lớp, mọi lượt Test.'] },
  ],
});

/** Hồ sơ lớp: TVV có tab Báo cáo PH + khối "Ở lớp này"; CX không. */
const manHoSoLop = (cx = false): ManHd => ({
  id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: [`${HV}/lop`],
  dangO: { cau: cx ? 'Một lớp: em, điểm các lượt (chỉ xem); sửa thông tin cả lớp.' : 'Một lớp: em, điểm các lượt (chỉ xem); sửa thông tin cả lớp; báo cáo PH.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
  khongLam: [KHONG_GV, KHONG_QL],
  muc: [
    { id: 'tvv-lop-sua', viec: 'sua-hv', ten: 'Sửa thông tin cả lớp', buoc: ['⋯ <b>Thao tác khác</b> › <b>Sửa thông tin học viên</b>: bảng cả lớp, sửa nhiều em một lần.',
      'Cột Target: đổi nhiều em, một <b>Lý do đổi Target</b> chung.'] },
    { id: 'tvv-lop-tab', ten: 'Các tab của lớp', buoc: cx
      ? ['Tab <b>Học viên</b> · <b>Ý thức & Phối hợp</b> · <b>Phân tích lớp</b>; <b>Tổng hợp</b> · <b>Kết quả đầu ra</b> · <b>Thông tin lớp</b> chỉ xem.']
      : ['Tab <b>Học viên</b> · <b>Ý thức & Phối hợp</b> · <b>Phân tích lớp</b> · <b>Báo cáo PH</b> (chỉ lớp có mẫu); <b>Tổng hợp</b> · <b>Kết quả đầu ra</b> · <b>Thông tin lớp</b> chỉ xem.',
        'Tab <b>Học viên</b>: khối <b>Ở lớp này · học viên của tôi</b>; đầu trang ghi <b>TVV</b> của lớp.'] },
    ...chiTvvMuc(cx, [{ id: 'tvv-lop-bcph', ten: 'Báo cáo PH của lớp', buoc: ['Chọn đợt ở chip đầu tab <b>Báo cáo PH</b>.', '<b>Xuất Excel lớp</b> · <b>Xuất PDF lớp</b>; từng em: cột <b>Xuất</b> › <b>Excel</b> / <b>PDF</b>.'] }]),
  ],
});

const MAN_LUU_TRU: ManHd = {
  id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
  dangO: { cau: 'Lớp đã kết thúc và em đã Tạm dừng / Kết thúc học — để xem lại, sửa thông tin, cho em Tạm dừng quay lại học.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
  khongLam: [{ ten: 'Mở lại lớp, khôi phục thứ đã xoá', cua: 'việc của Head' }],
  muc: [{ id: 'lt-xem', ten: 'Xem em, lớp đã lưu trữ', buoc: ['Tab <b>Lớp đã kết thúc</b> (nút <b>Tổng kết</b>) · <b>Học viên đã lưu trữ</b> (<b>Sửa thông tin</b> · <b>Quay lại học</b> · <b>Tổng kết</b>).',
    'Em Tạm dừng quay lại học được (cả nhiều em: <b>Chọn nhiều học viên</b>); em Kết thúc học do Head mở lại.', 'Kết quả thi thật nhập ở hồ sơ em, kể cả khi đã lưu trữ.'] }],
};

const MAN_LUOT_TEST: ManHd = {
  id: 'luot-test', ten: 'Hồ sơ lượt Test', duong: ['/mock-test', '/luot-test'],
  dangO: { cau: 'Điểm một lượt Test của một em — chỉ xem.', truoc: { chu: 'Học viên & Lớp', duong: HV } },
  khongLam: [{ ten: 'Nhập điểm, dời lịch Test', cua: 'việc của GV' }, { ten: 'Xếp, dời lịch Test', cua: 'việc của Head' }],
  muc: [{ id: 'lt-diem', ten: 'Đọc điểm lượt Test', buoc: ['Điểm từng kỹ năng, nhận xét, Case của lượt; không có ô nhập.', 'Mở từ ô điểm ở hồ sơ em; mọi thay đổi ở khối <b>Lịch sử · n</b> cuối trang.'] }],
};

/* ponytail: màn này chỉ để phủ route `/giao-vien/:id` (HD-ROUTE: `nav.analysis` đủ để phép kiểm coi TVV / CX vào được; máy chủ 403). Gỡ khi route có cổng riêng. */
const MAN_HO_SO_GV: ManHd = {
  id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
  dangO: { cau: 'Trang của giáo viên (lớp dạy, số liệu); vai của bạn không mở được.', truoc: { chu: 'Tổng quan', duong: '/' } },
  khongLam: [{ ten: 'Xem hồ sơ, số liệu giáo viên', cua: 'việc của Head' }],
  muc: [{ id: 'hsgv-khong', ten: 'Vì sao không mở được', buoc: ['Hồ sơ giáo viên chỉ giáo viên xem của chính mình và Head xem.', 'Cần số liệu một giáo viên: nhờ Head.'] }],
};

const MAN_HO_SO_CA_NHAN: ManHd = {
  id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
  dangO: { cau: 'Thông tin và mật khẩu của bạn.' },
  muc: [mucGv('ho-so-ca-nhan', 'hs-sua')],
};
const MAN_HUONG_DAN: ManHd = {
  id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
  dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
  muc: [mucGv('huong-dan', 'hd-dung')],
};

/** HD3-3 — Trường hợp của TVV (Máy làm gì · Bạn làm gì · Ai khác nhận việc). */
const TINH_HUONG_TVV: TinhHuongHd[] = [
  {
    id: 'em-chua-co-tvv', ten: 'Em chưa có TVV / đổi TVV',
    may: ['Em chưa có TVV: Head chi nhánh giữ việc của TVV; Báo PH sau Meeting về GVCN lớp em.', 'Đổi TVV: việc đang mở sang TVV mới, hạn giữ nguyên.'],
    ban: 'Gán TVV ở <b>Sửa thông tin</b> của em.',
    tuKhac: ['chưa có tvv', 'đổi tvv', 'gán tvv'],
  },
  {
    id: 'ph-khong-nghe', ten: 'Phụ huynh không nghe máy', the: 'bao-ph',
    may: ['Chưa liên hệ được là một lần thử: việc vẫn mở, giữ hạn, dòng đếm số lần.'],
    ban: 'Chọn <b>Chưa liên hệ được</b>, ghi Nội dung, gọi lại trước hạn; cần thêm ngày: <b>Sửa hạn</b>.',
    tuKhac: ['không nghe máy', 'không liên lạc', 'gọi lại', 'no answer'],
  },
  {
    id: 'em-thi-that', ten: 'Em thi thật xong', the: 'thi-that',
    may: ['Hôm sau ngày thi có việc Cập nhật kết quả thi thật, không hạn.', 'Có kết quả → Chọn bước tiếp trong {han:buoc_tiep_sau_thi}; thi thật không tự kết thúc lộ trình.'],
    ban: 'Nhập điểm hoặc Không thi, rồi chọn bước tiếp ngay trong panel.',
    ai: ['Em chưa có TVV: Head; GVCN lớp cuối cũng nhập được kết quả.'],
    tuKhac: ['thi thật', 'ielts', 'kết quả thi', 'exam'],
  },
  {
    id: 'em-tam-dung', ten: 'Em tạm dừng / kết thúc học', the: 'tam-dung',
    may: ['Em vào Lưu trữ: Báo PH ẩn, hạn dừng; Chốt ngày thi, Bổ sung hồ sơ hết.', 'Vẫn còn: Cập nhật kết quả thi thật, và Chọn bước tiếp khi em tạm dừng.'],
    ban: 'Hồ sơ em: <b>Tạm dừng / Kết thúc học</b>; em quay lại: <b>Quay lại học</b>.',
    ai: ['Em đã kết thúc học thì Head mở lại.'],
    tuKhac: ['tạm dừng', 'nghỉ học', 'thôi học', 'pause'],
  },
  {
    id: 'viec-qua-han', ten: 'Việc quá hạn',
    may: ['Dòng việc đỏ, lên đầu mục; vẫn làm được; không có thẻ Báo Head.'],
    ban: 'Mở dòng làm như thường; Báo PH: <b>Sửa hạn</b>; Bước tiếp: <b>Gia hạn</b>.',
    ai: ['Head thấy việc quá hạn ở Công việc.'],
    tuKhac: ['quá hạn', 'trễ', 'overdue'],
  },
  {
    id: 'khong-thay-nut', ten: 'Không thấy nút / không có quyền',
    may: ['Danh sách chỉ có việc bạn giữ; việc của TVV khác cùng chi nhánh làm thay được từ hồ sơ em.', 'Case, điểm, Ý thức, Phối hợp SOS: bạn chỉ xem, trừ ghi Báo PH.'],
    ban: 'Không phải việc của bạn thì nhờ đúng người.',
    ai: ['Chuyển lớp, lịch Test: Head; điểm, Case: GV; vi phạm, Phối hợp: GVCN.'],
    tuKhac: ['quyền', 'không thấy', 'permission'],
  },
  {
    id: 'luu-loi', ten: 'Không lưu được, mất mạng',
    may: ['Chân panel báo không lưu được, chữ đang gõ vẫn giữ.', 'Báo PH bấm lưu lại không ghi đôi.'],
    ban: 'Bấm <b>Thử lại</b>; đừng đóng trình duyệt khi còn chưa lưu.',
    tuKhac: ['lỗi', 'mất mạng', 'không lưu', 'offline'],
  },
  {
    id: 'xu-ly-thu-hoi', ten: 'GVCN thu hồi / Head từ chối xử lý', the: 'bao-ph',
    may: ['Việc chưa báo thành Đã bỏ, kèm lý do; việc đã báo giữ nguyên, bạn nhận tin.', 'Thu hồi có nhờ báo lại → việc mới Báo PH đã thu hồi.'],
    ban: 'Việc đã bỏ không cần làm; báo lại khi có việc mới.',
    tuKhac: ['thu hồi', 'từ chối', 'đã bỏ', 'revoke'],
  },
  {
    id: 'em-chuyen-lop', ten: 'Em chuyển lớp',
    may: ['Việc theo em, không theo lớp: dòng ghi lớp em đang học.', 'Tình hình học tập hỏi trước đó → GVCN lớp mới trả lời.'],
    ban: 'Không cần làm gì thêm; chuyển lớp là việc của Head.',
    tuKhac: ['chuyển lớp', 'đổi lớp', 'transfer'],
  },
];
/** HD3-3 — Trường hợp CX gặp (CX không Công việc; chỉ xem phần lớn). */
export const TINH_HUONG_CX: TinhHuongHd[] = [
  {
    id: 'cx-chi-xem', ten: 'Không thấy nút / chỉ xem',
    may: ['CX không có Công việc; Case, điểm, Ý thức, Phối hợp SOS chỉ xem.'],
    ban: 'Việc của người khác thì nhờ TVV, GV, GVCN hoặc Head.',
    ai: ['Chọn bước tiếp sau thi: Head hoặc TVV.'],
    tuKhac: ['quyền', 'chỉ xem', 'permission'],
  },
  {
    id: 'cx-thi-that', ten: 'Em thi thật xong', the: 'thi-that',
    may: ['Thi thật không tự kết thúc lộ trình.'],
    ban: 'Hồ sơ em: <b>Kết quả thi thật</b>, gõ ngày thi và điểm, bấm <b>Lưu</b>; được cả khi em đã Lưu trữ.',
    ai: ['Head hoặc TVV chọn bước tiếp.'],
    tuKhac: ['thi thật', 'ielts', 'kết quả thi', 'exam'],
  },
  TINH_HUONG_TVV[6],
];

/** Panel làm việc đang mở (`KhungPanel hd=…`). `cx` = CX chỉ có các panel CX mở được; mục bước riêng (`viec`) chỉ cho việc vai đó có. */
export const manPanelTvvCx = (cx: boolean): ManHd[] => [
  {
    id: 'p-case', ten: 'Case đang mở', duong: [], panel: 'ngan-case',
    dangO: { cau: 'Một Case của em: PA, kết quả, người phụ trách — bạn chỉ xem.' },
    khongLam: [{ ten: 'Ghi mô tả, PA, kết quả PA', cua: 'việc của GV' }, { ten: 'Duyệt đề xuất PA', cua: 'việc của Head' }],
    muc: [{ id: 'pc-xem', ten: 'Xem Case', buoc: ['Đọc mô tả, PA, kết quả, lịch sử; người ghi là GV hoặc Head.', 'Cần gọi PH: nút gọi ở panel một em, khối <b>Phụ huynh</b>.'] }],
  },
  ...chiTvvMan(cx, [
    {
      id: 'p-bao-ph', ten: 'Báo PH vi phạm đang mở', duong: [], panel: 'bao-ph', the: 'bao-ph',
      dangO: { cau: 'Một lần xử lý vi phạm của một em cần bạn báo PH.' },
      khongLam: [KHONG_VI_PHAM],
      muc: [{ id: 'pbp-ghi', viec: 'bao-ph', ten: 'Ghi kết quả báo PH', buoc: ['Chọn <b>Kết quả</b>, <b>Ngày</b>, gõ <b>Nội dung</b> (bắt buộc).', '<b>Lưu · việc tiếp ›</b>; <b>Chưa liên hệ được</b>: việc vẫn mở, giữ hạn.'] },
        { id: 'pbp-han', viec: 'han-bao-ph', ten: 'Sửa hạn, bỏ việc', buoc: ['<b>Sửa hạn</b> › <b>Hạn mới</b> › <b>Lưu hạn</b>; <b>Về mặc định</b> được.', '<b>Thao tác phụ</b> › <b>Bỏ việc…</b>; <b>Khôi phục</b> được.'] }],
    },
    {
      id: 'p-phoi-hop', ten: 'Phối hợp SOS đang mở', duong: [], panel: 'phoi-hop-sos', the: 'bao-ph-meeting',
      dangO: { cau: 'Bảng Phối hợp SOS của một lớp: bạn chỉ ghi kết quả báo PH sau meeting CX/GĐCN.' },
      khongLam: [{ ten: 'Thêm việc, đánh dấu đã làm, xác nhận meeting', cua: 'việc của GVCN' }],
      muc: [{ id: 'pph-ghi', viec: 'bao-ph-meeting', ten: 'Ghi kết quả báo PH', buoc: ['Cột <b>Báo PH · kết quả</b>: <b>Ghi kết quả</b> ở em chờ bạn.', 'Chọn <b>Đã báo PH</b> / <b>Chưa liên hệ được</b>, <b>Ngày</b>, <b>Nội dung</b>; <b>Lưu</b>.'] }],
    },
    {
      id: 'p-chot-ngay-thi', ten: 'Chốt ngày thi đang mở', duong: [], panel: 'chot-ngay-thi', the: 'chot-ngay-thi',
      dangO: { cau: 'Chốt ngày thi hoặc dời tháng dự kiến cho một em.' },
      khongLam: [KHONG_QL],
      muc: [{ id: 'pct-chot', viec: 'chot-ngay-thi', ten: 'Chốt ngày thi', buoc: ['Ô <b>Chốt</b>: <b>Ngày thi</b> hoặc <b>Dời tháng dự kiến</b>.', '<b>Chốt ngày</b>; việc tự hết.'] }],
    },
  ]),
  {
    id: 'p-sau-thi', ten: cx ? 'Kết quả thi thật đang mở' : 'Sau thi đang mở', duong: [], panel: 'sau-thi', the: 'thi-that',
    dangO: { cau: cx ? 'Ghi kết quả thi thật của một em; bước tiếp do Head hoặc TVV chọn.' : 'Kết quả thi thật rồi tới bước tiếp của một em, trong cùng panel.' },
    khongLam: [KHONG_QL],
    muc: cx ? [{ id: 'pst-kq', viec: 'thi-that', ten: 'Ghi kết quả thi thật', buoc: ['<b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), <b>Lưu</b>.', 'Bước tiếp: bạn chỉ xem.'] }]
      : [{ id: 'pst-kq', viec: 'thi-that', ten: 'Ghi kết quả thi thật', buoc: ['Gõ điểm L R W S (hoặc <b>Không thi</b>), <b>Lưu điểm</b>.', 'Sai điểm: <b>Sửa điểm</b>.'] },
        { id: 'pst-tiep', viec: 'buoc-tiep', ten: 'Chọn bước tiếp', buoc: ['<b>Tạm dừng / Kết thúc học</b> (ô <b>Có thể quay lại học</b>) hoặc <b>Lộ trình mới</b>.', 'Hạn {han:buoc_tiep_sau_thi} từ ngày có kết quả; <b>Gia hạn</b> ở dòng việc.'] }],
  },
  ...chiTvvMan(cx, [{
    id: 'p-lo-trinh', ten: 'Lộ trình mới đang mở', duong: [], panel: 'lo-trinh', the: 'buoc-tiep',
    dangO: { cau: 'Chọn lộ trình học tiếp cho em sau kỳ thi thật.' },
    khongLam: [KHONG_QL],
    muc: [{ id: 'plt-chon', viec: 'buoc-tiep', ten: 'Chọn lộ trình mới', buoc: ['Chọn lộ trình; môn học và Target giữ (đã đạt: gợi ý +1.0), sửa được.', 'Đầu vào là kết quả thi thật gần nhất.'] }],
  }]),
  {
    id: 'p-sua-thong-tin', ten: 'Sửa thông tin đang mở', duong: [], panel: 'sua-thong-tin', the: 'sua-hv',
    dangO: { cau: cx ? 'Sửa thông tin một em: liên hệ, Dự kiến thi, Target.' : 'Sửa thông tin một em: liên hệ, Dự kiến thi, Target, lộ trình đang học.' },
    khongLam: [KHONG_GV],
    muc: [{ id: 'pst-sua', viec: 'sua-hv', ten: 'Sửa thông tin, đổi Target', buoc: ['Sửa ô cần đổi; đổi Target thì ghi <b>Lý do đổi Target</b>.', '<b>Lưu</b>; hộp ghi <b>Lịch sử</b>.'] },
      ...chiTvvMuc(cx, [{ id: 'pst-lt', viec: 'doi-lo-trinh', ten: 'Đổi lộ trình, môn học', buoc: ['Khối <b>Lộ trình đang học</b>: chọn LT1, LT2 hoặc RF; ô <b>Môn học</b> chọn môn em học.', 'MT đã có điểm giữ nguyên; MT chưa thi xếp lại; <b>Lưu</b>.'] },
        { id: 'pst-bs', viec: 'bo-sung', ten: 'Bổ sung hồ sơ thiếu', buoc: ['Điền phần còn thiếu, <b>Lưu · em tiếp ›</b> hoặc <b>Bỏ qua ›</b>.', 'Đổi <b>Tuần bắt đầu</b>: MT chưa thi dời theo, MT đã có điểm giữ nguyên.'] }])],
  },
  {
    id: 'p-sua-ca-lop', ten: 'Sửa thông tin cả lớp đang mở', duong: [], panel: 'sua-ca-lop', the: 'sua-hv',
    dangO: { cau: cx ? 'Bảng cả lớp: sửa nhiều em một lần (Target).' : 'Bảng cả lớp: sửa nhiều em một lần (Target, môn học, Tuần bắt đầu).' },
    khongLam: [KHONG_GV],
    muc: [{ id: 'pcl-sua', viec: 'sua-hv', ten: 'Sửa nhiều em một lần', buoc: ['Sửa ô trong bảng; đổi <b>Tuần bắt đầu</b> thì MT chưa thi dời theo.', 'Đổi Target nhiều em: một <b>Lý do đổi Target</b> chung; <b>Lưu</b>.'] }],
  },
  {
    id: 'p-them-hv', ten: 'Thêm học viên đang mở', duong: [], panel: 'them-hv', the: 'them-hv',
    dangO: { cau: 'Thêm một hoặc nhiều học viên vào lớp.' },
    khongLam: [{ ten: 'Phân công giáo viên', cua: 'việc của Head' }],
    muc: [{ id: 'pth-them', viec: 'them-hv', ten: 'Thêm học viên', buoc: ['Chọn <b>Thêm vào lớp</b>, gõ từng em hoặc <b>Dán vùng bảng từ Excel / Google Sheets</b> › <b>Đọc nội dung đã dán</b>.', 'Kiểm lại dòng đỏ, bấm nút <b>Thêm học viên</b>.'] }],
  },
  {
    id: 'p-xuat-ds', ten: 'Xuất Excel đang mở', duong: [], panel: 'xuat-ds', the: 'xuat-ds',
    dangO: { cau: cx ? 'Xuất danh sách học viên đang lọc.' : 'Xuất danh sách học viên hoặc báo cáo PH theo tháng.' },
    khongLam: [{ ten: 'Viết báo cáo PH', cua: 'việc của GV' }],
    muc: [{ id: 'pxd-xuat', viec: 'xuat-ds', ten: 'Xuất Excel', buoc: cx ? ['Ngăn xuất đúng danh sách đang lọc.', 'Bấm nút xuất.'] : ['Khối <b>Mẫu</b>: <b>Danh sách</b> hoặc <b>Báo cáo PH</b> (chọn <b>Tháng</b>).', 'Bấm nút xuất.'] }],
  },
];

/** TVV và CX cùng bộ màn, riêng Hồ sơ lớp / Hồ sơ HV theo vai. */
export const manHoSoVai = (cx: boolean): ManHd[] => [manHoSoLop(cx), manHoSoHv(cx), MAN_LUU_TRU, MAN_LUOT_TEST, MAN_HO_SO_GV, MAN_HO_SO_CA_NHAN, MAN_HUONG_DAN];

export const LUAT_TVV: MucHd[] = [
  { id: 'tvv-luat-target', ten: 'Đổi Target', buoc: ['TVV, CX, Head sửa thẳng; <b>Lý do đổi Target</b> bắt buộc.', 'Target mới tính từ hôm nay; kỳ vọng các lượt đã làm bài giữ nguyên.'] },
  { id: 'tvv-luat-tam-dung', ten: 'Tạm dừng', buoc: ['Em Tạm dừng: mọi hạn của em dừng, việc ẩn, không quá hạn.', 'Bấm nhầm: <b>Hoàn tác</b> ngay trên thông báo.'] },
  { id: 'tvv-luat-thi-that', ten: 'Kết quả thi thật', buoc: ['Nhập được cả khi em đã Lưu trữ.', 'Có kết quả → việc <b>Chọn bước tiếp</b>; Head hoặc TVV chọn. Hạn {han:buoc_tiep_sau_thi} từ ngày có kết quả (hoặc từ ngày thi nếu muộn hơn), <b>Gia hạn</b> được.'] },
  { id: 'tvv-luat-bao-ph', ten: 'Báo PH vi phạm', buoc: ['GVCN lưu xử lý Nâng 1 bậc là có việc ngay cho TVV của em; cách khác có việc khi Head duyệt hoặc máy chốt; hạn {han:bao_ph_vi_pham}, tính cả ngày lưu.',
    'Chưa liên hệ được: việc vẫn mở, giữ hạn. Sửa hạn: TVV, GVCN lớp em, Head; không trần, không xin duyệt.', 'GVCN thu hồi lần xử lý: lần báo của bạn giữ trong lịch sử; Head nhờ báo lại thì có việc mới.'] },
  { id: 'tvv-luat-phoi-hop', ten: 'Phối hợp SOS', buoc: ['Phối hợp SOS chỉ GVCN làm; Head theo dõi và làm thay. TVV, CX chỉ xem.',
    'Ngoại lệ: GVCN xác nhận meeting CX/GĐCN xong thì TVV báo PH, xếp họp, ghi kết quả; hạn theo cấu hình Case & SOS. Em chưa có TVV: GVCN báo.'] },
  { id: 'tvv-luat-lo-trinh', ten: 'Đổi lộ trình đang học', buoc: ['TVV, GVCN, Head đổi; CX không. MT đã có điểm giữ nguyên, MT chưa thi xếp lại theo lộ trình mới.', 'Có nhật ký ở <b>Lịch sử</b>.'] },
  { id: 'tvv-luat-hoc-thuat', ten: 'Học thuật', buoc: ['Điểm, Case, PA, Ý thức: GV và Head ghi; TVV xem.'] },
];

export const TU_TVV: TuHd[] = [
  ...HD_GV.tu,   // UX-1: đủ như GV (TVV / CX đọc cùng hồ sơ, Case, PA)
  { ten: 'HV của tôi', nghia: 'Em có TVV là bạn (ô TVV trong Sửa thông tin).' },
  { ten: 'Cần chú ý trước', nghia: 'Cách xếp em trong lớp: việc quá hạn lên đầu, rồi SOS cao.' },
  { ten: 'Sắp thi', nghia: 'Em thi IELTS trong 6 tuần tới.' },
  { ten: 'Thiếu thông tin', nghia: 'Hồ sơ chưa đủ để theo dõi; điền đủ là hết.' },
  { ten: 'Bước tiếp', nghia: 'Hướng sau thi thật: Tạm dừng / Kết thúc học · Học tiếp · Lộ trình mới.' },
  { ten: 'Phối hợp SOS', nghia: 'Việc GVCN làm với em, gia đình khi em SOS (trao đổi, meeting); TVV chỉ báo lại kết quả meeting CX/GĐCN.' },
];

const THU_TU = ['xem-viec', 'xem-thi-thang', 'bao-ph', 'bao-ph-meeting', 'han-bao-ph', 'chot-ngay-thi', 'bo-sung', 'thi-that', 'buoc-tiep', 'sua-hv', 'doi-lo-trinh', 'tam-dung', 'xem-case', 'lich-su',
  'loc-hv', 'them-hv', 'tim-kiem', 'luu-tru', 'xuat-ds', 'bao-cao-ph-lop', 'phan-tich'];

export const HD_TVV: HuongDan = {
  viec: [],
  lam: THU_TU.map((id) => [...VIEC_TVV, ...VIEC_RIENG_TVV].find((v) => v.id === id)!),
  tuan: [
    { nhip: 'Hằng ngày', viec: ['xem-viec', 'xem-thi-thang', 'loc-hv'] },
    { nhip: 'Hằng tháng', viec: ['phan-tich', 'xuat-ds', 'bao-cao-ph-lop'] },
    { nhip: 'Khi có', viec: ['bao-ph', 'bao-ph-meeting', 'han-bao-ph', 'bo-sung', 'chot-ngay-thi', 'thi-that', 'buoc-tiep', 'sua-hv', 'doi-lo-trinh', 'tam-dung', 'xem-case', 'them-hv', 'lich-su', 'tim-kiem', 'luu-tru'] },
  ],
  /* HD3-3: tab "Trường hợp" của TVV (15 mục 4.7) — nguồn từng câu ở `docs/anh/hd3-3-tvv-cx/khop-khac.md`. */
  tinhHuong: TINH_HUONG_TVV,
  vaiKhac: VAI_KHAC_TVV,
  man: [
    {
      /* UI-CV-TVV (C05): TVV có Công việc — chỉ việc của mình. */
      id: 'cong-viec', ten: 'Công việc', duong: [CV, '/'],   // `/` chuyển thẳng sang Công việc (GD-8, như GV GD-1)
      /* GD-8 (mockup v21 ④): trang đầu TVV — dải 5 chỉ số trên, việc trái, HV của tôi phải; "+ Task" = Hỏi tình hình học tập. */
      dangO: { cau: 'Trang đầu của bạn: năm chỉ số, việc của bạn (Báo PH, sau thi, chốt ngày thi, bổ sung hồ sơ) và HV của tôi.', sau: { chu: 'Học viên & Lớp', duong: HV } },
      khongLam: [KHONG_GV, KHONG_QL],
      muc: [{ id: 'tvv-cv-nhom', ten: 'Cách làm một việc', buoc: ['Bấm dòng em: panel mở bên phải, làm xong không rời trang; <b>Việc tiếp ›</b> sang việc kế.',
        'Nút ⓘ cạnh tên nhóm nói hạn: Báo PH {han:bao_ph_vi_pham}; Bước tiếp sau thi {han:buoc_tiep_sau_thi} từ ngày có kết quả; Chốt ngày thi, Bổ sung hồ sơ không hạn.', 'Chỉ có việc của bạn — không có <b>Làm thay</b>; Head mới xem việc người khác.'] },
      { id: 'tvv-cv-hv', ten: 'HV của tôi · + Task', buoc: ['Chưa chọn việc: khung phải là <b>HV của tôi</b> — em · lớp · tình trạng (Thi dd/mm · Đã thi · chờ KQ · SOS) · nút <b>Báo PH · n</b>, <b>Sau thi · n</b>… mở việc ngay tại trang; quá hạn màu đỏ.',
        'Em không việc, không tình trạng gập ở <b>n em khác</b>; ô <b>Tìm em</b> lọc cả nhóm gập.', '<b>+ Task</b> › <b>Hỏi tình hình học tập</b>: chọn em của bạn, gõ câu hỏi, gửi GVCN.'] },
      { id: 'tvv-cv-loc', ten: 'Lọc việc', buoc: ['<b>Lọc theo hạn</b>: <b>Mọi hạn</b> · <b>Quá hạn</b> · <b>Hôm nay</b>.', '<b>Lọc thêm</b>: chi nhánh, khung Fast Track / Lớp thường.'] }],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      dangO: { cau: 'Thống kê theo kỳ: chi nhánh, thi thật, SOS.', truoc: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_GV],
      muc: [{ id: 'tvv-pt', ten: 'Tab phân tích', buoc: ['<b>Chi nhánh</b> · <b>Thi thật</b> · <b>SOS</b> (Phân tích V2); không có tab Giáo viên, Ý thức.',
        'Kỳ: <b>Toàn bộ</b> hoặc <b>Chọn khoảng tuần</b>; bấm số mở danh sách ngay tại trang.', '<b>Xuất Excel</b> ở hàng lọc (tab Chi nhánh thêm <b>In</b>).'],
        chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Tìm em, lớp; thêm lớp, học viên; xuất Excel; xem nhanh một em không rời trang.', truoc: { chu: 'Công việc', duong: CV } },
      khongLam: [KHONG_GV, KHONG_QL],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em, lớp', buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Không thấy: <b>Tìm trong HV lưu trữ ›</b>.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'tvv-hvl-cot', ten: 'Bảng và thao tác dòng', buoc: ['Cột <b>Việc cần làm</b>: chip việc của bạn với em đó, bấm để làm ngay tại trang; bấm <b>tên</b> em mở hồ sơ.', '<b>⋯</b> cuối dòng (<b>Thao tác khác</b>): <b>Hỏi tình hình học tập</b> (gửi GVCN, em điền sẵn) · <b>Sửa thông tin</b> · <b>Tạm dừng / Kết thúc học</b> · <b>Kết quả thi thật</b> · <b>Quay lại học</b> · <b>Mở hồ sơ</b>.'] },
        mucGv('hoc-vien', 'hv-lich-thi'),
      ],
    },
    ...manHoSoVai(false),
    ...manPanelTvvCx(false),
  ],
  luat: LUAT_TVV,
  tu: TU_TVV,
};
