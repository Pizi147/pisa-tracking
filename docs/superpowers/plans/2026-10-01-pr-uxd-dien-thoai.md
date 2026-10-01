# PR-UXD · Điện thoại 375 px — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Giáo viên dùng được web trên điện thoại (375 px) ở **mọi màn dùng hằng ngày** (Q31-3): Tổng quan, Công việc, hồ sơ học viên,
lưới chấm, Lịch Test, thông báo, thanh dưới. Cụ thể:
(1) **Thanh dưới** có biểu tượng nét mảnh 20 px, cao 56 px, vạch chỉ mục đang mở (mockup 23 màn C — UX-D9).
(2) **Thanh trên** không còn ô tìm bị ép "Tìm học" và tên bị cắt "Nguyễn K…" (VN33); bảng thông báo neo đúng đáy thanh trên kể cả khi có DemoBar.
(3) **Hồ sơ HV:** bảng Mock Test / Kết quả kiểm tra thành thẻ (`TheDong`), hàng tab vừa màn.
(4) **Lịch Test:** bộ lọc gọn vào nút "Lọc" (UX-D8, mockup 13 mục 4).
(5) Việc nhỏ: toast không che nút panel (VN17), viền ô nhập chế độ tối đủ rõ (U13), dòng phụ hàng lớp có lộ trình LT1/LT2 (U14).
(6) Đo và sửa mọi chỗ còn tràn ngang ở màn GV hằng ngày; ảnh 375 px các màn LT2b (R5-6); ba tầng thông tin phần còn lại (V9).

