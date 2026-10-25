/**
 * PHÉP KIỂM P12 BAO-CAO-LICH-SU (chủ SP 24/10, đặc tả cải tiến 24/10 E6–E8 + Q12): đổi Target / lớp / lưu trữ về sau không làm sai báo cáo quá khứ.
 *  · MT so với Target lúc lượt (`target_at_attempt`), không Target hiện tại của lộ trình;
 *  · thi thật giữ Target lúc nhập (`thi_that_target`) + MỘT luật lớp lúc thi (`lopLucThiThat`) cho Phân tích GV và Kết quả thi;
 *  · Chấm điểm GV bỏ ô theo trạng thái em TẠI HẠN NHẬP;
 *  · Q12: bài S chấm chéo chưa ai nhận không tính quá hạn ở Tổng quan Admin.
 */
export async function runPrBaoCaoLichSuTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const lt: any = await import('../phanTich/lopLucThi.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const mg: any = await import('../migrate/prBaoCaoLichSu.ts');
  const tq: any = await import('../worklist/tongQuanMt.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const sd: any = await import('../worklist/scoreDebt.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nP12 BAO-CAO-LICH-SU — báo cáo quá khứ không đổi theo Target / lớp / trạng thái hiện tại');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const den = d.mondayOfDate(TODAY);
  const ky = { cn: MB, ct: 'ft', tu: d.addDaysIso(den, -7 * 26), den };
  const ptGv = () => { xoaNho(); return JSON.stringify(pt.phanTichGiaoVien(QL, ky)); };
  /* GV có hàng trong bảng kỳ này (các phép kiểm trước có thể đã xoá mềm tài khoản). */
  const gvCoBai = () => { xoaNho(); return pt.phanTichGiaoVien(QL, ky).hang[0].id as number; };
  const hsGv = (gv: number) => { xoaNho(); return JSON.stringify(pt.chiSoHoSoGv(P.admin, gv, { tu: ky.tu, den: ky.den })); };

  check('PBC-1 · đổi Target lộ trình sau lượt MT → Phân tích GV + hồ sơ GV kỳ đó không đổi (so Target lúc lượt)', () => {
    const coDiem = get(`SELECT COUNT(*) n FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN report_periods rp ON rp.id = a.planned_period_id
       WHERE c.branch_id = ? AND c.is_fast_track = 1 AND a.kind = 'mock' AND a.target_at_attempt IS NOT NULL AND rp.week_start BETWEEN ? AND ?
         AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)`, MB, ky.tu, ky.den).n;
    assert(coDiem > 0, 'seed có lượt MT FT có điểm trong kỳ');
    const gv = gvCoBai();
    const truoc = ptGv(), hs = hsGv(gv);
    thu(() => {
      /* Chỉ lộ trình chưa có thi thật — thi thật là PBC-3. */
      conn.prepare('UPDATE learning_cycles SET target_score = target_score + 1.5 WHERE target_score IS NOT NULL AND thi_that_ngay IS NULL').run();
      assert(ptGv() === truoc, 'Phân tích GV đổi theo Target hiện tại');
      assert(hsGv(gv) === hs, 'hồ sơ GV đổi theo Target hiện tại');
    });
  });

  check('PBC-2 · migrate thêm cột thi_that_target + điền Target cho lộ trình có KQ; chạy lần hai không làm gì', () => thu(() => {
    conn.exec('ALTER TABLE learning_cycles DROP COLUMN thi_that_target');
    const a1: string[] = [];
    mg.migratePrBaoCaoLichSu(conn, a1);
    assert(a1.length === 1, JSON.stringify(a1));
    const lech = get(`SELECT COUNT(*) n FROM learning_cycles WHERE route IS NOT NULL AND target_score IS NOT NULL
       AND (thi_that_khong_thi = 1 OR thi_that_l IS NOT NULL) AND thi_that_target IS NOT target_score`).n;
    const co = get(`SELECT COUNT(*) n FROM learning_cycles WHERE thi_that_target IS NOT NULL`).n;
    assert(lech === 0 && co > 0, `lệch ${lech}, có ${co}`);
    const a2: string[] = [];
    mg.migratePrBaoCaoLichSu(conn, a2);
    assert(a2.length === 0, JSON.stringify(a2));
  }));

  /* Lộ trình FT có thi thật đã kết luận (seed: UB / CP) + kỳ Phân tích GV ở chi nhánh lớp FT của em — gọi bằng Quản trị (mọi chi nhánh). */
  const thiCo = () => {
    const c = get(`SELECT cy.id, cy.student_id, cy.thi_that_ngay AS ngay, cy.thi_that_l AS l, cy.thi_that_r AS r, cy.thi_that_w AS w, cy.thi_that_s AS s,
         (SELECT k.branch_id FROM enrollments e JOIN classes k ON k.id = e.class_id WHERE e.student_id = cy.student_id AND k.is_fast_track = 1 ORDER BY e.id DESC LIMIT 1) AS cn
       FROM learning_cycles cy WHERE cy.thi_that_ngay IS NOT NULL AND cy.outcome IN ('reached', 'not_reached') AND cy.target_score IS NOT NULL AND COALESCE(cy.khong_cam_ket, 0) = 0
         AND cy.thi_that_l IS NOT NULL AND cy.thi_that_r IS NOT NULL AND cy.thi_that_w IS NOT NULL AND cy.thi_that_s IS NOT NULL
       ORDER BY cy.thi_that_ngay LIMIT 1`);
    assert(c?.cn, 'seed có thi thật đã kết luận của em lớp FT');
    const k = { cn: c.cn as number, ct: 'ft', tu: d.mondayOfDate(d.addDaysIso(c.ngay, -28)), den: d.mondayOfDate(d.addDaysIso(c.ngay, 28)) };
    const so = {
      kqThi: () => { xoaNho(); return JSON.stringify(kqt.ketQuaThiThatKq(P.admin, { branchId: k.cn, tu: k.tu, den: d.addDaysIso(k.den, 6) })); },
      kqMt: () => { xoaNho(); return JSON.stringify(bc.ketQuaMt(P.admin, { branchId: k.cn, ct: 'ft', tu: k.tu, den: k.den })); },
      ptGv: () => { xoaNho(); return JSON.stringify(pt.phanTichGiaoVien(P.admin, k)); },
    };
    return { c, k, so };
  };

  check('PBC-3 · nhập KQ thi thật ghi Target lúc đó; đổi Target sau → Kết quả thi, Báo cáo HV, Phân tích GV, hồ sơ GV không đổi', () => thu(() => {
    const { c, k, so } = thiCo();
    thiThat.datKetQuaThiThat(P.admin, c.id, { ngayThi: c.ngay, l: c.l, r: c.r, w: c.w, s: c.s });
    const cy = get('SELECT target_score, thi_that_target FROM learning_cycles WHERE id = ?', c.id);
    assert(cy.thi_that_target === cy.target_score, JSON.stringify(cy));
    xoaNho();
    const gv = pt.phanTichGiaoVien(P.admin, k).hang[0].id;
    const hs = () => { xoaNho(); return JSON.stringify(pt.chiSoHoSoGv(P.admin, gv, { tu: k.tu, den: k.den })); };
    const truoc = [so.kqThi(), so.kqMt(), so.ptGv(), hs()];
    conn.prepare('UPDATE learning_cycles SET target_score = target_score + 1.0 WHERE thi_that_ngay IS NOT NULL').run();
    const sau = [so.kqThi(), so.kqMt(), so.ptGv(), hs()];
    for (const [i, ten] of ['Kết quả thi', 'Báo cáo Kết quả MT', 'Phân tích GV', 'hồ sơ GV'].entries()) assert(sau[i] === truoc[i], `${ten} đổi theo Target hiện tại`);
  }));

  check('PBC-4 · em đổi lớp sau ngày thi thật → lopLucThiThat = lớp cũ; Kết quả thi và Phân tích GV cùng lớp đó', () => thu(() => {
    const { c, k } = thiCo();
    const cu = lt.lopLucThiThat([{ id: c.id, student_id: c.student_id, ngay: c.ngay }]).get(c.id);
    assert(cu, 'có lớp lúc thi');
    const moi = get(`SELECT id FROM classes WHERE is_fast_track = 1 AND id != ? ORDER BY id LIMIT 1`, cu)?.id as number;
    assert(moi, 'có lớp FT thứ hai');
    const sau = d.addDaysIso(c.ngay, 3);
    conn.prepare(`UPDATE enrollments SET ended_at = ?, status = 'transferred' WHERE student_id = ? AND class_id = ?`).run(`${sau}T00:00:00.000Z`, c.student_id, cu);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(c.student_id, moi, `${sau}T00:00:00.000Z`, `${sau}T00:00:00.000Z`);
    /* Chuyển lớp dời lượt MT chưa thi sang lớp mới — lượt cuối của lộ trình mang lớp mới. */
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE id = (SELECT MAX(id) FROM assessment_attempts WHERE cycle_id = ?)`).run(moi, c.id);
    assert(lt.lopLucThiThat([{ id: c.id, student_id: c.student_id, ngay: c.ngay }]).get(c.id) === cu, 'lớp lúc thi phải là lớp cũ');
    xoaNho();
    const dong = kqt.ketQuaThiThatKq(P.admin, { branchId: k.cn, tu: k.tu, den: d.addDaysIso(k.den, 6) }).rows.find((r: any) => r.cycleId === c.id);
    assert(dong?.classId === cu, `Kết quả thi: lớp ${dong?.classId} ≠ ${cu}`);
    const gv = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' ORDER BY id DESC LIMIT 1`, cu)?.user_id;
    assert(gv, 'lớp cũ có GV L');
    xoaNho();
    const ma = get('SELECT code FROM classes WHERE id = ?', cu).code;
    const p = pt.oChiSoGv(P.admin, { ...k, gv, cot: 'thi-that' });
    assert(p.rows.some((r: any) => r.lop === ma), `Phân tích GV: thi thật không ở lớp cũ ${ma}: ${JSON.stringify(p.rows.map((r: any) => r.lop))}`);
    /* Kết thúc lớp cũ TRƯỚC ngày thi, vào lớp mới SAU ngày thi, lộ trình không có MT → lớp cũ (ghi danh muộn nhất trước ngày thi). */
    const truoc = d.addDaysIso(c.ngay, -2);
    conn.prepare(`UPDATE enrollments SET ended_at = ? WHERE student_id = ? AND class_id = ?`).run(`${truoc}T00:00:00.000Z`, c.student_id, cu);
    const khongMt = { id: -1, student_id: c.student_id, ngay: c.ngay };   // id -1: lộ trình không có lượt MT
    assert(lt.lopLucThiThat([khongMt]).get(-1) === cu, `khoảng trống quanh ngày thi, không MT → lớp cũ ${cu}: ${lt.lopLucThiThat([khongMt]).get(-1)}`);
  }));

  check('PBC-5 · em lưu trữ hôm nay → Chấm điểm GV kỳ trước giữ nguyên; em thôi học TRƯỚC hạn vẫn bỏ', () => {
    /* Kỳ trước: hết 2 tuần trước hôm nay — mọi hạn nhập đã qua (ô hạn từ hôm nay trở đi thì em lưu trữ hôm nay đúng là không còn học). */
    const kyTruoc = { ...ky, den: d.addDaysIso(den, -14) };
    const cham = () => { xoaNho(); return JSON.stringify(pt.phanTichGiaoVien(QL, kyTruoc).hang.map((h: any) => [h.id, h.chamDiem])); };
    const truoc = cham();
    const lop = classId('MB FT 101');
    /* Lưu trữ SAU mọi hạn của kỳ (phép kiểm trước có thể đã dời hạn vài ô qua hôm nay — ô đó em lưu trữ hôm nay đúng là không tính). */
    const hanMax = get(`SELECT MAX(COALESCE(deadline_override, '')) AS h FROM assessment_attempts WHERE class_id = ?`, lop)?.h ?? '';
    const sauHan = [TODAY, d.addDaysIso(hanMax.slice(0, 10) || TODAY, 1)].sort().at(-1);
    thu(() => {
      conn.prepare(`UPDATE students SET status = 'finished', finished_at = ?, archived_at = ? WHERE status = 'active' AND id IN (SELECT student_id FROM enrollments WHERE class_id = ?)`).run(sauHan, sauHan, lop);
      assert(cham() === truoc, 'lưu trữ hôm nay làm đổi Chấm điểm kỳ trước');
      conn.prepare(`UPDATE students SET finished_at = ?, archived_at = ? WHERE finished_at = ? AND id IN (SELECT student_id FROM enrollments WHERE class_id = ?)`).run(kyTruoc.tu, kyTruoc.tu, sauHan, lop);
      assert(cham() !== truoc, 'em thôi học trước hạn vẫn phải bỏ khỏi Chấm điểm');
    });
  });

  check('PBC-6 · Q12: Tổng quan Admin — S chấm chéo chưa ai nhận không quá hạn; Σ dòng quá hạn = ô; dòng "Chưa có GV" chờ chấm', () => {
    const id = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND b.code = 'MB' ORDER BY ur.user_id LIMIT 1`)?.id;
    const ad = loadPrincipal(id);
    xoaNho();
    const w = myWork(ad, { nguoi: 'tat-ca' }) as any;
    /* seed: 12 bài S chấm chéo quá hạn nhập (MB FT 101 / 105) đều chưa ghi GV chấm → không còn quá hạn ở Công việc lẫn nợ điểm. */
    const cc = w.items.filter((it: any) => it.group === 'score' && d.laChamCheo(it.kind, it.kn) && it.ownerId === null);
    assert(cc.length > 0 && cc.every((it: any) => it.urgency !== 'overdue'), `S chấm chéo còn quá hạn: ${cc.filter((it: any) => it.urgency === 'overdue').map((it: any) => it.key)}`);
    const r = tq.tongQuanMt(ad);
    const quaHan = r.gvQuaHan.filter((g: any) => !g.choCham);
    assert(quaHan.reduce((n: number, g: any) => n + g.soBai, 0) === r.oChuaNhap.quaHan, `Σ ${JSON.stringify(quaHan)} ≠ ${r.oChuaNhap.quaHan}`);
    const cho = r.gvQuaHan.filter((g: any) => g.choCham);
    assert(cho.length === 1 && cho[0].ownerId === 0 && cho[0].soBai === cc.reduce((n: number, it: any) => n + it.soBai, 0) && cho[0].han === null && cho[0] === r.gvQuaHan.at(-1),
      `dòng chờ chấm: ${JSON.stringify(cho)}`);
  });

  check('PBC-7 · Q12 chỉ Admin: QL vẫn thấy S chấm chéo quá hạn (LT3); Admin — ô S đã ghi GV chấm (đã có người nhận) mà quá hạn → quá hạn', () => thu(() => {
    const id = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND b.code = 'MB' ORDER BY ur.user_id LIMIT 1`)?.id;
    const ad = loadPrincipal(id);
    const ccQuaHan = (p: any) => { xoaNho(); return ((myWork(p, { nguoi: 'tat-ca' }) as any).items as any[])
      .filter((it) => it.group === 'score' && it.ownerId === null && d.laChamCheo(it.kind, it.kn) && it.urgency === 'overdue'); };
    assert(ccQuaHan(QL).length > 0, 'QL: S chấm chéo quá hạn vẫn quá hạn (LT3)');
    assert(ccQuaHan(ad).length === 0, 'Admin: S chấm chéo chưa ai nhận không quá hạn');
    const x = sd.scoreDebtCells(P.admin, TODAY, [MB]).find((c: any) => c.chamCheo && c.overdue);
    assert(x, 'seed có S chấm chéo quá hạn');
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, examiner_name) VALUES (?, 'speaking', 'GV ngoài')`).run(x.attemptId);
    assert(ccQuaHan(ad).length > 0, `Admin: đã có người nhận phải quá hạn`);
  }));
}
