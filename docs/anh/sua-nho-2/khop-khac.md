# SUA-NHO-2 — 6 mục tồn SUA-NHO-UI + ra-ui 375

Kiểm trên web (cổng riêng, `npm run seed`) trước khi sửa. Đọc diff #781: không mục nào trùng.

| # | Mục | Hiện trạng đã kiểm | Xử lý | Ảnh |
|---|---|---|---|---|
| 1 | `HanPhu` hạn xa TVV 2 dòng | Còn: cột hạn "hạn 18/09" + "còn 4 ngày" | Theo mockup mới hơn `v7/cong-viec-2.html` (`t2: 'còn 4 ngày'`, hạn một viên): "còn n ngày" lên dòng phụ của việc, cột hạn 1 dòng. Bỏ "hạn bước tiếp" (dòng việc đã là "Chọn bước tiếp", mockup không có) | `1-han-tvv-*` |
| 2 | Chấm Test 375 tiêu đề gãy | Còn: khối "n bài + hạn" chiếm cột phải cả 2 hàng, tiêu đề và dòng phụ gãy | < 640: tiêu đề, dòng phụ hết bề rộng; "n bài ······ hạn" thành hàng thứ 3. Số hàng gần như giữ nguyên | `2-cham-test-375-toi` |
| 3 | Cột Trạng thái hồ sơ lượt rộng | Còn: 266 px, Nhận xét / Case 222 | `1.2fr` → `1fr`: 237 / 237 / 237 — đúng mockup `v7/ho-so-luot-test.html` (Trạng thái 17 % ≈ 238 px trên 1400) | `3-ho-so-luot-1440-toi` |
| 4 | Ô "Lớp khác" dòng phụ 2 dòng | Còn | `ChonLop` (mọi nơi chọn lớp): dòng phụ cùng hàng, đẩy phải như `v6-chung.css .chon-lop .dong .phu`; không đủ chỗ thì xuống dòng, không cắt. Người chọn người giữ 2 dòng | `4-chon-lop-*` (Chuyển lớp, cùng ô — demo TVV không có lớp LT để mở "Lớp khác") |
| 5 | Chân panel 375 Huỷ \| Lưu cùng hàng | **Đã hết** (RA-UI-1): "Đóng \| Tạo Case", "Đóng \| Quyết định chuyển lớp" cùng hàng | Không sửa | `4-chon-lop-375-toi` (chân panel) |
| 6 | "+ MT ▾" xa cột cuối | Còn: nút căn giữa cột 136 px, cách ô đợt cuối ~31 px; mockup sát trái, đệm 8 px | `self-center` → `self-start`, thẳng hàng S Ex | `6-them-mt-*` |

Ảnh: trái / trên = trước, phải / dưới = sau (vạch hồng ở giữa). Giao diện tối, tài khoản demo.

## Bảng thao tác TRƯỚC → SAU
Không đổi thao tác, quyền, luồng, dữ liệu. Không thêm request.

| Thao tác | Trước | Sau |
|---|---|---|
| Mở việc TVV, Ghi báo PH, Chốt bước tiếp, Gia hạn | như cũ | như cũ |
| Mở nhóm bài ở Chấm Test (cả dòng là nút) | như cũ | như cũ, 375 đổi chỗ hiển thị "n bài · hạn" |
| Chọn lớp: gõ tìm, ↑ ↓, Enter, dòng mờ `tat` | như cũ | như cũ, chỉ đổi vị trí dòng phụ |
| + MT ▾ (MT kế tiếp · S Ex) | như cũ | như cũ, nút dời sang trái cột |

Chữ bỏ duy nhất: "hạn bước tiếp" (không mất thông tin, hạn vẫn hiện "hạn 21/09").

## KHÁC (chủ SP xem ảnh)
- Mục 3: critique 29/10 đề xuất `150px`, mockup là 17 %. Theo mockup (hình ảnh theo mockup sát), cột vẫn rộng hơn chữ chip.
- Mục 1: em có "⚠ Chưa liên hệ được · lần n" giữ thêm "còn n ngày" cạnh badge (mockup chỉ vẽ badge ở việc sắp hạn; hạn xa thì giữ để không mất số ngày).

## [XM] Để sau (ngoài phạm vi)
- Hạn xa trên mockup v7 là viên xám `.td`, web `ChipHan` còn chữ trơn (`web/src/ui/Nhan.tsx`). Đổi một dòng nhưng chạm mọi danh sách có hạn, mọi vai → PR riêng, chủ SP duyệt.
- `do-khung` 375: `test-lichTest`, `test-diem-lop` báo "Phạm Bảo Ngọc" cắt 5 px; đã đo trên code gốc, có từ trước, không do PR này.

## Đo
- `do-khung cv-tvv`, `test-`: không lỗi mới. Còn "·" đầu panel và "thi IELTS" (#781 đang sửa), "Phạm Bảo Ngọc" (có từ trước).
- audit + web-design-guidelines (phạm vi diff): không P0 / P1. `/ponytail-review`: "Lean already". Không có chú thích `ponytail:`.
- Đọc dòng Turso: không đổi (chỉ CSS / vị trí chữ).
