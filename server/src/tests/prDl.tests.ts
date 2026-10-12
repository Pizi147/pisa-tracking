/** PHÉP KIỂM PR-DL — Điểm theo lớp: mã lượt, lượt mặc định, nhãn lượt (chủ sản phẩm 04/10, DL-0). */
import { createHash } from 'node:crypto';
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
    const m = (ds: object[], homNay = '2026-09-16') => d.luotMacDinh(ds, homNay);
    assert(m([l('mt:1', '2026-06-01', 2), l('mt:2', '2026-07-13', 3), l('mt:3', '2026-08-24', 0)]) === 'mt:2', 'gần nhất còn trống');
    assert(m([l('mt:1', '2026-06-01', 0), l('mt:2', '2026-07-13', 0)]) === 'mt:2', 'hết trống → cuối');
    assert(m([]) === null, 'rỗng');
    // lượt chưa xếp tuần (PR-LM, tuần NULL): lượt có tuần còn trống được ưu tiên; chỉ chọn lượt NULL khi không lượt có tuần nào còn trống
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 1)]) === 'mt:1', 'có tuần ưu tiên hơn NULL');
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'chỉ NULL còn trống');
    assert(m([l('mt:3', null, 0), l('mt:1', '2026-06-01', 0)]) === 'mt:3', 'hết trống → cuối (NULL xếp cuối)');
  });

  check('DL-6b lượt mặc định không chọn bài tương lai khi bài đã qua / tuần này còn ô trống (hôm nay T4 16/09, tuần 14/09)', () => {
    const l = (ma: string, tuanStart: string | null, oTrong: number) =>
      ({ ma, nhan: ma, tuanStart, lichSu: false, duDiem: 0, coLich: 3, oTrong });
    const m = (ds: object[], homNay = '2026-09-16') => d.luotMacDinh(ds, homNay);
    assert(m([l('thuong:progress', '2026-08-24', 1), l('thuong:final', '2026-10-05', 20)]) === 'thuong:progress', '(a) đã qua còn trống thắng tương lai');
    assert(m([l('mt:1', '2026-08-24', 0), l('mt:4', '2026-10-05', 5), l('mt:3', '2026-09-28', 5)]) === 'mt:3', '(b) chỉ tương lai → gần nhất');
    assert(m([l('mt:2', '2026-09-14', 2), l('mt:3', '2026-09-21', 3)]) === 'mt:2', '(c) tuần này thắng tuần sau');
    assert(m([l('mt:2', '2026-09-14', 2), l('mt:3', '2026-09-21', 3)], '2026-09-20') === 'mt:2', '(c) Chủ nhật vẫn thuộc tuần 14/09');
    assert(m([l('mt:2', '2026-09-14', 2), l('mt:3', '2026-09-21', 3)], '2026-09-21') === 'mt:3', '(c) sang Thứ Hai 21/09 → tuần mới');
    assert(m([l('mt:3', null, 2), l('mt:2', '2026-10-05', 3)]) === 'mt:2', '(d) tương lai thắng NULL');
    assert(m([l('mt:3', null, 2), l('mt:1', '2026-09-07', 1), l('mt:2', '2026-10-05', 3)]) === 'mt:1', 'đã qua thắng tương lai và NULL');
    assert(m([l('mt:1', '2026-08-24', 0), l('mt:2', '2026-10-05', 0), l('mt:3', null, 0)]) === 'mt:3', '(e) tất cả đủ → cuối (NULL)');
    assert(m([l('mt:2', '2026-10-05', 0), l('mt:1', '2026-08-24', 0)]) === 'mt:2', '(e) tất cả đủ → cuối theo tuần');
    assert(m([]) === null, 'rỗng');
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
  const bam = (x: unknown) => createHash('sha256')
    /* PR-BV: ô thêm `daChot` ("-" đã chốt, phép kiểm riêng prBv V13) — bỏ khỏi băm để ảnh chụp cũ vẫn chứng minh mọi trường khác không lệch. */
    .update(JSON.stringify(x, (k, v) => (k.endsWith('At') || k === 'chuNhatCuoi' || k === 'daChot' ? undefined : v))).digest('hex').slice(0, 16);
  /*
   * Chụp lại 06/10 (PR-MTa): T1 đổi cờ MT cũ của lượt seed (tuần trước nay là MT thường) và các phép kiểm chạy trước (PR-MT, PR-XLMT, PR-LM)
   * đổi dữ liệu MB FT 101. Không chụp được bằng mã 666dcfbf (gọi `kiemLyDo` đã bỏ ở T7) — băm của mã hiện tại; khẳng định `idsTuan` bên dưới
   * vẫn đối chiếu độc lập tập lượt theo tuần. Chụp lại cho T19 (hạn lớp thường thứ Tư tuần sau, ô trước tuần thi khoá) và T22 (DL-4 xoá rồi nhập lại ô; GVCN sửa ô MT cũ), rà #212 (ô có điểm ở tuần chưa tới khoá; "-" MT cũ).
   * Chụp lại 06/10 (PR-LT3 T18): ô Speaking của Mock không còn `mine`/`viec` của ai (bảng chấm vẫn sửa được — `canEdit` giữ).
   * Chụp lại 08/10 (PR-LCa LCa-1): quyết định Lên FT ở các bộ kiểm chạy trước nay tạo MT0 → id lượt (`attemptId` của Ánh/Bình) dời; MB FT 101 không thêm lượt MT0 nào.
   * Chụp lại 08/10 (PR-LCa migrate prLc): `migrate()` ở bộ kiểm trước đồng bộ lệnh Lên FT ghi thẳng (MB BE 04) → thêm một MT0, id dời; MB FT 101 vẫn 0 MT0.
   * Chụp lại 08/10 (PR-KV): prVaiA (2d)(7b), prDonA (6b), prLt2b (5)(7), prS5fA, prPa dựng MT0 cho em BE (kỳ vọng đầu ra theo MT0) → id lượt dời;
   * bộ demo: Kiều Thảo Nhi (MB FT 101, kết luận Học viên) nay có Case "Kỳ vọng đầu ra chưa đạt · Học viên · S" (§3 "vẫn tạo Case").
   * Chụp lại 08/10 (PR-MTGON): các bộ kiểm chạy trước (PR-MT, PR-XLMT, PR-LM, keHoachTest) đổi theo luật mới — Huỷ MT xoá điểm, Huỷ kỹ năng
   * lúc nào cũng được, dời vượt bị chặn (không còn bỏ lịch lượt sau) → dữ liệu MB FT 101 khác; `idsTuan` bên dưới vẫn đối chiếu độc lập.
   * Chụp lại 12/10 (PR-OV1b): bộ PR-G trong run.ts viết lại theo luật "-" mới — so JSON hai bảng mã cũ / mã mới: chỉ lệch ở các lượt PR-G dựng
   * ("-" trong tuần nay dời ngay thay vì vắng chờ QL; "-" nhập bù = Không dự thi rồi nhập điểm đè; W1 "-" một mình = Không dự thi), không trường nào khác.
   */
  const ANH_CHUP = { tuan: '4885cd20bd6cc544', moi: 'd9dbdea8902f6607' };
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
  const tuanKg = week.ensurePeriod(t.addDays(TODAY, -35));   // FOU: Progress Test tuần học 4 (đã qua), Final Test tuần 8 (chưa tới)
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

  check('DL-3 regularSheet(gvcn, lớp, "progress"): bài Progress Test đã qua có điểm cũ; lịch riêng của lớp vẫn ra đúng bài; em vào sau không có hàng', () => {
    assert(t.addDays(giuaA.week_start, 6) < TODAY, `tiền đề: Progress Test phải đã qua (${giuaA.week_start})`);
    const sh = regular.regularSheet(gvcn, lopT, 'progress', TODAY);
    assert(sh.rows.length === 1 && sh.rows[0].attemptId === giuaA.id && sh.rows[0].kind === 'progress', JSON.stringify(sh.rows.map((r: any) => [r.studentId, r.kind])));
    const sched = new Map(sh.rows[0].skillSchedule.map((k: any) => [k.skill, k]));
    assert((sched.get('reading') as any).weekStart === tuanDoi.weekStart, `Reading theo lịch riêng: ${(sched.get('reading') as any).weekStart}`);
    assert((sched.get('listening') as any).weekStart === giuaA.week_start, 'Listening giữ tuần mặc định');
    const l = sh.rows[0].result.skills.find((k: any) => k.skill === 'listening');
    assert(l && l.score === 31, `điểm cũ Listening: ${JSON.stringify(l)}`);
    assert(!sh.rows.some((r: any) => r.studentId === sidB), 'em vào sau Progress Test không có hàng');
  });

  check('DL-3 regularSheet(gvcn, lớp, "final"): cả hai em, đúng một bài Final Test mỗi em (attempt_no theo từng em, không dùng làm khoá)', () => {
    const sh = regular.regularSheet(gvcn, lopT, 'final', TODAY);
    assert(sh.rows.every((r: any) => r.skillSchedule[0].weekStart > TODAY), 'tiền đề: Final Test chưa thi');
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
      /* Fix 1 (chủ sản phẩm 05/10): lượt là "lịch sử" chỉ khi MỌI attempt (không huỷ) của lượt là lịch sử. */
      const moiLs = get(`SELECT MIN(lich_su) AS m FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND attempt_no = 1 AND status != 'cancelled'`, LOP).m;
      assert(luotCua(ds, 'mt:1').lichSu === (moiLs === 1), `MT1 lichSu ${luotCua(ds, 'mt:1').lichSu} vs MIN(lich_su) ${moiLs}`);
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

    check('DL-5 fix lịch sử theo từng em: lượt toàn lịch sử → lichSu; lượt lẫn → không; hàng bảng mang lichSu của em', () => {
      const lop5 = intake.createClass(P.admin, { code: 'MB FT DL5', branchId: MB, kind: 'FT', route: 'LT1', startDate: tuanNay }).id as number;
      const em = (ten: string) => {
        intake.commitIntake(P.admin, { classId: lop5, rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `dl5-${ten}` });
        const st = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
        const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st).id;
        boLichTuTao(conn, cy);
        luotThu(conn, svc.createAttempt, P.admin, { studentId: st, cycleId: cy, classId: lop5, no: 2, periodId: pid });
        return get('SELECT id FROM assessment_attempts WHERE student_id = ? AND attempt_no = 1', st).id as number;
      };
      const mt1A = em('DL5 Gia');
      const mt1B = em('DL5 Hoa');
      const ls = () => Object.fromEntries(dl.danhSachLuot(P.admin, lop5, TODAY).luot.map((l: any) => [l.ma, l.lichSu]));
      assert(ls()['mt:1'] === true && ls()['mt:2'] === false, `toàn lịch sử: ${JSON.stringify(ls())}`);
      /* Fix 2: cả lượt lịch sử → callout của bảng, KHÔNG chip từng em. */
      assert(dl.bangTheoLuot(P.admin, lop5, 'mt:1', TODAY).ft.rows.every((r: any) => r.lichSu === false), 'lượt toàn lịch sử: không chip từng em');
      conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(mt1B);
      assert(ls()['mt:1'] === false, `lượt lẫn: ${JSON.stringify(ls())}`);
      const hang = dl.bangTheoLuot(P.admin, lop5, 'mt:1', TODAY).ft.rows.map((r: any) => [r.attemptId, r.lichSu]);
      assert(JSON.stringify(hang.sort((x: number[], y: number[]) => x[0] - y[0])) === JSON.stringify([[mt1A, true], [mt1B, false]].sort((x: any, y: any) => x[0] - y[0])),
        `lichSu từng hàng: ${JSON.stringify(hang)}`);
      assert(dl.bangTheoLuot(P.admin, lop5, 'mt:2', TODAY).ft.rows.every((r: any) => r.lichSu === false), 'MT2 không hàng nào lịch sử');
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

    check('DL-6b danhSachLuot lớp thường: Progress Test đã qua còn ô + Final Test chưa tới → macDinh thuong:progress', () => {
      const ds = dl.danhSachLuot(gvcn, lopT, TODAY);
      const g = luotCua(ds, 'thuong:progress'), c = luotCua(ds, 'thuong:final');
      assert(g.oTrong > 0 && g.tuanStart <= week.mondayOf(TODAY) && c.oTrong > 0 && c.tuanStart > week.mondayOf(TODAY), `tiền đề: ${JSON.stringify(ds.luot)}`);
      assert(ds.macDinh === 'thuong:progress', `macDinh ${ds.macDinh}`);
    });

    await t.checkAsync('DL-4 PUT một ô (đường ghi cũ) → oTrong giảm 1; xoá ô đã có điểm không lý do → được (PR-MTa T22)', async () => {
      const truoc = luotCua((await goi(QL.userId, `/classes/${LOP}/diem-theo-luot`)).body, 'mt:2').oTrong;
      const w = await goi(QL.userId, `/attempts/${anh.aid}/scores/reading`, 'PUT', { rawScore: 28 });
      assert(w.status === 200, `PUT reading: ${w.status} ${JSON.stringify(w.body)}`);
      const sau = luotCua((await goi(QL.userId, `/classes/${LOP}/diem-theo-luot`)).body, 'mt:2').oTrong;
      assert(sau === truoc - 1, `oTrong ${truoc} → ${sau}`);
      /* PR-MTa T7 thay RB-5 (sửa điểm — lý do tuỳ chọn); T22 thay "xoá cần lý do": xoá trắng ô cũng tuỳ chọn. Nhập lại 30 cho các phép kiểm sau. */
      const s = await goi(QL.userId, `/attempts/${anh.aid}/scores/listening`, 'PUT', { rawScore: null });
      assert(s.status === 200 && get(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, anh.aid).raw_score === null, `xoá: ${s.status}`);
      assert((await goi(QL.userId, `/attempts/${anh.aid}/scores/listening`, 'PUT', { rawScore: 30 })).status === 200, 'nhập lại');
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

  check('DL-5 dòng phụ nút lượt: "5/8 đủ điểm" (không tuần); không ai có lịch → "chưa ai có lịch"', () => {
    const l = (tuanStart: string | null, duDiem: number, coLich: number) =>
      ({ ma: 'mt:2', nhan: 'MT2', tuanStart, lichSu: false, duDiem, coLich, oTrong: 0 });
    assert(d.dongPhuLuot(l('2026-07-13', 5, 8)) === '5/8 đủ điểm', d.dongPhuLuot(l('2026-07-13', 5, 8)));
    assert(d.dongPhuLuot(l('2026-07-13', 0, 0)) === 'chưa ai có lịch', 'không ai có lịch');
    assert(d.dongPhuLuot(l(null, 2, 3)) === '2/3 đủ điểm', 'tuần NULL');
    const m = (nhan: string, weekStart: string | null) => ({ nhan, weekStart });
    assert(d.dongThiHocVien([m('L', '2026-09-28'), m('R', '2026-09-28'), m('S', '2026-09-28')]) === 'W1 OCT', 'cùng tuần');
    assert(d.dongThiHocVien([m('L', '2026-09-28'), m('R', '2026-09-28'), m('S', '2026-10-05')]) === 'W1 OCT · S W2 OCT', 'lệch kỹ năng');
    assert(d.dongThiHocVien([m('L', null), m('R', null)]) === 'Chưa xếp tuần', 'chưa xếp');
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
      'là MT cũ: nhập bù điểm; "-" là em không dự thi.',   // PR-MTa: "MT cũ"; T23 thay "không nhận dấu".
      'Lớp chưa có lượt Test nào. Xếp lịch ở Kế hoạch Test.', 'role="tablist"', 'colSpan', 'onRetry={'])
      assert(f.includes(chu) || doc('web/src/modules/cham/LuoiFT.tsx').includes(chu), `thiếu: ${chu}`);
    assert(/try\s*\{[^}]*localStorage\.getItem/.test(f) && /try\s*\{[^}]*localStorage\.setItem/.test(f), 'localStorage phải bọc try/catch');
    assert(!/'MT\d|Progress Test|Final Test|lần 2/.test(f), 'nhãn lượt lấy từ máy chủ, không viết cứng');
  });

  check('DL-5 fix: Điểm theo lớp ẩn nút "Tạo bài kiểm tra theo chương trình"; chip "lịch sử" cạnh tên em ở bảng và 375', () => {
    const f = (ten: string) => doc(`web/src/modules/cham/${ten}.tsx`);
    assert(/<LuoiChamLop[^>]*anNutTao/.test(f('DiemTheoLop')), 'DiemTheoLop phải truyền anNutTao');
    const lcl = f('LuoiChamLop');
    assert(/<LuoiThuong[^>]*anNutTao=\{anNutTao\}/.test(lcl) && /<MotKyNang mode="ratio"[^>]*anNutTao=\{anNutTao\}/.test(lcl), 'LuoiChamLop chuyền anNutTao');
    assert(/<LuoiThuong[^>]*anNutTao=\{anNutTao\}/.test(f('MotKyNang')), 'MotKyNang chuyền anNutTao khi quay về LuoiThuong');
    assert(/const nutTao = data\.canPlan && !anNutTao/.test(f('LuoiThuong')), 'LuoiThuong ẩn nút theo anNutTao');
    assert(!/anNutTao/.test(f('ChamDiemPage')) && !/anNutTao/.test(doc('web/src/modules/test/lichTest/LuoiNhung.tsx')), 'trang cũ giữ nút');
    for (const ten of ['LuoiFT', 'MotKyNang']) assert(/row\.lichSu && <NhanCu \/>/.test(f(ten)), `${ten}: chip lịch sử cạnh tên`);  // PR-MTb T2 thay ChipLichSu → NhanCu
  });

  check('DL-5 fix 2 hộp hỏi đổi lượt: chỉ tự chuyển sau "Đợi rồi chuyển"; lưu hỏng bỏ đích chờ; hết lỗi thì hộp đóng', () => {
    const R = d.HOI_DOI_LUOT_RONG;
    assert(JSON.stringify(d.yeuCauDoiLuot('mt:2', false, 0)) === JSON.stringify({ h: R, sang: 'mt:2' }), 'không vướng → sang ngay');
    const dang = d.yeuCauDoiLuot('mt:2', true, 0);
    assert(dang.sang === null && dang.h.hoi === 'mt:2' && !dang.h.cho && !dang.h.chan, `đang lưu → hỏi: ${JSON.stringify(dang)}`);
    const loi = d.yeuCauDoiLuot('mt:2', false, 1);
    assert(loi.sang === null && loi.h.hoi === null && loi.h.chan, `ô chưa lưu → chặn: ${JSON.stringify(loi)}`);
    // (a) chưa bấm "Đợi rồi chuyển": lưu xong cũng không tự nhảy
    const chuaBam = d.buocHoiDoiLuot(dang.h, false, 0);
    assert(chuaBam.sang === null && !chuaBam.h.hoi && !chuaBam.h.chan, `chưa bấm đợi: ${JSON.stringify(chuaBam)}`);
    // đã bấm: còn đang lưu thì chờ; lưu xong thì sang
    const daBam = { ...dang.h, cho: true };
    assert(d.buocHoiDoiLuot(daBam, true, 0).sang === null && d.buocHoiDoiLuot(daBam, true, 0).h === daBam, 'còn đang lưu → chờ');
    assert(d.buocHoiDoiLuot(daBam, false, 0).sang === 'mt:2', 'đã bấm + lưu xong → sang');
    // (b) lưu hỏng: bỏ đích chờ, hộp nói "n ô chưa lưu"; sửa xong ("Lưu lại") thì hộp đóng, KHÔNG tự nhảy
    const hong = d.buocHoiDoiLuot(daBam, false, 1);
    assert(hong.sang === null && hong.h.hoi === null && hong.h.chan, `lưu hỏng: ${JSON.stringify(hong)}`);
    const sauLuuLai = d.buocHoiDoiLuot(hong.h, false, 0);
    assert(sauLuuLai.sang === null && JSON.stringify(sauLuuLai.h) === JSON.stringify(R), `sau Lưu lại: ${JSON.stringify(sauLuuLai)}`);
    assert(d.buocHoiDoiLuot(R, false, 0).h === R, 'rỗng giữ nguyên tham chiếu (không vòng lặp effect)');
  });

  check('DL-5 fix 2 nguồn: hộp lý do mở = ô chưa lưu (chỉ BaoDangLuuContext); blur trước khi xét; lỗi tải lại nền không gỡ lưới', () => {
    const se = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    const hop = se.slice(se.indexOf('export function SuaDiemCoLyDo'));
    assert(/useBaoHopLyDoMo\(busy\)/.test(hop.slice(0, hop.indexOf('return ('))), 'SuaDiemCoLyDo phải gọi useBaoHopLyDoMo(busy)');
    for (const ten of ['setHoiLyDo(true)', '<SuaTieuChi', 'setSua(']) assert(se.includes(ten), `mọi hộp lý do đi qua SuaDiemCoLyDo: ${ten}`);
    const ss = doc('web/src/ui/SaveState.tsx');
    const hook = ss.slice(ss.indexOf('export function useBaoHopLyDoMo'), ss.indexOf('export function useTrangThaiLuuO'));
    assert(/useContext\(BaoDangLuuContext\)/.test(hook) && !/BaoLuuContext\b|useBaoLuu/.test(hook), 'chỉ báo qua BaoDangLuuContext');
    assert(hook.includes('dangGui, dangGui ? 0 : 1)'), 'hộp đang gửi = đang lưu; mở mà chưa gửi = chưa lưu');   // sửa cuối (12): qua useBaoDangLuu
    const f = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(/activeElement[\s\S]{0,160}\.blur\(\)[\s\S]{0,40}requestAnimationFrame\(\(\) => setXet/.test(f), 'blur rồi khung sau mới xét');
    assert(f.includes('role="alert"') && !f.includes('alertdialog'), 'hộp hỏi role="alert"');
    assert(f.includes('ds.error && !ds.data') && f.includes('bang.error && !b ?'), 'ErrorState chỉ khi chưa có dữ liệu');
    assert((f.match(/onMouseDown=\{giuHopLyDo\}/g) ?? []).length === 3, 'thanh lượt (rộng + 375) và hộp hỏi đổi lượt giữ hộp lý do');
    assert(/role="alert"[^>]*onMouseDown=\{giuHopLyDo\}/.test(f), 'nút "Ở lại" / "Đợi rồi chuyển" không huỷ hộp lý do');
  });

  check('DL-5 fix 2 câu chặn gọi đúng tên nút: ô lỗi → "Lưu lại"; hộp lý do → "Lưu"; cả hai nói cả hai; lượt / lớp', () => {
    const c = d.cauChanDoiLuot;
    assert(c(2, 0, 'luot') === '2 ô chưa lưu. Bấm "Lưu lại" ở ô đó rồi mới chuyển lượt.', c(2, 0, 'luot'));
    assert(c(0, 0, 'luot') === '1 ô chưa lưu. Bấm "Lưu lại" ở ô đó rồi mới chuyển lượt.', 'soLoi 0 → 1 như cũ');
    assert(c(1, 1, 'lop') === '1 ô chưa lưu. Bấm "Lưu" trong hộp lý do rồi mới chuyển lớp.', c(1, 1, 'lop'));
    assert(c(3, 1, 'lop') === '3 ô chưa lưu. Bấm "Lưu lại" ở ô lỗi, "Lưu" ở hộp lý do rồi mới chuyển lớp.', c(3, 1, 'lop'));
    assert(c(3, 1, 'luot').endsWith('rồi mới chuyển lượt.'), 'đổi lượt giữ "lượt"');
    const f = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(f.includes("k.startsWith('hop-ly-do:')") && f.includes("doiLop ? 'lop' : 'luot'"), 'DiemTheoLop tách hộp lý do bằng khoá và biết đích lớp');
    assert(/<KhoiDiemLop key=\{data\.id\}/.test(doc('web/src/modules/classes/ClassOverviewPage.tsx')), 'KhoiDiemLop có key theo lớp');
  });

  // ------------------------------------------------------------------ DL-6: hai lối vào
  check('DL-6 tab Test "Điểm theo lớp": /test/diem-lop, giữa Lịch Test và Kế hoạch Test, hiện theo testGrade', () => {
    const nav = (o: object) => ({ ...d.NAV_RONG, test: true, ...o });
    assert(d.tabTestTuDuong('diem-lop') === 'diem-lop', 'đọc tab từ đường dẫn');
    assert(d.tabTestHienThi(nav({ testGrade: true, testPlan: true })).join(',') === 'lich,diem-lop,ke-hoach', 'thứ tự (G4)');
    assert(d.tabTestHienThi(nav({ testGrade: true })).includes('diem-lop'), 'có khi testGrade');
    assert(!d.tabTestHienThi(nav({ testPlan: true })).includes('diem-lop'), 'không có khi chỉ testPlan');
    assert(d.TAB_TEST_LABEL['diem-lop'] === 'Điểm theo lớp' && d.DUONG_TAB_TEST['diem-lop'] === '/test/diem-lop', 'nhãn, đường');
    assert(d.tabTestMacDinh(nav({ testGrade: true })) === 'lich', 'mở Test vẫn vào Lịch Test');
  });

  {
    const perm: any = await import('../permissions.ts');
    const classesSvc: any = await import('../classes/classes.ts');
    const LOP_T = classId('MB FOU 12');
    check('DL-6 coTheXemLuotCham = requireXemLuotCham không ném; hồ sơ lớp có viewer.coTheXemDiem (QL / GV / GVCN / GVCN lớp thường)', () => {
      const nem = (p: any, id: number) => { try { perm.requireXemLuotCham(p, { classId: id }, 'x'); return false; } catch { return true; } };
      const ca: [string, any, number, boolean][] = [
        ['QL MB', P.mbManager, LOP, true], ['GV L/R', P.lrTeacher, LOP, true], ['GVCN', P.coreTeacher, LOP, true],
        ['GVCN lớp thường', P.normalCoreTeacher, LOP_T, true], ['QL CP (ngoài phạm vi)', P.cpManager, LOP, false],
        ['GV L/R lớp không dạy', P.lrTeacher, classId('CP FT 110'), false],
      ];
      for (const [ten, p, id, mong] of ca) {
        assert(perm.coTheXemLuotCham(p, { classId: id }) === mong, `${ten}: coTheXemLuotCham ≠ ${mong}`);
        assert(nem(p, id) === !mong, `${ten}: requireXemLuotCham phải khớp vị từ`);
      }
      for (const [ten, p, id] of ca.filter((c) => c[3])) {
        assert(classesSvc.classOverview(p, id).viewer.coTheXemDiem === true, `${ten}: viewer.coTheXemDiem`);
      }
    });
  }

  /* PR-OV3a (M2 §1): bỏ mục ⋯ "Điểm Test cả lớp / Điểm MT cả lớp" — khối cuối trang mở sẵn (vẫn thu gọn được). */
  check('DL-6 lối vào ở hồ sơ lớp: khối cuối trang MỞ SẴN theo cờ coTheXemDiem, aria-expanded, chip từ danhSachLuot; ⋯ không còn mục Điểm cả lớp', () => {
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(!dt.includes("key: 'diem-lop'") && !/'Điểm (MT|Test) cả lớp'/.test(dt), 'mục ⋯ Điểm cả lớp còn sót');
    const ov = doc('web/src/modules/classes/ClassOverviewPage.tsx');
    for (const chu of ['aria-expanded', 'Điểm Mock Test của lớp', 'còn ${', 'gon', 'duongDiemTheoLuot(', 'data.viewer.coTheXemDiem && <KhoiDiemLop']) assert(ov.includes(chu), `ClassOverviewPage thiếu: ${chu}`);
    assert(/useState\(true\)/.test(ov.slice(ov.indexOf('const [moDiem'), ov.indexOf('const [moDiem') + 60)), 'khối điểm phải mở sẵn');
    assert(/daMo && <DiemTheoLop/.test(ov) && /if \(mo && !daMo\) setDaMo\(true\)/.test(ov) && ov.includes('hidden={!mo}'),
      'thu gọn chỉ ẩn, không gỡ (giữ ô đang gõ)');
  });

  check('DL-6 TabDiemLop: danh sách lopCuaToi, lớp chọn ở ?lop=, 375 thành ô chọn; TestPage gắn tab', () => {
    const f = doc('web/src/modules/test/TabDiemLop.tsx');
    for (const chu of ["'/diem-theo-lop/lop'", "get('lop')", '<select', '<DiemTheoLop', 'aria-current', 'Lớp · còn ô trống', 'aria-label="Danh sách lớp"', ' trống', "'đủ'"]) assert(f.includes(chu), `TabDiemLop thiếu: ${chu}`);
    assert(/tab === 'diem-lop' && <TabDiemLop/.test(doc('web/src/modules/test/TestPage.tsx')), 'TestPage gắn tab');
    assert(!f.includes('Lớp tôi dạy') && !f.includes('Lớp của tôi'), 'tiêu đề trung tính (QL/GVCN không "dạy")');
    assert(f.includes('grid grid-cols-1 items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]'), '375: lưới một cột minmax(0,1fr), không tràn ngang');
  });

  check('DL-6 fix: đổi lớp đi CÙNG đường chặn với đổi lượt (CongRoi); danh sách + ô chọn lớp giữ hộp lý do; số ô trống tải lại sau khi lưu', () => {
    const f = doc('web/src/modules/test/TabDiemLop.tsx');
    assert(/congRoi=\{cong\}/.test(f) && /cong\.current\.roi\(sang\)/.test(f), 'đổi lớp gọi CongRoi.roi');
    assert((f.match(/onMouseDown=\{giu\}/g) ?? []).length === 3 && f.includes('cong.current?.giu(e)'), 'hàng lọc, danh sách lớp và ô chọn 375 chặn mousedown');
    const dt = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(/roi: \(lam\) => \{ dichNgoai\.current = lam; doiLuot\(DICH_NGOAI\); \}, giu: giuHopLyDo/.test(dt), 'roi đi qua doiLuot (blur + yeuCauDoiLuot)');
    assert(/if \(ma === DICH_NGOAI\) \{ dichNgoai\.current\?\.\(\); return; \}/.test(dt), 'sang đích ngoài chạy hành động đổi lớp');
    assert(d.docMaLuot('ngoai') === null, 'mã đích ngoài không trùng mã lượt');
    /* Đợt sửa cuối (final review #2): không tải lại mỗi ô nữa — xem phép kiểm "DL fix cuối (2)". */
  });

  // ------------------------------------------------------------------ đợt sửa cuối (final review + audit + ponytail-review)
  check('DL fix cuối (1) lượt mở ban đầu chốt MỘT lần (bản tải mới) — lưu ô làm macDinh đổi không tự nhảy bảng, đổi lượt chỉ qua đường chặn', () => {
    const f = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(/useEffect\(\(\) => \{ if \(luot && luot !== chon && !ds\.refreshing\) setChon\(luot\); \}, \[luot, chon, ds\.refreshing\]\)/.test(f), 'chốt lượt đang hiện vào chon');
    assert(/useState<string \| null>\(luotBanDau \?\? null\)/.test(f), 'tôn trọng luotBanDau');
    assert((f.match(/setChon\(/g) ?? []).length === 2, 'chỉ hai chỗ đặt chon: chốt ban đầu + `sang` (sau đường chặn)');
  });

  check('DL fix cuối (2) danh sách lớp /diem-theo-lop/lop tải lại GỘP 1,5 s sau lần lưu cuối (dùng chung cơ chế Lịch Test Q14), không mỗi ô', () => {
    for (const ten of ['fasttrack/ScoreEntry', 'cham/LuoiThuong', 'fasttrack/HopThaoTacMt'])
      assert(!doc(`web/src/modules/${ten}.tsx`).includes("invalidate('/diem-theo-lop')"), `${ten}: còn invalidate('/diem-theo-lop')`);
    const ua = doc('web/src/lib/useApi.ts');
    assert(/export function useGopTaiLai\(reload: \(\) => void\)/.test(ua) && ua.includes('GOP_TAI_LAI_MS = 1500'), 'useGopTaiLai ở useApi.ts');
    const lt = doc('web/src/modules/test/LichTestTab.tsx');
    assert(lt.includes('const baoDaLuu = useGopTaiLai(reload);') && !lt.includes('GOP_TAI_LAI_MS'), 'Lịch Test dùng chung useGopTaiLai');
    const tab = doc('web/src/modules/test/TabDiemLop.tsx');
    assert(tab.includes('useGopTaiLai(reload)') && /<DiemTheoLop[^>]*onDaLuu=\{/.test(tab), 'TabDiemLop gộp tải lại danh sách lớp');
    const dt = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(dt.includes('const daLuuO = () => { bang.reload(); onDaLuu?.(); };') && /<LuoiChamLop[^>]*onReload=\{daLuuO\}/.test(dt), 'lưu ô báo onDaLuu');
  });

  check('DL fix cuối (4) chip lịch sử: truy vấn lich_su bỏ attempt đã huỷ', () => {
    assert(/lich_su = 1 AND status != 'cancelled'/.test(doc('server/src/cham/diemTheoLuot.ts')), 'thiếu status != cancelled');
  });

  check('DL fix cuối (5–7) audit: bỏ card lồng < md; chip lịch sử xuống dòng phụ; tab chọn chữ phụ ≥ 4,5:1; hộp chặn không aria-label', () => {
    const f = doc('web/src/modules/cham/DiemTheoLop.tsx');
    assert(f.includes('<Card className="max-md:border-0 max-md:bg-transparent" bodyClass="md:p-4">'), 'màn hẹp: bỏ đệm card ngoài');
    assert(/on \? 'text-slate-400' : 'text-slate-500'/.test(f), 'dòng phụ tab chọn: text-slate-400 (--text-dim, tối 5,07:1, sáng 6,75:1)');
    assert(f.includes('role="alert"') && !/role="alert"[^>]*aria-label/.test(f), 'role="alert" không aria-label');
    const ft = doc('web/src/modules/cham/LuoiFT.tsx');
    const dongTen = ft.slice(ft.indexOf('to={duongDotTest({ id: row.attemptId })}'), ft.indexOf('{maHocVienNgan(row.studentCode)}'));
    assert(!dongTen.includes('NhanCu') && /\{maHocVienNgan\(row\.studentCode\)\}<\/span>\s*\{row\.lichSu && <NhanCu \/>\}/.test(ft), 'LuoiFT: chip lịch sử ở dòng mã HV');  // PR-MTb T2 thay ChipLichSu → NhanCu
    const mk = doc('web/src/modules/cham/MotKyNang.tsx');
    assert(/luu=\{<>\{row\.lichSu && <NhanCu \/>\}<DauLuu/.test(mk) && !/nhan=\{<>\{row\.lichSu/.test(mk), 'MotKyNang: chip lịch sử ở dòng phụ');  // PR-MTb T2 thay ChipLichSu → NhanCu
  });

  {
    const perm: any = await import('../permissions.ts');
    check('DL fix cuối (10) scopeXemLuotCham = scopeFor(ATTEMPT_VIEW) + lớp FT GV Speaking chấm S chéo', () => {
      for (const p of [P.mbManager, P.lrTeacher, P.coreTeacher, P.cpManager]) {
        const s = perm.scopeFor(p, d.PERMISSIONS.ATTEMPT_VIEW);
        const x = perm.scopeXemLuotCham(p, TODAY);
        assert(x.all === s.all && x.none === s.none && s.classIds.every((id: number) => x.classIds.includes(id)), 'phải chứa scopeFor');
        if (!s.all) for (const id of perm.lopFtChoGvSpeaking(p, TODAY)) assert(x.classIds.includes(id), `thiếu lớp chấm S chéo ${id}`);
      }
    });
  }
}
