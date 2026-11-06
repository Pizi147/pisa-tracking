# SEX-HANG (PR b) — hàng S Ex mảnh dưới hàng MT ở Kế hoạch Test (chủ SP 06/11)

Lời chủ SP: "hãy cho tôi một thanh nhỏ bên dưới hàng của MT chính là hành dành cho S Ex, không mặc định gì cả đơn giản là head có thể bấm vào đó và xếp ở thanh dưới … nó chỉ cần 1 hàng rất bé ở dưới ghi S Ex 1 2 3 và tuần là ok". Chốt: "Head là Quản Lý nhé và tất nhiên Admin cũng có thể xếp".
Không mockup mới: một hàng theo mẫu chip S Ex sẵn có (khung đứt hồng `--hong`, mockup #659) — `plan.md` 1.3b. Phông đã kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true`.
Dữ liệu demo 18/09: QL Phạm Quang Anh (Hải Dương), lớp HD FT 306.

## Làm gì

| Phần | Cách |
|---|---|
| Hàng | dưới hàng MT mỗi em (lớp FT), cao 28 px (đo): `S Ex · 1 W2 OCT · 2 Xếp · 3 —` — số = thứ tự lượt theo tuần; có điểm thì `1 W2 OCT · 6.5`; em có > 3 lượt thì hiện đủ |
| Xếp | ô trống KẾ TIẾP là nút "Xếp" (như "Xếp MTn" chỉ ở MT kế tiếp) → hộp S Ex sẵn có (`HopSEx`, chọn ngày `ONgay`) |
| Dời / xoá | bấm ô có lượt → cùng hộp: đổi ngày, Xoá + **Hoàn tác** (máy chủ xoá mềm + khôi phục — đã có) |
| Quyền | người sửa được lịch Test (QL · Admin đúng chi nhánh · Quản trị; GVCN lớp đó khi công tắc #1064 bật) — máy chủ `requireSuaLichTest` như cũ; người khác **chỉ xem** (không nút Xếp; ô có lượt chỉ mở khi chấm được — GV Speaking nhập điểm như cũ) |
| 375 | cùng hàng trong thẻ em, ô cao 44 px |
| Dữ liệu | `sEx` lưới đã nạp (`sExCuaHv`, một lô cho cả lớp) — **không câu đọc thêm**, không đổi API, không đổi `tocDoDuong.ts` |

## Ảnh trước | sau

| Nơi | 1440 tối | 375 sáng |
|---|---|---|
| Kế hoạch Test HD FT 306 (QL) | `truoc-kht-1440.png` · `sau-kht-1440.png` | `truoc-kht-375.png` · `sau-kht-375.png` |
| Hộp S Ex mở từ ô "1 W2 OCT" | `sau-hop-sex-1440.png` | — |
| GVCN khi công tắc tắt — chỉ xem (không "Xếp") | `sau-kht-gvcn-chi-xem-1440.png` | — |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Thêm S Ex | cột "Thêm" › "+ MT" › "S Ex · Speaking với chuyên gia" | **giữ** + ô "Xếp" trên hàng S Ex |
| Xem / dời / xoá / chấm một lượt S Ex | chip hồng ở cột "Thêm" (chỉ QL / Admin thấy) | ô trên hàng S Ex (mọi người thấy; mở hộp khi sửa / chấm được) |
| GV chỉ xem thấy S Ex của em | không (cột "Thêm" ẩn) | có (chỉ xem) |

Không mất thao tác nào. Chip S Ex ở cột "Thêm" bỏ (đã ở hàng S Ex — một chỗ một thứ).

## [XM]

1. Xoá một lượt S Ex: ô về trống (số lượt sau dồn lên), có **Hoàn tác** trong toast — không giữ ô mờ "Đã xoá" như MT (PR a): giữ ô sẽ phải đọc thêm lượt đã xoá. Muốn có thì PR riêng.
2. Số 1 / 2 / 3 là thứ tự theo tuần, không phải "suất" cố định: xếp lượt sớm hơn lượt đang có thì số đổi.
