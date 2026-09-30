# PR-HVL · Học viên & Lớp + hồ sơ lớp — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Trang **Học viên & Lớp** đọc được trong 5 giây: cột Kết quả gần nhất **hai dòng, không "…"** (FT `MT3 · kỳ vọng 7.0 · 3/4 kỹ năng
có điểm` / `Không đạt: L R W`; lớp thường `%` hoặc `n/4 môn đạt`, **không SOS**), cột **Việc tiếp theo** biết mọi việc mới (Xác nhận nguyên
nhân, Xác nhận PA, Ghi kết quả PA/cuối, Xử lý vi phạm, Nhập điểm) và **bấm được**, chip lọc theo việc thật (`Cần làm · Chờ duyệt`), công tắc
`Tất cả · Fast Track · Lớp thường`, badge lớp theo vai (bỏ "Case mở", "+n" bấm được). **Hồ sơ lớp**: chế độ **Cần hỗ trợ** thành khối **mỗi em
một hàng mỗi kỹ năng** (M4), **Phân tích lớp** mở một kỹ năng ra **hai bảng nhỏ** Vấn đề + Hiệu quả PA (M5), đầu trang có **một nút chính theo
chặng**, panel Lộ trình tiếp theo / Chuyển tiếp lớp hiện kết quả của em (B9). Dưới 640 px mọi bảng của hai trang thành **thẻ** (D2).
**Architecture:** Luật thuần ở `shared/domain/hocVienLop.ts` (viết lại `ketQuaGanNhat`, `badgeLop`, chip; hàm mới `viecTiepCuaEm`,
`tachViecChung`, `hangCanHoTro`, `nutChinhDauTrang`). Máy chủ: **một** hàm lô `chiTietCaseMo(cases)` (`server/src/cases/caseLop.ts` mới) dựng
trạng thái v4 + việc tiếp + PA của mọi Case mở bằng số câu SQL cố định (thêm `sosCaseStateMany` ở `sosState.ts`) — dùng cho roster, trang
Học viên & Lớp và route mới `GET /classes/:id/can-ho-tro`. Phân tích lớp mở rộng `issueBoard` (`effectiveness.ts`) chứ không viết hàm đếm thứ hai.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); `npm run check` (`server/src/tests/*`).
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §4.4 **YC-11.2, YC-11.3.1, YC-11.3.3** · §3.2 **T18, T19** (+ T17 đã
xong, T58 phần cột/chip, T53 Q5, T60) · §5.7 MH2–MH5 · §7.3, §7.5, §7.6 · §8 dòng PR-HVL · §9 UX-B **B4, B8, B9**, UX-D **D2**, UX-E **E7** (§9 giao
E7 cho PR-HVL) · §10 · mockup **M3, M4, M5** `thiet-ke/mockup/19-nang-cap-27-09.html:315-465` (+ mockup 15-panel-hv-lop, 17-hang-va-badge làm nền) ·
kế hoạch UX 26/09 `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` dòng 64, 68, 69, 105, 128 · báo cáo rà `thiet-ke/ra-27-09/K2.md` **K2-01,
02, 03, 04, 06, 11, 13, 14, 22, 23, 31, 36, 37, 40, 42** + §3 bảng tầng 1 · "Chuyển cho PR-HVL" trong kế hoạch PR-NEN (NhanTrangThai), PR-DUYET
(badge chờ duyệt), PR-MON (công tắc khung, dòng "Cả bài"), PR-MT (Sắp tới), PR-SOS + PR-YT4 (việc tiếp theo) · `docs/superpowers/specs/2026-09-29-viec-nho-sau-ra-dot-2.md` (rà #119: điểm MT lịch sử).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-HVL** · đợt 4 · làn **B** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-hvl-hoc-vien-lop` · `.claude/worktrees/pr-hvl-hoc-vien-lop` (từ `origin/main` mới nhất, đã có PR-S3F `507abc2`) |
| Cổng thử | API **4167** · Vite **5367** (không dùng 4000/5173; A PR-HSM 4157/5357 · C PR-XUAT 4177/5377 chạy song song) |
| Model | **Sonnet 5 · High** · phương án B: **Fable 5.1 · High**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng (T52) — rà **gọn** (không migrate, không quyền mới), rà một lượt cuối đợt 4 (bộ nhớ "Rà PR theo đợt") |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Không.** Mọi số đọc từ bảng có sẵn (`sos_cases`, `case_interventions`, `case_issues`, `case_milestones`, `yeu_cau_duyet`, `assessment_attempts`) |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR giao diện). impeccable: **`clarify`** Task 4 (chữ cột, chip, badge, việc) · **`layout`** Task 5, 6, 7 (M4, M5, đầu trang — §7.2) · **`adapt`** Task 9 (D2, 375 px) · **`harden`** Task 5 (Case lạ: không kỹ năng, bàn giao, 2 Case cùng kỹ năng, lớp rỗng) · **`audit`** rồi **`polish`** Task 11. Không `init`/`document`/`hooks on`/`npx impeccable install\|update`. Trước PR: `/ponytail-review` |
| Phụ thuộc | Đã merge: **PR-YT4 #128** (tab Ý thức lớp, `nhanNhomEm`, `trangThaiYThuc`), **PR-SOS #127** (`viecTiepCuaCase`, `trangThaiCaseV4`, `NganCase`), **PR-MON #118** (`tenMon/tenMonNgan`, `CongTacKhung`, `checkpoints`), **PR-MT #119** (`mocKeTiep`, `MOC_KE_TIEP_SQL`), **PR-DUYET #117** (`yeu_cau_duyet.lop_id`). Không chờ HSM/XUAT |
| Không làm | Nhãn SOS lớp thường **ngoài** cột Kết quả + chip của trang này, hướng gợi ý theo dải % (`→ học lại`…), dòng "chờ QL quyết 50–59%", luật M1b (tự tạo bài lớp thường) — **PR-LT2a/b** · tách "PA theo quy chế / PA GV thêm" ở Hiệu quả PA (T61) — **PR-Pb2** · Ý thức lớp (M6 — đã xong PR-YT4) · xuất Excel ở ⋮ hồ sơ lớp (**PR-XUAT**) · sáng/tối, font (**PR-SANG**) · mẫu thẻ cho các bảng ngoài hai trang này (D1, D3…D9 — **PR-UXD**) · đổi chữ "Đề ra PA" toàn web (Q5 → PR-S3) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy nền,
  không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-HVL (n): …`. Sập segfault (mã 139) → chạy lại **một** lần (bộ nhớ
  "npm check sập segfault"); đỏ lần hai mới là lỗi thật.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 11 (Playwright kênh Chrome, đăng nhập demo `POST /api/demo/session
  {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang id 9** · GVCN lớp thường: tài
  khoản `GVCN_THUONG` của `tocDoDuong.ts`), ảnh trước (main) / sau lưu `thiet-ke/anh/pr-hvl/`. Chạy song song: `PORT=4167` cho API, Vite tạm cổng
  5367 trỏ proxy về 4167 (bộ nhớ "Máy chủ dev trong worktree").
- Không chạm Turso, không deploy; chỉ DB demo trong worktree. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước khi báo xong:
  tắt 4167/5367, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Chồng file với PR cùng đợt (HSM làn A · XUAT làn C · SANG chạy sau cùng)

Trước Task 11: `git fetch origin && git rebase origin/main`. PR nào merge trước thì PR sau gỡ theo bảng:

| File | PR khác (dự kiến) sửa gì | PR-HVL chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `web/src/modules/classes/DauTrangLop.tsx` | **XUAT**: thêm mục "Xuất Excel" vào ⋮ (T40) · **SANG**: màu/chữ | Task 7 dựng lại khối nút + `menu` | HVL giữ bố cục mới; mục "Xuất Excel" chép vào mảng `menu` (sau "Sửa thông tin lớp", trước đường kẻ Xoá/Kết thúc) |
| `server/src/routes/index.ts` | HSM (nhận xét, GV chấm), XUAT (route xuất) | 2 route mới **ngay sau** `/classes/:id/phan-tich-lop` (`/can-ho-tro`, `/issue-board/o`) + thân `/classes/:id/progress` GET (1 trường) | khác khối — giữ tất cả |
| `server/src/tests/run.ts` · `server/src/seed/seed.ts` · `shared/domain/index.ts` | mỗi PR một dòng | **một** dòng `runPrHvlTests` cuối file · **một** lời gọi `buildHvlDemo` sau `buildXlmtDemo` · `export * from './hocVienLop.ts'` đã có (không thêm) | giữ mọi dòng, thứ tự theo merge |
| `server/src/tests/tocDoDuong.ts` | HSM/XUAT thêm đường + trần | dòng đo mới (Task 3, 5, 6) + trần đã đo | giữ cả hai; trần của đường chung lấy số lớn hơn **có lý do** |
| `web/src/ui/CongTacKhung.tsx` | XUAT có thể thêm giá trị `Trang` | thêm `'hoc-vien-lop'` vào union `Trang` | giữ cả hai giá trị |
| `web/src/modules/students/ClassRoster.tsx` · `BangDiemLopThuong.tsx` · `web/src/ui/ViecTiep.tsx` · `Nhan.tsx` | **SANG** đổi màu cứng → token | nội dung Task 4, 8, 9 | SANG chạy **sau** HVL → SANG rebase lên HVL |
| `web/src/modules/cases/SkillBoard.tsx` | (không PR đợt 4 nào) | chỉ `export` hàm `TenCase` (1 từ) | — |
| `web/src/modules/fasttrack/MockDetailPage.tsx`, `web/src/modules/cham/*`, `server/src/fasttrack/attempts.ts` | **HSM** | **không chạm** | — |
| `CODE_MAP.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `DEMO.md`, `plan.md`, Rulebook | mọi PR | chỉ thêm dòng | giữ cả hai |

Kế hoạch PR-HSM/XUAT/SANG soạn song song với kế hoạch này: session code mở hai kế hoạch đó (nếu đã có trên `main`/nhánh kế hoạch) ở Task 0 và
ghi vào Nhật ký mọi file chồng **khác** bảng trên; thấy PR kia sửa đúng dòng "chỉ HVL" → dừng, báo planning.

## Global Constraints

- **Một nguồn việc tiếp theo:** chữ + hạn + đích của mọi việc ở cột Việc tiếp theo (Học viên & Lớp), cột Theo dõi (bảng điểm FT) và cột Việc
  tiếp (Cần hỗ trợ) đi qua **`viecTiepCuaEm`** (Task 1), việc của **một Case** lấy **nguyên** `viecTiepCuaCase` (`shared/domain/sosV4.ts:87`) —
  không viết luật thứ tư. Xoá `viecTiepTheoCua` (`hocVienLop.ts:273-319`); phép kiểm cũ gọi nó **sửa sang hàm mới, giữ ý kiểm** (không xoá).
- **Một nguồn trạng thái Case:** `trangThaiCaseV4` + `NhanTrangThai` (§7.3). Không tự viết "Chưa có PA học thuật" / "Đang theo dõi" kiểu khung.
- **Tên môn** luôn qua `tenMon/tenMonNgan(ct, k)`; tuần qua `tuanLich()`, ngày qua `ngay()`, hạn qua `deadlineView`/`<Han>` (hạn Ghi kết quả PA
  = **"hạn hết T2 dd/mm"**, R-PA3 — K2-37). Không lộ mã (`writing1`, `no_plan`, `LT1` trần không tooltip), không ngày ISO. Viết đủ "Quản lý".
- **BẪY TURSO:** chỉ tham số `?` / `?1` — **cấm** tham số đặt tên `{ x }` cho `@x` (`db.ts` đã chặn); `IN (…)` dựng `?` theo số phần tử, lô 400;
  `UNION ALL` **≤ 20 vế** mỗi câu; **không N+1** — mọi thứ theo Case/em/lớp đọc **theo lô**. Phép kiểm đếm câu (`soCauSql()` của
  `platform/nguCanhRequest.ts`) + dòng mới ở `tocDoDuong.ts` cho mỗi route mới/đổi. Trần: `/hoc-vien-lop` ≤ **mốc + 12**, `/classes/:id/roster`
  ≤ **mốc + 6**, `/classes/:id/can-ho-tro` ≤ **`/cases?classId=` + 8** — vượt là 🛑 (ghi số đo cạnh trần).
- **Quyền:** route mới gọi `require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId })` như `phanTichLop`; Case lấy qua `listCases(p, { classId })` (đã lọc
  phạm vi) — không đọc `sos_cases` trần ở route. Nút nào chỉ hiện khi cờ `viewer` máy chủ cho phép (Q9 cũ).
- **Tinh tế (chủ sản phẩm):** dấu ✓/▾ nhỏ gọn (SVG hoặc ký tự đã dùng — bẫy ký tự nhỏ Inter), **số căn phải + `tabular-nums`**, `colgroup`
  độ rộng cột ổn định, dòng phụ dưới tên **không dồn chữ** (tối đa 2 dòng, mỗi dòng một ý, không "…" ở cột Kết quả). Màu chỉ qua token/lớp có
  sẵn (`text-bad`, `var(--line)`, `Level`, `Nhan`, `NhanTrangThai`) — **không** thêm hex/rgba mới (để PR-SANG đổi một chỗ).
- **Mỗi thành phần mới ghi "Nằm ở"** (khu vực → trang → nút) trong chú thích đầu component và trong mô tả PR.
- **Tầng 1 (§7.5)** ghi trong mô tả PR: Học viên & Lớp → *mức SOS (FT) / % (lớp thường) + việc tiếp theo*; Cần hỗ trợ → *việc tiếp + hạn từng
  Case*; Phân tích lớp → *kỹ năng/môn tệ nhất (n/N)*; đầu hồ sơ lớp → *chặng + một nút*.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web). Chú thích `ponytail:` được phép — liệt kê trong mô tả PR.

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. Ba chỗ **dễ sai nhất** có mã mẫu trong Task: `chiTietCaseMo` (Task 2 — một câu mỗi bảng theo lô, **không** gọi `sosCaseState(id)` hay
   `mtKeTheoPa(id)` trong vòng lặp), `hangCanHoTro` (Task 1 — số hàng theo **chương trình**, không cứng 4), `viecTiepCuaEm` (Task 1 — gọi
   `viecTiepCuaCase`, chỉ **rút gọn chữ**, không đổi thứ tự luật SOS).
2. Không đổi `sosV4.ts`, `listCases`, `planOutcomes`, luật SOS/Ý thức. Chỉ **đọc** chúng.
3. 🛑 **Dừng hỏi planning** nếu: (a) cần cột/bảng mới (kế hoạch **không migrate**); (b) trần `tocDoDuong.ts` vượt mức ở Global Constraints;
   (c) phép kiểm cũ phải **xoá** (sửa chữ mong đợi theo T18/T58/K2-06 là **được**, ghi Nhật ký từng phép); (d) số ở Phân tích lớp ≠ Phân tích ›
   Hiệu quả PA trên cùng lớp (Task 6) mà không giải thích được bằng khung thời gian; (e) sau rebase thấy PR khác sửa dòng "chỉ HVL".
   Không chạy lệnh nào có biến Turso.

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-hvl-hoc-vien-lop -b pr-hvl-hoc-vien-lop origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch> -- docs/superpowers/plans/2026-09-29-pr-hvl-hoc-vien-lop.md`.
- [ ] Nhật ký: PR-HSM / PR-XUAT đã merge chưa; kế hoạch của hai PR đó (và PR-SANG) có file nào chồng **ngoài** bảng "Chồng file".
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm) + số câu SQL hiện tại của `/hoc-vien-lop`, `/classes/3/roster`,
  `/cases?classId=3`, `/classes/3/phan-tich-lop`, `/classes/3/issue-board?category=listening` (bảng `TRAN`, `tocDoDuong.ts:309-335`).
- [ ] Đối chiếu (grep): `export function ketQuaGanNhat` (hocVienLop.ts:104), `export function badgeLop` (:163), `export function viecTiepTheoCua`
  (:273), `export function chonCaseChinh` (:322), `viecTiepTheo: viecTiepTheoCua(` (classes.ts:632), `export function danhSachHocVienLop`
  (server/src/classes/hocVienLop.ts:44), `export function caseMoTheoHocVien` (dongHocVien.ts:37), `export function sosCaseState` (sosState.ts:75),
  `function caseCardOf` (cases.ts:2475), `export function issueBoard` (effectiveness.ts:403), `export function phanTichLop` (phanTichLop.ts:27),
  `function FollowCell` (ClassRoster.tsx:283), `export function BangCanHoTro` (BangCanHoTro.tsx:22). Lệch > 20 dòng → ghi "dòng thật" vào Nhật ký.
- [ ] Liệt kê phép kiểm cũ phải sửa chữ mong đợi (không xoá): `hocVienLop.tests.ts:106-122, 135-139, 181, 197, 279, 290` · `panelUx3.tests.ts:95-140,
  316-330` · `suaLoiNong.tests.ts:154-166` · `lenLop.tests.ts:153-160` · `nenGiaoDien.tests.ts:125` · `prMon.tests.ts:360` + phép kiểm **đọc nguồn** trong
  `hanhTrinh/hocVienLop/panelUx3/prLop/suaLoiNong/thanhPhanChung.tests.ts` nhắc file giao diện của PR này (grep tên file).
- [ ] Commit `PR-HVL (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần (T18, T19, T58 phần cột, K2-01/02/03/04/06/14/36/42, B4, B8, E7)

**Files:** sửa `shared/domain/hocVienLop.ts`; tạo `server/src/tests/prHvl.tests.ts` (`runPrHvlTests`, đăng ký **cuối** `run.ts`).

- [ ] **`ketQuaGanNhat` hai dòng (T18, K2-01, T58, E7).** Bỏ `phu`/`catDongPhu` ở hàm này (xoá `catDongPhu`, `DONG_PHU_TOI_DA` nếu hết nơi dùng).
  Thêm `attemptKind?: string | null` vào `KetQuaVao` (Standing đã có). Hình dạng mới:
```ts
export type KetQuaHien = {
  chinh: string;                 // tầng 1: "6.0" · "58%" · "3/4 môn đạt" · "—"
  lech: string | null;           // E7: "−0.5" (tooltip "Dưới kỳ vọng 0.5") — thay "Thiếu 0.5", tránh trùng "Thiếu 2 thông tin"
  dat: boolean; sos: string | null; sosTamThoi?: boolean;
  dong1: string | null;          // "MT3 · kỳ vọng 7.0 · 3/4 kỹ năng có điểm" | "Cuối khoá · 2/4 môn có điểm" | "Chưa có kết quả"
  dong2: string | null;          // "Không đạt: L R W" | "Không đạt: L G+V" | null
};
// FT: dong1 = [label, expectation != null ? `kỳ vọng ${band1(e)}` : null, scored < required ? `${scored}/${required} kỹ năng có điểm` : null]
//     dong2 = belowSkills.length ? `Không đạt: ${belowSkills.map((b) => skillShort(b.skill)).join(' ')}` : null
// Lớp thường (T58: sos LUÔN null): chinh = (attemptKind === 'final' || khongChiaMon) && tyLeTong != null ? `${Math.round(tyLeTong * 100)}%`
//     : khongChiaMon ? '—' : `${scored - (failed ?? 0)}/${scored < required ? scored : required} môn đạt`
//     dong1 = scored < required ? `${label} · ${scored}/${required} môn có điểm` : label
//     dong2 = khongChiaMon ? null : failedSkills.length ? `Không đạt: ${failedSkills.map((f) => tenMonNgan(ct, f.skill)).join(' ')}` : null
```
  Phép kiểm: FT đủ / thiếu điểm / KCK (không "kỳ vọng", `sos` null) · FOU Giữa khoá `3/4 môn đạt` + `Không đạt: G+V` · BE Cuối khoá đủ `58%` ·
  Pre FOU `64%` không dòng 2 · mọi chuỗi **không chứa "…"**, lớp thường không chứa "SOS" · chưa có → `dong1 'Chưa có kết quả'`.
- [ ] **Chip (K2-02, K2-03).** `LOC_HOC_VIEN = ['tat-ca', 'can-lam', 'cho-duyet', 'sos', 'thieu_tt']`; nhãn `Tất cả · Cần làm · Chờ duyệt · Đang SOS
  · Thiếu thông tin`; gợi ý: "Có việc quá hạn hoặc việc hạn ngắn (xác nhận, xử lý vi phạm)" · "Có yêu cầu đang chờ Quản lý duyệt" · "Chỉ Fast
  Track: Mock gần nhất ở mức SOS 1–3" (Q2, Q3). `docThamSoLoc`: `case_working | case_no_plan | case_overdue` → `can-lam` (link cũ của BranchPulse,
  WeeklyBoard, signals.ts không vỡ); `sos`, `sos_open` → `sos`. Thêm `demLoc(hocVien, khung)` — **một** hàm đếm cho máy chủ và web.
- [ ] **`badgeLop` theo vai (B4, K2-06, T53 Q5).** Vào thêm `vai: 'gv' | 'ql'`, `soChoDuyet`, `soEmQuaHan`; bỏ `soCaseMo` + key `case`; gộp `het-khoa`
  + `chua-lo-trinh` thành `xep-lop` (`{n} HV cần xếp lớp tiếp`, n = `needsPlacement ? canXepLop : soChuaLoTrinhTiep`, title nói rõ hết khoá / chưa
  có lộ trình tiếp theo). Thứ tự **GV**: `cham · qua-han · chang · thieu-gv · thieu-tt · xep-lop · cho-duyet`; **QL**: `cho-duyet · xep-lop · cham ·
  qua-han · thieu-gv · chang · thieu-tt`. `qua-han` tone `danger` ("{n} HV quá hạn việc"), `cho-duyet` tone `info` ("{n} chờ duyệt"). `hien` 2, `an` còn lại.
- [ ] **`viecTiepCuaEm` (K2-04, B8) — thay `viecTiepTheoCua`.** Mỗi việc có `dich` để web dựng link:
```ts
export type DichViec = { loai: 'nhap-diem' } | { loai: 'y-thuc' } | { loai: 'case'; caseId: number; paId?: number; ghiKetQua?: boolean };
export type ViecTiepTheo = { viec: string; han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info'; title: string; dich: DichViec };
export type CaseViec = { caseId: number; topic: string | null; viecTiep: ViecTiepCase | null };
const RUT_GON = ['Xác nhận PA', 'Ghi kết quả cuối', 'Ghi kết quả PA'];            // bỏ tên PA dài, giữ động từ
export function viecTiepCuaEm(i: { nhapDiem: /* như cũ */ | null; cases: readonly CaseViec[]; yThuc: NhanYThucEm | null; homNay: string; chuongTrinh?: string | null }): ViecTiepTheo[]
// nhập điểm: giữ nguyên luật A6 cũ (deadlineView 'nhap-diem'), dich { loai: 'nhap-diem' }
// Case: v = c.viecTiep (null → bỏ). dongTu = RUT_GON.find((x) => v.chu.startsWith(x)) ?? v.chu; kn = c.topic ? tenMonNgan(ct, c.topic) : 'Case'
//   'Chờ Quản lý duyệt · không theo dõi' → `Chờ Quản lý duyệt ${kn}`, tone 'info', không hạn
//   v.loaiHan && v.han → deadlineView({ kind: v.loaiHan, due: v.han, today }): quá hạn → 'danger'; loaiHan 'xac-minh-sos' → 'warn'; còn lại 'info'
//   title = `${v.chu} · ${tenMon(ct, c.topic)} · ${hạn đầy đủ}`; dich { loai: 'case', caseId, paId: v.paId, ghiKetQua: dongTu.startsWith('Ghi kết quả') }
// Ý thức: nhom 'qua_han' → `Xử lý vi phạm` 'danger' (quaHanNgay); 'bat_buoc' → 'warn' + hạn (kind 'xu-ly-vi-pham'); dich { loai: 'y-thuc' }
// Xếp ổn định: danger → warn → info (giữ thứ tự vào khi cùng tone).
```
  `tachViecChung(dong: { id: number; viec: ViecTiepTheo[] }[])` → `{ chung: { viec: ViecTiepTheo; soEm: number } | null; conLai: Map<number, ViecTiepTheo[]> }`:
  việc `nhap-diem` **trùng chữ** ở ≥ 2 em → một dòng "Cả lớp" (Q6), bỏ khỏi dòng từng em. Phép kiểm: 4 em cùng "Nhập điểm L, R · Cuối khoá" →
  `chung.soEm = 4`; 1 em → không gộp.
- [ ] **`hangCanHoTro` (T19, K2-36, K2-42).** Số hàng theo **chương trình**: FT `L · R · W (dòng con W1, W2) · S`; BE/ELE `L · R · W · S`; FOU `L · R · G+V ·
  P` (tên qua `tenMonNgan`); Pre FOU **một** hàng "Tổng hợp"; hàng **"Chung"** chỉ khi có Case không gắn kỹ năng (hoặc kỹ năng ngoài bộ môn). Case
  `writing` bàn giao sang lớp FT nằm ở hàng W (nhãn "từ {mã lớp cũ}" máy chủ gửi). Mỗi hàng: mọi Case mở, xếp quá hạn → mức SOS → id; `hien` ≤ 2,
  `them` = số còn lại ("+n Case" bấm mở). Hai hàng rỗng **liền nhau** gộp thành dòng mờ `Không có Case: R · W`. `chiKyNang: string[] | null` (công tắc
  "Chỉ kỹ năng tôi dạy") giữ hàng có kỹ năng trong danh sách (W1/W2 giữ hàng W); hàng "Chung" luôn giữ. Kèm `sapEmCanHoTro` — em có Case quá hạn lên
  đầu, rồi theo tên (`localeCompare('vi')`). Phép kiểm: 5 tình huống K2-36 (2 Case cùng R; Case chung; FOU; Pre FOU 1 hàng; lọc chỉ W1 → còn W + Chung) + gộp rỗng.
- [ ] **`nutChinhDauTrang` (K2-14).** Vào `{ thuong, phase, needsPlacement, soHocVien, coTheThemHv, coTheNhapDiem, coTheChuyenTiep, soEmChuyen }` →
  `{ loai: 'them-hv' | 'chuyen-tiep' | 'nhap-diem' | null; nhan }`: lớp rỗng + thêm được → `+ Học viên`; lớp thường `final_week`/`finished`/cần xếp lớp +
  chuyển tiếp được → `Chuyển tiếp lớp · {n} em`; nhập điểm được → `Nhập điểm Test`; còn lại `null`.
- [ ] `npm run check` → commit `PR-HVL (1): luật thuần Học viên & Lớp — kết quả hai dòng, việc tiếp chung, badge theo vai, Cần hỗ trợ theo kỹ năng`.

## Task 2 · Máy chủ: Case mở theo lô + roster (K2-04, K2-11, rà #119, K2-31)

**Files:** sửa `server/src/cases/sosState.ts`; tạo `server/src/cases/caseLop.ts`; sửa `server/src/classes/dongHocVien.ts`, `server/src/classes/classes.ts`
(`classRoster`), `server/src/students/standing.ts`.

- [ ] `sosState.ts`: `sosCaseStateMany(ids): Map<number, SosCaseState>` — **đúng câu SELECT** của `sosCaseState` với `sc.id IN (…)` (lô 400);
  `sosCaseState(id)` thành `sosCaseStateMany([id]).get(id) ?? empty` (một định nghĩa).
- [ ] `caseLop.ts` — **một** hàm chi tiết Case mở, số câu cố định bất kể số Case:
```ts
export type CaseChiTiet = {
  id: number; studentId: number; topic: string | null; tieuDe: string;          // tenCaseSos(...) nếu Case SOS, không thì MappedCase.title
  nguyenNhan: string | null; urgency: string | null; moTu: string;              // issueLabel(lỗi chính) · mức gấp · ngày mở (detectedAt)
  trangThai: ReturnType<typeof trangThaiCaseV4>; viecTiep: ViecTiepCase | null; quaHan: boolean;
  pas: { id: number; ten: string; loai: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; nguoi: string | null; mocChu: string | null }[];
  banGiaoTu: string | null;                                                      // mã lớp cũ khi classId (lúc đánh giá) ≠ homeClassId
};
export function chiTietCaseMo(cases: readonly MappedCase[]): Map<number, CaseChiTiet>
// Lô 400, MỖI BẢNG MỘT CÂU: sosCaseStateMany · case_interventions (status != 'cancelled') LEFT JOIN users (performer) · case_issues role='primary'
// · case_milestones kind IN ('opened','repeat') (thay mtKeTheoPa(caseId): milestone gần nhất trước iv.created_at, +1).
// v4 + pas → trangThaiCaseV4 / viecTiepCuaCase y như caseDetail (cases.ts:1636-1650) — KHÔNG viết lại luật.
// quaHan = viecTiep?.han != null && viecTiep.han < demoToday().
```
- [ ] `dongHocVien.ts`: `caseMoTheoHocVien` → `caseViecTheoHocVien(p, classId): Map<number, CaseViec[]>` (`listCases(p, { classId })` → Case chưa xong →
  `chiTietCaseMo`). `classes.ts:632`: `viecTiepTheo: viecTiepCuaEm({ nhapDiem: …giữ nguyên…, cases: caseViec.get(s.id) ?? [], yThuc: canhBao.get(s.id) ?? null, … })`.
- [ ] `classes.ts` `history` (:547-559) thêm `lichSu: t.lichSu` (rà #119). `standing.ts`: thêm `nextWeekStart` (= `moc.weekStart`, cạnh `nextAttemptNo`
  :214-218) cho cột Sắp tới — **không** đổi `mocKeTiep` (K2-31 xong ở PR-MT).
- [ ] Phép kiểm: `sosCaseStateMany` = `sosCaseState` từng id trên mọi Case demo · em có Case "Chờ xác nhận nguyên nhân" → việc `Xác nhận nguyên nhân L`
  tone warn, dich case · em Ý thức bắt buộc → `Xử lý vi phạm` · **đếm câu**: roster lớp demo trước/sau khi thêm 10 Case chênh ≤ 1 câu ·
  `history[i].lichSu` đúng cờ. Trần `/classes/{lopFT}/roster` ≤ mốc + 6.
- [ ] `npm run check` → commit `PR-HVL (2): Case mở theo lô (trạng thái v4, việc tiếp, PA) cho roster; điểm MT lịch sử có cờ`.

## Task 3 · Máy chủ trang Học viên & Lớp: chip, khung, badge (K2-02, K2-03, K2-06)

**Files:** sửa `server/src/classes/hocVienLop.ts`, `server/src/classes/classes.ts` (`classOverview` — badge đầu trang dùng cùng số).

- [ ] Sau `allCases` (:141): `chiTietCaseMo(allCases chưa xong của em đang học)`; Ý thức: `trangThaiYThuc(id em)` **một** lần, chỉ lớp người xem có
  `STUDENT_VIEW` (cùng luật `canhBaoTheoHocVien`), bỏ em Tạm dừng (PR-S3F #12); chờ duyệt: **một** câu `SELECT hoc_vien_id, lop_id FROM yeu_cau_duyet
  WHERE trang_thai = 'cho' AND (hoc_vien_id IN (…) OR lop_id IN (…))`.
- [ ] Cờ từng em: `sos` **chỉ lớp FT** · `can-lam` khi `viecTiepCuaEm({ nhapDiem: null, cases, yThuc })` có tone `danger`/`warn` · `cho-duyet` khi em có yêu
  cầu chờ · `thieu_tt` như cũ. Bỏ ba cờ `case_*`. `hocVien[i].khung: 'ft' | 'thuong'`; `dem = demLoc(hocVien, 'tat-ca')`.
- [ ] Mỗi lớp thêm `soChoDuyet` (yêu cầu chờ theo `lop_id` — chỉ người có `PERMISSIONS.REQUEST_APPROVE` ở lớp đó, người khác 0) và `soEmQuaHan` (em có việc tone
  `danger`); `classOverview` trả cùng hai số (lọc một lớp — cùng hàm).
- [ ] Phép kiểm: em lớp thường mức "SOS 2" (số môn trượt) **không** có cờ `sos` · em Case quá hạn xác nhận có `can-lam` · `?view=case_overdue` → `can-lam` ·
  `dem` = `demLoc` · QL thấy `soChoDuyet` đúng số thẻ demo, GVBM thấy 0 · đếm câu `/hoc-vien-lop` ≤ mốc + 12 (ghi số đo vào `TRAN`).
- [ ] `npm run check` → commit `PR-HVL (3): trang Học viên & Lớp — chip Cần làm / Chờ duyệt, SOS chỉ Fast Track, số chờ duyệt và quá hạn theo lớp`.

## Task 4 · Web Học viên & Lớp (M3, YC-11.2, T18, B4, B8, K2-03, cột Sắp tới) — impeccable `clarify`

**Files:** `web/src/modules/students/StudentsPage.tsx`, `BangHocVienLop.tsx`, `web/src/ui/ViecTiep.tsx`, `web/src/ui/CongTacKhung.tsx`.
Nằm ở: **Học viên & Lớp** (menu trái) → bảng lớp → mở một lớp.

- [ ] **Công tắc khung (K2-03, MH4/MH5):** `CongTacKhung trang="hoc-vien-lop" coTatCa` đứng **trước** chip (chỉ hiện khi phạm vi có cả hai loại lớp);
  URL `?khung=`. Bảng **nhóm theo kiểu lớp** (FT trước, lớp thường sau), **mỗi nhóm một `<section>`** chứa khối tiêu đề dính riêng (`Mục tiêu` cho FT,
  `Khoá` cho lớp thường) + các bảng lớp — tiêu đề dính bị chặn trong section của nó (bẫy sticky: không để hai khối tiêu đề chồng nhau). Bỏ cột "Mục
  tiêu / Khoá". Số chip đếm bằng `demLoc(data.hocVien, khung)`.
- [ ] **Cột Kết quả (T18):** `chinh` đậm tầng 1 + `lech` (chữ nhỏ `text-bad`, title "Dưới kỳ vọng …") + ✓ nhỏ khi đạt + `Level` SOS (thang màu, "tạm thời"
  viền đứt); dưới là **tối đa hai dòng 12 px** `dong1`, `dong2` — **không `truncate`**, không "…" (colgroup nới cột này; cột Việc tiếp co lại).
- [ ] **Tên em** `font-semibold` (M3); mã 6 số mờ giữ nguyên.
- [ ] **Việc tiếp theo bấm được (B8):** `ViecTiep` nhận `den?: string` → `<Link>` (giữ `QuaHan`/hạn mờ). Đích: `nhap-diem` → `nhapDiemCua(...)`
  (`thaoTacDongHocVien.tsx`); `case` → `duongHoSoHocVien(id, { caseId, paId, viec: ghiKetQua ? 'ghi-ket-qua' : undefined })`; `y-thuc` →
  `duongHoSoHocVien(id, { tab: 'y-thuc' })`. Việc chung (`tachViecChung`) thành **một hàng con đầu lớp** `Cả lớp: Nhập điểm L, R · Cuối khoá · 8 em →`
  (link lưới chấm), không lặp ở từng dòng.
- [ ] **Badge lớp (B4):** `badgeLop({ vai, soChoDuyet, soEmQuaHan, … })`; "+n" thành `MenuDong` (portal) `bieuTuong={`+${n}`}` — mỗi mục là một badge
  còn ẩn, bấm đi đúng đích (`cho-duyet` → hộp Chờ duyệt (lọc lớp nếu hộp có tham số lớp); `qua-han` → `?view=can-lam&classId=`; `xep-lop` → như cũ).
- [ ] **Cột Sắp tới (M3 — làm khi chủ sản phẩm chọn A ở Câu 1, mặc định A):** `nextAttemptLabel · tuanLich(nextWeekStart)` (FT `MT4 · W3 NOV`, lớp thường
  `Cuối khoá · W4 OCT`), không có thì `—` mờ; cột hẹp, 12 px. Chọn B → bỏ bước này, ghi Nhật ký.
- [ ] `/impeccable clarify` trên chip, badge, cột Kết quả, việc tiếp (chữ ngắn, đúng `TU_DIEN_VA_CHU`; không đổi "Đề ra PA" — Q5). `npm run check`
  (phép kiểm đọc nguồn cũ sửa theo chữ mới) → commit `PR-HVL (4): Học viên & Lớp — kết quả hai dòng, việc tiếp bấm được, chip/khung/badge mới`.

## Task 5 · Cần hỗ trợ theo kỹ năng (M4, YC-11.3.1, T19, K2-36, K2-37, K2-42) — impeccable `layout` + `harden`

**Files:** `server/src/classes/canHoTro.ts` (mới, `canHoTroLop(p, classId)`), `server/src/routes/index.ts` (1 route), `web/src/modules/classes/BangCanHoTro.tsx`
(viết lại), `web/src/modules/cases/SkillBoard.tsx` (chỉ `export function TenCase`), `server/src/tests/tocDoDuong.ts`.
Nằm ở: **Học viên & Lớp → Hồ sơ lớp → tab Học viên → nút chế độ `Điểm | Cần hỗ trợ` → Cần hỗ trợ** (mọi vai xem lớp; GVBM chỉ đọc môn khác).

- [ ] Máy chủ `GET /classes/:id/can-ho-tro` (đặt ngay sau `/classes/:id/phan-tich-lop`): `require_(ATTEMPT_VIEW, { classId })` → `listCases(p, { classId })`
  Case chưa xong → `chiTietCaseMo` → gom theo em (**chỉ em có ≥ 1 Case mở**, T19) + `standingFor(ids)` (mức SOS gần nhất, một lần). Trả
  `{ ct, boMon, kyNangToi: editableSkills(p, classId, boMon), laGvbmThuan, tong: { soEm, soCase, choDuyet, quaHan }, em: [{ id, ten, ma, route, target,
  khongCamKet, ketQua, cases: CaseChiTiet[] }] }`. `choDuyet` = Case "Chờ Quản lý duyệt · không theo dõi" + PA `choDuyet` (K2-42); `quaHan` = Case `quaHan`.
- [ ] Web: đầu bảng dòng đếm `7 em · 11 Case · 3 chờ Quản lý duyệt · 1 quá hạn` (số 0 thì bỏ vế) + công tắc **"Chỉ kỹ năng tôi dạy"** (ô tích nhỏ; mặc định
  **bật** khi `laGvbmThuan` và `kyNangToi` có 1–2 kỹ năng, Q12). Mỗi em một **khối**: cột trái (tên đậm + mã · lộ trình · target; `Level` SOS gần nhất
  + đợt; `n Case · n việc quá hạn`), cột phải các hàng từ `hangCanHoTro` với 4 cột thẳng: **Kỹ năng** (L / R / W·W1·W2 / S — viết tắt, tooltip tên đủ) ·
  **Case** (`TenCase` chip `[MT1]` + phần giữa + chip SOS; dòng phụ `nguyên nhân · mức gấp · mở dd/mm`; `NhanTrangThai` từ `trangThai.t`; "từ MB FOU 12"
  nếu bàn giao) · **Phương án đang làm** (tên PA + `🔒` khi bắt buộc · người · `mocChu`; PA chờ xác nhận ghi `Chờ xác nhận`; PA chờ duyệt ghi
  `Chờ Quản lý duyệt`) · **Việc tiếp · hạn** (`viecTiepCuaEm` một Case → `ViecTiep` có hạn **"hạn hết T2 dd/mm"**). Hàng rỗng: một dòng mờ thấp "—";
  hàng gộp `Không có Case: R · W`. "+n Case" bấm mở thêm tại chỗ.
- [ ] Bấm tên Case hoặc việc → mở **`NganCase` tại chỗ** (không rời trang lớp; `viec` = `xac-nhan` / `xac-nhan-pa` / `ghi-ket-qua` theo việc; đóng →
  tải lại). Menu ⋯ của em giữ `useThaoTacDongHocVien` như cũ (roster vẫn tải cho `timeline`).
- [ ] `/impeccable layout` (căn 4 cột giữa các khối, nhịp khoảng cách khối, chiều cao hàng rỗng thấp hơn hàng có Case) + `/impeccable harden` (Case không
  kỹ năng, Case bàn giao, 2 Case cùng kỹ năng, PA chưa có người, tên PA rất dài → xuống dòng không vỡ cột, lớp chưa có Case → `Empty` "Không có học viên
  nào đang có Case mở").
- [ ] Phép kiểm: quyền (GV lớp khác 403) · em có Case L và S → khối có hàng L, S, dòng `Không có Case: R · W` (FT: W gồm W1/W2) · FOU hàng G+V/P · Pre
  FOU một hàng · `tong` đúng · chữ hạn Ghi kết quả là "hạn hết T2" · **đếm câu** trước/sau thêm 10 Case chênh ≤ 1 · dòng `tocDoDuong` cho lớp FT và lớp
  thường (`MOI_VAI` / 3 vai lớp thường), trần ≤ `/cases?classId=` + 8.
- [ ] `npm run check` → commit `PR-HVL (5): Cần hỗ trợ — mỗi em một khối theo kỹ năng, Case + PA đang làm + việc tiếp, mở Ngăn Case tại chỗ`.

## Task 6 · Phân tích lớp mở rộng một kỹ năng (M5, YC-11.3.3, K2-40) — impeccable `layout`

**Files:** `server/src/cases/effectiveness.ts` (`issueBoard` — thêm trường, không đổi trường cũ), `server/src/classes/phanTichLop.ts`, `server/src/routes/index.ts`
(route `/classes/:id/issue-board/o`), `web/src/modules/classes/PhanTichLopTab.tsx`, `web/src/modules/classes/ClassIssueBoard.tsx`.
Nằm ở: **Hồ sơ lớp → tab Phân tích lớp → bấm một hàng kỹ năng/môn**.

- [ ] `issueBoard` trả thêm `tong` = tập id (hợp đồng số liệu: số = độ dài tập): `hvGapVanDe` (em có Case **chưa xong** ở kỹ năng), `caseTatCa`, `dangTheoDoi`
  (Case chưa xong), `daCoPa` (Case có ≥ 1 PA, không tính PA quy chế chưa xác nhận — `NOT_UNCONFIRMED_PRESET`), `daXong` (Case `done`), `thanhCong` (Case
  `done` có `outcome ∈ {much_better, improved}`, Q13). Mỗi dòng `plans` (theo loại PA, từ `planEffectiveness` — **cùng `planOutcomes` với Phân tích ›
  Hiệu quả PA**) thêm `dangThucHien` (PA `planned`/`started` của Case trong phạm vi, trừ PA quy chế chưa xác nhận) và giữ `decided` = **Đã thực hiện**,
  `success` = **Thành công**.
- [ ] Route `GET /classes/:id/issue-board/o?category=&cot=` → `{ n, tieuDe, rows: rowsFor(đơn vị, ids) }` tính bằng **chính** `issueBoard` (G-10); cùng
  `require_(CASE_VIEW)` như route cũ.
- [ ] `phanTichLop.ts` lớp thường (K2-40): thêm dòng đầu **`Cả bài`** (tooltip "Đạt khi % tổng ≥ 70%") — ô `n/N HV đạt` theo `tyLeTong ≥ ngưỡng đạt` (dùng hằng
  ngưỡng có sẵn ở `normal.ts`, grep "0.7"/`NGUONG`; không viết số 0.7 mới); **không** thêm cho Pre FOU (dòng Tổng hợp đã là % tổng). Dòng này không mở rộng.
- [ ] Web `PhanTichLopTab`: hàng mở ra **hai bảng nhỏ** thay `IssueTable`: *Vấn đề ở {kỹ năng}* — một hàng `HV gặp vấn đề · Case · Đang theo dõi · Đã có PA ·
  Đã xong → Thành công` (mỗi số `SoLieuO nguon=…/issue-board/o`) + chú thích "Một Case chỉ đếm một lần. Mọi số bấm được ra danh sách."; *Hiệu quả phương
  án ở {kỹ năng}* — cột `Loại PA · Đang thực hiện · Đã thực hiện · Thành công · Tỷ lệ` (`<TyLe n N>`: `n/N (x%)`, "mẫu nhỏ" khi N < 5, N = 0 "Chưa có dữ
  liệu"); **không** cột "không thành công". Giữ dòng `NeedsEvaluation` (F05) dưới bảng. `IssueTable` còn nơi dùng khác thì giữ, không thì xoá phần web.
- [ ] `/impeccable layout` (hai bảng thẳng cột số, căn phải, `tabular-nums`, không card lồng card). Phép kiểm: `tong` = độ dài tập, danh sách `/o` = số ·
  **tổng `decided`/`success` theo loại PA của lớp = cộng các dòng loại PA tương ứng ở `hieuQuaPa(p, { classId, ct: 'tat-ca', soTuan: 52 })`** trên demo
  (khác vì khung thời gian → ghi lý do, không thì 🛑) · lớp FOU có dòng `Cả bài`, Pre FOU không · trần `issue-board` ≤ mốc + 2.
- [ ] `npm run check` → commit `PR-HVL (6): Phân tích lớp — mở một kỹ năng ra Vấn đề + Hiệu quả PA, số bấm được; dòng Cả bài cho lớp thường`.

## Task 7 · Đầu hồ sơ lớp + Tuần khai giảng / Lịch kiểm tra (K2-14, B4, E7, K2-13, K2-22, K2-23) — impeccable `layout`

**Files:** `web/src/modules/classes/DauTrangLop.tsx`, `web/src/modules/classes/ClassProgressPanel.tsx`, `web/src/modules/classes/ClassOverviewPage.tsx`,
`server/src/classes/classes.ts` (`classOverview`: `cuoiKhoa`), GET `/classes/:id/progress` (`tomTatMt`, `coGiuaKhoa`).
Nằm ở: **Hồ sơ lớp → đầu trang** và **⋮ → Tuần khai giảng (FT) / Lịch kiểm tra (lớp thường)**.

- [ ] Khối nút: **một** nút chính theo `nutChinhDauTrang` (`btn-primary`) + nút phụ còn lại trong `Nhập điểm Test · + Học viên · + Case` (tối đa 2 nút phụ,
  thừa vào ⋮). ⋮ gồm: **Tuần khai giảng** (FT) / **Lịch kiểm tra** (lớp thường) (E7 — tên panel đổi theo) · **Chuyển tiếp lớp** (lớp thường, khi không
  phải nút chính — Q16) · Sửa phân công · Sửa thông tin lớp · (đường kẻ) Xoá / Kết thúc lớp. PR-XUAT thêm "Xuất Excel" vào **đúng mảng này**.
- [ ] Dòng thông tin: lộ trình giữ ký hiệu `LT1 · LT2 · RF` bọc `<abbr title={ROUTE_NAME[route]}>` (K2-13 — bỏ phần "LT1 → Lộ trình 1" của E7). Lớp thường ở
  `final_week`/`finished`: thêm dòng chặng `Cuối khoá: 6/8 em có đủ điểm` (máy chủ `cuoiKhoa: { du, tong }` từ `standingFor(ids)` — chỉ tính ở hai chặng này;
  phần "n em chờ Quản lý quyết" là của PR-LT2b).
- [ ] Badge đầu trang dùng `badgeLop` mới (vai, `soChoDuyet`, `soEmQuaHan`), "+n" → `MenuDong`. Bỏ badge "Case mở" (vào Cần hỗ trợ bằng nút chế độ; `onCheDoCanHoTro`
  dùng cho badge `qua-han`).
- [ ] `ClassProgressPanel` FT (K2-22): tiêu đề **Tuần khai giảng**; chữ: `Tuần khai giảng là tuần bắt đầu mặc định khi thêm học viên. Lịch MT của từng em tính từ
  tuần bắt đầu của em (FT: tuần 6 · 12 · 16; RF: 4 · 8) — xem ở Test › Kế hoạch Test.` (số tuần đọc từ `lichMtMacDinh`, không viết cứng) + dòng
  `8 em · 6 em có MT sắp tới · 2 em đã xong MT cuối` (máy chủ `tomTatMt`: **một** câu dùng `MOC_KE_TIEP_SQL`), bấm ra Kế hoạch Test lọc lớp (tham số lớp mà
  `KeHoachTestTab` đang đọc). Nói rõ: "Đổi tuần khai giảng không dời lịch MT của em đã có."
- [ ] `ClassProgressPanel` lớp thường (K2-23 phần panel): ô **Giữa khoá chỉ hiện khi chương trình có mốc `progress`** (`coGiuaKhoa` từ `checkpoints`; Pre FOU
  ẩn); khung "Lớp đã học hết n tuần" đổi tone trung tính (`var(--line)`, không đỏ) + nút **Chuyển tiếp lớp** ngay trong khung (khi `coTheChuyenTiep`; mở
  panel qua `onViec('chuyen-tiep')`); bỏ câu "Mở từng em rồi bấm Chuyển lớp…".
- [ ] `/impeccable layout` đầu trang (một nút chính nổi, nhóm nút phụ nhẹ, 375 px không tràn). Phép kiểm: `nutChinhDauTrang` 5 trường hợp (Task 1) · đọc nguồn:
  không còn chữ "Lộ trình lớp" làm tiêu đề panel, không còn "Mở từng em rồi bấm" · `/classes/:id/progress` lớp Pre FOU `coGiuaKhoa = false`.
- [ ] `npm run check` → commit `PR-HVL (7): đầu hồ sơ lớp một nút chính theo chặng; Tuần khai giảng / Lịch kiểm tra nói đúng luật mới`.

## Task 8 · Bảng điểm FT (K2-11, rà #119) + panel quyết định lộ trình (B9)

**Files:** `web/src/modules/students/ClassRoster.tsx`, `web/src/modules/students/LoTrinhTiepPanel.tsx`, `web/src/modules/classes/TransitionPanel.tsx`,
`server/src/classes/transition.ts`, route GET `/students/:id/lo-trinh-tiep` (hàm phục vụ nó).

- [ ] `ClassRoster` (Nằm ở: Hồ sơ lớp FT → tab Học viên → Điểm): bỏ `Gọn / Đầy đủ` (cố định 2 mốc, Q11); cột **Theo dõi** = `viecTiepTheo[0]` qua `ViecTiep` (link
  như Task 4) hoặc chữ thường mờ "Đang theo dõi" khi có Case mà không việc (không khung như nút) + dòng đếm Case giữ nguyên. Mốc **MT lịch sử**: nhãn cột
  Mốc thêm chữ nhỏ `lịch sử`, ô điểm **xám** (không đỏ/xanh, không ▾) — hết mâu thuẫn "Chưa có kết quả" cạnh "▼5.0 đỏ" (rà #119).
- [ ] `LoTrinhTiepPanel` (B9; Nằm ở: Học viên & Lớp / hồ sơ lớp → ⋯ dòng em → Lộ trình tiếp theo): máy chủ trả thêm `ketQua` (`standingFor([id])`); đầu panel
  khối **Kết quả gần nhất** (`ketQuaGanNhat`: chính + 2 dòng); câu "Chỉ là dự định, chưa đổi lớp…" hiện **thẳng** dưới tiêu đề khối Hướng đi (bỏ `luat`/ⓘ).
- [ ] `TransitionPanel` (B9; Nằm ở: Hồ sơ lớp thường → Chuyển tiếp lớp): `transition.ts` trả `ketQua` từng em (`standingFor(sids)` **một** lần); cột/ dòng thẻ
  **Kết quả** (chính + dòng 2); lỗi từng dòng **chỉ hiện sau khi** người dùng sửa dòng đó hoặc bấm sang bước Xác nhận (`useLoiForm`: `lf.bam()` ở nút
  bước, cờ `daSua` theo dòng) — hết "4 chữ đỏ khi vừa mở". Điền sẵn hướng GVCN đã ghi: **đã có** (`dongCua`, :44-67) — không làm lại.
- [ ] Phép kiểm: đọc nguồn ClassRoster không còn `Gọn`/`Đầy đủ`, có nhánh `lichSu`; `/students/:id/lo-trinh-tiep` và `/classes/:id/transition` có `ketQua`;
  đếm câu `/classes/{lopThuong}/transition` ≤ mốc + 5.
- [ ] `npm run check` → commit `PR-HVL (8): bảng điểm FT một việc theo dõi + MT lịch sử xám; Lộ trình tiếp theo / Chuyển tiếp lớp hiện kết quả của em`.

## Task 9 · Điện thoại: bảng → thẻ dưới 640 px (D2) — impeccable `adapt`

**Files:** `web/src/ui/TheDong.tsx` (mới), `StudentsPage.tsx`, `BangHocVienLop.tsx`, `ClassRoster.tsx`, `BangDiemLopThuong.tsx`, `BangCanHoTro.tsx`.
Nằm ở: bốn bảng của **Học viên & Lớp** và **Hồ sơ lớp → tab Học viên** (Điểm FT, Điểm lớp thường, Cần hỗ trợ).

- [ ] `TheDong` (một thành phần nhỏ, HE_GIAO_DIEN §10): đầu thẻ (tên em đậm + mã + badge + ⋯ 44 px) và các dòng `nhãn · giá trị` **theo đúng thứ tự cột** của bảng
  desktop. PR-UXD (D1) dùng lại/mở rộng thành phần này — không dựng thứ hai (ghi "Chuyển cho").
- [ ] `< 640 px`: bảng `hidden sm:block`, thẻ `sm:hidden`. Học viên & Lớp: hàng lớp thành thẻ gập (cùng `HangNhom` nội dung) → thẻ em: Kết quả (chính + 2 dòng)
  · Mục tiêu/Khoá · Sắp tới · Case · Việc tiếp (link). Điểm FT: mốc gần nhất `MT2 · OVR 6.0 · L 6.5 R 5.5 W 6.0 S 6.0` (số thẳng hàng, `tabular-nums`) + Theo
  dõi. Điểm lớp thường: mỗi mốc một dòng `Giữa khoá · L 14/20 · R …` + %. Cần hỗ trợ: mỗi **hàng kỹ năng** một thẻ con (mockup M4 "trên điện thoại").
- [ ] 640–1023 px: bảng cuộn ngang **trong vùng bảng**, cột tên dính (`sticky left-0` trong bảng từng lớp — mỗi lớp một bảng nên không bám cả trang).
- [ ] `/impeccable adapt` ở 375 px và 768 px. Phép kiểm đọc nguồn: bốn file có nhánh `sm:hidden` dùng `TheDong`. `npm run check` → commit
  `PR-HVL (9): Học viên & Lớp và tab Học viên của lớp thành thẻ trên điện thoại`.

## Task 10 · Dữ liệu demo + tài liệu (K5 §6 không có dòng cho PR-HVL — planning đặt H1–H4)

**Files:** `server/src/seed/hvlSeed.ts` (`buildHvlDemo(ctx)`, đi qua hàm nghiệp vụ như `xlmtSeed.ts`), `server/src/seed/seed.ts` (1 import + 1 lời gọi sau
`buildXlmtDemo`), `CODE_MAP.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `thiet-ke/PISA-Rulebook-2026-09-19.md`, `DEMO.md`.

