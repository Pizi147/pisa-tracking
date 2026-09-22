import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, PERMISSIONS, SIT_STATUSES,
  type AssessedSkill, type SitStatus, type SkillProgress,
} from '../../../shared/domain/index.ts';
import { badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, explain, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import {
  effectiveSkillDeadline, isOverdue, weekInfo, type ScoringMode,
} from '../platform/week.ts';

/**
 * QUYỀN DỜI LỊCH MỘT KỸ NĂNG (sổ SCH-01, SCH-02) — MỘT capability, dùng CHUNG cho
 * `setSkillWeek` và `setSitStatus`, để giao diện (đọc qua `moveableSkills`) và máy chủ
 * không lệch nhau.
 *
 *   Quản lý / Quản trị  → `PLAN_WEEK` (như cũ, mọi loại lớp).
 *   GVCN / GVBM         → `SCHEDULE_MOVE` (mới) — CHỈ lớp Normal, CHỈ lớp/môn mình phụ trách.
 *
 * Không gộp thành một quyền — cấp `PLAN_WEEK` cho giáo viên sẽ vô tình mở luôn xếp lịch Fast
 * Track chủ động (`bulkPlan`), đúng cái sổ cấm.
 */
export function canMoveSkillSchedule(
  p: Principal, ctx: { classId: number; studentId: number; skill?: string },
): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, ctx) || can(p, PERMISSIONS.SCHEDULE_MOVE, ctx);
}

function requireMoveSkillSchedule(
  p: Principal, ctx: { classId: number; studentId: number; skill?: string }, message: string,
) {
  if (canMoveSkillSchedule(p, ctx)) return;
  throw forbidden(message, { hint: explain(p, PERMISSIONS.SCHEDULE_MOVE, ctx) });
}

/**
 * LỊCH THI THEO TỪNG KỸ NĂNG — nơi sở hữu DUY NHẤT của mục 10.
 *
 * Trước vòng 7 một đợt MT chỉ có MỘT tuần và MỘT hạn chấm dùng chung cho cả bốn kỹ năng.
 * Ngoài đời thì không phải vậy: FT hay thi R/L/W một buổi rồi Speaking tuần sau, lớp Normal
 * có thể trải bốn môn ra hai ba tuần. Hệ quả của mô hình cũ rất cụ thể và rất sai: dời
 * Speaking sang tuần sau là gia hạn luôn cho ba môn đã thi xong từ tuần trước.
 *
 * Từ đây mỗi kỹ năng mang lịch, phạm vi, trạng thái thi và hạn chấm của riêng nó. Nhưng
 * ĐIỂM VẪN THUỘC MỘT ĐỢT DUY NHẤT: tách tuần không tạo ra MT mới, không đổi số lượt, không
 * ghép điểm từ đợt khác. Đợt vẫn có một định danh, một bảng điểm, một kết luận.
 *
 * Mọi màn hình phải đi qua file này. Tự đọc bảng rồi tính lấy hạn là cách chắc chắn nhất
 * để hai màn nói hai con số khác nhau.
 */

export type SkillRow = {
  id: number;
  attempt_id: number;
  skill: AssessedSkill;
  required: number;
  scope_reason: string | null;
  planned_period_id: number | null;
  plan_source: string;
  sit_status: SitStatus;
  sit_note: string | null;
  deadline_override: string | null;
  deadline_override_reason: string | null;
  absence_move_count: number;
  /** Ghép sẵn từ bảng tuần để không phải hỏi lại theo từng dòng. */
  week_start: string | null;
  week_end: string | null;
  period_code: string | null;
};

const SELECT_SKILLS = `
  SELECT ask.*, pr.week_start, pr.week_end, pr.code AS period_code
    FROM attempt_skills ask
    LEFT JOIN report_periods pr ON pr.id = ask.planned_period_id`;

// ---------------------------------------------------------------- đọc

/**
 * Lớp của đợt này chấm theo band (Fast Track) hay theo tỷ lệ điểm đạt (Normal).
 *
 * Quyết định hạn chấm — thứ Tư tuần sau với FT, Chủ nhật cùng tuần với Normal — nên mọi
 * màn đều phải hỏi, kể cả những màn liệt kê hàng trăm dòng. Vì vậy câu trả lời được NHỚ
 * LẠI theo lớp trong một bộ nhớ đệm nhỏ: hỏi lại cho từng dòng chính là cái bẫy N+1 mà
 * cả lớp danh sách được dựng để tránh.
 *
 * Bộ nhớ đệm bị xoá mỗi khi chương trình học được sửa, nên nó không bao giờ giữ một câu
 * trả lời đã cũ. Hàng thô nào đã JOIN sẵn cột `scoring_mode` thì dùng luôn, không hỏi lại.
 */
