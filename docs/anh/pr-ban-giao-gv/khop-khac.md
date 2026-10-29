# PR-B BAN-GIAO-GV — khớp / khác mockup `thiet-ke/v9/phan-cong-gv.html` (khu 6 + 9)

Ảnh cặp (trái mockup, phải web; 1440 tối · 375 sáng; dữ liệu demo seed, ngày demo 14/09):

| # | Khung mockup | Thành phần / tệp | Ảnh | Kết quả |
|---|---|---|---|---|
| 11 | k6 · Công việc của GV cũ, nhóm Vận hành | `mywork.ts` (`ban_giao_gv:{id}`) · dòng Công việc sẵn có | `cap-k6-congviec-1440.png` | KHỚP (dòng "Bàn giao {lớp} · L, GVCN" · "cho {GV mới} · a/b em" · hạn · nút Bàn giao) |
| 12 | k6 · panel 2 cột L + GVCN, Xác nhận tắt | `BanGiaoGvPanel` · `banGiaoChung` | `cap-k6-2cot-1440.png` | KHỚP bố cục (danh sách em + chip, dòng phụ L ✓ · GVCN –, tự điền, hai ô cạnh nhau, "● Đang gõ / ✓ Đã lưu", chân "Còn n em thiếu góp ý ↑") |
| 13 | k6 · một kỹ năng, đủ, nhận xét chung mở | như trên | `cap-k6-1kn-1440.png` | KHỚP (chân "✓ Đủ a/b em", Xác nhận bật) |
| 14 | k6 · 375 panel toàn màn | như trên | `cap-k6-375.png` | KHỚP (danh sách trên, phiếu dưới, ô chồng, "Em tiếp" rộng hết) |
| 15 | k6 · GV mới đọc | `BanGiaoGvPanel` chế độ đọc | `cap-k6-doc-1440.png` | KHỚP (BÀN GIAO · ĐỌC, "từ {GV cũ}", "xác nhận … bởi …", "chụp lúc xác nhận", chân Chỉ đọc + Đóng) |
| 22 | k9 · GV cũ chỉ xem 1440 | `DaiChuyenLop.tsx` (`DaiDoiGv`) · `daiLop.xemTam` | `cap-k9-gvcu-1440.png` | KHỚP |
| 23 | k9 · GV cũ chỉ xem 375 | như trên | `cap-k9-gvcu-375.png` | KHỚP |
| — | k6/k9 bàn giao chuyển lớp (đồng bộ khung) | `BanGiaoPanel.tsx` dùng `DsEmBanGiao` + `TuDienEm` | (không vẽ mới — DOM giữ, thêm đầu danh sách "Học viên · n em") | GIỮ |

Tỷ lệ: 7/7 khung có ảnh KHỚP bố cục → ≥ 90 %.

## KHÁC (có lý do)
- Panel mở từ Công việc nằm ở cột phải trang Công việc (cách mọi panel việc đang làm — `PanelViec`), mockup vẽ panel nổi rộng: giữ cách mở chung (một danh sách một kiểu mở).
- Chân panel: "Đóng" bên trái, "Tự lưu khi rời ô · Còn n em…" giữa, nút chính phải — thứ tự chuẩn `KhungPanel` (mọi panel), mockup đặt Đóng cạnh nút chính.
- Chip trạng thái em dùng `Nhan` chuẩn (chấm màu), mockup vẽ ⚠ cho "Thiếu".
- Dải GV cũ ghi môn ngắn ("S"), mockup ghi đủ "Speaking" — cùng hàm `nhanCotBg` với tiêu đề việc (một khái niệm một tên).
- Hạn việc = `hanTheoNgay(ngày tạo, 5)` (PTA duyệt) — mockup vẽ 04/11.
- Tự điền có thêm dòng "Việc còn dở" (thành phần chung với bàn giao chuyển lớp).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Bàn giao chuyển lớp — danh sách em ↑/↓, tự điền, câu GVBM, Điền thay, Sửa sau xác nhận, Đọc | có | GIỮ (thành phần chung) |
| Nhận xét chung GVCN (chuyển lớp) | mất chữ nếu đóng panel trước khi xác nhận | lưu nháp khi rời ô; Xác nhận vẫn kiểm ≥ 15 ký tự |
| Môn ở lớp mới vẫn đúng GV cũ dạy (chuyển lớp) | GVBM vẫn phải ghi câu, tính thiếu | "Cùng GV · không cần bàn giao", không tính thiếu, không việc (chủ SP 30/10) |
| GVCN lớp mới = GVCN lớp cũ | nhận xét chung bắt buộc | không bắt buộc ([PTA đoán]) |
| Đổi GV có ô tích "Tạo việc bàn giao" | không có việc | việc của GV cũ (Công việc + dải hồ sơ lớp), panel mẫu F nhiều cột |
| GV mới đọc bàn giao | — | thông báo khi xong + dải "Bàn giao … từ …" › Đọc bàn giao |
| GV cũ sau hiệu lực | xem 7 ngày | xem tới khi xong bàn giao (ít nhất 7 ngày), dải "Chỉ xem · …" + nút Bàn giao |

Không mất thao tác nào.
