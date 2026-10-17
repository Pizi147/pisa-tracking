/**
 * PHÉP KIỂM VN-1 (rà OV-13f, 17/10):
 *  1 · Target bước 0,5 ở mọi đường nhập: `docTarget` (một em, Sửa cả lớp, Bước tiếp, học lại) · nhập Excel · lệnh chuyển lớp (cả FT → FT) · chuyển lớp
 *  2 · Xoá một HV: panel trả email (phân biệt em trùng tên)
 *  3 · Sửa cả lớp: hai em đổi email cho nhau trong cùng lô — xem trước không báo trùng, lưu được
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVn1Tests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const students: any = await import('../students/students.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const xoa: any = await import('../students/xoaHocVien.ts');
  const scl: any = await import('../classes/suaCaLop.ts');
  console.log('\nVN-1 · Target bước 0,5 · email ở Xoá HV · đổi email cho nhau');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a)[0] as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const T2 = week.mondayOf(TODAY) as string;
  const start = addDays(T2, -7 * 2);
  const lop = (code: string) => intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  const lopA = lop('MB VN1-A');
  const lopB = lop('MB VN1-B');
  let k = 0;
  const them = (classId: number, rows: any[]) => intake.commitIntake(P.admin, { classId, rows, idempotencyKey: `vn1-${++k}` });
  const loi400 = (fn: () => unknown) => { try { fn(); } catch (e: any) { return e?.status === 400 ? String(e.message) : `status ${e?.status}: ${e?.message}`; } return null; };
  const BUOC = /bước 0,5/;

  const r0 = them(lopA, [
    { fullName: 'Vũ Một', email: 'vn1.mot@pisa.vn', target: 6.5 },
    { fullName: 'Vũ Hai', email: 'vn1.hai@pisa.vn', target: 6.5 },
  ]);
  const [s1, s2] = r0.studentIds as number[];
  const cy1 = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, s1).id as number;

  check('VN-1 1a · docTarget: 6.3 → 400 câu "bước 0,5"; 6.5 · "6.5 KCK" · "KCK" · trống vẫn nhận', () => {
    const m = loi400(() => cycles.docTarget('6.3'));
    assert(m && BUOC.test(m), `6.3: ${m}`);
    assert(loi400(() => cycles.docTarget(9.5)) !== null, '9.5');
    assert(cycles.docTarget(6.5).target === 6.5 && cycles.docTarget('6.5 KCK').kck && cycles.docTarget('KCK').target === null && cycles.docTarget('').target === null, 'giá trị hợp lệ');
  });

  check('VN-1 1b · một em: sửa lộ trình + đổi Target 6.3 → 400, Target giữ', () => {
    const m1 = loi400(() => cycles.updateCycle(P.admin, cy1, { targetScore: 6.3, lyDo: 'thử' }));
    const m2 = loi400(() => cycles.reviseTarget(P.admin, cy1, { newTarget: '6.3', reason: 'thử' }));
    assert(m1 && BUOC.test(m1) && m2 && BUOC.test(m2), `${m1} | ${m2}`);
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', cy1).target_score === 6.5, 'Target bị đổi');
  });

  check('VN-1 1c · Sửa cả lớp: Target 6.3 báo lỗi đúng dòng ở xem trước', () => {
    const xt = scl.xemTruocSuaCaLop(P.admin, lopA, { rows: [{ studentId: s1, target: '6.3' }] });
    const iss = xt.rows.find((x: any) => x.studentId === s1)?.issues ?? [];
    assert(iss.some((i: any) => i.field === 'target' && BUOC.test(i.message)), JSON.stringify(xt.rows));
  });

  check('VN-1 1d · nhập Excel: Target 6.3 không thêm, lỗi ở ô Target', () => {
    const r = them(lopA, [{ fullName: 'Vũ Lẻ', email: 'vn1.le@pisa.vn', target: '6.3' }]);
    assert(r.added === 0 && r.failed.some((f: any) => f.field === 'target' && BUOC.test(f.message)), JSON.stringify(r));
  });

  check('VN-1 1e · lệnh chuyển lớp FT → FT mang Target 6.3 → dòng lỗi, không ghi lệnh', () => {
    const r = lenh.raLenh(P.mbManager, { lopNguonId: lopA, boiCanh: 'giua-khoa', tuanChung: addDays(T2, 7),
      dongs: [{ studentId: s2, huong: 'chuyen_lop', toClassId: lopB, lyDo: 'Đổi giờ', mucTieu: 6.3 }] });
    assert(!r.ok.length && r.failed.some((f: any) => BUOC.test(f.message)), JSON.stringify(r));
  });

  check('VN-1 1f · chuyển lớp (thi hành) + học lại: Target 6.3 → 400', () => {
    const m1 = loi400(() => students.transferStudent(P.admin, s2, lopB, TODAY, 'Đổi giờ', { noNote: true, mucTieu: 6.3 }));
    const s3 = them(lopA, [{ fullName: 'Vũ Ba', email: 'vn1.ba@pisa.vn', target: 6.5 }]).studentIds[0] as number;
    students.setStudentStatus(P.admin, s3, 'finished', TODAY, 'Nghỉ hẳn');
    const m2 = loi400(() => students.hocLai(P.admin, s3, { lyDo: 'Học lại', mucTieu: '6.3' }));
    assert(m1 && BUOC.test(m1) && m2 && BUOC.test(m2), `${m1} | ${m2}`);
  });

  check('VN-1 2 · Xoá một HV: panel có email để phân biệt em trùng tên', () => {
    const d = xoa.xemXoaHocVien(P.admin, s1);
    assert(d.email === 'vn1.mot@pisa.vn' && d.lop === 'MB VN1-A', JSON.stringify(d));
  });

  check('VN-1 3 · Sửa cả lớp: hai em đổi email cho nhau — xem trước không báo trùng, lưu được', () => {
    const rows = [{ studentId: s1, email: 'vn1.hai@pisa.vn' }, { studentId: s2, email: 'VN1.Mot@pisa.vn' }];
    const xt = scl.xemTruocSuaCaLop(P.admin, lopA, { rows });
    assert(xt.rows.every((x: any) => !x.issues.some((i: any) => i.field === 'email')), JSON.stringify(xt.rows));
    scl.luuSuaCaLop(P.admin, lopA, { rows, idempotencyKey: 'vn1-doi' });
    const e = (id: number) => one('SELECT email FROM students WHERE id = ?', id).email;
    assert(e(s1) === 'vn1.hai@pisa.vn' && e(s2) === 'vn1.mot@pisa.vn', `${e(s1)} · ${e(s2)}`);
    /* Trùng thật vẫn chặn: em 2 lấy email em 1 mà em 1 không đổi. */
    const xt2 = scl.xemTruocSuaCaLop(P.admin, lopA, { rows: [{ studentId: s2, email: 'vn1.hai@pisa.vn' }] });
    assert(xt2.rows[0].issues.some((i: any) => i.field === 'email'), JSON.stringify(xt2.rows));
  });
}
