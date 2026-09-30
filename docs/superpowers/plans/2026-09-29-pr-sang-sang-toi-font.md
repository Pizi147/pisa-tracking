# PR-SANG · Giao diện sáng/tối + phông chữ + cỡ chữ tối thiểu — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Nút nhỏ **◐** ở thanh đầu (giữa **Thông báo** và tên tài khoản) đổi **Tối ↔ Sáng**; mặc định **Tối** như hiện nay, nhớ
**theo từng máy** (T15). Chế độ sáng đọc được ở **mọi** trang/panel/menu, chữ đạt **WCAG AA ≥ 4.5:1** ở **cả hai** chế độ (YC-7).
Chế độ tối **giữ nguyên màu** như hôm nay. Web **tải kèm** phông **Be Vietnam Pro** (T16, E9) — hết cảnh "khai báo Inter nhưng mỗi máy
một phông". Không còn chữ < 11 px; kết quả · hạn · trạng thái · người phụ trách ≥ 12 px; `Nhan` 11,5 px (E4, YC-14 phần nền).
**Architecture:** **Không viết lại component.** Mọi màu đã/ sẽ đi qua **một chuỗi**: biến CSS ở `web/src/index.css` (khối `:root` = tối,
khối `:root[data-theme="light"]` = sáng) → `tailwind.config.js` ánh xạ **tên màu Tailwind đang dùng** (`slate-100`, `ink-800`,
`teal-600`, `white`…) về biến → ~830 chỗ gọi trong `web/src` tự đổi theo chế độ. Chỉ sửa tay ~6 chỗ màu viết cứng trong `.tsx` và
~11 giá trị cứng trong chính `index.css`. Công tắc = một thuộc tính `data-theme` trên `<html>` + `localStorage`. Phông = gói
`@fontsource/be-vietnam-pro` (tự phục vụ cùng tên miền, không gọi Google). Phép kiểm **quét nguồn** chặn màu cứng mới.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · phép kiểm `server/src/tests/*` (harness `check()` của `run.ts`), `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 **T15, T16** · §4.3 **YC-7**, **YC-14** (phần nền: font +
cỡ chữ) · §7.1 · §7.2 · **§7.4 Token** · §7.5 · §8 dòng PR-SANG (đợt 4, làn C′) · §9 UX-E **E4, E9** · §10.2 ·
`thiet-ke/nguon-27-09/YEU_CAU_CHINH_SUA.md` §7, §14 · kế hoạch cũ `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` E4, E9 ·
mockup `thiet-ke/mockup/19-nang-cap-27-09.html` **M12** + khối token `:root`/`[data-theme="light"]` (:11-34) · `thiet-ke/HE_GIAO_DIEN.md` §1–§2 ·
"Chuyển cho PR-SANG" của `docs/superpowers/plans/2026-09-28-pr-nen-nen-giao-dien.md` (số đếm `HangTab` nền `doing`, màu sáng/tối) ·
`thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` mục 7–8 (font không tải; "866 chỗ gọi thẳng màu tối").

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-SANG** · đợt 4 · làn **C′** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-sang-sang-toi-font` · `.claude/worktrees/pr-sang-sang-toi-font` (từ `origin/main` **sau khi** PR-HSM, PR-HVL, PR-XUAT đã merge) |
| Cổng thử | API **4187** · Vite **5387** (làn D; không dùng 4000/5173) |
| Model | **Sonnet 5 · High** · phương án B: **Fable 5.1 · High**. Đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng (T52) — rà **gọn** (không migrate, không máy chủ, không quyền) nhưng soi kỹ ảnh hai chế độ |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Không.** Không bảng/cột mới, không đường API mới, không sửa máy chủ (trừ phép kiểm) |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR giao diện thuần). impeccable: **`clarify`** Task 5 (chữ nút ◐) · **`polish`** Task 7 (cỡ chữ từng file) · **`colorize`** Task 8 (chỉ rà bảng màu sáng — không thêm màu), **`adapt`** Task 8 (thanh đầu 375 px), **`audit`** rồi **`polish`** Task 8. **Không** `init`/`document`/`hooks on`/`npx impeccable install\|update`; không tạo PRODUCT.md/DESIGN.md. **Không** taste-skill (đã tắt — CLAUDE.md). Trước PR: **`/ponytail-review`**, liệt kê mọi chú thích `ponytail:` |
| Phụ thuộc | **Chạy sau cùng đợt 4**: PR-HSM, PR-HVL, PR-XUAT phải merge trước (Task 0 kiểm). Chúng thêm màn mới → phép quét của PR này phải phủ cả màn của chúng |
| Không làm | Đổi bố cục, thêm màu nghĩa mới, đổi thang SOS (HE §2 khoá) · nâng toàn bộ `text-[11px]` → 12 px (câu hỏi 2) · bảng → thẻ điện thoại (PR-UXD) · hệ ba tầng cho từng màn (mỗi PR giao diện tự làm màn của mình — §7.5) · in ấn / xuất Excel (không liên quan màu màn hình) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy nền,
  không chạy chồng) → xanh, số phép kiểm ≥ mốc B → commit `PR-SANG (n): …`. Sập Node (mã 139 / segfault) **không** phải phép kiểm hỏng →
  chạy lại **một** lần.
- Treo quá 10 phút → quét `node … tests/run.js` còn sống (`Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`), tắt hết,
  chạy lại **một** lần.
- Máy thử trong worktree: `PORT=4187 npm run dev:api` + Vite tạm cổng **5387** trỏ proxy về 4187 (bộ nhớ "Máy chủ dev trong worktree";
  `preview_start` chạy từ thư mục chính — **không** dùng). Playwright **kênh Chrome**, đăng nhập demo `POST /api/demo/session {userId}`:
  **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang id 9**.
- Ảnh: "trước" chụp **một lần** ở Task 0 (bản `main`, tối); "sau" chụp **một lần** ở Task 9 (tối + sáng + xám). Lưu `thiet-ke/anh/pr-sang/`.
- Không chạm Turso, không deploy, không `migrate`. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước khi báo xong: tắt
  4187/5387, quét `tests/run.js` treo, dọn file Playwright/Vite tạm (để ở scratchpad, **không** commit).

### Cổng rebase (PR chạm nhiều file — chạy sau cùng đợt 4)

PR này sửa **ít file** (index.css, tailwind.config.js, index.html, main.tsx, Header.tsx, 1 file ui mới, ~6 file có màu cứng, ~40 file
đổi cỡ chữ). Xung đột thật chỉ có thể ở cỡ chữ (Task 7) và màu cứng (Task 4) trong màn HSM/HVL/XUAT vừa viết.

