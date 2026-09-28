# PR-N1 · Sửa lỗi nóng + sửa sai sự thật — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Web đổi tên thành **Pisa Tracking**; sửa các chỗ đang nói sai sự thật (hạn ghi kết quả PA nay **hết Thứ Hai**, bảng
điểm FT tô theo kỳ vọng của đúng mốc, SOS 1 vàng, SOS tạm thời có chữ, "0/4 môn đạt", "quá hạn n ngày", số và dòng ở tab Ý thức
lớp khớp nhau); sửa lỗi nóng của Học viên & Lớp (không tự mở lớp, tiêu đề cột dính), hồ sơ HV (hai khối SOS loại trừ nhau, dòng
PA nhập bù không tự đóng, cột phải nút trên chữ dưới) và báo lỗi form rõ ràng cho mọi `KhungPanel`; thêm Toast "Hoàn tác" 5 giây;
PA quy chế SOS gán tự động và chạy ngay, không còn bước "xác nhận PA gợi ý" (S4-1 phần gán tự động, chủ sản phẩm 28/09).
**Architecture:** Luật mới đều là **hàm thuần** ở `shared/domain` (kiểm được): `weeklyUpdateDue` → Thứ Hai, `hanTheoNgay`,
`nhanTuanGhiKetQua`, `kiemTruong`, `dongViPhamLop`, `nhanHanhDongNhatKy`. Máy chủ chỉ gọi lại các hàm đó + gộp nhóm việc
`do_plan`/`result` + vá truy vấn thẻ chết. Một migrate nhỏ (R-PA5) trong file riêng `server/src/migrate/prN1.ts`. Web chỉ vẽ lại.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql; phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 (T17, T24, T53 Q1, T54, T66, T75), §4.3 YC-6,
§4.4 YC-11.1/11.3.2, §4.5 YC-12.1/12.5.1/12.5.2/12.5.4, §5.6 R-PA1…5, §7.3–7.5, §8 dòng PR-N1, §10 · báo cáo rà
`thiet-ke/ra-27-09/` K1-45, K2-10, K2-37, K3-02, K3-17, K3-18, K3-45, K5-02, K5-12, K5-19, K5-20, K5-24, K5-58, K5-67, K3 §4(c) ·
kế hoạch cũ `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` UX-A A1–A9, UX-C C1 · mockup `thiet-ke/mockup/20-pr-n1.html`.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-N1** · đợt 1 · làn **A** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-n1-sua-loi-nong` · `.claude/worktrees/pr-n1-sua-loi-nong` (từ `origin/main`) |
| Cổng thử | API **4157** · Vite **5357** (không dùng 4000/5173 — hai làn B, C chạy song song ở 4167/5367, 4177/5377) |
| Model | **Sonnet 5 · High** · phương án B: **Fable 5.1 · High** |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có (nhỏ)** — hai câu: (1) PA quy chế SOS đang "chờ xác nhận" → đang chạy (S4-1, Task 5b); (2) dời `action_due` Chủ nhật → Thứ Hai của PA đang chạy (R-PA5, K5-19). Lệnh chạy thử chỉ đọc `chay-thu:n1`. Không migrate gì khác |
| Skill thiết kế | Không gọi taste-skill/impeccable (PR sửa nhỏ, bám mockup 20). Đọc `thiet-ke/HE_GIAO_DIEN.md` §4 và `TU_DIEN_VA_CHU.md` là đủ |
| Phụ thuộc | Không. PR-LOP (làn B) và PR-NEN (làn C) chạy song song — ranh giới file ở bảng dưới |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-N1 (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 13 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang id 9**),
  ảnh trước/sau lưu `thiet-ke/anh/pr-n1/`.
- Không chạm Turso, không deploy, không chạy `migrate` trên bản chính. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Ranh giới file với hai PR chạy song song

| File | PR khác | PR-N1 chỉ được sửa |
|---|---|---|
| `web/src/modules/classes/*` (`ClassCreatePanel`, `TeacherAssignPanel`, `SuaThongTinLopPanel`, `XoaKetThucLopPanel`, `BangDiemLopThuong`…), `shared/domain/thongTinLop.ts`, `server/src/classes/intake.ts` | **PR-LOP** (tạo lớp, tên lớp, phân công, Pre FOU) | chỉ `BangDiemLopThuong.tsx` hàm `ODiemThuong` (dòng 98-101, dấu ▾ — A3). Không áp YC-12.5.2 vào panel của `classes/` (PR-LOP tự dùng hook mới) |
| `server/src/classes/classes.ts` | PR-LOP (số tuần, phân công) | chỉ khối `timeline` FT (dòng 455-481) + `history` (520-531) + `nhapDiem` (600-606) |
| `web/src/modules/students/StudentsPage.tsx` | PR-LOP (nút "+ Lớp mới", panel tạo lớp :134, :221) | chỉ khung bảng dòng 195-218 |
| `server/src/migrate.ts` | PR-LOP (file migrate riêng) | **một dòng** gọi `migratePrN1(conn, applied)` sau `migrateXoaDuLieu` (:451) + một dòng import (T78) |
| `web/src/ui/KhungPanel.tsx` | **PR-NEN** (khung panel) | kiểu `conThieu` (:21) + khối chân "Còn thiếu" (:69-71) → dòng `n ô cần sửa ↑` + `Truong` (:99-114) — chỉ **thêm** prop, không đổi prop có sẵn |
| `web/src/ui/ui.tsx` | PR-NEN (`NhanTrangThai`) | chỉ thêm prop `dut?` cho `Level` (:102-109) |
| `web/src/modules/yThuc/CaseSosControls.tsx`, `ui/ChonNgay.tsx`, `ui/PeoplePicker.tsx`, `ui/Filters.tsx`, mọi `type="date"` | PR-NEN (ô ngày, "Khác", chọn người) | **không sửa** (YC-12.1 sửa ở `SkillBoard.tsx`; Task 5b chỉ bỏ chỗ **gọi** `PresetPlanActions`, không xoá component) |
| `web/src/index.css`, `tailwind.config.js` | PR-NEN / PR-SANG | chỉ thêm **một** khối CSS hàng lớp dính (Task 8) cuối khối `.hang-lon` |
| `server/src/tests/run.ts`, `shared/domain/index.ts`, `CODE_MAP.md`, `plan.md` | mọi PR | chỉ thêm dòng đăng ký/export/ghi chú |

Gặp xung đột khi rebase: giữ **cả hai** phần (các PR sửa khác dòng), ghi Nhật ký.

## Global Constraints

- **Tinh tế (chủ sản phẩm):** dấu trạng thái nhỏ gọn, nét mảnh (◌ ▾ ✓ ●, không icon to); cột và hàng thẳng — số căn phải,
  `tabular-nums` cho **mọi** số, hàng cao đều; dòng phụ ≤ 1 dòng, không dồn chữ, không lặp thông tin cột khác nói rồi.
- **Ba tầng (§7.5):** tầng 1 (điểm, SOS, quá hạn, việc tiếp theo) đậm, 14–16 px; tầng 3 (người nhập, mã) 11–12 px chữ phụ.
- **Ngữ pháp trạng thái (§7.3):** một dòng = một nhãn trạng thái + hạn viết bằng chữ; ⚠ **chỉ** cho quá hạn, luôn kèm chữ
  `quá hạn n ngày` (không bao giờ "⚠ 12 ngày").
- **Chữ:** theo `thiet-ke/TU_DIEN_VA_CHU.md` + `THUAT_NGU_DA_CHOT.md`: `Case` hoa, HV, "Ghi kết quả", "Dự kiến kết thúc",
  hạn tuần `Ghi kết quả tuần W4 SEP · hạn hết T2 29/09`, quá hạn `quá hạn n ngày` tính từ sau Thứ Hai đó (R-PA3).
- **Không lộ chữ máy:** mã kỹ thuật (`attempt.cancel_part`, `writing2`), câu SQL (`COUNT DISTINCT`), ngày ISO `2026-09-16`,
  lệnh `npm …` không được hiện trên màn hình/thông báo. Ngày qua `ngay()`, tuần qua `tuanLich()` (`hienThiNgay.ts`).
- **Luật thuần có phép kiểm:** mọi hàm mới ở `shared/domain` có phép kiểm trong `server/src/tests/suaLoiNong.tests.ts`
  (tạo ở Task 1, `runSuaLoiNongTests(t)`, đăng ký **cuối** `run.ts` sau `runXoaDuLieuTests`).
- **Giữ hành vi:** phép kiểm cũ so **chữ** cũ thì sửa kỳ vọng sang chữ mới (cùng điều kiện, không xoá); số phép kiểm không giảm.
- **Ngày nghiệp vụ:** mọi so sánh hạn dùng `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web), không đồng hồ trình duyệt.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-n1-sua-loi-nong -b pr-n1-sua-loi-nong origin/main`.
- [ ] Chép file kế hoạch này và `thiet-ke/mockup/20-pr-n1.html` từ nhánh `ke-hoach-nang-cap-27-09` vào worktree
  (`git checkout origin/ke-hoach-nang-cap-27-09 -- docs/superpowers/plans/2026-09-28-pr-n1-sua-loi-nong.md thiet-ke/mockup/20-pr-n1.html`;
  nhánh đó đã merge vào `main` thì bỏ bước này).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm đạt) vào mục Nhật ký cuối file.
- [ ] Đối chiếu nhanh các dòng mã kế hoạch dẫn (grep `weeklyUpdateDue`, `lopMoSan`, `dangSua =`, `toneTheoNhan`) — lệch > 20 dòng
  thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-N1 (0): kế hoạch + mockup 20 + mốc {B} phép kiểm`.

## Task 1 · Luật hạn thuần: Thứ Hai, "n ngày", nhãn tuần (§5.6 R-PA1/R-PA3/R-PA4, T66, K5-19, K5-20, K5-24, K3-17, K3 §4c #1-4)

**Files:** sửa `shared/domain/cases.ts:649 (thêm), 655-663, 700-765, 909-910`, `shared/domain/display.ts` (import, `:250-260`,
`:307-339`); tạo `server/src/tests/suaLoiNong.tests.ts`; đăng ký cuối `server/src/tests/run.ts` (sau `runXoaDuLieuTests`).

**Interfaces (Produces):**
```ts
// cases.ts
export function hanTheoNgay(batDau: string, n: number): string;   // "n ngày" tính CẢ ngày đầu: batDau + (n-1); quá hạn khi hôm nay > hạn
export const HAN_DUYET_NGAY = 5;                                    // QL trả lời Đề xuất PA / Xin hỗ trợ (T54, K3-18)
export function weeklyUpdateDue(fromDate: string): string;          // Thứ Hai SAU tuần (T2→CN) chứa fromDate
export function planEndDefault(startDate: string): string;          // KHÔNG đổi kết quả: Chủ nhật tuần tiếp theo
// display.ts
export function nhanTuanGhiKetQua(actionDue: string | null, homNay: string): { tieuDe: string; soTuan: number };
// deadlineView({ kind: 'cap-nhat-pa' }) → viec 'Ghi kết quả tuần W4 SEP', han 'hạn hết T2 28/09'
```

- [ ] **Phép kiểm trước** — tạo `suaLoiNong.tests.ts`:
```ts
/** PHÉP KIỂM PR-N1 — sửa lỗi nóng + sửa sai sự thật (kế hoạch 2026-09-28). Harness do run.ts truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const docSach = (rel: string) => boChuThich(fs.readFileSync(path.join(REPO, rel), 'utf8'));

export async function runSuaLoiNongTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-N1 · Sửa lỗi nóng + sửa sai sự thật');

  check('N1 (1) · weeklyUpdateDue: kết quả tuần T2→CN ghi trước hết Thứ Hai tuần sau (R-PA1)', () => {
    const ca: [string, string][] = [['2026-09-21', '2026-09-28'], ['2026-09-24', '2026-09-28'],
      ['2026-09-27', '2026-09-28'], ['2026-09-28', '2026-10-05']];
    for (const [tu, han] of ca) assert(d.weeklyUpdateDue(tu) === han, `${tu} → ${d.weeklyUpdateDue(tu)} (cần ${han})`);
    assert(new Date('2026-09-28T00:00:00Z').getUTCDay() === 1, '28/09/2026 phải là Thứ Hai');
  });
  check('N1 (1) · planEndDefault giữ Chủ nhật tuần tiếp theo (dự kiến kết thúc không phải hạn)', () => {
    assert(d.planEndDefault('2026-09-16') === '2026-09-27', d.planEndDefault('2026-09-16'));
    assert(d.planEndDefault('2026-09-20') === '2026-09-27', d.planEndDefault('2026-09-20'));
  });
  check('N1 (1) · hanTheoNgay tính cả ngày đầu; planDueDate/signalVerifyDue không đổi kết quả (K5-20)', () => {
    assert(d.hanTheoNgay('2026-09-14', 5) === '2026-09-18' && d.hanTheoNgay('2026-09-14', 1) === '2026-09-14', 'hanTheoNgay');
    assert(d.planDueDate('2026-09-14', 'urgent') === '2026-09-16' && d.signalVerifyDue('2026-09-14') === '2026-09-16', 'hạn 3 ngày');
    assert(d.HAN_DUYET_NGAY === 5, 'HAN_DUYET_NGAY');
  });
  check('N1 (1) · deadlineView cap-nhat-pa: "Ghi kết quả tuần W4 SEP · hạn hết T2 28/09" (R-PA3)', () => {
    const v = d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-24' });
    assert(v.viec === 'Ghi kết quả tuần W4 SEP' && v.han === 'hạn hết T2 28/09' && v.tone === 'waiting', JSON.stringify(v));
    assert(d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-28' }).homNay, 'đúng Thứ Hai là hôm nay');
    assert(d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-30' }).quaHan === 'quá hạn 2 ngày', 'quá hạn');
    assert(!/CN|Chủ nhật/.test(v.text), v.text);
  });
  check('N1 (1) · nhanTuanGhiKetQua: một tuần / ghi bù nhiều tuần (K3-17)', () => {
    assert(d.nhanTuanGhiKetQua('2026-09-28', '2026-09-28').tieuDe === 'Kết quả tuần W4 SEP', 'một tuần');
    const bu = d.nhanTuanGhiKetQua('2026-09-14', '2026-09-29');
    assert(bu.tieuDe === 'Kết quả W2–W4 SEP (ghi bù 3 tuần)' && bu.soTuan === 3, JSON.stringify(bu));
    assert(d.nhanTuanGhiKetQua(null, '2026-09-29').tieuDe === 'Kết quả tuần này', 'không hạn');
  });
  check('N1 (1) · chữ luật PA không còn "Chủ nhật" (K3 §4c #3)', () => {
    assert(!/Chủ nhật/.test(d.PLAN_DECISION_HINT.keep) && !/Chủ nhật/.test(d.cycleDeadlineHint()), 'còn Chủ nhật');
  });
}
```
  Khối phép kiểm của Task 2–11 đặt **trong** `runSuaLoiNongTests`, trước dấu `}` cuối; hai hàm `tepTsx(dir)`/`tepTs(dir)` (đệ quy
  `fs.readdirSync(…, { withFileTypes: true })`, trả đường dẫn tương đối, bỏ `node_modules`/`dist`) đặt đầu file ở Task 7.
  Đăng ký cuối `run.ts` (trước khối in tổng):
```ts
// ==================================================================== PR-N1 (Sửa lỗi nóng + sửa sai sự thật)
const { runSuaLoiNongTests } = await import('./suaLoiNong.tests.ts');
await runSuaLoiNongTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```
- [ ] **Mã `cases.ts`:** thêm ngay sau `addDaysIso` (:649)
```ts
/** HẠN "n NGÀY" DÙNG CHUNG (T24, T66, M-16): n ngày liên tiếp theo lịch, TÍNH CẢ ngày bắt đầu. Quá hạn khi hôm nay > hạn. */
export function hanTheoNgay(batDau: string, n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error(`hanTheoNgay: số ngày phải ≥ 1 (nhận ${n})`);
  return addDaysIso(batDau, n - 1);
}
/** Quản lý trả lời Đề xuất PA / Xin hỗ trợ trong 5 ngày, tính cả ngày gửi (T54, K3-18). */
export const HAN_DUYET_NGAY = 5;
```
  `cycleDeadlineHint()` → ``return `Hạn Quản lý trả lời: ${HAN_DUYET_NGAY} ngày, tính cả ngày gửi.`;`` (giữ `cycleDeadline`,
  chú thích "chỉ còn bộ demo dùng"). `signalVerifyDue` → `return hanTheoNgay(raisedOn, SIGNAL_VERIFY_DAYS);` · `planDueDate` →
  `return hanTheoNgay(assignedOn, days);`. Thay `weeklyUpdateDue` + `planEndDefault` (:744-765):
```ts
/**
 * HẠN GHI KẾT QUẢ PA HẰNG TUẦN (§5.6 R-PA1, chủ sản phẩm 27/09): kết quả của tuần Thứ Hai → Chủ nhật chứa `fromDate` phải ghi
 * xong trước HẾT THỨ HAI tuần kế tiếp. Máy chủ gọi `weeklyUpdateDue(ngàyGhi + 1)` sau mỗi lần ghi → ghi ngày CN hay T2 đều khép
 * đúng tuần vừa hết, hạn mới là Thứ Hai tuần sau nữa.
 */
