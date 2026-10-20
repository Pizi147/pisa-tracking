# V2A — Góp ý vòng 2, nhóm I (Học viên & Lớp): I.1 · I.2 · I.3 · I.4 · I.5 · I.6 + mở rộng toàn web

Người rà: agent **v2a** (Opus 5.5). Chỉ đánh giá, không sửa repo, không đổi dữ liệu demo. Web http://localhost:5173 (API 4000), ngày demo **14/09/2026**, mã `main` (worktree plan-ux-danh-gia).
Ảnh: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2a\` (94 tệp, nhật ký `index.jsonl`). Spec + script: `…\scratchpad\chup\v2a-*.json|mjs|cjs`.
Số đo DOM: `…\chup\v2a-dom.mjs` (chỉ đọc; bỏ ô tick bằng CSS trong trình duyệt để mô phỏng). Kiểm kê chữ "thi": `…\chup\v2a-thi.tsv` (549 chuỗi) → phân loại `…\chup\v2a-thi-loai.tsv`.
Nhãn: [ĐÃ CHỐT] chủ SP chốt — chỉ bàn cách làm · [ĐỀ XUẤT] · [ĐÃ KIỂM] · [GIẢ THUYẾT] (+ cách kiểm) · [CẦN ẢNH]. Mã cũ (A3-xx, A5-xx, A7-xx, X1–X11, 9.2-n, 10.x) dẫn tới tài liệu 20/10 — không lặp lại.

---

## Tóm tắt 10 dòng

1. **Bộ lọc thời gian (I.1):** web có **5 dáng chọn thời gian** cho cùng một việc "xem các tuần" (14 chỗ dùng, kiểm kê ở V2A-01). Đề xuất **một thành phần `Khoảng tuần`**: hai ô tuần trên cùng dải lọc, đổi là áp dụng, không hộp, không nút "Áp dụng". Đổi khoảng: 5 thao tác → 1–2.
2. Bỏ "Theo tháng" thì **lỗi P0 "ra tháng trước" (A5-01) mất luôn**. Chỉ cần đọc đúng các link cũ. Việc này làm được ở GĐ1, không cần mockup.
3. **Thuật ngữ (I.2 + I.5):** có **~295 chuỗi dùng chữ "thi" cho Test** (Mock, Progress, Final), so với ~208 chuỗi đúng nghĩa thi thật. Nhiều nhất: "Tuần thi" 79 · "Đã thi" 46 · "phần thi" 43 · "Không dự thi" 23 · "Dời lịch thi" 20. Thuật ngữ đã chốt 01/10 (C-028, C-035, C-036), Rulebook và mockup 4 **đang mâu thuẫn** với luật mới.
4. **"Cần làm" (I.3): khuyến nghị BỎ góc này** (giữ hướng 9.2-14). Lý do: 4/4 tình huống thật đều ít bước hơn khi bỏ. Lối thay thế: chip "⚠ n quá hạn" trên hàng lớp **mở rộng tại chỗ**. Việc của **TVV** (chưa có trang Công việc) chuyển về Tổng quan TVV.
5. **Ô tick (I.4):** đo được ô tick chỉ làm bảng cao thêm **0,5 %** (2 323 → 2 311 px / 33 hàng). Hàng dày là do ô nhiều dòng (A3-06), không do ô tick. Ô tick vẫn chiếm 12 % cột tên và 34 điều khiển lặp. Hiện **không làm được** việc "xuất cả chi nhánh bỏ 2 em", vì "Chọn tất cả" chỉ lấy lớp đang mở.
6. → **Khuyến nghị phương án 3:** bỏ ô tick khỏi bảng (= A) và **chọn / bỏ em ngay trong panel Xuất**. Cùng một chỗ cho mọi danh sách: Tất cả, Đang SOS, Lịch thi.
7. **Lịch thi (6.1):** mỗi hàng có 4 nút Kết luận + 1 ô ghi chú (34 nút / 10 hàng); thanh tháng có 12 nút. Đề xuất: hàng 1 dòng có **chip trạng thái lịch thi** + 2 việc ("Chốt ngày" · "Dời tháng"), chi tiết mở ngay dưới hàng; nhóm theo trạng thái.
8. **"Cần xác nhận" (6.2):** có trong mã, nghĩa là "đã bàn nhưng còn chờ phụ huynh / HV". Nhưng nó **không đổi lịch, không sinh việc, không ai phụ trách**, nên về đầu ra **bằng "chưa có kết luận"**. Khuyến nghị bỏ nút này, lý do ghi vào "Ghi chú". Dải đếm đang **cộng sai** (ghi "1 HV" nhưng đếm thành 2).
9. **Tháng / ngày thi (6.3):** cơ sở dữ liệu đã hỗ trợ đủ (tháng · tuần · ngày). Lỗi gốc **P1 [ĐÃ KIỂM — mã]**: hết tháng dự kiến mà chưa có ngày, máy tự coi em **"Đã thi · chờ KQ"** và giao GVCN việc nhập kết quả có hạn (`tongKetLoTrinh.ts:118-119`). Thêm hai lỗi: ô "Chốt ngày" chặn ngày đã qua; hồ sơ HV ghi "Chưa có mốc" dù 3 ngày nữa em thi.
10. Đề xuất **một hàm `trangThaiLichThi`** dùng chung cho hàng HV, đầu hồ sơ, Tổng quan, Công việc và tệp xuất. Trạng thái A "Thi 21/11" (họ màu "đã thi") · B "Chưa chốt ngày thi" (viền đứt, trung tính). Việc "Chốt ngày thi" không hạn, sinh khi đọc trang, **không cần migrate**. Còn 6 câu cần chủ SP chốt (cuối báo cáo).

---

## V2A-01 Bộ lọc thời gian: 5 dáng cho một việc — gộp thành "Tuần bắt đầu → Tuần kết thúc" (I.1) · [ĐÃ CHỐT hướng] · P1

**1. Vấn đề [ĐÃ KIỂM]**
- 14 chỗ chọn thời gian, 5 dáng, 9 chế độ khác nhau (bảng dưới). Ở Phân tích, đổi khoảng mất **5 thao tác**: mở hộp, chọn kiểu, sửa 2 ô, bấm "Áp dụng".
- Ở Bộ lọc thêm, hộp rộng 360 px nên **mất hẳn nút "Tùy chọn"** (ảnh `tg-locthem-hop`; tái hiện A5-13 ở trang thứ hai).
- Chip "Mọi lúc ✕" **sáng lên đúng lúc đang lọc theo khoảng**. Nhãn nói ngược trạng thái: nó thực ra là nút bỏ lọc (`StudentsPage.tsx:457`).
- "Theo tháng" ra tháng trước (P0 A5-01).

| # | Chỗ (vai) | Tệp:dòng | Chế độ hiện có | Mặc định hiện tại | Máy chủ nhận | Loại | Đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | Phân tích 6 tab: Báo cáo · Test+SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức (QL, QT, GV có quyền, TVV/CX một phần) | `phanTich/PhanTich.tsx:105` · `BoChonThoiGian.tsx:15-93` · `shared/domain/khoangThoiGian.ts` | 2 tuần vừa qua · Theo tuần (Từ–Đến) · Theo tháng · Tùy chọn (ngày) | 2 tuần **hoàn chỉnh** trước tuần này (`khoangMacDinh:26-29`, C24) | `kieu, tu, den` (ngày) → `khoangOf` `routes/index.ts:711`; Hiệu quả PA / PT GV đổi về Thứ Hai `:721` (PT GV cũ còn `thang`, `:791`); Ý thức from/to `:776`; Báo cáo `:811` | (a) | Khoảng tuần · mặc định **W−2 → W−1** (giữ C24). Hiệu quả PA: xem câu hỏi Q8 |
| 2 | Tutor + panel tutor (QT, Head tutor) | `tutor/TutorPage.tsx:92` · `PanelTutor.tsx:121` | như #1 | 2 tuần vừa qua → trang rỗng (A5-06) | `khoangTutor` `routes/index.ts:453` | (a) | Khoảng tuần · mặc định **tuần trước → tuần này** |
| 3 | HV & Lớp › Bộ lọc thêm "Tuần thi của kết quả" (QL, QT, GV) | `StudentsPage.tsx:453-461` · `shared/domain/locThem.ts:64,70-75` | BoChonThoiGian + "Mọi lúc ✕" / "Chọn khoảng" | không lọc; bấm "Chọn khoảng" → 2 tuần vừa qua | **không gửi máy chủ** — web lọc (`ltu, lden, lkieu` trên URL) | (a) | Đổi tên "Thời gian" (V2A-02), nằm trong nhóm "Kết quả gần nhất"; trống = không lọc; bật → tuần trước → tuần này |
| 4 | HV & Lớp › Đang SOS (QL, QT, GV) | `StudentsPage.tsx:426` · `ChonTuanSos.tsx:10-28` | "Tuần thi ‹ W2 SEP ›" + "Toàn bộ" (8 tuần) | Toàn bộ 8 tuần (OV-14b) | `goc=sos&tuan=` · `hocVienSos.ts:26` `SO_TUAN_SOS = 8` | (a)→(b) | Đã chốt 9.1-4 "một định nghĩa SOS hiện tại" → **bỏ hẳn bộ lọc thời gian ở đây**; danh sách 8 tuần sang Phân tích (dùng #1). Trước khi làm 9.1-4: Khoảng tuần W−7 → W0 |
| 5 | HV & Lớp của TVV / CX › Đang SOS | `HocVienTheoVai.tsx:297` | như #4 | như #4 | như #4 | (a)→(b) | như #4 |
| 6 | HV & Lớp › Lịch thi (QL, TVV, CX, GVCN) | `GocLichThi.tsx:46-49, 107` · `shared/domain/lichThiOv15f.ts:33` | **12 nút tháng** (08/2026…07/2027), chọn nhiều | tháng kế tiếp (10/2026 → 0 HV, A3-20) | `thang=YYYY-MM,…` `classes/lichThi.ts:86` | **(b)** tháng dự kiến thi là nghiệp vụ (Rulebook dòng 258) | Cùng dáng thành phần nhưng **đơn vị tháng**: "Tháng dự kiến [10/2026] → [11/2026]", mặc định **tháng này → tháng sau**; nhóm "Đã tới tháng, chưa chốt ngày" luôn hiện (V2A-06) — hỏi Q3 |
| 7 | Test › Lịch Test / Chấm Test (QL, QT, GV) | `test/LichTestTab.tsx:264` · `ui/Filters.tsx:83-200` `WeekPicker` | một tuần ‹ W3 SEP 14/09–20/09 › + "Tuần này" | tuần này | `periodId` | (b) màn làm việc theo một tuần (khối "Test chấm tuần này") | Cùng thành phần, **khoá một tuần** (hai ô trùng → một ô + ‹ ›) |
| 8 | Test › trang Nhập điểm theo tuần `/nhap-diem` | `cham/ChamDiemPage.tsx:117` | như #7 | tuần này | `periodId` | (b) | Trang sẽ bỏ (TST-02, 9.2-27) — không đầu tư |
| 9 | Công việc › Báo cáo đơn vị (QL) | `worklist/MeetingPage.tsx:145-150, 67` | một tuần + "Kỳ báo cáo: Tuần · **Tháng**" (đọc lại cả tháng) | tuần đang chọn | `periodId`, `ky=thang` | (a) | Bỏ "Tháng"; đọc lại nhiều tuần = Khoảng tuần (mặc định một tuần) — hỏi Q8 |
| 10 | Panel Xuất điểm Test (Kế hoạch Test, QL) | `test/keHoach/NganXuatDiem.tsx:14, 28-31, 105-118` | Theo tuần (1 tuần) · Theo lớp (nhiều MT) · Lớp + khoảng tuần | có lớp → theo MT; không → tuần này | `tuanTu/tuanDen`, `mtTu/mtDen` | (a) + giữ "theo MT" | Gộp "Theo tuần" + "Lớp + khoảng tuần" = **Khoảng tuần (+ Lớp tuỳ chọn)**; giữ "Theo MT" (không phải thời gian) |
| 11 | Panel Xuất kết quả Test (Phân tích Test+SOS, Lịch Test, hồ sơ lớp) | `test/NganXuatMt.tsx:47-58, 193-210` | Theo tuần (Từ–Đến) · **Theo tháng** (Từ–Đến tháng) · Theo đợt | theo khoảng của trang gọi | `tg=tuan|thang|dot` → `/xuat-mt` (`docBoLocXuatMt`) | (a) + giữ "theo đợt" | Bỏ "Theo tháng"; Khoảng tuần mặc định = khoảng trang gọi; gộp với #10 thành một panel (TST-04) |
| 12 | Hồ sơ lớp › Góp ý tuần | `classes/BangGopYTuan.tsx:124` · `ClassOverviewPage.tsx:137` (`tuan`) | một tuần ‹ › + "4 tuần gần nhất" mở dưới hàng | tuần này | `tuan` | (b) nhập góp ý theo tuần | Khoá một tuần như #7 |
| 13 | Kết quả thi › Thi thật | `phanTich/KetQuaThi.tsx:189` · `server/src/phanTich/ketQuaThi.ts:107-108` | dùng #1 (lọc **ngày** thi thật trong khoảng) | như #1 | `tu, den` ngày | (a) — khoảng tuần = T2 → CN, không lệch | không đổi gì riêng |
| 14 | Cửa sổ cố định (không phải bộ lọc) | `HopChoDuyet.tsx:158` "Đã xử lý (30 ngày)" · `YeuCauCuaToi.tsx:44` 60 ngày · `ClassYThucCard.tsx:28` "Đã xử lý (7 ngày)" · `hvCuaToi.ts:25-26` Sắp thi 6 tuần / Cần chú ý 14 ngày · `BangKqdrLopFt.tsx:33` 4 tuần | định nghĩa chỉ số | — | — | (c) giữ | Không đổi (là định nghĩa, không phải ô chọn). Chỉ hỏi Q8: có đổi "30 / 60 ngày" sang tuần cho thống nhất không |

Ô **nhập liệu** ngày / tuần (ngày thi, tuần bắt đầu, khoảng nhập bù Case `QuickReport.tsx:487-525`…) không phải bộ lọc. Chúng giữ `ONgay` như luật 06/10, nằm ngoài phạm vi này.

**2. Nguyên nhân [ĐÃ KIỂM]**
- C29 (OV-15e, mockup 3 mục 3) chốt bộ chọn 4 kiểu.
- Sau đó mỗi PR tự thêm bộ chọn riêng: OV-12f `ChonTuanSos`, OV-15f 12 nút tháng, OV-15c và PR-XUAT mỗi panel xuất một kiểu. Không có thành phần dùng chung → N7, X7.
- P0: tháng bị suy từ Thứ Hai đầu tháng (`khoangThoiGian.ts:59-61, 76-80`).
- "Tùy chọn" bị che vì hộp `w-[min(360px,…)]` chứa 4 nút đoạn (`BoChonThoiGian.tsx:57-60`).

**3. Ảnh hưởng (UI/UX + workflow)**
- QL / QT phải học 5 cách chọn thời gian. Không chế độ nào nhớ giữa hai trang (Phân tích → Tutor đều về mặc định).
- Đổi khoảng ở Phân tích: 5 thao tác, 1 hộp.
- Báo cáo tháng in sai tháng (P0).
- Ở 375, hộp phủ lên bảng (ảnh `tg-pt-375-hop`).
- Đang SOS: "Toàn bộ 8 tuần" và "SOS hiện tại" là hai nghĩa dưới cùng một chữ (A3-08).

**4. Phương án [ĐỀ XUẤT] — một thành phần `Khoảng tuần`**
- **1440 (trong dải lọc của khung trang, M0):** `Thời gian  ‹  [W1 SEP ▾] → [W2 SEP ▾]  ›   Mặc định`. Rộng ≈ 340 px.
  - Mỗi ô là `ONgay kieu="tuan"`: gõ được (`dd/mm/yyyy`, thêm nhận "W2 OCT" bằng `docTuanLich` sẵn có) hoặc bấm ▾ để mở lịch tuần (`LichNho`).
  - **Không hộp, không "Áp dụng".** Đổi một ô là tải lại; API ≤ 250 ms (mục 2.4).
- **Năm:** ẩn khi cả hai tuần ở năm hiện tại. Khác năm thì ghi "W5 DEC/2026 → W1 JAN/2027". Một hàm định dạng tuần duy nhất (TST-22).
- **375:** một hàng `Thời gian [W1 SEP] → [W2 SEP]`, mỗi ô ≈ 150 px, cao 44 px, bỏ ‹ › cho vừa 343 px. Lịch tuần mở dạng tấm dưới đáy.
- **Hành vi:**
  - Chọn ngược thứ tự → **tự đổi chỗ**, không báo lỗi. Đây là việc hiển nhiên — luật chủ SP 08/10.
  - Cùng tuần là hợp lệ, nhãn chỉ một tuần.
  - Dài hơn 52 tuần → báo lỗi ngay tại ô, giữ khoảng cũ.
  - ‹ › dời cả khoảng theo đúng độ dài (aria: "Lùi 2 tuần").
  - "Mặc định" chỉ hiện khi khoảng khác mặc định.
  - Bàn phím: Tab vào ô, Enter áp dụng, Esc trả giá trị cũ, Alt+↓ mở lịch.
  - **Nhớ khi Quay lại:** khoảng nằm trên URL (`tu`, `den` = Thứ Hai tuần đầu và tuần cuối) — đúng luật `state-preservation`.
  - Không lưu `localStorage`. Mỗi trang có mặc định riêng (cột "Đề xuất" ở bảng trên).
- **Máy chủ:** chỉ còn `tu`, `den`. Bỏ `kieu`. Hàm `khoangTuUrl` vẫn **đọc link cũ**:
  - `kieu=thang` → các tuần của tháng chứa **thứ Năm tuần đầu** (`owningMonthOf(tu + 3 ngày)`). Đây chính là chỗ sửa P0.
  - `tg=n` → n tuần.
  - `2-tuan` → mặc định.
- **Tuỳ chọn (không bắt buộc):** khoảng trùng đủ các tuần của một tháng thì nhãn Báo cáo tự thêm "(tháng 09/2026)". Có ngay nhãn báo cáo tháng mà không cần thêm điều khiển.
- **Dáng "một tuần"** (Lịch Test, Góp ý tuần): cùng thành phần, khoá hai ô thành một, giữ ‹ › và "Tuần này".

**5. Vì sao tốt hơn (tình huống thật — QL Monbay)**

| Việc | Hiện tại | Phương án đề xuất | Phương án khác: giữ hộp, chỉ còn "Theo tuần" |
|---|---|---|---|
| Phân tích: đổi sang W3 → W4 SEP | 5 (mở · kiểu · 2 ô · Áp dụng) | **2** (2 ô) hoặc **1** (› nếu dời đúng 2 tuần) | 4 (mở · 2 ô · Áp dụng) |
| Báo cáo tháng 9 để in | 4 + **ra sai tháng** | 2 (W1 SEP → W4 SEP), nhãn tự ghi "tháng 09/2026" | 4 |
| Lọc HV có kết quả 2 tuần qua (Bộ lọc thêm) | mở Bộ lọc thêm (1) + Chọn khoảng (1) = 2, chip "Mọi lúc ✕" gây hiểu ngược | 2, chữ rõ "Thời gian W1 SEP → W2 SEP ✕" | 3 |
| Tutor: xem buổi tuần này | 5, mặc định rỗng | **0** (mặc định tuần trước → tuần này) | 4 |
| Ở 375 | hộp phủ bảng, 5 thao tác | 2 ô 44 px ngay trên dải | hộp phủ |

Luật áp: ui-ux-pro-max `state-preservation`, `back-behavior`, `Chip Collection Reflow` (High), impeccable Operate "Modal as first thought…" ("hộp là cách nghĩ đầu tiên"), CLAUDE.md "một khái niệm một tên; cùng loại thao tác cùng vị trí".

**6. Ảnh hưởng khu vực khác:** mọi dòng của bảng kiểm kê; dải lọc dính C10 (X6, M0); 2 panel xuất (TST-04); P0 A5-01 (SL1); A5-13, A5-14 (Phân tích GV chỉ nhận 13 tuần → nâng 52); A5-21 (Hiệu quả PA gần trống); A5-06 (Tutor rỗng); Hướng dẫn QL / Head tutor đang dạy "Khoảng thời gian (mặc định 2 tuần vừa qua)" (`shared/huongDan/ql.ts:70`, `headTutor.ts:48`), GV dạy "Đang SOS mặc định Toàn bộ 8 tuần" (`gv.ts:54`); phép kiểm `khoangThoiGian`.

**7. Trình tự triển khai**
- **GĐ1 · SL1:** bỏ 3 kiểu Tháng / 2 tuần / Tùy chọn khỏi `BoChonThoiGian`, chỉ còn Từ tuần – Đến tuần, vẫn trong hộp cũ. Sửa đọc link cũ `kieu=thang`. Phép kiểm 12 tháng 2026. Không đổi bố cục → không cần mockup.
- **GĐ2 · M0 (khung trang):** dựng `Khoảng tuần` nằm ngay trên dải lọc dính, **mockup 1440 + 375** trước (thành phần mới). Thay ở Phân tích, Tutor, Bộ lọc thêm.
- **M4 (HV & Lớp):** Đang SOS theo 9.1-4; Lịch thi dùng dáng tháng.
- **M5 (Test):** Lịch Test dạng một tuần, gộp 2 panel xuất.
- **M2:** Báo cáo đơn vị.
- **GĐ3 · CHU:** sửa Hướng dẫn.

**8. Cần chủ SP xác nhận:** Q3 (Lịch thi theo tháng), Q8 (mặc định từng trang, Báo cáo đơn vị, cửa sổ 30 / 60 ngày) — ở cuối báo cáo.

---

## V2A-02 "Tuần thi của kết quả" → "Thời gian" + các cụm thiếu tự nhiên (I.2) · [ĐÃ CHỐT đổi tên; phần còn lại ĐỀ XUẤT] · P2

**1. Vấn đề [ĐÃ KIỂM]**
- Nhãn "Tuần thi của kết quả" (`StudentsPage.tsx:453`) vừa dài, vừa dùng "thi" cho Test.
- Trên cùng màn còn khoảng 20 cụm đọc không tự nhiên hoặc nói sai trạng thái (bảng dưới). Các cụm chung với cả web có mã A7 / X8 thì chỉ dẫn mã, không kể lại.

| Chữ hiện tại | Ở đâu (tệp:dòng · ảnh) | Vì sao khó hiểu | Chữ đề xuất |
|---|---|---|---|
| Tuần thi của kết quả | Bộ lọc thêm `StudentsPage.tsx:453` · `tg-locthem-hop` | dài; "thi" sai nghĩa (I.5) | **Thời gian** [ĐÃ CHỐT], đặt cuối nhóm "Kết quả gần nhất" để ngữ cảnh tự rõ |
| Mọi lúc ✕ (sáng khi đang lọc) | `StudentsPage.tsx:457` | nhãn nói "mọi lúc" trong khi đang lọc một khoảng | bỏ chip; khoảng có ✕ của nó: "W1 SEP → W2 SEP ✕" (aria "Bỏ lọc thời gian") |
| Chọn khoảng | `StudentsPage.tsx:460` | động từ lửng | không cần: ô "Thời gian [chọn tuần]" trống = không lọc |
| Khoảng thời gian · 2 tuần vừa qua · Tùy chọn | `BoChonThoiGian.tsx:50, 13` | 3 kiểu sẽ bỏ (V2A-01) | Thời gian |
| Tuần thi (Đang SOS) | `ChonTuanSos.tsx:18-19` · `tg-sos` | "thi" cho MT / Progress | bỏ theo 9.1-4; nếu còn: "Tuần Test" |
| Người giữ | Cần làm `BangCanLam.tsx:28` | khác thuật ngữ chốt E-024 | Người phụ trách (A7-20) |
| Cả lớp · 2 em (ở cột "Học viên") | Cần làm · `cl-qt-p1` (8/10 hàng) | không phải tên học viên | thuộc V2A-04 (bỏ bảng) |
| Thi thật · chưa có ngày | cột Sắp tới `shared/domain/sapToi.ts:16` · `x-chon3` (Đoàn Khánh Chi) | hiện khi em **chưa có cả tháng**; đụng nghĩa "Chưa chốt ngày" mới (6.3) | Chưa có tháng thi (V2A-08) |
| Dự kiến W2 JAN 2027 / NOV 2026 / 11/2026 / 17/09/2026 | Lịch thi `GocLichThi.tsx:182` · cột Dự kiến thi · đầu hồ sơ `hv-tranha`, `hv-minh` | một dữ liệu 4 dạng (tháng có lúc "NOV 2026", lúc "11/2026") | tháng luôn "11/2026"; tuần "W2 JAN/2027"; ngày "21/11/2026" (V2A-08) |
| Lịch hiện tại | Lịch thi `GocLichThi.tsx:145` | không rõ lịch gì | Lịch thi |
| Kết luận · chưa rà · Giữ tháng · Cần xác nhận · Đặt tháng | Lịch thi `GocLichThi.tsx:31-33, 127-131` | 5 trạng thái cho một việc, "rà" là từ nội bộ | thay bằng trạng thái tự suy + 2 việc (V2A-06, V2A-07) |
| Ghi chú họp | Lịch thi `GocLichThi.tsx:145, 245` · cột xuất `lichThiOv15f.ts:93` | [ĐÃ CHỐT] đổi | **Ghi chú** |
| Gồm HV chưa có dự kiến thi · 41 | Lịch thi `GocLichThi.tsx:114` | câu dài trên ô tick | nhóm gập "Chưa có tháng thi · 41" ở cuối bảng |
| Chọn tất cả HV đang hiện ở trang này · 33 | Tất cả `StudentsPage.tsx:328` | câu dài; thực ra chỉ lấy **lớp đang mở** | bỏ (V2A-05) |
| Lọc trong danh sách này… | ô tìm đầu trang | thừa chữ | Tìm học viên, lớp |
| Phạm vi: Chi nhánh · Loại lớp: Tất cả · 20 · Xếp: Tên A→Z | dải lọc | "nhãn: giá trị" trong ô chọn, cắt chữ ở 375 (A3-12) | khung trang M0: Chi nhánh ▾ · Tất cả · FT 6 · LT 14 · Xếp ▾ |
| Đang xem: Cần làm · 73 học viên · 17 lớp + "1–10 / 181 việc" | dòng trạng thái | ba đơn vị trên một dòng (A3-16) | một đơn vị (V2A-04 bỏ bảng) |
| Kết quả đến nay | Đang SOS `tg-sos` | là kết quả PA | Kết quả PA (A7-24) |
| −0.5 · Không đạt: S | ô Kết quả gần nhất | trùng ✗ ở cột (A3-06) | bỏ |
| Thiếu 1 / Thiếu 2 | sau tên em | nhãn ở 46/51 em (A3-04) | số ở hàng lớp |
| Loại thi (aria, tab con) | `KetQuaThi.tsx:42` | nhóm gồm cả Mock và Thi thật | Loại (V2A-03) |

**2. Nguyên nhân:** chữ viết rải trong từng PR. Bảng thuật ngữ 01/10 không có phép kiểm (X8). Luật "1–3 chữ" chỉ áp cho nút, không áp cho nhãn bộ lọc.

**3. Ảnh hưởng:** Chị Vy phải đọc hai lần mới hiểu ô lọc; chip "Mọi lúc ✕" làm người dùng tưởng đang **không** lọc → đọc sai số em trên bảng (Nielsen H1, H2).

**4. Phương án:** đổi theo cột "Chữ đề xuất". Cụm nào gắn với bố cục mới (Lịch thi, Cần làm) thì đổi cùng PR của màn đó.

**5. Vì sao tốt hơn:** mỗi nhãn ≤ 3 chữ, nói đúng trạng thái (CLAUDE.md "trạng thái rõ"). "Thời gian" đặt trong nhóm "Kết quả gần nhất" nên không cần câu giải thích, cũng không cần ⓘ.

**6. Ảnh hưởng khu vực khác:** i18n EN (`shared/i18n/en/*.ts`, ví dụ `ov15f.ts:23` "Meeting note"); Hướng dẫn (`shared/huongDan/gv.ts:55`, `tvv.ts:50`, `ql.ts`); tên cột tệp xuất (`COT_XUAT_DS`); phép kiểm đọc chuỗi nguồn của OV-15f / OV-15h2.

**7. Trình tự:** "Thời gian" + "Ghi chú" + "Thi thật · chưa có ngày" → **GĐ1 (KHUNG-LOI / CHU nhanh)**, chỉ đổi chữ, không cần mockup (plan 1.3b). Các cụm còn lại đổi cùng **M4**. Bản EN và Hướng dẫn sửa cùng PR.

**8. Cần chủ SP xác nhận:** không có câu riêng (đã chốt). Phần "Kết luận" của Lịch thi nằm ở Q2.

---

## V2A-03 "Thi" chỉ cho kỳ thi thật; Mock / Progress / Final / Mini = "Test" (I.5) · [ĐÃ CHỐT — nghiệp vụ] · P1

**1. Vấn đề [ĐÃ KIỂM — đếm bằng script, sai số ±10 %]**
- Rà `web/src`, `shared/domain`, `shared/huongDan`, `server/src` (bỏ chú thích, phép kiểm, migrate, seed, EN): **549 chuỗi hiện ra có chữ "thi"**.
  - **~295 chuỗi** dùng "thi" cho **Test**: web 118 · shared 59 · Hướng dẫn 33 · máy chủ (lỗi, thông báo, tên việc, lịch sử) 85.
  - **~208 chuỗi** đúng nghĩa thi thật.
  - 4 chuỗi là nhóm gồm cả hai.
  - 28 chuỗi không liên quan ("thi hành", khoá mã).
- Danh sách đủ, có tệp:dòng: `…\scratchpad\chup\v2a-thi-loai.tsv`.

| Chữ hiện tại (số chuỗi) | Ở đâu (ví dụ) | Thực chất | Chữ đề xuất |
|---|---|---|---|
| **Tuần thi** (79) | ô điểm "Thi W2 SEP" `ScoreEntry.tsx:325`, `ODiemLon.tsx:51`, `MotKyNang.tsx:335`; "Chưa tới tuần thi" `attempts.ts:2133`, `DanExcel.tsx:45`; cột xuất "Tuần thi" `lichThiOv15f.ts:93`; ChonTuanSos; Hướng dẫn | Test | **Tuần Test**; ô điểm "Test W2 SEP"; "Chưa tới tuần Test" |
| **Đã thi / đang thi** (46 Test · 11 thật) | chip Kế hoạch Test "đã thi" `keHoachOv15c.ts:30`, `keHoachTest.ts:112, 264`; "MT2 đã thi, đang chờ chấm"; mockup 4 ô "tuần / Đã thi" | Test (MT) | **Đã làm bài**; giữ "Đã thi" cho thi thật ("Đã thi · chờ KQ") |
| **(Huỷ) phần thi** (43) | "Đã huỷ phần thi" (C-036), `skillSchedule.ts`, thẻ duyệt "quá hạn thì phần thi bị huỷ" (`hv-tranha`) | Test | **Đã huỷ kỹ năng** / "kỹ năng bị huỷ" |
| **Không dự thi** (23) | ô điểm sau chốt vắng (C-035), `cham/*`, Rulebook §17.7 | Test | **Không làm bài** (· Tuần Test W2 SEP) |
| **Dời / Đổi lịch thi** (20) | ⋯ ô kỹ năng "Dời lịch thi" `thaoTacMt.ts:14`, quyền `people.ts:186`, thẻ duyệt "Dời S · MT3 · lần 2", toast "Đã dời lịch thi" `HopThaoTacMt.tsx:115` | Test | **Dời lịch Test** |
| **Thi lại** (15) | "sẽ không thi lại" `HopThaoTacMt.tsx:46`, `keHoachTest.ts:624` | Test | **Test lại** |
| kỹ năng không thi / phải thi (15) | "Bỏ kỹ năng không thi" `nhatKy.ts:16`, `nhomQuyen.ts:29`, `xuatMt.ts:255` | Test | "kỹ năng không Test" → gọn: **Bỏ kỹ năng** |
| Thi {tuần} · Trạng thái thi (9) | `DongThoiGianLuot.tsx:25`, `skillSchedule.ts:1061` | Test | Trạng thái làm bài |
| **Ghi chú lịch thi** (7) — MT | hộp kỹ năng Kế hoạch Test `HopKyNang.tsx:384`, `LuoiKeHoach.tsx:152`, Hướng dẫn | Test (C21) | **Ghi chú lịch Test** (đụng tên "Ghi chú lịch thi" của thi thật trong Lịch sử HV `lichSuSua.ts:53` — một tên hai nghĩa) |
| **Lịch thi** — loại thẻ duyệt (4) | Chờ duyệt "Học thuật · Ý thức · **Lịch thi** · Thông tin HV" `yeuCauDuyet.ts:14`; lịch sử ô "Lịch thi" `lichSu.ts:60` | Test (dời MT lần 2) | **Lịch Test** |
| thi thử · bài thi · lượt thi (5) | Hướng dẫn "bài thi thử", `TransitionPanel.tsx:343` "bài đã thi xong" | Test | Mock Test · bài Test · lượt Test |
| Thi Progress / Final (2) | `fasttrack.ts:84-86` "Tuần sau thi Progress Test" | Test | "Tuần sau Progress Test" |
| **Kết quả thi** — tab Phân tích (Mock + Thi thật) | `PhanTich.tsx` tab, `KetQuaThi.tsx:72` tiêu đề tệp | **gồm cả hai** | **Kết quả Test** (tab con: Mock Test · Thi thật) |
| Kết quả thi — mẫu cột xuất | `NHAN_MAU_XUAT` `lichThiOv15f.ts:128`, panel Xuất `x-panel-chon` | Test (MT) | Kết quả Test |
| Kết quả thi — việc của TVV | Hướng dẫn `tvv.ts:50`, Cần làm TVV | thi thật | Kết quả thi thật |
| GIỮ: Dự kiến thi (47) · Kết quả thi thật (43) · Ngày thi (21) · sau thi / Bước tiếp sau thi (21) · Lịch thi — góc HV & Lớp (14) · Không thi — thi thật (12) · Thi thật (12) · Sắp thi (9) · đến lúc thi (5) · thi IELTS (6) | — | thi thật | **giữ** |

**Mâu thuẫn với nguồn đã chốt cũ (phải sửa nguồn, không chỉ sửa web):**
- `thiet-ke/THUAT_NGU_2026-10-01.md` (bảng hiện hành; `THUAT_NGU_DA_CHOT.md` đã bị thay): C-028 "Đã thi" (MT), C-035 "Không dự thi · Tuần {mã tuần}", C-036 "Đã huỷ phần thi", A-009 nghĩa "xếp tuần thi". Cùng bảng lại có B-014 "Test = gọi chung bài kiểm tra" — tự mâu thuẫn.
- Rulebook: §17.7 "không dự thi", dòng 818 "Dời lịch thi một kỹ năng", dòng 762 phân loại "Lịch thi". Đổi **chữ hiện ra**, không đổi luật → đề nghị planning sửa chữ trong Rulebook cùng PR tài liệu.
- Mockup 4 (Kế hoạch Test) ô "tuần / Đã thi"; mockup 5 cột xuất "Tuần thi".

**2. Nguyên nhân:** thói quen nội bộ gọi MT là "thi thử". Bảng thuật ngữ cũ chốt từng chữ, không có luật chung. Không phép kiểm nào chặn chữ.

**3. Ảnh hưởng:**
- "Đã thi" có 2 nghĩa trên cùng hàng HV: chip Kế hoạch Test (MT) và chip "Đã thi · chờ KQ" (thi thật).
- "Lịch thi" (góc HV & Lớp, thi thật) và "Lịch thi" (loại thẻ duyệt, dời MT) cùng tên.
- GV và TVV dễ hiểu nhầm thẻ "Dời lịch thi lần 2" là hoãn kỳ thi IELTS.

**4. Phương án:**
- Một luật: **Thi = thi thật; mọi thứ khác = Test** (danh từ) và **"làm bài"** (động từ / trạng thái).
- Nhóm gồm cả hai → "Test".
- Thực hiện: một từ điển chữ dùng chung + **phép kiểm chặn** `/\b(tuần|phần|dời lịch|đã) thi\b/` ở các tệp Test (trừ danh sách thi thật).

**5. Vì sao tốt hơn:**
- Đúng luật nghiệp vụ chủ SP đã chốt.
- Hết "một tên hai nghĩa" (Nielsen H4).
- Nói "làm bài" thay vì "dự thi" cho Test: ngắn hơn, đúng đời thực (em làm bài Mock, không phải đi thi). Phương án khác "Đã Test" thì nửa Anh nửa Việt, khó đọc thành câu.

**6. Ảnh hưởng khu vực khác:**
- Test (Lịch Test, Kế hoạch Test, ô điểm, hộp kỹ năng, panel Nhập điểm), Công việc (tên việc, thẻ duyệt), Tổng quan (Chờ duyệt), Phân tích (tab Kết quả thi), hồ sơ HV (Hành trình, Lịch sử), Lịch sử thay đổi, thông báo, tệp xuất, Hướng dẫn, sổ tay PDF, bản EN.
- Thuộc phạm vi agent khác (ghi chéo): ô điểm "Thi W2 SEP" (I.7 / II.4).

**7. Trình tự:**
- **GĐ1 · CHU-THI** (mới, chỉ đổi chữ, không đổi bố cục, không cần mockup): từ điển + đổi ~295 chuỗi + phép kiểm.
- Trước PR này: planning sửa `THUAT_NGU_2026-10-01.md`, Rulebook (chữ) và mockup 4 / 5 trong **một PR tài liệu** (luật 9.1-1 "quyết định mới trái khung → sửa mockup").

**8. Cần chủ SP xác nhận:** Q5 (động từ cho Test: "làm bài" hay "dự Test"; "Huỷ kỹ năng" thay "Huỷ phần thi").

---

## V2A-04 Tab "Cần làm": khuyến nghị BỎ, việc của TVV về Tổng quan TVV (I.3) · [ĐỀ XUẤT] · P1

**1. Vấn đề [ĐÃ KIỂM — ảnh `cl-qt-p1`, `cl-ql2-p1`, `cl-gv7-p1`, `cl-gv10-p1`, `cl-*-375-p1`, `cl-qt-mo`]**

Bảng 5 cột (đo DOM `v2a-dom.mjs`, QT Monbay):

| Cột | Rộng | Giá trị thật trên trang 1 | Ai cần | Trùng với | Đánh giá |
|---|---|---|---|---|---|
| Học viên | 308 px | **8/10 hàng là "Cả lớp · n em"** (không phải học viên); 1 hàng **ô trống** (em có 2 việc → hàng 2 bỏ tên) | QL, GV | dòng 2 của việc ở Công việc | tên cột sai; ô trống làm mất ngữ cảnh khi cuộn |
| Việc | 475 px | chip việc (đỏ ⚠ nếu quá hạn, **chip nền xám** nếu không) + dòng phụ "MT1 W1 JUL"; có cả việc **lặp tên em** "Ghi nhận 1 vi phạm mới · Vũ Hải Đăng" (A3-29) | mọi vai | tiêu đề việc ở Công việc | chip xám cho việc bình thường là nhiễu (A3-17) |
| Người giữ (chỉ QL / QT) | 224 px | tên GV hoặc "—" (Speaking chấm chéo chưa ai nhận) | QL | "Của GV" ở Công việc QL | sai thuật ngữ E-024; "—" không nói "chưa có người" |
| Hạn | 196 px | 2 dòng "hạn 08/07 / ⚠ quá hạn 68 ngày"; "hạn 16/09" vàng | mọi vai | Công việc | đúng nội dung, thừa một dòng |
| (Thao tác) | 196 px | nút "Mở" ở mọi hàng (10 nút / trang) → panel Nhập điểm khung "Trước" (CV-04) hoặc chuyển sang Test / hồ sơ HV (A3-07) | | Công việc | "Mở" không nói việc gì |
| Đầu nhóm lớp | — | "MB FT 101 ⚠ 8 việc quá hạn **1 em**" (đếm theo trang, A7-09) | QL | hàng lớp ở "Tất cả" ("+1" giấu "⚠ 22 việc quá hạn", A3-05) | số sai |
| Lọc phụ | — | "Quá hạn 40 **việc**" · "Chờ duyệt 8" (HV) · "Thiếu thông tin 47" (HV); **GV** cũng thấy "Chờ duyệt 8 / 6", "Thiếu thông tin 32 / 39" (không phải việc của GV) | | Công việc QL "⚠ 33 quá hạn" | 2 đơn vị trên 3 chip (A3-16); 40 ≠ 33 (A7-07) |

- Số liệu: QT Monbay **181 việc / 19 trang**; Công việc QL cùng chi nhánh ghi "Của GV 83 · Tất cả 84 · ⚠ 33 quá hạn" (ảnh `tg-congviec-ql2-p1`) → cùng nguồn `/my-work` mà Cần làm tách "việc con" nên khác số.
- 375: dòng việc đầu tiên nằm ở y ≈ 745 px (`cl-qt-375-p1`).
- TVV: góc Cần làm là **danh sách việc duy nhất** (TVV và CX không có trang Công việc — CV-32). Gồm: Chọn bước tiếp · Kết quả thi thật · Thiếu thông tin (`HocVienTheoVai.tsx:55, 208`; demo TVV CP = 0 việc, `cl-tvv23-p1`).

**Mục đích thật (đọc mã + mockup OV-12-3 v2 §4):** "nhìn **theo lớp / theo em**: lớp nào, em nào đang tồn việc gì, của ai, trễ bao lâu" — để QL đôn đốc, GV làm việc theo lớp. Thông tin cần đúng ba thứ: **lớp tồn bao nhiêu việc quá hạn · việc gì · của ai**. Mọi thứ khác đã có ở Công việc.

**2. Nguyên nhân:** thiết kế 14/10 (mockup OV-12-3 v2 g4) giả định "Thiếu thông tin 12/100" — thực tế 46/51 (A3-03). Nguồn dữ liệu là `/my-work` (`StudentsPage.tsx:162-166`) — **chính là Công việc**, chỉ gom lại theo lớp (`BangCanLam.tsx:52-60`) và cộng thêm Chờ duyệt / Thiếu thông tin của QL (`StudentsPage.tsx:228-242`). Sau mục 10.2 (phân vai Tổng quan = việc QL quyết; Công việc = việc GV), góc này thành nơi thứ ba cho cùng việc (X4).

**3. Ảnh hưởng — đếm bước (tình huống thật)**

| Tình huống | Hiện tại (Cần làm) | **BỎ + lối thay thế (khuyến nghị)** | Giữ & thiết kế lại hoàn toàn |
|---|---|---|---|
| (a) Chị Vy: "MB FT 101 đang tồn việc gì, của ai?" | Cần làm (1) + lật trang tìm lớp (0–2), số đầu nhóm sai → 1–3 bấm | bấm chip "⚠ 8 quá hạn" trên hàng lớp (1) → **mở rộng ngay dưới hàng lớp** (thang tại chỗ bậc 2), 0 đổi trang, số đúng | Cần làm (1) + lọc lớp (1) = 2 |
| (b) Cô Linh: nhập điểm bài quá hạn | HV & Lớp (1) + Cần làm (1) + Mở (1) = 3 | Công việc (trang đầu của GV) + bấm việc = **1** | 3 |
| (c) QL: điền thông tin còn thiếu của lớp X | Cần làm (1) + Thiếu thông tin (1) + tìm lớp + "Mở" **từng em** (n) | số "Thiếu TT 46" trên hàng lớp (1) → panel Sửa cả lớp đúng cột (A3-04, A3-19) = **1 + điền** | 2 + n |
| (d) TVV: chọn bước tiếp cho em đã có kết quả | HV & Lớp (1) + Cần làm (1) + Mở (1) = 3 | Tổng quan TVV (trang đầu, 0) + bấm việc (1) = **1** | 3 |

**4. Phương án [ĐỀ XUẤT] — BỎ góc Cần làm (QL, QT, GV, Admin), 3 lối thay thế, một chỗ mới cho TVV**
1. **Hàng lớp** (mockup 1 khung 3, A3-05): chip "⚠ 8 quá hạn" luôn hiện, đầu chip.
   - Bấm → **dải việc của lớp mở ngay dưới hàng lớp** (gập lại được).
   - Mỗi việc một dòng 40 px: **Việc (động từ + đối tượng) · Người phụ trách · Hạn (1 dòng: "⚠ 68 ngày" / "16/09") · [nút động từ: Nhập điểm / Thêm PA / Ghi nhận]**.
   - Nút mở **cùng panel của Công việc** (`PanelViec`), không đổi trang.
   - Nguồn: `/my-work?classId=` — cùng hàm, cùng số với Công việc.
2. **"Thiếu TT n"** trên hàng lớp (chỉ vai điền được thấy) → Sửa cả lớp, cuộn tới cột thiếu (A3-04).
3. **"n chờ duyệt"** trên hàng lớp → nhóm Chờ duyệt ở Tổng quan, lọc sẵn lớp (10.2).
4. **TVV:** chuyển "Việc của tôi" (Chọn bước tiếp · Kết quả thi thật · Thiếu thông tin · **Chốt ngày thi** — V2A-08) lên **Tổng quan TVV**, thay 5 ô số hiện tại (`tq-tvv23-p1`). Đây là câu 9.2-13 (TVV / CX có khối việc ở Tổng quan). CX giữ "Cần chú ý" (không phải việc).
5. Học viên & Lớp còn **3 góc cho mọi vai: Tất cả · Đang SOS · Lịch thi**.

*Nếu chủ SP vẫn muốn giữ* (phương án dự phòng, không khuyến nghị): bảng phẳng theo lớp.
- Cột: **Việc · Học viên / Lớp · Người phụ trách (QL) · Hạn**, cuối hàng là nút động từ.
- Đầu nhóm "MB FT 101 · ⚠ 8 quá hạn · 12 việc" (đếm toàn bộ).
- Bỏ lọc phụ Chờ duyệt / Thiếu TT với GV. Một đơn vị "việc".

**5. Vì sao tốt hơn:**
- Cả 4 tình huống ít bước hơn hoặc bằng: 1 / 1 / 1+điền / 1 so với 1–3 / 3 / 2+n / 3.
- Một việc chỉ có một danh sách, một cách đếm (CLAUDE.md "cùng số liệu cùng nguồn") — hết lệch 181 ↔ 84, 40 ↔ 33.
- Bớt một góc nhìn + 3 chip lọc phụ, bớt 3 lời gọi API mỗi lần mở trang (A3-03); góc này một mình có 35 phần tử bấm được ở khung nhìn đầu (đo DOM).
- Giữ đúng mục đích "nhìn theo lớp" vì chỗ nhìn lớp **chính là hàng lớp**.
- "Giữ & thiết kế lại" vẫn là bản sao thứ ba của cùng việc, thua ở cả 4 tình huống.

**6. Ảnh hưởng khu vực khác:**
- Hàng lớp ở hồ sơ lớp: chip "+1 ⚠ 22 việc quá hạn" đang dẫn **sang** Cần làm (`DauTrangLop.tsx:118-127`, A3-07) → đổi thành mở rộng tại chỗ.
- Hướng dẫn đang dạy góc này: TVV "Làm việc ở Cần làm" (`shared/huongDan/tvv.ts:2, 49-52` — ghi rõ "TVV không có Công việc"), QL (`ql.ts:82`), Admin (`admin.ts:62`).
- Phép kiểm OV-12f; `docGoc` (link cũ `view=can-lam`, `loc=qua-han|cho-duyet|thieu_tt`) phải **chuyển hướng**: QL → Công việc lọc chi nhánh; TVV → Tổng quan.
- Tổng quan TVV (M7). Chuông (A1-04).

**7. Trình tự:**
- **M1 (Tổng quan QL)** và **M2 (Công việc)** làm trước, để chỗ thay thế có sẵn.
- **M4 (HV & Lớp)**: bỏ góc + hàng lớp mở rộng (**mockup mới** 1440 + 375: hàng lớp mở dải việc).
- **M7**: Tổng quan TVV có khối việc. Chuyển hướng link cũ ở M4.

**8. Cần chủ SP xác nhận:** Q4 (bỏ Cần làm + chỗ mới cho việc TVV).

---

## V2A-05 Ô tick chọn HV để xuất Excel (I.4) · [CHƯA CHỐT → khuyến nghị phương án 3] · P2

**1. Vấn đề [ĐÃ KIỂM — đo DOM, ảnh `x-mo101`, `x-chon3`, `x-panel-chon`, `x-mo101-375-p1`]**
- Mỗi hàng em có ô tick **18 × 18 px**, cách mép ô 44 px. Cột tên rộng 217 px → ô tick + khoảng cách ≈ 26 px (**12 % cột tên**).
- Một lớp 33 em có **34 ô tick** (kể cả "Chọn tất cả HV đang hiện ở trang này · 33").
- **Bỏ ô tick (mô phỏng bằng CSS): tổng chiều cao 33 hàng 2 323 → 2 311 px (−0,5 %), cao trung bình vẫn 70 px.** Số ô tên phải xuống 2 dòng giảm 11 → 4.
  → Lời chủ SP "làm hàng dày" **đúng một phần**: ô tick làm tên + "Thiếu n" xuống dòng ở 7 em. Nhưng hàng cao là do ô 3–4 dòng (Kết quả gần nhất, cột W, Việc tiếp — A3-06, I.7).
- **Lỗi luồng:** "Chọn tất cả" chỉ lấy em của **lớp đang mở ở trang này** (`StudentsPage.tsx:325-328`).
  → "xuất cả chi nhánh bỏ 2 em" phải mở 20 lớp qua 2 trang. Đổi bộ lọc là mất hết chọn (`:300-305`).
- 375: 34 ô tick trong thẻ, mỗi ô có lề 13 px để đủ 44 px.
- Mockup 5 khung 2 vẽ **danh sách phẳng một dòng / em** có cột tick + nút chia đôi "Xuất Excel · 18 HV ▾" + lọc SOS 1/2/3. Web gắn ô tick vào bảng nhóm lớp nhiều dòng và không có lọc SOS (A3-13, A3-22) → lệch mockup.

**2. Nguyên nhân:** OV-15h2 (ý 1) thêm ô tick vào `BangHocVienLop` có sẵn (luật "sửa trên nền có sẵn", N2), không dựng danh sách phẳng của mockup. "Chọn tất cả" phải giới hạn ở em đang hiện để không chọn ngầm em trong lớp gập.

**3. Ảnh hưởng:** thêm 34 điều khiển lặp vào bảng vốn 93–95 phần tử bấm được (B-04). Ô tick chỉ phục vụ một việc hiếm (xuất một phần) nhưng luôn hiện ở việc thường ngày (đọc bảng). Tình huống "bỏ vài em" gần như không làm được.

**4. Phương án — so 3 cách (QL Monbay, đếm bấm)**

| Tình huống | Hiện tại | A: bỏ ô tick, xuất phạm vi đang xem | B: giữ chọn, gọn hơn (bật chế độ "Chọn", ô tick chỉ hiện khi bật) | **3: bỏ ô tick khỏi bảng + chọn ngay trong panel Xuất (khuyến nghị)** |
|---|---|---|---|---|
| Xuất 1 lớp (MB FT 101) | gõ mã lớp (1) + Xuất (1) + Xuất 33 (1) = 3 | 3 | 3 | 3 |
| Xuất 5 em SOS của 3 lớp | mở 3 lớp (3, có thể +1 lật trang) + tick 5 + "Xuất các HV đã chọn" (1) + Xuất (1) = **10–11** | Đang SOS → xuất 22 em (3) + **xoá 17 dòng trong Excel** | bật Chọn (1) + 10–11 = 11–12 | Xuất (1) + "Bỏ chọn tất cả" (1) + gõ tên / tick 5 (5) + Xuất 5 (1) = **8**, không mở lớp, không lật trang |
| Xuất cả chi nhánh, bỏ 2 em | phải mở 20 lớp / 2 trang ≈ **28 bấm** (thực tế: xoá 2 dòng trong Excel) | 2 + xoá 2 dòng trong Excel | như hiện tại + 1 | Xuất (1) + gõ tên, bỏ tick 2 em (≈ 4) + Xuất 49 (1) = **6**, trong app |
| Ở 375 | 34 ô tick trong thẻ | không ô tick; 2 bước | ô tick khi bật chế độ | panel toàn màn, hàng 44 px, có ô tìm |
| Chiều cao / độ rối bảng | +34 điều khiển | sạch | sạch khi tắt chế độ | sạch |

**Thiết kế phương án 3:** panel Xuất (`NganXuatDs`) thêm khối **"Học viên · 51"**, gập sẵn. Trong khối có:
- Một hàng đầu: ô tìm tên + "Chọn tất cả / Bỏ chọn tất cả".
- Danh sách em gom theo lớp, mỗi lớp có ô tick cả lớp, **mặc định chọn hết** (= phạm vi đang xem, đủ mọi trang).
- Nút chân panel đổi số theo lựa chọn: "Xuất 49 HV".
- Bỏ hai lựa chọn "Phạm vi: Toàn bộ / Các HV đã chọn". Bỏ ô tick và "Chọn tất cả HV…" khỏi bảng.

**5. Vì sao tốt hơn:**
- Bảng sạch như A (việc chính là đọc).
- Vẫn bớt / chọn em được như B, mà không phải mở lớp, lật trang hay nhớ em ở trang khác.
- Một chỗ chọn cho **mọi danh sách đang dùng panel này** (Tất cả, Lịch thi, TVV / CX — `GocLichThi.tsx:165`, `HocVienTheoVai.tsx:324`, `StudentsPage.tsx:566`). Đang SOS có luôn "xuất em đã chọn" (A3-13) mà không thêm cột.
- Không mất lựa chọn khi đổi bộ lọc trên trang (chọn nằm trong panel, theo danh sách lúc mở panel).
- A thua ở 2/4 tình huống (phải sửa Excel). B giữ lỗi "chỉ lớp đang mở".
- Luật: ui-ux-pro-max `Bulk Actions` (cho chọn nhiều — vẫn đạt), impeccable Operate "density… when users need it" (ô tick không cần ở việc đọc).

**6. Ảnh hưởng khu vực khác:**
- Hồ sơ lớp có chế độ "Chọn nhiều học viên" cho Lưu trữ / Kết thúc / Huỷ chuyển / Xoá (A3-24). Đó là **thao tác hàng loạt, không phải xuất** → giữ dạng chế độ bật / tắt. Thêm "Xuất" vào thanh của nó thì cùng mở panel Xuất với danh sách đã chọn.
- Nút xuất ở panel số Báo cáo / Phân tích (mockup 5 "cùng nút ở mọi panel danh sách") — chưa có, sau dùng chung panel này.
- Mockup 5 khung 2 cần sửa (luật 9.1-1).

**7. Trình tự:**
- **M4 (HV & Lớp)**: panel Xuất có khối chọn em + bỏ ô tick. Cần mockup nhỏ cho panel (1440 + 375).
- Làm cùng PR với lọc SOS 1/2/3 (A3-13) và nút chia đôi "Xuất Excel · n HV ▾" (A3-22).
- Phần máy chủ không đổi: `/hoc-vien-lop/xuat` đã nhận `ids`.

**8. Cần chủ SP xác nhận:** Q6.

---

## V2A-06 Lịch thi: hàng một dòng có trạng thái + 2 việc, chi tiết mở dưới hàng (I.6 — 6.1) · [ĐỀ XUẤT] · P1

**1. Vấn đề [ĐÃ KIỂM — ảnh `lt-qt-11-p1`, `lt-chotngay`, `lt-375-p1`, `mk5-q1-p1`; đo DOM]**
- Trang 10 hàng có **34 nút Kết luận + 10 ô ghi chú**. Hàng cao trung bình 66 px (cột Kết quả gần nhất 3 dòng: "6.0 −0.5 SOS 2 · W, S / MT2 · kỳ vọng 6.5 / Không đạt: W S").
- Thanh trên có 12 nút tháng (mockup vẽ **một ô chọn** "Tháng dự kiến thi 11/2026 ▾" + Chi nhánh + Lớp — A3-20).
- Chọn 11/2026 + 12/2026 + 01/2027 → 45 HV / 5 trang, trong đó **41 em "Chưa có dự kiến thi"** nằm chung bảng, chung phân trang.
- **Dải đếm cộng sai [ĐÃ KIỂM]:** chọn 11/2026 → "Dự kiến thi 11/2026 · **1 HV** · 0 đã chốt ngày · 1 giữ tháng · 0 chuyển tháng · **1 cần xác nhận** · 0 chưa rà" — tổng 2 ≠ 1.
  - Nguyên nhân: `demKetLuan` cộng em "Chưa có dự kiến" có kết luận "Cần xác nhận" vào số cần xác nhận (`lichThiOv15f.ts:74`), trong khi "1 HV" chỉ đếm em có tháng (`GocLichThi.tsx:126`).
- 375: 4 055 px cho 10 hàng; hàng đầu ở y = 789 px.
- Lịch thi **không nhóm theo trạng thái**. Em sắp thi đã chốt ngày, em đã tới tháng mà chưa có ngày, em còn xa đều trộn, xếp theo lớp rồi tên (`lichThi.ts:148`).

**2. Nguyên nhân:**
- OV-15f dựng theo mockup 5 khung 1 (4 nút Kết luận / hàng — mockup cũng vậy) nhưng **đổi ô tháng thành 12 nút** (lệch không ghi lý do).
- Hàng dùng lại `KetQuaOHocVien` 3 dòng của bảng Tất cả.
- Mockup 5 thiết kế cho **buổi họp rà soát** (bấm kết luận từng em). Luật mới 6.3 biến Lịch thi thành **danh sách theo trạng thái lịch** → cấu trúc cũ không còn khớp mục đích.

**3. Ảnh hưởng:**
- Họp rà 8 em mất: chọn tháng (1–2) + mỗi em 1–2 bấm, phải dò 4 nút / hàng.
- Không nhìn ra ngay "ai sắp thi mà chưa có ngày".
- Ghi chú cắt chữ trong ô 1 dòng.
- Trên 375 cuộn 5 màn cho 10 em.

**4. Phương án [ĐỀ XUẤT]**
- **Thanh lọc:** Chi nhánh · Lớp · **Tháng dự kiến [10/2026] → [11/2026]** (dáng `Khoảng tuần`, đơn vị tháng; mặc định tháng này → tháng sau) · Xuất Excel · n HV ▾.
- **Nhóm (theo trạng thái, mỗi nhóm có số; đếm toàn bộ trước khi chia trang):**
  1. **Chưa chốt ngày — đã tới tháng** (B, có việc "Chốt ngày thi") · mở sẵn
  2. **Đã chốt ngày** (A) — xếp theo ngày gần nhất
  3. **Dự kiến** (chưa tới tháng) · mở sẵn
  4. **Chưa có tháng thi** · gập, chỉ em FT
- **Hàng (1440, ≈ 44 px, một dòng):**
  - **Học viên** (tên = link "Hồ sơ ↗", dòng phụ "MB FT 101 · TVV Phan Mai")
  - **Gần nhất** ("MT3 · 6.0 / 6.5 ✗" — số tô theo token kết quả 10.1)
  - **Target**
  - **Lịch thi** (chip trạng thái — V2A-08)
  - **Ghi chú** (một dòng, sửa tại chỗ)
  - **[Chốt ngày] [Dời tháng]**: em chưa có tháng → [Đặt tháng]; em đã có ngày → [Đổi ngày].
- **Mở rộng dưới hàng** (bấm hàng / ▸, thang tại chỗ bậc 2; một hàng mở một lúc):
  - 4 kỹ năng của MT gần nhất so kỳ vọng.
  - **Các bài Test sắp tới** (MT kế · tuần, Final / Progress lớp thường).
  - PA "đến lúc thi" đang chạy.
  - GVCN.
  - Lịch sử lịch thi (ai đặt tháng / chốt ngày, lúc nào — đã có `chotNgayCua`, `lichThi.ts:65`).
  - Ghi chú cũ, kèm tác giả.
  - "Bỏ ngày" (thay "Giữ tháng" ở em đã chốt ngày).
- **375:** thẻ 2 dòng (tên + chip trạng thái / "MT3 6.0 ✗ · Target 6.5"), 2 nút 44 px; mở rộng toàn bề ngang.
- Dải đếm = số của từng nhóm (cùng hàm `trangThaiLichThi`) → hết lỗi cộng sai.

**5. Vì sao tốt hơn:**
- Nút / hàng 4 → 2; bỏ 12 nút tháng.
- Việc gấp (B) luôn ở trên cùng, không phụ thuộc tháng đang chọn.
- Hàng 1 dòng (≈ 44 px thay 66 px) → 10 hàng ≈ 1 màn 1440.
- Thông tin để quyết (điểm từng kỹ năng, Test sắp tới) **ngay dưới hàng**, không cần panel hay đổi trang (CLAUDE.md "xử lý tại chỗ", 10.3 bậc 2).
- Tình huống "họp rà tháng 11, 8 em": hiện 1–2 + 8–16 bấm + dò 4 nút → sau 0 (mặc định đã đúng tháng) + 8–16 bấm, nhóm sẵn theo việc cần làm.

**6. Ảnh hưởng khu vực khác:**
- Bảng lớp ở Tất cả: cột "Dự kiến thi" + "Sắp tới" gộp (V2A-08, A3-06).
- `KetQuaOHocVien` (dùng ở 3 bảng: `BangHocVienLop`, `GocLichThi`, `HocVienTheoVai`) — sửa một lần cho cả 3.
- Panel Xuất (cột "Kết luận" → "Lịch thi"); TVV / CX góc Lịch thi (`HocVienTheoVai.tsx:322`); lối "Lịch thi thật ›" ở Lịch Test (`LichTestTab.tsx:301`).

**7. Trình tự:** sau **LT-SV** (máy chủ, V2A-08). Rồi **M4** với **mockup 5 sửa** (1440 tối + 375 sáng, đủ 4 nhóm + trạng thái lưu / lỗi).

**8. Cần chủ SP xác nhận:** Q2, Q3.

---

## V2A-07 "Ghi chú họp" → "Ghi chú"; "Cần xác nhận" thực chất là gì (I.6 — 6.2) · [ĐÃ CHỐT đổi tên; kết luận ĐÃ KIỂM; cách hiển thị ĐỀ XUẤT] · P2

**1. Vấn đề [ĐÃ KIỂM]**
- "Ghi chú họp" ở 3 chỗ hiện ra: đầu cột `GocLichThi.tsx:145`, aria ô nhập `:245`, cột tệp xuất `lichThiOv15f.ts:93`.
- Cùng ghi chú đó, Lịch sử HV gọi "**Ghi chú lịch thi**" (`server/src/students/lichSuSua.ts:53`).
- Còn ghi chú lịch **MT** (C21) cũng tên "Ghi chú lịch thi" (`HopKyNang.tsx:384`, `LuoiKeHoach.tsx:152`) → một khái niệm 2 tên, một tên 2 khái niệm.

**"Cần xác nhận" = gì? — bằng chứng:**
- **Mã:** một trong 4 kết luận (`KET_LUAN_LICH_THI`, `lichThiOv15f.ts:9`).
  - Lưu ở `learning_cycles.lich_thi_ket_luan`.
  - **Không đổi lịch** (`suaLichTheoKetLuan` → `examDate: undefined`, `:64-65`).
  - **Không sinh việc, không ai phụ trách** (`lichThi.ts:6-7` "không tạo việc").
  - Hết hiệu lực khi tháng dự kiến đổi (`ketLuanHienTai`, `:40-45`). Chỉ hiện ở dải đếm.
- **Quyết định đã chốt 19/10:** "'Cần xác nhận' không tự tạo việc" (đặc tả OV-14 mục 6, dòng 156).
- **Mockup 5 (ý định):** dùng cho "**Chờ phụ huynh đồng ý dời sang 12/2026**" (Kiều Thu Trang) — nghĩa là *đã bàn ở buổi họp nhưng chưa quyết được, chờ phụ huynh / HV / trung tâm thi xác nhận*; "chỉ hiện ở dải đếm 'Còn' cho buổi họp sau".
- **DB demo:** 1 em (Đặng Thu Hà, chưa có tháng) mang "Cần xác nhận", không ghi chú.

→ **Kết luận:**
- Về ý định, "Cần xác nhận" = **"đã bàn, còn treo"** — khác "chưa rà" ở chỗ có người đã xem.
- Về **đầu ra** (luật chủ SP 08/10: nghĩ đầu ra trước), nó **giống hệt "chưa có kết luận"**: lịch không đổi, không việc, không người, không hạn. Thông tin duy nhất phân biệt là *lý do chờ* — mà lý do lại nằm ở **ghi chú**.

**2. Nguyên nhân:** mockup 5 sinh "Kết luận" cho buổi họp (biên bản). Luật mới 6.3 đã tự tạo trạng thái "Chưa chốt ngày" + việc "Chốt ngày thi" → hai trạng thái biên bản "Giữ tháng" / "Cần xác nhận" thành thừa.

**3. Ảnh hưởng:** 4 nút / hàng, trong đó 2 nút không tạo đầu ra. Dải đếm cộng sai (V2A-06). Người mới không biết bấm "Giữ tháng" hay "Cần xác nhận" khi phụ huynh chưa trả lời.

**4. Phương án [ĐỀ XUẤT]:**
- (1) Đổi tên: **"Ghi chú"** ở Lịch thi + tệp xuất + Lịch sử (trường "Ghi chú" trong nhóm "Lịch thi"). Ghi chú MT đổi thành "Ghi chú lịch Test" (V2A-03).
- (2) **Bỏ nút "Cần xác nhận" và "Giữ tháng".** Trạng thái tự suy từ dữ liệu: Dự kiến · **Chưa chốt ngày** · Đã chốt ngày (V2A-08). Lý do chờ ghi vào Ghi chú.
- (3) Dữ liệu cũ mang `can-xac-nhan` / `giu-thang`: **giữ trong DB**, không migrate. Hiển thị theo trạng thái tự suy; Ghi chú giữ nguyên. Lịch sử vẫn đọc được nhãn cũ.
- (4) *Nếu chủ SP muốn giữ "đã bàn, còn treo"*: thay nút bằng dòng phụ "đã bàn 14/10" tự ghi khi có người sửa Ghi chú — không thêm nút.

**5. Vì sao tốt hơn:**
- Bớt 2 nút / hàng (34 → ~20 nút / trang).
- Một trạng thái nói đúng việc cần làm ("Chưa chốt ngày" → ai đó phải chốt).
- Không còn trạng thái không đầu ra.
- So với giữ nguyên: "Cần xác nhận" không ai chịu trách nhiệm nên dễ treo mãi. "Chưa chốt ngày" có việc, có người.

**6. Ảnh hưởng khu vực khác:** `xuatDanhSach.ts:31` (cột "Kết luận"), `lichSu.ts:37` (nhãn hệ thống "Kết luận lịch thi"), `nhatKy.ts:41`, i18n EN, phép kiểm `prOv15f.tests.ts` (82–93, 159–193).

**7. Trình tự:** đổi tên "Ghi chú" → **GĐ1** (chỉ chữ). Bỏ 2 nút + trạng thái tự suy → **M4** cùng V2A-06, sau LT-SV.

**8. Cần chủ SP xác nhận:** Q2.

---

## V2A-08 Tháng dự kiến thi + ngày thi cụ thể: trạng thái A / B, việc "Chốt ngày thi" (I.6 — 6.3) · [ĐÃ CHỐT — nghiệp vụ; hiển thị + máy chủ ĐỀ XUẤT] · P1

**1. Hiện trạng mã [ĐÃ KIỂM]**

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| DB có tháng + ngày? | **Có**: `learning_cycles.exam_month` (YYYY-MM), `exam_date` (ngày), thêm `exam_period_id` (**tuần**, mức thứ ba) | `server/src/fasttrack/cycles.ts:89-118` `examPlanOf` (week / month / none) |
| Demo hiện có | 126 lộ trình đang chạy: 101 chưa có gì · 16 chỉ tháng · **8 có tuần không có ngày** · 1 có ngày (Bùi Thảo Vy 17/09) | `chup/v2a-db.cjs` |
| API sửa | `PUT /hoc-vien-lop/lich-thi/:cycleId` (chot-ngay · chuyen-thang) → `updateCycle`; hồ sơ HV sửa Dự kiến thi | `classes/lichThi.ts:156-200` |
| Việc tự sinh trước kỳ thi | **Không có.** Chỉ có việc SAU thi: "Cập nhật kết quả thi thật" (GVCN, có hạn) và "Chọn bước tiếp" | `worklist/mywork.ts:221-229`, `loTrinh/thiThat.ts:154` |
| Mẫu việc không hạn tự sinh khi đọc | Có sẵn: "Điền Target", "Chốt tuần MT", "Nhập điểm MT cũ" (`due: null`) | `mywork.ts:1104-1144` |

**Chỗ đang coi "có tháng" như đã chốt / đã thi:**
- **P1 [ĐÃ KIỂM — mã; GIẢ THUYẾT trên web: kiểm bằng demo riêng đặt ngày nghiệp vụ 01/12/2026, em Chu Nhật Minh]**
  - `ngayThiSauThi` lấy **ngày cuối tháng dự kiến làm ngày thi** (`shared/domain/tongKetLoTrinh.ts:118-119`). Câu chọn còn lấy mùng 1 làm cận dưới (`thiThat.ts:132-133`).
  - → hết tháng mà chưa ai chốt ngày, em tự thành **"Đã thi · chờ KQ"**. Hàng tô màu "đã thi". GVCN có việc "Cập nhật kết quả thi thật" **có hạn**, quá hạn đỏ.
  - Trái luật mới ("giữ tháng chưa ngày ≠ đã chốt lịch").
- Hồ sơ HV `profile.ts:802` (`exam_month-01 < hôm nay` → "có thể đã thi").
- TVV "Sắp thi" 6 tuần tính cả em chỉ có tháng, gộp A và B (`hvCuaToi.ts:79-83`; ô "Sắp thi · thi IELTS trong 6 tuần tới" `tq-tvv23-p1`).
- Mức **tuần** (`exam_period_id`): cũng được coi là ngày thi (Chủ nhật của tuần — `examDateOf` `sosAuto.ts:55-63`, `ngayThiSauThi:117`). Demo có 8 em. Luật mới nói "ngày cụ thể" → cần chủ SP chốt (Q1).
- Đúng luật mới sẵn: `examDateOf` **không** bịa ngày từ tháng (`sosAuto.ts:51-63`) → mốc PA "đến lúc thi" khi chưa có ngày đã theo MT cuối (Rulebook 20.16).

**Lỗi hiển thị liên quan [ĐÃ KIỂM]:**
- Hồ sơ HV Bùi Thảo Vy: thi **17/09** (còn 3 ngày) nhưng ô "Sắp tới" ghi "**Chưa có mốc · chưa xếp lịch Test**". `oSapToi` chỉ xét MT (`shared/domain/hoSoHocVien.ts:346`; ảnh `hv-vy`).
- "Thi thật · chưa có ngày" hiện cho em **chưa có cả tháng** (`sapToi.ts:16`).
- Ô "Chốt ngày" ở Lịch thi **chặn ngày đã qua** (`GocLichThi.tsx:230` `toiThieu={homNay}`) → hết tháng, em đã thi thật, vẫn không ghi được ngày đó ở chỗ này.
- Một dữ liệu 4 dạng: "17/09/2026" · "NOV 2026" (`examPlanOf` nhãn tháng `cycles.ts:115`) · "11/2026" (Lịch thi) · "W2 JAN 2027" / "Dự kiến W2 JAN 2027" (2 dòng).

**2. Nguyên nhân:** luật cũ (Rulebook dòng 258: "có thể mới biết tháng, sau bổ sung tuần / ngày") không có trạng thái "tới tháng mà chưa ngày". Hàm "sau thi" (OV-13q) cần **một** ngày để tính hạn nên lấy ngày cuối tháng. Mỗi màn tự viết nhãn dự kiến thi.

**3. Ảnh hưởng:**
- Em chưa chốt ngày bị đẩy sang "Đã thi" → GVCN nhận việc nhập kết quả **cho một kỳ thi có thể chưa diễn ra**. Số "Đã thi · chờ KQ" ở Tổng quan sai.
- TVV không phân biệt được em nào cần gọi để chốt ngày.
- QL mở hồ sơ không thấy em sắp thi.

**4. Phương án [ĐỀ XUẤT — không đổi logic chủ SP chốt]**

*Một hàm, một nguồn:* `trangThaiLichThi(cycle, homNay)` → `chua-co` · `du-kien` · **`chua-chot-ngay` (B)** · **`da-chot-ngay` (A)** · `da-thi-cho-kq` · `co-kq-cho-buoc-tiep` · `xong`.
- B = có tháng (hoặc tuần — Q1), không có ngày, **tháng dự kiến ≤ tháng hiện tại**.
- A = có `exam_date` ≥ hôm nay.
- `da-thi-cho-kq` **chỉ** khi có ngày (hoặc `thi_that_ngay`) và ngày < hôm nay.
- Dùng chung cho hàng HV, đầu hồ sơ, Tổng quan, Công việc, Lịch thi, tệp xuất (CLAUDE.md "cùng số liệu cùng hàm").

*Hiển thị (token, không lẫn SOS vàng / cam / hồng và kết quả `--kq-*`, không chỉ bằng màu):*

| Trạng thái | Chip | Màu | Không chỉ màu |
|---|---|---|---|
| A — Đã chốt ngày | **"Thi 21/11"** + "· còn 9 ngày" khi ≤ 14 ngày | họ màu "đã thi" có sẵn: nền `--da-thi-bg-rgb`, viền `--ok` (theo gợi ý chủ SP) | chữ "Thi + ngày", biểu tượng lịch ✓ |
| B — Chưa chốt ngày | **"Chưa chốt ngày thi · 11/2026"** | trung tính (chữ `--text`), **viền đứt** — không vàng | chữ + viền đứt + ◌ |
| Dự kiến (chưa tới tháng) | "Dự kiến 11/2026" chữ thường | không màu | — |
| Chưa có | "Chưa có tháng thi" chữ mờ (chỉ vai sửa được thấy) | — | — |
| Đã thi · chờ KQ | giữ nền cả hàng như OV-15a | như cũ | chữ |

*Đặt ở đâu:*
- **Hàng HV (Tất cả):** gộp cột "Dự kiến thi" + "Sắp tới" thành **"Thi thật"** (chip trên). "Sắp tới" chỉ còn Test kế (A3-06).
- **Đầu hồ sơ HV (thanh thông tin):**
  - A: chip "Thi thật 21/11 · còn 9 ngày" đứng **đầu dòng 2**, không chìm trong chữ.
  - B: chip + nút nhỏ "Chốt ngày" (vai có quyền).
  - Ô "Sắp tới": lấy cái **sớm hơn** giữa MT kế và kỳ thi thật.
- **Tổng quan QL (bố cục B, 10.2):** nhóm "**Lịch thi thật · n chưa chốt ngày**" trong "Cần bạn quyết" (gập khi 0).
- **Tổng quan TVV:** ô "Sắp thi" tách "n đã chốt · m chưa chốt ngày"; việc "Chốt ngày thi" nằm trong khối việc (V2A-04).
- **Công việc:** dòng việc "Chốt ngày thi · Chu Nhật Minh · dự kiến 11/2026", **không hạn** (xếp sau việc có hạn, như "Điền Target"), không vào số quá hạn, không vào chuông.

*Việc "Chốt ngày thi":*
- **Sinh khi** B đúng (từ mùng 1 tháng dự kiến, theo ngày nghiệp vụ). Tính khi đọc — **không migrate, không cron**, theo mẫu `mywork.ts:1104-1129`.
- **Tắt khi** có `exam_date` · tháng dời sang tháng sau (tháng mới > tháng hiện tại → về "Dự kiến") · có kết quả thi thật / "Không thi" · em Tạm dừng / Lưu trữ / chuyển lớp đóng lộ trình.
- **Ai thấy:**
  - **Người làm:** TVV phụ trách em (`students.consultant_user_id`); không có TVV → QL chi nhánh.
  - QL thấy cả chi nhánh. GVCN chỉ thấy chip trên hàng, không có việc.
  - Quyền sửa giữ nguyên: `student.edit` / `student.edit_info`.
- **Làm tại chỗ (thang 10.3 bậc 2):** bấm việc / chip B → **hộp nhỏ neo tại chip**:
  - [ô ngày `ONgay`] · [Dời sang 12/2026] (mặc định tháng sau, đổi được) · Ghi chú.
  - Lưu ngay, có "Đã lưu / lỗi giữ chữ / Thử lại" như Lịch thi. 2 bấm.
- **Ngày đã qua:** cho phép (em đã thi thật). Ngày < hôm nay → hỏi một dòng "Em đã thi 28/11?" → lưu → em vào "Đã thi · chờ KQ" đúng luồng OV-13q.

*Phần máy chủ cần thêm (cho kế hoạch PR **LT-SV**):*
1. `shared/domain`: `trangThaiLichThi` + phép kiểm bảng trạng thái (tháng trước / này / sau, có / không ngày, tuần, ngày đã qua).
2. `tongKetLoTrinh.ts:113-121` `ngayThiSauThi`: **bỏ nhánh tháng** (và nhánh tuần nếu Q1 = "tuần chưa phải ngày"). Sửa cận dưới `SQL_CHO_KET_QUA_THI` (`thiThat.ts:132-133`) và `profile.ts:802`.
   - Kiểm trước khi đổi: lộ trình nào đang "Đã thi · chờ KQ" chỉ nhờ tháng (lệnh `ops` chỉ đọc, như `kiemTruocOv13q.ts`).
3. `mywork.ts`: nhóm việc mới `chot_ngay_thi` (nhãn "Chốt ngày thi", `due: null`, người = TVV / QL).
   - Thêm vào Cần làm TVV (đến khi M7 chuyển về Tổng quan TVV).
4. `hvCuaToi.ts:79-84`: "Sắp thi" tách A / B.
5. `GocLichThi` / API: nhận ngày đã qua khi trạng thái là B (máy chủ `updateCycle` đã kiểm cận năm).
6. `sapToi.ts:16`, `hoSoHocVien.ts:346` (`oSapToi` gồm kỳ thi thật), nhãn tháng `examPlanOf` → "11/2026".

**5. Vì sao tốt hơn (tình huống thật):**

| Tình huống | Hiện tại | Sau |
|---|---|---|
| 01/12, Chu Nhật Minh (dự kiến 11/2026) chưa có ngày | máy coi **đã thi**, GVCN có việc nhập KQ có hạn (sai) | B "Chưa chốt ngày thi", TVV có việc không hạn; GVCN không bị giao sai |
| TVV đầu tháng biết em nào cần gọi chốt ngày | mở Lịch thi, chọn tháng, đọc 4 nút từng hàng (≥ 3 bấm) | Tổng quan TVV: danh sách sẵn (0 bấm) |
| Chốt ngày cho em | Lịch thi → chọn tháng → tìm em → Chốt ngày → chọn ngày = 4–5 | bấm việc / chip B → chọn ngày = **2**, ở bất kỳ màn nào có chip |
| Em đã thi 28/11, chưa ai ghi | không ghi được ở Lịch thi (chặn ngày qua) | ghi được, hỏi một dòng, vào luồng "Đã thi" |
| QL mở hồ sơ em thi sau 3 ngày | "Sắp tới: Chưa có mốc" | chip "Thi thật 17/09 · còn 3 ngày" |

**6. Ảnh hưởng khu vực khác:** Tổng quan ("Đã thi · chờ KQ"), Học viên & Lớp lọc "Đã thi · chờ kết quả" (`hvCuaToi.ts:75`), Công việc (thi_that, buoc_tiep), Kết quả thi › Thi thật, hồ sơ HV (đầu + 4 ô), panel một em, tệp xuất ("Lịch thi thật"), Hướng dẫn TVV / QL, Lịch sử HV. Lớp thường cũng có Dự kiến thi "chỉ để theo dõi" (Rulebook §20.1 dòng 19) → Q1.

**7. Trình tự:**
- **LT-SV** (máy chủ, tự merge được): hàm + sửa "tháng = đã thi" + việc mới. **Nên làm ở GĐ1** vì là lỗi sai dữ liệu P1 — em sẽ bị đánh "đã thi" từ 01/12.
- Rồi **M4** (chip trên hàng + Lịch thi V2A-06), **M1** (nhóm ở Tổng quan), **M7** (TVV).
- Cần **mockup** cho chip A / B (1440 + 375, đủ 5 trạng thái).

**8. Cần chủ SP xác nhận:** Q1 (mức tuần · lớp thường · ai làm · "đến tháng" = mùng 1 · dời tháng mấy tháng).

---

## V2A-09 Mở rộng: cùng cấu trúc trên toàn web (ngắn) · [ĐÃ KIỂM bằng mã]

| Cấu trúc | Chỗ có | Lỗi chung | Sửa một lần ở |
|---|---|---|---|
| Bảng nhóm theo lớp + phân trang | Tất cả, Đang SOS (`BangSos`), Cần làm (`BangCanLam`), TVV / CX (`HocVienTheoVai`), Lịch Test (`HangLop`, `KhoiNo`), Kế hoạch Test (`LopKeHoach`), Kết quả thi › Thi thật; **Lịch thi không có đầu nhóm lớp** | số đầu nhóm đếm theo trang (A3-02, A7-09); đầu nhóm mỗi nơi một dáng | `ui/HangNhom.tsx` + `PhanTrang`: đếm trên toàn bộ, chia trang theo nhóm |
| "Bộ lọc thêm" (chip nhóm) | chỉ Tất cả (`StudentsPage.tsx:443-464`); mockup 5 muốn SOS 1/2/3 ở hàng chính (A3-13) | nhãn dài, chip "Mọi lúc ✕" nghĩa ngược, thời gian dùng hộp riêng | thành phần dải lọc M0 + `Khoảng tuần` |
| Ô "Kết quả gần nhất" 3 dòng | `KetQuaOHocVien` ở 3 bảng (Tất cả, Lịch thi, TVV / CX) | lặp điểm cột, "−0.5", "Không đạt: S" (A3-06) | một ô 1 dòng "MT3 · 6.0 / 6.5 ✗" |
| Ô "Việc tiếp theo" nhiều dòng | Tất cả, Đang SOS, Cần hỗ trợ (hồ sơ lớp) | 4–5 dòng, 3 hành vi bấm (A3-07) | 1 việc + "+n", nút mở panel tại chỗ |
| Dự kiến thi / kỳ thi thật | cột Tất cả, Sắp tới, hồ sơ HV, Lịch thi, xuất, TVV | 4 dạng chữ; "chưa có ngày" sai nghĩa | `trangThaiLichThi` + một hàm nhãn (V2A-08) |
| Panel xuất danh sách | Tất cả, Lịch thi, TVV / CX (`NganXuatDs`) | phạm vi "đã chọn" chỉ khi có ô tick | khối chọn em trong panel (V2A-05) |
| Chọn thời gian | 14 chỗ (V2A-01) | 5 dáng | `Khoảng tuần` |

Ghi chéo (thuộc agent khác): ô điểm W "7.0 ✓ / 7.0 · / 7.0" 3 dòng và "Thi W2 SEP" trong ô điểm → I.7 / II.4. Panel Nhập điểm mở từ Cần làm là khung "Trước" (CV-04) → nhóm II / Công việc.

---

## Câu hỏi cho chủ SP (quan trọng trước, mỗi câu kèm khuyến nghị)

1. **Lịch thi thật — 5 điểm luật cần chốt trước khi làm máy chủ (6.3):**
   - (a) **Mức tuần** (đã chốt tuần, chưa có ngày — demo có 8 em, ví dụ Trần Thu Hà "W2 JAN 2027") tính là "Chưa chốt ngày" hay "Đã chốt"? — *Khuyến nghị: "Chưa chốt ngày" (luật mới đòi ngày cụ thể), chip ghi "W2 JAN · chưa chốt ngày"; việc sinh khi tới tháng của tuần đó.*
   - (b) **"Đến tháng"** = mùng 1 của tháng dự kiến? — *Khuyến nghị: có.* Có muốn nhắc sớm hơn (ví dụ 4 tuần trước để kịp đăng ký thi)? — *Khuyến nghị: không, giữ đúng lời chủ SP; cần thì thêm sau.*
   - (c) **Ai làm việc "Chốt ngày thi"?** — *Khuyến nghị: TVV phụ trách em; em không có TVV → QL chi nhánh; GVCN chỉ thấy chip.*
   - (d) **Dời tháng** chỉ sang tháng sau hay chọn tháng bất kỳ về sau? — *Khuyến nghị: mặc định tháng sau, cho chọn tháng khác.*
   - (e) **Lớp thường** (Dự kiến thi "chỉ để theo dõi") có trạng thái B và việc này không? — *Khuyến nghị: chỉ Fast Track; lớp thường chỉ hiện chip, không sinh việc.*
2. **Bỏ "Giữ tháng" và "Cần xác nhận"** ở Lịch thi, thay bằng trạng thái tự suy (Dự kiến / Chưa chốt ngày / Đã chốt ngày) + 2 việc "Chốt ngày" · "Dời tháng"; lý do chờ ghi vào "Ghi chú"; dữ liệu cũ giữ trong DB? — *Khuyến nghị: có. Bằng chứng: "Cần xác nhận" không đổi lịch, không sinh việc, không người phụ trách (chốt 19/10) → về đầu ra = "chưa có kết luận".*
3. **Lịch thi lọc theo tháng** (ngoại lệ của luật "chỉ tuần"), dáng "Tháng dự kiến [10/2026] → [11/2026]", mặc định tháng này → tháng sau, nhóm theo trạng thái (Chưa chốt ngày luôn trên đầu)? — *Khuyến nghị: có.*
4. **Bỏ góc "Cần làm"** ở Học viên & Lớp (QL, QT, GV, Admin), thay bằng chip "⚠ n quá hạn" mở rộng ngay dưới hàng lớp; **việc của TVV chuyển lên Tổng quan TVV** (TVV chưa có trang Công việc)? — *Khuyến nghị: có (4/4 tình huống ít bước hơn; hết lệch 181 ↔ 84 việc, 40 ↔ 33 quá hạn).*
5. **Chữ cho Test:** "Tuần Test", "Đã làm bài" (thay "Đã thi" cho MT), "Không làm bài" (thay "Không dự thi"), "Huỷ kỹ năng" (thay "Huỷ phần thi"), "Dời lịch Test", "Test lại"; tab Phân tích "Kết quả thi" → "Kết quả Test"; sửa luôn bảng thuật ngữ 01/10, chữ trong Rulebook, mockup 4 / 5? — *Khuyến nghị: có ("làm bài" tự nhiên hơn "dự Test").*
6. **Xuất Excel — phương án 3:** bỏ ô tick khỏi bảng; trong panel Xuất có khối "Học viên · n" (gom theo lớp, chọn hết sẵn, tìm tên, bỏ / chọn em) — áp cho mọi danh sách dùng panel này; sửa mockup 5 khung 2? — *Khuyến nghị: có.*
7. **"Tháng = đã thi"** (P1, V2A-08): sửa ở **GĐ1 trước deploy** cùng việc "Chốt ngày thi" (PR máy chủ LT-SV, tự merge được)? — *Khuyến nghị: có — nếu không, từ 01/12 mọi em chỉ có tháng 11 sẽ bị đánh "Đã thi · chờ KQ" và GVCN nhận việc sai.*
8. **Mặc định khoảng thời gian:**
   - Phân tích **2 tuần hoàn chỉnh trước** (giữ C24).
   - Tutor và Bộ lọc thêm **tuần trước → tuần này**.
   - Hiệu quả PA **8 tuần** (PA cần thời gian mới có kết quả — A5-21).
   - Lịch Test, Góp ý tuần **một tuần**.
   - Báo cáo đơn vị bỏ "Tháng" (đọc nhiều tuần bằng khoảng).
   - Cửa sổ cố định 30 / 60 / 7 ngày giữ nguyên.
   — *Khuyến nghị: đồng ý cả gói; nhãn Báo cáo tự ghi "(tháng 09/2026)" khi khoảng trùng đủ tuần của một tháng.*

[CẦN ẢNH] (không bắt buộc):
- Bản chính, vai TVV đông em: Tổng quan TVV + Học viên & Lớp › Cần làm (để đo số việc TVV thật trước khi chuyển chỗ).
- Một em thật đã qua tháng dự kiến mà chưa có ngày (nếu có) — hồ sơ + Tổng quan, để thấy lỗi "tháng = đã thi" trên dữ liệu thật.

---

## Ảnh tiêu biểu

Thư mục: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v2a\`
1. `…\anh\v2a\tg-locthem-hop.png` — Bộ lọc thêm: "Tuần thi của kết quả", hộp 4 kiểu mất nút "Tùy chọn", chip "Mọi lúc ✕" sáng khi đang lọc; hàng em có ô tick (V2A-01, 02, 05).
2. `…\anh\v2a\tg-pt-hop-tuan.png` — Phân tích: chế độ "Theo tuần" (Từ tuần / Đến tuần) — nền cho thành phần `Khoảng tuần` (V2A-01).
3. `…\anh\v2a\tg-pt-375-hop.png` — 375: hộp thời gian phủ bảng (V2A-01).
4. `…\anh\v2a\cl-qt-p1.png` — Cần làm QT Monbay: 8/10 hàng "Cả lớp · n em", "Người giữ", "1 em", 181 việc (V2A-04).
5. `…\anh\v2a\cl-gv7-p1.png` — Cần làm GVCN: chip "Chờ duyệt 8", "Thiếu thông tin 32" không phải việc của GV; việc lặp tên em (V2A-04).
6. `…\anh\v2a\tg-congviec-gv7-p1.png` — Công việc cùng GV: cùng việc, nhóm theo loại, đã có panel (V2A-04).
7. `…\anh\v2a\cl-qt-375-p1.png` — Cần làm 375: việc đầu ở y ≈ 745 px (V2A-04).
8. `…\anh\v2a\x-chon3.png` — 3 em đã chọn, thanh "3 đã chọn · Xuất các HV đã chọn"; "Thi thật · chưa có ngày" ở em chưa có tháng; "NOV 2026" (V2A-05, 08).
9. `…\anh\v2a\x-panel-chon.png` — panel Xuất: Phạm vi · Mẫu cột · 18 ô cột, "Ghi chú họp", "Tuần thi", mẫu "Kết quả thi" (V2A-05, 03, 07).
10. `…\anh\v2a\mk5-q2.png` — mockup 5 khung 2: danh sách phẳng có cột tick + lọc SOS (lệch web) (V2A-05).
11. `…\anh\v2a\lt-qt-11-p1.png` — Lịch thi: 12 nút tháng, 4 nút Kết luận / hàng, "Dự kiến W2 JAN 2027", 41/45 em "Chưa có dự kiến thi" (V2A-06).
12. `…\anh\v2a\lt-chotngay.png` — Lịch thi 11/2026: "1 HV" nhưng đếm "1 giữ tháng + 1 cần xác nhận"; ô Chốt ngày (V2A-06, 07).
13. `…\anh\v2a\mk5-q1-p1.png` — mockup 5 khung 1: ô chọn tháng, "Cần xác nhận" dùng cho "chờ phụ huynh đồng ý" (V2A-07).
14. `…\anh\v2a\hv-vy.png` — hồ sơ HV thi 17/09 (demo 14/09) mà ô "Sắp tới" ghi "Chưa có mốc" (V2A-08).
15. `…\anh\v2a\hv-minh.png` / `hv-tranha.png` — "dự kiến thi NOV 2026" / "W2 JAN 2027"; thẻ duyệt "Dời S · MT3", "phần thi bị huỷ" (V2A-08, 03).
16. `…\anh\v2a\tq-tvv23-p1.png` — Tổng quan TVV: "Sắp thi", "Đã thi · chờ kết quả" — chỗ đặt việc của TVV (V2A-04, 08).
17. `…\anh\v2a\lt-375-p1.png` — Lịch thi 375: 4 nút 2 × 2, hàng đầu ở y = 789 px (V2A-06).
