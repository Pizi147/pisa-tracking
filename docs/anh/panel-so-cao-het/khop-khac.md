# Panel số Phân tích: cao hết như panel Công việc (#2119, chủ SP 25/11)

Sửa MỘT chỗ: `web/src/ui/KhungPanel.tsx`, khuôn `so720` (dùng chung mọi panel số: `BangLuotPanel`, `SoLieu` báo cáo / Case chưa chốt PA).
HopNeo (kết quả thi thật của từng HV) không đổi.

## TRƯỚC → SAU

| Thao tác / hình | TRƯỚC | SAU |
|---|---|---|
| Chiều cao panel | `max-h-full`, cao theo số dòng; 1 dòng = thẻ nhỏ nổi trên trang, đè đầu bảng bên dưới | `h-full`: từ đáy thanh menu tới đáy màn, như Công việc; danh sách ngắn chừa trống bên dưới |
| Đầu panel | trôi theo thẻ | cố định ở đỉnh; thân tự cuộn (`overflow-y-auto`) khi dài |
| Viền dưới thẻ (`border-b`) | có | bỏ (panel chạm đáy màn) |
| Nền mờ / khoá cuộn trang | không | không đổi — trang bên trái vẫn đọc, bấm số khác thì đổi nội dung |
| Cột 720 (NH9) | cân đều, cột cuối sát mép phải | không đổi |
| Dòng tiêu đề ở 1280 / 1440 | một dòng (cao 53) | không đổi, không xuống dòng |
| 375 | toàn màn dưới thanh trên | không đổi (thêm: thân kéo tới đáy màn) |
| Mất thao tác nào | — | không |

Mã chết dọn: `max-h-full`, `items-start`, `max-sm:h-full` (thừa), `sm:border-b`; chú thích "cao theo nội dung" đã sửa.

## Kiểm (Playwright, dark, QL / Head, bản chép demo)
- Panel số mở ở Thi thật (Theo GV, Từng kỹ năng), Tổng hợp, SOS, Ý thức, Hiệu quả PA ở 1440 / 1280 / 375: **75 ca đạt, 0 hỏng** (đáy = đáy màn, đỉnh = đáy menu, 4 góc `elementFromPoint` không bị che). Ca 1 dòng và dài (20 dòng) đều có.
- `scripts/kiem-chong-cat.mjs`: **25/25** (Thi thật) và **15/15** (Ý thức).
- Trang Giáo viên: ô số không mở panel số (không thuộc khuôn này).

## Ảnh cặp toàn màn (trước | sau)
Ca 1 dòng — Thi thật › Theo GV, ô "1" Vượt:
- 1440: `ket-qua-thi-1-hang-1440-truoc.png` | `ket-qua-thi-1-hang-1440-sau.png`
- 1280: `ket-qua-thi-1-hang-1280-truoc.png` | `ket-qua-thi-1-hang-1280-sau.png`
- 375: `ket-qua-thi-1-hang-375-truoc.png` | `ket-qua-thi-1-hang-375-sau.png`

Ca cột chữ dài (1440 và 1280): ảnh "trước" của nhóm này là khung cao hết nhưng cột cũ; "sau" là cột đã chia lại.
- Ý thức, 36 vi phạm: `vi-pham-dai-{1440,1280}-truoc.png` | `…-sau.png`
- Ý thức, theo lớp: `vi-pham-lop-{1440,1280}-truoc.png` | `…-sau.png`
- Case chưa chốt PA: `chua-chot-pa-{1440,1280}-truoc.png` | `…-sau.png`
- PA có cải thiện: `pa-co-cai-thien-{1440,1280}-truoc.png` | `…-sau.png`

