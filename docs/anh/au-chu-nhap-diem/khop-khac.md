# AU-CHU · PR2 NHAP-DIEM-GON — khớp / khác

Gói 6 audit 16/11 (P1-10, B3-08, A1-14, A1-16; B1-05 thuộc AU-LUI). Ảnh cặp TRƯỚC (main 18b239c3c) | SAU, demo, tối, phông Be Vietnam Pro đã nạp:

| Ảnh | Màn · vai | Thấy gì |
|---|---|---|
| `progress-mot-em-1440.png` · `progress-mot-em-375.png` | Công việc › việc "MB BE 03 · Hồ Thu Trang · Progress W2 SEP" · GVCN 7 | Tổng số câu L / R điền sẵn 20 / 20 (trước trống, phải gõ) — P1-10; ô điểm ngay sau tên (trước cách ~170 px) — A1-14 |
| `mt-cu-nhap-ho-1440.png` | Nhập điểm MT cũ · ô W1 · GVCN 7 (dạy L, R) | Hộp ghi "Bạn nhập hộ" — A1-16 |
| `s-nhap-ho-ql-1440.png` | Lưới MT2 FT 101 · ô S trống · QL 2 | Mở hộp là con trỏ ở "Người chấm *" (trước ở ô FC, bấm Lưu mới báo) — B3-08 |

| Mã | Sửa | Ghi chú |
|---|---|---|
| P1-10 | Tổng số câu mặc định tính trên MỌI hàng của lượt (`rowsTong`), không trên hàng đã lọc theo việc — cả lưới và màn 375 (`MotKyNang`) | 4 ô → 2 ô mỗi việc một em |
| A1-14 | Lưới gọn lớp thường (panel việc): thêm cột đệm cuối nhận phần thừa; tên giữ 200 px | lưới đầy đủ (trang Test) không đổi |
| A1-16 | MT cũ: ô không phải kỹ năng người xem được phân công → đầu hộp "· Bạn nhập hộ" (phân công lấy từ phiên, 0 request). Trang lượt `/mock-test` đã cho GVCN sửa MT cũ trên main (đã kiểm `GET /attempts/126`, vai 7: mọi kỹ năng sửa được) | KHÁC: chưa ghi "GV W1: {tên}" — lưới không có tên GV phụ trách từng kỹ năng; thêm thì phải đọc thêm phân công lớp |
| B3-08 | QL / Admin nhập hộ S chấm chéo, chưa có GV chấm: mở hộp → con trỏ ở ô Người chấm, nhãn có *; Lưu khi thiếu → lỗi viền + con trỏ về đúng ô | luật 2.4 giữ nguyên |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Nhập Progress việc một em | gõ 2 ô điểm + 2 ô tổng | gõ 2 ô điểm |
| QL nhập hộ S | gõ 4 tiêu chí → Lưu → lỗi → tự tìm ô Người chấm | chọn Người chấm (con trỏ sẵn) → gõ 4 tiêu chí → Lưu |
| "Cả lớp", "Điền ô trống", Enter = Lưu · bài tiếp | có | giữ nguyên |
Không mất thao tác nào.

## Dòng đọc Turso
0 — chỉ sửa web.
