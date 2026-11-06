# SEX-HANG (PR b) — hàng S Ex mảnh dưới hàng MT ở Kế hoạch Test (chủ SP 06/11)

Lời chủ SP: "hãy cho tôi một thanh nhỏ bên dưới hàng của MT chính là hành dành cho S Ex, không mặc định gì cả đơn giản là head có thể bấm vào đó và xếp ở thanh dưới … nó chỉ cần 1 hàng rất bé ở dưới ghi S Ex 1 2 3 và tuần là ok". Chốt: "Head là Quản Lý nhé và tất nhiên Admin cũng có thể xếp".
Không mockup mới: một hàng theo mẫu chip S Ex sẵn có (khung đứt hồng `--hong`, mockup #659) — `plan.md` 1.3b. Phông đã kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true`.
Dữ liệu demo 18/09: QL Phạm Quang Anh (Hải Dương), lớp HD FT 306.

## Làm gì

| Phần | Cách |
|---|---|
| Hàng | dưới hàng MT mỗi em (lớp FT), chữ "S Ex" nhỏ ở cột tên; **mỗi lượt một ô DẸT** (cao 26 px, đo) cùng dáng khung ô MT, **thẳng cột và cùng rộng ô MT** (S Ex 1 dưới MT1, 2 dưới MT2…; đo: cùng x, cùng rộng 174 px). Ô có lượt ghi tuần (+ band); số = thứ tự theo tuần; lượt nhiều hơn số cột MT dồn dưới ô cuối. Chủ SP 06/11 (xem ảnh bản đầu): "S Ex cũng để một box dẹt nhỏ ngang cùng với từng đợt MT chính nhé" |
| Xếp | ô trống ghi "+ S Ex" (người sửa được lịch Test) → hộp S Ex sẵn có (`HopSEx`, chọn ngày `ONgay`); chỉ xem: ô trống nhạt |
| Dời / xoá | bấm ô có lượt → cùng hộp: đổi ngày, Xoá + **Hoàn tác** (máy chủ xoá mềm + khôi phục — đã có) |
| Quyền | người sửa được lịch Test (QL · Admin đúng chi nhánh · Quản trị; GVCN lớp đó khi công tắc #1064 bật) — máy chủ `requireSuaLichTest` như cũ; người khác **chỉ xem** (không nút Xếp; ô có lượt chỉ mở khi chấm được — GV Speaking nhập điểm như cũ) |
| 375 | thẻ em: "S Ex" + ≥ 3 ô dẹt chia đều (ô bấm cao 44 px) |
| Dữ liệu | `sEx` lưới đã nạp (`sExCuaHv`, một lô cho cả lớp) — **không câu đọc thêm**, không đổi API, không đổi `tocDoDuong.ts` |

## Ảnh trước | sau

| Nơi | 1440 tối | 375 sáng |
|---|---|---|
| Kế hoạch Test HD FT 306 (QL) | `truoc-kht-1440.png` · `sau-kht-1440.png` · `sau-kht-them-sex2-1440.png` (bấm "+ S Ex" ô 2 → W4 OCT) | `truoc-kht-375.png` · `sau-kht-375.png` |
| Hộp S Ex mở từ ô có lượt | `sau-hop-sex-1440.png` | — |
| GVCN khi công tắc tắt — chỉ xem (không "Xếp") | `sau-kht-gvcn-chi-xem-1440.png` | — |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Thêm S Ex | cột "Thêm" › "+ MT" › "S Ex · Speaking với chuyên gia" | **giữ** + ô "Xếp" trên hàng S Ex |
| Xem / dời / xoá / chấm một lượt S Ex | chip hồng ở cột "Thêm" (chỉ QL / Admin thấy) | ô trên hàng S Ex (mọi người thấy; mở hộp khi sửa / chấm được) |
| GV chỉ xem thấy S Ex của em | không (cột "Thêm" ẩn) | có (chỉ xem) |

Không mất thao tác nào. Chip S Ex ở cột "Thêm" bỏ (đã ở hàng S Ex — một chỗ một thứ).

## Sửa kèm (PTA rà #1078)

Ô MT "Đã xoá" (từ #1076): "Khôi phục" rơi ra ngoài khung, lệch xuống dưới → nay nằm TRONG khung (dòng 1 "Đã xoá", dòng 2 "Khôi phục"), ô cao 62 px bằng ô thường (đo); bấm phần còn lại của ô vẫn mở hộp; GV chỉ xem: cả ô là link trang lượt. Ảnh `sau-kht-1440.png` (Quách Tuấn Kiệt, MT3).

## [XM]

1. Xoá một lượt S Ex: ô về trống (số lượt sau dồn lên), có **Hoàn tác** trong toast — không giữ ô mờ "Đã xoá" như MT (PR a): giữ ô sẽ phải đọc thêm lượt đã xoá. Muốn có thì PR riêng.
2. Số 1 / 2 / 3 là thứ tự theo tuần, không phải "suất" cố định: xếp lượt sớm hơn lượt đang có thì số đổi.