## Chia lại cột chữ dài (PTA rà #2120)
| Panel | TRƯỚC | SAU |
|---|---|---|
| Vi phạm (Ý thức) | Học viên 288 px, Ngày 111, Vi phạm 135 (mô tả 3–5 dòng), khoảng trống giữa Học viên và Ngày | Học viên 136 (vừa tên dài nhất), Ngày 111, Vi phạm 287 nhận phần dư, Xử lý sát phải; nhóm / mô tả tối đa 2 dòng, đủ chữ ở `title` |
| PA có cải thiện | cột PA 91 (mô tả bị cắt), bảng tràn ngang ~20 px, "Người phụ trách" bị cắt mép phải | PA 179, đầu cột đổi "Phụ trách" (cùng tên với panel Chưa chốt PA), không tràn |
| Chưa chốt PA · Tổng hợp · HV có Case | không đổi | cột cuối (Hạn / Kỳ vọng) căn phải sát mép |
| Thi thật (bảng điểm) | cột cuối (Lệch / Target / Overall) căn giữa, cách mép phải ~50 px | cột cuối căn phải sát mép (`BangSoPanel`) |
| Ý thức theo HV | "Vi phạm" 77 ≠ "Chưa xử lý" 91 | cột số cùng 92 px (`min-width`) |

Gốc lỗi: khối panel đặt cột tên = 40 % bảng (`--ten-pt`). Sửa ở `web/src/index.css` (khối `.pn-bang`, ≥ 640): cột tên `width: 1%` + một dòng, cột linh hoạt nhận phần dư. Dùng chung nên mọi panel bảng số theo; đo 6 panel × 2 cỡ: `scrollWidth − clientWidth = 0`.

## Số đo cột (JS, dark, vai Head) — mọi bảng trong panel số Phân tích
Mỗi ô: `cột: rộng px / thừa px (rộng − đệm − chữ rộng nhất) / số dòng tối đa`. Tiêu chí PTA: không cột nào thừa > 40 px khi cột khác > 2 dòng · cột số đều nhau (lệch ≤ 8 px) · cột cuối căn phải sát mép (chữ cách mép ≤ 26 px) · không tràn ngang. Kết quả: **36 / 36 mẫu đạt** (bảng khác nhau × 1440, 1280).

