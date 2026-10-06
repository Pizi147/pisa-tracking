# PR-KHUNG · Một thanh cuộn, chữ không cắt, nút không tràn — Kế hoạch

> **Chủ sản phẩm chốt 06/10 (đè phần dưới):** mockup DUYỆT (không cần mockup thêm). (1) Học viên & Lớp 1440: đầu cột + hàng lớp đang mở **dính trên cùng**.
> (2) Hàng nút lọc / tab trên điện thoại: **một hàng, vuốt ngang**, có mép mờ báo còn nút (KHÔNG xuống dòng). (3) Đầu cột dính cho các bảng dài khác → **PR-HK2**.
> (4) Mũi tên mở / thu nhóm lớp: giữ **biểu tượng thật** đang dùng (mockup vẽ tạm chữ "v" — không làm theo).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. **Model: Opus 5.5 hoặc Sonnet 5.5 — không Fable** (CLAUDE.md, 06/10).

**Goal:** Chủ sản phẩm 06/10 (ảnh `1.png` Học viên & Lớp, `2.png` panel Ghi kết quả PA): (3) trang Học viên & Lớp có **hai thanh cuộn**, thông tin bị cắt; (4) **nút bị cắt và lệch** ("✓ ↗ Tiến bộ một phần" tràn viền, ✓ đè mép), "nhiều nút của hệ thống bị như vậy". Sửa **ở component dùng chung** để mọi trang hết cùng lúc; không làm lại giao diện.

**Architecture:** Bảy chỗ gốc, mỗi chỗ một sửa nhỏ (CSS / lớp Tailwind), không thêm component, không đổi dữ liệu, không đổi máy chủ. Phép kiểm hai lớp: (1) quét nguồn trong `server/src/tests/prKhung.tests.ts` (chạy trong `npm run check`) — khoá lớp CSS đúng ở gốc; (2) script đo Playwright `scripts/do-khung.mjs` (chạy tay, không vào `check`) — đo trên trang thật 1440/375 sáng/tối: không còn html cuộn, không cuộn lồng, không chữ/nút tràn. Script đo là bản làm sạch của script rà 06/10.

**Tech Stack:** React + Tailwind, `web/src/index.css` (`@layer components`), phép kiểm quét nguồn theo mẫu `prUxG.tests.ts` (`doc()` bỏ chú thích), Playwright (`npm i --no-save playwright`, `channel: 'msedge'`).

**Nguồn:** báo cáo rà 06/10 (bảng dưới; ảnh đo ở `thiet-ke/anh/khung-truoc/`: `hvl-truoc-cuoi-trang-1440-dark.png`, `hvl-sau-thu-relative-1440-dark.png`, `pa-nut-1440-z1.png`, `lop-hoc-vien-1440-dark.png`, `cv-1-375-dark.png`, `hv-hoc-thuat-375-dark.png`, `hv-tab2-375-dark.png`), `thiet-ke/HE_GIAO_DIEN.md` §1, §10, §11; CLAUDE.md (impeccable: tinh chỉnh, phông/màu/bố cục khoá). Mockup: `thiet-ke/mockup-khung-cuon-chu-cat-2026-10-06.html` (**phải được duyệt trước khi code**).

---

## Global Constraints

- **Tinh chỉnh, không làm lại.** Không đổi phông, màu, bố cục cột, thứ tự thông tin. Không thêm nút, không thêm màn.
- **Sửa ở gốc chung.** Mỗi lỗi sửa đúng một chỗ (bảng "Gốc chung"); không vá từng trang. Chỗ gọi chỉ được sửa khi nó tự đặt lớp đè lên gốc (ví dụ `whitespace-nowrap` truyền vào `NutChon`).
- **Không đụng phần của PR khác** (bảng "File chồng"): Lịch Test (`lichTest/*`) là của LT3, hồ sơ Mock là của MTb, panel Ghi kết quả PA và Ghi vi phạm là của LUI-a. KHUNG chỉ đo lại sau khi các PR đó merge, lệch thì ghi vào báo cáo PR.
- **Máy tính giữ nguyên mật độ.** Sửa chữ xuống dòng chỉ ở chỗ đang cắt; 1440 không được cao thêm quá 1 dòng mỗi hàng.
- **Điện thoại:** vùng bấm ≥ 44 px giữ nguyên (K3); không để cả trang trượt ngang.

## Chủ sản phẩm đã quyết (06/10)

