import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, CHU_KY_NANG, CO_DIEM_SQL, KY_NANG_KE_HOACH, PERMISSIONS, SIT_STATUSES, boMonLich, duongDotTest,
  kiemTuanMt0, kiemTuanXep, laMtCu, luotBiVuot, nhanDot, tenMon, tuanLich, tuanMuonNhatMt0,
  type AssessedSkill, type LuotLanCan, type SitStatus, type SkillProgress, nhanBaiThuong, soThuTuLuot } from '../../../shared/domain/index.ts';
import { HttpError, badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, explain, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nhoTheoId } from '../platform/nguCanhRequest.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { programmeByCode } from '../normal/regular.ts';
import { rutDeNghiDoi } from './absence.ts';
import { classProgress } from '../classes/schedule.ts';
import {
  effectiveSkillDeadline, mondayOf, quaHanNhapDiem, weekInfo, type ScoringMode,
} from '../platform/week.ts';

/**
 * QUYỀN DỜI LỊCH MỘT KỸ NĂNG (sổ SCH-01, SCH-02) — MỘT capability, dùng CHUNG cho
 * `setSkillWeek` và `setSitStatus`, để giao diện (đọc qua `moveableSkills`) và máy chủ
 * không lệch nhau.
 *
 *   Quản lý / Quản trị  → `PLAN_WEEK` (như cũ, mọi loại lớp).
 *   GVCN / GVBM         → `SCHEDULE_MOVE` (mới) — CHỈ lớp thường, CHỈ lớp/môn mình phụ trách.
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
 * Ngoài đời thì không phải vậy: FT hay thi R/L/W một buổi rồi Speaking tuần sau, lớp thường
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
  /** FT: một trong 4 kỹ năng đánh giá. Lớp thường: môn của chương trình (Pre FOU `tong_hop`). */
  skill: string;
  required: number;
  scope_reason: string | null;
  planned_period_id: number | null;
  plan_source: string;
  sit_status: SitStatus;
  sit_note: string | null;
  deadline_override: string | null;
  deadline_override_reason: string | null;
  absence_move_count: number;
  /** 1 = buổi vắng này sinh ra từ việc CHỐT dấu "-" (S11). Không đọc `sit_note` để biết điều này. */
  absent_from_no_show: number;
  /** T3 (PR-MTa): 1 = phần thi huỷ vì vắng lần 2 (`sit_status = 'cancelled'`). */
  huy_vang: number;
  /** Ghép sẵn từ bảng tuần để không phải hỏi lại theo từng dòng. */
  week_start: string | null;
  week_end: string | null;
  period_code: string | null;
};

/*
 * TD2-a: đúng các cột của `SkillRow` thay vì `ask.*` — danh sách đọc hàng nghìn dòng mỗi request; người/lúc (`*_by`, `*_at`,
 * `created_at`, `updated_at`) không màn nào đọc từ đây (nhật ký có bảng riêng).
 */
