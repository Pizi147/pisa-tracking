# PR-XUAT · Xuất Excel kết quả Mock Test (và Test lớp thường) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Quản lý, Quản trị (phạm vi của mình) và **GVCN (lớp mình)** xuất một tệp `.xlsx` kết quả Test, lọc **cộng dồn**:
Chi nhánh (nhiều) → Lớp (nhiều, trống = mọi lớp) → Thời gian (*Theo tuần* từ–đến · *Theo tháng* từ–đến · *Theo đợt* MT1…MT8 /
Giữa khoá · Cuối khoá) → `Mọi lượt | Chỉ lượt đủ điểm` → `Cột gọn | Cột đầy đủ`. Xem trước luôn hiện `312 lượt · 87 học viên ·
6 lớp` + 5 dòng đầu; số dòng tệp = số lượt xem trước. Tệp có sheet kết quả (một dòng = một em × một đợt) và sheet **"Bộ lọc
đã dùng"** (ai, lúc nào, điều kiện, cách đọc cột). Mỗi lần xuất ghi nhật ký. Nút ở **đầu Lịch Test**, **hồ sơ lớp ⋮** (điền
sẵn lớp) và **Phân tích › Tổng hợp Test**.
**Architecture:** Luật thuần ở `shared/domain/xuatMt.ts` (đọc + kiểm bộ lọc, bộ cột, dựng mảng hai chiều, tên tệp, mô tả bộ
lọc). Máy chủ `server/src/phanTich/xuatMt.ts`: phạm vi xuất riêng (K5-35), **một câu** lấy lượt + `loadBundle` có sẵn (điểm,
lịch từng kỹ năng, bỏ kỹ năng, Case theo lô) + `evaluateAttemptRow`/`resultOf` có sẵn → trả **mảng hai chiều đã dựng**. Trình
duyệt chỉ `await import('xlsx')` → `aoa_to_sheet` → `writeFile` (thư viện **đã có**, nạp động như `TongHopTestSos.tsx:116`).
Web: một ngăn dùng chung `web/src/modules/test/NganXuatMt.tsx`, mở từ 3 chỗ.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · libsql (Turso) · `xlsx` 0.18.5 (SheetJS, đã cài) · `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §4.7 **YC-13.9** (+ YC-13.5 cột nhận xét) · §3.2 **T40**
(+ T34 nhãn lịch sử, T39 tiêu chí W1/W2, T58 lớp thường không SOS) · §3.1e **Q29-1** (KCK) · §5.7 **MH3** (tên môn lớp thường ở xuất
Excel) · **§7.8** · §8 dòng PR-XUAT · §10 · mockup **M11** `thiet-ke/mockup/19-nang-cap-27-09.html:726-750` · rà
`thiet-ke/ra-27-09/K4.md` **K4-34, K4-35, §(g) dòng 116** · `K5.md` **K5-35** · `K1.md` **K1-53** · "Chuyển cho" của kế hoạch PR-MT
(:490), PR-MON (:549), PR-XLMT (:554).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-XUAT** · đợt 4 · làn **C** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-xuat-xuat-excel-mt` · `.claude/worktrees/pr-xuat-xuat-excel-mt` (từ `origin/main` mới nhất — có PR-S3F nếu đã merge) |
| Cổng thử | API **4177** · Vite **5377** (không dùng 4000/5173; A PR-HSM 4157/5357 · B PR-HVL 4167/5367 chạy song song) |
| Model | **Sonnet 5 · High** · phương án B: **Fable 5.1 · Medium**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng (T52) — rà **gọn** (không migrate, không quyền mới), rà chung khi xong đợt 4 |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Không.** Không bảng/cột mới, **không quyền mới** (thêm quyền = thêm dòng `role_permissions` = migrate): phạm vi xuất dựng từ quyền có sẵn (Q2) |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR có giao diện). impeccable: **`clarify`** Task 4 (chữ ngăn, nhãn cột, câu lỗi, tên nút), **`layout`** Task 4 (ngăn 3 bước + xem trước, 375 px), **`audit`** rồi **`polish`** Task 6. Không `init`/`document`/`hooks on`/`npx impeccable install` |
| Phụ thuộc | **Task 0–7 và 9 không phụ thuộc PR-HSM.** **Task 8** (cột Nhận xét W1/W2/S + GV chấm S) chạy **sau khi PR-HSM merge** (YC-13.5 migrate `assessment_scores.comment`, `examiner_user_id`, `examiner_name`). Tới Task 9 mà HSM chưa merge → mở PR không có Task 8 (ghi thân PR + Nhật ký); HSM merge xong → rebase, làm Task 8 thành commit bổ sung trên cùng PR (hoặc PR nhỏ nếu PR-XUAT đã merge) |
| Không làm | Nhập Excel · xuất Ý thức/Case · sửa bảng Tổng hợp (`bangXuatTongHop` giữ nguyên) · cột "Sắp tới" (YC-11.2, PR-HVL) · định dạng ô cầu kỳ (màu, khung) · quyền riêng GVBM · xuất nền/gửi mail |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-XUAT (n): …`. Sập segfault (mã 139) → chạy lại **một**
  lần (bộ nhớ "npm check segfault"); đỏ lần hai mới là lỗi thật.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 6 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang
  id 9** · GVCN lớp thường: tài khoản `GVCN_THUONG` của `tocDoDuong.ts`). Ảnh trước (main) / sau: `thiet-ke/anh/pr-xuat/`. Chạy song
  song: `PORT=4177` cho API, Vite tạm cổng 5377 trỏ proxy về 4177 (bộ nhớ "Máy chủ dev trong worktree").
- Chỉ **Task 7** chạm Turso (DB THỬ qua bản nháp) — mọi Task khác chỉ DB demo trong worktree, không chạy lệnh nào có biến Turso.
  Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước khi báo xong: tắt 4177/5377, quét `tests/run.js` treo, dọn tệp
  Playwright/Vite/`.xlsx` tạm.
- Luật repo (`CLAUDE.md`): chú thích `ponytail:` được phép nhưng **liệt kê trong mô tả PR**; trước khi mở PR chạy **`/ponytail-review`**
  và **impeccable `audit`** (PR có sửa giao diện).

### Chồng file với PR cùng đợt (cổng rebase)

Trước Task 9: `git fetch origin && git rebase origin/main`. PR nào merge trước thì PR sau gỡ theo bảng:

| File | PR khác sửa gì | PR-XUAT chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `server/src/routes/index.ts` | **HSM** route chấm/nhận xét · **HVL** route hồ sơ lớp | 2 route mới `/xuat-mt/xem-truoc`, `/xuat-mt` đặt **ngay sau** khối `/phan-tich/tong-hop/o` (:630) | khác khối — giữ cả hai |
| `server/src/tests/run.ts` | HSM, HVL: mỗi PR một dòng đăng ký | **một** dòng `await runPrXuatTests(…)` cuối file | giữ mọi dòng, thứ tự theo merge |
| `shared/domain/index.ts` | HSM, HVL: export mới | 1 dòng `export * from './xuatMt.ts'` | giữ cả hai |
| `shared/domain/nhatKy.ts` | HSM: nhãn nhật ký nhận xét / GV chấm | 1 nhãn `'mt.xuat_excel'` | cùng bảng, khác dòng — giữ cả hai |
| `server/src/tests/tocDoDuong.ts` | HSM, HVL: đường đo + trần mới | khối `// PR-XUAT` cuối `DUONG_DO`, cuối `TRAN`, 1 khoá `xuatMtChiNhanh` cuối `TRAN_GHI_LO` | giữ mọi khối |
| `server/src/tests/tocDo.run.ts` | HSM/HVL có thể thêm đo ghi | 1 `checkAsync` PR-XUAT **cuối file** | giữ cả hai |
| `web/src/modules/classes/DauTrangLop.tsx` | **HVL** Task 7 dựng lại khối nút + mảng `menu` (kế hoạch HVL :59) · SANG màu/chữ | **1 mục** ⋮ `xuat-mt` (sau "Sửa thông tin lớp", trước đường kẻ Xoá) + `ViecDauTrang` thêm `'xuat-mt'` | HVL merge trước → lấy bố cục HVL, chép lại 1 mục |
| `web/src/modules/classes/ClassOverviewPage.tsx` | **HVL** (tab lớp, Cần hỗ trợ, Phân tích lớp) | **1 dòng** `{viec === 'xuat-mt' && <NganXuatMt …/>}` cạnh các panel (:91-107) | giữ cả hai |
| `web/src/modules/test/LichTestTab.tsx` | **HSM** (nếu lưới chấm trong Lịch Test đổi — thường ở `lichTest/*`) | nút "Xuất Excel" ở hàng lọc (sau `<div className="flex-1" />`, :210) + 1 state mở ngăn | khác dòng |
| `web/src/modules/phanTich/TongHopTestSos.tsx` | (không PR nào đợt 4) | nút mở ngăn cạnh "⤓ Xuất Excel" (:212) + đổi chữ nút cũ (Q9) | — |
| `shared/domain/dieuHuong.ts` · `server/src/platform/nav.ts` | (không PR nào đợt 4) | 1 cờ `xuatMt` | — |
| `shared/domain/skills.ts` · `server/src/fasttrack/attempts.ts` | **HSM** (tiêu chí W2 `TR` — K4-25; `ScoreRow` thêm nhận xét/GV chấm) | **không sửa** — chỉ gọi `loadBundle`, `resultOf`; **không** import `CRITERIA_SHORT` (HSM xoá) | — |
| Mọi tệp giao diện | **PR-SANG** (chạy **sau cùng**, đổi token sáng/tối) | ngăn mới **chỉ dùng token** `var(--…)`/lớp có sẵn, không mã màu cứng — SANG không phải sửa tay | SANG gỡ sau |
| `CODE_MAP.md`, `TU_DIEN_VA_CHU.md`, `DEMO.md`, `plan.md` | mọi PR | chỉ thêm dòng | giữ cả hai |