- [ ] **H1** `MB FT 101`: một em có **2 Case cùng Reading** (Case tự tạo + Case GV tạo tay) + **1 Case chung** (không kỹ năng) + Case W2 chờ Quản lý duyệt "không
  theo dõi". **H2** `MB FOU 12`: em Case G+V và P; em Cuối khoá đủ điểm ~58%. **H3** `MB Pre FOU 03`: em Cuối khoá ~64%. **H4**: em có MT2 **lịch sử** có điểm,
  chưa có lượt thường có điểm (bảng điểm xám, "Chưa có kết quả"). Kiểm demo đang có trước — kịch bản nào đã có thì chỉ ghi vào `DEMO.md`, không tạo trùng.
- [ ] Tài liệu: `CODE_MAP.md` (`caseLop.ts`, `canHoTro.ts`, `viecTiepCuaEm`, `hangCanHoTro`, `TheDong`) · `TU_DIEN_VA_CHU.md` (Cần làm, Chờ duyệt, Tuần khai giảng,
  "Không đạt: …", "Cả lớp: …", bỏ "Case thiếu PA học thuật", "Case quá hạn cập nhật") · Rulebook (chip, badge theo vai, Cần hỗ trợ theo kỹ năng, lớp thường
  không SOS ở danh sách) · `DEMO.md` H1–H4. `npm run seed` trong worktree → `npm run check` → commit `PR-HVL (10): demo H1–H4 + tài liệu`.

