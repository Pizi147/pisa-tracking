# Đề bài mockup ② ③ ④ ⑤ (overhaul V6)

PTA Overhaul · 14/11. Mỗi mockup một session Opus 5.5 do PTA Overhaul giao (lời 15). Chủ SP duyệt từng mockup trước khi code.
Đọc trước, cho MỌI mockup: `loi-chu-sp.md` (nhất là lời 4–7, 12–17) · `04-thiet-ke.md` (mục 2, 3, 5, 12) · `luat/0-luat-core-mot-trang.md` · `luat/5-y-do-thiet-ke-gan-day.md` (mục 2 "phải giữ", mục 3 "ngôn ngữ thao tác", mục 5 "đã bị bác") · **mockup ① đã duyệt `thiet-ke/v21/trang-dau-gv.html` + `v21.css` + ghi chú** (ngôn ngữ chuẩn của đợt này: dòng việc, nút-chip "Việc cần làm", panel, **dòng quy chế**, nút "+ Task", hộp nhập gọn) · `DESIGN.md` Luật V5 + Luật 21/10 · `CLAUDE.md`.

## Luật chung cho cả bốn mockup

- **Nâng cấp màn đang có, không dựng lại.** Mỗi màn có mockup nền đã duyệt (ghi ở từng mục) — giữ bố cục, hình ảnh, thao tác của nền; chỉ đổi đúng những điều đề bài nêu. Chạy web thật (`npm run seed` rồi `npm run dev`, tài khoản demo) để xem màn hiện tại trước khi vẽ.
- Mỗi mockup: `thiet-ke/v21/<tên>.html` + `<tên>-ghi-chu.md` (bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU có dòng GIỮ / BỎ · bảng thao tác TRƯỚC → SAU của màn · [XM] · bảng tự rà từng dòng R) + ảnh từng khung Tối / Sáng ở `thiet-ke/v21/anh/<tên>/`. Dùng `v21.css` (CHỈ ĐỌC — không sửa; cần thêm thì viết `<tên>.css` riêng).
- 1440 + 375, Sáng + Tối, đủ trạng thái (rỗng, đang tải, lỗi, không có quyền). Chữ trong khung web ngắn, đúng thuật ngữ; không chú thích tĩnh (trừ dòng quy chế); ghi chú cho người duyệt đặt ngoài khung. Tên người bịa. Không thêm thành phần đề bài không yêu cầu.
- Mọi ô chọn người / lớp / học viên vẽ theo mẫu **"ô chọn có tìm"** (mockup ⑤, R5.x): gõ để tìm + danh sách thả, mục liên quan đứng trước.
- Xong: mở PR chỉ gồm tệp trong `thiet-ke/v21/`, tiêu đề "mockup v21: … — chờ chủ SP duyệt", KHÔNG merge; nhắn session "PTA Overhaul" kèm số PR, bảng tự rà, [XM]. PTA Overhaul rà theo đề bài rồi gửi chủ SP.

## ② Hồ sơ lớp — `thiet-ke/v21/ho-so-lop.html`

Nền: `thiet-ke/v8/ho-so-lop.html` · `thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html` · `thiet-ke/v19/y-thuc.html` · `thiet-ke/v20/tinh-hinh.html` · `thiet-ke/v15/bao-cao-ph.html` · `thiet-ke/2026-11-08-hsl-thuong.html`. Mã: `web/src/modules/classes/` (ClassOverviewPage, DauTrangLop, BangHoSoLop, ThanhViecLop).
Vai vẽ: GVCN dạy L + R (chính) · GV bộ môn không chủ nhiệm · QL (một khung đầu trang).
- R2.1 Đầu trang gọn còn **2 hàng**: hàng 1 mã lớp + chip (FT · sĩ số · tuần) + nút; hàng 2 GV theo kỹ năng thu gọn một dòng (GVCN · L·R · S · W1 · W2 · TVV), bấm mở đầy đủ. Các chỉ số (Lượt mới nhất · Đạt MT · SOS) thành một dải mỏng cùng hàng 2 hoặc ngay dưới — không mất số nào.
- R2.2 Nút đầu trang: **"+ Task"** (Case · Vi phạm / Nhắc nhở · Tình hình học tập — điền sẵn lớp, chọn em trong lớp) + "⋯". Nút **"Nhập điểm" chỉ hiện với người có ô để nhập ở lớp này** (GV dạy kỹ năng) hoặc có quyền nhập hộ (QL, Admin); GVCN không dạy kỹ năng nào: không có nút.
- R2.3 Dải **"Việc cần làm"** (thay tên "Việc của tôi") dùng đúng nút-chip + dòng việc của mockup ①; bấm = mở panel việc tại trang. Không lặp lối tắt "+n việc ở Công việc".
- R2.4 Giữ nguyên: 4 tab (Học viên · Ý thức & Phối hợp · Phân tích lớp · Báo cáo PH), bảng Học viên (Tổng hợp / Kết quả đầu ra / Thông tin lớp, lọc SOS, cột điểm ✓ ✗), ⋯ dòng em (đổi "+ Case", "+ Ghi vi phạm" thành nhóm "+ Task" 3 mục cùng thứ tự), khối gập "Điểm Mock Test của lớp", Trước / Sau lớp.
- R2.5 Tab Báo cáo PH: khi đợt đang mở, đầu tab ghi "Tháng 9 · hạn 30/09 · bạn còn 21 / 33 em" (lớp thường: "Progress W3 SEP · hạn 22/09"); đợt QL thêm có ngày mở tương lai ghi "sắp mở {ngày}".
- R2.6 Lớp có em đã chuyển còn bổ trợ: khối gập "Đã chuyển · đang bổ trợ · n em" dưới bảng (theo `docs/superpowers/specs/2026-11-13-gv-cu-bo-tro-design.md`).
- R2.7 Lớp thường (FOU): cùng khung, cột điểm theo môn của chương trình, dải Cuối khoá giữ.
- R2.8 Áp luật mật độ M1–M10 (`docs/superpowers/specs/2026-11-05-mat-do-thong-tin/de-xuat.md`) cho đầu trang và bảng.
- R2.9 375: đầu trang một cột, "+ Task" nút tròn như mockup ①, bảng thành thẻ như nay.
- R2.10 Trạng thái: lớp chưa có em · lớp đã kết thúc (tab Tổng kết) · GV cũ chỉ xem.

