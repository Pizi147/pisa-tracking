import { db, tx } from '../db.ts';
import {
  ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, duongDotTest, C10_NHAP_DAU_TRU_TUAN_QUA_KHU, ENTRY_SKILLS, ENTRY_SKILL_LABEL, MOCK_FT_STUDY_WEEK, NO_SHOW_OVERRIDDEN_NOTE,
  BAI_CO_NHAN_XET, PERMISSIONS, awaitingScore, cachHuyLuot, kiemBand, kiemLyDoThaoTac, kiemNhanXet, kiemSoMtMoi, laMtCu, ngay, noShowStateOf, noShowText, pendingSkillsOf, soMtKeTiep, tenGvCham, tenMon, tuanLich,
  type CachHuy,
  type AssessedSkill, type EntrySkill, type NoShowState, type PendingCell, type SkillProgress, type WorkScope,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { dotHoanTat, dotHoanTatMany, quyenSuaSauHoanTat } from './hoanTat.ts';
import {
  can, classScopeSql, defaultWorkScope, editableSkills, isCoreTeacherOf, moveableSkills, mySkills, require_, requireXemLuotCham, scopeFor, scoreEditPath, type LuotQuyen,
  type Principal,
} from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import {
  ScoreError, assessedSkillOf, bandFromCriteria, bandFromRaw, entrySkillsOf, evaluateAttempt,
  failingEntrySkills, isCriteriaSkill, isRawSkill, type AttemptResult,
} from './scoring.ts';
import { mondayOf, quaHanNhapDiem, weekInfo } from '../platform/week.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import {
  completionWeekOf, ensureSkillRows, kiemDaToiTuanThi, kiemVuot, kiemXacNhanVuot, tuanCuoiSauKhiDoi, loadSkillRows, logSchedule, recomputeCompletionWeek, scoringModeOf,
  setSkillScope, setSkillWeek, skillScheduleOf, skippedSkillsOf, viewSkill,
  type SkillRow, type SkillScheduleView,
} from './skillSchedule.ts';
import { canRequest as canRequestAbsence, flagLateNoShow, pendingMove, rutDeNghiDoi, settleNoShows } from './absence.ts';
import { raiseSignalsForResult, stepsFor } from '../cases/sos.ts';
import { reconcileCorrectedSignals } from '../cases/signals.ts';
import { currentCycle, cycleById, examPlanOf, luotSoCuaLoTrinh } from './cycles.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { ketQuaHuyCua } from './ketQuaHuy.ts';
import { chuanHoaNguoiThucHien } from '../cases/nguoiThucHien.ts';
import { allProgrammes, evaluateRegular, isRatioClass, regularDeadline } from '../normal/regular.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

export type ScoreRow = {
  id: number; skill: EntrySkill;
  raw_score: number | null; raw_total: number | null;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null;
  band: number | null; result_date: string | null; note: string | null;
  entered_by: number | null; entered_at: string | null;
  entered_by_name?: string | null;
  /** Dấu '-' "không có bài" (PR-G) — tuần lịch lúc báo, người báo, lúc báo, báo muộn (C10), đã chốt chưa. */
  no_show_period_id?: number | null; no_show_by?: number | null; no_show_at?: string | null;
  no_show_late?: number | null; no_show_settled_at?: string | null; no_show_cu?: number | null;
  /** PR-HSM (T39): nhận xét của bài nhập (W1/W2/S) + GV chấm Speaking (tài khoản hoặc tên ngoài; tên tài khoản join sẵn). */
  comment?: string | null; examiner_user_id?: number | null; examiner_name?: string | null; examiner_user_name?: string | null;
  /** PR-Pb2-b (Q13): ngày nghiệp vụ lần đầu ô có điểm. */
  nhap_dau_ngay?: string | null;
};

/** PR-TD: nhớ trong request GET theo attemptId — hồ sơ HV gọi lặp cho mỗi lượt của em (`profile.ts`, `students.ts`). */
export function scoresOf(attemptId: number): ScoreRow[] {
  return nho(`diem:${attemptId}`, () => db()
    .prepare(
      `SELECT s.*, u.full_name AS entered_by_name, g.full_name AS examiner_user_name FROM assessment_scores s
         LEFT JOIN users u ON u.id = s.entered_by LEFT JOIN users g ON g.id = s.examiner_user_id WHERE s.attempt_id = ?`,
    )
    .all(attemptId) as ScoreRow[]);
}

/**
 * Kỹ năng ĐÁNH GIÁ nằm NGOÀI phạm vi yêu cầu của lượt này. Không có dòng nào = phải đủ bốn.
 *
 * Từ vòng 7 phạm vi thuộc về bảng lịch từng kỹ năng, không còn là một bảng ngoại lệ riêng.
 * Bảng cũ vẫn được giữ đồng bộ để nhật ký và dữ liệu chưa di trú đọc ra cùng một kết luận.
 */
export function skipsOf(attemptId: number): AssessedSkill[] {
  return nho(`bo-mon:${attemptId}`, () => {
    const rows = db().prepare('SELECT skill, required FROM attempt_skills WHERE attempt_id = ?').all(attemptId) as any[];
    if (rows.length) return rows.filter((r) => !r.required).map((r) => r.skill as AssessedSkill);
    return (db().prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(attemptId) as any[])
      .map((r) => r.skill as AssessedSkill)
      .filter((s) => (ASSESSED_SKILLS as readonly string[]).includes(s));
  });
}

/**
 * Nạp điểm, kỹ năng không mock và Case của NHIỀU lượt bằng ba truy vấn.
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
  // SQLite giới hạn số tham số của một câu lệnh (999 ở bản cũ), nên chia lô thay vì nối một danh sách dài. PR-MT: 400 → 900 —
  // mỗi em FT nay có sẵn 3 MT từ ngày đầu (M1), lô 400 làm danh sách chi nhánh tách thêm lô sớm.
  for (let i = 0; i < attemptIds.length; i += 900) {
    const chunk = attemptIds.slice(i, i + 900);
    const ph = chunk.map(() => '?').join(',');
    for (const r of conn
      .prepare(
        `SELECT s.*, u.full_name AS entered_by_name, g.full_name AS examiner_user_name FROM assessment_scores s
           LEFT JOIN users u ON u.id = s.entered_by LEFT JOIN users g ON g.id = s.examiner_user_id WHERE s.attempt_id IN (${ph})`,
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

/**
 * LỘ TRÌNH CỦA LƯỢT (K5-49) — `learning_cycles.route` theo `cycle_id`, không phải lộ trình hiện tại của em. Hàng đã JOIN `cy.route` thì
 * dùng luôn; không thì một câu, nhớ theo `cycle_id` trong request. Danh sách phải JOIN sẵn — không hỏi theo từng dòng.
 */
/** Quyền theo lượt (MT lịch sử): cờ + các ô đã có điểm của CHÍNH lượt — đọc từ điểm đã nạp sẵn, không hỏi lại. */
function luotQuyen(a: any, today?: string): LuotQuyen {
  return { lich_su: a.lich_su ?? 0, today };
}

export function routeCuaLuot(attempt: any): string | null {
  if ('route' in attempt) return attempt.route ?? null;
  if (!attempt.cycle_id) return null;
  return nho(`lo-trinh:${attempt.cycle_id}`, () =>
    (db().prepare('SELECT route FROM learning_cycles WHERE id = ?').get(attempt.cycle_id) as any)?.route ?? null);
}

