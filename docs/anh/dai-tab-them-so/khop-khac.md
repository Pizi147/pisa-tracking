# Dải tab Công việc: "Thêm" có số, tab không nhảy · chip Mô tả Case (chủ SP 25/11)

Ảnh cặp toàn màn (vai Quản trị Đỗ Vũ Tuấn Phong, Công việc › Của GV, panel mở, tối): `truoc-*` | `sau-*` — `tab-1440/1280` (dải tab), `tab-*-menu` (menu Thêm mở), `case-1440/1280` (ô Mô tả Case).

## TRƯỚC → SAU thao tác
| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Bấm một tab hạng mục | Tập tab hiện có thể đổi (vd "Ý thức & Phối hợp" lúc có lúc không) vì thanh cuộn của `<main>` hiện / ẩn theo độ dài danh sách → hàng rộng đổi 10 px | Hàng luôn tính như đang có thanh cuộn: tập tab hiện + vị trí x chỉ phụ thuộc bề rộng cửa sổ và thứ tự cố định, không theo tab chọn |
| Nhìn "Thêm ▾" | Không có số — không biết trong menu có việc | Badge tổng số việc các tab trong menu, cùng kiểu badge tab (đỏ khi có quá hạn, vàng hạn hôm nay, mờ khi chỉ đếm; 0 = không vẽ). Không thêm lời gọi API |
| Chọn tab nằm trong "Thêm" | "Thêm" gạch chân (đã có) | Giữ; menu thêm nền nhấn + `aria-current` ở mục hiện tại |
| Mở menu Thêm / chọn mục | giữ nguyên | giữ nguyên (portal, không bị cắt) |
| Ô "Mô tả" Case trống, đang là việc của ai đó | Chip "việc của … · hạn …" nằm TRONG ô, chen chỗ chữ gợi ý (chữ xuống 2 dòng ở 1440) | Chip nằm DƯỚI ô, ô một dòng; bấm ô vẫn mở gõ tự lưu như cũ |
| Ô Mô tả đang gõ | chip ở dòng chân ô (không đổi) | không đổi |

Mất thao tác: không. Chỉnh nhỏ: chỗ dành cho "Thêm ▾" 92 → 124 px (có sẵn chỗ badge) — ở 1280 panel mở có thể hiện ít hơn 1 tab so với trước ở vài bề rộng.

## Kiểm (Playwright, tối)
Script ở scratchpad. Vai Quản trị (1) · Head QL (2) · GV (7); 1440 / 1280; panel đóng và mở; bấm LẦN LƯỢT mọi tab: tập tab hiện + x không đổi (ỔN ĐỊNH=true), badge Thêm = tổng số các tab ẩn (đúng mọi ca: 11 @1440, 18 @1280), mọi mục menu `elementFromPoint` trúng chính nó và menu nằm trong cửa sổ. 375: không có "Thêm" (hàng tab cuộn ngang, tự canh tab chọn vào giữa — hành vi cũ); panel mở thì danh sách ẩn.

## [XM] / để sau
- Nhãn "Thêm · <tên tab>" khi tab chọn nằm trong menu: chưa làm (gạch chân + mục nền nhấn đã đủ báo; nhãn dài dễ vỡ ở 1280).
