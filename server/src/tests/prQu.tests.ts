/** PHÉP KIỂM PR-QU — quyền tạo lớp, GVCN phân công GV bộ môn, tạo lớp hàng loạt, Quản trị quyền, GV đóng Case. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const perm: any = await import('../permissions.ts');
  const intake: any = await import('../classes/intake.ts');
  const cls: any = await import('../classes/classes.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const cases: any = await import('../cases/cases.ts');
  const migrateMod: any = await import('../migrate.ts');
  const { loadPrincipal } = perm;
  console.log('\nPR-QU · Quyền tạo lớp, GVCN phân công, tạo lớp hàng loạt, Quản trị quyền, GV đóng Case');

  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? 500; } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const cn = (code: string) => get('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB'); const CP = cn('CP');
  /* GV thuần (chỉ vai teacher) của chi nhánh — đủ người cho lớp thử. */
  const gvMb: number[] = all(`SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.branch_id = ? AND ur.status = 'active' AND u.status = 'active'
        AND u.id NOT IN (SELECT ur2.user_id FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id WHERE r2.key != 'teacher')
      ORDER BY u.id LIMIT 4`, MB).map((r) => r.id);
  assert(gvMb.length >= 4, `seed: MB cần ≥ 4 GV thuần, có ${gvMb.length}`);
  const soLop = () => (get('SELECT COUNT(*) n FROM classes').n as number);
  const coPhanCong = (classId: number, userId: number, skill: string | null) =>
    !!get(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND ${skill ? 'skill = ?' : 'is_core = 1'}`,
      ...(skill ? [classId, userId, skill] : [classId, userId]));

  // ================================================================== QU-1
  check('QU-1 mọi quyền thuộc đúng một nhóm và có mô tả', () => {
    const nhom = new Set(d.NHOM_QUYEN.map((n: any) => n.key));
    for (const k of Object.values(d.PERMISSIONS) as string[]) {
      const m = d.MO_TA_QUYEN[k];
      assert(m, `thiếu mô tả ${k}`);
      assert(nhom.has(m.nhom), `${k} nhóm lạ`);
      assert(m.moTa.trim().length > 5 && /[.]$/.test(m.moTa.trim()), `${k} mô tả phải là một câu`);
      assert(d.PERMISSION_LABEL[k], `thiếu nhãn ${k}`);
    }
    assert(Object.keys(d.MO_TA_QUYEN).length === Object.values(d.PERMISSIONS).length, 'mô tả thừa quyền không tồn tại');
    assert(d.NHOM_QUYEN.length === 8 && d.NHOM_QUYEN.every((n: any) => Object.values(d.MO_TA_QUYEN).some((m: any) => m.nhom === n.key)), 'nhóm rỗng');
  });
  check('QU-1 admin.config và quyền chỉ suy ra không cấp riêng được', () => {
    assert(!d.duocCapRieng('admin.config') && !d.duocCapRieng('khong.co') && d.duocCapRieng('class.create'), 'whitelist sai');
    assert(!d.duocCapRieng('class.assign_subject'), 'class.assign_subject là quyền suy ra');
    assert(d.lyDoCamVai('teacher', 'plan.week')?.includes('SCH-01') && d.lyDoCamVai('manager', 'plan.week') === null, 'SCH-01');
  });
  check('QU-1 migrate cấp class.create cho manager + system_admin, không cho teacher', () => {
    const co = (r: string, k = 'class.create') => !!get(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id
      JOIN permissions p ON p.id=rp.permission_id WHERE r.key=? AND p.key=?`, r, k);
    assert(co('manager') && co('system_admin') && !co('teacher'), 'cấp sai vai');
    assert(!get(`SELECT 1 FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE p.key='class.assign_subject'`), 'assign_subject không cấp theo vai');
    assert(co('teacher', 'case.close'), 'QU-8: vai teacher có case.close');
  });
  check('QU-1 migrate trên DB cũ (chưa có class.create, GV chưa có case.close): cấp đúng vai, chạy lại không đổi gì, không gỡ student.edit', () => {
    const quyenId = (k: string) => get('SELECT id FROM permissions WHERE key = ?', k)?.id;
    const vaiId = (k: string) => get('SELECT id FROM roles WHERE key = ?', k).id;
    /* Giả DB cũ: bỏ hai quyền mới, bỏ case.close của teacher và khoá một-lần. */
    for (const k of ['class.create', 'class.assign_subject']) {
      conn.prepare('DELETE FROM role_permissions WHERE permission_id = ?').run(quyenId(k));
      conn.prepare('DELETE FROM user_permissions WHERE permission_id = ?').run(quyenId(k));
      conn.prepare('DELETE FROM permissions WHERE key = ?').run(k);
    }
    conn.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(vaiId('teacher'), quyenId('case.close'));
    conn.prepare("DELETE FROM demo_config WHERE key = 'pr_qu_case_close_gv_at'").run();
    const seEdit = (get(`SELECT COUNT(*) n FROM role_permissions WHERE permission_id = ?`, quyenId('student.edit')).n);
    const lan1 = migrateMod.migrate().applied as string[];
    const dem = () => get('SELECT COUNT(*) n FROM role_permissions').n + get('SELECT COUNT(*) n FROM permissions').n;
    const sau1 = dem();
    const co = (r: string, k: string) => !!get(`SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?`, vaiId(r), quyenId(k));
    assert(co('manager', 'class.create') && co('system_admin', 'class.create') && !co('teacher', 'class.create'), `lần 1: ${lan1.join(' · ')}`);
    assert(quyenId('class.assign_subject') && !get('SELECT 1 FROM role_permissions WHERE permission_id = ?', quyenId('class.assign_subject')), 'assign_subject');
    assert(co('teacher', 'case.close'), 'GV chưa có case.close sau migrate');
    const lan2 = migrateMod.migrate().applied as string[];
    assert(dem() === sau1 && !lan2.some((x) => /PR-QU|quyền mới/.test(x)), `lần 2 còn việc: ${lan2.join(' · ')}`);
    /* Quản trị gỡ case.close của GV → deploy sau KHÔNG tự cấp lại. */
    conn.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(vaiId('teacher'), quyenId('case.close'));
    migrateMod.migrate();
    assert(!co('teacher', 'case.close'), 'migrate cấp lại ô Quản trị đã gỡ');
    conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vaiId('teacher'), quyenId('case.close'));
    assert(get(`SELECT COUNT(*) n FROM role_permissions WHERE permission_id = ?`, quyenId('student.edit')).n === seEdit, 'student.edit bị gỡ');
  });

  // ================================================================== QU-2
  const gvLe = gvMb[3];
  check('QU-2 student.edit cấp riêng KHÔNG tạo được lớp; class.create cấp riêng ở MB tạo được ở MB, không ở CP; QL vẫn tạo', () => {
    accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'student.edit', branchCode: 'MB' }]);
    let gv = loadPrincipal(gvLe);
    assert(maLoi(() => intake.taoLopVaPhanCong(gv, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9701' })) === 403, 'student.edit tạo được lớp');
    assert(hvl.danhSachHocVienLop(gv, {}).coTheTaoLop === false && hvl.chiNhanhTaoLop(gv).length === 0, 'coTheTaoLop phải false');
    accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'class.create', branchCode: 'MB' }], 'Thử QU-2');
    gv = loadPrincipal(gvLe);
    const r = intake.taoLopVaPhanCong(gv, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9702' });
    assert(r.code === 'MB FT 9702', JSON.stringify(r));
    assert(maLoi(() => intake.taoLopVaPhanCong(gv, { branchId: CP, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9703' })) === 403, 'CP phải 403');
    assert(JSON.stringify(hvl.chiNhanhTaoLop(gv)) === JSON.stringify([MB]) && hvl.danhSachHocVienLop(gv, {}).coTheTaoLop === true, 'chỉ MB');
    /* GV có class.create nhưng không có class.assign: kèm phân công → 403 (G5). */
    assert(maLoi(() => intake.taoLopVaPhanCong(gv, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9704',
      slots: [{ userId: gvMb[0], skill: null, isCore: true }, { userId: gvMb[0], skill: 'listening', isCore: false }] })) === 403, 'phân công cần class.assign');
    const ql = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9705' });
    assert(ql.code === 'MB FT 9705', 'QL');
    assert(perm.can(P.coreTeacher, 'class.create', { branchId: MB }) === false, 'GV thường không có class.create');
    accounts.setUserPermissions(P.admin, gvLe, [], 'Dọn QU-2');
  });

  // ================================================================== QU-3
  /* Lớp thử: GVCN = gvMb[0] (dạy W1), L = gvMb[1], R = gvMb[2]. */
  const lopC = intake.taoLopVaPhanCong(P.admin, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9710', slots: [
    { userId: gvMb[0], skill: null, isCore: true }, { userId: gvMb[0], skill: 'writing1', isCore: false },
    { userId: gvMb[1], skill: 'listening', isCore: false }, { userId: gvMb[2], skill: 'reading', isCore: false }] }).id as number;
  const lopD = intake.taoLopVaPhanCong(P.admin, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9711', slots: [
    { userId: gvMb[1], skill: null, isCore: true }, { userId: gvMb[1], skill: 'listening', isCore: false }] }).id as number;
  const slotsHienTai = (classId: number) => all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, classId)
    .map((a) => ({ userId: a.user_id, skill: a.skill, isCore: a.is_core === 1 }));
  const gvcn = () => loadPrincipal(gvMb[0]);
  check('QU-3 (1) GVCN đổi GV Reading lớp mình: được, audit via:gvcn, Quản lý MB nhận thông báo', () => {
    const moi = slotsHienTai(lopC).map((s: any) => (s.skill === 'reading' ? { ...s, userId: gvMb[3] } : s));
    cls.setClassTeachers(gvcn(), lopC, { slots: moi });
    assert(coPhanCong(lopC, gvMb[3], 'reading') && !coPhanCong(lopC, gvMb[2], 'reading'), 'chưa đổi');
    const a = get(`SELECT after_json FROM audit_logs WHERE action = 'class.assign' AND entity_id = ? ORDER BY id DESC LIMIT 1`, lopC);
    const sau = JSON.parse(a.after_json);
    assert(sau.via === 'gvcn' && Array.isArray(sau.truoc) && Array.isArray(sau.sau), a.after_json);
    assert(!!get(`SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'phan_cong_gvcn' AND entity_id = ?`, P.mbManager.userId, lopC), 'QL chưa nhận thông báo');
  });
  check('QU-3 (2) GVCN đổi ô GVCN (thay / bỏ / thêm người) → 403, DB không đổi', () => {
    const truoc = JSON.stringify(slotsHienTai(lopC));
    const cu = slotsHienTai(lopC);
    const thay = cu.map((s: any) => (s.isCore ? { ...s, userId: gvMb[2] } : s));
    const bo = cu.filter((s: any) => !s.isCore);
    for (const [ten, slots] of [['thay', thay], ['bỏ', bo]] as const) {
      assert(maLoi(() => cls.setClassTeachers(gvcn(), lopC, { slots })) === 403, `${ten} GVCN phải 403`);
    }
    assert(JSON.stringify(slotsHienTai(lopC)) === truoc, 'DB đổi');
  });
  check('QU-3 (3)(4) GVCN sửa lớp không chủ nhiệm → 403; GV bộ môn (không core) → 403', () => {
    assert(maLoi(() => cls.setClassTeachers(gvcn(), lopD, { slots: slotsHienTai(lopD) })) === 403, 'lớp D');
    assert(maLoi(() => cls.setClassTeachers(loadPrincipal(gvMb[1]), lopC, { slots: slotsHienTai(lopC) })) === 403, 'GVBM');
  });
  check('QU-3 (5) luật phân công vẫn chặn GVCN: GV khác chi nhánh → 400', () => {
    const gvCp = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.branch_id = ? AND u.id NOT IN (SELECT user_id FROM user_roles WHERE branch_id = ? OR branch_id IS NULL) LIMIT 1`, CP, MB).id;
    const slots = slotsHienTai(lopC).map((s: any) => (s.skill === 'listening' ? { ...s, userId: gvCp } : s));
    assert(maLoi(() => cls.setClassTeachers(gvcn(), lopC, { slots })) === 400, 'khác chi nhánh');
  });
  check('QU-3 (6) /ref/teachers?classId=C với GVCN → GV chi nhánh C; không classId / lớp không chủ nhiệm → 403', () => {
    const ds = cls.giaoVienPhanCong(gvcn(), { classId: lopC });
    assert(ds.length > 0 && ds.every((u: any) => !!get(`SELECT 1 FROM user_roles WHERE user_id = ? AND status = 'active' AND (branch_id = ? OR branch_id IS NULL)`, u.id, MB)), 'GV ngoài MB');
    assert(maLoi(() => cls.giaoVienPhanCong(gvcn(), {})) === 403 && maLoi(() => cls.giaoVienPhanCong(gvcn(), { classId: lopD })) === 403, '403');
    assert(cls.giaoVienPhanCong(P.mbManager, { branchId: MB }).length > 0, 'QL');
  });
  check('QU-3 (7) viewer: GVCN canAssign=false, canAssignSubject=true; GVBM cả hai false; QL cả hai true', () => {
    const v = cls.classTeachers(gvcn(), lopC).viewer;
    assert(v.canAssign === false && v.canAssignSubject === true, JSON.stringify(v));
    const b = cls.classTeachers(loadPrincipal(gvMb[1]), lopC).viewer;
    assert(b.canAssign === false && b.canAssignSubject === false, JSON.stringify(b));
    const q = cls.classTeachers(P.mbManager, lopC).viewer;
    assert(q.canAssign && q.canAssignSubject, JSON.stringify(q));
    const o = cls.classOverview(gvcn(), lopC).viewer;
    assert(o.canAssign === false && o.canAssignSubject === true, 'classOverview');
  });

  // ================================================================== QU-4
  const nhieuDong = (so: string[], extra: any = {}) => so.map((s) => ({ branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: s, ...extra }));
  check('QU-4 (1)(4)(9) 3 dòng hợp lệ → 3 lớp có phân công; gọi lại cùng khoá → cùng id, không thêm; POST một lớp giữ dạng {id, code}', () => {
    const truoc = soLop();
    const rows = nhieuDong(['9721', '9722'], { slots: [{ userId: gvMb[0], skill: null, isCore: true }, { userId: gvMb[0], skill: 'reading', isCore: false }] });
    rows.push({ branchId: MB, chuongTrinh: 'BE', loTrinh: null, so: '9723', startPeriodId: 1 } as any);
    const r1 = intake.taoLopHangLoat(P.mbManager, { rows, idempotencyKey: 'qu4-a' });
    assert(r1.ok && r1.lop.length === 3 && soLop() === truoc + 3, JSON.stringify(r1));
    assert(coPhanCong(r1.lop[0].id, gvMb[0], null) && coPhanCong(r1.lop[1].id, gvMb[0], 'reading'), 'phân công');
    const r2 = intake.taoLopHangLoat(P.mbManager, { rows, idempotencyKey: 'qu4-a' });
    assert(JSON.stringify(r2) === JSON.stringify(r1) && soLop() === truoc + 3, 'lặp khoá tạo thêm');
    const mot = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'FT', loTrinh: 'RF', so: '9724' });
    assert(Object.keys(mot).sort().join() === 'code,id' && mot.code === 'MB FT RF 9724', JSON.stringify(mot));
  });
  check('QU-4 (2) dòng 2 trùng mã với dòng 1 → ok:false, lỗi ở dòng 2, DB không đổi; trùng với lớp đã có cũng báo', () => {
    const truoc = soLop();
    const r = intake.taoLopHangLoat(P.mbManager, { rows: nhieuDong(['9731', '9731', '9721']) });
    assert(!r.ok && r.loi[0].dong === 2 && r.loi[0].truong === 'so' && /dòng 1/.test(r.loi[0].loi), JSON.stringify(r.loi));
    assert(r.loi.some((l: any) => l.dong === 3 && /Đã có lớp/.test(l.loi)), 'trùng DB');
    assert(soLop() === truoc, 'có lớp được tạo');
  });
  check('QU-4 (3) dòng 3 vi phạm luật phân công → không lớp nào', () => {
    const truoc = soLop();
    const rows: any[] = nhieuDong(['9741', '9742', '9743']);
    rows[2].slots = [{ userId: gvMb[0], skill: null, isCore: true }, { userId: gvMb[1], skill: null, isCore: true }];
    const r = intake.taoLopHangLoat(P.mbManager, { rows });
    assert(!r.ok && r.loi.length === 1 && r.loi[0].dong === 3 && r.loi[0].truong === 'slots' && soLop() === truoc, JSON.stringify(r));
  });
  check('QU-4 (5) người khác dùng cùng khoá không đọc được kết quả người kia', () => {
    const r = intake.taoLopHangLoat(P.admin, { rows: nhieuDong(['9751']), idempotencyKey: 'qu4-a' });
    assert(r.ok && r.lop[0].code === 'MB FT 9751', `đọc nhầm kết quả của QL: ${JSON.stringify(r)}`);
    assert(maLoi(() => intake.taoLopHangLoat(P.cpManager, { rows: nhieuDong(['9752']), idempotencyKey: 'qu4-a' })) === 403, 'QL CP');
  });
  check('QU-4 (6) một dòng ngoài chi nhánh được quyền → 403 cả lô; 0 dòng / 31 dòng → 400', () => {
    const truoc = soLop();
    const rows: any[] = nhieuDong(['9761']); rows.push({ branchId: CP, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9762' });
    assert(maLoi(() => intake.taoLopHangLoat(P.mbManager, { rows })) === 403 && soLop() === truoc, '403 cả lô');
    assert(maLoi(() => intake.taoLopHangLoat(P.mbManager, { rows: [] })) === 400, '0 dòng');
    assert(maLoi(() => intake.taoLopHangLoat(P.mbManager, { rows: nhieuDong(Array.from({ length: 31 }, (_, i) => String(9800 + i))) })) === 400, '31 dòng');
    /* G6: trộn hai chi nhánh được nếu có quyền ở cả hai. */
    const tron = intake.taoLopHangLoat(P.admin, { rows: [...nhieuDong(['9763']), { branchId: CP, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9763' }] });
    assert(tron.ok && tron.lop.map((l: any) => l.code).join() === 'MB FT 9763,CP FT 9763', JSON.stringify(tron));
  });
  check('QU-4 (7) dryRun không ghi gì, trả mã xem trước', () => {
    const truoc = soLop();
    const r = intake.taoLopHangLoat(P.mbManager, { rows: nhieuDong(['9771', '12A3']), dryRun: true, idempotencyKey: 'qu4-dry' });
    assert(!r.ok && r.dryRun && r.xemTruoc[0].code === 'MB FT 9771' && r.xemTruoc[1].code === null && r.loi[0].dong === 2 && soLop() === truoc, JSON.stringify(r));
    const r2 = intake.taoLopHangLoat(P.mbManager, { rows: nhieuDong(['9771']), idempotencyKey: 'qu4-dry' });
    assert(r2.ok, 'dryRun không được giữ khoá');
  });
  check('QU-4 (8) goiYSoTiep / themDongGiong / gopLoiTheoDong', () => {
    assert(d.goiYSoTiep(['MB FT LT1 03'], ['04'], 'MB FT LT1') === '05', d.goiYSoTiep(['MB FT LT1 03'], ['04'], 'MB FT LT1'));
    assert(d.goiYSoTiep(['MB FT 101', 'MB FT RF 900', 'MB FT 99A'], [], 'MB FT') === '102', 'không lẫn FT RF');
    assert(d.goiYSoTiep([], [], 'MB BE') === '01', 'rỗng');
    const g = d.themDongGiong({ so: '07', branchId: 1, chuongTrinh: 'FT', loTrinh: 'RF', tuan: 3, gv: { gvcn: 5 } }, 3);
    assert(g.map((x: any) => x.so).join() === '08,09,10' && g.every((x: any) => x.branchId === 1 && x.loTrinh === 'RF' && x.tuan === 3 && x.gv.gvcn === 5), JSON.stringify(g));
    const gl = d.gopLoiTheoDong([{ dong: 2, truong: 'so', loi: 'a' }, { dong: 2, truong: 'so', loi: 'b' }, { dong: 3, loi: 'c' }]);
    assert(gl[2].so === 'a' && gl[3].chung === 'c' && !gl[1], JSON.stringify(gl));
  });
  check('QU-4 (10) lỗi giữa giao dịch (sau dòng 1) → không còn lớp nào', () => {
    const truoc = soLop();
    assertThrows(() => intake.taoLopHangLoat(P.mbManager, { rows: nhieuDong(['9781', '9782']) }, (i: number) => { if (i === 0) throw new Error('mất mạng giả'); }),
      /mất mạng giả/, 'không ném');
    assert(soLop() === truoc && !get(`SELECT 1 FROM classes WHERE code = 'MB FT 9781'`), 'lớp dòng 1 còn sót');
  });

  // ================================================================== QU-6
  check('QU-6 cấp riêng: admin.config / quyền lạ / assign_subject → 400; ghi chú > 200 → 400; audit có trước/sau/thêm/bớt', () => {
    for (const k of ['admin.config', 'khong.co', 'class.assign_subject']) {
      assert(maLoi(() => accounts.setUserPermissions(P.admin, gvLe, [{ permission: k, branchCode: null }])) === 400, k);
    }
    assert(maLoi(() => accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'class.create', branchCode: 'XX' }])) === 400, 'chi nhánh lạ');
    assert(maLoi(() => accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'class.create', branchCode: 'MB', note: 'x'.repeat(201) }])) === 400, '200 ký tự');
    assert(maLoi(() => accounts.setUserPermissions(P.mbManager, gvLe, [])) === 403, 'không phải Quản trị');
    accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'attempt.view', branchCode: 'MB' }], 'a');
    accounts.setUserPermissions(P.admin, gvLe, [{ permission: 'class.create', branchCode: 'MB' }], 'Mở lớp hè');
    const a = JSON.parse(get(`SELECT after_json FROM audit_logs WHERE action = 'user_permissions_set' AND entity_id = ? ORDER BY id DESC LIMIT 1`, gvLe).after_json);
    assert(a.them.join() === 'class.create@MB' && a.bot.join() === 'attempt.view@MB' && a.lyDo === 'Mở lớp hè' && a.sau.length === 1, JSON.stringify(a));
    accounts.setUserPermissions(P.admin, gvLe, [], 'Dọn');
  });
  check('QU-6 vai: gỡ admin.config khỏi system_admin → 400; bật plan.week cho teacher → 400 (SCH-01), DB không đổi; impact đếm đúng; matrix 403 với QL', () => {
    assert(maLoi(() => sysconfig.setRolePermission(P.admin, { roleKey: 'system_admin', permissionKey: 'admin.config', granted: false })) === 400, 'lockout');
    const coPw = () => !!get(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
      WHERE r.key = 'teacher' AND p.key = 'plan.week'`);
    assertThrows(() => sysconfig.setRolePermission(P.admin, { roleKey: 'teacher', permissionKey: 'plan.week', granted: true }), /SCH-01/, 'SCH-01');
    assert(maLoi(() => sysconfig.setRolePermissions(P.admin, [{ roleKey: 'teacher', permissionKey: 'plan.week', granted: true }])) === 400 && !coPw(), 'lô');
    assert(maLoi(() => sysconfig.setRolePermission(P.admin, { roleKey: 'manager', permissionKey: 'class.assign_subject', granted: true })) === 400, 'suy ra');
    const nGv = get(`SELECT COUNT(DISTINCT ur.user_id) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'teacher' AND ur.status = 'active' AND u.status = 'active'`).n;
    const im = sysconfig.anhHuongOVai(P.admin, 'teacher', 'plan.week');
    assert(im.soNguoiAnhHuong === nGv && im.dangCo === false && /SCH-01/.test(im.khoa), JSON.stringify(im));
    assert(/Quản trị/.test(sysconfig.anhHuongOVai(P.admin, 'system_admin', 'admin.config').khoa), 'khoá lockout');
    assert(maLoi(() => sysconfig.maTranQuyen(P.mbManager)) === 403 && maLoi(() => sysconfig.anhHuongOVai(P.mbManager, 'teacher', 'plan.week')) === 403, '403');
    const m = sysconfig.maTranQuyen(P.admin);
    assert(m.co.manager.includes('class.create') && m.suyRaGv.some((x: any) => x.quyen === 'class.assign_subject')
      && m.khoa.some((k: any) => k.vai === 'teacher' && k.quyen === 'plan.week'), 'matrix');
    /* Audit ô vai có số người ảnh hưởng. */
    sysconfig.setRolePermission(P.admin, { roleKey: 'teacher', permissionKey: 'discipline.stats', granted: true });
    sysconfig.setRolePermission(P.admin, { roleKey: 'teacher', permissionKey: 'discipline.stats', granted: false });
    const au = JSON.parse(get(`SELECT after_json FROM audit_logs WHERE action LIKE 'role.permission.%' ORDER BY id DESC LIMIT 1`).after_json);
    assert(au.soNguoiAnhHuong === nGv && au.trangThai === 'không', JSON.stringify(au));
  });

  // ================================================================== QU-8
  /* Em ở lớp thử C: GVCN gvMb[0] (dạy W1), L = gvMb[1], R = gvMb[3] (đổi ở QU-3). */
  const NOW = new Date().toISOString();
  const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
    .run('PISA-QU8', 'Học viên QU8', 'hoc vien qu8', MB, NOW).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, lopC, NOW);
  conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, NOW);
  const ctx = (topic: string | null) => ({ class_id: lopC, student_id: sid, topic });
  check('QU-8 quyền đóng: GVBM L đóng Case L, không Case R; GVCN không dạy S không đóng Case S (C02), đóng Case W1 + Ý thức; GV lớp khác không; QL được', () => {
    const gvL = loadPrincipal(gvMb[1]);
    assert(cases.canCloseCase(gvL, ctx('listening')) === true, 'GVBM L → Case L');
    assert(cases.canCloseCase(gvL, ctx('reading')) === false, 'GVBM L → Case R');
    assert(cases.canCloseCase(gvL, ctx(null)) === false, 'GVBM → Case Ý thức');
    assert(cases.canCloseCase(gvcn(), ctx('speaking')) === false, 'C02');
    assert(cases.canCloseCase(gvcn(), ctx('writing1')) === true && cases.canCloseCase(gvcn(), ctx(null)) === true, 'GVCN W1 / Ý thức');
    assert(cases.canCloseCase(loadPrincipal(gvMb[2]), ctx('reading')) === false, 'GV đã thôi R / lớp khác');
    assert(cases.canCloseCase(P.mbManager, ctx('speaking')) === true && cases.canCloseCase(P.cpManager, ctx('speaking')) === false, 'QL');
  });
  check('QU-8 GVBM L hoàn thành Case L → được, audit via:gv, QL MB nhận thông báo; GVBM L đóng Case R → 403', () => {
    const gvL = loadPrincipal(gvMb[1]);
    const mk = (topic: string) => cases.reportIssue(P.mbManager, { studentId: sid, topic, title: `Case ${topic} (QU-8)`,
      summary: 'Case dựng riêng cho phép kiểm GV đóng Case.', primaryCode: d.issuesForTopic(topic)[0].code, parallel: true }) as any;
    const li = mk('listening'); const re = mk('reading');
    cases.recordIntervention(gvL, li.id, { kind: 'teaching_adjust', description: 'Chữa kỹ phần nghe số', performerName: 'GV L',
      status: 'completed', completedDate: t.TODAY });
    assert(maLoi(() => cases.closeCaseOutcome(gvL, re.id, { outcome: 'improved', note: 'Thử đóng trái môn.' })) === 403, 'trái môn');
    const chan = cases.closeBlockers(li.id);
    assert(chan.length === 0, `Case L còn chặn: ${chan.join(' · ')}`);
    cases.closeCaseOutcome(gvL, li.id, { outcome: 'improved', note: 'Em nghe tốt hơn rõ.' });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', li.id).status === 'done', 'chưa đóng');
    const a = JSON.parse(get(`SELECT after_json FROM audit_logs WHERE action = 'case.outcome' AND entity_id = ? ORDER BY id DESC LIMIT 1`, li.id).after_json);
    assert(a.via === 'gv', JSON.stringify(a));
    const tb = get(`SELECT title FROM notifications WHERE user_id = ? AND kind = 'case_dong_gv' AND entity_id = ?`, P.mbManager.userId, li.id);
    assert(tb && /đã đóng Case .* của Học viên QU8/.test(tb.title), JSON.stringify(tb));
    /* QL tự đóng: via quan_ly, không báo. */
    cases.recordIntervention(P.mbManager, re.id, { kind: 'teaching_adjust', description: 'Chữa phần đọc', performerName: 'QL',
      status: 'completed', completedDate: t.TODAY });
    cases.closeCaseOutcome(P.mbManager, re.id, { outcome: 'improved', note: 'Đã ổn phần đọc.' });
    assert(JSON.parse(get(`SELECT after_json FROM audit_logs WHERE action = 'case.outcome' AND entity_id = ? ORDER BY id DESC LIMIT 1`, re.id).after_json).via === 'quan_ly', 'via QL');
    assert(!get(`SELECT 1 FROM notifications WHERE kind = 'case_dong_gv' AND entity_id = ?`, re.id), 'QL tự đóng mà vẫn báo');
  });
}
