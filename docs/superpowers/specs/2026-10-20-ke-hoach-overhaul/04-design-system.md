# 04 · Design System Proposal — một hệ thiết kế cho PISA (BẢN NHÁP · 21/10/2026)

> **Mục đích.** Gom MỌI đề xuất rời rạc về giao diện (tài liệu chính 10.1, 10.3, 11.1a, 12.1, 12.4; phụ lục v1, v2b, v3a, v3b, v4a, v4c) thành **một hệ**: chữ, khoảng cách, màu, điểm, bảng, ô, panel, chip, nút, trạng thái, ô nhập, khung trang, 375, trợ năng, sân mẫu, phép kiểm. Chỗ các nguồn nói khác nhau đã được phân xử (mục 21). Đây là nguồn để viết lại `DESIGN.md` ở GĐ0 (PR QT-UX) **sau khi chủ SP đồng ý**.
> **Cách đọc.** Mỗi mục là một bảng **Quy tắc · Lý do · Nguồn · Trạng thái**. Chủ SP chỉ cần đọc mục 0 (tóm tắt), mục 21 (mâu thuẫn đã giải) và mục 22 (chỗ PTA đảo quyết định / mockup cũ — phản đối nếu không đồng ý). Session code đọc đủ mục 2–20.
> **Trạng thái.** **ĐÃ CHỐT** = chủ SP đã quyết (ghi mã) · **PTA đề xuất** = thẩm mỹ / UX, PTA tự quyết, chủ SP phủ quyết được; "(đảo …)" = đổi một quyết định / mockup cũ · **Cần chủ SP** = câu ở [02 mục 5](02-conflict-decision-log.md). Không mục nào đổi luật nghiệp vụ, quyền, ngưỡng điểm.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · [`01-feedback-register.md`](01-feedback-register.md) · [`02-conflict-decision-log.md`](02-conflict-decision-log.md) · [`03-ux-ui-audit.md`](03-ux-ui-audit.md) · **04 (tệp này)** · [`05-ia-workflow.md`](05-ia-workflow.md) · [`06-mockup-gap.md`](06-mockup-gap.md) · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) · phụ lục [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/) (v1-nen-chung, v2b-bang-ho-so, v3a-test, v3b-phan-tich-tutor, v4a-cong-viec, v4b-nghiep-vu, v4c-vai-tro-phu-web, a6) · hệ hiện hành [`../../../../DESIGN.md`](../../../../DESIGN.md), [`../../../../web/src/index.css`](../../../../web/src/index.css) · mockup [`../../../../thiet-ke/`](../../../../thiet-ke/) (m1…m6 = `mockup-ov14-{1..6}-*.html`, **m6 thắng m1–5**; mT = `mockup-tutor-1-head-tutor-2026-10-19.html`).
> **Ký hiệu nguồn.** 10.1, 11.1a… = mục tài liệu chính · V2B-n, V3A-n, V3B-n, V4A-n, V4C-n, HTT-n = mã phụ lục · X-nn, Q-xx = dòng / câu ở 02 · C06, C08… = quyết định đặc tả OV-14 (01 mục 4) · PTA-v4-n = hướng PTA Plan chốt 21/10 sau vòng 4. Soạn: agent d2 (Opus 5.5) cho PTA Plan.

---

## 0. Tóm tắt (10 dòng)

1. **Chữ:** giữ Be Vietnam Pro + chữ số Inter; thang **12 · 13 · 14 · 15 · 17 · 22 · 28**; chữ thường / ô bảng / nút **15**, lưới điểm dày 14, nhãn / đầu cột / chip 13, không chữ < 12, không IN HOA, line-height ≥ 1,5 chỗ có dấu chồng. Bản `main` nhỏ hơn bản deploy 1 px ở bảng và tiêu đề cột thấp đi ~21–27 % — thang mới vượt cả hai.
2. **Khoảng cách:** thang 4 · 8 · 12 · 16 · 24 · 32 · 48; hàng bảng **44 / 64 px**, dòng việc 56 px, hàng nhóm 40 px; ngân sách trang ≤ 2 màn (1440) / ≤ 4 màn (375).
3. **Màu:** giữ 5 nghĩa của m1 §1a; thêm 3 token kết quả `--kq-vuot / --kq-bang / --kq-duoi` (≥ 4,67:1 trên 9 nền, mù màu ΔE 1,3 → 11,4); quá hạn = chữ cam + ⚠; SOS chỉ viền 1 / 1,5 / 2,5 px.
4. **Điểm:** tô **chính con số** + ✓ / ✗ đứng **trước** số; "x / tổng" = **"✗ 17/25"** (không % trong ô); một `ODiem` thay 29 nơi / 7+ dáng.
5. **Bảng:** một `Bang` + **13 kiểu cột**; căn do kiểu cột quyết (số / điểm giữa, chữ trái); đường cơ sở chung; công cụ ngoài khung; cấm điều khiển trong tiêu đề; 375 tự thành thẻ; phép kiểm BANG-1…5 + `do-bang`.
6. **Bấm được một nghĩa một dáng:** ô số = mở tại chỗ / panel · chữ + "›" = đổi trang giữ lọc · "↗" sau tên = mở hồ sơ · ⓘ = giải thích · chip lọc có số = lọc tại chỗ · nút động từ = làm việc. Bỏ gạch chấm.
7. **Panel:** một vỏ "Khung việc" gắn thang làm tại chỗ 0–5; khuôn **6 phần** (đầu · bối cảnh · cần làm · lịch sử · chân · sau lưu); `PanelChiSo` A / C; một danh sách một kiểu mở; không panel chồng.
8. **Trạng thái:** hệ **HTT-1…12** — hover phủ 8 % / 9 % trên từng ô, chỉ cho thứ bấm được; **đang chọn = nền nhấn nhạt + vạch trái 3 px** (PTA-v4-9, đảo m1 §1d); một cách báo lưu.
9. **Thời gian:** `Khoảng tuần` "Tuần bắt đầu → Tuần kết thúc" mọi nơi; **"Toàn bộ" chỉ ở Phân tích**; không hàng nút "Tuần này · Tuần trước"; ô tháng / ngày thi thật giữ riêng; một hook "bấm ra ngoài" biết portal.
10. **Chống tái phát:** sân mẫu `/dev/thanh-phan` duyệt **một lần**; 30 phép kiểm máy (mục 19); bảng giữ / thay / bỏ 41 thành phần / lớp cũ (mục 20). 23 mâu thuẫn giữa các nguồn đã phân xử (mục 21).

---

## 1. Nguyên tắc

| # | Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|---|
| 1.1 | **Operate trước trang trí.** Giao diện là bàn làm việc: ổn định, dễ quét, mật độ có kiểm soát; màu, bóng, chuyển động chỉ để báo trạng thái. | Người dùng mở PISA để làm việc, không để xem | impeccable `operate.md`; DESIGN.md North Star; CLAUDE.md | ĐÃ CHỐT (CLAUDE.md) |
| 1.2 | **Ít mà rõ.** Mỗi bảng / panel / khối trả lời đủ 4 câu: *xem gì · làm gì · cho ai · bước tiếp ở đâu*; khối không trả lời được → bỏ. Nhãn chỉ khi khác thường; không câu giải thích dưới nút / ô. | MP III.1; chủ SP chê "dày đặc, chi chít" (ảnh v4-1) | MP III.1, XI.1; X5; DESIGN.md Don't | ĐÃ CHỐT (MP III.1) |
| 1.3 | **Một nghĩa một dáng, một dáng một nghĩa;** một khái niệm một tên (từ điển chữ). | Chủ SP học lại nghĩa ở mỗi màn (X7, X8) | X7, X8; CLAUDE.md 11/10-UX | ĐÃ CHỐT (11/10-UX) |
| 1.4 | **Màu chỉ báo nghĩa** (5 nghĩa, mục 4); không chỉ dựa màu — luôn có chữ / ký hiệu / dáng. | Mù màu đỏ–lục 5–8 % nam; màu mất nghĩa khi tô khắp nơi | m1 §1a; CLAUDE.md; ui-ux-pro-max "Color Only" | ĐÃ CHỐT (m1 §1a) |
| 1.5 | **Làm tại chỗ theo thang 0–5** (mục 9.2): chọn bậc thấp nhất đủ dùng; đổi trang chỉ để xem hồ sơ / cần không gian lớn. | MP III.5; mỗi lần đổi trang mất ngữ cảnh | 10.3; V1 II.2.1 | Hướng ĐÃ CHỐT (V1 II.2.1); thang = PTA đề xuất (10.7-6) |
| 1.6 | **Một nguồn một hàm:** số trên trang = số dòng panel; cùng chỉ số mọi nơi cùng hàm; một hàm tên việc cho dòng và đầu panel. | Việc đã xong không nơi nào còn báo chờ | X1; 9.1-4; CLAUDE.md 11/10-UX | ĐÃ CHỐT (9.1-4, 11/10-UX) |
| 1.7 | **Một mẫu mỗi thành phần**, dựng trong sân mẫu trước, phép kiểm máy chặn trôi (mục 18, 19). | Mỗi PR tự dựng → 7 dáng ô điểm, 5 dáng "đang chọn" | X7; PTA-06 | PTA đề xuất |
| 1.8 | **Khung mockup đã duyệt thắng** câu kế hoạch và luật giao diện cũ hơn; quyết định mới trái khung → sửa mockup (06 mục 3). Thành phần cũ là gốc lỗi thì thay, không viện "bố cục đã khoá". | Gốc lệch mockup N1, N2, N6 (06 mục 2) | 9.1-1; MP 0; X-10, X-11 | ĐÃ CHỐT (9.1-1, MP 0) |

---

## 2. Typography

### 2.1 Phông

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Be Vietnam Pro** cho mọi chữ; **chữ số 0–9 lấy từ Inter** (`@font-face` cùng tên, `unicode-range` 0–9, `index.css:10-14`) để số thẳng cột (`tabular-nums`). Giữ, không đổi phông. | Đo: đủ 134/134 ký tự Việt, dấu do người Việt vẽ, to rõ ở cỡ nhỏ. Đổi sang Inter chỉ +3 % chiều cao chữ; tăng cỡ 13 → 15 được +15 % | v1 A3 (so 6 phông); 10.1 | Hướng ĐÃ CHỐT (V1 I.1: PTA chọn phông); chọn BVP = PTA đề xuất (10.7-7) |
| Loại: Source Sans 3 (chữ thấp), Lexend (rộng → bảng dài), Noto Sans (rộng, không hơn chiều cao). | — | v1 A3 | PTA đề xuất |

### 2.2 Thang 7 bậc và vai từng cỡ

| Cỡ (px) | Vai — 1440 | 375 | Đậm | Line-height | Ghi chú |
|---|---|---|---|---|---|
| **28** | Số lớn (thẻ chỉ số, `ODiem` lớn ở hồ sơ Mock) | 26 | 700 | 1,1 (chỉ chữ số) | — |
| **22** | Tiêu đề trang (= tên menu) | 20 | 700 | 1,3 | nay 18 / 600 ở 18/21 trang (v1 A2) |
| **17** | Tiêu đề khối **và** tiêu đề panel (một cỡ) | 17 | 700 | 1,35 | bỏ đầu panel cũ 14 px (V4C-13) |
| **15** | Chữ thường · ô bảng · tên trong dòng việc · nút `.btn` · menu · tiêu đề mục / hàng nhóm (700) · **số điểm trong ô (700)** · ô nhập | 15 (ô nhập **16**) | 400; tên / việc / nút 600; tiêu đề mục 700 | 1,5 | cỡ chính của hệ |
| **14** | Lưới dày (lưới điểm FT / lớp thường, Kế hoạch Test) · giá trị trong panel · cột tuần / ngày | thẻ: 15 | 400 | 1,45 | chỉ nơi > 8 cột |
| **13** | Chữ phụ · nhãn ô form · đầu cột · chip · nút nhỏ `.btn-sm` · dòng 2 của dòng việc · mẫu số "/25" | 14 (chip 13) | 400; nhãn, đầu cột, chip, nút 600 | 1,45 | đầu cột **không in hoa** |
| **12** | Tối thiểu: số trong huy hiệu (badge) · dòng phụ trong `ODiem` ("30 câu", "vắng lần 1") · chú thích | 12 (thanh dưới 375: 12) | 600 / 700 (badge) | 1,4 | **không chữ nào < 12** |
| (40 / 17) | Chỉ ở chế độ **"Chiếu"** của Báo cáo: số 40, nhãn 17 | — | 700 | 1,1 / 1,35 | ngoài thang, chỉ khi Q-C2 duyệt |

| Quy tắc kèm | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Chữ **mang dữ liệu** (tên, điểm, hạn, ô bảng) ≥ 13 ở 1440, ≥ 14 ở 375. Ngoại lệ có chủ đích: dòng phụ trong `ODiem` 12 px (giữ hàng 64 px). | Bảng dày tiếng Việt cần cỡ; ngoại lệ ghi rõ để phép kiểm biết | v1 A3; V2B-2 | PTA đề xuất |
| Cỡ chữ trong ô bảng ∈ {12, 13, 14, 15}; trong panel ∈ {12, 13, 14, 15, 17}. | Một bảng nay dùng 4–5 cỡ (11 · 11,5 · 12 · 13 · 15) | 11.1a; V4A-03 | PTA đề xuất |
| Mỗi trang ≤ 8 cặp (cỡ, đậm) khác nhau. | Phân cấp rõ, không lộn xộn | v1 A3 "Cách kiểm" | PTA đề xuất |
| Bảng dài thêm ~8–11 % do tăng cỡ → **bù trong chính PR của màn** (bỏ khối trùng, hàng một dòng), không đổi cỡ toàn web một lần rồi để đó. | Tránh trang dài hơn trước khi gọn | 10.1; v1 A3 "Rủi ro"; 10.7-7 | PTA đề xuất |
| Thay thang C09 (12/13/14/16/20, ô bảng 13). | Chủ SP: "chữ quá nhỏ" | V1 I.1; MP III.2; X-13 | Hướng ĐÃ CHỐT (V1 I.1); số = PTA đề xuất (đảo C09) |

### 2.3 Line-height tiếng Việt · đậm · không in hoa

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Chữ một dòng có cắt (`truncate`) ≥ **1,5**; chữ nhiều dòng ≥ 1,45; tiêu đề ≥ 1,3. **Cấm** `leading-none` / `leading-tight` cho chữ có dấu. | Đỉnh dấu "Ỗ" của BVP 1,147 em → dưới 1,5 bị xén khi cắt chữ; chữ phụ panel nay 1,25–1,38 | v1 A3 (đo phông); V4A-03; ui-ux-pro-max "Line Height 1.5–1.75" | PTA đề xuất |
| Đậm: 400 thường · 600 nhãn / nút / tên · 700 tiêu đề, số · 800 **chỉ** cột nổi bật (Kỳ vọng, Overall). Bỏ 800 ở chữ nhỏ; nhãn ô form 13 / 600 (không 11,5 / 700). | Dấu chồng dày đặc ở chữ nhỏ đậm; phân cấp bằng cỡ, không bằng đậm | v1 A3; V4A-03 | PTA đề xuất |
| **Không IN HOA** chữ tiếng Việt ở bất kỳ đâu (tiêu đề mục panel, tiêu đề khối, đầu cột, nhóm thông báo, menu ⋯). Chỉ mã tuần `W2 OCT` và mã lớp viết hoa. | IN HOA 11 px tiếng Việt khó đọc, thấp hơn chữ thường cùng cỡ | C09 (đầu cột); v1 E2; V4C-13 | ĐÃ CHỐT (C09 cho đầu cột); mở rộng toàn web = PTA đề xuất |

### 2.4 So bản deploy (lời chủ SP "có chỗ nhỏ hơn bản deploy" — ĐÚNG MỘT PHẦN)

