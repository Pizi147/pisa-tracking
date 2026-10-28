# Critique B — Test · Hồ sơ lượt · Phân tích · Quản trị (29/10, chỉ đọc)

Ảnh: thư mục này, `<màn>-<rộng>.png` (cặp), `-mock.png`, `-web.png`. Máy chủ 5310, dữ liệu demo 14/09/2026.
Điểm Nielsen 0–4 × 10 (H1 trạng thái · H2 khớp đời thực · H3 kiểm soát · H4 nhất quán · H5 phòng lỗi · H6 nhận ra · H7 linh hoạt · H8 tối giản · H9 sửa lỗi · H10 trợ giúp).

## Bảng điểm

| Màn | Vai | /40 | 3 vấn đề lớn nhất |
|---|---|---|---|
| Test › Lịch Test tuần | QL 2 | 28 | ô trống viền đứt khắp lưới · "vắng W2 SEP" lặp 5 lần/dòng, 375 xuống dòng · tên HV xanh link (375) |
| Test › Kế hoạch Test | QL 2 | 31 | 375 dòng tóm tắt lớp xuống dòng lẻ chữ "lại" · "vào muộn" lặp gần mọi dòng · 1440 khoảng trống phải ~560 px khi lớp ít MT |
| Test › Chấm Test | GVCN 7 | 28 | tab "11 nhóm" ≠ danh sách "11 việc" · khu phải thêm "— VIỆC" + tiêu đề lồng, không có dòng trạng thái lưu ở chân · tên HV xanh link |
| Test › Chấm Test | GVBM 9 | 27 | "chấm chéo · không tính nợ" lặp 6 dòng (nhóm đã nói) · 375 tên kỹ năng đầy đủ làm tiêu đề xuống 2 dòng · ô "/ tổng" trông như ô nhập |
| Hồ sơ lượt Test | QL 2 | 29 | 375 ô điểm Speaking lệch cột (dòng "GV chấm…" kéo rộng) · bảng: cột Trạng thái quá rộng, Nhận xét bị đẩy · chọn MT là select rộng 230 px thay chip gọn |
| Phân tích › Báo cáo HV | QL 2 | 28 | "W1 SEP – W2 SEP" lặp ở 4/5 ô chỉ số · công tắc FT/Lớp thường 12 px, thấp 26 px cạnh ô 38 px · ô "0" vẫn gạch chân đỏ (bấm được) |
| Phân tích › Phân tích GV | QL 2 | 30 | đơn vị "lượt Test / bài Test" lặp mọi ô · hai kiểu gạch chân (chấm vs liền) · đầu nhóm HỌC THUẬT tô nền hồng (mockup chỉ vạch) |
| Phân tích › Test + SOS | QL 2 | 26 | thẻ có dải đầu trống (Card không title) · gần mọi số đều gạch chân · tiêu đề "Thiếu điểm" xuống dòng |
| Phân tích › Kết quả Test | QL 2 | 27 | cột "MT · tuần" và "Việc tiếp" xanh mọi dòng + cắt "…" · phân trang lặp trên + dưới · tên tab "Kết quả Test" chứa tab con "Thi thật" (luật Thi ≠ Test) |
| Phân tích › Hiệu quả PA | QL 2 | 27 | bảng có tiêu đề cột nhưng mọi dòng gập · dòng gập chữ đậm 15 to hơn tiêu đề khối · chân "Để số liệu đủ tin" ba số 0 |
| Phân tích › Ý thức | QL 2 | 28 | tên HV xanh link (tab khác trắng) · cột "Lần xử lý gần nhất" "—" + dòng phụ lệch · ba kiểu nhãn trạng thái (chữ đỏ ⚠ / pill vàng / pill xám) |
| Quản trị › Tài khoản | QT 1 | 27 | 375 "Tài khoản (32)" vỡ 3 dòng cạnh nút · kỹ năng ghi đủ "Listening, Reading, Writing Task 1…" (nơi khác L · R · W1) · 3 chip lọc đều "0" |
| Quản trị › Bảng quy đổi | QT 1 | 32 | số căn giữa (mockup: Số câu trái, band phải) · link IDP trong "Áp dụng" không phải link · dòng cao 32 (mockup 30) |

