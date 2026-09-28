/** PHÉP KIỂM PR-NHAP — Thêm học viên (email, ngày thi, cột theo tiêu đề, tuần mặc định), Thông tin HV. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNhapTests(t: YThucTestKit) {
  const { check, assert } = t;
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
}
