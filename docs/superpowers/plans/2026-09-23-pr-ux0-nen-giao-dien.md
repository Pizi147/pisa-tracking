# PR-UX0 · Nền giao diện (màu nghĩa · hàng lớn/nhỏ · badge gọn · khuôn panel) — Implementation Plan

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.

**Goal:** Dựng **nền chung** mà UX1–UX5 dùng lại: (N-1) bộ token màu nghĩa khai báo **một chỗ**, đổi luôn các lớp màu
hay dùng của cả web sang token để giao diện rõ như mockup mà không sửa từng màn; (N-2) component **hàng lớn / hàng con**
(phương án A mockup 17) cho bảng và danh sách, áp mẫu ở **Việc cần làm** và **Học viên & Lớp**; (N-3) sửa **4 gốc badge**
(`display.ts` hạn, `mywork.ts`, `DongViec`, `Alert` tự gắn ⚠) + badge hộp lớp "9 bài chờ chấm"; (N-4) khuôn
**`KhungPanel`** + ngữ cảnh "một panel một lúc" (G-8), chuyển **một** panel mẫu. PR **nhỏ, merge nhanh** — UX1–UX3 chờ nó.

**Architecture:** Màu: biến CSS dạng bộ ba RGB ở `web/src/index.css :root` (một chỗ), `tailwind.config.js` ánh xạ tên nghĩa
(`text-ok`, `bg-bad-bg`…) và **ghi đè** `rose/amber/sky/emerald-200/300`, `slate-400/500` về token → mọi màn đổi theo.
Luật thuần (tương phản, hạn, kho panel) ở `shared/domain/*` — kiểm bằng harness máy chủ. Component mới ở `web/src/ui/`:
`Nhan.tsx` (`Nhan`, `QuaHan`), `HangNhom.tsx` (`HangNhom`, `HangCon`, `KhoiNhom`, `MuiTenMo`), `KhungPanel.tsx`
(`KhungPanel`, `Khoi`, `Truong`, `Hang2`). Máy chủ chỉ sửa `server/src/worklist/mywork.ts` (không đường API mới, không truy vấn mới).

