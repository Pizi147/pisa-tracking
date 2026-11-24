# LUOI-1DONG — hàng công cụ lưới lớp thường: MỘT dòng (chủ SP 25/11, plan.md mục 4 #2114)

Ảnh cặp toàn trang (Head, Lịch Test, tối; 375 sáng): `truoc-head-{1440,1280,375}.png` | `sau-head-{1440,1280,375}.png`; GV: `sau-gv-*.png`.

## Thao tác TRƯỚC → SAU
| Thao tác / thành phần | TRƯỚC | SAU |
|---|---|---|
| "Còn chờ: GV (môn) · …" (gồm GV chấm S / P) | dòng riêng trên lưới | cùng dòng công cụ, bên TRÁI; mỗi người một khối không ngắt (xuống dòng chỉ ở dấu "·") |
| "Tổng số câu" + ô từng môn (gõ, tự lưu như cũ) | dòng thứ hai, bên trái | cùng dòng, dồn mép PHẢI; hết chỗ thì cả khối xuống dưới, vẫn sát phải, không cắt / không "…" |
| Nút "Điền ô trống" | có | **BỎ** (chủ SP). Ô tổng còn trống VẪN tự lấy tổng chung của cột (`tongLaySan`) và gõ số câu đúng là lưu kèm tổng đó → nút chỉ điền sẵn, không còn việc nào mất. Mã chết gỡ: `dienHet`, state `dien`, prop `dienTong` + effect ở `ODiem`, 2 chuỗi i18n. Không còn phím tắt nào phụ thuộc. |
| Lưới FT / "Từng kỹ năng" 375 | dòng "Còn chờ" riêng | giữ dòng riêng (không có hàng công cụ); đã bọc khối không ngắt để "(W S)" không gãy giữa chừng |
| Cột lưới, hàng điểm | — | không đổi |

## Ghi chú
- **[XM] Panel Công việc**: bên phải đã có "Mở lưới đầy đủ › · Cả lớp" (khung #2072 đã duyệt) → "Tổng số câu" ở panel GIỮ bên trái; chỉ Lịch Test (và nơi không có công cụ phải) dồn phải. Cần đổi thì báo.
- "GV chấm S": lớp thường không có nút chọn GV chấm S (đó là lưới FT); GV chấm Speaking của lớp thường (P / S) đã nằm trong "Còn chờ".
- Dấu xanh lá sau dòng "Còn chờ" trong ảnh chủ SP: không có trong DOM / CSS của app (chỉ là nét đánh dấu của chủ SP).
- Đo DOM (Playwright, Head): 1440 / 1280 / 1024 mỗi hàng một dòng (cao 33 px, 0 tràn); 800: hàng "Còn chờ" dài nhất → khối "Tổng số câu" xuống dưới cả khối, sát phải. 375 dùng màn "từng kỹ năng" (không đổi bố cục).
- `ponytail:` không thêm. Kiểm: `npm run check` xanh; phép kiểm chuỗi `prUxG` / `prHsm` cập nhật theo.

## Lưới FT (PTA rà #2115) — ảnh `ft-truoc-head-*` | `ft-sau-head-*`
| Thành phần | TRƯỚC | SAU |
|---|---|---|
| "Còn chờ: … · chấm chéo S" | dòng riêng | cùng dòng, trái |
| Ô "GV chấm S [Gõ tên…]" (+ chú giải em không học) | dòng riêng bên dưới, phải | cùng dòng, sát mép phải; hết chỗ (375) cả khối xuống dưới, sát phải |
| Xuống dòng của "Còn chờ" | bất kỳ | chỉ giữa hai người, dấu "·" đi theo người sau; không cắt chữ |
| Lưới cột / ô điểm, panel Công việc | — | không đổi |
