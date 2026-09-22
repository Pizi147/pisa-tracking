import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, C10_NHAP_DAU_TRU_TUAN_QUA_KHU, ENTRY_SKILLS, ENTRY_SKILL_LABEL, MOCK_FT_STUDY_WEEK, NO_SHOW_OVERRIDDEN_NOTE,
  PERMISSIONS, awaitingScore, noShowStateOf, noShowText, pendingSkillsOf,
  type AssessedSkill, type EntrySkill, type NoShowState, type PendingCell, type SkillProgress, type WorkScope,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import {
  can, classScopeSql, defaultWorkScope, editableSkills, moveableSkills, mySkills, require_, scopeFor, scoreEditPath,
  type Principal,
} from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import {
  ScoreError, assessedSkillOf, bandFromCriteria, bandFromRaw, entrySkillsOf, evaluateAttempt,
  failingEntrySkills, isCriteriaSkill, isRawSkill, type AttemptResult,
} from './scoring.ts';
import { weekInfo } from '../platform/week.ts';
import {
  completionWeekOf, ensureSkillRows, loadSkillRows, logSchedule, recomputeCompletionWeek, scoringModeOf,
  setSkillScope, setSkillWeek, skillScheduleOf, skippedSkillsOf, viewSkill,
  type SkillRow, type SkillScheduleView,
} from './skillSchedule.ts';
import { canRequest as canRequestAbsence, flagLateNoShow, pendingMove, settleNoShows } from './absence.ts';
import { raiseSignalsForResult, stepsFor } from '../cases/sos.ts';
import { reconcileCorrectedSignals } from '../cases/signals.ts';
import { currentCycle, cycleById, examPlanOf, nextAttemptNo } from './cycles.ts';
import { allProgrammes, evaluateRegular, isRatioClass, regularDeadline } from '../normal/regular.ts';

export type ScoreRow = {
  id: number; skill: EntrySkill;
  raw_score: number | null; raw_total: number | null;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null;
  band: number | null; result_date: string | null; note: string | null;
  entered_by: number | null; entered_at: string | null;
  entered_by_name?: string | null;
  /** Dấu '-' "không có bài" (PR-G) — tuần lịch lúc báo, người báo, lúc báo, báo muộn (C10), đã chốt chưa. */
  no_show_period_id?: number | null; no_show_by?: number | null; no_show_at?: string | null;
  no_show_late?: number | null; no_show_settled_at?: string | null;
};

export function scoresOf(attemptId: number): ScoreRow[] {
  return db()
    .prepare(
      `SELECT s.*, u.full_name AS entered_by_name FROM assessment_scores s
         LEFT JOIN users u ON u.id = s.entered_by WHERE s.attempt_id = ?`,
    )
    .all(attemptId) as ScoreRow[];
}

/**
 * Kỹ năng ĐÁNH GIÁ nằm NGOÀI phạm vi yêu cầu của lượt này. Không có dòng nào = phải đủ bốn.
 *
 * Từ vòng 7 phạm vi thuộc về bảng lịch từng kỹ năng, không còn là một bảng ngoại lệ riêng.
 * Bảng cũ vẫn được giữ đồng bộ để nhật ký và dữ liệu chưa di trú đọc ra cùng một kết luận.
 */
export function skipsOf(attemptId: number): AssessedSkill[] {
  const rows = db().prepare('SELECT skill, required FROM attempt_skills WHERE attempt_id = ?').all(attemptId) as any[];
  if (rows.length) return rows.filter((r) => !r.required).map((r) => r.skill as AssessedSkill);
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
  /** Lịch/phạm vi/trạng thái thi RIÊNG từng kỹ năng — nguồn duy nhất của hạn chấm. */
  skillRows: Map<number, SkillRow[]>;
  cases: Map<number, {
    id: number; status: string; sos_level: number;
    /** Câu tóm tắt "đã có ai làm gì chưa" — để nhìn danh sách là biết, không phải mở chi tiết. */
    followUp: string | null;
  }>;
};

