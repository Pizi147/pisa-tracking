# SUA-NHO-UI (30/10) — khớp / khác mockup + thao tác trước → sau

Ảnh trong thư mục này (`docs/anh/sua-nho-ui/` đã có ảnh của PR cũ cùng tên nên dùng thư mục `-3010`).
Web chụp trên bộ demo (ngày 14/09/2026), 1440 tối · 375 sáng.

## Bảng truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần | Ảnh | Kết quả |
|---|---|---|---|---|
| U0 | (không mockup — lỗi chủ SP báo) | ô lưới điểm lớp thường + ⋯ (`LuoiThuong`) | 1440 tối: `u0-truoc-re-1440.png` \| `u0-sau-re-1440.png` (rê một ô), `u0-sau-1440.png` (thường: không ⋯ nào); 375 sáng: `u0-truoc-375-sang.png` \| `u0-sau-375-sang.png` | ⋯ nằm trong dòng đầu của ô (căn baseline), ẩn bằng `invisible` nên giữ chỗ. Đo vai 2 / 7 / 9 × 1440 / 1280 / 375, Progress + Final + Lịch Test: 0 ô bị đè, lệch dọc ⋯ ↔ dòng đầu ≤ 2 px (trước: chạm "/25", lệch 13 px) |
| U1 | `v8/tong-quan.html` khu E (`.bao-loi`) | `ErrorState` | `u1-loi-tong-quan-1440.png` | KHỚP: ⚠ đỏ, nền / viền bad, dòng chính đậm đỏ, dải hết bề rộng |
| U1 | `v8/phan-tich.html` D3 (375) | `ErrorState` 375 | `u1-loi-phan-tich-375.png`, `u1-loi-tong-quan-375.png` | KHỚP: nút trong dải, dưới chữ, cao 44 |
| U1 | — (Tự quyết kế hoạch) | 403 / 404 trung tính | `u1-403-1440.png` | GIỮ nhãn "Không có quyền" / "Không thấy", nút về trang cha, link phụ |
| U2 | `v7/ke-hoach-test.html` 1440 QL | `BoLocDoan` + `CongTacKhung` | `u2-ke-hoach-test-1440.png` | KHỚP: "Fast Track 6 · Lớp thường 16", không ✓ |
| U2 | `v7/ke-hoach-test.html` 375 | hàng công cụ 375 | `u2-ke-hoach-test-375.png` | KHỚP: công tắc + "Lọc ▾" + ⓘ một hàng (đo top 226 / 228, 375 + 390) |
| U2 | — | bộ lọc đoạn màn khác | `u2-cong-viec-375-sang.png`, `u2-tai-khoan-1440-toi.png` | KHỚP luật mới (không ✓, số sau tên) |
| U2 | — | chip khung Lịch Test, ô chọn khung Công việc | `u2-lich-test-chip-1440-toi.png`; ô chọn: "Mọi khung · Fast Track 82 · Lớp thường 70" | đồng bộ "Fast Track n" (PTA 30/10) |
| U3 | (không mockup) | `HopKyNang` ⋯ đầu hộp | `u3-truoc-*` \| `u3-sau-*` (1440 tối FT, 375 sáng lớp thường) | Xóa lịch vào ⋯, mục mờ + lý do ở rê chuột |
| U4 | `v6/lo-trinh-moi.html` #k1 | ô "Lớp khác" (`ChonLop` / `ChonNguoi`) | `u4-mockup-v6-k1.png` \| `u4-lop-khac-1440-toi.png`, `u4-lop-khac-375-sang.png` | KHỚP: lớp đúng loại trước, lớp sai loại mờ "FT LT1 · lớp LT" |
| U5 | `v8/phan-tich.html` (chữ tab sửa theo quyết định mới) | tab Phân tích | `u5-tab-1440-toi.png` | KHỚP |

Tỉ lệ: 10 / 11 dòng KHỚP (91 %).

## KHÁC (có lý do)
- **U1 nút Thử lại bên phải dải** (≥ 640): spec 30/10 mới hơn mockup v8 (mockup vẽ nút dưới chữ / dưới dải). < 640 nút xuống dưới chữ như mockup.
- **U2 375 "Fast Track"** (mockup 375 viết "FT"): một khái niệm một tên — giữ "Fast Track" (vừa hàng, không tràn).
- **U2 mockup 375 v7 là nền tối**, web 375 chụp sáng (luật ảnh cặp 375 sáng) — mockup v7 không có bản sáng.
- **U4 dòng phụ** ở ô chọn chung nằm dòng dưới tên (mockup: một dòng, phụ bên phải) — giữ kiểu ô chọn dùng chung mọi nơi; ghi "Để sau".

## BỎ / GIỮ
- BỎ: ô ✓ (kể cả ✓ ẩn chiếm chỗ) ở mọi bộ lọc đoạn không-v8; chữ "· n lớp" sau tên khung (Kế hoạch Test, Lớp tôi dạy); nút "Xóa" ở chân hộp một đợt + dòng lý do dưới chân.
- BỎ: "·" giữa tên khung và số ở chip Lịch Test / ô chọn Công việc (đồng bộ "Fast Track n").
- GIỮ: hình dạng chip (Lịch Test) và ô chọn (Công việc); "Xếp nhiều MT…" (D4); hộp hỏi lại "Xóa lịch … của …?" + Hoàn tác; "Mở lại" của Case / PA / lớp.
- "Mở lại → Khôi phục" ở nhật ký lượt: đã xong #674 (`DongThoiGianLuot.tsx:27`) — không đổi ở PR này.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Bước |
|---|---|---|---|
| Đọc / mở ⋯ ô lưới điểm lớp thường | ⋯ chạm "/25", lệch dưới chữ | ⋯ cùng hàng chữ, chỉ hiện khi rê / focus ô (cảm ứng hiện sẵn) | = |
| Thử lại khi lỗi tải | nút giữa thẻ | nút phải trong dải (375 dưới chữ) | = |
| Về trang cha khi 403 / 404 | nút giữa | nút phải dải trung tính | = |
| Đổi khung FT / Lớp thường (Kế hoạch Test) | "✓ Fast Track · n lớp" | "Fast Track n" | = |
| Lọc ▾ (375) | hàng thứ hai | cùng hàng công tắc | = |
| Xóa lịch một đợt | chân hộp › Xóa › hỏi › Xóa | ⋯ › Xóa lịch › hỏi › Xóa | 3 → 4 (Xóa ít dùng, tránh bấm nhầm cạnh Lưu — critique) |
| Biết vì sao không Xóa được | dòng chữ dưới chân | rê / focus mục mờ trong ⋯ | = |
| Xóa lịch đợt lớp thường | chân hộp › Xóa | ⋯ (mới có ở lớp thường) › Xóa lịch | 3 → 4 |
| Chọn lớp khác ở Lộ trình mới | chỉ thấy lớp đúng loại | thấy cả lớp FT sai loại (mờ + lý do), chọn được lớp đúng loại | = |
| Mở tab Kết quả Test / Thi | tab "Kết quả Test" | đổi tên | = |
