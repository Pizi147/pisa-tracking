# RA-UI — điểm critique TRƯỚC → SAU (đêm 29/10)

Cách chấm: Nielsen 10 nguyên tắc × 0–4 = /40, mỗi màn chụp cặp mockup đã duyệt | web ở 1440 tối + 375 sáng, so màu / nền / viền / độ đậm / cỡ chữ / khoảng cách / phân cấp 4 tầng. TRƯỚC: 2 agent chấm độc lập trên `main` + #676 (`critique-a-…md`, `critique-b-…md`). SAU: agent thứ ba chấm lại CÙNG cách, cùng ảnh mockup, trên bản gộp #676 #678 #680 #681 #682 #683 (`critique-sau.md`) — chưa gồm RA-UI-7.

| Nhóm | Màn · vai | TRƯỚC | SAU |
|---|---|---:|---:|
| A | Tổng quan QL / GV / TVV | 28 / 27 / 29 | 28 / 27 / 29 |
| A | Công việc GV / QL / TVV | 30 / 26 / 29 | 32 / 27 / 30 |
| A | Học viên & Lớp (GVCN) | 27 | 27 |
| A | Hồ sơ HV · tab Ý thức | 31 · 31 | 32 · 32 |
| A | Hồ sơ lớp | 25 | 25 |
| B | Lịch Test · Kế hoạch Test | 28 · 31 | 28 · 31 |
| B | Chấm Test GVCN / GVBM | 28 / 27 | 29 / 29 |
| B | Hồ sơ lượt Test | 29 | 29 |
| B | Phân tích: Báo cáo HV · GV · Test+SOS · Kết quả Test · Hiệu quả PA · Ý thức | 28 · 30 · 26 · 27 · 27 · 28 | 30 · 30 · 27 · 27 · 27 · 29 |
| B | Quản trị: Tài khoản · Bảng quy đổi | 27 · 32 | 28 · 32 |
| | **Trung bình** | **28,3** | **28,9** |

**Đánh giá thẳng:** các PR đêm nay sửa đúng lỗi hình ảnh đo được (không màn nào tụt, không hồi quy bố cục), nhưng điểm chỉ lên ~0,6 vì phần kéo điểm xuống là **bố cục / luồng** (chờ chủ SP) và vài lỗi P1 / P2 lớn còn lại — CHƯA màn nào đạt 35. RA-UI-7 sửa thêm hồi quy + 2 điểm PTA quyết (nút đoạn 375, chip trạng thái); chưa chấm lại.

## Còn kéo điểm xuống nhiều nhất
1. Hồ sơ lớp 375 (P1): bảng HV tắt chế độ thẻ, kẻ hàng lệch cột dính · đầu trang ~380 px so mockup ~170 [BỐ CỤC một phần].
2. Tổng quan GV 1440: cột Lớp cắt chữ, SOS xếp 3 dòng (`LopToiDay` — độ rộng cột có phép kiểm EN).
3. Thẻ bảng 375 (Tổng quan QL / GV): nhãn và số lệch lưới — cần thiết kế lại thẻ "Lớp cần chú ý".
4. Công việc QL: "Chờ bạn duyệt" tràn cả hai cột [BỐ CỤC]; HV & Lớp: mọi lớp gập khi vào trang.
5. Hạn xa ở Công việc TVV là chữ trơn 2 dòng; thẻ "Chờ bạn duyệt" chưa dùng viên hạn.

## Chờ chủ SP (PTA Plan 29/10: không làm đêm nay)
| # | Câu hỏi | Ghi chú |
|---|---|---|
| 2 | Công việc QL: chuyển "Chờ bạn duyệt" vào đầu cột trái như mockup c1 (hiện là khối rộng trước lưới hai cột)? | đổi bố cục |
| 5 | Phân tích › Kết quả Test có tab con "**Thi thật**" — giữ, hay đổi tab cha thành "Kết quả thi" như mockup v5? Luật G2: **Thi = thi thật (IELTS…), Test = MT / Progress / Final**. | tên gọi |
| 8 | Công việc QL mặc định "Tất cả" (hiện tại) hay "Của tôi" như mockup ("việc của tôi ở trang đầu vai")? | giữ "Tất cả" tới khi chủ SP chọn |
| — | Đầu hồ sơ lớp 380 → ~170 px (gộp hai hàng lọc, "Sửa thông tin" về ⋯), HV & Lớp tách cột L · R · W · S như mockup, ô điểm trống viền đứt (mockup M2 chờ duyệt) | đổi bố cục / chờ M2 |
