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
  const { listCases } = await import('../cases/cases.ts');
  const { chiTietCaseMo } = await import('../cases/caseLop.ts');
  const { daiLop } = await import('../classes/daiChuyenLop.ts');
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

  await checkAsync('H2 · /hoc-vien-lop QL: Case chi tiết + Ý thức + tiến độ lớp mỗi thứ một lượt, câu ≤ 48 (them=1 ≤ 49)', async () => {
    for (const [url, tran] of [['/hoc-vien-lop?phamVi=chi-nhanh&branchId=1', 48], ['/hoc-vien-lop?phamVi=chi-nhanh&branchId=1&them=1', 49]] as [string, number][]) {
      const { cau } = await doGet(P.mbManager.userId, url);
      const so = { 'Case chi tiết': dem(cau, /^SELECT id, title, system_close_reason, cycle_id FROM sos_cases WHERE id IN/), 'Ý thức': dem(cau, /^SELECT 0 AS loai, id AS id/),
        'tiến độ lớp': dem(cau, /^SELECT e\.class_id, COUNT\(\*\) n, SUM/) };
      assert(Object.values(so).every((n) => n <= 1), `${url}: ${JSON.stringify(so)}`);
      assert(cau.length <= tran, `${url}: ${cau.length} câu`);
    }
  });

  await checkAsync('H2 · phân công: phạm vi hẹp đọc theo lớp, Toàn hệ thống một câu', async () => {
    const caBang = (cau: string[]) => cau.some((x) => x.startsWith('SELECT ta.id, ta.class_id, ta.user_id'));
    for (const [uid, url] of [[P.coreTeacher.userId, '/hoc-vien-lop'], [P.mbManager.userId, '/hoc-vien-lop?phamVi=chi-nhanh&branchId=1']] as [number, string][]) assert(!caBang((await doGet(uid, url)).cau), `${url}: nạp cả bảng phân công`);
    const { cau } = await doGet(P.admin.userId, '/hoc-vien-lop?phamVi=tat-ca');
    const n = dem(cau, /^SELECT [^()]*FROM teacher_assignments/);
    assert(caBang(cau) && n === 1, `Toàn hệ thống: ${n} câu phân công`);
  });

  check('HVL · chiTietCaseMo không lẫn giữa Case thật và dòng dựng của metrics cùng request', () => {
    const that = (listCases(P.admin, {}).rows as any[]).find((x) => x.status !== 'done' && x.studentId !== null && x.originKind === 'mock' && x.classKind === 'ft');
    assert(that, 'seed phải có Case SOS FT đang mở');
    const ten = chayTrongRequest('GET', () => {
      chiTietCaseMo([{ ...that, classKind: 'normal' }]);
      return chiTietCaseMo([that]).get(that.id)?.tenSos;
    });
    assert(ten, 'Case thật bị lấy kết quả của dòng dựng');
  });

  check('HVL · dải lớp giữ vai GVCN khi người đó đổi góc nhìn (phiên không còn phân công)', () => {
    const gv = (c().prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(lopFt) as any).user_id as number;
    const dai = chayTrongRequest('GET', () => daiLop({ ...loadPrincipal(gv), assignments: [] }, lopFt, { pr: {} as any, ft: true, ct: 'FT' }));
    assert(dai.viewer.laGvcn, 'mất vai GVCN');
  });

  /* DON-NHO-3 (#780 để sau): gọi lẻ (ngoài bộ nhớ request — đường ghi điểm `dotHoanTat`) đọc điểm bằng câu nhẹ như cũ, không câu 5 LEFT JOIN của
     `diemCuaLuot`; trong bộ nhớ request vẫn dùng lại điểm đã đọc (không đọc `assessment_scores` lần hai). Kết quả hai đường như nhau. */
  await checkAsync('HVL · dotHoanTatMany gọi lẻ không chạy câu điểm 5 LEFT JOIN; trong request dùng lại điểm đã nhớ', async () => {
    const { dotHoanTatMany } = await import('../fasttrack/hoanTat.ts');
    const { diemCuaLuot } = await import('../fasttrack/attempts.ts');
    const { trongBoNho } = await import('../platform/nguCanhRequest.ts');
    const conn = c();
    const dem = (mau: RegExp, fn: () => unknown) => {
      const coRieng = Object.prototype.hasOwnProperty.call(conn, 'prepare');
      const goc = conn.prepare;
      let n = 0;
      conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) { if (mau.test(sql)) n += 1; return goc.call(this, sql, ...r); };
      try { fn(); } finally { if (coRieng) conn.prepare = goc; else delete conn.prepare; }
      return n;
    };
    const luot = ids('SELECT id FROM assessment_attempts ORDER BY id LIMIT 40');
    const homNay = demoToday();
    let le: Map<number, unknown> = new Map(), trong: Map<number, unknown> = new Map();
    assert(dem(/LEFT JOIN users pt/, () => { le = dotHoanTatMany(luot, homNay); }) === 0, 'gọi lẻ vẫn chạy câu điểm nặng');
    const lanNang = dem(/LEFT JOIN users pt/, () => trongBoNho(() => { diemCuaLuot(luot); trong = dotHoanTatMany(luot, homNay); }));
    assert(lanNang === 1, `trong request đọc điểm ${lanNang} lần (cần 1 — dùng lại điểm đã nhớ)`);
    assert(JSON.stringify([...le]) === JSON.stringify([...trong]), 'kết quả gọi lẻ khác trong request');
  });
}
