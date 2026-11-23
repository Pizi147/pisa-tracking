# Danh sách ô số bấm được — Phân tích + Tổng quan (hiện trạng 24/11/2026)

Ngày demo 14/09/2026 · main `f3ca7708d` · chụp bằng Playwright (Edge), 1440 × 900 tối · 1280 × 800 tối · 375 × 812 sáng.
Mỗi dòng = MỘT LOẠI ô số (cùng khối, cùng cột); "×n" = số ô cùng loại trên màn. Ảnh: `<màn>-<số>-<cỡ>.png` (cả màn lúc panel mở), `<màn>-0-trang-<cỡ>.png` (cả trang).
Loại ô mở ra CÙNG khuôn panel với một loại đã chụp thì không lưu ảnh riêng — cột Ảnh ghi "như …". Số đo lấy bằng script (bề rộng × cao của panel, px).

Tổng: **136 loại ô số** trên 11 màn · **32 khuôn panel khác nhau** (có ảnh 3 cỡ).

## Chi nhánh (Báo cáo HV) — vai Head

Cả trang: [1440](cn-0-trang-1440.png) · [1280](cn-0-trang-1280.png) · [375](cn-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Học viên đang học ×1 | 51 | số trơn 62 × 58, chữ 48px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 671 px) | [1440](cn-01-1440.png) · [1280](cn-01-1280.png) · [375](cn-01-375.png) |
| 02 | Vào học trong kỳ ×1 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 3 | như cn-01 |
| 03 | Kết thúc học trong kỳ ×1 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 1 | như cn-01 |
| 04 | Đạt MT ×1 | 57 % | số trơn 115 × 58, chữ 48px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 10 (cuộn thêm 89 px) | [1440](cn-04-1440.png) · [1280](cn-04-1280.png) · [375](cn-04-375.png) |
| 05 | Tiến bộ ×1 | 40 % | số trơn 115 × 58, chữ 48px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Kỹ năng · Trước · Sau · Chênh · Kỳ vọng | 20 (cuộn thêm 357 px) | [1440](cn-05-1440.png) · [1280](cn-05-1280.png) · [375](cn-05-375.png) |
| 06 | Theo lớp › HV đang học ×6 | 33 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 696 px) | như cn-01 |
| 07 | Theo lớp › Đạt MT · HV ×5 | 56 % | ô viền 53 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 8 | như cn-04 |
| 08 | Theo lớp › Tiến bộ · lượt ×4 | 20 % | ô viền 53 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Kỹ năng · Trước · Sau · Chênh · Kỳ vọng | 15 (cuộn thêm 62 px) | như cn-05 |
| 09 | Tiến bộ theo kỹ năng › ↑ Tăng ×5 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Trước · Sau · Chênh · Kỳ vọng | 3 | [1440](cn-09-1440.png) · [1280](cn-09-1280.png) · [375](cn-09-375.png) |
| 10 | Tiến bộ theo kỹ năng › Giữ nguyên ×5 | 5 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Trước · Sau · Chênh · Kỳ vọng | 5 | như cn-09 |
| 11 | Tiến bộ theo kỹ năng › ↓ Giảm ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Trước · Sau · Chênh · Kỳ vọng | 1 | như cn-09 |

## Chi nhánh · Lớp thường — vai Head

