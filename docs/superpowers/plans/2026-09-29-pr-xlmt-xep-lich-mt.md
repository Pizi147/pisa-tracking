# PR-XLMT · Xếp lịch MT mới + thao tác MT theo trạng thái — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Quản lý xếp lịch Mock Test cho **nhiều lớp một lần** (lọc chi nhánh · lớp · tìm em; em đã chọn lên đầu; đợt MT1…**MT8**;
4 kỹ năng mặc định **cùng tuần tới**, sửa riêng từng kỹ năng bên dưới). Mỗi em máy tự chọn **việc đúng**: đợt đủ điểm → sang MT kế
tiếp · đợt dở → **Xếp nốt** kỹ năng còn thiếu · đợt chưa thi → **Dời** · chưa có → **Tạo** (đánh số liền mạch) · chọn tuần **đã
qua** → tạo **MT lịch sử** (HS cũ). "Ép vào đợt trùng" = **thi lại** kỹ năng đã có điểm, hộp nói điểm đã có rồi mới hỏi. Thao tác
một kỹ năng mang **6 tên** (Dời lịch thi · Dời hạn chấm · Bỏ kỹ năng khỏi đợt · Báo vắng · Huỷ điểm · Huỷ lượt MTn), hiện **theo
trạng thái** (≤ 1 nút chính + ≤ 3 mục menu), lý do bắt buộc đúng chỗ, dùng **một hộp chung** ở hồ sơ Mock, hộp kỹ năng Kế hoạch
Test và **menu ⋯ từng ô lưới lớp thường**. Lưới Kế hoạch Test hiện đủ trạng thái (vắng · chờ duyệt · trễ · đã huỷ · dở · lịch sử)
và chip lọc **"Cần xếp lại (n)"**.
**Architecture:** Luật thuần mới ở `shared/domain/thaoTacMt.ts` (bảng thao tác theo trạng thái K4 §4d, luật lý do) và mở rộng
`shared/domain/keHoachTest.ts` (trạng thái chip, `viecXepMt`, `tuanMacDinhDotMoi`, chữ xem trước) + `shared/domain/lichMt.ts`
(`MT_TOI_DA`, `kiemTuanDaQua`, `mtDaThiChuaQua`). Máy chủ **gọi lại** hàm nghiệp vụ có sẵn (`createAttempt`, `setSkillWeek`,
`setSkillScope`, `setSkillDeadline`, `saveScore`, `settleGroup`, `huyLuot`) — chỉ thêm `baoVang` (absence.ts) và `thiLai`
(keHoachTest.ts). Web: ngăn mới `NganXepLichMt.tsx` (khung FT, nhiều lớp), `NganXepHangLoat.tsx` còn **khung Lớp thường**, hộp
chung `HopThaoTacMt.tsx`, dòng thời gian `DongThoiGianLuot.tsx`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); `npm run check` (`server/src/tests/*`).
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 **T37, T38** (+ T34, T36, T42, T67, Q-A, Q-B) · §4.7
**YC-13.4, YC-13.6** · §5.2 M7, M8 · §5.5 dòng "Ép xếp MT vào đợt trùng" · §7.2, §7.3, §7.5 · §8 dòng PR-XLMT · §9 UX-C **C3, C4** · §10 ·
mockup **M9** `thiet-ke/mockup/19-nang-cap-27-09.html:634-684` · báo cáo rà `thiet-ke/ra-27-09/K4.md` **§4(b)(d)(h)**, K1-21, K4-08, K4-10,
K4-11, K4-13, K4-14, K4-15, K4-17, K4-18, K4-19, K4-27, K4-28, K4-29, K4-32, K2-33 (1) phần xếp · thân PR #119/#117/#118/#120 bảng "Chuyển".

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-XLMT** · đợt 3 · làn **C** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-xlmt-xep-lich-mt` · `.claude/worktrees/pr-xlmt-xep-lich-mt` (từ `origin/main` @ 7b9ce37 trở đi) |
| Cổng thử | API **4177** · Vite **5377** (không dùng 4000/5173; A PR-SOS 4157/5357 · B PR-YT4 4167/5367 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng (T52) — rà **gọn** theo mức PR hẹp (không migrate, không quyền mới) |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Không.** Không cột mới: Dời hạn chấm = `attempt_skills.deadline_override`; Báo vắng = dấu "-" + `settleGroup`; Huỷ điểm = `saveScore` rỗng + lý do (RB-5). Database reset trước deploy → **không** lệnh sửa dữ liệu cũ |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR có giao diện). impeccable: **`clarify`** Task 5 (tên thao tác, câu hộp, câu lỗi), **`layout`** Task 6 + Task 7 (§7.2 — ngăn M9, lưới), **`audit`** rồi **`polish`** Task 11. Không `init`/`document`/`hooks on`/`npx impeccable install` |
| Phụ thuộc | **PR-MT #119** (đã merge: `lichMt.ts`, `kiemSoMtMoi`, `huyLuot`, `heQuaHuyLuot`, cờ `lich_su`, `taoMtMacDinh`) · **PR-DUYET #117** (thẻ Lịch thi, `TheYeuCau`) · **PR-MON #118** (bộ môn chương trình, `tenMon/tenMonNgan`, `CongTacKhung`). Không chờ PR-SOS/PR-YT4 |
| Không làm | Hồ sơ Mock M10 (ô điểm lớn, 4 tiêu chí, nhập MT lịch sử tại chỗ — **PR-HSM**) · xuất Excel (PR-XUAT) · luật SOS v4 khi Huỷ điểm/Thi lại thu hồi Case (PR-SOS — XLMT chỉ gọi `saveScore` có sẵn) · nút `ConfirmDialog` "Huỷ" → "Đóng" (PR-NEN/UXF) · bảng→thẻ điện thoại (PR-UXD) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-XLMT (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 11 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang
  id 9** · GVCN lớp thường: tài khoản `GVCN_THUONG` của `tocDoDuong.ts`), ảnh trước (main) / sau lưu `thiet-ke/anh/pr-xlmt/`. Chạy song
  song: `PORT=4177` cho API, Vite tạm cổng 5377 trỏ proxy về 4177 (bộ nhớ "Máy chủ dev trong worktree").
- Không chạm Turso, không deploy; chỉ DB demo trong worktree. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước khi báo
  xong: tắt 4177/5377, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Cổng rebase (ba PR đợt 3 chạy song song + PR-TOC #121 đang mở)

Trước Task 11: `git fetch origin && git rebase origin/main`. Merge trước thì PR sau gỡ theo bảng:

| File | PR khác sửa gì | PR-XLMT chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `server/src/routes/index.ts` | SOS, YT4: route Case/Ý thức mới | 2 route mới (`/bao-vang`, `/thi-lai`) đặt **ngay sau** `/attempts/:id/skills/:skill/restore`; thân `/ke-hoach-test/hang-loat` thêm 3 trường | khác khối — giữ cả hai |
| `server/src/tests/run.ts` | SOS, YT4, TOC: mỗi PR một dòng đăng ký | **một** dòng `await runPrXlmtTests(…)` cuối file | giữ mọi dòng, thứ tự theo merge |
| `shared/domain/index.ts` | SOS, YT4: export mới | 1 dòng `export * from './thaoTacMt.ts'` | giữ cả hai |
| `server/src/seed/seed.ts` | SOS, YT4: gọi seed của họ | 1 import + 1 lời gọi `buildXlmtDemo(…)` **sau** `buildPrMtDemo` | giữ mọi lời gọi |
| `server/src/fasttrack/attempts.ts` | SOS: **không sửa** (kế hoạch SOS dòng 66) | chỉ `setPlanningWeek` + `setDeadlineOverride` (lý do) và `attemptDetail.viewer` (1 cờ); Huỷ điểm/Thi lại **gọi** `saveScore`, không sửa | — |
| `server/src/fasttrack/absence.ts` | (không PR nào đợt 3) | thêm hàm `baoVang` cuối file | — |
| `server/src/classes/intake.ts`, `server/src/tests/tocDoDuong.ts` | **PR-TOC #121** viết lại `commitIntake` + thêm `TRAN_GHI_LO` | intake: **một** `luuY` trong khối báo trước MT lịch sử (:274-284); tocDo: đổi trần 2 dòng `/ke-hoach-test/*` (+1, có lý do) | TOC merge trước → giữ code TOC, chép lại `luuY`; XLMT merge trước → TOC giữ dòng `luuY` |
| `shared/domain/display.ts` | **SOS** `xac-minh-sos` → `xac-nhan-nguyen-nhan`; **YT4** bỏ 2 loại hạn Ý thức (`DEADLINE_KINDS`) | chữ `hen` (:365) "hẹn xử lý" → "dời hạn chấm" **chỉ** cho hạn nhập điểm (xem nơi gọi; loại hạn khác giữ chữ) | cùng file, khác dòng → giữ cả ba |
| `CODE_MAP.md`, `TU_DIEN_VA_CHU.md`, `DEMO.md`, `plan.md` | mọi PR | chỉ thêm dòng | giữ cả hai |

Đã đối chiếu kế hoạch PR-SOS và PR-YT4 (29/09): cả hai **không** chạm `keHoach/*`, `web/src/modules/test/*`, `MockDetailPage.tsx`,
`cham/LuoiThuong.tsx`, `skillSchedule.ts`, `absence.ts`; PR-SOS ghi rõ **không sửa** `attempts.ts`. Thấy khác khi rebase → dừng, báo planning.

## Global Constraints

- **Một nguồn:** "thao tác nào ở trạng thái nào" chỉ ở `thaoTacKyNang` (`shared/domain/thaoTacMt.ts`); "em này sẽ xếp gì" chỉ ở
  `viecXepMt`; web chỉ vẽ theo kết quả của hai hàm này. Máy chủ **kiểm lại** mọi luật chặn (chặn ở giao diện không thay chặn máy chủ).
- **Đánh số / huỷ lượt:** giữ nguyên chốt của PR-MT (`createAttempt` → `kiemSoMtMoi`, `cachHuyLuot`). Chỉ thêm trần `MT_TOI_DA = 8`.
- **Lý do** (K4-15): bắt buộc khi dời bài **tuần thi đã bắt đầu**, bỏ kỹ năng, báo vắng, huỷ điểm, huỷ lượt, dời hạn chấm, thi lại; xếp /
  đổi tuần **tương lai** không cần. Kiểm bằng `kiemLyDoThaoTac` (≥ `LY_DO_TOI_THIEU` ký tự) **ở máy chủ**.
- **SQL:** chỉ `?` (db.ts cấm tham số đặt tên); mọi ghi trong `tx()` (BEGIN IMMEDIATE, lồng = SAVEPOINT); `IN (…)` dựng `?` theo số phần
  tử; không UNION > 20 vế; không N+1. Trần `tocDoDuong.ts`: `/ke-hoach-test/lop` và `/ke-hoach-test/ft/*` được **+1** (một câu mới mỗi
  đường, ghi lý do cạnh số) — hơn +1 là 🛑.
- **Hàng loạt:** mỗi em một `tx` (R9b — lỗi em này không huỷ em khác); xem trước **không ghi**. Phép kiểm đo: xem trước 20 em / 2 lớp ≤
  **16 câu SQL mỗi em** (`soCauSql()` của `platform/nguCanhRequest.ts`).
- **Chữ:** tên môn luôn qua `tenMon/tenMonNgan(ct, k)`; tuần qua `tuanLich()`, ngày qua `ngay()`; không lộ `attempt_no`, `sit_status`,
  mã kỹ năng, ngày ISO. Sáu tên thao tác đúng chữ T38 (bảng `CHU_THAO_TAC`); riêng huỷ lượt giữ chữ PR-MT đã vào từ điển:
  **"Huỷ cả lượt MTn"** / **"Huỷ phần còn lại"** (Q2). Viết đủ "Quản lý", không "QL".
- **Tinh tế:** chip cao 20 px, ô lưới cao 44 px (G-2) giữ nguyên; trạng thái mới dùng token nghĩa (`late` vắng · `wait` chờ duyệt · `bad`
  trễ · `done` + gạch ngang đã huỷ); `tabular-nums` mọi số; ◐ vẽ bằng SVG 10 px (bẫy ký tự nhỏ Inter — bộ nhớ).
- **Giữ phép kiểm đọc nguồn cũ:** `prMon.tests.ts:426` (`th.data?.boMon`, `{ky.map(` trong `NganXepHangLoat.tsx`), `prMt.tests.ts:484-488`
  (`prog !== 'scored' && !d.lichSu && <div><DeadlinePill` trong `MockDetailPage.tsx`). Số phép kiểm không giảm.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web).

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. Bốn chỗ **dễ sai nhất** có mã mẫu trong Task: `viecXepMt` (thứ tự kiểm: huỷ → lịch sử → còn kỹ năng phải thi → dở/chưa thi),
   `thaoTacKyNang` (bảng — chép đúng, không "gộp cho gọn"), `kiemTuanDaQua` (so **Chủ nhật** tuần thi, không so thứ Hai), `baoVang`
   (gọi `settleGroup` có sẵn — **không** tự viết luồng dời lần 1/lần 2).
2. Không dựng đường ghi lịch thứ hai. Mọi đổi tuần đi qua `setSkillWeek`/`luuDot`; tạo lượt qua `xepMoi` → `createAttempt`.
3. 🛑 **Dừng hỏi planning** nếu: (a) cần thêm cột/bảng (kế hoạch **không migrate**); (b) phép kiểm cũ nào phải **xoá** thay vì sửa dữ liệu
   (thêm lý do / đổi sang tuần tương lai cho phép kiểm cũ gọi thiếu là **được**, ghi Nhật ký); (c) trần `tocDoDuong.ts` phải tăng quá +1;
   (d) `thiLai`/Huỷ điểm làm đỏ phép kiểm S08/SOS/Case (luật thu hồi là của PR-SOS); (e) sau rebase thấy PR-SOS/YT4 sửa file ở dòng
   "chỉ XLMT" của bảng cổng rebase. Không chạy lệnh nào có biến Turso.

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-xlmt-xep-lich-mt -b pr-xlmt-xep-lich-mt origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch> -- docs/superpowers/plans/2026-09-29-pr-xlmt-xep-lich-mt.md`.
- [ ] Nhật ký: PR-SOS / PR-YT4 / PR-TOC đã merge chưa (`git log origin/main --oneline | grep -E "PR-(SOS|YT4|TOC)"`).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**.
- [ ] Đối chiếu (grep): `export function luoiFT` (keHoachTest.ts:192), `function xetMotEm` (:596), `export function xepMoi` (:421),
  `function SkillWorkTable` (MockDetailPage.tsx:332), `export function setSkillScope` (skillSchedule.ts:686), `export function settleGroup`
  (absence.ts:706), `export function reportRegularNoShow` (regular.ts:498), `THU_TU_DOT` (phanTich.ts:141) — lệch > 20 dòng thì ghi bảng
  "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-XLMT (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần (T37, T38, K4 §4d, K4-11, K4-14, K4-15, K4-17, K1-21, K2-33)

**Files:** tạo `shared/domain/thaoTacMt.ts` (+ export ở `shared/domain/index.ts`), `server/src/tests/prXlmt.tests.ts` (`runPrXlmtTests`,
đăng ký **cuối** `run.ts`); sửa `shared/domain/lichMt.ts`, `shared/domain/keHoachTest.ts`, `shared/domain/phanTich.ts:141-142`.

- [ ] `lichMt.ts` — trần MT8 + tuần đã qua + nhắc "Đã thi tới MT":
```ts
export const MT_TOI_DA = 8;                                   // T37
// kiemSoMtMoi: NGAY SAU dòng kiểm `n < 1`:
if (n > MT_TOI_DA) return `Tối đa MT${MT_TOI_DA} cho một lộ trình.`;

/** K2-33(1): tuần đã qua CHỈ để TẠO MT lịch sử — mọi kỹ năng đều tuần đã qua VÀ em vào web sau các tuần đó. `ketThuc` = Chủ nhật tuần thi. */
export function kiemTuanDaQua(o: { ketThuc: string[]; ngayVaoWeb: string; homNay: string; taoMoi: boolean }): { cau: string | null; lichSu: boolean } {
  const qua = o.ketThuc.filter((w) => laLichSu(w, o.homNay));
  if (!qua.length) return { cau: null, lichSu: false };
  if (!o.taoMoi) return { cau: 'Không dời vào tuần đã qua — chọn tuần từ tuần này trở đi.', lichSu: false };
  if (qua.length < o.ketThuc.length) return { cau: 'Tuần đã qua chỉ dùng để nhập MT lịch sử — chọn tuần đã qua cho mọi kỹ năng.', lichSu: false };
  const muonNhat = [...qua].sort()[qua.length - 1];
  if (o.ngayVaoWeb.slice(0, 10) <= muonNhat.slice(0, 10)) return { cau: 'Em đã có trên web từ trước tuần này — không xếp MT lịch sử vào tuần em đã học trên web.', lichSu: false };
  return { cau: null, lichSu: true };
}

