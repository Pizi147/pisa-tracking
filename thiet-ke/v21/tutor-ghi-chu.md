# v21 Ⓣ2 · Trang Tutor — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/tutor.html` + `tutor.css` (chỉ phần riêng; `v21.css`, `bang-mau.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-19-tutor/05-de-bai-mockup.md` mục Ⓣ2 (R2.1–R2.12) + G1–G6; luật `02-luat.md` TU12–TU16.
Nền bố cục / nội dung: `thiet-ke/mockup-v4-phan-tich-tutor.html` khung t1–t3 + `-truy-vet.md` (chủ SP duyệt 22/10) · `thiet-ke/mockup-tutor-1-head-tutor-2026-10-19.html` mục 4, 5. Hình ảnh: bộ chuẩn v21 (`bang-mau`, `phan-tich`, `luu-tru`).
Mã đang ẩn: `web/src/modules/tutor/TutorPage.tsx`, `PanelTutor.tsx`, `HopTutor.tsx`, `TaiDanhSach.tsx`.
Ảnh: `thiet-ke/v21/anh/tutor/` — `<khung>-1440-toi.png`, `<khung>-1440-sang.png`, `<khung>-375-sang.png` (+ `-375-toi`) · **ảnh cặp `cap-<khung>.png`** = TRƯỚC (web thật) │ SAU (mockup) · `truoc/` = ảnh web thật.
TRƯỚC chụp từ web thật: worktree này, `npm run seed`, dev cổng 4471 / 5471, route `/tutor` + mục menu bật TẠM cục bộ (đã hoàn lại, không commit); vai Head tutor (userId 25), Head Monbay (2), CX (24); ngày demo seed 14/09/2026. `document.fonts.check('600 14px "Be Vietnam Pro"')` = true ở mọi ảnh, trước và sau.
SAU: dữ liệu 19/11/2026 (W3 NOV), khoảng mặc định W4 OCT → W3 NOV. Tên người bịa (tutor lấy từ seed).

## 0. Lời chủ SP trong session này

Chưa có (session con chạy từ PTA Tutor; chưa có lời chủ SP nào gửi trực tiếp).

## 1. Bảng truy vết dòng R → khung

Lập TRƯỚC khi vẽ (skill brainstorming: đề bài 05 đã được chủ SP duyệt nên dùng làm bản thiết kế, chỗ chưa rõ ghi [XM], không hỏi lại). Ảnh cặp: `cap-t1`, `cap-t2`, `cap-t4`, `cap-t5`, `cap-p1`, `cap-p3`, `cap-h2`, `cap-h2-sua`, `cap-h3`, `cap-h4`, `cap-e1`, `cap-m1`, `cap-m2`, `cap-m4` (H1 Xuất số buổi là MỚI — không có TRƯỚC).

