# PR-LT3 · Lịch Test ba khối + Speaking Mock chấm chéo — Kế hoạch (06/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Chủ sản phẩm chốt (điền sau khi duyệt):** Q1 dải số … · Q2 xem tuần khác … · Q3 GV chấm trống … · Q4 khối 2 lớp đã xong …
> Mục này **đè** mọi chỗ bên dưới nếu khác. Câu hỏi + khuyến nghị ở cuối file (mục "Câu cần chủ sản phẩm quyết").

**Goal:** Lịch Test tách hẳn **lịch chấm của GV** (khối 1 "Test quá hạn chấm", khối 2 "Test chấm tuần này") khỏi **lịch thi của học viên**
(khối 3 "Lịch Test tuần này"); một bài nằm đúng một khối; khối 1 không đổi theo tuần đang xem. Speaking của Mock Test không có GV mặc
định ("Chấm chéo"): quá hạn chỉ **báo** GVBM Speaking + GVCN lớp, không tính nợ / trễ cho họ; GV chấm chéo nhập muộn thì trễ của chính người đó.

**Architecture:** Máy chủ: luật thuần `khoiCham` + `laChamCheo` ở `shared/domain/chamDiem.ts`. `server/src/cham/canCham.ts`: tách phần dựng
hàng lớp của `lichTest` thành `hangLopTuan(...)` (dùng cho khối 2 và khối 3), `noTuanTruoc` đổi thành `noQuaHan` tính **theo hôm nay**
(không theo tuần đang xem) và chia ô theo `khoiCham`. T18: một cờ `laChamCheo(kind, skill)` chặn ở **nguồn** — `skillCells.mine/viec`
(`attempts.ts`), `ownersOf` (tên "GV chấm"), `scoreDebtCells` (`chamCheo: true`, không gán người), `tapChamDiem` (Phân tích GV gán theo
`examiner_user_id`) — nên badge, Việc cần làm, Tổng quan, hồ sơ GV đi theo mà không sửa từng nơi. Chuông mới `baoChamCheoQuaHan` chạy trong
lượt quét thứ Hai (`chotVangDinhKy`). Web: `LichTestTab` vẽ ba khối bằng `KhoiNhom` sẵn có; khối 1 = `KhoiNo` (sửa), khối 2 + 3 = `HangLop`
(thêm kiểu badge "Quá hạn"); `DaiSo` còn 3 ô. Không đổi luật hạn (MTa T19 lo), không đường ghi điểm mới.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` qua `run.ts`; `npm run check` = build + test + typecheck.

**Spec:** `plan.md` mục 2c T15–T18 (+ T19 hạn lớp thường), mục 4 "PR-LT3"; `docs/superpowers/specs/2026-10-05-test-mock-test-design.md` (T15–T18, mục 2);
Rulebook `thiet-ke/PISA-Rulebook-2026-09-19.md` khối "PR-LT3" (dòng ~627–636) và bảng §20 dòng "Nhập ô S của Mock ở lớp FT khác".
Mockup: `thiet-ke/mockup-lich-test-ba-khoi-2026-10-06.html` (6 trạng thái × 1440/375 × sáng/tối) — **chủ sản phẩm duyệt trước khi code**.

**Phụ thuộc / thứ tự:** chạy đợt 5, **sau khi PR-MTa merge** (MTa đổi `skillScoreDeadline` lớp thường, `saveScore` T19/T22, "MT lịch sử" → "MT cũ",
luật `lich_su` T1 — đều chạm file của PR này). Merge **MTb → LT3 → MT0** (MT0 chồng `canCham.ts`, phải merge `origin/main` sau LT3). Xem mục "Chồng với PR khác".

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro (chữ số Inter), bảng màu, `KhoiNhom`/`HangNhom`/`.hang-lon` (vạch trái 3 px giữ
  như cũ — là kiểu đã khoá, không phải viền thẻ mới). Thời gian trên màn: **mã tuần** `W4 SEP`; ngày chỉ cho hạn chấm (`hạn 07/10`).
- **Chữ trên màn = đúng mockup**, ngắn, không thêm câu giải thích dưới nút/ô. Tên khối: `Test quá hạn chấm` · `Test chấm tuần này` ·
  `Lịch Test tuần này` (tuần khác: `Lịch Test W1 OCT`). Badge khối 2: `Quá hạn`. Cột GV chấm Speaking Mock: `Chấm chéo`.
- **Một bài đúng một khối** khi xem tuần hiện tại. Luật chia khối nằm ở máy chủ + `shared/domain`; web không tự tính khối.
- Khối 1 tính theo **hôm nay** (`demoToday()` / tham số `today`), chỉ theo bộ lọc phạm vi / chi nhánh / lớp — không theo `periodId`.
- **Không đổi luật hạn** (`skillScoreDeadline`, `mocTreNhapDiem`, `quaHanNhapDiem`) — đọc đúng hàm đó; phép kiểm không viết cứng hạn lớp thường
  (sau MTa T19 = thứ Tư tuần sau), luôn tính qua `skillScoreDeadline`.
- T18 **chỉ** `kind === 'mock'` + `skill === 'speaking'` (lớp FT). Lớp thường và MT0 không đổi.
- Không bao giờ bớt: kiểm quyền như cũ (`scopeXemLuotCham`, `lopDangLoc` không lộ mã lớp ngoài phạm vi); không làm mất ô đang gõ (giữ luật
  Q14 + `chuaLuu` hỏi trước khi thu lưới); chuông có `dedupKey` (chạy lại không gửi trùng).
- Turso: không tham số đặt tên, `UNION` ≤ 20 vế, `IN (...)` qua `theoLo`. `/cham/lich-test` ghi số câu mới ở `tocDoDuong.ts` (đo, không đoán).
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts`. Phép kiểm mới `server/src/tests/prLt3.tests.ts`, gọi ở **cuối** `run.ts`.
- File mới → `CODE_MAP.md` cùng commit. Nhánh `pr-lt3-lich-test-ba-khoi`. Xong: `[x]`, một dòng mục 11 `plan.md`, mở PR (không merge),
  liệt kê chú thích `ponytail:`.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | Nói model đang chạy (phải **Opus 5.5**; khác thì dừng báo). `/ponytail lite`. `superpowers:subagent-driven-development` (subagent cùng model, **không Fable**) |