- Học viên & Lớp: một thanh cuộn, đầu bảng dính, không cắt chữ.
- Nút lựa chọn trong panel Ghi kết quả PA: PR-LUI-a sửa riêng trong `CapNhatTuan.tsx` (2 cột, bỏ ✓ ↗ – ↓); KHUNG sửa `NutChon` cho **mọi** chỗ.

---

## Đo 06/10 — cách đo

Worktree tách rời `origin/main` f17436e3, seed demo, API 4510 / web 5510. 45 kịch bản × (1440, 375) × (tối, sáng) = 180 lần đo; vai QL (2), Quản trị (1), GVCN (7), GVBM (9). Mỗi trang chạy JS: (a) `document.scrollingElement` cuộn được = **hai thanh cuộn** (trang đã có `<main>` cuộn riêng); (b) phần tử `overflow-y: auto|scroll` có `scrollHeight > clientHeight` nằm trong trang (không trong panel) = **cuộn lồng**; (c) `overflow: hidden` / `text-overflow: ellipsis` / `line-clamp` mà nội dung lớn hơn khung = **chữ cắt**; (d) nút / chip: bề rộng chữ (Range) > lòng nút hoặc lòi ra viền = **nút tràn**. Bỏ `sr-only`. Sáng và tối cho **cùng** kết quả bố cục (chỉ khác màu) — bảng dưới gộp.

## Mọi chỗ lỗi