**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind 3.4. Phép kiểm
`server/src/tests/*` harness `check()`, chạy `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` **§1 (N-1…N-4)**, §6 dòng UX0 · luật chung
`docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 G-1…G-12, §2 chữ · `thiet-ke/THUAT_NGU_DA_CHOT.md` ·
mockup `thiet-ke/mockup/17-hang-va-badge.html` (**(a1) phương án A**, (a2), (a3), (b1) B-1…B-7, (b2) bảng 26 dòng, (b3), (b5)),
`15-panel-hv-lop.html` **(1) Khuôn panel chung**, màu `13-lich-test.html`/`14`/`15`/`17`, **`18-hanh-trinh-va-mau.html` phần (b)**
(bảng màu cuối — đang dựng; Task 1 bước 1 đối chiếu) · ảnh hiện trạng `thiet-ke/anh/hien-trang-23-09/`.

| Mục | Chốt |
|---|---|
| Mã PR | **PR-UX0 · Nền giao diện** |
| Nhánh · worktree | `pr-ux0-nen-giao-dien` · `.claude/worktrees/pr-ux0-nen-giao-dien` |
| Cổng thử | **API 4387 · Vite 5587** (không 4000/5173, không cổng PR khác) |
| Model | **Opus 5.5 · High** · phương án B: **Sonnet 5 · High** |
| Người rà | **Fable 5.1** |
| Migrate | **KHÔNG** (không đổi `server/src/schema.sql`, `server/src/migrate.ts`) |
| Phụ thuộc | Code được ngay trên `origin/main` (b13e647). Không chung file với **Z2c-c**; trước khi mở PR `git fetch` + rebase lên `origin/main` mới nhất (nếu Z2c-c đã merge). **UX1, UX2, UX3 bắt đầu sau khi UX0 merge.** |
| File KHÔNG được chạm | **Z2c-c:** `web/src/ui/Filters.tsx`, `web/src/modules/fasttrack/ScoreEntry.tsx`, `web/src/modules/cham/LuoiThuong.tsx`, `web/src/modules/fasttrack/MockDetailPage.tsx`, `server/src/worklist/scoreDebt.ts`, `server/src/classes/classes.ts`, `server/src/fasttrack/attempts.ts`, `server/src/db.ts`, `server/src/app.ts`, `server/src/tests/anToan.tests.ts`, `keHoachTest.tests.ts` · **UX1:** `web/src/modules/test/*` (trừ `keHoach/`), `web/src/modules/cham/*`, `shared/domain/dieuHuong.ts`, `server/src/cham/*` · **UX2:** `server/src/keHoach/keHoachTest.ts`, `web/src/modules/test/keHoach/*` · **UX3:** `web/src/modules/cases/*` (`SkillBoard`, `CasePanel`, `QuickReport`, `NganCase`…), `web/src/modules/yThuc/*`, `students/ChuyenLopPanel.tsx`, `students/LoTrinhTiepPanel.tsx`, `students/StudentDetailPage.tsx`, `shared/domain/hoSoHocVien.ts`, `server/src/students/profile.ts`, `shared/domain/hocVienLop.ts` **ngoài** `badgeLop` (:134-152) · **UX4:** `web/src/modules/phanTich/*`, `worklist/BranchPulse.tsx`, `classes/PhanTichLopTab.tsx` · **UX5:** `HanhTrinh*`. Ngoại lệ duy nhất: file trên chỉ **nhận** màu mới qua token/ghi đè Tailwind — **không sửa** file đó. |

## QUY TRÌNH NHANH (bắt buộc)

- **Không** rà từng Task bằng subagent. Session tự code từng Task, chạy `npm run check` sau **mỗi** Task (xanh, số phép kiểm
  **không giảm** — phép cũ đổi nội dung thì vẫn giữ tên/đếm), rồi commit `PR-UX0 (n): …`. **CHỈ MỘT** lần `npm run check`
  chạy một lúc (chạy chồng làm `run.js` treo); trước khi kết thúc: tắt mọi tiến trình `node`/`vite` của worktree này.
- Subagent (nếu dùng): **cùng model**, **KHÔNG Haiku**.
- **Không** chụp ảnh từng Task. Bấm thử theo vai **QL = user 2, GVCN = user 7, GVBM = user 9** + **375px** **một lần** ở
  Task 6 bằng **ảnh thật** (Playwright kênh Chrome), lưu `thiet-ke/anh/pr-ux0/`.
- Task 0 tạo worktree + nhánh từ `origin/main` mới nhất và chép kế hoạch này vào nhánh. Cuối PR: push, mở PR, báo planning.
- Commit ghi đúng dòng `Co-Authored-By` của **model thật** đang chạy.
- **Không** chạy lệnh nào vào database bản chính (Turso), **không** deploy.

## Global Constraints (chép từ đặc tả — áp mọi Task)

- **N-1 Màu:** giao diện thật **rõ như mockup**. Token nghĩa: đạt/tiến bộ · chưa đạt/SOS · quá hạn · sắp tới hạn · đang làm ·
  đã xong · chờ người khác · trung tính · hàng lớn/hàng con · ô sửa được/chỉ đọc. Chữ tương phản **≥ 4.5:1**. **Một chỗ khai
  báo**, mọi màn dùng token.
- **N-2 Hàng lớn/nhỏ (A):** hàng lớn nền sáng hơn một bậc + **vạch 3px trái** (luôn xanh trung tính, không màu trạng thái) +
  chữ đậm 12.5px, cao 38px; hàng lớn đang đóng: vạch mờ. Hàng con thụt **16px** sau cột mũi tên, nền tối hơn, chữ 11.5px, cao
  ≥ 32px; số tổng của hàng lớn **thẳng cột** với số con. Mũi tên ▸/▾ trong cột riêng 16px, tooltip "Mở"/"Thu gọn" (G-7).
  `<details>` nhỏ trong panel **giữ nguyên** (không phải hàng).
- **N-3 Badge (B-1…B-7):** một badge = một trạng thái ngắn (≤ 3 từ + số); ≤ 2 badge một dòng. Việc cần làm là **tiêu đề
  dòng** (động từ + đối tượng), không nằm trong badge; nút động từ ngắn. Hạn ở cột/dòng phụ, chữ mờ "hạn CN 30/08"; quá hạn
  nối ngay sau **trong chữ**: "⚠ quá hạn 15 ngày" (đỏ, không nền, không khung); hạn hôm nay "hôm nay" (vàng, không ⚠).
  ⚠ **chỉ** nghĩa quá hạn (G-4). Mỗi thông tin nói **một lần**. Bản đầy đủ vào tooltip. Màu: xanh = đang chạy · vàng = chờ /
  cần chú ý · xám = chưa bắt đầu, thông tin · xanh lá = xong / ổn · nền đỏ = chỉ SOS 3 và "Chưa đạt" · viền nét đứt = số tạm.
- **N-4 Khuôn panel:** ngăn phải **560px** (form dạng bảng **720px**), **375px toàn màn** · đầu 52px **một dòng**: tiêu đề ·
  tên HV · lớp (mờ, cắt "…") · ✕ · tab (nếu có) dính dưới đầu · ngữ cảnh ≤ 1 dòng · thân chia **khối** có tiêu đề nhỏ (luật dài
  vào ⓘ) · nhãn **trên** ô, ≤ 2 ô/hàng khi thật ngắn · chữ phụ ≤ 1 dòng · **chân cố định** (trái: Huỷ, Xoá viền đỏ; phải: phụ +
  một nút chính) · "Còn thiếu: …" trên chân, canh phải, **chỉ sau khi bấm Lưu/rời ô** · **chỉ thân cuộn**, trang sau khoá cuộn
  · mở việc khác **thay nội dung**, không chồng panel (G-8) · không chữ dev, chữ mẫu bắt đầu "Ví dụ:" · ngày không lặp năm, tuần
  `W4 SEP`.
- **G-1** ✓ nhỏ, cùng màu chữ phụ · **G-2** `tabular-nums`, cột cố định · **G-3** tối đa một dòng phụ ≤ ~60 ký tự · **G-4** ⚠ chỉ
  quá hạn · **G-5** không `SectionNote` giải thích, luật vào ⓘ (`web/src/ui/NutLuat.tsx`) · **G-6** ngày `dd/mm`, tuần qua
  `tuanLich()` · **G-7** viết tắt/icon có tooltip · **G-8** panel không chồng · **G-10** mọi hạn qua `<Han>` · **G-11** 375px: bảng
  cuộn ngang **trong thẻ**, trang không cuộn ngang; nút ≥ 44px.
- **Chữ:** "Ghi kết quả" (không "Cập nhật kết quả" — THUAT_NGU g3-057→g3-056), "Đề ra PA" (g8-092), "Case" viết hoa, "HV",
  lớp thường **Giữa khoá / Cuối khoá** (không "MT"). Không mở đầu câu bằng "Hãy". Không viết chuỗi trong `PRH_OLD_STRINGS`
  (`server/src/tests/run.ts:8827`).

## Bảng Q — planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Quyết định | Lý do |
|---|---|---|---|
| Q1 | Tên component: mockup 17 ghi `HangMoRong`/`NhomMoRong`, mockup 15 ghi `Panel.tsx` | Dùng tên đã báo cho UX1–UX3: `HangNhom`/`HangCon`/`KhoiNhom` (`web/src/ui/HangNhom.tsx`), `KhungPanel`+`Khoi`/`Truong`/`Hang2` (`web/src/ui/KhungPanel.tsx`), `Nhan`/`QuaHan` (`web/src/ui/Nhan.tsx`) | Kế hoạch UX1–UX3 viết song song theo tên này |
| Q2 | Mockup 18 (bảng màu cuối) chưa có | Lấy hex mockup 13–17 (bảng ở Task 1). **Task 1 bước 1**: nếu `thiet-ke/mockup/18-hanh-trinh-va-mau.html` đã có trên `origin/main`/`origin/ke-hoach-overhaul` thì thay đúng hex phần (b), ghi Nhật ký | Phép kiểm tương phản tự bắt hex sai |
| Q3 | "Một chỗ khai báo" | `web/src/index.css :root` giữ bộ ba RGB; Tailwind đọc qua `rgb(var(--x-rgb) / <alpha-value>)`; test đọc chính file CSS | Một nguồn cho CSS, Tailwind, phép kiểm; vẫn dùng được `/15` |
| Q4 | Đổi cả web "không sửa từng màn" | Ghi đè Tailwind `rose/amber/sky/emerald` 200 & 300 → `bad/soon/doing/ok`; `slate-400` → `--text-dim`, `slate-500` → `--text-faint` (#8190ab, cũ #64748b chỉ 3.5:1). `slate-600` (dấu "—", 64 chỗ) **giữ** | 410 chỗ `slate-500` là chữ phụ; "—" là chỗ trống, không phải chữ đọc |
| Q5 | Xanh lá: `ui.tsx:63-67` "xanh lá chỉ cho Outcome" ↔ B-7 "xanh lá = xong / ổn" ↔ mockup 13 "Đã chấm" xám | Theo **B-7** (mockup 17 đã duyệt, nguồn thắng): `--done` = xanh lá; bỏ đoạn luật cũ trong chú thích | Đặc tả 23/09 > mockup > luật cũ. Ghi "đối chiếu mockup 18" |
| Q6 | `Level` (SOS) nền đặc | Đổi thành **pill nền nhạt** như mockup (`.n.y`, `.n.r`): SOS 1 xanh, SOS 2 vàng, SOS 3 & Chưa đạt nền đỏ nhạt | Mockup 13/17 |
| Q7 | Hạn "cập nhật PA" có đếm ngày không (luật cũ HE_GIAO_DIEN §4, phép `run.ts:8055`) | **Có**: "hạn CN 30/08 ⚠ quá hạn 15 ngày" | Mockup 17 #1, #21 ghi số ngày; đổi phép kiểm |
| Q8 | `<Han>` có kèm tên việc không | Mặc định **không** (B-2/B-3: việc là tiêu đề dòng); prop `coViec` bật lại cho chỗ không có tiêu đề | Chỉ ~10 chỗ gọi (`grep -rn "<Han " web/src`) |
| Q9 | `Alert` bỏ ⚠ nhưng `CasePanel.tsx:431` (file UX3) đang dùng `<Alert>Quá hạn cập nhật kết quả</Alert>` | Prop `quaHan?: boolean`; **mặc định** = children là chuỗi bắt đầu "Quá hạn" (không phân biệt hoa thường) | Giữ ⚠ đúng chỗ mà không chạm file UX3 |
| Q10 | `overdueLabel` / `GROUP_META.overdue` | **Xoá** khỏi `WorkItem` (máy chủ + web); phép `run.ts:3021` viết lại thành luật mới | Mockup 17 #5 (B-5) |
| Q11 | "Cần xếp lớp tiếp" / "Chưa có lộ trình tiếp theo" luôn `urgency: 'overdue'` dù không có hạn | Đổi `'normal'`; statusLabel `Chờ xếp lớp` | Mockup 17 #12; G-4 |
| Q12 | Nhãn đợt "MT1" cho lớp thường (#13) — đặc tả ghi ở §3 (UX3) nhưng nằm trong `mywork.ts` | Làm ở **UX0** (Task 3) | Tránh 2 PR cùng sửa `mywork.ts` |
| Q13 | Badge hộp lớp (#16 "cần chủ SP chốt") | Chủ SP chốt qua planning: **`{n} bài chờ chấm`** cả hai phạm vi, tooltip giữ câu cũ `needScoresText`. Kèm #17 `{n} HV chờ xếp lớp` (vàng), #18 `{n} Case mở` (xám) — cùng hàm `badgeLop` | Một hàm, ba dòng |
| Q14 | Học viên & Lớp: tiêu đề cột một lần | **Một `<table>`**, `<thead>` một lần, **mỗi lớp một `<tbody>`** (hàng lớn + hàng con); panel ⋯ render qua `createPortal(…, document.body)` | Không đổi cách tải roster theo lớp |
| Q15 | Ngữ cảnh "một panel một lúc" | Kho thuần `shared/domain/khoPanel.ts` + hook trong `KhungPanel` (không Provider, không sửa `App.tsx`) | Kiểm được bằng harness; không đụng khung app |
| Q16 | Panel mẫu | `web/src/modules/classes/SuaThongTinLopPanel.tsx` (Hồ sơ lớp › ⋮ › Sửa thông tin lớp) | Nhỏ (70 dòng), có chân, không thuộc UX1–UX4 |
| Q17 | 8 chỗ hàng mở rộng còn lại | Bảng "Chuyển cho PR sau" cuối file | — |

---

## File sẽ chạm

| File | Việc | Task |
|---|---|---|
| `web/src/index.css` | `:root` token (:6-33), `.btn-danger` (:102-103), lớp `.hang-lon/.hang-con/.khoi-nhom-*`, `.o-sua/.o-doc` | 1, 3 |
| `tailwind.config.js` | màu nghĩa + ghi đè | 1 |
| `shared/domain/mauNghia.ts` (tạo) · `shared/domain/khoPanel.ts` (tạo) · `shared/domain/index.ts` (+2) | luật thuần | 1, 5 |
| `web/src/ui/ui.tsx` | Level :76-96, Task :98-130, Info :136-145, Status :158-177, Alert :185-199, Outcome :213-229, SCORE_* :37-46, KpiTile :270-284 | 1, 2 |
| `web/src/ui/SoLieu.tsx`, `SoLieuO.tsx`, `Toast.tsx`, `HangTab.tsx`, `OSoNho.tsx`, `TyLe.tsx`, `BangChung.tsx` | chỉ lớp màu → token | 1 |
| `shared/domain/display.ts` :218-306 · `web/src/ui/Han.tsx` · `web/src/ui/Nhan.tsx` (tạo) | hạn + badge | 2 |
| `server/src/worklist/mywork.ts` · `web/src/modules/worklist/WorkList.tsx` · `NhomViec.tsx` · `web/src/ui/HangNhom.tsx` (tạo) | Việc cần làm | 3 |
| `web/src/modules/students/StudentsPage.tsx` :180-275, :391 · `BangHocVienLop.tsx` :84-150 · `shared/domain/hocVienLop.ts` :134-152 · `web/src/modules/classes/DauTrangLop.tsx` :57-66 | Học viên & Lớp | 4 |
| `web/src/ui/KhungPanel.tsx` (tạo) · `classes/SuaThongTinLopPanel.tsx` · `modules/dev/ThanhPhanDemo.tsx` | panel | 5 |
| `server/src/tests/nenGiaoDien.tests.ts` (tạo) · `run.ts` (+2 dòng cuối; sửa :3021-3038, :8019-8064) · `sosV3.tests.ts` :679, :688 · `hocVienLop.tests.ts` :135-140, :190-193 · `congViec.tests.ts` :466 (nếu đổi) | phép kiểm | 1–5 |
| `CODE_MAP.md` | mục `web/src/ui` | 6 |

---

### Task 0: Chuẩn bị

- [ ] **1.** `git fetch origin`; tạo worktree `.claude/worktrees/pr-ux0-nen-giao-dien`, nhánh `pr-ux0-nen-giao-dien` **từ
  `origin/main`**. Không checkout nhánh khác trong thư mục chính. `npm ci` nếu thiếu `node_modules`.
- [ ] **2.** Chép file này vào nhánh (`docs/superpowers/plans/2026-09-23-pr-ux0-nen-giao-dien.md`), commit `PR-UX0 (0): ke hoach`.
- [ ] **3.** Kiểm không có biến Turso trong môi trường (`TURSO_*`, `LIBSQL_*` rỗng). Mốc: `npm run check 2>&1 | tail -4` → ghi số
  phép **B** vào Nhật ký.
- [ ] **4.** Tạo `server/src/tests/nenGiaoDien.tests.ts` theo mẫu `khung.tests.ts` (`export async function runNenGiaoDienTests(t:
  YThucTestKit)`, `const d = await import('../../../shared/domain/index.ts')`), nối vào **cuối** `run.ts` ngay trước khối in tổng
  kết (sau `runLenLopTests`), truyền cùng bộ tham số như `runLenLopTests`. Commit cùng Task 1.

---

### Task 1: N-1 — token màu nghĩa một chỗ + cả web đổi theo

**Files:** `web/src/index.css`, `tailwind.config.js`, tạo `shared/domain/mauNghia.ts`, `shared/domain/index.ts`, `web/src/ui/ui.tsx`,
`SoLieu.tsx`, `SoLieuO.tsx`, `Toast.tsx`, `HangTab.tsx`, `OSoNho.tsx`, `TyLe.tsx`, `BangChung.tsx`, `nenGiaoDien.tests.ts`.

**Produces:** biến CSS `--{ok,done,bad,late,soon,doing,wait,muted}-rgb`, `--{…}-bg-rgb` (trừ `late`), `--text-dim-rgb`,
`--text-faint-rgb`, `--hang-lon-bg`, `--hang-lon-vach`, `--hang-lon-dong-bg`, `--hang-lon-dong-vach`, `--hang-con-bg`, `--hang-con-chu`,
`--o-sua-vien`, `--o-sua-nen`; lớp Tailwind `text-ok`, `bg-ok-bg`, `border-bad/40`…; `tuongPhan(a, b): number`,
`docMauCss(css: string): Record<string, [number, number, number]>`.

- [ ] **1. Đối chiếu mockup 18.** `git fetch origin`; `git show origin/ke-hoach-overhaul:thiet-ke/mockup/18-hanh-trinh-va-mau.html`
  (hoặc `origin/main`). **Có** → lấy đúng hex phần (b) thay bảng dưới, ghi Nhật ký "hex theo mockup 18 (b)". **Chưa có** →
  dùng bảng dưới (hex mockup 13–17), ghi Nhật ký "chưa có mockup 18 — đối chiếu lại khi có".

  | Token | Chữ | Nền badge | Nghĩa |
  |---|---|---|---|
  | `ok` | `#73d9a5` | `#15362a` | đạt · tiến bộ |
  | `done` | `#73d9a5` | `#15362a` | đã xong (B-7) |
  | `bad` | `#ff9a9a` | `#3b2126` | chưa đạt · SOS 3 |
  | `late` | `#ff9a9a` | — (không nền) | quá hạn |
  | `soon` | `#e5c66a` | `#3a3219` | sắp tới hạn · hôm nay · chờ · cần chú ý · SOS 2 |
  | `doing` | `#84baff` | `#173451` | đang làm · SOS 1 |
  | `wait` | `#b7c2d6` | `#1d2a40` | chờ người khác |
  | `muted` | `#b7c2d6` | `#1d2a40` | trung tính · thông tin |
  | hàng lớn | nền `#172640`, vạch `#84baff`; đang đóng nền `#131f35`, vạch `#3a4f72` | | N-2 |
  | hàng con | nền `#0b1322`, chữ `#c9d4e6` | | N-2 |
  | ô sửa được | viền `#33507a`, nền `#0e1829`, focus viền `#84baff` + bóng `rgba(132,186,255,.22)`; ô chỉ đọc: viền + nền trong suốt | | lưới chấm (UX1) |
  | `--text-faint` | `#8190ab` (cũ `#6c7c9c` = 4.0:1) | | chữ phụ |

- [ ] **2. `index.css :root` (:6-33).** Khai báo bộ ba, ví dụ `--ok-rgb: 115 217 165; --ok-bg-rgb: 21 54 42;`, và giữ tên cũ làm
  bí danh để không vỡ chỗ đang dùng: `--ok: rgb(var(--ok-rgb)); --warn: rgb(var(--soon-rgb)); --danger: rgb(var(--bad-rgb));
  --info: rgb(var(--doing-rgb)); --text-dim: rgb(var(--text-dim-rgb)); --text-faint: rgb(var(--text-faint-rgb));`.
  `.btn-danger` (:102-103) dùng `rgb(var(--bad-rgb) / .42)` và `/ .12`. Thêm `.o-sua` (viền/nền/focus bảng trên) và `.o-doc`
  (viền + nền trong suốt) ở `@layer components`.
- [ ] **3. `tailwind.config.js`** — trong `theme.extend.colors`:
  ```js
  const v = (n) => `rgb(var(--${n}-rgb) / <alpha-value>)`;
  const nghia = (n, coNen = true) => (coNen ? { DEFAULT: v(n), bg: v(`${n}-bg`) } : v(n));
  // …
  ok: nghia('ok'), done: nghia('done'), bad: nghia('bad'), late: nghia('late', false), soon: nghia('soon'),
  doing: nghia('doing'), wait: nghia('wait'), muted: nghia('muted'),
  rose: { 200: v('bad'), 300: v('bad') }, amber: { 200: v('soon'), 300: v('soon') },
  sky: { 200: v('doing'), 300: v('doing') }, emerald: { 200: v('ok'), 300: v('ok') },
  slate: { 400: v('text-dim'), 500: v('text-faint') },
  ```
  (`extend` gộp sâu: các sắc khác của `rose`, `slate`… giữ mặc định.) Kiểm nhanh bằng `npx vite build` không lỗi và một lớp
  `bg-rose-300/15` ra `rgb(var(--bad-rgb) / 0.15)` trong CSS dựng.
- [ ] **4. `ui.tsx` sang token** (không đổi props, trừ `Alert` ở Task 2):
  - `Level` (:76-96): pill `rounded-full px-2 py-px text-[11px] font-bold`; `ok → bg-ok-bg text-ok`, `info → bg-doing-bg
    text-doing`, `warn → bg-soon-bg text-soon`, `danger → bg-bad-bg text-bad`, `neutral → bg-muted-bg text-muted`, `muted →
    border border-dashed border-muted/40 text-muted` (Q6).
  - `Status` (:158-177): `doing → doing`, `waiting → soon`, `done → done` (Q5), `idle → viền đứt muted`. Sửa chú thích
    :148-157 và :63-67 theo B-7 (xanh lá = xong/ổn).
  - `Task` (:98-105), `Info` (:136-145), `Outcome` (:213-218), `SCORE_CHIP`/`SCORE_TEXT` (:37-46: rose→bad, sky→doing, emerald→ok,
    slate→muted), `KpiTile` (:276-280), `ErrorState`/`Forbidden` (:244, :254); các file `web/src/ui/*` khác: chỉ đổi lớp màu → token.
- [ ] **5. `shared/domain/mauNghia.ts`**: `docMauCss` đọc cả `--x-rgb: r g b;` và `--x: #rrggbb;` (bỏ qua giá trị `rgb(var(…))`);
  `doSang([r,g,b])` theo WCAG 2.x; `tuongPhan(a, b)` nhận `[r,g,b]` hoặc `#hex`, trả số làm tròn 2 chữ số. Xuất ở `index.ts`.
- [ ] **Phép kiểm (+3)** trong `nenGiaoDien.tests.ts`, đọc `path.join(ROOT, '..', 'web/src/index.css')` (ROOT = `dist-server`):
  - `UX0 · N-1: tuongPhan đúng công thức` — `#000`/`#fff` = 21; `#ff9a9a`/`#3b2126` ≈ 7.22 (±0.05).
  - `UX0 · N-1: mọi chữ màu nghĩa ≥ 4.5:1 trên nền badge của nó và trên mọi nền trang` — cặp (x, x-bg) cho 7 token có nền;
    chữ {ok, bad, late, soon, doing, wait, muted, text-dim, text-faint} trên {`--bg`, `--surface`, `--surface-2`, `--hang-lon-bg`,
    `--hang-con-bg`}; báo tên cặp hỏng + tỉ số. Thiếu token nào trong danh sách → hỏng.
  - `UX0 · N-1: một chỗ khai báo` — `web/src/ui/ui.tsx`, `Han.tsx`, `Nhan.tsx` (khi có), `HangNhom.tsx`, `KhungPanel.tsx`
    không chứa `/#[0-9a-f]{6}\b/i` và không chứa `(rose|amber|sky|emerald)-\d`.
- [ ] **Xong khi:** `npm run check` = **B+3**, xanh; `npx vite build` sạch. Commit `PR-UX0 (1): token mau nghia`.

---

### Task 2: N-3 gốc 1 + 4 — hạn dạng mảnh rời, `<Han>` chữ, `QuaHan`, `Nhan`, `Alert` không tự ⚠

**Files:** `shared/domain/display.ts` :218-306, `web/src/ui/Han.tsx`, tạo `web/src/ui/Nhan.tsx`, `web/src/ui/ui.tsx` :179-199,
`web/src/modules/students/StudentsPage.tsx` :391, `server/src/tests/run.ts` :8019-8064, `hocVienLop.tests.ts` :190-193,
`nenGiaoDien.tests.ts`.

**Produces:**
```ts
// display.ts — thay DEADLINE_LABEL (:227-237)
const DEADLINE_VIEC: Record<DeadlineKind, { viec: string; tien: 'hạn' | 'hạn CN' | 'dự kiến kết thúc' }> = {
  'xac-minh-sos': { viec: 'Xác minh nguyên nhân', tien: 'hạn' }, 'lap-pa': { viec: 'Đề ra PA', tien: 'hạn' },
  'cap-nhat-pa': { viec: 'Ghi kết quả PA', tien: 'hạn CN' }, 'thuc-hien-y-thuc': { viec: 'Thực hiện xong', tien: 'hạn' },
  'hoan-thanh-y-thuc': { viec: 'Kết luận đợt', tien: 'hạn' }, 'nhap-diem': { viec: 'Nhập điểm', tien: 'hạn' },
  'du-kien-ket-thuc': { viec: 'Dự kiến kết thúc', tien: 'dự kiến kết thúc' }, 'viec-van-hanh': { viec: 'Việc', tien: 'hạn' },
};
export type DeadlineView = {
  text: string;            // câu đầy đủ cho tooltip: "Ghi kết quả PA · hạn CN 30/08 · quá hạn 15 ngày"
  tone: DeadlineTone; daysOverdue: number | null; title: string | null;   // giữ nguyên nghĩa cũ
  viec: string;            // "Ghi kết quả PA"
  han: string;             // "hạn CN 30/08" | "hạn 09/09" | "dự kiến kết thúc 14/09" | "chưa có hạn"
  homNay: boolean;         // đúng ngày hạn, chưa quá (không bao giờ true với du-kien-ket-thuc)
  quaHan: string | null;   // "quá hạn 15 ngày"
  hen: string | null;      // "hẹn xử lý 30/09"
};
export function nhanQuaHan(n: number | null, gon = false): string   // gon: "15 ngày"; n null: "quá hạn"
```
`<Han loai han hanGoc? hen? tienTo? ghiChu? coViec? haiDong?>` (props cũ giữ nguyên); `<QuaHan ngay gon? />`;
`<Nhan tone="ok|done|bad|soon|doing|wait|muted" dut? title? onClick?>` ; `Alert` thêm `quaHan?: boolean`.

- [ ] **1. `deadlineView` (:260-289)** dựng các mảnh: `han = \`${tien} ${shortDate(due, today)}\``; quá hạn (không phải
  `du-kien-ket-thuc`, `today > hạn gốc`) → `daysOverdue = daysBetween(base, today)` **cho mọi loại, kể cả `cap-nhat-pa`** (Q7),
  `quaHan = nhanQuaHan(daysOverdue)`; `homNay = today === base`; `hen` khi có `reschedule`. `text = [viec, han, quaHan,
  homNay ? 'hôm nay' : null, hen].filter(Boolean).join(' · ')`, riêng `du-kien-ket-thuc`: `text = han` viết hoa chữ đầu
  ("Dự kiến kết thúc 14/09"). `due` không hợp lệ → `han = 'chưa có hạn'`, `text = \`${viec} · chưa có hạn\``. Chú thích
  :218-225 ghi luật mới (B-3, Q7).
- [ ] **2. `Nhan.tsx`**:
  ```tsx
  export function QuaHan({ ngay, gon }: { ngay: number | null; gon?: boolean }) {
    return <span className="whitespace-nowrap font-bold text-late">⚠ {nhanQuaHan(ngay, gon)}</span>;
  }
  const NHAN: Record<ToneNhan, string> = { ok: 'bg-ok-bg text-ok', done: 'bg-done-bg text-done', bad: 'bg-bad-bg text-bad',
    soon: 'bg-soon-bg text-soon', doing: 'bg-doing-bg text-doing', wait: 'bg-wait-bg text-wait', muted: 'bg-muted-bg text-muted' };
  // <Nhan>: pill rounded-full px-[7px] text-[10.5px] font-bold leading-4 whitespace-nowrap; dut → bg-transparent border border-dashed border-current
  // onClick có → <button type="button"> (min-h-[28px], hover:brightness-125), không thì <span>
  ```
- [ ] **3. `Han.tsx` viết lại** — một `<span title={v.text + (v.title ? \` · ${v.title}\` : '')}>` chữ `text-[11px] text-slate-500`
  (= faint): `[tienTo] · [coViec ? v.viec] · {v.han}` rồi `{v.tone === 'overdue' && <> <QuaHan ngay={v.daysOverdue} /></>}`,
  `{v.homNay && <> · <span className="font-semibold text-soon">hôm nay</span></>}`, `[· v.hen] [· ghiChu]`. `haiDong` → phần
  `QuaHan`/`hôm nay` xuống dòng (`block`) — cho cột hạn 150px. **Không** còn `Alert`/`Status`/`Info` trong `Han`.
- [ ] **4. `Alert` (ui.tsx:185-199):** `const coDau = quaHan ?? (typeof children === 'string' && /^quá hạn/i.test(children))`;
  ⚠ chỉ vẽ khi `coDau` (Q9). Sửa chú thích :179-184 (B-4: nhắc mềm, lưu lỗi, dữ liệu demo, mức khẩn → không ⚠).
  `StudentsPage.tsx:391` → `<Alert quaHan>Quá hạn {r.overdueSkills}</Alert>`.
- [ ] **5. Phép kiểm** — viết lại nhóm `PR-E · <Han>` ở `run.ts:8019-8064` (giữ **7** phép, giữ tên đầu "PR-E · <Han>:"):
  (a) bảy `text` đúng: `'Xác minh nguyên nhân · hạn 23/09'`, `'Đề ra PA · hạn 23/09'`, `'Ghi kết quả PA · hạn CN 23/09'`,
  `'Thực hiện xong · hạn 23/09'`, `'Kết luận đợt · hạn 23/09'`, `'Nhập điểm · hạn 23/09'`, `'Dự kiến kết thúc 23/09'`, vẫn khác
  nhau đôi một; (b) `nhap-diem` 23/09 hôm 25/09 → `text === 'Nhập điểm · hạn 23/09 · quá hạn 2 ngày'`, `quaHan === 'quá hạn 2
  ngày'`, đếm từ hạn gốc; (c) hẹn → `'Nhập điểm · hạn 23/09 · hẹn xử lý 30/09'`; (d) dự kiến không bao giờ quá hạn; (e) **đổi
  nghĩa** `cap-nhat-pa` 06/09 hôm 14/09 → `daysOverdue === 8`, `quaHan === 'quá hạn 8 ngày'`, `han === 'hạn CN 06/09'`;
  (f) chưa có hạn; (g) giữ phép `shortDate`. `hocVienLop.tests.ts:190,193`: chữ mong đợi đổi theo `text` mới (`'L · Ghi kết quả
  PA · hạn CN 13/09 · quá hạn {n} ngày'` với n = số ngày từ 13/09 tới `TODAY` của phép đó; `'R · Ghi kết quả PA · hạn CN 20/09'`).
  **+2 mới** (`nenGiaoDien.tests.ts`): `UX0 · N-3: hạn hôm nay là "hôm nay", không quá hạn, không ⚠` (`homNay === true`,
  `tone !== 'overdue'`, `!/⚠/.test(text)`); `UX0 · N-3: không mảnh nào lặp chữ "quá hạn" hai lần và không có năm khi cùng năm`
  (quét 8 loại × {chưa tới, hôm nay, quá hạn}: `(text.match(/quá hạn/g) ?? []).length <= 1`, `!/\/2026/.test(text)`).
- [ ] **Xong khi:** `npm run check` = **B+5**; `grep -rn "<Han " web/src` → mỗi chỗ còn đọc được (ghi Nhật ký chỗ nào cần
  `coViec` — chỉ thêm ở file **không** thuộc PR khác). Commit `PR-UX0 (2): han dang manh, QuaHan, Nhan, Alert`.

---

### Task 3: N-2 component + N-3 gốc 2, 3 — Việc cần làm (máy chủ + dòng việc + nhóm)

**Files:** tạo `web/src/ui/HangNhom.tsx`; `web/src/index.css`; `server/src/worklist/mywork.ts`; `web/src/modules/worklist/WorkList.tsx`
(:8-94); `NhomViec.tsx` (:24-76); `run.ts` :3021-3038, :3049; `sosV3.tests.ts` :679, :688; `congViec.tests.ts` :466;
`nenGiaoDien.tests.ts`.

**Produces:**
```tsx
export function MuiTenMo({ mo, onMo, nhan }: { mo: boolean; onMo: () => void; nhan: string }) // nút 16px ▸/▾, title "Mở"/"Thu gọn", aria-label `${Mở|Thu gọn} ${nhan}`, aria-expanded
export function HangNhom({ mo, onMo, nhan, tieuDe, children, className }: {       // <tr className="hang-lon [dong]">
  mo: boolean; onMo: () => void; nhan: string; tieuDe: ReactNode; children?: ReactNode /* các <td> còn lại */; className?: string })