| Mỗi task | `superpowers:test-driven-development` (đỏ trên DB test trước) · lỗi lạ: `superpowers:systematic-debugging` |
| LT3-5 (khối 1, mục con) | `/impeccable layout` |
| LT3-5, LT3-6 (nhãn, khối rỗng, nhiều lớp, 375) | `/impeccable clarify` · `/impeccable harden` · `/impeccable adapt` |
| Trước khi báo xong mỗi task | `superpowers:verification-before-completion` |
| Cuối PR | `/impeccable audit` · `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR, không merge) |

## File sẽ chạm
| File | Việc |
|---|---|
| `shared/domain/chamDiem.ts` (+ `index.ts`) | `khoiCham`, `laChamCheo`, `CHAM_CHEO` |
| `server/src/cham/canCham.ts` | `hangLopTuan` (tách từ `lichTest` :405–577), `noQuaHan` (thay `noTuanTruoc` :216–310), kiểu `LichTest` mới |
| `server/src/cham/chamCheo.ts` (**mới**) | `baoChamCheoQuaHan(homNay)` — chuông T18 |
| `server/src/ops/chotVangDinhKy.ts` | gọi `baoChamCheoQuaHan` (lỗi không làm hỏng chốt vắng) |
| `server/src/fasttrack/attempts.ts` | `skillCells` `mine`/`viec` (:399, :407), `ownersOf` (:576) nhận `kind` |
| `server/src/worklist/scoreDebt.ts` | `DebtCell.chamCheo`, `userId: null` cho ô chấm chéo (:104–109) |
| `server/src/worklist/mywork.ts` | tab "Tất cả trong phạm vi" (:430–448) chữ `Chấm chéo` thay "Chưa phân công giáo viên" |
| `server/src/worklist/tongQuan.ts`, `server/src/worklist/metrics.ts`, `server/src/giaoVien/hoSo.ts` | ô `chamCheo` không vào "chưa có người chấm" / hàng "Chưa phân công"; người giữ việc = `Chấm chéo` |
| `server/src/phanTich/giaoVien.ts` | `napBai` đọc `kind` + `examiner_user_id`; `tapChamDiem` (:188) gán ô chấm chéo cho `examiner_user_id` |
| `web/src/modules/test/lichTest/kieu.ts`, `DaiSo.tsx`, `KhoiNo.tsx`, `HangLop.tsx`, `moLop.ts` | kiểu mới, 3 ô, khối 1, badge "Quá hạn" |
| `web/src/modules/test/LichTestTab.tsx` | ba khối, mở/thu, lối vào từ đường dẫn / dải số |
| `server/src/tests/prLt3.tests.ts` (**mới**), `run.ts`, phép kiểm cũ ở LT3-2/LT3-3 | kiểm |
| `server/src/tests/tocDoDuong.ts`, `CODE_MAP.md`, `plan.md` mục 11 | đo, tài liệu |

---

### Task LT3-0: Khảo sát lại sau khi MTa (và MTb nếu đã có) merge
Skill: verification-before-completion

**Files:** chỉ đọc; ghi kết quả vào đầu file này (mục "Kết quả LT3-0").

- [ ] `git log --oneline origin/main -15` — xác nhận PR-MTa đã merge; MTb đã merge chưa (LT3 merge sau MTb).
- [ ] Đối chiếu lại mọi số dòng ở bảng "File sẽ chạm" (MTa sửa `attempts.ts`, `regular.ts`, `week.ts`, `giaoVien.ts`?). Ghi chỗ lệch.
- [ ] Kiểm sau MTa: `skillScoreDeadline('ratio', T2)` = thứ Tư tuần sau (T19); chữ "MT lịch sử" ở `LichTestTab.tsx` (dòng nhắc cuối trang) đã thành
  "MT cũ" chưa; `LUOT_TINH_NO_SQL` / `lich_su` theo T1 (MT cũ theo tuần) — khối 1/2 phải loại MT cũ như hiện nay (không hạn, không nợ).
- [ ] Kiểm: tên hàm `listAttempts` → `pendingDetail[].overdue`, `pendingOwners`, `skillCells` → `mine`, `viec` còn như kế hoạch này giả định.
- [ ] Lệch lớn (ví dụ MTa đã đổi cách tính `overdue`) → dừng, ghi, hỏi planning. Commit: `docs(lt3): kết quả khảo sát sau MTa`.

### Task LT3-1: Luật thuần chia khối + cờ chấm chéo
Skill: test-driven-development

**Files:** sửa `shared/domain/chamDiem.ts`, `shared/domain/index.ts`; tạo `server/src/tests/prLt3.tests.ts`; thêm cuối `server/src/tests/run.ts`.

**Interfaces (Produces):**
```ts
export type KhoiCham = 'qua-han' | 'tuan-nay' | 'lich';
/** T15: khối của MỘT ô chưa chấm. `tuanThi`, `tuanHomNay` = thứ Hai (ISO). `quaHan` = cờ `overdue` của chính ô (đã qua `quaHanNhapDiem`). */
export function khoiCham(i: { tuanThi: string; tuanHomNay: string; quaHan: boolean }): KhoiCham;
/** T18: Speaking của Mock Test không có GV mặc định. Chỉ kind 'mock'; MT0 / lớp thường không áp. */
export const laChamCheo = (kind: string | null | undefined, skill: string): boolean => kind === 'mock' && skill === 'speaking';
export const CHAM_CHEO = 'Chấm chéo';
```
Luật `khoiCham`: `tuanThi >= tuanHomNay` → `'lich'`; `tuanThi === tuanHomNay − 7 ngày` → `'tuan-nay'` (kể cả quá hạn); cũ hơn: `quaHan ? 'qua-han' : 'tuan-nay'`
(ngoại lệ hạn riêng dời xa — T15).

- [ ] Kiểm đỏ trong `prLt3.tests.ts`:
```ts
import type { YThucTestKit } from './yThuc.tests.ts';
export async function runPrLt3Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LT3 · Lịch Test ba khối + Speaking chấm chéo');
  check('LT3-1 khoiCham: tuần trước ở khối 2 kể cả quá hạn; cũ hơn quá hạn → khối 1; hạn riêng dời xa → khối 2', () => {
    const nay = '2026-10-05';
    assert(d.khoiCham({ tuanThi: '2026-10-05', tuanHomNay: nay, quaHan: false }) === 'lich', 'tuần này');
    assert(d.khoiCham({ tuanThi: '2026-10-12', tuanHomNay: nay, quaHan: false }) === 'lich', 'tuần sau');
    assert(d.khoiCham({ tuanThi: '2026-09-28', tuanHomNay: nay, quaHan: false }) === 'tuan-nay', 'tuần trước chưa quá hạn');
    assert(d.khoiCham({ tuanThi: '2026-09-28', tuanHomNay: nay, quaHan: true }) === 'tuan-nay', 'tuần trước đã quá hạn (thứ Năm) vẫn khối 2');
    assert(d.khoiCham({ tuanThi: '2026-09-21', tuanHomNay: nay, quaHan: true }) === 'qua-han', 'sang tuần thứ hai + quá hạn');
    assert(d.khoiCham({ tuanThi: '2026-09-21', tuanHomNay: nay, quaHan: false }) === 'tuan-nay', 'hạn riêng dời xa');
  });
  check('LT3-1 laChamCheo chỉ Speaking của Mock', () => {
    assert(d.laChamCheo('mock', 'speaking') && !d.laChamCheo('mock', 'writing1') && !d.laChamCheo('mt0', 'speaking')
      && !d.laChamCheo('progress', 'speaking') && !d.laChamCheo(null, 'speaking'), 'cờ sai');
  });
}
```
- [ ] Thêm cuối `run.ts` (trước khối in tổng kết), cùng mẫu PR-DL:
```ts
// ==================================================================== PR-LT3 (Lịch Test ba khối + Speaking chấm chéo)
const { runPrLt3Tests } = await import('./prLt3.tests.ts');
await runPrLt3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```
- [ ] `npm run build:server && npm test` → đỏ (hàm chưa có). Viết hàm (dùng `addDays` sẵn có của `shared/domain`, không viết lại cộng ngày). Xanh.
- [ ] Commit: `feat(lt3): luật thuần chia khối Lịch Test + cờ Speaking chấm chéo`.

### Task LT3-2: Máy chủ — ba khối ở `lichTest`
Skill: test-driven-development

**Files:** `server/src/cham/canCham.ts`; `server/src/tests/prLt3.tests.ts`; sửa phép kiểm cũ dựa vào "Nợ = trước tuần đang xem":
`chamDiem.tests.ts` (khối "Lịch Test" ~:483–690, nhất là `dongNo` nhìn từ `TUAN_SAU` :572 và G-10 :658–690), `prUxfA.tests.ts:321`, `prS6fA.tests.ts:106–125`,
`prMon.tests.ts:340`, `prMt.tests.ts:240,487` (chỉ khi đỏ). **Giữ ý của từng phép kiểm** (lùi lịch, chấm một ô bớt một bài, khoá dòng, lọc lớp,
không lộ mã lớp) — chỉ đổi cách dựng tình huống cho khớp luật khối mới.

**Interfaces (Produces) — trả về của `GET /cham/lich-test`:**
```ts
export type TongQuanLich = { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number } };   // bỏ `quaHan` (ô trùng)
export type LopLichTest = /* như cũ */ & { periodId: number; weekStart: string };   // khối 2 có hàng của tuần cũ (hạn riêng) → cần tuần của hàng
export type LichTest = {
  scopeEmpty: boolean; tuan: { id: number; weekStart: string; weekEnd: string } | null;
  laTuanNay: boolean;                         // tuần đang xem = tuần của hôm nay
  phamVi: PhamViLichTest; coPhamViRong: boolean; coPhanCong: boolean; lopDangLoc: { id: number; code: string } | null;
  tongQuan: TongQuanLich; tongQuanKhung: Record<Khung, TongQuanLich>;
  no: DongNo[];                               // KHỐI 1 "Test quá hạn chấm" — theo hôm nay, không theo tuần xem
  chamTuanNay: LopLichTest[] | null;          // KHỐI 2 — null khi !laTuanNay
  lop: LopLichTest[];                         // KHỐI 3 — tuần đang xem
  nhacLichSu: NhacLichSu[];
};
```
Dải số: `laTuanNay` → `tong/daCham/conPhaiCham` = khối 2 + khối 3; tuần khác → khối 3. `no` = khối 1. (Theo Q1; đổi nếu chủ sản phẩm chọn khác.)

Cách làm (ponytail — dùng lại, không viết luật đếm mới):
1. Tách thân `lichTest` từ câu SQL (:441) tới `.map(...)` (:577) thành
   `function hangLopTuan(p, ctx: { periodId: number; tuan: { week_start; week_end }; giuLop; lopCuaToi; coPhanCong; branchId; today; scope },
   loc?: (attemptId: number, kyNangDanhGia: string) => boolean): { lop: LopLichTest[]; quaHanBai: number; quaHanBaiKhung: Record<Khung, number> }`.
   Khoá hàng = khoá cũ (`classId` hoặc `classId:kind`); thêm `periodId`, `weekStart`. Khối 3 gọi với `periodId` đang xem (không `loc`) — kết quả **phải
   bằng** `lop` cũ (phép kiểm cũ của hàng lớp giữ nguyên, không sửa).
2. `noTuanTruoc` → `noQuaHan(p, f, today)`: giữ gom như cũ nhưng `truocTuan` = `weekInfo(today).weekStart` (không nhận tuần xem); mỗi ô của
   `pendingDetail` tính `khoiCham({ tuanThi: x.weekStart, tuanHomNay, quaHan: x.overdue })`:
   `'qua-han'` → vào dòng khối 1 (như cũ); `'tuan-nay'` và tuần thi **cũ hơn tuần trước** → ghi `{ periodId, attemptId, kyNangDanhGia: assessedSkillOf(x.skill) }`
   vào danh sách `hanRieng` trả ra; ô tuần trước bỏ qua (khối 2 dựng bằng `hangLopTuan`). Trả `{ dong, hanRieng }`.
3. `lichTest`: `laTuanNay = tuan.week_start === weekInfo(today).weekStart`. Khối 3 = `hangLopTuan(periodId đang xem)`. Khối 2 (chỉ khi `laTuanNay`) =
   `hangLopTuan(tuần trước)` + với mỗi tuần khác nhau trong `hanRieng` một lần `hangLopTuan(tuần đó, loc = (aid, k) => hanRieng có (aid, k))`.
   Hàng khối 2 của tuần cũ: `dotLabel` thêm mã tuần trên web (có `weekStart`). Sắp khối 2: còn bài trước (`soSanhLop`), `conBai === 0` cuối (Q4).
   `ponytail:` mỗi tuần hạn riêng thêm 3 câu SQL — hiếm (chỉ khi QL dời hạn); gộp `IN` nếu đo thấy nhiều.
4. `nhacLichSu` giữ. Khoá `lopNo` (phạm vi + lớp) dùng chung cho khối 1, 2.

- [ ] Kiểm đỏ `prLt3.tests.ts` (dựng em FT mới bằng `boLichTuTao` + `luotThu` ở `luotThu.ts`, như `prMt.tests.ts`; tuần tính từ `TODAY` = thứ Hai):
```ts
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const att: any = await import('../fasttrack/attempts.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const cls: any = await import('../classes/classes.ts');
  const NAY = d.mondayOfDate(TODAY), TRUOC = t.addDays(NAY, -7), HAI = t.addDays(NAY, -14);
  const LOP = classId('MB FT 101');
  /** Một em FT của LOP, bỏ lịch tự tạo, MT{no} thi tuần `ws`, mọi kỹ năng cùng tuần, chưa điểm. Trả attemptId. */
  const emMoi = (no: number, ws: string) => {
    const r: any = conn.prepare(`SELECT e.student_id sid, cy.id cid FROM enrollments e JOIN learning_cycles cy ON cy.student_id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND cy.status = 'active' ORDER BY e.student_id DESC LIMIT 1`).get(LOP);
    boLichTuTao(conn, r.cid);
    const a = luotThu(conn, att.createAttempt, P.admin, { studentId: r.sid, cycleId: r.cid, classId: LOP, no, periodId: week.ensurePeriod(ws).id });
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(week.ensurePeriod(ws).id, a.id);
    return a.id as number;
  };
  const xem = (ws: string) => cham.lichTest(P.mbManager, week.ensurePeriod(ws).id, null, TODAY, { classId: LOP, phamVi: 'tat-ca' });
  const oCua = (r: any, aid: number) => ({
    k1: r.no.filter((x: any) => x.attemptIds.includes(aid)).reduce((n: number, x: any) => n + x.conBai, 0),
    k2: (r.chamTuanNay ?? []).filter((l: any) => l.periodId !== r.tuan.id).reduce((n: number, l: any) => n + l.conBai, 0),
  });

  check('LT3-2 (a) MỘT bài đúng MỘT khối: thi tuần trước → khối 2, không ở khối 1 dù đã quá hạn', () => {
    const aid = emMoi(4, TRUOC);
    conn.prepare(`UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ? AND skill = 'listening'`).run(t.addDays(TRUOC, 3), aid); // quá hạn từ thứ Năm
    const r = xem(NAY);
    assert(r.laTuanNay && r.chamTuanNay, 'khối 2 có ở tuần hiện tại');
    assert(!r.no.some((x: any) => x.attemptIds.includes(aid)), 'bài thi tuần trước không vào khối 1');
    const h = r.chamTuanNay.find((l: any) => l.classId === LOP && l.weekStart === TRUOC);
    assert(h && h.quaHan, 'khối 2 có hàng lớp, cờ quá hạn (web vẽ badge)');
    assert(!r.lop.some((l: any) => l.weekStart === TRUOC), 'khối 3 chỉ tuần đang xem');
  });
  check('LT3-2 (b) sang tuần thứ hai + quá hạn → khối 1; hạn riêng dời xa → khối 2', () => {
    const aid = emMoi(5, HAI);
    let r = xem(NAY);
    assert(oCua(r, aid).k1 > 0 && oCua(r, aid).k2 === 0, `khối 1: ${JSON.stringify(oCua(r, aid))}`);
    conn.prepare('UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ?').run(t.addDays(TODAY, 3), aid);
    r = xem(NAY);
    assert(oCua(r, aid).k1 === 0 && oCua(r, aid).k2 > 0, `hạn riêng → khối 2: ${JSON.stringify(oCua(r, aid))}`);
  });
  check('LT3-2 (c) lùi / tiến tuần: khối 1 không đổi, khối 2 ẩn, khối 3 theo tuần xem', () => {
    const k1 = (ws: string) => JSON.stringify(xem(ws).no.map((x: any) => [x.key, x.conBai]));
    assert(k1(NAY) === k1(TRUOC) && k1(NAY) === k1(t.addDays(NAY, 7)) && k1(NAY) === k1(HAI), 'khối 1 đổi theo tuần xem');
    const truoc = xem(TRUOC);
    assert(!truoc.laTuanNay && truoc.chamTuanNay === null, 'khối 2 chỉ ở tuần hiện tại');
    assert(truoc.lop.every((l: any) => l.weekStart === TRUOC), 'khối 3 = tuần đang xem');
  });
  check('LT3-2 (d) G-10: tổng ba khối = badge "n bài chờ chấm" ở tuần hiện tại (mỗi lớp FT)', () => {
    const tom = cls.listClassSummaries(P.mbManager, { scope: 'managed' });
    const ds = (Array.isArray(tom) ? tom : tom.classes ?? tom.rows ?? []) as any[];   // như chamDiem.tests.ts:659-661
    for (const s of ds.filter((c: any) => c.scoringMode !== 'ratio' && c.needScores !== undefined)) {
      const r = cham.lichTest(P.mbManager, week.ensurePeriod(NAY).id, null, TODAY, { classId: s.id, phamVi: 'tat-ca' });
      const tong = r.no.reduce((n: number, x: any) => n + x.conBai, 0)
        + (r.chamTuanNay ?? []).reduce((n: number, l: any) => n + l.conBai, 0) + r.lop.reduce((n: number, l: any) => n + l.conBai, 0);
      assert(tong === s.needScores, `${s.code}: ba khối ${tong} ≠ badge ${s.needScores}`);
    }
  });
```
  (Thay phép kiểm G-10 cũ `chamDiem.tests.ts:658–690` bằng phép kiểm này; giữ phần in chi tiết khi lệch của bản cũ. Mã tuần trên chuông: hàm định dạng tuần LT3-0 tìm, vd. `weekInfo(ws).code` bỏ năm.)
- [ ] `npm run build:server && npm test` → các kiểm trên đỏ; phép kiểm cũ "Nợ nhìn từ TUAN_SAU" cũng đỏ — sửa cách dựng (vd. đặt tuần thi `HAI` để bài vào khối 1).
- [ ] Viết `hangLopTuan`, `noQuaHan`, `lichTest` mới. Xanh toàn bộ. Không sửa phép kiểm hàng lớp (khối 3) — nếu đỏ là tách hàm sai.
- [ ] Commit: `feat(lt3): Lịch Test ba khối ở máy chủ — khối 1 theo hôm nay, khối 2 tuần trước + hạn riêng`.

### Task LT3-3: Máy chủ — Speaking Mock chấm chéo (T18), không tính nợ cho GVBM S / GVCN
Skill: test-driven-development

**Files:** `server/src/fasttrack/attempts.ts` (`skillCells` :399 `viec`, :407 `mine`; `ownersOf` :576–581 + hai chỗ gọi :685, :769),
`server/src/worklist/scoreDebt.ts` (:16–19 kiểu, :104–109), `server/src/worklist/mywork.ts` (:408 nhãn, :430–448), `server/src/worklist/tongQuan.ts`
(:104–110, :141–143), `server/src/worklist/metrics.ts` (:515–530), `server/src/giaoVien/hoSo.ts` (:347–366), `server/src/phanTich/giaoVien.ts`
(`napBai` :140–170, `tapChamDiem` :186–200); sửa phép kiểm cũ chỉ khi đỏ đúng vì T18 (ghi tên phép kiểm vào mô tả PR).

Luật (Rulebook PR-LT3 + §20): ô `laChamCheo(a.kind, skill)`:
- `mine = false`, `viec = false` cho **mọi người** (không ai "được phân công"); `canEdit` giữ nguyên (GVBM S, GV Speaking chấm chéo cùng chi nhánh, QL).
- `pendingOwners[skill] = CHAM_CHEO` (→ `gvNo` ghi "Chấm chéo", không "chưa phân công").
- `scoreDebtCells`: `userId: null`, thêm `chamCheo: true`. Người dùng tập này: hồ sơ GV / "của tôi" (lọc `userId === id`) tự loại; hàng "Chưa phân công"
  và "bài chưa có người chấm" **loại** `chamCheo`; chỉ số chi nhánh `bai-qua-han-nhap-diem` **vẫn đếm** (QL đôn đốc), `nguoi` = `Chấm chéo`.
- `mywork` tab "Tất cả trong phạm vi": dòng ô chấm chéo `statusLabel` = `Chấm chéo`, không bị loại vì `ownerId === p.userId`.
- Phân tích GV `tapChamDiem`: ô chấm chéo **chưa nhập** → bỏ qua (không trễ cho ai); **đã nhập** → `gv = examiner_user_id` (null — người ngoài
  hoặc trống — bỏ qua); `dung = nhapDau <= mocTreNhapDiem(han, tuan)` như cũ. `napBai` thêm `kind` (của lượt) và `examinerUserId` (của dòng điểm).
- (Q3) Lưu ô S Mock khi chưa chọn GV chấm: **khuyến nghị** máy chủ ghi `examiner_user_id = p.userId` nếu người lưu là tài khoản nhân viên
  (`saveScore` :1647–1650, chỉ khi `gv === undefined` **và** dòng chưa có examiner). Chờ chủ sản phẩm; chọn B thì bỏ gạch này.

- [ ] Kiểm đỏ (thêm vào `prLt3.tests.ts`; `P.sTeacher` = GVBM Speaking, `P.coreTeacher` = GVCN — xác nhận lớp của họ ở LT3-0; dùng lớp họ dạy):
  - (a) `skillCells(P.sTeacher, lượt mock lớp đó, …)` ô `speaking`: `mine === false && viec === false && canEdit === true`; lượt `progress` lớp thường
    ô speaking của GVBM thường: `mine` không đổi.
  - (b) em có S Mock tuần `HAI` chưa điểm (đã quá hạn): `listClassSummaries(P.sTeacher).needScores` **không** tính ô S đó; `myWork(P.sTeacher)` không có dòng
    `score:` của ô đó; `scoreDebtCells(...)` ô đó `userId === null && chamCheo === true`; hồ sơ GV của S teacher + GVCN không có ô đó trong nợ/quá hạn.
  - (c) `lichTest(P.mbManager, …)` khối 1 dòng của lượt đó: `gvNo` chứa `'Chấm chéo'`, không chứa tên GVBM S, không `'chưa phân công'`;
    `lichTest(P.sTeacher, …)` dòng đó `cuaToi === false` (nhãn web không "Chờ bạn chấm").
  - (d) Phân tích GV: GV Speaking lớp **khác** cùng chi nhánh lưu S Mock với `gvCham: { userId: chínhMình }` sau mốc trễ → `tapChamDiem` có ô đó,
    `gv === người đó`, `dung === false`; lưu với `gvCham: { ten: 'Cô Lan (ngoài)' }` → không ô nào cho ai; ô chưa nhập → GVBM S không bị trễ.
  - (e) chỉ số chi nhánh `bai-qua-han-nhap-diem` của QL vẫn đếm ô S quá hạn, `nguoi === 'Chấm chéo'`; Tổng quan "bài chưa có người chấm" không đếm nó.
- [ ] Đỏ → sửa ở nguồn (một cờ `laChamCheo`, không `if` rải theo từng màn) → xanh. `prHsm.tests.ts` HSM 7 (:243–273) phải vẫn xanh (người chấm chéo không có việc).
- [ ] Commit: `feat(lt3): T18 Speaking Mock chấm chéo — không nợ/trễ cho GVBM S, GVCN; trễ theo GV chấm`.

### Task LT3-4: Chuông "Speaking quá hạn chấm" cho GVBM Speaking + GVCN
Skill: test-driven-development

**Files:** tạo `server/src/cham/chamCheo.ts`; sửa `server/src/ops/chotVangDinhKy.ts` (gọi sau chốt vắng, bọc `try/catch` như `chuyen`); `prLt3.tests.ts`.

**Interfaces:** `export function baoChamCheoQuaHan(homNay: string): number` — trả số chuông đã ghi (mới hoặc cập nhật).
- Ô cần báo: `laChamCheo`, chưa điểm, không "-", `khoiCham(...) === 'qua-han'` (cùng luật khối 1), em đang học, lớp `active`. Đọc qua `scoreDebtCells`
  (chamCheo + overdue) hoặc `listAttempts` của Quản trị — **không** viết câu đếm mới.
- Gom theo `(classId, attemptNo, periodId)`. Người nhận: GV có phân công `speaking` lớp đó (`phanCongDangHieuLuc`) + GVCN lớp (`teacher_assignments.is_core = 1`
  đang hiệu lực; dùng hàm sẵn có nếu có — LT3-0 tìm), bỏ trùng.
- `notify({ userId, kind: 'cham_cheo_qua_han', title: 'Speaking MT{n} quá hạn chấm', body: '{mã lớp} · {W4 SEP} · {k} bài · Chấm chéo',
  entityType: 'class', entityId: classId, dedupKey: 'chamcheo:{classId}:{attemptNo}:{periodId}', duong: '/test/lich?classId={classId}&kn=speaking' })`.
  Mã tuần dạng màn hình (không năm) — dùng hàm sẵn có (`weekInfo(ws).code` bỏ năm, hoặc hàm `tuanLich`/`maTuan` của `shared/domain`).
- `ponytail:` chỉ chạy trong lượt quét thứ Hai (`chot-vang`, 00:05 + 06:05) — bài vào khối 1 giữa tuần (hạn riêng) nhận chuông thứ Hai kế.

- [ ] Kiểm đỏ: em có S Mock tuần `HAI` quá hạn ở lớp có GVBM S + GVCN → `baoChamCheoQuaHan(TODAY)` ghi đúng 2 dòng `notifications` (hai người, cùng
  `dedup_key`); gọi lại lần hai → vẫn 2 dòng; GVBM Writing của lớp không nhận; S Mock tuần `TRUOC` (khối 2) không sinh chuông; `chotVangDinhKy({ ngay: TODAY,
  chot: () => 0, chuyen: () => 0, daKhoiTao: () => true })` gọi tới hàm (đếm dòng tăng). Dọn dòng thử sau kiểm.
- [ ] Viết hàm → xanh. Commit: `feat(lt3): chuông Speaking quá hạn chấm cho GVBM Speaking và GVCN`.

### Task LT3-5: Web — ba khối, khối 1 có mục con nhẹ
Skill: `/impeccable layout` · `/impeccable clarify`

**Files:** `web/src/modules/test/lichTest/kieu.ts`, `KhoiNo.tsx`, `HangLop.tsx`, `DaiSo.tsx`, `web/src/modules/test/LichTestTab.tsx`. Đối chiếu từng trạng thái với mockup.

- [ ] `kieu.ts`: kiểu theo LT3-2 (`laTuanNay`, `chamTuanNay`, `TongQuanLich`, `LopLichTest.periodId/weekStart`).
- [ ] `DaiSo.tsx` (Q1): ba ô `grid-cols-3` cả 375 — `{Tuần này | W1 OCT} đã chấm` x/y · `Còn phải chấm` n · `Quá hạn chấm` n `· m lớp` (chữ `text-late` khi > 0).
  `OSo = 'da-cham' | 'con-phai-cham' | 'no'`. Bấm: hai ô đầu → mở khối 2 (tuần này) hoặc khối 3 (tuần khác) và cuộn tới; ô ba → mở khối 1.
- [ ] `LichTestTab.tsx`: thứ tự khối 1 → khối 2 (chỉ `laTuanNay`) → khối 3. Mỗi khối = `KhoiNhom` (`tieuDe`, `dem` = bài còn, `phu` = `n lớp`).
  Mặc định: khối 1 thu, khối 2 mở, khối 3 thu; **tuần khác** khối 3 mở (Q2), tiêu đề `Lịch Test {mã tuần}`. Khối rỗng: tiêu đề + `0`, không mũi tên, không mở
  (`KhoiNhom` thêm prop `rong` hoặc vẽ đầu tĩnh cùng lớp CSS `khoi-nhom-dau dong`). Cả ba rỗng → một `Empty` `{tuần} không có Test nào` như hôm nay.
  Khối 1 có đếm `dem` đỏ cam (`bg-late-bg text-late`) khi > 0. Bỏ nút "Chỉ quá hạn" và cờ `chiQuaHan` (khối 1 toàn quá hạn — ô trùng).
- [ ] Lối vào từ đường dẫn (`classId`, `kn` — Việc cần làm, badge, chuông): dòng khối 1 khớp → mở khối 1 + mở lưới dòng đó; không thì hàng lớp khối 2 → mở khối 2 + ép
  mở hàng; không thì khối 3 → mở khối 3 + hàng. Giữ Q14 (`dongMo` giữ dòng vừa chấm xong, "Đã chấm ✓") và hỏi trước khi thu lưới còn ô chưa lưu.
- [ ] Công tắc khung FT / Lớp thường: đếm lớp = lớp có ở **bất kỳ** khối nào; áp cho ba khối và dải số (`tongQuanKhung`).
- [ ] `KhoiNo.tsx` (khối 1, T17): tiêu đề `Test quá hạn chấm`; cột: Lớp · Đợt (`MT3 · W4 SEP`) · Kỹ năng · Còn · Hạn (`hạn 30/09 ⚠ quá hạn 8 ngày`, `<Han>` như cũ) ·
  **GV chấm** (cột giãn, `<col />` không cố định, chữ xuống dòng, không `truncate`, không `title` thay chữ; `Chấm chéo` tô `text-wait`) · nhãn · `↗` (Mở lưới đầy đủ,
  44 px, như `HangLop`) · nút `Nhập điểm` / `Thu`. Bỏ link "Mở lưới đầy đủ" trong lưới khối 1 (truyền `coLinkRieng` trên máy tính).
  **Mục con:** hàng lưới `<td colSpan>` nền `var(--hang-con-bg)`, khối trong thụt 20 px + **một vạch dọc 1 px** `var(--line-strong)` bên trái, không khung bo, không viền
  thứ hai; tiêu đề cột của lưới nhỏ (10.5–11 px). 375: thụt 8 px. Giữ `COT_THAO_TAC ≥ 110`, ba cột đầu `COT_DAU_LICH_TEST` (phép kiểm `prUxG` G4, `prHsm` :215).
- [ ] `HangLop.tsx`: thêm prop `kieuQuaHan?: 'badge'` — khối 2 vẽ `hạn 07/10` + `<Nhan tone="late">Quá hạn</Nhan>` khi `l.quaHan` (không ⚠ số ngày, không đỏ cả hàng);
  hàng tuần cũ (`l.weekStart` ≠ tuần trước) ghi Đợt `MT2 · W3 SEP`. Khối 3 giữ `<Han>` như cũ. `periodId` của lưới mở tại chỗ = `l.periodId` (không còn một `periodId` chung).
- [ ] `moLop.ts`: khoá nhớ hàng mở theo `periodId` của hàng (khối 2 và 3 không lẫn nhau).
- [ ] Commit: `feat(lt3): Lịch Test ba khối trên web, khối 1 mục con nhẹ, dải số ba ô`.

### Task LT3-6: Web — nhãn Speaking chấm chéo, khối rỗng, 375, bấm thử
Skill: `/impeccable harden` · `/impeccable adapt` · `/impeccable clarify`

- [ ] Nhãn: dòng chỉ còn ô chấm chéo cho GVBM S / GVCN → `Chờ chấm` (`cuaToi` false); không có `Chờ bạn chấm` cho S Mock ở đâu (Lịch Test, Việc cần làm, badge lớp).
- [ ] 375 (mockup): khối 1 dòng gập 3 hàng (`mã · đợt · kỹ năng` / `còn n bài · hạn … · nhãn` / `GV chấm: …`) + nút 44 px; khối 2/3 hàng gập 2 dòng; dải số 3 ô một hàng; không cuộn ngang.
- [ ] Bấm thử bằng ảnh thật **375 + 1440, sáng + tối**, vai **QL (2), Quản trị (1), GVCN (7), GVBM (9), GV Speaking** (tìm user có phân công `speaking` lớp FT): đủ 6
  trạng thái mockup (tuần này; khối 1 mở + lưới; GVBM; tuần khác; ít việc; rỗng). Demo `14/09` → dựng dữ liệu bằng cách dời tuần/hạn trên DB thử, ghi bước vào mô tả PR.
- [ ] Commit: `fix(lt3): nhãn chấm chéo, khối rỗng, 375`.

### Task LT3-7: Đo, tài liệu, rà
Skill: verification-before-completion

- [ ] `tocDoDuong.ts`: chạy đo `/cham/lich-test` (mọi vai) sau thay đổi, cập nhật trần (khối 2 thêm ~3 câu); giải thích số mới trong mô tả PR.
- [ ] `CODE_MAP.md` (`cham/chamCheo.ts`, `tests/prLt3.tests.ts`), dòng mục 11 `plan.md`. `npm run check` xanh (một lần một lúc).
- [ ] `/impeccable audit`, `/ponytail-review`, `superpowers:requesting-code-review`, mở PR (không merge). Mô tả PR: từng ID T15–T18 (tái hiện / file / phép kiểm / ảnh), phép kiểm cũ đã đổi cách dựng (tên + lý do), chú thích `ponytail:`, ảnh sổ tay `docs/so-tay/` lệch (Lịch Test).

## Nghiệm thu
1. Hôm nay thứ Năm tuần W2 OCT: MT4 thi W1 OCT chưa chấm hiện **một lần**, ở khối 2, cạnh hạn có badge `Quá hạn`; không ở khối 1; không ở khối 3.
2. Thứ Hai W3 OCT: cùng bài đó chuyển sang khối 1 `Test quá hạn chấm`, cột GV chấm chỉ tên GV còn nợ.
3. Bấm ‹ / › tuần: khối 1 y nguyên; khối 2 biến mất khi không ở tuần hiện tại; khối 3 đổi tên `Lịch Test W1 OCT`. Không có cách nào làm khối 1 rỗng ngoài nhập điểm.
4. Tổng `dem` ba khối (tuần hiện tại) = badge `n bài chờ chấm` ở tab và danh sách lớp.
5. Bài có hạn riêng dời tới tuần sau: ở khối 2 tới khi hết hạn, rồi khối 1.
6. Speaking Mock quá hạn: khối 1 ghi `Chấm chéo`; GVBM S và GVCN có chuông, **không** có số đỏ / "Chờ bạn chấm" / trễ ở Phân tích GV; GV Speaking lớp khác nhập muộn
   (có ghi GV chấm) → trễ của chính người đó ở Phân tích GV; GV chấm là người ngoài → không trễ cho ai. Lớp thường, MT0 không đổi.
7. Khối 1 mở: lưới học viên là mục con nhẹ (thụt + vạch 1 px, nền nhạt, không khung thứ hai); `↗` ở dòng lớp.
8. 375 + 1440, sáng + tối, ≥ 3 vai; chữ trên màn đúng mockup; `npm run check` xanh; phép kiểm hàng lớp (khối 3) cũ không phải sửa.

## Chồng với PR khác
| PR | Chồng | Cách xử lý |
|---|---|---|
| **PR-MTa** (đợt 4, đang chạy) | T19 đổi `skillScoreDeadline('ratio')` → thứ Tư tuần sau (`week.ts:89`) — số quá hạn lớp thường ở khối 1/2 đổi theo; T19 chặn nhập trước tuần thi (`saveScore`, `saveRegularScore`, ô khoá ở lưới) — khối 3 tuần sau không nhập được; T22 xoá trắng ô = xoá điểm (`attempts.ts saveScore` — cùng hàm LT3-3 sửa examiner mặc định); T1 MT cũ theo tuần (`lich_su`, `LUOT_TINH_NO_SQL`); đổi chữ "MT lịch sử" → "MT cũ" (dòng nhắc cuối Lịch Test) | LT3 **bắt đầu sau khi MTa merge**; LT3-0 khảo sát lại; không viết cứng hạn |
| **PR-MTb** (đợt 5) | Lưới FT (T10 ô Band ở `LuoiFT`), `HopKyNang`; LT3 chỉ đổi khung bọc lưới trong Lịch Test | Merge MTb trước; LT3 merge `origin/main`, kiểm lại mục con với lưới mới |
| **PR-MT0** (đợt 5) | `canCham.ts:228-231, 498, 556, 570` (mode/hạn MT0), nhóm `{class_id}:mt0` ở `lichTest` — LT3 chuyển phần này vào `hangLopTuan` | MT0 merge **sau** LT3, sửa trên `hangLopTuan`. Khối của MT0 đúng sẵn (dùng cờ `overdue`, hạn Chủ nhật tuần sau). T18 không áp MT0 (`laChamCheo` chỉ `mock`) — khớp MT0 D7 |
| **PR-BV** (sau MTa) | `absence.ts` (bỏ vắng → ô quay lại thành bài chờ chấm) | Không chồng file chính; khối tự đúng vì đọc `pendingDetail` |
| **PR-HK2** (đợt 6) | Chụp lại sổ tay Lịch Test | HK2 chụp sau LT3 |

## Tôi đã tự quyết (planning, 06/10)
| # | Quyết định | Lý do |
|---|---|---|
| D1 | Khối rỗng vẫn hiện tiêu đề + `0`, không mở được; cả ba rỗng → một thẻ `{tuần} không có Test nào` | T16 "khối 1 luôn đi cùng màn"; vị trí khối không nhảy |
| D2 | Xem tuần khác: khối 3 có thể lặp bài đang ở khối 1 (xem lại); dải số tuần khác chỉ tính khối 3 + khối 1; badge tổng chỉ đúng ở tuần hiện tại | Khối 3 là lịch thi, không phải lịch chấm (T15) |
| D3 | Chuông T18 gửi ở lượt quét thứ Hai, lúc S Mock vào khối 1; một chuông / lớp / MT / tuần / người | Trùng mốc khối 1; không thêm hàm định kỳ mới |
| D4 | QL vẫn thấy S Mock quá hạn trong chỉ số "bài quá hạn nhập điểm" của chi nhánh (người giữ việc `Chấm chéo`), không vào hàng "Chưa phân công" | T18 chỉ miễn cho GVBM S + GVCN; QL cần đôn đốc |
| D5 | T18 chỉ `kind = 'mock'`; MT0 Speaking giữ người chấm = GVBM lớp thường (MT0 D7) | Đặc tả ghi "Speaking Mock" |
| D6 | Khối 2 quá hạn: badge `Quá hạn` không kèm số ngày; khối 1 giữ `⚠ quá hạn n ngày` | T15 "badge cạnh hạn"; khối 1 cần mức độ trễ |
| D7 | Bỏ lọc "Chỉ quá hạn" của khối Nợ cũ và ô "Quá hạn" ở dải số | Khối 1 toàn bài quá hạn — trùng |
| D8 | Giữ tên trường `no` / `DongNo` ở API (khối 1) | Đỡ đổi tên ở ~10 phép kiểm; nghĩa ghi ở chú thích |

## Câu cần chủ sản phẩm quyết (gộp, có khuyến nghị)
1. **Dải số đầu Lịch Test** (Rulebook chờ (a)). **A — khuyến nghị (theo plan.md mục 4 (5)):** 3 ô `Tuần này đã chấm 26/62` (khối 2 + 3) · `Còn phải chấm 36` (khối 2 + 3) ·
   `Quá hạn chấm 7 · 3 lớp` (khối 1); bỏ ô "Quá hạn" cũ vì trùng. B: 3 ô theo từng khối (`Quá hạn chấm` · `Chấm tuần này x/y` · `Lịch tuần này x/y`). C: giữ 4 ô, thêm `Quá hạn tuần này` (bài khối 2 có badge).
2. **Xem tuần khác** (Rulebook chờ (b)). **Khuyến nghị:** tiêu đề `Lịch Test W1 OCT` và khối này **mở sẵn** (khối 2 đã ẩn, đây là thứ người dùng muốn xem). Khác: giữ thu gọn như ở tuần này.
3. **Speaking chấm chéo** (Rulebook chờ (c)): hiểu đúng như Rulebook — quá hạn chỉ báo, không tính cho GVBM S / GVCN; trễ tính cho người ghi ở "GV chấm Speaking". Khi lưu ô S Mock mà
   **chưa chọn GV chấm**: **A — khuyến nghị:** hệ thống tự ghi GV chấm = chính người lưu (tài khoản) → trễ tính cho người đó (không ai "lách" bằng cách bỏ trống). B: để trống → không tính trễ cho ai.
4. **Khối 2, lớp đã chấm xong:** **A — khuyến nghị:** vẫn hiện tới hết tuần, nhãn `Đã chấm ✓`, xếp cuối (thấy tiến độ cả tuần). B: ẩn ngay khi chấm xong.

## Prompt cho session code (dán nguyên khối) — Opus 5.5 · XHigh (B: Opus 5.5 · High). Không dùng Fable.
```
/ponytail lite
Làm PR-LT3 theo docs/superpowers/plans/2026-10-06-pr-lt3-lich-test-ba-khoi.md (LT3-0 → LT3-7; prompt chung plan.md mục 9.0; đọc mục
"Chủ sản phẩm chốt" ở đầu file trước — đè lên phần dưới). Mockup đã duyệt: thiet-ke/mockup-lich-test-ba-khoi-2026-10-06.html — chữ trên màn
ĐÚNG mockup, ngắn, không thêm câu giải thích. Nhánh pr-lt3-lich-test-ba-khoi từ origin/main SAU khi PR-MTa merge (MTb merge trước nếu kịp).
Đầu phiên nói model đang chạy; không phải Opus 5.5 thì dừng báo. Subagent cùng model, không Fable.
LT3-0 khảo sát lại sau MTa trước mọi việc. Phép kiểm đỏ trước (server/src/tests/prLt3.tests.ts, gọi cuối run.ts): một bài đúng một khối;
lùi tuần không đổi khối 1; tổng ba khối = badge; Speaking Mock quá hạn không tính nợ/trễ cho GVBM S, GVCN; GV chấm chéo nhập muộn bị tính trễ.
Không đổi luật hạn, không đường ghi điểm mới; phép kiểm cũ chỉ đổi cách dựng, giữ ý (ghi tên vào mô tả PR); hàng lớp khối 3 phải giữ kết quả cũ.
Impeccable: LT3-5 /impeccable layout + clarify; LT3-6 /impeccable harden + adapt (375); cuối /impeccable audit. Bấm thử 375/1440 sáng/tối,
QL, Quản trị, GVCN, GVBM, GV Speaking. Merge sau MTb, trước MT0 (MT0 merge origin/main sau). Mở PR vào main, KHÔNG merge.
```

## Giả định
- G1: `listAttempts(...).pendingDetail[].overdue` = `quaHanNhapDiem` của chính ô (như :674, :758) — sau MTa vẫn vậy (LT3-0 kiểm).
- G2: Badge `n bài chờ chấm` (`listClassSummaries.needScores`) đếm mọi ô chờ chấm đã tới tuần thi theo phạm vi — bằng khối 1 + 2 + 3 ở tuần hiện tại (G-10 cũ đã giữ "lop + no = badge").
- G3: `examiner_user_id` của dòng điểm S là người "GV chấm Speaking" (T39); Phân tích GV dùng nó + `nhap_dau_ngay` (không dùng `entered_by` — bị ghi đè mỗi lần sửa).
- G4: GVCN lớp = phân công `is_core = 1` đang hiệu lực (như `isCoreTeacherOf`).
- G5: Tài khoản thử: `P.sTeacher` là GVBM Speaking lớp FT trong seed (dùng ở `prMt.tests.ts:493`), `P.coreTeacher` là GVCN — LT3-0 xác nhận lớp.

## Kết quả LT3-0
(session code điền)
