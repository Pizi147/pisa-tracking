# 08 — Kế hoạch triển khai V5 (giai đoạn C)

> V5-C, soạn 22/10 trên `main` 3445c294 (đã có V5-A #507, B1 #508, B2 #510, B3 #509, BANG-1 #505). Nguồn: brief [`00`](00-brief-chu-sp.md) mục 18–19 · [`01`](01-quyet-dinh-22-10.md) ·
> [`02`](02-ra-soat-route.md)–[`07`](07-huong-thiet-ke.md) · `b1/b2/b3-ra-soat.md` · mockup + truy vết `thiet-ke/v5/` · ghi chú rà của PTA Plan (mục 1).
> Nhãn: **[CHỐT]** brief C.. / chủ SP / PTA Plan chốt theo khuyến nghị · **[ĐX]** đề xuất của tài liệu này · **[XM]** cần xác minh (chỉ câu chưa có căn cứ).
> **V5-D (22/10):** áp [`10`](10-pta-ap-phan-hoi-cuoi.md) mục 2 (phản hồi cuối [`09`](09-phan-hoi-cuoi-chu-sp.md)) — luật chung P1–P11 (mục 4), PR mới **SV-S-EXPERT**, **UI-TUTOR hoãn**, phạm vi + prompt các PR bị đổi (dòng ghi **[V5-D]**). Bố cục mới thật sự vẽ ở **một mockup chung** `thiet-ke/v5/dieu-chinh-cuoi.html` (khu a–f, ảnh `thiet-ke/v5/anh/dieu-chinh-cuoi-*.png`) — khu đó **thay** phần tương ứng của mockup màn; phần chủ SP không góp ý giữ mockup #507–#510.
> **V5-E (22/10, PTA Plan mới):** áp [`10`](10-pta-ap-phan-hoi-cuoi.md) mục 5 (Kết quả MT · MT3+ · Hồ sơ HV · HV & Lớp), thêm PR **SV-SO3** (máy chủ cho 2 màn đó — SV-SO2 #521 chưa làm), chốt R2, xếp **đợt chạy cloud** (mục 6b). Tutor: không việc nào tới tuần sau (P10).
> Tài liệu này **không** là duyệt mockup: mockup V5 vẫn là ĐỀ XUẤT THIẾT KẾ tới khi chủ SP duyệt từng màn (cổng của mỗi PR giao diện, mục 4).

## 1. Ghi chú rà của PTA Plan (22/10) — đã chốt, mọi PR dưới áp theo

| # | Ghi chú | Xử lý trong kế hoạch |
|---|---|---|
| R1 | **B1** — menu QL thiếu "Tutor" (QL có `tutor.view`, `server/src/platform/nav.ts:29`; mockup `tong-quan.html:138` chỉ 5 mục). Thiếu ca **HV chưa có TVV** → việc Báo PH về **QL chi nhánh** (`06` Q2, `plan.md` N6). | Menu lấy từ `nav.ts` ở NEN-V5 (không gõ tay theo mockup); ca "chưa có TVV" vào SV-TVV + nghiệm thu UI-CV-TVV, UI-TONG-QUAN (QL thấy việc Báo PH của em không TVV ở Công việc của mình). |
| R2 | **B2** — "Của tôi: 3 nhóm · 47 bài" ở Chấm Test (`test.html:242`) cộng cả bài Speaking chấm chéo → **sai luật**. Speaking chấm chéo **không là nợ của ai, kể cả GV dạy S lớp đó** (đúng mã `server/src/worklist/scoreDebt.ts:113-115`) → phải là **"1 nhóm · 11 bài"**. Đề xuất "Lớp tôi dạy S" trong `test-truy-vet.md:48` **BỎ**. | SV-SO1 giữ nguyên luật mã (không đổi `scoreDebt`); UI-CHAM-TEST đếm "Của tôi" chỉ từ nợ có `userId` = người xem; bài S Mock nằm ở nhóm "Bài thi Speaking tuần này" / Quá hạn với nhãn "chấm chéo · không tính nợ". **[XM — PTA Plan]** theo mã, ô S MT2 BC FT 205 (Mock) cũng `userId` null → nếu giữ đúng mã thì "Của tôi" của cô Trang = 0; "1 nhóm · 11 bài" chỉ đúng khi BC FT 205 không phải lượt Mock. PTA chốt một trong hai trước khi giao UI-CHAM-TEST (sửa `du-lieu-demo.md` mục 7 theo đó). **[V5-E] Chốt: theo mã** — "Của tôi" chỉ đếm nợ có `userId` = người xem; số nghiệm thu lấy từ seed SEED-UX, không ép "1 nhóm · 11 bài". |
| R3a | Lớp thường chỉ **đánh giá đầu ra khi đủ Final**; trước đó hiện **"Chờ Final"** (thay câu XM `ho-so-lop-truy-vet.md:41`). | SV-LOP + UI-HO-SO-LOP; T12 nghiệm thu với lớp đủ Final (seed) + MB FOU 12 "Chờ Final". |
| R3b | KQ thi thật gán cho **GV dạy kỹ năng đó ở lớp cuối trước ngày thi** (thay câu XM `b3-ra-soat.md` 6.2). | SV-SO2 (hàm gán dùng `nguoiLuc(lop cuối, kỹ năng, ngày thi)` sẵn có `server/src/phanTich/giaoVien.ts:84-87`). |
| R3c | Mốc "phản hồi vấn đề HV" (KPI KH.01) hiện **"Chưa có dữ liệu"** tới khi có mốc tin cậy. | Không dựng hàm; ô trong Hồ sơ GV / Phân tích GV là chữ cố định, ⓘ giải thích. Không thêm cột. |
| R3d | **Bài trên lớp** (C11, T18) cần **bảng dữ liệu mới** — một PR máy chủ riêng. | SV-BAI-LOP (mục 5). |
| R4 | **BANG-1 #505** (`Bang` / `ODiem` cho lưới điểm) là **nền cấu trúc**; V5 chỉ đổi màu / token theo `thiet-ke/v5/v5-nen.css`, **không làm lại lưới**. | NEN-V5 đổi token; mọi PR màn dùng `Bang` / `ODiem` như hiện có; phép kiểm `prBang0` / `do-bang` không được nới. |
| R5 | PR đã tạm huỷ **SEED-UX** (`claude/seed-ux-6214d7`) và **CHU-THI** (`claude/chu-thi-fb3e30`, thêm C21 "Thi thật" → "Ngày thi") → xếp lại. | Mục 6: CHU-THI chạy **đầu** (chữ, trước mọi PR màn); SEED-UX chạy **sau SV-TVV**, trước PR màn đầu tiên. |

## 2. Kiểm chéo B1–B3 (không sửa mockup của PR khác — sửa ở PR triển khai ghi cột cuối)

| # | Lệch | Ở đâu | Chốt [ĐX] | Sửa ở |
|---|---|---|---|---|
| K1 | Menu QL thiếu Tutor; B2 / B3 có Tutor | `tong-quan.html:138` ↔ `test.html`, `phan-tich.html`… | menu = `nav.ts` theo vai, thứ tự 20/10 (Tổng quan → HV & Lớp → Test → Công việc → Phân tích → Tutor) | NEN-V5 |
| K2 | Đếm "Của tôi" cô Trang: nền 2 việc · B2 3 nhóm · 47 bài | `du-lieu-demo.md` mục 7 ↔ `test.html:242` | R2 | SEED-UX, UI-CHAM-TEST |
| K3 | BC FT 205 MT2: nền thi 07/09 "quá hạn" nhưng hạn FT = 16/09 (chưa quá hạn); B2 dời thi 31/08 | `du-lieu-demo.md` mục 4 ↔ `test-truy-vet.md:47` | lấy **thi 31/08 (W1 SEP) → hạn 09/09, quá hạn 5 ngày** (B2) | SEED-UX |
| K4 | Lần thử TVV Ngô Hải Yến: nền 15/09 (sau hôm nay) ↔ B1 14/09 15:30 | `du-lieu-demo.md` mục 6 ↔ `tvv-truy-vet.md` | **14/09 15:30** | SEED-UX |
| K5 | Đạt MT: `05` #1 đơn vị **HV**; Hồ sơ GV đếm **lượt × kỹ năng của GV** (Khoa 18/25 "lượt") | `05` ↔ `ho-so-gv-truy-vet.md` | Tổng quan / Báo cáo: HV (Overall). Hồ sơ GV / Phân tích GV: **"lượt kỹ năng"** (một lượt × một kỹ năng GV dạy, áp quy tắc Overall) — ghi đúng chữ đơn vị, không gọi chung "Đạt MT" | SV-SO2 + `05` thêm dòng #1b |
| K6 | Chỉ số TVV: `05` #12 "Báo PH xong" (2 số) ↔ Tổng quan "Báo PH đúng hạn" | `05` ↔ `tong-quan.html` | **"Báo PH đúng hạn"** = xong ≤ hạn / việc phát sinh trong kỳ; panel nêu thêm "xong trễ n" | SV-SO2, UI-TONG-QUAN |
| K7 | Cột ngày thi: Hồ sơ lớp "Ngày thi" ↔ HV & Lớp "Lịch thi" | `ho-so-lop.html` ↔ `hoc-vien-lop.html:153` | cột bảng = **"Ngày thi"** (C21); "Lịch thi" chỉ là tên góc / tab | CHU-THI, UI-HV-LOP |
| K8 | Hồ sơ GV: prompt B3 khuyến nghị A; `07` chọn C; B3 vẽ C + B | `07` mục 3 ↔ `ho-so-gv.html` | **C** (dải tóm tắt + tab chi tiết) | UI-HO-SO-GV |
| K9 | Panel Đạt MT gán MT2 (thi W3 AUG) vào kỳ W1–W2 SEP | `tong-quan-truy-vet.md` | lượt vào kỳ theo **ngày chốt điểm cuối** của lượt (`05` #1 "lượt MT chốt trong kỳ") — SV-SO2 viết rõ và test | SV-SO2 |
| K10 | Trang đầu GV: G3 "GV → Công việc" ↔ brief 6.4 / B1 vẽ Tổng quan GV | `03` dòng GV, `b1` XM2 | theo khuyến nghị (`01` mục 2): **GV có Tổng quan**, trang đầu = Tổng quan | NEN-V5 (cờ nav), UI-TONG-QUAN |
| K11 | "Báo cáo đơn vị" (`/cong-viec/bao-cao`) trùng chữ "Báo cáo" | `02` dòng `/cong-viec/bao-cao` | theo khuyến nghị: **"Họp đơn vị"** | CHU-THI |
| K12 | Nháp bền: B1 chỉ hỏi khi đổi việc; Tutor giữ localStorage | `cong-viec-truy-vet.md`, `tutor-truy-vet.md` | **một luật** ở `KhungPanel`: chữ đang gõ giữ ở máy (sessionStorage theo khoá việc) + hỏi khi đổi việc; lưu xong xoá nháp (T15, T16) | NEN-PANEL |

Số đã khớp giữa các mockup (giữ làm số nghiệm thu): Đạt MT2 MB FT 101 **75 % = 15/20** · toàn hệ thống **61 % = 23/38** · thầy Khoa **6 việc** · cô Hà **7 việc** · TVV Hương **3 việc** · QL Vy **4 chờ duyệt** · hạn Báo PH **18/09** · hạn bước tiếp Quyên **21/09**.

## 3. Phụ thuộc (đồ thị)

```
CHU-THI ─┐
DATA-TVV ┴─► SV-TVV ─► SEED-UX ─┐
NEN-V5 ─► NEN-PANEL ────────────┤
SV-SO1 (việc, đếm, MT4) ────────┼─► UI-CONG-VIEC ─► UI-CV-TVV
SV-SO2 (chỉ số, báo cáo, GV) ───┤   UI-CHAM-TEST ─► UI-LICH-TUAN
SV-LOP (hồ sơ lớp, đầu ra) ─────┤   UI-HO-SO-LOP · UI-HV-LOP · UI-HO-SO-HV (+ SV-BAI-LOP)
SV-BAI-LOP ─────────────────────┤   UI-TONG-QUAN · UI-HO-SO-GV · UI-PHAN-TICH · UI-CON-LAI
SV-S-EXPERT (S Ex) ─────────────┘   (UI-CHAM-TEST · UI-LICH-TUAN hiện S Ex)          UI-TUTOR: HOÃN (P10)
                                    └─► TL-V5 (DESIGN.md, Hướng dẫn, bảng mẫu) ─► CHAM-LAI
```

- Máy chủ trước giao diện cùng phạm vi (`plan.md` Q-2). ≤ 2 PR giao diện song song, **khác màn**; PR máy chủ chạy song song tự do nếu khác tệp.
- [V5-D] UI-CHAM-TEST (Kế hoạch Test) và UI-LICH-TUAN cần SV-S-EXPERT (ô / cột S Ex); SV-S-EXPERT chạy song song các PR máy chủ khác (khác tệp).
- [V5-E] **SV-SO3** (Kết quả MT cho Báo cáo HV + trường hàng HV của HV & Lớp) chạy sau SV-SO1 (cùng `phanTich/baoCao.ts`), trước UI-HV-LOP và UI-PHAN-TICH.
- UI-CV-TVV cần SV-TVV + UI-CONG-VIEC (cùng khung trang Công việc). UI-LICH-TUAN sau UI-CHAM-TEST (cùng route `/test/lich`, tránh xung đột tệp).

## 4. Luật chung mọi PR triển khai V5

1. **Một màn một PR** (sở hữu đầu trang, dải lọc, khối cũ). Bảng truy vết: khung mockup V5 (tệp + id / ảnh `thiet-ke/v5/anh/…`) → thành phần / tệp web → ảnh nghiệm thu; có dòng **BỎ** / **GIỮ** (`plan.md` Q-3).
2. **Ảnh cặp** mockup | web toàn trang (`scripts/anh-cap.mjs`), cùng vai, seed nguyên: **1440 sáng · 1440 tối · 1280 · 375** (+ 125 % cho màn nhiều chữ). Cổng **≥ 90 % KHỚP**; **chủ SP duyệt ảnh cặp trước merge, không merge qua đêm** (Q-4–Q-6).
3. Kiểm: `npm run check` xanh · `do-khung` + `do-bang` xanh ở 1440 / 1280 / 375 và **một cỡ trung gian 1024** · bàn phím (Tab, ↑ ↓ Enter, Esc đóng panel, focus về đúng chỗ) · nội dung dài (tên 40 ký tự, 30 việc một em, ghi chú 500 ký tự) · rỗng · lỗi tải · **lỗi lưu** (mạng tắt: giữ chữ, không báo "Đã lưu", nút "Thử lại").
4. **Đo số bước** theo kịch bản thật (mục 7) — tách bấm điều hướng / bấm nhập / gõ; ghi số đo vào mô tả PR, so với "Đích đo" trong truy vết.
5. Chữ trên màn = chữ mockup (ngắn, đúng tên); mã tuần `W3 SEP`; mọi chuỗi qua `t()` + EN.
6. Không đổi quyền ngoài dòng [CẦN QUYỀN] của `03` mục 3; không đổi máy SOS / Case; giữ `server/src/db.ts` (nhớ câu lệnh — CLAUDE.md).
7. Phép kiểm cũ đọc chuỗi bố cục cũ được gỡ (liệt kê trong PR, Q-7); không thêm phép kiểm chuỗi cho bố cục.
8a. **[V5-D] Luật chung P1–P11** (`10` mục 1) áp cho mọi PR giao diện: P1 ít chữ — câu giải thích luật / workflow → dấu "?" (`NutLuat`), chữ cho quản trị / lập trình không hiện, dòng chú thích của mockup V5 **không** lên web · P2 phân cấp nhãn nhỏ xám / giá trị đậm, điểm + trạng thái màu thống nhất · P3 token tối bớt tím (đã sửa `v5-nen.css`) · P4 **"Thi tháng này"** thay "Thi tuần này" · P5 tháng thi dự kiến luôn kèm năm (`Dự kiến 02/2027`) · P6 SOS 1 / 2 / 3 khác hẳn (nền nhạt / cam đặc / đỏ thẫm đặc — `v5-nen.css`) · P7 hạn = `dd/mm` thật, không thứ, không "Hạn tuần này" · P8 không dùng "MT gần nhất của lớp" — số theo **lượt của từng HV** · P9 bộ lọc Từ tuần – Đến tuần tự do · P10 Tutor hoãn · P11 không thêm panel / nút / ô chữ / bộ lọc vô giá trị; kế thừa workflow cũ đang tốt.
8b. **[V5-E 22/10] Nâng cấp, không chép mockup** (`10` mục 8, CLAUDE.md): giữ thao tác cũ, sửa đồng bộ phần mockup không vẽ, bảng thao tác TRƯỚC → SAU trong khop-khac; xung đột → [XM] hỏi. Dùng skill `karpathy-guidelines` suốt phiên.
8. Đổi truy vết: PR xong ghi "→ PR #n" vào dòng tương ứng trong `thiet-ke/v5/<màn>-truy-vet.md`; tiêu chí V4 bị thay thì gạch, không xoá.

## 5. Dữ liệu cần bổ sung (chỉ nơi nghiệp vụ cần — không đổi schema vì giao diện)

| Dữ liệu | Vì sao | PR | Ghi chú |
|---|---|---|---|
| Việc Báo PH theo **lần xử lý vi phạm** (người giữ = TVV của em, không TVV → QL chi nhánh; hạn 23:59 VN ngày lưu + 4) | N1, N2, C05 — mã chưa có (`06` điểm 1) | SV-TVV | bảng mới gắn `discipline_measures`; không sinh cho lần xử lý trước ngày bật |
| **Lần thử báo PH** (ngày, người, "Đã báo PH" / "Chưa liên hệ được", ghi chú) | C15, T10 | SV-TVV | "Chưa liên hệ được" không đóng việc, giữ hạn |
| **Bài trên lớp** (HV, lớp, kỹ năng, tên bài, điểm, thang, tuần, người ghi, lịch sử sửa) | C11, T18, R3d | SV-BAI-LOP | không trộn bảng điểm MT; không sinh việc; không vào chỉ số / KPI |
| Quyền / cờ nav: TVV `work.view` (chỉ việc của mình), GV `overview` | C05, K10 | SV-TVV, NEN-V5 | rà sâu `ecc:security-reviewer` |
| **[V5-D] Lượt S Expert (S Ex)** (HV, ngày / tuần, người chấm, điểm, nhận xét, người thêm, lịch sử) | 09 IV.4 — bài Speaking với chuyên gia bổ sung riêng từng HV | SV-S-EXPERT | chỉ QL / Admin thêm (máy chủ kiểm); **không thay** S MT; không vào S chấm chéo; điểm **không** vào Overall / SOS / Case / KPI / Phân tích tới khi chủ SP chốt (XM-1) |
| Không thêm | Overall, Σ tử / mẫu, gán GV theo thời gian, hạn bước tiếp, chuỗi "-" | — | đã có trong mã (`05`, `06`) |

## 6. Danh sách PR (thứ tự chạy)

| Thứ tự | PR | Loại | Phạm vi chính | Nghiệm thu (T..) | Merge |
|---|---|---|---|---|---|
| 0 | **CHU-THI** (nhánh cũ, làm lại pha 2) | chữ | ~304 chuỗi Thi ↔ Test theo kiểm kê `docs/superpowers/plans/2026-10-21-pr-chu-thi*.{md,tsv}` (trên nhánh `claude/chu-thi-fb3e30`) + **C21 cột lịch "Thi thật" → "Ngày thi"** (giữ "Kết quả thi thật", "Điểm thi thật") + K7, K11 | — | chủ SP bấm |
| 0 | **DATA-TVV** | vận hành | lệnh chỉ đọc đếm em có / chưa TVV theo chi nhánh; chủ SP / QL gán TVV ở bản chính (không mã) | — | — |
| 1 | **NEN-V5** | nền giao diện | `v5-nen.css` → token `index.css` (sáng + tối) · 4 nhóm badge (`Nhan`, `ChipSos` SOS vàng → cam → đỏ, Đạt cùng họ — C23) · `TyLe` % to trước · gộp `SoLieu`/`SoLieuO`/`OSoNho` → `OSo` · `KpiTile` → ô chỉ số V5 · thanh xanh + logo · menu từ `nav.ts` (K1) + cờ GV `overview` (K10) · `Bang`/`ODiem` **chỉ đổi token** (R4) · bảng mẫu `/dev/thanh-phan` theo `bang-mau.html` · **[V5-D]** token tối P3 + SOS 3 mức P6 (đã ở `v5-nen.css`), hàm nhãn tháng dự kiến `MM/YYYY` một chỗ (P5), hàm nhãn hạn `dd/mm` (P7), kiểu nhãn / giá trị dùng chung (P2) | T13 (dáng W1 · W2), T19 (ô "Chưa có dữ liệu") | chủ SP duyệt ảnh bảng mẫu |
| 2 | **NEN-PANEL** | nền giao diện | `KhungPanel`/`KhuonViec`: dòng loại (VIỆC / BÁO CÁO · CHỈ ĐỌC), chân `SaveState` thống nhất, "Lưu" ở lại · "Lưu và tiếp" chỉ sau khi lưu xong, nháp theo khoá việc (K12), hỏi khi đổi việc, lỗi giữ chữ, 375 toàn màn + `visualViewport` (bàn phím không che nút) · **[V5-D]** dấu "?" thay câu giải thích (P1), khối bối cảnh nhãn nhỏ / giá trị đậm / số có màu (P2, `09-anh1`) | T15, T16, T21 | chủ SP duyệt ảnh |
| 2 | **SV-TVV** (gộp SV-YT-TVV + SV-TVV-VIEC của `../2026-10-20-ke-hoach-overhaul/07` mục 5) | máy chủ + quyền | việc Báo PH theo lần xử lý (N1, N2) + lần thử (C15) · 4 việc TVV (N6: Chốt ngày thi, Bước tiếp hạn 1 tuần, Bổ sung hồ sơ 4 trường, KQ thi thật chuyển GVCN → TVV, không hạn) · **em không TVV → QL chi nhánh** (R1) · thu hồi khi TVV đã ghi: giữ lịch sử, việc chưa xong → "Đã bỏ · xử lý đã thu hồi" (`06` điểm 6) · TVV `work.view` chỉ việc mình | T09, T10, T22 | rà sâu `security-reviewer` + `silent-failure-hunter`; chủ SP bấm |
| 2 | **SV-SO1** | máy chủ số | đơn vị đếm `/my-work`: việc (kind × đối tượng × kỹ năng) · nhóm · bài; badge = việc của tôi; chuông = tin chưa đọc · S chéo không nợ (giữ `scoreDebt.ts:113-115`, R2) · bài thiếu nhận xét bắt buộc **không tính xong** (`scoreDebt.ts:112`) · **bỏ gợi ý MT4** (`worklist/metrics.ts:868-881`, `shared/domain/tongQuan.ts:118`, `phanTich/baoCao.ts:137`, `shared/domain/keHoachTest.ts:225-231` dòng "MT4 chưa xếp", cột "Chưa lịch Test" `bangChiNhanh.ts:203,219`) · QL xem người khác: cờ `chiXem` + `lamThay` theo quyền | T01, T02, T03, T04, T17 | rà sâu `silent-failure-hunter` |
| 2 | **SV-SO2** | máy chủ số | quy tắc Overall cho Phân tích / Hồ sơ GV (`classes/phanTichLop.ts:149-152`; C09, C10) · bỏ màu ngưỡng `phanTichGv.ts:83-87` · tổng Σ tử / Σ mẫu · mẫu 0 = "Chưa có dữ liệu" · K5, K6, K9 · KQ thi thật gán GV (R3b) · "Việc đúng hạn" = gộp tập có hạn sẵn có (ghi KQ PA, xử lý vi phạm, báo PH) đơn vị **việc**; "Điểm đúng hạn" riêng đơn vị **bài** · mốc phản hồi: không dựng (R3c) · API panel báo cáo **không trả khối việc** (C22) · API Hồ sơ GV theo kỳ (Từ tuần – Đến tuần) · **[V5-D]** "Thi tháng này" = HV có ngày thi thật trong tháng hiện tại, phạm vi đang xem (P4) · gom theo **lượt của từng HV** (P8) · API nhận khoảng tuần tự do (P9) · Phân tích GV bỏ "Xử lý vi phạm" (không xoá dữ liệu), gỡ chữ "mẫu nhỏ" (#514), giữ "Đạt Target – Thi thật" · ~~Báo cáo HV: API "Hành trình theo kỹ năng"~~ → **[V5-E] chuyển SV-SO3** (#521 chưa làm) | T06, T07, T08, T11, T19, T20 | rà sâu `typescript-reviewer` |
| 2 | **SV-LOP** | máy chủ | **[V5-E]** kèm 5 điểm nợ rà #526 S Ex (dòng SV-LOP mục 10) · việc theo em trong hồ sơ lớp lấy từ `/my-work` (nhiều dòng, việc người xem trước — C19; thay `viecTiepCuaEm`) · đánh giá đầu ra: lớp thường **chỉ khi đủ Final**, trước đó trạng thái "Chờ Final" (R3a); FT theo luật hiện có · trả W1, W2 riêng mọi bề rộng | T12, T13 | chủ SP bấm |
| 2 | **SV-BAI-LOP** | máy chủ + migrate | bảng bài trên lớp (mục 5), API thêm / sửa / xoá có lịch sử, quyền = GV dạy kỹ năng đó + GVCN + QL | T18 | rà sâu `silent-failure-hunter` |
| 2 | **SV-S-EXPERT** [V5-D] | máy chủ + migrate + quyền | lượt S Ex riêng từng HV (mục 5): thêm / sửa / xoá có lịch sử, **chỉ QL / Admin thêm** (máy chủ kiểm), GV S chấm như S MT; trả kèm Lịch Test tuần + Kế hoạch Test, phân biệt S MT; **không** thay S MT, không vào S chấm chéo, không vào Overall / SOS / Case / KPI / Phân tích / nợ chấm / đếm việc tới khi chốt XM-1 | — (phép kiểm quyền + không vào tính toán) | rà sâu `security-reviewer`; chủ SP bấm |
| 2 | **SV-SO3** [V5-E] | máy chủ số | **Kết quả MT** cho Báo cáo HV (`10` mục 5, `thiet-ke/v5/phan-tich.html`): hàng MT0 · MT1 · MT2 · **MT3+** (gộp MT3 trở đi) · Thi thật × cột Đạt Target · Thiếu 0.5 · Thiếu 1.0 · Thiếu ≥ 1.5 · Chưa đủ · So lượt trước; theo **lượt của từng HV** (P8), khoảng tuần tự do (P9), số bấm → panel chỉ đọc (C22) · hàng HV của `/hoc-vien` (`dieu-chinh-cuoi.html` khu d): Lộ trình · MT gần nhất **của em** (Overall / KV + L R W1 W2 S) · Xu hướng · Hỗ trợ · Ý thức — **kiểm trường đã có trước, chỉ thêm trường thiếu** | T11, T13, T19, T20 | rà sâu `typescript-reviewer` |
| 3 | **SEED-UX** (nhánh cũ, viết lại pha 1 theo V5) | dữ liệu demo | `du-lieu-demo.md` V5 vào seed: GV S không dạy lớp (Đỗ Thu Hương), Admin VP / CX / TVV, gán TVV ≥ 85 % + ≥ 1 em không TVV mỗi CN, SĐT PH, **đủ MB FT 101 MT2 như mockup** (22 HV, 15/20 đạt, 5 em mục 5), ca T01–T22 mục 9; sửa K2, K3, K4; mọi ngày ≤ 14/09 | ảnh mọi mockup chụp được | chủ SP bấm |
| 4 | **UI-CONG-VIEC** | làm lại màn | `cong-viec.html`: đầu trang "n nhóm · n việc · n bài", dòng con theo kỹ năng (T01), chế độ theo dõi + "Làm thay" theo quyền, badge ≠ chuông · **[V5-D]** panel P2 (`09-anh1`, cả panel TVV) · **Case mở rộng tại chỗ** (bấm Case → chi tiết ngay trong khu, sửa trường được quyền sau lưu + lịch sử; bước duyệt giữ) | T01, T02, T15, T16, T17 | chủ SP duyệt ảnh |
| 4 | **UI-CHAM-TEST** | làm lại màn | `test.html` khu Chấm Test: 4 nhóm C14 (**[V5-D]** tên nhóm theo ngày hạn thật `dd/mm`, P7), khu chấm tại chỗ, "Của tôi" theo R2 · **[V5-D] Kế hoạch Test giữ tư duy web cũ** theo `dieu-chinh-cuoi.html` khu a (gốc `anh/dieu-chinh-cuoi-goc-ke-hoach-test-web.png`): mỗi lớp mở ra **từng HV × MT1 / MT2 / MT3** (mặc định 3 MT, C20), mỗi ô ghi kỹ năng · tuần · tháng · năm (`W3 SEP 2026`) + Overall khi xong, lịch MT theo lộ trình **từng HV**; cột S Ex (nút "+ S Ex" chỉ QL / Admin) | T03, T04, T05, T14 | chủ SP duyệt ảnh |
| 5 | **UI-CV-TVV** | màn mới | `tvv.html`: Báo PH (2 trạng thái + Ngày + Ghi chú, SĐT bấm gọi, lần thử), Sau thi (lưu điểm riêng → "Đã có kết quả · Chưa chốt bước tiếp"), Chốt ngày thi, Bổ sung hồ sơ; QL thấy việc của em không TVV | T09, T10, T16, T21 | chủ SP duyệt ảnh |
| 5 | **UI-LICH-TUAN** | làm lại màn | **[V5-D] thay khu Lịch tuần của `test.html`** bằng `dieu-chinh-cuoi.html` khu a (gốc: web hiện tại `anh/dieu-chinh-cuoi-goc-lich-test-web.png`): một tuần + ‹ ›, dải 3 số (đã chấm · còn chấm · quá hạn), hàng lớp **gọn một dòng** (lớp · HV theo lượt `MT3 20 · MT2 1` · kỹ năng · tiến độ bài · hạn `dd/mm` · trạng thái), mở lớp → **bảng từng HV làm Test trong tuần** (MT của em · L R W1 W2 W S · S Ex · kỳ vọng · Overall · kết quả), **xem / sửa điểm ngay trên lịch** theo quyền + lịch sử (popover), SOS thay "Chưa đạt"; **bỏ "ba khung tổng quát"**; không giả định cả lớp cùng MT; gộp `/nhap-diem/*` thành chuyển hướng | T14 | chủ SP duyệt ảnh |
| 6 | **UI-HO-SO-LOP** | làm lại màn | `ho-so-lop.html` + **[V5-D] `dieu-chinh-cuoi.html` khu b**: đầu gọn, **W hiện một lần + dòng phụ W1 · W2 (W1, W2 vẫn riêng)**, bấm W / S → popover điểm thành phần, **bỏ badge "Chưa đạt" khi đã SOS**, Ngày thi chỉ chip nhỏ (cột Việc bỏ — việc ở **thanh Việc cần làm**: mỗi việc một ô việc · em · trạng thái · hạn · nút), **cột Case + PA làm lại** (bấm → Case, PA gắn từng Case mở dưới hàng, xem / sửa theo quyền + lịch sử + duyệt, thao tác panel Công việc ngay trên trang), "Bài trên lớp" → **"Tiến độ trên lớp"**, điểm to rõ (`09-anh2`), số theo lượt từng HV (P8, bỏ chọn "Lượt MT2" cả lớp), đánh giá đầu ra ("Chờ Final" — R3a), Ý thức & Phối hợp phân cấp màu | T12, T13 | chủ SP duyệt ảnh |
| 6 | **UI-HV-LOP** | làm lại màn | **[V5-D] theo `dieu-chinh-cuoi.html` khu d** (thay bảng của `hoc-vien-lop.html`): danh sách **lọc / tìm / hành động** nhiều lớp, mỗi HV một dòng (tên · lớp · Target · Overall gần nhất **của em** · SOS · **Lịch thi** · **Việc**), không bê bảng điểm Hồ sơ lớp · chế độ **Tất cả · Đang SOS · Lịch thi** (**bỏ "Cần làm"**) · SOS làm lại (mức, kỹ năng, từ tuần, Overall / kỳ vọng, Case · PA, việc tiếp) · **Lịch thi** theo V4 `mockup-v4-hoc-vien-lop.html` (nhóm A / B, Chốt ngày · Dời tháng) + trường xếp lịch `mockup-ov14-5-lich-thi-xuat-ds` (XM-2) · **bỏ checkbox**; nút "Xuất" lấy đúng phạm vi bộ lọc + chọn cột trong hộp xuất · Ngày thi (K7) · **[V5-E] `10` mục 5:** cột Lộ trình · MT gần nhất (Overall / KV + 5 kỹ năng, W1 W2 riêng) · Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc; không "tuần n/24"; Lịch thi bấm hàng → chi tiết mở dưới hàng (như V4); dữ liệu từ SV-SO3 | T13, T17 | chủ SP duyệt ảnh |
| 7 | **UI-HO-SO-HV** | làm lại màn | `ho-so-hv.html` + **[V5-D] `dieu-chinh-cuoi.html` khu c**: đầu 2 dòng + điểm to (Overall, L R W S), thanh Việc cần làm là chỗ duy nhất có việc, **hành trình theo từng kỹ năng** (chip L / R / W1 / W2 / S; chấm MT chính thức + kỳ vọng bậc thang mờ + bảng mốc; không line chart nhiều đường), **"Tiến độ trên lớp" dòng riêng thang riêng**, khoảng thiếu để trống có nhãn · **[V5-E] `10` mục 5:** bấm ô điểm (Overall · L · R · W1 · W2 · S) đổi kỹ năng; biểu đồ chỉ MT + mốc tuần; "Tiến độ trên lớp" = bảng dưới biểu đồ (3 dòng mới nhất + "Xem thêm"), ghi nguyên văn, không vào MT; Case & PA chỉ của kỹ năng đang chọn, cột PA cố định | T13, T18 | chủ SP duyệt ảnh |
| 7 | **UI-TONG-QUAN** | làm lại màn | `tong-quan.html` phương án B cho QL, QT (theo chi nhánh), GV, TVV, Admin, CX; Head tutor giữ `/tutor`; không ô nhập (C04) · **[V5-D]** "Thi tháng này" (P4); **TVV chỉ 3 nhóm: Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp**; Lớp cần chú ý theo lượt từng HV (P8); bỏ dòng chú thích (P1) | T11, T17, T19, T20 | chủ SP duyệt ảnh |
| 8 | **UI-HO-SO-GV** | làm lại màn | `ho-so-gv.html` phương án C (K8) + **[V5-D] `dieu-chinh-cuoi.html` khu e**: dải đầu gọn (bỏ chuỗi "4 lớp: …"), khối **Lớp đang dạy** (lớp · kỹ năng · số HV · GVCN), bộ lọc kỳ **tự do mặc định 4 tuần** (P9), **bảng Học thuật làm lại** (cột theo mục đích, không cột rộng vô nghĩa, không co chữ, số theo lượt từng HV — P8), bỏ hộp chữ quy tắc → "?" (P1), số → panel chỉ đọc, mốc phản hồi "Chưa có dữ liệu"; thông tin thiếu đề xuất trong PR (ghi lý do) | T06, T07, T08, T19 | chủ SP duyệt ảnh |
| 8 | **UI-PHAN-TICH** | làm lại màn | `phan-tich.html`: Báo cáo HV / GV tách, Phân tích GV một bảng hai nhóm cột (Gọn mặc định **vừa 1280**, không cắt / lệch / cuộn; Đầy đủ), panel chỉ đọc (C22), Kết quả thi chỉ đọc (C16) · **[V5-D]** "Toàn bộ" / "Chọn khoảng tuần" tự do (P9); "Quá hạn nay" → **"Quá hạn"**, giữ **"Đạt Target – Thi thật"**, bỏ "Xử lý vi phạm", bỏ "Mẫu nhỏ"; **[V5-E] Báo cáo HV giữ nguyên, chỉ thay bảng "Kết quả theo lớp" bằng "Kết quả MT"** (`10` mục 5, `phan-tich.html`; không "Đường tới Target", không "Hành trình theo kỹ năng"): hàng MT0 → **MT3+** + Thi thật, cột Đạt Target · Thiếu 0.5 · Thiếu 1.0 · Thiếu ≥ 1.5 · Chưa đủ · So lượt trước; dữ liệu SV-SO3 | T11, T17, T19, T20 | chủ SP duyệt ảnh |
| — | ~~**UI-TUTOR**~~ **HOÃN** [V5-D, P10] | — | không PR Tutor đợt này. Đề xuất ghi `plan.md` mục 4 (TL-V5): color coding điểm đánh giá, bộ lọc / bảng, dải 3 chỉ số có mẫu số, không buổi ≠ thấp, nháp theo NEN-PANEL — xem lại tuần sau. **[V5-E] Không PR nào chạm Tutor tới tuần sau** (kể cả ghi đề xuất ở TL-V5) | — | — |
| 9 | **UI-CON-LAI** | sửa nhiều màn nhỏ | **[V5-D]** áp P1, P2, P7 · `con-lai.html`: tìm kiếm, bộ lọc tuần, hộp duyệt (thu hồi / sửa giữ lịch sử, Hoàn tác không vượt quyền), thông báo, biểu mẫu thêm / sửa, rỗng / lỗi, in / xuất — tách 2 PR nếu > 25 tệp | T21, T22 | chủ SP duyệt ảnh |
| 10 | **TL-V5** | tài liệu (planning) | `DESIGN.md` (G3, màu, badge — `04` cuối), `plan.md` 1.6 + mục 4, Hướng dẫn `shared/huongDan`, sổ tay ảnh | — | chủ SP bấm |
| 11 | **CHAM-LAI** | đánh giá | chấm lại toàn web theo brief 20 + T01–T22 trên ảnh mọi vai · **[V5-E]** rà lại các PR màn đã merge (#533, #534, #539, #540…) theo luật 8b: thao tác cũ đủ chưa, panel / hộp / popover đồng bộ chưa | tất cả | — |

## 6b. Trạng thái + đợt chạy cloud [V5-E, 22/10]

**Đã merge:** nền GĐ1 #490–#504 · mockup V5 #507–#510, #519, #523, #524 · V5-PLAN #525 · SV-S-EXPERT #526 · NEN-V5 #520 · DATA-TVV #512 · SV-BAI-LOP #513 · SO-LIEU-V5 #514 · SV-TVV #516 #517 · SV-SO2 #521.
**Đang mở:** CHU-THI #522 · SEED-UX #515 (session của từng PR gộp main + sửa; SEED-UX thêm K2 K3 K4 + GV S "Đỗ Thu Hương"). Hai PR này **merge trước Đợt 2** (PR màn cần chữ + seed).

Luật đợt: ≤ 3 session cloud cùng lúc, khác tệp · ≤ 2 PR giao diện cùng lúc, khác màn · PR màn chờ chủ SP duyệt ảnh cặp · PR sau trong cùng nhóm tệp gộp main trước khi mở.

| Đợt | PR (song song) | Cần merge trước | Thứ tự merge trong đợt · lý do |
|---|---|---|---|
| 1 | SV-SO1 · NEN-PANEL · SV-S-EXPERT | — | SV-SO1 → SV-S-EXPERT (cùng chạm `keHoachTest` / `run.ts`, SV-S-EXPERT gộp main sau) · NEN-PANEL độc lập (web panel) |
| 2 | SV-LOP · UI-CONG-VIEC · UI-CHAM-TEST | Đợt 1 + CHU-THI + SEED-UX | SV-LOP trước (máy chủ) · 2 PR màn theo lượt chủ SP duyệt ảnh |
| 3 | SV-SO3 · UI-CV-TVV · UI-LICH-TUAN | UI-CONG-VIEC (khung Công việc) · UI-CHAM-TEST (cùng `/test/lich`) · SV-SO1 (cùng `baoCao.ts`) | SV-SO3 trước |
| 4 | UI-HO-SO-LOP · UI-HV-LOP | SV-LOP · SV-SO3 | theo lượt duyệt ảnh |
| 5 | UI-HO-SO-HV · UI-TONG-QUAN | — (SV-BAI-LOP, SV-SO2 đã có) | theo lượt duyệt ảnh |
| 6 | UI-HO-SO-GV · UI-PHAN-TICH | SV-SO3 | theo lượt duyệt ảnh |
| 7 | UI-CON-LAI → TL-V5 (planning) → CHAM-LAI | mọi PR màn | — |

Tutor: không đợt nào (P10, chủ SP 22/10: tuần sau mới xét). **AN-TUTOR #537** đã ẩn Tutor khỏi web mọi vai (dữ liệu giữ).

**Trạng thái 22/10 chiều:** đã merge thêm SV-SO1 #528 · NEN-PANEL #530 · SV-LOP #529 · SV-SO3 #531 · MAIN-DO #532 · UI-CONG-VIEC #533 · UI-CHAM-TEST #534 · AN-TUTOR #537 · deploy #535. Còn: UI-CV-TVV · UI-LICH-TUAN (chạy ngay) → UI-HO-SO-LOP · UI-HV-LOP → UI-HO-SO-HV · UI-TONG-QUAN → UI-HO-SO-GV · UI-PHAN-TICH → UI-CON-LAI → TL-V5 → CHAM-LAI. Chủ SP deploy khi xong hết; mọi màn **giống hệt mockup**.

## 6c. Nợ dồn từ các PR đã merge → PR nhận [V5-E, 22/10]

Không PR nào trong danh sách còn lại làm trùng nhau (đã đối chiếu tệp / route). Việc dưới chưa có trong dòng PR ở mục 6 — PR nhận làm luôn, ghi trong mô tả:

| Nợ | Từ | PR nhận |
|---|---|---|
| S Ex là **dòng phụ** của em trong tuần (không cột S Ex riêng); `10` mục 6 | chủ SP 22/10 | UI-LICH-TUAN |
| Khu chấm Speaking chéo chỉ lọc theo lớp, chưa theo MT | #534 | UI-LICH-TUAN |
| Gỡ `KhoiCanQuyet` (mã chết sau C22) + Tổng quan gọn đúng mockup (không liệt kê từng Case) | #521, chủ SP 22/10 | UI-TONG-QUAN |
| Head tutor: Tổng quan rỗng sau AN-TUTOR — chỉ dòng "Tutor tạm ẩn", không khối số | #537 | UI-TONG-QUAN |
| `ketQuaHoSoGv` ("MT gần nhất của lớp") → thay bằng `ketQuaTheoLop` rồi xoá | #521 | UI-HO-SO-GV |
| Gỡ `viecTiepCuaEm` ở `/roster` + trần `tocDo` cho `/classes/:id/viec-theo-em` (N+1 theo GV) | #529 | UI-HO-SO-LOP (`/roster` phần HV & Lớp → UI-HV-LOP) |
| Chỗ lưu "Nhận xét + Đề xuất bước tiếp" của GVCN khi đánh giá đầu ra (C17) | #529 | UI-HO-SO-LOP |
| Chữ "mẫu nhỏ" còn trong mockup V5 / chỗ khác (`effectiveness.ts`) | #522 | UI-PHAN-TICH |
| Badge "việc của tôi" còn đếm việc `mine:false` (Thêm PA Case người khác); `viecQuaHan` đếm cả kỹ năng chưa quá hạn của dòng | #528 | UI-CON-LAI (máy chủ nhỏ, kèm phép kiểm) |
| Chữ "Đã xong · OVR…" ở bước tiếp hồ sơ HV (miễn luật động từ ở `hoSoHocVien.tests.ts:134`) | #515 | UI-HO-SO-HV |
| Truy vết `thiet-ke/v5/*-truy-vet.md` ghi "→ PR #n" cho #533, #534 | luật 8 mục 4 | TL-V5 |
| DEMO.md / CODE_MAP.md theo SEED-UX + màn V5; DESIGN.md (tiêu đề trang 22 px vs 20) | #515, #533 | TL-V5 |
| S Ex hiện cạnh S ở Hành trình; XM-1 đóng (không tính, không lý do) | chủ SP 22/10, `10` mục 7 | LUAT-NX-MT |
| Nhận xét không bắt buộc cứng · xếp MT nới lỏng · ghi chú "vắng W3 SEP" | chủ SP 22/10, `10` mục 7 | **LUAT-NX-MT** (máy chủ + web nhỏ; chạy ngay, merge sau UI-CV-TVV vì chung `mywork.ts`, `scoreDebt.ts`) |
| Tutor bật lại | P10 | tuần sau, hỏi chủ SP |


## 7. Đo số bước (kịch bản thật — ghi số đo trong PR; đích lấy từ truy vết)

| Kịch bản | Đích | PR |
|---|---|---|
| GV Khoa ghi KQ PA R rồi W1 của Phan Gia Hân | từ Công việc: 1 bấm mở, 0 đổi trang; R → W1: 1 bấm | UI-CONG-VIEC |
| TVV báo PH "đã gọi, PH đã nghe" | 2 bấm + gõ, 0 đổi trang | UI-CV-TVV |
| TVV lưu riêng điểm thi thật | 4 ô + 1 bấm; chốt bước tiếp sau: 2 bấm | UI-CV-TVV |
| GV chấm cả nhóm MT3 L FT 101 (22 em) | đếm **mỗi em**: gõ 1 điểm + nhận xét + Enter; điều hướng tới nhóm 1 bấm (không hứa "cả lớp 1 bấm") | UI-CHAM-TEST |
| GVCN đánh giá đầu ra 12 em lớp thường | mỗi em: chọn + nhận xét + "Lưu và em tiếp"; 0 đổi trang | UI-HO-SO-LOP |
| QL từ Tổng quan tới tập 15/20 | 1 bấm, 0 đổi trang (panel); tới danh sách lọc: 1 bấm + 1 đổi trang | UI-TONG-QUAN |

## 8. T01–T22 → PR nghiệm thu chính

T01 SV-SO1 + UI-CONG-VIEC · T02 SV-SO1 + UI-CONG-VIEC · T03 SV-SO1 + UI-CHAM-TEST · T04 SV-SO1 + UI-CHAM-TEST · T05 UI-CHAM-TEST (luật #503, không đổi máy chủ) ·
T06–T08 SV-SO2 + UI-HO-SO-GV · T09 SV-TVV + UI-CV-TVV · T10 SV-TVV + UI-CV-TVV · T11 SV-SO2 + UI-PHAN-TICH · T12 SV-LOP + UI-HO-SO-LOP · T13 NEN-V5 + UI-HO-SO-LOP + UI-HV-LOP ·
T14 UI-CHAM-TEST + UI-LICH-TUAN · T15 NEN-PANEL · T16 NEN-PANEL + UI-CV-TVV · T17 SV-SO1 + UI-PHAN-TICH · T18 SV-BAI-LOP + UI-HO-SO-HV · T19 SV-SO2 + NEN-V5 · T20 SV-SO2 + UI-TONG-QUAN ·
T21 NEN-PANEL + UI-CV-TVV · T22 SV-TVV + UI-CON-LAI.

## 9. PR / nhánh cũ → GIỮ / SỬA / BỎ theo V5

| PR / nhánh | Quyết định | Lý do |
|---|---|---|
| BANG-0 #500, BANG-1 #505 | **GIỮ** (nền) | R4: chỉ đổi token ở NEN-V5 |
| NEN-TYPO-MAU #497 | **GIỮ** thang chữ; token `--kq-*` **thay** bằng token V5 ở NEN-V5 | C02 |
| LUAT-34 #503 | **GIỮ** | `01` mục 2: MT cũ "-" huỷ ngay |
| LT-SV #496, SL1 #502, SL2 #504, CV-LOI #499, KHUNG-LOI, LUAT-5, CASE-NHIEU | **GIỮ** | đã merge, V5 dựng trên đó |
| CHU-THI `claude/chu-thi-fb3e30` | **SỬA** → thứ tự 0, thêm C21, K7, K11 | R5 |
| SEED-UX `claude/seed-ux-6214d7` | **SỬA** → thứ tự 3, theo `du-lieu-demo.md` V5 | R5 |
| DATA-TVV, SV-YT-TVV, SV-TVV-VIEC (GĐ1b cũ) | **GỘP** → DATA-TVV + SV-TVV | cùng bảng, cùng quyền |
| UI-YT-TVV (GĐ1b cũ: việc TVV ở Tổng quan, form 4 ô) | **BỎ** → UI-CV-TVV | C05, C15 |
| GĐ2 M0…M7 (`../2026-10-20-ke-hoach-overhaul/07`), mockup V4 `thiet-ke/mockup-v4-*` | **BỎ** làm yêu cầu (chỉ tham khảo) | `01` mục 1.4 |
| `claude/v5-a`, `claude/v5-brief`, `pr-lui-*`, `ke-hoach-lui-a`, `plan-z2b-*` | không xét (đã merge / cũ) | — |

## 10. Prompt ngắn cho từng PR (chạy cloud, môi trường "Pisatracking")

**Đầu chung (dán trước mọi prompt dưới):**
> Repo Pizi147/pisa-tracking. `git fetch origin`; tạo nhánh từ `origin/main`. Đọc `CLAUDE.md`, `plan.md` mục 1, `docs/superpowers/specs/2026-10-22-overhaul-v5/08-ke-hoach-trien-khai.md` mục 1, 4, 5, 6b và dòng PR của mình ở mục 6 + `10-pta-ap-phan-hoi-cuoi.md` mục 1–5 (mục 5 mới nhất, thắng khi lệch). Opus 5.5 — KHÔNG Fable (kể cả subagent). Không deploy, không chạm Turso / DB bản chính. Không đổi nghiệp vụ / quyền ngoài phạm vi ghi trong 08. Cổng riêng `PORT` / `WEB_PORT` ghi dưới. `npm run check` xanh trước khi mở PR; `/ponytail-review` trước PR. PR vào `main`, KHÔNG merge; mô tả ≤ 30 dòng (tệp, quyết định, giả định, `ponytail:` / `shortcut:` nếu có, số đo, câu [XM] thật sự còn mở). PR giao diện: `/ponytail lite` đầu phiên, impeccable `layout` + `polish` trong phạm vi, `audit` + `web-design-guidelines` trước PR, ảnh cặp 1440 sáng / 1440 tối / 1280 / 375 (`scripts/anh-cap.mjs`) CÓ DỮ LIỆU đủ trạng thái + bảng KHỚP / KHÁC + bảng thao tác TRƯỚC → SAU (mục 4 luật 8b). Dùng skill `karpathy-guidelines` suốt phiên.

[V5-E] Chủ SP dán vào session cloud mới (môi trường "Pisatracking") một dòng: *"git fetch origin; đọc 08 + 10 trên main, làm PR &lt;MÃ&gt; theo 08 mục 10."* — session tự đọc đầu chung + dòng của mình dưới. Dòng **ĐÃ MERGE** chỉ để tra; CHU-THI, SEED-UX do session cũ của PR làm tiếp.

| PR | Cổng | Prompt (sau đầu chung) |
|---|---|---|
| CHU-THI | 4431 / 5631 | **ĐANG MỞ #522.** `git merge origin/claude/chu-thi-fb3e30` lấy kiểm kê; chạy lại kiểm kê trên main hiện tại; sửa chuỗi theo bảng thuật ngữ Rulebook + C21 ("Thi thật" cột lịch → "Ngày thi") + K7 + K11; không đổi khoá mã / cột SQL; EN đi cùng. impeccable `clarify`. |
| DATA-TVV | — | **ĐÃ MERGE #512.** Chỉ viết lệnh chỉ đọc (script `scripts/`) đếm em đang học có / chưa TVV theo chi nhánh + hướng dẫn chủ SP gán ở Quản trị. Không ghi DB. |
| NEN-V5 | 4432 / 5632 | **ĐÃ MERGE #520.** Ánh xạ `thiet-ke/v5/v5-nen.css` vào token `web/src/index.css` (sáng + tối) theo `02` mục 2; badge 4 nhóm, `ChipSos`, `TyLe`, gộp `OSo`, ô chỉ số; thanh xanh + `logo-pisa.png`; menu theo `nav.ts` (K1), cờ `overview` cho GV (K10). `Bang` / `ODiem`: chỉ token (R4). Ảnh cặp `/dev/thanh-phan` ↔ `bang-mau.html`. Kiểm tương phản bằng `thiet-ke/v5/kiem-tuong-phan.py`. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Token tối theo `v5-nen.css` mới (P3, bớt tím) + SOS 3 mức nền nhạt / cam đặc / đỏ thẫm (P6, `.bd-sos`); một hàm nhãn tháng dự kiến `Dự kiến MM/YYYY` (P5) + một hàm nhãn hạn `dd/mm` (P7), thay mọi chỗ đang tự định dạng; kiểu nhãn / giá trị dùng chung (P2). Chạy lại `kiem-tuong-phan.py`. |
| NEN-PANEL | 4433 / 5633 | Sửa `KhungPanel` / `KhuonViec` / `SaveState` theo `07` mục 4 + K12: dòng loại panel, chân lưu, "Lưu" / "Lưu và tiếp" (chỉ chuyển sau lưu xong), nháp theo khoá việc, hỏi khi đổi việc, lỗi giữ chữ, 375 + bàn phím (T21). Phép kiểm T15, T16. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Câu giải thích trong panel → `NutLuat` "?" (P1); khối bối cảnh nhãn nhỏ xám / giá trị đậm / số có màu, rà theo `09-anh1-cong-viec.png` (P2). |
| SV-TVV | 4434 / 5634 | **ĐÃ MERGE #516 #517.** Máy chủ việc TVV theo mục 5–6 (N1, N2, N6, C15, R1, `06` điểm 6). Đọc `../2026-10-20-ke-hoach-overhaul/07` mục 5 (SV-YT-TVV, SV-TVV-VIEC) làm nền, bỏ phần UI-YT-TVV. Migrate chỉ thêm bảng. Phép kiểm: hạn T7 / CN, em không TVV → QL CN, "Chưa liên hệ được" giữ việc mở, thu hồi giữ lịch sử, TVV chỉ thấy việc mình. Liệt kê (chỉ đọc) việc KQ thi thật đang mở của GVCN trước khi chuyển. |
| SV-SO1 | 4435 / 5635 | `/my-work` đếm việc / nhóm / bài (đếm trước gộp), badge = việc của tôi, chuông = tin; giữ S chéo không nợ (R2); thiếu nhận xét bắt buộc ≠ xong; bỏ gợi ý MT4 (grep `MT4` — một phần đã gỡ ở #514 / #521; còn dòng "MT4 chưa xếp" `shared/domain/keHoachTest.ts:225`, cột "Chưa lịch Test" nếu còn); cờ `chiXem` / `lamThay`. Phép kiểm T01–T04, T17. |
| SV-SO2 | 4436 / 5636 | **ĐÃ MERGE #521** (phần Báo cáo HV → SV-SO3). Chỉ số theo `05` + K5, K6, K9, R3b, R3c: quy tắc Overall ở Phân tích / Hồ sơ GV, bỏ màu ngưỡng, Σ tử / Σ mẫu, "Chưa có dữ liệu", Việc đúng hạn (việc) + Điểm đúng hạn (bài), API Hồ sơ GV theo kỳ, panel báo cáo không khối việc. Cập nhật `05` (dòng #1b). Phép kiểm T06–T08, T11, T19, T20. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). "Thi tháng này" (thi thật, tháng hiện tại, phạm vi đang xem — P4); mọi số theo **lượt của từng HV**, gỡ "MT gần nhất của lớp" (P8 — liệt kê chỗ đã gỡ); API nhận Từ tuần – Đến tuần tự do (P9); Phân tích GV bỏ "Xử lý vi phạm" khỏi bảng (giữ dữ liệu), gỡ "mẫu nhỏ" (#514), giữ "Đạt Target – Thi thật"; API "Hành trình theo kỹ năng" cho Báo cáo HV (`thiet-ke/v5/dieu-chinh-cuoi.html` khu f). |
| SV-LOP | 4437 / 5637 | Hồ sơ lớp: việc theo em từ `/my-work` (nhiều dòng, người xem trước — C19); đánh giá đầu ra lớp thường chỉ khi đủ Final, trước đó "Chờ Final" (R3a); W1 / W2 riêng. Phép kiểm T12. **[V5-E] + nợ rà #526 (S Ex, `server/src/cham/sExpert.ts`):** (1) xoá mềm cột `xoa_luc` + khôi phục (luật không khoá cứng) · (2) `suaSEx` / `xoaSEx` đọc dòng trong `tx`, `.changes === 0` → 404 không ghi nhật ký · (3) kiểm quyền trước 404 (`themSEx`, `docLuot`) · (4) chặn thêm lượt cho HV không có lớp đang học (400 + lý do) · (5) GV S chấm theo chi nhánh ghi danh active, QL nhập hộ theo luật S MT; phép kiểm 1–5. |
| SV-BAI-LOP | 4438 / 5638 | **ĐÃ MERGE #513.** Bảng + API bài trên lớp (mục 5), quyền GV kỹ năng / GVCN / QL, lịch sử sửa; không vào chỉ số, không sinh việc. Phép kiểm T18. |
| SV-S-EXPERT | 4452 / 5652 | **ĐÃ MERGE #526** (nợ rà → SV-LOP). [V5-D] Đọc `10` mục 2 dòng SV-S-EXPERT + mục 4 XM-1. Migrate chỉ thêm bảng lượt S Ex (HV, ngày / tuần, GV chấm, điểm, nhận xét, người thêm, lịch sử); API thêm / sửa / xoá — **thêm chỉ QL / Admin** (máy chủ kiểm, 403 cho vai khác), GV S chấm; trả kèm dữ liệu Lịch Test tuần + Kế hoạch Test, đánh dấu riêng S MT. Phép kiểm: không vào Overall / SOS / Case / KPI / Phân tích / nợ chấm / đếm việc; không đổi luồng S chấm chéo; quyền thêm. Không dựng luật điểm (XM-1 mở). |
| SV-SO3 | 4453 / 5653 | [V5-E] Đọc `10` mục 5 + `thiet-ke/v5/phan-tich.html` (bảng Kết quả MT) + `thiet-ke/v5/dieu-chinh-cuoi.html` khu d. (1) API Kết quả MT cho Báo cáo HV: hàng MT0 · MT1 · MT2 · MT3+ · Thi thật × Đạt Target · Thiếu 0.5 · Thiếu 1.0 · Thiếu ≥ 1.5 · Chưa đủ · So lượt trước; theo lượt của từng HV (P8), Từ tuần – Đến tuần tự do (P9), dùng lại hàm Overall / lượt của SV-SO2 (`phanTich/baoCao.ts`), số bấm → panel chỉ đọc không khối việc (C22). (2) Hàng HV của `/hoc-vien`: kiểm trường đã có (`shared/domain/hocVienLop.ts`), chỉ thêm Lộ trình · MT gần nhất của em (Overall / KV + L R W1 W2 S) · Xu hướng · Hỗ trợ · Ý thức còn thiếu. Không đổi quyền. Phép kiểm: MT3+ gộp đúng, mẫu 0 = "Chưa có dữ liệu", Σ tử / Σ mẫu nhiều chi nhánh, trần số câu (`tocDo`). |
| SEED-UX | 4439 / 5639 | **ĐANG MỞ #515.** `git merge origin/claude/seed-ux-6214d7` lấy kế hoạch cũ; viết lại theo `thiet-ke/v5/du-lieu-demo.md` (sửa K2, K3, K4 vào tệp đó) và R5; đi qua hàm dịch vụ như kế hoạch cũ mục 2; mọi ngày ≤ 14/09; ghi lý do từng phép kiểm đổi số. |
| UI-CONG-VIEC | 4440 / 5640 | Làm `/cong-viec` theo `thiet-ke/v5/cong-viec.html` + truy vết. Không đổi API ngoài SV-SO1. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Panel theo P2 (`09-anh1`), cả panel TVV; Case mở rộng tại chỗ (sửa trường được quyền sau lưu + lịch sử; bước duyệt giữ). |
| UI-CHAM-TEST | 4441 / 5641 | Làm khu Chấm Test `/test/lich` theo `thiet-ke/v5/test.html` (khu Chấm) + R2 (bỏ "Lớp tôi dạy S"; "Của tôi" theo mã — chốt V5-E mục 1); Kế hoạch Test: chỉ QL thêm MT tay. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Tên 4 nhóm theo ngày hạn thật `dd/mm` (P7). Kế hoạch Test: **giữ tư duy web cũ** theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu a + ảnh gốc `thiet-ke/v5/anh/dieu-chinh-cuoi-goc-ke-hoach-test-web.png` (từng HV × MT1–MT3, `W3 SEP 2026`, Overall khi xong, cột S Ex — nút thêm chỉ QL / Admin, cần SV-S-EXPERT). |
| UI-CV-TVV | 4442 / 5642 | Công việc TVV theo `thiet-ke/v5/tvv.html` + R1 (QL thấy việc em không TVV). Dùng khung trang Công việc của UI-CONG-VIEC. |
| UI-LICH-TUAN | 4443 / 5643 | Khu Lịch tuần `/test/lich` theo `thiet-ke/v5/test.html` (khu Lịch); `/nhap-diem/*`, `/bang-diem-thuong/*` thành chuyển hướng. **[V5-D]** Khu Lịch tuần theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu a (thay khu Lịch của `test.html`) + ảnh gốc `thiet-ke/v5/anh/dieu-chinh-cuoi-goc-lich-test-web.png`: hàng lớp gọn, bảng từng HV làm Test trong tuần (MT của em), sửa điểm tại chỗ theo quyền + lịch sử, cột S Ex (SV-S-EXPERT), hạn `dd/mm`, SOS thay "Chưa đạt"; bỏ ba khung tổng quát. Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). |
| UI-HO-SO-LOP | 4444 / 5644 | `/hoc-vien/lop/:id` theo `thiet-ke/v5/ho-so-lop.html` + R3a. Lưới điểm giữ `Bang` / `ODiem` (R4). **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Bố cục mới theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu b: W một lần + W1 · W2 phụ, popover thành phần W / S, bỏ "Chưa đạt" khi SOS, Case + PA mở dưới hàng (thao tác Công việc tại chỗ), thanh Việc cần làm mỗi việc một ô, "Tiến độ trên lớp", P8. |
| UI-HV-LOP | 4445 / 5645 | `/hoc-vien` theo `thiet-ke/v5/hoc-vien-lop.html` + K7. **[V5-D]** Bố cục theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu d (thay bảng `hoc-vien-lop.html`): danh sách gọn nhiều lớp, chế độ Tất cả · Đang SOS · Lịch thi (bỏ "Cần làm"), Lịch thi theo `thiet-ke/mockup-v4-hoc-vien-lop.html` khung Lịch thi A / B + trường của `thiet-ke/mockup-ov14-5-lich-thi-xuat-ds-2026-10-19.html` (XM-2), bỏ checkbox, Xuất theo bộ lọc + chọn cột. Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). **[V5-E]** Áp `10` mục 5 (cột Lộ trình · MT gần nhất · Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc; không "tuần n/24"; Lịch thi mở dưới hàng); dữ liệu SV-SO3. |
| UI-HO-SO-HV | 4446 / 5646 | `/hoc-vien/:id` theo `thiet-ke/v5/ho-so-hv.html`; khu Bài trên lớp dùng API SV-BAI-LOP. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Hành trình theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu c: từng kỹ năng (chip), chấm MT + kỳ vọng bậc thang + bảng mốc, "Tiến độ trên lớp" dòng riêng thang riêng; không line chart nhiều đường. **[V5-E]** Áp `10` mục 5 (ô điểm đổi kỹ năng, biểu đồ chỉ MT + mốc tuần, bảng Tiến độ trên lớp 3 dòng + Xem thêm, Case & PA theo kỹ năng đang chọn). |
| UI-TONG-QUAN | 4447 / 5647 | `/` theo `thiet-ke/v5/tong-quan.html` phương án B mọi vai + K1, K6, K10; bỏ form nhúng (`KhoiCanQuyet`, `TongQuanQl`), bỏ nhánh `workApprove` CX chết. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). "Thi tháng này" (P4); TVV chỉ 3 nhóm Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp; Lớp cần chú ý theo lượt từng HV (P8); bỏ dòng chú thích (P1). |
| UI-HO-SO-GV | 4448 / 5648 | `/giao-vien/:id` theo `thiet-ke/v5/ho-so-gv.html` phương án C (K8) + R3c. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). Dải đầu + Lớp đang dạy + bảng Học thuật theo `thiet-ke/v5/dieu-chinh-cuoi.html` khu e; kỳ tự do mặc định 4 tuần (P9); bỏ hộp chữ quy tắc (P1); P8; đề xuất thông tin còn thiếu trong mô tả PR (có lý do). |
| UI-PHAN-TICH | 4449 / 5649 | `/phan-tich` theo `thiet-ke/v5/phan-tich.html`; panel số chỉ đọc (C22). **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11). P9; Phân tích GV: "Quá hạn", giữ "Đạt Target – Thi thật", bộ cột Gọn vừa 1280 không cắt / cuộn, bỏ "Xử lý vi phạm", bỏ "Mẫu nhỏ"; Báo cáo HV thay "Kết quả theo lớp" bằng "Hành trình theo kỹ năng" (`thiet-ke/v5/dieu-chinh-cuoi.html` khu f). **[V5-E]** Theo `10` mục 5: bảng **"Kết quả MT"** (hàng MT3+; không "Đường tới Target" / "Hành trình theo kỹ năng"), dữ liệu SV-SO3. |
| ~~UI-TUTOR~~ | — | **HOÃN** [V5-D, P10] — không chạy đợt này; **[V5-E] không chạm Tutor tới tuần sau** (cả ghi đề xuất). |
| UI-CON-LAI | 4451 / 5651 | Theo `thiet-ke/v5/con-lai.html` (tìm kiếm, bộ lọc tuần, hộp duyệt T22, thông báo, biểu mẫu, rỗng / lỗi, in / xuất); > 25 tệp thì tách 2 PR. **[V5-D]** Đọc `docs/superpowers/specs/2026-10-22-overhaul-v5/10-pta-ap-phan-hoi-cuoi.md` mục 1 (P1–P11); áp P1, P2, P7. |
| TL-V5 | — | (session planning) Cập nhật `DESIGN.md` theo `04` cuối + V5, `plan.md` 1.6 / mục 4, Hướng dẫn theo màn mới. Chỉ sau khi các PR màn đã merge. |
