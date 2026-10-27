# MAU-WEB-2 (D10) — khớp / khác mockup, thao tác TRƯỚC → SAU

PR chỉ đổi **độ đậm chữ** và **lớp tên mở hồ sơ**; không đổi bố cục, token màu, chữ, dữ liệu.

## Ảnh cặp mockup | web (sau PR)
| Màn | Mockup | 1440 tối | 375 sáng |
|---|---|---|---|
| Tổng quan (QL) | `v5/tong-quan.html` | `1-tong-quan-1440.png` | `1-tong-quan-375.png` |
| HV & Lớp (QL) | `v5/hoc-vien-lop.html` | `2-hv-lop-1440.png` | `2-hv-lop-375.png` |
| Công việc (GV) | `v7/cong-viec-2.html` khung A · B1 | `3-cong-viec-1440.png` | `3-cong-viec-375.png` |
| Lịch Test (QL) | `v5/test.html` | `4-lich-test-1440.png` | `4-lich-test-375.png` |
| Phân tích (QL) | `v5/phan-tich.html` | `5-phan-tich-1440.png` | `5-phan-tich-375.png` |
| Hồ sơ HV (QL) | `v5/ho-so-hv.html` | `6-ho-so-hv-1440.png` | `6-ho-so-hv-375.png` |

## Tỉ lệ chữ ≥ 600 (số ký tự trong `<main>`, 1440 tối) — web TRƯỚC → SAU | mockup
Tổng quan 45 → 44 | 30 · HV & Lớp 35 → 30 | 64 · Công việc 45 → 39 | 37 · Lịch Test 67 → 46 | 50 · Phân tích 38 → 31 | 33 · Hồ sơ HV 47 → 40 | 37.
Tổng quan còn cao hơn mockup vì có nhiều dòng hơn (ô số 700, tên lớp / GV 600, đầu cột 600 — đều như mockup).

## Truy vết thành phần (sửa ở lớp chung trước)
| Thành phần | TRƯỚC | SAU | Nơi sửa |
|---|---|---|---|
| Nút phụ `btn-sm` | 600 | 500 (nút chính vẫn 600) | `index.css` |
| Tab (`HangTab`, tab kết quả `SoLieu`) | 600 mọi tab | không chọn 500 · đang chọn 600 | `HangTab.tsx`, `SoLieu.tsx` |
| Chip lọc (`nut-loc`, `CongTacKhung` chip, Hồ sơ lớp) | 600 | không chọn 500 · đang lọc 600 | `index.css`, `CongTacKhung.tsx`, `BangHoSoLop.tsx` |
| Nút đoạn (`BoLocDoan`, FT / Lớp thường, thời gian Phân tích) | 600 / đang chọn 700 | 500 / 600 | `ui.tsx`, `TongQuanV5`, `BoChonThoiGian`, `PhanTichGiaoVien`, `HuongDanPage` |
| Nhãn ô form `.label`, nhãn trường panel `Truong` | 600 / 700 | 500 | `index.css`, `KhungPanel.tsx` |
| Hàng nhóm `.hang-lon` | mọi ô 700, đè `font-normal` của ô (Lịch Test: cả "6 HV · MT3 5 · hạn 23/09" đậm) | ô đầu 700, ô ghi `font-normal` giữ 400 | `index.css` (`:where(td)`) |
| "⚠ quá hạn" (`QuaHan`, đầu nhóm Công việc) | 700 | 600 (vẫn đỏ + ⚠) | `Nhan.tsx`, `DanhSachViec`, `HoTroHocVienTab` |
| `font-extrabold` (tiêu đề panel, khối nhỏ, hộp nhập điểm…) | 13 chỗ | tiêu đề 700 · tiêu đề khối nhỏ 12 px xám 600 | 13 tệp; logo giữ |
| Mã lớp mở hồ sơ (HV & Lớp, dải lớp, panel Ý thức, Phân tích Ý thức) | link xanh đậm / gạch chấm | `.ten-ho-so` (màu chữ, ↗, rê mới xanh) như mockup | `StudentsPage`, `PanelViec`, `YThucPhoiHop` |
| Chờ bạn duyệt (Tổng quan) | cả dòng 600 | loại việc 500 · tên HV 600 | `TongQuanV5.tsx` |
| Ô lộ trình "2/5 MT" (HV & Lớp) | 700 | 500 | `DanhSachHvLop.tsx` |
| Tên việc ở cột Việc (HV & Lớp, dải lớp) — PTA 27/10 | link xanh mỗi dòng, hạn xa là chữ xám trần | nút viền nhỏ màu chữ 500 như mockup `.viec-o .nut` (chủ SP 27/10: "các nút ở phần việc rất ok"); hạn luôn là chip tiến độ (quá hạn ⚠ · hôm nay vàng · còn lại xám) ngay sau nút; "Xem thêm n" 600 → 500 | `DanhSachHvLop.tsx` (`OViec`, `HanViec`) |
| Số Thi thật trên chart D | 800 | 700 | `BieuDoD.tsx` |

GIỮ (khớp mockup / luật đã khoá): badge 12 / 600 (V4), ô số `OSo` 700 gạch chân (G6), đầu cột 13 / 600, tên em 15 / 600 và tên việc 15 / 500 (V18),
chữ trên chart D (mockup M5), logo 800, `.hang-thi-that` 700.

## Thao tác TRƯỚC → SAU
Không đổi thao tác nào: mọi nút, tab, chip lọc, link, panel giữ nguyên vị trí, chữ, đích. Mã lớp vẫn bấm mở Hồ sơ lớp (↗ giờ do `.ten-ho-so` vẽ).

## [XM] — PTA Plan đã trả lời 27/10
- "Chờ n kỹ năng" (Lịch Test) badge 12 / 600: GIỮ theo V4.
- HV & Lớp cột Việc link xanh: làm trong D10 (dòng trong bảng trên).
- Badge 375 liền nhau, ô "Chưa có lịch" viền mọi dòng: ngoài D10, PTA ghi việc sau.