export function weeklyUpdateDue(fromDate: string): string {
  return addDaysIso(mondayOfIso(fromDate), 7);
}
/** DỰ KIẾN KẾT THÚC mặc định: Chủ nhật tuần tiếp theo (mục 8.3). Không phải hạn (T53 Q1) — không theo hạn Thứ Hai. */
export function planEndDefault(startDate: string): string {
  return addDaysIso(mondayOfIso(startDate), 13);
}
```
  `PLAN_DECISION_HINT.keep` → `'Phương án chạy tiếp như cũ. Kết quả tuần sau ghi trước hết Thứ Hai kế tiếp.'`
- [ ] **Mã `display.ts`:** thêm `import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';`
  (`week.ts` không import gì — không vòng). Kiểu `tien` → `'hạn' | 'hạn hết T2' | 'dự kiến kết thúc'`; `'cap-nhat-pa': { viec:
  'Ghi kết quả PA', tien: 'hạn hết T2' }`. Thêm trước `deadlineView`:
```ts
const congNgay = (iso: string, n: number) => {
  const x = new Date(`${iso.slice(0, 10)}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10);
};
/** "W4 SEP" — cùng luật `tuanLich` (hienThiNgay.ts), chép lại để display.ts không import vòng; khác năm thì thêm năm. */
function maTuan(iso: string, homNay: string): string {
  const t2 = mondayOfDate(iso);
  const { year, month } = owningMonthOf(t2);
  const ma = `W${weekNumberInMonthOf(t2)} ${MONTH_CODE[month - 1]}`;
  return owningMonthOf(mondayOfDate(homNay)).year === year ? ma : `${ma} ${year}`;
}
/** Tiêu đề khối kết quả ở form Ghi kết quả (K3-17): tuần của hạn đang ghi; trễ ≥ 2 tuần thì nói khoảng + số tuần ghi bù. */
export function nhanTuanGhiKetQua(actionDue: string | null, homNay: string): { tieuDe: string; soTuan: number } {
  if (!validIso(actionDue)) return { tieuDe: 'Kết quả tuần này', soTuan: 1 };
  const dau = congNgay(mondayOfDate(actionDue), -7);
  const cuoi = congNgay(mondayOfDate(homNay), -7);
  const soTuan = cuoi > dau ? Math.round(daysBetween(dau, cuoi) / 7) + 1 : 1;
  if (soTuan === 1) return { tieuDe: `Kết quả tuần ${maTuan(dau, homNay)}`, soTuan };
  const a = maTuan(dau, homNay); const b = maTuan(cuoi, homNay);
  const cungThang = a.slice(a.indexOf(' ')) === b.slice(b.indexOf(' '));
  return { tieuDe: `Kết quả ${cungThang ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`} (ghi bù ${soTuan} tuần)`, soTuan };
}
```
  Trong `deadlineView` (nhánh có hạn): ``const viecHien = i.kind === 'cap-nhat-pa' ? `Ghi kết quả tuần ${maTuan(congNgay(i.due, -7), i.today)}` : viec;``
  dùng `viecHien` thay `viec` ở `text` và trường `viec` trả về (nhánh "chưa có hạn" giữ `viec`).
- [ ] Sửa kỳ vọng cũ: `grep -n "hạn CN\|weeklyUpdateDue\|planEndDefault\|Chủ nhật kế tiếp" server/src/tests/*.ts` — hạn tuần Chủ
  nhật → Thứ Hai kế tiếp (+1 ngày), chữ `hạn CN dd/mm` → `hạn hết T2 dd/mm` (ngày +1). Ghi số chỗ đã sửa vào Nhật ký.
- [ ] `npm run check` → commit `PR-N1 (1): hạn ghi kết quả PA hết Thứ Hai, hanTheoNgay, nhãn tuần — hàm thuần`.

## Task 2 · Máy chủ: hạn duyệt 5 ngày, ô "Việc cần làm", gộp nhóm việc, thẻ chết (K3-02, K3-18, K3-45, K5-02, K5-12, K5-58)

**Files:** `server/src/cases/cases.ts:840, 945-972, 994, 1008-1013, ~2318, 2957` + chú thích `:856, 2895-2897`;
`server/src/cases/sosAuto.ts:179` (chú thích); `server/src/students/profile.ts:457-481`; `server/src/worklist/mywork.ts:108-111,
170-185, 469-490, 587-657, 742-810, 1060-1064`; `server/src/worklist/summary.ts:244`; `server/src/worklist/weekly.ts:263`.

- [ ] **Phép kiểm trước** (khối 2 của `suaLoiNong.tests.ts`; `const casesSvc: any = await import('../cases/cases.ts')`,
  `const myworkSvc: any = await import('../worklist/mywork.ts')`; tên QL/GV lấy đúng khoá có trong `P` của `run.ts`):
```ts
  const taoPa = (key: string, extra: Record<string, unknown> = {}) => {
    const sv = t.conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
                                WHERE s.archived_at IS NULL LIMIT 1`).get() as any;
    const c = casesSvc.reportIssue(t.P.coreTeacher, { title: 'Case kiểm PR-N1 hạn tuần', primaryCode: 'student.listening.technique',
      studentId: sv.id, topic: 'listening', summary: 'Kiểm gộp nhóm việc ghi kết quả', idempotencyKey: `n1-${key}`, parallel: true }) as any;
    const r = casesSvc.recordIntervention(t.P.coreTeacher, c.id,
      { kind: 'self_study', description: 'Tự học 30 phút mỗi tối', status: 'started', ...extra }) as any;
    return { caseId: c.id, ivId: r.interventions[r.interventions.length - 1].id as number };
  };
  const nhomCua = (who: any, key: string) => (myworkSvc.myWork(who, {}).groups as any[]).find((g) => g.key === key)?.items ?? [];

  check('N1 (2) · K5-02: PA tới hạn → MỘT dòng nhóm result, khoá action:, không còn nhóm do_plan / khoá review:', () => {
    const { ivId } = taoPa('gop');
    t.conn.prepare('UPDATE case_interventions SET action_due = ?, followup_due = ? WHERE id = ?').run(t.TODAY, t.addDays(t.TODAY, -2), ivId);
    const groups = myworkSvc.myWork(t.P.coreTeacher, {}).groups as any[];
    assert(!groups.some((g) => g.key === 'do_plan'), 'còn nhóm do_plan');
    const dong = groups.flatMap((g) => g.items).filter((it: any) => it.key.endsWith(`:${ivId}`));
    assert(dong.length === 1 && dong[0].key === `action:${ivId}` && dong[0].group === 'result', JSON.stringify(dong.map((x: any) => x.key)));
    assert(dong[0].tieuDe.startsWith('Ghi kết quả PA') && dong[0].actionLabel === 'Ghi kết quả', dong[0].tieuDe);
  });
  check('N1 (2) · T53 Q1: dự kiến kết thúc đã qua mà hạn tuần chưa tới → KHÔNG có việc', () => {
    const { ivId } = taoPa('du-kien');
    t.conn.prepare('UPDATE case_interventions SET action_due = ?, followup_due = ? WHERE id = ?').run(t.addDays(t.TODAY, 6), t.addDays(t.TODAY, -3), ivId);
    assert(!nhomCua(t.P.coreTeacher, 'result').some((it: any) => it.key.endsWith(`:${ivId}`)), 'dự kiến kết thúc thành việc');
  });
  check('N1 (2) · K5-58: PA đã huỷ không còn "Chờ tôi xử lý"; duyệt PA đã huỷ bị từ chối', () => {
    const { ivId } = taoPa('huy', { needsApproval: true, status: 'planned', kind: 'tutor' });
    t.conn.prepare("UPDATE case_interventions SET status = 'cancelled' WHERE id = ?").run(ivId);
    assert(!nhomCua(t.P.manager, 'decide').some((it: any) => it.key === `approval:${ivId}`), 'PA huỷ vẫn chờ duyệt');
    t.assertThrows(() => casesSvc.respondToPlan(t.P.manager, ivId, { decision: 'approved' }), 'duyệt được PA đã huỷ');
  });
  check('N1 (2) · K3-18: đề xuất PA có hạn duyệt 5 ngày tính cả hôm gửi; duyệt xong hạn tuần là Thứ Hai', () => {
    const { ivId } = taoPa('duyet', { needsApproval: true, status: 'planned', kind: 'tutor' });
    const iv = t.conn.prepare('SELECT approval_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.approval_due === t.addDays(t.TODAY, 4), `approval_due ${iv.approval_due}`);
    casesSvc.respondToPlan(t.P.manager, ivId, { decision: 'approved' });
    const sau = t.conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(new Date(`${sau.action_due}T00:00:00Z`).getUTCDay() === 1, `hạn sau duyệt ${sau.action_due} không phải Thứ Hai`);
  });
  check('N1 (2) · K3-02: ô "Việc cần làm tiếp" lấy hạn tuần, không lấy dự kiến kết thúc', () => {
    const src = docSach('server/src/students/profile.ts');
    assert(!/followUntil/.test(src.slice(src.indexOf('const cands'), src.indexOf('cands.sort'))), 'còn dùng followUntil làm hạn');
  });
```
- [ ] **Mã `cases.ts`:** import thêm `HAN_DUYET_NGAY, hanTheoNgay`. `:840` → `const approvalDue = needsApproval ?
  hanTheoNgay(today, HAN_DUYET_NGAY) : null;` · `:2957` → `.run(hanTheoNgay(observedOn, HAN_DUYET_NGAY), nowIso(), interventionId);`
  · SELECT của `respondToPlan` (~:945) thêm `iv.status AS iv_status, sc.status AS case_status`; trước kiểm "đã trả lời" (:966):
  `if (iv.iv_status === 'cancelled' || iv.case_status === 'done') throw badRequest('PA này đã huỷ hoặc Case đã đóng — không còn gì để duyệt.');`
  · `:994` → `const startDue = input.decision === 'approved' ? weeklyUpdateDue(approvedOn) : null;`; ở `.run` (:1012) tham số của
  `followup_due` đổi `startDue` → `startDue ? planEndDefault(approvedOn) : null` (giá trị như cũ — Chủ nhật tuần sau). Bỏ
  `cycleDeadline` khỏi import nếu hết chỗ dùng. Hàng kỹ năng (~:2318, cạnh `overdueActionDue`) thêm:
```ts
      /** Hạn ghi kết quả tuần gần nhất của PA đang chạy (bỏ PA chờ duyệt) — ô "Việc cần làm tiếp" dùng (K3-02). */
      nextActionDue: openIv.filter((i) => i.action_due && (i.approval_state ?? '') !== 'pending')
        .map((i) => i.action_due as string).sort()[0] ?? null,
```
  Chú thích `:856`, `:2895-2897`, `sosAuto.ts:179`: "Chủ nhật" → "hết Thứ Hai tuần sau".
- [ ] **Mã `profile.ts`:** kiểu `Next` thêm `loai?: 'cap-nhat-pa'`; xoá dòng `overdueActionDue` cũ (:475) và hai dòng
  `followOverdue`/`followUntil` (:477-481), thay bằng:
```ts
    if (r.overdueActionDue) cands.push({ text: `Ghi kết quả PA ${sk(r)}`, due: r.overdueActionDue, rank: 1, category: r.category, loai: 'cap-nhat-pa' });
    /* Hạn tuần CHƯA quá hạn — chỉ dùng khi không còn việc khác. Dự kiến kết thúc KHÔNG bao giờ là việc (T53 Q1, K3-02). */
    else if (r.nextActionDue) duPhong.push({ text: `Ghi kết quả PA ${sk(r)}`, due: r.nextActionDue, rank: 3, category: r.category, loai: 'cap-nhat-pa' });
```
  Đối tượng `next` trả ra giữ thêm `loai`.
- [ ] **Mã `mywork.ts`:** `import { addDays } from '../util.ts';`. Xoá `'do_plan'` khỏi `WorkGroupKey` (:111), `GROUP_META`
  (:182-185), `order` (:1063) — giữ khoá `do_plan` trong `shared/domain/tongQuan.ts` (không hại, phép kiểm tongQuan còn đọc).
  `GROUP_META.result` → `{ label: 'Ghi kết quả PA', hint: 'Kết quả tuần Thứ Hai → Chủ nhật ghi xong trước hết Thứ Hai tuần sau.
  Tuần chạm ngày dự kiến kết thúc thì ghi kết quả và kết luận PA.' }`. Chuyển `const reviewedCases = new Set<number>();` lên trước
  khối 2b. **Xoá** khối 2b (:587-657) và khối 3 (:742-810), đặt **một** khối mới ở chỗ khối 2b:
```ts
  // ------------------------------------------- 2b. GHI KẾT QUẢ PA HẰNG TUẦN (K5-02, T75, §5.6) — một PA một dòng
  /*
   * Một nghĩa vụ: kết quả tuần T2→CN ghi xong trước HẾT THỨ HAI tuần sau (`action_due`). Hiện từ Chủ nhật (tuần sắp hết) tới khi
   * ghi. Dự kiến kết thúc (`followup_due`) KHÔNG sinh việc (T53 Q1) — tuần chạm nó chỉ thêm chữ "tuần cuối". Khoá dòng giữ
   * `action:{id}` để "đã nhắc hôm nay" của nút Nhắc khớp qua các PR (K5-12). QL chỉ thấy dòng của người khác khi đã quá hạn.
   */
  const ghiKetQua = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.action_due, iv.followup_due,
              iv.performer_user_id, iv.performer_name, COALESCE(iv.performer_user_id, iv.recorded_by) AS owner_id,
              sc.topic, sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.status IN ('planned', 'started')
          AND iv.action_due IS NOT NULL AND iv.action_due <= ?
          AND sc.status != 'done'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND s.archived_at IS NULL`,
    )
    .all(addDays(today, 1)) as any[];
  napTruocPhamVi(ghiKetQua.map((r) => r.eff_student_id));
  for (const iv of ghiKetQua) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: iv.eff_class_id, studentId: iv.eff_student_id, skill: iv.topic ?? undefined })) continue;
    const u = urgencyOf(iv.action_due, today);
    const mine = iv.owner_id === p.userId;
    const qlQuaHan = u === 'overdue' && can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!mine && !teachesClass(p, iv.eff_class_id) && !qlQuaHan) continue;
    reviewedCases.add(iv.case_id);
    const tuanCuoi = !!iv.followup_due && iv.followup_due >= addDays(iv.action_due, -7) && iv.followup_due < iv.action_due;
    items.push({
      key: `action:${iv.id}`, group: 'result', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no), count: null,
      reason: [(iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'PA học thuật',
        tuanCuoi ? 'tuần cuối — ghi kết quả và kết luận PA' : null,
        mine ? null : 'người thực hiện chưa ghi'].filter(Boolean).join(' — '),
      tieuDe: `Ghi kết quả PA${duoiKyNang(iv.topic)}`, actionLabel: 'Ghi kết quả',
      href: iv.eff_student_id
        ? duongHoSoHocVien(iv.eff_student_id, { caseId: iv.case_id, paId: iv.id, viec: 'ghi-ket-qua' })
        : `/hoc-thuat/case/${iv.case_id}`,
      ownerId: iv.performer_user_id ?? iv.owner_id ?? null,
      owner: iv.performer_user_id ? null : ((iv.performer_name ?? '').trim() || null),
      mine, due: iv.action_due, statusLabel: 'Chờ ghi kết quả',
    });
  }
