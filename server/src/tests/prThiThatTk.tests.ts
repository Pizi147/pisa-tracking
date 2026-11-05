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
    /* Chủ SP 05/11: OVR 6 = Target → không Fail; a (L 5.5) Đạt + dưới Target 0.67 · b (L 6.5) Exceed 1 → Đạt 40 %, Exceed 60 %, KN dưới Target 40 %. */
    assert(g.fail === 0 && g.exceed === 60 && g.dat === 40 && g.duoi === 40 && g.so.duoi === 1, `% trọng số: ${JSON.stringify(g)}`);
    assert(!r.gv.some((x: any) => x.ds.some((m: any) => m.cycleId === c.cycleId)), 'em tổng tuần 0 không vào gv');
  });

  check('THI-THAT · W thi thật vào W1 và W2; thi lại W → GV L không có mục; KCK không vào gv', () => {
    const a = kq({ w: 5, target: 6, thiLai: ['w'] }), k = kq({ kck: true });
    const day = new Map<number, unknown[]>([
      [a.cycleId, [{ userId: 1, kn: 'w1', tuan: 6 }, { userId: 2, kn: 'w2', tuan: 6 }, { userId: 3, kn: 'l', tuan: 6 }]],
      [k.cycleId, [{ userId: 3, kn: 'l', tuan: 6 }]],
    ]);
    const r = d.thongKeThiThat([a, k], day);
    assert(r.gv.some((x: any) => x.userId === 1 && x.kn === 'w1' && x.dat === 100 && x.duoi === 100), 'W1: OVR đạt → Đạt, W 5 → KN dưới Target');
    assert(r.gv.some((x: any) => x.userId === 2 && x.kn === 'w2'), 'W2 có mục');
    assert(!r.gv.some((x: any) => x.userId === 3), 'L lấy lại + KCK: GV L không có mục');
  });

  check('THI-THAT · Theo GV theo OVR (chủ SP 05/11): OVR đạt + kỹ năng dưới Target → Đạt + KN dưới; OVR trượt + kỹ năng trên Target → Fail', () => {
    assert(d.mucThiGv(6, 5.5, 6) === 'dat' && d.mucThiGv(6.5, 7, 6) === 'exceed' && d.mucThiGv(5.5, 7, 6) === 'fail', 'mucThiGv');
    const a = kq({ ovr: 6.5, r: 5.5, target: 6 }), b = kq({ ovr: 5.5, r: 7, target: 6 });
    const day = new Map<number, unknown[]>([[a.cycleId, [{ userId: 1, kn: 'r', tuan: 1 }]], [b.cycleId, [{ userId: 1, kn: 'r', tuan: 1 }]]]);
    const g = d.thongKeThiThat([a, b], day).gv[0];
    assert(g.so.dat === 1 && g.so.fail === 1 && g.so.exceed === 0 && g.so.duoi === 1 && g.duoi === 50, JSON.stringify(g));
  });

  check('THI-THAT · GV xếp Fail cao trước, trong GV theo L R W1 W2 S', () => {
    const a = kq({ ovr: 6.5, r: 7, s: 5, target: 6 }), b = kq({ ovr: 5.5, l: 5, target: 6 });
    const day = new Map<number, unknown[]>([[a.cycleId, [{ userId: 1, kn: 's', tuan: 1 }, { userId: 1, kn: 'r', tuan: 1 }]], [b.cycleId, [{ userId: 2, kn: 'l', tuan: 1 }]]]);
    const r = d.thongKeThiThat([a, b], day);
    assert(r.gv.map((x: any) => `${x.userId}${x.kn}`).join(',') === '2l,1r,1s', `thứ tự: ${r.gv.map((x: any) => `${x.userId}${x.kn}`)}`);
  });

  // ------------------------------------------------------------------ máy chủ: tuần dạy, quyền, số = dòng
  const { conn, P, TODAY, classId } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const tk: any = await import('../phanTich/thiThatThongKe.ts');
  const giaoVien: any = await import('../phanTich/giaoVien.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const vai = (k: string) => loadPrincipal(one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`, k).id);
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const LOP = classId('MB FT 101');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  /* Em MB FT 101: lộ trình 12 tuần (Thứ Hai s → thi thứ Tư tuần 12). W1: GV khác 4 tuần đầu, GV W1 (effective_to trống) 8 tuần sau → 8/12. */
  const dung = () => {
    const tuanNay = d.mondayOfDate(TODAY);
    const s = d.addDaysIso(tuanNay, -84), thi = d.addDaysIso(tuanNay, -5);
    const em = one(`SELECT e.student_id AS sid, c.id AS cy FROM enrollments e JOIN learning_cycles c ON c.student_id = e.student_id AND c.route IS NOT NULL
      WHERE e.class_id = ? AND e.ended_at IS NULL ORDER BY e.student_id LIMIT 1`, LOP);
    conn.prepare(`UPDATE learning_cycles SET started_at = ?, target_score = 6, thi_that_target = 6, khong_cam_ket = 0, thi_that_khong_thi = 0, thi_that_lay_lai = NULL,
      thi_that_ngay = ?, thi_that_l = 6.5, thi_that_r = 6, thi_that_w = 5.5, thi_that_s = 6, outcome = 'not_reached', outcome_score = 6 WHERE id = ?`).run(s, thi, em.cy);
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = NULL, thi_that_khong_thi = 0 WHERE student_id = ? AND id != ?`).run(em.sid, em.cy);
    conn.prepare(`UPDATE enrollments SET ended_at = ? WHERE student_id = ? AND class_id != ? AND (ended_at IS NULL OR ended_at >= ?)`).run(d.addDaysIso(s, -1), em.sid, LOP, s);
    conn.prepare(`UPDATE enrollments SET started_at = ? WHERE student_id = ? AND class_id = ? AND ended_at IS NULL`).run(s, em.sid, LOP);
    conn.prepare(`UPDATE teacher_assignments SET status = 'removed' WHERE class_id = ? AND skill IN ('writing1', 'writing')`).run(LOP);
    const them = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at) VALUES (?, ?, 'writing1', 0, ?, ?, ?, ?)`);
    them.run(P.lrTeacher.userId, LOP, s, d.addDaysIso(s, 27), 'ended', s);
    them.run(P.w1Teacher.userId, LOP, d.addDaysIso(s, 28), null, 'active', s);
    return { ...em, f: { branchId: MB, tu: d.addDaysIso(thi, -1), den: d.addDaysIso(thi, 1) } };
  };

  check('THI-THAT · tuần dạy: effective_to trống tính tới NGÀY THI (8/12), không tới hôm nay; GV cũ 4/12', () => thu(() => {
    const { cy, f } = dung();
    const r = tk.thiThatTab(P.mbManager, f);
    const w1 = r.thongKe.gv.filter((g: any) => g.kn === 'w1');
    const moi = w1.find((g: any) => g.userId === P.w1Teacher.userId), cu = w1.find((g: any) => g.userId === P.lrTeacher.userId);
    assert(moi && moi.tuan === 8 && moi.dat === 100 && moi.duoi === 100, `GV W1 8 tuần, OVR = Target → Đạt 100 %, W 5.5 → KN dưới Target 100 %: ${JSON.stringify(w1)}`);
    assert(cu && cu.tuan === 4, `GV cũ 4 tuần: ${JSON.stringify(cu)}`);
    const o = tk.oThiThat(P.mbManager, { ...f, o: `gv:${P.w1Teacher.userId}:w1:duoi` });
    const r0 = o.rows[0]?.thiThat;
    assert(o.n === 1 && r0.cycleId === cy && r0.tuan.day === 8 && r0.tuan.tong === 12 && r0.kn.w.kq === 'duoi' && r0.ovr.kq === 'bang', `panel P-GV 8/12: ${JSON.stringify(o.rows)}`);
    assert(o.kieu === 'thi-that' && o.knNhan === 'W1', 'kiểu thi-that, cột W1 tô nền');
  }));

  check('THI-THAT · quyền Theo GV: TVV không có khối + panel 403; CX và QL có', () => thu(() => {
    const { f } = dung();
    const tvv = vai('consultant'), cx = vai('cx');
    assert(tk.thiThatTab(tvv, { ...f, branchId: null }).thongKe.gv === null, 'TVV: gv null');
    let ma = 0;
    try { tk.oThiThat(tvv, { ...f, branchId: null, o: `gv:${P.w1Teacher.userId}:w1:hv` }); } catch (e: any) { ma = e.status ?? e.statusCode ?? 0; }
    assert(ma === 403, `TVV → 403 (được ${ma})`);
    assert(Array.isArray(tk.thiThatTab(cx, { ...f, branchId: null }).thongKe.gv), 'CX có Theo GV');
  }));

  check('THI-THAT · số = dòng: mọi ô Tổng · Từng kỹ năng · Theo GV', () => thu(() => {
    const { f } = dung();
    const r = tk.thiThatTab(P.mbManager, f);
    const n = (o: string) => tk.oThiThat(P.mbManager, { ...f, o }).n;
    const sai: string[] = [];
    const so = (o: string, mong: number) => { const x = n(o); if (x !== mong) sai.push(`${o}: ${x} ≠ ${mong}`); };
    so('tong:thi', r.thongKe.tong.thi); so('tong:khong-thi', r.thongKe.tong.khongThi);
    for (const m of ['exceed', 'dat', 'fail']) so(`tong:${m}`, r.thongKe.tong[m]);
    for (const k of ['l', 'r', 'w', 's']) for (const m of ['hv', 'exceed', 'dat', 'fail']) so(`kn:${k}:${m}`, r.thongKe.kyNang[k][m]);
    for (const g of r.thongKe.gv) {
      so(`gv:${g.userId}:${g.kn}:hv`, g.hv); so(`gv:${g.userId}:${g.kn}:duoi`, g.so.duoi);
      const c = ['exceed', 'dat', 'fail'].reduce((a, m) => a + n(`gv:${g.userId}:${g.kn}:${m}`), 0);
      if (c !== g.hv) sai.push(`gv ${g.userId} ${g.kn}: E+Đ+F ${c} ≠ ${g.hv}`);
    }
    assert(r.thongKe.tong.thi >= 1 && r.thongKe.gv.length >= 1, 'có dữ liệu');
    assert(!sai.length, sai.join(' · '));
  }));

  check('THI-THAT 2F · Phân tích GV = hồ sơ GV = tab Thi thật cho cùng GV (một hàm); % số to theo tuần dạy', () => thu(() => {
    const { f } = dung();
    const gv = P.w1Teacher.userId;
    const ky = { tu: d.mondayOfDate(f.tu), den: d.mondayOfDate(f.den) };
    const pt = giaoVien;
    const h = pt.phanTichGiaoVien(P.admin, { cn: MB, ct: 'ft', ...ky }).hang.find((x: any) => x.id === gv);
    const hs = pt.chiSoHoSoGv(P.admin, gv, ky);
    const tab = tk.thiThatTab(P.admin, { branchId: MB, tu: ky.tu, den: d.addDaysIso(ky.den, 6) }).thongKe.gv.filter((g: any) => g.userId === gv);
    const tong = tab.reduce((a: number, g: any) => a + g.hv, 0);
    assert(h?.thiThat?.k === 'so' && h.thiThat.tong === tong && hs.thiThat.tong === tong, `mục: PT GV ${JSON.stringify(h?.thiThat)} · hồ sơ ${JSON.stringify(hs.thiThat)} · tab ${tong}`);
    assert(JSON.stringify(h.thiThat) === JSON.stringify(hs.thiThat), 'Phân tích GV ≠ hồ sơ GV');
    const w1 = hs.thiThatTheoKyNang.find((x: any) => x.skill === 'writing1');
    const g = tab.find((x: any) => x.kn === 'w1');
    assert(w1 && g && w1.o.tong === g.hv && w1.o.pt === 100 - g.fail, `W1: hồ sơ ${JSON.stringify(w1)} · tab ${JSON.stringify(g)}`);
    /* GV cũ (dạy 4 tuần đầu, phân công đã kết thúc) vẫn có mục ở tab — "mọi GV từng dạy". */
    assert(tk.thiThatTab(P.admin, { branchId: MB, tu: ky.tu, den: d.addDaysIso(ky.den, 6) }).thongKe.gv.some((x: any) => x.userId === P.lrTeacher.userId && x.kn === 'w1'), 'GV cũ có mục');
  }));
}
