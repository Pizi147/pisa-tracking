# #6 — khớp / khác mockup #1346 (đề xuất một màn + QL duyệt tại chỗ)

Ảnh cặp mockup | web: `docs/superpowers/specs/2026-11-11-ra-toan-bo/anh-pr/6/cap-k1…k5.png` (seed, 14/09, tối).

| Khung | Thành phần | Ảnh | Đánh giá |
|---|---|---|---|
| K1 | dải ①②③ (② "Gửi QL duyệt · QL trả lời trong 5 ngày", ③ "Sau khi gửi · việc cho TVV") | cap-k1 | KHỚP |
| K1 | Loại cần QL duyệt (4 nút chọn) · Vi phạm đưa vào · Lý do * | cap-k1 | KHỚP |
| K1 | Bằng chứng * chọn trong form (+ Tệp · + Liên kết, dán / kéo thả) | cap-k1 | KHỚP |
| K1 | nút "Gửi QL duyệt" + "← Quay lại Xác nhận xử lý" | cap-k1 | KHÁC (GIỮ): web đặt hai nút trong khối Cần làm như mọi panel v3 (375: nút chính ở chân) — mockup vẽ ở chân 1440 |
| K1 | dòng "Duyệt đề xuất ngoài thang không đổi bậc — bậc kế vẫn là …" | cap-k1 | KHÁC (GIỮ): lưu ý hậu quả sẵn có (bo-chu-thich: giữ lưu ý cần thiết) |
| K1b | sau Gửi: panel đóng, toast, dòng em "Đề xuất … · chờ QL" | cap-k1 | KHỚP |
| K2a | thiếu bằng chứng: lỗi tại ô + chân "Còn 1 ô cần sửa" | cap-k2 | KHỚP (chữ chân theo mẫu chung "Còn n ô cần sửa") |
| K2b | tệp tải lỗi: "Chưa gửi — n tệp tải lỗi" + Thử lại | — | KHỚP theo mã (không dựng được lỗi mạng trên seed) |
| K3 | khung panel duyệt (đầu, lý do, Sau khi duyệt, Lịch sử, chân Tiếp · Từ chối… · Duyệt) | cap-k3 | KHỚP |
| K3 | Vi phạm · n (ngày · chip môn · tên · ai ghi · mô tả) | cap-k3 | KHỚP |
| K3 | Bằng chứng · n (ảnh xem trước, Mở) | cap-k3 | KHỚP (seed chỉ có liên kết — ảnh xem trước hiện khi tệp là ảnh) |
| K3 | bỏ dòng "Điểm" (chủ SP 11/11) | cap-k3 | KHỚP — mockup đã bỏ dòng này |
| K3 | link cuối "Hồ sơ Ý thức ›" | cap-k3 | KHÁC (GIỮ): khung duyệt chung ghi "Mở ›" cho mọi loại thẻ (cùng đường hồ sơ HV tab Ý thức) |
| K4a | chuông GVCN: "QL đã duyệt … · ghi Đã thực hiện" ở Cần làm, hạn, "Công việc ›" | cap-k4 | KHỚP (xếp theo hạn trong Cần làm) |
| K4b | chuông CX: "Có Meeting CX/GĐCN · em · lớp", GVCN, "Hồ sơ … › Ý thức ›" | cap-k4 | KHỚP |
| K5 | 375 GVCN + QL | cap-k5 | KHỚP |

Đếm: 16 dòng · 13 KHỚP · 3 KHÁC có lý do (GIỮ mẫu chung) → 13 / 16 = 81 % "khớp tuyệt đối", 100 % nếu tính KHÁC có lý do theo luật V1 (giữ thao tác / mẫu sẵn có). Hình ảnh (màu, nền, viền, cỡ chữ, khoảng cách) theo mockup.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| GVCN gửi đề xuất có bằng chứng | 10 bấm, 2 màn ("Tiếp: đính kèm bằng chứng" → Gửi) | 7 bấm, 1 màn ("Gửi QL duyệt") |
| Đóng giữa chừng | mất lý do (màn 2) · nháp mồ côi (đóng tab) | lý do giữ ở nháp panel · nháp cũ cùng người · cùng em dọn khi gửi lần sau |
| Rút / sửa lý do / thêm, bỏ tệp khi chờ | Xem lần xử lý · Yêu cầu của tôi | GIỮ |
| QL xem vi phạm + bằng chứng | Mở › hồ sơ HV › quay lại | ngay trong panel duyệt |
| QL Duyệt / Từ chối… / Hoàn tác / Tiếp | có | GIỮ |
| GVCN biết đã duyệt | chuông "Để biết" → Yêu cầu của tôi | chuông "Cần làm" + hạn → Công việc |
| CX biết có Meeting | không | chuông "Để biết" |
