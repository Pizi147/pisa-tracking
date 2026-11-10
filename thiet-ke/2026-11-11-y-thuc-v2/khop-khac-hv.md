# Y-THUC-V2 · PR-B — tab Ý thức HỒ SƠ HV: khớp / khác mockup

Mockup: `y-thuc-v2.html` K3 (1440) · K4a / K4b (375). Ảnh cặp mockup | web: `anh-cap/cap-hv-1440.png` (Hà Phương Linh — Xong, Báo PH mở Xem đủ),
`anh-cap/cap-hv-1440b.png` (Phạm Bảo Ngọc — Bắt buộc, Thang mở), `anh-cap/cap-hv-375.png` (seed, cô Hà, ngày demo 14/09).

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | |
|---|---|---|---|
| K3 phân đoạn Vi phạm \| Phối hợp SOS · Cần làm \| Lịch sử · Khai / sửa cấp bậc · + Ghi vi phạm | `StudentYThucSection` đầu thẻ | cap-hv-1440 | KHỚP |
| K3 dải bậc một hàng: Đã tới · Bậc kế · Thang ▾ | dải bậc + `ThangYThuc` mở tại chỗ | cap-hv-1440b | KHỚP |
| K3 khối lần không cột Học viên, ①②③ | `KhoiLan hv={null}` + `DauCot coHv={false}` (dùng chung PR-A) | cap-hv-1440 · 1440b | KHỚP |
| K3 vi phạm mở tại chỗ (mô tả, bằng chứng, Sửa · Xoá, Đã xem vi phạm này) | `ChiTietViPham` trong khối | — (cần bấm) | GIỮ |
| K3 ô ③ đọc Nội dung + Xem đủ | `OBaoPh` + `BaoPhDu` | cap-hv-1440 | KHỚP |
| K3 "Lần này" chỉ khi phải xử lý; vi phạm lẻ → "Bậc kế" ở dải bậc | ô ② bắt buộc / dải bậc | cap-hv-1440b | KHỚP (web cũ ghi "Lần này Report 4 + Meeting" cho em mới 1 vi phạm chưa xem) |
| K4b GVBM: không nút xử lý, "Chờ GVCN …" | `choAi` | — | KHỚP (quyền máy chủ như cũ) |
| K6 Lịch sử cùng kiểu dòng, cột Thao tác, Đã xem · Đã xử lý · Đã thu hồi + phạm vi + nhóm | `kLs` | — | KHỚP |
| BỎ: dải 5 ô "Cần làm · Người xử lý · Đã tới · Lần này · Báo PH" + hàng 4 nút khác kiểu (`TomTatEm`) | — | — | BỎ (mockup) — thay bằng dải bậc + Bước tiếp |
| BỎ: khối cũ không còn ai dùng ở `khoiYThuc.tsx` (`BaoPhEm`, `TomTatEm`, `DsViPhamCho`, `LanTruoc`, `BangLichSu`) | — | — | BỎ (−~190 dòng) |
| GIỮ: thẻ việc của tôi đầu hồ sơ (vd "Xác nhận xử lý Ý thức · Report 2") | `StudentDetailPage` | cap-hv-375 | GIỮ (luật "việc của tôi ở trang đầu") |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Ghi vi phạm · Khai / sửa cấp bậc | đầu thẻ | đầu thẻ | GIỮ |
| Xác nhận xử lý · Đề xuất QL duyệt · Đánh dấu đã thực hiện | hàng 4 nút dưới dải tóm tắt | Bước tiếp của khối | GIỮ |
| Đã xem · n · Đã xem vi phạm này · Hoàn tác · Xem lại | hàng nút · dòng mở · hộp xanh | Bước tiếp · vi phạm mở · khối ở lại | GIỮ |
| Sửa · Xoá vi phạm | nút Sửa cuối dòng · dòng mở | bấm tên vi phạm (ChiTietViPham, quyền máy chủ) | GIỮ |
| Xem lần xử lý · Thu hồi… | badge Cần làm / dòng Lịch sử "Xem" | badge ô ② | GIỮ |
| Ghi kết quả báo PH (TVV / QL) · Sửa hạn (GVCN) | ô Báo PH của dải tóm tắt | Bước tiếp / Xem đủ › Sửa hạn | GIỮ |
| Thang | ⓘ cạnh "Đã tới" | Thang ▾ ở dải bậc | ĐỔI chỗ |
| Bỏ xem · lọc Lịch sử · phạm vi · nhóm | Lịch sử | Lịch sử | GIỮ |
| **Đọc Nội dung Báo PH** | không có | ô ③ + Xem đủ ▾ | **MỚI** |

## Dòng đọc / request
Không đổi máy chủ ở PR này (dùng `dongThoiGian` của PR-A). `/students/:id/y-thuc` đo 53 → 53 dòng (PR-A). Mở tab không thêm request; "Xem đủ" gọi `GET /y-thuc/bao-ph/:id` chỉ khi bấm.