```
  Câu `pendingPlans` (:490) → `WHERE iv.approval_state = 'pending' AND iv.status != 'cancelled' AND sc.status != 'done'`; cùng
  điều kiện ở `summary.ts:244` và `weekly.ts:263` (K5-58 — chỉ vá truy vấn; hàm đóng yêu cầu chung là việc PR-DUYET).
- [ ] Sửa kỳ vọng cũ: `run.ts:3739` `g.key === 'do_plan'` → `'result'`; `panelUx3.tests.ts:173` nhãn `'Ghi kết quả'` →
  `'Ghi kết quả PA'`; `run.ts:3044-3057` (dữ liệu mẫu "tutor hẹn 10/09") nếu không còn dòng vì việc nay theo `action_due` → trong
  phép kiểm `UPDATE` `action_due` quá hạn cho PA đó (giữ điều kiện "QL chỉ thấy khi quá hạn"), ghi Nhật ký.
- [ ] `npm run check` → commit `PR-N1 (2): hạn duyệt 5 ngày, gộp "Ghi kết quả PA", ô Việc cần làm theo hạn tuần, vá thẻ PA đã huỷ`.

## Task 3 · Migrate R-PA5 + lệnh chạy thử chỉ đọc (K5-19, K5-67, T78)

**Files:** tạo `server/src/migrate/prN1.ts`, `server/src/migrate/chayThuN1.ts`; sửa `server/src/migrate.ts` (1 import + 1 dòng
sau `migrateXoaDuLieu(conn, applied);` ~:451); `package.json` thêm script; `server/src/seed/build.ts:698-700` không cần sửa
(đã gọi `weeklyUpdateDue` → tự ra Thứ Hai).

- [ ] **Phép kiểm trước** (khối 3):
```ts
  const mig: any = await import('../migrate/prN1.ts');
  check('N1 (3) · R-PA5: PA đang chạy có hạn Chủ nhật → Thứ Hai; PA xong/huỷ giữ nguyên; chạy lại không đổi thêm', () => {
    const a = taoPa('mig-a').ivId; const b = taoPa('mig-b').ivId;
    t.conn.prepare("UPDATE case_interventions SET action_due = '2026-09-27' WHERE id IN (?, ?)").run(a, b);
    t.conn.prepare("UPDATE case_interventions SET status = 'completed' WHERE id = ?").run(b);
    const truoc = mig.demPaDoiHanThuHai(t.conn);
    assert(truoc.soPa >= 1 && truoc.mau.some((x: any) => x.id === a && x.hanMoi === '2026-09-28'), JSON.stringify(truoc.mau.slice(0, 3)));
    const applied: string[] = [];
    mig.migratePrN1(t.conn, applied);
    const ha = (id: number) => (t.conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(id) as any).action_due;
    assert(ha(a) === '2026-09-28' && ha(b) === '2026-09-27', `${ha(a)} · ${ha(b)}`);
    const lan2: string[] = []; mig.migratePrN1(t.conn, lan2);
    assert(lan2.length === 0 && mig.demPaDoiHanThuHai(t.conn).soPa === 0, 'chạy lại vẫn đổi');
  });
```
- [ ] **Mã `server/src/migrate/prN1.ts`:**
```ts
/**
 * PR-N1 · R-PA5 (§5.6, K5-19): hạn ghi kết quả PA hằng tuần đổi từ HẾT CHỦ NHẬT sang HẾT THỨ HAI tuần sau. Hạn được LƯU ở
 * `case_interventions.action_due` → dời mọi hạn Chủ nhật của PA ĐANG CHẠY thêm 1 ngày, để sáng Thứ Hai đầu tiên sau deploy không
 * ai bị tính quá hạn ngược. Một câu, chạy lại không đổi gì thêm (hạn đã là Thứ Hai). PA xong/huỷ giữ nguyên lịch sử.
 */
const DIEU_KIEN = `status IN ('planned', 'started') AND action_due IS NOT NULL AND strftime('%w', action_due) = '0'`;

export function demPaDoiHanThuHai(conn: any) {
  const mau = conn.prepare(
    `SELECT iv.id, s.full_name AS hocVien, iv.action_due AS hanCu, date(iv.action_due, '+1 day') AS hanMoi
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
       LEFT JOIN students s ON s.id = sc.student_id
      WHERE iv.status IN ('planned', 'started') AND iv.action_due IS NOT NULL AND strftime('%w', iv.action_due) = '0'
      ORDER BY iv.action_due, iv.id`).all() as any[];
  return { soPa: mau.length, mau };
}

export function migratePrN1(conn: any, applied: string[]) {
  const r = conn.prepare(`UPDATE case_interventions SET action_due = date(action_due, '+1 day'), updated_at = ? WHERE ${DIEU_KIEN}`)
    .run(new Date().toISOString());
  if (r.changes) applied.push(`Dời hạn ghi kết quả của ${r.changes} PA đang chạy từ Chủ nhật sang Thứ Hai (R-PA5)`);
}
```
  (Hai câu phải cùng điều kiện — sửa một thì sửa cả hai.) `migrate.ts`: `import { migratePrN1 } from './migrate/prN1.ts';` +
  `/* PR-N1: hạn ghi kết quả PA hết Thứ Hai (R-PA5). */ migratePrN1(conn, applied);` sau `migrateXoaDuLieu`.
- [ ] **Lệnh chạy thử** `server/src/migrate/chayThuN1.ts` — CHỈ ĐỌC, in: (1) `n PA sẽ dời hạn CN → T2` + 20 dòng mẫu
  `#id · học viên · 27/09 → 28/09`; (2) số PA `planned/started` có `action_due` trống (sẽ không còn nhắc — báo planning nếu > 0);
  (3) số PA `status = 'cancelled' AND approval_state = 'pending'` (K5-58 — thẻ chết, chỉ để biết). Dùng `db()` như `migrate/run.ts`,
  **không** gọi `migrate()`, không ghi gì. `package.json`: `"chay-thu:n1": "npm run build:server && node dist-server/server/src/migrate/chayThuN1.js"`.
  Session code chạy nó **trên DB demo trong worktree** để thử, không trên Turso (chủ sản phẩm chạy lúc deploy theo `TRIEN_KHAI.md`).
- [ ] `npm run check` → commit `PR-N1 (3): migrate dời hạn PA đang chạy CN → T2 + lệnh chạy thử chỉ đọc`.

## Task 4 · Web: chữ hạn "hết Thứ Hai" mọi chỗ + A5 + A6 (K3 §4c #4-10, K3-17, K3-18 câu, UX-A A5/A6)

**Files:** `web/src/modules/cases/CapNhatTuan.tsx:236-238`, `SkillBoard.tsx:398`, `CasePanel.tsx:164, 257`, `ThaoTacCase.tsx:32,
88, 146`, `web/src/modules/students/StudentDetailPage.tsx:469-476`, `web/src/modules/worklist/WorkList.tsx:70`,
`web/src/ui/ViecTiep.tsx:12`, `web/src/ui/Han.tsx:15` (chú thích), `shared/domain/policy.ts:18` (chú thích),
`shared/domain/hocVienLop.ts:256-268`, `server/src/classes/classes.ts:455-481, 600-606` (thêm `hanNhap`).

- [ ] **Phép kiểm trước** (khối 4):
```ts
  check('N1 (4) · A6: việc Nhập điểm trễ có số ngày; không còn "⚠ n ngày" gọn; chữ hạn PA không còn Chủ nhật', () => {
    const v = d.viecTiepTheoCua({ nhapDiem: { kyNang: ['reading'], dot: 'MT2', quaHan: true, han: '2026-09-20' }, cases: [], homNay: '2026-09-24' })[0];
    assert(v.quaHanNgay === 4 && /quá hạn 4 ngày/.test(v.title), JSON.stringify(v));
    assert(!/QuaHan[^>]*\bgon\b/.test(docSach('web/src/ui/ViecTiep.tsx')), 'ViecTiep còn dạng gọn');
    for (const f of ['web/src/modules/cases/CasePanel.tsx', 'web/src/modules/cases/SkillBoard.tsx', 'web/src/modules/cases/ThaoTacCase.tsx'])
      assert(!/Chủ nhật|tuần này:/.test(docSach(f)), `${f} còn "Chủ nhật"/"tuần này:"`);
    assert(!/'1 · Kết quả tuần này'/.test(docSach('web/src/modules/cases/CapNhatTuan.tsx')), 'CapNhatTuan còn tiêu đề cũ');
    assert(!/hạn \$\{ngay\(it\.due/.test(docSach('web/src/modules/worklist/WorkList.tsx')), 'WorkList còn ngày trơn không trạng thái (A5)');
  });
```
- [ ] **Mã:** `CapNhatTuan.tsx:236` → ``<Khoi tieuDe={`1 · ${nhanTuanGhiKetQua(pa.actionDue, homNay).tieuDe}`}>`` và `aria-label` :238
  cùng chữ (không "1 · "). `SkillBoard.tsx:398` và `CasePanel.tsx:257` `title` → ```${han?.viec ?? 'Ghi kết quả'}: kết quả, tiến
  triển, và quyết định Giữ nguyên / Điều chỉnh / Thay / Kết thúc` `` (CasePanel tính `han` ở :211 sẵn). `CasePanel.tsx:164` →
  `Mỗi PA ghi kết quả hằng tuần, trước hết Thứ Hai tuần sau. Case chỉ hoàn thành được khi mọi PA đã khép.` `ThaoTacCase.tsx:88` →
  `` `Đây là một ĐỀ XUẤT nên Quản lý phải trả lời trong ${HAN_DUYET_NGAY} ngày, tính cả hôm gửi. Trong lúc chờ thì chưa ghi kết quả được.` ``
  (K3-18 — câu đọc từ hằng số); `:146` `chuaChon` → `` `Mặc định: CN ${ngay(planEndDefault(homNay), homNay)}` `` (Truong đã có nhãn
  "Dự kiến kết thúc"); chú thích :32 "Chủ nhật tuần tiếp theo" giữ (dự kiến, không phải hạn).
- [ ] `StudentDetailPage.tsx:469-476` (ô "Việc cần làm tiếp"): khi `next?.loai === 'cap-nhat-pa' && next.due`, `sub` =
```tsx
(() => { const v = deadlineView({ kind: 'cap-nhat-pa', due: next.due, today: homNay });
  return <span className="tabular-nums">{v.viec.replace(/^Ghi kết quả /, '')} · {v.han}{v.quaHan && <> <QuaHan ngay={v.daysOverdue} /></>}</span>; })()
```
  → "tuần W4 SEP · hạn hết T2 28/09 ⚠ quá hạn 2 ngày". Loại khác giữ nhánh cũ.
- [ ] `WorkList.tsx:70` nhánh không có `loaiHan` (A5): `it.due ? <Han loai="viec-van-hanh" han={it.due} haiDong /> : '—'` — mọi
  ngày đã qua đều có "quá hạn n ngày". `ViecTiep.tsx:12` bỏ `gon` → "⚠ quá hạn 3 ngày" (A6).
- [ ] A6 nhập điểm có hạn: `viecTiepTheoCua` nhận `nhapDiem.han?: string | null`; có `han` thì
  `const v = deadlineView({ kind: 'nhap-diem', due: han, today: homNay })` → `han: v.han.replace(/^hạn /, '')`, `quaHanNgay:
  v.daysOverdue`, `title` nối `v.quaHan`. Máy chủ `classes.ts`: mỗi phần tử `timeline` thêm `hanNhap` = hạn sớm nhất của các kỹ
  năng người xem còn nợ (FT: `cells.filter((x) => x.canEdit && x.band === null && (x.progress === 'due' || x.overdue)).map((x) =>
  x.deadline)`; lớp thường: `regViews.get(k)?.deadline` của `myPending`) → `.filter(Boolean).sort()[0] ?? null`; khối `nhapDiem`
  (:600-606) truyền `han: timeline.map((t) => t.hanNhap).filter(Boolean).sort()[0] ?? null`.
- [ ] `npm run check` → commit `PR-N1 (4): chữ hạn "hết Thứ Hai", tiêu đề tuần ghi bù, "quá hạn n ngày" ở mọi việc`.

## Task 5 · Bảng kỹ năng: hai khối SOS loại trừ nhau + cột phải nút trên chữ dưới (YC-12.1 tạm, YC-12.5.4)

**Files:** `web/src/modules/cases/SkillBoard.tsx:255-407` (không sửa `yThuc/CaseSosControls.tsx` — PR-NEN đang sửa ô ngày ở đó).

- [ ] **Phép kiểm trước** (khối 5, quét nguồn):
```ts
  check('N1 (5) · YC-12.1: một biến trạng thái cho hai khối SOS; YC-12.5.4: cột phải dùng CotPhai', () => {
    const src = docSach('web/src/modules/cases/SkillBoard.tsx');
    assert(!/causeOpen|dismissOpen/.test(src) && /khoiSos === 'nguyen-nhan'/.test(src) && /khoiSos === 'khong-theo-doi'/.test(src), 'hai khối còn mở cùng lúc được');
    assert((src.match(/<CotPhai\b/g) ?? []).length >= 4, 'cột phải chưa theo khuôn nút trên chữ dưới');
  });
```
- [ ] **Mã YC-12.1:** trong `HangCaseVaPa` thay hai `useState` (:259-260) bằng
  `const [khoiSos, setKhoiSos] = useState<null | 'nguyen-nhan' | 'khong-theo-doi'>(null);`. Khối :315-327: hai nút chỉ hiện khi
  `c.canEdit && khoiSos === null && !c.sos.hasCause`; `{khoiSos === 'nguyen-nhan' && <CauseDeterminationPanel … onClose={() =>
  setKhoiSos(null)} />}`; `{khoiSos === 'khong-theo-doi' && <DismissCaseForm … onClose={() => setKhoiSos(null)} />}`. Mở khối này thì
  nút của khối kia biến mất; Huỷ → về hai nút. Giữ chữ nút hiện tại (đổi "Xác nhận nguyên nhân" + luồng mới ở PR-SOS).
- [ ] **Mã YC-12.5.4:** thêm cuối file
```tsx
/** CỘT PHẢI của hàng Case/PA (YC-12.5.4): nút ở TRÊN, chữ phụ ở DƯỚI, cùng một mép trái — mọi hàng như nhau. */
function CotPhai({ nut, phu }: { nut?: ReactNode; phu?: ReactNode }) {
  return (
    <span className="flex flex-col items-start gap-1">
      {nut && <span className="flex flex-wrap items-center gap-1.5">{nut}</span>}
      {phu && <span className="text-[11px] tabular-nums text-slate-500">{phu}</span>}
    </span>
  );
}
```
  Áp: hàng Case (:295-303) `nut` = Mở Case (+ Thêm PA), `phu` = `Kết luận: …`; hàng PA (:385-403) bốn nhánh: `goi-y` → `nut` =
  `PresetPlanActions`, `phu` = `<span className="text-soon">{v.text}</span>`; `cho-duyet` → `phu` = chữ chờ duyệt + hạn;
  `ghi-ket-qua` → `nut` = nút Ghi kết quả (khi `canEdit`), `phu` = `han.han` ("hạn hết T2 28/09"); còn lại → `phu` = `v.text`.
- [ ] `npm run check` → commit `PR-N1 (5): hai khối SOS loại trừ nhau, cột phải nút trên chữ dưới`.

## Task 5b · PA quy chế SOS gán tự động — chạy ngay, không chờ xác nhận (S4-1 phần gán tự động, T22 phần "không xoá/không thay", K5-07; chủ sản phẩm 28/09)

**Cách ít đụng nhất (Q22):** PA điền sẵn tạo ra đã **chạy** và mang dấu "máy đã xác nhận": `confirmed_at = lúc tạo`,
`confirmed_by = NULL`. Mọi truy vấn đang lọc `UNCONFIRMED_PRESET` (việc cần làm, hiệu quả PA, hạn tuần) tự tính PA này như PA thường
mà không phải sửa; mọi chặn "chưa xác nhận" ở `cases.ts:1074, 1269, 2763` tự thông. `confirmed_by IS NULL` là dấu nhận ra "PA quy
chế máy gán" (PA đã được người xác nhận trước đây có `confirmed_by` là người).

**Files:** `server/src/cases/sosState.ts:12-79`; `server/src/cases/sosAuto.ts:74-127, 300-307`; `server/src/cases/signals.ts:582-600, 634-640`;
`server/src/worklist/mywork.ts:141-145, 905-930`; `server/src/students/profile.ts:471`; `shared/domain/hoSoHocVien.ts:75-80, 89-93`;
`web/src/modules/cases/SkillBoard.tsx:8, 30, 57, 374, 386-390`; `web/src/modules/cases/CasePanel.tsx` (thẻ PA, cạnh tên PA);
`server/src/migrate/prN1.ts`, `server/src/migrate/chayThuN1.ts`. **Không** sửa `yThuc/CaseSosControls.tsx` (PR-NEN đang sửa — chỉ bỏ
chỗ gọi `PresetPlanActions`; xoá hẳn component + hai đường `/interventions/:id/confirm|replace` là việc PR-SOS). **Không** khoá
Thay/Kết thúc trong form Ghi kết quả (T63 — PR-SOS).

