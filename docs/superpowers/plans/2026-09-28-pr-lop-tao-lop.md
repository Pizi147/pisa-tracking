# PR-LOP · Tạo lớp · tên lớp · RF · Pre FOU · phân công — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Tạo lớp bằng **một lệnh, một giao dịch** (lớp + phân công), kiểm ba luật phân công **trước khi ghi**, báo lỗi ngay tại ô,
tạo xong mở hồ sơ lớp; tên lớp do máy ghép `{CN} {FT | FT RF | Pre FOU | FOU | BE | ELE} {số}` (lớp cũ đổi tên lúc migrate, ô tìm
nhận cả kiểu cũ có `-`, sắp xếp theo số tự nhiên); lộ trình **RF**; chương trình **Pre FOU** có dòng CSDL (tạo lớp Pre FOU **khoá** tới
PR-MON); mỗi ô phân công **một người**; số tuần lớp đọc **một nguồn** (bảng + số tuần chụp vào lớp); Quản trị › Lộ trình & chương trình
sửa số tuần có tác dụng, không thêm mã mới; QL/Quản trị mở Học viên & Lớp ở phạm vi Chi nhánh; "+ Mở lớp mới" trong Chuyển tiếp dùng
chung panel Tạo lớp; vào lớp FT lấy lộ trình của lớp đích.
**Architecture:** Luật thuần mới ở `shared/domain/tenLop.ts` (ghép/kiểm/chuẩn hoá/sắp xếp/đổi tên cũ) và `shared/domain/phanCong.ts`
(ô phân công theo chương trình + `kiemPhanCong`) — web và máy chủ gọi **cùng** hàm. Máy chủ: `taoLopVaPhanCong` (một `tx`) thay đường
`POST /classes`; `createClass` thành hàm ghi nội bộ; `ghiPhanCong` tách khỏi `setClassTeachers`. Migrate riêng `server/src/migrate/prLop.ts`
(một dòng gọi, T78) + lệnh chạy thử chỉ đọc + lệnh `kiem-lop-mo-coi`. Web chỉ vẽ lại bốn panel `modules/classes/*` + Quản trị.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 T1–T7, T51, T55, T56, T62, T71, T78 · §3.1b Q27-8, Q27-13
· §4.1 YC-1…YC-4 · §5.1 L1–L4 · §5.7 MH1, MH6, MH9 · §5.8 M-09, M-20 · §6.6 PF1, PF4, PF5, PF6 · §8 dòng PR-LOP + đoạn Migrate · §10 ·
báo cáo rà `thiet-ke/ra-27-09/` K1-05, K1-43, K1-46…K1-50, K2-07, K2-08, K2-15…K2-18, K2-24, K5-30, K5-36, K5-37, K5-45, K5-67, K5-68,
K2 §4(d), K5 §5 · mockup `thiet-ke/mockup/21-pr-lop.html` (thay M1 của mockup 19).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-LOP** · đợt 1 · làn **B** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-lop-tao-lop` · `.claude/worktrees/pr-lop-tao-lop` (từ `origin/main`) |
| Cổng thử | API **4167** · Vite **5367** (không dùng 4000/5173; làn A 4157/5357, làn C 4177/5377 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High** |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có** — `classes.so_tuan` + `tuan_giua_khoa` + `tuan_cuoi_khoa`; lộ trình `RF`; chương trình `PREFOU` (+ `programme_skills`, `programme_checkpoints`); điền số tuần lớp cũ; đổi tên lớp cũ (bỏ qua lớp va chạm / không theo mẫu); chỉ mục duy nhất mã lớp chuẩn hoá khi sạch |
| Skill thiết kế | Không gọi taste-skill/impeccable (bám mockup 21). Đọc `thiet-ke/HE_GIAO_DIEN.md` §4 và `thiet-ke/TU_DIEN_VA_CHU.md` là đủ |
| Phụ thuộc | Không chặn. PR-N1 (làn A) và PR-NEN (làn C) chạy song song — ranh giới file ở bảng dưới; thứ tự merge đề xuất **N1 → LOP → NEN** |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-LOP (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 13 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7**), ảnh trước/sau lưu
  `thiet-ke/anh/pr-lop/`. Chạy song song: `PORT=4167` cho API, Vite tạm cổng 5367 trỏ proxy về 4167.
- Không chạm Turso, không deploy, không chạy `migrate` hay lệnh chạy thử trên bản chính. Mọi tính năng ghi dữ liệu thử trên **DB demo
  trong worktree** (và DB THỬ lúc deploy), không bao giờ bản chính trước. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4167/5367, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.
- **🛑 Cửa dừng:** migrate và hai lệnh chạy thử (`chay-thu:lop`, `kiem-lop-mo-coi`) trên **bản chính** chỉ **chủ sản phẩm** chạy, theo
  `TRIEN_KHAI.md`, ở buổi deploy (mục "Lệnh cho buổi deploy" cuối file). Session code **không** chạy, **không** đề nghị chạy hộ.

### Ranh giới file với hai PR chạy song song

| File | PR khác | PR-LOP chỉ được sửa |
|---|---|---|
| `web/src/ui/KhungPanel.tsx`, `ui/ui.tsx`, `ui/Filters.tsx` (`WeekPicker`), `ui/ChonNgay.tsx`, `ui/PeoplePicker.tsx`, `index.css` | **PR-NEN** (khung panel, ô ngày, ô chọn người, "Khác") · PR-N1 (`conThieu`, `Truong`) | **không sửa** — chỉ dùng thứ đang có. Ô tuần khai giảng giữ `WeekPicker` (PR-NEN thay bằng ô ngày thống nhất kiểu tuần); ô chọn giáo viên giữ `<select>` một người (T14 ngoại lệ: phân công chỉ chọn tài khoản) |
| `web/src/ui/loiForm.tsx`, `shared/domain/loiForm.ts` | **PR-N1** dựng (Task 6 của N1) | chỉ **dùng** (`useLoiForm`, `dsLoi`, chân `DongCanSua` vẽ `nhanCanSua(n)` = dòng xám `n ô cần sửa ↑`) khi N1 đã merge (Task 0 kiểm); chưa merge → dùng `Truong loi` + `conThieu: string[]` sẵn có, ghi Nhật ký để đổi sau rebase |
| `web/src/modules/classes/BangDiemLopThuong.tsx` | PR-N1 (hàm `ODiemThuong` :98-101) | **không sửa** |
| `server/src/classes/classes.ts` | PR-N1 (khối `timeline` :455-481, `history` :520-531, `nhapDiem` :600-606) | `listClassSummaries` (:120-280), `classTeachers`/`setClassTeachers` (:745-935) |
| `web/src/modules/students/StudentsPage.tsx` | PR-N1 (khung bảng :195-218) | **không sửa** (panel tạo lớp tự mở hồ sơ lớp) |
| `server/src/migrate.ts` | PR-N1 (một dòng `migratePrN1`) | **một** import + **một** dòng `migratePrLop(conn, applied);` cuối danh sách, sau `migrateXoaDuLieu` (:451) và sau dòng của N1 nếu đã có |
| `server/src/tests/run.ts`, `shared/domain/index.ts`, `package.json`, `CODE_MAP.md`, `plan.md` | mọi PR | chỉ thêm dòng đăng ký/export/script/ghi chú |
| `server/src/seed/*`, `server/src/tests/*` (chuỗi mã lớp `MB-FT 101`…) | PR-N1 thêm phép kiểm mới có thể dùng tên cũ | Task 11 đổi **cơ học** mọi tên lớp demo; rebase sau N1 thì chạy lại đúng script đó trên file của N1 |

Gặp xung đột khi rebase: giữ **cả hai** phần (các PR sửa khác dòng), ghi Nhật ký.

## Global Constraints

- **Tinh tế (chủ sản phẩm):** dấu trạng thái nhỏ gọn, nét mảnh (◌ ▾ ✓ ●, không icon to); cột và hàng thẳng — nhãn ô phân công cột
  trái **cùng bề rộng** (`w-24`), ô chọn thẳng hàng; số căn phải, `tabular-nums` cho **mọi** số (số lớp, số tuần, số HV); hàng cao đều;
  dòng phụ ≤ 1 dòng, không dồn chữ, không lặp thông tin. Lỗi ô: viền đỏ + **một** câu ngắn dưới ô, không hộp đỏ to.
- **Chữ:** theo `thiet-ke/TU_DIEN_VA_CHU.md` + `THUAT_NGU_DA_CHOT.md`. Ba chữ chốt (K1-50): **Kiểu lớp** (Fast Track / Lớp thường) ·
  **Lộ trình** (LT1 · LT2 · RF) · **Chương trình** (Pre FOU · FOU · BE · ELE). "Giữa khoá / Cuối khoá", không "Progress / Final Test".
  "Lớp thường", không "Normal". GVCN, GV, HV viết tắt như từ điển.
- **Không lộ chữ máy:** mã `PREFOU`, `tong_hop`, `writing1`, `ielts_band`, ngày ISO `2026-10-05`, lệnh `npm …` không hiện trên màn hình
  hay trong câu lỗi máy chủ trả về. Tên chương trình qua `kyHieuLop()`/`name` của bảng; ngày qua `ngay()`, tuần qua `tuanLich()`.
- **Một nguồn:** không suy chương trình/lộ trình **từ tên lớp** (K2 §4d) — luôn đọc `programme_code`/`route`. Số tuần/mốc lớp đọc
  `classes.so_tuan`/`tuan_giua_khoa`/`tuan_cuoi_khoa`, thiếu thì bảng `programmes` — không đọc `PROGRAMME_TEMPLATES` ở đường chạy
  (hằng số chỉ để **seed** và dự phòng khi bảng thiếu dòng).
- **Luật thuần có phép kiểm:** mọi hàm mới ở `shared/domain` có phép kiểm trong `server/src/tests/prLop.tests.ts` (tạo ở Task 1,
  `runPrLopTests(t)`, đăng ký **cuối** `run.ts`, sau khối của PR-N1 nếu đã có).
- **SQL:** libsql-Turso bỏ qua tham số đặt tên → **chỉ dùng `?`**, không `@ten`/`:ten`/`?1` trong câu mới. Mọi câu ghi trong `tx()`.
- **Giữ hành vi:** phép kiểm cũ so chữ/mã cũ thì sửa kỳ vọng sang mới (cùng điều kiện, không xoá); số phép kiểm không giảm.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web).

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-lop-tao-lop -b pr-lop-tao-lop origin/main`.
- [ ] Chép kế hoạch + mockup từ nhánh kế hoạch nếu `main` chưa có:
  `git checkout origin/ke-hoach-nang-cap-27-09 -- docs/superpowers/plans/2026-09-28-pr-lop-tao-lop.md thiet-ke/mockup/21-pr-lop.html`
  (đã có trên `main` thì bỏ bước này).
- [ ] Kiểm PR-N1: `git log origin/main --oneline | grep -i "PR-N1"` và `ls web/src/ui/loiForm.tsx`. Ghi vào Nhật ký "N1 đã merge: có/không".
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm đạt) vào Nhật ký.
- [ ] Đối chiếu nhanh dòng mã kế hoạch dẫn (grep `setClassTeachers`, `computeProgress`, `suggestClassCode`, `phamViMacDinh`,
  `ORDER BY b.id, c.code`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-LOP (0): kế hoạch + mockup 21 + mốc {B} phép kiểm`.

## Task 1 · Luật thuần tên lớp `shared/domain/tenLop.ts` (T1, T2, L1, PF5, PF6, K2-07, K2-08, K5-68)

**Files:** tạo `shared/domain/tenLop.ts` (+ `export * from './tenLop.ts'` trong `shared/domain/index.ts`), tạo
`server/src/tests/prLop.tests.ts`; sửa `server/src/tests/run.ts` (đăng ký cuối, trước khối in tổng).

**Interfaces:**
```ts
export const THU_TU_KY_HIEU = ['FT', 'FT RF', 'Pre FOU', 'FOU', 'BE', 'ELE'] as const;   // bậc hiển thị (K2-08)
export type KyHieuLop = (typeof THU_TU_KY_HIEU)[number];
export const CHO_TAO_PRE_FOU = false;          // PF6 — PR-MON đổi thành true trong cùng đợt deploy (Q4)
export const MAU_SO_LOP = /^\d{1,4}[A-Za-z]?$/;
export function kyHieuLop(chuongTrinh: string | null, loTrinh: string | null): KyHieuLop | null;  // FT+RF→'FT RF' · FOUND→'FOU' · PREFOU→'Pre FOU'
export function kiemSoLop(so: string): string | null;       // null = hợp lệ, còn lại là câu lỗi hiện dưới ô số
export function locSoLop(go: string): string;                // lọc khi gõ: ≤ 4 chữ số + ≤ 1 chữ cái cuối
export function ghepMaLop(maCn: string, chuongTrinh: string, loTrinh: string | null, so: string): string;  // 'MB FT RF 12'
export function chuanHoaMaLop(s: string): string;            // lower, bỏ khoảng trắng và '-' — khoá tìm + kiểm trùng
export function tachSoLop(code: string, maCn: string): string | null;  // phần số của mã (Sửa thông tin lớp)
export type LopSapXep = { code: string; branchId?: number | null };
export function soSanhLop(a: LopSapXep, b: LopSapXep): number;           // chi nhánh → ký hiệu theo bậc → số tự nhiên → chữ cuối
export type DoiTenCu = { moi: string } | { loi: 'khong-tien-to' | 'khong-theo-mau' | 'lech-chuong-trinh' };
export function tenMoiChoLopCu(l: { code: string; branchCode: string; programmeCode: string | null; route: string | null }): DoiTenCu;
```
- [ ] **Phép kiểm trước** — tạo `server/src/tests/prLop.tests.ts`:
```ts
/** PHÉP KIỂM PR-LOP — tạo lớp, tên lớp, RF, Pre FOU, phân công. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LOP · Tạo lớp, tên lớp, RF, Pre FOU, phân công');

  check('LOP (1) · ghepMaLop / kiemSoLop / locSoLop (T1, L1, PF5)', () => {
    assert(d.ghepMaLop('MB', 'FT', 'LT1', '101') === 'MB FT 101', d.ghepMaLop('MB', 'FT', 'LT1', '101'));
    assert(d.ghepMaLop('MB', 'FT', 'RF', '12') === 'MB FT RF 12', 'RF');
    assert(d.ghepMaLop('MB', 'PREFOU', null, '03') === 'MB Pre FOU 03', 'Pre FOU');
    assert(d.ghepMaLop('CP', 'FOU', null, '101a') === 'CP FOU 101A', 'chữ cái cuối viết hoa');
    assert(d.kiemSoLop('101A') === null && d.kiemSoLop('7') === null, 'số hợp lệ');
    for (const sai of ['', '12345', 'FT 1', '10AB', '1-2']) assert(d.kiemSoLop(sai) !== null, `nhận nhầm "${sai}"`);
    assert(d.locSoLop('ft12a') === '12A' && d.locSoLop('123456') === '1234', d.locSoLop('ft12a'));
  });
  check('LOP (1) · chuanHoaMaLop: ft101 · MB-FT 101 · mb ft 101 cùng một khoá (T2, K2-07)', () => {
    const k = d.chuanHoaMaLop('MB FT 101');
    assert(['MB-FT 101', 'mb ft 101', 'MBFT101'].every((s) => d.chuanHoaMaLop(s) === k) && k.includes(d.chuanHoaMaLop('ft101')), k);
  });
  check('LOP (1) · soSanhLop: 9 < 12 < 101 < 101A; FT < FT RF < Pre FOU < FOU < BE < ELE (K2-08)', () => {
    const ds = ['MB FT 101', 'MB BE 03', 'MB FT 12', 'MB Pre FOU 03', 'MB FT RF 12', 'MB FT 101A', 'MB FT 9', 'MB ELE 05', 'MB FOU 12']
      .map((code) => ({ code, branchId: 1 })).sort(d.soSanhLop).map((x) => x.code).join(' | ');
    assert(ds === 'MB FT 9 | MB FT 12 | MB FT 101 | MB FT 101A | MB FT RF 12 | MB Pre FOU 03 | MB FOU 12 | MB BE 03 | MB ELE 05', ds);
    assert(d.soSanhLop({ code: 'CP FT 1', branchId: 2 }, { code: 'MB ELE 9', branchId: 1 }) > 0, 'chi nhánh đứng trước');
  });
  check('LOP (1) · tenMoiChoLopCu: đổi đúng mẫu, không đoán lớp lạ (T2, K5-68)', () => {
    const doi = (code: string, cn: string, pc: string | null, r: string | null) =>
      JSON.stringify(d.tenMoiChoLopCu({ code, branchCode: cn, programmeCode: pc, route: r }));
    assert(doi('CP-FT 139', 'CP', 'FT', 'LT1') === '{"moi":"CP FT 139"}', 'CP-FT 139');
    assert(doi('UB-FOUND 07', 'UB', 'FOU', null) === '{"moi":"UB FOU 07"}', 'FOUND → FOU');
    assert(doi('MB FT 101', 'MB', 'FT', 'LT1') === '{"moi":"MB FT 101"}', 'đã đúng mẫu → giữ');
    assert(doi('MB-FT THU 01', 'MB', 'FT', 'LT1') === '{"loi":"khong-theo-mau"}', 'lớp thử');
    assert(doi('MB-BE 08', 'MB', 'FT', 'LT1') === '{"loi":"lech-chuong-trinh"}', 'tên nói BE, cột nói FT');
    assert(doi('XX-FT 1', 'MB', 'FT', 'LT1') === '{"loi":"khong-tien-to"}', 'sai tiền tố');
  });
}
```
  `run.ts` (cuối, trước khối in tổng): `const { runPrLopTests } = await import('./prLop.tests.ts');` +
  `await runPrLopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });`
- [ ] **Mã `shared/domain/tenLop.ts`:**
```ts
/** TÊN LỚP (T1, T2, L1, PF5): máy ghép `{CN} {ký hiệu} {số}`; người dùng chỉ chọn và gõ số. Một nguồn cho web + máy chủ + migrate. */
export const THU_TU_KY_HIEU = ['FT', 'FT RF', 'Pre FOU', 'FOU', 'BE', 'ELE'] as const;
export type KyHieuLop = (typeof THU_TU_KY_HIEU)[number];
/** PF6: chỉ mở "Pre FOU" ở Tạo lớp khi PR-MON (một ô Tổng hợp) có trong cùng đợt deploy. PR-MON đổi dòng này thành `true`. */
export const CHO_TAO_PRE_FOU = false;
export const MAU_SO_LOP = /^\d{1,4}[A-Za-z]?$/;