| # | Trang › phần | 1440 | 375 | Đo được | Gốc · file:dòng | Ai sửa |
|---|---|---|---|---|---|---|
| 1 | **Học viên & Lớp** › mọi chế độ xem (Tất cả, Fast Track, Lớp thường, Cần chú ý; QL và GVCN) | ✗ | ✓ | html cuộn 1029/900 khi mới vào; lăn tới cuối html trôi **2102 px** → cả màn trống, mất thanh điều hướng, mất đầu cột (ảnh `hvl-truoc-cuoi-trang-1440-dark.png`) | `<thead className="sr-only">` mỗi bảng lớp `StudentsPage.tsx:282` là `position:absolute`, **`<main>` thiếu `relative`** `App.tsx:156` → khối chứa là cả trang | **KHUNG** G1 |
| 2 | Học viên & Lớp › đầu cột dính | ✗ | — | sau khi sửa #1: đầu cột dính ở `top:0` của `<main>` nhưng `<main>` có `md:p-5` → 20 px chữ hàng lộ phía trên đầu cột (ảnh `hvl-sau-thu-relative-1440-dark.png`) | `StudentsPage.tsx:273` `md:top-0`; `index.css:245` `.hang-lon-dinh top:40px` | **KHUNG** G1 |
| 3 | **Panel Ghi kết quả PA** › 4 nút kết quả (Case, hồ sơ HV, hồ sơ lớp) | ✗ | ✗ (✓ ✓ hai dấu) | "↗ Tiến bộ một phần" chữ 121 px > lòng nút 112 px, cách viền 2 px; phông / zoom khác chút là lòi viền (ảnh 2.png) | `NutChon` `ui/ui.tsx:485-491`: ô ✓ ẩn vẫn chiếm chỗ + `.btn` `white-space:nowrap` `index.css:181-187`; chỗ gọi `CapNhatTuan.tsx:273-277` thêm `whitespace-nowrap px-1.5 text-xs` + `OUTCOME_MARK` | gốc **KHUNG** G2 · panel **LUI-a2** |
| 4 | Mọi nút chọn trong lưới cố định: Tạo Case › mức độ / kết quả (`QuickReport.tsx:413, 476-480, 526-530`), Ghi kết quả Case (`ThaoTacCase.tsx:126, 221-225`), Ghi vi phạm › Nhóm (`RecordViolationPanel.tsx:245-249`), SOS (`CaseSosControls.tsx:131`), Kết luận khoá (`KetLuanKhoa.tsx:117`), Khai bậc / Xác nhận xử lý (`KhaiBacPanel.tsx:64`, `XacNhanXuLyPanel.tsx:213`) | rủi ro (sát mép) | rủi ro | cùng mẫu #3: nhãn dài + nowrap + ô ✓ ẩn | `NutChon` `ui/ui.tsx:485-491` | **KHUNG** G2 |
| 5 | **Hồ sơ lớp** › Học viên › cột Theo dõi | ✗ | — | "Ghi kết quả PA R · tuần…" — `line-clamp-2` cắt (32/48 px), 6 em ở MB FT 101; J8 (02/10) đã đánh dấu xong nhưng còn | `ViecTiep` `ui/ViecTiep.tsx:16-23`: `flex` + hạn `shrink-0 whitespace-nowrap` ép chữ việc còn ~70 px | **KHUNG** G3 |
| 6 | **Công việc** › Hỗ trợ học viên, Chờ duyệt · **Tổng quan** › Việc của tôi | — | ✗ | tên việc + dòng phụ `truncate` một dòng: "Xác nhận nguyên nhân Writing Task 2 · Đỗ…", "Lớp MB FT 101 · MT1 · 10 HV · Trần Ngọc…" (≈ 40 dòng) | `WorkList.tsx:60` (tên), `:63` (dòng phụ) | **KHUNG** G4 |
| 7 | **Hồ sơ HV** › Học thuật › thẻ kỹ năng (Case, PA) · Case | — | ✗ | "Luyện matching headings hai bài/tuần, có chữa…", "[Cuối khoá] Reading cuối khoá Beginner còn dưới ng…" | `TheKyNang.tsx:100` (Case), `:141` (PA) `min-w-0 truncate` | **KHUNG** G4 |
| 8 | Bộ lọc nút đoạn: **Công việc** (2 hàng), **Tổng quan** (Theo lớp / Theo giáo viên), **Hồ sơ HV** › Ý thức (Tất cả / Cần xử lý / Chờ duyệt / Đã xử lý), Hành trình (kỹ năng), **Phân tích** | — | ✗ | hàng nút dài hơn màn, mép phải cắt ngang chữ ("Tuần…", "Đã xử…"), không dấu hiệu kéo được (341/591 px) | `BoLocDoan` `ui/ui.tsx:498-514` (23 chỗ dùng) | **KHUNG** G5 (Q2) |
| 9 | Hàng tab: **Công việc** (… Báo cáo đơn vị), **Quản trị** (… Quyền & nhật ký) | — | ✗ | tab cuối bị mép cắt ("Báo cá"), không mép mờ | `HangTab` `ui/HangTab.tsx:22` | **KHUNG** G5 |
| 10 | **Quản trị** › Quyền & nhật ký › Nhật ký thay đổi gần nhất | ✗ | ✗ | khung `max-h-96` tự cuộn trong trang: 384/1959 px (40 dòng) | `AdminPage.tsx:95` | **KHUNG** G6 |
| 11 | **Hồ sơ lớp** › Phân tích lớp · Hồ sơ lớp thường › bảng điểm | — | ✗ | thẻ `overflow-x-auto` sinh cuộn dọc 3 px (230/233) vì thanh cuộn ngang | `PhanTichLopTab.tsx:41`, `BangDiemLopThuong.tsx:122` `card overflow-x-auto` | **KHUNG** G7 |
| 12 | **Test** › Lịch Test (Nợ tuần trước, khối thẻ) | ✗ (5 px) | ✗ | "L, R, W1, W2, S" `td.truncate` 110/115; 375: "MB FT 101 · MT1 · W1 JUL · L, R, W1, W2, S", "GV chấm: Cao Khánh Linh, Lê Minh Khoa, Phạm Thu Tr…" | `lichTest/KhoiNo.tsx:138, 147, 153` | **LT3 #218** viết lại khối này — KHUNG chỉ đo lại sau merge |
| 13 | **Hồ sơ Mock** › thẻ kỹ năng Speaking | — | ✗ | "GV chấm: Cô Lan (giám khảo ngoài)" cắt (142/189) | `MockDetailPage.tsx` / `ODiemLon.tsx:99` | **MTb #219** — đo lại sau merge |
| 14 | **Test** › Điểm theo lớp | — | ✗ | tên lớp / tên em `truncate` ("Tạ Minh Quân", "W1 · đợt này thi 2 tuần") — có `title`, cắt vài px | `TabDiemLop.tsx:55`, Nhập điểm | **HK2** (J8 còn lại) |
| 15 | **Phân tích** › Tổng hợp | ✗ (bảng 1476 > 1398) | cuộn ngang | bảng rộng hơn 1440 | K2 | **HK2** |
| 16 | Mọi bảng bọc `overflow-x-auto` (Tổng quan, Hồ sơ lớp, Hồ sơ HV, Test, Nhập điểm, Công việc › Vận hành / Báo cáo, Quản trị) | — | — | đầu cột **không dính** khi cuộn dài (`.th` sticky bám khối bọc, không bám `<main>`) — không phải lỗi cắt | `.table-scroll` `index.css:172` và các `overflow-x-auto` | **Q3** — mặc định để HK2 |