| Cỡ | Bảng (cột: rộng / thừa / dòng) |
|---|---|
| 1440 | Học viên:139/0/2d MT:74/0/2d L:68/-7/1d R:69/-7/1d W1:68/-7/1d W2:68/-7/1d S:69/-7/1d OVR:69/7/1d Kỳ vọng:97/49/1d |
| 1440 | Học viên:124/0/2d MT:76/0/2d L:68/8/1d R:69/8/1d W1:70/-4/1d W2:70/-4/1d S:71/-4/1d OVR:71/10/1d Kỳ vọng:100/51/1d |
| 1440 | Học viên:168/0/2d Case:209/0/1d Điểm / KV:100/18/1d Phụ trách:130/4/1d Hạn:112/-9/1d |
| 1440 | Học viên:130/0/1d Lớp:93/0/2d Case:57/13/1d PA:179/0/3d Kết quả:159/0/1d Phụ trách:122/0/1d |
| 1440 | Học viên:176/0/2d Ngày thi:104/9/1d L:73/43/1d R:73/43/1d W:73/43/1d S:73/43/1d OVR:73/29/1d Target:73/27/1d |
| 1440 | Học viên:220/107/1d Lớp:110/31/1d Tuần học:110/48/1d MT gần nhất:168/0/1d Overall / KV:110/14/1d |
| 1440 | Học viên:220/0/2d Ngày thi:125/30/1d L:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1440 | Học viên:220/0/2d Ngày thi:125/30/1d R:125/80/1d Target:125/95/1d Lệch:125/69/1d |
| 1440 | Học viên:220/0/2d Ngày thi:125/30/1d W:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1440 | Học viên:220/0/2d Ngày thi:125/30/1d S:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1440 | Học viên:136/0/2d Ngày:111/0/1d Vi phạm:287/0/3d Xử lý:186/0/1d |
| 1440 | Ngày:111/0/1d Vi phạm:495/0/2d Xử lý:113/-1/1d |
| 1440 | Học viên:136/0/1d Lớp:90/0/1d Vi phạm:92/59/1d Chưa xử lý:92/59/1d Bậc hiện tại:148/0/1d Lần xử lý gần nhất:162/16/1d |
| 1440 | Học viên:127/0/2d Ngày:111/0/1d Vi phạm:296/0/2d Xử lý:186/0/1d |
| 1440 | Học viên:127/0/1d Lớp:90/0/1d Vi phạm:92/59/1d Chưa xử lý:92/59/1d Bậc hiện tại:148/0/1d Lần xử lý gần nhất:171/132/1d |
| 1440 | Học viên:141/0/1d Bài:465/0/2d Hạn:113/0/1d |
| 1440 | Học viên:129/0/1d Bài:477/0/2d Hạn:113/0/1d |
| 1440 | Học viên:146/0/1d Việc:368/0/2d Lớp:93/0/1d Hạn:113/0/1d |
| 1280 | Học viên:139/0/2d MT:74/0/2d L:68/-7/1d R:69/-7/1d W1:68/-7/1d W2:68/-7/1d S:69/-7/1d OVR:69/7/1d Kỳ vọng:97/49/1d |
| 1280 | Học viên:124/0/2d MT:76/0/2d L:68/8/1d R:69/8/1d W1:70/-4/1d W2:70/-4/1d S:71/-4/1d OVR:71/10/1d Kỳ vọng:100/51/1d |
| 1280 | Học viên:168/0/2d Case:209/0/1d Điểm / KV:100/18/1d Phụ trách:130/4/1d Hạn:112/-9/1d |
| 1280 | Học viên:130/0/1d Lớp:93/0/2d Case:57/13/1d PA:179/0/3d Kết quả:159/0/1d Phụ trách:122/0/1d |
| 1280 | Học viên:176/0/2d Ngày thi:104/9/1d L:73/43/1d R:73/43/1d W:73/43/1d S:73/43/1d OVR:73/29/1d Target:73/27/1d |
| 1280 | Học viên:220/107/1d Lớp:110/31/1d Tuần học:110/48/1d MT gần nhất:168/0/1d Overall / KV:110/14/1d |
| 1280 | Học viên:220/0/2d Ngày thi:125/30/1d L:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1280 | Học viên:220/0/2d Ngày thi:125/30/1d R:125/80/1d Target:125/95/1d Lệch:125/69/1d |
| 1280 | Học viên:220/0/2d Ngày thi:125/30/1d W:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1280 | Học viên:220/0/2d Ngày thi:125/30/1d S:125/79/1d Target:125/95/1d Lệch:125/69/1d |
| 1280 | Học viên:136/0/2d Ngày:111/0/1d Vi phạm:287/0/3d Xử lý:186/0/1d |
| 1280 | Ngày:111/0/1d Vi phạm:495/0/2d Xử lý:113/-1/1d |
| 1280 | Học viên:136/0/1d Lớp:90/0/1d Vi phạm:92/59/1d Chưa xử lý:92/59/1d Bậc hiện tại:148/0/1d Lần xử lý gần nhất:162/16/1d |
| 1280 | Học viên:127/0/2d Ngày:111/0/1d Vi phạm:296/0/2d Xử lý:186/0/1d |
| 1280 | Học viên:127/0/1d Lớp:90/0/1d Vi phạm:92/59/1d Chưa xử lý:92/59/1d Bậc hiện tại:148/0/1d Lần xử lý gần nhất:171/132/1d |
| 1280 | Học viên:141/0/1d Bài:465/0/2d Hạn:113/0/1d |
| 1280 | Học viên:129/0/1d Bài:477/0/2d Hạn:113/0/1d |
| 1280 | Học viên:146/0/1d Việc:368/0/2d Lớp:93/0/1d Hạn:113/0/1d |
