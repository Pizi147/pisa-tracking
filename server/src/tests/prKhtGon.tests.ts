/**
 * PHÉP KIỂM KHT-GON (chủ SP duyệt mockup `thiet-ke/v7/ke-hoach-test.html` #659, 28/10): `oGon` — nội dung MỘT ô đợt Kế hoạch Test bản gọn.
 * Thuần (không DB): tuần + một chữ / kết quả; ô kỹ năng chỉ khi cần; "S riêng · tuần"; vắng một dòng, đủ điểm thì không ghi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrKhtGonTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nKHT-GON · ô Kế hoạch Test bản gọn (oGon)');

  const HN = '2026-10-28';   // thứ Tư W5 OCT
  const tuan = (thuHai: string) => ({ tuan: thuHai, tuanKetThuc: d.addDaysIso(thuHai, 6) });
  const o = (x: Record<string, unknown> = {}) => ({
    trangThai: 'da-xep', tuan: null, periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', tuanKetThuc: null, choDuyet: false, hanCham: null, ...x,
  });
  const xong = (w: string, x: Record<string, unknown> = {}) => o({ trangThai: 'xong', ...tuan(w), ...x });

  check('KHT-1 · đủ điểm: xong, không ô kỹ năng, KHÔNG ghi vắng dù đã từng vắng; tuần = tuần muộn nhất', () => {
    const g = d.oGon({ listening: xong('2026-10-05', { doiTu: '2026-09-28' }), reading: xong('2026-10-05'), writing: xong('2026-10-05'), speaking: xong('2026-10-12') }, HN);
    assert(g.xong && g.tt.loai === 'xong' && g.kn === null && g.vang === null && g.rieng === null, JSON.stringify(g));
    assert(g.tuan === d.tuanLich('2026-10-12'), `tuần muộn nhất: ${g.tuan}`);
  });

  check('KHT-2 · trễ chấm + vắng cả đợt: ô kỹ năng L R W có điểm, S chưa; MỘT dòng "vắng W2 OCT" (không lặp từng môn)', () => {
    const w3 = '2026-10-12', w2 = '2026-10-05';
    const g = d.oGon({
      listening: xong(w3, { doiTu: w2 }), reading: xong(w3, { doiTu: w2 }), writing: xong(w3, { doiTu: w2 }),
      speaking: o({ ...tuan(w3), doiTu: w2, hanCham: '2026-10-21' }),
    }, HN);
    assert(g.tt.chu === 'trễ chấm' && g.tt.loai === 'tre', JSON.stringify(g.tt));
    assert(g.kn.map((k: any) => `${k.ten}:${k.loai}`).join(' ') === 'L:co R:co W:co S:chua', JSON.stringify(g.kn));
    assert(g.vang === `vắng ${d.tuanLich(w2)}`, `vắng gộp: ${g.vang}`);
  });

  check('KHT-3 · đợt thiếu kỹ năng (W, S bỏ khỏi đợt) đã xong: ô kỹ năng ghi W S "khong" (chữ gạch)', () => {
    const g = d.oGon({ listening: xong('2026-09-28'), reading: xong('2026-09-28'), writing: o({ batBuoc: false }), speaking: o({ batBuoc: false }) }, HN);
    assert(g.xong && g.kn.map((k: any) => k.loai).join() === 'co,co,khong,khong', JSON.stringify(g.kn));
  });

  check('KHT-4 · kỹ năng khác tuần trong cùng đợt → "S riêng · W3 DEC"; đã xếp chưa tới tuần → không chữ trạng thái', () => {
    const a = '2026-12-07', b = '2026-12-14';
    const g = d.oGon({ listening: o(tuan(a)), reading: o(tuan(a)), writing: o(tuan(a)), speaking: o(tuan(b)) }, HN);
    assert(g.tt === null && g.kn === null && g.tuan === d.tuanLich(a), JSON.stringify(g));
    assert(g.rieng === `S riêng · ${d.tuanLich(b)}`, `riêng: ${g.rieng}`);
  });

  check('KHT-5 · vắng một phần → "vắng W · tuần"; vắng cần xếp lại → chữ vàng "xếp lại S"; tuần này → "tuần này"', () => {
    const g = d.oGon({ listening: o(tuan('2026-11-09')), reading: o(tuan('2026-11-09')), writing: o({ ...tuan('2026-11-09'), doiTu: '2026-11-02' }), speaking: o(tuan('2026-11-09')) }, HN);
    assert(g.vang === `vắng W · ${d.tuanLich('2026-11-02')}`, `vắng một phần: ${g.vang}`);
    const v = d.oGon({ listening: xong('2026-10-19'), reading: xong('2026-10-19'), writing: xong('2026-10-19'), speaking: o({ trangThai: 'vang', sit: 'absent', ...tuan('2026-10-19') }) }, HN);
    assert(v.tt.loai === 'vang' && v.tt.chu === 'xếp lại S', JSON.stringify(v.tt));
    const n = d.oGon({ listening: o(tuan('2026-10-26')), reading: o(tuan('2026-10-26')), writing: o(tuan('2026-10-26')), speaking: o(tuan('2026-10-26')) }, HN);
    assert(n.tt.loai === 'nay' && n.kn === null, JSON.stringify(n));
  });
}
