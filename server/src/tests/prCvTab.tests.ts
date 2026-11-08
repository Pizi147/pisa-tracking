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
  check('CVT-4 · việc được giao (Giao việc) của GV: QL Cẩm Phả xem GV chỉ thấy việc CP; việc chi nhánh khác ẩn; GV tự xem thấy cả hai, dòng có `cn`', () => {
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
      assert(tu.find((x) => x.key === `mgmt:${tCp}`)?.cn === cp && tu.find((x) => x.key === `mgmt:${tKhac}`)?.cn === khac, `GV tự xem: ${JSON.stringify(tu.map((x) => [x.key, x.cn]))}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });
}