| R | Nội dung | Khung |
|---|---|---|
| R2.1 | Menu "Tutor" sau Phân tích; 375 trong "Thêm"; GV không có | T1 (Head tutor: Tổng quan · Tutor), T4 (Head: … Phân tích · Tutor), T5 (CX), M3 (375 "Thêm" → Tutor) |
| R2.2 | Một bảng "Người dạy" 9 cột, nhãn GV / Tutor, tỉ lệ "Có / có trả lời", "—", "Không" → cam + lý do chữ | T1, T2 (đủ 12 hàng: GV, tutor, không trả lời, 0 buổi, Ngừng), T4, T5, E1 |
| R2.3 | Đầu trang một hàng: tiêu đề · Khoảng tuần · tìm · Lọc ▾ · Xuất số buổi · Tải danh sách · Thêm tutor; Head / CX khác nút | T1, T3 (Lọc ▾ mở), T4 (Head: đủ ba nút), T5 (CX: chỉ Xuất số buổi) |
| R2.4 | Chip có số Cần chú ý · Đang dạy · Ngừng · Tất cả; mặc định tự lùi; không "Việc của bạn" | T1 (mặc định Cần chú ý), E1 (Cần chú ý = 0 → Đang dạy), E3 (Đang dạy), T4 (ⓘ mở: định nghĩa) |
| R2.5 | Dải "n tên gõ tay … · m buổi · Gộp…" (Head tutor, QT, Head trong chi nhánh) | T1, T4 (Head: 1 tên của Monbay), E1 (26 tên · 59 buổi); không có ở T5 (CX) |
| R2.6 | Panel: đầu + Sửa / Hồ sơ GV ›, dải 5 số lọc, Nhận xét (Head tutor / QT sửa; Head / CX đọc), dòng thời gian Sửa · Xoá, bảng Kết quả đã ghi + "Chỉ dòng có Không", dùng khoảng của trang, không link HV / Case | P1 (mở từ số → lọc sẵn), P2 (sau lưu), P3 (Head mở GV — chỉ đọc), P4 (lỗi lưu · thiếu ô · đang lưu · tải · lỗi tải), M2 |
| R2.7 | Xuất số buổi: hộp chọn khoảng tháng → Excel người dạy × tháng (+ loại, nơi dạy); đang xuất / lỗi | H1, H1b (nội dung tệp) |
| R2.8 | Thêm / Sửa tutor: Tên * · SĐT · Nơi dạy chính · Kỹ năng *; Head cố định chi nhánh / Chỉ online; lỗi tại ô; trùng tên nhắc; thiếu SĐT / nơi dạy = chữ nhỏ dưới tên | H2 (4 trạng thái), M4 (375), T2 hàng "Bùi Quang Minh" |
| R2.9 | Tải danh sách (panel) + Gộp tên gõ tay (hộp, ô chọn có tìm mẫu A, gợi ý cả GV) + Hoàn tác | H4, H3 |
| R2.10 | Rỗng lần đầu (danh bạ trống — bản chính) · lọc không khớp · đang tải · lỗi + Thử lại · chỉ xem không 403 · 40 người phân trang 20 · 0 buổi | E1, E2, E3, T2 (0 buổi), T5 + P3 (chỉ xem) |
| R2.11 | 375: thẻ (tên + nhãn · KN · nơi dạy │ lý do / kết luận │ Buổi · 3 tỉ lệ một hàng │ ★); bộ lọc ≤ 120 px; panel toàn màn + ‹ Quay lại | M1, M2, M3, M4 |
| R2.12 | Một tên một khái niệm: "Người dạy" · "Tutor" · "Buổi" · "Kết luận"; không IN HOA; không chú thích tĩnh; định nghĩa → ⓘ | mọi khung; ⓘ ở T4 (Cần chú ý · Đang dạy · Ngừng · Có / có trả lời · Buổi), H4 (cột tệp) |

## 2. Bảng khung → thành phần web hiện có → TRƯỚC → SAU

