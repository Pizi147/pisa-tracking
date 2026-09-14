import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, ENTRY_SKILLS, MOCK_FT_STUDY_WEEK, PERMISSIONS,
  type AssessedSkill, type EntrySkill, type SkillProgress,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import {
  can, classScopeSql, editableSkills, mySkills, require_, scopeFor, scoreEditPath, type Principal,
} from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import {
  ScoreError, assessedSkillOf, bandFromCriteria, bandFromRaw, entrySkillsOf, evaluateAttempt,
  isCriteriaSkill, isRawSkill, type AttemptResult,
} from './scoring.ts';
import { effectiveDeadline, isOverdue, weekInfo } from '../platform/week.ts';
import { stepsFor, upsertCaseForResult } from '../cases/sos.ts';
import { currentCycle, cycleById, examPlanOf, nextAttemptNo } from './cycles.ts';
import { allProgrammes, evaluateRegular, regularDeadline } from '../normal/regular.ts';

export type ScoreRow = {
  id: number; skill: EntrySkill;
  raw_score: number | null; raw_total: number | null;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null;
  band: number | null; result_date: string | null; note: string | null;
  entered_by: number | null; entered_at: string | null;
  entered_by_name?: string | null;
};

export function scoresOf(attemptId: number): ScoreRow[] {
  return db()
    .prepare(
      `SELECT s.*, u.full_name AS entered_by_name FROM assessment_scores s
         LEFT JOIN users u ON u.id = s.entered_by WHERE s.attempt_id = ?`,
    )
    .all(attemptId) as ScoreRow[];
}

/** Kỹ năng ĐÁNH GIÁ được đánh dấu không mock ở lượt này. Không có dòng nào = phải đủ bốn. */
export function skipsOf(attemptId: number): AssessedSkill[] {
  return (db().prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(attemptId) as any[])
    .map((r) => r.skill as AssessedSkill)
    .filter((s) => (ASSESSED_SKILLS as readonly string[]).includes(s));
}

/**
 * Nạp điểm, kỹ năng không mock và case của NHIỀU lượt bằng ba truy vấn.
 * Danh sách lớp và danh sách lượt đều dùng hàm này thay vì hỏi lại theo từng dòng.
 */
export type AttemptBundle = {
  scores: Map<number, ScoreRow[]>;
  skips: Map<number, AssessedSkill[]>;
  cases: Map<number, {
    id: number; status: string; sos_level: number;
    /** Câu tóm tắt "đã có ai làm gì chưa" — để nhìn danh sách là biết, không phải mở chi tiết. */
    followUp: string | null;
  }>;
};

export function loadBundle(attemptIds: number[]): AttemptBundle {
  const bundle: AttemptBundle = { scores: new Map(), skips: new Map(), cases: new Map() };
  if (!attemptIds.length) return bundle;
  const conn = db();
  // SQLite giới hạn số tham số của một câu lệnh, nên chia lô thay vì nối một danh sách dài.
  for (let i = 0; i < attemptIds.length; i += 400) {
    const chunk = attemptIds.slice(i, i + 400);
    const ph = chunk.map(() => '?').join(',');
    for (const r of conn
      .prepare(
        `SELECT s.*, u.full_name AS entered_by_name FROM assessment_scores s
           LEFT JOIN users u ON u.id = s.entered_by WHERE s.attempt_id IN (${ph})`,
      )
      .all(...chunk) as any[]) {
      if (!bundle.scores.has(r.attempt_id)) bundle.scores.set(r.attempt_id, []);
      bundle.scores.get(r.attempt_id)!.push(r);
    }
    for (const r of conn
      .prepare(`SELECT attempt_id, skill FROM attempt_skill_skips WHERE attempt_id IN (${ph})`)
      .all(...chunk) as any[]) {
      if (!bundle.skips.has(r.attempt_id)) bundle.skips.set(r.attempt_id, []);
      bundle.skips.get(r.attempt_id)!.push(r.skill as AssessedSkill);
    }
    for (const r of conn
      .prepare(
        /*
         * Một lượt nay sinh NHIỀU vấn đề (mỗi kỹ năng một cái), nên gộp lại thành một dòng
         * tóm tắt cho lượt: mức cao nhất, và mốc mới nhất đã thực sự xảy ra.
         */
        `SELECT c.attempt_id, MIN(c.id) AS id,
                MAX(c.sos_level) AS sos_level,
                MIN(CASE c.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END) AS st,
                MAX(iv.done_on) AS last_done
           FROM sos_cases c
           LEFT JOIN (
             SELECT case_id, MAX(COALESCE(completed_date, started_date)) AS done_on
               FROM case_interventions WHERE status != 'cancelled' GROUP BY case_id
           ) iv ON iv.case_id = c.id
          WHERE c.attempt_id IN (${ph})
          GROUP BY c.attempt_id`,
      )
      .all(...chunk) as any[]) {
      /*
       * Người dùng phải nhìn một lượt là biết đã được làm hay chưa. Mốc là lần hỗ trợ gần
       * nhất đã thực sự xảy ra; không có gì thì nói thẳng "chưa có follow-up".
       */
      const status = r.st === 0 ? 'open' : r.st === 1 ? 'in_progress' : 'done';
      bundle.cases.set(r.attempt_id, {
        id: r.id, status, sos_level: r.sos_level,
        followUp: r.last_done
          ? `Đã hỗ trợ · ${String(r.last_done).slice(8, 10)}/${String(r.last_done).slice(5, 7)}`
          : null,
      });
    }
  }
  return bundle;
}