export function HangCon({ children, className, title }: { children: ReactNode /* các <td> */; className?: string; title?: string }) // <tr className="hang-con">
export function KhoiNhom({ mo, onMo, nhan, tieuDe, dem, phu, children, id }: {  // danh sách: <section> đầu .khoi-nhom-dau + thân .khoi-nhom-con khi mở
  mo: boolean; onMo: () => void; nhan: string; tieuDe: ReactNode; dem?: number; phu?: ReactNode; children: ReactNode; id: string })
```
`WorkItem` (máy chủ + web): **thêm** `tieuDe: string`; **bỏ** `overdueLabel`.

- [ ] **1. CSS** (`@layer components`, dùng biến Task 1):
  ```css
  .hang-lon > td { background: var(--hang-lon-bg); font-weight: 800; font-size: 12.5px; height: 38px; }
  .hang-lon > td:first-child { box-shadow: inset 3px 0 0 var(--hang-lon-vach); }   /* .dong: nền/vạch *-dong-* */
  .hang-con > td { background: var(--hang-con-bg); font-size: 11.5px; color: var(--hang-con-chu); height: 32px; }
  .hang-con > td:first-child { padding-left: calc(0.75rem + 32px); }   /* lề ô + cột mũi tên 16px + thụt 16px */
  .khoi-nhom-dau { /* như .hang-lon: flex, min-height 38px, px 12px, cùng nền + vạch, có .dong */ }
  .khoi-nhom-con { background: var(--hang-con-bg); }  .khoi-nhom-con > * { padding-left: 28px; }
  ```
  Hàng con có dòng phụ thì cao theo nội dung (`height` là tối thiểu). `HangNhom`: ô đầu = `MuiTenMo` + `tieuDe`, cả hàng bấm
  được (`onClick` trên `<tr>`, `cursor-pointer`), trừ khi bấm vào `a`/`button` con (`e.target.closest('a,button') !== e.currentTarget`
  → bỏ qua). `KhoiNhom`: `dem` là pill số `tabular-nums`; `phu` nằm sau.
- [ ] **2. `mywork.ts`** (gốc 2 — mockup 17 #5-#13):
  - Xoá `overdue` khỏi `GROUP_META` (:119-212, kiểu `{ label; hint }`), xoá `badge()` (:215-217), xoá trường `overdueLabel` (:55-60)
    và mọi `overdueLabel: …` (:305, 419, 531, 592, 659, 704, 747, 816, 894, 958, 976, 1027, 1051).
  - `lateText` (:258-261) **xoá**; bỏ mọi đuôi quá hạn khỏi `reason`/`statusLabel`: :309 → `'Chờ xác minh'`; :417 → `skills`;
    :528, :589, :811, :955 → bỏ phần tử `lateText(…)` khỏi mảng; :657 → `what`; :889-891 → `head` (bỏ "— chưa có PA học thuật n
    ngày"); :1050 → `t.progressLabel`.
  - Thêm `tieuDe` (động từ + đối tượng) và rút `actionLabel` theo mockup:

    | group | `tieuDe` | `actionLabel` |
    |---|---|---|
    | verify | `Xác minh SOS ${sg.label}` | giữ (`Tạo Case`/`Mở Case`) |
    | cause | `Xác định nguyên nhân ${skillLabel}` | giữ |
    | score | `Nhập điểm ${skills}` | `Nhập điểm` |
    | no_plan | `Đề ra PA học thuật ${kn}` | `Đề ra PA` |
    | result | `Ghi kết quả PA ${kn}` | `Ghi kết quả` |
    | decide | asked ? `Trả lời giáo viên` : `Duyệt PA học thuật ${kn}` | giữ |
    | decide_move | `Duyệt dời ${ASSESSED_SKILL_LABEL[r.skill]}` | giữ |
    | do_plan | `Làm PA: ${what}` | `Đã làm` |
    | placement | `Xếp lớp tiếp` | giữ |
    | next_step | `Ghi lộ trình tiếp theo` | giữ |
    | missing_data | `Chốt tuần MT` | giữ |
    | no_owner | `Chọn người phụ trách` | giữ |
    | mgmt | `t.title` | `Cập nhật` |

    `kn` = `caseTopicLabel(topic)` (thêm `sc.topic`/`iv.topic` vào SELECT nếu câu chưa có); không có topic → bỏ phần đuôi.
  - `placement` (:697) và `next_step` (:737) → `urgency: 'normal'` (Q11); `placement.statusLabel = 'Chờ xếp lớp'`.
  - **Nhãn đợt lớp thường (Q12):** hàm cục bộ `nhanDot(kind: string | null, no: number | null, macDinh = 'Case')` → `kind &&
    kind !== 'mock' ? ATTEMPT_KIND_SHORT[kind] : no ? \`MT${no}\` : macDinh`. Mọi `contextLabel: … \`MT${…}\`` (:516, 583, 655,
    814, 892, 951, 974, 1024) đi qua `nhanDot`; thêm `a.kind AS attempt_kind` vào SELECT :487, :619, :772, :916 (:559 dùng
    `a.kind` sẵn). Không thêm truy vấn, không truy vấn theo từng dòng.