export function resultOf(attempt: any, rows?: ScoreRow[], skips?: AssessedSkill[]): AttemptResult {
  const scores = rows ?? scoresOf(attempt.id);
  return evaluateAttempt(
    attempt.target_at_attempt,
    attempt.attempt_no,
    entryBandsOf(scores),
    skips ?? skipsOf(attempt.id),
    routeCuaLuot(attempt),
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
  /** PR-XLMT (rà #126): ô này là VIỆC nhập điểm của người xem (khác quyền sửa `canEdit`). */
  viec: boolean;
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
  /** R11: đợt đã hoàn tất nên ô bị khoá với người không có `PLAN_WEEK`/`SCORE_OVERRIDE` — khác lý do khoá khác (huỷ, ngoài phạm vi…). */
  khoa: boolean;
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
    /** Câu hiển thị: "Không có bài · Có thể sửa đến hết Chủ nhật 20/09", "Không dự thi · Tuần W3 SEP" (năm chỉ hiện khi khác năm), … */
    text: string;
    effectiveOn: string | null;
    editableUntil: string | null;
  } | null;
  /** S13: một dòng giải thích khi Quản lý đã đổi kết luận "không dự thi" của chính tuần này. `null` là bình thường. */
  noShowNote: string | null;
  /** PR-HSM (YC-13.5): nhận xét của bài nhập này — chỉ W1/W2/S, không bắt buộc. */
  nhanXet: string | null;
  /** PR-HSM (T39): GV chấm Speaking — tài khoản (`userId`) hoặc người ngoài (`userId: null`). Chỉ ô `speaking`. */
  gvCham: { userId: number | null; ten: string } | null;
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
  /** R11: truyền từ nơi gọi (`dotHoanTatMany` cho cả bảng) — không tự hỏi lại lẻ từng dòng ở đây. */
  hoanTat: { hoanTat: boolean; chuNhatCuoi: string | null } = { hoanTat: false, chuNhatCuoi: null },
): SkillCell[] {
  const editable = attempt.class_id ? editableSkills(p, attempt.class_id, ENTRY_SKILLS, luotQuyen(attempt, today)) : [];
  /* PR-XLMT (rà #126): "việc nhập điểm" không tính vế Quản lý sửa mọi lúc. */
  const viecList = attempt.class_id ? editableSkills(p, attempt.class_id, ENTRY_SKILLS, luotQuyen(attempt, today), true) : [];
  const mine = attempt.class_id ? mySkills(p, attempt.class_id, ENTRY_SKILLS) : [];
  const mode = scoringModeOf(attempt);
  const schedule = skillScheduleOf(attempt, skillRows);
  const cancelled = attempt.status === 'cancelled';
  const suaSauHoanTat = hoanTat.hoanTat && attempt.class_id ? quyenSuaSauHoanTat(p, attempt.class_id, !!attempt.lich_su) : false;

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
      lichSu: !!attempt.lich_su,
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
    if (row?.no_show_cu && ns.state !== 'none') {
      /* T23: "-" của MT cũ đã chốt cuối lúc ghi — luôn là "Không dự thi" của đúng tuần đó, không phải Quản lý đổi kết luận. */
      ns = { state: 'khong-du-thi', effectiveOn: view.weekEnd ? view.weekEnd.slice(0, 10) : null, editableUntil: null };
    } else if (row?.no_show_settled_at && ns.state !== 'none') {
      /*
       * ĐÃ CHỐT MỘT LẦN. Từ đó hiển thị theo trạng thái thi HIỆN TẠI: còn `absent` thì là không dự thi;
       * Quản lý đã sửa trạng thái thi (đảo kết luận) thì dấu '-' cũ không được tự sống lại.
       */
      ns = view.sitStatus === 'absent'
        ? { state: 'khong-du-thi', effectiveOn: view.weekEnd ? view.weekEnd.slice(0, 10) : null, editableUntil: null }
        : { state: 'none', effectiveOn: null, editableUntil: null };
    }
    const noShowNote = row?.no_show_settled_at && !row.no_show_cu && row.no_show_period_id === view.periodId && view.sitStatus !== 'absent'
      ? NO_SHOW_OVERRIDDEN_NOTE : null;
    const noShow = ns.state === 'none' ? null : {
      /* Tuần viết bằng `tuanLich` (G-6): "W3 SEP", chỉ kèm năm khi khác năm hôm nay — không in mã tuần có năm. */
      state: ns.state, text: noShowText(ns, view.weekStart ? tuanLich(view.weekStart, today) : view.periodCode, today) ?? '',
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
      overdue: required && !cellScored && quaHanNhapDiem(view.deadline, view.weekStart, today)   // PR-UXF-a Q10: cùng luật `viewSkill`
        && progress !== 'absent' && progress !== 'cancelled' && !attempt.lich_su
        /* Đã báo "không có bài" thì không nợ điểm ở ô này — hạn nhập điểm chỉ áp cho bài CÓ thực hiện. */
        && noShow === null,
      progress,
      /* E8 (T53 Q6): bài đã xác nhận vắng không nhập ở đâu cả — nhập bù thì Quản lý "Xếp lại bài vắng" / "Khôi phục" trước. */
      canEdit: required && !cancelled && view.sitStatus !== 'cancelled' && view.sitStatus !== 'absent'
        /* T19 (PR-MTa): kỹ năng chưa tới tuần thi / chưa xếp tuần → ô khoá như máy chủ (`kiemDaToiTuanThi`), kể cả ô đã có điểm mà
         * Quản lý dời sang tuần chưa tới (T20) — điểm vẫn hiện. */
        && (!!view.weekStart && view.weekStart.slice(0, 10) <= mondayOf(today))
        && (hoanTat.hoanTat ? suaSauHoanTat : editable.includes(skill)),
      /* Việc nhập điểm của người xem (bảng lớp "Nhập điểm …") — như `canEdit` nhưng trước hoàn tất bỏ quyền sửa mọi lúc của Quản lý. */
      viec: required && !cancelled && view.sitStatus !== 'cancelled' && view.sitStatus !== 'absent'
        && (hoanTat.hoanTat ? suaSauHoanTat : viecList.includes(skill)),
      /* R11: đánh dấu "đợt đã hoàn tất" cho MỌI người xem — Quản lý vẫn `khoa && canEdit` (sửa qua hộp lý do). */
      khoa: hoanTat.hoanTat,
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
      nhanXet: row?.comment ?? null,
      gvCham: skill === 'speaking' && row && (row.examiner_user_id || row.examiner_name)
        ? { userId: row.examiner_user_id ?? null, ten: tenGvCham({ examinerUserName: row.examiner_user_name, examinerName: row.examiner_name }) ?? '' }
        : null,
    };
  });
}

/**
 * LỊCH VÀ HẠN TỪNG MÔN CỦA MỘT BÀI LỚP NORMAL.
 *
 * Lớp thường chấm theo `điểm đạt / tổng điểm`, không có band và không tách W1/W2, nên nó
 * dùng đúng bốn môn L/R/W/S — trùng với bộ kỹ năng đánh giá. Nhờ vậy nó dùng lại được
 * nguyên bảng lịch kỹ năng, chỉ khác một chỗ: HẠN CHẤM là hết Chủ nhật của chính tuần thi
 * môn đó, thay vì thứ Tư tuần sau như Fast Track.
 *
 * Không dùng lại hàm của Fast Track cho Normal khi luật khác nhau (mục 0.3) — khác biệt đó
 * nằm gọn trong `skillScoreDeadline`, và cả hai bên cùng hỏi một nơi.
 */
