# Audit #1454 — kết quả (PTA Plan, 13/11)

Đề bài: `de-bai.md`. Chi tiết hồi quy + bằng chứng phần máy chủ / chi nhánh / Lưu trữ: `sua-ra-1311.md`.
Mọi PR dưới đây đã qua `npm run check` đầy đủ (session) + check chung PTA trước merge. SQLD / Hrana bỏ qua (máy không có sqld). Chưa deploy.

| ID | Trạng thái | PR |
|---|---|---|
| N01 Kết quả PA: nháp không thành kết quả chốt | ĐÃ SỬA | #1458 |
| N02 Nháp trình duyệt bỏ đúng ô sau khi máy chủ nhận | ĐÃ SỬA | #1458 |
| N03 Chốt ở tab khác / xung đột không mất chữ | ĐÃ SỬA | #1458 |
| N04 Chi nhánh: hai Quản trị sửa / Hoàn tác đè nhau | ĐÃ SỬA | #1460 |
| U01 Form Kết quả PA (trạng thái nháp / đã lưu rõ) | ĐÃ SỬA | #1458 |
| U02 Lưu trữ: kết quả "Quay lại học · n em" nằm lại, Thử lại chỉ em lỗi | ĐÃ SỬA (chữ theo luật prS3Chu: "Xong n/m · Cần chọn lớp · Không lưu được") | #1461 |
| U03 375 + bàn phím mở | ĐÃ SỬA — chủ SP 13/11 "Ẩn, không mockup": ẩn thanh tab dưới mọi trang khi gõ | #1458 |
| U04 (form Kết quả PA) | ĐÃ SỬA | #1458 |
| U05 Nạp sẵn theo vai | ĐÃ ĐO + ĐỔI PHẦN CÓ LỢI: GV 702→619 KB, TVV →620, CX →602, Admin VP →655; QL/QT không đổi; nạp theo "khả năng dùng tiếp" chưa làm (thiếu số liệu) | #1461 |
| Nháp trình duyệt khoá theo PA (chữ kỳ trước hiện lại kỳ sau) — code-review | ĐÃ SỬA (khoá PA + kỳ, chuyển khoá cũ một lần) | #1458 |
| PTA-1…4 (rà trước deploy: mở lại Báo PH khi khôi phục lượt, hàm đêm đọc cấu hình Case & SOS, `plan_source_truoc_vang`, mốc PA quy chế một hàm) | ĐÃ SỬA | #1456 |
| PTA-5 Đọc tăng /students/:id, skill-board | KHÔNG TÁI HIỆN — do dữ liệu migrate (2 Case tạm), cùng dữ liệu HEAD đọc ít hơn (65/27 vs 86/46 câu) | — |

Còn giới hạn: chưa thử điện thoại thật cho U03; tài khoản khôi phục / Quản trị cuối / quyền thu hồi chỉ có phép kiểm tự động.