export function loadBundle(attemptIds: number[]): AttemptBundle {
  const bundle: AttemptBundle = { scores: new Map(), skips: new Map(), skillRows: new Map(), cases: new Map() };
  if (!attemptIds.length) return bundle;
  bundle.skillRows = loadSkillRows(attemptIds);
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
    /*
     * Phạm vi lấy từ bảng lịch kỹ năng khi đợt đã có; đợt cũ chưa di trú thì đọc bảng
     * ngoại lệ cũ. Danh sách là màn CHỈ ĐỌC nên không tự tạo dòng ở đây (mục 18.1).
     */
    for (const id of chunk) {
      const rows = bundle.skillRows.get(id);
      if (rows?.length) bundle.skips.set(id, skippedSkillsOf(rows));
    }
    for (const r of conn
      .prepare(`SELECT attempt_id, skill FROM attempt_skill_skips WHERE attempt_id IN (${ph})`)
      .all(...chunk) as any[]) {
      if (bundle.skillRows.get(r.attempt_id)?.length) continue;
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
  deadlineSource: 'skill_override' | 'attempt_override' | 'default' | 'none';
  overdue: boolean;
  progress: SkillProgress;
  canEdit: boolean;
  /** Kỹ năng NÀY được phân công cho chính người đang xem — khác với "được phép sửa". */
  mine: boolean;
  /** TUẦN THI CỦA CHÍNH KỸ NĂNG NÀY — W1 và W2 dùng chung lịch của môn Writing. */
  periodId: number | null;
  periodCode: string | null;
  weekStart: string | null;
  weekRange: string | null;
  sitStatus: string;
  /**
   * DẤU '-' CỦA Ô NÀY (PR-G) — `null` khi không có dấu nào còn hiệu lực. Trạng thái là HÀM THUẦN theo
   * (dấu, tuần của bài, ngày nghiệp vụ) chứ không phải thứ được cập nhật bởi một tác vụ nền.
   */
  noShow: {
    state: Exclude<NoShowState, 'none'>;
    /** Câu hiển thị: "Không có bài · Có thể sửa đến hết Chủ nhật 20/09", "Không dự thi · Tuần W3 SEP 2026", … */
    text: string;
    effectiveOn: string | null;
    editableUntil: string | null;
  } | null;
  /** S13: một dòng giải thích khi Quản lý đã đổi kết luận "không dự thi" của chính tuần này. `null` là bình thường. */
  noShowNote: string | null;
};

/** Đưa ô điểm về đúng hình dạng mà luật đếm dùng chung cần. */
export function pendingInputOf(cells: SkillCell[]): PendingCell[] {
  return cells.map((c) => ({
    skill: c.skill,
    required: c.required,
    scored: c.band !== null,
    progress: c.progress,
    mine: c.mine,
    /* Bài đã báo "không có bài" không phải bài cần chấm. */
    noShow: c.noShow !== null,
  }));
}

/**
 * NĂM Ô NHẬP ĐIỂM của một lượt, mỗi ô kèm LỊCH VÀ HẠN CỦA CHÍNH MÔN NÓ.
 *
 * W1 và W2 là hai ô chấm riêng nhưng luôn làm trong cùng một buổi, nên chúng đọc chung
 * một dòng lịch — dòng của môn Writing. Đây là lý do lịch được giữ theo kỹ năng ĐÁNH GIÁ
 * chứ không theo ô nhập điểm.
 */
export function skillCells(
  p: Principal, attempt: any, rows: ScoreRow[], skips: AssessedSkill[],
  today = demoToday(), skillRows?: SkillRow[],
): SkillCell[] {
  const editable = attempt.class_id ? editableSkills(p, attempt.class_id, ENTRY_SKILLS) : [];
  const mine = attempt.class_id ? mySkills(p, attempt.class_id, ENTRY_SKILLS) : [];
  const mode = scoringModeOf(attempt);
  const schedule = skillScheduleOf(attempt, skillRows);
  const cancelled = attempt.status === 'cancelled';

  /* Một kỹ năng đánh giá coi là ĐÃ CÓ ĐIỂM khi mọi ô nhập của nó đã có band (W cần cả W1 và W2). */
  const scoredAssessed = (assessed: AssessedSkill): boolean =>
    entrySkillsOf(assessed).every((k) => (rows.find((r) => r.skill === k)?.band ?? null) !== null);

  return ENTRY_SKILLS.map((skill) => {
    const assessed = assessedSkillOf(skill);
    const scheduleRow = schedule[assessed];
    /*
     * Phạm vi đọc từ chính dòng lịch khi có; `skips` là đường dự phòng cho đợt chưa di trú.
     * Hai nguồn phải cho cùng kết luận, nên nơi nào cũng hỏi qua đây chứ không tự so.
     */
    const required = skillRows?.length ? !!scheduleRow.required : !skips.includes(assessed);
    const view = viewSkill({
      row: { ...scheduleRow, required: required ? 1 : 0 },
      mode,
      attemptOverride: attempt.deadline_override ?? null,
      attemptCancelled: cancelled,
      scored: scoredAssessed(assessed),
      today,
      pendingMove: pendingView(attempt.id, assessed),
    });
    const row = rows.find((r) => r.skill === skill);

    /*
     * Ô nhập điểm có tiến độ RIÊNG trong một trường hợp: Writing đã có W1 mà chưa có W2.
     * Lúc đó môn Writing chưa xong, nhưng ô W1 thì đã xong — nói ngược lại là giục giáo
     * viên đã nộp bài đi nộp lại.
     */
    const cellScored = (row?.band ?? null) !== null;
    const progress: SkillProgress =
      !required ? 'skipped'
      : cellScored ? 'scored'
      : view.progress === 'scored' ? 'due'
      : view.progress;

    /*
     * DẤU '-' CỦA Ô NÀY (PR-G). Một ô "có điểm" gồm cả điểm số câu đúng lẫn band: raw_score của L/R
     * cũng là điểm thật, nên không dùng riêng `band`.
     */
    const hasScore = cellScored || (row?.raw_score ?? null) !== null;
    let ns = noShowStateOf({
      marked: !!row?.no_show_period_id,
      hasScore,
      sameWeek: !!row?.no_show_period_id && row.no_show_period_id === view.periodId,
      weekEnd: view.weekEnd,
      today,
      enteredAfterWeekEnd: !!row?.no_show_late,
      lateRule: C10_NHAP_DAU_TRU_TUAN_QUA_KHU,
    });
    /*
     * CHƯA CHỐT MÀ ĐÃ QUÁ CHỦ NHẬT: hàm thuần trả "không dự thi", nhưng việc chốt còn có điều kiện mà hàm thuần không biết —
     * buổi vẫn phải `scheduled` và MỌI ô nhập của buổi đó đều là '-' (Writing: W1 "-" mà W2 có điểm thì buổi có người làm).
     * Không đủ điều kiện thì `settleNoShows` sẽ không chốt, nên ô cũng KHÔNG được tự nhận "Không dự thi" (và bị khoá).
     */
    if (!row?.no_show_settled_at && ns.state === 'khong-du-thi') {
      const partnersMarked = entrySkillsOf(assessed).filter((k) => k !== skill).every((k) => {
        const o = rows.find((r) => r.skill === k);
        return !!o?.no_show_period_id && o.no_show_period_id === view.periodId
          && (o.band ?? null) === null && (o.raw_score ?? null) === null;
      });
      if (!(view.sitStatus === 'scheduled' && partnersMarked)) ns = { state: 'none', effectiveOn: null, editableUntil: null };
    }
    if (row?.no_show_settled_at && ns.state !== 'none') {
      /*
       * ĐÃ CHỐT MỘT LẦN. Từ đó hiển thị theo trạng thái thi HIỆN TẠI: còn `absent` thì là không dự thi;
       * Quản lý đã sửa trạng thái thi (đảo kết luận) thì dấu '-' cũ không được tự sống lại.
       */
      ns = view.sitStatus === 'absent'
        ? { state: 'khong-du-thi', effectiveOn: view.weekEnd ? view.weekEnd.slice(0, 10) : null, editableUntil: null }
        : { state: 'none', effectiveOn: null, editableUntil: null };
    }
    const noShowNote = row?.no_show_settled_at && row.no_show_period_id === view.periodId && view.sitStatus !== 'absent'
      ? NO_SHOW_OVERRIDDEN_NOTE : null;
    const noShow = ns.state === 'none' ? null : {
      state: ns.state, text: noShowText(ns, view.periodCode, today) ?? '',
      effectiveOn: ns.effectiveOn, editableUntil: ns.editableUntil,
    };

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
      deadline: view.deadline,
      deadlineSource: view.deadlineSource,
      /* Quá hạn tính trên Ô NÀY: W2 còn trống thì W2 quá hạn, W1 đã nộp thì không. */
      overdue: required && !cellScored && !!view.deadline && !!view.weekStart
        && view.weekStart <= today && view.deadline < today
        && progress !== 'absent' && progress !== 'cancelled'
        /* Đã báo "không có bài" thì không nợ điểm ở ô này — hạn nhập điểm chỉ áp cho bài CÓ thực hiện. */
        && noShow === null,
      progress,
      canEdit: required && !cancelled && view.sitStatus !== 'cancelled' && editable.includes(skill),
      /*
       * "TÔI SỬA ĐƯỢC" KHÁC "ĐÂY LÀ VIỆC CỦA TÔI" (mục 3.3).
       * Người có quyền sửa hộ vẫn bấm vào ô được, nhưng không vì thế mà nợ việc đó.
       */
      mine: required && !cancelled && view.sitStatus !== 'cancelled' && mine.includes(skill),
      periodId: view.periodId,
      periodCode: view.periodCode,
      weekStart: view.weekStart,
      weekRange: view.weekRange,
      sitStatus: view.sitStatus,
      noShow,
      noShowNote,
    };
  });
}

