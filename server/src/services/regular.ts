import { db, tx } from '../db.ts';
import {
  ATTEMPT_KIND_LABEL, PERMISSIONS, RATIO_PASS_THRESHOLD, REGULAR_SKILL_LABEL,
  ratioResult, sosFromFailCount, type AttemptKind, type RatioOutcome, type SosLevel,
} from '../../../shared/domain.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, editableSkills, require_, scoreEditPath, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, writeAudit } from './audit.ts';
import { ensurePeriod, mondayOf } from './week.ts';

/**
 * LỚP THƯỜNG (Foundation / Beginner / Elementary).
 *
 * Dùng CHUNG bảng dữ liệu và CHUNG hệ thống case SOS với lớp FT — cùng `assessment_attempts`,
 * `assessment_scores`, `sos_cases`. Chỉ khác ba thứ:
 *
 *   1. CÁCH CHẤM: nhập `số câu đúng / tổng số câu`, đạt từ 60% trở lên. Không quy ra band
 *      IELTS, không có kỳ vọng theo target, không có Overall.
 *   2. MỐC KIỂM TRA: theo TUẦN HỌC của lớp (FOU tuần 4 và 8; BE/ELE tuần 5 và 10),
 *      không phải theo lịch MT của FT.
 *   3. KỸ NĂNG: theo chương trình, ví dụ Foundation có Pronunciation thay cho Speaking.
 *
 * Ngưỡng SOS giữ nguyên: 1 môn trượt → SOS 1, 2 môn → SOS 2, từ 3 môn → SOS 3.
 */

export type ProgrammeInfo = {
  code: string; name: string; weeks: number | null; scoringMode: string;
  skills: string[];
  checkpoints: { kind: AttemptKind; studyWeek: number }[];
};

/**
 * Đọc TẤT CẢ chương trình bằng ba câu lệnh, không phải ba câu cho mỗi lớp.
 *
 * Danh sách lớp hỏi chương trình của từng dòng, nên đọc lẻ là đúng cái bẫy N+1 mà cả
 * màn hình này được dựng để tránh.
 */
export function allProgrammes(): Map<string, ProgrammeInfo> {
  const conn = db();
  const out = new Map<string, ProgrammeInfo>();
  for (const p of conn.prepare(`SELECT * FROM programmes WHERE status = 'active'`).all() as any[]) {
    out.set(p.code, {
      code: p.code, name: p.name, weeks: p.weeks, scoringMode: p.scoring_mode,
      skills: [], checkpoints: [],
    });
  }
  for (const r of conn.prepare('SELECT programme_code, skill FROM programme_skills ORDER BY seq, skill').all() as any[]) {
    out.get(r.programme_code)?.skills.push(r.skill);
  }
  for (const r of conn.prepare('SELECT programme_code, kind, study_week FROM programme_checkpoints ORDER BY study_week').all() as any[]) {
    out.get(r.programme_code)?.checkpoints.push({ kind: r.kind as AttemptKind, studyWeek: r.study_week });
  }
  return out;
}

export function programmeByCode(code: string | null | undefined): ProgrammeInfo | null {
  if (!code) return null;
  return allProgrammes().get(code) ?? null;
}

export function programmeOfClass(classId: number): ProgrammeInfo | null {
  const c = db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(classId) as any;
  return programmeByCode(c?.programme_code);
}

/** Lớp này có chấm theo tỷ lệ số câu đúng không (tức là lớp thường). */
export function isRatioClass(classId: number | null | undefined): boolean {
  if (!classId) return false;
  return programmeOfClass(classId)?.scoringMode === 'ratio';
}

// ---------------------------------------------------------------- kết luận

export type RegularSkillResult = {
  skill: string;
  label: string;
  score: number | null;
  total: number | null;
  /** Tỷ lệ CHÍNH XÁC, chưa làm tròn. Làm tròn để hiện là việc của giao diện. */
  ratio: number | null;
  outcome: RatioOutcome;
};

export type RegularResult = {
  skills: RegularSkillResult[];
  /** Số kỹ năng đã có điểm hợp lệ trên tổng số kỹ năng của chương trình. */
  scored: number;
  required: number;
  /** Đủ điểm mọi kỹ năng của chương trình. */
  complete: boolean;
  /** Đã kết luận được nhưng chưa đủ điểm — mức SOS còn có thể tăng. */
  provisional: boolean;
  failedCount: number | null;
  sosLevel: SosLevel | null;
  passThreshold: number;
};

