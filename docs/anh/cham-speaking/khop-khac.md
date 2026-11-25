# Chấm Speaking — khuôn A (mockup `thiet-ke/v26/cham-speaking.html`, PA A đã duyệt 25/11)

Ảnh cặp CẢ MÀN (trái mockup | phải web, vai GVBM Phạm Thu Trang — dữ liệu demo khác dữ liệu bịa của mockup nên tên lớp / số bài khác, bố cục là thứ so):
`cap-A1-1440-toi` · `cap-A2-1440-toi-panel` · `cap-A9-1440-toi-tim-hoc-vien` · `cap-A10-1280-toi-panel` · `cap-A6-375-sang` · `cap-A7-375-sang-panel` (tạo bằng `scripts/anh-cap.mjs`).
Chưa chụp cặp: A3 (hết bài lớp), A4 (một lớp), A5 / A8 (rỗng) — cần dữ liệu riêng; trạng thái đó đã kiểm tay (xem "Chưa kiểm").

## 1. Truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh |
|---|---|---|
| Nửa trái danh sách cố định, nửa phải "Lớp của tôi" / panel | `HoTroHocVienTab`: tab `cham-cheo` cột `calc(50% - 12px) · 1fr` (không đổi khi mở / đóng panel) | A1, A2, A10 |
| Ô Tìm học viên đầu danh sách, lọc xuyên lớp | `ChamSpeakingMuc` (ô + kính lúp), `locQ` trên dữ liệu đã tải | A1, A9 |
| Đầu nhóm "Chấm Speaking n bài · m quá hạn" | `DaiNhom` (trung tính) qua `veDai`; số theo bộ lọc (A9) | A1, A9 |
| Dòng lớp: lớp · n em · thông tin · hạn | `.cvA-v` (khuôn A có sẵn); thông tin chỉ mã tuần: "W4 AUG, W1 SEP · 8 bài · 6 quá hạn" | A1, A6 |
| Xếp theo hạn, quá hạn lên đầu | `gom` (`chamSpeakingChung.ts`) — thay `soSanhLopCham` | A1 |
| Chi nhánh khác gập, chip CN đầu cột thông tin | mục gập thứ hai, tải `?cn=khac` khi mở | A1 |
| Panel của đúng một lớp | `PanelChamSpeaking` (`?lc=`): đầu "lớp · ĐỦ mã tuần · n bài · hạn", GV chấm, lưới FT, Đã có điểm | A2, A7, A10 |
| Chân panel | "Lớp tiếp: {mã} ›" → hết lớp "Việc tiếp ›"; "✓ Đã lưu n bài" | A2, A7 |
| 375: hai tầng | CSS khuôn A có sẵn | A6, A7 |

Cổng KHỚP: ước 92 % (bố cục, cột, màu, cỡ chữ, vị trí nửa trái / phải khớp; lệch ở các mục KHÁC dưới đây).

## 2. Thao tác TRƯỚC → SAU
| Trước | Sau |
|---|---|
| Một dòng "4 lớp · 20 em · 22 bài" | Mỗi lớp một dòng, xếp theo hạn |
| Bấm → panel nhiều lớp, ngăn gập | Bấm dòng → panel của đúng lớp (`?lc=`) |
| Ô "GV chấm" mỗi ngăn | Một ô ở đầu panel (cùng lưu lớp × đợt) |
| Ô tìm trong panel | Ô tìm đầu danh sách, lọc xuyên lớp (dòng ghi em khớp + n bài · tuần) |
| Chi nhánh khác gập cuối panel | Mục gập dưới danh sách; bấm dòng mở panel lớp đó |
| "Lớp tiếp: {mã} ›" trong lưới / "Việc tiếp ›" ở chân | Giữ cả hai (chân: lớp tiếp theo thứ tự danh sách; hết lớp: Việc tiếp) |
| Tuần dưới tên em mọi dòng | Chỉ khi lớp có nhiều tuần / lượt |
| Nhập điểm S, Vắng, Đổi GV chấm, Đã có điểm, Lưu · bài tiếp, ⓘ quy chế | GIỮ nguyên (lưới `LuoiFT` không đổi) |
| Rỗng "Không có bài…" ở panel | "Bạn hết bài Speaking chờ chấm" ở danh sách (+ Việc tiếp khi có) |
Badge tab vẫn đếm bài; chấm chéo không vào số đầu trang (T18). Không thêm request: danh sách dùng `/my-work/cham-speaking` (trước đây tải khi mở panel); panel dùng lại bản đã tải (`dungBanLuu`), lưu ở panel thì danh sách nhận bản mới (`chiNghe`).

## 3. KHÁC mockup (có lý do) / [XM]
- **Đầu panel** ghi đủ mã tuần ("W4 AUG, W1 SEP · 8 bài") — chủ SP sửa khác mockup.
- **[XM] Chân panel không có nút "Lưu" riêng** (mockup A2 / A7): web lưu từng ô qua hộp nhập ("Lưu · bài tiếp ›"), không có bản nháp cả lưới để một nút Lưu chung lưu. Chân giữ "Lớp tiếp ›" / "Việc tiếp ›". Nếu chủ SP muốn nút Lưu chung → PR riêng (đổi cách lưu).
- Lưới trong panel là `LuoiFT` có sẵn (cột Kết quả "Chờ S" cả ở 375, ô nhập mở hộp tại ô) — mockup vẽ ô nhập sẵn tại chỗ; giữ thao tác cũ.
- Nhiều tuần trong một lớp: lưới giữ thứ tự cũ (tuần mới trước, rồi tên); mockup xếp theo tên.
- Rỗng: chưa có dòng "Còn: Chấm điểm · 1 việc" (danh sách không biết việc còn lại ở tab khác); tab có thể biến mất khi hết bài (luật tab cũ) — "Chi nhánh khác" khi đó chỉ vào được lúc còn bài.
- QL "Tất cả" (nhiều GV S, nhiều việc Chấm Speaking) giữ dòng gộp cũ; một người (Của tôi / Của GV) dùng khuôn mới.
- Nút Lọc thêm / + Task, tab "Thêm ▾" khi panel mở: hành vi chung có sẵn, không đổi.
- Thứ tự dòng thay `soSanhLopCham` (lớp thường lên đầu) bằng hạn sớm nhất (điểm 1 trong ghi chú mockup); `soSanhLopCham` vẫn dùng ở Chấm Test.

## 4. Chưa kiểm
Soi cân cột / ✕ ⋯ ≤ 1 px bằng số đo; ảnh A3 / A4 / A5 / A8; thử lưu một ô S thật và "Lớp tiếp ›" cuối danh sách (đã thấy nút, chưa bấm lưu).
