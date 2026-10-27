# SUA-375-2 — ba chỗ do-khung còn đỏ (PTA Plan 28/10), sửa nhỏ

| # | Chỗ | TRƯỚC (đo trên main e1c781ac) | SAU | Nơi sửa |
|---|---|---|---|---|
| ① | Hồ sơ HV 375 · việc đầu hồ sơ (`ThanhViec` / `OViec`) | tên việc cắt "…": «Xác nhận xử lý Ý thức · Repor…», «Kết quả W4 SEP – W1 OCT · PA Thê…» | điện thoại tên việc xuống dòng; ≥ 640 px một dòng + title như cũ | `DauHoSo.tsx` |
| ② | Hồ sơ HV lớp thường 375 · bảng Hành trình | cột Lượt 104 → «Progress Test ›» thiếu 6 px, cắt "›." | Lượt 112 · Band 64 (tổng 308 giữ, 4 cột vẫn vừa 343 px) | `HanhTrinhKyNang.tsx` |
| ③ | Bảng "Quá hạn chấm" (Lịch Test tuần, mở từ `/nhap-diem/3`) | Đợt «MT2 · W2 / AUG», Kỹ năng «L, R, W1, W2, / S» xuống dòng (cần 98 px, cột còn 96 / 86) → g1 lệch tiêu đề, g2 lệch đường cơ sở | ba cột đầu [190, 120, 110] → [160, 125, 125] (tổng 410 giữ; hằng số chỉ bảng này dùng); mọi ô canh theo dòng chữ đầu → g1, g2 hết | `HangLop.tsx` (`COT_DAU_LICH_TEST`), `KhoiNo.tsx` |

Ảnh TRƯỚC | SAU: `1-ho-so-hv-viec-375.png` · `2-ho-so-hv-thuong-hanh-trinh-375.png` · `3-qua-han-cham-1440.png` · `3b-qua-han-cham-375.png`.

## do-khung
- hv-hoc-thuat, hv-thuong: xanh (trước 5 + 2 lỗi). hv-hanh-trinh 18 → 14 (bớt 4 lỗi của ①).
- nhap-diem: g1, g2 hết; **còn g3** (cao hàng 47 / 54 / 59 / 70 ở 1440–1280, 144 / 182 ở 375) — xem [XM].
- gv-hop-diem, gvbm-test: xanh.
- Có sẵn, ngoài phạm vi (không đổi số lỗi): hv-hanh-trinh 375 (chữ PA trong khối Hành trình cắt 2 px chân chữ), gvbm 1440 (dòng phụ lớp cắt «LT1 · MT1 · W3 SEP · tuần này»).
- `scripts/mien-do.json`: không có dòng cho ba chỗ này → không gỡ.

## [XM] — g3 bảng "Quá hạn chấm"
Ô "GV chấm" và ô trạng thái ("L, R của bạn: còn 4 bài / W, S: GV khác · quá hạn…") hai dòng theo thiết kế (T17: "xuống dòng, không cắt"), nên hàng cao 47–70 px ≠ {44, 64}; ở 375 bảng là thẻ nhiều dòng.
Đưa về 44 / 64 = đổi mật độ / bố cục bảng (vd mọi hàng 64, hoặc gộp hai dòng trạng thái) → dừng, chờ PTA chọn: (a) hàng 64 cố định cho bảng này · (b) thêm dòng miễn g3 cho `gv-nhap-diem`.

## Thao tác TRƯỚC → SAU
Không đổi: nút việc, link Lượt, Nhập điểm / Thu / Xem, ↗ hồ sơ lớp giữ nguyên vị trí, chữ, đích.
