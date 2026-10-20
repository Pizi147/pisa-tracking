> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# a1 · Khung chung + Tổng quan — rà UX/UI (20/10/2026)

Người rà: agent a1 (Opus 5.5). Mã `main` e3405b93, web demo http://localhost:5621, ngày demo 14/09/2026.
Phương pháp: impeccable critique (Assessment A) + ui-ux-pro-max (mã rule ghi trong từng mục) + đếm bước workflow + đối chiếu mockup + đọc mã.
Ảnh: `SCR/anh/a1/` (257 ảnh, nhật ký `index.jsonl`; 31 ảnh tiền tố `f-` chụp lại sau khi phông nạp đúng). Công cụ chụp riêng `SCR/chup/a1-chup.mjs` = bản sao `chup.mjs` + **chặn mọi request ghi** (POST/PUT/PATCH/DELETE, trừ đăng nhập demo) + ghi mọi phản hồi HTTP ≥ 400. Không dữ liệu demo nào bị đổi (các lần chặn: `PATCH /api/me/profile` do đồng bộ ngôn ngữ của công cụ chụp và do mở Hướng dẫn ghi "đã xem").

---

## Phần 0. Phạm vi

**Đã chụp / kiểm (id ảnh trong `SCR/anh/a1/`):**
- Tổng quan từng vai, 1440 tối (toàn trang): QT mặc định = Tất cả chi nhánh `tq-qt-macdinh`, QT `?cn=1` `tq-qt-mb-url`, QT chọn Tất cả `tq-qt-tatca`, **QT Monbay nhớ (tái hiện ảnh 1 của chủ SP)** `bam-qt-mb-nho`, QL Monbay `tq-ql2`, QL Lớp thường `d-ql2-thuong`, QT Lớp thường `d-qt-lt`, QL Bãi Cháy `d-ql3`, QL Hải Dương `d-ql5`, TVV `tq-tvv23`, CX `tq-cx24`, Admin `tq-admin22`, GV 7 / 10 `tq-gv7` `tq-gv10` (→ `/cong-viec?viec=…`), Head tutor `tq-ht25` (→ `/tutor`), chưa đăng nhập `tq-chuadn`.
- 375 sáng: QL `tq-ql2-375` (5 lát), QT `tq-qt-375`, TVV, CX, chưa đăng nhập `top-375-chuadn`; 1440 sáng `tq-ql2-sang`; bề ngang 800 / 1100 / 1280 `f-top-800`, `f-top-1100-qt`, `f-top-1280-qt` (bản cũ `top-768`, `top-1024-qt`).
- Chụp lại sau khi điều phối sửa phông (kiểu chữ, bề rộng, xuống dòng): `f-tq-ql2`, `f-tq-ql2-375`, `f-qt-mb-nho`, `f-ql2-thuong`, `f-tim-ten`, `f-hoso-gv10`, `f-cd-tick`, `f-tb-ql2`, `f-tre-dong`, `f-top-*`; `f-fonts` xác nhận Be Vietnam Pro "loaded", 0 lỗi HTTP.
- Mở từ Tổng quan (chỉ mở): từng số dải "HV cần chú ý" `bam-dai-*`, `d-375-dai`; số bảng Lớp cần chú ý `bam-bang-*` (Chưa lịch lớp, Chưa lịch hàng tổng, SOS, Case "HV / Case", ⓘ); "Chỉ lớp có vấn đề" + "Hiện" `bam-bang-chivande`; Chờ duyệt: ô tích `bam-cd-tick`, Từ chối… + Esc `bam-cd-tuchoi`, Xem thêm `bam-cd-xemthem`, Mở `bam-cd-mo` (+ Quay lại), Mở hộp duyệt `bam-cd-mohop`; Mở Case `bam-mocase` `d-375-mocase`; Chốt lộ trình `bam-chotlotrinh` `d-375-chot`; tab tuần Lịch sắp tới `bam-lich-tab`; Xem toàn bộ lịch `bam-lich-xemhet`; Trễ chấm "17 bài" + mở dòng `bam-tre-17` `d-tre-dong`; ⚠ quá hạn + mở dòng `bam-dai-quahan` `d-dai-quahan-dong`; Báo cáo › `bam-baocao`; Phân tích › `bam-phantich`; Esc panel `d-esc-panel`; Quay lại giữ cuộn `bam-lop-quaylai`.
- Khung chung: tìm (lớp, tên, email, không thấy, phím mũi tên + Enter) `top-tim-*`, `top-375-tim`; Thông báo QL / QT / 375 `top-tb-*`, `top-375-tb`; menu tài khoản QL / QT / GV / 375 `top-tk-*`, `top-375-tk`, `d-qt-goc`; panel Hướng dẫn + Chỉ cho tôi `top-hd-panel` `top-hd-chi`; trang `/huong-dan` (4 phần, tìm, Theo màn, Chỉ cho tôi, 375) `top-huongdan*`; `/ho-so-ca-nhan` QL, GV, 375 `top-hoso-*`; thanh demo (Công cụ, Đổi tài khoản) `top-demo-*`; Tab bàn phím `top-tab`; phông chữ `bam-fonts`.
- Mockup đã duyệt: OV-14 mockup 3 khung 1 / 1c / 1d / 2 `mk3-tq--a…e`, `mk3-p1c--*`; mockup 6 khung 10 `mk6-m10`; mockup 1 khung 2a / 2b `mk1-thanh`; mockup vai 13/10 (Admin) `mk-vai`; overhaul-3 (TVV, Lịch sắp tới) `mko3-tvv`. Đọc chữ toàn bộ khung liên quan.
- Mã: `web/src/App.tsx`, `modules/platform/{Header,DemoBar,ProfilePage,WelcomePage}.tsx`, `modules/worklist/{OverviewPage,TongQuanQl,KhoiCanQuyet,Highlights,HocVienCuaToi,MockTestAdmin}.tsx`, `modules/duyet/{HopChoDuyet,TheYeuCau}.tsx`, `modules/huongDan/*`, `ui/{SoLieuO,SoLieu,KhungPanel,Filters,CongTacKhung,NutLuat}.tsx`, `shared/domain/{dieuHuong,khoPanel,duongHoSo,metrics}.ts`, `server/src/worklist/{tongQuan,tongQuanQl,metrics}.ts`, `server/src/platform/{nav,thongBaoTuDong}.ts`, `server/src/routes/index.ts`; PR #460, #463, #482, #485; đặc tả 18/10 mục 6; kế hoạch OV-15 mục 7; DB demo (chỉ đọc).

**Chưa rà được + lý do:**
- Góc nhìn (đổi vai): demo không có tài khoản nào nắm ≥ 2 vai khác nhau (user 9, 14 chỉ 2 grant `teacher`) → [CẦN ẢNH].
- Bấm Duyệt / Gửi từ chối / Chốt / Đánh dấu đã đọc / đổi Ngôn ngữ / Đăng xuất: luật chỉ đọc. Kết quả sau khi lưu (toast, thẻ biến mất) chỉ đọc qua mã.
- Trạng thái đang tải / lỗi qua "Kịch bản demo": phải đổi cấu hình máy chủ dùng chung → không làm; chỉ đọc mã (`ErrorState` + Thử lại theo từng khối, Skeleton).
- "Cần bạn quyết" rỗng thật: không QL nào trong demo có 0 việc (QL Hải Dương còn 1).

---

## Phần 1. Điểm