| Khung | Thành phần (web) | TRƯỚC (`TutorPage` …, đang ẩn) | SAU (mockup) | GIỮ / ĐỔI / BỎ |
|---|---|---|---|---|
| T1 | Route + menu | ẩn (AN-TUTOR, `dieuHuong.ts:59`, `App.tsx:425`) | mục "Tutor" sau Phân tích cho Head tutor · Head · QT · CX | ĐỔI (mở lại) |
| T1 | Tiêu đề + `BoChonThoiGian` | `Tutor` + W1 SEP → W2 SEP (bộ chọn Phân tích, có "Toàn bộ") | `Tutor` + Khoảng tuần ô tuần → ô tuần, mặc định 4 tuần gồm tuần này, không "Toàn bộ" | ĐỔI (G10) |
| T1 | Ô tìm "Tìm tên hoặc SĐT" | hàng thứ hai, cuối | cùng hàng đầu trang | GIỮ chức năng, ĐỔI chỗ |
| T1 | `<select>` Nơi dạy (chỉ người sửa) + `<select>` Kỹ năng | hai ô trên hàng chip | gom vào "Lọc ▾" (Nơi dạy · Kỹ năng · Loại GV / Tutor), số bộ lọc đang bật trên nút | ĐỔI (R2.3) + THÊM Loại |
| T1 | Nút "Thêm tutor" (phụ) · "⤒ Tải danh sách" (chính) | Tải danh sách là nút chính | **Thêm tutor** chính · Tải danh sách phụ · **Xuất số buổi** phụ (mới) | ĐỔI thứ bậc + THÊM |
| T1 | `BoLocDoan` 5 chip | Cần chú ý · Đang dạy · Ngừng hợp tác · Thiếu thông tin · Tất cả | Cần chú ý · Đang dạy · Ngừng · Tất cả + ⓘ | BỎ chip "Thiếu thông tin" (R2.8), ĐỔI chữ "Ngừng" |
| T1 | Mặc định chip | Cần chú ý nếu > 0, không thì Đang dạy (có thể ra trống — ảnh TRƯỚC Head: "Không có tutor khớp bộ lọc") | Cần chú ý → Đang dạy → Tất cả; không bao giờ mở ra trống | ĐỔI (R2.4) |
| T1 | Dải "n tên gõ tay … · Gộp…" | có (chỉ người sửa) | giữ, mỏng; Head thấy phần chi nhánh mình | GIỮ + mở cho Head |
| T1 | Bảng `<table>` tự viết | 10 cột (Tutor · Nơi dạy · Kỹ năng · Buổi · Chuẩn bị · Tài liệu đúng hạn · Feedback GV · Đánh giá · Kết luận · Cần chú ý vì), SĐT dòng hai, cuộn ngang < 1180 | 9 cột, nhóm đầu cột "Có / có trả lời", tên + nhãn GV / Tutor một dòng, cột "Kết luận / lý do" gộp hai cột cũ; không cuộn ngang ở 1280 | ĐỔI (R2.2; dáng bảng chuẩn ⑩) |
| T1 | Hàng | chỉ tutor danh bạ | người dạy = tutor danh bạ **+ GV có buổi** | THÊM (TU12) |
| T2 | Ô tỉ lệ `OTyLe` "0/1" cam bấm được | "0/1" | "1 / 5" cam đậm bấm được (gạch khi rê); không trả lời → "—" | GIỮ, ĐỔI dáng chữ |
| T2 | Tutor 0 buổi | "0" + năm dấu "—" | một ô gộp "chưa có buổi trong khoảng" | ĐỔI (nền v4) |
| T2 | SĐT dưới tên | luôn hiện | bỏ khỏi bảng (SĐT ở đầu panel); dưới tên chỉ "thiếu SĐT · thiếu nơi dạy" khi thiếu | ĐỔI (R2.8) |
| T2 | Hàng Ngừng hợp tác | mờ (`hang-mo`) | mờ, cuối bảng | GIỮ |
| T4 | Head (QL) | chỉ xem, không nút, không dải gộp | Thêm tutor · Tải danh sách · Xuất số buổi · dải gộp (chi nhánh mình); nhận xét chỉ đọc | ĐỔI (TU13) |
| T5 | CX | 403 (không có `tutor.view`) | xem trang + panel + Xuất số buổi; không nút sửa, không dải gộp | ĐỔI (TU12) |
| P1 | `PanelTutor` (`KhungPanel` rộng) | tên · SĐT · nơi dạy · KN + Sửa / Bổ sung · bộ chọn thời gian thứ hai · "Cần chú ý vì: …" · 5 ô số · Nhận xét · Buổi dạy | đầu: tên + nhãn · SĐT · nơi dạy · KN · khoảng (của trang) · Sửa (tutor) / Hồ sơ GV › (GV) · dải 5 số · Nhận xét (dòng "Cần chú ý: …" trong khối) · Kết quả đã ghi | BỎ bộ chọn thời gian thứ hai (R2.6), ĐỔI "Bổ sung" → "Sửa" (một chữ cho một thao tác) |
| P1 | Form nhận xét | Kết luận * + Nhận xét * ≥ 10 ký tự | Kết luận * + Nhận xét * ≥ 8 ký tự, bộ đếm "7 / 8" | ĐỔI (R2.6) |
| P1 | Bảng "Buổi dạy" | Ngày · HV · lớp · KN · Hình thức · 3 tiêu chí · ★ · Nhận xét buổi | **Kết quả đã ghi**: Ngày ghi · Học viên (lớp · ghi: người ghi) · KN · **Buổi** · Chuẩn bị · Tài liệu · Feedback GV · Đánh giá · Nội dung (+ Về tutor) | ĐỔI (R2.6), BỎ cột Hình thức (TU3 bản 2) |
| P1 | Nút "Chỉ buổi chưa đạt n" | có "Không" hoặc ≤ 2 sao | công tắc "Chỉ dòng có Không n"; ≤ 2 sao lọc qua ô "Đánh giá" của dải 5 số | ĐỔI chữ (R2.6) |
| P2 | Sau lưu | toast "Đã lưu nhận xét", form trống (v4 đề xuất tự mở người kế) | ở lại, "✓ Đã lưu nhận xét · giờ" xanh, nút chính thành **Người cần chú ý tiếp ›** | ĐỔI (V12) — [XM-4] |
| P3 | Người dạy là GV | — | không "Sửa"; "Hồ sơ GV ›"; QL chỉ đọc + câu "Head tutor hoặc Quản trị viết nhận xét và kết luận." | MỚI |
| P4 | Lỗi / thiếu / đang lưu / tải | `loiForm` "n ô cần sửa ↑", lỗi chung dưới form, `Skeleton`, `ErrorState` | cùng hành vi, dáng v21 (lỗi tại ô, dòng lỗi ở chân, khung xương, bao-lỗi một dòng) | GIỮ hành vi |
| H1 | Xuất số buổi | — | hộp nhỏ: Từ tháng · Đến tháng (mặc định tháng này) → Xuất Excel; đang xuất · lỗi giữ chọn | MỚI (TU14) |
| H2 | `HopTutor` (Modal) | Tên * · SĐT (chữ phụ "Để trống được, bổ sung sau.") · Nơi dạy chính `<select>` · Kỹ năng `NutChon`; Xoá tutor khi chưa có buổi | giữ 4 ô; chữ phụ dưới SĐT → chữ mờ trong ô; Head: Nơi dạy = đoạn [chi nhánh · Chỉ online]; lỗi SĐT "SĐT đã có: {tên}" tại ô; trùng tên nhắc | GIỮ + ĐỔI cho Head |
| H3 | `HopGop` | mỗi tên một dòng + `ChonNguoi` (Tên gần giống · Khác) + "+ Thêm vào danh sách"; "Gộp n tên"; toast Hoàn tác | ô chọn có tìm mẫu A, nhóm **Tên gần giống · Giáo viên · Tutor**, dòng phụ (loại · nơi dạy · KN · 3 số cuối SĐT) | GIỮ luồng, THÊM GV (R2.9, TU4) |
| H4 | `TaiDanhSach` (KhungPanel) | Chọn tệp / Dán từ Excel · Tải mẫu · câu "Cột: …" tĩnh · xem trước + lọc Mới / Cập nhật / Lỗi · ô sửa tại dòng lỗi · "Lưu n dòng" | giữ hết; câu "Cột: …" vào ⓘ cạnh Tải mẫu | GIỮ, BỎ chú thích tĩnh |
| E1 | `Empty` "Chưa có tutor nào trong danh sách" (cả trang) | trang chỉ có một câu | dòng "Chưa có tutor trong danh sách · Tải danh sách · Thêm tutor" ở đầu bảng; GV có buổi vẫn hiện; dải gộp 26 tên | ĐỔI (R2.10) |
| E2 | `Empty` lọc không khớp · `Skeleton` · `ErrorState` | có | một câu + Bỏ lọc · khung xương có đầu cột · "⚠ Không tải được … · Thử lại" | GIỮ hành vi, dáng v21 |
| E3 | `PhanTrang` trên + dưới (20 / trang) | có | giữ trên (thanh đầu bảng) + dưới | GIỮ |
| M1–M4 | `TheDong` 375 | thẻ: tên + SĐT + nơi dạy · KN + 5 dòng nhãn / giá trị | thẻ gọn: tên + nhãn + ★ · KN · nơi dạy · lý do / kết luận · bốn ô số một hàng; Thêm tutor + ⋯; panel toàn màn + ‹ Quay lại | ĐỔI (R2.11) |