export function entryBandsOf(rows: ScoreRow[]) {
  const map: Partial<Record<EntrySkill, number | null>> = {};
  for (const r of rows) map[r.skill] = r.band;
  return map;
}

export function resultOf(attempt: any, rows?: ScoreRow[], skips?: AssessedSkill[]): AttemptResult {
  const scores = rows ?? scoresOf(attempt.id);
  return evaluateAttempt(
    attempt.target_at_attempt,
    attempt.attempt_no,
    entryBandsOf(scores),
    skips ?? skipsOf(attempt.id),
  );
}

/**
 * Tuần của một lượt MT — thứ Hai của tuần kế hoạch, hoặc null nếu chưa xếp tuần.
 *
 * Cả năm kỹ năng trong một lượt dùng chung tuần này. Không còn ngày riêng cho Speaking.
 *
 * Hàng thô của hầu hết truy vấn đã JOIN sẵn bảng tuần (`period_start` / `week_start`), nên
 * dùng luôn giá trị đó. CHỈ khi hàng không mang tuần theo thì mới hỏi lại cơ sở dữ liệu —
 * hỏi theo từng dòng trong một vòng lặp là cách chắc chắn biến một màn thành trăm câu lệnh.
 */
export function weekStartOf(attempt: any): string | null {
  if (attempt.period_start) return attempt.period_start;
  if (attempt.week_start) return attempt.week_start;
  if (!attempt.planned_period_id) return null;
  const row = db()
    .prepare('SELECT week_start FROM report_periods WHERE id = ?')
    .get(attempt.planned_period_id) as any;
  return row?.week_start ?? null;
}

export type SkillCell = {
  skill: EntrySkill;
  assessedSkill: AssessedSkill;
  required: boolean;
  rawScore: number | null;
  criteria: [number | null, number | null, number | null, number | null];
  band: number | null;
  resultDate: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  deadline: string | null;
  deadlineSource: 'override' | 'default' | 'none';
  overdue: boolean;
  progress: SkillProgress;
  canEdit: boolean;
  /** Kỹ năng NÀY được phân công cho chính người đang xem — khác với "được phép sửa". */
  mine: boolean;
};

export function skillCells(p: Principal, attempt: any, rows: ScoreRow[], skips: AssessedSkill[], today = demoToday()): SkillCell[] {
  const editable = attempt.class_id ? editableSkills(p, attempt.class_id, ENTRY_SKILLS) : [];
  const mine = attempt.class_id ? mySkills(p, attempt.class_id, ENTRY_SKILLS) : [];
  const weekStart = weekStartOf(attempt);
  return ENTRY_SKILLS.map((skill) => {
    const assessed = assessedSkillOf(skill);
    const required = !skips.includes(assessed);
    const row = rows.find((r) => r.skill === skill);
    const dl = required && attempt.status !== 'cancelled'
      ? effectiveDeadline({ weekStart, override: attempt.deadline_override })
      : { date: null, source: 'none' as const };

    // Chỉ hai câu hỏi: tuần MT đã tới chưa, và ô điểm đã có chưa.
    let progress: SkillProgress;
    if (!required) progress = 'skipped';
    else if (row?.band !== null && row?.band !== undefined) progress = 'scored';
    else if (!weekStart) progress = 'not_scheduled';
    else progress = weekStart > today ? 'upcoming' : 'due';

    return {
      skill,
      assessedSkill: assessed,
      required,
      rawScore: row?.raw_score ?? null,
      criteria: [row?.c1 ?? null, row?.c2 ?? null, row?.c3 ?? null, row?.c4 ?? null],
      band: row?.band ?? null,
      resultDate: row?.result_date ?? null,
      enteredByName: row?.entered_by_name ?? null,
      enteredAt: row?.entered_at ?? null,
      deadline: dl.date,
      deadlineSource: dl.source,
      // Chỉ quá hạn khi đã tới lúc phải có điểm: có hạn, chưa nhập, và hạn đã qua hẳn.
      overdue: required && !!dl.date && (row?.band ?? null) === null && isOverdue(dl.date, today),
      progress,
      canEdit: required && attempt.status !== 'cancelled' && editable.includes(skill),
      /*
       * "TÔI SỬA ĐƯỢC" KHÁC "ĐÂY LÀ VIỆC CỦA TÔI" (mục 3.3).
       * Người có quyền sửa hộ vẫn bấm vào ô được, nhưng không vì thế mà nợ việc đó.
       */
      mine: required && attempt.status !== 'cancelled' && mine.includes(skill),
    };
  });
}

