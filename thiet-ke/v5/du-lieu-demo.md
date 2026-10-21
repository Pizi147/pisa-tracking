# V5 — Bộ dữ liệu demo dùng chung (mọi mockup `thiet-ke/v5/`)

> **Dữ liệu giả, không phải số liệu thật.** Mọi mockup V5 dùng đúng người, vai, kỹ năng, lớp, lượt, hạn và số tổng dưới đây — không đổi vai / lớp / kỹ năng của một người giữa các màn (brief 19 B).
> Gốc: seed demo hiện có `server/src/seed/` (`data.ts`, `journeys.ts`, `students.ts`, `ov2aSeed.ts`, `tuSeed.ts`, `pb2bSeed.ts`, `yThucSeed.ts`, `sosV3Seed.ts`) + `DEMO.md`.
> Dòng có **[V5]** = bổ sung cho mockup, chưa có trong seed (code sau cần thêm vào seed nếu màn cần) — dùng ít nhất có thể.

## 1. Thời gian

| Mục | Giá trị |
|---|---|
| Hôm nay | **T2 14/09/2026 · W3 SEP** (`data.ts:15`, `journeys.ts:22`) — không dữ liệu nào sau ngày này |
| Tuần trước / tuần sau | W2 SEP (07/09) · W4 SEP (21/09) · W1 OCT (28/09) |
| Mã tuần | `W3 SEP` (năm chỉ ghi khi khác 2026). Ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký |
| Hạn chấm FT | hết T4 tuần sau tuần thi (MT3 14/09 → hạn 23/09) |
| Hạn chấm lớp thường | hết CN tuần thi |
| Hạn việc TVV (Báo PH) | **23:59 giờ VN ngày (lưu + 4)** — quyết định 22/10. Lưu T2 14/09 10:00 → hạn 23:59 T6 18/09 |
| Kỳ báo cáo mặc định | Báo cáo: 2 tuần trọn trước tuần này = **W1 SEP – W2 SEP** (`khoangThoiGian.ts:25`) · Phân tích GV: 4 tuần tới tuần này = **W4 AUG – W3 SEP** |

## 2. Chi nhánh

MB Monbay · BC Bãi Cháy · CP Cẩm Phả · HD Hải Dương · UB Uông Bí (`data.ts:17-23`). Mockup chi tiết dùng **MB** (đủ vai) và **CP** (có TVV, Admin VP).

## 3. Người — vai — kỹ năng (không đổi giữa các màn)

| Người | Vai (mã) | Chi nhánh | Kỹ năng / phụ trách |
|---|---|---|---|
| Đỗ Vũ Tuấn Phong | QT (`system_admin`) | toàn hệ thống | — |
| Nguyễn Khánh Vy | QL (`manager`) | MB | duyệt, Kế hoạch Test MB |
| Lê Ngọc Mai | QL | CP | |
| Trần Hải Đăng | QL | BC | |
| **Trần Ngọc Hà** ("cô Hà") | GV | MB | **L, R**; GVCN MB FT 101, MB FOU 12, MB FOU 15, MB BE 03, MB ELE 02, MB Pre FOU 03 |
| **Lê Minh Khoa** | GV | MB | **R, W (W1)**; GVCN MB FT RF 12, MB BE 04 — ca **T01** |
| Cao Khánh Linh | GV | MB | L, R (FT 102), W2 (FT 101, RF 12); GVCN MB FT 102 |
| **Phạm Thu Trang** | GV | MB + BC | **S** (dạy S mọi lớp MB, BC FT 205) |
| Lâm Quang Vinh | GV | MB | S; GVCN MB FT 105 (`pb2bSeed`) |
| **Đỗ Thu Hương** | GV | MB | **L, R**; **[V5] hồ sơ GV có thêm S, không dạy lớp S nào** → ca **T03** (khác TVV Nguyễn Thu Hương ở CP) |
| Võ Mỹ Duyên | GV | MB | W1, W2; GVCN MB FOU 16 |
| Ngô Bảo Nam | GV | CP | L, R, S; GVCN CP FT 110 |
| Hoàng Quang Dũng | GV | CP + HD | W1, W2 |
| Đào Minh Ngọc | Admin (`office_admin`) | CP | Mock Test, Kế hoạch Test |
| **Nguyễn Thu Hương** | TVV (`consultant`) | CP | 4 HV CP FT 110 (`ov2aSeed.ts:26-34`) |
| Vũ Thanh Tâm | CX | toàn hệ thống | |
| Hoàng Thị Hà | Head tutor | toàn hệ thống | trang Tutor |

