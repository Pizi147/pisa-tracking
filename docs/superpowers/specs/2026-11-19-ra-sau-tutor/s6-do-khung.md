# S6 — chạy lại máy đo khung một mình (20/11)

Chạy `scripts/do-khung.mjs` MỘT MÌNH: seed sạch (`npm run seed`), API cổng 4731 + web 5731, không tiến trình nào khác bấm cùng DB. Không sửa mã web.

## Kết quả trước → sau

| Loại | Trước (bộ kịch bản cũ) | Sau (kịch bản đã sửa) |
|---|---|---|
| Tổng lỗi | 312 (+135 đã miễn) | **190** (+139 đã miễn) |
| Kịch bản không mở được | 31 dòng | **0** |
| `hd-chi` ("Chỉ cho tôi") | 172 dòng | **64** → **0** sau HD-CHI (mục 3) |
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

## 3. `hd-chi` — ĐÃ SỬA (HD-CHI, 20/11): 61 → **0** dòng

Phân loại khi mở thật từng nhóm đúng vai (61 dòng đo lại trên seed; S6 ghi 64 — chênh do nhịp tải): (a) không tới được mục trong panel → web · (b) tới được nhưng khoanh không thấy → neo / nội dung · (d) web đúng, kịch bản sai. Không có loại (c). Ảnh trước | sau lúc bấm "Chỉ cho tôi": `anh-hd-chi/`.

| Mục (màn›id) | Dòng | Loại | Gốc | Sửa |
|---|---|---|---|---|
| hoc-vien›hv-lich-thi | 10 | d | kịch bản bung "+ n việc khác" trước khi panel vẽ xong | `do-khung.mjs`: đợi dòng đầu panel |
| hoc-vien›ql-hvl-pham-vi · hv-tim | 8 | d | như trên | như trên |
| tong-quan›ql-tq-so-lieu | 2 | d | như trên | như trên |
| lich-test›lt-nhap-diem | 8 | a + d | mục có `viec`: panel vẽ thẻ việc chung, bỏ bước + "Chỉ cho tôi" riêng của màn (khoanh nhảy sang Công việc) | `DongCuaDong` / `Tang2` dùng bước + Chỉ cho tôi của màn (`theCuaDong`); kịch bản tìm dòng theo id việc |
| phan-tich›ql-pt-goc · tong-quan›tq-duyet | 6 | a + d | như trên | như trên |
| cong-viec›ql-cd-loc | 4 | a + d | như trên; việc Duyệt ở tab Chờ bạn duyệt | như trên; kịch bản mở `chi.duong` (đúng tab) |
| cong-viec›cv-loc · cv-lop · ql-cv-cua-gv | 12 | a | tầng 2 (Công việc luôn đứng ở một tab) chỉ liệt kê việc của tab, không lối lên tầng 3 → mục riêng của màn chỉ tới được bằng ô tìm | `Tang2`: mục riêng của màn xếp cuối cùng danh sách (sau "+ n việc khác"); không đổi bố cục |
| cong-viec›cv-lop (375) | — | b | < 1024 px khung Lớp của tôi ẩn sau công tắc | `data-hd="cv-lop-cua-toi"` cả trên nút "Lớp của tôi" |
| lich-test›lt-thi-that · lt-lich-thi (375) | 5 | b (+ d 1440) | 375: "Lịch thi thật ›" nằm trong ⋯ đầu trang | `data-hd="test-lich-thi-that"` trên ⋯ (375) |
| ho-so-gv›hsgv-tab | 4 | b + d | `chi.duong: '/giao-vien'` là trang 404 (hồ sơ là `/giao-vien/:id`) | bỏ `duong` (chỉ bấm từ chính hồ sơ); kịch bản mở `/giao-vien/{vai}` |
| han-ket-qua (Quản trị) | 2 | b | Quản trị không có dòng việc của mình (`cv-dong`), Công việc mở Chờ bạn duyệt | `hd: ['cv-dong', 'cd-dong']` (dòng duyệt cũng có chip hạn) |

Không thêm request / câu SQL (hướng dẫn là dữ liệu tĩnh).

## 4. Lệch bảng / cắt chữ — LECH-BANG (20/11): 127 → **21**

Đo một mình trên seed sạch (API 4731 · web 5731), trước = main `9ae217245`, sau = 3 PR LECH-BANG. Không thêm request / câu SQL.

| Loại | Trước | Sau |
|---|---|---|
| g (lệch bảng) | 87 | **21** (đều [XM] dưới) |
| c (chữ cắt) | 30 | **0** (16 dòng tên PA Tutor 2 dòng ở 375 vào miễn `TUTOR-2-DONG` — chủ SP 17/11) |
| f | 8 | **0** |
| lich-panel-pa | 2 | **0** (kịch bản) |
| Tổng | 127 | **21** (−83 %) |