/**
 * Kết luận một bài kiểm tra của lớp thường.
 *
 * KẾT LUẬN NGAY TRÊN PHẦN ĐIỂM ĐANG CÓ (owner chốt 09/09/2026). Chỉ cần một kỹ năng đã
 * chấm là tính được; mức SOS có thể tăng khi các kỹ năng còn lại vào, và `provisional`
 * cho giao diện biết để ghi rõ "mới có 2/4 kỹ năng".
 *
 * THIẾU ĐIỂM VẪN KHÁC TRƯỢT: kỹ năng chưa chấm không bị đếm thành một môn chưa đạt.
 * Lớp thường KHÔNG có cơ chế miễn kỹ năng — dời lịch sang tuần khác thì được, nhưng bộ
 * kỹ năng của chương trình luôn đủ.
 */
export function evaluateRegular(skills: string[], rows: { skill: string; raw_score: number | null; raw_total: number | null }[]): RegularResult {
  const results: RegularSkillResult[] = skills.map((skill) => {
    const row = rows.find((r) => r.skill === skill);
    const { outcome, ratio } = ratioResult(row?.raw_score ?? null, row?.raw_total ?? null);
    return {
      skill,
      label: REGULAR_SKILL_LABEL[skill as keyof typeof REGULAR_SKILL_LABEL] ?? skill,
      score: row?.raw_score ?? null,
      total: row?.raw_total ?? null,
      ratio, outcome,
    };
  });
  const scored = results.filter((r) => r.outcome !== 'missing').length;
  const complete = skills.length > 0 && scored === skills.length;
  const failedCount = scored > 0 ? results.filter((r) => r.outcome === 'fail').length : null;
  return {
    skills: results,
    scored, required: skills.length, complete,
    provisional: scored > 0 && !complete,
    failedCount,
    sosLevel: failedCount === null ? null : sosFromFailCount(failedCount),
    passThreshold: RATIO_PASS_THRESHOLD,
  };
}

/**
 * Hạn nhập điểm của một bài kiểm tra lớp thường: HẾT CHỦ NHẬT của chính tuần đó.
 *
 * Khác lớp FT (hạn là thứ Tư tuần kế tiếp): lớp thường làm bài và chấm ngay trong tuần,
 * không có buổi Speaking lệch ngày phải chờ. Chưa có tuần kế hoạch thì KHÔNG có hạn —
 * trả về null thay vì dựng một hạn giả.
 */
export function regularDeadline(attempt: { planned_period_id?: number | null; deadline_override?: string | null }): {
  date: string | null; source: 'override' | 'week_end' | 'none';
} {
  if (attempt.deadline_override) return { date: attempt.deadline_override, source: 'override' };
  if (!attempt.planned_period_id) return { date: null, source: 'none' };
  const rp = db().prepare('SELECT week_end FROM report_periods WHERE id = ?').get(attempt.planned_period_id) as any;
  return rp ? { date: rp.week_end, source: 'week_end' } : { date: null, source: 'none' };
}

export function regularResultOf(attemptId: number): RegularResult {
  const conn = db();
  const a = conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const prog = a?.class_id ? programmeOfClass(a.class_id) : null;
  const rows = conn.prepare('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ?')
    .all(attemptId) as any[];
  return evaluateRegular(prog?.skills ?? [], rows);
}

// ---------------------------------------------------------------- lên lịch

/**
 * Tạo hai bài kiểm tra của một khoá lớp thường theo đúng MỐC TUẦN HỌC.
 *
 * Tuần học 4 nghĩa là tuần thứ tư kể từ ngày khai giảng, KHÔNG phải "W4" của một tháng.
 * Không có ngày khai giảng thì không đoán — báo lỗi để người dùng điền vào trước.
 */