**Architecture:** Chỉ phần trình bày `web/` — **không sửa máy chủ, không migrate, không route mới**. Dùng lại mẫu có sẵn, không dựng thứ hai:
- thẻ điện thoại `TheDong` + `useDienThoai()` (`web/src/ui/TheDong.tsx:8, :26`) — **chỉ vẽ một biến thể** (không vẽ bảng rồi ẩn);
- bảng rộng ở màn không hằng ngày cuộn **trong khung riêng** (`.table-scroll`, `web/src/index.css:172`) — trang không cuộn ngang;
- biểu tượng nhỏ vẽ SVG (`web/src/ui/BieuTuong.tsx` — `IconGap`, `IconDat`), **không** dùng ký tự ▾ ✓ (bẫy phông: ký tự nhỏ thành dấu chấm);
- CSS gốc trước JS: neo bảng thả theo đáy `<header>` bằng `absolute top-full`, đổi chỗ toast bằng `body:has([aria-modal="true"])`.
Phép kiểm ở `server/src/tests/prUxd.tests.ts` (`runPrUxdTests(t)`, đăng ký **cuối** `run.ts`, theo mẫu đọc nguồn của `prS6fB.tests.ts:1-15`).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4; harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md` mục (c) bảng lượt 2 dòng **A** (PR-UXD), B2c (UX-D7/D8/D9), B3 (U13, U14, V9, D1, D2), B4 (VN17, VN33), rà đợt 5 (R5-6).
- Đặc tả `specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1g **Q31-3** (chỉ màn GV hằng ngày; **hoãn UX-D7**), Q31-4 (12 px), §7.5 (ba tầng), §3.1f Q30-6 (mã tuần).
- Kế hoạch UX 26/09, gói **UX-D** (`plans/2026-09-26-ux-sau-danh-gia.md:97-112`).
- Bảng việc nhỏ `specs/2026-09-29-viec-nho-sau-ra-dot-2.md` (dòng "375 px: ô tìm bị ép…", "Toast Đã đọc 4 dòng…").
- Chuyển từ PR trước: S6F "Chuyển cho PR khác" (`plans/2026-10-01-pr-s6f-sua-sau-ra-dot-6.md:442-444`), VAI-a (`plans/…-vai-a-…md:474-475`), VAI-b (`plans/…-vai-b-…md:491`), rà VAI-a P2 chuông `top-14` (`reviews/2026-10-01-ra-dot-6-luot-1/vai-a.md:109-113`), thân PR #147, #148.
- Mockup đã duyệt: **23 màn C** (thanh trên + thanh dưới điện thoại, `thiet-ke/mockup/23-tong-quan-theo-vai.html:236-263, :578-627`, biểu tượng `:287-293`) · **13 mục 4** (Lịch Test điện thoại, `13-lich-test.html:263-290`) · **21 mục 5** (dòng phụ hàng lớp, `21-pr-lop.html:248-266`) · 24 màn E (thẻ kỹ năng — đã làm ở VAI-b, chỉ để khớp kiểu).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-UXD** · đợt 6 **lượt 2** · làn **A** · một PR, **không draft**, **không tự merge** |
| Nhánh · worktree | `pr-uxd-dien-thoai` · `.claude/worktrees/pr-uxd-dien-thoai`, từ `origin/main` @ `0c9c04f6` trở đi |
| Cổng thử | API **4157** · Vite **5357** (Vite tạm ngoài worktree, proxy về 4157). Song song: UXF-b 4167/5367 · Dọn 4177/5377. Không dùng 4000/5173 |
| Log check | `$env:TEMP\check-uxd.log` (tên riêng — `$TEMP` dùng chung giữa các session) |
| Model | Model khuyến nghị: **Sonnet 5.5 · effort High** · phương án B: **Opus 5.5 · High**. Chỉ là gợi ý. Session **ghi model thật vào thân PR** |
| Người rà | **Opus 5.5**, rà **một lượt** khi xong lượt 2 đợt 6. Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model với session, không Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** Không sửa `server/` ngoài phép kiểm (`prUxd.tests.ts` + một khối đăng ký cuối `run.ts`). `schema.sql`, `tocDoDuong.ts` không đổi |
| Lệnh skill | **`/ponytail lite` đầu phiên.** impeccable **`adapt`** ở mọi Task sửa một màn (1–7) · **`layout`** ở Task 1, 4, 5 (đổi cấu trúc) · **`polish`** ở Task 3, 6 · **`audit`** + **`polish`** (**sáng và tối**) ở Task 8. Không `init`/`document`/`hooks on`/`npx impeccable install|update`. Trước PR: **`/ponytail-review`** |
| Phụ thuộc | VAI-a (#147), VAI-b (#148), S6F (#151, #152) **đã merge**. Chạy song song **UXF-b** và **Dọn** (bảng file chồng dưới). Không cần mockup mới |
| Không làm | **UX-D7** bảng Vận hành / Báo cáo đơn vị / Theo lớp / Tài khoản thành thẻ → **hoãn** (Q31-3) · **D1** Thêm học viên dạng thẻ → **hoãn** (Q2, Câu 1) · mã tuần, `attemptHref` máy chủ, G5 ngoài hồ sơ HV, O1 → **UXF-b** · `useLoiForm` 7 panel, K1-35/K1-36 → **Dọn** · Dn8 chú thích → **S3** · chữ, thuật ngữ → **S3** |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-uxd.log`;
  - xanh, số phép kiểm ≥ mốc B → commit `PR-UXD (n): …`.
- Mỗi Task bắt đầu bằng **Phép kiểm trước** — viết xong phải **ĐỎ trên `main` hiện tại** (chạy một lần, ghi số ✗ vào Nhật ký), rồi mới sửa.
- Sập segfault / OOM → chạy lại **một** lần; sập lặp → chạy thẳng `tsc` + `node dist-server/…/tests/run.js` + `tocDo.run.js`, không qua npm.
  Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Ảnh: **trước** ở Task 0 (chỉ 375 px), **sau** một lần ở Task 8 (1440 + 375, sáng + tối). Không chụp từng Task.
  - Playwright kênh Chrome, script tạm trong scratchpad (**không commit**); demo `POST /api/demo/session {userId}`; vai tra `server/src/tests/tocDo.run.ts:110-116`;
  - ảnh vào `thiet-ke/anh/pr-uxd/{muc}-{vai}-{1440|375}-{sang|toi}-{truoc|sau}.png`;
  - API `PORT=4157`, Vite tạm 5357 proxy về 4157 (memory "máy chủ dev trong worktree").
- Đo "không cuộn ngang" (mọi màn, mọi ảnh 375): `document.documentElement.scrollWidth <= 375`. Bảng cuộn **trong khung riêng** thì được.
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi UXF-b hoặc Dọn merge, và ở Task 8: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

### File chồng với 2 PR song song (UXF-b, Dọn)

| File | PR khác (dự kiến) | PR-UXD sửa | Ai sở hữu · cách gỡ |
|---|---|---|---|
| `web/src/modules/students/StudentDetailPage.tsx` (`IeltsAttempts` :410-487, `RatioAttempts` :489-537, `HangTab` :266) | **UXF-b**: một chữ mã tuần "Mục tiêu đã đổi … lần gần nhất" (:324), đọc `?muc=ket-luan-khoa` + cuộn, `attemptHref` / G5 (kế hoạch UXF-b bảng file chồng dòng 133) | **chỉ thêm** nhánh `if (dienThoai) return <thẻ>` ở đầu hai hàm; bảng máy tính **không đổi** | Bảng máy tính: UXF-b. Thẻ điện thoại: UXD. PR merge sau áp lại cùng trường / cùng link cho thẻ |
| `web/src/modules/test/LichTestTab.tsx` (hàng lọc :176-217) | **UXF-b**: G5 đường dẫn sâu ở Lịch Test, mã tuần `tenTuan` :171 | hàng lọc < 640 px | Hàng lọc: UXD. Link / chữ tuần: UXF-b. Khác khối → giữ cả hai |
| `web/src/ui/Filters.tsx` (`WeekPicker`) | **UXF-b** B5 bộ chọn tuần (mã tuần chính) | **UXD không sửa** — chỉ đặt `WeekPicker` vào chỗ khác | UXF-b |
| `web/src/modules/test/lichTest/DaiSo.tsx` | UXF-b (chữ nhãn tuần, nếu chạm) | lớp lưới ô trên điện thoại | UXD bố cục, UXF-b chữ → áp lại |
| `web/src/modules/students/StudentsPage.tsx` (kiểu `LopTrenTrang` :24-34, dòng phụ :344, :364-367) | **Dọn**: xoá `WorkQueue` (:381–cuối hàm) · **UXF-b**: chữ tuần :451, :454, :491, link G5 (chủ yếu `BangHocVienLop.tsx`) | thêm trường `route` vào kiểu + dòng phụ | khác khối → giữ cả hai |
| `web/src/ui/BieuTuong.tsx` | Dn8 chú thích dòng 2 — Dọn Q19 chuyển **PR-S3** (lượt 3) | **chỉ import** `IconGap`, `IconDat` — không sửa file | không ai sửa ở lượt 2 |
| `web/src/modules/cases/SkillBoard.tsx`, `cases/TheKyNang.tsx` | **UXF-b** O1: thêm một dòng Xin ý kiến ở `HangPA` / `KhoiPa` | **không sửa** (thẻ kỹ năng đã xong ở VAI-b); chỉ sửa nếu Task 7 đo thấy tràn | UXF-b thêm dòng; UXD giữ bố cục thẻ |
| `web/src/modules/cham/LuoiFT.tsx`, `cham/MotKyNang.tsx`, `test/lichTest/KhoiNo.tsx`, `test/lichTest/HangLop.tsx` | **UXF-b** G5 (`href` qua `duongDotTest`) | **không sửa**, trừ khi Task 7 đo thấy tràn (chỉ lớp CSS) | UXF-b `href`; UXD lớp CSS → giữ cả hai |
| `web/src/modules/fasttrack/MockDetailPage.tsx`, `DongThoiGianLuot.tsx` | **Dọn** Dn7 (dòng "Nhận xét" ở `DongThoiGianLuot`) | **không sửa**, trừ khi Task 7 đo thấy hồ sơ Mock tràn (chỉ `MockDetailPage`) | Dọn sở hữu `DongThoiGianLuot.tsx` |
| `web/src/modules/students/IntakePanel.tsx`, `MgmtTasksPage.tsx`, `MeetingPage.tsx`, `AccountsAdmin.tsx`, `BranchPulse.tsx` | **Dọn** (O5 `useLoiForm`, 2 `Modal` → `KhungPanel`, K1-35/V4, K1-36, UX-C7) | **UXD không sửa** (D1, D7 hoãn; VN17 sửa ở `Toast.tsx`) | Dọn |
| `web/src/App.tsx`, `web/src/modules/platform/Header.tsx`, `web/src/ui/Toast.tsx`, `web/src/ui/HangTab.tsx`, `web/src/index.css` | không PR song song nào dự kiến chạm | thanh dưới, thanh trên, toast, hàng tab, token viền ô tối | **UXD** |
| `server/src/tests/run.ts`, `CODE_MAP.md` | cả ba PR | một khối đăng ký **cuối** `run.ts`; một dòng `CODE_MAP` | giữ cả hai, thứ tự theo merge |

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | **UX-D7 hoãn**: Vận hành, Báo cáo đơn vị, bảng "Theo lớp" ở Tổng quan Quản lý, Quản trị › Tài khoản giữ bảng **cuộn trong khung** (đã có: `MgmtTasksPage.tsx:204`, `MeetingPage.tsx:176`, `BranchPulse.tsx:83`, `AccountsAdmin`). Task 8 chỉ đo trang không cuộn ngang | Q31-3 (chủ SP 01/10) |
| Q2 | **D1 Thêm học viên dạng thẻ: hoãn.** Thêm HV không phải việc hằng ngày của GV (làm khi mở lớp, thường dán từ Excel trên máy tính). Lưới đã cuộn trong khung (`IntakePanel.tsx:234`), dòng lỗi neo mép trái (`:308`). Chủ SP chọn B ở Câu 1 thì thêm Task | Q31-3 chỉ kể màn hằng ngày |
| Q3 | **Thanh dưới** (mockup 23 màn C): 4 mục, biểu tượng nét mảnh 20 px trên, chữ 11,5 px dưới, mỗi mục cao **56 px**; mục đang mở đổi màu chữ + đậm + **vạch 32×3 px ở mép trên**; số đỏ (`SoCho`) ở góc trên phải biểu tượng. Đường vẽ chép **đúng** từ mockup (`#i-home`, `#i-users`, `#i-test`, `#i-work`). Khai biểu tượng **ngay trong `App.tsx`** (chỉ một nơi dùng) | mockup đã duyệt; một chỗ dùng thì không tách file |
| Q4 | Lối tắt "Học viên cần hỗ trợ (n)" ở D9 cũ: **bỏ** — Tổng quan GV đã theo mockup 23 (VAI-a: "Hôm nay" + "Lớp tôi dạy") | đã thay |
| Q5 | **Thanh trên < 640 px** (mockup 23 màn C): ô tìm → **nút kính lúp 44 px**; bấm mở ô tìm **neo hai mép ngay dưới thanh trên** (cùng chỗ bảng thông báo), con trỏ vào ô, Esc / bấm ra ngoài đóng và trả focus về nút. Tên tài khoản → **vòng tròn chữ cái đầu của tên gọi** (chữ cuối của họ tên: "Nguyễn Khánh Vy" → "V"), `aria-label="Tài khoản {họ tên}"`. Nút ◐ sáng/tối **giữ** trên thanh (4 nút × 44 px vừa 375). ≥ 640 px giữ nguyên | VN33; mockup 23 C |
| Q6 | Bảng thông báo và ô tìm điện thoại neo theo **đáy `<header>` bằng CSS**: `<header>` thêm `relative`; khung bọc nút chuông đổi `relative` → `sm:relative`; bảng `absolute inset-x-2 top-full mt-1` (< 640) — có DemoBar hay không vẫn đúng. Không đo bằng JS, không biến CSS chiều cao DemoBar | rà VAI-a P2; CSS gốc trước JS |
| Q7 | **Toast** (VN17): khi có panel / hộp thoại mở (`[aria-modal="true"]` — `KhungPanel.tsx:65`, `Modal`), vùng toast lên **trên**, ngay dưới đầu panel (`top: 3.75rem; bottom: auto`), không che hàng nút chân panel. Không có panel → giữ chỗ cũ (máy tính: góc phải dưới; điện thoại: trên thanh dưới). **Một** quy tắc CSS `body:has([aria-modal="true"]) .vung-toast {…}` trong `index.css` (không màu). Dấu ✓ chữ 11 px (`Toast.tsx:55`) → `IconDat` | một chỗ sửa cho mọi panel |
| Q8 | **U13 viền ô nhập chế độ tối ≥ 3:1** (WCAG 1.4.11) trên `surface` và `surface-2`: `--o-nhap-vien` tối từ `var(--line-strong)` (trong suốt, ~1,6:1) → màu đặc, gợi ý `#64748b` (3,57 / 3,30); `--o-sua-vien` tối `#3d5f8f` (~2,6:1) → xanh sáng hơn, gợi ý `#4f79b3` (≈ 3,5). Session tự tính lại bằng `tuongPhan`. **Sáng không đổi** | tinh chỉnh token, không đổi bảng màu |
| Q9 | **Mock Test / Kết quả kiểm tra < 640 px:** mỗi lượt **một `TheDong`**. Đầu thẻ (`dau`): `MT2` (link `attemptHref`) + nhãn nhỏ (lịch sử, đã huỷ, …) + mã tuần `W3 SEP` (`tuanLich`) — bên phải **Kết quả** (`KetQuaDot`) = tầng 1. Dòng (`dong`): **Điểm** `L 6.0 · R 5.5 · W 5.0 · S 6.0` (mỗi điểm là link `duongDotTest(a, k)` như bảng) · **Overall** · **Kỳ vọng** · **Lớp** (tầng 3, cuối). Lớp thường: đầu thẻ `Giữa khoá · W3 SEP` + `KetQuaThuongO`; dòng **Điểm từng phần** (chip `Outcome` như bảng) · **Lớp** · link `Hồ sơ đợt ›`. Dòng RF "kỳ vọng mọi MT bằng target" giữ. Bảng máy tính không đổi | một mẫu thẻ (TheDong); tầng 1 trên cùng |
| Q10 | **Hàng tab:** mẫu "cuộn trong chính nó" giữ (`HangTab.tsx:5`). Điện thoại nút tab `px-2.5` (≥ 640 giữ `px-3`); khi trang mở, tab đang chọn **tự cuộn vào tầm nhìn** (`scrollIntoView({ block: 'nearest', inline: 'nearest' })`, một `useEffect` trong `HangTab`). Hồ sơ HV 3 tab phải **vừa** 343 px (không cuộn) kể cả khi tab Ý thức có chấm ● | hồ sơ lớp mở `?tab=y-thuc` thì tab không bị khuất |
| Q11 | **Lịch Test < 640 px** (mockup 13 mục 4): hàng trên giữ **bộ chọn tuần** (`WeekPicker` — không sửa `Filters.tsx`) + công tắc khung; nút **"Lọc"** (biểu tượng `IconGap`, không ký tự ▾) mở khối gồm **Chi nhánh**, **"Lớp tôi dạy / Tất cả"**, **Xuất Excel**, `NutLuat` lưới lớp thường. Nhãn nút ghi số lựa chọn đang khác mặc định: "Lọc · 1". Dùng `useDienThoai()` vẽ **một** biến thể (không nhân đôi `BranchFilter` bằng CSS như `KeHoachTestTab.tsx:124`). **Dải số** 4 ô **một hàng** (mockup 13), giữ đơn vị "bài"; ô nào chữ số xuống dòng hoặc tràn ở 375 → giữ 2×2, ghi Nhật ký (Câu 2). ≥ 640 giữ nguyên | UX-D8, Q31-3 "bộ lọc gọn" |
| Q12 | **U14:** dòng phụ hàng lớp **Fast Track** thêm lộ trình: `Fast Track · LT1 · 18 HV · GVCN …` (mockup 21 mục 5; lớp RF ghi `RF`). Lớp thường không có lộ trình → giữ. Trường `route` **đã có** trong `/hoc-vien-lop` (`hocVienLop.ts:172` trải `...r` của `ClassSummary`, `classes.ts:246`) → chỉ thêm vào kiểu `LopTrenTrang` và hai chỗ vẽ (thẻ điện thoại `:344`, bảng `:364-367`) | không sửa máy chủ |
| Q13 | **V9 (phần của PR này):** mỗi màn GV hằng ngày ghi "**tầng 1 của màn này là: …**" trong thân PR. Ở màn PR này chạm, trên điện thoại tầng 3 (lớp lúc đánh giá, ghi chú phạm vi `scopeNote`, người nhập, giờ) **đứng cuối thẻ** hoặc ẩn (`hidden sm:block`) nếu chỉ là siêu dữ liệu. **Không đổi chữ** | §7.5 |
| Q14 | **Lưới chấm** điện thoại đã có chấm từng kỹ năng `MotKyNang` (< 768 px, `LuoiChamLop.tsx:29, :119`) — **không dựng lại**; chỉ đo và sửa nếu tràn. Ngăn Case, hồ sơ Mock, Ý thức trong hồ sơ HV: cũng chỉ đo + sửa | đã làm ở PR trước |
| Q15 | Màn **không** hằng ngày còn bảng cuộn trong khung (hồ sơ lớp › Phân tích lớp `PhanTichLopTab.tsx:41`, `ClassIssueBoard.tsx:38,68`; panel Lộ trình HV `StudentPlanPanel.tsx:164`): **giữ**, chỉ bảo đảm trang không cuộn ngang (Câu 3) | Q31-3 |

## Global Constraints

- **Chỉ `web/`.** Không sửa `server/src` ngoài `tests/prUxd.tests.ts` và một khối đăng ký cuối `tests/run.ts`. Không route mới → `tocDoDuong.ts` không đổi.
- **Giao diện:**
  - `/ponytail lite`;
  - phông Be Vietnam Pro, chữ số Inter, bảng màu, bố cục máy tính **không đổi** (≥ 640 px giữ nguyên trừ hàng tab `px-3` vốn có);
  - mã tuần `W2 OCT` (`tuanLich`) cho tuần; ngày chỉ cho hạn cụ thể (`<Han>`), ngày thi, ngày sinh, nhật ký;
  - **Q31-4:** kết quả, hạn, người phụ trách **12 px**; nhãn nhỏ 11–11,5 px;
  - token màu, không màu cứng (`prSang` S4–S6 chặn); số `tabular-nums`; cột thẳng, không dồn chữ;
  - vùng bấm ≥ **44 px** trên điện thoại (`min-h-[44px] sm:min-h-0` như mẫu có sẵn);
  - ký tự nhỏ (▾ ▸ ✓ ⚠) → SVG từ `BieuTuong.tsx`;
  - thẻ điện thoại: **một** biến thể được vẽ (`useDienThoai()`), không vẽ cả bảng lẫn thẻ.
- **Phép kiểm:**
  - tạo `server/src/tests/prUxd.tests.ts` (`runPrUxdTests(t)`, mẫu `prS6fB.tests.ts:1-15`: `const doc = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8')`), đăng ký **cuối** `run.ts` (sau `runPrS6fBTests`, `run.ts:9834`);
  - phép kiểm đọc nguồn chỉ khẳng định **cấu trúc có thật** (có SVG, có nhánh `dienThoai`, không còn lớp cũ) — không khẳng định chữ;
  - tương phản tính bằng `d.tuongPhan` + `d.docMauHaiCheDo` (như `prSang.tests.ts:61-69`);
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): bàn phím (Esc, Tab, focus trả về), `aria-*`, vùng bấm 44 px. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho model yếu hơn

