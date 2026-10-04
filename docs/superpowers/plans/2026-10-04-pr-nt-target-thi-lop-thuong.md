# PR-NT · Target + Dự kiến thi cho lớp thường, dán không cần tiêu đề — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Theo quyết định chủ sản phẩm 04/10: học viên lớp thường (chấm theo tỷ lệ, `scoring_mode = 'ratio'`) **cũng có Target và Dự kiến thi** (ngày hoặc tháng). Hai thông tin này nhập được ở (a) Thêm học viên: lưới, dán từ Excel và xem trước/ghi; (b) panel Thông tin HV của em lớp thường. Đổi Target bắt ghi lý do và cần quyền `CYCLE_EDIT`, giống FT `reviseTarget`. (c) Thông tin này hiện ở đầu hồ sơ. **Target trên lộ trình lớp thường KHÔNG bật bất cứ logic FT nào**: kỳ vọng, SOS, lịch MT, Case tự động, bảng phân tích FT. Cùng PR (yêu cầu bổ sung 04/10): dán từ Excel **không bắt buộc hàng tiêu đề**. Không có tiêu đề thì đọc theo thứ tự cột đang hiện trên lưới, và người dùng đổi cách đọc được.

**Architecture:** Không migrate. `learning_cycles` đã có `target_score`, `khong_cam_ket`, `exam_month`, `exam_date`, `exam_period_id`, và `commitIntake` (`server/src/classes/intake.ts:477-490`) đã ghi các cột này cho mọi em. Sửa gồm: luật thuần `shared/domain/nhapHocVien.ts` (bộ cột lớp thường thêm `target`, `examDate`; hàm mới `docDongDan` đoán tiêu đề); máy chủ `intake.ts:261-285` (bỏ nhánh "Bỏ qua" cho target/examDate khi `ratio`, giữ nguyên cho band đầu vào và `daThiToiMt`); `parsePaste` nhận `classId` + `coTieuDe`; `students/profile.ts:497-498` trả target/dự kiến thi cho lớp thường. Web: `IntakePanel`, `ThongTinPanel` (`StudentManagePanel.tsx:234-345`), `DauHoSo.tsx`. Mọi chỗ FT đọc `target_score`/`examPlanOf`/`expectationFor` đã được rà (bảng ở NT-2). Chỗ nào chưa chặn theo chương trình thì thêm điều kiện chặn, kèm phép kiểm.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/). Phép kiểm `server/src/tests/*.tests.ts` chạy qua `run.ts`. `npm run check` = build + test + typecheck.

