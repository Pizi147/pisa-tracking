/**
 * PHÉP KIỂM QUYỀN-KỸ-NĂNG + GIAO-VIỆC-CN (chủ SP 10/11, plan.md B' mục 7 + 9).
 * 7: chỉ QL / Quản trị sửa kỹ năng hồ sơ GV — GV chỉ xem (Hồ sơ cá nhân gửi kỹ năng khác → 403; gửi lại đúng bộ cũ → được).
 * 9: Việc quản lý (`/mgmt-tasks`) giao / theo dõi chỉ cho người có vai ở chi nhánh của việc; ô chọn người lọc theo chi nhánh đó.
 * Mỗi ca ghi trong giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQuyenKyNangTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t as any;
  const accounts: any = await import('../platform/accounts.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const mgmt: any = await import('../worklist/mgmttasks.ts');
  const timNguoi: any = await import('../platform/timNguoi.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nQUYEN-KY-NANG · chỉ QL / QT sửa kỹ năng GV · GIAO-VIEC-CN · Việc quản lý chỉ giao người có vai ở chi nhánh');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const kn = (id: number) => (conn.prepare('SELECT skill FROM user_skills WHERE user_id = ? ORDER BY skill').all(id) as any[]).map((r) => r.skill as string);
  const MB = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
  const CP = (conn.prepare("SELECT id FROM branches WHERE code = 'CP'").get() as any).id as number;
  const gv = P.lrTeacher;

  // ---------------------------------------------------------------- 7
  check('7 · GV tự đổi kỹ năng ở Hồ sơ cá nhân → 403, không ghi; gửi lại đúng bộ cũ (lưu tên) → được', () => thu(() => {
    const cu = kn(gv.userId);
    const moi = cu.includes('speaking') ? cu.filter((k) => k !== 'speaking') : [...cu, 'speaking'];
    const e = loiCua(() => accounts.updateProfile(gv, { skills: moi }));
    assert(e?.status === 403, `kỳ vọng 403, được ${e?.status ?? 'không ném'} ${e?.message ?? ''}`);
    assert(JSON.stringify(kn(gv.userId)) === JSON.stringify(cu), 'kỹ năng đã đổi');
    const r = accounts.updateProfile(gv, { fullName: 'Tên thử', skills: [...cu].reverse() });
    assert(r.fullName === 'Tên thử' && r.suaKyNang === false, `lưu tên + cờ suaKyNang: ${JSON.stringify(r).slice(0, 200)}`);
  }));

  check('7 · QL MB sửa kỹ năng GV MB được (lịch sử kỹ năng ghi); QL CP sửa GV MB → 403; QT sửa được', () => thu(() => {
    const cu = kn(gv.userId);
    const moi = cu.includes('speaking') ? cu.filter((k) => k !== 'speaking') : [...cu, 'speaking'];
    const ls = () => (conn.prepare('SELECT COUNT(*) n FROM user_skill_lich_su WHERE user_id = ?').get(gv.userId) as any).n as number;
    const lsTruoc = ls();
    const e = loiCua(() => accounts.setUserSkills(P.cpManager, gv.userId, moi));
    assert(e?.status === 403, `QL CP: ${e?.status ?? 'không ném'}`);
    assert(JSON.stringify(accounts.setUserSkills(P.mbManager, gv.userId, moi).skills) === JSON.stringify([...moi].sort()), 'QL MB không sửa được');
    assert(ls() > lsTruoc, 'không ghi lịch sử kỹ năng');
    assert(JSON.stringify(accounts.setUserSkills(P.admin, gv.userId, cu).skills) === JSON.stringify([...cu].sort()), 'QT không sửa được');
    const e2 = loiCua(() => accounts.setUserSkills(gv, P.w1Teacher.userId, moi));
    assert(e2?.status === 403, `GV sửa GV khác: ${e2?.status ?? 'không ném'}`);
  }));

  check('7 · Hồ sơ GV: cờ suaKyNang — QL MB có, GV xem chính mình không; Hồ sơ cá nhân QL có', () => {
    assert(hoSo.hoSoGiaoVien(P.mbManager, gv.userId).gv.suaKyNang === true, 'QL MB phải sửa được');
    assert(hoSo.hoSoGiaoVien(gv, gv.userId).gv.suaKyNang === false, 'GV tự xem không được sửa');
    assert(accounts.myProfile(P.mbManager).suaKyNang === true && accounts.myProfile(gv).suaKyNang === false, 'myProfile.suaKyNang');
  });

  // ---------------------------------------------------------------- 9
  check('9 · Việc quản lý chi nhánh MB: người phụ trách / theo dõi là QL CP → 400, không ghi; QL MB → được; Toàn hệ thống → ai cũng được', () => thu(() => {
    const n = () => (conn.prepare('SELECT COUNT(*) n FROM tasks').get() as any).n as number;
    const truoc = n();
    for (const k of ['assigneeUserId', 'watcherUserId']) {
      const e = loiCua(() => mgmt.createMgmtTask(P.admin, { title: `Việc ngoài CN ${k}`, group: 'curriculum', branchId: MB, [k]: P.cpManager.userId }));
      assert(e?.status === 400 && /chi nhánh/.test(e.message), `${k}: ${e?.status} ${e?.message}`);
    }
    assert(n() === truoc, 'đã ghi việc');
    const v = mgmt.createMgmtTask(P.admin, { title: 'Việc đúng CN', group: 'curriculum', branchId: MB, assigneeUserId: P.mbManager.userId });
    const id = v.id ?? v.taskId;
    const e = loiCua(() => mgmt.editMgmtTask(P.admin, id, { assigneeUserId: P.cpManager.userId }));
    assert(e?.status === 400, `sửa sang QL CP: ${e?.status} ${e?.message}`);
    mgmt.editMgmtTask(P.admin, id, { title: 'Đổi tên', assigneeUserId: P.mbManager.userId });   // gửi lại người cũ: không chặn
    mgmt.createMgmtTask(P.admin, { title: 'Việc toàn hệ thống', group: 'curriculum', branchId: null, assigneeUserId: P.cpManager.userId });
  }));

  check('9 · Việc cũ có người phụ trách ngoài chi nhánh: sửa tên (gửi lại người cũ) vẫn lưu', () => thu(() => {
    const v = mgmt.createMgmtTask(P.admin, { title: 'Việc cũ', group: 'curriculum', branchId: MB, assigneeUserId: P.mbManager.userId });
    const id = v.id ?? v.taskId;
    conn.prepare('UPDATE tasks SET assignee_user_id = ? WHERE id = ?').run(P.cpManager.userId, id);
    mgmt.editMgmtTask(P.admin, id, { title: 'Việc cũ đổi tên', assigneeUserId: P.cpManager.userId });
  }));

  check('9 · Ô chọn người (`chiNhanh`): chỉ người có vai ở chi nhánh đó; chi nhánh ngoài phạm vi QL → rỗng', () => {
    const ds = timNguoi.timNguoi(P.admin, { nhom: 'nhan_vien', chiNhanh: MB }).map((r: any) => r.id);
    assert(ds.includes(P.mbManager.userId) && !ds.includes(P.cpManager.userId), `QT lọc MB: ${ds.length} người`);
    const cp = timNguoi.timNguoi(P.admin, { nhom: 'nhan_vien', chiNhanh: CP }).map((r: any) => r.id);
    assert(cp.includes(P.cpManager.userId) && !cp.includes(P.mbManager.userId), 'QT lọc CP');
    assert(timNguoi.timNguoi(P.mbManager, { nhom: 'nhan_vien', chiNhanh: CP }).length === 0, 'QL MB xem được người CP');
  });
}