Không thấy lỗi (180 lần đo): Lưu trữ, Hồ sơ HV › Ý thức, Hành trình (1440), Kế hoạch Test, Nhập điểm, panel Tạo Case, Thêm HV, Sửa thông tin, Chuyển lớp (chỉ cuộn trong panel — đúng thiết kế `KhungPanel`). Báo sai đã loại: `max-sm:sr-only` ("‹ Trước / Sau ›" chỉ còn mũi tên — cố ý), chip `Thiếu n`, nút `⋯` 28 px (vùng bấm mở rộng bằng `::after`).

## Gốc chung — sửa một chỗ

| G | Chỗ | Sửa | Hết lỗi # |
|---|---|---|---|
| **G1** | `web/src/App.tsx:156` `<main id="noi-dung">` | thêm `relative` → mọi phần tử `absolute` không có tổ tiên định vị (sr-only, popover tự viết) bị `<main>` chứa và cắt, html không bao giờ cuộn. Kèm: khối đầu cột HVL `StudentsPage.tsx:273` `md:top-0` → `md:-top-5` (= `md:p-5` của `<main>`) và `.hang-lon-dinh` `index.css:245` `top: 40px` → `top: calc(40px - 1.25rem)` (giữ dính ngay dưới đầu cột). Thử trên trang thật 06/10: html 3002/900 → 900/900. | 1, 2 |
| **G2** | `web/src/ui/ui.tsx:485-491` `NutChon` | lớp nút thêm `min-w-0 whitespace-normal text-center leading-tight` (đè `nowrap` của `.btn`); ✓ **chỉ vẽ khi `chon`** (bỏ `invisible`), `shrink-0`. Chỗ gọi bỏ `whitespace-nowrap` tự truyền vào (chỉ `CapNhatTuan.tsx:276` — nếu LUI-a2 đã bỏ thì thôi). Nút trong cùng hàng lưới cao bằng nhau (lưới `stretch` mặc định). | 3, 4 |
| **G3** | `web/src/ui/ViecTiep.tsx:16-23` | khung ngoài `flex` → `block` (chữ chạy liền); bỏ `line-clamp-2` ở chữ việc; hạn giữ `whitespace-nowrap` nhưng là phần tử inline → chật thì cả cụm hạn xuống dòng. Câu đủ vẫn ở `title`. | 5 (+ Cần hỗ trợ, hồ sơ GV dùng chung) |
| **G4** | `WorkList.tsx:60, 63` · `TheKyNang.tsx:100, 141` | `truncate` → `break-words` (cho xuống dòng) ở **< 640 px** (`max-sm:whitespace-normal max-sm:overflow-visible`); máy tính giữ `truncate` + `title` như nay (đủ chỗ, không đo thấy cắt) | 6, 7 |
| **G5** | `ui/ui.tsx:498-514` `BoLocDoan` · `ui/HangTab.tsx:22` | `BoLocDoan` < 640 px: theo **Q2** (A: xuống dòng — mỗi nút bo viền riêng, `flex-wrap gap-1.5`, không cuộn ngang; B: giữ một hàng + mép mờ). `HangTab` < 640 px: mép mờ phải (cùng mẫu `StudentsPage.tsx:209` `max-sm:[mask-image:…] max-sm:pr-8`) — tab giữ một hàng | 8, 9 |
| **G6** | `AdminPage.tsx:95` | bỏ `max-h-96 overflow-y-auto` — 40 dòng (máy chủ đã giới hạn `routes/index.ts:2100` `LIMIT 40`) nằm thẳng trong trang | 10 |
| **G7** | `PhanTichLopTab.tsx:41`, `BangDiemLopThuong.tsx:122` | thêm `overflow-y-hidden` (cuộn ngang giữ) | 11 |

`.btn` (`index.css:181`) **giữ** `white-space: nowrap` — nút thao tác ("Ghi kết quả", "Nhập điểm") một dòng là đúng; chỉ nút chọn (`NutChon`, `BoLocDoan`) được xuống dòng.

---

## Cấu trúc file

