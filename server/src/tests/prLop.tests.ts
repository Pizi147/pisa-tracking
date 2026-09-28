/** PHÉP KIỂM PR-LOP — tạo lớp, tên lớp, RF, Pre FOU, phân công. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LOP · Tạo lớp, tên lớp, RF, Pre FOU, phân công');

  check('LOP (1) · ghepMaLop / kiemSoLop / locSoLop (T1, L1, PF5)', () => {
    assert(d.ghepMaLop('MB', 'FT', 'LT1', '101') === 'MB FT 101', d.ghepMaLop('MB', 'FT', 'LT1', '101'));
    assert(d.ghepMaLop('MB', 'FT', 'RF', '12') === 'MB FT RF 12', 'RF');
    assert(d.ghepMaLop('MB', 'PREFOU', null, '03') === 'MB Pre FOU 03', 'Pre FOU');
    assert(d.ghepMaLop('CP', 'FOU', null, '101a') === 'CP FOU 101A', 'chữ cái cuối viết hoa');
    assert(d.kiemSoLop('101A') === null && d.kiemSoLop('7') === null, 'số hợp lệ');
    for (const sai of ['', '12345', 'FT 1', '10AB', '1-2']) assert(d.kiemSoLop(sai) !== null, `nhận nhầm "${sai}"`);
    assert(d.locSoLop('ft12a') === '12A' && d.locSoLop('123456') === '1234', d.locSoLop('ft12a'));
  });
  check('LOP (1) · chuanHoaMaLop: ft101 · MB-FT 101 · mb ft 101 cùng một khoá (T2, K2-07)', () => {
    const k = d.chuanHoaMaLop('MB FT 101');
    assert(['MB-FT 101', 'mb ft 101', 'MBFT101'].every((s) => d.chuanHoaMaLop(s) === k) && k.includes(d.chuanHoaMaLop('ft101')), k);
  });
  check('LOP (1) · soSanhLop: 9 < 12 < 101 < 101A; FT < FT RF < Pre FOU < FOU < BE < ELE (K2-08)', () => {
    const ds = ['MB FT 101', 'MB BE 03', 'MB FT 12', 'MB Pre FOU 03', 'MB FT RF 12', 'MB FT 101A', 'MB FT 9', 'MB ELE 05', 'MB FOU 12']
      .map((code) => ({ code, branchId: 1 })).sort(d.soSanhLop).map((x) => x.code).join(' | ');
    assert(ds === 'MB FT 9 | MB FT 12 | MB FT 101 | MB FT 101A | MB FT RF 12 | MB Pre FOU 03 | MB FOU 12 | MB BE 03 | MB ELE 05', ds);
    assert(d.soSanhLop({ code: 'CP FT 1', branchId: 2 }, { code: 'MB ELE 9', branchId: 1 }) > 0, 'chi nhánh đứng trước');
  });
  check('LOP (1) · tenMoiChoLopCu: đổi đúng mẫu, không đoán lớp lạ (T2, K5-68)', () => {
    const doi = (code: string, cn: string, pc: string | null, r: string | null) =>
      JSON.stringify(d.tenMoiChoLopCu({ code, branchCode: cn, programmeCode: pc, route: r }));
    assert(doi('CP-FT 139', 'CP', 'FT', 'LT1') === '{"moi":"CP FT 139"}', 'CP-FT 139');
    assert(doi('UB-FOUND 07', 'UB', 'FOU', null) === '{"moi":"UB FOU 07"}', 'FOUND → FOU');
    assert(doi('MB FT 101', 'MB', 'FT', 'LT1') === '{"moi":"MB FT 101"}', 'đã đúng mẫu → giữ');
    assert(doi('MB-FT THU 01', 'MB', 'FT', 'LT1') === '{"loi":"khong-theo-mau"}', 'lớp thử');
    assert(doi('MB-BE 08', 'MB', 'FT', 'LT1') === '{"loi":"lech-chuong-trinh"}', 'tên nói BE, cột nói FT');
    assert(doi('XX-FT 1', 'MB', 'FT', 'LT1') === '{"loi":"khong-tien-to"}', 'sai tiền tố');
  });
}
