/** PHÉP KIỂM PR-LT2b — Cuối khoá lớp thường: dải, hướng gợi ý, bổ trợ miễn phí, Mini Test. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2bTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LT2b · Cuối khoá lớp thường');

  // ------------------------------------------------------------------ Task 1 · luật thuần
  check('LT2b (1) · dải trên số CHƯA làm tròn: 0.4999 / 0.5 / 0.595 / 0.6 / 0.6999 / 0.7', () => {
    const cap: [number, string][] = [[0.4999, 'duoi_50'], [0.5, '50_59'], [0.595, '50_59'], [0.6, '60_69'], [0.6999, '60_69'], [0.7, 'dat']];
    for (const [x, dai] of cap) assert(d.daiCuoiKhoa(x) === dai, `${x} → ${d.daiCuoiKhoa(x)} (cần ${dai})`);
  });
  check('LT2b (1) · thiếu môn (tyLe null) hoặc không phải lớp thường → không gợi ý', () => {
    assert(d.goiYCuoiKhoa({ ct: 'BE', tyLe: null, monTruot: [] }) === null, 'null');
    assert(d.goiYCuoiKhoa({ ct: 'FT', tyLe: 0.6, monTruot: [] }) === null, 'FT');
    assert(d.goiYCuoiKhoa({ ct: null, tyLe: 0.6, monTruot: [] }) === null, 'không rõ');
  });
  check('LT2b (1) · FOU 64% trượt L, G+V → lên BE, 2 buổi · 1 tuần, nhãn có "L, G+V"', () => {
    const g = d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.64, monTruot: ['listening', 'writing'] })!;
    assert(g.dai === '60_69' && g.huong === 'len' && !g.canQuanLy, `dải/hướng ${g.dai}/${g.huong}`);
    assert(g.boTroNeuLen!.soBuoi === 2 && g.boTroNeuLen!.soTuan === 1 && g.boTroNeuLen!.theoMon, 'bổ trợ');
    assert(g.boTroNeuLen!.mon.join() === 'listening,writing', 'ô chuẩn lớp cũ');
    assert(g.nhan.includes('Lên BE') && g.nhan.includes('L, G+V') && g.nhan.includes('Mini Test'), g.nhan);
    assert(g.nhanNgan === '→ lên + bổ trợ', g.nhanNgan);
  });
  check('LT2b (1) · BE 55% → Quản lý cân nhắc (canQuanLy), 2 tuần, chưa có hướng; không báo PH', () => {
    const g = d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.55, monTruot: ['reading', 'writing', 'speaking'] })!;
    assert(g.dai === '50_59' && g.huong === null && g.canQuanLy && g.canQl, 'canQuanLy');
    assert(g.boTroNeuLen!.soTuan === 2 && g.boTroNeuLen!.soBuoi === 3 && !g.baoPhTvv, 'bổ trợ nếu lên');
    assert(g.nhan.startsWith('Quản lý cân nhắc') && g.nhanNgan === '→ QL cân nhắc', g.nhan);
  });
  check('LT2b (1) · Pre FOU 52% → 4 buổi, 64% → 2 buổi, không theo môn (PF3)', () => {
    const a = d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.52, monTruot: [] })!.boTroNeuLen!;
    const b = d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.64, monTruot: [] })!.boTroNeuLen!;
    assert(a.soBuoi === 4 && a.soTuan === 2 && !a.theoMon && a.mon.join() === 'tong_hop', 'Pre FOU 52%');
    assert(b.soBuoi === 2 && b.soTuan === 1 && !b.theoMon, 'Pre FOU 64%');
    assert(d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.64, monTruot: [] })!.nhan.includes('Lên FOU'), 'nhãn lớp kế');
  });
  check('LT2b (1) · dưới 50% → học lại + Báo PH qua TVV; từ 70% → Pass, không bổ trợ', () => {
    const a = d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.45, monTruot: ['reading'] })!;
    assert(a.huong === 'hoc_lai' && a.baoPhTvv && !a.boTroNeuLen && a.nhan === 'Học lại BE' && a.nhanNgan === '→ học lại', 'dưới 50');
    const p = d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.72, monTruot: [] })!;
    assert(p.huong === 'len' && !p.boTroNeuLen && p.nhan === 'Pass' && p.nhanNgan === '→ Pass', 'Pass');
  });
  check('LT2b (1) · ELE 64% → lên FT (không còn bậc thường)', () => {
    assert(d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.64, monTruot: ['reading'] })!.nhan.startsWith('Lên FT'), 'ELE → FT');
  });
  check('LT2b (1) · lichBoTro: 1 tuần và 2 tuần — Chủ nhật tuần cuối, hạn +2 ngày lịch (M-05)', () => {
    const a = d.lichBoTro({ batDau: '2026-10-05', soTuan: 1 });
    const b = d.lichBoTro({ batDau: '2026-10-05', soTuan: 2 });
    assert(a.ngayMiniTest === '2026-10-11' && a.hanMiniTest === '2026-10-13', `1 tuần ${a.ngayMiniTest}/${a.hanMiniTest}`);
    assert(b.ngayMiniTest === '2026-10-18' && b.hanMiniTest === '2026-10-20', `2 tuần ${b.ngayMiniTest}/${b.hanMiniTest}`);
  });
  check('LT2b (1) · kyNangLopDich: sang FT writing → writing2 (M-21); còn lại giữ, tong_hop giữ', () => {
    assert(d.kyNangLopDich('writing', true) === 'writing2', 'writing → writing2');
    assert(d.kyNangLopDich('writing', false) === 'writing', 'không sang FT');
    assert(d.kyNangLopDich('reading', true) === 'reading' && d.kyNangLopDich('tong_hop', true) === 'tong_hop', 'giữ');
  });
}