// ---------------------------------------------------------------- danh sách

export type AttemptFilters = {
  periodId?: number;
  branchId?: number;
  classId?: number;
  studentId?: number;
  status?: string;
  need?: 'my_scores' | 'missing_scores' | 'overdue' | 'sos_open';
  q?: string;
};

const ATTEMPT_SELECT = `
  SELECT a.*, s.full_name, s.student_code,
         cy.route, cy.target_score, cy.exam_month, cy.exam_period_id, cy.seq AS cycle_seq,
         c.code AS class_code, c.programme_code, c.branch_id, b.name AS branch_name, b.code AS branch_code,
         pr.code AS period_code, pr.week_start AS period_start, pr.week_end AS period_end
    FROM assessment_attempts a
    JOIN students s ON s.id = a.student_id
    JOIN learning_cycles cy ON cy.id = a.cycle_id
    LEFT JOIN classes c ON c.id = a.class_id
    LEFT JOIN branches b ON b.id = c.branch_id
    LEFT JOIN report_periods pr ON pr.id = a.planned_period_id`;

export function listAttempts(p: Principal, f: AttemptFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql];
  const params: unknown[] = [...cs.params];

  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.classId) { where.push('a.class_id = ?'); params.push(f.classId); }
  if (f.studentId) { where.push('a.student_id = ?'); params.push(f.studentId); }
  if (f.status) { where.push('a.status = ?'); params.push(f.status); }
  // Tuần kết quả LUÔN là tuần kế hoạch của lượt, kể cả khi các kỹ năng mock lệch tuần.
  if (f.periodId) { where.push('a.planned_period_id = ?'); params.push(f.periodId); }
  if (f.q) {
    where.push('(s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ? OR c.code LIKE ?)');
    params.push(`%${f.q}%`, `%${f.q.toLowerCase()}%`, `%${f.q.toUpperCase()}%`, `%${f.q}%`);
  }

  const rows = conn
    .prepare(`${ATTEMPT_SELECT} WHERE ${where.join(' AND ')} ORDER BY pr.week_start DESC, s.full_name`)
    .all(...params) as any[];

  const today = demoToday();
  const bundle = loadBundle(rows.map((r) => r.id));

  /*
   * Lớp thường chấm theo số câu đúng chứ không theo band, nên KHÔNG được đo bằng bộ kỹ năng
   * IELTS. Hỏi nhầm bộ thì hàng đợi "cần nhập điểm" sẽ đòi giáo viên Foundation nhập một ô
   * Writing task 1 không tồn tại. Đọc chương trình một lần cho mỗi lớp rồi dùng lại.
   */
  const programmes = allProgrammes();          // đọc một lượt, không phải mỗi lớp một lượt
  const progOfClass = new Map<number, string | null>();
  for (const r of rows) {
    if (r.class_id !== null && !progOfClass.has(r.class_id)) progOfClass.set(r.class_id, r.programme_code ?? null);
  }
  const skillsOfClass = (classId: number | null): string[] | null => {
    if (!classId) return null;
    const code = progOfClass.get(classId);
    const prog = code ? programmes.get(code) : null;
    return prog?.scoringMode === 'ratio' ? prog.skills : null;
  };

  let mapped = rows.map((a) => {
    const scores = bundle.scores.get(a.id) ?? [];
    const skips = bundle.skips.get(a.id) ?? [];
    const regularSkills = skillsOfClass(a.class_id);

    if (regularSkills) {
      const r = evaluateRegular(regularSkills, scores);
      const editable = a.class_id ? editableSkills(p, a.class_id, regularSkills) : [];
      /* Việc của CHÍNH người này = kỹ năng được phân công, không tính quyền sửa hộ (mục 3.3). */
      const mineSkills = a.class_id ? mySkills(p, a.class_id, regularSkills) : [];
      const dueForEntry = !!a.period_start && a.period_start <= today && a.status !== 'cancelled';
      const c = bundle.cases.get(a.id);
      return {
        id: a.id,
        kind: a.kind,
        studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
        classId: a.class_id, classCode: a.class_code, branchId: a.branch_id, branchName: a.branch_name,
        cycleId: a.cycle_id, cycleSeq: a.cycle_seq, route: null,
        attemptNo: a.attempt_no,
        target: null,
        period: a.planned_period_id
          ? { id: a.planned_period_id, code: a.period_code, weekStart: a.period_start, weekEnd: a.period_end }
          : null,
        status: a.status,
        // Lớp thường không có kỳ vọng theo target, không có band, không có Overall.
        expectation: null, bands: null, overall: null,
        required: regularSkills, skipped: [],
        scoredRequired: r.scored, requiredCount: r.required,
        complete: r.complete, evaluable: r.complete,
        sosLevel: r.sosLevel,
        scopeNote: null, scopeDetail: null,
        overdueSkills: 0,
        myPendingSkills: dueForEntry
          ? mineSkills.filter((k) => {
              const row = scores.find((x) => x.skill === k);
              return row?.raw_score === null || row?.raw_score === undefined;
            })
          : [],
        /*
         * Cùng danh sách trên nhưng KÈM HẠN, để màn Tổng quan nói được "quá hạn 3 ngày"
         * chứ không chỉ nói "còn thiếu điểm". Giữ `myPendingSkills` nguyên dạng mảng chuỗi
         * vì nhiều chỗ khác đang dùng.
         */
        myPendingDetail: dueForEntry
          ? mineSkills
            .filter((k) => {
              const row = scores.find((x) => x.skill === k);
              return row?.raw_score === null || row?.raw_score === undefined;
            })
            .map((k) => ({ skill: k, deadline: regularDeadline(a).date }))
          : [],
        caseStatus: c?.status ?? null,
        caseId: c?.id ?? null,
        caseLevel: c?.sos_level ?? null,
        caseFollowUp: c?.followUp ?? null,
        canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
        activeSkillCount: regularSkills.length,
      };
    }

    const result = resultOf(a, scores, skips);
    const cells = skillCells(p, a, scores, skips, today);
    const active = cells.filter((c) => c.required);
    return {
      id: a.id,
      /*
       * LOẠI BÀI phải đi kèm mọi dòng, để giao diện mở ĐÚNG màn.
       * Bài giữa/cuối khoá của lớp Normal mà mở bằng màn Mock Test thì nó hiện ra "MT1" —
       * đúng lỗi owner báo ở mục 6.3.
       */
      kind: a.kind,
      studentId: a.student_id,
      studentName: a.full_name,
      studentCode: a.student_code,
      classId: a.class_id,
      classCode: a.class_code,
      branchId: a.branch_id,
      branchCode: a.branch_code,
      branchName: a.branch_name,
      cycleId: a.cycle_id,
      cycleSeq: a.cycle_seq,
      route: a.route,
      attemptNo: a.attempt_no,
      target: a.target_at_attempt,
      /** TUẦN của lượt MT. Đây là thứ duy nhất định vị lượt này trên lịch. */
      period: a.planned_period_id
        ? { id: a.planned_period_id, code: a.period_code, weekStart: a.period_start, weekEnd: a.period_end }
        : null,
      status: a.status,
      expectation: result.expectation,
      bands: result.bands,
      overall: result.overall,
      required: result.required,
      skipped: result.skipped,
      scoredRequired: result.scoredRequired,
      requiredCount: result.required.length,
      complete: result.complete,
      evaluable: result.evaluable,
      sosLevel: result.sosLevel,
      scopeNote: result.scopeNote,
      overdueSkills: cells.filter((c) => c.overdue).length,
      myPendingSkills: cells
        .filter((c) => c.mine && c.band === null && c.progress === 'due')
        .map((c) => c.skill),
      myPendingDetail: cells
        .filter((c) => c.mine && c.band === null && c.progress === 'due')
        .map((c) => ({ skill: c.skill, deadline: c.deadline })),
      caseStatus: bundle.cases.get(a.id)?.status ?? null,
      caseId: bundle.cases.get(a.id)?.id ?? null,
      caseLevel: bundle.cases.get(a.id)?.sos_level ?? null,
      caseFollowUp: bundle.cases.get(a.id)?.followUp ?? null,
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
      activeSkillCount: active.length,
    };
  });

  switch (f.need) {
    case 'my_scores': mapped = mapped.filter((m) => m.myPendingSkills.length > 0 && m.status !== 'cancelled'); break;
    case 'missing_scores': mapped = mapped.filter((m) => m.status !== 'cancelled' && !m.complete && m.scoredRequired > 0); break;
    case 'overdue': mapped = mapped.filter((m) => m.overdueSkills > 0); break;
    case 'sos_open': mapped = mapped.filter((m) => m.caseId && m.caseStatus !== 'done'); break;
  }
  return { rows: mapped, scopeEmpty: false };
}