Mật khẩu demo mọi tài khoản: `pisa2026` (không in trên mockup). GVCN là gán lớp (`is_core`), không phải vai.

## 4. Lớp dùng trong mockup

| Lớp | Loại | Bắt đầu | L / R / W / S | GVCN | Số HV | Lượt Test |
|---|---|---|---|---|---|---|
| **MB FT 101** | FT LT1 | 01/06 | Hà / Hà / W1 Khoa · W2 Linh / Trang | Hà | **22** | MT1 W1 JUL (06/07) · MT2 W3 AUG (17/08) · **MT3 W3 SEP (14/09, tuần này)** |
| MB FT 102 | FT LT2 | 29/06 | Linh / Linh / Khoa / Trang | Linh | 14 | MT1 03/08 · MT2 tuần này |
| MB FT RF 12 | FT RF | 07/09 | Hà / Khoa / W1 Khoa · W2 Linh / Trang | Khoa | 9 | MT1 W1 OCT |
| MB FOU 12 | Thường (FOU) | 27/07 | Hà / Hà / Khoa / Trang | Hà | 12 | Progress 17/08 · Final L/R 14/09, W 21/09, S 28/09 |
| CP FT 110 | FT LT1 | 13/04 | Nam / Nam / Dũng / Nam | Nam | 10 | MT1–MT3 xong, MT4 28/09 (QL thêm tay) |
| BC FT 205 | FT LT2 | 08/06 | Quân / Quân / W1 Hân · W2 Quân / Trang | Quân | 11 | MT2 07/09 **chưa có điểm → quá hạn** |
| UB FT 401 | FT LT2 | 23/02 | Kiên ×5 | Kiên | 8 | MT1–MT4 xong; thi thật 15/08 |

Số HV lớp là **[V5]** (seed có ít HV hơn; mockup cần mẫu số 20 cho T11).

## 5. Học viên mẫu (MB FT 101 — điểm MT2, kỳ vọng = Target − 0,5)

W = (W1 + 2×W2)/3 làm tròn 0,5 · Overall = TB 4 kỹ năng làm tròn 0,5 (x.25 → x.5, x.75 → x+1) — `scoring.ts:40-47, 226-229`. Overall ≥ kỳ vọng → SOS 0 dù có kỹ năng dưới (`scoring.ts:233-236`).

| HV | Target | MT2 L · R · W1 / W2 → W · S | Overall | KQ MT2 | Ngày thi | Ghi chú / ca |
|---|---|---|---|---|---|---|
| Nguyễn Minh An | 6.5 | 6.0 · 6.0 · 5.5/6.0 → 6.0 · 6.0 | 6.0 | ✓ Đạt | Dự kiến FEB 2027 | Case R (Khoa) chuyển từ BE; vắng S MT3 lần 1 |
| Trần Thu Hà | 6.0 | 5.5 · 5.5 · 5.5/5.5 → 5.5 · **5.0** | 5.5 | ✓ Đạt (S dưới — **T06**) | Dự kiến JAN 2027 | MT3 S vắng lần 2 → chờ QL duyệt (**T05**) |
| Lê Quang Huy | 6.5 | 6.0 · **5.0** · 5.0/5.5 → **5.5** · 6.0 | **5.5** ✗ | ✗ Chưa đạt · SOS 2 · R, W (**T07**) | Chưa có lịch | Case R (Hà) + Case W1 (Khoa); 3 vi phạm 08–10/09, hạn 14/09 [V5: điểm MT2] |
| Phạm Bảo Ngọc | 7.0 | 6.5 · 7.0 · 6.5/6.5 → 6.5 · 6.5 | 6.5 | ✓ Đạt | Dự kiến MAR 2027 | vi phạm quá hạn 1 ngày; MT3 đã có L 6.5 R 7.0 |
| Vũ Hải Đăng | 6.0 | 6.0 · 6.0 · 5.5/6.0 → 6.0 · 6.0 | 6.0 | ✓ Đạt (vượt) | — | ổn, không Case |
| Tô Ngọc Hân | 6.0 | 5.5 · 6.0 · 5.5/5.5 → 5.5 · **vắng** | — | – Chưa đủ dữ liệu (**T08**) | Chưa có lịch | [V5: điểm MT2] |

