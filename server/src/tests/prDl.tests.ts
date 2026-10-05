/** PHÉP KIỂM PR-DL — Điểm theo lớp: mã lượt, lượt mặc định, nhãn lượt (chủ sản phẩm 04/10, DL-0). */
import type { YThucTestKit } from './yThuc.tests.ts';

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
}
