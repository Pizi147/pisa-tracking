# S6 — chạy lại máy đo khung một mình (20/11)

Chạy `scripts/do-khung.mjs` MỘT MÌNH: seed sạch (`npm run seed`), API cổng 4731 + web 5731, không tiến trình nào khác bấm cùng DB. Không sửa mã web.

## Kết quả trước → sau

| Loại | Trước (bộ kịch bản cũ) | Sau (kịch bản đã sửa) |
|---|---|---|
| Tổng lỗi | 312 (+135 đã miễn) | **190** (+139 đã miễn) |
| Kịch bản không mở được | 31 dòng | **0** |
| `hd-chi` ("Chỉ cho tôi") | 172 dòng | **64** (chưa kết luận, mục 3) |
| g (lệch bảng) | 74 | 87 |
| c (chữ cắt) | 22 | 30 |
| f | 8 | 8 |
| a / b / e / k / l / m / n | 0 | 0 |

Số g / c tăng vì các màn trước không mở được (Tạo Case, ⋯ hồ sơ HV 375, Cuối khoá áp chung…) nay được đo. Số "đã miễn" 135 → 139 cũng vì có thêm màn đo được. Hai dòng miễn thừa (P9b, SUA-375-3) đã gỡ khỏi `scripts/mien-do.json`; không thêm dòng miễn mới.

## 1. Kịch bản cũ so với giao diện — ĐÃ SỬA ở `do-khung.mjs`

- `+ Case` / `Ghi vi phạm` nay là menu **+ Task** (GD-6). Ở 375 nút nổi chỉ hiện sau khi cuộn → hàm `moTask` (panel-tao-case, panel-vi-pham, lich-*).
- ⋯ hồ sơ HV tên **Thao tác khác** (hv-menu); nút `aria-haspopup` đầu trang nay là + Task (ẩn ở 375).
- Cuối khoá: **Chọn tất cả** là ô tick (`checkbox`), không phải nút (cuoi-khoa-ap).
- Chờ duyệt: đường `/cong-viec?nhom=duyet`; "Lịch sử · n" là thẻ `summary` (cv-duyet-panel).
- Ghi kết quả PA ở 375: dòng việc "… · PA học thuật · …" thay nút "Ghi kết quả PA" (gv-ket-qua-pa).
- `gv-hop-diem`: "Mở lớp MB FT 101" trùng 2 phần tử → `.first()`.
- `hd-chi`: bỏ vòng `trang-hd` (trang Hướng dẫn không còn phần "Theo màn"); mở panel bằng `[data-hd=nut-hd]` (nút nằm trên thanh trên, không còn trong menu Tài khoản); bung "+ n việc khác".

## 2. Chưa phân loại

- `lich-panel-pa-1440` / `-375` "không thấy ô ngày": kịch bản `panel-pa` chỉ mở thẻ PA; ô ngày (`ONgay`, `CapNhatTuan.tsx`) có thể chỉ hiện sau thêm một bước. [XM] PTA giao kiểm.

## 3. Nghi LỖI THẬT của web (chưa sửa — để PTA giao)

`hd-chi` còn 64 dòng: mục màn của "Chỉ cho tôi" **không thấy trong panel Hướng dẫn** (hoặc khoanh báo "Chưa có việc nào ở đây"). Ở màn có tab (tầng 2, `Tang2`, `web/src/modules/huongDan/NutHuongDan.tsx:410`) panel chỉ liệt kê việc theo tab; mục riêng của màn (`man.muc` không có `viec`) chỉ ở tầng 3 và có thể gập sau "+ n việc khác". Cần xác nhận người dùng thường có tới được mục đó không.

