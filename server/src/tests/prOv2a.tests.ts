/** PHÉP KIỂM PR-OV2a — vai TVV / CX / Admin: ma trận quyền (đặc tả OV mục 2), máy chủ chặn 403, sửa thông tin giới hạn, đổi góc nhìn, migrate. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv2aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const { can, loadPrincipal, editableSkills } = await import('../permissions.ts');
  const { navOf } = await import('../platform/nav.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { hvCuaToi } = await import('../worklist/hvCuaToi.ts');
  console.log('\nPR-OV2a · vai TVV / CX / Admin, quyền, đổi góc nhìn');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('OV2a-0 · ROLES có ba vai mới, nhãn đúng; branch_admin vẫn chỉ là vai đã bỏ', () => {
    for (const [k, nhan] of [['consultant', 'Tư vấn viên'], ['cx', 'CX'], ['office_admin', 'Admin']]) {
      assert(dm.ROLES.includes(k) && dm.ROLE_LABEL[k] === nhan, `${k}: ${dm.ROLE_LABEL[k]}`);
      assert(one('SELECT status FROM roles WHERE key = ?', k)?.status === 'active', `bảng roles thiếu ${k}`);
    }
    assert(!dm.ROLES.includes('branch_admin'), 'branch_admin không được giao mới');
  });

  // ---------------------------------------------------------------- tài khoản thử (tạo bằng đường Quản trị thật)
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov2a.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov2a', fullName: `Thử OV2a ${seq}`, roles }).userId as number;
  };
  const idAdmin = tao([{ role: 'office_admin', branches: ['CP'] }]);
  const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const idQlGv = tao([{ role: 'manager', branches: ['CP'] }, { role: 'teacher', branches: ['CP'] }]);
  const idGvCx = tao([{ role: 'teacher', branches: ['CP'] }, { role: 'cx', branches: [] }]);

  check('OV2a-1 · CX không chọn chi nhánh = toàn hệ thống; Admin, TVV theo chi nhánh', () => {
    assert(one(`SELECT ur.branch_id FROM user_roles ur WHERE ur.user_id = ?`, idCx)?.branch_id === null, 'CX phải toàn hệ thống');
    assert(one(`SELECT b.code FROM user_roles ur JOIN branches b ON b.id = ur.branch_id WHERE ur.user_id = ?`, idTvv)?.code === 'CP', 'TVV theo CP');
  });

  /* Lớp FT Cẩm Phả có GVCN + GVBM thuần + một em đang học + một lượt chưa huỷ. */
  const lop = all(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.is_fast_track = 1 AND c.status = 'active'
      AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active')
      AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 0 AND ta.skill IS NOT NULL AND ta.status = 'active'
                   AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = c.id AND is_core = 1))
      AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.class_id = c.id AND a.status != 'cancelled')
      ORDER BY c.id LIMIT 1`)[0]?.id as number;
  const gvcn = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, lop)?.id;
  const gvbm = one(`SELECT user_id id, skill FROM teacher_assignments WHERE class_id = ? AND is_core = 0 AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1)`, lop, lop);
  const em = one(`SELECT e.student_id id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' ORDER BY e.student_id LIMIT 1`, lop)?.id;
  const luot = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, lop)?.id;
  const chuKy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, em)?.id;

  const V = () => ({
    QT: P.admin, QL: loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'manager' AND b.code = 'CP' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`).id),
    Admin: loadPrincipal(idAdmin), GVCN: loadPrincipal(gvcn), GVBM: loadPrincipal(gvbm.id), TVV: loadPrincipal(idTvv), CX: loadPrincipal(idCx),
  });

  check('OV2a-2 · ma trận vai × việc (đặc tả OV mục 2) — can() đúng từng ô', () => {
    assert(lop && gvcn && gvbm && em && luot && chuKy, `thiếu dữ liệu CP: lop ${lop} gvcn ${gvcn} gvbm ${gvbm?.id} em ${em} luot ${luot} chuKy ${chuKy}`);
    const v = V();
    const cs = { classId: lop }; const hs = { studentId: em };
    const KY_NANG = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
    /* Mỗi dòng: tên · kiểm · [QT, QL, Admin, GVCN, GVBM, TVV, CX]. */
    const bang: [string, (p: any) => boolean, boolean[]][] = [
      ['Xem HV', (p) => can(p, 'student.view', hs), [true, true, true, true, true, true, true]],
      ['Xem Case · PA (attempt.view + case.view)', (p) => can(p, 'attempt.view', hs) && can(p, 'case.view', hs), [true, true, true, true, true, true, true]],
      ['Tổng quan · Phân tích', (p) => can(p, 'analysis.view', { anyScope: true }), [true, true, true, false, false, true, true]],
      ['Phần GV (Phân tích theo GV, hồ sơ GV)', (p) => can(p, 'analysis.view_teacher', { anyScope: true }), [true, true, true, false, false, false, false]],
      ['Test (3 tab)', (p) => can(p, 'test.view', cs), [true, true, true, true, true, false, false]],
      ['Xếp/dời lịch MT', (p) => can(p, 'plan.week', cs), [true, true, true, false, false, false, false]],
      ['Nhập / sửa điểm (GV: môn mình)', (p) => editableSkills(p, lop, KY_NANG).length > 0, [true, true, true, true, true, false, false]],
      ['Huỷ / khôi phục cả lượt', (p) => can(p, 'attempt.cancel', cs), [true, true, false, false, false, false, false]],
      ['Sửa thông tin HV (giới hạn)', (p) => can(p, 'student.edit_info', hs), [true, true, true, true, false, true, true]],
      ['Sửa hồ sơ đủ (lộ trình tiếp theo, chuyển lớp)', (p) => can(p, 'student.edit', hs), [true, true, false, true, false, false, false]],
      ['Target', (p) => can(p, 'cycle.edit', hs), [true, true, false, false, false, false, false]],
      ['Xử lý Case Ý thức', (p) => can(p, 'sos.edit', { ...hs, skill: null }), [true, true, false, true, false, false, false]],
      ['Công việc', (p) => can(p, 'work.view', { anyScope: true }), [true, true, true, true, true, false, false]],
      ['Quản trị', (p) => can(p, 'admin.config', { anyScope: true }), [true, false, false, false, false, false, false]],
    ];
    const ten = ['QT', 'QL', 'Admin', 'GVCN', 'GVBM', 'TVV', 'CX'] as const;
    const sai: string[] = [];
    for (const [viec, kiem, mong] of bang) {
      ten.forEach((k, i) => { const co = kiem((v as any)[k]); if (co !== mong[i]) sai.push(`${viec} · ${k}: ${co}`); });
    }
    assert(!sai.length, sai.join(' | '));
  });

  check('OV2a-3 · thanh trên theo vai: TVV/CX không Test, Công việc; Admin có Công việc (Việc học viên), không Báo cáo/Vận hành; CX không phần GV', () => {
    const v = V();
    for (const k of ['TVV', 'CX'] as const) {
      const n = navOf((v as any)[k]);
      assert(!n.test && !n.work && n.students && n.analysis, `${k}: ${JSON.stringify(n)}`);
      assert(!(n as any).phanTichGv, `${k} còn Phân tích theo GV`);
    }
    const a = navOf(v.Admin);
    const ql = navOf(v.QL);
    assert(a.test && a.testPlan && a.work && a.workSupport && a.workChamDiem && !ql.workChamDiem && !a.workReports && !a.workOps && !a.workApprove && (a as any).phanTichGv, `Admin: ${JSON.stringify(a)}`);
    assert(ql.test && ql.work && ql.workReports && ql.analysis && (ql as any).phanTichGv, `QL đổi: ${JSON.stringify(ql)}`);
    const gv = navOf(v.GVBM);
    assert(gv.test && gv.work && !gv.analysis, `GV đổi: ${JSON.stringify(gv)}`);
  });

  check('OV2a-4 · Admin: Công việc chỉ nhóm Chấm điểm (kể cả "Tất cả trong phạm vi")', () => {
    const w = mywork.myWork(loadPrincipal(idAdmin), { nguoi: 'tat-ca' });
    assert(w.xemNguoiKhac === true, 'Admin phải xem việc chấm của người khác để Nhắc');
    const ngoai = (w.items ?? []).filter((it: any) => it.group !== 'score');
    assert(!ngoai.length, `Admin thấy việc ngoài Chấm điểm: ${ngoai.map((x: any) => x.group).join(',')}`);
  });

  check('OV2a-5 · TVV/CX/Admin sửa thông tin HV: trường trong danh sách được, ngoài danh sách 403; GVBM 403', () => {
    thu(() => {
      for (const id of [idTvv, idCx, idAdmin]) {
        const p = loadPrincipal(id);
        const ok = students.updateStudent(p, em, { fullName: 'Thử Đổi Tên', email: 'thu.doi@example.com', dob: '2010-01-02' });
        assert(ok.full_name === 'Thử Đổi Tên', `${id}: không lưu được họ tên`);
        const e = loi(() => students.updateStudent(p, em, { note: 'ghi chú' }));
        assert(e?.status === 403, `${id} sửa ghi chú: ${e?.status} ${e?.message}`);
        const e2 = loi(() => cycles.updateCycle(p, chuKy, { targetScore: 7, lyDo: 'thử' }));
        assert(e2?.status === 403, `${id} sửa Target: ${e2?.status} ${e2?.message}`);
        const e3 = loi(() => cycles.updateCycle(p, chuKy, { startWeek: '2026-09-07' }));
        assert(e3?.status === 403, `${id} sửa tuần bắt đầu: ${e3?.status}`);
        const e4 = loi(() => cycles.updateCycle(p, chuKy, { examDate: '2027-03' }));
        assert(!e4, `${id} sửa dự kiến thi: ${e4?.status} ${e4?.message}`);
      }
      const e = loi(() => students.updateStudent(loadPrincipal(gvbm.id), em, { fullName: 'X' }));
      assert(e?.status === 403, `GVBM: ${e?.status}`);
    });
  });

  check('OV2a-6 · Học viên & Lớp: TVV có "HV của tôi" (mặc định khi đã được gán em), chỉ em mình', () => {
    thu(() => {
      const p = loadPrincipal(idTvv);
      const truoc = hvl.danhSachHocVienLop(p, {});
      assert(!truoc.phamVi.coThe.includes('cua-toi') && truoc.phamVi.dangDung === 'chi-nhanh', `chưa gán em: ${JSON.stringify(truoc.phamVi)}`);
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, em);
      xoaNho();
      const sau = hvl.danhSachHocVienLop(p, {});
      assert(sau.phamVi.dangDung === 'cua-toi', `đã gán em: ${JSON.stringify(sau.phamVi)}`);
      assert(sau.hocVien.length >= 1 && sau.hocVien.every((h: any) => h.id === em), `hocVien: ${JSON.stringify(sau.hocVien.map((h: any) => h.id))}`);
      const cn = hvl.danhSachHocVienLop(p, { phamVi: 'chi-nhanh' });
      assert(cn.hocVien.length > sau.hocVien.length, 'Chi nhánh phải nhiều em hơn');
    });
  });

  // ---------------------------------------------------------------- HTTP thật
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
    });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };
  const cn = one(`SELECT id FROM branches WHERE code = 'CP'`).id;

  try {
    await checkAsync('OV2a-7 · gọi thẳng API ngoài quyền → 403 (Admin huỷ/khôi phục, TVV/CX vào Test/Công việc, CX phần GV, TVV Target)', async () => {
      const a = await vao(idAdmin); const tv = await vao(idTvv); const cx = await vao(idCx);
      const mong: [string, string, string, string, unknown?][] = [
        ['Admin huỷ lượt', a, 'POST', `/attempts/${luot}/cancel`, { reason: 'thử' }],
        ['Admin khôi phục lượt', a, 'POST', `/attempts/${luot}/reopen`],
        ['Admin khôi phục kết quả', a, 'POST', `/attempts/${luot}/khoi-phuc-ket-qua`, { lyDo: 'thử' }],
        ['TVV Lịch Test', tv, 'GET', '/cham/lich-test'],
        ['TVV Điểm theo lớp', tv, 'GET', '/diem-theo-lop/lop'],
        ['TVV Kế hoạch Test', tv, 'GET', `/ke-hoach-test/lop?branchId=${cn}`],
        ['TVV Công việc', tv, 'GET', '/my-work'],
        ['TVV Yêu cầu', tv, 'GET', '/yeu-cau'],
        ['TVV sửa Target', tv, 'PATCH', `/cycles/${chuKy}`, { targetScore: 7, lyDo: 'thử' }],
        ['CX Lịch Test', cx, 'GET', '/cham/lich-test'],
        ['CX Công việc', cx, 'GET', '/my-work'],
        ['CX hồ sơ GV', cx, 'GET', `/giao-vien/${gvcn}`],
        ['CX Phân tích theo GV', cx, 'GET', `/phan-tich/giao-vien?cn=${cn}`],
      ];
      const sai: string[] = [];
      for (const [ten, ck, m, url, body] of mong) {
        const r = await goi(m, url, ck, body);
        if (r.status !== 403) sai.push(`${ten}: ${r.status} ${r.json?.error ?? ''}`);
      }
      assert(!sai.length, sai.join(' | '));
      const duoc: [string, string, string][] = [
        ['TVV hồ sơ HV', tv, `/students/${em}`], ['TVV hồ sơ lớp', tv, `/classes/${lop}/overview`], ['TVV hồ sơ lượt', tv, `/attempts/${luot}`],
        ['TVV Ý thức HV', tv, `/students/${em}/y-thuc`], ['TVV Case của HV', tv, `/cases?studentId=${em}`], ['TVV điểm cả lớp', tv, `/classes/${lop}/diem-theo-luot`],
        ['Admin Ý thức HV', a, `/students/${em}/y-thuc`], ['Admin Case', a, `/cases?studentId=${em}`], ['TVV Phân tích', tv, `/phan-tich/tong-hop?branchId=${cn}&ct=ft&soTuan=4`],
        ['CX Phân tích tổng hợp', cx, `/phan-tich/tong-hop?branchId=${cn}&ct=ft&soTuan=4`], ['CX hồ sơ HV', cx, `/students/${em}`],
        ['Admin Lịch Test', a, '/cham/lich-test'], ['Admin Công việc', a, '/my-work?nguoi=tat-ca'],
      ];
      for (const [ten, ck, url] of duoc) {
        const r = await goi('GET', url, ck);
        if (r.status !== 200) sai.push(`${ten}: ${r.status} ${r.json?.error ?? ''}`);
      }
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('OV2a-8 · góc nhìn: QL+GV chọn GV → việc chỉ QL 403, Về vai gốc → lại được; 1 vai / không QL → 403', async () => {
      const ck = await vao(idQlGv);
      let s = (await goi('GET', '/demo/session', ck)).json;
      assert(s.gocNhin?.coThe?.map((x: any) => x.role).sort().join(',') === 'manager,teacher' && s.gocNhin.dangChon === null, `phiên: ${JSON.stringify(s.gocNhin)}`);
      assert((await goi('GET', `/tong-quan/quan-ly?branchId=${cn}`, ck)).status === 200, 'QL phải xem được Tổng quan QL');
      const doi = await goi('PUT', '/session/goc-nhin', ck, { role: 'teacher' });
      assert(doi.status === 200, `đổi: ${doi.status} ${doi.json?.error}`);
      s = (await goi('GET', '/demo/session', ck)).json;
      assert(s.gocNhin.dangChon === 'teacher' && s.roles.join(',') === 'teacher' && !s.nav.testPlan && !s.nav.analysis, `góc GV: ${JSON.stringify({ g: s.gocNhin, r: s.roles, n: s.nav })}`);
      assert(s.gocNhin.vaiGoc === 'manager', `vai gốc: ${s.gocNhin.vaiGoc}`);
      for (const [m, url, body] of [['GET', `/tong-quan/quan-ly?branchId=${cn}`], ['POST', '/classes', { code: 'CP FT 999' }], ['POST', `/attempts/${luot}/cancel`, { reason: 'x' }]] as const) {
        const r = await goi(m, url, ck, body);
        assert(r.status === 403, `góc GV ${m} ${url}: ${r.status} ${r.json?.error}`);
      }
      assert((await goi('PUT', '/session/goc-nhin', ck, { role: 'cx' })).status === 403, 'chọn vai không nắm phải 403');
      assert((await goi('PUT', '/session/goc-nhin', ck, { role: null })).status === 200, 'Về vai gốc');
      assert((await goi('GET', `/tong-quan/quan-ly?branchId=${cn}`, ck)).status === 200, 'về vai gốc phải xem lại được');

      /* Bỏ vai đang chọn → phiên tự về vai gốc. */
      await goi('PUT', '/session/goc-nhin', ck, { role: 'teacher' });
      accounts.setRoles(P.admin, idQlGv, [{ role: 'manager', branches: ['CP'] }, { role: 'cx', branches: [] }]);
      s = (await goi('GET', '/demo/session', ck)).json;
      assert(s.gocNhin.dangChon === null && s.roles.includes('manager'), `bỏ vai GV: ${JSON.stringify({ g: s.gocNhin, r: s.roles })}`);

      const mot = await vao(V().QL.userId);
      const r1 = await goi('PUT', '/session/goc-nhin', mot, { role: 'manager' });
      assert(r1.status === 403, `QL một vai: ${r1.status}`);
      assert((await goi('GET', '/demo/session', mot)).json.gocNhin === null, 'QL một vai không có menu góc nhìn');
      const gvCx = await vao(idGvCx);
      const r2 = await goi('PUT', '/session/goc-nhin', gvCx, { role: 'teacher' });
      assert(r2.status === 403, `GV+CX (không QL): ${r2.status}`);
    });

    await checkAsync('OV2a-9 · Tổng quan TVV: chưa gán em → 0 và danh sách rỗng; gán em → em hiện', async () => {
      const ck = await vao(idTvv);
      const r = await goi('GET', '/tong-quan/hv-cua-toi', ck);
      assert(r.status === 200 && r.json.tong === 0 && r.json.canChuY.length === 0, `trống: ${r.status} ${JSON.stringify(r.json)}`);
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, em);
      const r2 = await goi('GET', '/tong-quan/hv-cua-toi', ck);
      conn.prepare('UPDATE students SET consultant_user_id = NULL WHERE id = ?').run(em);
      assert(r2.status === 200 && r2.json.tong === 1, `gán 1 em: ${JSON.stringify(r2.json)}`);
      for (const k of ['duoiKyVong', 'caseMo', 'sapThi', 'thieuTt']) assert(typeof r2.json[k] === 'number', `thiếu số ${k}`);
    });
  } finally {
    may.close();
  }

  check('OV2a-11 · demo: một tài khoản mỗi vai mới; TVV Cẩm Phả có em và Tổng quan có số', () => {
    for (const k of ['office_admin', 'consultant', 'cx']) {
      const n = one(`SELECT COUNT(*) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.user_id <= ?`, k, t.seedMax.users ?? 1e9).n;
      assert(n >= 1, `demo thiếu ${k}`);
    }
    const tvv = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' ORDER BY ur.user_id LIMIT 1`).id;
    const hv = hvCuaToi(loadPrincipal(tvv));
    assert(hv.tong >= 3 && hv.canChuY.length >= 1, `TVV demo: ${JSON.stringify({ ...hv, canChuY: hv.canChuY.length })}`);
  });

  await checkAsync('OV2a-10 · migrate prOv2: DB cũ chưa có 3 vai → có đủ quyền; chạy lần hai không đổi gì', async () => {
    const { migratePrOv2 } = await import('../migrate/prOv2.ts');
    thu(() => {
      for (const k of ['consultant', 'cx', 'office_admin']) {
        const r = one('SELECT id FROM roles WHERE key = ?', k);
        conn.prepare('DELETE FROM user_roles WHERE role_id = ?').run(r.id);
        conn.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(r.id);
        conn.prepare('DELETE FROM roles WHERE id = ?').run(r.id);
      }
      const lan1: string[] = [];
      migratePrOv2(conn, lan1);
      assert(lan1.length > 0, 'lần 1 phải báo đã thêm');
      for (const k of ['consultant', 'cx', 'office_admin']) {
        const co = all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = ?`, k)
          .map((x) => x.key).sort().join(',');
        assert(co === [...ROLE_PERMISSIONS[k]].sort().join(','), `${k}: ${co}`);
      }
      const lan2: string[] = [];
      migratePrOv2(conn, lan2);
      assert(!lan2.length, `lần 2 vẫn đổi: ${lan2.join(' | ')}`);
      const cot = (b: string) => all(`SELECT name FROM pragma_table_info(?)`, b).map((x) => x.name);
      assert(cot('students').includes('consultant_user_id') && cot('demo_sessions').includes('goc_nhin'), 'thiếu cột');
    });
  });
}
