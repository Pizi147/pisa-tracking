/** PHÉP KIỂM PR-NHAP — Thêm học viên (email, ngày thi, cột theo tiêu đề, tuần mặc định), Thông tin HV. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNhapTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-NHAP · Thêm học viên, Thông tin HV');

  check('NHAP (1) · docNgayNhap: dd/mm/yyyy, ISO, tháng, ngày không có thật, cận', () => {
    const h = '2026-09-29';
    const iso = (raw: string, luat?: any) => d.docNgayNhap(raw, h, luat).iso;
    const loi = (raw: string, luat?: any) => d.docNgayNhap(raw, h, luat).loi;
    assert(iso('12/05/2008') === '2008-05-12', String(iso('12/05/2008')));
    assert(iso('5/3/2008') === '2008-03-05', String(iso('5/3/2008')));
    assert(iso('2008-05-12') === '2008-05-12', 'ISO');
    assert(loi('31/02/2010') === 'Ngày không có thật', String(loi('31/02/2010')));
    assert(!!loi('12/05'), 'thiếu năm phải lỗi');
    for (const s of ['-', '']) {
      const r = d.docNgayNhap(s, h);
      assert(r.iso === null && r.loi === null, `ô trống "${s}"`);
    }
    assert(!!loi('01/01/2030', { toiDa: h }), 'sau hôm nay');
    assert(iso('05/2027', { choThang: true }) === '2027-05', 'tháng');
    assert(!!loi('05/2027'), 'tháng khi không choThang');
    assert(!!loi('13/2027', { choThang: true }), 'tháng 13');
    assert(iso('15/01/2027', { choThang: true }) === '2027-01-15', 'ngày khi choThang');
    assert(!!loi('08/2026', { choThang: true, toiThieu: h }), 'tháng đã qua');
  });

  check('NHAP (1) · docEmail: chuẩn hoá chữ thường, bắt dạng sai', () => {
    assert(d.docEmail(' An.Nguyen@Gmail.com ').email === 'an.nguyen@gmail.com', String(d.docEmail(' An.Nguyen@Gmail.com ').email));
    for (const s of ['abc', 'a@b', 'a b@c.vn']) assert(!!d.docEmail(s).loi, `nhận nhầm "${s}"`);
    const r = d.docEmail('-');
    assert(r.email === null && r.loi === null, 'dấu -');
  });

  check('NHAP (1) · nhanDangCot theo tiêu đề (YC-5.2)', () => {
    const r = d.nhanDangCot(['Họ và tên *', 'Ngày sinh', 'E-mail', 'Dự kiến thi', 'Ghi chú', 'STT', 'Lộ trình', 'Họ tên']);
    assert(JSON.stringify(r.cot) === JSON.stringify(['fullName', 'dob', 'email', 'examDate', null, null, 'route', null]), JSON.stringify(r.cot));
    assert(JSON.stringify(r.boQua) === JSON.stringify(['Ghi chú', 'Họ tên']), JSON.stringify(r.boQua));
  });

  check('NHAP (1) · cotLuoiNhap: lớp thường 6 cột (PR-NT 04/10), FT 12 cột (… Dự kiến thi · Đã thi tới MT · Tuần bắt đầu)', () => {
    const thuong = d.cotLuoiNhap(true).map((c) => c.key).join(',');
    assert(thuong === 'fullName,dob,email,target,examDate,startWeek', thuong);
    const ft = d.cotLuoiNhap(false).map((c) => c.key);
    assert(ft.length === 12 && ft[9] === 'examDate' && ft[10] === 'daThiToiMt' && ft[11] === 'startWeek', ft.join(','));
  });

  check('NHAP (1) · tuanBatDauMacDinh: tuần khai giảng (planning chốt 29/09); FT chưa khai giảng → tuần này', () => {
    const h = '2026-09-29';
    const ft = (kg: string | null) => d.tuanBatDauMacDinh({ lopThuong: false, khaiGiang: kg }, h);
    const th = (kg: string | null) => d.tuanBatDauMacDinh({ lopThuong: true, khaiGiang: kg }, h);
    assert(ft('2026-09-21') === '2026-09-21', String(ft('2026-09-21')));
    assert(ft('2026-06-03') === '2026-06-01', 'FT đã học lâu vẫn giữ tuần khai giảng: ' + String(ft('2026-06-03')));
    assert(ft('2026-10-05') === '2026-10-05', String(ft('2026-10-05')));
    assert(ft(null) === '2026-09-28', String(ft(null)));
    assert(th('2026-06-03') === '2026-06-01', String(th('2026-06-03')));
    assert(th(null) === null, 'lớp thường chưa khai giảng');
  });

  const { migratePrNhap } = await import('../migrate/prNhap.ts');
  const { examPlanOf } = await import('../fasttrack/cycles.ts');
  check('NHAP (2) · migrate email + exam_date chạy lặp được; nhãn dự kiến thi đọc ngày', () => {
    const a: string[] = [];
    migratePrNhap(conn, a);
    const b: string[] = [];
    migratePrNhap(conn, b);
    assert(b.length === 0, `lần hai vẫn đổi: ${b.join('; ')}`);
    const coCot = (bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
    assert(coCot('students', 'email') && coCot('learning_cycles', 'exam_date'), 'thiếu cột');
    const p = examPlanOf({ exam_date: '2027-01-15' });
    assert(p.label === '15/01/2027' && p.weekStart === '2027-01-11' && p.month === '2027-01', JSON.stringify(p));
    assert(examPlanOf({ exam_month: '15/01' }).confidence === 'none', 'exam_month rác phải coi như chưa có');
    assert(examPlanOf({ exam_month: '2027-05' }).label === '05/2027', 'nhãn tháng dự kiến luôn kèm năm, một cách viết (NEN-V5 P5, thay Q8)');
  });

  const intake: any = await import('../classes/intake.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const ft = t.classId('MB FT 101');
  const thuong = (conn.prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
                                 WHERE pg.scoring_mode = 'ratio' AND c.start_date IS NOT NULL LIMIT 1`).get() as any).id;

  check('NHAP (3) · parsePaste nhận cột theo tiêu đề, thứ tự đảo vẫn đúng', () => {
    const r = intake.parsePaste('Email\tHọ và tên\tNgày sinh\na@b.vn\tAn\t31/02/2010');
    assert(r.rows[0].fullName === 'An' && r.rows[0].email === 'a@b.vn' && r.rows[0].dob === '31/02/2010', JSON.stringify(r.rows[0]));
    const g = intake.parsePaste('Họ và tên\tGhi chú\nAn\tx');
    assert(g.cotBoQua.join() === 'Ghi chú', JSON.stringify(g.cotBoQua));
  });

  check('NHAP (3) · xem trước FT: ngày không có thật, thiếu ngày sinh / email không lỗi (OV-11g Q3), dự kiến thi tháng, lộ trình theo lớp', () => {
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [
      { fullName: 'A', dob: '31/02/2010', email: 'a@b.vn' },
      { fullName: 'B' },
      { fullName: 'C', dob: '2010-01-01', email: 'c@d.vn', examDate: '05/2027' },
      { fullName: 'D', dob: '2010-01-01', email: 'd@e.vn', route: 'LT2' },
      { fullName: 'E', dob: '2010-01-01', email: 'e@f.vn', examDate: '13/2027' },
    ] });
    const [a, b, c, dd, e] = pv.rows;
    assert(a.issues.some((i: any) => i.field === 'dob' && i.muc === 'loi' && i.message === 'Ngày không có thật'), JSON.stringify(a.issues));
    assert(!b.issues.some((i: any) => i.muc === 'loi'), JSON.stringify(b.issues));   // OV-11g (Q3): ngày sinh, email không bắt buộc
    assert(c.examDate === '2027-05' && !c.issues.some((i: any) => i.muc === 'loi'), JSON.stringify(c));
    assert(dd.issues.some((i: any) => i.field === 'route' && i.muc === 'luu_y' && /LT1/.test(i.message)), JSON.stringify(dd.issues));
    assert(e.issues.some((i: any) => i.field === 'examDate' && i.muc === 'loi'), 'tháng 13 phải lỗi');
    assert(pv.issues.every((i: any) => i.muc === 'loi' || i.muc === 'luu_y'), 'mọi vấn đề phải có muc');
  });

  check('NHAP (3) · lớp thường: cột FT dán vào chỉ là lưu ý, không lỗi (Q4); Target/Dự kiến thi nay được nhận (PR-NT 04/10)', () => {
    const pv = intake.previewIntake(P.admin, { classId: thuong, rows: [{ fullName: 'E', dob: '2010-01-01', email: 'e@f.vn', target: '6.5', baselineScore: '5', examDate: '05/2027' }] });
    const is = pv.rows[0].issues;
    assert(is.some((i: any) => i.field === 'baselineScore') && is.every((i: any) => i.muc === 'luu_y'), JSON.stringify(is));
    assert(pv.rows[0].baselineScore === null && pv.rows[0].target === 6.5 && pv.rows[0].examDate === '2027-05', 'OVR bỏ qua, target/thi nhận');
  });

  check('NHAP (3) · Mâu thuẫn #1: dòng chỉ có cảnh báo trùng hồ sơ vẫn được thêm', () => {
    const cu = conn.prepare('SELECT full_name, dob FROM students WHERE dob IS NOT NULL LIMIT 1').get() as any;
    const r = intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName: cu.full_name, dob: cu.dob, email: 'trung@demo.test' }],
      idempotencyKey: 'nhap-3-trung' });
    assert(r.added === 1, `trùng hồ sơ bị chặn: ${JSON.stringify(r.failed)}`);
  });

  check('NHAP (3) · ghi: email, ngày thi (ngày → tháng + tuần), lộ trình theo lớp, hangDaThem', () => {
    const r = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'nhap-3-ghi', rows: [
      { fullName: 'Nhập Có Email', dob: '2010-01-01', email: 'X@Y.vn', examDate: '15/01/2027', route: 'LT2' },
      { fullName: 'Nhập Thiếu Email', dob: '31/02/2010' },   // OV-11g: thiếu ngày sinh / email đã thêm được — dòng lỗi giờ là ngày sinh sai
    ] });
    assert(r.added === 1 && JSON.stringify(r.hangDaThem) === '[1]', JSON.stringify(r));
    const s = conn.prepare("SELECT id, email FROM students WHERE full_name = 'Nhập Có Email'").get() as any;
    assert(s.email === 'x@y.vn', String(s.email));
    const cy = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(s.id) as any;
    assert(cy.exam_date === '2027-01-15' && cy.exam_month === '2027-01' && cy.exam_period_id && cy.route === 'LT1', JSON.stringify(cy));
    assert(!conn.prepare("SELECT id FROM students WHERE full_name = 'Nhập Thiếu Email'").get(), 'dòng thiếu email vẫn được ghi');
  });

  check('NHAP (3) · tuần bắt đầu mặc định = tuần khai giảng kể cả lớp FT đã học ≥ 3 tuần; tuần gửi sai → lỗi cả lô, không lặng lẽ thay', () => {
    const h = demoToday();
    const lop = conn.prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
                               WHERE pg.scoring_mode <> 'ratio' AND c.start_date IS NOT NULL AND c.start_date <= ? LIMIT 1`)
      .get(t.addDays(h, -21)) as any;
    assert(lop, 'demo thiếu lớp FT đã khai giảng ≥ 3 tuần');
    const kg = (conn.prepare('SELECT start_date FROM classes WHERE id = ?').get(lop.id) as any).start_date;
    const pv = intake.previewIntake(P.admin, { classId: lop.id, rows: [{ fullName: 'F', dob: '2010-01-01', email: 'f@g.vn' }] });
    assert(pv.defaultStartWeek === d.mondayOfDate(kg), `${pv.defaultStartWeek} ≠ tuần khai giảng ${kg}`);
    const sai = intake.previewIntake(P.admin, { classId: lop.id, defaultStartWeek: '31/02/2026', rows: [{ fullName: 'F', dob: '2010-01-01', email: 'f@g.vn' }] });
    assert(sai.issues.some((i: any) => i.row === 0 && i.field === 'startWeek' && i.muc === 'loi'), 'tuần cả lô sai không báo');
    assert(sai.rows[0].issues.some((i: any) => i.field === 'startWeek' && i.muc === 'loi'), 'dòng theo tuần cả lô sai vẫn thêm được');
  });

  const students: any = await import('../students/students.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const { missingForStudent } = await import('../classes/schedule.ts');
  check('NHAP (4) · Thông tin HV: GVCN sửa email/ngày sinh có kiểm ở máy chủ; ngày thi, tuần bắt đầu ở lộ trình', () => {
    const sid = (conn.prepare("SELECT id FROM students WHERE full_name = 'Nhập Có Email'").get() as any).id;
    const email = () => (conn.prepare('SELECT email FROM students WHERE id = ?').get(sid) as any).email;
    students.updateStudent(P.coreTeacher, sid, { email: ' Moi.Email@Gmail.com ' });
    assert(email() === 'moi.email@gmail.com', String(email()));
    t.assertThrows(() => students.updateStudent(P.coreTeacher, sid, { dob: '31/02/2010' }), /Ngày không có thật/, 'ngày sinh 31/02');
    t.assertThrows(() => students.updateStudent(P.coreTeacher, sid, { email: 'abc' }), /Email/, 'email sai dạng');
    t.assertThrows(() => students.updateStudent(P.coreTeacher, sid, { fullName: '  ' }), /Họ tên/, 'họ tên trống');
    /* PR-OV2c: email không bắt buộc — xoá trống = NULL (PR-OV2b từng chặn). */
    students.updateStudent(P.coreTeacher, sid, { email: '', dob: '12/05/2010' });
    const s = conn.prepare('SELECT email, dob FROM students WHERE id = ?').get(sid) as any;
    assert(s.email === null && s.dob === '2010-05-12', JSON.stringify(s));

    const cy = () => conn.prepare(`SELECT lc.*, sp.week_start AS sw FROM learning_cycles lc
                                     LEFT JOIN report_periods sp ON sp.id = lc.start_period_id WHERE lc.student_id = ?`).get(sid) as any;
    const cid = cy().id;
    cycles.updateCycle(P.coreTeacher, cid, { examDate: '15/01/2027' });
    const a = cy();
    const tuanThi = (conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(a.exam_period_id) as any)?.week_start;
    assert(a.exam_date === '2027-01-15' && a.exam_month === '2027-01' && tuanThi === '2027-01-11', JSON.stringify({ a, tuanThi }));
    cycles.updateCycle(P.coreTeacher, cid, { examDate: '05/2027' });
    const b = cy();
    assert(b.exam_date === null && b.exam_month === '2027-05', JSON.stringify(b));
    t.assertThrows(() => cycles.updateCycle(P.coreTeacher, cid, { examDate: '13/2027' }), /Dự kiến thi/, 'tháng 13');
    cycles.updateCycle(P.coreTeacher, cid, { startWeek: '2026-10-07' });
    assert(cy().sw === '2026-10-05', String(cy().sw));
  });

  check('NHAP (4) · H6 → OV-11g (Q3 chủ SP 14/10): thiếu email BẬT "Thiếu thông tin"; đủ ngày sinh + email thì không', () => {
    const cycle = { start_period_id: 1, exam_month: '2027-01', target_score: 6.5, baseline: true };
    const thieu = missingForStudent({ cycle, student: { dob: '2010-05-12', email: null }, isFastTrack: true } as any);
    assert(thieu.map((m: any) => m.key).join() === 'email', JSON.stringify(thieu));
    assert(missingForStudent({ cycle, student: { dob: '2010-05-12', email: 'a@b.vn' }, isFastTrack: true } as any).length === 0, 'đủ vẫn báo thiếu');
  });

  const luotCua = (ten: string) => conn.prepare(`SELECT a.attempt_no, a.lich_su FROM assessment_attempts a
      JOIN students s ON s.id = a.student_id WHERE s.full_name = ? AND a.status <> 'cancelled' ORDER BY a.attempt_no`).all(ten) as any[];
  check('NHAP (7) · Đã thi tới MT + báo trước MT lịch sử: em cũ học 22 tuần, đã thi tới MT4 → 4 lượt lịch sử; khối kết quả đếm đúng', () => {
    const h = demoToday();
    const tuan22 = t.addDays(d.mondayOfDate(h), -7 * 22);
    const dong = { fullName: 'Nhập Em Cũ MT4', dob: '2010-01-01', email: 'cu@demo.test', startWeek: tuan22, daThiToiMt: '4' };
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [dong] });
    const ly = pv.rows[0].issues.find((i: any) => i.field === 'startWeek');
    assert(ly && ly.muc === 'luu_y' && /4 MT sẽ là MT cũ \(MT1, MT2, MT3, MT4\)/.test(ly.message), JSON.stringify(pv.rows[0].issues));
    const r = intake.commitIntake(P.admin, { classId: ft, rows: [dong], idempotencyKey: 'nhap-7-cu' });
    const ls = luotCua('Nhập Em Cũ MT4');
    assert(ls.length === 4 && ls.every((a) => a.lich_su === 1), JSON.stringify(ls));
    assert(r.mt.soEm === 1 && r.mt.soEmCoLichSu === 1 && r.mt.soLuotLichSu === 4 && r.mt.luotLichSuDau, JSON.stringify(r.mt));
  });

  check('NHAP (7) · em FT bắt đầu tuần này → 3 lượt thường, không lưu ý; "Đã thi tới MT" 9 → lỗi; lớp thường → lưu ý, không lượt', () => {
    const tuanNay = d.mondayOfDate(demoToday());
    const moi = { fullName: 'Nhập Em Mới Tuần Này', dob: '2010-01-01', email: 'moi@demo.test', startWeek: tuanNay };
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [moi, { fullName: 'Nhập Sai MT', dob: '2010-01-01', email: 'x@demo.test', daThiToiMt: '9' }] });
    assert(!pv.rows[0].issues.some((i: any) => i.field === 'startWeek'), JSON.stringify(pv.rows[0].issues));
    assert(pv.rows[1].issues.some((i: any) => i.field === 'daThiToiMt' && i.muc === 'loi'), 'Đã thi tới MT 9 phải lỗi');
    const r = intake.commitIntake(P.admin, { classId: ft, rows: [moi], idempotencyKey: 'nhap-7-moi' });
    const ls = luotCua('Nhập Em Mới Tuần Này');
    assert(ls.length === 3 && ls.every((a) => a.lich_su === 0) && r.mt.soLuotLichSu === 0, JSON.stringify(ls));
    const th = { fullName: 'Nhập Lớp Thường MT', dob: '2010-01-01', email: 'th@demo.test', daThiToiMt: '3' };
    const pvt = intake.previewIntake(P.admin, { classId: thuong, rows: [th] });
    assert(pvt.rows[0].issues.every((i: any) => i.muc === 'luu_y') && pvt.rows[0].issues.some((i: any) => i.field === 'daThiToiMt'),
      JSON.stringify(pvt.rows[0].issues));
    intake.commitIntake(P.admin, { classId: thuong, rows: [th], idempotencyKey: 'nhap-7-thuong' });
    assert(luotCua('Nhập Lớp Thường MT').length === 0, 'lớp thường không có lượt MT');
  });

  check('NHAP (7) · bỏ trống tuần → tuần khai giảng; lớp đã học lâu thì xem trước báo MT lịch sử (planning chốt 29/09)', () => {
    const kg = (conn.prepare('SELECT start_date FROM classes WHERE id = ?').get(ft) as any).start_date as string;
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Nhập Theo Khai Giảng', dob: '2010-01-01', email: 'kg@demo.test' }] });
    const kgT2 = d.mondayOfDate(kg);
    assert(pv.defaultStartWeek === kgT2, `${pv.defaultStartWeek} ≠ ${kgT2}`);
    const mt1LichSu = d.laMtCu(t.addDays(kgT2, 5 * 7 + 6), demoToday());   // PR-MTa T1: MT cũ = cách ≥ 2 tuần (laMtCu)
    const coLuuY = pv.rows[0].issues.some((i: any) => i.field === 'startWeek' && /MT cũ/.test(i.message));
    assert(coLuuY === mt1LichSu, `MT1 lịch sử=${mt1LichSu} nhưng lưu ý=${coLuuY}`);
  });

  check('NHAP (7) · PR-DUYET: GVCN vẫn đặt target + dự kiến thi lúc THÊM MỚI (cycle.edit chỉ chặn SỬA)', () => {
    const r = intake.commitIntake(P.coreTeacher, { classId: ft, idempotencyKey: 'nhap-7-gvcn',
      rows: [{ fullName: 'Nhập GVCN Đặt Target', dob: '2010-01-01', email: 'gv@demo.test', target: '6.5', examDate: '05/2027' }] });
    assert(r.added === 1, JSON.stringify(r.failed));
    const cy = conn.prepare(`SELECT lc.target_score, lc.exam_month, lc.route FROM learning_cycles lc JOIN students s ON s.id = lc.student_id
                              WHERE s.full_name = 'Nhập GVCN Đặt Target'`).get() as any;
    assert(cy.target_score === 6.5 && cy.exam_month === '2027-05' && cy.route === 'LT1', JSON.stringify(cy));
  });
}
