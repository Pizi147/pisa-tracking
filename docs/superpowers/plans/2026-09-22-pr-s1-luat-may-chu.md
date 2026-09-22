# PR-S1 · Luật máy chủ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task, in order. Steps use checkbox (`- [ ]`) syntax —
> tick each one in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Opus 5 · XHigh** |
| Phương án B | **Fable 5.1 · High** |
| Người rà soát | **Fable 5.1** (khác model người code). Nếu người code là Fable (phương án B) thì người rà là Opus 5 hoặc Sonnet 5 — ghi rõ vào Nhật ký |
| Số PR | **Một PR**, nhánh `pr-s1-luat-may-chu`, không draft, **không tự merge** |
| Đợt | Đợt 1, chạy **song song PR-O**. PR-O sửa `web/src/App.tsx`, `OverviewPage.tsx`, khối điều hướng của `server/src/routes/index.ts` — PR này **không chạm** ba chỗ đó |

**Goal:** Đưa luật máy chủ về đúng đặc tả trước deploy: tín hiệu SOS lớp thường từng môn có hai lối ra (Tạo Case đúng môn · Bỏ qua),
tự đóng Case khi kết thúc khoá / đổi chương trình (S16/S17), sửa các phép đếm và chữ sai của lớp thường (§6), và dọn nợ luật S11–S15,
RB-3, RB-6, RB-8, RB-9, AN-13.

**Architecture:** Toàn bộ là luật máy chủ + phép kiểm; web chỉ sửa đúng hai chỗ bị hợp đồng máy chủ ép (form chuyển lớp — RB-3) và một
dòng sai loại hạn (`SkillBoard.tsx:611`). Hai mô-đun mới, mỗi cái một việc: `server/src/cases/systemClose.ts` (MỘT hàm đóng Case bởi
hệ thống, dùng cho S16, S17 và bởi PR-LT sau này) và `server/src/worklist/scoreDebt.ts` (MỘT hàm "ô điểm còn nợ" cho bảng chi nhánh,
đi qua chính hàm của bảng chấm). Một bước nâng cấp database idempotent thêm hai cột. Dữ liệu giao diện dòng tín hiệu (PR-Pa vẽ) được
máy chủ trả sẵn trên `SignalView` và `WorkItem.signal`.

**Tech Stack:** TypeScript 5.9 · Express 4 · `libsql` 0.5.29 (SQLite cục bộ khi dev, Turso khi bản chính) · harness kiểm thử tự viết
`server/src/tests/run.ts` (`check` / `assert` / `assertThrows` — **không phải** Jest, **không có bộ lọc**: luôn chạy cả bộ, tìm tên phép
kiểm trong kết quả) · React 18 cho hai chỗ web.

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` (§3.9 bảng luật lộ trình — chỉ phần S17; §3.10; §5 dòng
S1, 4.4, 4.5, 4.15, 4.16, 4.17; §6 các dòng gắn **S1**; §7 dòng **S1**). Việc gốc: `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md`
§1.5 (S1, S11–S17), §1.7 (RB-3, RB-6, RB-8, RB-9), §1.9 (AN-13), §3 (mâu thuẫn #3, #8, #9, #21). Luật: `thiet-ke/PISA-Rulebook-2026-09-19.md`
§3.4, §10, §11, §18.2, §19 · `thiet-ke/SOS_VA_PHOI_HOP_V3.md` §1 (Q-V3-1) · `plan.md` §3 dòng S16, S17, C02, C08 · `thiet-ke/LUAT_CHO_CHOT.md`.

**Số dòng trong plan này** đo trên nhánh `plan-lam-het-truoc-deploy` @ `d7a061c` (22/09/2026). Trước khi sửa, mở file xem lại — lệch vài
dòng là bình thường; **lệch nội dung** thì 🛑 hỏi.

---

## Global Constraints

- **An toàn dữ liệu.** Bản chính (Turso `pisatracking-…`) **đang rỗng** và **không bao giờ** được chạm trong PR này. Không đặt
  `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `PISA_CHO_PHEP_MIGRATE_TURSO`, `PISA_CHO_PHEP_SEED_TURSO`, `BAN_CHINH` trong cửa sổ làm việc.
  `npm test` tự gỡ biến Turso và chạy trên `data/test.sqlite`; `npm run migrate` chỉ chạy trên **bản sao** database dev (Task 20).
  Bản chính sẽ dựng từ `schema.sql` ở PR-Z2c (`init-ban-chinh`), nên cột mới phải có ở **cả** `schema.sql` lẫn `migrate.ts`.
- **Migration idempotent, chạy lặp được** (luật repo): chỉ `ALTER TABLE … ADD COLUMN` khi chưa có cột; bước điền dữ liệu chỉ đổi dòng
  chưa đổi; chạy lần hai `applied` rỗng. Có phép kiểm trên database trong bộ nhớ (Task 1).
- **Không đổi luật ngoài phạm vi.** FT giữ nguyên tự tạo Case (rulebook v3). Thấy luật khác có vẻ sai → ghi `plan.md` mục 12, **không sửa**.
- **Chữ người dùng thấy** (câu lỗi máy chủ, nhãn): "Case" viết hoa; không mở đầu câu bằng "Hãy"; không dùng "biện pháp" (phép quét
  `hoSoHocVien.tests.ts` sẽ đỏ); lớp thường **không** viết "Normal" trên màn (đặc tả §2) — nên nhãn S17 là **"Chuyển sang lớp thường"**,
  không phải "Chuyển sang lớp Normal" như `plan.md` §3 (đặc tả thắng, §0). Không dùng chuỗi nằm trong `PRH_OLD_STRINGS`
  (`server/src/tests/run.ts` ~dòng 8697, ví dụ `Việc của tôi`, `Hoàn thành phương án`).
- **Không chạm file của PR-O:** `web/src/App.tsx`, `web/src/modules/overview/OverviewPage.tsx`, khối điều hướng của `server/src/routes/index.ts`
  (~dòng 143–148). Route mới của PR này thêm ở khối tín hiệu (~1086–1103) và khối học viên (~1349–1372).
- **Không làm giao diện dòng tín hiệu** — đó là PR-Pa (§7). PR này chỉ trả dữ liệu (`kind`, `skill`, `score`, `total`, hạn, `actions`).
- **Số phép kiểm chỉ tăng.** Mốc đầu: **672** (đã chạy `npm test` trên `d7a061c`).
- Mỗi commit kết thúc bằng dòng Co-Authored-By theo hướng dẫn phiên. Không `--no-verify`.

---

## Quyết định session planning tự chốt khi đặc tả im lặng (ghi lại để người rà soát kiểm)

> **Planning review 22/09/2026:** Q6, Q7, Q12 đã SỬA (xem dòng tương ứng); Q5 đồng ý; Q1, Q10, Q11, Q13, nhãn S17 "Chuyển sang lớp thường", lý do Bỏ qua không bắt buộc — **đã duyệt như viết**.

| # | Chỗ im lặng | Chốt | Vì sao |
|---|---|---|---|
| Q1 | Tín hiệu về GVCN (không ai dạy môn đó) — nhưng C02 cấm GVCN xử lý trái môn | **Người được giao tín hiệu** (`owner_user_id`) luôn Tạo Case / Bỏ qua được tín hiệu đó (`canResolveSignal`). **Case** tạo ra vẫn theo C02 (GVCN không sửa được Case trái môn; Quản lý giao lại người) | §3.10 giao việc cho GVCN thì GVCN phải làm được; không mở rộng C02 cho Case |
| Q2 | "Bỏ qua" lưu ở đâu | Trạng thái `noted` đã có (nhãn đổi thành **"Đã bỏ qua"**); `resolution_note` = `Bỏ qua` hoặc `Bỏ qua — {lý do}` | Không thêm trạng thái; giữ bất biến "noted luôn có resolution_note" mà hai phép kiểm cũ khoá |
| Q3 | "Bỏ qua" cho tín hiệu FT | **Từ chối** — FT đã tự tạo Case; đóng bằng "Không cần theo dõi" | §3.10 chỉ nói lớp thường |
| Q4 | "Quá 3 ngày" | `verify_due < hôm nay` (hạn 3 ngày tính cả ngày đầu = `raised_on + 2`) — đúng định nghĩa `overdue` đang có | Một định nghĩa quá hạn cho cả hệ thống |
| Q5 | Case lớp thường môn **Writing** không tạo được (F07, máy chủ từ chối `writing`) nhưng tín hiệu Writing cần "Tạo Case" | PR này làm **nửa máy chủ** của F07: `reportIssue` nhận `topic = 'writing'` khi lộ trình là lớp thường. Nửa giao diện (`QuickReport.tsx:91`) để PR-Form. **Planning review 22/09: đồng ý** | Không có nó thì nút "Tạo Case" trên tín hiệu Writing hỏng từ đợt 1 tới đợt 7 |
| Q6 | S16 "lộ trình rời `active`" — gắn vào đâu | **Sửa theo planning review 22/09.** S16 CHỈ khi em THÔI HỌC: (a) `setStudentStatus(…, 'finished')`; (b) "Kết luận lộ trình" FT (`setOutcome`) và `updateCycle` rời `active` — hai đường này CHỈ khi nơi gọi truyền cờ tường minh `dongCaseKhiKetThuc: true`. Hoàn tất lộ trình không cờ → Case giữ nguyên (phép kiểm khoá). Không gắn `createCycle`. Hàm `closeCasesBySystem` export cho PR-LT | Luồng "Lên lớp thường tiếp" của PR-LT hoàn tất khoá cũ mà Case phải đi theo em (§3.9) — nó sẽ không truyền cờ |
| Q7 | S16/S17 "không tính vào thống kê hiệu quả" — PA **đã xong có kết quả** của Case đó thì sao | **Sửa theo planning review 22/09:** PA đã xong có kết quả thật VẪN tính hiệu quả. Chỉ việc đóng (Case không có `outcome`) và PA bị huỷ/chưa xong vì việc đóng (`cancelled`, `system_closed`) là ngoài thống kê. `queryPlans` **không** thêm bộ lọc — nó vốn chỉ đọc PA `completed` | Việc thật đã diễn ra thì đã diễn ra; chỉ việc đóng hành chính không phải một kết quả hỗ trợ |
| Q8 | PA đang `planned`/`started` của Case bị đóng bởi hệ thống | Chuyển `cancelled`, `closed_reason = 'system_closed'`; PA `completed` giữ nguyên | Không để PA treo dưới một Case đã đóng (việc treo hiện ở danh sách việc) |
| Q9 | Tín hiệu `pending` của khoá vừa kết thúc / chương trình vừa rời | Thu hồi (`withdrawn`) với lý do là nhãn hệ thống | Không để tín hiệu treo ở Việc cần làm của GV mãi |
| Q10 | RB-3 "Không có lưu ý" khi em còn Case mở | **Không** cho — còn Case mở thì bắt ghi bàn giao (luật cũ mục 6.4 giữ) | RB §10: "bắt đủ thông tin"; "Không có lưu ý" chỉ khi thật sự không có gì để dặn |
| Q11 | RB-6: GVBM (không kiêm GVCN) có hoàn thành Case môn mình không | **Giữ như cũ: không.** Chỉ siết GVCN theo 4.15 | 4.15 chỉ hỏi về GVCN; mở thêm quyền cho GVBM là luật mới |
| Q12 | RB-9: màn nào có nút "Lưu trữ" | PR này chỉ làm **máy chủ** (`POST /students/:id/archive`, `/unarchive`) và gỡ hàm tự lưu trữ. **Nút giao diện thuộc PR-LT** (thao tác trạng thái học viên — planning review 22/09) | Cùng chỗ với "Kết thúc học" / "Kết luận lộ trình" mà PR-LT dựng |
| Q13 | Bộ demo Vũ Thu Uyên (đã kết thúc, còn Case mở) | Áp S16 ngay trong seed (hết lệch 29/28 mà `plan.md` §22.9 S16 nêu) và sửa chuyện kể của em | Chuyện kể cũ nói ngược luật mới |

---

## File Structure

| File | Làm gì |
|---|---|
| `server/src/schema.sql` | + `sos_cases.system_close_reason`, + `attempt_skills.absent_from_no_show` (cột cuối bảng) |
| `server/src/migrate.ts` | + `export function migrateLuatMayChu(conn, applied)`; gọi sau `migrateDeleteInvalidViolations` (~dòng 440) |
| `shared/domain/cases.ts` | + `SYSTEM_CLOSE_REASONS`/`SystemCloseReason`/`SYSTEM_CLOSE_REASON_LABEL`, + `SIGNAL_DISMISS_NOTE`; nhãn `noted` → "Đã bỏ qua" |
| `shared/domain/students.ts` | + `TRANSFER_REASONS`/`TRANSFER_REASON_LABEL`/`NO_HANDOVER_NOTE`/`transferReasonText`; − `ARCHIVE_AFTER_DAYS` |
| `shared/domain/fasttrack.ts` | + `NO_SHOW_OVERRIDDEN_NOTE` (S13) |
| `shared/domain/metrics.ts` | + chỉ số `tin-hieu-qua-han` ("Chờ xác minh quá hạn") |
| `shared/domain/normal.ts` | `caseHeadline` nhận `attemptKind`, chữ lớp thường |
| `shared/domain/policy.ts` | chú thích C01/C05/C08 đúng trạng thái (DOC-2) |
| `server/src/cases/signals.ts` | `SIGNAL_SELECT`/`viewOf`/`SignalView` thêm `kind`,`score`,`total`,`actions`,`caseDraft`; + `canResolveSignal`, `dismissSignal`, `reconcileCorrectedSignals`, `overdueNormalSignalIds`, export `loadSignal`; `retireCaseForCorrectedScore` nhận `passText` |
| `server/src/cases/systemClose.ts` | **Mới.** `programmeOfCase`, `closeCasesBySystem`, `closeCasesOnProgrammeSwitch` |
| `server/src/cases/cases.ts` | `reportIssue` (đúng môn tín hiệu, lộ trình của tín hiệu, `writing` cho lớp thường); `canCloseCase` (RB-6); `loadCase` kèm `attempt_kind`; `caseDetail` trả `systemCloseReason` |
| `server/src/cases/effectiveness.ts` | chỉ chú thích (Q7: PA đã xong vẫn tính; PA bị hệ thống huỷ tự nằm ngoài) |
| `server/src/normal/regular.ts` | `refreshRegularOutcome` gọi `reconcileCorrectedSignals` (RB-8) |
| `server/src/fasttrack/attempts.ts` | `reconcileCorrectedScores` gọi hàm chung; `SkillCell.noShowNote` (S13) |
| `server/src/fasttrack/absence.ts` | cờ `absent_from_no_show` thay `sit_note.startsWith` (S11); sửa chú thích C10 cũ (DOC-2) |
| `server/src/fasttrack/skillSchedule.ts` | `SkillRow.absent_from_no_show`; `setSitStatus` xoá cờ |
| `server/src/fasttrack/cycles.ts` | `updateCycle` kiểm `status`; `updateCycle` + `setOutcome` đóng Case CHỈ khi có cờ `dongCaseKhiKetThuc: true` (S16) |
| `server/src/students/students.ts` | `setStudentStatus('finished')` → S16; `transferStudent` (RB-3); `archiveStudent`/`unarchiveStudent`; − `archiveDueStudents` |
| `server/src/students/standing.ts` | `Standing.failed`; `standingLine` chữ lớp thường |
| `server/src/students/profile.ts` | truyền `attemptKind` cho `caseHeadline` |
| `server/src/worklist/scoreDebt.ts` | **Mới.** `scoreDebtCells(p, today, branchIds)` |
| `server/src/worklist/branchpulse.ts` | `peopleOf` dùng `scoreDebtCells` |
| `server/src/worklist/signals.ts` | `no_plan` loại lớp thường; `missing_scores` theo `raw_score` cho lớp thường |
| `server/src/worklist/mywork.ts` | dòng `verify` thêm `signal` + chữ lớp thường |
| `server/src/worklist/metrics.ts` | + `tin-hieu-qua-han` |
| `server/src/routes/index.ts` | + `POST /signals/pending/:id/dismiss`, + `/students/:id/archive`, `/unarchive`; `/students/:id/transfer` nhận `reasonCode` |
| `server/src/seed/seed.ts`, `server/src/seed/students.ts` | S16 cho em đã kết thúc; 60% → 70% |
| `server/src/tests/luatMayChu.tests.ts` | **Mới.** Mọi phép kiểm của PR này |
| `server/src/tests/run.ts` | nối file mới; sửa 3 phép kiểm cũ bị luật mới thay (RB-9, metric count, `noteSignal`) |
| `server/src/tests/banChinh.tests.ts` | AN-13 |
| `web/src/modules/students/StudentManagePanel.tsx` | `TransferForm` gửi `reasonCode`/`noHandoverNote` (RB-3) |
| `web/src/modules/cases/SkillBoard.tsx` | dòng 611: `thuc-hien-y-thuc` → `cap-nhat-pa` |
| `thiet-ke/LUAT_CHO_CHOT.md`, `plan.md`, `CODE_MAP.md` | tài liệu (Task 19) |

---

### Task 0: Chuẩn bị

**Files:** không sửa mã.

- [x] **Step 1: Nhánh.** Nếu PR spec (nhánh `plan-lam-het-truoc-deploy`) đã merge: tách `pr-s1-luat-may-chu` từ `main`; chưa merge: tách
  từ `plan-lam-het-truoc-deploy`. Dùng worktree (skill `superpowers:using-git-worktrees`). Máy chủ dev trong worktree: `npm run dev`
  trong chính worktree (không dùng `preview_start`, nó chạy từ thư mục chính).