| # | Heuristic | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | Skeleton + lỗi riêng từng khối tốt; "Dữ liệu đến"; mục menu sáng đúng. Nhưng **8 số bấm không phản hồi gì** (A1-01); số cùng tên lệch nhau trên cùng màn (A1-03); thông báo ghi "Ghi nhận 20/10" khi "hôm nay" là 14/09. |
| 2 | Khớp thế giới thật | 2 | Tiếng nghiệp vụ quen với QL, nhưng "L R W S" không nghĩa, "hạn hết T3", "Speaking chấm chéo" đứng như một GV, tiêu đề "Việc hôm nay" ≠ menu "Tổng quan", số trên tab tuần không đơn vị. |
| 3 | Kiểm soát, lối thoát | 3 | Esc đóng panel + trả focus (`d-esc-panel`); Quay lại giữ cuộn (300 → 300, 1400 → 1400); trạng thái trên URL (`so-lieu`, `lop-vd`, `lich-tuan`, `cn`). Thiếu: không "Hoàn tác" sau Duyệt (mockup có "Hoàn tác · 8 s"). |
| 4 | Nhất quán | 1 | Một trang ba phạm vi (công tắc FT/LT chỉ áp nửa trang); "Case chưa chốt PA" 19 ở dải, 5 ở khối dưới; 58 / 53, 4 GV / 3 GV; "Mở" đổi trang còn "Mở Case" mở panel ở khối liền dưới; bốn tiêu đề cho cùng mục "Tổng quan"; "bài" (QL) / "ô" (Admin); badge Công việc nghĩa khác theo vai; hai kiểu nút đang chọn. |
| 5 | Phòng lỗi | 2 | Chờ duyệt hiện thẻ chi nhánh khác khi đang lọc Monbay (A1-02) → dễ duyệt nhầm; "Chọn hết 2" chọn cả thẻ đang ẩn (A1-14); Duyệt một bấm không hoàn tác; ô Ngày demo đổi máy chủ chung khi rời ô. |
| 6 | Nhận ra hơn nhớ | 2 | Số chỉ gạch chấm (mockup: ô viền); Hướng dẫn giấu trong menu tên mình; phải nhớ khối nào theo công tắc, khối nào không. |
| 7 | Linh hoạt, hiệu quả | 3 | Duyệt nhiều cùng loại, tìm có phím mũi tên + Enter, link sâu, "Bỏ qua tới nội dung". Thiếu: lọc nhanh bằng bấm hàng chi nhánh, phím tắt duyệt. |
| 8 | Tối giản | 2 | Trang QL 2 263 px (≈ 2,5 màn 1440), 375 = 4 279 px (≈ 5,3 màn); "Nếu duyệt: …" lặp mọi thẻ; "Chốt lộ trình" ba lần một dòng; cột toàn số 0; danh sách lặp (panel ⚠ quá hạn = khối Case; chuông = Chờ duyệt). |
| 9 | Nhận biết, sửa lỗi | 3 | Lỗi theo khối có lý do + Thử lại; Từ chối lỗi mạng giữ chữ; thẻ đã bị người khác xử lý → báo + làm mới. |
| 10 | Trợ giúp | 3 | Panel Hướng dẫn đúng màn + tìm + "Chỉ cho tôi" tốt. Nhưng nội dung hứa tính năng đang hỏng ("bấm số mở danh sách", "bấm số bài để nhập thay"); lối vào chỉ còn trong menu tài khoản. |
| | **Tổng** | **23/40** | **Acceptable — chưa xứng ≥ 35.** |

**Cognitive load: trượt 6/8 (cao).** Trượt: Single focus (dải + 3 nhóm quyết + bảng + tuần, chuông lặp), Chunking (Cần bạn quyết 21 dòng QL Monbay / 29 dòng QT Tất cả chi nhánh; dải 6 số; menu 6 mục), Visual hierarchy (mọi thẻ cùng trọng lượng, quá hạn chỉ khác chữ cam), One thing at a time (7 loại thẻ trộn một danh sách), Minimal choices (menu 6 > 5; dải 6 số + 1 link), Working memory (phải nhớ khối nào theo công tắc). Đạt: Grouping, Progressive disclosure (Xem thêm, panel, ⓘ).

**Vì sao chưa xứng 35:** điểm trần bị kéo bởi H4 (1) và H1/H5/H8 (2). Ba lỗi gốc gây phần lớn: (1) số bấm chết (A1-01), (2) một trang ba phạm vi số liệu (A1-03), (3) danh sách Chờ duyệt lấy chi nhánh khác nguồn với số (A1-02); thêm hai P1 khác gốc: thông báo tự động xếp sai nhóm (A1-04), thanh trên bị cắt ở laptop (A1-05). Sửa năm mục P1 + làm gọn "Cần bạn quyết" theo mockup 3 thì H1, H4, H5, H8 lên được 3–4 (ước ~31–33/40); muốn ≥ 35 cần thêm A1-07, A1-09, A1-11.

**Design specificity:** khung và Tổng quan mang đúng ngữ cảnh PISA (SOS, Case, MT, lộ trình), không phải dashboard chung chung. Nhưng bản dựng là "ghép khối có sẵn" (thẻ Chờ duyệt của Công việc, Lịch sắp tới OV-6a, bảng chi nhánh cũ) hơn là bố cục giao ban mockup 3 đã vẽ.

**Hành trình cảm xúc (Chị Vy, 8:00):** mở trang → dải "Mới dùng PISA?" (đã quen, thấy thừa) → bấm "12 chưa điểm" không có gì (bực) → thấy 58 ở trên, 53 ở dưới (nghi số) → QT: thấy thẻ Bãi Cháy dù chọn Monbay (mất tin) → cuối trang "GV đã nhận thông báo tự động" (yên tâm). Đỉnh cảm xúc là âm.

**Persona:**
- Alex (thạo việc): số dải chết; "Xem thêm" mới thấy đủ 10 thẻ; duyệt nhiều chỉ trong một loại; Esc + URL tốt.
- Sam (bàn phím / trình đọc màn): Tab đúng thứ tự, có "Bỏ qua tới nội dung", focus thấy được; nút số có `aria-label` "… Bấm để xem danh sách" nhưng bấm không mở gì; "L R W S" không có nghĩa đọc lên.
- Cô Linh (GV, điện thoại): không có Tổng quan, vào thẳng Công việc (đúng mockup 2); dải "Mới dùng PISA?" nằm đầu Công việc tới khi bấm Ẩn; menu dưới 3 mục gọn.
- Chị Vy (QL, 10 phút): xem A1-01/02/03; ở 375 thẻ quyết đầu tiên bắt đầu ở y ≈ 650–730 px, nút Duyệt nằm dưới màn đầu.

---

## Phần 2. Phát hiện (nặng → nhẹ)

