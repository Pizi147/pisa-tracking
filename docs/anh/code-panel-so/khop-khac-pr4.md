# PR 4 (xếp chồng trên #2087) — HV đang học bảng, Tiến bộ tab, vi phạm

Ảnh: `sau-pr4-hv-1440.png`, `sau-pr4-hv-375.png`, `sau-pr4-tienbo-1440.png`, `sau-pr4-vpem-1440.png` (so mockup B6 / B8 / B4 / B5 trong `thiet-ke/v24/anh`).

| Khung | Thành phần | KHỚP / KHÁC |
|---|---|---|
| B6 HV đang học | `SoLieu.tsx` `NganDanhSach` → `BangSoPanel` (Học viên · Lớp · Tuần học · MT gần nhất · Overall / KV, Overall nền nhấn, ✓ / ✗ + màu); máy chủ `metrics.ts` rowsFor("hoc-vien") thêm `khaiGiang` (cùng câu SELECT, +0 câu); web tính "Tuần học" (tuần khai giảng = tuần 1) theo ngày nghiệp vụ | KHỚP cột. KHÁC: bảng chỉ cho dòng HV thuần; dòng có kết luận / thi thật / SOS / xu hướng giữ dạng dòng cũ. Giả định: "Tuần học" = số tuần từ khai giảng lớp (ghi chú v24 mục 11); lớp không có ngày khai giảng → "—" |
| B8 Tiến bộ | `BangLuotPanel` kiểu tang-giam: tab ↑ Tăng · Giữ nguyên · ↓ Giảm, mở sẵn tab của con số ("Giảm" / "Giữ" trong tiêu đề; ô % tiến bộ → Tăng); số đầu panel vẫn là cả tập | KHỚP luật tab. KHÁC: cột giữ Học viên (+lớp) · Kỹ năng · Trước · Sau · Chênh · Kỳ vọng (chưa so từng pixel với mockup) |
| B4 / B5 vi phạm | `BangLuotPanel` kiểu vi-pham: Học viên (+lớp) · Ngày · Vi phạm · Trạng thái; bỏ cột Lớp lặp + Người ghi | KHÁC [XM]: Trạng thái vẫn chip "Quá hạn n ngày" / "Đã xử lý · Report 1" (chưa đổi thành cột Hạn xử lý dd/mm tô màu — cần hạn từ máy chủ); B5 (một em) giữ panel 720 cao theo nội dung (chủ SP: số đếm → panel, hộp neo chỉ cho kết quả thi thật) |

Thao tác: mọi thao tác cũ giữ (link HV / lớp, Xem thêm, tab). Mất: cột Người ghi ở panel vi phạm (mockup bỏ — [XM] cần chủ SP xác nhận nếu muốn giữ).
Trần câu `tocDoDuong.ts`: không thêm câu (cột `start_date` nằm trong SELECT có sẵn).
Chống cắt: Chi nhánh và Ý thức đạt.