- [x] **Step 2: Kiểm môi trường không có biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`. Có biến → đóng cửa sổ, mở cửa sổ mới.

- [x] **Step 3: Mốc phép kiểm.** Run: `npm test 2>&1 | tail -3` — Expected: `TẤT CẢ 672 KIỂM TRA ĐỀU ĐẠT`. Ghi con số vào Nhật ký.
- [x] **Step 4:** Đọc Global Constraints + bảng Quyết định Q1–Q13 ở trên. Có Q nào bạn thấy sai với đặc tả → 🛑 hỏi trước khi code.

---

### Task 1: Hai cột mới + bước nâng cấp idempotent + file phép kiểm

**Files:**
- Modify: `server/src/schema.sql:842-845` (cuối bảng `sos_cases`), `server/src/schema.sql:566-574` (cuối cột `attempt_skills`, trước `UNIQUE`)
- Modify: `server/src/migrate.ts:439-440` (gọi), cuối file (hàm mới)
- Create: `server/src/tests/luatMayChu.tests.ts`
- Modify: `server/src/tests/run.ts:9425-9429` (nối sau khối PR-T)

**Interfaces:**
- Produces: cột `sos_cases.system_close_reason TEXT` (NULL | `course_ended` | `moved_to_normal` | `moved_to_ft`); cột
  `attempt_skills.absent_from_no_show INTEGER NOT NULL DEFAULT 0`; `export function migrateLuatMayChu(conn: any, applied: string[]): void`;
  trong file test: `taoHocVien`, `themLuot`, `diem`, `tinHieu`, `caseTuTinHieu`, `pGvcnFou`, `pSpeakingFou`, `pWritingFou`, `mbBranch`,
  `teacherOf`, `load`, `REPO`, `NOW` — mọi task sau dùng lại.

- [x] **Step 1: Tạo file phép kiểm với harness và các phép kiểm migration (đỏ).**

`server/src/tests/luatMayChu.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-S1 — luật máy chủ (đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §3.10, §5, §6;
 * kiểm kê §1.5, §1.7, §1.9). Tên mỗi phép kiểm bắt đầu bằng mã việc (S1, S11…S17, RB-3, RB-6, RB-8, RB-9, AN-13, §6).
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không đụng học viên của bộ demo — nên phép kiểm ở file khác chạy trước hay sau cũng không ảnh hưởng.
 * Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai). Tuần 07–13/09 đã hết Chủ nhật; tuần 14–20/09 đang chạy.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runLuatMayChuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const cases: any = await import('../cases/cases.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ. */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const NOW = new Date().toISOString();
  let soThuTu = 0;

  const teacherOf = (classCode: string, skill: string): number => {
    const r = conn.prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' ORDER BY id LIMIT 1`,
    ).get(classId(classCode), skill) as any;
    assert(r, `Bộ demo thiếu GV ${skill} ở ${classCode}`);
    return r.user_id as number;
  };
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;

  type HocVien = { sid: number; cid: number; cycleId: number; attemptId: number; periodId: number };
  /** Thêm một lượt Test cho học viên đã có — dùng khi cần lượt thứ hai (Cuối khoá, MT2). */
  function themLuot(o: { sid: number; cid: number; cycleId: number; weekStart: string; kind: string; no: number }): number {
    const periodId = week.ensurePeriod(o.weekStart).id;
    const id = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,?,?,?,?, 'planned', ?)`,
    ).run(o.cycleId, o.sid, o.no, o.kind, o.cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(id);
    return id;
  }
  /**
   * HỌC VIÊN MỚI trong một lớp có sẵn của bộ demo, kèm MỘT lộ trình đang chạy và MỘT lượt Test ở tuần `weekStart`.
   * MB-FOU 12 là lớp thường (GVCN T_HA dạy L, R · W: T_KHOA · S: T_TRANG). MB-FT 101 là FT (GVCN T_HA dạy L, R · W1 T_KHOA · W2 T_LINH · S T_TRANG).
   */
  function taoHocVien(o: { classCode: 'MB-FOU 12' | 'MB-FT 101'; weekStart: string; kind?: 'mock' | 'progress' | 'final' }): HocVien {
    soThuTu += 1;
    const tag = `S1-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB-FT 101';
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
    ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', NOW).lastInsertRowid);
    const attemptId = themLuot({ sid, cid, cycleId, weekStart: o.weekStart, kind: o.kind ?? (ft ? 'mock' : 'progress'), no: 1 });
    return { sid, cid, cycleId, attemptId, periodId: week.ensurePeriod(o.weekStart).id };
  }
  /** Nhập điểm lớp thường qua đúng đường nghiệp vụ (Quản trị nhập bù — đường `score.override`). */
  const diem = (attemptId: number, skill: string, score: number, total: number) =>
    regular.saveRegularScore(P.admin, attemptId, skill, { score, total });
  const tinHieu = (attemptId: number, skill: string) =>
    conn.prepare('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
  const pGvcnFou = P.normalCoreTeacher;                               // T_HA — GVCN MB-FOU 12, dạy L và R
  const pSpeakingFou = loadPrincipal(teacherOf('MB-FOU 12', 'speaking'));
  const pWritingFou = loadPrincipal(teacherOf('MB-FOU 12', 'writing'));
  /** "Tạo Case" từ một tín hiệu, đúng như form sẽ gửi. `topic` để thử gửi sai môn. */
  const caseTuTinHieu = (p: any, sg: any, topic?: string) => cases.reportIssue(p, {
    studentId: sg.student_id, topic: topic ?? sg.skill, fromSignalId: sg.id,
    title: `Case từ tín hiệu ${sg.skill} (PR-S1)`, summary: 'Đã xem lại bài, em vướng đúng phần này của môn.',
    primaryCode: domain.issuesForTopic(topic ?? sg.skill)[0].code,
  }) as any;
  void load; void assertThrows; void TODAY; void pSpeakingFou; void pWritingFou; void caseTuTinHieu; void diem; void tinHieu;

  // ================================================================== 1. Nâng cấp database

  console.log('\nPR-S1 · 1. Hai cột mới — schema.sql và migrate.ts khớp nhau, chạy lặp không làm gì');

  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] => (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
  /** Database THỜI TRƯỚC PR-S1: schema hiện tại, gỡ đúng hai cột PR-S1 thêm, kèm hai buổi vắng cũ. */
  const preS1 = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`ALTER TABLE sos_cases DROP COLUMN system_close_reason;
            ALTER TABLE attempt_skills DROP COLUMN absent_from_no_show;`);
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    const N = '2026-09-10T00:00:00.000Z';
    q(`INSERT INTO branches (code, name, created_at) VALUES ('MB', 'Monbay', ?)`, N);
    q(`INSERT INTO students (id, student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (1,'PISA1','Em 1','em 1',1,'active',?)`, N);
    q(`INSERT INTO learning_cycles (id, student_id, seq, started_at, status, created_at) VALUES (1, 1, 1, '2026-07-01', 'active', ?)`, N);
    q(`INSERT INTO assessment_attempts (id, cycle_id, student_id, attempt_no, kind, status, created_at) VALUES (1, 1, 1, 1, 'mock', 'planned', ?)`, N);
    q(`INSERT INTO attempt_skills (attempt_id, skill, sit_status, sit_note, created_at) VALUES (1, 'listening', 'absent', 'Không dự thi — dấu "-" còn nguyên đến hết Chủ nhật.', ?)`, N);
    q(`INSERT INTO attempt_skills (attempt_id, skill, sit_status, sit_note, created_at) VALUES (1, 'reading', 'absent', 'GVCN xác minh học viên không tới buổi thi', ?)`, N);
    return m;
  };

  check('PR-S1 · Migrate: database dựng từ schema.sql có đủ hai cột mới', () => {
    assert(colsOf(conn, 'sos_cases').includes('system_close_reason'), 'sos_cases thiếu system_close_reason');
    const col = (conn.prepare('PRAGMA table_info(attempt_skills)').all() as any[]).find((c) => c.name === 'absent_from_no_show');
    assert(col && col.notnull === 1 && String(col.dflt_value) === '0', `absent_from_no_show phải NOT NULL DEFAULT 0: ${JSON.stringify(col)}`);
  });

  check('PR-S1 · Migrate: database cũ được thêm cột; buổi vắng CHỐT DẤU "-" cũ được đánh cờ, buổi vắng do GVCN xác minh thì không', () => {
    const m = preS1();
    const applied: string[] = [];
    migrateMod.migrateLuatMayChu(m, applied);
    assert(applied.length === 1 && /PR-S1/.test(applied[0]), `Phải báo đúng một dòng PR-S1: ${applied.join(' | ')}`);
    assert(colsOf(m, 'sos_cases').includes('system_close_reason') && colsOf(m, 'attempt_skills').includes('absent_from_no_show'), 'Thiếu cột sau nâng cấp');
    const flags = (m.prepare('SELECT skill, absent_from_no_show AS f FROM attempt_skills ORDER BY skill').all() as any[]);
    assert(JSON.stringify(flags) === JSON.stringify([{ skill: 'listening', f: 1 }, { skill: 'reading', f: 0 }]), `Cờ sai: ${JSON.stringify(flags)}`);
  });

  check('PR-S1 · Migrate: chạy lần hai không làm gì; database mới từ schema.sql không có gì để nâng cấp', () => {
    const m = preS1();
    migrateMod.migrateLuatMayChu(m, []);
    const again: string[] = [];
    migrateMod.migrateLuatMayChu(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateLuatMayChu(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-S1 · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng — lần hai không áp lại bước PR-S1', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-S1/.test(x)), `Lần hai áp lại PR-S1: ${second.applied.join(' | ')}`);
  });

  check('PR-S1 · Tiền đề: dựng được học viên lớp thường và FT riêng cho phép kiểm, mỗi em một lượt có đủ bốn dòng lịch kỹ năng', () => {
    const a = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    for (const x of [a, b]) {
      const n = (conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(x.attemptId) as any).n;
      assert(n === 4, `Lượt ${x.attemptId} phải có 4 dòng lịch kỹ năng, có ${n}`);
    }
    assert(regular.isRatioClass(a.cid) && !regular.isRatioClass(b.cid), 'MB-FOU 12 phải là lớp thường, MB-FT 101 là FT');
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
```

Nối vào `server/src/tests/run.ts` — ngay **sau** khối PR-T (dòng ~9428 `await runSosV3Tests(...)`) và **trước** khối PR-Z2:

```ts
// ==================================================================== PR-S1 (luật máy chủ)

const { runLuatMayChuTests } = await import('./luatMayChu.tests.ts');
await runLuatMayChuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [x] **Step 2: Chạy, thấy đỏ.** Run: `npm test 2>&1 | grep -E "PR-S1|KIỂM TRA|KHÔNG ĐẠT"` — Expected: ba phép `PR-S1 · Migrate` đầu **✗**
  (thiếu cột / `migrateLuatMayChu is not a function`), phép "trọn chuỗi" và "Tiền đề" ✓.

- [x] **Step 3: Thêm cột vào `schema.sql`.**

Cuối bảng `sos_cases` (sau `updated_at TEXT`, dòng 844 — nhớ thêm dấu phẩy sau `updated_at TEXT`):

```sql
  updated_at TEXT,
  /*
   * ĐÓNG BỞI HỆ THỐNG (PR-S1, S16/S17 chốt 21/09 đêm): NULL = người đóng (hoặc chưa đóng). Có giá trị = máy tự đóng vì em
   * kết thúc khoá (`course_ended`) hoặc đổi chương trình (`moved_to_normal` · `moved_to_ft`). Case đóng kiểu này KHÔNG có
   * `outcome` (việc đóng không phải kết quả hỗ trợ); PA đã xong trước đó vẫn tính hiệu quả. Nhãn: `SYSTEM_CLOSE_REASON_LABEL`.
   */
  system_close_reason TEXT
);
```

Trong `attempt_skills`, sau `absence_move_count …` (dòng 570), trước `created_at`:

```sql
  absence_move_count INTEGER NOT NULL DEFAULT 0,
  /*
   * VẮNG NÀY SINH RA TỪ VIỆC CHỐT DẤU "-" (S11). Trước đây nhận biết bằng `sit_note` bắt đầu "Không dự thi" — một chuỗi chữ
   * làm cờ, lượt biên tập chữ sau sẽ vô tình gỡ nó. 1 khi `settleGroup` chốt; mọi đường đổi `sit_status` khác đặt lại 0.
   */
  absent_from_no_show INTEGER NOT NULL DEFAULT 0,
```

- [x] **Step 4: Viết `migrateLuatMayChu` ở cuối `server/src/migrate.ts`.**

```ts
/**
 * PR-S1 (luật máy chủ, 22/09/2026): hai cột mới.
 *   · `sos_cases.system_close_reason` — Case máy tự đóng theo S16/S17 (xem `cases/systemClose.ts`).
 *   · `attempt_skills.absent_from_no_show` — cờ "vắng do chốt dấu '-'" thay cho chuỗi `sit_note` (S11).
 * Dòng vắng cũ đã chốt được đánh cờ theo đúng chuỗi mà mã cũ dùng để nhận biết — đó là nơi DUY NHẤT dữ liệu cũ ghi điều này.
 * Chạy lặp không làm gì. Bản chính dựng từ `schema.sql` nên không đi qua bước này.
 */
export function migrateLuatMayChu(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const added: string[] = [];
  if (hasTable('sos_cases') && !cols('sos_cases').includes('system_close_reason')) {
    conn.exec('ALTER TABLE sos_cases ADD COLUMN system_close_reason TEXT');
    added.push('sos_cases.system_close_reason');
  }
  let flagged = 0;
  if (hasTable('attempt_skills')) {
    if (!cols('attempt_skills').includes('absent_from_no_show')) {
      conn.exec('ALTER TABLE attempt_skills ADD COLUMN absent_from_no_show INTEGER NOT NULL DEFAULT 0');
      added.push('attempt_skills.absent_from_no_show');
    }
    flagged = conn
      .prepare(
        `UPDATE attempt_skills SET absent_from_no_show = 1
          WHERE sit_status = 'absent' AND absent_from_no_show = 0 AND sit_note LIKE 'Không dự thi%'`,
      )
      .run().changes;
  }
  if (!added.length && !flagged) return;
  applied.push(
    `PR-S1: thêm ${added.length} cột (${added.join(', ') || 'không'}); đánh cờ ${flagged} buổi vắng do chốt dấu "-". Dữ liệu cũ giữ nguyên.`,
  );
}
```

Gọi trong `migrateCaseEngine`, ngay sau `migrateDeleteInvalidViolations(conn, applied);` (dòng 440):

```ts
    migrateDeleteInvalidViolations(conn, applied);
    /* PR-S1: hai cột của luật máy chủ (S16/S17, S11). */
    migrateLuatMayChu(conn, applied);
```

- [x] **Step 5: Chạy, thấy xanh.** Run: `npm test 2>&1 | grep -E "PR-S1|KIỂM TRA"` — Expected: 5 phép `PR-S1 ·` ✓, `TẤT CẢ 677 …`.
- [x] **Step 6: Commit.**

```bash
git add server/src/schema.sql server/src/migrate.ts server/src/tests/luatMayChu.tests.ts server/src/tests/run.ts
git commit -m "PR-S1 (1): hai cột system_close_reason + absent_from_no_show, bước nâng cấp idempotent, file phép kiểm"
```

---

### Task 2: S11 — cờ riêng thay `sit_note` làm cờ `fromNoShow`

**Files:**
- Modify: `server/src/fasttrack/skillSchedule.ts:54-71` (`SkillRow`), `:184-200` (`skillScheduleOf` dòng mặc định), `:697` (`setSitStatus`)
- Modify: `server/src/fasttrack/absence.ts:239` (`requestAbsenceMove`), `:329-333` (`applyMove`), `:464-467` (`cancelPart` nhánh lớp thường), `:535-536` (`restoreCancelledSkill`), `:662-665` (`settleGroup`), `:604-605` (chú thích DOC-2)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Consumes: cột `attempt_skills.absent_from_no_show` (Task 1).
- Produces: `SkillRow.absent_from_no_show: number`.

- [x] **Step 1: Phép kiểm (đỏ).** Thêm vào `luatMayChu.tests.ts` (trên dòng đánh dấu cuối hàm):

```ts
  // ================================================================== 2. S11

  console.log('\nPR-S1 · 2. S11 — "vắng do chốt dấu -" là CỘT RIÊNG, không phải chuỗi chữ');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const sit = (attemptId: number, skill: string) => conn.prepare(
    'SELECT sit_status, sit_note, absent_from_no_show AS flag, absence_move_count FROM attempt_skills WHERE attempt_id = ? AND skill = ?',
  ).get(attemptId, skill) as any;

  check('S11 · Chốt dấu "-" đánh cờ; sửa chữ sit_note KHÔNG làm mất quyền dời lần đầu của GVCN (sáng thứ Ba sau khi chốt)', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-16');
    absence.settleNoShows('2026-09-21');
    assert(sit(hv.attemptId, 'listening').sit_status === 'absent' && sit(hv.attemptId, 'listening').flag === 1,
      `Chốt xong phải absent + cờ 1: ${JSON.stringify(sit(hv.attemptId, 'listening'))}`);
    /* Lượt biên tập chữ sau này đổi câu ghi chú — cờ không được phụ thuộc vào câu chữ. */
    conn.prepare(`UPDATE attempt_skills SET sit_note = 'Ghi chú đã biên tập lại' WHERE attempt_id = ? AND skill = 'listening'`).run(hv.attemptId);
    const r = absence.requestAbsenceMove(P.lrTeacher, hv.attemptId, ['listening'], { today: '2026-09-22' }) as any;
    assert(r.outcomes[0].result === 'moved', `GVCN phải dời lần đầu được ngay, đang ${JSON.stringify(r.outcomes[0])}`);
    assert(sit(hv.attemptId, 'listening').flag === 0, 'Dời xong thì cờ phải về 0');
  });

  check('S11 · Vắng do Quản lý/GVCN xác nhận bằng tay KHÔNG mang cờ chốt dấu "-"', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    skillSchedule.setSitStatus(P.mbManager, hv.attemptId, 'speaking', 'absent', 'Quản lý xác nhận em vắng buổi Speaking');
    assert(sit(hv.attemptId, 'speaking').sit_status === 'absent' && sit(hv.attemptId, 'speaking').flag === 0,
      `Vắng tay phải cờ 0: ${JSON.stringify(sit(hv.attemptId, 'speaking'))}`);
  });

  check('S11 · Mã nguồn không còn dùng chuỗi sit_note làm cờ', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/fasttrack/absence.ts'), 'utf8');
    assert(!/sit_note[^\n]*startsWith/.test(src), 'absence.ts còn đọc sit_note.startsWith(...) làm cờ');
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test 2>&1 | grep -E "S11|KIỂM TRA"` — Expected: phép 1 ✗ (`escalated` hoặc `flag` undefined), phép 3 ✗.
- [x] **Step 3: Sửa mã.**

`skillSchedule.ts` — `SkillRow` thêm sau `absence_move_count: number;`:

```ts
  /** 1 = buổi vắng này sinh ra từ việc CHỐT dấu "-" (S11). Không đọc `sit_note` để biết điều này. */
  absent_from_no_show: number;
```
`skillScheduleOf` — dòng mặc định thêm `absent_from_no_show: 0,` cạnh `absence_move_count: 0,`.
`setSitStatus` (dòng 697) — mọi xác nhận bằng tay là của người, không phải của việc chốt:

```ts
      .prepare('UPDATE attempt_skills SET sit_status = ?, sit_by = ?, sit_at = ?, sit_note = ?, absent_from_no_show = 0, updated_at = ? WHERE id = ?')
```

`absence.ts`:
- dòng 239: `const fromNoShow = row.absent_from_no_show === 1;`
- `applyMove` (dòng 331–332): `sit_status = 'scheduled', sit_note = NULL, absent_from_no_show = 0, absence_move_count = ?, …`
- `cancelPart` nhánh lớp thường (dòng 466): `sit_status = 'scheduled', absent_from_no_show = 0, updated_at = ?`
- `restoreCancelledSkill` (dòng 535): `SET sit_status = 'scheduled', absent_from_no_show = 0, planned_period_id = ?, …`
- `settleGroup` (dòng 664): `SET sit_status = 'absent', absent_from_no_show = 1, sit_by = ?, sit_at = ?, sit_note = ?, updated_at = ?`
- Chú thích dòng 604–605 (DOC-2, C10 đã chốt "chốt ngay"): thay câu "Dấu '-' nhập cho tuần ĐÃ KẾT THÚC từ trước (C10) thì KHÔNG bị chốt
  ở đây mà chờ Quản lý hiệu chỉnh." bằng:

```ts
 * Dấu '-' nhập cho tuần ĐÃ KẾT THÚC từ trước (C10, chốt 20/09/2026 "chốt ngay") cũng được chốt ở đây, ngay lần gọi kế tiếp —
 * `saveScore` gọi hàm này tức thì sau khi ghi dấu muộn. Đường "chờ Quản lý hiệu chỉnh" còn mã nhưng không dùng.
```

- [x] **Step 4: Chạy, thấy xanh.** `npm test 2>&1 | tail -3` — Expected: `TẤT CẢ 680 …`. Nếu phép kiểm cũ `PR-G · …` đỏ: đọc câu lỗi —
  nó chỉ có thể đỏ nếu một đường đổi `sit_status` bị bỏ sót; sửa đường đó, không sửa phép kiểm cũ.
- [x] **Step 5: Commit.** `git commit -am "PR-S1 (2): S11 — cờ absent_from_no_show thay chuỗi sit_note; sửa chú thích C10 cũ"`

---

### Task 3: S13 (giữ quyết định Quản lý + một dòng giải thích) và S14 (phép kiểm nhánh Writing của `resolveLateNoShow`)

**Files:**
- Modify: `shared/domain/fasttrack.ts` (sau `NO_SHOW_HINT`, ~dòng 313)
- Modify: `server/src/fasttrack/attempts.ts:186-220` (`SkillCell`), `:314-322` và `:333-360` (`skillCells`)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `export const NO_SHOW_OVERRIDDEN_NOTE: string`; `SkillCell.noShowNote: string | null` (PR-Rc1 vẽ nó dưới ô).

Hành vi S13 **đã đúng** (báo lại cùng tuần là vô hại — `attempts.ts:1255`; ô đã chốt mà Quản lý sửa thì không sống lại —
`attempts.ts:314-322`). Task này khoá hành vi bằng phép kiểm và thêm dòng giải thích (quyết định 4.5).

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 3. S13 · S14

  console.log('\nPR-S1 · 3. S13 giữ quyết định Quản lý · S14 xác nhận "-" muộn của Writing');
  const cellOf = (hv: HocVien, skill: string, today: string) =>
    (attempts.classScoreSheet(P.admin, hv.cid, hv.periodId, today) as any).rows
      .find((r: any) => r.attemptId === hv.attemptId)?.cells.find((c: any) => c.skill === skill);
  const settledCount = (attemptId: number, assessed: string) => (conn.prepare(
    `SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' AND field = ?`,
  ).get(attemptId, assessed) as any).n as number;

  check('S13 · GV báo lại "-" cùng tuần sau khi Quản lý đã đổi kết luận: không chốt lại, dấu không hiện lại, ô có MỘT dòng giải thích', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-16');
    absence.settleNoShows('2026-09-21');
    assert(settledCount(hv.attemptId, 'listening') === 1, 'Tiền đề: phải chốt đúng một lần');
    skillSchedule.setSitStatus(P.mbManager, hv.attemptId, 'listening', 'scheduled', 'Quản lý sửa: em có làm bài');
    attempts.saveScore(P.lrTeacher, hv.attemptId, 'listening', { noShow: true }, '2026-09-22');
    absence.settleNoShows('2026-09-23');
    assert(sit(hv.attemptId, 'listening').sit_status === 'scheduled', 'Quyết định của Quản lý bị đè');
    assert(settledCount(hv.attemptId, 'listening') === 1, 'Không được chốt lần hai');
    const cell = cellOf(hv, 'listening', '2026-09-22');
    assert(cell && cell.noShow === null, `Dấu "-" cũ không được sống lại: ${JSON.stringify(cell?.noShow)}`);
    assert(cell.noShowNote === domain.NO_SHOW_OVERRIDDEN_NOTE, `Thiếu dòng giải thích: ${JSON.stringify(cell.noShowNote)}`);
    const other = cellOf(hv, 'reading', '2026-09-22');
    assert(other.noShowNote === null, 'Ô không có chuyện gì thì không có dòng giải thích');
  });

  check('S14 · resolveLateNoShow nhánh Writing: chỉ W1 "-" thì KHÔNG xác nhận được; từ chối thì gỡ dấu; giáo viên không tự hiệu chỉnh', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });       // tuần đã hết 13/09
    attempts.saveScore(P.w1Teacher, hv.attemptId, 'writing1', { noShow: true }, '2026-09-15');
    assert(sit(hv.attemptId, 'writing').sit_status === 'scheduled', 'W2 chưa "-" thì buổi Writing chưa phải vắng');
    assertThrows(() => absence.resolveLateNoShow(P.mbManager, hv.attemptId, 'writing1', 'confirm', '2026-09-15'),
      /mọi bài của buổi/, 'Xác nhận vắng Writing khi chỉ có W1 "-"');
    assertThrows(() => absence.resolveLateNoShow(P.w1Teacher, hv.attemptId, 'writing1', 'reject', '2026-09-15'),
      /Chỉ Quản lý/, 'GV tự hiệu chỉnh dấu "-" của tuần đã kết thúc');
    const r = absence.resolveLateNoShow(P.mbManager, hv.attemptId, 'writing1', 'reject', '2026-09-15') as any;
    assert(r.result === 'rejected', `Phải là rejected: ${JSON.stringify(r)}`);
    const w1 = conn.prepare(`SELECT no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`).get(hv.attemptId) as any;
    assert(w1.no_show_period_id === null, 'Từ chối xong dấu "-" của W1 phải được gỡ');
  });
```

- [x] **Step 2: Chạy.** Expected: S13 ✗ (`noShowNote` undefined, `NO_SHOW_OVERRIDDEN_NOTE` undefined); S14 ✓ ngay (hành vi đã có — đây là
  phép kiểm còn thiếu). Nếu S14 ✗ → 🛑 báo: luật W1/W2 của `resolveLateNoShow` khác mô tả.
- [x] **Step 3: Sửa mã.**

`shared/domain/fasttrack.ts` sau `NO_SHOW_HINT`:

```ts
/**
 * S13 (quyết định 4.5, 22/09/2026): ô đã chốt "không dự thi" rồi Quản lý đổi kết luận — dấu "-" báo lại cho CÙNG tuần không chốt
 * lại và không hiện lại. Ô hiện đúng một dòng này để người nhập không tưởng máy bỏ sót thao tác của mình.
 */
export const NO_SHOW_OVERRIDDEN_NOTE = 'Quản lý đã đổi kết luận tuần này — dấu "-" không được tính lại.';
```

`attempts.ts` — `SkillCell` thêm sau `noShow: {...} | null;`:

```ts
  /** S13: một dòng giải thích khi Quản lý đã đổi kết luận "không dự thi" của chính tuần này. `null` là bình thường. */
  noShowNote: string | null;
```
Trong `skillCells`, ngay sau khối `if (row?.no_show_settled_at && ns.state !== 'none') { … }` (dòng 314–322):

```ts
    const noShowNote = row?.no_show_settled_at && row.no_show_period_id === view.periodId && view.sitStatus !== 'absent'
      ? NO_SHOW_OVERRIDDEN_NOTE : null;
