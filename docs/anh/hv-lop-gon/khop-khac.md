# HV-LOP-GON — Học viên & Lớp gọn (chủ SP 28/10)

So với **main** (đã có #646 màu SOS). Mockup: `thiet-ke/v5/dieu-chinh-cuoi.html` khu d, `thiet-ke/v7/mau-muc.html`, `thiet-ke/v7/bang-mau-moi.html`.

## Ảnh
| Tệp | Nội dung |
|---|---|
| `truoc-1440.png` · `truoc-375.png` | mockup \| web main (lớp đầu tự mở) |
| `sau-1440-mac-dinh.png` | mockup \| web sau — vào trang: mọi lớp gập |
| `sau-1440-mo-lop.png` · `sau-375.png` | mockup \| web sau — người dùng mở MB FT 101 (`?mo=3`) |
| `truoc-1440-can.png` · `sau-1440-can.png` | cận cảnh hàng em: ô MT gần nhất, tên em, nút lọc |

## Truy vết khung → thành phần
| Khung / yêu cầu | Thành phần | Trạng thái |
|---|---|---|
| Lớp không tự mở | `StudentsPage` `moSet`: không `mo` trên URL → rỗng | SỬA. Đang lọc / tìm vẫn mở lớp có em khớp [XM-1] |
| Bỏ TVV dưới tên em | `TenEm` | BỎ (chỉ còn "Kết thúc học" / "Tạm dừng" khi có) |
| Bỏ ↗ tên em, mã lớp | `.ten-ho-so.khong-mui` (chỉ trang này; các trang khác giữ ↗) | BỎ — vẫn là link, rê = xanh + gạch |
| Ô MT gần nhất | `OMtGan` + `MiniKn` | SỬA: Overall 15/700 màu kết quả · "/ KV · tuần" 12 mờ · 5 kỹ năng 13/600 lưới cột cố định (thẳng hàng giữa các em) · kỹ năng dưới KV nền đỏ nhạt + chữ đỏ + "Dưới kỳ vọng" cho trình đọc màn (mockup `.mini-kn`) |
| Nút lọc chọn / không chọn | `.nut-loc` (toàn web) | SỬA theo mockup `.chip`: không chọn viền ô nhập (3,8 : 1, trước 30 % gần chìm), chữ 600; đang chọn viền màu nhấn sáng (10,2 : 1) |
| Hàng "Đã thi" | `tr.hang-da-thi` (+ thẻ 375) | THÊM theo mockup `.da-thi`: nền + vạch trái màu lịch — "Đã thi 24/10" khác "Thi 28/11" không chỉ bằng chữ |
| 375: hàng lớp | `TheHvGon` | SỬA: cả dải bấm mở / gập, mũi tên cạnh mã lớp (critique P1) |
| Chip SOS, ô đếm SOS, PA quá hạn, Report n, Lịch thi, hạn ⚠, n bài chờ chấm | `ChipSos`/`lopSos`, `OSosLop`, `Nhan`, `NhanLich` | GIỮ — token đã = mockup (`bang-mau-moi .sau` + `mau-muc .sau`), đo bên dưới |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Vào trang | lớp đầu tự mở | mọi lớp gập; bấm hàng lớp / ▸ để mở; Quay lại giữ lớp đã mở (`mo` trên URL) |
| Tìm / chip lọc | mở lớp có em khớp | giữ |
| Tên em / mã lớp → hồ sơ | link có ↗ | link không ↗ (cùng đích, cùng `state.ds`) |
| Lọc, tìm, phân trang, Xuất Excel, + Thêm học viên, ⋯ lớp / em, hộp "Vì sao SOS", việc bấm mở panel tại chỗ, Xem thêm | có | giữ nguyên |
Không mất thao tác nào.

## Đo tương phản (computed trên trang, demo QL)
| Phần tử | Tối chữ / mép | Sáng chữ / mép |
|---|---|---|
| Đếm SOS 1 · 2 · 3 | 10,2 / 7,9 · 7,1 / 3,2 · 6,4 / 3,6 | 6,4 / 3,5 · 5,8 / 3,3 · 8,6 / 7,8 |
| PA quá hạn | 7,6 | 6,4 |
| Report n (viên tiến độ) | 8,0 | 6,6 |
| Chưa có lịch | 7,1 / 3,8 | 5,5 / 3,2 |
| Dự kiến (viền lơ) | 10,3 / 2,5 | 8,9 / 1,9 |
| Hạn ⚠ | 7,1 | 5,6 |
| Kỹ năng dưới KV | 7,1 | 5,6 |
| Nút lọc không chọn / đang chọn | 9,5 / 3,8 · 9,3 / 10,2 | 7,7 / 3,5 · 10,6 / 9,0 |
Chữ mọi chip ≥ 4,5. Mép < 3: viên tiến độ (Report, hạn, chờ chấm) và kỹ năng dưới KV — theo mockup không viền, nhận bằng chữ + chấm / ⚠ / nền; "Dự kiến" viền `--lich-vien` = token mockup.

## critique
Vòng 1: 31/40. P1 (mũi tên mở lớp nhỏ, 375 lơ lửng) → sửa. Còn P2/P3 không sửa: ✓/✗ trước Overall (đúng mockup + aria-label), nút việc ở hàng lớp nặng (= mockup `.viec-lop .nut`), 375 chip việc dài. Detector impeccable: 0 phát hiện.

## [XM]
- **XM-1**: "mọi lớp mặc định gập" — khi đang tìm / lọc tôi vẫn mở lớp có em khớp (không thì kết quả tìm bị giấu sau hàng lớp). Chủ SP muốn gập cả lúc lọc thì đổi một dòng `moSet`.
- **XM-2**: `.nut-loc` là nút lọc chung toàn web → đổi viền ở mọi trang (cùng dáng mockup `.chip`).
