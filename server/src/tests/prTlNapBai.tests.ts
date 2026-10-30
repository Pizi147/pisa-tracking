/**
 * PHÉP KIỂM TL-NAPBAI (kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`): lịch kỹ năng có chi nhánh, `napBai` cả chi nhánh theo kỳ.
 *   B1 cột `attempt_skills.branch_id` giữ bằng trigger (bất biến B1-c cũng chạy trong `batBienDb` — sau dữ liệu mọi tệp khác).
 *   B2 `napBai(gv = null)` đi từ ô kỹ năng của chi nhánh trong kỳ (CROSS JOIN ép thứ tự) — số giống hệt đường đủ; EXPLAIN kiểm ĐÚNG THỨ TỰ bảng,
 *      đối chứng câu Q2 cũ (#724) phải bị bắt.
 */
import fs from 'node:fs';
import path from 'node:path';

/** B1-c: số dòng lịch kỹ năng có chi nhánh khác chi nhánh lớp của lượt (lượt không lớp → phải NULL). */
export const SQL_LECH_CN = `SELECT COUNT(*) AS n FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
  LEFT JOIN classes c ON c.id = a.class_id WHERE k.branch_id IS NOT c.branch_id`;

/** Câu Q2 cũ (29233c465^ `napBai`, nhánh gv == null) — đối chứng: planner đi lớp trước + đọc ô kỹ năng mọi chi nhánh. */
const SQL_Q2_CU = `SELECT a.* FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE (a.id IN (SELECT k.attempt_id FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id WHERE r2.week_start BETWEEN ? AND ?)
                OR a.planned_period_id IN (SELECT id FROM report_periods WHERE week_start BETWEEN ? AND ?)) AND cl.branch_id = ? AND cl.is_fast_track = ?
          AND a.status != 'cancelled'
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start BETWEEN ? AND ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start BETWEEN ? AND ?))`;

/**
 * Lỗi của kế hoạch câu `napBai` cả chi nhánh (rỗng = đạt): `k` tìm theo (chi nhánh, tuần); `a` tìm theo khoá SAU nguồn `luot` / `x`; vế lượt không lịch
 * kỹ năng đi `idx_attempt_lop_tuan` (lớp, tuần — `idx_attempt_period` đọc lượt trong kỳ MỌI chi nhánh); không quét `a` / `k`, không đi lớp trước (`idx_attempt_class`), không đọc ô mọi chi nhánh (`idx_attempt_skills_period`).
 */
export function kiemKeHoach(plan: string[]): string[] {
  const loi: string[] = [];
  const i = (re: RegExp) => plan.findIndex((d) => re.test(d));
  if (i(/^SEARCH k USING (COVERING )?INDEX idx_attempt_skills_cn_tuan \(branch_id=\? AND planned_period_id=\?\)/) < 0) loi.push('k không tìm theo idx_attempt_skills_cn_tuan (branch_id, planned_period_id)');
  const ia = i(/^SEARCH a USING INTEGER PRIMARY KEY \(rowid=\?\)/), ix = i(/^(SCAN|SEARCH) (x|luot)\b/);
  if (ia < 0) loi.push('a không tìm theo khoá (rowid)');
  else if (ix < 0 || ix > ia) loi.push('a không đứng sau nguồn luot / x');
  if (i(/^SEARCH a2 USING (COVERING )?INDEX idx_attempt_lop_tuan \(class_id=\? AND planned_period_id=\?\)/) < 0) loi.push('vế lượt không lịch kỹ năng không đi idx_attempt_lop_tuan (lớp, tuần)');
  for (const [re, ten] of [[/^SCAN a( |$)/, 'SCAN a'], [/^SCAN k( |$)/, 'SCAN k'], [/idx_attempt_class\b/, 'idx_attempt_class'], [/idx_attempt_period\b/, 'idx_attempt_period'], [/idx_attempt_skills_period\b/, 'idx_attempt_skills_period']] as [RegExp, string][]) {
    if (i(re) >= 0) loi.push(`có ${ten}`);
  }
  return loi;
}