## Lỗi theo màn (mức · mô tả · sửa)

### Lịch Test tuần (mockup v5 test.html tab lịch; web theo cấu trúc v7 lich-test-phan-cap A2 — CHỜ duyệt)
- P2 [BỐ CỤC] Web đã là bảng tầng (KPI 3 ô, nhóm Quá hạn / tuần này, lưới nhúng) — khác hẳn khung v5 đã duyệt (bảng 1 dòng/lượt). Cần chủ SP duyệt v7 A2 rồi chấm lại; tới lúc đó không tính "lệch".
- P2 Ô điểm trống viền đứt (dashed) ở mọi ô chưa nhập → lưới rối, giống "chỗ chờ". Mockup: ô nhập viền liền `--vien`. Sửa `web/src/ui/ODiem.tsx:58` bỏ `border-dashed` khi `so === null` (giữ viền liền, chữ trong suốt). Áp cả Chấm Test, panel Công việc.
- P2 "vắng W2 SEP" lặp dưới từng ô (5 lần/dòng Hồ Ngọc Diệp), 375 vỡ 2 dòng ("vắng / W2 SEP"). Sửa `web/src/modules/fasttrack/HopNhapDiem.tsx:153`: khi mọi môn cùng dời → một dòng ở cột Học viên; 375 giữ `whitespace-nowrap` ở thẻ (đang mất).
- P3 375: "Xem dạng bảng" và "GV chấm S: …" hai hàng riêng, khoảng trắng ~40 px mỗi hàng → gộp một hàng.
- P3 375: tên HV dùng `.link` (xanh) → `ten-ho-so` (trắng 600, rê mới xanh), như 1440.
- P3 Chip kỹ năng ở dòng lớp: có lớp chip có nền (MB FT 102), có lớp chữ trơn (MB FT 101 "L R W S") — một kiểu.

### Kế hoạch Test (mockup v7 ke-hoach-test.html — khớp tốt)
- P3 375: tóm tắt lớp "… · 4 em cần xếp lại" xuống dòng lẻ chữ "lại" → `text-wrap: pretty` / cắt `truncate` + title (`web/src/modules/test/keHoach/LuoiKeHoach.tsx`, dòng đầu lớp).
- P3 "vào muộn" lặp dưới gần mọi tên (dữ liệu thật, nhưng là dòng phụ lặp) → chỉ hiện khi khác số đông, hoặc ghi một lần ở đầu lớp ("15 em vào muộn").
- P3 "Hiện tất cả 33" / "+ Ghi chú lớp" chữ trắng; mockup là link accent → lớp `link`.
- (Không chấm 3 [XM]: màu "Xếp nhiều MT…", dáng công tắc, nút Xoá hộp kỹ năng.)

### Chấm Test (mockup v5 test.html tab chấm)
- P1 Một khái niệm hai tên: tab "Chấm Test 11 **nhóm**" nhưng danh sách "Của tôi: 11 **việc**". Sửa `web/src/modules/test/TestPage.tsx:48` `donVi: t('nhóm')` → `t('việc')` (hoặc ngược lại cả hai; mockup dùng "nhóm").
- P2 Khu phải là panel Công việc nhúng: kicker "— VIỆC", tiêu đề "Nhập điểm · W1 JUL", rồi dòng gập "MB FT 101 MT1…" — 3 tầng trước bảng; mockup 1 tầng "L,R MB FOU 12 · Final" + dòng ngữ cảnh. Sửa `web/src/ui/KhuonViec.tsx:63` cho phép bỏ `loai` khi nhúng trong tab Chấm (prop từ `ChamTestTab.tsx:151`); một lớp thì không vẽ dòng gập. [BỐ CỤC nhẹ]
- P2 Chân khu chấm chỉ có "Việc tiếp ›", không có trạng thái lưu (mockup: "Tự lưu khi rời ô · chưa có ô nào" / "✓ Đã lưu 10:42"). H1. Thêm câu trạng thái trái chân (`PanelViec`, chân `KhungPanel`).
- P2 Tên HV trong bảng xanh link: `web/src/modules/cham/LuoiFT.tsx:392`, `:536` `className="link …"` → `ten-ho-so khong-mui`.
- P2 (GVBM) "chấm chéo · không tính nợ" lặp mọi dòng của nhóm "Speaking chấm chéo" và làm dòng cao không đều (pill rơi xuống dòng 3). Sửa `web/src/modules/test/ChamTestTab.tsx:215` bỏ `<Nhan>`; câu đặt một lần ở đầu nhóm (như mockup "Bài bạn chưa nhận không tính là nợ").
- P2 375: tiêu đề dòng "MB FT 101 · Listening, Reading" xuống 2 dòng, "làm bài W3 / AUG" vỡ. Dùng mã ngắn như mockup ("L, R · MB FT 101 · MT1"): `ChamTestTab.tsx:204` `dich(w.reason)` → mã kỹ năng ngắn (`skillShort`).
- P3 (GVBM) Ô "/ tổng" viền như ô nhập, cạnh nhãn "Nhận xét" — khó đọc thứ tự; mockup "điểm /25". Ghi "/ —" chữ mờ không viền khi chưa có tổng.
- P3 375: thanh tab cắt "Kế hoạch" ở mép phải không có dấu cuộn → mờ dần mép (mask) hoặc rút "Lịch Test tuần" → "Lịch tuần" như mockup.

