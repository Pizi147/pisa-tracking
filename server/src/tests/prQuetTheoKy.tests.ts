/**
 * PHÉP KIỂM QUET-THEO-KY (giảm dòng đọc Turso, kế hoạch `docs/superpowers/plans/2026-10-30-toc-do.md`): quét theo chỉ mục, theo kỳ — số không đổi.
 *   Q1 `listAttempts` `kemChuaTuan`: `OR` → `UNION ALL` (vế ô chờ đi idx_attempt_o_cho[_lop]); thứ tự phá hoà theo `a.id`.
 *   Q2 `napBai` cả chi nhánh (gv = null): đi từ `attempt_skills` / tuần của lượt trong kỳ, không `class_id IN (cả chi nhánh)` + EXISTS từng lượt.
 *   Q3 Báo cáo một request: `/tong-quan/v5?…&kemBaoCao=1` = JSON `/tong-quan/v5` + `baoCao` = JSON `/phan-tich/bao-cao`, cùng quyền.
 * Mỗi đường so với đường đủ qua cờ chỉ phép kiểm bật (`…KhiKiem.bat`).
 */
export async function runPrQuetTheoKyTests(t: any) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  console.log('\nQUET-THEO-KY · quét theo chỉ mục, theo kỳ (số không đổi)');
  const at: any = await import('../fasttrack/attempts.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const perm: any = await import('../permissions.ts');
  const { demoToday }: any = await import('../demoConfig.ts');

  const nguoiVai = (role: string, cn: string) => (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    JOIN branches b ON b.id = ur.branch_id WHERE r.key = ? AND b.code = ? ORDER BY ur.user_id LIMIT 1`).get(role, cn) as any)?.id as number | undefined;
  const adminMt = nguoiVai('office_admin', 'MB');
  const VAI: [string, any][] = [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher], ['GVCN_THUONG', P.normalCoreTeacher],
    ...(adminMt ? [['Admin MT', perm.loadPrincipal(adminMt)] as [string, any]] : [])];
  /** Chạy `fn` với cờ đường đủ bật (câu `OR` cũ), trả kết quả; luôn tắt lại. */
  const voiCo = <T,>(co: { bat: boolean }, fn: () => T): T => { co.bat = true; try { return fn(); } finally { co.bat = false; } };
  const lopFt = classId('MB FT 101');
  const mbId = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const BIEN_THE: [string, object][] = [['mặc định', {}], ['managed', { scope: 'managed' }], ['classIds', { classIds: [lopFt] }], ['branchId', { branchId: mbId }]];
  const goc = { chiDangHoc: true, chiConO: true, kemChuaTuan: true };
  const ids = (p: any, f: object) => at.listAttempts(p, { ...goc, ...f }).rows.map((r: any) => r.id as number);

  check('Q1 · RF4 cùng tập, không trùng, cùng thứ tự: listAttempts kemChuaTuan UNION ALL = câu OR cũ (QL, QT, GVCN, GVBM, GVCN_THUONG, Admin MT × 4 biến thể)', () => {
    assert(at.listAttemptsOrKhiKiem && typeof at.listAttemptsOrKhiKiem.bat === 'boolean', 'chưa có cờ listAttemptsOrKhiKiem');
    let co = 0;
    for (const [vai, p] of VAI) for (const [ten, f] of BIEN_THE) {
      const moi = ids(p, f), cu = voiCo(at.listAttemptsOrKhiKiem, () => ids(p, f));
      assert(JSON.stringify(moi) === JSON.stringify(cu), `${vai} ${ten}: dãy id mới (${moi.length}) ≠ cũ (${cu.length})`);
      assert(new Set(moi).size === moi.length, `${vai} ${ten}: trùng id`);
      co += moi.length;
    }
    assert(co > 0, 'seed: không lượt nào');
  });

  check('Q1 · RF4 lượt vừa có ô chờ vừa chưa xếp tuần: xuất hiện đúng 1 lần', () => {
    const r = at.listAttempts(P.mbManager, goc).rows.find((x: any) => x.status === 'planned' && x.planned_period_id !== null);
    assert(r, 'seed: không lượt planned có tuần');
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = NULL, o_cho_tu = ? WHERE id = ?').run(demoToday(), r.id);
      for (const [vai, p] of [['QL', P.mbManager], ['QT', P.admin]] as [string, any][]) {
        const ds = ids(p, {});
        assert(ds.filter((id: number) => id === r.id).length === 1, `${vai}: lượt ${r.id} xuất hiện ${ds.filter((id: number) => id === r.id).length} lần`);
        assert(JSON.stringify(ds) === JSON.stringify(voiCo(at.listAttemptsOrKhiKiem, () => ids(p, {}))), `${vai}: khác câu OR cũ`);
      }
    } finally { conn.exec('ROLLBACK'); }
  });

  check('Q1 · myWork QL nguoi=tat-ca (+ QL, GVCN của tôi): items JSON giống hệt khi bật cờ', () => {
    for (const [vai, p, f] of [['QL tất cả', P.mbManager, { nguoi: 'tat-ca' }], ['QL', P.mbManager, {}], ['GVCN', P.coreTeacher, {}]] as [string, any, object][]) {
      const moi = JSON.stringify(mw.myWork(p, f).items), cu = JSON.stringify(voiCo(at.listAttemptsOrKhiKiem, () => mw.myWork(p, f).items));
      assert(moi === cu, `${vai}: items khác (${moi.length} ≠ ${cu.length} ký tự)`);
    }
  });

  check('Q1 · EXPLAIN QUERY PLAN câu UNION ALL: không SCAN assessment_attempts, có idx_attempt_o_cho[_lop]', () => {
    const tho: { sql: string; args: unknown[] }[] = [];
    const stProto = Object.getPrototypeOf(conn.prepare('SELECT 1'));
    const gocAll = stProto.all;
    stProto.all = function (this: { sql?: string }, ...args: unknown[]) { if (this.sql && /UNION ALL/.test(this.sql) && /a\.o_cho_tu <= \?/.test(this.sql)) tho.push({ sql: this.sql, args }); return gocAll.apply(this, args); };
    try { for (const [, p] of VAI) for (const [, f] of BIEN_THE) ids(p, f); } finally { stProto.all = gocAll; }
    assert(tho.length > 0, 'không bắt được câu UNION ALL của listAttempts');
    const loi: string[] = [];
    for (const { sql, args } of new Map(tho.map((g) => [g.sql + JSON.stringify(g.args), g])).values()) {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (plan.some((d) => /^SCAN a\b/.test(d))) loi.push(`SCAN a — ${plan.filter((d) => /SCAN|SEARCH a\b/.test(d)).join(' | ')}`);
      if (!plan.some((d) => /idx_attempt_o_cho/.test(d))) loi.push(`không idx_attempt_o_cho — ${plan.filter((d) => /SEARCH a\b|SCAN a\b/.test(d)).join(' | ')}`);
    }
    assert(!loi.length, [...new Set(loi)].join(' || '));
  });

  /* ------------------------------------------------------------------ Q2 napBai cả chi nhánh theo kỳ */
  const pt: any = await import('../phanTich/giaoVien.ts');
  const { xoaNho }: any = await import('../platform/nguCanhRequest.ts');
  const cnCua = (ma: string) => (conn.prepare(`SELECT id FROM branches WHERE code = ?`).get(ma) as any).id as number;
  const KY = { tu: '2026-03-02', den: '2026-09-14' };
  const NGU_CANH: [string, any, object][] = [
    ['QL ft', P.mbManager, { ct: 'ft' }], ['QL thuong 2026-09', P.mbManager, { ct: 'thuong', thang: '2026-09' }], ['QL ft khoảng', P.mbManager, { ct: 'ft', ...KY }],
    ['QL thuong khoảng', P.mbManager, { ct: 'thuong', ...KY }], ['QT MB ft khoảng', P.admin, { cn: cnCua('MB'), ct: 'ft', ...KY }], ['QT CP ft khoảng', P.admin, { cn: cnCua('CP'), ct: 'ft', ...KY }],
  ];
  const khoaNap = (n: any) => JSON.stringify({
    o: [...n.o].sort((x: any, y: any) => x.attemptId - y.attemptId || (x.skill < y.skill ? -1 : x.skill > y.skill ? 1 : 0)),
    a: [...n.attempts.keys()].sort((x: number, y: number) => x - y),
  });

  check('Q2 · napBai(gv=null) giống hệt đường đủ (QL MB ft / thuong tháng / khoảng, QT MB + CP): ô + khoá lượt', () => {
    let co = 0;
    for (const [ten, p, f] of NGU_CANH) {
      const c = pt.nguCanhPtGv(p, f);
      xoaNho();
      const moi = pt.napBai(p, c);
      xoaNho();
      const cu = voiCo(pt.napDayDuKhiKiem, () => pt.napBai(p, c));
      assert(khoaNap(moi) === khoaNap(cu), `${ten}: ô mới ${moi.o.length} / lượt ${moi.attempts.size} ≠ đủ ${cu.o.length} / ${cu.attempts.size}`);
      /* Cùng THỨ TỰ ô (lượt theo lớp, id — như đường đủ đi idx_attempt_class): tập con dùng `o` theo thứ tự không đổi. */
      assert(JSON.stringify(moi.o.map((x: any) => x.id)) === JSON.stringify(cu.o.map((x: any) => x.id)), `${ten}: thứ tự ô khác đường đủ`);
      co += moi.o.length;
    }
    assert(co > 0, 'seed: không ô nào trong kỳ');
  });

  check('Q2 · EXPLAIN câu napBai cả chi nhánh: có idx_attempt_skills_period, không SCAN assessment_attempts', () => {
    const tho: { sql: string; args: unknown[] }[] = [];
    const stProto = Object.getPrototypeOf(conn.prepare('SELECT 1'));
    const gocAll = stProto.all;
    stProto.all = function (this: { sql?: string }, ...args: unknown[]) { if (this.sql && /a\.id IN \(SELECT k\.attempt_id FROM attempt_skills k/.test(this.sql)) tho.push({ sql: this.sql, args }); return gocAll.apply(this, args); };
    try { for (const [, p, f] of NGU_CANH) { xoaNho(); pt.napBai(p, pt.nguCanhPtGv(p, f)); } } finally { stProto.all = gocAll; }
    assert(tho.length > 0, 'không bắt được câu napBai theo kỳ');
    const loi: string[] = [];
    for (const { sql, args } of tho) {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);      if (plan.some((d) => /^SCAN a\b/.test(d))) loi.push(`SCAN a — ${plan.join(' | ')}`);
      if (!plan.some((d) => /idx_attempt_skills_period/.test(d))) loi.push(`không idx_attempt_skills_period — ${plan.join(' | ')}`);
    }
    assert(!loi.length, [...new Set(loi)].join(' || '));
  });

  /* ------------------------------------------------------------------ Q3 Báo cáo một request */
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { soCauSql }: any = await import('../platform/nguCanhRequest.ts');
  const motNguoi = (role: string) => (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? ORDER BY ur.user_id LIMIT 1`).get(role) as any)?.id as number | undefined;
  const U: Record<string, number | undefined> = { QL: P.mbManager.userId, QT: P.admin.userId, GVCN: P.coreTeacher.userId, CX: motNguoi('cx'), TVV: motNguoi('consultant') };
  const server = createApp().listen(0);
  try {
    const goi = async (vai: string, url: string) => {
      const res = await fetch(`http://127.0.0.1:${(server.address() as any).port}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(U[vai]!)}` } });
      const txt = await res.text();
      return { status: res.status, json: res.status === 200 ? JSON.parse(txt) : null };
    };
    const LOC = ['ct=ft', 'ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20'];

    await checkAsync('Q3 · /tong-quan/v5?…&kemBaoCao=1: baoCao = JSON /phan-tich/bao-cao, phần còn lại = JSON /tong-quan/v5 (QL, QT × ft, thường theo tuần)', async () => {
      for (const vai of ['QL', 'QT']) for (const q of LOC) {
        const gop = await goi(vai, `/tong-quan/v5?${q}&kemBaoCao=1`), tq = await goi(vai, `/tong-quan/v5?${q}`), bc = await goi(vai, `/phan-tich/bao-cao?${q}`);
        assert(gop.status === 200 && tq.status === 200 && bc.status === 200, `${vai} ${q}: mã ${gop.status} / ${tq.status} / ${bc.status}`);
        const { baoCao, ...conLai } = gop.json;
        assert(JSON.stringify(baoCao) === JSON.stringify(bc.json), `${vai} ${q}: baoCao ≠ /phan-tich/bao-cao`);
        assert(JSON.stringify(conLai) === JSON.stringify(tq.json), `${vai} ${q}: phần Tổng quan ≠ /tong-quan/v5`);
      }
    });

    await checkAsync('Q3 · RF5 cùng quyền: GVCN kemBaoCao=1 → 403; CX, TVV: mã = mã xấu hơn của hai đường cũ; không kemBaoCao → không có baoCao', async () => {
      const g = await goi('GVCN', '/tong-quan/v5?ct=ft&kemBaoCao=1');
      assert(g.status === 403, `GVCN: ${g.status} (mong 403)`);
      for (const vai of ['CX', 'TVV']) {
        if (!U[vai]) continue;
        const gop = await goi(vai, '/tong-quan/v5?ct=ft&kemBaoCao=1'), tq = await goi(vai, '/tong-quan/v5?ct=ft'), bc = await goi(vai, '/phan-tich/bao-cao?ct=ft');
        assert(gop.status === Math.max(tq.status, bc.status), `${vai}: gộp ${gop.status} ≠ max(${tq.status}, ${bc.status})`);
      }
      const ql = await goi('QL', '/tong-quan/v5?ct=ft');
      assert(ql.status === 200 && !('baoCao' in ql.json), 'không kemBaoCao mà vẫn có baoCao');
    });

    await checkAsync('Q3 · câu (gộp) < câu (tq) + câu (bc) — QL MB ft', async () => {
      const dem = async (url: string) => { const c0 = soCauSql(); await goi('QL', url); return soCauSql() - c0; };
      const gop = await dem('/tong-quan/v5?ct=ft&kemBaoCao=1'), tq = await dem('/tong-quan/v5?ct=ft'), bc = await dem('/phan-tich/bao-cao?ct=ft');
      console.log(`    câu QL ft: gộp ${gop} · tq ${tq} + bc ${bc} = ${tq + bc}`);
      assert(gop < tq + bc, `gộp ${gop} ≥ ${tq} + ${bc}`);
    });
  } finally { server.close(); }
}