## Task 11 · impeccable `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] Cổng rebase (bảng "Chồng file") → `npm run check`.
- [ ] `/impeccable audit` trên: Học viên & Lớp (1440 + 375, hai khung), Hồ sơ lớp đầu trang (FT, lớp thường cuối khoá, lớp rỗng), Cần hỗ trợ (FT, FOU, Pre FOU),
  Phân tích lớp mở một kỹ năng, Lộ trình tiếp theo, Chuyển tiếp lớp → sửa a11y/tương phản/trạng thái **trong phạm vi PR** → `/impeccable polish` một lượt.
  `/ponytail-review` trên diff; liệt kê mọi chú thích `ponytail:`.
- [ ] Bấm thử **KIỂM** (API 4167 + Vite 5367, Playwright kênh Chrome), ảnh trước (main) / sau → `thiet-ke/anh/pr-hvl/`.
- [ ] push → `gh pr create` tiêu đề `PR-HVL: Học viên & Lớp + hồ sơ lớp (YC-11.2, 11.3.1, 11.3.3 · T18, T19 · B4, B8, B9 · D2)`; thân: bảng mã YC/T/K → ảnh →
  đạt/không; "tầng 1 của màn này là: …" (4 màn ở Global Constraints); **Chuyển cho PR khác**; **không migrate**; chú thích `ponytail:`; kết quả audit; dòng cuối
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Không tự merge.** Tắt cổng, quét `tests/run.js`, dọn tạm.

