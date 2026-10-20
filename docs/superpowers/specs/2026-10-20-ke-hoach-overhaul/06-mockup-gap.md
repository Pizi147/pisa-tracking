# 06 · Mockup-to-Implementation Gap Report — web lệch mockup bao nhiêu, vì sao, làm sao lần này bám (BẢN NHÁP · 21/10/2026)

> **Mục đích.** Trả lời MP I.4 + XVII.6: (1) từng màn có mockup đã duyệt **khớp bao nhiêu** với web, lệch ở đâu, lệch có lý do ghi lại không (mục 1); (2) **nguyên nhân gốc** (mục 2); (3) mockup nào phải **sửa / hết hiệu lực** sau quyết định vòng 1–4 và master prompt, mockup nào **phải vẽ mới** (mục 3, 4); (4) **quy trình kiểm soát** để đợt overhaul này bám thiết kế (mục 5).
> **Cách đọc.** Chủ SP: mục 0, cột "Khớp" + "Còn hiệu lực?" của mục 1, mục 5.1 (quy trình một trang). PTA Plan / session code: đủ mục 2–5. Hệ thiết kế dùng để vẽ mockup mới ở [`04-design-system.md`](04-design-system.md).
> **Trạng thái.** Chỉ đánh giá + kế hoạch — chưa sửa mã, chưa sửa mockup. Số % lấy từ đợt rà 20/10 (cùng phương pháp); dòng "[ƯỚC]" là PTA đếm lại từ số đo, chưa chấm bằng ảnh cặp.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · [`01-feedback-register.md`](01-feedback-register.md) · [`02-conflict-decision-log.md`](02-conflict-decision-log.md) · [`03-ux-ui-audit.md`](03-ux-ui-audit.md) · [`04-design-system.md`](04-design-system.md) · [`05-ia-workflow.md`](05-ia-workflow.md) · **06 (tệp này)** · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) (mục 3.1–3.3, 9.1) · phụ lục [`../2026-10-20-danh-gia-ux/a6-nguyen-nhan-lech-mockup.md`](../2026-10-20-danh-gia-ux/a6-nguyen-nhan-lech-mockup.md), [`v2b-bang-ho-so.md`](../2026-10-20-danh-gia-ux/v2b-bang-ho-so.md), [`v3a-test.md`](../2026-10-20-danh-gia-ux/v3a-test.md), [`v3b-phan-tich-tutor.md`](../2026-10-20-danh-gia-ux/v3b-phan-tich-tutor.md), [`v4a-cong-viec.md`](../2026-10-20-danh-gia-ux/v4a-cong-viec.md), [`v4b-nghiep-vu.md`](../2026-10-20-danh-gia-ux/v4b-nghiep-vu.md), [`v4c-vai-tro-phu-web.md`](../2026-10-20-danh-gia-ux/v4c-vai-tro-phu-web.md) · mockup [`../../../../thiet-ke/`](../../../../thiet-ke/).
> **Ký hiệu.** m1…m6 = `thiet-ke/mockup-ov14-{1..6}-*.html` (**m6 thắng m1–5** ở chỗ nó vẽ) · mT = `mockup-tutor-1-head-tutor-2026-10-19.html` · "ba khối" = `mockup-lich-test-ba-khoi-2026-10-06.html` · OV-13 = `mockup-ov13-2026-10-15.html` · "§n" = khung có số trong tệp · N1–N14 = nguyên nhân ở a6 (**đánh số theo a6**; tài liệu chính 3.2 đổi chỗ N3 ↔ N6) · Q1–Q13 = luật quy trình đề xuất ở tài liệu chính 3.3 · 9.1-n = 4 quyết định chủ SP 20/10 · Q-xx = câu PHẢI HỎI ở 02. Soạn: agent d2 (Opus 5.5) cho PTA Plan.

---

## 0. Tóm tắt (10 dòng)

1. Web khớp trung bình **~60 %** quyết định trong mockup đã duyệt; hai màn dùng nhiều nhất thấp nhất: **Tổng quan QL ~40 %**, **Hồ sơ lớp ~42 %**; **Báo cáo chỉ ~36 %**; Tutor ~88 % cấu trúc nhưng mở ra trang rỗng.
2. Phần lệch nằm ở lớp **nhìn thấy đầu tiên**: đầu trang, dải lọc, dáng khối, mật độ, vị trí ✓ / ✗, khối cũ còn sót. Chỗ kế hoạch trỏ đúng một khung thì khớp; chỗ kế hoạch chỉ ghi một chữ thì lệch.
3. **Đa số lệch không có lý do ghi lại** (chỉ 4 chỗ có: vị trí Báo cáo, đổi nhãn Lịch thi, dòng chấm chéo, "#469 chưa xác minh" — và cả 4 không được theo dõi tiếp).
4. **Nguyên nhân là quy trình, không phải model:** kế hoạch dịch khung thành chữ (N1), luật "sửa trên nền / bố cục đã khoá" (N2), chủ SP chỉ duyệt khung tĩnh (N3), không cổng "giống mockup" (N4), bỏ bước xem hình (N5), kế hoạch thắng mockup (N6), PR chia theo tệp (N7)… Đã bác "model yếu" (12/13 PR là Opus).
5. Vòng 2–4 thêm **10 gốc** (N15–N24): không có component bảng / ô điểm nên khung đúng mà nền không dựng được; phép kiểm đọc chuỗi khoá cách viết cũ; mockup vẽ mảnh nhỏ, không lộ mật độ thật (chính mockup 2 "Sau" và panel Báo cáo của m3 cũng dày / tràn); quyết định mới không quay về sửa mockup; không hệ trạng thái…
6. Sau vòng 1–4: **3 khung hết hiệu lực**, **~22 khung phải sửa** (thứ tự menu, thang chữ, đang chọn, căn cột điểm, ô lớp thường, Excel, Báo cáo, Lịch thi, Tutor…; 6 trong số đó còn chờ câu hỏi), **2 khung chỉ chờ câu hỏi** (ba khối Lịch Test — Q-C1; vai TVV — Q-A3). Câu chặn mockup: Q-A1, Q-A2, Q-A3, Q-A4, Q-C1, Q-C2, Q-C4, Q-E2.
7. **Mockup mới cần vẽ: 12 bộ** (S0 sân mẫu, M0 khung trang, M1, M1b, M2, M3, M3b, M4, M5, M6, M7, Quản trị nếu làm), mỗi bộ 1440 tối + 375 sáng, **cả trang**, dữ liệu dày + rỗng, đủ trạng thái.
8. **Kiểm soát lần này (12 bước):** sửa mockup trước → sân mẫu duyệt một lần → mockup mới vẽ từ thành phần sân mẫu → bảng truy vết khung → thành phần → ảnh (có dòng BỎ / GIỮ) → một màn một PR → ảnh cặp toàn trang → phép kiểm máy → cổng ≥ 90 % khớp → **chủ SP duyệt ảnh cặp trước merge** → chấm lại.
9. Đã chốt (9.1): khung thắng kế hoạch cũ (9.1-1 = Q6), chủ SP duyệt 3–5 ảnh cặp trước merge PR đổi bố cục, không merge qua đêm (9.1-2 = Q5). Q1–Q4, Q7–Q13 là đề xuất ghi vào CLAUDE.md / plan.md ở GĐ0 (PR QT-UX).
10. Thêm 8 kiểm soát mới (K1–K8) từ vòng 4: mockup phải vẽ mật độ thật; mỗi khung có đích đo được; ảnh chụp 100 % + 125 %; khung cũ bị đánh dấu "HẾT HIỆU LỰC" ngay trong tệp; session code nhìn **ảnh** khung, không chỉ đọc mã HTML.

