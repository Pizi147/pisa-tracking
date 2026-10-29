/**
 * PHÉP KIỂM S5 (giảm phân mảnh câu Turso, PTA 29/10): danh sách `IN (?,?,…)` ở đường nóng → `IN (SELECT value FROM json_each(?))`, MỘT tham số JSON
 * (`DS_JSON` + `theoLoJson`, db.ts). Turso nhóm Top Queries theo chuỗi SQL và bộ nhớ câu PR-BN nhớ từng chuỗi: mỗi độ dài danh sách từng là một chuỗi.
 *   (a) helper mới trả đúng như cách cũ (id số, chuỗi, rỗng, trùng, > 900 phần tử, chia lô);
 *   (b) EXPLAIN QUERY PLAN của mọi câu json_each chạy ở đường nóng: bảng lớn đi chỉ mục, không SCAN; (b2) kế hoạch GIỐNG câu cũ dựng lại từ cùng tham số;
 *   (c) số chuỗi SQL khác nhau ở đường nóng giảm (in số đo trước → sau, trần chỉ hạ).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

/** Bảng lớn — không được SCAN (cả bảng) trong câu json_each. */
const LON = ['assessment_attempts', 'assessment_scores', 'attempt_skills', 'enrollments', 'sos_cases', 'students', 'learning_cycles',
  'case_interventions', 'case_milestones', 'teacher_assignments', 'violations', 'discipline_measures', 'attempt_schedule_history',
  'sos_coordination_actions', 'yeu_cau_duyet', 'lenh_chuyen_lop', 'mini_test', 'journey_events'];
const DS_IN = /\bIN\s*\(\s*\?(?:\s*,\s*\?)*\s*\)/gi;
const JSON_IN = /\(SELECT value FROM json_each\(\?\)\)/g;
const coDs = (s: string) => /\bIN\s*\(\s*\?(?:\s*,\s*\?)*\s*\)/i.test(s);
const coJson = (s: string) => /\(SELECT value FROM json_each\(\?\)\)/.test(s);
/**
 * Trần (c): chuỗi SQL thừa do danh sách `IN (?,?,…)` CÒN LẠI ở đường nóng (lịch kỹ năng / standingFor / danh sách HV — tệp của S1 / S2 / S3; phạm vi
 * `classScopeSql` giữ cách cũ). Đo 29/10: 55 (chạy lẻ) · 60 (sau prDl … prCuoiKhoa); main cùng phép đo ~260 — chỉ hạ.
 */
const TRAN_PHAN_MANH = 60;