/**
 * LỊCH VÀ HẠN TỪNG MÔN CỦA MỘT BÀI LỚP NORMAL.
 *
 * Lớp Normal chấm theo `điểm đạt / tổng điểm`, không có band và không tách W1/W2, nên nó
 * dùng đúng bốn môn L/R/W/S — trùng với bộ kỹ năng đánh giá. Nhờ vậy nó dùng lại được
 * nguyên bảng lịch kỹ năng, chỉ khác một chỗ: HẠN CHẤM là hết Chủ nhật của chính tuần thi
 * môn đó, thay vì thứ Tư tuần sau như Fast Track.
 *
 * Không dùng lại hàm của Fast Track cho Normal khi luật khác nhau (mục 0.3) — khác biệt đó
 * nằm gọn trong `skillScoreDeadline`, và cả hai bên cùng hỏi một nơi.
 */
export function regularSkillViews(
  attempt: any, skillRows: SkillRow[] | undefined, scores: ScoreRow[], today = demoToday(),
): Map<string, SkillScheduleView> {
  const schedule = skillScheduleOf(attempt, skillRows);
  const out = new Map<string, SkillScheduleView>();
  for (const skill of ASSESSED_SKILLS) {
    const row = schedule[skill];
    const entry = scores.find((r) => r.skill === skill);
    out.set(skill, viewSkill({
      row,
      mode: 'ratio',
      attemptOverride: attempt.deadline_override ?? null,
      attemptCancelled: attempt.status === 'cancelled',
      scored: entry?.raw_score !== null && entry?.raw_score !== undefined,
      today,
      pendingMove: pendingView(attempt.id, skill),
    }));
  }
  return out;
}

/**
 * MỘT CÂU nói rõ đợt này đang ở đâu — ví dụ của owner ở mục 10.1:
 *
 *     "MT3 · Có điểm 3/4 kỹ năng · Chờ Speaking tuần 21–27/9"
 *
 * Máy chủ dựng sẵn câu này để không màn hình nào tự ghép lấy và ghép mỗi nơi một kiểu.
 */
export function scheduleHeadline(input: {
  label: string;
  cells: SkillCell[];
  requiredSkills: AssessedSkill[];
}): string {
  const byAssessed = new Map<AssessedSkill, SkillCell[]>();
  for (const c of input.cells) {
    if (!byAssessed.has(c.assessedSkill)) byAssessed.set(c.assessedSkill, []);
    byAssessed.get(c.assessedSkill)!.push(c);
  }
  const required = input.requiredSkills;
  const scored = required.filter((k) => (byAssessed.get(k) ?? []).every((c) => c.band !== null));
  const parts = [input.label, `Có điểm ${scored.length}/${required.length} kỹ năng`];

  /* Môn còn thiếu SỚM NHẤT theo tuần thi — đó là thứ người đọc cần chờ, không phải cả danh sách. */
  const waiting = required
    .filter((k) => !scored.includes(k))
    .map((k) => (byAssessed.get(k) ?? [])[0])
    .filter(Boolean)
    .sort((a, b) => (a.weekStart ?? '9999') < (b.weekStart ?? '9999') ? -1 : 1)[0];

  if (waiting) {
    const name = ASSESSED_SKILL_LABEL[waiting.assessedSkill];
    if (waiting.progress === 'absent') parts.push(`${name} đã xác nhận vắng`);
    else if (waiting.progress === 'cancelled') parts.push(`${name} đã huỷ phần thi`);
    else if (!waiting.weekRange) parts.push(`${name} chưa xếp tuần`);
    else parts.push(`Chờ ${name} tuần ${waiting.weekRange}`);
  }
  return parts.join(' · ');
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
  /** Phạm vi đếm bài cần chấm — mặc định theo vai nếu không truyền (`defaultWorkScope`). */
  scope?: WorkScope;
};

/**
 * AI PHỤ TRÁCH TỪNG MÔN của một lớp, cho CẢ DANH SÁCH lượt trong một lần đọc.
 *
 * Danh sách ở phạm vi quản lý là để ĐÔN ĐỐC nên phải kèm tên; nạp theo từng lớp một lần,
 * đừng hỏi lại cho từng hàng — một trang danh sách có thể có hàng chục lượt.
 */
