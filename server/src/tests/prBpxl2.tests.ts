/**
 * PHÉP KIỂM BPXL-2 (N57, N38 — mockup `thiet-ke/v22/bpxl-trang-dau.html`): trang đầu BPXL.
 *  B2-1 "Vắng · n em" (`danhSachLop`) = số hàng lưới có cờ `vangTuan` (`luoiFT`) — một luật, báo vắng thì tăng
 *  · B2-2 tin chuông "n em vắng" GỘP lớp × tuần cho BPXL chi nhánh lớp (+ toàn hệ thống), không cho GV, không là việc; chi nhánh không BPXL → không tin
 *  · B2-3 Bỏ vắng: tin bớt em lặng lẽ, hết em → xoá · B2-4 dải BPXL `GET /tong-quan/mock-test`: "Bài chưa có điểm" = Σ theo lớp = tập nợ điểm FT
 *  · B2-5 chữ ô MT: "L R vắng · dời W4 SEP" / "Đã huỷ · vắng 2 lần", không chữ "xếp lại".
 */
export async function runPrBpxl2Tests(t: any) {
  const { check, assert, conn, P, classId } = t;
  if (!conn) return;
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const { tongQuanMt } = await import('../worklist/tongQuanMt.ts');
  const { overdueScoreBai } = await import('../worklist/metrics.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nBPXL-2 · trang đầu BPXL: dải số lặng, "Vắng · n em", tin chuông vắng gộp lớp × tuần');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const today = demoToday();
  const tuan = mondayOf(today);
  const lop = classId('MB FT 101');
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const QL = P.mbManager;
  /** Kỹ năng bắt buộc của lượt Mock lớp MB FT 101 còn chờ thi trong tuần này — mỗi em một dòng. */
  const choThi = () => all(
    `SELECT a.id, a.student_id, k.skill FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
       JOIN report_periods rp ON rp.id = k.planned_period_id
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status = 'planned' AND a.lich_su = 0 AND k.required = 1 AND k.sit_status = 'scheduled'
        AND rp.week_start = ? AND k.skill IN ('listening', 'reading')
      GROUP BY a.student_id ORDER BY a.id`, lop, tuan);
  let seq = 0;
  const taoBpxl = (branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `bpxl2.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-bpxl2', fullName: `Thử BPXL2 ${seq}`,
      roles: [{ role: 'scheduler', branches }] }).userId as number;
  };
  const soVang = () => { xoaNho(); return (kh.danhSachLop(QL, { branchId: MB }).lop as any[]).find((l) => l.id === lop).vangTuanNay as number; };
  const tin = (uid: number) => all(`SELECT * FROM notifications WHERE user_id = ? AND kind = 'vang_lop'`, uid);

  check('B2-1 · "Vắng · n em" = số hàng lưới có cờ vắng (một luật); báo vắng một em → +1, cờ đúng em', () => thu(() => {
    const em = choThi();
    assert(em.length >= 2, `cần ≥ 2 em còn thi tuần này ở MB FT 101 (có ${em.length})`);
    const truoc = soVang();
    const luoi = () => { xoaNho(); return kh.luoiFT(QL, lop, today).hang as any[]; };
    assert(luoi().filter((h) => h.vangTuan).length === truoc, `cờ lưới ${luoi().filter((h) => h.vangTuan).length} ≠ số ${truoc}`);
    absence.baoVang(QL, em[0].id, em[0].skill, null, today);
    assert(soVang() === truoc + 1, `vắng ${truoc} → ${soVang()} (phép kiểm không nhạy)`);
    const h = luoi();
    assert(h.find((x) => x.studentId === em[0].student_id)?.vangTuan === true, 'em vừa vắng phải có cờ vangTuan');
    assert(h.filter((x) => x.vangTuan).length === truoc + 1, `cờ lưới ${h.filter((x) => x.vangTuan).length} ≠ ${truoc + 1}`);
  }));

  check('B2-2 · tin "n em vắng" gộp lớp × tuần: BPXL MB + toàn hệ thống nhận MỘT tin, cập nhật số em, hiện lại là mới; BPXL chi nhánh khác / GV không; không là việc', () => thu(() => {
    const mb = taoBpxl(['MB']); const tat = taoBpxl([]); const cp = taoBpxl(['CP']);
    const em = choThi();
    absence.baoVang(QL, em[0].id, em[0].skill, null, today);
    const t1 = tin(mb);
    assert(t1.length === 1 && t1[0].dedup_key === `vang_lop:${lop}:${tuan}` && /^1 em vắng · MB FT 101 · /.test(t1[0].title), JSON.stringify(t1));
    conn.prepare('UPDATE notifications SET read_at = ? WHERE id = ?').run(today, t1[0].id);
    absence.baoVang(QL, em[1].id, em[1].skill, null, today);
    const t2 = tin(mb);
    assert(t2.length === 1 && /^2 em vắng/.test(t2[0].title) && t2[0].read_at === null, `gộp: ${JSON.stringify(t2.map((x: any) => [x.title, x.read_at]))}`);
    const body = JSON.parse(t2[0].body);
    assert(body.soEm === 2 && body.em.length === 2 && body.em.every((e: any) => !e.huy && e.tuanMoi > tuan), t2[0].body);
    assert(tin(tat).length === 1 && tin(cp).length === 0, `toàn hệ thống ${tin(tat).length} · CP ${tin(cp).length}`);
    assert(one(`SELECT COUNT(*) n FROM notifications n WHERE n.kind = 'vang_lop' AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = n.user_id AND r.key = 'scheduler' AND ur.status = 'active')`).n === 0, 'chỉ BPXL nhận tin vắng');
    assert(!d.laTinViec(t2[0]) && !d.laViecTuTin({ ...t2[0], con_viec: 1 }), 'tin vắng không vào Việc cần làm');
    assert(!/xếp lại/i.test(t2[0].title + t2[0].body), 'không chữ "xếp lại"');
  }));

  check('B2-2b · chi nhánh không có BPXL → không ghi tin (dừng sau câu đọc người giữ vai)', () => thu(() => {
    conn.prepare(`UPDATE user_roles SET status = 'inactive' WHERE role_id = (SELECT id FROM roles WHERE key = 'scheduler')`).run();
    const em = choThi();
    absence.baoVang(QL, em[0].id, em[0].skill, null, today);
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE kind = 'vang_lop'`).n === 0, 'không BPXL thì không tin');
  }));

  check('B2-3 · Bỏ vắng: tin bớt em, không hiện lại là mới; hết em → xoá tin; số "Vắng · n em" giảm theo', () => thu(() => {
    const mb = taoBpxl(['MB']);
    const em = choThi();
    const truoc = soVang();
    absence.baoVang(QL, em[0].id, em[0].skill, null, today);
    absence.baoVang(QL, em[1].id, em[1].skill, null, today);
    conn.prepare(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND kind = 'vang_lop'`).run(today, mb);
    const go = (e: any) => { const sk = e.skill as string; absence.goVangDaChot(QL, e.id, sk, absence.dauDaChot(e.id, sk), today); };
    go(em[1]);
    const t1 = tin(mb);
    assert(t1.length === 1 && /^1 em vắng/.test(t1[0].title) && t1[0].read_at !== null, `bớt em: ${JSON.stringify(t1.map((x: any) => [x.title, x.read_at]))}`);
    assert(soVang() === truoc + 1, `số ${soVang()} ≠ ${truoc + 1}`);
    go(em[0]);
    assert(tin(mb).length === 0, 'hết em → xoá tin');
    assert(soVang() === truoc, `số ${soVang()} ≠ ${truoc}`);
  }));

  check('B2-4 · dải BPXL: "Bài chưa có điểm" = Σ theo lớp = tập nợ điểm FT (overdueScoreBai cả chưa quá hạn); không đọc danhSachLop lần hai', () => thu(() => {
    const p = loadPrincipal(taoBpxl(['MB']));
    xoaNho();
    const tq = tongQuanMt(p, { branchId: MB });
    const bai = tq.lopCo!.bai;
    const tong = Object.values(bai).reduce((n, x) => n + x, 0);
    assert(tq.chuaXepLich === null && tq.oChuaNhap.so === tong && tong > 0, `${tq.oChuaNhap.so} ≠ Σ ${tong} · chuaXepLich ${tq.chuaXepLich}`);
    const ft = new Set((kh.danhSachLop(p, { branchId: MB }).lop as any[]).filter((l) => l.loai === 'ft').map((l) => l.id));
    assert(Object.keys(bai).every((id) => ft.has(Number(id))), `lớp ngoài FT: ${Object.keys(bai).join()}`);
    const r = overdueScoreBai(QL, MB, today, [...ft] as number[], true);
    assert(r.ids.length === tong, `nợ điểm FT (Head) ${r.ids.length} ≠ BPXL ${tong}`);
    assert(tq.lopCo!.luot.every((id) => ft.has(id)) && tq.luotTuanNay.so >= 0, JSON.stringify(tq.lopCo!.luot));
  }));

  check('B2-5 · ô MT (oGon): "L R vắng · dời W4 SEP" ở tuần vắng · "Vắng · dời …" cả đợt · "Đã huỷ · vắng 2 lần"; không chữ "xếp lại"', () => {
    const ho = '2026-09-14';
    const o = (x: any) => ({ trangThai: 'da-xep', tuan: '2026-09-14', batBuoc: true, khoa: null, sit: 'scheduled', ...x });
    const doi = { trangThai: 'da-doi', tuan: '2026-09-21', doiTu: '2026-09-14', sit: 'scheduled' };
    const g = d.oGon({ listening: o(doi), reading: o(doi), writing: o({}), speaking: o({}) }, ho);
    assert(g.vang === 'L R vắng · dời W4 SEP' && g.dong.length === 1 && g.dong[0].tuan === 'W3 SEP' && g.dong[0].mon.length === 4, JSON.stringify(g));
    const ca = d.oGon({ listening: o(doi), reading: o(doi), writing: o(doi), speaking: o(doi) }, ho);
    assert(ca.vang === 'Vắng · dời W4 SEP', String(ca.vang));
    const huy = { trangThai: 'da-huy', huyVang: true, sit: 'cancelled' };
    const h = d.oGon({ listening: o(huy), reading: o(huy), writing: o(huy), speaking: o(huy) }, ho);
    assert(h.vang === 'Đã huỷ · vắng 2 lần' && h.huyHet && h.xong, JSON.stringify(h));
    const cu = d.oGon({ listening: o({ trangThai: 'vang', sit: 'absent' }), reading: o({}) }, ho);
    assert(cu.tt?.chu === 'L vắng' && cu.tt.loai === 'vang', JSON.stringify(cu.tt));
    assert(![g, ca, h, cu].some((x) => /xếp lại/i.test(JSON.stringify(x))), 'không chữ "xếp lại"');
    assert(d.tomTatLopFT({ dangThi: null, chuaXep: null, canXepLai: 2 }) === '2 em vắng', 'tóm tắt lớp không "cần xếp lại"');
  });
}
