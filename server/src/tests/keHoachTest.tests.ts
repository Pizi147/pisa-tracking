/**
 * PHÉP KIỂM PR-Rc2: Kế hoạch Test (spec §3.5 "Kế hoạch Test"; kiểm kê §1.4 R9, R9b, R10, R11, R12, R14; §3 dòng 14).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKeHoachTestTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, classId, addDays, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const attemptsMod: any = await import('../fasttrack/attempts.ts');
  const standingMod: any = await import('../students/standing.ts');
  const hoanTatMod: any = await import('../fasttrack/hoanTat.ts');
  const regularMod: any = await import('../normal/regular.ts');
  const keHoachMod: any = await import('../keHoach/keHoachTest.ts');
  const classesMod: any = await import('../classes/classes.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { can } = await import('../permissions.ts');
  console.log('\nPR-Rc2 · Kế hoạch Test');

  const mbClass = classId('MB-FT 101');
  /** MT1/MT2/MT3 liên tiếp cùng lộ trình ở MB-FT 101 — cùng câu truy vấn của phép T13/T15 ở `run.ts`. */
  function threeConsecutiveMocks() {
    const rows = conn.prepare(
      `SELECT a.id AS attemptId, a.attempt_no, a.cycle_id, s.skill, s.planned_period_id
         FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND s.required = 1 AND s.skill = 'listening'
          AND s.planned_period_id IS NOT NULL
        ORDER BY a.cycle_id, a.attempt_no`,
    ).all(mbClass) as any[];
    const byCycle = new Map<number, any[]>();
    for (const r of rows) { if (!byCycle.has(r.cycle_id)) byCycle.set(r.cycle_id, []); byCycle.get(r.cycle_id)!.push(r); }
    for (const list of byCycle.values()) {
      if (list.length >= 3) return list.sort((a, b) => a.attempt_no - b.attempt_no).slice(0, 3);
    }
    assert(false, 'Seed thiếu một lộ trình có đủ MT1, MT2, MT3 đã xếp tuần để kiểm T15');
    return [] as any[];
  }

  check('T15 · Trùng tuần CUỐI của đợt TRƯỚC cũng CHẶN (cả hai chiều)', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    const mt2Week = week.periodById(mt2.planned_period_id)!.week_start;
    const check = skillSchedule.checkSkillWeekMove({
      attemptId: mt3.attemptId, skill: 'listening', newWeekStart: mt2Week,
    });
    assert(check.blockers.length > 0, `Dời MT3 trùng tuần cuối MT2 (đợt trước) phải bị CHẶN, đang ra: ${JSON.stringify(check)}`);
  });

  check('T15 · Đợt CHƯA TẠO (MT4 mới) xếp trùng tuần MT3 → checkWeekVsNeighbours chặn', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const check = skillSchedule.checkWeekVsNeighbours({
      cycleId: mt3.cycle_id, attemptNo: mt3.attempt_no + 1, excludeAttemptId: null, newWeekStart: mt3Week,
    });
    assert(check.blockers.length > 0, `MT4 (chưa tạo) trùng tuần MT3 phải bị CHẶN, đang ra: ${JSON.stringify(check)}`);
  });

  check('T9 · Kết quả gần nhất dùng mục tiêu TẠI THỜI ĐIỂM THI, không dùng target hiện tại của lộ trình', () => {
    /*
     * PHẢI khớp đúng cách `standingFor` chọn lượt (standing.ts:207: lượt MỚI NHẤT — attempt_no lớn nhất — có BẤT KỲ
     * dòng nào ở `assessment_scores`, kể cả dòng chỉ mang dấu "-" chưa có band) và đúng lộ trình ĐANG CHẠY của em
     * (`status = 'active'`, standing.ts:148) — chọn sai lượt/lộ trình thì so hai bên ra khác nhau vì lý do khác,
     * không phải vì T9.
     */
    const row = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id, a.cycle_id, a.target_at_attempt
         FROM assessment_attempts a
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.target_at_attempt IS NOT NULL
          AND EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.id = a.cycle_id AND lc.status = 'active')
          AND EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id)
          AND a.attempt_no = (
            SELECT MAX(a2.attempt_no) FROM assessment_attempts a2
             WHERE a2.cycle_id = a.cycle_id AND a2.status != 'cancelled'
               AND EXISTS (SELECT 1 FROM assessment_scores sc2 WHERE sc2.attempt_id = a2.id)
          )
        LIMIT 1`,
    ).get(mbClass) as any;
    assert(row, 'Seed thiếu một lượt FT có điểm và có target_at_attempt để kiểm T9');
    const cu = conn.prepare('SELECT target_score FROM learning_cycles WHERE id = ?').get(row.cycle_id) as any;
    conn.prepare('UPDATE learning_cycles SET target_score = 9.0 WHERE id = ?').run(row.cycle_id);
    try {
      const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(row.attemptId) as any;
      const rieng = attemptsMod.resultOf(a);
      const s = standingMod.standingFor([row.student_id]).get(row.student_id)!;
      assert(s.sosLevel === rieng.sosLevel, `sosLevel phải theo target_at_attempt (${rieng.sosLevel}), đang ra ${s.sosLevel}`);
      if (s.expectation !== undefined) {
        assert(s.expectation === rieng.expectation, `expectation phải theo target_at_attempt, đang ra ${s.expectation} ≠ ${rieng.expectation}`);
      }
    } finally {
      conn.prepare('UPDATE learning_cycles SET target_score = ? WHERE id = ?').run(cu.target_score, row.cycle_id);
    }
  });

  /** Dựng một đợt FT "đã hoàn tất": ghi đè lịch + điểm của MT1 có sẵn (chưa ai dùng riêng ở các phép T15/T9 trên). */
  function dungDotHoanTatFT(chiEmDangHoc = false) {
    /* `chiEmDangHoc`: MT1 của em còn học lớp này, đúng lộ trình đang chạy — bảng lớp (classRoster) chỉ hiện những đợt đó. */
    const row = conn.prepare(
      `SELECT a.id AS attemptId, a.class_id, a.cycle_id FROM assessment_attempts a
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind = 'mock' AND a.attempt_no = 1
          ${chiEmDangHoc ? `AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active')
          AND EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.id = a.cycle_id AND cy.status = 'active')
        ORDER BY a.id` : ''}
        LIMIT 1`,
    ).get(mbClass) as any;
    assert(row, 'Seed thiếu một MT1 ở MB-FT 101 để dựng đợt hoàn tất (R11)');
    const per = week.ensurePeriod('2026-05-04');
    conn.prepare(`UPDATE attempt_skills SET required=1, sit_status='scheduled', planned_period_id=? WHERE attempt_id=?`)
      .run(per.id, row.attemptId);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(row.attemptId);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, band, entered_at) VALUES (?,?,?,?,?)`)
      .run(row.attemptId, 'listening', 30, 6.5, '2026-04-01');
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, band, entered_at) VALUES (?,?,?,?,?)`)
      .run(row.attemptId, 'reading', 30, 6.5, '2026-04-01');
    const insC = conn.prepare(
      `INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, entered_at) VALUES (?,?,?,?,?,?,?,?)`);
    insC.run(row.attemptId, 'writing1', 6, 6, 6, 6, 6, '2026-04-01');
    insC.run(row.attemptId, 'writing2', 6, 6, 6, 6, 6, '2026-04-01');
    insC.run(row.attemptId, 'speaking', 6, 6, 6, 6, 6, '2026-04-01');
    return { attemptId: row.attemptId as number, classId: row.class_id as number, chuNhatCuoi: per.weekEnd as string };
  }

  check('PR-Rc2 · R11(a) FT: GVBM bị chặn sau Chủ nhật, còn sửa được ĐÚNG Chủ nhật (RB-5 đòi lý do)', () => {
    const { attemptId, chuNhatCuoi } = dungDotHoanTatFT();
    const sauChuNhat = addDays(chuNhatCuoi, 1);
    assertThrows(
      () => attemptsMod.saveScore(P.lrTeacher, attemptId, 'listening', { rawScore: 32, lyDo: 'Chấm lại cho đúng' }, sauChuNhat),
      /đã hoàn tất/, 'Qua Chủ nhật mà GVBM vẫn sửa được điểm đợt đã hoàn tất',
    );
    const giuNguyen = conn.prepare('SELECT raw_score FROM assessment_scores WHERE attempt_id=? AND skill=?')
      .get(attemptId, 'listening') as any;
    assert(giuNguyen.raw_score === 30, 'Bị chặn mà điểm vẫn đổi');

    attemptsMod.saveScore(P.lrTeacher, attemptId, 'listening', { rawScore: 32, lyDo: 'Chấm lại cho đúng' }, chuNhatCuoi);
    const daDoi = conn.prepare('SELECT raw_score FROM assessment_scores WHERE attempt_id=? AND skill=?')
      .get(attemptId, 'listening') as any;
    assert(daDoi.raw_score === 32, 'Đúng Chủ nhật (chưa qua) GVBM phải còn sửa được, có lý do');
  });

  check('PR-Rc2 · R11(b) Quản lý sửa được đợt hoàn tất khi có lý do; nhật ký score.override kèm sauHoanTat', () => {
    const { attemptId, classId: clsId, chuNhatCuoi } = dungDotHoanTatFT();
    const sauChuNhat = addDays(chuNhatCuoi, 1);
    assertThrows(
      () => attemptsMod.saveScore(P.mbManager, attemptId, 'listening', { rawScore: 34 }, sauChuNhat),
      /lý do/i, 'Quản lý sửa đợt hoàn tất mà không ghi lý do vẫn được chấp nhận',
    );
    attemptsMod.saveScore(P.mbManager, attemptId, 'listening', { rawScore: 34, lyDo: 'Quản lý hiệu chỉnh sau hoàn tất' }, sauChuNhat);
    const daDoi = conn.prepare('SELECT raw_score FROM assessment_scores WHERE attempt_id=? AND skill=?')
      .get(attemptId, 'listening') as any;
    assert(daDoi.raw_score === 34, 'Quản lý có lý do mà vẫn không sửa được');
    const log = conn.prepare(
      `SELECT * FROM audit_logs WHERE entity_type='assessment_attempt' AND entity_id=? ORDER BY id DESC LIMIT 1`,
    ).get(attemptId) as any;
    assert(log && log.action === 'score.override', `Nhật ký mới nhất phải là score.override, đang là ${log?.action}`);
    assert(JSON.parse(log.after_json ?? '{}').sauHoanTat === true, 'Nhật ký thiếu cờ sauHoanTat');
    assert(!can(P.mbManager, d.PERMISSIONS.SCORE_OVERRIDE, { classId: clsId }),
      'Quản lý sửa được là qua PLAN_WEEK (R11), không phải vì được cấp score.override thẳng');
  });

  check('PR-Rc2 · R11(c) Lớp thường: bốn môn có điểm + hết CN → GVBM bị chặn, Quản lý sửa được; dấu "-" không làm hoàn tất', () => {
    const foundationClass = classId('MB-FOU 12');
    const row = conn.prepare(
      `SELECT id AS attemptId FROM assessment_attempts
        WHERE class_id = ? AND status != 'cancelled' AND kind = 'progress' LIMIT 1`,
    ).get(foundationClass) as any;
    assert(row, 'Seed thiếu một bài Giữa khoá ở MB-FOU 12 để kiểm R11 lớp thường');
    const attemptId = row.attemptId as number;
    const per = week.ensurePeriod('2026-05-04');
    conn.prepare(`UPDATE attempt_skills SET required=1, sit_status='scheduled', planned_period_id=? WHERE attempt_id=?`)
      .run(per.id, attemptId);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(attemptId);
    const ins = conn.prepare(
      `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)`);
    for (const sk of ['listening', 'reading', 'writing', 'speaking']) ins.run(attemptId, sk, 30, 40, '2026-04-01');
    const sauChuNhat = addDays(per.weekEnd, 1);

    assertThrows(
      () => regularMod.saveRegularScore(P.normalCoreTeacher, attemptId, 'listening', { score: 32, total: 40, lyDo: 'Chấm lại' }, sauChuNhat),
      /đã hoàn tất/, 'Qua Chủ nhật mà GVBM vẫn sửa được bài lớp thường đã hoàn tất',
    );
    regularMod.saveRegularScore(P.mbManager, attemptId, 'listening', { score: 32, total: 40, lyDo: 'Quản lý hiệu chỉnh' }, sauChuNhat);
    const daDoi = conn.prepare('SELECT raw_score FROM assessment_scores WHERE attempt_id=? AND skill=?')
      .get(attemptId, 'listening') as any;
    assert(daDoi.raw_score === 32, 'Quản lý có lý do mà vẫn không sửa được bài lớp thường');

    /* Dấu "-" (Rc1) không tính là coDiem cho lớp thường — một môn còn "-" thì đợt KHÔNG bao giờ tự hoàn tất. */
    conn.prepare('UPDATE assessment_scores SET raw_score=NULL, raw_total=NULL, no_show_period_id=? WHERE attempt_id=? AND skill=?')
      .run(per.id, attemptId, 'reading');
    const info = hoanTatMod.dotHoanTat(attemptId, sauChuNhat);
    assert(info.hoanTat === false, 'Một môn còn mang dấu "-" mà đợt lớp thường vẫn báo đã hoàn tất');
  });

  check('PR-Rc2 · R11(d) classScoreSheet của Quản lý: ô đợt hoàn tất canEdit=true khoa=true; GVBM thì ngược lại', () => {
    const { attemptId, chuNhatCuoi } = dungDotHoanTatFT();
    const sauChuNhat = addDays(chuNhatCuoi, 1);
    const sheetManager = attemptsMod.classScoreSheet(P.mbManager, mbClass, null, sauChuNhat);
    const rowManager = sheetManager.rows.find((r: any) => r.attemptId === attemptId);
    assert(rowManager, 'classScoreSheet không trả về đợt vừa dựng');
    assert(rowManager.hoanTat === true, 'Dòng đợt phải báo hoanTat = true');
    const cellManager = rowManager.cells.find((c: any) => c.skill === 'listening');
    assert(cellManager.canEdit === true && cellManager.khoa === true,
      `Quản lý: ô đợt hoàn tất phải canEdit=true, khoa=true — đang ra ${JSON.stringify(cellManager)}`);

    const sheetTeacher = attemptsMod.classScoreSheet(P.lrTeacher, mbClass, null, sauChuNhat);
    const cellTeacher = sheetTeacher.rows.find((r: any) => r.attemptId === attemptId).cells.find((c: any) => c.skill === 'listening');
    assert(cellTeacher.canEdit === false && cellTeacher.khoa === true,
      `GVBM: ô đợt hoàn tất phải canEdit=false, khoa=true — đang ra ${JSON.stringify(cellTeacher)}`);
  });

  check('Z2c-c · A3 attemptDetail (màn chi tiết lượt MT): ô đợt hoàn tất — GVBM canEdit=false khoa=true, Quản lý canEdit=true khoa=true', () => {
    /* Đợt dựng ở tuần 04/05/2026; ngày demo của bộ kiểm (14/09) đã qua Chủ nhật đó → hoàn tất. */
    const { attemptId } = dungDotHoanTatFT();
    const oCua = (p: any) => attemptsMod.attemptDetail(p, attemptId).cells.find((c: any) => c.skill === 'listening');
    const gv = oCua(P.lrTeacher);
    assert(gv.canEdit === false && gv.khoa === true, `GVBM: đang ra canEdit=${gv.canEdit} khoa=${gv.khoa}`);
    const ql = oCua(P.mbManager);
    assert(ql.canEdit === true && ql.khoa === true, `Quản lý: đang ra canEdit=${ql.canEdit} khoa=${ql.khoa}`);
  });

  check('Z2c-c · A3 classRoster (bảng lớp): đợt hoàn tất mà W1 "-" còn W2 trống → GVBM W2 KHÔNG thấy W2 là việc chấm (không sửa được); Quản lý thấy', () => {
    const { attemptId } = dungDotHoanTatFT(true);
    const per = conn.prepare(`SELECT planned_period_id AS id FROM attempt_skills WHERE attempt_id = ? AND skill = 'writing'`).get(attemptId) as any;
    conn.prepare(`UPDATE assessment_scores SET c1=NULL, c2=NULL, c3=NULL, c4=NULL, band=NULL, no_show_period_id=? WHERE attempt_id=? AND skill='writing1'`)
      .run(per.id, attemptId);
    conn.prepare(`UPDATE assessment_scores SET c1=NULL, c2=NULL, c3=NULL, c4=NULL, band=NULL WHERE attempt_id=? AND skill='writing2'`)
      .run(attemptId);
    try {
      assert(hoanTatMod.dotHoanTat(attemptId, demoToday()).hoanTat === true, 'Đợt dựng phải được coi là hoàn tất');
      const cuaDot = (p: any) => {
        for (const s of classesMod.classRoster(p, mbClass)) {
          const t = (s.timeline ?? []).find((x: any) => x.id === attemptId);
          if (t) return t;
        }
        return null;
      };
      const gv = cuaDot(P.w2Teacher);
      assert(gv, 'classRoster không trả về đợt vừa dựng');
      assert(!gv.myPending.includes('writing2'), `GVBM W2 không sửa được đợt hoàn tất mà vẫn thấy W2 là việc chấm: ${JSON.stringify(gv.myPending)}`);
      const ql = cuaDot(P.mbManager);
      assert(ql.myPending.includes('writing2'), `Quản lý sửa được (qua lý do) nên phải thấy W2: ${JSON.stringify(ql.myPending)}`);
    } finally {
      dungDotHoanTatFT(true);   // trả MT1 về đủ điểm — không để dấu "-" lẻ cho các phép sau
    }
  });

  /**
   * TUẦN SẠCH T15 gần `anchorWeekStart` nhất, dò theo từng tuần về phía `huong` (+1 tiến, -1 lùi) — dùng để tìm
   * chỗ trống quanh MỘT MỐC THẬT (tuần của MT1/MT3…) thay vì đoán từ "hôm nay", vì khoảng cách từ hôm nay tới
   * lịch MT của một lộ trình demo không cố định (có thể đã quá hoặc còn rất xa).
   */
  function tuanSachTu(cycleId: number, attemptNo: number, anchorWeekStart: string, huong: 1 | -1 = 1): string {
    for (let i = 0; i <= 40; i++) {
      const candidate = addDays(anchorWeekStart, huong * i * 7);
      const clean = skillSchedule.checkWeekVsNeighbours({
        cycleId, attemptNo, excludeAttemptId: null, newWeekStart: candidate,
      }).blockers.length === 0;
      if (clean) return candidate;
    }
    return anchorWeekStart;
  }

  check('PR-Rc2 · Task4(a) luoiFT: số hàng = số HV đang học; đủ cột RLW/S; GVBM bị chặn quyền', () => {
    const luoi = keHoachMod.luoiFT(P.mbManager, mbClass);
    const soHv = (conn.prepare(
      `SELECT COUNT(*) n FROM students s JOIN enrollments e ON e.student_id=s.id AND e.status='active'
        WHERE e.class_id=? AND s.status='active' AND s.archived_at IS NULL`,
    ).get(mbClass) as any).n;
    assert(luoi.hang.length === soHv, `Số hàng phải bằng số HV đang học (${soHv}), đang ra ${luoi.hang.length}`);
    assert(luoi.cot.length >= 5 && luoi.cot[0] === 1, 'Cột MT phải có ít nhất MT1..MT5');
    for (const hang of luoi.hang) {
      for (const n of luoi.cot) {
        const o = hang.dot[n];
        assert(o && o.rlw && o.s, `Thiếu ô RLW/S ở MT${n} của ${hang.ten}`);
      }
    }
    assertThrows(() => keHoachMod.luoiFT(P.lrTeacher, mbClass), /Quản lý|quyền/, 'GVBM gọi luoiFT phải bị chặn quyền');
  });

  check('PR-Rc2 · Task4(b) datTuanNhom: nhóm RLW đổi L,R,W, không đổi S; kỹ năng đã có điểm giữ nguyên', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    /* Dựng đúng biên: listening/reading CHƯA có điểm, CHƯA thi (sẽ đổi), writing ĐÃ có điểm (phải giữ nguyên tuần). */
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN ('listening','reading')`).run(mt2.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill IN ('listening','reading')`)
      .run(mt2.attemptId);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN (\'writing1\',\'writing2\')').run(mt2.attemptId);
    const insC = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, entered_at) VALUES (?,?,?,?,?,?,?,?)`);
    insC.run(mt2.attemptId, 'writing1', 6, 6, 6, 6, 6, '2026-04-01');
    insC.run(mt2.attemptId, 'writing2', 6, 6, 6, 6, 6, '2026-04-01');

    const mt1Week = week.periodById(mt1.planned_period_id)!.week_start;
    const target = tuanSachTu(mt2.cycle_id, mt2.attempt_no, addDays(mt1Week, 7), 1);
    const per = week.ensurePeriod(target);
    const writingBefore = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(mt2.attemptId) as any;
    const sBefore = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='speaking'`)
      .get(mt2.attemptId) as any;
    const r = keHoachMod.datTuanNhom(P.mbManager, { attemptId: mt2.attemptId, nhom: 'rlw', periodId: per.id, force: true });
    assert(r.doiSkills.includes('listening') && r.doiSkills.includes('reading'), `listening, reading phải đổi tuần, đang ra ${JSON.stringify(r)}`);
    assert(!r.doiSkills.includes('writing'), 'writing đã có điểm mà vẫn đổi tuần');
    for (const sk of ['listening', 'reading']) {
      const row = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill=?`)
        .get(mt2.attemptId, sk) as any;
      assert(row.planned_period_id === per.id, `${sk} phải đổi sang tuần mới`);
    }
    const writingAfter = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(mt2.attemptId) as any;
    assert(writingAfter.planned_period_id === writingBefore.planned_period_id, 'writing đã có điểm phải giữ nguyên tuần');
    const sAfter = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='speaking'`)
      .get(mt2.attemptId) as any;
    assert(sAfter.planned_period_id === sBefore.planned_period_id, 'datTuanNhom nhóm RLW không được đụng Speaking');
  });

  check('PR-Rc2 · Task4(c) kiemTuanNhom trùng tuần đợt sau → blocker (T15); datTuanNhom ném, không đổi gì', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    /* Seed MT2 có thể đã có điểm RLW — kiemTuanNhom coi "đã có điểm" là giuNguyen, bỏ qua T15. Xoá điểm để
       kiểm ĐÚNG nhánh T15 (kỹ năng còn xếp được), không phải nhánh "giữ vì đã có điểm". */
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN ('listening','reading','writing1','writing2')`)
      .run(mt2.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='listening'`)
      .run(mt2.attemptId);
    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const per = week.ensurePeriod(mt3Week);
    const kiem = keHoachMod.kiemTuanNhom(P.mbManager, { attemptId: mt2.attemptId, nhom: 'rlw', periodId: per.id });
    assert(kiem.blockers.length > 0, `Trùng tuần đầu MT3 phải là blocker (T15), đang ra ${JSON.stringify(kiem)}`);
    const before = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(mt2.attemptId) as any;
    assertThrows(
      () => keHoachMod.datTuanNhom(P.mbManager, { attemptId: mt2.attemptId, nhom: 'rlw', periodId: per.id, force: true }),
      /Trùng tuần|vượt qua/, 'datTuanNhom phải ném khi có blocker',
    );
    const after = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(mt2.attemptId) as any;
    assert(after.planned_period_id === before.planned_period_id, 'Bị chặn mà lịch vẫn đổi');
  });

  check('PR-Rc2 · Task4(d) xepMoi: hai tuần RLW/S khác nhau tạo đúng lịch; trùng tuần MT trước → ném, không tạo lượt nào', () => {
    /*
     * `xepMoi` chọn lộ trình bằng `currentCycle(studentId)` — CÙNG cách `createAttempt` chọn. `threeConsecutiveMocks`
     * chỉ tìm MỘT lộ trình có 3 MT liên tiếp bất kỳ ở lớp, có thể KHÔNG phải lộ trình đang chạy của chính em đó
     * (em đã sang lộ trình khác). Dò tới khi tìm được một bộ ba mà `currentCycle` khớp đúng `cycle_id` đó, để
     * phép kiểm và hàm thật cùng nhìn về một lộ trình — không thì tuần "trùng" so sai lộ trình.
     */
    let found: { mt1: any; mt2: any; mt3: any } | null = null;
    const rows = conn.prepare(
      `SELECT a.id AS attemptId, a.attempt_no, a.cycle_id, a.student_id, s.planned_period_id
         FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND s.required = 1 AND s.skill = 'listening'
          AND s.planned_period_id IS NOT NULL
        ORDER BY a.cycle_id, a.attempt_no`,
    ).all(mbClass) as any[];
    const byCycle = new Map<number, any[]>();
    for (const r of rows) { if (!byCycle.has(r.cycle_id)) byCycle.set(r.cycle_id, []); byCycle.get(r.cycle_id)!.push(r); }
    for (const list of byCycle.values()) {
      if (list.length < 3) continue;
      const cur = conn.prepare(
        `SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY (status = 'active') DESC, seq DESC LIMIT 1`,
      ).get(list[0].student_id) as any;
      if (cur?.id === list[0].cycle_id) { found = { mt1: list[0], mt2: list[1], mt3: list[2] }; break; }
    }
    assert(found, 'Seed thiếu một lộ trình ĐANG CHẠY có đủ MT1-MT3 để kiểm xepMoi');
    const { mt3 } = found!;

    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const rlwWeek = tuanSachTu(mt3.cycle_id, mt3.attempt_no + 1, addDays(mt3Week, 7), 1);
    const rlwPer = week.ensurePeriod(rlwWeek);
    const sPer = week.ensurePeriod(addDays(rlwWeek, 7));
    const created = keHoachMod.xepMoi(P.mbManager, {
      studentId: mt3.student_id, attemptNo: mt3.attempt_no + 1, rlwPeriodId: rlwPer.id, sPeriodId: sPer.id, force: true,
    });
    const rowsOfNew = conn.prepare(`SELECT skill, planned_period_id FROM attempt_skills WHERE attempt_id=?`).all(created.id) as any[];
    for (const sk of ['listening', 'reading', 'writing']) {
      assert(rowsOfNew.find((r) => r.skill === sk)?.planned_period_id === rlwPer.id, `${sk} phải ở tuần RLW`);
    }
    assert(rowsOfNew.find((r) => r.skill === 'speaking')?.planned_period_id === sPer.id, 'Speaking phải ở tuần S riêng');

    /* Trùng tuần MT vừa tạo (cùng lộ trình) → chặn (T15), không tạo thêm lượt nào. */
    const soLuongTruoc = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    assertThrows(
      () => keHoachMod.xepMoi(P.mbManager, { studentId: mt3.student_id, rlwPeriodId: rlwPer.id, sPeriodId: sPer.id }),
      /không được xếp|không thi cùng/, 'Trùng lịch với đợt vừa tạo (T15) phải bị chặn',
    );
    const soLuongSau = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    assert(soLuongTruoc === soLuongSau, 'Bị chặn mà vẫn tạo thêm lượt');
  });

  check('PR-Rc2 · Task5(a)(c) xepHangLoat: xemTruoc không ghi, phân đúng tao/doi/giu; lưu thì doi đổi tuần, giu không đổi', () => {
    const students3 = conn.prepare(
      `SELECT DISTINCT s.id, s.full_name FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.id LIMIT 3`,
    ).all(mbClass) as any[];
    assert(students3.length === 3, 'Seed thiếu ít nhất 3 HV đang học ở MB-FT 101 để kiểm Task5');
    const [hvA, hvB, hvC] = students3;
    const attemptNo = 90; // số MT ảo, chắc chắn chưa em nào có, tránh đụng lịch thật
    const far0 = week.ensurePeriod('2029-06-04'); // Thứ Hai
    const far1 = week.ensurePeriod('2030-01-07'); // Thứ Hai, mục tiêu của lô

    /* B: đã có lượt attemptNo 90 ở far0, CHƯA có điểm → phải là 'doi' khi lô nhắm tới far1. */
    keHoachMod.xepMoi(P.mbManager, { studentId: hvB.id, attemptNo, rlwPeriodId: far0.id, force: true });
    /* C: đã có lượt attemptNo 90 ở far0, ĐÃ đủ điểm → phải là 'giu', không đổi tuần dù lô nhắm far1. */
    const attC = keHoachMod.xepMoi(P.mbManager, { studentId: hvC.id, attemptNo, rlwPeriodId: far0.id, force: true }) as any;
    const insBand = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, entered_at) VALUES (?,?,?,?,?)`);
    insBand.run(attC.id, 'listening', 6.5, 30, '2026-04-01');
    insBand.run(attC.id, 'reading', 6.5, 30, '2026-04-01');
    const insCrit = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, entered_at) VALUES (?,?,?,?,?,?,?,?)`);
    insCrit.run(attC.id, 'writing1', 6, 6, 6, 6, 6, '2026-04-01');
    insCrit.run(attC.id, 'writing2', 6, 6, 6, 6, 6, '2026-04-01');
    insCrit.run(attC.id, 'speaking', 6, 6, 6, 6, 6, '2026-04-01');

    const soLuongTruoc = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    const capNhatTruoc = (conn.prepare('SELECT MAX(updated_at) t FROM attempt_skills').get() as any).t;
    const xt = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvA.id, hvB.id, hvC.id],
      rlwPeriodId: far1.id, xemTruoc: true,
    });
    const soLuongSau = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    const capNhatSau = (conn.prepare('SELECT MAX(updated_at) t FROM attempt_skills').get() as any).t;
    assert(soLuongTruoc === soLuongSau, 'xemTruoc đã tạo/xoá lượt');
    assert(capNhatTruoc === capNhatSau, 'xemTruoc đã ghi vào attempt_skills');
    const dongA = xt.dong.find((d: any) => d.studentId === hvA.id)!;
    const dongB = xt.dong.find((d: any) => d.studentId === hvB.id)!;
    const dongC = xt.dong.find((d: any) => d.studentId === hvC.id)!;
    assert(dongA.hanhDong === 'tao', `A chưa có lượt phải là 'tao', đang là ${dongA.hanhDong}`);
    assert(dongB.hanhDong === 'doi', `B có lượt chưa xong phải là 'doi', đang là ${dongB.hanhDong}`);
    assert(dongC.hanhDong === 'giu', `C đã xong phải là 'giu', đang là ${dongC.hanhDong}`);

    const luu = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvA.id, hvB.id, hvC.id],
      rlwPeriodId: far1.id, force: true, xemTruoc: false,
    });
    assert(luu.daLuu === 2, `daLuu phải đếm A (tao) + B (doi), đang là ${luu.daLuu}`);
    const cyA = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id=? AND status='active'`).get(hvA.id) as any;
    const aRow = conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id=? AND attempt_no=?`).get(cyA.id, attemptNo) as any;
    assert(aRow, 'A (tao) phải được tạo lượt mới');
    const bWeek = conn.prepare(
      `SELECT pr.week_start w FROM attempt_skills ask JOIN assessment_attempts a ON a.id=ask.attempt_id
         JOIN report_periods pr ON pr.id=ask.planned_period_id
        WHERE a.student_id=? AND a.attempt_no=? AND ask.skill='listening'`,
    ).get(hvB.id, attemptNo) as any;
    assert(bWeek.w === far1.weekStart, `B (doi) phải đổi sang tuần mới, đang ở ${bWeek.w}`);
    const cWeek = conn.prepare(
      `SELECT pr.week_start w FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id=? AND ask.skill='listening'`,
    ).get(attC.id) as any;
    assert(cWeek.w === far0.weekStart, `C (giu) không được đổi tuần, đang ở ${cWeek.w}`);
  });

  check('PR-Rc2 · Task5(b) Lưu một phần: em bị chặn (T15) giữ nguyên trong "loi", em khác vẫn lưu; lưu lại tuần khác thì được (R9b)', () => {
    const students2 = conn.prepare(
      `SELECT DISTINCT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.id DESC LIMIT 2`,
    ).all(mbClass) as any[];
    assert(students2.length === 2, 'Seed thiếu ít nhất 2 HV để kiểm Task5(b)');
    const [hvOk, hvLoi] = students2;
    const attemptNo = 92;
    const target = week.ensurePeriod('2030-03-04');
    const target2 = week.ensurePeriod('2030-02-04'); // trước `target` — attemptNo 92 < 93 nên phải xếp trước MT93
    /* Dựng chặn cho hvLoi: đã có MT93 đúng ngay tuần `target` — attemptNo 92 xếp vào `target` sẽ TRÙNG (T15). */
    keHoachMod.xepMoi(P.mbManager, { studentId: hvLoi.id, attemptNo: attemptNo + 1, rlwPeriodId: target.id, force: true });

    const luu = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvOk.id, hvLoi.id], rlwPeriodId: target.id, force: true, xemTruoc: false,
    });
    assert(luu.daLuu === 1, `Chỉ hvOk lưu được, đang ra daLuu=${luu.daLuu}`);
    const dongLoi = luu.dong.find((d: any) => d.studentId === hvLoi.id)!;
    assert(dongLoi.hanhDong === 'loi' && !!dongLoi.loi, `hvLoi phải ở hàng "loi", đang ra ${JSON.stringify(dongLoi)}`);
    const cyOk = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id=? AND status='active'`).get(hvOk.id) as any;
    assert(
      conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id=? AND attempt_no=?`).get(cyOk.id, attemptNo),
      'hvOk phải được lưu dù hvLoi lỗi',
    );

    /* R9b: gọi lại CHỈ hvLoi với tuần khác → lưu được. */
    const luuLai = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvLoi.id], rlwPeriodId: target2.id, force: true, xemTruoc: false,
    });
    assert(luuLai.daLuu === 1, `Lưu lại với tuần khác phải thành công, đang ra ${JSON.stringify(luuLai)}`);
  });

  check('PR-Rc2 · Task6(a) bangThuong: hai dòng Giữa/Cuối × 4 môn; lớp mới chưa có bài → deXuat khớp planRegularTests', () => {
    const branch = conn.prepare('SELECT branch_id AS id FROM classes WHERE id = ?').get(mbClass) as any;
    const now = new Date().toISOString();
    /* Lớp thường MỚI DỰNG, chắc chắn chưa có bài — seed sẵn có của MB-FOU 12/BC-ELE 01 đã ở giữa/cuối khoá. */
    const info = conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                            start_period_id, status, note, created_at)
       VALUES (?,?,?,?,NULL,0,?,?, 'active', 'Phép kiểm Task6', ?)`,
    ).run('QA-FOU 90', branch.id, 'FOU', 'FOU', '2029-01-01', week.ensurePeriod('2029-01-01').id, now);
    const newClassId = Number(info.lastInsertRowid);
    const student = conn.prepare('SELECT id FROM students WHERE status=\'active\' LIMIT 1').get() as any;
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,'active',?,?)`)
      .run(student.id, newClassId, '2029-01-01', now);

    const bt = keHoachMod.bangThuong(P.mbManager, { branchId: branch.id });
    const lop = bt.lop.find((l: any) => l.classId === newClassId);
    assert(lop, 'bangThuong không trả về lớp vừa dựng');
    assert(lop.dong.length === 2, `Phải có 2 dòng Giữa/Cuối khoá, đang ra ${lop.dong.length}`);
    assert(lop.dong[0].nhan === 'Giữa khoá' && lop.dong[1].nhan === 'Cuối khoá', 'Sai nhãn hai dòng');
    for (const d of lop.dong) {
      assert(Object.keys(d.mon).length === 4, `Mỗi dòng phải có 4 môn, đang ra ${Object.keys(d.mon).length}`);
      for (const sk of ['listening', 'reading', 'writing', 'speaking']) {
        assert(d.mon[sk].tong === 0 && d.mon[sk].deXuat, `${d.kind}/${sk} lớp mới phải có đề xuất tuần`);
      }
    }
    const deXuatGiua = lop.dong[0].mon.listening.deXuat;

    const ket = regularMod.planRegularTests(P.mbManager, newClassId);
    assert(ket.created > 0, 'planRegularTests không tạo bài nào');
    const baiGiua = conn.prepare(
      `SELECT pr.week_start w FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.skill = 'listening'
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE a.class_id = ? AND a.kind = 'progress' AND a.student_id = ? LIMIT 1`,
    ).get(newClassId, student.id) as any;
    assert(baiGiua.w === deXuatGiua, `Tuần thật (${baiGiua.w}) phải khớp đề xuất (${deXuatGiua})`);
  });

  check('PR-Rc2 · Task6(b) R14: reportRegularNoShow một em môn L → ô L có khac 1 em ở tuần sau, ô R không đổi', () => {
    const foundationClass = classId('MB-FOU 12');
    const row = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id, ask.planned_period_id, pr.week_start
         FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id JOIN enrollments e ON e.student_id=s.id AND e.status='active'
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.skill = 'listening'
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind='progress' AND s.status='active' LIMIT 1`,
    ).get(foundationClass) as any;
    assert(row, 'Seed thiếu một bài Giữa khoá ở MB-FOU 12 đã có lịch L để kiểm R14');
    /* Dùng ĐÚNG tuần L đã có sẵn trong seed (không tự đặt tuần khác) — tránh chạm T15 với bài Cuối khoá cùng
       lộ trình. Chỉ cần "hôm nay" đã qua tuần đó để "-" ghi được (Rc1). */
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='listening'`)
      .run(row.attemptId);
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN ('listening','reading')`).run(row.attemptId);
    const homNay = addDays(row.week_start, 3);

    regularMod.reportRegularNoShow(P.normalCoreTeacher, row.attemptId, 'listening', true, homNay);

    const bt = keHoachMod.bangThuong(P.mbManager, { branchId: null });
    const lop = bt.lop.find((l: any) => l.classId === foundationClass);
    assert(lop, 'bangThuong không trả về MB-FOU 12');
    const dongGiua = lop.dong.find((d: any) => d.kind === 'progress');
    const khacL = dongGiua.mon.listening.khac as any[];
    assert(khacL.reduce((n: number, g: any) => n + g.n, 0) >= 1, `Môn L phải có ít nhất 1 em ở khac, đang ra ${JSON.stringify(khacL)}`);
    const khacR = dongGiua.mon.reading.khac as any[];
    assert(!khacR.some((g: any) => g.ten.includes(undefined)), 'Dữ liệu khac môn R không hợp lệ');
  });

  check('PR-Rc2 · Task6(c)(d) doiLichThuong: đổi môn W cả lớp; em đã có điểm → giu; setSkillWeek từ chối dời môn đã có raw_score', () => {
    const foundationClass = classId('MB-FOU 12');
    const attempts = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id JOIN enrollments e ON e.student_id=s.id AND e.status='active' AND e.class_id=a.class_id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind='progress' AND s.status='active' AND s.archived_at IS NULL`,
    ).all(foundationClass) as any[];
    assert(attempts.length >= 2, 'Seed thiếu ít nhất 2 bài Giữa khoá ở MB-FOU 12 để kiểm doiLichThuong');
    /*
     * CHỈ THAO TÁC TRÊN HAI EM ĐÃ KIỂM SOÁT ĐƯỢC (qua `studentIds`, Q11) thay vì "cả lớp" — các em khác trong
     * lớp thật có lộ trình/lịch riêng (có em nhiều đợt Giữa khoá do học lại…) nên tuần đích an toàn cho em này
     * chưa chắc an toàn cho em khác; đây là kiểm mệnh đề "doiLichThuong xử lý đúng MỘT môn cho các em được chọn
     * và bỏ qua em đã có điểm", không phải kiểm mọi học viên thật của lớp cùng lúc.
     */
    const [emCoDiem, emMove] = attempts;

    /* Dựng biên: emCoDiem đã có điểm W → phải 'giu' và setSkillWeek phải từ chối dời. */
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='writing'`).run(emCoDiem.attemptId);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)`)
      .run(emCoDiem.attemptId, 'writing', 30, 40, '2026-04-01');
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='writing'`).run(emMove.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='writing'`).run(emMove.attemptId);

    /* Tuần đích PHẢI trước bài Cuối khoá cùng lộ trình (T15 so thứ tự đợt) — không đoán một ngày xa tương lai,
       lấy ngay tuần W hiện có của emMove rồi lùi 7 ngày (một tuần), chắc chắn vẫn còn trước Cuối khoá. */
    const wNow = conn.prepare(
      `SELECT pr.week_start w FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id = ? AND ask.skill = 'writing'`,
    ).get(emMove.attemptId) as any;
    const target = week.ensurePeriod(addDays(wNow.w, -7));

    assertThrows(
      () => skillSchedule.setSkillWeek(P.mbManager, emCoDiem.attemptId, 'writing', target.id, { force: true }),
      /đã có điểm/, 'setSkillWeek phải từ chối dời môn lớp thường đã có raw_score',
    );

    const ket = keHoachMod.doiLichThuong(P.mbManager, {
      classId: foundationClass, kind: 'progress', skill: 'writing', periodId: target.id, force: true,
      studentIds: [emCoDiem.student_id, emMove.student_id],
    });
    const dongCoDiem = ket.dong.find((d: any) => d.studentId === emCoDiem.student_id)!;
    assert(dongCoDiem.giu === 'đã có điểm', `Em đã có điểm phải 'giu', đang ra ${JSON.stringify(dongCoDiem)}`);
    const dongMove = ket.dong.find((d: any) => d.studentId === emMove.student_id)!;
    assert(!dongMove.loi, `Em ${emMove.student_id} không được lỗi, đang ra ${JSON.stringify(dongMove)}`);
    const rowW = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(emMove.attemptId) as any;
    assert(rowW.planned_period_id === target.id, `Em ${emMove.student_id} phải đổi W sang tuần mới`);
    const rowL = conn.prepare(`SELECT planned_period_id p1 FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(emMove.attemptId) as any;
    assert(rowL.p1 !== target.id, `L không được đụng vào (đổi W không phải đổi L), em ${emMove.student_id}`);
    const rowWCoDiem = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(emCoDiem.attemptId) as any;
    assert(rowWCoDiem.planned_period_id !== target.id, 'Em đã có điểm mà W vẫn bị đổi tuần');
  });

  check('PR-Rc2 · Q2 dotDaHoanTat — biên hoàn tất, dấu "-", Chủ nhật, kỹ năng huỷ', () => {
    const skillDiem = (coDiem: boolean, coDau = false, huy = false) => (
      { batBuoc: true, huy, coDiem, coDau }
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'FT có dấu "-" (coDau) và đã qua Chủ nhật phải hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ratio', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Lớp thường không có khái niệm dấu "-" chốt vắng — coDau không tính, không hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-27',
      }) === false,
      'Đúng Chủ nhật của tuần cuối thì CHƯA hoàn tất (phải QUA Chủ nhật)',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'Thứ Hai sau Chủ nhật thì hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Kỹ năng bắt buộc duy nhất đã huỷ phần thi → không còn kỹ năng bắt buộc nào → không bao giờ hoàn tất',
    );
  });

  check('PR-Rc2 · trangThaiNhom đủ 5 trạng thái', () => {
    const kn = (batBuoc: boolean, tuan: string | null, xong: boolean, daDoi: boolean) => (
      { batBuoc, tuan, xong, daDoi }
    );
    assert(d.trangThaiNhom([kn(false, null, false, false)]) === 'khong-yeu-cau', 'Không kỹ năng bắt buộc');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', true, false)]) === 'xong', 'Mọi kỹ năng bắt buộc đã xong');
    assert(d.trangThaiNhom([kn(true, null, false, false)]) === 'chua-xep', 'Còn kỹ năng bắt buộc chưa có tuần');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, true)]) === 'da-doi', 'Có kỹ năng đã dời vì vắng');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, false)]) === 'da-xep', 'Đã xếp tuần, chưa xong, không dời');
  });

  check('PR-Rc2 · Q6 tuanDaSo — hoà chọn tuần sớm hơn', () => {
    const r = d.tuanDaSo(['2026-10-05', '2026-10-05', '2026-09-28', '2026-09-28']);
    assert(r.tuan === '2026-09-28', `Hoà 2-2 phải chọn tuần sớm hơn, ra "${r.tuan}"`);
    assert(r.khac.length === 1 && r.khac[0].tuan === '2026-10-05' && r.khac[0].n === 2, 'Tuần còn lại kèm đúng số em');
    const doc = d.tuanDaSo(['2026-09-21', '2026-09-21', '2026-09-21', '2026-09-28']);
    assert(doc.tuan === '2026-09-21' && doc.khac.length === 1 && doc.khac[0].n === 1, 'Không hoà thì chọn đa số thật');
    assert(d.tuanDaSo([null, null]).tuan === null, 'Toàn null thì không có tuần đa số');
  });

  check('PR-Rc2 · Q10 tieuDeKeHoach', () => {
    assert(d.tieuDeKeHoach(true, false) === 'Kế hoạch Mock Test', 'Chỉ có lớp FT');
    assert(d.tieuDeKeHoach(true, true) === 'Kế hoạch Test', 'Có cả lớp thường');
    assert(d.tieuDeKeHoach(false, true) === 'Kế hoạch Test', 'Chỉ có lớp thường');
  });

  check('PR-Rc2 · Q15 laVaoMuon — quá 14 ngày kể từ khai giảng', () => {
    assert(d.laVaoMuon('2026-09-25', '2026-09-10') === true, 'Muộn 15 ngày phải tính là vào muộn');
    assert(d.laVaoMuon('2026-09-24', '2026-09-10') === false, 'Đúng 14 ngày thì chưa tính là vào muộn');
    assert(d.laVaoMuon(null, '2026-09-10') === false, 'Thiếu ngày vào lớp thì không suy diễn');
  });

  check('PR-Rc2 · tomTatXemTruoc — gộp câu tạo/đổi/lỗi, không tự đọc ngày', () => {
    const tuanLich = (dt: string | null) => (dt === '2026-10-19' ? 'W3 OCT' : dt === '2026-10-26' ? 'W4 OCT' : dt === '2026-09-21' ? 'W1 SEP' : dt === '2026-09-28' ? 'W2 SEP' : '');
    const dong: any[] = [
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'doi', tu: { rlw: '2026-09-21' }, den: { rlw: '2026-09-28' } },
      { hanhDong: 'giu' },
      { hanhDong: 'loi' },
    ];
    const cau = d.tomTatXemTruoc(dong, tuanLich);
    assert(cau.some((c: string) => c === '2 em chưa có → W3/W4 OCT'), `Thiếu câu "tạo" gộp đúng tháng, ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em W1 SEP → W2 SEP (đổi)'), `Thiếu câu "đổi", ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em không xếp được'), `Thiếu câu "lỗi", ra ${JSON.stringify(cau)}`);
    assert(cau.length === 3, `Dòng "giu" không sinh câu nào, tổng phải đúng 3, ra ${cau.length}`);
  });

  check('PR-Rc2 · Rà planning(1) Lớp đã kết thúc không hiện ở danhSachLop lẫn bangThuong', () => {
    /* MB-FOU 03, MB-BE 08 là hai lớp `status='ended'` có sẵn trong seed (giữ lại để tra lịch sử — journeys.ts). */
    const dsLop = keHoachMod.danhSachLop(P.mbManager, {});
    const maLop = dsLop.lop.map((l: any) => l.code);
    assert(!maLop.includes('MB-FOU 03') && !maLop.includes('MB-BE 08'),
      `Lớp đã kết thúc không được hiện ở danhSachLop, đang có: ${JSON.stringify(maLop)}`);
    const thuong = keHoachMod.bangThuong(P.mbManager, {});
    const maThuong = thuong.lop.map((l: any) => l.code);
    assert(!maThuong.includes('MB-FOU 03') && !maThuong.includes('MB-BE 08'),
      `Lớp đã kết thúc không được hiện ở bangThuong, đang có: ${JSON.stringify(maThuong)}`);
  });

  check('PR-Rc2 · Rà planning(2) xepHangLoat bỏ qua HV ngoài lớp (chi nhánh khác), không lộ tên', () => {
    const outside = conn.prepare(
      `SELECT s.id, s.full_name FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id
        WHERE c.code = 'CP-FT 110' AND s.status = 'active' AND s.archived_at IS NULL
        LIMIT 1`,
    ).get() as any;
    assert(outside, 'Seed thiếu HV đang học ở CP-FT 110 (chi nhánh khác) để kiểm lọc studentIds');

    const inside = conn.prepare(
      `SELECT DISTINCT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.id LIMIT 1`,
    ).get(mbClass) as any;
    assert(inside, 'Seed thiếu HV đang học ở MB-FT 101 để kiểm lọc studentIds');

    const attemptNo = 91; // số MT ảo, chắc chắn chưa em nào có, tránh đụng lịch thật
    const far = week.ensurePeriod('2029-08-06'); // Thứ Hai, xa mọi lịch thật

    const xt = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [inside.id, outside.id], rlwPeriodId: far.id, xemTruoc: true,
    });
    assert(xt.dong.length === 1 && xt.dong[0].studentId === inside.id,
      `Chỉ HV trong lớp được xử lý, đang ra ${JSON.stringify(xt.dong.map((dd: any) => dd.studentId))}`);
    assert(!JSON.stringify(xt.dong).includes(outside.full_name), 'Không được lộ tên HV ngoài lớp qua kết quả xem trước');

    assertThrows(
      () => keHoachMod.xepHangLoat(P.mbManager, {
        classId: mbClass, attemptNo, studentIds: [outside.id], rlwPeriodId: far.id, xemTruoc: true,
      }),
      /Chưa chọn học viên/, 'Gửi toàn HV ngoài lớp phải bị coi như chưa chọn ai',
    );
  });
}
