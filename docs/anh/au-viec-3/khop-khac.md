# AU-VIEC-3 — GV / GVCN lớp cũ xem hồ sơ chỉ đọc 30 ngày (N48, audit A3-08) · mockup ③ K9f

Ảnh cặp TRƯỚC (main) | SAU, demo 14/09, tối: GVCN Trần Ngọc Hà (7, lớp MB FT 101) mở hồ sơ Quách Thành Nam (93) — em chuyển MB FT 101 → MB FT 102
ngày 12/09 (`gv-lop-cu-ho-so-1440.png` · `-375.png`). TRƯỚC: "Không có quyền". SAU: hồ sơ chỉ đọc.

## Truy vết khung K9f → web

| # | Khung K9f | Web | Kết quả |
|---|---|---|---|
| 1 | Chip "Lớp cũ · chỉ xem" cạnh tên | `Info` cạnh tên (`viewer.lopCu`) | KHỚP |
| 2 | Dải "Em chuyển sang {lớp} từ {dd/mm} · bạn xem được tới {dd/mm} · việc của em do GV lớp … và GVCN … làm" | `DaiChiXem` cùng câu (lớp chưa có GVCN → bỏ vế GVCN) | KHỚP |
| 3 | Không "+ Task", không "⋯" | quyền ghi theo lớp đang học → không mục nào | KHỚP |
| 4 | Không nút ghi (Case chữ thường, Tiến độ không "+ Ghi tiến độ") | cờ ghi máy chủ đều tắt (phép kiểm) | KHỚP |
| 5 | Ô "Lớp cũ" trong dòng thông tin | không thêm ô — dải đã nêu lớp mới + ngày; lớp cũ là lớp của chính người xem | KHÁC-1 |
| 6 | Hết 30 ngày → chặn như GV không dạy em | `lopCuXem` hết hạn → "Không có quyền" | KHỚP |

KHỚP 5 / 6 ≈ 83 % theo dòng; phần hình của khung (chip, dải, thông tin, bảng) khớp — KHÁC-1 là bỏ một ô trùng thông tin.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| GV / GVCN lớp cũ mở hồ sơ em vừa chuyển (≤ 30 ngày) | "Không có quyền" | xem chỉ đọc + nhãn + dải | THÊM — N48 |
| GV không dạy em mở hồ sơ | "Không có quyền" | như cũ | GIỮ |
| Ghi Case / PA / vi phạm / sửa hồ sơ của GV lớp cũ ở hồ sơ | không vào được hồ sơ | không có nút; máy chủ không mở quyền ghi | GIỮ |
| Mockup ③ K6 ② / K6b | vẽ "GV không dạy em xem được" | ghi chú: KHÔNG xem (bỏ K6b), ngoại lệ lớp cũ → K9f | ĐỔI ghi chú |

## KHÁC
- **KHÁC-1** Không thêm ô "Lớp cũ" ở dòng thông tin: người xem chính là GV lớp cũ (biết lớp mình), dải chỉ xem đã nói em sang lớp nào, từ ngày nào, xem tới bao giờ; ô thêm lặp thông tin (luật "thông tin vừa đủ"). Chủ SP muốn ô thì thêm được (dữ liệu có sẵn `viewer.lopCu.lopCu`).