| Vai chữ | Deploy `6177d36f` | `main` hiện tại | **Đề xuất** | Nguồn số đo |
|---|---|---|---|---|
| Ô bảng (không tự đặt cỡ) | 14 | **13** (−7 %, OV-15a) | **15** | v1 A1 |
| Đầu cột | 11 IN HOA (chữ thấy 8,1 px) | 12 thường (6,4 px, −21 %) | **13** thường 600 | v1 A1 |
| Tên HV · lưới lớp thường | ~14 | 13 | **14** (lưới dày) | v4c §5 |
| Điểm chỉ đọc lưới lớp thường | ~14 | 13 | **15** / 700 | v4c §5 |
| Tiêu đề cột lưới lớp thường | 11 IN HOA | 12 thường (thấp hơn ~27 %) | **13** thường | v4c §5 |
| Dòng phụ / chip | 12 / 11,5 | 12 / 11,5 | 13 (dòng phụ ô điểm 12) / chip **13** | v4c §5; v1 A2 |
| Tổng quan QL khối việc | dòng 14, số 16 | dòng 13, số 13 | dòng **15**, số ô số 15 / 28 lớn | v1 A1 |
| Body · nút · menu | 14 | 14 | **15** | v1 A1 |
| Tiêu đề trang | 18 | 18 | **22** | v1 A2 |
| Tỉ lệ ký tự ≤ 12,5 px | 69,1 % (toàn web) | 69,0 % · lưới lớp thường **81 %** | **≤ 10 %** ký tự thấy được mỗi trang | v1 A1; v4c §5 |

Ghi chú: chủ SP xem ở ~125 % (đo ảnh `5.webp` ×1,27) → giáo viên ở máy 100 % thấy chữ còn nhỏ hơn. Nghiệm thu chữ chụp **cả 100 % và 125 %** (v4c §5). PTA đề xuất.

### 2.5 Phép kiểm cỡ chữ (chi tiết ở mục 19)

Đo DOM mọi trang ở 1440 / 1280 / 375, sáng + tối: (1) chữ < 12 → lỗi; (2) chữ trong `td`, dòng việc < 13 (1440) / < 14 (375) → lỗi, trừ phần tử có `data-phu-odiem`; (3) `text-transform: uppercase` có ký tự Việt → lỗi; (4) phần tử `truncate` có `scrollHeight > clientHeight + 1` (xén dấu) → lỗi; (5) > 8 cặp (cỡ, đậm) / trang → cảnh báo; (6) tỉ lệ ký tự < 13 px > 10 % → lỗi. Tĩnh: chặn thêm mới `text-[11px]`, `text-[11.5px]`, `text-[12.5px]`, `uppercase` trong `web/src/modules/**`, `leading-none` cạnh `truncate`. Nguồn: v1 A3 "Cách kiểm", V4C-13. PTA đề xuất.

---

## 3. Khoảng cách · lưới · mật độ

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Thang khoảng cách** gốc 4: **4 · 8 · 12 · 16 · 24 · 32 · 48** px; 2 và 6 chỉ để vi chỉnh bên trong một thành phần. Token tên theo vai: `--k-cum` 8 (trong cụm chip / nút) · `--k-truong` 16 (giữa trường form) · `--k-khoi` 24 (giữa khối panel / thẻ) · `--k-vung` 32–48 (giữa vùng trang). | Nhịp chặt–thoáng có chủ đích thay vì một giá trị lặp; panel nay khoảng dọc 0 px ở 4 panel | impeccable `layout.md` (thang gốc 4); V4A-03 (24 / 16 / 8) | PTA đề xuất |
| Nhãn → ô 4 px; ô → câu lỗi 4 px; khối bối cảnh → khối cần làm 24 px. | Nhãn gắn với ô của nó, khối tách khối | V4A-03 | PTA đề xuất |
| **Hàng bảng:** 1 dòng = **44 px**, 2 dòng = **64 px** (đệm dọc 10 / 9, ngang 12); không ô > 2 dòng. Hàng nhóm **40 px** (15 / 700). Hàng con thụt 16 px. | Nay hàng 46–101 px thất thường; 44 = một vùng chạm | 11.1a 4c; V2B-1; (v1 A3 đề xuất 40 / 63 — thua, xem 21) | PTA đề xuất |
| **Dòng việc** (danh sách hàng đợi) 56 px (1440, 2 dòng: việc 15 + đối tượng 13) / 64 px (375). | Đọc được việc + đối tượng mà không dày | V4A-01 | PTA đề xuất |
| Chip cao 24 px (375: 28); nút thường 40, nút nhỏ 32 (375: mọi nút / ô ≥ 44). | Vùng bấm đủ, chữ 13 không chật | v1 A3; DESIGN.md Layout | PTA đề xuất (số) · 44 ở 375 ĐÃ CHỐT (DESIGN.md) |
| **Cột:** tên ≥ 205 px ("Nguyễn Thị Phương Thảo" 15 px = 181 + đệm); số 64–88; điểm 80; tuần 96; chip 140; nút 48; chỉ **một** cột linh hoạt; không `%`. | Nay cột tên lưới FT 176 px cắt chữ; colgroup % vỡ ở 1280 | v1 A3; 11.1a R3; V2B-1 4b | PTA đề xuất |
| **Một hàng = một dòng chính;** dòng 2 chỉ khi mang tin mới (không lặp chip / kết quả). | Bảng 33 em: 1 dòng ~1 450 px, 2 dòng ~2 110 px | v1 A3 "không nhồi" | PTA đề xuất |
| **Ngân sách chiều cao trang làm việc** (mặc định, dữ liệu demo dày): ≤ **2 màn ở 1440** (~1 800 px `main`), ≤ **4 màn ở 375**. Dòng việc đầu ở y ≤ 200 px (1440) / ≤ 420 px (375). Khung nhìn đầu ≤ 30 phần tử bấm được. | Nay Hồ sơ lớp 4 800–5 400 px; dòng việc đầu Công việc QT y = 752 / 1 505 px | X5; PTA-05; V4A-01 | PTA đề xuất |
| **Lưới trang:** bảng trải hết bề rộng; khối chữ ≤ 78 ch (`.prose-col`); hàng đợi = danh sách trái **520–560 px** + khung chi tiết phải phần còn lại (dính) ở ≥ 1 024 px; dưới 1 024 → danh sách → chi tiết toàn màn. | Chi tiết luôn ngang hàng chỗ vừa bấm | owner 10/09 (`index.css:161-172`); 10.2 B; V4A-01 A | Hai khung = PTA đề xuất (bố cục trang Tổng quan / Công việc → Cần chủ SP Q-A1, Q-A2) |

---

## 4. Màu