export function regularSkillViews(
  attempt: any, skillRows: SkillRow[] | undefined, scores: ScoreRow[], today: string,
  /** Bộ môn của chương trình lớp (K5-38, PF6) — BẮT BUỘC để mọi nơi gọi nói rõ bộ nào (Pre FOU một ô `tong_hop`). */
  skills: readonly string[],
): Map<string, SkillScheduleView> {
  const schedule = skillScheduleOf(attempt, skillRows, skills);
  const out = new Map<string, SkillScheduleView>();
  for (const skill of skills) {
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

// ---------------------------------------------------------------- danh sách

/**
 * MỘT DÒNG CÒN VIỆC CHẤM theo phạm vi đang xem — luật của `need: 'my_scores'`. Xuất ra để Cần chấm (đọc cả dòng đã
 * chấm xong để biết "Chấm tiếp") lọc bằng ĐÚNG luật này, không chép lại một bản thứ hai.
 */
export const conBaiCanCham = (m: { pendingSkills: string[]; status: string }): boolean =>
  m.pendingSkills.length > 0 && m.status !== 'cancelled';

/**
 * BẰNG CHỨNG MỘT MÔN ĐÃ BỊ DỜI LỊCH (Q15 "lùi lịch") — chỉ hai nguồn có thật, KHÔNG suy từ thứ tự tuần: lịch tách
 * tuần theo kế hoạch (lớp thường trải bốn môn qua hai tuần, FT xếp Speaking tuần sau) không phải là dời.
 *
 *   `no_show`  dấu "-" của lớp thường: `no_show_period_id` còn đó và KHÁC tuần hiện tại của môn — cùng luật với
 *              `movedFrom` của `regularSheet`. Tuần cũ chính là `no_show_period_id`.
 *   `absence`  dời do vắng (`absence_move_count > 0`, chỉ `applyMove` tăng nó). Tuần cũ đọc ở lịch sử lịch đợt.
 *
 * Xếp riêng tuần bằng `setSkillWeek` thì KHÔNG tính: kế hoạch tách tuần cũng đi đường đó.
 */
/** `lanVang` (PR-MT, YC-13.1): số lần đã dời do vắng — Lịch Test ghi thẳng "dời từ W3 SEP · vắng lần 1". */
export type MonDoiLich = { by: 'no_show' | 'absence'; fromPeriodId: number | null; lanVang: number | null };

function monDoiLich(
  score: { no_show_period_id?: number | null } | undefined, currentPeriodId: number | null, absenceMoves: number,
): MonDoiLich | null {
  if (score?.no_show_period_id && score.no_show_period_id !== currentPeriodId) {
    return { by: 'no_show', fromPeriodId: score.no_show_period_id, lanVang: absenceMoves > 0 ? absenceMoves : null };
  }
  return absenceMoves > 0 ? { by: 'absence', fromPeriodId: null, lanVang: absenceMoves } : null;
}

/** Số ô đã có điểm trong phạm vi đang xem (cùng tiêu chí "được yêu cầu" và "của tôi" với `pendingSkillsOf`). */
function scoredInScopeOf(cells: PendingCell[], scope: WorkScope): number {
  return cells.filter((c) => c.required && c.scored && (scope === 'mine' ? c.mine : true)).length;
}

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
  /** PR-UXF-a: chỉ lượt của các lớp này (≤ 900 id — `theoLo` không cần vì một trang không tới số đó). */
  classIds?: readonly number[];
  /** PR-UXF-a T65: chỉ em đang học (không Tạm dừng, không lưu trữ) — em Tạm dừng không sinh nợ điểm. */
  chiDangHoc?: boolean;
};

/**
 * AI PHỤ TRÁCH TỪNG MÔN của một lớp, cho CẢ DANH SÁCH lượt trong một lần đọc.
 *
 * Danh sách ở phạm vi quản lý là để ĐÔN ĐỐC nên phải kèm tên; nạp theo từng lớp một lần,
 * đừng hỏi lại cho từng hàng — một trang danh sách có thể có hàng chục lượt.
 */
/** PR-Dọn (Q13): GV chấm của từng (lớp, môn) theo luật phân công chung `phanCongDangHieuLuc` (đang hiệu lực, dòng đầu thắng). */
function ownersByClass(classIds: number[]): Map<number, Record<string, string>> {
  const map = new Map<number, Record<string, string>>();
  for (const [k, v] of phanCongDangHieuLuc(classIds, demoToday())) {
    const [lop, mon] = k.split('|');
    if (!map.has(+lop)) map.set(+lop, {});
    map.get(+lop)![mon] = v.ten;
  }
  return map;
}

const ATTEMPT_SELECT = `
  SELECT a.*, s.full_name, s.student_code,
         cy.route, cy.target_score, cy.khong_cam_ket, cy.exam_month, cy.exam_period_id, cy.exam_date, cy.seq AS cycle_seq,
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
  if (f.classIds) {
    if (!f.classIds.length) return { rows: [], scopeEmpty: false };
    where.push(`a.class_id IN (${f.classIds.map(() => '?').join(',')})`); params.push(...f.classIds);
  }
  /* PR-S6F-a Q2: một điều kiện "em đang học" — cả danh sách "cần chấm" (`my_scores`), đích của badge "n bài chờ chấm" (số = danh sách). */
  /* PR-Dọn (Q9): và CÙNG luật Nợ điểm (`scoreDebt.ts`) — lớp đã kết thúc không sinh việc nhập điểm. */
  if (f.chiDangHoc || f.need === 'my_scores') where.push(HV_DANG_HOC_SQL('s'), `c.status = 'active'`);
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
       * cả bài. Hạn của lớp thường là hết thứ Tư tuần sau tuần thi môn đó (T19, như Fast Track).
       */
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), scores, today, regularSkills);
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
        /** MH2: mã chương trình lớp — tên môn FOU G+V/P ở danh sách. */
        programmeCode: a.programme_code ?? null,
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
          .map((x) => ({ skill: x.skill, deadline: x.v!.deadline, weekCode: x.v!.periodCode, periodId: x.v!.periodId ?? null, overdue: !!x.v!.overdue })),
        /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
        pendingSkills: pending,
        /* Hạn và tuần của CHÍNH các môn còn nợ theo phạm vi đang xem — Cần chấm cần hạn của cả dòng, không chỉ phần của tôi. */
        pendingDetail: pending.map((k) => {
          const v = views.get(k);
          return {
            skill: k, deadline: v?.deadline ?? null, periodId: v?.periodId ?? null,
            weekCode: v?.periodCode ?? null, weekStart: v?.weekStart ?? null, overdue: !!v?.overdue,
            moved: monDoiLich(scores.find((x) => x.skill === k), v?.periodId ?? null, v?.absenceMoveCount ?? 0),
          };
        }),
        /* Số ô ĐÃ CÓ ĐIỂM trong cùng phạm vi — Cần chấm phân biệt "Chấm" với "Chấm tiếp". */
        scoredInScope: scoredInScopeOf(pendingCells, workScope),
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
    /* Không truyền `hoanTat` (R11) có chủ ý: dòng này chỉ đọc band/noShow/mine/lịch, không đọc canEdit/khoa — đỡ 3 câu SQL. */
    const cells = skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id));
    const active = cells.filter((c) => c.required);
    const pending = pendingSkillsOf(pendingInputOf(cells), workScope);
    return {
      id: a.id,
      /*
       * LOẠI BÀI phải đi kèm mọi dòng, để giao diện mở ĐÚNG màn.
       * Bài giữa/cuối khoá của lớp thường mà mở bằng màn Mock Test thì nó hiện ra "MT1" —
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
      /** PR-MT (T34): MT lịch sử — nhập bù, không hạn, không nợ. */
      lichSu: !!a.lich_su,
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
        .map((c) => ({ skill: c.skill, deadline: c.deadline, weekCode: c.periodCode, periodId: c.periodId ?? null, overdue: !!c.overdue })),
      /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
      pendingSkills: pending,
      /* Hạn và tuần của CHÍNH các môn còn nợ theo phạm vi đang xem — cùng ý như nhánh lớp thường. */
      pendingDetail: pending.map((k) => {
        const c = cells.find((x) => x.skill === k);
        const lich = bundle.skillRows.get(a.id)?.find((r) => r.skill === c?.assessedSkill);
        return {
          skill: k, deadline: c?.deadline ?? null, periodId: c?.periodId ?? null,
          weekCode: c?.periodCode ?? null, weekStart: c?.weekStart ?? null, overdue: !!c?.overdue,
          moved: monDoiLich(scores.find((x) => x.skill === k), c?.periodId ?? null, lich?.absence_move_count ?? 0),
        };
      }),
      scoredInScope: scoredInScopeOf(pendingInputOf(cells), workScope),
      /* Ai phụ trách từng bài — danh sách của Quản lý là để ĐÔN ĐỐC, nên phải có tên. */
      pendingOwners: ownersOf(a.class_id, pending),
      /** Tuần thi của CHÍNH các môn còn nợ — để hàng đợi nói "nợ từ tuần nào". */
      pendingWeeks: [...new Set(
        pending.map((k) => cells.find((c) => c.skill === k)?.periodCode).filter(Boolean),
      )],
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
      mapped = mapped.filter(conBaiCanCham);
      break;
    /* MT lịch sử (T34) không phải "thiếu điểm" — khớp đếm `missing_scores` ở signals.ts. */
    case 'missing_scores': mapped = mapped.filter((m) => m.status !== 'cancelled' && !m.lichSu && !m.complete && m.scoredRequired > 0); break;
    case 'overdue': mapped = mapped.filter((m) => m.overdueSkills > 0); break;
    /* CÙNG luật với huy hiệu ở bảng lớp: Case có mức SOS > 0 và chưa xong. Case không mang mức SOS (giáo viên báo) không phải Case SOS. */
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
  if (band) return `Band ${Number(row.band).toFixed(1)}`;   // T10: band nhập thẳng
  return 'Trống';
}

/**
 * LỊCH SỬ ĐIỂM của một lượt: ai sửa, trước → sau, lúc nào (PR-I Step 9). Đọc từ nhật ký `score.*` — điểm không có
 * bảng lịch sử riêng như lịch. Ô điểm chỉ giữ NGƯỜI NHẬP hiện tại; câu "ai đã sửa gì" nằm ở đây.
 */
export function scoreHistoryOf(attemptId: number) {
  const rows = db()
    .prepare(
      /*
       * PR-XOA: xoá hẳn học viên thì SQLite có thể cấp lại id lượt Test cũ cho lượt mới, còn nhật ký (Q1) vẫn giữ — chỉ lấy dòng nhật ký
       * KHÔNG cũ hơn chính lượt này, để lượt mới không hiện lịch sử điểm của em đã xoá.
       */
      `SELECT l.id, l.action, l.entity_label, l.before_json, l.after_json, l.created_at, u.full_name AS actor_name
         FROM audit_logs l LEFT JOIN users u ON u.id = l.actor_user_id
         JOIN assessment_attempts a ON a.id = l.entity_id
        WHERE l.entity_type = 'assessment_attempt' AND l.entity_id = ? AND l.created_at >= a.created_at
          AND l.action IN ('score.edit', 'score.lich_su', 'score.override', 'score.no_show', 'score.no_show_cleared', 'score.nhan_xet',
                           'score.huy_vuot', 'score.khoi_phuc')
        ORDER BY l.id DESC`,
    )
    .all(attemptId) as any[];
  /* Dn7: nhận xét W/S — trước → sau rút gọn 80 ký tự; lần chỉ đổi GV chấm (nhận xét giữ nguyên) không thành dòng. */
  const rutGon = (s: unknown) => { const t = typeof s === 'string' ? s.trim() : ''; return !t ? 'Trống' : t.length > 80 ? `${t.slice(0, 79)}…` : t; };
  return rows.flatMap<{
    id: number; kind: 'edit' | 'override' | 'no_show' | 'nhan_xet'; skill: string; skillLabel: string;
    before: string; after: string; actorName: string | null; createdAt: string; lyDo: string | null;
  }>((l) => {
    const before = l.before_json ? JSON.parse(l.before_json) : null;
    const after = l.after_json ? JSON.parse(l.after_json) : null;
    if (l.action === 'score.nhan_xet') {
      if ((before?.comment ?? null) === (after?.comment ?? null)) return [];
      return [{
        id: l.id, kind: 'nhan_xet' as const, skill: l.entity_label as string, skillLabel: tenMon(null, l.entity_label),
        before: rutGon(before?.comment), after: rutGon(after?.comment),
        actorName: l.actor_name as string | null, createdAt: l.created_at as string, lyDo: null as string | null,
      }];
    }
    /* T2 (PR-MTa): huỷ do dời vượt / khôi phục là `override` (web khỏi thêm loại); lý do nằm ở `after.lyDo`. */
    const vuot = l.action === 'score.huy_vuot', khoiPhuc = l.action === 'score.khoi_phuc';
    const afterText = l.action === 'score.no_show' ? 'Báo "-" (không có bài)'
      : l.action === 'score.no_show_cleared' ? 'Gỡ dấu "-"'
      : vuot ? 'Huỷ do dời vượt'
      : scoreSummaryText(after);
    return [{
      id: l.id,
      kind: (l.action === 'score.override' || vuot || khoiPhuc ? 'override' : l.action === 'score.edit' || l.action === 'score.lich_su' ? 'edit' : 'no_show') as 'override' | 'edit' | 'no_show',
      skill: l.entity_label as string,
      skillLabel: tenMon(null, l.entity_label),   // gồm cả môn lớp thường (trước đây `writing` hiện mã thô)
      before: khoiPhuc ? 'Đã huỷ' : scoreSummaryText(before), after: afterText,
      actorName: l.actor_name as string | null, createdAt: l.created_at as string,
      /* RB-5 — lý do hiệu chỉnh nằm ngay trong bản "sau" của nhật ký; lần nhập đầu không có. */
      lyDo: (after && typeof after === 'object' ? (after as any).lyDo ?? null : null) as string | null,
    }];
  });
}

export function attemptDetail(p: Principal, attemptId: number) {
  settleNoShows();
  const conn = db();
  const a = conn.prepare(`${ATTEMPT_SELECT} WHERE a.id = ?`).get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  requireXemLuotCham(p, { classId: a.class_id, studentId: a.student_id }, 'Lượt Mock này nằm ngoài phạm vi bạn được xem.');

  const scores = scoresOf(attemptId);
  /*
   * Màn CHI TIẾT được phép dựng dòng lịch còn thiếu: người dùng đang đứng trước đúng một
   * đợt và sắp thao tác trên nó. Danh sách thì không — mở một bảng báo cáo không được
   * ghi gì vào dữ liệu (mục 18.1).
   */
  const skillRows = ensureSkillRows(attemptId);
  const skips = skippedSkillsOf(skillRows);
  const result = resultOf(a, scores, skips);
  const today = demoToday();
  /* R11 (Z2c-c, A3): đợt đã hoàn tất thì ô chỉ sửa được bởi Quản lý — thiếu dòng này GVBM thấy nút "Sửa điểm" rồi bị máy chủ chặn. */
  const cells = skillCells(p, a, scores, skips, today, skillRows, dotHoanTat(attemptId, today));
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
      lichSu: !!a.lich_su,
    });
    return { ...view, label: ASSESSED_SKILL_LABEL[skill] };
  });
  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM attempt_schedule_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.attempt_id = ? ORDER BY h.id DESC`,
    )
    .all(attemptId) as any[];
  /*
   * PR-HSM (K4-30): "dời từ" = tuần cũ của lần dời do vắng MỚI NHẤT từng kỹ năng (`history` đã xếp mới trước). Mã tuần → ngày
   * bằng MỘT câu, chỉ khi có dời.
   */
  const doiMa = new Map<string, string>();
  for (const h of history) if (h.action === 'skill_week_moved_absence' && h.old_value && !doiMa.has(h.field)) doiMa.set(h.field, h.old_value);
  const doiNgay = new Map<string, string>();
  if (doiMa.size) {
    const ma = [...new Set(doiMa.values())];
    for (const r of conn.prepare(`SELECT code, week_start FROM report_periods WHERE code IN (${ma.map(() => '?').join(',')})`).all(...ma) as any[]) {
      doiNgay.set(r.code, r.week_start);
    }
  }
  const huyDong = a.status === 'cancelled' ? history.find((h) => h.action === 'cancelled') : null;

  return {
    id: a.id,
    /** Loại bài. Màn này CHỈ dựng cho `mock`; loại khác phải chuyển sang màn của lớp thường. */
    kind: a.kind,
    student: { id: a.student_id, name: a.full_name, code: a.student_code },
    cycle: { id: a.cycle_id, seq: a.cycle_seq, route: a.route, target: a.target_score, khongCamKet: !!a.khong_cam_ket, examPlan: examPlanOf(a) },
    classId: a.class_id, classCode: a.class_code, branchId: a.branch_id, branchName: a.branch_name,
    attemptNo: a.attempt_no,
    targetAtAttempt: a.target_at_attempt,
    studyWeekHint: MOCK_FT_STUDY_WEEK[a.attempt_no] ?? null,
    /** PR-MT (T34): MT lịch sử — nhập bù, không hạn, không luồng vắng. */
    lichSu: !!a.lich_su,
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
      blockingLabels: completion.blocking.map((k: string) => ASSESSED_SKILL_LABEL[k as AssessedSkill] ?? tenMon(null, k)),
    },
    /** Lịch, phạm vi, trạng thái thi và hạn chấm của TỪNG kỹ năng (mục 10.1 · 10.5). */
    skillSchedule: scheduleRows.map((r) => {
      const ma = doiMa.get(r.skill);
      return { ...r, doiTu: ma ? (doiNgay.has(ma) ? tuanLich(doiNgay.get(ma)!, today) : ma) : null };
    }),
    /** T2 (PR-MTa): kết quả đã huỷ do dời vượt, chưa khôi phục (Quản lý: nút Khôi phục — PR-MTb). */
    ketQuaHuy: ketQuaHuyCua([a.id]).get(a.id) ?? null,
    /** PR-HSM (K4 §4h): lượt đã huỷ — lý do, ai, khi (dòng `cancelled` mới nhất của lịch sử). */
    huy: huyDong ? { lyDo: huyDong.reason ?? null, ai: huyDong.actor_name ?? null, khi: huyDong.created_at } : null,
    /** Đợt này có tách tuần không — nhiều hơn một tuần trong các kỹ năng bắt buộc. */
    splitWeeks: [...new Set(scheduleRows.filter((r) => r.required && r.periodCode).map((r) => r.periodCode))].length > 1,
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
     * HỒ SƠ TEST KHÔNG CÒN KHỐI CASE (PR-I, rule book §17.5): vấn đề, phương án và việc gắn với Case nằm ở hồ sơ
     * học viên và bảng Case — nên payload này không còn `sosCase` · `caseSteps` · `caseHistory` · `tasks`.
     * Điểm sửa được ai, lúc nào thì có ở `scoreHistory`.
     */
    scoreHistory: scoreHistoryOf(attemptId),
    viewer: {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }),
      /** PR-XLMT (T38): GVCN của lớp — Báo vắng / Xếp lại bài vắng theo bảng thao tác `thaoTacKyNang`. */
      laGvcn: !!a.class_id && isCoreTeacherOf(p, a.class_id),
      canCancel: can(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id }),
      /** PR-MT (M-12, K4-10): cách huỷ được phép + hệ quả thật, để hộp huỷ nói trước — không bấm rồi mới biết. */
      huyLuot: a.status !== 'cancelled' && can(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id })
        ? (({ caseIds: _bo, ...hq }) => hq)(heQuaHuyLuot(a.id)) : null,
      /** Xử lý vắng (dời lần đầu / xin duyệt) — GVCN của lớp và Quản lý; giáo viên bộ môn thì không. */
      canHandleAbsence: canRequestAbsence(p, a),
      canSkipSkill: can(p, PERMISSIONS.ATTEMPT_SKIP_SKILL, { classId: a.class_id }),
      /**
       * Xác nhận đã thi / vắng CHO TỪNG KỸ NĂNG — cùng quyền với việc dời lịch kỹ năng đó
       * (sổ SCH-01, SCH-02: một capability, không lệch giữa hai thao tác). Không còn một cờ
       * `canSetSitStatus` chung cho cả đợt — giao diện đọc `moveableSkills` theo từng kỹ
       * năng, đúng cho cả Quản lý (mọi kỹ năng) lẫn GVCN/GVBM lớp thường (đúng phần phụ trách).
       */
      moveableSkills: a.class_id ? moveableSkills(p, a.class_id, ENTRY_SKILLS) : [],
      canOverrideDeadline: can(p, PERMISSIONS.DEADLINE_OVERRIDE, { classId: a.class_id }),
      /* Không có kỹ năng cụ thể ở mức cả đợt — dùng SOS_REPORT (rộng), đúng nghĩa "báo được". */
      canEditSos: can(p, PERMISSIONS.SOS_REPORT, { classId: a.class_id, studentId: a.student_id }),
      editableSkills: a.class_id ? editableSkills(p, a.class_id, ENTRY_SKILLS, luotQuyen(a)) : [],
    },
  };
}