### A1-01 Số ở dải "HV cần chú ý" và hàng tổng bảng bấm không mở gì — PHÁT HIỆN · P1 · QL, QT (1440 + 375)
- Vấn đề: bấm "3 chưa lịch Test", "12 chưa điểm", "13 HV", "19 Case" ở dải, và "3 / 12 / 13 HV / 19 Case" ở hàng "Cả Monbay" (hoặc "Tất cả chi nhánh") → không panel, không phản hồi. 8 số chết, đúng 8 số QL hay bấm nhất. SOS tổng (6/5/3) và số từng lớp thì mở được.
- Bằng chứng: `bam-dai-chualich|chuadiem|hv|case` (`dialogs=0`, URL không đổi), `bam-bang-tong-chualich` (`dialogs=0`), `d-375-dai` (375 cũng chết); so sánh `bam-bang-chualich-101` mở được.
- Nguyên nhân (triển khai, OV-15h1): dải (`KhoiCanQuyet.tsx:34-36`) và hàng tổng (`TongQuanQl.tsx:54-56`, `khoa: 'tong'` dòng 71) cùng dựng `SoLieuO` với **cùng `nguon`** → cùng khoá URL `?so-lieu=` (`SoLieuO.tsx:20`, `quayLai.ts:124`) → bấm là HAI panel cùng mở; kho "một panel một lúc" (`shared/domain/khoPanel.ts:16-20`, `KhungPanel.tsx:73-77`) đóng panel trước, hàm đóng xoá `so-lieu` → cả hai đóng ngay.
- Ảnh hưởng: QL tưởng số "không có gì", phải cuộn xuống bảng bấm số từng lớp; Hướng dẫn lại dạy "bấm số mở danh sách" (`shared/huongDan/ql.ts:58`).
- Phương án: khoá `so-lieu` gồm cả vùng (vd `nguon:…|dai`, `nguon:…|bang`), hoặc dải không tự vẽ panel mà mở panel của hàng tổng. Thêm phép kiểm "bấm số dải mở 1 panel". Lệch mockup: mockup 3 dải là nút bấm ra panel (khung 1, 1d).

### A1-02 Chờ duyệt: số theo chi nhánh đang lọc, danh sách thẻ theo mọi chi nhánh — XÁC NHẬN-ẢNH · P1 · QT (và QL nhiều chi nhánh)
- Vấn đề: ảnh 1: "Chờ duyệt 10 ⚠1 quá hạn" nhưng 3 thẻ + "Xem thêm 9" = 12, có BC FT 205, CP FT 110 khi lọc Monbay; 2 thẻ "Quá hạn" (thẻ BC quá hạn 6 ngày không thuộc Monbay nên số ⚠ chỉ 1). Đã tái hiện y hệt: chọn Monbay một lần, quay lại Tổng quan qua menu.
- Bằng chứng: `bam-qt-mb-nho` (URL `/`, ô = Monbay, thẻ BC FT 205 · MB FT 101 · CP FT 110); đối chứng `tq-qt-mb-url` (`/?cn=1` → đúng 3 thẻ Monbay).
- Nguyên nhân (triển khai): Tổng quan lấy chi nhánh = `cn` trên URL **hoặc** chi nhánh đã nhớ (`OverviewPage.tsx:35-36`, `Filters.tsx:227-236`); số đếm gửi `branchId` đó (`OverviewPage.tsx:56` → `tongQuan.ts:196`). Còn `HopChoDuyet gon` chỉ đọc `cn` trên URL (`HopChoDuyet.tsx:51`) và `KhoiCanQuyet.tsx:92` không truyền chi nhánh → khi chi nhánh đến từ "nhớ", danh sách = mọi chi nhánh.
- Ảnh hưởng: QT giao ban Monbay có thể duyệt thẻ chi nhánh khác mà không biết; số và thẻ không khớp → mất tin số liệu.
- Phương án: truyền `branchId` của trang vào `HopChoDuyet` (prop), dùng một nguồn chi nhánh cho mọi khối; "Mở hộp duyệt ›" mang `cn` (xem câu hỏi 5). Phép kiểm: số thẻ hiện + "Xem thêm" = số đầu nhóm.

### A1-03 Công tắc Fast Track / Lớp thường chỉ áp nửa trang → số cùng tên lệch nhau — XÁC NHẬN-ẢNH · P1 · QL, QT
- Vấn đề (cùng màn, cùng bộ lọc FT, Monbay):
  - Dải "58 bài trễ chấm · 4 GV" ≠ khối Trễ chấm "53 bài · 3 GV". 58 = 53 FT + 5 Lớp thường (`d-ql2-thuong`: Trễ chấm LT "5 bài · 3 GV"); "4 GV" = người chấm của cả hai khung (Hà, Linh, Khoa, Trang); "3 GV" bỏ hàng "Speaking chấm chéo" (không phải người).
  - Dải "19 Case chưa chốt PA · ⚠5 quá hạn": 19 là FT, ⚠5 gồm 2 Case lớp thường (MB FOU 12, MB FOU 15) → FT chỉ có 3 quá hạn (Báo cáo cùng kỳ ghi "⚠4 · 3 chốt PA" — `bam-baocao`). ⚠5 không phải tập con của 19.
  - Khối "Case chưa chốt PA" và "Chốt lộ trình" (6 lớp FOU/BE) hiện khi đang xem Fast Track; đổi sang Lớp thường thì dải giữ nguyên "⚠5 · 58 · 4 GV" (`d-ql2-thuong`, `d-qt-lt`).
  - QL Hải Dương: dải "1 bài trễ chấm · 1 GV" nhưng không có khối Trễ chấm nào (bài đó thuộc lớp thường) — `d-ql5`.
- Nguyên nhân (thiết kế + triển khai): `/tong-quan/quan-ly` cố ý "gộp hai khung" (`tongQuan.ts:39-41, 75`, luật cũ PR-VAI-a Q5), còn bảng / Tuần này / Trễ chấm theo `ct` (`tongQuanQl.ts:16-23, 37`). Công tắc lại đặt ĐẦU trang (`OverviewPage.tsx:93`) — chính chú thích ở `OverviewPage.tsx:24-25` đã cảnh báo đặt đầu trang "dễ hiểu nhầm là cả trang đổi". Session code ghi "tự quyết" ở PR #463 (a) và #482 nhưng trái mockup 3 ("Số khớp: … trễ chấm 58 bài = 31 + 14 + 9 + 4 theo GV") và CLAUDE.md ("cùng số liệu cùng nguồn").
- Ảnh hưởng: QL không biết số nào đúng; phải tự cộng trừ; nghi lỗi hệ thống (ảnh chủ SP ghi chú đúng các cặp này).
- Phương án (khuyến nghị): MỘT phạm vi cho cả trang. Công tắc thành `Tất cả · Fast Track · Lớp thường` (mặc định Tất cả, như Công việc `coTatCa`), mọi khối (dải, Cần bạn quyết, Lớp cần chú ý, Tuần này, Trễ chấm) nhận cùng `ct`; khi "Tất cả" mỗi dòng có tag FT/LT. "Speaking chấm chéo" tách khỏi danh sách GV thành dòng phụ "Chấm chéo chưa ai nhận · 14 bài"; dải và khối cùng một câu từ CÙNG hàm, vd "53 bài trễ chấm: 39 của 3 GV · 14 chấm chéo". Lệch mockup: mockup 3 khung 1 và 1c — công tắc nằm cạnh tiêu đề, cả trang theo khung (1c "đang xem Lớp thường" chỉ hiện việc lớp thường).

### A1-04 Thông báo tự động thay "Nhắc" bị xếp vào "Để biết" — PHÁT HIỆN · P1 · QL, GV, GVCN
- Vấn đề: ba loại OV-15d (`chot_lo_trinh`, `cham_qua_han`, `case_chua_chot_pa`) — chính là thứ thay nút Nhắc (C03) — nằm nhóm **Để biết**, không phải **Cần làm**. QL 2 thấy nhóm "ĐỂ BIẾT 17" mở đầu bằng 6 dòng "Chốt lộ trình · MB FOU … · quá hạn 8–29 ngày" — việc QL phải làm.
- Bằng chứng: `top-tb-ql2`, `top-tb-qt1`; `shared/domain/duongHoSo.ts:150-158` (`LOAI_CAN_LAM` thiếu 3 loại) vs `server/src/platform/thongBaoTuDong.ts:20`; DB: 16 `cham_qua_han`, 15 `chot_lo_trinh`, 4 `case_chua_chot_pa`.
- Nguyên nhân: triển khai (OV-15d thêm loại mới, quên bảng nhóm).
- Ảnh hưởng: GV trễ chấm nhận "quá hạn chấm" ở mục "để biết" → dễ bỏ qua; luật "không Nhắc thủ công" chỉ đúng nếu thông báo tự động đứng ở chỗ việc.
- Phương án: thêm 3 loại vào `LOAI_CAN_LAM` + phép kiểm. Kèm: dòng đích "Công việc" của Chốt lộ trình nên mở thẳng panel lộ trình lớp.