export function kyHieuLop(chuongTrinh: string | null, loTrinh: string | null): KyHieuLop | null {
  const c = (chuongTrinh ?? '').trim().toUpperCase();
  if (c === 'FT') return loTrinh === 'RF' ? 'FT RF' : 'FT';
  if (c === 'PREFOU') return 'Pre FOU';
  if (c === 'FOU' || c === 'FOUND') return 'FOU';
  if (c === 'BE' || c === 'ELE') return c;
  return null;
}
export function kiemSoLop(so: string): string | null {
  const s = so.trim();
  if (!s) return 'Chưa gõ số lớp';
  return MAU_SO_LOP.test(s) ? null : 'Chỉ gõ số (1–4 chữ số), có thể thêm một chữ cái cuối, ví dụ 101A';
}
export function locSoLop(go: string): string {
  const so = go.replace(/[^0-9]/g, '').slice(0, 4);
  return so + (so && /[A-Za-z]$/.test(go) ? go.slice(-1).toUpperCase() : '');
}
export function ghepMaLop(maCn: string, chuongTrinh: string, loTrinh: string | null, so: string): string {
  const kh = kyHieuLop(chuongTrinh, loTrinh);
  if (!kh) throw new Error('chương trình không có ký hiệu tên lớp');
  return `${maCn.trim().toUpperCase()} ${kh} ${so.trim().toUpperCase()}`;
}
export const chuanHoaMaLop = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');

/** Phần sau tiền tố chi nhánh: "FT RF 12" → { kh: 'FT RF', so: '12' } — nhận '-' và khoảng trắng tuỳ ý (tên cũ). */
function tachDuoi(code: string, maCn: string): { kh: KyHieuLop; so: string } | 'khong-tien-to' | 'khong-theo-mau' {
  const m = new RegExp(`^${maCn}[\\s-]+(.+)$`, 'i').exec(code.trim());
  if (!m) return 'khong-tien-to';
  const d = /^(FT[\s-]*RF|FT|PRE[\s-]*FOU|FOUND|FOU|BE|ELE)[\s-]*(\d{1,4}[A-Za-z]?)$/i.exec(m[1].trim());
  if (!d) return 'khong-theo-mau';
  const t = d[1].toUpperCase().replace(/[\s-]/g, '');
  const kh: KyHieuLop = t === 'FTRF' ? 'FT RF' : t === 'PREFOU' ? 'Pre FOU' : t === 'FOUND' ? 'FOU' : (t as KyHieuLop);
  return { kh, so: d[2].toUpperCase() };
}
export function tachSoLop(code: string, maCn: string): string | null {
  const r = tachDuoi(code, maCn);
  return typeof r === 'string' ? null : r.so;
}
export type LopSapXep = { code: string; branchId?: number | null };
/** Chỉ để SẮP XẾP hiển thị — đọc ký hiệu từ tên là được ở đây (không dùng kết quả này cho luật, K2-24). */
export function soSanhLop(a: LopSapXep, b: LopSapXep): number {
  if ((a.branchId ?? 0) !== (b.branchId ?? 0)) return (a.branchId ?? 0) - (b.branchId ?? 0);
  const khoa = (x: LopSapXep) => {
    const cn = x.code.trim().split(/[\s-]+/)[0] ?? '';
    const r = tachDuoi(x.code, cn);
    return typeof r === 'string'
      ? { cn, bac: 99, so: Number.MAX_SAFE_INTEGER, chu: x.code }
      : { cn, bac: THU_TU_KY_HIEU.indexOf(r.kh), so: parseInt(r.so, 10), chu: r.so.replace(/^\d+/, '') };
  };
  const x = khoa(a); const y = khoa(b);
  return x.cn.localeCompare(y.cn) || x.bac - y.bac || x.so - y.so || x.chu.localeCompare(y.chu) || a.code.localeCompare(b.code);
}
export type DoiTenCu = { moi: string } | { loi: 'khong-tien-to' | 'khong-theo-mau' | 'lech-chuong-trinh' };
/** T2: ký hiệu trên tên phải KHỚP cột chương trình/lộ trình — lệch thì không đoán, đưa vào danh sách hỏi chủ sản phẩm. */
export function tenMoiChoLopCu(l: { code: string; branchCode: string; programmeCode: string | null; route: string | null }): DoiTenCu {
  const r = tachDuoi(l.code, l.branchCode);
  if (typeof r === 'string') return { loi: r };
  if (r.kh !== kyHieuLop(l.programmeCode, l.route)) return { loi: 'lech-chuong-trinh' };
  return { moi: `${l.branchCode.toUpperCase()} ${r.kh} ${r.so}` };
}
```
  (Mã chi nhánh chỉ gồm chữ in hoa + số — xác nhận bằng `SELECT code FROM branches` trên DB demo; có ký tự khác thì escape trước khi đưa
  vào `RegExp`.)
- [ ] `npm run check` → commit `PR-LOP (1): luật thuần tên lớp — ghép, kiểm số, chuẩn hoá, sắp xếp, đổi tên cũ`.

## Task 2 · Hằng số RF + Pre FOU, luật phân công `shared/domain/phanCong.ts` (YC-3, YC-4, L3, MH6, T55, T56, M-09, K5-30, K5-37)

**Files:** sửa `shared/domain/normal.ts:14, 94-99, 116-137`, `shared/domain/students.ts:41-42`, `shared/domain/fasttrack.ts:47-50`,
`server/src/platform/sysconfig.ts:172-180`; tạo `shared/domain/phanCong.ts` (+ export `index.ts`).

**Interfaces:**
```ts
export const PROGRAMME_CODES = ['FT', 'PREFOU', 'FOU', 'BE', 'ELE'] as const;               // normal.ts
export const CHUONG_TRINH_KHONG_CHIA_MON: readonly string[] = ['PREFOU'];                  // normal.ts — PF1
export const ROUTES = ['LT1', 'LT2', 'RF'] as const;                                        // students.ts
export const ROUTE_NAME: Record<Route, string> = { LT1: 'Lộ trình 1', LT2: 'Lộ trình 2', RF: 'Refire' };
export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string };   // phanCong.ts
export type SlotPhanCong = { userId: number; skill: string | null; isCore: boolean };
export type LoiPhanCong = { khoa: string; lyDo: string };                                   // khoa = 'gvcn' | mã ô chuẩn
export function oPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[]): OPhanCong[];
export function kiemPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): LoiPhanCong[];
export function moRongPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): SlotPhanCong[];
```
- [ ] **Phép kiểm trước** (khối 2):
```ts
  check('LOP (2) · oPhanCong: FT 6 ô · BE L R W S · FOU L R G+V P · Pre FOU chỉ GVCN (MH6, T55, T56)', () => {
    const nhan = (c: string, k: readonly string[]) => d.oPhanCong(c, k).map((o) => o.nhan).join(' ');
    assert(nhan('FT', d.ENTRY_SKILLS) === 'GVCN L R W1 W2 S', nhan('FT', d.ENTRY_SKILLS));
    assert(nhan('BE', d.REGULAR_SKILLS) === 'GVCN L R W S', nhan('BE', d.REGULAR_SKILLS));
    assert(nhan('FOU', d.REGULAR_SKILLS) === 'GVCN L R G+V P', nhan('FOU', d.REGULAR_SKILLS));
    assert(nhan('PREFOU', ['tong_hop']) === 'GVCN', nhan('PREFOU', ['tong_hop']));
    assert(d.PROGRAMME_TEMPLATES.PREFOU.weeks === 5 && d.PROGRAMME_TEMPLATES.PREFOU.checkpoints.length === 1, 'PREFOU 5 tuần, chỉ Cuối khoá');
    assert(d.programmeOf('PREFOU') === 'PREFOU' && d.NORMAL_LADDER.PREFOU === 'FOU' && (d.ROUTES as readonly string[]).includes('RF'), 'hằng số');
  });
  check('LOP (2) · kiemPhanCong: một ô một người, GVCN dạy ≥ 1 kỹ năng; Pre FOU chỉ GVCN, GVCN dạy luôn (L3, L4, T56, M-09)', () => {
    const s = (userId: number, skill: string | null) => ({ userId, skill, isCore: skill === null });
    const loi = (c: string, k: readonly string[], x: any[]) => d.kiemPhanCong(c, k, x).map((l) => `${l.khoa}:${l.lyDo}`).join(' | ');
    assert(loi('FT', d.ENTRY_SKILLS, [s(1, null), s(2, null), s(1, 'listening')]).startsWith('gvcn:Chỉ chọn một GVCN'), 'hai GVCN');
    assert(/^gvcn:GVCN phải dạy ít nhất một kỹ năng/.test(loi('FT', d.ENTRY_SKILLS, [s(1, null), s(2, 'listening')])), 'GVCN không dạy');
    assert(/^listening:Mỗi môn một người/.test(loi('BE', d.REGULAR_SKILLS, [s(2, 'listening'), s(3, 'listening')])), 'hai người một môn');
    assert(/^writing1:Lớp không có môn này/.test(loi('BE', d.REGULAR_SKILLS, [s(2, 'writing1')])), 'môn lạ');
    assert(loi('PREFOU', ['tong_hop'], [s(1, null)]) === '' && loi('PREFOU', ['tong_hop'], [s(1, null), s(1, 'tong_hop')]) === '', 'Pre FOU: GVCN đủ');
    assert(/^gvcn:Lớp Pre FOU chỉ có GVCN/.test(loi('PREFOU', ['tong_hop'], [s(1, null), s(2, 'tong_hop')])), 'Pre FOU: người thứ hai');
    const mr = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(1, null)]).map((x: any) => `${x.userId}:${x.skill}`).join(' ');
    assert(mr === '1:null 1:tong_hop', `Pre FOU: GVCN tự nhận ô Tổng hợp → ${mr}`);
    assert(d.moRongPhanCong('PREFOU', ['tong_hop'], []).length === 0 && d.moRongPhanCong('BE', d.REGULAR_SKILLS, [s(1, null)]).length === 1, 'không GVCN / lớp khác: giữ nguyên');
    assert(loi('FT', d.ENTRY_SKILLS, []) === '' && loi('FT', d.ENTRY_SKILLS, [s(2, 'reading')]) === '', 'thiếu phân công vẫn tạo được (L4)');
  });
```
- [ ] **Mã hằng số:** `normal.ts` — `PROGRAMME_CODES` như trên; `SKILL_SHORT` thêm `tong_hop: 'Tổng hợp'`; `PROGRAMME_TEMPLATES` thêm
  `PREFOU: { code: 'PREFOU', name: 'Pre Foundation', weeks: 5, scoringMode: 'ratio', skills: ['tong_hop'], checkpoints: [{ kind: 'final', studyWeek: 5 }] }`
  (giữa FT và FOU) + `CHUONG_TRINH_KHONG_CHIA_MON`. `fasttrack.ts:47` → `{ PREFOU: 'FOU', FOU: 'BE', BE: 'ELE' }` (PF4) + sửa chú thích bậc
  thang. `students.ts` → `ROUTES` + `ROUTE_NAME`. `sysconfig.ts:177` tên lấy `ROUTE_NAME[code]` (bảng trống → seed đủ LT1, LT2, RF).
  Chạy `npm run typecheck` sớm: `Record<ProgrammeCode, …>`/`switch` thiếu `PREFOU` → thêm **chỉ khi** là nhãn; chỗ là luật (lịch, nợ điểm,
  Case, quyền) ghi Nhật ký mục "chuyển PR-MON", để `PREFOU` rơi vào nhánh lớp thường mặc định.
- [ ] **Mã `phanCong.ts`:**
```ts
/** PHÂN CÔNG (L3, MH6, T55, T56, M-09): ô nào có theo chương trình + luật kiểm TRƯỚC khi ghi. Web vẽ lỗi tại ô, máy chủ từ chối — cùng hàm. */
import { CHUONG_TRINH_KHONG_CHIA_MON, skillShort } from './normal.ts';

/** Tên ô FOU TẠM (T55: ô `writing` hiện G+V, `speaking` hiện P). PR-MON thay bằng `tenMon(chuongTrinh, oChuan)` — MH2. */
const NHAN_O_TAM: Record<string, Record<string, string>> = { FOU: { writing: 'G+V', speaking: 'P' } };

export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string };
export type SlotPhanCong = { userId: number; skill: string | null; isCore: boolean };
export type LoiPhanCong = { khoa: string; lyDo: string };

/** T56 (chủ sản phẩm 28/09): lớp không chia môn (Pre FOU) chỉ có MỘT ô — GVCN, và GVCN dạy luôn. */
const khongChiaMon = (ct: string | null) => CHUONG_TRINH_KHONG_CHIA_MON.includes(ct ?? '');

