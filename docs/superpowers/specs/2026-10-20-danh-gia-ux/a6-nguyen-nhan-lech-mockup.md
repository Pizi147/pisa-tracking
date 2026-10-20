> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# a6 — Vì sao mockup đã duyệt mà web làm ra không giống (thiết kế → kế hoạch → triển khai → rà → merge)

Agent a6 · 20/10/2026 · main `e3405b93` · chỉ đánh giá, không sửa gì. Ảnh: `SCR/anh/a6/` (SCR = thư mục scratchpad của đợt rà).
Ký hiệu: m1…m6 = `thiet-ke/mockup-ov14-{1..6}-*.html`, mT = `mockup-tutor-1-head-tutor-2026-10-19.html` · ĐT = đặc tả
`2026-10-18-ov14-thiet-ke-tong-the-design.md` · KH = kế hoạch `2026-10-19-ov15-overhaul-6-pr.md` (15a…f ý n) · KHg = `2026-10-20-ov15g-ov15h.md` ·
KHi = `2026-10-20-ov15i-viec-le.md` · giờ PR là giờ GitHub (UTC; giờ VN = +7).

**Tóm tắt một đoạn.** Web khớp khoảng 60 % các quyết định trong mockup (tính theo dòng), nhưng hai màn dùng nhiều nhất (Tổng quan QL, Hồ sơ lớp) chỉ ~40 %,
và phần lệch nằm đúng lớp "nhìn thấy đầu tiên": đầu trang, dải lọc, dáng khối, mật độ, vị trí ký hiệu ✓/✗, khối cũ còn sót. Nguyên nhân không nằm ở một
session code làm ẩu: quy trình do chính planning đặt ra **không có chỗ nào kiểm "web có giống khung mockup không"** — kế hoạch dịch khung thành vài chữ,
luật "sửa trên nền có sẵn / bố cục đã khoá / dùng lại component" đẩy session vá màn cũ, 6 PR song song chia theo tệp, luật tiết kiệm token bỏ bước xem hình,
người rà đọc diff + ảnh một khung nhìn, và chủ SP chỉ duyệt khung tĩnh rồi nhìn thấy kết quả sau khi 14 PR giao diện đã merge trong ~24 giờ (nhiều PR lúc đêm).

---

## Phần 0. Phạm vi

**Đã đọc:** CLAUDE.md · plan.md (mục 0, 1.1–1.5, 4, 5, 6, 9.0, 10, 11) · DESIGN.md · ĐT (mục 0–6) · đặc tả Tutor · đánh giá UX 17/10 · KH · KHg · KHi ·
kế hoạch TU-b · mô tả + bình luận + danh sách tệp + `Co-Authored-By` của 33 PR #445–#485 (`SCR/a6/pr/*.json`) · mã liên quan (`web/src/modules/**`,
`server/src/tests/**`, seed) · bộ nhớ planning (`feedback-planning-tu-merge`, `luong-qua-dem`) · tìm trong transcript session local (cloud không đọc được).

**Đã chụp** (công cụ chụp chung, demo 14/09/2026, 1440 tối trừ khi ghi khác):
- 7 mockup toàn trang: `mk1-p*.png` … `mk6-p*.png`, `mkt-p*.png` (65 lát).
- Web: `w-tq-ql`, `w-tq-qt`, `w-tq-ql-375` (Tổng quan) · `w-cv-gvbm` (GV Phạm Thu Trang), `w-cv-linh`, `w2-cv-linh-375`, `w-cv-ql` (Công việc) ·
  `w-hvl-tatca`, `w-hvl-sos`, `w-hvl-canlam`, `w-hvl-lichthi`, `w-hvl-375` (Học viên & Lớp) · `w-hosolop-gvcn`, `w2-hosolop-ythuc` (Hồ sơ lớp) ·
  `w-test-kh`, `w2-kh-mo`, `w-test-lich` (Test) · `w-pt-baocao`, `w-pt-kqthi`, `w-pt-gv` (Phân tích) · `w-tutor-ht`, `w-tutor-qt` (Tutor) ·
  `w2-sos-chip` (hộp Vì sao SOS) · `w2-tq-panel`.
- 10 ảnh ghép "mockup | web" cùng vai: `SCR/anh/a6/cap/01…10-*.png` (Phần 5). Ảnh PR #471 đã đóng: `SCR/anh/a6/pr471/`.

**Chưa kiểm được (lý do):**
- Cách session cloud (OV-15a–e, i1/i2) "đọc" mockup — transcript cloud không truy cập được → ghi [GIẢ THUYẾT] ở N13.
- Các bước cần Lưu / Duyệt (lưu xong sang việc kế, Hoàn tác, Chốt lộ trình tại chỗ) — luật chỉ đọc; dựa theo ảnh PR.
- "Chọn bước tiếp sau thi" ở Tổng quan, panel Tutor, Lịch thi có em — demo không có dữ liệu đúng trạng thái (xem N11).
- 375: chỉ so Học viên & Lớp, Tổng quan, Công việc GV.
- Phông: lỗi 403 trong console lúc đầu là của môi trường thử (Vite chặn tệp phông), không phải lỗi web — báo cáo này không tính chúng. Các ảnh web dùng để so
  (ảnh ghép Phần 5 và ảnh `w-*` / `w2-*` nhắc trong Phần 1) đã chụp lại sau khi môi trường nạp đúng phông.

---

## Phần 1. Ma trận truy vết (khung mockup → đặc tả → câu kế hoạch → PR → web 20/10)

Kết quả: **KHỚP** · **MỘT PHẦN** · **THIẾU** (không làm) · **KHÁC** (làm khác khung). Tỉ lệ màn = (KHỚP + ½ MỘT PHẦN) / số dòng đã so.

