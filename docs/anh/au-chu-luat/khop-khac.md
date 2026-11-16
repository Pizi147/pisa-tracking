# AU-CHU · PR1 CHU-DUNG-LUAT — khớp / khác

PR chữ + luật (gói 5 audit 16/11 + N50 câu 6 / 9 / 10). Không đổi bố cục màn nào. Ảnh cặp TRƯỚC (main 819864f04) | SAU, demo, tối, phông Be Vietnam Pro đã nạp (`document.fonts`):

| Ảnh | Màn · vai | Thấy gì |
|---|---|---|
| `cv-gvcn-1440.png` · `cv-gvcn-375.png` | Công việc · GVCN 7 | Lớp của tôi: chip "Vận hành · 1" hết "›" (A1-06, khớp mockup ① XM-5) |
| `mt-cu-1440.png` | Bấm chip Vận hành → Nhập điểm MT cũ · GVCN 7 | Tiêu đề "Nhập điểm" → "Nhập điểm MT cũ · MB FT 101" (A1-05) |
| `sua-tt-1440.png` · `sua-tt-375.png` | Hồ sơ HV › ⋯ › Sửa thông tin · QL 2 | Bỏ "(không bắt buộc)" ở 9 nhãn — chỉ ô bắt buộc có * (A3-20); câu luật Target / Điểm đầu vào vào ⓘ |

## Bảng mã đã sửa

| Mã | Sửa | Ghi chú |
|---|---|---|
| P1-11 | Hồ sơ HV › Ý thức › Báo tình hình: truyền tên TVV của em (trước "Quản lý chi nhánh") | cả bước tình hình trong bảng |
| P1-13 | Panel Ghi kết quả PA: bỏ câu tĩnh trái luật; dòng quy chế theo vai — GVCN / QL "không thay · kết thúc sớm ở thẻ PA", GV bộ môn "không thay, không kết thúc sớm"; giữ nút "+ Thêm PA" | `viewer.coTheKetThucPa` |
| B1-03 | Số hạn ghi cứng → mã `{han:…}` / `{hang:…}` (Hạn mặc định): quy chế Ý thức, Case, PA khác quy chế, bàn giao đổi GV, hộp Tình hình (cả ngày "tới …" tính theo `HAN_HANG.tinh_hinh`), Quản trị › Case & SOS, chọn PA, ⓘ Sau thi, Hướng dẫn TVV / GV | QT đổi hạn → chữ tự đúng |
| B1-04 | Panel Bàn giao: "GVCN lớp cũ xác nhận · hạn {7 ngày} · Quản lý xác nhận thay được"; câu 403 bàn giao đổi GV bỏ "khi quá hạn" | khớp luật QL làm thay lúc nào cũng được |
| A2-05, A3-19 | Hạn / ngày thi không ghi thứ: Cuối khoá "hạn 20/08", "Hạn … · tới Thứ Hai…", "Đã thi 05/09" (máy chủ + panel) | giữ thứ ở chỗ nói ngày chuyển lớp |
| A2-04, A3-10 | Tên bậc VIẾT HOA qua một hàm (`bacDu` / `bacNgan`): dòng panel duyệt "Bậc thang kế tiếp: REPORT 7", cột Bậc của panel Phân tích Ý thức, thẻ "Bạn đang mở" của Hướng dẫn | |
| A1-21 | Tên panel = tên mục "Khai / sửa cấp bậc vi phạm" | nút bậc viết tắt GIỮ — [XM] xem dưới |
| A1-17 | Chế độ nhắc nhở: toast "Đã ghi nhắc nhở cho …", nút "+ Thêm nhắc nhở"; lưu xong mở sẵn Lịch sử, nền "vừa" ở dòng mới (hồ sơ HV) | |
| A1-05 | Việc "Nhập điểm MT cũ": nút "Nhập điểm ›" (đổi trang); trang đích "Nhập điểm MT cũ · {lớp}" (link thêm `&ma=`, 0 câu đọc) | |
| A1-06 | Nút-chip việc không có "›" ở mọi nơi | mockup ① XM-5 |
| A1-23 | Thang xử lý nối bậc bằng "→" | "›" chỉ cho link |
| B3-18 | Dòng Chấm điểm nối kỹ năng theo L · R · W · S | |
| B3-09 | Bàn giao môn (GV bộ môn) còn một em → "Bàn giao môn S · {em} → {lớp đến}" | như dòng GVCN |
| B3-19 | Sao chép GV chấm quá hạn: thêm "thi W1 JUL" mỗi dòng | |
| A3-20, A2-27, A2-19 | Bỏ "(không bắt buộc)" mọi form (`Truong`); câu luật Target / Điểm đầu vào / Số lớp / Phân công / Tuần bắt đầu vào ⓘ cạnh nhãn (`luat`); bỏ gợi ý "dd/mm/yyyy…" lặp dưới ô Dự kiến thi | ⓘ đặt NGOÀI `<label>` (nút trong nhãn cướp liên kết ô) |
| A3-18, A3-22 | (gói 8 AU-GON đã merge trước — lấy bản main) | |
| A2-25 | Đang soạn Từ chối → ẩn hộp "Sau khi duyệt" | |
| A2-16 | Panel S chéo / Chấm Test: badge tab đếm "bài" | |
| A1-19 | Một bộ đếm "n / trần" mọi nơi; mức tối thiểu không vào bộ đếm (báo khi lưu). Sửa mockup ⑫ `thiet-ke/v21/gv-viet-it.html`: "58/8" → "58 / 200" + dòng ghi sửa | |
| A3-04 | Tên đọc màn "+ Task" = đúng các mục đang có | |
| A3-15 | EN: "GVCN {tên}", nhãn bước "GVCN", trạng thái Báo PH qua `dich` | |
| B1-15 | `luat/0` D2 bỏ "Đã xem"; Hướng dẫn QL bỏ "Dời lịch Test" (lọc, duyệt nhiều, hạn); ⓘ tab Ý thức bỏ "hoặc Đã xem" | plan.md N40–N45 PTA đã sửa |
| N50 (6) | Một hằng `CHU_TOI_THIEU = 8` (`shared/domain/khac.ts`): Case, bàn giao (15 → 8), nhận xét MT, Meeting, kết thúc / đổi PA, tình hình, mô tả + lý do Ý thức, xin hỗ trợ QL, Xác nhận PA lô, bước TVV bản gốc | máy chủ + web cùng hằng |
| N50 (9) | Head tutor chưa có vai GV: "Chưa được phân công lớp — nhờ Quản trị cấp thêm vai Giáo viên." | |
| N50 (10) | GIỮ "↗" ở "Tiến bộ một phần" — không đổi | |
| A1-13 | để PR 3 (CASE-Y-THUC-GON) | |