### A1-05 Thanh trên bị cắt từ 1 280 px trở xuống; thanh dưới 375 có 6 mục — PHÁT HIỆN · P1 · QL, QT
- Vấn đề (đo với phông đúng): 6 mục menu cần 587 px. **1 280 px** (laptop phổ biến): còn 570 px → "Tutor" bị cắt ("Tuto…"); **1 100 px**: còn 475 px → mất cả số "12" cạnh Công việc và mục Tutor; **800 px**: còn 332 px → hiện "Tổng quan · Học viên & Lớp · Test · Phâ…", ô tìm co thành vạch. Mục bị cắt chỉ tới được bằng cuộn ngang trong menu (thanh cuộn 10 px, `index.css:139`; ảnh chụp headless không hiện thanh này) — rất dễ bỏ qua. 375: 6 nút (Tổng quan · Học viên · Test · Phân tích · Công việc · Tutor) > 5.
- Bằng chứng: `f-top-1280-qt`, `f-top-1100-qt`, `f-top-800` (nhật ký: `scrollW=587 clientW=570 / 475 / 332`), `tq-ql2-375-p4`; `App.tsx:208` (`overflow-x-auto`, không gom).
- Ảnh hưởng: QL/QT trên laptop 13–14" không thấy số Công việc hoặc mục Tutor; tưởng mất chức năng.
- Rule: ui-ux-pro-max `bottom-nav-limit`, `overflow-menu`, `breakpoint-consistency`.
- Phương án: khi menu không đủ chỗ (6 mục cần 587 px → khoảng ≤ 1 300 px) gom mục ít dùng (Tutor, Phân tích) vào "Thêm ▾"; ô tìm thành nút kính lúp như 375; thanh dưới ≤ 5 (Tutor vào "Thêm" hoặc menu tài khoản với QL/QT).

### A1-06 Panel "bài trễ chấm" ghi "Nhập điểm" nhưng QL không nhập được — PHÁT HIỆN · P2 · QL, QT
- Vấn đề: bấm "17 bài" / "58 bài" → danh sách dòng "Nhập điểm · em · lớp · MT1 · R"; mở dòng chỉ có "MB FOU 12 · W3 AUG · Xem hồ sơ ↗" (đổi trang). Không ô band, không hạn từng bài, không lọc lớp, không "Mở bảng điểm". Mockup 1d: bảng có Hạn chấm + ô Band "Enter để lưu" + "Mở bảng điểm MB FT 101 · MT1 · W".
- Bằng chứng: `bam-tre-17`, `d-tre-dong`, `d-dai-quahan-dong`; `server/src/worklist/metrics.ts:312-316` (`han: null`, `lam = can(score.edit)`); DB: `score.edit` chỉ vai `teacher`; Hướng dẫn QL "bấm số bài để nhập thay" (`shared/huongDan/ql.ts:62`); chú thích "QL nhập tại chỗ" ở `TongQuanQl.tsx:193`, `OverviewPage.tsx:111`.
- Nguyên nhân: mockup 1d giả định QL có quyền nhập điểm; quyền hiện tại không có → luật / thiết kế lệch nhau.
- Ảnh hưởng: QL bấm số tưởng làm được, thực ra chỉ xem; chữ "Nhập điểm" là việc của GV, không phải của người xem.
- Phương án: (a) nếu chủ SP cho QL nhập thay → bật như mockup 1d; (b) nếu không → đổi nhãn dòng thành tên GV + "chưa nhập", thêm "⚠ quá hạn n ngày" từng dòng, sửa Hướng dẫn. Xem câu hỏi 1.

### A1-07 Tên và tiêu đề trang không thống nhất; thứ tự menu không theo mockup — PHÁT HIỆN · P2 · mọi vai
- Vấn đề: menu "Tổng quan" mở trang tiêu đề "Việc hôm nay" (QL/QT), "Mock Test" (Admin), "Số liệu" (CX), "Học viên của tôi" (TVV). Thứ tự menu: Tổng quan · Học viên & Lớp · Test · Phân tích · Công việc · Tutor; mockup 3, mockup 6, đặc tả 18/10 mục 2: **Công việc đầu**.
- Bằng chứng: `tq-ql2`, `tq-admin22`, `tq-cx24`, `tq-tvv23`; `shared/domain/dieuHuong.ts:46-55, 160`; `OverviewPage.tsx:52`; `mk3-tq--a`, `mk6-m10`.
- Nguyên nhân: tiêu đề là nhãn TAB cũ ("Việc hôm nay · Phân tích", mockup vai 13/10) còn sót sau OV-15e bỏ tab — lệch không lý do. Giữ chữ "Tổng quan" (không đổi "Báo cáo" như mockup 6 khung 10) có lý do ghi ở kế hoạch OV-15 mục 7 + PR #463 (e). Thứ tự menu: không có ghi chép lý do.
- Phương án: tiêu đề = "Tổng quan" cho mọi vai (mockup 3), dòng phụ theo vai nếu cần; menu xếp Công việc đầu như mockup (xem câu hỏi 3–4).

### A1-08 Đầu trang 3 hàng, ô chi nhánh kiểu form ở góc xa — XÁC NHẬN-ẢNH · P2 · QL, QT, CX
- Vấn đề: hàng 1 "Việc hôm nay" + "Dữ liệu đến" + ô chọn có nhãn "Chi nhánh" phía trên, dồn mép phải; hàng 2 dải "Mới dùng PISA?"; hàng 3 công tắc FT/LT (không số lớp) + "Báo cáo ›". Mockup 3: MỘT hàng "Tổng quan · [Chi nhánh Monbay ▾] · [Fast Track 5 lớp | Lớp thường 6 lớp] · Dữ liệu đến · Báo cáo tuần". Không có dải lọc dính (C10, mockup 1 khung 2b).
- Bằng chứng: `tq-qt-macdinh-p1`, ảnh 1, `mk3-tq--a`, `mk1-thanh--b`.
- Nguyên nhân: triển khai dùng lại `BranchFilter` (nhãn trên) và `CongTacKhung` không `dem`; lệch không lý do.
- Ảnh hưởng: QT phải nhìn từ tiêu đề (trái) sang ô chi nhánh (phải, cách ~1 200 px) mới biết đang xem đâu; mất ~110 px chiều cao trước nội dung.
- Phương án: một hàng như mockup; ô chi nhánh nút gọn có nhãn trong; công tắc có số lớp; dải lọc dính khi cuộn (C10).

