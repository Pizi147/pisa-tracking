import { db } from '../db.ts';
import {
  ASSESSED_SKILLS, BASELINE_SOURCE_LABEL, CYCLE_OUTCOME_LABEL, ENTRY_SKILLS,
  ASSESSED_SKILL_LABEL, JOURNEY_GROUP, PERMISSIONS, caseHeadline, issueLabel,
  type AssessedSkill, type EntrySkill,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { diffDays, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { entryBandsOf, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { assessedBands, evaluateAttempt } from '../fasttrack/scoring.ts';
import { evaluateRegular, programmeByCode, programmeOfClass } from '../normal/regular.ts';
import { cycleById, cyclesOf, currentCycle, targetRevisions } from '../fasttrack/cycles.ts';
import { canCloseCase } from '../cases/cases.ts';
import { missingForStudent, suggestedMockWeeks } from '../classes/schedule.ts';

/**
 * HỒ SƠ HỌC VIÊN — phần trả lời câu hỏi "em này đang thế nào" trong khoảng ba mươi giây.
 *
 * Mọi con số ở đây đều SUY RA từ dữ liệu đã có, không có ô nào để gõ tay. Người dùng không
 * bao giờ phải tự nhập "mức tiến bộ" hay "mức rủi ro" — nhập tay thì hai tháng sau không
 * ai biết con số đó dựa trên cái gì.
 *
 * Ba nguyên tắc xuyên suốt:
 *   1. THIẾU CĂN CỨ THÌ GHI "CHƯA RÕ", không dựng số thay thế.
 *   2. MỌI SO SÁNH PHẢI CÙNG THANG VÀ CÙNG LỘ TRÌNH. Điểm lộ trình trước không nói gì
 *      về mục tiêu lộ trình sau.
 *   3. KHÔNG DỰNG NHÃN TỔNG HỢP kiểu "đang ổn / có nguy cơ" khi chưa có quy tắc được
 *      chốt. Chỉ nói hai điều tách bạch: SO VỚI CHECKPOINT và CẦN CHÚ Ý.
 */

type SkillPoint = {
  kind: 'baseline' | 'official' | 'checkin';
  label: string;
  date: string | null;
  band: number | null;
  detail: string | null;
};

function cycleLabel(c: any): string {
  if (c.route) return c.route;
  const prog = programmeByCode(c.programme_code)
    ?? (isRatioCycle(c) ? programmeByCode(programmeCodeOfCycle(c.id)) : null);
  return prog ? prog.name : `Lộ trình ${c.seq}`;
}

function programmeCodeOfCycle(cycleId: number): string | null {
  const row = db()
    .prepare(
      `SELECT c.programme_code AS code FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
        WHERE a.cycle_id = ? AND c.programme_code IS NOT NULL LIMIT 1`,
    )
    .get(cycleId) as any;
  return row?.code ?? null;
}

/**
 * Khoá này chấm theo TỶ LỆ SỐ CÂU ĐÚNG hay theo BAND — quyết định dùng bộ máy kết luận nào.
 *
 * Ưu tiên mã chương trình ghi trên chính khoá. Dữ liệu cũ có thể thiếu mã đó, nên còn một
 * đường tra dự phòng: lớp của các bài kiểm tra trong khoá. Không có căn cứ nào thì coi là
 * lớp band — đó là mặc định của trung tâm.
 */
function isRatioCycle(c: any): boolean {
  if (!c || c.route) return false;
  if (c.programme_code) return programmeByCode(c.programme_code)?.scoringMode === 'ratio';
  const row = db()
    .prepare(
      `SELECT c.programme_code AS code FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
        WHERE a.cycle_id = ? AND c.programme_code IS NOT NULL LIMIT 1`,
    )
    .get(c.id) as any;
  return programmeByCode(row?.code)?.scoringMode === 'ratio';
}

/**
 * Kết luận một lượt đánh giá bằng ĐÚNG bộ máy của loại lớp đó.
 *
 * Lớp thường chấm theo tỷ lệ số câu đúng, không có band và không có mục tiêu IELTS. Đưa
 * lượt của lớp thường qua bộ máy FT thì mọi kỹ năng đều "chưa có band" và hồ sơ hiện ra
 * một bảng trống — sai mà trông như thiếu dữ liệu.
 */
export function typedResult(attempt: any) {
  const prog = attempt.class_id ? programmeOfClass(attempt.class_id) : null;
  if (prog?.scoringMode === 'ratio') {
    const rows = db().prepare('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ?')
      .all(attempt.id) as any[];
    const r = evaluateRegular(prog.skills, rows);
    return { mode: 'ratio' as const, ratio: r, ft: null };
  }
  const r = evaluateAttempt(attempt.target_at_attempt, attempt.attempt_no,
    entryBandsOf(scoresOf(attempt.id)), skipsOf(attempt.id));
  return { mode: 'ielts' as const, ratio: null, ft: r };
}

/**
 * ĐIỂM HIỆN TẠI theo TỪNG KỸ NĂNG.
 *
 * Cố tình KHÔNG ghép bốn kỹ năng mới nhất từ bốn lượt khác nhau thành một Overall: bốn
 * con số của bốn buổi khác nhau cộng lại không phải là một bài thi. Overall chỉ có khi
 * một lượt duy nhất có đủ bốn kỹ năng.
 */
function currentBands(attempts: any[]) {
  const per: Partial<Record<AssessedSkill, { band: number; attemptNo: number; on: string | null }>> = {};
  for (const a of attempts) {
    if (a.status === 'cancelled') continue;
    const bands = assessedBands(entryBandsOf(scoresOf(a.id)));
    for (const s of ASSESSED_SKILLS) {
      if (per[s]) continue;                              // đã có lượt mới hơn
      const b = bands[s];
      if (b === null || b === undefined) continue;
      per[s] = { band: b, attemptNo: a.attempt_no, on: a.lrw_scheduled_at?.slice(0, 10) ?? null };
    }
  }
  return per;
}

/**
 * VỊ TRÍ SO VỚI CHECKPOINT — dựa trên kỳ vọng ĐÃ CHỐT của chính lượt đó, không nội suy
 * theo tuần. "Tuần này lẽ ra phải được 6.0" là một con số bịa; kỳ vọng chỉ tồn tại ở
 * đúng các mốc MT.
 */
function checkpointView(attempts: any[]) {
  for (const a of attempts) {
    if (a.status === 'cancelled') continue;
    const t = typedResult(a);
    if (t.mode === 'ratio') {
      const r = t.ratio!;
      if (r.failedCount === null) continue;
      return {
        attemptNo: a.attempt_no, kind: a.kind, mode: 'ratio' as const,
        date: a.lrw_scheduled_at?.slice(0, 10) ?? null,
        coverage: `${r.scored}/${r.required}`,
        provisional: r.provisional,
        status: r.failedCount === 0 ? 'met' : 'below',
        expectation: null,
        skills: r.skills.map((s) => ({
          skill: s.skill, label: s.label, band: null, ratio: s.ratio,
          score: s.score, total: s.total,
          verdict: s.outcome === 'missing' ? null : s.outcome === 'pass',
        })),
      };
    }
    const r = t.ft!;
    if (r.sosLevel === null) {
      // Đủ điểm mà thiếu mục tiêu là một tình trạng RIÊNG, phải nói ra chứ không im lặng.
      if (r.complete && r.expectation === null) {
        return {
          attemptNo: a.attempt_no, kind: a.kind, mode: 'ielts' as const,
          date: a.lrw_scheduled_at?.slice(0, 10) ?? null,
          coverage: `${r.scoredRequired}/${r.required.length}`,
          provisional: false, status: 'no_target' as const, expectation: null,
          skills: ASSESSED_SKILLS.map((s) => ({
            skill: s, label: ASSESSED_SKILL_LABEL[s], band: r.bands[s], ratio: null,
            score: null, total: null, verdict: null,
          })),
        };
      }
      continue;
    }
    const required = r.verdicts.filter((v) => v.required && v.band !== null);
    const allAbove = required.length > 0 && required.every((v) => v.band !== null && r.expectation !== null && v.band > r.expectation);
    return {
      attemptNo: a.attempt_no, kind: a.kind, mode: 'ielts' as const,
      date: a.lrw_scheduled_at?.slice(0, 10) ?? null,
      coverage: `${r.scoredRequired}/${r.required.length}`,
      provisional: r.provisional,
      status: r.failedCount === 0 ? (allAbove ? 'above' : 'met') : 'below',
      expectation: r.expectation,
      skills: ASSESSED_SKILLS.map((s) => {
        const v = r.verdicts.find((x) => x.skill === s)!;
        return {
          skill: s, label: ASSESSED_SKILL_LABEL[s], band: v.band, ratio: null,
          score: null, total: null, verdict: v.passed,
        };
      }),
    };
  }
  return null;
}

/**
 * GOM SỰ KIỆN THÀNH CHƯƠNG.
 *
 * Hành trình đọc theo dòng thời gian phẳng thì mỗi lần ghi nhận là một dòng, và một vấn
 * đề được theo dõi ba tháng biến thành mười lăm dòng rời rạc. Gom lại: mọi việc quanh
 * MỘT vấn đề nằm chung một chương, mọi ghi nhận trong MỘT tuần nằm chung một chương.
 */
function episodesOf(rows: any[]) {
  const conn = db();
  const caseOfIntervention = new Map<number, number>();
  const caseOfFollowup = new Map<number, number>();
  const ivIds = rows.filter((r) => r.ref_table === 'case_interventions').map((r) => r.ref_id);
  const fuIds = rows.filter((r) => r.ref_table === 'case_followups').map((r) => r.ref_id);
  if (ivIds.length) {
    for (const r of conn.prepare(`SELECT id, case_id FROM case_interventions WHERE id IN (${ivIds.map(() => '?').join(',')})`)
      .all(...ivIds) as any[]) caseOfIntervention.set(r.id, r.case_id);
  }
  if (fuIds.length) {
    for (const r of conn.prepare(`SELECT id, case_id FROM case_followups WHERE id IN (${fuIds.map(() => '?').join(',')})`)
      .all(...fuIds) as any[]) caseOfFollowup.set(r.id, r.case_id);
  }

  const keyOf = (e: any): { key: string; kind: string; link: string | null } => {
    if (e.ref_table === 'sos_cases' && e.ref_id) {
      return { key: `case:${e.ref_id}`, kind: 'case', link: `/hoc-thuat/case/${e.ref_id}` };
    }
    if (e.ref_table === 'case_interventions' && caseOfIntervention.has(e.ref_id)) {
      const id = caseOfIntervention.get(e.ref_id)!;
      return { key: `case:${id}`, kind: 'case', link: `/hoc-thuat/case/${id}` };
    }
    if (e.ref_table === 'case_followups' && caseOfFollowup.has(e.ref_id)) {
      const id = caseOfFollowup.get(e.ref_id)!;
      return { key: `case:${id}`, kind: 'case', link: `/hoc-thuat/case/${id}` };
    }
    if (e.ref_table === 'assessment_attempts' && e.ref_id) {
      return { key: `attempt:${e.ref_id}`, kind: 'assessment', link: `/mock/${e.ref_id}` };
    }
    if (e.ref_table === 'learning_cycles' || e.ref_table === 'cycle_target_revisions') {
      return { key: `cycle:${e.event_type}:${e.ref_id ?? e.id}`, kind: 'cycle', link: null };
    }
    return { key: `event:${e.id}`, kind: JOURNEY_GROUP[e.event_type] ?? 'other', link: null };
  };

  const byKey = new Map<string, any>();
  for (const e of rows) {
    const { key, kind, link } = keyOf(e);
    const item = {
      id: e.id, eventType: e.event_type, eventDate: e.event_date, title: e.title,
      detail: e.detail, actorName: e.actor_name ?? null,
      group: JOURNEY_GROUP[e.event_type] ?? 'other',
    };
    const ex = byKey.get(key);
    if (ex) {
      ex.events.push(item);
      if (e.event_date < ex.from) ex.from = e.event_date;
      if (e.event_date > ex.to) ex.to = e.event_date;
    } else {
      byKey.set(key, {
        key, kind, link, title: e.title, from: e.event_date, to: e.event_date, events: [item],
      });
    }
  }
  const list = [...byKey.values()];
  for (const ep of list) {
    ep.events.sort((a: any, b: any) => (a.eventDate < b.eventDate ? -1 : a.eventDate > b.eventDate ? 1 : a.id - b.id));
    // Tiêu đề chương lấy từ sự kiện MỞ ĐẦU, vì đó là lý do chương này tồn tại.
    ep.title = ep.events[0].title;
    ep.count = ep.events.length;
  }
  list.sort((a, b) => (a.to < b.to ? 1 : a.to > b.to ? -1 : 0));
  return list;
}

export function studentProfile(p: Principal, studentId: number, wantCycleId?: number | null) {
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const allCycles = cyclesOf(studentId);
  const selected = (wantCycleId ? cycleById(wantCycleId) : null)
    ?? currentCycle(studentId)
    ?? allCycles[allCycles.length - 1]
    ?? null;
  if (selected && selected.student_id !== studentId) throw notFound('Lộ trình không thuộc học viên này');

  const enrollments = conn
    .prepare(
      `SELECT e.*, c.code AS class_code, c.kind AS class_kind, b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? ORDER BY e.started_at DESC, e.id DESC`,
    )
    .all(studentId) as any[];
  const current = enrollments.find((e) => e.status === 'active') ?? null;

  // --------------------------------------------------------- lượt đánh giá của lộ trình
  const attemptRows = selected
    ? conn
      .prepare(
        `SELECT a.*, c.code AS class_code, pr.code AS period_code, pr.week_start
           FROM assessment_attempts a
           LEFT JOIN classes c ON c.id = a.class_id
           LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.cycle_id = ? ORDER BY a.attempt_no DESC`,
      )
      .all(selected.id) as any[]
    : [];

  const caseByAttempt = new Map<number, any>();
  if (attemptRows.length) {
    const ids = attemptRows.map((a) => a.id);
    for (const r of conn
      .prepare(`SELECT id, attempt_id, sos_level, status, urgency FROM sos_cases WHERE attempt_id IN (${ids.map(() => '?').join(',')})`)
      .all(...ids) as any[]) caseByAttempt.set(r.attempt_id, r);
  }

  const attempts = attemptRows.map((a) => {
    const t = typedResult(a);
    const c = caseByAttempt.get(a.id) ?? null;
    const base = {
      id: a.id, attemptNo: a.attempt_no, kind: a.kind, status: a.status,
      classCode: a.class_code, periodCode: a.period_code,
      lrwScheduledAt: a.lrw_scheduled_at, speakingScheduledAt: a.speaking_scheduled_at,
      mode: t.mode,
      caseId: c?.id ?? null, caseStatus: c?.status ?? null,
    };
    if (t.mode === 'ratio') {
      const r = t.ratio!;
      return {
        ...base, expectation: null, bands: null, overall: null,
        skills: r.skills, scored: r.scored, required: r.required,
        complete: r.complete, provisional: r.provisional,
        sosLevel: r.sosLevel, scopeNote: null,
      };
    }
    const r = t.ft!;
    return {
      ...base, expectation: r.expectation, bands: r.bands, overall: r.overall, skills: null,
      scored: r.scoredRequired, required: r.required.length,
      complete: r.complete, provisional: r.provisional,
      sosLevel: r.sosLevel, scopeNote: r.scopeNote,
    };
  });

  // --------------------------------------------------------- điểm xuất phát
  let baseline: any = null;
  if (selected) {
    if (selected.baseline_attempt_id) {
      const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(selected.baseline_attempt_id) as any;
      const t = a ? typedResult(a) : null;
      baseline = {
        source: selected.baseline_source,
        sourceLabel: BASELINE_SOURCE_LABEL[selected.baseline_source as keyof typeof BASELINE_SOURCE_LABEL]
          ?? selected.baseline_source,
        score: t?.ft?.overall ?? null,
        bands: t?.ft?.bands ?? null,
        attemptId: a?.id ?? null, attemptNo: a?.attempt_no ?? null,
        note: selected.baseline_note,
      };
    } else if (selected.baseline_score !== null && selected.baseline_score !== undefined) {
      baseline = {
        source: selected.baseline_source,
        sourceLabel: BASELINE_SOURCE_LABEL[selected.baseline_source as keyof typeof BASELINE_SOURCE_LABEL]
          ?? selected.baseline_source,
        score: selected.baseline_score, bands: null, attemptId: null, attemptNo: null,
        note: selected.baseline_note,
      };
    }
  }

  const per = currentBands(attemptRows);
  const target = selected?.target_score ?? null;

  const today = demoToday();
  const examDate = selected?.exam_date ?? null;

  // Mốc tiếp theo: lượt đã lên kế hoạch gần nhất chưa xong.
  const nextRow = attemptRows.filter((a) => a.status === 'planned')
    .sort((a, b) => a.attempt_no - b.attempt_no)[0] ?? null;

  // --------------------------------------------------------- đường đi từng kỹ năng
  /*
   * "Ghi nhận của giáo viên" ĐÃ BỎ HẲN Ở VÒNG 4. Đường đi từng kỹ năng nay chỉ dựng từ
   * ĐIỂM ĐẦU VÀO và ĐIỂM CÁC LƯỢT MT — một nguồn số liệu duy nhất, không còn hai đường
   * chấm điểm song song để các bảng đá nhau.
   */
  const trajectory = (isRatioCycle(selected ?? {}) ? [] : ASSESSED_SKILLS).map((skill) => {
    const points: SkillPoint[] = [];
    if (baseline?.bands?.[skill] !== null && baseline?.bands?.[skill] !== undefined) {
      points.push({ kind: 'baseline', label: 'Đầu vào', date: null, band: baseline.bands[skill], detail: baseline.sourceLabel });
    }
    for (const a of [...attemptRows].sort((x, y) => x.attempt_no - y.attempt_no)) {
      if (a.status === 'cancelled') continue;
      const b = assessedBands(entryBandsOf(scoresOf(a.id)))[skill];
      if (b === null || b === undefined) continue;
      points.push({
        kind: 'official', label: `MT${a.attempt_no}`,
        date: a.lrw_scheduled_at?.slice(0, 10) ?? null, band: b, detail: null,
      });
    }
    return {
      skill, label: ASSESSED_SKILL_LABEL[skill], points,
      target,
      gapToTarget: target !== null && per[skill] ? Math.round((target - per[skill]!.band) * 10) / 10 : null,
      gain: baseline?.bands?.[skill] !== null && baseline?.bands?.[skill] !== undefined && per[skill]
        ? Math.round((per[skill]!.band - baseline.bands[skill]) * 10) / 10 : null,
      current: per[skill] ?? null,
    };
  });

  // --------------------------------------------------------- vấn đề đang theo dõi
  const caseRows = conn
    .prepare(
      `SELECT sc.*, cy.seq AS cycle_seq, cy.route, u.full_name AS reporter_name,
              (SELECT COUNT(*) FROM case_interventions ci WHERE ci.case_id = sc.id AND ci.status != 'cancelled') AS iv_count,
              (SELECT MIN(followup_due) FROM case_interventions ci
                WHERE ci.case_id = sc.id AND ci.status != 'cancelled' AND ci.followup_due IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = ci.id)) AS next_due,
              (SELECT ci.description FROM case_interventions ci WHERE ci.case_id = sc.id
                ORDER BY COALESCE(ci.completed_date, ci.started_date, ci.created_at) DESC LIMIT 1) AS last_iv,
              (SELECT ip.taxonomy_code FROM case_issues ip
                WHERE ip.case_id = sc.id AND ip.role = 'primary' LIMIT 1) AS primary_code,
              a.attempt_no AS attempt_no
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
         LEFT JOIN users u ON u.id = sc.reported_by
        WHERE sc.student_id = ? ORDER BY (sc.status != 'done') DESC, sc.detected_at DESC, sc.id DESC`,
    )
    .all(studentId) as any[];

  const cases = caseRows.map((c) => ({
    id: c.id, status: c.status, sosLevel: c.sos_level, urgency: c.urgency,
    originKind: c.origin_kind, detectedAt: c.detected_at, summary: c.summary,
    headline: caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
    }),
    attemptId: c.attempt_id, attemptNo: c.attempt_no,
    reporterName: c.reporter_name, disposition: c.disposition,
    cycleId: c.cycle_id, cycleSeq: c.cycle_seq, route: c.route,
    // Vấn đề của lộ trình TRƯỚC vẫn hiện, nhưng dán nhãn rõ — không dời sang lộ trình mới
    // cho tiện hiển thị, vì như thế là viết lại lịch sử.
    carriedOver: !!(selected && c.cycle_id && c.cycle_id !== selected.id),
    primaryCode: c.primary_code, primaryLabel: c.primary_code ? issueLabel(c.primary_code) : null,
    interventionCount: c.iv_count, lastIntervention: c.last_iv,
    nextDue: c.next_due, dueOverdue: !!(c.next_due && c.next_due < today && c.status !== 'done'),
  }));
  const openCases = cases.filter((c) => c.status !== 'done');

  // --------------------------------------------------------- hành trình
  const journeyRows = conn
    .prepare(
      `SELECT j.*, u.full_name AS actor_name FROM journey_events j
         LEFT JOIN users u ON u.id = j.created_by
        WHERE j.student_id = ? ${selected ? 'AND (j.cycle_id = ? OR j.cycle_id IS NULL)' : ''}
        ORDER BY j.event_date DESC, j.id DESC`,
    )
    .all(...(selected ? [studentId, selected.id] : [studentId])) as any[];

  return {
    id: s.id, studentCode: s.student_code, fullName: s.full_name, dob: s.dob,
    status: s.status, finishedAt: s.finished_at, archivedAt: s.archived_at,
    consultantName: s.consultant_name, note: s.note,
    currentClass: current
      ? { id: current.class_id, code: current.class_code, kind: current.class_kind, branchName: current.branch_name }
      : null,
    enrollments: enrollments.map((e) => ({
      id: e.id, classId: e.class_id, classCode: e.class_code, branchName: e.branch_name,
      status: e.status, startedAt: e.started_at, endedAt: e.ended_at, endReason: e.end_reason,
    })),
    cycles: allCycles.map((c) => ({
      id: c.id, seq: c.seq, route: c.route, label: cycleLabel(c), target: c.target_score,
      examDate: c.exam_date, startedAt: c.started_at, endedAt: c.ended_at, status: c.status,
      outcome: c.outcome, ratio: isRatioCycle(c),
    })),
    cycle: selected
      ? {
        id: selected.id, seq: selected.seq, route: selected.route, label: cycleLabel(selected),
        programmeCode: selected.programme_code, ratio: isRatioCycle(selected),
        target, examDate, startedAt: selected.started_at, endedAt: selected.ended_at,
        status: selected.status,
        daysToExam: examDate ? diffDays(examDate, today) : null,
        /*
         * TUẦN BẮT ĐẦU HỌC và THÁNG THI DỰ KIẾN — hai trường của vòng 4 (mục 7.5).
         * Tuần bắt đầu là mốc gốc sinh ra lịch MT mặc định; tháng thi chỉ có với lớp FT.
         */
        startPeriodId: selected.start_period_id ?? null,
        startWeek: selected.start_period_id
          ? (conn.prepare('SELECT week_start, code FROM report_periods WHERE id = ?')
              .get(selected.start_period_id) as any) ?? null
          : null,
        examMonth: selected.exam_month ?? null,
        /* Lịch MT hệ thống đề xuất, và những lượt người đã chốt tay thì ghi rõ là giữ nguyên. */
        suggestedMocks: isRatioCycle(selected) ? [] : suggestedMockWeeks(selected.id),
        baseline,
        outcome: selected.outcome
          ? {
            outcome: selected.outcome,
            label: CYCLE_OUTCOME_LABEL[selected.outcome as keyof typeof CYCLE_OUTCOME_LABEL],
            score: selected.outcome_score, attemptId: selected.outcome_attempt_id, note: selected.outcome_note,
          }
          : null,
        targetRevisions: targetRevisions(selected.id).map((r) => ({
          id: r.id, oldTarget: r.old_target, newTarget: r.new_target,
          effectiveFrom: r.effective_from, reason: r.reason, actorName: r.actor_name,
        })),
      }
      : null,
    current: {
      perSkill: per,
      /*
       * Overall chỉ lấy từ MỘT lượt có đủ bốn kỹ năng. Không ghép bốn kỹ năng mới nhất
       * của bốn lượt khác nhau — bốn buổi khác nhau cộng lại không thành một bài thi.
       */
      overall: attempts.find((a) => a.mode === 'ielts' && a.overall !== null)?.overall ?? null,
      overallFrom: attempts.find((a) => a.mode === 'ielts' && a.overall !== null)?.attemptNo ?? null,
    },
    checkpoint: checkpointView(attemptRows),
    nextCheckpoint: nextRow
      ? {
        id: nextRow.id, attemptNo: nextRow.attempt_no, kind: nextRow.kind,
        periodCode: nextRow.period_code, weekStart: nextRow.week_start,
        scheduledAt: nextRow.lrw_scheduled_at, needsDate: !nextRow.lrw_scheduled_at,
      }
      : null,
    /*
     * BADGE "THIẾU THÔNG TIN" (mục 7.5) — gom mọi thứ còn thiếu vào MỘT nhãn, hiện ngay
     * trên thẻ tên để đúng vai có trách nhiệm nhìn thấy mà không phải đi tìm.
     */
    missing: missingForStudent({
      cycle: selected
        ? {
          start_period_id: selected.start_period_id,
          exam_month: selected.exam_month,
          target_score: selected.target_score,
        }
        : null,
      student: { dob: s.dob },
      isFulltime: !isRatioCycle(selected ?? {}),
    }),
    concerns: {
      openCases: openCases.length,
      carriedOver: openCases.filter((c) => c.carriedOver).length,
      urgent: openCases.filter((c) => c.urgency === 'urgent').length,
      maxSos: openCases.reduce((m, c) => Math.max(m, c.sosLevel ?? 0), 0),
      activeInterventions: openCases.reduce((n, c) => n + (c.interventionCount ?? 0), 0),
      dueOverdue: openCases.filter((c) => c.dueOverdue).length,
    },
    trajectory,
    attempts,
    cases,
    episodes: episodesOf(journeyRows),
    viewer: {
      canEdit: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),
      canSetDate: can(p, PERMISSIONS.SCHEDULE_DATE, { studentId }),
      canReport: can(p, PERMISSIONS.SOS_EDIT, { classId: current?.class_id ?? null, studentId }),
      canClose: canCloseCase(p, { class_id: current?.class_id ?? null, student_id: studentId }),
    },
  };
}

export { ENTRY_SKILLS };