| Mục (màn›id) | Nội dung hướng dẫn | Dòng |
|---|---|---|
| hoc-vien›hv-lich-thi | `shared/huongDan/gv.ts:580` | 10 |
| lich-test›lt-nhap-diem | `gv.ts:540`, `ql.ts:558` | 8 |
| lich-test›lt-thi-that | `gv.ts:543` | 3 |
| lich-test›lt-lich-thi | `ql.ts:561` | 2 |
| phan-tich›ql-pt-goc | `ql.ts:489` | 4 |
| hoc-vien›ql-hvl-pham-vi | `ql.ts:506` | 4 |
| hoc-vien›hv-tim | `gv.ts:576`, `cx.ts:98`, `tvv.ts:531` | 4 |
| ho-so-gv›hsgv-tab ("Chưa có việc") | `gv.ts:624` | 4 |
| cong-viec›ql-cv-cua-gv · ql-cd-loc | `ql.ts:599`, `ql.ts:595` | 8 |
| cong-viec›cv-lop · cv-loc | `gv.ts:522`, `gv.ts:520` | 8 |
| tong-quan›tq-duyet · ql-tq-so-lieu | `ql.ts:478`, `ql.ts:480` | 4 |
| han-ket-qua ("Chưa có việc", Quản trị) | trang Hướng dẫn `?phan=luat` | 2 |

## 4. Lệch bảng / cắt chữ còn lại, theo màn (để PTA giao sửa)

(g) lệch tiêu đề ↔ ô, đường cơ sở lệch > 2 px, cao hàng ∉ {44, 64}; (c) chữ cắt. Đã gộp trùng theo chiều rộng / sáng tối. Tên PA Tutor dài cắt 2 dòng ở 375 (hv-menu, panel-tao-case) là chủ ý "tối đa 2 dòng" (chủ SP 17/11).

**bang-diem-thuong** (5)
- g «Bảng điểm MB FOU 12» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 9
- g «Bảng điểm MB FOU 12» g2 đường cơ sở lệch > 2px 2/5 hàng 
- g «Bảng điểm MB FOU 12» g3 cao hàng ∉ {44, 64}
- g «Bảng điểm MB FOU 12» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Bảng điểm MB FOU 12» g2 đường cơ sở lệch > 2px 1/6 hàng 

**gv-bang-diem-thuong** (4)
- g «Bảng điểm MB FOU 12» g2 đường cơ sở lệch > 2px 2/2 hàng 
- g «Bảng điểm MB FOU 12» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 9
- g «Bảng điểm MB FOU 12» g2 đường cơ sở lệch > 2px 2/5 hàng 
- g «Bảng điểm MB FOU 12» g3 cao hàng ∉ {44, 64}

**gv-diem-lop** (2)
- g «Bảng điểm MB Pre FOU 03» g2 đường cơ sở lệch > 2px 3/4 hàng 
- g «Bảng điểm MB Pre FOU 03» g3 cao hàng ∉ {44, 64}

**gv-ho-so** (5)
- c chữ cắt  «SOS 1 4 SOS 2 2 SOS 3 5»
- g «Lớp đang dạy» g1 lệch tiêu đề ↔ ô 1 cột: Kỹ năng -5.9
- g «Lớp đang dạy» g2 đường cơ sở lệch > 2px 9/10 hàng 
- g «Lớp chủ nhiệm» g2 đường cơ sở lệch > 2px 8/8 hàng 
- g «Em đang bổ trợ» g2 đường cơ sở lệch > 2px 2/2 hàng 

**gv-ho-so-ql** (2)
- g «Lớp đang dạy» g1 lệch tiêu đề ↔ ô 1 cột: Kỹ năng -8
- g «Em đang bổ trợ» g2 đường cơ sở lệch > 2px 2/2 hàng 

**gv-hop-diem** (4)
- g «Lưới điểm MT1, MT2» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Lưới điểm MT1, MT2» g2 đường cơ sở lệch > 2px 9/9 hàng 
- g «Bảng điểm MB Pre FOU 03» g2 đường cơ sở lệch > 2px 3/4 hàng 
- g «Bảng điểm MB Pre FOU 03» g3 cao hàng ∉ {44, 64}

**gv-nhap-diem** (4)
- g «Lưới điểm MT1, MT2» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Lưới điểm MT1, MT2» g2 đường cơ sở lệch > 2px 9/9 hàng 
- g «Lưới điểm MT1, MT3» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Lưới điểm MT1, MT3» g2 đường cơ sở lệch > 2px 2/6 hàng 