Đã đối chiếu (29/09): PR-XUAT **không** chạm `schema.sql`, `migrate/*`, `MockDetailPage.tsx`, `cham/*`, `BangCanHoTro.tsx`,
`PhanTichLopTab.tsx`, `classes.ts` (máy chủ hồ sơ lớp — Q8 dùng cờ `viewer` có sẵn). Kế hoạch PR-HSM, PR-HVL, PR-SANG đã đối chiếu —
xem mục "Đối chiếu kế hoạch PR-HSM" cuối tệp.

## Global Constraints

- **Một nguồn:** bộ cột và cách dựng dòng chỉ ở `shared/domain/xuatMt.ts` (`COT_FT_GON`, `COT_FT_THEM`, `bangFT`, bảng lớp thường); lọc + quyền chỉ ở
  `server/src/phanTich/xuatMt.ts` (`duLieuXuatMt`). Xem trước và xuất gọi **cùng** `duLieuXuatMt` → số dòng không thể lệch (YC-13.9
  nghiệm thu). Kết quả lượt **dùng lại** luật có sẵn: FT `resultOf` (kỳ vọng, SOS, Overall, W tổng), lớp thường `evaluateRegular`
  qua `evaluateAttemptRow`; KCK `luotKck` (Q29-1). **Không** viết lại luật SOS/kỳ vọng.
- **Kiểm dữ liệu nhập ở máy chủ** (ranh giới tin cậy): `docBoLocXuatMt` kiểm mọi tham số (số nguyên dương, ngày `YYYY-MM-DD` là thứ Hai,
  tháng `YYYY-MM`, từ ≤ đến, khoảng ≤ **104 tuần / 24 tháng**, đợt thuộc `mt:1…mt:8 | giua | cuoi`, ≤ 50 chi nhánh / 200 lớp) → sai trả
  **400 câu tiếng Việt**; chi nhánh/lớp ngoài phạm vi → **403**. Web kiểm trước chỉ để báo sớm.
- **SQL (bẫy Turso):** chỉ `?`/`?1` — **không** tham số đặt tên `{ x }`/`@x`/`:x` (`db.ts:24-30` ném lỗi); `IN (…)` dựng `?` theo số
  phần tử, chia lô ≤ 900 như `loadBundle`; **không** `UNION ALL` (nếu buộc phải dùng: ≤ 20 vế); **không N+1** — cả chi nhánh = một câu
  lượt + các câu lô của `loadBundle`. Số câu **không tăng theo số lượt** (phép kiểm Task 2 + trần
  `tocDoDuong.ts`). Chỉ đọc, trừ **một** `writeAudit` ở POST.
- **Netlify:** phản hồi ≤ **6 MB**, hàm ≤ **10 s**. Máy chủ trả **mảng hai chiều** (tiêu đề một lần, không lặp khoá JSON) và chặn trên
  **10 000 lượt** mỗi lần xuất ("Quá 10 000 lượt — thu hẹp chi nhánh hoặc thời gian", 400). Thư viện `xlsx` **chỉ ở trình duyệt**
  (nạp động) — không vào gói hàm Netlify.
- **Excel:** điểm/band/kỳ vọng/SOS/% là **ô số** (JS `number`), thiếu = **ô trống** (`null`, không `'—'`, không `''`); chữ tiếng Việt
  có dấu giữ nguyên (xlsx là XML UTF-8 — **không dùng CSV**, Q1). Tên sheet có dấu được (≤ 31 ký tự, không `: \ / ? * [ ]`). Tên tệp
  **ASCII** (bỏ dấu) `Pisa-Tracking_MT_{phạm vi}_{khoảng}.xlsx`. Hàng tiêu đề có `!autofilter`; `!cols` đặt độ rộng theo tiêu đề.
- **Chữ:** không lộ `attempt_no`, `kind`, mã kỹ năng, ngày ISO trong ngăn/tệp; tuần qua `report_periods.code` (có năm, ví dụ
  `W1 SEP 2026`) trong tệp và `tuanLich()` trên màn; tên môn lớp thường qua `tenMon(ct, k)` (MH3). Viết đủ "Quản lý", không "QL".
  Lớp thường **không** có cột/chữ SOS ở bất kỳ đâu (T58).
- **Tinh tế (bộ nhớ "giao diện tinh tế"):** ngăn dùng `KhungPanel`/`Khoi`/`Truong`, `BoLocDoan`, `NutChon`, `ONgay kieu="tuan"|"thang"`,
  `TimLop` có sẵn; cỡ chữ **≥ 12 px** (không `text-[10px]`/`text-[11px]` — PR-SANG quét); `tabular-nums` mọi số; chip ✓ bằng `NutChon` (không ký tự nhỏ Inter tự vẽ — bẫy "▾ Inter nhỏ = dấu
  chấm" → SVG); 375 px không cuộn ngang, nút bấm ≥ 44 px ở điện thoại. Chỉ token màu có sẵn (PR-SANG).
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web).

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. Ba chỗ **dễ sai nhất** có mã mẫu trong Task: `phamViXuatMt` (GV chỉ lớp **GVCN** — không dùng `scopeFor(ATTEMPT_VIEW)` thẳng vì GVBM
   cũng qua, K5-35), câu SQL "tuần của lượt = tuần **sớm nhất**" (không dùng `a.planned_period_id` — cột đó là tuần **hoàn tất** = muộn
   nhất, `skillSchedule.ts:386-405`), và ô trống là `null` (không `'—'`).
2. Không tự tính SOS/kỳ vọng/Overall/W tổng — gọi `resultOf(a, scores, skips)` (FT) và đọc `evaluateAttemptRow` (lớp thường).
3. 🛑 **Dừng hỏi planning** nếu: (a) cần cột/bảng/quyền mới; (b) số câu SQL xuất cả chi nhánh **tăng** khi nhân dữ liệu; (c) phép kiểm
   cũ phải **xoá**; (d) Task 7 đo trên Turso > 5 s hoặc Excel mở lỗi dấu; (e) sau rebase thấy HSM/HVL sửa dòng "chỉ XUAT" của bảng
   chồng file; (f) kế hoạch PR-HSM (khi đã có) đặt tên cột nhận xét/GV chấm khác mục "Đối chiếu kế hoạch PR-HSM".

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-xuat-xuat-excel-mt -b pr-xuat-xuat-excel-mt origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 4> -- docs/superpowers/plans/2026-09-29-pr-xuat-xuat-excel-mt.md`.
- [ ] Nhật ký: PR-HSM / PR-HVL / PR-S3F đã merge chưa (`git log origin/main --oneline | grep -E "PR-(HSM|HVL|S3F)"`); kế hoạch
  `docs/superpowers/plans/2026-09-29-pr-hsm-ho-so-mock.md` đã có chưa (Task 8 đọc).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**.
- [ ] Đối chiếu (grep): `export function loadBundle` (attempts.ts:88), `export function resultOf` (:179), `export function evaluateAttemptRow`
  (worklist/danhGia.ts:57), `export const luotKck` (:88), `export function evaluateRegular` (normal/regular.ts:171), `export function
  recomputeCompletionWeek` (skillSchedule.ts:394), `export const activeAt` (permissions.ts:139), `export function navOf` (platform/nav.ts:11),
  `const NHAN_NHAT_KY` (shared/domain/nhatKy.ts:6), `export const chuanTieuDe` (nhapHocVien.ts:80), `async function xuatExcel`
  (TongHopTestSos.tsx:114), `MenuDong muc={menu}` (DauTrangLop.tsx:115), `export const TRAN_GHI_LO` (tocDoDuong.ts:495) — lệch > 20 dòng thì
  ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-XUAT (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần: bộ lọc, bộ cột, dựng bảng, tên tệp (T40, K4-35, §7.8)

**Files:** tạo `shared/domain/xuatMt.ts` (+ `export * from './xuatMt.ts'` ở `shared/domain/index.ts`), `server/src/tests/prXuat.tests.ts`
(`runPrXuatTests`, đăng ký **cuối** `server/src/tests/run.ts` theo mẫu `runPrXlmtTests` :9795).

- [ ] **Kiểu + đọc bộ lọc** (ranh giới tin cậy — dùng chung cho query GET và body POST):
```ts
export type KhungXuat = 'ft' | 'thuong';
export type ThoiGianXuat =
  | { kieu: 'tuan'; tu: string; den: string }          // thứ Hai YYYY-MM-DD
  | { kieu: 'thang'; tu: string; den: string }         // YYYY-MM
  | { kieu: 'dot'; dot: string[] };                    // 'mt:1'…'mt:8' | 'giua' | 'cuoi'
export type BoLocXuatMt = { khung: KhungXuat; chiNhanh: number[]; lop: number[]; thoiGian: ThoiGianXuat;
  chiDuDiem: boolean; cot: 'gon' | 'day-du' };
export const XUAT_TOI_DA_LUOT = 10_000;
/** Trả bộ lọc sạch hoặc CÂU LỖI tiếng Việt. `o` = query (chuỗi, danh sách "1,2") hoặc body JSON. */
export function docBoLocXuatMt(o: Record<string, unknown>): BoLocXuatMt | string { /* … */ }
```
  Luật: `khung` ∈ 2 giá trị (mặc định `ft`); `chiNhanh`/`lop` = số nguyên dương, bỏ trùng, ≤ 50 / 200; tuần phải là thứ Hai
  (`mondayOfDate(x) === x`); tháng `/^\d{4}-(0[1-9]|1[0-2])$/`; `tu ≤ den`; ≤ 104 tuần, ≤ 24 tháng; đợt hợp khung (FT chỉ `mt:1…mt:8`,
  thường chỉ `giua|cuoi`), ≥ 1 đợt; `cot` mặc định `gon`; `chiDuDiem` mặc định `false`.
- [ ] **Bộ cột FT** (thứ tự T40; cột đầy đủ **nối sau** để 16 cột gọn giữ vị trí):
```ts
export const COT_FT_GON = ['Mã', 'Tên', 'Chi nhánh', 'Lớp', 'Lộ trình', 'MT', 'Tuần', 'L', 'R', 'W', 'S', 'Overall', 'Target',
  'Kỳ vọng', 'SOS', 'Trạng thái lượt'] as const;                                   // 16 cột — K4-35(c)
