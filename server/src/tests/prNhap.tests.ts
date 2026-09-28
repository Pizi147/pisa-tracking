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
    const r = d.nhanDangCot(['Họ và tên *', 'Ngày sinh', 'E-mail', 'Thi dự kiến', 'Ghi chú', 'STT', 'Lộ trình', 'Họ tên']);
    assert(JSON.stringify(r.cot) === JSON.stringify(['fullName', 'dob', 'email', 'examDate', null, null, 'route', null]), JSON.stringify(r.cot));
    assert(JSON.stringify(r.boQua) === JSON.stringify(['Ghi chú', 'Họ tên']), JSON.stringify(r.boQua));
  });

  check('NHAP (1) · cotLuoiNhap: lớp thường 4 cột, FT 11 cột', () => {
    const thuong = d.cotLuoiNhap(true).map((c) => c.key).join(',');
    assert(thuong === 'fullName,dob,email,startWeek', thuong);
    const ft = d.cotLuoiNhap(false).map((c) => c.key);
    assert(ft.length === 11 && ft[9] === 'examDate' && ft[10] === 'startWeek', ft.join(','));
  });

  check('NHAP (1) · tuanBatDauMacDinh (K2-19)', () => {
    const h = '2026-09-29';
    const ft = (kg: string | null) => d.tuanBatDauMacDinh({ lopThuong: false, khaiGiang: kg }, h);
    const th = (kg: string | null) => d.tuanBatDauMacDinh({ lopThuong: true, khaiGiang: kg }, h);
    assert(ft('2026-09-21') === '2026-09-21', String(ft('2026-09-21')));
    assert(ft('2026-09-14') === '2026-09-28', String(ft('2026-09-14')));
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
    assert(examPlanOf({ exam_month: '2027-05' }).label === 'MAY 2027', 'nhãn tháng giữ kiểu cũ (Q8)');
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

  check('NHAP (3) · xem trước FT: ngày không có thật, thiếu email, thi dự kiến tháng, lộ trình theo lớp', () => {
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [
      { fullName: 'A', dob: '31/02/2010', email: 'a@b.vn' },
      { fullName: 'B' },
      { fullName: 'C', email: 'c@d.vn', examDate: '05/2027' },
      { fullName: 'D', email: 'd@e.vn', route: 'LT2' },
      { fullName: 'E', email: 'e@f.vn', examDate: '13/2027' },
    ] });
    const [a, b, c, dd, e] = pv.rows;
    assert(a.issues.some((i: any) => i.field === 'dob' && i.muc === 'loi' && i.message === 'Ngày không có thật'), JSON.stringify(a.issues));
    assert(b.issues.some((i: any) => i.field === 'email' && i.muc === 'loi'), JSON.stringify(b.issues));
    assert(c.examDate === '2027-05' && !c.issues.some((i: any) => i.muc === 'loi'), JSON.stringify(c));
    assert(dd.issues.some((i: any) => i.field === 'route' && i.muc === 'luu_y' && /LT1/.test(i.message)), JSON.stringify(dd.issues));
    assert(e.issues.some((i: any) => i.field === 'examDate' && i.muc === 'loi'), 'tháng 13 phải lỗi');
    assert(pv.issues.every((i: any) => i.muc === 'loi' || i.muc === 'luu_y'), 'mọi vấn đề phải có muc');
  });

  check('NHAP (3) · lớp thường: cột FT dán vào chỉ là lưu ý, không lỗi (Q4)', () => {
    const pv = intake.previewIntake(P.admin, { classId: thuong, rows: [{ fullName: 'E', email: 'e@f.vn', target: '6.5', baselineScore: '5', examDate: '05/2027' }] });
    const is = pv.rows[0].issues;
    assert(is.length >= 3 && is.every((i: any) => i.muc === 'luu_y'), JSON.stringify(is));
    assert(pv.rows[0].baselineScore === null && pv.rows[0].examDate === undefined, 'lớp thường vẫn giữ OVR/thi');
  });

  check('NHAP (3) · Mâu thuẫn #1: dòng chỉ có cảnh báo trùng hồ sơ vẫn được thêm', () => {
    const cu = conn.prepare('SELECT full_name, dob FROM students WHERE dob IS NOT NULL LIMIT 1').get() as any;
    const r = intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName: cu.full_name, dob: cu.dob, email: 'trung@demo.test' }],
      idempotencyKey: 'nhap-3-trung' });
    assert(r.added === 1, `trùng hồ sơ bị chặn: ${JSON.stringify(r.failed)}`);
  });

  check('NHAP (3) · ghi: email, ngày thi (ngày → tháng + tuần), lộ trình theo lớp, hangDaThem', () => {
    const r = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'nhap-3-ghi', rows: [
      { fullName: 'Nhập Có Email', email: 'X@Y.vn', examDate: '15/01/2027', route: 'LT2' },
      { fullName: 'Nhập Thiếu Email' },
    ] });
    assert(r.added === 1 && JSON.stringify(r.hangDaThem) === '[1]', JSON.stringify(r));
    const s = conn.prepare("SELECT id, email FROM students WHERE full_name = 'Nhập Có Email'").get() as any;
    assert(s.email === 'x@y.vn', String(s.email));
    const cy = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(s.id) as any;
    assert(cy.exam_date === '2027-01-15' && cy.exam_month === '2027-01' && cy.exam_period_id && cy.route === 'LT1', JSON.stringify(cy));
    assert(!conn.prepare("SELECT id FROM students WHERE full_name = 'Nhập Thiếu Email'").get(), 'dòng thiếu email vẫn được ghi');
  });

  check('NHAP (3) · tuần bắt đầu mặc định K2-19: lớp FT đã học ≥ 3 tuần → tuần này; tuần gửi sai → lỗi cả lô, không lặng lẽ thay', () => {
    const h = demoToday();
    const lop = conn.prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
                               WHERE pg.scoring_mode <> 'ratio' AND c.start_date IS NOT NULL AND c.start_date <= ? LIMIT 1`)
      .get(t.addDays(h, -21)) as any;
    assert(lop, 'demo thiếu lớp FT đã khai giảng ≥ 3 tuần');
    const pv = intake.previewIntake(P.admin, { classId: lop.id, rows: [{ fullName: 'F', email: 'f@g.vn' }] });
    assert(pv.defaultStartWeek === d.mondayOfDate(h), `${pv.defaultStartWeek} ≠ tuần này`);
    const sai = intake.previewIntake(P.admin, { classId: lop.id, defaultStartWeek: '31/02/2026', rows: [{ fullName: 'F', email: 'f@g.vn' }] });
    assert(sai.issues.some((i: any) => i.row === 0 && i.field === 'startWeek' && i.muc === 'loi'), 'tuần cả lô sai không báo');
    assert(sai.rows[0].issues.some((i: any) => i.field === 'startWeek' && i.muc === 'loi'), 'dòng theo tuần cả lô sai vẫn thêm được');
  });
}