1. Mỗi Task đã ghi **file:dòng** và **mẫu dùng lại**. Không thấy đúng chỗ → `grep` tên hàm, không đoán.
2. Không tự đổi chữ trên màn (đó là việc UXF-b / S3). Chỉ đổi bố cục, cỡ, khoảng cách, chỗ đặt.
3. Không sửa `Filters.tsx`, `IntakePanel.tsx`, bảng Quản lý (D7) — xem bảng file chồng.
4. Mỗi thay đổi trên điện thoại phải để **≥ 640 px y như cũ** — kiểm bằng ảnh 1440 ở Task 8.

## Task 0 · Chuẩn bị + ảnh "trước" 375 px

- [ ] Ghi **model thật** (dòng hệ thống / `Co-Authored-By` mặc định) vào Nhật ký; sẽ chép vào thân PR.
- [ ] Worktree `.claude/worktrees/pr-uxd-dien-thoai` từ `origin/main` (@ `0c9c04f6` trở đi); `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký. (Tham chiếu S6F-b: 2232 phép kiểm chính · tốc độ 29.)
- [ ] Đọc nguồn: kiểm kê (c) dòng A + B2c/B3/B4; Q31-3; mockup 23 màn C, 13 mục 4, 21 mục 5; `TheDong.tsx`; `TheKyNang.tsx` (thẻ VAI-b, để khớp kiểu).
- [ ] **Ảnh trước + đo** (chỉ 375, sáng + tối) theo bảng KIỂM cột "Nằm ở", vai GVCN FT (7), GVBM (9), GVCN lớp thường (MB FOU 12), QL (2):
  ảnh `thiet-ke/anh/pr-uxd/{muc}-{vai}-375-{sang|toi}-truoc.png`; mỗi màn ghi `scrollWidth` vào Nhật ký thành bảng "màn · vai · scrollWidth · tràn?".
  Màn tràn **không** nằm trong Task 1–6 → đưa vào Task 7.
- [ ] Commit `PR-UXD (0): kế hoạch + mốc {B} + ảnh trước 375`.

## Task 1 · Thanh dưới có biểu tượng (UX-D9, mockup 23 màn C) — impeccable `layout` + `adapt`

**Files:** `web/src/App.tsx` (`SoCho` :42-51, `NutDay` :66-75, thanh dưới :157-162) · tạo `server/src/tests/prUxd.tests.ts` + đăng ký cuối `run.ts`.

Hiện trạng: `NutDay` chỉ có chữ `text-[11px]`, `py-2.5` (cao ~36 px, dưới 44 px), mục đang mở chỉ đổi màu chữ; số `SoCho` nằm sau chữ nên dễ cắt "Công vi…".

- [ ] **Phép kiểm trước** (`prUxd.tests.ts`, khối "Task 1"): tách thân `function NutDay` trong `App.tsx` bằng regex rồi khẳng định
  - có `<svg` và một bảng biểu tượng có đủ 4 khoá `'tong-quan'`, `'hoc-vien'`, `'test'`, `'cong-viec'`;
  - có `min-h-[56px]`; **không** còn `text-[11px]`;
  - có phần tử vạch mục đang mở (ví dụ `h-[3px]` trong nhánh `active`).
- [ ] Sửa (Q3):
  ```tsx
  /** Biểu tượng nét mảnh 20 px của thanh dưới — đường vẽ chép từ mockup 23 (`#i-home` … `#i-work`). */
  const BIEU_TUONG: Record<KhuVuc, ReactNode> = {
    'tong-quan': <path d="M3.5 9.5 10 4l6.5 5.5M5 8.5V16h3.5v-4h3v4H15V8.5" />,
    'hoc-vien': <><circle cx="7.5" cy="7" r="2.6" /><path d="M2.8 16c.6-2.7 2.4-4.1 4.7-4.1s4.1 1.4 4.7 4.1" /><circle cx="14" cy="7.6" r="2" /><path d="M13.6 11.9c1.8 0 3.1 1.2 3.6 3.4" /></>,
    test: <><rect x="4.5" y="3.8" width="11" height="13" rx="1.6" /><path d="M8 3.8V3h4v.8M7.5 9h5M7.5 12.2h5" /></>,
    'cong-viec': <path d="m3.8 6.2 1.5 1.5L8 5M3.8 12.2l1.5 1.5L8 11M10.8 6.5h5.4M10.8 12.5h5.4" />,
  };
  ```
  - `NutDay`: `relative flex flex-1 min-w-0 min-h-[56px] flex-col items-center justify-center gap-[3px] text-[11.5px]`; `<svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{BIEU_TUONG[muc.key]}</svg>` rồi `<span className="truncate max-w-full">{muc.labelNgan}</span>`;
  - đang mở: chữ `text-[color:var(--accent-strong)] font-semibold` + `<span aria-hidden className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b bg-[color:var(--accent)]" />`;
  - `SoCho` thêm prop `className` để thanh dưới đặt số **tuyệt đối** `absolute top-[5px] left-[calc(50%+5px)] ml-0`; thanh trên giữ `ml-1.5` như cũ; `sr-only` giữ;
  - `import type { KhuVuc }` từ `@shared/domain/index.ts`; `ReactNode` từ `react`.