/** T39/K4-25: W1 `TA CC LR GRA`, W2 `TR CC LR GRA`. ponytail: bảng riêng cho xuất — PR-HSM merge thì dùng `tieuChiNganCua` (Task 8). */
const TIEU_CHI = { writing1: ['TA', 'CC', 'LR', 'GRA'], writing2: ['TR', 'CC', 'LR', 'GRA'], speaking: ['FC', 'LR', 'GRA', 'P'] } as const;   // KHÔNG import CRITERIA_SHORT — PR-HSM xoá nó
export const COT_FT_THEM = ['W1', 'W2', ...TIEU_CHI.writing1.map((t) => `W1 ${t}`), ...TIEU_CHI.writing2.map((t) => `W2 ${t}`),
  ...TIEU_CHI.speaking.map((t) => `S ${t}`), 'Tuần L', 'Tuần R', 'Tuần W', 'Tuần S', 'Người nhập'];
```
- [ ] **Dòng FT** — dữ liệu máy chủ đã tính (shared không có SQL): `DongFT = { ma, ten, chiNhanh, lop, loTrinh, mt: number, tuan: string
  (mã tuần có năm), l, r, w, s, overall, target: number | 'KCK' | null, kyVong, sos: number | null, trangThai: string, w1, w2,
  tieuChi: Record<'writing1'|'writing2'|'speaking', (number|null)[]>, tuanKn: Record<'listening'|'reading'|'writing'|'speaking', string|null>,
  nguoiNhap: string | null }`. `bangFT(dong, cot): (string|number|null)[][]` — hàng 1 tiêu đề, `MT` in `MT3` (chữ), mọi điểm là số hoặc
  `null`. **KCK** (Q29-1): `Target = 'KCK'`, `Kỳ vọng = null`, `SOS = null`.
- [ ] **Trạng thái lượt** (MT/XLMT "Chuyển cho", T34, K4 dòng 92): `trangThaiLuotXuat({ coDiem, yeuCau, du, lichSu, huyPhan, tamThoi, kck })`
  → phần chính `Đủ điểm` · `Thiếu điểm 2/4` · `Chưa có điểm`, nối ` · ` phần phụ theo thứ tự `lịch sử` · `đã huỷ phần còn lại` ·
  `SOS tạm thời` (chỉ khi `tamThoi && !kck`, chỉ FT) · `không cam kết`. Ví dụ `Thiếu điểm 2/4 · lịch sử`.
- [ ] **Sheet "Bộ lọc đã dùng"** `bangBoLoc({ nguoiXuat, luc, moTa: [nhãn, giá trị][], soLuot })` → hai cột `Mục | Giá trị`: Người xuất · Lúc
  (dd/mm/yyyy hh:mm giờ VN) · Khung · Chi nhánh · Lớp (hoặc "Mọi lớp trong phạm vi") · Thời gian · Lượt · Cột · Số lượt · rồi **Cách đọc**:
  "Tuần của lượt = tuần sớm nhất trong các kỹ năng phải thi" · "SOS: 0 = đạt kỳ vọng, 1–3 = số kỹ năng dưới kỳ vọng; trống = chưa tính
  được hoặc học viên không cam kết" · "Overall chỉ có khi đủ 4 kỹ năng" · "Ô trống = chưa có điểm".
- [ ] **Tên tệp + xem trước:** `tenTepXuatMt({ khung, chiNhanhTen[], lopMa[], thoiGian })` → bỏ dấu bằng `chuanTieuDe` (có sẵn,
  `nhapHocVien.ts:80`), chỉ giữ `[A-Za-z0-9-]`, nối `_`: `Pisa-Tracking_MT_MB-BC_W1SEP-W4SEP.xlsx`; lớp thường
  `Pisa-Tracking_Test-lop-thuong_…`; > 3 chi nhánh/lớp → `4-chi-nhanh`; không chọn → `tat-ca`; đợt → `MT1-MT3`. `dongXemTruoc(d)` → chuỗi
  như M11: `PISA-000001 Nguyễn Minh An · MB FT 101 · MT3 · W3 SEP · L 6.0 · R 6.5 · W — · S — · SOS 2 tạm thời` (trên màn dùng `—` được).
- [ ] **Phép (1)** `prXuat.tests.ts`:
  (a) `docBoLocXuatMt` trả **câu lỗi** cho `tu > den`, tuần không phải thứ Hai, `thang=2026-13`, 105 tuần, đợt `mt:9`, đợt `giua` ở khung FT,
  `chiNhanh=abc`, `lop=-1`, 51 chi nhánh — và bộ lọc sạch (bỏ trùng id) cho một ca hợp lệ mỗi kiểu thời gian;
  (b) `bangFT(…, 'gon')[0]` đúng **16** tiêu đề theo thứ tự T40; `'day-du'` = 16 + `COT_FT_THEM`, 16 cột đầu không đổi;
  (c) dòng thiếu S: ô S/Overall là `null` (không `'—'`, không `''`); ô L `typeof === 'number'`; KCK → `'KCK'`, kỳ vọng/SOS `null`;
  (d) `trangThaiLuotXuat` đủ 5 ca (đủ · thiếu · chưa có · lịch sử + thiếu · huỷ phần + tạm thời); (e) `tenTepXuatMt` chỉ `[A-Za-z0-9_.-]`
  với chi nhánh "Cầu Giấy"; (f) **Excel mở đúng dấu:** dựng sổ bằng `xlsx` ở Node (`aoa_to_sheet` + `book_append_sheet(wb, ws, 'Mock Test')`
  + `'Bộ lọc đã dùng'`) → `XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })` → `XLSX.read(buf)`: tên sheet có dấu còn nguyên, ô B2 ===
  `'Nguyễn Minh An'`, ô điểm `t === 'n'`, ô thiếu **không có** trong sheet (không phải chuỗi rỗng).
- [ ] Commit `PR-XUAT (1): luật thuần xuất Excel — bộ lọc, bộ cột T40, trạng thái lượt, tên tệp`.

## Task 2 · Máy chủ: phạm vi, một câu lấy lượt, xem trước = xuất, nhật ký (T40, K5-35, K1-53, YC-13.9)

**Files:** tạo `server/src/phanTich/xuatMt.ts`; sửa `server/src/routes/index.ts` (2 route sau :630), `shared/domain/nhatKy.ts` (1 nhãn),
`shared/domain/dieuHuong.ts` (`NavQuyen.xuatMt` + `NAV_RONG`), `server/src/platform/nav.ts` (1 dòng), `server/src/tests/prXuat.tests.ts`.

- [ ] **Phạm vi xuất (K5-35)** — không dùng `scopeFor(ATTEMPT_VIEW)` thẳng (vai GV nhận **mọi** lớp phân công → GVBM xuất được cả lớp):
```ts
export type PhamViXuat = { tatCa: boolean; chiNhanh: number[]; lopGvcn: number[] };
export function phamViXuatMt(p: Principal, homNay = demoToday()): PhamViXuat {
  let tatCa = false; let laGv = false; const cn = new Set<number>();
  for (const g of p.grants) {
    if (!g.permissions.has(PERMISSIONS.ATTEMPT_VIEW)) continue;
    if (g.roleKey === 'teacher') { laGv = true; continue; }          // GV: chỉ lớp mình là GVCN (dưới)
    if (g.branchId === null) tatCa = true; else cn.add(g.branchId);  // QL chi nhánh · Quản trị · quyền cấp riêng
  }
  const lopGvcn = laGv ? [...new Set(p.assignments.filter((a) => a.isCore && activeAt(a, homNay)).map((a) => a.classId))] : [];
  return { tatCa, chiNhanh: [...cn], lopGvcn };
}
export const coPhamViXuat = (v: PhamViXuat) => v.tatCa || v.chiNhanh.length > 0 || v.lopGvcn.length > 0;
```
  Mảnh SQL: `1=1` khi `tatCa`; không thì `(c.branch_id IN (?…) OR c.id IN (?…))` (vế rỗng bỏ). Không phạm vi → 403 "Bạn chưa có phạm vi
  xuất kết quả Test — chỉ Quản lý, Quản trị và GVCN (lớp mình)." Chi nhánh hỏi ngoài phạm vi → 403 "Chi nhánh này nằm ngoài phạm vi bạn
  được xuất."; lớp: **một** câu `SELECT c.id, c.code FROM classes c WHERE c.id IN (…) AND <phạm vi>` → thiếu id nào thì 403 "Lớp {mã} nằm
  ngoài phạm vi bạn được xuất." (mẫu `phamViPhanTich`, `phanTich/phamVi.ts:15`).
- [ ] **Một câu lấy lượt** — tuần của lượt = tuần **sớm nhất** trong các kỹ năng phải thi (K4-35(b)); lượt dữ liệu cũ không có dòng kỹ năng
  → tuần của đợt. **Không** dùng `a.planned_period_id` làm tuần lọc — cột đó là tuần **hoàn tất** = muộn nhất (`skillSchedule.ts:386-405`):
```sql
SELECT a.id, a.kind, a.attempt_no, a.lich_su, a.class_id, a.target_at_attempt, a.student_id, a.cycle_id,
       cy.route, cy.khong_cam_ket AS kck, st.student_code, st.full_name,
       c.code AS class_code, c.branch_id, c.programme_code, b.name AS branch_name,
       t.week_start, t.code AS tuan_code, t.year AS tuan_nam, t.month AS tuan_thang
  FROM assessment_attempts a
  JOIN learning_cycles cy ON cy.id = a.cycle_id
  JOIN students st ON st.id = a.student_id
  JOIN classes c ON c.id = a.class_id
  LEFT JOIN branches b ON b.id = c.branch_id
  JOIN report_periods t ON t.id = COALESCE(
       (SELECT k.planned_period_id FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
         WHERE k.attempt_id = a.id AND k.required = 1 ORDER BY r2.week_start LIMIT 1),
       a.planned_period_id)
 WHERE a.status != 'cancelled' AND <khung> AND <phạm vi> [AND c.branch_id IN (?…)] [AND c.id IN (?…)] AND <thời gian>
 ORDER BY b.name, c.code, st.full_name, a.kind, a.attempt_no
 LIMIT ?            -- toiDa + 1 → thừa 1 dòng thì 400 "Quá 10 000 lượt — thu hẹp chi nhánh hoặc thời gian."
