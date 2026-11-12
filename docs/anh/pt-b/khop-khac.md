# PT-b — khớp / khác mockup v19 #1481 (Chi nhánh · Thi thật · SOS · Ý thức + PA nào hiệu quả)

Nền: PT-a (#1486 — ô số dạng hộp, token `--os-*`, `.cap-so`). Mockup: `thiet-ke/v19/phan-tich.html` (chủ SP duyệt 12/11 kể cả các [XM]).
Ảnh cặp mockup | web (seed 14/09, QL Monbay, tối): `cap-1440-chi-nhanh.png` (3a) · `cap-1440-sos.png` (5a) · `cap-1440-y-thuc.png` (6a) · `cap-375-sos.png` (7c) ·
`cap-375-y-thuc.png` (7d) · `cap-375-chi-nhanh.png` (Chi nhánh 375 — mockup v19 không vẽ khung 375 Chi nhánh, đặt cạnh khung 1440) · `cap-1440-giao-vien.png` (thẻ Chưa phân công không hộp). Thi thật (4a): seed chưa có KQ thi thật → web là trạng thái rỗng, so theo mã.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | Đánh giá |
|---|---|---|---|
| 3a | Thẻ số lớn **không hộp** — chủ SP rà #1490: "Những số to không cần để vào trong box" (thay XM-5); vẫn là nút (màu nhấn, rê / focus gạch chân), màu nghĩa bằng màu chữ (đỏ ⚠, vàng). Áp mọi tab (dải thẻ `DaiChiSo` SOS · Thi thật · Ý thức · Giáo viên "Chưa phân công" + thẻ `SoTo` Chi nhánh) | cap-1440-chi-nhanh, cap-1440-sos, cap-1440-y-thuc, cap-1440-giao-vien | KHỚP (lời chủ SP mới hơn mockup) |
| 3a | Thẻ Thi thật: "Chưa có KQ" hộp vàng — chủ SP rà #1490 "để trong box như mockup"; số 0 vẫn hộp vàng (không bấm) | cap-1440-chi-nhanh | KHỚP |
| 3a | Theo lớp: ô tỉ lệ = hộp % + phân số mờ một dòng, thẳng cột; cột số bằng nhau (Lớp 160 / HV 120 / tỉ lệ 150) | cap-1440-chi-nhanh | KHỚP |
| 3a | Theo lớp: cột Thi thật vẽ "70 % 7/10" | cap-1440-chi-nhanh | KHÁC (GIỮ): web giữ Vượt · Đạt · Chưa đạt ba số bấm riêng (V2 đã duyệt, ba panel) |
| 3a | Tiến bộ theo kỹ năng: hộp + % mờ thẳng cột; ↑ Tăng chữ xanh, ↓ Giảm chữ đỏ (không ⚠) | cap-1440-chi-nhanh | KHỚP |
| 3a | Hàng 48 (bỏ `chat` 32 px) | cap-1440-chi-nhanh | KHỚP (web 44 — hàng mặc định `Bang`) |
| 3a | Chuyển trang 6 lớp / trang | cap-1440-chi-nhanh | KHỚP theo mã (seed 6 lớp, không trang 2) |
| 4a | Từng kỹ năng / Theo GV: hộp số em (Vượt xanh · Chưa đạt đỏ) + % mờ cùng dòng | — | KHỚP theo mã (`.cap-so`, seed không có KQ) |
| 4a | "Chưa có KQ" hộp vàng | — | KHỚP theo mã |
| 4a | Danh sách kết quả: điểm chữ thường có màu, không hộp | — | KHỚP (không đổi) |
| 5a | Ô SOS 1 · 2 · 3 **hộp tô màu theo mức** (SOS 1 viền vàng · SOS 2 nền cam · SOS 3 nền đỏ chữ trắng, cùng cỡ hộp số khác; 0 mờ) — chủ SP rà #1490: "trong bảng tổng hợp SOS, vẫn để dữ liệu số theo màu nhé" (bỏ XM-7); chip SOS ở tiêu đề cột giữ | cap-1440-sos, cap-375-sos | KHỚP (lời chủ SP mới hơn mockup) |
| 5a | Xử lý 4 cột: HV có Case · Case tách (cột có sẵn) · Chưa chốt PA · Đang xử lý | cap-1440-sos | KHỚP |
| 5a | Thiếu điểm, Chưa chốt PA hộp vàng (bảng + thẻ); "⚠ n quá hạn" giữ | cap-1440-sos | KHỚP |
| 5a | Hàng tuần 52 · lớp con 46 · tổng 52; nhóm cột cùng rộng (Kết quả 84 · Dưới kỳ vọng 72 · Xử lý 96) | cap-1440-sos | KHỚP |
| 5a | PA nào hiệu quả: số hộp, "Có cải thiện" + % | cap-1440-sos | KHỚP theo mã (seed 2 PA) |
| 6a | Thẻ "Chưa xử lý" hộp vàng | cap-1440-y-thuc | KHỚP |
| 6a | HV cần chú ý: Học viên 20 · Lớp 12 · Vi phạm 9 · Chưa xử lý 9 · **Bậc · hiện tại › kế** 26 (XM-4) · Lần xử lý gần nhất | cap-1440-y-thuc | KHỚP |
| 6a | Chưa xử lý: vàng; có phần quá hạn → đỏ ⚠ (dòng HV, lớp, nhóm vi phạm) | cap-1440-y-thuc | KHỚP |
| 6a | Hai bảng chồng nhau | cap-1440-y-thuc | KHỚP |
| 7c | SOS 375: thẻ theo tuần, chip SOS ở nhãn, hộp số | cap-375-sos | KHỚP |
| 7c | Thứ tự nhóm trong thẻ (mockup Kết quả · Xử lý · Dưới kỳ vọng) | cap-375-sos | KHÁC (GIỮ): thẻ 375 theo thứ tự cột bảng 1440 như hiện có |
| 7d | Ý thức 375: thẻ em, Vi phạm · Chưa xử lý hộp, Bậc gộp | cap-375-y-thuc | KHỚP (web dạng nhãn trái / giá trị phải của `TheDong` — mẫu thẻ chung) |

Đếm: 22 dòng · 20 KHỚP · 2 KHÁC (GIỮ) → 20 / 22 = **91 % khớp tuyệt đối; 100 % tính KHÁC (GIỮ)**.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm ô SOS 1 · 2 · 3 → panel | số trong chip màu (cao 22) | hộp màu theo mức cùng cỡ hộp số khác (cao 30), cùng panel; thêm chip ở tiêu đề cột |
| Bấm "HV - Case" (hai số trong một ô) | một ô "3 - 4" | hai cột HV có Case · Case, cùng hai panel |
| Thiếu điểm, Chưa chốt PA, Chưa xử lý, Chưa có KQ | chữ màu nhấn / xám | hộp vàng (đỏ ⚠ khi Chưa xử lý có phần quá hạn) |
| Ý thức: Bậc hiện tại, Bậc kế | hai cột | một cột "Bậc · hiện tại › kế" (Excel giữ hai cột) |
| Theo lớp / Tiến bộ / Thi thật theo GV: % | dưới số hoặc nhỏ sau số | hộp + % / phân số cùng dòng |
| Xếp theo · ⋯ Cột hiện · Xuất kết quả từng lượt · Xuất Excel · In · mở dòng con · ▸ nhóm vi phạm · chuyển trang · "Xem n GV còn lại" · ⓘ | có | GIỮ |

Mất thao tác: không.

## Turso

Không đường mới, không request mới. Ý thức: thêm `quaHan` vào dòng HV / lớp / nhóm của `/phan-tich/y-thuc` — đếm từ cửa trạng thái ĐÃ đọc cùng lần (`trangThaiYThuc`), 0 câu thêm,
0 dòng thêm. SOS: tách cột ghép ở web (dữ liệu `hvCoCase`, `case` đã có trong phản hồi). Chi nhánh / Thi thật: chỉ đổi cách vẽ.