## KIỂM — kịch bản bấm thử (Task 11)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | QL Vy (2) | Học viên & Lớp, không lọc | Không lớp nào tự mở; công tắc `Tất cả · Fast Track · Lớp thường`; hai nhóm, mỗi nhóm tiêu đề cột riêng (`Mục tiêu` / `Khoá`) dính khi cuộn, không chồng nhau |
| K2 | QL Vy | Mở `MB FT 101` | Cột Kết quả hai dòng, **không "…"**; SOS đúng màu thang; `−0.5` đỏ nhỏ; tên em đậm; cột Sắp tới `MT4 · W…` (nếu Câu 1 = A) |
| K3 | QL Vy | Mở `MB FOU 12`, `MB Pre FOU 03` | Không chữ "SOS" ở lớp thường; `3/4 môn đạt` / `Không đạt: G+V`; `58%`; Pre FOU `64%` một dòng |
| K4 | QL Vy | Chip `Cần làm`, `Chờ duyệt`, `Đang SOS`; mở link cũ `/hoc-vien?view=case_overdue` | Số chip = số em hiện; `Đang SOS` không có em lớp thường; link cũ mở chip Cần làm |
| K5 | QL Vy | Badge hàng lớp; bấm "+n" | Thứ tự QL: chờ duyệt → cần xếp lớp → bài chờ chấm; không badge "Case mở"; "+n" mở danh sách bấm được |
| K6 | GVBM Trang (9) | Học viên & Lớp (Lớp tôi dạy) | Badge đầu tiên "n bài chờ chấm"; việc "Xác nhận nguyên nhân L · hạn …" bấm → hồ sơ em mở Ngăn Case đúng Case |
| K7 | GVCN Hà (7) | `MB FT 101` → dòng "Cả lớp: Nhập điểm …" | Một dòng chung, không lặp ở từng em; bấm → lưới nhập điểm |
| K8 | GVCN Hà | Hồ sơ lớp `MB FT 101` → Cần hỗ trợ | Em H1: hàng R hai Case, hàng "Chung", dòng `Không có Case: …`; hạn "hạn hết T2 dd/mm"; đầu bảng `n em · n Case · n chờ Quản lý duyệt · n quá hạn`; bấm Case → Ngăn Case tại chỗ |
| K9 | GVBM Trang | Cần hỗ trợ lớp mình dạy 1–2 kỹ năng | "Chỉ kỹ năng tôi dạy" bật sẵn, mỗi em 1–2 hàng; tắt → đủ hàng |
| K10 | GVCN lớp thường | Cần hỗ trợ `MB FOU 12`, `MB Pre FOU 03` | Hàng `L · R · G+V · P`; Pre FOU một hàng Tổng hợp |
| K11 | QL Vy | Phân tích lớp `MB FT 101` → mở Reading | Hai bảng nhỏ; bấm "Case" → danh sách đúng số; Tỷ lệ `n/N (x%)` + "mẫu nhỏ"; không cột "không thành công" |
| K12 | QL Vy | Phân tích lớp `MB FOU 12` | Dòng đầu `Cả bài` `n/N HV đạt`; tên môn G+V/P; `MB Pre FOU 03` không dòng Cả bài, không cột Giữa khoá |
| K13 | QL Vy | Hồ sơ lớp FT; lớp thường cuối khoá; lớp rỗng | Một nút chính: (không) / `Chuyển tiếp lớp · n em` + `Cuối khoá: n/N em có đủ điểm` / `+ Học viên`; ⋮ có Tuần khai giảng / Lịch kiểm tra; `LT1` có tooltip "Lộ trình 1" |
| K14 | QL Vy | ⋮ → Tuần khai giảng (FT); ⋮ → Lịch kiểm tra (Pre FOU, lớp hết khoá) | Chữ mới + dòng `n em · n có MT sắp tới`; Pre FOU không ô Giữa khoá; khung hết khoá không đỏ, có nút Chuyển tiếp |
| K15 | GVCN Hà | Bảng điểm FT em H4 (MT lịch sử) | Ô điểm xám, nhãn `lịch sử`; không ▾ đỏ; không nút Gọn/Đầy đủ; cột Theo dõi một việc bấm được |
| K16 | GVCN lớp thường | ⋯ dòng em → Lộ trình tiếp theo; QL → Chuyển tiếp lớp | Khối Kết quả gần nhất; câu "Chỉ là dự định…" hiện thẳng; Chuyển tiếp mở ra **không** chữ đỏ nào tới khi sửa/bấm tiếp; cột Kết quả từng em |
| K17 | 375 px | K2, K8, K11, K13, K15 | Thẻ thay bảng; ô bấm ≥ 44 px; không tràn ngang trang; số thẳng hàng |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Hướng gợi ý theo dải % (`→ học lại` / `→ Quản lý quyết` / `→ lên + bổ trợ`) ở cột Kết quả, Lộ trình tiếp theo, Chuyển tiếp; dòng "n em chờ Quản lý quyết (50–59%)" ở đầu hồ sơ lớp | PR-LT2b | K2-01, K2-14, K2-25, K2-26 — luật Cuối khoá |
| Nhãn "SOS n" của lớp thường **ngoài** cột Kết quả + chip trang này (lưới, hồ sơ HV, Lịch Test, Tổng quan, Phân tích, Excel) | PR-LT2b | T58 (PR-MON đã giao) |
| Loại việc mới vào **`viecTiepCuaEm`** (không hàm khác): Nộp kế hoạch bổ trợ, Ghi Mini Test, Báo PH qua TVV; trạng thái PA lớp thường `Chờ duyệt kế hoạch` ở Cần hỗ trợ | PR-LT2a · PR-LT2b | K2-04, K2-42 |
| Luật M1b tự tạo bài Giữa/Cuối khoá lớp thường | PR-LT2 | K2-23 phần luật |
| Tách "PA theo quy chế / PA do GV thêm" ở Hiệu quả PA (tab lớp dùng lại hàm) | PR-Pb2 | T61 |
| Mẫu thẻ D1 dùng lại `web/src/ui/TheDong.tsx` cho các bảng còn lại | PR-UXD | D1, D3–D9 |
| Đổi chữ "Đề ra PA" → "Lập phương án" **toàn web** (một chỗ `sosV4.ts`) | PR-S3 | K2-04 phần chữ (Q5) |
| Mockup M3/M4/M7 vẽ lại chữ hạn "hạn hết T2", M4 theo ảnh thật (2 Case cùng kỹ năng, hàng Chung, lớp thường) | planning | K2-37, §4.9 "mockup phải sửa" |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | **Không migrate** | Mọi số đọc từ bảng có sẵn; §8 ghi "Không" |
| Q2 | Chip: `Tất cả · Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin` — **giữ** "Đang SOS" nhưng chỉ Fast Track (K2-02), bỏ 3 chip Case (K2-03) | K2-03 muốn bỏ SOS, K2-02 muốn giữ-chỉ-FT; SOS là tầng 1 của FT (§7.5) và BranchPulse/Tổng quan đang link `view=sos` |
| Q3 | "Cần làm" = em có việc tone `danger` (quá hạn) hoặc `warn` (Xác nhận nguyên nhân/PA, Ý thức bắt buộc) trong `viecTiepCuaEm`; **không** tính nhập điểm | Nhập điểm đã có badge lớp "bài chờ chấm"; tính nhập điểm theo từng em cho cả trang phải nạp lượt của mọi lớp (quá chậm) |
| Q4 | Việc tiếp theo **không** gọi `myWork` (≈ 68 câu); ghép `viecTiepCuaCase` + `nhanNhomEm` + nhập điểm trong **một** hàm `viecTiepCuaEm` | K2-04 "hàm dùng chung" — cùng nguồn luật với Ngăn Case / Việc của tôi mà không nhân đôi số câu |
| Q5 | Giữ chữ "Đề ra PA" (nguồn `viecTiepCuaCase`); đổi toàn web → PR-S3 | Đổi ở một màn là hai chữ cho một việc |
| Q6 | Việc nhập điểm **trùng chữ ở ≥ 2 em** gộp thành dòng "Cả lớp" đầu lớp | B8 "việc chung của lớp chuyển lên hàng lớp" |
| Q7 | "Thiếu 0.5" → `−0.5` (tooltip "Dưới kỳ vọng 0.5"); kỹ năng dưới kỳ vọng nói ở dòng 2 `Không đạt: …` | E7 tách nghĩa "Thiếu n thông tin"; T18 |
| Q8 | T58 ở PR này chỉ cột Kết quả + chip trang Học viên & Lớp; dùng `%` tổng cho mọi lượt **Cuối khoá** đủ điểm, Giữa khoá `n/4 môn đạt` | K2-01 + T58 (chốt sau T18); `tyLeTong` đã có sẵn |
| Q9 | Badge theo vai; bỏ "Case mở"; gộp hai badge xếp lớp; "+n" là `MenuDong` | B4, K2-06, T53 Q5 |
| Q10 | Giữ `LT1 · LT2 · RF` + tooltip `ROUTE_NAME` | K2-13 thắng E7 phần này (tên lớp mới dùng ký hiệu) |
| Q11 | Bảng điểm FT bỏ Gọn/Đầy đủ, cố định **2 mốc** | K2-11 + mặc định hiện tại |
| Q12 | "Chỉ kỹ năng tôi dạy" bật sẵn khi người xem **chỉ** là GVBM (không GVCN/QL của lớp) và dạy 1–2 kỹ năng; không nhớ qua lần mở | K2-36; tránh GVCN mở ra thấy thiếu |
| Q13 | Phân tích lớp: "Thành công" Case = `done` + `outcome ∈ {much_better, improved}`; PA "Đã thực hiện" = kết thúc có kết quả xác định (`decided`), "Đang thực hiện" = `planned/started` trừ PA quy chế chưa xác nhận; **không** giới hạn thời gian | Cùng mẫu số `planEffectiveness`/Hiệu quả PA; `improved` = "Tiến bộ một phần" tính thành công như PA `partial` |
| Q14 | Phân tích lớp FT giữ **5 hàng L R W1 W2 S** (M5 vẽ 4) | Mã hiện tại + W1/W2 là hai bài riêng; SOS gộp W đã ghi ở ⓘ |
| Q15 | D2 dựng `TheDong` nhỏ ở `web/src/ui` (4 bảng dùng) | D1 (PR-UXD, đợt 6) chưa có; không để 4 bảng 4 kiểu thẻ |
| Q16 | Nút chính đầu hồ sơ lớp theo chặng; "Chuyển tiếp lớp" luôn còn trong ⋮ cho QL (nút chính chỉ ở cuối khoá) | K2-14 "ẩn khi tuần 2" nhưng QL vẫn cần chuyển giữa khoá hiếm khi |
| Q17 | impeccable `distill` (§7.2) **thay bằng** `clarify` + `layout` | CLAUDE.md (28/09) chỉ cho session code `polish/clarify/layout/harden/adapt` + `audit` |
| Q18 | Demo H1–H4 do planning đặt | K5 §6 không có dòng cho PR-HVL |
| Q19 | B9: tóm tắt trong panel = `ketQuaGanNhat` (chính + 2 dòng); % + hướng gợi ý thêm ở PR-LT2b | Không làm luật Cuối khoá ở PR này |
| Q20 | MT lịch sử ở bảng điểm FT: xám + nhãn `lịch sử`, vẫn hiện (không ẩn) | Rà #119; điểm thật, chỉ không phải hiện trạng (M-14) |

