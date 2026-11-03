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
