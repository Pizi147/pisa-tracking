import { db } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, ENTRY_SKILLS, PERMISSIONS,
  type AssessedSkill, type AttemptKind,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { can, classScopeSql, editableSkills, isCoreTeacherOf, require_, scopeFor, type Principal } from '../permissions.ts';
import { loadBundle, resultOf, skillCells } from './attempts.ts';
import { latestCheckins } from './checkins.ts';
import { allProgrammes, evaluateRegular, programmeOfClass } from './regular.ts';

/**
 * Màn Học viên lấy LỚP làm gốc.
 *
 * Chỉ ba badge, và chỉ những badge trả lời được câu "có gì cần làm?". Sĩ số là thông tin
 * nền nên để dạng chữ, không làm badge. Mỗi badge mở đúng tập bản ghi cấu thành số đó
 * trong cùng phạm vi, nên số đếm ở đây phải dùng chính logic của danh sách lượt.
 */
export type ClassSummary = {
  id: number; code: string; kind: string; route: string | null;
  branchId: number; branchCode: string; branchName: string;
  startDate: string | null;
  studentCount: number;
  /** Số LƯỢT có kỹ năng tới hạn mà người đang xem được phép nhập điểm. */
  needScores: number;
  /** Số CASE SOS chưa xử lý xong — đếm case, không phải học viên. */
  openCases: number;
  /** Số LƯỢT đã chốt tuần nhưng chưa có ngày thực tế. */
  needsDate: number;
  programmeCode: string | null;
  programmeName: string | null;
  scoringMode: string | null;
  mySkills: string[];
  myCoreClass: boolean;
};