- [ ] `main` vẫn `pb-20` (80 px ≥ 56 px + an toàn). Toast điện thoại `bottom-20` vẫn trên thanh — kiểm ở Task 3.
- [ ] **adapt:** 375 sáng + tối: 4 mục đều, chữ "Công việc" + số không cắt; Tab đi qua 4 mục, `aria-current` đúng.
- [ ] `npm run check` → commit `PR-UXD (1): thanh dưới điện thoại — biểu tượng 20 px, cao 56 px, vạch mục đang mở`.

## Task 2 · Thanh trên điện thoại: nút tìm, chữ cái tài khoản, chuông neo đáy thanh trên (VN33, rà VAI-a P2) — impeccable `adapt`

**Files:** `web/src/modules/platform/Header.tsx` (ô tìm :114-172, chuông :174-243, tài khoản :247-251) · `web/src/App.tsx` (`<header>` :107).

Hiện trạng:
- ô tìm `w-28 min-w-[4.5rem]` (:114) → 375 px còn "Tìm học";
- tên `truncate max-w-[4.5rem]` (:250) → "Nguyễn K…";
- bảng thông báo `fixed inset-x-2 top-14` (:190) → có DemoBar (`App.tsx:106`) thì đè lên thanh trên.

- [ ] **Phép kiểm trước** (khối "Task 2"):
  - `Header.tsx` có `useDienThoai` và một nút `aria-label="Tìm học viên, lớp"`;
  - **không** còn `w-28` và `max-w-[4.5rem]`;
  - **không** còn `top-14` (bảng neo theo header);
  - `App.tsx`: thẻ `<header` có `relative`.
- [ ] Sửa (Q5, Q6):
  - `const dienThoai = useDienThoai();` `const [moTimDt, setMoTimDt] = useState(false);` `const nutTim = useRef<HTMLButtonElement>(null);`
  - Tách JSX ô tìm + danh sách kết quả (:115-171) thành biến `oTimVaKetQua` (không đổi logic, `ref={oTim}` giữ). **Máy tính:** vẽ trong `<div className="relative w-52 lg:w-64 shrink">` như cũ (bỏ `w-28 min-w-[4.5rem]`).
    **Điện thoại:** nút `ref={nutTim}` `className="btn btn-sm min-h-[44px] min-w-[44px] justify-center"` `aria-label="Tìm học viên, lớp"` `aria-expanded={moTimDt}` với SVG kính lúp (mockup `#i-search`: `<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>`, viewBox 16, 18 px); bấm → `setMoTimDt(true); setOpenMenu(null)`; khi mở vẽ `<div className="card absolute inset-x-2 top-full z-40 mt-1 p-2 shadow-2xl">{oTimVaKetQua}</div>` và `autoFocus` ô.
    Danh sách kết quả bên trong khối điện thoại bỏ `absolute … right-0` (dùng `static w-full`) — một biến `laDt` chọn lớp.
  - Esc (:80-92): khi `moTimDt` → đóng và `nutTim.current?.focus()`; bấm ra ngoài (:64-70) → `setMoTimDt(false)`; `moMuc` → đóng. `dangMo` thêm `|| moTimDt`.
  - Chuông: khung bọc (:174) `relative` → `sm:relative`; bảng (:190) `fixed inset-x-2 top-14` → `absolute inset-x-2 top-full mt-1` (giữ `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full …`). Khung bọc ô tìm điện thoại cũng **không** `relative`.
  - `App.tsx:107` `<header className="relative shrink-0 …">`.
  - Tài khoản (:248-251): điện thoại vẽ `<span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-full font-bold text-[13px]" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{chuCaiDau}</span>` với `const chuCaiDau = (session?.user?.fullName ?? '').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '';`; nút `aria-label={`Tài khoản ${fullName}`}` `min-w-[44px]`. ≥ 640 px giữ tên `max-w-[10rem]` như cũ.
  - Không đổi chữ nào; nút ◐ (`CongTacGiaoDien`) giữ chỗ.
- [ ] **adapt:** 375 có DemoBar (bản demo) và không DemoBar (giả `banChinh`): bảng thông báo và ô tìm nằm **ngay dưới** đáy thanh trên, không đè; thanh trên một hàng: P · khoảng trống · tìm · chuông · ◐ · chữ cái. Bàn phím: Tab tới nút tìm → Enter mở → gõ "ft101" → ↓ Enter mở lớp; Esc trả focus về nút.
- [ ] `npm run check` → commit `PR-UXD (2): thanh trên điện thoại — nút tìm, chữ cái tài khoản, chuông và ô tìm neo đáy thanh trên`.

## Task 3 · Toast không che nút panel (VN17) + viền ô nhập chế độ tối ≥ 3:1 (U13) — impeccable `polish`

**Files:** `web/src/ui/Toast.tsx` (:46 vùng toast, :55 dấu ✓) · `web/src/index.css` (khối `:root` tối :75, :87; quy tắc mới cạnh `.table-scroll` :172).

Hiện trạng:
- Thêm học viên: toast "Đã đọc n dòng" (`IntakePanel.tsx:98`) ở góc phải dưới che nút "Thêm n học viên" của chân panel (`KhungPanel.tsx:84-98`) vài giây;
- `--o-nhap-vien` tối = `var(--line-strong)` (rgba 0,26 — ~1,6:1), `--o-sua-vien` tối `#3d5f8f` (~2,6:1); phép kiểm `prSang` S2 chỉ kiểm chế độ sáng.

- [ ] **Phép kiểm trước** (khối "Task 3"):
  - `index.css` có quy tắc chứa `:has([aria-modal="true"])` và lớp `vung-toast`; `Toast.tsx` dùng lớp `vung-toast` và `IconDat`, không còn ký tự `✓`;
  - U13: với `toi = d.docMauHaiCheDo(css).toi`, `o-nhap-vien` và `o-sua-vien` **có giá trị** (màu đặc) và `d.tuongPhan(toi[v], toi[n]) >= 3` với `n` ∈ {`surface`, `surface-2`} (mẫu `prSang.tests.ts:61-69`, đổi `sang` → `toi`).
- [ ] Sửa (Q7):
  - `Toast.tsx:46`: thêm lớp `vung-toast` vào `div` vùng toast (giữ `fixed bottom-20 md:bottom-4 right-4 z-[100] …`);
  - `index.css`: `body:has([aria-modal="true"]) .vung-toast { top: 3.75rem; bottom: auto; }` (3.75rem = dưới đầu panel 52 px); kèm chú thích một dòng "VN17: có panel mở thì toast lên trên, không che chân panel";
  - `Toast.tsx:55`: `✓` → `<IconDat className="mr-1.5 text-slate-400" />` (import từ `./BieuTuong.tsx`).