function ownersByClass(classIds: number[]): Map<number, Record<string, string>> {
  const map = new Map<number, Record<string, string>>();
  if (!classIds.length) return map;
  const ids = [...new Set(classIds)];
  const ph = ids.map(() => '?').join(',');
  const rows = db()
    .prepare(
      `SELECT ta.class_id, ta.skill, u.full_name FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${ph}) AND ta.status = 'active' AND ta.skill IS NOT NULL`,
    )
    .all(...ids) as any[];
  for (const r of rows) {
    if (!map.has(r.class_id)) map.set(r.class_id, {});
    map.get(r.class_id)![r.skill] = r.full_name;
  }
  return map;
}

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
  /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
  const workScope: WorkScope = f.scope ?? defaultWorkScope(p);
  const ownersMap = ownersByClass(
    rows.map((r) => r.class_id).filter((id): id is number => id !== null),
  );
  const ownersOf = (classId: number | null, skills: string[]): Record<string, string | null> => {
    const rec = (classId !== null && ownersMap.get(classId)) || {};
    const out: Record<string, string | null> = {};
    for (const s of skills) out[s] = rec[s] ?? null;
    return out;
  };

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
      /*
       * LỚP NORMAL CŨNG TÁCH LỊCH THEO MÔN (mục 10.1): bốn môn có thể trải hai ba tuần.
       * Nên "đã đến lúc phải nhập điểm" phải hỏi theo TỪNG MÔN, không hỏi theo tuần của
       * cả bài. Hạn của lớp Normal là hết Chủ nhật của chính tuần thi môn đó.
       */
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), scores, today);
      const pendingOf = (k: string) => {
        const v = views.get(k);
        if (!v) return null;
        const row = scores.find((x) => x.skill === k);
        const scored = row?.raw_score !== null && row?.raw_score !== undefined;
        return !scored && awaitingScore(v.progress) ? v : null;
      };
      const c = bundle.cases.get(a.id);
      /* Cùng hình dạng PendingCell mà luật đếm dùng chung cần — dựng thẳng, không qua bộ chuyển. */
      const pendingCells: PendingCell[] = regularSkills.map((k) => {
        const v = views.get(k);
        const row = scores.find((x) => x.skill === k);
        const scoredFlag = row?.raw_score !== null && row?.raw_score !== undefined;
        return {
          skill: k, required: !!v, scored: scoredFlag,
          progress: v?.progress ?? 'upcoming', mine: mineSkills.includes(k),
        };
      });
      const pending = pendingSkillsOf(pendingCells, workScope);
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
        overdueSkills: regularSkills.filter((k) => {
          const v = views.get(k);
          const row = scores.find((x) => x.skill === k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return !!v && !scored && v.overdue;
        }).length,
        myPendingSkills: mineSkills.filter((k) => !!pendingOf(k)),
        /*
         * Cùng danh sách trên nhưng KÈM HẠN, để màn Tổng quan nói được "quá hạn 3 ngày"
         * chứ không chỉ nói "còn thiếu điểm". Giữ `myPendingSkills` nguyên dạng mảng chuỗi
         * vì nhiều chỗ khác đang dùng.
         */
        myPendingDetail: mineSkills
          .map((k) => ({ skill: k, v: pendingOf(k) }))
          .filter((x) => !!x.v)
          .map((x) => ({ skill: x.skill, deadline: x.v!.deadline, weekCode: x.v!.periodCode })),
        /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
        pendingSkills: pending,
        /* Ai phụ trách từng bài — danh sách của Quản lý là để ĐÔN ĐỐC, nên phải có tên. */
        pendingOwners: ownersOf(a.class_id, pending),
        /** Tuần thi của CHÍNH các môn còn nợ — để hàng đợi nói "nợ từ tuần nào". */
        pendingWeeks: [...new Set(pending.map((k) => views.get(k)?.periodCode).filter(Boolean))],
        /** Lịch từng môn của bài này — bốn môn có thể ở ba tuần khác nhau. */
        skillWeeks: [...new Set(regularSkills.map((k) => views.get(k)?.periodCode).filter(Boolean))],
        caseStatus: c?.status ?? null,
        caseId: c?.id ?? null,
        caseLevel: c?.sos_level ?? null,
        caseFollowUp: c?.followUp ?? null,
        canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
        activeSkillCount: regularSkills.length,
      };
    }

    const result = resultOf(a, scores, skips);
    const cells = skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id));
    const active = cells.filter((c) => c.required);
    const pending = pendingSkillsOf(pendingInputOf(cells), workScope);
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
      /*
       * ĐANG NỢ ĐIỂM = đã đến tuần thi CỦA CHÍNH MÔN ĐÓ mà chưa có điểm. Bao gồm cả môn
       * đã xác nhận đã thi nhưng chưa chấm. Môn thi tuần sau KHÔNG tính là nợ.
       */
      myPendingSkills: cells
        .filter((c) => c.mine && c.band === null && awaitingScore(c.progress) && !c.noShow)
        .map((c) => c.skill),
      /* Bài đã báo "-" không còn là việc phải chấm — cùng luật với `pendingSkillsOf`, không hai luật đếm. */
      myPendingDetail: cells
        .filter((c) => c.mine && c.band === null && awaitingScore(c.progress) && !c.noShow)
        .map((c) => ({ skill: c.skill, deadline: c.deadline, weekCode: c.periodCode })),
      /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
      pendingSkills: pending,
      /* Ai phụ trách từng bài — danh sách của Quản lý là để ĐÔN ĐỐC, nên phải có tên. */
      pendingOwners: ownersOf(a.class_id, pending),
      /** Tuần thi của CHÍNH các môn còn nợ — để hàng đợi nói "nợ từ tuần nào". */
      pendingWeeks: [...new Set(
        pending.map((k) => cells.find((c) => c.skill === k)?.periodCode).filter(Boolean),
      )],
      /** Câu tóm tắt lịch tách tuần — mục 10.1. Danh sách hiện luôn, không phải mở chi tiết. */
      scheduleHeadline: scheduleHeadline({
        label: a.kind === 'mock' ? `MT${a.attempt_no}` : (a.period_code ?? ''),
        cells, requiredSkills: result.required,
      }),
      /** Các tuần thi khác nhau trong đợt — có nhiều hơn một tức là đợt này tách tuần. */
      skillWeeks: [...new Set(cells.filter((c) => c.required && c.periodCode).map((c) => c.periodCode))],
      caseStatus: bundle.cases.get(a.id)?.status ?? null,
      caseId: bundle.cases.get(a.id)?.id ?? null,
      caseLevel: bundle.cases.get(a.id)?.sos_level ?? null,
      caseFollowUp: bundle.cases.get(a.id)?.followUp ?? null,
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
      activeSkillCount: active.length,
    };
  });

  switch (f.need) {
    case 'my_scores':
      mapped = mapped.filter((m) => m.pendingSkills.length > 0 && m.status !== 'cancelled');
      break;
    case 'missing_scores': mapped = mapped.filter((m) => m.status !== 'cancelled' && !m.complete && m.scoredRequired > 0); break;
    case 'overdue': mapped = mapped.filter((m) => m.overdueSkills > 0); break;
    /* CÙNG luật với huy hiệu ở bảng lớp: case có mức SOS > 0 và chưa xong. Case không mang mức SOS (giáo viên báo) không phải case SOS. */
    case 'sos_open': mapped = mapped.filter((m) => m.caseId && m.caseStatus !== 'done' && (m.caseLevel ?? 0) > 0); break;
  }
  return { rows: mapped, scopeEmpty: false };
}

// ---------------------------------------------------------------- chi tiết

/** Một dòng chữ mô tả một ô điểm, để "trước → sau" trong lịch sử đọc được mà không cần biết bảng dữ liệu. */
export function scoreSummaryText(row: Partial<ScoreRow> | null | undefined): string {
  if (!row) return 'Chưa có';
  const band = row.band !== null && row.band !== undefined ? ` · Band ${Number(row.band).toFixed(1)}` : '';
  if (row.raw_score !== null && row.raw_score !== undefined) return `${row.raw_score} câu đúng${band}`;
  const crit = [row.c1, row.c2, row.c3, row.c4];
  if (crit.some((v) => v !== null && v !== undefined)) {
    return `Tiêu chí ${crit.map((v) => (v === null || v === undefined ? '–' : v)).join(' / ')}${band}`;
  }
  if (row.no_show_period_id) return 'Báo "-" (không có bài)';
  return 'Trống';
}

/**
 * LỊCH SỬ ĐIỂM của một lượt: ai sửa, trước → sau, lúc nào (PR-I Step 9). Đọc từ nhật ký `score.*` — điểm không có
 * bảng lịch sử riêng như lịch. Ô điểm chỉ giữ NGƯỜI NHẬP hiện tại; câu "ai đã sửa gì" nằm ở đây.
 */