### 4.1 Token nền · chữ · viền (giữ bộ hiện hành `index.css:25-128`)

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Nền tách lớp: `--bg` (trang) → `--surface` (thẻ, bảng, panel) → `--surface-2` (nút, đầu cột) → `--hang-lon-bg` / `--hang-con-bg`. Viền `--line` 0,18, `--line-strong` 0,32. | Đã duyệt OV-15a, khớp m1 | DESIGN.md Colors; OV-15a (19/10) | ĐÃ CHỐT (19/10) |
| Chữ: `--text` (chính) · `--text-dim` (phụ quan trọng) · `--text-faint` (phụ nhỏ) — cả hai ≥ 7:1 trên `bg` / `surface` / `surface-2`. Dấu "—" và "/" dùng `--text-faint` (nay 1,9–2,5:1, B-07, B-08). | Đọc được ở cả hai chế độ | `prOv15a`; B-07, B-08 | ĐÃ CHỐT (token) · sửa "—" "/" = PTA đề xuất |
| **Thêm:** `--phu-re` (rê chuột) tối `rgb(255 255 255 / .08)`, sáng `rgb(15 23 42 / .09)` → ΔL ≥ 5,8 mọi nền; `--phu-do` (dò hàng) 3,5 %. Bỏ `.row-hover` 4 % và `hover:bg-white/5`. | Hover nay ΔL 0–4,5 (đo ô thật V4C-02) | v1 C2; HTT-1, HTT-2 | PTA đề xuất |
| Sáng: `--ok-rgb` → `22 101 52` (#166534) — nay 4,38:1 trên nút rê chuột, 4,47:1 trên hàng đã thi (< 4,5). | Tương phản | v1 E13 | PTA đề xuất |
| Sáng / tối theo máy, chọn trong menu tài khoản; mọi token khai hai chế độ ở **một** khối. | — | 17/10; PR-SANG | ĐÃ CHỐT (17/10) |

### 4.2 Năm nghĩa màu (m1 §1a) — dáng / ký hiệu mang nghĩa, màu chỉ phụ

| Nghĩa | Token | Được dùng ở | Cấm |
|---|---|---|---|
| 1 · **Nhấn** | `--accent`, `--accent-strong`, `--accent-soft`, `--accent-line` | nút chính · đang chọn (HTT-5, HTT-6) · focus · link | thông tin thường, trang trí |
| 2 · **Kết quả** | `--kq-vuot` · `--kq-bang` · `--kq-duoi` (mục 5) · `--sos1/2/3` (viền chip SOS) | **chỉ** trong ô điểm, chip SOS, chip kết quả | tô nền hàng, chip trạng thái thường |
| 3 · **Đã thi** | `--da-thi-bg` + vạch trái 3 px `--ok` + chip "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp" | **nền hàng chỉ cho nghĩa này**; chip Lịch thi A (mục 10) | nghĩa khác |
| 4 · **Hạn** | `--late` (quá hạn — **luôn kèm ⚠**), `--soon` (sắp hạn ≤ 3 ngày · hôm nay · tạm) | **chỉ chữ** | chip, nền, tô hàng |
| 5 · **Trung tính** | `--muted` | mọi trạng thái khác: Chờ duyệt · Chưa chốt PA · Trống PA · Đang xử lý · Chờ chọn bước tiếp · bài chờ chấm · Đã huỷ | thêm màu thứ sáu |

Nguồn: m1 §1a, §1c (duyệt 18/10); DESIGN.md; 17/10-PL. Trạng thái: **ĐÃ CHỐT**. Đã bỏ tím `wait`, teal `chon-*`, xanh `doing` cho trạng thái (OV-15a). Không thêm nghĩa màu thứ sáu (V2B-7: phân cấp nhóm lặp bằng cấu trúc + chữ + một màu).

### 4.3 SOS 1 / 2 / 3

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Chip SOS **chỉ viền** + chữ, không nền: SOS 1 vàng `--sos1` viền 1 px · SOS 2 cam `--sos2` 1,5 px · SOS 3 hồng đỏ `--sos3` 2,5 px + vòng ngoài 1 px (viền đôi). SOS tạm = cùng bậc, **viền đứt** + chữ "tạm". Chữ luôn "SOS n · kỹ năng" (W1 / W2 gộp W). | Đọc được khi mất màu (độ dày viền + chữ); validator tối ΔE 17,3, mù màu 10,6 | C08; m1 §1b | ĐÃ CHỐT (C08) |
| Một định nghĩa "SOS hiện tại" cho Tổng quan · Học viên & Lớp · Báo cáo; số trong kỳ ở Phân tích mang tên khác ("Lượt SOS trong kỳ"). | Một khái niệm một tên | 9.1-4; X-22 | ĐÃ CHỐT (9.1-4) |
| Màu SOS **không** dùng cho điểm, hạn, trạng thái; số điểm không có viền / nền. | Không lẫn với kết quả (đỏ dưới ↔ SOS 3: ΔE 8,9) | v1 B2 | PTA đề xuất |

### 4.4 Quá hạn · tương phản · mù màu

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Quá hạn = chữ `--late` + ⚠** ("⚠ quá hạn 6 ngày"); không chip nền, không tô nền hàng, không viền. Số "⚠" trên màn ≤ số dòng quá hạn đang hiện + số nhóm (chống mù cảnh báo: nay 24 dấu ⚠ / 23 dòng). Nợ cũ ≥ 14 ngày cùng lớp × môn gom một dòng. | Cảnh báo có giá trị khi hiếm | 17/10-PL; m1 §1c; V4A-01 | Chữ + ⚠ ĐÃ CHỐT · đếm ⚠, gom nợ cũ = PTA đề xuất |
| Tương phản: chữ ≥ **4,5:1** trên mọi nền thật (9 nền: trang, thẻ, `surface-2`, nút rê chuột, hàng nhóm, hàng con, hàng đã thi, cột nổi bật, hàng hover); viền / ký hiệu / vòng focus ≥ **3:1**. | WCAG AA | v1 B2; ui-ux-pro-max "Color Contrast" | PTA đề xuất (đo) |
| Cặp dễ lẫn đã tách bằng **độ sáng** (không chỉ sắc): vượt ↔ dưới (tối) ΔE thường 29,2 · deutan 11,4 · protan 23,1; "bằng" lệch về chàm để khác màu link (ΔE 5,2 tối / 8,1 sáng). Protan ở sáng còn ΔE 4,7 → **giữ ✓ / ✗ là bắt buộc**. | Mù màu | v1 B2 bảng so | PTA đề xuất |

---

## 5. Color code điểm

### 5.1 Ba token kết quả

| Token | Tối | Sáng | Tương phản thấp nhất (tối / sáng) | Khi nào |
|---|---|---|---|---|
| `--kq-vuot` | `#86efac` | `#166534` | 8,30 / 5,80 | FT: band **>** kỳ vọng của đúng lượt · lớp thường: ≥ 70 % |
| `--kq-bang` | `#a5b4fc` | `#1e40af` | 5,85 / 7,09 | FT: band **=** kỳ vọng (Rulebook §3.5 — vẫn là Đạt) |
| `--kq-duoi` | `#ff8282` | `#c81e1e` | 4,87 / 4,67 | FT: band **<** kỳ vọng · lớp thường: < 70 % |
| trung tính | `--text` | `--text` | 9,20 / 14,52 | Chưa đủ điểm · không có kỳ vọng · **KCK dưới kỳ vọng** · MT lịch sử · mốc cũ (`--text-faint`) · ô đang gõ · Kỳ vọng · Target |

So kỳ vọng dùng **một** hàm `soKyVong(band, kyVong)` (`shared/domain/chipSos.ts:82-86`, làm tròn 0,1). Không đổi ngưỡng / luật phân loại (70 % trên số chưa làm tròn; Đạt FT = OVR ≥ kỳ vọng). Nguồn: 10.1; v1 B2. Trạng thái: tô chính con số **ĐÃ CHỐT** (V1 I.3, V3 I.1, MP III.3); token = PTA đề xuất.

### 5.2 Luật hiện điểm

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Tô chính con số** (15 / 700, màu theo 5.1) + **ký hiệu ✓ / ✗ cùng màu đứng TRƯỚC số** (14 px, SVG nét trơn). Ô không có ký hiệu (chưa kỳ vọng, MT lịch sử) **vẫn giữ chỗ** ký hiệu để số thẳng cột. | Màu trên số là lời chủ SP; ký hiệu trước = m6 §3; không chỉ dựa màu | V1 I.3; m6 §3; m1 §1a; V2B-2 | ĐÃ CHỐT (V1 I.3, m6 §3) |
| **Không** ghi chênh "thiếu 0.5 / vượt 0.5" trong ô; bằng kỳ vọng = ✓. Chênh chỉ ghi bằng chữ ở hộp "Vì sao SOS", panel (vd "R 5.5/6.0 · thiếu 0.5"). | Ô gọn; chênh cần khi giải thích | 19/10-M6; m6 §3; V3B-03 | ĐÃ CHỐT (19/10-M6) |
| **"x / tổng" = "✗ 17/25":** ký hiệu 14 → **số đúng 15 / 700 tô màu** → "/25" 13 / 400 `--text-faint` cùng đường cơ sở. **Không % trong ô** — % ở hộp chấm ("68 % · chưa đạt — cần 70 %"), tooltip, cột `phan-tram`. Mẫu số khác tổng phổ biến của cột → mẫu số `--soon` + `title` "đề khác". | GV chấm theo số câu; mẫu số là tham chiếu; % trong ô thành 2 thông tin, rộng ~110 px | V3A-8 P1; 12.1; 12.9-9 | PTA đề xuất (đảo m2 khung 1a "✗ 16/25 64%" — X-33) |
| **% tổng** (Final, Checkpoint, Pre FOU): "62 %" tô cùng ngưỡng 70 %; dải 50 / 60 nói **bằng chữ** ở dòng phụ gợi ý ("bổ trợ 2 buổi"), không màu thứ tư. | Không thêm nghĩa màu | V3A-8 | PTA đề xuất |
| **Overall FT** tô theo cùng luật (so kỳ vọng của lượt); **Kỳ vọng** không tô (tham chiếu), nằm trong dải cột nổi bật. | Kết quả thi đã dùng "Đạt = OVR ≥ kỳ vọng"; ô Overall ở lưới nay không so gì | v1 B-Q1; 10.7-8 | PTA đề xuất |
| **KCK** dưới kỳ vọng: số trung tính + chữ "KCK" mọi nơi (lưới, hồ sơ lớp, Case). | Áp đúng OV-9 cho đồng bộ; nay lưới hiện ✗ đỏ, Case hiện xám | 13/10-KCK; v1 B-Q2; 10.7-8 | ĐÃ CHỐT (13/10-KCK); áp mọi nơi = PTA đề xuất |
| **Kết quả bài lớp thường:** Progress = **chip SOS viền** theo số môn trượt (§20.17); đủ môn đạt = "✓ Đạt" chữ `--kq-vuot` **không nền**; chưa đủ = "Chưa đủ điểm · còn P" trung tính; Checkpoint như Progress nhưng không SOS. Bỏ chip nền "n/4 môn đạt". | Một màu một nghĩa; §20.17 đã chốt | V3A-8; 9.2-26 | Chip SOS ĐÃ CHỐT (Rulebook §20.17, 9.2-26) · dáng = PTA đề xuất |
| **Phân tích GV % chấm đúng hạn:** giữ 3 mức Rulebook §845 (< 50 · 50–69 · ≥ 70); < 50 `--kq-duoi`, ≥ 70 `--kq-vuot`, mức giữa chữ `--soon` + chú giải một dòng trên bảng. | Luật nghiệp vụ; trang không có chip SOS | v1 B-Q4 | Mức = ĐÃ CHỐT (Rulebook) · màu giữa = PTA đề xuất |
| Ô đang gõ / hộp xem trước **không tô**; hộp nhập điểm lẻ (không cột kỳ vọng) dùng ▲ / ▼ cạnh band, bằng kỳ vọng không mũi tên, số kỳ vọng ghi một lần. | Chưa lưu chưa phải kết quả | m6 §3; v1 B2 | ĐÃ CHỐT (m6 §3) |
| Số điểm là link (hồ sơ HV) → **không** dùng màu link; gạch chân khi rê. Tệp xuất Excel không màu: giữ cột chữ "Đạt / Chưa đạt". | Không lẫn "bằng" với link | v1 B2; E9 | PTA đề xuất |

### 5.3 Mọi nơi có điểm → biến thể `ODiem` (29 nơi)

| # | Nơi | Tệp (hiện) | Hiện tại | Sau |
|---|---|---|---|---|
| 1 | Lưới FT ô L / R / S (Test, panel Nhập điểm lớp, hồ sơ lớp, Công việc) | `fasttrack/HopNhapDiem.tsx:160-187` | số trắng, chỉ ✓/✗ 12 px có màu, ký hiệu sau số | `ODiem sua` / `doc` |
| 2 | Lưới FT ô W1 / W2 | như trên | số 12 thường, không ký hiệu | `ODiem` **có** ký hiệu (m6 §3, 11.8-14) |
| 3 | Lưới FT cột W tổng | `cham/LuoiFT.tsx:380-389` | trắng + ✓/✗ sau số | `ODiem doc` trong cột nền xám |
| 4 | Lưới FT Kỳ vọng / Overall | `LuoiFT.tsx:97-98, 404-405` | 15 / 800 trắng, Overall không so | Kỳ vọng trung tính; Overall `ODiem` (kiểu `noi-bat`) |
| 5 | Hộp nhập điểm (đang gõ) | `HopNhapDiem.tsx:372-391` | band + ▲/▼ | giữ, không tô |
| 6 | Hồ sơ Mock — thẻ lớn | `ui/ODiemLon.tsx:113-154` | đỏ khi dưới, trắng khi đạt; Overall trắng | `ODiem lon` (28 px), Overall so |
| 7 | Học viên & Lớp OVR L R W S | `students/BangHocVienLop.tsx:59-71` | trắng + ✓/✗, dòng "W1 · W2" 11 px | `ODiem doc`, bỏ dòng W1 · W2 (vào `title` + hộp Vì sao SOS) |
| 8 | Hồ sơ lớp › Tổng hợp | `students/ClassRoster.tsx:335-367` | chỉ ký hiệu (bản deploy tô số) | `ODiem doc`; mốc cũ `--text-faint`, không ký hiệu |
| 9 | Phân tích › Kết quả thi | `phanTich/KetQuaThi.tsx:82-90` | ✓/✗ 11 px | `ODiem doc` |
| 10 | Hồ sơ HV › tab Test (Mock) | `students/StudentDetailPage.tsx:497-503` | số là link xanh (R 5.0 < 5.5 trông như đạt) | `ODiem doc`, link gạch chân khi rê |
| 11 | Hồ sơ HV › Hành trình | `students/HanhTrinh.tsx:398` | đỏ khi "xấu" | `ODiem doc` ở mốc Test (V4C-06) |
| 12 | Bảng kỹ năng Case | `cases/SkillBoard.tsx:616-753`, `TheKyNang.tsx:61-66` | chip nền 3 màu; KCK xám | `ODiem doc`, bỏ nền; KCK chữ |
| 13 | Lưới lớp thường — ô sửa được | `fasttrack/ScoreEntry.tsx:778, 472-481` | số đỏ trong ô nhập + "Đạt · 80%" | `ODiem ti-le sua` (gõ số = mở hộp chấm) |
| 14 | Lưới lớp thường — ô chỉ đọc | `ScoreEntry.tsx:742` | "11/20" đỏ **không ký hiệu** (chỉ màu) | `ODiem ti-le doc` |
| 15 | Lưới lớp thường — Kết quả / % tổng | `cham/LuoiThuong.tsx:540-611` | chip nền đỏ "3/4 môn đạt", % 2 màu | chip SOS viền / "✓ Đạt" chữ; `phan-tram` |
| 16 | Hồ sơ lớp › Tổng hợp lớp thường | `classes/BangDiemLopThuong.tsx:208-241` | "× 27/40" đỏ cả cụm | `ODiem ti-le doc` |
| 17 | Nhập một kỹ năng 375 | `MotKyNang.tsx:131` | dòng phụ đỏ; FT không ký hiệu | `ODiem sua` 16 px |
| 18 | Phân tích GV — % ô kết quả | `phanTich/PhanTichGiaoVien.tsx:43, 110-116` | 3 mức đỏ / vàng / xanh | `phan-tram` (5.2) |
| 19 | Target | `ui/ui.tsx:458-466` | trắng | giữ trung tính |
| 20 | `BandCell` | `ui/ui.tsx:438-449` | không nơi dùng | **xoá** |
| 21 | Hồ sơ HV › Kết quả Test lớp thường | `StudentDetailPage.tsx:600-608` | chip **nền vàng** (trùng SOS 1) | `ODiem ti-le doc` |
| 22 | Hồ sơ HV › Tiến độ theo kỹ năng (lớp thường) | `cases/SkillBoard.tsx` | khung nền đỏ / xanh | `ODiem ti-le doc` |
| 23 | Chấm Speaking — danh sách | `PanelChamSpeaking` | "5.5" trắng, không ký hiệu | `ODiem doc` |
| 24 | Kết quả FT "Đạt kỳ vọng" | (ảnh `b-ql2-p1`) | chip nền xanh | chữ "✓ Đạt" không nền |
| 25 | Tổng kết lớp đã kết thúc | (V4C-09, `b2-lop1-ketthuc-ql-p1`) | 70 % chip vàng ở Tổng kết, đỏ ở lưới — **cùng số, cùng màn, khác màu** | một hàm `ODiem ti-le` / `phan-tram` |
| 26 | Lưu trữ › Tổng kết; hồ sơ HV đã lưu trữ | (`b2-hv39-luutru-p1`) | chip vàng | như #25 |
| 27 | Panel C / panel Báo cáo "Chưa đạt" | `ui/SoLieu.tsx` (`NganDanhSach`) | bảng 14 cột cuộn ngang | chuỗi "R 5.5/6.0 · thiếu 0.5" — `ODiem doc` + chữ chênh |
| 28 | Hộp "Vì sao SOS n" | `ChipSos` | số + "thiếu 0.5" | `ODiem doc` + chữ chênh |
| 29 | Tệp xuất Excel | máy chủ / trình duyệt | — | không màu; cột "Đạt / Chưa đạt" |

Nguồn: v1 B1 (#1–20), V3A-8 (#13–16, 21–24), V4C-09 (#25–26), V3B-03 (#27), m1 §1g (#28). Phép kiểm: "cùng giá trị trên một trang → cùng lớp màu"; chặn `text-rose-*` / `text-emerald-*` trên số điểm; màu số điểm chỉ từ `--kq-*`.

---

## 6. Bảng — một `Bang` + kiểu cột

### 6.1 Thành phần

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Một** `web/src/ui/Bang.tsx`: `<Bang cot={[{key, nhan, kieu, phu?, nhom?}]} hang={…} oCua={(h, c) => …} congCu={…} the375={…} />`. `kieu` sinh **cùng** `data-kieu` trên `th` và `td`; CSS căn theo `[data-kieu]` cho cả hai → tiêu đề và ô **không thể lệch**. `<table>` chỉ được viết trong `Bang`. | 65 `<table>` / 53 tệp, ~190 lớp căn viết tay, tiêu đề và ô một cột viết ở 2 chỗ (có khi 2 tệp) | 11.1a R1; V2B-1 4a | Sửa triệt để cấp hệ thống ĐÃ CHỐT (V2 I.7 + II.4, V3 I.3, MP III.4) · `Bang` = PTA đề xuất |
| Bỏ luật căn theo tên lớp `index.css:267` (`td.td.tabular-nums, th.th.text-right {text-align:center}`). | Gốc lệch 45–69 px lưới điểm ở 6 lối vào (trước OV-15a lưới này thẳng) | 11.1a R2 | PTA đề xuất (thời điểm → Q-E1) |
| Cột rộng **px theo kiểu**, chỉ **một** cột linh hoạt (tên hoặc việc / ghi chú) nhận phần dư; không `%`; bảng rộng hơn khung cuộn trong khung (`.table-scroll`), cột tên dính trái; đầu cột dính từ 1280 (`.bang-dinh` giữ). | Nay `w-full` + colgroup px giãn L 104 → 134 px; colgroup % → cột 54 px < nội dung 59 px ở 1280 | 11.1a R3 | PTA đề xuất |

### 6.2 Mười ba kiểu cột (căn tiêu đề = căn ô)

| # | Kiểu | Ví dụ | Căn | Rộng | Chữ | Chữ phụ |
|---|---|---|---|---|---|---|
| 1 | `ten` | Học viên | trái, dính | ≥ 205 px (linh hoạt) | 15 / 600 (link ↗ nếu mở hồ sơ) | 1 dòng 13: lớp · tuần; **trạng thái hàng = ký hiệu sau tên** ("✓" Đủ điểm, `title`) |
| 2 | `chu` | Nguyên nhân, Ghi chú | trái | linh hoạt | 15 / 400 | ≤ 1 dòng 13 |
| 3 | `so` | 6/11, 78 | **giữa** | 64–88 | 15 tabular | không |
| 4 | `diem` | L R W1 W2 W S OVR | **giữa** | 80 | `ODiem` (mục 7) | ≤ 1 dòng 12 |
| 5 | `noi-bat` | Kỳ vọng, Overall | giữa | 80 | 15 / 800, nền `--accent-soft` | không |
| 6 | `chip` | Kết quả, Trạng thái, SOS | trái | 140 | chip 13 | không |
| 7 | `tuan` / `ngay` | W2 OCT · hạn 18/09 | trái | 96 | 14 tabular | không |
| 8 | `viec` | Việc tiếp theo | trái | linh hoạt | động từ 15 / 600 + hạn 13 | 1 dòng |
| 9 | `nut` | ⋯, Nhập | phải | 48 | — | — |
| 10 | **`diem-ti-le`** | lưới lớp thường, Tổng hợp lớp thường, hồ sơ HV, Checkpoint, Pre FOU | **giữa theo dấu "/"** (số đúng căn phải 2 ch, "/tổng" căn trái 3 ch) | 88 | `ODiem ti-le` | không |
| 11 | **`phan-tram`** | "% tổng" Final / Checkpoint | giữa | 64 | 15 tabular, màu theo ngưỡng | gợi ý bằng chữ |
| 12 | **tiêu đề có chú thích** (`phu`) | "G+V · /25 ✎", "S · chấm chéo" | theo kiểu cột | — | nhãn 13 / 600 + chú thích 12 cùng **một** dòng | ✎ mở hộp nhỏ bậc 2 — **cấm ô nhập / nút trong `th`** |
| 13 | **nhóm cột 2 tầng** (`nhom`) | Progress / Final (Tổng hợp lớp thường); Kỳ vọng · Overall | giữa | — | hàng tiêu đề nhóm 32 px | kẻ dọc 1 px `--accent-line` giữa nhóm |

Nguồn: 11.1a 4b (#1–9); 12.1, V3A-9 (#10–13, 4 kiểu bổ sung vòng 3). Trạng thái: PTA đề xuất (12.9-21). **Căn giữa số / điểm** theo C06 (ĐÃ CHỐT 18/10) + **ký hiệu trước số và ô rộng cố định** của m6 §3 — m6 §3 vẽ căn trái → **đảo phần căn của khung** (X-01, PTA đề xuất, chủ SP phủ quyết được).

### 6.3 Hàng · đường cơ sở · dải nền · công cụ · nhóm

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| `vertical-align: baseline` cho mọi ô: dòng chính mọi ô cùng hàng chung đường cơ sở; chữ phụ **chỉ dưới** dòng chính. Không đặt `align-top` trên `<tr>` (vô tác dụng, `ClassRoster.tsx:240`). | Nay số cùng hàng lệch 7–20 px (ô 1–3 dòng + căn giữa dọc) | 11.1a R4, 4c | PTA đề xuất |
| Tối đa **một** dải nền nhấn mỗi bảng (Kỳ vọng + Overall); cột tính sẵn (W) nền xám; tiêu đề cùng nền với cột. | Mắt so ngay; không loang màu | m6 §3; V2B-1 4d | ĐÃ CHỐT (m6 §3) |
| **Công cụ ngoài khung bảng**, một hàng: trái phạm vi (tab lượt / tuần) · giữa lọc ("Chỉ ô còn trống") · phải thao tác (GV chấm S ▾ · Dán từ Excel [chỉ lưới theo lượt] · ⓘ · Xuất). Không chen giữa viền và tiêu đề. | Nay "Dán từ Excel · ?" và "GV chấm S" nằm trong khung (R5) | 11.1a R5; V2B-1 4e; 12.3 | PTA đề xuất · Excel chỉ theo lớp × lượt ĐÃ CHỐT (V3 I.5) |
| **Cấm điều khiển trong tiêu đề** (`th` không chứa `input`, `button`, `select` — trừ nút sắp xếp nếu có). | Ô "tổng [25] Điền cả cột" lệch ≈ 86 px so ô nó điều khiển | V3A-7 (b); 12.1 | PTA đề xuất |
| Hàng nhóm 40 px, 15 / 700, vạch trái 3 px **màu trung tính** `--line-strong` (khi mở) / mờ hơn (khi đóng); cả hàng là vùng bấm (HTT-4). Hàng con thụt 16 px, nền `--hang-con-bg`. Một hàng mở rộng một lúc. | Vạch trái nhấn sẽ trùng "đang chọn" mới (HTT-6) | v4c HTT-6; V2B-1 4f | PTA đề xuất (đảo DESIGN.md "vạch trái màu nhấn"; giữ vạch 3 px — 9.2-37) |
| Ô trống: "—" = không áp dụng · để trống = chưa có. Số 0 trơn, không bấm. | Nay 6 cách ("—", "–", "chưa có", "không có", "0", trống) | X7; C02 | Số 0 không bấm ĐÃ CHỐT (C02) · ô trống = PTA đề xuất |
| Bảng **không bấm được** không hover; bảng ≥ 8 cột có ô bấm bên trong được "dò hàng" `--phu-do` 3,5 %. | 29/35 loại hàng có hover mà không bấm được | v1 C1; 10.7-9 | PTA đề xuất |
| Phân trang 10 / 20 / 50, thanh ở đầu + cuối bảng; **không** áp cho lưới nhập điểm, hàng đợi. Đếm toàn bộ trước khi chia trang. | — | 19/10-M6; m6 §7; A3-02 | ĐÃ CHỐT (19/10-M6) |

### 6.4 375 thành thẻ từ cùng định nghĩa cột

`Bang` tự đổi sang `TheDong` ở < 640 px: dòng 1 = cột `ten` + `chip`; dòng 2 = các cột `diem` trong **lưới 4–5 ô cố định** ("L ✓ 7.0 · R ✓ 7.0 · W ✓ 7.0 · S ✗ 5.0" — không bao giờ tách "W" và "7.0" ra hai dòng); dòng 3 = `viec` + nút 44 px. Lưới **nhập** điểm ở 375 dùng `MotKyNang` (một kỹ năng, ô 44 px, "Lưu · em tiếp"). Nguồn: V2B-1 4g; 12.1. PTA đề xuất.

### 6.5 Phép kiểm bảng

| Mã | Ở đâu | Kiểm |
|---|---|---|
| BANG-1 | `server/src/tests/bang.tests.ts` (chạy trong `npm run check`) | `index.css` không còn bộ chọn căn theo tên lớp tiện ích |
| BANG-2 | như trên | `<td` / `<th` trong `web/src/modules/**` không mang `text-left` / `text-center` / `text-right`; `th` không chứa ô nhập / nút; danh sách tệp miễn **chỉ được giảm** |
| BANG-3 | như trên | `<table` chỉ trong `ui/Bang.tsx` (+ danh sách miễn giảm dần) |
| BANG-4 | như trên | tệp bảng không dùng `text-[11px]`, `text-[11.5px]`, `text-[12.5px]`; cỡ chữ trong ô ∈ {12, 13, 14, 15} |
| BANG-5 | như trên | cột `so` / `diem` / `noi-bat` / `diem-ti-le` / `phan-tram` có rộng px (không %) |
| `do-bang` | `scripts/do-bang.mjs` (từ `NEW\chup\v2b-do-bang.mjs`), gọi trong `do-khung`; bắt buộc trước PR giao diện | mọi cột ≥ 3 ô: \|lệch theo kiểu căn\| ≤ **2 px**; số cùng cột lệch mép ≤ 1 px; lệch đường cơ sở trong hàng ≤ **2 px**; cao hàng ∈ {44, 64} ± 1; không ô tràn; cỡ chữ ∈ thang; **"đè nhau"** (giao > 2 px giữa hai phần tử bấm được); **"tiêu đề có điều khiển"**; ghép tiêu đề `rowSpan` (nhóm 2 tầng); ở 1 440, 1 280, 375; bỏ `BO_QUA_CAT` cho lưới chấm |

Nguồn: V2B-1 4i; V3A-7; 12.1. Phép kiểm cũ đọc **chuỗi mã** của tệp bảng (~100, R6) viết lại theo hành vi hoặc gỡ khi tệp chuyển sang `Bang`. Đối chứng: bảng đang 0 lệch (Kết quả thi, Báo cáo, Hồ sơ GV, Quản trị, Mock hồ sơ HV, Tutor) dùng làm bảng mẫu. PTA đề xuất.

---

## 7. Ô điểm `ODiem`

| Biến thể | Cấu trúc | Kích thước | Dùng ở |
|---|---|---|---|
| `doc` (chỉ đọc) | `[ký hiệu 14][4 px][số 15 / 700 tabular]` chữ trơn, không viền; chỗ ký hiệu giữ khi không có ký hiệu | khung rộng cố định **56 px** | bảng xem, ô của người khác / đã khoá |
| `sua` (sửa được) | hộp viền `--o-sua-vien`, nền `--o-sua-nen`, bo 6; trống = **viền đứt** (m6 `.o-can`); ô trống không phải của tôi = để trống; bấm hoặc gõ số → **hộp chấm** neo tại ô (bậc 2a); dấu lưu ở **góc trên phải**, không đổi chiều cao | **64 × 32 px** (375: 44 cao, 16 px) | lưới nhập điểm |
| `ti-le` | `[✓/✗ 14][số đúng 15 / 700, 2 ch căn phải]["/25" 13 / 400 faint, 3 ch căn trái]` — căn theo "/" | cột **88 px** | Test lớp thường, Checkpoint, Pre FOU |
| `lon` | cùng ký hiệu / màu, số 28 (375: 26) | — | thẻ hồ sơ Mock (`ODiemLon` giữ cỡ riêng) |

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Một** dòng phụ 12 px, cách hộp 4 px, căn cùng mép số; ưu tiên (chỉ hiện một): **"thiếu nhận xét"** (việc) > "vắng lần n" > "n câu". Hàng có dòng phụ → cả hàng 64 px, đường cơ sở dòng chính vẫn chung. Chuỗi dài hơn cột → dạng ngắn trong từ điển chữ (đo ở sân mẫu; tràn thì nới cột `diem` 88 px). | Nay ô 1–3 dòng ("30 câu" khe 1 px đáy hộp; dòng 3 "thiếu nhận xét") | V2B-2; 11.8-14 | PTA đề xuất |
| Ký hiệu W1 / W2 có ✓ / ✗ như L / R / S. | m6 §3; Case tách W1 / W2 (Rulebook §19) | m6 §3; 11.8-14 | ĐÃ CHỐT (m6 §3) |
| Trạng thái lưu của ô theo HTT-10: đang lưu = đồng hồ xám · đã lưu = dấu lưu **xám** (ẩn sau 2 s, **không** "✓" xanh lá — trùng ✓ vượt kỳ vọng) · lỗi = viền đỏ + "Lưu lại". | "✓ Đã lưu" xanh 11 px nay nằm trong ô điểm (E1) | v1 E1; HTT-10; V4C-11 | PTA đề xuất |
| Ô đang gõ không tô; trình đọc màn: `aria-label` "L 6.0 — dưới kỳ vọng 6.5". | Chưa lưu chưa là kết quả; ký hiệu SVG cần tên | v1 B2; mục 17 | PTA đề xuất |
| **Hộp chấm một mẫu** (FT + lớp thường, `HopNhapDiem` nhánh "đúng / tổng"): đầu "G+V · Lưu Bảo Ngân" + phụ "Progress · thi W2 SEP · hạn 16/09"; "Đúng [17] / [25] · 68 % · chưa đạt (cần 70 %)"; **"Nhận xét (tuỳ chọn)"** (lớp thường) / bắt buộc ≥ 10 ký tự + nhóm nguyên nhân (MT dưới kỳ vọng); "＋ Lý do sửa" gập (chỉ khi sửa điểm đã có); chân: Vắng · Thêm ▾ (Lịch sử · Huỷ điểm · Khôi phục điểm · Dời hạn · Dời lịch — theo quyền) · Lưu · **Lưu · em tiếp** (Enter). Bỏ nút "Nhận xét", ⋯ trong ô, hộp "Sửa … Lý do" riêng, "tổng [25] Điền cả cột" (thay "/25 ✎" ở tiêu đề). 375: ô to gõ thẳng + "＋ Nhận xét" mở ngay dưới hàng. | ⋯ đè 41 % ô tổng; 3 đường cho một ô; 3 em có nhận xét ~8 bấm, 4 hộp → 1–2 bấm, 1 hộp | 12.1; V3A-6 A; v4b B3 (chữ huỷ / khôi phục) | Nhận xét trong hộp, tuỳ chọn ĐÃ CHỐT (V3 I.2) · cách làm A = PTA đề xuất (đảo HD2 — X-02) · nhãn hạn không thứ ĐÃ CHỐT (19/10-M6, X-18) |
| Có quyền nhập ô thì **sửa được sau khi lưu**, có lịch sử (hộp chấm luôn mở được ô của mình); bỏ khoá R11 "đợt hoàn tất". | Luật 3 | L3; PTA-v4-4; V4B-04 | ĐÃ CHỐT (L3) |

---

## 8. Ô số bấm được `OSo` + luật "một nghĩa một dáng"

### 8.1 `OSo`

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Số bấm được nằm trong **ô viền 1 px** `--line-strong`, bo 6, đệm 2 × 8, rộng ≥ 28 px, số 15 / 600 tabular. Rê chuột: phủ `--phu-re` + viền `--accent`. Focus: vòng 2 px. **Đang mở panel từ số này** = nền `--accent-soft` + viền `--accent` (cùng họ HTT-6). Vùng bấm ≥ 24 × 24 (1440) / 44 × 44 (375) bằng `::after`, không đổi bố cục. | Gạch chấm mang 4 nghĩa, vùng bấm = chữ số 8 × 12 px; khớp m3 khung 3, 4 và mT m2 | V3B-01 P1; 12.4; B-02 | Bỏ gạch chấm ĐÃ CHỐT (V3 II.1.1) · `OSo` = PTA đề xuất (12.9-12) |
| Số lớn ở thẻ báo cáo: **cả ô (số + nhãn) là nút** ("68 HV đã thi"). Chip SOS / chip kết quả **chính nó là nút** (không thêm khung). **Số chỉ xem để trơn** (không viền, không hover). Số 0 không viền, không bấm. | Một tín hiệu bấm; bảng dày không thành lưới ô viền | V3B-01; C02 | PTA đề xuất · số 0 ĐÃ CHỐT (C02) |
| Bảng dày (Test + SOS 14 cột số): chỉ số **có việc hoặc có danh sách giá trị mới** bấm được (~8 cột thay 14). | Tránh "dày mắt" | V3B-01 mục 6 | PTA đề xuất |
| Luật chọn đích theo bản chất số **L1**: số **trong kỳ** → panel **A** (thông tin cụ thể) · số **hiện tại = việc đang chờ** → panel **C** (thông tin + nút làm) · số tổng / tiến độ để so → **0 chỉ xem** · số mà trang chuyên có bộ lọc đúng → **D đổi trang giữ đủ lọc** (lớp, tuần, tab, em). Bấm phải ra **đúng tập tạo nên con số**. | 9 chỗ sai ngữ cảnh; panel chỉ ra tên | V3B-02; 12.4; MP IX.2 | Đúng dữ liệu / ngữ cảnh ĐÃ CHỐT (V3 II.1.3) · L1 = PTA đề xuất (12.9-13) |
| `OSo` thay `SoLieuO`, `SoO`, ô số Phân tích GV, nút Mock của Báo cáo; nhận `loai` ∈ A · B · C · D chỉ để đặt `aria-haspopup` / `aria-expanded`. | Một thành phần | V3B-01 mục 7 | PTA đề xuất |

### 8.2 Một nghĩa — một dáng (mọi thứ bấm được)

| Dáng | Nghĩa duy nhất | Ví dụ | Cấm |
|---|---|---|---|
| **Ô số** (`OSo`) | mở tại chỗ / mở panel (A, B, C) | "SOS 2 · 3", "⚠ 4" | dùng để đổi trang |
| **Chữ + "›"** (link chữ, không nền, không viền) | **đổi trang**, giữ đủ lọc | "Xem cả danh sách ở Học viên & Lớp › Đang SOS ›", "Báo cáo ›", "Mở hồ sơ MT3 ›" | dùng con số làm link đổi trang; đặt "›" trong nút |
| **"↗" sau tên đối tượng** | mở **hồ sơ** đối tượng (em, lớp, GV) ở đúng tab | "Lý Minh Châu ↗" | dùng cho nút làm việc |
| **ⓘ** (`NutGiaiThich`) | chỉ **giải thích** (hộp neo: tiêu đề → kết luận đậm → số → việc có thể làm) | "Cách tính" cạnh ô số tổng, chỗ dán Excel, tên cột | gạch chấm dưới tên cột / "KCK" / "Thiếu n"; ⓘ cạnh chip SOS (bấm chip là đủ) |
| **Chip lọc có số** (`BoLocDoan`) | lọc tại chỗ | "Cần làm 8 · Tất cả 33" | mở panel |
| **Nút có động từ** | làm việc | "Thêm PA", "Duyệt", "Lưu kết quả" | nhãn chung "Mở", "OK" |
| **▸ / ▾** | mở / gập ngay tại chỗ | hàng nhóm, "n đã xử lý ▾" | đổi trang |
| Cả **dòng danh sách** có khung phải | chọn → mở chi tiết ở khung phải (không cần ký hiệu cuối dòng; hover + đang chọn đủ báo); dòng sẽ đổi trang thì vùng cuối hiện "↗" | dòng việc | hai nút trên một dòng |

Nguồn: V3B-01 "luật đi kèm"; 12.4; V4A-01 (3 vùng dòng việc); CLAUDE.md 11/10-UX "tách nút làm việc với link xem hồ sơ"; m6 §1 (bỏ ? cạnh chip SOS). Trạng thái: PTA đề xuất (12.9-12) — gồm: **"›" chỉ cho link chữ đổi trang** (đảo v4a "› cuối dòng = mở khung phải" và 10.2 "Duyệt ›"); **bỏ "›" khỏi nhãn nút** ("Lưu · em tiếp", "Việc kế" — đảo chữ m2 khung 1f, m6 khung 3); **ⓘ thay "?"** cho nút giải thích (C04 giữ hành vi, m1 §1g đổi ký hiệu). Xem mục 21, 22.

---

## 9. Panel

### 9.1 Khuôn 6 phần của panel việc (nội dung theo loại việc, khuôn chung)

```
┌─① ĐẦU (dính) ───────────────────────────────────────────────────┐
│ Kết quả PA · Reading                       ⚠ quá hạn 6 ngày   ✕ │  17/700 · MỘT chip hạn · tên = tên dòng (một hàm)
│ Lý Minh Châu ↗ · MB FT 101 ↗ · SOS 1 · MT2                      │  14/400 · em / lớp là link xem (↗), tách nút làm
│ Việc 2/5 trong "Case học thuật" · ‹ ›                            │  13 · chỉ khi đi theo hàng đợi
├─② BỐI CẢNH (≤ 3 dòng, TRƯỚC form) ───────────────────────────────┤
│ PA        Xếp tự học Reading · từ W4 AUG · Trần Ngọc Hà         │  nhãn 13/400 dim, cột 112 px; giá trị 14
│ Lần trước 28/08 · Tiến bộ một phần · Xem thêm ▾                  │
├─③ CẦN LÀM (khối duy nhất có nền nhấn nhạt) ─────────────────────┤
│ Tiến triển (2 tuần) *     [Tiến bộ rõ][Một phần][Không]…         │  nhãn 13/600, ô 15; 16 px giữa trường
│ Nhận xét *                [……………………………]  0/8                    │
├─④ LỊCH SỬ (gập) ─────────────────────────────────────────────────┤
│ Lịch sử · 2 lần ▾  (ai · lúc nào · trước → sau)                  │  luật 3 — chỉ với dữ liệu sửa được
├─⑤ CHÂN (dính đáy) ───────────────────────────────────────────────┤
│ trạng thái lưu (HTT-10)          Điều chỉnh / Kết thúc…  [Lưu kết quả] │  phụ = chữ · MỘT nút chính
└─⑥ SAU LƯU / NGƯỜI KHÁC ĐÃ LÀM ───────────────────────────────────┘
  "✓ Đã lưu · Hoàn tác" 10 s rồi "Việc kế"; không tự nhảy khi còn chữ đang gõ
  "Việc này đã được Trần Ngọc Hà làm lúc 09:12 — Xem · Việc kế"
```

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Thang chữ panel 17 · 15 · 14 · 13 · (12 chú thích); không IN HOA; line-height ≥ 1,5 cho chữ ≥ 13; khoảng 24 / 16 / 8. Bối cảnh ② luôn **trước** khối ③ (nay "Nguyên nhân", "Phương án" nằm dưới nút Lưu). | Panel "chữ díu": nhãn 11,5 / 700 trên giá trị 14; 4–7 cỡ / panel; khoảng dọc 0 px ở 4 panel | V4A-03 | PTA đề xuất |
| Tên đầu panel = tên dòng (một hàm `tenViec`); nay 9/18 panel khác nghĩa ("Kết quả cuối", "Sửa thông tin", "Case Reading"). | Người dùng biết đang làm việc nào | CV-13; V4A-03 | PTA đề xuất |
| Lịch sử ④ gập cho mọi dữ liệu sửa được sau lưu (ai · lúc · trước → sau · lý do); một thành phần `LichSu` (C22). | Luật 3; nay chỉ Case + Bước tiếp có lịch sử trong panel | L3; C22; V4B-06 | Có lịch sử ĐÃ CHỐT (L3, C22) · đặt ở ④ = PTA đề xuất |
| Một đầu panel duy nhất (v3, 17 px, 2 dòng); bỏ 44 đầu cũ 52 px / 14 px. | Một menu ⋯ hồ sơ HV mở 2 dáng đầu | V4C-13; V4A-04 | PTA đề xuất |

### 9.2 Vỏ "Khung việc" gắn thang làm tại chỗ 0–5

| Bậc | Dáng | Khi nào | Ví dụ đích |
|---|---|---|---|
| 0 | Chỉ xem (số / chữ trơn) | số để quan sát; vai không có việc | tổng "Cả Monbay" |
| 1 | Nút trên dòng / trong chi tiết + **Hoàn tác 10 s** | 0 ô, đảo được, bối cảnh đã thấy | Duyệt, Xác nhận PA theo quy chế, Đánh dấu đã báo PH |
| 2a | **Hộp neo** ≤ 360 px (đầu 1 dòng · ô · Huỷ / nút chính); 375 = tấm dưới đáy | 1–2 ô ngắn | Gia hạn, Phân công GV môn, Chốt ngày thi, Dời tháng, Từ chối (lý do), hộp chấm |
| 2b | **Mở dưới hàng** — CHỈ ở bảng rộng hết trang không có khung phải; đầu hàng giữ nguyên, vùng mở thẳng cột 1; ✕ / Esc / bấm lại hàng = thu; `aria-expanded` + `aria-controls`; focus vào ô đầu | ≤ 4 ô, bối cảnh có trên hàng | Thêm PA dưới dòng em (Lớp cần chú ý, Đang SOS), Lịch thi, Ý thức lớp A, Phối hợp SOS |
| 3 | **Khung chi tiết** — trong hàng đợi = cột phải dính; mở từ số / chip / nút đầu trang = ngăn phải **560** (form) / **720** (`PanelChiSo`, bảng ≤ 6 cột) — **cùng vỏ**, chỉ khác chỗ đặt. 375 = toàn màn + "‹ Quay lại", nút chính dính đáy | 3–6 ô hoặc cần bối cảnh; làm tuần tự | mọi việc của hàng đợi; `PanelChiSo`; panel một em; "Lộ trình tiếp theo" một em (V4C-07) |
| 4 | **Panel rộng** thay khung phải (≤ 1 440, không phủ thanh trên, không chồng) | bảng nhiều em của một lớp / lượt | Chốt lộ trình, Nhập điểm cả lớp (lối ngoài hồ sơ lớp), Bàn giao |
| 5 | Trang riêng | xem hồ sơ (↗); không gian lớn | hồ sơ HV / lớp / MT, Kế hoạch Test |
| — | Modal giữa màn | **chỉ** xác nhận hậu quả lớn, nêu đúng đối tượng (`ConfirmDialog`) | Xoá, đổi phân công cả lớp, Kết thúc học |

| Luật kèm | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Một danh sách một kiểu mở:** danh sách có khung phải → mọi dòng mở ở khung phải; bảng rộng không khung phải → mở dưới hàng (2b); việc cần bảng nhiều em → bậc 4; đổi trang chỉ để xem (↗). Danh sách hẹp **không** mở rộng tại dòng. | Nay 5 kiểu mở trong một danh sách; mở dưới dòng che tiêu đề (lưới `0px 494px`, ảnh v4-1, v4-3) | V4A-01, V4A-06; X-39 | PTA đề xuất (bỏ "ghi nhanh dưới dòng" ở Công việc — đảo khung OV-13 §1) |
| Mở cái mới **thay** cái cũ; **không** ngăn phủ trong khung / ngăn (hộp neo trong khung thì được); `[role=dialog]` ≤ 1 + hộp neo. | Panel chồng panel (Phân công, Gia hạn) | 11/10-UX; CV-19; V4A-04 | ĐÃ CHỐT (11/10-UX "không panel lồng panel") |
| Trạng thái nằm trên URL (`viec=`, `so=`, `dong=`) → Quay lại / Lùi trình duyệt mở lại đúng dòng; Esc đóng lớp trên cùng, focus trả về phần tử mở nó. | Quay lại về đúng nguồn | 11/10-UX; A5-15 | ĐÃ CHỐT (11/10-UX) · URL = PTA đề xuất |
| Nút làm ≠ link xem (↗); panel biết "đang ở hồ sơ em này" → ẩn "Mở hồ sơ" trùng trang. | Bấm "Mở hồ sơ" tải lại chính trang (V4C-14) | 11/10-UX; V4C-14 | ĐÃ CHỐT (11/10-UX) |
| Nút trong panel chỉ hiện khi máy chủ cho làm, theo **loại việc** (sửa gốc "Phân công…" sai case — V4A-05: dùng trường `thieuNguoi` từ máy chủ, không đoán ở web). | Giao diện theo vai đi cùng quyền máy chủ | 13/10-VAI; V4A-05 | ĐÃ CHỐT (13/10-VAI) · sửa gốc bằng `thieuNguoi` = PTA đề xuất (02 MP-22); tự gán chủ Case theo phân công là đề xuất nghiệp vụ của V4A-05 — PTA Plan xếp ở 05 |

### 9.3 `PanelChiSo` (panel C / A — từ chỉ số)

| Quy tắc | Nguồn | Trạng thái |
|---|---|---|
| Tiêu đề = **chỉ số · phạm vi · đúng số vừa bấm** ("SOS 2 · MB FT 101 · W1 + W2 SEP · 3 HV"); một dòng định nghĩa + ⓘ "Cách tính"; chip lọc trạng thái việc có số; bảng **≤ 6 cột, không cuộn ngang** (điểm gộp "R 5.5/6.0 · thiếu 0.5"); nhóm khi > 1 nhóm; **một nút động từ / dòng theo quyền** (không quyền → chữ tình trạng); việc ngắn → form dưới dòng (2b), việc dài → thay nội dung panel + "‹ Danh sách (3)"; tên em "↗" mở hồ sơ **đúng tab**; chân "Xem cả danh sách ở … ›" (D, đúng lọc). | V3B-03; 12.4 | PTA đề xuất (12.9-13; cần mockup) |
| **Số = dòng:** số tiêu đề = số vừa bấm = số dòng (cùng hàm); dòng làm xong **ở lại** (mờ, "✓ Xong") tới khi đóng panel; panel trên URL; 375 toàn màn, dòng thành thẻ 2 dòng. A = cùng vỏ, không cột Việc, không chip trạng thái. Máy chủ: mỗi nguồn trả **cột theo loại số** (thay `rowsFor` chỉ tên — `metrics.ts:191-205`). | V3B-03 | PTA đề xuất |
| Đếm: SOS 2 của một lớp (2 em, thêm PA) **14 bấm + 2 đổi trang → 7 bấm, 0 đổi trang**; bài quá hạn của một GV **4–5 bấm + 2 đổi trang → 2 bấm**. | V3B-03 mục 6 | — |

### 9.4 Mười một thành phần chung của panel (một mẫu mỗi cái, không ép một mẫu cứng cả panel)

`DauViec` (tên + chip hạn + đối tượng) · `KhoiDoiTuong` (em ↗ + `ChipSos` + lớp ↗ + đợt) · `BoiCanh` · `CanLam` · `ODiem` · `ChipSos` · `ChipHan` · `TrangThaiLuu` · `NutChinh` / `NutChu` · `LichSu` (gập) · `HangDoiViec` (danh sách + khung + tự sang việc kế **cùng nhóm, của chính tôi, đang hiện** + Hoàn tác + giữ dòng xong). Nguồn: V4A-04; m2 khung 1e. PTA đề xuất (tự sang việc kế cùng nhóm ĐÃ CHỐT — m2 khung 1e, 9.2-8).

---

## 10. Badge · chip

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Chip cao 24 (375: 28), chữ 13 / 600. Hai họ: **chip tròn** (pill) cho trạng thái / số đếm; **chip vuông** (bo 6, có viền) cho mã (kỹ năng, tuần). Chip không bao giờ trông như nút trừ khi bấm được (chip SOS, chip lọc). | Nay 11,5 px cao 18 — nhỏ nhất hệ; chip vuông "L R W S" trông như nút | v1 A2, C1; DESIGN.md Shapes | PTA đề xuất (cỡ) · hai họ ĐÃ CHỐT (DESIGN.md) |
| **Chip SOS = MỘT component** `ChipSos` mọi màn ("SOS 2 · R, W", "SOS 3 tạm"); bấm chip = hộp "Vì sao SOS n" (tiêu đề → kết luận đậm → số → việc); không ⓘ / ? cạnh chip. | Nay 4 dáng; kỹ năng lúc trong lúc ngoài | C08; 19/10-M6; m6 §1; X7 | ĐÃ CHỐT (C08, 19/10-M6, m6 §1) |
| **Chip trạng thái** (`Nhan`) trung tính `--muted` cho mọi trạng thái thường (nghĩa 5); chữ luôn đủ nghĩa khi bỏ màu. Bỏ chip "Bình thường", chip "Đang làm" (đã có "1/2"), chip "Đã hoàn tất" dưới tên (→ ký hiệu "✓" sau tên, chữ "Đủ điểm"). | Ít chip, mỗi chip có nghĩa | CV-28; V2B-7; V3A-9; v4b B3 | PTA đề xuất |
| **Không chip nền cho quá hạn** (chữ + ⚠). | 17/10-PL | m1 §1c | ĐÃ CHỐT |
| Chip **Đã thi** "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp" (chữ `--ok` trên nền thẻ) — đi cùng nền hàng đã thi. | m1 §1d | m1 §1d | ĐÃ CHỐT |
| Chip **Lịch thi thật**: **A** "Thi 21/11 · còn 9 ngày" họ màu "đã thi" + biểu tượng lịch ✓ · **B** "Chưa chốt ngày thi · 11/2026" **viền đứt, trung tính** + ◌ · Dự kiến chữ thường · Chưa có chữ mờ. Không lẫn màu SOS / kết quả. | Trạng thái riêng đã chốt; giao diện tự do | V2 I.6.3; 11.2 | Trạng thái ĐÃ CHỐT (V2 I.6.3) · dáng = PTA đề xuất · biên luật → Q-C3 |
| **Badge số đếm** (menu, tab, nhóm): 12 / 700, nền `--muted-bg`, cao 18; badge menu một nghĩa theo vai (GV: việc của tôi quá hạn + hôm nay; QL: số ở Tổng quan). Badge giữ tổng mọi chi nhánh thì ghi "mọi chi nhánh". | Một số một nghĩa | X-03; V4A-02; A1-13 | PTA đề xuất · nghĩa badge QL theo Q-A1 |
| Chip lọc có số: dáng `BoLocDoan` (HTT-5); chip đang lọc ở dải lọc có ✕ + "Bỏ lọc". | C10 | C10; m1 §2b | ĐÃ CHỐT (C10) |
| Chip ô Kế hoạch Test: 2 dòng "W1 JUL / Đã làm bài", "Chưa xếp" viền đứt, L/R và W/S tách dòng khi tách tuần; năm chỉ ở đầu cột / khi khác năm. | m4 §1; Thi ↔ Test | m4 §1; X-17; X-37 | Khung ĐÃ CHỐT (m4) · chữ "Đã làm bài" ĐÃ CHỐT hướng (V2 I.5) · năm = PTA đề xuất (đảo C20) |

---

## 11. Nút

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Nút chính** `.btn-primary`: nền `--accent`, chữ `--accent-ink` 15 / 600, cao 40 (375: 44). **Một nút chính mỗi vùng** (đầu trang · chân panel · hộp · dòng). | Mắt biết ngay việc chính | impeccable operate; V2B-7 (9 nút "Xác nhận" nhấn cùng màu) | PTA đề xuất |
| **Nút phụ** `.btn`: nền `--surface-2`, viền `--line-strong`; hover `--phu-re` + viền `--accent-line` (nay ΔL 3,2 — mờ). **Nút chữ** (`.btn-ghost` / link động từ): không nền, cho thao tác phụ trong chân ("Điều chỉnh / Kết thúc…"). **Nút nguy hiểm** `.btn-danger`: chỉ cho thao tác mất dữ liệu, luôn kèm `ConfirmDialog` nêu đúng đối tượng **hoặc** Hoàn tác 10 s. | Ba cấp rõ | DESIGN.md Components; v1 C1 | PTA đề xuất |
| **Nút nhỏ** `.btn-sm` 13 / 600, cao 32 (375: 44); vùng bấm ≥ 24 × 24. | Nay `.btn-sm` 12 px ở 315 chỗ | v1 A2 | PTA đề xuất |
| **Nhãn = động từ (+ đối tượng)**, 1–3 từ: "Lưu kết quả", "Thêm PA", "Duyệt", "Từ chối…" ("…" khi mở hộp hỏi thêm). Không "Mở", "OK" chung chung; "Mở" chỉ cho xem và kèm ↗. Không "›" trong nút. Cùng thao tác cùng chữ (`CHU_THAO_TAC`). | "Mở" nay vừa làm vừa xem; "✕" hai nghĩa (A7-27, A7-28) | DESIGN.md Do's; CLAUDE.md; mục 8.2 | ĐÃ CHỐT (DESIGN.md cùng chữ) · bỏ "›" trong nút = PTA đề xuất |
| Thứ tự trong chân / hộp: trái = trạng thái lưu; phải = nút chữ phụ → **nút chính ngoài cùng phải**; Huỷ / Đóng là nút chữ. | Cùng vị trí cùng loại thao tác | 11/10-UX; V4A-03 ⑤ | ĐÃ CHỐT (11/10-UX "cùng vị trí, thứ tự") |
| Nút tắt: mờ 45 % + `not-allowed` + **lý do** (`title` hoặc dòng chữ cạnh) + bước tiếp nếu có. | Bị chặn thì nói lý do | CLAUDE.md; HTT-8 | ĐÃ CHỐT (CLAUDE.md) |
| Nút chính trang Tutor = **"Thêm tutor"**, "Tải danh sách" là phụ. | Việc thường gặp hơn | X-34; 9.2-34 | PTA đề xuất (đảo mT khung 2) |

---

## 12. Trạng thái tương tác — hệ HTT-1…12

| Mã | Trạng thái | Luật | Token / số |
|---|---|---|---|
| HTT-1 | **Rê chuột** (thứ bấm được) | lớp phủ `background-image` lên **từng ô / chính phần tử** (thắng nền riêng của cột dính, hàng con, hàng đã thi) + `cursor:pointer`; 375 dùng cùng phủ cho `:active` | `--phu-re` 8 % tối / 9 % sáng → ΔL ≥ 5,8 mọi nền (lớn hơn một bậc cấp 4,2–4,4) |
| HTT-2 | **Không bấm được** | không hover, con trỏ mặc định; bảng ≥ 8 cột có ô bấm bên trong: "dò hàng" | `--phu-do` 3,5 % |
| HTT-3 | **Focus phím** | vòng 2 px `--accent` **ngoài**, cách 2 px (giữ `index.css:144`); dòng / hàng bấm được: `:focus-within` vòng quanh **cả dòng**; vùng dính (thanh trên + dải lọc) không che focus (`scroll-padding-top`) | ≥ 3:1 |
| HTT-4 | Hàng nhóm / đầu khối bấm được | nhận HTT-1; cả hàng là vùng bấm; nút mũi tên ≥ 24 px | — |
| HTT-5 | **Chọn một trong nhóm** (nút đoạn, chip lọc, chip lựa chọn) | **một dáng**: nền `--accent-soft` + viền trong 1 px `--accent` + "✓" đứng trước chữ | thay `PhanDoan` (huy hiệu ✓ góc bị cắt), `.nut-loc` đang lọc |
| HTT-6 | **Đang chọn / đang mở** (dòng, hàng, ô số nguồn của panel đang mở) | nền `--accent-soft` + **vạch trái 3 px** `--accent-strong`; **không** viền trong 2 px (trùng vòng focus); hàng đã thi đang chọn: giữ nền đã thi, vạch trái đổi sang `--accent-strong` | thay `.row-active` |
| HTT-7 | Mở / gập | mũi tên xoay + `aria-expanded` (+ `aria-controls`); hàng nguồn nhận HTT-6 | — |
| HTT-8 | Tắt | mờ 45 % + `not-allowed` + **lý do** | giữ `.btn:disabled` |
| HTT-9 | Rỗng · đang tải · lỗi tải · không tìm thấy | **Rỗng** = tiêu đề + 1 câu + nút bước tiếp nếu có, theo vai ("✓ Không còn việc tuần này · việc sau 3 ▸") · **Đang tải** = `.skel` theo khung nội dung (tôn trọng giảm chuyển động) · **Lỗi tải** = chỉ che **vùng** lỗi, giữ đầu trang + bộ lọc, toast "Thử lại" (chỉ khi mạng / 5xx); tải lại nền lỗi giữ dữ liệu cũ · **Không tìm thấy** = mẫu "Trang không mở được": nói rõ (không tồn tại / đã xoá / ngoài phạm vi / đường sai) + **một nút về đúng nơi**, không "Thử lại" | — |
| HTT-10 | **Một cách báo lưu:** nháp · đang lưu · đã lưu · lỗi lưu · đã chốt | ô: đồng hồ xám → dấu lưu **xám** (ẩn 2 s) · lỗi: viền đỏ + "Lưu lại" · form / panel: dòng trạng thái ở chân trái (nút chính bên phải): "Bản nháp · chưa lưu" / "Đang lưu…" / "✓ Đã lưu 14:32 · Hoàn tác" (xám) / "⚠ Chưa lưu được — mất kết nối · Thử lại" / "Đã chốt 12/09 · Mở chốt"; không báo "Đã lưu" khi còn chữ gõ sau lần lưu; không mất chữ đang gõ | bỏ "✓" xanh lá cho đã lưu |
| HTT-11 | **Vừa xong** (hàng đợi) | dòng mờ 55 % + gạch + "✓ Xong · Hoàn tác 10 s", đứng yên tới khi rời; dòng xong trong `PanelChiSo` ở lại tới khi đóng | giữ OV-5a |
| HTT-12 | **Người khác đã xử lý / hỏi trước khi mất dữ liệu** | tải lại thấy khác bản đang mở → "Việc này đã được ‹tên› làm lúc ‹giờ› — Xem · Việc kế" (dòng mờ + chữ) · đóng panel đang sửa → `ConfirmDialog` của web nêu đúng thứ sẽ mất; **không** `window.confirm` | — |

| Quy tắc kèm | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Hoàn tác **10 s** thay hộp hỏi cho thao tác đảo được (bỏ vắng, xoá nhận xét, gia hạn, Duyệt); hộp hỏi chỉ cho việc không đảo được, nêu đúng đối tượng. **Không** Hoàn tác cho lần xử lý vi phạm đã lưu (thu hồi phải qua QL, lý do bắt buộc). | Xác nhận chỉ khi hậu quả lớn | m1 §1f; X-47; X-51; 21/10-YT | Hoàn tác ĐÃ CHỐT (m1 §1f, 9.1-1) · ngoại lệ vi phạm ĐÃ CHỐT (21/10) |
| "Đã tích" (chọn nhiều để làm hàng loạt) = **chỉ** ô tích có dấu ✓ (không tô nền) — để không trùng HTT-6. | Hai dáng chọn là đủ | v1 C2 (đổi); HTT-5/6 | PTA đề xuất |
| Thực hiện: 3 lớp CSS dùng chung `.bam` (HTT-1 + `:active`), `.do-hang` (HTT-2), `.dang-mo` (HTT-6) thay `.row-hover` (31 tệp), `hover:bg-white/5` (21 chỗ), `.row-active`; hàng nhóm vạch trái → `--line-strong`. | Một token, một luật | v1 C2; HTT | PTA đề xuất |
| Mọi thành phần bấm được có đủ: mặc định · hover · focus · active · tắt · tải · lỗi. | impeccable operate "Don't ship with half of these" | impeccable `operate.md` | PTA đề xuất |

Nguồn hệ: 10.1 (hover + trạng thái); v1 C2; V4C-02, V4C-04, V4C-10, V4C-11; HTT-1…12 (v4c §3.3); m1 §1d, §1f. Trạng thái: rà hover toàn web ĐÃ CHỐT (V1 II.6) · hệ HTT = PTA đề xuất · **"đang chọn" HTT-6 = PTA-v4-9 (đảo m1 §1d "viền khung 2 px", DESIGN.md, 02 X-19 cũ)**.

---

## 13. Ô nhập

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Ô nhập: cao 40 (375: 44), chữ 15 (375: **16** — Safari không tự phóng to), nhãn 13 / 600 **trên** ô cách 4 px; chữ gợi ý `--text-faint` và **không bị cắt** (`scrollWidth ≤ clientWidth`); lỗi = viền đỏ + câu dưới ô (`Truong loi`) kiểm khi rời ô; Lưu thất bại → tóm tắt lỗi đầu form nhận focus, mỗi mục trỏ về ô. Không câu giải thích dưới ô. | ui-ux-pro-max "Inline Validation", "Focusable Error Summary"; chữ gợi ý cắt "W4 SEP hoặc d" (V4C-05) | DESIGN.md; V4C-05; OV-14b | PTA đề xuất · 16 px ở 375 ĐÃ CHỐT (OV-14b) |
| **Ô ngày** mọi nơi = `ONgay` (ô gõ được + nút lịch); **không** hàng nút "Hôm nay · Hôm qua · 2 ngày trước". | Luật chủ SP 06/10 | 06/10-NGAY; CLAUDE.md | ĐÃ CHỐT (06/10) |
| **Ô nhập tuần** (Thêm HV, Tạo lớp, Chuyển lớp, Chuyển tiếp lớp, Báo cáo đơn vị, Tạm dừng) = **một** `ONgay kieu="tuan"`: gõ "W4 SEP" hoặc mở lịch tuần; **điền sẵn tuần đề xuất**; "Ngay hôm nay" là một lựa chọn trong lịch khi nghiệp vụ cho chuyển giữa tuần (OV-13l, nghĩa không đổi). Bỏ hàng chip "Ngay hôm nay · W4 SEP · W1 OCT…", bậc thang ‹ [W3 SEP] ›, `ChonTuan`. | Nay 4 dáng cho cùng việc trong một luồng | V4C-05; X-20; 9.2-19 | Bỏ hàng nút ĐÃ CHỐT (06/10; 9.2-19 → lệch phải sửa) · một ô tuần = PTA đề xuất |
| **Bộ lọc thời gian = `Khoảng tuần`**: `Thời gian ‹ [W1 SEP ▾] → [W2 SEP ▾] ›  Mặc định` trên dải lọc; đổi là áp (không hộp, không "Áp dụng"); mỗi ô gõ được hoặc mở lịch tuần (`ONgay kieu="tuan"`); chọn ngược tự đổi chỗ; cùng tuần hợp lệ; năm chỉ hiện khi khác năm; ‹ › dời cả khoảng; khoảng trên URL; **giữ khoảng người dùng đã chọn khi đổi tab** (C29); 375 hai ô 44 px. Máy chủ chỉ còn `tu`, `den`; link cũ `kieu=thang` đọc theo tháng chứa thứ Năm tuần đầu (sửa P0). | 14 chỗ, 5 dáng, 9 chế độ; đổi khoảng ở Phân tích 5 thao tác → 1–2 | V2 I.1; 11.1b; X-14 | "Tuần bắt đầu → Tuần kết thúc" ĐÃ CHỐT (V2 I.1, MP III.8) · thành phần = PTA đề xuất |
| **Không hàng nút "Tuần này · Tuần trước · 2 tuần trước"** trong lịch tuần; ‹ › và "Mặc định" đủ. | Luật 06/10 | PTA-v4-8; X-20 | ĐÃ CHỐT (06/10) — đảo khuyến nghị "giữ" của 12.7 / 12.9-17 |
| **"Toàn bộ" CHỈ ở trang Phân tích**: Thời gian [Toàn bộ \| Khoảng tuần] ‹ [W1 SEP ▾] → [W2 SEP ▾] › Mặc định; "Toàn bộ" hiện "Toàn bộ · W4 JUN – W2 SEP" (mã tuần) = từ tuần đầu có dữ liệu của bảng trong phạm vi đang lọc (chọn một lớp = từ khai giảng); cột "So kỳ trước" ẩn khi Toàn bộ. | MP III.8 "riêng trang Phân tích" | MP III.8; V3 II.5; PTA-v4-7; X-06; X-21 | ĐÃ CHỐT (MP III.8) |
| **Mặc định theo bảng Phân tích:** Báo cáo 2 tuần hoàn chỉnh trước (C24) · Test + SOS 8 tuần hoàn chỉnh · Kết quả Test › Mock 4 tuần gồm tuần này · › Thi thật Toàn bộ · Vấn đề & PA Toàn bộ · Phân tích GV 4 tuần hoàn chỉnh (máy chủ ≤ 13 tuần; "Toàn bộ" cần nâng trần — đo tốc độ trước) · Ý thức 4 tuần hoàn chỉnh. Trần 52 tuần ở `khoangThoiGian.ts:17-18`: đo trên DB lớn nhất trước; chậm thì kẹp (vd 104 tuần) và ghi trên nhãn. | Mỗi bảng mặc định theo mục tiêu | 12.7; MP IX.6 | C24 ĐÃ CHỐT · còn lại PTA đề xuất |
| **Ngoài Phân tích** (không có "Toàn bộ"): Tutor + panel tutor `Khoảng tuần` mặc định **4 tuần gồm tuần này** (panel dùng khoảng của trang — bỏ bộ chọn thứ hai) · panel Xuất = khoảng của trang gọi · **Bộ lọc thêm › "Thời gian"**: để trống = không lọc, có ✕ xoá lọc (không phải chế độ "Toàn bộ") · Lịch Test, Góp ý tuần, Báo cáo đơn vị = **một tuần** (cùng thành phần khoá một ô, ‹ › + "Mặc định" = tuần này) · **Đang SOS không có bộ lọc thời gian** (9.1-4). | Áp đúng "riêng Phân tích" | PTA-v4-7; 11.1b; 9.1-4; V3B-12 | ĐÃ CHỐT phần "không Toàn bộ" (MP III.8) · mặc định = PTA đề xuất |
| **Ngoại lệ nghiệp vụ — không thay bằng bộ chọn tuần:** Lịch thi lọc **Tháng dự kiến [10/2026] → [11/2026]** (mặc định tháng này → tháng sau); ô **Chốt ngày thi** = `ONgay` (cho chọn ngày đã qua — em đã thi); "Dời tháng" mặc định tháng sau; cửa sổ cố định "Đã xử lý 30 / 7 ngày", "Sắp thi 6 tuần" là định nghĩa chỉ số → giữ. | Tháng / ngày thi thật không được vô tình thành tuần | MP III.8; V2 I.6.3; 11.1b; 11.8-7 | ĐÃ CHỐT (MP III.8, XVI.A) |
| Thời gian trên màn ưu tiên **mã tuần** `W2 OCT`; ngày chỉ cho hạn cụ thể ("hạn 16/09", không thứ), ngày thi, ngày sinh, nhật ký; năm chỉ khi khác năm (tệp xuất giữ năm). Một hàm định dạng tuần (nay 3 dạng). | — | 30/09; 19/10-M6; X-17; X-18; TST-22 | ĐÃ CHỐT (30/09, 19/10-M6) · năm = PTA đề xuất (đảo C20) |

---

## 14. Hook dùng chung "bấm ra ngoài" biết portal

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Một** hook `useBamRaNgoai({ ref, mo, dong })` thay **15 bản tự viết** (`ChipSos`, `MenuDong`, `Menu`, `LichNho`, `ScoreEntry`, `PeoplePicker`, `NutLuat`, `ChonPhuTrach`, `BoChonThoiGian`, `HopNhapDiem`, `MissingBadge`, `TimLop`, `TimKeHoach`, `HopKyNang`, `Header`). | Lỗi bộ chọn tự đóng: `LichNho` vẽ qua portal (`ui/LichNho.tsx:208`), hộp cha đóng khi `mousedown` ngoài cây DOM của nó (`phanTich/BoChonThoiGian.tsx:25-33`) — bị ở 4 chỗ | 12.7; V3B-09 | Sửa lỗi ĐÃ CHỐT (V3 II.6) · hook = PTA đề xuất (12.9-1) |
| Biết portal: nội dung portal gắn `data-chu="<id hộp cha>"`; hộp con đăng ký với hộp cha qua một ngăn xếp (context) → bấm trong bất kỳ hộp con nào **không** tính là "ra ngoài" của cha; kiểm bằng `event.composedPath()` + `closest('[data-chu]')`. | Hộp nào sau này chứa ô ngày cũng không dính lại | 12.7 "gốc hệ thống" | PTA đề xuất |
| Esc đóng **lớp trên cùng** của ngăn xếp, focus trả về phần tử mở nó; cuộn trang không đóng hộp neo (hộp bám theo). | Không mất chỗ khi dùng phím | HTT-3; V4C-03 | PTA đề xuất |
| Phép kiểm bấm thử (Playwright) cho **mọi hộp có ô ngày / lịch**: mở hộp → mở lịch → bấm ‹ › và một ngày → hộp cha còn mở, giá trị đổi. | Chống tái phát | 12.7; 12.10 | PTA đề xuất |
| Trình tự: GĐ1 vá (hộp bỏ qua bấm trong lịch con, như `HopKyNang`) + gom hook; M0 thay hẳn `BoChonThoiGian` bằng `Khoảng tuần` (không hộp nổi). | Deploy được sớm | 12.7; Q-E1 | Thời điểm → Cần chủ SP (Q-E1) |

---

## 15. Bố cục · khung trang

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| **Thứ tự menu:** Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor (giữ tên "Học viên & Lớp"). Sửa `shared/domain/dieuHuong.ts:51-52` + 2 phép kiểm. | — | V1 I.2; MP III.6; X-38 | ĐÃ CHỐT (V1 I.2) |
| **Đầu trang một hàng** (≤ 56 px): Tiêu đề (= tên menu, 22) · Chi nhánh ▾ (nút gọn, không nhãn trên) · Chương trình (Tất cả \| FT n lớp \| LT n lớp) · Thời gian (nếu trang có) · Dữ liệu đến · **một** nút chính. Tiêu đề = tên menu ở mọi vai (bỏ "Việc hôm nay", "Mock Test", "Số liệu", "Học viên của tôi", "Chấm điểm"). Bỏ dải "Mới dùng PISA?" chen giữa (đưa vào menu tài khoản › Hướng dẫn). | Nay đầu trang 3–4 hàng, mất ~110 px; Chi nhánh dồn góc phải xa ~1 200 px | X6; A1-07, A1-08; m1 §2b; m3 | Một hàng = PTA đề xuất (khung m1 §2b, m3 ĐÃ duyệt) · tiêu đề = tên menu PTA đề xuất (9.2-2) |
| **Dải lọc dính** dưới tiêu đề, cùng chỗ mọi trang: Chi nhánh · Chương trình (nút đoạn) · Thời gian (`Khoảng tuần`) · "Đang lọc [chip ✕]" · "Bỏ lọc". Dính khi cuộn; `scroll-padding-top` = thanh trên + dải lọc. | C10 đã chốt nhưng không PR nào làm | C10; m1 §2b; X6 | ĐÃ CHỐT (C10) |
| **Một phạm vi số cho cả trang:** công tắc Chương trình + Chi nhánh áp mọi khối của trang (bỏ "gộp hai khung"); số cố ý khác phạm vi ghi "mọi chi nhánh". | — | 9.1-4; X-03 | ĐÃ CHỐT (9.1-4) |
| **Thanh trên:** chuông có số (thay chữ "Thông báo 30"); ô tìm "Tìm lớp, học viên hoặc email…"; logo bấm = trang đầu của vai; Giao diện · Ngôn ngữ · Hướng dẫn trong menu tài khoản. **< 1 440 px:** ô tìm thu thành nút kính lúp (6 mục đủ tên ở 15 px cần ~628 px); **≤ ~900 px:** tên ngắn ("Học viên") + gom "Thêm ▾". | Nay mất mục Tutor ở 1 280 px; tăng chữ làm cắt nặng hơn | C11; C18; A1-05; v1 D | C11, C18 ĐÃ CHỐT · co giãn = PTA đề xuất (10.7-11 cùng nhóm) |
| **Thanh dưới 375 ≤ 5 nút** (chữ 12, 75 px / ô): Tổng quan · Học viên · Test · Công việc · **Thêm** (Phân tích, Tutor) — thứ tự giữ; Admin VP đúng 5; GV / TVV / CX 3; Head tutor 1 mục → **ẩn** thanh dưới. | Nay 6 nút, "Tổng quan" 60,8 px trong ô 62,5 px — hết chỗ | v1 D; 10.7-11 | PTA đề xuất |
| **Trang đầu theo vai:** GV = Công việc (19/10-GV); QL / QT / Admin VP / TVV / CX = Tổng quan; Head tutor = Tutor. Phân vai Tổng quan ↔ Công việc và nơi làm việc của TVV → **Cần chủ SP**. | "Việc của tôi ở trang đầu của tôi" (PTA-v4-6) | 19/10-GV; V4A-02; PTA-v4-6 | GV ĐÃ CHỐT (19/10) · còn lại Cần chủ SP (Q-A1, Q-A2, Q-A3) |
| **Hai khung** (danh sách \| chi tiết) cho trang hàng đợi; vào trang chọn sẵn dòng đầu **chỉ khi là việc của chính người xem**; không tự mở việc của người khác, không đặt con trỏ, không tự cuộn. | Nay QL vào Công việc tự mở lưới GV, tự cuộn ~470 px (CV-09) | V4A-01; 10.2 B | PTA đề xuất |
| Chỉ `<main>` cuộn; bảng rộng cuộn trong khung; trang không trượt ngang. | — | PR-KHUNG; DESIGN.md Layout | ĐÃ CHỐT |

---

## 16. Responsive 375

| Quy tắc | Nguồn | Trạng thái |
|---|---|---|
| Kiểm mọi màn ở **375 sáng** và **1440 tối** (+ 1 280 cho bảng, 1 024 cho hai khung); ảnh nghiệm thu đủ hai cỡ. | DESIGN.md; Q2 (3.3) | ĐÃ CHỐT (DESIGN.md) |
| Bảng → thẻ từ **cùng định nghĩa cột** (mục 6.4); lưới nhập điểm → `MotKyNang`; hàng đợi → danh sách → chi tiết toàn màn + "‹ Quay lại" về đúng chỗ, "Việc 2 / 10", nút chính dính đáy; panel bậc 3–4 → toàn màn; hộp neo bậc 2a → **tấm dưới đáy** (m4 §5). | V2B-1 4g; 10.2 B; m4 §5 | PTA đề xuất |
| Vùng bấm **≥ 44 px bằng `min-height` của chính phần tử**; **cấm padding âm** (`max-sm:py-3 -my-3` nay đè 6 px lên ô nhập hàng dưới). | V3A-7 (c); 12.1 | PTA đề xuất |
| Ô nhập 16 px; nút / ô ≥ 44; chip 28; chữ dữ liệu ≥ 14. | OV-14b; v1 A3 | 16 px ĐÃ CHỐT · còn lại PTA đề xuất |
| Ngân sách ≤ 4 màn; dòng việc đầu y ≤ 420 px; bộ lọc trước nội dung ≤ ~120 px (nay Tutor ~460 px, Công việc QT việc đầu ở 1 505 px). | X5; V4A-01; V3B-12 | PTA đề xuất |
| Ẩn ở 375: Dán từ Excel (12.3); trục tuần Hành trình (chỉ dòng thời gian dọc — V4C-06); không cuộn ngang trang; chữ trong thẻ không cắt (`scrollWidth`). | 12.3; V4C-06 | Excel ẩn = PTA đề xuất (12.9-10) |
| Thanh dưới ≤ 5 nút (mục 15); menu tài khoản 375 không cao hơn màn (B-09). | v1 D; B-09 | PTA đề xuất |

---

## 17. Accessibility

| Quy tắc | Lý do / nguồn | Trạng thái |
|---|---|---|
| **Vùng bấm ≥ 24 × 24 px (1440) / ≥ 44 × 44 px (375)**; số bấm được mở rộng bằng `::after`, không đổi bố cục. | WCAG 2.2 "Target Size (Minimum)"; ui-ux-pro-max "Touch Target Size"; B-02 | PTA đề xuất |
| **Không chỉ bằng màu:** ✓ / ✗ trước số; ⚠ cạnh quá hạn; chữ "SOS n" + độ dày viền; viền đứt cho "tạm" / "Chưa chốt ngày" / ô trống cần nhập; ký hiệu "✓" + chữ cho đang chọn nút đoạn; vạch trái cho hàng đang chọn. | CLAUDE.md 11/10-UX; ui-ux-pro-max "Color Only" | ĐÃ CHỐT (CLAUDE.md) |
| **Tương phản:** chữ ≥ 4,5:1, viền / ký hiệu / focus ≥ 3:1 trên 9 nền thật, cả sáng và tối (mục 4.4). | WCAG AA | PTA đề xuất (đo) |
| **Focus:** vòng 2 px ngoài cách 2 px; `:focus-within` cả dòng; không bị thanh dính che (`scroll-padding-top`); panel giữ focus bên trong, Esc đóng panel trên cùng và trả focus. | ui-ux-pro-max "Focus States", "Focus Not Obscured (Minimum)" | Giữ hiện có + PTA đề xuất |
| **Bàn phím:** một menu ⋯ (`MenuDong`): Enter mở → focus mục đầu, ↑ ↓ đổi mục, Esc trả focus về ⋯ (gỡ `Menu` cũ — V4C-03); tab ← → chuyển tab (A5-33); lưới điểm: Enter = "Lưu · em tiếp", Tab sang nhận xét; "Bỏ qua tới nội dung". | V4C-03; A5-33; 12.1 | PTA đề xuất |
| **Tên truy cập:** ô điểm "L 6.0 — dưới kỳ vọng 6.5"; nút ⓘ "Giải thích ‹chỉ số›"; `aria-expanded` / `aria-controls` cho mọi chỗ mở / gập; `aria-current` / `aria-pressed` / `aria-selected` chỉ ở 2 dáng HTT-5/6; trạng thái lưu `aria-live="polite"`; lỗi `role="alert"`. | m1 §1g; HTT | PTA đề xuất |
| Giảm chuyển động: `.skel` đứng yên (`index.css:333`); chuyển động chỉ để báo trạng thái. | impeccable operate | ĐÃ CHỐT (OV-11i) |
| Nghiệm thu chữ ở **100 % và 125 %** tỉ lệ màn. | v4c §5 | PTA đề xuất |

---

## 18. Sân mẫu `/dev/thanh-phan` + quy trình duyệt một lần

| Quy tắc | Lý do | Nguồn | Trạng thái |
|---|---|---|---|
| Mở rộng `ThanhPhanDemo.tsx` thành **sân mẫu** gồm: (1) mẫu chữ mọi vai × sáng / tối × 1440 / 375, chuỗi kiểm "Nguyễn Thị Phương Thảo · Đỗ Vũ Tuấn Phong · ỖNG ẶC ỮA ẪN ỄNH · khuỷu, nghiễm, chuyện, quyết · 6.5 7.0 · W2 OCT · 18/09"; (2) bảng màu + số tương phản thật trên 9 nền; (3) `ODiem` 4 biến thể × 5 mức (vượt / bằng / dưới / chưa đủ / KCK) × trạng thái lưu; (4) **bảng mẫu `Bang`** đủ 13 kiểu cột × sáng / tối × 1440 / 1280 / 375; (5) `OSo` + 8 dáng "một nghĩa một dáng"; (6) `ChipSos`, chip trạng thái, chip Lịch thi A / B, badge; (7) nút 4 cấp × trạng thái; (8) HTT-1…12; (9) "Khung việc" 5 bậc + khuôn 6 phần + `PanelChiSo` A / C + hộp neo; (10) `Khoảng tuần` (thường / Phân tích / một tuần) + `ONgay` ngày / tuần + ô tháng; (11) menu ⋯; (12) khung trang + dải lọc; (13) rỗng / tải / lỗi / "Trang không mở được". | Nay `/dev/thanh-phan` không có thành phần OV-15 nào (N10); mockup viết tay CSS riêng | X7; PTA-06; Q12 (3.3); v1 A3; V2B-1 4h | PTA đề xuất |
| **Duyệt một lần:** PR NEN + BANG-0 dựng sân mẫu → chụp ảnh sân mẫu 1440 tối + 375 sáng → chủ SP trả "đạt / sửa" **một lần** → các PR chuyển bảng / màn sau chỉ cần ảnh cặp (không duyệt lại thành phần). Thành phần mới chưa có trong sân mẫu → ghi "MỚI" trong mockup và kế hoạch có Task thêm vào sân mẫu **trước** khi dùng ở màn. | Đỡ lần duyệt; mockup và web cùng một nguồn | 11.8-13 (→ 9.1-2); Q12; 06 mục 5 | Duyệt trước merge ĐÃ CHỐT (9.1-2) · cách gom lần duyệt = PTA đề xuất |
| Mockup mới vẽ **từ token + tên thành phần của sân mẫu**, cả trang, có dữ liệu dày và trạng thái rỗng (06 mục 4, 5). | Chống N10, N18 | Q12; 06 | PTA đề xuất |

---

## 19. Phép kiểm máy chống tái phát (danh sách đủ)

| # | Nhóm | Phép kiểm | Loại | Nguồn |
|---|---|---|---|---|
| 1 | Bảng | BANG-1: `index.css` không bộ chọn căn theo tên lớp | tĩnh | V2B-1 |
| 2 | Bảng | BANG-2: `td` / `th` không lớp căn; `th` không chứa ô nhập / nút; danh sách miễn chỉ giảm | tĩnh | V2B-1; V3A-9 |
| 3 | Bảng | BANG-3: `<table>` chỉ trong `ui/Bang.tsx` | tĩnh | V2B-1 |
| 4 | Bảng | BANG-4: cỡ chữ trong ô ∈ {12, 13, 14, 15}; cấm `text-[11px]`, `[11.5px]`, `[12.5px]` | tĩnh | V2B-1 |
| 5 | Bảng | BANG-5: cột số / điểm rộng px | tĩnh | V2B-1 |
| 6 | Bảng | `do-bang`: lệch ≤ 2 px, đường cơ sở ≤ 2 px, cao hàng ∈ {44, 64}, không tràn, "đè nhau" > 2 px, tiêu đề có điều khiển; 1440 / 1280 / 375 | DOM | V2B-1; V3A-7 |
| 7 | Chữ | DOM: chữ < 12 lỗi; chữ dữ liệu < 13 (1440) / < 14 (375); tỉ lệ ký tự < 13 px ≤ 10 %; ≤ 8 cặp (cỡ, đậm) | DOM | v1 A3; v4c §5 |
| 8 | Chữ | IN HOA có ký tự Việt → lỗi; cấm `uppercase` trong `web/src/modules/**` (trừ mã tuần) | DOM + tĩnh | V4C-13 |
| 9 | Chữ | `truncate` xén dấu (`scrollHeight > clientHeight + 1`); cấm `leading-none` cạnh `truncate`; chữ gợi ý không cắt | DOM + tĩnh | v1 A3; V4C-05 |
| 10 | Màu | màu số điểm chỉ từ `--kq-*`; chặn `text-rose-*` / `text-emerald-*` trên số điểm; component không tự khai màu (`prSang` S4–S6 giữ) | tĩnh | v1 B2 |
| 11 | Màu | "cùng giá trị trên một trang → cùng lớp màu" | DOM | V4C-09 |
| 12 | Màu | tương phản chữ ≥ 4,5:1, ký hiệu / viền ≥ 3:1 trên 9 nền (`nenGiaoDien.tests.ts` mở rộng) | tĩnh | v1 B2 |
| 13 | Trạng thái | mọi `cursor:pointer` có ΔL rê ≥ 5,8 cả hai chế độ; phần tử không bấm không hover (≤ 3,5 với dò hàng) | DOM | V4C-02 |
| 14 | Trạng thái | mọi `[aria-current]`, `[aria-pressed=true]`, `[aria-selected=true]` thuộc 1 trong 2 dáng HTT-5/6; cấm `box-shadow inset … var(--accent)` ngoài lớp chuẩn | DOM + tĩnh | V4C-04 |
| 15 | Trạng thái | báo lưu chỉ qua `TrangThaiLuu`; cấm `window.confirm` | tĩnh | V4C-11 |
| 16 | Panel | `KhungPanel` phải có `dau` (không đầu 52 px); cỡ chữ trong panel ∈ {12, 13, 14, 15, 17}; tên đầu panel = `tenViec(it)` | tĩnh | V4A-03; V4C-13 |
| 17 | Panel | khối bối cảnh đứng trước khối cần làm (thứ tự DOM); khoảng dọc nhỏ nhất giữa hai khối chữ ≥ 4 px | DOM | V4A-03 |
| 18 | Panel | `[role=dialog]` ≤ 1 + hộp neo; hộp neo ≤ 360 px; Esc → focus về phần tử mở; mỗi loại việc khai đúng một `bac` | DOM + tĩnh | V4A-04 |
| 19 | Danh sách | mỗi dòng việc 3 vùng (`data-vung` = han · viec · mo); khi một dòng đang mở, nút tiêu đề mọi dòng rộng ≥ 50 % dòng; `WorkList.tsx` không còn `sm:col-start-2` cho vùng mở | DOM + tĩnh | V4A-01; V4A-06 |
| 20 | Trang | khung nhìn đầu ≤ 30 phần tử bấm; y dòng việc đầu ≤ 200 / 420 px; chiều cao `main` mỗi trang ghi vào bảng nghiệm thu (ngân sách 2 / 4 màn) | DOM | X5; V4A-01 |
| 21 | Số | "số trên trang = số dòng panel"; "cùng chỉ số hai tab = cùng tập"; "một việc một nơi" (việc QL ở Tổng quan không lặp ở Công việc QL — theo Q-A1) | test máy chủ + DOM | SL1; V3B-03; V4A-02 |
| 22 | Bấm được | cấm `decoration-dotted` / gạch chấm; số bấm được chỉ qua `OSo`; link trùng `location.pathname` không vẽ | tĩnh + DOM | V3B-01; V4C-14 |
| 23 | Hộp nổi | bấm thử mọi hộp có ô ngày: bấm trong lịch không đóng hộp cha; chỉ một hook "bấm ra ngoài" (cấm `addEventListener('mousedown'…)` tự viết ngoài hook) | Playwright + tĩnh | 12.7 |
| 24 | Menu | cấm import `ui/Menu.tsx`; phép phím: Enter → mục đầu, ↓ đổi mục, Esc → nút ⋯ | tĩnh + Playwright | V4C-03 |
| 25 | Ô nhập | ô nhập tuần chỉ qua `ONgay kieu="tuan"`; cấm hàng nút ngày / tuần; `BoChonThoiGian` hết người gọi sau M0 | tĩnh | V4C-05; 06/10 |
| 26 | Route | id không tồn tại → có nút về, không "Thử lại"; vai thiếu quyền không vẽ khung trang; `*` hiện mẫu "Trang không mở được" | Playwright | V4C-10 |
| 27 | Mã | cảnh báo esbuild = lỗi trong `npm run check`; luật `no-duplicate-case` | tĩnh | 11.1e |
| 28 | Chữ nghĩa | từ điển chữ chặn chữ cũ (Thi ↔ Test, "Người giữ", "Ghi chú họp"…); giao diện không in chuỗi máy có "_" (mã `kind` thô — V4C-08) | tĩnh + DOM | 11.1d; X8; V4C-08 |
| 29 | Excel | nút "Dán từ Excel" chỉ ở lưới theo lớp × lượt; máy chủ `luot` bắt buộc ở `/scores/lo` | tĩnh + test | 12.3 |
| 30 | Ảnh | công cụ ảnh cặp toàn trang `scripts/` (1440 tối + 375 sáng, 100 % + 125 %) chạy được trên `npm run seed` nguyên | quy trình | Q2, Q11 (3.3) |

Luật: phép kiểm **đọc chuỗi mã khẳng định bố cục cũ** được gỡ / viết lại theo hành vi khi PR làm lại màn (Q9); không thêm phép kiểm chuỗi mới cho bố cục — dùng ảnh cặp + phép đo DOM. Các phép kiểm DOM gom vào `do-khung` (GĐ0 CONG-CU). Trạng thái: PTA đề xuất.

---

## 20. Đã có trong mã → giữ / thay / bỏ

| Thành phần / lớp hiện có | Tệp | Quyết định | Thay bằng / ghi chú |
|---|---|---|---|
| `SoLieuO`, `SoO`, ô số Phân tích GV, nút Mock Báo cáo | `ui/SoLieuO.tsx`, `ui/SoLieu.tsx`, `phanTich/*` | **thay** | `OSo` |
| `NganDanhSach` (panel chỉ tên) | `ui/SoLieu.tsx` | **thay** | `PanelChiSo` A / C |
| `BoChonThoiGian` | `phanTich/BoChonThoiGian.tsx` | **bỏ** (M0) | `Khoảng tuần` |
| `ChonTuanSos`, 12 nút tháng Lịch thi, bộ chọn riêng mỗi panel xuất | nhiều tệp | **bỏ** | `Khoảng tuần` / ô tháng |
| `OTuanBatDau`, `OTuan`, `ChonTuan`, hàng chip tuần | `ChuyenLopPanel.tsx`, `TransitionPanel.tsx`, `ui/ChonNgay.tsx` | **thay** | `ONgay kieu="tuan"` |
| `ONgay` | `ui/` | **giữ** | thêm `kieu="tuan"` |
| 7 kiểu ô điểm: `ODiemMt` sửa / chỉ đọc, `DauO`, cột W, Kỳ vọng / Overall, `Band` + `Stack`, `ODiemFt` | `HopNhapDiem.tsx`, `LuoiFT.tsx`, `ClassRoster.tsx`, `BangHocVienLop.tsx` | **thay** | `ODiem` (`doc` / `sua`) |
| Ô lớp thường gõ thẳng, chip `Outcome` "n/4 môn đạt", "× 27/40", chip nền vàng hồ sơ HV, chip nền Case | `ScoreEntry.tsx`, `LuoiThuong.tsx`, `BangDiemLopThuong.tsx`, `StudentDetailPage.tsx`, `SkillBoard.tsx` | **thay** | `ODiem ti-le` + chip SOS / "✓ Đạt" |
| `ODiemLon` | `ui/ODiemLon.tsx` | **giữ** | cỡ riêng, ký hiệu + màu chung, Overall so |
| `BandCell` | `ui/ui.tsx:438-449` | **bỏ** | không nơi dùng |
| `DauKetQua` (✓ / ✗) | `ui/` | **giữ** | 14 px, đứng trước số |
| `MuiTenKyVong` (▲ / ▼) | `ui/` | **giữ** | chỉ trong hộp nhập điểm lẻ |
| `NutNhanXet`, `SuaDiemCoLyDo`, ⋯ trong ô lớp thường, "tổng [25] Điền cả cột" | `HopNhapDiem.tsx:598-657`, `ScoreEntry.tsx:759-821`, `LuoiThuong.tsx:429-445` | **bỏ** | hộp chấm một mẫu (`HopNhapDiem`) |
| `DanExcel` | `cham/LuoiChamLop.tsx` | **giữ** chỉ lưới theo lớp × lượt | bỏ ở 6 lối khác + 375 |
| `<table>` viết tay (53 tệp), `.th`, `.td`, `Th` | nhiều tệp, `index.css:258-265` | **thay** | `Bang` + `[data-kieu]`; `Th` thành phần trong `Bang` |
| Luật `index.css:267` | `index.css` | **bỏ** | căn theo kiểu cột |
| `.row-hover`, `hover:bg-white/5` | 31 tệp + 21 chỗ | **thay** | `.bam`, `.do-hang` |
| `.row-active` (viền khung 2 px) | `index.css:273-277` | **thay** | `.dang-mo` (nền nhấn nhạt + vạch trái 3 px) |
| `HangNhom`, `.hang-lon`, `.khoi-nhom-dau` | `index.css:289-321` | **giữ** | nhận HTT-1 / HTT-4; vạch trái `--line-strong`; 15 / 700, cao 40 |
| `PhanDoan` (huy hiệu ✓ góc) | `ClassCreatePanel.tsx:307` | **thay** | `BoLocDoan` (HTT-5) |
| `BoLocDoan`, `.nut-loc` | `ui/ui.tsx:540-543`, `index.css:231-237` | **giữ** | đang chọn theo HTT-5; bỏ `filter: brightness` |
| `Menu` (⋯ cũ) | `ui/Menu.tsx` | **bỏ** | `MenuDong` (+ `hint`) |
| `KhungPanel` | `ui/KhungPanel.tsx` (63 tệp) | **giữ vỏ** | đầu v3 bắt buộc (`DauViec`), bỏ đầu 52 px, `Khoi` IN HOA → 15 / 700, `Truong` nhãn 13 / 600 |
| `KhungTaiCho` (chỉ Công việc) | `congViec/` | **thay** | vỏ bậc 3 dùng chung (cột phải hàng đợi = ngăn phải, cùng vỏ) |
| `HopGiaHan` (ngăn 560 px cho 1 ô) | — | **thay** | hộp neo bậc 2a |
| `GhiNhanh` dưới dòng ở Công việc | `WorkList.tsx:148`, `cases/GhiNhanh.tsx` | **bỏ ở Công việc** | khung phải; giữ trong panel một em |
| `HopChoDuyet gon` (thẻ) trong danh sách | `duyet/HopChoDuyet.tsx` | **thay** trong danh sách | dòng `DongViec`; thẻ giữ ở Hộp duyệt đầy đủ |
| `KhoiDiemLop` (lưới dưới mọi tab hồ sơ lớp) | `ClassOverviewPage.tsx:145` | **thay** | lưới **gập** chỉ ở tab Học viên + "Nhập điểm" cuộn tới (ĐÃ CHỐT V2 II.1) |
| `LichSapToi` (Tổng quan) | `OverviewPage.tsx:110` | **bỏ** | "Tuần này" một hàng ô tuần |
| Khối Trễ chấm Tổng quan | `TongQuanQl` | **bỏ** | ĐÃ CHỐT (V1 II.4) |
| `BranchFilter` (nhãn trên) | — | **thay** | nút gọn "Chi nhánh ▾" trong khung trang |
| `DaiMoiDung` (banner "Mới dùng PISA?") | — | **bỏ khỏi đầu trang** | menu tài khoản › Hướng dẫn |
| `SaveIndicator` / `SaveState` | `ui/SaveState.tsx` | **giữ** làm `TrangThaiLuu` | mọi ô / panel dùng; dấu lưu lưới xám |
| `ConfirmDialog`, `Modal` | `ui/Drawer.tsx` | **giữ** | thay `window.confirm`; Modal chỉ cho hậu quả lớn |
| 15 bản "bấm ra ngoài" | 15 tệp (mục 14) | **thay** | `useBamRaNgoai` |
| `ChipSos` | `ui/` | **giữ** (một component) | bỏ "?" cạnh |
| `NutGiaiThich` (C04) | `ui/` | **giữ** | ký hiệu ⓘ |
| `Nhan` (chip trạng thái) | `ui/Nhan.tsx` | **giữ** | 13 / 600 cao 24; tone `late` chỉ chữ |
| `TheDong` (375) | `ui/` | **giữ** | sinh từ định nghĩa cột `Bang` |
| `ErrorState`, `.skel` | `ui/`, `index.css:331` | **giữ** | thêm mẫu "Trang không mở được" |
| Hàng tổng "Cả chi nhánh" `bg-white/5` | `TongQuanQl.tsx:160` | **thay** | chữ đậm + viền trên `--line-strong` (không nền — trùng hover) |

Nguồn: 11.1a, 12.1, 12.4, 12.7, V2B-1/2, V3A-6, V3B-01/03/09, V4A-03/04/06, V4C-03/04/05/11/13, v1 C2, E14. Trạng thái: PTA đề xuất (trừ dòng ghi ĐÃ CHỐT).

---

## 21. Mâu thuẫn giữa các nguồn — đã phân xử

| # | Chỗ | Nguồn A | Nguồn B | Chọn | Vì sao | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | "Đang chọn" của hàng | m1 §1d + DESIGN.md + v1 C2 + 02 X-19 cũ: viền khung 2 px | 10.1 + V2B-1 4f + v4c HTT-6: nền nhấn nhạt + vạch trái 3 px | **B** | viền 2 px trùng màu, trùng độ dày vòng focus (V4C-04); PTA Plan chốt 21/10 | PTA đề xuất (PTA-v4-9; đảo m1 §1d) |
| 2 | "Toàn bộ" | 12.7 / 12.9-17: Phân tích + Tutor + Bộ lọc thêm + panel Xuất | MP III.8 "riêng Phân tích" | **B** | lời chủ SP mới hơn | ĐÃ CHỐT (MP III.8; PTA-v4-7) |
| 3 | Hàng nút trong lịch tuần | 12.7: giữ "Tuần này · Tuần trước" | 06/10: không hàng nút ngày | **B** | luật chủ SP | ĐÃ CHỐT (06/10; PTA-v4-8) |
| 4 | Căn cột điểm | C06 (18/10): số căn giữa | m6 §3 (19/10): căn trái, ký hiệu trước, cột hẹp | **C06 + phần tốt của khung** (giữa theo kiểu cột + ký hiệu trước + ô rộng cố định) | thẩm mỹ; C06 là lời chủ SP | PTA đề xuất (X-01; đảo căn của m6 §3) |
| 5 | "›" | V3B-01, 12.4: chữ + "›" = đổi trang; m6 §1 "Mở hồ sơ MT3 ›" | V4A-01: "›" cuối dòng = mở khung phải; 10.2 "Duyệt ›"; m2 / m6 "Lưu · em tiếp ›" | **A** — "›" chỉ cho link chữ đổi trang; dòng mở khung phải không ký hiệu; nút không "›" | một nghĩa một dáng (đề bài 04) | PTA đề xuất |
| 6 | Ký hiệu giải thích | C04 + m1 §1g: "?" | 12.4, V3B-01, 12.9-12: ⓘ | **ⓘ** (giữ hành vi C04) | ⓘ = thông tin; m6 §1 đã bỏ "?" cạnh chip SOS | PTA đề xuất (đảo ký hiệu m1 §1g) |
| 7 | Cao hàng bảng | v1 A3: 40 / 63 px | 11.1a, V2B-1: 44 / 64 px | **44 / 64** | 44 = vùng chạm; phép đo `do-bang` dùng {44, 64} | PTA đề xuất |
| 8 | Chữ phụ trong ô điểm | v1: dữ liệu ≥ 13 | V2B-2: 12 px | **12** (ngoại lệ ghi rõ, gắn `data-phu-odiem`) | giữ hàng 64 px; 12 vẫn ≥ sàn | PTA đề xuất |
| 9 | Đã tích (chọn nhiều) | v1 C2: ô tích + nền nhấn nhạt | HTT-6 mới dùng nền nhấn nhạt | **chỉ ô tích** | không thêm dáng thứ ba | PTA đề xuất |
| 10 | Vạch trái hàng nhóm | DESIGN.md: màu nhấn | v4c HTT-6: trung tính | **trung tính** `--line-strong` (giữ vạch 3 px — 9.2-37) | không trùng đang chọn | PTA đề xuất |
| 11 | Thang chữ | C09 / DESIGN.md / m1 §1e: 12 / 13 / 14 / 16 / 20, ô 13 | 10.1: 12 · 13 · 14 · 15 · 17 · 22 · 28, ô 15 | **10.1** | V1 I.1 "chữ quá nhỏ" | Hướng ĐÃ CHỐT (V1 I.1); số = PTA đề xuất (X-13) |
| 12 | Chênh kỳ vọng | m1 §1a: "thiếu 0.5 / vượt 0.5" bằng chữ trong ô | 19/10-M6, m6 §3: bỏ | **bỏ trong ô**; chỉ ở hộp Vì sao SOS / panel | m6 thắng m1; 19/10-M6 đã chốt | ĐÃ CHỐT (19/10-M6) |
| 13 | Ô lớp thường | m2 khung 1a: "✗ 16/25 64%" + nút Nhận xét sau ô | 12.1, V3A-8: "✗ 17/25", % ở hộp | **"✗ 17/25"** + hộp chấm | V3 I.2 đã chốt "trong hộp chấm" | PTA đề xuất (X-33, X-02) |
| 14 | Hover | v1 C2: phủ 8 % lên `tr` | V4C-02: đo ô thật ΔL 0 → phủ lên **từng ô** | **từng ô** (`background-image`) | `td` có nền riêng che hover của `tr` | PTA đề xuất |
| 15 | Nhãn hạn | 12.2: "hạn T4 16/09" | 19/10-M6: hạn chỉ ngày | **"hạn 16/09"** ("MT2 · thi W2 SEP · hạn 16/09") | lời chủ SP thắng đề xuất PTA | ĐÃ CHỐT (19/10-M6; X-18) |
| 16 | Báo "Đã lưu" | m1 §1a xếp "✓ Đã lưu" vào màu `ok` | `SaveState.tsx` ("đã lưu xám"), v1 E1, HTT-10 | **xám** | "✓" xanh trùng ✓ vượt kỳ vọng | PTA đề xuất (đảo một dòng m1 §1a) |
| 17 | Dòng việc | 10.2 B: 2 hàng ~52 px, động từ "Duyệt ›" | V4A-01: 3 vùng, 56 px | **V4A-01**, động từ không "›" | phân tích mới hơn, có đếm | PTA đề xuất |
| 18 | Panel từ số Báo cáo | m3 khung 3 panel "Chưa đạt" 10 cột | V3B-03: ≤ 6 cột, điểm gộp | **≤ 6 cột** | panel của chính mockup cũng tràn | PTA đề xuất (nâng cấp mockup → Q-C2) |
| 19 | Tiêu đề trang | DESIGN.md 20 / 700; mã 18 / 600 | v1 A3: 22 | **22** (375: 20) | thang mới | PTA đề xuất |
| 20 | Hàng chip chọn tuần (Chuyển lớp) | v4c Q2 hỏi chủ SP | 9.2-19 → 06/10 "lệch phải sửa" (02 X-20) | **bỏ**, không hỏi | đã trả lời bằng luật 06/10 | ĐÃ CHỐT (06/10) |
| 21 | Hộp duyệt ở đâu | MP IV.8 (A): hộp riêng trên | 10.2 B: nhóm đầu của một hàng đợi | — | định hướng lớn | Cần chủ SP (Q-A2) |
| 22 | Hoàn tác | 10.3: 8–10 s | m1 §1f, V4A-03: 10 s | **10 s** | khớp khung đã duyệt | ĐÃ CHỐT (m1 §1f) |
| 23 | Mở rộng tại dòng (Thêm PA) | MP IV.3: mở tại dòng HV | ảnh v4-1, v4-3: mở trong danh sách hẹp che tiêu đề | **bảng rộng: mở dưới hàng (2b); danh sách hẹp: khung phải; cùng một form** | giữ lõi ý chủ SP, tránh lỗi đã thấy | PTA đề xuất (X-39) |

---

## 22. Danh sách để chủ SP xem

### 22.1 PTA đề xuất có ĐẢO quyết định / mockup cũ — chủ SP chỉ cần phản đối nếu không đồng ý

| # | Đảo cái gì | Thành gì | Mục |
|---|---|---|---|
| 1 | m1 §1d, DESIGN.md: đang chọn = viền khung 2 px | nền nhấn nhạt + vạch trái 3 px (HTT-6) | 12, 21-1 |
| 2 | C09 / m1 §1e: thang 12 / 13 / 14 / 16 / 20, ô 13 | thang 12 · 13 · 14 · 15 · 17 · 22 · 28, ô 15 | 2 |
| 3 | m6 §3: cột điểm căn trái | căn giữa (C06) + ký hiệu trước + ô rộng cố định | 6.2, 21-4 |
| 4 | m2 khung 1a: "✗ 16/25 64%", nút Nhận xét ngoài ô | "✗ 17/25", nhận xét trong hộp chấm | 5.2, 7 |
| 5 | m1 §1g / C04: ký hiệu "?" | ⓘ (cùng hành vi) | 8.2 |
| 6 | m2 khung 1f, m6 khung 3: nút "Lưu · em tiếp ›" | "Lưu · em tiếp" (không "›" trong nút) | 8.2, 11 |
| 7 | DESIGN.md: vạch trái hàng nhóm màu nhấn | vạch trái trung tính | 6.3 |
| 8 | m1 §1a: "✓ Đã lưu" màu `ok` | đã lưu màu xám | 12 (HTT-10) |
| 9 | C20: luôn ghi năm `W4 AUG/2026` | năm ở đầu cột / khi khác năm; tệp xuất giữ năm | 13 |
| 10 | mT khung 2: nút chính "Tải danh sách" | "Thêm tutor" chính | 11 |
| 11 | Khung OV-13 §1: Kết quả PA ghi nhanh dưới dòng ở Công việc | mở ở khung phải, cùng form gọn (vẫn 3 bấm) | 9.2 |
| 12 | HD2 (11/10): lớp thường gõ thẳng đúng / tổng ở máy tính | gõ số trên ô = mở hộp chấm (Enter = em tiếp) | 7 |
| 13 | 12.7 (đề xuất PTA cũ): "Toàn bộ" ở Tutor / Bộ lọc thêm / Xuất; giữ hàng nút tuần | "Toàn bộ" chỉ Phân tích; bỏ hàng nút | 13 |

### 22.2 Cần chủ SP (không quyết ở tệp này — câu ở 02 mục 5)

Q-A1 (Tổng quan ↔ Công việc — quyết định trang đầu và badge) · Q-A2 (hộp duyệt riêng hay nhóm đầu hàng đợi — quyết bố cục hai khung mục 15) · Q-A3 (TVV làm việc ở đâu) · Q-C1 (chấm Test theo hạn — quyết mockup ba khối) · Q-C2 (nâng cấp Báo cáo + chế độ "Chiếu" — quyết thang 40 / 17) · Q-C3 (biên luật chip "Chưa chốt ngày") · Q-E1 (BANG-0 / BANG-1, vá bộ chọn có vào gói trước deploy không) · Q-E2 (ô tick xuất Excel — quyết cột tick trong `Bang`).