**gvbm-test** (3)
- g «Bảng điểm MB FOU 12» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Bảng điểm MB FOU 12» g2 đường cơ sở lệch > 2px 1/6 hàng 
- g «Bảng điểm MB FOU 12» g3 cao hàng ∉ {44, 64}: 41 · 42.5

**hv-gvbm** (2)
- c chữ cắt  «PA Tutor Speaking 4 buổi, ghép nhóm hai em»
- c chữ cắt  «PA Tutor Writing 1-1, chữa trực tiếp bố cục từng bài»

**hv-hoc-thuat** (2)
- c chữ cắt  «PA Tutor Speaking 4 buổi, ghép nhóm hai em»
- c chữ cắt  «PA Tutor Writing 1-1, chữa trực tiếp bố cục từng bài»

**hv-menu** (2)
- c chữ cắt  «PA Tutor Speaking 4 buổi, ghép nhóm hai em»
- c chữ cắt  «PA Tutor Writing 1-1, chữa trực tiếp bố cục từng bài»

**nhap-diem** (2)
- g «Lưới điểm MT1, MT3» g1 lệch tiêu đề ↔ ô 1 cột: Kết quả 8
- g «Lưới điểm MT1, MT3» g2 đường cơ sở lệch > 2px 2/6 hàng 

**panel-tao-case** (2)
- c chữ cắt  «PA Tutor Speaking 4 buổi, ghép nhóm hai em»
- c chữ cắt  «PA Tutor Writing 1-1, chữa trực tiếp bố cục từng bài»

**phan-tich** (4)
- g «Theo lớp» g1 lệch tiêu đề ↔ ô 2 cột: Đạt MT · HV -2.7 · Tiến bộ · lượt -2.7
- g «Theo lớp» g3 cao hàng ∉ {44, 64}
- g «Tiến bộ theo kỹ năng» g1 lệch tiêu đề ↔ ô 3 cột: ↑ Tăng 3.1 · Giữ nguyên 3.1 · ↓ Giảm 3.1
- g «Tiến bộ theo kỹ năng» g1 lệch tiêu đề ↔ ô 3 cột: ↑ Tăng -15.7 · Giữ nguyên -22.1 · ↓ Giảm -15.7

**phan-tich-giao-vien** (1)
- g «Giáo viên — Chấm Test và Việc» g3 cao hàng ∉ {44, 64}

**phan-tich-hieu-qua-pa** (5)
- g «Theo tuần» g1 lệch tiêu đề ↔ ô 3 cột: Tuần 32 · Thiếu điểm -2.1 · Chưa chốt PA -4.3
- g «Theo tuần» g3 cao hàng ∉ {44, 64}: 46 · 52
- c chữ cắt  «Thiếu điểm»
- c chữ cắt  «Chưa chốt PA»
- g «Theo tuần» g1 lệch tiêu đề ↔ ô 3 cột: Tuần 32 · Thiếu điểm -3.5 · Chưa chốt PA -5.8

**phan-tich-thuong** (2)
- g «Theo lớp» g1 lệch tiêu đề ↔ ô 1 cột: Đạt Test · bài -6.2
- g «Theo lớp» g3 cao hàng ∉ {44, 64}

**phan-tich-tong-hop** (2)
- c chữ cắt  «Thiếu điểm»
- c chữ cắt  «Chưa chốt PA»

**sos-cx** (4)
- f chữ bị cắt bởi khối overflow-hidden 2<19 «FT11»
- f chữ bị cắt bởi khối overflow-hidden 2<17 «11»
- f chữ bị cắt bởi khối overflow-hidden 2<16 «LT21»
- f chữ bị cắt bởi khối overflow-hidden 2<17 «21»

**test-diem-lop** (2)
- g «Bảng điểm MB Pre FOU 03» g2 đường cơ sở lệch > 2px 3/4 hàng 
- g «Bảng điểm MB Pre FOU 03» g3 cao hàng ∉ {44, 64}