Cả trang: [1440](cn-thuong-0-trang-1440.png) · [1280](cn-thuong-0-trang-1280.png) · [375](cn-thuong-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Học viên đang học ×1 | 52 | số trơn 62 × 58, chữ 48px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 671 px) | như cn-01 |
| 02 | Vào học trong kỳ ×1 | 56 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 671 px) | như cn-01 |
| 03 | Kết thúc học trong kỳ ×1 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 1 | như cn-01 |
| 04 | Đạt Test ×1 | 25 % | số trơn 115 × 58, chữ 48px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 5: Học viên · Lớp · Bài · Tổng hợp · Tổng | 1 (cuộn thêm 353 px) | [1440](cn-thuong-04-1440.png) · [1280](cn-thuong-04-1280.png) · [375](cn-thuong-04-375.png) |
| 05 | Cuối khoá · Đạt ×1 | 11 | ô viền 46 × 30, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 5: Học viên · Lớp · Bài · Tổng hợp · Tổng | 1 (cuộn thêm 289 px) | như cn-thuong-04 |
| 06 | Cuối khoá · 60–69 % ×1 | 8 | ô viền 40 × 30, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 8: Học viên · Lớp · Bài · L · R · W · S · Tổng | 4 (cuộn thêm 97 px) | [1440](cn-thuong-06-1440.png) · [1280](cn-thuong-06-1280.png) · [375](cn-thuong-06-375.png) |
| 07 | Cuối khoá · 50–59 % ×1 | 7 | ô viền 40 × 30, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 5: Học viên · Lớp · Bài · Tổng hợp · Tổng | 2 (cuộn thêm 33 px) | như cn-thuong-04 |
| 08 | Cuối khoá · < 50 % ×1 | 4 | ô viền 40 × 30, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 8: Học viên · Lớp · Bài · L · R · W · S · Tổng | 1 | như cn-thuong-06 |
| 09 | Theo lớp ›  / HV đang học ×6 | 4 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 4 | như cn-01 |
| 10 | Theo lớp ›  / Đạt Test · bài ×6 | 25 % | ô viền 53 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Lớp · Tổng hợp · Tổng | 1 | [1440](cn-thuong-10-1440.png) · [1280](cn-thuong-10-1280.png) · [375](cn-thuong-10-375.png) |
| 11 | Theo lớp › Cuối khoá / Đạt ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Lớp · Tổng hợp · Tổng | 1 | như cn-thuong-10 |
| 12 | Theo lớp › Cuối khoá / 60–69 % ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Lớp · Tổng hợp · Tổng | 1 | như cn-thuong-10 |
| 13 | Theo lớp › Cuối khoá / 50–59 % ×4 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Lớp · Tổng hợp · Tổng | 2 | như cn-thuong-10 |
| 14 | Theo lớp › Cuối khoá / < 50 % ×2 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · L · R · G+V · P · Tổng | 1 | [1440](cn-thuong-14-1440.png) · [1280](cn-thuong-14-1280.png) · [375](cn-thuong-14-375.png) |

## SOS (Test + PA) — vai Head

