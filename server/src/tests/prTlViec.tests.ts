/**
 * PHÉP KIỂM TL-VIEC (TRANG-LON S3, kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`): `myWork` nạp chung một lần mỗi request —
 * không đổi con số, thứ tự, nội dung việc (`TV · giống hệt bản chụp`, so với bản chụp `origin/main` — `soGoc.ts`).
 */
import { chupHoacSo } from './soGoc.ts';

/** Dòng đọc trên DB gốc, đo trên main 17c2da510 (mốc quét còn hạn, không quét) — `TV1 · dòng`. */
const DONG_GOC: Record<string, number> = { 'QL tat-ca': 1443, QL: 1086, GVCN: 828, GVBM: 851 };

export async function runPrTlViecTests(t: any) {
  const { check, checkAsync, assert, P } = t;
  console.log('\nTL-VIEC · myWork nạp chung một lần mỗi request');
  const { db } = await import('../db.ts');
  const { chayTrongRequest, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { can, loadPrincipal } = await import('../permissions.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { myWork, viecCuaNguoi, NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { phamViXemViec } = await import('../worklist/xemViec.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');
  const { createApp } = await import('../app.ts');
  const { caseChuaCoNguoi } = await import('../cases/owner.ts');
  const { dongPhoiHopLop } = await import('../yThuc/phoiHop.ts');

  const c = () => db() as any;
  const ids = (sql: string, ...a: unknown[]) => (c().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
  const motTrongRequest = (fn: () => unknown) => chayTrongRequest('GET', () => {
    try { return fn(); } catch (e: any) { if (e?.status === 403) return '403'; throw e; }
  });

  check('TV · giống hệt bản chụp', () => chupHoacSo('tl-viec', () => {
    const out: Record<string, unknown> = {};
    const nguoi = ids(`SELECT id FROM users WHERE status = 'active' AND deleted_at IS NULL ORDER BY id`);
    const chiNhanh = [null, ...ids('SELECT id FROM branches ORDER BY id')];
    for (const uid of nguoi) {
      const p = loadPrincipal(uid);
      const coKhu = can(p, PERMISSIONS.WORK_VIEW, { anyScope: true });
      for (const branchId of chiNhanh) {
        const b = branchId ?? '-';
        out[`myWork:${uid}:toi:${b}`] = motTrongRequest(() => myWork(p, { branchId, ...(coKhu ? {} : { chiNhom: NHOM_VIEC_TVV }) }));
        if (coKhu && phamViXemViec(p)) out[`myWork:${uid}:tat-ca:${b}`] = motTrongRequest(() => myWork(p, { branchId, nguoi: 'tat-ca' }));
      }
    }
    const ql = P.mbManager.userId as number;
    const gvMb = ids(`SELECT DISTINCT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN branches b ON b.id = c.branch_id
       WHERE b.code = 'MB' ORDER BY 1`);
    for (const gv of gvMb) out[`viecCuaNguoi:${ql}:${gv}`] = motTrongRequest(() => viecCuaNguoi(loadPrincipal(ql), gv));
    const tvv = ids(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY 1 LIMIT 1`)[0];
    const vai = [ql, P.admin.userId, P.coreTeacher.userId, P.subjectTeacher.userId, P.normalCoreTeacher.userId, tvv];
    for (const lop of ids(`SELECT id FROM classes WHERE status = 'active' ORDER BY id`)) {
      for (const uid of vai) out[`viecTheoEm:${uid}:${lop}`] = motTrongRequest(() => viecTheoEmCuaLop(loadPrincipal(uid), lop));
    }
    return out;
  }));

  /** Câu SQL + số dòng của MỘT GET (mốc quét còn hạn → không quét, như đo `tocDo.run`). */
  async function doGet(userId: number, url: string) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    try {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
      c().prepare(`UPDATE moc_he_thong SET luc = ?, ngay = ? WHERE khoa LIKE 'quet:%'`).run(new Date().toISOString(), demoToday());
      await (await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie } })).text();   // lần đầu: nạp nhớ tiến trình bảng tham chiếu
      const k = c(), cau: string[] = [], goc = k.prepare, d0 = soDongSql();
      k.prepare = function (this: unknown, sql: string) { cau.push(sql.replace(/\s+/g, ' ').trim()); return goc.call(this, sql); };
      try { await (await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie } })).text(); } finally { delete k.prepare; }
      return { cau, dong: soDongSql() - d0 };
    } finally { may.close(); }
  }

  await checkAsync('TV1 · /my-work?nguoi=tat-ca QL: câu đọc teacher_assignments ≤ 1, câu FROM sos_cases ≤ 2', async () => {
    const { cau } = await doGet(P.mbManager.userId, '/my-work?nguoi=tat-ca');
    const ta = cau.filter((s) => /^SELECT [^()]*FROM teacher_assignments/.test(s)), sos = cau.filter((s) => /\bFROM sos_cases sc\b/.test(s));
    assert(ta.length <= 1, `${ta.length} câu teacher_assignments: ${ta.map((s) => s.slice(0, 120)).join(' | ')}`);
    assert(sos.length <= 2, `${sos.length} câu sos_cases: ${sos.map((s) => s.slice(0, 120)).join(' | ')}`);
  });

  await checkAsync('TV1 · dòng không tăng so với gốc TV0 > 5 % (QL · GV)', async () => {
    const lech: string[] = [];
    for (const [ten, uid, url] of [['QL tat-ca', P.mbManager.userId, '/my-work?nguoi=tat-ca'], ['QL', P.mbManager.userId, '/my-work'], ['GVCN', P.coreTeacher.userId, '/my-work'], ['GVBM', P.subjectTeacher.userId, '/my-work']] as [string, number, string][]) {
      const { dong } = await doGet(uid, url);
      console.log(`    ${ten} ${url}: ${dong} dòng (gốc ${DONG_GOC[ten]})`);
      if (dong > DONG_GOC[ten] * 1.05) lech.push(`${ten}: ${dong} > ${DONG_GOC[ten]} × 1,05`);
    }
    assert(!lech.length, lech.join(' · '));
  });

  await checkAsync('TV2 · tat-ca QL: câu khối napTruocPhamVi ≤ 2 (viecBuocTiep nạp tập riêng), napChu ≤ 1, tyLeTongLo ≤ 1', async () => {
    const { cau } = await doGet(P.mbManager.userId, '/my-work?nguoi=tat-ca');
    const dem = (r: RegExp) => cau.filter((s) => r.test(s)).length;
    const nap = dem(/^SELECT s\.id AS sid, s\.branch_id AS sbid/), chu = dem(/FROM users u WHERE u\.id IN \(\?/), ty = dem(/^SELECT a\.id, a\.kind, c\.programme_code, c\.nguong_dat FROM assessment_attempts/);
    assert(nap <= 2 && chu <= 1 && ty <= 1, `napTruocPhamVi ${nap} · napChu ${chu} · tyLeTongLo ${ty}`);
  });

  await checkAsync('TV3 · /my-work?nguoi=tat-ca QL: listAttempts không đọc lại mã kỳ / MT mới nhất (gốc − 2); chốt lộ trình không đọc lại bảng lớp', async () => {
    const { cau } = await doGet(P.mbManager.userId, '/my-work?nguoi=tat-ca');
    const dem = (r: RegExp) => cau.filter((s) => r.test(s)).length;
    const ma = dem(/^SELECT code FROM report_periods WHERE id = \?/), mt = dem(/^SELECT a\.id AS attempt_id FROM assessment_attempts a WHERE a\.id IN/), lop = dem(/^SELECT .*FROM classes( c)?( WHERE|$)/);
    assert(ma === 0 && mt === 0 && lop === 0, `mã kỳ ${ma} · MT mới nhất ${mt} · bảng lớp ${lop}`);
  });

  await checkAsync('TV · câu mới đúng thứ tự bảng + chỉ mục: Case mở · phân công · đề nghị dời', async () => {
    const { cau } = await doGet(P.mbManager.userId, '/my-work?nguoi=tat-ca');
    const keHoach = (dau: string) => {
      const sql = cau.find((s) => s.startsWith(dau));
      assert(sql, `không thấy câu ${dau}`);
      return (c().prepare(`EXPLAIN QUERY PLAN ${sql}`).all() as any[]).map((r) => String(r.detail));
    };
    const scan = (kh: string[]) => kh.filter((d) => /^SCAN /.test(d));
    const mo = keHoach('SELECT sc.*,');
    assert(/^SCAN sc\b/.test(mo[0]) && scan(mo).length === 1, `Case mở: ${mo.join(' | ')}`);
    for (const [b, r] of [['a', 'INTEGER PRIMARY KEY'], ['s', 'INTEGER PRIMARY KEY'], ['cur', 'idx_enr_student'], ['ac', 'INTEGER PRIMARY KEY'], ['cc', 'INTEGER PRIMARY KEY'], ['rp', 'INTEGER PRIMARY KEY']]) {
      assert(mo.some((d) => d.startsWith(`SEARCH ${b} `) && d.includes(r)), `Case mở: bảng ${b} không đi ${r}: ${mo.join(' | ')}`);
    }
    const pc = keHoach('SELECT ta.id, ta.class_id, ta.user_id');
    assert(/^SCAN ta\b/.test(pc[0]) && scan(pc).length === 1 && pc.some((d) => d.startsWith('SEARCH c ')) && pc.some((d) => d.startsWith('SEARCH u ')), `phân công: ${pc.join(' | ')}`);
    const dn = keHoach('SELECT r.*, pr.code AS to_code');
    assert(dn.some((d) => d.startsWith('SEARCH pr ') && d.includes('INTEGER PRIMARY KEY')), `đề nghị dời: ${dn.join(' | ')}`);
  });

  check('TV · dòng Phối hợp SOS ngoài GET: đọc bảng lớp một lần, không theo từng lớp', () => {
    const k = c(), cau: string[] = [], goc = k.prepare;
    const lop = ids(`SELECT id FROM classes WHERE status = 'active' ORDER BY id`);
    k.prepare = function (this: unknown, sql: string) { cau.push(sql.replace(/\s+/g, ' ').trim()); return goc.call(this, sql); };
    try { dongPhoiHopLop(lop); } finally { delete k.prepare; }
    const n = cau.filter((s) => /^SELECT \* FROM classes$/.test(s)).length;
    assert(n <= 1, `${n} câu cả bảng lớp cho ${lop.length} lớp`);
  });

  /* Hai phép cuối ghi DB (tệp DOC_LAP: bản chép bỏ khi xong) — demo không có Case chưa người / em hai ghi danh, bản chụp không chạm hai nhánh này. */
  check('TV · Case chưa có người: dòng Công việc = caseChuaCoNguoi đọc riêng (cùng tập, cùng môn thiếu)', () => {
    c().prepare(`UPDATE sos_cases SET owner_user_id = NULL WHERE id IN (SELECT id FROM sos_cases WHERE status != 'done' AND tam = 0 ORDER BY id LIMIT 6)`).run();
    const qt = P.admin;
    const rieng = caseChuaCoNguoi(qt, null);
    assert(rieng.length > 0, 'phải có Case chưa người');
    const w = chayTrongRequest('GET', () => myWork(qt, { nguoi: 'tat-ca' })) as any;
    const dong = w.items.filter((i: any) => i.group === 'no_owner');
    const ky = (ds: [number, unknown, unknown][]) => JSON.stringify(ds.sort((a, b) => a[0] - b[0]));
    assert(ky(dong.map((i: any) => [i.caseId, i.classId, i.thieuNguoi?.mon ?? null])) === ky(rieng.map((r: any) => [r.id, r.eff_class_id ?? null, r.thieu === 'chon' ? null : r.mon])),
      `${JSON.stringify(dong.map((i: any) => i.caseId))} ≠ ${JSON.stringify(rieng.map((r: any) => r.id))}`);
    for (const b of ids('SELECT id FROM branches')) {
      const a = chayTrongRequest('GET', () => myWork(qt, { nguoi: 'tat-ca', branchId: b })) as any;
      assert(a.items.filter((i: any) => i.group === 'no_owner').length === caseChuaCoNguoi(qt, b).length, `chi nhánh ${b}`);
    }
  });

  check('TV · em hai ghi danh active: mỗi Case một dòng Thêm PA', () => {
    const r = c().prepare(`SELECT COALESCE(sc.student_id, a.student_id) AS sid FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       WHERE sc.status != 'done' AND sc.kck = 0 AND sc.tam = 0 AND sc.disposition IS NULL AND COALESCE(sc.sos_level, 1) > 0 AND sc.owner_user_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.status != 'cancelled') LIMIT 1`).get() as any;
    assert(r, 'phải có Case chưa PA');
    const e = c().prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status = 'active' LIMIT 1`).get(r.sid) as any;
    const cot = Object.keys(e).filter((k) => k !== 'id' && k !== 'class_id');
    const lopKhac = (c().prepare(`SELECT id FROM classes WHERE id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) LIMIT 1`).get(e.class_id, e.class_id) as any).id;
    c().prepare(`INSERT INTO enrollments (class_id, ${cot.join(', ')}) VALUES (?, ${cot.map(() => '?').join(', ')})`).run(lopKhac, ...cot.map((k) => e[k]));
    const w = chayTrongRequest('GET', () => myWork(P.admin, { nguoi: 'tat-ca' })) as any;
    const khoa = w.items.filter((i: any) => i.group === 'no_plan').map((i: any) => i.key);
    assert(khoa.length > 0 && new Set(khoa).size === khoa.length, `khoá trùng: ${khoa.join(' ')}`);
  });
}
