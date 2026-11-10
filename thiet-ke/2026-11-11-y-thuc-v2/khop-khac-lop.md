# Y-THUC-V2 · PR-A — tab Ý thức HỒ SƠ LỚP: khớp / khác mockup

Mockup: `y-thuc-v2.html` (bản xem kỹ 0683c824f, chủ SP duyệt 11/11) K1 · K2 · K6 · K9b. Ảnh cặp mockup | web: `anh-cap/cap-lop-1440.png`,
`anh-cap/cap-lop-375.png`, `anh-cap/cap-ls-1440.png`, hộp thang `anh-cap/web-lop-thang-1440.png` (seed, cô Hà, MB FT 101, ngày demo 14/09).

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | |
|---|---|---|---|
| K1 đầu cột ①②③ + ⓘ Báo PH | `BangLan.tsx` `DauCot` | cap-lop-1440 | KHỚP |
| K1 nhóm Bắt buộc (nền vàng) · Mới · Chờ QL · Chờ TVV · Xong 7 ngày | `NhomLan` | cap-lop-1440 | KHỚP (seed không có em "Chờ TVV" đang mở sau khi ghi thử — logic có, xem Lương Gia Bảo ở Chờ QL có Báo PH mở) |
| K1 một lần = một khối, vi phạm mỗi dòng, ô gộp | `KhoiLan` (lưới, không rowspan) | cap-lop-1440 | KHỚP |
| K1 chip môn L · R · W1 · W2 · S, không môn chừa chỗ | `ChipMon` (`violations.skill`) | cap-lop-1440 | KHỚP |
| K1 hộp rê vi phạm (nhóm, xảy ra, người ghi, mô tả, trạng thái) | `HopVp` (CSS hover / focus-within, ẩn khi không có chuột) | cap-lop-1440 (Phạm Bảo Ngọc) | KHÁC nhỏ: không có "Bằng chứng · n tệp" và "Trong lần" — cần thêm câu đọc mỗi lần rê; bấm tên mở đủ (`ChiTietViPham`) |
| K1 ô ② (badge + hạn + Lần này; QL từ chối) | `CanLamEm` + `OBuoc` | cap-lop-1440 (Kiều Minh Đức) | KHỚP |
| K1 ô ③ Báo PH đúng lần + Nội dung + Xem đủ | `OBaoPh` + `BaoPhDu` | cap-lop-1440 (Hà Phương Linh, Lương Gia Bảo) | KHỚP; KHÁC nhỏ: đầu khối Xem đủ chưa có thẻ "đúng hạn · PH: tên" và link "Xem lần xử lý" (lần xử lý mở từ ô ②) |
| K1 Bước tiếp một nút đúng vai / "Chờ …" | `ClassYThucCard` `nutChinh` / `choAi` | cap-lop-1440 | KHỚP |
| K1 hàng vừa Đã xem (Hoàn tác · Xem lại) | `vuaXem` | — (cần bấm) | GIỮ như web cũ |
| K1 hộp thang (chip bậc) | `ChipBac` + `ThangEm` | web-lop-thang-1440 | KHỚP (thang đọc `/students/:id/y-thuc` CHỈ khi mở) |
| K2 375 thẻ lần | `KhoiLan` (khung < 1220 px) | cap-lop-375 | KHỚP; ô ③ ẩn khi lần chưa có Báo PH (như K2a) |
| K6 Lịch sử cùng kiểu dòng, cột "Thao tác", chỉ Đã xem · Đã xử lý · Đã thu hồi | `kLs` | cap-ls-1440 | KHỚP; Tất cả 13 = 5 + 8 + 0 (trước: 15 ≠ 13) |
| K9b QL từ chối → về Bắt buộc · Chờ QL duyệt | `kBb` (`tuChoi`) · `kChoQl` | cap-lop-1440 | KHỚP |
| BỎ: "▾ Chi tiết" cả hàng (chỉ lặp hàng) | — | — | BỎ (mockup) |
| GIỮ: Chọn nhiều + thanh lô, Chưa xác nhận cấp bậc, Phối hợp SOS, panel Duyệt / Báo PH / Xem lần xử lý | như cũ | — | GIỮ |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · Điểm Mock Test › | đầu tab | đầu tab | GIỮ |
| Xác nhận xử lý · Đề xuất QL duyệt | cột Việc | Bước tiếp | GIỮ |
| Đã xem · n · Đã xem vi phạm này | cột Việc · Chi tiết | Bước tiếp · vi phạm mở | GIỮ |
| Hoàn tác · Xem lại (sau Đã xem) | hàng ở lại | khối ở lại | GIỮ |
| Bỏ xem | Lịch sử | Lịch sử · cột Thao tác | GIỮ |
| Sửa · Xoá vi phạm · bằng chứng | Chi tiết › tên | bấm tên vi phạm | GIỮ (bớt 1 bấm) |
| Xem lần xử lý · Thu hồi… | nút Xem / "Thu hồi…" | bấm badge ô ② | GIỮ (Thu hồi trong panel Xem — chủ SP 11/11) |
| Duyệt · Từ chối… · Xem (QL) · Duyệt thu hồi | cột Việc | Bước tiếp | GIỮ |
| Đánh dấu đã thực hiện | cột Việc | Bước tiếp | GIỮ |
| Ghi kết quả báo PH (TVV / QL) | badge / nút | Bước tiếp của lần | GIỮ |
| Sửa hạn Báo PH (GVCN) | trong panel Báo PH (mở được khi TVV/QL) | Xem đủ › Sửa hạn → panel | GIỮ, GVCN mở được |
| Thang · Lịch sử của em › | Chi tiết › Thang › | chip bậc → hộp | ĐỔI chỗ |
| **Đọc Nội dung Báo PH (GV, GVCN, QL)** | không có | ô ③ + Xem đủ ▾ | **MỚI** |

## Dòng đọc / request (đo — xem mô tả PR)
- Mở tab: **không thêm request**. `/classes/:id/y-thuc`: câu phụ dòng thời gian thay 2 câu con bằng JOIN + 3 câu con trên `viec_bao_ph_lan` (chỉ mục `viec_id`), +1 câu `khoangTamDung` chỉ khi có việc Báo PH đang mở.
- "Xem đủ ▾" → `GET /y-thuc/bao-ph/:id` có sẵn, chỉ khi bấm. Chip bậc → `/students/:id/y-thuc` chỉ khi bấm (trước: mỗi "▾ Chi tiết" cũng gọi đường này).