### A. Tổng quan QL — m3 §1, 1c, 1d · m6 §10 — **~40 %** (dòng: 4,5 / 11)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| A1 | Tên trang "Tổng quan" (m3 §1); đổi "Báo cáo" (m6 §10) | §6 "Tên trang: Báo cáo" (dòng 153) | §7 "Báo cáo = tab đầu Phân tích; Tổng quan có nút Báo cáo ›" — trái m6 §10, không ai sửa mockup | #462, #463 chọn §7 | h1 **"Việc hôm nay"** = nhãn tab cũ (`dieuHuong.ts:160`, `OverviewPage.tsx:52,75`) | KHÁC |
| A2 | Một hàng đầu: Tổng quan · Chi nhánh ▾ · FT / LT · Dữ liệu đến · Báo cáo | C10, C11 | không có câu | — | FT/LT + "Báo cáo ›" hàng riêng; banner "Mới dùng PISA?" chen giữa; QT: ô Chi nhánh nhãn ở trên, góc phải | KHÁC |
| A3 | Dải HV cần chú ý: 4 chip-nút có viền | Q6a, C23 | 15d.3 "dải tóm tắt nhỏ"; KHg h1.4 thêm 2 mục | #463 thiếu 2 mục → #482 | đủ 4 mục, dạng chữ gạch chấm | MỘT PHẦN |
| A4 | Cần bạn quyết › Chờ duyệt: hàng gọn 4 cột (loại · đối tượng + trích · "Nếu duyệt" · hạn + nút), "Hiện 7 thẻ nữa", Hoàn tác tại hàng | C23, Q5 | 15d.3 chỉ ghi "Cần bạn quyết (Chờ duyệt, …)" | #463 dùng lại `HopChoDuyet gon` của Công việc (`KhoiCanQuyet.tsx:92`) | thẻ to + ô tích + câu "Đánh dấu ô…" + "Xem thêm 7 thẻ" + "Mở hộp duyệt ›" | KHÁC |
| A5 | Case chưa chốt PA · quá hạn: chip SOS + ?, GVCN + chip trạng thái, cột mô tả PA, Mở Case | C23 | 15d.3 | #463 | tên · lớp / người · trạng thái chữ; không chip SOS, không cột mô tả | MỘT PHẦN |
| A7 | Chốt lộ trình (1c): chip "Lộ trình lớp", "14 HV · tuần 7/8 · đã đề xuất 14/14", tóm tắt "11 lên lớp · 2 học lại" | Q5 | 15d.3; KHg h1.6 | #463 → #482 | "Chốt lộ trình · MB FOU 12 / 7 em chưa chọn" + nút cùng chữ; hiện cả khi đang xem FT | MỘT PHẦN |
| A8 | Lớp cần chú ý: GVCN · HV · Chưa lịch · Chưa điểm · SOS 1/2/3 · HV/Case · Đã thi chờ KQ | C23 | 15d.3 (một chữ) → KHg h1.5 "theo mockup 3" | #463 giữ cột cũ → #482 | đúng cột | KHỚP (sau 15h1) |
| A9 | **Tuần này**: dải 6 thẻ tuần (Trước W1 · W1 … W5, tuần này viền) + bảng "Test W3 OCT" + Trễ chấm bên cạnh | §2 | 15d.3 chỉ một chữ "Tuần này" | #463 dùng lại `LichSapToi` (OV-6a, `OverviewPage.tsx:110`); **#471 (đã đóng) có dải tuần + bảng Test** | "Lịch sắp tới" có tab tuần, chip "MT1 · 1 em", chữ mờ "L R W S" | KHÁC |
| A10 | Trễ chấm gọn: tên · kỹ năng · [n bài] · lớp · trễ nhất | C03 | KHg h1.7 "gọn như mockup 3" | #482 | đúng | KHỚP |
| A11 | Số bấm được = ô viền như nút, số 0 không bấm (m3 "Chú giải") | đánh giá 17/10 §4 dòng 6, 8 | không có câu | — | số gạch chấm khắp trang | THIẾU |
| A12 | Bấm số → panel làm việc (1d) | C02 | 15d.3 | #463, #482 | có (ảnh `pr-ov15h1/3-…`) | KHỚP |

### B. Công việc — m2 §1 "Sau", §2, §3 — **~65 %** (dòng: 6 / 9)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| B1 | GV vào thẳng Công việc, bỏ Tổng quan GV | §2 | 15d.2 | #463 | đúng | KHỚP |
| B2 | Đầu "Chào Trang · Tuần W3 SEP" + "⚠ 4 quá hạn · 0 hạn hôm nay · 14 việc" | — | 15d.2 | #463 | thiếu "hạn hôm nay"; banner "Mới dùng PISA?"; GV có thêm công tắc FT/LT + ô Chi nhánh | MỘT PHẦN |
| B3 | Danh sách trái theo nhóm + panel phải tự mở việc đầu | C02 | 15d.2 | #463 | đúng | KHỚP |
| B4 | Panel Nhập điểm: lưới chỉ cột của việc, rộng hết panel, "Còn 2 bài", "Cả lớp" | C15/C16 | 15b.1 | #469 | bảng nửa panel; thêm hàng gập lớp + hàng nút "Mở lưới đầy đủ ↗ · Dán từ Excel · ? · Cả lớp"; việc "2 bài" hiện 3 em (#469 tự ghi "Chưa xác minh", không vào 15h/15i) | MỘT PHẦN |
| B6 | "Lớp tôi dạy" xuống cuối, gọn | — | 15d.2 | #463 | bảng cũ, tràn khung thẻ (ảnh chủ SP 3) | MỘT PHẦN |
| B7 | QL: danh sách rộng một cột, cột "Người" ở giữa, ? trên dòng mở hộp giải thích, "Phân công…" | C02, C03 | 15d.1 | #463 | bố cục hàng đợi GV (panel tự mở) áp cho QL; người ở dòng phụ; không ? trên dòng | MỘT PHẦN |
| B8 | Lọc Của tôi · Của GV ▾ · Tất cả + ⚠ quá hạn + "10 chờ bạn duyệt" | — | 15d.1 | #463 | có, thêm "Xem việc của: một GV…" + công tắc khung | KHỚP |
| B9 | Chờ bạn duyệt đầu, ô tích duyệt nhiều | — | 15d.1 | #463 | đúng | KHỚP |
| B10 | ? cạnh dòng việc mở giải thích (m1 §1g "Cạnh dòng việc") | C04 `NutGiaiThich` | 15a.2 chỉ chip SOS; `NutGiaiThich` không vào kế hoạch | — | không có | THIẾU |

