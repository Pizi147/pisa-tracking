/**
 * PHÉP KIỂM CV-TAB (chủ SP 06/11, mockup `thiet-ke/v17-nhap/`): Công việc chia tab hạng mục — mỗi dòng việc vào đúng MỘT tab và MỘT mục,
 * badge = trạng thái gấp nhất (đỏ quá hạn · vàng gần hạn · trắng tổng), tổng dòng các tab = số dòng đầu trang, tab mặc định = tab đầu có quá hạn.
 * Chỉ hàm thuần đọc dữ liệu `/my-work` đã trả — không thêm câu đọc.
 */
export async function runPrCvTabTests(t: { check: any; assert: any; P: any; TODAY: string }) {
  const { check, assert, P, TODAY } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { db } = await import('../db.ts');
  const { bangLop, loadPrincipal } = await import('../permissions.ts');
  console.log('\nCV-TAB · Công việc chia tab hạng mục');

  /* AUDIT-UI B3 + B4 (chủ SP 08/11): badge = dòng cần làm ngay (quá hạn + hôm nay), 0 → không badge; không còn mục "Quá hạn" riêng — quá hạn lên đầu mục loại việc. */
  check('CVT-1 · hàm thuần: badge = quá hạn + hôm nay; mục theo loại, quá hạn đầu mục, mục rỗng ẩn; tab mặc định = tab đầu có quá hạn', () => {
    const v = (key: string, group: string, urgency: string, due: string | null, kind?: string) => ({ key, group, urgency, due, kind, studentId: 1 });
    const homNay = '2026-11-06';
    const ds = [v('a', 'cause', 'overdue', '2026-11-01'), v('b', 'no_plan', 'normal', '2026-11-08'), v('c', 'ghi_ket_qua_pa', 'today', homNay),
      v('d', 'no_plan', 'overdue', '2026-11-03')];
    const b = d.badgeTab(ds);
    assert(b.so === 3 && b.n === 4 && b.quaHan === 2 && b.homNay === 1, JSON.stringify(b));
    assert(d.badgeTab([ds[2]]).so === 1 && d.badgeTab([ds[2]]).quaHan === 0, 'chỉ hôm nay → badge vàng 1');
    assert(d.badgeTab([ds[1]]).so === 0, 'không việc gấp → không badge');
    void homNay;
    const muc = d.chiaMucTab(ds);
    assert(muc.map((m: any) => m.key).join('|') === 'mo-ta|pa|kq-pa' && muc[1].label === 'Phương án', muc.map((m: any) => m.key).join('|'));
    assert(muc[1].items.map((x: any) => x.key).join('') === 'db' && muc[1].quaHan === 1 && muc[0].quaHan === 1, 'quá hạn lên đầu mục, đếm quá hạn mỗi mục');
    const sc = d.chiaMucTab([v('s1', 'score', 'normal', '2026-11-20', 'mock'), v('s2', 'score', 'normal', '2026-11-20', 'final'), v('s3', 'score', 'normal', '2026-11-20', 'checkpoint')]);
    assert(sc.map((m: any) => m.label).join('|') === 'Mock Test|Progress / Final Test|Checkpoint', 'mục Chấm điểm theo loại bài');
    assert(d.tabMacDinh([{ key: 'x', badge: null }, { key: 'y', badge: { quaHan: 2 } }]) === 'y' && d.tabMacDinh([{ key: 'x', badge: null }]) === 'x', 'tab mặc định');
    /* AUDIT-1611 A2-11: nhiều quá hạn nhất thắng; bằng nhau → tab đứng trước. */
    assert(d.tabMacDinh([{ key: 'duyet', badge: { quaHan: 1 } }, { key: 'cham', badge: { quaHan: 0 } }, { key: 'van-hanh', badge: { quaHan: 6 } }]) === 'van-hanh'
      && d.tabMacDinh([{ key: 'a', badge: { quaHan: 2 } }, { key: 'b', badge: { quaHan: 2 } }]) === 'a', 'tab nhiều quá hạn nhất');
    assert(d.tabCuaViec({ group: 'score', key: d.KHOA_CHAM_SPEAKING }) === 'cham-cheo' && d.tabCuaViec({ group: 'ban_giao', key: 'k' }) === 'van-hanh', 'tab chấm chéo / bàn giao');
  });

  check('CVT-2 · /my-work thật (GV, QL Tất cả, TVV): mỗi dòng một tab có trong thứ tự cố định + một mục ≠ "Khác"; tổng dòng tab (trừ chấm chéo) = demDongViec', () => {
    const vai: [string, any, any, boolean][] = [['GVCN', P.coreTeacher, {}, false], ['QL', P.mbManager, { nguoi: 'tat-ca' }, false]];
    if (P.tvv) vai.push(['TVV', P.tvv, {}, true]);
    for (const [ten, p, q, tvv] of vai) {
      xoaNho();
      const w = mywork.myWork(p, q);
      const thuTu: readonly string[] = tvv ? d.NHOM_CV_TVV : d.TAB_CV;
      let tong = 0;
      for (const k of thuTu) {
        const dong = d.dongTab((w.dong as any[]).filter((x) => d.tabCuaViec(x, tvv) === k));
        for (const x of dong) assert(d.mucCuaViec(x, tvv) !== 'khac', `${ten}: ${x.group} ${x.key} rơi vào "Khác"`);
        const muc = d.chiaMucTab(dong, tvv);
        assert(muc.reduce((n: number, m: any) => n + m.items.length, 0) === dong.length, `${ten} ${k}: mục mất dòng`);
        if (k !== 'cham-cheo') tong += d.badgeTab(dong).n;
      }
      for (const x of w.dong as any[]) assert(thuTu.includes(d.tabCuaViec(x, tvv)), `${ten}: ${x.group} không có tab`);
      assert(tong === d.demDongViec(w.dong).n, `${ten}: tổng tab ${tong} ≠ demDongViec ${d.demDongViec(w.dong).n}`);
    }
  });

  /* CV-TAB b (chủ SP 06/11): GV dạy liên chi nhánh — mỗi dòng mang chi nhánh của lớp; QL một chi nhánh chỉ thấy việc ở chi nhánh mình + tên chi nhánh bị ẩn. */
  check('CVT-3 · GV hai chi nhánh: dòng có `cn` = chi nhánh lớp, `chiNhanh` liệt kê đủ; QL Cẩm Phả xem GV CP + HD: chỉ việc CP, `cnAn` = chi nhánh GV còn dạy', () => {
    const gvHai = (db().prepare(`SELECT ta.user_id AS id, GROUP_CONCAT(DISTINCT cl.branch_id) AS cn FROM teacher_assignments ta JOIN classes cl ON cl.id = ta.class_id
      WHERE ta.status = 'active' GROUP BY ta.user_id HAVING COUNT(DISTINCT cl.branch_id) > 1`).all() as any[]);
    assert(gvHai.length > 0, 'seed không có GV hai chi nhánh');
    let coHai = 0;
    for (const g of gvHai) {
      xoaNho();
      const w = mywork.myWork(loadPrincipal(g.id), {});
      for (const x of w.items as any[]) if (x.classId) assert(x.cn === bangLop().get(x.classId)?.branchId, `GV ${g.id}: ${x.key} cn ${x.cn}`);
      const cns = new Set((w.items as any[]).map((x) => x.cn).filter((x) => x != null));
      assert(cns.size > 1 ? w.chiNhanh?.length === cns.size : w.chiNhanh === undefined, `GV ${g.id}: chiNhanh ${JSON.stringify(w.chiNhanh)}`);
      if (cns.size > 1) coHai++;
    }
    const cp = P.cpManager.grants.find((x: any) => x.roleKey === 'manager')?.branchId;
    const gvCp = gvHai.find((g) => String(g.cn).split(',').map(Number).includes(cp));
    if (!gvCp) return;
    /* Chi nhánh GV dạy (phân công đang hiệu lực) ngoài Cẩm Phả = dòng "… dạy cả {CN}" — kể cả khi QL lọc chi nhánh (myWork đã bỏ việc CN khác). */
    const khac = new Set(loadPrincipal(gvCp.id).assignments.filter((a: any) => a.effectiveFrom <= TODAY && (!a.effectiveTo || a.effectiveTo >= TODAY))
      .map((a: any) => bangLop().get(a.classId)?.branchId).filter((x: any) => x != null && x !== cp));
    xoaNho();
    const xem = mywork.viecCuaNguoi(P.cpManager, gvCp.id, cp);
    for (const x of xem.items as any[]) assert(x.cn == null || x.cn === cp, `QL CP thấy việc chi nhánh ${x.cn}: ${x.key}`);
    assert(khac.size ? xem.cnAn.length === khac.size : xem.cnAn.length === 0, `cnAn ${JSON.stringify(xem.cnAn)} ≠ ${khac.size} chi nhánh khác`);
    console.log(`    GV hai chi nhánh có việc ở > 1 CN: ${coHai} · GV ${gvCp.id} việc CN khác ẩn: ${khac.size}`);
  });

  /* RA-LOI-0711f (chủ SP 06/11 "QL chỉ thấy việc chi nhánh mình" — mới hơn OV-11c PT-7): việc Giao việc (`tasks`, không gắn lớp) mang chi nhánh của việc. */
  check('CVT-4 · việc được giao (Giao việc) của GV: QL Cẩm Phả xem GV chỉ thấy việc CP; việc chi nhánh khác ẩn; GV tự xem thấy việc ở chi nhánh mình còn vai (dòng có `cn`), việc ở chi nhánh không có vai không kẹt ở GV (rà #1960 mục 4)', () => {
    const conn = db();
    const cp = P.cpManager.grants.find((x: any) => x.roleKey === 'manager')?.branchId as number;
    const gv = conn.prepare(`SELECT ta.user_id AS id FROM teacher_assignments ta JOIN classes cl ON cl.id = ta.class_id WHERE ta.status = 'active' AND cl.branch_id = ?
      GROUP BY ta.user_id HAVING COUNT(DISTINCT cl.branch_id) > 1 OR 1 ORDER BY COUNT(DISTINCT cl.branch_id) DESC LIMIT 1`).get(cp) as any;
    const khac = (conn.prepare('SELECT id FROM branches WHERE id != ? ORDER BY id LIMIT 1').get(cp) as any).id as number;
    assert(gv && khac, 'seed thiếu GV Cẩm Phả / chi nhánh khác');
    conn.exec('BEGIN IMMEDIATE');
    try {
      const them = (cn: number) => Number(conn.prepare(`INSERT INTO tasks (code, title, kind, branch_id, assignee_user_id, progress, created_at) VALUES (?, ?, 'branch_ops', ?, ?, 'not_started', ?)`)
        .run(`CVT4-${cn}`, `Việc thử CN ${cn}`, cn, gv.id, TODAY).lastInsertRowid);
      const tCp = them(cp), tKhac = them(khac);
      xoaNho();
      const xem = (mywork.viecCuaNguoi(P.cpManager, gv.id, null).items as any[]).map((x) => x.key);
      assert(xem.includes(`mgmt:${tCp}`), `QL CP phải thấy việc CP: ${xem.filter((k) => k.startsWith('mgmt'))}`);
      assert(!xem.includes(`mgmt:${tKhac}`), `QL CP không được thấy việc chi nhánh ${khac}: ${xem.filter((k) => k.startsWith('mgmt'))}`);
      xoaNho();
      const tu = (mywork.myWork(loadPrincipal(gv.id), {}).items as any[]).filter((x) => x.group === 'mgmt');
      const coVaiKhac = !!conn.prepare(`SELECT 1 FROM user_roles WHERE user_id = ? AND status = 'active' AND (branch_id IS NULL OR branch_id = ?)`).get(gv.id, khac);
      assert(tu.find((x) => x.key === `mgmt:${tCp}`)?.cn === cp && (coVaiKhac ? tu.find((x) => x.key === `mgmt:${tKhac}`)?.cn === khac : !tu.some((x) => x.key === `mgmt:${tKhac}`)),
        `GV tự xem (còn vai ở ${khac}: ${coVaiKhac}): ${JSON.stringify(tu.map((x) => [x.key, x.cn]))}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  /* NHẸ HƠN PR-2a (v23 ④ ⑨): Head "Của GV" chỉ quá hạn + sắp đến; tab Admin; panel lớp Admin mỗi người một dòng, S Mock = "GV Speaking". */
  check('NH2a-1 · hàm thuần: viecGapCuaGv theo mốc tô vàng; tabAdminCua; gomEmThieu tách cặp kỹ năng ↔ người, S Mock = GV Speaking', () => {
    const h = '2026-11-22';
    assert(d.viecGapCuaGv({ due: '2026-11-21' }, h) && d.viecGapCuaGv({ due: h }, h) && d.viecGapCuaGv({ due: '2026-11-24' }, h)
      && !d.viecGapCuaGv({ due: '2026-11-25' }, h) && !d.viecGapCuaGv({ due: null }, h), 'quá hạn / hôm nay / còn 2 ngày vào; còn 3 ngày / không hạn ra');
    assert(d.tabAdminCua({ group: 'score', key: 'k' }) === 'diem' && d.tabAdminCua({ group: 'xuat_bc_ph', key: 'k' }) === 'bao-cao-ph'
      && d.tabAdminCua({ group: 'missing_data', key: 'k' }) === 'lich-thi' && d.tabAdminCua({ group: 'bo_sung_ho_so', key: 'k' }) === 'ho-so'
      && d.tabAdminCua({ group: 'mgmt', key: 'k' }) === 'van-hanh', 'tab Admin theo loại');
    for (const x of [{ group: 'score' }, { group: 'xuat_bc_ph' }, { group: 'missing_data' }, { group: 'mgmt' }]) assert(d.TAB_ADMIN.includes(d.tabAdminCua({ ...x, key: 'k' })), `${x.group} không có tab Admin`);
    const em = d.gomEmThieu([
      { owner: 'Vũ Thu Lan', ownerId: 1, kind: 'mock', due: '2026-11-21', emThieu: [{ id: 1, ten: 'Tạ Minh Khoa', kns: ['listening', 'reading', 'speaking'] }, { id: 2, ten: 'Ngô Bảo Châu', kns: ['writing2'] }] },
      { owner: 'Hà Quốc Bảo', ownerId: 2, kind: 'progress', due: '2026-11-23', emThieu: [{ id: 1, ten: 'Tạ Minh Khoa', kns: ['writing1'] }] },
    ]);
    const khoa = em.find((x: any) => x.id === 1);
    assert(em.length === 2 && khoa.cap.length === 3, JSON.stringify(em));
    assert(khoa.cap.some((c: any) => c.nguoi === 'GV Speaking' && c.kns.join() === 'speaking') && khoa.cap.some((c: any) => c.nguoi === 'Vũ Thu Lan' && c.kns.join() === 'listening,reading')
      && khoa.cap.some((c: any) => c.nguoi === 'Hà Quốc Bảo'), 'mỗi người một dòng, S Mock = GV Speaking');
    assert(khoa.due === '2026-11-21', 'hạn em = hạn sớm nhất');
    /* PTA rà #2001: Admin gộp dòng Điểm một lớp · đợt; việc khác / lớp khác giữ. */
    const s = (key: string, classId: number, tuanThi: string, kns: string[], emIds: number[], soBai: number, due: string, urgency = 'normal') =>
      ({ key, group: 'score', classId, kind: 'mock', tuanThi, kns, emIds, studentId: null, soBai, due, urgency });
    const gop = d.gopDiemAdmin([s('a', 1, 'W1', ['listening'], [1, 2], 2, '2026-11-25'), { key: 'x', group: 'mgmt', classId: null, studentId: null, urgency: 'normal' },
      s('b', 1, 'W1', ['speaking'], [2, 3], 2, '2026-11-20', 'overdue'), s('c', 2, 'W1', ['reading'], [9], 1, '2026-11-26')]);
    assert(gop.length === 3 && gop[0].key === 'b' && gop[0].gopLop && gop[0].soBai === 4 && gop[0].emIds.length === 3 && gop[0].kns.join() === 'listening,speaking'
      && gop[0].due === '2026-11-20' && gop[1].key === 'x' && gop[2].key === 'c' && !gop[2].gopLop, JSON.stringify(gop));
  });

  check('NH2a-2 · /my-work thật: Head "Của GV" = dòng của GV có hạn ≤ hôm nay + 2 (số nút = số dòng quá hạn, cùng demDongViec); Admin có emThieu khớp soBai, GV không có', () => {
    xoaNho();
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    const gv = (w.dong as any[]).filter((x) => d.khopNguoiViec(x, 'gv') && d.viecGapCuaGv(x, TODAY));
    for (const x of gv) assert(d.mucHan(x.due.slice(0, 10), TODAY) !== 'xa', `${x.key} còn xa vẫn vào Của GV`);
    const conXa = (w.dong as any[]).filter((x) => d.khopNguoiViec(x, 'gv') && !d.viecGapCuaGv(x, TODAY));
    assert(gv.every((x) => !conXa.includes(x)), 'hai tập rời');
    assert(d.demDongViec(gv).quaHan === d.demDongViec((w.dong as any[]).filter((x) => d.khopNguoiViec(x, 'gv'))).quaHan, 'lọc sắp đến không làm mất việc quá hạn');
    const idAdmin = (db().prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'office_admin' AND ur.status = 'active' LIMIT 1`).get() as any)?.id;
    if (idAdmin) {
      xoaNho();
      const a = mywork.myWork(loadPrincipal(idAdmin), { nguoi: 'tat-ca' });
      for (const x of (a.dong as any[]).flatMap((y) => [y, ...(y.con ?? [])]).filter((y) => y.group === 'score' && !y.con?.length)) {
        assert(Array.isArray(x.emThieu), `Admin ${x.key} thiếu emThieu`);
        /* soBai đếm theo lượt (MT1 + MT2 cùng tuần = 2 bài), emThieu gộp kỹ năng theo em → ≤; mỗi em của dòng đều có. */
        const so = x.emThieu.reduce((n: number, e: any) => n + e.kns.length, 0);
        assert(so > 0 && so <= x.soBai && x.emThieu.length === (x.emIds?.length ?? 1), `Admin ${x.key}: emThieu ${so} / soBai ${x.soBai}`);
      }
    }
    xoaNho();
    for (const x of mywork.myWork(P.coreTeacher, {}).dong as any[]) assert(x.emThieu === undefined, 'GV không nhận emThieu');
  });
}