const modeByClass = new Map<number, ScoringMode>();

/** Quản trị hệ thống sửa chương trình học thì bỏ hết câu trả lời đã nhớ. */
export function clearScoringModeCache() {
  modeByClass.clear();
}

export function scoringModeOf(
  attempt: { class_id?: number | null; kind?: string | null; scoring_mode?: string | null },
): ScoringMode {
  if (attempt.scoring_mode) return attempt.scoring_mode === 'ratio' ? 'ratio' : 'band';
  if (!attempt.class_id) return attempt.kind && attempt.kind !== 'mock' ? 'ratio' : 'band';
  const cached = modeByClass.get(attempt.class_id);
  if (cached) return cached;
  const row = db()
    .prepare(
      `SELECT p.scoring_mode AS mode FROM classes c
         LEFT JOIN programmes p ON p.code = c.programme_code WHERE c.id = ?`,
    )
    .get(attempt.class_id) as any;
  const mode: ScoringMode = row?.mode === 'ratio' ? 'ratio' : 'band';
  modeByClass.set(attempt.class_id, mode);
  return mode;
}

/**
 * Bốn dòng kỹ năng của một đợt, TẠO NẾU CHƯA CÓ.
 *
 * Đợt cũ (và đợt vừa được tạo bằng một đường gọi chưa cập nhật) chưa có dòng nào. Thay vì
 * bắt mọi nơi gọi nhớ khởi tạo, hàm đọc tự dựng phần còn thiếu từ tuần chung của đợt và
 * đánh dấu `plan_source = 'auto'` — nói rõ đây là tuần thừa hưởng, chưa ai chốt riêng.
 *
 * KHÔNG bịa trạng thái thi và KHÔNG bịa nguyên nhân vắng: mọi dòng mới đều là 'scheduled'.
 */
export function ensureSkillRows(attemptId: number): SkillRow[] {
  const conn = db();
  const existing = conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id = ?`).all(attemptId) as SkillRow[];
  if (existing.length === ASSESSED_SKILLS.length) return sortRows(existing);

  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy đợt kiểm tra');
  /* Kỹ năng bị đánh dấu "không mock" ở mô hình cũ chuyển thẳng thành "ngoài phạm vi". */
  const legacySkips = new Set(
    (conn.prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(attemptId) as any[])
      .map((r) => r.skill as string),
  );
  const have = new Set(existing.map((r) => r.skill));
  for (const skill of ASSESSED_SKILLS) {
    if (have.has(skill)) continue;
    conn
      .prepare(
        `INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source,
                                     sit_status, created_at)
         VALUES (?,?,?,?, 'auto', 'scheduled', ?)`,
      )
      .run(attemptId, skill, legacySkips.has(skill) ? 0 : 1, a.planned_period_id ?? null, nowIso());
  }
  return sortRows(conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id = ?`).all(attemptId) as SkillRow[]);
}

function sortRows(rows: SkillRow[]): SkillRow[] {
  return [...rows].sort((a, b) => ASSESSED_SKILLS.indexOf(a.skill) - ASSESSED_SKILLS.indexOf(b.skill));
}

/**
 * Nạp lịch kỹ năng của NHIỀU đợt bằng một truy vấn — dùng cho mọi danh sách.
 *
 * Đợt nào chưa có dòng nào thì KHÔNG tự tạo ở đây: danh sách là màn chỉ đọc, và ghi vào
 * database khi người dùng chỉ mở một trang báo cáo là đúng cái side effect mục 18.1 cấm.
 * Nơi gọi tự suy tạm từ tuần chung của đợt, và dòng thật sẽ được tạo ở lần sửa đầu tiên.
 */