| File | PR khác có thể sửa | PR-SANG chỉ được sửa | Gỡ |
|---|---|---|---|
| `web/src/index.css` | HSM/HVL (lớp CSS mới, vd. `ODiemLon`) | biến màu + khối sáng + thay giá trị cứng bằng biến; lớp của PR khác **giữ**, chỉ thay số màu cứng bằng biến | giữ lớp của họ |
| `tailwind.config.js` | (không ai dự kiến) | `colors`, `fontFamily` | — |
| `web/src/modules/platform/Header.tsx` | (không ai dự kiến) | chèn **một** `<CongTacGiaoDien />` giữa khối Thông báo và khối tài khoản | — |
| file màn của HSM/HVL/XUAT | họ vừa viết | chỉ đổi lớp cỡ chữ (Task 7) và màu cứng (Task 4) | lấy bản của họ rồi áp lại |
| `server/src/tests/run.ts` | mọi PR | **một** dòng `runPrSangTests(…)` cuối file | giữ mọi dòng |
| `CODE_MAP.md`, `thiet-ke/HE_GIAO_DIEN.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `plan.md` | mọi PR | chỉ thêm/sửa đúng mục ghi ở Task 10 | giữ cả hai |

Đã đối chiếu kế hoạch HSM/HVL/XUAT (29/09, soạn song song): cả ba hứa **không** thêm màu cứng, chữ mới ≥ 12 px, và để SANG rebase lên
họ. File họ chạm mà PR-SANG cũng sửa (cỡ chữ/màu): **HSM** `ScoreEntry.tsx`, `cham/LuoiFT.tsx`, `MotKyNang.tsx`, `LuoiThuong.tsx`,
`lichTest/KhoiNo.tsx`, `HangLop.tsx`, `StudentDetailPage.tsx` · **HVL** `DauTrangLop.tsx`, `ClassRoster.tsx`, `BangDiemLopThuong.tsx`,
`ui/ViecTiep.tsx`, **`ui/Nhan.tsx`** · **XUAT** ngăn xuất mới. Task 7 luôn sửa trên bản **sau merge** của họ.

## Global Constraints

- **Một nguồn màu:** giá trị màu chỉ nằm trong **hai khối token** của `web/src/index.css`. `tailwind.config.js` chỉ **ánh xạ tên → biến**
  (`rgb(var(--x-rgb) / <alpha-value>)`). Component chỉ dùng tên Tailwind đã ánh xạ hoặc `var(--…)`. **Cấm** trong `web/src/**/*.tsx|ts`:
  mã hex, `rgb(`/`rgba(` với số, lớp `…-[#…]`, cấp màu Tailwind **chưa** ánh xạ về biến. Phép kiểm `prSang.tests.ts` chặn (Task 1).
- **Tối không đổi:** mọi biến ở khối `:root` giữ **đúng** giá trị hôm nay; biến mới thêm cho tối = đúng màu Tailwind/hex đang hiện. Cách
  kiểm: "bảng màu tính được" (Task 0/9) của 10 trang ở chế độ tối **trước = sau** (trừ các chữ Task 7 cố ý đổi `slate-600` → `slate-500`).
- **Tương phản:** chữ ≥ **4.5:1** trên mọi nền trang và nền riêng của nó, **cả hai** chế độ (phép kiểm token + lượt đo trên trang thật
  Task 8). Viền ô nhập / ô sửa được ở chế độ **sáng** ≥ **3:1** (WCAG 1.4.11). Tối giữ như cũ (Chuyển cho).
- **Màu không là tín hiệu duy nhất** (HE §1.1): ảnh xám của chế độ sáng vẫn đọc được (Task 9).
- **Thang màu khoá:** SOS 1 vàng · SOS 2 cam · SOS 3 đỏ · Đạt xanh lá; bốn màu điểm; "Đang chọn" = nền `ink-800` + viền `teal-600` + ✓
  — ở chế độ sáng **cùng nghĩa, cùng tông**, chỉ đậm/nhạt khác. Không thêm màu mới cho khu nào (§7.1).
- **Không chuyển động trang trí:** đổi chế độ tức thì, không `transition` màu toàn trang (§7.1).
- **Tinh tế:** nút ◐ là **SVG 14 px** nét 1.5 (bẫy ký tự nhỏ của phông — bộ nhớ), không chữ; cao 44 px trên điện thoại, 28–32 px trên máy
  tính như nút Thông báo; `tabular-nums` mọi số giữ nguyên sau khi đổi phông.
- **`localStorage` luôn bọc `try/catch`** (chế độ riêng tư chặn) — lỗi thì về Tối, trang vẫn chạy.
- **Giữ phép kiểm cũ:** `nenGiaoDien.tests.ts` N-1 (đọc token) phải đọc **khối `:root`** thay vì cả file (xem M10) — cùng điều kiện, không
  xoá. Số phép kiểm không giảm.

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc)

1. **Đừng sửa lớp màu trong component để "làm sáng".** Chỗ đổi là `tailwind.config.js` + `index.css`. Sửa component chỉ ở 6 chỗ màu cứng
   (Task 4) và cỡ chữ (Task 7). Thấy mình sắp sửa > 10 file ở Task 2–4 → dừng, đọc lại.
2. `data-theme` đặt trên **`<html>`** (`document.documentElement`), không đặt trên `body`/`#root`: các bí danh `--ok: rgb(var(--ok-rgb))`
   khai ở `:root` chỉ đổi theo khi biến gốc bị ghi đè **trên cùng phần tử**.
3. Khối sáng dùng bộ chọn `:root[data-theme="light"]` **trong** `@layer base`, ngay sau khối `:root` — độ ưu tiên cao hơn `:root`.
4. `ui.tsx` có `shadow-[inset_0_0_0_1px_theme(colors.teal.600)]` → sau khi đổi `teal.600` thành hàm biến, kiểm CSS build
   (`npx vite build` → grep `dist/web/assets/*.css`) **không còn** chuỗi `<alpha-value>`; còn thì đổi lớp đó thành
   `shadow-[inset_0_0_0_1px_rgb(var(--chon-vien-rgb))]`.
5. Tên cấp màu **không ai dùng** (`ink-950…500` trừ 800/950, `teal-400/700`) → **xoá** khỏi config (ít hơn là tốt hơn); phép kiểm "cấp màu dùng
   phải có ánh xạ" sẽ báo nếu xoá nhầm.
6. 🛑 **Dừng hỏi planning** nếu: (a) Be Vietnam Pro **không** có số cùng độ rộng (`tnum`) — đo ở Task 6; (b) sau đổi phông có > 3 màn bị
   tràn/xuống dòng làm vỡ cột ở 1440 px; (c) "bảng màu tính được" chế độ tối lệch ngoài danh sách cố ý; (d) một màu nghĩa ở chế độ sáng
   không đạt 4.5:1 mà muốn đổi **tông** (không chỉ đậm/nhạt); (e) cần sửa máy chủ.

## Hiện trạng (đo trên mã 29/09, `507abc2` — Task 0 đo lại sau rebase)

| Chỗ | Hiện trạng (file:dòng) |
|---|---|
| Chỉ có tối | `web/src/index.css:7` `color-scheme: dark`; token ở `:root` :13-63 (nền, bề mặt, viền, accent, 8 màu nghĩa bộ ba RGB, chữ phụ, hàng lớn/con, ô sửa) |
| Giá trị cứng trong `index.css` (ngoài token) | thanh cuộn :77-78 `rgba(160,178,214,…)` · `.btn:hover` :127 `#24304a` · `.btn-ghost:hover` :137 `rgba(160,178,214,.1)` · `.field` :141 `#0e1727` · `.field:disabled` :144 `#0b1322` · `.o-sua:focus` :197 `#84baff` + `rgba(132,186,255,.22)` · `.skel` :203 `#1a2437/#24304a` |
| Ánh xạ đã có (PR-UX0) | `tailwind.config.js:26-29`: `slate-400/500`, `rose/amber/sky/emerald-200/300` → biến. Đó là ~660 chỗ đã theo token |
| Cấp màu **chưa** ánh xạ (đếm lớp trong `web/src`) | `text-slate-100` 148 · `text-slate-200` 130 · `text-slate-300` 118 (+ `border-slate-300/20` 2, `bg-slate-300/8` 1) · `text-slate-600` 48 · `slate-700` 7 · `white` 39 (`bg-white/5` 26, `/10` 4, `/[.06]` 3, `/[.08]` 1, `/[0.02]` 1, `hover:text-white` 4) · `ink-800` 5, `ink-950` 1 · `teal-300/500/600` 7 · `accent-sky-400` 8, `bg-sky-500/20` 3 · `border-rose-400/70` 3 · `amber-100/400/500` 4 · `bg-black/60` 2 (nền mờ sau panel — giữ) → **≈ 530 chỗ, 119/160 file**, tất cả sửa **một chỗ** ở config |
| Màu cứng trong `.tsx` | `classes/ClassProgressPanel.tsx:131` `rgba(242,161,161,.08)` · `classes/TransitionPanel.tsx:305` `var(--warn, #fbbf24)` · `worklist/MeetingPage.tsx:138` `var(--text-muted, #94a3b8)` (biến **không tồn tại** → luôn ra hex) + `rgb(252 165 165)` · `students/HanhTrinh.tsx:160` `#dbe9ff` · `platform/DemoBar.tsx:55` `bg-[#0b141d]` |
| Phông | `index.css:70` + `tailwind.config.js:32` khai `Inter` nhưng **không tải** (không `@font-face`, `index.html` không link) → Windows hiện Segoe UI, máy khác một kiểu. Độ đậm đang dùng: 400 · 500 (32) · 600 (119) · 700 (57) · **800** (12 `font-extrabold` + `.hang-lon`, `.khoi-nhom-dau`) |
| Chữ nhỏ (E4) | `text-[10px]` **72** + `text-[10.5px]` **30** ở **37 file** (vd. `ui/Nhan.tsx:27` 10.5 px, `App.tsx:41` số đếm menu, `App.tsx:102` "Bản demo nội bộ", `cases/SkillBoard.tsx` 11 chỗ, ✓ của `NutChon` `ui/ui.tsx:483, 501`) · `text-[11px]` 240 chỗ / 82 file (giữ — câu 2) · `text-slate-600` có **chữ** (không chỉ "—"): `CaseBoardPage.tsx:201` "chưa rõ nguyên nhân", `SkillBoard.tsx:506, 609`, `AccountsAdmin.tsx:119`, `TransitionPanel.tsx:282`… |
| Thanh đầu | `App.tsx:94-109` (logo, menu, `<Header />`); `platform/Header.tsx:160-195` nút **Thông báo** (`btn btn-sm min-h-[44px] sm:min-h-0`, chuông SVG 14 px trên điện thoại), :197-201 nút tài khoản |
| `localStorage` đã dùng | `ui/CongTacKhung.tsx:16-21` (khung FT/Lớp thường, nhớ theo máy, `try/catch`) — cùng kiểu cho chế độ |
| Phép kiểm màu | `server/src/tests/nenGiaoDien.tests.ts:19-66` đọc `index.css` bằng `docMauCss` (`shared/domain/mauNghia.ts:14`) — đọc **phẳng** cả file |

## Bảng token hai chế độ (đích của Task 2–3)

Tối = **giá trị hôm nay** (không đổi). Sáng = §7.4 + mockup 19 (:23-34), planning điền chỗ đặc tả để trống; mọi cặp chữ/nền đã tính
thử ≥ 4.5:1 (script planning, 29/09) — phép kiểm Task 1 tính lại, session code chỉnh **độ đậm** nếu đỏ (không đổi tông).

| Biến (`--…`) | Dùng cho | Tối | Sáng |
|---|---|---|---|
| `bg` · `surface` · `surface-2` | nền trang · thẻ/panel/bảng · popover/nút/đầu cột | `#0c1220` · `#141d2f` · `#1a2437` | `#f5f7fa` · `#ffffff` · `#eef1f5` |
| `line` · `line-strong` | viền | `rgba(160,178,214,.14)` · `.26` | `rgba(15,23,42,.12)` · `.22` |
| `text` | chữ chính | `#dde5f2` | `#0f172a` |
| `accent` · `accent-strong` · `accent-ink` | nút chính, liên kết · hover · chữ trên nút chính | `#7db3f0` · `#a9cdf7` · `#0b1626` | `#1d5fbf` · `#174e9e` · `#ffffff` |
| `accent-soft` · `accent-line` | nền/viền nhấn nhạt | `rgba(125,179,240,.14)` · `.38` | `rgba(29,95,191,.08)` · `.35` |
| `ok-*` (chữ · nền · viền, bộ ba RGB) | đạt | giữ | `21 122 66` · `220 243 229` · `143 209 171` |
| `bad-*` | chưa đạt · SOS 3 | giữ | `180 35 35` · `253 226 226` · `240 163 163` |
| `late-*` | quá hạn · SOS 2 | giữ | `180 64 15` · `253 230 216` · `241 174 138` |
| `soon-*` | sắp hạn · SOS 1 | giữ | `138 90 0` · `253 241 207` · `230 196 107` |
| `doing-*` | đang làm · "bằng kỳ vọng" | giữ | `29 95 191` · `227 237 251` · `157 187 232` |
| `done-*` · `wait-*` · `muted-*` | xong · chờ người khác · trung tính | giữ | `75 85 99`/`238 240 243`/`207 213 221` · `91 63 184`/`236 230 253`/`189 174 240` · `51 65 85`/`238 241 245`/`207 213 221` |
| `text-dim-rgb` · `text-faint-rgb` | chữ phụ (`slate-400`) · chữ phụ nhỏ (`slate-500`) | giữ | `71 85 105` · `91 102 120` |
| **mới** `chu-1-rgb` · `chu-2-rgb` · `chu-3-rgb` | `slate-100` · `slate-200` · `slate-300` | `241 245 249` · `226 232 240` · `203 213 225` | `15 23 42` · `30 41 59` · `51 65 85` |
| **mới** `chu-mo-rgb` · `chu-mo-2-rgb` | `slate-600` · `slate-700` — **chỉ** dấu trang trí (—, /, →) | `71 85 105` · `51 65 85` | `148 163 184` · `203 213 225` |
| **mới** `phu-rgb` | `white` (lớp phủ `bg-white/5` khi rê chuột, `hover:text-white`) | `255 255 255` | `15 23 42` |
| **mới** `chon-bg-rgb` · `chon-vien-rgb` · `chon-dau-rgb` | `ink-800` · `teal-600`/`teal-500` · `teal-300` (Đang chọn, ✓) | `19 33 45` · `13 148 136` · `94 234 212` | `224 242 239` · `15 118 110` · `15 118 110` |
| **mới** `nut-hover` · `o-nhap-nen` · `o-nhap-tat` · `o-nhap-vien` | `.btn:hover` · `.field` · `.field:disabled` · viền `.field` | `#24304a` · `#0e1727` · `#0b1322` · = `line-strong` | `#e4e8ee` · `#ffffff` · `#f1f4f8` · `#7c8799` (≥ 3:1) |
| **mới** `cuon` · `cuon-hover` | thanh cuộn | `rgba(160,178,214,.2)` · `.35` | `rgba(15,23,42,.2)` · `.35` |
| `hang-lon-bg` · `-vach` · `hang-lon-dong-bg` · `-dong-vach` | hàng lớn | giữ | `#eaf1fb` · `#1d5fbf` · `#f1f4f8` · `#9fb0c8` |
| `hang-con-bg` · `hang-con-chu` | hàng con | giữ | `#fafbfc` · `#334155` |
| `o-sua-vien` · `o-sua-nen` · **mới** `o-sua-focus` | ô sửa được (lưới chấm) | giữ · giữ · `#84baff` | `#7c8799` · `#ffffff` · `#1d5fbf` |
| **mới** `font-sans` | phông (một giá trị cho cả hai) | `'Be Vietnam Pro', system-ui, 'Segoe UI', Roboto, sans-serif` | — |
| `color-scheme` | ô/thanh cuộn gốc của trình duyệt | `dark` | `light` |

Ánh xạ trong `tailwind.config.js` (mọi mục `v('…')` = `rgb(var(--…) / <alpha-value>)`):
`slate: {100: chu-1, 200: chu-2, 300: chu-3, 400: text-dim, 500: text-faint, 600: chu-mo, 700: chu-mo-2}` · `white: v('phu')` ·
`ink: {800: chon-bg, 950: accent-ink}` · `teal: {300: chon-dau, 500: chon-vien, 600: chon-vien}` · `sky: {200, 300, 400, 500: doing}` ·
`rose: {200, 300, 400: bad}` · `amber: {100, 200, 300, 400, 500: soon}` · `emerald: {200, 300: ok}` (giữ). `ink-950` chỉ là chữ trên chip
nền `doing` đặc (`NganXepLichMt.tsx:374`) → cùng nghĩa `accent-ink` (thêm `--accent-ink-rgb` `11 22 38` / `255 255 255`). **Không** ánh xạ
`black` (chỉ `bg-black/60` nền mờ sau panel — hợp cả hai chế độ).

## Task 0 · Nhánh, rebase, liệt kê file HSM/HVL/XUAT đã đổi, mốc, ảnh "trước"

- [ ] `git fetch origin` → `git log origin/main --oneline | grep -E "PR-(HSM|HVL|XUAT)"`. **Thiếu PR nào → dừng**, báo planning (PR-SANG
  chạy sau cùng đợt 4). Đủ → `git worktree add .claude/worktrees/pr-sang-sang-toi-font -b pr-sang-sang-toi-font origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/ke-hoach-dot-4 -- docs/superpowers/plans/2026-09-29-pr-sang-sang-toi-font.md`.
- [ ] **Liệt kê file ba PR đã đổi**: mỗi PR lấy commit merge `M` → `git diff --stat M^1 M -- web/src index.html tailwind.config.js` →
  bảng "PR → file giao diện đã đổi" vào Nhật ký. Chạy lại **bảng đếm** (3 lệnh dưới, trong `web/src`) → ghi số mới cạnh số ở Hiện trạng;
  chỗ màu cứng / chữ < 11 px **mới** do HSM/HVL/XUAT thêm → ghi file:dòng, xử lý ở Task 4 / Task 7.
  - `grep -rhoE "\b(text|bg|border|ring|divide|outline|fill|stroke|placeholder|decoration|accent|caret|from|to|via|shadow)-(slate|ink|teal|white|black|gray|zinc|neutral|rose|amber|sky|emerald|red|orange|yellow|green|blue|indigo|violet|purple|cyan|lime|pink|fuchsia)(-[0-9]{2,3})?" --include=*.tsx --include=*.ts . | sort | uniq -c | sort -rn`
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\([0-9 ]" --include=*.tsx --include=*.ts .` (bỏ dòng chú thích bằng mắt)
  - `grep -rhoE "text-\[(9|9\.5|10|10\.5)px\]" . | sort | uniq -c` · `grep -rlE "text-\[(9|10)(\.5)?px\]" . | wc -l`
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm + tốc độ).
- [ ] **Ảnh + "bảng màu tính được" trước** (bản `main`, tối, 1440 px): máy thử 4187/5387, script Playwright tạm (scratchpad) mở **10 trang**
  của KIỂM bằng vai ghi ở đó → chụp `thiet-ke/anh/pr-sang/truoc-toi-NN-<ten>.png` **và** ghi JSON tạm: mỗi trang, tập các bộ
  `(color, background-color, border-top-color)` của mọi phần tử đang hiện (`getComputedStyle`). Giữ JSON ở scratchpad cho Task 9.
- [ ] Commit `PR-SANG (0): kế hoạch + mốc {B} phép kiểm + ảnh trước`.

## Task 1 · Phép kiểm trước (đỏ có chủ đích) — `prSang.tests.ts`

- [ ] `shared/domain/mauNghia.ts`: thêm `docKhoiCss(css, boChon)` → thân **khối đầu tiên** đúng bộ chọn (`:root`, `:root[data-theme="light"]`)
  và `docMauHaiCheDo(css)` → `{ toi: docMauCss(khối :root), sang: { ...toi, ...docMauCss(khối sáng) } }`. `docMauCss` giữ chữ ký. Thêm
  `export const CHE_DO_KHOA = 'pisa-giao-dien'` và `docCheDo(v: unknown): 'dark' | 'light'` (chỉ `'light'` → sáng; còn lại → tối).
- [ ] `nenGiaoDien.tests.ts:19-20`: `mau = d.docMauCss(d.docKhoiCss(css, ':root'))` (M10) — cùng điều kiện, đọc đúng khối tối.
- [ ] Tạo `server/src/tests/prSang.tests.ts` (khuôn `nenGiaoDien.tests.ts`), đăng ký **một** dòng cuối `run.ts`. Phép kiểm:
  1. **S1 · tương phản hai chế độ:** với `toi` và `sang`: chữ `ok, done, bad, late, soon, doing, wait, muted, text-dim, text-faint, chu-1,
     chu-2, chu-3` ≥ 4.5 trên `bg, surface, surface-2, hang-lon-bg, hang-con-bg`; mỗi màu nghĩa ≥ 4.5 trên nền riêng `x-bg`; `text` ≥ 4.5
     trên mọi nền; `accent-ink` trên `accent` ≥ 4.5; `chon-dau` trên `chon-bg` ≥ 4.5. `chu-mo*` **miễn** (chỉ dấu trang trí — S8 giữ luật đó).
  2. **S2 · viền ô nhập sáng ≥ 3:1:** `o-nhap-vien`, `o-sua-vien` trên `surface`, `surface-2` (chế độ sáng).
  3. **S3 · đủ cặp:** mọi biến màu gốc ở `:root` (trừ bí danh `var(…)`, `font-sans`) có ở khối sáng; SOS1/2/3 sáng khác nhau và vẫn là bí
     danh `soon/late/bad` (không chép số).
  4. **S4 · `index.css` một chỗ khai báo:** bỏ hai khối token, phần còn lại **không** có `#hex`, `rgb(`/`rgba(` với số.
  5. **S5 · quét nguồn `web/src`:** không hex trong chuỗi/lớp (`'#…'`, `"#…"`, `[#…]`), không `rgb(`/`rgba(` với số, không `var(--x, #…)`
     (bỏ qua dòng chú thích `*`, `//`, `{/*`). Không ngoại lệ (DemoBar cũng đổi).
  6. **S6 · mọi cấp màu Tailwind dùng trong `web/src` trỏ biến:** gom `(tiền tố)-(bảng)-(số)` và `-white` → nạp `tailwind.config.js`
     (`import(pathToFileURL(path.join(REPO,'tailwind.config.js')).href)`) → `theme.extend.colors[bảng][số]` là chuỗi có `var(--`. Bảng ngoài
     config (`gray`, `red`, `blue`…) → đỏ. `black` chỉ nhận `bg-black/60`.
  7. **S7 · phông:** `body` dùng `var(--font-sans)`; `--font-sans` bắt đầu bằng `'Be Vietnam Pro'`; `fontFamily.sans[0] === 'var(--font-sans)'`;
     `main.tsx` import đủ `@fontsource/be-vietnam-pro/{400,500,600,700,800}.css`; `package.json` ghim đúng phiên bản (không `^`). Không còn
     `Inter` trong `index.css`/`tailwind.config.js`.
  8. **S8 · cỡ chữ (E4):** không `text-[9…px]`, `text-[10px]`, `text-[10.5px]` trong `web/src`; `ui/Nhan.tsx` có `text-[11.5px]`;
     `text-slate-600|700` chỉ bọc **dấu** (nội dung thẻ là một trong `— – / → ·` hoặc biểu thức) — quét `className="…text-slate-(600|700)…">X<`.
  9. **S9 · công tắc:** `docCheDo('light') === 'light'`, `docCheDo(null | 'x' | 'dark') === 'dark'`; `index.html` có script nội dòng chứa đúng
     chuỗi `CHE_DO_KHOA` và `document.documentElement.dataset.theme`; `Header.tsx` có `<CongTacGiaoDien` nằm **giữa** `aria-label="Thông báo"`
     và `nutTaiKhoan` (so vị trí chuỗi).
- [ ] `npm run check` → **đỏ đúng** S1(sáng)–S9, N-1 cũ xanh. Ghi số đỏ vào Nhật ký. Commit `PR-SANG (1): phép kiểm trước`.

## Task 2 · `index.css`: token hai chế độ, bỏ giá trị cứng (YC-7 bước 1–3)

- [ ] Khối `:root`: thêm biến **mới** của bảng token, **giá trị tối = màu đang hiện**; thêm `--accent-ink-rgb`, `--font-sans`. Thay mọi giá trị
  cứng ngoài khối: thanh cuộn → `var(--cuon)`/`var(--cuon-hover)`; `.btn:hover` → `var(--nut-hover)`; `.btn-ghost:hover` → `rgb(var(--phu-rgb) / .1)`;
  `.field` → `var(--o-nhap-nen)` + viền `var(--o-nhap-vien)`, tắt → `var(--o-nhap-tat)`; `.o-sua:focus` → `var(--o-sua-focus)` + `0 0 0 3px
  var(--accent-soft)`; `.skel` → `var(--surface-2)`/`var(--nut-hover)`. `body { font-family: var(--font-sans) }`.
- [ ] Ngay sau khối `:root` (trong `@layer base`): `:root[data-theme="light"] { color-scheme: light; … }` — chỉ biến **gốc** (không ghi lại bí
  danh `--dat-*`, `--sos*-*`, `--ok`, `--warn`… — tự theo).
- [ ] `npm run check` → S1–S4 xanh. Commit `PR-SANG (2): token sáng/tối trong index.css`.

## Task 3 · `tailwind.config.js`: ánh xạ cấp màu về biến (YC-7 bước 1)

- [ ] Viết lại `colors` theo "Ánh xạ" ở trên; xoá cấp `ink`/`teal` không ai dùng (Hướng dẫn 5). `fontFamily.sans: ['var(--font-sans)']`. Giữ `mono`.
- [ ] `npx vite build` → CSS build: không `<alpha-value>` (Hướng dẫn 4); `text-slate-100` ra `rgb(var(--chu-1-rgb) / …)`.
- [ ] Máy thử, **tối**: so 3 trang với ảnh "trước" — phải **giống**. `npm run check` → S6 xanh trừ chỗ Task 4. Commit `PR-SANG (3): ánh xạ bảng màu Tailwind về biến`.

## Task 4 · Chỗ màu cứng trong `.tsx` (+ chỗ mới của HSM/HVL/XUAT)

| Chỗ | Thành |
|---|---|
| `ClassProgressPanel.tsx:131` `'rgba(242,161,161,.08)'` | `'rgb(var(--bad-rgb) / 0.08)'` |
| `TransitionPanel.tsx:305` `var(--warn, #fbbf24)` | `var(--warn)` |
| `MeetingPage.tsx:138` `var(--text-muted, #94a3b8)` / `'rgb(252 165 165)'` | `var(--text-dim)` / `var(--danger)` |
| `HanhTrinh.tsx:160` `'#dbe9ff'` (núm công tắc Gọn) | `var(--text)` (tối `#dde5f2` ≈ màu cũ, 5.3:1 trên `doing-line`; sáng chữ đậm trên xanh nhạt) |
| `DemoBar.tsx:55` `bg-[#0b141d]` | `bg-[color:var(--bg)]` |
| chỗ mới Task 0 ghi | màu có nghĩa → biến nghĩa; không nghĩa → `surface` / `line` / `text-dim` |

- [ ] `npm run check` → S5, S6 xanh. Commit `PR-SANG (4): bỏ màu viết cứng trong component`.

## Task 5 · Công tắc ◐ (T15, M12) — impeccable `clarify` cho chữ nút

**Nằm ở:** thanh đầu mọi trang sau đăng nhập, **góc phải**, giữa nút **Thông báo** và nút **tên tài khoản** (`platform/Header.tsx`). Ai thấy:
mọi vai. Trang chào/đăng nhập **không** có nút (không có thanh đầu) nhưng **đọc** lựa chọn đã lưu.

- [ ] `index.html` `<head>`, **trước** script ứng dụng: script nội dòng — `try{if(localStorage.getItem('pisa-giao-dien')==='light')
  document.documentElement.dataset.theme='light'}catch(e){}` (không nháy tối → sáng lúc tải). Chuỗi = `CHE_DO_KHOA` (S9).
- [ ] `web/src/ui/CongTacGiaoDien.tsx` (~30 dòng): `useState(() => docCheDo(document.documentElement.dataset.theme))`; bấm → sáng: đặt
  `dataset.theme = 'light'`; tối: **xoá** thuộc tính; `localStorage.setItem(CHE_DO_KHOA, …)` trong `try/catch`. Nút `btn btn-sm min-h-[44px]
  min-w-[44px] sm:min-h-0 sm:min-w-0` (cùng cỡ nút Thông báo), **SVG ◐ 14 px** (vòng nét 1.5 + nửa trái tô `currentColor`), `aria-label` =
  `title` = **"Chuyển sang giao diện sáng"** / **"Chuyển sang giao diện tối"**, `aria-pressed={sang}`. Không chữ, không hiệu ứng.
- [ ] `Header.tsx`: chèn `<CongTacGiaoDien />` sau khối Thông báo (:195), trước khối tài khoản.
- [ ] `npm run check` → S9 xanh. Commit `PR-SANG (5): nút ◐ đổi sáng/tối, nhớ theo máy`.

## Task 6 · Phông Be Vietnam Pro (T16, E9) — theo câu hỏi 1 (mặc định A)

- [ ] `npm i -E @fontsource/be-vietnam-pro` (vào `dependencies` — Netlify build cần). `web/src/main.tsx`: 5 dòng import
  `@fontsource/be-vietnam-pro/{400,500,600,700,800}.css` **trước** `./index.css`. Gói có `unicode-range` → trình duyệt chỉ tải bộ `vietnamese`
  + `latin` cần; nghiêng (5 chỗ `italic`) để trình duyệt tự nghiêng.
- [ ] Đo (Playwright tạm): (a) `tnum` — độ rộng `"1111"` = `"0000"` khi `tabular-nums` (khác → 🛑 6a); (b) `✓ ⚠ ▶ ○ ◐ ✗` vẫn hiện (phông dự
  phòng), không ô vuông; (c) `.woff2` tải từ **cùng tên miền**; (d) 1440 px: Học viên & Lớp, Lịch Test, Kế hoạch Test, lưới chấm, hồ sơ Mock,
  Công việc — không cột xuống dòng/tràn **mới** so với ảnh trước (≤ 3 màn thì chỉnh `min-w`/`truncate` tại chỗ; > 3 → 🛑 6b).
- [ ] Chủ sản phẩm chọn **B (Inter)** → cùng các bước với `@fontsource/inter`, `--font-sans: 'Inter', …`; S7 đổi tên phông.
- [ ] `npm run check` → S7 xanh. Commit `PR-SANG (6): tải kèm phông Be Vietnam Pro`.

## Task 7 · Cỡ chữ tối thiểu (E4, YC-14 phần nền) — theo câu hỏi 2 (mặc định A) — impeccable `polish` từng file

Đi **từng file** trong danh sách Task 0 (≈ 37 file, 102 chỗ + chỗ mới HSM/HVL/XUAT). Mỗi chỗ `text-[10px]` / `text-[10.5px]` (và `9…px`):

| Chữ đó là | Thành |
|---|---|
| kết quả (điểm, SOS, đạt/không), hạn, trạng thái, người phụ trách, số đếm việc | `text-xs` (12 px); nếu đang `text-slate-500` → `text-slate-400` (E4 "màu slate-400") |
| ký hiệu nhỏ (✓ của `NutChon`/`BoLocDoan` `ui.tsx:483, 501`, mũi tên, chấm), mã, chú giải, "Bản demo nội bộ" (`App.tsx:102`) | `text-[11px]` |

- [ ] `ui/Nhan.tsx:27` `text-[10.5px] leading-4` → `text-[11.5px] leading-[18px]`; `App.tsx:41` (số đếm menu) cùng 11,5 px.
- [ ] `text-slate-600|700` bọc **chữ** (Hiện trạng liệt kê; grep lại) → `text-slate-500`; bọc dấu (`—`, `/`, `→`) giữ.
- [ ] `cases/SkillBoard.tsx` (11 chỗ, E4 nêu :230-557) làm kỹ nhất: chữ trạng thái kỹ năng, hạn, "chưa có dữ liệu" → 12 px / `slate-400`.
- [ ] Máy thử 375 px: badge `Nhan` rộng thêm ~10 % — hàng Học viên & Lớp, Lịch Test, Công việc không đẩy cột; vỡ → `whitespace-nowrap`/`truncate` tại chỗ.
- [ ] `npm run check` → S8 xanh. Commit `PR-SANG (7): chữ tối thiểu 11 px, kết quả/hạn/trạng thái 12 px (E4)`.

## Task 8 · Tương phản trên trang thật + impeccable `colorize` · `adapt` · `audit` · `polish`

- [ ] **Đo AA trên trang thật** (script Playwright tạm ở scratchpad, không commit): mỗi trang KIỂM 1–10 + panel Thêm PA, lịch `ONgay`,
  menu ⋯, Thông báo, toast — ở **cả hai** chế độ: mọi nút văn bản đang hiện → màu chữ `getComputedStyle` + nền hiệu dụng (tổ tiên gần nhất
  có nền không trong suốt; nền có độ trong thì trộn với nền cha) → tỉ số. Ngưỡng 4.5 (3.0 nếu ≥ 24 px hoặc ≥ 18,66 px đậm); bỏ phần tử
  `disabled` và dấu `chu-mo`. Ghi số chỗ < ngưỡng (trước/sau sửa) vào Nhật ký. **Sáng: phải về 0.** Tối: chỉ sửa chỗ do PR này gây ra;
  chỗ có sẵn từ trước → "Chuyển cho".
- [ ] `/impeccable colorize` trên chế độ **sáng** (Tổng quan, Học viên & Lớp, hồ sơ HV, Kế hoạch Test): chỉ chỉnh **giá trị** trong khối sáng
  (đậm/nhạt); gợi ý thêm màu / đổi tông / tô màu theo khu → **không làm**, ghi vào thân PR cho chủ sản phẩm (Q13).
- [ ] `/impeccable adapt` thanh đầu 375 px (ô tìm + Thông báo + ◐ + tài khoản): không cuộn ngang, mỗi nút ≥ 44 px.
- [ ] `/impeccable audit` cả hai chế độ (các trang trên) → sửa a11y/tương phản/trạng thái **trong phạm vi PR** → `/impeccable polish` một lượt.
- [ ] `/ponytail-review` trên diff; liệt kê mọi chú thích `ponytail:` (dự kiến 0–1: nghiêng tự tổng hợp).
- [ ] `npm run check` → commit `PR-SANG (8): tương phản AA hai chế độ, audit + polish`.

## Task 9 · Bấm thử (một lần) + ảnh sáng/tối/xám + so "bảng màu tính được"

- [ ] Máy thử 4187/5387, đi **KIỂM** (dưới). Ảnh 1440 px: `thiet-ke/anh/pr-sang/sau-toi-NN-<ten>.png` và `sau-sang-NN-<ten>.png` cho 10 trang;
  375 px cả hai chế độ cho trang 1, 3, 5, 9 (`sau-{toi,sang}-375-NN.png`); ảnh **xám** chế độ sáng trang 3, 5, 7 (chèn
  `html{filter:grayscale(1)}` → `xam-sang-NN.png`); `nut-giao-dien.png` (thanh đầu hai chế độ, 1440 + 375).
- [ ] "Bảng màu tính được" chế độ **tối** sau PR so JSON "trước" (Task 0): mọi bộ màu trùng, **trừ** danh sách cố ý: chữ `slate-600 → 500`
  (Task 7), `MeetingPage` hai màu dự phòng, `DemoBar` nền `#0b141d → --bg`, núm `HanhTrinh` (Task 4), `.field`/`.o-sua:focus` (nếu đổi).
  Lệch ngoài danh sách → sửa (hoặc 🛑 6c). Ghi kết quả vào Nhật ký + thân PR.
- [ ] Sai dòng KIỂM nào → sửa → `npm run check` → commit `PR-SANG (9): sửa sau bấm thử + ảnh`.

## Task 10 · Tài liệu + mở PR

- [ ] `thiet-ke/HE_GIAO_DIEN.md` §2: "Màu nền và bề mặt" thêm cột **Sáng**; luật "màu chỉ qua token — phép kiểm `prSang` S5/S6 chặn"; "Chữ và
  khoảng cách": phông **Be Vietnam Pro** (tự phục vụ), sàn 11 px, kết quả/hạn/trạng thái 12 px, `Nhan` 11,5 px. `CODE_MAP.md`: `CongTacGiaoDien.tsx`,
  `docKhoiCss`/`docMauHaiCheDo`/`CHE_DO_KHOA`/`docCheDo`, `prSang.tests.ts`. `thiet-ke/TU_DIEN_VA_CHU.md`: "Chuyển sang giao diện sáng/tối".
  `plan.md`: một dòng nhật ký PR-SANG. Không tạo PRODUCT.md/DESIGN.md. Commit `PR-SANG (10): tài liệu`.
- [ ] Cổng rebase (`git fetch && git rebase origin/main`) → `npm run check` (một lần) → push → `gh pr create` tiêu đề
  `PR-SANG: giao diện sáng/tối, phông Be Vietnam Pro, cỡ chữ tối thiểu (YC-7, T15, T16, E4, E9)`; thân: bảng mã YC/T/E → ảnh → đạt/không;
  kết quả đo AA (số chỗ trước/sau, hai chế độ); so "bảng màu tính được" tối; "tầng 1 của màn này là: …" — PR không đổi tầng 1 màn nào, chỉ
  nâng chữ kết quả/hạn/trạng thái lên 12 px (§7.5); gợi ý `colorize` chưa làm; chú thích `ponytail:`; **không migrate**; **Chuyển cho PR
  khác**. Kết thân bằng dòng quy định của repo. **Không tự merge.**
- [ ] Tắt 4187/5387, quét `tests/run.js` treo và tắt, dọn file Playwright/Vite tạm.

## KIỂM — kịch bản bấm thử (Task 9, một lần)

Mười trang (Task 0 "trước" và Task 9 "sau" dùng **cùng** danh sách):

| NN | Vai (id) | Trang (Nằm ở) |
|---|---|---|
| 01 | QL Vy (2) | Tổng quan › tab Tổng quan |
| 02 | QL Vy | Tổng quan › tab Phân tích |
| 03 | QL Vy | Học viên & Lớp (mở một lớp FT) |
| 04 | GVCN Hà (7) | Hồ sơ lớp `MB FT 101` › Học viên › Cần hỗ trợ |
| 05 | GVCN Hà | Hồ sơ HV Vũ Ngọc Lan › Học thuật (Case + PA) |
| 06 | GVBM Trang (9) | Test › Lịch Test |
| 07 | QL Vy | Test › Kế hoạch Test (lưới) |
| 08 | GVBM Trang | Hồ sơ Mock một lượt (M10 của PR-HSM) |
| 09 | QL Vy | Công việc › Chờ duyệt |
| 10 | Quản trị (1) | Quản trị › Tài khoản |

| # | Làm | Phải thấy |
|---|---|---|
| K1 | Trang 01 bấm ◐ | Cả trang sáng **ngay**, không chuyển động; nút đổi `title` thành "Chuyển sang giao diện tối" |
| K2 | F5; đăng xuất; mở tab mới cùng máy | Vẫn sáng, **không** nháy tối lúc tải; trang chào cũng sáng |
| K3 | Cửa sổ riêng tư / chặn lưu trữ | Mặc định tối; ◐ vẫn đổi trong phiên; không lỗi console |
| K4 | Sáng: mở panel Thêm PA, lịch ô ngày, menu ⋯, Thông báo, ô chọn người, toast | Nền/viền/chữ rõ; nền mờ sau panel; lịch đè lên panel |
| K5 | Sáng: nút lựa chọn đang chọn (`NutChon`), bộ lọc đoạn, ngày chọn trên lịch | Nền xanh ngọc nhạt + viền + ✓ — **khác** nút chính xanh đặc |
| K6 | Sáng: trang 03, 05, 06, 07 | SOS 1 vàng · 2 cam · 3 đỏ; "tạm thời" viền đứt; ô điểm 4 màu; hàng lớn ≠ hàng con; rê chuột hàng thấy nền đổi |
| K7 | Ảnh xám trang 03, 05, 07 (sáng) | Đạt / SOS / quá hạn vẫn phân biệt nhờ chữ + dấu |
| K8 | Bàn phím: Tab tới ◐, Enter, Space | Vòng focus thấy rõ **cả hai** chế độ; đổi được; trình đọc màn hình: "Chuyển sang giao diện sáng, nút bật tắt" |
| K9 | 375 px trang 01, 03, 05, 09 cả hai chế độ | Thanh đầu không tràn ngang; ◐ 44 px; không cuộn ngang trang |
| K10 | Trang 04, 05, 06: đo `getComputedStyle` | `Nhan` 11,5 px; hạn/kết quả/trạng thái ≥ 12 px; không chữ < 11 px |
| K11 | Windows + trang chào | Computed font = **Be Vietnam Pro**; số trong bảng thẳng cột; `.woff2` cùng tên miền |
| K12 | Tối, trang 01–10 | Giống ảnh "trước" (trừ phông, cỡ chữ Task 7, danh sách cố ý Task 9) |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Mọi màn mới: màu chỉ qua token (S5/S6 đỏ nếu sai), không chữ < 11 px (S8), ảnh **cả hai** chế độ | mọi PR đợt 5–6 | YC-7, §10.2 |
| Ba tầng thông tin từng màn (tầng 3 12 px, ẩn được trên điện thoại) | PR-VAI · PR-UXD (và PR giao diện chạm màn) | §7.5 — PR-SANG chỉ làm nền |
| `text-[11px]` → 12 px nếu chủ sản phẩm chọn **B** ở câu 2 sau khi PR này đã merge | PR-UXD | câu 2 |
| Viền ô nhập **tối** < 3:1 (`line-strong` 1,7:1, `o-sua-vien` 2,6:1) — sửa sẽ đổi dáng tối đã khoá | chủ sản phẩm quyết → PR-UXF / PR-Dọn | WCAG 1.4.11; M-tối |
| Chú thích "ký tự nhỏ của **Inter**" ở 8 file (`SkillBoard.tsx:289`, `ChonPhuTrach.tsx:80`, `DongThoiGianLuot.tsx:25`, `IntakePanel.tsx:42`, `ChipKyNang.tsx:107`, `NganXepLichMt.tsx:34`, `NhanViPham.tsx:3`, `Nhan.tsx:57`) → "của phông"; SVG giữ | PR-Dọn | chữ chú thích lỗi thời |
| Mockup 19 khối `[data-theme="light"]` cập nhật theo giá trị cuối; `DESIGN.md` (nếu chủ sản phẩm đồng ý) ghi token hai chế độ | planning | CLAUDE.md |
| Chỗ tương phản **tối** có sẵn từ trước mà Task 8 đo ra | PR-UXF | ngoài phạm vi "tối không đổi" |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Mặc định **Tối**, **không** theo `prefers-color-scheme` của máy | T15 "Mặc định Tối như hiện nay"; §7.1 GV quen nền tối |
| Q2 | Lưu `localStorage` khoá `pisa-giao-dien`, **theo máy**; không lưu vào hồ sơ tài khoản | T15 "nhớ theo từng máy"; lưu hồ sơ cần cột mới (PR không migrate); sáng/tối hợp theo phòng và màn hình, không theo người |
| Q3 | Script nội dòng ở `index.html` đặt `data-theme` trước khi vẽ | chống nháy tối → sáng; không cần thư viện |
| Q4 | Tối = `:root` không thuộc tính; sáng = `data-theme="light"` trên `<html>` | tối không đổi một byte; tên như mockup 19 |
| Q5 | Đổi màu bằng **ánh xạ trong `tailwind.config.js`** thay vì sửa ~530 lớp ở 119 file; tên lớp `slate-100…` giữ | ít file nhất, không đụng file HSM/HVL/XUAT; ghi chú trong config rằng tên là cũ, giá trị theo chế độ |
| Q6 | `white` → lớp phủ `--phu-rgb` (trắng ở tối, mực ở sáng); `bg-black/60` nền mờ sau panel giữ | `bg-white/5` rê chuột thấy được ở cả hai chế độ |
| Q7 | Giá trị sáng = §7.4 + mockup 19; chỗ đặc tả trống planning điền (bảng token), đều ≥ 4.5:1 | phép kiểm S1 quyết cuối; chỉnh đậm/nhạt, không đổi tông |
| Q8 | Phông **tự phục vụ** bằng `@fontsource/be-vietnam-pro` (bó vào bản build), không link Google Fonts; 5 độ đậm 400–800, không tải nghiêng | cùng tên miền: không lộ IP người dùng cho bên thứ ba, mạng trung tâm chặn Google vẫn có phông; mã dùng đủ 400–800 |
| Q9 | Sàn: không chữ < 11 px; kết quả/hạn/trạng thái/người ≥ 12 px; `Nhan` 11,5 px; `text-[11px]` metadata giữ | E4 + §7.4; câu 2 |
| Q10 | `text-slate-600/700` chỉ cho dấu trang trí; chữ thật → `slate-500` | E4; `slate-600` trên nền tối chỉ 2,2:1 |
| Q11 | Nút ◐ không chữ, `title`/`aria-label` nói **hành động kế tiếp**, `aria-pressed`; không đặt trong menu tài khoản | T15 "nút nhỏ ở thanh đầu"; M12 |
| Q12 | Viền ô nhập **sáng** ≥ 3:1; viền tối giữ | WCAG 1.4.11; tối đã khoá (Chuyển cho) |
| Q13 | `colorize` chỉ rà bảng sáng; gợi ý thêm màu/đổi tông → ghi PR, không làm | §7.1 "không màu mới cho từng khu"; CLAUDE.md giữ bảng màu |
| Q14 | Không hiệu ứng chuyển màu khi đổi chế độ | §7.1 không chuyển động trang trí |
| Q15 | Số đếm `HangTab` nền `doing` (PR-NEN chuyển) tự theo token hai chế độ — không đổi kiểu | "Chuyển cho PR-SANG" của PR-NEN chỉ là màu |
| Q16 | Không đổi favicon (chữ "P" nền tối) | hiện ở tab trình duyệt, không thuộc trang |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** YC-7 "866 chỗ gọi thẳng `slate-*`/`ink-*`" ↔ thật: PR-UX0 đã ánh xạ `slate-400/500` + `rose/amber/sky/emerald-200/300` (~660 chỗ);
  còn **≈ 530 chỗ ở 17 cấp màu**. Cả hai nhóm đổi qua config — không sửa component (Q5).
- **M2** YC-7 "mã hex trong `style`" ↔ thật **5 chỗ** trong `.tsx` + 1 lớp `bg-[#0b141d]`; thêm **11 giá trị cứng trong `index.css`** ngoài khối
  token mà đặc tả không kể (Task 2).
- **M3** T16 "Be Vietnam Pro" (⚠) ↔ CLAUDE.md "giữ phông Inter, trừ khi kế hoạch PR ghi rõ là đổi" ↔ E9 "tải Inter (hoặc bỏ khai báo)". Kế
  hoạch ghi rõ đổi theo T16, nhưng vì ⚠ → **câu 1**. Lưu ý: hôm nay máy Windows hiện **Segoe UI** (Inter không được tải) — phương án nào
  cũng đổi dáng chữ người dùng đang thấy.
- **M4** §7.2 giao taste-skill `redesign-skill` cho PR-SANG ↔ CLAUDE.md "không dùng taste-skill (đã tắt)" → bỏ; bảng kiểm của nó (phông,
  `tabular-nums`, độ đậm, hover/focus) nằm trong Task 6 (đo), KIỂM và `audit`.
- **M5** §7.2 giao `colorize` ↔ danh sách lệnh session code ở CLAUDE.md không kể `colorize` (nhưng không cấm — cấm chỉ `init`, `document`,
  `hooks on`, `install|update`) → dùng hạn chế (Q13).
- **M6** §7.4 bảng sáng chỉ có nền/bề mặt/viền/chữ/nhấn/SOS/Đạt; thiếu `doing, done, wait, muted`, hàng lớn/con, ô sửa, Đang chọn → planning
  điền (bảng token); `done`/`wait` lấy đúng mockup 19.
- **M7** Đề bài gợi ý `prefers-color-scheme` ↔ T15 "mặc định Tối như hiện nay" → theo T15 (Q1).
- **M8** E4 dẫn `App.tsx:85`, `text-[10px]` ×67, `text-[10.5px]` ×17 ↔ thật `App.tsx:41, 102`; **72 + 30 chỗ ở 37 file**.
- **M9** HE §2 "bảng `ink` chỉ còn dùng cho Đang chọn (`ink-800`)" ↔ thật còn `text-ink-950` (`NganXepLichMt.tsx:374`) → ánh xạ `accent-ink`.
- **M10** `nenGiaoDien.tests.ts` N-1 đọc **phẳng** cả `index.css` (`docMauCss`, khoá sau đè khoá trước) → thêm khối sáng làm N-1 lặng lẽ kiểm màu
  sáng thay vì tối → sửa đọc khối `:root` (Task 1).
- **M11** `MeetingPage.tsx:138` dùng `var(--text-muted, #94a3b8)` — biến **không tồn tại** → luôn ra màu dự phòng cứng (lỗi nhỏ có sẵn) → Task 4.
- **M12** §7.4 "Phụ 12 px", tầng 3 = 12 px ↔ E4 chỉ bắt 12 px cho kết quả/hạn/trạng thái; 240 chỗ `text-[11px]` ở 82 file → **câu 2**.

## Câu cần chủ sản phẩm quyết

1. **Phông chữ cho cả web** (T16 ⚠): (A) **Be Vietnam Pro** — như mockup 19 anh/chị đã xem, vẽ riêng cho dấu tiếng Việt, số cùng độ rộng; chữ
   rộng hơn Inter một chút *(khuyến nghị — nếu hơn 3 màn bảng bị xuống dòng, session code dừng báo)* · (B) **Inter** — hẹp hơn, bảng dày gọn
   hơn. Cả hai đều khác chữ anh/chị đang thấy (máy Windows đang hiện Segoe UI vì Inter chưa từng được tải). Kế hoạch đang theo **(A)**.
2. **Chữ phụ 11 px** (mã, giờ, người nhập — 240 chỗ): (A) **giữ 11 px**, chỉ nâng chữ < 11 px và chữ kết quả/hạn/trạng thái/người lên 12 px
   *(khuyến nghị — ít vỡ bảng; ba tầng thông tin từng màn làm dần ở PR-VAI/PR-UXD)* · (B) nâng hết lên 12 px ngay (đúng §7.4 hơn, bảng dày dài
   thêm, dễ xuống dòng ở 375 px). Kế hoạch đang theo **(A)**.

## Nhật ký thực thi

<!-- Session code ghi ở đây: model thật; PR HSM/HVL/XUAT đã merge (mã commit) + bảng file giao diện chúng đổi; mốc B; bảng đếm lại (số màu
cứng, chữ < 11 px); số đỏ Task 1; đo tnum/glyph/tràn cột Task 6; số chỗ < AA trước/sau (hai chế độ) Task 8; so "bảng màu tính được" tối
Task 9; chỗ lệch kế hoạch; 🛑 đã hỏi; chú thích ponytail:. -->

**Task 0 (30/09).** Model thật: **Sonnet 5.5**. Nhánh `pr-sang-sang-toi-font` từ `origin/main` `e7832cde`. Đã merge: PR-HSM #131 (`ada8f6c4`),
PR-XUAT #132 (`ce768d1c`), PR-HVL #133 (`e7832cde`). Ba PR đổi 33 file giao diện (`git diff --stat 507abc2a e7832cde -- web/src`): mới
`cham/GvCham.tsx`, `fasttrack/NhanXet.tsx`, `fasttrack/ODiemLon.tsx`, `test/NganXuatMt.tsx`, `ui/TheDong.tsx`; sửa nhiều ở `MockDetailPage`,
`ScoreEntry`, `LuoiFT`, `LuoiThuong`, `MotKyNang`, `BangCanHoTro`, `ClassIssueBoard`, `ClassProgressPanel`, `DauTrangLop`, `PhanTichLopTab`,
`TransitionPanel`, `BangHocVienLop`, `ClassRoster`, `StudentsPage`, `StudentDetailPage`, `LoTrinhTiepPanel`, `LichTestTab`, `HangLop`, `KhoiNo`,
`ViecTiep`, `MenuDong`, `SaveState`, `CongTacKhung`, `SkillBoard`, `TongHopTestSos`.
**Mốc B** = `npm run check` xanh, 1824 dòng ✓ ở `run.js` + 25 phép kiểm tốc độ, ~5 phút 8 giây.
**Đếm lại** (`web/src`): `text-[10px]` **71** + `text-[10.5px]` **30** ở **36 file** (kế hoạch 72 + 30 / 37). Màu cứng trong `.tsx` còn **4**:
`TransitionPanel.tsx:331` `var(--warn, #fbbf24)` · `DemoBar.tsx:55` `bg-[#0b141d]` · `HanhTrinh.tsx:160` `#dbe9ff` · `MeetingPage.tsx:138`
`var(--text-muted, #94a3b8)` + `rgb(252 165 165)`. **`ClassProgressPanel.tsx` không còn** `rgba(242,161,161,.08)` (PR-SOS/HSM đã bỏ). Ba PR **không**
thêm màu cứng mới. Cấp màu chưa ánh xạ (số lần dùng, không đếm biến thể `/nn`): `slate-100` 154 · `200` 141 · `300` 121 · `600` 52 · `700` 5 ·
`bg-white` 36 · `text-white` 4 · `ink-800` 5 · `ink-950` 1 · `teal-300/500/600` … như Hiện trạng.
Ảnh "trước" 10 trang (tối, 1440 px) ở `thiet-ke/anh/pr-sang/truoc-toi-NN-*.png`; JSON "bảng màu tính được" trước ở scratchpad (không commit).
Trang 03 chụp ở `/hoc-vien` (danh sách lớp, các lớp thu gọn); trang 04 mở tab "Cần hỗ trợ"; trang 08 là lượt Mock id 123.

> **Chủ sản phẩm chốt 30/09:** phông **Be Vietnam Pro**; chữ phụ **giữ 11 px**, chỉ nâng chữ < 11 px và chữ kết quả/hạn/trạng thái lên 12 px. Task cuối **sửa `CLAUDE.md`** dòng "giữ phông Inter" → "phông Be Vietnam Pro (PR-SANG)".

**Task 1 (30/09).** Phép kiểm trước: `npm run check` → **10 đỏ** (S1 tối + S1 sáng vì thiếu token `chu-*`/`accent-ink-rgb`/`chon-dau-rgb`, S2, S3, S4, S5, S6, S7, S8, S9),
**1799 đạt** (bằng mốc B; N-1 cũ xanh khi đọc khối `:root`). Lệch kế hoạch nhỏ: `docMauHaiCheDo` ghép **văn bản** `:root` + khối sáng rồi mới giải bí danh
(thay vì trộn hai bảng đã giải) — để `--dat-rgb: var(--ok-rgb)` ở sáng theo `--ok-rgb` sáng. S1 thêm `accent` trên nền trang (chữ liên kết).
