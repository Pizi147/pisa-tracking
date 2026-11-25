# Chấm Speaking — khuôn A (mockup `thiet-ke/v26/cham-speaking.html`, PA A đã duyệt 25/11)

Ảnh cặp CẢ MÀN (trái mockup | phải web, vai GVBM Phạm Thu Trang — dữ liệu demo khác dữ liệu bịa của mockup nên tên lớp / số bài khác, bố cục là thứ so):
`cap-A1-1440-toi` · `cap-A2-1440-toi-panel` · `cap-A9-1440-toi-tim-hoc-vien` · `cap-A10-1280-toi-panel` · `cap-A6-375-sang` · `cap-A7-375-sang-panel` (tạo bằng `scripts/anh-cap.mjs`).
Thêm `cap-A4-1440-toi-mot-lop` (GV một lớp + Chi nhánh khác mở, vai Vũ Gia Hân), `cap-A3-1440-toi-het-bai-lop`, `cap-A3-375-sang-het-bai-lop`. A5 / A8: xem mục 3.

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
- **Chân panel không có nút "Lưu" riêng** (mockup A2 / A7) — PTA đồng ý 25/11: web lưu từng ô ngay qua hộp nhập ("Lưu · bài tiếp ›"), không có nháp cả lưới; nút Lưu không làm gì là sai. Chân giữ "Lớp tiếp ›" / "Việc tiếp ›"; trạng thái lưu (đang lưu / đã lưu / lỗi) hiện ở từng ô như cũ.
- **QL nhiều GV S**: cũng mỗi lớp một dòng — mỗi GV một mục "Chấm Speaking · {tên GV}" (`?lc=` + `?ln=` GV). Chưa kiểm bằng dữ liệu demo (QL "Tất cả" demo không có việc S nào).
- Lưới trong panel là `LuoiFT` có sẵn (cột Kết quả "Chờ S" cả ở 375, ô nhập mở hộp tại ô) — mockup vẽ ô nhập sẵn tại chỗ; giữ thao tác cũ.
- Nhiều tuần trong một lớp: lưới giữ thứ tự cũ (tuần mới trước, rồi tên); mockup xếp theo tên.
- **Rỗng (A5 / A8) không chụp cặp** (PTA chốt 25/11): GV hết bài thì không còn việc Chấm Speaking → không có tab, đúng luật "không thêm thứ không ảnh hưởng đầu ra" (không đổi máy chủ). Mẫu rỗng ("Bạn hết bài Speaking chờ chấm" + "Còn: {tab} · n việc" + "Việc tiếp ›") đã code, chỉ hiện khi còn tab.
- **A3 (hết bài một lớp)** đã chụp cặp: `cap-A3-1440-toi-het-bai-lop` (vai Bùi Hải Yến, chấm hết HD FT 302 bằng thao tác thật: dòng rời danh sách, đầu nhóm 9 → 6 bài, lưới đứng yên, đầu panel "đã chấm 3 bài", chân "✓ Đã lưu 3 bài · Lớp tiếp: HD FT 306 ›") và `cap-A3-375-sang-het-bai-lop` (mockup không có A3 ở 375 — bên trái là A7).
- **Bỏ ⋯ ở đầu panel** (mockup có): panel không có thao tác phụ để đặt vào (PTA đồng ý).
- Nút Lọc thêm / + Task, tab "Thêm ▾" khi panel mở: hành vi chung có sẵn, không đổi.
- Thứ tự dòng thay `soSanhLopCham` (lớp thường lên đầu) bằng hạn sớm nhất (điểm 1 trong ghi chú mockup); `soSanhLopCham` vẫn dùng ở Chấm Test.

## 4. Đo
Playwright (1440 / 1280 / 375): ⓘ và ✕ đầu panel cùng tâm dọc (lệch 0 px), cùng cỡ 36 × 36 (375: 44 × 44); các dòng lớp thẳng cột trái / em / thông tin (0 px), cột hạn lệch ≤ 0,2 px. Mockup có ⋯ ở đầu panel; web không vẽ ⋯ vì panel không có thao tác phụ để đặt vào.

## 5. Audit
- `impeccable audit` (detector `impeccable detect` trên `ChamSpeakingMuc.tsx` + `PanelChamSpeaking.tsx`): 0 anti-pattern; 1 ghi chú — cỡ chữ 16 px ngoài thang DESIGN.md (16 nằm trong thang K-CHU-1 12·13·14·16·20·26 của dự án, bỏ qua). Soát a11y / theme / responsive: không P0 / P1 (ô tìm có `aria-label` + `name`, kính lúp `aria-hidden`, dòng lớp có nút thật bên trong, màu theo token, vùng chạm 44 px ở 375, hạn có chữ).
- `web-design-guidelines` (Vercel): không P0 / P1; đã sửa P2 ô tìm thiếu `name`. Dòng lớp là `div onClick` có `button` bên trong (mẫu khuôn A có sẵn — bàn phím dùng nút).
- Đã thử lưu thật: chấm 3 ô S → PUT `/attempts/:id/scores/speaking`, dòng lớp rời danh sách, "Lớp tiếp ›" đúng.