| File | Đổi |
|---|---|
| `web/src/App.tsx:156` | G1 `relative` |
| `web/src/modules/students/StudentsPage.tsx:273` | G1 `md:-top-5` |
| `web/src/index.css:245` | G1 `.hang-lon-dinh` top |
| `web/src/ui/ui.tsx:485-514` | G2 `NutChon`, G5 `BoLocDoan` |
| `web/src/ui/HangTab.tsx:22` | G5 mép mờ |
| `web/src/ui/ViecTiep.tsx:16-23` | G3 |
| `web/src/modules/worklist/WorkList.tsx:60, 63` | G4 |
| `web/src/modules/cases/TheKyNang.tsx:100, 141` | G4 |
| `web/src/modules/platform/AdminPage.tsx:95` | G6 |
| `web/src/modules/classes/PhanTichLopTab.tsx:41`, `BangDiemLopThuong.tsx:122` | G7 |
| `web/src/modules/cases/CapNhatTuan.tsx:276` | bỏ `whitespace-nowrap` nếu LUI-a2 chưa bỏ |
| `server/src/tests/prKhung.tests.ts` (mới) + `run.ts` (một dòng gọi cuối) | phép kiểm quét nguồn |
| `scripts/do-khung.mjs` (mới) | script đo Playwright (chạy tay) |
| `thiet-ke/HE_GIAO_DIEN.md` §10 | 3 dòng luật: "một thanh cuộn: chỉ `<main>` cuộn"; "nút chọn được xuống dòng, nút thao tác không"; "không `max-h` + cuộn trong trang, trừ danh sách gợi ý / menu" |

---

### Task 0: Mockup + duyệt (BƯỚC 1)

- [x] Chủ sản phẩm duyệt `thiet-ke/mockup-khung-cuon-chu-cat-2026-10-06.html` mục 1–6 và trả lời Q1–Q3. Chưa duyệt thì **dừng**.
- [x] `git merge origin/main` (sau MTb, LT3, TK, BV, MT0, LUI-a). Chạy lại script đo (Task 1) trên main mới → bảng lỗi mới; chỗ nào hết / thêm thì ghi vào mô tả PR trước khi sửa.

### Task 1: Script đo + phép kiểm đỏ

**Files:** `scripts/do-khung.mjs` (mới), `server/src/tests/prKhung.tests.ts` (mới), `server/src/tests/run.ts`

- [x] **`scripts/do-khung.mjs`**: Playwright (`npm i --no-save playwright`, `channel: 'msedge'`, rơi về `'chrome'`), `BASE` từ `process.env.KHUNG_BASE` (mặc định `http://localhost:${WEB_PORT}`), đăng nhập `POST /api/demo/session {userId}`. Kịch bản = các trang ở bảng "Mọi chỗ lỗi" + Lưu trữ, Kế hoạch Test, Nhập điểm; panel Ghi kết quả PA (`/hoc-thuat/case/5`, GVCN 7; bấm "Tiến bộ một phần"), Tạo Case, Ghi vi phạm, Sửa thông tin. Mỗi kịch bản × 1440/375 × tối/sáng; hàm đo (a)–(d) như mục "Đo 06/10 — cách đo" (bỏ `.sr-only`, `max-sm:sr-only`, phần tử trong `[role=dialog]` cho (b)). In một dòng mỗi lần đo; **thoát mã 1** nếu còn: html cuộn, cuộn lồng ngoài panel, nút tràn / lấn đệm, chữ `line-clamp`/`truncate` bị cắt ở các file G3/G4. Chụp ảnh lỗi vào `thiet-ke/anh/khung/` (tên `trang-phan-1440-toi.png`).
- [x] **Đỏ — `prKhung.tests.ts`** (quét nguồn, mẫu `prUxG.tests.ts` `doc()` bỏ chú thích), gọi `runPrKhungTests` cuối `run.ts`:
  - K1: `<main id="noi-dung"` trong `App.tsx` có lớp `relative`.
  - K2: thân `NutChon` (`ui.tsx`) có `whitespace-normal` và `min-w-0`; không còn `invisible` trong thân `NutChon`; không chỗ gọi `<NutChon` nào truyền `whitespace-nowrap` (quét `web/src/**/*.tsx`).
  - K3: `ViecTiep.tsx` không còn `line-clamp-2` và không còn `shrink-0` trên cụm hạn.
  - K4: `WorkList.tsx` dòng tên / dòng phụ và `TheKyNang.tsx:100, 141` có `max-sm:whitespace-normal` cạnh `truncate`.
  - K5: `AdminPage.tsx` không còn `max-h-96`; không file nào trong `web/src/modules/**` có `max-h-` cùng `overflow-y-auto` **ngoài** danh sách cho phép (menu / gợi ý / popover: `Header.tsx`, `PeoplePicker.tsx`, `TimLop.tsx`, `HopKyNang.tsx`, `MeetingPage.tsx:474`, `Drawer.tsx`) — khoá luật "không cuộn lồng trong trang".
  - K6: `BoLocDoan` có lớp `max-sm:` theo Q2 (A: `max-sm:flex-wrap`; B: `max-sm:[mask-image`); `HangTab` có `max-sm:[mask-image`.
  - K7: `StudentsPage.tsx` khối đầu cột có `md:-top-5`; `index.css` `.hang-lon-dinh` không còn `top: 40px`.
