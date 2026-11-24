# Panel số Phân tích: cao hết như panel Công việc (#2119, chủ SP 25/11)

Sửa MỘT chỗ: `web/src/ui/KhungPanel.tsx`, khuôn `so720` (dùng chung mọi panel số: `BangLuotPanel`, `SoLieu` báo cáo / Case chưa chốt PA).
HopNeo (kết quả thi thật của từng HV) không đổi.

## TRƯỚC → SAU

| Thao tác / hình | TRƯỚC | SAU |
|---|---|---|
| Chiều cao panel | `max-h-full`, cao theo số dòng; 1 dòng = thẻ nhỏ nổi trên trang, đè đầu bảng bên dưới | `h-full`: từ đáy thanh menu tới đáy màn, như Công việc; danh sách ngắn chừa trống bên dưới |
| Đầu panel | trôi theo thẻ | cố định ở đỉnh; thân tự cuộn (`overflow-y-auto`) khi dài |
| Viền dưới thẻ (`border-b`) | có | bỏ (panel chạm đáy màn) |
| Nền mờ / khoá cuộn trang | không | không đổi — trang bên trái vẫn đọc, bấm số khác thì đổi nội dung |
| Cột 720 (NH9) | cân đều, cột cuối sát mép phải | không đổi |
| Dòng tiêu đề ở 1280 / 1440 | một dòng (cao 53) | không đổi, không xuống dòng |
| 375 | toàn màn dưới thanh trên | không đổi (thêm: thân kéo tới đáy màn) |
| Mất thao tác nào | — | không |

Mã chết dọn: `max-h-full`, `items-start`, `max-sm:h-full` (thừa), `sm:border-b`; chú thích "cao theo nội dung" đã sửa.

## Kiểm (Playwright, dark, QL / Head, bản chép demo)
- Panel số mở ở Thi thật (Theo GV, Từng kỹ năng), Tổng hợp, SOS, Ý thức, Hiệu quả PA ở 1440 / 1280 / 375: **75 ca đạt, 0 hỏng** (đáy = đáy màn, đỉnh = đáy menu, 4 góc `elementFromPoint` không bị che). Ca 1 dòng và dài (20 dòng) đều có.
- `scripts/kiem-chong-cat.mjs`: **25/25** (Thi thật) và **15/15** (Ý thức).
- Trang Giáo viên: ô số không mở panel số (không thuộc khuôn này).

## Ảnh cặp toàn màn (trước | sau)
Ca 1 dòng — Thi thật › Theo GV, ô "1" Vượt:
- 1440: `ket-qua-thi-1-hang-1440-truoc.png` | `ket-qua-thi-1-hang-1440-sau.png`
- 1280: `ket-qua-thi-1-hang-1280-truoc.png` | `ket-qua-thi-1-hang-1280-sau.png`
- 375: `ket-qua-thi-1-hang-375-truoc.png` | `ket-qua-thi-1-hang-375-sau.png`

Ca dài:
- Ý thức, 36 vi phạm: `vi-pham-dai-1440-truoc.png` | `vi-pham-dai-1440-sau.png`
- Tổng hợp, Lượt MT 8 dòng: `lan-mt-8-hang-1440-truoc.png` | `lan-mt-8-hang-1440-sau.png`

Không dùng chú thích `ponytail:`.
