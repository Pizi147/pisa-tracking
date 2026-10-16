// Phụ lục "Nhập từ Excel và làm cả lô" — mỗi mục một hàm (anh, thieu) => HTML; sổ nào chọn mục nào ở so.mjs.
// Luật lấy từ mã (đường dẫn trong chú thích từng mục), không đoán. <kbd> = chữ trên app (dung.mjs kiểm có thật).
import { MAU_DAN_FT, MAU_DAN_THUONG } from '../chup/anh-ql.mjs';

const bangExcel = (tsv, sai = {}) => {
  const d = tsv.split('\n').map((x) => x.split('\t'));
  return `<table class="excel"><tr><th></th>${d[0].map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}</tr>${
    d.map((r, i) => `<tr><th>${i + 1}</th>${r.map((c, j) => `<td class="${sai[`${i + 1}${String.fromCharCode(65 + j)}`] ? 'sai' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
};

/* ================================================================ VI */

// server/src/classes/intake.ts (parsePaste, previewIntake, commitIntake) · shared/domain/nhapHocVien.ts · web/src/modules/students/IntakePanel.tsx
export const themHocVien = (ai) => (anh, thieu) => `
<h2>A. Thêm học viên: dán từ Excel / Google Sheets</h2>
<p><b>Ai làm:</b> ${ai}. <b>Làm ở đâu:</b> <kbd>Học viên &amp; Lớp</kbd> › <kbd>+ Học viên</kbd> (điện thoại: trong <kbd>⋯</kbd>), hoặc từ hồ sơ lớp. Panel <b>Thêm học viên</b> mở ngay trên trang.</p>
<p>App <b>không nhận tệp</b> Excel: bạn chọn vùng ô trong Excel / Google Sheets, bấm Ctrl + C, rồi dán (Ctrl + V) vào ô <kbd>Dán vùng bảng từ Excel / Google Sheets</kbd>. Có thể gõ thẳng vào lưới thay vì dán.</p>

<h3>1. Chuẩn bị bảng</h3>
<ul>
  <li><b>Một lô = một lớp.</b> Lớp chọn một lần ở ô <kbd>Thêm vào lớp</kbd> trên đầu panel. Cột "Lớp", "Lộ trình" trong bảng bị bỏ qua (có báo).</li>
  <li><b>Tối đa 200 dòng một lần.</b> Nhiều hơn: chia lô.</li>
  <li><b>Có dòng tiêu đề</b> (nên dùng): cột nhận <b>theo tên</b>, thứ tự tuỳ ý. Tên nhận được: <code>Họ và tên</code> (hoặc Họ tên, Tên, Học viên), <code>Ngày sinh</code>, <code>Email</code>, <code>Overall</code> (hoặc OVR, Điểm đầu vào), <code>L</code> <code>R</code> <code>W</code> <code>S</code> (hoặc Listening…), <code>Target</code>, <code>Dự kiến thi</code> (hoặc Ngày thi), <code>Đã thi tới MT</code>, <code>Tuần bắt đầu</code>. Viết hoa / không dấu đều được. Cột lạ bị bỏ qua và được liệt kê.</li>
  <li><b>Không dòng tiêu đề:</b> web đọc theo <b>mẫu Excel chung</b>, đúng thứ tự 12 cột của Fast Track (bảng dưới). Lớp thường bỏ các cột Overall, L, R, W, S, Đã thi tới MT. Phải chọn lớp trước.</li>
  <li>Web tự đoán dòng đầu là tiêu đề hay học viên. Đoán sai: bấm <kbd>Dòng đầu là học viên?</kbd> / <kbd>Dòng đầu là tiêu đề?</kbd> — không phải dán lại.</li>
</ul>
<table><tr><th>Cột (thứ tự mẫu chung)</th><th>Bắt buộc?</th><th>Cách ghi</th><th>Ô trống / dấu "-"</th></tr>
<tr><td>Họ và tên</td><td>Có</td><td>Họ tên đầy đủ.</td><td>Lỗi "Chưa điền".</td></tr>
<tr><td>Ngày sinh</td><td>Không</td><td><b>dd/mm/yyyy</b> (ví dụ 05/03/2010); d/m/yyyy, dấu . hoặc - cũng được; yyyy-mm-dd được. Từ 1900 tới hôm nay.</td><td>Trống / "-" = chưa có (em vào "Thiếu thông tin").</td></tr>
<tr><td>Email</td><td>Không</td><td>Dạng ten@gmail.com; tự đổi chữ thường.</td><td>Trống / "-" = chưa có.</td></tr>
<tr><td>Overall · L · R · W · S <i>(chỉ FT)</i></td><td>Không</td><td>Band 0–9, bước 0,5 (5.5 hoặc 5,5). W là Writing tổng. Overall là số trên phiếu, không phải trung bình.</td><td>Trống / "-" = chưa có (không phải 0).</td></tr>
<tr><td>Target</td><td>Không</td><td>Band 0–9, bước 0,5 (6.5 hoặc 6,5). Em không cam kết đầu ra: thêm <b>KCK</b> (6.5 KCK).</td><td>Trống = chưa có Target. <b>"-" = KCK</b> (không cam kết).</td></tr>
<tr><td>Dự kiến thi</td><td>Không</td><td>dd/mm/yyyy nếu biết ngày, <b>mm/yyyy</b> nếu mới biết tháng. Từ hôm nay tới 3 năm sau.</td><td>Trống = chưa có.</td></tr>
<tr><td>Đã thi tới MT <i>(chỉ FT)</i></td><td>Không</td><td>Số 0–8: em cũ đã thi ngoài web tới MT mấy — web tạo sẵn các lượt đó là MT cũ để nhập điểm bù.</td><td>Trống = em mới.</td></tr>
<tr><td>Tuần bắt đầu</td><td>Có*</td><td>Một ngày bất kỳ trong tuần (dd/mm/yyyy) → web lấy tuần đó.</td><td>Trống = theo ô <kbd>Tuần bắt đầu học (mặc định cho mọi dòng)</kbd>.</td></tr>
</table>
<p class="luat"><b>Ngày tháng</b>App <b>không đoán</b> tháng / ngày kiểu Mỹ (mm/dd): 03/05/2010 luôn là 3 tháng 5. Thiếu năm (05/03) là lỗi. Ngày không có thật (31/02/2010) báo "Ngày không có thật". Nếu Excel tự đổi ngày sang kiểu khác, định dạng cột ngày là Văn bản (Text) trước khi gõ.</p>

<h3>2. Bảng mẫu</h3>
<p>Mẫu Fast Track có dòng tiêu đề (ô đỏ là chỗ cố tình sai để thấy bước xem trước báo lỗi):</p>
${bangExcel(MAU_DAN_FT, { '4B': 1, '4C': 1, '5D': 1 })}
<p>Mẫu lớp thường, <b>không dòng tiêu đề</b> (giữ đủ 12 cột theo mẫu chung; cột band để trống):</p>
${bangExcel(MAU_DAN_THUONG)}

<h3>3. Dán và đọc bước xem trước</h3>
${anh('vi', { id: 'ql-them-hv', cap: 'Thêm học viên vào MB FT 101 sau khi dán bảng mẫu', chu: [
  'Chọn lớp trước: cả lô vào lớp này; lớp quyết định bộ cột.', 'Dán vào đây; nút <kbd>Đọc nội dung đã dán</kbd> nằm dưới ô.',
  'Web nói đã đọc thế nào (theo tiêu đề hay mẫu chung) + nút đổi cách đọc.', 'Ô sai viền đỏ; ô cần để ý viền vàng.',
  'Cột Trạng thái: "n lỗi · n lưu ý" — bấm để mở dòng giải thích.', 'Nút ghi số dòng sẵn sàng: chỉ dòng không lỗi được thêm.'] }, thieu)}
<ul>
  <li>Xem trước <b>tự chạy</b> khi bạn dán hoặc gõ xong; không cần bấm gì. Chưa có gì được lưu.</li>
  <li><b>Lỗi</b> (đỏ) chặn dòng đó. <b>Lưu ý</b> (vàng) chỉ để biết, dòng vẫn thêm được.</li>
  <li>Chân panel: "n dòng sẵn sàng · n dòng cần sửa" — bấm "n dòng cần sửa" để nhảy tới dòng lỗi.</li>
  <li>Sửa ngay trên lưới; xem trước chạy lại. Dòng không cần: mở dòng giải thích › <kbd>Xoá dòng này</kbd>.</li>
</ul>
${anh('vi', { id: 'ql-them-hv-trung', cap: 'Mở một dòng: gợi ý trùng hồ sơ và MT cũ', chu: ['Lưu ý trùng tên + ngày sinh với em đã có (mã PISA-…), và MT nào sẽ là MT cũ.'] }, thieu)}
<p class="luu-y"><b>Gợi ý trùng hồ sơ</b>Web <b>không tự gộp</b>. Thấy "Có thể trùng …": nếu đúng là em đó (đã có hồ sơ), <b>xoá dòng</b> và dùng <kbd>Chuyển lớp…</kbd> trên hồ sơ em — tạo mới sẽ tách lịch sử của em làm hai. Nếu chỉ trùng tên (người khác), cứ thêm.</p>
${anh('vi', { id: 'ql-them-hv-thuong', cap: 'Lớp thường, dán không dòng tiêu đề', chu: ['"Đã đọc theo mẫu Excel chung …" và cột bị bỏ qua; "3 cột cuối để trống" khi dòng ngắn hơn mẫu.', 'Đổi cách đọc nếu dòng đầu thật ra là tiêu đề.'] }, thieu)}

<h3>4. Lưu, lô lỗi một phần, kiểm lại</h3>
<ul>
  <li>Bấm <kbd>Thêm n học viên</kbd>. <b>Dòng lỗi bị bỏ qua, dòng đúng vẫn lưu.</b> Panel ở lại: dòng đã thêm biến mất, dòng lỗi còn lại để sửa rồi bấm thêm lần nữa.</li>
  <li>Xong thấy: "✓ Đã thêm n học viên vào {lớp}" · "đã lên lịch MT cho n em" (FT). Có MT cũ chưa điểm: dòng "n MT cũ chưa có điểm" + link <kbd>Nhập điểm MT cũ</kbd>; link <kbd>Mở hồ sơ lớp</kbd> để kiểm.</li>
  <li>Bấm hai lần hoặc mạng chập rồi bấm lại: web <b>không tạo trùng</b> (một lần gửi chỉ ghi một lần).</li>
  <li>Lớp FT: lịch MT tự tạo theo tuần bắt đầu; MT đã qua ≥ 2 tuần thành MT cũ (nhập điểm bù). Lớp thường: tự có bài Progress / Final theo mốc của lớp.</li>
</ul>
<h3>5. Làm sai thì sửa thế nào</h3>
<ul>
  <li>Sai thông tin (tên, ngày sinh, Target…): hồ sơ em › <kbd>Sửa thông tin</kbd>, hoặc cả lớp: hồ sơ lớp › tab Học viên › <kbd>Sửa thông tin</kbd> (mục C).</li>
  <li>Thêm nhầm lớp: hồ sơ em › <kbd>⋯</kbd> › <kbd>Chuyển lớp…</kbd> (Quản lý).</li>
  <li>Thêm nhầm cả em (không phải học viên): Quản lý xoá — hồ sơ lớp › <kbd>Chọn nhiều học viên</kbd> › <kbd>Xoá</kbd> (gõ XOÁ để xác nhận, không hoàn tác).</li>
  <li>Đóng panel khi còn chữ chưa thêm: web hỏi trước (<kbd>Huỷ thay đổi</kbd>).</li>
</ul>
<table class="loi-hay"><tr><th>Lỗi hay gặp (chữ trên app)</th><th>Cách sửa</th></tr>
<tr><td>Gõ dạng dd/mm/yyyy</td><td>Gõ đủ ngày/tháng/năm 4 số, ví dụ 05/03/2010.</td></tr>
<tr><td>Ngày không có thật</td><td>Kiểm ngày/tháng (31/02, 31/04…); có thể bảng gốc đảo ngày–tháng.</td></tr>
<tr><td>Gõ band 0–9, bước 0,5 — ví dụ 5.5</td><td>Band chỉ .0 hoặc .5 (5.3 → 5.5 hoặc 5.0).</td></tr>
<tr><td>Chưa đúng dạng email, ví dụ an.nguyen@gmail.com</td><td>Thiếu đuôi .com / @; hoặc để trống.</td></tr>
<tr><td>Dòng tiêu đề chưa có cột "Họ và tên"</td><td>Đổi tên cột họ tên thành "Họ và tên", hoặc bấm <kbd>Dòng đầu là học viên?</kbd>.</td></tr>
<tr><td>Chọn lớp trước khi dán dữ liệu không có dòng tiêu đề …</td><td>Chọn lớp ở ô <kbd>Thêm vào lớp</kbd> rồi dán lại.</td></tr>
<tr><td>Mỗi dòng dư n ô ở cuối — đã bỏ</td><td>Bảng có cột thừa: kiểm lại thứ tự cột hoặc thêm dòng tiêu đề.</td></tr>
<tr><td>Học từ W1 JUN — 2 MT sẽ là MT cũ</td><td>Lưu ý: em vào muộn. Đổi <b>Tuần bắt đầu</b> về tuần em học thật nếu cần.</td></tr>
<tr><td>Tối đa 200 học viên một lần thêm.</td><td>Chia bảng thành nhiều lô.</td></tr>
<tr><td>Lớp … nằm ngoài phạm vi bạn được cấp quyền.</td><td>Chọn lớp chi nhánh / lớp chủ nhiệm của bạn, hoặc nhờ Quản lý.</td></tr>
</table>`;

// web/src/modules/classes/LuoiTaoLop.tsx · server/src/classes/intake.ts (taoLopHangLoat) · shared/domain/tenLop.ts
export const taoLop = (ai) => (anh, thieu) => `
<h2>B. Tạo nhiều lớp một lần</h2>
<p><b>Ai làm:</b> ${ai}. <b>Làm ở đâu:</b> <kbd>Học viên &amp; Lớp</kbd> › <kbd>+ Lớp mới</kbd> › chọn <kbd>Nhiều lớp</kbd>. Không dán Excel: mỗi lớp một dòng trên lưới.</p>
${anh('vi', { id: 'ql-tao-lop', cap: 'Tạo nhiều lớp' }, thieu)}
<ul>
  <li>Mỗi dòng: <b>Chi nhánh</b> · <b>Chương trình</b> · <b>Lộ trình</b> (chỉ FT: LT1, LT2, RF) · <b>Số lớp</b> · <b>Tuần khai giảng</b> (bắt buộc với lớp thường) · phân công GV (tuỳ chọn; TVV / CX không phân công).</li>
  <li>Tên lớp web tự ghép: <code>{mã chi nhánh} {ký hiệu} {số}</code>, ví dụ MB FT 105. Bạn chỉ gõ <b>số lớp</b>: 1–4 chữ số, có thể thêm một chữ cái cuối (101A).</li>
  <li><kbd>+ Thêm n dòng giống dòng trên</kbd>: chép cả dòng, số tự tăng. <b>Tối đa 30 lớp một lần.</b></li>
  <li><kbd>Kiểm tra</kbd> xem trước tên sẽ tạo, không lưu. <kbd>Tạo n lớp</kbd>: <b>tất cả hoặc không lớp nào</b> — một dòng lỗi thì chưa lớp nào được tạo; sửa ô viền đỏ rồi bấm lại.</li>
  <li>Xong: "Đã tạo n lớp". Tạo nhầm: không có hoàn tác — đổi thông tin ở hồ sơ lớp; xoá lớp chỉ Quản trị hệ thống.</li>
</ul>
<table class="loi-hay"><tr><th>Lỗi hay gặp</th><th>Cách sửa</th></tr>
<tr><td>Đã có lớp … / Trùng tên … với dòng …</td><td>Đổi số lớp (so không phân biệt hoa thường, dấu cách, gạch ngang).</td></tr>
<tr><td>Chỉ gõ số (1–4 chữ số), có thể thêm một chữ cái cuối, ví dụ 101A</td><td>Bỏ mã chi nhánh / chữ FT khỏi ô số.</td></tr>
<tr><td>Chọn tuần khai giảng …</td><td>Lớp thường cần tuần khai giảng (mốc Progress / Final đếm từ đây).</td></tr>
</table>`;

// web/src/modules/students/SuaCaLopPanel.tsx · server/src/classes/suaCaLop.ts
export const suaCaLop = (ai, ghi = '') => (anh, thieu) => `
<h2>C. Sửa thông tin cả lớp</h2>
<p><b>Ai làm:</b> ${ai}. <b>Làm ở đâu:</b> hồ sơ lớp › tab <kbd>Học viên</kbd> › <kbd>Sửa thông tin</kbd> (hoặc <kbd>⋯</kbd> › <kbd>Sửa thông tin học viên</kbd>). Lưới giống Thêm học viên nhưng <b>không dán Excel</b>.</p>
${anh('vi', { id: 'ql-sua-ca-lop', cap: 'Sửa thông tin học viên · cả lớp' }, thieu)}
<ul>
  <li>Một hàng một em đang học (A → Z). Cột: Họ và tên · Ngày sinh · Email · TVV · liên hệ (QL, TVV, CX) · Tuần bắt đầu học · Dự kiến thi · Target · Điểm đầu vào (chỉ FT).</li>
  <li>Ngày: <b>dd/mm/yyyy</b> như mục A; Dự kiến thi nhận cả mm/yyyy. Target nhận 6,5 hoặc 6.5, thêm KCK.</li>
  <li><b>Ô không đụng tới: giữ nguyên.</b> Xoá trắng ô đang có giá trị = xoá giá trị đó (trừ Họ tên, Tuần bắt đầu: bắt buộc).</li>
  <li>Đổi Target ít nhất một em → hiện ô bắt buộc <b>Lý do đổi Target</b> (một lý do chung cho cả lô).</li>
  <li>Mỗi ô đã sửa có nút ↺ để về giá trị cũ trước khi lưu. Còn lỗi thì nút lưu tắt.</li>
  <li>Tối đa 60 em một lần. Web lưu từng nhóm 8 em; nhóm lỗi dừng lại, nhóm trước vẫn giữ: chân panel "Đã lưu x em · y em chưa lưu" — sửa rồi bấm lưu lại.</li>
  <li>Xong: "Đã cập nhật n học viên", panel đóng. Sửa lại: mở lại panel. Lịch sử sửa của em ghi "Sửa cả lớp {lớp}".</li>
</ul>${ghi}`;

// web/src/modules/test/keHoach/NganXepLichMt.tsx, NganXepHangLoat.tsx · server/src/keHoach/keHoachTest.ts
export const xepLich = (ai) => (anh, thieu) => `
<h2>D. Xếp lịch Test nhiều em / nhiều lớp</h2>
<p><b>Ai làm:</b> ${ai}. <b>Làm ở đâu:</b> <kbd>Test</kbd> › <kbd>Kế hoạch Test</kbd> › <kbd>Xếp nhiều MT…</kbd> (Fast Track) hoặc <kbd>Xếp lịch Test…</kbd> (Lớp thường).</p>
${anh('vi', { id: 'ql-xep-nhieu-mt', cap: 'Xếp lịch Mock Test nhiều lớp' }, thieu)}
<ul>
  <li><b>FT:</b> chọn nhiều lớp → 1 Đợt (MT1…) → 2 Tuần và kỹ năng (một tuần chung, hoặc <kbd>Lịch riêng ▸</kbd> từng kỹ năng) → 3 Học viên. Nút <b>Xếp lịch n em · n bài</b>.</li>
  <li><b>Lớp thường:</b> một lớp mỗi lần; chọn Đợt (Progress / Final Test), học viên, môn kèm tuần. Nút <b>Lưu lịch cho n em · n bài</b>.</li>
  <li>Xem trước tự chạy (không lưu): cột Ghi chú ghi Mới · Đổi · Giữ · Cảnh báo · Chặn. Bài có cảnh báo chỉ lưu khi tick <kbd>Vẫn xếp n bài có cảnh báo</kbd>.</li>
  <li><b>Tối đa 500 em một lần.</b> Lưu theo từng em: em có bài bị chặn thì cả em đó không lưu, em khác vẫn lưu. Panel ở lại với các em lỗi, tick sẵn, để sửa tuần rồi lưu lại.</li>
  <li>Xong: "Đã xếp n em" hoặc "Đã xếp n em, còn m em lỗi.". Không có hoàn tác: xếp lại hoặc dời từng bài.</li>
</ul>`;

// web/src/modules/students/XemTruocHangLoatPanel.tsx · server/src/students/hangLoat.ts
export const chonNhieu = () => (anh, thieu) => `
<h2>E. Chọn nhiều học viên: Kết thúc học · Lưu trữ · Huỷ chuyển lớp · Xoá</h2>
<p><b>Ai làm:</b> Quản lý (và Quản trị). <b>Làm ở đâu:</b> hồ sơ lớp › tab Học viên › Cách xem <kbd>Tổng hợp</kbd> › <kbd>Chọn nhiều học viên</kbd>; trang <kbd>Lưu trữ</kbd> có <kbd>Bỏ lưu trữ</kbd> · <kbd>Học lại</kbd>.</p>
${anh('vi', { id: 'ql-chon-nhieu', cap: 'Xem trước "Kết thúc học · 2 học viên"' }, thieu)}
<ul>
  <li>Tick em → thanh dưới: <kbd>Lưu trữ</kbd> · <kbd>Kết thúc học</kbd> · <kbd>Huỷ chuyển lớp</kbd> · <kbd>Xoá</kbd>. Bấm một việc mở <b>xem trước</b>: số em làm được, số Case đóng / PA huỷ, danh sách em bị bỏ qua kèm lý do (vd "Chưa kết thúc học").</li>
  <li>Kết thúc học, Huỷ chuyển lớp: <b>lý do bắt buộc</b>. Lưu trữ: chỉ em đã Kết thúc học. Xoá: xoá hẳn hồ sơ và mọi dữ liệu, phải gõ <b>XOÁ</b>, không hoàn tác.</li>
  <li>Tối đa 200 em. Mỗi em một lần ghi: em lỗi không làm hỏng em khác; panel ghi "Đã lưu x học viên · y học viên chưa lưu" + nút <b>Thử lại n học viên</b>.</li>
  <li><b>Hoàn tác:</b> thông báo sau khi làm có nút <kbd>Hoàn tác</kbd> (Kết thúc học, Lưu trữ, Huỷ chuyển lớp → khôi phục trong 24 giờ). Xoá không hoàn tác.</li>
</ul>`;

// web/src/modules/duyet/HopChoDuyet.tsx · shared/domain/yeuCauDuyet.ts
export const duyetNhieu = () => (anh, thieu) => `
<h2>F. Duyệt / từ chối nhiều thẻ</h2>
<p><b>Ai làm:</b> Quản lý. <b>Làm ở đâu:</b> <kbd>Công việc</kbd> › <kbd>Chờ duyệt</kbd>: đánh dấu ô nhỏ ở đầu thẻ.</p>
${anh('vi', { id: 'ql-duyet-nhieu', cap: 'Thanh chọn nhiều ở Chờ duyệt', chu: ['Nút duyệt cả lô (cùng một loại).'] }, thieu)}
<ul>
  <li>Chỉ hai loại duyệt nhiều được: <b>Đề xuất PA</b> và <b>Dời lịch thi lần 2</b>; mỗi lần một loại. Tối đa 50 thẻ.</li>
  <li><kbd>Duyệt n yêu cầu</kbd> hoặc <kbd>Từ chối n…</kbd> (lý do bắt buộc, người gửi đọc được). Mỗi thẻ ghi riêng: thẻ lỗi báo riêng ("Đã duyệt 8/10 — 2 đã có người xử lý…"), thẻ khác vẫn xong.</li>
  <li>Sửa sai: thẻ đã xử lý có <kbd>Huỷ quyết định</kbd> — chỉ Đề xuất PA, trong cùng ngày.</li>
</ul>`;

// web/src/modules/classes/BangLoTrinhTiep.tsx · TransitionPanel.tsx · shared/domain/chuyenLop.ts
export const loTrinh = () => (anh, thieu) => `
<h2>G. Lộ trình tiếp theo cả lớp (lớp thường) · Chuyển tiếp lớp</h2>
<p><b>Ai làm:</b> Quản lý. <b>Làm ở đâu:</b> hồ sơ lớp › Cách xem <kbd>Lộ trình tiếp theo</kbd>; dải trên đầu hồ sơ › <kbd>Chốt lộ trình</kbd>.</p>
${anh('vi', { id: 'ql-lo-trinh-tiep', cap: 'Lộ trình tiếp theo · MB Pre FOU 03' }, thieu)}
<ul>
  <li>Tick nhiều em, chọn một <b>Hướng</b> (Lên lớp kế, Lên FT, Học lại, Tạm dừng học, Dừng học hẳn) + lớp chuyển đến + tuần bắt đầu cho cả nhóm.</li>
  <li><kbd>Lưu nháp</kbd>: chưa có lệnh, chưa ai được báo; tối đa 60 em; dòng sai báo lý do, dòng đúng vẫn lưu.</li>
  <li><b>Chốt n em</b>; tuần "Ngay hôm nay" → <b>Chuyển ngay · n em</b> (không hoàn tác). Lên FT cần Target (hoặc KCK). Khác gợi ý của hệ thống cần lý do ngắn.</li>
  <li>Sửa sai: <kbd>Huỷ quyết định</kbd> (lý do bắt buộc), <kbd>Khôi phục quyết định</kbd>. Chuyển ngay thì không hoàn tác.</li>
</ul>`;

// web/src/modules/congViec/XacNhanPaLo.tsx · server/src/cases/sosAuto.ts
export const xacNhanPaLo = () => (anh, thieu) => `
<h2>H. Xác nhận PA cùng lúc</h2>
<p><b>Ai làm:</b> GVBM đúng kỹ năng (Quản lý làm thay được). <b>Làm ở đâu:</b> <kbd>Công việc</kbd>, dòng gộp "n em" (cùng lớp, cùng tuần thi, cùng mức SOS) → panel <b>Xác nhận PA cùng lúc</b>.</p>
<ul>
  <li>Em tick sẵn, bỏ tick em chưa muốn làm. <b>Nội dung / hướng dẫn</b> (từ 15 ký tự), <b>Bắt đầu</b> (mặc định hôm nay; lùi tối đa 7 ngày), <b>Người dạy</b>, <b>Số buổi / 2 tuần</b> (Tutor) ghi một lần cho cả nhóm.</li>
  <li><kbd>Sửa riêng</kbd>: một em khác ngày / người dạy / nội dung — giá trị riêng thắng giá trị chung.</li>
  <li>Bấm <b>Xác nhận PA · n em</b>. Mỗi PA ghi riêng: em xong gập lại "✓ Đã xác nhận n em"; em lỗi lên đầu kèm "⚠ lý do", vẫn tick để thử lại (<b>Thử lại · n em</b>).</li>
  <li>Sau khi xác nhận: sửa từng PA ở Case, hoặc <kbd>Đề xuất PA khác…</kbd> (Quản lý duyệt).</li>
</ul>
<table class="loi-hay"><tr><th>Lỗi hay gặp</th><th>Cách sửa</th></tr>
<tr><td>Mô tả PA cần ít nhất 15 ký tự …</td><td>Ghi hướng dẫn, trọng tâm, ai thực hiện.</td></tr>
<tr><td>Chọn người dạy rồi mới xác nhận PA.</td><td>Điền ô Người dạy chung hoặc Sửa riêng.</td></tr>
<tr><td>Xác nhận Case trước, rồi mới xác nhận PA.</td><td>Mở Case, xác nhận nguyên nhân trước.</td></tr>
</table>`;

// web/src/modules/yThuc/RecordViolationPanel.tsx · ClassYThucCard.tsx · server/src/yThuc/lo.ts
export const viPhamLo = () => (anh, thieu) => `
<h2>I. Ghi vi phạm nhiều em · làm nhiều vi phạm một lần</h2>
<p><b>Ai làm:</b> GV dạy lớp, GVCN, Quản lý. <b>Làm ở đâu:</b> hồ sơ lớp › tab <kbd>Ý thức &amp; Phối hợp</kbd> › <kbd>+ Ghi vi phạm</kbd>; một em: dòng em › <kbd>⋯</kbd> › <kbd>+ Ghi vi phạm</kbd>.</p>
${anh('vi', { id: 'gv-vi-pham', cap: 'Ghi vi phạm' }, thieu)}
<ul>
  <li>Hai kiểu: <b>nhiều em, một vi phạm chung</b> (chọn em hoặc "Cả lớp", tối đa 60 em) — hoặc <b>một em, tới 10 vi phạm</b> (<kbd>+ Thêm vi phạm</kbd>). Không trộn hai kiểu.</li>
  <li>Bắt buộc: <b>Ngày</b> (không ở tương lai), <b>Nhóm</b> (Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác), <b>Vi phạm</b> (3–60 ký tự). Mô tả, bằng chứng: không bắt buộc.</li>
  <li>Lưu theo từng em: em lỗi không làm hỏng em khác; panel ghi "Đã lưu n học viên · m học viên chưa lưu" + <b>Thử lại</b>.</li>
  <li>Xong: "Đã ghi vi phạm cho n học viên". Ghi sai: mở vi phạm › <b>Sửa vi phạm</b> / <b>Xoá vi phạm</b> (người ghi, GVCN của lớp, Quản lý).</li>
  <li>GVCN: tab Ý thức › <kbd>Chọn nhiều</kbd> → <b>Xác nhận xử lý · n</b> · <b>Ghi nhận · n</b> · <b>Xác nhận cấp bậc · n</b>; Ghi nhận có <kbd>Hoàn tác</kbd> ngay.</li>
</ul>`;

// web/src/modules/cham/LuoiFT.tsx, LuoiThuong.tsx · web/src/modules/fasttrack/HopNhapDiem.tsx · shared/domain/chamDiem.ts · server/src/normal/regular.ts
export const luoiDiem = (thuong = true) => (anh, thieu) => `
<h2>J. Lưới nhập điểm: không dán từ Excel</h2>
<p class="luu-y"><b>Không dán nhiều ô</b>Lưới điểm <b>không nhận dán vùng ô từ Excel</b>: dán vào một ô thì cả chuỗi vào ô đó và báo sai dạng. Gõ từng ô; Enter / <kbd>Lưu · em tiếp ›</kbd> sang em kế cùng cột.</p>
${anh('vi', { id: 'gv-o-diem', cap: 'Hộp nhập điểm Listening (FT)', chu: ['Số câu đúng / 40 (số nguyên) — web tự đổi ra band. Gõ band thì có dấu chấm (6.5) hoặc b6.', 'Nhận xét: bắt buộc với ô MT có điểm (từ 10 ký tự).', 'Lưu rồi sang em kế.'] }, thieu)}
<table><tr><th>Ô</th><th>Gõ gì</th><th>Lưu ý</th></tr>
<tr><td>FT · Listening, Reading</td><td>Số câu đúng 0–40, hoặc band 0–9 bước 0,5 có dấu chấm (6.5, 6.0) / "b6"</td><td><b>Dùng dấu chấm</b>: 6,5 bị báo sai.</td></tr>
<tr><td>FT · Writing 1, 2, Speaking</td><td>Bốn tiêu chí, mỗi ô 0–9 bước 0,5 — band tự tính</td><td>Band gõ thẳng chỉ cho MT cũ, MT0.</td></tr>
${thuong ? '<tr><td>Lớp thường</td><td>Số câu đúng / tổng số câu (hai số nguyên)</td><td>Đầu cột có ô tổng + <kbd>Điền cả cột</kbd> cho ô còn trống tổng. Đạt từ 70 %.</td></tr>' : ''}
<tr><td>Dấu "-"</td><td>Em không làm bài (không phải 0)</td><td>Trong tuần thi: vắng. Nhập bù / MT cũ: Không dự thi. Xoá "-" = hết vắng, lúc nào cũng được.</td></tr>
<tr><td>Xoá trắng ô có điểm</td><td>= xoá điểm</td><td>Ô <b>Lý do sửa (tuỳ chọn)</b>; lớp đã kết thúc thì bắt buộc.</td></tr>
</table>
<p class="luat"><b>Sau khi đợt hoàn tất</b>Đợt đủ điểm và qua Chủ nhật tuần bắt buộc là hoàn tất. Ô còn trống: GV đúng môn vẫn nhập được. Sửa / xoá điểm đã có: chỉ Quản lý, Admin chi nhánh (MT cũ: thêm GVCN) — GV nhờ Quản lý.</p>`;

/* ================================================================ EN (sổ GV nước ngoài: chỉ phần GV dùng) */

export const xacNhanPaLoEn = () => () => `
<h2>A. Confirm PA for several students</h2>
<p><b>Who:</b> the subject teacher of that skill (a Head can do it too). <b>Where:</b> <kbd>Tasks</kbd>, a grouped row "n students" (same class, same test week, same SOS level).</p>
<ul>
  <li>Students are ticked already; untick anyone you want to leave. Write the content (15+ characters), the start date (today by default; up to 7 days back) and the teacher once for the whole group.</li>
  <li>Need something different for one student? Use the per-student edit — it wins over the shared values.</li>
  <li>Each PA is saved on its own: done students fold into "✓ Confirmed n students"; a failed student moves to the top with "⚠ reason" and stays ticked so you can try again.</li>
  <li>After confirming: change a PA from the Case, or send a different PA to the Head for approval.</li>
</ul>`;

export const viPhamLoEn = () => (anh, thieu) => `
<h2>B. Log an incident for several students</h2>
<p><b>Who:</b> any teacher of the class, the form teacher, the Head. <b>Where:</b> class profile › Conduct tab, or a student row › <kbd>⋯</kbd>.</p>
<ul>
  <li>Two ways: <b>many students, one incident</b> (up to 60) — or <b>one student, up to 10 incidents</b>. You cannot mix them.</li>
  <li>Required: date (not in the future), group, incident (3–60 characters). Description and evidence are optional.</li>
  <li>Saved student by student: one failure does not undo the others; the panel shows who is not saved yet and a retry button.</li>
  <li>Logged by mistake: open the incident › edit or delete (the person who logged it, the form teacher, the Head).</li>
</ul>`;

export const luoiDiemEn = () => (anh, thieu) => `
<h2>C. Score grid: no pasting from Excel</h2>
<p class="luu-y"><b>One cell at a time</b>The score grid <b>does not accept a pasted block of cells</b>. Type each score; Enter or <kbd>Save · next ›</kbd> moves to the next student in the same column.</p>
${anh('en', { id: 'gv-o-diem', cap: 'Listening score box (Fast Track)', chu: ['Correct answers out of 40 (whole number) — the band is worked out. To type a band, use a dot (6.5) or b6.', 'Comment: required for every MT score (10+ characters).', 'Save and go to the next student.'] }, thieu)}
<table><tr><th>Cell</th><th>Type</th><th>Note</th></tr>
<tr><td>Listening, Reading</td><td>Correct answers 0–40, or a band 0–9 in steps of 0.5 with a dot (6.5) / "b6"</td><td><b>Use a dot</b>: 6,5 is rejected.</td></tr>
<tr><td>Writing 1, 2, Speaking</td><td>Four criteria, each 0–9 in steps of 0.5 — the band is worked out</td><td>A typed band is only for old MTs and MT0.</td></tr>
<tr><td>"-"</td><td>The student did not sit the test (not 0)</td><td>In the test week: absent. Late entry / old MT: did not sit. Delete the "-" to remove the absence, any time.</td></tr>
<tr><td>Clear a cell that has a score</td><td>= delete the score</td><td>Reason is optional.</td></tr>
</table>
<p class="luat"><b>After a round is complete</b>Empty cells: the teacher of that skill can still enter them. To change or delete an existing score, ask the Head.</p>`;
