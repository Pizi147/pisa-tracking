/** PHÉP KIỂM PR-DL — Điểm theo lớp: mã lượt, lượt mặc định, nhãn lượt (chủ sản phẩm 04/10, DL-0). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrDlTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-DL · Điểm theo lớp');

  check('DL-1 mã lượt đọc/viết hai chiều; sai dạng → null (lớp thường không có số lượt)', () => {
    for (const s of ['mt:1', 'mt:12', 'thuong:progress', 'thuong:final']) {
      const m = d.docMaLuot(s);
      assert(m !== null && d.vietMaLuot(m) === s, `${s} → ${JSON.stringify(m)}`);
    }
    for (const s of ['', 'mt:0', 'mt:-1', 'mt:x', 'thuong:mid', 'thuong:final:1', 'mt:01', 'mt:2;drop', 'mt:1.5', 'MT:1', ' mt:1'])
      assert(d.docMaLuot(s) === null, `"${s}" phải là null`);
  });

  check('DL-1 lượt mặc định = gần nhất còn ô trống; hết ô trống → lượt cuối; rỗng → null', () => {
    const l = (ma: string, tuanStart: string | null, oTrong: number) =>
      ({ ma, nhan: ma, tuanStart, lichSu: false, duDiem: 0, coLich: 3, oTrong });
    const m = (ds: object[]) => d.luotMacDinh(ds);
    assert(m([l('mt:1', '2026-06-01', 2), l('mt:2', '2026-07-13', 3), l('mt:3', '2026-08-24', 0)]) === 'mt:2', 'gần nhất còn trống');
    assert(m([l('mt:1', '2026-06-01', 0), l('mt:2', '2026-07-13', 0)]) === 'mt:2', 'hết trống → cuối');
    assert(m([]) === null, 'rỗng');
    // lượt chưa xếp tuần (PR-LM, tuần NULL): lượt có tuần còn trống được ưu tiên; chỉ chọn lượt NULL khi không lượt có tuần nào còn trống
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 1)]) === 'mt:1', 'có tuần ưu tiên hơn NULL');
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'chỉ NULL còn trống');
    assert(m([l('mt:3', null, 0), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'hết trống → cuối (NULL xếp cuối)');
  });

  check('DL-1 nhãn lượt (nhanMaLuot; tên nhanLuot đã thuộc fasttrack.ts): MT{n}; lớp thường lấy ATTEMPT_KIND_SHORT', () => {
    assert(d.nhanMaLuot({ loai: 'mt', so: 2 }) === 'MT2', 'MT2');
    assert(d.nhanMaLuot({ loai: 'thuong', kind: 'final' }) === d.ATTEMPT_KIND_SHORT.final, 'final');
    assert(d.nhanMaLuot({ loai: 'thuong', kind: 'progress' }) === d.ATTEMPT_KIND_SHORT.progress, 'progress');
  });

  // ------------------------------------------------------------------ DL-2: classScoreSheet chọn theo tuần hoặc theo số lượt (FT)
  const { conn, P, TODAY, classId, assertThrows } = t;
  const svc: any = await import('../fasttrack/attempts.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const LOP = classId('MB FT 101');
  const QL = P.mbManager;
  const tuanNay = week.mondayOf(TODAY);
  const pid = week.ensurePeriod(tuanNay).id;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => {
    try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); }
  };
  /** Em mới ở MB FT 101: MT1 lịch sử + MT2 tuần này (cùng khuôn `emMoiLop` của prHsm). */
  const emMt2 = (ten: string) => {
    intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `DL ${ten}`, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `dl-${ten}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `DL ${ten}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: st.id, cycleId: cy.id, classId: LOP, no: 2, periodId: pid });
    return { sid: st.id as number, aid: a.id as number };
  };
  const anh = emMt2('Ánh');       // MT2 có một phần điểm
  const binh = emMt2('Bình');     // MT2 chưa xếp tuần (PR-LM: tuần NULL ở đợt và mọi kỹ năng)
  svc.saveScore(QL, anh.aid, 'listening', { rawScore: 30 }, TODAY);
  conn.prepare('UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?').run(binh.aid);
  conn.prepare('UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ?').run(binh.aid);
  /*
   * ẢNH CHỤP TRƯỚC REFACTOR: băm JSON của hai bảng theo tuần (QL tuần này; GVBM L, null = mọi tuần) lấy từ attempts.ts CHƯA sửa,
   * bỏ các trường theo đồng hồ thật (`…At`; `chuNhatCuoi` của MT lịch sử seed = ngày nhập thật). Seed + TODAY cố định nên băm cố định; đổi seed/phép kiểm phía trên
   * làm lệch băm thì chụp lại bằng mã trước refactor (`git show 666dcfbf:server/src/fasttrack/attempts.ts`), không sửa cho khớp.
   */
  const bam = (x: unknown) => (globalThis as any).process.getBuiltinModule('node:crypto').createHash('sha256')
    .update(JSON.stringify(x, (k, v) => (k.endsWith('At') || k === 'chuNhatCuoi' ? undefined : v))).digest('hex').slice(0, 16);
  const ANH_CHUP = { tuan: 'ff67960c2e85730b', moi: '8222c5f2ca493255' };
  /* Mã cố ý độc lập với hàm: điều kiện lọc tuần của bản trước refactor, viết lại bằng SQL. */
  const idsTuan = (periodId: number) => (conn.prepare(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id
      WHERE a.class_id = ? AND a.status != 'cancelled'
        AND (a.planned_period_id = ? OR EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1 AND k.planned_period_id = ?))
      ORDER BY a.id`).all(LOP, periodId, periodId) as any[]).map((r) => r.id).join(',');
  const idsCua = (sheet: any) => sheet.rows.map((r: any) => r.attemptId).sort((x: number, y: number) => x - y).join(',');

  check('DL-2 classScoreSheet theo lượt: đúng mọi attempt MT2 của lớp, kể cả tuần NULL; ô đã có điểm mang điểm cũ; không lọc tuần', () => {
    const sheet = svc.classScoreSheet(QL, LOP, { theo: 'luot', attemptNo: 2 }, TODAY);
    const mong = (conn.prepare(
      `SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'mock' AND a.attempt_no = 2 AND a.status != 'cancelled' ORDER BY a.id`,
    ).all(LOP) as any[]).map((r) => r.id).join(',');
    assert(idsCua(sheet) === mong, `${idsCua(sheet)} ≠ ${mong}`);
    assert(sheet.rows.every((r: any) => r.attemptNo === 2), 'có hàng không phải MT2');
    assert(sheet.rows.some((r: any) => r.attemptId === binh.aid), 'thiếu lượt tuần NULL');
    const l = sheet.rows.find((r: any) => r.attemptId === anh.aid)?.cells.find((c: any) => c.skill === 'listening');
    assert(l && l.rawScore === 30, `ô L của Ánh: ${JSON.stringify(l)}`);
    assert(sheet.period === null, 'theo lượt không có tuần');
    const mt1 = svc.classScoreSheet(QL, LOP, { theo: 'luot', attemptNo: 1 }, TODAY);
    assert(mt1.rows.some((r: any) => r.studentId === anh.sid) && mt1.rows.every((r: any) => r.attemptNo === 1), 'MT1 lịch sử phải có');
  });

  check('DL-2 classScoreSheet theo tuần: cùng kết quả như trước refactor (ảnh chụp); số/null và {theo:"tuan"} như nhau', () => {
    const cu = svc.classScoreSheet(QL, LOP, pid, TODAY);
    const moi = svc.classScoreSheet(P.lrTeacher, LOP, null, TODAY);
    assert(bam(cu) === ANH_CHUP.tuan && bam(moi) === ANH_CHUP.moi, `ảnh chụp lệch: tuan=${bam(cu)} moi=${bam(moi)}`);
    assert(idsCua(cu) === idsTuan(pid), `${idsCua(cu)} ≠ ${idsTuan(pid)}`);
    assert(!cu.rows.some((r: any) => r.attemptId === binh.aid), 'lượt tuần NULL không thuộc tuần nào');
    assert(JSON.stringify(svc.classScoreSheet(QL, LOP, { theo: 'tuan', periodId: pid }, TODAY)) === JSON.stringify(cu), 'theo tuần khác số');
    assert(JSON.stringify(svc.classScoreSheet(QL, LOP, { theo: 'tuan', periodId: null }, TODAY)) === JSON.stringify(svc.classScoreSheet(QL, LOP, null, TODAY)), 'null khác');
  });

  check('DL-2 GV ngoài lớp → 403 trước mọi truy vấn dữ liệu HV (cả hai cách chọn)', () => {
    /* GV chỉ dạy lớp chi nhánh khác (CP): không phân công ở lớp, không phải GV Speaking cùng chi nhánh. */
    const gv = get(`SELECT ta.user_id AS id FROM teacher_assignments ta WHERE ta.status = 'active' GROUP BY ta.user_id
      HAVING SUM(ta.class_id IN (SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code <> 'CP')) = 0 LIMIT 1`);
    assert(gv, 'seed thiếu GV chỉ dạy ở CP');
    const ngoai = loadPrincipal(gv.id);
    const goc = conn.prepare;
    for (const chon of [pid, { theo: 'luot', attemptNo: 2 }]) {
      const sql: string[] = [];
      conn.prepare = (s: string) => { sql.push(s); return goc.call(conn, s); };
      try { assert(maLoi(() => svc.classScoreSheet(ngoai, LOP, chon, TODAY)) === 403, `không 403: ${JSON.stringify(chon)}`); }
      finally { conn.prepare = goc; }
      const lo = sql.filter((s) => /assessment_attempts|assessment_scores|\bstudents\b/.test(s));
      assert(lo.length === 0, `truy vấn HV trước khi kiểm quyền: ${lo.map((s) => s.slice(0, 80)).join(' | ')}`);
    }
  });

  check('DL-2 lượt sai (attemptNo không phải số nguyên dương) → 400', () => {
    for (const n of [0, -1, 1.5, NaN]) assertThrows(() => svc.classScoreSheet(QL, LOP, { theo: 'luot', attemptNo: n }, TODAY), /lượt/i, `attemptNo ${n}`);
  });

  // ------------------------------------------------------------------ DL-3: regularSheet chọn bài theo `kind` (lớp thường; DL-0: không có attemptNo)
  const regular: any = await import('../normal/regular.ts');
  const MB = get("SELECT id FROM branches WHERE code = 'MB'").id as number;
  const tuanKg = week.ensurePeriod(t.addDays(TODAY, -35));   // FOU: Giữa khoá tuần học 4 (đã qua), Cuối khoá tuần 8 (chưa tới)
  const lopT = intake.createClass(P.admin, { code: 'MB FOU DL3', branchId: MB, kind: 'FOU', startPeriodId: tuanKg.id, startDate: tuanKg.weekStart }).id as number;
  const nowIso = new Date().toISOString();
  conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?, NULL, 1, '2026-01-01', 'active', ?)`)
    .run(P.normalCoreTeacher.userId, lopT, nowIso);
  const gvcn = loadPrincipal(P.normalCoreTeacher.userId);
  /* Em A học từ khai giảng: Giữa khoá (đã qua) + Cuối khoá, như `taoLop` của prLt2b. */
  const sidA = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-DL3-A', 'DL3 An', 'dl3 an', ?, 'active', ?)`)
    .run(MB, nowIso).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sidA, lopT, tuanKg.weekStart, nowIso);
  regular.planRegularTests(P.admin, lopT, { studentIds: [sidA] });
  const giuaA = get(`SELECT a.id, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
                      WHERE a.class_id = ? AND a.student_id = ? AND a.kind = 'progress'`, lopT, sidA);
  conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total) VALUES (?,?,?,?)').run(giuaA.id, 'listening', 31, 40);
  /* Lịch riêng của lớp: môn Reading của bài Giữa khoá dời sang tuần sau (attempt_skills khác tuần mặc định của đợt). */
  const tuanDoi = week.ensurePeriod(t.addDays(giuaA.week_start, 7));
  conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'reading'`).run(tuanDoi.id, giuaA.id);
  /* Em B vào lớp HÔM NAY (sau Giữa khoá): đường vào lớp thật tự xếp bài, bỏ mốc đã qua. */
  intake.commitIntake(P.admin, { classId: lopT, rows: [{ fullName: 'DL3 Bảo', email: 'hv@demo.test' }], idempotencyKey: 'dl3-bao' });
  const sidB = get(`SELECT id FROM students WHERE full_name = 'DL3 Bảo'`).id as number;

  check('DL-3 regularSheet(gvcn, lớp, "progress"): bài Giữa khoá đã qua có điểm cũ; lịch riêng của lớp vẫn ra đúng bài; em vào sau không có hàng', () => {
    assert(t.addDays(giuaA.week_start, 6) < TODAY, `tiền đề: Giữa khoá phải đã qua (${giuaA.week_start})`);
    const sh = regular.regularSheet(gvcn, lopT, 'progress', TODAY);
    assert(sh.rows.length === 1 && sh.rows[0].attemptId === giuaA.id && sh.rows[0].kind === 'progress', JSON.stringify(sh.rows.map((r: any) => [r.studentId, r.kind])));
    const sched = new Map(sh.rows[0].skillSchedule.map((k: any) => [k.skill, k]));
    assert((sched.get('reading') as any).weekStart === tuanDoi.weekStart, `Reading theo lịch riêng: ${(sched.get('reading') as any).weekStart}`);
    assert((sched.get('listening') as any).weekStart === giuaA.week_start, 'Listening giữ tuần mặc định');
    const l = sh.rows[0].result.skills.find((k: any) => k.skill === 'listening');
    assert(l && l.score === 31, `điểm cũ Listening: ${JSON.stringify(l)}`);
    assert(!sh.rows.some((r: any) => r.studentId === sidB), 'em vào sau Giữa khoá không có hàng');
  });

  check('DL-3 regularSheet(gvcn, lớp, "final"): cả hai em, đúng một bài Cuối khoá mỗi em (attempt_no theo từng em, không dùng làm khoá)', () => {
    const sh = regular.regularSheet(gvcn, lopT, 'final', TODAY);
    assert(sh.rows.every((r: any) => r.skillSchedule[0].weekStart > TODAY), 'tiền đề: Cuối khoá chưa thi');
    const ids = sh.rows.map((r: any) => r.studentId).sort((x: number, y: number) => x - y);
    assert(JSON.stringify(ids) === JSON.stringify([sidA, sidB].sort((x, y) => x - y)) && sh.rows.every((r: any) => r.kind === 'final'), JSON.stringify(sh.rows.map((r: any) => [r.studentId, r.kind])));
    const so = new Map(sh.rows.map((r: any) => [r.studentId, get('SELECT attempt_no FROM assessment_attempts WHERE id = ?', r.attemptId).attempt_no]));
    assert(so.get(sidA) === 2 && so.get(sidB) === 1, `attempt_no: ${JSON.stringify([...so])}`);
  });

  // ------------------------------------------------------------------ DL-4: dịch vụ + ba đường đọc điểm theo lượt
  const dl: any = await import('../cham/diemTheoLuot.ts');
  const { createApp } = await import('../app.ts');
  const { can } = await import('../permissions.ts');
  /* Em ở MB FT 101 KHÔNG có MT2: bỏ lịch tự tạo, chỉ MT1 lịch sử. */
  intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: 'DL Chi', target: 6.5, email: 'hv@demo.test' }], idempotencyKey: 'dl-chi' });
  const chi = get(`SELECT id FROM students WHERE full_name = 'DL Chi'`).id as number;
  const cyChi = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", chi).id;
  boLichTuTao(conn, cyChi);
  conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(svc.createAttempt(P.admin, { studentId: chi, cycleId: cyChi, attemptNo: 1, periodId: pid }).id);
  const gvNgoai = loadPrincipal(get(`SELECT ta.user_id AS id FROM teacher_assignments ta WHERE ta.status = 'active' GROUP BY ta.user_id
    HAVING SUM(ta.class_id IN (SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code <> 'CP')) = 0 LIMIT 1`).id);
  const soAttempt = () => get('SELECT COUNT(*) AS n FROM assessment_attempts').n as number;
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const cookie = new Map<number, string>();
  const goi = async (uid: number, url: string, method = 'GET', body?: unknown) => {
    if (!cookie.has(uid)) {
      const ss = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: uid }) });
      cookie.set(uid, (ss.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method, headers: { 'content-type': 'application/json', cookie: cookie.get(uid)! }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: await r.json().catch(() => null) as any };
  };
  const luotCua = (ds: any, ma: string) => ds.luot.find((l: any) => l.ma === ma);
  try {
    await t.checkAsync('DL-4 quyền: GV dạy lớp (không có PLAN_WEEK) đọc được; GV lớp khác 403; QL chi nhánh khác 403', async () => {
      const gv = P.lrTeacher;
      assert(!can(gv, d.PERMISSIONS.PLAN_WEEK, { classId: LOP }), 'tiền đề: GV không có PLAN_WEEK');
      const a = await goi(gv.userId, `/classes/${LOP}/diem-theo-luot`);
      assert(a.status === 200 && a.body.mode === 'ielts_band' && a.body.luot.length > 0, `GV dạy lớp: ${a.status} ${JSON.stringify(a.body)?.slice(0, 200)}`);
      const b = await goi(gv.userId, `/classes/${LOP}/diem-theo-luot/mt:2`);
      assert(b.status === 200 && b.body.ft.rows.length > 0, `GV đọc bảng MT2: ${b.status}`);
      for (const [ai, ng] of [['GV lớp khác', gvNgoai], ['QL CP', P.cpManager]] as const) {
        assert((await goi(ng.userId, `/classes/${LOP}/diem-theo-luot`)).status === 403, `${ai} đọc danh sách lượt không 403`);
        assert((await goi(ng.userId, `/classes/${LOP}/diem-theo-luot/mt:2`)).status === 403, `${ai} đọc bảng không 403`);
      }
    });

    await t.checkAsync('DL-4 tham số luot: sai dạng 400; lượt không có 404; sai họ lớp 400', async () => {
      const r = async (lop: number, ma: string) => goi(QL.userId, `/classes/${lop}/diem-theo-luot/${encodeURIComponent(ma)}`);
      const x = await r(LOP, 'mt:abc');
      assert(x.status === 400 && /Mã lượt không hợp lệ/.test(JSON.stringify(x.body)), `mt:abc: ${x.status} ${JSON.stringify(x.body)}`);
      const y = await r(LOP, 'mt:9');
      assert(y.status === 404 && /Lớp chưa có lượt này/.test(JSON.stringify(y.body)), `mt:9: ${y.status} ${JSON.stringify(y.body)}`);
      assert((await r(LOP, 'thuong:final')).status === 400, 'lớp FT + thuong:final phải 400');
      assert((await r(lopT, 'mt:2')).status === 400, 'lớp thường + mt:2 phải 400');
      assert((await r(lopT, 'thuong:progress')).status === 200, 'lớp thường + thuong:progress 200');
    });

    check('DL-4 kiểm quyền trước mọi truy vấn dữ liệu HV (danhSachLuot, bangTheoLuot)', () => {
      const goc = conn.prepare;
      for (const fn of [() => dl.danhSachLuot(gvNgoai, LOP, TODAY), () => dl.bangTheoLuot(gvNgoai, LOP, 'mt:2', TODAY)]) {
        const sql: string[] = [];
        conn.prepare = (s: string) => { sql.push(s); return goc.call(conn, s); };
        try { assert(maLoi(fn) === 403, 'không 403'); } finally { conn.prepare = goc; }
        const lo = sql.filter((s) => /assessment_attempts|assessment_scores|attempt_skills|enrollments|\bstudents\b/.test(s));
        assert(lo.length === 0, `truy vấn HV trước khi kiểm quyền: ${lo.map((s) => s.slice(0, 80)).join(' | ')}`);
      }
    });

    check('DL-4 danhSachLuot FT: một lượt mỗi số MT, đếm đúng; macDinh theo luật DL-1; tuần = tuần sớm nhất', () => {
      const ds = dl.danhSachLuot(QL, LOP, TODAY);
      assert(ds.classId === LOP && ds.mode === 'ielts_band', 'đầu');
      const so = (conn.prepare(`SELECT attempt_no AS n, COUNT(*) AS c, MIN(rp.week_start) AS t FROM assessment_attempts a LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' GROUP BY attempt_no ORDER BY attempt_no`).all(LOP) as any[]);
      assert(JSON.stringify(ds.luot.map((l: any) => l.ma).sort()) === JSON.stringify(so.map((r) => `mt:${r.n}`).sort()), 'tập lượt');
      for (const r of so) {
        const l = luotCua(ds, `mt:${r.n}`);
        assert(l.coLich === r.c && l.tuanStart === r.t && l.nhan === `MT${r.n}`, `mt:${r.n} ${JSON.stringify(l)} vs ${JSON.stringify(r)}`);
        assert(l.duDiem <= l.coLich && l.oTrong >= 0, 'đếm âm');
      }
      assert(luotCua(ds, 'mt:1').lichSu === true, 'MT1 có lượt lịch sử');
    });

    check('DL-4 macDinh trên lớp dựng riêng: MT1 đủ, MT2 (tuần này) còn trống, MT3 (tuần sau) đủ → mt:2', () => {
      /* Lớp riêng: MB FT 101 bị các phép kiểm trước thay đổi tuỳ thứ tự chạy, nên không dùng làm mốc cho lượt mặc định. */
      const lop4 = intake.createClass(P.admin, { code: 'MB FT DL4', branchId: MB, kind: 'FT', route: 'LT1', startDate: tuanNay }).id as number;
      intake.commitIntake(P.admin, { classId: lop4, rows: [{ fullName: 'DL4 Dung', target: 6.5, email: 'hv@demo.test' }], idempotencyKey: 'dl4-dung' });
      const st = get(`SELECT id FROM students WHERE full_name = 'DL4 Dung'`).id as number;
      const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st).id;
      boLichTuTao(conn, cy);
      luotThu(conn, svc.createAttempt, P.admin, { studentId: st, cycleId: cy, classId: lop4, no: 2, periodId: pid });
      svc.createAttempt(P.admin, { studentId: st, cycleId: cy, attemptNo: 3, periodId: week.ensurePeriod(t.addDays(tuanNay, 7)).id });
      const du = (no: number) => {
        const k = conn.prepare(`SELECT k.attempt_id, k.skill FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
          WHERE a.class_id = ? AND a.attempt_no = ? AND k.required = 1`).all(lop4, no) as any[];
        for (const r of k) for (const nhap of r.skill === 'writing' ? ['writing1', 'writing2'] : [r.skill]) {
          conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?,?,6)').run(r.attempt_id, nhap);
        }
      };
      du(1); du(3);
      const ds = dl.danhSachLuot(P.admin, lop4, TODAY);
      const tt = ds.luot.map((l: any) => [l.ma, l.oTrong, l.duDiem]);
      assert(luotCua(ds, 'mt:1').oTrong === 0 && luotCua(ds, 'mt:3').oTrong === 0 && luotCua(ds, 'mt:2').oTrong > 0, `tiền đề: ${JSON.stringify(tt)}`);
      assert(luotCua(ds, 'mt:3').duDiem === 1 && luotCua(ds, 'mt:2').duDiem === 0, `duDiem: ${JSON.stringify(tt)}`);
      assert(ds.macDinh === 'mt:2', `macDinh ${ds.macDinh}`);
    });

    check('DL-4 bangTheoLuot FT mt:2: hàng = attempt MT2; HV đang học không có MT2 vào chuaCoLich; không tạo lịch nào', () => {
      const truoc = soAttempt();
      const b = dl.bangTheoLuot(QL, LOP, 'mt:2', TODAY);
      assert(b.mode === 'ielts_band' && b.luot.ma === 'mt:2', 'đầu bảng');
      assert(b.ft.rows.every((r: any) => r.attemptNo === 2) && b.ft.rows.some((r: any) => r.attemptId === binh.aid), 'hàng MT2');
      assert(b.chuaCoLich.some((h: any) => h.studentId === chi && h.fullName === 'DL Chi' && typeof h.studentCode === 'string'), 'Chi phải trong chuaCoLich');
      assert(!b.chuaCoLich.some((h: any) => h.studentId === anh.sid || h.studentId === binh.sid), 'em có MT2 không ở chuaCoLich');
      assert(soAttempt() === truoc, 'đường đọc tạo attempt');
      /* Đếm của lượt khớp đúng số hàng bảng hiện — kể cả khi có em đã lưu trữ (bảng FT không lọc em lưu trữ). */
      assert(b.luot.coLich === b.ft.rows.length, `coLich ${b.luot.coLich} ≠ ${b.ft.rows.length} hàng`);
      try {
        conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(TODAY, binh.sid);
        const b2 = dl.bangTheoLuot(QL, LOP, 'mt:2', TODAY);
        assert(b2.ft.rows.some((r: any) => r.attemptId === binh.aid) && b2.luot.coLich === b2.ft.rows.length,
          `em lưu trữ: coLich ${b2.luot.coLich} ≠ ${b2.ft.rows.length} hàng`);
      } finally { conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(binh.sid); }
    });

    check('DL-4 oTrong/duDiem: ô "-" hợp lệ không tính trống; đủ mọi kỹ năng bắt buộc mới là đủ điểm', () => {
      const ds = dl.danhSachLuot(QL, LOP, TODAY);
      const mt2 = luotCua(ds, 'mt:2');
      /* Tính độc lập: ô nhập của kỹ năng bắt buộc chưa huỷ (Writing FT = W1 + W2) không có điểm, không có "-" đúng tuần của kỹ năng. */
      const o = conn.prepare(`SELECT k.attempt_id, k.skill, k.planned_period_id FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.attempt_no = 2 AND a.status != 'cancelled' AND k.required = 1 AND k.sit_status != 'cancelled'`).all(LOP) as any[];
      const trong = new Map<number, number>();
      for (const k of o) for (const nhap of k.skill === 'writing' ? ['writing1', 'writing2'] : [k.skill]) {
        const sc = get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', k.attempt_id, nhap);
        const xong = sc && (sc.band !== null || sc.raw_score !== null || (sc.no_show_period_id !== null && sc.no_show_period_id === k.planned_period_id));
        trong.set(k.attempt_id, (trong.get(k.attempt_id) ?? 0) + (xong ? 0 : 1));
      }
      const tong = [...trong.values()].reduce((n, x) => n + x, 0);
      assert(mt2.oTrong === tong, `oTrong ${mt2.oTrong} ≠ ${tong}`);
      assert(mt2.duDiem === [...trong.values()].filter((x) => x === 0).length, `duDiem ${mt2.duDiem}`);
      /* Ô "-" đúng tuần của kỹ năng là đã xử lý; "-" của tuần cũ (lịch đã dời) vẫn là ô trống. */
      const tuanS = get(`SELECT planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`, anh.aid).p;
      const oTrongNay = () => luotCua(dl.danhSachLuot(QL, LOP, TODAY), 'mt:2').oTrong;
      try {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id) VALUES (?, 'speaking', ?)`).run(anh.aid, tuanS);
        assert(oTrongNay() === mt2.oTrong - 1, '"-" đúng tuần phải bớt một ô trống');
        conn.prepare(`UPDATE assessment_scores SET no_show_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(week.ensurePeriod(t.addDays(TODAY, -70)).id, anh.aid);
        assert(oTrongNay() === mt2.oTrong, '"-" tuần cũ vẫn là ô trống');
      } finally { conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).run(anh.aid); }
    });

    check('DL-4 lớp thường: lượt thuong:progress / thuong:final theo kind; bảng progress chỉ em có bài; chuaCoLich rỗng', () => {
      const ds = dl.danhSachLuot(gvcn, lopT, TODAY);
      assert(ds.mode === 'ratio' && JSON.stringify(ds.luot.map((l: any) => l.ma).sort()) === '["thuong:final","thuong:progress"]', JSON.stringify(ds.luot));
      assert(luotCua(ds, 'thuong:progress').coLich === 1 && luotCua(ds, 'thuong:final').coLich === 2, 'đếm theo kind');
      assert(luotCua(ds, 'thuong:progress').nhan === d.ATTEMPT_KIND_SHORT.progress, 'nhãn');
      const b = dl.bangTheoLuot(gvcn, lopT, 'thuong:progress', TODAY);
      assert(b.mode === 'ratio' && b.thuong.rows.length === 1 && b.thuong.rows[0].studentId === sidA && b.chuaCoLich.length === 0, 'bảng progress');
    });

    await t.checkAsync('DL-4 PUT một ô (đường ghi cũ) → oTrong giảm 1; sửa ô đã có điểm không lý do bị từ chối (override)', async () => {
      const truoc = luotCua((await goi(QL.userId, `/classes/${LOP}/diem-theo-luot`)).body, 'mt:2').oTrong;
      const w = await goi(QL.userId, `/attempts/${anh.aid}/scores/reading`, 'PUT', { rawScore: 28 });
      assert(w.status === 200, `PUT reading: ${w.status} ${JSON.stringify(w.body)}`);
      const sau = luotCua((await goi(QL.userId, `/classes/${LOP}/diem-theo-luot`)).body, 'mt:2').oTrong;
      assert(sau === truoc - 1, `oTrong ${truoc} → ${sau}`);
      const s = await goi(QL.userId, `/attempts/${anh.aid}/scores/listening`, 'PUT', { rawScore: 35 });
      assert(s.status >= 400 && s.status < 500, `sửa không lý do phải bị từ chối: ${s.status}`);
      assert(get(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, anh.aid).raw_score === 30, 'điểm cũ bị đổi');
    });

    await t.checkAsync('DL-4 /diem-theo-lop/lop: GV thấy lớp mình dạy; GVCN thấy lớp chủ nhiệm; QL thấy lớp chi nhánh; oTrong = tổng các lượt', async () => {
      const ma = (b: any[]) => b.map((l) => l.classId).sort((x: number, y: number) => x - y);
      const gv = await goi(P.lrTeacher.userId, '/diem-theo-lop/lop');
      const day = (conn.prepare(`SELECT DISTINCT ta.class_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.user_id = ? AND ta.status = 'active' AND c.status = 'active' ORDER BY ta.class_id`).all(P.lrTeacher.userId) as any[]).map((r) => r.id);
      assert(gv.status === 200 && JSON.stringify(ma(gv.body)) === JSON.stringify(day), `GV: ${JSON.stringify(ma(gv.body))} ≠ ${JSON.stringify(day)}`);
      const cn = await goi(gvcn.userId, '/diem-theo-lop/lop');
      assert(ma(cn.body).includes(lopT), 'GVCN thấy lớp chủ nhiệm');
      const ql = await goi(QL.userId, '/diem-theo-lop/lop');
      const mb = (conn.prepare(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND c.status = 'active' ORDER BY c.id`).all() as any[]).map((r) => r.id);
      assert(JSON.stringify(ma(ql.body)) === JSON.stringify(mb), 'QL = lớp chi nhánh MB');
      assert(!ma((await goi(gvNgoai.userId, '/diem-theo-lop/lop')).body).includes(LOP), 'GV ngoài không thấy LOP');
      for (const id of [LOP, lopT]) {
        const tong = dl.danhSachLuot(QL, id, TODAY).luot.reduce((n: number, l: any) => n + l.oTrong, 0);
        const dong = ql.body.find((l: any) => l.classId === id);
        assert(dong && dong.oTrong === tong && typeof dong.classCode === 'string' && dong.mode === (id === LOP ? 'ielts_band' : 'ratio'), `lớp ${id}: ${JSON.stringify(dong)} vs ${tong}`);
      }
    });

    await t.checkAsync('DL-4 GV Speaking lớp FT khác cùng chi nhánh (chấm S chéo) thấy lớp ở /diem-theo-lop/lop và đọc được diem-theo-luot', async () => {
      const r = get(`SELECT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.status = 'active' AND ta.skill = 'speaking' AND c.is_fast_track = 1 AND c.branch_id = (SELECT branch_id FROM classes WHERE id = ?)
          AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) LIMIT 1`, LOP, LOP);
      assert(r, 'seed thiếu GV Speaking ở lớp FT khác cùng chi nhánh');
      const gvS = loadPrincipal(r.id);
      assert(!can(gvS, d.PERMISSIONS.ATTEMPT_VIEW, { classId: LOP }), 'tiền đề: không có ATTEMPT_VIEW ở lớp');
      const ds = await goi(gvS.userId, '/diem-theo-lop/lop');
      assert(ds.status === 200 && ds.body.some((l: any) => l.classId === LOP), `không thấy lớp chấm S chéo: ${JSON.stringify(ds.body?.map?.((l: any) => l.classCode))}`);
      assert((await goi(gvS.userId, `/classes/${LOP}/diem-theo-luot`)).status === 200, 'đọc danh sách lượt');
      assert((await goi(gvS.userId, `/classes/${LOP}/diem-theo-luot/mt:2`)).status === 200, 'đọc bảng MT2');
    });
  } finally { may.close(); }

  check('DL-5 dòng phụ nút lượt: "W3 JUL · 5/8 đủ điểm"; không ai có lịch → "chưa ai có lịch"; chưa xếp tuần → chỉ số đủ', () => {
    const l = (tuanStart: string | null, duDiem: number, coLich: number) =>
      ({ ma: 'mt:2', nhan: 'MT2', tuanStart, lichSu: false, duDiem, coLich, oTrong: 0 });
    assert(d.dongPhuLuot(l('2026-07-13', 5, 8)) === 'W3 JUL · 5/8 đủ điểm', d.dongPhuLuot(l('2026-07-13', 5, 8)));
    assert(d.dongPhuLuot(l('2026-07-13', 0, 0)) === 'chưa ai có lịch', 'không ai có lịch');
    assert(d.dongPhuLuot(l(null, 2, 3)) === '2/3 đủ điểm', 'tuần NULL');
  });

  check('DL-5 "Chỉ ô còn trống" (G6): ô bắt buộc chưa huỷ, chưa điểm, không "-" — FT và lớp thường', () => {
    const c = (o: object) => ({ required: true, progress: 'pending', band: null, noShow: null, ...o });
    assert(d.oTrongLuotFt(c({})) && d.oTrongLuotFt(c({ progress: 'lich_su' })), 'trống / lịch sử chưa điểm');
    assert(!d.oTrongLuotFt(c({ band: 6 })) && !d.oTrongLuotFt(c({ noShow: { state: 'x' } })), 'có điểm / có dấu');
    assert(!d.oTrongLuotFt(c({ required: false })) && !d.oTrongLuotFt(c({ progress: 'cancelled' })), 'không bắt buộc / huỷ');
    const r = (lich: object[], diem: Record<string, number | null>) => ({
      skillSchedule: lich, result: { skills: Object.entries(diem).map(([skill, score]) => ({ skill, score })) },
    });
    const s = (skill: string, o: object = {}) => ({ skill, progress: 'pending', noShow: false, movedFrom: null, periodCode: 'P1', ...o });
    assert(d.hangThuongConTrong(r([s('listening'), s('reading')], { listening: 8, reading: null })), 'còn R');
    assert(!d.hangThuongConTrong(r([s('listening'), s('reading', { noShow: true, movedFrom: 'P1' })], { listening: 8, reading: null })), 'R mang "-" đúng tuần');
    assert(d.hangThuongConTrong(r([s('reading', { noShow: true, movedFrom: 'P0' })], { reading: null })), 'R đã dời sang tuần sau vẫn trống');
    assert(!d.hangThuongConTrong(r([s('reading', { progress: 'cancelled' }), s('writing', { progress: 'skipped' })], {})), 'huỷ / không bắt buộc');
  });

  check('DL-5 link "xếp ở panel Lộ trình": hồ sơ HV ?mo=lo-trinh mở sẵn panel Lộ trình (đọc/dựng hai chiều)', () => {
    assert(d.duongHoSoHocVien(5, { mo: 'lo-trinh' }) === '/hoc-vien/5?mo=lo-trinh', d.duongHoSoHocVien(5, { mo: 'lo-trinh' }));
    assert(d.docThamSoHoSo((k: string) => (k === 'mo' ? 'lo-trinh' : null)).mo === 'lo-trinh', 'đọc mo');
    assert(d.docThamSoHoSo((k: string) => (k === 'mo' ? 'x' : null)).mo === undefined, 'mo lạ bỏ qua');
    assert(/p\.mo === 'lo-trinh'/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'hồ sơ HV mở panel theo ?mo=');
  });

  check('DL-5 DiemTheoLop: chữ đúng đặc tả, tablist, hỏi khi còn ô đang lưu, nhớ "Chỉ ô còn trống" bọc try/catch', () => {
    const f = doc('web/src/modules/cham/DiemTheoLop.tsx');
    for (const chu of ['Còn ô đang lưu. Đợi lưu xong rồi chuyển?', 'Chưa có lịch {b!.luot.nhan} — ', 'xếp ở panel Lộ trình', "{ mo: 'lo-trinh' }", 'Chỉ ô còn trống',
      'là lượt lịch sử (trước khi lớp dùng web): nhập bù điểm, không nhận dấu "-".',
      'Lớp chưa có lượt Test nào. Xếp lịch ở Kế hoạch Test.', 'role="tablist"', 'colSpan', 'onRetry={'])
      assert(f.includes(chu) || doc('web/src/modules/cham/LuoiFT.tsx').includes(chu), `thiếu: ${chu}`);
    assert(/try\s*\{[^}]*localStorage\.getItem/.test(f) && /try\s*\{[^}]*localStorage\.setItem/.test(f), 'localStorage phải bọc try/catch');
    assert(!/'MT\d|Giữa khoá|Cuối khoá|lần 2/.test(f), 'nhãn lượt lấy từ máy chủ, không viết cứng');
  });
}