const SELECT_SKILLS = `
  SELECT ask.id, ask.attempt_id, ask.skill, ask.required, ask.scope_reason, ask.planned_period_id, ask.plan_source, ask.sit_status,
         ask.sit_note, ask.deadline_override, ask.deadline_override_reason, ask.absence_move_count, ask.absent_from_no_show, ask.huy_vang,
         pr.week_start, pr.week_end, pr.code AS period_code
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
  if (attempt.kind === 'mt0') return 'band';   // PR-MT0: MT0 chấm band dù nằm ở lớp thường
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
/** K5-38, PF6: bộ môn xếp lịch của MỘT lượt — FT 4 kỹ năng đánh giá; lớp thường theo `programme_skills` (Pre FOU một ô). */
export function boMonCuaLuot(conn: any, attemptId: number): readonly string[] {
  const r = conn.prepare(`SELECT c.programme_code AS ct, a.kind FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?`).get(attemptId) as any;
  if (r?.kind === 'mt0') return ASSESSED_SKILLS;   // PR-MT0: MT0 luôn bốn kỹ năng IELTS
  return boMonLich(r?.ct ?? null, programmeByCode(r?.ct)?.skills);
}

export function ensureSkillRows(attemptId: number): SkillRow[] {
  const conn = db();
  const existing = conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id = ?`).all(attemptId) as SkillRow[];
  const bo = boMonCuaLuot(conn, attemptId);
  if (bo.every((k) => existing.some((r) => r.skill === k))) return sortRows(existing, bo);

  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt kiểm tra');
  /* Kỹ năng bị đánh dấu "không mock" ở mô hình cũ chuyển thẳng thành "ngoài phạm vi". */
  const legacySkips = new Set(
    (conn.prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(attemptId) as any[])
      .map((r) => r.skill as string),
  );
  const have = new Set(existing.map((r) => r.skill));
  for (const skill of bo) {
    if (have.has(skill)) continue;
    conn
      .prepare(
        `INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source,
                                     sit_status, created_at)
         VALUES (?,?,?,?, 'auto', 'scheduled', ?)`,
      )
      .run(attemptId, skill, legacySkips.has(skill) ? 0 : 1, a.planned_period_id ?? null, nowIso());
  }
  return sortRows(conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id = ?`).all(attemptId) as SkillRow[], bo);
}

function sortRows(rows: SkillRow[], bo: readonly string[] = ASSESSED_SKILLS): SkillRow[] {
  return [...rows].sort((a, b) => (bo.indexOf(a.skill) + 1 || 99) - (bo.indexOf(b.skill) + 1 || 99));
}

/**
 * Nạp lịch kỹ năng của NHIỀU đợt bằng một truy vấn — dùng cho mọi danh sách.
 *
 * Đợt nào chưa có dòng nào thì KHÔNG tự tạo ở đây: danh sách là màn chỉ đọc, và ghi vào
 * database khi người dùng chỉ mở một trang báo cáo là đúng cái side effect mục 18.1 cấm.
 * Nơi gọi tự suy tạm từ tuần chung của đợt, và dòng thật sẽ được tạo ở lần sửa đầu tiên.
 */
export function loadSkillRows(attemptIds: number[]): Map<number, SkillRow[]> {
  if (!attemptIds.length) return new Map();
  /* TD2-a: nhớ theo từng lượt trong request GET — `loadBundle` và nơi gọi thường đọc lại cùng tập lượt. */
  return nhoTheoId('lich-kn:', attemptIds, (ids) => {
    const out = new Map<number, SkillRow[]>();
    const conn = db();
    for (let i = 0; i < ids.length; i += 900) {   // cùng cỡ lô với loadBundle (PR-MT)
      const chunk = ids.slice(i, i + 900);
      const ph = chunk.map(() => '?').join(',');
      for (const r of conn.prepare(`${SELECT_SKILLS} WHERE ask.attempt_id IN (${ph})`).all(...chunk) as SkillRow[]) {
        if (!out.has(r.attempt_id)) out.set(r.attempt_id, []);
        out.get(r.attempt_id)!.push(r);
      }
    }
    for (const [k, v] of out) out.set(k, sortRows(v));
    return out;
  });
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
  skills: readonly string[] = ASSESSED_SKILLS,
): Record<string, SkillRow> {
  const bySkill = new Map<string, SkillRow>((rows ?? []).map((r) => [r.skill, r]));
  const out = {} as Record<string, SkillRow>;
  for (const skill of skills) {
    out[skill] = bySkill.get(skill) ?? {
      id: 0, attempt_id: attempt.id, skill, required: 1, scope_reason: null,
      planned_period_id: attempt.planned_period_id ?? null, plan_source: 'auto',
      sit_status: 'scheduled', sit_note: null,
      deadline_override: null, deadline_override_reason: null, absence_move_count: 0, absent_from_no_show: 0, huy_vang: 0,
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
  return rows.filter((r) => !r.required).map((r) => r.skill as AssessedSkill);   // FT: lớp thường không dùng phạm vi
}

// ---------------------------------------------------------------- tiến độ và hạn

export type SkillScheduleView = {
  skill: string;
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
  /** T3 (PR-MTa): huỷ vì vắng 2 lần — GVCN "Xin dời", Quản lý "Không mock lại". */
  huyVang: boolean;
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
  /** PR-MT (T34, M3): lượt MT lịch sử — không nợ, không hạn, không quá hạn. Chốt MỘT chỗ; mọi nơi đếm nợ đọc `progress` này. */
  lichSu?: boolean;
  /** PR-MT0: hạn chấm MT0 = thứ Tư tuần sau (PR-CT2). */
  mt0?: boolean;
}): SkillScheduleView {
  const { row, mode, scored } = input;
  const today = input.today ?? demoToday();
  const required = !!row.required;
  const weekStart = row.week_start ?? null;
  const lichSu = !!input.lichSu;

  const dl = required && !lichSu && !input.attemptCancelled && row.sit_status !== 'cancelled'
    ? effectiveSkillDeadline({
        mode, weekStart,
        skillOverride: row.deadline_override,
        attemptOverride: input.attemptOverride,
        mt0: input.mt0,
      })
    : { date: null, source: 'none' as const };

  let progress: SkillProgress;
  if (!required) progress = 'skipped';
  else if (input.attemptCancelled || row.sit_status === 'cancelled') progress = 'cancelled';
  else if (scored) progress = 'scored';
  else if (lichSu) progress = 'lich_su';
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
      required && !scored && quaHanNhapDiem(dl.date, weekStart, today)   // PR-UXF-a Q10: tuần thi chưa hết thì chưa quá hạn
      && progress !== 'absent' && progress !== 'cancelled' && !lichSu,
    scored,
    progress,
    absenceMoveCount: row.absence_move_count,
    /** Đề nghị dời do vắng đang chờ Quản lý trả lời, nếu có. */
    pendingMove: input.pendingMove ?? null,
    huyVang: !!row.huy_vang,
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
  blocking: string[];
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
  const a = conn.prepare('SELECT planned_period_id, kind, cycle_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (a?.kind === 'final') mt0TheoFinal(a.cycle_id, rows, actorUserId);
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

/**
 * PR-MT0 (chủ sản phẩm chốt Q2 = A): Cuối khoá của khoá lớp thường đổi tuần → MT0 cùng khoá đi theo tuần ĐẦU của Cuối khoá, khi MT0 còn
 * `planned`, chưa có điểm và chưa ai dời tay (mọi dòng kỹ năng `plan_source = 'auto'`). Một câu đọc; chỉ ghi khi phải dời.
 */
function mt0TheoFinal(cycleId: number, rows: readonly SkillRow[], actorUserId: number | null): void {
  const dau = rows.filter((r) => r.required && r.sit_status !== 'cancelled' && r.planned_period_id && r.week_start)
    .sort((x, y) => String(x.week_start).localeCompare(String(y.week_start)))[0];
  if (!dau) return;
  const conn = db();
  const m = conn.prepare(
    `SELECT a.id FROM assessment_attempts a
      WHERE a.cycle_id = ? AND a.kind = 'mt0' AND a.status = 'planned'
        AND NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.plan_source != 'auto')
        AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND COALESCE(k.planned_period_id, 0) != ?)
        AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))`,
  ).get(cycleId, dau.planned_period_id) as any;
  if (!m) return;
  const now = nowIso();
  conn.prepare('UPDATE attempt_skills SET planned_period_id = ?, updated_at = ? WHERE attempt_id = ?').run(dau.planned_period_id, now, m.id);
  conn.prepare('UPDATE assessment_attempts SET planned_period_id = ?, updated_at = ? WHERE id = ?').run(dau.planned_period_id, now, m.id);
  logSchedule(m.id, { action: 'week_set', field: 'planned_period', newValue: dau.period_code ?? null, reason: 'Theo tuần Final Test', actor: actorUserId });
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
 * Hai đợt cách nhau đúng một tuần thì CẢNH BÁO, không chặn: người có quyền xác nhận được. Hai đợt CÙNG một tuần thì
 * CHẶN cả hai chiều (T15, Q3 — chốt 23/09): trùng là một sự thật đối xứng, chặn một chiều thì cùng tình huống lúc
 * được lúc không tuỳ ô nào bấm trước.
 * R/L/W và Speaking của CÙNG một đợt không bao giờ bị gọi là "hai MT quá gần".
 */
function labelDot(n: number, kind: string): string {
  if (kind === 'mock') return `MT${n}`;
  if (kind === 'progress' || kind === 'final') return nhanBaiThuong(kind);
  return `đợt ${n}`;
}

/**
 * PHẦN SO VỚI ĐỢT LÂN CẬN của `checkSkillWeekMove`, tách riêng để kiểm được cả một đợt CHƯA TẠO (`xepMoi`, PR-Rc2
 * Task 4): gọi thẳng bằng `cycleId` + `attemptNo` dự kiến, không cần một `attemptId` đã có trong bảng.
 */
export function checkWeekVsNeighbours(input: {
  cycleId: number;
  attemptNo: number;
  excludeAttemptId: number | null;
  newWeekStart: string;
  /** PR-MT0: loại lượt đang dời — MT0 ở khoá lớp thường không là lân cận của Giữa / Cuối khoá (cùng tuần Final là đúng luật). */
  kind?: string | null;
}): ScheduleCheck {
  const conn = db();
  const blockers: string[] = [];
  const warnings: string[] = [];

  /* Lịch hợp nhất của các đợt khác trong CÙNG lộ trình, bỏ đợt đã huỷ. Đọc THEO TỪNG KỸ NĂNG (không GROUP BY) để câu chặn
   * nêu được kỹ năng nào của đợt lân cận đang ở tuần đó (PR-UX2, Q17) — gom min/max ngay trong JS. */
  const skillRows = conn
    .prepare(
      `SELECT a.id, a.attempt_no, a.kind, ask.skill, pr.week_start, cy.route
         FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.required = 1 AND ask.sit_status != 'cancelled'
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE a.cycle_id = ? AND a.id != ? AND a.status != 'cancelled'`,
    )
    .all(input.cycleId, input.excludeAttemptId ?? -1) as any[];
  const thuTuKn = (k: string) => (KY_NANG_KE_HOACH as readonly string[]).indexOf(k);
  const byAttempt = new Map<number, {
    attempt_no: number; kind: string; route: string | null; first_week: string; last_week: string; rows: Array<{ skill: string; week: string }>;
  }>();
  for (const r of skillRows) {
    if (!r.route && (r.kind === 'mt0') !== (input.kind === 'mt0')) continue;   // PR-MT0: khoá lớp thường — MT0 có luật tuần riêng
    const g = byAttempt.get(r.id);
    if (!g) byAttempt.set(r.id, { attempt_no: r.attempt_no, kind: r.kind, route: r.route ?? null, first_week: r.week_start, last_week: r.week_start, rows: [{ skill: r.skill, week: r.week_start }] });
    else {
      g.rows.push({ skill: r.skill, week: r.week_start });
      if (r.week_start < g.first_week) g.first_week = r.week_start;
      if (r.week_start > g.last_week) g.last_week = r.week_start;
    }
  }
  const knTai = (g: { rows: Array<{ skill: string; week: string }> }, week: string) => g.rows
    .filter((x) => x.week === week).map((x) => x.skill).sort((a, b) => thuTuKn(a) - thuTuKn(b))
    .map((k) => (CHU_KY_NANG as Record<string, string>)[k] ?? k).join(' ');
  const others = [...byAttempt.values()];

  /* Khoá lớp thường: Progress luôn trước Final theo LOẠI — attempt_no chỉ là thứ tự tạo (Final tự tạo khi vào lớp lúc mốc Progress
   * đã qua, Progress xếp tay sau → số lớn hơn). Cùng loại / lộ trình FT: theo attempt_no như cũ. */
  const soSanh = (o: { attempt_no: number; kind: string; route: string | null }) =>
    (!o.route ? soThuTuLuot(o, { kind: input.kind ?? '', attempt_no: input.attemptNo }) : o.attempt_no - input.attemptNo);
  for (const o of others) {
    if (soSanh(o) < 0) {
      if (input.newWeekStart < o.last_week) {
        blockers.push(
          `${labelDot(o.attempt_no, o.kind)} có phần thi ở tuần ${tuanLich(o.last_week)}. `
          + 'Phần thi của lượt sau không được xếp trước phần cuối của lượt trước.',
        );
      } else if (input.newWeekStart === o.last_week) {
        blockers.push(
          `Trùng tuần ${tuanLich(o.last_week)} với ${labelDot(o.attempt_no, o.kind)} (${knTai(o, o.last_week)}). `
          + 'Hai lượt không thi cùng một tuần.',
        );
      } else if (daysBetween(o.last_week, input.newWeekStart) === 7) {
        warnings.push(`Chỉ cách ${labelDot(o.attempt_no, o.kind)} đúng một tuần.`);
      }
    } else if (soSanh(o) > 0) {
      if (input.newWeekStart > o.first_week) {
        blockers.push(
          `${labelDot(o.attempt_no, o.kind)} đã có phần thi ở tuần ${tuanLich(o.first_week)}. `
          + 'Phần thi của lượt trước không được xếp vượt qua lượt kế tiếp.',
        );
      } else if (input.newWeekStart === o.first_week) {
        blockers.push(
          `Trùng tuần ${tuanLich(o.first_week)} với ${labelDot(o.attempt_no, o.kind)} (${knTai(o, o.first_week)}). `
          + 'Hai lượt không thi cùng một tuần.',
        );
      } else if (daysBetween(input.newWeekStart, o.first_week) === 7) {
        warnings.push(`Chỉ cách ${labelDot(o.attempt_no, o.kind)} đúng một tuần.`);
      }
    }
  }
  return { blockers, warnings };
}

export function checkSkillWeekMove(input: {
  attemptId: number;
  skill: string;
  newWeekStart: string;
}): ScheduleCheck {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(input.attemptId) as any;
  if (!a) return { blockers: ['Không tìm thấy lượt kiểm tra'], warnings: [] };
  return checkWeekVsNeighbours({
    cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: input.attemptId,
    newWeekStart: input.newWeekStart, kind: a.kind,
  });
}

// ---------------------------------------------------------------- PR-LM + PR-MTGON: dời vượt lượt sau → chặn

export type KiemVuot = { chan: string | null };

/**
 * Q-0310-1, D1 + PR-MTGON (luật 1): lượt `attemptId` sau khi dời có tuần cuối `tuanCuoiMoi` mà vượt (hoặc trùng tuần đầu của) một lượt SAU
 * → `chan` = câu "MT{n} thi … Chọn tuần trước …, hoặc dời MT{n} trước.". Chỉ lượt MT: Giữa khoá / Cuối khoá của lớp thường giữ luật chặn
 * cũ (`checkWeekVsNeighbours`). Không ghi.
 */
export function kiemVuot(attemptId: number, tuanCuoiMoi: string, tuanMoi: string = tuanCuoiMoi): KiemVuot {
  const conn = db();
  /* PR-MT0: MT0 muộn nhất tuần 2 FT và luôn trước MT1 — chặn TRƯỚC khi tới `luotBiVuot` (MT0 không bao giờ "vượt" MT1). */
  const mt0 = kiemTuanMt0Cho(attemptId, tuanMoi, tuanCuoiMoi);
  if (mt0) return { chan: mt0 };
  const a = conn.prepare('SELECT id, cycle_id, attempt_no, kind FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a || a.kind !== 'mock') return { chan: null };
  const rows = conn.prepare(
    `SELECT a.id, a.attempt_no, a.kind, a.status,
            (SELECT MIN(pr.week_start) FROM attempt_skills k JOIN report_periods pr ON pr.id = k.planned_period_id
              WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled') AS tuan_dau
       FROM assessment_attempts a
      WHERE a.cycle_id = ? AND a.attempt_no > ? AND a.status != 'cancelled'`,
  ).all(a.cycle_id, a.attempt_no) as any[];
  return kiemVuotTu(a, rows, tuanCuoiMoi);
}

/**
 * PR-MT0: tuần mới của lượt có hợp luật MT0 không. MT0: tuần muộn nhất (`tuanCuoiMoi`) ≤ thứ Hai tuần 2 FT (chưa có lộ trình FT: tuần
 * Cuối khoá + 14 ngày) và trước MT1. MT1 của lộ trình có MT0: tuần mới (`tuanMoi`, sớm nhất vừa đặt) phải sau tuần muộn nhất của MT0.
 * Lượt khác → null (không đọc thêm gì ngoài một câu).
 */
export function kiemTuanMt0Cho(attemptId: number, tuanMoi: string, tuanCuoiMoi: string = tuanMoi): string | null {
  const conn = db();
  const a = conn.prepare(
    `SELECT a.kind, a.attempt_no, a.cycle_id, a.class_id, cy.route, sp.week_start AS bat_dau
       FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id LEFT JOIN report_periods sp ON sp.id = cy.start_period_id
      WHERE a.id = ?`,
  ).get(attemptId) as any;
  if (!a || !(a.kind === 'mt0' || (a.kind === 'mock' && a.attempt_no === 1))) return null;
  const tuanLuot = (kind: string, no: number, ham: 'MIN' | 'MAX') => (conn.prepare(
    `SELECT ${ham}(pr.week_start) AS w FROM assessment_attempts x JOIN attempt_skills k ON k.attempt_id = x.id AND k.required = 1 AND k.sit_status != 'cancelled'
       JOIN report_periods pr ON pr.id = k.planned_period_id
      WHERE x.cycle_id = ? AND x.kind = ? AND x.attempt_no = ? AND x.status != 'cancelled'`,
  ).get(a.cycle_id, kind, no) as any)?.w ?? null;
  if (a.kind === 'mt0') {
    const tuanMuonNhat = tuanMuonNhatMt0({
      tuanBatDauFt: a.route ? a.bat_dau ?? null : null,
      tuanCuoiKhoa: a.route || !a.class_id ? null : classProgress(a.class_id).finalWeekStart,
    });
    /* Sớm nhất = tuần Cuối khoá của em (khoá lớp thường; lượt Final của em, chưa có thì tuần Final của lớp). Đã nối FT: không cần. */
    const tuanSomNhat = a.route ? null : (conn.prepare(
      `SELECT MIN(pr.week_start) AS w FROM assessment_attempts x JOIN attempt_skills k ON k.attempt_id = x.id AND k.required = 1 AND k.sit_status != 'cancelled'
         JOIN report_periods pr ON pr.id = k.planned_period_id WHERE x.cycle_id = ? AND x.kind = 'final' AND x.status != 'cancelled'`,
    ).get(a.cycle_id) as any)?.w ?? (a.class_id ? classProgress(a.class_id).finalWeekStart : null);
    return kiemTuanMt0({ tuanMoi: tuanCuoiMoi, tuanDau: tuanMoi, tuanSomNhat, tuanMuonNhat, tuanMt1: a.route ? tuanLuot('mock', 1, 'MIN') : null });
  }
  const tuanMt0 = tuanLuot('mt0', 0, 'MAX');
  return tuanMt0 ? kiemTuanMt0({ tuanMoi: tuanMt0, tuanMuonNhat: null, tuanMt1: tuanMoi }) : null;
}

/** Một lượt SAU cùng lộ trình, đã đọc sẵn (xếp hàng loạt đọc theo lô — `docFtTheoLo`, không N+1). */
export type LuotSauDoc = { id: number; attempt_no: number; kind: string; status: string; tuan_dau: string | null };

/**
 * Lõi thuần của `kiemVuot` trên dữ liệu đã đọc. PR-MTGON (luật 1, chủ sản phẩm 08/10): vượt qua lượt sau (kể cả trùng tuần đầu của nó)
 * là KHÔNG HỢP LỆ — chặn và nói lượt nào đứng ở đâu; không còn tự bỏ lịch / huỷ kết quả lượt bị vượt.
 */
export function kiemVuotTu(a: { attempt_no: number; kind: string }, rows: readonly LuotSauDoc[], tuanCuoiMoi: string): KiemVuot {
  if (a.kind !== 'mock') return { chan: null };
  const ds: LuotLanCan[] = rows.filter((r) => r.attempt_no > a.attempt_no && r.status !== 'cancelled').map((r) => ({
    attemptId: r.id, attemptNo: r.attempt_no, kind: r.kind, tuanDau: r.tuan_dau ?? null, coDiem: false, daThi: false, huy: false,
  }));
  const x = luotBiVuot(ds, { attemptNo: a.attempt_no, tuanCuoiMoi }).biVuot[0];
  if (!x) return { chan: null };
  const nhan = nhanDot(x.kind, x.attemptNo), tw = tuanLich(x.tuanDau);
  return { chan: `${nhan} thi ${tw}. Chọn tuần trước ${tw}, hoặc dời ${nhan} trước.` };
}

/** Tuần MUỘN NHẤT của lượt sau khi đặt `tuanMoi` cho các kỹ năng `doi` (kể cả kỹ năng đang huỷ / bỏ sắp được đưa lại — PR-MTGON)
 *  — các kỹ năng bắt buộc khác giữ tuần đang có. */
export function tuanCuoiSauKhiDoi(rows: readonly SkillRow[], doi: ReadonlyMap<string, string>): string | null {
  const tuan = rows
    .filter((r) => doi.has(r.skill) || (r.required && r.sit_status !== 'cancelled'))
    .map((r) => doi.get(r.skill) ?? r.week_start)
    .filter((w): w is string => !!w)
    .map((w) => w.slice(0, 10));
  return tuan.length ? tuan.sort()[tuan.length - 1] : null;
}

/**
 * HUỶ LỊCH một lượt (Q-0310-1) = BỎ TUẦN, GIỮ LƯỢT: lượt còn nguyên số và trạng thái `planned`, mọi kỹ năng bắt buộc đang chờ thi về
 * "Chưa xếp lịch" (`planned_period_id = NULL`, `plan_source = 'manual'` để "Áp lịch" không tự xếp lại). Không đóng Case / việc.
 * Lượt đã có điểm / đã thi → chặn (không bao giờ bỏ lịch phần đã thi). Lý do tuỳ chọn (T7) — trống thì nhật ký ghi "Huỷ lịch".
 */
export function boTuanLuot(p: Principal, attemptId: number, o: { lyDo?: string | null }): { daBo: string[] } {
  const conn = db();
  const a = conn.prepare(`SELECT a.*, ${CO_DIEM_SQL('a')} AS co_diem FROM assessment_attempts a WHERE a.id = ?`).get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt kiểm tra');
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id, studentId: a.student_id }, 'Chỉ Quản lý mới huỷ lịch được một lượt.');
  const nhan = nhanDot(a.kind, a.attempt_no);
  if (a.status === 'cancelled') throw badRequest(`${nhan} đã huỷ.`);
  const rows = ensureSkillRows(attemptId);
  if (a.co_diem) throw badRequest(`${nhan} đã có điểm — không huỷ lịch được.`);
  if (rows.some((r) => r.required && r.sit_status === 'sat')) throw badRequest(`${nhan} đã thi — không huỷ lịch được.`);
  const cho = conn.prepare(`SELECT 1 FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending' LIMIT 1`).get(attemptId);
  if (cho) throw badRequest(`${nhan} đang có đề nghị dời chờ duyệt — duyệt hoặc từ chối trước.`);
  const bo = rows.filter((r) => r.required && r.sit_status === 'scheduled' && r.planned_period_id);
  if (!bo.length) throw badRequest(`${nhan} chưa xếp lịch — không có gì để huỷ.`);
  const lyDo = o.lyDo?.trim() || 'Huỷ lịch';

  return tx(() => {
    const now = nowIso();
    for (const r of bo) {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL, plan_source = 'manual', updated_at = ? WHERE id = ?`).run(now, r.id);
      logSchedule(attemptId, { action: 'skill_unscheduled', field: r.skill, oldValue: r.period_code, newValue: null, reason: lyDo, actor: p.userId });
    }
    recomputeCompletionWeek(attemptId, p.userId);
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'manual', updated_at = ? WHERE id = ?`).run(now, attemptId);
    writeAudit({
      actorUserId: p.userId, action: 'attempt.unschedule', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: nhan,
      before: { tuan: bo.map((r) => `${r.skill}:${r.period_code}`) }, after: { lyDo },
    });
    return { daBo: bo.map((r) => r.skill) };
  });
}

