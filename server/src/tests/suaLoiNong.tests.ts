/** PHÉP KIỂM PR-N1 — sửa lỗi nóng + sửa sai sự thật (kế hoạch 2026-09-28). Harness do run.ts truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

/* Chạy từ `dist-server/server/src/tests/` → lên 3 cấp là `dist-server/`, thêm một cấp là gốc repo. */
const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const docSach = (rel: string) => boChuThich(fs.readFileSync(path.join(REPO, rel), 'utf8'));
/** Mọi tệp có đuôi `duoi` dưới `dir` (đường dẫn tương đối gốc repo), bỏ node_modules/dist. */
const tepDuoi = (dir: string, duoi: string): string[] => fs.readdirSync(path.join(REPO, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = `${dir}/${e.name}`;
  if (e.isDirectory()) return /^(node_modules|dist|dist-server)$/.test(e.name) ? [] : tepDuoi(rel, duoi);
  return e.name.endsWith(duoi) ? [rel] : [];
});
const tepTsx = (dir: string) => tepDuoi(dir, '.tsx');
const tepTs = (dir: string) => tepDuoi(dir, '.ts');

export async function runSuaLoiNongTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-N1 · Sửa lỗi nóng + sửa sai sự thật');

  check('N1 (0) · REPO trỏ đúng gốc worktree (đọc được mã nguồn cho các phép kiểm soi mã)', () => {
    assert(fs.existsSync(path.join(REPO, 'package.json')) && fs.existsSync(path.join(REPO, 'shared/domain/cases.ts')), `REPO = ${REPO}`);
    assert(/export function weeklyUpdateDue/.test(docSach('shared/domain/cases.ts')), 'docSach không đọc được cases.ts');
  });

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
  check('N1 (1) · sosPlanEndDate "1 tháng" vẫn là Chủ nhật (dự kiến kết thúc, không theo hạn Thứ Hai)', () => {
    assert(d.sosPlanEndDate('one_month', { createdOn: '2026-09-21' }) === '2026-10-25', d.sosPlanEndDate('one_month', { createdOn: '2026-09-21' }));
    assert(d.sosPlanEndDate('one_month', { createdOn: '2026-09-25' }) === '2026-11-01', d.sosPlanEndDate('one_month', { createdOn: '2026-09-25' }));
  });

  // ==================================================================== 2. Máy chủ: hạn duyệt 5 ngày, gộp "Ghi kết quả PA", thẻ PA đã huỷ
  const casesSvc: any = await import('../cases/cases.ts');
  const myworkSvc: any = await import('../worklist/mywork.ts');
  /*
   * Học viên CHỈ đang học lớp MB-FT 101 — lớp GVCN `P.coreTeacher` dạy. Các phép kiểm trước trong run.ts có ghi thêm lớp đang
   * học cho vài em (em đầu lớp có hai lớp active) → `reportIssue` lấy lớp mới nhất, ngoài phạm vi GVCN. Dùng lại ở Task 3, 5b.
   */
  const taoPa = (key: string, extra: Record<string, unknown> = {}) => {
    const sv = t.conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
                                WHERE s.archived_at IS NULL AND e.class_id = ?
                                  AND NOT EXISTS (SELECT 1 FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active'
                                                   AND e2.class_id != e.class_id)
                                ORDER BY s.id LIMIT 1`).get(t.classId('MB-FT 101')) as any;
    const c = casesSvc.reportIssue(t.P.coreTeacher, { title: 'Case kiểm PR-N1 hạn tuần', primaryCode: 'student.listening.technique',
      studentId: sv.id, topic: 'listening', summary: 'Kiểm gộp nhóm việc ghi kết quả', idempotencyKey: `n1-${key}`, parallel: true }) as any;
    const r = casesSvc.recordIntervention(t.P.coreTeacher, c.id,
      { kind: 'self_study', description: 'Tự học 30 phút mỗi tối', status: 'started', performerSelf: true, ...extra }) as any;
    return { caseId: c.id, ivId: r.interventions[r.interventions.length - 1].id as number };
  };
  const nhomCua = (who: any, key: string) => (myworkSvc.myWork(who, {}).groups as any[]).find((g) => g.key === key)?.items ?? [];

  check('N1 (2) · K5-02: PA tới hạn → MỘT dòng nhóm result, khoá action:, không còn nhóm do_plan / khoá review:', () => {
    const { ivId } = taoPa('gop');
    t.conn.prepare('UPDATE case_interventions SET action_due = ?, followup_due = ? WHERE id = ?').run(t.TODAY, t.addDays(t.TODAY, -2), ivId);
    const groups = myworkSvc.myWork(t.P.coreTeacher, {}).groups as any[];
    assert(!groups.some((g) => g.key === 'do_plan'), 'còn nhóm do_plan');
    /* Chỉ khoá theo id PA (`action:`/`review:`) — `support:`/`owner:` mang id CASE, có thể trùng số với id PA này. */
    const dong = groups.flatMap((g) => g.items).filter((it: any) => it.key === `action:${ivId}` || it.key === `review:${ivId}`);
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
    assert(!nhomCua(t.P.mbManager, 'decide').some((it: any) => it.key === `approval:${ivId}`), 'PA huỷ vẫn chờ duyệt');
    t.assertThrows(() => casesSvc.respondToPlan(t.P.mbManager, ivId, { decision: 'approved' }), /đã huỷ/, 'duyệt được PA đã huỷ');
  });
  check('N1 (2) · K3-18: đề xuất PA có hạn duyệt 5 ngày tính cả hôm gửi; duyệt xong hạn tuần là Thứ Hai', () => {
    const { ivId } = taoPa('duyet', { needsApproval: true, status: 'planned', kind: 'tutor' });
    const iv = t.conn.prepare('SELECT approval_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.approval_due === t.addDays(t.TODAY, 4), `approval_due ${iv.approval_due}`);
    casesSvc.respondToPlan(t.P.mbManager, ivId, { decision: 'approved' });
    const sau = t.conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(new Date(`${sau.action_due}T00:00:00Z`).getUTCDay() === 1, `hạn sau duyệt ${sau.action_due} không phải Thứ Hai`);
  });
  check('N1 (2) · K3-02: ô "Việc cần làm tiếp" lấy hạn tuần, không lấy dự kiến kết thúc', () => {
    const src = docSach('server/src/students/profile.ts');
    assert(!/followUntil/.test(src.slice(src.indexOf('const cands'), src.indexOf('cands.sort'))), 'còn dùng followUntil làm hạn');
  });

  // ==================================================================== 3. Migrate R-PA5: hạn Chủ nhật của PA đang chạy → Thứ Hai
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
  check('N1 (3) · S4-1 (Task 5b): PA điền sẵn "chờ xác nhận" ở Case đang mở → PA quy chế đang chạy, hạn Thứ Hai; chạy lại không đổi', () => {
    const { caseId } = taoPa('mig-qc');
    const cu = Number(t.conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, preset, cycle_no, needs_approval, created_at)
      VALUES (?, 'self_study', 'Tự học · 1 tháng', 'planned', 1, 1, 0, ?)`).run(caseId, new Date().toISOString()).lastInsertRowid);
    assert(mig.demPaQuyCheChoXacNhan(t.conn) >= 1, 'chạy thử không đếm được PA chờ xác nhận');
    const applied: string[] = [];
    mig.migratePrN1(t.conn, applied);
    const iv = t.conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(cu) as any;
    assert(iv.status === 'started' && iv.confirmed_by === null && !!iv.confirmed_at && iv.cycle_started_on === t.TODAY
      && iv.action_due === d.weeklyUpdateDue(t.TODAY) && new Date(`${iv.action_due}T00:00:00Z`).getUTCDay() === 1, JSON.stringify(iv));
    assert(applied.some((x) => /PA quy chế SOS/.test(x)) && mig.demPaQuyCheChoXacNhan(t.conn) === 0, applied.join(' | '));
    const truoc = JSON.stringify(iv);
    const lan2: string[] = []; mig.migratePrN1(t.conn, lan2);
    const sau = t.conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(cu) as any;
    assert(lan2.length === 0 && JSON.stringify(sau) === truoc, `chạy lại vẫn đổi: ${lan2.join(' | ')}`);
    assert(/demPaQuyCheChoXacNhan/.test(docSach('server/src/migrate/chayThuN1.ts')), 'chạy thử chưa in số PA quy chế chờ xác nhận');
  });

  // ==================================================================== 4. Web: chữ hạn "hết Thứ Hai" + A5 + A6
  check('N1 (4) · A6: việc Nhập điểm trễ có số ngày; không còn "⚠ n ngày" gọn; chữ hạn PA không còn Chủ nhật', () => {
    const v = d.viecTiepTheoCua({ nhapDiem: { kyNang: ['reading'], dot: 'MT2', quaHan: true, han: '2026-09-20' }, cases: [], homNay: '2026-09-24' })[0];
    assert(v.quaHanNgay === 4 && /quá hạn 4 ngày/.test(v.title), JSON.stringify(v));
    assert(!/QuaHan[^>]*\bgon\b/.test(docSach('web/src/ui/ViecTiep.tsx')), 'ViecTiep còn dạng gọn');
    for (const f of ['web/src/modules/cases/CasePanel.tsx', 'web/src/modules/cases/SkillBoard.tsx', 'web/src/modules/cases/ThaoTacCase.tsx'])
      assert(!/Chủ nhật|tuần này:/.test(docSach(f)), `${f} còn "Chủ nhật"/"tuần này:"`);
    assert(!/'1 · Kết quả tuần này'/.test(docSach('web/src/modules/cases/CapNhatTuan.tsx')), 'CapNhatTuan còn tiêu đề cũ');
    assert(!/hạn \$\{ngay\(it\.due/.test(docSach('web/src/modules/worklist/WorkList.tsx')), 'WorkList còn ngày trơn không trạng thái (A5)');
  });
  check('N1 (4) · A6: nhập điểm không có hạn / chưa trễ giữ chữ cũ; máy chủ truyền hanNhap vào viecTiepTheoCua', () => {
    const a = d.viecTiepTheoCua({ nhapDiem: { kyNang: ['reading'], dot: 'MT2', quaHan: false, han: null }, cases: [], homNay: '2026-09-24' })[0];
    assert(a.han === null && a.quaHanNgay === null && a.title === 'Nhập điểm R · MT2', JSON.stringify(a));
    const b = d.viecTiepTheoCua({ nhapDiem: { kyNang: ['reading'], dot: 'MT2', quaHan: false, han: '2026-09-27' }, cases: [], homNay: '2026-09-24' })[0];
    assert(b.han === '27/09' && b.quaHanNgay === null && b.tone === 'warn' && !/quá hạn/.test(b.title), JSON.stringify(b));
    const src = docSach('server/src/classes/classes.ts');
    assert((src.match(/hanNhap:/g) ?? []).length >= 2 && /han: timeline\.map\(\(t\) => t\.hanNhap\)/.test(src), 'classes.ts chưa có hanNhap');
  });

  // ==================================================================== 5. Bảng kỹ năng: hai khối SOS loại trừ nhau + cột phải
  check('N1 (5) · YC-12.1: một biến trạng thái cho hai khối SOS; YC-12.5.4: cột phải dùng CotPhai', () => {
    const src = docSach('web/src/modules/cases/SkillBoard.tsx');
    assert(!/causeOpen|dismissOpen/.test(src) && /khoiSos === 'nguyen-nhan'/.test(src) && /khoiSos === 'khong-theo-doi'/.test(src), 'hai khối còn mở cùng lúc được');
    assert((src.match(/<CotPhai\b/g) ?? []).length >= 4, 'cột phải chưa theo khuôn nút trên chữ dưới');
  });

  // ==================================================================== 5b. PA quy chế SOS gán tự động — chạy ngay (S4-1, Q22–Q25)
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const sigSvc: any = await import('../cases/signals.ts');
  /* Lớp FT thật của bộ thử (MB-FT 101) — `t.classId` là hàm, không phải số (lệch brief, ghi Nhật ký). */
  const lop = t.classId('MB-FT 101');
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
    /* `P.mbManager` — bộ thử không có khoá `P.manager` (lệch brief, ghi Nhật ký). */
    sigSvc.retireCaseForCorrectedScore(t.P.mbManager, caseId, 'Listening');
    const iv = t.conn.prepare('SELECT status, closed_reason FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.status === 'cancelled' && iv.closed_reason === 'score_fixed', JSON.stringify(iv));
  });
  check('N1 (5b) · Q23: PA quy chế chưa ghi gì KHÔNG là căn cứ độc lập; đã có kết quả tuần thì là việc thật (không huỷ khi sửa điểm)', () => {
    const { caseId, ivId } = taoQuyChe('can-cu');
    /* Case tạo tay có mốc/nguồn riêng (đều là căn cứ) — gỡ đi để chỉ còn PA quy chế đứng một mình. */
    t.conn.prepare('DELETE FROM case_sources WHERE case_id = ?').run(caseId);
    t.conn.prepare('DELETE FROM case_milestones WHERE case_id = ?').run(caseId);
    assert(sigSvc.caseHasIndependentBasis(caseId, null) === false, 'PA máy gán chưa ghi gì bị coi là căn cứ');
    casesSvc.recordFollowUp(t.P.coreTeacher, caseId, { interventionId: ivId, outcome: 'partial', note: 'Tuần đầu em nghe chép đều hơn' });
    assert(sigSvc.caseHasIndependentBasis(caseId, null) === true, 'PA quy chế có kết quả tuần phải là căn cứ');
    const khop = t.conn.prepare(`SELECT COUNT(*) n FROM case_interventions iv WHERE iv.id = ? AND ${sosState.PA_QUY_CHE_CHUA_GHI('iv')}`).get(ivId) as any;
    assert(khop.n === 0, 'có kết quả tuần rồi mà vẫn khớp PA_QUY_CHE_CHUA_GHI');
  });
  check('N1 (5b) · giao diện không còn "Gợi ý tự động · chờ xác nhận" / Xác nhận–Sửa–Thay; PA quy chế có dấu 🔒', () => {
    const sb = docSach('web/src/modules/cases/SkillBoard.tsx');
    assert(!/PresetPlanActions/.test(sb) && /theo quy chế/.test(sb), 'SkillBoard còn nút xác nhận / thiếu dấu quy chế');
    assert(!/Gợi ý tự động|goi-y/.test(docSach('shared/domain/hoSoHocVien.ts')), 'hoSoHocVien còn nhánh gợi ý');
    assert(!/Xác nhận PA gợi ý/.test(docSach('server/src/students/profile.ts')), 'ô Việc cần làm còn "Xác nhận PA gợi ý"');
    assert(/theo quy chế/.test(docSach('web/src/modules/cases/CasePanel.tsx')), 'Ngăn Case thiếu dấu quy chế cạnh tên PA');
  });

  // ==================================================================== 6. Báo lỗi form rõ (YC-12.5.2) + dòng PA nhập bù (YC-12.5.1)
  check('N1 (6) · kiemTruong nói thiếu gì dưới ô; chân form chỉ đếm "n ô cần sửa ↑" (YC-12.5.2, chủ sản phẩm 28/09)', () => {
    assert(d.kiemTruong({ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }, 'Em hay sai') === 'Cần ít nhất 15 ký tự (đang có 10)', 'đếm ký tự');
    assert(d.kiemTruong({ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }, '   ') === 'Cần ít nhất 15 ký tự (đang có 0)', 'rỗng');
    assert(d.kiemTruong({ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }, ' ') === 'Chưa điền', 'toiThieu 1');
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

  // ==================================================================== 7. Báo lỗi rõ cho mọi form KhungPanel còn lại
  check('N1 (7) · mọi form KhungPanel (trừ classes/, dev/, panel chỉ xem) dùng useLoiForm', () => {
    const bo = /modules[\/](classes|dev)[\/]|PhuongAnPanel|XemPhuongAnPanel/;
    const thieu = tepTsx('web/src/modules').filter((f) => !bo.test(f) && /<KhungPanel/.test(docSach(f)) && !/useLoiForm\(/.test(docSach(f)));
    assert(thieu.length === 0, thieu.join(', '));
    const conCu = tepTsx('web/src/modules').filter((f) => !bo.test(f) && /conThieu: daBam/.test(docSach(f)));
    assert(conCu.length === 0, `còn chân kiểu cũ: ${conCu.join(', ')}`);
  });
}
