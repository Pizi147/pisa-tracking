# PR-GVa · Giao việc: dữ liệu + form — Kế hoạch (03/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chặn gửi trùng bằng **mã idempotency mỗi lần mở form** thay cho chặn trùng 10 giây theo tiêu đề (F01 = D13). Mở form Giao việc thì lấy đúng chi nhánh, nhóm và việc cha theo ngữ cảnh lúc mở (F03). Không bao giờ lưu việc giao GV thiếu kỳ: web khoá nút gửi, máy chủ kiểm và tự xác định kỳ (F04).

**Architecture:** Migrate mới `server/src/migrate/prGva.ts` chỉ **thêm**: cột `idempotency_key` (NULL được) cho `tasks`, `case_interventions`, `case_followups`, kèm unique index một phần theo **(người tạo, khoá)**. Máy chủ: hàm chung `theoKhoaGui` trong `server/src/db.ts` thay `vuaGhi` (xoá `vuaGhi` khi không còn ai gọi). Luật thuần ở `shared/domain/khoaGui.ts` (chuẩn hoá khoá) và `shared/domain/congViec.ts` (giá trị đầu form, trạng thái kỳ, được gửi hay chưa), mỗi luật có phép kiểm. Web: `CreateTask` mount lại theo `key` mỗi lần mở, nên state và khoá được tạo mới mỗi lần mở form.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` chạy qua `run.ts`; `npm run check` = build + test + typecheck.

**Spec:** báo cáo rà #172–#176, các mục F01, F03, F04 (§8.4: tách nghiệp vụ khỏi UX). Quyết định 03/10 "F01 = D13" ở `2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md` (dòng 8). Prompt PR-GVa ở cùng file (dòng 76–). Tiêu chí nghiệm thu chép ở mục **Nghiệm thu** cuối file.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro, bảng màu và bố cục form Giao việc. Thời gian trên màn ưu tiên **mã tuần** `W2 OCT`.
- Luật S3: không dùng nút "Huỷ" trần. Form chưa sửa có nút "Đóng"; đã sửa thì "Huỷ thay đổi" (giữ `chan.huy` của `KhungPanel`). Nút "Thử lại" là nút phụ.
- Chữ trên màn bằng tiếng Việt, nói rõ phải làm gì tiếp.
- Không bao giờ bớt kiểm tra dữ liệu nhập, chống mất dữ liệu (group, note, watcher, unitReportId, caseIds không bao giờ bị nuốt) và phân quyền (`require_`, `caseAccess` giữ nguyên thứ tự: **kiểm quyền trước khi tra khoá**, để khoá người khác không đọc được việc ngoài phạm vi).
- Migrate an toàn trên Turso đang chạy: **chỉ thêm** (ADD COLUMN NULL, CREATE UNIQUE INDEX IF NOT EXISTS … WHERE idempotency_key IS NOT NULL). Không đổi, không xoá dòng nào. Chạy lặp được. Index chỉ phủ dòng có khoá nên dòng cũ (NULL) không thể vi phạm.
- Mỗi task viết phép kiểm trước, chạy cho đỏ trên DB test, rồi mới sửa đến khi xanh. Không làm phép khớp chuỗi nguồn khi kiểm được hành vi.
- Hàm mới ở `shared/domain/*` phải re-export qua `shared/domain/index.ts`. File kiểm mới `server/src/tests/prGva.tests.ts` phải được import và gọi ở cuối `server/src/tests/run.ts` (sau PR-PH, dòng ~8870).
- Thêm file mới thì cập nhật `CODE_MAP.md` trong cùng commit (`migrate/prGva.ts`, `shared/domain/khoaGui.ts`, `tests/prGva.tests.ts`).
- Xong PR: đánh dấu `[x]`, thêm một dòng ở mục 14 `plan.md`, mở PR (không tự merge). Mô tả PR báo từng ID F01/F03/F04 theo các mục: đã tái hiện, file sửa, phép kiểm bảo vệ, ảnh, giới hạn còn lại. Liệt kê mọi chú thích `ponytail:`.
- Bấm thử 375 và 1440, sáng và tối, với 3 vai: toàn hệ thống, QL chi nhánh, GV.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `anthropic-skills:subagent-driven-development` (cách chạy kế hoạch). Gõ `/ponytail lite` vì PR có sửa form |
| Mỗi task | `anthropic-skills:test-driven-development`: kiểm đỏ, sửa, kiểm xanh |
| Tái hiện F01 / F03 / F04 (GVa-1, GVa-3, GVa-4 bước 1) | `anthropic-skills:systematic-debugging`: tái hiện bằng phép kiểm, sửa theo nguyên nhân |
| GVa-4 (form) | `/impeccable harden` cho form Giao việc (trạng thái đang tải, lỗi, rỗng, bấm đúp) · `/impeccable clarify` cho chữ lỗi kỳ và nút "Thử lại" |
| Trước khi báo xong mỗi task | `anthropic-skills:verification-before-completion`: chạy `npm run check` và đọc kết quả |
| Cuối PR | `/impeccable audit`, rồi `/ponytail-review` (liệt kê chú thích `ponytail:`), rồi `anthropic-skills:requesting-code-review`, rồi `anthropic-skills:finishing-a-development-branch` (mở PR, không merge) |

---

### Task GVa-1: Migrate + khoá gửi ở máy chủ (F01 = D13)
Skill: test-driven-development · systematic-debugging (tái hiện F01) · verification-before-completion.

**Files:**
- Create: `server/src/migrate/prGva.ts`, `shared/domain/khoaGui.ts`, `server/src/tests/prGva.tests.ts`
- Modify: `server/src/migrate.ts` (import và gọi sau `migratePrPb2b`, ~dòng 495); `server/src/schema.sql` (cột trong `CREATE TABLE tasks` ~1384, `case_interventions` ~1000, `case_followups` ~1126, cùng 3 index); `server/src/db.ts:313-323` (thay `vuaGhi` bằng `theoKhoaGui`); `server/src/worklist/mgmttasks.ts:381-474`; `server/src/worklist/meeting.ts:594-660`; `server/src/cases/cases.ts:694…819` (PA), `:1265` (followup); `server/src/routes/index.ts:1905-` (truyền `idempotencyKey`); `shared/domain/index.ts`; `server/src/tests/run.ts`; `CODE_MAP.md`.

**Interfaces:**
```ts
// shared/domain/khoaGui.ts
export const KHOA_GUI_TOI_DA = 100;
/** Khoá hợp lệ: 8–100 ký tự [A-Za-z0-9:_-]. Không hợp lệ hoặc trống → null (máy chủ coi như không có khoá; không tin chuỗi lạ). */
export function chuanKhoaGui(x: unknown): string | null;
/** Mã mới cho MỘT lần mở form. `tien` = tên form, ví dụ 'mgmt', 'task', 'pa', 'fu'. */
export function moiKhoaGui(tien: string): string;
// server/src/db.ts
/** Dòng `bang` của `nguoiCot = nguoiId` có khoá `khoa` → id, không có → null. `bang`/`nguoiCot` là hằng trong mã. */
export function theoKhoaGui(bang: 'tasks' | 'case_interventions' | 'case_followups', nguoiCot: string, nguoiId: number, khoa: string | null): number | null;
/** Lỗi do unique index idempotency (gửi đồng thời) — để nơi gọi đọc lại dòng đã có. */
export function laTrungKhoa(e: unknown): boolean;
```

- [x] **Bước 1: Viết phép kiểm đỏ** ở `server/src/tests/prGva.tests.ts`. Chép khung HTTP (`createApp().listen(0)`, `goi`, `taoTaiKhoan`, `dangNhap`) từ `anToan.tests.ts:128-156`. Dùng IP riêng `203.0.113.17x` và email bắt đầu bằng `gva`. Cuối file xoá `auth_attempts` của IP đó và đóng `may`.
```ts
import type { AnToanTestKit } from './anToan.tests.ts';
export async function runPrGvaTests(t: AnToanTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const mg: any = await import('../worklist/mgmttasks.ts');
  const mt: any = await import('../worklist/meeting.ts');
  const kg: any = await import('../../../shared/domain/khoaGui.ts');
  const dem = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as any).n as number;

  check('GVa-1 · chuanKhoaGui: trống/ngắn/ký tự lạ → null; hợp lệ giữ nguyên', () => {
    assert(kg.chuanKhoaGui('') === null && kg.chuanKhoaGui('abc') === null && kg.chuanKhoaGui('x'.repeat(101)) === null, 'khoá xấu phải null');
    assert(kg.chuanKhoaGui("mgmt-1'; DROP") === null, 'ký tự lạ phải null');
    assert(kg.chuanKhoaGui(' mgmt-171-abc123 ') === 'mgmt-171-abc123', 'trim');
    assert(kg.moiKhoaGui('mgmt') !== kg.moiKhoaGui('mgmt'), 'mỗi lần mở một mã');
  });

  check('GVa-1 · F01 tái hiện: hai việc khác group/note/watcher cùng tiêu đề trong 10 giây là HAI việc, không mất dữ liệu', () => {
    const goc = { title: 'GVa trùng tên', branchId: 1, assigneeUserId: null, due: null, parentTaskId: null };
    const a = mg.createMgmtTask(P.admin, { ...goc, group: 'curriculum', note: 'A', idempotencyKey: 'gva-khac-0001' });
    const b = mg.createMgmtTask(P.admin, { ...goc, group: 'operations', note: 'B', watcherUserId: P.qlMB.userId, idempotencyKey: 'gva-khac-0002' });
    assert(a.id !== b.id, 'khác khoá phải là hai việc');
    const rb = conn.prepare('SELECT group_key, note, watcher_user_id FROM tasks WHERE id = ?').get(b.id) as any;
    assert(rb.group_key === 'operations' && rb.note === 'B' && rb.watcher_user_id === P.qlMB.userId, 'group/note/watcher của việc thứ hai không được mất');
  });

  check('GVa-1 · cùng khoá gửi lại → cùng dòng; liên kết Case + audit đúng một lần', () => {
    const caseId = (conn.prepare("SELECT id FROM sos_cases ORDER BY id LIMIT 1").get() as any).id;
    const v = { title: 'GVa retry', group: 'curriculum', branchId: null, caseIds: [caseId], idempotencyKey: 'gva-retry-0001' };
    const a = mg.createMgmtTask(P.admin, v);
    const b = mg.createMgmtTask(P.admin, v);
    assert(a.id === b.id, 'cùng khoá phải trả cùng việc');
    assert(dem('SELECT COUNT(*) n FROM task_case_links WHERE task_id = ?', a.id) === 1, 'liên kết Case một lần');
    assert(dem("SELECT COUNT(*) n FROM audit_log WHERE action = 'mgmt_task.create' AND entity_id = ?", a.id) === 1, 'audit một lần');
  });

  check('GVa-1 · khoá gắn người tạo: người khác gửi đúng khoá đó → việc MỚI của họ, không đọc được việc người kia', () => {
    const a = mg.createMgmtTask(P.admin, { title: 'GVa của admin', group: 'curriculum', branchId: 1, idempotencyKey: 'gva-nguoi-0001' });
    const b = mg.createMgmtTask(P.qlMB, { title: 'GVa của QL', group: 'curriculum', branchId: 1, idempotencyKey: 'gva-nguoi-0001' });
    assert(a.id !== b.id, 'khoá theo người tạo');
  });

  check('GVa-1 · /tasks (teacher_task): cùng khoá → một việc, PA toả ra một lần; khác khoá cùng tiêu đề → hai việc', () => {
    const lop = (conn.prepare("SELECT id FROM classes WHERE status = 'active' ORDER BY id LIMIT 1").get() as any).id;
    const v = { kind: 'teacher_task', title: 'GVa giao GV', classId: lop, topic: 'L', idempotencyKey: 'gva-task-0001' };
    const a = mt.createTask(P.admin, v); const b = mt.createTask(P.admin, v);
    assert(a.id === b.id, 'cùng khoá một việc');
    const pa = dem('SELECT COUNT(*) n FROM case_interventions WHERE source_task_id = ?', a.id);
    mt.createTask(P.admin, v);
    assert(dem('SELECT COUNT(*) n FROM case_interventions WHERE source_task_id = ?', a.id) === pa, 'PA không nhân đôi');
    const c = mt.createTask(P.admin, { ...v, idempotencyKey: 'gva-task-0002' });
    assert(c.id !== a.id, 'khác khoá là hai việc');
  });

  check('GVa-1 · PA và followup: cùng khoá một dòng; khác khoá cùng mô tả hai dòng', () => { /* gọi caseSvc.recordIntervention / recordFollowUp như trên */ });

  check('GVa-1 · migratePrGva trên libsql trống-cột: thêm cột + index, chạy lần 2 không báo gì, dòng cũ giữ nguyên; schema.sql có đủ', () => {
    /* mẫu prSos.tests.ts:88-100 — tạo DB nhớ có bảng tasks/case_interventions/case_followups KHÔNG có cột, chèn 1 dòng, chạy 2 lần */
  });

  await checkAsync('GVa-1 · gửi đồng thời cùng khoá (Promise.all hai POST /api/mgmt-tasks) → hai phản hồi 200 cùng id, một dòng', async () => {
    const tk = taoTaiKhoanQl('gva.dongthoi');           // QL chi nhánh MB: role 'manager', branches ['MB']
    const ck = (await dangNhap(tk, '203.0.113.171')).setCookie!.split(';')[0];
    const body = { title: 'GVa đồng thời', group: 'curriculum', branchId: 1, idempotencyKey: 'gva-dong-0001' };
    const [r1, r2] = await Promise.all([goi('POST', '/mgmt-tasks', { body, cookie: ck }), goi('POST', '/mgmt-tasks', { body, cookie: ck })]);
    assert(r1.status === 200 && r2.status === 200 && r1.json.id === r2.json.id, `cùng id: ${r1.status}/${r2.status}`);
    assert(dem("SELECT COUNT(*) n FROM tasks WHERE idempotency_key = 'gva-dong-0001'") === 1, 'một dòng');
  });
  /* Viết thêm một phép đồng thời tương tự cho POST /tasks. */
}
```
Đăng ký ở cuối `run.ts`:
```ts
// ==================================================================== PR-GVa (giao việc: khoá gửi, chi nhánh form, kỳ)
const { runPrGvaTests } = await import('./prGva.tests.ts');
await runPrGvaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P });
```
Dùng tên vai thật trong `P` (`run.ts:216`); nếu không có `qlMB` thì lấy vai QL chi nhánh có sẵn ở đó.

- [x] **Bước 2: Chạy `npm test`.** Phải đỏ: không có mô-đun `khoaGui`, phép "hai việc khác group" trả cùng id (đây là tái hiện F01), migrate chưa có.

- [x] **Bước 3: Migrate** `server/src/migrate/prGva.ts`:
```ts
/** PR-GVa (F01 = D13): khoá gửi mỗi lần mở form. CHỈ THÊM — không đổi dòng nào, an toàn trên Turso đang chạy. Chạy lặp được. */
const BANG: [bang: string, nguoi: string][] = [['tasks', 'created_by'], ['case_interventions', 'recorded_by'], ['case_followups', 'observer_user_id']];
export function migratePrGva(conn: any, applied: string[]) {
  const coCot = (b: string, c: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).some((x) => x.name === c);
  for (const [b, nguoi] of BANG) {
    if (!coCot(b, 'idempotency_key')) { conn.exec(`ALTER TABLE ${b} ADD COLUMN idempotency_key TEXT`); applied.push(`PR-GVa: cột ${b}.idempotency_key`); }
    conn.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_${b}_khoa_gui ON ${b}(${nguoi}, idempotency_key) WHERE idempotency_key IS NOT NULL`);
  }
}
```
Gọi trong `migrate.ts` sau `migratePrPb2b(conn, applied);`: `/* PR-GVa: khoá gửi (chỉ thêm). */ migratePrGva(conn, applied);`. Ở `schema.sql`, thêm `idempotency_key TEXT,  -- PR-GVa: một mã cho mỗi lần mở form` vào cả 3 bảng, và 3 câu `CREATE UNIQUE INDEX … WHERE idempotency_key IS NOT NULL` ngay sau mỗi bảng (mẫu ở `schema.sql:448`). Kiểm lại tên cột người ghi (`recorded_by`, `observer_user_id`) bằng cách đọc `schema.sql:1000-1140` trước khi viết.

- [x] **Bước 4: `db.ts`.** Thay `vuaGhi` (`db.ts:313-323`) bằng:
```ts
export function theoKhoaGui(bang: 'tasks' | 'case_interventions' | 'case_followups', nguoiCot: string, nguoiId: number, khoa: string | null): number | null {
  if (!khoa) return null;
  return (db().prepare(`SELECT id FROM ${bang} WHERE ${nguoiCot} = ? AND idempotency_key = ?`).get(nguoiId, khoa) as any)?.id ?? null;
}
export const laTrungKhoa = (e: unknown) => /UNIQUE constraint failed: \w+\.\w+, \w+\.idempotency_key/i.test(String((e as any)?.message ?? e));
```
Chạy `grep -rn "vuaGhi" server/src`. Nơi gọi chỉ có `mgmttasks.ts`, `meeting.ts` và `cases.ts:819,1265`; sửa hết rồi xoá `vuaGhi`.

- [x] **Bước 5: `createMgmtTask`** (`mgmttasks.ts`). Thêm `idempotencyKey?: string | null` vào kiểu input (dòng 381). Mọi kiểm quyền, kiểm Case và kiểm báo cáo đơn vị (đến dòng 446) giữ nguyên **trước**. Thay khối `vuaGhi` ở dòng 448-451 bằng:
```ts
const khoa = chuanKhoaGui(input.idempotencyKey);
const taoMoi = () => tx(() => {
  const cu = theoKhoaGui('tasks', 'created_by', p.userId, khoa);
  if (cu) return mgmtTaskDetail(p, cu);
  /* … INSERT như cũ, thêm cột idempotency_key = khoa … links … audit … */
  return mgmtTaskDetail(p, id);
});
try { return taoMoi(); }
catch (e) { const cu = laTrungKhoa(e) ? theoKhoaGui('tasks', 'created_by', p.userId, khoa) : null; if (cu) return mgmtTaskDetail(p, cu); throw e; }
```
Ở route `/mgmt-tasks` (`routes/index.ts:1905`), thêm `idempotencyKey: b.idempotencyKey`.

- [x] **Bước 6: `createTask`** (`meeting.ts:638-660`). Làm theo cùng mẫu: `theoKhoaGui('tasks','created_by',p.userId,khoa)` trả `SELECT * FROM tasks WHERE id = ?`. INSERT thêm `idempotency_key`. Bọc try/catch `laTrungKhoa`. Route `/tasks` đã truyền nguyên `req.body`.

- [x] **Bước 7: PA và followup** (`cases.ts:819`, `:1265`). Đổi điều kiện `vuaGhi(...)` thành `theoKhoaGui('case_interventions','recorded_by',p.userId,khoa)` (followup dùng `case_followups` và `observer_user_id`). Giữ ngoại lệ `!input.backfill && !input.thayThe` của PA. INSERT thêm cột. Bọc try/catch `laTrungKhoa`, rồi trả `caseDetail(p, caseId)`.

- [x] **Bước 8:** `npm run check` phải xanh. Cập nhật `CODE_MAP.md`.

- [x] **Bước 9: Commit** `PR-GVa-1: khoá gửi mỗi lần mở form thay chặn trùng 10 giây (F01 = D13) + migrate chỉ thêm`.

### Task GVa-2: Web gửi khoá, mỗi lần mở form một mã
Skill: test-driven-development · verification-before-completion.

**Files:**
- Modify: `web/src/modules/worklist/MgmtTasksPage.tsx` (CreateTask ~622-692); `web/src/modules/cases/ThaoTacCase.tsx:73` (PA); nơi gửi followup (tìm bằng `grep -rn "followups" web/src`; không có nơi gọi thì ghi vào mô tả PR); `web/src/modules/students/IntakePanel.tsx:25` (có thể dùng `moiKhoaGui('intake')`, không bắt buộc).

**Interfaces:** `moiKhoaGui` từ `@shared/domain` (dùng đúng đường import mà web đang dùng cho `shared/domain`).

- [x] **Bước 1: Phép kiểm đỏ** trong `prGva.tests.ts`. Đây là quét nguồn, chỉ dùng vì web chưa có trình chạy React test. Mỗi `api.post('/mgmt-tasks'`, `api.post('/tasks'`, `` api.post(`/cases/${caseId}/interventions` `` trong `web/src` phải gửi `idempotencyKey`. Khoá phải tạo bằng `useRef(moiKhoaGui(` hoặc `useMemo(() => moiKhoaGui(`, không sinh trong hàm `tao`/`luu` (sinh ở đó thì bấm lại sau lỗi mạng ra mã mới, nên lại thành hai việc).
- [x] **Bước 2:** Chạy kiểm, phải đỏ.
- [x] **Bước 3:** Trong `CreateTask`: `const khoa = useRef(moiKhoaGui('cv'));`. Gửi `idempotencyKey: khoa.current` trong **cả hai** nhánh POST (dòng 671 và 677). **Không** đổi khoá khi lỗi: thử lại giữ mã cũ nên máy chủ trả bản đã có. Mã mới chỉ sinh khi form mở lại (GVa-4 mount lại theo `key`). Trong `ThaoTacCase` làm như vậy cho PA.
- [x] **Bước 4:** `npm run check` phải xanh. **Commit** `PR-GVa-2: form Giao việc / PA gửi khoá mỗi lần mở`.

### Task GVa-3: Máy chủ không lưu việc giao GV thiếu kỳ (F04 phía máy chủ)
Skill: test-driven-development · systematic-debugging (tái hiện F04) · verification-before-completion.

**Files:** `server/src/worklist/meeting.ts:594-660`; `server/src/tests/prGva.tests.ts`.

**Luật (một luật chung với web):** kỳ của việc giao GV là tuần **neo** của `/ref/period-window` khi không gửi `anchorId`, tức `mondayOf(demoToday())` (`week.ts:194`). Máy chủ:
- Gửi `periodId`: phải là số nguyên dương **và** có trong `report_periods` (`periodById`). Sai thì báo 400 "Kỳ không hợp lệ — tải lại trang rồi giao lại."
- Không gửi `periodId` mà `kind = 'teacher_task'`: dùng `ensurePeriod(demoToday()).id`. Đây đúng là việc web làm qua `resolveWeek(neo.weekStart)`.
- Mọi kiểm tra trên chạy **trước** `tx`. Lỗi thì không có task, Case hay PA nào được tạo.
- `branch_ops` giữ `period_id` như cũ (việc Vận hành không theo kỳ).

- [x] **Bước 1: Phép kiểm đỏ:**
```ts
check('GVa-3 · F04 tái hiện: teacher_task không gửi periodId → vẫn có kỳ = tuần hiện tại, hiện trong listTasks tuần đó', () => {
  const lop = (conn.prepare("SELECT id FROM classes WHERE status = 'active' ORDER BY id LIMIT 1").get() as any).id;
  const r = mt.createTask(P.admin, { kind: 'teacher_task', title: 'GVa thiếu kỳ', classId: lop, topic: 'R', idempotencyKey: 'gva-ky-00001' });
  const ky = (await import('../platform/week.ts')).ensurePeriod(TODAY).id;   // đưa import lên đầu hàm
  assert(r.period_id === ky, `period_id phải là ${ky}, đang ${r.period_id}`);
  assert(mt.listTasks(P.admin, { periodId: ky }).rows.some((x: any) => x.id === r.id), 'phải hiện ở danh sách tuần');
});
check('GVa-3 · periodId không tồn tại → 400, KHÔNG có task / Case / PA nào mới', () => {
  const truoc = [dem('SELECT COUNT(*) n FROM tasks'), dem('SELECT COUNT(*) n FROM sos_cases'), dem('SELECT COUNT(*) n FROM case_interventions')];
  assertThrows(() => mt.createTask(P.admin, { kind: 'teacher_task', title: 'GVa kỳ rác', classId: lop, topic: 'R', periodId: 999999, idempotencyKey: 'gva-ky-00002' }), /Kỳ không hợp lệ/, '400');
  const sau = [dem('SELECT COUNT(*) n FROM tasks'), dem('SELECT COUNT(*) n FROM sos_cases'), dem('SELECT COUNT(*) n FROM case_interventions')];
  assert(JSON.stringify(truoc) === JSON.stringify(sau), 'không tạo dở');
});
check('GVa-3 · periodId hợp lệ giữ nguyên; gửi lại cùng khoá không nhân đôi', () => { /* … */ });
```
Đọc `listTasks` (`meeting.ts:~420-490`) để biết kiểu trả về thật (`rows` hay mảng), rồi sửa phép kiểm cho khớp.
- [x] **Bước 2:** Chạy, phải đỏ (`period_id` đang NULL).
- [x] **Bước 3: Sửa.** Ngay sau khối kiểm `dueDate` (`meeting.ts:~633`), thêm:
```ts
let periodId: number | null = null;
if (input.periodId != null && input.periodId !== '') {
  const n = Number(input.periodId);
  if (!Number.isSafeInteger(n) || n <= 0 || !periodById(n)) throw badRequest('Kỳ không hợp lệ — tải lại trang rồi giao lại.');
  periodId = n;
} else if (kind === 'teacher_task') {
  periodId = ensurePeriod(demoToday()).id;   // cùng luật tuần neo của /ref/period-window
}
```
Ở INSERT, đổi `input.periodId ?? null` thành `periodId`. Kiểm lại `periodById` có ném lỗi khi không thấy không; nếu có thì bắt lỗi rồi báo 400 như trên.
- [x] **Bước 4:** `npm run check` phải xanh. **Commit** `PR-GVa-3: máy chủ không lưu việc giao GV thiếu kỳ (F04)`.

### Task GVa-4: Form Giao việc mở theo ngữ cảnh (F03) + khoá gửi khi chưa có kỳ (F04 web)
Skill: `/ponytail lite` · test-driven-development · systematic-debugging (tái hiện F03) · `/impeccable harden` (form) · `/impeccable clarify` (chữ lỗi, Thử lại) · verification-before-completion.

**Files:** `shared/domain/congViec.ts` (thêm luật), `shared/domain/index.ts`, `web/src/modules/worklist/MgmtTasksPage.tsx` (CreateTask 622-760, nơi gọi 268 và 418), `prGva.tests.ts`.

**Interfaces:**
```ts
// shared/domain/congViec.ts
export type NguCanhMoForm = { branchId: number | null; parent?: { branchId?: number | null; group?: string | null; due?: string | null } | null; defaultGroup?: string | null };
/** Giá trị đầu của form Giao việc — tính MỘT lần lúc mở. Việc cha thắng bộ lọc; bộ lọc "Tất cả" → ''. */
export function giaTriDauGiaoViec(c: NguCanhMoForm, homNay: string): { branch: string; group: string; due: string };
export type TrangThaiKy = { loai: 'dang-tai' } | { loai: 'loi' } | { loai: 'khong-neo' } | { loai: 'co'; id: number | null; weekStart: string; code: string };
export function trangThaiKyGiao(s: { loading: boolean; error: unknown; data: { id: number | null; weekStart: string; code?: string; isAnchor: boolean }[] | null }): TrangThaiKy;
/** Nút Giao chỉ bật khi kỳ đã rõ ('co') và không đang lưu. */
export function duocGiao(ky: TrangThaiKy, busy: boolean): boolean;
```

- [x] **Bước 1: Phép kiểm đỏ** (luật thuần):
```ts
const cv: any = await import('../../../shared/domain/congViec.ts');
check('GVa-4 · giaTriDauGiaoViec: "Tất cả" → rỗng; A → A; việc cha thắng bộ lọc; nhóm mặc định', () => {
  assert(cv.giaTriDauGiaoViec({ branchId: null }, '2026-10-03').branch === '', 'tất cả');
  assert(cv.giaTriDauGiaoViec({ branchId: 2 }, '2026-10-03').branch === '2', 'A');
  assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { branchId: 3, group: 'operations' } }, '2026-10-03').branch === '3', 'cha thắng');
  assert(cv.giaTriDauGiaoViec({ branchId: 2, defaultGroup: 'hr' }, '2026-10-03').group === 'hr', 'nhóm');
});
check('GVa-4 · trangThaiKyGiao + duocGiao: đang tải / lỗi 503 / không neo → không cho giao; neo id null vẫn cho (sẽ resolve)', () => {
  assert(cv.trangThaiKyGiao({ loading: true, error: null, data: null }).loai === 'dang-tai', 'tải');
  assert(cv.trangThaiKyGiao({ loading: false, error: { status: 503 }, data: null }).loai === 'loi', 'lỗi');
  assert(cv.trangThaiKyGiao({ loading: false, error: null, data: [{ id: 1, weekStart: '2026-09-28', isAnchor: false }] }).loai === 'khong-neo', 'không neo');
  const k = cv.trangThaiKyGiao({ loading: false, error: null, data: [{ id: null, weekStart: '2026-09-28', code: 'W5 SEP', isAnchor: true }] });
  assert(k.loai === 'co' && cv.duocGiao(k, false) && !cv.duocGiao(k, true), 'neo không id vẫn giao, busy thì không');
});
```
Thêm một phép quét nguồn (bất đắc dĩ): `MgmtTasksPage.tsx` không còn dòng `useState(String(parent?.branchId ?? branchId` và `<CreateTask` có `key=`.
- [x] **Bước 2:** Chạy, phải đỏ. Tái hiện F03 trên trình duyệt: lọc "Tất cả", mở rồi đóng form, đổi lọc sang A, mở lại, tạo việc. Việc lưu với `branch_id` NULL. Ghi lại vào mô tả PR.
- [x] **Bước 3: Luật thuần.** Viết 3 hàm trong `congViec.ts`. `due`: lấy `addDaysIso(parent.due, -1)` khi kết quả ≥ `homNay`, nếu không thì `''` (khớp chú thích dòng 645-648 "hạn cha đã là quá khứ thì để trống"). Re-export ở `index.ts`.
- [x] **Bước 4: Mount lại khi mở (F03).** Tách `CreateTask` thành vỏ và ruột:
```tsx
function CreateTask(props: CreateTaskProps) {
  const lan = useRef(0); const moTruoc = useRef(false);
  if (props.open && !moTruoc.current) lan.current += 1;   // đóng → mở: một lần mở mới
  moTruoc.current = props.open;
  return props.open ? <CreateTaskForm key={lan.current} {...props} /> : null;
}
```
`CreateTaskForm` là thân hiện tại. Bỏ `if (!open) return null`. State đầu lấy từ `giaTriDauGiaoViec({ branchId, parent, defaultGroup }, homNay)` (dùng `useState(() => …)` để chỉ tính một lần lúc mount). Rerender trong lúc mở không ghi đè lựa chọn của người dùng. Mở lại thì state, khoá gửi (GVa-2) và `lf` đều mới. Sau khi tạo xong, `onClose()` đóng form; tạo liên tiếp nghĩa là mở lại, nên lại có giá trị đầu đúng và mã mới.
- [x] **Bước 5: Khoá gửi khi chưa có kỳ (F04).** `const ky = trangThaiKyGiao(tuanNay)` (chỉ khi `giaoGv`). Thêm `<Field label="Tuần">` hiện:
  - `dang-tai`: "Đang lấy tuần hiện tại…"
  - `loi`: "Chưa lấy được tuần hiện tại nên chưa giao được." cùng nút phụ **Thử lại** (`tuanNay.reload()`)
  - `khong-neo`: "Không xác định được tuần hiện tại." cùng nút **Thử lại**
  - `co`: mã tuần (`W1 OCT`, chỉ đọc)

  Nút Giao `disabled={busy || (giaoGv && !duocGiao(ky, busy))}`. Trong `tao()`: nếu `ky.loai !== 'co'` thì return. `resolveWeek` lỗi thì toast "Chưa xác định được tuần — bấm Thử lại." và **không** POST. `/impeccable harden` rồi `/impeccable clarify` cho đúng các chữ này (chỉ trong form này).
- [x] **Bước 6:** `npm run check` phải xanh. Bấm thử theo mục Nghiệm thu (375/1440, sáng/tối, 3 vai). Mở DevTools, chặn hoặc làm chậm `/ref/period-window` để thử trạng thái tải chậm và 503.
- [x] **Bước 7: Commit** `PR-GVa-4: form Giao việc mở theo ngữ cảnh (F03), khoá gửi khi chưa có kỳ (F04)`.
- [ ] **Bước 8: Cuối PR.** `/impeccable audit`, `/ponytail-review`, requesting-code-review, finishing-a-development-branch. Mở PR, không merge.

## Nghiệm thu
- **F01:** gửi lại cùng khoá trả cùng dòng, liên kết và audit chỉ ghi một lần. Khác khoá cùng tiêu đề là hai việc. group, note, watcher, unitReportId, caseIds không bao giờ mất. Hai POST đồng thời cùng khoá cho một dòng và cùng id (cả `/mgmt-tasks` và `/tasks`). PA cũng vậy, followup cũng vậy nếu có nơi gọi. Migrate chạy lặp được và không đổi dòng cũ.
- **F03:** các tình huống sau đều cho việc nằm đúng phạm vi form đã hiện: Tất cả → A → mở; A → B → mở; tạo liên tiếp; mở từ báo cáo đơn vị; mở từ việc cha.
- **F04:** tải chậm, 503, không có neo: nút Giao tắt, có Thử lại, không có POST nào. Neo không có id: resolve được thì lưu đúng kỳ; resolve lỗi thì báo và không POST. Máy chủ: thiếu kỳ thì tự xác định tuần hiện tại; kỳ rác thì báo 400 và không tạo dở task, Case hay PA. Việc giao xong hiện đúng ở danh sách tuần. Gửi lại cùng khoá không nhân đôi.

## Prompt cho session code (dán nguyên khối)
```
Làm PR-GVa (nhánh pr-gva-giao-viec) theo docs/superpowers/plans/2026-10-03-pr-gva-giao-viec.md, task GVa-1 → GVa-4.
Đầu phiên: /ponytail lite (PR có sửa form). Thực hiện bằng anthropic-skills:subagent-driven-development.
Mỗi task: anthropic-skills:test-driven-development (đỏ trên DB test trước); tái hiện F01/F03/F04 bằng anthropic-skills:systematic-debugging;
anthropic-skills:verification-before-completion (npm run check) trước khi báo xong.
GVa-4: /impeccable harden cho form Giao việc, /impeccable clarify cho chữ lỗi kỳ + "Thử lại" — chỉ trong form này.
Migrate CHỈ THÊM (DB Turso đang chạy). Kiểm quyền trước khi tra khoá. Không bớt kiểm tra nhập / chống mất dữ liệu / phân quyền.
Luật S3 nút (Đóng / Huỷ thay đổi), tiếng Việt, mã tuần W1 OCT. Cập nhật CODE_MAP.md khi thêm file.
Cuối PR: /impeccable audit → /ponytail-review (liệt kê chú thích ponytail: trong mô tả PR) → anthropic-skills:requesting-code-review
→ anthropic-skills:finishing-a-development-branch. Mô tả PR báo F01/F03/F04: tái hiện, file sửa, phép kiểm, ảnh 375/1440 sáng/tối, giới hạn.
Mở PR, không merge.
```