export function scoreHistoryOf(attemptId: number) {
  const rows = db()
    .prepare(
      `SELECT l.id, l.action, l.entity_label, l.before_json, l.after_json, l.created_at, u.full_name AS actor_name
         FROM audit_logs l LEFT JOIN users u ON u.id = l.actor_user_id
        WHERE l.entity_type = 'assessment_attempt' AND l.entity_id = ?
          AND l.action IN ('score.edit', 'score.override', 'score.no_show', 'score.no_show_cleared')
        ORDER BY l.id DESC`,
    )
    .all(attemptId) as any[];
  return rows.map((l) => {
    const before = l.before_json ? JSON.parse(l.before_json) : null;
    const after = l.after_json ? JSON.parse(l.after_json) : null;
    const afterText = l.action === 'score.no_show' ? 'Báo "-" (không có bài)'
      : l.action === 'score.no_show_cleared' ? 'Gỡ dấu "-"'
      : scoreSummaryText(after);
    return {
      id: l.id,
      kind: l.action === 'score.override' ? 'override' : l.action === 'score.edit' ? 'edit' : 'no_show',
      skill: l.entity_label as string,
      skillLabel: ENTRY_SKILL_LABEL[l.entity_label as EntrySkill] ?? l.entity_label,
      before: scoreSummaryText(before), after: afterText,
      actorName: l.actor_name as string | null, createdAt: l.created_at as string,
    };
  });
}

export function attemptDetail(p: Principal, attemptId: number) {
  settleNoShows();
  const conn = db();
  const a = conn.prepare(`${ATTEMPT_SELECT} WHERE a.id = ?`).get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: a.class_id, studentId: a.student_id },
    'Lượt Mock này nằm ngoài phạm vi bạn được xem.');

  const scores = scoresOf(attemptId);
  /*
   * Màn CHI TIẾT được phép dựng dòng lịch còn thiếu: người dùng đang đứng trước đúng một
   * đợt và sắp thao tác trên nó. Danh sách thì không — mở một bảng báo cáo không được
   * ghi gì vào dữ liệu (mục 18.1).
   */
  const skillRows = ensureSkillRows(attemptId);
  const skips = skippedSkillsOf(skillRows);
  const result = resultOf(a, scores, skips);
  const cells = skillCells(p, a, scores, skips, demoToday(), skillRows);
  const mode = scoringModeOf(a);
  const completion = completionWeekOf(skillRows);
  const scheduleRows = ASSESSED_SKILLS.map((skill) => {
    const row = skillRows.find((r) => r.skill === skill)!;
    const view = viewSkill({
      row, mode,
      attemptOverride: a.deadline_override ?? null,
      attemptCancelled: a.status === 'cancelled',
      scored: entrySkillsOf(skill).every((k) => (scores.find((x) => x.skill === k)?.band ?? null) !== null),
      pendingMove: pendingView(a.id, skill),
    });
    return { ...view, label: ASSESSED_SKILL_LABEL[skill] };
  });
  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM attempt_schedule_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.attempt_id = ? ORDER BY h.id DESC`,
    )
    .all(attemptId) as any[];

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
    /*
     * TUẦN KẾ HOẠCH HOÀN TẤT của cả đợt — tuần muộn nhất trong các kỹ năng bắt buộc.
     * Đây KHÔNG phải ngày thi và cũng không phải ngày hoàn thành thực tế (mục 10.7).
     */
    period: a.planned_period_id
      ? { id: a.planned_period_id, code: a.period_code, weekStart: a.period_start, weekEnd: a.period_end,
          range: weekInfo(a.period_start).range }
      : null,
    completionWeek: {
      valid: completion.valid,
      blocking: completion.blocking,
      blockingLabels: completion.blocking.map((k: AssessedSkill) => ASSESSED_SKILL_LABEL[k]),
    },
    /** Lịch, phạm vi, trạng thái thi và hạn chấm của TỪNG kỹ năng (mục 10.1 · 10.5). */
    skillSchedule: scheduleRows,
    /** Đợt này có tách tuần không — nhiều hơn một tuần trong các kỹ năng bắt buộc. */
    splitWeeks: [...new Set(scheduleRows.filter((r) => r.required && r.periodCode).map((r) => r.periodCode))].length > 1,
    scheduleHeadline: scheduleHeadline({
      label: a.kind === 'mock' ? `MT${a.attempt_no}` : (a.period_code ?? ''),
      cells, requiredSkills: result.required,
    }),
    scoringMode: mode,
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
    /*
     * HỒ SƠ TEST KHÔNG CÒN KHỐI CASE (PR-I, rule book §17.5): vấn đề, phương án và việc gắn với case nằm ở hồ sơ
     * học viên và bảng case — nên payload này không còn `sosCase` · `caseSteps` · `caseHistory` · `tasks`.
     * Điểm sửa được ai, lúc nào thì có ở `scoreHistory`.
     */
    scoreHistory: scoreHistoryOf(attemptId),
    viewer: {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
      canCancel: can(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id }),
      /** Xử lý vắng (dời lần đầu / xin duyệt) — GVCN của lớp và Quản lý; giáo viên bộ môn thì không. */
      canHandleAbsence: canRequestAbsence(p, a),
      canSkipSkill: can(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: a.class_id }),
      /**
       * Xác nhận đã thi / vắng CHO TỪNG KỸ NĂNG — cùng quyền với việc dời lịch kỹ năng đó
       * (sổ SCH-01, SCH-02: một capability, không lệch giữa hai thao tác). Không còn một cờ
       * `canSetSitStatus` chung cho cả đợt — giao diện đọc `moveableSkills` theo từng kỹ
       * năng, đúng cho cả Quản lý (mọi kỹ năng) lẫn GVCN/GVBM lớp Normal (đúng phần phụ trách).
       */
      moveableSkills: a.class_id ? moveableSkills(p, a.class_id, ENTRY_SKILLS) : [],
      canOverrideDeadline: can(p, PERMISSIONS.DEADLINE_OVERRIDE, { classId: a.class_id }),
      /* Không có kỹ năng cụ thể ở mức cả đợt — dùng SOS_REPORT (rộng), đúng nghĩa "báo được". */
      canEditSos: can(p, PERMISSIONS.SOS_REPORT, { classId: a.class_id, studentId: a.student_id }),
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
  if (!cycle) throw badRequest('Học viên chưa có lộ trình nào. Mở lộ trình trước khi lên lịch MT.');
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(input.periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần kế hoạch');

  const attemptNo = input.attemptNo ?? nextAttemptNo(cycle.id);
  if (!(attemptNo >= 1)) throw badRequest('Số lần MT không hợp lệ.');

  return tx(() => {
    const dup = conn.prepare('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?')
      .get(cycle.id, attemptNo) as any;
    if (dup) throw badRequest(`Lộ trình này đã có MT${attemptNo}. Đổi tuần thay vì tạo mới.`);
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, note, created_by, created_at)
         VALUES (?,?,?, 'mock', ?,?, 'planned', ?,?,?,?)`,
      )
      .run(cycle.id, student.id, attemptNo, classId, period.id, cycle.target_score, input.note ?? null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    /*
     * Bốn dòng lịch kỹ năng được dựng NGAY khi tạo đợt, tất cả cùng tuần vừa chọn và mang
     * dấu 'auto'. Xếp cả đợt vào một tuần là trường hợp phổ biến nhất; tách R/L/W với
     * Speaking là thao tác tiếp theo trên chính bốn dòng này, không phải một đợt khác.
     */
    ensureSkillRows(id);
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

function loadAttempt(attemptId: number) {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  return a;
}

/**
 * ĐỔI TUẦN CHO CẢ ĐỢT — một lối tắt, không phải một lịch thứ hai.
 *
 * Từ vòng 7 lịch thật nằm ở từng kỹ năng. Thao tác này áp MỘT tuần cho mọi kỹ năng còn
 * dời được, rồi để hệ thống tính lại tuần kế hoạch hoàn tất. Phần ĐÃ THI hoặc ĐÃ CÓ ĐIỂM
 * đứng yên (mục 10.4): "phần đã thi không dời như một lịch tương lai".
 *
 * Nhờ đi qua đúng một hàm nghiệp vụ cho từng kỹ năng, mọi ràng buộc thứ tự đợt, cảnh báo
 * hai đợt quá gần và nhật ký đều giữ nguyên — đường hàng loạt không lỏng hơn đường lẻ.
 */
export function setPlanningWeek(p: Principal, attemptId: number, periodId: number, reason?: string, opts: { force?: boolean } = {}) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id, studentId: a.student_id },
    'Chỉ Quản lý mới chốt được tuần kế hoạch.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ. Mở lại trước khi đổi tuần.');
  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');

  const rows = ensureSkillRows(attemptId);
  const movable = rows.filter(
    (r) => r.required && r.sit_status !== 'sat' && r.sit_status !== 'cancelled'
      && r.planned_period_id !== periodId && !hasAnyBand(attemptId, r.skill),
  );
  if (!movable.length) {
    throw badRequest(
      'Không kỹ năng nào còn đổi được tuần: các kỹ năng bắt buộc đã thi, đã có điểm, '
      + 'đã huỷ phần thi hoặc vốn đã ở tuần này.',
    );
  }

  return tx(() => {
    const warnings: string[] = [];
    const kept: string[] = [];
    for (const r of movable) {
      const res = setSkillWeek(p, attemptId, r.skill, periodId, { reason, force: opts.force });
      warnings.push(...res.warnings);
      kept.push(r.skill);
    }
    addJourney({
      studentId: a.student_id, eventType: 'mock_rescheduled', eventDate: period.week_start,
      title: `MT${a.attempt_no}: đổi tuần ${kept.length} kỹ năng sang ${period.code}`, detail: reason ?? null,
      refTable: 'assessment_attempts', refId: attemptId, createdBy: p.userId,
    });
    const frozen = rows.filter((r) => r.required && !kept.includes(r.skill) && r.planned_period_id !== periodId);
    return {
      ok: true,
      moved: kept,
      /** Kỹ năng KHÔNG dời — đã thi hoặc đã có điểm. Giao diện phải nói ra, không im lặng. */
      keptInPlace: frozen.map((r) => r.skill),
      warnings: [...new Set(warnings)],
    };
  });
}