## Mâu thuẫn nguồn ↔ mã thật

1. **D2 phụ thuộc D1** (mẫu thẻ dùng chung, PR-UXD đợt 6) — D1 chưa có → PR này dựng `TheDong` tối thiểu (Q15).
2. **§7.2 giao `distill` cho PR-HVL** ↔ `CLAUDE.md` không liệt kê `distill` cho session code → theo CLAUDE.md (Q17).
3. **K2-02 ↔ K2-03** về chip "Đang SOS" → Q2. **T18 (lớp thường `2/4 kỹ năng có điểm`) ↔ T58/K2-01 (`%`)** → theo T58 (Q8).
4. **E7 "LT1 → Lộ trình 1" ↔ K2-13** → K2-13 (Q10). **M5 vẽ 4 hàng ↔ mã 5 hàng** (`phanTichLop.ts:85` `ENTRY_SKILLS`) → giữ 5 (Q14).
5. **Spec "số dùng chung hàm với Phân tích › Hiệu quả PA"**: Hiệu quả PA xếp theo **vấn đề → loại PA** và lọc `tg` tuần (`hieuQuaPa.ts:30-40`), tab lớp xếp theo
   **loại PA** không giới hạn thời gian → cùng `planOutcomes`, so bằng phép kiểm cộng dòng (Task 6), không bắt hai màn cùng hình dạng.