/**
 * NGÀY TẠO của lượt theo lịch nghiệp vụ. `created_at` là giờ máy thật; ở demo đồng hồ nghiệp vụ có thể lùi hơn giờ thật, nên lấy
 * ngày sớm hơn trong hai — bản chính `created_at` luôn ≤ hôm nay nên kết quả đúng bằng `created_at`.
 */
export function ngayTaoLuot(createdAt: string, homNay: string = demoToday()): string {
  const d = createdAt.slice(0, 10); const h = homNay.slice(0, 10);
  return d < h ? d : h;
}

/**
 * T1 (PR-MTa, thay `tinhLaiLichSu`): tính lại cờ "MT cũ" (`lich_su`) của lượt Mock sau khi xếp / dời — tuần thi muộn nhất (kỹ năng bắt
 * buộc chưa huỷ) cách tuần của `homNay` ≥ 2 tuần (`laMtCu`). So với NGÀY XẾP, không với `created_at`. Chưa có tuần nào → giữ cờ cũ.
 */
export function tinhLaiMtCu(attemptId: number, homNay: string): void {
  const conn = db();
  const r = conn.prepare(
    `SELECT (SELECT MAX(p.week_end) FROM attempt_skills ask JOIN report_periods p ON p.id = ask.planned_period_id
              WHERE ask.attempt_id = a.id AND ask.required = 1 AND ask.sit_status != 'cancelled') AS kt
       FROM assessment_attempts a WHERE a.id = ? AND a.kind = 'mock'`).get(attemptId) as any;
  if (!r?.kt) return;
  conn.prepare('UPDATE assessment_attempts SET lich_su = ? WHERE id = ?').run(laMtCu(r.kt, homNay) ? 1 : 0, attemptId);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

// ---------------------------------------------------------------- thao tác

function loadOne(attemptId: number, skill: string): { attempt: any; row: SkillRow } {
  if (!boMonCuaLuot(db(), attemptId).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  const attempt = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!attempt) throw notFound('Không tìm thấy lượt kiểm tra');
  const rows = ensureSkillRows(attemptId);
  const row = rows.find((r) => r.skill === skill)!;
  return { attempt, row };
}

/** Đã có ít nhất một ô điểm của kỹ năng đánh giá này. */
/*
 * (23/09) Lớp thường lưu điểm ở `raw_score`, không có `band` — chỉ nhìn `band` để trước đây một môn lớp thường
 * đã có điểm vẫn dời được như một lịch tương lai. `writing` của FT vẫn xét qua `writing1`/`writing2`.
 */
function hasScore(attemptId: number, skill: string): boolean {
  /* FT tách 'writing' thành writing1/writing2; lớp thường ghi thẳng 'writing' — kiểm cả ba, không cần biết
   * trước chế độ chấm của đợt. */
  const entry = skill === 'writing' ? ['writing', 'writing1', 'writing2'] : [skill];
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS n FROM assessment_scores
        WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL) AND skill IN (${entry.map(() => '?').join(',')})`,
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
 * Phần ĐÃ THI hoặc ĐÃ CÓ ĐIỂM: GV không dời (mục 10.4). Quản lý / Quản trị dời được sang tuần bất kỳ, kể cả tuần cũ hơn —
 * điểm đi theo kỹ năng, không đổi (PR-MTa T20); cờ MT cũ tính lại.
 */
export function setSkillWeek(p: Principal, attemptId: number, skill: string, periodId: number, opts: {
  reason?: string | null;
  force?: boolean;
  /** Đặt tuần cho kỹ năng của lượt VỪA TẠO trong cùng lần xếp — không phải "dời", không đòi lý do (K4-15). */
  khiTao?: boolean;
  /** Dấu "-" lớp thường ghi bù (C08 Q4): ghi lại việc em vắng các tuần ĐÃ QUA — không phải quyết định dời, không chặn tuần đã qua. */
  ghiBuDau?: boolean;
  /** T11 (PR-MTa): xếp hàng loạt lớp thường tự báo GVCN một chuông cả lớp — không báo từng em. */
  khongBaoGvcn?: boolean;
  today?: string;
} = {}) {
  const { attempt, row } = loadOne(attemptId, skill);
  requireMoveSkillSchedule(
    p, { classId: attempt.class_id, studentId: attempt.student_id, skill: row.skill },
    'Bạn không có quyền đổi lịch thi của kỹ năng này.',
  );
  if (attempt.status === 'cancelled') throw badRequest('Đợt này đã huỷ. Mở lại trước khi đổi lịch.');
  if (!row.required) throw badRequest(`Kỹ năng ${tenMon(null, skill)} không nằm trong phạm vi yêu cầu của đợt này.`);

  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');
  if (periodId === row.planned_period_id) throw badRequest('Tuần mới trùng tuần hiện tại.');

  /*
   * D3 (PR-LM): MT CŨ đổi tuần được — kể cả kỹ năng đã có điểm — như SỬA HỒ SƠ: nhật ký, điểm giữ nguyên (T7: lý do tuỳ chọn).
   * T1/T4 (PR-MTa): tuần đích đã qua — Quản lý / Quản trị (PLAN_WEEK) xếp được mọi lượt (Mock và Test lớp thường), không chặn theo ngày
   * em vào web; GVCN / GV chỉ từ tuần này. Sau khi lưu, lượt Mock tính lại cờ MT cũ theo tuần muộn nhất (`tinhLaiMtCu`).
   */
  const lichSu = !!attempt.lich_su && !opts.khiTao && !opts.ghiBuDau;
  const homNay = opts.today ?? demoToday();
  const quanLy = can(p, PERMISSIONS.PLAN_WEEK, { classId: attempt.class_id, studentId: attempt.student_id });
  if (!opts.khiTao && !opts.ghiBuDau) {
    const cau = kiemTuanXep({ ketThuc: [period.week_end], homNay, quanLy }).cau;
    if (cau) throw badRequest(cau);
  }
  if (!lichSu && !quanLy) {
    if (hasScore(attemptId, row.skill)) {
      throw badRequest(
        `${skill} đã có điểm ở đợt này. Phần đã thi giữ nguyên lịch thật; `
        + 'muốn sửa lịch sử thì dùng hiệu chỉnh có lý do, không dời như một lịch tương lai.',
      );
    }
    if (row.sit_status === 'sat') {
      throw badRequest(`${skill} đã được xác nhận là đã thi. Việc còn lại là chấm, không phải dời lịch.`);
    }
  }

  /* PR-MTGON (luật 1): dời vượt lượt sau → chặn, không đổi gì (không còn bỏ lịch / huỷ kết quả lượt bị vượt). */
  const vuot = opts.khiTao ? null
    : kiemVuot(attemptId, tuanCuoiSauKhiDoi(ensureSkillRows(attemptId), new Map([[row.skill, period.week_start]]))!, period.week_start).chan;
  if (vuot) throw badRequest(vuot);

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

  /* PR-MTGON (MTG-4c): kỹ năng đã huỷ không đổi tuần lặng lẽ — "Đưa lại vào đợt" (`setSkillScope`) trước. */
  if (row.sit_status === 'cancelled') throw badRequest(`${tenMon(null, skill)} đã huỷ — "Đưa lại vào đợt" trước rồi mới đặt tuần.`);

  return tx(() => {
    const conn = db();
    const oldCode = row.period_code;
    /*
     * K4-12 (PR-MT, Q10): Quản lý đổi tuần một kỹ năng ĐANG VẮNG = MỘT LẦN DỜI DO VẮNG — bộ đếm +1, để lần vắng sau thành lần 2
     * (chờ duyệt). Không thành đề nghị: Quản lý chính là người duyệt. Kỹ năng chưa vắng thì vẫn là dời CHỦ ĐỘNG (sắp lại lịch học,
     * tách R/L/W với Speaking) — không tiêu lượt nào.
     */
    const vang = row.sit_status === 'absent';
    conn
      .prepare(
        `UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual',
                sit_status = CASE WHEN sit_status = 'absent' THEN 'scheduled' ELSE sit_status END,
                absent_from_no_show = 0, absence_move_count = absence_move_count + ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(periodId, vang ? 1 : 0, nowIso(), row.id);
    logSchedule(attemptId, {
      action: vang ? 'skill_week_moved_absence' : 'skill_week_set',
      field: skill, oldValue: oldCode, newValue: period.code,
      reason: opts.reason ?? (vang ? 'Quản lý xếp trực tiếp' : null), actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    tinhLaiMtCu(attemptId, homNay);
    if (!opts.khiTao && !opts.ghiBuDau && !opts.khongBaoGvcn && scoringModeOf(attempt) === 'ratio') {
      baoGvcnDoiLichThuong(p, attempt, period.week_start, homNay);
    }
    writeAudit({
      actorUserId: p.userId, action: vang ? 'attempt.absence_move' : 'attempt.skill_week', entityType: 'assessment_attempt',
      entityId: attemptId, entityLabel: `${attempt.kind === 'mock' ? `MT${attempt.attempt_no}` : attempt.kind} · ${skill}`,
      before: { week: oldCode }, after: { week: period.code },
    });
    return { ok: true, warnings: check.warnings, completionWeek: cw };
  });
}