## [XM] — hỏi PTA Plan
- **A1-21 nút bậc viết tắt (R1 · WL1…):** audit đề xuất viết đủ; mockup 1111 màn 2 (đã duyệt) vẽ tên ngắn trên chip (tên đủ ở `title` / đọc màn). Giữ theo mockup.
- **A2-27 "Đã đọc theo mẫu Excel chung: …":** giữ — câu này là phản hồi trạng thái sau khi dán (đọc thế nào + nút đổi), không phải chú thích tĩnh.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Bấm chip việc ở Lớp của tôi / hồ sơ lớp / HV & Lớp | có / không "›" tuỳ việc đầu | không "›", cùng hành vi |
| Nhập điểm MT cũ từ Công việc | nút "Nhập điểm" | "Nhập điểm ›", cùng đích |
| Ghi kết quả PA quy chế → "+ Thêm PA" | trong câu tĩnh | nút giữ nguyên chỗ |
| Đọc luật ô Target / Số lớp / Phân công / Tuần bắt đầu | chữ dưới ô | ⓘ cạnh nhãn |
| Ghi nhắc nhở | lưu xong không thấy gì | Lịch sử mở sẵn, dòng mới tô nền |
Không mất thao tác nào.

## Dòng đọc Turso
0 câu thêm. Máy chủ chỉ đổi chữ / thứ tự nối kỹ năng / thêm tham số `ma` vào link có sẵn; `motEm` của bàn giao môn lấy từ hàng đã đọc. Băm JSON Công việc (TD4-a) chụp lại có chú thích lý do.