## 3. Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác (mã hiện có) | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| Đổi khoảng thời gian | `BoChonThoiGian` (có Toàn bộ) | Khoảng tuần (không Toàn bộ) | G10 / R2.3 — "Toàn bộ" chỉ ở Phân tích |
| Lọc chip | 5 chip | 4 chip | "Thiếu thông tin" thành chữ dưới tên (R2.8) |
| Lọc Nơi dạy (Tất cả · chi nhánh · Chỉ online · Chưa có) | `<select>` | Lọc ▾ › Nơi dạy (cùng lựa chọn) | giữ |
| Lọc Kỹ năng | `<select>` một KN | Lọc ▾ › Kỹ năng | giữ (chọn được nhiều) |
| Lọc Loại GV / Tutor | — | Lọc ▾ › Loại | mới |
| Tìm tên / SĐT | ô tìm | ô tìm | giữ |
| Phân trang | trên + dưới | trên + dưới | giữ |
| Mở panel người dạy | bấm tên | bấm tên / hàng | giữ |
| Mở panel lọc sẵn | bấm tỉ lệ cam | bấm tỉ lệ cam | giữ |
| Thêm tutor | nút phụ | nút chính | giữ |
| Tải danh sách (Chọn tệp · Dán · Tải mẫu · Xem trước · lọc kết quả · sửa ô dòng lỗi · Lưu n dòng) | panel | panel | giữ đủ; câu cột vào ⓘ |
| Gộp tên gõ tay + "+ Thêm vào danh sách" + Hoàn tác | hộp | hộp | giữ; gợi ý thêm GV |
| Sửa / Bổ sung tutor | nút trong panel | "Sửa" trong panel | một chữ |
| Xoá tutor (chưa có buổi) + xác nhận | trong hộp Sửa | trong hộp Sửa | giữ |
| Lọc kết quả bằng 5 ô số (gồm ≤ 2 sao) | có | có | giữ |
| "Chỉ buổi chưa đạt" | nút | "Chỉ dòng có Không" | đổi chữ; ≤ 2 sao qua ô Đánh giá |
| Đổi khoảng thời gian trong panel | bộ chọn thứ hai | **bỏ** — đổi ở trang | R2.6 |
| Viết nhận xét + kết luận | Head tutor / QT | Head tutor / QT | giữ |
| Sửa nhận xét (Lưu sửa · Bỏ sửa) | của mình | của mình | giữ |
| Xoá nhận xét + xác nhận | của mình | của mình | giữ |
| Sau lưu nhận xét | toast, ở lại | ở lại "✓ Đã lưu" + Người cần chú ý tiếp › | V12 |
| Xuất số buổi (Excel) | — | hộp | mới (TU14) |
| Mở hồ sơ GV từ panel | — | "Hồ sơ GV ›" | mới (người dạy là GV) |

