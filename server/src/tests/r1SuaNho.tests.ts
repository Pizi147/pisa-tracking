/**
 * PHÉP KIỂM R1-SUA-NHO (kế hoạch docs/superpowers/plans/2026-10-26-r1-sua-nho.md): trục tuần Hành trình (TRUC-1…5),
 * đường hồ sơ lượt lớp thường không vòng về chính nó (VONG-1). Hàm thuần, không đụng database.
 */
export async function runR1SuaNhoTests({ check, assert }: { check: (ten: string, fn: () => void) => void; assert: (c: unknown, m: string) => void }) {
  const d: any = await import('../../../shared/domain/index.ts');
  const tuanSau = (iso: string, n: number) => new Date(Date.parse(iso) + n * 7 * 86_400_000).toISOString().slice(0, 10);
  const NAY = '2026-10-26';

  check('R1-SUA-NHO · TRUC-1: 0 điểm → 2 cột (tuần này + tuần sau)', () => {
    const r = d.dungTrucTuan([], NAY);
    assert(JSON.stringify(r.tuan) === JSON.stringify([NAY, '2026-11-02']), `trục ${JSON.stringify(r.tuan)}`);
    assert(!r.coTruoc && !r.coSau, 'không có nút lùi / tiến');
  });
  check('R1-SUA-NHO · TRUC-2: 1 điểm 3 tuần trước → trục từ điểm tới tuần này', () => {
    const r = d.dungTrucTuan([tuanSau(NAY, -3)], NAY);
    assert(r.tuan.length === 4 && r.tuan[0] === tuanSau(NAY, -3) && r.tuan.at(-1) === NAY, `trục ${JSON.stringify(r.tuan)}`);
  });
  check('R1-SUA-NHO · TRUC-3: 2 điểm cùng tuần (tuần này) → không vỡ trục, điểm ở một cột', () => {
    const r = d.dungTrucTuan([NAY, NAY], NAY);
    assert(r.tuan.length === 2 && d.viTriTuan(r.tuan, NAY) === 0, `trục ${JSON.stringify(r.tuan)}`);
  });
  check('R1-SUA-NHO · TRUC-4: 300 tuần → 80 tuần gần nhất + "Xem trước đó"; lùi 3 khung → khung đầu', () => {
    const dau = tuanSau(NAY, -299);
    const cac = Array.from({ length: 300 }, (_, i) => tuanSau(dau, i));
    const r0 = d.dungTrucTuan(cac, NAY);
    assert(r0.tuan.length === d.TUAN_MOT_KHUNG && r0.tuan[0] === tuanSau(NAY, -79) && r0.tuan.at(-1) === NAY, `khung gần nhất ${r0.tuan[0]}…${r0.tuan.at(-1)}`);
    assert(r0.coTruoc && !r0.coSau, 'khung gần nhất: có trước, không có sau');
    const r3 = d.dungTrucTuan(cac, NAY, 3);
    assert(r3.tuan[0] === dau && r3.tuan.length === 60 && !r3.coTruoc && r3.coSau, `khung đầu ${r3.tuan[0]} dài ${r3.tuan.length}`);
    const r9 = d.dungTrucTuan(cac, NAY, 9);
    assert(r9.tuan[0] === dau && !r9.coTruoc, 'lùi quá → kẹp ở khung đầu');
    const r260 = d.dungTrucTuan(cac.slice(-260), NAY);
    assert(r260.tuan.length === d.TRAN_TUAN_TRUC && !r260.coTruoc, 'đúng trần 260 tuần → hiện hết');
  });
  check('R1-SUA-NHO · TRUC-5: tuần ngoài khung đang xem → null (không vẽ, không kẹp về cột đầu)', () => {
    const dau = tuanSau(NAY, -299);
    const r0 = d.dungTrucTuan(Array.from({ length: 300 }, (_, i) => tuanSau(dau, i)), NAY);
    assert(d.viTriTuan(r0.tuan, dau) === null, 'S Ex ở tuần đầu, khung gần nhất → null');
    assert(d.viTriTuan(r0.tuan, NAY) === 79, 'tuần này ở cột cuối');
  });
  check('R1-SUA-NHO · VONG-1: lượt lớp thường classId null → không trả /mock-test/:id', () => {
    const p = d.duongDotTest({ id: 7, kind: 'progress', classId: null, studentId: 12 });
    assert(p !== '/mock-test/7', `vòng về chính nó: ${p}`);
    assert(p === '/hoc-vien/12', `về hồ sơ HV: ${p}`);
    assert(d.duongDotTest({ id: 7, kind: 'mock', classId: null }) === '/mock-test/7', 'Mock FT giữ trang riêng');
  });
}