export function loadSkillRows(attemptIds: number[]): Map<number, SkillRow[]> {
  const out = new Map<number, SkillRow[]>();
  if (!attemptIds.length) return out;
  const conn = db();
  for (let i = 0; i < attemptIds.length; i += 400) {
    const chunk = attemptIds.slice(i, i + 400);
    const ph = chunk.map(() => '?').join(',');
    for (const r of conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id IN (${ph})`).all(...chunk) as SkillRow[]) {
      if (!out.has(r.attempt_id)) out.set(r.attempt_id, []);
      out.get(r.attempt_id)!.push(r);
    }
  }
  for (const [k, v] of out) out.set(k, sortRows(v));
  return out;
}

/**
 * Lịch của từng kỹ năng ở dạng đã sẵn sàng cho mọi nơi dùng, kể cả khi đợt chưa có dòng nào.
 *
 * `fallbackPeriod` là tuần chung của đợt: đợt cũ chưa di trú vẫn phải đọc ra được lịch,
 * và tuần chung chính là căn cứ duy nhất đang có. Không có tuần chung thì để trống.
 */
export function skillScheduleOf(
  attempt: { id: number; planned_period_id?: number | null; period_start?: string | null; period_end?: string | null; period_code?: string | null },
  rows: SkillRow[] | undefined,
): Record<AssessedSkill, SkillRow> {
  const bySkill = new Map<AssessedSkill, SkillRow>((rows ?? []).map((r) => [r.skill, r]));
  const out = {} as Record<AssessedSkill, SkillRow>;
  for (const skill of ASSESSED_SKILLS) {
    out[skill] = bySkill.get(skill) ?? {
      id: 0, attempt_id: attempt.id, skill, required: 1, scope_reason: null,
      planned_period_id: attempt.planned_period_id ?? null, plan_source: 'auto',
      sit_status: 'scheduled', sit_note: null,
      deadline_override: null, deadline_override_reason: null, absence_move_count: 0,
      week_start: attempt.period_start ?? null, week_end: attempt.period_end ?? null,
      period_code: attempt.period_code ?? null,
    };
  }
  return out;
}

/** Kỹ năng ĐÁNH GIÁ nằm ngoài phạm vi yêu cầu của đợt này. */
export function skippedSkillsOf(rows: SkillRow[] | undefined, attempt?: { id: number }): AssessedSkill[] {
  if (!rows?.length) {
    return attempt
      ? (db().prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(attempt.id) as any[])
          .map((r) => r.skill as AssessedSkill)
          .filter((s) => (ASSESSED_SKILLS as readonly string[]).includes(s))
      : [];
  }
  return rows.filter((r) => !r.required).map((r) => r.skill);
}

// ---------------------------------------------------------------- tiến độ và hạn

export type SkillScheduleView = {
  skill: AssessedSkill;
  required: boolean;
  scopeReason: string | null;
  periodId: number | null;
  periodCode: string | null;
  weekStart: string | null;
  weekEnd: string | null;
  weekRange: string | null;
  planSource: string;
  sitStatus: SitStatus;
  sitNote: string | null;
  deadline: string | null;
  deadlineSource: 'skill_override' | 'attempt_override' | 'default' | 'none';
  overdue: boolean;
  scored: boolean;
  progress: SkillProgress;
  absenceMoveCount: number;
  /** Đề nghị dời do vắng đang chờ Quản lý trả lời (mục 10.6), nếu có. */
  pendingMove: { id: number; decideBy: string; toWeek: string | null; moveNo: number } | null;
};

/**
 * TRẠNG THÁI CỦA MỘT KỸ NĂNG, gộp lịch riêng của nó với việc đã có điểm hay chưa.
 *
 * Thứ tự xét quan trọng, vì mỗi nhánh dẫn tới một việc khác nhau của người dùng:
 *
 *   ngoài phạm vi → không ai nợ gì
 *   huỷ phần thi  → chờ Quản lý khôi phục và đặt tuần mới
 *   đã có điểm    → xong
 *   vắng          → đã xác minh, chờ xử lý dời
 *   chưa xếp tuần → chờ xếp lịch, KHÔNG phải quá hạn
 *   chưa đến tuần → chưa nợ gì (đây là chỗ mô hình cũ đếm sai)
 *   đã đến tuần   → đang nợ: chưa xác nhận đã thi, hoặc đã thi mà chưa chấm
 */
export function viewSkill(input: {
  row: SkillRow;
  mode: ScoringMode;
  attemptOverride: string | null;
  attemptCancelled: boolean;
  scored: boolean;
  today?: string;
  /**
   * Đang có một đề nghị dời do vắng chờ Quản lý (mục 10.6). Truyền vào từ nơi gọi chứ không
   * tự đọc bảng, để hai module không gọi vòng nhau — và để một màn hình đọc nhiều đợt chỉ
   * phải hỏi một câu chung thay vì hỏi từng dòng.
   */
  pendingMove?: { id: number; decideBy: string; toWeek: string | null; moveNo: number } | null;
}): SkillScheduleView {
  const { row, mode, scored } = input;
  const today = input.today ?? demoToday();
  const required = !!row.required;
  const weekStart = row.week_start ?? null;

  const dl = required && !input.attemptCancelled && row.sit_status !== 'cancelled'
    ? effectiveSkillDeadline({
        mode, weekStart,
        skillOverride: row.deadline_override,
        attemptOverride: input.attemptOverride,
      })
    : { date: null, source: 'none' as const };

  let progress: SkillProgress;
  if (!required) progress = 'skipped';
  else if (input.attemptCancelled || row.sit_status === 'cancelled') progress = 'cancelled';
  else if (scored) progress = 'scored';
  /*
   * CHỜ DUYỆT DỜI đứng TRƯỚC "vắng": lịch cũ vẫn nguyên đó, nhưng điều đang thật sự xảy ra
   * là một đề nghị nằm chờ. Hiện "vắng" lúc này là giấu mất việc phải làm của Quản lý.
   */
  else if (input.pendingMove) progress = 'reschedule_pending';
  else if (row.sit_status === 'absent') progress = 'absent';
  else if (!weekStart) progress = 'not_scheduled';
  else if (weekStart > today) progress = 'upcoming';
  else progress = row.sit_status === 'sat' ? 'sat' : 'due';

  return {
    skill: row.skill,
    required,
    scopeReason: row.scope_reason,
    periodId: row.planned_period_id,
    periodCode: row.period_code,
    weekStart,
    weekEnd: row.week_end,
    weekRange: weekStart ? weekInfo(weekStart).range : null,
    planSource: row.plan_source,
    sitStatus: row.sit_status,
    sitNote: row.sit_note,
    deadline: dl.date,
    deadlineSource: dl.source,
    /*
     * QUÁ HẠN CHỈ KHI ĐÃ ĐẾN LÚC PHẢI CÓ ĐIỂM (mục 10.5).
     *
     * Ba điều kiện, thiếu một là không: kỹ năng đã có tuần thi, tuần đó đã bắt đầu, và hạn
     * của CHÍNH nó đã qua. Môn thi tuần sau không bao giờ là nợ quá hạn — đây là lỗi cũ mà
     * mô hình một-tuần-chung không thể tránh được.
     *
     * Đã xác nhận vắng cũng không phải nợ điểm: không có bài thì không có gì để chấm.
     */
    overdue:
      required && !scored && !!dl.date && !!weekStart
      && weekStart <= today && isOverdue(dl.date, today)
      && progress !== 'absent' && progress !== 'cancelled',
    scored,
    progress,
    absenceMoveCount: row.absence_move_count,
    /** Đề nghị dời do vắng đang chờ Quản lý trả lời, nếu có. */
    pendingMove: input.pendingMove ?? null,
  };
}

// ---------------------------------------------------------------- tuần kế hoạch hoàn tất

export type CompletionWeek = {
  periodId: number | null;
  /**
   * Tuần kế hoạch hoàn tất có ĐẦY ĐỦ CĂN CỨ hay không. `false` khi còn kỹ năng bắt buộc
   * chưa có tuần hoặc đã bị huỷ phần thi — đợt chưa có kế hoạch hoàn tất hợp lệ (mục 10.7).
   */
  valid: boolean;
  /** Kỹ năng làm cho kế hoạch chưa hợp lệ, để màn hình chỉ đúng chỗ cần xử lý. */
  blocking: AssessedSkill[];
};

/**
 * TUẦN KẾ HOẠCH HOÀN TẤT của một đợt = tuần MUỘN NHẤT trong các kỹ năng bắt buộc (mục 10.7).
 *
 * Đây là tuần mà mọi bảng kết quả theo tuần dùng để xếp đợt vào đúng một dòng — thi R/L/W
 * tuần 14–20/9 và Speaking tuần 21–27/9 thì đợt thuộc về tuần 21–27/9, đếm MỘT lần.
 *
 * Nó KHÔNG phải ngày hoàn thành thực tế. Một đợt có thể mang tuần này mà chưa có đủ điểm;
 * giao diện phải nói "tuần kế hoạch hoàn tất", không nói "đã xong tuần đó".
 *
 * Khi còn môn chưa xếp lại hoặc đã huỷ, kế hoạch CHƯA hợp lệ. Lúc đó vẫn giữ tuần muộn
 * nhất trong các môn đã có lịch, để tra lại được lịch trước khi huỷ và để đợt không biến
 * mất khỏi báo cáo — nhưng `valid = false` để màn hình bày ra hàng cần xử lý.
 */
export function completionWeekOf(rows: SkillRow[]): CompletionWeek {
  const required = rows.filter((r) => r.required);
  if (!required.length) return { periodId: null, valid: false, blocking: [] };

  const blocking = required
    .filter((r) => r.sit_status === 'cancelled' || !r.planned_period_id)
    .map((r) => r.skill);

  const dated = required.filter((r) => r.week_start && r.sit_status !== 'cancelled');
  const latest = dated.length
    ? dated.reduce((a, b) => (a.week_start! >= b.week_start! ? a : b))
    : required.filter((r) => r.week_start).sort((a, b) => (a.week_start! < b.week_start! ? 1 : -1))[0] ?? null;

  return { periodId: latest?.planned_period_id ?? null, valid: blocking.length === 0, blocking };
}

/**
 * Ghi lại tuần kế hoạch hoàn tất vào chính đợt, và ghi lịch sử khi nó đổi.
 *
 * Cột `assessment_attempts.planned_period_id` vẫn là thứ mọi báo cáo theo tuần đọc. Giữ
 * nguyên tên cột nhưng đổi Ý NGHĨA — từ "tuần thi của cả đợt" thành "tuần kế hoạch hoàn
 * tất" — là cách để một quy tắc chỉ có một nơi sở hữu mà không phải đi vá mười màn hình.
 */
export function recomputeCompletionWeek(attemptId: number, actorUserId: number | null): CompletionWeek {
  const conn = db();
  const rows = ensureSkillRows(attemptId);
  const cw = completionWeekOf(rows);
  const a = conn.prepare('SELECT planned_period_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a || a.planned_period_id === cw.periodId) return cw;

  const codeOf = (id: number | null) =>
    id ? ((conn.prepare('SELECT code FROM report_periods WHERE id = ?').get(id) as any)?.code ?? null) : null;
  const before = codeOf(a.planned_period_id);
  conn.prepare('UPDATE assessment_attempts SET planned_period_id = ?, updated_at = ? WHERE id = ?')
    .run(cw.periodId, nowIso(), attemptId);
  logSchedule(attemptId, {
    action: 'completion_week', field: 'planned_period',
    oldValue: before, newValue: codeOf(cw.periodId),
    reason: 'Tính lại theo tuần muộn nhất của các kỹ năng bắt buộc',
    actor: actorUserId,
  });
  return cw;
}

export function logSchedule(attemptId: number, e: {
  action: string; field?: string; oldValue?: unknown; newValue?: unknown;
  reason?: string | null; actor: number | null;
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

// ---------------------------------------------------------------- ràng buộc khi đổi lịch

export type ScheduleCheck = { blockers: string[]; warnings: string[] };

/**
 * RÀNG BUỘC THỨ TỰ GIỮA CÁC ĐỢT khi lịch đã tách theo kỹ năng (mục 10.4).
 *
 * Kiểm trên LỊCH HỢP NHẤT chứ không so tuần với tuần: phần CUỐI của đợt trước phải đứng
 * trước phần ĐẦU của đợt sau. Nhờ vậy MT2 thi R/L/W tuần 10 và Speaking tuần 11 vẫn xếp
 * được MT3 từ tuần 12, mà không ai phải nhẩm xem "tuần của MT2" nghĩa là tuần nào.
 *
 * Hai điều hàm này CỐ TÌNH KHÔNG làm:
 *
 *   · Không tự dịch các đợt khác cho lịch mới hợp lệ. Nó nêu tên đợt và kỹ năng xung đột
 *     để người có quyền tự xử lý.
 *   · Không bịa giới hạn khi đợt lân cận chưa có lịch. Chưa có căn cứ thì không chặn.
 *
 * Hai đợt cách nhau đúng một tuần thì CẢNH BÁO, không chặn: người có quyền xác nhận được.
 * R/L/W và Speaking của CÙNG một đợt không bao giờ bị gọi là "hai MT quá gần".
 */
export function checkSkillWeekMove(input: {
  attemptId: number;
  skill: AssessedSkill;
  newWeekStart: string;
}): ScheduleCheck {
  const conn = db();
  const blockers: string[] = [];
  const warnings: string[] = [];
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(input.attemptId) as any;
  if (!a) return { blockers: ['Không tìm thấy đợt kiểm tra'], warnings };

  /* Lịch hợp nhất của các đợt khác trong CÙNG lộ trình, bỏ đợt đã huỷ. */
  const others = conn
    .prepare(
      `SELECT a.id, a.attempt_no, a.kind,
              MIN(pr.week_start) AS first_week, MAX(pr.week_start) AS last_week
         FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.required = 1 AND ask.sit_status != 'cancelled'
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE a.cycle_id = ? AND a.id != ? AND a.status != 'cancelled'
        GROUP BY a.id`,
    )
    .all(a.cycle_id, input.attemptId) as any[];

  const label = (n: number, kind: string) => (kind === 'mock' ? `MT${n}` : `đợt ${n}`);

  for (const o of others) {
    if (o.attempt_no < a.attempt_no) {
      if (input.newWeekStart < o.last_week) {
        blockers.push(
          `${label(o.attempt_no, o.kind)} có phần thi ở tuần ${weekInfo(o.last_week).code}. `
          + 'Phần thi của đợt sau không được xếp trước phần cuối của đợt trước.',
        );
      } else if (input.newWeekStart === o.last_week) {
        warnings.push(`Trùng tuần với phần cuối của ${label(o.attempt_no, o.kind)}.`);
      } else if (daysBetween(o.last_week, input.newWeekStart) === 7) {
        warnings.push(`Chỉ cách ${label(o.attempt_no, o.kind)} đúng một tuần.`);
      }
    } else if (o.attempt_no > a.attempt_no) {
      if (input.newWeekStart > o.first_week) {
        blockers.push(
          `${label(o.attempt_no, o.kind)} đã có phần thi ở tuần ${weekInfo(o.first_week).code}. `
          + 'Phần thi của đợt trước không được xếp vượt qua đợt kế tiếp.',
        );
      } else if (input.newWeekStart === o.first_week) {
        warnings.push(`Trùng tuần với phần đầu của ${label(o.attempt_no, o.kind)}.`);
      } else if (daysBetween(input.newWeekStart, o.first_week) === 7) {
        warnings.push(`Chỉ cách ${label(o.attempt_no, o.kind)} đúng một tuần.`);
      }
    }
  }
  return { blockers, warnings };
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

// ---------------------------------------------------------------- thao tác

function loadOne(attemptId: number, skill: string): { attempt: any; row: SkillRow } {
  if (!(ASSESSED_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  const attempt = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!attempt) throw notFound('Không tìm thấy đợt kiểm tra');
  const rows = ensureSkillRows(attemptId);
  const row = rows.find((r) => r.skill === skill)!;
  return { attempt, row };
}

/** Đã có ít nhất một ô điểm của kỹ năng đánh giá này. */
function hasScore(attemptId: number, skill: AssessedSkill): boolean {
  const entry = skill === 'writing' ? ['writing1', 'writing2'] : [skill];
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS n FROM assessment_scores
        WHERE attempt_id = ? AND band IS NOT NULL AND skill IN (${entry.map(() => '?').join(',')})`,
    )
    .get(attemptId, ...entry) as any;
  return row.n > 0;
}

/**
 * XẾP HOẶC ĐỔI TUẦN THI của MỘT kỹ năng.
 *
 * `force` cho phép người có quyền xác nhận đi tiếp khi chỉ có cảnh báo (hai đợt cách nhau
 * một tuần). Cảnh báo là cảnh báo; chặn là chặn — `force` không bao giờ vượt được blocker.
 *
 * Phần ĐÃ THI hoặc ĐÃ CÓ ĐIỂM không dời như một lịch tương lai (mục 10.4): lịch sử thực tế
 * sai thì đó là một hiệu chỉnh có căn cứ, không phải một lần dời.
 */
export function setSkillWeek(p: Principal, attemptId: number, skill: string, periodId: number, opts: {
  reason?: string | null;
  force?: boolean;
} = {}) {
  const { attempt, row } = loadOne(attemptId, skill);
  requireMoveSkillSchedule(
    p, { classId: attempt.class_id, studentId: attempt.student_id, skill: row.skill },
    'Bạn không có quyền đổi lịch thi của kỹ năng này.',
  );
  if (attempt.status === 'cancelled') throw badRequest('Đợt này đã huỷ. Mở lại trước khi đổi lịch.');
  if (!row.required) throw badRequest(`Kỹ năng ${skill} không nằm trong phạm vi yêu cầu của đợt này.`);

  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');
  if (periodId === row.planned_period_id) throw badRequest('Tuần mới trùng tuần hiện tại.');

  if (hasScore(attemptId, row.skill)) {
    throw badRequest(
      `${skill} đã có điểm ở đợt này. Phần đã thi giữ nguyên lịch thật; `
      + 'muốn sửa lịch sử thì dùng hiệu chỉnh có lý do, không dời như một lịch tương lai.',
    );
  }
  if (row.sit_status === 'sat') {
    throw badRequest(`${skill} đã được xác nhận là đã thi. Việc còn lại là chấm, không phải dời lịch.`);
  }

  const check = checkSkillWeekMove({ attemptId, skill: row.skill, newWeekStart: period.week_start });
  if (check.blockers.length) throw badRequest(check.blockers.join(' '));
  if (check.warnings.length && !opts.force) {
    throw badRequest(`${check.warnings.join(' ')} Xác nhận lại nếu vẫn muốn xếp vào tuần này.`);
  }

  /*
   * ĐANG CÓ ĐỀ NGHỊ DỜI CHỜ DUYỆT thì không đổi lịch bằng đường thường (mục 10.6).
   *
   * Nếu cho phép, sẽ có hai đường cùng đổi một lịch: Quản lý sửa tay ở đây rồi lát nữa lại
   * duyệt chính đề nghị kia, và em bị dời hai tuần. Trả lời đề nghị đó là cách đúng — nó
   * vừa đổi lịch vừa ghi lại ai quyết định.
   */
  const waiting = db()
    .prepare(
      `SELECT id, decide_by FROM skill_move_requests
        WHERE attempt_id = ? AND skill = ? AND status = 'pending' LIMIT 1`,
    )
    .get(attemptId, row.skill) as any;
  if (waiting) {
    throw badRequest(
      `${skill} đang có một đề nghị dời do vắng chờ Quản lý trả lời (hạn ${waiting.decide_by}). `
      + 'Trả lời đề nghị đó thay vì đổi lịch ở đây — nếu không, em bị dời hai lần.',
    );
  }

  return tx(() => {
    const conn = db();
    const oldCode = row.period_code;
    /*
     * ĐƯỜNG NÀY KHÔNG BAO GIỜ TĂNG BỘ ĐẾM DỜI DO VẮNG (mục 10.6).
     *
     * Đây là dời CHỦ ĐỘNG: Quản lý sắp lại lịch học, đổi phòng thi, tách R/L/W với Speaking.
     * Bộ đếm kia đếm những lần em KHÔNG CÓ MẶT, và nó chỉ nhích ở `absence.ts`. Trước đây
     * hàm này có một ô tick "dời vì em vắng" chạy song song — hai cửa vào cùng một bộ đếm là
     * cách chắc chắn nhất để con số ấy không còn nghĩa gì.
     */
    conn
      .prepare(
        `UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual',
                sit_status = CASE WHEN sit_status = 'absent' THEN 'scheduled' ELSE sit_status END,
                updated_at = ?
          WHERE id = ?`,
      )
      .run(periodId, nowIso(), row.id);
    logSchedule(attemptId, {
      action: 'skill_week_set',
      field: skill, oldValue: oldCode, newValue: period.code, reason: opts.reason ?? null, actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'attempt.skill_week', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${attempt.kind === 'mock' ? `MT${attempt.attempt_no}` : attempt.kind} · ${skill}`,
      before: { week: oldCode }, after: { week: period.code },
    });
    return { ok: true, warnings: check.warnings, completionWeek: cw };
  });
}

/**
 * PHẠM VI YÊU CẦU của một kỹ năng trong đợt (mục 10.1).
 *
 * Ba lần chặn, mỗi lần đóng đúng một đường lách mà đề bài nêu tên:
 *
 *   1. Lớp Normal không có thao tác miễn môn — Progress/Final Test luôn phải đủ bốn môn.
 *   2. Không bỏ một môn khỏi phạm vi sau khi đã xác nhận em VẮNG môn đó. Làm thế là biến
 *      một đợt thiếu kết quả thành "hoàn tất" mà không ai phải giải thích gì.
 *   3. Bỏ môn phải có lý do, và dấu vắng cũ vẫn nằm nguyên trong lịch sử.
 */
export function setSkillScope(p: Principal, attemptId: number, skill: string, required: boolean, reason?: string | null) {
  const { attempt, row } = loadOne(attemptId, skill);
  require_(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: attempt.class_id, studentId: attempt.student_id },
    'Chỉ Quản lý mới đổi được phạm vi kỹ năng của một đợt.');
  if (!!row.required === required) return { ok: true, unchanged: true };

  if (!required) {
    if (scoringModeOf(attempt) === 'ratio') {
      throw badRequest(
        'Lớp Normal luôn phải đủ bốn môn L/R/W/S. Không có thao tác miễn môn để hoàn tất Progress/Final Test.',
      );
    }
    if (row.sit_status === 'absent') {
      throw badRequest(
        `${skill} đã được xác nhận vắng. Không bỏ môn khỏi phạm vi sau khi vắng — `
        + 'xếp lại lịch hoặc huỷ phần thi, đợt vẫn là đợt chưa đủ kết quả.',
      );
    }
    if (!reason?.trim()) throw badRequest('Cần ghi lý do khi bỏ một kỹ năng khỏi phạm vi yêu cầu.');
  }

  return tx(() => {
    db()
      .prepare(
        `UPDATE attempt_skills SET required = ?, scope_reason = ?, scope_by = ?, scope_at = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(required ? 1 : 0, required ? null : reason?.trim() || null,
           p.userId, nowIso(), nowIso(), row.id);
    /* Giữ bảng cũ đồng bộ để dữ liệu và nhật ký đã trỏ vào nó không nói ngược lại. */
    if (required) {
      db().prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ? AND skill = ?').run(attemptId, skill);
    } else {
      db()
        .prepare('INSERT OR IGNORE INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) VALUES (?,?,?,?,?)')
        .run(attemptId, skill, reason ?? null, p.userId, nowIso());
    }
    logSchedule(attemptId, {
      action: required ? 'skill_restored' : 'skill_skipped', field: skill,
      oldValue: row.required ? 'required' : 'skipped', newValue: required ? 'required' : 'skipped',
      reason: reason ?? null, actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: required ? 'attempt.restore_skill' : 'attempt.skip_skill',
      entityType: 'assessment_attempt', entityId: attemptId, entityLabel: `${attemptId} · ${skill}`,
      before: { required: !!row.required }, after: { required, reason: reason ?? null },
    });
    return { ok: true, completionWeek: cw };
  });
}

/**
 * XÁC NHẬN TRẠNG THÁI THI của một kỹ năng.
 *
 * "Điểm trống chưa đủ để xác nhận vắng" (mục 10.6) — nên đây là một thao tác của người,
 * có tên và có thời điểm, chứ không phải một kết luận hệ thống tự rút ra.
 *
 * Xác nhận vắng KHÔNG tự dời lịch và KHÔNG tự tăng bộ đếm dời: dời là một quyết định riêng
 * với quyền riêng (việc 25). Ở đây chỉ ghi nhận sự thật "em không thi buổi đó".
 */
export function setSitStatus(p: Principal, attemptId: number, skill: string, status: string, note?: string | null) {
  const { attempt, row } = loadOne(attemptId, skill);
  if (!(SIT_STATUSES as readonly string[]).includes(status)) throw badRequest('Trạng thái thi không hợp lệ.');
  requireMoveSkillSchedule(
    p, { classId: attempt.class_id, studentId: attempt.student_id, skill: row.skill },
    'Bạn không có quyền xác nhận trạng thái thi của kỹ năng này.',
  );
  if (!row.required) throw badRequest(`Kỹ năng ${skill} không nằm trong phạm vi yêu cầu của đợt này.`);
  if (status === 'absent' && hasScore(attemptId, row.skill)) {
    throw badRequest(`${skill} đã có điểm ở đợt này, không thể xác nhận là vắng.`);
  }
  if (status !== 'scheduled' && !row.planned_period_id) {
    throw badRequest(`${skill} chưa có tuần thi, chưa xác nhận được em đã thi hay vắng.`);
  }
  if (row.sit_status === status) return { ok: true, unchanged: true };

  return tx(() => {
    db()
      .prepare('UPDATE attempt_skills SET sit_status = ?, sit_by = ?, sit_at = ?, sit_note = ?, updated_at = ? WHERE id = ?')
      .run(status, p.userId, nowIso(), note ?? null, nowIso(), row.id);
    logSchedule(attemptId, {
      action: 'skill_sit_status', field: skill, oldValue: row.sit_status, newValue: status,
      reason: note ?? null, actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'attempt.sit_status', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${attemptId} · ${skill}`,
      before: { sitStatus: row.sit_status }, after: { sitStatus: status, note: note ?? null },
    });
    return { ok: true, completionWeek: cw };
  });
}

/** Hạn chấm riêng cho ĐÚNG một kỹ năng. Đè lên hạn riêng của cả đợt và hạn mặc định. */
export function setSkillDeadline(p: Principal, attemptId: number, skill: string, date: string | null, reason?: string | null) {
  const { attempt, row } = loadOne(attemptId, skill);
  require_(p, PERMISSIONS.DEADLINE_OVERRIDE, { classId: attempt.class_id, studentId: attempt.student_id },
    'Chỉ Quản lý mới đặt được hạn chấm riêng.');
  if (date && !isIsoDate(date)) throw badRequest('Hạn không hợp lệ.');
  db()
    .prepare(
      `UPDATE attempt_skills SET deadline_override = ?, deadline_override_by = ?, deadline_override_at = ?,
              deadline_override_reason = ?, updated_at = ? WHERE id = ?`,
    )
    .run(date, date ? p.userId : null, date ? nowIso() : null, date ? reason ?? null : null, nowIso(), row.id);
  logSchedule(attemptId, {
    action: date ? 'skill_deadline_set' : 'skill_deadline_cleared', field: skill,
    oldValue: row.deadline_override, newValue: date, reason: reason ?? null, actor: p.userId,
  });
  return { ok: true };
}

/** Người đang xem có được đổi lịch/phạm vi của đợt này không. */
export function scheduleViewerRights(p: Principal, attempt: { class_id?: number | null; student_id?: number | null }) {
  const ctx = { classId: attempt.class_id ?? null, studentId: attempt.student_id ?? null };
  return {
    canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, ctx),
    canSetScope: can(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, ctx),
    canOverrideDeadline: can(p, PERMISSIONS.DEADLINE_OVERRIDE, ctx),
  };
}
