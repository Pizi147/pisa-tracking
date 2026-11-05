# PR-2 PT-LOP-THUONG — khớp / khác mockup v13 B · Bm · A3

Ảnh cặp (trái trước = main · phải sau = PR): `cap-b-…` (bảng 1440 tối), `cap-bm-…` (375 sáng), `cap-a3-…` / `cap-a3m-…` (panel Progress Test · 1 môn trượt),
`cap-gv-thuong-…` (Phân tích GV · Đạt Test lớp thường). Dữ liệu demo Monbay (QL Nguyễn Khánh Vy), khoảng W1 MAR – W3 SEP.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | Kết quả |
|---|---|---|---|
| B | bảng: Tuần · Bài kiểm tra · Progress Test (Đạt hết · 1 môn trượt · ≥ 2 môn trượt) · Final Test (4 dải) · Thiếu điểm | cap-b | KHỚP |
| B | bỏ nhóm Checkpoint, Mini Test, Xử lý | cap-b | KHỚP |
| B | thẻ chỉ số: Bài kiểm tra (n HV) · Thiếu điểm — bỏ "Chưa chốt PA"; 2 thẻ trên lưới 5 cột | cap-b | KHỚP |
| B | hàng lọc, Xuất Excel, ⋯ | cap-b | GIỮ (nền) |
| Bm | thẻ tuần: "n bài · m lớp ▾" ở đầu thẻ; khối Progress Test · Final Test · Thiếu điểm | cap-bm | KHỚP |
| A3 | panel 820 "SỐ · TEST + SOS" · "chi nhánh · Lớp thường · đạt từ 70 % mỗi môn · dữ liệu đến" · "n bài · m HV" | cap-a3 | KHỚP |
| A3 | mỗi chương trình một bảng (tên chương trình trên bảng), môn theo chương trình (BE L R W S · FOU L R G+V P) | cap-a3 | KHỚP |
| A3 | ô môn "✗ 10/20" — ✓ / ✗ trước số, mẫu số mờ; đạt xanh dương, chưa đạt đỏ | cap-a3 | KHỚP (`ODiem kieu="ti-le"`; mẫu số khác tổng phổ biến của cột = vàng "đề khác", như lưới điểm) |
| A3 | cột Bài (+ tuần) khi panel có nhiều bài / tuần; cột Tổng (% tổng) khi có Final Test | cap-gv-thuong | THÊM theo P-LT (ghi chú mục 2a); mockup A3 chỉ một bài nên không vẽ |
| A3m | 375: thẻ em — tên · lớp · bài + tuần · lưới môn | cap-a3m | KHỚP dáng A1m |
| — | Phân tích GV · Đạt Test (lớp thường) → P-LT, môn GV phụ trách viền nhấn, giữ tab Chưa đạt · Đạt + phân trang | cap-gv-thuong | THÊM theo kiểm kê mục 2b |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước (main) | Sau | |
|---|---|---|---|
| Bấm ô lớp thường (Bài kiểm tra, Progress Test, Final Test, Thiếu điểm) | danh sách tên "Bài Progress Test · tên" | bảng bài có điểm theo môn | ĐỔI nội dung |
| Ô Checkpoint, Mini Test, Xử lý (HV - Case · Chưa chốt PA · Đang xử lý) | trên bảng | BỎ khỏi màn (đặc tả 2B); Excel giữ cột; link / đường cũ vẫn mở panel cũ | BỎ trên màn |
| Thẻ "Chưa chốt PA" (lớp thường) | có | bỏ (PA ở tab Hiệu quả PA) | BỎ (mockup Bm, đặc tả 2B) |
| ⋯ › Cột hiện (lớp thường) | Kết quả · Dưới kỳ vọng · Xử lý | không còn mục (chỉ còn một nhóm cột — tắt là trống bảng); FT giữ | BỎ ở lớp thường |
| Xuất Excel lớp thường | đủ cột | đủ cột như cũ (kể cả dòng lớp chỉ có Checkpoint) | GIỮ |
| Mở / thu tuần, lớp; ⋯ Xuất kết quả từng lượt | có | có | GIỮ |
| Phân tích GV · Đạt Test lớp thường: tab Chưa đạt · Đạt, phân trang | có | có | GIỮ |

## Luật

- Bài kiểm tra = Progress Test + Final Test + Thiếu điểm (PTA XM-2): bài Checkpoint không vào Bài, Thiếu điểm, số HV. Dòng chỉ có Checkpoint không hiện trên màn, vẫn có ở Excel.
- `cotExcel(ct)` (danh sách cột cũ) dùng cho Excel + máy chủ giữ tập; `cotSoLieu('thuong')` là cột màn.

## Turso

Panel chỉ tải khi bấm: một câu lượt theo id + điểm (`loadBundle`) + tên em. Đo: Test + SOS ô Bài kiểm tra (6 tháng) 12 câu / 703 dòng (QT 1 037); Phân tích GV Đạt Test lớp thường 13 câu / 529 dòng. Trần ở `tocDoDuong.ts`.

## Tự rà

- `web-design-guidelines`: ô môn chỉ đọc (không bấm); ✓ / ✗ kèm ký hiệu; bảng không cuộn ngang ở 820; số tabular.
- Màu theo luật 05/11: đạt (không biết vượt) xanh dương `lopKq('bang')`, chưa đạt đỏ.