Không mất thao tác nào; một thao tác bỏ có lý do (bộ chọn thời gian thứ hai trong panel — R2.6, nền v4 đã BỎ).

## 4. [XM] — chỗ đề bài chưa rõ / đụng luật khác (đã chọn cách đơn giản nhất, làm tiếp)

| # | Chỗ | Đã chọn | Cần ai chốt |
|---|---|---|---|
| XM-1 | Tỉ lệ "Có / có trả lời" đếm theo **lần ghi** (dòng) hay theo **buổi** (một dòng 2 buổi trả lời một lần) | theo **lần ghi** — đúng cái GV trả lời, khớp TU16 "dòng không trả lời không vào mẫu số"; chữ lý do "4 lần Không" | PTA Tutor |
| XM-2 | "Cần chú ý", nhận xét + kết luận áp cả **GV** trong bảng? (TU16 nói "tutor") | áp cả GV — một bảng một luật; GV thì "Sửa" thay bằng "Hồ sơ GV ›" | PTA Tutor / chủ SP |
| XM-3 | "Tháng" của buổi khi xuất (buổi không có ngày riêng — `00` mục 2.3) | tháng của **ngày ghi kết quả** | PTA Tutor (ghi vào kế hoạch PR TU2-x) |
| XM-4 | Sau "Lưu nhận xét": v4 (22/10) "tự mở tutor cần chú ý kế" ↔ V12 (26/10, mới hơn) "ở lại + nút tiếp" | V12: ở lại, "✓ Đã lưu nhận xét", nút chính **Người cần chú ý tiếp ›** | — (luật mới hơn thắng) |
| XM-5 | Phạm vi Head: hàng nào, sửa được tutor nào | hàng = người dạy có buổi với em chi nhánh mình + tutor nơi dạy chi nhánh mình; **sửa** tutor có nơi dạy = chi nhánh mình (Thêm cho chọn chi nhánh mình hoặc Chỉ online); tutor chi nhánh khác: không "Sửa" | PTA Tutor |
| XM-6 | Menu Head tutor: web hiện "Tổng quan · Tutor" (Tổng quan rỗng — `00` mục 2.4) | vẽ như web; đề xuất: trang đầu Head tutor (không kèm vai GV) = Tutor; 375 không thanh dưới (một mục, như web / v4) | chủ SP |
| XM-7 | Nhận xét tối thiểu: mã 10 ký tự ↔ R2.6 "≥ 8" | 8 (đề bài mới hơn, khớp luật 8 ký tự ở nơi khác) | — |
| XM-8 | Tên gõ tay (chưa gộp) có vào tệp Excel số buổi? | có, dòng "{tên} (gõ tay)", loại "—" — để tổng buổi đúng; gộp xong thì vào tên người | PTA Tutor |
| XM-9 | CX / Head thấy SĐT đầy đủ? (TU15: GV chỉ thấy 3 số cuối) | Head tutor · QT · Head · CX thấy đủ trong panel; bảng không hiện SĐT | PTA Tutor |
| XM-10 | Ô "Lọc ▾ › Nơi dạy" của Head | đủ mọi chi nhánh (người dạy em Monbay có thể ở chi nhánh khác) | — |
| XM-12 | Xoá nhận xét: mã dùng hộp xác nhận; luật "không khoá cứng" (11/11) ưu tiên Hoàn tác | giữ hộp xác nhận như mã (không đổi hành vi trong mockup) | PTA Tutor |
| XM-11 | Dòng ghi cũ (mỗi buổi một dòng, có Hình thức — TU19) trong bảng Kết quả đã ghi | hiện như dòng mới, cột Buổi = 1; Hình thức không hiện (cột bỏ) | PTA Tutor |