- [x] Chạy `npm run build:server && node dist-server/server/src/tests/run.js` (hoặc chỉ khối mới nếu run.ts có lọc) → **đỏ** K1–K7. Chạy `node scripts/do-khung.mjs` trên bản chưa sửa → thoát 1, liệt kê đủ #1–#11.
- [x] Commit `test(khung): đo cuộn lồng / chữ cắt / nút tràn (đỏ)`.

### Task 2: G1 — một thanh cuộn (Học viên & Lớp và mọi trang)

- [x] `App.tsx:156` thêm `relative`. `StudentsPage.tsx:273` `md:top-0` → `md:-top-5`. `index.css:245` `top: calc(40px - 1.25rem)`.
- [x] `/impeccable layout` phạm vi Học viên & Lớp: đầu cột dính sát, hàng lớp đang mở dính ngay dưới, không hở chữ; cuối trang không còn khoảng trống.
- [x] Đo: html không cuộn ở **mọi** trang (kịch bản đủ), HVL 1440 lăn tới cuối: thanh trên còn, đầu cột còn. Kiểm panel (`KhungPanel`, `Drawer` là `fixed`) và lịch `LichNho` (portal) vẫn đúng chỗ — `relative` không ảnh hưởng `fixed`.
- [x] K1, K7 xanh. Commit `fix(khung): G1 chỉ <main> cuộn — html không cuộn, đầu cột HVL dính sát`.

### Task 3: G2 — nút chọn không tràn

