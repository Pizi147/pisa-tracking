# Y-THUC-V2 · PR-C — panel trang Công việc (Xác nhận xử lý · Xem vi phạm mới · Báo PH TVV): khớp / khác mockup

Mockup: `y-thuc-v2.html` K8a–K8d + K5b. Ảnh cặp mockup | web (seed, ngày demo 14/09): `anh-cap/cap-cv-xl-1440.png` (GVCN cô Hà · Phạm Bảo Ngọc),
`cap-cv-xem-1440.png` (Nguyễn Minh An), `cap-cv-bph-1440.png` (TVV Lê Thu · Đoàn Minh Khang), `cap-cv-xl-375.png`, `cap-cv-bph-375.png`.

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | |
|---|---|---|---|
| K8 dải ① Vi phạm → ② GVCN xử lý → ③ TVV báo PH, bước đang làm nền nhấn + "Bạn" | `BangLan.tsx` `TienTrinh` (375: mỗi bước một hàng, nhãn ngắn GVCN / Báo PH) | cap-cv-xl-1440 · 375 | KHỚP |
| K8a / K8c panel Xác nhận xử lý: tiến trình + vi phạm chip môn + Bậc / Ngày / Người / Mô tả | `XacNhanXuLyPanel` (giữ form cũ) | cap-cv-xl-1440 · 375 | KHỚP; GIỮ "Em này còn" + Bối cảnh "Lần trước · Bậc tiếp theo" (ngoài mockup, có sẵn) |
| K8b panel Xem vi phạm mới (thay nhét cả tab HV vào panel) | `PanelXemViPham` mới (một request như cũ) | cap-cv-xem-1440 | KHỚP; chân: Xác nhận xử lý (mở panel xử lý ngay đây) · Đã xem · n (Hoàn tác ở thông báo) |
| K5b / K8d panel Báo PH TVV: tiến trình + Vi phạm (chip) + Ghi chú GVCN + PH + Điện thoại + Kết quả · Ngày · **Nội dung *** | `PanelBaoPhTvv` | cap-cv-bph-1440 · 375 | KHỚP; bỏ 3 dòng Lần xử lý / Người lưu / Lúc lưu (đã ở bước ②) |
| Nội dung BẮT BUỘC (chủ SP 11/11) | web chặn tại ô + máy chủ `ghiKetQuaBaoPh` 400 | — | MỚI |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận xử lý · Đề xuất QL duyệt · đính kèm | panel | panel (thêm dải tiến trình) | GIỮ |
| Xem vi phạm mới → Đã xem / Xác nhận xử lý / Sửa · Xoá vi phạm / Khai bậc | cả tab HV trong panel | panel gọn: Đã xem · n · Xác nhận xử lý · vi phạm mở (Sửa · Xoá) · "Hồ sơ Ý thức của em ›" | GIỮ (Khai bậc, Lịch sử: qua "Hồ sơ Ý thức ›") |
| Ghi kết quả báo PH · Sửa hạn · Bỏ việc · Khôi phục · Lưu · việc tiếp | panel | panel | GIỮ |
| Ô "Ghi chú kết quả" (không bắt buộc) | có | ô **"Nội dung" bắt buộc** | ĐỔI (chủ SP 11/11) |

## Dòng đọc / request
Panel Xem vi phạm mới: `/students/:id/y-thuc` — một request như trước (trước nhúng cả tab HV, thêm `/students/:id/phoi-hop-sos`: nay bớt 1 request). Báo PH: thêm cột `skill` vào câu vi phạm của lần (không thêm câu). Không migrate.