- [ ] Sửa (Q8): khối `:root` tối — `--o-nhap-vien: #64748b;` · `--o-sua-vien: #4f79b3;` (hoặc giá trị khác qua phép kiểm, **tính bằng `tuongPhan`**). Khối sáng không đổi. Chạy lại prSang S1–S6 (vẫn xanh).
- [ ] **polish:** Thêm học viên 1440 + 375: dán 4 dòng → toast hiện **trên**, nút "Thêm n học viên" bấm được ngay; Hoàn tác (ví dụ ghi vi phạm) không panel → chỗ cũ. Lưới chấm + ô nhập Tạo lớp chế độ tối: viền thấy rõ, không chói.
- [ ] `npm run check` → commit `PR-UXD (3): toast không che chân panel; viền ô nhập tối ≥ 3:1`.

## Task 4 · Hồ sơ HV điện thoại: Mock Test / Kết quả kiểm tra thành thẻ, hàng tab vừa màn (VAI-b chuyển, D2) — impeccable `adapt` + `layout`

**Files:** `web/src/modules/students/StudentDetailPage.tsx` (`IeltsAttempts` :410-487, `RatioAttempts` :489-537, gọi ở :312-320, `dienThoai` có sẵn :73) · `web/src/ui/HangTab.tsx` (:15-31).

Hiện trạng: hai bảng `min-w-[640px]` trong `overflow-x-auto` (:423, :495) — ở 375 phải cuộn ngang mới thấy cột Kết quả. Hàng tab hồ sơ (`Học thuật · Ý thức & Phối hợp · Hành trình`, `px-3`) sát 343 px; thêm chấm ● là cuộn.

- [ ] **Phép kiểm trước** (khối "Task 4"):
  - thân `IeltsAttempts` và `RatioAttempts` mỗi hàm có `useDienThoai()` (hoặc nhận prop `dienThoai`) **và** `<TheDong`;
  - `HangTab.tsx` có `px-2.5 sm:px-3` và `scrollIntoView`.
- [ ] Sửa (Q9) — đầu mỗi hàm, trước `return (<div className="overflow-x-auto">…`:
  ```tsx
  const dienThoai = useDienThoai();
  if (dienThoai) return (
    <div>{attempts.map((a) => (
      <TheDong key={a.id} className={a.id === dotId ? 'bg-[color:var(--accent-soft)]' : ''}
        dau={/* MT{n} link + nhãn nhỏ + tuanLich · bên phải KetQuaDot */}
        dong={[
          { nhan: 'Điểm', noiDung: /* L R W S, mỗi điểm Link duongDotTest(a, k) như bảng */ },
          { nhan: 'Overall', noiDung: fmtBand(a.overall) },
          { nhan: 'Kỳ vọng', noiDung: fmtBand(a.expectation) },
          { nhan: 'Lớp', noiDung: a.classCode ?? '—' },
        ]} />
    ))}</div>
  );
  ```
  - đầu thẻ: `flex items-start justify-between gap-2`; trái `Link` `MT{a.attemptNo}` (font đậm) + `ChipLichSu` / nhãn nhỏ như bảng (:445-456) + `tuanLich(a.weekStart, homNay)` 12 px; phải `KetQuaDot` (+ `scopeNote` 12 px dưới, tầng 3);
  - `RatioAttempts` tương tự: đầu `Giữa khoá|Cuối khoá · W3 SEP` + `KetQuaThuongO`; dòng `Điểm từng phần` (chip `Outcome` như :517-523) · `Lớp` · `Hồ sơ đợt ›` (link `attemptHref(a)`, vùng bấm 44 px — `TheDong` đã nới `a.link`);
  - `import { TheDong, useDienThoai } from '../../ui/TheDong.tsx'` (thêm `TheDong` vào dòng :30);
  - không dùng `onClick` cả thẻ (link bên trong đủ); `id={`dot-${a.id}`}` đặt trên thẻ để `?dot=` vẫn cuộn tới.
- [ ] Sửa (Q10) `HangTab.tsx`: nút `px-3` → `px-2.5 sm:px-3`; thêm `const hang = useRef<HTMLDivElement>(null)` + `useEffect(() => { hang.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [value]);`.
  Không đổi nhãn tab. Hồ sơ HV 3 tab còn cuộn ở 375 → ghi Nhật ký, **không** tự đổi chữ (báo planning cho S3).
- [ ] **adapt** 375 sáng + tối: hồ sơ HV FT (MT1–MT3, có MT lịch sử) và hồ sơ HV lớp thường (Giữa khoá + Cuối khoá): không cuộn ngang, Kết quả thấy ngay; bấm `MT2` mở hồ sơ Mock; bấm điểm L mở hồ sơ Mock cuộn tới Listening. **layout:** tầng 1 (Kết quả) trên cùng bên phải, tầng 3 (Lớp) cuối thẻ.
- [ ] `npm run check` → commit `PR-UXD (4): hồ sơ HV điện thoại — Mock Test / Kết quả kiểm tra thành thẻ; hàng tab vừa màn`.

## Task 5 · Lịch Test điện thoại: bộ lọc gọn "Lọc", dải số một hàng (UX-D8, mockup 13 mục 4) — impeccable `adapt` + `layout`

**Files:** `web/src/modules/test/LichTestTab.tsx` (hàng lọc :176-217) · `web/src/modules/test/lichTest/DaiSo.tsx` (:12).

Hiện trạng: hàng lọc `flex flex-wrap` có `WeekPicker` (26rem), công tắc khung, `NutLuat`, "Lớp tôi dạy / Tất cả", Xuất Excel, `BranchFilter` (select `w-44` có nhãn) → ở 375 xuống 4–5 dòng, đẩy dải số và lưới xuống dưới màn đầu. Dải số `grid-cols-2` (2×2).

- [ ] **Phép kiểm trước** (khối "Task 5"):
  - `LichTestTab.tsx` có `useDienThoai` và nút có chữ `Lọc` đi kèm `IconGap` (không ký tự `▾`);
  - `DaiSo.tsx` có `grid-cols-4` cho điện thoại (không còn chỉ `grid-cols-2 … md:grid-cols-4`).
- [ ] Sửa (Q11):
  - `const dienThoai = useDienThoai(); const [moLoc, setMoLoc] = useState(false);`
  - **Điện thoại:** hàng 1 = `WeekPicker` (nguyên component, `w-full`) ; hàng 2 = `CongTacKhung` + `flex-1` + nút `<button type="button" className="btn btn-sm min-h-[44px]" aria-expanded={moLoc} onClick={() => setMoLoc((v) => !v)}>Lọc{soLoc ? ` · ${soLoc}` : ''} <IconGap mo={moLoc} /></button>`;
    khi `moLoc`: khối `card p-3 grid gap-3` gồm `BranchFilter`, nhóm "Lớp tôi dạy / Tất cả" (giữ nguyên JSX :195-208, nút `min-h-[44px]`), `NutLuat` (nếu `loai === 'thuong'`), Xuất Excel (nếu `session?.nav?.xuatMt`).
    `soLoc = (branchId ? 1 : 0) + (data.coPhamViRong && data.phamVi !== macDinhPhamVi ? 1 : 0)` — `macDinhPhamVi` lấy đúng mặc định máy chủ đang trả (đọc `data.phamVi` lúc không có tham số URL; không rõ → chỉ đếm chi nhánh, ghi Nhật ký).
  - **Máy tính:** JSX hàng lọc cũ giữ **y nguyên**.
  - `DaiSo.tsx:12`: `grid grid-cols-4 gap-1.5 md:gap-2`; ô `O` điện thoại `px-2 py-1.5`, số `text-base md:text-lg`, nhãn 11 px tối đa 2 dòng; đơn vị "bài" giữ. Ở 375 có số xuống dòng / tràn → trả về `grid-cols-2 md:grid-cols-4`, ghi Nhật ký (Câu 2).
- [ ] **adapt** 375, GVBM (9) và QL (2), sáng + tối: màn đầu thấy bộ chọn tuần + dải số + đầu khối Nợ; "Lọc · 1" khi đã chọn chi nhánh; Esc / bấm lại đóng khối lọc. **layout:** thứ tự mockup 13: tuần → số → Nợ → lớp.
- [ ] `npm run check` → commit `PR-UXD (5): Lịch Test điện thoại — bộ lọc gom vào Lọc, dải số một hàng`.

## Task 6 · Học viên & Lớp: dòng phụ hàng lớp có lộ trình (U14, mockup 21 mục 5) — impeccable `polish`

**Files:** `web/src/modules/students/StudentsPage.tsx` (kiểu `LopTrenTrang` :24-34, thẻ điện thoại :343-345, bảng :364-367).

- [ ] **Phép kiểm trước** (khối "Task 6"):
  - API: `/hoc-vien-lop` của QL MB (`listHocVienLop` hoặc gọi HTTP như `prVaiB.tests.ts`) — mỗi lớp FT có `route` ∈ {`LT1`, `LT2`, `RF`} (xanh trên main — bảo vệ dữ liệu);
  - nguồn: kiểu `LopTrenTrang` có `route`; `StudentsPage.tsx` đọc `lop.route` ở **cả hai** chỗ vẽ dòng phụ (đỏ trên main).