export function planRegularTests(p: Principal, classId: number) {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.PLAN_WEEK, { classId },
    'Chỉ Quản lý mới lập được kế hoạch kiểm tra của lớp.');

  const prog = programmeOfClass(classId);
  if (!prog || prog.scoringMode !== 'ratio') {
    throw badRequest('Lớp này không phải lớp thường. Lớp FT dùng lịch Mock Test.');
  }
  if (!cls.start_date) throw badRequest('Lớp chưa có ngày khai giảng nên chưa tính được mốc tuần học.');
  if (!prog.checkpoints.length) throw badRequest(`Chương trình ${prog.code} chưa khai báo mốc kiểm tra nào.`);

  const students = conn
    .prepare(
      `SELECT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.archived_at IS NULL AND s.status = 'active'`,
    )
    .all(classId) as any[];

  const created: number[] = [];
  return tx(() => {
    for (const st of students) {
      /*
       * Lớp thường vẫn cần một "lộ trình" để gắn bài kiểm tra vào — đó chính là khoá học này.
       *
       * Nhưng KHÔNG được mượn lộ trình IELTS đang mở của em: một em chuyển từ lớp FT sang
       * Foundation là bắt đầu một khoá KHÁC, có cách chấm khác và không có target. Gắn bài
       * Foundation vào lộ trình LT1 cũ thì lịch sử học của em thành một mớ lẫn lộn.
       * Lộ trình có `route` là lộ trình IELTS; lớp thường mở lộ trình riêng.
       */
      let cycle = conn
        .prepare(
          `SELECT * FROM learning_cycles
            WHERE student_id = ? AND status = 'active' AND route IS NULL
            ORDER BY seq DESC LIMIT 1`,
        )
        .get(st.id) as any;
      if (!cycle) {
        const seq = ((conn.prepare('SELECT MAX(seq) m FROM learning_cycles WHERE student_id = ?').get(st.id) as any)?.m ?? 0) + 1;
        const info = conn
          .prepare(
            // GHI RÕ CHƯƠNG TRÌNH vào khoá học. Thiếu nó thì sau này không biết khoá này
            // chấm theo tỷ lệ hay theo band, và hồ sơ học viên sẽ dựng ra bảng band IELTS
            // cho một lớp Foundation.
            `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                          started_at, status, note, created_at)
             VALUES (?,?, NULL, ?, NULL, ?, 'active', ?, ?)`,
          )
          .run(st.id, seq, prog.code, cls.start_date, `Khoá ${prog.name} — lớp ${cls.code}`, nowIso());
        cycle = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(Number(info.lastInsertRowid));
        addJourney({
          studentId: st.id, eventType: 'cycle_start', eventDate: cls.start_date,
          title: `Bắt đầu khoá ${prog.name}`, detail: `Lớp ${cls.code}`,
          refTable: 'learning_cycles', refId: cycle.id, createdBy: p.userId,
        });
      }

      for (const cp of prog.checkpoints) {
        const dup = conn
          .prepare(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND kind = ?`)
          .get(cycle.id, cp.kind) as any;
        if (dup) continue;

        // Tuần học N bắt đầu sau (N-1) tuần kể từ ngày khai giảng.
        const week = mondayOf(addDays(cls.start_date, (cp.studyWeek - 1) * 7));
        const period = ensurePeriod(week);
        const nextNo = ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?')
          .get(cycle.id) as any)?.m ?? 0) + 1;
        const info = conn
          .prepare(
            `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                              status, created_by, created_at)
             VALUES (?,?,?,?,?,?, 'planned', ?,?)`,
          )
          .run(cycle.id, st.id, nextNo, cp.kind, classId, period.id, p.userId, nowIso());
        created.push(Number(info.lastInsertRowid));
        addJourney({
          studentId: st.id, eventType: 'mock_scheduled', eventDate: week,
          title: `${ATTEMPT_KIND_LABEL[cp.kind]} · tuần học ${cp.studyWeek}`,
          detail: `${period.code} · lớp ${cls.code}`,
          refTable: 'assessment_attempts', refId: Number(info.lastInsertRowid), createdBy: p.userId,
        });
      }
    }
    writeAudit({ actorUserId: p.userId, action: 'regular.plan', entityType: 'class', entityId: classId,
      entityLabel: cls.code, after: { created: created.length, students: students.length } });
    return { created: created.length, students: students.length, programme: prog };
  });
}

// ---------------------------------------------------------------- nhập điểm

/**
 * Nhập điểm một kỹ năng của bài kiểm tra lớp thường: SỐ CÂU ĐÚNG và TỔNG SỐ CÂU.
 *
 * Cả hai đều phải nhập. Số câu không cố định giữa các kỹ năng và các đề, nên tự điền tổng
 * là đoán bừa — mà đoán sai tổng thì đạt/trượt sai theo.
 */
export function saveRegularScore(
  p: Principal, attemptId: number, skill: string,
  patch: { score?: number | null; total?: number | null; takenOn?: string | null; note?: string | null },
) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt đánh giá');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không nhập điểm được.');

  const prog = a.class_id ? programmeOfClass(a.class_id) : null;
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lượt này không thuộc lớp thường.');
  if (!prog.skills.includes(skill)) {
    throw badRequest(`Chương trình ${prog.code} không có kỹ năng "${skill}".`);
  }
  /*
   * Cùng hai đường vào như lớp FT: giáo viên nhập kỹ năng MÌNH ĐƯỢC PHÂN CÔNG, còn Admin
   * chi nhánh và Quản trị hệ thống nhập bù qua quyền riêng (`score.override`) khi giáo viên
   * vắng. Hai đường ghi nhật ký khác nhau để sau này còn siết lại được.
   */
  const path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.');
  }

  const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
    .get(attemptId, skill) as any;
  const before = existing ? { ...existing } : null;

  const score = patch.score !== undefined ? patch.score : existing?.raw_score ?? null;
  const total = patch.total !== undefined ? patch.total : existing?.raw_total ?? null;

  // Kiểm tra ở đây chứ không chỉ ở giao diện: gửi thẳng request vẫn phải bị chặn.
  if (total !== null && total !== undefined) {
    if (!Number.isInteger(total) || total <= 0) throw badRequest('Tổng số câu phải là số nguyên lớn hơn 0.');
  }
  if (score !== null && score !== undefined) {
    if (!Number.isInteger(score) || score < 0) throw badRequest('Số câu đúng phải là số nguyên không âm.');
    if (total === null || total === undefined) throw badRequest('Nhập số câu đúng thì phải nhập cả tổng số câu.');
    if (score > total) throw badRequest(`Số câu đúng (${score}) không thể lớn hơn tổng số câu (${total}).`);
  }

  const takenOn = patch.takenOn !== undefined
    ? patch.takenOn
    : existing?.taken_on ?? (a.lrw_scheduled_at ? String(a.lrw_scheduled_at).slice(0, 10) : null);
  if (takenOn && !isIsoDate(takenOn)) throw badRequest('Ngày làm bài không hợp lệ.');

  return tx(() => {
    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, taken_on=?, entered_by=?, entered_at=?, note=?
            WHERE id=?`,
        )
        .run(score ?? null, total ?? null, takenOn, p.userId, nowIso(),
             patch.note !== undefined ? patch.note : existing.note ?? null, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, taken_on, raw_score, raw_total, entered_by, entered_at, note)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, takenOn, score ?? null, total ?? null, p.userId, nowIso(), patch.note ?? null);
    }
    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill);
    writeAudit({ actorUserId: p.userId, action: path === 'override' ? 'regular.score.override' : 'regular.score',
      entityType: 'assessment_score',
      entityId: (after as any).id, entityLabel: `${prog.code} · ${skill}`, before, after });

    refreshRegularOutcome(p, attemptId);
    return { score: after, result: regularResultOf(attemptId) };
  });
}

