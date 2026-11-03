# UI-1 · Sửa hạn Báo PH + Meeting CX — khớp / khác (mockup U10 K5 · K8, chủ SP duyệt 03/11)

Ảnh cặp (trái mockup `thiet-ke/audit-0311/u10-y-thuc.html`, phải web dev `localhost:5831`, dữ liệu seed, phông Be Vietnam Pro đã nạp — `document.fonts.check` = true):
`cap-k5-1440.png` (TVV · panel Báo PH, 1440 tối) · `cap-k5-375.png` (TVV · đang sửa hạn, 375 sáng) · `cap-k8-1440.png` (GVCN · Meeting CX trong Phối hợp SOS, 1440 tối).

## Bảng truy vết
| Khung (mockup) | Thành phần web | Ảnh |
|---|---|---|
| K5a dòng Hạn (ngày · badge còn n ngày · "đã chỉnh · mặc định dd/mm" · Sửa hạn) | `web/src/ui/DongHan.tsx` (mới) trong `PanelBaoPhTvv` | cap-k5-1440 |
| K5a bối cảnh tách trường (Lần xử lý · Người lưu · Lúc lưu · Vi phạm từng dòng · Ghi chú GVCN · Phụ huynh · Điện thoại) | `PanelBaoPhTvv` `BoiCanh` + máy chủ `boiCanh.viPham / ghiChu` | cap-k5-1440 |
| K5a Lịch sử (lần liên hệ + "Đổi hạn cũ → mới") | `PanelBaoPhTvv` | (bấm thử: "Đổi hạn 07/09 → 18/09 · Vũ Hồng Nhung") |
| K5b mặc định · K5d quá hạn | `DongHan` xem | cap-k5-1440 (15/09 còn 1 ngày) · bấm thử (07/09 quá hạn 7 ngày) |
| K5c / K5g đang sửa (ô ngày · Lưu hạn · Huỷ · Về mặc định) | `DongHan` sửa | cap-k5-375 |
| K5e 409 (giữ ngày đã gõ + Tải lại) | `DongHan` lỗi | (đường lỗi — phép kiểm máy chủ HAN-2) |
| K5f việc xong (không Sửa hạn) | `DongHan xong` | (phép kiểm HAN-3) |
| K8 Meeting CX: hạn · mặc định · Sửa hạn; việc không hạn giữ | `PhoiHopSosSection` `ActionRow` → `DongHan gon` | cap-k8-1440 |
| BỎ: chữ "hạn 23:59 dd/mm (còn n ngày)" ở đầu panel | `dauViec ngCanh` — hạn thành trường riêng trong thân | cap-k5-1440 |
| GIỮ: Kết quả · Ngày · Ghi chú · Lưu / Lưu · việc tiếp › · ⋯ Bỏ việc · Khôi phục | `PanelBaoPhTvv` | cap-k5-1440 |

## KHỚP / KHÁC
| # | Chỗ | KHỚP / KHÁC | Lý do |
|---|---|---|---|
| 1 | Dòng Hạn K5 (vị trí, ngày đậm, badge khung + chấm, nguồn hạn, Sửa hạn phải) | KHỚP | |
| 2 | Badge hạn xa | KHÁC | mockup tô vàng "còn 7 ngày"; web giữ luật #814 hạn xa = viên xám, ≤ 3 ngày vàng, quá hạn đỏ ⚠ |
| 3 | Bối cảnh: mỗi trường một hàng | KHỚP | |
| 4 | Nền bối cảnh | KHÁC | web giữ thành phần chung `BoiCanh` (nền surface-2, dùng ở mọi panel việc); mockup kẻ dòng không nền — đổi chung là PR khác |
| 5 | Phụ huynh | KHỚP (khi có tên) | dữ liệu seed em này không có tên PH nên ảnh chỉ thấy Điện thoại |
| 6 | Đang sửa 375: ô ngày cả dòng, Lưu hạn / Huỷ hai nửa, "mặc định dd/mm" | KHỚP | "Về mặc định" chỉ hiện khi đã chỉnh; chữ nút "Huỷ sửa" (luật chữ nút S3: không "Huỷ" trần — cùng chữ chân lưu) |
| 6b | Bàn phím | — | mở sửa → focus ô ngày; Esc / Huỷ sửa / Lưu → focus lại "Sửa hạn", Esc không đóng panel; lỗi → focus ô ngày |
| 7 | Lịch sử: mỗi lần một hàng, tiêu đề + người | KHỚP | web gập khi 0 lần (như cũ) |
| 8 | K8 hàng Meeting CX: hạn + mặc định + Sửa hạn | KHỚP | |
| 9 | K8 bố cục cả phần Phối hợp SOS (phân đoạn "Vi phạm \| Phối hợp SOS", cột Hạn) | KHÁC | thuộc UI-2 / UI-3 (đổi bố cục tab Ý thức) — PR này chỉ thêm Sửa hạn vào hàng hiện có |
| 10 | Đầu panel "VIỆC · BÁO PH" + tên việc | KHỚP | |

KHỚP 8 / 10 (2 KHÁC có lý do: luật #814, thành phần chung; #9 ngoài phạm vi PR).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Xem hạn Báo PH | chữ đầu panel "hạn 23:59 dd/mm (còn n ngày)" | dòng Hạn đầu thân panel, badge trạng thái, nguồn hạn |
| Sửa hạn Báo PH | không có | **MỚI**: Sửa hạn → ô ngày · Lưu hạn / Huỷ / Về mặc định (TVV, TVV cùng CN, GVCN lớp em, QL — máy chủ #831) |
| Sửa hạn Meeting CX | không có | **MỚI**: cùng thành phần, trong hàng việc (GVCN, QL) |
| Ghi kết quả · Bỏ việc · Khôi phục · Lưu · việc tiếp | như cũ | GIỮ |
| Gọi phụ huynh (nút 📞) | trong dòng "Phụ huynh" | GIỮ, dòng "Điện thoại" riêng |
| Lịch sử | chỉ lần liên hệ | + lần đổi hạn |

Không mất thao tác nào.