/** Kỹ năng đánh giá này đã có band chưa (Writing cần ít nhất một trong hai task). */
function hasAnyBand(attemptId: number, skill: AssessedSkill): boolean {
  const entry = entrySkillsOf(skill);
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS n FROM assessment_scores
        WHERE attempt_id = ? AND band IS NOT NULL AND skill IN (${entry.map(() => '?').join(',')})`,
    )
    .get(attemptId, ...entry) as any;
  return row.n > 0;
}

/**
 * ĐỔI PHẠM VI YÊU CẦU của một kỹ năng trong đợt.
 *
 * Luật nằm ở nơi sở hữu lịch kỹ năng — kể cả hai điều cấm quan trọng: lớp Normal không có
 * thao tác miễn môn, và không bỏ một môn khỏi phạm vi SAU khi đã xác nhận em vắng môn đó.
 * Ở đây chỉ còn việc tính lại kết luận của đợt sau khi phạm vi đổi.
 */
export function setSkillSkip(p: Principal, attemptId: number, skill: string, skipped: boolean, reason?: string) {
  const r = setSkillScope(p, attemptId, skill, !skipped, reason ?? null);
  refreshOutcome(p, attemptId);
  return r;
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
  /**
   * DẤU '-' (PR-G): `true` = báo em có lịch nhưng KHÔNG LÀM BÀI ("Không có bài"); `false` = gỡ dấu (trước
   * khi tuần kết thúc). Không phải điểm 0, và không bao giờ xoá một điểm chính thức.
   */
  noShow?: boolean;
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
  raiseSignalsForResult(p, { ...fresh, status: nextStatus }, result);

  /*
   * ĐỐI SOÁT NGƯỢC SAU KHI SỬA ĐIỂM (mục 9.4).
   *
   * `raiseSignalsForResult` ở trên lo chiều "trượt". Chiều còn lại — một ô vừa được sửa từ
   * trượt thành ĐẠT — cũng phải được dọn, nếu không hệ thống sẽ giữ mãi một tín hiệu và có
   * khi cả một case dựng trên một con số đã biết là sai.
   *
   * Phân biệt then chốt của mục 9.4 nằm ở đây: nhập sai rồi sửa KHÁC với thi lại rồi tiến
   * bộ. Nên đường này KHÔNG ghi mốc "đã tiến bộ" nào cả — nó chỉ rút lại thứ không còn căn
   * cứ. Và case đã có việc thật diễn ra thì không bị đụng tới, chỉ được nhắc xem lại.
   */
  reconcileCorrectedScores(p, attemptId, result);
}

/**
 * Những ô nhập điểm nay đã ĐẠT kỳ vọng thì rút lại tín hiệu tương ứng, và xử lý case đi kèm.
 *
 * Hai nhánh, đúng như mục 9.4:
 *
 *   · case CHỈ có căn cứ từ con số vừa sửa  → rút khỏi danh sách đang xử lý với lý do rõ
 *     ràng, huỷ các phương án chưa ai làm, giữ nguyên toàn bộ lịch sử.
 *   · case còn căn cứ khác (mốc từ đợt khác, quan sát, phương án đã chạy) → GIỮ, và báo
 *     người phụ trách xem lại xem có cần theo tiếp không. Không xoá việc đã diễn ra.
 */
function reconcileCorrectedScores(p: Principal, attemptId: number, result: AttemptResult) {
  const entry = entryBandsOf(scoresOf(attemptId));
  const failing = new Set(failingEntrySkills(result.expectation, entry, result.skipped));
  /* Ô đã có điểm mà KHÔNG nằm trong danh sách dưới kỳ vọng = ô đang đạt. */
  const passing = ENTRY_SKILLS.filter((k) => (entry[k] ?? null) !== null && !failing.has(k)) as string[];
  reconcileCorrectedSignals(p, { attemptId, passingSkills: passing, passText: 'đạt kỳ vọng' });
}

export function saveScore(
  p: Principal, attemptId: number, skill: string, patch: ScorePatch, today: string = demoToday(),
) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không nhập điểm được.');
  /*
   * DẤU "-" CỦA LỚP THƯỜNG ĐI CỬA KHÁC (C08, chốt 21/09/2026 đêm). Ở lớp thường, "-" không phải lời khai chờ chốt
   * Chủ nhật như Fast Track mà là một lần DỜI LỊCH: môn đó sang tuần sau ngay. Luật ấy nằm ở `normal/regular.ts`
   * (`reportRegularNoShow`), cùng chỗ với bảng điểm lớp thường — nên ở đây chỉ chỉ đường, không dựng luật thứ hai.
   */
  if (patch.noShow !== undefined && scoringModeOf(a) === 'ratio') {
    throw badRequest('Bài của lớp thường ghi dấu "-" ở bảng điểm lớp thường — ở đó môn được ghi "-" tự dời sang tuần sau.');
  }

  const path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.');
  }
  /*
   * CHỐT TRƯỚC KHI ĐỌC LỊCH — "kể cả không ai mở web". Hàm chốt idempotent, nên gọi ở mọi đường đọc/ghi là
   * cách thay cho một tác vụ nền. Làm ở đây để ô đã hết Chủ nhật mà còn '-' được nhìn đúng là `absent`.
   */
  settleNoShows(today);
  const assessed = assessedSkillOf(skill);
  const scheduleRow = ensureSkillRows(attemptId).find((r) => r.skill === assessed)!;
  if (!scheduleRow.required) {
    throw badRequest(`Kỹ năng ${assessed} không nằm trong phạm vi yêu cầu của đợt này.`);
  }
  /*
   * KHÔNG NHẬP ĐIỂM VÀO PHẦN ĐÃ HUỶ hoặc ĐÃ XÁC NHẬN VẮNG (mục 10.6).
   *
   * Cả hai đều là mâu thuẫn với một bản ghi mà một người đã ký tên vào: không có buổi thi
   * thì không có bài để chấm. Nếu xác nhận đó sai, người có quyền sửa lại trạng thái thi
   * trước — sửa xong mới nhập được điểm, và lịch sử giữ cả hai lần.
   */
  if (scheduleRow.sit_status === 'cancelled') {
    throw badRequest(`Phần thi ${assessed} của đợt này đã bị huỷ. Khôi phục và đặt tuần mới trước khi nhập điểm.`);
  }
  if (scheduleRow.sit_status === 'absent') {
    throw badRequest(
      `${assessed} đang được ghi nhận là học viên đã vắng. Nếu thực ra em có thi, `
      + 'sửa trạng thái thi trước rồi mới nhập điểm.',
    );
  }

  return tx(() => {
    const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as ScoreRow | undefined;
    const before = existing ? { ...existing } : null;

    /*
     * DẤU '-' — một lệnh, không phải một điểm (PR-G). Trả về NGAY, không đụng tới điểm hay bài khác:
     * '-' ở W1 không xoá W2 hay S, không tạo điểm 0, và không kéo theo tính toán band.
     */
    if (patch.noShow !== undefined) {
      const hasOfficial = (existing?.band ?? null) !== null || (existing?.raw_score ?? null) !== null;
      const done = () => {
        const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
        return {
          score: conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill),
          result: resultOf(fresh), attemptStatus: fresh.status,
        };
      };
      if (patch.noShow === true) {
        if (hasOfficial) {
          throw badRequest(
            'Ô này đã có điểm chính thức — dấu "-" không xoá được điểm. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.',
          );
        }
        if (!scheduleRow.planned_period_id || !scheduleRow.week_end) {
          throw badRequest(`${assessed} chưa có tuần thi nên chưa báo "không có bài" được.`);
        }
        /* Báo lại cùng một tuần là VÔ HẠI: không đổi gì, và không biến một dấu báo đúng hạn thành báo muộn. */
        if (existing?.no_show_period_id === scheduleRow.planned_period_id) return done();
        const late = today > scheduleRow.week_end.slice(0, 10);
        if (existing) {
          conn
            .prepare(
              `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?,
                      no_show_late = ?, no_show_settled_at = NULL WHERE id = ?`,
            )
            .run(scheduleRow.planned_period_id, p.userId, nowIso(), late ? 1 : 0, existing.id);
        } else {
          /* Cố ý KHÔNG ghi entered_by: người báo "không có bài" chưa nhập điểm nào (MT-P09). */
          conn
            .prepare(
              `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late)
               VALUES (?,?,?,?,?,?)`,
            )
            .run(attemptId, skill, scheduleRow.planned_period_id, p.userId, nowIso(), late ? 1 : 0);
        }
        writeAudit({
          actorUserId: p.userId, action: 'score.no_show', entityType: 'assessment_attempt', entityId: attemptId,
          entityLabel: skill, before, after: { noShow: true, week: scheduleRow.period_code, late },
        });
        /* C10: tuần đã kết thúc → không tự chốt, tạo một mục chờ Quản lý hiệu chỉnh. */
        if (late) {
          /* C10 (đã chốt 20/09/2026): CHỐT NGAY. Phương án cũ (chờ Quản lý hiệu chỉnh) còn code nhưng không dùng. */
          if ((C10_NHAP_DAU_TRU_TUAN_QUA_KHU as string) === 'chot-ngay') settleNoShows(today);
          else flagLateNoShow(a, assessed, scheduleRow.period_code ?? '', p.userId);
        }
        return done();
      }
      /* patch.noShow === false: gỡ dấu trước khi tuần kết thúc. Sau chốt thì đã bị chặn ở kiểm `absent` phía trên. */
      if (!existing?.no_show_period_id) return done();
      conn
        .prepare(
          `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL,
                  no_show_late = 0, no_show_settled_at = NULL WHERE id = ?`,
        )
        .run(existing.id);
      writeAudit({
        actorUserId: p.userId, action: 'score.no_show_cleared', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: skill, before, after: { noShow: false },
      });
      return done();
    }

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

    /*
     * NGƯỜI NHẬP CHỈ CÓ KHI Ô CÓ GIÁ TRỊ (MT-P09). Xoá điểm là một thao tác, nhưng KHÔNG phải một lần "nhập điểm":
     * ô trống mà còn ghi "Người nhập: X" là dùng tác giả của thao tác làm bằng chứng rằng đã có điểm. Ai đã sửa
     * gì, lúc nào vẫn nằm trong nhật ký (`score.edit`) — hiện ở "Lịch sử thay đổi" của hồ sơ Test.
     */
    const hasValue = raw !== null || crit.some((v) => v !== null);
    const enteredBy = hasValue ? p.userId : null;
    const enteredAt = hasValue ? nowIso() : null;
    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, c1=?, c2=?, c3=?, c4=?, band=?,
                                        result_date=?, entered_by=?, entered_at=?, note=? WHERE id=?`,
        )
        .run(raw, total, crit[0], crit[1], crit[2], crit[3], band, resultDate, enteredBy, enteredAt,
             patch.note !== undefined ? patch.note : existing.note ?? null, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, c1, c2, c3, c4, band,
                                          result_date, entered_by, entered_at, note)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, raw, total, crit[0], crit[1], crit[2], crit[3], band,
             resultDate, enteredBy, enteredAt, patch.note ?? null);
    }

    /*
     * ĐIỂM THẬT THẮNG DẤU '-': nhập số hoặc tiêu chí thì dấu "không có bài" hết hiệu lực — sửa "-" thành
     * điểm hợp lệ trước cuối tuần thì không tính lần vắng nào (rule book §17.1). Xoá dấu luôn cả cột chốt.
     */
    const enteringScore = (patch.rawScore !== undefined && patch.rawScore !== null)
      || (Array.isArray(patch.criteria) && patch.criteria.some((v) => v !== null && v !== undefined && (v as unknown) !== ''))
      || raw !== null || band !== null;
    if (enteringScore) {
      conn
        .prepare(
          `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL,
                  no_show_late = 0, no_show_settled_at = NULL WHERE attempt_id = ? AND skill = ?`,
        )
        .run(attemptId, skill);
    }

    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill);
    writeAudit({
      actorUserId: p.userId,
      action: path === 'override' ? 'score.override' : 'score.edit',
      entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill, before, after,
    });

    /*
     * CÓ ĐIỂM THÌ CHẮC CHẮN ĐÃ THI. Đây là suy luận duy nhất được phép ở đây, và nó chỉ đi
     * MỘT CHIỀU: từ 'theo lịch' sang 'đã thi'. Chiều ngược lại — ô điểm trống suy ra vắng —
     * là điều mục 10.6 cấm, vì ô trống cũng có thể chỉ là giáo viên chưa chấm.
     */
    if ((band ?? null) !== null && scheduleRow.sit_status === 'scheduled') {
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat', updated_at = ? WHERE id = ?`)
        .run(nowIso(), scheduleRow.id);
      logSchedule(attemptId, {
        action: 'skill_sit_status', field: assessed, oldValue: 'scheduled', newValue: 'sat',
        reason: 'Suy từ việc đã có điểm', actor: p.userId,
      });
    }
    refreshOutcome(p, attemptId);
    const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    return { score: after, result: resultOf(fresh), attemptStatus: fresh.status };
  });
}