- [ ] **Phép kiểm trước** (khối 5b):
```ts
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const sigSvc: any = await import('../cases/signals.ts');
  const lop = (t.conn.prepare("SELECT id FROM classes WHERE programme_code = 'FT' LIMIT 1").get() as any)?.id ?? t.classId;
  const taoQuyChe = (key: string) => {
    const { caseId } = taoPa(`qc-${key}`);
    t.conn.prepare('DELETE FROM case_interventions WHERE case_id = ?').run(caseId);
    const ivId = sosAuto.createPresetPlan({ caseId, attempt: { attempt_no: 1, class_id: lop }, category: 'listening', sosLevel: 2, followUntil: null });
    return { caseId, ivId };
  };
  check('N1 (5b) · S4-1: PA quy chế tạo ra là đang chạy, máy xác nhận, có hạn ghi kết quả Thứ Hai từ tuần tạo', () => {
    const { ivId } = taoQuyChe('chay');
    const iv = t.conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.status === 'started' && iv.preset === 1 && !!iv.confirmed_at && iv.confirmed_by === null, JSON.stringify(iv));
    assert(iv.action_due === d.weeklyUpdateDue(t.TODAY) && iv.cycle_started_on === t.TODAY && iv.cycle_no === 1, `hạn ${iv.action_due}`);
    const khop = t.conn.prepare(`SELECT COUNT(*) n FROM case_interventions iv WHERE iv.id = ? AND ${sosState.PA_QUY_CHE_CHUA_GHI('iv')}`).get(ivId) as any;
    assert(khop.n === 1, 'PA quy chế chưa có kết quả tuần phải khớp PA_QUY_CHE_CHUA_GHI');
  });
  check('N1 (5b) · hạn 3 ngày của GVBM chỉ còn "xác định nguyên nhân" (không còn vế xác nhận PA)', () => {
    const { caseId } = taoQuyChe('cho');
    assert(sosState.sosCaseState(caseId).awaitingCause === false, 'đã có nguyên nhân mà vẫn chờ');
    t.conn.prepare("DELETE FROM case_issues WHERE case_id = ? AND role = 'primary'").run(caseId);
    assert(sosState.sosCaseState(caseId).awaitingCause === true && sosState.awaitingCauseCaseIds([caseId]).length === 1, 'chưa có nguyên nhân thì phải chờ');
    assert(!/xác nhận, sửa hoặc thay/.test(docSach('server/src/worklist/mywork.ts')), 'chữ nhóm cause còn vế PA gợi ý (K5-07)');
  });
  check('N1 (5b) · S08: sửa điểm thành đạt, PA quy chế CHƯA có kết quả tuần → Case vẫn tự huỷ, PA huỷ "score_fixed"', () => {
    const { caseId, ivId } = taoQuyChe('s08');
    sigSvc.retireCaseForCorrectedScore(t.P.manager, caseId, 'Listening');
    const iv = t.conn.prepare('SELECT status, closed_reason FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.status === 'cancelled' && iv.closed_reason === 'score_fixed', JSON.stringify(iv));
  });
  check('N1 (5b) · giao diện không còn "Gợi ý tự động · chờ xác nhận" / Xác nhận–Sửa–Thay; PA quy chế có dấu 🔒', () => {
    const sb = docSach('web/src/modules/cases/SkillBoard.tsx');
    assert(!/PresetPlanActions/.test(sb) && /theo quy chế/.test(sb), 'SkillBoard còn nút xác nhận / thiếu dấu quy chế');
    assert(!/Gợi ý tự động|goi-y/.test(docSach('shared/domain/hoSoHocVien.ts')), 'hoSoHocVien còn nhánh gợi ý');
    assert(!/Xác nhận PA gợi ý/.test(docSach('server/src/students/profile.ts')), 'ô Việc cần làm còn "Xác nhận PA gợi ý"');
  });
```
  (Tên cột/mã chương trình FT, khoá QL trong `P`: dùng đúng như dữ liệu thử; lệch thì ghi Nhật ký.)
- [ ] **Mã `sosState.ts`:** thêm (dưới `NOT_UNCONFIRMED_PRESET`, giữ hai hằng cũ — sau migrate chúng không còn khớp dòng nào):
```ts
/**
 * PA THEO QUY CHẾ DO MÁY GÁN mà CHƯA có kết quả tuần nào (S4-1, S08 bản 28/09). Máy gán ⇔ `preset = 1 AND confirmed_by IS NULL`.
 * Dùng cho: đồng bộ theo mức SOS mới nhất, huỷ khi "Không cần theo dõi", huỷ khi sửa điểm thành đạt. Có kết quả tuần rồi = việc thật.
 */
export const PA_QUY_CHE_CHUA_GHI = (a = 'iv') => `(${a}.preset = 1 AND ${a}.confirmed_by IS NULL AND ${a}.status IN ('planned', 'started')
  AND NOT EXISTS (SELECT 1 FROM case_followups f_qc WHERE f_qc.intervention_id = ${a}.id))`;
```
  `sosCaseState`: bỏ truy vấn `unconfirmed` và trường `unconfirmedPlanId` (kiểu `SosCaseState` + web `SkillBoard.tsx:57`);
  `awaitingCause: fromSos && c.status !== 'done' && !hasCause`. `awaitingCauseCaseIds`: bỏ vế `OR EXISTS (… UNCONFIRMED_PRESET …)`.
- [ ] **Mã `sosAuto.ts`:** `createPresetPlan` — thêm `const today = demoToday();` và câu INSERT thành
```ts
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date,
                                       followup_due, cycle_no, cycle_started_on, action_due, needs_approval, preset,
                                       confirmed_at, confirmed_by, created_at)
       VALUES (?,?,?,?, NULL, 'started', ?, ?, 1, ?, ?, 0, 1, ?, NULL, ?)`,
    ).run(input.caseId, p.kind, p.description, performer, today, p.followupDue, today, weeklyUpdateDue(today), nowIso(), nowIso());
```
  `resyncUnconfirmedPresets` (:116): `WHERE ${PA_QUY_CHE_CHUA_GHI('iv')} AND sc.status != 'done'` (thay `UNCONFIRMED_PRESET … AND
  status = 'planned'`) — PA quy chế chưa có kết quả tuần vẫn theo mức SOS cuối của lượt (Q24). `dismissSosCase` (:305): điều kiện
  huỷ → `${PA_QUY_CHE_CHUA_GHI('case_interventions')}` (closed_reason `dismissed` như cũ). Chú thích đầu file: bỏ "chờ xác nhận".
- [ ] **Mã `signals.ts` (S08, Q23):** `caseHasIndependentBasis` — câu `work` (:584) thêm `AND NOT ${PA_QUY_CHE_CHUA_GHI('case_interventions')}`
  (PA máy gán chưa ghi gì không phải căn cứ); câu `confirmed` (:597) thêm `AND confirmed_by IS NOT NULL` (chỉ người xác nhận mới là
  căn cứ). `retireCaseForCorrectedScore` (:638) điều kiện huỷ → `(status = 'planned' AND NOT (preset = 1 AND confirmed_by IS NOT NULL))
  OR ${PA_QUY_CHE_CHUA_GHI('case_interventions')}`. PA quy chế **đã** có kết quả tuần → là việc thật → Case giữ, chỉ "cần xem lại".
- [ ] **Mã việc cần làm/hồ sơ:** `mywork.ts` `GROUP_META.cause.hint` → `'Mock Test có SOS đã tự tạo Case và PA theo quy chế cho kỹ năng
  này. Bạn có ba ngày (tính cả ngày đầu) để xác định nguyên nhân — hoặc đóng "Không cần theo dõi" nếu em không cần theo dõi. Quản lý
  chỉ thấy dòng này khi đã quá hạn.'`; câu `causeCandidates` bỏ cột `has_unconfirmed`, `missing` chỉ còn `chưa chọn nguyên nhân`.
  `profile.ts:471` xoá nhánh `Xác nhận PA gợi ý`. `hoSoHocVien.ts`: bỏ `goiY` trong `tienDoCase` và nhánh `goi-y` của
  `viecTiepPhuongAn` (kiểu `loai` còn `'cho-duyet' | 'ghi-ket-qua' | 'da-xong'`); sửa kỳ vọng ở `hoSoHocVien.tests.ts`.
- [ ] **Mã web:** `SkillBoard.tsx` bỏ import + nhánh `goi-y` gọi `PresetPlanActions` (:386-390, trong `CotPhai` của Task 5), sửa chú
  thích :30. Cạnh tên PA (:374) và thẻ PA trong `CasePanel.tsx`:
```tsx
{p.preset && <span className="ml-1.5 whitespace-nowrap text-[10.5px] text-slate-400" title="PA theo quy chế SOS — máy gán, không xoá, không thay">🔒 theo quy chế</span>}
```
  PA quy chế không hiện nút Xoá/Thay ở bảng kỹ năng và Ngăn Case (hiện chỉ có ở `PresetPlanActions` — đã bỏ; nếu Ngăn Case có nút
  xoá PA nào khác thì ẩn khi `p.preset`, ghi Nhật ký).
- [ ] **Migrate** — thêm vào `prN1.ts` (chạy TRƯỚC câu dời hạn CN → T2) và đếm vào `chayThuN1.ts`:
```ts
/** S4-1: PA điền sẵn còn "chờ xác nhận" trên dữ liệu có sẵn → PA quy chế đang chạy; hạn tuần tính từ ngày migrate (không ai quá hạn ngược). */
const CHO_XAC_NHAN = `preset = 1 AND confirmed_at IS NULL AND status = 'planned'
  AND case_id IN (SELECT id FROM sos_cases WHERE status != 'done')`;
export function demPaQuyCheChoXacNhan(conn: any): number {
  return (conn.prepare(`SELECT COUNT(*) n FROM case_interventions WHERE ${CHO_XAC_NHAN}`).get() as any).n;
}
export function migratePaQuyChe(conn: any, applied: string[], homNay: string) {
  const r = conn.prepare(`UPDATE case_interventions
      SET status = 'started', started_date = COALESCE(started_date, ?), cycle_no = 1, cycle_started_on = ?, action_due = ?,
          confirmed_at = ?, confirmed_by = NULL, updated_at = ?
    WHERE ${CHO_XAC_NHAN}`).run(homNay, homNay, weeklyUpdateDue(homNay), new Date().toISOString(), new Date().toISOString());
  if (r.changes) applied.push(`Chuyển ${r.changes} PA quy chế SOS đang chờ xác nhận thành đang chạy (S4-1)`);
}
```
  `migratePrN1` gọi `migratePaQuyChe(conn, applied, demoToday())` trước câu dời hạn. `chayThuN1` in thêm dòng
  `n PA quy chế đang chờ xác nhận sẽ thành đang chạy`. Phép kiểm khối 3 thêm: chèn một dòng `preset = 1, status = 'planned',
  confirmed_at NULL` vào Case đang mở → `demPaQuyCheChoXacNhan ≥ 1` → sau `migratePrN1`: `status = 'started'`, `confirmed_by` NULL,
  `action_due` là Thứ Hai; chạy lại không đổi.
- [ ] Hiệu quả PA: kiểm `server/src/cases/effectiveness.ts` loại `closed_reason IN ('dismissed', 'score_fixed')` khỏi mẫu số (T61
  phần ngoài mẫu số); đã có thì thôi, chưa có thì thêm điều kiện đó (một dòng) + ghi Nhật ký. Tách "PA theo quy chế" riêng trong
  Phân tích (T61) **không** làm — PR-Pb2.
- [ ] Sửa kỳ vọng cũ của luồng xác nhận (`sosV3.tests.ts`, `dieuChinhPa.tests.ts`, `hoSoHocVien.tests.ts`, `run.ts` — grep
  `confirmPresetPlan|replacePresetPlan|unconfirmedPlanId|awaitingConfirmation|Gợi ý tự động`): PA quy chế nay tạo ra đã chạy; phép
  kiểm "xác nhận/thay PA gợi ý" đổi thành "gọi confirm/replace trên PA quy chế → 400 'đã được xác nhận rồi'" (giữ số phép kiểm).
- [ ] `npm run check` → commit `PR-N1 (5b): PA quy chế SOS gán tự động, chạy ngay; GVBM chỉ còn xác định nguyên nhân`.

## Task 6 · Báo lỗi form rõ ràng (nền) + form Tạo Case / nhập bù (YC-12.5.2, YC-12.5.1)

**Files:** tạo `shared/domain/loiForm.ts` (+ export `index.ts`), `web/src/ui/loiForm.tsx`; sửa `web/src/ui/KhungPanel.tsx:21,
69-71, 99-114`; `web/src/modules/cases/QuickReport.tsx:80, 144, 264-279, 310-320, 380-400, 415-458`.

**Interfaces:**
```ts
// shared/domain/loiForm.ts
export type LuatTruong = { khoa: string; nhan: string; toiThieu?: number; chon?: boolean };
export type LoiTruong = { khoa: string; nhan: string; lyDo: string };        // lyDo hiện DƯỚI ô
export function kiemTruong(l: LuatTruong, giaTri: unknown): string | null;   // 'Chưa chọn' | 'Chưa điền' | 'Cần ít nhất 15 ký tự (đang có 8)' | null
export function dsLoi(luat: readonly LuatTruong[], giaTri: Record<string, unknown>): LoiTruong[];
export function nhanCanSua(soO: number): string;                             // chân form: '2 ô cần sửa ↑' ('' khi 0) — KHÔNG liệt kê luật
// web/src/ui/loiForm.tsx
export type MucThieu = { nhan: string; lyDo?: string; oId?: string };
export function useLoiForm(): { daBam: boolean; bam(): void; roi(khoa: string): () => void; hien(khoa: string): boolean; oId(khoa: string): string };
export function DongCanSua({ muc }: { muc: (string | MucThieu)[] }): JSX.Element;  // xám nhỏ "2 ô cần sửa ↑", bấm → cuộn + focus ô lỗi ĐẦU TIÊN
```
- [ ] **Phép kiểm trước** (khối 6):
```ts
  check('N1 (6) · kiemTruong nói thiếu gì dưới ô; chân form chỉ đếm "n ô cần sửa ↑" (YC-12.5.2, chủ sản phẩm 28/09)', () => {
    assert(d.kiemTruong({ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }, 'Em hay sai') === 'Cần ít nhất 15 ký tự (đang có 10)', 'đếm ký tự');
    assert(d.kiemTruong({ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }, '   ') === 'Cần ít nhất 15 ký tự (đang có 0)', 'rỗng');
    assert(d.kiemTruong({ khoa: 'kn', nhan: 'Kỹ năng', chon: true }, '') === 'Chưa chọn' && d.kiemTruong({ khoa: 'kn', nhan: 'Kỹ năng', chon: true }, 'reading') === null, 'chọn');
    const l = d.dsLoi([{ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }, { khoa: 'ten', nhan: 'Tên Case', toiThieu: 6 }], { 'mo-ta': 'Nghe kém!', ten: 'Nghe kém phần 3' });
    assert(l.length === 1 && l[0].lyDo === 'Cần ít nhất 15 ký tự (đang có 9)', JSON.stringify(l));
    assert(d.nhanCanSua(2) === '2 ô cần sửa ↑' && d.nhanCanSua(1) === '1 ô cần sửa ↑' && d.nhanCanSua(0) === '', 'nhanCanSua');
    const kp = docSach('web/src/ui/KhungPanel.tsx') + docSach('web/src/ui/loiForm.tsx');
    assert(!/Còn thiếu|text-soon/.test(kp.slice(kp.indexOf('DongCanSua'))), 'chân form còn chữ vàng / liệt kê luật');
  });
  check('N1 (6) · YC-12.5.1: dòng PA nhập bù chỉ đóng khi bấm Xong', () => {
    const src = docSach('web/src/modules/cases/QuickReport.tsx');
    assert(/const dangSua = moSua\.includes\(i\);/.test(src), 'dòng PA còn tự đóng khi có chữ');
    assert(/conThieu: lf\.daBam \? oLoi/.test(src), 'chân form chưa dùng danh sách ô lỗi');
  });
```
- [ ] **Mã `loiForm.ts`:**
```ts
/** LUẬT BÁO LỖI FORM (YC-12.5.2): rời ô → viền đỏ + câu dưới ô; chân form (sau khi bấm Lưu) chỉ đếm "n ô cần sửa ↑". */
export type LuatTruong = { khoa: string; nhan: string; toiThieu?: number; chon?: boolean };
export type LoiTruong = { khoa: string; nhan: string; lyDo: string };
export function kiemTruong(l: LuatTruong, giaTri: unknown): string | null {
  if (l.chon) return giaTri ? null : 'Chưa chọn';
  const n = typeof giaTri === 'string' ? giaTri.trim().length : 0;
  if (l.toiThieu && n < l.toiThieu) return l.toiThieu <= 1 ? 'Chưa điền' : `Cần ít nhất ${l.toiThieu} ký tự (đang có ${n})`;
  return null;
}
export function dsLoi(luat: readonly LuatTruong[], giaTri: Record<string, unknown>): LoiTruong[] {
  return luat.flatMap((l) => { const lyDo = kiemTruong(l, giaTri[l.khoa]); return lyDo ? [{ khoa: l.khoa, nhan: l.nhan, lyDo }] : []; });
}
/** Chân form: trung tính, không lặp luật (lý do đã nằm dưới từng ô). */
export function nhanCanSua(soO: number): string {
  return soO > 0 ? `${soO} ô cần sửa ↑` : '';
}
```
- [ ] **Mã `web/src/ui/loiForm.tsx`:** `useLoiForm` giữ `daRoi: Set<string>` + `daBam`; `roi(khoa)` trả hàm cho `onBlur`; `hien(khoa)
  = daBam || daRoi.has(khoa)`; `oId(khoa) = 'o-' + khoa` (một panel một lúc — `khoPanelChung` — nên id không trùng).
  `DongCanSua` (chủ sản phẩm 28/09 — chữ vàng liệt kê luật quá gắt): **một** dòng xám nhỏ trung tính, chỉ có khi người gọi truyền
  `conThieu` (tức SAU khi bấm Lưu):