export function oPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[]): OPhanCong[] {
  const gvcn: OPhanCong = { khoa: 'gvcn', skill: null, laGvcn: true, nhan: 'GVCN' };
  if (khongChiaMon(chuongTrinh)) return [gvcn];
  return [gvcn, ...kyNangLop.map((k) => ({ khoa: k, skill: k, laGvcn: false, nhan: NHAN_O_TAM[chuongTrinh ?? '']?.[k] ?? skillShort(k) }))];
}

/** Máy chủ gọi TRƯỚC khi kiểm + ghi: Pre FOU → GVCN tự nhận ô môn duy nhất (`tong_hop`), để quyền nhập điểm / xử lý Case
 *  đi theo phân công môn như mọi lớp (M-09) — không cần nhánh quyền riêng. Lớp khác: trả nguyên. */
export function moRongPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): SlotPhanCong[] {
  if (!khongChiaMon(chuongTrinh)) return [...slots];
  const core = slots.filter((s) => s.isCore);
  return core.length === 1 ? [...core, ...kyNangLop.map((k) => ({ userId: core[0].userId, skill: k, isCore: false }))] : core;
}

export function kiemPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): LoiPhanCong[] {
  const loi: LoiPhanCong[] = [];
  const gvcn = [...new Set(slots.filter((s) => s.isCore).map((s) => s.userId))];
  if (gvcn.length > 1) loi.push({ khoa: 'gvcn', lyDo: 'Chỉ chọn một GVCN' });
  const theoMon = new Map<string, Set<number>>();
  for (const s of slots) {
    if (s.isCore || !s.skill) continue;
    if (!kyNangLop.includes(s.skill)) { loi.push({ khoa: s.skill, lyDo: 'Lớp không có môn này' }); continue; }
    theoMon.set(s.skill, (theoMon.get(s.skill) ?? new Set<number>()).add(s.userId));
  }
  for (const [mon, nguoi] of theoMon) if (nguoi.size > 1) loi.push({ khoa: mon, lyDo: 'Mỗi môn một người' });
  if (khongChiaMon(chuongTrinh)) {
    if (slots.some((s) => !s.isCore && s.skill && s.userId !== gvcn[0])) loi.push({ khoa: 'gvcn', lyDo: 'Lớp Pre FOU chỉ có GVCN — GVCN dạy luôn' });
  } else if (gvcn.length === 1 && !slots.some((s) => !s.isCore && s.skill && s.userId === gvcn[0])) {
    loi.push({ khoa: 'gvcn', lyDo: 'GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này' });
  }
  return [...loi.filter((l) => l.khoa === 'gvcn'), ...loi.filter((l) => l.khoa !== 'gvcn')];
}
```
- [ ] `npm run check` → commit `PR-LOP (2): lộ trình RF, chương trình Pre FOU (hằng số), luật ô phân công một người`.

## Task 3 · Migrate `prLop.ts` + lệnh chạy thử + `kiem-lop-mo-coi` (T2, T7, T78, PF1, K1-46, K5-36, K5-37, K5-67, K5-68)

**Files:** tạo `server/src/migrate/prLop.ts`, `server/src/migrate/chayThuLop.ts`, `server/src/ops/kiemLopMoCoi.ts`; sửa
`server/src/migrate.ts` (1 import + 1 dòng cuối danh sách, sau `migrateXoaDuLieu(conn, applied);` :451), `server/src/schema.sql:56-100`
(3 cột + chỉ mục + chú thích `code` :58), `server/src/seed/seed.ts` (sau vòng `for (const c of CLASSES)` :147-…: một dòng
`dienMocLop(conn)`), `package.json` (2 script).

**Interfaces:**
```ts
export function keHoachDoiTenLop(conn: any): {
  doi: { id: number; cu: string; moi: string }[];
  vaCham: { id: number; cu: string; moi: string | null; trungVoi: string }[];   // cùng mã chuẩn hoá với lớp khác
  khongTheoMau: { id: number; cu: string; lyDo: 'khong-tien-to' | 'khong-theo-mau' | 'lech-chuong-trinh' }[];
};
export function lopMoCoi(conn: any): { id: number; code: string; chiNhanh: string; soHv: number; taoLuc: string }[];     // T7
export function lopFtLechLoTrinh(conn: any): { id: number; code: string; loTrinhLop: string | null; loTrinhHv: string; soHv: number }[];
export function dienMocLop(conn: any): number;   // điền so_tuan/tuan_giua_khoa/tuan_cuoi_khoa cho lớp thường còn trống
export function migratePrLop(conn: any, applied: string[]): void;
```
- [ ] **Phép kiểm trước** (khối 3):
```ts
  const mig: any = await import('../migrate/prLop.ts');
  check('LOP (3) · migrate: cột số tuần, RF, PREFOU, đổi tên bỏ qua va chạm, chạy lại không đổi (T2, T78, K5-68)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const them = (code: string, pc: string, r: string | null) => Number(conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, status, created_at)
       VALUES (?,?,?,?,?,?, 'active', ?)`).run(code, mb, pc, pc, r, pc === 'FT' ? 1 : 0, '2026-09-28').lastInsertRowid);
    const a = them('MB-FT 7771', 'FT', 'LT1'); const b = them('MB-BE 7772', 'BE', null);
    const c1 = them('MB-FT 7773', 'FT', 'LT1'); const c2 = them('mb ft 7773x', 'FT', 'LT1');   // khác mẫu nhưng không va
    const v1 = them('MB-FT 7774', 'FT', 'LT1'); const v2 = them('MB FT 7774', 'FT', 'LT1');    // va chạm khi so chuẩn hoá
    const kh = mig.keHoachDoiTenLop(conn);
    assert(kh.doi.some((x: any) => x.id === a && x.moi === 'MB FT 7771') && kh.doi.some((x: any) => x.id === b), JSON.stringify(kh.doi.slice(0, 3)));
    assert([v1, v2].every((id) => kh.vaCham.some((x: any) => x.id === id)) && !kh.doi.some((x: any) => x.id === v1), 'va chạm phải bỏ qua');
    const applied: string[] = []; mig.migratePrLop(conn, applied);
    const ma = (id: number) => (conn.prepare('SELECT code, so_tuan FROM classes WHERE id = ?').get(id) as any);
    assert(ma(a).code === 'MB FT 7771' && ma(b).code === 'MB BE 7772' && ma(b).so_tuan === 10 && ma(v1).code === 'MB-FT 7774', JSON.stringify([ma(a), ma(b), ma(v1)]));
    assert(!!conn.prepare("SELECT 1 FROM routes WHERE code = 'RF'").get() && (conn.prepare(
      "SELECT weeks FROM programmes WHERE code = 'PREFOU'").get() as any)?.weeks === 5, 'RF / PREFOU');
    assert((conn.prepare("SELECT skill FROM programme_skills WHERE programme_code = 'PREFOU'").get() as any)?.skill === 'tong_hop', 'ô tong_hop');
    const lan2: string[] = []; mig.migratePrLop(conn, lan2);
    assert(!lan2.some((x) => /Đổi tên|Thêm/.test(x)), `chạy lại vẫn đổi: ${lan2.join(' · ')}`);
    conn.prepare(`DELETE FROM classes WHERE id IN (${[a, b, c1, c2, v1, v2].map(() => '?').join(',')})`).run(a, b, c1, c2, v1, v2);
  });
```
  (Chỉ mục duy nhất: phép kiểm không tạo được vì còn hai lớp va chạm — đúng thiết kế; sau khi xoá, lần migrate kế tạo chỉ mục. Kiểm thêm
  một câu: `migratePrLop` lần 3 → `SELECT name FROM sqlite_master WHERE name = 'ux_classes_ma_chuan'` có dòng.)
- [ ] **Mã `server/src/migrate/prLop.ts`** (mọi câu `?`, bọc `tx`, chạy lại được):
```ts
/**
 * PR-LOP (T2, T78, PF1, K1-46, K5-36, K5-37, K5-68): cột số tuần chụp vào lớp · lộ trình RF · chương trình PREFOU · điền số tuần lớp cũ ·
 * đổi tên lớp cũ sang `{CN} {ký hiệu} {số}` (BỎ QUA lớp va chạm / không theo mẫu — in ở `chay-thu:lop`) · chỉ mục mã lớp chuẩn hoá khi sạch.
 */
import { tx } from '../db.ts';
import { chuanHoaMaLop, tenMoiChoLopCu } from '../../../shared/domain/index.ts';

const KHOA_SQL = "lower(replace(replace(code, '-', ''), ' ', ''))";   // = chuanHoaMaLop, viết bằng SQL
const coCot = (conn: any, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all('classes') as any[]).some((c) => c.name === cot);

export function keHoachDoiTenLop(conn: any) {
  const rows = conn.prepare(`SELECT c.id, c.code, c.programme_code, c.route, b.code AS cn FROM classes c JOIN branches b ON b.id = c.branch_id ORDER BY c.id`).all() as any[];
  const theoKhoa = new Map<string, any[]>();
  for (const r of rows) theoKhoa.set(chuanHoaMaLop(r.code), [...(theoKhoa.get(chuanHoaMaLop(r.code)) ?? []), r]);
  const doi: any[] = []; const vaCham: any[] = []; const khongTheoMau: any[] = [];
  for (const r of rows) {
    const kq = tenMoiChoLopCu({ code: r.code, branchCode: r.cn, programmeCode: r.programme_code, route: r.route });
    const cung = (theoKhoa.get(chuanHoaMaLop(r.code)) ?? []).filter((x) => x.id !== r.id);
    if (cung.length) { vaCham.push({ id: r.id, cu: r.code, moi: 'moi' in kq ? kq.moi : null, trungVoi: cung.map((x) => x.code).join(', ') }); continue; }
    if ('loi' in kq) { khongTheoMau.push({ id: r.id, cu: r.code, lyDo: kq.loi }); continue; }
    if (kq.moi !== r.code) doi.push({ id: r.id, cu: r.code, moi: kq.moi });
  }
  return { doi, vaCham, khongTheoMau };
}
export function dienMocLop(conn: any): number {
  return conn.prepare(
    `UPDATE classes SET
       so_tuan = (SELECT weeks FROM programmes p WHERE p.code = classes.programme_code),
       tuan_giua_khoa = (SELECT study_week FROM programme_checkpoints k WHERE k.programme_code = classes.programme_code AND k.kind = 'progress'),
       tuan_cuoi_khoa = (SELECT study_week FROM programme_checkpoints k WHERE k.programme_code = classes.programme_code AND k.kind = 'final')
     WHERE so_tuan IS NULL AND programme_code IS NOT NULL AND programme_code != 'FT'`).run().changes;
}
export function migratePrLop(conn: any, applied: string[]) {
  const now = new Date().toISOString();
  tx(() => {
    const moi = ['so_tuan', 'tuan_giua_khoa', 'tuan_cuoi_khoa'].filter((c) => !coCot(conn, c));
    for (const c of moi) conn.exec(`ALTER TABLE classes ADD COLUMN ${c} INTEGER`);
    if (moi.length) applied.push('Thêm số tuần và mốc Giữa/Cuối khoá chụp vào từng lớp (PF1)');
    if (!conn.prepare("SELECT 1 FROM routes WHERE code = 'RF'").get()) {
      const seq = (conn.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM routes').get() as any).n;
      conn.prepare("INSERT INTO routes (code, name, note, seq, status, created_at) VALUES ('RF', 'Refire', NULL, ?, 'active', ?)").run(seq, now);
      applied.push('Thêm lộ trình RF (Refire)');
    }
    if (!conn.prepare("SELECT 1 FROM programmes WHERE code = 'PREFOU'").get()) {
      conn.prepare("INSERT INTO programmes (code, name, weeks, scoring_mode, status, created_at) VALUES ('PREFOU', 'Pre Foundation', 5, 'ratio', 'active', ?)").run(now);
      conn.prepare("INSERT INTO programme_skills (programme_code, skill, seq) VALUES ('PREFOU', 'tong_hop', 0)").run();
      conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES ('PREFOU', 'final', 5)").run();
      applied.push('Thêm chương trình Pre FOU (5 tuần, chỉ Cuối khoá, một điểm Tổng hợp)');
    }
    const dien = dienMocLop(conn);
    if (dien) applied.push(`Chụp số tuần cho ${dien} lớp thường đang có`);
    const kh = keHoachDoiTenLop(conn);
    for (const x of kh.doi) conn.prepare('UPDATE classes SET code = ? WHERE id = ?').run(x.moi, x.id);
    if (kh.doi.length) applied.push(`Đổi tên ${kh.doi.length} lớp sang mẫu mới (T2)`);
    const boQua = kh.vaCham.length + kh.khongTheoMau.length;
    if (boQua) applied.push(`Giữ nguyên tên ${boQua} lớp trùng/không theo mẫu — xem lệnh chạy thử đổi tên lớp`);
    const trung = conn.prepare(`SELECT ${KHOA_SQL} AS k FROM classes GROUP BY k HAVING COUNT(*) > 1 LIMIT 1`).get();
    if (!trung && !conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'ux_classes_ma_chuan'").get()) {
      conn.exec(`CREATE UNIQUE INDEX ux_classes_ma_chuan ON classes (${KHOA_SQL})`);
      applied.push('Khoá trùng tên lớp không phân biệt hoa/thường, dấu "-"');
    }
  });
}
export function lopMoCoi(conn: any) {
  return conn.prepare(
    `SELECT c.id, c.code, b.code AS chiNhanh, c.created_at AS taoLuc,
            (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS soHv
       FROM classes c JOIN branches b ON b.id = c.branch_id
      WHERE c.status = 'active' AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.status = 'active')
      ORDER BY c.created_at DESC`).all();
}
export function lopFtLechLoTrinh(conn: any) {
  return conn.prepare(
    `SELECT c.id, c.code, c.route AS loTrinhLop, cy.route AS loTrinhHv, COUNT(*) AS soHv
       FROM classes c JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
       JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active'
      WHERE c.is_fast_track = 1 AND cy.route IS NOT NULL AND cy.route != COALESCE(c.route, '')
      GROUP BY c.id, cy.route ORDER BY c.code`).all();
}
```
  `migrate.ts`: `import { migratePrLop } from './migrate/prLop.ts';` + `/* PR-LOP: số tuần lớp, RF, Pre FOU, đổi tên lớp (T2, T78). */
  migratePrLop(conn, applied);` cuối danh sách. `schema.sql`: trong `CREATE TABLE classes` thêm `so_tuan INTEGER, tuan_giua_khoa INTEGER,
  tuan_cuoi_khoa INTEGER` (chú thích: "chụp lúc tạo lớp — PF1; NULL với FT") và sau bảng `CREATE UNIQUE INDEX ux_classes_ma_chuan ON
  classes (lower(replace(replace(code, '-', ''), ' ', '')));`; chú thích `code` :58 → `"CP FT 110" — máy ghép {CN} {ký hiệu} {số} (T1)`.
  `seed.ts`: sau vòng lớp gọi `dienMocLop(conn)` (seed không chạy `migrate()`).
- [ ] **Lệnh chạy thử** `server/src/migrate/chayThuLop.ts` — CHỈ ĐỌC, dùng `db()` như `migrate/run.ts`, **không** gọi `migrate()`; in 5
  bảng `console.table`: (1) `n lớp sẽ đổi tên` — `cũ → mới`; (2) **va chạm** — `cũ · trùng với`; (3) **không theo mẫu** — `cũ · lý do`
  (chữ Việt: "không có mã chi nhánh đầu tên" / "phần sau không phải kiểu + số" / "tên nói kiểu khác chương trình của lớp"); (4) lớp không
  phân công (`lopMoCoi`, T7); (5) lớp FT có em đang ở lộ trình khác lộ trình lớp (`lopFtLechLoTrinh`, chuẩn bị K5-60). Cột chưa có
  (`so_tuan`) → vẫn chạy (không đọc cột mới). `server/src/ops/kiemLopMoCoi.ts` in riêng bảng (4) kèm câu hướng dẫn: "Mỗi lớp: Quản trị
  mở hồ sơ lớp → ⋮ Sửa phân công, hoặc ⋮ Xoá lớp nếu tạo nhầm". `package.json`:
  `"chay-thu:lop": "npm run build:server && node dist-server/server/src/migrate/chayThuLop.js"`,
  `"kiem-lop-mo-coi": "npm run build:server && node dist-server/server/src/ops/kiemLopMoCoi.js"`. Session code chạy thử cả hai **trên DB
  demo trong worktree**, dán kết quả vào Nhật ký.
- [ ] `npm run check` → commit `PR-LOP (3): migrate số tuần lớp, RF, Pre FOU, đổi tên lớp cũ + lệnh chạy thử chỉ đọc`.

## Task 4 · Một nguồn số tuần: bảng + số tuần chụp vào lớp (PF1, T62, K1-46, K2-24, K5-36, K5-45 phần lớp)

**Files:** `server/src/classes/schedule.ts:236-278` (`classProgressMany`), `:281-370` (`computeProgress`), `:405-440` (`setClassProgress`),
`:535-560` (thiếu thông tin); `server/src/normal/regular.ts:308` (`planRegularTests`); `server/src/classes/thongTinLop.ts:68`;
`server/src/classes/intake.ts:231`.

- [ ] **Phép kiểm trước** (khối 4):
```ts
  const sch: any = await import('../classes/schedule.ts');
  const sys: any = await import('../platform/sysconfig.ts');
  check('LOP (4) · sửa số tuần ở Quản trị: lớp tạo sau theo số mới, lớp cũ giữ số lúc tạo (PF1, K1-46, K2-24)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const tao = (so: string) => (intakeMod.createClass(P.admin, { code: `MB BE ${so}`, branchId: mb, kind: 'BE', startDate: '2026-09-28' }) as any).id;
    const cu = tao('8801');
    sys.saveProgramme(P.admin, { code: 'BE', name: 'Beginner', weeks: 12, finalWeek: 12, progressWeek: 6 });
    const moi = tao('8802');
    const pr = sch.classProgressMany([cu, moi]);
    assert(pr.get(cu).totalWeeks === 10 && pr.get(cu).finalWeek === 10, `lớp cũ: ${pr.get(cu).totalWeeks}/${pr.get(cu).finalWeek}`);
    assert(pr.get(moi).totalWeeks === 12 && pr.get(moi).finalWeek === 12 && pr.get(moi).progressWeek === 6, 'lớp mới');
    assert(!/PREFOU|ielts/i.test(String(pr.get(moi).label)) && /^BE · /.test(String(pr.get(moi).label)), String(pr.get(moi).label));
    sys.saveProgramme(P.admin, { code: 'BE', name: 'Beginner', weeks: 10, finalWeek: 10, progressWeek: 5 });
  });
```
  (`intakeMod = await import('../classes/intake.ts')` đầu file. Khối này cần Task 5 cho phần chụp số tuần trong `createClass` — viết
  phép kiểm ở đây, mã chụp ở Task 5 bước đầu; nếu chạy riêng Task 4 thì phép kiểm đỏ tới Task 5 — chấp nhận, ghi Nhật ký.)
- [ ] **Mã:** `computeProgress(c, start, activeStudents, canXepLop, programmes: Map<string, ProgrammeInfo>)` — `classProgressMany` và
  `classProgress` gọi `allProgrammes()` **một lần** rồi truyền vào. Trong hàm:
```ts
  const code = (c.programme_code ?? programmeOf(c.kind)) as ProgrammeCode | null;
  const prog = code ? programmes.get(code) ?? null : null;
  const chup = c.so_tuan !== null && c.so_tuan !== undefined;          // lớp đã chụp số tuần lúc tạo (PF1)
  const totalWeeks = chup ? c.so_tuan : prog?.weeks ?? null;
  const defProgress = chup ? c.tuan_giua_khoa ?? null : prog?.checkpoints.find((k) => k.kind === 'progress')?.studyWeek ?? null;
  const defFinal = chup ? c.tuan_cuoi_khoa ?? c.so_tuan : prog?.checkpoints.find((k) => k.kind === 'final')?.studyWeek ?? null;
```
  Nhãn tiến độ (:341-352): `parts = [kyHieuLop(code, c.route) ?? prog?.name ?? '']` thay `tpl.code` (hết `PREFOU · tuần 3/5` → `Pre FOU ·
  tuần 3/5`); `programmeName: prog?.name ?? null`; `placementOptions` lấy tên từ `programmes`. `setClassProgress`: `weeks = c.so_tuan ??
  allProgrammes().get(code)?.weeks ?? null`; chữ lỗi "Tuần Giữa khoá / Tuần Cuối khoá", "Giữa khoá phải ở trước Cuối khoá"; lớp chương
  trình không có Giữa khoá (`c.so_tuan` có mà `c.tuan_giua_khoa` null) nhận `progressWeek` → `badRequest('Chương trình này không có bài
  Giữa khoá.')`. Thiếu thông tin (:546): `prog = programmes.get(code)`; `tpl.skills` → `prog?.skills`; chương trình trong
  `CHUONG_TRINH_KHONG_CHIA_MON` → `missingSkills = []` (chỉ cảnh báo thiếu GVCN — K2 §4b "Thiếu GV tong_hop" sai). `regular.ts:308`:
  lặp `['progress','final']` và bỏ kind có tuần null trong `progress` (thay vì `prog.checkpoints`), giữ thông báo cũ khi cả hai null.
  `thongTinLop.ts:68` và `intake.ts:231` đọc `programmeByCode(code)` (bảng), dự phòng `PROGRAMME_TEMPLATES` khi bảng thiếu dòng.
- [ ] `npm run check` → commit `PR-LOP (4): tiến độ lớp đọc một nguồn (bảng + số tuần chụp vào lớp), nhãn chương trình không lộ mã`.

## Task 5 · Máy chủ: `taoLopVaPhanCong` một giao dịch + phân công một người (YC-1, YC-4, T5, L3, L4, PF6, K5-30(2))

**Files:** `server/src/classes/intake.ts:495-548` (`createClass`), thêm `taoLopVaPhanCong`; `server/src/classes/classes.ts:747-765`
(`teacherCandidates`), `:824-935` (`setClassTeachers` → tách `ghiPhanCong`); `server/src/routes/index.ts:332-345` (`/ref/teachers`),
`:1135-1138` (`POST /classes`).

**Interfaces:**
```ts
export type TaoLopInput = { branchId: number; chuongTrinh: string; loTrinh?: string | null; so: string;
  startPeriodId?: number | null; slots?: SlotPhanCong[]; previousClassId?: number | null; note?: string | null };
export function taoLopVaPhanCong(p: Principal, input: TaoLopInput): { id: number; code: string };   // intake.ts
export function ghiPhanCong(p: Principal, classId: number, slots: SlotPhanCong[], ngay: string): { added: number; ended: number }; // classes.ts, gọi TRONG tx
export function kiemTruocPhanCong(classId: number | null, branchId: number, chuongTrinh: string | null, kyNang: string[], slots: SlotPhanCong[]): void; // ném badRequest
```
- [ ] **Phép kiểm trước** (khối 5):
```ts
  check('LOP (5) · taoLopVaPhanCong: sai luật → KHÔNG có lớp; đúng → lớp + phân công cùng lúc (YC-1, L4)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const gv = (conn.prepare(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND (ur.branch_id IS NULL OR ur.branch_id = ?) ORDER BY u.id LIMIT 2`).all(mb) as any[]).map((x) => x.id);
    const dem = () => (conn.prepare("SELECT COUNT(*) n FROM classes WHERE code LIKE 'MB FT RF 88%'").get() as any).n;
    const truoc = dem();
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '881',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[1], skill: 'listening', isCore: false }] }), /GVCN phải dạy/, 'GVCN không dạy');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '882',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[1], skill: null, isCore: true }] }), /một GVCN/, 'hai GVCN');
    assert(dem() === truoc, 'lớp tàng hình còn sót');
    const r = intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '883',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[0], skill: 'reading', isCore: false }] });
    assert(r.code === 'MB FT RF 883' && (conn.prepare("SELECT COUNT(*) n FROM teacher_assignments WHERE class_id = ? AND status = 'active'").get(r.id) as any).n === 2, JSON.stringify(r));
    assertThrows(() => intakeMod.createClass(P.admin, { code: 'mb-ft rf 883', branchId: mb, kind: 'FT' }), /Đã có lớp/, 'trùng không phân biệt hoa/thường, dấu -');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'PREFOU', so: '03', startPeriodId: 1 }), /chưa mở/, 'PF6');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'BE', so: '12A3' }), /Chỉ gõ số/, 'số sai mẫu');
    conn.prepare('DELETE FROM teacher_assignments WHERE class_id = ?').run(r.id); conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(r.id);
    conn.prepare('DELETE FROM classes WHERE id = ?').run(r.id);
  });