### A1-09 Thẻ Chờ duyệt cao, lặp chữ, lệch hàng, "hạn hết T3" — XÁC NHẬN-ẢNH · P2 · QL, QT
- Vấn đề: mỗi thẻ 95–130 px (mockup ~70 px một hàng lưới); "Nếu duyệt: PA bắt đầu hôm nay, Kết quả hai tuần một lần, hạn hết T3." lặp y hệt ở mọi thẻ Đề xuất PA, ghi thứ ("T3") trái chốt 19/10 "hạn chỉ ghi ngày" và mơ hồ (Thứ Ba hay tuần 3?); chip loại rộng cố định 96 px chữ căn giữa → "khoảng trống lạ"; thẻ có ô tích / không có ô tích lệch cột chip; câu hướng dẫn "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại."; ở 375 mã lớp bị ngắt giữa dòng ("MB FT / 101"), mỗi thẻ ~250 px.
- Bằng chứng: ảnh 1, `f-tq-ql2-p1`, `f-tq-ql2-375-p1`, `bam-cd-xemthem-p1/p2`; `server/src/duyet/loaiYeuCau.ts:186`; `TheYeuCau.tsx:179-189` (`w-24 … text-center`); mockup `mk3-tq--a`.
- Nguyên nhân: dùng nguyên thẻ của hộp duyệt Công việc (`HopChoDuyet gon`) thay vì hàng gọn mockup.
- Phương án: hàng gọn kiểu mockup (chip · việc + người gửi · "Nếu duyệt" một dòng · hạn · nút); "Nếu duyệt" ghi ngày cụ thể ("Kết quả đầu tiên hạn 29/09") hoặc gom vào ⓘ của nhóm; chip co theo chữ; ô tích chiếm chỗ cố định.

### A1-10 "Mở" ở thẻ Chờ duyệt đổi trang, "Mở Case" ở khối kế bên mở panel — PHÁT HIỆN · P2 · QL, QT
- Vấn đề: "Mở" → `/hoc-vien/2?case=4` (sang hồ sơ HV + bật panel Case, menu sáng "Học viên & Lớp"); "Mở Case" ngay dưới → panel tại Tổng quan. Cùng đối tượng Case, hai hành vi.
- Bằng chứng: `bam-cd-mo` (đích `/hoc-vien/2?case=4`, Quay lại về `/` cuộn 300 — giữ đúng), `bam-mocase`.
- Ảnh hưởng: muốn xem PA trước khi duyệt phải rời Tổng quan và quay lại (2 lần đổi trang mỗi thẻ). CLAUDE.md: xử lý tại chỗ, chỉ chuyển trang khi cần không gian lớn.
- Phương án: "Mở" của thẻ có Case → `NganCase` tại chỗ (như Mở Case); giữ link "Xem hồ sơ ↗" riêng.

### A1-11 "Tuần này" không theo mockup 3; "L R W S" vô nghĩa — XÁC NHẬN-ẢNH · P2 · QL, QT, CX, Admin
- Vấn đề: mockup 3 "Tuần này" = dải tuần (Trước W1 · W1 · W2 · tuần này · W4 · W5: Test n lớp · n HV · **Chấm x/y** · ⚠ quá hạn) + bảng "Test tuần này" (Lớp · Đợt · HV · Đã chấm · Hạn chấm) + Trễ chấm. Web = "Lịch sắp tới" OV-6a (3 tab tuần, chip "MT1 · 1 em" không bấm được) + Trễ chấm. Chữ mờ "L R W S" ở mép phải mỗi dòng = danh sách môn của chương trình (`Highlights.tsx:45, 130`, `boMonLich`) — FT luôn L R W S, không cho biết tuần đó thi môn nào. Số trên tab ("7 · 9 · 6") là số em, không ghi đơn vị.
- Bằng chứng: `f-tq-ql2-p2`, `bam-lich-tab`, `mk3-tq--b`; PR #463 chỉ ghi "Tuần này (Lịch sắp tới + Trễ chấm)" — lệch không lý do.
- Ảnh hưởng: QL không thấy tiến độ chấm theo tuần (câu hỏi chính sáng thứ Hai); phải sang Test › Lịch Test.
- Phương án: làm theo mockup 3 (dải tuần + bảng Test tuần này), bỏ "L R W S" hoặc thay bằng môn THẬT được xếp tuần đó; số tab ghi "7 em".

### A1-12 "Case chưa chốt PA" một tên hai số; nhóm "5 ⚠5 quá hạn"; "Chốt lộ trình" lặp 3 lần — XÁC NHẬN-ẢNH · P2 · QL, QT
- Vấn đề: dải "19 Case chưa chốt PA", khối dưới "Case chưa chốt PA 5 ⚠5 quá hạn" (chỉ liệt kê Case quá hạn, số và ⚠ luôn bằng nhau — `KhoiCanQuyet.tsx:94`). Dòng "Chốt lộ trình · MB FOU 12" dưới nhóm "Chốt lộ trình 6" với nút "Chốt lộ trình".
- Bằng chứng: ảnh 1, `tq-ql2-p1`; mockup ghi "Case chưa chốt PA · quá hạn 3".
- Phương án: tên nhóm "Case quá hạn chốt PA · 5" (không lặp ⚠5); dòng Chốt lộ trình như mockup 1c: chip "Lộ trình lớp" + "MB FOU 12 · 14 HV · tuần 7/8 · GVCN … đã đề xuất 7/14" + tóm tắt đề xuất + hạn; nút "Chốt…".

### A1-13 Số cạnh "Công việc" mang hai nghĩa — PHÁT HIỆN · P2 · QL, GV
- Vấn đề: QL: số = tổng thẻ chờ duyệt mọi chi nhánh, tô CAM khi có ≥ 1 thẻ quá hạn ("10" cam đọc như 10 quá hạn); GV: số = việc quá hạn. QT lọc Monbay: menu "12", trang "Chờ duyệt 10". Mockup 1 khung 2a: "Số đếm Công việc màu xám (cam chỉ cho quá hạn)".
- Bằng chứng: `App.tsx:79-80, 157-158`; `tq-ql2`, `tq-gv7`, `bam-qt-mb-nho`.
- Rule: `tab-badge`, `color-not-decorative-only`.
- Phương án: số xám = tổng, cạnh đó "⚠1" cam = quá hạn (cùng một kiểu cho mọi vai); `sr-only` đã đúng, chỉ cần phần nhìn.

### A1-14 "Chọn hết n" chọn cả thẻ chưa hiện — PHÁT HIỆN · P2 · QL, QT
- Vấn đề: ở Tổng quan chỉ hiện 3 thẻ; tích 1 thẻ Đề xuất PA → "Chọn hết 2 · Duyệt 1 yêu cầu"; "Chọn hết" lấy cả thẻ đang ẩn sau "Xem thêm" → duyệt thẻ chưa đọc.
- Bằng chứng: `bam-cd-tick` (thanh "Đã chọn 1 · Đề xuất PA · Chọn hết 2"); `HopChoDuyet.tsx:92, 144, 227-229` (`chonHet(ds…)` trên toàn bộ, không phải `dsHien`).
- Phương án: ở bản gọn, "Chọn hết" chỉ trong thẻ đang hiện, hoặc mở rộng danh sách trước khi chọn hết.

### A1-15 Case mở từ "Case chưa chốt PA quá hạn": nút chính sai việc — PHÁT HIỆN · P2 · QL (giao khu vực Case)
- Vấn đề: Case "trống PA" (việc cần: Thêm PA) mở panel có nút chính (xanh) "Hoàn thành Case", "+ Thêm PA" là nút phụ.
- Bằng chứng: `bam-mocase`, `d-375-mocase`.
- Phương án: nút chính theo việc tiếp của Case (Case trống PA → "+ Thêm PA").