// ---------------------------------------------------------------- tạo lượt

/**
 * Tạo một lượt MT. Quản lý chốt TUẦN — và tuần là thứ duy nhất phải khai.
 */
export function createAttempt(p: Principal, input: {
  studentId: number; cycleId?: number; attemptNo?: number;
  periodId: number; note?: string | null;
}) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  /* PR-Dọn (Q26, quét #1): lớp của lượt LUÔN là lớp em đang học (ghi danh `active`) — không nhận lớp do nơi gọi gửi. */
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
    .get(student.id) as any;
  const classId = enr?.class_id ?? null;
  require_(p, PERMISSIONS.PLAN_WEEK, { classId, studentId: student.id },
    'Chỉ Quản lý mới lập được kế hoạch tuần MT.');

  const cycle = input.cycleId ? cycleById(input.cycleId) : currentCycle(student.id);
  if (!cycle) throw badRequest('Học viên chưa có lộ trình nào. Mở lộ trình trước khi lên lịch MT.');
  /* Q26 (lỗi mức Cao): lộ trình phải của ĐÚNG em — không thì hồi sinh / ghi đè lượt của em khác (chi nhánh khác) qua `hoiSinhLuot`. */
  if (cycle.student_id !== student.id) throw badRequest('Lộ trình không thuộc học viên này.');
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(input.periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần kế hoạch');

  /*
   * ĐÁNH SỐ LIỀN MẠCH — MỘT CHỐT cho mọi đường tạo lượt (POST /attempts, bulk-plan, Kế hoạch Test xếp mới / hàng loạt; K4-08, T36).
   * MT(n) chỉ tạo khi đã có MT(n−1); số huỷ KHÔNG điểm dùng lại được (Q-B) bằng cách HỒI SINH chính dòng đó (giữ UNIQUE — Q3).
   */
  const ds = luotSoCuaLoTrinh(cycle.id);
  const attemptNo = input.attemptNo ?? soMtKeTiep(ds);
  const loiSo = kiemSoMtMoi(ds, attemptNo);
  if (loiSo) throw badRequest(loiSo);

  return tx(() => {
    const cu = conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?')
      .get(cycle.id, attemptNo) as any;
    if (cu && cu.status !== 'cancelled') throw badRequest(`Lộ trình này đã có MT${attemptNo}. Đổi tuần thay vì tạo mới.`);
    if (cu) return hoiSinhLuot(p, cu, { classId, period, targetScore: cycle.target_score, note: input.note ?? null, studentCode: student.student_code });
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, note, created_by, created_at, lich_su)
         VALUES (?,?,?, 'mock', ?,?, 'planned', ?,?,?,?,?)`,
      )
      /* T1 (PR-MTa): xếp vào tuần cách tuần này ≥ 2 tuần = MT cũ ngay lúc tạo; tuần trước vẫn là MT thường (có hạn chấm). */
      .run(cycle.id, student.id, attemptNo, classId, period.id, cycle.target_score, input.note ?? null, p.userId, nowIso(),
        laMtCu(period.week_end, demoToday()) ? 1 : 0);
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

/**
 * Q-B: tạo lại số MT đã "Huỷ cả lượt" (không điểm) = HỒI SINH chính dòng đó — cùng id, lịch kỹ năng dựng lại ở tuần mới, dấu "-" cũ
 * (không phải điểm) bỏ đi, đề nghị dời cũ rút. `created_at` = LÚC XẾP LẠI và cờ MT cũ tính theo HÔM NAY — cửa sổ Case 4 tuần (M4) đo
 * từ đây, không từ lần tạo đầu. Gọi trong tx của `createAttempt`.
 */
function hoiSinhLuot(p: Principal, cu: any, o: { classId: number | null; period: any; targetScore: number | null; note: string | null; studentCode: string }) {
  const conn = db();
  conn.prepare(
    `UPDATE assessment_attempts SET status = 'planned', cancel_reason = NULL, cancelled_at = NULL, class_id = ?, planned_period_id = ?,
            plan_source = 'manual', target_at_attempt = ?, note = ?, lich_su = ?, created_at = ?, updated_at = ? WHERE id = ?`,
  ).run(o.classId, o.period.id, o.targetScore, o.note, laMtCu(o.period.week_end, demoToday()) ? 1 : 0, nowIso(), nowIso(), cu.id);
  rutDeNghiDoi(cu.id);   // phòng dữ liệu cũ: đề nghị của lượt đã huỷ không được sống lại cùng lượt
  conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND band IS NULL AND raw_score IS NULL').run(cu.id);
  conn.prepare('DELETE FROM attempt_skills WHERE attempt_id = ?').run(cu.id);
  ensureSkillRows(cu.id);
  logSchedule(cu.id, { action: 'recreated', field: 'planned_period', newValue: o.period.code, reason: `Tạo lại MT${cu.attempt_no} (số dùng lại)`, actor: p.userId });
  addJourney({
    studentId: cu.student_id, eventType: 'mock_scheduled', eventDate: o.period.week_start,
    title: `Tạo lại MT${cu.attempt_no} · ${o.period.code}`, refTable: 'assessment_attempts', refId: cu.id, createdBy: p.userId,
  });
  writeAudit({ actorUserId: p.userId, action: 'attempt.recreate', entityType: 'assessment_attempt', entityId: cu.id,
    entityLabel: `${o.studentCode} MT${cu.attempt_no}`, before: { status: 'cancelled' }, after: { period: o.period.code } });
  return conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(cu.id);
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
export function setPlanningWeek(p: Principal, attemptId: number, periodId: number, reason?: string,
  opts: { force?: boolean; huyLichVuot?: boolean } = {}) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id, studentId: a.student_id },
    'Chỉ Quản lý mới chốt được tuần kế hoạch.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ. Mở lại trước khi đổi tuần.');
  const period = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');

  const rows = ensureSkillRows(attemptId);
  /* D3 (PR-LM): MT lịch sử dời cả đợt — kể cả kỹ năng đã có điểm / đã thi (sửa hồ sơ, `setSkillWeek` đòi lý do). */
  const movable = rows.filter(
    (r) => r.required && r.sit_status !== 'cancelled' && r.planned_period_id !== periodId
      && (a.lich_su || (r.sit_status !== 'sat' && !hasAnyBand(attemptId, r.skill))),
  );
  if (!movable.length) {
    throw badRequest(
      'Không kỹ năng nào còn đổi được tuần: các kỹ năng bắt buộc đã thi, đã có điểm, '
      + 'đã huỷ phần thi hoặc vốn đã ở tuần này.',
    );
  }
  /* Q-0310-1 (PR-LM) + T2 (PR-MTa): kiểm vượt trên CẢ lần dời (không từng kỹ năng) — 409 / 400 trước khi ghi bất cứ gì. */
  const vuot = kiemVuot(attemptId, tuanCuoiSauKhiDoi(rows, new Map(movable.map((r) => [r.skill, period.week_start])))!);
  if (vuot.chan) throw badRequest(vuot.chan);
  kiemXacNhanVuot(vuot.biVuot, { xacNhan: opts.huyLichVuot, lyDo: reason });

  return tx(() => {
    const warnings: string[] = [];
    const kept: string[] = [];
    for (const r of movable) {
      const res = setSkillWeek(p, attemptId, r.skill, periodId, { reason, force: opts.force, huyLichVuot: opts.huyLichVuot });
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
function hasAnyBand(attemptId: number, skill: string): boolean {
  const entry = entrySkillsOf(skill as AssessedSkill)   // tong_hop (Pre FOU) → [tong_hop], không có band;
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
 * Luật nằm ở nơi sở hữu lịch kỹ năng — kể cả hai điều cấm quan trọng: lớp thường không có
 * thao tác miễn môn, và không bỏ một môn khỏi phạm vi SAU khi đã xác nhận em vắng môn đó.
 * Ở đây chỉ còn việc tính lại kết luận của đợt sau khi phạm vi đổi.
 */
export function setSkillSkip(p: Principal, attemptId: number, skill: string, skipped: boolean, reason?: string, opts: { khiTao?: boolean; khongMockLai?: boolean } = {}) {
  const r = setSkillScope(p, attemptId, skill, !skipped, reason ?? null, opts);
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

/**
 * HỆ QUẢ HUỶ LƯỢT — nói trước trong hộp huỷ (K4-10). "Huỷ cả lượt" chỉ với lượt LỚN NHẤT chưa có điểm nào (M-12, Q-B); còn lại
 * "Huỷ phần còn lại". Huỷ cả lượt đóng những thứ SINH RIÊNG từ lượt đó (T67): Case mà mọi mốc đến từ lượt này và chưa PA nào có kết
 * quả (Q13), việc Phối hợp còn mở. Huỷ phần còn lại không đóng gì — phần đã có điểm là thật.
 */
export function heQuaHuyLuot(attemptId: number): { cachDuoc: CachHuy; case: number; pa: number; phoiHop: number; caseIds: number[] } {
  const conn = db();
  const a = loadAttempt(attemptId);
  const ds = luotSoCuaLoTrinh(a.cycle_id);
  const cachDuoc = cachHuyLuot(ds.find((x) => x.attempt_no === a.attempt_no)!, ds);
  if (cachDuoc !== 'ca-luot') return { cachDuoc, case: 0, pa: 0, phoiHop: 0, caseIds: [] };
  const caseIds = caseSinhRieng(attemptId);
  const pa = caseIds.length
    ? (conn.prepare(`SELECT COUNT(*) n FROM case_interventions WHERE status IN ('planned', 'started') AND case_id IN (${caseIds.map(() => '?').join(',')})`)
      .get(...caseIds) as any).n as number
    : 0;
  const phoiHop = (conn.prepare(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ? AND status = 'pending'`).get(attemptId) as any).n as number;
  return { cachDuoc, case: caseIds.length, pa, phoiHop, caseIds };
}