// ---------------------------------------------------------------- chi tiết

export function attemptDetail(p: Principal, attemptId: number) {
  const conn = db();
  const a = conn.prepare(`${ATTEMPT_SELECT} WHERE a.id = ?`).get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: a.class_id, studentId: a.student_id },
    'Lượt Mock này nằm ngoài phạm vi bạn được xem.');

  const scores = scoresOf(attemptId);
  const skips = skipsOf(attemptId);
  const result = resultOf(a, scores, skips);
  const cells = skillCells(p, a, scores, skips);
  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM attempt_schedule_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.attempt_id = ? ORDER BY h.id DESC`,
    )
    .all(attemptId) as any[];
  const sos = conn
    .prepare(
      /* Một lượt có nhiều vấn đề; màn chi tiết lấy cái nặng nhất làm đại diện. */
      `SELECT sc.*, hu.full_name AS head_name
         FROM sos_cases sc
         LEFT JOIN users hu ON hu.id = sc.head_confirmed_by WHERE sc.attempt_id = ?
        ORDER BY COALESCE(sc.sos_level, 0) DESC, sc.id LIMIT 1`,
    )
    .get(attemptId) as any;
  const caseHistory = sos
    ? (conn
        .prepare(
          `SELECT h.*, u.full_name AS actor_name FROM sos_case_history h
             LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.case_id = ? ORDER BY h.id DESC LIMIT 40`,
        )
        .all(sos.id) as any[])
    : [];

  return {
    id: a.id,
    /** Loại bài. Màn này CHỈ dựng cho `mock`; loại khác phải chuyển sang màn của lớp Normal. */
    kind: a.kind,
    student: { id: a.student_id, name: a.full_name, code: a.student_code },
    cycle: { id: a.cycle_id, seq: a.cycle_seq, route: a.route, target: a.target_score, examPlan: examPlanOf(a) },
    classId: a.class_id, classCode: a.class_code, branchId: a.branch_id, branchName: a.branch_name,
    attemptNo: a.attempt_no,
    targetAtAttempt: a.target_at_attempt,
    studyWeekHint: MOCK_FT_STUDY_WEEK[a.attempt_no] ?? null,
    period: a.planned_period_id
      ? { id: a.planned_period_id, code: a.period_code, weekStart: a.period_start, weekEnd: a.period_end,
          range: weekInfo(a.period_start).range }
      : null,
    deadlineOverride: a.deadline_override
      ? {
          date: a.deadline_override,
          reason: a.deadline_override_reason,
          at: a.deadline_override_at,
          by: (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(a.deadline_override_by) as any)?.full_name ?? null,
        }
      : null,
    status: a.status,
    cancelReason: a.cancel_reason,
    note: a.note,
    result,
    cells,
    skips: (conn
      .prepare(
        `SELECT k.*, u.full_name AS actor_name FROM attempt_skill_skips k
           LEFT JOIN users u ON u.id = k.created_by WHERE k.attempt_id = ?`,
      )
      .all(attemptId) as any[]),
    history: history.map((h) => ({
      id: h.id, action: h.action, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      reason: h.reason, actorName: h.actor_name, createdAt: h.created_at,
    })),
    sosCase: sos ?? null,
    /*
     * HƯỚNG DẪN phối hợp cho mức này — GỢI Ý, không phải việc đã làm.
     * Việc đã làm nằm ở `case_interventions` với người thực hiện và ngày thật; trộn hai
     * thứ vào một danh sách chính là chỗ mô hình cũ làm người đọc hiểu sai.
     */
    caseSteps: (sos?.sos_level ?? result.sosLevel ?? 0) > 0
      ? stepsFor(a.attempt_no, (sos?.sos_level ?? result.sosLevel) as any)
      : [],
    caseHistory: caseHistory.map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      actorName: h.actor_name, createdAt: h.created_at,
    })),
    tasks: sos
      ? (conn
          .prepare(
            `SELECT t.id, t.code, t.title, t.progress, t.due_date, u.full_name AS assignee_name
               FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id WHERE t.source_sos_case_id = ?`,
          )
          .all(sos.id) as any[])
      : [],
    viewer: {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
      canCancel: can(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id }),
      canSkipSkill: can(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: a.class_id }),
      canOverrideDeadline: can(p, PERMISSIONS.DEADLINE_OVERRIDE, { classId: a.class_id }),
      canEditSos: can(p, PERMISSIONS.SOS_EDIT, { classId: a.class_id, studentId: a.student_id }),
      editableSkills: a.class_id ? editableSkills(p, a.class_id, ENTRY_SKILLS) : [],
    },
  };
}

// ---------------------------------------------------------------- tạo lượt

/**
 * Tạo một lượt MT. Quản lý chốt TUẦN — và tuần là thứ duy nhất phải khai.
 */
export function createAttempt(p: Principal, input: {
  studentId: number; cycleId?: number; classId?: number | null; attemptNo?: number;
  periodId: number; note?: string | null;
}) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
    .get(student.id) as any;
  const classId = input.classId ?? enr?.class_id ?? null;
  require_(p, PERMISSIONS.PLAN_WEEK, { classId, studentId: student.id },
    'Chỉ Quản lý mới lập được kế hoạch tuần MT.');

  const cycle = input.cycleId ? cycleById(input.cycleId) : currentCycle(student.id);
  if (!cycle) throw badRequest('Học viên chưa có lộ trình nào. Hãy mở lộ trình trước khi lên lịch MT.');
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(input.periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần kế hoạch');

  const attemptNo = input.attemptNo ?? nextAttemptNo(cycle.id);
  if (!(attemptNo >= 1)) throw badRequest('Số lần MT không hợp lệ.');

  return tx(() => {
    const dup = conn.prepare('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?')
      .get(cycle.id, attemptNo) as any;
    if (dup) throw badRequest(`Lộ trình này đã có MT${attemptNo}. Hãy đổi tuần thay vì tạo mới.`);
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, note, created_by, created_at)
         VALUES (?,?,?, 'mock', ?,?, 'planned', ?,?,?,?)`,
      )
      .run(cycle.id, student.id, attemptNo, classId, period.id, cycle.target_score, input.note ?? null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    logSchedule(id, { action: 'created', field: 'planned_period', newValue: period.code, actor: p.userId });
    addJourney({
      studentId: student.id, eventType: 'mock_scheduled', eventDate: period.week_start,
      title: `Lên kế hoạch MT${attemptNo} · ${period.code}`,
      refTable: 'assessment_attempts', refId: id, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'attempt.create', entityType: 'assessment_attempt', entityId: id,
      entityLabel: `${student.student_code} MT${attemptNo}`, after: { period: period.code } });
    return conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(id);
  });
}