- [ ] Sửa (Q12): kiểu thêm `route: string | null;`; một hằng trong `HopLop`:
  `const chuLop = [lop.programmeName ?? '—', !thuong && lop.route ? lop.route : null, `${lop.studentCount} HV`].filter(Boolean).join(' · ');`
  dùng ở thẻ (:344) và bảng (:366, cả `title` :365). Phần GVCN giữ như cũ.
- [ ] **polish** 375 + 1440: `MB FT 101 · Fast Track · LT1 · 18 HV · GVCN …` một dòng (máy tính `truncate`, điện thoại xuống dòng được), 11 px như cũ.
- [ ] `npm run check` → commit `PR-UXD (6): hàng lớp FT ghi lộ trình LT1/LT2/RF`.

## Task 7 · Sót 375 ở màn GV hằng ngày + ảnh 375 LT2b (R5-6) + ba tầng phần còn (V9) — impeccable `adapt`

**Files:** theo bảng đo Task 0 — chỉ màn trong cột "Nằm ở" của KIỂM, chỉ phần trình bày. Danh sách dự kiến (kiểm từng màn, **đã đạt thì ghi "đã có, bỏ"**):

| Màn | Hiện trạng (đọc mã main) | Việc nếu đo thấy lỗi |
|---|---|---|
| Tổng quan GV | VAI-a: "Hôm nay" 3 việc + Xem hết, Lớp tôi dạy thẻ (`LopToiDay.tsx:23`), Cần xử lý thẻ (`KhoiCanXuLy.tsx:28,68`) | chỉ sửa tràn |
| Tổng quan QL | Cần xử lý thẻ; bảng "Theo lớp" `table-scroll` (`BranchPulse.tsx:83`) — D7 hoãn | chỉ bảo đảm trang không cuộn |
| Công việc › Việc học viên / Yêu cầu của tôi / Chờ duyệt | `ViecCuaToi` có nhánh điện thoại; chip `flex-wrap` (`HoTroHocVienTab.tsx:122`); `TheYeuCau` `sm:grid-cols` | chip ≥ 44 px, không tràn |
| Hồ sơ HV › Ý thức · Hành trình · Ngăn Case | VAI-b + PR-YT4 đã làm thẻ / tab | chỉ sửa tràn |
| Lưới chấm FT `/nhap-diem/:id`, lớp thường `/bang-diem-thuong/:id` | `MotKyNang` (< 768) | chỉ sửa tràn; đầu trang `ChamDiemPage` một hàng |
| Hồ sơ Mock `/mock-test/:id` | `ODiemLon` | chỉ sửa tràn |
| **R5-6 LT2b**: hồ sơ HV lớp thường có `KetLuanKhoa` + ô Mini Test (`StudentDetailPage.tsx:286-290`), bảng điểm Cuối khoá có "% tổng · Hướng gợi ý" (`BangDiemLopThuong.tsx`), panel Chuyển lớp cả lớp (QL) | chưa ai chụp 375 | chụp 375 sáng + tối; sửa tràn |

- [ ] **Phép kiểm trước:** mỗi lỗi sửa có **một** dòng phép kiểm đọc nguồn khẳng định cấu trúc mới (ví dụ có nhánh `useDienThoai`, có `min-w-0`); không có lỗi nào → Task này chỉ chụp ảnh, không commit mã (ghi Nhật ký).
- [ ] **V9 (Q13):** với mỗi màn GV hằng ngày, ghi một dòng "tầng 1 của màn này là: …" vào Nhật ký (chép vào thân PR). Ở màn PR này đã chạm (thẻ Mock Test, Lịch Test, thanh dưới), tầng 3 đứng cuối hoặc ẩn trên điện thoại.
- [ ] `npm run check` → commit `PR-UXD (7): sót 375 ở màn GV hằng ngày; ảnh 375 LT2b` (bỏ commit nếu không đổi mã).

## Task 8 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (nếu UXF-b / Dọn đã merge) → gỡ theo bảng file chồng → `npm run check`.
- [ ] Chạy bảng **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), GVCN FT (7), GVBM (9), GVCN lớp thường (MB FOU 12), Quản trị (1). **Mọi màn GV hằng ngày** chụp ở **375 sáng + 375 tối** (và 1440 sáng + tối để chứng minh máy tính không đổi): `thiet-ke/anh/pr-uxd/{muc}-{vai}-{1440|375}-{sang|toi}-sau.png`.
  Mỗi ảnh 375 ghi `document.documentElement.scrollWidth` (phải `<= 375`) vào Nhật ký; một màn > 375 → sửa trước khi mở PR.
- [ ] impeccable **`audit`** trên các màn đã chạm, rồi **`polish`** (sáng **và** tối). Kiểm:
  - vùng bấm ≥ 44 px trên điện thoại; Tab / Esc / focus trả về;
  - 12 px cho kết quả, hạn, người; mã tuần; không ký tự nhỏ ▾ ✓;
  - ≥ 640 px giống ảnh trước.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] `CODE_MAP.md`: một dòng PR-UXD (thanh dưới biểu tượng `App.tsx`, nút tìm điện thoại `Header.tsx`, thẻ Mock Test `StudentDetailPage.tsx`, `vung-toast` `index.css`, phép kiểm `prUxd.tests.ts`); dòng `TheDong.tsx:33` sửa "(PR-UXD dùng lại cho D1)" → "(PR-UXD dùng lại cho Mock Test / Kết quả kiểm tra)".
- [ ] Quét: không còn `npm run check` treo; tắt 4157/5357.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - **model thật**;
  - bảng mục (mã → ảnh trước/sau 375 → đạt);
  - "tầng 1 của màn này là …" cho từng màn GV hằng ngày (V9);
  - mốc B → số phép kiểm cuối;
  - "Chuyển cho PR khác" + "Hoãn";
  - `ponytail:`.

## Câu hỏi cho chủ sản phẩm (kế hoạch chạy theo khuyến nghị nếu anh/chị không trả lời)

> **ĐÃ CHỐT 01/10 (planning, theo Q31-3):** Câu 1 = A (hoãn Thêm HV dạng thẻ) · Câu 2 = A (một hàng; dồn chữ thì về 2×2) · Câu 3 = A (giữ bảng cuộn trong khung).

- **Câu 1 — Thêm học viên trên điện thoại (D1)?**
  - A. **Hoãn**: ai thêm học viên thường làm trên máy tính, dán từ Excel; điện thoại vẫn dùng được (lưới cuộn trong khung).
  - B. Làm luôn: mỗi em một thẻ nhập trên điện thoại (thêm 1 Task, cỡ M).
  - **Khuyên A** (Q31-3 chỉ làm màn GV dùng hằng ngày). Kế hoạch theo A.
- **Câu 2 — Bốn số ở đầu Lịch Test trên điện thoại?**
  - A. **Một hàng 4 ô** như mockup 13 (số nhỏ hơn một chút, nhãn có thể 2 dòng) — thấy lưới sớm hơn.
  - B. Giữ **2×2** như hiện nay (chữ thoáng hơn, cao thêm một hàng).
  - **Khuyên A** (đúng mockup đã duyệt); nếu đo thấy chữ bị dồn thì tự về B và ghi lại.
- **Câu 3 — Hồ sơ lớp › tab Phân tích lớp và panel Lộ trình học viên trên điện thoại?**
  - A. **Giữ bảng cuộn trong khung** (không phải màn hằng ngày; trang không cuộn ngang).
  - B. Đổi thành thẻ như Mock Test (thêm 1 Task, cỡ S–M).
  - **Khuyên A**. Kế hoạch theo A.

## Hoãn (không làm ở PR này)

| Việc | Lý do | Khi nào |
|---|---|---|
| **UX-D7** — Vận hành, Báo cáo đơn vị, bảng "Theo lớp" Tổng quan QL, Quản trị › Tài khoản thành thẻ | Q31-3 chủ SP 01/10: bảng quản trị để máy tính | sau deploy, khi QL cần điện thoại |
| **D1** — Thêm học viên dạng thẻ | không phải màn hằng ngày (Q2, Câu 1) | nếu chủ SP chọn B |
| Bảng hồ sơ lớp › Phân tích lớp, panel Lộ trình HV, Kế hoạch Test, Phân tích | không phải màn GV hằng ngày; cuộn trong khung (Q15, Câu 3) | sau deploy |

