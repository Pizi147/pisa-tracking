import { db, tx } from '../db.ts';
import { addMilestone, followUntilAfter } from '../cases/sos.ts';
import { raiseSignal, reconcileCorrectedSignals } from '../cases/signals.ts';
import {
  ATTEMPT_KIND_LABEL, PERMISSIONS, RATIO_PASS_THRESHOLD, REGULAR_SKILL_LABEL,
  caseCategoriesFor, categoryOf, kiemLyDo, ratioResult, sosFromFailCount, tuanKeTiep,
  type AttemptKind, type CaseCategory, type RatioOutcome, type SosLevel,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, editableSkills, require_, scoreEditPath, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { regularSkillViews, weekStartOf } from '../fasttrack/attempts.ts';
import { ensureSkillRows, loadSkillRows, setSkillWeek } from '../fasttrack/skillSchedule.ts';

/**
 * LỚP THƯỜNG (Foundation / Beginner / Elementary).
 *
 * Dùng CHUNG bảng dữ liệu và CHUNG hệ thống case SOS với lớp FT — cùng `assessment_attempts`,
 * `assessment_scores`, `sos_cases`. Chỉ khác ba thứ:
 *
 *   1. CÁCH CHẤM: nhập `điểm đạt / tổng điểm`, đạt từ 70% trở lên (ngưỡng owner chốt sau
 *      PR15, trước đó là 60%). Không quy ra band IELTS, không có kỳ vọng theo target,
 *      không có Overall. Ngưỡng đọc từ `RATIO_PASS_THRESHOLD`, không gõ lại con số.
 *   2. MỐC KIỂM TRA: theo TUẦN HỌC của lớp (FOU tuần 4 và 8; BE/ELE tuần 5 và 10),
 *      không phải theo lịch MT của FT.
 *   3. KỸ NĂNG: bốn môn L/R/W/S, giống nhau ở mọi chương trình Normal.
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

/** Lớp này có chấm theo tỷ lệ điểm đạt/tổng điểm không (tức là lớp Normal). */
export function isRatioClass(classId: number | null | undefined): boolean {
  if (!classId) return false;
  return programmeOfClass(classId)?.scoringMode === 'ratio';
}

/**
 * Mã chương trình của một lộ trình, suy từ lớp của các bài kiểm tra trong lộ trình đó.
 * Dùng khi bản thân lộ trình chưa ghi mã chương trình (dữ liệu cũ).
 */
export function programmeCodeOfCycle(cycleId: number | null | undefined): string | null {
  if (!cycleId) return null;
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
 * Lộ trình này chấm theo TỶ LỆ (lớp Normal) hay theo BAND (Fast Track).
 *
 * Ưu tiên mã chương trình ghi trên chính lộ trình. Dữ liệu cũ có thể thiếu mã đó, nên còn
 * một đường tra dự phòng: lớp của các bài kiểm tra trong lộ trình. Không có căn cứ nào thì
 * coi là lớp band — đó là mặc định của trung tâm.
 *
 * Đây là chỗ DUY NHẤT trả lời câu hỏi này. Trước vòng 5 nó bị chép ở hai file, và hai bản
 * chép là hai chỗ để sau này lệch nhau.
 */
export function isRatioCycle(c: { id?: number | null; route?: string | null; programme_code?: string | null } | null | undefined): boolean {
  if (!c || c.route) return false;
  if (c.programme_code) return programmeByCode(c.programme_code)?.scoringMode === 'ratio';
  return programmeByCode(programmeCodeOfCycle(c.id))?.scoringMode === 'ratio';
}

/** Bộ hạng mục case đúng với chương trình của lộ trình này. */
export function caseCategoriesOfCycle(c: any): readonly CaseCategory[] {
  return caseCategoriesFor(isRatioCycle(c) ? 'ratio' : 'ielts_band');
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

  /*
   * KẾT LUẬN TẠM THỜI CHỈ ĐƯỢC ĐI LÊN, KHÔNG ĐƯỢC ĐI XUỐNG "ĐẠT".
   *
   * Một môn dưới ngưỡng là kết luận được NGAY — nhập nốt ba môn kia cũng không làm môn đó
   * đạt lại, nên mở case luôn để người dạy bắt tay vào sớm.
   *
   * Nhưng ba môn đạt mà môn thứ tư chưa nhập thì KHÔNG kết luận được gì: môn còn thiếu có
   * thể chính là môn em trượt. Ghi "Đạt kỳ vọng" lúc đó là báo an toàn giả, và người đọc
   * bảng sẽ bỏ qua em ấy — đúng lỗi owner nêu ở mục 6.3.
   */
  const sosLevel = failedCount === null ? null
    : failedCount === 0 && !complete ? null
    : sosFromFailCount(failedCount);

  return {
    skills: results,
    scored, required: skills.length, complete,
    provisional: scored > 0 && !complete,
    failedCount,
    sosLevel,
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
        /* Bốn môn cùng tuần khi mới lập; trải ra nhiều tuần là thao tác đổi lịch sau đó. */
        ensureSkillRows(Number(info.lastInsertRowid));
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
  patch: { score?: number | null; total?: number | null; note?: string | null; noShow?: boolean; lyDo?: string | null },
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
  /* Dấu "-" đi đường riêng vì nó KHÔNG phải một điểm: nó là một lần dời lịch (C08). */
  if (patch.noShow !== undefined) {
    if (patch.score !== undefined || patch.total !== undefined) {
      throw badRequest('Một lần gửi chỉ làm một việc: nhập điểm, hoặc ghi/gỡ dấu "-".');
    }
    return reportRegularNoShow(p, attemptId, skill, patch.noShow === true);
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
    if (!Number.isInteger(total) || total <= 0) throw badRequest('Tổng điểm phải là số nguyên lớn hơn 0.');
  }
  if (score !== null && score !== undefined) {
    if (!Number.isInteger(score) || score < 0) throw badRequest('Điểm đạt phải là số nguyên không âm.');
    if (total === null || total === undefined) throw badRequest('Nhập điểm đạt thì phải nhập cả tổng điểm.');
    if (score > total) throw badRequest(`Điểm đạt (${score}) không thể lớn hơn tổng điểm (${total}).`);
  }

  /*
   * RB-5 — cùng luật với Fast Track: đổi (hay xoá) một điểm đã có thì phải ghi lý do. Điểm lớp thường là cặp
   * "số câu đúng / tổng số câu" — đổi tổng là đổi tỉ lệ đạt, nên cũng tính là sửa. Lưu lại đúng cặp cũ thì không.
   */
  const doiGiaTri = (existing?.raw_score ?? null) !== null
    && ((score ?? null) !== (existing?.raw_score ?? null) || (total ?? null) !== (existing?.raw_total ?? null));
  if (doiGiaTri) {
    const loi = kiemLyDo(patch.lyDo);
    if (loi) throw badRequest(loi);
  }

  return tx(() => {
    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, entered_by=?, entered_at=?, note=?
            WHERE id=?`,
        )
        .run(score ?? null, total ?? null, p.userId, nowIso(),
             patch.note !== undefined ? patch.note : existing.note ?? null, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at, note)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, score ?? null, total ?? null, p.userId, nowIso(), patch.note ?? null);
    }
    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill);
    writeAudit({ actorUserId: p.userId, action: path === 'override' ? 'regular.score.override' : 'regular.score',
      entityType: 'assessment_score',
      entityId: (after as any).id, entityLabel: `${prog.code} · ${skill}`, before,
      after: patch.lyDo ? { ...(after as any), lyDo: String(patch.lyDo).trim() } : after });

    refreshRegularOutcome(p, attemptId);
    return { score: after, result: regularResultOf(attemptId) };
  });
}

/**
 * C08 — LỚP THƯỜNG GHI DẤU "-": em không làm bài của tuần này, môn đó TỰ DỜI SANG TUẦN SAU.
 *
 * Khác hẳn dấu "-" của Fast Track (rule book §17.1): ở FT dấu "-" là một lời khai còn sửa được đến hết Chủ nhật, rồi
 * mới chốt thành "không dự thi". Lớp thường không có khái niệm huỷ nghĩa vụ Test — bốn môn vẫn phải đủ — nên dấu "-"
 * ở đây chỉ có đúng một hệ quả: DỜI LỊCH. Vì thế nó dời ngay, và gỡ dấu là trả lịch về chỗ cũ.
 *
 * KHÔNG dựng đường dời lịch thứ hai: dùng `setSkillWeek` như mọi lần đổi tuần khác, nên các luật chống chồng đợt,
 * nhật ký lịch và tuần hoàn tất đều tự áp. Bộ đếm `absence_move_count` (đếm những lần em VẮNG ở Fast Track) không
 * được đụng tới.
 *
 * GHI DẤU VÀ DỜI LỊCH LÀ MỘT GIAO DỊCH: `setSkillWeek` chặn (vượt đợt kế tiếp, đang có đề nghị dời chờ duyệt…) thì
 * dòng dấu vừa ghi cũng cuộn lại theo — không bao giờ còn một dấu "-" mà lịch không dời.
 *
 * DỜI NHIỀU LẦN (Q4): em lại không làm bài ở tuần vừa dời tới thì ghi "-" lần nữa — môn dời tiếp, mỗi lần một dòng nhật
 * ký, không chặn. Dòng điểm chỉ giữ tuần của LẦN GHI GẦN NHẤT, nên gỡ dấu chỉ lùi về đúng tuần vừa dời khỏi. `today`
 * dùng đúng chỗ đó: tuần mới CHƯA TỚI thì ghi lại là vô hại (em chưa có dịp vắng tuần ấy); dời sang tuần sau thì vẫn tính
 * từ TUẦN THI của môn, không từ hôm nay.
 */
export function reportRegularNoShow(
  p: Principal, attemptId: number, skill: string, bat: boolean, today: string = demoToday(),
): { moved: boolean; tuanCu: string | null; tuanMoi: string | null; result: RegularResult } {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt đánh giá');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không ghi dấu "-" được.');

  const prog = a.class_id ? programmeOfClass(a.class_id) : null;
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lượt này không thuộc lớp thường.');
  if (!prog.skills.includes(skill)) throw badRequest(`Chương trình ${prog.code} không có kỹ năng "${skill}".`);

  /* Ghi dấu là việc của NGƯỜI CHẤM môn đó (hoặc người nhập bù) — cùng cửa với nhập điểm. */
  const path = scoreEditPath(p, a.class_id, skill);
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ ghi được dấu "-" cho kỹ năng mình được phân công.');
  }

  return tx(() => {
    const row = ensureSkillRows(attemptId).find((r) => r.skill === skill);
    if (!row) throw badRequest(`Bài này chưa có dòng lịch cho ${skill}.`);
    if (!row.required) throw badRequest(`Kỹ năng ${skill} không nằm trong phạm vi yêu cầu của bài này.`);

    const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as any;
    /*
     * Ô ĐÃ CÓ ĐIỂM thì dấu "-" không ghi mà cũng không gỡ được: ghi là xoá điểm bằng cửa sau, còn gỡ là kéo một bài
     * ĐÃ LÀM ở tuần mới về tuần cũ. Cả hai đều là sửa lịch sử — việc của hiệu chỉnh có lý do.
     */
    if (existing && existing.raw_score !== null && existing.raw_score !== undefined) {
      throw badRequest(bat
        ? 'Ô này đã có điểm — dấu "-" không xoá được điểm. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.'
        : 'Ô này đã có điểm ở tuần mới — không gỡ dấu "-" được nữa. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.');
    }
    const tuanCua = (id: number | null) =>
      (id ? (conn.prepare('SELECT code, week_start FROM report_periods WHERE id = ?').get(id) as any) : null);

    if (bat) {
      if (!row.planned_period_id || !row.week_start) {
        throw badRequest(`${skill} chưa có tuần thi nên chưa ghi dấu "-" được.`);
      }
      /*
       * Đã ghi dấu và đã dời rồi. Chỉ là một lần vắng MỚI (Q4 — đi tiếp xuống dưới: dấu chuyển sang tuần hiện tại, môn
       * dời tiếp) khi CẢ HAI: tuần hiện tại của môn đã tới, VÀ dấu cũ được ghi TRƯỚC khi tuần đó bắt đầu. Vế sau giữ lần
       * gọi lặp vô hại cả khi ghi muộn: bài tuần 14/09 báo "-" hôm 05/10 thì môn sang 21/09 (đã qua) — gửi lại cùng
       * lệnh hôm đó không được dời tiếp, vì em chưa có dịp vắng tuần 21/09 SAU lần báo trước. Ngày ghi dấu là ngày NGHIỆP
       * VỤ (`today`, xem chỗ ghi `no_show_at` bên dưới); dòng không có ngày ghi thì coi là không rõ → không dời.
       */
      if (existing?.no_show_period_id && existing.no_show_period_id !== row.planned_period_id) {
        const ngayGhi = existing.no_show_at ? String(existing.no_show_at).slice(0, 10) : null;
        const tuanDaToi = String(row.week_start) <= today;
        if (!tuanDaToi || !ngayGhi || ngayGhi >= String(row.week_start)) {
          return { moved: false, tuanCu: tuanCua(existing.no_show_period_id)?.code ?? null,
            tuanMoi: row.period_code, result: regularResultOf(attemptId) };
        }
      }
      const cu = { id: row.planned_period_id, code: row.period_code, weekStart: row.week_start };
      const moi = ensurePeriod(tuanKeTiep(cu.weekStart));
      /*
       * `no_show_at` = NGÀY NGHIỆP VỤ + giờ thật: phần ngày phải là `today` (bản demo chạy ngày giả lập, khác đồng hồ
       * máy) vì luật "vắng mới" ở trên so phần ngày này với tuần thi. Cột không được đọc ở chỗ nào khác.
       */
      const luc = `${today}T${nowIso().slice(11)}`;
      if (existing) {
        conn.prepare(
          `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0 WHERE id = ?`,
        ).run(cu.id, p.userId, luc, existing.id);
      } else {
        /* Cố ý KHÔNG ghi entered_by: người báo "không có bài" chưa nhập điểm nào. */
        conn.prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late)
           VALUES (?,?,?,?,?,0)`,
        ).run(attemptId, skill, cu.id, p.userId, luc);
      }
      /* Dời bằng ĐÚNG hàm dời lịch chung — `force` chỉ vượt được cảnh báo, không bao giờ vượt được chặn. */
      setSkillWeek(p, attemptId, skill, moi.id, {
        reason: `Báo "-": em không làm bài tuần ${cu.code ?? '?'} — môn này dời sang tuần sau (C08).`,
        force: true,
      });
      writeAudit({
        actorUserId: p.userId, action: 'regular.no_show', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: skill, before: { week: cu.code }, after: { week: moi.code, noShow: true },
      });
      return { moved: true, tuanCu: cu.code ?? null, tuanMoi: moi.code, result: regularResultOf(attemptId) };
    }

    /* Gỡ dấu: trả môn về đúng tuần đã lưu trong chính dòng điểm. */
    if (!existing?.no_show_period_id) {
      return { moved: false, tuanCu: null, tuanMoi: row.period_code, result: regularResultOf(attemptId) };
    }
    const ve = tuanCua(existing.no_show_period_id);
    if (existing.no_show_period_id !== row.planned_period_id) {
      setSkillWeek(p, attemptId, skill, existing.no_show_period_id, {
        reason: 'Gỡ dấu "-": trả lịch về tuần cũ.', force: true,
      });
    }
    conn.prepare(
      `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL WHERE id = ?`,
    ).run(existing.id);
    writeAudit({
      actorUserId: p.userId, action: 'regular.no_show_cleared', entityType: 'assessment_attempt', entityId: attemptId,
      entityLabel: skill, before: { week: row.period_code }, after: { week: ve?.code ?? null, noShow: false },
    });
    return { moved: true, tuanCu: row.period_code, tuanMoi: ve?.code ?? null, result: regularResultOf(attemptId) };
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
  /*
   * RB-8: môn vừa được sửa thành ĐẠT → rút tín hiệu và xử lý Case dựng trên con số sai — CÙNG hàm với Fast Track. Đặt TRƯỚC lối thoát
   * `sosLevel === null`: sửa một môn lên đạt khi ba môn kia chưa có điểm thì chưa kết luận được mức, nhưng căn cứ của tín hiệu đã mất.
   */
  reconcileCorrectedSignals(p, {
    attemptId, passingSkills: r.skills.filter((x) => x.outcome === 'pass').map((x) => x.skill), passText: 'đạt',
  });
  // Nhưng CASE thì mở ngay khi kết luận được, không chờ đủ.
  if (r.sosLevel === null) return r;

  const failing = r.skills.filter((x) => x.outcome === 'fail').map((x) => x.skill);
  const failingCats = new Set(failing.map((sk) => categoryOf(sk)).filter(Boolean) as string[]);

  /*
   * TÌM CASE THEO HỌC VIÊN, KHÔNG THEO LƯỢT THI.
   *
   * Bản trước tìm bằng `WHERE attempt_id = ?`. Từ vòng 4 case sống suốt khoá và cột đó luôn
   * trỏ tới LƯỢT MỚI NHẤT đã chạm vào nó, nên chấm lại một bài CŨ thì câu đó không tìm ra
   * case nào — điểm sửa lên thành đạt mà mức SOS vẫn nằm nguyên, không có lỗi nào báo ra.
   *
   * Điểm sửa lên thành đạt: hạ mức và ghi một mốc, KHÔNG xoá case — xoá đi là mất luôn
   * những việc đã làm cho em vì vấn đề đó.
   */
  const open = conn
    .prepare(
      `SELECT * FROM sos_cases
        WHERE student_id = ? AND COALESCE(cycle_id, 0) = ?
          AND status != 'done'`,
    )
    .all(a.student_id, a.cycle_id ?? 0) as any[];

  // Ngày phát hiện = thứ Hai của TUẦN bài kiểm tra; không còn ngày làm bài riêng.
  const detectedAt = weekStartOf(a) ?? demoToday();
  for (const c of open) {
    const cat = c.category ?? categoryOf(c.topic);
    if (!cat) continue;
    const gone = !failingCats.has(cat);
    const level = gone || r.sosLevel === 0 ? 0 : r.sosLevel;
    if (gone) {
      addMilestone({
        caseId: c.id, kind: 'passed', attemptId, attemptNo: a.attempt_no,
        sosLevel: r.sosLevel, occurredOn: detectedAt, createdBy: p.userId,
        dedupKey: `mt:${attemptId}:${c.id}:passed`,
      });
    }
    if (c.sos_level !== level) {
      conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
        .run(level, nowIso(), c.id);
      conn.prepare(
        `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'sos_level', ?, ?, ?, ?)`,
      ).run(c.id, String(c.sos_level), String(level), p.userId, nowIso());
    }
  }
  if (r.sosLevel === 0 || !failing.length) return r;

  /*
   * MỘT CASE CHO MỖI HẠNG MỤC, SỐNG SUỐT KHOÁ — dùng chung hệt lớp FT.
   *
   * Bốn môn của lớp Normal ứng thẳng với bốn hạng mục CÙNG TÊN: L · R · W · S. Không gộp
   * W vào W2 của Fast Track — hai môn khác nhau, chấm theo hai cách khác nhau.
   *
   * Progress Test rồi Final Test cùng trượt một môn thì đó là MỘT case với hai mốc, không
   * phải hai case rời — giống hệt MT1/MT2 của lớp FT.
   */
  /*
   * MÔN DƯỚI NGƯỠNG SINH TÍN HIỆU, KHÔNG SINH CASE (mục 6.2) — giống hệt lớp Fast Track.
   *
   * Hạng mục đã có case đang mở thì thêm một mốc vào chính case đó và gắn tín hiệu vào nó:
   * Progress Test rồi Final Test cùng trượt một môn là MỘT vấn đề với hai bằng chứng, không
   * phải hai vấn đề. Chưa có case nào thì tín hiệu nằm chờ giáo viên bộ môn xác minh.
   */
  const conn2 = conn;
  for (const skill of failing) {
    const category = categoryOf(skill);
    if (!category) continue;
    const existing = open.find((c: any) => (c.category ?? categoryOf(c.topic)) === category) ?? null;
    const signal = raiseSignal({
      actorUserId: p.userId,
      studentId: a.student_id, cycleId: a.cycle_id ?? null,
      attemptId: a.id, classId: a.class_id ?? null,
      skill, category,
      sosLevel: r.sosLevel, detectedOn: detectedAt,
    });
    if (existing) {
      addMilestone({
        caseId: existing.id, kind: 'repeat', attemptId: a.id, attemptNo: a.attempt_no,
        sosLevel: r.sosLevel, occurredOn: detectedAt, createdBy: p.userId,
        note: REGULAR_SKILL_LABEL[skill as keyof typeof REGULAR_SKILL_LABEL] ?? skill,
        dedupKey: `mt:${a.id}:${existing.id}:repeat`,
      });
      conn2
        .prepare(
          `UPDATE sos_cases SET attempt_id = ?, sos_level = ?,
                  follow_until = COALESCE(?, follow_until), updated_at = ? WHERE id = ?`,
        )
        .run(a.id, r.sosLevel, followUntilAfter(a), nowIso(), existing.id);
      if (signal.status === 'pending') {
        conn2
          .prepare(
            `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
                    resolution_note = ?, updated_at = ? WHERE id = ?`,
          )
          .run(existing.id, p.userId, nowIso(),
               'Nối vào case đang mở của môn này — cùng một vấn đề, thêm một bằng chứng.',
               nowIso(), signal.id);
      }
    }
  }

  return r;
}

// ---------------------------------------------------------------- bảng điểm lớp

/**
 * Bảng nhập điểm của một lớp thường: mỗi dòng một học viên, mỗi kỹ năng hai ô
 * (điểm đạt và tổng điểm).
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
    throw badRequest('Lớp này không phải lớp thường. Dùng bảng điểm Mock Test.');
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

  /*
   * CASE CỦA MỘT DÒNG TÌM THEO HỌC VIÊN + KHOÁ + HẠNG MỤC, KHÔNG THEO `attempt_id`.
   *
   * `sos_cases.attempt_id` luôn trỏ tới LƯỢT MỚI NHẤT đã chạm vào Case (xem `refreshRegularOutcome`). Tìm theo cột đó
   * thì bài Giữa khoá mất sạch trạng thái Case ngay khi bài Cuối khoá được chấm — đúng lỗi đã ghi ở đặc tả §6. Case
   * sống suốt khoá và gắn với một HẠNG MỤC (môn), nên câu hỏi đúng là "môn này của em có Case nào đang mở không".
   */
  const studentIds = [...new Set(attempts.map((a) => a.student_id as number))];
  const caseRows = studentIds.length
    ? (conn
        .prepare(`SELECT * FROM sos_cases WHERE student_id IN (${studentIds.map(() => '?').join(',')})`)
        .all(...studentIds) as any[])
    : [];
  const casesOf = (studentId: number, cycleId: number | null, failing: string[]) => {
    /* Hạng mục → môn trượt của chính dòng này; lớp thường thì hai tên trùng nhau (L · R · W · S). */
    const skillOfCat = new Map<string, string>();
    for (const k of failing) {
      const cat = categoryOf(k);
      if (cat && !skillOfCat.has(cat)) skillOfCat.set(cat, k);
    }
    return caseRows
      .filter((c) => c.student_id === studentId
        && (c.cycle_id ?? 0) === (cycleId ?? 0)
        && skillOfCat.has(c.category ?? categoryOf(c.topic) ?? ''))
      /*
       * THỨ TỰ = LUẬT CASE ĐẠI DIỆN của hạng mục (mục 4.3, `skillSupportBoard` ở cases/cases.ts: `mine.find(c => c.status
       * !== 'done') ?? mine[0]`): đang mở trước, mới nhất trước; không còn cái nào mở thì cái đã đóng gần nhất. "Mới nhất"
       * ở đây theo id (bảng này không đọc lịch sử xử lý từng Case). Xếp theo id tăng dần thì `cases[0]` là Case CŨ NHẤT —
       * một Case nhập bù đã đóng sẽ che mất Case đang mở cùng môn.
       */
      .sort((x, y) => Number(x.status === 'done') - Number(y.status === 'done') || y.id - x.id)
      .map((c) => {
        const category = (c.category ?? categoryOf(c.topic)) as string;
        return {
          id: c.id as number, status: c.status as string, level: (c.sos_level ?? null) as number | null,
          skill: skillOfCat.get(category)!, category,
        };
      });
  };

  const editable = editableSkills(p, classId, prog.skills);
  /* Quyền sửa ô tính MỘT lần cho mỗi môn — cùng cửa với `saveRegularScore`, không hỏi lại theo từng dòng. */
  const canEditSkill = new Map(prog.skills.map((k) => [k, scoreEditPath(p, classId, k) !== null]));
  /* Lịch và hạn chấm RIÊNG từng môn — một bài có thể trải hai ba tuần (mục 10.1). */
  const skillRows = loadSkillRows(attempts.map((a) => a.id));
  /* Mã tuần mà dấu "-" đã dời môn đi (C08) — đọc gộp một lần cho cả bảng. */
  const noShowPeriodIds = [...new Set([...byAttempt.values()].flat()
    .map((r: any) => r.no_show_period_id).filter((x: any) => x))] as number[];
  const periodCode = new Map<number, string>();
  const periodStart = new Map<number, string>();
  if (noShowPeriodIds.length) {
    for (const r of conn
      .prepare(`SELECT id, code, week_start FROM report_periods WHERE id IN (${noShowPeriodIds.map(() => '?').join(',')})`)
      .all(...noShowPeriodIds) as any[]) { periodCode.set(r.id, r.code); periodStart.set(r.id, r.week_start); }
  }

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
      const failing = result.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill);
      const dongCases = casesOf(a.student_id, a.cycle_id ?? null, failing);
      const c = dongCases[0] ?? null;
      const views = regularSkillViews({ ...a, period_start: a.week_start }, skillRows.get(a.id), rows as any, demoToday());
      /*
       * HẠN CỦA CẢ BÀI chỉ còn là hạn MUỘN NHẤT trong các môn còn phải chấm — một con số
       * để xếp thứ tự, không phải một luật riêng. Luật nằm ở từng môn, và cột "Hạn từng
       * môn" bên dưới mới là thứ giáo viên đọc.
       */
      const pending = prog.skills
        .map((k) => ({ k, v: views.get(k) }))
        .filter((x) => {
          const row = rows.find((r: any) => r.skill === x.k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return !scored && !!x.v?.deadline;
        });
      const dl = pending.length
        ? pending.map((x) => x.v!.deadline!).sort().slice(-1)[0]
        : null;
      return {
        attemptId: a.id,
        deadline: dl,
        deadlineSource: dl ? 'week_end' : 'none',
        /** Hạn chấm CỦA TỪNG MÔN, kèm tuần thi và trạng thái — mục 10.5. */
        skillSchedule: prog.skills.map((k) => {
          const v = views.get(k)!;
          const row = rows.find((r: any) => r.skill === k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return {
            skill: k,
            label: REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k,
            periodCode: v.periodCode, weekRange: v.weekRange,
            /** Thứ Hai của tuần thi môn này — lưới viết tuần bằng `tuanLich` (G-6), không hiện mã tuần có năm. */
            weekStart: v.weekStart,
            deadline: v.deadline, progress: v.progress, sitStatus: v.sitStatus,
            overdue: !scored && v.overdue,
            /** C08: ô mang dấu "-" — môn đã tự dời khỏi tuần `movedFrom`. Dấu "-" không phải điểm 0. */
            noShow: !!row?.no_show_period_id,
            movedFrom: row?.no_show_period_id ? periodCode.get(row.no_show_period_id) ?? null : null,
            /** Thứ Hai của tuần `movedFrom` — để lưới viết "trả lịch về W3 SEP" bằng `tuanLich`. */
            movedFromStart: row?.no_show_period_id ? periodStart.get(row.no_show_period_id) ?? null : null,
            /** Người đang xem có nhập được điểm / ghi được "-" ở ô này không (phân công hoặc nhập bù). */
            canEdit: canEditSkill.get(k) ?? false,
          };
        }),
        // Quá hạn khi có ÍT NHẤT MỘT môn đã tới hạn mà chưa chấm — không xét theo cả bài.
        overdue: prog.skills.some((k) => {
          const row = rows.find((r: any) => r.skill === k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return !scored && !!views.get(k)?.overdue;
        }),
        kind: a.kind as AttemptKind,
        kindLabel: ATTEMPT_KIND_LABEL[a.kind as AttemptKind] ?? a.kind,
        studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
        studentStatus: a.student_status,
        periodCode: a.period_code ?? null,
        status: a.status,
        result,
        /** Các Case gắn với những môn CHƯA ĐẠT của chính dòng này (theo học viên + khoá + hạng mục). */
        cases: dongCases,
        caseId: c?.id ?? null, caseStatus: c?.status ?? null, caseLevel: c?.level ?? null,
      };
    }),
    today: demoToday(),
  };
}
