# v18 · Công việc — CV6 chevron sát tên ở dải gập

Mockup: `thiet-ke/v18/cong-viec-dai-nhom.html` (#1279, chủ SP duyệt 10/11 — kể cả bỏ tiêu đề lặp "Lớp tôi dạy").
Ảnh cặp mockup | web: `cap-*.png` (1440 tối, 375 sáng; phông Be Vietnam Pro + Inter đã nạp). Demo 14/09/2026, GV Trần Ngọc Hà.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần | Tệp | Ảnh | Khớp |
|---|---|---|---|---|
| A1 / B1 chevron 16 px sau tên (sau chip), xoay 90° khi mở | `DaiNhom` | `DanhSachViec.tsx` | `cap-dong-1440.png`, `cap-dong-375.png` | KHỚP |
| A1 cả dải một nút: rê sáng cả dải, focus viền 2 px cả dải | `DaiNhom` (`after:` lớp phủ, `has-[:focus-visible]`) | `DanhSachViec.tsx` | `cap-dong-1440.png` (Tab tới "Lớp tôi dạy") | KHỚP |
| C1–C3 ⓘ / phần phụ bấm riêng (Đã bỏ qua) | `DaiNhom` (`relative z-[1]`) | `DanhSachViec.tsx` | — (seed không có việc đã bỏ qua) | KHỚP (mã) |
| A1 biểu tượng "Yêu cầu của tôi" = phiếu gửi | `DUONG_IC['yeu-cau']` | `DanhSachViec.tsx` | `cap-dong-1440.png` | KHỚP |
| A2 / B2 "Lớp tôi dạy" mở: bỏ tiêu đề lặp, Fast Track \| Lớp thường rồi ⓘ | `LopToiDay` (`h2` `sr-only`, đổi thứ tự) | `LopToiDay.tsx` | `cap-mo-1440.png`, `cap-mo-375.png` | KHỚP |
| Nội dung Yêu cầu của tôi, bảng / thẻ lớp | — | — | — | GIỮ |
| BỎ | tam giác ▸ 13 px mép phải (nút thứ hai `tabIndex -1`); chữ "Lớp tôi dạy" lặp trong khối | | | |

## Thao tác trước → sau

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Mở / đóng dải | bấm tên hoặc tam giác mép phải | bấm bất kỳ chỗ nào trên dải; Tab dừng một lần, Enter / Space | ĐỔI — CV6 |
| ⓘ trên dải (Đã bỏ qua) | có | có, bấm riêng không gập dải | GIỮ |
| Gập sẵn, chỉ tải khi mở | có | có | GIỮ |
| Fast Track \| Lớp thường, ⓘ Dưới kỳ vọng, link lớp, số mở tại chỗ | có | có | GIỮ |
| Yêu cầu của tôi: thẻ, Mở ›, Xem thêm, "n yêu cầu chờ duyệt ›" | có | có | GIỮ |

Không mất thao tác nào. Giảm chuyển động: chevron không xoay động (`motion-safe:`).

## Dòng đọc Turso

Không đổi — chỉ đổi dáng dải; khối vẫn chỉ tải khi mở.