/** Một truy vấn cho mỗi loại dữ liệu, không hỏi lại theo từng lớp. */
export function listClassSummaries(p: Principal, f: { branchId?: number; q?: string } = {}) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [] as ClassSummary[], scopeEmpty: true };
  const conn = db();
  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql, "c.status = 'active'"];
  const params: unknown[] = [...cs.params];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }

  const classes = conn
    .prepare(
      `SELECT c.id, c.code, c.kind, c.programme_code, c.route, c.branch_id, c.start_date,
              b.code AS branch_code, b.name AS branch_name,
              pg.name AS programme_name, pg.scoring_mode,
              (SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id = e.student_id
                WHERE e.class_id = c.id AND e.status = 'active' AND s.archived_at IS NULL) AS student_count
         FROM classes c
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where.join(' AND ')} ORDER BY b.id, c.code`,
    )
    .all(...params) as any[];
  if (!classes.length) return { rows: [], scopeEmpty: false };

  const ids = classes.map((c) => c.id);
  const ph = ids.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.id, a.class_id, a.status, a.planned_period_id, a.lrw_scheduled_at, a.speaking_scheduled_at,
              a.deadline_override, a.target_at_attempt, a.attempt_no,
              rp.week_start AS period_start, rp.week_end AS period_end
         FROM assessment_attempts a
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id IN (${ph}) AND a.status != 'cancelled'`,
    )
    .all(...ids) as any[];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const today = demoToday();

  const needScores = new Map<number, number>();
  const openCases = new Map<number, number>();
  const needsDate = new Map<number, number>();
  /*
   * Lớp FT và lớp thường có bộ kỹ năng khác nhau, nên phải hỏi quyền theo đúng bộ của lớp
   * đó — hỏi bằng bộ kỹ năng IELTS cho một lớp Foundation thì luôn ra rỗng.
   */
  const editableByClass = new Map<number, string[]>();
  const skillsByClass = new Map<number, string[]>();
  const ratioClasses = new Set<number>();
  const programmes = allProgrammes();          // ba câu lệnh cho cả bảng, không phải ba câu mỗi lớp
  for (const c of classes) {
    const prog = c.programme_code ? programmes.get(c.programme_code) ?? null : null;
    const skills = prog?.skills ?? [...ENTRY_SKILLS];
    if (prog?.scoringMode === 'ratio') ratioClasses.add(c.id);
    skillsByClass.set(c.id, skills);
    editableByClass.set(c.id, editableSkills(p, c.id, skills));
  }

  const bump = (m: Map<number, number>, k: number) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const a of attempts) {
    /*
     * "Cần cập nhật ngày MT" chỉ tính khi ĐÃ ĐẾN tuần MT đó (hoặc đã qua mà vẫn thiếu).
     * MT còn cách vài tuần thì chưa ai phải làm gì — đếm nó vào đây chỉ tạo một con số to
     * lúc nào cũng đỏ, và người dùng học cách phớt lờ badge.
     */
    if (a.status === 'planned' && !a.lrw_scheduled_at && a.period_start && a.period_start <= today) {
      bump(needsDate, a.class_id);
    }
    const c = bundle.cases.get(a.id);
    if (c && c.sos_level > 0 && c.status !== 'done') bump(openCases, a.class_id);

    const editable = editableByClass.get(a.class_id) ?? [];
    if (!editable.length) continue;

    if (ratioClasses.has(a.class_id)) {
      /*
       * Lớp thường: "cần nhập điểm" là kỹ năng người này phụ trách mà chưa có điểm, và bài
       * đã tới ngày làm. Thiếu điểm KHÁC trượt, nên chỉ đếm là việc phải làm chứ không kết luận.
       */
      const rows = bundle.scores.get(a.id) ?? [];
      const dueForEntry = !!a.lrw_scheduled_at && String(a.lrw_scheduled_at).slice(0, 10) <= today;
      const missingMine = editable.some((k) => {
        const row = rows.find((r) => r.skill === k);
        return row?.raw_score === null || row?.raw_score === undefined;
      });
      if (dueForEntry && missingMine) bump(needScores, a.class_id);
      continue;
    }

    const cells = skillCells(p, a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], today);
    if (cells.some((x) => x.canEdit && x.band === null && (x.progress === 'performed' || x.progress === 'due'))) {
      bump(needScores, a.class_id);
    }
  }

  let rows: ClassSummary[] = classes.map((c) => ({
    id: c.id, code: c.code, kind: c.kind, route: c.route,
    programmeCode: c.programme_code ?? null,
    programmeName: c.programme_name ?? null,
    /** Lớp thường chấm theo số câu đúng; lớp FT chấm theo band IELTS. */
    scoringMode: c.scoring_mode ?? null,
    branchId: c.branch_id, branchCode: c.branch_code, branchName: c.branch_name,
    startDate: c.start_date,
    studentCount: c.student_count,
    needScores: needScores.get(c.id) ?? 0,
    openCases: openCases.get(c.id) ?? 0,
    needsDate: needsDate.get(c.id) ?? 0,
    /*
     * Kỹ năng người ĐANG XEM dạy ở chính lớp này.
     *
     * Một giáo viên dạy nhiều lớp và ở mỗi lớp có thể ôm bộ kỹ năng khác nhau — nhìn danh
     * sách lớp mà không biết mình phụ trách gì ở đâu thì phải mở từng lớp ra dò.
     */
    mySkills: editableByClass.get(c.id) ?? [],
    myCoreClass: isCoreTeacherOf(p, c.id),
  }));

  // Tìm theo tên học viên phải trả về đúng LỚP chứa em đó, không phải danh sách rỗng.
  if (f.q?.trim()) {
    const q = f.q.trim();
    const matched = new Set(
      (conn
        .prepare(
          `SELECT DISTINCT e.class_id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.status = 'active'
              AND (s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ?)`,
        )
        .all(`%${q}%`, `%${q.toLowerCase()}%`, `%${q.toUpperCase()}%`) as any[]).map((r) => r.class_id),
    );
    const lower = q.toLowerCase();
    rows = rows.filter((r) => r.code.toLowerCase().includes(lower) || matched.has(r.id));
  }
  return { rows, scopeEmpty: false };
}

/**
 * Danh sách học viên của một lớp — chỉ nạp khi người dùng mở rộng lớp đó.
 * Mỗi em kèm tiến trình MT gọn để không phải mở chi tiết mới biết đang ở đâu.
 */
export function classRoster(p: Principal, classId: number, q?: string) {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const params: unknown[] = [classId];
  let sql = `SELECT s.*, e.status AS enrollment_status,
                    cy.id AS cycle_id, cy.seq AS cycle_seq, cy.route, cy.target_score, cy.exam_date
               FROM enrollments e
               JOIN students s ON s.id = e.student_id
               LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
              WHERE e.class_id = ? AND e.status = 'active'`;
  if (q?.trim()) {
    sql += ' AND (s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ?)';
    params.push(`%${q.trim()}%`, `%${q.trim().toLowerCase()}%`, `%${q.trim().toUpperCase()}%`);
  }
  sql += ' ORDER BY s.archived_at IS NOT NULL, s.full_name';
  const students = conn.prepare(sql).all(...params) as any[];
  if (!students.length) return [];

  const sids = students.map((s) => s.id);
  const ph = sids.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.*, cy.seq AS cycle_seq, cy.route, pr.code AS period_code, pr.week_start
         FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.student_id IN (${ph})
        ORDER BY cy.seq, a.attempt_no`,
    )
    .all(...sids) as any[];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const today = demoToday();
  const byStudent = new Map<number, any[]>();
  for (const a of attempts) {
    if (!byStudent.has(a.student_id)) byStudent.set(a.student_id, []);
    byStudent.get(a.student_id)!.push(a);
  }

  // Lớp thường chấm khác lớp FT, nên đọc chương trình một lần rồi dùng lại cho mọi dòng.
  const prog = programmeOfClass(classId);
  const isRatio = prog?.scoringMode === 'ratio';
  const myRegularSkills = isRatio ? editableSkills(p, classId, prog!.skills) : [];

  return students.map((s) => {
    const list = byStudent.get(s.id) ?? [];
    const timeline = list.map((a) => {
      const scores = bundle.scores.get(a.id) ?? [];
      const c = bundle.cases.get(a.id);

      if (isRatio) {
        /*
         * Bài kiểm tra lớp thường: không có band, không có Overall, không có kỳ vọng theo
         * target. Chỉ có đạt/trượt theo tỷ lệ số câu đúng, và số môn trượt ra mức SOS.
         */
        const r = evaluateRegular(prog!.skills, scores);
        const dueForEntry = !!a.lrw_scheduled_at && String(a.lrw_scheduled_at).slice(0, 10) <= today;
        return {
          id: a.id, attemptNo: a.attempt_no, cycleSeq: a.cycle_seq, route: null,
          kind: a.kind, kindLabel: ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind,
          periodCode: a.period_code, lrwScheduledAt: a.lrw_scheduled_at,
          status: a.status,
          needsDate: a.status === 'planned' && !a.lrw_scheduled_at
            && !!a.week_start && a.week_start <= today,
          scoredRequired: r.scored, requiredCount: r.required,
          // Lớp thường KHÔNG có Overall IELTS — để trống thay vì dựng một con số giả.
          overall: null,
          passedCount: r.complete ? r.required - (r.failedCount ?? 0) : null,
          failedCount: r.failedCount,
          sosLevel: r.sosLevel, evaluable: r.complete,
          caseStatus: c?.status ?? null,
          myPending: dueForEntry
            ? myRegularSkills.filter((k) => {
                const row = scores.find((x) => x.skill === k);
                return row?.raw_score === null || row?.raw_score === undefined;
              })
            : [],
          overdueSkills: 0,
        };
      }

      const skips = bundle.skips.get(a.id) ?? [];
      const result = resultOf(a, scores, skips);
      const cells = skillCells(p, a, scores, skips, today);
      return {
        id: a.id, attemptNo: a.attempt_no, cycleSeq: a.cycle_seq, route: a.route,
        periodCode: a.period_code, lrwScheduledAt: a.lrw_scheduled_at,
        status: a.status,
        // Cùng quy tắc thời điểm với badge của lớp: chưa đến tuần thì chưa phải việc.
        needsDate: a.status === 'planned' && !a.lrw_scheduled_at
          && !!a.week_start && a.week_start <= today,
        kind: a.kind, kindLabel: `MT${a.attempt_no}`,
        scoredRequired: result.scoredRequired, requiredCount: result.required.length,
        overall: result.overall,
        passedCount: null, failedCount: result.failedCount,
        sosLevel: result.sosLevel, evaluable: result.evaluable,
        caseStatus: c?.status ?? null,
        myPending: cells.filter((x) => x.canEdit && x.band === null && (x.progress === 'performed' || x.progress === 'due'))
          .map((x) => x.skill),
        overdueSkills: cells.filter((x) => x.overdue).length,
      };
    });
    const done = timeline.filter((t) => t.evaluable);
    return {
      id: s.id, studentCode: s.student_code, fullName: s.full_name, status: s.status,
      archived: !!s.archived_at,
      cycle: s.cycle_id
        ? { id: s.cycle_id, seq: s.cycle_seq, route: s.route, target: s.target_score, examDate: s.exam_date }
        : null,
      latest: done.length ? done[done.length - 1] : null,
      next: timeline.find((t) => t.status === 'planned') ?? null,
      timeline,
      checkins: latestCheckins(s.id, s.cycle_id ?? null),
      myPending: [...new Set(timeline.flatMap((t) => t.myPending))],
    };
  });
}

