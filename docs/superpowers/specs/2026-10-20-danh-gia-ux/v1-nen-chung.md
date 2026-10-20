> Phụ lục vòng 1 (góp ý chủ SP 20/10 tối) của [Đánh giá lại UX/UI toàn diện](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) — mục 10. Báo cáo gốc của agent nghiên cứu (Opus 5.5), giữ nguyên chữ. Đường `SCR\…` là tệp tạm (không lưu trong repo).

# Nền chung v1 — chữ, màu số điểm, hover, menu · 20/10/2026

Người làm: agent nghiên cứu nền chung (Opus 5.5). CHỈ nghiên cứu + đề xuất — không sửa mã, không mockup.
So hai bản: **deploy `6177d36f`** ↔ **HEAD `e3405b93`** (193 commit, PR #445–#485).
Cách làm: đọc mã + `git diff`; đếm lớp cỡ chữ bằng script; đo phông thật trong `node_modules/@fontsource` (đọc bảng WOFF);
tính tương phản WCAG, ΔE / ΔL OKLab, mô phỏng mù màu (Machado 2009) từ token thật ở `web/src/index.css`. Script + kết quả: `SCR\nc\`.

**Nhãn:** [ĐÃ CHỐT] chủ SP đã quyết · [ĐÃ KIỂM] đã đo / đọc mã · [ĐỀ XUẤT] chưa duyệt · [ƯỚC] số ước tính, cần đo lại khi làm.

**8 kết luận chính**
1. Lời chủ SP "nhiều chỗ nhỏ hơn bản deploy" — **ĐÚNG MỘT PHẦN** [ĐÃ KIỂM]. Gốc chính là OV-15a (#460): mọi ô bảng 14 → 13 px; đầu cột 11 IN HOA → 12 thường (chữ thấy được thấp đi 21 %). Tổng quan QL: dòng 14 → 13, số 16 → 13. Ô điểm, cột Kỳ vọng / Overall thì **to lên**.
2. Gần 70 % lớp cỡ chữ vẫn ≤ 12,5 px ở cả hai bản (69,1 % → 69,0 %). Khối mới sau deploy làm ở 11–12 px.
3. Phông: **giữ Be Vietnam Pro + chữ số Inter** [ĐỀ XUẤT]. Đổi sang Inter chỉ được +3 % chiều cao chữ; tăng cỡ 13 → 15 được +15 %.
4. Thang mới 12 · 13 · 14 · 15 · 17 · 22 · 28: chữ thường / ô bảng / nút **15**, lưới điểm dày **14**, chữ phụ / nhãn / đầu cột / chip **13**, không chữ < 12.
5. Số điểm hiện có **6 cách tô** khác nhau. Đề xuất một luật: tô chính con số + giữ ✓/✗; 3 token mới `--kq-vuot / --kq-bang / --kq-duoi`, đều ≥ 4,67:1 trên 9 nền thật (sáng + tối).
6. Bộ màu đang dùng: xanh lá ↔ đỏ (tối) **gần như trùng với người mù màu đỏ–lục** (ΔE 1,3); "bằng kỳ vọng" xanh dương **trùng màu link / nhấn** (ΔE 2,4 tối, 0 sáng). Bộ đề xuất sửa cả hai.
7. Hover: hàng bảng chỉ chênh ΔL 2,8–3,6 (gần như không thấy); hover **không hiện** ở cột tên dính, hàng nhóm, hàng đã thi; hàng tổng "Cả Monbay" có nền ≈ nền hover. Đề xuất phủ 8 % (tối) / 9 % (sáng) → ΔL ≈ 6–7, chỉ cho thứ bấm được.
8. Menu [ĐÃ CHỐT]: chỉ cần đổi chỗ Phân tích ↔ Công việc (1 dòng `shared/domain/dieuHuong.ts:51-52` + 2 phép kiểm). Thanh dưới 375 đang ở giới hạn ("Tổng quan" 60,8 px trong ô 62,5 px) → tăng chữ phải còn ≤ 5 nút.

---

## A. Cỡ chữ + phông — [ĐÃ CHỐT: phải tăng, được chọn phông]

### A1. Kiểm lời chủ SP: "nhiều chỗ bản hiện tại nhỏ hơn bản deploy" → **ĐÚNG MỘT PHẦN** [ĐÃ KIỂM]

**Tệp nền:** `tailwind.config.js` không khai cỡ chữ riêng (xs 12 · sm 14 · base 16), không đổi cỡ giữa hai bản. `index.css` đổi 3 chỗ, cùng PR OV-15a (#460, commit `31b4f24f`).
`DESIGN.md` đổi thang thành 12/13/14/16/20.

**Chỗ bị NHỎ ĐI**

| Thành phần | Deploy 6177d36f | Hiện tại | Chênh | PR | Bằng chứng |
|---|---|---|---|---|---|
| Ô bảng không tự đặt cỡ (`.td`) | 14 (kế thừa body / `text-sm` của `<table>`) | **13** | −1 px (−7 %) | OV-15a #460 | `index.css:265`. 238 mẫu `<td className="td…">` không có cỡ riêng; 55 bảng đặt `text-sm` trên `<table>` nay bị `.td` 13 đè. Nhiều nhất: `HoSoGiaoVienPage` 17, `KetQuaThi` 14, `LuoiFT` 13, `PhanTichGiaoVien` 12, `ClassIssueBoard` 10, `StudentDetailPage` 9, `KhoiNo` 9 |
| Đầu cột (`.th`) | 11 px IN HOA, đậm 600, giãn 0,04em | 12 px chữ thường, đậm 600 | px +1 nhưng **chiều cao chữ thấy được 8,1 → 6,4 px (−21 %)** | OV-15a #460 | `index.css:261`. Đo phông: chữ hoa BVP 0,740 em, chữ thường 0,530 em |
| Tổng quan QL — khối việc chính | "Cần xử lý": dòng 14, số 16 đậm | "Cần bạn quyết": dòng 13 đậm, dòng phụ 12; dải "HV cần chú ý" số 13 | −1 / −3 px | OV-15d #463, OV-15h1 #482 | cũ `KhoiCanXuLy.tsx:39-41` (6177d36f); mới `KhoiCanQuyet.tsx:35-48, 98-100` |
| Khối mới thêm sau deploy (cỡ trung bình các lớp chữ) | — | Lịch thi 11,8 · Tìm kế hoạch 11,9 · chip Kế hoạch Test 11 (cao 20 px) · Dán Excel 12,6 · panel Tutor 12,6 · Kết quả thi 12,7 (✓/✗ 11 px) | nhỏ hơn mặt bằng cũ | OV-15b/c/e/f, TU-b | `GocLichThi.tsx`, `TimKeHoach.tsx`, `ChipKyNang.tsx:70`, `DanExcel.tsx`, `PanelTutor.tsx`, `KetQuaThi.tsx:86` |

**Chỗ TO LÊN** (để công bằng): ô điểm L/R/S 12 → 13 đậm (`HopNhapDiem.tsx:176`, OV-15b); cột Kỳ vọng + Overall 14 → 15 đậm 800 (`LuoiFT.tsx:98`); band hồ sơ lớp 12 → 13 (`ClassRoster.tsx:362`); "Cần bạn quyết" tiêu đề 14 → 16; chữ hạn 12,5 → 13 (nhưng trong dòng việc bị `[&>span]:text-xs` ép về 12 — `WorkList.tsx:121`).
**Không đổi:** body 14, nút `.btn` 14 / `.btn-sm` 12, chip 11,5, menu trên 14, thanh dưới 11,5, tiêu đề panel 17, dòng việc 13 / 12.

**Đếm lớp cỡ chữ trong `web/src` (bỏ tiền tố `max-sm:` …)**

| Lớp | Deploy | HEAD | Chênh |
|---|---|---|---|
| `text-xs` (12) | 894 | 1 034 | +140 |
| `text-sm` (14) | 349 | 383 | +34 |
| `text-[13px]` | 88 | 111 | +23 |
| `text-[12px]` | 91 | 94 | +3 |
| `text-[11px]` | 75 | 86 | +11 |
| `text-[11.5px]` | 73 | 71 | −2 |
| `text-[12.5px]` | 57 | 55 | −2 |
| `text-base` (16) | 23 | 26 | +3 |
| `text-[15px]` | 19 | 24 | +5 |
| `text-lg` (18) | 20 | 22 | +2 |
| khác (13,5 · 14 · 16 · 17 · 20 · 28 · xl · 2xl) | 33 | 36 | +3 |
| **Tổng** · **tỉ lệ ≤ 12,5 px** | 1 722 · **69,1 %** | 1 942 · **69,0 %** | không cải thiện |

Kết luận: số lớp nhỏ tăng theo mã mới; tỉ lệ chữ nhỏ giữ nguyên ~70 %. Phần "nhỏ đi" người dùng thấy rõ nhất là **mọi bảng** (13 px) và **đầu cột** (chữ thường thấp hơn chữ hoa cũ).

### A2. Kiểm kê thang chữ hiện tại theo vai trò (HEAD) [ĐÃ KIỂM]

| Vai trò | Cỡ px · đậm · line-height | Nơi dùng / bằng chứng | Vấn đề |
|---|---|---|---|
| Tiêu đề trang h1 | 18 · 600 (`text-lg`) — hồ sơ HV / GV 20 | 18/21 trang | DESIGN.md ghi 20 · 700 → lệch tài liệu |
| Tiêu đề panel | 17 · 800 (panel v3) · 14 · 800 (panel cũ) | `KhungPanel.tsx:121, 131` | hai cỡ cho một vai trò |
| Tiêu đề khối h2 | 7 cỡ: 11,5 · 12 · 14 · 15 · 16 … | 27 h2: `sm` 10, `base` 7, `[11.5px]` 3 … | không có chuẩn |
| Tiêu đề mục trong panel h3/h4 | 11 · 800 **IN HOA** giãn 0,06em | `KhungPanel.tsx:196`, `BanGiaoPanel.tsx:165,180`, `ClassYThucCard.tsx:321`, `ThangYThuc.tsx:44` | tiếng Việt in hoa nhỏ khó đọc, dấu chồng chật |
| Hàng nhóm (lớp) | 12,5 · 800 · cao 38 | `index.css:289, 314` | nhỏ hơn chữ dòng con nó dẫn |
| Chữ thường / body | 14 · 400 · 1,5 | `index.css:135` | — |
| Ô bảng | 13 · 400 · 1,5 (= 19,5 px) | `index.css:265` | nhỏ đi so với deploy |
| Hàng con | 12 · cao 32 | `index.css:305` | nhỏ |
| Dòng việc (Công việc / Tổng quan) | tên 13 · 600; phụ 12; hạn 12; dòng con 12,5 / 11,5 | `WorkList.tsx:110-121, 162-170` | |
| Số điểm trong lưới | 13 · 700 (L R S), W1/W2 12, "n câu" 11 | `HopNhapDiem.tsx:142, 176` | dòng "n câu" 11 |
| Số lớn | 28 · 700 | `ODiemLon.tsx:113, 153` | ổn |
| Chữ phụ (slate-400/500, dim, faint) | 12 (635 chỗ) · kế thừa 353 · 11 (56) · 11,5 (44) | 1 241 chỗ | 100 chỗ < 12 |
| Nhãn ô form | 12 · 500 | `.label` `index.css:256`; 85 `<label>` (54 kế thừa, 17 `xs`) | |
| Đầu cột | 12 · 600 | `.th` | xem A1 |
| Chip trạng thái | 11,5 · 700 · cao 18 | `Nhan.tsx:20-21` | nhỏ nhất trong hệ |
| Chip SOS | 12 · 700 · cao 22 | `Nhan.tsx:34` | |
| Nút | `.btn` 14 · 500; `.btn-sm` 12 (315 chỗ — phần lớn nút trong dòng) | `index.css:207-223` | nút hàng 12 px |
| Menu trên | 14 · 400 | `App.tsx:89` | |
| Thanh dưới 375 | 11,5 · 400 (đang chọn 600) | `App.tsx:112` | ở giới hạn rộng (D) |
| Ô nhập 375 | 16 (ép `!important`) | `index.css:254` | ổn — giữ |

### A3. Đề xuất hệ chữ mới [ĐỀ XUẤT]

**Phông — so 6 ứng viên.** Hai phông đã cài đo thật; bốn phông chưa cài lấy số công bố (không tải về máy), ghi "~".

| Tiêu chí | **Be Vietnam Pro + số Inter (hiện tại)** | Inter (đã cài) | Noto Sans | Source Sans 3 | IBM Plex Sans | Lexend |
|---|---|---|---|---|---|---|
| Đủ 134 chữ Việt dựng sẵn | **đủ, 0 thiếu (đo)** | **đủ, 0 thiếu (đo)** | có (Google Fonts) | có | có | có |
| Chiều cao chữ thường (x-height / em) | 0,530 (đo) | 0,546 (đo) | ~0,536 | ~0,486 | ~0,516 | ~0,5 |
| Rộng câu mẫu tiếng Việt (em) | 30,3 (đo) | 29,9 (đo) | rộng hơn | hẹp hơn | ~ | rộng hơn rõ |
| Chữ số cùng rộng (`tnum`) | không — đang mượn số Inter | có | có | có | có | chưa rõ |
| Đỉnh dấu chồng chữ hoa "Ỗ" | 1,147 em (dấu to, rõ) | 1,087 em (gọn) | | | | |
| Gợi ý tối thiểu line-height để không xén "Ỗ" khi cắt chữ | 1,5 | 1,4 | | | | |
| Thiết kế | nhóm người Việt, cho tiếng Việt | quốc tế, hỗ trợ đủ | trung tính, rộng | nhỏ chữ | có cá tính | cho đọc dài, rất rộng |

**Khuyến nghị: GIỮ Be Vietnam Pro + chữ số Inter.** Lý do:
1. Đủ tiếng Việt (đo 0 thiếu); dấu do người Việt vẽ, to và rõ ở cỡ nhỏ — đúng yêu cầu "tiếng Việt đúng, không lỗi phông".
2. Đổi sang Inter chỉ được +3 % chiều cao chữ (≈ 0,45 px ở 15 px) và hẹp hơn 1,3 %. Tăng cỡ 13 → 15 được +15 %, gấp 5 lần.
3. Phông đã duyệt (PR-SANG): không phải làm lại mọi mockup, không thêm tệp tải.
Loại: Source Sans 3 (chữ thấp → phải tăng px nhiều hơn); Lexend (rộng → bảng dài thêm); Noto Sans (rộng hơn, không hơn BVP về chiều cao chữ).

**Thang cỡ mới — 7 bậc: 12 · 13 · 14 · 15 · 17 · 22 · 28**

| Vai trò | Hiện tại | **1440** | **375** | Đậm | Line-height |
|---|---|---|---|---|---|
| Tiêu đề trang | 18 / 600 | **22** | **20** | 700 | 1,3 |
| Tiêu đề khối + tiêu đề panel (một cỡ) | 11,5–17 | **17** | **17** | 700 | 1,35 |
| Tiêu đề mục / hàng nhóm (lớp) | 11 IN HOA / 12,5 | **15** | **15** | 700 | 1,4 |
| Chữ thường · ô bảng · tên trong dòng việc · nút `.btn` · menu | 13–14 | **15** | **15** (ô nhập **16**) | 400 (tên, việc, nút: 600) | 1,5 |
| Ô lưới dày (lưới điểm FT / lớp thường, Kế hoạch Test) | 11–13 | **14** | thẻ: 15 | 400 | 1,45 |
| Số điểm trong ô | 13 / 700 | **15** | **16** | 700 | 1,3 |
| Cột Kỳ vọng / Overall | 15 / 800 | **15** (bằng số điểm) | 16 | 800 | |
| Số lớn (thẻ Mock, chỉ số Tổng quan) | 28 / 13 | **28** | 26 | 700 | 1,1 |
| Chữ phụ · nhãn ô · đầu cột · chip · nút nhỏ `.btn-sm` | 11–12 | **13** | **14** (chip 13) | 400 / nhãn, đầu cột, chip, nút 600 | 1,45 |
| Số đếm trong huy hiệu (badge) | 11,5 | **12** | 12 | 700 | — |
| Thanh dưới 375 | 11,5 | — | **12** (≤ 5 nút) | 600 | |

Luật kèm:
- **Không chữ < 12**. Chữ mang dữ liệu (ô bảng, điểm, tên, hạn) **≥ 13** ở 1440, **≥ 14** ở 375.
- **Không in hoa** chữ tiếng Việt (mở rộng luật "đầu cột không in hoa" cho mọi tiêu đề mục, nhóm thông báo).
- Line-height: chữ nhiều dòng ≥ 1,45; chữ một dòng có cắt (`truncate`) ≥ 1,5; tiêu đề ≥ 1,3. Cấm `leading-none` / `leading-tight` cho chữ có dấu.
- Đậm: 400 thường · 600 nhãn, nút, tên · 700 tiêu đề, số · 800 chỉ cột nổi bật. Bỏ 800 ở chữ nhỏ (dấu chồng dày đặc).
- Ô cao: chip 24 px (375: 28), nút nhỏ 32 px (375: 44), hàng bảng một dòng ≥ 40 px, hai dòng ≥ 60 px.

**Quy tắc "không nhồi" — mật độ bảng mới**

| Mục | Số |
|---|---|
| Hàng bảng 1 dòng | 15 × 1,5 + đệm 2 × 8,8 = **40 px** (nay 37) — +8 % |
| Hàng bảng 2 dòng | **≈ 63 px** (nay 57) — +11 % |
| Cột tên học viên | **≥ 205 px** ("Nguyễn Thị Phương Thảo" 15 px = 181 px + đệm 24). Nay lưới FT 176 px → đã cắt chữ ngay ở 14 px |
| Cột số điểm | **≥ 66 px** ("6.5" 15 px đậm 24 + ✓ 14 + khe 4 + đệm 24). Lưới FT 72 px → đủ |
| Cột mã tuần | ≥ 84 px |
| Một hàng = một dòng chính | dòng 2 chỉ khi mang tin mới (không lặp chip / kết quả) |

**Ước tác động độ dài trang** [ƯỚC — đo lại bằng script khi làm]
- Bảng 33 em, một dòng: 33 × 40 = 1 320 px (nay ~1 220). Nếu giữ hai dòng: 33 × 63 = 2 080 px → **giữ một dòng tiết kiệm ~760 px**.
- Hồ sơ lớp: 4 800 → ~5 250 (1440); 10 640 → ~11 600 (375) nếu không bù.
- Bù (đã có trong kế hoạch 20/10, X4–X5): bỏ lưới điểm 33 em nối dưới mọi tab (−2 200 px / −2 822 px ở 375); hàng em một dòng (−~660 px); lưới FT: đưa cột "MT" (56 px) lên đầu bảng khi cả lớp cùng lượt + gộp "Trạng thái" và "Hạn" thành một cột → đủ chỗ cho cột tên 205 px mà bảng vẫn 1 400 px.
  → Hồ sơ lớp sau sửa ước ~2 400–2 900 px (1440), ~8 000 px (375).

**Cách kiểm khi làm**
1. Trang mẫu chữ trong `/dev/thanh-phan`: mỗi vai trò × sáng / tối × 1440 / 375, chuỗi kiểm: "Nguyễn Thị Phương Thảo · Đỗ Vũ Tuấn Phong · Hồ Ngọc Diệp · ỖNG ẶC ỮA ẪN ỄNH · khuỷu, nghiễm, chuyện, quyết · 6.5 7.0 · W2 OCT · 18/09".
2. Script DOM (mở rộng `SCR\b\do-dom.mjs`, đưa vào `scripts/`): đo mọi nút chữ thấy được — lỗi nếu < 12; chữ trong `td` / dòng việc < 13 (1440) hoặc < 14 (375); `text-transform: uppercase` có ký tự Việt; phần tử `truncate` có `scrollHeight > clientHeight + 1` (xén dấu); số cặp (cỡ, đậm) khác nhau mỗi trang ≤ 8; chiều cao `<main>` từng trang ghi vào bảng nghiệm thu.
3. Phép kiểm tĩnh (kiểu `prSang`): chặn thêm mới `text-[11px]`, `text-[11.5px]`, `uppercase`, `leading-none` cạnh `truncate`.
4. Ảnh cặp trước / sau cùng màn, cùng vai.

**Rủi ro:** bảng rộng hơn khung ở 1280–1439 (đã có khung cuộn riêng `index.css:197`); chữ cắt ở cột hẹp; trang dài thêm nếu làm chữ trước khi bỏ khối trùng → **làm cùng PR khung trang / theo màn**, không đổi cỡ toàn web một lần rồi để đó.

**Câu hỏi cho chủ SP**
- A-Q1. Đồng ý giữ phông Be Vietnam Pro, chỉ tăng cỡ + sửa line-height? — **Khuyến nghị: đồng ý.**
- A-Q2. Chấp nhận ô bảng 15 (lưới điểm 14), trang tạm dài thêm ~8–10 % cho tới khi bỏ khối trùng ở cùng màn? — **Khuyến nghị: đồng ý; mỗi PR màn phải bù trong chính PR đó.**

---

## B. Màu trực tiếp lên số điểm — [ĐÃ CHỐT: tô chính con số, nhất quán mọi chỗ]

### B1. Kiểm kê mọi nơi hiện điểm [ĐÃ KIỂM]

Luật so dùng chung: `soKyVong(band, kỳVọng)` (`shared/domain/chipSos.ts:82-86`) — làm tròn 0,1: > = vượt, = bằng, < = dưới.

| # | Nơi | Tệp:dòng | Đang tô gì | Luật |
|---|---|---|---|---|
| 1 | Lưới điểm FT — ô L / R / S (Test, panel Nhập điểm lớp) | `HopNhapDiem.tsx:160-181` (gọi từ `LuoiFT.tsx:310-312`) | số trắng 13 đậm; **chỉ ✓/✗ 12 px có màu** | soKyVong, chỉ khi lưới có cột Kỳ vọng |
| 2 | Lưới FT — ô W1 / W2 | như trên | số thường 12, không ký hiệu | — |
| 3 | Lưới FT — cột W tổng | `LuoiFT.tsx:380-389` | trắng đậm + ✓/✗ | soKyVong |
| 4 | Lưới FT — cột Kỳ vọng, Overall | `LuoiFT.tsx:404-405` | 15 đậm 800 trắng trên nền nhấn; **Overall không so, không màu** | — |
| 5 | Hộp nhập điểm (đang gõ) | `HopNhapDiem.tsx:372-391` | Band trắng + ▲/▼ màu | soKyVong (xem trước) |
| 6 | Hồ sơ Mock — thẻ lớn | `ODiemLon.tsx:113-118`, `152-154` | kỹ năng 28 px **ĐỎ khi dưới**, trắng khi đạt + ✓/✗ 14; Overall trắng | `v.passed` + soKyVong |
| 7 | Học viên & Lớp — cột OVR L R W S | `BangHocVienLop.tsx:60-70` | trắng đậm + ✓/✗ 12; W1·W2 11 px xám | soKyVong, lượt mới nhất (OVR cũng so) |
| 8 | Hồ sơ lớp — cột band | `ClassRoster.tsx:356-367` | trắng 13 đậm + ✓/✗; mốc cũ 12 xám | soKyVong. **Bản deploy tô chính con số** (xanh / đỏ, 12 px) — OV-15b (#469) đổi sang chỉ ký hiệu |
| 9 | Kết quả thi (Phân tích) | `KetQuaThi.tsx:82-90, 161-163, 286-287` | kỹ năng trắng + ✓/✗ **11 px**; OVR, Kỳ vọng 15 trắng; chữ "Đạt / Chưa đạt" 12 màu | `x.dat` (máy chủ); vượt = band > kỳ vọng |
| 10 | Hồ sơ HV — tab Test | `StudentDetailPage.tsx:497-503, 571-572` | điểm kỹ năng là **link màu nhấn xanh**; Overall trắng; Kỳ vọng thường | — |
| 11 | Hồ sơ HV — Hành trình | `HanhTrinh.tsx:398` | đỏ đậm khi "xấu", còn lại trắng | `m.xau` |
| 12 | Bảng kỹ năng Case | `SkillBoard.tsx:616-626, 669-680, 747-753`; `TheKyNang.tsx:61-66` | **chip có nền** 3 màu (đỏ / xanh dương / xanh lá) + chênh; lịch sử điểm tô 3 màu; **KCK dưới kỳ vọng = xám** | band vs kỳ vọng; OV-9 KCK |
| 13 | Lớp thường — lưới nhập | `ScoreEntry.tsx:742, 778` (+ dòng phụ `472-479`) | số **đỏ khi chưa đạt**, đạt không màu; "Đạt / Chưa đạt · %" 12 | ≥ 70 % (Rulebook §94, §772) |
| 14 | Lớp thường — % tổng, cột Kết quả | `LuoiThuong.tsx:540-542, 598-610` | % xanh / đỏ; chip Level ok / danger / muted | `chip.dat`, `ketQuaThuong` |
| 15 | Bảng điểm lớp thường (hồ sơ lớp) | `BangDiemLopThuong.tsx:224-232, 208-210` | số đỏ + ▾ khi trượt; % trắng 12 | outcome fail |
| 16 | Panel nhập một kỹ năng | `MotKyNang.tsx:131` | dòng phụ đỏ khi trượt | |
| 17 | Phân tích GV — % ô kết quả | `PhanTichGiaoVien.tsx:43, 110-116` | % 3 màu: đỏ < 50 · **vàng** 50–69 · xanh ≥ 70 | Rulebook §845 |
| 18 | Target | `ui.tsx:458-466` (`TargetText`) | trắng, không so | Target không phải điểm thi |
| 19 | `BandCell` | `ui.tsx:438-449` | không còn nơi dùng → **xoá** | — |

→ **6 cách tô** cho cùng một ý "điểm so với mức cần": chỉ ký hiệu (1, 3, 7, 8, 9) · số đỏ khi dưới (6, 11, 13, 15) · chip nền 3 màu (12) · link xanh (10) · % 3 mức (17) · không tô (4).

### B2. Luật màu cho CON SỐ [ĐỀ XUẤT]

| Mức | Khi nào | Con số | Ký hiệu (giữ, để không chỉ dựa màu) |
|---|---|---|---|
| Vượt kỳ vọng | FT: band > kỳ vọng của đúng lượt | `--kq-vuot` (xanh lá), đậm 700 | ✓ cùng màu |
| Bằng kỳ vọng | FT: band = kỳ vọng | `--kq-bang` (xanh dương **khác màu nhấn**) | ✓ cùng màu |
| Dưới kỳ vọng | FT: band < kỳ vọng | `--kq-duoi` (đỏ) | ✗ cùng màu |
| Đạt / chưa đạt (lớp thường) | ≥ 70 % / < 70 % | `--kq-vuot` / `--kq-duoi` | ✓ / ✗ (thay ▾ hiện nay) |
| Chưa đủ điểm · không có kỳ vọng · KCK dưới kỳ vọng · MT lịch sử · mốc cũ | — | chữ thường `--text` (mốc cũ: `text-faint`) | không ký hiệu; KCK ghi chữ "KCK" |
| Ô đang gõ / hộp xem trước | chưa lưu | **không tô** | ▲/▼ xem trước giữ như nay |
| Kỳ vọng, Target | giá trị tham chiếu | không tô | — |

Áp cho 17 nơi ở B1 (Target giữ trung tính, `BandCell` xoá): một thành phần `SoDiem` (số + ký hiệu, cỡ theo ô) thay mọi chỗ; ký hiệu `DauKetQua` lên **14 px** (đi với số 15); số là link (nơi 10) → không dùng màu link, gạch chân khi rê chuột.

**Bảng hex đề xuất + tương phản thật (WCAG) trên 9 nền thật** — tối thiểu 4,5:1

| Token | Tối | Sáng | Thấp nhất (tối) | Thấp nhất (sáng) |
|---|---|---|---|---|
| `--kq-vuot` | `#86efac` | `#166534` | 8,30 (hàng đã thi) | 5,80 (nút rê chuột) |
| `--kq-bang` | `#a5b4fc` | `#1e40af` | 5,85 (hàng đã thi) | 7,09 (nút rê chuột) |
| `--kq-duoi` | `#ff8282` | `#c81e1e` | 4,87 (hàng đã thi) | 4,67 (nút rê chuột) |
| chưa đủ / trung tính | `--text #dde5f2` | `--text #0f172a` | 9,20 | 14,52 |

9 nền đã thử: nền trang, thẻ, nút ô điểm (`surface-2`), nút rê chuột, hàng nhóm, hàng con, hàng đã thi, cột nổi bật (nhấn 14 % / 8 %), hàng hover mới (8 % / 9 %).

**So với bộ màu đang dùng (token `ok` / `doing` / `bad`)**

| Cặp | Đang dùng — thường · mù đỏ-lục (deutan) · protan | Đề xuất — thường · deutan · protan |
|---|---|---|
| vượt ↔ dưới (tối) | 24,2 · **1,3** · 12,5 (ΔL 2,1) | 29,2 · **11,4** · 23,1 (ΔL 12,3) |
| vượt ↔ dưới (sáng) | 27,3 · 4,7 · 13,6 | 29,1 · 12,1 · 4,7 (ΔL 8,7) |
| bằng ↔ màu nhấn / link (tối · sáng) | **2,4 · 0,0** | 5,2 · 8,1 |
| dưới ↔ SOS 3 hồng (tối) | 8,9 | 8,9 |
| dưới ↔ quá hạn cam (tối) | 7,1 | 5,6 |
| Tương phản `ok` sáng trên nút rê chuột / hàng đã thi | **4,38 / 4,47 — dưới 4,5** | 5,80 / 5,90 |

(ΔE OKLab × 100: < 5 dễ lẫn, ≥ 10 phân biệt nhanh.)

**Lý do:** bộ hiện tại với người mù đỏ-lục (~5–8 % nam giới) thì xanh lá và đỏ gần như một màu ở chế độ tối; đề xuất tách bằng **độ sáng** (xanh sáng hơn, đỏ tối hơn) nên vẫn phân biệt khi mất màu. Xanh dương "bằng" lệch về chàm để không trông như link / mục đang chọn. Token riêng `--kq-*` → không đụng chip trạng thái, nút, chữ khác.
**Không lẫn SOS:** SOS chỉ dùng viền chip + chữ "SOS n"; số điểm không có viền / nền. Quá hạn luôn kèm ⚠.

**Rủi ro**
- Protan ở chế độ sáng: vượt ↔ dưới ΔE 4,7 — vẫn dựa ✓/✗ (giữ ký hiệu là bắt buộc).
- Đỏ "dưới" (tối) gần cam "quá hạn" (ΔE 5,6) — chấp nhận vì quá hạn luôn có ⚠ và không đứng trong ô điểm.
- Đổi cách tô ở 17 nơi: làm một thành phần chung, không sửa tay từng nơi; phép kiểm chặn `text-rose-*` / `text-emerald-*` trên số điểm.

**Câu hỏi cho chủ SP**
- B-Q1. Overall FT tô theo cùng luật (so kỳ vọng của lượt)? — **Khuyến nghị: có** (Kết quả thi đã dùng "Đạt = OVR ≥ kỳ vọng"; nay ô Overall ở lưới không so gì).
- B-Q2. Em **KCK** dưới kỳ vọng: số trung tính + chữ "KCK" ở mọi nơi (như bảng kỹ năng Case theo OV-9)? Nay lưới điểm / hồ sơ lớp vẫn hiện ✗ đỏ. — **Khuyến nghị: có** (áp đúng quyết định OV-9 cho đồng bộ; không đổi luật).
- B-Q3. Bảng kỹ năng Case bỏ **nền chip** điểm, dùng cùng dáng "số màu + ✓/✗"? — **Khuyến nghị: có** (một dáng; X7).
- B-Q4. Phân tích GV giữ 3 mức Rulebook §845 (vàng 50–69 %)? Vàng trùng nghĩa "sắp hạn / SOS 1" ở trang khác. — **Khuyến nghị: giữ** (luật nghiệp vụ; trang đó không có chip SOS), chỉ đổi đỏ / xanh sang token `--kq-*`.

---

## C. Hover + trạng thái vùng tương tác toàn web (góp ý II.6)

### C1. Kiểm kê [ĐÃ KIỂM] — ΔL OKLab × 100 giữa nền hover và nền chứa (|ΔL| < 4 = gần như không thấy)

| Thành phần | Lớp / token | Tối ΔL | Sáng ΔL | Ghi chú |
|---|---|---|---|---|
| Hàng bảng (31 tệp: Lớp cần chú ý, Học viên & Lớp, hồ sơ lớp, Kết quả thi, Phân tích GV, lưới điểm …) | `.row-hover` = phủ 4 % (`index.css:268`) | **+3,6** | **−2,8** | gần như không thấy |
| Dòng việc Công việc / Tổng quan, mục menu ⋯, thông báo, mục menu trên, chọn người | `hover:bg-white/5` (21 chỗ: `WorkList.tsx:99,163`, `MenuDong.tsx:126`, `Header.tsx:258`, `App.tsx:92` …) | +4,5 | −3,6 | mờ — đúng lời chủ SP (ảnh 5) |
| Nút `.btn` | `--nut-hover` vs `surface-2` | +3,2 | −4,3 | mờ |
| Nút trong suốt `.btn-ghost` | phủ 10 % | +8,8 | −6,9 | rõ |
| Chip lọc `.nut-loc` | `filter: brightness(1.2)` trên nền trong suốt | ~0 nền | ~0 | chỉ viền / chữ sáng nhẹ |
| Số bấm được `SoLieuO` | gạch chấm + `hover:text-white` | chữ #dde5f2 → #fff | rất nhỏ | vùng bấm 8×12 px (B-02) |
| Chip có số `MenuDong`, `HocVienCuaToi` | `hover:brightness-125` | | | |
| Tab | chỉ đổi màu chữ | | | |
| Hàng nhóm bảng `HangNhom` (`tr.hang-lon cursor-pointer`) | **không có hover** | 0 | 0 | bấm được mà không có phản hồi |
| Đầu khối danh sách `.khoi-nhom-dau` (Công việc, Lịch Test) | **không có hover** (`cursor:pointer`) | 0 | 0 | như trên |
| "Cần bạn quyết" (Tổng quan) | `<li>` không hover; nút "Mở Case" riêng | — | — | đúng (hàng không bấm được) |
| Hàng đang chọn | `.row-active` viền khung 2 px nhấn (`index.css:274-277`) | rõ | rõ | đã chốt 17/10 — giữ |
| Focus bàn phím | `:focus-visible` viền 2 px nhấn, lệch 2 px (`index.css:144`) | rõ | rõ | giữ |

**Lỗi cấu trúc (vì sao hover "lúc có lúc không")** [ĐÃ KIỂM]
- `.row-hover:hover` tô nền **`<tr>`**, nhưng `<td>` nào có nền riêng thì che mất: cột tên dính (`.sticky-col` nền `surface`, `index.css:281`), hàng nhóm / hàng con (`index.css:289, 305`), hàng đã thi (`index.css:271`). → rê chuột lên lưới điểm: cả hàng sáng **trừ cột tên**.
- Hàng tổng "Cả Monbay" dùng nền `bg-white/5` (`TongQuanQl.tsx:160`) — chỉ khác hàng đang rê ΔL 0,9 (tối) / 0,8 (sáng): **hàng đang rê trông như hàng tổng**.
- **Trông bấm được mà không bấm được:** 29/35 chỗ dùng `.row-hover` là hàng **không** bấm được cả hàng (vd `TongQuanQl.tsx:160`, `ClassRoster.tsx:240`, `KetQuaThi.tsx:157`, `LuoiFT.tsx:329`); chỉ 6 chỗ có `onClick` (`MgmtTasksPage.tsx:228`, `CatalogAdmin.tsx:93`, `StudentDetailPage.tsx:558, 656`, `PhoiHopSosSection.tsx:88`, `ClassYThucCard.tsx:341`). Thêm: số gạch chấm chết (A1-01); chip viền vuông "L R W S" (`CHIP_VUONG`) trông như nút.
- **"Đang chọn" 4 dáng:** viền 2 px (`.row-active`, đúng chốt 17/10) · nền nhấn nhạt cho lượt đang xem (`StudentDetailPage.tsx:559`) · nền nhấn nhạt cho hàng đã tích chọn nhiều (`ClassRoster.tsx:240`, `BangDiemLopThuong.tsx:168`, `BangLoTrinhTiep.tsx:247`) · nền trắng 6 % (`ClassYThucCard.tsx:341`).
- **Bấm được mà không trông bấm được:** hàng nhóm `HangNhom`, đầu khối `.khoi-nhom-dau`, số `SoLieuO` (hover gần như không đổi).
- Bậc nền hiện tại (tối): thẻ → hàng nhóm +4,2; thẻ → hàng con −4,3. Hover +3,6 **nhỏ hơn một bậc cấp** → mắt không biết đó là hover hay cấp khác.

### C2. Một hệ trạng thái [ĐỀ XUẤT]

| Trạng thái | Cách hiện | Token / số |
|---|---|---|
| Mặc định | nền theo cấp: trang `bg` → khối `surface` → hàng nhóm `--hang-lon-bg` + vạch trái 3 px → hàng / hàng con `--hang-con-bg` thụt 32 px | giữ token hiện có |
| **Hover — thứ bấm được** (cả hàng, mục menu, dòng việc, hàng nhóm, đầu khối, thông báo) | phủ lên **trên** nền riêng của từng ô (`background-image`, không thay `background`) → hiện cả ở cột dính, hàng nhóm, hàng đã thi; `cursor:pointer` | `--hover-phu`: tối `rgb(255 255 255 / .08)` (ΔL +5,8…+8,4 trên 6 nền), sáng `rgb(15 23 42 / .09)` (ΔL −5,8…−6,3) — **ΔL ≥ 5,8 trên mọi nền, lớn hơn một bậc cấp (4,2–4,4)** |
| Dò hàng — bảng ≥ 8 cột có ô bấm được bên trong (lưới điểm, Kế hoạch Test) | phủ nhẹ, **không** đổi con trỏ | `--do-hang-phu`: tối .035, sáng .045 (ΔL ≈ 3) |
| Hàng chỉ đọc, ít cột | **không hover** | bỏ `.row-hover` |
| Chạm (375) | `:active` = cùng phủ hover | |
| Focus bàn phím | viền 2 px `--accent-strong`, lệch ngoài 2 px (giữ `:focus-visible`), cả `<tr>` / hàng | khác "đang chọn" vì nằm **ngoài**, đang chọn nằm **trong** |
| Đang chọn / đang xem | viền khung 2 px `--accent` trong hàng (đã chốt 17/10), không tô nền — áp cả `StudentDetailPage.tsx:559`, `ClassYThucCard.tsx:341` | giữ `.row-active` |
| Đã tích (chọn nhiều để làm hàng loạt) | ô tích + nền nhấn nhạt `--accent-soft` (khác "đang xem" vì không có viền) | giữ như `ClassRoster.tsx:240` |
| Đang mở (nhóm / nguồn của panel đang mở) | mũi tên xoay + `aria-expanded`; hàng nguồn = đang chọn | giữ |
| Tắt | mờ 45 %, `cursor:not-allowed`, không hover | giữ `.btn:disabled` |
| Hàng tổng ("Cả chi nhánh") | không dùng nền phủ; chữ đậm + viền trên `--line-strong` | bỏ `bg-white/5` |

Thực hiện gọn: 2 lớp CSS dùng chung `.hang-bam` (hover + con trỏ + :active) và `.hang-do` (dò hàng) thay `.row-hover` (31 tệp) và `hover:bg-white/5` (21 chỗ); `HangNhom` / `.khoi-nhom-dau` nhận `.hang-bam`. Nút `.btn:hover` = `surface-2` + `--hover-phu`.
**Lý do:** một luật, một token; hover luôn lớn hơn bậc cấp nên không nhầm cấp; hàng không bấm không giả vờ bấm được (impeccable operate: "every interactive component has default, hover, focus, active, disabled").
**Rủi ro:** bỏ hover ở bảng chỉ đọc làm mất "dò hàng" ở vài bảng rộng — giữ `.hang-do` cho bảng ≥ 8 cột.

**Câu hỏi cho chủ SP**
- C-Q1. Bảng không bấm được: bỏ hover hẳn, chỉ giữ "dò hàng" nhẹ cho bảng ≥ 8 cột? — **Khuyến nghị: đồng ý.**

---

## D. Thứ tự menu — [ĐÃ CHỐT: Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor]

**Hiện trạng** [ĐÃ KIỂM] — `shared/domain/dieuHuong.ts:46-55` (một mảng `KHU_VUC`, lọc theo cờ quyền `server/src/platform/nav.ts:14-50`; quyền vai đọc từ DB demo):

| Vai | Thứ tự hiện tại | Sau khi đổi | Trang đầu |
|---|---|---|---|
| Quản trị (QT) | Tổng quan · Học viên & Lớp · Test · **Phân tích · Công việc** · Tutor | Tổng quan · Học viên & Lớp · Test · **Công việc · Phân tích** · Tutor | `/` Tổng quan ("Việc hôm nay") |
| Quản lý (QL) | như QT (có `tutor.view`) | như QT | `/` Tổng quan |
| Admin văn phòng | Tổng quan · Học viên & Lớp · Test · **Phân tích · Công việc** | … Test · **Công việc · Phân tích** | `/` ("Mock Test") |
| Giáo viên | Học viên & Lớp · Test · Công việc | không đổi | `/cong-viec` (quyết định 19/10, `OverviewPage.tsx:70`) |
| TVV | Tổng quan · Học viên & Lớp · Phân tích | không đổi | `/` ("Học viên của tôi") |
| CX | Tổng quan · Học viên & Lớp · Phân tích | không đổi | `/` ("Số liệu") |
| Head tutor | Tutor | không đổi | `/tutor` |

- Bản deploy: Tổng quan · Học viên & Lớp · Test · Công việc (chưa có Phân tích, Tutor). OV-15e (#462) chen Phân tích **trước** Công việc; TU-a (#475) thêm Tutor cuối.
- **Chỗ phải đổi:** đưa dòng `phan-tich` xuống sau `cong-viec` ở `dieuHuong.ts:51-52` (thanh trên + thanh dưới cùng đọc mảng này). Sửa 2 phép kiểm khẳng định thứ tự cũ: `server/src/tests/prOv15e.tests.ts:84`, `server/src/tests/khung.tests.ts:50`. Mockup 1 (khung 2a/2b) vẽ Công việc đầu — **quyết định 20/10 thắng**; ghi vào bảng truy vết để không ai "sửa lại theo mockup".
- **Thanh trên bị cắt ở 1 280 px** (A1-05, đo 587 px cần / 570 px có). Đo phông: 6 mục ở 14 px cần ~601 px, ở 15 px cần ~628 px → **tăng chữ làm cắt nặng hơn**. Đề xuất: dưới 1 440 px ô tìm thu thành nút kính lúp (như 375) → đủ chỗ 6 mục đủ tên; dưới ~900 px dùng tên ngắn ("Học viên") + gom "Thêm ▾".
- **Thanh dưới 375:** QT / QL có 6 nút, mỗi ô 62,5 px; "Tổng quan" 11,5 px đậm đã rộng 60,8 px — **hết chỗ**; lên 12–13 px là cắt chữ. Đề xuất: tối đa 5 nút (75 px / ô): Tổng quan · Học viên · Test · Công việc · **Thêm** (Phân tích, Tutor) — thứ tự giữ nguyên. Admin đúng 5 nút; GV / TVV / CX 3 nút. Head tutor chỉ 1 mục → **ẩn thanh dưới**.
- Logo không bấm được (A1) → bấm logo = về trang đầu của vai.

**Câu hỏi cho chủ SP**
- D-Q1. Chữ "Lớp/HV" trong góp ý: có muốn **đổi tên mục** "Học viên & Lớp" (thuật ngữ đã chốt g1-004, dùng ở 55 tệp + Hướng dẫn)? — **Khuyến nghị: không đổi tên**, chỉ đổi thứ tự.
- D-Q2. 375: QT / QL gom Phân tích + Tutor vào nút "Thêm" (≤ 5 nút)? — **Khuyến nghị: đồng ý.**
- D-Q3. Dưới 1 440 px ô tìm thu thành nút kính lúp để menu đủ 6 mục? — **Khuyến nghị: đồng ý.**

---

## E. Cùng vấn đề ở chỗ khác (ngoài chỗ chủ SP nêu) [ĐÃ KIỂM]

| # | Vấn đề | Bằng chứng | Hướng |
|---|---|---|---|
| E1 | **"Đã lưu ✓" xanh lá 11 px** nằm trong ô điểm — trùng ký hiệu + màu với ✓ "vượt kỳ vọng" | `LuoiFT.tsx:465, 490` | trạng thái lưu dùng màu trung tính + chữ "Đã lưu" / biểu tượng khác, tự ẩn sau 2 s |
| E2 | Tiêu đề mục **IN HOA 11–11,5 px** ở panel, hồ sơ, thông báo | `KhungPanel.tsx:196`, `BangSos.tsx:160`, `DauHoSo.tsx:102`, `TabHocVienLop.tsx:131`, `StudentsPage.tsx:498`, `ClassYThucCard.tsx:321`, `ThangYThuc.tsx:44`, `BanGiaoPanel.tsx:165,180`, `Header.tsx:250` | 15 / 700 chữ thường |
| E3 | Ô Kế hoạch Test 11 px, cao 20 px | `ChipKyNang.tsx:26, 70` (7 chỗ 11 px) | 13 / cao 24 |
| E4 | Hành trình 15 chỗ 11 px | `HanhTrinh.tsx` | 13 |
| E5 | Dòng phụ dưới số điểm 11 px ("n câu", "W1 · W2") | `HopNhapDiem.tsx:142`, `BangHocVienLop.tsx:68` | 13 |
| E6 | Ký hiệu ✓/✗ 11 px ở Kết quả thi | `KetQuaThi.tsx:86` | 14, theo `SoDiem` |
| E7 | Overall không so ở lưới FT và thẻ Mock, nhưng Kết quả thi có "Đạt" theo OVR | `LuoiFT.tsx:405`, `ODiemLon.tsx:152` | B-Q1 |
| E8 | KCK: lưới điểm / hồ sơ lớp hiện ✗ đỏ, bảng kỹ năng Case hiện xám | `chipSos.ts:82` không biết KCK; `SkillBoard.tsx:677` | B-Q2 |
| E9 | Điểm ở hồ sơ HV là link màu nhấn → trông như link, không như kết quả | `StudentDetailPage.tsx:501` | B2 |
| E10 | Tiêu đề trang 18 / 600 ở mã, DESIGN.md ghi 20 / 700; h2 có 7 cỡ | 21 h1, 27 h2 | thang A3 |
| E11 | Hai cỡ tiêu đề panel (17 và 14) | `KhungPanel.tsx:121, 131` | một cỡ 17 |
| E12 | Chữ hạn 13 px bị ép 12 trong dòng việc | `WorkList.tsx:121, 170`, `KhoiCanQuyet.tsx:76` | bỏ `[&>span]:text-xs` |
| E13 | Token `ok` sáng dưới 4,5:1 trên nút rê chuột (4,38) và hàng đã thi (4,47) — ảnh hưởng chữ "Đạt", chip đạt | `index.css:105` | đổi `--ok-rgb` sáng sang `22 101 52` (#166534) |
| E14 | `BandCell` không còn nơi dùng | `ui.tsx:438-449` | xoá |
| E15 | Thanh dưới chỉ 1 nút cho Head tutor | `App.tsx:273-276` | ẩn khi ≤ 1 mục |
| E16 | "Đang chọn" 4 dáng (viền / nền nhấn / nền trắng 6 %) | xem C1 | theo bảng C2 |

---

## Phụ lục — script đã chạy (trong `SCR\nc\`)
- `dem.py`, `tep.py`, `cap.py`, `td.py`, `vaitro.py` — đếm / ghép lớp cỡ chữ hai bản, ô bảng không cỡ riêng, cỡ theo thẻ HTML.
- `font.py`, `rong.py`, `hint.py` — số đo phông (UPM, x-height, cap, dấu chồng, độ rộng chữ, hinting) đọc thẳng tệp WOFF đã cài.
- `mau.py`, `mau2.py`, `mau3.py`, `mau4.py` — tương phản WCAG, ΔE / ΔL OKLab, mô phỏng mù màu; nền hover.
- `vai.cjs` — quyền từng vai trong DB demo (chỉ đọc).
- Diff đã lưu: `diff.txt` (web/src + shared, 6177d36f..HEAD), `ov15a.txt`, `old-*.tsx`.
