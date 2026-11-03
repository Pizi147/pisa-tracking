# AUDIT-UX-B — Tổng quan · Học viên & Lớp · Test · Phân tích · phần còn lại (đợt 1, 03/11)

Session AUDIT-UX-B (Opus 5.5 · high). **Chỉ rà + đề xuất + mockup, không sửa code.**
Mốc: `main` 4e1c0ed83 (sau #827) · web demo cục bộ, `npm run seed` mới (ngày demo 14/09/2026) · ảnh chủ SP = bản chạy 30/10 (Cẩm Phả, tài khoản QT nhiều vai, ngày 03/11).
Nguồn đọc: `CLAUDE.md` · `plan.md` 1.6 + mục 4 "03/11 tối" · `00` (bản audit chủ SP, toàn bộ mục 1–22) · `01-chia-session.md` · đánh giá 20/10 (mục 0–5, quyết định vòng 1–3) · `DESIGN.md` Luật V5 + 21/10.

**Ảnh U01–U10 có trên máy:** `D:/Download/Pisa tracking web/cac trang/` (10 tệp đúng tên mục 19.1 của `00`) — `01-chia-session.md` ghi "chưa gửi" là cũ. Đã xem U04, U05, U06, U08, U09.

Nhãn kết quả: **TÁI HIỆN** (thấy trên main) · **ĐÚNG MÃ** (mã cố ý như vậy; vấn đề là chữ / cách trình bày) · **ẢNH** (chỉ thấy trong ảnh chủ SP, chưa bấm trên main) · **CHƯA KIỂM**.

## 1. Tóm tắt dễ hiểu

1. **Số đúng nhưng chữ dễ hiểu sai** là vấn đề lớn nhất của 5 màn này, không phải số sai: "15/49 HV đủ dữ liệu" thật ra là "15 đạt / 49 em đủ dữ liệu" (còn em chưa đủ dữ liệu bị giấu); "Việc đúng hạn" chỉ đếm việc Ghi kết quả PA nhưng đứng cạnh cột "Quá hạn" đếm bài chấm Test; "0 bài quá hạn" nổi to cạnh "3 bài của GV khác".
2. **Một lỗi đếm thật:** Học viên & Lớp tính cả em "Kết thúc học, chờ KQ thi" vào sĩ số lớp → MB FT 101 "34 HV" ở HV & Lớp nhưng "33 HV" ở Tổng quan / hồ sơ lớp; tab "Tất cả 104" nhưng bộ đếm máy chủ 103.
3. **Tên không đúng nghĩa:** "GV cần chú ý" là bảng **mọi** GV chi nhánh (có người 100 % đúng hạn, 0 quá hạn). Hai ô cạnh nhau cùng chữ "Chi nhánh" ở HV & Lớp là **Phạm vi** (ô không nhãn) + **chi nhánh cụ thể**.
4. **Số lặp trên cùng màn Tổng quan:** cùng một số hiện ở ô chỉ số + cột phải + Điều hướng (Chờ duyệt 12 hai lần; "38 chưa PA" hai lần; "0 HV thi tháng này" hai lần; GV "56 việc" hai lần).
5. Menu tài khoản chỉ cao ở tài khoản **nhiều vai** (liệt kê Phạm vi + GVCN + mọi kỹ năng phân công); QL một vai gọn. Nút Đăng xuất dính đáy, không mất.

## 2. Bảng xác minh

| ID | Mức | Nguồn (file:dòng) | Vai / lối vào | Cách tái hiện | Kết quả | Tác động |
|---|---|---|---|---|---|---|
| B01 (U09, U08) | P2 | `web/src/modules/worklist/TongQuanV5.tsx:290-292, 369-370, 398-399` (`tuMau(d.datMt, 'HV đủ dữ liệu')`); `datMt.chuaDu` có trong API nhưng không hiện | QL, QT, CX, Admin · Tổng quan ô "Đạt MT" | QT demo: API `datMt {dat 3, mau 4, chuaDu 8}` → ô ghi "3/4 HV đủ dữ liệu" | **TÁI HIỆN** (chữ) | Đọc thành "3 trong 4 em có đủ dữ liệu"; 8 em chưa đủ dữ liệu biến mất khỏi màn |
| B02 (U09 ↔ U08) | — | Tổng quan kỳ mặc định 2 tuần vừa qua (`tongQuanV5.ts` `ky`); Phân tích cùng mặc định (`shared/domain/baoCaoPhanTich.ts:2`) | QT · Tổng quan "31 % 15/49" vs Phân tích "31 % 27/86" | Ảnh: Tổng quan "kỳ W4 OCT – W5 OCT", Phân tích chọn tay W1 OCT → W5 OCT | **ĐÚNG MÃ** — hai kỳ khác nhau, 31 % trùng ngẫu nhiên (30,6 % / 31,4 %). Không phải lỗi | Chỉ cần nhãn kỳ ở ô chỉ số rõ hơn (B01) |
| B03 (U09) | P2 | `TongQuanV5.tsx:241-275` (`GvCanChuY` = nguyên bảng `/phan-tich/giao-vien` chi nhánh, "không xếp hạng, không ngưỡng" C08) | QL, QT · Tổng quan | QL Vy demo: 7/7 GV hiện, gồm Võ Mỹ Duyên 100 %, 0 quá hạn | **TÁI HIỆN** | Tên "cần chú ý" gắn cho người không có vấn đề |
| B04 (U09) | P2 | `server/src/phanTich/giaoVien.ts:49, 535-536` ("Việc đúng hạn" = tập Ghi kết quả PA; Báo PH chưa vào) · cột "Quá hạn" = `d.tre` bài chấm Test quá hạn (`TongQuanV5.tsx:248-251`) | QL, QT · Tổng quan "GV cần chú ý › Hành chính"; Phân tích GV | Ảnh: "0 % · 0/17 việc" cạnh "Quá hạn 0" | **ĐÚNG MÃ** (hai đơn vị khác nhau, cột "Quá hạn" không ghi "bài" khi = 0) | Người đọc nghĩ 17 việc trễ mà "0 quá hạn" là mâu thuẫn |
| B05 (U09) | P3 | `web/src/modules/platform/Header.tsx:400-427` (Phạm vi được cấp · GVCN · Kỹ năng được phân công) | Tài khoản nhiều vai (ảnh: QT có 5 vai, 2 GVCN, 11 kỹ năng) | QL Vy: menu 1 dòng Phạm vi, gọn (đã bấm) · ảnh QT: menu cao ~760 px, che nửa phải trang | **TÁI HIỆN** (QL gọn) + **ẢNH** (QT cao) | Chỉ vai nhiều phân công; Đăng xuất vẫn dính đáy (`sticky bottom-0`) |
| B06 | P3 | `TongQuanV5.tsx:283-300` + cột phải "Chờ bạn duyệt" + "Điều hướng" | QL · Tổng quan | QL Vy: "Chờ duyệt 12" (ô) + "Chờ bạn duyệt 12 đề xuất" (cột); "38 chưa PA" (ô) + "38 Case chưa có PA ›"; "Thi tháng này 0" + "0 HV thi tháng này ›" · GV Hà: "Việc của tôi 56" + "56 việc của tôi ›" | **TÁI HIỆN** | Một số đọc 2–3 lần; dòng Điều hướng "0 HV thi tháng này ›" dẫn tới danh sách rỗng |
| B07 | P3 | Tổng quan GV "Kỹ năng tôi dạy" cột Chờ chấm, "Lớp tôi chủ nhiệm" cột Dưới kỳ vọng | GV · Tổng quan | GV Hà: "⚠ 11 quá hạn", "1 hạn 23/09", "Dưới kỳ vọng 13" — không đơn vị | **TÁI HIỆN** | Trái V13 "đơn vị luôn ghi" (bài / HV) |
| B08 (U04) | P2 | `web/src/modules/students/StudentsPage.tsx:357-369` (`<select aria-label="Phạm vi">` không nhãn hiện + `OChiNhanh`) · `shared/domain/hocVienLop.ts:187` | QT, QL nhiều chi nhánh, TVV, CX · HV & Lớp | Ảnh: "[Chi nhánh ▾] [Chi nhánh Cẩm Phả ▾]" — ô 1 là Phạm vi đang chọn "Chi nhánh" | **ĐÚNG MÃ** (xác nhận nghĩa) · QL một chi nhánh không có ô | Hai ô cùng chữ, khác việc |
| B09 (U04) | P2 | `server/src/classes/hocVienLop.ts:330-341` (OV-11g: em `finished` chưa lưu trữ hiện mờ ở lớp cuối, chỉ "Tất cả"); `dem` (`demLoc`) không tính em này | QL, GV · HV & Lớp | QL Vy demo: MB FT 101 "34 HV" (Tổng quan "33 HV", `studentCount` = 33, DB 33 ghi danh đang học); tab "Tất cả 104" ↔ `dem['tat-ca']` 103 · GV Hà 70 ↔ 69. Em thừa: Ngô Thanh Tùng (Kết thúc học, chờ KQ thi) | **TÁI HIỆN** | Cùng lớp hai sĩ số; số tab ≠ số máy chủ |
| B10 (U04) | P3 | `StudentsPage.tsx` dải lớp | QL · HV & Lớp | Lớp gập mặc định; hàng tiêu đề cột (Học viên · Lộ trình · MT gần nhất …) vẫn hiện khi mọi lớp gập; hàng lớp tóm tắt chạy ngang qua cột; phân trang vẽ trên + dưới | **TÁI HIỆN** | Bảng nhìn lệch khi gập; phân trang lặp (B-04 cũ) |
| B11 (U04) | P3 | dải chip lọc | QL · HV & Lớp | "Đã thi · chờ kết quả · 0" vẫn là nút bấm | **TÁI HIỆN** | Trái G6 "số 0 không bấm" |
| B12 (U04) | P2 | cột Việc | QT (ảnh) | Tên việc cắt "…", "+1 việc", "Xem thêm 2" trong ô; chưa bấm thử đọc đủ bằng bàn phím / chạm | **ẢNH** · **CHƯA KIỂM** bấm | Đọc đủ phụ thuộc rê chuột? (cần kiểm ở mockup / PR) |
| B13 (U06) | P2 | `web/src/modules/test/lichTest/DaiSo.tsx:9-33` (số = bài của CHÍNH người có phân công; bài GV khác ghi nhạt) | QT nhiều vai · Lịch Test tuần | Ảnh: "0 bài quá hạn · 3 bài của GV khác" ngay trên "Quá hạn chấm · 2 lớp · 3 bài" | **ĐÚNG MÃ** | Số 0 to dễ đọc lướt thành "không ai quá hạn" |
| B14 (U06) | P3 | lưới Lịch Test | QT (ảnh) | "Chờ 1 kỹ năng" + dòng "1 kỹ năng" lặp; cột W gộp trống ô viền chấm; nút "Thu" (nơi khác "Thu gọn"); nhóm quá hạn chỉ thiếu S vẫn mở đủ L/R/W1/W2/W/S | **ẢNH** · **CHƯA KIỂM** trên main | Mắt phải lọc cột không liên quan |
| B15 (U05) | P2 | Kế hoạch Test ô MT | QT (ảnh) | Ô MT 5 dạng (tuần + tick 4 môn + điểm / "đã xếp" / "chưa xếp" / "chờ chấm" / 2 tuần khi môn khác tuần); "vào muộn" dưới tên; tên cắt "Hoàng Trần Ngọc Mi…"; "Xếp MT4" + "+ MT ▾" | **ẢNH**. "+ MT" = thêm MT kế / S Ex (N10) — **ĐÚNG LUẬT** | Ô cao thấp khác nhau, khó quét cột |
| B16 (U08) | P2 | Phân tích › Báo cáo HV "Kết quả MT" | QT (ảnh) | MT0 18 HV: Đạt 1 (13 %) · Thiếu 0.5 0 · Thiếu 1.0 6 (75 %) · ≥1.5 1 (13 %) · Chưa đủ 10 → % tính trên 8 em đủ dữ liệu (1/8 = 12,5 %), không ghi ở đâu | **ẢNH** (số học khớp) · mã **CHƯA KIỂM** | Người xem tưởng 13 % của 18 em |
| B17 (U08) | P3 | cột "So lượt trước" | QT (ảnh) | "↑ 1 · = 2 · ↓ 2" không đơn vị, không nói so Overall hay so kỳ vọng | **ẢNH** | Mục 20 U08 ý 4 |
| B18 (U09) | — | badge Công việc QL | QL Vy | Tên đọc màn: "12 thẻ cần duyệt, 1 quá hạn · mọi chi nhánh" | **TÁI HIỆN** — thuộc U01 (badge 32 / 33), **chuyển UX-A** | — |

### Đợt 2 (03/11) — Test · Phân tích · phần còn lại · 375 (Playwright cục bộ, demo 14/09; script ở scratchpad, không commit)

| ID | Mức | Nguồn (file:dòng) | Vai / lối vào | Cách tái hiện | Kết quả | Tác động |
|---|---|---|---|---|---|---|
| B19 (U06) | P2 | `web/src/modules/cham/LuoiFT.tsx:476-481` (`Chờ {x} kỹ năng`) + `scopeNote` dòng dưới | GV Hà (dạy L, R) · Lịch Test tuần MB FT 101 | Cột Kết quả "Chờ 4 kỹ năng" ở mọi em, kể cả khi phần của GV đã xong; ảnh QT: "Chờ 1 kỹ năng" + "1 kỹ năng" | **TÁI HIỆN** (CV-12 cũ còn) | GV không biết còn chờ ai; chữ lặp |
| B20 (U06) | P2 | lưới Lịch Test | GV Hà | Ô kỹ năng của GV khác (W1, W2, S) để trống không viền — giống hệt ô "không thi"; ô của mình viền đứt; Hồ Ngọc Diệp (MT1 vắng) lại có W1 / W2 / S viền đứt | **TÁI HIỆN** · vì sao Diệp có ô W / S nhập được: **CHƯA KIỂM** | Trống mang 3 nghĩa (GV khác · không thi · chưa tới lịch) |
| B21 (U06) | P3 | đầu khối "Test tuần này" | GV Hà | "5 lớp · 0 đã chấm xong" nhưng 6 dòng (MB FOU 12 có Progress + Final) | **TÁI HIỆN** | Đơn vị "lớp" ≠ dòng "lượt" |
| B22 (U05) | P2 | `web/src/modules/test/keHoach/LuoiKeHoach.tsx` ô MT | QL Vy · Kế hoạch Test MB FT 105 | Một ô: "W1 SEP L✓ R✓ W✓ S · trễ chấm" (✓ = môn đã có điểm) và "W4 AUG L✓R✓W✓S✓ ✓ 5.5" (✓ trước điểm = đạt kỳ vọng) | **TÁI HIỆN** | Cùng dấu ✓ hai nghĩa trong một ô (mục 20 U05 ý 2) |
| B23 (U05) | P3 | `LuoiKeHoach.tsx:125-127` | QL Vy | Cột "+ MT" không tiêu đề nhìn thấy; tên đọc màn của cột cuối là "Trống" | **TÁI HIỆN** | Trình đọc màn đọc "Trống" |
| B24 (U05) | P2 | `KeHoachTestTab.tsx:46, 141-148` (chip "Cần xếp lại" = kỹ năng vắng / phần thi đã huỷ) | QL Vy | Lớp gập hết; "MT2 chưa xếp 4 em" chỉ là chữ xám bên phải hàng lớp, không lọc được | **TÁI HIỆN** → chủ SP chốt G5 | — |
| B25 (U08) | P2 | Phân tích › Báo cáo HV "Kết quả MT" | QL Vy | MT1 8 HV: Đạt 1 (33 %) · Thiếu 0.5 1 (33 %) · Thiếu 1.0 1 (33 %) · Chưa đủ 5 → % trên 3 em đủ dữ liệu, không ghi | **TÁI HIỆN** (khớp B16 ảnh) | — |
| B26 (U04, 375) | P2 | `StudentsPage.tsx` 375 | QL Vy · 375 | Điều khiển (khung, Xuất, tab, ô tìm, 3 chip, phân trang, Mỗi trang) chiếm ~600 px trước lớp đầu; hàng tab cắt "Lịch thi", "Phân công GV" khuất | **TÁI HIỆN** | 375 phải cuộn gần một màn mới thấy lớp |
| B27 (U04) | P3 | dải chip TVV / CX | TVV Hương · CX Tâm | TVV: "Tạm dừng 0 · Sắp thi 0 · Có việc quá hạn 0 · Đã thi · chờ kết quả 0" vẫn là nút; TVV "Cần chú ý 4" = "Tất cả 4" | **TÁI HIỆN** (số 0); "Cần chú ý = Tất cả": định nghĩa **CHƯA KIỂM** | B11 mở rộng |
| B28 | P3 | `ProfilePage.tsx` | QT · Hồ sơ cá nhân | Câu giải thích dài dưới ô ("…vì tự cấp cho mình thì bước duyệt thành vô nghĩa") | **TÁI HIỆN** (A1-22 cũ còn) | Trái V6 (ⓘ thay câu) |
| B29 | P3 | `HoSoGiaoVienPage.tsx` ô "Đúng hạn" | QT · Hồ sơ GV Hà | "56 % · 39/70 bài Test · Việc 0 %" — một ô hai đơn vị | **TÁI HIỆN** | Cùng gốc B04 |
| B30 | — | `App.tsx:335` (`/tutor/*` → `/`) | mọi vai | Không còn link tới Tutor trong `web/src` ngoài route chuyển hướng | **KHÔNG TÁI HIỆN** link sót | — |
| B31 | — | Hướng dẫn QL "Tổng quan + Chờ duyệt mỗi sáng" | QL Vy · /huong-dan | "bấm số mở danh sách chỉ đọc" — sau G4 / V11 cần sửa chữ | **ĐÚNG MÃ** → đợt 6 (Hướng dẫn) | — |

Tổng quan QL 375 = 3 353 px (~4,1 màn) — sát ngân sách ≤ 4 màn. Hồ sơ GV đã có sẵn Vai · Kỹ năng · GVCN · Lớp đang dạy → G3 không mất thông tin.

## 3. Đề xuất bỏ / gộp / chuyển (chờ chủ SP — `00` 22.1)

| # | Hiện ở đâu | Bất tiện | Làm sao (khuyến nghị) | Tìm lại ở đâu | Ảnh hưởng |
|---|---|---|---|---|---|
| G1 | HV & Lớp: ô Phạm vi (không nhãn) + ô Chi nhánh | Hai ô cùng chữ "Chi nhánh" | **Gộp thành MỘT ô "Xem"**: Lớp tôi dạy / HV của tôi (TVV) · từng chi nhánh · Mọi chi nhánh (CX, QT) — chỉ mục vai có quyền | Cùng chỗ; URL giữ `phamVi` + `cn` | Không đổi quyền / dữ liệu; −1 điều khiển. **Gộp** |
| G2 | Tổng quan QL / QT: "GV cần chú ý" | Tên nói "cần chú ý" mà hiện mọi GV | **Đổi tên "Giáo viên · {kỳ}"**, giữ đủ bảng, xếp GV có bài chấm quá hạn lên đầu (không ngưỡng, không gắn nhãn người) | Cùng chỗ; đầy đủ ở Phân tích › GV | Không bỏ dữ liệu. Lọc "chỉ ngoại lệ" cần định nghĩa ngưỡng → nghiệp vụ, không khuyến nghị |
| G3 | Menu tài khoản: GVCN + Kỹ năng được phân công | Tài khoản nhiều phân công: menu ~760 px | **Chuyển** hai khối sang Hồ sơ GV (đã có link trong menu); menu giữ tên · vai / phạm vi (1 dòng mỗi vai) · lối phụ · giao diện · đăng xuất | Hồ sơ GV › đầu trang | Không đổi quyền; đọc lại phân công tốn thêm 1 bấm. **Chuyển** |
| G4 | Tổng quan: khối "Điều hướng" lặp số của ô chỉ số | Cùng số 2–3 lần; "0 HV thi tháng này ›" dẫn tới rỗng | **Bỏ số trong dòng Điều hướng** (chỉ còn tên đích + "›"); giữ ô chỉ số + cột Chờ bạn duyệt | Ô chỉ số (bấm số mở panel) | Chỉ giảm chữ lặp. **Giảm mở sẵn** |

Không đề xuất bỏ: dải "Mới dùng PISA?" (đã có nút Ẩn), "+ MT", lưới Lịch Test đầy đủ (giữ cho chế độ nhập bảng — mục 20 U06 ý 2).

## 4. Sửa không cần hỏi (đúng luật đã chốt; đưa vào PR khi chủ SP duyệt mockup)
- B01: ô Đạt MT ghi "3/4 HV · 8 chưa đủ dữ liệu" (V13 + `00` mục 8 "mẫu số").
- B04: đổi nhãn cột "Việc đúng hạn" → "Kết quả PA đúng hạn"; "Quá hạn" → "Bài chấm quá hạn" (ghi "bài" cả khi 0).
- B07: thêm đơn vị (bài / HV) ở Tổng quan GV.
- B09: sĩ số lớp = em đang học (như `studentCount`); em kết thúc chờ KQ thi ghi riêng "· 1 đã kết thúc"; tab "Tất cả" = `dem` máy chủ.
- B11: chip lọc số 0 không bấm.
- B13: "Bạn quá hạn: 0 bài · GV khác: 3 bài".

## 5. Rà panel (mục 8) — phần màn UX-B

| Họ panel | Lối mở | Đã kiểm | Còn thiếu |
|---|---|---|---|
| Panel số Tổng quan (`?so-lieu=` / `OSo`) | ô chỉ số, Lớp cần chú ý, GV | đọc mã nguồn số (B01–B04) | chưa bấm từng ô so số dòng panel = số ô (G7) |
| Panel một em (HV & Lớp) | tên / Việc | — | chưa bấm |
| Hộp chấm Lịch Test | ô điểm | — | chưa bấm; giữ Tab / Enter / dán |
| Hộp lịch MT (Kế hoạch Test) | ô MT | — | chưa bấm |
| Panel số Phân tích | số ở Báo cáo HV | — | chưa bấm; B16 mẫu số |

## 6. Ma trận phủ (mục 9, phần UX-B) — đợt 1

| Hàng | Đọc mã | Gọi API | Bấm thử main | Còn thiếu |
|---|---|---|---|---|
| Đăng nhập / phiên / đổi góc nhìn | một phần (`/demo/session`) | ✓ | ✓ vào nhanh demo | 401 / hết phiên, đổi góc nhìn QT, deep link F5 |
| Tổng quan + menu tài khoản | ✓ (`TongQuanV5.tsx`, `Header.tsx`) | ✓ QT, QL, GV, Admin, TVV, CX | ✓ QL (1440), GV (1440, chữ) | TVV / CX / Admin / QT bấm; 375; panel số |
| Học viên & Lớp | ✓ (`StudentsPage.tsx`, `hocVienLop.ts`) | ✓ QL, GV, TVV, CX | ✓ QL 1440 | GV / TVV / CX bấm; 375; mở lớp, panel một em, lọc + Quay lại |
| Lịch Test tuần | một phần (`DaiSo.tsx`, `LuoiFT.tsx`) | — | ✓ GV, QL 1440 (đợt 2) | nhập điểm, Tab / Enter / dán, lưu lỗi, tuần khác, lớp thường |
| Kế hoạch Test | một phần (`KeHoachTestTab.tsx`, `LuoiKeHoach.tsx`) | — | ✓ QL 1440 mở một lớp (đợt 2) | hộp lịch MT, xếp hàng loạt, dời / huỷ / khôi phục, GV chỉ xem, 375 |
| Chấm Test / nhập điểm | — | — | ✓ GV danh sách Chấm Test (chỉ đọc) | hộp chấm, dán Excel, lưu lỗi |
| Lưu trữ / Đã xoá | — | — | ✓ QL trang Lưu trữ (chỉ đọc) | Quay lại học, Mở lại lớp, Đã xoá của QT |
| Phân tích / Báo cáo | một phần (`giaoVien.ts`) | — | ✓ QL Báo cáo HV 1440 | 5 tab còn lại, panel số, In, xuất |
| Hồ sơ GV / cá nhân | — | — | ✓ QT (chỉ đọc) | sửa / lưu, vai khác chi nhánh |
| Quản trị | — | — | ✓ QT tab Tài khoản (chỉ đọc) | các tab khác, thao tác lớn |
| Hướng dẫn / EN / xuất tệp / link Tutor | link Tutor ✓ (B30) | — | ✓ QL Hướng dẫn | EN, nội dung tệp xuất |
| 375 | — | — | ✓ QL Tổng quan + HV & Lớp (tối) | sáng, các màn Test, Phân tích |

**Chưa "rà toàn bộ":** chưa lưu / sửa thật (không đổi dữ liệu dùng chung), chưa bấm panel số, chưa EN, chưa chế độ sáng, chưa zoom 125 / 200 %. Phần này để mockup + PR từng màn tự kiểm.

## 7. Mục 21 — phần màn UX-B (đợt 1)
| Thành phần | Thấy ở | Đề xuất |
|---|---|---|
| Bộ đếm | B01, B07, B09, B16 | luôn đơn vị; tử / mẫu nói rõ "đạt / đủ dữ liệu"; số chưa đủ dữ liệu hiện cạnh |
| Kỳ và thời điểm | B02 | ô chỉ số ghi kỳ ngắn ngay dưới số (đã có "trong kỳ"), đầu trang ghi khoảng tuần (đã có) — giữ |
| Bộ lọc | B08, B11 | cùng trường cùng tên; số 0 không bấm |
| Bảng | B10 | tiêu đề cột chỉ hiện khi có lớp mở; một thanh phân trang |
| Nút và menu | B05 | menu theo việc thường dùng, phân công ở Hồ sơ GV |

## 8. Để PTA
- `01-chia-session.md` ghi ảnh U01–U10 "chưa gửi" — đã có ở `D:/Download/Pisa tracking web/cac trang/`. Báo các session khác.
- B18 (badge Công việc QL = thẻ duyệt mọi chi nhánh) → UX-A (U01 badge 32 / 33).
- Mẹo cho session khác: DB demo cục bộ cũ thiếu bảng (`doi_phan_cong`) → `npm run seed` trước khi bấm thử.

## 9. Chủ SP chốt 03/11 (đợt 1) — cả bốn theo khuyến nghị
- **G1** HV & Lớp: gộp ô Phạm vi + Chi nhánh thành MỘT ô "Xem" (chỉ mục vai được quyền; quyền / dữ liệu không đổi).
- **G2** Tổng quan QL / QT: "GV cần chú ý" → đổi tên "Giáo viên · {kỳ}", giữ đủ GV, GV có bài chấm quá hạn lên đầu; không ngưỡng, không gắn nhãn người.
- **G3** Menu tài khoản: chuyển khối GVCN + Kỹ năng được phân công sang Hồ sơ GV; menu giữ tên · vai / phạm vi · lối phụ · giao diện · Đăng xuất.
- **G4** Tổng quan: bỏ số trong khối Điều hướng (chỉ tên đích + "›"); số giữ ở ô chỉ số.
- **G5** (đợt 2) Kế hoạch Test: **bỏ chip "Cần xếp lại"** — chủ SP: "vắng theo quy chế 2 lần liên tiếp là huỷ, không 'cần xếp lại'"; chỉ còn MỘT lọc **"Chưa có MT kế tiếp"**; Kế hoạch Test **lọc được theo lớp**.
  Ghi chú cho PR: em vắng lần 1 mà không dời được tuần kế vẫn có thẻ "Dời lịch Test" ở Công việc QL (N4) và phần thi đã huỷ khôi phục qua "Khôi phục" (N4) → bỏ chip không mất đường xử lý; PR kiểm lại hai đường này trước khi gỡ.

## 10. Bảng ý → mockup (chủ SP 03/11 "Dừng, làm lại": lập bảng TRƯỚC, PTA duyệt rồi mới vẽ)

### 10.1 U04 Học viên & Lớp
Nguồn: `00` mục 20 U04 (ý 1–6, Nghiệm thu) · mục 12 · mục 21 (dòng chạm màn) · mục 22.1 / 22.2 · N32 ①–⑤ · B08–B12, B26, B27 · bài học UX-A ("tách rõ trường thông tin, bớt chữ liền mạch").
Cột cuối = đối chiếu mockup #849 (`thiet-ke/v11/hoc-vien-lop.html` bản đã đẩy): **KHỚP** · **MỘT PHẦN** · **THIẾU**.

| # | Ý (trích ngắn · mục) | Làm gì trong mockup (khu / thành phần, chữ thật) | Giữ / bỏ / đổi · vì sao | Hỏi chủ SP | #849 |
|---|---|---|---|---|---|
| 1 | Giữ bảng làm giao diện chính; ưu tiên cột nhận diện, tình trạng, hành động; bản gọn / chi tiết chỉ "nếu thử nghiệm cho thấy cần" · U04 ý 1 | Bảng nhóm theo lớp; cột: Học viên · Lộ trình · MT gần nhất · Hỗ trợ · Ý thức · Lịch thi · Việc · ⋯ | GIỮ bảng; KHÔNG thêm công tắc bản xem (luật chủ SP ít điều khiển; ý 2 giải bằng panel một em) | — | KHỚP |
| 2 | Điểm từng môn chỉ ở bản học thuật hoặc khi mở dòng; tra cứu nhanh chỉ kết quả chính + dấu hiệu cần hỗ trợ · U04 ý 2 · 22.1 | Hàng em chỉ còn Overall + kỳ vọng + lượt; chip SOS ghi môn yếu. Bấm ô Overall (ô số) → **dải mở ngay dưới hàng em**: L · R · W1 · W2 · S của lượt đó (màu + ✓ / ✗ trên từng số) | ĐỔI = giảm mở sẵn, không xoá · **chủ SP 03/11: rời hàng em, mở dưới hàng / hộp tại chỗ, KHÔNG panel trượt** | ~~Q-a~~ đã trả lời | THIẾU |
| 3 | Việc: việc ưu tiên + hạn + tổng còn lại; bấm mở đúng danh sách của em; đọc đủ không cần hover · ý 3 | 1 việc gấp nhất đủ chữ (xuống dòng, không "…") + `ChipHan` "hạn 03/11" / "⚠ hạn 27/10"; ô số "+2 việc" mở panel một em mục Việc | ĐỔI — bỏ "Xem thêm n" mở dài trong ô (B12) | — | KHỚP |
| 4 | Thu / mở tất cả theo phạm vi, nhớ khi quay lại; tìm tên tự mở nhóm chứa kết quả · ý 4 | **Một nút đổi chữ** "Mở tất cả" ↔ "Thu gọn tất cả" cạnh bộ đếm (lớp trên trang đang xem); lớp đã mở nhớ ở URL; tìm ≥ 2 chữ → chỉ lớp có em khớp, tự mở, tô hồng; mặc định **gập hết** (chủ SP 03/11) | GIỮ + THÊM một nút | — | MỘT PHẦN |
| 5 | Phân biệt phạm vi với chi nhánh; bộ lọc đang áp có tóm tắt + xoá dễ thấy · ý 5 | Ô "Xem ▾" (G1) · dòng "Đang lọc: Có việc quá hạn · Cẩm Phả · Fast Track — 43 HV ở 12 lớp · Bỏ lọc" cho cả chip và tìm | ĐỔI — G1 (N32 ①) | — | MỘT PHẦN (chỉ vẽ cho tìm tên; chip lọc ở bản chưa đẩy) |
| 6 | Cột tên đủ nhận diện, ghim khi cuộn ngang; ⋯ là thao tác phụ; hành động chính không giấu hết vào menu · ý 6 | Tên đủ (xuống dòng); ghim cột tên < 1440; hành động chính trên hàng = nút tên việc (làm) · tên em (hồ sơ); ⋯ giữ menu N26 | GIỮ | — | KHỚP |
| 7 | Nghiệm thu: tìm HV giữa nhiều lớp → mở việc → Quay lại đúng bộ lọc / dòng; đủ tên dài; hiểu số MT không mở nhiều lớp · U04 | Khu C + chú thích Quay lại; **nhãn tự hiểu, không nút "Cách đọc bảng"**: Lộ trình "MT 2/3" (dòng phụ "Target 8.0"); MT gần nhất "✗ 7.0" + dòng phụ "kỳ vọng 7.5 · MT2 · W4 SEP" (bỏ chữ tắt "KV") | ĐỔI · PTA 03/11: không thêm chữ thừa | — | MỘT PHẦN |
| 8 | Phân cấp 3 tầng trang → khối → trường; không toàn chữ nhỏ xám · mục 12 | Trang: tiêu đề 22 / 700 · khối = hàng lớp nền `surface-2`, mã lớp 15 / 700 · trường: giá trị 15 đậm, nhãn / phụ 13 `text-dim` | GIỮ token V8 | — | MỘT PHẦN (xem #9) |
| 9 | **Bài học UX-A: tách rõ trường thông tin, bớt chữ liền mạch** | Hàng lớp: mỗi trường một ô thẳng cột với bảng em — [mã lớp] [**7** HV · 1 đã kết thúc] [GVCN Nguyễn Hoàng Dũng] [SOS] [việc lớp]; ô MT gần nhất: **✗ 7.0** to · "KV 7.5" nhãn riêng · "MT2 · W4 SEP" dòng phụ; bỏ chuỗi "a · b · c · d" một dòng | ĐỔI — chuỗi "·" dài là điều chủ SP chê ở UX-A | — | THIẾU (hàng lớp + ô MT còn chữ liền mạch) |
| 10 | Một hành động chính mỗi vùng; nút phụ nhóm rõ · mục 12 | Đầu trang: chính "+ Thêm học viên" (nền nhấn); "Xuất Excel · n HV", ⋯ phụ | GIỮ | — | KHỚP |
| 11 | Không giấu dữ kiện quan trọng trong tooltip hover-only · mục 12 | Không ⓘ / title mang nghĩa; việc đủ chữ; hạn ngày thật; dải điểm mở bằng bấm / Enter / chạm | ĐỔI | — | MỘT PHẦN |
| 12 | Xem hồ sơ ≠ làm việc · mục 12 | Tên em = link hồ sơ (rê: gạch chân, không ↗); tên việc = nút làm việc tại chỗ | GIỮ | — | KHỚP |
| 13 | Bảng desktop so sánh; mobile tra cứu, không card cao nhiều màn · mục 12 | 375: thẻ em ≤ 4 dòng (tên + ⋯ · TVV · lộ trình · Overall · SOS + Case/PA · Ý thức · Lịch thi · 1 việc); điều khiển gom vào "Lọc" | ĐỔI — B26 | — | MỘT PHẦN (thẻ 6–7 dòng) |
| 14 | Kiểm 375 / 768 / 1280 / 1440, zoom, sáng / tối, tên dài, dày / rỗng · mục 12 | 1440 + **1280** (cuộn ngang, ghim tên) + 375; nút đổi sáng / tối mọi khung; tên dài "Nguyễn Quốc Trung Anh Khoa"; khu rỗng | THÊM khung 1280 | — | MỘT PHẦN (thiếu 1280) |
| 15 | Trạng thái có chữ / biểu tượng ngoài màu · mục 12, 21 Màu | ✓ / = / ✗ trước Overall; ⚠ trước hạn quá; chip SOS có chữ mức + môn | GIỮ | — | KHỚP |
| 16 | Bộ đếm luôn có đơn vị · mục 21 | "7 HV", "3 việc quá hạn", "1 bài chờ chấm", "+2 việc", "194 HV · 23 lớp" | GIỮ | — | KHỚP |
| 17 | Hạn: ngày rõ, quá hạn theo giờ VN · mục 21 | `ChipHan`: "hạn 03/11" · "⚠ hạn 27/10" (không "quá hạn 7 ngày") | ĐỔI | — | MỘT PHẦN ("⚠ 27/10" thiếu chữ "hạn") |
| 18 | Tuần ≠ W1 / W2 Writing · mục 21 | Hết nhầm: dòng 5 môn rời hàng em (#2); trong dải dưới hàng có tiêu đề "MT2 · W4 SEP" rồi mới tới L · R · W1 · W2 · S | ĐỔI theo #2 | — | THIẾU |
| 19 | Điểm: nguồn MT, kỳ vọng so sánh · mục 21, mục 8 | "✗ 7.0 · KV 7.5 · MT2 · W4 SEP" — KV là của chính lượt | GIỮ | — | KHỚP |
| 20 | Rỗng và thiếu: không dùng "—" cho tất cả · mục 21 | **Giữ "—" ở ô một nghĩa** (Hỗ trợ = không SOS, Ý thức = chưa vi phạm, Việc = không việc); **chỉ dùng chữ ở ô nhiều nghĩa**: MT "Chưa có Overall" (khác "chưa thi"), Lịch thi "Chưa có tháng thi" / "Chưa chốt ngày" | GIỮ "—" · PTA 03/11: không thêm chữ thừa | — | KHỚP |
| 21 | Bộ lọc cùng tên, đang áp, xoá, quay lại giữ ngữ cảnh · mục 21 | = #5; chip số 0 mờ không bấm (B11) | ĐỔI | — | KHỚP |
| 22 | Focus / bàn phím: không kích hoạt hàng khi bấm nút con · mục 21 | Hàng lớp bấm cả hàng để mở / gập; ⋯ và mã lớp (link) không mở / gập hàng | GIỮ — ghi chú cho PR | — | THIẾU ghi chú |
| 23 | Trạng thái hệ thống: tải / rỗng / lỗi / **không quyền** / hết phiên khác nhau · mục 21 | Khu F: rỗng đúng phạm vi · đang tải khi đổi Xem (dữ liệu cũ mờ) · lỗi tải lại giữ dữ liệu cũ + giờ · **mất quyền chi nhánh** (403): bỏ dữ liệu cũ, câu "Bạn không còn quyền xem {chi nhánh}" + về phạm vi mặc định | THÊM khung không quyền | — | MỘT PHẦN (thiếu không quyền) |
| 24 | EN cùng chức năng, không cắt chữ · mục 21 | Ghi chú: kiểm EN ở PR (nhãn dài nhất "Open all classes on this page") | ghi chú | — | THIẾU ghi chú |
| 25 | Học viên & Lớp: bản tra cứu gọn + cách đọc đủ học thuật / task · 22.2-3 | **Dải mở dưới hàng em** (thay panel một em ở mockup): điểm 5 môn của lượt (#2) + mọi việc của em (mỗi việc một dòng: tên · hạn · nút làm) — "+2 việc" mở cùng dải này | ĐỔI · chủ SP 03/11 không panel trượt | — | THIẾU |
| 26 | Ô "Xem" thay hai ô "Chi nhánh" · N32 ① (G1) | Khu B: menu theo vai, số HV mỗi mục | ĐỔI | — | KHỚP |
| 27 | Mọi lớp gập mặc định · chủ SP 03/11 | Khu A0 mặc định gập hết; khu A ghi "đã bấm mở 2 lớp" | GIỮ như web | — | MỘT PHẦN (bản chưa đẩy) |
| 28 | TVV / CX giữ "+ Thêm học viên" / tạo lớp · chủ SP 03/11 | Khu E giữ nút | GIỮ | — | KHỚP |
| 29 | B09 sĩ số = em đang học | Hàng lớp "7 HV" (**bỏ "· 1 đã kết thúc"**); em Kết thúc học: dòng mờ cuối lớp + thẻ "Kết thúc học" (**bỏ câu "Không tính vào sĩ số lớp"**) | SỬA đếm (AUDIT-LOI) · PTA 03/11 bớt chữ | — | MỘT PHẦN |
| 30 | B10 tiêu đề cột khi mọi lớp gập | Tiêu đề cột chỉ trong lớp đang mở; 1440 không cuộn ngang → tiêu đề dính khi cuộn trang | ĐỔI | — | MỘT PHẦN (sticky hỏng vì bọc cuộn ngang) |
| 31 | B11 chip số 0 · B27 TVV chip | Chip 0 mờ không bấm; **bỏ chip "Cần chú ý" với TVV** (chủ SP 03/11) | ĐỔI | ~~Q-b~~ đã trả lời | MỘT PHẦN |
| 32 | SOS một kiểu xuyên màn · mục 21 (đồng bộ Tổng quan V8) | Hàng lớp: chip mức + số HV, mức 0 không vẽ | ĐỔI | — | KHỚP |
| 33 | Phân trang · B-04 cũ | Chỉ cuối bảng | ĐỔI | — | KHỚP |

**Câu hỏi:** Q-a, Q-b đã có câu trả lời (plan.md 4 · "Chủ SP trả lời 03/11 tối"). Góp ý PTA áp ở #4, #7, #20, #25, #29 + bảng 10.1b.
**Sửa mockup:** #2, #4, #7, #9, #11, #13, #14, #17, #18, #22–#25, #29–#31 + bảng 10.1b vào khu G.

### 10.1b U04 — kiểm kê thao tác TRƯỚC → SAU (mọi thao tác của màn; khu G mockup chép bảng này)
| Thao tác | Ở đâu (main 03/11) | Sau | Giữ / bỏ / đổi · vì sao |
|---|---|---|---|
| + Thêm học viên | nút chính đầu trang (375: trong ⋯ trang); QL, QT, Admin, TVV, CX | như nay | GIỮ (TVV / CX — chủ SP 03/11) |
| Xuất Excel · n HV | đầu trang, chọn em trong ngăn Xuất | như nay; số = tập đang lọc | GIỮ |
| ⋯ trang: + Lớp mới · Lưu trữ (n) | đầu trang | như nay | GIỮ |
| Ô Phạm vi + ô Chi nhánh | đầu trang | một ô "Xem" | ĐỔI — G1 (N32 ①) |
| Fast Track / Lớp thường | đầu trang | như nay, đoạn chọn có số | GIỮ |
| Tab Tất cả · Đang SOS · Lịch thi · Phân công GV | dưới đầu trang | như nay (375 cuộn ngang) | GIỮ |
| Tìm học viên, lớp | hàng lọc | như nay + lớp có kết quả tự mở | GIỮ + ý 4 |
| Chip Thi tháng này · Có việc quá hạn · Đã thi · chờ KQ · Bộ lọc thêm | hàng lọc | như nay; số 0 mờ không bấm; TVV bỏ "Cần chú ý"; 375 vào "Lọc" | GIỮ · bỏ một chip TVV (chủ SP) |
| Mở / gập một lớp | ▸ hàng lớp | như nay + bấm cả hàng | GIỮ |
| Mở / Thu gọn tất cả | — | một nút đổi chữ | THÊM (ý 4) |
| Chip hàng lớp (n chờ duyệt · n bài chờ chấm · Test tuần này · n HV chưa chốt lộ trình · việc quá hạn) — bấm sang đúng trang | hàng lớp | như nay | GIỮ |
| ⋯ lớp: Hồ sơ lớp · Nhập điểm · + Học viên | hàng lớp | như nay | GIỮ |
| Mã lớp → hồ sơ lớp · tên em → hồ sơ HV | hàng lớp / hàng em | như nay | GIỮ |
| ⋯ hàng em: + Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm │ Sửa thông tin · Chuyển lớp (N26) | hàng em | như nay | GIỮ |
| Bấm tên việc → làm tại chỗ | cột Việc | như nay | GIỮ |
| "Xem thêm n" (mở dài trong ô) | cột Việc | ô số "+n việc" mở dải dưới hàng | ĐỔI (ý 3) |
| Dòng 5 môn L · R · W1 · W2 · S | ô MT gần nhất | bấm ô Overall → dải dưới hàng | ĐỔI (ý 2, chủ SP 03/11) |
| Phân trang 10 / 20 / 50 | trên + dưới bảng | chỉ dưới | ĐỔI (bỏ bản lặp) |
| Chọn nhiều · Sửa cả lớp | **không có ở màn này** (ở Hồ sơ lớp / Lưu trữ) | không đổi | — |

### 10.2 U05 Kế hoạch Test (CHƯA vẽ — chờ PTA duyệt bảng)
Nguồn: `00` mục 20 U05 (ý 1–6, Nghiệm thu) · mục 12 · mục 21 (dòng chạm màn) · 22.2-4 (Test) · N4 · N9 · N10 · N14 · N15 · N23 · N32 ⑤ (G5) · B22–B24 · ảnh U05 · bài học UX-A (tách trường, bớt chữ liền mạch) · luật PTA 03/11 "không thêm chữ thừa".
Cột cuối = hiện trạng main 03/11 (đã bấm thử QL Vy, MB FT 105 — đợt 2).

| # | Ý (trích ngắn · mục) | Làm gì trong mockup (khu / thành phần, chữ thật) | Giữ / bỏ / đổi · vì sao | Hỏi chủ SP | Hiện trạng |
|---|---|---|---|---|---|
| 1 | Giữ ma trận HV × lượt MT; mỗi ô = **tuần / lượt → trạng thái chính → ngoại lệ**; điểm cũ, chi tiết môn mở tại chỗ · U05 ý 1 | Ô MT 3 tầng cố định: dòng 1 tuần "W1 SEP" · dòng 2 trạng thái một chữ (bảng #3) · dòng 3 chỉ khi có ngoại lệ ("S · W2 OCT", "vắng → W2 NOV"). Bấm ô → hộp kỹ năng sẵn có (4 môn, điểm, dời / huỷ / khôi phục) | ĐỔI dáng ô, GIỮ hộp kỹ năng | **Q-c** bỏ hàng chip "L✓ R✓ W✓ S" khỏi ô (chỉ hiện môn có ngoại lệ; đủ 4 môn ở hộp kỹ năng)? Khuyến nghị: bỏ | ô 5 dạng, cao thấp khác nhau (ảnh U05) |
| 2 | Tách trạng thái xếp lịch khỏi kết quả học thuật; một dấu ✓ không nhiều nghĩa · ý 2 | Dòng 2 trạng thái lịch bằng CHỮ (Chưa xếp · Đã xếp · Đang làm bài · Chờ chấm · Đã huỷ); kết quả học thuật chỉ là điểm "✓ 5.5" / "✗ 5.0" (màu trên số, G12) khi lượt đã có Overall | ĐỔI — B22: nay "L✓" = môn có điểm, "✓ 5.5" = đạt kỳ vọng trong cùng ô | — | TÁI HIỆN (B22) |
| 3 | Bảng trạng thái ô (Nghiệm thu: phân biệt chưa xếp, đã xếp, đang thi / chờ chấm, hoàn tất, huỷ, vắng) | Chưa xếp: nút "Xếp MT2" (viền đứt) · Đã xếp: "W3 NOV" + "Đã xếp" · Đang làm bài: "W1 NOV · tuần này" · Chờ chấm: "Chờ chấm S" · Hoàn tất: "✓ 5.5" / "✗ 5.0" · Đã huỷ: "Đã huỷ" (chữ mờ) · Vắng lần 1: dòng 3 "vắng → W2 NOV" (N4, `chuDoiVang`) | ĐỔI — một bảng chữ cho mọi ô, không chỉ màu | — | màu + chip, chữ không đủ |
| 4 | Môn thi khác tuần: một dòng rõ "W thi bù W1 NOV"; không đổi luật gộp W · ý 3 | Dòng 3 "S · W2 OCT" (chỉ môn lệch tuần); W vẫn gộp W1 + W2 một lịch (luật lịch giữ) | ĐỔI chữ · GIỮ luật | — | hai tuần chồng trong ô (ảnh: "W1 OCT L R W / W3 OCT S") |
| 5 | Nút tại ô "Xếp MT4" khi là lượt kế; "Thêm lượt Test" cho thao tác khác; giữ bulk + sửa ngoại lệ từng em · ý 4 | Ô lượt kế chưa có lịch: nút "Xếp MT4" · cuối hàng em: "+ MT ▾" (MT kế ngoài mặc định · S Ex — N10, chỉ QL / Admin / QT) — cột có tiêu đề nhìn thấy "Thêm" (B23) · "Xếp nhiều MT…" giữ ở đầu trang | GIỮ hai nút (khác việc) · ĐỔI tiêu đề cột | — | cột "+ MT" không tiêu đề, đọc màn "Trống" (B23) |
| 6 | Bản xem "Cần xếp / cần xếp lại", đưa tới ô có việc; lịch sử xa thu gọn được · ý 5 · **G5** | Chip **"Chưa có MT kế tiếp · n"** (thay "Cần xếp lại") → chỉ lớp / em chưa có lịch MT kế, ô đó viền nhấn · **lọc theo lớp**: ô tìm gợi ý lớp, chọn thành chip "Lớp: CP FT 130 ✕" | ĐỔI — G5 (N32 ⑤); vắng lần 1 đã tự dời (N4), không còn hàng "cần xếp lại" | — | chỉ chip "Cần xếp lại (n)"; "MT2 chưa xếp 4 em" là chữ xám (B24) |
| 7 | Ghim tên + tiêu đề khi cuộn; MT6+ , tên dài, lớp đông; ô không thành card lớn · ý 6 | Cột Học viên ghim trái (đủ tên, xuống dòng, không "…"); hàng tiêu đề MT1…MTn dính; dữ liệu mẫu có MT6 và 17 HV | ĐỔI — tên cắt "Hoàng Trần Ngọc Mi…" (ảnh) | — | tên cắt (ảnh) |
| 8 | Nghiệm thu: thao tác cả lượt không nhầm xoá điểm / sửa một môn · U05 | Hộp kỹ năng: hai khối tách — "Cả lượt MT3" (Dời cả lượt · Huỷ cả lượt) và "Từng môn" (L · R · W · S: dời / Vắng / Bỏ khỏi đợt); huỷ cả lượt khi đã có điểm → hộp xác nhận nêu "giữ điểm L, R đã chấm" | GIỮ thao tác · ĐỔI xếp nhóm | — | CHƯA KIỂM (chưa mở hộp kỹ năng đợt 2) |
| 9 | Đầu lớp: bộ đếm có đơn vị, đúng tập · mục 21 Bộ đếm | Hàng lớp tách trường (bài học UX-A): ô mã lớp · ô "10 HV" · ô GVCN · ô tóm tắt **"MT1 đang làm bài"** · ô **"Chưa có MT kế tiếp · 4 em"** (ô số, bấm = lọc lớp đó) | ĐỔI — nay một chuỗi xám "MT1 đang làm bài · MT1 chưa xếp 1 em · 4 em cần xếp lại" | — | TÁI HIỆN |
| 10 | Tuần lịch "W1 NOV" ≠ "W1 / W2" Writing · mục 21 Tuần | Ô MT dùng tên môn "W" (gộp) — không ghi "W1 / W2" trong ô; tuần luôn kèm tháng "W1 NOV" | GIỮ luật W gộp | — | KHỚP |
| 11 | Rỗng và thiếu: chưa xếp / không thi / vắng / huỷ khác nhau, không "—" cho tất cả · mục 21 | "—" chỉ cho lượt không áp dụng (em vào sau MT đó); chưa xếp = nút "Xếp MTn"; huỷ = "Đã huỷ"; vắng = dòng 3 | ĐỔI | **Q-d** bỏ chữ "vào muộn" dưới tên (ô MT không áp dụng đã ghi "—")? Khuyến nghị: bỏ | "vào muộn" dưới nhiều tên (TST-07) |
| 12 | Một hành động chính / vùng; nút phụ nhóm rõ · mục 12 | Đầu trang: chính "Xếp nhiều MT…" · phụ "Xuất Excel" · "Xuất điểm Test" | GIỮ | — | KHỚP |
| 13 | Phân cấp 3 tầng; không toàn chữ nhỏ xám · mục 12 | Trang 22 / 700 · hàng lớp nền `surface-2` 15 / 700 · ô: tuần 13 / 600 · trạng thái 14 · ngoại lệ 12 `text-dim` | ĐỔI cỡ chữ trong ô (nay nhiều chip 11–12 px) | — | ô dày ký hiệu nhỏ |
| 14 | Không giấu dữ kiện trong hover · mục 12 · TST-05 | ⓘ "Luật xếp lịch Test" giữ (giải thích luật, không phải dữ kiện); trạng thái ô bằng chữ, không cần rê | GIỮ ⓘ luật | — | KHỚP một phần |
| 15 | Bảng desktop so sánh; mobile tra cứu · mục 12 | 375: chọn một lớp → danh sách em, mỗi em một thẻ: tên · MT kế "Xếp MT2" / "Đã xếp W3 NOV" · lượt gần nhất "✓ 5.5 · MT1"; ma trận đủ ở ≥ 768 | ĐỔI 375 | — | CHƯA KIỂM 375 |
| 16 | Kiểm 1440 / 1280 / 375, sáng / tối, dày / rỗng · mục 12 | 1440 tối + 375 sáng + khung 1280; lớp 17 HV, MT6; rỗng "Không lớp nào chưa có MT kế tiếp" | THÊM khung | — | — |
| 17 | Trạng thái có chữ ngoài màu · mục 12, 21 | Ô trễ chấm: chữ "Chờ chấm S · trễ" + ⚠ (nay chỉ nền đỏ cả ô) | ĐỔI | — | ô nền đỏ (đợt 2) |
| 18 | Khoá đổi lịch T6 → CN · N15 | Khi khoá: ô vẫn mở hộp; nút dời / huỷ / xếp mờ + một dòng "Khoá đổi lịch T6 – CN" trong hộp (chữ sẵn có) | GIỮ luật | — | KHỚP (chữ sẵn có) |
| 19 | GV chỉ xem Kế hoạch Test; GVCN dời MT cũ · N23 | Vai GV: không "Xếp nhiều MT…", không "+ MT", không chip "Chưa có MT kế tiếp"; ô mở hộp chỉ xem; GVCN: hộp có "Dời" cho tuần đã qua | GIỮ quyền | — | KHỚP (chip Chỉ xem) |
| 20 | Xếp MT nới lỏng: chỉ nhắc "MT2 W sau MT3", không chặn; không xếp tuần đã qua · N9 | Nhắc trong hộp xếp (chữ sẵn có) — ô không thêm chữ | GIỮ | — | KHỚP |
| 21 | Đủ số MT mặc định thôi nhắc xếp thêm · N14 | Em đã đủ (LT 3 / RF 2): ô sau cuối không nút "Xếp MTn", không vào chip "Chưa có MT kế tiếp"; "+ MT" vẫn có | GIỮ luật | — | KHỚP |
| 22 | Bulk + lỗi một phần · 22.2-4 · mục 13 | Khung "Xếp nhiều MT…" (ngăn sẵn có): xem trước → lưu → "Đã xếp 14 em · 2 em không xếp được (lý do từng em)" giữ chọn phần lỗi | GIỮ · vẽ trạng thái lỗi một phần | — | CHƯA KIỂM |
| 23 | Trạng thái hệ thống: tải / rỗng / lỗi / không quyền · mục 21 | Đổi chi nhánh: bảng cũ mờ + "Đang tải…"; lỗi tải lại giữ dữ liệu + giờ; GV không lớp: chữ sẵn có "Bạn không có lớp nào để xem lịch Test" | GIỮ chữ sẵn có | — | KHỚP chữ |
| 24 | Bộ lọc cùng tên, đang áp, xoá · mục 21 | Dòng "Đang lọc: Chưa có MT kế tiếp · Lớp CP FT 130 · Bỏ lọc"; Fast Track / Lớp thường như HV & Lớp | ĐỔI | — | chưa có tóm tắt lọc |
| 25 | Ghi chú lớp · ghi chú lịch | "+ Ghi chú lớp" cuối bảng lớp (sẵn có) | GIỮ | — | KHỚP |

**Câu hỏi gom cho chủ SP (qua PTA):** **Q-c** bỏ hàng chip "L✓ R✓ W✓ S" khỏi ô MT, ô chỉ còn tuần + trạng thái + môn có ngoại lệ; đủ 4 môn xem ở hộp kỹ năng (bấm ô) — khuyến nghị: bỏ (giảm mở sẵn, không xoá; hết ✓ hai nghĩa) · **Q-d** bỏ chữ "vào muộn" dưới tên em (ô MT không áp dụng ghi "—") — khuyến nghị: bỏ.
**Lọc theo lớp (G5):** tôi chọn cách ít điều khiển nhất — ô tìm sẵn có gợi ý lớp, chọn thành chip "Lớp: … ✕" (không thêm ô chọn mới). PTA thấy khác thì sửa dòng #6.

### 10.2b U05 — kiểm kê thao tác TRƯỚC → SAU
| Thao tác | Ở đâu (main 03/11) | Sau | Giữ / bỏ / đổi · vì sao |
|---|---|---|---|
| Fast Track / Lớp thường | đầu bảng | như nay | GIỮ |
| Chip "Cần xếp lại (n)" | đầu bảng | **bỏ** → chip "Chưa có MT kế tiếp · n" | ĐỔI — G5 (PR kiểm thẻ "Dời lịch Test" + Khôi phục trước khi gỡ) |
| Chi nhánh ▾ (QT / QL nhiều chi nhánh) | đầu bảng | như nay | GIỮ |
| Tìm lớp, học viên hoặc email | đầu bảng | như nay + chọn lớp thành chip lọc | GIỮ + G5 lọc theo lớp |
| ⓘ Luật xếp lịch Test | đầu bảng | như nay | GIỮ |
| Xuất Excel · Xuất điểm Test | đầu trang | như nay | GIỮ |
| Xếp nhiều MT… (ngăn xếp hàng loạt: lớp, đợt, em, tuần, xem trước) | đầu trang | như nay + trạng thái lỗi một phần | GIỮ |
| Mở / gập lớp | hàng lớp | như nay | GIỮ |
| Bấm ô MT → hộp kỹ năng (tuần từng môn, Dời, Vắng, Bỏ khỏi đợt, Huỷ, Khôi phục, Lịch sử, Mở hồ sơ MT) | ô | như nay, nhóm "Cả lượt" / "Từng môn" | GIỮ · ĐỔI xếp nhóm |
| Nút "Xếp MTn" tại ô lượt kế | ô | như nay | GIỮ |
| "+ MT ▾" (MT kế · S Ex) | cuối hàng em | như nay, cột có tiêu đề "Thêm" | GIỮ · sửa B23 |
| Khôi phục kết quả đã huỷ (QL) | hộp | như nay | GIỮ |
| + Ghi chú lớp · Lịch sử ghi chú | cuối bảng lớp | như nay | GIỮ |
| Tên em → hồ sơ HV · mã lớp → hồ sơ lớp | hàng | như nay | GIỮ |
| GV: xem lớp mình dạy, chỉ xem (N23) | — | như nay | GIỮ |
