# PR 3/3 TINH-HINH — panel Xác nhận xử lý · Ghi vi phạm / nhắc nhở · Công việc (GVCN, TVV) · thẻ duyệt QL · KHỚP / KHÁC

Mockup `thiet-ke/v20/tinh-hinh.html` (chủ SP duyệt #1497). Ảnh cặp (trái mockup | phải web, bộ demo, tối):
`xu-ly-1440.png` (D1, GVCN) · `vuot-bac-1440.png` (D2 sau bấm Vượt bậc) · `nhac-nho-1440.png` (B1 sau bấm Chỉ nhắc nhở) · `hop-duyet-1440.png` (E1, QL — userId 2).

| Khung | Thành phần web | Kết quả |
|---|---|---|
| D 4 ô cách xử lý (Nâng 1 bậc = Mặc định · Không nâng · Vượt bậc · Ngoài thang) | `XacNhanXuLyPanel` — `role="radiogroup"`, ô chọn viền nhấn + chấm tròn | KHỚP (panel chuẩn hẹp → 2×2; ≥ 600 px khung → 4 ngang) |
| D chip bậc / loại + dải vàng "Khác mặc định → sẽ gửi QL duyệt. QL có 5 ngày (tới …); hết hạn giữ quyết định của bạn: …" + ⓘ TVV sau chốt | cùng panel | KHỚP |
| D nút chính "Xác nhận · {bậc}" / "Gửi QL duyệt"; Ngày + Người chỉ khi mặc định | cùng panel | KHỚP |
| D bỏ "Đề xuất QL duyệt" (nút chữ trong panel + link ở cột Bước tab lớp / HV) + "← Quay lại Xác nhận xử lý" | gỡ | BỎ (đề bài) |
| D dải tiến trình ①②③ | giữ `TienTrinh` (ô ③ "Sau khi chốt") | KHÁC nhỏ — mockup v20 không vẽ dải (giữ thao tác cũ, chủ SP 22/10) |
| B lựa chọn Vi phạm \| Chỉ nhắc nhở + câu hậu quả + tiêu đề "Ghi nhắc nhở" + "Lưu nhắc nhở"; Sửa đổi được hai chiều | `RecordViolationPanel` | KHỚP |
| B nhãn ô "Nhắc nhở *" thay "Vi phạm *" | giữ "Vi phạm *" | KHÁC nhỏ |
| C2 TVV "Báo PH · Tình hình học tập" — nội dung GV gửi + form Đã báo PH / Chưa liên hệ được | `PanelBaoPhTvv` (khối tình hình thay dải vi phạm) | KHỚP |
| F2 / F4 GVCN "Tình hình học tập · TVV hỏi" — câu hỏi + Kết quả (bộ đếm) + Lưu · gửi TVV + Hoàn tác + Việc tiếp › | `PanelHoiTinhHinh` (Công việc `yt_hoi_tinh_hinh`) | KHỚP (một em một panel — Công việc mở theo dòng việc) |
| E thẻ duyệt: nhãn cách + bậc, "Còn n ngày · 5 vạch · Hết hạn: giữ quyết định GVCN", ≤ 1 ngày nền vàng ⚠ | `HopChoDuyet` `DemNguocYThuc` (thẻ `y_thuc`) | KHỚP phần đếm ngược; **KHÁC**: hộp duyệt giữ dáng danh sách dòng chung mọi loại thẻ (mockup vẽ thẻ lớn riêng) — đổi cả hộp là màn khác |

Ước KHỚP 7 / 10 (3 KHÁC nhỏ có lý do). Chờ chủ SP chấm.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận xử lý bậc kế | panel | ô "Nâng 1 bậc" (mặc định) | GIỮ |
| Đề xuất WL 3 / Meeting / Đình chỉ / Khác · Không tăng bậc | nút chữ → chế độ thứ hai | ô Ngoài thang · Không nâng trong cùng form | ĐỔI chỗ |
| Vượt bậc | không có | ô Vượt bậc | MỚI |
| Rút đề xuất · Sửa lý do · bằng chứng (chờ QL) | panel lần xử lý / Hộp duyệt | như cũ | GIỮ |
| Ghi nhắc nhở · đổi Vi phạm ↔ Nhắc nhở | — | panel Ghi / Sửa vi phạm | MỚI |
| GVCN trả lời TVV hỏi · Hoàn tác | — | Công việc / tab Ý thức | MỚI |
| QL Duyệt / Từ chối thẻ Ý thức | Hộp duyệt | như cũ + đếm ngược | GIỮ |