### A1-16 Dòng Case trong "Cần bạn quyết" thiếu SOS + việc đang chờ — PHÁT HIỆN · P3 · QL
- Vấn đề: web "Lê Quang Huy · MB FT 101 / Phạm Thu Trang · Case trống PA / hạn 09/09 ⚠ quá hạn 5 ngày". Mockup: chip "SOS 2 · R, W" (bấm = giải thích) + "GVCN … · [PA chờ xác nhận]" + "PA 'Kèm 1-1 Reading' chờ GVCN xác nhận từ 08/10" + "⚠ quá hạn 4 ngày".
- Bằng chứng: `tq-ql2-p1`, `mk3-tq--a`. Lệch không lý do.
- Phương án: thêm chip SOS và một dòng "đang chờ gì, từ bao giờ" (dữ liệu đã có ở panel ⚠ quá hạn: "Thêm PA", "Ghi nhận xét", "Xác nhận Case").

### A1-17 Thông báo: lặp Chờ duyệt, giờ sai ngữ cảnh demo — PHÁT HIỆN · P3 · QL, QT
- Vấn đề: 30 chưa đọc; "Cần làm 13" có 8 dòng về chính các thẻ đang nằm ở "Cần bạn quyết" (7 "Chờ duyệt · …" + "Quá hạn duyệt · Đề xuất PA · Trần Thu Hà" — trùng thẻ với dòng "Chờ duyệt · Đề xuất PA · Trần Thu Hà"); mọi dòng "Công việc › Chờ duyệt"; giờ "Ghi nhận 20/10 16:36" trong khi hôm nay demo 14/09 (thông báo tạo theo giờ thật); nhãn nhóm IN HOA.
- Bằng chứng: `top-tb-ql2` (log đủ chữ), DB `created_at` 2026-10-20.
- Phương án: gom thông báo cùng loại cùng đích ("10 thẻ chờ duyệt ›"); dữ liệu demo tạo thông báo theo ngày demo.

### A1-18 Ô tìm toàn cục: chữ gợi ý thiếu "email", danh sách hẹp, không tìm GV — PHÁT HIỆN · P3 · mọi vai
- Vấn đề: tìm email đã chạy ("hv.j03" → Lê Quang Huy) nhưng chữ gợi ý "Tìm học viên, lớp…" (mockup 3/6: "Tìm lớp, học viên hoặc email…"); khung kết quả 288 px → tên, email, lớp xuống dòng giữa chừng; tối đa 6 HV / 4 lớp, không "xem thêm"; không tìm được GV; "Không tìm thấy học viên hoặc lớp" không gợi ý (bỏ dấu, email).
- Bằng chứng: `f-tim-ten` (phông đúng: "Bùi Khánh / Linh … MB / FOU 12" ba dòng), `top-tim-ft1`, `top-tim-email`, `top-tim-khong`; `Header.tsx:52-53, 61, 129, 137`.
- Rule: `search-accessible`, `truncation-strategy`, ux "No Results".
- Phương án: chữ gợi ý theo mockup; khung ≥ 26 rem, một dòng tên + dòng phụ; thêm nhóm "Giáo viên" (QL/QT).

### A1-19 Bảng "Lớp cần chú ý" rộng, cột xa, số kém nổi — XÁC NHẬN-ẢNH · P3 · QL, QT
- Vấn đề: bảng giãn hết 1 400 px (`tableLayout: fixed`, 6 cột tự co) → "HV" cách "Lớp" ~470 px; cột "Đã thi · chờ KQ" toàn 0 (demo); số bấm chỉ gạch chấm (mockup: ô viền); QT: hàng chi nhánh không bấm lọc được.
- Bằng chứng: ảnh 1, `tq-ql2-p2`, `tq-qt-macdinh-p2`; `TongQuanQl.tsx:139-143`; mockup `mk3-tq--b`.
- Phương án: giới hạn bề rộng cột số (vd 6–8 rem), số bấm có viền như mockup; bấm tên chi nhánh = lọc chi nhánh đó (1 bấm thay 2).

### A1-20 Tổng quan TVV / CX / Admin: ô lớn nhiều số 0, ba kiểu khác QL — PHÁT HIỆN · P3 · TVV, CX, Admin
- Vấn đề: TVV 5 ô (4 ô = 0) + nửa màn trống; không còn danh sách "Cần chú ý" (overhaul-3) → tra em phải 2 lần đổi trang. CX dùng ô chỉ số cũ chữ IN HOA, công tắc FT/LT nằm giữa trang (không đầu trang như QL), cột "Case chưa có PA" cạnh khái niệm "Case chưa chốt PA". Admin "GV chấm quá hạn … 3 ô" vs QL "Trễ chấm … 17 bài" (cùng khái niệm, hai tên, hai đơn vị); Admin không có dải "Mới dùng PISA?". Ô của TVV/CX/Admin là link đổi trang, số của QL mở panel.
- Bằng chứng: `tq-tvv23`, `tq-cx24`, `tq-admin22`, `mko3-tvv--tvv`, `mk-vai--admin`; `HocVienCuaToi.tsx:41-49`, `MockTestAdmin.tsx:31-60`, `OverviewPage.tsx:81-86`.
- Ghi chú: "Case chưa có PA" ở bảng chi nhánh là quyết định UX-1 (16/10), không tự đổi.
- Phương án: TVV thêm 5 dòng "Cần chú ý" ngay dưới ô (như overhaul-3, bấm tên mở hồ sơ); ô 0 thu nhỏ thành một dòng "0 Tạm dừng · 0 Sắp thi …"; thống nhất tên "Trễ chấm · bài".

### A1-21 Panel "Chốt lộ trình" toàn màn chưa thấy nút chốt; dòng ở Tổng quan thiếu tóm tắt — PHÁT HIỆN · P3 · QL
- Vấn đề: panel phủ cả thanh trên (rộng 1 440); phải chọn lộ trình từng em mới hiện "Chốt n em"; chip "Tất cả 7" có dấu ✓ đè viền góc (kiểu `NutChon`, khác kiểu ✓ trong `BoLocDoan`).
- Bằng chứng: `bam-chotlotrinh`, `d-375-chot`; `TongQuanQl.tsx:245`, `ui.tsx:520`.
- Phương án: dòng Tổng quan nói trước "đã đề xuất x/y" (A1-12); trong panel một nút "Chốt các em đã có đề xuất (x)" cố định ở chân.

### A1-22 Hồ sơ cá nhân: hai kiểu nút lưu, chữ giải thích dài — PHÁT HIỆN · P3 · mọi vai
- Vấn đề: "Lưu" ở chân thẻ, "Đổi mật khẩu" ở đầu thẻ; 5 câu giải thích (vd "…vì tự cấp cho mình thì bước duyệt thành vô nghĩa"); chữ gợi ý ô "Email khác" trông như dữ liệu thật; chip kỹ năng đang chọn có ✓ đè viền; rời trang khi đang sửa không hỏi (mất chữ).
- Bằng chứng: `top-hoso-gv10`, `top-hoso-ql2`, `top-375-hoso`; `ProfilePage.tsx:126-185`.
- Phương án: nút lưu cùng chỗ (chân thẻ) cho cả hai thẻ; bỏ câu lý do; chữ gợi ý "Ví dụ: …" mờ hơn; cảnh báo khi rời trang có nháp.

### A1-23 Menu tài khoản nặng; Hướng dẫn chỉ còn ở đây — PHÁT HIỆN · P3 · mọi vai
- Vấn đề: mục là nút viền cả hàng (mockup 1 khung 2a: dòng chữ); GV thấy 9 chip "Kỹ năng được phân công" + 3 chip GVCN; "Đăng xuất" cùng kiểu nút thường. Người mới đã bấm "Ẩn" dải thì chỉ còn đường Tên mình › Hướng dẫn (C11).
- Bằng chứng: `top-tk-gv10`, `top-tk-qt1`, `mk1-thanh--a`.
- Rule: `destructive-nav-separation`, `nav-hierarchy`.
- Phương án: mục dạng dòng; gập phạm vi / phân công vào "Phạm vi của tôi ›"; Đăng xuất tách cuối có vạch.

