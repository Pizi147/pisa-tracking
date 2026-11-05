/**
 * PHÉP KIỂM QUYEN-RIENG (chủ SP 05/11, bản chính CP: GV Nguyễn Hoàng Dũng thiếu việc PA / Ý thức ở Công việc) — GV được cấp RIÊNG quyền
 * `score.override` (Quản trị › cấp quyền, "nhập bù ngoài phân công") vẫn là GV: góc nhìn Admin "chỉ Chấm điểm" (`phamViXemViec` = `cham-diem`)
 * chỉ đến từ VAI có `score.override` (Admin), không từ quyền cấp riêng. Mọi việc của GV hiện ở "Của tôi", "Của GV" (QL `viecCuaNguoi`), "Tất cả".
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQuyenRiengTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const perm: any = await import('../permissions.ts');
  const { phamViXemViec } = await import('../worklist/xemViec.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nQUYEN-RIENG · GV có quyền cấp riêng score.override vẫn đủ việc ở Của tôi / Của GV / Tất cả');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const nhom = (ds: any[]) => [...new Set(ds.map((d) => d.group))].sort();
  const khoa = (ds: any[]) => ds.map((d) => d.key).sort();

  /* GV (chỉ vai teacher) của chi nhánh MB có việc ngoài Chấm điểm — cả Kết quả PA lẫn Ý thức nếu demo có. */
  const ung = [P.coreTeacher, P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher, P.subjectTeacher, P.normalCoreTeacher, P.normalSubjectTeacher]
    .filter((x: any) => x.roleKeys.length === 1 && x.roleKeys[0] === 'teacher');
  const diem = (x: any) => { const g = nhom(mywork.myWork(x, {}).dong); return (g.includes('ghi_ket_qua_pa') ? 2 : 0) + (g.some((k) => k.startsWith('yt_')) ? 2 : 0) + g.length; };
  const gv0 = ung.map((x: any) => [x, diem(x)] as const).sort((a, b) => b[1] - a[1])[0]?.[0];
  assert(gv0, 'demo phải có GV chỉ vai teacher');
  const mb = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const sp = one(`SELECT id FROM permissions WHERE key = 'score.override'`).id as number;

  check('Q1 GV + quyền cấp riêng score.override: phamViXemViec = null; Của tôi = như không có quyền (đủ nhóm, cùng số badge)', () => thu(() => {
    const truoc = mywork.myWork(gv0, {});
    assert(nhom(truoc.dong).some((g) => g !== 'score'), `GV mẫu phải có việc ngoài Chấm điểm: ${nhom(truoc.dong)}`);
    conn.prepare(`INSERT INTO user_permissions (user_id, permission_id, branch_id, note, granted_by, created_at) VALUES (?, ?, ?, 'thử', ?, datetime('now'))`).run(gv0.userId, sp, mb, P.admin.userId);
    xoaNho();
    const gv = perm.loadPrincipal(gv0.userId);
    assert(perm.can(gv, 'score.override', { anyScope: true }), 'quyền cấp riêng phải có hiệu lực (nhập bù)');
    assert(phamViXemViec(gv) === null, `GV có quyền cấp riêng không thành góc nhìn Admin: ${phamViXemViec(gv)}`);
    const sau = mywork.myWork(gv, {});
    assert(JSON.stringify(nhom(sau.dong)) === JSON.stringify(nhom(truoc.dong)), `Của tôi thiếu nhóm: ${nhom(sau.dong)} ≠ ${nhom(truoc.dong)}`);
    assert(JSON.stringify(khoa(sau.dong)) === JSON.stringify(khoa(truoc.dong)), 'Của tôi cùng mọi dòng');
    assert(JSON.stringify(sau.summary) === JSON.stringify(truoc.summary), `badge lệch: ${JSON.stringify(sau.summary)} ≠ ${JSON.stringify(truoc.summary)}`);
  }));

  check('Q2 QL xem "Của GV" (viecCuaNguoi) và "Tất cả": cùng việc ngoài Chấm điểm của GV có quyền cấp riêng', () => thu(() => {
    const cuaGv0 = mywork.viecCuaNguoi(P.mbManager, gv0.userId, mb);
    const tatCa0 = mywork.myWork(P.mbManager, { branchId: mb, nguoi: 'tat-ca', tachCuaToi: true }).dong.filter((d: any) => d.ownerId === gv0.userId);
    conn.prepare(`INSERT INTO user_permissions (user_id, permission_id, branch_id, note, granted_by, created_at) VALUES (?, ?, ?, 'thử', ?, datetime('now'))`).run(gv0.userId, sp, mb, P.admin.userId);
    xoaNho();
    const cuaGv = mywork.viecCuaNguoi(P.mbManager, gv0.userId, mb);
    assert(JSON.stringify(nhom(cuaGv.dong)) === JSON.stringify(nhom(cuaGv0.dong)) && nhom(cuaGv.dong).some((g) => g !== 'score'),
      `Của GV thiếu nhóm: ${nhom(cuaGv.dong)} ≠ ${nhom(cuaGv0.dong)}`);
    assert(JSON.stringify(cuaGv.summary) === JSON.stringify(cuaGv0.summary), 'badge Của GV lệch');
    const tatCa = mywork.myWork(P.mbManager, { branchId: mb, nguoi: 'tat-ca', tachCuaToi: true }).dong.filter((d: any) => d.ownerId === gv0.userId);
    assert(JSON.stringify(khoa(tatCa)) === JSON.stringify(khoa(tatCa0)), 'Tất cả: dòng của GV không đổi');
    /* Ba góc nhìn cùng tập việc ngoài Chấm điểm (Chấm điểm "Tất cả" gom theo lớp khác "Của tôi" — không so). */
    const ngoai = (ds: any[]) => khoa(ds.filter((d) => d.group !== 'score'));
    const cuaToi = mywork.myWork(perm.loadPrincipal(gv0.userId), {}).dong;
    assert(JSON.stringify(ngoai(cuaToi)) === JSON.stringify(ngoai(cuaGv.dong)), `Của tôi ≠ Của GV: ${ngoai(cuaToi)} | ${ngoai(cuaGv.dong)}`);
    for (const k of ngoai(cuaToi).filter((x) => /^action:|^yt|^vi/.test(x))) assert(khoa(tatCa).includes(k), `Tất cả thiếu ${k}`);
  }));

  check('Q3 Admin (vai office_admin có score.override) vẫn góc nhìn Chấm điểm', () => {
    const u = one(`SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'office_admin' AND ur.status = 'active' ORDER BY ur.id`);
    assert(u, 'demo phải có Admin');
    assert(phamViXemViec(perm.loadPrincipal(u.user_id)) === 'cham-diem', 'Admin mất góc nhìn Chấm điểm');
  });
}
