> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# impeccable — Assessment B (detector + trình duyệt) + audit kỹ thuật · toàn web PISA · 13/10

Method: single-context Assessment B (agent impeccable-B, N = 8, web http://127.0.0.1:5518, bản build main, ngày demo 14/09/2026).
Công cụ: CLI `impeccable detect` 4.5.2 · `impeccable live-server` cổng 8400 → `detect.js` tiêm vào trang đã đăng nhập (Playwright Chromium headless) ·
đo tay bằng script `$SP/pw/ib/do.mjs` (màu computed, kích thước, React props, Tab). Dữ liệu thô: `$SP/ket-qua/impB/` (detect-src.json, trang.json, chay.log).
Ảnh: `$SP/anh/impeccable-B/<trang>__<khổ>.png` (sạch) và `…__overlay.png` (có lớp phủ detector, chỉ 1440).

## (a) Deterministic scan — CLI `impeccable detect --json web/src` (205 tệp) + `index.html`

Exit 0 (chỉ có advisory). **15 phát hiện, 2 luật, 0 lỗi chặn.** `index.html`: 0.

| Luật | Số | Vị trí | Xác minh |
|---|---|---|---|
| `design-system-font-size` (advisory) | 14 | 15px ×9: `App.tsx:156` (chữ PISA ở thanh trên điện thoại), `TheKyNang.tsx:63` (điểm ô kỹ năng), `ClassOverviewPage.tsx:185` (h2), `HopNhapDiem.tsx:426` (tên em trong hộp), `ChuongLop.tsx:82` (h3), `DauHoSo.tsx:291,313,317` (chip OVR/điểm), `MockTestAdmin.tsx:59` (h2) · 16px `ChuongLop.tsx:125` · 17px `DauHoSo.tsx:226,239` (tên HV đầu hồ sơ) · 28px `ODiemLon.tsx:121,157` (điểm lớn MT) | **Đúng luật nhưng không phải lỗi giao diện**: đều là tiêu đề / số lớn. DESIGN.md chỉ ghi cỡ thân (14), nhãn (12), đầu cột (11), hàng nhóm (12.5), chip (11.5) — **thiếu bậc tiêu đề**. Mã đang dùng thực tế: 15 px = tiêu đề khối (9 chỗ), 17 = tên đầu hồ sơ, 28 = số điểm lớn. Đề xuất cho planning: ghi bậc "tiêu đề khối 15 / tên hồ sơ 17 / số lớn 28" vào DESIGN.md (không đổi mã). 16 px ở `ChuongLop.tsx:125` là bậc lẻ duy nhất → nên về 15 hoặc 17 (P3). |
| `design-system-radius` (advisory) | 1 | `index.css:141` `:focus-visible { border-radius: 4px }` | **Dương tính giả**: bo của vòng focus, không phải hình khối. Có thể ghi `ignore-value 4px` (planning quyết). |

Không có phát hiện về gradient, glassmorphism, đổ bóng lớn, phông cấm, màu viết cứng — khớp DESIGN.md "Don't".

**Grep bổ sung (máy không bắt):**
- Màu viết cứng ngoài `index.css`: **0** hex / `rgb()` cứng trong `web/src/**/*.ts(x)` (2 kết quả `#119`, `#126` là số rà trong chú thích). Mọi `style={{…}}` màu đều là `rgb(var(--x-rgb))` (14 chỗ, vd `App.tsx:147,177-178`, `QuickReport.tsx:400,585,595`, `ChuyenLopPanel.tsx:39,481`) — đúng token nhưng viết tay thay vì lớp `bg-soon-bg border-soon-line text-soon` có sẵn (P3, nhất quán).
- Bảng màu Tailwind chưa ánh xạ: chỉ `bg-black` (lớp phủ panel `KhungPanel.tsx:131`, `Drawer.tsx:29`, `HopNhapDiem.tsx:418`) — hợp lý cho scrim ở cả hai chế độ.
- Chữ < 11 px trong mã: **0** (`text-[8-10px]` không có). Cỡ tuỳ ý: 12 ×92, 11 ×87, 11.5 ×64, 12.5 ×43, 13 ×37, 13.5 ×5.
- `outline-none`: 20 chỗ, tất cả trên khối `tabIndex={-1}` (đích focus lập trình: `<main>` `App.tsx:187`, ô lỗi form) hoặc có `focus-visible:ring-2` thay (`ODiemLon.tsx:139`, `PhanTichGiaoVien.tsx:47`) — không phải lỗi.
- `prefers-reduced-motion`: không có chỗ nào; chuyển động chỉ có `.skel` shimmer 1.4 s vô hạn (`index.css:306`), 1 `animate-pulse` (`QuickReport.tsx:391`), chuyển màu 120 ms → P3.
- `xlsx` (429 kB, gzip 142 kB): **chỉ `import()` động** ở 3 chỗ xuất Excel (`NganXuatMt.tsx:120`, `TongHopTestSos.tsx:138`, `YThucPhoiHop.tsx:43`) — không tải khi mở trang (đã kiểm mạng, xem (b)).

## (b) Bằng chứng trong trang (đã đăng nhập) — trang × khổ

**Detector trong trang: CHẠY ĐƯỢC.** `live-server` cổng 8400 → `page.addScriptTag({url:'http://localhost:8400/detect.js'})` sau khi đăng nhập demo (cookie phiên), chờ 3 s, đọc nhóm console `[impeccable] N anti-patterns found` + `window.impeccableDetectAsync()` (JSON có selector). 21 mục × 2 khổ = 42 lượt, 0 lỗi chạy, 0 API ≥ 400, 0 pageerror. Đã dừng live-server; `git status` sạch.
Khổ: **1440 × 900 tối** và **375 × 812 sáng**. Ảnh: `$SP/anh/impeccable-B/<mục>__1440-toi.png`, `…__375-sang.png`, `…__1440-toi__overlay.png`.

| Trang · vai | 1440 tối: detector | 1440: chữ < 4.5:1 | 375 sáng: detector | 375: chữ < 4.5:1 | 375: bấm < 24 / < 44 | Tràn ngang 375 |
|---|---|---|---|---|---|---|
| đăng nhập · chưa đăng nhập | 0 | — | LC1 TO1 | — | – | 0 |
| `/` · QL | NC1 | — | NC1 | — | 36 / 18 | 1 px |
| `/` · GVCN | NC1 | — | NC1 | — | 2 / 5 | 0 |
| `/` · ADMIN | 0 | — | 0 | — | – | 0 |
| `/` · TVV | 0 | — | 0 | — | – | 0 |
| `/` · CX | 0 | — | **EF1** | — | 34 / 7 | **23 px** |
| `/phan-tich` · QL | 0 | — | 0 | — | **79** / 10 | 0 |
| `/quan-tri` · QT | TT2 NC2 | — | LC1 NC2 | — | 0 / 28 | 0 |
| `/hoc-vien` · QL | TT2 | — | LC1 TT2 | — | 0 / 20 | 0 |
| `/hoc-vien/lop/3` · QL | TT1 CP1 NC1 FH1 | 4.28 ("cũ") | TT1 NC1 | — | 24 / 32 | 0 |
| `/hoc-vien/lop/6` · QL | TT1 FH1 NC1 | 1.0 (⋯ ẩn chờ rê chuột) | TT1 ED1 NC2 TO1 | — | 4 / 10 | 0 |
| `/hoc-vien/3` (FT, SOS) · QL | NC1 TO1 | — | NC4 | — | 12 / 9 | 0 |
| `/test` · QL | 0 | — | 0 | — | 0 / 4 | 0 |
| `/test/ke-hoach` · QL | TT3 | — | LC1 TO1 | — | 0 / 1 | 0 |
| `/test/diem-lop?lop=3` · QL | CP1 NC1 | — | LC1 | 4.37 ("cũ") | 2 / 1 | 0 |
| `/mock-test/12` · QL | 0 | 4.43 (✓ aria-hidden) | LC5 | 3.33 (✓ aria-hidden) | 0 / 5 | 0 |
| `/cong-viec` · QL | NC3 | — | NC3 | — | 0 / 17 | 0 |
| `/cong-viec/cho-duyet` · QL | ED1 | — | ED1 | — | 3 / 11 | 0 |
| Panel Sửa thông tin HV (`/hoc-vien/3` › ⋯) | TT1 RT1 NC1 | — | LC5 TT1 RT1 NC4 | — | – | 0 |
| Hộp nhập điểm MT (`/mock-test/12` › ô Listening) | 0 | 4.43 | LC5 | 3.33 | – | 0 |
| Panel Công việc (`/cong-viec` › Nhập điểm › MT1) | LC2 NC4 TO2 | **4.1** | 0 | — | – | 0 |

Viết tắt luật detector: LC low-contrast · NC nested-cards · TT tiny-text · TO text-occlusion · EF edge-flush-cards · CP cramped-padding · FH flat-type-hierarchy · ED em-dash-overuse · RT repeated-container-text.
Cột "chữ < 4.5:1" đã loại dấu trống `—`/`–` (đếm riêng ở P3-1) và chữ trên nút đang tắt (WCAG miễn).

**Tổng luật trong trang (42 lượt): nested-cards 34 · low-contrast 22 · tiny-text 15 · text-occlusion 6 · em-dash-overuse 3 · cramped-padding 2 · flat-type-hierarchy 2 · repeated-container-text 2 · edge-flush-cards 1.**

Xác minh từng luật:
- **low-contrast 22 → ĐÚNG.** 19 là **placeholder ở chế độ sáng 2.5:1** (`#9ca3af` trên `#fff`: đăng nhập, ô tìm `/hoc-vien`, `/quan-tri`, `Tìm lớp…`, 5 ô "Ví dụ: …" của panel Sửa thông tin, 5 ô Nhận xét MT…); 2 là `text-faint` trên hàng đang chọn 4.1:1 (panel Công việc); 1 là chip "cũ" 4.4:1 (sáng).
- **edge-flush-cards 1 → ĐÚNG** (CX 375, khối bị cắt — P1-1).
- **repeated-container-text 2 → đúng về đếm**: "(không bắt buộc)" 9 lần trong panel Sửa thông tin — câu hỏi chữ cho chủ SP (P3-9), không phải lỗi kỹ thuật.
- **flat-type-hierarchy 2 → đúng số đo, không hành động**: h1 18 / h2 15 / thân 14 (bước 1.2). Cỡ chữ đã khoá (DESIGN.md), chế độ Operate dày đặc → chỉ ghi nhận.
- **tiny-text 15 → dương tính giả theo DESIGN.md**: toàn chip 11.5 px (`CHIP_TRON`/`CHIP_VUONG` — DESIGN.md ghi 11.5) và 1 dòng phụ 11.5 px; luật nhà là "không < 11 px" — đạt (0 chữ < 11 px đo được ở 42 lượt).
- **nested-cards 34 → phần lớn dương tính giả**: công tắc phân đoạn (`CongTacKhung` "Fast Track · Lớp thường", "Đang dùng · Đã xoá"), đầu nhóm `.khoi-nhom-dau`, khung lưới trong thẻ; phần còn lại (thẻ kỹ năng trong khối hồ sơ HV, thẻ "Đề xuất PA") là bố cục đã duyệt → không đổi.
- **text-occlusion 6 → dương tính giả**: detector báo chính nhãn lớp phủ của nó ("✦ nested cards", "low contrast text") bị chữ trang đè.
- **cramped-padding 2 → dương tính giả**: đầu bảng sát viền trên khung lưới là chủ ý (bảng trong khung).
- **em-dash-overuse 3 → dương tính giả**: "—" là dấu ô trống, không phải văn xuôi.

**Đo tay thêm (không phụ thuộc detector):**
- **Focus bàn phím**: Tab 25 bước bắt đầu từ `<main>` ở 11 màn (tối) + 3 màn (sáng) và trong 2 hộp/panel: **0 phần tử focus mà không thấy vòng**. Vòng `:focus-visible` 2 px `--accent` tương phản 5.0–8.5:1 với nền (`index.css:138-142`). Panel Sửa thông tin và hộp nhập điểm **giữ focus bên trong** (Tab vòng lại, đúng). Có link "Bỏ qua tới nội dung", `lang="vi"`, 1 vùng `aria-live`. Ảnh: `focus-<màn>-dark.png`.
- **Ô nhập thiếu nhãn**: chỉ 1 — ô `Tìm lớp…` ở `/test/ke-hoach` (`TimLop.tsx:39`, chỉ có placeholder). Mọi ô khác có `<label>`/`aria-label`.
- **Bấm được mà không phải nút**: chỉ `<tr class="hang-lon">` (`HangNhom.tsx:39`, bấm chỗ trống để mở) — có nút mũi tên `aria-expanded` bên trong cho bàn phím → đạt; lớp phủ panel `bg-black/60` (bấm ngoài để đóng) → đạt. **0 nút không tên.**
- **Heading**: `document.title` = "PISA Tracking" ở **mọi** đường dẫn; Tổng quan (5 vai) **không có h1**, Tổng quan TVV **không có heading nào**; `/phan-tich` chỉ có **một `<h2>` rỗng**. Các màn khác có h1 đúng (Học viên & Lớp, Test, Công việc, hồ sơ HV, hồ sơ MT, hồ sơ lớp), không nhảy cấp.
- **Chế độ sáng còn màu tối**: quét nền có độ sáng < 0.2 ở 21 màn 375 sáng → chỉ còn lớp phủ `bg-black/60` (đúng) và nút chính `#1d5fbf` (token sáng). **Không có khối nào kẹt màu tối.** Ngoại lệ duy nhất là màu placeholder không theo token (P1-2).
- **Mạng / hiệu năng**: trang đăng nhập tải 1 gói (`index` 349 kB, gzip 115 kB). Sau đăng nhập mọi màn tải **51 gói = 1 594 kB (gzip 520 kB)** vì `App.tsx:29,122` `NAP_SAN` nạp sẵn 13 màn sau 1.5 s (chủ ý cho chuyển trang nhanh; tệp `/assets` cache 1 năm). **`xlsx` 429 kB không tải ở màn nào** (chỉ khi bấm Xuất Excel). CSS 82 kB (gzip 16 kB).

## (c) Audit 5 chiều — điểm + phát hiện

### Điểm sức khoẻ audit

| # | Chiều | Điểm | Phát hiện chính |
|---|---|---|---|
| 1 | Accessibility | **3** | Focus, nhãn, menu ARIA tốt; trượt: placeholder sáng 2.5:1, tiêu đề tab giống nhau ở mọi màn, h2 rỗng, Tổng quan thiếu h1 |
| 2 | Performance | **3** | Route tách gói + `xlsx` nạp động; nạp sẵn cả 13 màn (520 kB gzip) ngay sau đăng nhập |
| 3 | Theming | **3** | 0 màu viết cứng, chế độ sáng đủ token; placeholder đi theo xám mặc định Tailwind, không theo token |
| 4 | Responsive | **2** | 375 dùng được; CX Tổng quan tràn 23 px cắt chữ; `.btn/.field` 40 px trái luật 44 px; nhiều số / link bấm được rộng 8–21 px |
| 5 | Implementation Integrity | **3** | Hệ token + lớp dùng chung nhất quán; vài chỗ lệch DESIGN.md (`.o-sua` không còn dùng, 40 vs 44 px, thiếu bậc tiêu đề) |
| **Tổng** | | **14/20** | **Good** (sửa chiều Responsive + 3 lỗi a11y) |

### Kết luận Implementation Integrity — **ĐẠT**
Hệ thống riêng của sản phẩm, nhất quán: mọi màu đi qua `index.css` → `tailwind.config.js` (kể cả tên cũ `slate-*`, `rose-*` được ánh xạ về token, đổi theo sáng/tối); detector tĩnh chỉ có 15 advisory (cỡ tiêu đề + bo vòng focus), 0 gradient / glass / bóng lớn / phông lạ. Lệch nằm ở **tài liệu ↔ mã** (DESIGN.md ghi `.o-sua`, 44 px; mã có 40 px và không còn `.o-sua`), không phải ở giao diện "mỗi màn một kiểu".

### Tóm tắt
- **14/20 (Good)** · **P0: 0 · P1: 3 · P2: 7 · P3: 11**.
- Nặng nhất: (1) CX Tổng quan ở 375 tràn ngang, chữ bị cắt · (2) placeholder 2.5:1 ở chế độ sáng (mọi form) · (3) tiêu đề trình duyệt luôn "PISA Tracking" · (4) `.btn/.field` cao 40 px trên điện thoại trong khi luật là 44 · (5) số bấm được trong bảng chỉ rộng 8–21 px.
- Sửa nhỏ, đều nằm trong DESIGN.md (không đổi phông / màu / bố cục).

### P1 — sửa trước khi deploy

**[P1-1] CX › Tổng quan ở 375: hai khối "Điểm đáng chú ý" + "Lịch sắp tới" rộng 382 px trong khung 343 px → `<main>` trượt ngang 23 px, chữ bị cắt** ("dưới kỳ vọng", "(30 ngày qua)", "Xem toàn bộ lịch")
- Vị trí: `web/src/modules/worklist/OverviewPage.tsx:133` — `grid items-start gap-3 lg:grid-cols-2`: dưới `lg` lưới không khai cột → cột ngầm `auto` phình theo nội dung rộng nhất (nghi là dải tab Tuần này / Tuần sau / W1 OCT có số đếm của Lịch sắp tới). QL cùng lưới tràn 1 px (số nhỏ hơn).
- Loại: Responsive · Ảnh: `tran-CX-375.png`, `tq-CX__375-sang.png` · Detector: `edge-flush-cards` (-23 px).
- Ảnh hưởng: CX trên điện thoại đọc thiếu số liệu; cả trang trôi ngang (luật PR-KHUNG "trang không trượt ngang").
- Sửa: thêm `grid-cols-[minmax(0,1fr)]` (giữ `lg:grid-cols-2`) — như dòng 79 cùng tệp đã làm ở `lg`. Không đổi bố cục.
- Lệnh: `/impeccable adapt`.

**[P1-2] Placeholder ở chế độ sáng chỉ 2.5:1 (WCAG 1.4.3 AA)** — 19 ô đo được: đăng nhập, tìm học viên / tài khoản, `Tìm lớp…`, "Ví dụ: 0901 234 567"… trong panel Sửa thông tin, 5 ô Nhận xét Mock Test.
- Vị trí: không có luật `::placeholder` trong `web/src/index.css` → dùng mặc định preflight Tailwind `#9ca3af` (`node_modules/tailwindcss/src/css/preflight.css:333-337`). Tối vẫn đạt (~7:1).
- Loại: Accessibility / Theming · Ảnh: `panel-sua-hv__375-sang.png`, `dang-nhap__375-sang.png`.
- Sửa: một dòng trong `@layer base` của `index.css`: `input::placeholder, textarea::placeholder { color: var(--text-faint); }` (sáng 5.8:1, tối 5.7:1 trên nền ô — token có sẵn).
- Lệnh: `/impeccable polish`.

**[P1-3] Tiêu đề trình duyệt luôn là "PISA Tracking" ở mọi màn (WCAG 2.4.2, mức A)**
- Vị trí: `index.html:7`; không chỗ nào gán `document.title` (grep 0). Đo ở 9 đường dẫn.
- Ảnh hưởng: mở nhiều tab (hồ sơ HV, lớp, Công việc) không phân biệt được; lịch sử trình duyệt, trình đọc màn hình đọc cùng một tên.
- Sửa: đặt `document.title = "<tên màn> · PISA"` theo khu vực / tên đang xem (hồ sơ HV: tên em; lớp: mã lớp) ở chỗ đã tính `khuVucCuaDuong` (`App.tsx`). Ngoài lề: header và tiêu đề ghi "PISA Tracking", PRODUCT.md ghi tên sản phẩm "PISA Progress" → **câu hỏi cho chủ SP** dùng tên nào.
- Lệnh: `/impeccable harden`.

### P2 — đợt sửa kế tiếp

**[P2-1] `.btn` và `.field` trên điện thoại chỉ cao 40 px, trái DESIGN.md / PRODUCT.md (44 px)**
- Vị trí: `web/src/index.css:237-243` (chú thích K3 ghi "≥ 40px") ↔ `DESIGN.md:134` "nút và ô nhập cao tối thiểu 44 px", `PRODUCT.md:51`. Đo: mọi `select.field`, ô tìm, "Xem thêm 10 việc" = 40 px ở 375 (`/quan-tri` 28 mục, `/hoc-vien` 20…).
- Sửa: `min-height: 44px` ở `index.css:242` (một chỗ, mọi màn theo). Hoặc planning sửa DESIGN.md nếu 40 là quyết định cũ. Lệnh: `/impeccable adapt`.

**[P2-2] Số bấm được (mở danh sách) chỉ rộng bằng chữ số: 8–21 px ở 375** — `/phan-tich` 79 nút, Tổng quan QL 36, CX 34.
- Vị trí: `web/src/modules/phanTich/dungChung.tsx:47` (`NutMoDanhSach`), `web/src/modules/worklist/BranchPulse.tsx:105`; mẫu K3 (`index.css:238-239`) chỉ nới **dọc** (`max-sm:py-3 max-sm:-my-3`, 12 chỗ). Ảnh: `phan-tich__375-sang.png` (số "1", "7", "9").
- Ảnh hưởng: chạm số "1" khó trúng (WCAG 2.5.8 có thể vẫn qua nhờ khoảng cách giữa ô, nhưng trượt luật 44 px của sản phẩm).
- Sửa: nới cả ngang cùng mẫu (`max-sm:px-3 max-sm:-mx-3` hoặc `max-sm:min-w-[44px] text-center`) ngay trong `NutMoDanhSach` và nút BranchPulse — không đổi hình. Lệnh: `/impeccable adapt`.

**[P2-3] Link / ô chọn nhỏ < 24 px ở 375**: link tên GV đầu hồ sơ lớp 80×15 (`/hoc-vien/lop/3`, `/lop/6`), link "MT3/MT1" 26×15 trong thẻ em (18 cái), nút "+2" 15×16, link kỹ năng "L" 8×15 và "MT2" 26×15 ở hồ sơ HV, ô chọn 16×16 ở Chờ duyệt (`web/src/modules/duyet/TheYeuCau.tsx:195`, không bọc `<label>`).
- Sửa: áp mẫu K3 (`max-sm:py-3 max-sm:-my-3`) cho các link này; ô chọn bọc vào `<label>` có vùng 44×44 như nút ⋯ (`MenuDong.tsx:101-105` dùng `after:` 44 px). Lệnh: `/impeccable adapt`.

**[P2-4] `<h2>` rỗng ở `/phan-tich`** (trình đọc màn hình đọc "heading, trống").
- Vị trí: `web/src/ui/ui.tsx:14-16` — `Card` vẽ `<h2>{title}</h2>` cả khi chỉ có `action` (gọi từ `TongHopTestSos.tsx`). Sửa: `{title && <h2 …>}`. Lệnh: `/impeccable harden`.

**[P2-5] Tổng quan (QL, GVCN, ADMIN, TVV, CX) không có `h1`; Tổng quan TVV không có heading nào; `/phan-tich` không có heading thật** (WCAG 1.3.1 / 2.4.6, điều hướng bằng heading).
- Sửa: thêm `h1` (có thể `sr-only` như CX đã làm với "Số liệu", `OverviewPage.tsx:128`) — không đổi giao diện. Lệnh: `/impeccable harden`.

**[P2-6] Chữ phụ `text-faint` trên hàng đang chọn chỉ 4.1:1 (tối)** — panel Công việc, dòng con "8 HV", "hạn 08/07".
- Vị trí: `web/src/modules/worklist/WorkList.tsx:141,144` (`row-active` + `text-slate-500`); nền `row-active` = `--accent-soft` trên `surface` = `#23324a` (`index.css:257`). Lỗi theo hệ: mọi `text-slate-500` trong hàng `row-active`.
- Sửa ở một chỗ: `.row-active { --text-faint-rgb: var(--text-dim-rgb); }` trong `index.css` (tối 5.1:1, sáng không đổi — sáng hiện đã 5.2:1). Lệnh: `/impeccable polish`.

**[P2-7] Ô `Tìm lớp…` ở Kế hoạch Test không có nhãn** (chỉ placeholder; `role="combobox"`).
- Vị trí: `web/src/modules/test/keHoach/TimLop.tsx:39`. Sửa: `aria-label="Tìm lớp"`. Lệnh: `/impeccable harden`.

### P3 — làm khi rảnh

- **[P3-1] Dấu ô trống `—` / `–` mờ 1.3–2.6:1** (`slate-600/700` = `--chu-mo*`): 170 dấu ở `/hoc-vien/lop/3`, 59 ở 375. `tailwind.config.js` ghi "CHỈ dấu trang trí", nhưng `—` ở ô điểm/Case nghĩa là "không có". Đề xuất: `—` mang nghĩa dùng `text-faint` (5:1), giữ `slate-700` cho dấu ngăn `·`, `/`, `→` (`ClassRoster.tsx:349`, `BangDiemLopThuong.tsx:241`, `LuoiFT.tsx:317,339`…).
- **[P3-2] Chip "cũ" 11 px 4.3–4.4:1** (`/hoc-vien/lop/3` tối, `/test/diem-lop` sáng) — dùng `text-dim`.
- **[P3-3] Nút ⋯ ở ô lưới lớp thường ẩn (opacity 0) tới khi rê chuột từ ≥ 640 px** (`web/src/modules/cham/LuoiThuong.tsx:425`) — focus bàn phím có hiện; máy tính bảng cảm ứng ≥ 640 px không rê được → không thấy. Đề xuất: chỉ ẩn khi `@media (hover: hover)`.
- **[P3-4] Không có `prefers-reduced-motion`**: `.skel` shimmer vô hạn (`index.css:306`), `animate-pulse` (`QuickReport.tsx:391`). Thêm `@media (prefers-reduced-motion: reduce) { .skel { animation: none } }`.
- **[P3-5] Nạp sẵn cả 13 màn sau 1.5 s đăng nhập** (`App.tsx:29,122`, 1.59 MB / 520 kB gzip) — hợp lý trên máy trung tâm; điện thoại 4G có thể bỏ qua khi `navigator.connection?.saveData`. Lệnh: `/impeccable optimize`.
- **[P3-6] CSS chết + DESIGN.md mô tả component không còn**: `.o-sua`, `.o-doc` (+ token `--o-sua-*`), `.prose-col`, `.box-scroll` (`index.css:166,197,299-301`) — 0 nơi dùng; DESIGN.md mục Components vẫn ghi "Ô sửa trong lưới điểm `.o-sua`". Planning: xoá hoặc ghi lại DESIGN.md.
- **[P3-7] DESIGN.md thiếu bậc tiêu đề** (detector 14 advisory): mã dùng 15 px (tiêu đề khối, 9 chỗ), 17 (tên đầu hồ sơ), 28 (số điểm lớn); 16 px lẻ một chỗ (`ChuongLop.tsx:125`) → về 15. Ghi bậc vào DESIGN.md (planning), không đổi mã.
- **[P3-8] 14 chỗ viết màu bằng `style={{ … rgb(var(--soon-…)) }}`** thay lớp có sẵn `bg-soon-bg border-soon-line text-soon` (`App.tsx:147,177`, `QuickReport.tsx:585,595`, `ChuyenLopPanel.tsx:39`…) — đúng token, chỉ là không dùng lại lớp chung.
- **[P3-9] "(không bắt buộc)" lặp 9 lần trong panel Sửa thông tin HV** (detector `repeated-container-text`) — ô bắt buộc đã có `*`; câu hỏi cho chủ SP có bỏ chữ này không (`/impeccable clarify`).
- **[P3-10] Dải tab ở 375 bị cắt không có dấu cuộn** ("Kế hoạch T…" ở Test, "Phân tích lớp" ở hồ sơ lớp, "Tổng hợp vấn đề HV" ở Phân tích) — cuộn ngang được nhưng không gợi ý. Chỉ làm khi planning đồng ý.
- **[P3-11] Nút tắt 2.0–3.6:1** (`.btn:disabled` opacity .45, `index.css:208`) — WCAG miễn cho thành phần không hoạt động; ghi nhận, không cần sửa.

Không kiểm: phóng chữ 200 %, cử chỉ chạm thật (chỉ giả lập khung 375 trên Chromium headless), Safari / Firefox.

## (d) Mẫu lặp hệ thống

1. **Vùng bấm điện thoại chỉ nới theo chiều dọc**: mẫu K3 `max-sm:py-3 max-sm:-my-3` (12 chỗ) làm số / link cao đủ nhưng rộng vẫn bằng chữ (8–26 px) → ~190 mục < 24 px ở 7 màn đo. Cùng gốc: `.btn/.field` 40 px thay 44 px. Sửa ở 2–3 chỗ dùng chung (`index.css:242`, `NutMoDanhSach`, mẫu K3) là phủ phần lớn.
2. **Chữ phụ trên nền nhấn**: `text-faint` (đạt 4.8–5.9 trên nền thường) tụt 4.1 trên `row-active` / `accent-soft` — một biến trong `.row-active` sửa được cho mọi bảng.
3. **Thành phần trạng thái phụ không qua token**: placeholder (preflight Tailwind) là chỗ duy nhất màu không đổi theo chế độ.
4. **Heading do khung trang không bảo đảm**: `Card` vẽ h2 rỗng, Tổng quan không có h1, tiêu đề tab không đổi — thiếu một chỗ chung "tên màn" cho cả `<h1>` và `document.title`.
5. **Tài liệu lệch mã**: DESIGN.md ghi `.o-sua` và 44 px; mã không có `.o-sua`, dùng 40 px. Nên sửa tài liệu cùng lúc với P2-1.

## (e) Điều đang tốt (giữ và nhân rộng)

- **Token một chỗ, hai chế độ**: 0 hex / `rgb()` cứng ngoài `index.css`; `tailwind.config.js` ánh xạ cả tên cũ về token → chế độ sáng không còn khối nào kẹt màu tối (quét 21 màn).
- **Bảng màu trạng thái đạt AA ở cả hai chế độ**: chip ok/bad/late/soon/doing/done/wait/muted 4.6–11.3:1 trên nền riêng và mọi nền trang; `text-faint` 4.8–5.9, `text-dim` 5.9–7.6.
- **Focus bàn phím mẫu mực**: một luật `:focus-visible` chung 2 px nhấn (5–8.5:1), 0 phần tử mất vòng trên 14 lượt Tab; panel / hộp giữ focus bên trong; có "Bỏ qua tới nội dung"; menu ⋯ có `aria-haspopup`, `aria-expanded`, mũi tên + Tab đóng (`MenuDong.tsx`).
- **Nhãn và tên nút đầy đủ**: 0 nút không tên, 1 ô nhập thiếu nhãn trên mọi màn đo; trạng thái luôn có chữ ("Quá hạn" kèm ⚠, "Cần chú ý" thay chấm màu — `KhoiCanXuLy.tsx:155`).
- **Không chữ < 11 px** (0 trên 42 lượt đo), số `tabular-nums`, chữ số Inter.
- **Tràn ngang được chặn có chủ đích** (`.table-scroll`, `bang-dinh` theo khổ): 20/21 màn ở 375 không trượt ngang.
- **Hiệu năng gọn**: route tách gói, `xlsx` 429 kB chỉ nạp khi bấm Xuất Excel, tệp `/assets` cache 1 năm, không hiệu ứng nặng (chỉ chuyển màu 120 ms).
- **Nút ⋯ có vùng chạm 44 px bằng `after:`** mà không đổi hình (`MenuDong.tsx:101-105`, `HangNhom.tsx:16`) — mẫu nên dùng cho P2-2/P2-3.

## Hành động đề xuất (theo thứ tự)
1. [P1] `/impeccable adapt` — `OverviewPage.tsx:133` thêm `grid-cols-[minmax(0,1fr)]`.
2. [P1] `/impeccable polish` — `::placeholder` dùng `--text-faint` trong `index.css`.
3. [P1] `/impeccable harden` — `document.title` theo màn (+ hỏi chủ SP tên "PISA Tracking" hay "PISA Progress").
4. [P2] `/impeccable adapt` — 44 px cho `.btn/.field` ở `index.css:242`; nới ngang `NutMoDanhSach` / BranchPulse; link nhỏ + ô chọn Chờ duyệt.
5. [P2] `/impeccable harden` — `Card` bỏ h2 rỗng, h1 cho Tổng quan, `aria-label` ô Tìm lớp.
6. [P2] `/impeccable polish` — `.row-active` nâng `--text-faint-rgb`.
7. [P3] planning cập nhật DESIGN.md (bậc tiêu đề, bỏ `.o-sua`, 44 px) · `/impeccable polish` cuối đợt.