```
và thêm `noShowNote,` vào object trả về, cạnh `noShow,`. Import `NO_SHOW_OVERRIDDEN_NOTE` ở khối import `shared/domain` đầu file.

- [x] **Step 4: Chạy, xanh.** `npm run typecheck` (web có thể khai báo lại kiểu ô — thêm trường tuỳ chọn nếu `tsc` báo) rồi `npm test 2>&1 | tail -3` — Expected `682`.
- [x] **Step 5: Commit.** `git commit -am "PR-S1 (3): S13 dòng giải thích khi Quản lý đã đổi kết luận '-'; S14 phép kiểm Writing của resolveLateNoShow"`

---

### Task 4: S12 + §6 bảng chi nhánh — "ô điểm còn nợ" dùng chung hàm với bảng chấm

**Files:**
- Create: `server/src/worklist/scoreDebt.ts`
- Modify: `server/src/worklist/branchpulse.ts:283-319` (vòng `mtPending`), `:7` (bỏ import `addDays` nếu không còn dùng)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Consumes: `skillCells`, `regularSkillViews`, `loadBundle` (`fasttrack/attempts.ts`), `settleNoShows` (`fasttrack/absence.ts`), `scoringModeOf`.
- Produces: `export type DebtCell = { attemptId: number; classId: number; skill: string; userId: number; overdue: boolean }`;
  `export function scoreDebtCells(p: Principal, today: string, branchIds: number[] | null): DebtCell[]`.

Lỗi hiện tại (`branchpulse.ts:293-319`): ô lớp thường không bao giờ có `band` → mọi môn lớp thường treo "chưa nhập" mãi; hạn tính kiểu FT
(thứ Tư tuần sau) cho cả lớp thường (đúng ra: Chủ nhật tuần thi của môn đó); ô `-` loại thô không xét cặp W1/W2 (S12).

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 4. S12 + §6 branchpulse

  console.log('\nPR-S1 · 4. Ô điểm còn nợ (bảng chi nhánh) — cùng luật với bảng chấm: lớp thường theo số câu đúng và Chủ nhật; W1/W2 theo cặp');
  const scoreDebt = await load('../worklist/scoreDebt.ts');
  const no = (today: string, attemptId: number) =>
    (scoreDebt.scoreDebtCells(P.admin, today, [mbBranch]) as any[]).filter((d) => d.attemptId === attemptId);

  check('§6 · Lớp thường: môn đã có số câu đúng không còn nợ; môn chưa có nợ và QUÁ HẠN từ thứ Hai sau tuần thi (không phải thứ Tư kiểu FT)', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'reading', 30, 40);
    const cells = no(TODAY, hv.attemptId);
    assert(!cells.some((d) => d.skill === 'reading'), `Reading đã có 30/40 mà vẫn bị tính nợ: ${JSON.stringify(cells)}`);
    const l = cells.find((d) => d.skill === 'listening');
    assert(l && l.userId === teacherOf('MB-FOU 12', 'listening') && l.overdue === true,
      `Listening chưa nhập phải nợ, đúng GV, quá hạn hôm thứ Hai 14/09: ${JSON.stringify(l)}`);
    const sunday = no('2026-09-13', hv.attemptId).find((d) => d.skill === 'listening');
    assert(sunday && sunday.overdue === false, `Chủ nhật 13/09 vẫn trong hạn: ${JSON.stringify(sunday)}`);
    for (const k of ['listening', 'writing', 'speaking']) diem(hv.attemptId, k, 30, 40);
    assert(no(TODAY, hv.attemptId).length === 0, 'Đủ bốn môn mà vẫn còn ô nợ');
  });

  check('S12 · FT: chỉ W1 "-" thì W1 vẫn là nợ sau Chủ nhật (buổi Writing chưa phải vắng); trước Chủ nhật W1 "-" không nợ; W1 + W2 cùng "-" → chốt vắng, không ô nào nợ', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-14' });
    attempts.saveScore(P.w1Teacher, hv.attemptId, 'writing1', { noShow: true }, '2026-09-16');
    const mid = no('2026-09-16', hv.attemptId);
    assert(!mid.some((d) => d.skill === 'writing1'), 'Trong tuần, W1 đã báo "không có bài" thì không nợ');
    assert(mid.some((d) => d.skill === 'writing2' && d.userId === teacherOf('MB-FT 101', 'writing2')), 'W2 chưa nhập vẫn nợ, đúng GV W2');
    assert(no('2026-09-21', hv.attemptId).some((d) => d.skill === 'writing1'),
      'Sau Chủ nhật, W1 "-" mà W2 không "-" thì W1 vẫn là nợ — đúng như ô ở bảng chấm');
    attempts.saveScore(P.w2Teacher, hv.attemptId, 'writing2', { noShow: true }, '2026-09-18');
    const after = no('2026-09-21', hv.attemptId);
    assert(!after.some((d) => d.skill === 'writing1' || d.skill === 'writing2'), `W1 + W2 cùng "-" đã chốt vắng mà vẫn nợ: ${JSON.stringify(after)}`);
  });

  const pulse: any = await import('../worklist/branchpulse.ts');     // `check` không nhận hàm async — nạp ở ngoài
  check('§6 · Bảng chi nhánh vẫn dựng được và cột nợ điểm của GV đọc từ scoreDebtCells', () => {
    const r = pulse.branchPulse(P.mbManager, { branchId: mbBranch }) as any;
    assert(r && Array.isArray(r.people), 'branchPulse phải trả danh sách người');
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/worklist/branchpulse.ts'), 'utf8');
    assert(src.includes('scoreDebtCells') && !/s\.band IS NULL/.test(src), 'branchpulse.ts còn đếm nợ điểm bằng band IS NULL');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: cả ba ✗ (`Chưa có mô-đun ../worklist/scoreDebt.ts`, và `s.band IS NULL` còn trong nguồn).
- [x] **Step 3: Tạo `server/src/worklist/scoreDebt.ts`.**

```ts
import { db } from '../db.ts';
import { REGULAR_SKILLS } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { settleNoShows } from '../fasttrack/absence.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';

/**
 * Ô ĐIỂM CÒN NỢ — một ô = một kỹ năng một lượt, tuần thi đã bắt đầu, người được phân công chưa nhập (S12 + đặc tả §6).
 *
 * KHÔNG tự đếm. Đi qua ĐÚNG hàm mà bảng chấm dùng để vẽ ô: `skillCells` (FT — band, dấu "-", cặp W1/W2) và `regularSkillViews`
 * (lớp thường — số câu đúng, hạn Chủ nhật tuần thi của CHÍNH môn đó). Trước đây bảng chi nhánh tự viết một câu SQL "ước lượng thô":
 * lớp thường không bao giờ có `band` nên mọi môn treo mãi, hạn tính kiểu FT, và ô "-" bị loại mà không xét cặp W1/W2.
 *
 * `branchIds = null` là không lọc; `[]` là phạm vi rỗng → rỗng (hợp đồng số liệu, luật 3).
 */
export type DebtCell = { attemptId: number; classId: number; skill: string; userId: number; overdue: boolean };

/** Tiến độ KHÔNG phải nợ điểm: vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, đang chờ Quản lý duyệt dời. */
const NOT_DEBT = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending']);

export function scoreDebtCells(p: Principal, today: string, branchIds: number[] | null): DebtCell[] {
  if (Array.isArray(branchIds) && branchIds.length === 0) return [];
  /* Chốt "không dự thi" trước khi đọc — cùng khuôn với `classScoreSheet`; hàm idempotent. */
  settleNoShows(today);
  const conn = db();
  const where = [`a.status != 'cancelled'`, `cl.status = 'active'`];
  const args: unknown[] = [];
  if (branchIds) { where.push(`cl.branch_id IN (${branchIds.map(() => '?').join(',')})`); args.push(...branchIds); }
  const rows = conn
    .prepare(
      `SELECT a.*, pg.scoring_mode, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where.join(' AND ')}
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start <= ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start <= ?))`,
    )
    .all(...args, today, today) as any[];
  if (!rows.length) return [];

  const teacherOf = new Map<string, number>();
  for (const r of conn
    .prepare(`SELECT class_id, skill, user_id FROM teacher_assignments WHERE status = 'active' AND skill IS NOT NULL ORDER BY id`)
    .all() as any[]) {
    const k = `${r.class_id}|${r.skill}`;
    if (!teacherOf.has(k)) teacherOf.set(k, r.user_id);
  }

  const bundle = loadBundle(rows.map((r) => r.id));
  const out: DebtCell[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const skillRows = bundle.skillRows.get(a.id);
    if (scoringModeOf(a) === 'ratio') {
      const views = regularSkillViews(a, skillRows, scores, today);
      for (const skill of REGULAR_SKILLS) {
        const v = views.get(skill);
        if (!v || !v.required || v.scored || !v.weekStart || v.weekStart > today || NOT_DEBT.has(v.progress)) continue;
        const userId = teacherOf.get(`${a.class_id}|${skill}`);
        if (userId) out.push({ attemptId: a.id, classId: a.class_id, skill, userId, overdue: v.overdue });
      }
    } else {
      for (const c of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], today, skillRows)) {
        if (!c.required || c.band !== null || c.noShow !== null || !c.weekStart || c.weekStart > today || NOT_DEBT.has(c.progress)) continue;
        const userId = teacherOf.get(`${a.class_id}|${c.skill}`);
        if (userId) out.push({ attemptId: a.id, classId: a.class_id, skill: c.skill, userId, overdue: c.overdue });
      }
    }
  }
  return out;
}
```

- [x] **Step 4: Thay vòng `mtPending` trong `peopleOf`** (`branchpulse.ts` từ chú thích "MT CHƯA NHẬP và MT QUÁ HẠN NHẬP" dòng 286 tới
  `if (due && due < today) row.mtOverdue += 1; }` dòng 318–319) bằng:

```ts
  /*
   * MT CHƯA NHẬP và MT QUÁ HẠN NHẬP là HAI CỘT, không phải một. Cột đầu là khối lượng, cột sau là nợ.
   * Tập ô nợ lấy từ `scoreDebtCells` — CÙNG luật với ô ở bảng chấm (lớp thường: số câu đúng + hạn Chủ nhật; FT: band, dấu "-"
   * theo cặp W1/W2). Không còn câu SQL ước lượng riêng ở đây (S12, đặc tả §6).
   */
  const debtScope = branchId ? [branchId] : branchIds;
  for (const d of scoreDebtCells(p, today, debtScope)) {
    const row = people.get(d.userId);
    if (!row) continue;
    row.mtPending += 1;
    if (d.overdue) row.mtOverdue += 1;
  }
```
Thêm `import { scoreDebtCells } from './scoreDebt.ts';`. Nếu `addDays` và `scopeSql`/`scopeArgs` không còn chỗ dùng → xoá (tsc báo biến không dùng
chỉ khi bật `noUnusedLocals`; vẫn xoá cho sạch nếu thật sự không dùng — `scopeSql` còn dùng ở câu lớp của từng người phía trên, **giữ**).

- [x] **Step 5: Chạy, xanh.** `npm test 2>&1 | tail -3` — Expected `685`. Phép kiểm cũ về `branchPulse`/"Việc cần lưu ý" đỏ → đọc: nếu nó khoá
  **đúng con số cũ** do luật sai sinh ra (ví dụ đếm môn lớp thường đã chấm là "chưa nhập"), sửa kỳ vọng và ghi lý do trong Nhật ký; nếu khác → 🛑.
- [x] **Step 6: Commit.** `git add server/src/worklist/scoreDebt.ts && git commit -am "PR-S1 (4): S12 + §6 — ô điểm còn nợ đi qua hàm bảng chấm (lớp thường theo số câu đúng, hạn Chủ nhật; W1/W2 theo cặp)"`

---

### Task 5: §6 `worklist/signals.ts` — `no_plan` loại lớp thường, `missing_scores` theo số câu đúng

**Files:**
- Modify: `server/src/worklist/signals.ts:70-104`
- Test: `server/src/tests/luatMayChu.tests.ts`

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 5. §6 worklist/signals.ts

  console.log('\nPR-S1 · 5. Việc sinh từ dữ liệu: lớp thường không bị đếm "chưa có tuần MT" và "còn thiếu điểm" oan');
  const wsignals: any = await import('../worklist/signals.ts');
  const countOf = (kind: string) =>
    ((wsignals.signalsFor(P.admin, { branchId: mbBranch }) as any[]).find((x) => x.kind === kind)?.count ?? 0) as number;

  check('§6 · Học viên lớp thường không có lượt "planned" KHÔNG bị đếm "chưa có tuần MT" (lớp thường xếp lịch theo lớp)', () => {
    const before = countOf('no_plan');
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(hv.attemptId);
    assert(countOf('no_plan') === before, `Em lớp thường bị đếm vào "chưa có tuần MT": ${before} → ${countOf('no_plan')}`);
  });

  check('§6 · Lượt lớp thường đủ bốn môn (số câu đúng) KHÔNG còn "thiếu điểm"; thiếu một môn thì có', () => {
    const base = countOf('missing_scores');
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    assert(countOf('missing_scores') === base + 1, 'Lượt chưa có điểm nào phải được đếm thiếu điểm');
    for (const k of ['listening', 'reading', 'writing', 'speaking']) diem(hv.attemptId, k, 30, 40);
    assert(countOf('missing_scores') === base, `Đủ bốn môn mà vẫn "thiếu điểm": ${base} → ${countOf('missing_scores')}`);
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: cả hai ✗.
- [x] **Step 3: Sửa SQL.** Khối 1 (`no_plan`, dòng 71–85): thêm `LEFT JOIN programmes pg ON pg.code = c.programme_code` sau `JOIN classes c …`
  và điều kiện `AND COALESCE(pg.scoring_mode, '') != 'ratio'` sau `c.branch_id IN (${ph})`. Chú thích một dòng:
  `/* Lớp thường xếp lịch Test theo LỚP (planRegularTests), không theo từng em — không phải việc "chưa có tuần MT" của Quản lý. */`

Khối 2 (`missing_scores`, dòng 88–104) thay bằng:

```ts
  // 2. Thiếu điểm — tự hết khi giáo viên nhập đủ. Lớp thường "có điểm" = có SỐ CÂU ĐÚNG (không bao giờ có band); FT giữ nguyên luật cũ.
  for (const r of conn
    .prepare(
      `SELECT c.branch_id, COUNT(*) AS n FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
         JOIN students s ON s.id = a.student_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.status != 'cancelled' AND s.archived_at IS NULL AND c.branch_id IN (${ph})
          AND a.planned_period_id IS NOT NULL AND rp.week_start <= ?
          AND CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
                THEN (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.raw_score IS NOT NULL)
                     < (SELECT COUNT(*) FROM programme_skills ps WHERE ps.programme_code = c.programme_code)
                ELSE (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.band IS NOT NULL)
                     < (4 - (SELECT COUNT(*) FROM attempt_skill_skips k WHERE k.attempt_id = a.id))
              END
        GROUP BY c.branch_id`,
    )
    .all(...ids, today) as any[]) {
    push('missing_scores', r.branch_id, r.n, `${r.n} bài Test còn thiếu điểm`,
         'teacher', 'warn', `/hoc-vien?view=missing_scores&branchId=${r.branch_id}`);
  }
```

- [x] **Step 4: Chạy, xanh** (Expected `687`). **Step 5: Commit.** `git commit -am "PR-S1 (5): §6 — no_plan loại lớp thường, missing_scores lớp thường theo số câu đúng"`

---

### Task 6: S1 (a) — tín hiệu lớp thường từng môn, đúng người, đủ dữ liệu cho dòng việc

**Files:**
- Modify: `server/src/cases/signals.ts:1-11` (import), `:172-189` (`SignalView`), `:191-201` (`SIGNAL_SELECT`), `:203-225` (`viewOf`),
  `:227-235` + `:258` (`SignalFilters.today`), `:285-289` (export `loadSignal`), `:297-302` (`linkSignalToCase` quyền)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces:
  - `export type SignalAction = 'create_case' | 'dismiss';`
  - `SignalView` thêm `kind: 'normal' | 'ft'; score: number | null; total: number | null; actions: SignalAction[];
     caseDraft: { studentId: number; cycleId: number | null; topic: string | null; detectedAt: string; scoreText: string | null } | null;`
  - `export function canResolveSignal(p: Principal, sg: { class_id: number | null; student_id: number; skill: string | null; owner_user_id: number | null }): boolean`
  - `export function loadSignal(id: number): SignalRow` (bỏ `function` riêng tư, thêm `export`)
  - `SignalFilters.today?: string`

Hành vi "mỗi môn chưa đạt một tín hiệu, về GV môn đó, không ai dạy thì về GVCN" **đã có** (`regular.ts:481-491` gọi `raiseSignal` từng môn;
`owner.ts` chọn GV đúng môn rồi GVCN). Task này khoá nó bằng phép kiểm, bổ sung dữ liệu dòng việc, và cho người được giao xử lý được (Q1).

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 6. S1 (a) tín hiệu từng môn

  console.log('\nPR-S1 · 6. S1 — tín hiệu lớp thường: mỗi môn chưa đạt MỘT tín hiệu, về GV môn đó (không ai dạy thì GVCN)');
  const signals: any = await import('../cases/signals.ts');

  check('S1 · Hai môn chưa đạt → hai tín hiệu riêng, mỗi cái về đúng GV dạy môn đó; không tự tạo Case', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'speaking', 5, 25);
    const l = tinHieu(hv.attemptId, 'listening'), s = tinHieu(hv.attemptId, 'speaking');
    assert(l && s && l.id !== s.id, 'Phải có hai tín hiệu riêng');
    assert(l.owner_user_id === teacherOf('MB-FOU 12', 'listening') && s.owner_user_id === teacherOf('MB-FOU 12', 'speaking'),
      `Sai người: L→${l.owner_user_id}, S→${s.owner_user_id}`);
    assert(l.status === 'pending' && s.status === 'pending', 'Lớp thường không tự tạo Case (Q-V3-1)');
    const n = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?').get(hv.sid) as any).n;
    assert(n === 0, `Lớp thường không được tự tạo Case, đang có ${n}`);
  });

  check('S1 · Tín hiệu lớp thường mang đủ dữ liệu cho dòng việc: loại, môn, số câu đúng/tổng, hạn, hai nút cho đúng người', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 20, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const v = signals.signalDetail(pGvcnFou, sg.id) as any;
    assert(v.kind === 'normal' && v.skill === 'listening' && v.score === 20 && v.total === 40 && v.verifyDue === sg.verify_due,
      `Thiếu dữ liệu: ${JSON.stringify({ kind: v.kind, skill: v.skill, score: v.score, total: v.total, due: v.verifyDue })}`);
    assert(JSON.stringify(v.actions) === JSON.stringify(['create_case', 'dismiss']), `GV môn đó phải có hai nút: ${JSON.stringify(v.actions)}`);
    assert(v.caseDraft && v.caseDraft.topic === 'listening' && v.caseDraft.cycleId === hv.cycleId && v.caseDraft.scoreText === '20/40',
      `Điền sẵn form Case sai: ${JSON.stringify(v.caseDraft)}`);
    const other = signals.signalDetail(pSpeakingFou, sg.id) as any;
    assert(other.actions.length === 0 && other.canResolve === false, 'GV môn khác không được có nút xử lý');
  });

  check('S1 · Không ai dạy môn đó → tín hiệu về GVCN, và GVCN xử lý được tín hiệu đó dù không dạy môn đó (Q1)', () => {
    const cid = classId('MB-FOU 12');
    const ids = (conn.prepare(`SELECT id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`).all(cid) as any[]).map((r) => r.id);
    conn.prepare(`UPDATE teacher_assignments SET status = 'inactive' WHERE id IN (${ids.join(',')})`).run();
    try {
      const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
      diem(hv.attemptId, 'speaking', 5, 25);
      const sg = tinHieu(hv.attemptId, 'speaking');
      const core = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(cid) as any).user_id;
      assert(sg.owner_user_id === core, `Phải về GVCN (${core}), đang về ${sg.owner_user_id}`);
      const v = signals.signalDetail(pGvcnFou, sg.id) as any;
      assert(v.canResolve === true && v.actions.includes('create_case'), 'GVCN được giao mà không xử lý được');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ids.join(',')})`).run();
    }
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: phép 1 ✓ (hành vi đã có — khoá lại), phép 2 và 3 ✗.
- [x] **Step 3: Sửa `signals.ts`.**

Import: `import { badRequest, forbidden, notFound, nowIso } from '../util.ts';`

`SIGNAL_SELECT` thay bằng:

```ts
const SIGNAL_SELECT = `
  SELECT sg.*, s.full_name, s.student_code,
         c.code AS class_code, c.branch_id, b.name AS branch_name,
         a.attempt_no, a.kind AS attempt_kind,
         u.full_name AS owner_name,
         scr.raw_score AS score_value, scr.raw_total AS score_total,
         COALESCE(pg.scoring_mode, pgc.scoring_mode) AS scoring_mode
    FROM case_signals sg
    JOIN students s ON s.id = sg.student_id
    LEFT JOIN classes c ON c.id = sg.class_id
    LEFT JOIN branches b ON b.id = c.branch_id
    LEFT JOIN assessment_attempts a ON a.id = sg.attempt_id
    LEFT JOIN users u ON u.id = sg.owner_user_id
    LEFT JOIN assessment_scores scr ON scr.attempt_id = sg.attempt_id AND scr.skill = sg.skill
    LEFT JOIN programmes pg ON pg.code = c.programme_code
    LEFT JOIN learning_cycles cy ON cy.id = sg.cycle_id
    LEFT JOIN programmes pgc ON pgc.code = cy.programme_code`;
```

`SignalView` thêm (sau `canResolve: boolean;`):

```ts
  /** Lớp thường ('normal') giữ mô hình tín hiệu; Fast Track ('ft') tự tạo Case (Q-V3-1). */
  kind: 'normal' | 'ft';
  /** Lớp thường: số câu đúng / tổng số câu của ĐÚNG môn này — đọc thẳng từ ô điểm, sửa điểm thì số đổi theo. */
  score: number | null;
  total: number | null;
  /** Nút trên dòng việc (§3.10). Rỗng khi người xem không xử lý được hoặc tín hiệu không còn chờ. */
  actions: SignalAction[];
  /** Điền sẵn form "Tạo Case" đúng môn (§3.10). `null` khi tín hiệu không còn chờ. */
  caseDraft: { studentId: number; cycleId: number | null; topic: string | null; detectedAt: string; scoreText: string | null } | null;
```
và trên `SignalView`: `export type SignalAction = 'create_case' | 'dismiss';`

`canResolveSignal` (đặt ngay trên `viewOf`):

```ts
/**
 * AI XỬ LÝ ĐƯỢC MỘT TÍN HIỆU (Tạo Case · Bỏ qua).
 *
 * GV đúng môn hoặc Quản lý trong phạm vi (`SOS_EDIT` theo kỹ năng — C02). CỘNG người được giao tín hiệu: §3.10 nói không ai dạy
 * môn đó thì tín hiệu về GVCN — giao việc cho ai thì người đó phải làm được (quyết định Q1 của plan PR-S1). Chỉ mở cho tín hiệu,
 * KHÔNG mở cho Case: Case tạo ra vẫn theo C02.
 */
export function canResolveSignal(
  p: Principal, sg: { class_id: number | null; student_id: number; skill: string | null; owner_user_id: number | null },
): boolean {
  if (can(p, PERMISSIONS.SOS_EDIT, { classId: sg.class_id, studentId: sg.student_id, skill: sg.skill ?? undefined })) return true;
  return sg.owner_user_id === p.userId
    && can(p, PERMISSIONS.SOS_REPORT, { classId: sg.class_id, studentId: sg.student_id });
}
```

`viewOf`: thay khối `canResolve: can(...)` bằng tính trước:

```ts
function viewOf(p: Principal, r: any, today: string): SignalView {
  const kind: 'normal' | 'ft' = r.scoring_mode === 'ratio' ? 'normal' : 'ft';
  const canResolve = canResolveSignal(p, r);
  const pending = r.status === 'pending';
  const score = r.score_value ?? null, total = r.score_total ?? null;
  return {
    // …các trường cũ giữ nguyên…
    canResolve,
    kind, score, total,
    actions: canResolve && pending ? (kind === 'normal' ? ['create_case', 'dismiss'] : ['create_case']) : [],
    caseDraft: pending
      ? { studentId: r.student_id, cycleId: r.cycle_id ?? null, topic: r.skill ?? null, detectedAt: r.detected_on,
          scoreText: score !== null && total !== null ? `${score}/${total}` : null }
      : null,
  };
}
```

