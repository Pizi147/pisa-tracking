# HV-LOC — lọc / tìm không tải lại cả trang (chủ SP 28/10)

Gốc: `useApi` đổi đường (query) → `data = null` → `/hoc-vien` hiện khung chờ, gỡ cả thanh lọc (ô tìm mất focus, bộ gõ hỏng).
Sửa: `useApi(path, deps, { giuCu: true })` giữ dữ liệu cũ tới khi bản mới về (`cu = true` → vùng danh sách mờ nhẹ `.dang-tai-lai`, `aria-busy`). Mặc định các trang khác không đổi.

## Kiểm (Playwright, QL, gõ "Nguyễn Văn" từng chữ, nghỉ 450 ms sau dấu cách / "n" để chạy debounce)
| | Ô tìm còn chữ | Focus | Ô tìm bị gỡ | Khung chờ hiện (gõ / Bộ lọc thêm) |
|---|---|---|---|---|
| Trước (main) | "Nguyễn " (mất "Văn") | mất | 3 lần | 1 / 1 |
| Sau | "Nguyễn Văn" | giữ | 0 | 0 / 0 |

Ảnh: `truoc-tim.png` · `sau-tim.png` · `truoc-loc-them.png` · `sau-loc-them.png`.

## Trang khác cùng mẫu (useApi theo query + lọc trên trang)
| Trang | Trước | Sửa |
|---|---|---|
| Học viên & Lớp — Tất cả, Đang SOS | gỡ thanh lọc + khung chờ | `giuCu` + mờ |
| Học viên & Lớp — Lịch thi (`GocLichThi`) | ô lọc giữ, bảng nháy khung chờ khi đổi tháng / tìm | `giuCu` + mờ |
| Lưu trữ (`LuuTruPage`) | ô tìm giữ, danh sách nháy khung chờ | `giuCu` + mờ |
| Công việc (`HoTroHocVienTab`) | QL chọn GV → gỡ bộ lọc người (`laQuanLy && data`) + khung chờ | `giuCu` + mờ |
| Phân tích GV | tìm lọc tại máy, không gọi lại | không cần |
| Test (lượt / kế hoạch) | không đụng (phối hợp) | — |