/** Bảng nhập điểm theo lớp × tuần kế hoạch. */
export function classScoreSheet(
  p: Principal, classId: number, periodId: number | null, today: string = demoToday(),
) {
  /* Chốt "không dự thi" ở đường đọc — idempotent, thay cho tác vụ nền (PR-G). */
  settleNoShows(today);
  const conn = db();
  const cls = conn.prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id=c.branch_id WHERE c.id=?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  /*
   * BẢNG NÀY LÀ BẢNG MOCK TEST. Lớp thường có bảng riêng (`regularSheet`): chấm theo số câu đúng/tổng số câu, bài tên
   * "Giữa khoá"/"Cuối khoá". Mở nhầm bảng là đọc sai cả kết quả — bảng này gọi mọi lượt là "MT{n}" và chấm theo band.
   * Chặn ở MÁY CHỦ chứ không chỉ ở giao diện: gõ thẳng đường dẫn vẫn phải ra đúng bảng.
   */
  if (isRatioClass(classId)) {
    throw badRequest('Lớp thường dùng bảng điểm riêng (số câu đúng / tổng số câu), không dùng bảng điểm Mock Test.');
  }
  const period = periodId ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any) : null;

  const params: unknown[] = [classId];
  let sql = `${ATTEMPT_SELECT} WHERE a.class_id = ? AND a.status != 'cancelled'`;
  /*
   * LỌC THEO LỊCH TỪNG KỸ NĂNG, KHÔNG THEO TUẦN CỦA CẢ ĐỢT.
   *
   * RLW thi tuần này còn Speaking tuần sau thì đợt HOÀN TẤT ở tuần sau. Lọc theo
   * `a.planned_period_id` như bản trước làm cả đợt biến mất khỏi bảng tuần này — giáo viên
   * mở ra thấy trống trong khi đang có ba bài phải chấm.
   *
   * Quy ước "kết quả của đợt thuộc tuần hoàn tất" KHÔNG đổi. Chỗ này chỉ quyết định
   * HÀNG NÀO HIỆN RA ĐỂ CHẤM.
   */
  if (period) {
    sql += ` AND (
      a.planned_period_id = ?
      OR EXISTS (SELECT 1 FROM attempt_skills ask
                  WHERE ask.attempt_id = a.id AND ask.required = 1
                    AND ask.planned_period_id = ?)
    )`;
    params.push(period.id, period.id);
  }
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
        cells: skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id)),
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

/**
 * Đề nghị dời do vắng đang chờ, gói lại đúng ba con số màn hình cần (mục 10.6).
 *
 * Để ở đây chứ không trong `skillSchedule.ts`: module lịch không được biết tới module vắng,
 * nếu không hai file gọi vòng nhau và không file nào nạp được trước.
 */
function pendingView(attemptId: number, skill: string) {
  const r = pendingMove(attemptId, skill);
  if (!r) return null;
  const w = r.to_period_id
    ? (db().prepare('SELECT code FROM report_periods WHERE id = ?').get(r.to_period_id) as any)
    : null;
  return { id: r.id, decideBy: r.decide_by, toWeek: w?.code ?? null, moveNo: r.move_no };
}
