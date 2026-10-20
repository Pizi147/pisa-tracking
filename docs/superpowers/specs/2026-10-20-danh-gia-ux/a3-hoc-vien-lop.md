> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# A3 — Rà UX/UI: Học viên & Lớp · Hồ sơ lớp · Hồ sơ học viên · Case (20/10/2026)

Người rà: agent a3 (Opus 5.5). Chỉ đánh giá, không sửa gì. Web demo http://localhost:5621, ngày demo 14/09/2026, mã `main` e3405b93.
Ảnh: `ANH = C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\` (330 tệp, nhật ký `index.jsonl`).
Phương pháp: impeccable critique (Assessment A) + ui-ux-pro-max (mã rule ghi trong từng mục) + đếm bước workflow + đối chiếu mockup đã duyệt + đọc mã / DB demo (chỉ đọc).
Nhãn: [XÁC NHẬN-ẢNH] đúng như ảnh chủ SP, đã kiểm lại · [PHÁT HIỆN] tự tìm, đã kiểm web / mã · [GIẢ THUYẾT] chưa kiểm được · [ĐỀ XUẤT] · [CẦN ẢNH].

---

## Phần 0. Phạm vi

### Đã chụp (id ảnh = tên tệp trong ANH; `-pN` = lát 1100 px; `--x` = ảnh giữa thao tác)
- **Học viên & Lớp, vai QT 1, Monbay (1440 tối)**: Tất cả `hvl-tatca`, Loại lớp FT `hvl-tatca-ft`, mở MB FT 101 `hvl2-mo101` (= ảnh 6 chủ SP), lớp thường mở `hvl2-mo-thuong`, Xếp chú ý `hvl-xepchuy`, trang 2 `hvl-trang2`, Đã thi `hvl-dathi`, Bộ lọc thêm `hvl-locthem` + lọc "Case trống PA" (QL 2) `wf-ql-locthem-trongpa`.
  Đang SOS: Toàn bộ `hvl-sos` (= ảnh 8), một tuần `hvl-sos-tuan`, trang 2 / 3 `hvl2-sos-p2`, `hvl2-sos-p3`, 50 dòng `hvl2-sos-50`, hộp "Vì sao SOS" `hvl-sos-chip`, panel một em `hvl-sos-mo`.
  Cần làm `hvl-canlam` (+ FT 50 dòng `hvl2-canlam-50` = ảnh 7), lọc phụ Quá hạn / Chờ duyệt / Thiếu thông tin `hvl-canlam-quahan|choduyet|thieu`, Mở việc `hvl-canlam-mo`.
  Lịch thi `hvl-lichthi`. Panel / menu: Xuất Excel `hvl-xuat`, `hvl-xuat-sos`; ⋯ trang `hvl-menu-trang`; ⋯ hàng lớp `hvl-menu-lop` → Nhập điểm `hvl-nhapdiem`; ⋯ hàng em `hvl2-mo101-menuem`; "Thiếu n" `hvl2-mo101-thieu`; chip SOS `hvl2-mo101-chip`; "+1" `hvl-plus1`; tích chọn `hvl2-mo101-chon`; + Học viên `hvl-them-hv`; + Lớp mới `hvl-lop-moi`.
- **Vai khác** (`/hoc-vien`): QL 2 `hvl2-ql2`, `hvl2-ql2-canlam` · GVCN 7 `hvl2-gvcn7`, `hvl2-gvcn7-mo`, `-sos`, `-canlam`, `wf-gvcn-canlam` · GV 10 `hvl2-gv10`, `hvl2-gv10-canlam` · TVV 23 `hvl2-tvv23`, Lịch thi `wf-tvv-lichthi` · CX 24 `hvl2-cx24`.
- **375 sáng**: `hvl2-375-tatca`, `hvl2-375-sos`, `hvl2-375-canlam`, `hvl2-375-lichthi`, panel một em `kb-375-sos-panel`. **1440 sáng**: `hvl2-sang-mo101`, `lop-ft-sang`, `hv-sos3-sang`.
- **Hồ sơ lớp MB FT 101 (id 3)**: Tổng hợp `lop-ft-tonghop` (= ảnh 4), Góp ý `lop-ft-gopy`, Cần hỗ trợ `lop-ft-canhotro`, Kết quả đầu ra `lop-ft-ketqua`, Ý thức › Vi phạm `lop-ft-ythuc` (= ảnh 5), › Phối hợp SOS `lop-ft-phoihop`, Phân tích lớp `lop-ft-phantich`, Phân tích khi gập lưới điểm `lop-ft-gapdiem`;
  ⋯ `lop-ft-menu`, Lịch sử `lop-ft-lichsu`, Thông tin lớp `lop-ft-thongtinlop`, Sửa thông tin (cả lớp) `lop-ft-suathongtin`, Chọn nhiều `lop-ft-chonnhieu`, Nhập điểm `lop-ft-nhapdiem` / GVCN `wf-gvcn-nhapdiem`, + Case `lop-ft-case`, "+1" `lop-ft-plus1`, chip "8 chờ duyệt" → `lop-ft-choduyet`, chip "78 bài chờ chấm" → `lop-ft-baicham`, + Ghi vi phạm `lop-ft-ghivipham`, ⋯ hàng em `lop-ft-menuem`;
  vai GVCN 7 `lop-ft-gvcn7`, GV 10 `lop-ft-gv10`, TVV 23 (ngoài phạm vi) `lop-ft-tvv23`; 375 `lop-ft-375`, `lop-ft-ythuc-375`.
- **Lớp thường**: MB FOU 12 Tổng hợp / Lộ trình tiếp theo / Cần hỗ trợ / Ý thức `lop-thuong-*`; MB BE 03 `lop-thuong-be03`; lớp đã kết thúc MB FOU 03 `lop-ketthuc`.
- **Hồ sơ học viên**: Vũ Ngọc Lan (FT, SOS 3) Học thuật / Ý thức / Hành trình `hv-sos3-*`, ⋯ `hv-sos3-menu`, Sửa thông tin `hv-sos3-suatt`, Chuyển lớp `hv-sos3-chuyenlop`, Lịch sử `hv-sos3-lichsu`, Case trong hồ sơ `hv-sos3-case`, mở hàng kỹ năng `hv-sos3-hang`, GVCN `hv-sos3-gvcn7`, TVV `hv-sos3-tvv23`, 375 `hv-sos3-375`;
  Trịnh Bảo Ngọc (4 Case) `hv-sos2-trinh`; Dương Ngọc Ánh (lớp thường) `hv-thuong`, `hv-thuong-hanhtrinh`; Dương Minh Quân (FT xong lộ trình) `hv-dathi`; Ngô Thanh Tùng (kết thúc học) `hv-ketthuc`; `/hoc-thuat/case/36` `hv-case-trang`; `/hoc-vien/luu-tru` `hv-luutru`.
- **Bàn phím**: Tab ở Học viên & Lớp `kb-tab-hvl`, hồ sơ lớp `kb-tab-lop`; Esc đóng panel Xuất `kb-esc-xuat`, panel một em `kb-esc-panelem`.
- **Mockup đã duyệt** (`mk-*`): OV-14-1 khung 3 Học viên & Lớp (`mk-m14-1-s3-p1..p4`), khung 4 hồ sơ lớp (`mk-m14-1-s4-p1..p2`); OV-14-5 khung 1 Lịch thi, khung 2 Xuất (`mk-m14-5-q1`, `-q2`); OV-14-6 khung 1 SOS, khung 2 hồ sơ lớp (`mk-m14-6-m1`, `-m2`); OV-12-3 v2 g2 / g4 / P1 (`mk-m12-3-*`); overhaul-2 p1, p6 (`mk-mo2-*`); Sửa thông tin 05/10 (`mk-msua-s1`). Chữ của mọi khung mockup trích ở `scratchpad\a3\m*.txt`.
- **Số liệu kiểm thêm** (API / DB chỉ đọc): Tổng quan `GET /tong-quan/ql?branchId=1&chuongTrinh=ft`; Đang SOS `GET /hoc-vien-lop?branchId=1&goc=sos` (`scratchpad\a3\demsos.mjs`); thành phần "Thiếu" của 51 em FT Monbay (DB).

### Chưa rà được + lý do
- Trạng thái "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp" ở Monbay: demo không có em nào (chip "Đã thi · chờ kết quả 0"). Panel Kết quả thi thật / Bước tiếp / Gia hạn chưa mở được.
- Không bấm các nút lưu ngay: Kết luận ở Lịch thi (Giữ tháng / Cần xác nhận lưu ngay khi bấm), ô Ghi chú họp (lưu khi rời ô), Xuất file thật, Duyệt / Từ chối, Lưu trữ / Kết thúc / Xoá hàng loạt, Học lại, Xoá học viên.
- Không thử Dán từ Excel (xem trước) và EN; không thử zoom 200 % và trình đọc màn hình thật (chỉ đọc aria-label trong mã).
- Môi trường (KHÔNG phải lỗi web): lúc đầu máy chủ thử trả 403 cho tệp phông `@fontsource` (.woff / .woff2) → ~30 lỗi console mỗi trang, ảnh dùng phông dự phòng. Không có 403 nào từ `/api/` (đã kiểm URL). Điều phối đã sửa môi trường; tôi đã **chụp lại 19 màn** có nhận xét về chữ / xuống dòng / cắt chữ / chiều cao với phông đúng (cùng id, ảnh ghi đè): `hvl-tatca-ft`, `hvl2-mo101`, `hvl-sos`, `hvl-sos-tuan`, `hvl2-sos-p2`, `hvl-canlam`, `hvl2-canlam-50`, `hvl-lichthi`, `hvl2-375-tatca`, `hvl2-375-sos`, `lop-ft-tonghop`, `lop-ft-ythuc`, `lop-ft-phantich`, `lop-ft-gapdiem`, `lop-ft-canhotro`, `lop-ft-suathongtin`, `lop-ft-375`, `lop-thuong-tonghop`, `hv-sos3-hocthuat`. Kết luận không đổi; với phông đúng chữ rộng hơn nên xuống dòng / cắt chữ nặng hơn (số đo dưới đây là bản chụp lại).
- Lưu ý ảnh: cỡ trang (10 / 20 / 50) nhớ chung cho mọi danh sách — bản chụp lại `hvl-lichthi`, `lop-ft-canhotro` hiện 50 dòng / trang vì vừa chọn 50 ở `hvl2-canlam-50` trong cùng phiên.

---

## Phần 1. Điểm

### Nielsen (khu vực a3) — **23/40 (Acceptable, 20–27)** — KHÔNG xứng ≥ 35

| # | Nguyên tắc | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | Có dòng "Đang xem…", lưu / lỗi tại hàng ở Lịch thi, Esc trả focus. Nhưng số trên màn sai / che: đầu nhóm lớp ở Đang SOS và Cần làm chỉ đếm trang đang xem (MB FT 101 "2 em" trang 1, "4 em" trang 2, thật là 7); "+1" giấu "⚠ 22 việc quá hạn"; "MT3 còn 35 ô trống" đếm cả ô của tuần chưa tới; nút góc "Tất cả" đổi thành "Tất cả 7" khi bật Bộ lọc thêm. |
| 2 | Khớp đời thực | 2 | Từ nghiệp vụ đúng vai, nhưng nhiều ký hiệu không tự giải thích: "Thiếu 2", "+1", "−0.5", "6/11" (Phân tích lớp), "KCK", "Không đạt: S" cạnh "✓". "Đang SOS" gồm cả lượt có Case đã Xong (chữ "Đang" sai nghĩa). |
| 3 | Kiểm soát, thoát | 3 | Esc đóng panel, focus về nút; trạng thái trên URL; Hoàn tác ở thao tác hàng loạt; "Xoá lọc thêm", "Bỏ chọn". Trừ: link "‹ Công việc" tĩnh ở trang Chờ duyệt (không về hồ sơ lớp nơi vừa bấm chip). |
| 4 | Nhất quán | 1 | Cùng cột "Việc tiếp theo" có 3 hành vi (panel tại chỗ / sang Test / sang hồ sơ HV); chip SOS 4 dáng; 3 con số SOS khác nhau cho cùng phạm vi (Tổng quan 14 · Đang SOS 9 · Báo cáo "2/3/0" theo ảnh 9); ô trống 4 cách ("–", trống, "—", "chưa có điểm"); ✓/✗ trước số (lớp thường) / sau số (FT) / không có (W1·W2, bảng Mock Test hồ sơ HV); phân trang 4 đơn vị (lớp · lượt · việc · HV); chọn nhiều 2 kiểu; "Cần làm" / "Cần chú ý"; "Thiếu 2" / "Thiếu thông tin" / "Thiếu 2 thông tin". |
| 5 | Phòng lỗi | 3 | Trường bắt buộc có *, Chuyển lớp bắt lý do, "Bỏ ngày …?" tại hàng Lịch thi, Sửa cả lớp hỏi khi đóng lúc đang sửa. Rủi ro nhỏ: Nhập điểm mở sẵn MT3 thay vì lượt đang quá hạn. |
| 6 | Nhận ra hơn nhớ | 2 | Việc quá hạn giấu sau "+1"; lọc mức SOS không có, "Case trống PA" giấu trong Bộ lọc thêm của góc Tất cả; nghĩa "6/11" chỉ ở tooltip đầu cột; GVCN phải nhớ MT nào còn ô quá hạn; QL phải mở từng lớp mới biết lớp có SOS 3 (mockup có tóm tắt trên hàng lớp). |
| 7 | Linh hoạt, nhanh | 3 | Có Trước / Sau giữa hồ sơ, URL sâu, Dán Excel, Xuất 3 mẫu, chọn nhiều, ô tìm tự mở lớp khớp. Không phím tắt; nhiều việc phải mở lớp gập / đổi trang. |
| 8 | Tối giản | 1 | Hàng em 2–4 dòng, một sự kiện lặp 3 lần; "Thiếu n" ở 46/51 em; lưới "Điểm Mock Test của lớp" mở sẵn dưới MỌI tab (+~2.200 px, 33 em xuất hiện hai lần); Ý thức ~45 dòng phẳng; 375 phần điều khiển chiếm 540–720 px; trang 375 dài 10.000+ px. |
| 9 | Sửa lỗi | 3 | Lỗi lưu ở Lịch thi giữ chữ + Thử lại; trang ngoài phạm vi có câu rõ + nút quay lại (`lop-ft-tvv23`); "Chưa tải được · bấm để thử lại" ở góc Cần làm. |
| 10 | Trợ giúp | 3 | Có Hướng dẫn theo vai + hộp "Vì sao SOS" + popover "Thiếu" ghi ai điền được. Nhưng hộp SOS hai nội dung khác nhau, không có việc để làm; popover Thiếu không có nút sửa. |
| | **Tổng** | **23/40** | Đích 35: 1 → 4, 2 → 3, 3 → 4, 4 → 3, 6 → 4, 7 → 4, 8 → 3, 10 → 4 (5 và 9 giữ 3) — xem Phần 3. |

### Thiết kế có "riêng cho sản phẩm" không
Có: nhóm theo lớp, chip SOS viền dày dần, hàng "Cả lớp", mã tuần, Lịch thi Kết luận tại hàng — đều sinh từ nghiệp vụ PISA. Vấn đề không phải "chung chung" mà là **quá nhiều thứ cùng nói một lúc**: mỗi hàng chứa kết quả, điểm, chip, nhãn thiếu, việc, hạn; mỗi trang chồng thêm khối của trang khác (lưới điểm, danh sách Công việc).

### Cognitive load — **6/8 mục trượt (cao)**
- Trượt: Single focus (hồ sơ lớp = bảng 33 em + lưới 33 em) · Chunking (đầu Học viên & Lớp ~10 điều khiển; Bộ lọc thêm 15 nút; Lịch thi 12 nút tháng) · Visual hierarchy (quá hạn bị giấu, chip vàng / xanh cho trạng thái thường) · One thing at a time (một ô "Kết quả gần nhất" 3 dòng + chip + nhãn) · Minimal choices · Working memory (GVCN nhớ MT quá hạn; QL nhớ số SOS giữa 3 trang).
- Đạt: Grouping (nhóm theo lớp, khối rõ) · Progressive disclosure (Bộ lọc thêm gập, Panel một em, lớp gập).
- Điểm quyết định > 4 lựa chọn: đầu trang Học viên & Lớp (4 góc + Đã thi + Bộ lọc thêm + Loại lớp + Xếp + Phạm vi + Chi nhánh + ô tìm); Bộ lọc thêm (15); Lịch thi (12 tháng; mỗi hàng 3–4 nút Kết luận × 43 hàng); ⋯ hồ sơ HV (8 mục); ⋯ hồ sơ lớp (7 mục + 3 tiêu đề nhóm); bảng Đang SOS 9 cột.

### Hành trình cảm xúc (Chị Vy, giao ban sáng)
Mở Học viên & Lớp → 20 lớp gập, mỗi lớp 2 chip + "+1", không thấy lớp nào có SOS 3 (lo) → Đang SOS → trang 1 toàn SOS 1, SOS 3 ở trang 2 (bực) → Cần làm "73 học viên · 181 việc" (đỉnh tiêu cực: mọi em đều "cần làm") → Xuất Excel chạy tốt (kết thúc dễ chịu nhưng không cứu được đỉnh xấu).

### Persona — điểm gãy cụ thể
- **Alex (thạo việc)**: ~20 lần Tab mới tới nút góc nhìn (`kb-tab-hvl`, `kb-tab-hvl--tab8`); dùng link "Bỏ qua tới nội dung" vẫn ~8 Tab qua 7 điều khiển đầu trang; không lọc mức SOS; muốn xem một lớp phải bấm mở (lớp gập mặc định); "Xếp: Cần chú ý trước" chỉ xếp trong lớp, lớp gập thì không thấy đổi gì; chọn nhiều ở Học viên & Lớp chỉ để Xuất.
- **Sam (bàn phím / trình đọc màn / tương phản)**: tốt — viền focus rõ, Esc trả focus (`kb-esc-xuat`, `kb-esc-panelem`), chip SOS có chữ + độ dày viền. Gãy — 34 nút ⋯ trong một lớp cùng tên "Thao tác khác" (`BangHocVienLop.tsx:269` `MenuDong` không truyền `nhan`), không biết ⋯ của em nào; nghĩa ô "6/11" chỉ ở tooltip.
- **Cô Linh (GV 5 lớp, điện thoại)**: 375 đầu trang chiếm 540–720 px (`hvl2-375-tatca-p1`, `hvl2-375-sos-p1`); thẻ em ~330 px, 8 nhãn; hồ sơ lớp 375 dài 10.382 px; đường nhập điểm nhanh nhất lại là góc Cần làm (bản sao Công việc). Thấy chip "Thiếu thông tin 39", "Chờ duyệt 6" không phải việc của mình (`hvl2-gv10-canlam`).
- **Chị Vy (QL, 10 phút)**: muốn biết "lớp nào có SOS 3 / quá hạn / chờ duyệt" — hàng lớp không có tóm tắt SOS, quá hạn bị "+1" giấu, số SOS ở Học viên & Lớp (9) khác Tổng quan (14). Phải ≥ 6 bấm và đối chiếu hai trang.

### Điểm tốt (giữ)
- Panel một em: việc làm ngay trong panel, Ngăn Case thay nội dung có "← tên em", tách link "Hồ sơ ↗" khỏi nút làm việc (`hvl-sos-mo`).
- Lịch thi: Kết luận tại hàng, trạng thái Đang lưu / Đã lưu / lỗi giữ chữ + Thử lại, "Bỏ ngày …?" ngay tại hàng.
- Chuyển lớp, Sửa thông tin, Lịch sử, Case: panel phải cùng mẫu, không đổi trang; hồ sơ HV gọn (1.241 px), duyệt ngay trong hồ sơ.
- Xuất Excel: 3 mẫu cột, nhớ mẫu, "đủ mọi trang, kể cả hàng chưa hiện".

---

## Phần 2. Phát hiện (nặng → nhẹ)

### A3-01 Lưới "Điểm Mock Test của lớp" mở sẵn dưới MỌI tab hồ sơ lớp — [XÁC NHẬN-ẢNH] · P1 · QL, GVCN, GV
- Vấn đề: dưới tab Học viên, Ý thức, Phân tích đều có cả lưới điểm MT (33 em). 33 em hiện hai lần trên cùng trang. Lưới này trùng với nút "Nhập điểm" ở đầu trang (cùng component `DiemTheoLop`).
- Bằng chứng: `lop-ft-tonghop-p3` (bảng hết → lưới bắt đầu), `lop-ft-ythuc-p3`, `lop-ft-phantich-p1`. Chiều cao (phông đúng): Phân tích 3.012 px, gập lưới còn **804 px** (`lop-ft-gapdiem`) → lưới thêm ~2.200 px mỗi tab; Tổng hợp 4.800, Ý thức 5.431, 375 10.382 px. Mã: `ClassOverviewPage.tsx:145` vẽ `KhoiDiemLop` ngoài khối tab; `:48` `useState(true)` mở sẵn.
- Nguyên nhân: kế hoạch. Khối được duyệt 11/10 (mockup overhaul-2 p1: "bảng cuối trang mở sẵn") khi "Nhập điểm" còn chuyển sang Test. OV-15b (C16) đổi Nhập điểm thành panel nhưng không bỏ khối cũ.
- Ảnh hưởng: trang dài gấp 2–6 lần; tab Ý thức / Phân tích bị chìm; GV đọc nhầm hai bảng; trên điện thoại phải vuốt ~12 màn.
- Phương án: BỎ khối cuối trang. Lưới chỉ mở qua nút "Nhập điểm" (panel) — hoặc thành cách xem thứ 5 "Điểm MT" trong tab Học viên nếu chủ SP muốn đọc lưới không mở panel.
- Lý do tốt hơn: một chỗ một việc; mỗi tab chỉ nội dung của nó; giảm ~2.200 px. Rule: `content-priority`, `progressive-disclosure`.
- Lệch mockup: OV-14-1 khung 4 và OV-14-6 khung 2 chỉ vẽ bảng học viên, không vẽ lưới dưới tab khác.

### A3-02 Đang SOS: phân trang theo lượt cắt lớp ra nhiều trang, số đầu nhóm sai, SOS 3 rơi xuống trang 2 — [PHÁT HIỆN] · P1 · QL, GVCN
- Vấn đề: 10 lượt / trang, xếp theo tuần rồi tên → MB FT 101 hiện ở trang 1 ("2 em · 2 lượt SOS"), trang 2 ("4 em · 4 lượt SOS") và trang 3; số thật 7 em (SOS 1: 4 · SOS 2: 2 · SOS 3: 1). Em SOS 3 duy nhất của MB FT 101 (Vũ Ngọc Lan) và Dương Ngọc Ánh (SOS 3, MB FOU 12) đều ở trang 2; trang 1 không có em SOS 3 nào.
- Bằng chứng: `hvl-sos-p1`, `hvl2-sos-p2-p1`; API `demsos.mjs`: 10 dòng trang 1 toàn SOS 1–2 tuần W2 SEP. Mã: `StudentsPage.tsx:541` truyền `pt.cat(sosRows)` (lát trang) vào `BangSos`; `BangSos.tsx:129–143` đếm đầu nhóm trên lát đó.
- Nguyên nhân: triển khai (OV-15f gắn phân trang dòng vào bảng có nhóm).
- Ảnh hưởng: QL tưởng lớp chỉ có 2 em SOS; bỏ sót SOS 3 — đúng việc góc này sinh ra để chống.
- Phương án: (a) xếp mặc định SOS 3 → 2 → 1, rồi tuần; (b) phân trang theo LỚP (như góc Tất cả) hoặc bỏ nhóm lớp (đã có cột Lớp như mockup 6); (c) số đầu nhóm đếm trên toàn bộ.
- Lệch mockup: OV-14-1 khung 3 "Đang SOS — mặc định Toàn bộ (SOS 3 thấy ngay)", hàng lớp ghi "7 em · 7 lượt SOS · SOS 1 4 · SOS 2 2 · SOS 3 1".

### A3-03 "Cần làm" ≈ "Tất cả" và là bản sao Công việc — [XÁC NHẬN-ẢNH] · P1 · QL, QT (GV ít hơn)
- Vấn đề: FT Monbay "Tất cả 51 · Cần làm 51"; Tất cả lớp "99 / 73". Danh sách "1–50 / 118 việc" = việc của Công việc lọc chi nhánh, nhóm theo lớp.
- Bằng chứng: `hvl2-canlam-50-p1` (= ảnh 7), `hvl-canlam-p1`. Mã: `StudentsPage.tsx:164` nguồn `/my-work?nguoi=tat-ca&branchId=` (đúng nguồn Công việc); `:242` QL cộng thêm `viecPhu` (Chờ duyệt + Thiếu thông tin); Thiếu thông tin = 46/51 em → mọi em đều "cần làm".
- Nguyên nhân: thiết kế (mockup OV-12-3 v2 g4, 14/10) + dữ liệu thật: mockup giả định "Thiếu thông tin 12 / 100", thực tế 46 / 51.
- Ảnh hưởng: con số không lọc được gì; hai nơi cùng việc nhưng khác cách xếp → QL không biết xem nơi nào; tốn 3 lời gọi API cho mỗi lần mở trang.
- Phương án: BỎ góc Cần làm khỏi Học viên & Lớp. Thay bằng: chip "⚠ n quá hạn" trên hàng lớp → mở **panel** danh sách việc của lớp đó (cùng `PanelViec`), hoặc Công việc lọc sẵn lớp. Thiếu thông tin thành lọc của góc Tất cả.
- Lý do tốt hơn: một khái niệm một nơi (CLAUDE.md "cùng số liệu cùng nguồn"); giảm 1 góc nhìn, 3 lọc phụ. Cần chủ SP quyết (đổi thiết kế 14/10).

### A3-04 "Thiếu n" trên 46/51 em — nhiễu thường trực — [XÁC NHẬN-ẢNH] · P1 · mọi vai
- Vấn đề: gần như mọi tên có "Thiếu 2 / 3". Thành phần thật (DB, 51 em FT Monbay): Tháng / năm dự kiến thi thiếu **43**, Điểm đầu vào thiếu **44**, Target 2, Email 1, Ngày sinh 0 (+ "Mốc đánh giá tiếp theo" ở vài em).
- Bằng chứng: `hvl2-mo101-p1`, `hvl2-mo101-thieu` (popover: Tháng/năm dự kiến thi · Điểm đầu vào · Mốc đánh giá tiếp theo), `lop-ft-tonghop-p1`. Mã: `server/src/classes/schedule.ts:774–783` `missingForStudent`. Chú thích schema `learning_cycles`: điểm đầu vào "không có căn cứ thì để trống… KHÔNG lấy MT1" → trống là trạng thái hợp lệ, nhưng vẫn bị tính "Thiếu".
- Nguyên nhân: luật (định nghĩa Thiếu thông tin, Q3 14/10) + thiết kế (nhãn ở từng hàng, mọi vai thấy).
- Ảnh hưởng: nhãn có ở mọi hàng thì không ai nhìn; che các nhãn thật sự cần (Ý thức · cần xử lý). GV thấy nhãn mà người điền là "Admin CN · Quản lý".
- Phương án: [ĐỀ XUẤT] bỏ nhãn ở từng hàng; hàng lớp ghi một số "Thiếu TT 46" bấm được → lọc em thiếu + mở Sửa cả lớp đúng cột; chỉ hiện cho vai điền được. Câu hỏi luật (Phần 4): Điểm đầu vào và Tháng dự kiến thi có nên tính "Thiếu" không.
- Lệch mockup: mockup 1 khung 3 / 4 cũng vẽ "Thiếu n" ở mọi em (lỗi nằm ở thiết kế đã duyệt). Rule: `visual-hierarchy`, `whitespace-balance`.

### A3-05 Hàng lớp: "+1" giấu việc quá hạn; thiếu tóm tắt SOS / Đã thi / Case theo cột — [XÁC NHẬN-ẢNH + PHÁT HIỆN] · P1 · QL, QT
- Vấn đề: QL thấy "8 chờ duyệt · 78 bài chờ chấm · +1", "+1" = "⚠ 22 việc quá hạn" (`hvl-plus1`, `lop-ft-plus1`). Hàng lớp không có "SOS 1 4 · SOS 2 2 · SOS 3 1", "Đã thi · n", tổng Case như mockup.
- Bằng chứng: mã `shared/domain/hocVienLop.ts:301–304` thứ tự QL `cho-duyet, xep-lop, cham, qua-han…`, `:338` chỉ hiện 2. Mockup `mk-m14-1-s3-p1`: hàng MB FT 101 có SOS theo bậc ở cột Kết quả, "Đã thi · 2" ở cột Dự kiến thi, "14" ở cột Case, "⚠ 8 quá hạn · 8 chờ duyệt · 78 bài chờ chấm" ở cột Việc tiếp theo, không có "+n".
- Nguyên nhân: triển khai (OV-15 không làm "hàng lớp có tóm tắt đúng cột") + quyết định cũ B4 (thứ tự theo vai).
- Ảnh hưởng: việc gấp nhất bị giấu; QL phải mở từng lớp hoặc sang góc khác để biết lớp nào có SOS 3.
- Phương án: hàng lớp làm đúng mockup 1 (tóm tắt theo cột, quá hạn luôn hiện đầu, bỏ "+n"); nếu chật thì bỏ chip "bài chờ chấm" (việc của GV) chứ không bỏ quá hạn. Rule: `chip-collection-reflow` ("+n" phải là chỗ mở, không giấu giá trị quan trọng).

### A3-06 Hàng em 2–4 dòng, cùng thông tin lặp 3 lần — [XÁC NHẬN-ẢNH] · P1 · QL, GVCN
- Vấn đề: ô "Kết quả gần nhất" 3 dòng: "6.5 −0.5 SOS 1 · S / MT3 · kỳ vọng 7.0 / Không đạt: S", rồi cột OVR / L / R / W / S lặp đúng các số đó với ✓/✗. "S dưới kỳ vọng" hiện 3 lần (chip, "Không đạt: S", "5.0 ×"). "Chưa có tháng thi" hiện 3 lần (Thiếu n, Dự kiến thi "—", Sắp tới "Thi thật · chưa có ngày"). Cột Việc tiếp theo 13 % rộng → "Kết quả PA R · kỳ W2–W3 SEP · hạn 22/09" gãy 3 dòng.
- Bằng chứng: `hvl2-mo101-p1` (= ảnh 6, chụp lại với phông đúng). Phông đúng làm dày thêm: dòng phụ "W1 · W2" của cột W gãy thành 2 dòng ("7.0 · / 7.0"), tên + "Thiếu n" xuống 2 dòng ở 4/12 hàng đầu, ô Việc tiếp của Đỗ Minh Khôi 5 dòng. Mã `BangHocVienLop.tsx:278–293` (`KetQuaOHocVien`), `:284` số "−0.5"; colgroup `StudentsPage.tsx:600–601` (cột W 4,5 %).
- Nguyên nhân: triển khai thêm cột điểm (C13) mà không bớt ô Kết quả; số chênh "−0.5" trái mockup 6 ("bỏ thiếu / vượt").
- Ảnh hưởng: 33 em = 2.846 px (1440); mắt phải đọc lại cùng một tin; ảnh 6 chủ SP chê "rất dày".
- Phương án: ô Kết quả còn 1 dòng = chip SOS (kèm kỹ năng) hoặc "✓ Đạt" + "MT3"; bỏ "−0.5", bỏ "Không đạt: …" (đã có ✗ ở cột); gộp Dự kiến thi vào Sắp tới; Việc tiếp theo 1 việc + "+n việc". Hàng còn 1–2 dòng (~44 px).
- Lệch mockup: mockup 1 khung 3 ô Kết quả 2 dòng ("SOS 1 · S / MT3 · kỳ vọng 7.0"), không số chênh, không "Không đạt".

### A3-07 Bấm việc / chip ở Học viên & Lớp và hồ sơ lớp: 3 hành vi, nhiều lần bắt đổi trang — [PHÁT HIỆN] · P1 · mọi vai làm việc
- Vấn đề: cùng cột "Việc tiếp theo": việc Case → Panel một em tại chỗ; "Nhập điểm …" (cả dòng "Cả lớp") → sang Test › Lịch Test + panel; việc Ý thức → sang hồ sơ HV tab Ý thức. Ở hồ sơ lớp, cột "Theo dõi" việc Case → sang hồ sơ HV. Chip đầu hồ sơ lớp: "8 chờ duyệt" → Công việc › Chờ duyệt (link lui là "‹ Công việc" tĩnh, không về hồ sơ lớp); "78 bài chờ chấm" → Test (trang đích không có số 78: "Còn phải chấm 29 · Quá hạn 49"); "+1 ⚠ 22 việc quá hạn" → Học viên & Lớp › Cần làm.
- Bằng chứng: `lop-ft-choduyet`, `lop-ft-baicham`. Mã: `classes/thaoTacDongHocVien.tsx:58–66` (`duongViecTiep`), `:49` (`/test/diem-lop?lop=`); `BangHocVienLop.tsx:264–266` chỉ Case có `onBam`; `DauTrangLop.tsx:118–127`; `congViec/CongViecPage.tsx:36` link "‹ Công việc" cố định.
- Nguyên nhân: triển khai từng PR (OV-12f chỉ đổi việc Case sang panel; OV-15b đổi ⋯ "Nhập điểm" sang panel nhưng link Việc tiếp vẫn đi đường cũ).
- Ảnh hưởng: đúng lời chủ SP "bắt sang hẳn trang khác"; đóng panel ở Test không về Học viên & Lớp; số trên chip không khớp trang đích (C02).
- Phương án: một luật: mọi việc ở hàng / chip mở panel tại chỗ (đã có sẵn: `PanelNhapDiemLop`, form Ý thức dùng ở Công việc, `HopChoDuyet` lọc lớp, `PanelViec`). Chip "bài chờ chấm" → Nhập điểm panel "Chỉ ô còn trống". Số trên chip = số dòng trong panel. Rule: `back-behavior`, `state-preservation`, `navigation-consistency`.

### A3-08 Ba con số "SOS" khác nhau cho cùng chi nhánh, cùng FT — [PHÁT HIỆN] · P1 · QL, QT
- Vấn đề: Tổng quan Monbay FT "SOS 14" (SOS 1: 6 · 2: 5 · 3: 3), MB FT 101 = 8, MB FT 105 = 5. Học viên & Lớp "Đang SOS 9" (FT), MB FT 101 = 7, MB FT 105 = **1**. Báo cáo "2/3/0" (ảnh 9 chủ SP, chưa tự kiểm).
- Bằng chứng: API `tong-quan/ql?branchId=1&chuongTrinh=ft` (sos 14, MB FT 105 sos 5); `demsos.mjs` (9 em FT; MB FT 105: 1 em); `hvl-tatca-ft` "Đang SOS 9".
- Nguyên nhân: định nghĩa khác: Đang SOS = lượt SOS trong 8 tuần (27/07–14/09), kể cả Case đã Xong; Tổng quan = SOS hiện tại theo lượt gần nhất.
- Ảnh hưởng: QL không tin số; giao ban hỏi "14 hay 9?". Trái CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính".
- Phương án: một hàm SOS dùng chung; nếu cần hai nghĩa thì hai tên khác hẳn ("SOS hiện tại" · "Có SOS trong 8 tuần") và ghi ngay cạnh số. Câu hỏi chủ SP (Phần 4).

### A3-09 Đang SOS: bảng 9 cột chữ cắt "…", hai bảng FT / lớp thường, cột đổi theo chế độ tuần — [XÁC NHẬN-ẢNH] · P1 · QL, GVCN
- Vấn đề: cột Phương án / Việc tiếp cắt "Tự học Reading: hai bài Mat…", "Chờ Quản lý duyệt · không the…"; FT và lớp thường hai thẻ bảng, tiêu đề "SOS" / "SOS · môn"; chế độ một tuần mất cột "MT · tuần" (MT xuống dưới chip); cột "MT · tuần" lớp thường gãy 2 dòng ("Progress · W2 / SEP").
- Bằng chứng: `hvl-sos-p1` (= ảnh 8), `hvl-sos-tuan-p1`. Mã `BangSos.tsx:55` (`truncate`), `:192–197` (9 cột, rộng cố định), `:200–230` (mỗi khung một `section`).
- Nguyên nhân: thiết kế mockup 1 (9 cột) giữ nguyên; mockup 6 khung 1 đã vẽ bảng gọn 6 cột nhưng kế hoạch OV-15 không chép phần cột.
- Phương án: theo mockup 6 khung 1: Học viên · Lớp · MT · tuần · SOS · Kỹ năng cần xử lý · Case / PA (một chip trạng thái); một bảng chung FT + lớp thường; Nguyên nhân / PA / Kết quả trong Panel một em ("Mở"). Rule: "Essential Text Truncation" (Critical), `truncation-strategy`.
- Lệch mockup: OV-14-6 khung 1 (`mk-m14-6-m1-p1`) — không ghi lý do lệch trong plan.md / mô tả PR.

### A3-10 Chip SOS 4 dáng; W1 / W2 tách thành hai môn — [PHÁT HIỆN] · P2 · mọi vai
- Vấn đề: (1) chip viền chuẩn `ChipSos`; (2) "● Đã đủ điểm · SOS 3" nền hồng ở bốn ô và bảng Mock Test hồ sơ HV (`shared/domain/display.ts:215`); (3) chip vàng "MT1 · 5.5" + chữ "SOS 3" ở "Các lộ trình"; (4) hồ sơ lớp chip "SOS 1" không kỹ năng, Học viên & Lớp "SOS 1 · S". Đang SOS ghi kỹ năng "R, W1, W2", "W1, S" (`BangSos.tsx:86–87` `skillShort`).
- Bằng chứng: `hv-sos3-hocthuat-p1`, `hv-sos3-hanhtrinh-p1`, `lop-ft-tonghop-p1`, `hvl2-sos-p2-p1` (Trịnh Bảo Ngọc, Đoàn Minh Khang).
- Nguyên nhân: triển khai (OV-15a mục 2 "chip SOS MỘT component" chưa phủ chip trạng thái lượt).
- Phương án: một chip SOS ở mọi chỗ (kèm kỹ năng, W gộp); trạng thái lượt ("Đã đủ điểm") là chữ xám riêng.
- Lệch mockup: OV-14-1 mục 1b "Một dáng chip mọi màn… W1 / W2 không tách thành môn".

### A3-11 Hộp "Vì sao SOS" hai nội dung, không có việc để làm — [PHÁT HIỆN] · P2 · mọi vai
- Vấn đề: ở Tất cả: số liệu (Kỳ vọng MT3 7.0 · S 5.0), không link; ở Đang SOS: câu luật "SOS 1 = 1 kỹ năng…", không số, không link.
- Bằng chứng: `hvl2-mo101-chip`, `hvl-sos-chip`. Mockup `mk-m14-6-m1-p1`: tiêu đề → kết luận → số từng kỹ năng → "Mở hồ sơ MT3 ›".
- Phương án: một nội dung theo mockup 6 cho mọi nơi.

### A3-12 375: điều khiển chiếm nửa màn đầu, thẻ em quá dài — [PHÁT HIỆN] · P2 · GV điện thoại
- Vấn đề: thẻ lớp đầu tiên ở y ≈ 600 px, em đầu tiên ≈ 740 px (Tất cả); Đang SOS thẻ lớp đầu ≈ 740 px. Thẻ em ~330 px, 8 nhãn (Kết quả, Điểm, Target, Dự kiến thi, Sắp tới, Case, Việc tiếp…). Trang Học viên & Lớp mở một lớp 10.830 px; hồ sơ lớp 10.382 px. Ô chọn cắt chữ: "Loại lớp: Tất cả" (mất hẳn số 20), "Loại lớp: Fast Tra…"; "W5 JUL–W3 SEP" và nhãn "Tuần thi" xuống 2 dòng; nút "Lịch thi" xuống dòng một mình.
- Bằng chứng: `hvl2-375-tatca-p1/p2`, `hvl2-375-sos-p1`, `lop-ft-375-p1`.
- Phương án: thẻ em 2 dòng như mockup 1 khung 375 (tên + chip SOS / Đã thi; một dòng việc tiếp); gom Phạm vi + Chi nhánh + Loại lớp + Xếp vào một nút "Bộ lọc"; góc nhìn một hàng cuộn ngang. Rule: `content-priority`, `touch-density`.

### A3-13 Không lọc được mức SOS và Lớp; Đang SOS không chọn được em để xuất — [PHÁT HIỆN] · P2 · QL, TVV
- Vấn đề: muốn xuất riêng em SOS 3 thì không làm được trong app (không có chip "Có SOS · SOS 1 · 2 · 3", không có ô tích ở Đang SOS). Bộ lọc thêm có Case / PA · kỹ năng · kết quả · tuần thi nhưng không có SOS.
- Bằng chứng: `hvl-locthem-p1`, `shared/domain/locThem.ts:11–20`. Mockup `mk-m14-5-q2-p1`: "SOS: Có SOS · SOS 1 · SOS 2 · SOS 3 · Cơ sở · Lớp" ở hàng lọc chính, "Bộ lọc thêm" cho phần còn lại.
- Phương án: thêm chip mức SOS (và Lớp) như mockup 5; Đang SOS có ô tích + "Xuất các HV đã chọn".

### A3-14 Nhập điểm mở lượt MT3 (đa số tuần chưa tới) thay vì lượt đang quá hạn — [PHÁT HIỆN] · P2 · GVCN, GV
- Vấn đề: panel Nhập điểm (nút hồ sơ lớp, ⋯ hàng lớp) mở MT3 "3/32 đủ điểm", đa số hàng là em có lịch MT3 từ W4 SEP tới W4 DEC (tuần chưa tới), không có ô nhập; MT1 còn ô quá hạn 68 ngày phải tự chọn; "Chỉ ô còn trống" không bật. Chip "MT3 còn 35 ô trống" đếm cả ô của tuần chưa tới.
- Bằng chứng: `hvl-nhapdiem`, `wf-gvcn-nhapdiem`, `lop-ft-tonghop-p3`. Mã `shared/domain/diemTheoLuot.ts:41–52` (`luotMacDinh` lấy lượt gần nhất đã tới tuần).
- Phương án: mở lượt có ô quá hạn sớm nhất, bật sẵn "Chỉ ô còn trống"; chip đếm ô đã tới hạn ("MT1 · 4 ô quá hạn").

### A3-15 Ý thức lớp: ~45 vi phạm phẳng, phần lớn đã xử lý; "Quá hạn" thành chip nền — [XÁC NHẬN-ẢNH] · P2 · GVCN, QL
- Vấn đề: cột phải "Vi phạm của lớp" liệt kê từ 22/06 tới nay, đa số "Đã xử lý · Report 1"; không gom theo em, không ẩn việc xong. Chip "Quá hạn 1 ngày" nền cam trong danh sách, cột trái lại dùng chữ "⚠ quá hạn 6 ngày". Tiêu đề nhóm in hoa ("QUÁ HẠN · 2").
- Bằng chứng: `lop-ft-ythuc-p1..p3` (= ảnh 5); trang 5.431 px.
- Phương án: mặc định chỉ vi phạm chưa xong, gom theo em (một dòng em + số vi phạm 2 tuần + bậc kế tiếp); "Đã xử lý" gập "Xem n vi phạm đã xử lý". Quá hạn chỉ chữ + ⚠.
- Lệch mockup: OV-14-1 mục 1c "quá hạn chỉ là chữ cam + ⚠, không chip"; 1e "đầu cột không in hoa".

### A3-16 Đơn vị đếm lẫn lộn trên cùng màn — [PHÁT HIỆN] · P2 · QL, GV
- Vấn đề: chip "Quá hạn 40 việc" cạnh "Chờ duyệt 8" và "Thiếu thông tin 47" (hai chip sau là số HV); "Đang xem: 73 học viên" nhưng phân trang "1–10 / 181 việc"; Tất cả phân trang theo lớp, Đang SOS theo lượt, Cần làm theo việc, Lịch thi theo HV. Bật Bộ lọc thêm thì chính nút góc đổi thành "Tất cả 7".
- Bằng chứng: `hvl-canlam-p1`, `wf-ql-locthem-trongpa-p1`. Mã `StudentsPage.tsx:420`, `:275`.
- Phương án: chip luôn đếm HV (việc ghi trong bảng); một đơn vị phân trang theo HV; nút góc giữ số gốc, số sau lọc nằm ở dòng "Đang xem".

### A3-17 Màu nghĩa chồng nhau — [PHÁT HIỆN] · P2 · mọi vai
- Vấn đề: xanh dương = nhấn / đang chọn = "✓ bằng kỳ vọng" = chip "Đang xử lý" = "Thi Final Test tuần này". Bảng Mock Test hồ sơ HV: 5.0 dưới kỳ vọng 6.0 vẫn màu xanh, không ✓/✗. Chip vàng nền cho "n HV chưa chốt lộ trình", "Ý thức · cần xử lý", "Chưa có điểm" (vàng = SOS 1 / sắp hạn). Thanh "Lộ trình tiếp theo … quá hạn 8 ngày" nền đỏ cam ở hồ sơ lớp thường.
- Bằng chứng: `hvl-sos-p1`, `hv-sos3-hocthuat-p2`, `hvl-tatca`, `lop-thuong-tonghop-p1`. Token `web/src/index.css:50` (`doing` = xanh).
- Phương án: đúng mockup 1 mục 1a: mọi trạng thái khác xám; vàng / cam / hồng chỉ cho SOS; hạn chỉ chữ + ⚠; xanh chỉ cho nhấn và ✓ bằng kỳ vọng. Rule: `color-semantic`, `color-not-decorative-only`.

### A3-18 Tất cả: không có nút "Mở" (Panel một em); bấm tên = đổi trang — [PHÁT HIỆN] · P2 · QL, GV
- Vấn đề (trả lời câu hỏi chủ SP "bấm tên em: panel hay sang hồ sơ?"): bấm tên luôn sang hồ sơ HV (đổi trang). Panel một em chỉ mở được ở Đang SOS / Cần làm (nút Mở) hoặc khi bấm việc Case ở cột Việc tiếp theo. ⋯ hàng em không có "Mở".
- Bằng chứng: `hvl2-mo101-menuem` (⋯ = + Ghi vi phạm · + Case · Sửa thông tin · Chuyển lớp…). Mockup 1 khung 3: "Hàng Lý Minh Châu = panel một em đang mở bên phải" ở góc Tất cả.
- Phương án: bấm hàng (trừ tên) hoặc nút "Mở" cuối hàng → Panel một em; tên giữ link hồ sơ ↗ (tách xem / làm như CLAUDE.md).

### A3-19 Sửa thông tin cả lớp: 4 cột hay thiếu nằm ngoài màn — [PHÁT HIỆN] · P2 · QL, GVCN, TVV
- Vấn đề: lưới có 12 cột; 4 cột liên hệ (SĐT em, Tên phụ huynh, Quan hệ, SĐT phụ huynh — thêm ở OV-10b) đứng trước Tuần bắt đầu · Dự kiến thi · Target · Điểm đầu vào → 4 cột này nằm ngoài khung 1440, phải cuộn ngang trong panel. Popover "Thiếu n" không có nút dẫn tới đây.
- Bằng chứng: `lop-ft-suathongtin`; mã `students/SuaCaLopPanel.tsx:28–35`. Mockup `mk-msua-s1` (05/10) để các cột học tập trong tầm nhìn.
- Phương án: đưa 4 cột học tập lên ngay sau Email (hoặc công tắc "Học tập · Liên hệ"); "Thiếu n" ở hàng lớp mở thẳng panel này, cuộn tới cột thiếu.

### A3-20 Lịch thi: 12 nút tháng, mặc định ra tháng rỗng, không lọc Lớp — [PHÁT HIỆN] · P2 · QL, TVV, GVCN
- Vấn đề: hàng 12 nút "08/2026 … 07/2027" (quyết định > 4 lựa chọn); tháng mặc định 10/2026 = 0 HV nên bảng chỉ còn "Chưa có dự kiến thi · 43 HV" (129 nút Kết luận + 43 ô ghi chú); mockup có ô "Lớp".
- Bằng chứng: `hvl-lichthi-p1`, `wf-tvv-lichthi-p1`. Mã `GocLichThi.tsx:107` (`cuaSoThang(homNay, 1, 10)`). Mockup `mk-m14-5-q1-p1` ("Tháng dự kiến thi 11/2026 ▾ · Chi nhánh · Lớp").
- Phương án: ô chọn tháng (nhiều tháng) như mockup; nhóm "Chưa có dự kiến thi" gập sẵn khi tháng đang chọn có HV; thêm ô Lớp.

### A3-21 Phân tích lớp: "6/11" không chú thích; MT4 / MT5 trống — [PHÁT HIỆN] · P3 · QL, GVCN
- Vấn đề: ô FT ghi "6/11" (nghĩa "số đạt / số có điểm" chỉ ở tooltip đầu cột "Kỹ năng"); lớp thường ghi "n/N HV đạt" — hai cách cho cùng phép đếm.
- Bằng chứng: `lop-ft-phantich-p1`; mã `classes/PhanTichLopTab.tsx:37–39`, `:60`.
- Phương án: một dòng chú thích dưới bảng "Mỗi ô: số em đạt / số em đã có điểm"; ẩn cột MT chưa ai thi.

### A3-22 Xuất Excel luôn qua panel (2 bấm) — [PHÁT HIỆN] · P3 · QL, TVV
- Vấn đề: mockup 5: một bấm xuất thẳng theo mẫu mặc định, mũi tên bên cạnh mới mở Tùy chọn; thực tế mọi lần đều mở panel rồi "Xuất n HV". Panel thiếu "Tên file"; dòng "Đang lọc: Đang SOS" không ghi "Toàn bộ 8 tuần".
- Bằng chứng: `hvl-xuat`, `hvl-xuat-sos`; mockup `mk-m14-5-q2-p2`.
- Phương án: nút chia đôi như mockup.

### A3-23 Ô trống và ✓ / ✗ mỗi bảng một kiểu — [PHÁT HIỆN] · P3 · mọi vai
- Vấn đề: hồ sơ lớp ô trống "–"; Học viên & Lớp để trống; Dự kiến thi "—"; Đợt "chưa có điểm"; lớp thường "Chưa có điểm" vàng 2 dòng. ✓/✗ sau số ở FT ("6.5 ×"), trước số ở lớp thường ("× 27/40"); W1 / W2 ở hồ sơ lớp không có ✓/✗.
- Bằng chứng: `lop-ft-tonghop-p1`, `lop-thuong-tonghop-p1`. Mockup 1 khung 4: ô trống để trống, ✓/✗ ở cả W1 · W2; plan OV-15b mục 6b.
- Phương án: một mẫu ô điểm (`DauKetQua`) cho mọi bảng, ô trống để trống.

### A3-24 Chọn nhiều hai kiểu khác nhau — [PHÁT HIỆN] · P3 · QL
- Vấn đề: Học viên & Lớp: ô tích luôn hiện, chỉ "Xuất các HV đã chọn". Hồ sơ lớp: phải bấm "Chọn nhiều học viên", có Lưu trữ / Kết thúc học / Huỷ chuyển lớp / Xoá, không có Xuất. Không có chuyển lớp nhiều em ở cả hai.
- Bằng chứng: `hvl2-mo101-chon`, `lop-ft-chonnhieu`.
- Phương án: một thanh chọn nhiều chung (cùng chỗ, cùng thứ tự: Xuất · Lưu trữ · Kết thúc · …).

### A3-25 Lớp gập mặc định; "Xếp: Cần chú ý trước" không thấy tác dụng — [PHÁT HIỆN] · P3 · QL, GVCN
- Vấn đề: không lọc thì không lớp nào mở (`shared/domain/hocVienLop.ts:430–434`, T17). Xếp chỉ xếp em trong lớp; lớp gập → đổi Xếp không thấy gì. GVCN 2 lớp FT vẫn phải bấm mở.
- Bằng chứng: `hvl-tatca`, `hvl-xepchuy`, `hvl2-gvcn7-p1`. Mockup 1 khung 3: "mặc định, MB FT 101 đang mở".
- Phương án: Xếp "Cần chú ý" xếp cả lớp (lớp có SOS 3 / quá hạn lên đầu) và tự mở lớp đầu; GV ≤ 3 lớp thì mở sẵn.

### A3-26 Trình đọc màn hình: mọi ⋯ cùng tên — [PHÁT HIỆN] · P3 · Sam
- Vấn đề: 33 nút ⋯ hàng em + nút ⋯ hàng lớp đều đọc "Thao tác khác".
- Bằng chứng: `BangHocVienLop.tsx:269` (`<MenuDong muc={menuDong(s)} />` không có `nhan`), `StudentsPage.tsx:721`.
- Phương án: `nhan = "Thao tác · {tên em}"` / "Thao tác · lớp {mã}". Rule: `aria-labels` / WCAG 2.4.6.

### A3-27 TVV / CX: trang riêng, từ khác — [PHÁT HIỆN] · P3 · TVV, CX
- Vấn đề: "Thiếu thông tin" (chữ) thay "Thiếu 2"; góc "Cần chú ý" (CX) / TVV có cả "Cần làm" lẫn "Cần chú ý"; TVV 8 nút lọc một hàng; CX một hàng hai chip SOS (cột Kết quả + cột Cần chú ý); cột Phụ huynh "chưa có" ở mọi dòng demo.
- Bằng chứng: `hvl2-tvv23-p1`, `hvl2-cx24-p1`.
- Phương án: cùng thành phần với QL (một bảng, cột theo vai); "Cần chú ý" và "Cần làm" thành một tên.

### A3-28 Cần hỗ trợ: tiêu đề cột tách khỏi bảng, "quá hạn" lặp — [PHÁT HIỆN] · P3 · GVCN
- Vấn đề: dòng tiêu đề cột (in hoa) nằm trên thanh phân trang; "⚠ Quá hạn" ở cột Case và "⚠ quá hạn 2 ngày" ở cột Việc tiếp cùng hàng; nội dung trùng Đang SOS và bảng kỹ năng hồ sơ HV (3 cách xem cùng Case / PA).
- Bằng chứng: `lop-ft-canhotro-p1`.

### A3-29 Chữ việc lặp tên em; "Người giữ —" không nói rõ — [PHÁT HIỆN] · P3 · QL, GV
- Vấn đề: dòng Đỗ Minh Khôi ghi việc "Ghi nhận xét Writing Task 2 · MT2 · Đỗ Minh Khôi"; "Xử lý vi phạm · Quách Thành Nam (3) · …". Việc Nhập điểm Speaking "Người giữ —" (chưa ai nhận) không ghi "Chưa có người chấm".
- Bằng chứng: `hvl2-gv10-canlam-p1`, `hvl2-canlam-50-p1`.

### A3-30 GV thấy chip không phải việc mình — [PHÁT HIỆN] · P3 · GV, GVCN
- Vấn đề: GV Linh thấy lọc phụ "Chờ duyệt 6", "Thiếu thông tin 39"; GVCN thấy chip "2 HV cần xếp lớp tiếp" (việc của QL).
- Bằng chứng: `hvl2-gv10-canlam-p1`, `hvl2-gvcn7-p1`. Mã `StudentsPage.tsx:247`, `hocVienLop.ts:345–349`.
- Phương án: chỉ hiện lọc / chip mà vai đó làm được (CLAUDE.md "giao diện theo vai").

### A3-31 Tạo lớp mới không lấy sẵn chi nhánh đang xem — [PHÁT HIỆN] · P3 · QL, QT
- Bằng chứng: `hvl-lop-moi` ("— Chọn chi nhánh —" khi trang đang lọc Monbay).
- Phương án: mặc định chi nhánh của trang (CLAUDE.md "mặc định làm điều hiển nhiên").

### A3-32 Định dạng tên Case dạng chuỗi thô — [PHÁT HIỆN] · P3 · mọi vai
- Vấn đề: "[MT1] Reading không đạt [SOS 3]", "[Progress Test] L không đạt [SOS 3]" ở thẻ Chờ duyệt và bảng kỹ năng lớp thường; FT dùng chip "MT1" + chip SOS.
- Bằng chứng: `hv-sos3-hocthuat-p1` (khối Chờ duyệt), `hv-thuong-p1`.

---

## Phần 3. Đề xuất lớn (tái cấu trúc khu vực)

### Đ1. Học viên & Lớp còn 3 góc, hàng lớp tóm tắt, hàng em một dòng
- Hiện trạng: 4 góc (Tất cả · Đang SOS · Cần làm · Lịch thi); hàng lớp 2 chip + "+n"; hàng em 2–4 dòng, 12 cột, "Thiếu n" mọi em; Cần làm = Công việc.
- Đề xuất: bỏ góc **Cần làm** (A3-03). Hàng lớp làm đúng mockup 1 khung 3: số em · SOS 1/2/3 · Đã thi n · Case · ⚠ quá hạn · chờ duyệt (không "+n"); bấm số → panel danh sách tại chỗ. Hàng em: Học viên (+ chip SOS kèm kỹ năng) · OVR L R W S (✓/✗) · Target · Sắp tới (gộp Dự kiến thi) · Việc tiếp (1 việc + "+n") · Mở · ⋯. "Thiếu" thành số ở hàng lớp + lọc. Xếp "Cần chú ý" xếp cả lớp.
- Bước (Chị Vy biết lớp nào có SOS 3 / quá hạn): trước 1 bấm sang Đang SOS + lật 3 trang, hoặc mở 6 lớp FT (6 bấm) → sau **0 bấm** (đọc hàng lớp).
- Rủi ro: GV quen góc Cần làm để nhập điểm nhanh → Công việc đã là trang chính của GV (mockup 2 OV-14); giữ lối "⚠ n quá hạn" của lớp mở panel việc.
- Chủ SP quyết: bỏ Cần làm? "Thiếu" tính trường nào, hiện cho ai?

### Đ2. Đang SOS theo mockup 6 khung 1
- Hiện trạng: 9 cột chữ cắt, hai bảng, phân trang cắt lớp, SOS 3 ở trang 2, không lọc mức SOS / trạng thái PA.
- Đề xuất: một bảng 6 cột (Học viên · Lớp · MT · tuần · SOS · Kỹ năng cần xử lý · Case / PA một chip); hàng lọc: SOS 3 · 2 · 1 + Trống PA · Chờ nhận xét · PA chờ xác nhận · PA đang chạy; mặc định SOS 3 trước; ô tích + Xuất; chi tiết ở Panel một em.
- Bước — QL tìm em SOS chưa có PA rồi xử lý: trước Đang SOS (1) + dò 22 dòng × 9 cột, lật trang (1–2) + Mở (1) + Thêm PA (1) + điền / Lưu (2–4) ≈ **6–9 bấm, dò 3 trang** → sau Đang SOS (1) + "Trống PA" (1) + Mở (1) + Thêm PA / Lưu (2) ≈ **5 bấm, 0 dò**.
- Bước — xuất danh sách em SOS 3: trước **không làm được trong app** (chỉ xuất cả 22) → sau SOS 3 (1) + Xuất (1–2) = **2–3 bấm**.
- Rủi ro: mất cột Nguyên nhân / Phương án trên bảng (đọc nhanh nhiều em) → bù bằng Panel một em và hộp "Vì sao SOS".
- Chủ SP quyết: dùng bảng 6 cột mockup 6 (planning chưa chép vào kế hoạch); "Đang SOS" = SOS hiện tại hay "có SOS trong 8 tuần" (một định nghĩa cho Tổng quan · Học viên & Lớp · Báo cáo).

### Đ3. Hồ sơ lớp gọn: mỗi tab chỉ nội dung tab, mọi chip mở tại chỗ
- Hiện trạng: lưới điểm dưới mọi tab (+2.200 px), Ý thức 45 dòng phẳng, chip đầu trang dẫn sang 3 trang khác, Nhập điểm mở MT3.
- Đề xuất: bỏ khối "Điểm Mock Test của lớp" cuối trang (A3-01); Nhập điểm mở lượt quá hạn sớm nhất + "Chỉ ô còn trống"; chip "n chờ duyệt" → hộp Chờ duyệt lọc lớp tại chỗ, "bài chờ chấm" → Nhập điểm panel, "⚠ quá hạn" luôn hiện → panel việc của lớp; Ý thức mặc định chỉ việc chưa xong, gom theo em.
- Ước chiều cao 1440: Tổng hợp 4.800 → ~2.600 px; Phân tích 3.012 → ~800; Ý thức 5.431 → ~1.800; 375 10.382 → ~6.800.
- Bước — GVCN xem lớp và nhập điểm còn thiếu: trước bấm lớp (đổi trang) + Nhập điểm (1) + chọn MT1 (1) + "Chỉ ô còn trống" (1) = **4 bấm, 1 đổi trang, phải nhớ MT nào quá hạn** (hoặc bấm "Nhập điểm L, R · MT1" → sang Test) → sau bấm lớp + Nhập điểm (hoặc chip "⚠ quá hạn") = **2 bấm, 0 nhớ**.
- Rủi ro: ai quen đọc lưới ở cuối trang → thêm cách xem "Điểm MT" trong tab Học viên nếu chủ SP cần.

### Đ4. Một mẫu cho chip SOS, ô điểm, ô trống, trạng thái
- Một `ChipSos` mọi nơi (kể cả bốn ô / Các lộ trình / Hành trình), W gộp; một `DauKetQua` cho mọi bảng điểm (✓/✗ sau số, W1 / W2 có dấu); ô trống để trống; mọi trạng thái không phải SOS / hạn đều xám (bỏ xanh "Đang xử lý", vàng "chưa chốt lộ trình", nền "Quá hạn").
- Nâng H4 từ 1 lên 3; không đổi luật, không cần mockup mới (đã có ở mockup 1 mục 1a–1e).

### Bốn workflow còn lại (đếm trên demo)
| Việc | Trước | Đánh giá |
|---|---|---|
| TVV tra lịch thi thật tháng tới, chốt ngày | Lịch thi (1) → tháng sau mặc định → Chốt ngày (1) → chọn ngày (1–2), tự lưu: **3–4 bấm, 0 đổi trang** | Tốt — giữ. Chỉ sửa A3-20. |
| QL chuyển lớp một em | gõ tên (1) → ⋯ (1) → Chuyển lớp… (1) → chọn lớp (2) → lý do (1) → Quyết định (1): **7, 0 đổi trang** (từ hồ sơ HV: 6) | Tốt. Hàng nút tuần "Ngay hôm nay T2 14/09 · W4 SEP · W1 OCT…" xem câu hỏi 6. |
| QL thêm học viên mới vào lớp | + Học viên (1) → chọn lớp (2) → tên, email (2–3) → Thêm (1): **6–7**; từ ⋯ hàng lớp lớp có sẵn: 5–6 | Đạt. Panel toàn màn cho 1 em hơi nặng, nhưng có dán Excel. |
| Xuất danh sách em SOS | Đang SOS (1) → Xuất (1) → Xuất n HV (1): **3**; riêng SOS 3: không làm được | Xem Đ2. |

### Đường lên ≥ 35 cho khu vực
Đ1 + Đ2 + Đ3 + Đ4 + A3-12 (375) + A3-07 (một luật panel tại chỗ): H1 2→4 (số đúng, đếm toàn bộ, quá hạn luôn hiện) · H2 2→3 · H3 3→4 (về đúng nguồn) · H4 1→3 · H6 2→4 · H7 3→4 (lọc mức SOS, chọn + xuất, mở panel từ hàng) · H8 1→3 · H10 3→4 (hộp SOS có việc, Thiếu có nút sửa) → **35/40** (H5, H9 giữ 3). Không cần đổi luật nghiệp vụ, trừ câu hỏi 2 và 4 (Phần 4).

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

### Câu hỏi (mỗi câu một khuyến nghị)
1. **Bỏ góc "Cần làm" ở Học viên & Lớp** (việc đã ở Công việc; QL hiện thấy Cần làm = Tất cả)? Khuyến nghị: bỏ; giữ chip "⚠ n quá hạn" ở hàng lớp mở panel việc của lớp.
2. **"Thiếu thông tin" tính những trường nào?** Hiện tính Ngày sinh, Email, Tuần bắt đầu, Tháng dự kiến thi, Target, Điểm đầu vào, Mốc đánh giá tiếp theo → 46/51 em FT Monbay. Điểm đầu vào được phép trống theo thiết kế dữ liệu. Khuyến nghị: chỉ Target, Tuần bắt đầu, Email; không gắn nhãn ở từng em, chỉ số ở hàng lớp + lọc.
3. **Đang SOS dùng bảng 6 cột của mockup 6 khung 1** (Học viên · Lớp · MT · tuần · SOS · Kỹ năng cần xử lý · Case / PA)? Kế hoạch OV-15 chưa chép phần cột này. Khuyến nghị: dùng.
4. **"Đang SOS" nghĩa là gì?** Hiện = em có lượt SOS trong 8 tuần (kể cả Case đã xong) → MB FT 105: 1 em; Tổng quan "SOS" = SOS hiện tại → 5 em. Khuyến nghị: một định nghĩa (SOS hiện tại) cho Tổng quan · Học viên & Lớp · Báo cáo; danh sách 8 tuần nằm ở Phân tích.
5. **Khối "Điểm Mock Test của lớp" cuối hồ sơ lớp** (duyệt 11/10 khi Nhập điểm còn sang trang khác): bỏ? Khuyến nghị: bỏ; lưới chỉ ở panel Nhập điểm.
6. **Chuyển lớp**: hàng nút "Ngay hôm nay T2 14/09 · W4 SEP · W1 OCT · W2 OCT · Chọn tuần" (mockup 13b, 15/10) trái luật 06/10 "không làm hàng nút ngày" và có chữ thứ ("T2"). Giữ hay đổi sang `ONgay` kiểu tuần?
7. **Thứ tự chip hàng lớp của QL**: giữ "chờ duyệt trước" (B4) hay "quá hạn luôn hiện đầu, không +n" như mockup 1? Khuyến nghị: quá hạn luôn hiện.

### Ảnh cần thêm (bản chính, dữ liệu thật) — [CẦN ẢNH]
- Học viên & Lớp › Tất cả, vai QL chi nhánh đông nhất, mở lớp FT đông nhất, chụp toàn trang; bấm "Thiếu n" của 3 em → để đo tỉ lệ em có "Thiếu" và mục thiếu nào nhiều nhất trên dữ liệu thật.
- Học viên & Lớp › Đang SOS (mặc định Toàn bộ), cùng chi nhánh: chụp trang 1 và trang 2 → kiểm có em SOS 3 ở trang 1 không, đầu nhóm lớp ghi mấy em ở mỗi trang.
- Tổng quan (ô SOS / Lớp cần chú ý) và Học viên & Lớp › Đang SOS, cùng chi nhánh, cùng Fast Track, chụp cùng lúc → so số SOS.
- Điện thoại thật của một GV: Học viên & Lớp mở một lớp; hồ sơ lớp cuộn tới cuối → đếm số lần vuốt.
- Hồ sơ lớp có em "Đã thi · chờ KQ" (demo Monbay không có) → kiểm hàng tô xanh + chip ở bảng lớp và bảng hồ sơ lớp.

---

## Phần 5. Ảnh tiêu biểu (cho tài liệu chung)
1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl2-mo101-p1.png` — hàng em 2–4 dòng, "Thiếu n" mọi em, thông tin lặp (A3-04, A3-06).
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl-plus1.png` — "+1" giấu "⚠ 22 việc quá hạn" (A3-05).
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl-sos-p1.png` — Đang SOS trang 1: hai bảng, chữ cắt, MB FT 101 "2 em" (A3-02, A3-09).
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl2-sos-p2-p1.png` — trang 2: MB FT 101 lại "4 em", SOS 3 ở đây, "R, W1, W2" (A3-02, A3-10).
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl2-canlam-50-p1.png` — Cần làm 51 = Tất cả 51, Thiếu thông tin 46 (A3-03).
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\lop-ft-tonghop-p3.png` — bảng 33 em hết, lưới 33 em bắt đầu (A3-01).
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\lop-ft-phantich-p1.png` — tab Phân tích chỉ ~230 px nội dung + lưới điểm bên dưới (A3-01, A3-21).
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\lop-ft-ythuc-p3.png` — Ý thức danh sách phẳng "Đã xử lý" + lưới điểm (A3-15).
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\lop-ft-choduyet.png` — chip "8 chờ duyệt" → sang Công việc, link lui "‹ Công việc" (A3-07).
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\hvl2-375-tatca-p1.png` — 375: điều khiển chiếm nửa màn, thẻ em dài (A3-12).
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\mk-m14-6-m1-p1.png` — mockup 6 khung 1: Đang SOS 6 cột + hộp "Vì sao SOS" có "Mở hồ sơ MT3 ›" (A3-09, A3-11).
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a3\mk-m14-1-s3-p1.png` — mockup 1 khung 3: hàng lớp tóm tắt SOS / Đã thi / Case / quá hạn theo cột (A3-05).

Ảnh 1–10 là bản chụp lại với phông đúng (trừ `hvl-plus1`, `lop-ft-choduyet`: không phụ thuộc phông).
