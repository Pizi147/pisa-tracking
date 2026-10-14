/**
 * PHÉP KIỂM PR-OV1c — SOS Mock Test: tạm thời → chốt → xoá (đặc tả OV 3.2). Mỗi phép kiểm dựng ca trong một giao dịch rồi cuộn lại (`thu`).
 * Ca dựng ở lượt MT cuối của em đang học MB FT 101, tuần W1 NOV 2026, kỳ vọng ép về 6.5.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { nhanXetCaseThu } from './luotThu.ts';

export async function runPrOv1cTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const sos: any = await import('../cases/sos.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const standing: any = await import('../students/standing.ts');
  const profile: any = await import('../students/profile.ts');
  const danhGia: any = await import('../worklist/danhGia.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { migratePrOv1c, kiemTruocOv1c } = await import('../migrate/prOv1c.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV1c · SOS MT tạm thời → chốt → xoá');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const WS = '2026-11-02', WS1 = '2026-11-09';
  const TRONG = '2026-11-04', BU = '2026-11-11';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;
  week.ensurePeriod('2026-11-16');

  /* Hai em MỚI (không dính dữ liệu các bộ kiểm trước trong `run.ts`): lượt MT cuối tự tạo của mỗi em. */
  const intake: any = await import('../classes/intake.ts');
  const luot = ['OV1c Em A', 'OV1c Em B'].map((ten) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `ov1c-${ten}` });
    const sid = r.studentIds[0] as number;
    return one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no DESC LIMIT 1`, sid).id as number;
  });

  /** Lượt sạch ở tuần W, kỳ vọng 6.5; em không còn Case / tín hiệu / Phối hợp nào (Case mới phải do chính ca này sinh ra). */
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    for (const sql of ['DELETE FROM assessment_scores WHERE attempt_id = ?', 'DELETE FROM skill_move_requests WHERE attempt_id = ?',
      'DELETE FROM attempt_skill_skips WHERE attempt_id = ?', 'DELETE FROM sos_coordination_actions WHERE attempt_id = ?']) conn.prepare(sql).run(aid);
    conn.prepare(`UPDATE sos_cases SET status = 'done', dedup_key = NULL WHERE student_id = ?`).run(a.student_id);
    /* Lượt khác của em không còn điểm — "kết quả gần nhất" (danh sách lớp, hồ sơ) là chính lượt dựng. */
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ? AND id != ?)').run(a.student_id, aid);
    conn.prepare('DELETE FROM case_signals WHERE student_id = ?').run(a.student_id);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    const delta = dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a));
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`)
      .run(W, 6.5 + delta, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, ...luot);
    xoaNho();
    return a.student_id as number;
  };
  /* OV-4c: W1 / W2 / S ở lượt thường chỉ nhận 4 tiêu chí — bốn tiêu chí bằng nhau cho đúng band cần dựng. */
  const diem = (aid: number, s: string, band: number, today = TRONG) =>
    attempts.saveScore(QL, aid, s, s === 'listening' || s === 'reading' ? { band } : { criteria: [band, band, band, band] }, today);
  const vang = (aid: number, s: string, today = TRONG) => attempts.saveScore(QL, aid, s, { noShow: true }, today);
  const kq = (aid: number) => { xoaNho(); return attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', aid)); };
  const caseCua = (aid: number) => all(
    `SELECT DISTINCT c.* FROM sos_cases c JOIN case_signals g ON g.case_id = c.id WHERE g.attempt_id = ? ORDER BY c.id`, aid);
  const soViec = (aid: number) => ({
    case: caseCua(aid).length,
    tinHieu: one('SELECT COUNT(*) n FROM case_signals WHERE attempt_id = ? AND status != ?', aid, 'withdrawn').n as number,
    phoiHop: one(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ? AND status = 'pending'`, aid).n as number,
    chuong: one(`SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ?`, `sos:${aid}:%`).n as number,
  });
  /** L/R/W đủ; L 5 dưới kỳ vọng 6.5 → chỉ còn Speaking quyết chốt. */
  const baKyNang = (aid: number) => { diem(aid, 'listening', 5); diem(aid, 'reading', 7); diem(aid, 'writing1', 7); diem(aid, 'writing2', 7); };

  check('OV1c-0 · tiền đề: 2 lượt MT cuối sạch ở MB FT 101', () => assert(luot.length === 2, `cần 2 lượt, có ${luot.length}`));

  check('OV1c-1 · điểm đầu dưới kỳ vọng = SOS tạm thời, 0 Case / tín hiệu / Phối hợp / chuông; đủ 4 kỹ năng (2 dưới) → Case SOS 2, hạn từ ngày chốt', () => thu(() => {
    const a = luot[0];
    dung(a);
    diem(a, 'listening', 5);
    let r = kq(a);
    assert(r.sosLevel === 1 && r.provisional && !r.chot, `sau L: ${JSON.stringify({ s: r.sosLevel, p: r.provisional, c: r.chot })}`);
    assert(JSON.stringify(soViec(a)) === JSON.stringify({ case: 0, tinHieu: 0, phoiHop: 0, chuong: 0 }), `trước chốt: ${JSON.stringify(soViec(a))}`);
    diem(a, 'reading', 6.5); diem(a, 'writing1', 6.5); diem(a, 'writing2', 6.5);
    assert(soViec(a).case === 0, 'ba kỹ năng vẫn chưa chốt — không Case');
    diem(a, 'speaking', 5.5);
    r = kq(a);
    assert(r.chot && !r.provisional && r.sosLevel === 2, `đủ điểm: ${JSON.stringify({ s: r.sosLevel, p: r.provisional, c: r.chot, o: r.overall })}`);
    const cs = caseCua(a);
    assert(cs.length === 2 && cs.every((c) => c.han_xac_nhan === dm.hanXacNhan(TODAY, { sosLevel: 2 })), `Case: ${JSON.stringify(cs.map((c) => [c.category, c.han_xac_nhan]))}`);
    assert(soViec(a).phoiHop > 0, 'lúc chốt phải có Phối hợp');
  }));

  check('OV1c-2a · chốt nhờ kỹ năng thiếu DỜI TUẦN ("-" trong tuần thi) — Case tạo ngay lúc ghi "-"', () => thu(() => {
    const a = luot[0];
    dung(a);
    baKyNang(a);
    assert(soViec(a).case === 0, 'chưa chốt mà đã có Case');
    vang(a, 'speaking');
    const r = kq(a);
    assert(one('SELECT absence_move_count n FROM attempt_skills WHERE attempt_id = ? AND skill = ?', a, 'speaking').n === 1, 'S phải dời lần 1');
    assert(r.chot && !r.provisional && r.sosLevel === 1, `chốt nhờ dời: ${JSON.stringify({ s: r.sosLevel, p: r.provisional, c: r.chot })}`);
    assert(caseCua(a).length === 1 && caseCua(a)[0].category === 'listening', `Case L: ${JSON.stringify(caseCua(a).map((c) => c.category))}`);
  }));

  /* OV-11a (TE-5): "Vắng" sau tuần thi nay là Không dự thi (OV1c-2c) — đường huỷ phần thi đi qua vắng lần 2 ở tuần thi bù. */
  check('OV1c-2b · chốt nhờ HUỶ PHẦN THI (vắng lần 1 dời → "-" lần 2 ở tuần thi bù): 1 Case, không trùng', () => thu(() => {
    const a = luot[0];
    dung(a);
    baKyNang(a);
    absence.baoVang(P.coreTeacher, a, 'speaking', null, TRONG);   // lần 1 → dời W2 NOV
    assert(caseCua(a).length === 1, `vắng đã dời đã là chốt: ${caseCua(a).length}`);
    vang(a, 'speaking', BU);   // "-" ở tuần thi bù = lần 2 → huỷ phần thi
    assert(one('SELECT sit_status s FROM attempt_skills WHERE attempt_id = ? AND skill = ?', a, 'speaking').s === 'cancelled', 'S phải huỷ');
    const r = kq(a);
    assert(r.chot && !r.provisional, 'huỷ phần thi = chốt');
    assert(caseCua(a).length === 1, `không Case trùng: ${caseCua(a).length}`);
  }));

  check('OV1c-2c · chốt nhờ "Không dự thi" (nhập "-" sau tuần thi) — Case tạo ngay', () => thu(() => {
    const a = luot[0];
    dung(a);
    baKyNang(a);
    vang(a, 'speaking', BU);
    assert(one('SELECT no_show_cu n FROM assessment_scores WHERE attempt_id = ? AND skill = ?', a, 'speaking').n === 1, 'S phải Không dự thi');
    assert(kq(a).chot && caseCua(a).length === 1, `Không dự thi: chot ${kq(a).chot}, Case ${caseCua(a).length}`);
  }));

  check('OV1c-2d · chốt nhờ "Không mock lại" (bỏ kỹ năng khỏi đợt) — Case tạo ngay', () => thu(() => {
    const a = luot[0];
    dung(a);
    baKyNang(a);
    attempts.setSkillSkip(QL, a, 'speaking', true, 'Không mock lại');
    assert(kq(a).chot && caseCua(a).length === 1, `Không mock lại: chot ${kq(a).chot}, Case ${caseCua(a).length}`);
  }));

  check('OV1c-3 · Overall ≥ kỳ vọng (L dưới) → không SOS; Overall = kỳ vọng → không SOS', () => thu(() => {
    const a = luot[0];
    dung(a);
    diem(a, 'listening', 6); diem(a, 'reading', 7); diem(a, 'writing1', 7); diem(a, 'writing2', 7); diem(a, 'speaking', 7);
    let r = kq(a);
    assert(r.overall >= 6.5 && r.sosLevel === 0 && r.chot, `L6 R7 W7 S7: ${JSON.stringify({ o: r.overall, s: r.sosLevel })}`);
    assert(JSON.stringify(soViec(a)) === JSON.stringify({ case: 0, tinHieu: 0, phoiHop: 0, chuong: 0 }), `không việc: ${JSON.stringify(soViec(a))}`);
    r = scoring.evaluateAttempt(6.5, 3, { listening: 6, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 7 });
    assert(r.overall === 6.5 && r.sosLevel === 0, `Overall = kỳ vọng: ${JSON.stringify({ o: r.overall, s: r.sosLevel })}`);
    r = scoring.evaluateAttempt(6.5, 3, { listening: 5, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 5.5 });
    assert(r.overall < 6.5 && r.sosLevel === 2, `Overall dưới kỳ vọng giữ SOS: ${JSON.stringify({ o: r.overall, s: r.sosLevel })}`);
  }));

  check('OV1c-4 · xoá SOS: S dời có điểm, Overall ≥ kỳ vọng → Case chưa xác nhận PA XOÁ HẲN (OV-12c); Case đã xác nhận PA giữ + mốc', () => thu(() => {
    for (const xacNhan of [false, true]) {
      const a = luot[0];
      dung(a);
      baKyNang(a);
      vang(a, 'speaking');
      const c = caseCua(a)[0];
      assert(c && c.status !== 'done', 'phải có Case L sau chốt');
      /* OV-12c: nguyên nhân Case MT = nhận xét của bài; "đã có người làm" = PA đã được xác nhận (chưa xác nhận PA → em đạt lại thì xoá hẳn). */
      if (xacNhan) {
        nhanXetCaseThu(conn, attempts.saveScore, QL, c.id, { primaryCode: dm.issuesForTopic('listening')[0].code, moTa: 'Em sót số liệu ở Part 1 và Part 2.' });
        const pa = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1`, c.id);
        sosAuto.xacNhanPaQuyChe(QL, pa.id, { description: pa.description });
      }
      diem(a, 'speaking', 7, BU);   // (5 + 7 + 7 + 7) / 4 = 6.5 ≥ 6.5
      const sau = one('SELECT * FROM sos_cases WHERE id = ?', c.id);
      if (!xacNhan) {
        assert(!sau, `Case chưa xác nhận PA phải bị xoá hẳn (OV-12c): ${JSON.stringify(sau)}`);
        assert(dm.SYSTEM_CLOSE_REASON_LABEL.overall_dat === 'Overall đạt', 'nhãn lý do');
        assert(soViec(a).phoiHop === 0, `Phối hợp còn chờ phải bỏ: ${soViec(a).phoiHop}`);
      } else {
        assert(sau.status !== 'done', 'Case đã xác nhận phải giữ');
        assert(one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'overall_dat'`, c.id).n === 1, 'thiếu mốc Overall đã đạt');
      }
      conn.exec('ROLLBACK'); conn.exec('BEGIN IMMEDIATE'); xoaNho();
    }
  }));

  check('OV1c-5 · Bỏ vắng sau chốt không xoá Case, chốt lại không sinh Case trùng; xét chốt 2 lần → 1 Case', () => thu(() => {
    const a = luot[0];
    dung(a);
    baKyNang(a);
    vang(a, 'speaking');
    attempts.saveScore(QL, a, 'speaking', { noShow: false }, TRONG);   // Bỏ vắng
    assert(!kq(a).chot && kq(a).provisional, 'Bỏ vắng → về tạm thời');
    assert(caseCua(a).length === 1 && caseCua(a)[0].status !== 'done', 'Case đã có giữ nguyên');
    vang(a, 'speaking');
    attempts.refreshOutcome(QL, a); attempts.refreshOutcome(QL, a);
    assert(all(`SELECT id FROM sos_cases WHERE student_id = ? AND status != 'done'`, one('SELECT student_id s FROM assessment_attempts WHERE id = ?', a).s).length === 1,
      'chỉ 1 Case đang mở');
  }));

  check('OV1c-6 · mọi chỗ đọc cùng cờ chốt: hồ sơ HV, danh sách lớp, Phân tích (lượt chốt nhờ dời không còn "tạm thời")', () => thu(() => {
    const a = luot[0];
    const sid = dung(a);
    baKyNang(a);
    const doc = () => {
      xoaNho();
      const st = standing.standingFor([sid]).get(sid);
      const ev = danhGia.evaluateAttemptRow({ ...one('SELECT * FROM assessment_attempts WHERE id = ?', a), programme_code: null }, attempts.loadBundle([a]), new Map());
      const ft = profile.typedResult(one('SELECT * FROM assessment_attempts WHERE id = ?', a)).ft;
      return { st: st.provisional, ev: ev.provisional, ft: ft.provisional, kq: kq(a).provisional, loai: tongHop.phanLoaiLuot(ev) };
    };
    const truoc = doc();
    assert(truoc.st && truoc.ev && truoc.ft && truoc.kq && truoc.loai === 'chuaDu', `trước chốt: ${JSON.stringify(truoc)}`);
    vang(a, 'speaking');
    const sau = doc();
    assert(!sau.st && !sau.ev && !sau.ft && !sau.kq && sau.loai === 'sos1', `sau chốt: ${JSON.stringify(sau)}`);
    const v = dm.attemptProgressView({ scored: 3, required: 4, passed: null, sos: 1, chot: true });
    assert(!/tạm thời/.test(v.text) && !v.tamThoi, `chip lượt chốt: ${v.text}`);
    assert(/tạm thời/.test(dm.attemptProgressView({ scored: 3, required: 4, passed: null, sos: 1 }).text), 'chip chưa chốt giữ "tạm thời"');
  }));

  check('OV1c-7 · migrate: lượt chưa chốt có Case chưa đụng → đóng "Chờ chốt SOS", đã đụng → giữ; chạy lại không đổi; kiem-truoc khớp', () => thu(() => {
    const [a, b] = luot;
    dung(a); dung(b);
    /* Dữ liệu cũ: Case sinh ngay từ điểm đầu (luật trước PR). */
    for (const id of [a, b]) {
      diem(id, 'listening', 5);
      const at = one('SELECT * FROM assessment_attempts WHERE id = ?', id);
      sos.raiseSignalsForResult(QL, at, { ...attempts.resultOf(at), chot: true });
    }
    const ca = caseCua(a)[0], cb = caseCua(b)[0];
    assert(ca && cb, 'dựng Case cũ');
    nhanXetCaseThu(conn, attempts.saveScore, QL, cb.id, { primaryCode: dm.issuesForTopic('listening')[0].code, moTa: 'Em sót số liệu ở Part 1 và Part 2.' });   // OV-12c: nguyên nhân = nhận xét
    const truoc = kiemTruocOv1c(conn).filter((d: any) => [a, b].includes(d.attemptId));
    const lam = migratePrOv1c(conn, []).filter((d: any) => [a, b].includes(d.attemptId));
    assert(truoc.length === 1 && lam.length === 1 && truoc[0].caseId === ca.id && lam[0].caseId === ca.id, `kiem-truoc ${JSON.stringify(truoc)} · migrate ${JSON.stringify(lam)}`);
    const sa = one('SELECT * FROM sos_cases WHERE id = ?', ca.id);
    assert(sa.status === 'done' && sa.system_close_reason === 'cho_chot_sos', `Case chưa đụng: ${sa.status} · ${sa.system_close_reason}`);
    assert(one('SELECT status FROM sos_cases WHERE id = ?', cb.id).status !== 'done', 'Case đã đụng phải giữ');
    assert(migratePrOv1c(conn, []).filter((d: any) => [a, b].includes(d.attemptId)).length === 0, 'chạy lại phải không đổi gì');
    /* Lượt chốt sau đó: máy tạo Case mới theo luật mới, hạn từ ngày chốt. */
    diem(a, 'reading', 7); diem(a, 'writing1', 7); diem(a, 'writing2', 7); diem(a, 'speaking', 5.5);
    const moi = all(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening' AND status != 'done'`, one('SELECT student_id s FROM assessment_attempts WHERE id = ?', a).s);
    assert(moi.length === 1 && moi[0].han_xac_nhan === dm.hanXacNhan(TODAY, { sosLevel: 2 }), `Case lúc chốt: ${JSON.stringify(moi.map((c) => [c.id, c.han_xac_nhan]))}`);
  }));
}