---

## 1. Đối chiếu từng màn có mockup đã duyệt ↔ web

**Cách tính:** mỗi quyết định nhìn thấy được trong khung = 1 dòng; KHỚP = 1, MỘT PHẦN = ½, THIẾU / KHÁC = 0; % = tổng / số dòng (a6 Phần 1, V3B-04). Web = `main` ngày 20/10 trên demo 14/09/2026, 1440 tối.

| # | Màn | Mockup / khung | Khớp | Lệch chính (nhìn thấy đầu tiên) | Lệch có lý do ghi lại? | Khung còn hiệu lực? (sau vòng 1–4) |
|---|---|---|---|---|---|---|
| 1 | Tổng quan QL | m3 §1, 1c, 1d · m6 §10 | **~40 %** (4,5 / 11) | tiêu đề "Việc hôm nay" (nhãn tab cũ); đầu trang 3 hàng thay 1; Chờ duyệt thẻ to thay hàng gọn; "Tuần này" dùng lại `LichSapToi`; số gạch chấm thay ô viền | 1 / 11 (A1: theo plan §7 — trái m6 §10, **không ai sửa mockup**) | §1 **sửa** (bỏ Trễ chấm V1 II.4, bỏ dải HV cần chú ý X-24; bố cục → Q-A1, Q-A2) · 1c, 1d **giữ ý** · m6 §10 **hết hiệu lực** |
| 2 | Công việc GV + QL | m2 §1 "Sau", §2, §2b, §3 | **~65 %** (6 / 9) | panel Nhập điểm = khung "Trước" (bảng nửa panel, 2 link ↗, không "Còn n bài"); QL dùng bố cục hàng đợi GV; thiếu ? cạnh dòng; bỏ "Mẫu nhận xét", "Việc i/N" | 1 / 9 (#469 tự ghi "Chưa xác minh … 2 bài hiện 3 em" — **không vào danh sách nào**) | **Sửa cả khung**: chính m2 "Sau" cũng dày như web (V4A-01 — "lệch kỳ vọng", không chỉ lệch mockup); dòng 3 vùng, Chờ duyệt là dòng; §3 Công việc QL → Q-A1 |
| 3 | Học viên & Lớp | m1 §2b, §3 · m5 §1–2 · m6 §1, §7 | **~58 %** (7,5 / 13) | **không có dải lọc dính** (C10 đã chốt, không PR nào làm); hàng lớp không tóm tắt SOS 1/2/3 · Đã thi · Case; lớp gập hết (khung: lớp đầu mở); ký hiệu SAU số; Lịch thi 12 nút tháng | 1 / 13 (C13: #476 đổi nhãn có ghi) · C4: luật T17 "không tự mở lớp" thắng khung, **không ghi** | m1 §2b **giữ** (thời gian → `Khoảng tuần`) · m1 §3 **giữ** trừ cột tick (Q-E2), góc Cần làm (Q-A4) · m5 §1 **sửa** (Q-C4) · m6 §1, §7 **giữ** |
| 4 | Hồ sơ lớp | m1 §4 · m6 §2 | **~42 %** (2,5 / 6) | khung chỉ vẽ bảng HV — web thêm **lưới điểm 33 em dưới MỌI tab** (trang 4 800–5 400 px); ✓ / ✗ sau số; chip SOS thiếu kỹ năng; thiếu chip "Đã thi 2" | 0 / 6 (phép kiểm DL-6 **buộc** khối lưới có + mở sẵn) | m1 §4 **giữ + bổ sung** khung "lưới gập + Nhập điểm tại chỗ" (V2 II.1 đã chốt) · m6 §2 **giữ** · Ý thức / Phối hợp cần **mockup mới** (11.3 A) |
| 5 | Lưới điểm FT (6 lối vào: hồ sơ lớp, panel Nhập điểm, Lịch Test, Công việc, `/nhap-diem`, Điểm theo lớp) | m6 §3 (thắng m1–5) · m2 §1a–1c | **~45 % [ƯỚC]** (3,5 / 8 — PTA đếm từ V2B-1 R8) | tiêu đề ↔ ô lệch **45–69 px** (S 68, L 51); ký hiệu SAU số, số trắng; ô căn phải trong cột giãn 134 px; "30 câu" dồn sát đáy hộp (khe 1 px); W1 / W2 không ký hiệu. Khớp: Kỳ vọng · Overall nổi bật 15 / 800, cột W nền xám, ✓ / ✗ trơn | 0 / 8 (OV-15a hiện thực C06 bằng luật tên lớp `index.css:267` — làm hỏng lưới **vốn thẳng**) | m6 §3 **sửa phần căn** (căn giữa theo C06 + ký hiệu trước + ô rộng cố định — X-01); phần còn lại **giữ** |
| 6 | Test (Kế hoạch Test, Lịch Test) | m4 · m1 §2b · m6 §8 · ba khối 06/10 | **~70 %** (4 / 5, trừ vì chip lệch mọi ô) | chip Kế hoạch Test kiểu cũ một dòng "L R W S · trễ W4 JUL/2026" nền màu (khung: 2 dòng "tuần / Đã thi", email dưới tên); Lịch Test lưới đủ cột mọi em (khung: chỉ em + cột còn nợ); dải 3 ô số | 0 / 5 | m4 §1 **sửa** (năm → đầu cột X-17; "Đã thi" → "Đã làm bài" X-37) · m4 §2–5 **giữ** · m6 §8 **giữ** · ba khối → **chờ Q-C1** |
| 7 | Test lớp thường (lưới chấm Progress / Final) | m2 §1a, §1d | không chấm % (khung hết hiệu lực một phần) | nút "Nhận xét" 66 px đứng TRƯỚC ô; ⋯ đè **41 %** ô "tổng"; ô "tổng [25]" của tiêu đề lệch **≈ 86 px**; hàng 57 px (dòng "Đạt · 80%" + chip "Đã hoàn tất" dưới tên — khung: "✓" sau tên); "Dán từ Excel" ở mọi lưới (đúng khung 1d nhưng nay trái V3 I.5) | 0 | §1a **sửa** ("✗ 17/25", nhận xét trong hộp chấm — V3 I.2, X-33, X-02) · §1d **sửa** ("mọi lưới" → "lưới theo lớp × lượt" — V3 I.5, X-15) |
| 8 | Phân tích (khung, Kết quả thi, Phân tích GV) | m3 §4, 4b, 4c · m6 §6–7 | **~75 %** (4,5 / 6) | Phân tích GV giữ **bảng cũ 12 cột** + câu giải thích dài (khung 4c: 7 cột gọn) | 1 / 6 — nhưng ghi **ngược khung** (kế hoạch 15e.5 "giữ chiều sâu bảng cũ") | m3 §4 **sửa** bộ chọn (Toàn bộ \| Khoảng tuần) + số → ô số · 4b **giữ** (m6 §6 thay một phần) · 4c **giữ** (X-35) · m6 §6–7 **giữ** |
| 9 | Báo cáo | m3 §3 (`#bc1440`, `#bc375`, panel "Chưa đạt") | **~36 %** (2 KHỚP + 9 MỘT PHẦN / 18) | đầu trang **4 hàng** (khung 1); **không có chế độ chiếu** sáng chữ lớn (chỉ sáng khi In); khối số xếp dọc, số gạch chấm (khung: ô số + chữ ngang); SOS theo lớp số trơn (khung: chip màu, "tạm" viền đứt); panel "Chưa đạt" 14 cột cuộn ngang, không cột "Kỹ năng cần cải thiện", không nút việc; In chỉ 10 dòng | 2 / 18 (#1 vị trí — plan §7, PR #462; #6 dòng chấm chéo — chốt 18/10) | **sửa** theo V3B-04 (c) (panel ≤ 6 cột, "chấm trễ trong kỳ", khối "tại" ghi rõ, "Theo chi nhánh") + **vẽ thêm** khung "Chiếu" → **chờ Q-C2** |
| 10 | Tutor | mT §1–8 (m2 = trang, m7 = 375) | **cấu trúc ~88 %**; thứ chủ SP thấy: **trang rỗng** | demo: buổi tutor ghi giờ thật 20/10, ngoài khoảng xem → "Đang dạy 0"; kết luận chữ trơn (khung: chip); số Buổi / tỉ lệ trơn hoặc chữ link cam (khung: ô viền); cột "Cần chú ý vì" trống 418 px cả 8 dòng; panel "Feedback G…" bị cắt + bộ chọn thời gian thứ hai | 0 (ảnh PR TU-b chụp trên DB khác — lệch không lộ khi rà) | §2 **sửa** (F1 / B1; nút chính "Thêm tutor" X-34; mặc định "Tất cả" khi 0) · §3 **sửa** (bỏ bộ chọn thứ hai, không IN HOA) · §1, §4–8 **giữ** |
| 11 | Nền chung (màu, chip, menu tài khoản, thanh trên) | m1 §1a–1g, §2a | **~80 %** | thứ tự thanh trên (khung: Công việc đầu — nay đã chốt khác cả khung); chuông chữ "Thông báo 30"; ô tìm "…hoặc email" | — | §1a **sửa** (thêm `--kq-*`, bỏ chênh trong ô) · §1d **sửa** (đang chọn → nền nhấn + vạch trái — PTA-v4-9) · §1e **hết hiệu lực** (thang chữ mới) · §1f **giữ** (đã lưu xám) · §1g **sửa** ký hiệu ⓘ · §2a **sửa** thứ tự menu (V1 I.2) |
| 12 | Panel việc (khuôn v3, ghi nhanh) | ov12 panel v3 (14/10) · OV-13 §1 | **19 / 63** panel dùng đầu v3 [đếm mã — V4A-04] | 44 panel còn đầu cũ 52 px / 14 px; 9/18 tiêu đề khác nghĩa tên dòng; ghi nhanh Kết quả PA dưới dòng làm **cột tiêu đề co 0 px** (lưới `0px 494px`) | 0 (CV-03 đã nêu, chưa sửa) | khuôn v3 **giữ + mở rộng** thành khuôn 6 phần (04 mục 9.1) · OV-13 §1 ghi nhanh ở Công việc **sửa** → khung phải (V4A-06) |
| 13 | Hồ sơ HV (Ý thức, Hành trình, Lộ trình một em) | **không có khung OV-14** | không tính | một việc "Ghi nhận" hiện 3 chỗ một màn; Hành trình vẽ một lộ trình **3 lần** + chú giải 9 ký hiệu, 375 cắt chữ; "Lộ trình tiếp theo" một em đổi trang + Modal giữa màn | — | cần **mockup mới** (11.4, V4C-06, V4C-07) |

Nguồn số: tài liệu chính 3.1; a6 Phần 1 (A–H); V3B-04 (Báo cáo); V2B-1 R8 (lưới FT); V3A-6, V3A-7, V3A-9 (lớp thường); V3B-12 (Tutor); V4A-01, V4A-04, V4A-06 (Công việc, panel); V4C-06, V4C-07 (hồ sơ HV).
**Đọc nhanh:** chỗ khớp cao (Kết quả thi "m6 khung 6", hồ sơ lớp "khung 2", Lớp cần chú ý "theo m3" ở 15h1) đều là chỗ kế hoạch **trỏ đúng một khung**; chỗ lệch nặng là chỗ kế hoạch chỉ ghi một chữ ("Tuần này", "Cần bạn quyết"), ghi ngược ý ("giữ chiều sâu bảng cũ") hoặc không ghi (dải lọc C10, đầu trang, khối cũ cần bỏ, vị trí ✓ / ✗).

---

## 2. Nguyên nhân gốc

### 2.1 N1–N14 (phụ lục a6 — có bằng chứng)

| # | Nguyên nhân | Bằng chứng chính | Mức | Kiểm soát (mục 5) |
|---|---|---|---|---|
| N1 | **Kế hoạch dịch mockup thành chữ, mất bố cục**; không có tiêu chí "giống khung X" | 6 mockup ≈ 50+ khung → kế hoạch OV-15 có 34 ý, chỉ 5 ý trỏ một khung; tiêu chí duy nhất "chữ trên màn = chữ mockup"; C10 rơi giữa đặc tả và kế hoạch | Cao | Q1 bảng truy vết; K2 |
| N2 | **Luật "sửa trên nền có sẵn / bố cục đã khoá / dùng lại component"** đẩy session vá màn cũ | CLAUDE.md, DESIGN.md "bản ghi hệ đang có…"; dùng lại `HopChoDuyet`, `LichSapToi`, `KhoiDiemLop`, bảng GV cũ, chip lịch cũ, `BranchFilter`, banner; `ponytail` thưởng diff nhỏ, không skill nào thưởng "giống khung" | Cao | Q7; 9.1-1; MP 0 |
| N3 | **Chủ SP chỉ duyệt khung tĩnh, không xem bản chạy trước merge**; 14 PR giao diện merge trong ~24 giờ | mockup 6 (10 khung) duyệt ≤ 20 phút; "không nhắc = duyệt" ≈ 60 khung duyệt ngầm; 5 PR merge 22:14–04:17; mở → merge trung vị ~46 phút | Cao | **9.1-2 (ĐÃ CHỐT)** = Q5 |
| N4 | **Không có cổng "giống mockup" khi rà / merge**; lệch đã lộ trong ảnh PR vẫn merge | 0 / 13 PR có ảnh mockup cạnh web; 124 / 133 ảnh PR chỉ một khung nhìn; #471 (khớp m3 hơn) bị đóng vì #463 merge trước | Cao | Q2, Q4 |
| N5 | **Luật tiết kiệm token bỏ bước kiểm hình** | plan.md 1.3b: không `polish`, bấm thử MỘT lần; kế hoạch OV-15 bỏ cả `layout`; phần dưới trang gần như không ai xem | Cao | Q8 |
| N6 | **Thứ tự nguồn đặt kế hoạch + luật cũ TRÊN mockup** | CLAUDE.md "Khi các nguồn mâu thuẫn": kế hoạch > mockup → T17 "không tự mở lớp" thắng khung; plan §7 đổi "Báo cáo" mà không sửa mockup → web không theo cả hai | Cao | **9.1-1 (ĐÃ CHỐT)** = Q6 |
| N7 | **6 PR song song chia theo TỆP, không theo MÀN** | Công việc bị 9 PR chạm, Hồ sơ lớp 8, Test 8; đầu trang / dải lọc / khối cũ không ai sở hữu; OV-15d chạy hai lần | TB–Cao | Q3 |
| N8 | **Việc lẻ chỉ theo mục session tự khai**; đợt sau bị cấm đổi bố cục | 15h/15i chỉ gom mục PR tự ghi; kế hoạch 15g/h/i "không màn mới → không mockup" | TB | Q10 |
| N9 | **Phép kiểm đọc chuỗi mã khoá bố cục cũ** | DL-6 buộc khối "Điểm Mock Test của lớp" có + mở sẵn; #463 sửa 12 phép kiểm "giao diện trước"; không phép kiểm nào nói "giống mockup" | TB | Q9 |
| N10 | **Mockup viết tay, không từ thành phần thật; mockup mâu thuẫn nhau** | CSS riêng mỗi mockup; `/dev/thanh-phan` không có thành phần OV-15; thanh trên m1 ≠ m3; Chờ duyệt là thẻ (m2) và là hàng (m3); "Báo cáo" ở 3 chỗ | TB | Q12; K4 |
| N11 | **Dữ liệu demo không đủ trạng thái của khung** | buổi tutor ghi giờ thật → Tutor rỗng; Lịch thi tháng tới 0 HV; demo dày hơn mockup (33 em, ~45 vi phạm) | TB | Q11; K1 |
| N12 | **Session cloud không hỏi lại được** | gặp mockup ≠ mã ≠ luật thì tự quyết, ghi cuối PR | TB | Q10; một màn một PR chạy local khi đổi bố cục |
| N13 | [GIẢ THUYẾT] **Session đọc mockup dạng mã HTML** (~700 KB), không chụp ra hình để nhìn | prompt chỉ "Đọc trước … mockup …html"; không PR nào có ảnh mockup | ? | K5 (ảnh PNG từng khung) |
| N14 | "Model yếu" — **ĐÃ BÁC** | 12 / 13 PR giao diện là Opus 5.5; #471 và #463 cùng Opus mà kết quả khác xa | Thấp | — |

### 2.2 Bổ sung vòng 2–4 (gốc mới thấy khi rà sâu từng màn)

| # | Nguyên nhân | Bằng chứng | Mức | Kiểm soát |
|---|---|---|---|---|
| N15 | **Không có component bảng / ô điểm** → khung đúng nhưng nền không dựng được; mỗi PR sửa số px | 65 `<table>` / 53 tệp, ~190 lớp căn viết tay, 7 cấu trúc ô điểm; chú thích vá số ngay trong mã ("TT 118 → 146…", `LuoiFT.tsx:89-94`) | Cao | `Bang` + `ODiem` + BANG-1…5 (04 mục 6, 7) |
| N16 | **Một quyết định hiện thực bằng "luật tên lớp" toàn cục**, làm hỏng chỗ đang đúng | OV-15a hiện thực C06 bằng `index.css:267` → lưới vốn thẳng lệch 45–69 px ở 6 lối vào | Cao | căn theo `data-kieu`; `do-bang` chạy mọi trang |
| N17 | **Phép kiểm khoá chuỗi + công cụ đo bỏ qua đúng chỗ hỏng** | ~100 phép kiểm đọc chuỗi tệp bảng (vd `prHk2.tests.ts:651`); `do-khung` `BO_QUA_CAT` miễn đo lưới chấm | TB–Cao | Q9; bỏ miễn đo; `do-bang` |
| N18 | **Mockup tự nó không lộ mật độ thật / lệch kỳ vọng chủ SP** — duyệt khung mảnh nhỏ, dữ liệu đẹp | m2 "Sau" cùng dáng danh sách dày như ảnh v4-1 chủ SP chê (V4A-01); panel "Chưa đạt" của chính m3 cũng tràn 10 cột (V3B-04 c); m3 vẽ cùng số hai lần, ~60 con số (10.5) | Cao | K1 (mật độ thật), K2 (đích đo được) |
| N19 | **Mockup vẽ "chỉ phần bảng" mà không có dòng BỎ** → khối cũ quanh khung được giữ nguyên | m1 §4 "chỉ khối bảng", m6 "Phần không vẽ: giữ như mockup 1–5" → lưới điểm dưới mọi tab, banner, đầu trang 3 hàng còn nguyên | Cao | Q1 dòng BỎ / GIỮ; mockup cả trang (Q12) |
| N20 | **Quyết định mới không quay về sửa mockup** → mockup cũ còn lưu hành, session theo nhầm | m6 §10 ("Báo cáo" thay "Tổng quan", Công việc đầu menu) trái V1 I.2 nhưng tệp chưa sửa; m3 §1 còn Trễ chấm; m2 §1d còn "mọi lưới nhập" | TB–Cao | 9.1-1; K4 (đánh dấu ngay trong tệp) |
| N21 | **Thành phần "dùng lại" mang theo hành vi của nơi khác** | panel dựng từ khối của Case / Sửa thông tin / Thông tin lớp → tên + thứ tự khối theo nơi gốc (V4A-03); "Phân công…" mở Thông tin lớp cả lớp cho việc thiếu chủ Case (V4A-05); nút "Mở hồ sơ" về chính trang (V4C-14) | TB | khuôn 6 phần; `thieuNguoi` từ máy chủ; phép kiểm "link trùng trang không vẽ" |
| N22 | **Không có hệ trạng thái** → mockup vẽ hover / đang chọn đúng nhưng cách dựng làm mất | m1 §1d vẽ "rê chuột", web đặt hover trên `tr` trong khi `td` có nền riêng → ΔL đo ô thật **0** (V4C-02); "đang chọn" 5 dáng (V4C-04) | TB | HTT-1…12 (04 mục 12) + phép đo ΔL |
| N23 | **Ảnh nghiệm thu một tỉ lệ, một khung nhìn** | chủ SP xem ~125 % (ảnh `5.webp` ×1,27) — GV ở 100 % thấy chữ còn nhỏ hơn; 124 / 133 ảnh PR là một khung nhìn | TB | Q2 toàn trang; K3 (100 % + 125 %) |
| N24 | **Hai PR song song sửa cùng một `switch`**, công cụ không báo | `case 'yt_xem'` trùng (OV-13d + OV-13b, 15/10) → "Ghi nhận" một em đổi trang thay vì tại chỗ; esbuild chỉ cảnh báo, `npm run check` vẫn xanh (11.1e) | TB | Q3 (một màn một PR); cảnh báo esbuild = lỗi |

---

## 3. Mockup phải sửa / hết hiệu lực

Luật áp: **9.1-1** — khung đã duyệt thắng kế hoạch và luật giao diện cũ hơn ngày duyệt; **quyết định mới hơn trái khung → sửa mockup** (trong PR tài liệu GĐ0, trước mọi PR màn). Khung sửa / hết hiệu lực được **đánh dấu ngay trong tệp** (K4).

| Mockup · khung | Tình trạng | Vì sao (quyết định) | Sửa thành |
|---|---|---|---|
| m6 §10 — tên trang "Báo cáo" thay "Tổng quan"; Công việc đầu menu | **HẾT HIỆU LỰC** | V1 I.2 thứ tự menu; Báo cáo là tab đầu Phân tích (19/10-BC) | — (dải "hết hiệu lực" trong tệp) |
| m1 §1e — thang chữ 12 / 13 / 14 / 16 / 20, ô bảng 13 | **HẾT HIỆU LỰC** | V1 I.1 "chữ quá nhỏ"; X-13 | thang 04 mục 2 |
| m3 §1 — khối Trễ chấm (cột phải "Tuần này") | **HẾT HIỆU LỰC** (phần Trễ chấm) | V1 II.4 đã chốt bỏ | — |
| m3 §1 — Tổng quan A ba khối dọc + dải "HV cần chú ý" | **SỬA · chờ Q-A1, Q-A2** | MP IV.8, X-07, X-40; dải bỏ (X-24, PTA đề xuất) | bố cục theo câu trả lời; số chỉ ở hàng tổng, chỉ xem |
| m1 §1a — "bằng = xanh dương `doing`"; chênh "thiếu / vượt 0.5" trong ô; "✓ Đã lưu" màu `ok` | **SỬA** | V1 I.3; 19/10-M6 (bỏ chênh); 04 mục 5, HTT-10 | `--kq-*`; không chênh trong ô; đã lưu xám |
| m1 §1d — đang chọn = viền khung 2 px | **SỬA** (PTA đề xuất) | trùng vòng focus (V4C-04); PTA-v4-9 | nền nhấn nhạt + vạch trái 3 px |
| m1 §1g — nút "?" giải thích | **SỬA** (ký hiệu) | 12.4, 12.9-12; m6 §1 đã bỏ "?" cạnh chip SOS | ⓘ, cùng hành vi C04 |
| m1 §2a — thứ tự thanh trên | **SỬA** | V1 I.2 | Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor |
| m1 §2b — dải lọc dính | **GIỮ** (+ sửa phần thời gian) | C10 đã chốt; V2 I.1 | `Khoảng tuần` thay "‹ Tuần thi ›" |
| m1 §3 — Học viên & Lớp | **GIỮ** · cột tick → **chờ Q-E2** · góc Cần làm → **chờ Q-A4** | — | hàng lớp tóm tắt, lớp đầu mở (X-36) giữ |
| m1 §4 — Hồ sơ lớp (chỉ khối bảng) | **SỬA / BỔ SUNG** | V2 II.1 (lưới gập, Nhập điểm tại chỗ) | thêm khung trang đủ: thanh gập "Điểm Mock Test · MT1 ⚠ 4 ô quá hạn ›", trạng thái mở |
| m2 §1a — lưới lớp thường "[ ] / 25 Nhận xét", "✗ 16/25 64%" | **SỬA** | V3 I.2; X-33; X-02 | "✗ 17/25", hộp chấm có nhận xét tuỳ chọn, "✓" sau tên |
| m2 §1d — Dán Excel "mọi lưới nhập" | **SỬA** | V3 I.5; X-15 | "lưới theo lớp × lượt"; ẩn ở 375 |
| m2 §1f, m6 §3 — nút "Lưu · em tiếp ›" | **SỬA** (chữ) | 04 mục 8.2 (không "›" trong nút) | "Lưu · em tiếp" |
| m2 §1 "Sau", §2 — hàng đợi GV | **SỬA** | V4A-01 (dày, không thứ tự; khung cùng dáng ảnh v4-1) | dòng 3 vùng (Hạn · Việc + đối tượng · mở), nhóm cố định, nợ cũ gom một dòng |
| m2 §2b — Chấm Speaking | **SỬA** | 12.9-6 (chấm chéo, người chấm mặc định); V4A-03 | nhóm "Chấm Speaking chéo", `ODiem`, tên em không phải link (↗ riêng) |
| m2 §3 — Công việc QL | **SỬA · chờ Q-A1** | V4A-02 (P1 "Theo dõi & giao việc") | theo câu trả lời |
| m3 §3 — Báo cáo | **SỬA · nâng cấp chờ Q-C2** | V3B-04 (a) sai / thiếu, (c) nâng được, (d) mới | panel ≤ 6 cột; "chấm trễ trong kỳ"; khối "tại" ghi rõ; "Theo chi nhánh"; khung "Chiếu" |
| m3 §4 — Phân tích (bộ chọn thời gian 4 kiểu) | **SỬA** | V3 II.5; MP III.8 | `[Toàn bộ \| Khoảng tuần]`; số → ô số |
| m4 §1 — chip tuần "W1 JUL/2026 / Đã thi" | **SỬA** (chữ) | X-17 (năm ở đầu cột); X-37 (Thi ↔ Test) | "W1 JUL / Đã làm bài"; năm ở đầu cột |
| m5 §1 — Lịch thi: 4 nút Kết luận, ô "Tháng dự kiến thi ▾" | **SỬA · chờ Q-C4** | V2 I.6.1–I.6.3; X-30, X-48 | nhóm theo trạng thái, chip A / B, [Chốt ngày] [Dời tháng], "Ghi chú" |
| m5 §2 — Xuất DS có cột tick | **SỬA · chờ Q-E2** | MP V.4; X-42 | theo câu trả lời |
| m6 §3 — lưới FT căn trái | **SỬA** (phần căn — PTA đề xuất) | X-01 (C06) | căn giữa theo kiểu cột + ký hiệu trước + ô rộng cố định |
| m6 §1, §2, §4, §5, §7, §8, §9 | **GIỮ** | 9.1-1 | §6 tab "Kết quả thi" → "Kết quả Test" (X-37, đổi chữ) |
| Ba khối Lịch Test (06/10) | **CHỜ Q-C1** | X-08; khuyến nghị "Chấm Test theo hạn, một nguồn" (12.2) | mockup mới nếu duyệt |
| OV-13 §1 — ghi nhanh Kết quả PA dưới dòng ở Công việc | **SỬA** (PTA đề xuất) | V4A-06 (cột tiêu đề co 0 px; 2 kiểu mở một danh sách) | mở ở khung phải, cùng form gọn; giữ ghi nhanh trong panel một em |
| mT §2 — trang Tutor | **SỬA** | X-34; V3B-11, V3B-12 (F1 / B1) | "Thêm tutor" chính; khối "Việc của bạn"; 3 chip; cột "Kết luận / lý do" |
| mT §3 — panel một tutor | **SỬA** | V3B-12 | bỏ bộ chọn thứ hai; tiêu đề không IN HOA; không cắt "Feedback" |
| `mockup-vai-tvv-admin-cx-2026-10-13` — TVV không có Công việc | **CHỜ Q-A3** | X-27 (luật 1 sinh việc cho TVV) | theo câu trả lời |
| Mockup trước OV-14 (≤ 15/10: overhaul-1/2/3, ov12-*, …) | **THAM KHẢO** | OV-14 thay ở chỗ trùng | chỉ dùng cho phần OV-14 không vẽ, và phải ghi rõ trong bảng truy vết |

Tổng: **3 hết hiệu lực** · **~22 sửa** (6 kèm câu hỏi) · **2 chỉ chờ câu hỏi** · câu chặn: Q-A1, Q-A2, Q-A3, Q-A4, Q-C1, Q-C2, Q-C4, Q-E2 · còn lại giữ.

---

## 4. Mockup mới cần vẽ

**Quy ước chung cho mọi bộ** (để không lặp N10, N18, N19):
- **1440 tối + 375 sáng**, **cả trang** (đầu trang, dải lọc, mọi khối, chân) — không vẽ "chỉ phần bảng"; có dòng **BỎ** (khối cũ phải xoá) ghi bên ngoài khung.
- **Dữ liệu demo thật, dày** (MB FT 101 33 em; QT Monbay 84 việc + 10 thẻ duyệt) **và** trạng thái rỗng.
- Đủ trạng thái: mặc định · rê chuột · focus · đang chọn / đang mở · đang lưu · đã lưu + Hoàn tác · lỗi lưu (giữ chữ) · người khác đã xử lý · lỗi tải (chỉ che vùng) · rỗng theo vai · quyền hẹp (vai khác).
- Vẽ bằng **token + tên thành phần của sân mẫu** (04 mục 18); thành phần chưa có ghi "MỚI".
- Mỗi khung kèm **đích đo được** (y dòng đầu, chiều cao trang, số phần tử bấm khung nhìn đầu, số bấm cho 2–3 việc thật) và **ảnh PNG** chụp ra (K2, K5).

| Bộ | Nội dung (khung) | Vì sao | Chặn bởi câu hỏi |
|---|---|---|---|
| **S0 · Sân mẫu** (không phải mockup — ảnh của `/dev/thanh-phan`) | thang chữ, màu + tương phản, `ODiem` 4 biến thể, `Bang` 13 kiểu cột × 1440 / 1280 / 375, `OSo`, chip, nút, HTT-1…12, Khung việc 5 bậc, `PanelChiSo`, `Khoảng tuần`, `ONgay` | duyệt một lần (11.8-13 → 9.1-2) | — |
| **M0 · Khung trang** | đầu trang một hàng · dải lọc dính (thường / Phân tích có "Toàn bộ" / một tuần) · thanh trên ≥ 1 440 và 1 280 (kính lúp) · 375 thanh dưới 5 nút + "Thêm" · menu tài khoản · "Trang không mở được" | C10 chưa ai làm; X6 | — |
| **M1 · Tổng quan QL / QT** | khu việc (theo Q-A1 / Q-A2) · "Lớp cần chú ý" hàng lớp mở rộng (dòng em + Thêm PA dưới dòng) · "Tuần này" một hàng ô tuần · QT "Tất cả chi nhánh" · chi tiết mở từ dòng | V1 II.5, II.7; 10.2 | Q-A1, Q-A2 |
| **M1b · Tổng quan TVV / CX / Admin VP** | "Việc của bạn" (hàng đợi) · form "Báo PH kết quả xử lý vi phạm" (luật 1–2) · ô số chỉ xem | L1, L2; V4A-08; V4B-01 | Q-A3, Q-D1…Q-D3 |
| **M2 · Công việc** | GV: dòng 3 vùng, nhóm cố định, nợ cũ gom, khung phải 6 phần (Kết quả PA, Thêm PA, Xử lý vi phạm, Phối hợp SOS, Nhập điểm) · QL / QT / Admin: "Theo dõi & giao việc" (theo GV) · hộp neo "Phân công GV môn" · thẻ Thu hồi / Không tăng bậc trong Chờ duyệt | MP XI.1–XI.6; V4A-01…06; 21/10-YT | Q-A1 |
| **M3 · Hồ sơ lớp** | tab Học viên: `Bang` Tổng hợp + thanh "Điểm Mock Test" gập / mở + Nhập điểm tại chỗ + QL "Xếp lịch MT3" hộp nhỏ · Ý thức & Phối hợp phương án A (một bảng theo em, mở dưới hàng, Nhật ký gập) · Phối hợp SOS nhóm lặp | V2 II.1–II.3; 11.3 | — |
| **M3b · Hồ sơ HV** | Ý thức hai cột (Vi phạm chưa xong \| Phối hợp SOS) + Nhật ký gập + dòng trạng thái báo PH · Hành trình một dòng thời gian (trục tuần là công tắc ≥ 1 280) · "Lộ trình tiếp theo" một em mở panel tại hồ sơ | 11.4; V4C-06, V4C-07; V4B-01 | — |
| **M4 · Học viên & Lớp** | hàng lớp tóm tắt + mở dải việc (theo Q-A4) · Lịch thi nhóm trạng thái + chip A / B + hộp Chốt ngày / Dời tháng · panel Xuất (theo Q-E2) · Đang SOS | V2 I.3–I.6; 11.2 | Q-A4, Q-C3, Q-C4, Q-E2 |
| **M5 · Test** | "Chấm Test theo hạn" + "Tình trạng chấm" cho QL (nếu Q-C1 duyệt) · **hộp chấm một mẫu** FT + lớp thường · lưới lớp thường "✗ 17/25" · hộp một đợt MT (dòng "Huỷ · vắng 2 lần", Khôi phục điểm, Vắng thay "Không dự thi") · Kế hoạch Test chip mới | V3 I.2–I.5; 12.1, 12.2; V4B-07, V4B-08 | Q-C1, Q-B3, Q-B4 |
| **M6 · Phân tích** | Báo cáo (m3 §3 đã sửa) + khung **"Chiếu"** · `PanelChiSo` A / C · Ý thức Y1 · "Vấn đề & PA" (H2) · panel Xuất E1 | V3 II.1–II.7; 12.4–12.8 | Q-C2 |
| **M7 · Tutor** | F1 (khối "Việc của bạn", 3 chip, "Lọc ▾") · B1 (cột "Kết luận / lý do") · panel tutor · 375 theo mT §7 — vẽ trên seed có buổi theo ngày demo | V3 III.1; 12.8 | (xin dữ liệu thật — 02 mục 4.8) |
| **Q · Quản trị** (nếu làm trong đợt) | một panel tài khoản (Tạo = Sửa), "Quyền & nhật ký" 3 tab con | 7.8 | — |

Đổi chữ, gỡ khoá R11, luật "-" ở máy chủ, thêm nút / ô theo mẫu sẵn có: **không cần mockup** (plan.md 1.3b) — nhưng vẫn cần ảnh cặp trước / sau.

---

## 5. Cách kiểm soát để lần này bám thiết kế

### 5.1 Quy trình 12 bước (một trang cho chủ SP)

| Bước | Việc | Ai | Đầu ra kiểm được | Chặn gốc |
|---|---|---|---|---|
| 1 | **PR tài liệu GĐ0:** sửa / đánh dấu mọi khung ở mục 3 → mỗi màn chỉ còn **một** khung đúng; ghi Q1–Q13 + luật 9.1 vào CLAUDE.md / plan.md / mẫu rà 10B; viết lại DESIGN.md từ 04 | PTA Plan | tệp mockup có dải "HẾT HIỆU LỰC / ĐÃ SỬA"; CLAUDE.md có Q6 | N6, N10, N20 |
| 2 | **SEED-UX:** dữ liệu demo theo **ngày demo**, đủ trạng thái mọi khung (tutor có buổi, Lịch thi có em, thi thật có KQ, "Đã thi · chờ KQ") | session code (PR nhỏ) | mở `/tutor`, Lịch thi, Thi thật đều có dòng | N11 |
| 3 | **CONG-CU:** `scripts/` ghép ảnh cặp toàn trang; `do-bang`; đo ΔL rê chuột; đo y dòng đầu / chiều cao trang; chụp 100 % + 125 % | session code | công cụ chạy trên `npm run seed` nguyên | N4, N17, N23 |
| 4 | **NEN + BANG-0:** dựng sân mẫu `/dev/thanh-phan` theo 04 → ảnh sân mẫu → **chủ SP duyệt một lần** | session code → chủ SP | bình luận "chủ SP: đạt" | N10, N15, N22 |
| 5 | **Vẽ mockup mới** (mục 4) bằng thành phần sân mẫu, cả trang, dữ liệu dày, đủ trạng thái, có đích đo + ảnh PNG → chủ SP duyệt | PTA Plan → chủ SP | khung có số đo đích; không dáng ngoài sân mẫu mà không ghi "MỚI" | N18, N19 |
| 6 | **Kế hoạch PR có bảng truy vết** (Q1): mỗi khung (tệp + id) → thành phần / tệp web → Task → ảnh nghiệm thu; dòng **BỎ** và **GIỮ**; ghi "Loại PR" (sửa nhỏ / làm lại màn — Q8) | PTA Plan | số dòng bảng = số khung của màn; thiếu bảng → không giao | N1, N5, N19 |
| 7 | **Một màn một PR** (Q3), sở hữu cả đầu trang, dải lọc, khối cũ; phần máy chủ PR riêng chạy trước; song song chỉ khi khác màn, ≤ 2 PR giao diện cùng lúc | PTA Plan | không màn nào > 1 PR giao diện một đợt | N7, N24 |
| 8 | **Session code nhìn ảnh khung** (PNG), không chỉ đọc mã HTML; được `layout` + `polish` trong phạm vi; bấm thử ≥ 2 vòng; được gỡ phép kiểm chuỗi khoá bố cục cũ (liệt kê — Q9) | session code | mô tả PR liệt kê phép kiểm bỏ / sửa | N2, N5, N9, N13 |
| 9 | **Ảnh cặp toàn trang** (Q2) mockup \| web, cùng vai, cùng dữ liệu, 1440 tối + 375 sáng (+ 125 % cho màn nhiều chữ); mô tả PR có bảng khung → KHỚP / KHÁC (lý do) | session code | `docs/anh/pr-<x>/cap-*.png` đủ mọi dòng bảng truy vết | N4, N23 |
| 10 | **Phép kiểm máy xanh** (04 mục 19) + `do-khung` + `do-bang` ở 1440 / 1280 / 375 | máy | `npm run check` xanh, gồm cảnh báo esbuild = lỗi | N15, N16, N17 |
| 11 | **Cổng ≥ 90 % KHỚP** (Q4): agent rà chấm từng dòng bảng truy vết trên ảnh cặp, ghi thành **bình luận PR**; KHÁC chỉ tính khi chủ SP đã đồng ý lý do; "tự quyết / lệch / chưa xác minh" chép vào plan.md mục 4 trước merge, còn "chưa xác minh" ở luồng chính → không merge (Q10) | agent rà + PTA Plan | bình luận chấm trên PR; `grep "Chưa xác minh"` ở PR đã merge = 0 | N4, N8, N12 |
| 12 | **Chủ SP duyệt 3–5 ảnh cặp hoặc bản chạy trước merge** PR đổi bố cục; không merge PR đổi bố cục qua đêm; PR chỉ máy chủ vẫn tự merge. Cuối đợt **chấm lại** cùng phương pháp (Q13), cập nhật cột "Khớp" ở mục 1 | chủ SP; PTA Plan | bình luận "chủ SP: đạt"; bảng chấm lại | N3, N6 |

### 5.2 Đối chiếu Q1–Q13 (tài liệu chính 3.3) và quyết định 9.1

| Q | Luật (gọn) | Trạng thái | Thực thi ở bước | Ghi vào |
|---|---|---|---|---|
| Q1 | Bảng truy vết khung → thành phần → Task → ảnh, có dòng BỎ / GIỮ; thiếu bảng → không giao | PTA đề xuất | 6 | plan.md 1.2 |
| Q2 | Ảnh cặp mockup \| web toàn trang, cùng vai / dữ liệu, 1440 tối + 375 sáng; công cụ ghép ở `scripts/` | PTA đề xuất | 3, 9 | plan.md 1.2, mẫu 9.0 |
| Q3 | PR đổi bố cục chia theo MÀN; máy chủ tách PR chạy trước | PTA đề xuất | 7 | kế hoạch đợt (07) |
| Q4 | Cổng ≥ 90 % KHỚP, kết quả rà là bình luận PR | PTA đề xuất | 11 | plan.md 1.3, mẫu 10B |
| Q5 | Chủ SP xem 3–5 ảnh cặp / bản chạy trước merge PR đổi bố cục; không merge qua đêm | **ĐÃ CHỐT (9.1-2)** | 12 | bộ nhớ "Planning tự merge", "Luồng qua đêm" |
| Q6 | Khung đã duyệt thắng câu kế hoạch và quyết định cũ hơn ngày duyệt (trừ nghiệp vụ, quyền, chống mất dữ liệu); quyết định mới trái khung → sửa mockup | **ĐÃ CHỐT (9.1-1)** | 1 | CLAUDE.md "Khi các nguồn mâu thuẫn" (X-10) |
| Q7 | "Tinh chỉnh, không làm lại" — trừ màn có mockup mới đã duyệt; DESIGN.md thêm "Mẫu trang" | PTA đề xuất (MP 0 cho phép) | 1, 8 | CLAUDE.md, DESIGN.md (X-11) |
| Q8 | Hai loại PR: sửa nhỏ / làm lại màn (`layout` + `polish`, bấm thử ≥ 2 vòng, ảnh toàn trang) | PTA đề xuất | 6, 8 | plan.md 1.3b (X-12) |
| Q9 | Được xoá / sửa phép kiểm chuỗi khoá bố cục cũ; không thêm phép kiểm chuỗi cho bố cục | PTA đề xuất | 8 | plan.md 1.2 |
| Q10 | "Tự quyết / lệch / chưa xác minh" chép vào plan.md trước merge; còn "chưa xác minh" ở luồng chính → không merge | PTA đề xuất | 11 | plan.md 1.3 |
| Q11 | Seed đủ trạng thái khung, theo ngày demo; ảnh PR trên `npm run seed` nguyên | PTA đề xuất | 2 | seed |
| Q12 | Mockup dựng từ thành phần thật (sân mẫu), vẽ cả trang, có rỗng + dày; thành phần mới ghi "MỚI" | PTA đề xuất | 4, 5 | quy trình mockup |
| Q13 | Không nêu điểm "đạt" khi chưa chấm lại cùng phương pháp | PTA đề xuất | 12 | plan.md |
| 9.1-3 | Sửa GĐ1 (số liệu + lỗi chức năng) rồi mới deploy | **ĐÃ CHỐT** | trước 4 | 07 (gói → Q-E1) |
| 9.1-4 | Một phạm vi số cho cả trang; một định nghĩa "SOS hiện tại" | **ĐÃ CHỐT** | 5 (vẽ), 10 (kiểm) | 04 mục 15 |

### 5.3 Kiểm soát bổ sung từ vòng 2–4 (K1–K8)

| # | Kiểm soát | Chống | Đo / kiểm | Trạng thái |
|---|---|---|---|---|
| K1 | Mockup vẽ **mật độ thật** (dữ liệu demo dày) **và** trạng thái rỗng / "cả hai lọc = 0" | N11, N18 | khung có số dòng ≥ dữ liệu demo của màn | PTA đề xuất |
| K2 | Mỗi khung có **đích đo được**: y dòng đầu, chiều cao trang, số phần tử bấm khung nhìn đầu, số bấm cho 2–3 việc thật; nghiệm thu bằng số, không chỉ "nhìn giống" | N1, N18 | script đo trong `scripts/` (04 mục 19 #20) | PTA đề xuất |
| K3 | Ảnh nghiệm thu chụp **100 % và 125 %** cho màn nhiều chữ (bảng, panel) | N23 | ảnh cặp hai tỉ lệ | PTA đề xuất |
| K4 | Khung hết hiệu lực / đã sửa có **dải đánh dấu ngay trong tệp mockup** ("HẾT HIỆU LỰC — thay bởi …", "ĐÃ SỬA 21/10 theo …") | N10, N20 | grep dải trong `thiet-ke/` = số dòng mục 3 | PTA đề xuất |
| K5 | Mỗi khung có **ảnh PNG** đi kèm (`thiet-ke/anh/<mockup>/<khung>.png`); prompt session trỏ ảnh, không chỉ trỏ tệp HTML | N13 | mô tả PR dẫn ảnh khung | PTA đề xuất |
| K6 | **Sân mẫu là nguồn chung** của mockup và web; thành phần đổi ở sân mẫu → ảnh sân mẫu chụp lại | N10, N15 | ảnh sân mẫu đổi trong cùng PR | PTA đề xuất |
| K7 | **Phép đo thay phép chuỗi:** lệch bảng, đường cơ sở, ΔL rê chuột, "đè nhau", chữ < 12, "số = dòng" là phép đo DOM chạy mọi trang (không miễn lưới chấm) | N9, N16, N17, N22 | `do-khung` + `do-bang` xanh | PTA đề xuất |
| K8 | Cuối mỗi đợt PTA Plan **cập nhật mục 1 tệp này** (cột "Khớp" sau đợt) → chủ SP thấy tiến độ bám mockup theo số | N4, N8 | bảng mục 1 có cột "Sau đợt" | PTA đề xuất |

### 5.4 Cổng nghiệm thu một PR đổi bố cục (checklist dán vào mô tả PR)

- [ ] Bảng truy vết: mọi khung của màn + dòng **BỎ** + dòng **GIỮ**; số dòng = số khung.
- [ ] Ảnh cặp toàn trang 1440 tối + 375 sáng (+ 125 % nếu màn nhiều chữ), cùng vai, cùng dữ liệu seed nguyên; bảng KHỚP / KHÁC (lý do).
- [ ] ≥ 90 % KHỚP theo chấm của agent rà (bình luận PR); KHÁC chỉ khi chủ SP đã đồng ý lý do.
- [ ] Đích đo của khung đạt (y dòng đầu, chiều cao trang, phần tử bấm, số bấm).
- [ ] `npm run check` xanh (gồm phép kiểm 04 mục 19, cảnh báo esbuild = lỗi); `do-khung` + `do-bang` xanh ở 1440 / 1280 / 375.
- [ ] Phép kiểm chuỗi cũ bị gỡ / sửa được liệt kê; không thêm phép kiểm chuỗi mới cho bố cục.
- [ ] "Tự quyết / lệch / chưa xác minh" đã chép vào plan.md mục 4; không còn "chưa xác minh" ở luồng chính.
- [ ] Danh sách chú thích `ponytail:` (CLAUDE.md).
- [ ] **Chủ SP: đạt** (bình luận trên PR) — trước merge; không merge qua đêm.

---

## 6. Liên quan câu hỏi và PTA tự quyết

- **Cần chủ SP (ở 02 mục 5) chặn mockup:** Q-A1, Q-A2 (Tổng quan, Công việc) · Q-A3 (Tổng quan TVV) · Q-A4 (góc Cần làm) · Q-C1 (ba khối Lịch Test) · Q-C2 (Báo cáo nâng cấp + Chiếu) · Q-C3, Q-C4 (Lịch thi) · Q-E2 (cột tick xuất) · Q-E1 (BANG-0 / 1 trước deploy — không chặn mockup, chặn thứ tự PR).
- **PTA tự quyết có đảo khung đã duyệt** (chủ SP phản đối nếu không đồng ý — chi tiết 04 mục 22.1): m1 §1d đang chọn · m1 §1e thang chữ · m1 §1g ký hiệu ⓘ · m6 §3 căn cột điểm · m2 §1a ô lớp thường · m2 §1f / m6 §3 bỏ "›" trong nút · m4 §1 năm ở đầu cột · mT §2 nút chính · OV-13 §1 ghi nhanh ở Công việc.
- **[CẦN DỮ LIỆU]** để vẽ M7 Tutor và "Vấn đề & PA": 02 mục 4.8.