`SignalFilters` thêm `/** Ngày nghiệp vụ để tính quá hạn — mặc định hôm nay. */ today?: string;` và trong `listSignals` đổi
`const today = demoToday();` thành `const today = f.today ?? demoToday();`.

`loadSignal`: đổi `function loadSignal` thành `export function loadSignal`.

`linkSignalToCase` (dòng 299–302): thay `require_(p, PERMISSIONS.SOS_EDIT, …)` bằng

```ts
  if (!canResolveSignal(p, sg)) {
    throw forbidden('Bạn chỉ xác minh được tín hiệu giao cho mình hoặc của môn mình dạy, trong phạm vi mình phụ trách.');
  }
```
(Giữ chữ "phạm vi": phép kiểm cũ `[6.2] Chỉ người trong phạm vi …` bắt `/phạm vi/` — nó bị chặn trước đó ở `reportIssue`, nhưng giữ cho chắc.)

- [x] **Step 4: Chạy, xanh** (Expected `690`). **Step 5: Commit.** `git commit -am "PR-S1 (6): S1 — tín hiệu lớp thường mang loại/điểm/nút/điền sẵn; người được giao xử lý được"`

---

### Task 7: S1 (b) — "Bỏ qua" tín hiệu (không tạo Case, lý do không bắt buộc, có audit)

**Files:**
- Modify: `shared/domain/cases.ts:654-668` (nhãn `noted`, hằng mới)
- Modify: `server/src/cases/signals.ts` (hàm mới sau `assignSignal`, ~dòng 390)
- Modify: `server/src/routes/index.ts:1098-1103` (route mới ngay sau `/signals/pending/:id/assign`)
- Modify: `server/src/tests/run.ts:5986-5987` (phép kiểm cũ khoá quyết định 16/09 đã bị thay)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `export const SIGNAL_DISMISS_NOTE = 'Bỏ qua';`; `export function dismissSignal(p: Principal, signalId: number, input?: { reason?: string | null }): { ok: true; unchanged?: true }`;
  `POST /api/signals/pending/:id/dismiss` body `{ reason?: string }`.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 7. S1 (b) Bỏ qua

  console.log('\nPR-S1 · 7. S1 — Bỏ qua tín hiệu lớp thường: một bấm, lý do không bắt buộc, có audit');
  const auditN = (action: string, id: number) =>
    (conn.prepare('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?').get(action, id) as any).n as number;

  check('S1 · Bỏ qua không lý do: tín hiệu thành "Đã bỏ qua", không có Case, có audit; bấm lần hai không đổi gì', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    signals.dismissSignal(pGvcnFou, sg.id, {});
    const after = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(sg.id) as any;
    assert(after.status === 'noted' && after.resolution_note === domain.SIGNAL_DISMISS_NOTE && after.case_id === null && after.resolved_by === pGvcnFou.userId,
      `Sai: ${JSON.stringify(after)}`);
    assert(domain.SIGNAL_STATUS_LABEL.noted === 'Đã bỏ qua', `Nhãn: ${domain.SIGNAL_STATUS_LABEL.noted}`);
    assert(auditN('signal.dismissed', sg.id) === 1, 'Thiếu audit');
    const again = signals.dismissSignal(pGvcnFou, sg.id, {}) as any;
    assert(again.unchanged === true && auditN('signal.dismissed', sg.id) === 1, 'Bấm lần hai không được ghi thêm');
    diem(hv.attemptId, 'listening', 11, 40);                            // lưu lại điểm vẫn trượt
    assert((conn.prepare('SELECT status FROM case_signals WHERE id = ?').get(sg.id) as any).status === 'noted', 'Lưu lại điểm làm sống lại tín hiệu đã bỏ qua');
  });

  check('S1 · Bỏ qua có lý do: lý do được giữ; GV môn khác không bỏ qua được; tín hiệu đã thành Case thì không bỏ qua được', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'reading', 10, 40);
    const l = tinHieu(hv.attemptId, 'listening'), r = tinHieu(hv.attemptId, 'reading');
    assertThrows(() => signals.dismissSignal(pSpeakingFou, l.id, {}), /giao cho mình|môn mình dạy/, 'GV Speaking bỏ qua tín hiệu Listening');
    signals.dismissSignal(pGvcnFou, l.id, { reason: '  Em ốm hôm thi  ' });
    assert((conn.prepare('SELECT resolution_note FROM case_signals WHERE id = ?').get(l.id) as any).resolution_note === 'Bỏ qua — Em ốm hôm thi',
      'Lý do phải được giữ (đã cắt khoảng trắng)');
    caseTuTinHieu(pGvcnFou, r);
    assertThrows(() => signals.dismissSignal(pGvcnFou, r.id, {}), /đã thành Case/, 'Bỏ qua một tín hiệu đã thành Case');
  });

  check('S1 · Tín hiệu Fast Track không có nút Bỏ qua (FT tự tạo Case — đóng bằng "Không cần theo dõi")', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    const sg = signals.raiseSignal({
      actorUserId: P.admin.userId, studentId: hv.sid, cycleId: hv.cycleId, attemptId: hv.attemptId, classId: hv.cid,
      skill: 'reading', category: 'reading', detectedOn: '2026-09-07', silent: true,
    }) as any;
    assertThrows(() => signals.dismissSignal(P.mbManager, sg.id, {}), /Fast Track/, 'Bỏ qua tín hiệu FT');
    assert(!(signals.signalDetail(P.mbManager, sg.id) as any).actions.includes('dismiss'), 'Tín hiệu FT không được có nút Bỏ qua');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: ba phép ✗ (`dismissSignal is not a function`).
- [x] **Step 3: `shared/domain/cases.ts`.** Trong `SIGNAL_STATUS_LABEL` thay dòng `noted` và chú thích của nó:

```ts
  /*
   * BỎ QUA (S1, chủ sản phẩm chốt 22/09/2026, đặc tả §3.10 + §5): tín hiệu lớp thường được đóng mà KHÔNG tạo Case, một bấm, lý do
   * KHÔNG bắt buộc. `resolution_note` luôn có chữ (`SIGNAL_DISMISS_NOTE`, kèm lý do nếu có). Dòng `noted` cũ của bộ demo ("đã xem")
   * đọc ra cùng nhãn — cùng nghĩa: đã có người xem và không mở Case.
   */
  noted: 'Đã bỏ qua',
```
và sau `SIGNAL_WITHDRAW_SCORE_FIXED`:

```ts
/** Chữ ghi vào `resolution_note` khi GV bấm "Bỏ qua" tín hiệu (S1). Có lý do thì thêm " — {lý do}". */
export const SIGNAL_DISMISS_NOTE = 'Bỏ qua';
```

- [x] **Step 4: `dismissSignal` trong `signals.ts`** (sau `assignSignal`; import thêm `SIGNAL_DISMISS_NOTE`):

```ts
/** Tín hiệu này thuộc lớp thường không — theo lớp của tín hiệu, không có lớp thì theo khoá học. */
function isRatioSignal(signalId: number): boolean {
  const r = db()
    .prepare(
      `SELECT COALESCE(pg.scoring_mode, pgc.scoring_mode) AS m FROM case_signals sg
         LEFT JOIN classes c ON c.id = sg.class_id LEFT JOIN programmes pg ON pg.code = c.programme_code
         LEFT JOIN learning_cycles cy ON cy.id = sg.cycle_id LEFT JOIN programmes pgc ON pgc.code = cy.programme_code
        WHERE sg.id = ?`,
    )
    .get(signalId) as any;
  return r?.m === 'ratio';
}

/**
 * BỎ QUA MỘT TÍN HIỆU LỚP THƯỜNG — đóng mà không tạo Case (S1, đặc tả §3.10, quyết định 4.4 + "lý do không bắt buộc" 22/09/2026).
 *
 * Một bấm là xong; ô lý do nhỏ, không bắt buộc. Đã bỏ qua mà bấm lại thì không làm gì (không ghi audit thứ hai). Lưu lại điểm vẫn
 * trượt KHÔNG làm tín hiệu sống lại (`raiseSignal` chỉ mở lại tín hiệu `withdrawn`). Fast Track không đi đường này: FT đã tự tạo Case.
 */
export function dismissSignal(p: Principal, signalId: number, input: { reason?: string | null } = {}) {
  const sg = loadSignal(signalId);
  if (!canResolveSignal(p, sg)) {
    throw forbidden('Bạn chỉ bỏ qua được tín hiệu giao cho mình hoặc của môn mình dạy.');
  }
  if (sg.status === 'noted') return { ok: true as const, unchanged: true as const };
  if (sg.status === 'linked') throw badRequest('Tín hiệu này đã thành Case — không bỏ qua được nữa.');
  if (sg.status === 'withdrawn') throw badRequest('Tín hiệu này đã được thu hồi vì không còn căn cứ.');
  if (!isRatioSignal(signalId)) {
    throw badRequest('Tín hiệu Fast Track đã tự tạo Case — đóng bằng "Không cần theo dõi" ở Case đó.');
  }
  const reason = String(input.reason ?? '').trim().slice(0, 500);
  const note = reason ? `${SIGNAL_DISMISS_NOTE} — ${reason}` : SIGNAL_DISMISS_NOTE;
  db()
    .prepare(
      `UPDATE case_signals SET status = 'noted', resolved_by = ?, resolved_at = ?, resolution_note = ?, updated_at = ?
        WHERE id = ? AND status = 'pending'`,
    )
    .run(p.userId, nowIso(), note, nowIso(), signalId);
  writeAudit({
    actorUserId: p.userId, action: 'signal.dismissed', entityType: 'case_signal', entityId: signalId,
    entityLabel: labelOf(sg), before: { status: sg.status }, after: { status: 'noted', reason: reason || null },
  });
  return { ok: true as const };
}
```

- [x] **Step 5: Route** (`routes/index.ts`, ngay sau khối `/signals/pending/:id/assign`):

```ts
/** Bỏ qua một tín hiệu lớp thường — không tạo Case, lý do không bắt buộc (S1, đặc tả §3.10). */
api.post('/signals/pending/:id/dismiss', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSignalSvc.dismissSignal(principalOf(req), pInt(req, 'id'), { reason: req.body?.reason ?? null });
}));
```

- [x] **Step 6: Sửa phép kiểm cũ** `server/src/tests/run.ts:5979-5987` (khoá quyết định 16/09 "không có lối ra không mở Case", đã bị S1 22/09 thay).
  Giữ `assert(!('noteSignal' in signalsSvc), …)` nhưng đổi câu chú thích phía trên thành: *"Quyết định 16/09 bỏ đường 'ghi nhận đã xem'. Ngày
  22/09 chủ sản phẩm mở lại MỘT lối ra có tên riêng — `dismissSignal` (Bỏ qua, chỉ lớp thường, S1). Tên cũ `noteSignal` vẫn không được quay lại."*
  và thêm ngay dưới: `assert('dismissSignal' in signalsSvc, 'S1: phải có đường Bỏ qua tín hiệu lớp thường');`

- [x] **Step 7: Chạy, xanh** (Expected `693`). **Step 8: Commit.** `git commit -am "PR-S1 (7): S1 — Bỏ qua tín hiệu lớp thường (lý do không bắt buộc, audit) + route"`

---

### Task 8: S1 (c) — "Tạo Case" từ tín hiệu: đúng môn, đúng khoá, mang điểm; Case Writing lớp thường (nửa máy chủ F07)

**Files:**
- Modify: `server/src/cases/cases.ts:27` (import `loadSignal`), `:370-400` (`reportIssue`: kiểm môn + lộ trình)
- Modify: `server/src/cases/signals.ts:320-334` (`linkSignalToCase` — ghi điểm vào mốc mở)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Consumes: `loadSignal` (Task 6).
- Produces: `reportIssue` với `fromSignalId` → Case có `category` = môn của tín hiệu, `cycle_id` = khoá của tín hiệu; `topic = 'writing'` hợp lệ khi khoá là lớp thường.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 8. S1 (c) Tạo Case

  console.log('\nPR-S1 · 8. S1 — Tạo Case từ tín hiệu: đúng môn, đúng khoá, mốc mở mang điểm; Writing lớp thường');

  check('S1 · Tạo Case từ tín hiệu Listening: Case môn Listening của đúng khoá đó, tín hiệu "Đã thành Case", mốc mở ghi 10/40', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const c = caseTuTinHieu(pGvcnFou, sg);
    const row = conn.prepare('SELECT category, cycle_id FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.category === 'listening' && row.cycle_id === hv.cycleId, `Case sai môn/khoá: ${JSON.stringify(row)}`);
    const after = conn.prepare('SELECT status, case_id FROM case_signals WHERE id = ?').get(sg.id) as any;
    assert(after.status === 'linked' && after.case_id === c.id, `Tín hiệu chưa gắn: ${JSON.stringify(after)}`);
    const m = conn.prepare(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'opened'`).get(c.id) as any;
    assert(m && String(m.note).includes('10/40'), `Mốc mở phải mang điểm: ${m?.note}`);
  });

  check('S1 · Tạo Case sai môn với tín hiệu bị từ chối (tín hiệu Listening không mở Case Reading)', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    assertThrows(() => caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'), 'reading'), /đúng môn/, 'Case Reading từ tín hiệu Listening');
  });

  check('S1 · Tín hiệu Writing lớp thường tạo được Case Writing (một môn W); học viên FT không có Case "writing"', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'writing', 5, 20);
    const sg = tinHieu(hv.attemptId, 'writing');
    assert(sg.owner_user_id === pWritingFou.userId, 'Tín hiệu Writing phải về GV Writing');
    const c = caseTuTinHieu(pWritingFou, sg);
    assert((conn.prepare('SELECT category FROM sos_cases WHERE id = ?').get(c.id) as any).category === 'writing', 'Case phải là môn W');
    const ft = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    assertThrows(() => cases.reportIssue(P.mbManager, {
      studentId: ft.sid, topic: 'writing', title: 'Writing chung của FT', summary: 'FT phải tách W1 và W2, không có Writing chung.',
      primaryCode: domain.issuesForTopic('writing')[0].code,
    }), /Chủ đề không hợp lệ/, 'Học viên FT tạo Case Writing chung');
  });

  check('S1 · Tín hiệu đã Bỏ qua không mở Case được nữa', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'reading', 10, 40);
    const sg = tinHieu(hv.attemptId, 'reading');
    signals.dismissSignal(pGvcnFou, sg.id, {});
    assertThrows(() => caseTuTinHieu(pGvcnFou, sg), /đã được xử lý/, 'Mở Case từ tín hiệu đã bỏ qua');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: phép 1 ✗ (mốc không có 10/40; có thể cả `cycle_id`), 2 ✗, 3 ✗ (`Chủ đề không hợp lệ: writing`), 4 ✗.
- [x] **Step 3: `reportIssue` (`cases.ts`).** Hiện tại khối kiểm `topic` (dòng 383–385) đứng **trước** khối chọn lộ trình (dòng 399–404). Đổi thứ tự
  và thêm kiểm tín hiệu — thay đoạn từ `const topic = …` (dòng 381) tới hết khối `if (input.cycleId && !cycle) throw …` (dòng 404) bằng:

```ts
  /* Tín hiệu mà Case này trả lời (§3.10 "Tạo Case: mở form Case MÔN ĐÓ"). Chỉ tín hiệu còn chờ mới mở Case được. */
  const fromSignal = input.fromSignalId ? loadSignal(input.fromSignalId) : null;
  if (fromSignal && fromSignal.status !== 'pending') {
    throw badRequest('Tín hiệu này đã được xử lý rồi (đã thành Case, đã bỏ qua hoặc đã thu hồi).');
  }

  // Lộ trình: gửi rõ thì dùng; mở từ tín hiệu thì dùng ĐÚNG khoá của tín hiệu; không thì lộ trình đang mở.
  const wantedCycleId = input.cycleId ?? fromSignal?.cycle_id ?? null;
  const cycle = wantedCycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?')
        .get(wantedCycleId, input.studentId) as any)
    : currentCycle(input.studentId);
  if (wantedCycleId && !cycle) throw badRequest('Lộ trình không thuộc học viên này.');

  /*
   * MỌI VẤN ĐỀ PHẢI CÓ CHỖ CẤT. Năm ô FT (L · R · W1 · W2 · S); lớp thường có thêm MỘT môn Writing (`writing`) — nửa máy chủ của F07,
   * để tín hiệu Writing lớp thường "Tạo Case" được (plan PR-S1 Q5). FT không có Case "Writing chung".
   */
  const topic = (input.topic ?? '').trim() || null;
  if (!topic) {
    throw badRequest('Chọn kỹ năng: Listening, Reading, Writing Task 1, Writing Task 2 hay Speaking.');
  }
  const allowedTopics: readonly string[] = cycle && isRatioCycle(cycle) ? [...ENTRY_SKILLS, 'writing'] : ENTRY_SKILLS;
  if (!allowedTopics.includes(topic)) throw badRequest(`Chủ đề không hợp lệ: ${topic}`);
  if (fromSignal && categoryOf(topic) !== (fromSignal.category ?? categoryOf(fromSignal.skill))) {
    throw badRequest('Case tạo từ tín hiệu phải đúng môn của tín hiệu đó.');
  }
```
Giữ nguyên các dòng giữa (mức độ, `detectedAt`, `idempotencyKey`) — chỉ di chuyển, không đổi. Import: thêm `loadSignal` vào dòng 27
(`import { linkSignalToCase, loadSignal } from './signals.ts';`). `isRatioCycle`, `categoryOf`, `ENTRY_SKILLS`, `currentCycle` đã import sẵn — kiểm lại.

> Lưu ý thứ tự: khối `idempotencyKey` (trả Case cũ khi gửi lại) đứng giữa hai khối trên trong mã hiện tại. Đặt khối `fromSignal` **sau** khối
> `idempotencyKey`, để bấm gửi lại (tín hiệu đã `linked` từ lần đầu) vẫn trả Case cũ thay vì báo lỗi "đã được xử lý".

- [x] **Step 4: Mốc mở mang điểm** (`linkSignalToCase`, `signals.ts:320-334`). Trước câu `INSERT OR IGNORE INTO case_milestones … 'opened'`:

```ts
    const sc = sg.skill
      ? conn.prepare('SELECT raw_score, raw_total FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(sg.attempt_id, sg.skill) as any
      : null;
    const scoreText = sc?.raw_score != null && sc?.raw_total != null ? ` (${labelOf(sg)} ${sc.raw_score}/${sc.raw_total})` : '';
```
và đổi đối số `note` của câu INSERT thành `` `Tín hiệu từ kết quả đợt này${scoreText} đã được xác minh và mở thành Case` ``.

- [x] **Step 5: Chạy, xanh** (Expected `697`). Phép kiểm cũ `[6.2] …` ở `run.ts` ~5989 dùng tín hiệu demo bất kỳ: nếu nó chọn trúng tín hiệu có
  `skill` khác `topic` mà nó gửi thì giờ đỏ — nó gửi `topic: sg.skill` nên không. Nếu đỏ vì lý do khác → 🛑.
- [x] **Step 6: Commit.** `git commit -am "PR-S1 (8): S1 — Tạo Case từ tín hiệu đúng môn/đúng khoá, mốc mở mang điểm; Case Writing lớp thường (nửa máy chủ F07)"`

---

### Task 9: S1 (d) — dòng việc `verify` mang dữ liệu tín hiệu + chỉ số "Chờ xác minh quá hạn"

**Files:**
- Modify: `server/src/worklist/mywork.ts:40-86` (`WorkItem.signal`), `:264-289` (vòng `verify`)
- Modify: `server/src/cases/signals.ts` (hàm `overdueNormalSignalIds`)
- Modify: `shared/domain/metrics.ts:66-72` (chỉ số mới ngay sau `tin-hieu-cho-xac-minh`)
- Modify: `server/src/worklist/metrics.ts:191-197` (`LISTED_METRICS`), `:391-392` (case mới)
- Modify: `server/src/tests/run.ts:7972-7978` (sổ chỉ số 23 → 24)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `WorkItem.signal?: { id: number; kind: 'normal' | 'ft'; skill: string | null; skillLabel: string; score: number | null; total: number | null; deadline: string; actions: SignalAction[] } | null`;
  `export function overdueNormalSignalIds(p: Principal, f?: { branchId?: number | null; today?: string }): number[]`; chỉ số `tin-hieu-qua-han`.
  PR-Pa dùng `metricSet(p, 'tin-hieu-qua-han')` cho ô "Chờ xác minh quá hạn" và `WorkItem.signal` cho dòng việc.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 9. S1 (d) dòng việc + chỉ số

  console.log('\nPR-S1 · 9. S1 — dòng việc tín hiệu có đủ dữ liệu; ô "Chờ xác minh quá hạn" = tín hiệu lớp thường quá 3 ngày');
  const mywork: any = await import('../worklist/mywork.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');

  check('S1 · Việc cần làm của GV môn đó có MỘT dòng cho mỗi tín hiệu, kèm loại, môn, điểm, hạn, hai nút; GV khác không thấy', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 12, 40);
    diem(hv.attemptId, 'speaking', 6, 25);
    const l = tinHieu(hv.attemptId, 'listening'), s = tinHieu(hv.attemptId, 'speaking');
    const mine = (mywork.myWork(pGvcnFou) as any).items.find((i: any) => i.key === `verify:${l.id}`);
    assert(mine && mine.signal, 'Thiếu dòng tín hiệu Listening ở Việc cần làm của GV Listening');
    assert(mine.signal.kind === 'normal' && mine.signal.skill === 'listening' && mine.signal.score === 12 && mine.signal.total === 40
      && mine.signal.deadline === l.verify_due && JSON.stringify(mine.signal.actions) === JSON.stringify(['create_case', 'dismiss']),
      `Dữ liệu dòng: ${JSON.stringify(mine.signal)}`);
    assert(/chưa đạt/.test(mine.reason) && !/kỳ vọng/.test(mine.reason) && mine.actionLabel === 'Tạo Case', `Chữ dòng: ${mine.reason} · ${mine.actionLabel}`);
    assert(!(mywork.myWork(pGvcnFou) as any).items.some((i: any) => i.key === `verify:${s.id}`), 'GV Listening thấy tín hiệu Speaking');
    assert((mywork.myWork(pSpeakingFou) as any).items.some((i: any) => i.key === `verify:${s.id}`), 'GV Speaking không thấy tín hiệu của mình');
  });

  check('S1 · Chỉ số tin-hieu-qua-han: tín hiệu lớp thường chờ quá 3 ngày có; chưa quá hạn thì không; đã bỏ qua thì không', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'reading', 10, 40);
    diem(hv.attemptId, 'speaking', 5, 25);
    const oldL = tinHieu(hv.attemptId, 'listening'), fresh = tinHieu(hv.attemptId, 'reading'), gone = tinHieu(hv.attemptId, 'speaking');
    conn.prepare(`UPDATE case_signals SET raised_on = '2026-09-09', verify_due = '2026-09-11' WHERE id IN (?, ?)`).run(oldL.id, gone.id);
    signals.dismissSignal(pSpeakingFou, gone.id, {});
    const ids = (metricsSvc.metricSet(P.admin, 'tin-hieu-qua-han', {}) as any).ids as number[];
    assert(ids.includes(oldL.id), 'Tín hiệu quá hạn phải có trong ô');
    assert(!ids.includes(fresh.id), 'Tín hiệu còn trong hạn không được đếm');
    assert(!ids.includes(gone.id), 'Tín hiệu đã bỏ qua không được đếm');
    assert(domain.metricById('tin-hieu-qua-han')?.ten === 'Chờ xác minh quá hạn', 'Tên chỉ số phải đúng chữ ô Tổng quan (§3.2)');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: hai phép ✗; phép cũ "Sổ chỉ số: đúng hai mươi ba…" vẫn ✓ (chưa thêm).
- [x] **Step 3: `overdueNormalSignalIds`** (`signals.ts`, sau `listSignals`):

```ts
/**
 * TẬP ID CỦA Ô "CHỜ XÁC MINH QUÁ HẠN" (đặc tả §3.2, §3.10): tín hiệu LỚP THƯỜNG còn chờ mà hạn 3 ngày (tính cả ngày đầu) đã qua.
 * Fast Track tự tạo Case nên không có tín hiệu chờ. Phạm vi và quyền đi qua `listSignals` — cùng hàm với danh sách tín hiệu.
 */
export function overdueNormalSignalIds(p: Principal, f: { branchId?: number | null; today?: string } = {}): number[] {
  return listSignals(p, { branchId: f.branchId ?? null, status: 'open', today: f.today }).rows
    .filter((s) => s.kind === 'normal' && s.overdue)
    .map((s) => s.id)
    .sort((a, b) => a - b);
}
```

- [x] **Step 4: Chỉ số.** `shared/domain/metrics.ts` — thêm sau `tin-hieu-cho-xac-minh`:

```ts
  {
    id: 'tin-hieu-qua-han', ten: 'Chờ xác minh quá hạn',
    cauHoi: 'Bao nhiêu tín hiệu SOS lớp thường đã quá 3 ngày mà chưa ai tạo Case hay bỏ qua?',
    donVi: 'tin-hieu',
    tapDuDieuKien: 'Tín hiệu của LỚP THƯỜNG còn chờ (chưa thành Case, chưa bỏ qua, chưa thu hồi) mà hạn xác minh 3 ngày, tính cả ngày đầu, đã qua. Fast Track tự tạo Case nên không có ở đây.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT signal_id', drilldown: '/metrics/tin-hieu-qua-han',
  },
```
`server/src/worklist/metrics.ts`: thêm `'tin-hieu-qua-han'` vào `LISTED_METRICS` sau `'tin-hieu-cho-xac-minh'`; import `overdueNormalSignalIds` cạnh
`listSignals`; trong `switch` thêm sau `case 'tin-hieu-cho-xac-minh': …`:

```ts
    case 'tin-hieu-qua-han':
      return done(overdueNormalSignalIds(p, { branchId: branchId ?? null, today }));
```
`server/src/tests/run.ts` (phép "Sổ chỉ số", dòng ~7972): `23` → `24` (cả câu thông báo: thêm "+ một của PR-S1: tin-hieu-qua-han") và thêm
`'tin-hieu-qua-han'` vào mảng `expected` sau `'tin-hieu-cho-xac-minh'`.

- [x] **Step 5: Dòng `verify` ở `mywork.ts`.** `WorkItem` thêm (sau `count: number | null;`):

```ts
  /**
   * DÒNG TÍN HIỆU SOS (đặc tả §3.10) — đủ để giao diện vẽ hai nút "Tạo Case · Bỏ qua" mà không phải gọi thêm. Chỉ dòng `verify` có.
   */
  signal?: {
    id: number; kind: 'normal' | 'ft'; skill: string | null; skillLabel: string;
    score: number | null; total: number | null; deadline: string; actions: SignalAction[];
  } | null;
```
(import `type SignalAction` từ `'../cases/signals.ts'`). Trong vòng `for (const sg of listSignals(...))` (dòng 264–289), thay `reason:` và
`actionLabel:` và thêm `signal:`:

```ts
      reason: sg.kind === 'normal'
        ? `${sg.label} chưa đạt${sg.score !== null && sg.total !== null ? ` (${sg.score}/${sg.total})` : ''}.`
        : `${sg.label} dưới kỳ vọng${sg.band !== null ? ` (${sg.band} so với ${sg.expectation ?? '—'})` : ''}.`
          + ' Xem lại bài rồi xác minh.',
      actionLabel: sg.kind === 'normal' ? 'Tạo Case' : 'Mở case',
      signal: {
        id: sg.id, kind: sg.kind, skill: sg.skill, skillLabel: sg.label,
        score: sg.score, total: sg.total, deadline: sg.verifyDue, actions: sg.actions,
      },
```

- [x] **Step 6: Chạy, xanh** (Expected `699`). `npm run typecheck` — web đọc `WorkItem` qua kiểu riêng thì trường tuỳ chọn không làm vỡ gì.
- [x] **Step 7: Commit.** `git commit -am "PR-S1 (9): S1 — dòng việc tín hiệu mang dữ liệu + chỉ số tin-hieu-qua-han (Chờ xác minh quá hạn)"`

---

### Task 10: RB-8 — sửa điểm làm mất căn cứ: lớp thường dùng chung đường đối soát của FT; Case không tự đóng vô cớ

**Files:**
- Modify: `server/src/cases/signals.ts:503-543` (`retireCaseForCorrectedScore` nhận `passText`), thêm `reconcileCorrectedSignals`
- Modify: `server/src/fasttrack/attempts.ts:1130-1181` (`reconcileCorrectedScores` gọi hàm chung), import dòng 27
- Modify: `server/src/normal/regular.ts:405-416` (`refreshRegularOutcome`)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `export function reconcileCorrectedSignals(p: Principal, input: { attemptId: number; passingSkills: string[]; passText: string }): void`;
  `retireCaseForCorrectedScore(p, caseId, label, passText = 'đạt kỳ vọng')`.

**Kết quả điều tra RB-8 (đã đọc mã):** FT có đối soát (`attempts.ts:1105-1117`, `reconcileCorrectedScores`): tín hiệu chờ bị thu hồi; Case chỉ sống nhờ
con số vừa sửa thì rút; Case có căn cứ độc lập thì giữ + nhắc người phụ trách. **Lớp thường không có**: `refreshRegularOutcome` không bao giờ gọi
`withdrawSignalsNoLongerValid` → sửa 10/40 thành 30/40 thì tín hiệu vẫn "Chờ xác minh" và Case dựng trên nó vẫn mở. Ngoài ra, khi chỉ một
môn được sửa lên đạt mà các môn khác chưa có điểm, `sosLevel` là `null` và hàm **thoát sớm** (dòng 416) — nên lời gọi đối soát phải đứng
**trước** lối thoát đó.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 10. RB-8

  console.log('\nPR-S1 · 10. RB-8 — sửa điểm nhập nhầm ở lớp thường: rút tín hiệu, rút Case không còn căn cứ, giữ Case có việc thật');

  check('RB-8 · Lớp thường: sửa 10/40 thành 30/40 → tín hiệu đang chờ bị thu hồi "Không còn hợp lệ do sửa điểm"', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    diem(hv.attemptId, 'listening', 30, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    assert(sg.status === 'withdrawn' && sg.withdrawn_reason === domain.SIGNAL_WITHDRAW_SCORE_FIXED, `Tín hiệu: ${JSON.stringify(sg)}`);
  });

  check('RB-8 · Lớp thường: Case mở từ tín hiệu, chưa có việc gì → sửa điểm thành đạt thì Case được rút (đóng, có lý do), lịch sử giữ', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    diem(hv.attemptId, 'listening', 30, 40);
    const row = conn.prepare('SELECT status, outcome, outcome_note FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status === 'done' && row.outcome === null && String(row.outcome_note).includes(domain.SIGNAL_WITHDRAW_SCORE_FIXED)
      && /thành đạt\./.test(String(row.outcome_note)) && !/kỳ vọng/.test(String(row.outcome_note)),
      `Case phải rút với chữ lớp thường: ${JSON.stringify(row)}`);
  });

  check('RB-8 · Lớp thường: Case đã có phương án đang chạy → sửa điểm KHÔNG đóng Case, chỉ nhắc người phụ trách xem lại', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    cases.recordIntervention(pGvcnFou, c.id, {
      kind: 'self_study', description: 'Nghe 30 phút mỗi ngày (PR-S1)', performerName: 'GVBM', status: 'started', startedDate: TODAY,
    });
    diem(hv.attemptId, 'listening', 30, 40);
    const row = conn.prepare('SELECT status, owner_user_id FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status !== 'done', 'Case có việc thật không được tự đóng vì sửa điểm');
    const n = (conn.prepare('SELECT COUNT(*) n FROM notifications WHERE dedup_key = ?').get(`case_review:${c.id}:${hv.attemptId}`) as any).n;
    assert(n === 1, 'Người phụ trách phải được nhắc xem lại đúng một lần');
  });

  check('RB-8 · Không đóng Case vô cớ: Giữa khoá trượt → Case có việc; Cuối khoá đạt cả bốn môn → Case vẫn mở, hạ mức về 0, có mốc "đã đạt"', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-08-24' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    cases.recordIntervention(pGvcnFou, c.id, {
      kind: 'self_study', description: 'Nghe chép chính tả (PR-S1)', performerName: 'GVBM', status: 'started', startedDate: TODAY,
    });
    const fin = themLuot({ sid: hv.sid, cid: hv.cid, cycleId: hv.cycleId, weekStart: '2026-09-07', kind: 'final', no: 2 });
    for (const k of ['listening', 'reading', 'writing', 'speaking']) diem(fin, k, 35, 40);
    const row = conn.prepare('SELECT status, sos_level FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(row.status !== 'done' && row.sos_level === 0, `Case phải còn mở, mức 0: ${JSON.stringify(row)}`);
    const passed = (conn.prepare(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'passed' AND attempt_id = ?`).get(c.id, fin) as any).n;
    assert(passed === 1, 'Thiếu mốc "đã đạt" của Cuối khoá');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: RB-8 phép 1–3 ✗; phép 4 ✓ (hành vi đã đúng — khoá lại). Nếu phép 4 ✗ → 🛑 (Case bị đóng hoặc
  không có mốc — đó là lỗi khác, báo trước khi sửa).
- [x] **Step 3: `signals.ts`.** `retireCaseForCorrectedScore(p: Principal, caseId: number, label: string, passText = 'đạt kỳ vọng')` và đổi câu
  `outcome_note` thành `` `${SIGNAL_WITHDRAW_SCORE_FIXED} — điểm ${label} đã được sửa lại thành ${passText}.` ``. Thêm hàm chung (sau
  `retireCaseForCorrectedScore`), **chuyển nguyên** thân vòng `for (const item of casesToReview)` và khối audit từ `attempts.ts:1142-1180`:

```ts
/**
 * ĐỐI SOÁT NGƯỢC SAU KHI SỬA ĐIỂM (mục 9.4, RB-8) — MỘT hàm cho cả Fast Track và lớp thường.
 *
 * Những ô vừa được sửa thành ĐẠT: tín hiệu còn chờ bị thu hồi; Case chỉ sống nhờ con số vừa sửa thì rút khỏi danh sách đang xử lý
 * (giữ lịch sử, huỷ phương án chưa ai làm); Case còn căn cứ độc lập thì GIỮ và nhắc người phụ trách. Không ghi mốc "đã tiến bộ":
 * sửa một con số nhập sai không phải một lần thi thứ hai. `passText`: "đạt kỳ vọng" (FT) · "đạt" (lớp thường).
 */
export function reconcileCorrectedSignals(p: Principal, input: { attemptId: number; passingSkills: string[]; passText: string }) {
  const conn = db();
  if (!input.passingSkills.length) return;
  const { withdrawn, casesToReview } = withdrawSignalsNoLongerValid({
    actorUserId: p.userId, attemptId: input.attemptId, passingSkills: input.passingSkills,
  });
  for (const item of casesToReview) {
    if (caseHasIndependentBasis(item.caseId, input.attemptId)) {
      const c = conn.prepare('SELECT owner_user_id, student_id, status FROM sos_cases WHERE id = ?').get(item.caseId) as any;
      if (c?.owner_user_id && c.status !== 'done') {
        const st = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(c.student_id) as any;
        notify({
          userId: c.owner_user_id, kind: 'sos',
          title: `Xem lại case ${item.label} — ${st?.full_name ?? ''}`,
          body: `Điểm nguồn đã được sửa thành ${input.passText}. Case vẫn còn căn cứ khác; xem có cần theo tiếp không.`,
          entityType: 'sos_case', entityId: item.caseId,
          dedupKey: `case_review:${item.caseId}:${input.attemptId}`,
        });
      }
    } else {
      retireCaseForCorrectedScore(p, item.caseId, item.label, input.passText);
      conn.prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE id = ?`)
        .run(SIGNAL_WITHDRAW_SCORE_FIXED, nowIso(), item.signalId);
    }
  }
  if (withdrawn.length) {
    writeAudit({
      actorUserId: p.userId, action: 'signal.withdrawn_batch', entityType: 'assessment_attempt',
      entityId: input.attemptId, entityLabel: `${withdrawn.length} tín hiệu`,
      after: { reason: SIGNAL_WITHDRAW_SCORE_FIXED, skills: withdrawn.map((w) => w.skill) },
    });
  }
}
```

- [x] **Step 4: `attempts.ts`.** Thân `reconcileCorrectedScores` (dòng 1131–1181) còn lại:

```ts
function reconcileCorrectedScores(p: Principal, attemptId: number, result: AttemptResult) {
  const entry = entryBandsOf(scoresOf(attemptId));
  const failing = new Set(failingEntrySkills(result.expectation, entry, result.skipped));
  /* Ô đã có điểm mà KHÔNG nằm trong danh sách dưới kỳ vọng = ô đang đạt. */
  const passing = ENTRY_SKILLS.filter((k) => (entry[k] ?? null) !== null && !failing.has(k)) as string[];
  reconcileCorrectedSignals(p, { attemptId, passingSkills: passing, passText: 'đạt kỳ vọng' });
}
```
Dòng import 27: thay `caseHasIndependentBasis, retireCaseForCorrectedScore, withdrawSignalsNoLongerValid,` bằng `reconcileCorrectedSignals,`
(xoá import nào `tsc` báo không còn dùng: `notify`, `SIGNAL_WITHDRAW_SCORE_FIXED`… — **chỉ** khi thật sự không còn chỗ dùng trong file).

- [x] **Step 5: `regular.ts`.** Import `reconcileCorrectedSignals` cạnh `raiseSignal` (dòng 3). Trong `refreshRegularOutcome`, ngay sau khối
  `if (r.complete && a.status === 'planned') { … }` (dòng 411–414), **trước** `if (r.sosLevel === null) return r;`:

```ts
  /*
   * RB-8: môn vừa được sửa thành ĐẠT → rút tín hiệu và xử lý Case dựng trên con số sai — CÙNG hàm với Fast Track. Đặt TRƯỚC lối thoát
   * `sosLevel === null`: sửa một môn lên đạt khi ba môn kia chưa có điểm thì chưa kết luận được mức, nhưng căn cứ của tín hiệu đã mất.
   */
  reconcileCorrectedSignals(p, {
    attemptId, passingSkills: r.skills.filter((x) => x.outcome === 'pass').map((x) => x.skill), passText: 'đạt',
  });
