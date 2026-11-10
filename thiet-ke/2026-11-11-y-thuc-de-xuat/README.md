# Mockup #6 — Đề xuất QL duyệt Ý thức một màn + QL duyệt tại chỗ (CHỜ DUYỆT, chưa code)

Nguồn: bản rà toàn bộ 11/11 `docs/superpowers/specs/2026-11-11-ra-toan-bo/bao-cao.md` mục 3 #6 (G3-4, G3-5, G3-7, G3-8) — chủ SP 11/11 "Theo hết 10 đề xuất".
Tệp: `de-xuat-mot-man.html` (CSS nhúng của mockup Ý thức V2 đã duyệt). Ảnh: `anh/k0…k5.png`, `anh/bang.png`. Seed, ngày demo 14/09/2026.

## Tự rà từng ý yêu cầu

| Ý (bản rà) | Khung | Đạt? |
|---|---|---|
| Một màn: Loại · Lý do · Bằng chứng (`TepCho` như Ghi vi phạm) · Gửi | K1, K5a | ✓ bỏ "Tiếp: đính kèm bằng chứng" + màn 2; 10 → 7 bấm |
| Không mất chữ khi đóng giữa chừng | K1 ④, K2b | ✓ lý do ở nháp panel (`useNhap`), tệp lỗi → ở lại, Thử lại |
| Không nháp mồ côi | K2b, bảng | ✓ đề xuất chỉ lên máy chủ khi bấm Gửi; dở (tệp lỗi) đóng thì xoá; nháp cũ cùng người · cùng em dọn khi gửi lần sau |
| Panel duyệt QL hiện vi phạm + bằng chứng tại chỗ | K3, K5b | ✓ đầu mục Vi phạm · n + Bằng chứng · n; "Hồ sơ Ý thức ›" giữ |
| Tin "Đã duyệt" vào "Cần làm" của GVCN | K4a | ✓ kèm hạn, link thẳng việc Đánh dấu đã thực hiện |
| CX được báo khi duyệt Meeting | K4b | ✓ "Để biết", chỉ loại Meeting CX/GĐCN |
| Giữ thao tác cũ (Rút, sửa lý do, thêm / bỏ tệp khi chờ; Duyệt / Từ chối / Hoàn tác / Tiếp) | bảng | ✓ |
| Đọc Turso | bảng | danh sách Chờ duyệt không đổi; mở một thẻ Ý thức +1 request (≤ 3 câu) |

Luật không đổi: bằng chứng bắt buộc khi gửi (V4-10 / LUAT-5, trừ "Không tăng bậc"), QL trả lời 5 ngày, việc TVV sinh ngay (N1).