### A1-24 Thanh demo: ô ngày đổi máy chủ chung khi rời ô; hai chữ "Tài khoản" ở 375 — PHÁT HIỆN · P3 · chỉ bản demo
- Vấn đề: "Ngày demo" lưu ngay khi rời ô (`DemoBar.tsx:109-110`), đổi cho MỌI người dùng chung máy chủ, không hỏi; ô ngày native (không `ONgay`). 375: nút xanh "Tài khoản" (đổi tài khoản demo) cạnh vòng tròn "V" (menu tài khoản thật).
- Bằng chứng: `top-demo-congcu`, `tq-ql2-375-p1`.
- Phương án: nút "Áp dụng" + câu hỏi xác nhận; đổi chữ 375 thành "Đổi TK demo".

### A1-25 Logo không bấm được; "Mới dùng PISA? Xem" rời trang — PHÁT HIỆN · P3 · mọi vai
- Vấn đề: logo "PISA Tracking" là `div` (`App.tsx:199-207`), không về trang đầu như thói quen; "Xem" ở dải mở cả trang Hướng dẫn trong khi panel Hướng dẫn đúng màn đã có.
- Phương án: logo = link trang đầu của vai; "Xem" mở panel đúng màn (giữ link "Mở trang Hướng dẫn ↗" trong panel).

### A1-26 (Môi trường, KHÔNG phải lỗi web) ~32 lỗi 403 khi mở Tổng quan — XÁC NHẬN-ẢNH (khác nguyên nhân) · không xếp mức · mọi vai
- Kết luận: ~32 lỗi 403 **không phải** giao diện gọi API vai QT không được phép. Không có 403 nào từ `/api/` (đã ghi mọi phản hồi ≥ 400 kèm đường dẫn ở `index.jsonl`). Cả 403 là tệp phông `/@fs/D:/Github/Pisa-tracking/node_modules/@fontsource/{be-vietnam-pro,inter}/…woff(2)` — vai nào cũng có (QL 26, QT 32, CX 34, theo số độ đậm phông trang dùng).
- Nguyên nhân: `node_modules` của worktree là junction ra `D:\Github\Pisa-tracking\node_modules`, Vite chặn tệp ngoài thư mục được phép → `document.fonts` "error" (`bam-fonts`), trang chạy phông dự phòng.
- Trạng thái: điều phối đã thêm `fs.allow` tạm vào `vite.config` của worktree trong lúc rà → phông nạp đúng. Ảnh dùng để nhận xét kiểu chữ / bề rộng chữ / xuống dòng đã **chụp lại một lần** sau khi sửa (tiền tố `f-`); các nhận xét khác giữ ảnh cũ. Bản dựng thật không bị lỗi này.

