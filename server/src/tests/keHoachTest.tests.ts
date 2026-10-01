/**
 * PHÉP KIỂM PR-Rc2: Kế hoạch Test (spec §3.5 "Kế hoạch Test"; kiểm kê §1.4 R9, R9b, R10, R11, R12, R14; §3 dòng 14).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database.
 */
import { boLichTuTao } from './luotThu.ts';
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
  const { demoToday, setConfig } = await import('../demoConfig.ts');
  /**
   * PR-XLMT (K2-33): không dời lượt có sẵn vào tuần ĐÃ QUA. Các phép kiểm cũ dưới đây chọn tuần đích quanh lịch seed (trước ngày demo)
   * chỉ để thử luật khác — chạy chúng với "hôm nay" lùi về đầu năm để tuần đích là tuần tương lai; luật được thử không đổi.
   */
  const truocNgayDemo = <T,>(fn: () => T): T => {
    const cu = demoToday();
    setConfig('demo_date', '2026-01-05');
    try { return fn(); } finally { setConfig('demo_date', cu); }
  };
  const { can } = await import('../permissions.ts');
  console.log('\nPR-Rc2 · Kế hoạch Test');

  const mbClass = classId('MB FT 101');
  /*
   * PR-MT (T36): số MT phải liền mạch — các phép kiểm cũ dùng "số MT ảo" 80–95 trên em có sẵn nay dùng EM THỬ MỚI (Thêm HV rồi bỏ
   * lịch tự tạo) với số MT thật 1, 2 — cùng ý kiểm, không nới luật.
   */
  const intakeMod: any = await import('../classes/intake.ts');
  let demEmMoi = 0;
  const emMoiFT = (ten: string): number => {
    demEmMoi += 1;
    const r = intakeMod.commitIntake(P.admin, { classId: mbClass, rows: [{ fullName: `KH ${ten} ${demEmMoi}`, target: 7, email: 'hv@demo.test' }] });
    const sid = r.studentIds[0] as number;
    boLichTuTao(conn, (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id);
    return sid;
  };
  /** MT1/MT2/MT3 liên tiếp cùng lộ trình ở MB FT 101 — cùng câu truy vấn của phép T13/T15 ở `run.ts`. */
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

  check('T9 · Kết quả gần nhất dùng Target TẠI THỜI ĐIỂM THI, không dùng target hiện tại của lộ trình', () => {
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
    assert(row, 'Seed thiếu một MT1 ở MB FT 101 để dựng đợt hoàn tất (R11)');
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
    const foundationClass = classId('MB FOU 12');
    const row = conn.prepare(
      `SELECT id AS attemptId FROM assessment_attempts
        WHERE class_id = ? AND status != 'cancelled' AND kind = 'progress' LIMIT 1`,
    ).get(foundationClass) as any;
    assert(row, 'Seed thiếu một bài Giữa khoá ở MB FOU 12 để kiểm R11 lớp thường');
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

  const KY = ['listening', 'reading', 'writing', 'speaking'] as const;
  /** Cùng một tuần cho cả bốn kỹ năng. */
  const t4 = (periodId: number) => ({ listening: periodId, reading: periodId, writing: periodId, speaking: periodId });

  check('PR-Rc2 · Task4(a) luoiFT: số hàng = số HV đang học; mỗi ô có lượt đủ 4 kỹ năng; GVBM bị chặn quyền', () => {
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
        assert(o && o.kn, `Thiếu ô MT${n} của ${hang.ten}`);
        if (o.attemptId) {
          for (const k of KY) assert(o.kn[k], `MT${n} của ${hang.ten} thiếu kỹ năng ${k}`);
        } else {
          assert(Object.keys(o.kn).length === 0, `Ô chưa có lượt phải không có kỹ năng nào (MT${n}, ${hang.ten})`);
        }
      }
    }
    assertThrows(() => keHoachMod.luoiFT(P.lrTeacher, mbClass), /Quản lý|quyền/, 'GVBM gọi luoiFT phải bị chặn quyền');
  });

  check('PR-Rc2 · Task4(b) luuDot: đổi L, R, không đổi S; kỹ năng đã có điểm giữ nguyên', () => {
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
    /* Hộp chip gửi cả L, R, W (cùng tuần mới) — W đã có điểm nên bị bỏ qua; S không gửi nên không đổi. */
    const r = truocNgayDemo(() => keHoachMod.luuDot(P.mbManager, {
      attemptId: mt2.attemptId, force: true, reason: 'PR-XLMT: tuần thi đã bắt đầu cần lý do',
      kyNang: [{ skill: 'listening', periodId: per.id }, { skill: 'reading', periodId: per.id }, { skill: 'writing', periodId: per.id }],
    }));
    assert(r.doi.includes('listening') && r.doi.includes('reading'), `listening, reading phải đổi tuần, đang ra ${JSON.stringify(r)}`);
    assert(!r.doi.includes('writing'), 'writing đã có điểm mà vẫn đổi tuần');
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
    assert(sAfter.planned_period_id === sBefore.planned_period_id, 'luuDot L R W không được đụng Speaking');
  });

  check('PR-Rc2 · Task4(c) kiemDot trùng tuần đợt sau → chan (T15); luuDot ném, không đổi gì', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    /* Seed MT2 có thể đã có điểm — kiemDot coi "đã có điểm" là giu, bỏ qua T15. Xoá điểm để kiểm ĐÚNG nhánh T15. */
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN ('listening','reading','writing1','writing2')`)
      .run(mt2.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='listening'`)
      .run(mt2.attemptId);
    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const per = week.ensurePeriod(mt3Week);
    const kiem = keHoachMod.kiemDot(P.mbManager, { attemptId: mt2.attemptId, kyNang: [{ skill: 'listening', periodId: per.id }] });
    assert(kiem.bai.length === 1 && kiem.bai[0].ghiChu === 'chan', `Trùng tuần đầu MT3 phải là chan (T15), đang ra ${JSON.stringify(kiem)}`);
    const before = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(mt2.attemptId) as any;
    assertThrows(
      () => keHoachMod.luuDot(P.mbManager, { attemptId: mt2.attemptId, kyNang: [{ skill: 'listening', periodId: per.id }], force: true }),
      /Trùng tuần|vượt qua/, 'luuDot phải ném khi có bài bị chặn',
    );
    const after = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(mt2.attemptId) as any;
    assert(after.planned_period_id === before.planned_period_id, 'Bị chặn mà lịch vẫn đổi');
  });

  check('PR-Rc2 · Task4(d) xepMoi: tuần L R W / S khác nhau tạo đúng lịch; trùng tuần MT trước → ném, không tạo lượt nào', () => {
    /*
     * `xepMoi` chọn lộ trình bằng `currentCycle(studentId)` — CÙNG cách `createAttempt` chọn. `threeConsecutiveMocks`
     * chỉ tìm MỘT lộ trình có 3 MT liên tiếp bất kỳ ở lớp, có thể KHÔNG phải lộ trình đang chạy của chính em đó
     * (em đã sang lộ trình khác). Dò tới khi tìm được một bộ ba mà `currentCycle` khớp đúng `cycle_id` đó.
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
      /* PR-MT: lấy BA LƯỢT CUỐI — MT kế tiếp (mt3 + 1) phải là số còn trống của lộ trình (T36). */
      if (cur?.id === list[0].cycle_id) { found = { mt1: list[list.length - 3], mt2: list[list.length - 2], mt3: list[list.length - 1] }; break; }
    }
    assert(found, 'Seed thiếu một lộ trình ĐANG CHẠY có đủ MT1-MT3 để kiểm xepMoi');
    const { mt3 } = found!;

    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const rlwWeek = tuanSachTu(mt3.cycle_id, mt3.attempt_no + 1, addDays(mt3Week, 7), 1);
    const rlwPer = week.ensurePeriod(rlwWeek);
    const sPer = week.ensurePeriod(addDays(rlwWeek, 7));
    const created = keHoachMod.xepMoi(P.mbManager, {
      studentId: mt3.student_id, attemptNo: mt3.attempt_no + 1,
      tuan: { listening: rlwPer.id, reading: rlwPer.id, writing: rlwPer.id, speaking: sPer.id }, force: true,
    });
    const rowsOfNew = conn.prepare(`SELECT skill, planned_period_id FROM attempt_skills WHERE attempt_id=?`).all(created.id) as any[];
    for (const sk of ['listening', 'reading', 'writing']) {
      assert(rowsOfNew.find((r) => r.skill === sk)?.planned_period_id === rlwPer.id, `${sk} phải ở tuần L R W`);
    }
    assert(rowsOfNew.find((r) => r.skill === 'speaking')?.planned_period_id === sPer.id, 'Speaking phải ở tuần S riêng');

    /* Thiếu tuần của một kỹ năng (không bỏ kỹ năng đó) → ném. */
    assertThrows(
      () => keHoachMod.xepMoi(P.mbManager, { studentId: mt3.student_id, tuan: { listening: rlwPer.id, reading: rlwPer.id, writing: rlwPer.id } }),
      /cả 4 kỹ năng/, 'Thiếu tuần Speaking mà vẫn xếp được',
    );
    /* Trùng tuần MT vừa tạo (cùng lộ trình) → chặn (T15), không tạo thêm lượt nào. */
    const soLuongTruoc = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    assertThrows(
      () => keHoachMod.xepMoi(P.mbManager, { studentId: mt3.student_id, tuan: { listening: rlwPer.id, reading: rlwPer.id, writing: rlwPer.id, speaking: sPer.id } }),
      /không được xếp|không thi cùng/, 'Trùng lịch với đợt vừa tạo (T15) phải bị chặn',
    );
    const soLuongSau = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    assert(soLuongTruoc === soLuongSau, 'Bị chặn mà vẫn tạo thêm lượt');
  });

  check('PR-Rc2 · Task5(a)(c) xepHangLoat: xemTruoc không ghi, phân đúng tao/doi/giu; lưu thì doi đổi tuần, giu không đổi', () => {
    const [hvA, hvB, hvC] = ['T5 A', 'T5 B', 'T5 C'].map((x) => ({ id: emMoiFT(x) }));
    const attemptNo = 1; // PR-MT: em thử mới chưa có lượt nào — MT1 là số hợp lệ duy nhất
    const far0 = week.ensurePeriod('2029-06-04'); // Thứ Hai
    const far1 = week.ensurePeriod('2030-01-07'); // Thứ Hai, Target của lô

    /* B: đã có lượt MT1 ở far0, CHƯA có điểm → phải là 'doi' khi lô nhắm tới far1. */
    keHoachMod.xepMoi(P.mbManager, { studentId: hvB.id, attemptNo, tuan: t4(far0.id), force: true });
    /* C: đã có lượt MT1 ở far0, ĐÃ đủ điểm → phải là 'giu', không đổi tuần dù lô nhắm far1. */
    const attC = keHoachMod.xepMoi(P.mbManager, { studentId: hvC.id, attemptNo, tuan: t4(far0.id), force: true }) as any;
    const insBand = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, entered_at) VALUES (?,?,?,?,?)`);
    insBand.run(attC.id, 'listening', 6.5, 30, '2026-04-01');
    insBand.run(attC.id, 'reading', 6.5, 30, '2026-04-01');
    const insCrit = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, entered_at) VALUES (?,?,?,?,?,?,?,?)`);
    insCrit.run(attC.id, 'writing1', 6, 6, 6, 6, 6, '2026-04-01');
    insCrit.run(attC.id, 'writing2', 6, 6, 6, 6, 6, '2026-04-01');
    insCrit.run(attC.id, 'speaking', 6, 6, 6, 6, 6, '2026-04-01');

    const soLuongTruoc = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    const capNhatTruoc = (conn.prepare('SELECT MAX(updated_at) t FROM attempt_skills').get() as any).t;
    /* PR-XLMT (K4-17): em đã đủ MT1 mặc định tự sang MT2 — muốn thử "giu" thì Quản lý bấm chip MT1 riêng cho C (`dotTheoEm`). */
    const dotTheoEm = { [hvC.id]: attemptNo };
    const xt = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvA.id, hvB.id, hvC.id], tuan: t4(far1.id), xemTruoc: true, dotTheoEm,
    });
    const soLuongSau = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
    const capNhatSau = (conn.prepare('SELECT MAX(updated_at) t FROM attempt_skills').get() as any).t;
    assert(soLuongTruoc === soLuongSau, 'xemTruoc đã tạo/xoá lượt');
    assert(capNhatTruoc === capNhatSau, 'xemTruoc đã ghi vào attempt_skills');
    const dongA = xt.dong.find((x: any) => x.studentId === hvA.id)!;
    const dongB = xt.dong.find((x: any) => x.studentId === hvB.id)!;
    const dongC = xt.dong.find((x: any) => x.studentId === hvC.id)!;
    assert(dongA.hanhDong === 'tao', `A chưa có lượt phải là 'tao', đang là ${dongA.hanhDong}`);
    assert(dongA.bai.length === 4 && dongA.bai.every((b: any) => b.ghiChu === 'moi'), 'A phải có 4 bài "moi"');
    assert(dongB.hanhDong === 'doi', `B có lượt chưa xong phải là 'doi', đang là ${dongB.hanhDong}`);
    assert(dongC.hanhDong === 'giu', `C đã xong phải là 'giu', đang là ${dongC.hanhDong}`);

    const luu = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvA.id, hvB.id, hvC.id], tuan: t4(far1.id), force: true, xemTruoc: false, dotTheoEm,
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
    const [hvOk, hvLoi] = ['T5b Ok', 'T5b Loi'].map((x) => ({ id: emMoiFT(x) }));
    const attemptNo = 2;
    const target = week.ensurePeriod('2030-03-04');
    const target2 = week.ensurePeriod('2030-04-01'); // SAU `target` — MT2 phải xếp sau MT1 (T15)
    /* PR-MT (T36): MT2 cần MT1. hvOk có MT1 sớm hơn hẳn; hvLoi có MT1 đúng tuần `target` → MT2 vào `target` sẽ TRÙNG (T15). */
    keHoachMod.xepMoi(P.mbManager, { studentId: hvOk.id, attemptNo: 1, tuan: t4(week.ensurePeriod('2030-01-07').id), force: true });
    keHoachMod.xepMoi(P.mbManager, { studentId: hvLoi.id, attemptNo: 1, tuan: t4(target.id), force: true });

    const luu = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvOk.id, hvLoi.id], tuan: t4(target.id), force: true, xemTruoc: false,
    });
    assert(luu.daLuu === 1, `Chỉ hvOk lưu được, đang ra daLuu=${luu.daLuu}`);
    const dongLoi = luu.dong.find((x: any) => x.studentId === hvLoi.id)!;
    assert(dongLoi.hanhDong === 'loi' && !!dongLoi.loi, `hvLoi phải ở hàng "loi", đang ra ${JSON.stringify(dongLoi)}`);
    assert(d.emGiuLaiSauLuu(luu.dong).join() === String(hvLoi.id), 'R9b: chỉ hvLoi còn ở lại sau khi lưu');
    const cyOk = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id=? AND status='active'`).get(hvOk.id) as any;
    assert(
      conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id=? AND attempt_no=?`).get(cyOk.id, attemptNo),
      'hvOk phải được lưu dù hvLoi lỗi',
    );

    /* R9b: gọi lại CHỈ hvLoi với tuần khác → lưu được. */
    const luuLai = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [hvLoi.id], tuan: t4(target2.id), force: true, xemTruoc: false,
    });
    assert(luuLai.daLuu === 1, `Lưu lại với tuần khác phải thành công, đang ra ${JSON.stringify(luuLai)}`);
  });

  check('PR-Rc2 · Task6(a) luoiThuong: hai cột Giữa/Cuối × 4 kỹ năng từng em; lớp mới chưa có bài → deXuat khớp planRegularTests', () => {
    const foundationClass = classId('MB FOU 12');
    const foundation = keHoachMod.luoiThuong(P.mbManager, foundationClass);
    assert(foundation.cot.length === 2 && foundation.cot[0].nhan === 'Giữa khoá' && foundation.cot[1].nhan === 'Cuối khoá', 'MB FOU 12 phải có 2 cột Giữa/Cuối khoá');
    assert(foundation.hang.length >= 2, 'MB FOU 12 phải có hàng từng học viên');
    for (const h of foundation.hang) {
      for (const kind of ['progress', 'final']) {
        const o = h.dot[kind];
        if (!o.attemptId) continue;
        for (const k of KY) assert(o.kn[k], `${h.ten} · ${kind} thiếu kỹ năng ${k}`);
      }
    }

    const branch = conn.prepare('SELECT branch_id AS id FROM classes WHERE id = ?').get(mbClass) as any;
    const now = new Date().toISOString();
    /* Lớp thường MỚI DỰNG, chắc chắn chưa có bài — seed sẵn có của MB FOU 12/BC ELE 01 đã ở giữa/cuối khoá. */
    const info = conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                            start_period_id, status, note, created_at)
       VALUES (?,?,?,?,NULL,0,?,?, 'active', 'Phép kiểm Task6', ?)`,
    ).run('QA-FOU 90', branch.id, 'FOU', 'FOU', '2029-01-01', week.ensurePeriod('2029-01-01').id, now);
    const newClassId = Number(info.lastInsertRowid);
    const student = conn.prepare('SELECT id FROM students WHERE status=\'active\' LIMIT 1').get() as any;
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,'active',?,?)`)
      .run(student.id, newClassId, '2029-01-01', now);

    const lt = keHoachMod.luoiThuong(P.mbManager, newClassId);
    assert(lt.cot.length === 2 && lt.cot[0].nhan === 'Giữa khoá' && lt.cot[1].nhan === 'Cuối khoá', 'Sai nhãn hai cột');
    assert(lt.cot[0].deXuat && lt.cot[1].deXuat, 'Lớp mới phải có đề xuất tuần cho cả hai cột');
    assert(lt.hvChuaCoLich === 1 && lt.hang.length === 1 && Object.keys(lt.hang[0].dot.progress.kn).length === 0, 'Lớp mới chưa có bài nào');
    const deXuatGiua = lt.cot[0].deXuat;

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

  check('PR-Rc2 · Task6(b) R14: reportRegularNoShow một em môn L → kn.listening của em đó da-doi với tuần mới, em khác không đổi', () => {
    const foundationClass = classId('MB FOU 12');
    const row = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id, ask.planned_period_id, pr.week_start
         FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id JOIN enrollments e ON e.student_id=s.id AND e.status='active' AND e.class_id=a.class_id
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.skill = 'listening'
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind='progress' AND s.status='active' AND s.archived_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts f WHERE f.cycle_id = a.cycle_id AND f.kind = 'final' AND f.status != 'cancelled')   /* PR-LT2a M1b: em vào lớp qua Thêm HV nay tự có Cuối khoá (tuần sau chặn dời L, T15) — chọn em chưa có */
        LIMIT 1`,
    ).get(foundationClass) as any;
    assert(row, 'Seed thiếu một bài Giữa khoá ở MB FOU 12 đã có lịch L để kiểm R14');
    /* Dùng ĐÚNG tuần L đã có sẵn trong seed (không tự đặt tuần khác) — tránh chạm T15 với bài Cuối khoá cùng
       lộ trình. Chỉ cần "hôm nay" đã qua tuần đó để "-" ghi được (Rc1). */
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='listening'`)
      .run(row.attemptId);
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill IN ('listening','reading')`).run(row.attemptId);
    const homNay = addDays(row.week_start, 3);
    const truoc = keHoachMod.luoiThuong(P.mbManager, foundationClass);
    const lTruoc = (studentId: number) => JSON.stringify(truoc.hang.find((h: any) => h.studentId === studentId).dot.progress.kn.listening);

    regularMod.reportRegularNoShow(P.normalCoreTeacher, row.attemptId, 'listening', true, homNay);

    const sau = keHoachMod.luoiThuong(P.mbManager, foundationClass);
    const hangEm = sau.hang.find((h: any) => h.studentId === row.student_id);
    const l = hangEm.dot.progress.kn.listening;
    assert(l.trangThai === 'da-doi' && l.doiTu === row.week_start && l.tuan && l.tuan > row.week_start,
      `L của em phải da-doi, dời từ ${row.week_start} sang tuần sau, đang ra ${JSON.stringify(l)}`);
    assert(hangEm.dot.progress.kn.reading.trangThai !== 'da-doi', 'R của em không được da-doi');
    for (const h of sau.hang) {
      if (h.studentId === row.student_id) continue;
      assert(JSON.stringify(h.dot.progress.kn.listening) === lTruoc(h.studentId), `L của em khác (${h.ten}) không được đổi`);
    }
  });

  check('PR-Rc2 · Task6(c)(d) luuDot lớp thường: đổi W của MỘT em; em đã có điểm → giu; setSkillWeek từ chối dời môn đã có raw_score', () => {
    const foundationClass = classId('MB FOU 12');
    const attempts = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id JOIN enrollments e ON e.student_id=s.id AND e.status='active' AND e.class_id=a.class_id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind='progress' AND s.status='active' AND s.archived_at IS NULL`,
    ).all(foundationClass) as any[];
    assert(attempts.length >= 2, 'Seed thiếu ít nhất 2 bài Giữa khoá ở MB FOU 12 để kiểm luuDot lớp thường');
    /* CHỈ THAO TÁC TRÊN HAI EM ĐÃ KIỂM SOÁT ĐƯỢC — các em khác trong lớp thật có lộ trình/lịch riêng. */
    const [emCoDiem, emMove] = attempts;

    /* Dựng biên: emCoDiem đã có điểm W → phải 'giu' và setSkillWeek phải từ chối dời. */
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='writing'`).run(emCoDiem.attemptId);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)`)
      .run(emCoDiem.attemptId, 'writing', 30, 40, '2026-04-01');
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='writing'`).run(emMove.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='writing'`).run(emMove.attemptId);

    /* Tuần đích PHẢI trước bài Cuối khoá cùng lộ trình (T15 so thứ tự đợt) — lấy tuần W hiện có của emMove lùi 7 ngày. */
    const wNow = conn.prepare(
      `SELECT pr.week_start w FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id = ? AND ask.skill = 'writing'`,
    ).get(emMove.attemptId) as any;
    const target = week.ensurePeriod(addDays(wNow.w, -7));

    assertThrows(
      () => skillSchedule.setSkillWeek(P.mbManager, emCoDiem.attemptId, 'writing', target.id, { force: true }),
      /đã có điểm/, 'setSkillWeek phải từ chối dời môn lớp thường đã có raw_score',
    );

    const kiemCoDiem = truocNgayDemo(() => keHoachMod.kiemDot(P.mbManager, { attemptId: emCoDiem.attemptId, kyNang: [{ skill: 'writing', periodId: target.id }] }));
    assert(kiemCoDiem.bai[0].ghiChu === 'giu' && kiemCoDiem.bai[0].cau === 'đã có điểm', `Em đã có điểm phải 'giu', đang ra ${JSON.stringify(kiemCoDiem)}`);
    const luuCoDiem = truocNgayDemo(() => keHoachMod.luuDot(P.mbManager, { attemptId: emCoDiem.attemptId, kyNang: [{ skill: 'writing', periodId: target.id }], force: true }));
    assert(luuCoDiem.doi.length === 0, 'Em đã có điểm mà luuDot vẫn đổi');
    const rowWCoDiem = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(emCoDiem.attemptId) as any;
    assert(rowWCoDiem.planned_period_id !== target.id, 'Em đã có điểm mà W vẫn bị đổi tuần');

    const lNow = conn.prepare(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id=? AND skill='listening'`).get(emMove.attemptId) as any;
    const ket = truocNgayDemo(() => keHoachMod.luuDot(P.mbManager, { attemptId: emMove.attemptId, kyNang: [{ skill: 'writing', periodId: target.id }], force: true, reason: 'PR-XLMT: tuần thi đã bắt đầu cần lý do' }));
    assert(ket.doi.join() === 'writing', `Chỉ W của em này được đổi, đang ra ${JSON.stringify(ket)}`);
    const rowW = conn.prepare(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id=? AND skill='writing'`)
      .get(emMove.attemptId) as any;
    assert(rowW.planned_period_id === target.id, `Em ${emMove.student_id} phải đổi W sang tuần mới`);
    const rowL = conn.prepare(`SELECT planned_period_id p1 FROM attempt_skills WHERE attempt_id=? AND skill='listening'`)
      .get(emMove.attemptId) as any;
    assert(rowL.p1 === lNow.p, `L không được đụng vào (đổi W không phải đổi L), em ${emMove.student_id}`);
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

  check('UX2 · gomBaiXemTruoc — cùng tu/den/ghiChu gộp, khác ghiChu tách', () => {
    const bai = (skill: string, tu: string | null, den: string | null, ghiChu: string) => ({ skill, tu, den, ghiChu, cau: null });
    const g = d.gomBaiXemTruoc([
      bai('speaking', '2026-10-26', '2026-11-02', 'doi'),
      bai('listening', null, '2026-10-19', 'moi'), bai('reading', null, '2026-10-19', 'moi'), bai('writing', null, '2026-10-19', 'canh-bao'),
    ]);
    assert(g.length === 3, `L R (moi), W (canh-bao), S (doi) phải là 3 dòng, ra ${g.length}`);
    assert(g[0].kyNang.join() === 'listening,reading' && g[0].ghiChu === 'moi', 'L R cùng tuần + ghi chú gộp một dòng');
    assert(g[1].kyNang.join() === 'writing' && g[1].ghiChu === 'canh-bao', 'Khác ghi chú thì tách dù cùng tuần');
    assert(g[2].kyNang.join() === 'speaking' && g[2].tu === '2026-10-26', 'S đổi tuần đứng riêng, giữ tuần cũ');
  });

  check('PR-Rc2 · Rà planning(1) Lớp đã kết thúc không hiện ở danhSachLop (cả FT lẫn lớp thường)', () => {
    /* MB FOU 03, MB BE 08 là hai lớp `status='ended'` có sẵn trong seed (giữ lại để tra lịch sử — journeys.ts). */
    const dsLop = keHoachMod.danhSachLop(P.mbManager, {});
    const maLop = dsLop.lop.map((l: any) => l.code);
    assert(!maLop.includes('MB FOU 03') && !maLop.includes('MB BE 08'),
      `Lớp đã kết thúc không được hiện ở danhSachLop, đang có: ${JSON.stringify(maLop)}`);
    assert(dsLop.lop.some((l: any) => l.loai === 'thuong') && dsLop.lop.some((l: any) => l.loai === 'ft'), 'danhSachLop phải có cả lớp FT lẫn lớp thường');
  });

  check('PR-Rc2 · Rà planning(2) xepHangLoat bỏ qua HV ngoài lớp (chi nhánh khác), không lộ tên', () => {
    const outside = conn.prepare(
      `SELECT s.id, s.full_name FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id
        WHERE c.code = 'CP FT 110' AND s.status = 'active' AND s.archived_at IS NULL
        LIMIT 1`,
    ).get() as any;
    assert(outside, 'Seed thiếu HV đang học ở CP FT 110 (chi nhánh khác) để kiểm lọc studentIds');

    const inside = conn.prepare(
      `SELECT DISTINCT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.id LIMIT 1`,
    ).get(mbClass) as any;
    assert(inside, 'Seed thiếu HV đang học ở MB FT 101 để kiểm lọc studentIds');

    const attemptNo = 8; // PR-XLMT: trần MT8 (T37) — số cao nhất hợp lệ, không em seed nào có, tránh đụng lịch thật
    const far = week.ensurePeriod('2029-08-06'); // Thứ Hai, xa mọi lịch thật

    const xt = keHoachMod.xepHangLoat(P.mbManager, {
      classId: mbClass, attemptNo, studentIds: [inside.id, outside.id], tuan: t4(far.id), xemTruoc: true,
    });
    assert(xt.dong.length === 1 && xt.dong[0].studentId === inside.id,
      `Chỉ HV trong lớp được xử lý, đang ra ${JSON.stringify(xt.dong.map((dd: any) => dd.studentId))}`);
    assert(!JSON.stringify(xt.dong).includes(outside.full_name), 'Không được lộ tên HV ngoài lớp qua kết quả xem trước');

    assertThrows(
      () => keHoachMod.xepHangLoat(P.mbManager, {
        classId: mbClass, attemptNo, studentIds: [outside.id], tuan: t4(far.id), xemTruoc: true,
      }),
      /Chưa chọn học viên/, 'Gửi toàn HV ngoài lớp phải bị coi như chưa chọn ai',
    );
  });

  // ------------------------------------------------------------ PR-UX2 · luật thuần (Task 1)
  const okn = (trangThai: string, tuan: string | null, doiTu: string | null = null, batBuoc = true) => (
    { trangThai, tuan, doiTu, batBuoc, khoa: null }
  );

  check('UX2 · gomChip — cùng tuần gộp, khác tuần tách, xong gọn, bỏ khong-yeu-cau, them', () => {
    const A = '2026-10-19', B = '2026-10-26';
    const cungTuan = d.gomChip({ listening: okn('da-xep', A), reading: okn('da-xep', A), writing: okn('da-xep', A), speaking: okn('da-xep', A) });
    assert(cungTuan.chip.length === 1 && cungTuan.chip[0].kyNang.join() === 'listening,reading,writing,speaking' && cungTuan.them === 0,
      `4 kỹ năng cùng tuần phải một chip, ra ${JSON.stringify(cungTuan)}`);
    const haiNhom = d.gomChip({ listening: okn('da-xep', A), reading: okn('da-xep', A), writing: okn('da-xep', A), speaking: okn('da-xep', B) });
    assert(haiNhom.chip.length === 2 && haiNhom.chip[0].kyNang.join() === 'listening,reading,writing' && haiNhom.chip[1].kyNang.join() === 'speaking',
      `L R W tuần A + S tuần B phải hai chip, ra ${JSON.stringify(haiNhom)}`);
    const bonTuan = d.gomChip({ listening: okn('da-xep', '2026-10-05'), reading: okn('da-xep', '2026-10-12'), writing: okn('da-xep', A), speaking: okn('da-xep', B) });
    assert(bonTuan.chip.length === 4 && bonTuan.them === 2, `4 tuần khác nhau phải them = 2, ra ${bonTuan.them}`);
    const xong = d.gomChip({ listening: okn('xong', '2026-10-05'), reading: okn('xong', A), writing: okn('xong', '2026-10-12'), speaking: okn('xong', B) });
    assert(xong.xong === true && xong.tuanXong === B && xong.chip.length === 0, `Cả 4 xong phải xong ở tuần muộn nhất, ra ${JSON.stringify(xong)}`);
    const boS = d.gomChip({ listening: okn('xong', A), reading: okn('xong', A), writing: okn('xong', A), speaking: okn('khong-yeu-cau', null, null, false) });
    assert(boS.xong === true, 'S khong-yeu-cau + L R W xong phải là xong');
    const roi = d.gomChip({ listening: okn('da-xep', A), speaking: okn('khong-yeu-cau', null, null, false) });
    assert(roi.chip.length === 1 && roi.chip[0].kyNang.join() === 'listening', 'khong-yeu-cau không được vẽ chip');
    assert(d.gomChip({}).chip.length === 0 && d.gomChip({}).xong === false, 'Ô không có kỹ năng nào thì không vẽ gì');
  });

  check('UX2 · nhanTuanKhoa — FOU W4/8, W8/8; ELE W5/10, W10/10; sau khoá; trước khai giảng null', () => {
    const kg = '2026-09-07';   // Thứ Hai
    assert(d.nhanTuanKhoa('2026-09-28', kg, 8) === 'W4/8', 'W4/8');
    assert(d.nhanTuanKhoa('2026-10-26', kg, 8) === 'W8/8', 'W8/8');
    assert(d.nhanTuanKhoa('2026-10-05', kg, 10) === 'W5/10', 'W5/10');
    assert(d.nhanTuanKhoa('2026-11-09', kg, 10) === 'W10/10', 'W10/10');
    assert(d.nhanTuanKhoa('2026-11-02', kg, 8) === 'sau khoá', 'Tuần sau hết khoá phải là "sau khoá"');
    assert(d.nhanTuanKhoa('2026-08-31', kg, 8) === null, 'Trước khai giảng thì không nhãn');
    assert(d.nhanTuanKhoa('2026-09-28', null, 8) === null && d.nhanTuanKhoa(null, kg, 8) === null && d.nhanTuanKhoa('2026-09-28', kg, null) === null,
      'Thiếu một trong ba thì null');
  });

  const baiMau = (skill: string, ghiChu: string, tu: string | null = null, den: string | null = '2026-10-19', cau: string | null = null) => (
    { skill, tu, den, ghiChu, cau }
  );

  check('UX2 · tomTatHangLoat — em có bài chặn không tính vào lưu được (Q1)', () => {
    const dong: any[] = [
      { studentId: 1, ten: 'A', hanhDong: 'tao', bai: ['listening', 'reading', 'writing', 'speaking'].map((s) => baiMau(s, 'moi')), loi: null },
      { studentId: 2, ten: 'B', hanhDong: 'doi', bai: [baiMau('listening', 'canh-bao'), baiMau('reading', 'doi'), baiMau('writing', 'giu'), baiMau('speaking', 'doi')], loi: null },
      { studentId: 3, ten: 'C', hanhDong: 'loi', bai: [baiMau('listening', 'moi'), baiMau('reading', 'moi'), baiMau('writing', 'moi'), baiMau('speaking', 'chan', null, '2026-10-19', 'Trùng tuần')], loi: 'Trùng tuần' },
      { studentId: 4, ten: 'D', hanhDong: 'giu', bai: [baiMau('listening', 'giu')], loi: null },
    ];
    const t = d.tomTatHangLoat(dong);
    assert(t.tongBai === 11, `tongBai: 4 + 3 (bài giu không đếm) + 4 = 11, ra ${t.tongBai}`);
    assert(t.luuDuoc === 7 && t.soBaiLuu === 7, `luuDuoc chỉ đếm dòng không loi: 4 + 3 = 7, ra ${t.luuDuoc}`);
    assert(t.coCanhBao === 1 && t.biChan === 1 && t.soEmLuu === 2, `coCanhBao/biChan/soEmLuu = 1/1/2, ra ${JSON.stringify(t)}`);
  });

  check('UX2 · emGiuLaiSauLuu chỉ trả em lỗi; gomBaiXemTruoc gộp cùng tu/den/ghiChu', () => {
    const dong: any[] = [
      { studentId: 1, ten: 'A', hanhDong: 'tao', bai: [], loi: null },
      { studentId: 2, ten: 'B', hanhDong: 'loi', bai: [], loi: 'x' },
      { studentId: 3, ten: 'C', hanhDong: 'giu', bai: [], loi: null },
      { studentId: 4, ten: 'D', hanhDong: 'loi', bai: [], loi: 'y' },
    ];
    assert(d.emGiuLaiSauLuu(dong).join() === '2,4', 'R9b: chỉ em lỗi còn ở lại');
    const g = d.gomBaiXemTruoc([baiMau('writing', 'moi'), baiMau('listening', 'moi'), baiMau('speaking', 'chan', null, '2026-10-19', 'Trùng'), baiMau('reading', 'moi')]);
    assert(g.length === 2 && g[0].kyNang.join() === 'listening,reading,writing' && g[1].ghiChu === 'chan' && g[1].cau === 'Trùng',
      `L R W gộp một dòng, S chặn tách dòng, ra ${JSON.stringify(g)}`);
    assert(d.tomTatLopFT({ dangThi: 3, chuaXep: { dot: 4, soEm: 4 } }) === 'MT3 đang thi · MT4 chưa xếp 4 em', 'tomTatLopFT đủ hai vế');
    assert(d.tomTatLopFT({ dangThi: null, chuaXep: { dot: 2, soEm: 0 } }) === '', 'tomTatLopFT bỏ vế trống');
  });

  // ------------------------------------------------------------ PR-UX2 · Task 2

  check('UX2 · T15 từng kỹ năng: trùng tuần S của đợt trước thì chặn, câu nêu "(S)"; tuần cách một thì chỉ cảnh báo', () => {
    const hv = { id: emMoiFT('UX2 T15') };
    const A = week.ensurePeriod('2027-03-01');
    const A7 = week.ensurePeriod('2027-03-08');
    /* PR-MT (T36): MT1 xa hẳn về trước để MT2 có số hợp lệ; phép kiểm xoay quanh MT2 (thay MT80 cũ). */
    const mt1 = attemptsMod.createAttempt(P.mbManager, { studentId: hv.id, attemptNo: 1, periodId: week.ensurePeriod('2026-11-02').id }) as any;
    const mt = attemptsMod.createAttempt(P.mbManager, { studentId: hv.id, attemptNo: 2, periodId: A.id }) as any;
    skillSchedule.setSkillWeek(P.mbManager, mt.id, 'speaking', A7.id, { force: true });
    /* MT3 (chưa tạo) vào đúng tuần S của MT2 → chặn, câu nêu kỹ năng ở tuần đó. */
    const trung = skillSchedule.checkWeekVsNeighbours({ cycleId: mt.cycle_id, attemptNo: 3, excludeAttemptId: null, newWeekStart: A7.weekStart });
    assert(trung.blockers.length === 1 && /Trùng tuần .* \(S\)/.test(trung.blockers[0]), `Phải chặn và nêu "(S)", ra ${JSON.stringify(trung)}`);
    /* MT1 dời vào tuần L R W của MT2 thì câu KHÔNG nêu S — chỉ kỹ năng ở tuần đó. */
    const trungLrw = skillSchedule.checkWeekVsNeighbours({ cycleId: mt.cycle_id, attemptNo: 1, excludeAttemptId: mt1.id, newWeekStart: A.weekStart });
    assert(trungLrw.blockers.length === 1 && /\(L R W\)/.test(trungLrw.blockers[0]) && !/\(S\)/.test(trungLrw.blockers[0]),
      `Trùng tuần đầu phải nêu (L R W), ra ${JSON.stringify(trungLrw)}`);
    const A14 = week.ensurePeriod('2027-03-15');
    const cach = skillSchedule.checkWeekVsNeighbours({ cycleId: mt.cycle_id, attemptNo: 3, excludeAttemptId: null, newWeekStart: A14.weekStart });
    assert(cach.blockers.length === 0 && cach.warnings.length === 1, `Cách đúng một tuần chỉ cảnh báo, ra ${JSON.stringify(cach)}`);
  });

  check('UX2 · planRegularTests opts.studentIds chỉ tạo bài cho em được chọn', () => {
    const branch = conn.prepare('SELECT branch_id AS id FROM classes WHERE id = ?').get(mbClass) as any;
    const now = new Date().toISOString();
    const info = conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                            start_period_id, status, note, created_at)
       VALUES (?,?,?,?,NULL,0,?,?, 'active', 'Phép kiểm UX2 Task2', ?)`,
    ).run('QA-FOU 91', branch.id, 'FOU', 'FOU', '2029-06-04', week.ensurePeriod('2029-06-04').id, now);
    const lopMoi = Number(info.lastInsertRowid);
    const [em1, em2] = conn.prepare(
      `SELECT id FROM students WHERE status='active' AND archived_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = students.id AND lc.route IS NULL)
        ORDER BY id LIMIT 2`,
    ).all() as any[];
    assert(em1 && em2, 'Seed thiếu 2 HV chưa có lộ trình lớp thường');
    for (const em of [em1, em2]) {
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,'active',?,?)`)
        .run(em.id, lopMoi, '2029-06-04', now);
    }
    const ket = regularMod.planRegularTests(P.mbManager, lopMoi, { studentIds: [em1.id], kinds: ['final'] });
    assert(ket.created === 1, `Chỉ 1 bài (em 1, Cuối khoá), ra ${ket.created}`);
    const dem = (em: number, kind: string) => (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE class_id=? AND student_id=? AND kind=?').get(lopMoi, em, kind) as any).n;
    assert(dem(em1.id, 'final') === 1 && dem(em1.id, 'progress') === 0, 'Em 1 phải có đúng 1 bài Cuối khoá, không có Giữa khoá');
    assert(dem(em2.id, 'final') === 0 && dem(em2.id, 'progress') === 0, 'Em 2 không được có bài nào');
  });

  // ------------------------------------------------------------ PR-UX2 · Task 3–5 (máy chủ theo từng kỹ năng)

  /** PR-MT: em thử MỚI ở MB FT 101 (chưa có lượt nào) — dùng số MT thật 1, 2 thay số ảo ≥ 80; tuần 2027 trở đi. */
  const hvFT = (offset: number) => emMoiFT(`UX2 ${offset}`);
  const tuanCua = (attemptId: number, skill: string) => (conn.prepare(
    `SELECT pr.week_start w, ask.required r FROM attempt_skills ask LEFT JOIN report_periods pr ON pr.id = ask.planned_period_id
      WHERE ask.attempt_id = ? AND ask.skill = ?`,
  ).get(attemptId, skill) as any);

  check('UX2 · xếp tách 4 kỹ năng: luuDot đặt L, R, W, S bốn tuần khác nhau → bốn dòng attempt_skills bốn tuần; luoiFT gom 4 chip, them = 2', () => {
    const em = hvFT(0);
    const w0 = week.ensurePeriod('2027-06-07');
    const tuan = ['2027-06-14', '2027-06-21', '2027-06-28', '2027-07-05'].map((x) => week.ensurePeriod(x));
    const mt = keHoachMod.xepMoi(P.mbManager, { studentId: em, attemptNo: 1, tuan: t4(w0.id), force: true });
    keHoachMod.luuDot(P.mbManager, { attemptId: mt.id, force: true, kyNang: KY.map((k, n) => ({ skill: k, periodId: tuan[n].id })) });
    KY.forEach((k, n) => assert(tuanCua(mt.id, k).w === tuan[n].weekStart, `${k} phải ở ${tuan[n].weekStart}`));
    const hang = keHoachMod.luoiFT(P.mbManager, mbClass).hang.find((h: any) => h.studentId === em);
    const o = hang.dot[1];
    assert(o.attemptId === mt.id, 'luoiFT phải có cột MT1 của em');
    const g = d.gomChip(o.kn);
    assert(g.chip.length === 4 && g.them === 2, `4 tuần khác nhau phải 4 chip, them = 2, ra ${JSON.stringify(g)}`);
  });

  check('UX2 · W đặt W1+W2: một lịch W; kiemDot từ chối "writing1"; W xong chỉ khi cả W1 và W2 có band', () => {
    const em = hvFT(1);
    const w0 = week.ensurePeriod('2027-09-06');
    const mt = keHoachMod.xepMoi(P.mbManager, { studentId: em, attemptNo: 1, tuan: t4(w0.id), force: true });
    assertThrows(
      () => keHoachMod.kiemDot(P.mbManager, { attemptId: mt.id, kyNang: [{ skill: 'writing1', periodId: w0.id }] }),
      /Kỹ năng không hợp lệ/, 'writing1 không phải một kỹ năng của Kế hoạch Test',
    );
    assert((conn.prepare(`SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id=? AND skill LIKE 'writing%'`).get(mt.id) as any).n === 1, 'W phải là MỘT dòng lịch');
    const wTrangThai = () => keHoachMod.luoiFT(P.mbManager, mbClass).hang.find((h: any) => h.studentId === em).dot[1].kn.writing.trangThai;
    const ins = conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, entered_at) VALUES (?,?,?,?,?,?,?,?)`);
    ins.run(mt.id, 'writing1', 6, 6, 6, 6, 6, '2026-04-01');
    assert(wTrangThai() !== 'xong', 'Mới có W1 thì W chưa xong');
    ins.run(mt.id, 'writing2', 6, 6, 6, 6, 6, '2026-04-01');
    assert(wTrangThai() === 'xong', 'Có cả W1 và W2 thì W xong');
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='writing2'`).run(mt.id);
    assert(wTrangThai() !== 'xong', 'Xoá band W2 thì W hết xong');
  });

  check('UX2 · T15 từng kỹ năng trong luuDot: S trùng tuần đầu đợt sau → cả lần lưu bị chặn, L không đổi (một tx)', () => {
    const em = hvFT(2);
    const x = week.ensurePeriod('2027-11-01');
    const y = week.ensurePeriod('2027-11-22');
    const truocX = week.ensurePeriod('2027-10-25');
    const mt85 = keHoachMod.xepMoi(P.mbManager, { studentId: em, attemptNo: 1, tuan: t4(x.id), force: true });
    keHoachMod.xepMoi(P.mbManager, { studentId: em, attemptNo: 2, tuan: t4(y.id), force: true });
    assertThrows(
      () => keHoachMod.luuDot(P.mbManager, {
        attemptId: mt85.id, force: true, kyNang: [{ skill: 'listening', periodId: truocX.id }, { skill: 'speaking', periodId: y.id }],
      }),
      /S: Trùng tuần/, 'S trùng tuần đầu MT2 phải chặn cả lần lưu',
    );
    assert(tuanCua(mt85.id, 'listening').w === x.weekStart, 'L đổi được dù cả lần lưu bị chặn — không phải một tx');
  });

  check('UX2 · Bỏ khỏi đợt: luuDot bo S có lý do → required=0; thiếu lý do → ném; lượt lớp thường bo → ném', () => {
    const em = hvFT(3);
    const w0 = week.ensurePeriod('2028-02-07');
    const mt = keHoachMod.xepMoi(P.mbManager, { studentId: em, attemptNo: 1, tuan: t4(w0.id), force: true });
    assertThrows(
      () => keHoachMod.luuDot(P.mbManager, { attemptId: mt.id, kyNang: [{ skill: 'speaking', bo: true }] }),
      /lý do/i, 'Bỏ kỹ năng mà thiếu lý do vẫn được',
    );
    assert(tuanCua(mt.id, 'speaking').r === 1, 'Thiếu lý do mà S vẫn bị bỏ');
    keHoachMod.luuDot(P.mbManager, { attemptId: mt.id, kyNang: [{ skill: 'speaking', bo: true }], lyDoBo: 'Em xin miễn Speaking đợt này' });
    assert(tuanCua(mt.id, 'speaking').r === 0, 'Có lý do mà S không bị bỏ');
    const o = keHoachMod.luoiFT(P.mbManager, mbClass).hang.find((h: any) => h.studentId === em).dot[1].kn.speaking;
    assert(o.trangThai === 'khong-yeu-cau' && o.batBuoc === false, 'S bị bỏ phải là khong-yeu-cau');
    const thuong = conn.prepare(
      `SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'progress' AND a.status != 'cancelled' LIMIT 1`,
    ).get(classId('MB FOU 12')) as any;
    assertThrows(
      () => keHoachMod.luuDot(P.mbManager, { attemptId: thuong.id, kyNang: [{ skill: 'speaking', bo: true }], lyDoBo: 'thử' }),
      /bốn môn/, 'Lớp thường không được bỏ kỹ năng',
    );
  });

  /** Lớp thường dựng mới (Monday khai giảng), gắn `n` em chưa có lộ trình lớp thường nào. */
  function dungLopThuong(ma: string, khaiGiang: string, n: number): { classId: number; hv: number[] } {
    const branch = conn.prepare('SELECT branch_id AS id FROM classes WHERE id = ?').get(mbClass) as any;
    const now = new Date().toISOString();
    const info = conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                            start_period_id, status, note, created_at)
       VALUES (?,?,?,?,NULL,0,?,?, 'active', 'Phép kiểm UX2', ?)`,
    ).run(ma, branch.id, 'FOU', 'FOU', khaiGiang, week.ensurePeriod(khaiGiang).id, now);
    const lop = Number(info.lastInsertRowid);
    const hv = (conn.prepare(
      `SELECT id FROM students WHERE status='active' AND archived_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = students.id AND lc.route IS NULL)
        ORDER BY id LIMIT ?`,
    ).all(n) as any[]).map((r) => r.id as number);
    assert(hv.length === n, `Seed thiếu ${n} HV chưa có lộ trình lớp thường`);
    for (const id of hv) {
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,'active',?,?)`)
        .run(id, lop, khaiGiang, now);
    }
    return { classId: lop, hv };
  }

  check('UX2 · lớp thường theo HV: luuDot một em đổi S, em khác cùng lớp giữ nguyên; xepMoiThuong tạo đúng 1 lượt cho 1 em', () => {
    const foundationClass = classId('MB FOU 12');
    const dong = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id JOIN enrollments e ON e.student_id=s.id AND e.status='active' AND e.class_id=a.class_id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind='progress' AND s.status='active' AND s.archived_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts f WHERE f.cycle_id = a.cycle_id AND f.kind = 'final' AND f.status != 'cancelled')   /* PR-LT2a M1b: chọn em chưa có Cuối khoá tự tạo (T15 chặn dời S sang tuần thi Cuối khoá) */`,
    ).all(foundationClass) as any[];
    assert(dong.length >= 2, 'Seed thiếu ít nhất 2 bài Giữa khoá ở MB FOU 12');
    const [emA, emB] = dong;
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id=? AND skill='speaking'`).run(emA.attemptId);
    conn.prepare(`UPDATE attempt_skills SET sit_status='scheduled' WHERE attempt_id=? AND skill='speaking'`).run(emA.attemptId);
    const sA = tuanCua(emA.attemptId, 'speaking').w as string;
    const sB = tuanCua(emB.attemptId, 'speaking').w as string;
    const target = week.ensurePeriod(addDays(sA, -7));
    truocNgayDemo(() => keHoachMod.luuDot(P.mbManager, { attemptId: emA.attemptId, force: true, reason: 'PR-XLMT: tuần thi đã bắt đầu cần lý do', kyNang: [{ skill: 'speaking', periodId: target.id }] }));
    assert(tuanCua(emA.attemptId, 'speaking').w === target.weekStart, 'S của em A phải đổi');
    assert(tuanCua(emB.attemptId, 'speaking').w === sB, 'S của em B (cùng lớp) phải giữ nguyên');

    const { classId: lopMoi, hv: [em1, em2] } = dungLopThuong('QA-FOU 93', '2029-09-03', 2);
    const cot = keHoachMod.luoiThuong(P.mbManager, lopMoi).cot;
    const giua = week.ensurePeriod(cot[0].deXuat);
    const giuaS = week.ensurePeriod(addDays(cot[0].deXuat, 7));
    const created = keHoachMod.xepMoiThuong(P.mbManager, {
      classId: lopMoi, studentId: em1, kind: 'progress', tuan: { listening: giua.id, reading: giua.id, writing: giua.id, speaking: giuaS.id }, force: true,
    });
    const dem = (em: number) => (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE class_id=? AND student_id=? AND kind IN ('progress','final')`).get(lopMoi, em) as any).n;
    assert(dem(em1) === 1 && dem(em2) === 0, `xepMoiThuong phải tạo đúng 1 lượt cho 1 em, ra ${dem(em1)}/${dem(em2)}`);
    assert(tuanCua(created.id, 'speaking').w === giuaS.weekStart && tuanCua(created.id, 'listening').w === giua.weekStart, 'Bốn tuần phải đúng như đã chọn');
    assertThrows(
      () => keHoachMod.xepMoiThuong(P.mbManager, { classId: lopMoi, studentId: em1, kind: 'progress', tuan: t4(giua.id), force: true }),
      /đã có bài/, 'Em đã có bài thì không xếp mới lần nữa',
    );
    assertThrows(
      () => keHoachMod.xepMoiThuong(P.mbManager, { classId: lopMoi, studentId: em2, kind: 'progress', tuan: { listening: giua.id } }),
      /cả 4 môn/, 'Thiếu tuần kỹ năng thì không tạo gì',   // PR-MON (K4-16): lớp thường đếm theo bộ môn chương trình
    );
    assert(dem(em2) === 0, 'Bị từ chối mà vẫn tạo bài');
  });

  check('UX2 · nhãn tuần n/N: luoiThuong MB FOU 12 nhanDeXuat W4/8 · W8/8; BC ELE 01 W5/10 · W10/10; nhanTuanKhoa(tuần sau khoá) = "sau khoá"', () => {
    const fou = keHoachMod.luoiThuong(P.mbManager, classId('MB FOU 12'));
    assert(fou.cot[0].nhanDeXuat === 'W4/8' && fou.cot[1].nhanDeXuat === 'W8/8', `FOU phải W4/8 · W8/8, ra ${fou.cot.map((c: any) => c.nhanDeXuat)}`);
    const ele = keHoachMod.luoiThuong(P.bcManager, classId('BC ELE 01'));
    assert(ele.cot[0].nhanDeXuat === 'W5/10' && ele.cot[1].nhanDeXuat === 'W10/10', `ELE phải W5/10 · W10/10, ra ${ele.cot.map((c: any) => c.nhanDeXuat)}`);
    assert(d.nhanTuanKhoa(addDays(fou.cot[1].deXuat, 7), fou.khaiGiang, fou.tongTuan) === 'sau khoá', 'Tuần sau hết khoá phải là "sau khoá"');
    assert(d.nhanTuanKhoa(fou.cot[0].deXuat, fou.khaiGiang, fou.tongTuan) === 'W4/8', 'nhanTuanKhoa khớp nhanDeXuat');
  });

  check('UX2 · danhSachLop: lớp FT có tomTat dạng "MT{n} đang thi…", có chiNhanh; lớp thường tomTat có "đang W"', () => {
    const ds = keHoachMod.danhSachLop(P.mbManager, {});
    const ft = ds.lop.find((l: any) => l.code === 'MB FT 101');
    assert(ft && /^MT\d+ đang thi/.test(ft.tomTat) && ft.chiNhanh, `MB FT 101 phải có tomTat "MT… đang thi" và chiNhanh, ra ${JSON.stringify(ft)}`);
    const thuong = ds.lop.find((l: any) => l.code === 'MB FOU 12');
    assert(thuong && /đang W\d+\/8/.test(thuong.tomTat), `MB FOU 12 phải có tomTat "đang W…/8", ra ${JSON.stringify(thuong)}`);
    assert(typeof thuong.hvChuaCoLich === 'number', 'Lớp thường phải có hvChuaCoLich');
  });

  check('UX2 · hàng loạt lớp thường: kind=final, 2 em, S khác tuần L R W → mỗi em đúng 4 tuần; em có bài chặn không lưu gì (Q1)', () => {
    const { classId: lopMoi, hv: [em1, em2, em3] } = dungLopThuong('QA-FOU 94', '2029-12-03', 3);
    regularMod.planRegularTests(P.mbManager, lopMoi, { studentIds: [em3], kinds: ['progress'] });
    const cot = keHoachMod.luoiThuong(P.mbManager, lopMoi).cot;
    const p0 = week.ensurePeriod(cot[0].deXuat);
    const p1 = week.ensurePeriod(addDays(cot[0].deXuat, 7));
    /* Em 3 đã có bài Giữa khoá ở đúng tuần p0 → xếp Cuối khoá L R W vào p0 là TRÙNG tuần (T15) → cả em 3 không lưu. */
    const tuan = { listening: p0.id, reading: p0.id, writing: p0.id, speaking: p1.id };
    const xt = keHoachMod.xepHangLoat(P.mbManager, { classId: lopMoi, kind: 'final', studentIds: [em1, em2, em3], tuan, xemTruoc: true });
    assert(xt.dong.find((x: any) => x.studentId === em3).hanhDong === 'loi', 'Em 3 phải bị chặn');
    assert(xt.dong.filter((x: any) => x.hanhDong === 'tao').length === 2, 'Em 1, 2 phải là "tao"');
    const t = d.tomTatHangLoat(xt.dong);
    assert(t.soEmLuu === 2 && t.soBaiLuu === 8 && t.biChan >= 1, `Tóm tắt: 2 em, 8 bài lưu được, ≥ 1 bài chặn; ra ${JSON.stringify(t)}`);
    const luu = keHoachMod.xepHangLoat(P.mbManager, { classId: lopMoi, kind: 'final', studentIds: [em1, em2, em3], tuan, force: true });
    assert(luu.daLuu === 2, `Chỉ 2 em lưu, ra ${luu.daLuu}`);
    for (const em of [em1, em2]) {
      const a = conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id=? AND student_id=? AND kind='final'`).get(lopMoi, em) as any;
      assert(a, `Em ${em} phải có bài Cuối khoá`);
      for (const k of ['listening', 'reading', 'writing']) assert(tuanCua(a.id, k).w === p0.weekStart, `${k} của em ${em} phải ở tuần đã chọn`);
      assert(tuanCua(a.id, 'speaking').w === p1.weekStart, `S của em ${em} phải ở tuần riêng`);
    }
    assert(!conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id=? AND student_id=? AND kind='final'`).get(lopMoi, em3),
      'Em có bài bị chặn không được lưu gì (Q1)');
    assert(d.emGiuLaiSauLuu(luu.dong).join() === String(em3), 'R9b: chỉ em 3 còn ở lại');
    assertThrows(() => keHoachMod.xepHangLoat(P.mbManager, { classId: lopMoi, attemptNo: 1, studentIds: [em1], tuan, xemTruoc: true }), /lớp thường/, 'Lớp thường không nhận attemptNo');
    assertThrows(() => keHoachMod.xepHangLoat(P.mbManager, { classId: mbClass, kind: 'final', studentIds: [em1], tuan, xemTruoc: true }), /Fast Track/, 'Lớp FT không nhận kind');
  });

  check('UX2 · quyền: QL chi nhánh khác (P.cpManager) gọi luoiFT, luoiThuong, kiemDot, luuDot, xepMoi, xepHangLoat lớp MB → HttpError 403; danhSachLop(cpManager, MB) rỗng; GVBM luoiThuong → 403', () => {
    const e403 = (fn: () => any, ten: string) => {
      let loi: any = null;
      try { fn(); } catch (e) { loi = e; }
      assert(loi && loi.status === 403, `${ten}: phải HttpError 403, ra ${loi ? `${loi.status} ${loi.message}` : 'không lỗi'}`);
    };
    const mbBranch = (conn.prepare('SELECT branch_id AS id FROM classes WHERE id = ?').get(mbClass) as any).id;
    const attemptMB = (conn.prepare(`SELECT id, student_id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' LIMIT 1`).get(mbClass) as any);
    const per = week.ensurePeriod('2031-03-03');
    const thuongMB = classId('MB FOU 12');
    e403(() => keHoachMod.luoiFT(P.cpManager, mbClass), 'luoiFT');
    e403(() => keHoachMod.luoiThuong(P.cpManager, thuongMB), 'luoiThuong');
    e403(() => keHoachMod.kiemDot(P.cpManager, { attemptId: attemptMB.id, kyNang: [{ skill: 'listening', periodId: per.id }] }), 'kiemDot');
    e403(() => keHoachMod.luuDot(P.cpManager, { attemptId: attemptMB.id, kyNang: [{ skill: 'listening', periodId: per.id }] }), 'luuDot');
    e403(() => keHoachMod.xepMoi(P.cpManager, { studentId: attemptMB.student_id, attemptNo: 95, tuan: t4(per.id) }), 'xepMoi');
    e403(() => keHoachMod.xepHangLoat(P.cpManager, { classId: mbClass, attemptNo: 95, studentIds: [attemptMB.student_id], tuan: t4(per.id), xemTruoc: true }), 'xepHangLoat');
    assert(keHoachMod.danhSachLop(P.cpManager, { branchId: mbBranch }).lop.length === 0, 'QL chi nhánh CP không được thấy lớp MB');
    e403(() => keHoachMod.luoiThuong(P.lrTeacher, thuongMB), 'luoiThuong (GVBM)');
  });
}
