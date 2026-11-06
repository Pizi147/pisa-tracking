/**
 * FT-LOP-NGHI (chủ SP 06/11) — "Lớp nghỉ 1 tuần" của lớp Fast Track:
 *  LN-a  xem trước không ghi gì; MT KẾ TIẾP chưa thi +1 tuần, MT sau và phần đã thi đứng yên;
 *  LN-b  vượt ngày thi thật → em giữ nguyên, xem trước nêu lý do;
 *  LN-c  hạn PA (`action_due`) + hạn báo kết quả Case (`follow_until`) +7 ngày, ghi lý do; Báo cáo PH / Ý thức / bàn giao không đổi;
 *  LN-d  quyền: QL / Quản trị được; GVCN, GVBM, lớp thường → 403 / 400;
 *  LN-e  chuông GV lớp + TVV của em bị dời; nhật ký lớp;
 *  LN-f  Hoàn tác trả đúng giá trị cũ, một lần; phần đã sửa tiếp giữ nguyên.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrFtLopNghiTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId, addDays } = t;
  const svc: any = await import('../classes/lopNghi.ts');
  const cases: any = await import('../cases/cases.ts');
  const domain: any = await import('../../../shared/domain/index.ts');
  const week: any = await import('../platform/week.ts');
  const FT = classId('MB FT 101');
  const THUONG = classId('MB FOU 12');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const NOW = new Date().toISOString();
  const mb = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  console.log('\nFT-LOP-NGHI · lớp FT nghỉ 1 tuần: MT kế tiếp +1 tuần, hạn PA / Case +7 ngày');

  /* Tuần nghỉ W = thứ Hai 2 tuần sau tuần này: W + 7 nằm ngoài khoá T6–CN (tuần trước / này / sau). */
  const W = week.mondayOf(addDays(TODAY, 14));
  const pid = (d: string) => week.ensurePeriod(d).id as number;
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  let so = 0;

  /** Em mới ở FT 101 + lộ trình LT1 (`examDate` tuỳ chọn) + các MT: [số, tuần, trạng thái kỹ năng]. */
  const taoEm = (mts: [number, string, 'scheduled' | 'sat'][], opt: { examDate?: string; tvv?: number } = {}) => {
    so += 1;
    const tag = `LN${so}-${Math.random().toString(36).slice(2, 5)}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, consultant_user_id, created_at) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-${tag}`, `Em ${tag}`, `em ${tag.toLowerCase()}`, mb, opt.tvv ?? null, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, FT, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, exam_date, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?, ?)`)
      .run(sid, opt.examDate ?? null, NOW).lastInsertRowid);
    const luot: Record<number, { aid: number; ks: number[] }> = {};
    for (const [no, tuan, sit] of mts) {
      const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, plan_source, status, created_at, lich_su)
        VALUES (?,?,?, 'mock', ?, ?, 'auto', 'planned', ?, 0)`).run(cy, sid, no, FT, pid(tuan), NOW).lastInsertRowid);
      const ks = KN.map((k) => Number(conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at) VALUES (?,?,1,?, 'auto', ?, ?)`)
        .run(aid, k, pid(tuan), sit, NOW).lastInsertRowid));
      luot[no] = { aid, ks };
    }
    return { sid, cy, luot, tag };
  };
  const tuanKn = (kid: number) => get(`SELECT pr.week_start w FROM attempt_skills k JOIN report_periods pr ON pr.id = k.planned_period_id WHERE k.id = ?`, kid).w as string;
  const tuanLuot = (aid: number) => get(`SELECT pr.week_start w FROM assessment_attempts a JOIN report_periods pr ON pr.id = a.planned_period_id WHERE a.id = ?`, aid).w as string;
  const tuanCuaEm = (e: ReturnType<typeof taoEm>, no: number) => e.luot[no].ks.map(tuanKn);

  /** Case Listening mở cho em + một PA đang chạy; ép `follow_until` / `action_due` về ngày cho trước. */
  const taoCase = (sid: number, han: string, hanPa: string) => {
    const c = cases.reportIssue(P.lrTeacher, {
      studentId: sid, topic: 'listening', title: `Nghe chi tiết còn yếu (${sid})`, summary: 'Em bỏ sót số và tên riêng ở Section 2.',
      primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: `ln-${sid}-${Math.random()}`,
    }) as any;
    const d = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', startedDate: TODAY, performerUserId: P.lrTeacher.userId,
    }) as any;
    const ivId = (all('SELECT id FROM case_interventions WHERE case_id = ?', c.id).at(-1) ?? d)?.id as number;
    conn.prepare('UPDATE sos_cases SET follow_until = ? WHERE id = ?').run(han, c.id);
    conn.prepare(`UPDATE case_interventions SET action_due = ?, status = 'started' WHERE id = ?`).run(hanPa, ivId);
    return { caseId: c.id as number, ivId };
  };
  const bang = (b: string) => JSON.stringify(all(`SELECT * FROM ${b}`));
  const khongDoi = ['bao_cao_ph', 'violations', 'lenh_chuyen_lop'].filter((b) => get(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, b));

  /* ----- fixture dùng chung ------------------------------------------------------------------------------------------------------ */
  const tvv = P.admin.userId;   // người nhận chuông TVV (khác QL bấm)
  const A = taoEm([[1, W, 'scheduled'], [2, addDays(W, 28), 'scheduled']], { tvv });
  const B = taoEm([[1, W, 'scheduled']], { examDate: addDays(W, 3) });              // thi thật TRƯỚC tuần dời → giữ
  const C = taoEm([[1, W, 'sat'], [2, addDays(W, 28), 'scheduled']]);               // MT1 đã thi → dời MT2
  const D = taoEm([]);                                                               // không MT, có Case / PA
  const E = taoEm([[1, addDays(W, -14), 'scheduled']]);                              // MT trước tuần nghỉ → không dời
  const cA = taoCase(A.sid, addDays(W, 10), addDays(W, 3));
  const cD = taoCase(D.sid, addDays(W, 12), addDays(W, 5));
  const cB = taoCase(B.sid, addDays(W, 9), addDays(W, 2));

  const xt = () => svc.xemTruocLopNghi(P.mbManager, FT, W);
  const em = (r: any, e: ReturnType<typeof taoEm>) => r.em.find((x: any) => x.studentId === e.sid);

  check('LN-a · xem trước không ghi gì: MT kế tiếp +1 tuần; MT sau, MT đã thi, MT trước tuần nghỉ đứng yên', () => {
    const truoc = [tuanCuaEm(A, 1), tuanCuaEm(A, 2), tuanCuaEm(C, 1), tuanCuaEm(C, 2), tuanCuaEm(E, 1)];
    const nhatKy = get(`SELECT COUNT(*) n FROM audit_logs`).n;
    const r = xt();
    assert(get(`SELECT COUNT(*) n FROM audit_logs`).n === nhatKy, 'xem trước không ghi nhật ký');
    assert(JSON.stringify([tuanCuaEm(A, 1), tuanCuaEm(A, 2), tuanCuaEm(C, 1), tuanCuaEm(C, 2), tuanCuaEm(E, 1)]) === JSON.stringify(truoc), 'xem trước không đổi lịch');
    assert(em(r, A).mt === 'MT1' && em(r, A).tuMoi === addDays(W, 7) && !em(r, A).giu, `A: ${JSON.stringify(em(r, A))}`);
    assert(em(r, C).mt === 'MT2' && em(r, C).tuCu === addDays(W, 28), `C phải dời MT2 (MT1 đã thi): ${JSON.stringify(em(r, C))}`);
    assert(em(r, E).mt === null && em(r, D).mt === null, 'em không có MT từ tuần nghỉ thì không dời');
    assert(r.soEmDoi >= 2 && r.tuan.batDau === W, `tóm tắt: ${r.soEmDoi}`);
  });

  check('LN-b · MT dời vượt ngày thi thật → em giữ nguyên, xem trước nêu lý do', () => {
    const r = xt();
    assert(/Vượt ngày thi thật/.test(em(r, B).giu ?? ''), `lý do: ${em(r, B).giu}`);
    assert(r.soEmGiu >= 1, 'đếm em giữ');
  });

  /* ----- áp dụng ---------------------------------------------------------------------------------------------------------------- */
  const snap = khongDoi.map(bang);
  const notif = (uid: number) => get(`SELECT COUNT(*) n FROM notifications WHERE kind = 'doi_lich_lop' AND user_id = ? AND entity_id = ?`, uid, FT).n as number;
  const [gv0, tvv0, qlTruoc] = [notif(P.coreTeacher.userId), notif(tvv), notif(P.mbManager.userId)];
  const hanCu = { cA: get('SELECT follow_until f FROM sos_cases WHERE id = ?', cA.caseId).f, pA: get('SELECT action_due d FROM case_interventions WHERE id = ?', cA.ivId).d };
  const tuC1 = tuanCuaEm(C, 1);
  const dung = svc.apDungLopNghi(P.mbManager, FT, { tuan: W, lyDo: 'Nghỉ lễ' });

  check('LN-a2 · áp dụng: MT kế tiếp dời đúng +1 tuần (cả dòng kỹ năng và tuần của lượt), MT sau / đã thi đứng yên', () => {
    assert(tuanCuaEm(A, 1).every((w) => w === addDays(W, 7)), `A MT1 ${tuanCuaEm(A, 1)}`);
    assert(tuanLuot(A.luot[1].aid) === addDays(W, 7), 'tuần hoàn tất của lượt dời theo');
    assert(tuanCuaEm(A, 2).every((w) => w === addDays(W, 28)), 'MT2 không dời');
    assert(JSON.stringify(tuanCuaEm(C, 1)) === JSON.stringify(tuC1), 'MT1 đã thi đứng yên');
    assert(tuanCuaEm(C, 2).every((w) => w === addDays(W, 35)), 'MT2 của C (MT kế tiếp chưa thi) +1 tuần');
    assert(tuanCuaEm(E, 1).every((w) => w === addDays(W, -14)), 'MT trước tuần nghỉ đứng yên');
    assert(all('SELECT plan_source s FROM attempt_skills WHERE attempt_id = ?', A.luot[1].aid).every((r) => r.s === 'manual'), 'dòng đã dời thành manual (Áp lịch không ghi đè)');
    assert(get(`SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND reason LIKE 'Lớp nghỉ 1 tuần%Nghỉ lễ'`, A.luot[1].aid).n === 4, 'lịch sử lịch MT ghi lý do');
  });

  check('LN-b2 · em vượt ngày thi thật giữ nguyên MT', () => {
    assert(tuanCuaEm(B, 1).every((w) => w === W), `B ${tuanCuaEm(B, 1)}`);
    assert(dung.soEmGiu >= 1 && /Vượt/.test(em(dung, B).giu), 'kết quả nêu em giữ');
  });

  check('LN-c · hạn PA + hạn báo kết quả Case +7 ngày (mọi em của lớp, kể cả em giữ MT), ghi lý do; Báo cáo PH / Ý thức / bàn giao không đổi', () => {
    const f = (id: number) => get('SELECT follow_until f FROM sos_cases WHERE id = ?', id).f;
    const d = (id: number) => get('SELECT action_due d FROM case_interventions WHERE id = ?', id).d;
    assert(f(cA.caseId) === addDays(hanCu.cA, 7) && d(cA.ivId) === addDays(hanCu.pA, 7), `A: ${f(cA.caseId)} / ${d(cA.ivId)}`);
    assert(f(cD.caseId) === addDays(W, 19) && d(cD.ivId) === addDays(W, 12), 'em không MT cũng dời hạn');
    assert(f(cB.caseId) === addDays(W, 16) && d(cB.ivId) === addDays(W, 9), 'em giữ MT vẫn dời hạn (cả lớp nghỉ)');
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'case.lop_nghi' AND entity_id = ? AND after_json LIKE '%Nghỉ lễ%'`, cA.caseId).n === 1, 'nhật ký Case ghi lý do lớp nghỉ');
    assert(JSON.stringify(khongDoi.map(bang)) === JSON.stringify(snap), `không đụng ${khongDoi.join(', ')}`);
  });

  check('LN-e · chuông: GV lớp + TVV của em bị dời nhận, người bấm không tự nhận; nhật ký lớp', () => {
    assert(notif(P.coreTeacher.userId) === gv0 + 1, 'GVCN lớp FT nhận chuông');
    assert(notif(tvv) === tvv0 + 1, 'TVV của em A nhận chuông');
    assert(notif(P.mbManager.userId) === qlTruoc, 'người bấm không tự nhận');
    const tieu = get(`SELECT title FROM notifications WHERE kind = 'doi_lich_lop' AND user_id = ? ORDER BY id DESC LIMIT 1`, tvv).title as string;
    assert(tieu.includes(A.tag) || /Em LN1/.test(tieu), `chuông TVV nêu tên em: ${tieu}`);
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.lop_nghi' AND entity_id = ? AND actor_user_id = ?`, FT, P.mbManager.userId).n >= 1, 'nhật ký lớp ghi người bấm');
  });

  check('LN-d · quyền: QL / Quản trị được; GVCN, GVBM, lớp thường → bị chặn; lý do quá dài → 400', () => {
    assertThrows(() => svc.xemTruocLopNghi(P.coreTeacher, FT, W), /Quản lý/, 'GVCN xem trước');
    assertThrows(() => svc.apDungLopNghi(P.coreTeacher, FT, { tuan: W }), /Quản lý/, 'GVCN áp dụng');
    assertThrows(() => svc.apDungLopNghi(P.normalCoreTeacher, THUONG, { tuan: W }), /Quản lý|Fast Track/, 'GVCN lớp thường');
    assertThrows(() => svc.apDungLopNghi(P.mbManager, THUONG, { tuan: W }), /Fast Track/, 'lớp thường');
    assertThrows(() => svc.hoanTacLopNghi(P.coreTeacher, FT, dung.lanId), /Quản lý/, 'GVCN hoàn tác');
    assertThrows(() => svc.apDungLopNghi(P.mbManager, FT, { tuan: W, lyDo: 'x'.repeat(201) }), /tối đa/, 'lý do dài');
    assertThrows(() => svc.apDungLopNghi(P.mbManager, FT, { tuan: 'abc' }), /Chọn tuần/, 'tuần sai');
    svc.xemTruocLopNghi(P.admin, FT, W);
  });

  check('LN-f · Hoàn tác trả đúng MT + hạn cũ, chỉ một lần; mục đã sửa tiếp giữ nguyên', () => {
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run('2030-01-01', cD.ivId);   // ai đó sửa tiếp sau khi dời
    const r = svc.hoanTacLopNghi(P.mbManager, FT, dung.lanId);
    assert(r.khoiPhuc > 0 && r.boQua >= 1, `kết quả: ${JSON.stringify(r)}`);
    assert(tuanCuaEm(A, 1).every((w) => w === W) && tuanLuot(A.luot[1].aid) === W, 'MT1 của A về tuần cũ');
    assert(tuanCuaEm(C, 2).every((w) => w === addDays(W, 28)), 'MT2 của C về tuần cũ');
    assert(all('SELECT plan_source s FROM attempt_skills WHERE attempt_id = ?', A.luot[1].aid).every((x) => x.s === 'auto'), 'nguồn xếp về như cũ');
    assert(get('SELECT follow_until f FROM sos_cases WHERE id = ?', cA.caseId).f === hanCu.cA && get('SELECT action_due d FROM case_interventions WHERE id = ?', cA.ivId).d === hanCu.pA, 'hạn A về cũ');
    assert(get('SELECT action_due d FROM case_interventions WHERE id = ?', cD.ivId).d === '2030-01-01', 'mục đã sửa tiếp giữ nguyên');
    assertThrows(() => svc.hoanTacLopNghi(P.mbManager, FT, dung.lanId), /đã được hoàn tác/, 'hoàn tác lần hai');
    assert(JSON.stringify(khongDoi.map(bang)) === JSON.stringify(snap), 'Báo cáo PH / Ý thức / bàn giao vẫn không đổi');
  });

  check('LN-g · không có gì để dời → báo rõ, không ghi', () => {
    const xa = week.mondayOf(addDays(TODAY, 4000));
    const n = get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.lop_nghi'`).n;
    assertThrows(() => svc.apDungLopNghi(P.mbManager, FT, { tuan: xa }), /Không có MT/, 'tuần quá xa');
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.lop_nghi'`).n === n, 'không ghi nhật ký');
  });
}