### Đối chiếu mockup — tổng hợp lệch (Tổng quan + thanh trên)
| Chỗ | Mockup đã duyệt | Web | Có ghi lý do? |
|---|---|---|---|
| Thứ tự menu | Công việc đầu (mockup 3, 6; đặc tả §2) | Tổng quan đầu, Công việc thứ 5 | Không |
| Tên mục | "Báo cáo" (mockup 6 khung 10) | "Tổng quan" | Có (kế hoạch OV-15 §7, PR #463 e) |
| Tiêu đề trang | "Tổng quan" (mockup 3) | "Việc hôm nay" / "Mock Test" / "Số liệu" / "Học viên của tôi" | Không (nhãn tab cũ) |
| Đầu trang | 1 hàng, công tắc có số lớp, dải lọc dính (C10) | 3 hàng, ô form, không số lớp, không dính | Không |
| Phạm vi công tắc | cả trang ("Số khớp") | nửa trang | Có (tự quyết #463, #482) — trái mockup + CLAUDE.md |
| Dải HV cần chú ý | nút viền, bấm mở panel | gạch chấm, 4 số chết | Không (lỗi) |
| Chờ duyệt | hàng gọn, ? hạn duyệt, Hoàn tác 8 s, không ô tích / Mở | thẻ cao, ô tích, Mở (đổi trang), không hoàn tác | Không |
| Case quá hạn | chip SOS + việc đang chờ | tên · nhóm | Không |
| Chốt lộ trình | "đã đề xuất x/y" + tóm tắt | "n em chưa chọn" | Không |
| Tuần này | dải tuần + Chấm x/y + bảng Test tuần này | Lịch sắp tới OV-6a + L R W S | Không |
| Trễ chấm | Σ dòng = dải (58) | 53 ≠ 58, thêm dòng chấm chéo | Có (tự quyết #482) — trái mockup |
| Panel 1d | bảng + Hạn + ô Band + Mở bảng điểm | danh sách xem, không nhập | Không (vướng quyền) |
| Thanh trên | chuông có số, kính lúp, "…hoặc email…", số Công việc xám | chữ "Thông báo 30", không biểu tượng, số cam | Không |
| 375 thanh dưới | 5 mục | 6 mục | Không (Tutor thêm sau) |
| Bị bỏ hẳn | dải tuần + "Test tuần này", nhập band tại panel, Hoàn tác 8 s, số lớp trên công tắc, "?" hạn duyệt, chip SOS dòng Case, tóm tắt lộ trình | | |

---

## Phần 3. Đề xuất lớn — "Tổng quan = bàn giao ban một màn, một phạm vi"

**Hiện trạng:** ba nguồn phạm vi (URL `cn` / chi nhánh nhớ / "gộp hai khung") trên một trang; 8 số chết; 21 dòng quyết định dạng thẻ cao (QL), trang 2,5 màn (1440) / 5,3 màn (375); Tuần này không trả lời "tuần này chấm tới đâu".

**Đề xuất (theo mockup 3, không đổi luật nghiệp vụ):**
1. **Một bộ lọc:** đầu trang một hàng `Tổng quan · [Chi nhánh ▾] · [Tất cả | Fast Track n lớp | Lớp thường n lớp] · Dữ liệu đến · Báo cáo ›`, dính khi cuộn (C10). Một state `{cn, ct}` truyền xuống MỌI khối (dải, Chờ duyệt, Case, Chốt lộ trình, bảng, Tuần này, Trễ chấm) và mọi đường máy chủ. Mặc định "Tất cả" để không giấu việc khung kia (lý do gốc của Q5).
2. **Dải HV cần chú ý** nút viền; sửa khoá panel (A1-01); "⚠ n quá hạn" cùng tập với số Case bên cạnh.
3. **Cần bạn quyết dạng hàng gọn** (lưới mockup): mỗi nhóm tối đa 5 dòng quá hạn trước + "Xem tất cả n ›" (mở rộng tại chỗ); mọi "Mở" mở panel tại chỗ (NganCase / panel lộ trình); "Nếu duyệt" có ngày; Hoàn tác 8 s nếu chủ SP đồng ý (câu hỏi 8).
4. **Tuần này theo mockup 3:** dải 6 tuần (Trước · tuần này · 3 tuần tới: Test · HV · Chấm x/y · ⚠) + bảng "Test tuần này" + Trễ chấm cùng hàm với dải.
5. **Thanh trên:** Công việc đầu; số xám + "⚠ n" cam; chuông có số; tìm "lớp, học viên hoặc email" (+ GV với QL/QT); thiếu chỗ (≤ ~1 300 px) gom "Thêm ▾"; 375 ≤ 5 nút.
6. **Thông báo:** 3 loại tự động vào "Cần làm"; gom theo loại + đích.

**Số bước trước → sau (QL Monbay, sáng):**
| Việc | Trước | Sau |
|---|---|---|
| Biết hôm nay phải quyết gì | cuộn ~2,5 màn (1440) / 5,3 màn (375); thấy 14/21 dòng, 3 thẻ đầu | ≤ 1 màn (1440), nhóm có số + 5 dòng đầu |
| Xem danh sách "12 chưa điểm" | bấm dải (chết) → cuộn → bấm số từng lớp: 2 bấm + cuộn | 1 bấm |
| Duyệt 10 thẻ cần xem PA | 1 (Xem thêm) + 10 × (Mở → đổi trang → Duyệt → ‹ Tổng quan) ≈ 31 bấm, 20 lần đổi trang | 1 + 10 × (Mở panel → Duyệt) ≈ 21 bấm, 0 đổi trang |
| Duyệt 10 thẻ không cần xem | 1 + 10 = 11 bấm | 1 + 10 = 11 bấm (hoặc chọn nhiều) |
| Biết số trễ chấm đúng | đọc 58 và 53, tự suy | một số, Σ dòng = dải |
| QT: toàn hệ thống → Monbay | 2 bấm (ô chọn) + rủi ro danh sách sai khi quay lại | 1 bấm (bấm hàng "Monbay") hoặc 2 bấm, danh sách luôn đúng |
| Chốt lộ trình 1 lớp FOU 7 em | 1 (mở panel toàn màn) + 7 × "Chọn lộ trình" + chốt ≈ 16 bấm (bản chất nghiệp vụ) | như cũ, nhưng dòng Tổng quan nói trước "đã đề xuất x/y" để biết lớp nào chốt nhanh |

**Workflow khác (hiện trạng, không cần đổi lớn):**
| Việc | Bước hiện tại | Chỗ kẹt / đề xuất nhỏ |
|---|---|---|
| TVV / CX tra một em | bấm ô tìm → gõ ≥ 2 chữ → chọn (2 bấm, 1 đổi trang); phím ↓ + Enter chạy | khung kết quả hẹp, tên xuống 3 dòng (A1-18); từ ô "Cần chú ý" của Tổng quan TVV: 2 bấm, 2 lần đổi trang (overhaul-3: 1 bấm) — A1-20 |
| Người mới tìm hướng dẫn | dải "Mới dùng PISA? Xem" (1 bấm, sang trang) — chỉ tới khi bấm Ẩn; sau đó: Tên mình → Hướng dẫn → "Chỉ cho tôi" (3 bấm, panel tại chỗ) | phải đoán Hướng dẫn nằm trong menu tên mình; nội dung hứa số dải bấm được (đang hỏng) — A1-01, A1-23 |
| QL nhắc trễ chấm | 0 bấm (thông báo tự động, C03) | nhưng thông báo nằm "Để biết" (A1-04); panel bài trễ chỉ xem (A1-06) |

**Rủi ro:** đổi `/tong-quan/quan-ly` nhận `ct` → phép kiểm OV-15d/h1 (Σ, ≤ 7 ngày) phải viết lại; trần câu SQL/đường (`tocDoDuong.ts`) — tính lại khi lọc theo khung; dải tuần cần một GET mới hoặc mở rộng `/tong-quan/ql` (trần 100 câu). Đổi thứ tự menu ảnh hưởng ảnh sổ tay PDF.

**Điểm cần chủ SP quyết:** câu hỏi 1, 2, 3, 4, 8 ở Phần 4.

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

**Câu hỏi:**
1. QL có được **nhập thay** bài trễ chấm ngay ở Tổng quan (mockup 1d) không? Hiện quyền `score.edit` chỉ có GV, nên panel chỉ xem được.
2. Công tắc chương trình: thêm **"Tất cả"** (mặc định) và cho **mọi khối** Tổng quan theo cùng công tắc — thay luật cũ "Cần bạn quyết luôn gộp hai khung" (PR-VAI-a Q5)?
3. Tiêu đề trang của mục "Tổng quan" có thống nhất là "Tổng quan" cho mọi vai (bỏ "Việc hôm nay / Mock Test / Số liệu / Học viên của tôi")?
4. Thứ tự menu có làm theo mockup 3/6 (Công việc đầu) không?
5. "Mở hộp duyệt ›" từ Tổng quan đang lọc Monbay: mở hộp theo Monbay, hay giữ luật 06/10 "hộp luôn mở Tất cả chi nhánh"?
6. Hướng dẫn: giữ chỉ trong menu tài khoản (C11) hay thêm lối "?" nhỏ cạnh tiêu đề trang cho người mới?
7. Ba loại thông báo tự động (Chốt lộ trình, Quá hạn chấm, Case chưa chốt PA quá hạn) xếp nhóm "Cần làm" — xác nhận?
8. Mockup 3 có "Hoàn tác · 8 s" sau Duyệt, còn luật Q15 ghi "quyết định không hoàn tác". Theo cái nào?

**Ảnh cần thêm [CẦN ẢNH]:**
- Một tài khoản nắm ≥ 2 vai (QL kiêm GV): menu tài khoản mở "Góc nhìn" + dải "Góc nhìn: … · Về Quản lý" + chuông khi đang ở vai GV.
- Laptop thật của chủ SP ở cỡ cửa sổ hay dùng (1 280–1 366 px): thanh trên còn đủ mục không (A1-05).

---

## Phần 5. Ảnh tiêu biểu

(Ảnh `f-` chụp sau khi phông Be Vietnam Pro nạp đúng.)
1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a1\f-qt-mb-nho-p1.png` — tái hiện ảnh 1: lọc Monbay, "Chờ duyệt 10" nhưng thẻ BC / CP.
2. `…\scratchpad\anh\a1\bam-dai-chualich--mo.png` — bấm "3 chưa lịch Test": không panel (số chết).
3. `…\scratchpad\anh\a1\f-tq-ql2-p2.png` — Lớp cần chú ý bảng giãn, Tuần này "L R W S", Trễ chấm 53 vs dải 58.
4. `…\scratchpad\anh\a1\f-ql2-thuong-p1.png` — đổi sang Lớp thường: dải vẫn "⚠5 · 58 · 4 GV".
5. `…\scratchpad\anh\a1\mk3-tq--a.png` — mockup 3: đầu trang một hàng, Cần bạn quyết dạng hàng gọn.
6. `…\scratchpad\anh\a1\mk3-tq--b.png` — mockup 3: Tuần này dải tuần + Chấm x/y (web không có).
7. `…\scratchpad\anh\a1\f-tre-dong--mo-dong.png` — panel "17 bài trễ chấm": dòng "Nhập điểm" nhưng chỉ "Xem hồ sơ ↗".
8. `…\scratchpad\anh\a1\f-tb-ql2--mo.png` — chuông: Chốt lộ trình ở "Để biết", giờ "Ghi nhận 20/10".
9. `…\scratchpad\anh\a1\f-top-1280-qt.png` — 1 280 px: mục "Tutor" bị cắt (800 px: `f-top-800`).
10. `…\scratchpad\anh\a1\f-tq-ql2-375-p1.png` — 375: thẻ quyết đầu tiên, nút Duyệt dưới màn đầu.
11. `…\scratchpad\anh\a1\f-cd-tick--tick.png` — "Chọn hết 2" chọn cả thẻ đang ẩn.
12. `…\scratchpad\anh\a1\top-hd-chi--chi.png` — Hướng dẫn "Chỉ cho tôi" tốt (khoanh dải) — nhưng số trong dải không bấm được.

(`…` = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b`)