Cả trang: [1440](sos-0-trang-1440.png) · [1280](sos-0-trang-1280.png) · [375](sos-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Lượt MT · 10 tuần ×1 | 53 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 20 (cuộn thêm 757 px) | [1440](sos-01-1440.png) · [1280](sos-01-1280.png) · [375](sos-01-375.png) |
| 02 | SOS 1 · 10 tuần ×1 | 4 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 4 | như sos-01 |
| 03 | SOS 2 · 10 tuần ×1 | 4 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 4 | như sos-01 |
| 04 | SOS 3 · 10 tuần ×1 | 5 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 5 | như sos-01 |
| 05 | Thiếu điểm · 10 tuần ×1 | 6 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 6 | như sos-01 |
| 06 | Chưa chốt PA · 10 tuần ×1 | 31 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Case · Phụ trách · Hạn | 8 | [1440](sos-06-1440.png) · [1280](sos-06-1280.png) · [375](sos-06-375.png) |
| 07 | Theo tuần › Kết quả / Lượt MT ×14 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 08 | Theo tuần › Dưới kỳ vọng · HV / R ×10 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 09 | Theo tuần › Kết quả / SOS 1 ×5 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 2 | như sos-01 |
| 10 | Theo tuần › Kết quả / SOS 2 ×5 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 11 | Theo tuần › Kết quả / Thiếu điểm ×5 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 12 | Theo tuần › Dưới kỳ vọng · HV / L ×10 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 2 | như sos-01 |
| 13 | Theo tuần › Dưới kỳ vọng · HV / S ×8 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 14 | Theo tuần › Xử lý / HV có Case ×10 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 3 | như sos-01 |
| 15 | Theo tuần › Xử lý / Case ×10 | 4 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Case · Phụ trách · Hạn | 7 | như sos-06 |
| 16 | Theo tuần › Xử lý / Chưa chốt PA ×7 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Case · Phụ trách · Hạn | 5 | như sos-06 |
| 17 | Theo tuần › Xử lý / Đang xử lý ×6 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Case · Phụ trách · Hạn | 2 | như sos-06 |
| 18 | Theo tuần › Dưới kỳ vọng · HV / W1 ×4 | 5 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 5 | như sos-01 |
| 19 | Theo tuần › Dưới kỳ vọng · HV / W2 ×4 | 5 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 5 | như sos-01 |
| 20 | Theo tuần › Kết quả / SOS 3 ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như sos-01 |
| 21 | PA nào hiệu quả › PA có kết quả ×1 | 10 | ô viền 41 × 30, chữ 16px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Case · PA · Kết quả · Người phụ trách | 10 (cuộn thêm 42 px) | [1440](sos-21-1440.png) · [1280](sos-21-1280.png) · [375](sos-21-375.png) |
| 22 | PA nào hiệu quả › Có cải thiện ×1 | 9 | ô viền 40 × 30, chữ 16px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Case · PA · Kết quả · Người phụ trách | 9 | như sos-21 |

## SOS · Lớp thường — vai Head

Cả trang: [1440](sos-thuong-0-trang-1440.png) · [1280](sos-thuong-0-trang-1280.png) · [375](sos-thuong-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Bài kiểm tra · 9 tuần ×1 | 52 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 8: Học viên · Lớp · Bài · L · R · G+V · P · Tổng | 11 (cuộn thêm 940 px) | [1440](sos-thuong-01-1440.png) · [1280](sos-thuong-01-1280.png) · [375](sos-thuong-01-375.png) |
| 02 | Progress Test (theo môn) · 1 môn trượt · 9 tuần ×1 | 9 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Bài · L · R · G+V · P | 7 (cuộn thêm 83 px) | [1440](sos-thuong-02-1440.png) · [1280](sos-thuong-02-1280.png) · [375](sos-thuong-02-375.png) |
| 03 | Progress Test (theo môn) · ≥ 2 môn trượt · 9 tuần ×1 | 7 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Bài · L · R · G+V · P | 5 | như sos-thuong-02 |
| 04 | Thiếu điểm · 9 tuần ×1 | 4 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Bài · L · R · G+V · P | 4 | như sos-thuong-02 |
| 05 | Theo tuần › Bài kiểm tra ×14 | 12 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Lớp · Tổng hợp · Tổng | 4 (cuộn thêm 35 px) | như cn-thuong-10 |
| 06 | Theo tuần › Thiếu điểm ×6 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · L · R · G+V · P | 1 | [1440](sos-thuong-06-1440.png) · [1280](sos-thuong-06-1280.png) · [375](sos-thuong-06-375.png) |
| 07 | Theo tuần › Progress Test (theo môn) / 1 môn trượt ×6 | 8 | số trơn 26 × 22, chữ 12px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · L · R · G+V · P | 6 | như sos-thuong-06 |
| 08 | Theo tuần › Progress Test (theo môn) / ≥ 2 môn trượt ×7 | 2 | số trơn 26 × 22, chữ 12px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · L · R · G+V · P | 2 | như sos-thuong-06 |
| 09 | PA nào hiệu quả › PA có kết quả ×1 | 2 | ô viền 40 × 30, chữ 16px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Case · PA · Kết quả · Người phụ trách | 2 | như sos-21 |
| 10 | PA theo quy chế › Số PA ×1 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Case · PA · Kết quả · Người phụ trách | 2 | như sos-21 |
| 11 | PA theo quy chế › HV ×1 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Case · PA · Kết quả · Người phụ trách | 1 | như sos-21 |

## Thi thật — vai Quản trị

Cả trang: [1440](thi-0-trang-1440.png) · [1280](thi-0-trang-1280.png) · [375](thi-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Đạt · trừ KCK ×1 | 2 | ô viền 40 × 30, chữ 16px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 2 | [1440](thi-01-1440.png) · [1280](thi-01-1280.png) · [375](thi-01-375.png) |
| 02 | Chưa đạt · trừ KCK ×1 | 1 | ô viền 40 × 30, chữ 16px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 03 | Chưa có KQ ×1 | 1 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 1 | như cn-01 |
| 04 | Từng kỹ năng › HV ×4 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 3 | [1440](thi-04-1440.png) · [1280](thi-04-1280.png) · [375](thi-04-375.png) |
| 05 | Từng kỹ năng › Vượt ×2 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 06 | Từng kỹ năng › Đạt ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 07 | Từng kỹ năng › Chưa đạt ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 08 | Theo GV › HV ×10 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | [1440](thi-08-1440.png) · [1280](thi-08-1280.png) · [375](thi-08-375.png) |
| 09 | Theo GV › Chưa đạt ×6 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 10 | Theo GV › Vượt ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 11 | Theo GV › Đạt ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 12 | Danh sách kết quả › L ×3 | ✓ 7.0 | ô viền 55 × 30, chữ 14px | hộp neo cạnh số | 404 × 208 | 404 × 208 | 375 × 264 | danh sách dòng (không bảng) | 0 | [1440](thi-12-1440.png) · [1280](thi-12-1280.png) · [375](thi-12-375.png) |
| 13 | Danh sách kết quả › R ×3 | ✓ 7.5 | ô viền 55 × 30, chữ 14px | hộp neo cạnh số | 404 × 208 | 404 × 208 | 375 × 264 | danh sách dòng (không bảng) | 0 | như thi-12 |
| 14 | Danh sách kết quả › W ×3 | ✗ 6.5 | ô viền 55 × 30, chữ 14px | hộp neo cạnh số | 404 × 322 | 404 × 322 | 375 × 382 | danh sách dòng (không bảng) | 0 | như thi-12 |
| 15 | Danh sách kết quả › S ×3 | ✓ 7.0 | ô viền 55 × 30, chữ 14px | hộp neo cạnh số | 404 × 208 | 404 × 208 | 375 × 264 | danh sách dòng (không bảng) | 0 | như thi-12 |

## Giáo viên — vai Head

Cả trang: [1440](gv-0-trang-1440.png) · [1280](gv-0-trang-1280.png) · [375](gv-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 15 bài chưa làm — xem theo GV ×1 | 15 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | danh sách dòng (không bảng) | 6 (cuộn thêm 39 px) | [1440](gv-01-1440.png) · [1280](gv-01-1280.png) · [375](gv-01-375.png) |
| 02 | 4 việc chưa làm — xem theo GV ×1 | 4 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | danh sách dòng (không bảng) | 4 | như gv-01 |
| 03 | S chéo chung ×1 | 8 | ô viền 26 × 22, chữ 12px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Bài · Hạn · Trạng thái | 10 (cuộn thêm 32 px) | [1440](gv-03-1440.png) · [1280](gv-03-1280.png) · [375](gv-03-375.png) |
| 04 | Giáo viên › Chấm Test · bài / Đúng hạn ×5 | 8 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Bài · Hạn · Trạng thái | 11 (cuộn thêm 67 px) | như gv-03 |
| 05 | Giáo viên › Chấm Test · bài / Chưa làm ×4 | 5 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Bài · Hạn · Trạng thái | 6 | như gv-03 |
| 06 | Giáo viên › Việc / Chưa làm ×2 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | 5: Học viên · Việc · Lớp · Hạn · Trạng thái | 1 | [1440](gv-06-1440.png) · [1280](gv-06-1280.png) · [375](gv-06-375.png) |
| 07 | Giáo viên ›  / Đạt kỳ vọng Test · lượt ×3 | 100 % | ô viền 62 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 6 | như sos-01 |
| 08 | Giáo viên › Việc / Đúng hạn ×2 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | 5: Học viên · Việc · Lớp · Hạn · Trạng thái | 2 | như gv-06 |

## Ý thức — vai Head

Cả trang: [1440](yt-0-trang-1440.png) · [1280](yt-0-trang-1280.png) · [375](yt-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | HV cần chú ý ×1 | 5 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Vi phạm · Chưa xử lý · Bậc hiện tại · Lần xử lý gần nhất | 5 | [1440](yt-01-1440.png) · [1280](yt-01-1280.png) · [375](yt-01-375.png) |
| 02 | Vi phạm ×1 | 51 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 20 (cuộn thêm 757 px) | [1440](yt-02-1440.png) · [1280](yt-02-1280.png) · [375](yt-02-375.png) |
| 03 | Chưa xử lý ×1 | 14 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 14 (cuộn thêm 298 px) | như yt-02 |
| 04 | Lớp có vi phạm ×1 | 2 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 5: Lớp · GVCN · HV có vi phạm · Vi phạm · Chưa xử lý | 2 | [1440](yt-04-1440.png) · [1280](yt-04-1280.png) · [375](yt-04-375.png) |
| 05 | Học viên cần chú ý › Vi phạm ×5 | 6 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 6 | như yt-02 |
| 06 | Học viên cần chú ý › Chưa xử lý ×4 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 3 | như yt-02 |
| 07 | Lớp nhiều vi phạm › Vi phạm ×6 | 45 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 20 (cuộn thêm 757 px) | như yt-02 |
| 08 | Lớp nhiều vi phạm › Chưa xử lý ×5 | 14 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Ngày · Vi phạm · Người ghi · Trạng thái | 14 (cuộn thêm 298 px) | [1440](yt-08-1440.png) · [1280](yt-08-1280.png) · [375](yt-08-375.png) |
| 09 | Lớp nhiều vi phạm › HV có vi phạm ×6 | 12 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 6: Học viên · Lớp · Vi phạm · Chưa xử lý · Bậc hiện tại · Lần xử lý gần nhất | 12 | như yt-01 |

## Tổng quan (Head) — vai Head

Cả trang: [1440](tq-0-trang-1440.png) · [1280](tq-0-trang-1280.png) · [375](tq-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Em SOS cần chú ý ×1 | 12 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 12 (cuộn thêm 116 px) | [1440](tq-01-1440.png) · [1280](tq-01-1280.png) · [375](tq-01-375.png) |
| 02 | Giáo viên4 có việc quá hạnⓘ › Quá hạn ×3 | 8 | số trơn 25 × 21, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 8 | [1440](tq-02-1440.png) · [1280](tq-02-1280.png) · [375](tq-02-375.png) |
| 03 | Giáo viên4 có việc quá hạnⓘ › Loại ×9 | 4 chấm | số trơn 55 × 20, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | không có ô này ở cỡ màn này | danh sách dòng (không bảng) | 4 | như cn-01 |
| 04 | Lớp cần chú ý6 lớp › Case chưa PA ×2 | 3 em | ô viền 45 × 22, chữ 12px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 3 | [1440](tq-04-1440.png) · [1280](tq-04-1280.png) · [375](tq-04-375.png) |
| 05 | Lớp cần chú ý6 lớp › Điểm ×5 | 52 bài | ô viền 54 × 22, chữ 12px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 15 (cuộn thêm 214 px) | [1440](tq-05-1440.png) · [1280](tq-05-1280.png) · [375](tq-05-375.png) |
| 06 | Lớp cần chú ý6 lớp › Meeting ×1 | 4 em | số trơn 42 × 20, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 4 | [1440](tq-06-1440.png) · [1280](tq-06-1280.png) · [375](tq-06-375.png) |
| 07 | Lớp cần chú ý6 lớp › SOS 2–3 ×1 | 7 em | số trơn 33 × 17, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 7 | như cn-01 |
| 08 | Tình hìnhW1 SEP – W2 SEP › Đạt MT ×1 | 67 % | số trơn 48 × 24, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như cn-04 |
| 09 | Tình hìnhW1 SEP – W2 SEP › SOS 1 ×1 | 5 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 5 | như cn-01 |
| 10 | Tình hìnhW1 SEP – W2 SEP › SOS 2 ×1 | 5 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 5 | như cn-01 |
| 11 | Tình hìnhW1 SEP – W2 SEP › SOS 3 ×1 | 7 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 7 | như cn-01 |

## Chi nhánh · Quản trị (mọi chi nhánh) — vai Quản trị

Cả trang: [1440](cn-qt-0-trang-1440.png) · [1280](cn-qt-0-trang-1280.png) · [375](cn-qt-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Học viên đang học ×1 | 74 | số trơn 62 × 58, chữ 48px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 671 px) | như cn-01 |
| 02 | Vào học trong kỳ ×1 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 3 | như cn-01 |
| 03 | Kết thúc học trong kỳ ×1 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 2 | như cn-01 |
| 04 | Đạt MT ×1 | 66 % | số trơn 115 × 58, chữ 48px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 10 (cuộn thêm 89 px) | như cn-04 |
| 05 | Tiến bộ ×1 | 40 % | số trơn 115 × 58, chữ 48px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Kỹ năng · Trước · Sau · Chênh · Kỳ vọng | 20 (cuộn thêm 357 px) | như cn-05 |
| 06 | Đạt Target · trừ KCK ×1 | 100 % | số trơn 122 × 48, chữ 40px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 07 | Em thi ×1 | 1 | số trơn 26 × 48, chữ 40px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 08 | Chưa có KQ ×1 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 1 | như cn-01 |
| 09 | Theo chi nhánh › HV đang học ×6 | 51 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 20 (cuộn thêm 671 px) | như cn-01 |
| 10 | Theo chi nhánh › Đạt MT · HV ×4 | 57 % | ô viền 53 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 10 (cuộn thêm 89 px) | như cn-04 |
| 11 | Theo chi nhánh › Tiến bộ · lượt ×3 | 40 % | ô viền 53 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 7: Học viên · Lớp · Kỹ năng · Trước · Sau · Chênh · Kỳ vọng | 20 (cuộn thêm 357 px) | như cn-05 |
| 12 | Theo chi nhánh › Thi thật ×2 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 9: Học viên · Lớp · Ngày thi · L · R · W · S · OVR · Target | 1 | như thi-01 |
| 13 | Tiến bộ theo kỹ năng › ↑ Tăng ×5 | 3 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 0 | như cn-01 |
| 14 | Tiến bộ theo kỹ năng › Giữ nguyên ×5 | 6 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 0 | như cn-01 |
| 15 | Tiến bộ theo kỹ năng › ↓ Giảm ×3 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 0 | như cn-01 |

## Giáo viên · Quản trị — vai Quản trị

Cả trang: [1440](gv-qt-0-trang-1440.png) · [1280](gv-qt-0-trang-1280.png) · [375](gv-qt-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 39 bài chưa làm — xem theo GV ×1 | 39 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | danh sách dòng (không bảng) | 11 (cuộn thêm 421 px) | như gv-01 |
| 02 | 4 việc chưa làm — xem theo GV ×1 | 4 | số trơn 17 × 31, chữ 26px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | danh sách dòng (không bảng) | 4 | như gv-01 |
| 03 | Giáo viên · tất cả chi nhánh › Chấm Test · bài / Đúng hạn ×4 | 8 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Bài · Hạn · Trạng thái | 11 (cuộn thêm 67 px) | như gv-03 |
| 04 | Giáo viên · tất cả chi nhánh › Chấm Test · bài / Chưa làm ×2 | 5 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 4: Học viên · Bài · Hạn · Trạng thái | 6 | như gv-03 |
| 05 | Giáo viên · tất cả chi nhánh › Việc / Chưa làm ×1 | 1 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | 5: Học viên · Việc · Lớp · Hạn · Trạng thái | 1 | như gv-06 |
| 06 | Giáo viên · tất cả chi nhánh ›  / Đạt kỳ vọng Test · lượt ×2 | 100 % | ô viền 62 × 30, chữ 14px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 6 | như sos-01 |
| 07 | Giáo viên · tất cả chi nhánh › Việc / Đúng hạn ×2 | 2 | ô viền 40 × 30, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | 5: Học viên · Việc · Lớp · Hạn · Trạng thái | 2 | như gv-06 |

## Tổng quan (Quản trị) — vai Quản trị

Cả trang: [1440](tq-qt-0-trang-1440.png) · [1280](tq-qt-0-trang-1280.png) · [375](tq-qt-0-trang-375.png)

| # | Ô số (khối › cột) | Ví dụ | Dáng ô | Mở gì | Cỡ panel 1440 | 1280 | 375 | Cột | Dòng | Ảnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Em SOS cần chú ý ×1 | 13 | số trơn 34 × 31, chữ 26px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 13 (cuộn thêm 187 px) | như cn-01 |
| 02 | Giáo viên10 có việc quá hạnⓘ › Quá hạn ×5 | 8 | số trơn 25 × 21, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 8 | như cn-01 |
| 03 | Giáo viên10 có việc quá hạnⓘ › Loại ×13 | 4 chấm | số trơn 55 × 20, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | không có ô này ở cỡ màn này | danh sách dòng (không bảng) | 4 | như cn-01 |
| 04 | Lớp cần chú ý10 lớp › Case chưa PA ×3 | 3 em | ô viền 45 × 22, chữ 12px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 3 | như cn-01 |
| 05 | Lớp cần chú ý10 lớp › Điểm ×5 | 52 bài | ô viền 54 × 22, chữ 12px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 15 (cuộn thêm 214 px) | như cn-01 |
| 06 | Lớp cần chú ý10 lớp › Meeting ×1 | 4 em | số trơn 42 × 20, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 4 | như cn-01 |
| 07 | Lớp cần chú ý10 lớp › SOS 2–3 ×2 | 7 em | số trơn 33 × 17, chữ 14px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 7 | như cn-01 |
| 08 | Tình hìnhW1 SEP – W2 SEP › Đạt MT ×1 | 75 % | số trơn 48 × 24, chữ 20px | panel phải (phủ nền mờ) | 1080 × 803 | 960 × 703 | 375 × 707 | 10: Học viên · Lớp · MT · L · R · W1 · W2 · S · OVR · Kỳ vọng | 1 | như cn-04 |
| 09 | Tình hìnhW1 SEP – W2 SEP › SOS 1 ×1 | 6 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 6 | như cn-01 |
| 10 | Tình hìnhW1 SEP – W2 SEP › SOS 2 ×1 | 5 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 5 | như cn-01 |
| 11 | Tình hìnhW1 SEP – W2 SEP › SOS 3 ×1 | 8 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 8 | như cn-01 |
| 12 | Tình hìnhW1 SEP – W2 SEP › Thi tháng này ×1 | 2 | số trơn 13 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 2 | [1440](tq-qt-12-1440.png) · [1280](tq-qt-12-1280.png) · [375](tq-qt-12-375.png) |
| 13 | Tình hìnhW1 SEP – W2 SEP › Đạt Target thi thật ×1 | 1 / 1 | số trơn 46 × 24, chữ 20px | panel phải (phủ nền mờ) | 835 × 803 | 742 × 703 | 375 × 707 | danh sách dòng (không bảng) | 1 | [1440](tq-qt-13-1440.png) · [1280](tq-qt-13-1280.png) · [375](tq-qt-13-375.png) |
