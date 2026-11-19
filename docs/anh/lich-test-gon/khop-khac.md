# LICH-TEST-GON — Test › Lịch Test tuần: MT# một kiểu gọn + bỏ cột "Còn chờ"

Lời chủ SP 19/11: "1. đổi kiểu thể hiện chữ MT# ở trang lịch test đi, nhìn rối quá 2. … làm gọn website hơn mà, đừng để phần cột còn chờ nữa, bỏ đi".
Ảnh cặp TRƯỚC | SAU (QL Nguyễn Khánh Vy, W3 SEP, ngày demo 14/09): `cap-ft-1440.png` · `cap-ft-375.png` · `cap-no-1440.png` (Quá hạn chấm) ·
`cap-thuong-1440.png` · `cap-thuong-375.png` (lớp MB FOU 12). Không có mockup mới — việc chỉnh nhỏ theo lời chủ SP, kiểu giữ nguyên (chip, thẻ, màu).

## Cách ghi MT# mới
| Chỗ | TRƯỚC | SAU |
|---|---|---|
| Hàng lớp, cột Đợt | "MT3 · MT1" / "5 em · 1 em" | **"MT3 · 5 em"** (đợt đông em nhất) + MỘT dòng phụ mờ "+ MT1 · 1 em" khi có lượt khác (MT cũ, vắng dời) |
| Dưới tên em cùng đợt chính | "MT3 ›" ở mọi em | không ghi (đã ở hàng lớp) |
| Dưới tên em KHÁC đợt chính | "Hồ Ngọc Diệp MT1 ›" cạnh tên + dòng phụ "vắng W2 SEP → W3 SEP" | dòng phụ dưới tên: "MT1 › vắng W2 SEP → W3 SEP" (vẫn là link mở lượt) |
| Lớp thường (Progress / Final Test…) | "{bài} ›" cạnh mọi em | không ghi (một lưới = một bài, đã ở hàng lớp "Final Test · 6 em") |
| Quá hạn chấm (gộp nhiều MT) | "MT1 · MT2" / "9 em"; "MT1 ›" mọi em | "MT1 · 8 em" + "+ MT2 · 1 em"; chỉ em MT2 có "MT2 › W2 AUG" |
| Thẻ 375 | "MT3 › · kỳ vọng 6.0" mọi em | em đợt chính chỉ "kỳ vọng 6.0"; em khác "MT1 › · kỳ vọng 5.5" |

## Cột "Còn chờ" — thông tin đi đâu
| Mẩu thông tin | TRƯỚC | SAU |
|---|---|---|
| "n bài chờ duyệt dời" (thẻ vàng) | trong cột Còn chờ | cạnh Tiến độ ("[1 bài chờ duyệt dời] 2 / 27 bài"); 375 vẫn ở dòng 3 của thẻ |
| Ai còn chờ chấm: "Cao Khánh Linh (W2) · Lê Minh Khoa (W1) · … +1" | chữ trong cột (cả hàng Quá hạn, cả thẻ 375) | **tooltip (title) của Tiến độ / số bài** — đủ tên, không cắt "…"; ô điểm trong lưới vẫn cho thấy ô nào còn trống. **Mất: chữ hiện sẵn, và trên điện thoại (không có rê chuột)** — theo lời chủ SP "bỏ đi" |
| Cột Tiến độ · Trạng thái · Hạn chấm | như cũ | như cũ (Tiến độ giãn, Đợt giãn nhường chỗ — cột cố định 210 · giãn · 196 · 140 · 232 · 170) |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Mở / thu lớp, Thu gọn tất cả, Nhập điểm, ô điểm, GV chấm S | như cũ | như cũ | GIỮ |
| Tên em → hồ sơ HV · tên lớp → hồ sơ lớp | như cũ | như cũ | GIỮ |
| "MT1 ›" → trang lượt của em khác đợt chính | cạnh tên | dòng phụ dưới tên | GIỮ (đổi chỗ) |
| "MT3 ›" / "Final Test ›" → trang lượt của em ĐỢT CHÍNH từ lưới Lịch Test | có | **không còn** | MẤT theo lời chủ SP ("bỏ MT3 › lặp"). Vẫn vào trang lượt được từ Kế hoạch Test (ô lượt), hồ sơ HV › bảng Mock, hộp SOS "Mở hồ sơ MTn ›" |
| Chip "n bài chờ duyệt dời" | cột Còn chờ | cạnh Tiến độ | GIỮ (đổi chỗ) |
| Điểm theo lớp, Chấm theo kỹ năng, panel Công việc, hồ sơ | "MTn ›" cạnh tên | như cũ (chỉ Lịch Test đổi, qua `LuotChinhContext`) | GIỮ |

## Kèm theo (không xin thêm)
- Tên HV trong lưới lớp thường không còn bị cắt "Dương Ngọc …" (chiếm chỗ "{bài} ›" không còn) — hợp luật N55; TEN-HV-DU lo phần tên còn lại.
- Không đổi máy chủ / dữ liệu / số request. `gopNoTheoLop` (shared) thêm `luot` (số em theo đợt) từ dữ liệu đã nạp.
- Chữ giải thích EN: `Còn chờ` (tiêu đề cột) hết dùng — giữ `còn chờ: {ds}` cho tooltip.