// ---------------------------------------------------------------- lịch: tuần và ngày tách nhau

function logSchedule(attemptId: number, e: {
  action: string; field?: string; oldValue?: unknown; newValue?: unknown; reason?: string | null; actor: number;
}) {
  db()
    .prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(attemptId, e.action, e.field ?? null,
         e.oldValue === undefined || e.oldValue === null ? null : String(e.oldValue),
         e.newValue === undefined || e.newValue === null ? null : String(e.newValue),
         e.reason ?? null, e.actor, nowIso());
}

function loadAttempt(attemptId: number) {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  return a;
}

/** Quản lý chốt TUẦN của một lượt MT. Đây là thao tác xếp lịch DUY NHẤT của một lượt. */
export function setPlanningWeek(p: Principal, attemptId: number, periodId: number, reason?: string) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id, studentId: a.student_id },
    'Chỉ Quản lý mới chốt được tuần kế hoạch.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ. Hãy mở lại trước khi đổi tuần.');
  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');
  if (periodId === a.planned_period_id) throw badRequest('Tuần mới trùng tuần hiện tại.');

  return tx(() => {
    const conn = db();
    const old = a.planned_period_id
      ? (conn.prepare('SELECT code FROM report_periods WHERE id = ?').get(a.planned_period_id) as any)?.code
      : null;
    conn
      .prepare('UPDATE assessment_attempts SET planned_period_id = ?, updated_at = ? WHERE id = ?')
      .run(periodId, nowIso(), attemptId);
    logSchedule(attemptId, { action: 'week_set', field: 'planned_period', oldValue: old, newValue: period.code, reason, actor: p.userId });

    addJourney({
      studentId: a.student_id, eventType: 'mock_rescheduled', eventDate: period.week_start,
      title: `MT${a.attempt_no}: tuần kế hoạch ${period.code}`, detail: reason ?? null,
      refTable: 'assessment_attempts', refId: attemptId, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'attempt.plan_week', entityType: 'assessment_attempt', entityId: attemptId,
      entityLabel: `MT${a.attempt_no}`, before: { period: old }, after: { period: period.code } });
    return { ok: true };
  });
}

