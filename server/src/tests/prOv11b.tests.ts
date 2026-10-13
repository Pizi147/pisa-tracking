/**
 * PHÉP KIỂM PR-OV11b — Quản trị · tài khoản: không tự khoá Quản trị, Không duyệt có đường lui (Duyệt lại), vai thiếu chi nhánh bị chặn,
 * sửa không đổi vai thì không "đặt lại vai", nhật ký đúng thao tác, chương trình chưa có lớp sửa như lúc tạo, gọi thẳng bằng vai khác 403.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11bTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const xoa: any = await import('../platform/xoaTaiKhoan.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV11b · Quản trị · tài khoản');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e; } return null; };
  let seq = 0;
  const email = () => `ov11b.${++seq}${accounts.EMAIL_SUFFIX}`;
  const tao = (roles: { role: string; branches: string[] }[]) =>
    accounts.createAccount(P.admin, { email: email(), password: 'matkhau-ov11b', fullName: `Thử OV11b ${seq}`, roles }).userId as number;
  const vai = (id: number) => all(
    `SELECT ur.id, r.key, b.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`, id);
  const soNhatKy = (action: string, id: number) => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?`, action, id).n as number;

  check('OV11b-1 · Quản trị tự gỡ vai Quản trị → 400; QT cuối cùng đổi sang QL → 400; còn QT khác thì gỡ QT kia 200', () => thu(() => {
    const id = P.admin.userId;
    assert(one(`SELECT COUNT(DISTINCT ur.user_id) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'system_admin' AND ur.status = 'active' AND u.status = 'active'`).n === 1, 'demo không còn đúng một QT');
    let e = loi(() => accounts.setRoles(P.admin, id, [{ role: 'manager', branches: ['MB'] }]));
    assert(e?.status === 400, `QT cuối đổi sang QL: ${e?.status} ${e?.message}`);
    assert(vai(id).some((g) => g.key === 'system_admin'), 'đã mất vai QT');
    const qt2 = tao([{ role: 'system_admin', branches: [] }]);
    e = loi(() => accounts.setRoles(P.admin, id, [{ role: 'manager', branches: ['MB'] }]));
    assert(e?.status === 400 && /chính mình/.test(e.message), `tự gỡ vai QT khi còn QT khác: ${e?.status} ${e?.message}`);
    /* Giữ vai QT, thêm vai khác: được. */
    accounts.setRoles(P.admin, id, [{ role: 'system_admin', branches: [] }, { role: 'teacher', branches: ['MB'] }]);
    accounts.setRoles(P.admin, qt2, [{ role: 'manager', branches: ['MB'] }]);
    assert(!vai(qt2).some((g) => g.key === 'system_admin'), 'gỡ QT kia không được');
  }));

  check('OV11b-2 · Đăng ký → Không duyệt → setRoles 400 "Duyệt lại" → đăng ký lại câu đúng → approve 200 → đăng nhập được', () => thu(() => {
    const em = email();
    const { userId } = accounts.register({ email: em, password: 'matkhau-dk', fullName: 'Người Bị Từ Chối', branches: ['MB'] });
    accounts.decline(P.admin, userId, 'Chưa ký hợp đồng');
    const ds = accounts.listAccounts(P.admin).find((u: any) => u.id === userId);
    assert(ds?.approvalState === 'declined' && ds.declineReason === 'Chưa ký hợp đồng', `dòng tài khoản: ${JSON.stringify(ds)}`);
    let e = loi(() => accounts.setRoles(P.admin, userId, [{ role: 'teacher', branches: ['MB'] }]));
    assert(e?.status === 400 && /Duyệt lại/.test(e.message), `setRoles declined: ${e?.status} ${e?.message}`);
    assert(vai(userId).length === 0, 'đã cấp vai cho tài khoản bị từ chối');
    e = loi(() => accounts.register({ email: em, password: 'matkhau-dk', fullName: 'X', branches: ['MB'] }));
    assert(/không được duyệt — liên hệ Quản trị/.test(e?.message ?? ''), `đăng ký lại: ${e?.message}`);
    accounts.approve(P.admin, userId, { role: 'teacher', branches: ['MB'] });
    assert(accounts.login(em, 'matkhau-dk').userId === userId, 'đăng nhập sau Duyệt lại');
    assert(one('SELECT decline_reason FROM users WHERE id = ?', userId).decline_reason === null, 'còn lý do từ chối cũ');
  }));

  check('OV11b-3 · Vai thiếu chi nhánh → 400 ở createAccount (không tạo), setRoles, approve; CX / QT không cần chi nhánh', () => thu(() => {
    const truoc = one('SELECT COUNT(*) n FROM users').n;
    const e = loi(() => tao([{ role: 'teacher', branches: [] }]));
    assert(e?.status === 400 && /Chọn chi nhánh cho vai Giáo viên/.test(e.message), `create: ${e?.status} ${e?.message}`);
    assert(one('SELECT COUNT(*) n FROM users').n === truoc, 'đã tạo tài khoản');
    const id = tao([{ role: 'teacher', branches: ['MB'] }]);
    assert(loi(() => accounts.setRoles(P.admin, id, [{ role: 'manager', branches: [] }]))?.status === 400, 'setRoles QL không CN');
    assert(vai(id).length === 1 && vai(id)[0].key === 'teacher', 'vai cũ bị mất');
    const { userId } = accounts.register({ email: email(), password: 'matkhau-dk', fullName: 'Chờ', branches: ['MB'] });
    assert(loi(() => accounts.approve(P.admin, userId, { role: 'consultant', branches: [] }))?.status === 400, 'approve TVV không CN');
    accounts.approve(P.admin, userId, { role: 'cx', branches: [] });
    assert(vai(userId).length === 1 && vai(userId)[0].key === 'cx' && vai(userId)[0].code === null, `CX toàn hệ thống: ${JSON.stringify(vai(userId))}`);
    /* Trùng email khi tạo → 409 như Sửa thông tin (web hiện dưới ô). */
    const em = one('SELECT email FROM users WHERE id = ?', id).email;
    assert(loi(() => accounts.createAccount(P.admin, { email: em, password: 'matkhau-x', fullName: 'Trùng', roles: [{ role: 'teacher', branches: ['MB'] }] }))?.status === 409,
      'trùng email không 409');
  }));

  check('OV11b-4 · Lưu cùng tập vai → không đóng / chèn user_roles, không dòng user_roles_set', () => thu(() => {
    const id = tao([{ role: 'manager', branches: ['MB'] }, { role: 'teacher', branches: ['MB', 'CP'] }]);
    const truoc = JSON.stringify(vai(id));
    accounts.setRoles(P.admin, id, [{ role: 'teacher', branches: ['CP', 'MB'] }, { role: 'manager', branches: ['MB'] }]);
    assert(JSON.stringify(vai(id)) === truoc, `id vai đổi: ${truoc} → ${JSON.stringify(vai(id))}`);
    assert(soNhatKy('user_roles_set', id) === 0, 'vẫn ghi user_roles_set');
    accounts.setRoles(P.admin, id, [{ role: 'teacher', branches: ['MB'] }]);
    assert(vai(id).length === 1 && soNhatKy('user_roles_set', id) === 1, 'đổi thật không ghi');
  }));

  check('OV11b-5 · Chương trình 0 lớp: thêm Progress, đổi Liên tục ↔ Số tuần → 200; có lớp → 400 như cũ; mã cũ "FOUND" nói đúng lý do', () => thu(() => {
    const goc = { code: 'ABC', name: 'Thử ABC', skills: ['listening', 'reading'], nguongDat: 60, weeks: 8, finalWeek: 8, status: 'active' };
    sysconfig.saveProgramme(P.admin, { ...goc, taoMoi: true });
    const moc = () => all(`SELECT kind, study_week w FROM programme_checkpoints WHERE programme_code = 'ABC' ORDER BY w`).map((r) => `${r.kind}${r.w}`).join();
    assert(moc() === 'final8', moc());
    sysconfig.saveProgramme(P.admin, { ...goc, progressWeek: 4 });
    assert(moc() === 'progress4,final8', `thêm Progress: ${moc()}`);
    sysconfig.saveProgramme(P.admin, { ...goc, weeks: null, finalWeek: null, lapMoiTuan: 3 });
    let ct = sysconfig.listProgrammes(P.admin).find((r: any) => r.code === 'ABC');
    assert(ct.lapMoiTuan === 3 && ct.weeks === null && moc() === '', `sang Liên tục: ${JSON.stringify(ct)} ${moc()}`);
    sysconfig.saveProgramme(P.admin, { ...goc, weeks: 10, finalWeek: 10, progressWeek: 5 });
    ct = sysconfig.listProgrammes(P.admin).find((r: any) => r.code === 'ABC');
    assert(ct.lapMoiTuan === null && ct.weeks === 10 && moc() === 'progress5,final10', `về Số tuần: ${JSON.stringify(ct)} ${moc()}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'programme_updated' AND entity_label = 'ABC'`).n === 3, 'nhật ký sửa');
    /* Có lớp → khoá như cũ: thêm Progress cho chương trình không có Progress → 400. */
    sysconfig.saveProgramme(P.admin, { ...goc, weeks: 8, finalWeek: 8, progressWeek: null });
    const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id;
    intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'ABC', so: '01', startPeriodId: week.ensurePeriod(week.mondayOf(t.TODAY)).id });
    xoaNho();
    const e = loi(() => sysconfig.saveProgramme(P.admin, { ...goc, progressWeek: 4 }));
    assert(e?.status === 400 && /không có bài Progress/.test(e.message), `có lớp: ${e?.status} ${e?.message}`);
    const f = loi(() => sysconfig.saveProgramme(P.admin, { ...goc, code: 'FOUND', taoMoi: true }));
    assert(f?.status === 400 && /mã cũ của FOU/.test(f.message), `FOUND: ${f?.message}`);
  }));

  check('OV11b-6 · Nhật ký: 4 nhãn mới; môn PET hiện "R+W" không mã thô', () => {
    for (const [ma, nhan] of [['programme_created', 'Thêm chương trình'], ['programme_updated', 'Sửa chương trình'],
      ['route_updated', 'Sửa lộ trình FT'], ['user_info_set', 'Sửa thông tin tài khoản']]) {
      assert(d.nhanHanhDongNhatKy(ma) === nhan, `${ma}: ${d.nhanHanhDongNhatKy(ma)}`);
    }
    assert(d.nhanDoiTuongNhatKy('PET · reading_writing') === 'PET · R+W', d.nhanDoiTuongNhatKy('PET · reading_writing'));
    assert(d.nhanDoiTuongNhatKy('KET · listening_speaking') === 'KET · L+S', d.nhanDoiTuongNhatKy('KET · listening_speaking'));
    assert(d.nhanDoiTuongNhatKy('Nguyễn Văn A') === 'Nguyễn Văn A', 'đổi nhãn không phải môn');
  });

  check('OV11b-7 · Quyền cấp riêng có tên; "Chưa có kỹ năng" chỉ đếm người dạy; xoá TVV cảnh báo n HV mất TVV', () => thu(() => {
    assert(d.nhanPhamVi({ role: 'granted', permissions: ['score.override'], branchName: 'Monbay' }) === `Cấp riêng: ${d.PERMISSION_LABEL['score.override']} · Monbay`,
      d.nhanPhamVi({ role: 'granted', permissions: ['score.override'], branchName: 'Monbay' }));
    assert(d.nhanPhamVi({ role: 'teacher', permissions: [], branchName: null }) === 'Giáo viên · Toàn hệ thống', 'nhãn vai');
    const pl = d.phanLoaiTaiKhoan([
      { id: 1, code: 'a', fullName: 'a', email: null, skills: [], extra: [], roles: [{ role: 'consultant', branchCode: 'MB' }] },
      { id: 2, code: 'b', fullName: 'b', email: null, skills: [], extra: [], roles: [{ role: 'teacher', branchCode: 'MB' }] },
    ]);
    assert(pl['chua-ky-nang'] === 1, `chưa có kỹ năng: ${pl['chua-ky-nang']}`);
    const tvv = tao([{ role: 'consultant', branches: ['MB'] }]);
    const hv = one(`SELECT id FROM students WHERE archived_at IS NULL LIMIT 1`).id;
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv, hv);
    const xem = xoa.xemXoaTaiKhoan(P.admin, tvv);
    assert(xem.canhBao.some((c: string) => c === '1 học viên sẽ không còn TVV.'), JSON.stringify(xem.canhBao));
  }));

  check('OV11b-8 · Gọi thẳng bằng QL / GVCN / TVV → 403 (setRoles, approve, createAccount, saveProgramme)', () => thu(() => {
    const tvv = loadPrincipal(tao([{ role: 'consultant', branches: ['MB'] }]));
    const id = tao([{ role: 'teacher', branches: ['MB'] }]);
    for (const p of [P.mbManager, P.coreTeacher, tvv]) {
      for (const [ten, fn] of [
        ['setRoles', () => accounts.setRoles(p, id, [{ role: 'system_admin', branches: [] }])],
        ['approve', () => accounts.approve(p, id, { role: 'teacher', branches: ['MB'] })],
        ['createAccount', () => accounts.createAccount(p, { email: email(), password: 'matkhau-x', fullName: 'x', roles: [{ role: 'teacher', branches: ['MB'] }] })],
        ['saveProgramme', () => sysconfig.saveProgramme(p, { code: 'BE', name: 'x' })],
      ] as const) assert(loi(fn)?.status === 403, `${ten} bằng ${p.userId} không 403`);
    }
  }));
}