### Hồ sơ lượt Test (mockup v7 ho-so-luot-test.html A + A-375)
- P2 375: ô điểm Speaking lệch trái so với L/R (dòng phụ "GV chấm: Cô Lan (giám khảo ngoài)" làm khối rộng, ô `w-fit` dạt trái). Sửa `web/src/modules/fasttrack/ODiemLon.tsx:194` bọc `flex flex-col items-end` + dòng phụ `text-right`.
- P2 Hàng nhãn đầu trang xếp chồng nhãn trên / giá trị dưới (2 dòng); mockup một dòng "Lớp lúc Test **MB FT 101** · Lịch **W2 SEP** · Target **6.5**" → tiết kiệm ~25 px, đúng V-luật nhãn 13 xám + giá trị đậm cùng dòng (`MockDetailPage.tsx`, khối đầu dùng `LOP_NHAN`).
- P3 Chọn lượt là `<select>` rộng 230 px, cao 38; mockup chip gọn "MT2 · W2 SEP ▾" cạnh tên. Thu `w-auto` + `field-sm`.
- P3 Cột Trạng thái rộng ~280 px trong khi nội dung 90 px; Nhận xét bị đẩy sang phải. Đặt `w-[150px]` cho cột Trạng thái.
- P3 Nhãn "✓ Đã có điểm" là chip vuông viền (`Status` `ui/ui.tsx:190`), mockup pill chấm "● Đã có điểm" không viền. Áp chung → hỏi PTA (đổi `Status` ảnh hưởng mọi màn).
- P3 Nút quay lại là nút viền "‹ Hồ sơ Nguyễn Minh An"; mockup link chữ 13 "‹ Lịch Test W3 SEP". Giữ đích quay lại theo nguồn, đổi kiểu thành link.