```

- [x] **Step 6: Chạy, xanh** (Expected `703`). Phép kiểm cũ `[9.4] …` về FT phải còn ✓ (không đổi hành vi FT, chỉ dời chỗ).
- [x] **Step 7: Commit.** `git commit -am "PR-S1 (10): RB-8 — lớp thường đối soát sau sửa điểm bằng hàm chung với FT; khoá 'không đóng Case vô cớ'"`

---

### Task 11: RB-6 — GVCN không hoàn thành Case môn khác (quyết định 4.15)

**Files:**
- Modify: `server/src/cases/cases.ts:122-124`, `:232-236` (`canCloseCase`), `:1257-1259`, `:2234`
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `canCloseCase(p: Principal, c: { class_id?: number | null; student_id?: number | null; topic?: string | null }): boolean`.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 11. RB-6

  console.log('\nPR-S1 · 11. RB-6 — GVCN chỉ hoàn thành Case đúng môn mình dạy; Quản lý hoàn thành mọi Case trong phạm vi');

  check('RB-6 · GVCN MB-FT 101 (dạy L, R): hoàn thành được Case Listening, KHÔNG được Case Speaking; Quản lý được cả hai; GVBM Speaking không (luật cũ giữ)', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    const mk = (topic: string) => cases.reportIssue(P.mbManager, {
      studentId: hv.sid, topic, title: `Case ${topic} (RB-6)`, summary: 'Case dựng riêng cho phép kiểm quyền hoàn thành Case.',
      primaryCode: domain.issuesForTopic(topic)[0].code, parallel: true,
    }) as any;
    const sp = mk('speaking'), li = mk('listening');
    const ctx = (topic: string) => ({ class_id: hv.cid, student_id: hv.sid, topic });
    assert(cases.canCloseCase(P.coreTeacher, ctx('listening')) === true, 'GVCN phải hoàn thành được Case môn mình dạy');
    assert(cases.canCloseCase(P.coreTeacher, ctx('speaking')) === false, 'GVCN hoàn thành được Case môn khác (4.15)');
    assert(cases.canCloseCase(P.mbManager, ctx('speaking')) === true, 'Quản lý phải hoàn thành được');
    assert(cases.canCloseCase(P.sTeacher, ctx('speaking')) === false, 'GVBM không kiêm GVCN vẫn không hoàn thành Case (luật cũ)');
    assertThrows(() => cases.closeCaseOutcome(P.coreTeacher, sp.id, { outcome: 'improved', note: 'Em đã tiến bộ rõ ở phần nói.' }),
      /Quản lý|GVCN/, 'GVCN hoàn thành Case Speaking qua đường chốt kết quả');
    const card = (cases.skillSupportBoard(P.coreTeacher, hv.sid) as any).rows.flatMap((r: any) => r.cases);
    assert(card.find((x: any) => x.id === sp.id)?.canClose === false && card.find((x: any) => x.id === li.id)?.canClose === true,
      'Thẻ Case phải nói đúng quyền theo môn');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected ✗ ("GVCN hoàn thành được Case môn khác").
- [x] **Step 3: Sửa `canCloseCase`.**

```ts
/**
 * AI HOÀN THÀNH ĐƯỢC CASE — RB-6, quyết định 4.15 (22/09/2026), khớp C02.
 *   · Quản lý / Quản trị trong phạm vi: được.
 *   · GVCN của lớp: CHỈ Case đúng môn mình dạy. Case môn khác thì không, dù là lớp mình chủ nhiệm.
 *   · GVBM không kiêm GVCN: không (giữ luật cũ — 4.15 chỉ hỏi về GVCN).
 * Case không có môn (`topic` rỗng, dữ liệu cũ) thì GVCN vẫn được, để dữ liệu cũ không bị khoá.
 */