**Số tổng MT2 MB FT 101 (dùng ở Báo cáo, Tổng quan, Hồ sơ lớp, panel — T11):** 22 HV · **20 đủ dữ liệu** · **15 đạt** · 5 chưa đạt · 2 chưa đủ dữ liệu → **Đạt MT2 = 75 % = 15/20**. [V5]

## 6. Học viên ở lớp khác

| HV | Lớp | Ca |
|---|---|---|
| **Phan Gia Hân** | MB FT RF 12 | **T01** [V5]: Case R + Case W1, cả hai Lê Minh Khoa phụ trách → hai việc riêng "Ghi kết quả PA · R" và "Ghi kết quả PA · W1" |
| Chu Minh Hiếu | MB FT 102 | **T02**: Khoa chỉ dạy W ở FT 102 → nợ chấm của Khoa chỉ gồm W (14 bài), không gồm L/R của Linh, S của Trang |
| Ngô Hải Yến | CP FT 110 | **T10**: GVCN Nam lưu xử lý Report 1 lúc 10:00 T2 14/09 → việc Báo PH của TVV Hương, hạn 23:59 T6 18/09; lần 1 "Chưa liên hệ được" 15/09 |
| Bùi Thu Ninh | CP FT 110 | việc Báo PH kế tiếp (minh hoạ "Lưu và tiếp") [V5] |
| Hồ Thanh Tùng | CP FT 110 | **T04**: xong MT1–MT3 → không có gợi ý / việc MT4; QL Mai thêm MT4 W1 OCT tay trong Kế hoạch Test |
| Dương Minh Quân | UB FT 401 | thi thật 15/08: Overall 7.0 (L 7.5 R 7.5 W 6.5 S 6.5) ≥ Target 7.0 → ✓ Đạt Target (W, S dưới không tính tạch — C10) |
| Lý Thanh Trúc | UB FT 401 | thi thật 15/08: Overall 6.0 < Target 6.5 → ✗ Chưa đạt; đã chốt bước tiếp |
| **Đinh Ngọc Quyên** | CP FT 110 | **T09** [V5]: thi thật 12/09, TVV Hương nhập điểm 14/09 (Overall 7.0), **chưa chọn bước tiếp** → "Đã có kết quả · Chưa chốt bước tiếp" |
| Đặng Ngọc Lam | HD FT 302 | **T18** [V5]: cô Yến ghi bài trên lớp Reading 7/10 (thang /10) — chỉ ở Hành trình, không vào MT / KPI |
| Trương Gia Huy | BC FT 205 | MT2 07/09 chưa có điểm → bài quá hạn (đỏ ở Lịch tuần, nhóm Quá hạn ở Chấm Test) |

## 7. Công việc & đếm (cùng số ở mọi màn)

Đơn vị luôn ghi rõ: **việc** (một nhiệm vụ của một người) · **bài** (một ô điểm kỹ năng của một HV trong một lượt) · **HV**.

| Người xem | Số việc ở badge menu Công việc | Gồm |
|---|---|---|
| Cô Hà | **7 việc** | Chấm điểm 3 (MT3 L FT 101 · MT3 R FT 101 · Final L/R MB FOU 12 = 22 + 22 + 24 bài) · Case 2 (PA R Lê Quang Huy · PA L Phạm Bảo Ngọc) · Ý thức 2 (Huy hạn 14/09 · Ngọc quá hạn 1 ngày) |
| Thầy Khoa | **6 việc · 4 HV** | Chấm 2 (W MT3 FT 101 = 22 bài, hạn 23/09 — **T14** gập · W MT2 FT 102 = 14 bài) · Case 4 (PA R Nguyễn Minh An · PA W1 Lê Quang Huy · PA R + PA W1 Phan Gia Hân — **T01**) |
| Cô Trang | **2 việc** | Chấm S MT3 FT 101 (tuần thi này, hạn 23/09) · Chấm S MT2 BC FT 205 **quá hạn** |
| Cô Đỗ Thu Hương (GV) | **0 việc** | nhưng thấy **Bài thi Speaking tuần này** MB (FT 101 S 22 bài, FT 102 S 14 bài) — nguồn có thể chấm, không phải nợ (**T03**) |
| TVV Nguyễn Thu Hương | **3 việc** | Báo PH Ngô Hải Yến (hạn 18/09) · Báo PH Bùi Thu Ninh (hạn 18/09) · Sau thi Đinh Ngọc Quyên (chọn bước tiếp) |
| QL Vy | **4 chờ duyệt** | dời MT3 S Trần Thu Hà · PA Tutor (quá 1 ngày) · đổi Target Huy 6.5 → 7.0 · WL 3 Lương Gia Bảo |