/**
 * T67 / G8 (PR-MTa): Case SINH RIÊNG từ một lượt — mọi mốc đến từ lượt này, chưa PA nào có kết quả (Q13). Một tập cho hai đường huỷ:
 * Huỷ cả lượt và huỷ kết quả do dời vượt (`huyKetQuaLuot`).
 */
export function caseSinhRieng(attemptId: number): number[] {
  return (db().prepare(
    `SELECT sc.id FROM sos_cases sc
      WHERE sc.status != 'done' AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.attempt_id = ?)
        AND NOT EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.attempt_id IS NOT NULL AND m.attempt_id != ?)
        AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.case_id = sc.id AND f.outcome IS NOT NULL)`,
  ).all(attemptId, attemptId) as any[]).map((r) => r.id as number);
}

/** HUỶ LƯỢT (T36, M-12, T67). `cach` bỏ trống = cách được phép cho lượt này. */
export function huyLuot(p: Principal, attemptId: number, input: { lyDo: string; cach?: 'ca-luot' | 'phan-con-lai' | null }) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id, studentId: a.student_id }, 'Bạn không có quyền huỷ lượt Mock.');
  const loiLyDo = kiemLyDoThaoTac('huy-luot', input.lyDo);
  if (loiLyDo) throw badRequest(loiLyDo);
  const lyDo = String(input.lyDo).trim();
  const hq = heQuaHuyLuot(attemptId);
  if (!hq.cachDuoc) throw badRequest('Lượt này đã huỷ.');
  const cach = input.cach ?? hq.cachDuoc;
  if (cach !== 'ca-luot' && cach !== 'phan-con-lai') throw badRequest('Cách huỷ không hợp lệ.');
  if (cach === 'ca-luot' && hq.cachDuoc !== 'ca-luot') {
    throw badRequest('Chỉ huỷ cả lượt được với MT cuối cùng của lộ trình khi chưa có điểm và chưa thi kỹ năng nào — dùng "Huỷ phần còn lại".');
  }
  const conn = db();
  return tx(() => {
    if (cach === 'ca-luot') {
      conn.prepare(`UPDATE assessment_attempts SET status='cancelled', cancel_reason=?, cancelled_at=?, updated_at=? WHERE id=?`)
        .run(lyDo, nowIso(), nowIso(), attemptId);
      logSchedule(attemptId, { action: 'cancelled', reason: lyDo, actor: p.userId });
      /* Đề nghị dời đang chờ của lượt này hết nghĩa — không rút thì hết hạn sẽ huỷ phần thi của lượt xếp lại sau (cùng id). */
      rutDeNghiDoi(attemptId);
      addJourney({ studentId: a.student_id, eventType: 'mock_cancelled', eventDate: demoToday(),
        title: `Huỷ MT${a.attempt_no}`, detail: lyDo, refTable: 'assessment_attempts', refId: attemptId, createdBy: p.userId });
      writeAudit({ actorUserId: p.userId, action: 'attempt.cancel', entityType: 'assessment_attempt', entityId: attemptId,
        before: { status: a.status }, after: { status: 'cancelled', reason: lyDo } });
      const phoiHop = conn.prepare(
        `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_luot_huy', removed_by = NULL,
                removed_at = ?, updated_at = ? WHERE attempt_id = ? AND status = 'pending'`).run(nowIso(), nowIso(), attemptId).changes;
      const dong = hq.caseIds.length
        ? closeCasesBySystem({ actorUserId: p.userId, studentId: a.student_id, reason: 'luot_da_huy', on: demoToday(), caseIds: hq.caseIds }).closedCaseIds.length
        : 0;
      return { cach, kyNangHuy: [] as string[], dong: { case: dong, pa: hq.pa, phoiHop } };
    }
    /* Huỷ phần còn lại (Q12): kỹ năng chưa có điểm VÀ chưa thi — đã thi chờ chấm vẫn còn nghĩa vụ chấm. Lượt giữ số và trạng thái. */
    const diem = scoresOf(attemptId);
    const coDiem = (assessed: AssessedSkill) => entrySkillsOf(assessed)
      .some((k) => diem.some((d) => d.skill === k && ((d.band ?? null) !== null || (d.raw_score ?? null) !== null)));
    const huy = ensureSkillRows(attemptId).filter((r) => r.required && r.sit_status === 'scheduled' && !coDiem(r.skill as AssessedSkill));   // tong_hop (Pre FOU) → entrySkillsOf trả [tong_hop]
    for (const r of huy) {
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', updated_at = ? WHERE id = ?`).run(nowIso(), r.id);
      logSchedule(attemptId, { action: 'skill_part_cancelled', field: r.skill, oldValue: r.period_code, newValue: null, reason: lyDo, actor: p.userId });
      writeAudit({ actorUserId: p.userId, action: 'attempt.cancel_part', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: `MT${a.attempt_no} · ${r.skill}`, before: { week: r.period_code }, after: { reason: lyDo } });
    }
    if (huy.length) recomputeCompletionWeek(attemptId, p.userId);
    return { cach, kyNangHuy: huy.map((r) => r.skill as string), dong: { case: 0, pa: 0, phoiHop: 0 } };
  });
}

