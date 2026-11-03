# BAN-GIAO-KET-QUA — cột "Kết quả" bảng bàn giao GVBM theo mockup v11 (việc để sau của #856, chủ SP bảo làm 03/11)

Mockup: `thiet-ke/v11/ban-giao-w1w2.html` khu 2 + 4 (chủ SP duyệt 03/11, N31). Ảnh cặp (DB demo cục bộ, ngày demo 14/09, Mr. Khoa Lê (8) dạy W1 + W2 lớp MB FT 102):
`cap-gvbm-w1w2-1440-toi.png` · `cap-gvbm-w1w2-375-sang.png`.

| Thành phần | #856 | Sau PR này |
|---|---|---|
| Cột Kết quả (FT, phiếu chưa xác nhận) | KHÁC — câu tự điền "MT2 đạt kỳ vọng" | **KHỚP** — "MT2 · W1 ✓ 5.5 · W2 ✓ 5.5": lượt mới nhất có điểm + band TỪNG cột của bảng, ✓ / ✗ so kỳ vọng của chính lượt (màu kq-bang / kq-duoi), "—" khi task chưa có điểm, "· tạm" khi lượt chưa chốt |
| Em chưa có lượt nào / lớp thường / phiếu đã xác nhận (bản chụp) | câu tự điền | giữ câu tự điền |

Bảng thành phần #856 nay KHỚP 16/18 (2 KHÁC chủ SP đã đồng ý lý do: panel trượt phải, Đóng trái chân).

## Thao tác TRƯỚC → SAU
Không đổi thao tác. Chỉ thêm thông tin đọc (đọc màn hình: "MT2 · W1 ✓ 5.5 · W2 ✓ 5.5").

## Chữ + bề rộng (chủ SP 03/11: "text vừa bé vừa xấu") — đo computed style mockup ↔ web, sửa theo số mockup
| Phần | Mockup | Web trước | Web sau |
|---|---|---|---|
| Bề rộng panel (GVBM hai cột + GVCN) | 1180 px | ~1410 px (`toan`) | 1180 px (`KhungPanel rong="vua"` mới) |
| Cột Học viên · Kết quả · W1 · W2 | 200 · 150 · 359 · 359 | 192 · 144 · 505 · 505 | 200 · 150 · ~360 · ~360 |
| Tên em / dòng lớp chuyển đến | 14 px 600 / 12 px 600 | 14 px 400 / 12 px 400 | 14 px 600 / 12 px 600 |
| Kết quả | 13 px | 12 px | 13 px |
| Ô nhập | 15 px, cao 40 | 14 px, cao 37 | 15 px, cao 40 |
| Đệm hàng | 10 · 14 px | 10 · 12 px | 10 · 14 px |
| Trạng thái ô | 12 px 600 | 12 px 400 | 12 px 600 |
| Chân "Tự lưu… · Còn …" | 13 px | 12 px | 13 px |
| GVCN: tên em · nhãn tự điền · "Bàn giao của GVBM" | 15/700 · 13/500 · 13/600 | 15/600 · 14/400 · 12/600 | 15/700 · 13/500 · 13/600 |

Ảnh cặp chụp lại sau sửa: 4 tệp trong thư mục này (GVBM + GVCN, 1440 tối · 375 sáng).