- [ ] **3. `WorkList.tsx` — `DongViec` (:38-94) viết lại** theo mockup 17 (b3):
  ```tsx
  <div className="grid grid-cols-1 gap-x-3 gap-y-1 py-2 pr-3 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center" title={it.reason}>
    <button type="button" onClick={() => onOpen(it.href)} className="min-w-0 text-left …">
      <span className="flex items-center gap-2"><span className="truncate text-[13px] font-semibold text-slate-100">{it.tieuDe}</span>
        {it.level && <Level tone={it.level.tone}>{it.level.text}</Level>}</span>      {/* ≤ 1 badge */}
      <span className="block truncate text-[11px] text-slate-500">{dongPhu}</span>
    </button>
    <span>{loaiHan && it.due ? <Han loai={loaiHan} han={it.due} haiDong /> : it.due ? `hạn ${ngay(it.due, homNay)}` : '—'}</span>
    <span className="flex items-center justify-end gap-2">{nutPhu}{coNut ? <DongTinHieu it={it} /> :
      <button type="button" className="btn btn-sm min-h-[32px]" onClick={() => onOpen(it.href)}>{it.actionLabel}</button>}</span>
  </div>
  ```
  `dongPhu = [it.studentName, lớp (khi studentName ≠ \`Lớp ${classCode}\`), it.contextLabel, it.count > 1 ? \`${it.count} HV\` : null,
  it.owner ?? (it.ownerId === null && !it.mine && it.group !== 'placement' && it.group !== 'next_step' ? 'chưa ai phụ trách' : null)]
  .filter(Boolean).join(' · ')`. **Không** còn `Status`, `Task`, `Alert`, `Info` trên dòng (B-5). Kiểu `WorkItem` web: thêm `tieuDe`,
  bỏ `overdueLabel`. 375px: ba ô xếp dọc, nút ≥ 44px (`min-h-[44px] sm:min-h-[32px]`).
