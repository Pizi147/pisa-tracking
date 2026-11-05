/**
 * PR-4 THI-THAT (chủ SP 05/11, đặc tả 2C · 2E · 2F) — thống kê thi thật một hàm (`thongKeThiThat`) cho tab Thi thật, Phân tích GV, hồ sơ GV:
 * Exceed / Đạt / Fail (> · = · < Target overall), KCK không vào %, "Không thi" riêng, thi lại một kỹ năng chỉ đếm kỹ năng thi lần này,
 * Theo GV mọi người từng dạy có trọng số tuần, W chia W1 / W2.
 */
export async function runPrThiThatTkTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-4 THI-THAT · thống kê thi thật một hàm');

  let id = 0;
  const kq = (o: Record<string, unknown> = {}) => {
    const i = ++id;
    return { studentId: i, cycleId: i, classIdCuoi: 1, ngay: '2026-10-17', l: 6, r: 6, w: 6, s: 6, ovr: 6, target: 6, kck: false, khongThi: false, thiLai: null, ...o };
  };

  check('THI-THAT · mucThi: > exceed · = đạt · < fail', () => {
    assert(d.mucThi(6.5, 6.0) === 'exceed', 'exceed');
    assert(d.mucThi(6.0, 6.0) === 'dat', 'đạt');
    assert(d.mucThi(5.5, 6.0) === 'fail', 'fail');
  });

  check('THI-THAT · Tổng: KCK không vào %, Không thi đếm riêng, Target trống không vào %', () => {
    const ds = [kq({ ovr: 6.5 }), kq({ ovr: 6 }), kq({ ovr: 5.5 }), kq({ ovr: 5, kck: true }), kq({ khongThi: true, ovr: null, l: null, r: null, w: null, s: null }), kq({ target: null })];
    const r = d.thongKeThiThat(ds, new Map());
    assert(r.tong.thi === 5 && r.tong.khongThi === 1 && r.tong.kck === 1, `thi 5 · không thi 1 · KCK 1: ${JSON.stringify(r.tong)}`);
    assert(r.tong.exceed === 1 && r.tong.dat === 1 && r.tong.fail === 1, `1 · 1 · 1: ${JSON.stringify(r.tong)}`);
  });

  check('THI-THAT · Từng kỹ năng so Target overall + TB; thi lại W → L R S không tăng', () => {
    const ds = [kq({ l: 7, r: 6, w: 5, s: 6, target: 6 }), kq({ l: 5, r: 6, w: 6.5, s: 6, target: 6, thiLai: ['w'] })];
    const r = d.thongKeThiThat(ds, new Map());
    assert(r.kyNang.l.hv === 1 && r.kyNang.l.exceed === 1, `L chỉ em thi đủ: ${JSON.stringify(r.kyNang.l)}`);
    assert(r.kyNang.w.hv === 2 && r.kyNang.w.fail === 1 && r.kyNang.w.exceed === 1 && r.kyNang.w.tb === 5.8, `W 2 em, TB 5.75 → 5.8: ${JSON.stringify(r.kyNang.w)}`);
  });

  check('THI-THAT · Theo GV: 8/12 tuần → trọng số 0.67; % theo trọng số; tổng tuần 0 không lỗi', () => {
    const a = kq({ l: 5.5, target: 6 }), b = kq({ l: 6.5, target: 6 }), c = kq({ l: 6, target: 6 });
    const day = new Map<number, unknown[]>([
      [a.cycleId, [{ userId: 10, kn: 'l', tuan: 8 }, { userId: 11, kn: 'l', tuan: 4 }]],
      [b.cycleId, [{ userId: 10, kn: 'l', tuan: 4 }]],
      [c.cycleId, [{ userId: 10, kn: 'l', tuan: 0 }]],
    ]);
    const r = d.thongKeThiThat([a, b, c], day);
    const g = r.gv.find((x: any) => x.userId === 10 && x.kn === 'l');
    assert(g && g.hv === 2 && g.tuan === 12, `GV 10 · L: 2 em (em tổng 0 không vào), 12 tuần: ${JSON.stringify(g)}`);
    const m = g.ds.find((x: any) => x.cycleId === a.cycleId);
    assert(Math.abs(m.w - 0.67) < 0.01 && m.tuan === 8 && m.tongTuan === 12, `trọng số 8/12: ${JSON.stringify(m)}`);
    /* fail 0.67 · exceed 1 → fail 40 %, exceed 60 % */
    assert(g.fail === 40 && g.exceed === 60 && g.dat === 0, `% trọng số: ${JSON.stringify(g)}`);
    assert(!r.gv.some((x: any) => x.ds.some((m: any) => m.cycleId === c.cycleId)), 'em tổng tuần 0 không vào gv');
  });

  check('THI-THAT · W thi thật vào W1 và W2; thi lại W → GV L không có mục; KCK không vào gv', () => {
    const a = kq({ w: 5, target: 6, thiLai: ['w'] }), k = kq({ kck: true });
    const day = new Map<number, unknown[]>([
      [a.cycleId, [{ userId: 1, kn: 'w1', tuan: 6 }, { userId: 2, kn: 'w2', tuan: 6 }, { userId: 3, kn: 'l', tuan: 6 }]],
      [k.cycleId, [{ userId: 3, kn: 'l', tuan: 6 }]],
    ]);
    const r = d.thongKeThiThat([a, k], day);
    assert(r.gv.some((x: any) => x.userId === 1 && x.kn === 'w1' && x.fail === 100), 'W1 có mục fail');
    assert(r.gv.some((x: any) => x.userId === 2 && x.kn === 'w2'), 'W2 có mục');
    assert(!r.gv.some((x: any) => x.userId === 3), 'L lấy lại + KCK: GV L không có mục');
  });

  check('THI-THAT · GV xếp Fail cao trước, trong GV theo L R W1 W2 S', () => {
    const a = kq({ l: 5, r: 7, s: 5, target: 6 });
    const day = new Map<number, unknown[]>([[a.cycleId, [{ userId: 1, kn: 's', tuan: 1 }, { userId: 1, kn: 'r', tuan: 1 }, { userId: 2, kn: 'l', tuan: 1 }]]]);
    const r = d.thongKeThiThat([a], day);
    assert(r.gv.map((x: any) => `${x.userId}${x.kn}`).join(',') === '2l,1r,1s', `thứ tự: ${r.gv.map((x: any) => `${x.userId}${x.kn}`)}`);
  });
}