```tsx
export function DongCanSua({ muc }: { muc: (string | MucThieu)[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const toiO = () => {
    const dau = muc.find((m): m is MucThieu => typeof m !== 'string' && !!m.oId);
    const el = (dau && document.getElementById(dau.oId!))
      ?? ref.current?.closest('[role="dialog"]')?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? null;
    el?.scrollIntoView({ block: 'center' }); el?.focus();
  };
  return (
    <div ref={ref} className="px-4 pt-2 text-right" role="status">
      <button type="button" onClick={toiO} title={muc.map((m) => (typeof m === 'string' ? m : m.nhan)).join(' · ')}
        className="appearance-none border-0 bg-transparent p-0 text-[11px] text-slate-500 hover:text-slate-300">{nhanCanSua(muc.length)}</button>
    </div>
  );
}
```
  Tên ô chỉ nằm ở `title` (tooltip); không lý do, không màu cảnh báo. `KhungPanel.tsx`: `conThieu?: (string | MucThieu)[]` và
  :69-71 → `{chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}` (gọi cũ truyền `string[]`, kể cả panel
  `classes/` của PR-LOP, tự thành "1 ô cần sửa ↑"). `Truong`: thêm prop `dem?: { co: number; can:
  number }` (bộ đếm nhỏ `8/15` căn phải, `tabular-nums`, 10.5px), và khi có `loi` đặt `aria-invalid` lên ô (người gọi truyền) + bọc `children` trong
  `<div className="[&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40">` (viền đỏ, không sửa `index.css`).
- [ ] **Mã `QuickReport.tsx`:** (a) YC-12.5.1: `:80` và `:144` → `useState<number[]>([0])` / `setMoSua([0])`; `:417` →
  `const dangSua = moSua.includes(i);`; nút "+ Thêm PA đã áp dụng" (:456) thêm `setMoSua([...moSua, bfActions.length])`; nút Xoá
  (:439) → `setMoSua(moSua.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)))`; nút Xong chỉ hiện khi mô tả có chữ (như cũ).
  (b) YC-12.5.2: thay khối `thieu` (:264-279) bằng
```ts
  const lf = useLoiForm();
  const LUAT: LuatTruong[] = [
    ...(students ? [{ khoa: 'hoc-vien', nhan: 'Học viên', chon: true }] : []),
    { khoa: 'ky-nang', nhan: 'Kỹ năng', chon: true }, { khoa: 'phan-loai', nhan: 'Phân loại vấn đề', chon: true },
    { khoa: 'ten', nhan: 'Tên Case', toiThieu: 6 },
    /* "Khác" → 30 ký tự là luật cũ; PR-NEN (T13) bỏ dòng này khi có OKhac. */
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: primaryCode.endsWith('.other') ? 30 : 15 },
    ...(mode === 'backfill' ? [{ khoa: 'tu-tuan', nhan: 'Từ tuần', chon: true }, { khoa: 'den-tuan', nhan: 'Đến tuần', chon: true },
      { khoa: 'ket-qua', nhan: 'Kết quả cuối', chon: true }, { khoa: 'vi-sao', nhan: 'Vì sao kết luận vậy', toiThieu: 10 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'hoc-vien': studentId, 'ky-nang': topic, 'phan-loai': primaryCode, ten: title, 'mo-ta': summary,
    'tu-tuan': bfFrom, 'den-tuan': bfTo, 'ket-qua': bfOutcome, 'vi-sao': bfNote });
  if (mode === 'backfill' && bfFrom && bfTo && bfFrom > bfTo) loi.push({ khoa: 'den-tuan', nhan: 'Đến tuần', lyDo: 'Không được trước Từ tuần' });
  if (mode === 'backfill' && !bfActions.some((a) => a.description.trim())) loi.push({ khoa: 'pa-0', nhan: 'Phương án đã áp dụng', lyDo: 'Chưa có PA nào' });
  const thieu = loi.map((l) => l.nhan);                     // giữ tên cũ cho hai chỗ `if (thieu.length > 0) return;` (:203, :238)
  const oLoi = loi.map((l) => ({ nhan: l.nhan, oId: lf.oId(l.khoa) }));    // chân form chỉ đếm + nhảy tới ô đầu
  const loiCua = (khoa: string) => (lf.hien(khoa) ? loi.find((l) => l.khoa === khoa)?.lyDo ?? null : null);
```
  `daBam` cũ → `lf.daBam`/`lf.bam()`; chân (:320) `conThieu: lf.daBam ? oLoi : undefined`. Mỗi ô: thêm `id={lf.oId(khoa)}`, `aria-invalid={!!loiCua(khoa)}`,
  `onBlur={lf.roi(khoa)}` vào input/textarea/select (ô chọn dạng nút: đặt `id` + `tabIndex={-1}` lên khung nhóm nút), `Truong`
  nhận `loi={loiCua(khoa)}`; ô Mô tả (:392) thêm `dem={{ co: summary.trim().length, can: 15 }}`. Ô mô tả PA dòng 0 dùng `id="o-pa-0"`.
- [ ] `npm run check` → commit `PR-N1 (6): báo lỗi form rõ (viền đỏ + lý do dưới ô, chân "n ô cần sửa ↑") + dòng PA nhập bù không tự đóng`.

## Task 7 · Áp báo lỗi rõ cho các form KhungPanel còn lại (YC-12.5.2)

**Mẫu cho mỗi form:** `const lf = useLoiForm();` · `const LUAT: LuatTruong[] = [ …theo bảng… ];` · `const loi = dsLoi(LUAT,
{ khoa: giáTrị… });` (+ `loi.push({ khoa, nhan, lyDo })` cho lỗi riêng) · giữ `const thieu = loi.map((l) => l.nhan);` cho các chỗ
`if (thieu.length) return;` · nút chính gọi `lf.bam()` thay `setDaBam(true)` · chân `conThieu: lf.daBam ? loi.map((l) => ({ nhan:
l.nhan, oId: lf.oId(l.khoa) })) : undefined` · mỗi ô `id={lf.oId(khoa)} aria-invalid={…}
onBlur={lf.roi(khoa)}` và `Truong loi={lf.hien(khoa) ? loi.find((l) => l.khoa === khoa)?.lyDo ?? null : null}`. **Không** áp cho `web/src/modules/classes/*` (PR-LOP) và `dev/ThanhPhanDemo.tsx` (chỉ đổi ví dụ
`conThieu` sang một mục `MucThieu` để còn minh hoạ):

| Form (file:dòng khối `thieu`) | Luật (khoa · nhãn · luật) |
|---|---|
| Ghi kết quả `cases/CapNhatTuan.tsx:97-108` | `ket-qua` Kết quả chọn · `tien-trien` Tiến triển ≥ 8 · `quyet-dinh` Quyết định chọn · adjust: `noi-dung` Nội dung PA ≥ 8 (khi đổi) + lỗi riêng "Đổi ít nhất một ô" / "Hạn không sớm hơn ngày ghi" · replace: `pa-moi` Nội dung PA mới ≥ 8 · `ly-do` Lý do điều chỉnh/thay ≥ 8 · ask_manager: `ly-do` Cần Quản lý giúp gì ≥ 8 |
| Thêm PA `cases/ThaoTacCase.tsx:53-55` | `mo-ta` Mô tả ≥ 8 · `ngay-lam` Ngày đã làm chọn (khi Đã xong) |
| Hoàn thành Case `ThaoTacCase.tsx:172` | `vi-sao` Vì sao kết luận vậy ≥ 10 |
| Trả lời đề xuất `ThaoTacCase.tsx:239` | `ly-do` Lý do `toiThieu: 1` khi không duyệt (→ "Chưa điền") |
| Chuyển lớp `students/ChuyenLopPanel.tsx:89-94` | `lop` Lớp chọn · `ly-do` Lý do chọn · `ghi-ro` Ghi rõ lý do ≥ 3 (khi Khác) · `muc-tieu` Mục tiêu band chọn (khi cần) · `ban-giao` Ghi chú bàn giao ≥ 1 |
| Lộ trình tiếp `LoTrinhTiepPanel.tsx:99` · Quản lý HV `StudentManagePanel.tsx:89, 131, 228-230` · Hoàn thành từ ngăn `NganCase.tsx:128` | `huong` Hướng đi chọn · `ly-do` Lý do ≥ 1 · `xac-nhan` Xác nhận chọn · `ho-ten` Họ tên ≥ 1 · `ngay-sinh` Ngày sinh (lỗi riêng "Gõ dd/mm/yyyy") · NganCase giữ câu chặn hiện có làm `lyDo` |
| Ghi vi phạm `yThuc/RecordViolationPanel.tsx:96-98` · Tạo PA ý thức `CreateMeasurePanel.tsx:55-57` · Xác nhận `ConfirmMeasurePanel.tsx:72` | `hoc-vien` chọn · `mo-ta` Mô tả ≥ `minLen` · `vi-pham` "Cần ít nhất một vi phạm" · `ten-pa` Tên phương án ≥ 1 (khi Khác) · Confirm: `lyDo` = câu `measureMissing` |
| Xếp hàng loạt `test/keHoach/NganXepHangLoat.tsx:144-148` · Xoá HV `students/XoaHocVienPanel.tsx` · Xoá tài khoản `platform/XoaTaiKhoanPanel.tsx` | `dot` Đợt chọn · `hoc-vien` Học viên chọn · `ky-nang` Kỹ năng chọn · `tuan` Tuần chọn · Xoá: `go-lai` Gõ lại mã "Chưa khớp mã" |

- [ ] **Phép kiểm trước** (khối 7, quét nguồn): mọi file `<KhungPanel` trong `web/src/modules` trừ `classes/`, `dev/`,
  `yThuc/PhuongAnPanel.tsx`, `yThuc/XemPhuongAnPanel.tsx` (không có ô nhập) phải chứa `useLoiForm(`:
```ts
  check('N1 (7) · mọi form KhungPanel (trừ classes/, dev/, panel chỉ xem) dùng useLoiForm', () => {
    const bo = /modules[\\/](classes|dev)[\\/]|PhuongAnPanel|XemPhuongAnPanel/;
    const thieu = tepTsx('web/src/modules').filter((f) => !bo.test(f) && /<KhungPanel/.test(docSach(f)) && !/useLoiForm\(/.test(docSach(f)));
    assert(thieu.length === 0, thieu.join(', '));
  });
```
  với `tepTsx(dir)` = đệ quy `fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })` trả đường dẫn tương đối các `.tsx`
  (đặt đầu file phép kiểm, Task 11 dùng lại).
- [ ] Làm lần lượt theo bảng; mỗi form bấm thử nhanh không cần — gom ở Task 13. `npm run check` → commit
  `PR-N1 (7): báo lỗi rõ cho các form KhungPanel còn lại`.

## Task 8 · Học viên & Lớp: không tự mở lớp, tiêu đề dính; tab Ý thức lớp số = dòng (YC-11.1, T17, YC-11.3.2, A9 mã HV)

**Files:** `shared/domain/hocVienLop.ts:235-238`; `server/src/tests/hocVienLop.tests.ts:172`; `web/src/modules/students/StudentsPage.tsx:196`
+ `HopLop` (`HangNhom className`); `web/src/index.css` (một khối sau `.hang-lon.dong > td:first-child`); tạo
`shared/domain/viPhamLop.ts` (+ export); `web/src/modules/yThuc/ClassYThucCard.tsx:122-138, 163-167, 251-262, 282`.

- [ ] **Phép kiểm trước** (khối 8) + sửa kỳ vọng `hocVienLop.tests.ts:172` thành `[]` với tên `'Không tự mở lớp nào (T17)'`:
```ts
  check('N1 (8) · T17: không lọc → không mở lớp nào; đang lọc → tối đa 5 lớp có kết quả', () => {
    assert(d.lopMoSan({ thamSoOpen: null, lopHien: [1, 2, 3], dangLoc: false }).length === 0, 'tự mở lớp');
    assert(d.lopMoSan({ thamSoOpen: null, lopHien: [1, 2, 3, 4, 5, 6, 7], dangLoc: true }).join() === '1,2,3,4,5', 'lọc');
    assert(/overflow-x-auto md:overflow-visible/.test(docSach('web/src/modules/students/StudentsPage.tsx')), 'khung bảng còn chặn tiêu đề dính');
  });
  check('N1 (8) · YC-11.3.2: lọc một nhóm → số trên dòng em = số dòng "Vi phạm gần đây", mọi dòng đúng nhóm', () => {
    const vp = (id: number, category: string, occurredOn: string) => ({ id, category, occurredOn });
    const r = d.dongViPhamLop({ chuaXuLy: [vp(1, 'chuyen_can', '2026-09-20'), vp(2, 'btvn', '2026-09-21')],
      dangChuanBi: [{ id: 9, kindLabel: 'Report 1', violations: [vp(3, 'btvn', '2026-09-10'), vp(4, 'chuyen_can', '2026-09-12')] }],
      nhom: 'chuyen_can', homNay: '2026-09-24' });
    assert(r.so === 2 && r.dong.every((x: any) => x.v.category === 'chuyen_can') && r.dong[0].v.id === 1, JSON.stringify(r));
    assert(r.cuNhatNgay === 4, `cũ nhất ${r.cuNhatNgay}`);
  });
```
- [ ] **Mã:** `lopMoSan` → `return i.dangLoc ? i.lopHien.slice(0, 5) : [];` (chú thích T17). `StudentsPage.tsx:196` →
  `<div className="card overflow-x-auto md:overflow-visible">` — `.th` đã `position: sticky; top: 0` (index.css:147) nhưng khung
  `overflow-x-auto` bắt nó dính vào chính khung (không cuộn dọc) → từ 768px bỏ khung cuộn để tiêu đề dính theo `<main>`; dưới 768px
  bảng 780px vẫn cuộn ngang, tiêu đề không dính (Q10). `HopLop`: `HangNhom` thêm `className={mo ? 'hang-lon-dinh' : ''}`. `index.css`:
```css
  /* PR-N1 (YC-11.1): hàng lớp ĐANG MỞ dính ngay dưới tiêu đề cột khi cuộn trong <main> — luôn biết đang xem lớp nào. */
  @media (min-width: 768px) {
    .hang-lon.hang-lon-dinh > td {
      position: sticky; top: 33px; z-index: 9;
      background: linear-gradient(var(--hang-lon-bg), var(--hang-lon-bg)), var(--surface);
    }
  }
```
  (đo chiều cao thật của `thead` ở Task 13; khác 33px thì sửa số, ghi Nhật ký).
- [ ] **Mã `viPhamLop.ts`:**
```ts
/** MỘT TẬP cho cả số và danh sách ở tab Ý thức lớp (YC-11.3.2): chưa xử lý + đang nằm trong PA đang chuẩn bị, CÙNG lọc theo nhóm. */
export type VpCoNhom = { id: number; category: string; occurredOn: string };
export function dongViPhamLop<V extends VpCoNhom>(i: {
  chuaXuLy: readonly V[]; dangChuanBi: readonly { id: number; kindLabel: string; violations?: readonly V[] | null }[];
  nhom: string | null; homNay: string;
}) {
  const hop = (v: V) => !i.nhom || v.category === i.nhom;
  const dong = [
    ...i.chuaXuLy.filter(hop).map((v) => ({ v, dangChuanBi: null as { id: number; kindLabel: string } | null })),
    ...i.dangChuanBi.flatMap((m) => (m.violations ?? []).filter(hop).map((v) => ({ v, dangChuanBi: { id: m.id, kindLabel: m.kindLabel } }))),
  ].sort((a, b) => b.v.occurredOn.localeCompare(a.v.occurredOn) || b.v.id - a.v.id);
  const cu = i.chuaXuLy.filter(hop).map((v) => v.occurredOn).sort()[0] ?? null;
  const cuNhatNgay = cu ? Math.round((Date.parse(`${i.homNay}T00:00:00Z`) - Date.parse(`${cu.slice(0, 10)}T00:00:00Z`)) / 86_400_000) : null;
  return { dong, so: dong.length, cuNhatNgay };
}
```
  `ClassYThucCard.tsx`: trong `rowsForCategory` thêm `vp: dongViPhamLop({ chuaXuLy: s?.violations ?? [], dangChuanBi: ms, nhom: cat,
  homNay })` vào mỗi dòng; `:255` → `{s.vp.so} vi phạm`; "cũ nhất" (:261) dùng `s.vp.cuNhatNgay`; `:282` `vpGanDay(s)` → `s.vp.dong`
  (xoá hàm `vpGanDay` :163-167); sắp xếp `:142` theo `b.vp.so - a.vp.so`. A9: `:251` `r?.studentCode` → `r ? maHocVienNgan(r.studentCode) : null`.
  Không đổi bộ lọc (dựng lại tab là PR-YT4).