## 5. Tự rà từng R

| R | Đạt / Chưa | Chỗ trong mockup |
|---|---|---|
| R2.1 menu sau Phân tích · 375 trong "Thêm" · GV không có | Đạt | T1, T4, T5, M3 (GV không có khung — không có mục Tutor) |
| R2.2 một bảng, đủ 9 cột, nhãn GV / Tutor, tỉ lệ "Có / có trả lời", "—", "Không" cam + lý do chữ, không điều khiển trong đầu cột | Đạt | T2 (12 hàng đủ loại) |
| R2.3 đầu trang một hàng; Head có Thêm + Tải; CX chỉ Xuất | Đạt | T1, T3, T4, T5 |
| R2.4 chip có số, mặc định tự lùi, không "Việc của bạn" | Đạt | T1, E1, E3 |
| R2.5 dải gộp đúng vai | Đạt | T1, T4, E1; T5 không có |
| R2.6 panel đủ phần; Head / CX chỉ đọc; không bộ chọn thứ hai; không link HV | Đạt | P1, P2, P3, P4, M2 |
| R2.7 hộp Xuất số buổi + đang xuất / lỗi; bảng không thêm cột tháng | Đạt | H1, H1b |
| R2.8 Thêm / Sửa 4 ô; Head cố định; lỗi tại ô; trùng tên nhắc; thiếu = chữ nhỏ | Đạt | H2, M4, T2 |
| R2.9 Tải danh sách + Gộp (mẫu A, gợi ý GV) + Hoàn tác | Đạt | H3, H4 |
| R2.10 đủ 7 trạng thái | Đạt | E1, E2, E3, T2, T5, P3 |
| R2.11 375 thẻ, bộ lọc ≤ 120 px, panel toàn màn ‹ Quay lại | Đạt — bộ lọc 96 px | M1–M4 |
| R2.12 chữ thống nhất, không IN HOA, không chú thích tĩnh, ⓘ | Đạt | mọi khung; T4, H4 (ⓘ) |
| Tiêu chí: Head tutor tới người cần chú ý đầu ≤ 3 bấm | Đạt — mở trang (mặc định Cần chú ý) → bấm hàng → Lưu nhận xét | T1 → P1 → P2 |
| Tiêu chí: ≤ 10 cột không cuộn ngang ở 1280 | Đạt — 9 cột, khung T2 rộng 1280 | T2 |
| Tiêu chí: ✕ / ⋯ thẳng hàng ≤ 1 px | Đạt — đo bằng script (mục 6) | P1–P3, H1–H4, M1 |
| Tiêu chí: danh bạ trống không ra trang trắng | Đạt | E1 |
| Tiêu chí: thao tác TRƯỚC → SAU không mất | Đạt | mục 3 |

