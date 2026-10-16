/** PHÉP KIỂM PR-OV2c — email học viên KHÔNG bắt buộc ở mọi chỗ nhập / sửa (chủ SP 13/10); có gõ thì vẫn kiểm dạng; ngày sinh vẫn bắt buộc. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv2cTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const intake: any = await import('../classes/intake.ts');
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  /* OV-10c thay `hvCuaToi` bằng `soHocVien` (ô Thiếu thông tin = cờ `thieu_tt` của Học viên & Lớp) — gộp main 13/10. */
  const { soHocVien, chipHocVien } = await import('../worklist/hvCuaToi.ts');
  console.log('\nPR-OV2c · email không bắt buộc (Thêm HV, dán Excel, Sửa thông tin, Sửa cả lớp, Thiếu thông tin)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  const lop = all(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.is_fast_track = 1 AND c.status = 'active'
      AND EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') ORDER BY c.id LIMIT 1`)[0]?.id as number;
  const dsEm = all(`SELECT e.student_id id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' ORDER BY e.student_id LIMIT 2`, lop);
  const ql = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'manager' AND b.code = 'CP' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`)?.id;
  const QL = () => loadPrincipal(ql);
  const hs = (id: number) => one('SELECT * FROM students WHERE id = ?', id);
  const DOB = '2010-03-12';
  const loiO = (issues: any[], row: number, field: string) => issues.find((i) => i.row === row && i.field === field && i.muc === 'loi');

  check('OV2c-0 · dữ liệu thử đủ (lớp FT CP, 2 em, QL)', () => { assert(lop && dsEm.length === 2 && ql, `lop ${lop} em ${dsEm.length} ql ${ql}`); });

  check('OV2c-1 · Thêm HV: OV-13f (Q8) cột Email có dấu * (trống vẫn lưu — việc Thiếu email); OV-11g (Q3): Ngày sinh không *', () => {
    for (const ft of [false, true]) {
      const cot = dm.cotLuoiNhap(ft);
      assert(cot.find((x: any) => x.key === 'email')?.batBuoc, `Email thiếu dấu * (ft=${ft})`);
      assert(!cot.find((x: any) => x.key === 'dob')?.batBuoc, `Ngày sinh còn bắt buộc (ft=${ft})`);
    }
  });

  check('OV2c-2 · Thêm HV (lưới + dán Excel): không email → xem trước không lỗi, lưu email NULL; email sai dạng vẫn lỗi đúng ô; thiếu ngày sinh không lỗi (OV-11g Q3)', () => {
    thu(() => {
      const v = QL();
      const r = intake.previewIntake(v, { classId: lop, rows: [
        { fullName: 'OV2c Không Email', dob: DOB }, { fullName: 'OV2c Email Sai', dob: DOB, email: 'abc' }, { fullName: 'OV2c Thiếu NS', email: emailThu() },
      ] });
      assert(!r.issues.some((i: any) => i.row === 1 && i.muc === 'loi'), `dòng không email bị chặn: ${JSON.stringify(r.issues)}`);
      assert(loiO(r.issues, 2, 'email') && !loiO(r.issues, 3, 'dob'), `lỗi ô: ${JSON.stringify(r.issues)}`);
      intake.commitIntake(v, { classId: lop, rows: [{ fullName: 'OV2c Không Email', dob: DOB }] });
      const s = one(`SELECT email FROM students WHERE full_name = 'OV2c Không Email'`);
      assert(s && s.email === null, `chưa lưu / email khác NULL: ${JSON.stringify(s)}`);
      const dan = intake.parsePaste('Họ và tên\tNgày sinh\nOV2c Dán Thiếu Cột\t12/03/2010\nOV2c Dán Ô Trống\t13/03/2010', { classId: lop });
      const rd = intake.previewIntake(v, { classId: lop, rows: dan.rows });
      assert(!rd.issues.some((i: any) => i.muc === 'loi'), `dán Excel thiếu cột Email bị chặn: ${JSON.stringify(rd.issues)}`);
      const dan2 = intake.parsePaste('Họ và tên\tNgày sinh\tEmail\nOV2c Dán Ô Trống\t13/03/2010\t', { classId: lop });
      assert(!intake.previewIntake(v, { classId: lop, rows: dan2.rows }).issues.some((i: any) => i.muc === 'loi'), 'ô email trống khi dán bị chặn');
    });
  });

  check('OV2c-3 · Sửa thông tin một em: email trống → lưu; xoá email cũ → NULL; sai dạng → 400, không ghi; ngày sinh trống vẫn 400', () => {
    thu(() => {
      const v = QL(); const id = dsEm[0].id;
      run('UPDATE students SET dob = ?, email = ? WHERE id = ?', DOB, 'cu@gmail.com', id);
      students.updateStudent(v, id, { email: '' });
      assert(hs(id).email === null, `xoá email: ${hs(id).email}`);
      students.updateStudent(v, id, { fullName: hs(id).full_name + ' ', email: '   ' });
      assert(hs(id).email === null, 'email toàn khoảng trắng');
      students.updateStudent(v, id, { email: ' Moi@Gmail.com ' });
      assert(hs(id).email === 'moi@gmail.com', hs(id).email);
      assert(loi(() => students.updateStudent(v, id, { email: 'abc' }))?.status === 400, 'email sai dạng phải 400');
      assert(hs(id).email === 'moi@gmail.com', 'ghi dù lỗi');
      assert(loi(() => students.updateStudent(v, id, { dob: '31/02/2010' }))?.status === 400, 'ngày sinh sai dạng phải 400');   // OV-11d: trống thì được, sai dạng vẫn 400
      assert(hs(id).dob === DOB, 'ngày sinh bị ghi dù lỗi');
    });
  });

  check('OV2c-4 · Sửa cả lớp: dòng có sửa mà em chưa có email → không lỗi; xoá email → NULL; email sai dạng → lỗi đúng ô; em thiếu ngày sinh không lỗi (OV-11g Q3)', () => {
    thu(() => {
      const v = QL(); const [a, b] = [dsEm[0].id, dsEm[1].id];
      run('UPDATE students SET email = NULL, dob = ? WHERE id = ?', DOB, a);
      run('UPDATE students SET email = ?, dob = NULL WHERE id = ?', 'b@gmail.com', b);
      const ok = suaCaLop.xemTruocSuaCaLop(v, lop, { rows: [{ studentId: a, fullName: hs(a).full_name + ' X' }] });
      assert(!ok.rows[0].issues.length, `em chưa có email bị chặn: ${JSON.stringify(ok.rows[0].issues)}`);
      const sai = suaCaLop.xemTruocSuaCaLop(v, lop, { rows: [{ studentId: a, email: 'abc' }] });
      assert(sai.rows[0].issues.some((i: any) => i.field === 'email'), `email sai dạng không báo: ${JSON.stringify(sai.rows[0].issues)}`);
      const thieuNs = suaCaLop.xemTruocSuaCaLop(v, lop, { rows: [{ studentId: b, fullName: hs(b).full_name + ' X' }] });
      assert(!thieuNs.rows[0].issues.length, `OV-11g Q3: ngày sinh, email không bắt buộc: ${JSON.stringify(thieuNs.rows[0].issues)}`);
      suaCaLop.luuSuaCaLop(v, lop, { rows: [{ studentId: a, fullName: hs(a).full_name + ' X' }] });
      assert(hs(a).full_name.endsWith(' X'), 'không lưu được dòng thiếu email');
      run('UPDATE students SET email = ? WHERE id = ?', 'a@gmail.com', a);
      suaCaLop.luuSuaCaLop(v, lop, { rows: [{ studentId: a, email: '' }] });
      assert(hs(a).email === null, `xoá email ở Sửa cả lớp: ${hs(a).email}`);
    });
  });

  /* OV-10c (gộp 13/10): ô "Thiếu thông tin" của Tổng quan TVV = cờ `thieu_tt` của Học viên & Lớp (`missingForStudent`).
     OV-11g (Q3 chủ SP 14/10): thay ý OV-2c — em thiếu email (hoặc ngày sinh) VÀO "Thiếu thông tin", TVV cập nhật (việc không hạn). */
  check('OV2c-5 · OV-11g (Q3): "Thiếu thông tin" ở Tổng quan TVV đếm em thiếu email', () => {
    thu(() => {
      const tk = accounts.createAccount(P.admin, { email: `ov2c${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov2c', fullName: 'Thử OV2c', roles: [{ role: 'consultant', branches: ['CP'] }] }).userId as number;
      const id = dsEm[0].id;
      run('UPDATE students SET consultant_user_id = ?, dob = ?, email = ? WHERE id = ?', tk, DOB, 'co.email@gmail.com', id);
      const coEmail = soHocVien(loadPrincipal(tk));
      assert(coEmail.tong >= 1, 'TVV không thấy em');
      run('UPDATE students SET email = NULL WHERE id = ?', id);
      xoaNho();
      const khongEmail = soHocVien(loadPrincipal(tk));
      assert(chipHocVien(loadPrincipal(tk)).ids.thieu_tt.includes(id) && khongEmail.dem.thieu_tt >= coEmail.dem.thieu_tt,
        `em thiếu email không vào ô: có email ${coEmail.dem.thieu_tt}, thiếu email ${khongEmail.dem.thieu_tt}`);
    });
  });
}
