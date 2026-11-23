# PR 2 (xếp chồng trên #2082) — khuôn 720 cho mọi panel bảng `BangLuotPanel` (GV, lượt MT, tiến bộ, ý thức, SOS…)

Ảnh cặp: `cap-b8-1440.png` (lượt MT / B8), `cap-c1-1440.png` (GV chấm Test / C1); web: `sau-pr2-*.png`.

| Khung | Thành phần | KHỚP / KHÁC |
|---|---|---|
| B8 lượt MT | `BangLuotPanel` kiểu luot: bỏ cột Lớp (lớp dưới tên), 170 · MT · 5 kỹ năng · OVR · Kỳ vọng vừa 720 | KHỚP cột; KHÁC: tab Chưa đạt / Đạt giữ (chủ SP: chỉ ở ô tỉ lệ — chưa tách theo loại ô, [XM]) |
| C1 GV | cùng: đầu một dòng, "Hồ sơ GV ›" lên đầu, bỏ 3 tab và chân | KHÁC (chưa làm): hạn vẫn như cũ (chưa dd/mm/yyyy tô màu, còn badge "Đúng hạn"), mockup là hộp 440 — chốt mới panel 720; nút "Sao chép việc quá hạn" nếu có nằm trong thân |
| Tiến bộ (kiểu tang-giam) | bỏ cột Lớp | chưa chụp |

Thao tác TRƯỚC → SAU: bỏ chân "Đóng", nền mờ, 3 tab Chưa làm / Làm muộn / Đúng hạn (đã chốt; mở sẵn đúng loại từ `tt=` của nguồn); "Hồ sơ GV ›" chân → đầu; "dữ liệu đến" bỏ.

[XM] Panel danh sách dòng (`NganDanhSach`: HV đang học, SOS, Case chưa chốt PA, Tổng quan…) CHƯA đổi — để PR 3. Vì vậy `scripts/kiem-chong-cat.mjs` ở trang Chi nhánh báo "không thấy khung so720" cho ô đầu (ô đó mở NganDanhSach cũ); mọi ô mở khuôn 720 đều đạt (10/10).