### C. Học viên & Lớp — m1 §2b, §3 · m5 §1–2 · m6 §1, §7 — **~58 %** (dòng: 7,5 / 13)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| C1 | **Dải lọc dính, cùng chỗ mọi trang**: Chi nhánh · Chương trình (nút đoạn) · ‹ Tuần thi › · Đang lọc [chip ×] · Bỏ lọc | **C10 [CHỐT]**; §5 xếp vào OV-15a | **KH 15a không có** | — | ô tìm trên cùng; "Loại lớp: Tất cả · 20" là ô chọn; không "Đang lọc / Bỏ lọc"; không dính; mỗi trang một kiểu | THIẾU |
| C2 | Góc Tất cả · Đang SOS · Cần làm (+ Lịch thi), chip Đã thi | §2, mục 4 | 15f.1 | #476 | có (+ Bộ lọc thêm) | KHỚP |
| C3 | Hàng lớp tóm tắt đúng cột: SOS 1/2/3 ở cột Kết quả · "Đã thi n" · Case · ⚠ quá hạn | — | không có câu | — | chỉ chip "8 chờ duyệt · 78 bài chờ chấm · +1" cuối hàng | MỘT PHẦN |
| C4 | Mặc định mở MB FT 101 ("1440 · Tất cả — mặc định, MB FT 101 đang mở") | — | không có câu | — | đóng hết: luật cũ T17 PR-N1 27/09 "không tự mở lớp" (`hocVienLop.ts:432`) thắng | KHÁC |
| C5 | Mở lớp FT: OVR · L · R · W (W1 · W2 dòng phụ) · S căn giữa | C13 | 15b.4 | #469 | đúng | KHỚP |
| C6 | Ký hiệu **đứng trước số, số cùng màu** ("✗ Chưa đạt: ký hiệu + số đỏ", m1 §1a) | C05, §6 | 15a.3 chỉ ghi "✓/✗ SVG trơn … màu" | #460 | ký hiệu SAU số, số trắng — mọi bảng (`BangHocVienLop.tsx:67`, `ClassRoster.tsx:364`, `LuoiFT.tsx:387`, `KetQuaThi.tsx:86`) | KHÁC |
| C7 | Bỏ "thiếu / vượt 0.5" | §6 | 15a.3 | #460 | Kết quả gần nhất vẫn "6.5 −0.5" | MỘT PHẦN |
| C8 | Chip SOS chỉ viền, kỹ năng trong chip "SOS 2 · W, S" | C08 | 15a.2 | #460 | HV&L đúng; hồ sơ lớp "SOS 1" không kỹ năng; Đang SOS kỹ năng nằm ngoài chip | MỘT PHẦN |
| C9 | Đang SOS: cột + hàng nhóm lớp | 12f | 15a | #460 | đúng cột; hàng nhóm "2 em · 2 lượt SOS · 1 chờ duyệt" thay chip SOS 1/2/3 | KHỚP |
| C10 | Xuất Excel · n HV + panel | C31 | 15f.2, KHg h2.1–3 | #476, #481 | có | KHỚP |
| C11 | Phân trang đầu + cuối | §6 | 15f.3 | #476 | có (cắt nhóm lớp giữa trang) | KHỚP |
| C12 | 375: thẻ lớp có tóm tắt SOS + thẻ em mở sẵn | — | không có câu | — | thẻ lớp chỉ chip việc, đóng; góc nhìn xuống 2 hàng | MỘT PHẦN |
| C13 | Lịch thi: "Tháng dự kiến thi ▾" · Chi nhánh · Lớp · "Gồm chưa có dự kiến · n" · Kết luận nút đoạn 4 lựa chọn | mục 4 (D) | 15f.1 | #476 (Sonnet 5.5) | 12 nút tháng một hàng; nhóm "Chưa có dự kiến" có 3 nút rời (Đặt tháng · Chốt ngày · Cần xác nhận); demo 10/2026 = 0 HV | MỘT PHẦN |

### D. Hồ sơ lớp — m1 §4 · m6 §2 — **~42 %** (dòng: 2,5 / 6)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| D1 | Bảng Tổng hợp: Target · Dự kiến thi · Đợt · OVR · L · R · W1 · W2 · S · Theo dõi | C12 | 15b.3 | #469 | đúng | KHỚP |
| D2 | Hàng MT cũ mờ, chữ nhỏ | §6 | 15b.3 "mockup 6 khung 2" | #469 | đúng | KHỚP |
| D3 | Chip SOS kèm kỹ năng | C08 | 15a.2 | #460 | "SOS 1" không kỹ năng | MỘT PHẦN |
| D4 | Chip "Đã thi 2" cạnh tab con | — | không có câu | — | không có | THIẾU |
| D5 | **Khung chỉ vẽ khối bảng** — không có lưới điểm cuối trang | C16 (bỏ tab Điểm theo lớp → panel) | 15b.5 chỉ "hồ sơ lớp nút Nhập điểm"; không nói bỏ khối cũ | #469 giữ khối `KhoiDiemLop` (PR-DL 04/10 + OV-3a "mở sẵn"); phép kiểm DL-6 (`prDl.tests.ts:611-618`) **buộc** khối có + mở sẵn | lưới 33 hàng dưới MỌI tab (`ClassOverviewPage.tsx:145` nằm ngoài điều kiện tab); trang ≥ 4 800 px (tab Học viên), 5 400 px (tab Ý thức) | KHÁC (thừa) |
| D6 | Ký hiệu trước số, số cùng màu | C05 | 15a.3 | #460 | sau số | KHÁC |

### E. Test — m4 · m1 §2b · m6 §8 — **~70 %** (dòng: 4 / 5; trừ vì chip lệch có ở mọi ô)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| E1 | Dải Kế hoạch Test: Chi nhánh · FT · LT · Tìm · n HV · Xuất | C17, C18 | 15c.3, .5 | #464 | có, thêm 3 nút | KHỚP |
| E2 | Chip lịch 2 dòng "✓ W1 JUL/2026 / Đã thi", Chưa xếp viền đứt, L/R và W/S tách dòng; email dưới tên | C19–C21 | 15c.2 chỉ "năm cạnh tuần" | #464 | chip cũ `ChipDotFT` / `OMt` (PR-OMT) một dòng "L R W S · trễ  W4 JUL/2026" nền màu, chỉ thêm "/2026"; không email; "vào muộn" | MỘT PHẦN |
| E3 | Hộp lịch: Xóa cạnh Đóng; ghi chú dưới chip | §6 | 15c.1, .4 | #464 | đúng (ảnh PR) | KHỚP |
| E4 | Tìm lớp / HV / email | C18 | 15c.3 | #464 | đúng | KHỚP |
| E5 | Lịch Test: dải "Chi nhánh · FT 4 lớp · LT 9 lớp · ‹ W3 SEP › · Tuần này" | C10, C14 | 15b.6 | #469 | "Tuần" nhãn trên ô; "Tất cả · FT · LT ⓘ"; 3 ô số; khối gập | MỘT PHẦN |