/** Đánh dấu một kỹ năng ĐÁNH GIÁ là không mock ở lượt này, hoặc bỏ đánh dấu. */
export function setSkillSkip(p: Principal, attemptId: number, skill: string, skipped: boolean, reason?: string) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: a.class_id, studentId: a.student_id },
    'Chỉ Quản lý và Admin chi nhánh mới đánh dấu được kỹ năng không mock.');
  if (!(ASSESSED_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');

  return tx(() => {
    const conn = db();
    if (skipped) {
      // Đánh dấu không mock KHÔNG xoá điểm đã có; điểm cũ vẫn giữ để tra lại.
      const scored = conn
        .prepare(
          `SELECT COUNT(*) AS n FROM assessment_scores
            WHERE attempt_id = ? AND band IS NOT NULL AND skill IN (${entrySkillsOf(skill as AssessedSkill).map(() => '?').join(',')})`,
        )
        .get(attemptId, ...entrySkillsOf(skill as AssessedSkill)) as any;
      conn.prepare('INSERT OR IGNORE INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) VALUES (?,?,?,?,?)')
        .run(attemptId, skill, reason ?? null, p.userId, nowIso());
      logSchedule(attemptId, { action: 'skill_skipped', field: skill, newValue: 'skipped', reason, actor: p.userId });
      writeAudit({ actorUserId: p.userId, action: 'attempt.skip_skill', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: `MT${a.attempt_no} · ${skill}`, after: { skipped: true, reason, keptScores: scored.n } });
    } else {
      conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ? AND skill = ?').run(attemptId, skill);
      logSchedule(attemptId, { action: 'skill_restored', field: skill, newValue: 'required', reason, actor: p.userId });
      writeAudit({ actorUserId: p.userId, action: 'attempt.restore_skill', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: `MT${a.attempt_no} · ${skill}`, after: { skipped: false } });
    }
    refreshOutcome(p, attemptId);
    return { ok: true };
  });
}

/** Hạn nhập điểm riêng cho cả lượt. Phạm vi từng kỹ năng còn chờ quyết định — xem O02. */
export function setDeadlineOverride(p: Principal, attemptId: number, date: string | null, reason?: string) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.DEADLINE_OVERRIDE, { classId: a.class_id, studentId: a.student_id },
    'Chỉ Quản lý và Admin chi nhánh mới đặt được hạn riêng.');
  if (date && !isIsoDate(date)) throw badRequest('Hạn không hợp lệ.');
  db()
    .prepare(
      `UPDATE assessment_attempts SET deadline_override = ?, deadline_override_by = ?,
              deadline_override_at = ?, deadline_override_reason = ?, updated_at = ? WHERE id = ?`,
    )
    .run(date, date ? p.userId : null, date ? nowIso() : null, date ? reason ?? null : null, nowIso(), attemptId);
  logSchedule(attemptId, {
    action: date ? 'deadline_set' : 'deadline_cleared', field: 'deadline_override',
    oldValue: a.deadline_override, newValue: date, reason, actor: p.userId,
  });
  return db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
}