- [ ] **4. `NhomViec.tsx` (:24-76)** dùng `KhoiNhom`: `tieuDe = g.label`, `dem = g.n`, `phu = [g.quaHan ? <span className="text-late
  font-bold">⚠ {g.quaHan} quá hạn</span>, g.homNay ? <span className="text-soon">{g.homNay} hôm nay</span>, choDuyet ? \`${choDuyet}
  chờ bạn duyệt\` : null]`; thân = danh sách `DongViec` / dòng nhắc ý thức như cũ; nút "Xem thêm" giữ. Không đổi props của `NhomViec`
  (`HoTroHocVienTab.tsx:155`, `ViecCuaToi.tsx:32` không phải sửa).
- [ ] **5. Phép kiểm.** Viết lại `run.ts:3021` thành `'Việc quá hạn: tiêu đề nói việc gì, hạn nói quá hạn — không nhãn "Quá hạn …"
  riêng'`: mọi item có `tieuDe` không rỗng, `!('overdueLabel' in it)`, `reason`/`statusLabel`/`tieuDe` không khớp `/quá hạn/i`; vẫn có
  ≥ 1 item `urgency === 'overdue'` có `due`. `run.ts:3049` → `'Ghi kết quả'`. `sosV3.tests.ts:679` bỏ vế `overdueLabel === null`;
  `:688` thay `late.overdueLabel === 'Quá hạn xác định nguyên nhân' && /quá hạn/.test(late.reason)` bằng `late.urgency === 'overdue'
  && !/quá hạn/.test(late.reason) && late.tieuDe.startsWith('Xác định nguyên nhân')`. `congViec.tests.ts:466` giữ (nhãn decide
  không đổi). **+2 mới:** `UX0 · N-3: "Xếp lớp tiếp" và "Ghi lộ trình tiếp theo" không bao giờ quá hạn` (mọi manager chi nhánh);
  `UX0 · #13: việc của lớp thường ghi Giữa khoá/Cuối khoá, không "MT"` (lấy mã lớp thường bằng SELECT theo `scoring_mode = 'ratio'`
  — kiểm tên bảng/cột ở `schema.sql`; mọi item có `classCode` thuộc tập đó: `!/^MT\d/.test(contextLabel ?? '')`).