```
- [ ] **Mã `createClass`** (giữ export — seed/phép kiểm cũ dùng; **không** còn route gọi thẳng):
  (a) kiểm tiền tố :511 → `new RegExp(`^${branch.code}[\\s-]`, 'i')` (nhận tên cũ lẫn mới); (b) trùng :514 →
  `SELECT code FROM classes WHERE lower(replace(replace(code,'-',''),' ','')) = ?` với `chuanHoaMaLop(code)` → `Đã có lớp ${code}.`;
  (c) chương trình: `const prog = allProgrammes().get(programmeOf(kind) ?? '')` — kỹ năng `input.skills?.length ? input.skills :
  prog?.skills ?? PROGRAMME_TEMPLATES[...]?.skills ?? ENTRY_SKILLS` (K5-45 phần lớp); (d) INSERT thêm `so_tuan, tuan_giua_khoa,
  tuan_cuoi_khoa` = `prog.weeks`, mốc `progress`/`final` của `prog` (FT: NULL cả ba).
- [ ] **Mã `taoLopVaPhanCong`** (intake.ts, sau `createClass`):
```ts
/** YC-1/T5/L4: MỘT lệnh, MỘT giao dịch — kiểm tên + ba luật phân công TRƯỚC, sai thì không ghi gì. Thiếu phân công vẫn tạo được. */
export function taoLopVaPhanCong(p: Principal, input: TaoLopInput) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { branchId: input.branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.');
  const slots0 = input.slots ?? [];
  if (slots0.length) require_(p, PERMISSIONS.CLASS_ASSIGN, { branchId: input.branchId }, 'Bạn không có quyền phân công giáo viên ở chi nhánh này.');
  const conn = db();
  const branch = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.branchId) as any;
  if (!branch) throw notFound('Không tìm thấy chi nhánh');
  const ct = programmeOf(input.chuongTrinh);
  const prog = ct ? allProgrammes().get(ct) : null;
  if (!ct || !prog) throw badRequest('Chọn chương trình của lớp.');
  if (ct === 'PREFOU' && !CHO_TAO_PRE_FOU) throw badRequest('Lớp Pre FOU chưa mở — sẽ mở cùng đợt cập nhật hệ môn học.');
  const loTrinh = ct === 'FT' ? String(input.loTrinh ?? '') : null;
  if (ct === 'FT' && !activeRouteCodes().includes(loTrinh!)) throw badRequest('Chọn lộ trình LT1, LT2 hoặc RF.');
  const loiSo = kiemSoLop(String(input.so ?? ''));
  if (loiSo) throw badRequest(loiSo);
  if (ct !== 'FT' && !input.startPeriodId) throw badRequest('Chọn tuần khai giảng — mốc Giữa/Cuối khoá đếm từ tuần này.');
  const slots = moRongPhanCong(ct, prog.skills, slots0);   // Pre FOU: GVCN tự nhận ô Tổng hợp (T56)
  kiemTruocPhanCong(null, input.branchId, ct, prog.skills, slots);
  const code = ghepMaLop(branch.code, ct, loTrinh, String(input.so));
  return tx(() => {
    const lop = createClass(p, { code, branchId: input.branchId, kind: ct, route: loTrinh as Route | null, isFastTrack: ct === 'FT',
      startPeriodId: input.startPeriodId ?? null, previousClassId: input.previousClassId ?? null, note: input.note ?? null }) as any;
    if (slots.length) ghiPhanCong(p, lop.id, slots, demoToday());
    return { id: lop.id as number, code };
  });
}
```
  `startDate` của lớp thường = `week_start` của `startPeriodId` (đọc `report_periods`) như `transition.ts` đang làm.
- [ ] **Mã `classes.ts`:** `kiemTruocPhanCong` = (1) `kiemPhanCong(ct, kyNang, slots)` → lỗi đầu tiên thành `badRequest(\`${nhanO}: ${lyDo}\`)`
  (nhãn ô qua `oPhanCong`, không lộ mã `writing1`); (2) mỗi `userId` phải thuộc `teacherCandidatesBranch(branchId)` (tách từ
  `teacherCandidates`, không cần `classId`). `setClassTeachers` :835-901 → dựng `slots`, qua `moRongPhanCong(prog?.code, classSkills, slots)` (Pre FOU: đổi GVCN thì ô
  Tổng hợp đổi theo — dòng cũ kết thúc như mọi ô), gọi `kiemTruocPhanCong(classId, cls.branch_id,
  prog?.code, classSkills, slots)`, rồi `tx(() => { ghiPhanCong(...); return classTeachers(p, classId); })`. `ghiPhanCong` = thân `tx`
  cũ :904-931 (giữ `effective_from` dòng không đổi). Câu lỗi cũ "Kỹ năng … đang được xếp cho 2 giáo viên…" thay bằng câu của
  `kiemPhanCong`; phép kiểm cũ so chữ đó sửa kỳ vọng. `/ref/teachers` :342: `r.key IN ('teacher','manager')` (bỏ `system_admin` — đang
  lệch với `teacherCandidates` → chọn Quản trị thuần là bị từ chối, Mâu thuẫn #3). `POST /classes` → `intakeSvc.taoLopVaPhanCong(...)`.
- [ ] `npm run check` → commit `PR-LOP (5): tạo lớp + phân công một giao dịch, kiểm luật trước khi ghi, Pre FOU khoá tới PR-MON`.

## Task 6 · Tìm lớp, sắp xếp, phạm vi mặc định (T2, T6, K2-07, K2-08)

**Files:** `server/src/classes/classes.ts:140, 257-270`; `server/src/classes/hocVienLop.ts:52-68, 168-173`; `shared/domain/hocVienLop.ts:72-76`;
`server/src/routes/index.ts:242` (`/ref/classes`); `server/src/classes/transition.ts:102`; `server/src/classes/loTrinhTiep.ts:64`;
`server/src/classes/luuTru.ts:42` (+ lọc `q` của khu Lưu trữ); `server/src/keHoach/keHoachTest.ts:55`;
`web/src/modules/test/keHoach/TimLop.tsx:4` (dùng `chuanHoaMaLop` chung, xoá bản riêng).

- [ ] **Phép kiểm trước** (khối 6):
```ts
  check('LOP (6) · phạm vi mặc định: QL/Quản trị → Chi nhánh kể cả khi có dạy; GV thuần → Lớp tôi dạy (T6)', () => {
    assert(d.phamViMacDinh(['toi', 'chi-nhanh'], true) === 'chi-nhanh' && d.phamViMacDinh(['chi-nhanh', 'tat-ca'], true) === 'chi-nhanh', 'QL/QT');
    assert(d.phamViMacDinh(['toi', 'chi-nhanh'], false) === 'toi', 'GV có quyền chi nhánh nhưng không phải QL');
  });
  check('LOP (6) · tìm lớp theo tên cũ có "-" và gõ liền; danh sách xếp số tự nhiên (K2-07, K2-08)', () => {
    for (const q of ['MB-FT 101', 'mb ft 101', 'ft101']) {
      const r = clsMod.listClassSummaries(P.admin, { q }).rows.map((x: any) => x.code);
      assert(r.includes('MB FT 101'), `${q} → ${r.join(',')}`);
    }
    const ma = clsMod.listClassSummaries(P.admin, {}).rows.filter((x: any) => x.branchCode === 'MB').map((x: any) => x.code);
    assert(ma.join('|') === [...ma].map((code: string) => ({ code })).sort(d.soSanhLop).map((x: any) => x.code).join('|'), ma.join(' · '));
  });
```
  (`clsMod = await import('../classes/classes.ts')` đầu file. Khối 6 chạy **sau** Task 11 mới xanh vì cần tên demo mới — tạm đánh dấu `if (!conn.prepare("SELECT 1 FROM classes WHERE code =
  'MB FT 101'").get()) return;` rồi bỏ dòng đó ở Task 11.)
- [ ] **Mã:** `phamViMacDinh(coThe, laQuanLy = false)`: `if (laQuanLy && coThe.includes('chi-nhanh')) return 'chi-nhanh';` rồi luật cũ.
  Máy chủ `hocVienLop.ts:68`: `laQuanLy = p.roleKeys.some((k) => k === 'manager' || k === 'system_admin')`. Phép kiểm cũ
  `hocVienLop.tests.ts:97-99` giữ nguyên (không truyền cờ). Tìm: `classes.ts:269-270` và `hocVienLop.ts:171` so
  `chuanHoaMaLop(code).includes(chuanHoaMaLop(q))`; tên HV giữ như cũ. Sắp xếp: sau mỗi câu `ORDER BY … c.code` ở danh sách trên,
  `rows.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }))` (Lưu trữ: giữ
  `finished_at DESC` trước, cùng ngày mới so lớp). Chỗ còn `ORDER BY c.code` ngoài danh sách này (`planning.ts:164`, `canCham.ts:388`,
  `bangChiNhanh.ts:67`, `branchpulse.ts:137`, `summary.ts:159`, `xoaTaiKhoan.ts`) → chuyển PR-UXF (ghi thân PR).
- [ ] `npm run check` → commit `PR-LOP (6): tìm lớp nhận tên cũ, xếp số tự nhiên, QL/Quản trị mở phạm vi Chi nhánh`.

## Task 7 · Sửa thông tin lớp, Chuyển tiếp "+ Mở lớp mới", vào lớp FT theo lộ trình lớp đích (YC-2, T71, K2-16, K2-17, K2-18, M-20)

**Files:** `server/src/classes/thongTinLop.ts:13-83`; `server/src/classes/transition.ts:26-35, 113-125, 172-222`; `shared/domain/lenLop.ts:63-80`;
`server/src/classes/luatLoTrinh.ts:227-229, 243, 317-319, 424`; `server/src/students/students.ts:209`; phép kiểm cũ `run.ts:4677-4740`,
`lenLop.tests.ts:739, 825`.

- [ ] **Phép kiểm trước** (khối 7):
```ts
  check('LOP (7) · luatDoiLop: FT → FT khác lộ trình = mở lộ trình mới, Case đi theo em (K2-17, M-20)', () => {
    const r = d.luatDoiLop({ ma: 'FT', ft: true, lt: 'LT1' }, { ma: 'FT', ft: true, lt: 'RF' }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && !r.canMucTieu, JSON.stringify(r));
    assert(d.luatDoiLop({ ma: 'FT', ft: true, lt: 'LT1' }, { ma: 'FT', ft: true, lt: 'LT1' }, 'giua-khoa').khoa === 'giu', 'cùng lộ trình giữ');
    assert(d.luatDoiLop({ ma: 'FT', ft: true }, { ma: 'FT', ft: true }, 'giua-khoa').khoa === 'giu', 'thiếu lt (dữ liệu cũ) giữ như cũ');
  });
  check('LOP (7) · Sửa thông tin lớp: chỉ đổi phần số; đổi lộ trình bị chặn khi lớp có HV (YC-2, K2-18)', () => {
    const lop = conn.prepare(`SELECT c.id FROM classes c WHERE c.code = 'MB FT 101'`).get() as any;
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, lop.id, { route: 'RF' }), /đã có \d+ học viên/, 'đổi lộ trình khi có HV');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, lop.id, { so: '1O1' }), /Chỉ gõ số/, 'số sai');
  });
```
  (`ttl = await import('../classes/thongTinLop.ts')` đầu file; khối 7b cần tên demo mới → cùng cơ chế tạm như Task 6.)
- [ ] **`lenLop.ts`:** `LoaiLop = { ma; ft; lt?: string | null }`; dòng đầu `luatDoiLop`: `if (tu.ft && den.ft) return tu.lt && den.lt &&
  tu.lt !== den.lt ? { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' } : { …giữ như cũ };`. Ba chỗ dựng
  `LoaiLop` (`luatLoTrinh.ts:227-228, 317-318`, `students.ts:209`) thêm `lt: enr.route / toClass.route`. **Lộ trình mới = lộ trình lớp
  đích:** `luatLoTrinh.ts:243` → `const route = denLop.ft ? (toClass.route ?? curCycle?.route ?? 'LT1') : null;` và mục tiêu giữ
  `d.mucTieu ?? curCycle?.target_score ?? null` khi FT → FT; `:424` `'LT1'` → `d.toClass.route ?? 'LT1'` (thêm `route` vào `toClass` đọc
  ở `apDungCaLop`). MT mặc định khi mở lộ trình (M1) là **PR-MT** — không làm ở đây.
- [ ] **`thongTinLop.ts`:** input mới `{ so?, loTrinh?, note?, programmeCode? }` (vẫn nhận `code` cũ → tách số bằng `tachSoLop`, không
  khớp thì `badRequest('Chỉ đổi được phần số của tên lớp.')`). Mã mới = `ghepMaLop(branch_code, chuongTrinh, route, so)`; trùng kiểm
  `chuanHoaMaLop` như Task 5. **Q6 (K2-18): khoá** — đổi `route` hoặc chương trình khi lớp có HV (`enrollments` active) hoặc có bài Test →
  `badRequest(\`Lớp đã có ${n} học viên — muốn đổi lộ trình thì chuyển các em sang lớp ${kyHieu} khác.\`)`; đổi lộ trình kéo theo đổi tên
  (`FT` ↔ `FT RF`) trong cùng `UPDATE`. Route kiểm bằng `activeRouteCodes()`; chữ "LT phải là LT1 hoặc LT2" → "Chọn lộ trình LT1, LT2 hoặc RF".
  Đổi sang `PREFOU` cũng qua cờ `CHO_TAO_PRE_FOU`. Khi đổi chương trình: chụp lại `so_tuan`/mốc (lớp chưa có HV).
- [ ] **`transition.ts`:** xoá `suggestClassCode` (:26-35) → `soGoiY(branchCode, ct, route)`: số lớn nhất của các lớp cùng `kyHieuLop`
  trong chi nhánh + 1 (đọc bằng `tachSoLop`, không `LIKE` tên); trả `goiYLopMoi: { branchId, chuongTrinh, loTrinh, so, startPeriodId }`
  thay `suggestedCode` (`startPeriodId` = tuần sau ngày chuyển). `teachers` (:113-120) bỏ — panel Tạo lớp tự nạp. `applyTransition`
  (:201-221): `newClass?: Omit<TaoLopInput, 'branchId'>` → `created = taoLopVaPhanCong(p, { ...input.newClass, branchId: from.branch_id,
  previousClassId: from.id, note: \`Học tiếp từ lớp ${from.code}\` })` (xoá INSERT GVCN không kỹ năng — lách L3). Web mới **không** gửi
  `newClass` (Task 9); giữ đường này cho phép kiểm. Sửa phép kiểm cũ: `run.ts:4677` → kiểm `plan.goiYLopMoi.so` là số; `:4698, :4735`
  và `lenLop.tests.ts:739, 825` gửi `newClass: { chuongTrinh: 'BE', so: '<số chưa dùng>', startPeriodId, slots: [GVCN + một môn] }`.
- [ ] `npm run check` → commit `PR-LOP (7): sửa thông tin lớp theo mẫu tên, chuyển tiếp mở lớp qua cùng hàm, vào FT theo lộ trình lớp đích`.

## Task 8 · Web: panel Tạo lớp mới (YC-1, YC-2, YC-4, T1, T5, K2-15, PF6, YC-12.5.2) — mockup 21 mục 1–3

**Files:** viết lại `web/src/modules/classes/ClassCreatePanel.tsx` (Drawer → `KhungPanel`, như `TeacherAssignPanel`).

**Interfaces:**
```ts
export function ClassCreatePanel(props: {
  onClose: () => void;
  onDone?: (lop: { id: number; code: string }) => void;
  macDinh?: { branchId?: number; chuongTrinh?: string; loTrinh?: string | null; so?: string; startPeriodId?: number | null; previousClassId?: number };
  moHoSo?: boolean;               // mặc định true: tạo xong navigate(`/hoc-vien/lop/${id}`); Chuyển tiếp truyền false
}): JSX.Element;
```
- [ ] **Phép kiểm trước** (khối 8, quét nguồn như PR-N1):
```ts
  check('LOP (8) · panel Tạo lớp: một lệnh, ô số, xem trước, một người mỗi ô, không câu sai (YC-1, YC-2, YC-4)', () => {
    const src = docSach('web/src/modules/classes/ClassCreatePanel.tsx');
    assert(!/\/teachers`|api\.put\(/.test(src), 'còn gọi lệnh phân công thứ hai');
    assert(/oPhanCong\(/.test(src) && /kiemPhanCong\(/.test(src) && /ghepMaLop\(/.test(src) && /locSoLop\(/.test(src), 'chưa dùng luật chung');
    assert(!/hai người dạy|TeacherPick|\+ Thêm giáo viên|Normal|Progress Test|Final Test/.test(src), 'còn chữ/ô cũ');
    assert(/CHO_TAO_PRE_FOU/.test(src) && /navigate\(`\/hoc-vien\/lop\//.test(src), 'PF6 / mở hồ sơ lớp');
  });
```
  (`docSach` = đọc file theo đường tương đối gốc repo — dùng lại hàm của `nenGiaoDien.tests.ts` hoặc `readFileSync` + `path.resolve`.)
- [ ] **Mã** — trạng thái: `branchId` (tự chọn khi `/ref/branches` chỉ trả 1 — A2 §2.5), `kieu: 'FT' | 'THUONG'`, `loTrinh` (mặc định
  'LT1'), `chuongTrinh` ('FOU'), `so`, `startPeriodId`, `chon: Record<string, number | ''>` (khoá = `OPhanCong.khoa`). Suy ra:
```ts
  const ct = kieu === 'FT' ? 'FT' : chuongTrinh;
  const prog = (programmes.data ?? []).find((p) => p.code === ct);               // GET /ref/programmes (có weeks); ô môn từ `skills` của bảng
  const kyNang = ct === 'FT' ? [...ENTRY_SKILLS] : prog?.skills ?? [...(PROGRAMME_TEMPLATES as any)[ct]?.skills ?? []];
  const oList = oPhanCong(ct, kyNang);
  const slots = oList.flatMap((o) => (chon[o.khoa] ? [{ userId: Number(chon[o.khoa]), skill: o.skill, isCore: o.laGvcn }] : []));
  const ma = branch && !kiemSoLop(so) ? ghepMaLop(branch.code, ct, kieu === 'FT' ? loTrinh : null, so) : null;
  const trung = ma && (lopDaCo.data ?? []).some((l) => chuanHoaMaLop(l.code) === chuanHoaMaLop(ma));   // GET /ref/classes?branchId=
  const loiPc = kiemPhanCong(ct, kyNang, slots);
  const LUAT: LuatTruong[] = [{ khoa: 'chi-nhanh', nhan: 'Chi nhánh', chon: true }, { khoa: 'so', nhan: 'Số lớp', toiThieu: 1 },
    ...(kieu === 'THUONG' ? [{ khoa: 'tuan', nhan: 'Tuần khai giảng', chon: true }] : [])];
  const loi: LoiTruong[] = [...dsLoi(LUAT, { 'chi-nhanh': branchId, so, tuan: startPeriodId }),
    ...(so && kiemSoLop(so) ? [{ khoa: 'so', nhan: 'Số lớp', lyDo: kiemSoLop(so)! }] : []),
    ...(trung ? [{ khoa: 'so', nhan: 'Số lớp', lyDo: `Đã có lớp ${ma}` }] : []),
    ...loiPc.map((l) => ({ khoa: `pc-${l.khoa}`, nhan: oList.find((o) => o.khoa === l.khoa)?.nhan ?? '', lyDo: l.lyDo }))];
```
  Báo lỗi theo **PR-N1 Task 6**: `const lf = useLoiForm()`; lỗi ô thường hiện khi `lf.hien(khoa)`; **lỗi phân công (`pc-*`) hiện ngay**
  (luật chéo ô, người chọn cần thấy liền — nghiệm thu YC-1 "ô GVCN báo đỏ"); chân `conThieu: lf.daBam || loiPc.length ? loi.map((l) =>
  ({ nhan: l.nhan, lyDo: l.lyDo, oId: lf.oId(l.khoa) })) : undefined` → `KhungPanel` vẽ dòng xám **`n ô cần sửa ↑`** (`DongCanSua`,
  `nhanCanSua`). Nút **Tạo lớp** (Q2): `disabled={busy || loiPc.length > 0}` + `title` = lỗi đầu; lỗi ô thường → bấm là `lf.bam()` và dừng.
  Nếu Task 0 ghi "N1 chưa merge": dùng `Truong loi={…}` + `conThieu: string[]` sẵn có, ghi Nhật ký, đổi sang `useLoiForm` khi rebase.
- [ ] **Bố cục** (mockup 21 mục 1–3, từ trên xuống): Chi nhánh (`<select>`) · **Kiểu lớp** hai nút phân đoạn `Fast Track · Lớp thường`
  (nút đang chọn dùng viền `acc` + nền `acc-soft`, **không** `btn-primary` — B3) · FT: **Lộ trình** `LT1 · LT2 · RF` (đọc `/ref/routes`) /
  Lớp thường: **Chương trình** `Pre FOU · FOU · BE · ELE` — nút Pre FOU `disabled` khi `!CHO_TAO_PRE_FOU` kèm chữ phụ một dòng "Mở cùng
  đợt cập nhật hệ môn học" · **Số lớp** `<input inputMode="numeric" value={so} onChange={(e) => setSo(locSoLop(e.target.value))}>` rộng
  `w-28 tabular-nums`, chữ phụ "1–4 chữ số, được thêm một chữ cái cuối (101A)" · dòng xem trước `Lớp sẽ là **MB FT RF 12**` (đậm, 14px,
  đổi ngay khi đổi kiểu/lộ trình/số; chưa đủ thì `Lớp sẽ là MB FT RF …` mờ) · **Tuần khai giảng** `WeekPicker` (giữ — PR-NEN thay) · dòng
  "Lớp này sẽ có: `10 tuần · Giữa khoá tuần 5 · Cuối khoá tuần 10`" (Pre FOU: `5 tuần · Cuối khoá tuần 5`; FT: `Lịch MT theo từng HV`),
  số lấy **bảng** `/ref/programmes` · khối **Phân công** — mỗi `OPhanCong` một hàng lưới `grid-cols-[6rem_1fr]`: nhãn trái cố định,
  phải một `<select className="field">` "— Chưa chọn —" + GV (`/ref/teachers?branchId=`, dòng `Tên · 3 lớp`), lỗi một dòng dưới ô.
  Chữ phụ khối: "Mỗi ô một người. Một người nhận nhiều ô được. Thiếu ô nào vẫn tạo được lớp — bổ sung ở hồ sơ lớp." Pre FOU: khối
  chỉ một ô **GVCN**, chữ phụ thay bằng "Lớp Pre FOU không chia môn — GVCN dạy luôn." Bỏ câu "một môn có hai người dạy cũng vậy", bỏ `TeacherPick`. Đổi chương trình → xoá chọn của ô không còn.
- [ ] **Lưu:** `api.post<{ id: number; code: string }>('/classes', { branchId, chuongTrinh: ct, loTrinh: kieu === 'FT' ? loTrinh : null,
  so, startPeriodId, slots, previousClassId: macDinh?.previousClassId })` → `invalidate('/classes'); invalidate('/ref/classes');
  invalidate('/hoc-vien-lop'); invalidate('/my-work')` → toast `Đã tạo lớp ${code}` → `onDone?.(r)` → `moHoSo !== false ?
  navigate(\`/hoc-vien/lop/${r.id}\`) : onClose()`. Lỗi máy chủ → toast (câu đã là tiếng Việt, không mã).
- [ ] `npm run check` → commit `PR-LOP (8): panel Tạo lớp — kiểu lớp, lộ trình/chương trình, ô số, xem trước tên, một người mỗi ô`.

## Task 9 · Web: Sửa phân công, Sửa thông tin lớp, Chuyển tiếp "+ Mở lớp mới", lối vào Sửa phân công (YC-4, K2-16, K2-18, K1-05) — mockup 21 mục 4, 7

**Files:** `web/src/modules/classes/TeacherAssignPanel.tsx` (toàn bộ), `SuaThongTinLopPanel.tsx` (toàn bộ), `TransitionPanel.tsx:34-43,
84-130, 186-250, 291-345`, `ClassOverviewPage.tsx:49-56` (thêm `?viec=phan-cong`), `server/src/worklist/mywork.ts:1007-1020`
(chỉ đường dẫn của việc `no_owner` khi lý do là lớp thiếu GV môn — xem dưới).

- [ ] **Phép kiểm trước** (khối 9): quét nguồn — `TeacherAssignPanel.tsx` không còn `+ Thêm giáo viên`/`HAI người`, có `oPhanCong(` +
  `kiemPhanCong(`; `SuaThongTinLopPanel.tsx` không còn `MB-FT`/ô `code` gõ tự do, có `locSoLop(` + `ghepMaLop(`; `TransitionPanel.tsx`
  không còn `newCode`/`suggestedCode`/`gvcnUserId`, có `<ClassCreatePanel`; ba file (+ `ClassCreatePanel`) có `useLoiForm(` (hoặc `loi=`
  khi N1 chưa merge). Khi N1 đã merge: **bỏ `classes/`** khỏi regex loại trừ của phép kiểm `N1 (7)` (`bo`), để luật YC-12.5.2 phủ cả panel lớp.
- [ ] **TeacherAssignPanel:** `slots` thành `chon: Record<khoa, number | ''>` nạp từ `data.core[0]`, `data.bySkill` (máy chủ trả
  `programmeCode` thêm trong `classTeachers` — sửa `classes.ts:797` thêm `programmeCode: prog?.code ?? null`). Mỗi `OPhanCong` một hàng
  lưới như Task 8 (`Truong` + `<select>`); dữ liệu cũ có **2 người** một ô (trước luật): hiện cả hai tên + câu "Ô này đang có 2 người —
  chọn lại một người" và chặn Lưu tới khi còn một. Lỗi `kiemPhanCong` hiện ngay tại ô; chân `n ô cần sửa ↑`. Gửi
  `{ slots }` như cũ. Giữ khối "Đã từng dạy lớp này". Bỏ chú thích đầu file về "HAI người cùng dạy".
- [ ] **SuaThongTinLopPanel:** ô **Số lớp** (`locSoLop`, đặt sẵn `tachSoLop(lop.code, lop.branchCode)`; lớp tên lạ (null) → hiện ô chữ
  chỉ đọc tên hiện tại + câu "Tên lớp cũ chưa theo mẫu — Quản trị đổi lúc nâng cấp") + dòng xem trước `Lớp sẽ là MB FT 102`; **Lộ trình**
  (FT) ba nút `LT1 · LT2 · RF` — lớp có HV: khoá, câu thấy ngay dưới (không ⓘ): `Lớp đã có 8 học viên — muốn đổi lộ trình thì chuyển các em
  sang lớp FT RF khác`; **Chương trình** khoá như cũ. Gửi `{ so, loTrinh, note, programmeCode }`. Panel cần `branchCode` + `soHocVien` —
  nơi mở (hồ sơ lớp) đã có `soHocVien`; thêm prop `branchCode` lấy từ `classOverview` (đã trả `branchCode`,
  `classes.ts:662`).
- [ ] **TransitionPanel:** xoá khối "Lớp đích chưa có? + Mở lớp mới" (:223-249) + state `newCode/newProgramme/startPeriod/gvcnUserId`.
  Mục `+ Mở lớp mới` trong ô lớp đích (:190, :300) → mở `<ClassCreatePanel moHoSo={false} macDinh={{ ...data.goiYLopMoi, previousClassId:
  data.from.id }} onDone={(lop) => { reload(); ganLopMoi(lop.id); }} />` — `ganLopMoi` đặt `toClassId = lop.id` cho **mọi dòng đang chọn
  "+ Mở lớp mới"** (và `bulkTarget`). Không gửi `newClass` nữa. Hai panel chồng nhau: `KhungPanel` là "một panel một lúc"
  (`khoPanelChung`) → mở Tạo lớp sẽ đóng Chuyển tiếp; nên **Chuyển tiếp giữ state ở cha** (`ClassOverviewPage`) hoặc `ClassCreatePanel`
  nhận `longTrong` = không đăng ký `khoPanelChung`. Chọn cách ít sửa nhất sau khi đọc `khoPanel.ts`; ghi Nhật ký.
- [ ] **Lối vào Sửa phân công (K1-05, phần PR-LOP):** `ClassOverviewPage.tsx:49-56` nhận thêm `?viec=phan-cong` (khi
  `viewer.canAssign`/`coTheSuaPhanCong`) như `chuyen-tiep`. Việc `no_owner` của lớp **chưa có GV môn đó** (`mywork.ts:1007`) đổi
  `actionLabel: 'Sửa phân công'` + đường tới `/hoc-vien/lop/{classId}?viec=phan-cong`; chữ dòng Tổng quan và việc giao tạm GVCN → PR-SOS.
- [ ] `npm run check` → commit `PR-LOP (9): sửa phân công một người mỗi ô, sửa thông tin lớp theo mẫu tên, chuyển tiếp mở lớp bằng panel Tạo lớp`.

## Task 10 · Web: Quản trị › Lộ trình & chương trình, ô tìm đầu trang, chữ mẫu (T62, K1-43, K1-46…K1-50, MH9 phần lớp, K2 §4d)

**Files:** `web/src/modules/platform/CatalogAdmin.tsx` (toàn bộ), `AdminPage.tsx:32`, `server/src/platform/sysconfig.ts:35-165`,
`web/src/modules/platform/Header.tsx:22-68`, chữ mẫu: `shared/domain/hanhTrinh.ts:235`, `web/src/modules/cases/QuickReport.tsx:43`,
`yThuc/RecordViolationPanel.tsx:28`, `yThuc/panelYThuc.tsx:32`, `classes/thaoTacDongHocVien.tsx:32`, `dev/ThanhPhanDemo.tsx:166,173`,
`server/src/worklist/chuongTrinh.ts:7`, `worklist/meeting.ts:500`, `server/src/ops/kiemSauXoa.ts:16, 30-35`.

- [ ] **Phép kiểm trước** (khối 10): `saveRoute(P.admin, { code: 'LT3', name: 'x' })` và `saveProgramme(P.admin, { code: 'PRE-IELTS',
  name: 'x' })` ném `/không thêm/` (K1-48); `saveProgramme` PREFOU `progressWeek: 2` ném `/không có bài Giữa khoá/`; sửa PREFOU
  `weeks: 6` được và `finalWeek` mặc định = 6; quét `CatalogAdmin.tsx` không còn `+ Thêm`, `Progress Test`, `Final Test`, `Loại lớp`,
  `btn-primary' : ''` cho nút chọn; quét toàn `web/src` + `shared/domain` không còn `MB-FT`/`MB-FOU` trong chữ mẫu.
- [ ] **Máy chủ:** `saveRoute`/`saveProgramme` — mã chưa có trong bảng → `badRequest('Không thêm lộ trình/chương trình mới ở đây — tên
  lớp, lịch MT và kỳ vọng đang gắn với các mã có sẵn.')`; chương trình không có dòng `progress` (PREFOU) → từ chối `progressWeek`;
  `finalWeek` bỏ trống → `= weeks`. `listRoutes` thêm hai cột chỉ đọc từ hằng mới trong `tenLop.ts`: `LUAT_LO_TRINH_HIEN = { LT1:
  { kyVong: '−1.0 · −0.5 · target', lichMt: 'Tuần 6 · 12 · 16' }, LT2: {…như LT1}, RF: { kyVong: 'Mọi MT = target', lichMt: 'Tuần 4 · 8' } }`
  (chỉ **chữ hiển thị**; luật thật là PR-MT — PR-MT sửa hằng này nếu đổi, ghi chú ngay trên hằng).
- [ ] **CatalogAdmin:** tiêu đề tab `AdminPage.tsx:32` → **"Lộ trình & chương trình"**; thẻ trái "Lộ trình" cột `Mã · Tên · Kỳ vọng MT ·
  Lịch MT mặc định · Đang dùng` (số căn phải `tabular-nums`, hai cột giữa chữ phụ 12px); thẻ phải **"Chương trình"** cột `Chương trình ·
  Số tuần · Giữa khoá · Cuối khoá · Lớp` (Pre FOU: Giữa khoá `—`); **bỏ** hai nút "+ Thêm…" và ô Mã/Cách chấm/Kỹ năng trong hộp sửa của
  mã gốc (chỉ hiện chữ "Chấm theo tỷ lệ · Tổng hợp"). Hộp sửa chương trình: Tên · Số tuần · Tuần Giữa khoá (ẩn với Pre FOU) · Tuần Cuối
  khoá (mặc định = số tuần) · Còn dùng; ghi chú sau khi lưu: `Áp cho lớp tạo sau khi lưu · 3 lớp đang học giữ 5 tuần` (đếm lớp có
  `so_tuan` khác số mới — máy chủ trả `lopGiuSoCu`). Bộ môn theo **chương trình** (MH9), bỏ `ALL_SKILLS` gộp. Nút chọn không dùng `btn-primary`.
- [ ] **Header (K1-43):** thêm `useApi<LopRef[]>('/ref/classes')` (một lần, đã cache); `q ≥ 2` ký tự → nhóm **Học viên** (như cũ, ≤ 6) +
  nhóm **Lớp** (lọc `chuanHoaMaLop(l.code).includes(chuanHoaMaLop(q))`, ≤ 4, dòng `MB FT 101 · 18 HV`, bấm → `/hoc-vien/lop/{id}`);
  không có gì → một dòng "Không tìm thấy". Nhãn ô `Tìm học viên, lớp…`.
- [ ] **Chữ mẫu:** mọi ví dụ `MB-FT 101`/`MB-FOU 12`/`CP-FT 110` → `MB FT 101`/`MB FOU 12`/`CP FT 110`. `kiemSauXoa.ts`: tìm lớp thử
  bằng `lower(replace(replace(code,'-',''),' ','')) = 'mbftthu01'` (đổi tên hay chưa đều thấy).
- [ ] `npm run check` → commit `PR-LOP (10): Quản trị Lộ trình & chương trình (RF, Pre FOU, không thêm mã), ô tìm có lớp, chữ mẫu tên mới`.

## Task 11 · Dữ liệu demo tên mới + lớp RF (§10.3, T2)

- [ ] Script tạm **không commit** `scratch/doiTenDemo.mjs`: với mọi file `server/src/seed/*.ts`, `server/src/tests/*.ts`, `server/src/tests/*.run.ts`
  thay regex `/\b(MB|BC|CP|HD|UB)-(FOUND|FOU|FT|BE|ELE) /g` → `(m, cn, k) => \`${cn} ${k === 'FOUND' ? 'FOU' : k} \``. Chạy, `git diff --stat`
  ghi Nhật ký. **Không** đổi `kind: 'FOUND'` (chỉ tên). Rebase sau N1 → chạy lại script trên file mới của N1.
- [ ] Sửa tay chỗ script không bắt: `run.ts:1632-1640` (kỳ vọng "bắt đầu bằng" + tạo `MB FT 999`), mọi regex `\w+-BE`, mã `MB-LT5-…`
  (đã đổi ở Task 7). Gỡ hai dòng `return` tạm ở khối 6, 7.
- [ ] `journeys.ts` thêm lớp `{ code: 'MB FT RF 12', branch: 'MB', kind: 'FT', route: 'RF', isFastTrack: true, startDate: '2026-09-07',
  status: 'active', teachers: { listening: 'T_HA', reading: 'T_KHOA', writing1: 'T_KHOA', writing2: 'T_LINH', speaking: 'T_TRANG' }, core: 'T_KHOA' }`
  (không HV — kỳ vọng/lịch RF là PR-MT). Không thêm lớp Pre FOU (D12 → PR-MON, vì PF6). Kiểu `route: 'LT1' | 'LT2' | null` ở
  `journeys.ts:161, 226` → `Route | null`.
- [ ] `npm run seed` (DB demo worktree) → `npm run check` → commit `PR-LOP (11): dữ liệu demo theo tên lớp mới + lớp MB FT RF 12`.

## Task 12 · Cập nhật tài liệu

- [ ] `CODE_MAP.md`: dòng "Lớp" thêm `shared/domain/tenLop.ts` (tên lớp, `CHO_TAO_PRE_FOU`), `shared/domain/phanCong.ts`,
  `taoLopVaPhanCong`, `migrate/prLop.ts`, `migrate/chayThuLop.ts`, `ops/kiemLopMoCoi.ts`; sửa mô tả `POST /classes`.
- [ ] `plan.md` §14: thêm dòng PR-LOP (mã yêu cầu, migrate, cờ Pre FOU chờ PR-MON).
- [ ] Đặc tả §8 dòng PR-LOP, cột Migrate: thêm `classes.so_tuan/tuan_giua_khoa/tuan_cuoi_khoa`, chỉ mục mã lớp chuẩn hoá, "tạo lớp Pre FOU
  mở bằng cờ `CHO_TAO_PRE_FOU` ở PR-MON". `TRIEN_KHAI.md`: mục đợt 1 thêm hai lệnh chạy thử + ghi chú "tên lớp cũ trong nhật ký/hành
  trình giữ nguyên (lịch sử)". `thiet-ke/TU_DIEN_VA_CHU.md`: Kiểu lớp / Lộ trình / Chương trình (K1-50).
- [ ] Commit `PR-LOP (12): tài liệu — CODE_MAP, plan §14, đặc tả §8, TRIEN_KHAI đợt 1, từ điển`.

## Task 13 · Bấm thử theo vai + 375px (một lần), mở PR

- [ ] `npm run seed` → API 4167 + Vite 5367 → chạy mục **KIỂM** bằng Playwright kênh Chrome; ảnh trước (chụp từ `origin/main` cùng cổng)
  và sau vào `thiet-ke/anh/pr-lop/` (`01-tao-lop-ft-truoc.png`, `01-tao-lop-ft-sau.png`, …).
- [ ] Chạy `npm run chay-thu:lop` và `npm run kiem-lop-mo-coi` trên DB demo → dán bảng vào thân PR (mẫu cho chủ sản phẩm đọc).
- [ ] Rebase `origin/main` nếu PR-N1/PR-NEN đã merge (bảng ranh giới) → `npm run check` → push → `gh pr create` tiêu đề
  `PR-LOP: tạo lớp một lệnh, tên lớp mới, RF, Pre FOU (khoá), phân công một người`; thân: bảng mã YC/T → ảnh → đạt/không, mục **Chuyển
  cho PR khác**, **Lệnh cho buổi deploy**, cảnh báo **CÓ migrate**. Tắt cổng, quét `tests/run.js` treo, dọn file tạm.

## KIỂM — kịch bản bấm thử (Task 13)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | QL Vy (2) | Học viên & Lớp → "+ Lớp mới" → Fast Track · RF · số `12` · GVCN Hà + Hà dạy R, W1 khác người | Xem trước `MB FT RF 12`; Tạo lớp → **mở thẳng hồ sơ lớp**; quay lại trang: lớp có ở phạm vi **Chi nhánh** (mặc định, dù Vy có dạy lớp) |
| K2 | QL Vy | Tạo FT LT1, chọn GVCN Hà, không chọn Hà ở kỹ năng nào | Dưới ô GVCN ngay: "GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này"; nút Tạo lớp khoá; chân `1 ô cần sửa ↑` |
| K3 | QL Vy | Thử chọn người thứ hai cho ô GVCN / ô L | Không có cách nào (mỗi ô một `<select>`) |
| K4 | QL Vy | Lớp thường · FOU · số `7` · tuần khai giảng | Ô phân công `GVCN · L · R · G+V · P`; "8 tuần · Giữa khoá tuần 4 · Cuối khoá tuần 8"; tên `MB FOU 7` |
| K5 | QL Vy | Lớp thường · BE; rồi ELE | Ô `GVCN · L · R · W · S`; Pre FOU **mờ** kèm "Mở cùng đợt cập nhật hệ môn học" |
| K6 | QL Vy | Gõ `ft12a3` vào ô số; gõ số đã có `101` (FT LT1) | Ô chỉ còn `12A`; "Đã có lớp MB FT 101" dưới ô số |
| K7 | QL Vy | Ô tìm Học viên & Lớp gõ `MB-FT 101`, `ft101`; ô tìm đầu trang gõ `ft 101` | Ra `MB FT 101`; đầu trang có nhóm **Lớp** |
| K8 | QL Vy | Xem danh sách lớp MB | `MB FT 101 · MB FT 102 · MB FT RF 12 · MB FOU 12 · MB BE …` (số tự nhiên, FT trước lớp thường) |
| K9 | QL Vy | Hồ sơ `MB FT 101` → ⋮ Sửa thông tin lớp | Ô số `101`, xem trước tên; Lộ trình khoá kèm "Lớp đã có n học viên — …" |
| K10 | QL Vy | Hồ sơ lớp → ⋮ Sửa phân công | Mỗi ô một người; bỏ GVCN khỏi kỹ năng cuối → lỗi tại ô GVCN, Lưu khoá |
| K11 | QL Vy | Lớp thường hết khoá → Chuyển tiếp → ô lớp đích "+ Mở lớp mới" | Mở **panel Tạo lớp** điền sẵn chi nhánh, chương trình kế, số gợi ý, tuần sau; tạo xong quay về Chuyển tiếp, lớp mới đã chọn |
| K12 | Quản trị (1) | Quản trị › **Lộ trình & chương trình** | Có RF (Kỳ vọng "Mọi MT = target", Lịch "Tuần 4 · 8"); Pre FOU 5 tuần, Giữa khoá `—`; **không** có nút Thêm |
| K13 | Quản trị | Sửa Pre FOU 5 → 6 tuần, lưu; sửa BE 10 → 12 rồi trả 10 | Ghi chú "Áp cho lớp tạo sau khi lưu · n lớp đang học giữ số cũ"; lớp BE cũ vẫn `tuần x/10` |
| K14 | Quản trị | Học viên & Lớp | Mở ở phạm vi **Chi nhánh** (T6) |
| K15 | GVCN Hà (7) | Học viên & Lớp; hồ sơ lớp | Vẫn "Lớp tôi dạy"; không thấy "+ Lớp mới"; Sửa phân công chỉ xem |
| K16 | 375px | K1, K2, K10, K12 | Nhãn ô phân công một cột thẳng, không tràn ngang; nút ≥ 44px; xem trước tên không xuống dòng giữa chừng |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Kỳ vọng MT RF = target, lịch MT mặc định RF tuần 4/8, MT mặc định khi mở lộ trình mới (vào FT, đổi LT ↔ RF), câu xác nhận "MT đánh lại từ MT1" | **PR-MT** | YC-3 phần luật, M1, M2, K2-17 phần luật MT |
| `tenMon()` thay bảng tên tạm `NHAN_O_TAM` (G+V, P); bật `CHO_TAO_PRE_FOU = true`; quyền Pre FOU đi theo ô `tong_hop` (PR-LOP đã tự gán cho GVCN), `CASE_CATEGORY_SKILL.tong_hop`, người phụ trách Case = GVCN; lịch/nợ điểm/lưới một ô `tong_hop`; kỹ năng GV `writing` → `writing1+writing2` (MH1); lớp demo Pre FOU (D12) | **PR-MON** | K5-30 (1)(3), K5-38, K5-39, K5-45 phần nhập điểm, MH1–MH5, PF6 |
| Ô tuần khai giảng → ô ngày thống nhất kiểu tuần; ô chọn GV nếu dựng thành phần chung (vẫn chỉ tài khoản — T14) | **PR-NEN** | T11, T14 |
| Dòng "Case chưa có người phụ trách" → "n lớp thiếu GV phụ trách môn…", giao tạm GVCN | **PR-SOS** | K1-05 phần Case |
| Khối "Điều sẽ đổi" ở Chuyển lớp một em; T49 khi lớp thường → FT | **PR-LT2b** | K2-34, K2-27 |
| Sắp xếp `soSanhLop` ở `planning.ts`, `canCham.ts`, `bangChiNhanh.ts`, `branchpulse.ts`, `summary.ts`, `xoaTaiKhoan.ts` | **PR-UXF** | K2-08 phần ngoài khu lớp |
| Nhãn chặng dùng chữ "thi" cho bài nội bộ | **PR-S3** | K2 §4b |

## Lệnh cho buổi deploy (đợt 1 — 🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

1. Sao lưu bản chính (`npm run sao-luu`).
2. Nạp biến Turso **bản chính**, chạy **chỉ đọc**: `npm run chay-thu:lop` và `npm run kiem-lop-mo-coi` → gửi kết quả cho planning.
3. Anh/chị duyệt: (a) danh sách đổi tên; (b) từng lớp **va chạm** / **không theo mẫu** — đổi tay tên nào (Quản trị › Sửa thông tin lớp sau
   migrate) hay giữ; (c) từng lớp **không phân công** (T7) — bổ sung phân công hay ⋮ Xoá lớp; (d) lớp FT có em khác lộ trình (chỉ để biết).
4. Migrate **DB THỬ** → deploy nháp → bấm K1, K7, K12 → migrate **DB CHÍNH** (`PISA_CHO_PHEP_MIGRATE_TURSO=<tên máy chủ>`) → `--prod`.
5. Chạy lại `chay-thu:lop`: phần "sẽ đổi tên" phải rỗng; nếu còn va chạm thì chỉ mục khoá trùng **chưa** tạo — sửa tên rồi chạy `migrate` lần nữa.
6. Báo GV: tên lớp mới (bỏ `-`); tên cũ trong nhật ký, hành trình, thông báo cũ giữ nguyên (là lịch sử).

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Số tuần chụp vào lớp bằng **ba** cột `so_tuan`, `tuan_giua_khoa`, `tuan_cuoi_khoa` (không chỉ `so_tuan`) | PF1 "lớp đang học giữ số tuần lúc tạo" phải giữ cả mốc; cột `*_override` cũ vẫn đè lên |
| Q2 | Nút **Tạo lớp** khoá khi còn lỗi **luật phân công** (kèm lý do tại ô + `title`); lỗi ô thường theo kiểu PR-N1 (bấm → hiện, `n ô cần sửa ↑`) | YC-1 đòi "khoá kèm lý do"; ô thường theo quyết định 28/09 không khoá nút |
| Q3 | Mã lớp trùng so bằng **chuẩn hoá** (bỏ `-`, khoảng trắng, hoa/thường) + chỉ mục duy nhất biểu thức, chỉ tạo khi dữ liệu sạch | T1 + K5-68; `MB-FT 101` và `MB FT 101` không được cùng tồn tại |
| Q4 | Cờ PF6 là **hằng số** `CHO_TAO_PRE_FOU` trong `shared/domain/tenLop.ts` (máy chủ từ chối + nút mờ); PR-MON đổi thành `true` | Gắn đúng với "cùng đợt deploy", không cần bảng cấu hình, kiểm được |
| Q5 | `createClass` giữ làm hàm ghi nội bộ (seed/phép kiểm), nhận tiền tố `CN-` lẫn `CN `; **mẫu tên đầy đủ** chỉ kiểm ở `taoLopVaPhanCong` + Sửa thông tin lớp | Tránh sửa ~400 dòng phép kiểm tạo lớp riêng; mọi đường người dùng đều qua hàm chặt |
| Q6 | K2-18: **khoá** đổi lộ trình/chương trình khi lớp có HV hoặc bài Test (không "đổi kèm cảnh báo") | Đổi kèm cảnh báo làm lớp và từng em nói hai lộ trình; chuyển em sang lớp khác là đường đúng |
| Q7 | FT → FT khác lộ trình (kể cả LT1 ↔ LT2) = **mở lộ trình mới**, Case đi theo em, giữ target cũ; thiếu `route` (dữ liệu cũ) → giữ như cũ | K2-17, M-20; không phá dữ liệu lớp cũ chưa có `route` |
| Q8 | "+ Mở lớp mới" tạo lớp **ngay** (panel Tạo lớp) rồi gán vào dòng; huỷ Chuyển tiếp thì lớp mới vẫn còn (xoá bằng ⋮ Xoá lớp) | K2-16 "tạo xong quay lại Chuyển tiếp với lớp đó đã chọn" |
| Q9 | `/ref/teachers` bỏ `system_admin` cho khớp `teacherCandidates` | Hiện chọn được người rồi máy chủ từ chối (Mâu thuẫn #3) |
| Q10 | Lớp demo RF không có HV; không thêm lớp demo Pre FOU | Kỳ vọng/lịch RF là PR-MT; Pre FOU khoá tới PR-MON (PF6) |
| Q11 | Dữ liệu cũ có 2 người một ô: hiện cả hai + bắt chọn lại một, không tự bỏ ai | Không đoán thay người dùng; lỗi chỉ lộ khi mở panel |
| Q13 | **Chủ sản phẩm 28/09:** lớp Pre FOU chỉ **một ô GVCN**, GVCN dạy luôn (bỏ ô "GV dạy"). Lưu: máy chủ tự thêm dòng `tong_hop` cho GVCN (`moRongPhanCong`) | Quyền nhập điểm / xử lý Case đi theo phân công môn như mọi lớp — không cần nhánh quyền riêng ở PR-MON |
| Q12 | Tên hiện chương trình: ký hiệu (`Pre FOU`, `FOU`) ở tên lớp/nhãn tiến độ; tên dài ở bảng (`Pre Foundation`) cho Quản trị | Không lộ mã `PREFOU` (K2-24) |

## Mâu thuẫn nguồn ↔ mã thật

1. `shared/domain/thongTinLop.ts` (bảng ranh giới PR-N1) **không tồn tại**; luật sửa thông tin lớp nằm ở `server/src/classes/thongTinLop.ts`.
2. `seedRoutes` chỉ nạp khi bảng **trống** → thêm `RF` vào `ROUTES` không tự lên DB đang chạy; migrate phải chèn riêng (đã làm).
3. `/ref/teachers` trả cả `system_admin`, `setClassTeachers` chỉ nhận `teacher|manager` → lỗi "không có vai trò giảng dạy" khó hiểu.
4. `ClassCreatePanel` dùng `Drawer`, không phải `KhungPanel` → báo lỗi form của PR-N1 không áp tới đến khi PR-LOP đổi.
5. ~450 chỗ tên lớp kiểu cũ trong seed/phép kiểm (không nói trong đặc tả) → Task 11 đổi cơ học.
6. `kiemSauXoa.ts` tìm `MB-FT THU 01` — tên này **không theo mẫu**, migrate không đổi → lệnh vẫn đúng, nhưng đã đổi sang so chuẩn hoá.

## Nhật ký
- (Task 0) N1 đã merge: **một phần** — #108 gồm Task 0–5b của N1; `web/src/ui/loiForm.tsx`, `shared/domain/loiForm.ts` **chưa có** → Task 8/9 dùng `Truong loi` + `conThieu: string[]` sẵn có, đổi sang `useLoiForm` sau khi N1 Task 6 merge (rebase). · mốc B: **1390** phép kiểm (+ 20 tốc độ). · Dòng mã đối chiếu: lệch ≤ 20 dòng (`setClassTeachers` :837, `computeProgress` :281, `suggestClassCode` :27, `phamViMacDinh` shared/domain/hocVienLop.ts:72, `ORDER BY b.id, c.code` classes.ts:140, `createClass` intake.ts:496, dòng N1 ở migrate.ts:454).
- (Task 0) Chạy bằng skill subagent-driven-development theo lệnh chủ sản phẩm (subagent cùng model Opus 5.5, không Haiku); không rà từng Task bằng subagent (Quy trình nhanh) — người rà là session riêng.
- (Task 1) Mã chi nhánh: seed `MB BC CP HD UB`, bản chính do `initBanChinh` kiểm `^[A-Z0-9]+$` → đưa thẳng vào `RegExp`, không escape (ghi ở chú thích `tachDuoi`). `prLop.tests.ts` chỉ lấy `check, assert` từ kit (các trường khác chưa dùng); kit thật có đủ `seedMax` như brief.
- (Task 2) `npm run typecheck` sau khi thêm `PREFOU`/`RF`: **không** lỗi — mã thật không có `Record<ProgrammeCode, …>`/`switch` đầy đủ nào ngoài `PROGRAMME_TEMPLATES` (đã thêm) và `NORMAL_LADDER` (Partial, đã thêm). Seed demo nay có thêm dòng `programmes` PREFOU (+ `tong_hop`, mốc cuối khoá tuần 5) và `routes` RF (qua `PROGRAMME_TEMPLATES`/`seedRoutes`) — không phép kiểm cũ nào vỡ.
- (Task 2) **Chuyển PR-MON** — chỗ luật để `PREFOU` rơi vào nhánh lớp thường (giả định bốn môn L R W S), chưa sửa: `server/src/students/standing.ts:258` (`required = REGULAR_SKILLS.length`), `server/src/worklist/scoreDebt.ts:72` (nợ điểm duyệt `REGULAR_SKILLS`), `shared/domain/cases.ts:16` (môn của Case lớp tỷ lệ = `REGULAR_SKILLS`), `server/src/platform/accounts.ts:160` · `server/src/routes/index.ts:2022` · `web/src/modules/platform/CatalogAdmin.tsx:17` (danh sách kỹ năng phân công/kỹ năng GV chưa có `tong_hop`). Dự phòng `?? REGULAR_SKILLS` ở `standing.ts:227`, `phanTichLop.ts:55` chỉ chạy khi bảng thiếu dòng — giữ.
- (Task 2) Ghi chú cho Task sau: `server/src/classes/thongTinLop.ts:57` câu lỗi "LT phải là LT1 hoặc LT2." nay đã sai (RF hợp lệ theo `ROUTES`) — thuộc phần Sửa thông tin lớp, chưa sửa ở Task 2.
- (Task 3) Tên cột bảng thật khớp câu SQL kế hoạch (`routes`, `programmes`, `programme_skills`, `programme_checkpoints`, `enrollments`, `learning_cycles.status`, `teacher_assignments`) — không lệch. Seed 13 lớp, **không** có hai lớp trùng khoá chuẩn hoá → chỉ mục `ux_classes_ma_chuan` trong `schema.sql` không làm vỡ seed. Dòng `migratePrLop` đặt ngay sau dòng N1 (migrate.ts:456).
- (Task 3) Khối (3): DB test dựng từ `schema.sql` đã có chỉ mục → không chèn được cặp va chạm; đầu khối thêm `DROP INDEX IF EXISTS ux_classes_ma_chuan` (giả DB cũ), cuối khối lần migrate thứ 3 phải tạo lại chỉ mục.
- (Task 3) **Lệch thứ tự kế hoạch:** 7 bộ phép kiểm gọi trọn `migrate()` giữa chừng (yThuc J9, sosV3, luatMayChu, dieuChinhPa, anToan, congViec, lenLop) → migrate đổi tên 13 lớp demo → `classId('MB-FT 101')` vỡ (check lần 1: 541 đạt rồi dừng). Đã **kéo sớm**: Task 11 bước 1 (script đổi tên cơ học, 503 chỗ / 25 file seed + tests, **bỏ** `prLop.tests.ts` vì phép kiểm Task 1 cố ý dùng tên cũ) + sửa tay `run.ts` phép kiểm TSV (ô `\tMB-FT 101` script không bắt vì `\b`); Task 5 (a)(b) cho `createClass` (tiền tố `CN-`/`CN `, trùng so chuẩn hoá — cần luôn vì chỉ mục mới, không thì lỗi SQLite thô); cùng (a)(b) cho `thongTinLop.ts` (câu lỗi giữ nguyên, Task 7 thay bằng kiểm mẫu đầy đủ). Task 11 còn: lớp `MB FT RF 12`, kiểu `Route`, gỡ `return` tạm khối 6/7; `ops/kiemSauXoa.ts` vẫn tìm `MB-FT THU 01` (Mâu thuẫn #6, chưa sửa).
- (Task 3) Chạy thử trên DB demo worktree (seed bằng mã HEAD 4e5ce36 = tên cũ, không biến Turso): `chay-thu:lop` → (1) 13 lớp sẽ đổi tên (`MB-FOU 03 → MB FOU 03` … `UB-FOUND 07 → UB FOU 07`) · (2) 0 va chạm · (3) 0 không theo mẫu · (4) 0 lớp không phân công · (5) 0 lớp FT lệch lộ trình; md5 file DB trước/sau như nhau (chỉ đọc). `kiem-lop-mo-coi` → 0 lớp. Rồi `npm run migrate` trên cùng DB: thêm 3 cột, chụp số tuần 7 lớp thường, đổi tên 13 lớp, tạo chỉ mục (RF/PREFOU đã có từ seed Task 2); chạy lại: không bước PR-LOP nào áp lại. `npm run check`: 1397 đạt + 20 tốc độ.
- (Task 4) Kéo sớm Task 5 (c)(d) (lệnh controller): `createClass` lấy kỹ năng từ `allProgrammes()` (dự phòng `PROGRAMME_TEMPLATES` → `ENTRY_SKILLS`) và chụp `so_tuan/tuan_giua_khoa/tuan_cuoi_khoa` lúc INSERT. Ba số lấy qua hàm mới `mocChupVaoLop(code)` ở `normal/regular.ts` (FT/chương trình không số tuần → NULL cả ba) — dùng chung với `thongTinLop.ts`: **đổi chương trình của lớp (chưa HV/bài Test) chụp lại số tuần theo chương trình mới** (kế hoạch không ghi; không làm thì lớp BE đổi sang FOU vẫn giữ 10 tuần). `saveProgramme` thật nhận đúng `progressWeek`/`finalWeek` như phép kiểm — không lệch.
- (Task 4) Phép kiểm N+1 "Danh sách lớp…" (ngưỡng < 4 câu/lớp) vỡ 53/52 vì `classProgressMany` + `missingForClasses` mỗi hàm tự gọi `allProgrammes()` (3 câu). Sửa: hai hàm nhận `programmes?` tuỳ chọn, `progressMapOf` nhận map mà `listClassSummaries` đã đọc. `planRegularTests`: một mốc null thì **bỏ** mốc đó (không còn ném "Chưa tính được tuần … thiếu mốc tuần học"); câu "Chương trình … chưa khai báo mốc" dùng `prog.name` thay mã. Nhãn tiến độ điều kiện `totalWeeks` (thay `tpl.weeks`).
- (Task 5) (a)(b) `createClass` đã làm ở Task 3 — chữ lỗi trùng đúng `Đã có lớp ${code}.`; câu lỗi tiền tố đổi ví dụ sang mẫu mới (`MB FT 101`). Thêm (ngoài kế hoạch) `docSlots(raw)` ở `classes.ts`: chuẩn hoá ô phân công gửi lên (tách nguyên văn từ `setClassTeachers`, thêm từ chối khi `slots` không phải mảng) — `taoLopVaPhanCong` và `setClassTeachers` dùng chung. `teacherCandidatesBranch(branchId, classId = null)` **thay** `teacherCandidates` (một hàm; `classId` chỉ để đếm `here`). `/ref/teachers`: bỏ `system_admin` **và** thêm `ur.status = 'active'` cho khớp hẳn `teacherCandidatesBranch`.
- (Task 5) Thứ tự kiểm đổi: ba luật (`kiemPhanCong`) trước, vai trò giảng dạy ở chi nhánh sau (cũ: chi nhánh trước). Ba phép kiểm cũ `run.ts` §19 sửa kỳ vọng (cùng điều kiện): `/không dạy kỹ năng/` → `/Lớp không có môn này/`, `/chỉ một người/` → `/Mỗi môn một người/`, `/một giáo viên chủ nhiệm/` → `/một GVCN/`; `/ít nhất một kỹ năng/` giữ (câu mới vẫn chứa). `taoLopVaPhanCong`: `startDate` = `week_start` của tuần khai giảng (mọi chương trình, khi có tuần); tuần không tồn tại → "Tuần khai giảng không hợp lệ.". **`POST /classes` đã đổi** → panel Tạo lớp hiện tại (gửi `code/kind` rồi `PUT …/teachers`) bị từ chối "Chọn chương trình của lớp." tới khi Task 8 vẽ lại panel.
- (Task 6) Khối 6 **không** cần dòng `return` tạm (tên demo đã đổi ở Task 3). `phamViMacDinh(coThe, laQuanLy)` làm Quản trị (system_admin) cũng mở "Chi nhánh" thay "Tất cả" (đúng T6 "QL/Quản trị") → phép kiểm cũ `hocVienLop.tests.ts` "Q3/Q12 Phạm vi theo vai" sửa kỳ vọng: QL → `chi-nhanh` (cũ: `toi` nếu có dạy), Quản trị → `chi-nhanh` + `coThe` còn `tat-ca` (cũ: `tat-ca`). Tìm lớp: `chuanHoaMaLop` ở `listClassSummaries`, `hocVienLop.ts` (mã lớp của HV), Lưu trữ (bỏ `c.code LIKE ?` trong SQL, lọc JS sau khi đọc), web `TimLop`/`KeHoachTestTab` (xoá `chuanHoaMa` riêng). Chuỗi chỉ gồm `-`/khoảng trắng chuẩn hoá thành rỗng → không coi là khớp mọi lớp. Sắp xếp `soSanhLop` thêm ở `listClassSummaries`, `/ref/classes`, ứng viên lớp đích `transitionPlan`, `lopDuKien` (`loTrinhTiep.ts`), Lưu trữ (`finished_at` theo ngày giảm dần trước), `danhSachLop` Kế hoạch Test (thêm `c.branch_id` vào SELECT). **Chuyển PR-UXF** (còn `ORDER BY c.code`): `planning.ts:164`, `canCham.ts:388`, `bangChiNhanh.ts:67`, `branchpulse.ts:137`, `summary.ts:159`, `xoaTaiKhoan.ts`.
- (Task 7) Khối 7 **không** cần `return` tạm. `capNhatThongTinLop` input thật `{ so?, loTrinh?, note?, programmeCode?, code?, route? }` — `route` giữ làm tên cũ của `loTrinh` (phép kiểm khối 7 và web hiện tại gửi `route`); `code` cũ bằng đúng tên hiện tại thì bỏ qua (web cũ luôn gửi `code`, lớp tên lạ chỉ sửa ghi chú không bị chặn). Khoá Q6 đếm `COUNT(DISTINCT student_id)` **mọi** enrollment (giữ luật cũ "đã có học viên" — lớp đã có em chuyển đi cũng khoá), chữ "muốn đổi lộ trình/chương trình" theo việc đang đổi; không có HV mà có bài Test → "Lớp đã có bài Test nên không đổi được …". Lớp tên lạ (không tách được số) đổi chương trình/lộ trình mà không gõ số → "Tên lớp chưa theo mẫu — gõ số lớp để máy đặt lại tên." (kế hoạch không nói; không có thì `ghepMaLop` ghép số rỗng). Đổi chương trình nay **đổi tên** theo mẫu (BE → FOU: `MB BE 12` → `MB FOU 12`). Phép kiểm cũ `hocVienLop.tests.ts` Q8 đổi dữ liệu/kỳ vọng (cùng điều kiện): lớp thử `MB FT QA4…QA7` → `MB FT 9904…9907` (tên lạ không đổi được chương trình nữa), `/bắt đầu bằng "MB-"/` → `/Chỉ đổi được phần số/`, `/LT1 hoặc LT2/` → `/LT1, LT2 hoặc RF/`, `/đã có học viên/` → `/đã có \d+ học viên/`, đổi mã bằng `{ so: '9914' }`.
- (Task 7) `luatLoTrinh.ts`: `lopHienTaiCua` thêm `c.route` (bảng `enrollments` không có cột `route`); `DongCaLop.toClass` thêm `route?`; `transition.ts` `classInfoOf` đọc thêm `route`. FT → FT mở lộ trình mới giữ `target_score` cũ khi không gửi `mucTieu` (Q7). `goiYLopMoi` null chỉ khi lớp nguồn là FT (`nextStepsAfter('ELE')` = `['FT']` → ELE gợi ý lớp FT LT1, không null). `startPeriodId` gợi ý = `ensurePeriod(thứ Hai tuần sau demoToday)` — xem kế hoạch có thể **tạo** dòng `report_periods` (như `/ref/periods`), không tạo lớp. `soGoiY` đọc mọi lớp (kể cả đã kết thúc) cùng ký hiệu — tránh trùng chỉ mục. `soGoiY` export để phép kiểm lấy số chưa dùng. Phép kiểm cũ `run.ts` (3 chỗ) + `lenLop.tests.ts` (2 chỗ) gửi `newClass: { chuongTrinh: 'BE', so, startPeriodId, slots: [GVCN + listening cùng người] }` (GVCN lấy từ lớp nguồn / `P.normalCoreTeacher`). Web `TransitionPanel` đọc `data` kiểu `any` nên typecheck không vỡ; ô "+ Mở lớp mới" hiện gửi `newClass` kiểu cũ → máy chủ từ chối tới Task 9.
- (Task 8) N1 Task 6 chưa merge → panel Tạo lớp dùng `Truong loi` + `conThieu: string[]` của `KhungPanel` (chân hiện "Còn thiếu: …" thay dòng xám `n ô cần sửa ↑` của mockup) + cờ `daBam` (useState): lỗi Chi nhánh / Số lớp trống / Tuần khai giảng hiện sau khi bấm; số sai mẫu, trùng tên, lỗi phân công hiện ngay; nút khoá khi còn lỗi phân công (Q2). **Đổi sang `useLoiForm` sau khi N1 Task 6 merge.** Phép kiểm khối 8 đúng brief (không có chuỗi của loiForm); `docSach` dùng lại của `panelUx3.tests.ts` (thêm `export`).
- (Task 8) `/ref/programmes` cũ chỉ trả `code, name, weeks, scoringMode` — kế hoạch cần ô môn (`skills`) và mốc Giữa/Cuối khoá từ **bảng** → route nay trả `allProgrammes()` (thêm `skills`, `checkpoints`; giữ các trường cũ — `SuaThongTinLopPanel` không đổi). `/ref/classes?branchId=` đã lọc chi nhánh ở máy chủ → kiểm trùng tên dùng thẳng. `StudentsPage` không sửa (`onDone={() => …}` hợp kiểu mới).
- (Task 9) N1 Task 6 chưa merge → ba panel dùng `Truong loi` / `loi=` + `conThieu` (phép kiểm khối 9 nhận `useLoiForm(` hoặc `loi=`); **bỏ** bước sửa regex `N1 (7)` vì phép kiểm đó chưa có — làm khi rebase sau N1. Sửa lỗi Task 8: "Còn thiếu" chỉ còn ô thường; lỗi luật phân công hiện tại ô + khoá nút (`title`) + chân xám `n ô cần sửa ↑` (`SoOCanSua`, đặt ở `chan.phu` của `KhungPanel` sẵn có — thay bằng `DongCanSua` của N1 sau rebase). Lưới ô phân công tách thành `LuoiPhanCong` (export từ `ClassCreatePanel.tsx`, cùng `PhanDoan`) — Tạo lớp và Sửa phân công dùng chung, không thêm file.
- (Task 9) Hai panel chồng nhau: `TransitionPanel` dùng `Drawer` (không đăng ký `khoPanelChung`) → mở `ClassCreatePanel` (`KhungPanel`) **không** đóng Chuyển tiếp, state giữ nguyên trong `TransitionPanel` — không sửa `web/src/ui/*`, không `longTrong`. Chỉ thêm: khi panel Tạo lớp mở, `Drawer` nhận `onClose` rỗng để Esc chỉ đóng panel trên. Huỷ Tạo lớp → các dòng đang "+ Mở lớp mới" trở về "Chưa chọn"; lớp đích chung mặc định "Chưa chọn" (cũ: "+ Mở lớp mới"). `goiYLopMoi` null (nguồn FT) → panel mở với chi nhánh lớp nguồn.
- (Task 9) `mywork.ts` việc `no_owner`: cờ SQL `thieu_gv_mon` = lớp **có** môn của Case (`class_skills`) mà không phân công đang hiệu lực cho môn đó; chỉ đổi thành "Sửa phân công" + `/hoc-vien/lop/{id}?viec=phan-cong` khi người xem có `CLASS_ASSIGN` ở lớp (GVCN thấy dòng vẫn giữ "Chọn người phụ trách" — không mở được panel). `classTeachers` trả `programmeCode`. `SuaThongTinLopPanel` gửi `loTrinh` chỉ khi khác `lop.route` (lớp FT cũ `route` NULL có HV không bị khoá Q6 oan); câu khoá lộ trình ghép `lớp ${kyHieuLop('FT', route === 'RF' ? 'LT1' : 'RF')} khác` (brief ví dụ "FT RF" cho lớp LT1). Kiểu `HoSoLop` thêm `branchCode` (máy chủ đã trả).
