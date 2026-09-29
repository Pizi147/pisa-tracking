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
   * Học viên CHỈ đang học lớp MB FT 101 — lớp GVCN `P.coreTeacher` dạy. Các phép kiểm trước trong run.ts có ghi thêm lớp đang
   * học cho vài em (em đầu lớp có hai lớp active) → `reportIssue` lấy lớp mới nhất, ngoài phạm vi GVCN. Dùng lại ở Task 3, 5b.
   */
  const taoPa = (key: string, extra: Record<string, unknown> = {}) => {
    const sv = t.conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
                                WHERE s.archived_at IS NULL AND e.class_id = ?
                                  AND NOT EXISTS (SELECT 1 FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active'
                                                   AND e2.class_id != e.class_id)
                                ORDER BY s.id LIMIT 1`).get(t.classId('MB FT 101')) as any;
    const c = casesSvc.reportIssue(t.P.coreTeacher, { title: 'Case kiểm PR-N1 hạn tuần', primaryCode: 'student.listening.technique',
      studentId: sv.id, topic: 'listening', summary: 'Kiểm gộp nhóm việc ghi kết quả', idempotencyKey: `n1-${key}`, parallel: true }) as any;
    const r = casesSvc.recordIntervention(t.P.coreTeacher, c.id,
      { kind: 'self_study', description: 'Tự học 30 phút mỗi tối', status: 'started', performerSelf: true, ...extra }) as any;
    return { caseId: c.id, ivId: r.interventions[r.interventions.length - 1].id as number };
  };
  const yeuCauSvc: any = await import('../duyet/yeuCau.ts');
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
    /* PR-DUYET: thẻ Đề xuất PA của PA đã huỷ tự đóng ở lần mở hộp kế tiếp (quét — Q2). */
    yeuCauSvc.hopChoDuyet(t.P.mbManager);
    const the = t.conn.prepare(`SELECT trang_thai, ly_do_dong FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ?`).get(ivId) as any;
    assert(the?.trang_thai === 'tu_dong' && /Case đã đóng|không còn chờ/.test(the.ly_do_dong), JSON.stringify(the));
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
  /* Lớp FT thật của bộ thử (MB FT 101) — `t.classId` là hàm, không phải số (lệch brief, ghi Nhật ký). */
  const lop = t.classId('MB FT 101');
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
  check('N1 (7) · mọi form KhungPanel (trừ dev/, panel chỉ xem) dùng useLoiForm', () => {
    /* PR-NEN Task 9 đổi Drawer → KhungPanel: panel chỉ xem (NeedsEvaluation, phanTich/dungChung) + panel còn chờ áp useLoiForm;
       TransitionPanel báo lỗi ngay tại từng dòng HV (không phải form ô bắt buộc). */
    const bo = /modules[\/]dev[\/]|PhuongAnPanel|XemPhuongAnPanel|NeedsEvaluation|phanTich[\/]dungChung|AccountsAdmin|CatalogAdmin|IntakePanel|StudentPlanPanel|ClassProgressPanel|MeetingPage|MgmtTasksPage|XoaKetThucLopPanel|TransitionPanel/;
    const thieu = tepTsx('web/src/modules').filter((f) => !bo.test(f) && /<KhungPanel/.test(docSach(f)) && !/useLoiForm\(/.test(docSach(f)));
    assert(thieu.length === 0, thieu.join(', '));
    const conCu = tepTsx('web/src/modules').filter((f) => !bo.test(f) && /conThieu: daBam/.test(docSach(f)));
    assert(conCu.length === 0, `còn chân kiểu cũ: ${conCu.join(', ')}`);
  });

  // ==================================================================== 9. Kết quả & điểm nói đúng (UX-A A1–A4, A8, A9; K2-10)
  check('N1 (9) · A1: không còn ký tự điều khiển trong mã; A2: SOS tạm thời nói "tạm thời"; A4: "x/y môn đạt"', () => {
    const tep = [...tepTsx('web/src'), ...tepTs('shared/domain'), ...tepTs('server/src')];
    const ban = tep.filter((f) => /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(fs.readFileSync(path.join(REPO, f), 'utf8')));
    assert(ban.length === 0, `ký tự điều khiển: ${ban.join(', ')}`);
    const v = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 2, cheDo: 'ielts' });
    assert(v.text === 'SOS 2 tạm thời · 2/4 kỹ năng' && v.tamThoi, v.text);
    const r = d.attemptProgressView({ scored: 4, required: 4, passed: false, sos: 3, cheDo: 'ratio', soMonChuaDat: 4 });
    assert(!/^Đạt/.test(r.text) && r.text === '0/4 môn đạt · SOS 3', r.text);
    for (const f of ['shared/domain/hocVienLop.ts', 'shared/domain/chamDiem.ts', 'shared/domain/hanhTrinh.ts', 'shared/domain/display.ts', 'server/src/students/standing.ts'])
      assert(!/`Đạt \$\{/.test(docSach(f)), `${f} còn "Đạt x/y"`);
  });
  check('N1 (9) · A8: "Bình thường" không tô màu cảnh báo; K2-10: bảng điểm FT so kỳ vọng của đúng mốc, có cột W', () => {
    assert(d.URGENCY_TONE.attention === 'neutral', 'Bình thường còn vàng');
    const ros = docSach('web/src/modules/students/ClassRoster.tsx');
    assert(!/target=\{s\.cycle/.test(ros) && /kyVong=\{h\.expectation/.test(ros) && /'writing'/.test(ros), 'Band còn so target / thiếu cột W');
    assert(/expectation: t\.expectation/.test(docSach('server/src/classes/classes.ts')), 'history chưa có kỳ vọng từng mốc');
    assert(/\\b\/\.exec\(text\)/.test(fs.readFileSync(path.join(REPO, 'web/src/lib/format.ts'), 'utf8')), 'toneTheoNhan chưa có \\b');
  });

  // ==================================================================== 10. Toast "Hoàn tác" 5 giây dùng chung (UX-C C1)
  check('N1 (10) · C1: Hoàn tác 5 giây, đếm ngược làm tròn lên; Ghi vi phạm dùng toast chung', () => {
    assert(d.HOAN_TAC_MS === 5000, 'HOAN_TAC_MS');
    const ca: [number, number][] = [[5000, 5], [4001, 5], [4000, 4], [1, 1], [0, 0], [-50, 0]];
    for (const [con, giay] of ca) assert(d.giayHoanTacConLai(1_000_000 + con, 1_000_000) === giay, `${con} → ${d.giayHoanTacConLai(1_000_000 + con, 1_000_000)}`);
    const src = docSach('web/src/modules/yThuc/RecordViolationPanel.tsx');
    assert(/toast\.hoanTac\(/.test(src) && !/ms: 10000/.test(src), 'Ghi vi phạm chưa dùng Hoàn tác chung');
  });

  // ==================================================================== 11. Tên Pisa Tracking, chữ máy lọt ra màn hình (YC-6, A7)
  check('N1 (11) · YC-6 + A7: không còn "PISA Progress", "npm", "COUNT DISTINCT", ngày ISO trong thông báo; nhật ký có nhãn tiếng Việt', () => {
    const hien = [...tepTsx('web/src'), 'index.html', 'shared/domain/metrics.ts'];
    const tenCu = hien.filter((f) => /PISA Progress/.test(docSach(f)));
    assert(tenCu.length === 0, `còn tên cũ: ${tenCu.join(', ')}`);
    /* Hướng dẫn chạy bản demo trên máy (trang thử dev/, thanh demo, trang chào khi demo chưa có dữ liệu) được nói lệnh npm. */
    const demo = /modules[\\/]dev[\\/]|DemoBar\.tsx|WelcomePage\.tsx/;
    const chuMay = hien.filter((f) => !demo.test(f) && /npm run|COUNT DISTINCT/.test(docSach(f)));
    assert(chuMay.length === 0, `chữ máy: ${chuMay.join(', ')}`);
    assert(!/Hạn \$\{(input\.verifyDue|row\.verify_due)\}/.test(docSach('server/src/cases/sosAuto.ts') + docSach('server/src/cases/signals.ts')), 'ngày ISO trong thông báo');
    const ma = new Set<string>();
    for (const f of tepTs('server/src')) for (const m of docSach(f).matchAll(/\baction\s*:\s*'([a-z_]+\.[a-z_.]+)'/g)) ma.add(m[1]);
    const thieuNhan = [...ma].filter((a) => d.nhanHanhDongNhatKy(a) === 'Thao tác hệ thống');
    assert(ma.size > 0 && thieuNhan.length === 0, `thiếu nhãn: ${thieuNhan.join(', ')}`);
    assert(d.nhanHanhDongNhatKy('attempt.cancel_part') === 'Huỷ phần còn lại của lượt' && d.nhanHanhDongNhatKy('x.y') === 'Thao tác hệ thống', 'nhãn');
  });

  // ==================================================================== 13a. Bấm thử: danh sách Case lấy hạn tuần, không lấy dự kiến kết thúc
  check('N1 (13a) · K3-02/T53 Q1: listCases.nextDue = hạn ghi kết quả tuần (Thứ Hai), không phải dự kiến kết thúc; quá hạn theo hạn tuần', () => {
    const { caseId, ivId } = taoPa('list-cases');
    t.conn.prepare('UPDATE case_interventions SET action_due = ?, followup_due = ? WHERE id = ?').run(t.addDays(t.TODAY, 6), t.addDays(t.TODAY, -3), ivId);
    const dong = (casesSvc.listCases(t.P.coreTeacher, {}).rows as any[]).find((r) => r.id === caseId);
    assert(dong && dong.nextDue === t.addDays(t.TODAY, 6) && dong.dueOverdue === false, JSON.stringify(dong && { nextDue: dong.nextDue, dueOverdue: dong.dueOverdue }));
    t.conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(t.addDays(t.TODAY, -1), ivId);
    const tre = (casesSvc.listCases(t.P.coreTeacher, {}).rows as any[]).find((r) => r.id === caseId);
    assert(tre.nextDue === t.addDays(t.TODAY, -1) && tre.dueOverdue === true, 'hạn tuần đã qua mà không quá hạn');
  });

  // ==================================================================== 13b. Q28-5 — Case từ SOS "Chưa xử lý" tới khi đủ nguyên nhân + PA do người xác nhận
  const sos: any = await import('../cases/sosState.ts');
  check('N1 (13b) · Q28-5: Case từ SOS chỉ "Đang xử lý" khi có nguyên nhân VÀ PA do người xác nhận; PA máy gán không đủ', () => {
    const { caseId, ivId } = taoPa('q28-5');
    const trangThai = () => (t.conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(caseId) as any).status;
    /* Biến PA thành PA quy chế MÁY GÁN (preset, confirmed_by trống) — Case thành Case từ SOS. */
    t.conn.prepare('UPDATE case_interventions SET preset = 1, confirmed_by = NULL WHERE id = ?').run(ivId);
    sos.dongBoTrangThaiCase(caseId);
    assert(trangThai() === 'open', `có nguyên nhân + PA máy gán mà ${trangThai()}`);
    const dong = (casesSvc.listCases(t.P.coreTeacher, {}).rows as any[]).find((r) => r.id === caseId);
    assert(dong.state === 'chua_xu_ly', `listCases state ${dong.state}`);
    t.conn.prepare('UPDATE case_interventions SET confirmed_by = ? WHERE id = ?').run(t.P.coreTeacher.userId, ivId);
    sos.dongBoTrangThaiCase(caseId);
    assert(trangThai() === 'in_progress', 'PA đã có người xác nhận mà chưa Đang xử lý');
    t.conn.prepare("DELETE FROM case_issues WHERE case_id = ? AND role = 'primary'").run(caseId);
    sos.dongBoTrangThaiCase(caseId);
    assert(trangThai() === 'open', 'chưa có nguyên nhân mà vẫn Đang xử lý');
    /* Migrate PR-N1 tính lại đúng luật, chạy lại không đổi thêm. */
    t.conn.prepare("UPDATE sos_cases SET status = 'in_progress' WHERE id = ?").run(caseId);
    assert(mig.demCaseSosDoiTrangThai(t.conn).thanhChuaXuLy >= 1, 'chạy thử không đếm');
    const a: string[] = []; mig.migrateTrangThaiCaseSos(t.conn, a);
    const b: string[] = []; mig.migrateTrangThaiCaseSos(t.conn, b);
    assert(trangThai() === 'open' && a.length === 1 && b.length === 0, `migrate: ${trangThai()} ${a} | ${b}`);
    /* Case GV tự báo giữ luật cũ: có PA là Đang xử lý. */
    const khac = taoPa('q28-5-thuong');
    assert((t.conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(khac.caseId) as any).status === 'in_progress', 'Case thường đổi luật');
  });

  // ==================================================================== 8. Học viên & Lớp + tab Ý thức lớp
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
    const src = docSach('web/src/modules/yThuc/ClassYThucCard.tsx');
    assert(/s\.vp\.so\} vi phạm/.test(src) && /s\.vp\.dong\.map/.test(src) && !/vpGanDay/.test(src), 'thẻ lớp chưa dùng một tập');
  });
}