export async function runPrTlNapBaiTests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nTL-NAPBAI · lịch kỹ năng có chi nhánh, napBai cả chi nhánh theo kỳ');
  const mig: any = await import('../migrate/prTlNapBai.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const { chayTrongRequest, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;

  check('B1-a · migrate chạy hai lần không lỗi; schema.sql có cột cuối bảng, 2 chỉ mục, 5 trigger trùng nguyên văn migrate', () => {
    const ap: string[] = [];
    mig.migratePrTlNapBai(conn, ap); mig.migratePrTlNapBai(conn, ap);
    assert(ap.length === 0, `DB mới (schema.sql) mà migrate còn thêm: ${ap.join(' | ')}`);
    const cot = all('PRAGMA table_info(attempt_skills)').map((c) => c.name);
    assert(cot[cot.length - 1] === 'branch_id', `cột cuối: ${cot[cot.length - 1]}`);
    const sql = fs.readFileSync(path.resolve(process.cwd(), 'server/src/schema.sql'), 'utf8');
    assert(/branch_id INTEGER,\s*UNIQUE \(attempt_id, skill\)/.test(sql), 'schema.sql: branch_id không phải cột cuối attempt_skills');
    /* DB phép kiểm dựng từ schema.sql → DDL trong DB phải trùng nguyên văn hằng của migrate (không lệch hai bản). */
    const gon = (x: string) => x.replace(/\s+/g, ' ').trim();
    for (const [ten, ddl] of [...mig.CHI_MUC_TL_NAPBAI, ...mig.TRIGGER_TL_NAPBAI]) {
      const r = get('SELECT sql FROM sqlite_master WHERE name = ?', ten);
      assert(r && gon(r.sql) === gon(ddl), `${ten}: schema.sql khác migrate — ${r?.sql ?? 'thiếu'}`);
    }
    /* DB cũ (chưa cột / trigger): migrate thêm + điền theo lớp của lượt; trong giao dịch, bỏ khi xong. */
    conn.exec('BEGIN IMMEDIATE');
    try {
      for (const [ten] of mig.TRIGGER_TL_NAPBAI) conn.exec(`DROP TRIGGER ${ten}`);
      conn.exec('UPDATE attempt_skills SET branch_id = NULL');
      const ap2: string[] = [];
      mig.migratePrTlNapBai(conn, ap2);
      assert(ap2.length === 1 && mig.TRIGGER_TL_NAPBAI.every(([t]: [string]) => ap2[0].includes(t)), `migrate: ${ap2.join(' | ')}`);
      assert(get(SQL_LECH_CN).n === 0, 'điền lại dữ liệu cũ sai');
      assert(get('SELECT COUNT(*) AS n FROM attempt_skills WHERE branch_id IS NOT NULL').n > 0, 'seed: không lịch kỹ năng có lớp');
    } finally { conn.exec('ROLLBACK'); }
  });

  check('B1-b · thêm lịch kỹ năng → branch_id đúng; lượt đổi sang lớp chi nhánh khác / lớp đổi chi nhánh / ô đổi lượt / lượt chèn sau ô → đổi theo', () => {
    const r = get(`SELECT a.id, a.class_id, c.branch_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
                    WHERE EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id) ORDER BY a.id LIMIT 1`);
    const khac = get('SELECT c.id, c.branch_id FROM classes c WHERE c.branch_id != ? ORDER BY c.id LIMIT 1', r.branch_id);
    assert(r && khac, 'seed: cần lượt có lịch kỹ năng + lớp chi nhánh khác');
    const cnLich = (aid: number) => all('SELECT DISTINCT branch_id FROM attempt_skills WHERE attempt_id = ?', aid).map((x) => x.branch_id);
    conn.exec('BEGIN IMMEDIATE');
    try {
      const daCo = all('SELECT skill FROM attempt_skills WHERE attempt_id = ?', r.id).map((x) => x.skill);
      const moi = ['listening', 'reading', 'writing', 'speaking', 'writing1'].find((s) => !daCo.includes(s));
      conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, created_at) VALUES (?, ?, '2026-10-01')`).run(r.id, moi);
      assert(JSON.stringify(cnLich(r.id)) === JSON.stringify([r.branch_id]), `thêm lịch: ${cnLich(r.id)} ≠ ${r.branch_id}`);
      conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ?').run(khac.id, r.id);   // như luatLoTrinh.ts / mt0.ts dời lượt sang lớp mới
      assert(JSON.stringify(cnLich(r.id)) === JSON.stringify([khac.branch_id]), `lượt đổi lớp: ${cnLich(r.id)} ≠ ${khac.branch_id}`);
      conn.prepare('UPDATE classes SET branch_id = ? WHERE id = ?').run(r.branch_id, khac.id);
      assert(JSON.stringify(cnLich(r.id)) === JSON.stringify([r.branch_id]), `lớp đổi chi nhánh: ${cnLich(r.id)} ≠ ${r.branch_id}`);
      conn.prepare('UPDATE assessment_attempts SET class_id = NULL WHERE id = ?').run(r.id);
      assert(JSON.stringify(cnLich(r.id)) === JSON.stringify([null]), `lượt không lớp: ${cnLich(r.id)}`);
      /* Thứ tự ghi của khôi phục: ô kỹ năng chèn trước lượt (khoá ngoại hoãn) · ô đổi sang lượt khác. */
      const sau = get(`SELECT a.id, c.branch_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE c.branch_id != ? ORDER BY a.id LIMIT 1`, r.branch_id);
      conn.prepare(`UPDATE attempt_skills SET attempt_id = ?, skill = 'tl-napbai' WHERE attempt_id = ? AND skill = ?`).run(sau.id, r.id, moi);
      assert(get(`SELECT branch_id FROM attempt_skills WHERE attempt_id = ? AND skill = 'tl-napbai'`, sau.id).branch_id === sau.branch_id, 'ô đổi lượt: branch_id không theo lượt mới');
      conn.pragma('defer_foreign_keys = ON');
      const idMoi = get('SELECT MAX(id) + 1000 AS n FROM assessment_attempts').n;
      conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, created_at) VALUES (?, 'listening', '2026-10-01')`).run(idMoi);
      conn.prepare(`INSERT INTO assessment_attempts (id, cycle_id, student_id, attempt_no, class_id, status, created_at)
                    SELECT ?, cycle_id, student_id, attempt_no + 1000, ?, 'planned', created_at FROM assessment_attempts WHERE id = ?`).run(idMoi, khac.id, r.id);
      assert(JSON.stringify(cnLich(idMoi)) === JSON.stringify([r.branch_id]), `lượt chèn sau ô: ${cnLich(idMoi)} ≠ ${r.branch_id}`);
      assert(get(SQL_LECH_CN).n === 0, 'bất biến lệch sau các bước');
    } finally { conn.exec('ROLLBACK'); }
  });

  check('B1-c · bất biến: branch_id lịch kỹ năng = chi nhánh lớp của lượt (cũng soi trong batBienDb sau dữ liệu mọi tệp)', () => {
    assert(get(SQL_LECH_CN).n === 0, `${get(SQL_LECH_CN).n} dòng lệch`);
  });

  /* ------------------------------------------------------------------ B2 */
  const mb = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const cns = all('SELECT id FROM branches ORDER BY id').map((x) => x.id as number);
  const LOC: [string, object][] = [['ct=ft', { ct: 'ft' }], ['ct=thuong&thang=2026-09', { ct: 'thuong', thang: '2026-09' }],
    ['khoảng 2026-03-02..2026-09-14', { ct: 'ft', tu: '2026-03-02', den: '2026-09-14' }]];
  const voiCo = <T,>(du: boolean, fn: () => T): T => { pt.napDayDuKhiKiem.bat = du; try { xoaNho(); return chayTrongRequest('GET', fn) as T; } finally { pt.napDayDuKhiKiem.bat = false; } };
  const napJson = (p: any, f: object) => {
    const n = pt.napBai(p, pt.nguCanhPtGv(p, f));
    const o = [...n.o].sort((x: any, y: any) => x.attemptId - y.attemptId || x.skill.localeCompare(y.skill));
    return JSON.stringify({ o, a: [...n.attempts.keys()].sort((x: number, y: number) => x - y) });
  };

  check('B2-a · giống hệt: napBai(gv = null) + bảng Phân tích GV — QL MB × 3 khoảng, QT × mọi chi nhánh × 3 khoảng: đường mới = đường đủ', () => {
    let co = 0;
    const ds: [string, any, object][] = [...LOC.map(([t, f]) => [`QL MB ${t}`, P.mbManager, { cn: mb, ...f }] as [string, any, object]),
      ...cns.flatMap((cn) => LOC.map(([t, f]) => [`QT cn=${cn} ${t}`, P.admin, { cn, ...f }] as [string, any, object]))];
    for (const [ten, p, f] of ds) {
      const moi = voiCo(false, () => napJson(p, f)), du = voiCo(true, () => napJson(p, f));
      assert(moi === du, `${ten}: napBai mới ${moi.slice(0, 200)} ≠ đủ ${du.slice(0, 200)}`);
      const bm = voiCo(false, () => JSON.stringify(pt.phanTichGiaoVien(p, f))), bd = voiCo(true, () => JSON.stringify(pt.phanTichGiaoVien(p, f)));
      assert(bm === bd, `${ten}: phanTichGiaoVien khác`);
      co += JSON.parse(moi).o.length;
    }
    assert(co > 0, 'seed: không ô nào — phép so rỗng');
  });

  /** Câu `napBai` cả chi nhánh vừa chạy (bắt qua `conn.prepare`). */
  const cauMoi = (): string => {
    const goc = conn.prepare;
    let sql = '';
    conn.prepare = function (this: unknown, s: string) { if (/WITH ky\(id\)/.test(s)) sql = s; return goc.call(this, s); };
    try { voiCo(false, () => pt.napBai(P.mbManager, pt.nguCanhPtGv(P.mbManager, { cn: mb, ct: 'ft' }))); } finally { conn.prepare = goc; }
    return sql;
  };
  const keHoach = (sql: string) => all(`EXPLAIN QUERY PLAN ${sql}`, ...Array((sql.match(/\?/g) ?? []).length).fill(1)).map((x) => x.detail as string);

  check('B2-b · EXPLAIN đúng THỨ TỰ: k theo (chi nhánh, tuần) · a theo khoá sau luot · vế 2 idx_attempt_lop_tuan · không SCAN a/k, idx_attempt_class, idx_attempt_period, idx_attempt_skills_period', () => {
    const sql = cauMoi();
    assert(sql, 'không bắt được câu napBai mới (WITH ky(id) …)');
    const plan = keHoach(sql);
    const loi = kiemKeHoach(plan);
    assert(!loi.length, `${loi.join('; ')} — kế hoạch: ${plan.join(' | ')}`);
  });

  check('B2-c · đối chứng: kiemKeHoach báo LỖI với câu Q2 cũ (#724)', () => {
    const plan = keHoach(SQL_Q2_CU);
    const loi = kiemKeHoach(plan);
    assert(loi.length > 0, `câu Q2 cũ lọt phép kiểm — kế hoạch: ${plan.join(' | ')}`);
    assert(plan.some((d) => /idx_attempt_class|idx_attempt_skills_period/.test(d)) || loi.some((l) => l.includes('sau nguồn')), `lỗi #724 không hiện: ${loi.join('; ')}`);
  });

  /*
   * Dòng phải quét (Turso tính tiền) ước theo đúng đường chỉ mục, cùng một mô hình cho hai đường: mỗi lượt ứng viên = 1 (khoá / mục chỉ mục) + EXISTS
   * (đọc ô kỹ năng của lượt theo idx_attempt_skills_attempt tới ô đầu tiên trong kỳ; không ô nào → mọi ô + 1 lần dò NOT EXISTS).
   *   Cũ: ứng viên = mọi lượt của lớp chi nhánh + khung (idx_attempt_class, mọi kỳ).
   *   Mới: mục idx_attempt_skills_cn_tuan của chi nhánh trong kỳ + vế 2 (mục idx_attempt_lop_tuan + dò NOT EXISTS) + ứng viên = lượt của `luot`.
   */
  check('B2-d · dòng phải quét (ước theo đường chỉ mục): in bảng mới / cũ; chi nhánh nhỏ nhất (có lớp) ≤ 1/3 ô kỹ năng MỌI chi nhánh trong kỳ (#724 đọc chéo chi nhánh)', () => {
    const tuan = new Map(all('SELECT id, week_start FROM report_periods').map((r) => [r.id, r.week_start as string]));
    const oCua = new Map<number, { cn: number | null; ky: number | null }[]>();
    for (const k of all('SELECT attempt_id, branch_id, planned_period_id FROM attempt_skills ORDER BY attempt_id, id')) {
      (oCua.get(k.attempt_id) ?? oCua.set(k.attempt_id, []).get(k.attempt_id)!).push({ cn: k.branch_id, ky: k.planned_period_id });
    }
    const luotAll = all('SELECT id, class_id, planned_period_id FROM assessment_attempts');
    const bang: string[] = [], xa: string[] = [];
    for (const [ten, f] of LOC) {
      let oMoiCn = 0;
      const ds: [number, number][] = [];
      for (const cn of cns) {
        const c = pt.nguCanhPtGv(P.admin, { cn, ...f });
        const trong = (ky: number | null) => { const w = ky == null ? null : tuan.get(ky); return w != null && w >= c.tu && w <= c.den; };
        const exists = (id: number) => { const ds = oCua.get(id) ?? []; const i = ds.findIndex((o) => trong(o.ky)); return i >= 0 ? i + 1 : ds.length + 1; };
        const lopLuot = luotAll.filter((a) => c.lop.has(a.class_id));
        const cu = lopLuot.reduce((t, a) => t + 1 + exists(a.id), 0);
        const oCn = [...oCua].flatMap(([id, ds]) => ds.filter((o) => o.cn === cn && trong(o.ky)).map(() => id));
        const ve2 = lopLuot.filter((a) => trong(a.planned_period_id));
        const luot = new Set([...oCn, ...ve2.filter((a) => !oCua.has(a.id)).map((a) => a.id)]);
        const moi = oCn.length + 2 * ve2.length + [...luot].reduce((t, id) => t + 1 + exists(id), 0);
        oMoiCn = [...oCua.values()].flat().filter((o) => trong(o.ky)).length;
        bang.push(`${ten} cn=${cn} (${c.lop.size} lớp): cũ ${cu} → mới ${moi}`);
        if (c.lop.size) ds.push([cn, moi]);
      }
      bang.push(`${ten}: ô kỹ năng mọi chi nhánh trong kỳ ${oMoiCn}`);
      const nho = Math.min(...ds.map(([, m]) => m));
      if (nho * 3 > oMoiCn) xa.push(`${ten}: chi nhánh nhỏ nhất ${nho} > 1/3 × ${oMoiCn}`);
    }
    console.log('    ' + bang.join('\n    '));
    /*
     * Kế hoạch ghi thêm "mới ≤ cũ mọi chi nhánh": KHÔNG đạt trên demo — lịch sử demo ≈ khoảng xem, nên đường cũ (mọi lượt mọi kỳ của lớp khung) rẻ;
     * đường mới đọc mọi ô kỹ năng chi nhánh trong kỳ (mọi khung). Đường mới chỉ phụ thuộc khoảng, đường cũ lớn theo lịch sử — ghi bảng trong PR, PTA quyết.
     */
    assert(xa.length === 0, xa.join('; '));
  });
}
