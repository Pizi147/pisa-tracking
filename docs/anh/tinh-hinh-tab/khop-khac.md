# PR 2/3 TINH-HINH — tab "Ý thức & Phối hợp" (hồ sơ lớp + hồ sơ HV) · KHỚP / KHÁC

Mockup: `thiet-ke/v20/tinh-hinh.html` (chủ SP duyệt #1497). Ảnh cặp (trái mockup | phải web, bộ demo, GVCN — userId 7, tối): `lop-1440.png` (A1) · `lop-375.png` (A2a) ·
`hv-1440.png` (A4a) · `hv-375.png` (A4b) · `hop-bao-1440.png` (C1, sau bấm "Báo tình hình").

## Bảng truy vết khung → thành phần
| Khung | Thành phần web | Kết quả |
|---|---|---|
| A1 tab nhỏ | `TabNho` (BangLan.tsx) — "Tình hình học tập / Ý thức" · "Phối hợp SOS n" | KHỚP |
| A1 thanh công cụ | Tất cả / Việc của tôi · Tìm em · Điểm Mock Test › · **Báo tình hình** · + Ghi vi phạm · ⋯ (Khai / sửa cấp bậc · Chọn nhiều) | KHỚP |
| A1 cột | `DauCotEm` Học viên · **Vấn đề** · Đã xử lý · Bước đang làm | KHỚP |
| A1 nhãn loại dòng | `TheLoai` Vi phạm · n / Nhắc nhở / Tình hình / TVV hỏi | KHỚP |
| A1 dòng tình hình | `TinhHinh.tsx` `TheTinhHinh` · `NoiDungTinhHinh` · `daXuLyTinhHinh` · `BuocTinhHinh` | KHỚP |
| A1 nhắc nhở trong khối (7 ngày) + "n nhắc nhở · không việc chờ" | ClassYThucCard `nhacGan` | KHỚP |
| A1 chip mốc | `ChipBac` + `chuMoc` — **REPORT 1 / WARNING LETTER 1** viết hoa, bỏ "Đã tới" (chủ SP 12/11, sau duyệt mockup) | KHÁC có chủ ý (lời mới hơn mockup) |
| A1 em sạch | "✓ Chưa có vi phạm" (chữ chủ SP 12/11, mockup ghi "Chưa có vấn đề nào"), không chip | KHÁC có chủ ý (lời mới hơn mockup) |
| A4 dải mốc | MỐC VIẾT HOA · ngày · Bậc kế · Thang ▾ · Khai / Hỏi / Báo tình hình · + Ghi vi phạm | KHỚP (mốc viết hoa như trên) |
| A4 Đang chờ / Cả quá trình | `StudentYThucSection` — lọc Tất cả · Vi phạm · Nhắc nhở · Tình hình + Lộ trình | Cả lịch sử + Mọi nhóm | KHỚP |
| A4 cột Ngày + thang mini 6 vạch cạnh mốc | `DongLan moc` (lưới 96 · Vấn đề · 320 · 236) · vạch tô theo bậc | KHỚP |
| C1 hộp Báo tình hình | `HopTinhHinh` (HopNeo) — Học viên · Gửi tới · Hạn TVV · Nội dung (bộ đếm 500) · Đóng / Gửi TVV | KHỚP |
| C1 "+ Tệp · + Liên kết" | không làm — PTA quyết 12/11 (không thêm lúc này) | KHÁC có quyết định |
| C3 / F3 tấm dưới 375 | `HopTinhHinh` ≤ 639 px: tấm dưới (nền mờ, Esc / bấm nền đóng) | KHỚP |
| BỎ | phân đoạn "Vi phạm \| Phối hợp SOS", "Cần làm \| Lịch sử" (hồ sơ HV), nhóm "Xong · 7 ngày" (vào Cả quá trình) | BỎ theo mockup |
| GIỮ | "Đề xuất QL duyệt" — bỏ ở PR 3 cùng panel 4 lựa chọn (bỏ ở đây thì GVCN mất đường gửi QL) | GIỮ tạm |

**KHỚP 13 / 14** (93 %). KHÁC duy nhất: + Tệp / + Liên kết ở hộp Báo tình hình — PTA quyết không thêm. Chip mốc viết hoa theo lời chủ SP mới hơn mockup (tính KHỚP). Ảnh thêm: `hop-bao-375.png` (C3).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Vi phạm \| Phối hợp SOS | phân đoạn | 2 tab nhỏ | ĐỔI dáng |
| Khai / sửa cấp bậc · Chọn nhiều (lớp, 1440) | nút | trong ⋯ | ĐỔI chỗ |
| Báo tình hình (GV, QL) · Hỏi tình hình (TVV, QL) | — | nút đầu tab + hộp | MỚI |
| Ghi kết quả báo PH tình hình (TVV) · Sửa / Rút (người gửi) · Ghi kết quả / Hoàn tác / Sửa kết quả (GVCN) | — | cột Bước đang làm | MỚI |
| Hồ sơ HV: Cần làm \| Lịch sử · lọc Đã xem / Đã xử lý / Đã thu hồi | phân đoạn + chip | Đang chờ + Cả quá trình · lọc Vi phạm / Nhắc nhở / Tình hình | ĐỔI (mockup A4) |
| Mọi thao tác cũ trên dòng (Xác nhận xử lý, Đã xem, Bỏ xem, Duyệt, Thu hồi, Báo PH, Sửa hạn, Xem lịch sử, Thang, Khai bậc…) | có | như cũ | GIỮ |

## [XM] đã quyết (PTA 12/11)
- Em có vi phạm nhưng chưa tới mốc → **"Chưa có mốc"**; em chưa có vi phạm → "Chưa có vi phạm" (em sạch ở tab lớp không chip — dòng ghi "✓ Chưa có vi phạm" — PTA 12/11).

Turso: +0 câu so PR 1 (dữ liệu tình hình / nhắc nhở đã có trong `/classes/:id/y-thuc`, `/students/:id/y-thuc`).