```
  Khung FT `a.kind = 'mock'`, thường `a.kind IN ('progress','final')`. Thời gian: tuần `t.week_start BETWEEN ? AND ?` · tháng
  `(t.year * 100 + t.month) BETWEEN ? AND ?` (tháng sở hữu của tuần, như mã `W1 SEP`) · đợt FT `a.attempt_no IN (?…)`, thường
  `a.kind IN (?…)` (`giua→progress`, `cuoi→final`). Chỉ `?` — **không** tham số đặt tên. Lượt chưa xếp tuần không vào tệp (Q6).
- [ ] **Tính dòng** `duLieuXuatMt(p, f, toiDa = XUAT_TOI_DA_LUOT)`: câu trên → `loadBundle(ids)` (có sẵn; điểm + `entered_by_name`, lịch từng kỹ
  năng, bỏ kỹ năng — chia lô 900) → FT: `resultOf(a, scores, skips)` lấy `bands`, `overall`, `expectation`, `sosLevel`, `provisional`,
  `complete`, `scoredRequired`, `required`; W1/W2 + 4 tiêu chí từ `scores` (`band`, `c1…c4`); tuần từng kỹ năng `skillRows[].period_code`;
  `huyPhan` = có dòng kỹ năng `required && sit_status === 'cancelled'`; KCK `luotKck(a)` → bỏ kỳ vọng/SOS. `chiDuDiem` lọc `complete`
  **sau** khi tính (đếm xem trước cũng sau lọc). Đếm: `luot` = số dòng, `hocVien` = số `student_id` khác nhau, `lop` = số `class_id` khác
  nhau. Người nhập = các `entered_by_name` khác nhau theo thứ tự L R W1 W2 S, nối `, ` — **không** câu thêm.
- [ ] **Route** (sau `/phan-tich/tong-hop/o`, :630; mẫu `requireAuth, wrap(...)`, `principalOf(req)`):
  `GET /xuat-mt/xem-truoc?khung&chiNhanh=1,2&lop=&tg=tuan&tu&den | tg=dot&dot=mt:1,mt:2&du=1&cot=gon` → `{ phamVi: { chiNhanh: {id, ten}[],
  lop: {id, ma, chiNhanhId, ft, daKetThuc}[] }, dem, dauDong: string[] (≤ 5), tenTep }` (danh sách chi nhánh/lớp trong phạm vi: 2 câu).
  `POST /xuat-mt` (body = bộ lọc) → `{ sheets: { ten, aoa }[], tenTep, dem }` + **một** `writeAudit({ actorUserId: p.userId, action:
  'mt.xuat_excel', entityType: 'xuat_mt', entityLabel: '312 lượt · MB · W1 SEP–W4 SEP 2026 · cột gọn', after: boLoc })`. Bộ lọc sai → 400
  (câu của `docBoLocXuatMt`). Nhãn `shared/domain/nhatKy.ts`: `'mt.xuat_excel': 'Xuất Excel kết quả Test'` (phép N1 (11) quét
  `action: '…'` — quên nhãn là đỏ). GET **không** ghi gì.
- [ ] **Cờ điều hướng:** `NavQuyen.xuatMt: boolean` (+ `NAV_RONG.xuatMt = false`); `navOf`: `xuatMt: coPhamViXuat(phamViXuatMt(p))`.
- [ ] **Phép (2)** (bộ demo, `TODAY` của bộ kiểm):
  (a) **Vai:** `P.mbManager` xuất MB được; hỏi `chiNhanh=<BC>` → 403; `P.admin` mọi chi nhánh; `P.coreTeacher` (GVCN MB FT 101) không lọc lớp
  → mọi dòng thuộc MB FT 101; hỏi lớp khác → 403; `P.subjectTeacher` (GVBM) → 403; `navOf(P.subjectTeacher).xuatMt === false`,
  `navOf(P.coreTeacher).xuatMt && navOf(P.mbManager).xuatMt`.
  (b) **Tuần sớm nhất:** trong giao dịch thử, một lượt MB FT 101: L/R/W tuần X, S tuần X+1 (sửa `attempt_skills.planned_period_id` rồi
  `recomputeCompletionWeek`) → lọc tuần `X–X` **có** lượt, `X+1–X+1` **không**, và `a.planned_period_id` = X+1.
  (c) **Nghiệm thu YC-13.9:** xem trước MB + 4 tuần → `dem.luot === POST.sheets[0].aoa.length - 1`; `du=1` giảm đúng số lượt thiếu điểm;
  lượt `status='cancelled'` không có; lượt huỷ phần có `đã huỷ phần còn lại`; MT lịch sử có `lịch sử`; em KCK có `KCK`.
  (d) **Không N+1:** `nguCanh.soCauSql()` quanh `duLieuXuatMt` cho **MB, một tuần** (vài lượt) và **MB, mọi đợt MT1–MT8** (nhiều lượt, cùng dạng bộ lọc) → **bằng nhau** và ≤ 8; ghi số đo vào Nhật ký.
  (e) **Nhật ký:** sau POST có đúng một dòng `audit_logs.action = 'mt.xuat_excel'` của người xuất, `entity_label` bắt đầu bằng số lượt;
  `nhanHanhDongNhatKy('mt.xuat_excel') === 'Xuất Excel kết quả Test'`; gọi xem trước không thêm dòng.
  (f) **Chặn trần:** `duLieuXuatMt(P.mbManager, f, 3)` → ném 400 "Quá 3 lượt…".
- [ ] Commit `PR-XUAT (2): máy chủ xuất kết quả MT — phạm vi GVCN/QL, tuần sớm nhất, xem trước = xuất, nhật ký`.

## Task 3 · Khung Lớp thường: sheet theo chương trình, tên môn MH3, % tổng, không SOS (T40, T58, K4-35(a), MH3)

**Files:** sửa `shared/domain/xuatMt.ts`, `server/src/phanTich/xuatMt.ts`, `server/src/tests/prXuat.tests.ts`.

- [ ] Khung `thuong`: gom lượt theo `c.programme_code` → **mỗi chương trình một sheet** `{mã CT} · Giữa–Cuối khoá` (ví dụ `FOU · Giữa–Cuối
  khoá`, ≤ 31 ký tự) — môn khác nhau giữa chương trình (FOU G+V/P, Pre FOU một ô Tổng hợp) nên một sheet chung sẽ sai tên cột (Q5). Thứ tự
  sheet theo mã CT; "Bộ lọc đã dùng" cuối cùng. Khung FT: sheet `Mock Test` (K4 (g)).
- [ ] Cột gọn: `Mã · Tên · Chi nhánh · Lớp · Bài · Tuần · {tenMon(ct, k)} % …(theo prog.skills) · % tổng · Trạng thái lượt`; đầy đủ nối
  mỗi môn `{tên} điểm` · `{tên} tổng` · `Tuần {tên}` rồi `Người nhập`. `Bài` = `nhanDot(kind, null)`. % = số `Math.round(ratio * 1000) / 10`
  (68.5); `% tổng` từ `evaluateRegular(prog.skills, scores, prog.code).tyLeTong` (có khi đủ điểm, không thì `null`). **Không** cột/chữ SOS,
  không "SOS tạm thời" trong trạng thái (T58). Pre FOU: một cột `Tổng hợp %`.
- [ ] **Phép (3):** `P.normalCoreTeacher` (GVCN MB FOU 12) xuất khung `thuong` → sheet `FOU · Giữa–Cuối khoá`, tiêu đề có `Grammar + Vocabulary %`
  và `Pronunciation %` (qua `tenMon`), không tiêu đề/ô nào chứa `SOS`, ô % là số; khung `thuong` + đợt `mt:1` → 400; `P.coreTeacher` (lớp FT)
  hỏi khung `thuong` → 0 lượt, không lỗi; một lượt Pre FOU (bộ demo có lớp Pre FOU thì dùng, không thì dựng trong giao dịch thử) → đúng một
  cột môn `Tổng hợp %`.
- [ ] Commit `PR-XUAT (3): khung Lớp thường — sheet theo chương trình, tên môn MH3, % tổng, không SOS`.

## Task 4 · Ngăn "Xuất Excel" + ba chỗ mở (M11, K4-34, §7.8) — impeccable `clarify` + `layout`

**Files:** tạo `web/src/modules/test/NganXuatMt.tsx`; sửa `web/src/modules/test/LichTestTab.tsx`, `web/src/modules/classes/DauTrangLop.tsx`,
`web/src/modules/classes/ClassOverviewPage.tsx`, `web/src/modules/phanTich/TongHopTestSos.tsx`, `server/src/tests/prXuat.tests.ts`.

- [ ] **`NganXuatMt({ khung, chiNhanh, lop, thoiGianMacDinh, onDong })`** trong `KhungPanel` (`rong="hep"`), tiêu đề **"Xuất kết quả Mock Test"**
  (FT) / **"Xuất kết quả Test lớp thường"**; công tắc khung `Fast Track | Lớp thường` là `BoLocDoan` **cục bộ** (không `CongTacKhung` — nó
  nhớ theo máy và đổi khung cả trang; mẫu PR-XLMT Task 7). Ba `Khoi`:
  1. **Phạm vi** — Chi nhánh: `NutChon` nhiều chọn từ `phamVi.chiNhanh`; chỉ một chi nhánh → một dòng chữ cố định, không nút. Lớp: chip lớp đã
     chọn (✕ bỏ) + ô tìm lớp (dùng lại `keHoach/TimLop.tsx` — dựng `LopKH` tối thiểu từ `phamVi.lop` lọc theo chi nhánh đã chọn và khung);
     trống = "Mọi lớp trong phạm vi". GVCN một lớp → lớp chọn sẵn, không ô tìm.
  2. **Thời gian** — `BoLocDoan` `Theo tuần | Theo tháng | Theo đợt`; tuần: hai `ONgay kieu="tuan"` (Từ tuần / Đến tuần), tháng: hai
     `ONgay kieu="thang"`, đợt: `NutChon` `MT1…MT8` (FT) hoặc `Giữa khoá · Cuối khoá` (thường), chọn nhiều. Câu phụ: "Điều kiện cộng dồn:
     chi nhánh × lớp × thời gian."
  3. **Lượt và cột** — `BoLocDoan` `Mọi lượt | Chỉ lượt đủ điểm` (mặc định Mọi lượt) và `Cột gọn | Cột đầy đủ` (mặc định gọn); dòng phụ
     liệt kê cột của lựa chọn (lấy từ `COT_FT_GON`/`COT_FT_THEM` — không gõ lại danh sách).
  **Xem trước** (luôn hiện): `312 lượt · 87 học viên · 6 lớp` (`tabular-nums`, đậm) + ≤ 5 dòng `dauDong` (chữ 12.5 px, một dòng, cắt `…`
  có `title`). Gọi `GET /xuat-mt/xem-truoc` **sau 400 ms** kể từ lần đổi lọc cuối (một hẹn giờ, huỷ hẹn cũ). 0 lượt → "Không có lượt nào
  khớp — đổi thời gian hoặc chi nhánh." và nút Xuất tắt. 400/403 → câu máy chủ ngay dưới Khối liên quan (`useLoiForm`). Điện thoại: dòng
  đếm vào `chan.dongTren` (như PR-XLMT). **Chân:** tên tệp chữ nhỏ · `Huỷ` · **`Xuất Excel`** (chính).
  **Xuất:** `api.post('/xuat-mt', boLoc)` → `const XLSX = await import('xlsx')` → mỗi sheet `aoa_to_sheet(aoa)`, sheet kết quả thêm
  `ws['!autofilter'] = { ref: ws['!ref'] }` và `ws['!cols']` = độ rộng theo tiêu đề (8…40 ký tự) → `book_append_sheet(wb, ws, ten)` →
  `XLSX.writeFile(wb, tenTep)`. Đang chạy: nút "Đang xuất…" tắt (không bấm đúp); xong Toast "Đã xuất {n} lượt"; lỗi Toast câu máy chủ,
  ngăn **giữ nguyên** lựa chọn.
- [ ] **Lịch Test** (`LichTestTab.tsx`, hàng lọc :210 — sau `flex-1`, cạnh `BranchFilter`): nút `Xuất Excel` (btn btn-sm, ≥ 44 px ở điện
  thoại) chỉ khi `session?.nav?.xuatMt`; mở ngăn với `khung = loai ?? 'ft'`, `chiNhanh = branchId`, `lop = lopDangLoc` (nếu đang lọc lớp),
  thời gian mặc định **Theo tuần**: tuần đầu của tháng chứa tuần đang xem → tuần đang xem.
- [ ] **Hồ sơ lớp ⋮** (`DauTrangLop.tsx:78-85`): mục `{ key: 'xuat-mt', nhan: 'Xuất Excel', onChon: () => onViec('xuat-mt') }` **sau** "Sửa thông
  tin lớp", **trước** đường kẻ Xoá/Kết thúc (khớp kế hoạch PR-HVL :59); hiện khi `nav.xuatMt && (viewer.isCoreTeacher || viewer.canPlanWeek)`
  (Q8 — không sửa máy chủ hồ sơ lớp); `ViecDauTrang` thêm `'xuat-mt'`. `ClassOverviewPage.tsx` (cạnh các panel :91-107): `{viec === 'xuat-mt'
  && <NganXuatMt khung={thuong ? 'thuong' : 'ft'} lop={{ id, ma }} chiNhanh={branchId} thoiGianMacDinh={{ kieu: 'dot', dot: <mọi đợt> }} onDong={dong} />}`
  — mặc định **mọi đợt** của lớp (Q7).
- [ ] **Phân tích › Tổng hợp Test** (`TongHopTestSos.tsx:211-213`): giữ nút cũ nhưng đổi chữ **"⤓ Xuất bảng này"** (xuất bảng tổng hợp đang xem);
  thêm nút **"Xuất kết quả từng lượt"** (khi `nav.xuatMt`) mở ngăn với `khung` theo `ct` (`ca-hai` → FT), chi nhánh/lớp đang lọc (Q9).
- [ ] **impeccable `clarify`** trên `NganXuatMt.tsx` + chữ ba nút (câu lỗi, câu rỗng, nhãn nhóm) — ghi trước → sau vào Nhật ký. **impeccable
  `layout`** trên ngăn ở 1440 và 375 px (ba khối thẳng cột, xem trước không đè nút, không cuộn ngang). Chỉ token màu có sẵn, cỡ chữ ≥ 12 px
  (không `text-[10px]`/`text-[11px]` — PR-SANG sẽ quét).
- [ ] **Phép (4)** (đọc nguồn, theo kiểu các phép UX đang có): (a) **không tệp nào** trong `web/src` có `from 'xlsx'` (chỉ `import('xlsx')` →
  thư viện ở chunk riêng); (b) `LichTestTab.tsx` có `nav?.xuatMt` và `<NganXuatMt`; (c) `DauTrangLop.tsx` có `'xuat-mt'`; (d) `NganXuatMt.tsx`
  gọi `/xuat-mt/xem-truoc` và `'/xuat-mt'`, không có `text-[10px]`, không mã màu `#`/`rgb(` cứng.