export function canCloseCase(p: Principal, c: { class_id?: number | null; student_id?: number | null; topic?: string | null }): boolean {
  if (can(p, PERMISSIONS.MEETING_EDIT, { branchId: null, anyScope: true })) return true;
  if (can(p, PERMISSIONS.CASE_CLOSE, { classId: c.class_id ?? null, studentId: c.student_id ?? null })) return true;
  if (!c.class_id || !isCoreTeacherOf(p, c.class_id)) return false;
  if (!c.topic) return true;
  return can(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.student_id ?? undefined, skill: c.topic });
}
```
Hai câu lỗi (dòng 123 và 1258) đổi thành `'Chỉ Quản lý, hoặc GVCN dạy đúng môn của Case, mới hoàn thành được Case này.'` (giữ chữ "Quản lý"
cho phép kiểm cũ `/chủ nhiệm|Quản lý/`). Dòng 2234: `canClose: canCloseCase(p, { class_id: enr?.class_id ?? null, student_id: studentId, topic: c.topic }),`.

- [x] **Step 4: Chạy, xanh** (Expected `704`). Phép cũ `run.ts:2584-2588` gọi không có `topic` → GVCN vẫn `true` (nhánh dữ liệu cũ) → ✓.
  `PR-D · Thẻ case…` (`run.ts:7720`) dùng Case Listening của GVCN T_HA (dạy L) → ✓. Đỏ khác → 🛑.
- [x] **Step 5: Commit.** `git commit -am "PR-S1 (11): RB-6 — GVCN chỉ hoàn thành Case đúng môn mình dạy (4.15)"`

---

### Task 12: S16 + S17 — một hàm đóng Case bởi hệ thống; kết thúc khoá tự đóng; hàm đổi chương trình cho PR-LT

**Files:**
- Modify: `shared/domain/cases.ts` (sau `DISPOSITION_LABEL`, ~dòng 472)
- Create: `server/src/cases/systemClose.ts`
- Modify: `server/src/cases/effectiveness.ts:~212-218` (chỉ chú thích khối `CHỐT 5` — Q7, không đổi SQL)
- Modify: `server/src/fasttrack/cycles.ts:136-202` (`updateCycle`), `:282-328` (`setOutcome`) — cờ `dongCaseKhiKetThuc`
- Modify: `server/src/students/students.ts:230-258` (`setStudentStatus`)
- Modify: `server/src/cases/cases.ts` (`caseDetail` trả `systemCloseReason`, ~dòng 1500–1550)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces (shared): `SYSTEM_CLOSE_REASONS = ['course_ended', 'moved_to_normal', 'moved_to_ft'] as const`, `type SystemCloseReason`, `SYSTEM_CLOSE_REASON_LABEL`.
- Produces (server, PR-LT sẽ gọi):
  - `export function programmeOfCase(c: { cycle_id?: number | null; category?: string | null; topic?: string | null; attempt_id?: number | null }): 'ratio' | 'band' | null`
  - `export function closeCasesBySystem(input: { actorUserId: number | null; studentId: number; reason: SystemCloseReason; on: string; cycleIds?: number[] | null; programme?: 'ratio' | 'band' | null }): { closedCaseIds: number[]; withdrawnSignalIds: number[] }`
  - `export function closeCasesOnProgrammeSwitch(actorUserId: number | null, studentId: number, to: 'normal' | 'ft', on: string): { closedCaseIds: number[]; withdrawnSignalIds: number[] }`
  - Cờ `dongCaseKhiKetThuc?: boolean` trên `updateCycle(p, id, patch)` và `setOutcome(p, id, input)`: chỉ khi `true` mới đóng Case (S16). PR-LT truyền cờ khi em THÔI HỌC, KHÔNG truyền ở "Lên lớp thường tiếp".

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 12. S16 · S17

  console.log('\nPR-S1 · 12. S16 kết thúc khoá · S17 đổi chương trình — hệ thống tự đóng Case, có audit, xem lại được, PA đã xong vẫn tính hiệu quả');
  const systemClose = await load('../cases/systemClose.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const students: any = await import('../students/students.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  /** Case lớp thường có một PA đã xong (kết quả "Tiến bộ rõ") và một PA chưa làm. */
  const caseCoViec = (hv: HocVien) => {
    diem(hv.attemptId, 'listening', 10, 40);
    const c = caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    const done = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, completed_date, created_at)
      VALUES (?, 'self_study', 'Tự học nghe (PR-S1)', 'completed', ?, ?)`).run(c.id, TODAY, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, note, created_at) VALUES (?,?,?, 'improved', 'Tiến bộ rõ', ?)`)
      .run(c.id, done, TODAY, NOW);
    const open = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, created_at)
      VALUES (?, 'tutor', 'Tutor nghe (PR-S1)', 'planned', ?)`).run(c.id, NOW).lastInsertRowid);
    return { caseId: c.id as number, done, open };
  };
  const auditSys = (caseId: number) => auditN('case.system_close', caseId);

  check('S16 · Hoàn tất lộ trình KHÔNG kèm cờ dongCaseKhiKetThuc (đường "Lên lớp thường tiếp" của PR-LT) → Case vẫn MỞ, đi theo em', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const x = caseCoViec(hv);
    cycles.updateCycle(P.mbManager, hv.cycleId, { status: 'completed' });
    const c = conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(x.caseId) as any;
    assert(c.status !== 'done' && c.r === null, `Hoàn tất lộ trình không cờ đã đóng Case: ${JSON.stringify(c)}`);
    assert(auditSys(x.caseId) === 0, 'Không được có audit đóng bởi hệ thống');
  });

  check('S16 · Kết thúc học (cờ dongCaseKhiKetThuc) còn Case mở → Case đóng "Học viên kết thúc khoá": không có kết quả, PA chưa làm huỷ và KHÔNG tính, PA đã xong giữ và VẪN tính hiệu quả, audit + mốc + hành trình, tín hiệu chờ thu hồi', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const x = caseCoViec(hv);
    diem(hv.attemptId, 'reading', 10, 40);                              // tín hiệu Reading còn chờ
    assert(effectiveness.planOutcomes({ studentIds: [hv.sid] }).some((r: any) => r.id === x.done), 'Tiền đề: PA đã xong phải vào thống kê trước');
    cycles.updateCycle(P.mbManager, hv.cycleId, { status: 'completed', dongCaseKhiKetThuc: true });
    const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(x.caseId) as any;
    assert(c.status === 'done' && c.system_close_reason === 'course_ended' && c.outcome === null && c.closed_at,
      `Case: ${JSON.stringify({ status: c.status, reason: c.system_close_reason, outcome: c.outcome, closedAt: c.closed_at })}`);
    assert(String(c.outcome_note).includes('Học viên kết thúc khoá'), `Ghi chú: ${c.outcome_note}`);
    const iv = (id: number) => conn.prepare('SELECT status, closed_reason FROM case_interventions WHERE id = ?').get(id) as any;
    assert(iv(x.open).status === 'cancelled' && iv(x.open).closed_reason === 'system_closed', `PA chưa làm: ${JSON.stringify(iv(x.open))}`);
    assert(iv(x.done).status === 'completed', 'PA đã xong không được đụng');
    /* Q7 (planning review 22/09): PA đã xong có kết quả thật VẪN tính; chỉ việc đóng và PA bị huỷ vì việc đóng thì không. */
    const plans = effectiveness.planOutcomes({ studentIds: [hv.sid] }) as any[];
    assert(plans.some((r) => r.id === x.done), 'PA đã xong có kết quả thật phải VẪN nằm trong thống kê hiệu quả');
    assert(!plans.some((r) => r.id === x.open), 'PA bị huỷ vì hệ thống đóng Case không được tính');
    assert(auditSys(x.caseId) === 1, 'Thiếu audit case.system_close');
    assert((conn.prepare(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'closed'`).get(x.caseId) as any).n === 1, 'Thiếu mốc đóng');
    assert((conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE ref_table = 'sos_cases' AND ref_id = ? AND event_type = 'case_closed'`).get(x.caseId) as any).n === 1, 'Thiếu mốc hành trình');
    const r = tinHieu(hv.attemptId, 'reading');
    assert(r.status === 'withdrawn' && r.withdrawn_reason === 'Học viên kết thúc khoá', `Tín hiệu chờ: ${JSON.stringify(r)}`);
    const d = cases.caseDetail(P.mbManager, x.caseId) as any;
    assert(d.status === 'done' && d.systemCloseReason === 'course_ended', 'Case đóng bởi hệ thống vẫn phải mở xem lại được, nói rõ lý do');
    const again = systemClose.closeCasesBySystem({ actorUserId: P.admin.userId, studentId: hv.sid, reason: 'course_ended', on: TODAY, cycleIds: [hv.cycleId] });
    assert(again.closedCaseIds.length === 0 && auditSys(x.caseId) === 1, 'Chạy lại không được đóng/ghi thêm');
  });

  check('S16 · Học viên chuyển "Đã kết thúc" → Case mở đóng "Học viên kết thúc khoá"; "Tạm dừng" thì KHÔNG đóng', () => {
    const a = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const xa = caseCoViec(a), xb = caseCoViec(b);
    students.setStudentStatus(P.mbManager, a.sid, 'finished', TODAY, 'Nghỉ học');
    students.setStudentStatus(P.mbManager, b.sid, 'inactive', TODAY, 'Tạm nghỉ ốm');
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    assert(st(xa.caseId).status === 'done' && st(xa.caseId).r === 'course_ended', `Kết thúc: ${JSON.stringify(st(xa.caseId))}`);
    assert(st(xb.caseId).status !== 'done', 'Tạm dừng không được đóng Case');
  });

  check('S16 · FT "Kết luận lộ trình": kèm cờ dongCaseKhiKetThuc (em thôi học) → đóng Case; không cờ (học tiếp) → Case giữ', () => {
    const mk = () => {
      const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
      const c = cases.reportIssue(P.mbManager, {
        studentId: hv.sid, cycleId: hv.cycleId, topic: 'reading', title: 'Reading (S16 FT)', summary: 'Case FT dựng cho phép kiểm kết luận lộ trình.',
        primaryCode: domain.issuesForTopic('reading')[0].code, parallel: true,
      }) as any;
      return { hv, caseId: c.id as number };
    };
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    const keep = mk();
    cycles.setOutcome(P.mbManager, keep.hv.cycleId, { outcome: 'reached', score: 6.5, note: 'Đạt mục tiêu, học tiếp LT2' });
    assert(st(keep.caseId).status !== 'done', 'Kết luận lộ trình không cờ đã đóng Case');
    const end = mk();
    cycles.setOutcome(P.mbManager, end.hv.cycleId, { outcome: 'reached', score: 6.5, note: 'Đạt mục tiêu, thôi học', dongCaseKhiKetThuc: true });
    assert(st(end.caseId).status === 'done' && st(end.caseId).r === 'course_ended', `Kết luận + thôi học: ${JSON.stringify(st(end.caseId))}`);
  });

  check('S17 · Đổi chương trình: sang lớp thường đóng Case FT "Chuyển sang lớp thường"; sang FT đóng Case lớp thường "Chuyển sang Fast Track"; Case chương trình kia giữ', () => {
    const hv = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    const ftCase = cases.reportIssue(P.mbManager, {
      studentId: hv.sid, cycleId: hv.cycleId, topic: 'writing1', title: 'Writing Task 1 (S17)', summary: 'Case FT dựng cho phép kiểm đổi chương trình.',
      primaryCode: domain.issuesForTopic('writing1')[0].code, parallel: true,
    }) as any;
    const normalCycle = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
      VALUES (?, 2, NULL, 'FOU', ?, 'active', ?)`).run(hv.sid, TODAY, NOW).lastInsertRowid);
    const nCase = cases.reportIssue(P.mbManager, {
      studentId: hv.sid, cycleId: normalCycle, topic: 'writing', title: 'Writing lớp thường (S17)', summary: 'Case lớp thường dựng cho phép kiểm đổi chương trình.',
      primaryCode: domain.issuesForTopic('writing')[0].code, parallel: true,
    }) as any;
    assert(systemClose.programmeOfCase(conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(ftCase.id)) === 'band', 'Case W1 phải là FT');
    const r1 = systemClose.closeCasesOnProgrammeSwitch(P.mbManager.userId, hv.sid, 'normal', TODAY);
    const st = (id: number) => conn.prepare('SELECT status, system_close_reason AS r FROM sos_cases WHERE id = ?').get(id) as any;
    assert(r1.closedCaseIds.includes(ftCase.id) && st(ftCase.id).r === 'moved_to_normal', `FT → lớp thường: ${JSON.stringify(st(ftCase.id))}`);
    assert(st(nCase.id).status !== 'done', 'Case lớp thường không được đóng khi em SANG lớp thường');
    assert(domain.SYSTEM_CLOSE_REASON_LABEL.moved_to_normal === 'Chuyển sang lớp thường', 'Không viết "Normal" trên màn (đặc tả §2)');
    systemClose.closeCasesOnProgrammeSwitch(P.mbManager.userId, hv.sid, 'ft', TODAY);
    assert(st(nCase.id).status === 'done' && st(nCase.id).r === 'moved_to_ft', `Lớp thường → FT: ${JSON.stringify(st(nCase.id))}`);
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: phép "không cờ" ✓ (hành vi hiện tại đã giữ Case), bốn phép còn lại ✗ (thiếu mô-đun / Case vẫn mở).
- [x] **Step 3: Nhãn ở `shared/domain/cases.ts`** (sau `DISPOSITION_LABEL`):

```ts
/**
 * HỆ THỐNG TỰ ĐÓNG CASE — S16 (em kết thúc khoá) và S17 (em đổi chương trình), chủ sản phẩm chốt 21/09/2026 đêm; §3.9 bảng luật lộ
 * trình thêm chiều lớp thường → FT. Case đóng kiểu này KHÔNG có kết quả: việc đóng không phải một kết quả hỗ trợ, và PA bị huỷ vì nó
 * không tính. PA đã xong có kết quả thật trước đó VẪN tính hiệu quả (planning review 22/09, Q7). Lịch sử giữ nguyên.
 * Chữ "lớp thường" thay "Normal" theo đặc tả §2 (không viết "Normal" trên màn).
 */
export const SYSTEM_CLOSE_REASONS = ['course_ended', 'moved_to_normal', 'moved_to_ft'] as const;
export type SystemCloseReason = (typeof SYSTEM_CLOSE_REASONS)[number];
export const SYSTEM_CLOSE_REASON_LABEL: Record<SystemCloseReason, string> = {
  course_ended: 'Học viên kết thúc khoá',
  moved_to_normal: 'Chuyển sang lớp thường',
  moved_to_ft: 'Chuyển sang Fast Track',
};
```

- [x] **Step 4: Tạo `server/src/cases/systemClose.ts`.**

```ts
import { db, tx } from '../db.ts';
import { SYSTEM_CLOSE_REASON_LABEL, categoryOf, type SystemCloseReason } from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';

/**
 * HỆ THỐNG TỰ ĐÓNG CASE — nơi DUY NHẤT (S16, S17; bảng luật lộ trình §3.9).
 *
 * Gọi từ (S16 — CHỈ khi em THÔI HỌC): `setStudentStatus(…, 'finished')`; `setOutcome` ("Kết luận lộ trình" FT) và `updateCycle` rời
 * `active` — hai đường này CHỈ khi nơi gọi truyền cờ `dongCaseKhiKetThuc: true`. Luồng "Lên lớp thường tiếp" của PR-LT hoàn tất khoá cũ
 * KHÔNG truyền cờ → Case đi theo em (§3.9). S17: các luồng chuyển lớp khác chương trình của PR-LT gọi `closeCasesOnProgrammeSwitch`.
 *
 * Mỗi Case: đóng (`status = 'done'`, `system_close_reason`), KHÔNG có `outcome`; PA `planned`/`started` → `cancelled` với
 * `closed_reason = 'system_closed'` (không có kết quả → không vào thống kê hiệu quả); PA đã xong giữ nguyên và VẪN tính hiệu quả (Q7);
 * ghi lịch sử, mốc "đóng", hành trình và audit. Tín hiệu còn chờ của cùng phạm vi bị thu hồi với cùng lý do. Chạy lại không làm gì thêm.
 */

/** Không import `normal/regular.ts` ở đây để khỏi vòng import cycles → systemClose → regular → attempts → cycles. */
function ratioOfCycle(cycleId: number | null | undefined): boolean | null {
  if (!cycleId) return null;
  const cy = db()
    .prepare(
      `SELECT cy.route, pg.scoring_mode AS m,
              (SELECT pg2.scoring_mode FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
                 JOIN programmes pg2 ON pg2.code = c.programme_code WHERE a.cycle_id = cy.id LIMIT 1) AS m2
         FROM learning_cycles cy LEFT JOIN programmes pg ON pg.code = cy.programme_code WHERE cy.id = ?`,
    )
    .get(cycleId) as any;
  if (!cy) return null;
  if (cy.route) return false;
  const m = cy.m ?? cy.m2 ?? null;
  return m === null ? null : m === 'ratio';
}

/** Case thuộc chương trình nào: 'ratio' (lớp thường) · 'band' (Fast Track) · null khi không đủ căn cứ — KHÔNG đoán. */
export function programmeOfCase(c: { cycle_id?: number | null; category?: string | null; topic?: string | null; attempt_id?: number | null }): 'ratio' | 'band' | null {
  const byCycle = ratioOfCycle(c.cycle_id);
  if (byCycle !== null) return byCycle ? 'ratio' : 'band';
  const cat = c.category ?? categoryOf(c.topic);
  if (cat === 'writing1' || cat === 'writing2') return 'band';
  if (cat === 'writing') return 'ratio';
  if (c.attempt_id) {
    const r = db()
      .prepare(`SELECT pg.scoring_mode AS m FROM assessment_attempts a JOIN classes cl ON cl.id = a.class_id
                  LEFT JOIN programmes pg ON pg.code = cl.programme_code WHERE a.id = ?`)
      .get(c.attempt_id) as any;
    if (r) return r.m === 'ratio' ? 'ratio' : 'band';
  }
  return null;
}

export function closeCasesBySystem(input: {
  actorUserId: number | null; studentId: number; reason: SystemCloseReason; on: string;
  /** Chỉ Case/tín hiệu của các lộ trình này. Bỏ trống = mọi lộ trình của em. */
  cycleIds?: number[] | null;
  /** Chỉ Case/tín hiệu của chương trình này (S17). Bỏ trống = mọi chương trình. */
  programme?: 'ratio' | 'band' | null;
}): { closedCaseIds: number[]; withdrawnSignalIds: number[] } {
  const conn = db();
  const label = SYSTEM_CLOSE_REASON_LABEL[input.reason];
  const inScope = (cycleId: number | null, row: any) =>
    (!input.cycleIds?.length || (cycleId !== null && input.cycleIds.includes(cycleId)))
    && (!input.programme || programmeOfCase({ ...row, cycle_id: cycleId }) === input.programme);

  const open = (conn
    .prepare(
      `SELECT sc.*, COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) = ? AND sc.status != 'done' ORDER BY sc.id`,
    )
    .all(input.studentId) as any[]).filter((c) => inScope(c.eff_cycle_id ?? null, c));
  const pendingSignals = (conn
    .prepare(`SELECT * FROM case_signals WHERE student_id = ? AND status = 'pending' ORDER BY id`)
    .all(input.studentId) as any[]).filter((s) => inScope(s.cycle_id ?? null, { category: s.category, topic: s.skill, attempt_id: s.attempt_id }));

  if (!open.length && !pendingSignals.length) return { closedCaseIds: [], withdrawnSignalIds: [] };

  return tx(() => {
    const closed: number[] = [];
    for (const c of open) {
      const cancelled = conn
        .prepare(
          `UPDATE case_interventions SET status = 'cancelled', closed_reason = 'system_closed', updated_at = ?
            WHERE case_id = ? AND status IN ('planned', 'started')`,
        )
        .run(nowIso(), c.id).changes;
      const changed = conn
        .prepare(
          `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = NULL, system_close_reason = ?,
                  disposition = COALESCE(disposition, 'other'), disposition_note = COALESCE(disposition_note, ?),
                  outcome_note = ?, dedup_key = NULL, updated_at = ?
            WHERE id = ? AND status != 'done'`,
        )
        .run(input.on, input.reason, label, `Hệ thống tự đóng · ${label}`, nowIso(), c.id).changes;
      if (!changed) continue;
      conn
        .prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', ?, 'done', ?, ?)`)
        .run(c.id, c.status, input.actorUserId, nowIso());
      conn
        .prepare(
          `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
           VALUES (?, 'closed', ?, ?, ?, ?, ?) ON CONFLICT(dedup_key) DO NOTHING`,
        )
        .run(c.id, input.on, `Hệ thống tự đóng · ${label}`, input.actorUserId, nowIso(), `system_close:${c.id}`);
      addJourney({
        studentId: input.studentId, cycleId: c.eff_cycle_id ?? null, eventType: 'case_closed', eventDate: input.on,
        title: `Hệ thống tự đóng Case · ${label}`, detail: null,
        refTable: 'sos_cases', refId: c.id, createdBy: input.actorUserId, dedupKey: `case_system_close:${c.id}`,
      });
      writeAudit({
        actorUserId: input.actorUserId, action: 'case.system_close', entityType: 'sos_case', entityId: c.id, entityLabel: label,
        before: { status: c.status }, after: { status: 'done', reason: input.reason, cancelledPlans: cancelled },
      });
      closed.push(c.id);
    }
    for (const s of pendingSignals) {
      conn
        .prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE id = ? AND status = 'pending'`)
        .run(label, nowIso(), s.id);
      writeAudit({
        actorUserId: input.actorUserId, action: 'signal.withdrawn', entityType: 'case_signal', entityId: s.id, entityLabel: label,
        before: { status: 'pending' }, after: { status: 'withdrawn', reason: label },
      });
    }
    return { closedCaseIds: closed, withdrawnSignalIds: pendingSignals.map((s) => s.id as number) };
  });
}

/** S17 + chiều ngược của §3.9: em sang lớp thường → đóng Case FT; em sang FT → đóng Case lớp thường. PR-LT gọi hàm này. */
export function closeCasesOnProgrammeSwitch(actorUserId: number | null, studentId: number, to: 'normal' | 'ft', on: string) {
  return closeCasesBySystem({
    actorUserId, studentId, on,
    reason: to === 'normal' ? 'moved_to_normal' : 'moved_to_ft',
    programme: to === 'normal' ? 'band' : 'ratio',
  });
}
```

> Kiểm lại cột `journey_events.event_type 'case_closed'` và `case_milestones.dedup_key` có chỉ mục UNIQUE (câu `ON CONFLICT(dedup_key)` ở
> `cases.ts:185-188` dùng y hệt — nên có). Nếu `addJourney` bắt `cycleId` khác kiểu → xem chữ ký ở `platform/audit.ts:27`.

- [x] **Step 5: `effectiveness.ts` — KHÔNG thêm bộ lọc (Q7 đã đổi ở planning review 22/09).** `queryPlans` chỉ lấy PA `status = 'completed'`;
  PA bị hệ thống huỷ (`cancelled`, `system_closed`) tự nằm ngoài, PA đã xong có kết quả thật vẫn tính. Chỉ thêm một câu chú thích vào khối
  `/* CHỐT 5 … */` phía trên câu SQL (không đổi SQL):

```ts
       * S16/S17 (PR-S1): Case HỆ THỐNG tự đóng không có kết quả và PA bị huỷ vì việc đóng (`closed_reason = 'system_closed'`) không
       * phải `completed` — nên tự nằm ngoài. PA đã xong có kết quả thật trước khi đóng VẪN tính (planning review 22/09, Q7).
```
  Phép kiểm S16 ở Step 1 khoá cả hai chiều.

- [x] **Step 6: Gắn S16 — chỉ khi em THÔI HỌC (planning review 22/09, Q6).**

`cycles.ts` `updateCycle` — hoàn tất lộ trình KHÔNG tự đóng Case; chỉ đóng khi nơi gọi truyền cờ tường minh `dongCaseKhiKetThuc: true`
(cờ đọc riêng, không phải cột — `map` bỏ qua khoá lạ nên không lọt vào câu UPDATE). Ngay sau `require_(...)` (dòng 138):

```ts
  if (patch.status !== undefined && !(CYCLE_STATUSES as readonly string[]).includes(String(patch.status))) {
    throw badRequest('Trạng thái lộ trình không hợp lệ.');
  }
  /*
   * S16 CHỈ khi nơi gọi nói rõ "em thôi học" (`dongCaseKhiKetThuc: true`). Luồng "Lên lớp thường tiếp" (PR-LT) hoàn tất khoá cũ mà
   * KHÔNG truyền cờ — Case đi theo em sang khoá mới (§3.9). Không cờ = không đóng gì.
   */
  const closeOnEnd = patch.dongCaseKhiKetThuc === true
    && c.status === 'active' && patch.status !== undefined && patch.status !== 'active';
```
và thay dòng `db().prepare(`UPDATE learning_cycles SET ${sets.join(', ')} WHERE id = ?`).run(...params);` (dòng 159) bằng:

```ts
  tx(() => {
    db().prepare(`UPDATE learning_cycles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    if (patch.status !== undefined && patch.status !== 'active' && c.status === 'active') {
      db().prepare('UPDATE learning_cycles SET ended_at = COALESCE(ended_at, ?) WHERE id = ?').run(demoToday(), cycleId);
    }
    if (closeOnEnd) {
      closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
    }
  });
```

`cycles.ts` `setOutcome` ("Kết luận lộ trình" FT, dòng 282–328) — thêm `dongCaseKhiKetThuc?: boolean;` vào kiểu `input`, và ngay trước `writeAudit(...)`
cuối hàm:

```ts
  /* S16: "Kết luận lộ trình" mà em THÔI HỌC (nơi gọi truyền cờ) → Case còn mở của lộ trình này hệ thống tự đóng. Học tiếp thì không cờ. */
  if (input.dongCaseKhiKetThuc === true) {
    closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
  }
```
Route `PUT /cycles/:id/outcome` và `PATCH /cycles/:id` đã truyền nguyên `req.body` → cờ đi qua không cần sửa route. Nút/lựa chọn "em thôi học" trên
giao diện là của PR-LT (màn Kết luận lộ trình · trạng thái học viên).

Import ở `cycles.ts`: `CYCLE_STATUSES` (từ `shared/domain`), `demoToday` (`'../demoConfig.ts'`), `closeCasesBySystem` (`'../cases/systemClose.ts'`).

`students.ts` `setStudentStatus` — trong `tx(() => { … })`, sau khối `UPDATE enrollments …` (dòng 246–247):

```ts
    /* S16: em KẾT THÚC học → Case còn mở của em hệ thống tự đóng "Học viên kết thúc khoá". Tạm dừng thì không. */
    if (status === 'finished') {
      closeCasesBySystem({ actorUserId: p.userId, studentId, reason: 'course_ended', on: date });
    }
```
Import `closeCasesBySystem` từ `'../cases/systemClose.ts'`. Sửa chú thích đầu hàm (dòng 225–229) — câu "không tự đóng lịch hay case còn dở" giờ
chỉ đúng với **lưu trữ**; viết lại: *"Lưu trữ (archive) là cách ẩn khỏi danh sách, KHÔNG phải trạng thái thứ tư, và không đóng gì. Kết thúc
học (`finished`) thì Case còn mở được hệ thống tự đóng theo S16."*

`caseDetail` (`cases.ts`) — trong object trả về, cạnh `status: c.status,` (~dòng 1510):

```ts
    /** S16/S17: Case do hệ thống tự đóng — mã và nhãn lý do. `null` khi người đóng hoặc chưa đóng. */
    systemCloseReason: c.system_close_reason ?? null,
    systemCloseLabel: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as SystemCloseReason] ?? null : null,
```

- [x] **Step 7: Chạy, xanh** (Expected `709`). Phép kiểm cũ "Ba trạng thái học viên; lưu trữ chỉ ẩn…" (`run.ts:1159`) vẫn ✓ ở bước này (nó
  không gọi `setStudentStatus`); Task 15 viết lại nó.
- [x] **Step 8: Commit.** `git add server/src/cases/systemClose.ts && git commit -am "PR-S1 (12): S16/S17 — một hàm đóng Case bởi hệ thống; thôi học tự đóng (setStudentStatus / cờ dongCaseKhiKetThuc)"`

---

### Task 13: Bộ demo — Vũ Thu Uyên theo S16; ngưỡng 70%

**Files:**
- Modify: `server/src/seed/seed.ts:205-207` (sau `buildJourneys`), import đầu file
- Modify: `server/src/seed/students.ts:16`, `:593`, `:1757-1758` (chuyện kể S24)
- Modify: `server/src/tests/run.ts:8223-8235` (chú thích đối soát 29/28 — chỉ chú thích)
- Test: `server/src/tests/luatMayChu.tests.ts`

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 13. Bộ demo

  console.log('\nPR-S1 · 13. Bộ demo theo luật mới');

  check('S16 · Bộ demo: em đã kết thúc học (Vũ Thu Uyên) không còn Case mở — Case của em đóng "Học viên kết thúc khoá"', () => {
    const rows = conn.prepare(
      `SELECT sc.id, sc.status, sc.system_close_reason AS r FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
        WHERE s.status = 'finished' AND sc.id <= ?`,
    ).all(t.seedMax.sos_cases) as any[];
    assert(rows.length > 0, 'Bộ demo phải có em đã kết thúc học từng có Case');
    assert(rows.every((x) => x.status === 'done'), `Còn Case mở của em đã kết thúc: ${JSON.stringify(rows.filter((x) => x.status !== 'done'))}`);
    assert(rows.some((x) => x.r === 'course_ended'), 'Phải có Case đóng bởi hệ thống "Học viên kết thúc khoá"');
  });

  check('§6 · Bộ demo ghi ngưỡng lớp thường 70% (không còn 60%)', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/seed/students.ts'), 'utf8');
    assert(!/60\s*%/.test(src), 'seed/students.ts còn ghi 60%');
    assert(/≥ 70%/.test(src), 'Thiếu dòng ngưỡng "≥ 70%" ở đầu file');
  });
```

- [ ] **Step 2: Chạy, đỏ.** Expected: cả hai ✗.
- [ ] **Step 3: `seed.ts`** — sau lời gọi `buildJourneys({...})` (dòng 205–207):

```ts
    /*
     * S16 (chốt 21/09 đêm): em đã KẾT THÚC học mà còn Case mở → hệ thống tự đóng "Học viên kết thúc khoá". Bộ demo dựng hành trình
     * thẳng bằng SQL (không qua `setStudentStatus`), nên áp luật ở đây — nếu không bộ demo nói ngược luật (Tổng quan 29 / Thực trạng 28).
     */
    for (const s of conn.prepare(`SELECT id, finished_at FROM students WHERE status = 'finished'`).all() as any[]) {
      closeCasesBySystem({ actorUserId: null, studentId: s.id, reason: 'course_ended', on: s.finished_at ?? DEMO_DATE });
    }
```
Import `closeCasesBySystem` từ `'../cases/systemClose.ts'`. (`DEMO_DATE` đã có trong file — dùng ở dòng 218.)

`students.ts`: dòng 16 `≥ 60%` → `≥ 70%`; dòng 593 `dưới ngưỡng 60% → một case môn W của lớp Normal` → `dưới ngưỡng 70% → một tín hiệu môn W của lớp thường`;
dòng 1757–1758 chuyện kể S24 thay bằng:

```ts
    story: 'ĐÃ KẾT THÚC HỌC. Hồ sơ vẫn tra lại được đầy đủ. Case còn dở của em được HỆ THỐNG tự đóng với lý do '
      + '"Học viên kết thúc khoá" (S16) — xem lại được trong lịch sử, việc đóng không tính là kết quả hỗ trợ.',
```

`run.ts:8223-8235` — thêm một câu cuối vào khối chú thích: *"Từ PR-S1 (S16) bộ demo tự đóng Case của em đã kết thúc học, nên chênh lệch
này về 0; hai điều kiện dưới vẫn giữ để bắt chênh lệch mới."* — **không** đổi assert.

- [ ] **Step 4: Chạy, xanh** (Expected `711`). Phép kiểm ở mục 0 (soi bộ demo) đỏ → đọc: nếu nó khoá số Case mở của bộ demo có tính Case của Uyên
  → cập nhật kỳ vọng và ghi Nhật ký; khác → 🛑.
- [ ] **Step 5: Commit.** `git commit -am "PR-S1 (13): bộ demo — S16 cho em đã kết thúc học (Vũ Thu Uyên), ngưỡng 70%"`

---

### Task 14: RB-3 — chuyển lớp bắt buộc lý do chọn nhanh + lưu ý bàn giao có lựa chọn "Không có lưu ý"

**Files:**
- Modify: `shared/domain/students.ts` (sau `STUDENT_STATUS_LABEL`, dòng ~10)
- Modify: `server/src/students/students.ts:154-223` (`transferStudent`)
- Modify: `server/src/routes/index.ts:1349-1358` (`/students/:id/transfer`)
- Modify: `web/src/modules/students/StudentManagePanel.tsx:336-470` (`TransferForm`)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `TRANSFER_REASONS = ['doi_chi_nhanh', 'doi_lich_hoc', 'xep_lai_trinh_do', 'khac'] as const`, `type TransferReason`,
  `TRANSFER_REASON_LABEL`, `NO_HANDOVER_NOTE = 'Không có lưu ý'`, `transferReasonText(code: unknown, note?: unknown): string | null`;
  `transferStudent(p, studentId, toClassId, effectiveDate, reason: string, handover?: { note?: string | null; noNote?: boolean; receiverUserId?: number | null })`;
  API body `{ toClassId, effectiveDate?, reasonCode, reasonNote?, handoverNote?, noHandoverNote?, receiverUserId? }`.
- `applyTransition` (Chuyển tiếp lớp, `transition.ts:211-217`) đã truyền lý do + ghi chú mặc định khác rỗng → **không đổi**. PR-LT làm lại màn đó.

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 14. RB-3

  console.log('\nPR-S1 · 14. RB-3 — chuyển lớp: lý do bắt buộc (chọn nhanh), lưu ý bàn giao bắt buộc hoặc "Không có lưu ý"');
  const studentsSvc: any = await import('../students/students.ts');
  const targetClass = classId('MB-FT 102');

  check('RB-3 · transferReasonText: bốn lựa chọn đúng chữ; "Khác" phải ghi rõ; mã lạ bị từ chối', () => {
    assert(domain.transferReasonText('doi_lich_hoc') === 'Đổi lịch học', domain.transferReasonText('doi_lich_hoc'));
    assert(domain.transferReasonText('xep_lai_trinh_do', 'Lên lớp cao hơn') === 'Xếp lại trình độ — Lên lớp cao hơn', 'Kèm ghi chú');
    assert(domain.transferReasonText('khac') === null && domain.transferReasonText('khac', '  ') === null, '"Khác" không ghi gì phải bị từ chối');
    assert(domain.transferReasonText('khac', 'Gia đình chuyển nhà') === 'Khác — Gia đình chuyển nhà', 'Khác có ghi chú');
    assert(domain.transferReasonText('bua') === null && domain.transferReasonText(undefined) === null, 'Mã lạ');
    assert(domain.NO_HANDOVER_NOTE === 'Không có lưu ý', 'Chữ lựa chọn');
  });

  check('RB-3 · Không lý do → từ chối; không lưu ý và không chọn "Không có lưu ý" → từ chối; chọn "Không có lưu ý" → chuyển được, hành trình ghi rõ', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, '  '), /lý do/, 'Chuyển lớp không lý do');
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', {}),
      /Không có lưu ý/, 'Chuyển lớp không lưu ý bàn giao');
    studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', { noNote: true });
    const j = conn.prepare(`SELECT detail FROM journey_events WHERE student_id = ? AND event_type = 'transfer' ORDER BY id DESC LIMIT 1`).get(hv.sid) as any;
    assert(j && String(j.detail).includes('Đổi lịch học') && String(j.detail).includes('Không có lưu ý'), `Hành trình: ${j?.detail}`);
  });

  check('RB-3 · Em còn Case mở thì KHÔNG được chọn "Không có lưu ý" — phải ghi bàn giao (Q10)', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    caseTuTinHieu(pGvcnFou, tinHieu(hv.attemptId, 'listening'));
    assertThrows(() => studentsSvc.transferStudent(P.mbManager, hv.sid, targetClass, TODAY, 'Đổi lịch học', { noNote: true }),
      /bàn giao/, 'Còn Case mở mà chọn "Không có lưu ý"');
  });