export function cancelAttempt(p: Principal, attemptId: number, reason: string) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id, studentId: a.student_id },
    'Bạn không có quyền huỷ lượt Mock.');
  if (!reason?.trim()) throw badRequest('Cần ghi lý do huỷ.');
  return tx(() => {
    db().prepare(`UPDATE assessment_attempts SET status='cancelled', cancel_reason=?, cancelled_at=?, updated_at=? WHERE id=?`)
      .run(reason.trim(), nowIso(), nowIso(), attemptId);
    logSchedule(attemptId, { action: 'cancelled', reason: reason.trim(), actor: p.userId });
    addJourney({ studentId: a.student_id, eventType: 'mock_cancelled', eventDate: demoToday(),
      title: `Huỷ MT${a.attempt_no}`, detail: reason.trim(), refTable: 'assessment_attempts', refId: attemptId, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'attempt.cancel', entityType: 'assessment_attempt', entityId: attemptId,
      before: { status: a.status }, after: { status: 'cancelled', reason } });
    return db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
  });
}

export function reopenAttempt(p: Principal, attemptId: number) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id, studentId: a.student_id });
  db().prepare(`UPDATE assessment_attempts SET status='planned', cancel_reason=NULL, cancelled_at=NULL, updated_at=? WHERE id=?`)
    .run(nowIso(), attemptId);
  logSchedule(attemptId, { action: 'reopened', actor: p.userId });
  refreshOutcome(p, attemptId);
  return db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
}

// ---------------------------------------------------------------- nhập điểm

export type ScorePatch = {
  rawScore?: number | null;
  rawTotal?: number | null;
  criteria?: (number | null)[];
  resultDate?: string | null;
  note?: string | null;
};

/**
 * Tính lại trạng thái lượt và mức SOS từ dữ liệu hiện có.
 *
 * "Đã xong" = đã có điểm mọi kỹ năng BẮT BUỘC, không suy từ việc ngày kế hoạch đã trôi qua.
 * Sửa điểm làm đổi mức SOS thì case giữ nguyên ID, hành động và lịch sử.
 */
function refreshOutcome(p: Principal, attemptId: number) {
  const conn = db();
  const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!fresh || fresh.status === 'cancelled') return;
  const rows = scoresOf(attemptId);
  const skips = skipsOf(attemptId);
  const result = resultOf(fresh, rows, skips);

  const nextStatus = result.complete ? 'done' : 'planned';
  if (nextStatus !== fresh.status) {
    conn.prepare('UPDATE assessment_attempts SET status = ?, updated_at = ? WHERE id = ?')
      .run(nextStatus, nowIso(), attemptId);
  }
  upsertCaseForResult(p, { ...fresh, status: nextStatus }, result);
}