/** Rà #120: "Đã thi tới MT" = d mà MT(k+1)…MT(d) rơi vào tuần chưa qua → số MT đó (để nhắc lùi Tuần bắt đầu). */
export function mtDaThiChuaQua(route: string | null, tuanBatDau: string, daThiToiMt: number, homNay: string): number[] {
  return Array.from({ length: daThiToiMt }, (_, i) => i + 1)
    .filter((n) => !laLichSu(addDaysIso(tuanBatDau, (tuanHocCuaMt(route, n) - 1) * 7 + 6), homNay));
}
```
- [ ] `phanTich.ts` (K1-21) — thay bảng cứng:
```ts
export function thuTuDot(khoa: string): number {                 // mt:n → n; Giữa/Cuối khoá đứng sau mọi MT
  const n = khoa.startsWith('mt:') ? Number(khoa.slice(3)) : NaN;
  return khoa === 'giua' ? 1000 : khoa === 'cuoi' ? 1001 : Number.isInteger(n) && n > 0 ? n : 9999;
}
```
- [ ] `keHoachTest.ts` — trạng thái chip (K4-11, K4-18(3)). `TrangThaiO` thêm `'vang' | 'cho-duyet' | 'tre' | 'da-huy'`; `trangThaiNhom`
  nhận thêm cờ **tuỳ chọn** `huy?`, `vang?`, `choDuyet?`, `tre?` (vắng mặt = kết quả cũ — phép kiểm `keHoachTest.tests.ts:666` giữ xanh).
  Thứ tự: không bắt buộc → `khong-yeu-cau` · mọi kỹ năng xong → `xong` · có `choDuyet` → `cho-duyet` · có `vang` → `vang` · có tuần null →
  `chua-xep` · có `huy` → `da-huy` · có `tre` → `tre` · có `daDoi` → `da-doi` · còn lại `da-xep`. `OKyNang` thêm `sit: string | null`,
  `tuanKetThuc: string | null`, `choDuyet: boolean` (hộp và menu cần). `DotFT` (web `kieu.ts` + máy chủ) thêm `do: boolean` (dở: có kỹ năng
  xong và còn kỹ năng phải thi) và `huyPhan: boolean`.
- [ ] `keHoachTest.ts` — mặc định đợt mới + việc từng em (K4-14, K4-17, T37):
```ts
/** K4-14, M9: đợt mới — 4 kỹ năng CÙNG tuần tới (thứ Hai sau thứ Hai tuần này). Hộp kỹ năng và ngăn Xếp lịch MT dùng chung. */
export function tuanMacDinhDotMoi(homNay: string): string { return addDaysIso(mondayOfDate(homNay), 7); }

export type KnXep = { skill: KyNangKH; batBuoc: boolean; coDiem: boolean; daThi: boolean; huyPhan: boolean; choDuyet: boolean };
export type LuotXep = { no: number; huy: boolean; lichSu: boolean; kn: KnXep[] };
export type ViecXep =
  | { loai: 'tao'; no: number } | { loai: 'doi'; no: number } | { loai: 'xep-not'; no: number; kyNang: KyNangKH[] }
  | { loai: 'da-du'; no: number; coDiem: KyNangKH[] } | { loai: 'chan'; no: number; cau: string };

/** K4-17 · T37 · M9: từ đợt đã chọn đi tới đợt ĐẦU TIÊN còn việc. `ep` = Quản lý bấm chip CHÍNH đợt đó cho riêng em (không tự chuyển):
 *  đợt đã đủ → `da-du` (web hỏi thi lại). Thứ tự kiểm cố định — không đảo. */