6. **Đã xong ở PR trước, không làm lại:** T17 / YC-11.1 (`lopMoSan` hocVienLop.ts:250-254, tiêu đề dính StudentsPage.tsx:196-210 — PR-N1); K2-05 + K2-31 (`mocKeTiep`,
   `MOC_KE_TIEP_SQL` — PR-MT: server hocVienLop.ts:110-113, standing.ts:212-218); K2-40 phần cột theo mốc + tên môn (`phanTichLop.ts:60-64` — PR-MON); B9 "lấy sẵn
   hướng GVCN đã ghi" (`TransitionPanel.tsx:44-67`); badge `Thiếu GV` theo tên môn chương trình (`hocVienLop.ts:174` — PR-MON); nhãn Ý thức dòng em (`dongHocVien.ts:19-31` — YT4).
7. `viecTiepTheoCua` (hocVienLop.ts:273-319) chỉ biết 3 loại việc và đọc `state` cũ (`no_plan`, `nextDue`) — không biết Xác nhận nguyên nhân/PA, Ý thức → thay (K2-04).
   `BangCanHoTro.tsx:67-68` còn dùng `chonCaseChinh` + `viecTiepTheoCua` với một Case chính/em — thay toàn bộ (T19).
8. `caseCardOf` (cases.ts:2475) và `mtKeTheoPa` (:3122) chạy **mỗi Case vài câu** — dùng cho Cần hỗ trợ cả lớp là N+1 → `chiTietCaseMo` theo lô (Task 2).
9. `ketQuaGanNhat` (hocVienLop.ts:113-119) vẫn gắn `SOS n` cho lớp thường theo số môn trượt và cắt dòng phụ 60 ký tự (`catDongPhu`) → nguồn của dấu "…" ảnh 2.
10. `ClassProgressPanel.tsx:94-108` luôn vẽ ô Giữa khoá; khung hết khoá tô `var(--danger)` (:131); chữ FT (:147-151) còn "Kế hoạch học để xem và xếp lịch MT" (sai luật M1).

## Câu cần chủ sản phẩm quyết

1. **Thêm cột "Sắp tới" ở Học viên & Lớp (M3)?** — mốc kế tiếp của em: FT `MT4 · W3 NOV`, lớp thường `Cuối khoá · W4 OCT` (đặc tả §11 mục 3 để anh/chị chọn).
   (A) **Thêm** *(khuyến nghị — dữ liệu đã đúng sau PR-MT, cột hẹp, trả lời "em thi lúc nào" mà không mở hồ sơ)* · (B) Không thêm. Kế hoạch đang theo **(A)**
   (Task 4 bước riêng, bỏ được mà không ảnh hưởng bước khác).

## Nhật ký thực thi

<!-- Session code ghi ở đây: mốc B, số câu SQL trước/sau từng route, dòng mã thật lệch, phép kiểm cũ đã sửa chữ mong đợi (từng phép + lý do),
     trước/sau clarify, file chồng với HSM/XUAT phát hiện thêm, 🛑 đã hỏi, model thật. -->

**Task 0 (30/09).** Model thật: **Claude Sonnet 5.5** (Co-Authored-By theo đó). Worktree `pr-hvl-hoc-vien-lop` từ `origin/main` `e7d6af94` (kế hoạch đã có trên main).
PR-HSM (`pr-hsm-ho-so-mock`) chưa merge (worktree đang ở `e7d6af94`); PR-XUAT/PR-SANG chưa merge. Chưa thấy file chồng ngoài bảng "Chồng file" (kiểm lại ở cổng rebase Task 11).
**Mốc B = 1722 phép kiểm** (`run.js`) · 24 phép kiểm tốc độ (`tocDo.run.js`). Số câu SQL mốc (lớp demo id 3): `/hoc-vien-lop` **51** (QT 49) · `/classes/3/roster` **46** (QT 43) ·
`/cases?classId=3` **17** (QT 14) · `/classes/3/phan-tich-lop` **19–20** (QT 18) · `/classes/3/issue-board?category=listening` **22** (QT 21).
Dòng mã thật khớp kế hoạch (lệch ≤ 20 dòng).


**Task 1 (30/09) — 1732 phép kiểm (≥ mốc 1722).** Luật thuần xong ở `shared/domain/hocVienLop.ts`: `ketQuaGanNhat` hai dòng (`chinh/lech/dat/sos/dong1/dong2`), chip
`tat-ca · can-lam · cho-duyet · sos · thieu_tt` + `demLoc`, `badgeLop` theo vai (`xep-lop`, `cho-duyet`, `qua-han`), `viecTiepCuaEm` + `tachViecChung`, `hangCanHoTro` + `sapEmCanHoTro`,
`nutChinhDauTrang`. Quyết định nhỏ: (a) **giữ** `catDongPhu`/`DONG_PHU_TOI_DA` — `congViec.ts:186` còn dùng; (b) **giữ tạm** `viecTiepTheoCua`, `chonCaseChinh`, `CaseChoViec` (`dich` của
`ViecTiepTheo` để tuỳ chọn) đến Task 5 vì `classes.ts` + `BangCanHoTro.tsx` chưa chuyển sang `viecTiepCuaEm` — build phải xanh sau từng Task; (c) việc "Đề ra PA" (Case chưa PA, không hạn) tone
`warn` (để vẫn vào chip Cần làm như chip Case cũ); "Hoàn thành Case" tone `info`. **Vá tạm để build xanh (làm thật ở Task 3/4/7):** server `hocVienLop.ts` gộp 3 cờ Case cũ vào `can-lam`;
web `StudentsPage/DauTrangLop` gọi `badgeLop` với `vai` từ `session.roles`, `BangHocVienLop` vẽ `lech/dong1/dong2`.
Phép kiểm cũ sửa chữ mong đợi (giữ ý kiểm): `hocVienLop.tests.ts` — nhãn chip, `docThamSoLoc` (ba khoá Case cũ → `can-lam`), `ketQuaGanNhat` (FT đủ/tạm thời/đạt/chưa thi, lớp thường: T58 không SOS), badge hộp lớp,
chữ cột FT + FOU (`Không đạt: L`, `Không đạt: G+V`), đếm chip (`can-lam ≥ số em Case quá hạn`; Task 3 viết lại chặt hơn) · `panelUx3.tests.ts:114` badge · `lenLop.tests.ts:155` badge gộp `xep-lop` ·
`nenGiaoDien.tests.ts:125` badge 7 loại (miễn ≤ 3 từ cho `xep-lop`, `qua-han`, `chang`). Thêm `prHvl.tests.ts` (`runPrHvlTests`, đăng ký cuối `run.ts`).

**Task 2 (30/09) — 1738 phép kiểm.** Máy chủ: `sosCaseStateMany` (`sosState.ts`; `sosCaseState(id)` = `sosCaseStateMany([id])`), `chiTietCaseMo` (`server/src/cases/caseLop.ts` mới: 4 câu mỗi lô 400 — `sosCaseStateMany`,
`sos_cases` (tên riêng + lý do hệ thống đóng), `case_interventions ⟕ users`, `case_milestones`), `caseViecTheoHocVien` thay `caseMoTheoHocVien`, `classRoster` dùng `viecTiepCuaEm` (truyền Ý thức `canhBao`),
`history[i].lichSu`, `Standing.nextWeekStart`. Quyết định: `CaseChiTiet` thêm `sosLevel`, `mt`, `xong` (PA) — web cần chip `[MT1]` / lọc PA đang làm; `giua` (phần giữa tên Case SOS) lấy `sos_cases.title` ||
`{tên môn} không đạt` từ `MappedCase.topicLabel` (không gọi `tenGiuaCua` từng Case — hàm đó hỏi DB); Case không chủ đề → "Không đạt" (không dính dấu cách). Nguyên nhân = `MappedCase.primaryLabel` (không đọc lại `case_issues`).
**Số câu SQL:** roster lớp 3: 46 → **50** (QT 43 → 47), lớp 6: 42 → 46 · trần `TRAN` hạ về mốc + 6 (52 · QT 49). Thêm 10 Case cho một em: roster chênh ≤ 1 câu; `chiTietCaseMo` 3 Case = mọi Case cùng số câu.
Phép kiểm cũ sửa: `hocVienLop.tests.ts` "Q13 việc tiếp theo ở dòng học viên" — thêm `dich: { loai: 'nhap-diem' }` vào chuỗi mong đợi (giữ ý kiểm).