### F. Phân tích — m3 §3, 4, 4b, 4c · m6 §6–7 — **~75 %** (dòng: 4,5 / 6)

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| F1 | 6 tab, Báo cáo đầu, 2 tầng | C28, §7 | 15e.1 | #462 | đúng | KHỚP |
| F2 | Bộ chọn thời gian chung | C29 | 15e.2 | #462 | đúng | KHỚP |
| F3 | Báo cáo **mở sáng, chữ lớn để chiếu**, số trong ô, SOS theo lớp bằng chip | C24–C26 | 15e.3 "in / chiếu nền sáng A4 ngang" | #462 | 5 khối đúng chỗ; sáng chỉ khi bấm In (`BaoCao.tsx:49-52`); chữ thường; SOS số trơn | MỘT PHẦN |
| F4 | Kết quả thi Mock / Thi thật | §6 | 15e.4 **"mockup 6 khung 6"** | #462 | đúng cột, đếm lượt | KHỚP |
| F5 | Phân tích GV: bảng gọn 7 cột, ô chip "2 lớp · 40 HV", "W1 18/24 · 75%" (m3 4c) | C30 | 15e.5 **"giữ chiều sâu bảng cũ"** | #462 | bảng cũ 12 cột hai tầng + câu giải thích dài + dòng chú giải (ảnh chủ SP 11) | KHÁC |
| F6 | Phân trang | §6 | 15e.6 | #462 | đúng | KHỚP |

### G. Tutor — mT §2–7 · đặc tả Tutor §7, §13 — **cấu trúc ~88 %; thứ chủ SP thấy: trang rỗng**

| # | Khung / quyết định mockup | Đặc tả | Câu kế hoạch | PR | Web 20/10 | Kết quả |
|---|---|---|---|---|---|---|
| G1 | Thanh trên Head tutor chỉ "Tutor n" | §4, §7 | TU-b Task 1 | #477 | đúng (n = 0 nên không số) | KHỚP |
| G2 | Đầu trang + Thêm tutor + Tải danh sách | §7–8 | Task 5 | #477 | đúng | KHỚP |
| G3 | Lọc 5 chip + Nơi dạy + Kỹ năng + tìm | §7 | Task 5 | #477 | đúng | KHỚP |
| G4 | Mặc định Cần chú ý, bảng 10 cột | §7 | Task 5 "Cần chú ý nếu > 0, không thì Đang dạy" | #477 | demo: Cần chú ý 0, Đang dạy 0 → ô rỗng (ảnh chủ SP 2). 2 buổi tutor của seed có `created_at` = 2026-10-20T09:36Z (giờ thật lúc seed), ngoài khoảng W1 + W2 SEP. Ảnh PR TU-b chụp trên DB khác (Tất cả 10, Đang dạy 7) | MỘT PHẦN (dữ liệu) |

### H. Nền dùng chung — m1 §1, §2a — **~80 %**
Token 5 nghĩa, nền tách lớp (15a.1) KHỚP · menu tài khoản Giao diện / Ngôn ngữ / Hướng dẫn (15a.7) KHỚP · quá hạn chỉ chữ cam + ⚠ (15a.4) KHỚP ·
hàng đã thi / đang chọn (15a.5) KHỚP · **thứ tự thanh trên** "Công việc · Tổng quan · …" (ĐT §2, m3) — m1 vẽ thứ tự khác; #471 làm theo m3, #463 không → KHÁC.

**Tổng:** trung bình ~60 % theo dòng. Chỗ khớp cao đều là chỗ kế hoạch **trỏ đúng một khung** (Kết quả thi "mockup 6 khung 6", hồ sơ lớp "khung 2",
Lớp cần chú ý "theo mockup 3" ở 15h1). Chỗ lệch nặng là chỗ kế hoạch chỉ ghi một chữ ("Tuần này", "Cần bạn quyết") hoặc ghi ngược ý ("giữ chiều sâu bảng cũ"),
hoặc không ghi gì (dải lọc C10, đầu trang, khối cũ cần bỏ, vị trí ✓/✗).

---

## Phần 2. Nguyên nhân gốc (xếp từ nặng tới nhẹ)

### N1 (a) Kế hoạch dịch mockup thành vài chữ; không có tiêu chí "giống khung X" — [PHÁT HIỆN] · XÁC NHẬN · Ảnh hưởng **CAO**
- Bằng chứng:
  - 6 mockup OV-14 ~700 KB, ≥ 36 khung 1440 + ≥ 15 khung 375 (đếm chú thích khung) → KH có 34 ý cho 6 PR; chỉ 5 chỗ trỏ một khung / khối cụ thể (KH dòng 62, 83, 106; KHg dòng 49, 51). Không câu nào ghi "đổi bố cục".
  - Tiêu chí duy nhất về mockup: "Chữ trên màn = chữ mockup" (KH dòng 14). Mục "Kiểm" của 15a: "phép kiểm tương phản; do-khung không thêm lỗi" (KH dòng 51). Không có nghiệm thu bằng hình.
  - Mất chi tiết khi dịch: "Tuần này" (KH dòng 94) → `LichSapToi`; "giữ chiều sâu bảng cũ" (dòng 107) → giữ bảng 12 cột; "✓/✗ SVG trơn … màu" (dòng 43) → mất "ký hiệu đứng trước, số cùng màu"; "in / chiếu nền sáng" (dòng 104) → chỉ có In.
  - Rơi giữa đặc tả và kế hoạch: ĐT §5 (dòng 126) xếp "**dải lọc** + `NutGiaiThich` + panel làm việc" vào OV-15a; KH 15a (dòng 35–51) không có → C10 [CHỐT] không PR nào làm.
- Ảnh hưởng: A1, A2, A4, A9, A11, B10, C1, C3, C4, C6, D5, F3, F5 — đúng các chỗ chủ SP thấy "không giống".