- [ ] **Xong khi:** `npm run check` = **B+7**. Commit `PR-UX0 (3): HangNhom, viec can lam gon`.

---

### Task 4: N-2 mẫu 2 + badge hộp lớp — Học viên & Lớp

**Files:** `shared/domain/hocVienLop.ts` :134-152 (chỉ `BadgeLop`/`badgeLop`), `web/src/modules/students/StudentsPage.tsx` :180-275,
`BangHocVienLop.tsx` :84-150, `web/src/modules/classes/DauTrangLop.tsx` :57-66, `hocVienLop.tests.ts` :134-140,
`lenLop.tests.ts` :156-163, `nenGiaoDien.tests.ts`.

**Interfaces:** `badgeLop(c)` — tham số `needScoresText: string | null` **thay bằng** `soBaiChoCham: number` + `needScoresTitle:
string | null`; `BadgeLop` thêm `title?: string`, `tone` thêm `'muted'`. `BangHocVienLop` trả **các `<tr>`** (không còn
`<table>`), props thêm `soCot: number`.

- [ ] **1. `badgeLop`** (Q13): `het-khoa` → `nhan: \`${canXepLop} HV chờ xếp lớp\``, `tone: 'warn'`; `cham` → `nhan: \`${soBaiChoCham}
  bài chờ chấm\``, `title: needScoresTitle`, `tone: 'warn'`; `case` → `nhan: \`${soCaseMo} Case mở\``, `tone: 'muted'`. Thứ tự, cắt
  2 badge, `an` giữ nguyên. `StudentsPage.tsx:227-232` và `DauTrangLop.tsx:57-60` truyền `soBaiChoCham: lop.needScores`,
  `needScoresTitle: needScoresText(…)`. Ánh xạ tone → `Nhan`: `danger→bad`, `warn→soon`, `info→doing`, `muted→muted`.