**Task 3 (30/09) — 1742 phép kiểm.** `viecHocVienTheoLop` (`dongHocVien.ts`) là MỘT hàm cho trang Học viên & Lớp và `classOverview` (theo em: việc tiếp theo không kể nhập điểm, Ý thức qua `trangThaiYThuc` một lần chỉ lớp có
`STUDENT_VIEW` và bỏ em Tạm dừng, thẻ `yeu_cau_duyet` chờ một câu/lô 400): sinh cờ `can-lam` (tone danger/warn), `cho-duyet`, `soChoDuyet` (chỉ người có `REQUEST_APPROVE` ở lớp, người khác 0), `soEmQuaHan`.
`danhSachHocVienLop`: bỏ ba cờ Case cũ, `sos` chỉ em lớp FT, `hocVien[i].khung`, `dem = demLoc(...)`, mỗi lớp có `soChoDuyet`/`soEmQuaHan`; `classOverview` trả cùng hai số (và chỉ đọc `listCases(p,{classId})` một lần, dùng cho cả `soCaseMo`).
**Số câu SQL:** `/hoc-vien-lop` 51 → **59** (QT 49 → 57) ≤ mốc + 12 · `/classes/3/overview` 48 (không tăng). Trần `TRAN`: 63 (QT chi nhánh 61).
Phát hiện: (a) trang đọc Case **theo chi nhánh** (`listCases({branchId})`, lọc theo lớp lúc đánh giá) còn roster đọc **theo lớp** — hai tập chỉ lệch với Case của em đã chuyển lớp sang chi nhánh khác (bộ kiểm để lại vài em như vậy);
phép kiểm so hai nơi chỉ ở lớp mà hai tập trùng. (b) Bộ demo sau các phép kiểm khác có em còn 2–3 ghi danh `active` → hàm gộp theo em, đếm cho mỗi lớp em đang có mặt.
Phép kiểm cũ sửa: `hocVienLop.tests.ts` "Q4 số đếm chip" — `dem.sos` = số em **Fast Track** mức SOS > 0 (T58); bỏ so `case_overdue` ≥ hàng đợi `due` (đã có phép kiểm chặt hơn ở `prHvl.tests.ts`).

**Task 4 (30/09) — 1744 phép kiểm.** Web Học viên & Lớp: `CongTacKhung trang="hoc-vien-lop" coTatCa` (URL `?khung=`, nhớ theo máy; khung đã nhớ mà không còn lớp thì về Tất cả), chip đếm bằng `demLoc(data.hocVien, khung)` (ẩn "Đang SOS" khi khung Lớp thường),
mỗi nhóm khung một `<section>` (FT trước) có khối tiêu đề dính riêng "Mục tiêu"/"Khoá", bỏ tiêu đề "Mục tiêu / Khoá", cột **Sắp tới** (`nextAttemptLabel · tuanLich(nextWeekStart)`, quyết định chủ sản phẩm 30/09), bảy cột `colgroup`.
Cột Kết quả: chính + `lech` đỏ + ✓ + `Level` SOS (FT) + hai dòng 12 px không cắt. `ViecTiep` có `den` (Link), `duongViecTiep` (`thaoTacDongHocVien.tsx`) dựng đích (nhập điểm / Ngăn Case / tab Ý thức), hàng con "Cả lớp: … · n em →" từ `tachViecChung`.
Badge lớp theo vai (`session.roles`), "+n" thành `MenuDong` (`bieuTuong` nhận chữ; mục không có đích riêng mở Hồ sơ lớp); `cho-duyet` → `/cong-viec/cho-duyet` (hộp Chờ duyệt **chưa có tham số lớp**, chưa lọc theo lớp), `qua-han` → `/hoc-vien?view=can-lam&classId=`.
**impeccable `clarify`** (chạy `impeccable context` một lần; project chưa có PRODUCT.md → theo CLAUDE.md không chạy `init`): rà chữ chip/badge/Kết quả/Việc tiếp/"Cả lớp" so với kế hoạch + `TU_DIEN_VA_CHU` — giữ nguyên chữ đã chốt (Q2, Q5 "Đề ra PA"), không sửa thêm.
Không có phép kiểm cũ nào phải sửa ở task này (không phép nào đọc nguồn các file web đã đổi). Thêm 2 phép kiểm đọc nguồn ở `prHvl.tests.ts`.

**Task 5 (30/09) — 1749 phép kiểm.** Máy chủ `GET /classes/:id/can-ho-tro` (`server/src/classes/canHoTro.ts`, ngay sau `/phan-tich-lop`): `require_(ATTEMPT_VIEW)` → `listCases(p,{classId})` → `chiTietCaseMo` → gom theo em; trả `ct, boMon, kyNangToi (editableSkills), laGvbmThuan, homNay, tong{soEm,soCase,choDuyet,quaHan}, em[{id,ten,ma,cases}]`.
🛑→giải quyết trong phạm vi: **trần SQL.** Bản đầu (có `standingFor` + đọc ghi danh) đo **33 câu > trần 25** (`/cases?classId=` 17 + 8). Không xin planning vì lối ra nằm trong kế hoạch: tab Học viên đã tải `/classes/:id/roster` (cần `timeline` cho menu ⋯) nên
**web ghép `standing`/`cycle` (SOS gần nhất, lộ trình, target) từ roster**, máy chủ chỉ trả Case; em đang học = `homeClassId === classId`. Đo lại: **25 (QT 22) = đúng trần**, ghi vào `TRAN` (lớp 3 và 6). Lệch nhỏ so với kế hoạch: `em[]` không có `route/target/khongCamKet/ketQua` (lấy từ roster).
Web: `BangCanHoTro.tsx` viết lại — đầu bảng `n em · n Case · n chờ Quản lý duyệt · n quá hạn` (bỏ vế 0), công tắc "Chỉ kỹ năng tôi dạy" (bật sẵn khi GVBM thuần dạy 1–2 kỹ năng, không nhớ), mỗi em một khối (cột trái tên · LT · target · SOS + đợt · n Case/n quá hạn · ⋯; cột phải lưới 4 cột thẳng
Kỹ năng · Case · Phương án đang làm · Việc tiếp + hạn) từ `hangCanHoTro`/`sapEmCanHoTro`; hàng rỗng một dòng "—", hai hàng rỗng liền nhau gộp "Không có Case: …"; "+n Case" mở tại chỗ; bấm tên Case / việc mở **`NganCase` tại chỗ** (`viec` = xac-nhan / xac-nhan-pa / ghi-ket-qua; đóng → tải lại).
`SkillBoard.tsx`: export `TenCase` (đổi kiểu tham số `Pick<CaseCard,'title'|'tenSos'>`) **và `KhoaQuyChe`** (kế hoạch chỉ ghi `TenCase`; thêm một export để ổ khoá PA quy chế là SVG có sẵn thay vì emoji 🔒 — craft-floor cấm emoji làm icon). `ViecTiep` có `onBam`.
impeccable `layout` (đọc reference + `impeccable detect --scope layout` trên 4 file web: sạch) và `harden` (Case không kỹ năng → hàng Chung; Case bàn giao "từ {mã lớp}"; 2 Case cùng kỹ năng → 2 dòng + "+n Case"; PA chưa có người → chỉ tên PA; tên PA dài xuống dòng; lớp không Case → `Empty`) — áp dụng trong lúc viết, kiểm mắt một lần ở Task 11.
Đã **xoá** `viecTiepTheoCua`, `chonCaseChinh`, `CaseChoViec` (`dich` của `ViecTiepTheo` thành bắt buộc). Phép kiểm cũ sửa sang hàm mới (giữ ý kiểm): `hocVienLop.tests.ts` "Q13 việc tiếp theo" (đầu vào `viecTiep` của `viecTiepCuaCase`; chữ việc thành "Ghi kết quả PA L" theo `RUT_GON`; bỏ vế `chonCaseChinh` —
ý "Case nói trước" nay là thứ tự hàng của `hangCanHoTro`, kiểm ở `prHvl.tests.ts`) · `panelUx3.tests.ts:95,316` · `suaLoiNong.tests.ts:154-165` (chỉ đổi tên hàm + `yThuc: null`).

**Task 6 (30/09) — 1754 phép kiểm.** Máy chủ: `issueBoard` (`effectiveness.ts`) trả thêm `tong` (id: `hvGapVanDe · caseTatCa · dangTheoDoi · daCoPa · daXong · thanhCong`, thành công = Case `done` có `outcome ∈ {much_better, improved}`, Q13) và mỗi dòng `plans` thêm `dangThucHien` + `ids {dangThucHien, daThucHien, thanhCong}`
(giữ `decided` = Đã thực hiện, `success` = Thành công; thêm dòng cho loại PA chỉ có PA đang làm). **Chỉ gọi `planOutcomes` MỘT lần** (tách `hieuQuaTheoLoaiCua` / `canBoSungDanhGiaCua` khỏi `planEffectiveness` / `plansNeedingEvaluation`, hai hàm cũ giữ nguyên chữ ký) nên số câu
SQL của `issue-board` **giảm 22 → 16** (QT 21 → 15) dù thêm dữ liệu · trần `TRAN` hạ 33 → 18. Route mới `GET /classes/:id/issue-board/o?category=&cot=&kind=` (`oPhanTichLop` ở `phanTichLop.ts`, ngay sau `issue-board`; `CASE_VIEW`): danh sách = đúng tập id của số, đo 17 câu (QT 16), trần 19.
`phanTichLop` lớp thường: dòng đầu **`Cả bài`** (`moRong: false`; ô `n/N HV đạt` = `tyLeTong ≥ RATIO_PASS_THRESHOLD`, chỉ bài đủ điểm; tooltip lấy số từ hằng, không viết 0.7); Pre FOU không có dòng này.
Web: `ClassIssueBoard.tsx` viết lại thành `VanDeKyNang` — hai bảng nhỏ *Vấn đề ở {kỹ năng}* (HV gặp vấn đề · Case · Đang theo dõi · Đã có PA · Đã xong → Thành công, mỗi số `SoO nguon=…/issue-board/o`) và *Hiệu quả phương án ở {kỹ năng}* (Loại PA · Đang thực hiện · Đã thực hiện · Thành công · `TyLe n/N`, "mẫu nhỏ" / "Chưa có dữ liệu");
không cột "không thành công"; giữ `NeedsEvaluation`; chú thích "Một Case chỉ đếm một lần. Mọi số bấm được ra danh sách đúng số đó." `IssueTable` chỉ `PhanTichLopTab` dùng → đã xoá. impeccable `layout`: `detect --scope layout` sạch.
**Số bảng lớp ≠ Hiệu quả PA — đã giải thích được (không 🛑):** Hiệu quả PA xếp theo *lỗi chính* (bỏ Case chưa phân loại và `tong_hop`) và giới hạn 52 tuần; bảng lớp xếp theo *kỹ năng* của Case, mọi thời gian. Phép kiểm: Σ "Đã thực hiện" của lớp = PA có kết quả xác định trong `planOutcomes({classId})`; `hieuQuaPa.tomTat.paCoKetQua` = cùng tập lọc 52 tuần + Case đã có lỗi chính; bảng lớp ≥ Hiệu quả PA.
Phép kiểm cũ sửa: `hocVienLop.tests.ts` "Phân tích lớp thường" — khung dòng thêm `Cả bài` và ô `ca-bai|progress` chưa có khi em mới có 1–2 môn.