## ③ Hồ sơ học viên — `thiet-ke/v21/ho-so-hv.html`

Nền: `thiet-ke/v18/ho-so-hv.html` · `thiet-ke/audit-0311/u02-ho-so-hv.html` · `thiet-ke/v16/case-pa.html` · `thiet-ke/v19/y-thuc.html` · `thiet-ke/v20/tinh-hinh.html`. Mã: `web/src/modules/students/` (StudentDetailPage, DauHoSo), `web/src/modules/cases/`.
Vai vẽ: GV dạy Listening của em (chính) · GVCN · TVV (chỉ xem học thuật).
- R3.1 Đầu hồ sơ giữ (tên, dòng thông tin, ô điểm 6 ô). Nút: **"+ Task"** (điền sẵn em) + "⋯".
- R3.2 Thanh **"Việc cần làm"** dùng dòng việc / nút-chip của mockup ①, hiện ĐỦ việc của người xem với em này (thêm Nhập điểm, Tình hình học tập đang thiếu); bấm = mở **panel việc** (không còn kiểu nhảy sang tab).
- R3.3 Giữ: 3 tab (Học thuật · Ý thức & Phối hợp · Lộ trình & lớp), bảng Mock Test, **hai cột Tiến độ trên lớp │ Case & phương án** (chủ SP 10/11), Case bấm thẳng để sửa (v16), Trước / Sau em, Hành trình.
- R3.4 Mỗi form trong Case (Mô tả · Chọn PA · Ghi kết quả · Hoàn thành) có **dòng quy chế** theo mẫu ①; nội dung lấy từ `luat/2-sos-case-pa.md` mục 4.
- R3.5 Tab Ý thức & Phối hợp của hồ sơ HV **đồng bộ kiểu tab lớp** (một khối một em → ở đây là khối của chính em: vấn đề · đã xử lý · bước đang làm · lịch sử tại khối; hai tab nhỏ Tình hình học tập / Ý thức · Phối hợp SOS) — việc "để sau" từ 12/11.
- R3.6 GVCN: nhắc "Em chưa có Target" kèm "Đề xuất sửa" ở dòng thông tin (không phải việc — chủ SP chốt 2.3).
- R3.7 Người chỉ xem (TVV xem học thuật; GV không dạy em): không nút sửa, một câu "ai làm được" tại chỗ.
- R3.8 Áp M1–M10; 375 như nay + nút tròn "+ Task".
- R3.9 Trạng thái: em Tạm dừng · em đã lưu trữ · em chưa có điểm.

## ④ Trang đầu của TVV — `thiet-ke/v21/trang-dau-tvv.html`

