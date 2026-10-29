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
  void checkAsync;
}