### N2 (b) Luật "sửa trên nền có sẵn · bố cục đã khoá · dùng lại component" → vá màn cũ — [PHÁT HIỆN] · XÁC NHẬN · **CAO**
- Bằng chứng: CLAUDE.md:14 "sửa trên nền có sẵn, không làm lại", :24 "dùng lại component sẵn có", :40 "bố cục đã khoá — giữ, trừ khi kế hoạch PR ghi rõ là đổi";
  DESIGN.md:103-104 "Bản ghi hệ giao diện **đang có** … không phải thiết kế mới", :191 "Không đổi … bố cục đã khoá khi kế hoạch PR không ghi rõ". KH không ghi "đổi bố cục" ở đâu cả.
- Kết quả trên web: `LichSapToi` (OV-6a) thay khối Tuần này · `HopChoDuyet gon` (thẻ Công việc) thay hàng Chờ duyệt của m3 · `KhoiDiemLop` (PR-DL 04/10) còn cuối hồ sơ lớp ·
  `PhanTichGiaoVien` cũ · chip lịch `ChipDotFT` / `OMt` (PR-OMT) · `BranchFilter` nhãn trên · banner `DaiMoiDung` (HD-a 15/10) · h1 lấy nhãn tab cũ.
- Gián tiếp: `ponytail` ("shortest diff wins") + `karpathy-guidelines` ("sửa đúng chỗ cần sửa", CLAUDE.md:32-34) cùng thưởng diff nhỏ; không skill nào thưởng "giống khung". Mọi PR ghi "ponytail-review: Ship".

### N3 (k + l4) Chủ SP chỉ duyệt khung tĩnh; không xem bản chạy trước merge; 14 PR giao diện merge trong ~24 giờ — [PHÁT HIỆN] · XÁC NHẬN · **CAO**
- plan.md:42 chỉ đòi mockup duyệt **trước khi code**; không có bước chủ SP xem web trước merge. Bộ nhớ `feedback-planning-tu-merge` (08/10) cho planning tự merge;
  `luong-qua-dem` (20/10) chạy qua đêm khi chủ SP ngủ.