**Spec:** Quyết định chủ sản phẩm 04/10 (thay K2-41 và câu "lớp thường: Họ tên · Ngày sinh · Email · Tuần bắt đầu" của YC-5.2). Yêu cầu bổ sung 04/10: dán không cần tiêu đề. Rulebook `thiet-ke/PISA-Rulebook-2026-09-19.md` §10 dòng 255 ("mục tiêu/lộ trình/thi dự kiến phù hợp chương trình") và §20.1 dòng 655 (#14). Tiêu chí ở mục **Nghiệm thu**.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro, bảng màu, bố cục lưới Thêm học viên và panel Thông tin HV. Thời gian trên màn: Dự kiến thi là **ngày thi** nên ghi ngày (dd/mm/yyyy) hoặc tháng (`06/2027`), đúng như FT. Tuần vẫn dùng mã tuần `W2 OCT`.
- **Không có tác dụng phụ FT.** Lộ trình lớp thường có Target không được: tính kỳ vọng MT, sinh SOS/Case/PA quy chế/Phối hợp, xếp MT, vào việc "Thiếu Target" của GVCN, vào bảng/tỷ lệ phân tích FT. Mỗi chỗ phải có phép kiểm ở `prNt.tests.ts`.
- Điểm đầu vào IELTS (OVR, L, R, W, S) và `daThiToiMt` **vẫn chỉ FT**. Lớp thường dán các cột này vào thì vẫn là lưu ý "Bỏ qua — …" như cũ.
- Đổi Target luôn đi qua `reviseTarget` (`server/src/fasttrack/cycles.ts:486`): bắt lý do, cần `CYCLE_EDIT`, ghi `cycle_target_revisions` + Hành trình. GVCN không có `CYCLE_EDIT` thì thấy Target ở dạng chỉ đọc, kèm lối "Đề xuất sửa" sẵn có. Dự kiến thi giữ `STUDENT_EDIT` (Q7, `cycles.ts:228`).
- Chống mất dữ liệu khi dán: dòng đầu là học viên thật thì **không bao giờ bị nuốt** làm tiêu đề. Khi đoán, máy chủ trả rõ cách đã đọc, và người dùng đổi được bằng một nút.
- Không bớt kiểm tra dữ liệu nhập (band 0–9 bước 0,5 hoặc KCK; ngày/tháng thi trong cận năm), phân quyền, bảo mật.
- Không migrate (đã kiểm: mọi cột cần dùng đều có sẵn trong `learning_cycles`). Chạy song song wave 1 với GVa/GVb/BC/LM được, vì không đụng file migrate, `schema.sql`, `tasks`, `mgmttasks`, `meeting`, `cases.ts`. Trước khi mở PR: rebase lên main mới nhất, gỡ xung đột ở cuối `run.ts` và `CODE_MAP.md`.
- Phép kiểm mới ở `server/src/tests/prNt.tests.ts`. Import và gọi ở **cuối** `server/src/tests/run.ts`, sau khối PR-PH (`run.ts:9057-9058`) và trước dòng tổng kết `console.log('='.repeat(60))`. Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts` (`nhapHocVien.ts` đã được export, chỉ kiểm lại). Thêm file thì cập nhật `CODE_MAP.md` trong cùng commit.
- Chữ trên màn bằng tiếng Việt, nói rõ phải làm gì tiếp. Luật S3 nút: Đóng / Huỷ thay đổi.
- Xong PR: đánh dấu `[x]`, thêm một dòng ở mục 14 `plan.md`, mở PR (không merge). Mô tả PR liệt kê mọi chú thích `ponytail:` và bảng rà FT ở NT-2.
- Bấm thử 375 và 1440, sáng và tối, với 3 vai: toàn hệ thống, QL chi nhánh, GVCN.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `/ponytail lite` (PR có sửa giao diện). Thực hiện bằng `anthropic-skills:subagent-driven-development` |
| Mỗi task | `anthropic-skills:test-driven-development`: kiểm đỏ trên DB test trước, rồi sửa đến xanh |
| NT-3 (lưới + ô dán), NT-4 (panel Thông tin HV), NT-5 (đầu hồ sơ) | `/impeccable layout` cho cột/ô mới · `/impeccable clarify` cho chữ hướng dẫn ô dán, dòng "Đã đọc theo thứ tự cột…", nút "Dòng đầu là tiêu đề?", chữ lý do đổi Target. Chỉ trong phạm vi PR |
| Trước khi báo xong mỗi task | `anthropic-skills:verification-before-completion`: chạy `npm run check` và đọc kết quả |
| Cuối PR | `/impeccable audit`, rồi `/ponytail-review` (liệt kê chú thích `ponytail:`), rồi `anthropic-skills:requesting-code-review`, rồi `anthropic-skills:finishing-a-development-branch` (mở PR, không merge) |

---

### Task NT-1: Luật cột + Thêm học viên nhận Target / Dự kiến thi cho lớp thường
Skill: test-driven-development · verification-before-completion.

**Files:**
- Create: `server/src/tests/prNt.tests.ts`
- Modify: `shared/domain/nhapHocVien.ts:111-124` (`COT_FT` tách `COT_MUC_TIEU`, `cotLuoiNhap`, chú thích K2-41); `server/src/classes/intake.ts:28` (chú thích), `:254-285` (nhánh `ratio` của target/examDate); `server/src/tests/prNhap.tests.ts:47-52` (kiểm "lớp thường 4 cột" đổi thành 6), `:108-113` (kiểm "cột FT dán vào chỉ là lưu ý": target/examDate nay được nhận, OVR vẫn lưu ý); `server/src/tests/run.ts` (cuối file); `CODE_MAP.md`.

**Interfaces:**
```ts
// shared/domain/nhapHocVien.ts
const COT_MUC_TIEU: CotLuoi[] = [{ key: 'target', nhan: 'Target', so: true }, { key: 'examDate', nhan: 'Dự kiến thi' }];
/** Quyết định chủ sản phẩm 04/10 (thay K2-41). FT: Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Dự kiến thi · Đã thi tới MT · Tuần bắt đầu.
 *  Lớp thường: Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần bắt đầu. */
export const cotLuoiNhap = (lopThuong: boolean): CotLuoi[] =>
  lopThuong ? [...COT_DAU, ...COT_MUC_TIEU, COT_TUAN] : [...COT_DAU, ...COT_BAND, ...COT_MUC_TIEU, COT_DA_THI, COT_TUAN];
```
(`COT_BAND` = 5 cột OVR/L/R/W/S, `COT_DA_THI` = `daThiToiMt`. Thứ tự FT giữ y nguyên. `nhanCotNhap` vẫn tra trên đủ bộ cột.)

- [x] **Bước 1: Viết phép kiểm đỏ** `server/src/tests/prNt.tests.ts` (cùng mẫu với `prNhap.tests.ts`):
```ts
/** PHÉP KIỂM PR-NT — Target + Dự kiến thi lớp thường (chủ sản phẩm 04/10), không tác dụng phụ FT, dán không cần tiêu đề. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNtTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  console.log('\nPR-NT · Target + Dự kiến thi lớp thường');
  const thuong = (conn.prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
                                 WHERE pg.scoring_mode = 'ratio' AND c.status = 'active' AND c.start_date IS NOT NULL LIMIT 1`).get() as any).id;
  const ft = (conn.prepare(`SELECT id FROM classes WHERE is_fast_track = 1 AND route IS NOT NULL AND status = 'active' LIMIT 1`).get() as any).id;

  check('NT-1 · cotLuoiNhap: lớp thường 6 cột có Target + Dự kiến thi; FT giữ 12 cột cũ', () => {
    const th = d.cotLuoiNhap(true).map((c) => c.key).join(',');
    assert(th === 'fullName,dob,email,target,examDate,startWeek', th);
    const f = d.cotLuoiNhap(false).map((c) => c.key).join(',');
    assert(f === 'fullName,dob,email,baselineScore,entryListening,entryReading,entryWriting,entrySpeaking,target,examDate,daThiToiMt,startWeek', f);
  });

  check('NT-1 · previewIntake lớp thường: nhận Target/KCK/ngày/tháng thi; band + Đã thi tới MT vẫn "Bỏ qua"', () => {
    const pv = intake.previewIntake(P.admin, { classId: thuong, rows: [
      { fullName: 'NT A', email: 'nt-a@demo.test', target: '6.5', examDate: '05/2027', baselineScore: '5', daThiToiMt: '2' },
      { fullName: 'NT B', email: 'nt-b@demo.test', target: 'KCK', examDate: '15/06/2027' },
      { fullName: 'NT C', email: 'nt-c@demo.test', target: '6.3' },
      { fullName: 'NT D', email: 'nt-d@demo.test', examDate: '13/2027' },
    ] });
    const [a, b, c, dd] = pv.rows;
    assert(a.target === 6.5 && a.examDate === '2027-05', JSON.stringify(a));
    assert(a.baselineScore === null && a.issues.some((i: any) => i.field === 'baselineScore' && i.muc === 'luu_y'), 'band vẫn bỏ qua');
    assert(a.issues.some((i: any) => i.field === 'daThiToiMt' && i.muc === 'luu_y'), 'daThiToiMt vẫn bỏ qua');
    assert(!a.issues.some((i: any) => i.field === 'target' || i.field === 'examDate'), JSON.stringify(a.issues));
    assert(b.target === 'KCK' && b.examDate === '2027-06-15', JSON.stringify(b));
    assert(c.issues.some((i: any) => i.field === 'target' && i.muc === 'loi'), 'band lẻ phải lỗi');
    assert(dd.issues.some((i: any) => i.field === 'examDate' && i.muc === 'loi'), 'tháng 13 phải lỗi');
  });

  check('NT-1 · commitIntake lớp thường ghi target_score / khong_cam_ket / exam_* lên learning_cycles', () => {
    const r = intake.commitIntake(P.admin, { classId: thuong, idempotencyKey: 'nt-1-ghi', rows: [
      { fullName: 'NT Ghi 1', email: 'nt-ghi1@demo.test', target: '6', examDate: '20/05/2027' },
      { fullName: 'NT Ghi 2', email: 'nt-ghi2@demo.test', target: 'KCK', examDate: '07/2027' },
    ] });
    const cy = (email: string) => conn.prepare(`SELECT cy.* FROM learning_cycles cy JOIN students s ON s.id = cy.student_id WHERE s.email = ?`).get(email) as any;
    const c1 = cy('nt-ghi1@demo.test'), c2 = cy('nt-ghi2@demo.test');
    assert(r.created?.length === 2 || r.ok === 2 || !!c1, JSON.stringify(r));   // đọc đúng tên trường kết quả trong intake.ts khi viết
    assert(c1.target_score === 6 && c1.khong_cam_ket === 0 && c1.exam_date === '2027-05-20' && c1.exam_month === '2027-05' && c1.exam_period_id, JSON.stringify(c1));
    assert(c2.target_score === null && c2.khong_cam_ket === 1 && c2.exam_month === '2027-07' && c2.exam_date === null, JSON.stringify(c2));
    assert(c1.route === null || c1.route === undefined, 'lớp thường không có route — điều kiện chặn FT ở NT-2 dựa vào đây');
  });
}
```
Ở `run.ts`, sau dòng `runPrPhTests({ check, assert });` (~9058):
```ts
const { runPrNtTests } = await import('./prNt.tests.ts');
await runPrNtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```
Chạy `npm run check` → 3 kiểm NT-1 đỏ. Kiểm `prNhap` cũ (dòng 47, 108) sẽ đỏ sau khi sửa: cập nhật theo luật mới, trong cùng commit.
- [x] **Bước 2: Sửa `nhapHocVien.ts`** theo Interfaces. Đổi chú thích dòng 120-122 thành "Quyết định chủ sản phẩm 04/10 (thay K2-41)…".
- [x] **Bước 3: Sửa `intake.ts:261-277`.** Bỏ hai câu `if (ratio) { … luuY('target', 'Bỏ qua — lớp thường không có Target') }` và `if (ratio) { … luuY('examDate', 'Bỏ qua — lớp thường chưa thi IELTS') }`. Target và examDate dùng chung một nhánh cho mọi lớp. Riêng câu lưu ý "Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng…" chỉ hiện cho FT. Lớp thường để trống Target thì **không** có lưu ý, vì lớp thường không có kỳ vọng:
```ts
    let target: number | typeof KCK | null = null;
    if (laKck(r.target)) target = KCK;
    else {
      const t = bandOf(r.target);
      if (t === 'invalid') loi('target', 'Gõ band 0–9, bước 0,5 (ví dụ 6.5), hoặc KCK nếu em không cam kết');
      else if (t === null) { if (!ratio) luuY('target', 'Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng. Em không cam kết đầu ra thì gõ KCK'); }
      else target = t;
    }
    let examDate: string | undefined;
    { const t = docNgayNhap(r.examDate, homNay, { choThang: true, toiThieu: homNay, toiDa: canNamGan(homNay).toiDa });
      if (t.loi) loi('examDate', t.loi); else examDate = t.iso ?? undefined; }
```
Sửa chú thích khối dòng 254-256 thành "OVR, BỐN BAND, ĐÃ THI TỚI MT — chỉ Fast Track. Target, Dự kiến thi — mọi lớp (chủ sản phẩm 04/10)". Sửa chú thích dòng 28. Không đụng `:477-490`, vì câu INSERT đã ghi target/exam cho mọi em.
- [x] **Bước 4:** `npm run check` xanh (gồm kiểm prNhap đã cập nhật).
- [x] **Bước 5: Commit** `PR-NT-1: Thêm học viên lớp thường nhận Target + Dự kiến thi (chủ sản phẩm 04/10)`.

---

### Task NT-2: Rà và chặn tác dụng phụ FT
Skill: test-driven-development · systematic-debugging (nếu kiểm đỏ ở chỗ chưa chặn) · verification-before-completion.

**Files:**
- Modify: `server/src/tests/prNt.tests.ts`. Chỉ sửa nguồn ở chỗ kiểm đỏ (dự kiến: `server/src/worklist/mywork.ts:895`, `server/src/cases/sosAuto.ts:54-63` nếu PA lớp thường lấy hạn "đến lúc thi" từ `examDateOf`).

**Bảng rà (session code xác minh lại từng dòng và chép bảng vào mô tả PR):**
| Chỗ | Đọc gì | Đã chặn bằng | Việc |
|---|---|---|---|
| `fasttrack/scoring.ts:110` `expectationFor` + `:166` | target | chỉ gọi cho lượt `mock` | kiểm |
| `classes/phanTichLop.ts:135-147` `danhGiaMon` | mucTieu | `prog.scoringMode === 'ratio'` trả trước, không dùng target | kiểm |
| `phanTich/giaoVien.ts:217` | target_score | qua `danhGiaMon` | kiểm |
| `phanTich/tongHop.ts:216`, `cases/cases.ts:2194`, `students/standing.ts:246` | target_at_attempt | lượt mock FT | kiểm: lượt lớp thường có `target_at_attempt` NULL |
| `classes/schedule.ts:226` (ghi `target_at_attempt` khi xếp MT) | target_score | chỉ chạy cho lộ trình có route (FT) | kiểm: không có lượt `mock` nào cho em lớp thường |
| `classes/schedule.ts:694` (thiếu target → "thiếu thông tin") | target | xác minh chỉ FT | kiểm |
| `students/profile.ts:438` `kyVong` | target | `nextA.mode === 'ratio'` → null | kiểm |
| `worklist/mywork.ts:895` việc "Thiếu Target" của GVCN | target IS NULL | `cy.route IS NOT NULL` (lớp thường route NULL) | kiểm. Nếu lớp thường có route thì thêm `AND c.is_fast_track = 1` |
| `cases/sosAuto.ts:54-63` `examDateOf` (mốc PA "đến lúc thi") | exam_* | PA quy chế chỉ từ Mock FT | kiểm: PA lớp thường (Giữa khoá, Bổ trợ) không lấy ngày thi làm mốc |
| `classes/luatLoTrinh.ts:265` | target cũ | `tuLop.ft && denLop.ft` | Ghi trong báo cáo: lên lớp thường tiếp **không** mang Target theo. Hỏi chủ sản phẩm có muốn mang theo không, không tự đổi |
| `classes/hocVienLop.ts:110,215`, `classes/classes.ts:609-632` | target, examPlan | chỉ hiển thị | để NT-5 |
| `cases/sos.ts` `isFastTrackMock` | — | kind mock + FT | kiểm qua SOS tổng |

- [x] **Bước 1: Viết phép kiểm đỏ/xanh** (thêm vào `runPrNtTests`). Dùng em `nt-ghi1@demo.test` (Target 6, thi 20/05/2027) từ NT-1:
```ts
  const em = conn.prepare(`SELECT s.id AS sid, cy.id AS cid FROM students s JOIN learning_cycles cy ON cy.student_id = s.id WHERE s.email = 'nt-ghi1@demo.test'`).get() as any;
  const prof: any = await import('../students/profile.ts');
  const mw: any = await import('../worklist/mywork.ts');

  check('NT-2 · em lớp thường có Target: không có lượt MT, không target_at_attempt, không Case/PA tự động', () => {
    const mt = (conn.prepare(`SELECT COUNT(*) n FROM test_attempts WHERE cycle_id = ? AND kind = 'mock'`).get(em.cid) as any).n;
    assert(mt === 0, `có ${mt} lượt MT cho em lớp thường`);
    const kv = (conn.prepare(`SELECT COUNT(*) n FROM test_attempts WHERE cycle_id = ? AND target_at_attempt IS NOT NULL`).get(em.cid) as any).n;
    assert(kv === 0, 'không lượt nào được chụp target');
    const cs = (conn.prepare(`SELECT COUNT(*) n FROM cases WHERE student_id = ?`).get(em.sid) as any).n;
    assert(cs === 0, 'không Case tự động');
  });

  check('NT-2 · hồ sơ em lớp thường: không có kỳ vọng MT', () => {
    const h = prof.studentProfile(P.admin, em.sid);           // dùng đúng tên hàm hồ sơ trong profile.ts
    assert(JSON.stringify(h).indexOf('"kyVong":') === -1 || !/"kyVong":\s*\d/.test(JSON.stringify(h)), 'kyVong phải null');
  });

  check('NT-2 · danhGiaMon lượt lớp thường không đọc target', async () => {
    const plt: any = await import('../classes/phanTichLop.ts');
    const prog = { scoringMode: 'ratio', skills: ['L', 'R'], code: 'FOU' } as any;
    const a = { kind: 'progress', attempt_no: 1, route: null };
    const x = plt.danhGiaMon(a, [], prog, 6.5), y = plt.danhGiaMon(a, [], prog, null);
    assert(JSON.stringify(x) === JSON.stringify(y), 'target không được đổi kết quả lớp thường');
  });

  check('NT-2 · Công việc GVCN: em lớp thường thiếu Target KHÔNG thành việc "Thiếu Target"', () => {
    conn.prepare('UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 0 WHERE id = ?').run(em.cid);
    try {
      const w = mw.myWork(P.admin, {});                         // dùng đúng tên/tham số trong mywork.ts
      assert(!JSON.stringify(w).includes('NT Ghi 1'), 'em lớp thường lọt vào việc thiếu Target');
    } finally { conn.prepare('UPDATE learning_cycles SET target_score = 6 WHERE id = ?').run(em.cid); }
  });

  check('NT-2 · PA lớp thường không lấy ngày thi làm mốc', () => {
    // Tạo Case Giữa khoá lớp thường cho em (dùng helper đang có trong prLt2*.tests.ts), xác nhận PA, rồi assert mốc PA != exam_date của em.
  });
```
Bước cuối (PA) chép khung tạo Case Giữa khoá lớp thường từ phép kiểm PR-LT2 hiện có (`grep -n "Giữa khoá" server/src/tests/*.ts`). Chạy và ghi lại kiểm nào đỏ.
- [x] **Bước 2: Chặn chỗ đỏ** theo nguyên nhân. Điều kiện chặn theo **chương trình** (`classes.is_fast_track` / `programmes.scoring_mode`), không theo việc "có target hay không". Mỗi điều kiện thêm vào thì ghi chú thích `/* PR-NT: Target lớp thường không bật FT (chủ sản phẩm 04/10) */`.
- [x] **Bước 3:** `npm run check` xanh. Chép bảng rà, có cột "kết quả", vào nháp mô tả PR.
- [x] **Bước 4: Commit** `PR-NT-2: Target lớp thường không bật logic FT — rà + phép kiểm`.

---

### Task NT-3: Dán từ Excel không cần hàng tiêu đề (yêu cầu bổ sung 04/10)
Skill: test-driven-development · `/impeccable clarify` (chữ ô dán) · `/impeccable layout` (lưới lớp thường 6 cột) · verification-before-completion.

**Files:**
- Modify: `shared/domain/nhapHocVien.ts` (thêm `laDongTieuDe`, `docDongDan`); `server/src/classes/intake.ts:136-156` (`parsePaste`); `server/src/routes/index.ts:1135-1139` (truyền `classId`, `coTieuDe`); `web/src/modules/students/IntakePanel.tsx:87-105, 153, 241` (gửi classId, dòng "Đã đọc…", nút đổi, `minWidth` lớp thường); `server/src/tests/prNt.tests.ts`.

**Interfaces:**
```ts
// shared/domain/nhapHocVien.ts
/** Dòng đầu là tiêu đề khi: có ô khớp "Họ và tên" HOẶC ≥ 2 ô khớp tên cột đã biết, VÀ không ô nào trông như dữ liệu
 *  (email có @, ngày dd/mm/yyyy, band số). Tên người như "Nguyễn Văn An" không khớp tên cột nào → không phải tiêu đề. */
export function laDongTieuDe(o: string[]): boolean;
export type CachDoc = { coTieuDe: boolean; daDoan: boolean; thuTu: CotNhap[]; boQua: string[]; thua: number; thieu: number };
/** `coTieuDe`: undefined = tự đoán; true/false = người dùng chọn. Không tiêu đề → cột theo `cotLuoiNhap(lopThuong)`.
 *  `thua` = số ô dư ở dòng dài nhất (bị bỏ, phải báo); `thieu` = số cột lưới không có ô ở dòng ngắn nhất. */
export function docDongDan(dong: string[][], lopThuong: boolean, coTieuDe?: boolean): { cot: (CotNhap | null)[]; batDau: 0 | 1; cach: CachDoc };
// server/src/classes/intake.ts
export function parsePaste(text: string, o?: { classId?: number | null; coTieuDe?: boolean }): { rows: IntakeRow[]; cotBoQua: string[]; cach: CachDoc };
```

- [x] **Bước 1: Viết phép kiểm đỏ:**
```ts
  check('NT-3 · có tiêu đề: đọc theo tên như cũ, thứ tự tuỳ ý', () => {
    const r = intake.parsePaste('Email\tHọ và tên\tTarget\nx@y.vn\tAn\t6.5', { classId: thuong });
    assert(r.cach.coTieuDe && r.rows.length === 1 && r.rows[0].fullName === 'An' && r.rows[0].target === '6.5', JSON.stringify(r));
  });
  check('NT-3 · không tiêu đề, lớp FT: theo thứ tự 12 cột lưới', () => {
    const r = intake.parsePaste('Lê An\t12/05/2008\tan@x.vn\t5\t5\t5.5\t5\t5\t6.5\t05/2027\t0\t2026-10-05', { classId: ft });
    assert(!r.cach.coTieuDe && r.cach.daDoan && r.rows.length === 1, JSON.stringify(r.cach));
    const x = r.rows[0];
    assert(x.fullName === 'Lê An' && x.email === 'an@x.vn' && x.baselineScore === '5' && x.target === '6.5' && x.examDate === '05/2027', JSON.stringify(x));
  });
  check('NT-3 · không tiêu đề, lớp thường: Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần', () => {
    const r = intake.parsePaste('Trần Bình\t01/02/2012\tb@x.vn\t5.5\t06/2027\nĐỗ Chi\t\tc@x.vn\tKCK\t', { classId: thuong });
    assert(r.rows.length === 2 && r.rows[0].target === '5.5' && r.rows[0].examDate === '06/2027' && r.rows[1].target === 'KCK', JSON.stringify(r.rows));
    assert(r.cach.thuTu.join(',') === 'fullName,dob,email,target,examDate,startWeek', r.cach.thuTu.join(','));
  });
  check('NT-3 · dòng đầu là tên người (kể cả "Họ Văn Tên") không bị nuốt làm tiêu đề', () => {
    for (const ten of ['Nguyễn Văn An', 'Họ Thị Tên', 'Email Nguyễn']) {
      const r = intake.parsePaste(`${ten}\t\ta@x.vn\nBé Hai\t\tb@x.vn`, { classId: thuong });
      assert(r.rows.length === 2 && r.rows[0].fullName === ten, `${ten}: ${JSON.stringify(r.rows)}`);
    }
  });
  check('NT-3 · người dùng ép cách đọc: coTieuDe=false giữ dòng đầu; coTieuDe=true bỏ dòng đầu', () => {
    const txt = 'Họ và tên\tEmail\nAn\ta@x.vn';
    assert(intake.parsePaste(txt, { classId: thuong, coTieuDe: false }).rows.length === 2, 'ép không tiêu đề');
    assert(intake.parsePaste('An\t\ta@x.vn\nBình\t\tb@x.vn', { classId: thuong, coTieuDe: true }).rows.length === 1, 'ép có tiêu đề');
  });
  check('NT-3 · số cột lệch lưới: thừa thì báo số ô bị bỏ, thiếu thì báo cột trống — không lặng lẽ', () => {
    const thua = intake.parsePaste('An\t\ta@x.vn\t6\t05/2027\t2026-10-05\tô lạ\tô lạ 2', { classId: thuong });
    assert(thua.cach.thua === 2 && thua.rows[0].fullName === 'An', JSON.stringify(thua.cach));
    const thieu = intake.parsePaste('An\t\ta@x.vn', { classId: thuong });
    assert(thieu.cach.thieu === 3 && thieu.rows[0].email === 'a@x.vn', JSON.stringify(thieu.cach));
  });
  check('NT-3 · không tiêu đề và không có classId: báo rõ "Chọn lớp trước…"', () => {
    assertThrows(() => intake.parsePaste('An\t\ta@x.vn'), /Chọn lớp/, 'phải báo chọn lớp');
  });
```
Kiểm `prNhap.tests.ts:85-88` (`parsePaste` không tiêu đề thì ném lỗi): cập nhật theo luật mới. Có tiêu đề vẫn chạy như cũ, không cần classId.
- [x] **Bước 2: Luật thuần.** `laDongTieuDe`: chuẩn hoá bằng `chuanTieuDe`; khớp **nguyên ô** với `TIEU_DE` (không khớp một phần, nên "Email Nguyễn" không khớp). Điều kiện: (`fullName` khớp, hoặc ≥ 2 ô khớp) **và** không ô nào là dữ liệu (`docEmail(o).email`, `docNgayNhap(o).iso`, `/^\d+([.,]\d)?$/`). `docDongDan`: nếu `coTieuDe ?? laDongTieuDe(dong[0])` thì `nhanDangCot(dong[0])` và `batDau = 1`; ngược lại `cot = cotLuoiNhap(lopThuong).map(c => c.key)` và `batDau = 0`. Tính `thua`/`thieu` trên các dòng dữ liệu.
- [x] **Bước 3: `parsePaste`.** Dùng `docDongDan`. Phân loại lớp như `IntakePanel` (`scoring_mode === 'ratio'` qua `classes.programme_code` → `programmes`). Không tiêu đề và không có `classId` → `badRequest('Chọn lớp trước khi dán dữ liệu không có dòng tiêu đề — web đọc theo thứ tự cột của lớp.')`. Có tiêu đề nhưng thiếu cột Họ tên thì giữ lỗi cũ (`intake.ts:142`), đổi chữ cho đúng luật mới. Route `/intake/parse` truyền `classId: req.body?.classId ?? null`, `coTieuDe: typeof req.body?.coTieuDe === 'boolean' ? req.body.coTieuDe : undefined`. Không cần quyền mới, vì parse không ghi gì.
- [x] **Bước 4: Web `IntakePanel`.** `handlePaste(text, coTieuDe?)` gửi `{ text, classId, coTieuDe }`. Giữ `pasteGoc` trong state, chỉ xoá khi dán lần mới hoặc thêm xong, để đổi cách đọc mà không phải dán lại. Sau khi đọc, hiện một dòng ngay trên lưới (không dùng toast, vì toast tự tắt):
  - Không tiêu đề: **"Đã đọc theo thứ tự cột: Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần bắt đầu."** + nút phụ **"Dòng đầu là tiêu đề?"** (gọi lại với `coTieuDe: true`).
  - Có tiêu đề: **"Đã đọc theo dòng tiêu đề"** (+ "bỏ qua cột …" nếu có) + nút phụ **"Dòng đầu là học viên?"** (gọi lại với `coTieuDe: false`).
  - `thua > 0`: "Mỗi dòng dư {n} ô ở cuối — đã bỏ. Kiểm lại thứ tự cột." · `thieu > 0`: "{n} cột cuối để trống — điền thêm trên lưới nếu cần."

  Chữ hướng dẫn ô dán (dòng ~153 và nhãn ô dán): "Dán từ Excel, có hoặc không có dòng tiêu đề. Không có tiêu đề thì web đọc theo thứ tự cột của lưới bên dưới." Chưa chọn lớp thì ô dán ghi "Chọn lớp trước". Lưới lớp thường: `minWidth` dòng 241 từ 740 lên khoảng 960; bề rộng cột Target/Dự kiến thi lấy theo cột FT sẵn có (bảng bề rộng dòng 28). Chạy `/impeccable clarify` cho các chữ trên, rồi `/impeccable layout` cho lưới 6 cột ở 375/1440.
- [x] **Bước 5:** `npm run check` xanh. Bấm thử: dán có/không tiêu đề, FT và lớp thường, bấm đổi cách đọc qua lại, dòng đầu là tên người.
- [x] **Bước 6: Commit** `PR-NT-3: dán từ Excel không cần dòng tiêu đề, đọc theo thứ tự cột lưới, đổi được cách đọc`.

---

### Task NT-4: Panel Thông tin HV lớp thường — sửa Target + Dự kiến thi
Skill: test-driven-development · `/impeccable layout` + `/impeccable clarify` · verification-before-completion.

Hiện trạng: `StudentDetailPage.tsx:367-389`. Em lớp thường mở `ThongTinPanel` (`StudentManagePanel.tsx:234`). Ở nhánh `cycle.ratio` (dòng 325-329), panel chỉ hiện tên chương trình và tuần kết thúc. Với FT, Target/kế hoạch thi được sửa ở `StudentPlanPanel` (mục Lộ trình). Kế hoạch này không mở `StudentPlanPanel` cho lớp thường, vì panel đó gắn với MT và điểm đầu vào. Thay vào đó, thêm hai ô vào `ThongTinPanel`, chỉ khi `cycle.ratio`.

**Files:**
- Modify: `web/src/modules/students/StudentManagePanel.tsx:234-345`; `server/src/tests/prNt.tests.ts`. Máy chủ dùng nguyên `PATCH /cycles/:id` (`updateCycle`, `cycles.ts:185-291`), không sửa. Nếu kiểm đỏ thì mới sửa.

- [x] **Bước 1: Phép kiểm máy chủ** (bảo vệ quyền và lý do cho lộ trình lớp thường):
```ts
  const cyc: any = await import('../fasttrack/cycles.ts');
  check('NT-4 · đổi Target lộ trình lớp thường: cần CYCLE_EDIT + lý do, ghi revision; GVCN bị chặn', () => {
    assertThrows(() => cyc.updateCycle(P.admin, em.cid, { targetScore: 6.5 }), /lý do/, 'thiếu lý do');
    const gvcn = P.gvcnOf?.(thuong) ?? P.teacher;                 // dùng principal GVCN có sẵn trong harness
    assertThrows(() => cyc.updateCycle(gvcn, em.cid, { targetScore: 6.5, lyDo: 'Em muốn thi sớm hơn dự kiến' }), /quyền|QL/i, 'GVCN không sửa Target');
    cyc.updateCycle(P.admin, em.cid, { targetScore: 6.5, lyDo: 'Phụ huynh đổi mục tiêu' });
    const rv = conn.prepare('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC').get(em.cid) as any;
    assert(rv && rv.new_target === 6.5, JSON.stringify(rv));
    assert((conn.prepare(`SELECT COUNT(*) n FROM test_attempts WHERE cycle_id = ? AND kind = 'mock'`).get(em.cid) as any).n === 0, 'đổi Target không xếp MT');
  });
  check('NT-4 · Dự kiến thi lớp thường: STUDENT_EDIT đủ; ngày → ngày + tháng + tuần; tháng → chỉ tháng; trống → xoá', () => {
    cyc.updateCycle(P.admin, em.cid, { examDate: '10/2027' });
    let c = conn.prepare('SELECT exam_month, exam_date FROM learning_cycles WHERE id = ?').get(em.cid) as any;
    assert(c.exam_month === '2027-10' && c.exam_date === null, JSON.stringify(c));
    cyc.updateCycle(P.admin, em.cid, { examDate: '' });
    c = conn.prepare('SELECT exam_month, exam_date FROM learning_cycles WHERE id = ?').get(em.cid) as any;
    assert(c.exam_month === null && c.exam_date === null, JSON.stringify(c));
  });
```
(Tên cột revision và principal GVCN: đọc `cycles.ts:509` và harness `P` khi viết.)
- [x] **Bước 2: Web.** Trong khối "Giai đoạn đang học", nhánh `cycle.ratio`, thêm (giữ dòng tên chương trình):
  - **Target** (tuỳ chọn): người có `cycle.edit` (lấy cờ quyền giống `StudentPlanPanel`) thấy ô band (`step 0.5`, 0–9) + lựa chọn KCK, giống ô Target ở `StudentPlanPanel`. Khi giá trị đổi so với ban đầu thì hiện thêm ô **"Lý do đổi Target"** (bắt buộc, vào `dsLoi`). Không có quyền: hiện chữ chỉ đọc `<TargetText>` + lối "Đề xuất sửa" sẵn có (`mucQuanLyHocVien`), không dựng lối mới.
  - **Dự kiến thi** (tuỳ chọn): `<ONgay kieu="thang">`, nhận ngày hoặc tháng giống `TransitionPanel.tsx:431`.
  - `luu()`: gom một `api.patch('/cycles/:id', { startWeek?, targetScore?, lyDo?, examDate? })`, chỉ gửi trường đã đổi. Sau đó `invalidate('/cycles')`, `invalidate('/students')`.
  - Đổi câu `luat` nhánh ratio: "Giai đoạn là chương trình đang học… Target và Dự kiến thi chỉ để theo dõi; lớp thường không tính kỳ vọng hay SOS theo Target. Đổi Target bắt ghi lý do." Chạy `/impeccable clarify` cho câu này và nhãn lý do, `/impeccable layout` cho khối.
- [x] **Bước 3:** `npm run check` xanh. Bấm thử với QL (sửa được, bắt lý do) và GVCN (chỉ đọc + Đề xuất sửa), ở 375 và 1440.
- [x] **Bước 4: Commit** `PR-NT-4: Thông tin HV lớp thường sửa Target (lý do, cycle.edit) + Dự kiến thi`.

---

### Task NT-5: Hiển thị — đầu hồ sơ; Rulebook + thuật ngữ
Skill: test-driven-development · `/impeccable layout` · verification-before-completion.

Phạm vi hiển thị **tối thiểu** (danh sách chốt):
1. **Đầu hồ sơ** (`DongThongTin`, `DauHoSo.tsx:26-34`, dữ liệu `students/profile.ts:470-499`). Lớp thường thêm `Target …` và `thi IELTS dự kiến …` sau "Cuối khoá W4 OCT". Chỉ hiện khi có giá trị.
2. **Panel Thông tin HV:** xong ở NT-4.
3. **Bảng lớp (roster) lớp thường `BangDiemLopThuong`:** PR này **không** thêm cột. Cột "Dự kiến thi" do PR-DH DH-2 làm, cột Target/Dự kiến thi khi sửa cả lớp do PR-SL làm (xem mục Ảnh hưởng). Lý do: tránh hai PR cùng sửa một bảng trong wave 1.

**Files:** `server/src/students/profile.ts:456-499`; `web/src/modules/students/DauHoSo.tsx`; `server/src/tests/prNt.tests.ts`; `thiet-ke/PISA-Rulebook-2026-09-19.md`; `thiet-ke/THUAT_NGU_DA_CHOT.md`; `shared/domain/nhapHocVien.ts` + `intake.ts` (chú thích, nếu NT-1 còn sót).

**Interfaces:** kiểu trả `dauHoSo.thongTin` thêm `thiIelts: string | null` (lớp thường; FT vẫn dùng `thiDuKien`).

- [x] **Bước 1: Kiểm đỏ:**
```ts
  check('NT-5 · đầu hồ sơ lớp thường: có Target + thi IELTS dự kiến, vẫn giữ Cuối khoá', () => {
    conn.prepare("UPDATE learning_cycles SET target_score = 6.5, khong_cam_ket = 0, exam_month = '2027-05', exam_date = NULL, exam_period_id = NULL WHERE id = ?").run(em.cid);
    const tt = prof.studentProfile(P.admin, em.sid).dauHoSo.thongTin;   // đúng tên hàm/đường trong profile.ts
    assert(tt.target === 6.5, JSON.stringify(tt));
    assert(tt.thiDuKien?.nhan === 'Cuối khoá' || tt.thiDuKien === null, 'Cuối khoá giữ nguyên');
    assert(tt.thiIelts === '05/2027', JSON.stringify(tt));
  });
```
- [x] **Bước 2: `profile.ts`.** Dòng 498 bỏ `khoa ||`: target lấy từ `dangChay` cho mọi lớp (KCK → `'KCK'`). Trong nhánh `if (khoa)` (474-480), tính `thiIelts` bằng cùng công thức dòng 488-491 (`examPlanOf` → tháng / ngày / mã tuần). Sửa chú thích `DauHoSo.tsx:27` thành "lớp thường  MB FOU 15 · FOU · tuần học 7/10 · Cuối khoá W4 OCT · Target 5.5 · thi IELTS dự kiến 06/2027 · GVCN …". Web thêm một `<span>` sau Cuối khoá. `/impeccable layout` để kiểm dòng thông tin không tràn ở 375 (xuống dòng theo cụm như hiện tại).
- [x] **Bước 3: Rulebook.** Ở `thiet-ke/PISA-Rulebook-2026-09-19.md`: (a) thêm vào danh sách "ĐÃ THAY" đầu file (dòng ~9) cụm "Target/Dự kiến thi lớp thường (04/10)"; (b) ở §20.1 bảng (sau dòng 655, #14), thêm dòng mới: "Lớp thường có Target + Dự kiến thi (chủ sản phẩm 04/10, thay K2-41/YC-5.2): nhập ở Thêm học viên và Thông tin HV; đổi Target bắt lý do, `cycle.edit`; **không** kỳ vọng, SOS, MT, Case theo Target. Dán Excel không bắt buộc dòng tiêu đề." kèm tham chiếu file/dòng code. Ở §10 dòng 255, thêm ghi chú "[BỔ SUNG 04/10 — lớp thường cũng có Target/Dự kiến thi]". Chữ gốc giữ nguyên làm lịch sử.
- [x] **Bước 4: Thuật ngữ.** `thiet-ke/THUAT_NGU_DA_CHOT.md`: g5-004 "Dự kiến thi" (dòng 363) sửa nghĩa thành "Ngày hoặc tháng dự kiến học viên đi thi IELTS thật — FT và lớp thường (04/10)". g13-002 "Target" (dòng 1134) thêm "· Thêm học viên · cột, Thông tin HV · ô; lớp thường chỉ để theo dõi". Thêm dòng mới cho "Đã đọc theo thứ tự cột", "Dòng đầu là tiêu đề?", "Dòng đầu là học viên?" (vị trí Thêm học viên · ô dán, "Web hiện tại").
- [x] **Bước 5:** `npm run check` xanh. Bấm thử theo mục Nghiệm thu.
- [x] **Bước 6: Commit** `PR-NT-5: đầu hồ sơ lớp thường hiện Target + thi IELTS dự kiến; Rulebook + thuật ngữ (chủ sản phẩm 04/10)`.
- [x] **Bước 7: Cuối PR.** `/impeccable audit` → `/ponytail-review` → requesting-code-review → finishing-a-development-branch. Rebase main, mở PR, không merge.

## Ảnh hưởng tới kế hoạch khác
Session chạy các PR sau **phải** theo quyết định 04/10:
- **PR-SL** (`2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md`, Q-0310-3, dòng 49, 628-): bộ cột sửa cả lớp của **lớp thường** nay gồm Họ tên · Ngày sinh · Email · Tuần bắt đầu học · **Target · Dự kiến thi**. Không có điểm đầu vào, không có Đã thi tới MT. Đổi Target ở đây cũng đi qua `reviseTarget` (lý do, `cycle.edit`). Dùng `cotLuoiNhap(true)` làm nguồn cột.
- **PR-DH DH-2** (cùng file, dòng 545): cột "Dự kiến thi" cũng hiện cho **lớp thường** (`BangDiemLopThuong` / bảng Học viên & Lớp), cùng định dạng tháng/ngày như FT.
- Nếu PR-SL/PR-DH đã merge trước PR-NT: PR-NT bổ sung các cột trên trong cùng PR và ghi rõ trong mô tả.
- `luatLoTrinh.ts:265`: lớp thường lên lớp thường tiếp hiện **không** mang Target theo. Hỏi chủ sản phẩm, không tự đổi.

## Nghiệm thu
- Thêm học viên lớp thường: lưới có 6 cột (… Target · Dự kiến thi · Tuần bắt đầu). Target nhận band/KCK, sai thì lỗi. Dự kiến thi nhận ngày hoặc tháng, sai hoặc ngoài cận thì lỗi. Ghi xong thì `learning_cycles` có đủ giá trị. OVR/L/R/W/S và Đã thi tới MT vẫn "Bỏ qua — …".
- Dán Excel: có tiêu đề thì đọc theo tên. Không tiêu đề thì đọc theo thứ tự lưới của đúng loại lớp. Dòng đầu là tên người không bị nuốt. Có dòng "Đã đọc theo thứ tự cột: …" và nút đổi cách đọc (không phải dán lại). Thừa/thiếu cột được báo rõ. Chưa chọn lớp + không tiêu đề → "Chọn lớp trước…".
- Thông tin HV lớp thường: QL sửa Target (bắt lý do, ghi Hành trình) và Dự kiến thi. GVCN chỉ đọc Target + Đề xuất sửa, sửa được Dự kiến thi.
- Đầu hồ sơ lớp thường hiện Target + thi IELTS dự kiến cạnh Cuối khoá.
- Không tác dụng phụ FT: không MT, không `target_at_attempt`, không kỳ vọng, không Case/PA tự động, không việc "Thiếu Target", kết quả `danhGiaMon` không đổi, PA lớp thường không lấy ngày thi làm mốc. Mỗi điều có phép kiểm `prNt.tests.ts`.
- Không migrate. Rulebook + thuật ngữ đã ghi quyết định 04/10.

## Prompt cho session code (dán nguyên khối)
```
Làm PR-NT (nhánh pr-nt-target-thi-lop-thuong) theo docs/superpowers/plans/2026-10-04-pr-nt-target-thi-lop-thuong.md, task NT-1 → NT-5.
Quyết định chủ sản phẩm 04/10: lớp thường cũng có Target + Dự kiến thi (thay K2-41/YC-5.2); dán Excel không bắt buộc dòng tiêu đề.
Đầu phiên: /ponytail lite (PR có sửa giao diện). Thực hiện bằng anthropic-skills:subagent-driven-development.
Mỗi task: anthropic-skills:test-driven-development (đỏ trên DB test trước); anthropic-skills:verification-before-completion (npm run check).
NT-3: /impeccable clarify cho chữ ô dán, "Đã đọc theo thứ tự cột…", nút "Dòng đầu là tiêu đề?"; /impeccable layout lưới lớp thường 6 cột.
NT-4: /impeccable layout + clarify khối Target/Dự kiến thi ở Thông tin HV. NT-5: /impeccable layout dòng đầu hồ sơ.
TUYỆT ĐỐI: Target lớp thường không bật logic FT (kỳ vọng, SOS, MT, Case, việc Thiếu Target, phân tích FT) — chặn theo chương trình, có phép kiểm.
Đổi Target luôn qua reviseTarget (lý do + cycle.edit). Không migrate. Không bớt kiểm tra nhập / chống mất dữ liệu / phân quyền.
Phép kiểm ở server/src/tests/prNt.tests.ts, gọi ở cuối run.ts. Cập nhật CODE_MAP.md, Rulebook, THUAT_NGU_DA_CHOT.md.
Đọc mục "Ảnh hưởng tới kế hoạch khác" (PR-SL, PR-DH DH-2) và báo trong mô tả PR.
Cuối PR: /impeccable audit → /ponytail-review (liệt kê chú thích ponytail:) → anthropic-skills:requesting-code-review
→ anthropic-skills:finishing-a-development-branch. Mô tả PR có bảng rà FT (NT-2), ảnh 375/1440 sáng/tối. Mở PR, không merge.
```
