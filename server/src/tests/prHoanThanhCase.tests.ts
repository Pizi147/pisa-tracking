/**
 * PHÉP KIỂM #3 bản rà 11/11 — Kết thúc PA cuối = ô tick "Hoàn thành Case" trong form đang mở (G2-04, G2-05, G2-07; chủ SP "chỉ để 'Hoàn thành case',
 * không có dấu '?'"): luồng máy chủ form gọi (Kết thúc PA → Hoàn thành Case với kết luận = Nhận xét; Hoàn tác = Mở lại Case rồi bỏ lần ghi) + mã web.
 */
import fs from 'node:fs';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrHoanThanhCaseTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\n#3 HOÀN THÀNH CASE · ô tick khi kết thúc PA cuối · kết luận điền sẵn · "n PA xong · chờ Hoàn thành"');

  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const web = (f: string) => fs.readFileSync(`web/src/modules/${f}`, 'utf8');
  let seq = 0;
  const caseMotPa = () => {
    const ten = `HTCASE HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `htcase-${seq}` });
    const sid = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', primaryCode: d.issuesForTopic('listening')[0].code, title: 'Listening · thử',
      summary: 'Em bỏ sót số ở Section 2.', idempotencyKey: `htcase-c-${seq}` });
    const iv = cases.recordIntervention(P.lrTeacher, c.id, { kind: 'self_study', description: 'Tự học nghe chép 15 phút', performerSelf: true, status: 'started', startedDate: demoToday() });
    return { caseId: c.id as number, ivId: (iv.interventions ?? iv).find?.((x: any) => x.kind === 'self_study')?.id ?? iv.id };
  };

  check('HTC-1 · Kết thúc PA cuối rồi Hoàn thành Case (mức theo Tiến triển, kết luận = Nhận xét) cùng lần bấm; Hoàn tác: Mở lại Case → bỏ lần ghi → PA chạy lại', () => thu(() => {
    const { caseId, ivId } = caseMotPa();
    const ct = cases.updateResult(P.lrTeacher, ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số đúng hết' });
    const f = (ct.followups ?? []).find((x: any) => x.interventionId === ivId);
    const muc = d.CASE_OUTCOMES.find((x: string) => d.CASE_OUTCOME_LABEL[x] === d.outcomeLabelFor('improved'));
    assert(muc === 'much_better', `mức theo Tiến triển: ${muc}`);
    cases.closeCaseOutcome(P.lrTeacher, caseId, { outcome: muc, note: 'Em nghe số đúng hết' });
    assert((conn.prepare('SELECT status, outcome FROM sos_cases WHERE id = ?').get(caseId) as any).status === 'done', 'Case xong');
    cases.moLaiCase(P.lrTeacher, caseId);
    cases.hoanTacKetQua(P.lrTeacher, f.id);
    const sau = conn.prepare('SELECT c.status cs, i.status ps FROM sos_cases c JOIN case_interventions i ON i.case_id = c.id WHERE c.id = ? AND i.id = ?').get(caseId, ivId) as any;
    assert(sau.cs !== 'done' && (sau.ps === 'started' || sau.ps === 'planned'), JSON.stringify(sau));
  }));

  check('HTC-2 · web: ô tick "Hoàn thành Case" (không dấu "?") chỉ khi kết thúc PA (Kết thúc PA / Kết quả cuối) + PA cuối + người xem hoàn thành được; lưu kết quả rồi /cases/:id/outcome; Hoàn tác mở lại Case trước', () => {
    const c = web('cases/CapNhatTuan.tsx');
    assert(/\{t\('Hoàn thành Case'\)\}/.test(c) && !/Hoàn thành Case luôn\?|'Hoàn thành Case\?'/.test(c), 'nhãn ô tick');
    assert(/const ketThucPa = !sua && \(lanCuoi \|\| decision === 'end'\)/.test(c) && /hoanThanhCase && ketThucPa/.test(c), 'điều kiện hiện ô');
    assert(/api\.post\(`\/cases\/\$\{hoanThanhCase\.caseId\}\/outcome`/.test(c) && /\/cases\/\$\{hoanThanhCase\.caseId\}\/mo-lai/.test(c), 'gọi Hoàn thành + Mở lại khi Hoàn tác');
    assert(/const noteHt = htNote \?\? \(nhanXetTheoBuoi \? ghepBuoi : progress\)/.test(c), 'kết luận điền sẵn Nhận xét');
    const p = web('cases/CasePanel.tsx');
    assert(/function paCuoiHoanThanh\(/.test(p) && /hoanThanhCase=\{paCuoiHoanThanh\(data, iv\.id\)/.test(p) && /ketLuanSan=/.test(p), 'CasePanel truyền PA cuối + kết luận sẵn');
    assert(/useState\(ketLuanSan \?\? ''\)/.test(web('cases/ThaoTacCase.tsx')), 'Hoàn thành Case điền sẵn kết luận (G2-07)');
  });

  check('HTC-3 · dòng Case (G2-04): mọi PA đã khép, Case chưa xong → "n PA xong · chờ Hoàn thành" ở hồ sơ HV + hồ sơ lượt Mock (không "Chưa có PA")', () => {
    assert(/\{n\} PA xong · chờ Hoàn thành/.test(web('students/CotCaseHv.tsx')) && /\{n\} PA xong · chờ Hoàn thành/.test(web('fasttrack/MockDetailPage.tsx')), 'chữ mới');
  });
  check('HTC-4 · rà 11/11 (việc để sau #3): "Kết thúc sớm…" PA quy chế có ô "Hoàn thành Case" khi là PA cuối; mức chọn, kết luận điền sẵn lý do; Hoàn tác mở lại Case rồi mở lại PA', () => {
    const p = web('cases/CasePanel.tsx');
    assert(/<KetThucSom iv=\{iv\} hoanThanhCase=\{paCuoiHoanThanh\(data, iv\.id\)/.test(p), 'CasePanel truyền PA cuối cho Kết thúc sớm');
    const k = p.slice(p.indexOf('function KetThucSom('), p.indexOf('/** Mockup `.ket`'));
    assert(/\{t\('Hoàn thành Case'\)\}/.test(k) && /const noteHt = htNote \?\? lyDo/.test(k), 'ô tick + kết luận = lý do');
    assert(k.indexOf('/ket-thuc`') < k.indexOf('/outcome`') && k.indexOf('/mo-lai`') < k.indexOf('/hoan-tac-ket-thuc`'), 'thứ tự gọi: kết thúc PA → hoàn thành; Hoàn tác: mở lại Case → mở lại PA');
  });
}
