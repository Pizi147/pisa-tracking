import {
  ATTEMPT_KIND_SHORT, PROGRAMME_TEMPLATES, categoryOf, cycleDeadline, issuesForTopic,
  planDueDate, planEndDefault, programmeOf, ratioResult, weeklyUpdateDue,
  type AttemptKind,
} from '../../../shared/domain/index.ts';
import { addDays, normalizeName, nowIso, padCode } from '../util.ts';
import { ensurePeriod } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW, expectationFor, failingEntrySkills } from '../fasttrack/scoring.ts';
import { raiseSignal } from '../cases/signals.ts';
import { DEMO_DATE, type CaseSeed, type CycleSeed, type StudentSeed, type TestSeed } from './journeys.ts';
import { STUDENTS } from './students.ts';

/**
 * DỰNG DỮ LIỆU TỪ KỊCH BẢN HÀNH TRÌNH — mục 11.2.
 *
 * File này KHÔNG chứa quyết định nghiệp vụ nào. Nó chỉ đọc kịch bản trong `students.ts` rồi
 * viết xuống đúng các bảng, theo đúng thứ tự đời thật:
 *
 *   học viên → ghi danh → lộ trình → lượt đánh giá → điểm → case → phương án → cập nhật
 *
 * BA LUẬT CỨNG, kiểm ngay khi ghi chứ không để sót vào dữ liệu:
 *   1. Không có ngày "đã hoàn thành" nào nằm sau ngày demo.
 *   2. Không lượt nào ở tương lai mà có điểm.
 *   3. Ngày ghi kết quả luôn ≥ ngày phương án bắt đầu.
 */

const NOW = nowIso();

/** Chặn mọi ngày "đã xảy ra" vượt quá ngày demo — dữ liệu mẫu phải theo đúng luật nó dạy. */
function past(d: string | null | undefined): string | null {
  if (!d) return null;
  return d > DEMO_DATE ? DEMO_DATE : d;
}

/** Số câu đúng tương ứng một band, để điểm thô của Listening/Reading hợp lệ. */
function rawFor(skill: 'listening' | 'reading', band: number): number {
  const table = skill === 'listening' ? LISTENING_BY_RAW : READING_BY_RAW;
  for (let raw = 40; raw >= 0; raw -= 1) if (table[raw] <= band) return raw;
  return 0;
}

/** Bốn tiêu chí quanh band, để ô Writing/Speaking có dữ liệu chi tiết đọc được. */
function criteriaFor(band: number): [number, number, number, number] {
  const step = 0.5;
  return [band, Math.max(0, band - step), band, Math.min(9, band + step)];
}

export type BuildCtx = {
  conn: any;
  adminId: number;
  branchId: Map<string, number>;
  classId: Map<string, number>;
  /** Mã người (T_*, MGR_*) → id tài khoản. */
  userId: Map<string, number>;
  /** Mã lớp → mã chi nhánh, để tra người của đúng nơi. */
  classBranch: Map<string, string>;
  nextStudentCode: () => string;
};

export type BuildCounts = {
  students: number; cycles: number; attempts: number; scores: number; skips: number;
  cases: number; interventions: number; followups: number; milestones: number;
  /** Tín hiệu từ điểm — đếm riêng vì nó KHÔNG phải case (mục 6.2). */
  signals: number;
};