### Phân tích (mockup v5 phan-tich.html — chỉ có tab HV + GV; 4 tab còn lại chấm theo luật)
- P2 Ô chỉ số: dòng kỳ "W1 SEP – W2 SEP" lặp ở 4/5 ô, trùng bộ lọc ngay trên. Mockup: "Đạt MT · trong kỳ" ngay sau tên. Sửa `web/src/modules/worklist/TongQuanV5.tsx:59` vẽ `ky` nối sau tên (`· {ky}` xám 13, cùng dòng) và `web/src/modules/phanTich/BaoCao.tsx:56` truyền `t('trong kỳ')` thay `kyChu(d.ky)`.
- P2 Công tắc Fast Track / Lớp thường chữ 12 px, cao 26 px, nằm cạnh ô 38 px → lệch hàng; mockup 15/600 cùng cao. Sửa `web/src/modules/worklist/ChonChuongTrinh.tsx:9` `px-3 py-1 text-xs` → `min-h-[38px] px-3 text-sm` (áp Phân tích + mọi nơi dùng). Ô "Mọi lớp" `PhanTich.tsx:107` `text-xs` → `text-sm`; "Xếp theo" `TongHopTestSos.tsx:232` cũng vậy.
- P2 Bảng Tiến bộ: ô "0" ở Giảm / Tăng vẫn gạch chân màu (bấm được, mở danh sách cả kỹ năng). Sửa `BaoCao.tsx:125` `giaTri={h.tong}` → `giaTri={so(h, c.key)}` (OSo tự vẽ số 0 xám không bấm).
- P2 Test + SOS: thẻ có dải đầu trống (Card không title, chỉ action) → khoảng trắng 70 px. Sửa `TongHopTestSos.tsx:226` đưa hàng "Xếp theo · chú giải" vào thân bảng (hàng công cụ) hoặc truyền `title`.
- P3 Phân tích GV: mọi ô có dòng phụ "x/y lượt Test" / "bài Test" — mockup chỉ "10/14". Sửa `PhanTichGiaoVien.tsx:90` bỏ đơn vị trong dòng phụ (đơn vị ở ⓘ tiêu đề cột).
- P3 Phân tích GV: "Chấm Test đúng hạn" gạch chấm, các cột khác gạch liền — một kiểu gạch cho số bấm được.
- P3 Kết quả Test: "MT · tuần" xanh mọi dòng + "Việc tiếp" xanh cắt "…": để chữ thường, link chỉ khi rê (luật "chữ › = đổi trang"). Phân trang lặp trên + dưới → giữ dưới.
- P3 Kết quả Test: tên tab "Kết quả Test" mà có tab con "Thi thật" — trái luật "Thi = thi thật, Test = MT…"; mockup "Kết quả thi". Hỏi PTA.
- P3 Ý thức: tên HV `.link` xanh (`YThucPhoiHop.tsx:114`) → `ten-ho-so khong-mui` như Kết quả Test.
- P3 375 Báo cáo HV: 3 hàng bộ lọc (công tắc · Toàn bộ/Chọn khoảng · 2 ô tuần) vs mockup 2; ô chỉ số thứ 5 lẻ một mình; Kết quả MT vẽ đủ 6 dòng "—" cho Thi thật / MT0 → ẩn lượt 0 HV ở 375.
- P3 Hiệu quả PA: tiêu đề cột hiện mà mọi dòng gập; dòng gập 15/700 to hơn nhóm. Mở sẵn khi ≤ 3 dòng.

### Quản trị (mockup v7 bang-quy-doi-band.html; tab Tài khoản không có mockup)
- P2 375: đầu thẻ "Tài khoản (32)" vỡ 3 dòng vì header `flex justify-between` không xuống dòng. Sửa `web/src/ui/ui.tsx:19` thêm `flex-wrap` và h2 `min-w-0` — áp mọi `Card` có action.
- P3 Kỹ năng ghi đủ "Listening, Reading, Writing Task 1, Writing Task 2" (dòng dài, 2 dòng) — nơi khác "L · R · W1". Sửa `web/src/modules/platform/AccountsAdmin.tsx:285` `skillLabel` → `skillShort`, nối " · ".
- P3 Ba chip "Chưa có vai trò 0 · Chưa có email 0 · Chưa có kỹ năng 0" luôn hiện dù 0 → ẩn chip = 0.
- P3 375 bảng chỉ còn Họ tên + Email, dòng cao không đều (cột ẩn vẫn chiếm chiều cao) → thẻ 375 hoặc `align-top` + ẩn hẳn ô.
- P3 Bảng quy đổi: số căn giữa; mockup "Số câu" trái, band phải (tabular) → `text-right` cho cột band, `text-left` Số câu.
- P3 Bảng quy đổi: URL IDP trong "Áp dụng" là chữ thường; mockup link gạch chân.

## Chung nhiều màn
- Gutter trang 20 px (mockup v5 44–64 px) — v7 (28/10, mới hơn) cũng ~22 px nên KHÔNG tính lỗi.
- Tab 14/600 khớp v7 (v5 là 15) — không tính lỗi.
- Màu ✓ "bằng kỳ vọng" xanh dương (`--kq-bang`) khớp token v7; mockup HSL tô xanh lá 6.0 = KV là lệch của mockup, không sửa web.