> Hai dòng cô Hà / thầy Khoa là **[V5]** tổng hợp từ seed; session B vẽ màn nào thì đếm lại theo đúng bảng này và ghi "N việc · M bài" — không tự thêm việc.

## 8. Báo cáo — số tổng (T11, T17, T19, T20)

| Chỉ số (kỳ W1 SEP – W2 SEP trừ khi ghi khác) | MB | CP | BC | Toàn hệ thống |
|---|---|---|---|---|
| Đạt MT (HV có lượt MT chốt trong kỳ) | 15/20 = 75 % | 6/8 = 75 % | 2/10 = 20 % | **23/38 = 61 %** (tổng tử / tổng mẫu — **T20**, không phải TB 57 %) |
| Case có PA | 5/6 = 83 % | 3/4 = 75 % | 2/5 = 40 % | 10/15 = 67 % |
| Đạt Target thi thật | Chưa có dữ liệu (0 HV có KQ — **T19**) | 1/1 | — | UB: 1/2 = 50 % |
| HV thi tuần này (W3 SEP) | 2 | 1 | 0 | 3 |

Panel 75 % = 15/20: 20 dòng = 20 HV đủ dữ liệu; 2 HV chưa đủ dữ liệu nêu riêng ngoài mẫu; phân trang 10 dòng/trang vẫn ghi "20" (**T17**).

## 9. Ca T01–T22 → dữ liệu ở trên

| Ca | Ở đâu |
|---|---|
| T01 | Phan Gia Hân · Khoa (R + W1) |
| T02 | Khoa ở MB FT 102 (chỉ W) |
| T03 | GV Đỗ Thu Hương (có S, không dạy S) |
| T04 | Hồ Thanh Tùng (CP FT 110) |
| T05 | Trần Thu Hà — MT3 S `-` lần 2 tuần W3 SEP sau khi dời từ W2 SEP → huỷ / thẻ QL theo luật #503 |
| T06 | Trần Thu Hà MT2 (Overall 5.5 đạt, S 5.0 dưới) |
| T07 | Lê Quang Huy MT2 |
| T08 | Tô Ngọc Hân MT2 (vắng S) |
| T09 | Đinh Ngọc Quyên (Sau thi) |
| T10 | Ngô Hải Yến (Báo PH) |
| T11 | Đạt MT2 MB FT 101 = 15/20 |
| T12 | Đánh giá đầu ra MB FOU 12 (12 HV, Final) trong hồ sơ lớp |
| T13 | W tổng + W1 · W2 (mục 5) |
| T14 | Khoa chấm W MT3 FT 101 hạn 23/09 |
| T15 | Cô Hà và QL Vy cùng sửa điểm R MT2 Lê Quang Huy; mất mạng khi lưu |
| T16 | TVV đang gõ ghi chú Ngô Hải Yến, bấm sang Bùi Thu Ninh |
| T17 | Panel 15/20 phân trang |
| T18 | Đặng Ngọc Lam (bài trên lớp /10) |
| T19 | Đạt Target thi thật MB = Chưa có dữ liệu |
| T20 | Toàn hệ thống 23/38 |
| T21 | Panel Báo PH ở 375 khi mở bàn phím |
| T22 | Thu hồi Report 1 của Ngô Hải Yến sau khi TVV đã ghi "Đã báo PH" (cần QL duyệt; lịch sử giữ) |