/** Trang tổng quan một lớp: thông tin lớp, phân công, và những việc cần chú ý. */
export function classOverview(p: Principal, classId: number) {
  const conn = db();
  const cls = conn
    .prepare(
      `SELECT c.*, b.code AS branch_code, b.name AS branch_name FROM classes c
         JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
    )
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');

  const summary = listClassSummaries(p, {}).rows.find((r) => r.id === classId) ?? null;
  const assignments = conn
    .prepare(
      `SELECT ta.skill, ta.is_core, u.id AS user_id, u.full_name FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id WHERE ta.class_id = ? AND ta.status = 'active' ORDER BY ta.is_core DESC, ta.id`,
    )
    .all(classId) as any[];
  const skills = (conn.prepare('SELECT skill, sessions_per_week FROM class_skills WHERE class_id = ?').all(classId) as any[]);

  // Bộ kỹ năng của lớp lấy theo CHƯƠNG TRÌNH của lớp đó, không mặc định là bộ IELTS.
  const prog = programmeOfClass(classId);
  const classSkills = prog?.skills ?? [...ENTRY_SKILLS];

  return {
    id: cls.id, code: cls.code, kind: cls.kind, route: cls.route,
    isFulltime: cls.is_fulltime === 1, startDate: cls.start_date, note: cls.note,
    branchId: cls.branch_id, branchCode: cls.branch_code, branchName: cls.branch_name,
    programme: prog ? { code: prog.code, name: prog.name, weeks: prog.weeks, scoringMode: prog.scoringMode } : null,
    summary,
    skills: skills.map((s) => ({ skill: s.skill, sessionsPerWeek: s.sessions_per_week })),
    coreTeachers: assignments.filter((a) => a.is_core === 1).map((a) => ({ id: a.user_id, name: a.full_name })),
    skillTeachers: assignments.filter((a) => a.skill).map((a) => ({ skill: a.skill, id: a.user_id, name: a.full_name })),
    viewer: {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
      canSetDate: can(p, PERMISSIONS.SCHEDULE_DATE, { classId }),
      canAddStudents: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
      editableSkills: editableSkills(p, classId, classSkills),
      isCoreTeacher: isCoreTeacherOf(p, classId),
    },
  };
}

export type { AssessedSkill };
