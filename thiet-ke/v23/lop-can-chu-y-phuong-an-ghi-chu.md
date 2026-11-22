# v23 · Lớp cần chú ý — 3 phương án (A · B · C)

Mockup: [`lop-can-chu-y-phuong-an.html`](lop-can-chu-y-phuong-an.html) · ảnh `anh/lop-can-chu-y-A|B|C-1440-toi.png`, `-375-sang.png`.
Lý do: chủ SP 22/11 xem ma trận "cũng chưa được… đổi tiếp" → PTA giao vẽ 3 cách, **cùng dữ liệu** (Admin Monbay, 8 việc / 5 lớp, hôm nay 23/11/2026), cùng khung Tổng quan Admin 1440 / 375. Ô "Cần xử lý" khớp dữ liệu (Điểm 25 bài · 4 lớp = 6 + 2 + 6 + 11; Báo cáo PH 2 lớp; Lịch thi 2 em; Hồ sơ 0).

| | Cách thể hiện | Bấm → mở | Ưu | Nhược |
|---|---|---|---|---|
| **A · Việc gấp nhất** | danh sách phẳng ≤ 6 hàng, mỗi hàng một việc: hạn (màu) · lớp · việc + số + chip kỹ năng · người phụ trách nhỏ (mỗi người một dòng); xếp theo hạn; "Xem hết ›" | hàng → panel việc; lớp → hồ sơ lớp; "Xem hết ›" → Công việc | trả lời thẳng "làm gì trước", không ô trống, đủ chỗ chip + người | mất góc "lớp nào tệ nhất"; gần trùng trang Công việc |
| **B · Thẻ lớp** | lưới 3 cột thẻ, mỗi thẻ: lớp · n việc + ≤ 3 dòng (chấm màu · loại · số · hạn dd/mm/yyyy); có quá hạn → viền trái đỏ | thẻ → panel lớp (đủ hạn, người, chip kỹ năng) | nhìn theo lớp, gọn, 375 thành một cột tự nhiên | dòng trong thẻ cắt ngắn (người + chip chỉ trong panel); 5 thẻ để trống 1 ô |
| **C · Ma trận gọn** | ma trận không viền ô, chấm màu + số, hàng 36 px, chiếm ~60 %; Tình hình đứng cạnh (4 số dọc) | ô → panel lớp + loại | thấp nhất, giữ so sánh lớp × loại, trang ngắn lại | vẫn là bảng số, cần chú giải chấm; nhiều ô trống; hạn / người chỉ trong panel |

- Theo 60-30-10 (màu chỉ ở hạn / chấm), luật hạn (dd/mm/yyyy — B cũng ghi đủ năm dù PTA gợi ý "hạn ngắn", vì luật hạn chủ SP "đổi hết thành ngày tháng năm"), chip kỹ năng (A; B / C trong panel).
- Sửa kèm: `tong-quan.html` ma trận Admin bỏ ô "MB FOU 12 × Hồ sơ" cho khớp ô "Hồ sơ thiếu ✓ không có" (trước lệch).
- PTA khuyến nghị (ghi khi chủ SP xem): ___
