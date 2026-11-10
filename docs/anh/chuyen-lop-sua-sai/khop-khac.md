# Chuyển lớp sửa sai một bấm, bàn giao một phiếu — bản rà 11/11 mục 3 #8

Chủ SP 11/11: "Theo hết 10 đề xuất". Gốc: G4-05, G4-06, G4-07, G4-08, G4-14 (G4-15 xem cuối). Chỉnh theo mẫu sẵn có (link "Hoàn tác" trong dòng trạng thái như toast, bỏ khối lý do, gộp việc) — không cần mockup.
Ảnh "trước": `docs/superpowers/specs/2026-11-11-ra-toan-bo/anh/` (G4-23, G4-24, G4-31…33, G4-38, G4-39). Ảnh "sau": `sau-*.png` (seed 14/09, QL vy.nguyen · GVCN ha.tran).

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau | Gốc |
|---|---|---|---|
| Hồ sơ HV · dải "Sắp chuyển" › Huỷ quyết định | mở lại panel Chuyển lớp › Huỷ quyết định › **Lý do huỷ \*** › Xác nhận (4 bấm) | **huỷ ngay** (1 bấm) + toast "Đã huỷ quyết định chuyển lớp · Hoàn tác" (khôi phục đúng lệnh) | G4-08 |
| Panel Chuyển lớp · chân "Huỷ quyết định" | mở khối Lý do huỷ bắt buộc | huỷ ngay + Hoàn tác (cùng hàm `huyQuyetDinhNgay`) | G4-08 |
| Huỷ nhiều quyết định (làm nhiều HV) | lý do bắt buộc | lý do không bắt buộc (có thì ghi nhật ký / chuông) | G4-08 |
| Chuyển lớp › "Ngay hôm nay" › Chuyển ngay | "Đã chuyển …" — **không Hoàn tác** | "Đã chuyển … · **Hoàn tác**" → em về lớp cũ y như trước (lớp, lộ trình, lượt, Case / PA, sổ nghĩa vụ, chuông của em); có thay đổi sau → 409 nói rõ | G4-14 |
| Duyệt đề xuất chuyển lớp (thẻ Chờ duyệt) | Duyệt = ra lệnh, không Huỷ quyết định | Huỷ quyết định / Hoàn tác ở panel (cả "Ngay hôm nay"): thẻ về Chờ duyệt, em + lệnh y như trước | G4-14 |
| Công việc của GVCN dạy luôn L + R | 3 việc: "Bàn giao", "Bàn giao môn L", "Bàn giao môn R" | **1 việc** "Bàn giao {em} → {lớp}" (môn của mình viết trong phiếu GVCN) | G4-06 |
| GVBM dạy nhiều môn của lớp (W1 · W2 · S…) | mỗi môn một việc (W1 · W2 đã gộp) | **1 việc** "Bàn giao môn W2 · S" (bảng nhiều cột); dải hồ sơ lớp / hồ sơ HV cùng luật | G4-06 |
| Phiếu GVCN · môn của chính mình | "Chưa có · Trần Ngọc Hà · **Điền thay**" | "**Viết**" (môn người khác vẫn "Điền thay"; tiêu đề "GVCN điền thay được" chỉ khi còn môn người khác) | G4-07 |
| Ô "Lớp chuyển đến" | MB FT 102, MB FT RF 12, MB FOU 12, Pre FOU, BC…, CP…, rồi MB FT 103 | cùng chi nhánh → cùng loại (FT cùng lộ trình) → mã theo số: MB FT 103 · 104 · 105 · 102 (LT2) · RF 12 · MB BE… · chi nhánh khác | G4-05 |

Không mất thao tác nào (Huỷ quyết định vẫn ở dải + chân panel + làm nhiều HV; Khôi phục giữ).

## Hình ảnh
- "Hoàn tác" là link đậm trong dòng trạng thái ✓ (cùng kiểu link "Sửa" ở Tổng kết), không thêm nút chân.
- Bỏ khối "Huỷ quyết định · Lý do huỷ · Xác nhận" của panel.
- Không đổi màu, cỡ chữ, khoảng cách.

## Đọc Turso
Mở trang: 0 câu thêm. Ghi (thao tác hiếm): "Ngay hôm nay" FT → FT 78 → **154 câu**, 156 → **471 dòng** (chụp 21 bảng của một em để Hoàn tác); Hoàn tác 27 câu / 19 dòng; Duyệt đề xuất chuyển lớp cũng chụp như vậy. Chuyển lớp chỉ vài lần / ngày → vài nghìn dòng / ngày.

## Còn lại
- G4-15 (hộp + toast Lưu phân công lấy số việc thật từ máy chủ): làm trong PR này nếu kịp, không thì PR riêng (ghi ở mô tả PR).