export function saveScore(p: Principal, attemptId: number, skill: string, patch: ScorePatch) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không nhập điểm được.');

  const path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.');
  }
  const assessed = assessedSkillOf(skill);
  if (skipsOf(attemptId).includes(assessed)) {
    throw badRequest(`Kỹ năng ${assessed} đã được đánh dấu không mock ở lượt này.`);
  }

  return tx(() => {
    const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as ScoreRow | undefined;
    const before = existing ? { ...existing } : null;

    const resultDate = patch.resultDate !== undefined ? patch.resultDate : existing?.result_date ?? null;
    if (resultDate && !isIsoDate(resultDate)) throw badRequest('Ngày có kết quả không hợp lệ.');

    let raw: number | null = existing?.raw_score ?? null;
    let total: number | null = existing?.raw_total ?? null;
    let crit: (number | null)[] = [existing?.c1 ?? null, existing?.c2 ?? null, existing?.c3 ?? null, existing?.c4 ?? null];
    let band: number | null = existing?.band ?? null;

    try {
      if (isRawSkill(skill)) {
        if (patch.rawScore !== undefined) raw = patch.rawScore;
        if (patch.rawTotal !== undefined) total = patch.rawTotal;
        band = raw === null || raw === undefined ? null : bandFromRaw(skill, raw);
        crit = [null, null, null, null];
      } else if (isCriteriaSkill(skill)) {
        if (patch.criteria !== undefined) {
          if (!Array.isArray(patch.criteria) || patch.criteria.length !== 4) throw badRequest('Cần đủ bốn ô tiêu chí.');
          crit = patch.criteria.map((v) => (v === null || v === undefined || v === ('' as any) ? null : Number(v)));
        }
        band = bandFromCriteria(crit);
        raw = null;
      }
    } catch (e) {
      if (e instanceof ScoreError) throw badRequest(e.message);
      throw e;
    }

    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, c1=?, c2=?, c3=?, c4=?, band=?,
                                        result_date=?, entered_by=?, entered_at=?, note=? WHERE id=?`,
        )
        .run(raw, total, crit[0], crit[1], crit[2], crit[3], band, resultDate, p.userId, nowIso(),
             patch.note !== undefined ? patch.note : existing.note ?? null, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, c1, c2, c3, c4, band,
                                          result_date, entered_by, entered_at, note)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, raw, total, crit[0], crit[1], crit[2], crit[3], band,
             resultDate, p.userId, nowIso(), patch.note ?? null);
    }

    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill);
    writeAudit({
      actorUserId: p.userId,
      action: path === 'override' ? 'score.override' : 'score.edit',
      entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill, before, after,
    });

    refreshOutcome(p, attemptId);
    const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    return { score: after, result: resultOf(fresh), attemptStatus: fresh.status };
  });
}

/** Bảng nhập điểm theo lớp × tuần kế hoạch. */
export function classScoreSheet(p: Principal, classId: number, periodId: number | null) {
  const conn = db();
  const cls = conn.prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id=c.branch_id WHERE c.id=?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const period = periodId ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any) : null;

  const params: unknown[] = [classId];
  let sql = `${ATTEMPT_SELECT} WHERE a.class_id = ? AND a.status != 'cancelled'`;
  if (period) { sql += ' AND a.planned_period_id = ?'; params.push(period.id); }
  sql += ' ORDER BY s.full_name';
  const attempts = conn.prepare(sql).all(...params) as any[];

  return {
    classId, classCode: cls.code, branchName: cls.branch_name,
    period: period ? { id: period.id, code: period.code, weekStart: period.week_start, weekEnd: period.week_end } : null,
    editableSkills: editableSkills(p, classId, ENTRY_SKILLS),
    rows: (() => {
      const bundle = loadBundle(attempts.map((a) => a.id));
      return attempts.map((a) => {
      const scores = bundle.scores.get(a.id) ?? [];
      const skips = bundle.skips.get(a.id) ?? [];
      return {
        attemptId: a.id,
        studentId: a.student_id,
        studentName: a.full_name,
        studentCode: a.student_code,
        attemptNo: a.attempt_no,
        status: a.status,
        cells: skillCells(p, a, scores, skips),
        result: resultOf(a, scores, skips),
      };
      });
    })(),
  };
}

export { notify };

/**
 * ĐƯỜNG DẪN TỚI ĐIỂM CỦA MỘT LƯỢT — chọn ĐÚNG MÀN theo loại bài.
 *
 * Bài `mock` về màn Mock Test; bài giữa/cuối khoá của lớp Normal về bảng điểm của lớp đó.
 * Mở nhầm màn là đọc sai cả kết quả: màn Mock Test gọi mọi lượt là "MT{n}" và chấm theo
 * band, cả hai đều sai với một bài Progress Test.
 *
 * Máy chủ dựng sẵn đường dẫn cho mọi danh sách việc, để không màn nào phải tự ghép lấy.
 */
export function attemptHref(a: { id: number; kind?: string | null; classId?: number | null }): string {
  if (!a.kind || a.kind === 'mock') return `/mock-test/${a.id}`;
  return a.classId ? `/bang-diem-thuong/${a.classId}?kind=${a.kind}` : `/mock-test/${a.id}`;
}
