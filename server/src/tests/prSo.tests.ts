/** PHÉP KIỂM PR-SO — số liệu một nguồn & dọn mã máy chủ (kế hoạch 2026-10-04-pr-so-so-lieu-don-ma, SO-1 → SO-4). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSoTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const itemsCua = (p: any, f: any = {}) => (mw.myWork(p, f).groups as any[]).flatMap((x) => x.items);
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `PRSO HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `prso-${seq}` });
    return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };

  // ------------------------------------------------------------------ SO-1 · D2 một hàm chọn PA đại diện nhóm Bổ trợ
  console.log('\nPR-SO · (1) D2: PA đại diện nhóm Bổ trợ — Tổng quan và Công việc cùng một hàm');
  check('SO-1a · daiDienNhomBoTro: hạn sớm nhất (null cuối), hoà → id nhỏ; dòng không nhóm giữ nguyên, giữ thứ tự', () => {
    const r = (id: number, nhom: string | null, han: string | null, kind = 'bo_tro') => ({ id, kind, nhom_bo_tro: nhom, action_due: han });
    const ra = d.daiDienNhomBoTro([r(5, 'g1', '2026-09-20'), r(6, 'g1', '2026-09-10'), r(7, 'g1', null), r(8, null, '2026-09-01', 'tutor')]);
    assert(ra.map((x: any) => x.id).join() === '6,8', ra.map((x: any) => x.id).join());
    const hoa = d.daiDienNhomBoTro([r(9, 'g2', '2026-09-10'), r(3, 'g2', '2026-09-10'), r(4, 'g3', null), r(2, 'g3', null)]);
    assert(hoa.map((x: any) => x.id).join() === '3,2', hoa.map((x: any) => x.id).join());
  });

  check('SO-1b · nhóm Bổ trợ: PA id nhỏ hạn ngày mai, PA id lớn quá hạn 3 ngày → chỉ số QL có id lớn, Công việc QL có đúng dòng đó (quá hạn); số khớp', () => {
    const sid = emMoi('MB FOU 12');
    const moCase = (topic: string, parallel: boolean) => cases.reportIssue(P.normalCoreTeacher, { studentId: sid, topic, title: `Case bổ trợ SO-1b ${topic}`,
      summary: 'Case dùng cho phép kiểm PA đại diện nhóm.', primaryCode: d.issuesForTopic(topic)[0].code, idempotencyKey: `prso-1b-${topic}-${sid}`, parallel });
    const nhom = `prso-nhom-${sid}`;
    const pa = (caseId: number, han: string) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, action_due, cycle_no, nhom_bo_tro, created_at)
       VALUES (?, 'bo_tro', 'Bổ trợ chung SO-1b', NULL, ?, 'started', ?, ?, 1, ?, ?)`).run(caseId, P.normalCoreTeacher.userId, addDays(TODAY, -21), han, nhom, new Date().toISOString()).lastInsertRowid);
    const nho = pa(moCase('reading', false).id, addDays(TODAY, 1));
    const lon = pa(moCase('listening', true).id, addDays(TODAY, -3));
    assert(nho < lon, 'dựng dữ liệu: id nhỏ trước');
    const ql = P.mbManager;
    const cs = (metrics.metricSet(ql, 'pa-can-cap-nhat', {}).ids as number[]).filter((id) => id === nho || id === lon);
    const v = itemsCua(ql, { nguoi: 'tat-ca' }).filter((i: any) => i.group === 'ghi_ket_qua_pa' && (i.key === `action:${nho}` || i.key === `action:${lon}`));
    assert(cs.join() === String(lon), `chỉ số: ${cs.join()} (mong ${lon})`);
    assert(v.length === 1 && v[0].key === `action:${lon}` && v[0].urgency === 'overdue', `Công việc: ${JSON.stringify(v.map((i: any) => [i.key, i.urgency]))}`);
  });
}