Đã có, bỏ: bảng kỹ năng hồ sơ HV thành thẻ (UX-D3 — VAI-b `TheKyNang.tsx`), đầu hồ sơ xếp dọc, Hành trình điện thoại (UX-D4 — VAI-b), thông báo neo hai mép + Cần làm / Để biết (UX-D6, K1-42 — VAI-a), Tổng quan "Hôm nay" 3 việc (VAI-a), dòng thời gian Ý thức (UX-D5 — PR-YT4), lưới chấm từng kỹ năng (`MotKyNang`), chú giải Hành trình 8 ký hiệu (K3-30, K3-48 — VAI-b), "Cách tính" bấm chỉ mở (S6F-b), lối tắt "Học viên cần hỗ trợ" (Q4).

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo UXD để lại |
|---|---|---|
| Nhãn tab hồ sơ HV ngắn hơn trên điện thoại (nếu `px-2.5` vẫn chưa vừa) | **PR-S3** (chữ) | Nhật ký Task 4 ghi bề rộng đo được |
| Đổi link bảng Mock Test / Kết quả kiểm tra (`attemptHref`, G5) | **PR-UXF-b** | thẻ điện thoại đọc cùng trường `a.*`, cùng `attemptHref(a)` — đổi bảng thì đổi thẻ |
| Bộ chọn tuần lấy mã tuần làm chữ chính (B5, `Filters.tsx:182-183`) | **PR-UXF-b** | UXD không sửa `Filters.tsx`; Lịch Test điện thoại chỉ đặt lại chỗ |
| `IntakePanel` `useLoiForm` (O5) | **PR-Dọn** | UXD không sửa `IntakePanel.tsx` |
| Chú thích "ký tự nhỏ của Inter" (Dn8) | **PR-S3** (Dọn Q19) | UXD không sửa `BieuTuong.tsx` |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | GVCN FT (7) | **Thanh dưới** (mọi trang, < 640 px) | xem, bấm từng mục | 4 mục: biểu tượng 20 px + chữ, cao 56 px; mục đang mở xanh + vạch trên đầu; số đỏ việc quá hạn ở góc biểu tượng "Công việc" |
| 2 | QL (2) | Thanh dưới | xem | số cạnh "Công việc" = số thẻ Chờ duyệt (đỏ khi có quá hạn) |
| 3 | GVBM (9) | **Thanh trên** 375 (bản demo có DemoBar) | bấm kính lúp, gõ "ft101", Enter | ô tìm mở ngay dưới thanh trên, không đè; ra MB FT 101; Esc trả focus về nút; nút tài khoản là chữ "cái đầu" trong vòng tròn, không còn "Nguyễn K…" |
| 4 | GVCN FT | Thanh trên › **chuông** 375, có DemoBar | mở | bảng nằm **dưới** đáy thanh trên, neo hai mép, cuộn trong |
| 5 | GVCN FT | **Tổng quan** 375 | xem | không cuộn ngang; Hôm nay ≤ 3 việc + Xem hết |
| 6 | GVBM | **Công việc** › Việc học viên · Yêu cầu của tôi 375 | xem, bấm chip | không cuộn ngang; chip ≥ 44 px |
| 7 | GVCN FT | **Hồ sơ HV** FT (MB FT 101) › Học thuật 375 | cuộn tới Mock Test | mỗi MT một thẻ: `MT2 · W3 SEP` + Kết quả bên phải; dòng Điểm L R W S bấm được; Lớp ở cuối; không cuộn ngang. Hàng tab 3 tab vừa màn |
| 8 | GVCN thường | Hồ sơ HV lớp thường (MB FOU 12 / MB BE 04) › Học thuật 375 | Kết quả kiểm tra, Kết luận khoá, ô Mini Test | thẻ Giữa khoá / Cuối khoá có chip điểm từng phần + `Hồ sơ đợt ›`; R5-6 không tràn |
| 9 | GVBM | Hồ sơ HV › Ý thức & Phối hợp · Hành trình · mở một Case (Ngăn Case) 375 | xem | không cuộn ngang |
| 10 | GVBM | **Lưới chấm** `/nhap-diem/{MB FT 101}` 375 · `/bang-diem-thuong/{BE 04}` 375 | chấm một ô | chấm từng kỹ năng; không cuộn ngang; viền ô nhập tối thấy rõ |
| 11 | GVBM | **Lịch Test** 375 | xem, bấm "Lọc" | thấy tuần + 4 số + đầu khối Nợ ở màn đầu; khối Lọc có Chi nhánh / Lớp tôi dạy · Tất cả; "Lọc · 1" sau khi chọn chi nhánh |
| 12 | QL | Lịch Test 375 | "Lọc" › Xuất Excel | nút có trong khối Lọc |
| 13 | QL | **Học viên & Lớp** 375 + 1440 | xem hàng lớp FT | `Fast Track · LT1 · 18 HV · GVCN …` |
| 14 | GVCN FT | Học viên & Lớp › ⋯ lớp › **+ Học viên** (panel Thêm học viên) 1440 + 375 | dán 4 dòng | toast "Đã đọc 4 dòng" ở **trên**, không che "Thêm 4 học viên" |
| 15 | GVCN FT | Hồ sơ Mock (bấm MT2 từ thẻ) 375 | xem | không cuộn ngang |
| 16 | QL | Hồ sơ lớp BE 04 › ⋮ Chuyển lớp cả lớp 375 (R5-6) | xem | không cuộn ngang trang |
| 17 | QL | Công việc › Vận hành / Báo cáo đơn vị 375 (D7 hoãn) | xem | bảng cuộn **trong khung**; trang `scrollWidth <= 375` |
| 18 | mọi vai | mọi màn trên | 375 sáng + tối, 1440 sáng + tối | 375: `scrollWidth <= 375`; 1440 giống ảnh trước; 12 px kết quả / hạn / người; mã tuần |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, bảng đo 375, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | 0 | **Model thật: Sonnet 5.5** (claude-sonnet-5-5), effort High, `/ponytail lite`. Worktree từ `origin/main` @ `cebb6fff` (đã có PR #153). **Mốc B: 2232 phép kiểm chính · tốc độ 29**, `npm run check` xanh (chạy chậm ~25 phút vì có phiên khác chạy `check` cùng lúc). Dữ liệu thử: `node dist-server/server/src/seed/run.js` (DB `data/pisa-demo.sqlite` ở worktree, gitignore). Id dùng chụp: QL 2 · GVCN FT 7 · GVBM 9 · GVCN lớp thường (BE 04) 8 · QT 1; MB FT 101 = 3, MB FOU 12 = 6, MB BE 04 = 18; HV FT = 1, HV BE 04 = 82, HV FOU = 8, Mock = 1 |
| 01/10 | 0 | **Bảng đo 375 "trước"** (`scrollWidth` lớn nhất của `<html>` và `<main id=noi-dung>`, sáng + tối): **mọi màn = 375, không màn nào tràn**: thanh dưới/Tổng quan (GVCN, QL) · Tổng quan GVBM · Công việc (Việc HV, Yêu cầu, Chờ duyệt, Vận hành, Báo cáo) · Hồ sơ HV FT (Học thuật, Ý thức, Hành trình) · Hồ sơ HV BE 04 · Hồ sơ HV FOU · Lưới FT · Bảng điểm thường · Lịch Test (GVBM, QL) · Học viên & Lớp (QL) · Hồ sơ Mock · Hồ sơ lớp BE 04 · bảng thông báo · ô tìm. → Task 7 không có màn tràn nào cần sửa; chỉ còn chụp ảnh "sau" + màn Chuyển lớp (R5-6, mở bằng thao tác, chụp ở Task 7). Ảnh: `thiet-ke/anh/pr-uxd/*-375-{sang|toi}-truoc.png` (22 màn × 2). Ghi chú: bảng thông báo 375 chụp "trước" khi có DemoBar |
| 01/10 | 1–3 | Phép kiểm trước chạy ĐỎ trên `main` bằng bộ chạy riêng (biên dịch vào `dist-uxd/`, không đụng `dist-server`): Task 1 ✗1 · Task 2 ✗1 · Task 3 ✗2 (toast + U13: `o-nhap-vien` tối chưa là màu đặc, `o-sua-vien` 2,59 / 2,39). Sau sửa xanh. **Task 1** `npm run check` xanh **2233**; **Task 2** xanh **2234** (lần đầu sập segfault 0xC0000005, chạy lại một lần xanh); **Task 3** chạy trên bản chụp commit `f9b12acd` — kết quả ghi ở dòng "Check cuối". U13: `--o-nhap-vien` tối `#64748b` (3,54 / 3,27) · `--o-sua-vien` tối `#4f79b3` (3,79 / 3,49) — tính bằng `tuongPhan`, sáng không đổi. Bấm thử Task 2 (375, có DemoBar, sáng + tối): header cao 57 px, ô tìm và bảng thông báo đều bắt đầu ở y = đáy header + 4 px; Tab → Enter mở → "ft101" → ↓ Enter mở lớp 3; Esc trả focus về nút kính lúp; nút tài khoản "T" (Phạm Thu Trang), `aria-label` "Tài khoản …", 51×44 px |
| 01/10 | 4 | Phép kiểm trước ✗1, sau xanh. Thẻ Mock Test / Kết quả kiểm tra bấm thử 375 sáng + tối, hồ sơ FT (HV 1), BE 04 (HV 82), FOU (HV 8): `scrollWidth` 375, **hàng tab 3 tab vừa 343 px** (`scrollWidth` = `clientWidth` = 343) kể cả tab Ý thức có ●. Không cần báo PR-S3 về nhãn tab. `TheDong` thêm prop `id` (neo `dot-{id}` cho `?dot=` — tránh bọc thêm `div` làm mất `first:border-t-0`); nhãn MT + chip điểm kỹ năng + chip điểm từng phần dùng chung bảng và thẻ (`nhanMt`, `diemKyNang`, `chipMon`) nên đổi bảng thì thẻ đổi theo. Dòng "Hồ sơ" của thẻ lớp thường là nhãn mới cho link "Hồ sơ đợt ›" (cột dl cần nhãn) |
| 01/10 | 5 | Phép kiểm trước ✗1, sau xanh. **Lệch kế hoạch (Câu 2, đã chốt "dồn chữ thì về 2×2")**: thử dải số một hàng 4 ô ở 375 → ô "Nợ tuần trước · 3 lớp" xuống dòng (`96 bài · 3 / lớp`) nên **giữ 2×2, `DaiSo.tsx` không đổi** (phép kiểm bỏ vế `grid-cols-4`). Công tắc khung trên điện thoại bỏ chữ "lớp" (`donVi=''`, chỉ số — như mockup 13) vì "Lớp thường · 5 lớp" bị cắt cạnh nút Lọc. `soLoc`: mặc định máy chủ `phamVi = 'cua-toi'` (`canCham.ts:415`) → đếm "Tất cả" là 1. Esc đóng khối Lọc nghe ở `document` (đổi chi nhánh làm trang tải lại, ô đang focus mất nên Esc ở container không bắt được); nhường Esc khi có `aria-modal`. Đo 375 GVBM: tuần + 4 số + đầu khối Nợ đều thấy ở màn đầu; "Lọc · 1" sau khi chọn chi nhánh |
| 01/10 | 6 | Phép kiểm trước: nguồn ✗, API xanh ngay trên `main` (QL MB: lớp FT có `route` LT1/LT2/RF, `MB FT RF 12` = RF; lớp thường `null`). Sửa xanh. Bấm thử 375 + 1440: `Fast Track · LT1 · 32 HV · GVCN …` (máy tính `truncate`, điện thoại xuống dòng được) |
| 01/10 | 7 | **Bảng đo 375 "sau"** (sáng + tối, `<html>` và `<main>`): **mọi màn = 375** sau khi sửa một lỗi tìm thấy ở R5-6: hồ sơ HV có hộp Kết luận khoá lên ELE + bổ trợ (HV 83, MB ELE 02) **tràn 440 px** do chip `Level` (`whitespace-nowrap`) chứa nhãn "Lên ELE + bổ trợ miễn phí 2 buổi (W, S) · …" → sửa cục bộ ở `KetLuanKhoa.tsx:55` (`[&>span]:max-w-full [&>span]:whitespace-normal [&>span]:rounded-xl`), không đụng `Level` dùng chung; phép kiểm cấu trúc thêm vào `prUxd.tests.ts`. Quét thêm 29 hồ sơ HV × 3 tab (FT, lớp thường, FOU, Pre FOU, ELE, BE…) ở 375: không còn tràn. Màn R5-6 đã chụp: hồ sơ HV Kết luận khoá (HV 82), Mini Test (HV 83), bảng điểm lớp thường BE 04 + nút Cuối khoá, panel **Chuyển lớp cả lớp** (QL, lớp BE 04) — đều 375. Các màn còn lại (Tổng quan GV/QL, Công việc ×5, Hồ sơ HV Ý thức/Hành trình, Lưới FT, Bảng điểm thường, Lịch Test GVBM/QL, Học viên & Lớp, Hồ sơ Mock, Hồ sơ lớp BE 04, bảng thông báo, ô tìm): đã có, bỏ — không sửa thêm |
| 01/10 | 7 | **V9 — "tầng 1 của màn này là …"** · Tổng quan GV: khối "Hôm nay" (việc quá hạn / hôm nay) · Công việc: việc cần làm theo hạn (thẻ, chip lọc) · Hồ sơ HV: bốn ô số đầu hồ sơ; trong khối Mock Test / Kết quả kiểm tra: **Kết quả** của từng lượt (bên phải đầu thẻ) — tầng 3 (Lớp, scopeNote) đứng cuối thẻ · Lưới chấm: ô điểm đang nhập / chấm từng kỹ năng · Lịch Test: số bài còn phải chấm và khối Nợ (dải số + đầu khối Nợ ở màn đầu) · Hồ sơ Mock: Overall + kết quả đợt · Học viên & Lớp: mã lớp + việc chờ (badge) — dòng phụ `Fast Track · LT1 · n HV · GVCN` là tầng 2 · Thông báo: nhóm "Cần làm" trước "Để biết". Không đổi chữ nào |
| 01/10 | 8 | **Audit (impeccable) trên các màn đã chạm**: detector `impeccable detect` trên 10 tệp đổi → `[]` (sạch). Vùng bấm: thanh dưới 56 px, nút tìm / chuông / ◐ / tài khoản 44 px, nút Lọc 44 px, link trong thẻ 44 px (`TheDong`). Còn **< 44 px ngoài phạm vi PR** (không sửa, ghi "Chuyển"): nút `‹ ›` Tuần trước / sau của `WeekPicker` 32×44 (`Filters.tsx` — thuộc UXF-b), nút "Thu gọn …" 16×16 ở khối Nợ / lớp, "Thu tất cả" 68×36, "← Quay lại" 83×28, "Lộ trình / + Case / ⋮" 37 px ở đầu hồ sơ HV, nút "Tất cả 95" các chip lọc 26 px, 7 nút số ở thẻ Tổng quan "Lớp tôi dạy" 12–23×28. **Polish**: không còn lỗi cần sửa trong phạm vi (sáng + tối xem ảnh sau). 1440 xem ảnh sau: hàng lọc Lịch Test, thanh trên, hàng lớp giữ nguyên như cũ. `/ponytail-review`: 1 việc (`NhanMt` component trong thân hàm → hàm thường `nhanMt`, đã sửa); còn lại gọn |
| 01/10 | 8 | **Lệch quy trình (cần chủ SP biết)**: (1) `npm run check` Task 3–8 chạy trên **bản chụp sạch** của commit (worktree phụ ngoài repo + liên kết `node_modules`) để vừa chờ vừa sửa tiếp, không chạy ở worktree chính; (2) vì mỗi lần `check` ~25–30 phút (3 phiên cùng chạy), Task 4–8 chạy **một lần ở HEAD cuối** thay vì mỗi Task một lần — Task 4–6 đã qua tsc web + bộ chạy riêng phép kiểm cấu trúc + bấm thử Playwright; (3) bộ chạy riêng `chayUxd` ở scratchpad (không commit) |
| 01/10 | 8 | **Check cuối: `npm run check` xanh ở HEAD `caa8ded1` — 2241 phép kiểm chính (mốc B 2232 + 9 `UXD`) · 29 tốc độ.** Task 3 riêng ở `f9b12acd`: 2236 + 29. Trước đó: một lần chạy ở HEAD đỏ 1 phép kiểm — `UXD (6)` API đòi mọi lớp FT có `route` nhưng các phép kiểm chạy trước trong bộ đầy đủ tạo thêm lớp FT thử (`MB FT 9906`, `K16CRA`…) chưa có lộ trình → giới hạn vào 6 lớp FT của bộ demo (commit `caa8ded1`); một lần sập segfault 0xC0000005 → chạy lại một lần xanh. Hai chuỗi `check` chạy chồng lên cùng thư mục bản chụp (lỗi của tôi: chuỗi đầu khởi chạy bằng công cụ nên không bị tắt khi tôi tắt chuỗi thứ hai) → log lẫn, **bỏ hết kết quả đó**, tắt cả hai, chạy lại sạch |
| 01/10 | 8 | **Cổng gộp `origin/main` (PR-Dọn-a #155, `f872df73`)**: chỉ `CODE_MAP.md` xung đột (cả hai bên thêm một dòng bảng) → giữ cả hai; `StudentsPage.tsx`, `run.ts` tự gộp (Dọn xoá `WorkQueue`, thêm `runPrDonATests` trước khối UXD). tsc web + server sạch. `npm run check` sập segfault 0xC0000005 hai lần liên tiếp (sập ở chỗ khác nhau, không phải phép kiểm hỏng) → theo kế hoạch chạy thẳng `tsc` + `run.js` + `tocDo.run.js` không qua npm: **2246 phép kiểm chính (Dọn-a 2237 + 9 `UXD`) · 32 tốc độ**, mọi mã thoát 0, tsc web + server 0 |