/**
 * T19 (PR-MTa, chủ sản phẩm 06/10): KHÔNG AI (kể cả Quản lý, Quản trị) nhập điểm khi kỹ năng / môn chưa tới tuần thi hoặc chưa xếp tuần.
 * Một chốt cho `saveScore` (Mock) và `saveRegularScore` (lớp thường); xoá điểm, dấu "-", nhận xét không qua đây. MT cũ (tuần đã qua) và
 * bài quá hạn vẫn nhập được (tính trễ như cũ).
 */
export function kiemDaToiTuanThi(row: { week_start: string | null }, today: string): void {
  if (!row.week_start) throw badRequest('Chưa xếp tuần thi — chưa nhập điểm được.');
  if (row.week_start.slice(0, 10) > mondayOf(today)) throw badRequest(`Chưa tới tuần thi ${tuanLich(row.week_start, today)} — chưa nhập điểm được.`);
}

/** GVCN đang hoạt động của một lớp. */
export const gvcnCua = (classId: number | null): number[] => (db()
  .prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`)
  .all(classId ?? -1) as any[]).map((r) => r.user_id as number);

/**
 * T11 (PR-MTa, G16): người KHÁC GVCN dời Test lớp thường → MỘT chuông "để biết" cho GVCN, một em một ngày (nhiều môn gộp nhờ dedupKey).
 * GVCN tự dời → không chuông. Không thẻ, không Case. Chuông mở thẳng bảng điểm lớp thường của đúng bài.
 */
export function baoGvcnDoiLichThuong(p: Principal, a: { id: number; class_id: number | null; student_id: number; kind: string; attempt_no: number },
  tuanMoi: string, homNay: string = demoToday()): void {
  const gv = gvcnCua(a.class_id);
  if (gv.includes(p.userId)) return;
  const conn = db();
  const em = (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(a.student_id) as any)?.full_name ?? 'Học viên';
  const ai = (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(p.userId) as any)?.full_name ?? 'Quản lý';
  for (const userId of gv) {
    notify({
      userId, kind: 'doi_lich_thuong', title: `${nhanDot(a.kind, a.attempt_no)} · ${em} · dời sang ${tuanLich(tuanMoi, homNay)}`,
      body: `${ai} đổi lịch.`, entityType: 'assessment_attempt', entityId: a.id, dedupKey: `doi-thuong:${a.id}:${homNay}`,
      duong: duongDotTest({ id: a.id, kind: a.kind, classId: a.class_id }),
    });
  }
}

/** T11: bản cả lớp cho xếp hàng loạt lớp thường — `soEm` em đổi lịch → một chuông mỗi GVCN. */
export function baoGvcnDoiLichThuongLop(p: Principal, classId: number, kind: string, soEm: number, homNay: string = demoToday()): void {
  const gv = gvcnCua(classId);
  if (!soEm || gv.includes(p.userId)) return;
  for (const userId of gv) {
    notify({
      userId, kind: 'doi_lich_thuong', title: `${nhanDot(kind, null)} · ${soEm} em · đổi lịch`, entityType: 'class', entityId: classId,
      dedupKey: `doi-thuong-lop:${classId}:${homNay}`, duong: duongDotTest({ id: 0, kind, classId }),
    });
  }
}

/**
 * PHẠM VI YÊU CẦU của một kỹ năng trong đợt (mục 10.1) — "Huỷ kỹ năng" / "Đưa lại vào đợt" của Quản lý (`ATTEMPT_SKIP_SKILL`).
 *
 * PR-MTGON (luật 3, chủ sản phẩm 08/10): Quản lý huỷ kỹ năng LÚC NÀO CŨNG ĐƯỢC — kể cả MT cũ, đã tới tuần thi, đang vắng. Còn chặn:
 *
 *   1. Lớp thường không có thao tác miễn môn — Giữa khoá / Cuối khoá luôn phải đủ bốn môn.
 *   2. Kỹ năng đã có điểm → 409: web hỏi "Xoá điểm và huỷ kỹ năng?" rồi gửi `xoaDiem` (`setSkillSkip` xoá điểm trước, cùng tx).
 *
 * "Đưa lại vào đợt": kỹ năng không yêu cầu HOẶC đã huỷ phần thi (dữ liệu cũ, hệ thống huỷ) → bắt buộc, chờ thi. Tuần cũ còn hợp lệ
 * thì giữ; vướng thứ tự đợt (trùng / vượt lượt khác) thì về "Chưa xếp" — không chặn.
 */
export function setSkillScope(
  p: Principal, attemptId: number, skill: string, required: boolean, reason?: string | null,
  /** `khiTao`, `khongMockLai`: nơi gọi cũ — không còn chặn gì riêng. */
  _opts: { khiTao?: boolean; khongMockLai?: boolean; today?: string } = {},
) {
  const { attempt, row } = loadOne(attemptId, skill);
  require_(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: attempt.class_id, studentId: attempt.student_id },
    'Chỉ Quản lý mới đổi được phạm vi kỹ năng của một đợt.');
  const duaLaiHuy = required && row.sit_status === 'cancelled';
  if (!!row.required === required && !duaLaiHuy) return { ok: true, unchanged: true };

  if (!required) {
    if (scoringModeOf(attempt) === 'ratio') {
      throw badRequest(
        'Lớp thường luôn phải đủ bốn môn L/R/W/S. Không có thao tác miễn môn để hoàn tất Progress Test / Final Test.',
      );
    }
    if (hasScore(attemptId, row.skill)) throw new HttpError(409, 'Kỹ năng đã có điểm — Xoá điểm và huỷ kỹ năng?');
  }
  /* Đưa lại: tuần đang giữ vướng thứ tự đợt → Chưa xếp (kiểm như dời một kỹ năng). */
  const boTuan = required && !!row.week_start && (
    !!kiemVuot(attemptId, tuanCuoiSauKhiDoi(ensureSkillRows(attemptId), new Map([[row.skill, row.week_start]]))!, row.week_start).chan
    || checkSkillWeekMove({ attemptId, skill: row.skill, newWeekStart: row.week_start }).blockers.length > 0);

  return tx(() => {
    db()
      .prepare(
        `UPDATE attempt_skills SET required = ?, scope_reason = ?, scope_by = ?, scope_at = ?, updated_at = ?,
                sit_status = CASE WHEN ? = 1 AND sit_status = 'cancelled' THEN 'scheduled' ELSE sit_status END,
                huy_vang = CASE WHEN ? = 1 THEN 0 ELSE huy_vang END,
                planned_period_id = CASE WHEN ? = 1 THEN NULL ELSE planned_period_id END
          WHERE id = ?`,
      )
      .run(required ? 1 : 0, required ? null : reason?.trim() || null,
           p.userId, nowIso(), nowIso(), required ? 1 : 0, required ? 1 : 0, boTuan ? 1 : 0, row.id);
    /* Giữ bảng cũ đồng bộ để dữ liệu và nhật ký đã trỏ vào nó không nói ngược lại. */
    if (required) {
      db().prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ? AND skill = ?').run(attemptId, skill);
    } else {
      db()
        .prepare('INSERT OR IGNORE INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) VALUES (?,?,?,?,?)')
        .run(attemptId, skill, reason ?? null, p.userId, nowIso());
    }
    /* Đề nghị dời đang chờ hết nghĩa cả hai chiều — đưa lại mà không rút thì hết hạn quét huỷ lại kỹ năng vừa đưa lại. */
    rutDeNghiDoi(attemptId, row.skill);
    logSchedule(attemptId, {
      action: required ? 'skill_restored' : 'skill_skipped', field: skill,
      oldValue: row.required ? (row.sit_status === 'cancelled' ? 'cancelled' : 'required') : 'skipped',
      newValue: required ? (boTuan ? 'required:chua-xep' : 'required') : 'skipped',
      reason: reason ?? null, actor: p.userId,
    });
    const cw = recomputeCompletionWeek(attemptId, p.userId);
    writeAudit({
      actorUserId: p.userId, action: required ? 'attempt.restore_skill' : 'attempt.skip_skill',
      entityType: 'assessment_attempt', entityId: attemptId, entityLabel: `${attemptId} · ${skill}`,
      before: { required: !!row.required, sitStatus: row.sit_status }, after: { required, reason: reason ?? null, boTuan },
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
  if (!row.required) throw badRequest(`Kỹ năng ${tenMon(null, skill)} không nằm trong phạm vi yêu cầu của đợt này.`);
  if (status === 'absent' && hasScore(attemptId, row.skill)) {
    throw badRequest(`${skill} đã có điểm ở đợt này, không thể xác nhận là vắng.`);
  }
  if (status !== 'scheduled' && !row.planned_period_id) {
    throw badRequest(`${skill} chưa có tuần thi, chưa xác nhận được em đã thi hay vắng.`);
  }
  if (row.sit_status === status) return { ok: true, unchanged: true };

  return tx(() => {
    db()
      .prepare('UPDATE attempt_skills SET sit_status = ?, sit_by = ?, sit_at = ?, sit_note = ?, absent_from_no_show = 0, updated_at = ? WHERE id = ?')
      .run(status, p.userId, nowIso(), note ?? null, nowIso(), row.id);
    if (row.sit_status === 'absent') rutDeNghiDoi(attemptId, row.skill);
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