export function reopenAttempt(p: Principal, attemptId: number) {
  const a = loadAttempt(attemptId);
  require_(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id, studentId: a.student_id });
  return tx(() => {
    db().prepare(`UPDATE assessment_attempts SET status='planned', cancel_reason=NULL, cancelled_at=NULL, updated_at=? WHERE id=?`)
      .run(nowIso(), attemptId);
    logSchedule(attemptId, { action: 'reopened', actor: p.userId });
    refreshOutcome(p, attemptId);
    return db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
  });
}

// ---------------------------------------------------------------- nhập điểm

export type ScorePatch = {
  rawScore?: number | null;
  /** T10 (PR-MTa): band nhập thẳng — L/R thay số câu, W1/W2/S thay 4 tiêu chí; `null` = xoá. Không gửi = như cũ. */
  band?: number | null;
  rawTotal?: number | null;
  criteria?: (number | null)[];
  resultDate?: string | null;
  note?: string | null;
  /**
   * DẤU '-' (PR-G): `true` = báo em có lịch nhưng KHÔNG LÀM BÀI ("Không có bài"); `false` = gỡ dấu (trước
   * khi tuần kết thúc). Không phải điểm 0, và không bao giờ xoá một điểm chính thức.
   */
  noShow?: boolean;
  /**
   * RB-5 — LÝ DO HIỆU CHỈNH. Bắt buộc khi ô ĐÃ CÓ điểm chính thức và lần ghi này làm đổi giá trị đó (kể cả xoá). Lần
   * nhập đầu tiên không phải hiệu chỉnh nên không đòi; lưu lại đúng con số cũ (tự lưu) hay chỉ sửa ghi chú cũng không.
   * Lý do đi vào nhật ký `score.edit`/`score.override` — chỗ `scoreHistoryOf` đang đọc — nên không cần bảng mới.
   */
  lyDo?: string | null;
  /** PR-HSM (YC-13.5): nhận xét W1/W2/S — `null`/rỗng = xoá. Không phải điểm: không lý do, không đổi "Nhập bởi", không tính lại SOS. */
  nhanXet?: string | null;
  /** PR-HSM (T39): GV chấm Speaking, dạng `nguoiThanhPayload` — `null` = xoá. */
  gvCham?: { performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null } | null;
};

/** GV chấm hợp lệ: nhân viên đang làm việc, hoặc tên người ngoài 2–100 ký tự (luật `chuanHoaNguoiThucHien`). */
function gvChamHopLe(p: Principal, g: NonNullable<ScorePatch['gvCham']>) {
  if (typeof g !== 'object') throw badRequest('GV chấm không hợp lệ.');
  try {
    return chuanHoaNguoiThucHien(p, g, { nhom: 'nhan_vien', batBuoc: false });
  } catch {
    throw badRequest('GV chấm phải là nhân viên đang làm việc, hoặc gõ tên người ngoài (2–100 ký tự).');
  }
}

/**
 * CHỈ NHẬN XÉT / GV CHẤM (K4 §4f) — không đụng điểm, "Nhập bởi", SOS. `undefined` = giữ cột đó. Chưa có dòng thì tạo dòng
 * không điểm (GV ghi nhận xét trước khi chấm — Q7). Nhật ký `score.nhan_xet` giữ trước/sau.
 */
function luuNhanXet(
  p: Principal, attemptId: number, skill: string,
  nhanXet: string | null | undefined, gv: { userId: number | null; name: string | null } | null | undefined,
) {
  const conn = db();
  const cu = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as ScoreRow | undefined;
  const comment = nhanXet !== undefined ? nhanXet : cu?.comment ?? null;
  const exUser = gv !== undefined ? gv?.userId ?? null : cu?.examiner_user_id ?? null;
  const exName = gv !== undefined ? gv?.name ?? null : cu?.examiner_name ?? null;
  if (cu) {
    conn.prepare('UPDATE assessment_scores SET comment = ?, examiner_user_id = ?, examiner_name = ? WHERE id = ?')
      .run(comment, exUser, exName, cu.id);
  } else {
    conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, comment, examiner_user_id, examiner_name) VALUES (?,?,?,?,?)')
      .run(attemptId, skill, comment, exUser, exName);
  }
  writeAudit({
    actorUserId: p.userId, action: 'score.nhan_xet', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill,
    before: cu ? { comment: cu.comment ?? null, examinerUserId: cu.examiner_user_id ?? null, examinerName: cu.examiner_name ?? null } : null,
    after: { comment, examinerUserId: exUser, examinerName: exName },
  });
  const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  return {
    score: conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill),
    result: resultOf(fresh), attemptStatus: fresh.status,
  };
}

/**
 * Tính lại trạng thái lượt và mức SOS từ dữ liệu hiện có.
 *
 * "Đã xong" = đã có điểm mọi kỹ năng BẮT BUỘC, không suy từ việc ngày kế hoạch đã trôi qua.
 * Sửa điểm làm đổi mức SOS thì Case giữ nguyên ID, hành động và lịch sử.
 */
export function refreshOutcome(p: Principal, attemptId: number) {
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
   * khi cả một Case dựng trên một con số đã biết là sai.
   *
   * Phân biệt then chốt của mục 9.4 nằm ở đây: nhập sai rồi sửa KHÁC với thi lại rồi tiến
   * bộ. Nên đường này KHÔNG ghi mốc "đã tiến bộ" nào cả — nó chỉ rút lại thứ không còn căn
   * cứ. Và Case đã có việc thật diễn ra thì không bị đụng tới, chỉ được nhắc xem lại.
   */
  reconcileCorrectedScores(p, attemptId, result);
}

/**
 * Những ô nhập điểm nay đã ĐẠT kỳ vọng thì rút lại tín hiệu tương ứng, và xử lý Case đi kèm.
 *
 * Hai nhánh, đúng như mục 9.4:
 *
 *   · Case CHỈ có căn cứ từ con số vừa sửa  → rút khỏi danh sách đang xử lý với lý do rõ
 *     ràng, huỷ các phương án chưa ai làm, giữ nguyên toàn bộ lịch sử.
 *   · Case còn căn cứ khác (mốc từ đợt khác, quan sát, phương án đã chạy) → GIỮ, và báo
 *     người phụ trách xem lại xem có cần theo tiếp không. Không xoá việc đã diễn ra.
 */
function reconcileCorrectedScores(p: Principal, attemptId: number, result: AttemptResult) {
  const entry = entryBandsOf(scoresOf(attemptId));
  const failing = new Set(failingEntrySkills(result.expectation, entry, result.skipped));
  /* Ô đã có điểm mà KHÔNG nằm trong danh sách dưới kỳ vọng = ô đang đạt. */
  const passing = ENTRY_SKILLS.filter((k) => (entry[k] ?? null) !== null && !failing.has(k)) as string[];
  /* PR-S3F #1: ô nay TRỐNG và không bị bỏ (Huỷ điểm / Thi lại xoá điểm) — tín hiệu dựng trên điểm đó cũng hết căn cứ. */
  const cleared = ENTRY_SKILLS.filter((k) => (entry[k] ?? null) === null && !result.skipped.includes(assessedSkillOf(k))) as string[];
  reconcileCorrectedSignals(p, { attemptId, passingSkills: passing, passText: 'đạt kỳ vọng', clearedSkills: cleared });
}