## 6. Cổng chất lượng (đo bằng script trên trang mockup, Edge headless)

- ✕ / ⋯ / ✕ bỏ chọn: 21 chỗ, lệch tâm dọc so với nút / tiêu đề cùng hàng **≤ 0,1 px** (trước sửa: ✕ hộp nhỏ lệch 5–6 px → đã sửa).
- Bảng T2 ở khung 1280: `scrollWidth` 1230 = `clientWidth` 1230 → **không cuộn ngang**, 9 cột.
- 375 M1: bộ lọc (hàng khoảng tuần + tìm + Lọc → hết chip) **100 px ≤ 120**; chip cao 44.
- Chữ < 12 px: không có (▾ đã nâng 12). Không chữ IN HOA. `document.fonts` Be Vietnam Pro = true.
- Bộ dò impeccable (`detect`): 0 lỗi thật trong khung web — các mục báo là ghi chú mockup (`.so-mk`, `.ghi`), lớp phủ cố ý, hoặc thành phần của `v21.css` (`.viec.chon`, không dùng ở trang này).

## 7. Critique (impeccable `critique`, hai đánh giá độc lập: A thiết kế + ui-ux-pro-max, B bộ dò)

| Vòng | Điểm | P0 / P1 | Đã sửa |
|---|---|---|---|
| 1 | 30 / 40 | P1 ×2: 375 dải gộp hai dòng làm dày đầu trang; chưa vẽ cách giữ chữ nhận xét khi rời panel | dải gộp 375 một dòng; P4 thêm hộp "Bỏ nhận xét đang viết? · Bỏ nhận xét / Viết tiếp" (V19); cùng đợt: cột HV 200 (tên không cắt, dòng phụ cắt "…"), "Ngừng hợp tác" thống nhất, eyebrow "Tutor", ⓘ Tải danh sách ngắn, ô sửa dòng lỗi tại chỗ, Kết luận đang chọn nền nhấn + đậm, câu ai làm được ngắn, ✕ hộp thẳng hàng |
| 2 | **33 / 40** | **không còn** | ô Nhận xét thấp hơn để thấy bảng sớm hơn; đệm cuối panel 375 |

Heuristic vòng 2: Trạng thái 4 · Khớp đời thực 3 · Kiểm soát 3 · Nhất quán 4 · Phòng lỗi 4 · Nhận ra 3 · Linh hoạt 3 · Tối giản 3 · Phục hồi lỗi 3 · Trợ giúp 3.
Theo cổng (≥ 35, chạm 30 thì tối đa 2 vòng, sau đó chỉ cần không P0 / P1): **đạt** — 2 vòng, không còn P0 / P1.

P2 / P3 còn lại (để PTA Tutor quyết, không tự làm):
- P2 p1: ở 900 px bảng Kết quả đã ghi chỉ lộ 1–2 dòng dưới form nhận xét — có thể gập dòng thời gian nhận xét còn mục mới nhất + "Xem thêm" (chưa làm: thêm một thao tác gập).
- P2 h4: ⓘ cột mở đè dòng tên tệp (popover, đóng được).
- P3: "Xoá nhận xét" hiện là hộp xác nhận (giữ như mã) — luật "không khoá cứng" gợi ý thay bằng Hoàn tác 10 s; [XM-12].
- P3: đỏ lặp ba lần trên hàng cần chú ý (ô tỉ lệ, ★, lý do) — đúng luật "không chỉ màu", để nguyên.

## 8. Dòng đọc (Turso)

Trang đầu: một câu `/tutors?tu&den` như nay (đo cũ 17–18 câu · 65 dòng seed) + thêm GV có buổi — cùng bảng `case_followup_buoi` đã đọc, không thêm câu nếu gộp theo `nguoi_day` trong cùng truy vấn. Panel: `/tutors/:id` như nay. Xuất số buổi: một câu GROUP BY người dạy × tháng trên `case_followup_buoi` trong khoảng tháng (chỉ khi bấm). Không thêm request lúc mở trang.
