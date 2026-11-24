# Khớp / khác — Chốt lộ trình panel 720 + trang Cuối khoá (mockup `thiet-ke/v25/chot-lo-trinh-panel.html`, chủ SP duyệt 25/11)

Ảnh cặp (mockup trái | web phải, cả màn): `cap-panel-1440.png` (A1) · `cap-panel-1280.png` (A7) · `cap-panel-375.png` (A8) · `cap-trang-1440.png` (B1) · `cap-trang-1280.png` (B2) · `cap-trang-375.png` (B3).
Web chụp lớp MB FOU 12 (7 em, chưa chốt) của dữ liệu demo — dữ liệu mockup (MB FOU 21, em đã chốt Lên FT) khác nên số dòng khác; so bố cục, cột, kiểu ô.

## Số đo (Playwright, web thật)

| | Mockup | Web |
|---|---|---|
| Panel 1440 / 1280: track lưới | 6 · 28 · 177–1fr · 68 · 112 × 3 · 6 | 6 · 28 · 197 (1440) / 176 (1280) · 76 · 112 × 3 · 6 |
| Panel: ô cuối cách mép | 14 | 15 (gồm viền 1) |
| Trang 1440: track | 2 · 28 · 280 · 96 · 283,3 × 3 · 2 | 2 · 28 · 280 · 96 · 286 × 3 · 2 |
| Trang 1280: track | … 230 × 3 | … 232,7 × 3 |
| Trang: ô cuối cách mép | 16 | 17 (gồm viền 1) |

## KHỚP

Bố cục panel (đầu · thanh công cụ · thanh Áp thẻ · lưới 5 cột · dải nhóm có Lớp + Tuần thẳng cột · hộp MT0 / Kỳ vọng dưới dòng · chân "Khi chốt" + Lưu nháp / Chốt), dải nhóm accent trái, "đã chốt" 🔒 + Sửa, chip lọc, trạng thái lỗi (Lỗi n · lý do ở dòng · "Thử lại n em"), Hoàn tác, trang cùng bảng, cột cân (ba ô nhập bằng nhau, Final căn giữa, ô cuối sát lề), 375 thẻ mỗi em.

## KHÁC (có lý do)

| Chỗ | Mockup | Web | Lý do |
|---|---|---|---|
| Ô Lớp | ô mờ có ▾ | ô tìm lớp có kính lúp (`ChonLop`, giữ gõ tìm) | giữ tính năng gõ tìm lớp; chữ "Chọn lớp" bị cắt còn "Chọn" ở 112 px |
| Ô Tuần | ô chữ "W3 SEP ▾" | ô tuần có nút lịch (`ONgay`) | giữ tính năng chọn tuần bằng lịch |
| Ô dòng "Ngay hôm nay" | "Ngay hôm nay" | "Hôm nay" (thanh Áp vẫn đủ chữ) | ô 112 px có nút lịch, không đủ chữ |
| Nút Đạt / Không đạt (Kỳ vọng) | đoạn chọn `.doan` | nút `btn-sm` có sẵn | giữ nút cũ, đổi kiểu sau nếu chủ SP muốn |
| Chip "Chờ bàn giao" | không ngày | ngày chỉ khi quá hạn | không chen vào ô Final |
| Đầu panel | ⓘ · ⋯ · ✕ | ⓘ · ✕, link "Mở ở trang riêng ›" cùng dòng meta | **Gia hạn không có đường ghi cho Chốt lộ trình** (hạn tính theo N20, không chặn; máy chủ chỉ có gia hạn cho hạn sau thi) — ⋯ chỉ còn một mục nên đưa thành link thẳng (luật không ⋯ một mục) |
| Dải nhóm / chip "đã sửa" | không vẽ | giữ chip "đã sửa" sau tên | giữ cũ: trạng thái nháp phải rõ |
| Ô Lớp / Tuần ở dòng không hướng | "—" | "—" | khớp |

## Thao tác TRƯỚC → SAU PR (mất thao tác nào = không có)

| Thao tác | Trước | Sau |
|---|---|---|
| Vào chốt từ Công việc | Bấm "Cuối khoá ›" → đổi trang | Bấm dòng → panel khe 720, danh sách ở lại |
| Chọn tất cả / nhóm / từng em, bỏ chọn | Có | Giữ |
| Lọc Chưa chốt · Xét lại · Còn bàn giao · Lỗi | Có | Giữ |
| Áp chung (Bước tiếp · Lớp · Tuần · Kỳ vọng FT) rồi sửa ngoại lệ | Một hàng | Thẻ Áp hai hàng, cùng thứ tự |
| Bước tiếp / lớp (gõ tìm, chi nhánh khác, + Mở lớp mới…) / tuần từng em | Có | Giữ |
| "Ngay hôm nay" + Hoàn tác | Nút cạnh tuần; toast Hoàn tác | Giữ; **tên em chuyển ngay hiện ở chân** |
| Lưu nháp · Chốt · Thử lại n em · Đóng | Chân dính | Giữ |
| Reset bậc vi phạm (N36) | Dòng chân | Giữ |
| Kỳ vọng FT (Đạt / Không đạt, nguyên nhân, kỹ năng, phương án) | Cột + hộp dưới dòng | Giữ, trong hộp dưới dòng em Lên FT |
| MT0 xem từng kỹ năng | Cột MT0 | Dòng MT0 trong hộp em Lên FT (bấm xem từng kỹ năng) |
| Dải "Kỳ vọng FT · n em …" + NutLuat | Có | Bỏ dải; luật Kỳ vọng vào ⓘ chung với quy chế |
| Target + KCK, Tạm dừng (quay lại học, tuần xem lại), Lý do | Hộp dưới dòng | Giữ |
| Sửa · Bỏ sửa · Huỷ quyết định (lý do, Hoàn tác) | Có | Giữ |
| Chip Chờ bàn giao → Bàn giao | Panel đè | **Thay trong khe**, "‹ Chốt lộ trình", phần đang sửa giữ |
| "+ Mở lớp mới…" | Panel đè | **Thay trong khe**, "‹ Chốt lộ trình", lớp mới điền vào ô |
| Nhận xét GVCN, bảng chỉ đọc cho vai khác | Có (trang) | Giữ (trang; panel dùng cùng thân, `coTheRaLenh` quyết quyền) |
| Hộp xác nhận nêu tên em khi chuyển ngay (N22 ③ cũ) | Không có trong code (DUONG-LUI-2: Hoàn tác) | Không hộp — chủ SP duyệt, `plan.md` N22 ③ đã sửa |
| Cột Lớp / Tuần chỉ hiện khi có em cần lớp | Hiện theo dữ liệu (bảng giật khi chọn hướng) | **Luôn có** ba ô cho QL (lưới đứng yên) |
| Mở trang Cuối khoá | Duy nhất | Còn: hồ sơ lớp / Tổng quan; panel có link "Mở ở trang riêng ›" |
