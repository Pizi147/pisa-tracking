/**
 * PHÉP KIỂM KHT-GON (chủ SP duyệt mockup `thiet-ke/v7/ke-hoach-test.html` #659, 28/10): `oGon` — nội dung MỘT ô đợt Kế hoạch Test bản gọn.
 * Thuần (không DB): dòng theo tuần thi, ô môn có khung (L ✓ · L · S trễ chấm), "không thi W S", vắng chữ thường (đủ điểm thì không ghi).
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

  const monCua = (dg: any) => dg.mon.map((m: any) => `${m.ten}:${m.loai}`).join(' ');

  check('KHT-1 · đủ điểm: xong, một dòng tuần + 4 ô "✓", KHÔNG ghi vắng dù đã từng vắng; tuần chính = tuần muộn nhất', () => {
    const g = d.oGon({ listening: xong('2026-10-05', { doiTu: '2026-09-28' }), reading: xong('2026-10-05'), writing: xong('2026-10-05'), speaking: xong('2026-10-05') }, HN);
    assert(g.xong && g.tt.loai === 'xong' && g.vang === null && g.hienMon && g.dong.length === 1, JSON.stringify(g));
    assert(monCua(g.dong[0]) === 'L:co R:co W:co S:co' && g.dong[0].tt === null, monCua(g.dong[0]));
  });

  check('KHT-2 · trễ chấm: ô môn S "trễ chấm", L R W "✓"; vắng gộp chữ thường "vắng L R W S · W2 OCT" (không lặp từng môn)', () => {
    const w3 = '2026-10-12', w2 = '2026-10-05';
    const g = d.oGon({
      listening: xong(w3, { doiTu: w2 }), reading: xong(w3, { doiTu: w2 }), writing: xong(w3, { doiTu: w2 }),
      speaking: o({ ...tuan(w3), doiTu: w2, hanCham: '2026-10-21' }),
    }, HN);
    assert(g.tt.loai === 'tre' && g.dong.length === 1 && monCua(g.dong[0]) === 'L:co R:co W:co S:tre', JSON.stringify(g.dong));
    assert(g.vang === `vắng L R W S · ${d.tuanLich(w2)}`, `vắng gộp: ${g.vang}`);
  });

  check('KHT-3 · đợt chỉ thi L R: chỉ hai ô môn + "không thi W S" (chữ mờ, không khung)', () => {
    const g = d.oGon({ listening: xong('2026-09-28'), reading: xong('2026-09-28'), writing: o({ batBuoc: false }), speaking: o({ batBuoc: false }) }, HN);
    assert(g.xong && monCua(g.dong[0]) === 'L:co R:co' && g.khongThi === 'không thi W S', JSON.stringify(g));
  });

  check('KHT-4 · môn thi tuần khác → DÒNG riêng theo tuần ("W2 DEC [L][R][W]" / "W3 DEC [S] đã xếp"); MT tương lai một tuần → chỉ tuần + "đã xếp", không hàng môn', () => {
    const a = '2026-12-07', b = '2026-12-14';
    const g = d.oGon({ listening: o(tuan(a)), reading: o(tuan(a)), writing: o(tuan(a)), speaking: o(tuan(b)) }, HN);
    assert(g.dong.length === 2 && g.dong[0].tuan === d.tuanLich(a) && monCua(g.dong[1]) === 'S:cho' && g.dong[1].tt.chu === 'đã xếp' && g.hienMon, JSON.stringify(g.dong));
    const f = d.oGon({ listening: o(tuan(a)), reading: o(tuan(a)), writing: o(tuan(a)), speaking: o(tuan(a)) }, HN);
    assert(!f.hienMon && f.dong.length === 1 && f.dong[0].tt.chu === 'đã xếp' && f.tt === null, JSON.stringify(f));
  });

  check('KHT-5 · vắng một môn đã dời → "vắng W · W1 NOV"; đang vắng chờ xếp lại → "xếp lại S" + "vắng S · tuần"; tuần này → dòng "tuần này"', () => {
    const g = d.oGon({ listening: o(tuan('2026-11-09')), reading: o(tuan('2026-11-09')), writing: o({ ...tuan('2026-11-09'), doiTu: '2026-11-02' }), speaking: o(tuan('2026-11-09')) }, HN);
    assert(g.vang === `vắng W · ${d.tuanLich('2026-11-02')}`, `vắng một phần: ${g.vang}`);
    const v = d.oGon({ listening: xong('2026-10-19'), reading: xong('2026-10-19'), writing: xong('2026-10-19'), speaking: o({ trangThai: 'vang', sit: 'absent', ...tuan('2026-10-19') }) }, HN);
    assert(v.tt.loai === 'vang' && v.tt.chu === 'xếp lại S' && monCua(v.dong[0]) === 'L:co R:co W:co' && v.vang === `vắng S · ${d.tuanLich('2026-10-19')}`, JSON.stringify(v));
    const n = d.oGon({ listening: o(tuan('2026-10-26')), reading: o(tuan('2026-10-26')), writing: o(tuan('2026-10-26')), speaking: o(tuan('2026-10-26')) }, HN);
    assert(n.tt.loai === 'nay' && n.dong[0].tt.chu === 'tuần này' && monCua(n.dong[0]) === 'L:cho R:cho W:cho S:cho', JSON.stringify(n));
  });

  check('KHT-6 · oXepMt (một hàm cho ô "Xếp MTn" và tóm tắt lớp): em chưa có lượt → MT1; MT kế ngoài cột → null; lượt huỷ không điểm → ô "đã huỷ", không "Xếp"', () => {
    const l = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
    assert(d.oXepMt([], 3) === 1, 'chưa có lượt → MT1');
    assert(d.oXepMt([l(1), l(2)], 3) === 3 && d.oXepMt([l(1), l(2), l(3)], 3) === null, 'MT kế trong / ngoài cột');
    assert(d.oXepMt([l(1), l(2, 'cancelled')], 3) === null, 'huỷ không điểm: số dùng lại nhưng ô là "đã huỷ"');
    assert(d.soCotMt(3, [1, 5]) === 5 && d.soCotMt(3, []) === 3 && d.soCotMt(3, [12]) === d.MT_TOI_DA, 'số cột');
    assert(d.tomTatLopFT({ dangThi: 1, chuaXep: [{ dot: 1, soEm: 1 }, { dot: 2, soEm: 0 }] }) === 'MT1 đang làm bài · MT1 chưa xếp 1 em', 'tóm tắt theo ô');
  });
}