export function buildJourneys(ctx: BuildCtx): BuildCounts {
  const { conn, adminId } = ctx;
  const counts: BuildCounts = {
    students: 0, cycles: 0, attempts: 0, scores: 0, skips: 0,
    cases: 0, interventions: 0, followups: 0, milestones: 0, signals: 0,
  };

  const journey = (sid: number, cycleId: number | null, type: string, date: string,
                   title: string, detail: string | null, ref?: { table: string; id: number }) =>
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail,
                                     ref_table, ref_id, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(sid, cycleId, type, date, title, detail, ref?.table ?? null, ref?.id ?? null, adminId, NOW);

  for (const s of STUDENTS) {
    /* ---------------------------------------------------------------- 1. học viên */
    const info = conn
      .prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, dob, branch_id, status,
                               consultant_name, note, archived_at, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(ctx.nextStudentCode(), s.name, normalizeName(s.name), s.dob ?? null,
           ctx.branchId.get(s.branch)!,
           s.status === 'finished' ? 'finished' : 'active',
           null, null, null, NOW);
    if (s.status === 'finished' && s.finishedAt) {
      conn.prepare('UPDATE students SET finished_at = ? WHERE id = ?')
        .run(s.finishedAt, Number(info.lastInsertRowid));
    }
    const sid = Number(info.lastInsertRowid);
    counts.students += 1;

    /* ---------------------------------------------------------------- 2. ghi danh */
    for (const e of s.enrollments) {
      const cid = ctx.classId.get(e.class);
      if (!cid) throw new Error(`Kịch bản ${s.code} nhắc tới lớp không có: ${e.class}`);
      conn
        .prepare(
          `INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, end_reason, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(sid, cid, e.status === 'active' ? 'active' : e.status, e.from, e.to ?? null,
             e.handover ?? null, NOW);
      journey(sid, null, 'enrollment', e.from, `Vào lớp ${e.class}`, null);
      if (e.to) {
        /*
         * CHUYỂN LỚP VÀ KẾT THÚC LÀ HAI SỰ KIỆN KHÁC NHAU, và ghi chú bàn giao nằm ở sự
         * kiện chuyển lớp — đó là chỗ giáo viên mới đọc để biết em đang dở dang chuyện gì.
         */
        journey(
          sid, null, e.status === 'transferred' ? 'transfer' : 'finish', e.to,
          e.status === 'transferred' ? `Rời lớp ${e.class}` : `Kết thúc lớp ${e.class}`,
          e.handover ?? null,
        );
      }
    }

    /* ---------------------------------------------------------------- 3. từng lộ trình */
    /** Case đã đóng của CHÍNH em này, theo hạng mục — để case tái diễn nối vào đúng cái cũ. */
    const closedByTopic = new Map<string, number>();

    for (const cy of s.cycles) {
      const cycleId = insertCycle(ctx, sid, cy);
      counts.cycles += 1;
      journey(
        sid, cycleId, 'cycle_start', cy.startedAt,
        cy.route ? `Bắt đầu lộ trình ${cy.route}` : `Bắt đầu chương trình ${classProgramme(ctx, cy.classCode)}`,
        cy.target !== null && cy.target !== undefined ? `Target ${cy.target}` : null,
        { table: 'learning_cycles', id: cycleId },
      );

      /* --------------------------------------------------- 3a. lượt đánh giá và điểm */
      const attemptByNo = new Map<number, number>();
      for (const t of cy.tests) {
        const aid = insertAttempt(ctx, sid, cycleId, cy, t, counts);
        attemptByNo.set(t.no, aid);
        if (t.status === 'done') {
          journey(
            sid, cycleId, 'mock_result', weekEnd(t.week),
            `Kết quả ${testLabel(t)}`, scoreLine(t),
            { table: 'assessment_attempts', id: aid },
          );
        }
      }

      /* --------------------------------------------------- 3b. case và phương án */
      for (const c of cy.cases ?? []) {
        const caseId = insertCase(ctx, sid, cycleId, cy, c, attemptByNo, closedByTopic, counts);
        if (c.status === 'done') closedByTopic.set(c.topic, caseId);
      }

      /* --------------------------------------------------- 3c. tín hiệu từ điểm */
      for (const t of cy.tests) {
        const aid = attemptByNo.get(t.no);
        if (aid) academicSignals(ctx, sid, cycleId, aid, counts);
      }

      /* Lộ trình đã khép: ghi kết quả cuối, và nếu là kỳ thi thật thì nói rõ ra. */
      if (cy.status === 'completed' && cy.outcomeNote) {
        journey(
          sid, cycleId, cy.examMonth && cy.outcome !== 'unknown' ? 'exam_result' : 'finish',
          cy.endedAt ?? cy.startedAt,
          cy.outcome === 'reached' ? 'Đạt mục tiêu lộ trình'
            : cy.outcome === 'not_reached' ? 'Chưa đạt mục tiêu lộ trình'
            : 'Kết thúc lộ trình',
          cy.outcomeNote, { table: 'learning_cycles', id: cycleId },
        );
      }
    }
  }

  return counts;
}

/* ================================================================= chi tiết từng bảng */

function classProgramme(ctx: BuildCtx, classCode: string): string {
  const row = ctx.conn.prepare('SELECT programme_code FROM classes WHERE id = ?')
    .get(ctx.classId.get(classCode)) as any;
  const code = row?.programme_code as keyof typeof PROGRAMME_TEMPLATES | null;
  return code ? PROGRAMME_TEMPLATES[code].name : classCode;
}

function insertCycle(ctx: BuildCtx, sid: number, cy: CycleSeed): number {
  const { conn } = ctx;
  const programme = programmeOf(
    (conn.prepare('SELECT kind FROM classes WHERE id = ?').get(ctx.classId.get(cy.classCode)) as any)?.kind,
  );
  const info = conn
    .prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                    start_period_id, exam_month, exam_period_id,
                                    baseline_score, baseline_source, baseline_note,
                                    started_at, ended_at, status, outcome, outcome_note, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      sid, cy.seq, cy.route ?? null, programme, cy.target ?? null,
      cy.startWeek ? ensurePeriod(cy.startWeek).id : null,
      cy.examMonth ?? null,
      cy.examWeek ? ensurePeriod(cy.examWeek).id : null,
      cy.baseline?.score ?? null, cy.baseline?.source ?? null, cy.baseline?.note ?? null,
      cy.startedAt, cy.endedAt ?? null,
      cy.status, cy.outcome ?? null, cy.outcomeNote ?? null, NOW,
    );
  return Number(info.lastInsertRowid);
}

function testLabel(t: TestSeed): string {
  return t.kind === 'mock' ? `MT${t.no}` : ATTEMPT_KIND_SHORT[t.kind as AttemptKind] ?? t.kind;
}

/** Chủ nhật của tuần — mốc "đã xong" của một lượt, và hạn gốc để tính hạn nhập điểm. */
function weekEnd(week: string): string {
  return addDays(week, 6);
}

function scoreLine(t: TestSeed): string | null {
  if (t.bands) {
    return Object.entries(t.bands).map(([k, v]) => `${k}: ${v}`).join(' · ');
  }
  if (t.ratios) {
    return Object.entries(t.ratios).map(([k, v]) => `${k}: ${v![0]}/${v![1]}`).join(' · ');
  }
  return null;
}

function insertAttempt(
  ctx: BuildCtx, sid: number, cycleId: number, cy: CycleSeed, t: TestSeed, counts: BuildCounts,
): number {
  const { conn } = ctx;
  const classIdOf = ctx.classId.get(cy.classCode)!;
  const period = ensurePeriod(t.week);
  /*
   * MỘT LƯỢT TRONG TƯƠNG LAI LUÔN Ở TRẠNG THÁI KẾ HOẠCH VÀ KHÔNG BAO GIỜ CÓ ĐIỂM.
   * Kịch bản có thể viết nhầm; chỗ này chặn lại thay vì để dữ liệu sai lọt vào bản demo.
   */
  const inFuture = t.week > DEMO_DATE;
  /*
   * "ĐÃ XONG" NGHĨA LÀ ĐỦ ĐIỂM MỌI KỸ NĂNG TRONG PHẠM VI YÊU CẦU — không phải "tuần đã trôi qua".
   *
   * Kịch bản khai `status: 'done'` để nói "đợt này đã diễn ra", nhưng một số kịch bản cố ý
   * chỉ có điểm vài kỹ năng (ví dụ J08 mới nhập 2/4). Tin theo lời khai thì màn hình ghi
   * "Đã xong" ngay cạnh câu "Có điểm 2/4 kỹ năng" — hai câu nói ngược nhau trên cùng một
   * thẻ. Nên ở đây tính lại từ chính số điểm trong kịch bản.
   */
  const scopeSkills = (['listening', 'reading', 'writing', 'speaking'] as const).filter((k) => k !== t.skip);
  const scoredKeys = new Set<string>([
    ...Object.entries(t.bands ?? {}).filter(([, v]) => v !== undefined && v !== null).map(([k]) => k),
    ...Object.entries(t.ratios ?? {}).filter(([, v]) => !!v).map(([k]) => k),
  ]);
  const skillComplete = (skill: string) =>
    skill === 'writing'
      ? (scoredKeys.has('writing1') && scoredKeys.has('writing2')) || scoredKeys.has('writing')
      : scoredKeys.has(skill);
  const allScored = scopeSkills.length > 0 && scopeSkills.every(skillComplete);
  const status = inFuture ? 'planned' : t.status === 'done' && !allScored ? 'planned' : t.status;

  const info = conn
    .prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id,
                                        planned_period_id, plan_source, status,
                                        target_at_attempt, note,
                                        deadline_override, deadline_override_by,
                                        deadline_override_at, deadline_override_reason,
                                        created_by, created_at)
       VALUES (?,?,?,?,?,?, 'manual', ?,?,?,?,?,?,?,?,?)`,
    )
    .run(cycleId, sid, t.no, t.kind, classIdOf, period.id, status,
         cy.target ?? null, t.note ?? null,
         t.deadlineOverride?.date ?? null,
         t.deadlineOverride ? ctx.userId.get(t.deadlineOverride.by) ?? ctx.adminId : null,
         t.deadlineOverride ? NOW : null,
         t.deadlineOverride?.reason ?? null,
         ctx.adminId, NOW);
  const aid = Number(info.lastInsertRowid);
  counts.attempts += 1;

  if (t.skip) {
    conn
      .prepare('INSERT INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) VALUES (?,?,?,?,?)')
      .run(aid, t.skip, 'Quản lý chốt trước: đợt này không yêu cầu kỹ năng đó.', ctx.adminId, NOW);
    counts.skips += 1;
  }

  /*
   * BỐN DÒNG LỊCH KỸ NĂNG. Mặc định cả bốn cùng tuần của đợt; kịch bản nào khai `skillWeeks`
   * thì kỹ năng đó có tuần riêng và được đánh dấu 'manual' — một người đã chốt riêng cho nó.
   *
   * Trạng thái thi để 'scheduled', trừ kỹ năng đã có điểm trong chính kịch bản này: có điểm
   * thì chắc chắn đã thi. KHÔNG dựng sẵn trạng thái vắng ở đây — vắng là một xác nhận của
   * người, và bộ demo nào cần nó thì khai riêng.
   */
  for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
    const ownWeek = t.skillWeeks?.[skill];
    const skillPeriod = ownWeek ? ensurePeriod(ownWeek) : period;
    const didSit = !inFuture && skillComplete(skill);
    conn
      .prepare(
        `INSERT INTO attempt_skills (attempt_id, skill, required, scope_reason, planned_period_id,
                                     plan_source, sit_status, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(
        aid, skill, t.skip === skill ? 0 : 1,
        t.skip === skill ? 'Quản lý chốt trước: đợt này không yêu cầu kỹ năng đó.' : null,
        skillPeriod.id, ownWeek ? 'manual' : 'auto',
        didSit ? 'sat' : 'scheduled', NOW,
      );
  }

  /*
   * EM VẮNG BUỔI THI (mục 10.6) — chỉ dựng khi kịch bản khai rõ.
   *
   * Vắng là một XÁC NHẬN CỦA NGƯỜI, có tên và có thời điểm; ô điểm trống không đủ để kết
   * luận. Nên ở đây ghi đủ `sit_by` và `sit_note` — nếu không, bộ kiểm tra bắt ngay một
   * trạng thái vắng không ai nhận đã xác minh.
   */
  if (t.absent) {
    const core = conn
      .prepare(
        `SELECT user_id FROM teacher_assignments
          WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`,
      )
      .get(ctx.classId.get(cy.classCode)) as any;
    const who = ctx.userId.get(t.absent.by ?? '') ?? core?.user_id ?? ctx.adminId;
    conn
      .prepare(
        `UPDATE attempt_skills
            SET sit_status = 'absent', sit_by = ?, sit_at = ?, sit_note = ?,
                absence_move_count = ?, updated_at = ?
          WHERE attempt_id = ? AND skill = ?`,
      )
      .run(who, NOW, t.absent.note ?? 'GVCN xác minh học viên không tới buổi thi',
           t.absent.moveCount ?? 0, NOW, aid, t.absent.skill);

    /*
     * ĐỀ NGHỊ ĐANG CHỜ DUYỆT: dời sang tuần kế tiếp của lịch đang có, hạn trả lời là ngày
     * TRƯỚC khi tuần ấy bắt đầu. Cả hai con số suy từ chính lịch, không gõ tay — gõ tay thì
     * bộ demo và luật thật sẽ lệch nhau ngay lần đầu ai đó đổi lịch.
     */
    if (t.absent.pending) {
      const cur = t.skillWeeks?.[t.absent.skill] ?? t.week;
      const to = ensurePeriod(addDays(cur, 7));
      conn
        .prepare(
          `INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id,
                                            reason, requested_by, requested_on, decide_by, status,
                                            idempotency_key, created_at)
           VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?, ?)
           ON CONFLICT(idempotency_key) DO NOTHING`,
        )
        .run(
          aid, t.absent.skill, (t.absent.moveCount ?? 0) + 1,
          ensurePeriod(cur).id, to.id,
          t.absent.reason ?? 'Em ốm, gia đình đã báo trước',
          who, DEMO_DATE, addDays(to.weekStart, -1),
          `seed-move:${aid}:${t.absent.skill}`, NOW,
        );
    }
  }

  /*
   * TUẦN KẾ HOẠCH HOÀN TẤT của đợt = tuần MUỘN NHẤT trong các kỹ năng bắt buộc (mục 10.7).
   * Đợt tách tuần vì thế nằm ở tuần của phần thi cuối cùng, và bảng kết quả theo tuần đếm
   * nó đúng một lần ở đó.
   */
  const latest = conn
    .prepare(
      `SELECT ask.planned_period_id AS id FROM attempt_skills ask
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id = ? AND ask.required = 1
        ORDER BY pr.week_start DESC LIMIT 1`,
    )
    .get(aid) as any;
  if (latest?.id && latest.id !== period.id) {
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(latest.id, aid);
  }

  if (inFuture) return aid;

  const enteredAt = past(t.enteredOn ?? weekEnd(t.week)) ?? weekEnd(t.week);
  const enteredIso = `${enteredAt}T09:00:00.000Z`;

  /* Fast Track: band từng ô nhập. Ô không có trong kịch bản = CHƯA NHẬP, không ghi dòng nào. */
  for (const [skill, band] of Object.entries(t.bands ?? {})) {
    if (band === undefined || band === null) continue;
    const raw = skill === 'listening' || skill === 'reading'
      ? rawFor(skill as 'listening' | 'reading', band) : null;
    const cr = skill === 'listening' || skill === 'reading' ? null : criteriaFor(band);
    conn
      .prepare(
        `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, c1, c2, c3, c4,
                                        band, result_date, entered_by, entered_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(aid, skill, raw, raw === null ? null : 40,
           cr?.[0] ?? null, cr?.[1] ?? null, cr?.[2] ?? null, cr?.[3] ?? null,
           band, enteredAt, ctx.adminId, enteredIso);
    counts.scores += 1;
  }

  /* Normal: điểm đạt / tổng điểm. Không quy về band, không quy về phần trăm. */
  for (const [skill, pair] of Object.entries(t.ratios ?? {})) {
    if (!pair) continue;
    conn
      .prepare(
        `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total,
                                        band, result_date, entered_by, entered_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(aid, skill, pair[0], pair[1], null, enteredAt, ctx.adminId, enteredIso);
    counts.scores += 1;
  }

  return aid;
}

/**
 * PHÂN CÔNG VÀ KHÉP LẠI case Ý thức/Khác mà engine vừa tự mở.
 *
 * Người phụ trách và người thực hiện lấy GVCN của lớp — đúng luật mục 2.3 (case Ý thức/Khác
 * thuộc về giáo viên chủ nhiệm). Đợt cách ngày demo hơn ba tuần thì hai việc trao đổi coi như
 * đã làm xong và case đã khép; đợt gần đây thì để nguyên là việc đang chờ.
 */
/**
 * GVCN XEM TÍN HIỆU Ý THỨC/KHÁC RỒI QUYẾT ĐỊNH MỞ CASE — việc của NGƯỜI, không của máy.
 *
 * Hàm này dựng lại đúng thứ một GVCN làm sau khi thấy tín hiệu: đặt tên case, viết mô tả,
 * và lên hai việc trao đổi (với em, với phụ huynh). Bộ demo phải tự làm phần này vì engine
 * không còn làm hộ nữa — và đó chính là điều mục 6.2 muốn.
 */
/**
 * TÍN HIỆU HỌC THUẬT CỦA MỘT ĐỢT, và ba kết cục có thật của chúng.
 *
 * Mọi môn dưới kỳ vọng đều sinh một tín hiệu — đó là luật (mục 6.2). Nhưng một tín hiệu
 * không nằm mãi ở trạng thái chờ, nên bộ demo phải bày ra cả ba đường nó có thể đi:
 *
 *   linked   kịch bản có case cho hạng mục đó  → giáo viên đã xác minh và mở/nối case
 *   noted    đợt đã xa mà kịch bản không có case → giáo viên đã xem, thấy không cần mở case
 *   pending  đợt gần đây, chưa ai xem          → việc đang chờ, có hạn ba ngày
 *
 * Nếu để tất cả ở `pending` thì mở bản demo ra là một màn hình đỏ quá hạn, và người xem sẽ
 * học sai rằng trung tâm đang bỏ bê mọi học viên.
 */
function academicSignals(
  ctx: BuildCtx, sid: number, cycleId: number, attemptId: number, counts: BuildCounts,
) {
  const { conn } = ctx;
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a || a.status === 'cancelled') return;

  const scores = conn
    .prepare('SELECT skill, band, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ?')
    .all(attemptId) as any[];
  if (!scores.length) return;

  const prog = a.class_id
    ? (conn
        .prepare(
          `SELECT p.scoring_mode AS mode FROM classes c
             LEFT JOIN programmes p ON p.code = c.programme_code WHERE c.id = ?`,
        )
        .get(a.class_id) as any)
    : null;
  const isRatio = prog?.mode === 'ratio';

  /* Môn nào dưới kỳ vọng — hai cách chấm, hai phép so, không dùng chung công thức. */
  let failing: string[] = [];
  let expectation: number | null = null;
  if (isRatio) {
    failing = scores
      .filter((r) => r.raw_score !== null && r.raw_total)
      .filter((r) => ratioResult(r.raw_score, r.raw_total).outcome === 'fail')
      .map((r) => r.skill as string);
  } else {
    expectation = expectationFor(a.target_at_attempt, a.attempt_no);
    const entry: Record<string, number | null> = {};
    for (const r of scores) entry[r.skill] = r.band;
    const skips = (conn
      .prepare('SELECT skill FROM attempt_skills WHERE attempt_id = ? AND required = 0')
      .all(attemptId) as any[]).map((r) => r.skill as string);
    failing = failingEntrySkills(expectation, entry as any, skips);
  }
  if (!failing.length) return;

  const detectedOn = weekStartOfRow(conn, a) ?? DEMO_DATE;
  /* Ngày ghi nhận tín hiệu = lúc điểm được nhập, không lùi về thứ Hai tuần thi. */
  const raisedOn = past(detectedOn) ?? detectedOn;
  /*
   * HAI TUẦN: quá mốc này thì giáo viên bộ môn chắc chắn đã xem — hạn xác minh chỉ có ba
   * ngày. Để ngưỡng quá dài thì mở bản demo ra là một màn hình đỏ quá hạn, và người xem sẽ
   * học sai rằng trung tâm đang bỏ bê mọi học viên (mục 18.2).
   *
   * Trường hợp QUÁ HẠN vẫn phải có, nhưng là vài ca có chủ đích trong kịch bản, không phải
   * hệ quả của một ngưỡng đặt bừa.
   */
  const stale = addDays(detectedOn, 14) <= DEMO_DATE;

  for (const skill of failing) {
    const category = categoryOf('academic', skill);
    if (!category) continue;
    const signal = raiseSignal({
      actorUserId: ctx.adminId,
      studentId: sid, cycleId, attemptId, classId: a.class_id ?? null,
      track: 'academic', skill, category,
      band: scores.find((r) => r.skill === skill)?.band ?? null,
      expectation, sosLevel: a.sos_level ?? null,
      detectedOn, raisedOn,
    });
    counts.signals += 1;
    if (signal.status !== 'pending') continue;

    const owner = conn
      .prepare('SELECT owner_user_id AS id FROM case_signals WHERE id = ?')
      .get(signal.id) as any;
    const linked = conn
      .prepare(
        `SELECT id FROM sos_cases
          WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND track = 'academic'
            AND category = ? ORDER BY id DESC LIMIT 1`,
      )
      .get(sid, cycleId, category) as any;

    if (linked) {
      conn
        .prepare(
          `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
                  resolution_note = ?, updated_at = ? WHERE id = ?`,
        )
        .run(linked.id, owner?.id ?? ctx.adminId, NOW,
             'Giáo viên bộ môn đã xác minh và đưa vào case của kỹ năng này.', NOW, signal.id);
    } else if (stale) {
      conn
        .prepare(
          `UPDATE case_signals SET status = 'noted', resolved_by = ?, resolved_at = ?,
                  resolution_note = ?, updated_at = ? WHERE id = ?`,
        )
        .run(owner?.id ?? ctx.adminId, NOW,
             'Đã xem lại bài của em: lần này em mất điểm ở một dạng bài lạ, không phải vấn đề kéo dài. '
             + 'Chưa cần mở case, sẽ theo dõi ở đợt sau.',
             NOW, signal.id);
    }
    /* Còn lại để nguyên `pending`: đó là việc đang chờ, và bản demo cần có nó. */
  }
}

/** Thứ Hai của tuần kế hoạch hoàn tất của một đợt — chỉ dùng trong lúc dựng bộ demo. */
function weekStartOfRow(conn: any, a: any): string | null {
  if (!a.planned_period_id) return null;
  const r = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(a.planned_period_id) as any;
  return r?.week_start ?? null;
}

function behaviourCaseFromSignal(
  ctx: BuildCtx, sid: number, attemptId: number, classCode: string, detectedAt: string,
) {
  const { conn } = ctx;
  const signal = conn
    .prepare(`SELECT * FROM case_signals WHERE student_id = ? AND attempt_id = ? AND track = 'behaviour'`)
    .get(sid, attemptId) as any;
  if (!signal || signal.status !== 'pending') return;

  const attempt = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const core = conn
    .prepare(
      `SELECT user_id FROM teacher_assignments
        WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`,
    )
    .get(ctx.classId.get(classCode)) as any;
  const owner = core?.user_id ?? ctx.adminId;

  const info = conn
    .prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                              origin_kind, title, summary, detected_at, sos_level, status,
                              dedup_key, owner_user_id, reported_by, created_at)
       VALUES (?,?,?, 'behaviour', 'other', 'behaviour', 'mock', ?,?,?,?, 'open', ?,?,?,?)`,
    )
    .run(attemptId, sid, attempt.cycle_id ?? null,
         'Thông báo kết quả và phối hợp với gia đình',
         'Em có kết quả dưới kỳ vọng ở đợt đánh giá này. GVCN trao đổi với em và với phụ huynh '
         + 'để gia đình nắm tình hình và cùng phối hợp.',
         detectedAt, signal.sos_level,
         `behaviour:mock:${sid}:${attempt.cycle_id ?? 0}:${attemptId}`,
         owner, owner, NOW);
  const caseId = Number(info.lastInsertRowid);
  /* Case này cũng phải có phân loại — nó là "Khác" của nhóm Ý thức, và nói thẳng như vậy. */
  conn
    .prepare(
      `INSERT INTO case_issues (case_id, role, taxonomy_code, skill, created_by, created_at)
       VALUES (?, 'primary', 'student.behaviour.other', 'other', ?, ?)`,
    )
    .run(caseId, owner, NOW);

  conn
    .prepare(
      `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
              resolution_note = ?, updated_at = ? WHERE id = ?`,
    )
    .run(caseId, owner, NOW,
         'GVCN đã xem và quyết định mở case để trao đổi với em và phụ huynh.', NOW, signal.id);

  /*
   * HẠN PHƯƠNG ÁN Ý THỨC/KHÁC (mục 8.3): Gấp 3 ngày · Cần chú ý 5 ngày, tính từ lúc NHẬN
   * CASE. Đây vừa là hạn phải có phương án, vừa là hạn phải làm xong nó — không dùng mặc
   * định "Chủ nhật tuần tiếp theo" của học thuật, vì như thế là vượt hạn.
   */
  const due = planDueDate(detectedAt, signal.sos_level >= 3 ? 'urgent' : 'attention');
  for (const kind of ['talk_student', 'talk_parent'] as const) {
    conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, status, action_due,
                                         performer_user_id, recorded_by, migration_key, created_at)
         VALUES (?,?,?, 'planned', ?,?,?,?,?)
         ON CONFLICT(migration_key) DO NOTHING`,
      )
      .run(caseId, kind,
           kind === 'talk_parent' ? 'Trao đổi với phụ huynh' : 'Trao đổi với học viên',
           due, owner, owner, `behaviour:${attemptId}:${kind}`, NOW);
  }
}

function finishBehaviourCase(
  ctx: BuildCtx, sid: number, attemptId: number, classCode: string, detectedAt: string,
) {
  const { conn } = ctx;
  const row = conn
    .prepare(
      `SELECT id FROM sos_cases
        WHERE student_id = ? AND attempt_id = ? AND track = 'behaviour' AND origin_kind = 'mock'`,
    )
    .get(sid, attemptId) as any;
  if (!row) return;

  const core = conn
    .prepare(
      `SELECT user_id FROM teacher_assignments
        WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`,
    )
    .get(ctx.classId.get(classCode)) as any;
  const owner = core?.user_id ?? ctx.adminId;
  conn.prepare('UPDATE sos_cases SET owner_user_id = ?, reported_by = ?, updated_at = ? WHERE id = ?')
    .run(owner, owner, NOW, row.id);
  conn
    .prepare('UPDATE case_interventions SET performer_user_id = ?, recorded_by = ?, updated_at = ? WHERE case_id = ?')
    .run(owner, owner, NOW, row.id);

  /* Bốn tuần: đủ xa để hai việc trao đổi chắc chắn đã diễn ra. */
  const stale = addDays(detectedAt, 28) <= DEMO_DATE;
  if (!stale) return;

  const doneOn = past(addDays(detectedAt, 3))!;
  conn
    .prepare(
      `UPDATE case_interventions
          SET status = 'completed', started_date = ?, completed_date = ?,
              action_due = NULL, followup_due = NULL, closed_reason = 'done', updated_at = ?
        WHERE case_id = ?`,
    )
    .run(doneOn, doneOn, NOW, row.id);
  for (const iv of conn
    .prepare('SELECT id, kind FROM case_interventions WHERE case_id = ? ORDER BY id')
    .all(row.id) as any[]) {
    conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, next_step, cycle_no, cycle_due, late, created_at)
         VALUES (?,?,?,?,?,?,?,1,?,0,?)`,
      )
      .run(row.id, iv.id, doneOn, owner, 'improved',
           iv.kind === 'talk_parent'
             ? 'Đã gọi phụ huynh, gia đình nắm được tình hình và đồng ý phối hợp.'
             : 'Đã gặp em, em hiểu vì sao cần tập trung vào kỹ năng đang yếu.',
           'complete', cycleDeadline(detectedAt, 'behaviour'), NOW);
  }
  conn
    .prepare(
      `UPDATE sos_cases
          SET status = 'done', disposition = 'monitor',
              disposition_note = 'Đã trao đổi với em và phụ huynh sau đợt đánh giá này.',
              outcome = 'improved', closed_by = ?, closed_at = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(owner, doneOn, NOW, row.id);
}

function insertCase(
  ctx: BuildCtx, sid: number, cycleId: number, cy: CycleSeed, c: CaseSeed,
  attemptByNo: Map<number, number>, closedByTopic: Map<string, number>, counts: BuildCounts,
): number {
  const { conn } = ctx;
  const track = c.track ?? 'academic';
  const category = categoryOf(track, c.topic);
  const attemptId = c.fromTest ? attemptByNo.get(c.fromTest) ?? null : null;
  const originKind = c.originKind ?? (attemptId ? 'mock' : 'teacher_report');

  /*
   * ĐỊNH DANH CASE: một em × một hạng mục × một lộ trình = MỘT case.
   *
   * Hai ngoại lệ, và cả hai đều có chủ ý:
   *   · `parallel` — hai vấn đề khác nhau trong cùng một hạng mục, mở song song;
   *   · case TÁI DIỄN — case cũ đã đóng, mở case mới nối vào nó.
   * Cả hai đều để `dedup_key` trống, vì chúng cố tình KHÔNG phải cùng một bản ghi.
   */
  const previousCaseId = c.linksPreviousOf ? closedByTopic.get(c.linksPreviousOf) ?? null : null;
  /*
   * CASE TÁI DIỄN NHẬN LẠI KHOÁ CHỐNG TRÙNG, và case CŨ nhả khoá ra.
   *
   * Đây đúng là cách engine làm khi một case đã chốt mà em yếu lại: case cũ giữ nguyên kết
   * quả của nó nhưng thôi giữ chỗ, để case mới trở thành case đang có hiệu lực ở hạng mục
   * đó. Nếu case cũ giữ khoá thì case mới không tồn tại song song được, và lần yếu lại sau
   * nữa sẽ lặng lẽ ghi đè lên lịch sử.
   */
  if (previousCaseId) {
    conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?')
      .run(NOW, previousCaseId);
  }
  /*
   * CASE Ý THỨC/KHÁC KHÔNG DÙNG KHOÁ CHỐNG TRÙNG (mục 7.2).
   *
   * Nó là một ĐỢT NGẮN, và cùng một phân loại có thể có nhiều đợt nối nhau trong một khoá
   * học. Cái quyết định gộp hay mở đợt mới là CỬA SỔ BỐN NGÀY, không phải một cái khoá —
   * khoá chỉ chặn được đợt thứ hai ra đời, mà đợt thứ hai lại đúng là thứ phải có.
   *
   * Case học thuật thì ngược lại: một hạng mục đúng một case sống suốt khoá, nên có khoá.
   */
  const dedupKey = c.parallel || track === 'behaviour'
    ? null
    : `a:${sid}:${cycleId}:${category}`;

  const ownerId = c.owner ? ctx.userId.get(c.owner) ?? null : null;
  const reporterId = c.reportedBy ? ctx.userId.get(c.reportedBy) ?? null : (ownerId ?? null);

  const info = conn
    .prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                              dedup_key, parallel, previous_case_id, owner_user_id, title,
                              origin_kind, detected_at, reported_by, summary, urgency, sos_level,
                              status, disposition, disposition_note, outcome, outcome_note,
                              closed_by, closed_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      attemptId, sid, cycleId, track, c.topic, category,
      dedupKey, c.parallel ? 1 : 0, previousCaseId, ownerId, c.title ?? null,
      originKind, c.detectedAt, reporterId, c.summary, c.urgency ?? 'attention',
      c.sosLevel ?? null,
      c.status, c.disposition ?? null, c.dispositionNote ?? null,
      c.outcome ?? null, c.outcomeNote ?? null,
      c.status === 'done' ? (ctx.userId.get(c.closedBy ?? '') ?? ownerId ?? ctx.adminId) : null,
      c.status === 'done' ? past(c.closedOn ?? c.detectedAt) : null,
      NOW,
    );
  const caseId = Number(info.lastInsertRowid);
  counts.cases += 1;

  /*
   * PHÂN LOẠI VẤN ĐỀ, GHI NGAY CÙNG CASE (mục 6.4).
   *
   * Case không phân loại không vào được bảng phân tích của lớp lẫn trang Thực trạng, nên
   * một bộ demo thiếu phân loại sẽ bày ra hai màn hình rỗng. Mã phải thuộc đúng hạng mục —
   * sai thì dừng bộ dựng, vì một mã lạc hạng mục làm hỏng cả cột tổng hợp về sau.
   */
  if (!issuesForTopic(c.topic).some((i) => i.code === c.primaryCode)) {
    throw new Error(
      `Kịch bản sai: phân loại "${c.primaryCode}" không thuộc hạng mục "${c.topic}".`,
    );
  }
  conn
    .prepare(
      `INSERT INTO case_issues (case_id, role, taxonomy_code, skill, created_by, created_at)
       VALUES (?, 'primary', ?, ?, ?, ?)`,
    )
    .run(caseId, c.primaryCode, c.topic, reporterId ?? ownerId ?? ctx.adminId, NOW);

  /*
   * CASE Ý THỨC/KHÁC LÀ MỘT ĐỢT (mục 7.2): có số đợt, có cửa sổ gộp bốn ngày, và có các
   * báo cáo thành phần. Báo cáo đầu tiên chính là câu mô tả của case.
   */
  if (track === 'behaviour') {
    /* Đếm đợt theo PHÂN LOẠI (BTVN / chuyên cần / tham gia), không theo hạng mục chung. */
    const prior = (conn
      .prepare(
        `SELECT COUNT(*) n FROM sos_cases
          WHERE student_id = ? AND track = 'behaviour' AND topic = ? AND id < ?`,
      )
      .get(sid, c.topic, caseId) as any).n;
    const mergeUntil = addDays(c.detectedAt, 3);
    conn.prepare('UPDATE sos_cases SET episode_no = ?, merge_until = ? WHERE id = ?')
      .run(prior + 1, mergeUntil, caseId);

    const addReport = (on: string, by: number | null, skill: string | null, text: string) =>
      conn
        .prepare(
          `INSERT INTO case_reports (case_id, reported_by, source_skill, reported_on, observed_on,
                                     summary, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(caseId, by, skill, on, c.detectedAt, text, NOW);
    addReport(c.detectedAt, reporterId, null, c.summary);

    for (const r of c.reports ?? []) {
      if (r.on > mergeUntil || r.on < c.detectedAt) {
        throw new Error(
          `Kịch bản sai: báo cáo ngày ${r.on} nằm ngoài cửa sổ gộp ${c.detectedAt}–${mergeUntil} `
          + 'của case Ý thức/Khác. Ngoài cửa sổ thì theo luật nó phải là một đợt khác.',
        );
      }
      addReport(r.on, ctx.userId.get(r.by) ?? null, r.skill ?? null, r.summary);
      /* Có báo cáo bổ sung trong cùng đợt thì case được NÂNG LÊN GẤP (mục 7.2). */
      conn.prepare(`UPDATE sos_cases SET urgency = 'urgent', urgency_raised_at = ? WHERE id = ?`)
        .run(r.on, caseId);
    }
  }

  /* Mốc MỞ, và mốc TÁI DIỄN ở mỗi lượt sau mà em vẫn yếu ở hạng mục này. */
  const milestone = (kind: string, aid: number | null, no: number | null, on: string) => {
    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, sos_level,
                                      occurred_on, created_by, created_at, dedup_key)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(dedup_key) DO NOTHING`,
      )
      .run(caseId, kind, aid, no, c.sosLevel ?? null, on, ctx.adminId, NOW,
           `ms:${caseId}:${kind}:${no ?? 0}`);
    counts.milestones += 1;
  };
  milestone('opened', attemptId, c.fromTest ?? null, c.detectedAt);
  /*
   * MỐC TÁI PHÁT NẰM Ở CASE CŨ, trỏ sang chuyện vừa xảy ra.
   *
   * Mở hồ sơ ra đọc case cũ là thấy ngay "sau đó em yếu lại" — không phải đọc hết danh sách
   * case rồi tự nối hai cái với nhau bằng mắt.
   */
  if (previousCaseId) {
    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, sos_level,
                                      occurred_on, note, created_by, created_at, dedup_key)
         VALUES (?, 'recurrence', ?,?,?,?,?,?,?,?)
         ON CONFLICT(dedup_key) DO NOTHING`,
      )
      .run(previousCaseId, attemptId, c.fromTest ?? null, c.sosLevel ?? null, c.detectedAt,
           `Tái diễn ở một case mới: ${c.title ?? category}`, ctx.adminId, NOW,
           `rec:${previousCaseId}:${caseId}`);
    counts.milestones += 1;
  }
  /*
   * TÍN HIỆU Ý THỨC/KHÁC SAU MỘT ĐỢT ĐÁNH GIÁ CÓ SOS — và nó CHỈ là một tín hiệu.
   *
   * Từ vòng 7 hệ thống không tự mở case Ý thức/Khác nữa (mục 6.2): em có SOS thì GVCN được
   * báo để xem tình hình chung, còn có phải mở case hay không là nhận định của cô.
   *
   * Bộ demo vì thế phải bày ra CẢ HAI kết cục, vì cả hai đều có thật:
   *
   *   · Đợt ĐÃ XA (trên ba tuần): GVCN đã xem, đã quyết định mở case, đã trao đổi với em và
   *     phụ huynh, và đã chốt. Đây là đường đi đầy đủ của một tín hiệu.
   *   · Đợt GẦN ĐÂY: tín hiệu còn nằm chờ xác minh, hiện trong hàng việc của GVCN kèm hạn
   *     ba ngày. Đó mới là thứ đáng đỏ trên màn hình.
   */
  if (track === 'academic' && attemptId && (c.sosLevel ?? 0) > 0) {
    const attempt = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    raiseSignal({
      actorUserId: ctx.adminId,
      studentId: sid, cycleId: attempt.cycle_id ?? null,
      attemptId, classId: attempt.class_id ?? null,
      track: 'behaviour', skill: null, category: 'behaviour',
      sosLevel: c.sosLevel as number,
      detectedOn: c.detectedAt,
      /* Tín hiệu được ghi nhận ngay khi có điểm — đó là mốc hạn ba ngày đếm từ đó. */
      raisedOn: past(c.detectedAt) ?? c.detectedAt,
    });
    /*
     * BA MỐC THỜI GIAN, BA TRẠNG THÁI KHÁC NHAU — và cả ba đều phải có trong bản demo:
     *
     *   trên 4 tuần   GVCN đã xem, đã mở case, đã trao đổi với em và phụ huynh, đã chốt
     *   1–4 tuần      GVCN đã xem và đã mở case, nhưng hai việc trao đổi CÒN PHẢI LÀM
     *   dưới 1 tuần   tín hiệu còn nằm chờ xác minh, chưa ai đụng tới
     *
     * Thiếu mốc giữa thì bản demo không còn việc trao đổi nào đang chờ, và người xem không
     * kiểm chứng được ai nhận việc gặp em, ai nhận việc gọi phụ huynh, hạn là ngày nào.
     */
    if (addDays(c.detectedAt, 7) <= DEMO_DATE) {
      behaviourCaseFromSignal(ctx, sid, attemptId, cy.classCode, c.detectedAt);
      if (addDays(c.detectedAt, 28) <= DEMO_DATE) {
        finishBehaviourCase(ctx, sid, attemptId, cy.classCode, c.detectedAt);
      }
    }
  }
  for (const no of c.repeatsAt ?? []) {
    const aid = attemptByNo.get(no) ?? null;
    const t = cy.tests.find((x) => x.no === no);
    if (aid && t) milestone('repeat', aid, no, weekEnd(t.week));
  }

  /* ---------------------------------------------------------------- phương án */
  const plans = c.plans ?? [];
  let prevPlanId: number | null = null;
  let prevSuperseded = false;
  for (const p of plans) {
    const performer = ctx.userId.get(p.performer ?? '') ?? ownerId ?? ctx.adminId;
    const recorder = ctx.userId.get(p.recordedBy ?? '') ?? performer;
    const pending = p.approval?.state === 'pending';
    const declined = p.approval?.state === 'declined';
    /*
     * CHU KỲ CHỈ CHẠY TỪ LÚC ĐƯỢC PHÉP LÀM.
     *
     * Đang chờ duyệt thì chưa bắt đầu, nên không có hạn làm và không có hẹn xem lại — thúc
     * người ta làm một việc Quản lý chưa đồng ý là thúc sai người. Bị từ chối thì phương án
     * đó dừng hẳn ở đó.
     */
    const running = !pending && !declined && p.status !== 'completed' && p.status !== 'cancelled';
    /*
     * CHU KỲ TÍNH TỪ NGÀY ĐƯỢC DUYỆT, không phải từ ngày đề xuất (mục 7.7).
     *
     * Thời gian Quản lý cầm hồ sơ là thời gian của Quản lý; tính nó vào chu kỳ của giáo viên
     * là bắt người ta chịu trách nhiệm cho một khoảng họ không được phép làm gì.
     */
    const effectiveStart = p.approval?.state === 'approved' && p.approval.on
      ? p.approval.on : p.cycleStart;
    /*
     * HAI MỐC KHÁC NHAU (mục 8.3), không còn gộp làm một con số:
     *   · HẠN CẬP NHẬT — học thuật: Chủ nhật gần nhất. Ý thức/Khác: 3/5 ngày từ lúc nhận case.
     *   · DỰ KIẾN KẾT THÚC — học thuật: Chủ nhật tuần tiếp theo. Ý thức/Khác: cùng hạn trên.
     */
    const behaviourDue = planDueDate(c.detectedAt ?? effectiveStart, c.urgency ?? 'attention');
    const updateDue = track === 'behaviour' ? behaviourDue : weeklyUpdateDue(effectiveStart);
    const planEnd = track === 'behaviour' ? behaviourDue : planEndDefault(effectiveStart);
    const due = cycleDeadline(effectiveStart, track);
    const pinfo = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by,
                                         status, planned_date, started_date, completed_date,
                                         cycle_no, cycle_started_on, action_due, followup_due,
                                         needs_approval, approval_state, approval_due,
                                         approval_by, approval_at, approval_note,
                                         closed_reason, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        caseId, p.kind, p.description, performer, recorder,
        declined ? 'cancelled' : p.status,
        p.cycleStart,
        pending || declined ? null : past(p.startedOn ?? effectiveStart),
        past(p.completedOn),
        p.cycleNo ?? 1,
        pending || declined ? null : effectiveStart,
        running ? (p.actionDue ?? updateDue) : null,
        running ? (p.followupDue ?? planEnd) : null,
        p.approval ? 1 : 0,
        p.approval?.state ?? null,
        p.approval?.due ?? null,
        p.approval?.by ? ctx.userId.get(p.approval.by) ?? null : null,
        past(p.approval?.on),
        p.approval?.note ?? null,
        /*
         * ĐỀ XUẤT BỊ TỪ CHỐI KHÔNG PHẢI "BỊ THAY THẾ".
         *
         * `closed_reason = 'superseded'` có nghĩa là có một phương án khác đã thay chỗ nó, và
         * bảng kết quả đọc cột đó để biết phương án nào bị thay. Một đề xuất bị Quản lý từ
         * chối thì `approval_state` đã nói rõ chuyện gì xảy ra; ghi thêm "bị thay thế" là kể
         * một câu chuyện không có thật.
         */
        p.closedReason ?? null,
        NOW,
      );
    const planId = Number(pinfo.lastInsertRowid);
    counts.interventions += 1;

    /*
     * PHƯƠNG ÁN BỊ THAY THẾ trỏ sang phương án đã thay nó — lịch sử đọc được cả hai chiều,
     * và bảng kết quả biết rằng nó KHÔNG phải một thành công.
     */
    if (prevPlanId && prevSuperseded) {
      conn.prepare('UPDATE case_interventions SET superseded_by = ? WHERE id = ?').run(planId, prevPlanId);
    }
    prevPlanId = planId;
    prevSuperseded = p.closedReason === 'superseded';

    for (const f of p.followups ?? []) {
      /* Không bao giờ ghi kết quả trước ngày phương án bắt đầu. */
      const on = f.on < effectiveStart ? effectiveStart : (past(f.on) ?? effectiveStart);
      conn
        .prepare(
          `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                       outcome, note, next_step, cycle_no, cycle_due, late,
                                       metrics, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(caseId, planId, on, ctx.userId.get(f.by ?? '') ?? performer,
             f.outcome, f.note, f.nextStep, p.cycleNo ?? 1, due, on > due ? 1 : 0,
             f.metrics ? JSON.stringify(f.metrics) : null, NOW);
      counts.followups += 1;
    }
  }

  return caseId;
}

export { padCode };
