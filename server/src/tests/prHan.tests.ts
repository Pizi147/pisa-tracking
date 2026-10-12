/**
 * PR-HAN-XAC-NHAN (chủ sản phẩm 08/10, đặc tả cuối khoá §4): hạn Xác nhận nguyên nhân Case SOS và Xác nhận PA = 5 ngày (tính cả ngày đầu);
 * Gấp hoặc SOS 3 = 3 ngày. Một hàm quyết số ngày (`soNgayHanXacNhan`) — `hanXacNhan` (Case từ SOS) và `planDueDate` (Case tạo tay) đều gọi qua đó.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrHanTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const intake: any = await import('../classes/intake.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nPR-HAN · hạn xác nhận 5 ngày (Gấp / SOS 3: 3 ngày)');

  check('HAN1 · soNgayHanXacNhan + hanXacNhan: SOS 1, SOS 2, thường → 5 ngày; SOS 3, Gấp → 3 ngày (tính cả ngày đầu)', () => {
    const h = (m: object) => d.hanXacNhan('2026-09-14', m);
    assert(h({ sosLevel: 1 }) === '2026-09-18' && h({ sosLevel: 2 }) === '2026-09-18' && h({ sosLevel: null }) === '2026-09-18' && h({}) === '2026-09-18', 'SOS 1/2/thường ≠ 5 ngày');
    assert(h({ sosLevel: 3 }) === '2026-09-16' && h({ urgency: 'urgent' }) === '2026-09-16' && h({ sosLevel: 1, urgency: 'urgent' }) === '2026-09-16', 'SOS 3/Gấp ≠ 3 ngày');
    assert(d.soNgayHanXacNhan({ urgency: 'attention' }) === 5 && d.soNgayHanXacNhan({ sosLevel: 3 }) === 3, 'soNgayHanXacNhan');
  });
  check('HAN2 · Case tạo tay (planDueDate): GVCN chọn Gấp → 3 ngày, Bình thường → 5; SOS suy mức (mywork) → SOS 1/2 = 5, SOS 3 = 3', () => {
    assert(d.planDueDate('2026-09-14', 'urgent') === '2026-09-16' && d.planDueDate('2026-09-14', 'attention') === '2026-09-18'
      && d.planDueDate('2026-09-14', null) === '2026-09-18', 'planDueDate');
    assert([1, 2].every((s) => d.planDueDate('2026-09-14', d.urgencyFromSos(s)) === '2026-09-18')
      && d.planDueDate('2026-09-14', d.urgencyFromSos(3)) === '2026-09-16', 'theo SOS');
  });

  // ------------------------------------------------------------------ dữ liệu thử (dựng qua hàm dịch vụ như prSos.tests.ts)
  const CLASS = t.classId('MB FT 101');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const makeStudent = (name: string) => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: `HAN ${name}`, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `han-${name}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `HAN ${name}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    return { id: st.id as number, cycleId: cy.id as number };
  };
  const PAST_WEEK = weekSvc.mondayOf(addDays(TODAY, -14));
  const mkAttempt = (st: { id: number; cycleId: number }, no: number): any => luotThu(conn, attemptsSvc.createAttempt, P.admin, {
    studentId: st.id, cycleId: st.cycleId, classId: CLASS, no, periodId: weekSvc.ensurePeriod(PAST_WEEK).id });
  const enter = (a: any, skill: string, band: number) => attemptsSvc.saveScore(P.admin, a.id, skill,
    skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
      : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
      : { criteria: [band, band, band, band] });
  const han = (sid: number, cat: string) => get('SELECT han_xac_nhan h FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id DESC LIMIT 1', sid, cat).h;
  const nam = addDays(TODAY, 4);
  const ba = addDays(TODAY, 2);

  check('HAN3 · Case SOS FT: SOS 1 → 5 ngày · SOS 2 → 5 ngày · SOS 3 → 3 ngày (theo mức LÚC Case ra đời, như tên Case [SOS n] — nhập L trước thì Case L là SOS 1)', () => {
    const s1 = makeStudent('S1'); enter(mkAttempt(s1, 1), 'listening', 5);
    assert(han(s1.id, 'listening') === nam, `SOS 1: ${han(s1.id, 'listening')}`);
    const s2 = makeStudent('S2'); const a2 = mkAttempt(s2, 1); enter(a2, 'listening', 5); enter(a2, 'reading', 5);
    assert(han(s2.id, 'listening') === nam && han(s2.id, 'reading') === nam, `SOS 2: ${han(s2.id, 'listening')} ${han(s2.id, 'reading')}`);
    const s3 = makeStudent('S3'); const a3 = mkAttempt(s3, 1); for (const k of ['listening', 'reading', 'speaking']) enter(a3, k, 5);
    assert(han(s3.id, 'speaking') === ba && han(s3.id, 'listening') === nam && han(s3.id, 'reading') === nam,
      `SOS 3: ${han(s3.id, 'listening')} ${han(s3.id, 'reading')} ${han(s3.id, 'speaking')}`);
  });

  check('HAN4 · PA chờ xác nhận (trượt lại, Case đã có nguyên nhân): 5 ngày; Case Gấp → 3 ngày', () => {
    for (const [ten, urgency, mong] of [['PA', 'attention', nam], ['PAgap', 'urgent', ba]] as const) {
      const st = makeStudent(ten); enter(mkAttempt(st, 1), 'listening', 5);
      const c = get(`SELECT id FROM sos_cases WHERE student_id = ? AND category = 'listening'`, st.id);
      conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?, 'primary', ?, ?)`)
        .run(c.id, d.issuesForTopic('listening', null)[0].code, new Date().toISOString());
      conn.prepare(`UPDATE case_interventions SET status = 'started', started_date = ?, confirmed_at = ? WHERE case_id = ?`).run(TODAY, new Date().toISOString(), c.id);
      conn.prepare(`UPDATE sos_cases SET urgency = ?, han_xac_nhan = ? WHERE id = ?`).run(urgency, addDays(TODAY, -10), c.id);
      enter(mkAttempt(st, 2), 'listening', 5);
      assert(han(st.id, 'listening') === mong, `${ten}: ${han(st.id, 'listening')} ≠ ${mong}`);
    }
  });

  check('HAN5 · Quay lại học (datLaiHanCase): hạn mới theo mức từng Case — SOS 3 → 3 ngày, SOS 1 → 5 ngày', () => {
    const st = makeStudent('QL3'); const a = mkAttempt(st, 1); for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5);
    const s1 = makeStudent('QL1'); enter(mkAttempt(s1, 1), 'listening', 5);
    conn.prepare(`UPDATE sos_cases SET han_xac_nhan = ? WHERE student_id IN (?, ?)`).run(addDays(TODAY, -10), st.id, s1.id);
    sosAuto.datLaiHanCase(st.id, TODAY); sosAuto.datLaiHanCase(s1.id, TODAY);
    assert(han(st.id, 'speaking') === ba && han(s1.id, 'listening') === nam, `${han(st.id, 'speaking')} ${han(s1.id, 'listening')}`);
  });
}