Nền: mockup ① (khung) · `thiet-ke/v20/tinh-hinh.html` · `thiet-ke/v16/lich-thi.html` · `thiet-ke/2026-11-11-phoi-hop-sos-v2/`. Mã: `web/src/modules/congViec/`, `web/src/modules/worklist/` (TongQuanV5 phần TVV), `server/src/worklist/viecTvv.ts`.
- R4.1 Trang đầu TVV = **Công việc**; menu: Công việc · Học viên & Lớp · Phân tích. Tab hạng mục hiện có của TVV giữ (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ), tab rỗng ẩn.
- R4.2 Dải mỏng đầu trang: 5 chỉ số của Tổng quan TVV (Việc · Báo PH đúng hạn · Thi tháng này · Chờ KQ · Chưa chốt lộ trình tiếp) — ô bấm được như nay, không thành khối to.
- R4.3 Khung phải khi chưa chọn việc: **"HV của tôi"** — mỗi em một dòng: tên (link) · lớp · tình trạng (thi tháng này / chờ KQ / đang SOS) · cột **"Việc cần làm"** bằng nút-chip như mockup ①. Em có việc xếp trên. Có ô tìm em.
- R4.4 Panel việc TVV giữ dáng đang có (Báo PH: Đã báo PH / Chưa liên hệ được + một ô Nội dung; Bước tiếp; Cập nhật KQ thi thật) + **dòng quy chế** (vd Báo PH: "Hạn 5 ngày · GV của lớp đọc được nội dung").
- R4.5 "+ Task" của TVV: **Hỏi tình hình học tập** (TVV → GVCN, hạn 3 ngày) — một mục; chọn em.
- R4.6 375 + trạng thái (hết việc, em chưa có TVV khác → không hiện, đang tải, lỗi).

## ⑤ Bảng mẫu thành phần — `thiet-ke/v21/bang-mau.html`

Nền: `thiet-ke/v5/bang-mau.html` · mockup ①. Đây là tờ mẫu cho session code dựng **một bộ thành phần dùng chung**; mỗi mẫu vẽ đủ biến thể + trạng thái (thường, rê, focus, đang chọn, tắt, lỗi), Sáng + Tối.
- R5.1 **Ô chọn có tìm** (chủ SP 14/11, lời 17 ý 5 — áp cho TẤT CẢ chỗ chọn người / lớp / học viên / người phụ trách / GV chấm / TVV / lớp đích…): ô gõ để tìm + danh sách thả; **mục liên quan đứng trước** theo ngữ cảnh, có nhãn nhóm (vd chuyển lớp: "Cùng chi nhánh" rồi "Chi nhánh khác"; chọn GV: "GV của lớp" → "Cùng chi nhánh" → "Khác"; chọn em: "Lớp này" → "Lớp của tôi" → "Khác"); mỗi mục có dòng phụ (lớp · chi nhánh · sĩ số / kỹ năng); chữ khớp tô nhận diện; phím ↑ ↓ Enter Esc; chọn một và chọn nhiều (chip + ✕, có trần "tối đa 8"); rỗng "Không thấy '…'"; đang tải; 375 mở toàn màn. Danh sách ngắn cố định (≤ 7 mục không phải người / lớp, vd Nhóm vi phạm, Mọi hạn) GIỮ dáng chip / ô chọn thường — ghi rõ ranh giới này.
- R5.2 Bảng kê MỌI chỗ đang dùng ô chọn thường cho người / lớp / em (rà `web/src` các `<select>`, `Menu`, `MenuDong`, ô gợi ý tự viết): tệp · chọn gì · nhóm "liên quan trước" đề xuất → ghi vào ghi-chu để lên PR thay một lượt.
- R5.3 **Dòng việc** chuẩn (theo mockup ① / v18): biến thể lớp × tuần, một em, dòng gộp "n em ▾", việc chung (Speaking chấm chéo), việc đổi trang "›"; quá hạn / hôm nay / còn hạn / không hạn; đang chọn.
- R5.4 **Nút-chip "Việc cần làm"** (loại việc + số; quá hạn ⚠; đổi trang "›").
- R5.5 **Panel việc** + **dòng quy chế**: khung panel, đầu panel (loại · tên việc · em · lớp · hạn), thân, dòng quy chế, chân (nút chính · nút phụ · "Việc tiếp ›" · trạng thái lưu). Kèm BẢNG CÂU dòng quy chế cho từng loại việc của GV, GVCN, TVV, QL (soạn từ mục "Người làm cần thấy gì" của `luat/1`–`4`; mỗi câu ≤ 90 ký tự; có biến thể theo lựa chọn).
- R5.6 **Hộp nhập điểm gọn** (FT L/R, W/S tiêu chí; lớp thường đúng / tổng): chân "Lưu · bài tiếp ›" + "Vắng" + "⋯".
- R5.7 **Menu "+ Task"** + bước chọn em.
- R5.8 **Hộp chuông** dùng dòng việc chuẩn, bấm mở thẳng panel việc; khối "Cập nhật" nhẹ ở dưới (theo `thiet-ke/2026-11-11-chuong-v2/`).
- R5.9 Một thanh tab · một menu thả · một dải chỉ số · một kiểu lịch sử: chọn một dáng cho mỗi loại từ các dáng đang có (ghi dáng nào bị bỏ, ở tệp nào).