- [ ] `npm run check` → commit `PR-N1 (8): HV & Lớp không tự mở lớp + tiêu đề dính; tab Ý thức lớp số khớp dòng`.

## Task 9 · Kết quả & điểm nói đúng (UX-A A1, A2, A3, A4, A8, A9; K2-10)

**Files:** `web/src/lib/format.ts:85`; `shared/domain/display.ts:188-225`; `web/src/ui/KetQuaDot.tsx:8-13, 52-64`; `web/src/ui/ui.tsx:102-109`;
`web/src/modules/students/BangHocVienLop.tsx:108-110`; `ClassRoster.tsx:51, 95-135, 166-204, 226-257`; `classes/BangDiemLopThuong.tsx:98-101`;
`shared/domain/hocVienLop.ts:105`, `chamDiem.ts:60`, `hanhTrinh.ts:368`, `server/src/students/standing.ts:91`; `shared/domain/cases.ts:459-461`;
`web/src/modules/cases/CaseBoardPage.tsx:224, 230-235`; `web/src/modules/worklist/MgmtTasksPage.tsx:37`; `server/src/classes/classes.ts:459-481, 520-531`.

- [ ] **Phép kiểm trước** (khối 9):
```ts
  check('N1 (9) · A1: không còn ký tự điều khiển trong mã; A2: SOS tạm thời nói "tạm thời"; A4: "x/y môn đạt"', () => {
    const tep = [...tepTsx('web/src'), ...tepTs('shared/domain'), ...tepTs('server/src')];
    const ban = tep.filter((f) => /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(fs.readFileSync(path.join(REPO, f), 'utf8')));
    assert(ban.length === 0, `ký tự điều khiển: ${ban.join(', ')}`);
    const v = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 2, cheDo: 'ielts' });
    assert(v.text === 'SOS 2 tạm thời · 2/4 kỹ năng' && v.tamThoi, v.text);
    const r = d.attemptProgressView({ scored: 4, required: 4, passed: false, sos: 3, cheDo: 'ratio', soMonChuaDat: 4 });
    assert(!/^Đạt/.test(r.text), r.text);
    for (const f of ['shared/domain/hocVienLop.ts', 'shared/domain/chamDiem.ts', 'shared/domain/hanhTrinh.ts', 'shared/domain/display.ts', 'server/src/students/standing.ts'])
      assert(!/`Đạt \$\{/.test(docSach(f)), `${f} còn "Đạt x/y"`);
  });
  check('N1 (9) · A8: "Bình thường" không tô màu cảnh báo; K2-10: bảng điểm FT so kỳ vọng của đúng mốc, có cột W', () => {
    assert(d.URGENCY_TONE.attention === 'neutral', 'Bình thường còn vàng');
    const ros = docSach('web/src/modules/students/ClassRoster.tsx');
    assert(!/target=\{s\.cycle/.test(ros) && /kyVong=\{h\.expectation/.test(ros) && /'writing'/.test(ros), 'Band còn so target / thiếu cột W');
    assert(/expectation: t\.expectation/.test(docSach('server/src/classes/classes.ts')), 'history chưa có kỳ vọng từng mốc');
  });
```
  (`tepTs` như `tepTsx` cho `.ts`, bỏ `node_modules`/`dist`.)
- [ ] **A1** `format.ts:85` → `const m = /^SOS\s*([123])\b/.exec(text);` (xoá ký tự 0x08 vô hình — SOS 1 hết xanh dương).
- [ ] **A2** `display.ts:191-192`: ratio → ``incomplete(`${scored - sos}/${scored} ${donVi} đạt · tạm thời`, 'danger')``; ielts →
  ``incomplete(`SOS ${sos} tạm thời · ${scored}/${required} ${donVi}`, 'danger')``. `KetQuaDot.hoMau`: nhánh `incomplete` →
  `tone === 'danger' && soMon ? (soMon === 1 ? 'sos1' : soMon === 2 ? 'sos2' : 'rose') : 'tam'`; khi `v.overall === 'incomplete'`
  thêm `border-dashed` vào class. `ui.tsx` `Level` thêm `dut?: boolean` → `border border-dashed border-current bg-transparent`.
  `BangHocVienLop.tsx:108-110` → `<Level tone={sosTone(s.standing?.sosLevel ?? null)} dut={k.sosTamThoi} title={k.sosTamThoi ?
  'Tạm thời: chưa đủ điểm các môn' : undefined}>{k.sos}{k.sosTamThoi ? ' tạm thời' : ''}</Level>`. `ClassRoster.KetLuan`: SOS dùng
  `<Level tone={sosTone(row.sosLevel)} dut={row.provisional}>SOS {n}{row.provisional ? ' tạm thời' : ''}</Level>` (hết vàng cho mọi mức).
- [ ] **A3/A9/K2-10** máy chủ `classes.ts` nhánh FT (:459-481) thêm `expectation: result.expectation, writing: result.bands?.writing ?? null`;
  nhánh lớp thường thêm `expectation: null, writing: null`; `history` (:524-531) thêm `expectation: (t as any).expectation ?? null,
  writing: (t as any).writing ?? null`. `ClassRoster.tsx`: `FT_SKILLS` → `['listening', 'reading', 'writing1', 'writing2', 'writing',
  'speaking']` (cột **W** = Writing tổng, cột SOS thật xét), colgroup mỗi cột kỹ năng `w-[5%]`; ô `writing` đọc `h.writing`. `Band`:
```tsx
/** Ô band (K2-10, A3, A9): so KỲ VỌNG CỦA ĐÚNG MỐC; dưới kỳ vọng có dấu mảnh ▾ (không chỉ dựa màu); luôn một chữ số thập phân. */
function Band({ v, kyVong, faded, soSanh = true }: { v: number | null; kyVong: number | null; faded: boolean; soSanh?: boolean }) {
  if (v === null) return <Dash />;
  const duoi = soSanh && kyVong !== null && v < kyVong;
  const tone = !soSanh || kyVong === null ? 'text-slate-100' : duoi ? 'text-rose-200' : 'text-emerald-200';
  return <span className={`tabular-nums text-xs ${tone} ${faded ? 'opacity-55' : ''}`} title={kyVong !== null ? `kỳ vọng ${fmtBand(kyVong)}` : undefined}>
    {duoi && <span aria-hidden className="mr-0.5 text-[9px]">▾</span>}{fmtBand(v)}</span>;
}
```
  gọi `kyVong={h.expectation ?? null}`, `soSanh={k !== 'writing1' && k !== 'writing2'}`. `BangDiemLopThuong.ODiemThuong` (:100): trượt thì
  thêm `<span aria-hidden className="mr-0.5 text-[9px]">▾</span>` trước `score/total`.
- [ ] **A4** (8 chỗ, cùng mẫu "x/y môn đạt"): `hocVienLop.ts:105` → `` `${soDat}/${k.scored} môn đạt (đã chấm)` `` / `` `${soDat}/${k.required} môn đạt` ``;
  `chamDiem.ts:60` cùng mẫu; `display.ts:196, 200` → `` `${scored}/${scored} ${donVi} đạt · còn ${required - scored} ${donVi}` ``, `:214`
  → `` `${required}/${required} ${donVi} đạt` ``, `:207` (ratio, đủ điểm có môn trượt) → `` `${required - soChuaDatThat}/${required} ${donVi} đạt · SOS ${sos}` `` ("0/4 môn đạt · SOS 3"; bỏ SOS lớp thường là T58 của PR-LT2b), `:225` → `` `${required}/${required} ${donVi} đã chấm` ``; `hanhTrinh.ts:368` →
  `` `${soDat}/${a.soYeuCau} môn đạt` ``; `standing.ts:91` → `` `${s.attemptLabel}: ${s.scored - (s.failed ?? 0)}/${s.required} môn đạt` ``.
  Sửa kỳ vọng chữ ở `hocVienLop.tests.ts`, `hoSoHocVien.tests.ts`, `hanhTrinh.tests.ts`, `chamDiem.tests.ts`, `run.ts` (grep `Đạt [0-9]`).
- [ ] **A8:** `cases.ts:460` `attention: 'neutral'`; `CaseBoardPage.tsx:230-235` chỉ hiện khi `r.urgency === 'urgent'` bằng
  `<Nhan tone="bad">Gấp</Nhan>`; `:224` `working` → `'idle'` (trung tính + chữ "Đang xử lý"); `MgmtTasksPage.tsx:37` `doing: 'idle'`.
  Màu trạng thái chung (`Status doing` xanh) để PR-NEN (`NhanTrangThai`).
- [ ] `npm run check` → commit `PR-N1 (9): SOS 1 vàng, SOS tạm thời có chữ, "x/y môn đạt", bảng điểm FT so kỳ vọng đúng mốc`.

## Task 10 · Toast "Hoàn tác" 5 giây dùng chung (UX-C C1, §7.6 `ToastHoanTac`)

**Files:** tạo `shared/domain/hoanTac.ts` (+ export); sửa `web/src/ui/Toast.tsx`; `web/src/modules/yThuc/RecordViolationPanel.tsx:119-128`.

- [ ] **Phép kiểm trước** (khối 10):
```ts
  check('N1 (10) · C1: Hoàn tác 5 giây, đếm ngược làm tròn lên; Ghi vi phạm dùng toast chung', () => {
    assert(d.HOAN_TAC_MS === 5000, 'HOAN_TAC_MS');
    const ca: [number, number][] = [[5000, 5], [4001, 5], [4000, 4], [1, 1], [0, 0], [-50, 0]];
    for (const [con, giay] of ca) assert(d.giayHoanTacConLai(1_000_000 + con, 1_000_000) === giay, `${con} → ${d.giayHoanTacConLai(1_000_000 + con, 1_000_000)}`);
    const src = docSach('web/src/modules/yThuc/RecordViolationPanel.tsx');
    assert(/toast\.hoanTac\(/.test(src) && !/ms: 10000/.test(src), 'Ghi vi phạm chưa dùng Hoàn tác chung');
  });
```
- [ ] **Mã:** `hoanTac.ts`: `export const HOAN_TAC_MS = 5000;` · `export function giayHoanTacConLai(het: number, bayGio: number): number
  { return Math.max(0, Math.ceil((het - bayGio) / 1000)); }`. `Toast.tsx`: `Ctx` thêm `hoanTac: (text: string, onHoanTac: () => void,
  opts?: { key?: string }) => void` = `push('ok', text, { ms: HOAN_TAC_MS, key: opts?.key, hanhDong: { nhan: 'Hoàn tác', onBam: onHoanTac } })`
  và lưu `het = Date.now() + ms` vào toast; nút hành động có `het` thì vẽ `Hoàn tác (n)` bằng component nhỏ tự `setInterval` 1 giây
  (`giayHoanTacConLai`), dọn interval khi gỡ. Màu toast `ok`/`info` đổi sang trung tính (`border-[color:var(--line-strong)]
  text-slate-100`, dấu ✓ nhỏ trước chữ `ok`) — xanh dương chỉ còn cho ô điểm (A8). `RecordViolationPanel.tsx:127` →
  ``toast.hoanTac(`Đã ghi vi phạm cho ${sn}`, () => hoanTac(id), { key: 'ghi-vi-pham' });``
- [ ] Thao tác mới cần Hoàn tác (vắng C2, dời/huỷ C3/C4…) dùng `toast.hoanTac` ở PR của nó — ghi vào "Chuyển cho PR khác".
  `npm run check` → commit `PR-N1 (10): Toast Hoàn tác 5 giây dùng chung`.

## Task 11 · Tên "Pisa Tracking", chữ máy lọt ra, chữ "Admin chi nhánh" (YC-6, UX-A A7, K1-45 phần chữ)

**Files:** `index.html:7`, `web/src/App.tsx:84`, `web/src/modules/platform/WelcomePage.tsx:137, 342-345`, `AdminPage.tsx:44-47, 147`,
`server/src/index.ts:21`, `README.md:1`, `TRIEN_KHAI.md:1`, `DEMO.md:1`, `thiet-ke/THUAT_NGU_DA_CHOT.md:24`; `shared/domain/metrics.ts`
(mọi `khuTrung`); tạo `shared/domain/nhatKy.ts` (+ export); `web/src/modules/students/XoaHocVienPanel.tsx:80`;
`server/src/cases/sosAuto.ts:149`, `server/src/cases/signals.ts:139`; `server/src/tests/hocVienLop.tests.ts:71-73`.

- [ ] **Phép kiểm trước** (khối 11):
```ts
  check('N1 (11) · YC-6 + A7: không còn "PISA Progress", "npm", "COUNT DISTINCT", ngày ISO trong thông báo; nhật ký có nhãn tiếng Việt', () => {
    const hien = [...tepTsx('web/src'), 'index.html', 'shared/domain/metrics.ts'];
    const sai = hien.filter((f) => /PISA Progress|npm run|COUNT DISTINCT/.test(docSach(f)));
    assert(sai.length === 0, sai.join(', '));
    assert(!/Hạn \$\{(input\.verifyDue|row\.verify_due)\}/.test(docSach('server/src/cases/sosAuto.ts') + docSach('server/src/cases/signals.ts')), 'ngày ISO trong thông báo');
    const ma = new Set<string>();
    for (const f of tepTs('server/src')) for (const m of docSach(f).matchAll(/\baction\s*:\s*'([a-z_]+\.[a-z_.]+)'/g)) ma.add(m[1]);
    const thieuNhan = [...ma].filter((a) => d.nhanHanhDongNhatKy(a) === 'Thao tác hệ thống');
    assert(ma.size > 0 && thieuNhan.length === 0, `thiếu nhãn: ${thieuNhan.join(', ')}`);
  });
```
- [ ] **YC-6:** `<title>Pisa Tracking</title>`; `App.tsx:84` và `WelcomePage.tsx:137` → `Pisa Tracking`; `index.ts:21` →
  `` `[api] Pisa Tracking — API đang chạy tại http://localhost:${PORT}` ``; tiêu đề `README.md` → `# Pisa Tracking — bản demo chạy trên máy`,
  `TRIEN_KHAI.md` → `# Pisa Tracking — đưa bản chính lên mạng, hướng dẫn từng bước`, `DEMO.md` → `# Pisa Tracking — bản demo: xem gì,
  ở đâu, và những điều đã chốt`; `THUAT_NGU_DA_CHOT.md` g1-001 thêm "đổi thành **Pisa Tracking** 28/09"; phép kiểm
  `hocVienLop.tests.ts:71-73` so `Pisa Tracking`. **Không** đổi tên repo/thư mục, không sửa tài liệu lịch sử (plan cũ, báo cáo, mockup cũ).
- [ ] **K1-45 (chữ):** `AdminPage.tsx:44-47` → `Tài khoản, danh mục và cấu hình quyền của phần mềm.`; `WelcomePage.tsx:342-345` →
  `Ba nhóm: Quản trị hệ thống (quản phần mềm), Quản lý (điều hành chuyên môn) và Giáo viên.` (bỏ "Admin chi nhánh").
- [ ] **A7:** `metrics.ts` `khuTrung` → câu người đọc: `student_id` → `Mỗi học viên chỉ đếm 1 lần`, `… theo môn` → `Mỗi học viên
  chỉ đếm 1 lần ở mỗi môn`, `case_id` → `Mỗi Case chỉ đếm 1 lần`, `signal_id` → `Mỗi tín hiệu chỉ đếm 1 lần`, `attempt_id` → `Mỗi
  lượt Test chỉ đếm 1 lần` (mã khác gặp thì cùng mẫu). `nhatKy.ts`: `const NHAN_NHAT_KY: Record<string, string> = { … }` đủ mọi mã
  gom bằng lệnh `grep -rhoE "action: '[a-z_]+\.[a-z_.]+'" server/src --include=*.ts | sort -u` (ví dụ `attempt.cancel_part` → `Huỷ
  phần còn lại của lượt`); `export function nhanHanhDongNhatKy(ma: string): string { return NHAN_NHAT_KY[ma] ?? 'Thao tác hệ thống'; }`;
  `AdminPage.tsx:147` → `{nhanHanhDongNhatKy(a.action)}` (mã thô vào `title`). `XoaHocVienPanel.tsx:80` → `Nên nhờ Quản trị sao lưu
  trước lần xoá đầu.` `sosAuto.ts:149`/`signals.ts:139` → `` `Hạn ${ngay(input.verifyDue, demoToday())}` `` / `` `Hạn ${ngay(row.verify_due, demoToday())}.` ``.
- [ ] `npm run check` → commit `PR-N1 (11): tên Pisa Tracking, bỏ chữ máy lọt ra màn hình`.

## Task 12 · Cập nhật tài liệu (K2-37, K5-67, §10.1)

- [ ] `CODE_MAP.md`: dòng "Nền giao diện (PR-UX0)" thêm `ui/loiForm.tsx` (`useLoiForm`, `DongCanSua`) + `shared/domain/loiForm.ts`
  (`kiemTruong`, `dsLoi`, `nhanCanSua`); dòng "Ngăn Case" thêm `hanTheoNgay`, `HAN_DUYET_NGAY`, `nhanTuanGhiKetQua`; dòng Ý thức thêm
  `viPhamLop.ts` (`dongViPhamLop`); mục Tra nhanh "Thông báo nổi" thêm `toast.hoanTac` + `hoanTac.ts`; thêm `nhatKy.ts`,
  `migrate/prN1.ts` + `chay-thu:n1`, phép kiểm `suaLoiNong.tests.ts`.
- [ ] `thiet-ke/HE_GIAO_DIEN.md` §4: dòng `cap-nhat-pa` (:112) → `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09` · "Hằng tuần, hết
  **Thứ Hai** tuần sau" · nguồn "§5.6 R-PA1"; dòng :127 "mốc Chủ nhật" → "mốc Thứ Hai"; thêm quy ước "mọi hạn *n ngày* tính cả ngày
  đầu (`hanTheoNgay`)"; thêm mục nhỏ "Báo lỗi form" (viền đỏ khi rời ô, câu dưới ô, sau khi bấm Lưu chân form có một dòng xám `n ô cần sửa ↑`, bấm → ô lỗi đầu tiên; không liệt kê luật ở chân)
  và "Toast Hoàn tác 5 giây".
- [ ] `thiet-ke/TU_DIEN_VA_CHU.md`: tên ứng dụng **Pisa Tracking**; `hạn hết T2 {dd/mm}`; `SOS {n} tạm thời`; `{x}/{y} môn đạt`;
  `quá hạn {n} ngày` (không "⚠ n ngày"); `🔒 theo quy chế` (cạnh tên PA quy chế SOS; bỏ "Gợi ý tự động · chờ xác nhận"); dòng :273 (dưới tên HV lớp) đổi theo A2; dòng :185 `Hoàn tác` → `Hoàn tác ({n})` 5 giây;
  `Cần ít nhất {n} ký tự (đang có {k})` (dưới ô) · `{n} ô cần sửa ↑` (chân form).
- [ ] `thiet-ke/mockup/19-nang-cap-27-09.html` (K2-37): mọi chữ hạn ghi kết quả PA ở M3, M4, M7 (dòng ~360, 370, 382, 386, 533: "trước
  CN 28/09", "ghi kết quả CN 05/10") → mẫu R-PA3 `Ghi kết quả tuần W… · hạn hết T2 dd/mm` (ngày Thứ Hai thật của 2026).
- [ ] Đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §8 hàng PR-N1: cột Nội dung thêm "**S4-1 phần gán tự
  động PA quy chế** (PA chạy ngay, 🔒 theo quy chế, GVBM chỉ còn xác định nguyên nhân)"; cột Migrate "Không" → "Có (nhỏ): PA quy chế
  chờ xác nhận → đang chạy (S4-1) + dời `action_due` CN → T2 (R-PA5)"; hàng PR-SOS ghi "S4-1 phần còn lại (Chuyển cho PR-SOS trong
  kế hoạch PR-N1)"; §5.6 R-PA3 ví dụ "29/09" → "28/09" (29/09/2026 là Thứ Ba — xem Mâu thuẫn M1). Cột Migrate của PR
  khác (K5-67) để người soạn kế hoạch từng PR sửa.
- [ ] `TRIEN_KHAI.md` mục lệnh chạy thử trước migrate đợt 1: thêm `npm run chay-thu:n1` (chỉ đọc; đọc số PA dời, số PA chạy thiếu hạn).
- [ ] `plan.md` §14 thêm một dòng: `28/09 PR-N1: tên Pisa Tracking; hạn ghi kết quả PA hết Thứ Hai (+migrate dời hạn); báo lỗi form rõ;
  Toast Hoàn tác; UX-A A1–A9; PA quy chế SOS gán tự động chạy ngay (S4-1, +migrate PA chờ xác nhận).`
- [ ] Commit `PR-N1 (12): tài liệu — hạn Thứ Hai, báo lỗi form, Hoàn tác, tên Pisa Tracking`.

## Task 13 · Bấm thử theo vai + 375px (một lần), mở PR

- [ ] Máy chủ thử trong worktree (memory "máy chủ dev trong worktree"): `npm run seed` → `npm run chay-thu:n1` (ghi số in ra vào
  Nhật ký) → `PORT=4157 node dist-server/server/src/index.js` (nền) → file Vite tạm ở gốc worktree (`port: 5357, strictPort`, proxy
  `/api` → `127.0.0.1:4157`, alias `@shared`) → `npx vite --config <file>`. Playwright kênh Chrome (`npm install --no-save playwright`),
  đăng nhập `POST /api/demo/session {userId}`. Ảnh `thiet-ke/anh/pr-n1/NN-ten-{1440|375}.png`; ảnh "trước" chụp từ `main` cùng kịch bản.
- [ ] Đi hết bảng **KIỂM** dưới đây. Lỗi bắt được → sửa, commit riêng `PR-N1 (13a): …`.
- [ ] Dọn file Playwright/Vite tạm; tắt 4157/5357; quét `tests/run.js` treo; `npm run check` cuối (≥ B + 25 phép kiểm).
  Rebase `origin/main` nếu PR-LOP/PR-NEN đã merge (gỡ xung đột theo bảng ranh giới).
- [ ] Push, mở PR `PR-N1: sửa lỗi nóng + sửa sai sự thật (Pisa Tracking, hạn hết Thứ Hai)` — thân: bảng mục YC/T/K → ảnh trước/sau
  → đạt; "tầng 1" của từng màn chạm tới (§7.5); **"Có migrate nhỏ: R-PA5 — chạy `npm run chay-thu:n1` trên DB THỬ trước"**; bảng Q;
  "Chuyển cho PR khác"; dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Báo planning, không tự merge.

## KIỂM — kịch bản bấm thử (Task 13)

| # | Vai · khổ | Làm gì | Phải thấy |
|---|---|---|---|
| 1 | QL Vy (2) · 1440 | Mở Học viên & Lớp | Tên **Pisa Tracking** ở thanh đầu + tab trình duyệt; **không lớp nào mở sẵn** |
| 2 | QL Vy · 1440 | Mở 3 lớp, cuộn xuống | Hàng tiêu đề cột (Học viên · Kết quả gần nhất…) dính trên cùng; ngay dưới là hàng lớp đang xem (`MB-FT 101 …`) |
| 3 | QL Vy · 1440 | Gõ tìm "Lan" | Lớp có kết quả tự mở (≤ 5); SOS tạm thời hiện `SOS 2 tạm thời` viền đứt đúng màu mức |
| 4 | GVCN Hà (7) · 1440 | Hồ sơ Vũ Ngọc Lan › Học thuật, hàng Reading | Bấm "Xác định nguyên nhân" → nút "Không cần theo dõi" biến mất; Huỷ → hai nút lại; bấm "Không cần theo dõi" → khối nguyên nhân không hiện. Không bao giờ thấy hai khối |
| 5a | GVBM Trang (9) · 1440 | Hồ sơ Vũ Ngọc Lan › Học thuật, Case Reading từ SOS | PA "Tutor · đến MT2" có `🔒 theo quy chế`, nút **Ghi kết quả** + `hạn hết T2 …`; không còn "Gợi ý tự động · chờ xác nhận", không Xác nhận/Sửa/Thay; dòng chờ chỉ còn "xác định nguyên nhân" |
| 5 | GVCN Hà · 1440 | cùng hồ sơ, cột phải hàng Case/PA | Mọi nút (Mở Case, Ghi kết quả) nằm **trên**, chữ phụ (hạn, "Kết luận: …") **dưới**, cùng một mép trái |
| 6 | GVCN Hà · 1440 | hàng PA đang chạy + ô "Việc cần làm tiếp" | `hạn hết T2 dd/mm` (không còn "hạn CN"); ô đầu hồ sơ: `tuần W… · hạn hết T2 …` và cùng số ngày quá hạn với hàng kỹ năng |
| 7 | GVCN Hà · 1440 | Ghi kết quả một PA trễ 3 tuần | Tiêu đề khối `1 · Kết quả W… – W… (ghi bù 3 tuần)`; lưu xong hạn mới là Thứ Hai |
| 8 | GVCN Hà · 1440 | "+ Case" › tab Đã xong từ trước | Gõ cả câu tên PA — dòng **không** tự đóng; bấm Xong mới gọn; "+ Thêm PA đã áp dụng" mở dòng mới ở chế độ sửa |
| 9 | GVCN Hà · 1440 | cùng form: gõ 8 ký tự Mô tả rồi Tab sang ô khác | Ô Mô tả viền đỏ + `Cần ít nhất 15 ký tự (đang có 8)` dưới ô + bộ đếm `8/15`; **chưa** có gì ở chân; bấm Lưu → chân một dòng xám nhỏ `2 ô cần sửa ↑` (không chữ vàng, không liệt kê luật); bấm → cuộn + focus ô lỗi đầu tiên |
| 10 | GVCN Hà · 1440 | Công việc › Việc cần làm | **Một** nhóm "Ghi kết quả PA", dòng `Ghi kết quả PA R` + `hạn hết T2 …`; không còn dòng "Làm PA … hạn 30/08"; mọi ngày đã qua có `quá hạn n ngày` |
| 11 | GVCN Hà · 1440 | Hồ sơ lớp MB-FT 101 › Ý thức & Phối hợp, lọc Chuyên cần | Số `n vi phạm` trên dòng em = số dòng "Vi phạm gần đây"; mọi dòng là Chuyên cần; mã HV dạng ngắn |
| 12 | GVCN Hà · 1440 | Ghi một vi phạm | Toast `Đã ghi vi phạm cho … · Hoàn tác (5)` đếm lùi, bấm Hoàn tác → vi phạm biến mất |
| 13 | GVCN Hà · 1440 | Hồ sơ lớp FT › Học viên › Điểm | MT1 L 6.0 với kỳ vọng 6.0 **không đỏ**; ô dưới kỳ vọng có `▾`; có cột **W**; mọi band một chữ số thập phân |
| 14 | GVBM Trang (9) · 1440 | Tổng quan GV + Công việc | `SOS 1` **vàng** (không xanh dương); việc Nhập điểm trễ `quá hạn n ngày`; lưới lớp thường `0/4 môn đạt` |
| 15 | QL Vy · 1440 | Công việc › Chờ tôi xử lý; Quản trị › Nhật ký; Phân tích › ⓘ số liệu | Không có PA đã huỷ; nhật ký tiếng Việt (không `attempt.cancel_part`); ⓘ ghi "Mỗi Case chỉ đếm 1 lần" |
| 16 | GVCN Hà · **375** | kịch bản 4, 5, 8, 9, 10 | Form toàn màn, chân dính, lỗi dưới ô không tràn ngang; cột phải xuống dòng gọn; toast không che nút chính; không cuộn ngang trang (trừ bảng HV & Lớp cuộn trong khung) |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Vì sao không làm ở PR-N1 |
|---|---|---|
| K1-45 phần tên môn (`skillShort` → `tenMon` ở menu tài khoản) | PR-MON | cần hệ môn §5.7 |
| K3-17 phần luật: "đúng hạn cập nhật" đếm trễ cả khoảng ghi bù, chặn "Ngày ghi" trước hạn gốc | PR-SOS | đổi luật ghi kết quả + số liệu |
| K3-18 phần hạn duyệt trong hộp Chờ duyệt, "Đã xong" → liên kết phụ ở Thêm PA | PR-DUYET · PR-SOS | form Thêm PA dựng lại ở PR-SOS |
| K5-12 thẻ Chờ duyệt không có nút Nhắc | PR-DUYET | thẻ chưa có |
| K5-24 các loại hạn khác (`xac-nhan-nguyen-nhan`, `xu-ly-y-thuc`, `han-duyet`, "dời hạn chấm"), bỏ 2 loại Ý thức cũ | PR-SOS · PR-YT4 · PR-DUYET · PR-XLMT | mỗi loại đi với luồng mới của PR đó |
| K5-58 hàm chung `dongYeuCauTheoDoiTuong` khi huỷ PA/đóng Case | PR-DUYET | PR-N1 chỉ vá truy vấn + chặn duyệt |
| K5-20 cảnh báo Ý thức `> 5` → `hanTheoNgay(…, 5)` | PR-YT4 | viết lại luật Ý thức (T68) |
| K5-67 cột Migrate của các PR khác | người soạn kế hoạch từng PR | PR-N1 chỉ sửa hàng của mình |
| YC-12.5.2 cho panel `modules/classes/*` | PR-LOP | đang sửa song song |
| A8 màu trạng thái chung (`Status doing` xanh) | PR-NEN (`NhanTrangThai`) | hệ trạng thái chung §7.3 |
| Bỏ nhãn SOS của lớp thường (T58) | PR-LT2b | luật Cuối khoá |
| Toast Hoàn tác cho vắng (C2), dời/huỷ (C3, C4) | PR-HSM · PR-XLMT | thao tác thuộc PR đó |
| Chữ nút "Xác nhận nguyên nhân", luồng Xác nhận Case | PR-SOS | YC-12.3 |
| S4-1/T22 phần còn lại: khoá Thay/Kết thúc PA quy chế trong form Ghi kết quả (T63), mốc "1 tháng / đến MT kế tiếp" + "Ghi kết quả cuối", đổi người thực hiện; xoá hẳn `PresetPlanActions`, `confirmPresetPlan`/`replacePresetPlan`, hai đường `/interventions/:id/confirm|replace`, trường `awaitingConfirmation`; S4-2/S4-3 form Xác nhận Case | PR-SOS | luồng Case/PA v4 dựng lại ở PR-SOS; PR-N1 chỉ làm phần gán tự động |
| Tách "PA theo quy chế" riêng trong Phân tích › Hiệu quả PA | PR-Pb2 | T61 |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | `weeklyUpdateDue(x)` = Thứ Hai sau tuần chứa x; máy chủ **giữ** `weeklyUpdateDue(ngàyGhi + 1)` | ghi CN hay T2 đều khép đúng tuần vừa hết; ít chỗ sửa |
| Q2 | `planEndDefault` giữ Chủ nhật tuần sau (tách khỏi hạn tuần) | dự kiến kết thúc không phải hạn (T53 Q1, K5-19) |
| Q3 | Hạn QL trả lời Đề xuất PA / Xin hỗ trợ đổi **ngay** sang 5 ngày tính cả ngày gửi; hạn đang chờ cũ giữ nguyên | K3-18 câu sai sự thật — sửa luật cho khớp câu (T54); PR-DUYET chỉ chuyển vào hộp |
| Q4 | Giữ khoá loại hạn `cap-nhat-pa`, chỉ đổi chữ | khoá không hiện ra màn hình; đổi tên chạm > 10 file |
| Q5 | Nhóm việc gộp giữ khoá `result`, dòng khoá `action:{id}`; hiện từ **Chủ nhật** (hạn ≤ hôm nay + 1); QL thấy dòng người khác khi quá hạn | K5-12 khoá ổn định; Chủ nhật là lúc tuần gần xong |
| Q6 | Migrate trong `server/src/migrate/prN1.ts` + lệnh `chay-thu:n1` chỉ đọc | T78, K5 §5 cột "chạy thử" |
| Q7 | YC-12.1 sửa ở `SkillBoard.tsx` (nơi giữ trạng thái), không đụng `CaseSosControls.tsx` | tránh đè PR-NEN (ô ngày ở file đó) |
| Q8 | YC-12.5.2 áp mọi form `KhungPanel` **trừ** `modules/classes/*` và `dev/` | PR-LOP đang sửa panel lớp |
| Q9 | Luật lỗi thuần ở `shared/domain/loiForm.ts`; viền đỏ bằng biến thể Tailwind trong `Truong` | kiểm được; không sửa `index.css` |
| Q10 | Tiêu đề cột dính từ 768px; điện thoại giữ cuộn ngang bảng | bảng 780px buộc cuộn ngang, sticky dọc không sống trong khung cuộn |
| Q11 | Tab Ý thức lớp: "n vi phạm" = số dòng "Vi phạm gần đây" (chưa xử lý + đang chuẩn bị) theo nhóm lọc | YC-11.3.2 "cùng một tập" |
| Q12 | C1 = toast chung + chuyển Ghi vi phạm sang 5 giây; không thêm đường hoàn tác máy chủ mới | mỗi thao tác mới thêm ở PR của nó |
| Q13 | A8 chỉ sửa "Bình thường", "Đang xử lý" (Danh sách Case), "Tiếp tục xử lý" | màu trạng thái chung là việc PR-NEN |
| Q14 | K2-10 thêm cột **W** giữa W2 và S; W1/W2 không tô đạt/chưa đạt | SOS xét Writing tổng (§5.7) |
| Q15 | A2 = màu của mức SOS + viền đứt + chữ "tạm thời" | "tạm thời" phải đọc được, không chỉ tooltip |
| Q16 | A4 mọi nhãn tỷ lệ "Đạt x/y" → "x/y môn đạt" (8 chỗ) | không nhãn đỏ nào mở đầu bằng "Đạt" |
| Q17 | A6 nhập điểm trễ có số ngày: thêm `hanNhap` vào timeline roster | "quá hạn" phải có số |
| Q18 | YC-6 sửa tiêu đề README/TRIEN_KHAI/DEMO + THUAT_NGU; không sửa tài liệu lịch sử | tài liệu cũ là nhật ký |
| Q19 | `hanTheoNgay` dùng lại cho `planDueDate`/`signalVerifyDue` (kết quả không đổi) | một hàm cho mọi hạn "n ngày" (K5-20) |
| Q20 | Tiêu đề ghi bù: từ tuần của hạn tới tuần đầy đủ gần nhất, `W2–W4 SEP (ghi bù 3 tuần)` | K3-17 |
| Q21 | Dùng ngày thật 2026: W4 SEP → **hạn hết T2 28/09** (không phải 29/09 như đặc tả) | 29/09/2026 là Thứ Ba |
| Q22 | PA quy chế tạo ra với `status = 'started'`, `confirmed_at = lúc tạo`, `confirmed_by = NULL` (dấu "máy gán"); giữ hằng `UNCONFIRMED_PRESET` | ít đụng nhất: mọi truy vấn/chặn cũ tự tính PA này như PA thường |
| Q23 | S08: Case tự tạo, sửa điểm thành đạt, PA quy chế **chưa có kết quả tuần** → Case vẫn tự huỷ (PA huỷ `score_fixed`); đã có kết quả tuần → giữ Case, "cần xem lại" | ưu tiên của chủ sản phẩm; kết quả tuần = việc thật |
| Q24 | PA quy chế chưa có kết quả tuần vẫn đồng bộ theo mức SOS cuối của lượt; "Không cần theo dõi" huỷ PA quy chế chưa có kết quả tuần | giữ hành vi cũ, đổi điều kiện "chưa xác nhận" → "chưa ghi" |
| Q25 | Migrate PA chờ xác nhận: hạn tuần đầu tính từ **ngày migrate** | không ai quá hạn ngược lúc deploy |
| Q26 | Chân form chỉ còn dòng xám `n ô cần sửa ↑` (tên ô ở tooltip), hiện sau khi bấm Lưu; lý do chỉ nằm dưới ô | chủ sản phẩm 28/09: chữ vàng liệt kê luật quá gắt |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** R-PA3/K3/K5 ví dụ "W4 SEP · hạn hết T2 29/09": năm 2026 Thứ Hai là **28/09** (W4 SEP = 21–27/09). Kế hoạch và mockup 20 dùng 28/09.
- **M2** §8 bảng: PR-N1 cột Migrate "Không" ↔ §5.6 R-PA5 + đoạn Migrate §8 "một câu dời hạn" → theo R-PA5 (Task 3), sửa bảng ở Task 12.
- **M3** YC-12.1 trỏ `CaseSosControls.tsx`; trạng thái mở hai khối nằm ở `SkillBoard.tsx:259-327` (Q7).
- **M4** UX-A A5 trỏ `WorkList.tsx:70`; dòng "Làm PA … hạn 30/08" sinh ở máy chủ `mywork.ts:644` (`do_plan`) → sửa gốc ở Task 2.
- **M5** A2 trỏ `BangHocVienLop.tsx:534-539` — file chỉ 140 dòng, chỗ thật `:108-110`.
- **M6** YC-11.1 "thêm tiêu đề dính": `.th` đã `sticky` (index.css:147) nhưng khung `overflow-x-auto` làm hỏng.
- **M7** HE_GIAO_DIEN §4 ghi `Cập nhật kết quả · trước CN` còn mã ghi `Ghi kết quả PA · hạn CN` — cả hai đổi sang R-PA3.
- **M8** §7.6 gọi `ToastHoanTac` là thành phần mới; `Toast.tsx` đã có `hanhDong` (PR-YT2) — PR-N1 chỉ chuẩn hoá thành `toast.hoanTac`.
- **M10** Đặc tả §8 xếp S4-1 vào PR-SOS; chủ sản phẩm 28/09 kéo phần gán tự động PA quy chế lên PR-N1 (Task 5b) — sửa §8 ở Task 12.
- **M9** K3-18 dẫn `ThaoTacCase.tsx:88-90, 121-127`: câu sai ở `:88`; `:121-127` là nút "Đang theo dõi / Đã xong" (để PR-SOS).

## Nhật ký

- Mốc B (Task 0): **1367** phép kiểm (+ 20 kiểm tốc độ), `npm run check` xanh trên `66446cd`. Kế hoạch + mockup 20 đã có
  sẵn trên `main` (PR #106) nên bỏ bước chép từ nhánh `ke-hoach-nang-cap-27-09`.
- Model thật: session code và subagent chạy **Opus 5.5** (chủ sản phẩm yêu cầu subagent cùng model session, không Haiku) —
  khác dòng "Sonnet 5 · High" ở Bảng điều hành; người rà Opus 5.5 vẫn là session riêng.
- Dòng thật lệch kế hoạch (Task 0): không lệch > 20 dòng — `weeklyUpdateDue` :750, `planEndDefault` :763, `lopMoSan` :235,
  `dangSua =` :417, `toneTheoNhan` `format.ts:84`, `migrateXoaDuLieu(conn, applied)` `migrate.ts:452`, `runXoaDuLieuTests`
  `run.ts:9650`, `approvalDue`/`startDue` `cases.ts:840/994`.
- Số chỗ sửa kỳ vọng chữ/ngày (Task 1, 2, 9): Task 1 = **9** kỳ vọng — `run.ts` 6 (`weeklyUpdateDue` 14/09, 19/09, 20/09 → 21/09;
  dữ liệu mẫu `action_due` 20/09 → 21/09; `<Han>` cap-nhat-pa chữ → `Ghi kết quả tuần W3 SEP · hạn hết T2 23/09`; quá hạn
  cap-nhat-pa hạn CN 06/09 → hạn hết T2 07/09, 8 → 7 ngày), `hocVienLop.tests.ts` 2 (`han`/`title` `CN dd/mm` → `hết T2 dd/mm`,
  giữ ngày đầu vào `nextDue` để không đổi điều kiện quá hạn), `panelUx3.tests.ts` 1 (cùng kiểu). Ngoài ra chỉ đổi câu báo lỗi
  `run.ts` (:2441, :2618) và tên 2 phép kiểm, không đổi điều kiện; Task 2 = **2** kỳ vọng — `run.ts:3739` nhóm `do_plan` →
  `result` (cùng khoá `action:{id}`), `panelUx3.tests.ts:173` nhãn nhóm `Ghi kết quả` → `Ghi kết quả PA`. `run.ts:3044-3057`
  ("tutor hẹn 10/09") vẫn xanh không cần sửa — dữ liệu mẫu có `action_due` quá hạn nên QL vẫn chỉ thấy dòng quá hạn; …
- Kết quả `chay-thu:n1` trên DB demo (seed mới trong worktree, sau Task 1): **0** PA dời · **5** PA chạy thiếu hạn (2 chờ duyệt + 3 PA quy chế SOS `preset` chờ xác nhận — đều trống hạn đúng luật; 0 PA `started` thiếu hạn) · **0** PA huỷ còn chờ duyệt. Tệp DB giữ nguyên mã băm sau khi chạy (chỉ đọc). Bản sao ở scratchpad có 18 hạn Thứ Hai lùi về Chủ nhật → in đúng `18 PA sẽ dời hạn CN → T2` + dòng mẫu `#1 · Nguyễn Minh An · 10/05 → 11/05`.
- Task 1: `sosPlanEndDate('one_month')` (`shared/domain/sos.ts`, ngoài danh sách file) mượn `weeklyUpdateDue` làm "Chủ nhật
  đầu tiên từ ngày đó" → đổi hạn tuần sang Thứ Hai sẽ lén dời dự kiến kết thúc SOS 1 tháng sang Thứ Hai. Tách hàm cục bộ
  `chuNhatCuaTuan` trong `sos.ts`, kết quả giữ nguyên (sosV3 :109/:111 xanh; thêm phép kiểm chặn ở `suaLoiNong`). Không đổi luật.
- Task 1: `REPO` trong `suaLoiNong.tests.ts` đúng như kế hoạch (4 cấp từ `dist-server/server/src/tests/` về gốc worktree) —
  thêm phép kiểm `N1 (0)` xác nhận lúc chạy. `YThucTestKit` có đủ 10 trường truyền vào. Mốc sau Task 1: **1375** (+8).
- Task 2: `P` của `run.ts` không có khoá `manager` → dùng `P.mbManager` (QL chi nhánh MB, lớp MB-FT 101). `assertThrows` của kit
  bắt buộc `RegExp` → `/đã huỷ/`. `taoPa`: `recordIntervention` trạng thái `started` bắt buộc người thực hiện → thêm
  `performerSelf: true` (khoá `extra` vẫn đè được); học viên lấy ở MB-FT 101 và CHỈ có một lớp active (các phép kiểm trước ghi thêm
  lớp active cho em đầu lớp → `reportIssue` lấy lớp mới nhất, ngoài phạm vi GVCN — lần chạy check đầu đỏ 4 phép vì vậy). Tên/chữ
  ký `taoPa(key, extra)` giữ nguyên cho Task 3, 5b.
- Task 2: phép kiểm K5-02 lọc `it.key.endsWith(':id')` bắt nhầm `support:`/`owner:` của một Case KHÁC có id Case trùng số id PA
  (lần chạy check thứ hai: `["support:262","action:262","owner:262"]`) → lọc đúng `action:{id}` / `review:{id}`. Không đổi luật.
- Task 2: dòng thật khớp kế hoạch (lệch ≤ 20): `approvalDue` :840, `respondToPlan` SELECT :945, "đã trả lời" :966, `startDue` :994,
  `overdueActionDue` :2317, `ask_manager` :2957; `mywork.ts` 2b :587-657, 3 :742-810, `order` :1063; `profile.ts` :457-481.
  Thêm ngoài brief: sửa chú thích hạn QL trả lời (`cases.ts` ~:836, "dùng chung chu kỳ" → 5 ngày). Import `cycleDeadline` thừa ở
  `mywork.ts` (có từ trước, không dùng) để nguyên.
- Task 2: mốc `npm run check` — lần 1: 1376 đạt / 4 đỏ (chọn học viên); lần 2: **1379 đạt / 1 đỏ** (lọc khoá phép kiểm K5-02).
  Sửa lọc xong KHÔNG chạy check lần 3 (luật "chạy lại một lần") — chỉ `build:server` + `typecheck` xanh + chạy riêng khối N1 trên DB
  seed mới (13/13). Mốc dự kiến sau Task 2: **1380** (+5); Task 3 chạy check đầu tiên sẽ xác nhận.
- Task 3: `migrate.ts` — `migrateXoaDuLieu(conn, applied)` ở :452 (sau Task 3 là :453) nằm trong `migrateCaseEngine`, mà cả hai nhánh của `migrate()` đều đi qua → `migratePrN1` chạy trên mọi DB. `conn` ở đây là kết nối ĐỒNG BỘ (`db()`, libsql kiểu better-sqlite3), cùng kiểu các `migrateXxx(conn, applied)` khác. `strftime('%w', …)`/`date(…, '+1 day')` là hàm sẵn SQLite — chạy như nhau trên file và Turso.
- Task 3: lệch nhỏ so với brief, không đổi luật — (a) điều kiện viết MỘT lần (`dieuKien(alias)`) cho cả câu đếm và câu dời, thay vì chép hai lần; (b) câu đếm dùng `LEFT JOIN sos_cases` + lấy học viên qua `COALESCE(sc.student_id, a.student_id)` (như `loadCase`) — `JOIN` của brief sẽ bỏ sót PA nếu Case mất dòng, và Case tạo từ lượt thi có `student_id` NULL sẽ hiện không tên; (c) `chayThuN1.ts` dừng trước khi mở nếu file DB cục bộ chưa có (`db()` sẽ TẠO file rỗng — chạy thử không được để lại dấu vết); mục (2) tách thêm "chờ duyệt / PA quy chế SOS chờ xác nhận / đang chạy" để người deploy biết con số nào đáng hỏi.
- Task 3 (điểm canh "chạy mỗi lần khởi động"): `migrate()` KHÔNG chạy lúc khởi động máy chủ — chỉ `npm run migrate` (`migrate/run.ts`); `index.ts` chỉ nhập `hasLegacyDisciplineModel`. Không luồng người dùng nào đặt `action_due` bằng ngày tự chọn: mọi chỗ ghi đều qua `weeklyUpdateDue` (Thứ Hai) — tạo PA `cases.ts:~866`, duyệt :997, Giữ nguyên/Theo dõi/Điều chỉnh :2908, xác nhận PA quy chế `sosAuto.ts:206`; "Điều chỉnh" (`planRevisions.ts:99`) chỉ đổi mô tả/người/dự kiến kết thúc, không đụng `action_due`; Chờ QL đặt NULL. Riêng `migratePlanForm` (thời DB cũ, chặn bởi `legacyEra`) đặt `nextSunday(today)` — chạy TRƯỚC `migratePrN1` trong cùng lần nên kết quả cuối vẫn là Thứ Hai. Dữ liệu mẫu có một `actionDue: '2026-09-11'` cố ý (Thứ Sáu, không phải Chủ nhật). Không có vòng "đặt CN ↔ dời T2" nào.
- Task 3: `npm run check` một lần — **1381 đạt** (+1) + 20 kiểm tốc độ, typecheck xanh. Khối N1 (2) xanh cả 6, không phải sửa.
- Task 4: `CasePanel.tsx` — biến hạn ở `TheKhoiPa` tên `hanGhi` (không phải `han`) → `title` dùng `hanGhi?.viec`. `ThaoTacCase` `chuaChon` dùng `planEndDefault(startedDate || homNay)` thay `planEndDefault(homNay)`: máy chủ tính dự kiến kết thúc từ ngày bắt đầu (`cycleStart`), người chọn ngày bắt đầu khác hôm nay thì chữ mặc định phải khớp. `ThemPaPanel` chưa có `homNay` → thêm `useNgayNghiepVu()`.
- Task 4: `viecTiepTheoCua` có `han` mà `quaHan` (cờ đếm ô trễ của CẢ đợt) bật trong khi hạn sớm nhất của người xem chưa qua → vẫn xếp `danger` và title nối `· quá hạn` như cũ (không mất tín hiệu); không có `han` → nhánh cũ nguyên văn. `hanNhap` lớp thường viết lại điều kiện `myPending` (lọc môn chưa điểm + `awaitingScore`) rồi lấy `regViews.get(k)?.deadline`. `StudentDetailPage.HeaderStats` nhận `homNay: string | null` (từ `session.demoDate`, cùng nguồn `useNgayNghiepVu`) → `today: homNay ?? ''`. `WorkList.tsx` bỏ `useNgayNghiepVu`/`ngay` không còn dùng. Mọi nhóm việc không có `LOAI_HAN_CUA_VIEC` mà có `due` (`decide`, `decide_move`, `mgmt`) đều là hạn thật → `viec-van-hanh` đúng nghĩa; các nhóm khác `due: null`.
- Task 4: `policy.ts:18` là lời chủ sản phẩm 21/09 (dấu vết quyết định) → giữ nguyên câu, thêm một dòng chú thích PR-N1 bên dưới thay vì sửa câu gốc.
- Task 4: lần check đầu đỏ 1 — `hocVienLop.tests.ts:366` (PR-Qa Q13, lớp thường) so chữ cũ `· quá hạn` trơn → sửa kỳ vọng sang chữ mới `hạn 13/09 · quá hạn 1 ngày` (cùng điều kiện; xác nhận `hanNhap` lớp thường chạy thật). Lần hai: **1383 đạt** (+2) + 20 kiểm tốc độ, typecheck xanh.