Theo màn (trước → sau): bang-diem-thuong 12 → 0 · gv-bang-diem-thuong 8 → 0 · gv-diem-lop 4 → 0 · test-diem-lop 4 → 0 · test-lichTest 4 → 0 · gv-hop-diem 8 → 0 · gv-nhap-diem 8 → 0 · nhap-diem 4 → 0 · gvbm-test 6 → 3 · gv-ho-so 10 → 6 · gv-ho-so-ql 4 → 2 · sos-cx 8 → 0 · phan-tich 7 → 4 · phan-tich-thuong 4 → 2 · phan-tich-giao-vien 2 → 0 · phan-tich-hieu-qua-pa 10 → 4 · phan-tich-tong-hop 6 → 0 · lich 2 → 0 · hv-gvbm / hv-hoc-thuat / hv-menu / panel-tao-case 4 + 4 + 4 + 4 → 0 (miễn TUTOR-2-DONG). Không màn nào tăng.

Gốc đã sửa:
1. **Lưới điểm** (`index.css`): khối `.lt-bang .bang` (bảng Lịch thi của Học viên & Lớp) lọt vào lưới điểm lồng trong bảng Lịch Test (`table.lt-bang`) — đè đệm tiêu đề cột chip (20 → 12), căn giữa dọc, hàng `height: auto` (42,5). Giới hạn về `div.lt-bang .bang`. Thêm: dòng phụ cột Kết quả lùi 8 px như chữ trong chip (`LuoiThuong` `KetQua`); ô điểm FT chưa có ký hiệu ✓/✗ giữ khoảng trắng (span rỗng kéo đường cơ sở nút xuống 4,7 px — `HopNhapDiem`).
2. **Hồ sơ GV**: chip kỹ năng "Lớp đang dạy" bỏ kéo trái `-ml-1.5` (cột chip, tiêu đề đã lùi 20). Cột "SOS hiện tại" (Lớp chủ nhiệm) 340 → 380 px = mockup `v21/ho-so-gv.html`.
3. **sos-cx 375**: công tắc FT / LT cạnh ô "Xem" bị ép còn 2 px (ô Xem `w-full`, công tắc `flex-1` cơ sở 0) → công tắc không co, chỉ giãn khi đứng một mình.
4. **Phân tích**: hàng tổng "Theo lớp" vạch trên = bóng trong (viền 1 px làm hàng 45,5); hàng chân "S chéo chung" hai dòng có `data-phu-odiem` → 64; thẻ tuần 375 theo mockup `v21/phan-tich.html`: Kết quả FT 3 × 2 (Lượt MT · Thiếu điểm · trống / SOS 1 · 2 · 3), nhãn một dòng không "…", cột tối thiểu bằng nhãn; "Tiến bộ theo kỹ năng" 375 số + % giữa cột.
5. **lich-panel-pa**: kịch bản sai — Case 5 nay chỉ còn PA Tutor (GV không ghi kết quả) → dùng Case 13; "Ngày ghi" chỉ mở sau "Đổi" (chủ SP 14/11) → kịch bản bấm Đổi.

Còn lại 21 dòng — [XM] cho PTA Tutor (không tự sửa: cần đổi bố cục / thao tác hoặc thêm miễn):
- **[XM-1] hồ sơ GV g2** (8 dòng: Lớp đang dạy · Lớp chủ nhiệm · Em đang bổ trợ, 1440 / 1280): mockup `v21/ho-so-gv.html` (`tong-quan.css .bang td{vertical-align:middle}`) cố ý căn giữa dọc (hộp số ngang tên lớp hai dòng — GD-15). Mockup thắng luật "chung đường cơ sở" → đề xuất miễn g2 `gv-ho-so(-ql)`.
- **[XM-2] Phân tích `.cap-so`** (6 dòng: Theo lớp Đạt MT / Tiến bộ / Đạt Test, Tiến bộ theo kỹ năng 1440 / 1280): hộp số căn phải · phân số căn trái quanh TÂM cột (mockup v19 khung 3a — số các dòng thẳng nhau); máy đo so tâm mực nên báo ±3–6 px. Đề xuất: miễn g1 cho ô `.cap-so`, hoặc dạy `do-bang` lấy tâm khối `.cap-so`.
- **[XM-3] `phan-tich-hieu-qua-pa` «Theo tuần»** (4 dòng): đường `?goc=hieu-qua-pa` chuyển về trang Tổng hợp — cùng bảng đã miễn `PT-BANG` ở `phan-tich-tong-hop`. Đề xuất thêm `hieu-qua-pa` vào khớp của dòng miễn `PT-BANG`.
- **[XM-4] `gvbm-test`** (3 dòng: L / R / G+V lệch −19, hàng 61 ở 1280): vai GV bổ trợ chỉ xem — ô có MỘT thao tác nên hiện nút chữ "Lịch sử" (ẩn chờ rê, giữ chỗ ~60 px) thay ⋯ 28 px mà tiêu đề chừa (`.luoi-thuong th[data-kieu=diem-ti-le]` đệm phải 44); ở 1280 nút xuống dòng. Phương án: ô chỉ đọc dùng ⋯ chứa "Lịch sử" như vai khác (đổi thao tác → cần chủ SP), hoặc chừa theo bề rộng nút (CSS `:has`).