export function viecXepMt(ds: LuotXep[], chon: number, so: LuotSo[], ep = false): ViecXep {
  for (let n = chon; n <= MT_TOI_DA; n++) {
    const a = ds.find((x) => x.no === n && !x.huy);
    if (!a) { const loi = kiemSoMtMoi(so, n); return loi ? { loai: 'chan', no: n, cau: loi } : { loai: 'tao', no: n }; }
    if (a.lichSu) { if (ep) return { loai: 'chan', no: n, cau: `MT${n} là MT lịch sử — nhập bù điểm, không xếp lại.` }; continue; }
    const can = a.kn.filter((k) => k.batBuoc && !k.huyPhan);
    const conThi = can.filter((k) => !k.coDiem && !k.daThi && !k.choDuyet);
    if (!conThi.length) {
      if (can.some((k) => k.choDuyet)) return { loai: 'chan', no: n, cau: `MT${n} còn kỹ năng chờ Quản lý duyệt dời — trả lời đề nghị trước.` };
      const cd = can.filter((k) => k.coDiem).map((k) => k.skill);
      if (ep) return cd.length ? { loai: 'da-du', no: n, coDiem: cd } : { loai: 'chan', no: n, cau: `MT${n} đã thi, đang chờ chấm.` };
      continue;
    }
    if (can.some((k) => k.coDiem || k.daThi)) return { loai: 'xep-not', no: n, kyNang: conThi.map((k) => k.skill) };
    return { loai: 'doi', no: n };
  }
  return { loai: 'chan', no: MT_TOI_DA, cau: `Đã đủ MT${MT_TOI_DA} — tối đa của một lộ trình.` };
}
```
  `DongHangLoat` thêm trường tuỳ chọn `viec?: ViecXep['loai'] | 'thi-lai'`, `attemptNo?: number`, `lichSu?: boolean`, `canLyDo?: boolean`,
  `coDiem?: KyNangKH[]`. Thêm `chuSeXep(d, ct)` (cột "Sẽ xếp": `Dời MT3 · W3 OCT → W2 OCT` · `Xếp nốt W S · MT3` · `Tạo MT4 · W2 OCT` ·
  `Tạo MT4 · W3 AUG · MT lịch sử` · `Thi lại L · MT3` · câu chặn) và `tomTatXepMt(dong)` → `{ doi, xepNot, tao, thiLai, canhBao, chan, soEm, soBai }`.
- [ ] `thaoTacMt.ts` — bảng K4 §4d (T38, K4-27, K4-15). **Chép đúng:**
```ts
export type ThaoTac = 'nhap-diem' | 'sua-diem' | 'dat-lich' | 'doi-lich' | 'doi-han' | 'bo-ky-nang' | 'dua-lai' | 'bao-vang' | 'huy-diem'
  | 'xep-lai' | 'tra-loi-de-nghi' | 'khoi-phuc';
