# SUA-CHAM-LAI — khớp / khác, thao tác, đối chiếu số

Ảnh cặp `TRUOC | SAU` trong thư mục này (1440 tối, 375 sáng; dữ liệu seed, ngày demo 14/09/2026). Chụp lại: `chup.mjs` + `chup-panel.mjs` (thư mục cha).

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau | Ghi chú |
|---|---|---|---|
| Panel Nhập điểm (Công việc, Chấm Test) | Cả lớp · Mở lưới đầy đủ ↗ | **Dán từ Excel** + ? · Cả lớp · Mở lưới đầy đủ › | Đ2 thêm lại thao tác V4 (bỏ cờ `anDan` của CV-LOI 12.3); Đ3 "›" = đổi trang (G6) |
| Tổng quan Admin · 3 ô | Bấm cả ô → trang lọc sẵn | Bấm **số** → cùng trang lọc sẵn | L8 ô chỉ số V5 (tên · số · mẫu · kỳ); đích link không đổi |
| Tổng quan CX | dải "👁 CX xem số liệu…" | bỏ | L11 chỉ chữ, không thao tác; đầu trang đã ghi "chỉ xem" |
| Công việc QL / QT ở 375 | mọi nhóm mở | nhóm thứ 3 trở đi gập sẵn, bấm đầu nhóm để mở | Đ1; số đầu nhóm vẫn đủ |
| Panel Chấm Speaking | một danh sách lẫn bài đã có điểm | bài chờ chấm trước · nhóm "Đã có điểm · n bài" sau | Đ9; bài vừa lưu trong phiên đứng nguyên chỗ; "Lưu · em tiếp ›" vẫn sang em chờ chấm kế |

Không mất thao tác nào.

## Đối chiếu số (trước → sau)

| Chỗ | Trước | Sau | Vì sao |
|---|---|---|---|
| L4 Tổng quan GV S (Đỗ Thu Hương) · Kỹ năng tôi dạy · MB FT 105 · Chờ chấm | 4 bài | 0 | 4 bài là S chấm chéo (không là nợ — T02–T03); = Chấm Test "Của tôi 0 bài" |
| L6 Tổng quan QL Monbay · GV cần chú ý · kỳ | W4 AUG – W3 SEP | W1 SEP – W2 SEP (= kỳ cả trang, ghi ở đầu trang) | một kỳ cho cả trang |
| ↳ Chấm Test đúng hạn · Cao Khánh Linh | 44 % 8/18 | 46 % 6/13 | đổi kỳ |
| ↳ Lê Minh Khoa | 41 % 7/17 | 42 % 5/12 | đổi kỳ |
| ↳ Phạm Thu Trang | 50 % 2/4 | 67 % 2/3 | đổi kỳ |
| ↳ Trần Ngọc Hà | 39 % 11/28 | 45 % 9/20 | đổi kỳ |
| ↳ Đỗ Thu Hương · Võ Mỹ Duyên | 86 % 12/14 · 100 % 14/14 | không đổi | |
| ↳ Quá hạn (9 · 8 · 11) · Lớp cần chú ý · 4 ô đầu | — | không đổi | "hiện tại" / đã cùng kỳ |
| L8 Tổng quan Admin · 3 ô | 7 · 105 · 6 | 7 · 105 · 6 | đơn vị "ô điểm" → "bài" (như Lịch Test) |
| L9 Admin · GV chấm quá hạn · Σ cột bài | 33 | **45** = ô "45 quá hạn" | thêm dòng "Chưa có GV · 12 bài" (Speaking chấm chéo MB FT 101, 105 chưa ai giữ) |
| Đ9 Panel Chấm Speaking · đầu panel | 18 bài chờ chấm | 18 bài chờ chấm | + nhóm "Đã có điểm · 3 bài" tách riêng |
| Đ1 Công việc QL 375 · chiều cao trang | 5 300 px | 3 861 px | gập nhóm 3+ |

## Khớp / khác luật

- L7 V15 thắng N8 cũ (PTA Plan chốt): hồ sơ Mock bỏ 4 dòng "Nên có nhận xét…" + "Nên chọn nhóm nguyên nhân"; giữ viền vàng (ô nhận xét) / viền vàng quanh hàng chip (nhóm), nhắc ở `title` + `aria-description`.
- L10 tên hồ sơ GV 28 → 22 px (V16).
- Đ4 lý do ở tooltip + chữ cho trình đọc màn (`lyDoChuaDu`), không thêm chữ trên màn. Trong seed, ô "Chưa đủ dữ liệu" ở hồ sơ lớp hiện ra "chưa có lượt Test có điểm" / "thiếu điểm n kỹ năng"; nhánh "chưa có kỳ vọng" có phép kiểm, seed không có ca.
- Đ6 hồ sơ lớp: "Chưa có lịch" → "—" nhạt (27 / 33 hàng MB FT 101); badge chỉ khi có lịch / dự kiến / đã thi.
- Tổng quan Admin: ô 3 cột (như Tổng quan TVV) để không thừa một ô trống của lưới 4.