export async function runPrS5JsonEachTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  console.log('\nS5 · danh sách IN ở đường nóng thành json_each một tham số');
  const { DS_JSON, LO_JSON, theoLo, theoLoJson } = await import('../db.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');

  const cu = (sql: (ph: string) => string, ds: readonly (number | string)[]) => {
    const out: any[] = [];
    theoLo(ds, (lo, ph) => { out.push(...conn.prepare(sql(ph)).all(...lo)); });
    return out;
  };
  const moi = (sql: (ph: string) => string, ds: readonly (number | string)[], co?: number) => {
    const out: any[] = [];
    let lan = 0;
    theoLoJson(ds, (json) => { lan++; out.push(...conn.prepare(sql(DS_JSON)).all(json)); }, co);
    return { out, lan };
  };
  const khoa = (rows: any[]) => JSON.stringify(rows.map((r) => r.id).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));

  check('S5-a · theoLoJson trả đúng như theoLo: id số / chuỗi / rỗng / trùng / > 900 / chia lô; json_each trả INTEGER cho số', () => {
    const svIds = (conn.prepare('SELECT id FROM students ORDER BY id').all() as any[]).map((r) => r.id as number);
    assert(svIds.length > 20, 'seed thiếu học viên');
    const hv = (ph: string) => `SELECT s.id FROM students s WHERE s.id IN (${ph})`;
    const lon = [...svIds, ...Array.from({ length: 2500 }, (_, i) => 10_000_000 + i)];   // > 900 phần tử, phần lớn không tồn tại
    const tron = [...svIds.slice(0, 5), ...svIds.slice(0, 5), svIds[3]];   // trùng
    for (const [ten, ds] of [['số', svIds.slice(0, 12)], ['trùng', tron], ['> 900', lon], ['rỗng', []]] as [string, number[]][]) {
      const a = cu(hv, ds), b = moi(hv, ds);
      assert(khoa(a) === khoa(b.out), `${ten}: cũ ${a.length} dòng ≠ mới ${b.out.length} dòng`);
      assert(b.lan === Math.ceil(ds.length / LO_JSON), `${ten}: ${b.lan} câu (mong ${Math.ceil(ds.length / LO_JSON)})`);
    }
    assert(moi(hv, lon).out.length === svIds.length, '> 900: phải trả đủ mọi em có thật');
    const lo7 = moi(hv, svIds, 7);
    assert(khoa(lo7.out) === khoa(cu(hv, svIds)) && lo7.lan === Math.ceil(svIds.length / 7), `chia lô 7: ${lo7.lan} câu`);
    const ma = (conn.prepare('SELECT code FROM report_periods ORDER BY id LIMIT 6').all() as any[]).map((r) => r.code as string);
    const tuan = (ph: string) => `SELECT code AS id FROM report_periods WHERE code IN (${ph})`;
    assert(ma.length === 6 && khoa(cu(tuan, [...ma, 'KHONG CO'])) === khoa(moi(tuan, [...ma, 'KHONG CO']).out), 'chuỗi (mã tuần): cũ ≠ mới');
    const kieu = conn.prepare(`SELECT typeof(value) AS k FROM json_each(?)`).all(JSON.stringify([1, 22, 333])) as any[];
    assert(kieu.every((r) => r.k === 'integer'), `json_each phải trả integer cho số: ${JSON.stringify(kieu)}`);
    /* Id dạng chuỗi số vẫn khớp cột INTEGER (ép kiểu theo cột như tham số `?`). */
    assert(moi(hv, svIds.slice(0, 3).map(String)).out.length === 3, 'id chuỗi "12" phải khớp cột INTEGER');
  });

  /* Đường nóng (b, c): GV / QL / TVV / GVCN lớp thường. */
  const lopFt = classId('MB FT 101'), lopThuong = classId('MB FOU 12');
  const hv = (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`).get(lopFt) as any).id;
  const tvv = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
    WHERE r.key = 'consultant' AND b.code = 'CP' ORDER BY ur.user_id LIMIT 1`).get() as any).id;
  const U = { GVCN: P.coreTeacher.userId, GVBM: P.subjectTeacher.userId, QL: P.mbManager.userId, GVCN_THUONG: P.normalCoreTeacher.userId, TVV: tvv };
  const DUONG: [keyof typeof U, string][] = [
    ['GVCN', '/my-work'], ['GVBM', '/my-work'], ['GVCN_THUONG', '/my-work'], ['QL', '/my-work'], ['QL', '/my-work?nguoi=tat-ca'],
    ['GVCN', `/classes/${lopFt}/cham`], ['GVBM', `/classes/${lopFt}/cham`], ['QL', `/classes/${lopFt}/cham`], ['GVCN_THUONG', `/classes/${lopThuong}/cham`],
    ['GVCN', '/tong-quan/lop-toi-day?ct=ft'], ['GVBM', '/tong-quan/lop-toi-day?ct=ft'], ['GVCN_THUONG', '/tong-quan/lop-toi-day?ct=thuong'],
    ['QL', '/tong-quan/v5?ct=ft'], ['QL', '/tong-quan/v5?ct=thuong'], ['QL', '/tong-quan/ql?ct=ft'],
    ['TVV', '/tong-quan/tvv'], ['TVV', '/tong-quan/viec-cua-toi'], ['TVV', '/hoc-vien-lop/theo-vai'],
    ['GVCN', '/hoc-vien-lop'], ['GVBM', '/hoc-vien-lop'], ['QL', '/hoc-vien-lop'], ['QL', '/hoc-vien-lop?phamVi=chi-nhanh'],
    ['GVCN', '/cham/lich-test'], ['QL', '/cham/lich-test'],
    ['GVCN', `/classes/${lopFt}/roster`], ['QL', `/classes/${lopFt}/roster`], ['GVCN', `/students/${hv}`],
  ];
  /* Ghi mọi câu (văn bản + tham số) ở `all` / `run` — `get` của câu dùng lại đi qua `all` (db.ts PR-BN). Gỡ móc ngay sau khi gọi xong. */
  const ghi: { sql: string; args: unknown[] }[] = [];
  const stProto = Object.getPrototypeOf(conn.prepare('SELECT 1'));
  const goc = { all: stProto.all, run: stProto.run };
  const server = createApp().listen(0);
  try {
    for (const m of ['all', 'run'] as const) {
      stProto[m] = function (this: { sql?: string }, ...args: unknown[]) {
        if (this.sql) ghi.push({ sql: this.sql, args });
        return goc[m].apply(this, args);
      };
    }
    const port = (server.address() as any).port as number;
    for (const [vai, url] of DUONG) {
      const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(U[vai])}` } });
      await res.text();
      assert(res.status === 200, `${vai} ${url}: ${res.status}`);
    }
  } finally {
    stProto.all = goc.all; stProto.run = goc.run;
    server.close();
  }
  const jsonCau = ghi.filter((g) => coJson(g.sql));

  check('S5-b · EXPLAIN mọi câu json_each của đường nóng: bảng lớn SEARCH theo chỉ mục / INTEGER PRIMARY KEY, json_each là danh sách IN (LIST SUBQUERY), không SCAN bảng lớn', () => {
    const theoChuoi = new Map(jsonCau.map((g) => [g.sql, g]));
    assert(theoChuoi.size >= 50, `chỉ bắt được ${theoChuoi.size} câu json_each — đường nóng chưa đổi?`);
    /* Các câu nóng chính phải có mặt (điểm / Case theo lượt / phạm vi lớp / Ý thức / phân công). */
    for (const [ten, re] of [
      ['điểm của lượt (diemCuaLuot)', /FROM assessment_scores s\s+LEFT JOIN users u[\s\S]*WHERE s\.attempt_id IN \(SELECT value FROM json_each/],
      ['Case theo lượt (loadBundle)', /FROM sos_cases c[\s\S]*WHERE c\.attempt_id IN \(SELECT value FROM json_each/],
      ['phạm vi lớp (classScopeSql)', /c\.(?:branch_id|id) IN \(SELECT value FROM json_each/],
      ['nạp phạm vi em (napTruocPhamVi)', /FROM students s LEFT JOIN enrollments e ON e\.student_id = s\.id[\s\S]*WHERE s\.id IN \(SELECT value FROM json_each/],
      ['Ý thức (trangThaiYThuc)', /FROM violations WHERE student_id IN \(SELECT value FROM json_each/],
      ['phân công (phanCongDangHieuLuc)', /WHERE ta\.class_id IN \(SELECT value FROM json_each/],
    ] as [string, RegExp][]) assert([...theoChuoi.keys()].some((s) => re.test(s)), `không bắt được câu "${ten}"`);
    const quet: string[] = [];
    let ngoai = 0;
    for (const { sql, args } of theoChuoi.values()) {
      const bang = new Map([...sql.matchAll(/(?:FROM|JOIN)\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/gi)].map((m) => [m[2] ?? m[1], m[1]]));
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (plan.some((d) => /^(?:SCAN json_each|LIST SUBQUERY)/.test(d))) ngoai++;
      for (const d of plan) {
        /* `SEARCH x` không kèm USING = duyệt cả bảng cho từng dòng ngoài. */
        const m = /^(?:SCAN (\w+)|SEARCH (\w+)$)/.exec(d);
        const t = m && (m[1] ?? m[2]);
        if (t && LON.includes(bang.get(t) ?? t)) quet.push(`${d} · ${sql.replace(/\s+/g, ' ').slice(0, 110)}`);
      }
    }
    assert(!quet.length, `còn quét cả bảng lớn:\n        ${quet.join('\n        ')}`);
    assert(ngoai === theoChuoi.size, `json_each phải là danh sách IN (LIST SUBQUERY) ở mọi câu: ${ngoai}/${theoChuoi.size}`);
  });

  check('S5-b2 · kế hoạch mỗi câu json_each GIỐNG câu cũ `IN (?,?,…)` dựng lại từ cùng tham số (cùng bảng, cùng chỉ mục, cùng thứ tự vòng)', () => {
    /* Vị trí `?` ngoài chuỗi '…' và chú thích — để biết tham số nào là danh sách JSON. */
    const viTriHoi = (sql: string) => {
      const out: number[] = [];
      for (let i = 0; i < sql.length; i++) {
        const c = sql[i];
        if (c === "'") { i = sql.indexOf("'", i + 1); if (i < 0) break; continue; }
        if (c === '-' && sql[i + 1] === '-') { i = sql.indexOf('\n', i); if (i < 0) break; continue; }
        if (c === '/' && sql[i + 1] === '*') { i = sql.indexOf('*/', i + 2) + 1; if (i <= 0) break; continue; }
        if (c === '?') out.push(i);
      }
      return out;
    };
    const mang = (plan: string[]) => plan.filter((d) => !/json_each|LIST SUBQUERY|^USE TEMP B-TREE/.test(d)).map((d) => d.replace(/SUBQUERY \d+/, 'SUBQUERY').replace(/subquery-\d+/g, 'subquery')).join(' ; ');
    const lech: string[] = [];
    let soSanh = 0;
    for (const { sql, args } of new Map(jsonCau.map((g) => [g.sql, g])).values()) {
      const hoi = viTriHoi(sql);
      if (hoi.length !== args.length) continue;
      const jsonTai = new Set([...sql.matchAll(JSON_IN)].map((m) => m.index! + m[0].indexOf('?')));
      let cuSql = '', tu = 0;
      const cuArgs: unknown[] = [];
      hoi.forEach((p, k) => {
        if (jsonTai.has(p)) {
          const ds = JSON.parse(args[k] as string) as unknown[];
          const dau = sql.lastIndexOf('(SELECT value FROM json_each(', p);
          cuSql += sql.slice(tu, dau) + `(${ds.map(() => '?').join(',')})`;
          tu = p + '?))'.length;
          cuArgs.push(...ds);
        } else {
          cuSql += sql.slice(tu, p + 1);
          tu = p + 1;
          cuArgs.push(args[k]);
        }
      });
      cuSql += sql.slice(tu);
      const moi = mang((conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail));
      const cu = mang((conn.prepare(`EXPLAIN QUERY PLAN ${cuSql}`).all(...cuArgs) as any[]).map((r) => r.detail));
      soSanh++;
      if (moi !== cu) lech.push(`${sql.replace(/\s+/g, ' ').slice(0, 90)}\n          cũ: ${cu}\n          mới: ${moi}`);
    }
    assert(soSanh >= 50, `chỉ so được ${soSanh} câu`);
    assert(!lech.length, `${lech.length}/${soSanh} câu đổi kế hoạch:\n        ${lech.join('\n        ')}`);
  });

  check(`S5-c · số chuỗi SQL khác nhau ở đường nóng giảm: json_each một chuỗi mỗi câu, danh sách IN (?,?,…) còn lại ≤ ${TRAN_PHAN_MANH}`, () => {
    const chuan = (s: string) => s.replace(DS_IN, 'IN (?…)').replace(JSON_IN, '(?…)');
    /* "Trước" dựng lại từ chính tham số: cách cũ sinh một chuỗi cho mỗi (câu, độ dài từng danh sách) — tham số JSON là danh sách đó. */
    const dai = (a: unknown) => {
      if (typeof a !== 'string' || a[0] !== '[') return null;
      try { return (JSON.parse(a) as unknown[]).length; } catch { return null; }
    };
    const cauCu = (g: { sql: string; args: unknown[] }) => `${g.sql}|${g.args.map(dai).filter((n) => n !== null).join(',')}`;
    const sau = new Set(ghi.map((g) => g.sql)).size;
    const truoc = new Set(ghi.map((g) => (coJson(g.sql) ? cauCu(g) : g.sql))).size;
    const jsonKhac = new Set(jsonCau.map((g) => g.sql)).size;
    const jsonTruoc = new Set(jsonCau.map(cauCu)).size;
    const ds = ghi.filter((g) => coDs(g.sql));
    const conPhanManh = new Set(ds.map((g) => g.sql)).size - new Set(ds.map((g) => chuan(g.sql))).size;
    console.log(`      ${DUONG.length} lượt gọi · ${ghi.length} câu · chuỗi SQL khác nhau: trước ${truoc} → sau ${sau}`
      + ` · câu đã đổi: ${jsonTruoc} chuỗi → ${jsonKhac} · phân mảnh IN còn lại: ${conPhanManh}`);
    /* Một chuỗi json_each phục vụ nhiều độ dài danh sách (trước: mỗi độ dài một chuỗi). */
    const doDai = new Map<string, Set<string>>();
    for (const g of jsonCau) (doDai.get(g.sql) ?? doDai.set(g.sql, new Set()).get(g.sql)!).add(cauCu(g));
    assert([...doDai.values()].some((s) => s.size >= 2), 'không câu json_each nào gặp hai độ dài danh sách — phép đo không chứng minh được gộp chuỗi');
    assert(sau < truoc && jsonKhac < jsonTruoc, `phải giảm: ${truoc} → ${sau}`);
    assert(conPhanManh <= TRAN_PHAN_MANH, `phân mảnh IN (?,?,…) còn lại ${conPhanManh} > trần ${TRAN_PHAN_MANH}`);
  });
}
