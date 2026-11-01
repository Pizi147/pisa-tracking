/**
 * PHÉP KIỂM TL-HVL (TRANG-LON S3, kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`): `/hoc-vien-lop`, `overview`, `roster` dùng chung ghi danh / Case / lượt —
 * không đổi con số, danh sách (`HVL · giống hệt bản chụp`, so với bản chụp `origin/main` — `soGoc.ts`).
 */
import { chupHoacSo } from './soGoc.ts';

export async function runPrTlHvlTests(t: any) {
  const { check, checkAsync, assert, P } = t;
  console.log('\nTL-HVL · Học viên & Lớp, hồ sơ lớp dùng chung ghi danh / Case / lượt');
  const { db } = await import('../db.ts');
  const { chayTrongRequest, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { classOverview, classRoster } = await import('../classes/classes.ts');
  const { danhSachHocVienLop } = await import('../classes/hocVienLop.ts');
  const { createApp } = await import('../app.ts');
  const { demoToday } = await import('../demoConfig.ts');

  const c = () => db() as any;
  const ids = (sql: string, ...a: unknown[]) => (c().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
  const motTrongRequest = (fn: () => unknown) => chayTrongRequest('GET', () => {
    try { return fn(); } catch (e: any) { if (e?.status === 403) return '403'; throw e; }
  });
  const vaiDau = (key: string) => ids(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY 1 LIMIT 1`, key)[0];

  check('HVL · giống hệt bản chụp', () => chupHoacSo('tl-hvl', () => {
    const out: Record<string, unknown> = {};
    const hoSoLop = [P.mbManager.userId, P.admin.userId, P.coreTeacher.userId, P.subjectTeacher.userId, P.normalCoreTeacher.userId] as number[];
    const chiNhanh = [null, ...ids('SELECT id FROM branches ORDER BY id')];
    for (const uid of [...hoSoLop, vaiDau('consultant'), vaiDau('cx'), vaiDau('office_admin')]) {
      const p = loadPrincipal(uid);
      for (const them of [false, true]) {
        out[`hvl:${uid}:-:-:${+them}`] = motTrongRequest(() => danhSachHocVienLop(p, { them }));
        for (const branchId of chiNhanh) out[`hvl:${uid}:chi-nhanh:${branchId ?? '-'}:${+them}`] = motTrongRequest(() => danhSachHocVienLop(p, { phamVi: 'chi-nhanh', branchId, them }));
      }
    }
    /* Cả lớp đã kết thúc (nhánh `finished` của hai hàm) + `kemKetThuc` của Học viên & Lớp. */
    for (const lop of ids('SELECT id FROM classes ORDER BY id')) {
      for (const uid of hoSoLop) {
        const p = loadPrincipal(uid);
        out[`overview:${uid}:${lop}`] = motTrongRequest(() => classOverview(p, lop));
        out[`roster:${uid}:${lop}`] = motTrongRequest(() => classRoster(p, lop));
        out[`rosterKt:${uid}:${lop}`] = motTrongRequest(() => classRoster(p, lop, undefined, true));
      }
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
  const lopFt = ids(`SELECT id FROM classes WHERE code = 'MB FT 101'`)[0];
  const dem = (cau: string[], r: RegExp) => cau.filter((x) => r.test(x)).length;

  await checkAsync('H1 · /classes/{lopFT}/overview QL: ghi danh một câu, listCases một lần, câu ≤ 32', async () => {
    const { cau } = await doGet(P.mbManager.userId, `/classes/${lopFt}/overview`);
    const gd = cau.filter((x) => /^SELECT [^()]*FROM enrollments/.test(x)), lc = dem(cau, /^SELECT sc\.\*, COALESCE\(sc\.student_id/);
    assert(gd.length <= 1, `${gd.length} câu ghi danh: ${gd.map((x) => x.slice(0, 100)).join(' | ')}`);
    assert(lc <= 1, `listCases ${lc} lần`);
    assert(cau.length <= 32, `${cau.length} câu`);
  });

  await checkAsync('H1 · /classes/{lopFT}/roster QL: câu ≤ 22, bảng lớp + điểm + Case mở không đọc lại', async () => {
    const { cau } = await doGet(P.mbManager.userId, `/classes/${lopFt}/roster`);
    const lap = [dem(cau, /^SELECT [^()]*FROM classes WHERE id = \?/), dem(cau, /FROM assessment_scores WHERE attempt_id IN/), dem(cau, /^SELECT (sc\.)?student_id, .*FROM sos_cases sc/) - 1];
    assert(lap.every((n) => n <= 0), `đọc lại: lớp ${lap[0]} · điểm ${lap[1]} · Case mở ${lap[2]}`);
    assert(cau.length <= 22, `${cau.length} câu`);
  });

  await checkAsync('H2 · /hoc-vien-lop QL: Case chi tiết + Ý thức + tiến độ lớp mỗi thứ một lượt, phân công một câu, câu ≤ 46 (them=1 ≤ 47)', async () => {
    for (const [url, tran] of [['/hoc-vien-lop?phamVi=chi-nhanh&branchId=1', 46], ['/hoc-vien-lop?phamVi=chi-nhanh&branchId=1&them=1', 47]] as [string, number][]) {
      const { cau } = await doGet(P.mbManager.userId, url);
      const so = { 'Case chi tiết': dem(cau, /^SELECT id, title, system_close_reason, cycle_id FROM sos_cases WHERE id IN/), 'Ý thức': dem(cau, /^SELECT 0 AS loai, id AS id/),
        'tiến độ lớp': dem(cau, /^SELECT e\.class_id, COUNT\(\*\) n, SUM/), 'phân công': dem(cau, /^SELECT [^()]*FROM teacher_assignments/) };
      assert(Object.values(so).every((n) => n <= 1), `${url}: ${JSON.stringify(so)}`);
      assert(cau.length <= tran, `${url}: ${cau.length} câu`);
    }
  });

  await checkAsync('H2 · GV không nạp cả bảng phân công: đọc theo lớp của mình', async () => {
    const { cau } = await doGet(P.coreTeacher.userId, '/hoc-vien-lop');
    assert(!cau.some((x) => x.startsWith('SELECT ta.id, ta.class_id, ta.user_id')), 'GV nạp cả bảng phân công');
  });
}