**Task 7 (30/09) — 1756 phép kiểm.** Máy chủ: `ClassProgress.coGiuaKhoa` (chương trình có mốc `progress`, hoặc đã xếp lại tay), `tomTatMt(classId)` (`schedule.ts`, một câu: em có mốc kế tiếp theo `MOC_KE_TIEP_SQL`, em đã có MT có điểm ≥ số MT của lịch mặc định LT 3 / RF 2; đếm mỗi em một lần) và route
`GET /classes/:id/progress` trả thêm `tomTatMt` — **chỉ khi lớp FT và người xem có `ATTEMPT_VIEW`** (route trước đó không kiểm quyền; không để lộ số em cho người ngoài phạm vi). `classOverview` trả `cuoiKhoa: { du, tong }` (lớp thường ở `final_week`/`finished`, một lần `standingFor`; `du` = em có bài Cuối khoá đủ điểm).
Số câu: `/classes/3/progress` đo 17 (QT 16), trần 20; `/classes/6/overview` (lớp thường) 55.
Web: `DauTrangLop` — một nút chính `nutChinhDauTrang` (`coTheNhapDiem` = `canEnterScores` **và** `needScores > 0` để FT giữa khoá không có nút chính, khớp K13 "(không)"), tối đa 2 nút phụ (Nhập điểm Test · + Học viên · + Case; thừa vào ⋮), ⋮ = Tuần khai giảng / Lịch kiểm tra · Chuyển tiếp lớp (lớp thường, khi không phải nút chính) · nút thừa · Sửa phân công · Sửa thông tin lớp · (kẻ) Xoá/Kết thúc;
LT bọc `<abbr title=ROUTE_NAME>`; dòng chặng `Cuối khoá: 6/8 em có đủ điểm`; badge theo vai dùng `soChoDuyet`/`soEmQuaHan` từ `classOverview`, "+n" là `MenuDong`, bỏ badge "Case mở". `ClassProgressPanel` — tiêu đề FT "Tuần khai giảng"; chữ FT theo kế hoạch (số tuần 6 · 12 · 16 / 4 · 8 đọc từ `lichMtMacDinh`) + dòng `n em · n em có MT sắp tới · n em đã xong MT cuối` + link `/test/ke-hoach?loai=ft&classId=`;
"Đổi tuần khai giảng không dời lịch MT của em đã có."; lớp thường: ô Giữa khoá và trạng thái Giữa khoá ẩn khi `!coGiuaKhoa`, khung hết khoá tone `var(--line)` (không đỏ) + nút **Chuyển tiếp lớp** (`onChuyenTiep`), bỏ câu "Mở từng em rồi bấm…". impeccable `layout`: `detect --scope layout` sạch. Không phép kiểm cũ nào phải sửa.
Phần "n em chờ Quản lý quyết" thuộc PR-LT2b (không làm).

**Task 8 (30/09) — 1759 phép kiểm.** `ClassRoster` (bảng điểm FT): bỏ `Gọn/Đầy đủ` (cố định 2 mốc, Q11); cột **Theo dõi** = `viecTiepTheo[0]` qua `ViecTiep` có link (`duongViecTiep`) hoặc chữ mờ "Đang theo dõi" khi có Case mà không việc + dòng đếm Case giữ nguyên; MT lịch sử: nhãn `lịch sử` (`ChipLichSu`) cạnh tên mốc, ô điểm **xám** (không đạt/chưa đạt, không dấu dưới).
`LoTrinhTiepPanel`: máy chủ trả `ketQua` (`standingFor([id])`), đầu panel khối **Kết quả gần nhất** (`ketQuaGanNhat`: chính + hai dòng), câu "Chỉ là dự định, chưa đổi lớp…" hiện thẳng dưới tiêu đề Hướng đi (bỏ ⓘ/`luat`).
`TransitionPanel`: `transition.ts` trả `ketQua` từng em (một lần `standingFor`), cột/dòng thẻ **Kết quả** (chính + dòng 2, dòng 1 ở tooltip); lỗi từng dòng chỉ hiện sau khi sửa dòng đó (`daSua`) hoặc bấm "Tiếp tục" (`useLoiForm.bam()`; nút không còn bị khoá vì lỗi; chân "n ô cần sửa ↑" nhảy tới ô hướng của dòng lỗi).
**Số câu SQL — lệch nhỏ so với kế hoạch (không phải trần Global Constraints, không 🛑 nhưng cần planning biết):** `/classes/6/transition` 28 → **35** (QT 27 → 34): kế hoạch dự kiến ≤ mốc + 5 = 33, nhưng `standingFor` tự nó tốn 7 câu (cycles, attempts, scores…, Case, programmes) nên không thể +5 mà vẫn đúng "một lần
`standingFor`". `/students/1/lo-trinh-tiep` 12 → 20 (panel mở hiếm, một em; kế hoạch không đặt trần). Đã ghi trần `TRAN` cho transition = đo + 2 (37; QT 36). Nếu planning muốn giữ +5: web chỉ cần truyền `standing` từ roster sang hai panel (đã có ở `ClassRoster` / bảng lớp) thay vì máy chủ trả — nhưng trái lời kế hoạch "máy chủ trả thêm `ketQua`".
Không phép kiểm cũ nào phải sửa (không phép nào đọc nguồn ba file này).

**Task 9 (30/09) — 1760 phép kiểm.** `web/src/ui/TheDong.tsx` (mới): `useDienThoai()` (`matchMedia (max-width: 639px)`, chỉ MỘT biến thể được vẽ — không vẽ cả bảng lẫn thẻ rồi ẩn bằng CSS để khỏi tải roster hai lần) + `TheDong` (đầu thẻ: tên đậm + mã + badge + ⋯ do `MenuDong` tự nới 44 px · các dòng `nhãn · giá trị` theo đúng thứ tự cột, `tabular-nums`).
**Khác kế hoạch (chữ):** kế hoạch ghi "bảng `hidden sm:block`, thẻ `sm:hidden`"; làm bằng hook `useDienThoai` thay cho lớp CSS `sm:hidden` — cùng ngưỡng 640 px, nhưng không tải/vẽ hai lần. Phép kiểm "bốn file có nhánh `sm:hidden`" viết lại thành "bốn file dùng `<TheDong>` + `useDienThoai`".
Dùng ở: Học viên & Lớp (`StudentsPage` → `HopLop the` = thẻ lớp gập có `aria-expanded`, badge + "+n" + ⋯; `BangHocVienLop the` = mỗi em một thẻ: Kết quả · Mục tiêu/Khoá · Sắp tới · Case · Việc tiếp, hàng "Cả lớp" thành một dòng chữ; ô Kết quả tách thành `KetQuaOHocVien` dùng chung bảng và thẻ) ·
`ClassRoster` (Điểm FT: Target · Dự kiến thi · Mốc `MT2 · OVR` + L R W S thẳng hàng 4 cột · Theo dõi; MT lịch sử xám + nhãn) · `BangDiemLopThuong` (mỗi mốc một dòng `L 14/20 · R … · %`) · `BangCanHoTro` (mỗi Case của hàng kỹ năng một thẻ: Trạng thái · Phương án · Việc tiếp; `DongCase` dùng chung `cacPa`/`cauViec` cho bảng và thẻ).
640–1023 px: `ClassRoster`/`BangDiemLopThuong` giữ bảng cuộn ngang TRONG vùng bảng, cột tên dính bằng lớp `sticky-col` sẵn có (mỗi lớp một bảng nên không bám cả trang). `impeccable adapt`: đọc reference + áp dụng (một cột, ô bấm 44 px, không hover-only); `detect` sạch; kiểm 375 px / 768 px bằng mắt một lần ở Task 11.
Chuyển cho PR-UXD: `TheDong` là mẫu D1 dùng lại cho các bảng còn lại (D1, D3–D9).

**Task 10 (30/09) — 1762 phép kiểm; `npm run seed` chạy được (chỉ DB demo trong worktree).** `server/src/seed/hvlSeed.ts` (`buildHvlDemo`, gọi ngay sau `buildXlmtDemo` ở `seed.ts`; đi qua `commitIntake`, `saveScore`, `reportIssue`, `guiKhongTheoDoi`, `planRegularTests`, `saveRegularScore`).
**H1** Trịnh Bảo Ngọc (MB FT 101): MT1 dưới kỳ vọng ở Reading + Writing → Case SOS tự tạo; thêm Case Reading GV tạo tay (`parallel`) → hàng R hai Case; Case Writing gửi "Không cần theo dõi" chờ Quản lý duyệt. **H2** Hồ Diệu Linh (MB FOU 12): Case G+V (`writing`) và P (`speaking`); Nguyễn Thảo Vy: bài Cuối khoá 58/100 → `58%`.
**H3** (Pre FOU 03 em 52% / 64%) và **H4** (Đoàn Khánh Chi, MT1–3 lịch sử) **đã có** từ PR-MON D12 / PR-XLMT X3 — không dựng trùng, chỉ ghi `DEMO.md` §12 và kiểm bằng phép kiểm.
**Không dựng được: Case "chung" (không kỹ năng)** ở bộ demo. `reportIssue` bắt buộc `topic`; ép `topic = NULL` bằng SQL làm hai phép kiểm dữ liệu mẫu cũ đỏ ("1 vấn đề trong dữ liệu mẫu không có kỹ năng", "Case thiếu phương án … không nằm ở hạng mục nào"). Hàng Chung chỉ xuất hiện với Case bàn giao / dữ liệu cũ — đã kiểm bằng phép kiểm thuần `hangCanHoTro` (Task 1). Đề nghị planning đổi dòng H1 trong kế hoạch.
Phép kiểm demo `runPrHvlDemoTests` chạy ở **khối "Bộ demo vừa dựng"** của `run.ts` (thêm 2 dòng cạnh `runPrDuyetDemoTests`), vì các phép kiểm chuyển tiếp lớp về sau đóng Case / chuyển em của MB FOU 12 nên ở cuối bộ kiểm dữ liệu H2 đã đổi.
**Trần tốc độ nâng vì dữ liệu demo tăng (kèm lý do, theo quy ước TRAN_GHI_LO):** `chuyenCaLopSangFT` 162 → 200 (đo 191: +2 em MB FOU 12, một em có 2 Case đóng theo S17) · `xemTruocXepLichMt` 102 → 108 (đo 105: +1 em MB FT 101, +3 câu/em) · `/yeu-cau?hop=cho-duyet` 29 → 30 (QT 28 → 29: +1 thẻ chờ duyệt của H1).
Tài liệu: `CODE_MAP.md` (caseLop, canHoTro, viecTiepCuaEm, hangCanHoTro, TheDong, chip mới), `TU_DIEN_VA_CHU.md` §16, Rulebook (mục PR-HVL), `DEMO.md` §12.

**Task 11 (30/09).** Cổng rebase: `origin/main` đã có PR-HSM #131 → dùng **`git merge origin/main`** một lần (rebase 11 commit lặp lại cùng xung đột ở `run.ts`) thay cho rebase; xung đột chỉ ở `seed.ts`, `run.ts`, `DEMO.md`, Rulebook, `TU_DIEN_VA_CHU.md` (hai bên cùng thêm — giữ cả hai, HSM trước, HVL sau). Sau merge: **1781 phép kiểm** + 24 phép kiểm tốc độ đều đạt.
`impeccable audit`: `impeccable detect` (không dùng cờ scope) trên mọi file `.tsx` đổi → `[]`; đọc `layout` / `adapt` / `craft-floor` reference và áp dụng. Sửa sau bấm thử (polish): cột "Kỹ năng" (Cần hỗ trợ) rộng 3.5rem hết bẻ "KỸ/NĂNG"; việc tiếp trong thẻ điện thoại xuống dòng (không cắt "…"); link/nút trong `TheDong` cao ≥ 44 px (`py-3.5`); tiêu đề hai bảng Phân tích lớp `h3` (không nhảy h1 → h4); `0/0 môn đạt` → `—` khi chưa môn nào có điểm.
`/ponytail-review`: bỏ `homNay` thừa ở `canHoTroLop`, gộp hai bản "Cả lớp" thành `ViecChungLop`. **Không có chú thích `ponytail:` nào** trong diff.
Bấm thử (Playwright kênh Chrome, API 4167 / Vite 5367, DB demo trong worktree; ảnh "trước" từ `origin/main` cổng 4168/5368, worktree tạm đã xoá): K1, K2, K3 (chữ + ảnh), K4 (chip, link cũ `case_overdue` → Cần làm 14), K5 ("+n" mở menu, mục đi đúng đích), K6 (việc bấm được → hồ sơ em mở Case), K7 (hàng "Cả lớp"), K8 (bấm việc mở Ngăn Case tại chỗ, URL không đổi), K11 (hai bảng nhỏ), K12 (dòng Cả bài), K13/K14 (nút chính, menu ⋮, panel), K15 (MT lịch sử xám — bằng chữ), K16 (Chuyển tiếp: 0 lỗi lúc mở, "7 ô cần sửa" sau khi bấm; Lộ trình tiếp theo có Kết quả gần nhất), K17 (375 px: không tràn ngang ở 5 trang, thẻ thay bảng). K9 (GVBM bật sẵn "Chỉ kỹ năng tôi dạy") và K10 (Pre FOU) kiểm bằng phép kiểm/đọc nguồn, chưa chụp riêng. Ảnh `thiet-ke/anh/pr-hvl/{truoc,sau}-*.png` + chữ `*-chu.md`.
**Model thật:** Claude Sonnet 5.5 (mọi commit ghi đúng). Không dùng subagent.

**Merge PR-XUAT #132 (30/09, Auto-fix xung đột).** `git merge FETCH_HEAD` (không rebase). Xung đột chỉ ở `run.ts`, `DEMO.md`, `TU_DIEN_VA_CHU.md` (hai bên cùng thêm — giữ cả hai, XUAT/HSM trước). Sửa tay: `DauTrangLop.tsx` khai báo `session` hai lần (mỗi bên tự thêm) → bỏ một; "Xuất Excel" của XUAT đã tự vào đúng mảng `menu` (sau "Sửa thông tin lớp", trước đường kẻ). Đổi số mục: tài liệu PR-HVL thành `TU_DIEN_VA_CHU.md` **§17** và `DEMO.md` **§13** (§16 / §12 đã thuộc PR-HSM). Sau merge: **1799 phép kiểm** + 25 phép kiểm tốc độ đều đạt.

> **Chủ sản phẩm chốt 30/09:** **có** cột "Sắp tới" (M3) ở danh sách Học viên & Lớp.