```

- [ ] **Step 2: Chạy, đỏ.** Expected: ba phép ✗.
- [ ] **Step 3: `shared/domain/students.ts`** (sau `STUDENT_STATUS_LABEL`):

```ts
/**
 * LÝ DO CHUYỂN LỚP — chọn nhanh, BẮT BUỘC (RB-3, rule book §10, quyết định 4.16; đặc tả §3.9 mục 3).
 * Lưu thành chữ vào `enrollments.end_reason` và hành trình. "Khác" phải ghi rõ.
 */
export const TRANSFER_REASONS = ['doi_chi_nhanh', 'doi_lich_hoc', 'xep_lai_trinh_do', 'khac'] as const;
export type TransferReason = (typeof TRANSFER_REASONS)[number];
export const TRANSFER_REASON_LABEL: Record<TransferReason, string> = {
  doi_chi_nhanh: 'Đổi chi nhánh', doi_lich_hoc: 'Đổi lịch học', xep_lai_trinh_do: 'Xếp lại trình độ', khac: 'Khác',
};
/** Lựa chọn rõ ràng khi không có gì cần dặn người nhận lớp (rule book §10). */
export const NO_HANDOVER_NOTE = 'Không có lưu ý';

/** Chữ lý do từ mã + ghi chú. `null` khi mã không hợp lệ hoặc "Khác" mà không ghi gì. */
export function transferReasonText(code: unknown, note?: unknown): string | null {
  if (!(TRANSFER_REASONS as readonly string[]).includes(String(code))) return null;
  const extra = String(note ?? '').trim();
  if (code === 'khac' && !extra) return null;
  const label = TRANSFER_REASON_LABEL[code as TransferReason];
  return extra ? `${label} — ${extra}` : label;
}
```

- [ ] **Step 4: `transferStudent`.** Chữ ký: `reason: string` (bỏ `?`), `handover?: { note?: string | null; noNote?: boolean; receiverUserId?: number | null }`.
  Thay khối từ `const brief = handoverBrief(studentId);` tới hết `if (brief.cases.length > 0 && …) { throw … }` (dòng 170–176) bằng:

```ts
  const why = String(reason ?? '').trim();
  if (!why) throw badRequest('Chọn lý do chuyển lớp.');
  /*
   * LƯU Ý BÀN GIAO BẮT BUỘC, có lựa chọn "Không có lưu ý" (RB-3). Còn Case dở thì KHÔNG được chọn "Không có lưu ý": người nhận lớp
   * đọc đúng dòng này để biết em đang vướng gì (mục 6.4) — plan PR-S1 Q10.
   */
  const brief = handoverBrief(studentId);
  const typed = (handover?.note ?? '').trim();
  if (brief.cases.length > 0 && !typed) {
    throw badRequest(
      `Em còn ${brief.cases.length} case chưa xong. Ghi thông tin bàn giao để người nhận lớp `
      + 'biết em đang vướng gì và đang làm dở đến đâu.',
    );
  }
  if (!typed && !handover?.noNote) throw badRequest(`Ghi lưu ý bàn giao, hoặc chọn "${NO_HANDOVER_NOTE}".`);
  const handoverNote = typed || NO_HANDOVER_NOTE;
```
Trong thân: `end_reason` dùng `why`; `addJourney` `detail: [why, handoverNote].join(' — ')`. Import `NO_HANDOVER_NOTE`.

- [ ] **Step 5: Route** (`routes/index.ts:1349-1358`):

```ts
api.post('/students/:id/transfer', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { toClassId, effectiveDate, reasonCode, reasonNote, handoverNote, noHandoverNote, receiverUserId } = req.body ?? {};
  if (!toClassId) throw badRequest('Cần chọn lớp đích.');
  /* RB-3: lý do chọn nhanh BẮT BUỘC; "Khác" phải ghi rõ. */
  const reason = transferReasonText(reasonCode, reasonNote);
  if (!reason) throw badRequest('Chọn lý do chuyển lớp (chọn "Khác" thì ghi rõ).');
  return studentSvc.transferStudent(principalOf(req), pInt(req, 'id'), Number(toClassId),
    effectiveDate ?? demoToday(), reason, {
      note: handoverNote ?? null,
      noNote: noHandoverNote === true,
      receiverUserId: receiverUserId ? Number(receiverUserId) : null,
    });
}));
```
Import `transferReasonText` từ `shared/domain` ở đầu `routes/index.ts` (cạnh các import domain đang có — kiểm tên khối import).

- [ ] **Step 6: Web `TransferForm`** (`StudentManagePanel.tsx`). Tối thiểu, dùng thành phần sẵn có (`Field`, `select.field`):
  - thay state `reason` bằng `reasonCode` (`''`) + `reasonNote` (`''`); thêm `noNote` (`false`);
  - `import { NO_HANDOVER_NOTE, TRANSFER_REASONS, TRANSFER_REASON_LABEL } from '@shared/domain/index.ts';`
  - thay `<Field label="Lý do">…</Field>` bằng:

```tsx
      <Field label="Lý do" required>
        <select className="field" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
          <option value="">Chọn lý do…</option>
          {TRANSFER_REASONS.map((r) => <option key={r} value={r}>{TRANSFER_REASON_LABEL[r]}</option>)}
        </select>
      </Field>
      {reasonCode === 'khac' && (
        <Field label="Ghi rõ lý do" required>
          <input className="field" value={reasonNote} onChange={(e) => setReasonNote(e.target.value)} />
        </Field>
      )}
```
  - khi `!needHandover` (em không còn Case dở), hiện một ô lưu ý + ô tích:

```tsx
      {!needHandover && (
        <div className="space-y-2">
          <Field label="Lưu ý bàn giao" required={!noNote}>
            <textarea className="field" rows={2} value={handoverNote} disabled={noNote}
              onChange={(e) => setHandoverNote(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={noNote} onChange={(e) => setNoNote(e.target.checked)} />
            {NO_HANDOVER_NOTE}
          </label>
        </div>
      )}
```
  - `submit`: chặn sớm `if (!reasonCode) { toast.push('error', 'Chọn lý do chuyển lớp.'); return; }`; body gửi
    `{ toClassId, effectiveDate: date || undefined, reasonCode, reasonNote: reasonNote || undefined, handoverNote: handoverNote || undefined, noHandoverNote: noNote, receiverUserId: receiverUserId || undefined }`.
  - Không đổi gì khác (bố cục mới của màn chuyển lớp là PR-LT).

- [ ] **Step 7: Chạy.** `npm run typecheck` rồi `npm test 2>&1 | tail -3` — Expected `714`. Phép cũ `run.ts:1150`, `:5320`, `:5330` truyền lý do chữ +
  ghi chú → ✓.
- [ ] **Step 8: Bấm thử** (vai Quản lý MB, `npm run dev` trong worktree): mở hồ sơ một HV → Chuyển lớp → bấm "Chuyển lớp" khi chưa chọn lý do → báo lỗi;
  chọn "Đổi lịch học", tích "Không có lưu ý" → chuyển được. Ghi kết quả vào Nhật ký. (Không chụp màn cho chủ sản phẩm — màn này PR-LT làm lại.)
- [ ] **Step 9: Commit.** `git commit -am "PR-S1 (14): RB-3 — chuyển lớp bắt buộc lý do chọn nhanh + lưu ý bàn giao / 'Không có lưu ý'"`

---

### Task 15: RB-9 — lưu trữ học viên chỉ khi Quản lý bấm

**Files:**
- Modify: `shared/domain/students.ts:12-13` (xoá `ARCHIVE_AFTER_DAYS`)
- Modify: `server/src/students/students.ts:2` (import), `:260-274` (thay `archiveDueStudents`)
- Modify: `server/src/routes/index.ts` (sau route `/students/:id/status`, ~dòng 1368)
- Modify: `server/src/tests/run.ts:1159-1173`
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `archiveStudent(p: Principal, studentId: number)`, `unarchiveStudent(p: Principal, studentId: number)`;
  `POST /api/students/:id/archive`, `POST /api/students/:id/unarchive`. (Nút giao diện: PR-LT — thao tác trạng thái học viên, Q12.)

- [ ] **Step 1: Phép kiểm (đỏ)** — thêm vào `luatMayChu.tests.ts`:

```ts
  // ================================================================== 15. RB-9

  console.log('\nPR-S1 · 15. RB-9 — lưu trữ học viên chỉ khi Quản lý bấm, không có tác vụ ngầm');

  check('RB-9 · Không còn hàm tự lưu trữ sau N ngày; Quản lý lưu trữ / bỏ lưu trữ được em đã kết thúc, có audit; GV không được; em đang học không lưu trữ được', () => {
    assert(!('archiveDueStudents' in studentsSvc) && domain.ARCHIVE_AFTER_DAYS === undefined, 'Còn đường tự lưu trữ sau N ngày');
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    assertThrows(() => studentsSvc.archiveStudent(P.mbManager, hv.sid), /đã kết thúc/, 'Lưu trữ em đang học');
    studentsSvc.setStudentStatus(P.mbManager, hv.sid, 'finished', TODAY, 'Kết thúc');
    assertThrows(() => studentsSvc.archiveStudent(pGvcnFou, hv.sid), /Quản lý/, 'GVCN lưu trữ học viên');
    studentsSvc.archiveStudent(P.mbManager, hv.sid);
    const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(hv.sid) as any;
    assert(s.archived_at && s.status === 'finished', `Lưu trữ phải chỉ ẩn, không đổi trạng thái: ${JSON.stringify(s)}`);
    assert(auditN('student.archive', hv.sid) === 1, 'Thiếu audit lưu trữ');
    studentsSvc.unarchiveStudent(P.mbManager, hv.sid);
    assert((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(hv.sid) as any).archived_at === null, 'Bỏ lưu trữ không có tác dụng');
  });
```

- [ ] **Step 2: Chạy, đỏ.** Expected ✗.
- [ ] **Step 3: Sửa mã.** Xoá `ARCHIVE_AFTER_DAYS` (và chú thích của nó) khỏi `shared/domain/students.ts`; bỏ khỏi import `students.ts:2`
  (và `addDays` nếu không còn dùng). Thay `archiveDueStudents` (dòng 260–274) bằng:

```ts
/**
 * LƯU TRỮ HỌC VIÊN — CHỈ KHI QUẢN LÝ BẤM (RB-9, quyết định 4.17 ngày 22/09/2026).
 *
 * Không có tác vụ ngầm "sau N ngày tự lưu trữ" (hàm `archiveDueStudents` cũ đã gỡ — nó chưa từng được gọi ở đâu ngoài phép kiểm).
 * Lưu trữ chỉ ẩn khỏi danh sách mặc định: không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Chỉ em đã kết thúc học.
 */
export function archiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ lưu trữ được học viên đã kết thúc học.');
  if (s.archived_at) return s;
  const on = demoToday();
  conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(on, studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.archive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: null }, after: { archivedAt: on } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

export function unarchiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới bỏ lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (!s.archived_at) return s;
  conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.unarchive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: s.archived_at }, after: { archivedAt: null } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}
```
Routes (sau `/students/:id/status`):

```ts
/** RB-9: lưu trữ / bỏ lưu trữ — chỉ Quản lý, chỉ em đã kết thúc học. Không có tác vụ ngầm. */
api.post('/students/:id/archive', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.archiveStudent(principalOf(req), pInt(req, 'id'));
}));
api.post('/students/:id/unarchive', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.unarchiveStudent(principalOf(req), pInt(req, 'id'));
}));
```

- [ ] **Step 4: Viết lại phép kiểm cũ** `run.ts:1159-1173` ("Ba trạng thái học viên; lưu trữ chỉ ẩn, không đóng việc còn dở"): thay
  `const n = students.archiveDueStudents(TODAY);` + `assert(n >= 1 && after.archived_at, …)` bằng
  `students.archiveStudent(P.mbManager, s.id);` + `assert(after.archived_at, 'Quản lý bấm lưu trữ thì học viên phải vào lưu trữ');`.
  Học viên `finished` đầu tiên của bộ demo có thể thuộc chi nhánh khác MB → chọn `P.admin` thay `P.mbManager` cho chắc. Giữ nguyên hai assert
  còn lại (không thành trạng thái thứ tư; số Case mở trước/sau lưu trữ bằng nhau — sau Task 13 cả hai là 0, vẫn đúng).
- [ ] **Step 5: Chạy, xanh** (Expected `715`). `grep -rn "archiveDueStudents\|ARCHIVE_AFTER_DAYS" server shared web` — Expected: không còn.
- [ ] **Step 6: Commit.** `git commit -am "PR-S1 (15): RB-9 — lưu trữ học viên chỉ khi Quản lý bấm; gỡ archiveDueStudents"`

---

### Task 16: §6 chữ lớp thường ở máy chủ — `caseHeadline` và `standingLine`

**Files:**
- Modify: `shared/domain/normal.ts:188-212` (`caseHeadline`)
- Modify: `server/src/cases/cases.ts:238-250` (`loadCase` thêm `a.kind AS attempt_kind`), `:1503-1505`, `:1762-1764`
- Modify: `server/src/students/profile.ts:640-665` (câu SELECT thêm `a.kind AS attempt_kind`; truyền `attemptKind`)
- Modify: `server/src/students/standing.ts:34-69` (`Standing.failed`), `:71-87` (`standingLine`), `:90-96` (`EMPTY`), `:198-204` (nhánh lớp thường)
- Test: `server/src/tests/luatMayChu.tests.ts`

**Interfaces:**
- Produces: `caseHeadline(c: { summary?; originKind?; sosLevel?; attemptNo?; attemptKind?: string | null })`; `Standing.failed: number | null`.

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 16. §6 chữ lớp thường

  console.log('\nPR-S1 · 16. §6 — chữ lớp thường ở máy chủ: "Giữa khoá / Cuối khoá", "môn", "Đạt 3/4 môn"; FT giữ nguyên');
  const standing: any = await import('../students/standing.ts');

  check('§6 · caseHeadline lớp thường không ghi "MT{n}" và "kỳ vọng"; FT giữ nguyên', () => {
    const h = (x: any) => domain.caseHeadline({ originKind: 'mock', ...x });
    assert(h({ sosLevel: 2, attemptNo: 1, attemptKind: 'progress' }) === 'Giữa khoá: 2 môn chưa đạt', h({ sosLevel: 2, attemptNo: 1, attemptKind: 'progress' }));
    assert(h({ sosLevel: 0, attemptNo: 2, attemptKind: 'final' }) === 'Cuối khoá: đạt tất cả các môn', h({ sosLevel: 0, attemptNo: 2, attemptKind: 'final' }));
    assert(h({ sosLevel: 3, attemptNo: 2, attemptKind: 'final' }) === 'Cuối khoá: từ 3 môn chưa đạt', 'SOS 3 = từ 3 môn');
    assert(h({ sosLevel: 1, attemptNo: 2, attemptKind: 'mock' }) === 'MT2: 1 kỹ năng dưới kỳ vọng', 'FT phải giữ nguyên');
    assert(h({ sosLevel: 1, attemptNo: 2 }) === 'MT2: 1 kỹ năng dưới kỳ vọng', 'Không truyền attemptKind thì như FT (tương thích)');
  });

  check('§6 · standingLine lớp thường: "Đạt n/4 môn", "khoá này", "môn"; FT giữ "đạt kỳ vọng", "lộ trình này"', () => {
    const base = {
      studentId: 1, cycleId: 1, mode: 'ratio', attemptId: 5, attemptNo: 1, attemptKind: 'progress', attemptLabel: 'Giữa khoá',
      periodCode: null, sosLevel: 0, provisional: false, scored: 4, required: 4, failed: 0,
      nextAttemptNo: null, nextAttemptLabel: null, nextPeriodCode: null, openCases: 0, handoverCases: 0,
    };
    const line = (x: any) => standing.standingLine({ ...base, ...x });
    assert(line({}) === 'Giữa khoá: Đạt 4/4 môn', line({}));
    assert(line({ sosLevel: 1, failed: 1 }) === 'Giữa khoá: Đạt 3/4 môn · SOS 1', line({ sosLevel: 1, failed: 1 }));
    assert(line({ sosLevel: 2, failed: 2, provisional: true, scored: 3 }) === 'Giữa khoá: Đạt 1/4 môn · SOS 2 tạm thời · mới có điểm 3/4 môn',
      line({ sosLevel: 2, failed: 2, provisional: true, scored: 3 }));
    assert(line({ attemptId: null, sosLevel: null, scored: 0 }) === 'Chưa có kết quả trong khoá này', line({ attemptId: null, sosLevel: null, scored: 0 }));
    const ft = { mode: 'ielts_band', attemptLabel: 'MT2', failed: null };
    assert(line({ ...ft }) === 'MT2 đạt kỳ vọng', line({ ...ft }));
    assert(line({ ...ft, attemptId: null, sosLevel: null }) === 'Chưa có kết quả trong lộ trình này', 'FT giữ "lộ trình này"');
  });
```