export function saveScore(
  p: Principal, attemptId: number, skill: string, patch: ScorePatch, today: string = demoToday(),
) {
  const conn = db();
  const a = loadAttempt(attemptId);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không nhập điểm được.');
  /*
   * T23 (PR-MTa, thay K4-20): MT cũ nhận "-" = em không dự thi kỹ năng đó. Chỉ ghi dấu — `settleNoShows` bỏ qua lượt MT cũ
   * (`lich_su = 0`), nên không tính lần vắng, không tự dời, không Case / thẻ / chuông; ô không còn đếm "còn trống".
   */
  /*
   * DẤU "-" CỦA LỚP THƯỜNG ĐI CỬA KHÁC (C08, chốt 21/09/2026 đêm). Ở lớp thường, "-" không phải lời khai chờ chốt
   * Chủ nhật như Fast Track mà là một lần DỜI LỊCH: môn đó sang tuần sau ngay. Luật ấy nằm ở `normal/regular.ts`
   * (`reportRegularNoShow`), cùng chỗ với bảng điểm lớp thường — nên ở đây chỉ chỉ đường, không dựng luật thứ hai.
   */
  if (patch.noShow !== undefined && scoringModeOf(a) === 'ratio') {
    throw badRequest('Bài của lớp thường ghi dấu "-" ở bảng điểm lớp thường — ở đó môn được ghi "-" tự dời sang tuần sau.');
  }

  /*
   * R11 (23/09) — ĐỢT ĐÃ HOÀN TẤT (hết Chủ nhật của tuần bắt buộc muộn nhất) THÌ CHỈ NGƯỜI CÓ `PLAN_WEEK` HOẶC
   * `SCORE_OVERRIDE` SỬA ĐƯỢC, qua đúng đường `path = 'override'` (nhật ký `score.override`, RB-5 đòi lý do —
   * xem dưới). GVBM bị chặn hẳn, không còn đường `assigned` nữa dù đúng môn mình phụ trách.
   */
  const hoanTat = dotHoanTat(attemptId, today);
  let path = a.class_id ? scoreEditPath(p, a.class_id, skill, { lich_su: a.lich_su ?? 0 }) : null;
  if (hoanTat.hoanTat) {
    if (!a.class_id || !quyenSuaSauHoanTat(p, a.class_id, !!a.lich_su)) {
      throw forbidden(
        `Đợt này đã hoàn tất (hết Chủ nhật ${ngay(hoanTat.chuNhatCuoi)}). `
        + 'Chỉ Quản lý sửa được điểm — nhờ Quản lý hiệu chỉnh.',
      );
    }
    /* GVCN sửa MT cũ của lớp mình (T22) giữ đường `lich_su`; Quản lý / quyền sửa hộ đi `override`. */
    path = quyenSuaSauHoanTat(p, a.class_id) ? 'override' : 'lich_su';
  } else if (!path) {
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
    throw badRequest(`Kỹ năng ${tenMon(null, assessed)} không nằm trong phạm vi yêu cầu của đợt này.`);
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

  /*
   * PR-HSM — NHẬN XÉT / GV CHẤM đi cùng đường này (một route, một hàm) và đã qua đủ kiểm quyền, hoàn tất, huỷ, vắng ở trên.
   * Chỉ gửi hai trường đó → nhánh riêng, TRƯỚC nhánh "-" và nhánh điểm (không ghi đè `entered_by`, không `refreshOutcome`).
   */
  const coNhanXet = patch.nhanXet !== undefined, coGvCham = patch.gvCham !== undefined;
  if (coNhanXet && !(BAI_CO_NHAN_XET as readonly string[]).includes(skill)) throw badRequest('Chỉ Writing Task 1, Writing Task 2 và Speaking có nhận xét.');
  if (coGvCham && skill !== 'speaking') throw badRequest('Chỉ Speaking có GV chấm.');
  const nx = coNhanXet ? kiemNhanXet(patch.nhanXet) : null;
  if (nx && 'loi' in nx) throw badRequest(nx.loi);
  const nxGt = nx && 'gt' in nx ? nx.gt : undefined;
  /* PR-S4F #10: xoá GV chấm phải gửi `null` rõ — false / 0 / "" là dữ liệu hỏng, không hiểu thành "xoá". */
  if (coGvCham && patch.gvCham !== null && (typeof patch.gvCham !== 'object' || Array.isArray(patch.gvCham))) {
    throw badRequest('GV chấm không hợp lệ — gửi người chấm, hoặc null để xoá.');
  }
  const gv = coGvCham ? (patch.gvCham ? gvChamHopLe(p, patch.gvCham) : null) : undefined;
  /* T19: có ghi một giá trị điểm (không phải xoá) → kỹ năng phải tới tuần thi. */
  const ghiDiem = (patch.rawScore !== undefined && patch.rawScore !== null) || (patch.band !== undefined && patch.band !== null)
    || (Array.isArray(patch.criteria) && patch.criteria.some((v) => v !== null && v !== undefined && (v as unknown) !== ''));
  if (ghiDiem) kiemDaToiTuanThi(scheduleRow, today);
  const chiNhanXet = (coNhanXet || coGvCham) && patch.rawScore === undefined && patch.band === undefined && patch.rawTotal === undefined
    && patch.criteria === undefined && patch.noShow === undefined && patch.resultDate === undefined && patch.note === undefined;
  if (chiNhanXet) return tx(() => luuNhanXet(p, attemptId, skill, nxGt, gv));

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
        /* T23 (rà #212): "-" ở MT cũ = chốt cuối "Không dự thi" ngay lúc ghi (`no_show_cu`, đã chốt) — lượt có thành MT thường sau đó
         * (Quản lý dời kỹ năng khác) thì dấu này cũng không vào luồng vắng. */
        const cu = a.lich_su ? 1 : 0;
        const late = !cu && today > scheduleRow.week_end.slice(0, 10);
        const now = nowIso();
        if (existing) {
          conn
            .prepare(
              `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?,
                      no_show_late = ?, no_show_settled_at = ?, no_show_cu = ? WHERE id = ?`,
            )
            .run(scheduleRow.planned_period_id, p.userId, now, late ? 1 : 0, cu ? now : null, cu, existing.id);
        } else {
          /* Cố ý KHÔNG ghi entered_by: người báo "không có bài" chưa nhập điểm nào (MT-P09). */
          conn
            .prepare(
              `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu)
               VALUES (?,?,?,?,?,?,?,?)`,
            )
            .run(attemptId, skill, scheduleRow.planned_period_id, p.userId, now, late ? 1 : 0, cu ? now : null, cu);
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
                  no_show_late = 0, no_show_settled_at = NULL, no_show_cu = 0 WHERE id = ?`,
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
    /* PR-Dọn (quét #19): ngày có kết quả MỚI gửi lên không được ở tương lai (theo ngày nghiệp vụ). */
    if (patch.resultDate && patch.resultDate > demoToday()) throw badRequest('Ngày có kết quả không được ở tương lai.');
    chuTuDo(patch.note, 'Ghi chú', 2000);   // PR-Dọn (Q4, quét #24)

    let raw: number | null = existing?.raw_score ?? null;
    let total: number | null = existing?.raw_total ?? null;
    let crit: (number | null)[] = [existing?.c1 ?? null, existing?.c2 ?? null, existing?.c3 ?? null, existing?.c4 ?? null];
    let band: number | null = existing?.band ?? null;

    /* T10 (PR-MTa): band trực tiếp — bậc 0.5 trong 0..9; không gửi cùng số câu / tiêu chí có giá trị. */
    const coBand = patch.band !== undefined;
    if (coBand && patch.band !== null) { const loi = kiemBand(patch.band); if (loi) throw badRequest(loi); }
    if (coBand && isRawSkill(skill) && patch.rawScore !== undefined) throw badRequest('Nhập số câu hoặc band, không cả hai.');
    if (coBand && patch.band !== null && Array.isArray(patch.criteria) && patch.criteria.some((v) => v !== null && v !== undefined && (v as unknown) !== '')) {
      throw badRequest('Nhập band hoặc 4 tiêu chí, không cả hai.');
    }
    try {
      if (coBand) {
        raw = null;
        crit = [null, null, null, null];
        band = patch.band ?? null;
        if (patch.rawTotal !== undefined) total = patch.rawTotal;
      } else if (isRawSkill(skill)) {
        if (patch.rawScore !== undefined) raw = patch.rawScore;
        if (patch.rawTotal !== undefined) total = patch.rawTotal;
        /* Ô chỉ có band nhập thẳng (T10) mà lần ghi này không đụng số câu → giữ band. */
        if (raw !== null || patch.rawScore !== undefined) band = raw === null || raw === undefined ? null : bandFromRaw(skill, raw);
        crit = [null, null, null, null];
      } else if (isCriteriaSkill(skill)) {
        if (patch.criteria !== undefined) {
          if (!Array.isArray(patch.criteria) || patch.criteria.length !== 4) throw badRequest('Cần đủ bốn ô tiêu chí.');
          crit = patch.criteria.map((v) => (v === null || v === undefined || v === ('' as any) ? null : Number(v)));
          /* PR-S4F #10: "abc" (NaN) hay 6.3 không được thành band — tiêu chí chỉ nhận 0–9, bậc 0.5. */
          if (crit.some((v) => v !== null && (!Number.isFinite(v) || v < 0 || v > 9 || !Number.isInteger(v * 2)))) {
            throw badRequest('Điểm tiêu chí phải là số từ 0 đến 9, bậc 0.5 (ví dụ 6 hoặc 6.5).');
          }
        }
        if (patch.criteria !== undefined || crit.some((v) => v !== null)) band = bandFromCriteria(crit);
        raw = null;
      }
    } catch (e) {
      if (e instanceof ScoreError) throw badRequest(e.message);
      throw e;
    }

    /*
     * RB-5 — SỬA MỘT Ô ĐÃ CÓ ĐIỂM THÌ PHẢI NÓI VÌ SAO.
     *
     * Câu lỗi của dấu "-" đã nhắc tới "hiệu chỉnh điểm có ghi lý do" từ lâu mà đường ấy chưa tồn tại (kiểm kê RB-5).
     * Nay nó tồn tại và là ĐƯỜNG DUY NHẤT: không có lý do thì không đổi được một con số mà người khác đã đọc. So trên
     * giá trị SẼ ĐƯỢC LƯU (điểm thô / bốn tiêu chí / band), chưa ghi gì nên chặn ở đây là cuộn lại sạch. Lưu lại đúng
     * con số cũ không phải hiệu chỉnh — tự lưu không bị hỏi lý do.
     */
    const daCoDiem = (existing?.band ?? null) !== null || (existing?.raw_score ?? null) !== null;
    /* T7 + T22 (PR-MTa): sửa giá trị hay xoá trắng ô đã có điểm → lý do tuỳ chọn (menu "Huỷ điểm" tự đòi lý do ở `huyDiem`). */

    /*
     * NGƯỜI NHẬP CHỈ CÓ KHI Ô CÓ GIÁ TRỊ (MT-P09). Xoá điểm là một thao tác, nhưng KHÔNG phải một lần "nhập điểm":
     * ô trống mà còn ghi "Người nhập: X" là dùng tác giả của thao tác làm bằng chứng rằng đã có điểm. Ai đã sửa
     * gì, lúc nào vẫn nằm trong nhật ký (`score.edit`) — hiện ở "Lịch sử thay đổi" của hồ sơ Test.
     */
    const hasValue = raw !== null || band !== null || crit.some((v) => v !== null);
    const enteredBy = hasValue ? p.userId : null;
    const enteredAt = hasValue ? nowIso() : null;
    /*
     * PR-HSM (Q6): nhận xét + GV chấm gửi kèm thì ghi luôn; ô VỪA MẤT HẾT điểm (Huỷ điểm, Thi lại, xoá tay — đều qua đây)
     * thì cả ba về NULL: nhận xét nói về bài đã chấm, thi lại là bài mới. Bản cũ còn trong `before` của nhật ký.
     */
    const matHet = !hasValue && daCoDiem;
    const comment = matHet ? null : nxGt !== undefined ? nxGt : existing?.comment ?? null;
    const exUser = matHet ? null : gv !== undefined ? gv?.userId ?? null : existing?.examiner_user_id ?? null;
    const exName = matHet ? null : gv !== undefined ? gv?.name ?? null : existing?.examiner_name ?? null;
    /*
     * PR-Pb2-b (Q13): ngày NGHIỆP VỤ lần đầu ô có điểm — sửa sau giữ nguyên, ô mất hết điểm về NULL (nhập lại tính lần đầu mới).
     * PR-S6F-a (Q18, P0): "có điểm" = điểm THẬT (điểm thô hoặc band) — ô tiêu chí mới gõ 1/4 (band còn NULL) chưa phải lần nhập đầu.
     */
    const coDiemThat = raw !== null || band !== null;
    const nhapDau = coDiemThat ? existing?.nhap_dau_ngay ?? today : null;
    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, c1=?, c2=?, c3=?, c4=?, band=?,
                                        result_date=?, entered_by=?, entered_at=?, note=?,
                                        comment=?, examiner_user_id=?, examiner_name=?, nhap_dau_ngay=? WHERE id=?`,
        )
        .run(raw, total, crit[0], crit[1], crit[2], crit[3], band, resultDate, enteredBy, enteredAt,
             patch.note !== undefined ? patch.note : existing.note ?? null, comment, exUser, exName, nhapDau, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, c1, c2, c3, c4, band,
                                          result_date, entered_by, entered_at, note, comment, examiner_user_id, examiner_name, nhap_dau_ngay)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, raw, total, crit[0], crit[1], crit[2], crit[3], band,
             resultDate, enteredBy, enteredAt, patch.note ?? null, comment, exUser, exName, nhapDau);
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
                  no_show_late = 0, no_show_settled_at = NULL, no_show_cu = 0 WHERE attempt_id = ? AND skill = ?`,
        )
        .run(attemptId, skill);
    }

    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill);
    const afterGhi = (patch.lyDo || hoanTat.hoanTat)
      ? {
          ...(after as any),
          ...(patch.lyDo ? { lyDo: String(patch.lyDo).trim() } : {}),
          ...(hoanTat.hoanTat ? { sauHoanTat: true } : {}),
        }
      : after;
    writeAudit({
      actorUserId: p.userId,
      action: path === 'override' ? 'score.override' : path === 'lich_su' ? 'score.lich_su' : 'score.edit',
      entityType: 'assessment_attempt', entityId: attemptId, entityLabel: skill,
      before, after: afterGhi,
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

/**
 * Chọn hàng cho bảng điểm FT (PR-DL): theo TUẦN kế hoạch (như cũ; số/null ở nơi gọi cũ) hoặc theo SỐ LƯỢT MT — mọi attempt `mock`
 * số lượt đó của lớp, KHÔNG lọc tuần, nên có cả lượt đã qua (MT lịch sử) và lượt chưa xếp tuần (PR-LM, tuần NULL).
 */
export type ChonLuotFT = { theo: 'tuan'; periodId: number | null } | { theo: 'luot'; attemptNo: number };

/** Bảng nhập điểm theo lớp × tuần kế hoạch, hoặc lớp × số lượt MT (`ChonLuotFT`). */
export function classScoreSheet(
  p: Principal, classId: number, chonVao: number | null | ChonLuotFT, today: string = demoToday(),
) {
  const chon: ChonLuotFT = chonVao !== null && typeof chonVao === 'object' ? chonVao : { theo: 'tuan', periodId: chonVao };
  if (chon.theo === 'luot' && !(Number.isInteger(chon.attemptNo) && chon.attemptNo > 0)) {
    throw badRequest('Số lượt MT không hợp lệ.');
  }
  const conn = db();
  const cls = conn.prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id=c.branch_id WHERE c.id=?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  /* Kiểm quyền TRƯỚC mọi truy vấn dữ liệu HV — kể cả việc chốt "không dự thi" ngay dưới (PR-DL). */
  requireXemLuotCham(p, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  /* Chốt "không dự thi" ở đường đọc — idempotent, thay cho tác vụ nền (PR-G). */
  settleNoShows(today);
  /*
   * BẢNG NÀY LÀ BẢNG MOCK TEST. Lớp thường có bảng riêng (`regularSheet`): chấm theo số câu đúng/tổng số câu, bài tên
   * "Giữa khoá"/"Cuối khoá". Mở nhầm bảng là đọc sai cả kết quả — bảng này gọi mọi lượt là "MT{n}" và chấm theo band.
   * Chặn ở MÁY CHỦ chứ không chỉ ở giao diện: gõ thẳng đường dẫn vẫn phải ra đúng bảng.
   */
  if (isRatioClass(classId)) {
    throw badRequest('Lớp thường dùng bảng điểm riêng (số câu đúng / tổng số câu), không dùng bảng điểm Mock Test.');
  }
  const period = chon.theo === 'tuan' && chon.periodId
    ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(chon.periodId) as any) : null;

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
  } else if (chon.theo === 'luot') {
    sql += ` AND a.kind = 'mock' AND a.attempt_no = ?`;
    params.push(chon.attemptNo);
  }
  sql += ' ORDER BY s.full_name';
  const attempts = conn.prepare(sql).all(...params) as any[];

  return {
    classId, classCode: cls.code, branchName: cls.branch_name,
    period: period ? { id: period.id, code: period.code, weekStart: period.week_start, weekEnd: period.week_end } : null,
    editableSkills: editableSkills(p, classId, ENTRY_SKILLS),
    rows: (() => {
      const bundle = loadBundle(attempts.map((a) => a.id));
      /* R11: một câu hỏi cho cả bảng (`dotHoanTatMany`) — không hỏi lẻ từng dòng. */
      const hoanTatOf = dotHoanTatMany(attempts.map((a) => a.id), today);
      return attempts.map((a) => {
      const scores = bundle.scores.get(a.id) ?? [];
      const skips = bundle.skips.get(a.id) ?? [];
      const hoanTat = hoanTatOf.get(a.id) ?? { hoanTat: false, chuNhatCuoi: null };
      return {
        attemptId: a.id,
        studentId: a.student_id,
        studentName: a.full_name,
        studentCode: a.student_code,
        attemptNo: a.attempt_no,
        status: a.status,
        cells: skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id), hoanTat),
        result: resultOf(a, scores, skips),
        hoanTat: hoanTat.hoanTat,
        chuNhatCuoi: hoanTat.chuNhatCuoi,
      };
      });
    })(),
  };
}

export { notify };

/**
 * ĐƯỜNG DẪN TỚI ĐIỂM CỦA MỘT LƯỢT — chọn ĐÚNG MÀN theo loại bài.
 *
 * Bài `mock` về màn Mock Test; bài giữa/cuối khoá của lớp thường về bảng điểm của lớp đó.
 * Mở nhầm màn là đọc sai cả kết quả: màn Mock Test gọi mọi lượt là "MT{n}" và chấm theo
 * band, cả hai đều sai với một bài Progress Test.
 *
 * Máy chủ dựng sẵn đường dẫn cho mọi danh sách việc, để không màn nào phải tự ghép lấy.
 */
export function attemptHref(a: { id: number; kind?: string | null; classId?: number | null }): string {
  return duongDotTest(a);   // PR-UXF-b (Q9): một đường — giữ tên để không sửa nơi gọi
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
  /* Nhớ theo request (rà #126, tốc độ): màn Công việc dựng ô của cùng lượt nhiều lần — không tra lại mã tuần mỗi lần. */
  const w = r.to_period_id
    ? nho(`ma-tuan:${r.to_period_id}`, () => db().prepare('SELECT code FROM report_periods WHERE id = ?').get(r.to_period_id) as any)
    : null;
  return { id: r.id, decideBy: r.decide_by, toWeek: w?.code ?? null, moveNo: r.move_no };
}
