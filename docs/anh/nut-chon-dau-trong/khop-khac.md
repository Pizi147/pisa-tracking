# NUT-CHON-DAU-TRONG — chip chọn một dáng: ✓ là chữ trong chip

Nguồn: chủ SP chê "✓ lòi ra ngoài viền" (#1669); PTA 15/11: đổi mặc định `NutChon` ở MỌI nơi, bỏ tuỳ chọn `dauTrong` (#1688), một dáng. Mũi mở `MuiTenMo` để GD-18.

## Đổi gì
- `web/src/ui/ui.tsx` `NutChon`: đang chọn = viền + nền nhấn (giữ `CHON`), dấu (✓, hoặc số thứ tự ở chip nhóm nguyên nhân `NhanXet`) là CHỮ trong chip, trước tên — bỏ ô ✓ `absolute -right-1.5 -top-1.5` đè ra ngoài viền. Bỏ tuỳ chọn `dauTrong` (ngăn Xếp nhiều MT dùng mặc định).
- 78 chỗ dùng / 37 tệp đổi theo, không sửa nơi gọi (cùng props).

## Ảnh TRƯỚC (main) │ SAU
| Ảnh | Màn |
|---|---|
| `cap-xep-thuong-1440-toi.png`, `cap-xep-thuong-375-sang.png` | Kế hoạch Test › Xếp lịch Test (lớp thường): chip chương trình "FOU", đợt "Progress Test" |
| `cap-xep-mt-1440-toi.png` | Kế hoạch Test › Xếp nhiều MT: chip Đợt "MT mới" (đã đúng từ #1688 — không đổi) |
| `cap-ho-so-1440-toi.png`, `cap-ho-so-375-sang.png` | Hồ sơ cá nhân GV: chip kỹ năng "L", "R" |

## Đo không tràn mép (mọi nút `aria-pressed="true"` đang hiện, 1440 + 375)
| Màn | TRƯỚC | SAU |
|---|---|---|
| Xếp lịch Test (lớp thường) | "FOU", "Progress Test" TRÀN | không tràn |
| Hồ sơ cá nhân (kỹ năng) | "L", "R" TRÀN | không tràn |
| Xếp nhiều MT (Đợt) | không tràn (đã `dauTrong`) | không tràn |

## Thao tác TRƯỚC → SAU
Không đổi thao tác — chỉ dáng dấu đang chọn. Phép kiểm C36 (`prHk2`) đổi theo: ✓ phải là chữ trong chip, không còn `dauTrong`.

## Turso
0 — chỉ giao diện.