export const CHU_THAO_TAC: Record<ThaoTac, string> = {
  'nhap-diem': 'Nhập điểm', 'sua-diem': 'Sửa điểm', 'dat-lich': 'Xếp lịch', 'doi-lich': 'Dời lịch thi', 'doi-han': 'Dời hạn chấm',
  'bo-ky-nang': 'Bỏ kỹ năng khỏi đợt', 'dua-lai': 'Đưa lại vào đợt', 'bao-vang': 'Báo vắng', 'huy-diem': 'Huỷ điểm',
  'xep-lai': 'Xếp lại bài vắng', 'tra-loi-de-nghi': 'Trả lời đề nghị dời', 'khoi-phuc': 'Khôi phục và đặt tuần',
};
export type TrangThaiTT = 'khong-yeu-cau' | 'chua-xep' | 'chua-toi-tuan' | 'dang-thi' | 'co-diem' | 'vang' | 'cho-duyet' | 'da-huy' | 'lich-su';
export function trangThaiTT(o: { batBuoc: boolean; tuanBatDau: string | null; coDiem: boolean; sit: string | null; choDuyet: boolean;
  lichSu: boolean; homNay: string }): TrangThaiTT {
  if (!o.batBuoc) return 'khong-yeu-cau';
  if (o.coDiem) return 'co-diem';
  if (o.lichSu) return 'lich-su';          // lượt lịch sử chưa điểm: chỉ nhập bù — không dời, không vắng, không hạn
  if (o.sit === 'cancelled') return 'da-huy';
  if (o.choDuyet) return 'cho-duyet';
  if (o.sit === 'absent') return 'vang';
  if (!o.tuanBatDau) return 'chua-xep';
  return o.tuanBatDau.slice(0, 10) > mondayOfDate(o.homNay) ? 'chua-toi-tuan' : 'dang-thi';
}
export type QuyenTT = { nhapDiem: boolean; quanLy: boolean; gvcn: boolean; laFt: boolean; dotHoanTat: boolean };
/** ≤ 1 nút chính + ≤ 3 mục menu (K4-27). "Lịch sử" KHÔNG nằm trong menu dòng — ở dòng thời gian của đợt (YC-13.6). */
export function thaoTacKyNang(tt: TrangThaiTT, q: QuyenTT): { chinh: ThaoTac | null; menu: ThaoTac[] } {
  const ql = q.quanLy, ftQl = q.laFt && q.quanLy;
  switch (tt) {
    case 'khong-yeu-cau': return { chinh: ftQl ? 'dua-lai' : null, menu: [] };
    case 'chua-xep': return { chinh: ql ? 'dat-lich' : null, menu: ftQl ? ['bo-ky-nang'] : [] };
    case 'chua-toi-tuan': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [...(ql ? ['doi-lich'] : []), ...(ftQl ? ['bo-ky-nang'] : [])] as ThaoTac[] };
    case 'dang-thi': return { chinh: q.nhapDiem ? 'nhap-diem' : null,
      menu: [...(q.gvcn || ql ? ['bao-vang'] : []), ...(ql ? ['doi-han', 'doi-lich'] : [])] as ThaoTac[] };
    case 'co-diem': return { chinh: q.nhapDiem ? 'sua-diem' : null, menu: (q.dotHoanTat ? ql : q.nhapDiem || ql) ? ['huy-diem'] : [] };
    case 'vang': return { chinh: q.gvcn || ql ? 'xep-lai' : null, menu: [] };
    case 'cho-duyet': return { chinh: ql ? 'tra-loi-de-nghi' : null, menu: [] };
    case 'da-huy': return { chinh: ql ? 'khoi-phuc' : null, menu: [] };
    case 'lich-su': return { chinh: q.nhapDiem ? 'nhap-diem' : null, menu: [] };
  }
}
/** K4-15: lý do bắt buộc? Dời lịch thi chỉ bắt buộc khi tuần thi hiện tại đã bắt đầu. */
export function canLyDo(t: ThaoTac, tuanDaBatDau: boolean): boolean {
  if (t === 'doi-lich' || t === 'dat-lich') return tuanDaBatDau;
  return t === 'doi-han' || t === 'bo-ky-nang' || t === 'bao-vang' || t === 'huy-diem';
}
export function kiemLyDoThaoTac(ten: string, s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  if (!t) return `${ten}: cần ghi lý do.`;
  return t.length < LY_DO_TOI_THIEU ? `${ten}: lý do cần ít nhất ${LY_DO_TOI_THIEU} ký tự.` : null;
}
```
  (`co-diem`: `nhapDiem` = quyền sửa ô **thật** của người xem (`c.canEdit`, đã gồm R11) — Quản lý hiệu chỉnh sau hoàn tất có
  `canEdit` đúng nên vẫn có nút chính. Lượt lịch sử **có điểm** rơi vào `co-diem` như lượt thường — Sửa/Huỷ điểm đều qua RB-5.)
- [ ] **Phép kiểm** `prXlmt.tests.ts` khối 1: (a) `kiemSoMtMoi(ds có MT1…MT8, 9)` = câu "Tối đa MT8"; (b) `thuTuDot('mt:8') < thuTuDot('giua')`;
  (c) `viecXepMt`: MT3 đủ điểm → `tao` MT4 · MT3 có L R, thiếu W S → `xep-not [writing, speaking]` · MT3 chưa điểm → `doi` · MT3 lịch sử
  → sang MT4 · MT3 còn S chờ duyệt, L R W đủ → `chan` · `ep` MT3 đủ → `da-du [listening…]` · chưa có MT2 mà chọn MT3 → `chan` câu
  `kiemSoMtMoi`; (d) `kiemTuanDaQua` 4 nhánh; (e) **mọi** tổ hợp `TrangThaiTT × QuyenTT` (2⁵ quyền) → `chinh` ≤ 1, `menu.length ≤ 3`,
  không trùng, `bo-ky-nang` chỉ khi `laFt`; (f) `canLyDo('doi-lich', false) === false`; (g) `tuanMacDinhDotMoi('2026-09-16') === '2026-09-21'`.
- [ ] `npm run check` → commit `PR-XLMT (1): luật thuần thao tác MT, việc xếp từng em, trần MT8, tuần đã qua`.

## Task 2 · Máy chủ: lý do bắt buộc, chặn Bỏ kỹ năng, Báo vắng, Thi lại (T38, K4-13, K4-15, K4-28, T37 "ép")

**Files:** `server/src/fasttrack/skillSchedule.ts` (`setSkillWeek` :592, `setSkillScope` :686, `setSkillDeadline` :783),
`server/src/fasttrack/attempts.ts` (`setPlanningWeek` :1106, `setDeadlineOverride` :1176), `server/src/fasttrack/absence.ts` (thêm
`baoVang`), `server/src/normal/regular.ts` (`reportRegularNoShow` :498 nhận `lyDo`), `server/src/keHoach/keHoachTest.ts` (thêm `thiLai`),
`server/src/routes/index.ts`.

- [ ] **Lý do (K4-15)** — thêm tham số `today = demoToday()` khi cần:
  `setSkillWeek`: tuần hiện tại của kỹ năng đã bắt đầu (`row.week_start <= mondayOf(today)`) mà **không** phải bài vắng → `kiemLyDoThaoTac
  ('Dời lịch thi', opts.reason)`; bài vắng giữ lý do mặc định "Quản lý xếp trực tiếp" (K4-12 của PR-MT). `setPlanningWeek` cùng luật.
  `setSkillDeadline` / `setDeadlineOverride`: đặt ngày (khác null) → bắt buộc lý do `'Dời hạn chấm'`.
- [ ] **Chặn Bỏ kỹ năng (K4-13)** trong `setSkillScope` khi `required = false`, **sau** kiểm lớp thường và **trước** kiểm vắng:
```ts
if (hasScore(attemptId, row.skill)) throw badRequest(`${tenMon(null, skill)} đã có điểm — không bỏ khỏi đợt. Muốn bỏ điểm thì dùng "Huỷ điểm".`);
if (row.week_start && row.week_start.slice(0, 10) <= mondayOf(today)) {
  throw badRequest(`${tenMon(null, skill)} đã tới tuần thi — không bỏ khỏi đợt nữa. Em vắng thì dùng "Báo vắng".`);
}
```
  (`setSkillSkip` đã gọi `refreshOutcome` sau — không thêm.) Lý do dùng `kiemLyDoThaoTac('Bỏ kỹ năng khỏi đợt', reason)`.
- [ ] **Báo vắng FT (K4-28)** — `absence.ts`, cuối file. **Không** viết lại luồng dời: ghi "-" rồi gọi `settleGroup` (Q-A tự dời lần 1,
  lần 2 thành đề nghị — nằm sẵn trong đó):
```ts
/** T38 "Báo vắng": ghi "-" cho MỌI ô nhập của kỹ năng (W = W1 + W2) + chốt ngay + lý do. GVCN của lớp / Quản lý. */
export function baoVang(p: Principal, attemptId: number, skill: string, lyDo: string, today: string = demoToday()) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!canRequest(p, a)) throw forbidden('Chỉ giáo viên chủ nhiệm của lớp và Quản lý báo vắng được.');
  if (a.kind !== 'mock') throw badRequest('Bài lớp thường báo vắng ở bảng điểm lớp thường.');
  if (a.status === 'cancelled') throw badRequest('Đợt này đã huỷ.');
  if (a.lich_su) throw badRequest('MT lịch sử không vào luồng vắng — nhập bù điểm, không dời lịch.');
  const loi = kiemLyDoThaoTac('Báo vắng', lyDo); if (loi) throw badRequest(loi);
  const row = ensureSkillRows(attemptId).find((r) => r.skill === skill); if (!row?.required) throw badRequest('Kỹ năng không nằm trong đợt này.');
  if (row.sit_status !== 'scheduled' || !row.planned_period_id || !row.week_start || !row.week_end) throw badRequest(`${skillName(skill)} không ở trạng thái chờ thi.`);
  if (row.week_start.slice(0, 10) > mondayOf(today)) throw badRequest(`${skillName(skill)} chưa tới tuần thi — muốn đổi tuần thì "Dời lịch thi".`);
  const entries = entrySkillsOf(skill as AssessedSkill);
  return tx(() => {
    const ids: number[] = [];
    for (const e of entries) {
      const s = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, e) as any;
      if (s && ((s.band ?? null) !== null || (s.raw_score ?? null) !== null)) throw badRequest(`${skillName(skill)} đã có điểm — không báo vắng.`);
      if (s) conn.prepare(`UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0, no_show_settled_at = NULL WHERE id = ?`)
        .run(row.planned_period_id, p.userId, nowIso(), s.id);
      else conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at) VALUES (?,?,?,?,?)`)
        .run(attemptId, e, row.planned_period_id, p.userId, nowIso());
      ids.push((conn.prepare('SELECT id FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, e) as any).id);
    }
    settleGroup(conn, attemptId, row.id, skill, row.week_end!, row.period_code!, ids, p.userId, `Báo vắng: ${lyDo.trim()}`, today);
    const sau = ensureSkillRows(attemptId).find((r) => r.skill === skill)!;
    return { daDoi: sau.sit_status === 'scheduled', tuanMoi: sau.week_start, choDuyet: !!pendingMove(attemptId, skill) };
  });
}
```
  (Tên cột `assessment_scores` đúng như `settleNoShows` đọc — Task 0 grep `no_show_by` trong `schema.sql`; lệch thì theo schema.) Route
  `POST /attempts/:id/skills/:skill/bao-vang` `{ lyDo }` → `absenceSvc.baoVang`.
- [ ] **Báo vắng lớp thường (K4-32):** `reportRegularNoShow(p, id, skill, bat, today, lyDo?)` — có `lyDo` thì kiểm `kiemLyDoThaoTac` và ghi vào
  `logSchedule.reason`; quyền thêm **một vế OR**: người nhập được ô **hoặc** GVCN của lớp / Quản lý (`canRequest`-tương đương). Route cũ
  `PUT /regular/attempts/:id/scores/:skill` nhận thêm `lyDo` (gõ "-" trong ô vẫn không cần lý do).
- [ ] **Thi lại (T37 "ép vào đợt trùng", §5.5)** — `keHoachTest.ts`:
```ts
/** QL cho em thi lại kỹ năng ĐÃ CÓ ĐIỂM ở chính đợt đó: xoá ô (RB-5 ghi lý do, lịch sử giữ) → trạng thái "chờ thi" → tuần mới. Một tx. */
export function thiLai(p: Principal, i: { attemptId: number; skills: KyNangKH[]; periodId: number; lyDo: string; force?: boolean }) {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  if (a.kind !== 'mock' || a.lich_su || a.status === 'cancelled') throw badRequest('Chỉ thi lại được ở lượt Mock đang chạy.');
  const loi = kiemLyDoThaoTac('Thi lại', i.lyDo); if (loi) throw badRequest(loi);
  return tx(() => {
    for (const k of i.skills.map(chonKyNang)) {
      for (const e of entrySkillsOf(k as any)) {
        const s = scoresOf(i.attemptId).find((x) => x.skill === e);
        if (s && (s.band != null || s.raw_score != null)) {
          saveScore(p, i.attemptId, e, { rawScore: null, criteria: [null, null, null, null], lyDo: `Thi lại: ${i.lyDo.trim()}` });
        }
      }
      setSitStatus(p, i.attemptId, k, 'scheduled', `Thi lại: ${i.lyDo.trim()}`);
      setSkillWeek(p, i.attemptId, k, i.periodId, { reason: `Thi lại: ${i.lyDo.trim()}`, force: !!i.force });
    }
    return { ok: true as const };
  });
}
```
  (Task 0 kiểm chữ ký `ScorePatch` — `criteria` 4 ô có thể là 2 với L/R; dùng đúng kiểu. `setSitStatus` trả `unchanged` nếu đã
  `scheduled` — vô hại.) Route `POST /ke-hoach-test/thi-lai`.
- [ ] **Phép kiểm** khối 2: dời kỹ năng tuần này không lý do → lỗi "Dời lịch thi: cần ghi lý do"; tuần sau → được không lý do · Dời hạn chấm
  không lý do → lỗi · bỏ kỹ năng đã có điểm / đã tới tuần → hai câu chặn · Báo vắng GVCN (Hà) MT tuần này: lần 1 → `daDoi` + tuần kế tiếp,
  bộ đếm 1; lần 2 → `choDuyet` + thẻ Lịch thi (PR-DUYET) · Báo vắng GVBM (Trang) → 403 · Báo vắng tuần tương lai / MT lịch sử / đã có
  điểm → chặn · lớp thường Báo vắng có lý do → dời tuần sau, `attempt_schedule_history.reason` có lý do · `thiLai` L đã có điểm → ô trống,
  lịch sử điểm (`scoreHistoryOf`) còn giá trị cũ, `sit_status = 'scheduled'`, tuần mới đúng · GVCN gọi `thiLai` → 403. Phép kiểm cũ gọi
  thiếu lý do → **thêm lý do** (ghi danh sách vào Nhật ký).
- [ ] `npm run check` → commit `PR-XLMT (2): lý do bắt buộc, chặn bỏ kỹ năng, Báo vắng, Thi lại`.

## Task 3 · Máy chủ Kế hoạch Test: lưới đầy đủ, việc từng em, tuần đã qua (K4-08, K4-11, K4-17, K4-18, K2-33, T37, #120)

**Files:** `server/src/keHoach/keHoachTest.ts`, `server/src/routes/index.ts` (thân `/ke-hoach-test/hang-loat`), `server/src/classes/intake.ts:274-284`,
`server/src/tests/tocDoDuong.ts` (2 trần).

- [ ] `luoiFT` — (a) lượt lấy theo **lộ trình đang chạy của em**, không theo lớp (bỏ chú thích `ponytail:` của PR-MT — em chuyển lớp FT
  giữ lộ trình vẫn thấy MT cũ, `soKeTiep` đúng):
```sql
SELECT a.* FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
 WHERE a.kind = 'mock' AND a.student_id IN (…) ORDER BY a.attempt_no
```
  (b) cột = `1 … min(MT_TOI_DA, max(số lớn nhất còn hiệu lực, soKeTiep lớn nhất, lichMtMacDinh(route lớp).length))` — tính `hang` trước
  rồi mới dựng `cot`; (c) đề nghị dời chờ: `pendingMovesFor(attemptIds)` (**+1 câu**, sổ nhớ theo request); (d) `oKyNangCua` nhận `homNay`,
  `choDuyet`, trả `sit`, `tuanKetThuc`, `choDuyet` và cờ `vang` (`sit_status='absent'` không chờ duyệt), `huy` (`'cancelled'`), `tre`
  (tuần đã hết, chưa điểm, không vắng/huỷ, lượt không lịch sử); (e) `DotFT.do`, `DotFT.huyPhan`.
- [ ] `danhSachLop` — `canXepLai` mỗi lớp FT (**+1 câu**):
```sql
SELECT a.class_id, COUNT(DISTINCT a.student_id) AS n FROM attempt_skills k
  JOIN assessment_attempts a ON a.id = k.attempt_id AND a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock'
  JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
 WHERE a.class_id IN (…) AND k.required = 1 AND k.sit_status IN ('absent', 'cancelled')
   AND NOT EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.attempt_id = a.id AND r.skill = k.skill AND r.status = 'pending')
 GROUP BY a.class_id
```
  `tomTatLopFT` thêm vế `n em cần xếp lại` (khi n > 0). `tocDoDuong.ts`: `/ke-hoach-test/lop` 21 → **22**, `/ke-hoach-test/ft/3` 29 → **30**
  (chú thích cạnh số: "PR-XLMT: chờ duyệt / cần xếp lại").
- [ ] `xepHangLoat` + `xetMotEm` (K4-17, T37): body thêm `dotTheoEm?: Record<studentId, number>` (Quản lý bấm chip riêng — `ep = true`),
  `thiLai?: Record<studentId, KyNangKH[]>`, `lyDo?: string`. Khung FT: dựng `LuotXep[]` của em (từ `luotSoCuaLoTrinh` + `loadSkillRows` +
  `loadBundle` + `pendingMovesFor`, **gom cho cả danh sách em một lần** — không mỗi em một lượt câu) → `viecXepMt(ds, dotTheoEm[id] ??
  attemptNo, so, !!dotTheoEm[id])`:
  `tao` → nhánh "em chưa có đợt" cũ với `attemptNo = viec.no` + `kiemTuanDaQua({ taoMoi: true, ngayVaoWeb: students.created_at })` →
  `lichSu` vào dòng · `doi` → `kiemDotNoi` như cũ · `xep-not` → `kiemDotNoi` **chỉ** `viec.kyNang` · `da-du` + có `thiLai[id]` → bài `doi`
  cho kỹ năng đó (`cau` "Thi lại — điểm cũ giữ trong Lịch sử"), `viec = 'thi-lai'`, `canLyDo = true`; `da-du` không có → dòng `giu` + `coDiem`
  (web hỏi) · `chan` → `loi`. `kiemDotNoi` thêm `kiemTuanDaQua({ taoMoi: false })` → bài `chan`; bài `doi` mà tuần cũ đã bắt đầu → `canLyDo`.
  Lưu: `canLyDo` mà thiếu/ngắn `lyDo` → em đó `loi` "Cần lý do: …" (không lưu); `thi-lai` → `thiLai(...)`; `luuDot` truyền `reason: lyDo`.
  Xoá dòng chết `if (existing.status === 'cancelled')` (:641 — câu SELECT đã lọc huỷ).
- [ ] `xepMoi` (T34 × K2-33): thay dòng tính "tuần sớm nhất" bằng `kiemTuanDaQua` trên **mọi** tuần đã chọn (`week_end`) — có `cau` → `badRequest`;
  `lichSu` đúng → giữ `createAttempt` như cũ (nó tự đặt `lich_su` theo `period.week_end` — lúc này mọi tuần đều đã qua nên đúng).
  Khung lớp thường không đổi.
- [ ] **Nhắc lùi tuần bắt đầu (rà #120):** `intake.ts` khối báo trước MT lịch sử, ngay sau `luuY('startWeek', …)`:
```ts
const chuaQua = daThiToiMt ? mtDaThiChuaQua(cls.route, startWeek, daThiToiMt, homNay) : [];
if (chuaQua.length) luuY('daThiToiMt', `Đã thi tới MT${daThiToiMt} nhưng ${chuaQua.map((n) => 'MT' + n).join(', ')} rơi vào tuần chưa qua — lùi Tuần bắt đầu về tuần em bắt đầu học thật`);
```
- [ ] **Phép kiểm** khối 3: lưới em MT1…MT5 → 5 cột (không 8), em có MT8 → 8 cột; em chuyển `MB FT 101` → `MB FT 102` cùng lộ trình vẫn thấy
  MT1 · chip `vang`/`cho-duyet`/`tre`/`da-huy` đúng ô · `danhSachLop` "cần xếp lại" đếm em vắng chưa có đề nghị, không đếm em chờ duyệt ·
  hàng loạt 2 lớp: em MT3 đủ → `Tạo MT4`, em MT3 dở → `Xếp nốt`, em thiếu MT2 → chặn đúng câu; `ep` MT3 đủ + `thiLai` L → lưu → L trống,
  tuần mới · tuần đã qua cả 4 kỹ năng cho em vào web hôm nay → tạo MT lịch sử (`lich_su = 1`); trộn qua/tới → chặn; em vào web 2 tháng
  trước → chặn · dời bài tuần này không lý do → em `loi` · xem trước 20 em 2 lớp: `soCauSql()` chênh ≤ 16 × 20 · intake `daThiToiMt = 6`
  tuần bắt đầu = tuần này → `luuY` nhắc lùi.
- [ ] `npm run check` → commit `PR-XLMT (3): lưới Kế hoạch Test tới MT8 + trạng thái, việc xếp từng em, tuần đã qua, nhắc lùi tuần bắt đầu`.

## Task 4 · Hộp chung + dòng thời gian (T38, YC-13.6, UX-C C3)

**Files:** tạo `web/src/modules/fasttrack/HopThaoTacMt.tsx`, `web/src/modules/fasttrack/DongThoiGianLuot.tsx`; sửa `web/src/ui/chu.ts`
(thay `KY_NANG_KHONG_KIEM_TRA`/`KIEM_TRA_LAI_KY_NANG` bằng `CHU_THAO_TAC`).

- [ ] `HopThaoTacMt({ thaoTac, attemptId, skill, ct, laThuong, tuanDaBatDau, row, onClose, onDone })` — **một** `Modal` cho `doi-lich` ·
  `doi-han` · `bo-ky-nang` · `dua-lai` · `bao-vang` · `huy-diem` · `khoi-phuc` (khôi phục gọi route `restore` cũ). Nội dung: tiêu đề
  `{CHU_THAO_TAC[t]} · {tenMon(ct, skill)}`; một câu nói hệ quả (clarify ở Task 5); ô **tuần** (`TuanNho`) cho dời lịch / khôi phục, ô
  **ngày** (`ONgay` kiểu `ngay`) cho dời hạn; `huy-diem` với W: hai ô tích **W1 · W2** (mặc định ô nào có điểm); ô **Lý do** — nhãn có
  `*` khi `canLyDo(t, tuanDaBatDau)`, bộ đếm ký tự, lỗi dưới ô khi rời ô (luật YC-12.5.2). Nút: **Đóng** (trái) · động từ của thao tác (phải,
  `btn-danger` cho bỏ kỹ năng / huỷ điểm). Cảnh báo T15 từ máy chủ → nút đổi thành "Vẫn dời vào tuần này" (`force`).
  API: `/attempts/:id/skills/:skill/week` · `/deadline` · `/skip` · `/bao-vang` · `/restore` · `PUT /attempts/:id/scores/:entry` (FT huỷ
  điểm: `{ rawScore: null, criteria: [null,…], lyDo }`) · `PUT /regular/attempts/:id/scores/:skill` (lớp thường: `{ score: null, total: null, lyDo }`
  / `{ noShow: true, lyDo }`). Báo vắng xong → toast theo kết quả: `Đã tự dời {môn} sang {tuần} (vắng lần 1)` / `Đã gửi Quản lý duyệt dời
  lần 2 — hạn {ngày}`.
- [ ] `DongThoiGianLuot({ history, scoreHistory, ct })` (YC-13.6 "Lịch sử rõ hơn"): mỗi dòng **biểu tượng · việc · ai · khi · lý do**, mới
  nhất trên, gập (`<details>`) mặc định mở 5 dòng + "Xem hết n". Nhãn việc lấy bảng nhãn đang ở `MockDetailPage.tsx:635-642` (chuyển sang file
  này) đổi theo T38: `week_set/skill_week_set` "Dời lịch thi" · `skill_deadline_set` "Dời hạn chấm" · `skill_skipped` "Bỏ kỹ năng khỏi
  đợt" · `skill_no_show_settled` "Báo vắng / không dự thi" · `skill_week_moved_absence` "Dời do vắng" · `cancelled` "Huỷ cả lượt" ·
  `skill_part_cancelled` "Huỷ phần còn lại" · điểm xoá → "Huỷ điểm". Biểu tượng: SVG 12 px (không ký tự Unicode nhỏ).
- [ ] **Phép kiểm** khối 4 (đọc nguồn): `HopThaoTacMt.tsx` không chứa chuỗi lý do ghi cứng (`GVCN xác minh`, `Quản lý chốt trước`); mọi
  nhãn nút đi qua `CHU_THAO_TAC`.
- [ ] `npm run check` → commit `PR-XLMT (4): hộp thao tác MT dùng chung + dòng thời gian lượt`.

## Task 5 · Hồ sơ Mock: menu theo trạng thái, menu đầu trang, thẻ đề nghị dời (T38, K4-27, K4-29, #117) — impeccable `clarify`

**Files:** `web/src/modules/fasttrack/MockDetailPage.tsx`, `server/src/fasttrack/attempts.ts` (`attemptDetail.viewer`: thêm `laGvcn`).

- [ ] `SkillWorkTable.renderRow`: bỏ khối chọn `primary` + `items` (:369-419); thay bằng `trangThaiTT(...)` + `thaoTacKyNang(tt, { nhapDiem:
  c.canEdit, quanLy: d.viewer.canPlanWeek, gvcn: d.viewer.laGvcn, laFt: true, dotHoanTat: !!c.khoa })`. Nút chính mở đúng việc (nhập/sửa
  điểm tại chỗ như cũ · `xep-lai` → `AbsenceMoveModal` cũ · `tra-loi-de-nghi` → thẻ · `khoi-phuc`/menu → `HopThaoTacMt`). Dòng W2 (`!ownsSchedule`)
  chỉ có `sua-diem`/`huy-diem` của ô W2. Không còn mục "Lịch sử" trong menu dòng; nút "Lịch sử" duy nhất ở đầu thẻ → cuộn tới
  `DongThoiGianLuot`. Menu rỗng → không vẽ nút ⋯. Giữ nguyên dòng `{prog !== 'scored' && !d.lichSu && <div><DeadlinePill` (phép kiểm PR-MT).
- [ ] Menu đầu trang (K4-29): `Dời lịch thi cả đợt` (WeekModal cũ, thêm ô lý do bắt buộc khi tuần đợt đã bắt đầu) · `Dời hạn chấm cả đợt`
  (DeadlineModal cũ, lý do bắt buộc) · `Huỷ cả lượt MTn` / `Huỷ phần còn lại` (giữ của PR-MT) · `Mở lại lượt MTn`. Xoá `SkillWeekModal`,
  `SkillDeadlineModal` (thay bằng `HopThaoTacMt`); `HistoryCard` → `DongThoiGianLuot`.
- [ ] **#117:** `DecideMoveModal` → modal nhỏ chứa `<TheYeuCau yc={…} gon onXong={…} />`, thẻ lấy từ `GET /yeu-cau?studentId={em}&phanLoai=lich_thi`
  lọc `doi_tuong_id === r.pendingMove.id` (không có → câu "Đề nghị đã được xử lý" + làm mới). Xoá `DecideMoveModal`.
- [ ] `/impeccable clarify` cho: nhãn 6 thao tác, câu hệ quả trong `HopThaoTacMt` (ví dụ Báo vắng: "Ghi "-" cho {môn} và chốt ngay. Lần
  vắng đầu máy tự dời sang tuần kế tiếp; từ lần 2 Quản lý duyệt."), câu lỗi Task 2, chữ menu đầu trang — trước/sau vào Nhật ký. Không đổi
  chữ ngoài phạm vi PR.
- [ ] **Phép kiểm** khối 5 (đọc nguồn): `MockDetailPage.tsx` không còn `'Ghi nhận vắng'`, `'Hẹn xử lý'`, `'Đổi lịch cả đợt'`,
  `DecideMoveModal`; có `thaoTacKyNang(`.
- [ ] `npm run check` → commit `PR-XLMT (5): hồ sơ Mock — thao tác theo trạng thái, 6 tên T38, thẻ đề nghị dời`.

## Task 6 · Lưới Kế hoạch Test + hộp kỹ năng (K4-08, K4-11, K4-14, K4-15, K4-18(3), YC-13.6) — impeccable `layout`

**Files:** `web/src/modules/test/keHoach/ChipKyNang.tsx`, `LuoiKeHoach.tsx`, `HopKyNang.tsx`, `LopKeHoach.tsx`, `kieu.ts`,
`web/src/modules/test/KeHoachTestTab.tsx`.

- [ ] `ChipKyNang`: màu theo trạng thái mới — `vang` "vắng · xếp lại" (`late`) · `cho-duyet` "chờ Quản lý duyệt" (`wait`) · `tre` "trễ"
  (`bad`, viền mảnh) · `da-huy` (`done` + `line-through`). Ô `DotFT.do` → dấu ◐ SVG trước chip đầu. Ô `lichSu` giữ `ChipLichSu`. Chú giải ở
  `NutLuat` "Luật xếp lịch Test" thêm 4 màu (một dòng).
- [ ] `KeHoachTestTab`: chip lọc **"Cần xếp lại (n)"** cạnh công tắc khung (n = tổng `canXepLai` các lớp FT; ẩn khi 0) → danh sách lớp chỉ
  còn lớp có n > 0, lưới (`LuoiKeHoach` prop `chiCanXepLai`) chỉ còn hàng có ô `vang`/`da-huy`. Nút đầu trang đổi thành **"Xếp lịch MT…"**
  (khung FT) / **"Xếp lịch Test…"** (khung Lớp thường), **không** còn cần mở lớp trước (lớp đang mở chọn sẵn trong ngăn).
- [ ] `HopKyNang`: (a) đợt mới → cả 4 kỹ năng `tuanMacDinhDotMoi(homNay)` (bỏ "S tuần sau"); lớp thường giữ tuần đề xuất; (b) mỗi dòng kỹ
  năng thêm nút ⋯ (`Menu`) với `thaoTacKyNang(...).menu` trừ `doi-lich` (dòng đã có ô tuần) → mở `HopThaoTacMt`; (c) ô tích bỏ kỹ năng
  chỉ hiện khi menu có `bo-ky-nang`; (d) đổi tuần kỹ năng mà tuần cũ đã bắt đầu → ô **Lý do** bắt buộc (như "Lý do bỏ"), gửi `reason`.
- [ ] `/impeccable layout` trên lưới + hộp: cột thẳng, ô 44 px, chip không xuống dòng ở 375 px; ghi "tầng 1 của màn: em cần xếp / xếp lại".
- [ ] `npm run check` → commit `PR-XLMT (6): lưới Kế hoạch Test đủ trạng thái, chip Cần xếp lại, hộp kỹ năng theo trạng thái`.

## Task 7 · Ngăn Xếp lịch MT (M9 · YC-13.4 · T37 · K4-17, K4-18, K4-19 · C4 · K2-33) — impeccable `layout` + `clarify`

**Files:** tạo `web/src/modules/test/keHoach/NganXepLichMt.tsx`; sửa `NganXepHangLoat.tsx` (chỉ còn khung Lớp thường), `KeHoachTestTab.tsx`.

- [ ] **Vị trí:** Test › Kế hoạch Test › nút **Xếp lịch MT…** → `KhungPanel` `rong="rong"` bên phải, tiêu đề "Xếp lịch Mock Test",
  **công tắc** `Fast Track · Lớp thường` ở đầu ngăn (đổi khung = đổi thân ngăn: FT → `NganXepLichMt`, Lớp thường → `NganXepHangLoat`).
- [ ] **Khung FT** — từ trên xuống, một màn:
  1. **Lọc:** Chi nhánh (`BranchFilter`, QL một chi nhánh thì ẩn) · **Lớp** nhiều lựa chọn (chip `MB FT 101 ✕` + "+ lớp", chọn sẵn lớp đang mở;
     danh sách từ `/ke-hoach-test/lop`) · **Tìm học viên** (tên/mã, lọc trong các lớp đã chọn). Lưới mỗi lớp tải bằng `useApi('/ke-hoach-test/ft/{id}')`
     (có sẵn — không route GET mới).
  2. **Đợt:** chip `MT1 … MT8` (chỉ tới `max(cột các lớp)+1`, trần 8), mặc định = đợt **nhỏ nhất còn em chưa xong** trong các lớp (C4). Dòng phụ
     xám: "Em đã đủ điểm đợt này tự sang đợt kế tiếp; đợt còn dở thì xếp nốt."
  3. **Tuần chung cho 4 kỹ năng** (`TuanNho`, mặc định `tuanMacDinhDotMoi`) + dòng gập **"Lịch riêng từng kỹ năng (nếu cần)"** → 4 dòng L · R ·
     W · S ✎ (W có ⓘ "W = W1 + W2"). Đổi tuần chung → 4 dòng chưa sửa tay đổi theo.
  4. **Bảng học viên** `table-layout: fixed`: ☐ · Học viên (tên đậm + mã nhỏ, chữ `RF` nhỏ cạnh tên nếu lộ trình RF) · Lớp · **Mock Test**
     (hàng chip MT1…: ✓ xong · ○ đã xếp · ◐ dở · `lịch sử` · gạch ngang huỷ phần · tím chờ duyệt; đợt sẽ xếp của em **tô đặc**; bấm chip = đổi
     đợt riêng cho em → `dotTheoEm`) · **Sẽ xếp** (`chuSeXep`, màu theo `viec`; cảnh báo vàng; chặn đỏ). Nhóm **"Đã chọn n — luôn ở trên"**
     rồi **"Chưa chọn · n"**. Mặc định tick: em có việc (`viec` ≠ chặn/giữ) ở đợt đang chọn.
  5. **Hộp thi lại** (em có `viec = da-du`): khối nhỏ dưới hàng em — "Cho {em} thi lại {L} của MT3? L đã có điểm 6.0 ({tuần}). Chỉ dùng khi
     thật sự thi lại — điểm cũ giữ trong Lịch sử." · nút **Thi lại {L}** (tick kỹ năng nếu > 1) · **Không** (bỏ tick em).
  6. **Lý do** (chỉ hiện khi có dòng `canLyDo`): một ô, bắt buộc.
  7. **Chân dính:** dòng xem trước `Xem trước: dời 1 · xếp nốt 1 · tạo 1 · thi lại 0 · cảnh báo 1 · chặn 0` (điện thoại: ngay trên nút) ·
     **Đóng** · **"Xếp lịch {soEm} em · {soBai} bài"** (C4). Tick "Vẫn xếp bài có cảnh báo" như ngăn cũ.
- [ ] **Xem trước / lưu:** gom em đã tick theo lớp → `POST /ke-hoach-test/hang-loat` **mỗi lớp một lần** (`xemTruoc` song song; lưu tuần tự),
  trễ 300 ms, bỏ kết quả cũ theo số thứ tự (như ngăn cũ). R9b giữ: sau lưu chỉ còn em lỗi, tick sẵn.
- [ ] **Khung Lớp thường (K4-19):** `NganXepHangLoat` bỏ nhánh FT (`loai` luôn `'thuong'`), thêm đầu ngăn: chip chương trình `Pre FOU · FOU ·
  BE · ELE` (chỉ chương trình có lớp) + ô **Lớp** chọn **một** lớp (Q3) → giữ nguyên phần còn lại (đợt Giữa/Cuối theo mốc chương trình, tuần đề
  xuất của lớp, không bỏ môn, tên môn qua `tenMon`). Giữ `th.data?.boMon` và `{ky.map(` (phép kiểm PR-MON).
- [ ] `/impeccable layout` (căn cột, nhịp khoảng cách, 375 px: bảng cuộn ngang trong thẻ, cột tên dính trái) + `clarify` (dòng phụ, câu thi lại,
  câu chặn) — Nhật ký.
- [ ] **Phép kiểm** khối 7 (đọc nguồn): `NganXepLichMt.tsx` gọi `viec`/`chuSeXep` (không tự suy việc); `NganXepHangLoat.tsx` không còn
  `/ke-hoach-test/ft/`; `HopKyNang.tsx` + `NganXepLichMt.tsx` dùng `tuanMacDinhDotMoi`.
- [ ] `npm run check` → commit `PR-XLMT (7): ngăn Xếp lịch MT nhiều lớp (M9), khung Lớp thường riêng`.

## Task 8 · Lưới lớp thường: menu ⋯ từng ô + Lịch sử một em × một bài (K4-32, #118)

**Files:** `web/src/modules/cham/LuoiThuong.tsx` (`DongThuong` :356), tạo `web/src/modules/cham/NganLichSuBai.tsx`.

- [ ] Mỗi ô môn (kể cả ô vắng/đã dời) thêm nút ⋯ nhỏ góc phải (hiện khi hover/focus; điện thoại luôn hiện, vùng bấm 44 px) — `Menu` với
  `thaoTacKyNang(tt, { nhapDiem: canEdit, quanLy, gvcn, laFt: false, dotHoanTat: row.hoanTat })` (không bao giờ có `bo-ky-nang`) + mục cuối
  **"Lịch sử"** (ngoài bảng ≤ 3 vì không phải thao tác) → `NganLichSuBai` (`KhungPanel` hẹp: `GET /attempts/{attemptId}` → `DongThoiGianLuot`).
  Quyền `quanLy`/`gvcn` đọc từ dữ liệu bảng điểm lớp thường (thêm 2 cờ vào `regularSheet` nếu chưa có — một lần cho cả bảng, không mỗi ô).
- [ ] Ô nhập giữ nguyên hành vi Enter/mũi tên; ⋯ nằm ngoài thứ tự Tab của ô nhập (`tabIndex` sau ô).
- [ ] `npm run check` → commit `PR-XLMT (8): lưới lớp thường — menu thao tác từng ô, lịch sử một bài`.

## Task 9 · Dữ liệu demo (không có dòng K5 §6 riêng — planning đặt X1–X4)

**Files:** tạo `server/src/seed/xlmtSeed.ts` (`buildXlmtDemo(ctx)`, đi qua hàm nghiệp vụ như `prMtSeed.ts`); `server/src/seed/seed.ts`
(1 import + 1 lời gọi sau `buildPrMtDemo`); `web/src/modules/**/WelcomePage.tsx` (một dòng "xem được" cho QL Vy).

- [ ] **X1** lớp `MB FT 101`: một em MT3 đủ 4 điểm (ngăn → `Tạo MT4`), một em MT3 có L R, W S chưa (→ `Xếp nốt W S`), một em MT3 chưa thi tuần
  sau (→ `Dời`). **X2** lớp `MB FT 102`: một em vắng S đã tự dời lần 1 rồi vắng lần 2 → chip `chờ Quản lý duyệt`; một em W "Huỷ phần còn lại"
  → chip `đã huỷ` + đếm "Cần xếp lại". **X3** một em thêm hôm nay "đã thi ngoài web" MT1–MT3 lịch sử, **MT4 thi thật 3 tuần trước chưa có
  lượt** → QL xếp MT4 tuần đã qua = MT lịch sử. **X4** lớp `MB FOU 12`: một em có ô L đã dời vì "-" để thử menu ⋯ + Lịch sử.
- [ ] `npm run seed` trong worktree → `npm run check` → commit `PR-XLMT (9): demo xếp lịch MT (X1–X4)`.

## Task 10 · Tài liệu

- [ ] `CODE_MAP.md`: `thaoTacMt.ts`, `viecXepMt`, `NganXepLichMt.tsx`, `HopThaoTacMt.tsx`, `DongThoiGianLuot.tsx`, `baoVang`, `thiLai`.
  `thiet-ke/TU_DIEN_VA_CHU.md`: 6 tên T38 + "Xếp nốt", "Thi lại", "Cần xếp lại"; bỏ "Hẹn xử lý", "Ghi nhận vắng", "Kỹ năng không kiểm tra".
  `thiet-ke/PISA-Rulebook-2026-09-19.md`: trần MT8, bảng thao tác theo trạng thái, luật lý do K4-15, Báo vắng = "-" + chốt ngay, thi lại.
  `DEMO.md`: X1–X4. Chỉ tài liệu — không chạy lại `npm run check`. Commit `PR-XLMT (10): tài liệu`.

## Task 11 · impeccable `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] Cổng rebase (bảng trên) → `npm run check`.
- [ ] `/impeccable audit` trên: ngăn Xếp lịch MT (1440 + 375), lưới Kế hoạch Test có đủ trạng thái, hộp kỹ năng, hồ sơ Mock (menu từng trạng
  thái, hộp thao tác, dòng thời gian), lưới lớp thường ⋯ → sửa a11y/tương phản/trạng thái trong phạm vi PR → `/impeccable polish` một lượt.
  `/ponytail-review` trên diff; liệt kê mọi chú thích `ponytail:`.
- [ ] Bấm thử **KIỂM** (API 4177 + Vite 5377, Playwright kênh Chrome), ảnh trước (main) / sau → `thiet-ke/anh/pr-xlmt/`.
- [ ] push → `gh pr create` tiêu đề `PR-XLMT: Xếp lịch MT nhiều lớp, thao tác MT theo trạng thái (T37, T38)`; thân: bảng mã YC/T/K → ảnh →
  đạt/không; "tầng 1 của màn này là: …" (Kế hoạch Test → em cần xếp / xếp lại · ngăn Xếp lịch MT → dòng xem trước · hồ sơ Mock → một nút
  chính mỗi kỹ năng); **Chuyển cho PR khác**; **không migrate**; chú thích `ponytail:`. **Không tự merge.** Tắt cổng, quét `tests/run.js`, dọn tạm.

## KIỂM — kịch bản bấm thử (Task 11)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | QL Vy (2) | Kế hoạch Test → **Xếp lịch MT…** → thêm lớp `MB FT 102`, đợt MT3, tuần chung mặc định | Hai lớp một bảng; tuần = tuần tới cho cả 4 kỹ năng; em X1 ghi `Tạo MT4 · W…` / `Xếp nốt W S · MT3` / `Dời MT3 · … → …` |
| K2 | QL Vy | Tick 12 em thuộc 2 lớp → Xếp lịch | ≤ 5 lần bấm từ lúc mở ngăn; toast "Đã xếp 12 em"; lưới hai lớp đổi đúng |
| K3 | QL Vy | Bấm chip MT3 (đủ điểm) của một em | Hộp "thi lại L của MT3? L đã có điểm …"; chọn Thi lại + lý do → ô L trống, Lịch sử có điểm cũ |
| K4 | QL Vy | Em X3: đợt MT4, tuần 3 tuần trước | `Tạo MT4 · W… · MT lịch sử`; lưu → chip `lịch sử`; chọn tuần đã qua cho riêng L → chặn "chọn tuần đã qua cho mọi kỹ năng" |
| K5 | QL Vy | Chọn MT9 (gõ API) / em thiếu MT2 chọn MT3 | "Tối đa MT8…" / "Chưa có MT2 — xếp MT2 trước…" |
| K6 | QL Vy | Lưới `MB FT 102` + chip **Cần xếp lại (n)** | Chip vắng/chờ duyệt/đã huỷ đúng màu; lọc chỉ còn em cần xếp lại; ô "+ xếp" chỉ ở MT kế tiếp |
| K7 | QL Vy | Hồ sơ Mock kỹ năng chưa tới tuần / tuần này chưa điểm / đã có điểm | Menu lần lượt: Dời lịch thi · Bỏ kỹ năng khỏi đợt / Báo vắng · Dời hạn chấm · Dời lịch thi / Huỷ điểm — ≤ 3 mục, không "Lịch sử" trong menu |
| K8 | GVCN Hà (7) | Hồ sơ Mock kỹ năng tuần này → Báo vắng (lý do 3 ký tự, rồi đủ) | Lỗi độ dài; lưu → toast "Đã tự dời … (vắng lần 1)"; dòng thời gian có "Báo vắng · Hà · lý do" |
| K9 | QL Vy | Em X2 chờ duyệt → Hồ sơ Mock → Trả lời đề nghị dời | Thẻ Lịch thi (`TheYeuCau`) trong modal; duyệt → chip lưới hết tím |
| K10 | QL Vy | Hộp kỹ năng lưới: bỏ kỹ năng đã có điểm / dời tuần đã bắt đầu | Không có ô tích bỏ; dời → ô Lý do bắt buộc |
| K11 | GVCN lớp thường | `MB FOU 12` lưới → ⋯ ô L → Báo vắng · Lịch sử | Tên môn G+V/P đúng; Báo vắng có lý do → ô dời tuần sau; ngăn Lịch sử một bài |
| K12 | QL Vy | Ngăn Xếp lịch → công tắc Lớp thường → chip FOU → một lớp | Đợt Giữa/Cuối khoá, tuần đề xuất của lớp, không ô bỏ môn |
| K13 | GVBM Trang (9) | Hồ sơ Mock kỹ năng mình dạy, đã có điểm | Nút chính Sửa điểm; menu chỉ Huỷ điểm (lý do bắt buộc); không Báo vắng |
| K14 | 375 px | K1, K6, K7, K11 | Ngăn cuộn trong thẻ, cột tên dính; dòng xem trước ngay trên nút; ⋯ ô lưới bấm được 44 px |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Hồ sơ Mock M10 dựng lại **dùng** `thaoTacKyNang` + `HopThaoTacMt` + `DongThoiGianLuot` (không dựng menu thứ hai); nhập MT lịch sử tại chỗ | PR-HSM | K4-27, K4-30, YC-13.8 |
| Huỷ điểm / Thi lại → luật SOS v4 thu hồi Case (S08) nếu khác hành vi `refreshOutcome` hiện tại | PR-SOS | T38 × §5.3 |
| Cột "Trạng thái lượt" (lịch sử / huỷ phần / thi lại) trong xuất Excel | PR-XUAT | T40 |
| `ConfirmDialog` nút "Huỷ" → "Đóng" (hộp huỷ lượt cũ vẫn dùng) | PR-NEN / PR-UXF | #119 câu hỏi 3 |
| Mockup M9 vẽ lại theo ảnh thật PR này (chip dở / lịch sử / huỷ / chờ duyệt, khung Lớp thường) | planning | §4.9 "mockup phải sửa" |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | **Không migrate.** Dời hạn chấm = `deadline_override` có sẵn; Báo vắng = dấu "-" + `settleGroup`; Huỷ điểm = `saveScore` rỗng + lý do; Thi lại = xoá ô (RB-5) + đổi tuần | Database reset trước deploy; không cần cột mới |
| Q2 | Huỷ lượt giữ chữ PR-MT "**Huỷ cả lượt MTn**" / "**Huỷ phần còn lại**" thay cho "Huỷ lượt MTn" của T38 | PR-MT đã đưa vào TU_DIEN + ảnh #119; hai cách huỷ khác hệ quả |
| Q3 | Khung Lớp thường của ngăn chọn **một lớp** mỗi lần (chip chương trình để lọc lớp) | Mỗi lớp khai giảng khác → tuần đề xuất khác (K4-19); ngăn cũ đã đúng từng lớp |
| Q4 | Tìm học viên chỉ trong **các lớp đã chọn**; lưới mỗi lớp tải bằng route GET có sẵn (không route GET mới) | Tải cả chi nhánh ≈ 10 lớp × 30 câu trên Turso quá chậm |
| Q5 | "Lịch sử" **không** tính vào ≤ 3 mục menu: ở hồ sơ Mock là nút đầu thẻ + dòng thời gian; ở lưới lớp thường là mục cuối ⋯ (không phải thao tác) | K4-27 đếm thao tác; YC-13.6 "Lịch sử giữ nhưng rõ hơn" |
| Q6 | MT lịch sử trong ngăn: không xếp lại (đợt chọn là MT lịch sử → sang đợt kế tiếp; bấm chip riêng → chặn "nhập bù") | T34 — lượt lịch sử chỉ nhập bù |
| Q7 | "Cần xếp lại" = kỹ năng **vắng chưa có đề nghị chờ** + **phần thi đã huỷ** (lượt còn chạy, không lịch sử). Trễ (chưa chấm) **không** tính — đó là nợ chấm của GV | K4-11 tách "xếp lại" (việc QL) khỏi "trễ" |
| Q8 | Tuần đã qua chỉ để **tạo** MT lịch sử, cả 4 kỹ năng đều tuần đã qua **và** em vào web (`students.created_at`) sau các tuần đó; không dời lượt có sẵn vào tuần đã qua | K2-33(1); tránh lượt trộn quá khứ/tương lai |
| Q9 | Bài **vắng** đổi tuần vẫn không bắt lý do (mặc định "Quản lý xếp trực tiếp", đếm +1 lần vắng — K4-12 PR-MT) | Giữ hành vi PR-MT đã duyệt |
| Q10 | Báo vắng mở khi **tuần thi đã tới** (từ thứ Hai tuần thi); chốt ngay qua `settleGroup` (giờ ghi = cuối Chủ nhật tuần thi như dấu "-") | K4-28; một bộ đếm, một nhãn "Không dự thi" |
| Q11 | Không có mục "Bỏ báo vắng" — báo nhầm thì Quản lý dùng "Xếp lại bài vắng"/đường trạng thái thi cũ ở hồ sơ Mock | T38 chỉ 6 tên; máy đã tự dời ngay nên "bỏ" không còn nghĩa |
| Q12 | Lưới lấy lượt theo **lộ trình đang chạy của em**, không theo lớp (bỏ chú thích `ponytail:` PR-MT) | Em chuyển lớp FT cùng lộ trình mất MT cũ trên lưới, "+ xếp" lệch |
| Q13 | Thi lại chỉ Quản lý, chỉ lượt Mock đang chạy, không lượt lịch sử; mọi ô của kỹ năng (W1 + W2) xoá cùng lúc | §5.5 "QL tự làm, chỉ ghi lịch sử"; một lượt một điểm/kỹ năng |
| Q14 | Kịch bản demo X1–X4 do planning đặt | K5 §6 không có dòng cho PR-XLMT |

## Mâu thuẫn nguồn ↔ mã thật

1. `xepMoi` (keHoachTest.ts:442-443) gửi `createAttempt` **tuần sớm nhất** → `lich_su` theo tuần sớm nhất; T34 nói tuần **muộn nhất** → lượt trộn qua/tới thành "MT lịch sử" (Q8).
2. `luoiFT` lọc lượt theo `a.class_id` (:211-216) → em chuyển lớp FT giữ lộ trình mất MT cũ, `soKeTiep` lệch (PR-MT tự ghi `ponytail:`) (Q12).
3. `setSkillScope` (skillSchedule.ts:686) chỉ chặn vắng, không chặn có điểm / đã tới tuần (K4-13); `setSkillWeek`, `setSkillDeadline` không bắt lý do (K4-15).
4. Hộp kỹ năng + ngăn hàng loạt mặc định **L R W tuần này, S tuần sau** (HopKyNang.tsx:52-62, NganXepHangLoat.tsx:109) ≠ M9 "cùng tuần tới" (K4-14).
5. `xepHangLoat` một lớp, một đợt cho cả lớp; M9 cần nhiều lớp + đợt theo từng em (K4-17).
6. "Ghi nhận vắng" (MockDetailPage.tsx:388) chỉ đặt `absent` + lý do ghi cứng — không "-", không chốt, **không** đi luồng Q-A tự dời; Báo vắng mới qua `settleGroup` (K4-28).
7. `xetMotEm` :641 `existing.status === 'cancelled'` không bao giờ đúng (câu :613 đã lọc huỷ) — mã chết, xoá.
8. `thuTuDot` bảng cứng tới MT5 (phanTich.ts:141) — MT6–MT8 xếp sau Cuối khoá (K1-21).
9. YC-13.6 "không thao tác nào ghi ngay mà không có hộp lý do" ≠ K4-15 (tuần tương lai không cần lý do) — theo K4-15 (§2 mục 4). T38 "Huỷ lượt MTn" ≠ chữ PR-MT — giữ PR-MT (Q2).
10. Đã xong ở PR trước, không làm lại: tên môn G+V/P ở ngăn xếp lịch (#118); `createAttempt` tuần đã qua → `lich_su = 1` (#119 câu hỏi 2).

## Câu cần chủ sản phẩm quyết

1. **Thi lại một kỹ năng đã có điểm (ép vào đợt trùng):** (A) **xoá điểm cũ khỏi ô, giữ trong Lịch sử; SOS/kỳ vọng tính theo điểm mới khi có**
   *(khuyến nghị — một lượt một điểm mỗi kỹ năng, không cần cột mới)* · (B) giữ điểm cũ tới khi có điểm mới (cần cột "điểm trước thi lại" →
   migrate, và SOS phải chọn điểm nào). Kế hoạch đang theo **(A)** (Q13).
2. **Ngăn Xếp lịch — khung Lớp thường:** (A) **một lớp mỗi lần** (chip chương trình lọc lớp) *(khuyến nghị — tuần đề xuất khác nhau theo lớp)* ·
   (B) nhiều lớp cùng chương trình, mỗi em mặc định tuần đề xuất của lớp em. Kế hoạch đang theo **(A)** (Q3).

## Nhật ký thực thi

<!-- Session code ghi ở đây: mốc B, dòng mã thật lệch, phép kiểm cũ phải thêm lý do, trước/sau clarify, 🛑 đã hỏi, model thật. -->

- **Model thật:** Opus 5.5 (phương án B của Bảng điều hành).
- **Task 0 (29/09):** nhánh từ `origin/main` @ c3f38f3. PR-SOS / PR-YT4 / PR-TOC **chưa** merge (chỉ có commit kế hoạch). **Mốc B = 1575**
  phép kiểm (+20 tốc độ). Dòng mã khớp kế hoạch (lệch ≤ 20 dòng); `schema.sql` nằm ở `server/src/schema.sql`.
- **Task 1:** `DotFT.do/huyPhan` để sang Task 3 (cùng chỗ máy chủ tính). `OKyNang` thêm `sit/tuanKetThuc/choDuyet` (máy chủ
  `choDuyet` thật ở Task 3). Ngày demo của bộ kiểm = 14/09/2026 (`TODAY`).
- **Task 2 — cờ `khiTao`:** `setSkillWeek` / `setSkillScope` (+ `setSkillSkip`, `luuDot`) nhận `khiTao` cho lượt VỪA TẠO trong cùng
  lần xếp (`xepMoi`, `xepMoiThuong`, `planning.ts` bỏ kỹ năng lúc lên kế hoạch): đặt tuần / bỏ kỹ năng lúc tạo không phải "dời", không
  đòi lý do, không chặn "đã tới tuần".
- **Task 2 — 🛑 đã hỏi chủ sản phẩm (29/09):** kế hoạch cho Quản lý Thi lại / Huỷ điểm trước hoàn tất, nhưng mã chỉ cho Quản lý sửa
  điểm SAU hoàn tất (R11). Chủ sản phẩm chọn **"Mở cả sửa điểm cho Quản lý"**: `permissions.ts` `scoreEditPath` + `editableSkills`
  thêm vế `PLAN_WEEK` → đường `override` (RB-5 vẫn đòi lý do khi sửa ô đã có điểm). Áp cho cả FT và lớp thường (cùng một gốc).
- **Phép kiểm cũ đã sửa (không xoá):** `run.ts` "Bỏ một kỹ năng… đã có điểm" → nay khẳng định bị chặn + điểm giữ; phần tính lại mẫu
  số chuyển sang một đợt chưa tới tuần (K4-13). `run.ts` "Ô điểm nói rõ kỹ năng có bắt buộc" → người xem không sửa được đổi từ Quản lý
  sang GV Writing 1. `chamDiem.tests.ts` PR-Rc1 C08 Quyền → Quản lý nay ghi được "-". `keHoachTest.tests.ts` 3 lời gọi `luuDot` dời
  bài tuần đã bắt đầu → thêm `reason` (K4-15).
- **Task 3:** `xetMotEm` tách thành `xetMotEmThuong` (lớp thường, như cũ, bỏ dòng chết `existing.status === 'cancelled'`) và
  `xetMotEmFT` (qua `viecXepMt`); dữ liệu FT đọc theo lô ở `docFtTheoLo` (lộ trình, lượt, lịch, điểm, đề nghị chờ — 5 câu cho cả danh
  sách). Đo: xem trước 20 em / 2 lớp đạt trần 16 câu/em. Trần tốc độ chỉ nâng cho vai chạy câu mới (QL, QT): `/ke-hoach-test/lop`
  21 → 22, `/ke-hoach-test/ft/3` 29 → 30. Phép kiểm "5 cột": cột = tới **MT kế tiếp** (em có MT1–MT5 → 6 cột cho ô "+ xếp"), không
  cứng 8 — kiểm bằng công thức trên chính lưới, em có MT8 → đúng 8.
- **Phép kiểm cũ đã sửa (Task 3):** `keHoachTest.tests.ts` — 4 lời gọi `luuDot`/`kiemDot` chọn tuần đích quanh lịch seed (trước ngày
  demo) → chạy trong `truocNgayDemo` (hôm nay lùi về 05/01/2026) để tuần đích là tương lai; Task5 em C "đã xong → giu" → thêm
  `dotTheoEm` (Quản lý bấm chip MT1 riêng, vì em đủ MT1 nay tự sang MT2); "Rà planning(2)" số MT ảo 91 → 8 (trần MT8).

## Chủ sản phẩm chốt 29/09 (thay các chỗ lệch trong kế hoạch)

- **Câu 1 = A:** Thi lại kỹ năng đã có điểm → xoá điểm cũ khỏi ô, giữ trong Lịch sử, SOS/kỳ vọng tính theo điểm mới. Không migrate.
- **Câu 2 = A (planning chốt):** ngăn Xếp lịch khung Lớp thường xếp **một lớp mỗi lần**.
- Planning duyệt bảng Q (Q1–Q14) như agent đề xuất.
