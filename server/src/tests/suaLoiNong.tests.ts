/** PHÉP KIỂM PR-N1 — sửa lỗi nóng + sửa sai sự thật (kế hoạch 2026-09-28). Harness do run.ts truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

/* Chạy từ `dist-server/server/src/tests/` → lên 3 cấp là `dist-server/`, thêm một cấp là gốc repo. */
const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const docSach = (rel: string) => boChuThich(fs.readFileSync(path.join(REPO, rel), 'utf8'));

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
}