- Mockup 6 (#457, 1 071 dòng, 10 khung) tạo 06:24Z; kế hoạch 6 PR (#458) 06:44Z → duyệt trong ≤ 20 phút. ĐT §6 dòng 141 "Không nhắc = duyệt như mockup v2" → ~60 khung duyệt ngầm.
- Merge: #460 08:04Z 19/10 … #485 07:35Z 20/10 = 14 PR giao diện (~18 500 dòng đổi) trong 23,5 giờ; 5 PR merge 22:14–04:17 giờ VN. Không có bước nào chủ SP
  xem web trước merge; nhận xét đầu tiên của chủ SP về web (12 ảnh) đến chiều 20/10, khi cả loạt đã merge.
- Mở PR → merge: trung vị ~46 phút; #460 (nền, 110 tệp) mở 08:02:17Z, merge 08:04:11Z; #481 (53 tệp) 18 phút.

### N4 (e) Rà PR không đặt ảnh web cạnh khung mockup; lệch đã lộ trong ảnh PR vẫn merge — [PHÁT HIỆN] · XÁC NHẬN · **CAO**
- 0 / 13 PR có ảnh mockup cạnh web. Mẫu agent rà 10B (plan.md:445-460) không có mục "so mockup". plan.md 1.3 dòng 64: "planning tự đọc diff + xem ảnh — không bấm thử".
  Nội dung rà của planning gần như không có trên GitHub: chỉ #453 "Rà đạt, merge" và #471 "Đóng…"; #463 có bình luận "Sửa theo rà" của session.
  Nhận xét rà còn lại nằm trong chat, không truy vết được. plan.md mục 11: mỗi dòng do session tự viết, liệt kê tính năng, không dòng nào nói về độ khớp mockup;
  dòng của planning (plan.md:242) chỉ ghi "OV-15c #464 · OV-15d #463 rà đạt, chờ gộp main + sửa nhỏ".
- Lệch thấy rõ trong ảnh PR mà vẫn merge:
  - `docs/anh/pr-ov15d/ql-tong-quan-1440-toi.png` — thẻ Chờ duyệt to, công tắc FT/LT hàng riêng, banner (A2, A4);
  - `pr-ov15d/ql-tong-quan-duoi-1440-toi.png` — Lớp cần chú ý cột cũ, Lịch sắp tới, Trễ chấm 6 cột (A8, A9);
  - `pr-ov15b/cong-viec-gv-panel-1440-toi.png` — bảng nửa panel, "2 bài" mà 3 em (B4);
  - `pr-ov15e/05-phan-tich-gv-ql-1440-toi.png` — bảng GV cũ (F5);
  - `pr-ov15c/1440-toi-luoi-ghi-chu.png` — chip lịch cũ, không email (E2).
- **#471** (OV-15d làm lại) khớp m3 hơn: đầu trang một hàng, Tuần này có dải tuần + bảng "Test W3 SEP", Case có chip SOS (`SCR/anh/a6/pr471/03-tong-quan-ql-1440-toi.png`).
  Bị đóng vì "trùng #463 (đã merge)"; chỉ giữ "ý hay" về tốc độ (bình luận #471). Chọn theo thứ tự merge, không theo độ khớp.

### N5 (d) Luật tiết kiệm token bỏ bước kiểm hình — [PHÁT HIỆN] · XÁC NHẬN · **CAO**
- plan.md 1.3b dòng 72-75: "giao diện PISA căn bản … KHÔNG `polish`…"; 1.2 dòng 53: "Bấm thử … MỘT lần, chỉ màn PR chạm"; KH dòng 12 chỉ `clarify / harden / adapt` (bỏ cả `layout`, dù CLAUDE.md:45 cho phép).
- 124 / 133 ảnh PR OV-14/15/TU là MỘT khung nhìn (1440×900, 375×812; vài ảnh nén 800×500) → phần dưới trang (Lớp tôi dạy, khối điểm cuối hồ sơ lớp) gần như không ai xem.
- 41 % dòng đổi của 13 PR là web; 58 % là máy chủ + phép kiểm (luật, quyền, Turso). Audit impeccable 16–18/20 ở mọi PR — thang này không có chiều "giống mockup".

### N6 (l1) Thứ tự nguồn đặt câu kế hoạch và quyết định cũ TRÊN mockup — [PHÁT HIỆN] · XÁC NHẬN · **CAO**
- CLAUDE.md:6-8: (1) quyết định chủ SP + đặc tả + kế hoạch PR > (2) Rulebook + mockup. Câu kế hoạch mơ hồ hoặc luật cũ hơn ngày duyệt mockup đều thắng khung đã duyệt:
  - T17 PR-N1 27/09 "không tự mở lớp" thắng khung "MB FT 101 đang mở" (C4);
  - luật một chữ S3 thắng nhãn mockup (#460 "dưới kỳ vọng"; #476 "Tháng dự kiến thi" → "Dự kiến thi"; #469 "Huỷ" → "Dán lại");
  - plan §7 thắng m6 §10 nhưng không ai sửa mockup → web không theo cả hai ("Việc hôm nay").
- Tập quán từ 06–08/10 (transcript PR-MTb, PR-TK, Làn B): "Lệch mockup đã duyệt → nêu trong mô tả PR" — lệch coi như đã xử lý khi đã ghi.

### N7 (c) 6 PR song song chia theo TỆP, không theo MÀN — [PHÁT HIỆN] · XÁC NHẬN · **TRUNG BÌNH–CAO**
- KH dòng 16: "chỉ sửa file trong phạm vi mình; file chung chỉ THÊM, không sắp lại"; mỗi PR có "Phạm vi file". Từ danh sách tệp PR (17–20/10):
  Công việc bị 9 PR chạm · Hồ sơ lớp 8 · Test 8 · Học viên & Lớp 6 · Tổng quan 5 · Phân tích 5.
- Phần cấp trang không ai sở hữu: #462 bỏ hàng tab ở `OverviewPage.tsx` ("chỉ bỏ hàng tab, OV-15d"), #463 dựng khối → h1 "Việc hôm nay" còn sót; dải lọc chung; banner; khối cũ cuối trang.
- OV-15d chạy HAI lần song song (#463, #471) — tốn công và chọn bản kém khớp hơn (N4).

### N8 (i) Việc lẻ đẩy sang PR sau — chỉ mục session TỰ KHAI được theo dõi — [PHÁT HIỆN] · XÁC NHẬN · **TRUNG BÌNH**
- plan.md:245-248 gom đúng 7 mục #463 tự khai (a–g) + mục 15f/15e/15c vào OV-15h → 15h1/h2 làm gần hết. Lệch chỉ thấy bằng mắt (A1, A2, A4, A9, C1, C6, D5, F3, F5) không vào danh sách nào.
- "#469: Chưa xác minh … 3 em có ô trống" không có trong plan.md / KHg / KHi (grep) → còn nguyên ở ảnh chủ SP 3.
- KHi dòng 3 "không đổi bố cục, không màn mới → không mockup"; KHg dòng 5 "Không màn / luồng mới → không cần mockup" → không đợt sau nào được phép sửa bố cục.

### N9 (l2) Phép kiểm đọc chuỗi mã nguồn web khoá bố cục cũ — [PHÁT HIỆN] · XÁC NHẬN · **TRUNG BÌNH**
- 68 / 204 tệp phép kiểm trỏ tới mã web (724 chỗ, 164 tệp web). DL-6 (`prDl.tests.ts:611-618`) buộc hồ sơ lớp có khối "Điểm Mock Test của lớp", mở sẵn (`useState(true)`) → muốn theo khung D5 phải xoá phép kiểm.
- #463: "Sửa 12 phép kiểm cũ khẳng định giao diện trước". Repo không có phép kiểm hiển thị web (#481) → nhiều phép kiểm nói "giữ như cũ", không phép kiểm nào nói "giống mockup".

### N10 (g) Mockup HTML viết tay, không từ thành phần thật; các mockup mâu thuẫn nhau — [PHÁT HIỆN] · XÁC NHẬN · **TRUNG BÌNH**
- 7 mockup 73–158 KB, CSS riêng 35–51 biến (12–14 trùng `index.css`), 100–188 class (4–6 trùng); không nối CSS app (`SCR/a6/soMockup.mjs`).
- `/dev/thanh-phan` (`ThanhPhanDemo.tsx`) không có thành phần OV-15 nào (ChipSos, DauKetQua, PhanTrang, thẻ duyệt…).
- Mâu thuẫn: thanh trên m1 ≠ m3; "Chờ duyệt" là thẻ (m2 §3) và là hàng (m3 §1); Báo cáo ở Tổng quan (m3) / đổi tên trang (m6 §10) / tab Phân tích (§7).
- m1 §4 "chỉ khối bảng", m6 §6 "chỉ phần dưới thanh trên" — khung vẽ một khối, kế hoạch không có danh sách "BỎ" → phần cũ quanh khối giữ nguyên (D5, banner, đầu trang).

### N11 (f) Dữ liệu mockup "đẹp" vs demo; ảnh PR chụp trên dữ liệu tự thêm — [PHÁT HIỆN] · XÁC NHẬN MỘT PHẦN · **TRUNG BÌNH**
- Tutor rỗng do seed (G4). Lịch thi 10/2026 = 0 HV, 43 "chưa có dự kiến". #467: "2 lượt thi thật ghi tay vào DB dev vì demo không có". Ảnh PR TU-b: 10 tutor / 7 đang dạy ≠ demo.
- Ngược lại demo dày hơn mockup (MB FT 101 33 em, ~45 vi phạm) → trang dài 4 800–5 400 px; mockup vẽ 8–10 hàng, không vẽ trạng thái "cả hai lọc = 0".
- Đây là nguyên nhân chính của "Tutor trống", không phải của lệch bố cục.

### N12 (h) Session cloud không nhắn về được — [PHÁT HIỆN] · XÁC NHẬN · **TRUNG BÌNH**
- KH dòng 22 "Session cloud KHÔNG nhắn được về planning"; 15a–e, 15i1/i2 chạy cloud. Gặp chỗ mockup ≠ mã ≠ luật, session tự quyết, ghi cuối PR
  (#463 a–g, #462 "theo plan §7", #476 đổi nhãn) — planning chỉ thấy khi PR đã xong. 15g/h (local, nhắn được) cũng không sửa bố cục vì KHg cấm (N8).

### N13 Session đọc mockup dạng mã HTML, không nhìn hình — [GIẢ THUYẾT]
- Prompt: "Đọc trước: … mockup đã duyệt `thiet-ke/mockup-ov14-{1..6}-*.html`" (KH dòng 143) — ~700 KB ≈ 200 nghìn token nếu đọc mã; không câu nào bảo chụp khung ra ảnh để so.
  Không PR nào có ảnh mockup. Cách kiểm: mở transcript cloud `session_018nQbC1gggZgcSF59H6AFaJ` (#463), `session_01PTSeVZWH8DZR2LAvnYpoaj` (#471) — tìm lệnh Read/Grep tệp mockup và có chụp mockup không.

### N14 (j) Model / effort thấp hơn kế hoạch — **PHẦN LỚN BÁC** · Ảnh hưởng THẤP
- `Co-Authored-By`: 12 / 13 PR giao diện là Opus 5.5. Chỉ OV-15f chạy Sonnet 5.5 (kế hoạch Opus · High) — màn Lịch thi MỘT PHẦN nhưng do kế hoạch + dữ liệu.
  OV-15e2 "Opus 5.5 (Medium)" chỉ sửa máy chủ. #471 và #463 cùng Opus 5.5 mà kết quả khác xa → model không phải biến chính.

### Con số "≥ 35/40" — căn cứ
- Chỉ có ở đánh giá 17/10 (`2026-10-17-ov14-danh-gia-ux.md:1, 59-75`) và plan.md:18, :230: "đích ≥ 35 (37)", "Tổng 27 → 39–40 (sàn 35)". Đây là **đích dự kiến** =
  danh sách "việc làm điểm tăng", không phải số đo. Sau OV-15 không ai chấm lại (grep plan, đặc tả, mô tả PR).
- "Sàn 35" cần Nhất quán (4) và Nhận ra hơn nhớ (6) lên 4 — dựa vào "một thanh ngữ cảnh cùng chỗ mọi trang", "bộ lọc đang bật thành chip có ✕", "số bấm được trông như nút",
  "phép kiểm chặn màu / cỡ chữ lẻ". Cả bốn không vào kế hoạch nào → sàn 35 không thể đạt theo cách đã làm.

---

## Phần 3. Đề xuất quy trình [ĐỀ XUẤT — chủ SP duyệt trước khi ghi vào CLAUDE.md / plan.md]

| # | Chữ luật mới đề xuất | Ai làm | Kiểm thế nào |
|---|---|---|---|
| Q1 | plan.md 1.2 thêm: "PR có giao diện phải có **bảng truy vết**: mỗi khung mockup (tệp + chú thích khung) → thành phần / tệp web → Task → ảnh nghiệm thu. Thêm dòng **BỎ** (khối cũ trên màn phải xoá) và **GIỮ** (phần ngoài khung giữ nguyên). Thiếu bảng → không giao." | Planning khi viết kế hoạch | Số dòng bảng = số khung của màn (đếm `.nhan` / `.cap`); người rà đếm lại |
| Q2 | "Ảnh nghiệm thu là **ảnh cặp** mockup \| web, cùng vai, cùng dữ liệu, **toàn trang**, 1440 tối + 375 sáng; mô tả PR có bảng khung → KHỚP / KHÁC (lý do)." Đưa công cụ ghép (như `SCR/a6/ghepCap.mjs`) vào `scripts/`. | Session code | `docs/anh/pr-<x>/cap-*.png` đủ mọi dòng bảng Q1 |
| Q3 | "PR đổi bố cục chia theo **MÀN** (một màn một PR, sở hữu cả đầu trang, dải lọc, khối cũ); phần máy chủ tách PR riêng chạy trước. Chỉ song song khi khác màn." Bỏ câu "chia theo phạm vi tệp" cho loại PR này. | Planning | Không màn nào bị > 1 PR giao diện chạm trong một đợt |
| Q4 | "**Cổng độ khớp** trước merge: agent rà xem ảnh cặp, chấm từng dòng bảng; < 90 % KHỚP (KHÁC chỉ tính khi chủ SP đã đồng ý lý do) → không merge. Kết quả rà ghi thành **bình luận PR**." Thêm mục này vào mẫu 10B. | Planning / agent rà | Bình luận PR có bảng chấm; PR thiếu bình luận → chưa merge |
| Q5 | "PR đổi bố cục: chủ SP xem bản chạy (preview nhánh) hoặc 3–5 ảnh cặp, trả lời 'đạt / sửa' **trước merge**. Không merge qua đêm PR đổi bố cục." (PR máy chủ giữ luồng tự merge.) | Planning mở preview; chủ SP duyệt | Mỗi PR đổi bố cục có câu "chủ SP: đạt" trong bình luận |
| Q6 | CLAUDE.md "Khi các nguồn mâu thuẫn" thêm: "**Khung mockup đã duyệt thắng câu kế hoạch và mọi quyết định cũ hơn ngày duyệt**, trừ luật nghiệp vụ, quyền, chống mất dữ liệu. Quyết định mới trái khung → sửa mockup (hoặc ghi 'khung X thay bởi …') trong cùng PR tài liệu." | Planning | Không còn câu "theo plan §… trái mockup" trong mô tả PR mà mockup chưa sửa |
| Q7 | CLAUDE.md:40 sửa: "Tinh chỉnh, không làm lại — **trừ màn có mockup mới đã duyệt: làm lại theo khung, được xoá khối / component cũ không có trong khung**." DESIGN.md thêm mục "Mẫu trang" (đầu trang, dải lọc C10, khối). | Planning | Bảng BỎ (Q1) được làm đủ |
| Q8 | plan.md 1.3b tách hai loại: **sửa nhỏ** giữ như nay; **làm lại màn**: được `layout` + `polish` trong phạm vi, bấm thử ≥ 2 vòng (trước rà + sau sửa), ảnh toàn trang. Kế hoạch ghi rõ loại PR. | Planning | Kế hoạch có dòng "Loại PR" |
| Q9 | "PR làm lại màn được xoá / sửa phép kiểm đọc chuỗi nguồn khẳng định bố cục cũ (liệt kê trong bảng BỎ); không thêm phép kiểm chuỗi mới cho bố cục — dùng ảnh cặp." | Session code | Mô tả PR liệt kê phép kiểm bỏ / sửa |
| Q10 | "Mọi 'Tự quyết / lệch mockup / chưa xác minh' trong mô tả PR được chép vào plan.md mục 4 (mã khung + một dòng) **trước khi merge**; còn 'chưa xác minh' ở luồng chính → không merge." | Planning | grep "Chưa xác minh" trong PR đã merge = 0 |
| Q11 | "Seed phải dựng đủ trạng thái của từng khung mockup (tutor có buổi trong 2 tuần trước ngày demo, Lịch thi có em tháng tới, thi thật có kết quả), dùng **ngày demo**, không giờ thật. Ảnh PR chụp trên `npm run seed` nguyên." | PR seed nhỏ | Mở `/tutor`, Lịch thi, Kết quả thi › Thi thật trên demo đều có dòng |
| Q12 | "Mockup dựng từ thành phần thật: mở rộng `/dev/thanh-phan` thành sân mẫu (ChipSos, DauKetQua, PhanTrang, thẻ duyệt, dải lọc); mockup vẽ **cả trang**, có trạng thái rỗng và dữ liệu dày; thành phần mới ghi rõ 'MỚI' → kế hoạch có Task tạo nó." | Planning | Mockup không có dáng ngoài sân mẫu mà không ghi MỚI |
| Q13 | "Không nêu điểm Nielsen 'đạt' khi chưa chấm lại bằng cùng phương pháp trên bản đã merge." | Planning | Báo cáo đợt có bảng chấm lại |

**Thứ tự làm lại đề xuất**
1. Một PR tài liệu: Q1, Q2, Q4, Q5, Q6, Q8, Q10 vào CLAUDE.md / plan.md (sau khi chủ SP đồng ý Phần 4).
2. PR seed nhỏ (Q11) — để mọi ảnh sau so được trên cùng dữ liệu.
3. Làm lại theo màn (mỗi màn: rà lại khung → bảng truy vết → code → ảnh cặp → chủ SP duyệt): (1) Tổng quan QL (~40 %): đầu trang, Chờ duyệt dạng hàng,
   Tuần này theo khung — lấy lại cách của #471; (2) Hồ sơ lớp: khối điểm cuối trang (theo câu hỏi 3); (3) **Dải lọc C10 chung** — một lần cho mọi trang;
   (4) Công việc QL; (5) Phân tích GV + Báo cáo chế độ chiếu; (6) chip Kế hoạch Test; (7) ✓/✗ trước số toàn web (PR nền nhỏ, ~4 tệp).

---

## Phần 4. Câu hỏi cho chủ SP (≤ 4, có khuyến nghị)

1. **Nguồn nào thắng** khi kế hoạch / luật cũ khác khung đã duyệt (vd "không tự mở lớp" 27/09 vs khung "MB FT 101 đang mở"; luật một chữ vs nhãn mockup)?
   Khuyến nghị: **khung thắng**, trừ luật nghiệp vụ / quyền / chống mất dữ liệu (Q6).
2. Anh/chị có nhận thêm **một bước xem trước merge** cho PR đổi bố cục (3–5 ảnh cặp hoặc bản chạy, trả "đạt / sửa"; chậm ~nửa ngày mỗi PR)?
   Khuyến nghị: **có**, chỉ cho PR đổi bố cục; PR máy chủ vẫn tự merge.
3. Khối **"Điểm Mock Test của lớp"** cuối hồ sơ lớp: bỏ hẳn (vào bằng nút Nhập điểm → panel, đúng C16) hay chỉ hiện ở tab Học viên?
   Khuyến nghị: **bỏ, dùng nút Nhập điểm**.
4. **Báo cáo**: giữ là tab Phân tích (plan §7) hay theo mockup 3/6 (mở sáng, chữ lớn để chiếu)? Khuyến nghị: **giữ tab, thêm nút "Chiếu"** mở sáng + chữ lớn.

Ảnh cần thêm: không bắt buộc. Nếu chủ SP muốn đối chiếu bản #471: chỉ cần xem `SCR/anh/a6/pr471/03-tong-quan-ql-1440-toi.png`.

---

## Phần 5. Cặp ảnh "mockup | web thật" (ảnh ghép, `SCR/anh/a6/cap/`)

| Tệp | Thấy gì |
|---|---|
| `cap/01-tong-quan-dau-trang.png` | Đầu trang một hàng vs "Việc hôm nay" + banner + hàng riêng; Chờ duyệt dạng hàng vs thẻ to (A1, A2, A4) |
| `cap/02-tong-quan-tuan-nay.png` | Dải 6 thẻ tuần + bảng Test tuần này vs "Lịch sắp tới" cũ (A9) |
| `cap/03-hoc-vien-lop-tat-ca.png` | Dải lọc dính + hàng lớp tóm tắt SOS + lớp mở sẵn vs ô tìm, ô chọn, hàng lớp chỉ chip việc (C1, C3, C4) |
| `cap/04-ho-so-lop-ca-trang.png` | Khung chỉ khối bảng vs trang 5 000 px có lưới điểm 33 hàng phía dưới; ✓/✗ trước vs sau số (D5, D6) |
| `cap/05-phan-tich-gv.png` | Bảng gọn 7 cột vs bảng cũ 12 cột + câu giải thích dài (F5) |
| `cap/06-bao-cao.png` | Báo cáo sáng, chữ lớn để chiếu vs nền tối chữ thường (F3) |
| `cap/07-cong-viec-gv.png` | Panel lưới rộng hết vs bảng nửa panel + hàng nút thêm (B4) |
| `cap/08-ke-hoach-test.png` | Chip lịch 2 dòng + email vs chip cũ một dòng (E2) |
| `cap/09-tutor.png` | Bảng tutor Cần chú ý vs trang rỗng do dữ liệu demo (G4) |
| `cap/10-cong-viec-ql.png` | Danh sách rộng có cột Người vs bố cục hàng đợi hai cột (B7) |

Ảnh rời kèm theo: ảnh PR đã lộ lệch — `docs/anh/pr-ov15d/ql-tong-quan-1440-toi.png`, `pr-ov15d/ql-tong-quan-duoi-1440-toi.png`,
`pr-ov15b/cong-viec-gv-panel-1440-toi.png`, `pr-ov15e/05-phan-tich-gv-ql-1440-toi.png`; bản #471 đã đóng — `SCR/anh/a6/pr471/03-tong-quan-ql-1440-toi.png`;
khối điểm dưới tab Ý thức — `SCR/anh/a6/w2-hosolop-ythuc-p3.png`.
