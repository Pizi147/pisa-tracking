# AUDIT-1454 (#1458) — form Kết quả PA: trạng thái + ảnh

Không đổi bố cục (không mockup mới). Ảnh HEAD trong thư mục này: 1440 tối · 375 sáng, dữ liệu demo 14/09, GV Phạm Thu Trang.

| ID | Trạng thái | Ảnh / bằng chứng |
|---|---|---|
| N01 nháp ghi đè giữa hai phiên | ĐÃ SỬA | `head-xung-dot-*` · phép kiểm `prNhapKq` (đỏ trên 730f931) |
| N02 phản hồi nháp xoá chữ mới | ĐÃ SỬA | bấm thử PUT trễ 3 s (mô tả PR) |
| N03 nháp / chốt chồng | ĐÃ SỬA | `head-da-chot-o-tab-khac-*` · `prNhapKq` |
| daSua (PTA rà) | ĐÃ SỬA | bấm thử: Đóng hỏi "Bỏ chữ đang gõ?" |
| U01 một bộ chữ | ĐÃ SỬA | `sau-form-*` (thay ảnh cũ "nháp giữ trên máy"), `head-nhap-truoc-chot-*`, `head-da-luu-*` |
| U04 Sửa / việc tiếp | ĐÃ SỬA | `head-sua-*` · `prNhapKq` |
| Lỗi mạng | ĐÃ SỬA (chữ) | `head-loi-*` — chân không còn ".." |
| U03 375 + bàn phím | **ĐÃ SỬA** (chủ SP 13/11 "Ẩn, không mockup") | `head-375-ban-phim.png` (375 × 476 = phần còn thấy khi bàn phím 336 px) · `head-375-mo-viec.png` |

## U03 — chi tiết
- Điện thoại (< 768) + ô nhập đang focus + `visualViewport` thấp hơn cửa sổ > 80 px → ẩn thanh tab dưới (Tổng quan · Học viên · Test · Công việc); đóng bàn phím → hiện lại. Đo **một nơi ở `App`** cho mọi trang (trước chỉ khi có panel mở). 1440 không đổi.
- Chân lưu panel (Đóng / Việc tiếp / Lưu) nằm trên bàn phím: bấm thử Đóng y 422–466 < mép bàn phím 476.
- Ô đang gõ cuộn vào giữa phần còn thấy (trước: giữa cửa sổ 812 → nằm sau chân lưu): ô Nhận xét y 219–283.
- Bấm thử headless (giả `visualViewport`), chưa thử điện thoại thật. Trang không panel (`/hoc-vien`, ô tìm): thanh dưới ẩn / hiện đúng.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Lưu nháp · Lưu kết quả · Lưu · việc tiếp · Sửa | có | có, cùng vị trí; nút này tắt khi nút kia đang gửi |
| Thử lại khi lỗi | có | có; không khi kỳ đã chốt ở phiên khác (câu nói tải lại / Sửa) |
| Xung đột nháp | ghi đè im | Dùng bản mới · Lưu bản của tôi (chỉ khi xung đột thật) |
| Thanh tab dưới khi gõ trên điện thoại | ẩn chỉ khi có panel mở | ẩn ở mọi trang |
| Hoàn tác | không (chủ SP 13/11) | không |
