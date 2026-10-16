// Sổ TVV & CX (VI) — chung một sổ (chủ SP 16/10). Theo màn / Luật / Thuật ngữ lấy từ shared/huongDan/tvv.ts (CX giống, khác ghi ở khung đầu sổ).
import { themHocVien, taoLop, suaCaLop } from './phu-luc.mjs';
import { bangQuyen } from './quyen.mjs';

export const TVV_CX = {
  ma: 'tvv-cx', lang: 'vi', vai: 'tvv', tenPdf: 'PTA - CONSULTANT & CX MANUAL',
  ten: 'Sổ tay Tư vấn viên & CX', doiTuong: 'Tư vấn viên (TVV) và CX',
  phu: 'Cho Tư vấn viên và CX: theo dõi học viên, thông tin và Target, kết quả thi thật, bước tiếp, tạo lớp và thêm học viên.',
  nho: [
    'Mỗi sáng mở <kbd>Tổng quan</kbd>: bấm một ô số là ra đúng nhóm em.',
    'Em thi xong: kết quả thi thật + bước tiếp trong <b>7 ngày</b> sau ngày thi (<kbd>Gia hạn</kbd> được).',
    'Đổi Target luôn ghi <b>Lý do đổi Target</b>. Điểm, Case, PA: chỉ xem — giáo viên và Quản lý ghi.',
  ],
  khacNhau: `<div class="luat"><b>Khác nhau giữa TVV và CX</b><table>
    <tr><th></th><th>TVV</th><th>CX</th></tr>
    <tr><td>Phạm vi</td><td>Chi nhánh mình (mặc định <b>HV của tôi</b>)</td><td>Mọi chi nhánh</td></tr>
    <tr><td>Bước tiếp sau thi</td><td><b>Chọn</b> (cùng Quản lý)</td><td>Chỉ xem ("Chờ QL / TVV chọn bước tiếp")</td></tr>
    <tr><td>Màn mặc định</td><td>Tổng quan <b>Học viên của tôi</b>; Học viên &amp; Lớp › <b>Cần làm</b></td><td>Tổng quan <b>Số liệu</b>; Học viên &amp; Lớp › <b>Cần chú ý</b></td></tr>
    <tr><td>Tạo lớp</td><td>Chi nhánh mình</td><td>Mọi chi nhánh</td></tr>
  </table>Bước chỉ một vai làm ghi rõ <b>(chỉ TVV)</b> / <b>(chỉ CX)</b>.</div>`,
  gioiThieu: '<p class="luat"><b>Thời gian trên màn</b>Tuần ghi bằng mã tuần: <b>W2 OCT</b> = tuần thứ 2 của tháng 10. Ngày cụ thể chỉ cho hạn, ngày thi, ngày sinh, nhật ký.</p>',
  khung: { id: 'tvv-tong-quan-375', cap: 'TVV trên điện thoại: Tổng quan · Học viên ở thanh dưới' },
  khungChu: '<p>Thanh trên (máy tính) có hai mục: <kbd>Tổng quan</kbd> · <kbd>Học viên &amp; Lớp</kbd>, ô tìm, <kbd>?</kbd>, Thông báo, VI | EN, tài khoản. CX có thêm Kế hoạch Test (chỉ xem).</p>',
  viec: [
    {
      ten: '1. Mở Tổng quan mỗi sáng', ai: 'TVV, CX', han: 'Mỗi ngày',
      o: '<kbd>Tổng quan</kbd> › <b>Học viên của tôi</b> (chỉ TVV) / <b>Số liệu</b> (chỉ CX)',
      anh: { id: 'tvv-tong-quan', chu: ['Cần chú ý: SOS · Case mới · Ý thức.', 'Đã thi · chờ kết quả: hạn 1 tuần sau ngày thi.', 'Chờ chọn bước tiếp: đã có kết quả thi thật.'] },
      buoc: ['Ô: <b>Cần chú ý</b> · <b>Tạm dừng</b> · <b>Sắp thi</b> (6 tuần tới) · <b>Thiếu thông tin</b> · <b>Đã thi · chờ kết quả</b>; có em chờ: <b>Chờ chọn bước tiếp</b>.', 'Bấm một ô: Học viên &amp; Lớp mở sẵn đúng nhóm em.', 'Chưa được gán em nào (chỉ TVV): <b>Xem cả chi nhánh</b>.', 'CX: chọn <b>Chi nhánh</b> (mặc định tất cả); dưới có bốn số học thuật, Điểm đáng chú ý, Lịch sắp tới (chỉ CX).'],
      xong: 'Số trên ô giảm khi việc của em xong (vd nhập kết quả thi → em rời "Đã thi · chờ kết quả").',
      sua: 'Chỉ xem — không có gì để hoàn tác ở màn này.',
      chan: 'TVV không thấy em chi nhánh khác.',
      loi: [['Ô "HV của tôi" trống', 'Em chưa gán TVV là bạn: Sửa thông tin › ô TVV, hoặc xem cả chi nhánh.']],
    },
    {
      ten: '2. Làm việc ở Cần làm / theo dõi Cần chú ý', ai: 'TVV (Cần làm) · CX (Cần chú ý)', han: 'Mỗi ngày',
      o: '<kbd>Học viên &amp; Lớp</kbd> › <kbd>Cần làm</kbd> (chỉ TVV) / <kbd>Cần chú ý</kbd> (chỉ CX)',
      anh: { id: 'tvv-can-lam', chu: ['Phạm vi: HV của tôi · Chi nhánh.', 'Góc nhìn: Tất cả · Đang SOS · Cần làm.'] },
      anhThem: [{ id: 'cx-hoc-vien', cap: 'CX: Cần chú ý, mọi chi nhánh', chu: ['Góc nhìn (mặc định Cần chú ý).', 'Chọn chi nhánh.'] }],
      buoc: ['TVV: <kbd>Cần làm</kbd> gồm <b>Chọn bước tiếp</b> · <b>Kết quả thi</b> · <b>Thiếu thông tin</b>.', 'Bấm dòng: panel một em mở ngay trên trang; làm xong không rời trang.', '<b>Phạm vi</b>: <b>HV của tôi</b> hoặc <b>Chi nhánh</b> (chỉ TVV); CX chọn chi nhánh.', 'Cần xem sâu: mở hồ sơ em.'],
      xong: 'Dòng hết khỏi Cần làm khi việc xong.',
      sua: 'Sửa lại trong hồ sơ em (Sửa thông tin, Kết quả thi thật › Sửa).',
      chan: 'Điểm, Case, PA, Ý thức chỉ xem.',
      loi: [],
    },
    {
      ten: '3. Kết quả thi thật + Bước tiếp', ai: 'Kết quả: TVV, CX (cả GVCN, Quản lý). Bước tiếp: chỉ TVV (và Quản lý)', han: 'Ngày thi + <b>7 ngày</b> cho cả hai; <kbd>Gia hạn</kbd> được',
      o: 'Hồ sơ em › <kbd>Kết quả thi thật</kbd>; sau đó <kbd>Chọn bước tiếp ›</kbd>',
      anh: { id: 'tvv-ho-so-hv', chu: ['"Đã xong · chờ bước tiếp · hạn …" + <kbd>Gia hạn</kbd>.', 'Nút trên đầu hồ sơ: Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi thật · Lịch sử sửa.', '<kbd>Chọn bước tiếp ›</kbd> (chỉ TVV).'] },
      anhThem: [{ id: 'tvv-thi-that', cap: 'Kết quả thi thật' }, { id: 'tvv-buoc-tiep', cap: 'Bước tiếp (chỉ TVV)' }, { id: 'tvv-gia-han', cap: 'Gia hạn: hạn mới + lý do (tuỳ chọn)' }],
      buoc: ['Từ hôm sau ngày thi, em hiện <b>Đã thi · chờ kết quả</b>.', 'Hồ sơ em › <kbd>Kết quả thi thật</kbd>: <b>Ngày thi</b>, điểm L R W S (hoặc <b>Không thi</b>), <kbd>Lưu</kbd>. Nhập được cả khi em đã Lưu trữ.', '(chỉ TVV) Panel <b>Bước tiếp</b> mở ngay: <b>Lộ trình mới</b> (Lớp này / Lớp khác; bắt đầu ngay hoặc hẹn một tuần, Huỷ hẹn được) · <b>Tạm dừng</b> · <b>Thôi học</b>. Làm sau: <kbd>Chọn bước tiếp ›</kbd>.', 'Cần thêm thời gian: <kbd>Gia hạn</kbd> — hạn mới (mặc định +7), lý do tuỳ chọn; <b>Bỏ gia hạn</b> về hạn gốc.'],
      xong: 'Em rời ô "Đã thi · chờ kết quả"; khi có bước tiếp, lộ trình "Đã xong" và việc hết. (chỉ CX): hồ sơ ghi "Chờ QL / TVV chọn bước tiếp" tới khi TVV / QL chọn.',
      sua: 'Kết quả sai: mở lại <kbd>Kết quả thi thật</kbd>, sửa (không dời hạn). Hẹn bắt đầu: <b>Huỷ hẹn</b> tới trước tuần đó.',
      chan: 'Không bị chặn bởi ngày / hạn: nhập kết quả, chọn bước tiếp lúc nào cũng được (quá hạn chỉ hiện đỏ). Lớp khác: chuyển lớp do Quản lý làm.',
      loi: [['Gõ 6,5', 'Ô điểm thi dùng band 0–9 bước 0,5.'], ['Không thấy nút Chọn bước tiếp (CX)', 'Đúng: CX chỉ xem bước tiếp.']],
    },
    {
      ten: '4. Sửa thông tin, Target, Tạm dừng', ai: 'TVV, CX', han: 'Khi có thay đổi',
      o: 'Hồ sơ em › <kbd>Sửa thông tin</kbd> · <kbd>Tạm dừng / Thôi học</kbd>; cả lớp: hồ sơ lớp › tab <kbd>Học viên</kbd> › <kbd>Sửa thông tin</kbd>',
      anh: { id: 'tvv-sua-tt', cap: '' },
      anhThem: [{ id: 'tvv-tam-dung', cap: 'Tạm dừng / Thôi học' }, { id: 'tvv-lich-su', cap: 'Lịch sử sửa' }],
      buoc: ['Một em: <kbd>Sửa thông tin</kbd> — khối Học viên · Liên hệ · Lộ trình đang học (Dự kiến thi, Target). Đổi Target ghi <b>Lý do đổi Target</b>.', 'Cả lớp: hồ sơ lớp › tab <kbd>Học viên</kbd> › <kbd>Sửa thông tin</kbd> (phụ lục C).', 'Gia đình báo nghỉ: <kbd>Tạm dừng / Thôi học</kbd> — chọn tab, <b>Lý do</b>, <b>Có hiệu lực từ</b>.', 'Xem ai sửa gì: <kbd>Lịch sử sửa</kbd> (lọc Thông tin · Target / lộ trình · Trạng thái).'],
      xong: 'Thông báo "Đã lưu"; Lịch sử sửa có dòng mới. Em Tạm dừng: mọi hạn dừng, việc ẩn; hồ sơ có dải vàng + <kbd>Quay lại học</kbd>.',
      sua: 'Sửa lại bằng chính form. Bấm nhầm Tạm dừng: <kbd>Hoàn tác</kbd> ngay trên thông báo, hoặc <kbd>Quay lại học</kbd>.',
      chan: 'TVV / CX không sửa Tuần bắt đầu ("Chỉ Quản lý hoặc GVCN sửa Tuần bắt đầu").',
      loi: [['Đổi Target không ghi lý do', 'Ô Lý do đổi Target bắt buộc.']],
    },
    {
      ten: '5. Tạo lớp, thêm học viên', ai: 'TVV (chi nhánh mình), CX (mọi chi nhánh)', han: 'Khi có lớp / em mới',
      o: '<kbd>Học viên &amp; Lớp</kbd> › <kbd>+ Lớp mới</kbd> · <kbd>+ Học viên</kbd>',
      anh: { id: 'ql-them-hv', cap: 'Thêm học viên: dán từ Excel, xem trước lỗi từng ô', chu: ['Chọn lớp.', 'Ô dán.', 'Web đã đọc thế nào.', 'Ô sai.', 'Trạng thái từng dòng.', 'Thêm các dòng sẵn sàng.'] },
      buoc: ['<kbd>+ Lớp mới</kbd>: một lớp hoặc <kbd>Nhiều lớp</kbd> (tối đa 30); phân công giáo viên do Quản lý làm.', '<kbd>+ Học viên</kbd>: chọn lớp, dán vùng bảng từ Excel / Google Sheets hoặc gõ vào lưới (phụ lục A).', 'Đọc cột Trạng thái: lỗi (đỏ) chặn dòng, lưu ý (vàng) chỉ để biết; "Có thể trùng …" thì dùng Chuyển lớp (nhờ Quản lý), đừng tạo mới.', 'Bấm <kbd>Thêm n học viên</kbd>: dòng đúng được thêm, dòng lỗi ở lại để sửa.'],
      xong: '"✓ Đã thêm n học viên vào {lớp}"; em có lịch MT (FT) / bài Progress, Final (lớp thường).',
      sua: 'Sai thông tin: Sửa thông tin. Nhầm lớp / nhầm em: nhờ Quản lý (Chuyển lớp, Xoá).',
      chan: 'Lớp ngoài phạm vi: "Lớp … nằm ngoài phạm vi bạn được cấp quyền."',
      loi: [['Ngày sinh kiểu tháng/ngày', 'Luôn dd/mm/yyyy; app không đoán.'], ['"-" ở cột Target', 'Nghĩa là KCK (không cam kết) — để trống nếu chỉ là chưa có Target.']],
    },
  ],
  anhMan: {
    'tong-quan': [{ id: 'cx-tong-quan', cap: 'CX: Tổng quan › Số liệu', chu: ['Chi nhánh.', 'Ô số liệu học viên.'] }],
    'ho-so-lop': [{ id: 'tvv-sua-ca-lop', cap: 'Sửa thông tin cả lớp (TVV)' }],
    'ho-so-hv': [{ id: 'tvv-phoi-hop', cap: 'Tab Ý thức &amp; Phối hợp (chỉ xem)', chu: ['Tab Ý thức &amp; Phối hợp.'] }, { id: 'cx-ho-so-hv', cap: 'CX: hồ sơ em đã có kết quả thi — chờ QL / TVV chọn bước tiếp' }],
  },
  bangHan: {
    cot: ['Việc', 'Hạn', 'Ai'],
    hang: [
      ['Cập nhật kết quả thi thật', 'Ngày thi + 7 ngày; Gia hạn được', 'TVV, CX, GVCN, Quản lý'],
      ['Chọn bước tiếp', 'Cùng hạn (ngày thi + 7); kết quả nhập sau hạn → hạn = ngày nhập', 'TVV, Quản lý'],
      ['Hẹn bắt đầu lộ trình mới', 'Huỷ hẹn được tới tuần đó', 'TVV, Quản lý'],
      ['Phối hợp SOS (GVCN làm, TVV / CX xem)', '5 ngày', 'GVCN'],
    ],
  },
  luatThem: '<p class="luat"><b>Ngày thi</b>Ngày thi = ngày đã nhập ở kết quả thi thật, nếu chưa có thì Dự kiến thi; chỉ biết tuần → Chủ nhật tuần đó; chỉ biết tháng → ngày cuối tháng. Sửa ngày thi lúc nào cũng được (hạn tính lại; gia hạn muộn hơn thì giữ).</p>',
  quyen: bangQuyen([1, 2, 3, 4]),
  hoi: [
    ['Em đã thi nhưng chưa có ô "Đã thi · chờ kết quả"?', 'Từ hôm sau ngày thi em mới vào ô. Kiểm Dự kiến thi trong Sửa thông tin.'],
    ['Quá 7 ngày chưa có kết quả thì sao?', 'Hiện quá hạn (đỏ), không chặn gì. Cần thêm thời gian thì <kbd>Gia hạn</kbd>.'],
    ['CX có chọn bước tiếp được không?', 'Không. Bước tiếp do TVV hoặc Quản lý chọn; CX nhập kết quả thi thật được.'],
    ['Phối hợp SOS 2–3 có "Trao đổi ngắn với HV" không?', 'Không còn điền sẵn (chỉ SOS 1); GVCN tự thêm được nếu cần.'],
    ['Thêm học viên bằng file Excel?', 'App không nhận tệp; chọn vùng ô trong Excel, Ctrl + C, rồi dán vào ô dán (phụ lục A).'],
    ['Phân công giáo viên cho lớp mới?', 'Quản lý làm. TVV / CX tạo lớp không có phân công.'],
  ],
  phuLuc: [themHocVien('TVV (chi nhánh mình), CX (mọi chi nhánh), Quản lý, GVCN (lớp chủ nhiệm)'), taoLop('TVV (chi nhánh mình), CX (mọi chi nhánh), Quản lý'), suaCaLop('TVV, CX, Quản lý, GVCN', '<p class="luat"><b>TVV / CX</b>Cột Tuần bắt đầu học bị khoá. Đổi Target được (kể cả KCK), có lý do.</p>')],
};