- [ ] Commit `PR-XUAT (4): ngăn Xuất Excel — Lịch Test, hồ sơ lớp ⋮, Phân tích › Tổng hợp Test`.

## Task 5 · Tốc độ (trần câu SQL) + tài liệu

**Files:** `server/src/tests/tocDoDuong.ts`, `server/src/tests/tocDo.run.ts`, `CODE_MAP.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `DEMO.md`, `plan.md`.

- [ ] `DUONG_DO` (khối `// PR-XUAT` cuối): `{ trang: 'Xuất Excel MT', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8',
  maChuDich: { GVBM: 403 } }` · `{ trang: 'Xuất Excel MT', vai: ['GVCN_THUONG'], url: '/xuat-mt/xem-truoc?khung=thuong&tg=dot&dot=giua,cuoi' }`.
  Chạy đo → `TRAN` mới = `max(sau + 10, ⌈sau × 1.3⌉)`, ghi số đo cạnh dòng.
- [ ] `TRAN_GHI_LO.xuatMtChiNhanh`: `POST /xuat-mt` vai QL, `{ chiNhanh: [MB], tg: 'dot', dot: mt:1…mt:8, cot: 'day-du' }` — đo **sau** khi
  nhân dữ liệu (`tocDo.run.ts:654`), `checkAsync` cuối tệp theo mẫu PR-XLMT (:711-723, `doGhi`) → trần cùng công thức. Số câu phải
  **không** tăng khi nhân dữ liệu (so với lần đo trước nhân, ghi cả hai vào Nhật ký) — tăng là N+1 → 🛑.
- [ ] Tài liệu: `CODE_MAP.md` (2 tệp mới + 2 route) · `thiet-ke/TU_DIEN_VA_CHU.md` (Xuất Excel · Cột gọn / Cột đầy đủ · Trạng thái lượt · Bộ lọc
  đã dùng · "tuần của lượt = tuần sớm nhất") · `DEMO.md` (một dòng: Lịch Test › Xuất Excel, đăng nhập Quản lý / GVCN) · `plan.md` (PR-XUAT).
- [ ] Commit `PR-XUAT (5): trần câu SQL đường xuất + tài liệu`.

## Task 6 · impeccable `audit` + `polish`, bấm thử theo vai (một lần)

- [ ] **impeccable `audit`** trên `NganXuatMt.tsx` và ba chỗ sửa → sửa mục thuộc phạm vi PR; **`polish`** (khoảng cách, thẳng cột, trạng
  thái tải/rỗng/lỗi). Ghi kết quả vào Nhật ký. Không đổi phông, màu, bố cục ngoài ngăn.
- [ ] Bấm thử theo **KIỂM** (dưới), 1440 + 375 px, ảnh "sau" (và "trước" của ba chỗ đặt nút, chụp trên `main`) vào `thiet-ke/anh/pr-xuat/`.
  Mở **mỗi** tệp tải về bằng `xlsx` ở Node (đọc lại: số sheet, tiêu đề, số dòng = số xem trước) — ghi vào Nhật ký. Dọn tệp `.xlsx` tạm.
- [ ] `npm run check` → commit `PR-XUAT (6): audit + polish ngăn xuất, ảnh bấm thử`.

## Task 7 · Thử trên Turso: bản nháp + DB THỬ, xuất một chi nhánh, đo thời gian, mở bằng Excel

Chạy **trước** khi rebase lên `main` có PR-HSM (nhánh có mã HSM mà DB THỬ chưa migrate HSM → bản nháp lỗi). Nếu nhánh đã có HSM: DB THỬ
phải migrate HSM trước (`TRIEN_KHAI.md` dòng ~480) — **không tự migrate**, hỏi chủ sản phẩm.

- [ ] Máy chủ ghi **một dòng log** mỗi lần xuất: `console.info('[xuat-mt] ${n} lượt · ${soCau} câu SQL · ${ms} ms')` (đếm `demHienTai()`,
  `performance.now()`) — không tên người, không dữ liệu học viên. (Giữ lại sau PR: dùng chẩn đoán trên bản chính.)
- [ ] `netlify status` đã đăng nhập đúng site → `netlify deploy --build` từ worktree (**bản nháp**, không `--prod`; nháp luôn nối DB **THỬ**
  — `TRIEN_KHAI.md` §8.1). Chưa đăng nhập / sai site → **dừng**, nhờ chủ sản phẩm chạy đúng lệnh này rồi gửi địa chỉ nháp.
- [ ] Mở nháp (trình duyệt đã đăng nhập Netlify — nháp đặt Private), đăng nhập **tài khoản demo** Quản lý (README), Lịch Test › Xuất Excel:
  (1) chi nhánh đông nhất, **Theo đợt MT1–MT8**, **Cột đầy đủ** → đo từ bấm tới tải xong (đồng hồ tay/DevTools) + đọc dòng `[xuat-mt]`
  trong log hàm (`netlify logs:function api` hoặc Netlify › Functions › api); (2) cùng lọc, xem trước đổi 3 lần → không lỗi. Đạt: máy chủ
  **≤ 5 s**, cả vòng ≤ 8 s (trần Netlify 10 s); vượt → 🛑 báo planning kèm số lượt/câu/ms.
- [ ] Mở tệp bằng **Excel trên Windows** (máy chủ sản phẩm nếu session không có Excel): dấu tiếng Việt đúng ở tên, lớp, chi nhánh, tên sheet
  "Bộ lọc đã dùng"; cột L R W S Overall căn phải (ô số) và `=AVERAGE(L:L)` ra số; ô thiếu trống; lọc tiêu đề hoạt động. Chụp màn Excel vào
  `thiet-ke/anh/pr-xuat/excel-windows.png`.
- [ ] Ghi Nhật ký: địa chỉ nháp (không ghi token), số lượt, câu SQL, ms, kết quả Excel. Commit `PR-XUAT (7): log thời gian xuất + kết quả thử trên Turso`.

## Task 8 · (chờ PR-HSM merge) Cột Nhận xét W · Nhận xét S · GV chấm S (YC-13.5, K4 (g))

Theo **hợp đồng dữ liệu** trong kế hoạch PR-HSM (`2026-09-29-pr-hsm-ho-so-mock.md` :71-82) — đã đối chiếu 29/09:

- [ ] `git fetch origin && git rebase origin/main` (HSM đã merge). `ScoreRow` có `comment`, `examiner_user_id`, `examiner_name`,
  `examiner_user_name` (HSM join sẵn trong `loadBundle` — **không** thêm câu SQL).
- [ ] `COT_FT_THEM` nối cuối: `'Nhận xét W'`, `'Nhận xét S'`, `'GV chấm S'`. Giá trị: `nhanXetW(W1.comment, W2.comment)` · `S.comment` ·
  `tenGvCham({ examinerUserName: S.examiner_user_name, examinerName: S.examiner_name })` (hàm của HSM, `shared/domain/nhanXet.ts`); thiếu →
  `null`. Ô nhận xét nhiều dòng giữ `\n` (Excel hiện xuống dòng khi bật Wrap).
- [ ] Bỏ bảng `TIEU_CHI` riêng của Task 1 → dùng `tieuChiNganCua('writing1'|'writing2'|'speaking')` (HSM `skills.ts`; HSM **xoá**
  `CRITERIA_SHORT`) — xoá luôn chú thích `ponytail:` tương ứng.
- [ ] **Phép (8):** lượt demo có nhận xét W1 + W2 + S và GV chấm tên ngoài (bộ demo HSM `buildHsmDemo`; không có thì ghi thẳng 3 ô trong giao
  dịch thử) → cột "Nhận xét W" = `"Task 1: …\nTask 2: …"`, "GV chấm S" = tên; lượt không nhận xét → ô trống (`null`); số câu SQL của
  phép (2)(d) **không đổi**. Cột gọn không có 3 cột này.
- [ ] Commit `PR-XUAT (8): cột Nhận xét W/S, GV chấm S (sau PR-HSM)`.

## Task 9 · Rebase, `/ponytail-review`, mở PR

- [ ] `git fetch origin && git rebase origin/main` — gỡ theo bảng "Chồng file"; `npm run check` một lần.
- [ ] **`/ponytail-review`** trên diff → sửa phát hiện trong phạm vi PR; liệt kê mọi chú thích `ponytail:` của PR trong thân PR (dự kiến:
  `TIEU_CHI` riêng nếu Task 8 chưa làm).
- [ ] Mở PR `PR-XUAT: xuất Excel kết quả Mock Test (YC-13.9, T40)` — thân PR: bảng mã YC/T/K → ảnh → đạt/không (§10.1) · số đo câu SQL + Turso
  (Task 7) · Task 8 đã/chưa làm · chú thích `ponytail:` · câu hỏi chủ sản phẩm còn mở. **Không tự merge.** Tắt 4177/5377, quét `tests/run.js`
  treo, dọn tệp tạm.

## KIỂM — kịch bản bấm thử (Task 6)

| # | Vai · chỗ | Làm | Phải thấy |
|---|---|---|---|
| X1 | QL Vy · Lịch Test | Xuất Excel → MB (chọn sẵn), Theo tuần W1–W4 SEP, Mọi lượt, Cột gọn | Xem trước `n lượt · k học viên · m lớp` + 5 dòng; tệp `Pisa-Tracking_MT_MB_W1SEP-W4SEP.xlsx`, sheet `Mock Test` 16 cột + `Bộ lọc đã dùng`; số dòng = n |
| X2 | QL Vy | đổi Chỉ lượt đủ điểm · Cột đầy đủ | số lượt giảm; tệp có W1, W2, 12 tiêu chí, Tuần L/R/W/S, Người nhập |
| X3 | QL Vy | Theo đợt MT3 + lớp MB FT 101 | chỉ MT3 lớp đó; em KCK: Target `KCK`, Kỳ vọng/SOS trống; MT lịch sử: `… · lịch sử` |
| X4 | QL Vy | gõ Từ tuần sau Đến tuần | câu lỗi dưới Thời gian, nút Xuất tắt |
| X5 | GVCN Hà · hồ sơ lớp MB FT 101 ⋮ | Xuất Excel | lớp chọn sẵn, không chọn được lớp khác; mọi đợt |
| X6 | GVBM Trang | Lịch Test, hồ sơ lớp | **không** có nút Xuất Excel; gọi thẳng API → 403 câu tiếng Việt |
| X7 | GVCN lớp thường | Lịch Test (khung Lớp thường) → Xuất | tiêu đề "Xuất kết quả Test lớp thường"; sheet `FOU · Giữa–Cuối khoá`, cột G+V %, P %, % tổng; không chữ SOS |
| X8 | Quản trị | Phân tích › Tổng hợp Test | hai nút "⤓ Xuất bảng này" · "Xuất kết quả từng lượt"; ngăn nhận chi nhánh đang lọc |
| X9 | mọi vai | 375 px | ngăn không cuộn ngang, nút ≥ 44 px, dòng đếm ngay trên nút |
| X10 | QL · Quản trị › Nhật ký | sau X1 | dòng "Xuất Excel kết quả Test · 312 lượt · MB · …" |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | Cho | Nguồn |
|---|---|---|
| Thêm cột "Sắp tới" vào tệp nếu chủ sản phẩm chọn cột đó ở M3 | PR-HVL (hoặc PR sau) | YC-11.2 |
| Ngăn xuất: cỡ chữ/màu theo chế độ sáng | PR-SANG | T15, E4 |
| Tệp xuất Lớp thường: hướng gợi ý theo dải % (`→ học lại`), kết luận lên FT | PR-LT2b | §6.3, T47–T50 |
| Bảng quyền Quản trị ghi "Xuất Excel kết quả Test: Quản lý/Quản trị theo phạm vi · GVCN lớp mình" (luật dựng từ quyền có sẵn, không phải dòng quyền) | PR-GV hoặc PR-Dọn | K1-53 |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | **`.xlsx` bằng `xlsx` 0.18.5 đã cài, dựng ở trình duyệt, nạp động.** Không CSV, không tự dựng XML, không thư viện mới | CSV UTF-8 BOM vẫn vỡ cột trên máy đặt dấu phân cách `;` (máy tiếng Việt — lý do PR-Pb Q13) và không có nhiều sheet; thư viện có sẵn, đã dùng ở 2 chỗ; ở trình duyệt thì không vào gói hàm Netlify. Lỗ hổng đã biết của 0.18.5 nằm ở **đọc** tệp lạ (prototype pollution, ReDoS) — PR chỉ **ghi** |
| Q2 | **Không quyền mới.** Phạm vi = quyền `attempt.view` không phải vai GV (QL chi nhánh / Quản trị) ∪ lớp đang là **GVCN** | K5-35; thêm quyền = migrate `role_permissions` (đặc tả: PR-XUAT không migrate) |
| Q3 | Tuần của lượt = tuần **sớm nhất** của các kỹ năng phải thi (K4-35(b)); "Theo tháng" = tháng sở hữu của tuần đó | Đặc tả đã chốt; ghi rõ trong sheet "Bộ lọc đã dùng" (xem Câu 1 — khác cách Phân tích đếm) |
| Q4 | Một lần xuất một **khung** (FT hoặc Lớp thường) — công tắc trong ngăn | M11 vẽ công tắc; hai khung khác cột hoàn toàn |
| Q5 | Lớp thường: **mỗi chương trình một sheet** `{CT} · Giữa–Cuối khoá` | Môn khác nhau (FOU G+V/P, Pre FOU Tổng hợp) — một sheet chung sai tên cột (MH3) |
| Q6 | Không xuất lượt **đã huỷ cả lượt** (luật Q-B: chỉ huỷ được lượt chưa có điểm) và lượt **chưa xếp tuần** | Không có điểm để xuất; lượt huỷ phần vẫn xuất kèm `đã huỷ phần còn lại` |
| Q7 | Mặc định thời gian: Lịch Test → Theo tuần (đầu tháng → tuần đang xem); hồ sơ lớp → Theo đợt, mọi đợt; Phân tích → Theo tuần theo khoảng đang xem | Mỗi chỗ mở đúng câu hỏi thường gặp nhất |
| Q8 | Mục ⋮ hồ sơ lớp hiện khi `nav.xuatMt && (isCoreTeacher \|\| canPlanWeek)` — không thêm cờ ở máy chủ hồ sơ lớp | Tránh chạm `classes.ts` (PR-HVL đang sửa); máy chủ xuất vẫn kiểm lại |
| Q9 | Phân tích › Tổng hợp Test: nút cũ đổi chữ "⤓ Xuất bảng này", nút mới "Xuất kết quả từng lượt" | Hai nút cùng chữ "Xuất Excel" sẽ lẫn |
| Q10 | Cột SOS là **số** 0–3 (0 = đạt), trống khi chưa tính được/KCK; "tạm thời" nằm ở Trạng thái lượt | K4-35(d) "ô số để lọc/tính"; giải thích ở sheet Bộ lọc |
| Q11 | Chặn **10 000 lượt** mỗi lần; máy chủ trả mảng hai chiều | 6 MB / 10 s của Netlify; 10 000 × 40 cột ≈ 3 MB JSON |
| Q12 | GVCN xuất theo lớp **của lượt** (`assessment_attempts.class_id`), chỉ phân công **đang hiệu lực** | "lớp mình" = lượt diễn ra ở lớp mình; em chuyển đi mang theo lượt cũ của lớp cũ |
| Q13 | Không thêm kịch bản demo (K5 §6 không có dòng PR-XUAT); dữ liệu nhận xét dùng bộ demo của HSM | Bộ demo đã đủ lượt đủ/thiếu/KCK/lịch sử/huỷ phần (PR-MT, XLMT, KCK) |
| Q14 | Tên tệp ASCII, sheet có dấu | Tên tệp có dấu dễ hỏng khi gửi qua Zalo/mail; tên sheet xlsx là UTF-8 (phép (1)(f)) |

## Mâu thuẫn nguồn ↔ mã thật

1. §7.8 đặt nút ở Kế hoạch Test; K4-34/T40/M11 (sau rà) đặt ở **Lịch Test** + hồ sơ lớp ⋮ + Phân tích → theo T40 (GVCN không vào được Kế hoạch Test).
2. §7.8 "sheet `Kết quả`" ≠ K4 (g) "sheet `Mock Test`" + sheet riêng lớp thường → theo K4 (g) (rà sau, đủ hai khung).
3. §7.8 cột gọn thiếu Chi nhánh/Lộ trình/Target/Trạng thái lượt → theo T40 (16 cột).
4. `assessment_attempts.planned_period_id` = tuần **hoàn tất** (muộn nhất, `skillSchedule.ts:386-405`) — Phân tích › Tổng hợp đếm theo cột
   này; K4-35 chốt tuần **sớm nhất** cho xuất → số theo tuần của tệp có thể khác Phân tích với lượt trải hai tuần (Câu 1).
5. YC-13.9 "Hiện trạng" nói có nút xuất ở Phân tích › Tổng hợp Test — nút đó xuất **bảng tổng hợp** (`bangXuatTongHop`), không phải từng lượt.
6. K1-53 "PR-XUAT thêm quyền xuất Excel MT" ≠ §8 "không migrate" + K5-35 "kiểm riêng" → không thêm quyền (Q2); ghi luật vào bảng quyền → Chuyển cho.
7. "Thi lại" (XLMT "Chuyển cho" :554) **không để lại dấu** trong điểm (điểm cũ xoá, chỉ còn ở lịch sử) → Trạng thái lượt không ghi "thi lại".
8. `CRITERIA_SHORT.writing` = `TA…` cho cả W1 và W2 (sai với T39/K4-25 `TR` cho W2) — PR-HSM sửa và **xoá** `CRITERIA_SHORT` → Task 1 dùng bảng
   riêng, Task 8 chuyển sang `tieuChiNganCua`.

## Câu cần chủ sản phẩm quyết

1. **Lượt thi rải hai tuần (ví dụ L R W tuần 4 tháng 9, S tuần 1 tháng 10) tính vào tuần nào khi lọc "Theo tuần/Theo tháng"?** (A) **tuần
   sớm nhất — tuần bắt đầu thi** *(khuyến nghị — đặc tả K4-35 đã chốt; xuất "tháng 9" ra đủ các đợt bắt đầu trong tháng 9)* · (B) tuần
   thi xong (như Phân tích › Tổng hợp đang đếm) — số khớp Phân tích nhưng đợt bắt đầu cuối tháng 9 rơi sang tháng 10. Kế hoạch đang theo **(A)**.
2. **GVBM có được xuất kết quả kỹ năng mình dạy không?** (A) **Không — chỉ GVCN, Quản lý, Quản trị** *(khuyến nghị — đúng T40/K5-35; GVBM vẫn
   xem điểm trên lưới)* · (B) Có, chỉ lớp mình dạy. Kế hoạch đang theo **(A)**.

## Đối chiếu kế hoạch PR-HSM (29/09)

Kế hoạch `docs/superpowers/plans/2026-09-29-pr-hsm-ho-so-mock.md` đã có — mục "Hợp đồng dữ liệu cho PR-XUAT" (:71-82): 3 cột
`comment` / `examiner_user_id` / `examiner_name`; `ScoreRow` thêm `examiner_user_name` qua join trong `loadBundle` (không thêm câu);
hàm `nhanXetW`, `tenGvCham` (`shared/domain/nhanXet.ts`), `tieuChiNganCua` (`skills.ts`); cột Excel **"Nhận xét W" (gộp W1 + W2),
"Nhận xét S", "GV chấm S"**. Task 8 đã theo đúng tên này (bỏ ý "Nhận xét W1/W2 riêng"). HSM khuyến nghị merge **HSM trước XUAT**; HSM
**xoá** `CRITERIA_SHORT` → XUAT Task 1 không import nó. HSM không sửa `LichTestTab.tsx`. Kế hoạch PR-HVL (:59) đặt mục ⋮ "Xuất Excel" sau
"Sửa thông tin lớp", trước đường kẻ — khớp Task 4. Kế hoạch PR-SANG chạy sau XUAT, quét màu cứng và chữ < 12 px ở màn mới → Task 4 đã cấm.

## Nhật ký thực thi

<!-- Session code ghi ở đây: model thật, mốc B, dòng mã thật lệch, số câu SQL đo (trước/sau nhân dữ liệu), trước/sau clarify, kết quả
audit, số đo Turso (Task 7), Task 8 đã/chưa, 🛑 đã hỏi. -->

- **Task 0 (30/09):** model thật **Sonnet 5.5** (`Co-Authored-By: Claude Sonnet 5.5`). Worktree từ `origin/main` e7d6af94. PR-HSM / PR-HVL **chưa merge**
  (nhánh còn ở e7d6af94, không commit) → **Task 8 chưa làm**, PR mở không có Task 8. PR-S3F đã merge. Kế hoạch HSM/HVL có trên main.
  **Mốc B = 1722 phép kiểm** (`npm test`) + 24 phép tốc độ; `npm run check` xanh. Neo mã (loadBundle :88, resultOf :179, evaluateAttemptRow :57,
  luotKck :88, evaluateRegular :171, recomputeCompletionWeek :394, activeAt :139, navOf :11, chuanTieuDe :80, TongHopTestSos xuatExcel :114,
  DauTrangLop MenuDong :115, TRAN_GHI_LO :495, runPrXlmtTests :9795): khớp, không lệch.
- **Task 1–2:** 1734 phép kiểm sau Task 2 (mốc B 1722 + 12 phép PR-XUAT). `chuanTieuDe` **hạ chữ thường** nên tên tệp dùng hàm bỏ dấu riêng (giữ `MB`).
  Phép (2)(d) đo: **MB một tuần 8 câu / 1 lượt · MB MT1–MT8 8 câu / 525 lượt** (bằng nhau, ≤ 8; 1 câu là `demoToday()` — gọi một lần, không theo dòng).
  **Dữ liệu demo lệch giả định kế hoạch:** GVCN `Trần Ngọc Hà` là GVCN của **cả** `MB FT 101` và `MB FOU 12` → `P.coreTeacher` = `P.normalCoreTeacher`; phép Task 3
  "GVCN lớp FT hỏi khung thường → 0 lượt" đổi thành "…kèm lọc lớp MB FT 101 → 0 lượt". GVBM `P.subjectTeacher`: phép kiểm không giả định người đó không kiêm GVCN lớp khác.
- **Task 3:** khung thường xong ở Task 1–2 (cùng `duLieuXuatMt`); phép (3) thêm ở Task 3. Demo có sheet `FOU · Giữa–Cuối khoá` và `PREFOU · Giữa–Cuối khoá` (một cột `Tổng hợp %`).
- **Task 4 — clarify (trước → sau):** "Không chọn = mọi chi nhánh trong phạm vi của bạn" → "Để trống: xuất mọi chi nhánh bạn được xem." (lớp tương tự) · "Điều kiện cộng dồn: chi nhánh × lớp × thời gian." ("cộng dồn" khó hiểu)
  → "Lượt phải khớp cả chi nhánh, lớp và thời gian đã chọn. Mỗi lượt tính vào tuần thi sớm nhất của nó." · "Không có lượt nào khớp — đổi thời gian hoặc chi nhánh." → "… — mở rộng thời gian hoặc bỏ bớt chi nhánh, lớp."
  · thêm dòng nói rõ "Mọi lượt"/"Chỉ lượt đủ điểm" và "Cột trong tệp: …" · toast "Đã xuất n lượt — tệp {tên}" · câu lỗi 104 tuần/24 tháng có cách sửa ("rút ngắn khoảng thời gian").
  **layout** (Playwright kênh Chrome, Quản lý Vy): 1440 px ba khối thẳng cột, xem trước không đè nút; 375 px không cuộn ngang (scrollWidth = 375), dòng đếm nằm ngay trên nút, nút ≥ 44 px. Không cần sửa bố cục.
  Ngăn dùng `useLoiForm` (phép N1 (7) bắt mọi form `KhungPanel`): lỗi thời gian hiện ngay khi xảy ra. Nhãn "Lớp" của `TimLop` ẩn (`sr-only`) vì trùng nhãn khối.
- **Task 4/5 — dữ liệu demo lệch giả định:** `USER.GVBM` của bộ đo tốc độ (`subjectOnlyTeacherOf('MB FT 101')`) kiêm GVCN lớp khác nên xem trước cho người đó là **200** (xuất được lớp GVCN của họ), không 403 như kế hoạch dòng 328 ghi
  `maChuDich: { GVBM: 403 }` → bỏ vai GVBM khỏi `DUONG_DO`; 403 của GVBM thuần (Phạm Thu Trang) kiểm ở `prXuat.tests.ts`. Tên tệp: phạm vi chỉ có một chi nhánh (Quản lý, GVCN) thì tên chi nhánh vào tên tệp (`Pisa-Tracking_MT_Monbay_…`), không "tat-ca".
- **Task 5 — số đo tốc độ:** xem trước `GET /xuat-mt/xem-truoc` (MT1–MT8): QL/QT/GVCN **16 câu**, khung thường (GVCN_THUONG) **19 câu**, **không đổi sau khi nhân dữ liệu ×3** (bảng "trước → sau" không có dòng nào của đường này) → TRAN 26/26/26/29.
  `POST /xuat-mt` cả chi nhánh MB, MT1–MT8, cột đầy đủ, sau nhân dữ liệu: **16 câu / 550 lượt / 146 KB** (gồm ~8 câu của lớp HTTP + 1 `writeAudit`) → `TRAN_GHI_LO.xuatMtChiNhanh` = 26. Phép (2)(d) ở mức hàm: 8 câu cho cả 1 lượt và 525 lượt.
  Số phép: 1722 (mốc B) → **1739** + 25 tốc độ (24 + 1 phép POST xuất).
- **Task 6 — impeccable `audit` (bộ dò `impeccable detect` trên 5 tệp giao diện: 0 phát hiện; đọc tay thêm):** Trợ năng 3/4 (nhóm nút có `aria-label`, lỗi `role=alert`, xem trước `aria-live`; chip lớp có chữ ẩn "bỏ lớp") ·
  Hiệu năng 4/4 (xlsx nạp động, xem trước hẹn 400 ms, huỷ hẹn cũ) · Responsive 4/4 (375 px không cuộn ngang, mọi nút trong ngăn ≥ 44 px) · Theo token 4/4 (không mã màu, không chữ < 12 px) · Toàn vẹn 4/4. Không có P0–P2.
  P3 (không sửa, ngoài phạm vi): hai nút `btn-sm` cạnh "Cột hiện ▾" ở Tổng hợp Test cao 32 px trên điện thoại (giống nút cũ cạnh đó). **polish:** không cần đổi khoảng cách/thẳng cột sau ảnh 1440/375; trạng thái tải ("Đang tính…"), rỗng, lỗi máy chủ và lỗi thời gian đều có.
- **Task 6 — bấm thử (Playwright kênh Chrome, đăng nhập demo, ảnh ở `thiet-ke/anh/pr-xuat/`, tệp mở lại bằng `xlsx` ở Node):**
  X1 QL Vy Lịch Test, W1–W4 SEP → xem trước 32 lượt · 32 học viên · 3 lớp; tệp `Pisa-Tracking_MT_Monbay_W1SEP-W4SEP.xlsx`: sheet `Mock Test` **32 dòng × 16 cột** + `Bộ lọc đã dùng` 13 dòng = số xem trước ✓.
  X2 Chỉ lượt đủ điểm + Cột đầy đủ → 4 lượt; 35 cột (16 + 19), có W1, W2, 12 tiêu chí, Tuần L, Người nhập ✓. X3 MT3 + lớp MB FT 101 → 30 lượt, chỉ MT3, chỉ lớp đó; KCK 2 em (Target `KCK`, Kỳ vọng/SOS trống); MT lịch sử `Chưa có điểm · lịch sử` ✓.
  X4 Từ tuần sau Đến tuần → "Tuần bắt đầu phải trước hoặc bằng tuần kết thúc." dưới Thời gian, nút Xuất tắt ✓. X5 GVCN Hà, hồ sơ lớp MB FT 101 ⋮ → ngăn có lớp chọn sẵn, Theo đợt, 92 lượt · 31 học viên · 1 lớp ✓
  (Hà cũng là GVCN MB FOU 12 nên khung Lớp thường có thêm lớp của mình — đúng luật "lớp mình"). X6 GVBM Trang: không nút ở Lịch Test, hồ sơ lớp không có ⋮ , gọi thẳng POST → **403** "Bạn chưa có phạm vi xuất kết quả Test — chỉ Quản lý, Quản trị và GVCN (lớp mình)." ✓
  X7 GVCN lớp thường: tiêu đề "Xuất kết quả Test lớp thường", 15 lượt · 10 học viên · 3 lớp; sheet `FOU · Giữa–Cuối khoá` 11 dòng × 12 cột (Listening %, Reading %, Grammar + Vocabulary %, Pronunciation %, % tổng…), `PREFOU · Giữa–Cuối khoá` 4 dòng × 9 cột; không chữ SOS ✓.
  X8 Quản trị › Phân tích › Tổng hợp Test: hai nút "⤓ Xuất bảng này" · "Xuất kết quả từng lượt"; ngăn mở, 55 lượt · 43 học viên · 7 lớp ✓. X9 375 px: scrollWidth 375/375, không nút < 44 px, dòng đếm ngay trên nút ✓.
  X10 Quản trị › Quyền và nhật ký: "Xuất Excel kết quả Test · 30 lượt · Monbay · Theo đợt: MT3 · cột gọn — Nguyễn Khánh Vy" ✓. Ảnh trước (main) / sau: `truoc-*` / `sau-*` (Lịch Test, hồ sơ lớp ⋮, Tổng hợp Test).
- **Task 8 (30/09, sau khi PR-HSM merge — rebase lên `ada8f6c4`):** rebase gặp xung đột chỉ ở các dòng "chỉ thêm" (`shared/domain/index.ts`, `server/src/tests/run.ts`, `DEMO.md`, `TU_DIEN_VA_CHU.md`, `plan.md`, `CODE_MAP.md`) — giữ cả hai. HSM không sửa dòng "chỉ XUAT" nào (🛑 (e) không xảy ra); tên cột đúng "Đối chiếu kế hoạch PR-HSM" (🛑 (f) không xảy ra).
  Bỏ bảng `TIEU_CHI` riêng và chú thích `ponytail:` → `tieuChiNganCua`; thêm `Nhận xét W` (`nhanXetW(W1.comment, W2.comment)`), `Nhận xét S`, `GV chấm S` (`tenGvCham`) cuối `COT_FT_THEM`. `loadBundle` của HSM đã join sẵn tên GV → **không thêm câu SQL** (phép (8): 8 câu, bằng lần đo trước). Số phép sau rebase + Task 8: **1759** + 25 tốc độ.
- **Task 7 — thử trên Turso (30/09, bản nháp Netlify, DB THỬ; tôi chạy `netlify deploy --build`, chủ sản phẩm bấm thử):** nháp `6abc0da9c767a3f6365b5f2b--pisa-tracking` (Private). Chủ sản phẩm xuất **tất cả chi nhánh · tất cả đợt · Cột đầy đủ**:
  **dưới 1 giây từ bấm tới tải xong** (đạt: máy chủ ≤ 5 s, cả vòng ≤ 8 s), tệp xuất thành công, mở bằng **Excel trên Windows**: dấu tiếng Việt đúng (tên, lớp, chi nhánh "Bãi Cháy", "Cẩm Phả"), điểm/band/Overall/Kỳ vọng/SOS là ô số căn phải,
  ô thiếu để trống, nút lọc ở hàng tiêu đề hoạt động, cột L R W S… đủ (ảnh `excel-windows.png`). Đợt 3 lần đổi bộ lọc liên tiếp: không báo lỗi. **Chưa ghi được** số câu SQL/ms trên Turso: `netlify logs:function` không đọc lại được log cũ
  (dòng `[xuat-mt] n lượt · m câu SQL · t ms` đã có trong mã, xem được ở Netlify › Functions › api). Không đo riêng `=AVERAGE(L:L)` (chủ sản phẩm không báo) — ô là số (`t:'n'`, kiểm ở phép (1)(f)).

> **Chủ sản phẩm chốt 30/09:** GVBM **không** xuất Excel — chỉ GVCN, Quản lý, Quản trị. Lượt rải hai tuần: tính theo tuần bắt đầu thi (tự quyết theo khuyến nghị).