- [ ] **2. Một bảng (Q14).** `StudentsPage.tsx` :192-201: thay `<div className="space-y-2">{HopLop…}</div>` bằng
  `<div className="card overflow-x-auto lg:overflow-visible"><table className="w-full min-w-[780px] table-fixed text-sm">` +
  `<colgroup>` và `<thead>` **chuyển từ** `BangHocVienLop.tsx:103-117` (6 cột; tiêu đề cột thứ 3 là "Mục tiêu / Khoá" khi trang có
  cả hai loại lớp, "Khoá" khi chỉ lớp thường, "Mục tiêu" khi chỉ FT) + `{lopHien.map(c => <HopLop …/>)}` + `</table></div>`.
- [ ] **3. `HopLop` (:219-275)** trả `<tbody>`: hàng lớn `HangNhom` — `tieuDe` = link mã lớp + chữ mờ `· {chương trình} · {n} HV ·
  GVCN {tên}` (một dòng, cắt "…", `title` đủ); các ô còn lại: một `<td colSpan={4}>` chứa badge (`Nhan`, bấm được như `denBadge`
  cũ, `+n` khi có `b.an`) canh phải, và `<td>` cuối là `MenuDong`. Mở → `<BangHocVienLop … />` (các `<tr>`). Bỏ `section.card`.
