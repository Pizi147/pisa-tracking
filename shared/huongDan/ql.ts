/**
 * HD-b — Hướng dẫn QUẢN LÝ. 5 việc hằng tuần theo mockup OV-13 §5a. Màn trùng với GV (Học viên & Lớp, Lịch Test, nhập điểm…) lấy mục của GV
 * rồi chỉ ghi phần hơn GV (chủ SP: QL quản lý lớp / luật). Nhãn nút đối chiếu màn thật trên main 16/10 (sau OV-13a…n, HOTFIX-3).
 */
import { HD_GV } from './gv.ts';
import type { HuongDan, ManHd, MucHd } from './kieu.ts';

const manGv = (id: string) => HD_GV.man.find((m) => m.id === id)!;
/** Màn trùng GV: giữ mục của GV, thêm mục QL. */
const themMan = (id: string, ...muc: MucHd[]): ManHd => ({ ...manGv(id), muc: [...manGv(id).muc, ...muc] });
export const luatGv = (...ids: string[]): MucHd[] => ids.map((id) => HD_GV.luat.find((m) => m.id === id)!);

export const HD_QL: HuongDan = {
  viec: [
    {
      id: 'ql-sang', ten: 'Tổng quan + Chờ duyệt mỗi sáng', khi: 'mỗi ngày',
      buoc: ['Mở <b>Tổng quan</b>: hàng <b>Chờ duyệt</b> đếm thẻ theo loại, có chip <b>Quá hạn</b>; bấm chip mở hộp đã lọc.',
        'Khối <b>Cần xử lý</b>: việc của chi nhánh, quá hạn ở đầu; <b>Xem</b> mở Công việc lọc sẵn tên từng người.',
        'Menu <b>Công việc</b> vào thẳng <b>Chờ duyệt</b>; số trên menu = thẻ cần bạn quyết.'],
      chi: { hd: 'tq-can-xu-ly', duong: '/', chu: 'Việc của chi nhánh cần bạn để ý — quá hạn ở đầu.' },
    },
    {
      id: 'ql-lich-test', ten: 'Xếp / dời lịch Test', khi: 'mỗi tuần',
      buoc: ['Mở <b>Test › Kế hoạch Test</b>; chip <b>Cần xếp lại</b> đếm em cần xếp lại.',
        'Nhiều lớp FT: <b>Xếp nhiều MT…</b>; lớp thường: <b>Xếp lịch Test…</b>.',
        'Một kỹ năng: bấm chip kỹ năng ở dòng lớp; <b>⋯</b> có <b>Dời lịch thi</b>, <b>Dời hạn chấm</b>, <b>Huỷ kỹ năng</b>.',
        'Theo dõi chấm: <b>Lịch Test / Chấm Test</b> — khối <b>Test quá hạn chấm</b> và <b>Test chấm tuần này</b>.'],
      chi: { hd: 'kht-loc', duong: '/test/ke-hoach', chu: 'Chọn chương trình, lọc lớp, xếp nhiều MT ở hàng này.' },
    },
    {
      id: 'ql-duyet', ten: 'Duyệt Case, PA, đề xuất', khi: 'trong 5 ngày',
      buoc: ['<b>Công việc › Chờ duyệt</b>: chọn loại <b>Học thuật · Ý thức · Lịch thi · Thông tin HV</b>; quá hạn xếp trước.',
        'Thẻ ghi "Nếu duyệt: …". <b>Duyệt</b> (<b>Duyệt…</b> khi cần chọn thêm) · <b>Từ chối…</b> bắt buộc lý do · <b>Mở</b> xem nguồn.',
        '<b>Xin ý kiến</b> (GV bấm Xin hỗ trợ QL): <b>Trả lời…</b>, PA vẫn chạy; cần PA mới thì <b>+ Thêm PA</b>.',
        'Đề xuất PA, Dời lịch thi lần 2 cùng loại: đánh dấu ô ở thẻ → <b>Duyệt n yêu cầu</b>.'],
      chi: { hd: 'cd-loc', duong: '/cong-viec/cho-duyet', chu: 'Chọn trạng thái và loại thẻ ở đây.' },
    },
    {
      id: 'ql-y-thuc', ten: 'Ý thức cần QL', khi: 'trong 5 ngày',
      buoc: ['GVCN đề xuất WL 3, Meeting CX/GĐCN, Đình chỉ học tạm thời hoặc Khác → thẻ ở <b>Chờ duyệt › Ý thức</b>.',
        'Duyệt → GVCN bấm <b>Đã thực hiện</b> trong 5 ngày; Từ chối → vi phạm về <b>Cần xử lý</b>, bậc giữ nguyên.',
        'Vi phạm quá hạn: thẻ ở <b>Báo QL</b> — để biết, tự đóng khi GVCN xử lý xong.'],
      chi: { hd: 'cd-loc', duong: '/cong-viec/cho-duyet', chu: 'Bấm <b>Ý thức</b> để chỉ xem thẻ Ý thức; <b>Báo QL</b> là thẻ để biết.' },
    },
    {
      id: 'ql-lo-trinh', ten: 'Hết khoá / Lộ trình tiếp theo', khi: 'khi lớp sắp hết khoá',
      buoc: ['Lớp thường: Tổng quan › <b>Cần xử lý</b> "n lớp cần Chốt lộ trình" → <b>Lộ trình tiếp theo</b>.',
        'Hồ sơ lớp › <b>Chốt lộ trình</b>: chọn hướng từng em (Lên lớp, Học lại, Lên FT…); lớp cũ có phiếu bàn giao.',
        'Em FT có kết quả thi thật: <b>Chọn bước tiếp ›</b> — <b>Lộ trình mới</b> · <b>Tạm dừng</b> · <b>Thôi học</b> (QL hoặc TVV chọn).',
        'Một em đổi lớp khi đang học: hồ sơ em › <b>⋯ › Chuyển lớp…</b>.'],
      chi: { hd: 'tq-can-xu-ly', duong: '/', chu: 'Dòng "Chốt lộ trình" nằm trong khối này khi tới hạn.' },
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'ql-tq-cho-duyet', ten: 'Hàng Chờ duyệt', buoc: ['Số thẻ chờ bạn quyết, chia <b>Học thuật · Ý thức · Lịch thi · Thông tin HV</b>, thêm chip <b>Quá hạn</b>.', 'Bấm chip mở hộp đã lọc; <b>Mở hộp duyệt</b> xem hết.'] },
        { id: 'ql-tq-can-xu-ly', ten: 'Cần xử lý', buoc: ['Việc của chi nhánh: bài quá hạn chấm, PA chưa có kết quả, lớp cần Chốt lộ trình…', 'Nút cuối dòng mở Công việc lọc sẵn, có tên từng người.'],
          chi: { hd: 'tq-can-xu-ly', duong: '/', chu: 'Việc của chi nhánh — quá hạn ở đầu.' } },
        { id: 'ql-tq-so-lieu', ten: 'Số liệu', buoc: ['Bốn ô: dưới kỳ vọng, Case đang mở, Case chưa chốt PA, PA chưa có kết quả; bấm số mở danh sách.', '<b>Điểm đáng chú ý</b> · <b>Lịch sắp tới</b> (<b>Xem toàn bộ lịch ›</b> mở Kế hoạch Test) · bảng <b>Theo lớp</b>.'] },
      ],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      muc: [{ id: 'ql-pt-goc', ten: 'Sáu tab phân tích', buoc: ['<b>Báo cáo</b> · <b>Test + SOS</b> · <b>Kết quả thi</b> · <b>Hiệu quả PA</b> · <b>Phân tích GV</b> · <b>Ý thức</b>.', '<b>Báo cáo</b> (mặc định): 2 tuần vừa qua cho buổi họp; <b>In</b> ra một trang A4 ngang.'],
        chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn tab ở hàng này.' } },
      { id: 'ql-pt-thoi-gian', ten: 'Khoảng thời gian', buoc: ['Một <b>Khoảng thời gian</b> cho mọi tab (mặc định 2 tuần vừa qua); bấm số mở danh sách, làm tại chỗ.', 'Bảng dài: 10 dòng một trang, chọn 20 / 50 ở đầu hoặc cuối bảng.'],
        chi: { hd: 'pt-thoi-gian', duong: '/phan-tich', chu: 'Đổi khoảng cho mọi tab ở đây.' } }],
    },
    themMan('hoc-vien',
      { id: 'ql-hvl-them', ten: 'Thêm lớp, học viên', buoc: ['<b>+ Lớp mới</b> · <b>+ Học viên</b> (điện thoại: trong <b>⋯</b>).', '<b>+ Học viên</b>: dán vùng bảng từ Excel / Google Sheets. <b>Email</b> * không trùng em khác; trống vẫn lưu, em có việc <b>Thiếu email</b>.'] },
      { id: 'ql-hvl-pham-vi', ten: 'Phạm vi và Lưu trữ', buoc: ['<b>Phạm vi</b>: Lớp tôi dạy · Chi nhánh.', '<b>Cần làm</b> chia <b>Quá hạn · Chờ duyệt · Thiếu thông tin</b> (gồm <b>Thiếu email</b>).', '<b>⋯ › Lưu trữ</b>: lớp đã kết thúc, em đã lưu trữ.'],
        chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Ba góc nhìn và lọc phụ ở hàng này.' } },
    ),
    themMan('ho-so-lop',
      { id: 'ql-lop-sua', ten: 'Sửa thông tin cả lớp', buoc: ['Tab <b>Học viên</b> › <b>Sửa thông tin</b>: bảng cả lớp, sửa nhiều em một lần.', 'Đổi Target nhiều em: một <b>Lý do đổi Target</b> chung.'] },
      { id: 'ql-lop-chon-nhieu', ten: 'Chọn nhiều học viên', buoc: ['<b>Chọn nhiều học viên</b> → <b>Lưu trữ</b> · <b>Kết thúc học</b> · <b>Huỷ chuyển lớp</b> · <b>Xoá</b>.'] },
      { id: 'ql-lop-ban-giao', ten: 'Chuyển lớp, bàn giao', buoc: ['Dải <b>Bàn giao</b> trên đầu hồ sơ lớp → <b>Mở phiếu</b>.', 'GVCN lớp cũ viết nhận xét chung, GVBM mỗi môn một dòng; QL điền thay được.'] },
    ),
    themMan('ho-so-hv',
      { id: 'ql-hv-menu', ten: 'Thao tác với em', buoc: ['<b>⋯</b> trên đầu hồ sơ: <b>Sửa thông tin</b> · <b>Chuyển lớp…</b> · <b>Tạm dừng / Thôi học</b> · <b>Kết quả thi thật</b> · <b>Lịch sử sửa</b>.', 'Em đã học xong: <b>Lưu trữ</b> (có Hoàn tác).'] },
      { id: 'ql-hv-chuyen', ten: 'Chuyển lớp', buoc: ['<b>Lớp chuyển đến</b>, <b>Tuần bắt đầu</b>, <b>Lý do</b>.', 'Chọn <b>Ngay hôm nay</b> → nút <b>Chuyển ngay</b> (không hoàn tác); tuần khác → <b>Quyết định chuyển lớp</b>.', 'GVCN lớp cũ bàn giao, hạn ghi ở chân panel.'] },
      { id: 'ql-hv-ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['Mở Case, <b>⋯</b> ở dòng PA quy chế đang chạy → <b>Kết thúc PA</b>.', '<b>Lý do</b> bắt buộc, từ 10 ký tự.'] },
      { id: 'ql-hv-lich-su', ten: 'Lịch sử sửa', buoc: ['<b>⋯ › Lịch sử sửa</b>: ai sửa gì, lúc nào.', 'Lọc <b>Thông tin · Target / lộ trình · Trạng thái</b>.'] },
    ),
    {
      id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
      muc: [{ id: 'ql-luu-tru', ten: 'Lớp và em đã lưu trữ', buoc: ['Hai tab: <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b>.', 'Mỗi em: <b>Tổng kết</b> · <b>Học lại</b> · <b>Bỏ lưu trữ</b>.'] }],
    },
    themMan('lich-test', { id: 'ql-lt-xuat', ten: 'Xuất Excel', buoc: ['<b>Xuất Excel</b> kết quả Test theo phạm vi của bạn. Cột <b>Email</b> ngay sau Tên (không có cột Mã).', 'Điện thoại: nút nằm trong <b>Lọc</b>.'] }),
    manGv('diem-lop'),
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: ['/test/ke-hoach'],
      muc: [
        { id: 'ql-kh-xep', ten: 'Xếp lịch nhiều lớp', buoc: ['Chọn <b>Fast Track</b> hoặc <b>Lớp thường</b>; chip <b>Cần xếp lại</b> chỉ lớp có em cần xếp.', '<b>Xếp nhiều MT…</b> (FT) · <b>Xếp lịch Test…</b> (lớp thường).'],
          chi: { hd: 'kht-loc', duong: '/test/ke-hoach', chu: 'Lọc và xếp lịch nhiều lớp ở hàng này.' } },
        { id: 'ql-kh-ky-nang', ten: 'Một kỹ năng', buoc: ['Bấm chip kỹ năng ở dòng lớp: chọn tuần, <b>Lưu</b>.', '<b>⋯</b>: <b>Dời lịch thi</b> · <b>Dời hạn chấm</b> · <b>Huỷ kỹ năng</b> · <b>Huỷ điểm</b> · <b>Trả lời đề nghị dời</b> · <b>Không mock lại</b>.'] },
        { id: 'ql-kh-luat', ten: 'Luật xếp lịch', buoc: ['Link <b>Luật xếp lịch Test</b> trên hàng lọc.'] },
        { id: 'ql-kh-tim', ten: 'Tìm lớp, học viên', buoc: ['Gõ mã lớp, tên (có / không dấu) hoặc email vào <b>Tìm lớp, học viên hoặc email…</b>.', 'Chọn em: lớp mở, hàng em được đánh dấu.'] },
        { id: 'ql-kh-xoa', ten: 'Xóa lịch một đợt', buoc: ['Bấm ô MT, chân hộp: <b>Xóa</b> → đợt về <b>Chưa xếp</b>, lịch sử giữ; có <b>Hoàn tác</b>.', 'Đã có điểm / đã thi: nút mờ. Kỹ năng huỷ vì vắng 2 lần: <b>Khôi phục → Chưa xếp</b> hoặc <b>Giữ huỷ</b>.'] },
        { id: 'ql-kh-ghi-chu', ten: 'Ghi chú lịch thi', buoc: ['Ô <b>Ghi chú lịch thi</b> trong hộp; ghi chú hiện một dòng dưới chip, bấm để sửa (Enter lưu · Esc huỷ).', '<b>+ Ghi chú lớp</b> dưới bảng. Chỉ là ghi chú, không dời lịch.'] },
        { id: 'ql-kh-xuat', ten: 'Xuất Excel', buoc: ['<b>Xuất Excel</b>: Kế hoạch Test 13 cột theo bộ lọc đang xem (tuần kèm năm, <b>W4 AUG/2026</b>).', '<b>Xuất điểm Test</b>: <b>Điểm + nhận xét</b> / <b>Chỉ điểm</b>; theo tuần, theo lớp (nhiều MT) hoặc lớp + khoảng tuần.'] },
      ],
    },
    themMan('nhap-diem', { id: 'ql-nd-sua', ten: 'Sửa điểm đợt đã hoàn tất', buoc: ['Chỉ QL sửa hoặc xoá một điểm đã có: bấm ô, sửa, ghi <b>Lý do sửa</b> (tuỳ chọn).', 'Nhật ký ghi lại; GV nhờ QL khi cần sửa.'] }),
    {
      id: 'cho-duyet', ten: 'Chờ duyệt', duong: ['/cong-viec/cho-duyet'],
      muc: [
        { id: 'ql-cd-loc', ten: 'Lọc thẻ', buoc: ['<b>Chờ duyệt</b> · <b>Báo QL</b> (để biết, không cần quyết) · <b>Đã xử lý (30 ngày)</b>.', 'Loại: <b>Tất cả · Học thuật · Ý thức · Lịch thi · Thông tin HV</b>.'],
          chi: { hd: 'cd-loc', duong: '/cong-viec/cho-duyet', chu: 'Chọn trạng thái và loại thẻ ở đây.' } },
        { id: 'ql-cd-the', ten: 'Quyết một thẻ', buoc: ['<b>Duyệt</b> / <b>Duyệt…</b> · <b>Từ chối…</b> (lý do bắt buộc, người gửi đọc) · <b>Mở</b>.', '<b>Xin ý kiến</b>: <b>Trả lời…</b> hoặc <b>+ Thêm PA</b>.', 'Đã xử lý: <b>Huỷ quyết định</b> · <b>Sửa trả lời…</b>.'] },
        { id: 'ql-cd-nhieu', ten: 'Duyệt nhiều', buoc: ['Đề xuất PA, Dời lịch thi lần 2: đánh dấu ô ở thẻ cùng loại.', '<b>Duyệt n yêu cầu</b> hoặc <b>Từ chối n…</b>.'] },
      ],
    },
    themMan('cong-viec', { id: 'ql-cv-cua-gv', ten: 'Việc của GV', buoc: ['<b>Của tôi</b> / <b>Của GV</b>: xem việc của mọi GV chi nhánh.', '<b>Lọc thêm</b> › <b>Của một GV</b>.'],
      chi: { hd: 'cv-loc-them', duong: '/cong-viec', chu: 'Lọc theo nhóm việc, chương trình, một GV.' } }),
    {
      id: 'van-hanh', ten: 'Vận hành', duong: ['/cong-viec/van-hanh'],
      muc: [{ id: 'ql-vh', ten: 'Việc vận hành', buoc: ['Bốn số lọc: <b>Quá hạn</b> · <b>Chờ người khác</b> · <b>Cần quyết định</b> · <b>Vừa hoàn thành (7 ngày)</b>.', '<b>+ Giao việc</b>: việc ngoài học viên (giáo trình, tutor…), có người phụ trách, hạn.'],
        chi: { hd: 'vh-so', duong: '/cong-viec/van-hanh', chu: 'Bấm một số để lọc việc.' } }],
    },
    {
      id: 'bao-cao', ten: 'Báo cáo đơn vị', duong: ['/cong-viec/bao-cao'],
      muc: [{ id: 'ql-bc', ten: 'Báo cáo tuần / tháng', buoc: ['Chọn <b>Tuần</b> / <b>Tháng</b>, ‹ › đổi kỳ.', 'Bảng <b>Tình hình đơn vị</b>: đơn vị nào đã nộp, đang nhập, chưa báo cáo.', 'Nộp muộn vẫn được, ô gắn nhãn "nộp muộn".'] }],
    },
    themMan('ho-so-ca-nhan', { id: 'ql-goc-nhin', ten: 'Góc nhìn', buoc: ['Bạn kiêm thêm vai (vd GV): menu Tài khoản › <b>Góc nhìn</b> — xem web như vai đó.', 'Chọn lại vai gốc để làm việc bằng mọi vai.'] }),
    themMan('huong-dan', { id: 'ql-hd-xem-vai', ten: 'Xem vai khác', buoc: ['Trang Hướng dẫn › ô <b>Xem vai</b>: đọc hướng dẫn của GV, TVV, CX, Admin.'] }),
  ],
  luat: [
    ...luatGv('han-cham', 'han-xac-nhan', 'han-ket-qua', 'han-vi-pham', 'dau-gach', 'sos-case', 'nhan-xet'),
    { id: 'ql-han-duyet', ten: 'Hạn trả lời thẻ', buoc: ['<b>5 ngày</b> tính cả ngày gửi.', '<b>Dời lịch thi lần 2</b>: hết Chủ nhật tuần gửi; quá hạn thì phần thi bị huỷ.', '<b>Báo QL</b>: không hạn, tự đóng khi việc gốc xong.'] },
    { id: 'ql-tu-choi', ten: 'Từ chối', buoc: ['Lý do bắt buộc; người gửi đọc được.', 'Từ chối đề xuất PA: việc cũ của GV quay lại kèm lý do.', 'Từ chối Ý thức: vi phạm về <b>Cần xử lý</b>, bậc giữ nguyên.'] },
    { id: 'ql-de-xuat-pa', ten: 'Đề xuất PA khác', buoc: ['GV gửi khi Xác nhận PA hoặc khi PA đang chạy; Case "Chờ duyệt đổi PA".', 'Duyệt: PA mới chạy từ ngày duyệt.', '<b>Xin ý kiến</b>: chỉ trả lời, PA vẫn chạy; câu trả lời ghi vào lịch sử em.'] },
    { id: 'ql-tu-duyet', ten: 'QL tự gửi', buoc: ['Thẻ bạn tự gửi: "Bạn tự gửi · tự duyệt được".', 'Có nhật ký, báo Quản trị.'] },
    { id: 'ql-ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['Chỉ PA quy chế đang chạy; GVCN hoặc QL.', 'Lý do bắt buộc, từ <b>10</b> ký tự; nhật ký PA ghi lại.'] },
    { id: 'ql-chuyen-lop', ten: 'Chuyển lớp + bàn giao', buoc: ['<b>Ngay hôm nay</b>: chuyển ngay, không hoàn tác.', 'Hạn bàn giao = muộn hơn của (ngày quyết định + <b>7 ngày</b>) và mốc cũ.', 'Bàn giao quá hạn không chặn chuyển lớp; QL nhận thẻ Báo QL.'] },
    { id: 'ql-sua-diem', ten: 'Sửa điểm sau hoàn tất', buoc: ['GV vẫn nhập ô trống; sửa hoặc xoá một điểm đã có: chỉ QL.', 'Gỡ "-" lúc nào cũng được.'] },
    { id: 'ql-target', ten: 'Đổi Target', buoc: ['QL, TVV, CX sửa thẳng, ghi <b>Lý do đổi Target</b>.', 'GVCN sửa → thành Đề xuất sửa, QL duyệt rồi mới đổi.', 'Target mới tính từ hôm nay; kỳ vọng các lượt đã thi giữ nguyên.'] },
    { id: 'ql-buoc-tiep', ten: 'Bước tiếp sau thi', buoc: ['Đã thi (từ hôm sau ngày thi) → <b>Cập nhật kết quả thi thật</b>; có kết quả → <b>Chọn bước tiếp</b>. Cùng hạn: ngày thi + <b>7 ngày</b>, <b>Gia hạn</b> được.', 'QL hoặc TVV chọn; GVCN, CX chỉ xem ("Chờ QL / TVV chọn bước tiếp").', 'Lộ trình mới bắt đầu ngay: tuần này là tuần 1; lớp khác thì GV lớp cũ làm phiếu bàn giao.', 'Tạm dừng: đóng lộ trình, mọi hạn dừng; sau này <b>Quay lại học</b> mở Lộ trình mới.'] },
    { id: 'ql-y-thuc-bao', ten: 'Ý thức: QL nhận gì', buoc: ['Cần QL duyệt: WL 3, Meeting CX/GĐCN, Đình chỉ học tạm thời, Khác.', 'Để biết: GVCN xử lý WL 1, Report 4 + Meeting, WL 2.'] },
  ],
  tu: [
    ...HD_GV.tu.filter((x) => x.ten !== 'QL (Quản lý)'),
    { ten: 'Chờ duyệt', nghia: 'Hộp thẻ cần QL quyết: Đề xuất PA, đề xuất sửa, chuyển lớp, dời lịch thi lần 2, Ý thức cần duyệt.' },
    { ten: 'Báo QL', nghia: 'Thẻ để biết (Case / Ý thức / bàn giao quá hạn…): không có nút Duyệt, tự đóng khi việc gốc xong.' },
    { ten: 'Xin ý kiến', nghia: 'GV hỏi QL về PA đang chạy (nút Xin hỗ trợ QL); QL trả lời, PA không đổi.' },
    { ten: 'Đề xuất PA khác', nghia: 'GV muốn PA khác PA quy chế; QL duyệt thì PA mới chạy từ ngày duyệt.' },
    { ten: 'Chốt lộ trình', nghia: 'Việc QL trước Final Test lớp thường: chọn hướng tiếp cho từng em.' },
    { ten: 'Bàn giao', nghia: 'Phiếu lớp cũ ghi về em khi em chuyển lớp: nhận xét chung GVCN + một dòng mỗi môn.' },
    { ten: 'Lưu trữ', nghia: 'Em đã học xong, cất khỏi danh sách đang học; Bỏ lưu trữ được.' },
  ],
};