/**
 * Tính lại kết luận sau khi nhập điểm và mở/cập nhật case SOS.
 *
 * Dùng CHUNG bảng `sos_cases` với lớp FT — cùng một hệ thống theo dõi xử lý, chỉ khác cách
 * sinh ra mức SOS. Sửa điểm làm đổi mức thì GIỮ case và lịch sử, không xoá đi làm lại.
 */
export function refreshRegularOutcome(p: Principal, attemptId: number) {
  const conn = db();
  const r = regularResultOf(attemptId);
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;

  // "Đã xong" vẫn cần ĐỦ điểm mọi kỹ năng — đó là trạng thái của bài, không phải kết luận.
  if (r.complete && a.status === 'planned') {
    conn.prepare(`UPDATE assessment_attempts SET status = 'done', updated_at = ? WHERE id = ?`)
      .run(nowIso(), attemptId);
  }
  // Nhưng CASE thì mở ngay khi kết luận được, không chờ đủ.
  if (r.sosLevel === null) return r;

  const existing = conn.prepare('SELECT * FROM sos_cases WHERE attempt_id = ?').get(attemptId) as any;
  if (r.sosLevel === 0) {
    // Đạt hết: không mở case mới. Case cũ (nếu điểm từng thấp hơn) vẫn giữ để tra lịch sử.
    if (existing && existing.sos_level !== 0) {
      conn.prepare('UPDATE sos_cases SET sos_level = 0, updated_at = ? WHERE id = ?').run(nowIso(), existing.id);
      conn.prepare(
        `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'sos_level', ?, '0', ?, ?)`,
      ).run(existing.id, String(existing.sos_level), p.userId, nowIso());
    }
    return r;
  }

  if (!existing) {
    conn
      .prepare(
        // Ghi thẳng học viên và khoá học: hồ sơ học viên tra theo `student_id`, và lớp
        // thường dùng CHUNG bảng case với lớp FT nên phải điền đủ như nhau.
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, origin_kind, detected_at,
                                sos_level, status, created_at)
         VALUES (?,?,?, 'mock', ?,?, 'open', ?)`,
      )
      .run(attemptId, a.student_id, a.cycle_id,
           (a.lrw_scheduled_at ?? '').slice(0, 10) || demoToday(), r.sosLevel, nowIso());
  } else if (existing.sos_level !== r.sosLevel) {
    conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
      .run(r.sosLevel, nowIso(), existing.id);
    conn.prepare(
      `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
       VALUES (?, 'sos_level', ?, ?, ?, ?)`,
    ).run(existing.id, String(existing.sos_level), String(r.sosLevel), p.userId, nowIso());
  }
  return r;
}

// ---------------------------------------------------------------- bảng điểm lớp

/**
 * Bảng nhập điểm của một lớp thường: mỗi dòng một học viên, mỗi kỹ năng hai ô
 * (số câu đúng và tổng số câu).
 *
 * Cho phép đặt TỔNG SỐ CÂU CHUNG cho cả lớp rồi sửa lại ở dòng có đề khác — cả lớp thường
 * làm cùng một đề, gõ lại "40" bốn mươi lần là bắt làm một việc máy đã biết.
 */
export function regularSheet(p: Principal, classId: number, kind?: string) {
  const conn = db();
  const cls = conn
    .prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được cấp quyền.');

  const prog = programmeOfClass(classId);
  if (!prog || prog.scoringMode !== 'ratio') {
    throw badRequest('Lớp này không phải lớp thường. Hãy dùng bảng điểm Mock Test.');
  }

  const params: unknown[] = [classId];
  let where = `a.class_id = ? AND a.status != 'cancelled'`;
  if (kind) { where += ' AND a.kind = ?'; params.push(kind); }

  const attempts = conn
    .prepare(
      `SELECT a.*, s.full_name, s.student_code, s.status AS student_status,
              rp.code AS period_code, rp.week_start
         FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where} AND s.archived_at IS NULL
        ORDER BY a.kind DESC, s.full_name`,
    )
    .all(...params) as any[];

  const byAttempt = new Map<number, any[]>();
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (const row of conn
      .prepare(
        `SELECT sc.*, u.full_name AS entered_by_name FROM assessment_scores sc
           LEFT JOIN users u ON u.id = sc.entered_by
          WHERE sc.attempt_id IN (${ids.map(() => '?').join(',')})`,
      )
      .all(...ids) as any[]) {
      if (!byAttempt.has(row.attempt_id)) byAttempt.set(row.attempt_id, []);
      byAttempt.get(row.attempt_id)!.push(row);
    }
  }

  const cases = new Map<number, any>();
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (const c of conn
      .prepare(`SELECT * FROM sos_cases WHERE attempt_id IN (${ids.map(() => '?').join(',')})`)
      .all(...ids) as any[]) cases.set(c.attempt_id, c);
  }

  const editable = editableSkills(p, classId, prog.skills);

  return {
    class: { id: cls.id, code: cls.code, branchName: cls.branch_name, startDate: cls.start_date },
    programme: prog,
    skillLabels: Object.fromEntries(prog.skills.map((k) => [k, REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k])),
    editableSkills: editable,
    canPlan: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    passThreshold: RATIO_PASS_THRESHOLD,
    rows: attempts.map((a) => {
      const rows = byAttempt.get(a.id) ?? [];
      const result = evaluateRegular(prog.skills, rows);
      const c = cases.get(a.id);
      const dl = regularDeadline(a);
      return {
        attemptId: a.id,
        deadline: dl.date,
        deadlineSource: dl.source,
        // Quá hạn khi đã hết ngày hạn mà vẫn còn kỹ năng chưa chấm.
        overdue: !!dl.date && dl.date < demoToday() && !result.complete,
        kind: a.kind as AttemptKind,
        kindLabel: ATTEMPT_KIND_LABEL[a.kind as AttemptKind] ?? a.kind,
        studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
        studentStatus: a.student_status,
        periodCode: a.period_code ?? null,
        takenOn: rows.find((r) => r.taken_on)?.taken_on ?? null,
        status: a.status,
        result,
        caseId: c?.id ?? null, caseStatus: c?.status ?? null, caseLevel: c?.sos_level ?? null,
      };
    }),
    today: demoToday(),
  };
}
