/** PHÉP KIỂM PR-OV2b — hồ sơ HV: Sửa thông tin (TVV = người, ngày sinh bắt buộc; email đã hết bắt buộc ở PR-OV2c, Target, điểm đầu vào), ⋯ Tạm dừng / Thôi học. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv2bTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const intake: any = await import('../classes/intake.ts');
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const classes: any = await import('../classes/classes.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const profile: any = await import('../students/profile.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { soHocVien } = await import('../worklist/hvCuaToi.ts');
  console.log('\nPR-OV2b · hồ sơ HV: Sửa thông tin, TVV, email + ngày sinh, Target, điểm đầu vào, Tạm dừng / Thôi học');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov2b.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov2b', fullName: `Thử OV2b ${seq}`, roles }).userId as number;
  };
  const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
  const idTvvHl = tao([{ role: 'consultant', branches: ['MB'] }]);
  const idAdmin = tao([{ role: 'office_admin', branches: ['CP'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);

  /* Lớp FT Cẩm Phả có GVCN + GVBM thuần + em đang học có lộ trình chưa MT0. */
  const lop = all(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.is_fast_track = 1 AND c.status = 'active'
      AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active')
      AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 0 AND ta.skill IS NOT NULL AND ta.status = 'active'
                   AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = c.id AND is_core = 1))
      ORDER BY c.id LIMIT 1`)[0]?.id as number;
  const gvcn = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, lop)?.id;
  const gvbm = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 0 AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1)`, lop, lop)?.id;
  const em = one(`SELECT e.student_id id, cy.id cycleId FROM enrollments e JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active'
      WHERE e.class_id = ? AND e.status = 'active' AND NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.kind = 'mt0')
      ORDER BY e.student_id LIMIT 1`, lop);
  const ql = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'manager' AND b.code = 'CP' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`)?.id;
  const V = () => ({
    QL: loadPrincipal(ql), GVCN: loadPrincipal(gvcn), GVBM: loadPrincipal(gvbm), TVV: loadPrincipal(idTvv),
    Admin: loadPrincipal(idAdmin), CX: loadPrincipal(idCx),
  });
  const hs = () => one('SELECT * FROM students WHERE id = ?', em.id);
  const DU = { dob: '2010-03-12', email: 'em.ov2b@gmail.com' };

  check('OV2b-0 · dữ liệu thử đủ (lớp FT CP, GVCN, GVBM, em chưa MT0, QL)', () => {
    assert(lop && gvcn && gvbm && em?.id && ql, `lop ${lop} gvcn ${gvcn} gvbm ${gvbm} em ${JSON.stringify(em)} ql ${ql}`);
  });

  check('OV2b-1 · TVV: gán người vai TVV → lưu, chữ cũ giữ; không phải TVV / tài khoản đã xoá → 400; null bỏ chọn; Tổng quan TVV thấy em', () => {
    thu(() => {
      const v = V();
      run(`UPDATE students SET consultant_name = 'Hương TVV', consultant_user_id = NULL WHERE id = ?`, em.id);
      const truoc = soHocVien(v.TVV).tong;
      students.updateStudent(v.QL, em.id, { consultantUserId: idTvv });
      assert(hs().consultant_user_id === idTvv && hs().consultant_name === 'Hương TVV', `gán: ${hs().consultant_user_id} · ${hs().consultant_name}`);
      assert(soHocVien(loadPrincipal(idTvv)).tong === truoc + 1, 'Tổng quan TVV không thấy em vừa gán');
      assert(loi(() => students.updateStudent(v.QL, em.id, { consultantUserId: gvcn }))?.status === 400, 'gán GV làm TVV phải 400');
      assert(loi(() => students.updateStudent(v.QL, em.id, { consultantUserId: 'abc' }))?.status === 400, 'mã sai kiểu phải 400');
      run(`UPDATE users SET status = 'deleted' WHERE id = ?`, idTvvHl);
      assert(loi(() => students.updateStudent(v.QL, em.id, { consultantUserId: idTvvHl }))?.status === 400, 'TVV đã xoá phải 400');
      students.updateStudent(v.QL, em.id, { consultantUserId: null });
      assert(hs().consultant_user_id === null && hs().consultant_name === 'Hương TVV', 'null phải bỏ chọn, giữ chữ cũ');
    });
  });

  check('OV2b-2 · Admin / TVV / CX sửa được TVV; GVBM → 403; ô chọn chỉ có TVV đang hoạt động, cùng chi nhánh (OV-8b)', () => {
    thu(() => {
      const v = V();
      for (const k of ['Admin', 'TVV', 'CX'] as const) {
        students.updateStudent(v[k], em.id, { consultantUserId: idTvv });
        assert(hs().consultant_user_id === idTvv, `${k} không sửa được TVV`);
        run('UPDATE students SET consultant_user_id = NULL WHERE id = ?', em.id);
      }
      assert(loi(() => students.updateStudent(v.GVBM, em.id, { consultantUserId: idTvv }))?.status === 403, 'GVBM phải 403');
      const ds = students.dsTvv(em.id) as { id: number; ten: string; phu: string }[];
      /* OV-8b (chủ SP 13/10, thay "cùng chi nhánh lên trước"): TVV chi nhánh khác không còn trong ô. */
      const iCp = ds.findIndex((x) => x.id === idTvv); const iHl = ds.findIndex((x) => x.id === idTvvHl);
      assert(iCp >= 0 && iHl < 0, `chỉ TVV CP, không TVV MB: ${JSON.stringify(ds)}`);
      assert(!ds.some((x) => x.id === gvcn || x.id === idAdmin), 'ô TVV lọt người không phải TVV');
      assert(/Cẩm Phả/.test(ds[iCp].phu), `dòng phụ chi nhánh: ${ds[iCp].phu}`);
      students.updateStudent(v.QL, em.id, { consultantUserId: idTvv });
      const hsTvv = profile.studentProfile(v.TVV, em.id);
      assert(hsTvv.viewer.coTheSuaThongTin && !hsTvv.viewer.canEdit && hsTvv.tvv?.id === idTvv && hsTvv.tvvChon?.some((x: any) => x.id === idTvv),
        `hồ sơ (TVV): ${JSON.stringify({ v: hsTvv.viewer.coTheSuaThongTin, tvv: hsTvv.tvv })}`);
      assert(profile.studentProfile(v.GVBM, em.id).tvvChon === null && !profile.studentProfile(v.GVBM, em.id).viewer.coTheSuaThongTin, 'GVBM có ô chọn TVV');
      run(`UPDATE users SET status = 'deleted' WHERE id = ?`, idTvvHl);
      assert(!students.dsTvv(em.id).some((x: any) => x.id === idTvvHl), 'tài khoản đã xoá vẫn trong ô chọn');
    });
  });

  check('OV2b-3 · Thêm học viên (một em / cả lớp / dán Excel) thiếu ngày sinh → OV-11g (Q3): không lỗi, lưu được; ngày sinh sai dạng vẫn lỗi đúng ô', () => {
    thu(() => {
      const v = V();
      const r = intake.previewIntake(v.QL, { classId: lop, rows: [
        { fullName: 'OV2b Đủ', ...DU }, { fullName: 'OV2b Thiếu NS', email: 'thieu.ns.ov2b@gmail.com' }, { fullName: 'OV2b Thiếu Email', dob: DU.dob },
      ] });
      const o = (row: number, field: string) => r.issues.some((i: any) => i.row === row && i.field === field && i.muc === 'loi');
      assert(!r.issues.some((i: any) => i.row === 1 && i.muc === 'loi'), `dòng đủ bị chặn: ${JSON.stringify(r.issues.filter((i: any) => i.row === 1))}`);
      assert(!o(2, 'dob') && !r.issues.some((i: any) => (i.row === 2 || i.row === 3) && i.muc === 'loi'), `lỗi ô: ${JSON.stringify(r.issues)}`);   // OV-11g Q3
      const c = intake.commitIntake(v.QL, { classId: lop, rows: [{ fullName: 'OV2b Đủ', ...DU }, { fullName: 'OV2b Thiếu NS', email: 'thieu.ns.ov2b@gmail.com' }, { fullName: 'OV2b Sai NS', dob: '31/02/2010' }] });
      assert(one(`SELECT 1 FROM students WHERE full_name = 'OV2b Thiếu NS'`) && one(`SELECT 1 FROM students WHERE full_name = 'OV2b Đủ'`)
        && !one(`SELECT 1 FROM students WHERE full_name = 'OV2b Sai NS'`), `commit: ${JSON.stringify(c.failed)}`);
      const dan = intake.parsePaste('Họ và tên\tNgày sinh\tEmail\nOV2b Dán\t\tdan@gmail.com', { classId: lop });
      const rd = intake.previewIntake(v.QL, { classId: lop, rows: dan.rows });
      assert(!rd.issues.some((i: any) => i.field === 'dob' && i.muc === 'loi'), `dán Excel thiếu ngày sinh bị chặn: ${JSON.stringify(rd.issues)}`);
      assert(!dm.cotLuoiNhap(false).find((x: any) => x.key === 'dob')?.batBuoc && !dm.cotLuoiNhap(true).find((x: any) => x.key === 'dob')?.batBuoc, 'cột Ngày sinh không còn *');
    });
  });

  check('OV2b-4 · Sửa một em: xoá trống ngày sinh → lưu NULL (OV-11d Q3; email trống: PR-OV2c lưu được); em thiếu email vẫn nhập điểm được', () => {
    thu(() => {
      const v = V();
      run('UPDATE students SET dob = ?, email = ? WHERE id = ?', DU.dob, DU.email, em.id);
      /* OV-11d (Q3 chủ SP 14/10): ngày sinh không bắt buộc khi sửa — xoá trống lưu NULL (em vào "Thiếu thông tin"). */
      students.updateStudent(v.QL, em.id, { dob: null });
      assert(hs().dob === null, 'xoá trống ngày sinh phải lưu NULL');
      run('UPDATE students SET dob = ? WHERE id = ?', DU.dob, em.id);
      run('UPDATE students SET email = NULL WHERE id = ?', em.id);
      const a = one(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.status != 'cancelled' AND a.kind = 'mock' ORDER BY a.attempt_no LIMIT 1`, em.id);
      if (a) {
        attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 30 });
        assert(one(`SELECT 1 FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening' AND raw_score IS NOT NULL`, a.id), 'em thiếu email không nhập được điểm');
      }
    });
  });

  check('OV2b-5 · Sửa cả lớp: dòng không đổi không bị chặn; dòng có đổi mà em thiếu ngày sinh → OV-11g (Q3): không lỗi; có cột TVV', () => {
    thu(() => {
      const v = V();
      run('UPDATE students SET email = NULL, dob = NULL WHERE id = ?', em.id);
      const khac = one(`SELECT e.student_id id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' AND e.student_id != ? ORDER BY e.student_id LIMIT 1`, lop, em.id).id;
      run('UPDATE students SET email = ?, dob = ? WHERE id = ?', DU.email, DU.dob, khac);
      const ok = suaCaLop.xemTruocSuaCaLop(v.QL, lop, { rows: [{ studentId: khac, consultantUserId: idTvv }] });
      assert(ok.rows.every((r: any) => !r.issues.length), `dòng đủ bị chặn: ${JSON.stringify(ok.rows)}`);
      const x = suaCaLop.xemTruocSuaCaLop(v.QL, lop, { rows: [{ studentId: em.id, fullName: hs().full_name + ' X' }] });
      const f = x.rows[0].issues.map((i: any) => i.field);
      assert(!f.includes('email') && !f.includes('dob'), `dòng có đổi mà thiếu: ${JSON.stringify(x.rows)}`);
      suaCaLop.luuSuaCaLop(v.QL, lop, { rows: [{ studentId: khac, consultantUserId: idTvv }] });
      assert(one('SELECT consultant_user_id c FROM students WHERE id = ?', khac).c === idTvv, 'Sửa cả lớp không lưu TVV');
      const d = suaCaLop.duLieuSuaCaLop(v.QL, lop);
      assert(d.rows.find((r: any) => r.studentId === khac)?.consultantUserId === idTvv && Array.isArray(d.tvv) && d.tvv.some((t: any) => t.id === idTvv),
        `panel cả lớp thiếu cột TVV: ${JSON.stringify(d.tvv)}`);
      assert(loi(() => suaCaLop.luuSuaCaLop(v.QL, lop, { rows: [{ studentId: khac, consultantUserId: gvcn }] }))?.status === 400, 'TVV sai vai ở Sửa cả lớp phải 400');
    });
  });

  check('OV2b-6 · Target: QL có lý do → đổi ngay; thiếu lý do → 400; GVCN → Đề xuất sửa, Target chưa đổi; Admin → 403 (TVV sửa được: OV-8b)', () => {
    thu(() => {
      const v = V();
      const c0 = cycles.cycleById(em.cycleId);
      const moi = c0.target_score === 7 ? 6.5 : 7;
      assert(loi(() => cycles.reviseTarget(v.QL, em.cycleId, { newTarget: moi, reason: '' }))?.status === 400, 'thiếu lý do phải 400');
      cycles.reviseTarget(v.QL, em.cycleId, { newTarget: moi, reason: 'Gia đình đổi kế hoạch' });
      assert(cycles.cycleById(em.cycleId).target_score === moi, 'QL đổi Target không ăn');
      const lai = moi === 7 ? 6.5 : 7;
      deXuat.guiDeXuatSua(v.GVCN, em.id, { truong: 'target', moi: lai, lyDo: 'Em tiến bộ nhanh' });
      assert(cycles.cycleById(em.cycleId).target_score === moi, 'GVCN đề xuất mà Target đã đổi');
      assert(one(`SELECT 1 FROM yeu_cau_duyet WHERE hoc_vien_id = ? AND doi_tuong_loai = 'student:target' ORDER BY id DESC LIMIT 1`, em.id), 'không có thẻ Đề xuất sửa');
      /* OV-8b (chủ SP 13/10): TVV sửa Target như QL (prOv8b.tests OV8b-2) — Admin vẫn không. */
      assert(loi(() => cycles.reviseTarget(v.Admin, em.cycleId, { newTarget: lai, reason: 'x' }))?.status === 403, 'Admin đổi Target phải 403');
    });
  });

  check('OV2b-7 · Điểm đầu vào: 4 kỹ năng → Overall tự tính (làm tròn 0.5); chỉ Overall → kỹ năng trống; hiện ở dòng "Đầu vào" FT; TVV sửa được', () => {
    thu(() => {
      const v = V();
      students.updateStudent(v.QL, em.id, { dauVao: { listening: 5, reading: 5.5, writing: 5, speaking: 5.5 } });
      let c = cycles.cycleById(em.cycleId);
      assert(c.baseline_score === 5.5 && c.baseline_reading === 5.5 && c.baseline_source === 'manual' && c.baseline_attempt_id === null, `4 kỹ năng: ${c.baseline_score}`);
      const dong = (classes.classRoster(v.QL, lop) as any[]).find((r) => r.id === em.id);
      assert(dong?.dauVao?.overall === 5.5 && dong.dauVao.listening === 5, `dòng Đầu vào: ${JSON.stringify(dong?.dauVao)}`);
      students.updateStudent(v.TVV, em.id, { dauVao: { overall: 4.5 } });
      c = cycles.cycleById(em.cycleId);
      assert(c.baseline_score === 4.5 && c.baseline_listening === null && c.baseline_speaking === null, `chỉ Overall: ${JSON.stringify(c)}`);
      assert(loi(() => students.updateStudent(v.QL, em.id, { dauVao: { listening: 5 } }))?.status === 400, 'thiếu kỹ năng mà không có Overall phải 400');
      assert(loi(() => students.updateStudent(v.QL, em.id, { dauVao: { overall: 9.5 } }))?.status === 400, 'Overall ngoài 0–9 phải 400');
      assert(loi(() => students.updateStudent(v.QL, em.id, { dauVao: { overall: 5.3 } }))?.status === 400, 'Overall không bước 0.5 phải 400');
      students.updateStudent(v.QL, em.id, { dauVao: null });
      assert(cycles.cycleById(em.cycleId).baseline_score === null, 'null phải xoá điểm đầu vào');
      assert(loi(() => students.updateStudent(v.GVBM, em.id, { dauVao: { overall: 5 } }))?.status === 403, 'GVBM sửa điểm đầu vào phải 403');
    });
  });

  check('OV2b-8 · ⋯ hồ sơ HV: Sửa thông tin · Chuyển lớp · Tạm dừng / Thôi học · Lưu trữ đầu, một mục Tạm dừng / Thôi học; Admin/TVV có Sửa thông tin', () => {
    const q = { ghiLoTrinhTiep: true, chuyenLop: true, tamDung: true, quayLai: true, ketThuc: true, luuTru: false, boLuuTru: false, hocLai: false };
    const ds = dm.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: q }, cycle: { ratio: false }, status: 'active' });
    const k = ds.map((x: any) => x.key);
    assert(k.slice(0, 3).join() === 'info,chuyen-lop,tam-dung-thoi-hoc', `thứ tự: ${k.join()}`);
    assert(!k.includes('tam-dung') && !k.includes('ket-thuc'), 'còn hai mục Tạm dừng / Kết thúc riêng');
    assert(ds[0].nhan === 'Sửa thông tin' && ds[2].nhan === 'Tạm dừng / Thôi học', `nhãn: ${ds.map((x: any) => x.nhan).join()}`);
    const xong = dm.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: { ...q, luuTru: true, tamDung: false, ketThuc: false } }, cycle: null, status: 'finished' }).map((x: any) => x.key);
    assert(xong.slice(0, 3).join() === 'info,chuyen-lop,luu-tru' && !xong.includes('tam-dung-thoi-hoc'), `đã thôi học: ${xong.join()}`);
    /* Đang tạm dừng: còn Thôi học → vẫn một mục (panel mở tab Thôi học); Quay lại học xếp sau. */
    const dung = dm.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: q }, cycle: null, status: 'inactive' }).map((x: any) => x.key);
    assert(dung.includes('tam-dung-thoi-hoc') && dung.indexOf('quay-lai') > dung.indexOf('tam-dung-thoi-hoc'), `tạm dừng: ${dung.join()}`);
    assert(dm.mucQuanLyHocVien({ canEdit: false, suaThongTin: true, lopHoc: null, cycle: null, status: 'active' }).map((x: any) => x.key).join() === 'info,lich-su-sua', 'Admin/TVV/CX: chỉ Sửa thông tin + Lịch sử sửa (OV-13j)');
    assert(dm.cacTabTrangThai({ tamDung: true, ketThuc: true }, 'active').join() === 'tam-dung,thoi-hoc', 'đang học: hai tab');
    assert(dm.cacTabTrangThai({ tamDung: true, ketThuc: true }, 'inactive').join() === 'thoi-hoc', 'đang tạm dừng: chỉ tab Thôi học');
  });
}
