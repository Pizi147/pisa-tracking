/**
 * PHÉP KIỂM PR-OV1b — lỗi 5.2 (4 ca thật lớp CP FT RF 01, log chủ SP 11/10) + dấu "-" = Vắng chốt ngay + Bỏ vắng + dòng lớp "phần của bạn"
 * + migrate prOv1b / lệnh chỉ đọc `kiem-truoc-ov1b`. Mỗi phép kiểm dựng ca của nó trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv1bTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { kiemOLop } = await import('../ops/kiemOLop.ts');
  const { migratePrOv1b, kiemTruocOv1b } = await import('../migrate/prOv1b.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV1b · dấu "-" = Vắng, Không dự thi, Bỏ vắng, dòng lớp phần của bạn, migrate 4 ca thật');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const gvL = P.lrTeacher;
  const gvS = P.sTeacher;
  const gvcn = P.coreTeacher;
  /* Tuần thi dựng ca: W1 NOV 2026 (02–08/11). Trong tuần = thứ Tư 04/11; nhập bù = thứ Tư tuần sau 11/11 (cũng là trong tuần W+1). */
  const WS = '2026-11-02', WS1 = '2026-11-09';
  const TRONG = '2026-11-04', BU = '2026-11-11';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;
  /* OV-1e: tuần trước W (W4 OCT) và tuần sau W1 (W3 NOV) — lịch thi lại đã qua / tuần sau so với hôm nay `BU`. */
  const W0 = week.ensurePeriod('2026-10-26').id as number, W2 = week.ensurePeriod('2026-11-16').id as number;

  /* Lượt MT CUỐI của mỗi em đang học MB FT 101 — không có lượt sau để luật thứ tự đợt (T15) chặn lần dời. */
  const luot = all(
    `SELECT a.id, a.student_id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 4`, lop).map((r) => r.id as number);

  /** Đặt lượt về trạng thái sạch: mọi kỹ năng bắt buộc ở tuần `ws`, chưa điểm, chưa vắng; lượt khác của lớp rời tuần này (hàng lớp chỉ có ca dựng). */
  const dung = (aid: number, pid = W) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(pid, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(pid, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, ...luot);
    xoaNho();
  };
  const ky = (aid: number, s: string) => one('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', aid, s);
  const dau = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);
  const o = (aid: number, s: string, pid: number, today: string, p = P.admin) => (attempts.classScoreSheet(p, lop, pid, today) as any)
    .rows.find((r: any) => r.attemptId === aid)?.cells.find((c: any) => c.skill === s);
  const vang = (aid: number) => (one(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ?`, aid).n as number);

  check('OV1b-0 · tiền đề: đủ 4 lượt MT cuối sạch ở MB FT 101', () => {
    assert(luot.length === 4, `cần 4 lượt, có ${luot.length}`);
  });

  check('OV1b-1 · "-" trong tuần thi: lần 1 dời NGAY sang tuần sau (không chờ Chủ nhật), lần 2 huỷ phần thi', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    let k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `lần 1: ${JSON.stringify(k)}`);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);   // thứ Tư W2 NOV — trong tuần thi mới
    k = ky(a, 'listening');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1, `lần 2 phải huỷ phần thi: ${JSON.stringify(k)}`);
    /* Writing: W1 "-" một mình chưa phải buổi vắng; đủ W1 + W2 "-" mới dời, một lần. */
    attempts.saveScore(P.w1Teacher, a, 'writing1', { noShow: true }, TRONG);
    assert(ky(a, 'writing').planned_period_id === W && ky(a, 'writing').absence_move_count === 0, 'W1 "-" một mình đã dời Writing');
    assert(o(a, 'writing1', W, TRONG).noShow?.state === 'khong-co-bai', 'W1 "-" phải là Không có bài');
    attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: true }, TRONG);
    assert(ky(a, 'writing').planned_period_id === W1 && ky(a, 'writing').absence_move_count === 1, `W1 + W2 "-": ${JSON.stringify(ky(a, 'writing'))}`);
  }));

  check('OV1b-2 · "-" nhập bù sau tuần thi = Không dự thi: không dời, không đếm vắng, không đề nghị, không quá hạn; MT cũ cũng vậy', () => thu(() => {
    const a = luot[1];
    dung(a);
    const sos0 = one('SELECT COUNT(*) n FROM sos_cases').n;
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 0 && k.sit_status === 'scheduled', `không được dời / đếm: ${JSON.stringify(k)}`);
    assert(dau(a, 'listening').no_show_cu === 1, 'phải là Không dự thi (no_show_cu = 1)');
    assert(vang(a) === 0, 'không sinh đề nghị dời');
    const c = o(a, 'listening', W, BU);
    assert(c.noShow?.state === 'khong-du-thi' && !c.overdue, `ô: ${JSON.stringify(c.noShow)} overdue=${c.overdue}`);
    assert(one('SELECT COUNT(*) n FROM sos_cases').n === sos0, 'không tạo Case');
    /* MT cũ: "-" luôn là Không dự thi, kể cả trong tuần. */
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a);
    xoaNho();
    attempts.saveScore(QL, a, 'reading', { noShow: true }, TRONG);
    assert(ky(a, 'reading').planned_period_id === W && dau(a, 'reading').no_show_cu === 1, 'MT cũ "-" phải là Không dự thi');
  }));

  check('OV1b-3 · ca Phượng: "-" vào ô `sat` (điểm đã xoá) vẫn có tác dụng — trong tuần dời, nhập bù Không dự thi, không ô trống', () => thu(() => {
    const a = luot[2];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill IN ('listening', 'reading')`).run(a);
    xoaNho();
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `"-" trên ô sat trong tuần: ${JSON.stringify(k)}`);
    attempts.saveScore(QL, a, 'reading', { noShow: true }, BU);
    const c = o(a, 'reading', W, BU);
    assert(c.noShow?.state === 'khong-du-thi' && !c.overdue, `"-" nhập bù trên ô sat: ${JSON.stringify(c.noShow)} overdue=${c.overdue}`);
  }));

  check('OV1b-4 · Bỏ vắng: GV đúng kỹ năng / GVCN / QL đưa ô về tuần cũ, bộ đếm −1 (không chặn hạn tuần cũ); GV khác thì 403; đã huỷ phần thi chỉ QL', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    const thu6 = '2026-11-13';   // thứ Sáu W2 NOV — đã qua hạn chấm (thứ Tư) của tuần cũ
    const e = loi(() => attempts.saveScore(gvS, a, 'listening', { noShow: false }, thu6));
    assert(e?.status === 403, `GV Speaking bỏ vắng L: ${e?.status} ${e?.message}`);
    assert(o(a, 'listening', W1, thu6, gvL).daChot?.goDuoc === true, 'ô phải cho GV L bỏ vắng');
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, thu6);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 0 && k.sit_status === 'scheduled', `bỏ vắng: ${JSON.stringify(k)}`);
    /* Vắng lần 2 → huỷ phần thi: GV không gỡ, QL "Khôi phục phần thi" (hoặc gỡ). */
    attempts.saveScore(gvcn, a, 'reading', { noShow: true }, TRONG);
    attempts.saveScore(gvcn, a, 'reading', { noShow: true }, BU);
    assert(ky(a, 'reading').sit_status === 'cancelled', 'tiền đề: Reading đã huỷ phần thi');
    const e2 = loi(() => attempts.saveScore(gvcn, a, 'reading', { noShow: false }, BU));
    assert(e2?.status === 403 && /Quản lý/.test(e2.message), `GVCN gỡ "-" phần thi đã huỷ: ${e2?.status} ${e2?.message}`);
    /* Writing đã dời, W1 có điểm ở tuần mới → Bỏ vắng W2 giữ lịch tuần mới (không kéo điểm W1 về tuần cũ). */
    attempts.saveScore(P.w1Teacher, a, 'writing1', { noShow: true }, TRONG);
    attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: true }, TRONG);
    assert(ky(a, 'writing').planned_period_id === W1, 'tiền đề: Writing đã dời');
    attempts.saveScore(QL, a, 'writing1', { criteria: [6, 6, 6, 6] }, BU);
    attempts.saveScore(QL, a, 'writing2', { noShow: false }, BU);
    assert(ky(a, 'writing').planned_period_id === W1 && ky(a, 'writing').absence_move_count === 0 && dau(a, 'writing1').band === 6,
      `Bỏ vắng W2 khi W1 đã có điểm: ${JSON.stringify(ky(a, 'writing'))}`);
  }));

  check('OV1b-5 · ca Thảo: dời lượt về tuần có "-" đã chốt → dấu cũ bỏ, ô là ô cần nhập bình thường (không còn "scheduled + - đã chốt")', () => thu(() => {
    const a = luot[1];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    assert(ky(a, 'listening').planned_period_id === W1, 'tiền đề: L đã dời sang W2 NOV');
    attempts.setPlanningWeek(QL, a, W, 'Dời lượt về tuần cũ');
    assert(ky(a, 'listening').planned_period_id === W, 'L phải về W1 NOV');
    const d = dau(a, 'listening');
    assert(!d?.no_show_period_id, `dấu "-" cũ còn sau khi dời lượt: ${JSON.stringify(d)}`);
    const c = o(a, 'listening', W, TRONG);
    assert(!c.noShow && !c.daChot, `ô phải là ô cần nhập: ${JSON.stringify({ ns: c.noShow, dc: c.daChot })}`);
  }));

  check('OV1b-6 · ca Trâm Anh: lượt mọi phần thi đã huỷ hiện "Đã huỷ phần thi", không là mốc kế tiếp', () => thu(() => {
    assert(dm.nhanLuot('planned', 0, 4, true) === 'Đã huỷ phần thi', `nhãn: ${dm.nhanLuot('planned', 0, 4, true)}`);
    assert(dm.nhanLuot('planned', 0, 4, false) === 'Đã lên lịch', 'lượt thường vẫn "Đã lên lịch"');
    const a = luot[3];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ?`).run(a);
    const n = one(`SELECT COUNT(*) n FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE a.id = ? AND ${dm.MOC_KE_TIEP_SQL('a', 'rp')}`, a, '2026-10-26').n;
    assert(n === 0, 'lượt mọi phần thi đã huỷ vẫn là mốc kế tiếp');
    assert(dm.mocKeTiep([{ status: 'planned', lich_su: 0, weekStart: WS, attempt_no: 3, huyHet: 1 }], '2026-10-26') === null, 'mocKeTiep');
  }));

  check('OV1b-7 · dòng lớp "phần của bạn": GV chỉ thấy "Quá hạn" khi ô CỦA MÌNH quá hạn; QL thấy toàn bộ; "-" một task sau tuần vẫn là xong ở cả hai nơi', () => thu(() => {
    const a = luot[0];
    dung(a);
    const thu5 = '2026-11-12';   // thứ Năm W2 NOV — tuần W1 NOV đã quá hạn chấm (thứ Tư 11/11) một ngày
    const cuaGvL = all(`SELECT DISTINCT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`, lop, gvL.userId)
      .map((r) => r.skill as string);
    for (const k of cuaGvL) {
      if (k === 'listening' || k === 'reading') attempts.saveScore(QL, a, k, { rawScore: 30 }, TRONG);
      else attempts.saveScore(QL, a, k, { criteria: [6, 6, 6, 6] }, TRONG);
    }
    const hang = (p: any) => (canCham.lichTest(p, W, null, thu5, { phamVi: 'tat-ca' }) as any).lop.find((l: any) => l.classId === lop);
    const g = hang(gvL);
    assert(g && g.conBai > 0, `tiền đề: còn ô của GV khác: ${JSON.stringify(g)}`);
    assert(g.quaHan === false, 'GV L đã xong phần mình mà hàng vẫn "Quá hạn"');
    assert(g.phan?.toi?.con === 0 && g.phan?.khac?.con > 0 && g.phan.khac.quaHanNgay === 1, `phần: ${JSON.stringify(g.phan)}`);
    const q = hang(QL);
    assert(q.quaHan === true && q.phan === null, `QL thấy toàn bộ: quaHan=${q.quaHan} phan=${JSON.stringify(q.phan)}`);

    /* Một hàm cho ô và hàng: W1 "-" (W2 chưa nhập) xem sau tuần — ô W1 là Không dự thi, không quá hạn; hàng lớp không đếm W1 là còn. */
    const b = luot[1];
    dung(b);
    if (!cuaGvL.includes('writing1')) attempts.saveScore(P.w1Teacher, b, 'writing1', { noShow: true }, TRONG);
    else attempts.saveScore(QL, b, 'writing1', { noShow: true }, TRONG);
    const c = o(b, 'writing1', W, thu5);
    assert(c.noShow?.state === 'khong-du-thi' && !c.overdue, `ô W1: ${JSON.stringify(c.noShow)} overdue=${c.overdue}`);
    const conTruoc = hang(QL).conBai;
    conn.prepare(`UPDATE assessment_scores SET no_show_period_id = NULL WHERE attempt_id = ? AND skill = 'writing1'`).run(b);
    xoaNho();
    assert(hang(QL).conBai === conTruoc + 1, 'hàng lớp không coi W1 "-" là đã xong');
  }));

  /* ---------------------------------------------------------------- migrate prOv1b: dựng đúng trạng thái cũ của 4 ca */
  const ghiDau = (a: number, s: string, pid: number, o2: { late: number; settled: string | null }) => conn.prepare(
    `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at, no_show_late, no_show_settled_at) VALUES (?,?,?,?,?,?)`,
  ).run(a, s, pid, '2026-11-11T03:00:00.000Z', o2.late, o2.settled);
  const lichSu = (a: number, action: string, field: string, actor: number | null) => conn.prepare(
    `INSERT INTO attempt_schedule_history (attempt_id, action, field, actor_user_id, created_at) VALUES (?,?,?,?,?)`,
  ).run(a, action, field, actor, '2026-11-11T04:00:00.000Z');
  /** "-" nhập bù ở tuần `tru`, đã chốt luật cũ, máy dời Listening sang tuần `doi` (vắng 1, không ai quyết định sau đó). */
  const buDaDoiSang = (a: number, tru: number, doi: number) => {
    ghiDau(a, 'listening', tru, { late: 1, settled: '2026-11-11T03:00:00.000Z' });
    lichSu(a, 'skill_no_show_settled', 'listening', null);
    lichSu(a, 'skill_week_moved_absence', 'listening', null);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, absence_move_count = 1 WHERE attempt_id = ? AND skill = 'listening'`).run(doi, a);
  };

  const dungCaCu = () => {
    const [thao, phuong, chuaChot, buDaDoi] = luot;
    for (const a of luot) dung(a);
    /* Thảo: 5 ô "-" nhập bù đã chốt luật cũ (vắng 1, máy dời W2) rồi người dùng dời cả lượt về W1 → scheduled ở tuần đã qua. */
    for (const s of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) ghiDau(thao, s, W, { late: 1, settled: '2026-11-11T03:00:00.000Z' });
    for (const s of ['listening', 'reading', 'writing', 'speaking']) {
      lichSu(thao, 'skill_no_show_settled', s, null);
      lichSu(thao, 'skill_week_moved_absence', s, null);
      lichSu(thao, 'skill_week_set', s, QL.userId);
    }
    conn.prepare('UPDATE attempt_skills SET absence_move_count = 1 WHERE attempt_id = ?').run(thao);
    /* Phượng: L, R `sat` không điểm, "-" nhập bù chưa chốt. */
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill IN ('listening', 'reading')`).run(phuong);
    for (const s of ['listening', 'reading']) ghiDau(phuong, s, W, { late: 1, settled: null });
    /* "-" trong tuần chưa chốt (luật cũ chờ Chủ nhật) — migrate chốt theo luật mới: vắng lần 1, dời W2. */
    ghiDau(chuaChot, 'listening', W, { late: 0, settled: null });
    /* "-" nhập bù đã chốt và máy đã dời sang tuần ĐÃ QUA (không ai quyết định sau đó) → OV-11e: có lịch thi lại = giữ nguyên, không theo ngày. */
    buDaDoiSang(buDaDoi, W0, W);
    xoaNho();
    return { thao, phuong, chuaChot, buDaDoi };
  };

  check('OV1b-8 · migrate prOv1b dọn đúng 4 ca, in từng ô đổi; chạy lần hai không đổi gì; kiem-truoc-ov1b in đúng danh sách mà không ghi', () => thu(() => {
    const ca = dungCaCu();
    const n0 = one('SELECT total_changes() n').n;
    const truoc = kiemTruocOv1b(conn, BU);
    assert(one('SELECT total_changes() n').n === n0, 'kiem-truoc-ov1b đã ghi DB');
    const applied: string[] = [];
    const doi = migratePrOv1b(conn, applied, BU);
    const khoa = (ds: any[]) => ds.map((d) => `${d.attemptId}:${d.o}`).sort().join(',');
    assert(doi.length > 0 && khoa(truoc) === khoa(doi), `kiem-truoc ≠ migrate:\n${khoa(truoc)}\n${khoa(doi)}`);
    assert(doi.every((d: any) => d.hocVien && d.ma && d.lop && d.luot && d.truoc && d.sau), `dòng thiếu cột: ${JSON.stringify(doi[0])}`);
    /* Thảo: mọi ô Không dự thi, bộ đếm 0, ở nguyên W1, không quá hạn. */
    for (const s of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) assert(dau(ca.thao, s).no_show_cu === 1, `Thảo ${s} chưa Không dự thi`);
    assert(ky(ca.thao, 'listening').absence_move_count === 0 && ky(ca.thao, 'listening').planned_period_id === W, `Thảo L: ${JSON.stringify(ky(ca.thao, 'listening'))}`);
    assert(!o(ca.thao, 'speaking', W, BU).overdue && o(ca.thao, 'speaking', W, BU).noShow?.state === 'khong-du-thi', 'Thảo S còn quá hạn');
    /* Phượng: L, R Không dự thi, không ô trống. */
    assert(o(ca.phuong, 'listening', W, BU).noShow?.state === 'khong-du-thi', 'Phượng L');
    /* "-" chưa chốt trong tuần → vắng lần 1, dời W2. */
    assert(ky(ca.chuaChot, 'listening').planned_period_id === W1 && ky(ca.chuaChot, 'listening').absence_move_count === 1, `chưa chốt: ${JSON.stringify(ky(ca.chuaChot, 'listening'))}`);
    /* OV-11e: nhập bù đã dời bởi máy sang tuần khác (có lịch thi lại, kể cả tuần đó đã qua) → giữ nguyên: lịch W, vắng 1, "-" chưa Không dự thi. */
    const k = ky(ca.buDaDoi, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 1 && dau(ca.buDaDoi, 'listening').no_show_cu === 0, `bù đã dời: ${JSON.stringify(k)}`);
    const n1 = one('SELECT total_changes() n').n;
    const lan2 = migratePrOv1b(conn, [], BU);
    assert(one('SELECT total_changes() n').n === n1 && lan2.every((d: any) => d.sau.startsWith('giữ lịch thi lại')), `chạy lần hai còn đổi: ${lan2.map((d: any) => d.sau).join(' | ')}`);
  }));

  check('OV1e → OV-11e · "-" nhập bù đã chốt, máy dời sang tuần khác (có lịch thi lại) → migrate GIỮ (lịch, lần vắng, "-") dù tuần thi lại là tuần sau, tuần này hay ĐÃ QUA (cả `sat` chưa điểm); kiem-truoc khớp; chạy lại không đổi', () => thu(() => {
    const [nay, sau, qua] = luot;
    for (const a of luot) dung(a);
    buDaDoiSang(nay, W, W1);    // BU = thứ Tư W2 NOV → W1 là tuần hiện tại
    buDaDoiSang(sau, W, W2);
    buDaDoiSang(qua, W0, W);    // tuần thi lại W (W1 NOV) đã qua — đã thi, chờ chấm
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill = 'listening'`).run(qua);
    xoaNho();
    const anh = (a: number) => JSON.stringify([ky(a, 'listening'), dau(a, 'listening')]);
    const truocAnh = new Map([nay, sau, qua].map((a) => [a, anh(a)] as const));
    const truoc = kiemTruocOv1b(conn, BU);
    const applied: string[] = [];
    const doi = migratePrOv1b(conn, applied, BU);
    /* Giữ nguyên từng cột: tuần thi lại, lần vắng 1, "-" đã chốt chưa là Không dự thi — kết quả không phụ thuộc ngày chạy. */
    for (const a of [nay, sau, qua]) assert(anh(a) === truocAnh.get(a), `ca ${a} đã đổi:\n${truocAnh.get(a)}\n${anh(a)}`);
    assert(ky(qua, 'listening').planned_period_id === W && ky(qua, 'listening').sit_status === 'sat' && dau(qua, 'listening').no_show_cu === 0, 'ca đã thi lại (sat) chưa điểm giữ');
    /* Báo cáo: dòng "giữ lịch thi lại <mã tuần>" cho cả ba ca, ở cả migrate lẫn kiem-truoc (cùng danh sách). */
    const dongCua = (ds: any[], a: number) => ds.find((d) => d.attemptId === a && d.o === 'listening');
    for (const [a, ws] of [[nay, WS1], [sau, '2026-11-16'], [qua, WS]] as const) {
      const ma = dm.tuanLich(ws);
      assert(dongCua(doi, a)?.sau === `giữ lịch thi lại ${ma}`, `migrate ${a}: ${JSON.stringify(dongCua(doi, a))}`);
      assert(dongCua(truoc, a)?.sau === `giữ lịch thi lại ${ma}`, `kiem-truoc ${a}: ${JSON.stringify(dongCua(truoc, a))}`);
      assert(applied.some((l) => l.includes(`giữ lịch thi lại ${ma}`)), `báo cáo thiếu dòng giữ ${ma}: ${applied.join(' | ')}`);
    }
    /* Chạy "trước" và "sau" tuần thi lại (hôm nay khác) → cùng danh sách giữ. */
    for (const ngay of ['2026-11-01', '2026-12-01']) {
      const ds = kiemTruocOv1b(conn, ngay);
      for (const a of [nay, sau, qua]) assert(dongCua(ds, a)?.sau.startsWith('giữ lịch thi lại'), `hôm nay ${ngay}: ${JSON.stringify(dongCua(ds, a))}`);
    }
    /* Cùng danh sách ô (cột "sau" của buổi C có sẵn trong seed ở bản chỉ đọc ghi luật — khác bản thật, đã nêu ở đầu prOv1b.ts). */
    const khoa = (ds: any[]) => ds.map((d) => `${d.attemptId}:${d.o}`).sort().join(',');
    assert(khoa(truoc) === khoa(doi), `kiem-truoc ≠ migrate:\n${khoa(truoc)}\n${khoa(doi)}`);
    /* Chạy lại: không ghi gì; chỉ còn hai dòng giữ. */
    const n0 = one('SELECT total_changes() n').n;
    const lan2 = migratePrOv1b(conn, [], BU);
    assert(one('SELECT total_changes() n').n === n0, 'chạy lần hai đã ghi DB');
    assert(lan2.every((d: any) => d.sau.startsWith('giữ lịch thi lại')) && dongCua(lan2, nay) && dongCua(lan2, sau) && dongCua(lan2, qua), `lần hai: ${khoa(lan2)}`);
  }));

  check('OV1b-9 · kiem-o-lop: dòng lịch sử lịch ghi đúng tên thao tác, không "undefined"', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    const ds = kiemOLop(conn, 'MB FT 101') as any[];
    const tru = ds.filter((d) => d.tru).map((d) => d.tru).join(' | ');
    assert(tru && !/undefined/.test(tru) && /skill_week_moved_absence/.test(tru), `lịch sử: ${tru.slice(0, 300)}`);
  }));
}
