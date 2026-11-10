/**
 * PHÉP KIỂM #4 bản rà 11/11 — "+ Case gọn" (G2-06, G2-11; chủ SP "Theo hết 10 đề xuất"):
 * Mức độ mặc định "Bình thường" · Tên Case tự sinh "{Kỹ năng} · {nhóm nguyên nhân}" (sửa được) · MỘT ngưỡng chữ tối thiểu (`CHU_TOI_THIEU_CASE`) cho
 * Mô tả Case · Nội dung PA (cả Xác nhận PA quy chế) · Nhận xét kết quả PA · Kết luận Hoàn thành Case / Nhập bù — web và máy chủ cùng một số.
 */
import fs from 'node:fs';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrCaseGonTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\n#4 + CASE GỌN · Mức độ mặc định · Tên Case tự sinh · một ngưỡng chữ tối thiểu');

  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const web = (f: string) => fs.readFileSync(`web/src/modules/${f}`, 'utf8');
  const N = d.CHU_TOI_THIEU_CASE as number;
  let seq = 0;
  const emMoi = () => {
    const ten = `CASEGON HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `casegon-${seq}` });
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  };
  const chu = (n: number) => 'x'.repeat(n);

  check('CG-1 · một ngưỡng = 8: Mô tả Case 8 ký tự tạo được (trước 15), 7 → 400; không gửi Mức độ = Bình thường', () => thu(() => {
    assert(N === 8, `CHU_TOI_THIEU_CASE = ${N}`);
    const sid = emMoi();
    const nn = d.issuesForTopic('listening')[0];
    const r = cases.reportIssue(P.coreTeacher, { studentId: sid, topic: 'listening', primaryCode: nn.code, title: `Listening · ${nn.label}`, summary: chu(N), idempotencyKey: 'cg1-a' });
    const c = conn.prepare('SELECT urgency, title FROM sos_cases WHERE id = ?').get(r.id) as any;
    assert(c.urgency === 'attention' && c.title === `Listening · ${nn.label}`, JSON.stringify(c));
    const e = loiCua(() => cases.reportIssue(P.coreTeacher, { studentId: sid, topic: 'reading', primaryCode: d.issuesForTopic('reading')[0].code, title: 'Reading · thử', summary: chu(N - 1), idempotencyKey: 'cg1-b' }));
    assert(e?.status === 400, `mô tả 7 ký tự: ${e?.status}`);
  }));

  check('CG-2 · Hoàn thành Case: kết luận 8 ký tự được (trước 10), 7 → 400 kèm số', () => thu(() => {
    const sid = emMoi();
    const nn = d.issuesForTopic('speaking')[0];
    const r = cases.reportIssue(P.coreTeacher, { studentId: sid, topic: 'speaking', primaryCode: nn.code, title: 'Speaking · thử', summary: chu(N), idempotencyKey: 'cg2' });
    const e = loiCua(() => cases.closeCaseOutcome(P.mbManager, r.id, { outcome: 'improved', note: chu(N - 1) }));
    assert(e?.status === 400 && /8 ký tự/.test(e.message), `${e?.status} ${e?.message}`);
    cases.closeCaseOutcome(P.mbManager, r.id, { outcome: 'improved', note: chu(N) });
    assert((conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(r.id) as any).status === 'done', 'đã hoàn thành');
  }));

  check('CG-3 · web cùng số: + Case, Hoàn thành Case, Mô tả Case ở panel, Nội dung PA (FormPa, Sửa PA, Xác nhận PA quy chế), Nhận xét KQ PA — không còn 15 / 10 viết tay', () => {
    const tep = ['cases/QuickReport.tsx', 'cases/ThaoTacCase.tsx', 'cases/CasePanel.tsx', 'cases/FormPa.tsx', 'cases/CapNhatTuan.tsx', 'yThuc/CaseSosControls.tsx'];
    for (const f of tep) assert(web(f).includes('CHU_TOI_THIEU_CASE'), `${f} chưa dùng CHU_TOI_THIEU_CASE`);
    assert(!/toiThieu: 15|can: 15|toiThieu: 10\b/.test(web('cases/QuickReport.tsx')) && !/toiThieu: 10\b|can: 10\b/.test(web('cases/ThaoTacCase.tsx')), 'còn số viết tay');
    assert(!/toiThieu=\{15\}/.test(web('yThuc/CaseSosControls.tsx')) && /const toiThieu = laMt \? NHAN_XET_MT_TOI_THIEU : CHU_TOI_THIEU_CASE/.test(web('cases/CasePanel.tsx')), 'Xác nhận PA / Mô tả Case còn 15');
  });

  check('CG-4 · + Case: Mức độ mặc định "Bình thường" (attention), Tên Case tự sinh {Kỹ năng} · {nhóm} tới khi gõ tay, gửi đúng chữ trong ô; Tên / Mức không dấu *', () => {
    const q = web('cases/QuickReport.tsx');
    assert(/const MUC_DO_MAC_DINH = 'attention'/.test(q) && /useState\(MUC_DO_MAC_DINH\)/.test(q) && /setUrgency\(MUC_DO_MAC_DINH\)/.test(q), 'mức mặc định');
    assert(/const tenTuDong = /.test(q) && /value=\{v\.tenTay \? v\.title : tenTuDong\(kn\)\}/.test(q) && /title: ghiVao\(kn\) \? null : tenGui\(kn\)/.test(q), 'tên tự sinh');
    assert(/<Truong nhan=\{t\('Tên Case'\)\} loi=/.test(q) && /<Truong nhan=\{t\('Mức độ'\)\} as="div"/.test(q), 'Tên / Mức còn dấu *');
  });
}