- [x] `NutChon` (`ui.tsx:485-491`): `className={\`btn ${nho ? 'btn-sm' : ''} min-h-[44px] min-w-0 gap-1 whitespace-normal text-center leading-tight sm:min-h-0 ${chon ? CHON : ''} ${className}\`}`; `{chon && <span aria-hidden className="shrink-0 text-[11px] leading-none text-teal-300">✓</span>}`. Nút trong lưới `justify-center` giữ nguyên.
- [x] `CapNhatTuan.tsx:276`: bỏ `whitespace-nowrap px-1.5 text-xs` nếu LUI-a2 chưa bỏ (LUI-a2 đã có: 2 cột, bỏ `OUTCOME_MARK`). Không đổi gì khác trong panel này.
- [x] `/impeccable polish` các panel có lưới nút chọn (bảng #3, #4): đo ở 1440 và 375, nhãn dài nhất mỗi lưới không chạm viền; nút cùng hàng cao bằng nhau; chọn / bỏ chọn không làm nút nhảy kích thước quá 1 dòng.
- [x] K2 xanh. Commit `fix(khung): G2 NutChon — chữ xuống dòng, ✓ chỉ ở nút đang chọn`.

### Task 4: G3, G4 — chữ việc không cắt

- [x] `ViecTiep.tsx` (G3); `WorkList.tsx:60, 63`, `TheKyNang.tsx:100, 141` (G4). `/impeccable clarify` không áp — chữ giữ nguyên, chỉ đổi cách xuống dòng.
- [x] `/impeccable adapt` 375: Công việc, Tổng quan, Hồ sơ HV › Học thuật, Hồ sơ lớp; 1440: cột Theo dõi Hồ sơ lớp không cao thêm quá 1 dòng.
- [x] K3, K4 xanh. Commit `fix(khung): G3 G4 việc tiếp theo, danh sách việc, thẻ kỹ năng không cắt chữ`.

### Task 5: G5 — bộ lọc và tab trên điện thoại

- [x] `BoLocDoan` theo Q2 (mặc định **A**): `max-sm:flex-wrap max-sm:gap-1.5 max-sm:border-0 max-sm:overflow-visible`, nút `max-sm:rounded-lg max-sm:border` (bỏ `border-l` nối đoạn ở < 640). Máy tính giữ nút đoạn liền.
- [x] `HangTab.tsx:22`: `max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]`; tab đang chọn tự cuộn vào giữa đã có (giữ).
- [x] K6 xanh. Commit `fix(khung): G5 bộ lọc nút đoạn và hàng tab trên điện thoại`.

### Task 6: G6, G7 — bỏ cuộn lồng còn lại

- [x] `AdminPage.tsx:95` bỏ `max-h-96 overflow-y-auto`. `PhanTichLopTab.tsx:41`, `BangDiemLopThuong.tsx:122` thêm `overflow-y-hidden`.
- [x] K5 xanh. Commit `fix(khung): G6 G7 nhật ký quản trị, bảng phân tích lớp không cuộn lồng`.

### Task 7: Kiểm cuối, ảnh, audit, PR

- [x] `node scripts/do-khung.mjs` → **thoát 0** (trừ #12–#16 ghi chú "PR khác"). Ảnh nghiệm thu vào `thiet-ke/anh/khung/`: mỗi trang ở bảng × 1440/375 × sáng/tối (đặt tên `trang-phan-1440-sang.png`).
- [x] Cập nhật `thiet-ke/HE_GIAO_DIEN.md` §10 (3 dòng luật, xem Cấu trúc file).
- [x] `/impeccable audit` (giao diện đã sửa), `/ponytail-review`. `npm run check` **một lần**, foreground.
- [x] Mở PR vào `main`, **không merge**. Mô tả: bảng G1–G7 → # đã hết, ảnh trước / sau, phép kiểm K1–K7, chỗ để HK2 / PR khác, chú thích `ponytail:`.

---

## Nghiệm thu

1. Ảnh 1440 và 375, sáng và tối, **mọi trang** ở bảng "Mọi chỗ lỗi" + Lưu trữ, Kế hoạch Test, Nhập điểm: không còn hai thanh cuộn, không cuộn lồng trong trang (panel cuộn trong panel là đúng), không chữ cắt, không nút tràn / lệch.
2. Học viên & Lớp 1440: lăn từ đầu tới cuối — thanh điều hướng luôn hiện, đầu cột luôn hiện sát mép, hàng lớp đang mở dính dưới đầu cột, không khoảng trống cuối trang.
3. Panel Ghi kết quả PA, Tạo Case, Ghi vi phạm: mọi nút chọn nằm trong viền ở 1440 và 375; ✓ chỉ ở nút đang chọn; không có "✓ ✓".
4. `scripts/do-khung.mjs` thoát 0; `prKhung.tests.ts` xanh trong `npm run check`.

## File chồng với PR khác — chạy SAU khi các PR này merge, TRƯỚC HK2

| PR | File chung | Cách tránh |
|---|---|---|
| **PR-MTb #219** (mở) | `ClassRoster.tsx` (dùng `ViecTiep`), `KhungPanel.tsx`, `Nhan.tsx` | KHUNG không sửa các file này; đo lại hồ sơ Mock (#13) và bảng lớp sau merge |
| **PR-LT3 #218** (mở) | `index.css`, `HangNhom.tsx`, `lichTest/*` | KHUNG chỉ đổi `index.css:245` (một dòng); Lịch Test (#12) để LT3 — đo lại sau merge, còn cắt thì ghi cho HK2 |
| **PR-TK #220** (mở) | hồ sơ HV (mục Các lộ trình), Lưu trữ | đo lại hai trang này sau merge |
| **PR-BV** | `ScoreEntry.tsx`, lưới chấm | không chung file; đo lại Nhập điểm |
| **PR-MT0** | ô MT, Chuyển tiếp lớp | không chung file; đo lại Kế hoạch Test |
| **PR-LUI-a** (a1, a2) | `CapNhatTuan.tsx` (nút kết quả 2 cột), `RecordViolationPanel.tsx` (viết lại), `QuickReport.tsx` (Tạo Case có tệp) | LUI-a sửa riêng panel, **không** sửa `NutChon`; KHUNG sửa `NutChon` và chỉ gỡ `whitespace-nowrap` còn sót ở `CapNhatTuan.tsx:276` |
| **PR-HK2** (sau KHUNG) | `ui/ui.tsx` (chip H1/H2), `Nhan.tsx`, `HangTab.tsx` (H2 `:33`), K2 Phân tích, K6 chữ 12 px | KHUNG merge trước; HK2 `git merge origin/main`, giữ lớp `max-sm:` của G5 khi gom chip |

## Việc nên gộp vào HK2 thay vì KHUNG

- **#15 Phân tích › Tổng hợp** bảng rộng hơn 1440 — đã là K2 của HK2 (gom cột, "16 ⚠1").
- **#14 Điểm theo lớp / Nhập điểm** tên cắt vài px có `title` — J8 còn lại, gộp vào lượt "chữ" của HK2.
- **#16 Đầu cột dính ở các bảng cuộn ngang** — nếu chủ sản phẩm muốn (Q3), làm cùng HK2 vì đụng ~10 bảng và ảnh sổ tay chụp lại một lần.
- Chip "Thiếu n" / "+1" / ⋯ ở Học viên & Lớp 375 — đo không tràn; kích thước chip thống nhất là H1 của HK2.

## Câu cần chủ sản phẩm quyết (≤ 3, mỗi câu có khuyến nghị)

1. **Học viên & Lớp › đầu bảng (1440):** đầu cột dính sát mép trên khi cuộn và **hàng lớp đang mở dính ngay dưới** (như mockup mục 1, ảnh `hvl-sau-thu-relative-1440-dark.png`)? — **Khuyến nghị: có** (đã là thiết kế PR-N1, chỉ đang hỏng vì trang cuộn hai lớp).
2. **Công việc / Tổng quan / Hồ sơ HV / Phân tích › bộ lọc nút đoạn trên điện thoại (375):** A — **xuống dòng, thấy hết nút** (mỗi nút bo riêng) hay B — giữ một hàng, kéo ngang, mép mờ (mockup mục 6, ảnh thật `cv-1-375-dark.png`)? — **Khuyến nghị: A** (không phải đoán là kéo được; hàng lọc dài nhất 5 nút → 2–3 dòng).
3. **Mọi bảng dài (Tổng quan, Hồ sơ lớp, Test, Nhập điểm, Quản trị) › đầu cột:** muốn đầu cột dính khi cuộn như Học viên & Lớp không? Nay không dính vì bảng cuộn ngang trong khung riêng. — **Khuyến nghị: để HK2** (đụng ~10 bảng, cần đo lại từng bảng; không phải lỗi cắt chữ).

## Prompt cho session code (dán nguyên khối, sau khi chủ sản phẩm duyệt mockup và các PR ở "File chồng" đã merge)

**PR-KHUNG** — Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng
```
/ponytail lite
Làm PR-KHUNG theo docs/superpowers/plans/2026-10-06-pr-khung-cuon-chu-cat.md (Task 0 → 7, prompt chung plan.md mục 9.0).
Model Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì DỪNG báo chủ sản phẩm. Không Fable kể cả subagent. Đầu phiên nói model đang chạy.
Chạy SAU khi MTb #219, LT3 #218, TK #220, BV, MT0, LUI-a đã merge; TRƯỚC HK2. Nhánh pr-khung-cuon-chu-cat từ origin/main mới nhất, worktree .claude/worktrees/pr-khung-cuon-chu-cat. Cổng PORT=4530 WEB_PORT=5530.
Mockup đã duyệt: thiet-ke/mockup-khung-cuon-chu-cat-2026-10-06.html mục 1–6; đọc câu trả lời Q1–Q3. Tinh chỉnh, KHÔNG làm lại: phông, màu, bố cục, chữ giữ nguyên.
Sửa ở GỐC CHUNG G1–G7 (bảng "Gốc chung"), không vá từng trang. Không sửa Lịch Test (LT3), hồ sơ Mock (MTb), panel Ghi kết quả PA / Ghi vi phạm ngoài một lớp còn sót (LUI-a).
Task 0: chạy scripts/do-khung.mjs trên main mới trước, bảng lỗi lệch kế hoạch thì ghi vào PR.
Đỏ trước: prKhung.tests.ts K1–K7 + scripts/do-khung.mjs thoát 1 trên bản chưa sửa.
Impeccable: layout (G1), polish (G2), adapt 375 (G3–G5), cuối /impeccable audit; /ponytail-review. npm run check MỘT lần, foreground (máy yếu RAM).
Nghiệm thu: scripts/do-khung.mjs thoát 0; ảnh 1440/375 sáng/tối mọi trang vào thiet-ke/anh/khung/. Mở PR vào main, KHÔNG merge. Mô tả PR: G1–G7 → lỗi đã hết, ảnh trước/sau, K1–K7, việc để HK2, chú thích ponytail:.
```

## Cái bỏ qua (và khi nào thêm)

- **Đầu cột dính ở mọi bảng cuộn ngang:** chưa (Q3) — làm ở HK2 nếu chủ sản phẩm muốn.
- **Đổi `.btn` toàn web sang xuống dòng:** không — nút thao tác một dòng là đúng; chỉ nút chọn.
- **Phép kiểm Playwright trong `npm run check`:** không — máy yếu RAM, cần máy chủ chạy; giữ script chạy tay + quét nguồn trong `check`. Thêm vào CI khi có CI chạy trình duyệt.
- **"Xem thêm" cho nhật ký quản trị:** không — 40 dòng nằm thẳng trong trang là đủ; thêm khi máy chủ trả nhiều hơn.
