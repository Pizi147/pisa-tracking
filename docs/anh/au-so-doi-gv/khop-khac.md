# AU-SO · B3-11 — QL đổi GV một kỹ năng từ thẻ GV hồ sơ lớp (AUDIT-1611)

Ảnh (seed, QL Monbay, FT 101, tối, phông đã tải, không cuộn ngang): `sau-the-gv-1440.png` (thẻ GV mở, nút "Đổi" cạnh từng người) ·
`sau-doi-l-1440.png` (bấm "Đổi" ở L · R → panel Phân công đang sửa, ô L mở sẵn danh sách, gõ đè được) · `sau-the-gv-375.png` (nút 44 px).

Không bố cục mới: thêm nút theo mẫu sẵn có (`btn btn-sm`), dùng lại panel Thông tin lớp › Phân công + hộp hiệu lực / bàn giao (`HopLuuPhanCong`).

## Thao tác TRƯỚC → SAU
| Bước | Trước | Sau |
|---|---|---|
| Mở chỗ đổi | ⋯ › Thông tin lớp › Phân công "Sửa" (3 bấm) | bấm dải GV → "Đổi" cạnh người (2 bấm) |
| Bỏ người cũ | bấm ✕ ở ô | không cần — ô mở sẵn ô tìm, gõ đè |
| Chọn người mới | gõ + chọn | chọn (danh sách đã mở) |
| Lưu | Lưu phân công → hộp hiệu lực → Lưu | giữ nguyên |
| Tổng | 8 bấm + 1 gõ | 5 bấm |
GVCN (không phải QL) chỉ thấy "Đổi" ở ô bộ môn (luật `canAssignSubject` như panel). Link tên GV → hồ sơ GV giữ nguyên (nút làm việc tách link xem hồ sơ). Không mất thao tác: ⋯ › Thông tin lớp vẫn còn.
