# PR 3 (xếp chồng trên #2084) — `NganDanhSach` khuôn 720, Case theo bước, Ý thức

Ảnh cặp: `cap-b3-1440.png` (Case chưa chốt PA), `cap-b6-1440.png` (HV đang học), `cap-m3-375.png`; web: `sau-pr3-*.png`.

| Khung | Thành phần | KHỚP / KHÁC |
|---|---|---|
| B3 Case chưa chốt PA | `SoLieu.tsx` `NganDanhSach` nhomCase: khung so720, nhóm theo bước (đầu nhóm "Chờ mô tả · n · n quá hạn"), một dòng một Case, 20 dòng + "Xem thêm", bỏ dải lọc bước và "+ n Case" | KHỚP bố cục; KHÁC: dòng Case còn 3 tầng chữ (điểm / kỳ vọng / "Chưa có mô tả"), cột Hạn trống khi Case chưa có hạn; chip SOS không còn đè chữ kỹ năng (wrap) |
| B6 HV đang học | cùng `NganDanhSach` (báo cáo) khung 720 | KHÁC [XM]: vẫn danh sách dòng có điểm L R W S + Overall, CHƯA thành bảng 5 cột (Học viên · Lớp · Tuần học · MT gần nhất · Overall) — cần đổi dữ liệu dòng, để PR sau |
| Vi phạm lớp B4 / em B5 | `BangLuotPanel` (PR 2) | chưa tách hộp 440 cho vi phạm em: dùng panel 720 |
| Tiến bộ Tăng / Giữ / Giảm | — | CHƯA làm (cần tab theo `huong`, chưa vẽ) — [XM] |
| HV cần chú ý / Lớp có vi phạm | `YThucPhoiHop.tsx` `SoCuon` | KHỚP luật: bấm số cuộn tới bảng (`#yt-hv`, `#yt-lop`), bỏ panel lặp |
| Ý thức 375 | `TheDong.tsx` + CSS | KHỚP: dòng có số cao ≥ 44, số cách nhau 48 (trước 21–26) |

Thao tác TRƯỚC → SAU: dải lọc theo bước ở Case → đầu nhóm (đã chốt); "+ n Case" từng nhóm → "Xem thêm" chung (đã chốt); panel HV cần chú ý / Lớp có vi phạm → cuộn tới bảng (XM-3 đã chốt); panel việc làm được của Tổng quan (dòng có `viec.lam`) giữ khuôn cũ vì thuộc Công việc.

Chống cắt `scripts/kiem-chong-cat.mjs` (bỏ qua nút cuộn): Chi nhánh 15/15, SOS 15/15, Ý thức đạt.
Sửa CSS: số trong `td` / `th` / `dd` của vùng `.text-sm` không còn bị coi là số giữa câu (trước đó co về 9 × 14 px).