- [ ] **Step 2: Chạy, đỏ.** Expected: hai phép ✗.
- [ ] **Step 3: `caseHeadline`** — thêm `attemptKind?: string | null;` vào kiểu tham số và thay hai dòng `const where …` / `const derived …`:

```ts
  const level = c.sosLevel ?? null;
  /* LỚP THƯỜNG (đặc tả §2, §6): tên bài "Giữa khoá / Cuối khoá", đếm theo MÔN, không "MT{n}", không "kỳ vọng". */
  const ratio = !!c.attemptKind && c.attemptKind !== 'mock';
  const where = ratio
    ? (ATTEMPT_KIND_SHORT[c.attemptKind as AttemptKind] ?? 'Bài kiểm tra')
    : c.attemptNo ? `MT${c.attemptNo}` : 'Bài đánh giá';
  const derived = level === null ? `${where}: chưa đủ căn cứ kết luận`
    : level === 0 ? (ratio ? `${where}: đạt tất cả các môn` : `${where}: đạt kỳ vọng ở mọi kỹ năng`)
    : ratio ? `${where}: ${level >= 3 ? 'từ 3' : level} môn chưa đạt`
    : `${where}: ${level} kỹ năng dưới kỳ vọng`;
```
Ba nơi gọi truyền `attemptKind`: `cases.ts:1503` → `attemptKind: c.attempt_kind ?? null` (và thêm `a.kind AS attempt_kind,` vào SELECT của
`loadCase`, dòng 244, cạnh `a.attempt_no`); `cases.ts:1762` → `attemptKind: r.attempt_kind ?? null` (câu đã có `a.kind AS attempt_kind`, dòng 1665);
`profile.ts:662` → `attemptKind: c.attempt_kind ?? null` (thêm `a.kind AS attempt_kind` cạnh `a.attempt_no AS attempt_no`, dòng 650).

- [ ] **Step 4: `standing.ts`.** `Standing` thêm sau `required: number;`:
  `/** Lớp thường: số môn chưa đạt của lượt đó (để nói "Đạt 3/4 môn"). FT: null. */ failed: number | null;`;
  `EMPTY` thêm `failed: null,`; nhánh `if (ratio) { … }` (dòng 198–204) thêm `s.failed = r.failedCount;`. `standingLine` thay bằng:

```ts
export function standingLine(s: Standing): string {
  const ratio = s.mode === 'ratio';
  const unit = ratio ? 'môn' : 'kỹ năng';
  let head: string;
  if (s.sosLevel === null) {
    head = s.attemptId === null
      ? (ratio ? 'Chưa có kết quả trong khoá này' : 'Chưa có kết quả trong lộ trình này')
      : `${s.attemptLabel}: chưa đủ điểm để kết luận`;
  } else if (ratio) {
    /* Lớp thường (đặc tả §2): "Đạt 3/4 môn", không "đạt kỳ vọng". Mức SOS vẫn hiện vì hồ sơ cần nó (§3.10). */
    head = `${s.attemptLabel}: Đạt ${s.scored - (s.failed ?? 0)}/${s.required} môn`;
    if (s.sosLevel > 0) head += ` · ${SOS_LABEL[s.sosLevel as 1 | 2 | 3]}${s.provisional ? ' tạm thời' : ''}`;
  } else {
    head = s.sosLevel === 0
      ? `${s.attemptLabel} đạt kỳ vọng`
      : `${s.attemptLabel}: ${SOS_LABEL[s.sosLevel as 1 | 2 | 3]}${s.provisional ? ' tạm thời' : ''}`;
  }
  const parts = [head];
  if (s.provisional) parts.push(`mới có điểm ${s.scored}/${s.required} ${unit}`);
  if (s.openCases > 0) {
    parts.push(s.handoverCases > 0 && s.handoverCases === s.openCases
      ? `${s.handoverCases} case bàn giao`
      : `còn ${s.openCases} case đang theo dõi`);
  }
  return parts.join(' · ');
}
```

- [ ] **Step 5: Chạy, xanh** (Expected `717`). `npm run typecheck` (web có thể đọc `Standing` — trường mới không làm vỡ).
- [ ] **Step 6: Commit.** `git commit -am "PR-S1 (16): §6 — caseHeadline và standingLine đúng chữ lớp thường"`

---

### Task 17: S15 (phép kiểm `workScope` máy chủ trả về) + AN-13 (hai lỗi phép kiểm cũ)

**Files:**
- Test: `server/src/tests/luatMayChu.tests.ts`
- Modify: `server/src/tests/banChinh.tests.ts:44`, `:57`, `:99`, `:106`, `:399`, `:403-406`

- [ ] **Step 1: S15.**

```ts
  // ================================================================== 17. S15

  console.log('\nPR-S1 · 17. S15 — trường workScope máy chủ trả về');
  const classesSvc: any = await import('../classes/classes.ts');

  check('S15 · listClassSummaries: GV có phân công → "mine"; Quản lý → "managed"; truyền phạm vi thì theo phạm vi truyền', () => {
    const gv = (classesSvc.listClassSummaries(P.lrTeacher) as any).rows as any[];
    assert(gv.length > 0 && gv.every((r) => r.workScope === 'mine'), `GV: ${JSON.stringify(gv.map((r) => r.workScope))}`);
    const ql = (classesSvc.listClassSummaries(P.mbManager) as any).rows as any[];
    assert(ql.length > 0 && ql.every((r) => r.workScope === 'managed'), `Quản lý: ${JSON.stringify(ql.map((r) => r.workScope))}`);
    const ep = (classesSvc.listClassSummaries(P.lrTeacher, { scope: 'managed' }) as any).rows as any[];
    assert(ep.every((r) => r.workScope === 'managed'), 'Truyền phạm vi "managed" mà máy chủ vẫn trả "mine"');
  });
```
Run → Expected ✓ ngay (phép kiểm còn thiếu, hành vi đã có). ✗ → 🛑.

- [ ] **Step 2: AN-13 — `banChinh.tests.ts`.**
  - dòng 403–406 (phép "Bộ phép kiểm này KHÔNG BAO GIỜ chạy trên Turso"): `db().name` luôn `""` ở libsql 0.5.29 nên nửa điều kiện này không bao giờ đỏ.
    Thay assert thứ hai bằng:

```ts
    const { DB_PATH, laDbTuXa } = await import('../db.ts');
```
    (đặt ở đầu khối `console.log('\nPR-Z2 · …')` chứa phép này, ngoài `check`), và trong `check`:

```ts
    assert(!laDbTuXa() && !/^libsql:|^https?:|^wss?:/.test(DB_PATH), `Bộ phép kiểm đang mở database từ xa: ${DB_PATH}`);
```
  - dòng 57, 99, 399: `libsql://khong-ton-tai.turso.io` → `libsql://khong-ton-tai.invalid` (tên miền `.invalid` không bao giờ phân giải — một
    chốt hỏng cũng không ra mạng thật). Dòng 106: regex `/^libsql:\/\/khong-ton-tai\.turso\.io\s*$/` → `/^libsql:\/\/khong-ton-tai\.invalid\s*$/`.
  - **Không** đổi các chuỗi `*.turso.io` ở phép kiểm hàm thuần (`cauHinhDb`, `moTaDichDb`, `choPhep…`, `tenKhoTep`) — chúng không mở kết nối và
    `moTaDichDb` nhận dạng theo tên.
  - Kiểm `laDbTuXa` có được export từ `db.ts` (có — `migrate/run.ts` import nó).

- [ ] **Step 3: Chạy, xanh** (Expected `718`). **Step 4: Commit.** `git commit -am "PR-S1 (17): S15 phép kiểm workScope; AN-13 sửa hai lỗi phép kiểm bản chính cũ"`

---

### Task 18: `SkillBoard.tsx:611` — hạn PA học thuật dùng đúng loại

**Files:** Modify: `web/src/modules/cases/SkillBoard.tsx:611`

`action_due` của PA **học thuật** là hạn CẬP NHẬT tuần (`schema.sql:950-963`), không phải "thực hiện xong" của Ý thức.

- [ ] **Step 1:** Đổi `<Han loai="thuc-hien-y-thuc" han={p.actionDue} />` thành `<Han loai="cap-nhat-pa" han={p.actionDue} />`.
- [ ] **Step 2:** `npm run typecheck` — Expected sạch. Bấm thử hồ sơ một HV có Case đang chạy PA: nhãn đọc "Cập nhật kết quả · trước CN dd/mm".
- [ ] **Step 3: Commit.** `git commit -am "PR-S1 (18): SkillBoard — hạn PA học thuật hiện là 'Cập nhật kết quả', không phải hạn Ý thức"`

---

### Task 19: Tài liệu — `policy.ts`, `LUAT_CHO_CHOT.md`, `plan.md`, `CODE_MAP.md` (DOC-2 phần luật)

**Files:** `shared/domain/policy.ts:1-23`, `:55-60`, `:78-85` · `thiet-ke/LUAT_CHO_CHOT.md:3`, `:80`, `:86`, `:156`, `:170` · `plan.md` §22.9 (S11–S17),
§22.10 (dòng C08), bảng nhật ký phiên · `CODE_MAP.md`

- [ ] **Step 1: `policy.ts`.**
  - Khối đầu file (dòng 7–12) thay bằng:

```ts
 * TRẠNG THÁI (cập nhật PR-S1, 22/09/2026):
 *   · NỐI DÂY, mã đọc hằng số:  C02 (quyền máy chủ; RB-6 áp thêm cho "hoàn thành Case") · C10 (chốt ngay).
 *   · ĐÃ CHỐT, khớp hành vi đang chạy: C01 (21/09 — hai mốc riêng) · C06 · C07 · C09.
 *   · HẾT HIỆU LỰC: C03 · C04 (21/09 — bỏ mô hình Case Ý thức) · C05 (21/09 tối — thay bằng Phối hợp SOS, rulebook v3).
 *   · C08: ĐÃ CHỐT 21/09 đêm (lớp thường dùng "-", GV ghi, tự dời tuần sau) — phần "dấu -" CHƯA NỐI DÂY, việc của PR-Rc1 (R14).
```
  - C01 (dòng 15–22): tiêu đề → `C01 — ĐÃ CHỐT 21/09/2026 (nguồn 21/09 §3.2 tự trả lời): hai mốc riêng, khớp mã đang chạy.`; bỏ chữ "← cách hiểu … chờ xác nhận".
  - C05 (dòng 55–59): thêm dòng đầu `C05 — HẾT HIỆU LỰC 21/09/2026 tối: rulebook v3 thay bằng Phối hợp SOS điền sẵn (thiet-ke/SOS_VA_PHOI_HOP_V3.md §5). Giữ hằng số để lịch sử quyết định còn tra được.`
  - C08 (dòng 78–84) thay bằng:

```ts
/**
 * C08 — ĐÃ CHỐT 21/09/2026 đêm. Hạn chấm lớp thường: hết Chủ nhật của chính tuần thi (khớp mã). Lớp thường CÓ dùng dấu "-": GIÁO VIÊN
 * ghi khi em chưa làm bài của tuần (máy không tự thêm); ghi "-" thì môn đó tự dời sang tuần sau.
 * CHƯA NỐI DÂY phần dấu "-": máy chủ còn chặn "-" cho lớp thường (`attempts.ts` saveScore) — việc của PR-Rc1 (plan.md R14, đặc tả §3.5).
 *   'chu-nhat-tuan-thi'  : hết Chủ nhật của tuần thi.  ← đã chốt
 */
```

- [ ] **Step 2: `LUAT_CHO_CHOT.md`.** Dòng 3 thêm một câu: *"**Cập nhật 22/09/2026 (PR-S1):** mọi điểm C01–C10 đã chốt; C08 đóng 21/09 đêm — xem §6.4 và §6.5."*
  Bảng §5 dòng C01 cột "Trạng thái mã" → `Đóng 21/09 — hai mốc riêng (§6.2)`; dòng C08 → `Đóng 21/09 đêm — GV ghi "-", tự dời; phần "-" làm ở PR-Rc1 (R14)`.
  §6.5 dòng C08 → `| C08 | ✅ Đóng 21/09 đêm — lớp thường dùng "-" (GV ghi, tự dời). Mã: PR-Rc1 (R14) |`. §7 dòng C08 → `| **C08** | ✅ Đóng 21/09 đêm (xem §6.4) |`.
  Không xoá chữ cũ ở §1–§4 (luật file: giữ lịch sử câu hỏi).
- [ ] **Step 3: `plan.md`.** §22.9: tick `[x]` S11, S12, S13, S14, S15, S16, S17, mỗi dòng thêm `*(PR-S1)*`; S16 ghi thêm "gắn vào `setStudentStatus('finished')`;
  `setOutcome`/`updateCycle` chỉ khi có cờ `dongCaseKhiKetThuc: true`; hoàn tất khoá không cờ (Lên lớp thường tiếp, PR-LT) giữ Case". §22.10 dòng C08: gạch `~~…~~` và ghi "đóng 21/09 đêm, việc R14 (PR-Rc1)". Thêm **một**
  dòng vào bảng nhật ký phiên (cuối bảng có dòng `Claude (session PR-Z2b …`): ngày, `Claude (session PR-S1, nhánh pr-s1-luat-may-chu, <model>)`, tóm tắt
  (việc đã làm, số phép kiểm 672 → N, quyết định Q1–Q13, việc chuyển cho PR khác: nút Lưu trữ + lựa chọn "em thôi học" (cờ dongCaseKhiKetThuc) → LT, dòng tín hiệu → Pa, luồng gọi S17 → LT, dấu "-" lớp
  thường → Rc1, nửa giao diện F07 → Form).
- [ ] **Step 4: `CODE_MAP.md`.** Thêm một dòng cho `server/src/cases/systemClose.ts` (khối cases) và `server/src/worklist/scoreDebt.ts` (khối worklist),
  theo đúng định dạng dòng lân cận.
- [ ] **Step 5: Commit.** `git commit -am "PR-S1 (19): tài liệu — policy.ts C01/C05/C08, LUAT_CHO_CHOT C08, plan.md S11–S17 + nhật ký, CODE_MAP"`

---

### Task 20: Nghiệm thu, migrate lặp trên bản sao, rà soát, mở PR

- [ ] **Step 1: Chuỗi kiểm đầy đủ.** Run: `npm run check` — Expected: build sạch, `TẤT CẢ ~718 KIỂM TRA ĐỀU ĐẠT`, typecheck sạch. Ghi số vào Nhật ký.
- [ ] **Step 2: Migrate lặp trên BẢN SAO database dev** (không bao giờ trên file gốc, không bao giờ trên Turso). Bash:

```bash
SCR="$(node -e "console.log(require('os').tmpdir())")/pr-s1-migrate"
mkdir -p "$SCR"
node -e "const d=require('libsql'); const db=new d('data/pisa-demo.sqlite'); db.exec(\"VACUUM INTO '\" + process.argv[1].replace(/\\\\/g,'/') + \"'\")" "$SCR/ban-sao.sqlite"
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
```
Expected: lần một có dòng `✓ PR-S1: thêm 2 cột …` (nếu database dev còn cũ) hoặc không có gì; lần hai **không** có dòng PR-S1.
(`VACUUM INTO` vì libsql trên Windows giữ khoá file — bài học PR-Z2b.)
- [ ] **Step 3: Bấm thử ba vai** (`npm run dev` trong worktree, đăng nhập tài khoản demo):
  - GV Listening MB-FOU 12: `GET /api/signals/pending?mine=1` trả tín hiệu có `kind`, `score`, `total`, `actions`; `POST /api/signals/pending/:id/dismiss`
    (DevTools → fetch) → 200, tín hiệu biến khỏi danh sách chờ.
  - Quản lý MB: `GET /api/metrics/tin-hieu-qua-han` trả `n`; hồ sơ HV → Chuyển lớp: bắt chọn lý do.
  - GVCN MB-FT 101: thẻ Case Speaking của một HV lớp mình không còn nút "Hoàn thành case".
  Ghi kết quả (không cần ảnh — màn giao diện của các luật này làm ở PR-Pa/Qa/LT).
- [ ] **Step 4: Rà soát code.** REQUIRED SUB-SKILL: `superpowers:requesting-code-review`. Người rà: **Fable 5.1** (khác model người code). Đưa cho người rà:
  plan này, đặc tả §3.10/§5/§6/§7, bảng Quyết định Q1–Q13, `git diff main...HEAD`. Yêu cầu soi riêng: (a) mọi đường đổi `attempt_skills.sit_status` đều xử lý
  `absent_from_no_show`; (b) `closeCasesBySystem` không đóng nhầm Case khác chương trình / khác khoá; (c) `reportIssue` đổi thứ tự khối không làm hỏng gửi lại
  (`idempotencyKey`); (d) `scoreDebtCells` không chậm trên Turso (đếm số truy vấn cho một chi nhánh). Xử lý phản hồi theo `superpowers:receiving-code-review`.
- [ ] **Step 5: PR.** `git push -u origin pr-s1-luat-may-chu`; `gh pr create` tiêu đề `PR-S1 · Luật máy chủ (S1, S11–S17, RB-3/6/8/9, AN-13, §6)`,
  thân: tóm tắt theo Task, bảng Q1–Q13, số phép kiểm 672 → N, "việc chuyển cho PR khác", dòng `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo chủ sản phẩm bằng tiếng Việt đơn giản: làm gì, còn gì cho đợt sau.

---

## Self-review của người viết plan (22/09/2026, session planning)

**Phủ đặc tả:**
- §3.10 từng môn một tín hiệu, về GV môn đó / GVCN → Task 6 (khoá hành vi có sẵn + Q1). Tạo Case môn đó, điền sẵn điểm → Task 6 (`caseDraft`) + Task 8.
  Bỏ qua, lý do không bắt buộc → Task 7. Không gom → hành vi `mywork` có sẵn (một dòng một tín hiệu), Task 9 khoá. Mức SOS vẫn tính → không đổi.
  Ô "Chờ xác minh quá hạn" → Task 9. FT giữ tự tạo Case → Task 7 (từ chối Bỏ qua FT), không đụng `sos.ts`.
- §3.9 bảng: chỉ dòng "Lớp thường → FT: tự đóng" + S17 → Task 12 (`closeCasesOnProgrammeSwitch`). Các dòng khác = PR-LT.
- §5: 4.4 → Task 7; 4.5 → Task 3; 4.15 → Task 11; 4.16 → Task 14; 4.17 → Task 15; "S1 lý do không bắt buộc" → Task 7.
- §6 dòng S1: branchpulse → Task 4; worklist/signals → Task 5; `caseHeadline` → Task 16; `standingLine` → Task 16; seed 60/70 → Task 13.
- Kiểm kê: S11 T2 · S12 T4 · S13 T3 · S14 T3 · S15 T17 · S16 T12+T13 · S17 T12 · RB-3 T14 · RB-6 T11 · RB-8 T10 · RB-9 T15 · AN-13 T17 · DOC-2 (phần luật) T2+T19.
- Thêm theo yêu cầu: "Case từ SOS không đóng vô cớ" → Task 10 phép 4; `SkillBoard.tsx:611` → Task 18.

**Kiểu thống nhất:** `SignalAction`, `SignalView.kind/score/total/actions/caseDraft` (T6) dùng ở T7, T9; `loadSignal` (T6) dùng ở T8;
`SystemCloseReason`/`SYSTEM_CLOSE_REASON_LABEL` (T12) dùng ở T12, T13; `closeCasesBySystem` chữ ký giống nhau ở T12 (cycles, students), T13 (seed);
`reconcileCorrectedSignals` (T10) dùng ở attempts + regular; `canCloseCase` thêm `topic` (T11); `transferReasonText` (T14) dùng ở route; `scoreDebtCells(p, today, branchIds)` (T4).

**Số phép kiểm dự kiến:** 672 + 5 (T1) + 3 (T2) + 2 (T3) + 3 (T4) + 2 (T5) + 3 (T6) + 3 (T7) + 4 (T8) + 2 (T9) + 4 (T10) + 1 (T11) + 5 (T12) + 2 (T13) + 3 (T14)
+ 1 (T15) + 2 (T16) + 1 (T17) = **718**. Con số "Expected" ở từng Task là cộng dồn; lệch ±1 do chia phép khác → ghi Nhật ký, không phải lỗi.

**Rủi ro đã biết:** (1) Task 4 — `scoreDebtCells` gọi `skillCells` từng lượt (có bộ nhớ đệm `pendingMovesFor`); trên Turso đo ở PR-Z2c Step 5. (2) Task 8 — đổi
thứ tự khối trong `reportIssue` dễ sai; phép kiểm cũ `[6.2]` + `PR-D` + bốn phép mới bao phủ. (3) Task 13 — áp S16 trong seed có thể đổi số Case mở của bộ demo mà
một phép kiểm mục 0 khoá; hướng xử lý đã ghi ở Step 4.

---

## Nhật ký thực thi

| Ngày | Task | Ghi chú (model người code · số phép kiểm · lệch plan · quyết định tại chỗ) |
|---|---|---|
| | | |