- [ ] **4. `BangHocVienLop`**: mỗi học viên một `HangCon` (giữ nguyên nội dung 6 ô :120-148); lỗi/đang tải/rỗng → một `HangCon` với
  `<td colSpan={soCot}>`. `{tt.panels}` → `createPortal(tt.panels, document.body)` (Drawer vốn `fixed`). Ô "Việc tiếp theo" **không
  đổi chữ** (#14, #15 là của UX3).
- [ ] **5. Phép kiểm.** `hocVienLop.tests.ts:135-140` đổi theo tham số mới và chữ mới (`'4 HV chờ xếp lớp'`, `{ key: 'case', nhan:
  '6 Case mở', tone: 'muted' }`); `lenLop.tests.ts:156` đổi tham số (khẳng định cũ giữ). **+1 mới:** `UX0 · N-3: badge hộp lớp là
  danh từ + số, câu cũ vào tooltip` — `soBaiChoCham: 9` → `nhan === '9 bài chờ chấm'` và `title === 'Lớp còn 9 bài chưa nhập điểm'`
  (khi truyền `needScoresText('managed', 9)`); mọi `nhan` của một bộ đủ 7 badge có ≤ 3 từ không phải số, trừ `chua-lo-trinh` và
  `chang` (ghi lý do trong phép: chữ đã chốt ở PR-LT/PR-Qa).
- [ ] **Xong khi:** `npm run check` = **B+8**; trang Học viên & Lớp: tiêu đề cột một lần, mở 2 lớp vẫn thấy rõ hàng lớn/hàng con;
  375px trang không cuộn ngang (`document.documentElement.scrollWidth === innerWidth`). Commit `PR-UX0 (4): hoc vien & lop hang lon/nho`.

---

### Task 5: N-4 — `KhungPanel` + ngữ cảnh một panel + panel mẫu

**Files:** tạo `shared/domain/khoPanel.ts`, `web/src/ui/KhungPanel.tsx`; `shared/domain/index.ts`; `web/src/modules/classes/
SuaThongTinLopPanel.tsx`; `web/src/modules/dev/ThanhPhanDemo.tsx`; `nenGiaoDien.tests.ts`.

**Produces:**
```ts
// khoPanel.ts — thuần, không React
export type KhoPanel = { mo(id: string, dong: () => void): void; dong(id: string): void; dangMo(): string | null };
export function taoKhoPanel(): KhoPanel   // mo(B) khi A đang mở → gọi dong của A trước rồi ghi B; dong(A) khi B đang mở → không làm gì
```
```tsx
export function KhungPanel(p: {
  tieuDe: string; hocVien?: string | null; lop?: string | null; rong?: 'hep' | 'rong';   // 560 | 720 (sm+); < sm toàn màn
  tabs?: ReactNode; ngCanh?: ReactNode; quayLai?: { nhan: string; onClick: () => void };  // "← Case Listening" (G-8)
  chan?: { huy?: { nhan?: string; onClick: () => void }; xoa?: { onClick: () => void; nhan?: string };
           phu?: ReactNode; chinh?: ReactNode; conThieu?: string[] };
  onDong: () => void; children: ReactNode;
}): JSX.Element
export function Khoi(p: { tieuDe: string; luat?: ReactNode; children: ReactNode }): JSX.Element  // luat → <NutLuat>
export function Truong(p: { nhan: string; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string | null; as?: 'label' | 'div'; children: ReactNode }): JSX.Element
export function Hang2(p: { children: ReactNode }): JSX.Element   // grid 2 cột từ sm, 1 cột dưới sm
```

- [ ] **1. `khoPanel.ts`** + một kho dùng chung toàn web (`export const khoPanelChung = taoKhoPanel()` trong `KhungPanel.tsx`).
- [ ] **2. `KhungPanel`** (mockup 15 (1)): vỏ `fixed inset-0 z-50 flex justify-end` + nền mờ bấm để đóng; hộp `flex h-full w-full
  flex-col sm:w-[560px]` (`rong` → `sm:w-[720px]`), nền `var(--surface)`, viền trái. **Đầu** `h-[52px] flex items-center gap-2 px-4
  border-b shrink-0`: `<h2 className="text-sm font-extrabold whitespace-nowrap">{tieuDe}</h2>` + `<span className="truncate text-xs
  text-slate-400" title={…}>{[hocVien, lop].filter(Boolean).join(' · ')}</span>` + ✕ (`aria-label="Đóng"`, 44px ở 375). `quayLai` →
  dòng `← {nhan}` (link xanh) ngay dưới đầu; `tabs` dính dưới đầu; `ngCanh` một dòng `truncate`. **Thân** `flex-1 min-h-0
  overflow-y-auto overscroll-contain px-4 pb-4`. **Chân** `shrink-0 border-t px-4 py-2.5 flex items-center gap-2`: trái `huy` (mặc
  định "Huỷ" → `onDong`), `xoa` (`btn btn-danger`); `flex-1`; phải `phu` + `chinh`. `conThieu?.length` → dòng `Còn thiếu: …` canh
  phải **ngay trên chân** (caller chỉ truyền sau khi bấm Lưu/rời ô). Mở: `useEffect` → `khoPanelChung.mo(id, onDong)` (id =
  `useId()`), khoá cuộn `document.body.style.overflow = 'hidden'` (trả lại khi đóng), Esc đóng (bỏ qua nếu `e.defaultPrevented`);
  unmount → `khoPanelChung.dong(id)`. `role="dialog" aria-modal aria-label={tieuDe}`.
- [ ] **3. `Khoi`**: `pt-3.5`, khối sau có `border-t mt-3.5`; tiêu đề `text-[10px] font-extrabold uppercase tracking-[.06em]
  text-slate-500 mb-2.5` + `NutLuat`. **`Truong`**: nhãn `text-[11.5px] font-bold` ở trên, `*` đỏ khi `batBuoc`, "(không bắt buộc)"
  mờ khi `tuyChon`; `phu` một dòng `truncate text-[10.5px] text-slate-500`; `loi` (chỉ khi caller truyền) `text-[11px] text-late`.
- [ ] **4. Panel mẫu `SuaThongTinLopPanel`** (Q16): `Drawer` → `KhungPanel tieuDe="Sửa thông tin lớp" lop={lop.code}
  onDong={onClose} chan={{ chinh: <button className="btn btn-primary" …>Lưu</button>, conThieu: daBamLuu && !code.trim() ? ['Mã lớp']
  : undefined }}`; thân một `Khoi tieuDe="Thông tin lớp"` với `Truong` (Mã lớp — `phu="Ví dụ: MB-FT 101"`; Chương trình + Lộ trình
  trong `Hang2` khi FT; Ghi chú `tuyChon`). Câu dài "Lớp đã có học viên nên không đổi được chương trình…" → `Khoi luat` (G-5).
  Nút Lưu không còn `disabled` vì mã trống — bấm thì hiện "Còn thiếu: Mã lớp" (N-4). Hành vi lưu giữ nguyên.
- [ ] **5. `ThanhPhanDemo.tsx`** (`/dev/thanh-phan`, chỉ dev): thêm mục mẫu `Nhan` (7 tone + `dut`), `QuaHan`, `<Han>` 3 trạng thái,
  bảng `HangNhom/HangCon` 2 nhóm, `KhoiNhom`, nút mở `KhungPanel` hẹp + rộng và nút "mở panel thứ hai" (kiểm G-8 bằng tay).
- [ ] **Phép kiểm (+2):** `UX0 · N-4: mở panel thứ hai thì panel thứ nhất bị đóng, không bao giờ hai panel` (mở A, mở B → `dong` của A
  gọi đúng 1 lần, `dangMo() === 'B'`); `UX0 · N-4: đóng panel cũ sau khi panel mới đã mở không đóng nhầm panel mới` (`dong('A')` khi
  B mở → `dangMo() === 'B'`, `dong` của B chưa gọi).
- [ ] **Xong khi:** `npm run check` = **B+10**. Commit `PR-UX0 (5): KhungPanel + panel mau`.

---

### Task 6: Bấm thử bằng ảnh thật · tài liệu · PR

- [ ] **1. Chạy thử** (theo bộ nhớ "Máy chủ dev trong worktree"; **không** `preview_start`): DB tạm (`PISA_DB` trỏ tệp trong
  scratchpad, `npm run seed`), `vite.kiem.config.ts` tạm (port **5587**, proxy `/api` → `http://127.0.0.1:4387`, **không commit**),
  `npm run build:server && PISA_DB="$KIEM" PORT=4387 npm run dev:api` + `npx vite --config vite.kiem.config.ts`.
- [ ] **2. Ảnh thật** bằng Playwright kênh Chrome (`channel: 'chrome'`), 1440px và 375px, lưu `thiet-ke/anh/pr-ux0/`:
  | Vai | Màn | Tên ảnh | Nhìn gì |
  |---|---|---|---|
  | QL (user 2) | Công việc › Hỗ trợ học viên | `01-ho-tro-hv-{1440,375}.png` | nhóm = hàng lớn vạch trái; dòng việc thụt, nền tối; cột hạn thẳng 150px; "⚠ quá hạn n ngày" đỏ không nền; ≤ 1 badge/dòng |
  | GVCN (user 7) | Tổng quan › Việc cần làm của tôi | `02-viec-can-lam-{1440,375}.png` | như trên; lớp thường ghi "Giữa khoá" |
  | GVBM (user 9) | Học viên & Lớp (mở 2 lớp) | `03-hoc-vien-lop-{1440,375}.png` | tiêu đề cột một lần; hàng lớp A; "9 bài chờ chấm", "3 Case mở" xám; 375 cuộn trong thẻ |
  | QL (user 2) | Hồ sơ lớp › ⋮ › Sửa thông tin lớp | `04-panel-mau-{1440,375}.png` | 560px; 375 toàn màn; chân dính; bấm Lưu khi trống → "Còn thiếu: Mã lớp" |
  | QL (user 2) | `/dev/thanh-phan` | `05-thanh-phan.png` | 7 tone `Nhan` rõ; mở panel thứ hai → panel đầu biến mất |
  | GVBM (user 9) | Hồ sơ HV có SOS (bất kỳ) | `06-ho-so-hv-mau.png` | chỉ kiểm màu mới không làm vỡ màn của UX3 (không sửa) |
  Sau mỗi ảnh ở 375px: `document.documentElement.scrollWidth === window.innerWidth`. Lỗi hình → sửa trong phạm vi file của PR này,
  chạy lại `npm run check`, chụp lại. Lỗi ở file PR khác → ghi vào mục "Chuyển cho PR sau".
- [ ] **3.** `CODE_MAP.md`: mục `web/src/ui` thêm `Nhan.tsx`, `HangNhom.tsx`, `KhungPanel.tsx` (một dòng mỗi file, tên export); mục
  `shared/domain` thêm `mauNghia.ts`, `khoPanel.ts`; ghi "token màu nghĩa: `web/src/index.css :root` — một chỗ".
- [ ] **4.** Kiểm ranh giới: `git diff origin/main...HEAD --stat` — không file nào trong "File KHÔNG được chạm"; `-- server/src/schema.sql
  server/src/migrate.ts` rỗng. Tắt API 4387 + Vite 5587, xoá `vite.kiem.config.ts` và DB tạm; quét tiến trình `node` còn treo của
  worktree (bộ nhớ "npm run check treo khi chạy chồng") và tắt.
- [ ] **5.** `git fetch origin` → rebase lên `origin/main` nếu đã có PR mới (Z2c-c); `npm run check` lần cuối (**B+10** cộng phép của
  PR mới merge). Push, mở PR "PR-UX0 · Nền giao diện" (thân: Goal, bảng Q, ảnh, danh sách tên component/token cho UX1–UX5, mục
  "Chuyển cho PR sau"), báo planning đường dẫn PR + số phép.

---

## Chuyển cho PR sau (8 chỗ hàng mở rộng còn lại + badge — dùng `HangNhom`/`HangCon`/`KhoiNhom`, `Nhan`, `QuaHan`)

| # | Màn · file | Cha → con | PR áp |
|---|---|---|---|
| 1 | Test › Lịch Test — hàng lớp (mới) | lớp → HV có điểm | **UX1** |
| 2 | Phân tích › Tổng hợp Test + SOS · `phanTich/TongHopTestSos.tsx:115-133, 199-203` | tuần → lớp · lớp → đợt | **UX4** |
| 3 | Tổng quan QL › BranchPulse · `worklist/BranchPulse.tsx:90-114` | chi nhánh → lớp | **UX4** |
| 4 | Phân tích › Vấn đề HV (→ "Tổng hợp vấn đề HV") · `phanTich/VanDeHocVien.tsx:98-133` | kỹ năng → loại lỗi | **UX4** |
| 5 | Hồ sơ lớp › Phân tích lớp · `classes/PhanTichLopTab.tsx:40-62` | môn → bảng lỗi (chỉ hàng cha) | **UX4** |
| 6 | Hồ sơ HV › Học thuật · `cases/SkillBoard.tsx:161-245, 278-321` | kỹ năng → Case → PA (PA mở ngăn Case) | **UX3** |
| 7 | Ý thức theo HV · `yThuc/ClassYThucCard.tsx:238-275` | HV → vi phạm (bỏ chữ "Mở/Đóng") | **UX3** |
| 8 | Phối hợp SOS · `yThuc/PhoiHopSosSection.tsx:66-105` + `ui/DongThoiGian.tsx:76-95` | lượt SOS → việc | **UX3** |

Badge mockup 17 (b2) **UX0 đã làm**: #1–#8, #10–#13 (gốc `display.ts`/`mywork.ts`/`DongViec`), #16–#18 (`badgeLop`), #26 (`Alert`).
**Còn lại cho UX3:** #1 phần `SkillBoard.tsx:654` (hạn thực hiện PA đặt dưới nhãn cập nhật), #9 (mô tả dài → tooltip ở chỗ khác
Việc cần làm), #14–#15 (`hocVienLop.ts:241-256` `viecTiepTheo`: "Ghi kết quả L" + hạn, "Đề ra PA R"), #19 (`display.ts:186` +
`ui/KetQuaDot.tsx:47` SOS tạm thời viền đứt), #20–#22 (`hoSoHocVien.ts:69,77-81`, `SkillBoard.tsx:185-223`, `profile.ts:469-479`,
`StudentDetailPage.tsx:453-455`), #24 (ý thức: bỏ ⚠ nhắc mềm — `Alert` tự hết ⚠ nhưng chữ "⚠" viết tay ở `yThuc.ts:231,237`,
`StudentYThucSection.tsx:122,125`, `board.ts:88`, `HangTab.tsx:24` còn), #25 (`SkillBoard.tsx:599`, `CasePanel.tsx:573` "ghi trễ n
ngày"), `CasePanel.tsx:431` nên đổi sang `<QuaHan>`. **UX5:** #23 (`hanhTrinh.ts:160`, `HanhTrinh.tsx:337`).
Panel (N-4) **UX3** chuyển sang `KhungPanel`: Tạo Case (+ nhập bù), Thẻ Case, Ghi kết quả PA, Điều chỉnh/Thay PA, Ghi nhận vi
phạm, PA xử lý, Chuyển lớp một em, Lộ trình tiếp theo, Sửa phân công GV, Thêm HV hàng loạt (`rong`).

## Nhật ký

| Ngày | Task | Ghi |
|---|---|---|
