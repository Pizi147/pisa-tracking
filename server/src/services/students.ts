import { db, tx } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso, normalizeName, padCode, weekStartOf, addDays } from '../util.ts';
import { can, require_, studentScopeSql, viewScope, type Principal } from '../permissions.ts';
import { addJourneyEvent, writeAudit } from './audit.ts';
import { computeSignals, ensureWeeklyRecord, toWeeklyView } from './weekly.ts';

/** Sinh Student ID trong transaction — an toàn cả khi import hàng loạt. */
export function nextStudentCode(): string {
  const conn = db();
  const row = conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any;
  if (!row) {
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 2)').run();
    return padCode('PISA', 1);
  }
  conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
  return padCode('PISA', row.next_value);
}

export type StudentListFilters = {
  q?: string;
  branchId?: number;
  classId?: number;
  classCategory?: 'FT' | 'NORMAL';
  status?: string;
  concern?: 'concern' | 'warning' | 'needs_update';
  consultantId?: number;
  limit?: number;
  offset?: number;
};

export function listStudents(p: Principal, f: StudentListFilters) {
  const scope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);
  if (scope.none) return { rows: [], total: 0, scopeEmpty: true };
  const sc = studentScopeSql(scope);

  const where: string[] = [sc.sql, "s.status != 'archived'"];
  const params: unknown[] = [...sc.params];

  if (f.q) {
    where.push('(s.normalized_name LIKE ? OR s.student_code LIKE ? OR s.full_name LIKE ?)');
    const n = `%${normalizeName(f.q)}%`;
    params.push(n, `%${f.q.toUpperCase()}%`, `%${f.q}%`);
  }
  if (f.branchId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments ef JOIN classes cf ON cf.id = ef.class_id
                 WHERE ef.student_id = s.id AND cf.branch_id = ?)`);
    params.push(f.branchId);
  }
  if (f.classId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments ec WHERE ec.student_id = s.id AND ec.class_id = ?
                  AND ec.status IN ('active','paused'))`);
    params.push(f.classId);
  }
  if (f.classCategory) {
    where.push(`EXISTS (SELECT 1 FROM enrollments ek JOIN classes ck ON ck.id = ek.class_id
                 JOIN class_types ct ON ct.id = ck.class_type_id
                 WHERE ek.student_id = s.id AND ek.status IN ('active','paused') AND ct.category = ?)`);
    params.push(f.classCategory);
  }
  if (f.status) { where.push('s.status = ?'); params.push(f.status); }
  if (f.consultantId) {
    where.push(`EXISTS (SELECT 1 FROM consultant_assignments ca WHERE ca.student_id = s.id
                  AND ca.user_id = ? AND ca.status = 'active')`);
    params.push(f.consultantId);
  }

  const all = db()
    .prepare(`SELECT s.* FROM students s WHERE ${where.join(' AND ')} ORDER BY s.full_name`)
    .all(...params) as any[];

  const ids = all.map((s) => s.id);
  const signals = computeSignals(ids);
  const enriched = all.map((s) => decorateStudentRow(p, s, signals.get(s.id)));

  let filtered = enriched;
  if (f.concern === 'concern') filtered = enriched.filter((r) => r.signal?.concern);
  if (f.concern === 'warning') filtered = enriched.filter((r) => r.warningOpen > 0);
  if (f.concern === 'needs_update') filtered = enriched.filter((r) => r.needsUpdateWeeks > 0);

  const total = filtered.length;
  const offset = f.offset ?? 0;
  const limit = f.limit ?? 100;
  return { rows: filtered.slice(offset, offset + limit), total, scopeEmpty: false };
}

function decorateStudentRow(p: Principal, s: any, signal: any) {
  const conn = db();
  const current = conn
    .prepare(
      `SELECT e.id AS enrollment_id, e.status, c.id AS class_id, c.code AS class_code, c.name AS class_name,
              ct.category, b.id AS branch_id, b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id
         JOIN class_types ct ON ct.id = c.class_type_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? AND e.status IN ('active','paused')
        ORDER BY CASE e.status WHEN 'active' THEN 0 ELSE 1 END, e.id DESC`,
    )
    .all(s.id) as any[];

  const official = latestOfficialAssessment(s.id);
  const consultant = conn
    .prepare(
      `SELECT u.id, u.full_name FROM consultant_assignments ca JOIN users u ON u.id = ca.user_id
        WHERE ca.student_id = ? AND ca.status = 'active' LIMIT 1`,
    )
    .get(s.id) as any;
  const warningOpen = (conn
    .prepare(`SELECT COUNT(*) AS n FROM warning_references WHERE student_id = ? AND status != 'closed'`)
    .get(s.id) as any).n as number;
  const needsUpdateWeeks = (conn
    .prepare(
      `SELECT COUNT(*) AS n FROM weekly_learning_records
        WHERE student_id = ? AND applicable = 1 AND attended_main_sessions IS NULL
          AND expected_main_sessions > 0 AND week_start >= ?`,
    )
    .get(s.id, weekStartOf(addDays(demoToday(), -28))) as any).n as number;

  return {
    id: s.id,
    studentCode: s.student_code,
    fullName: s.full_name,
    dob: s.dob,
    targetBand: s.target_band,
    examDate: s.exam_date,
    status: s.status,
    enrollments: current.map((e) => ({
      enrollmentId: e.enrollment_id,
      status: e.status,
      classId: e.class_id,
      classCode: e.class_code,
      className: e.class_name,
      category: e.category,
      branchId: e.branch_id,
      branchName: e.branch_name,
    })),
    officialScore: official,
    consultant: consultant ? { id: consultant.id, name: consultant.full_name } : null,
    signal,
    warningOpen,
    needsUpdateWeeks,
  };
}

/** Bài official gần nhất theo ngày. Không ghép điểm từ nhiều bài. */
export function latestOfficialAssessment(studentId: number) {
  const a = db()
    .prepare(
      `SELECT * FROM assessments WHERE student_id = ? AND test_type IN ('entrance','mock')
        ORDER BY test_date DESC, id DESC LIMIT 1`,
    )
    .get(studentId) as any;
  if (!a) return null;
  const scores = db().prepare('SELECT skill, score FROM assessment_scores WHERE assessment_id = ?').all(a.id) as any[];
  const map: Record<string, number | null> = {};
  for (const s of scores) map[s.skill] = s.score;
  return {
    assessmentId: a.id,
    testType: a.test_type,
    testDate: a.test_date,
    scale: a.scale,
    title: a.title,
    scores: {
      listening: map.listening ?? null,
      reading: map.reading ?? null,
      writing: map.writing ?? null,
      speaking: map.speaking ?? null,
      overall: map.overall ?? null,
    },
    missingSkills: (['listening', 'reading', 'writing', 'speaking'] as const).filter((k) => map[k] == null),
  };
}

export type StudentDetail = ReturnType<typeof getStudentDetail>;

export function getStudentDetail(p: Principal, studentId: number) {
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.ACADEMIC_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const canSeeInternal = can(p, PERMISSIONS.NOTE_INTERNAL_VIEW, { studentId });
  const canEditSummary = can(p, PERMISSIONS.SUMMARY_EDIT, { studentId });
  const canEditOfficial = can(p, PERMISSIONS.OFFICIAL_SCORE_EDIT, { studentId });
  const canTransfer = can(p, PERMISSIONS.STUDENT_TRANSFER, { studentId });

  const enrollments = conn
    .prepare(
      `SELECT e.*, c.code AS class_code, c.name AS class_name, c.id AS class_id,
              ct.category, ct.name AS class_type_name, b.id AS branch_id, b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id
         JOIN class_types ct ON ct.id = c.class_type_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? ORDER BY e.enrolled_at DESC, e.id DESC`,
    )
    .all(studentId) as any[];

  const skillReg = new Map<number, any[]>();
  for (const e of enrollments) {
    skillReg.set(
      e.id,
      conn.prepare('SELECT skill, registered, expected_main_sessions_per_week FROM enrollment_skills WHERE enrollment_id = ?').all(e.id) as any[],
    );
  }

  const assessments = conn
    .prepare('SELECT * FROM assessments WHERE student_id = ? ORDER BY test_date DESC, id DESC')
    .all(studentId) as any[];
  const assessmentsFull = assessments.map((a) => ({
    id: a.id,
    testType: a.test_type,
    scale: a.scale,
    testDate: a.test_date,
    title: a.title,
    note: a.note,
    scores: conn.prepare('SELECT skill, score FROM assessment_scores WHERE assessment_id = ?').all(a.id) as any[],
  }));

  const estimates = conn
    .prepare(
      `SELECT te.*, u.full_name AS teacher_name FROM teacher_estimates te
         LEFT JOIN users u ON u.id = te.teacher_user_id
        WHERE te.student_id = ? ORDER BY te.estimate_date DESC, te.id DESC`,
    )
    .all(studentId) as any[];

  const warnings = conn.prepare('SELECT * FROM warning_references WHERE student_id = ? ORDER BY issued_date DESC').all(studentId) as any[];
  const incidents = conn.prepare('SELECT * FROM incident_references WHERE student_id = ? ORDER BY incident_date DESC').all(studentId) as any[];
  const reports = conn
    .prepare(
      `SELECT r.*, u.full_name AS author_name FROM student_progress_reports r
         LEFT JOIN users u ON u.id = r.author_user_id
        WHERE r.student_id = ? ORDER BY r.report_date DESC`,
    )
    .all(studentId) as any[];
  const notes = canSeeInternal
    ? (conn
        .prepare(
          `SELECT n.*, u.full_name AS author_name FROM teacher_notes n
             LEFT JOIN users u ON u.id = n.author_user_id
            WHERE n.student_id = ? ORDER BY n.created_at DESC`,
        )
        .all(studentId) as any[])
    : (conn
        .prepare(
          `SELECT n.*, u.full_name AS author_name FROM teacher_notes n
             LEFT JOIN users u ON u.id = n.author_user_id
            WHERE n.student_id = ? AND n.visibility = 'shared' ORDER BY n.created_at DESC`,
        )
        .all(studentId) as any[]);

  const signal = computeSignals([studentId]).get(studentId)!;
  const nextTask = conn
    .prepare(
      `SELECT t.id, t.code, t.title, t.deadline, t.status, u.full_name AS assignee_name
         FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
        WHERE t.student_id = ? AND t.status != 'completed'
        ORDER BY CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END, t.deadline LIMIT 1`,
    )
    .get(studentId) as any;
  const openIssues = conn
    .prepare(`SELECT id, code, title, status, risk_level FROM issues WHERE student_id = ? AND status != 'resolved'`)
    .all(studentId) as any[];

  const consultants = conn
    .prepare(
      `SELECT u.id, u.full_name, ca.effective_from FROM consultant_assignments ca
         JOIN users u ON u.id = ca.user_id WHERE ca.student_id = ? AND ca.status = 'active'`,
    )
    .all(studentId) as any[];

  const detail = {
    id: s.id,
    studentCode: s.student_code,
    fullName: s.full_name,
    dob: s.dob,
    targetBand: s.target_band,
    examDate: s.exam_date,
    status: s.status,
    note: s.note,
    branchId: s.branch_id,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      classId: e.class_id,
      classCode: e.class_code,
      className: e.class_name,
      category: e.category,
      classTypeName: e.class_type_name,
      branchId: e.branch_id,
      branchName: e.branch_name,
      status: e.status,
      attemptNo: e.attempt_no,
      enrolledAt: e.enrolled_at,
      endedAt: e.ended_at,
      endReason: e.end_reason,
      note: e.note,
      skills: (skillReg.get(e.id) ?? []).map((r) => ({
        skill: r.skill,
        registered: r.registered === 1,
        expectedPerWeek: r.expected_main_sessions_per_week,
      })),
      transferredFrom: e.transferred_from_enrollment_id,
      transferredTo: e.transferred_to_enrollment_id,
    })),
    officialScore: latestOfficialAssessment(studentId),
    assessments: assessmentsFull,
    estimates: estimates.map((e) => ({
      id: e.id,
      teachingSkill: e.teaching_skill,
      band: e.band,
      weekStart: e.week_start,
      estimateDate: e.estimate_date,
      teacherName: e.teacher_name,
      note: e.note,
    })),
    warnings: warnings.map((w) => projectWarning(w, canSeeInternal)),
    incidents: canSeeInternal
      ? incidents.map((i) => ({ ...i, redacted: false }))
      : incidents.map((i) => ({
          id: i.id, incident_date: i.incident_date, type: i.type, status: i.status,
          reason: i.reason, description: null, redacted: true,
        })),
    progressReports: reports.map((r) => projectProgressReport(r, canSeeInternal)),
    notes: notes.map((n) => ({
      id: n.id, body: n.body, visibility: n.visibility, skill: n.skill,
      authorName: n.author_name, createdAt: n.created_at,
    })),
    signal,
    nextTask: nextTask
      ? { id: nextTask.id, code: nextTask.code, title: nextTask.title, deadline: nextTask.deadline, status: nextTask.status, assigneeName: nextTask.assignee_name }
      : null,
    openIssues,
    consultants: consultants.map((c) => ({ id: c.id, name: c.full_name })),
    viewer: {
      canSeeInternal,
      canEditSummary,
      canEditOfficial,
      canTransfer,
      canEditEstimateSkills: TEACHING_SKILLS.filter((skill) =>
        enrollments.some((e) => can(p, PERMISSIONS.ESTIMATE_EDIT, { classId: e.class_id, skill })),
      ),
      projection: canSeeInternal ? 'full' : 'shared',
    },
  };
  return detail;
}

function projectWarning(w: any, canSeeInternal: boolean) {
  return {
    id: w.id,
    issuedDate: w.issued_date,
    level: w.level,
    reason: w.reason,
    status: w.status,
    description: canSeeInternal ? w.description : null,
    followUp: w.follow_up,
    redacted: !canSeeInternal,
  };
}

function projectProgressReport(r: any, canSeeInternal: boolean) {
  if (canSeeInternal) {
    return {
      id: r.id, periodLabel: r.period_label, reportDate: r.report_date,
      progressSummary: r.progress_summary, attitudeSummary: r.attitude_summary,
      nextSteps: r.next_steps, sharedSummary: r.shared_summary,
      authorName: r.author_name, enrollmentId: r.enrollment_id, redacted: false,
    };
  }
  // Tư vấn viên chỉ nhận phần summary được chia sẻ.
  return {
    id: r.id, periodLabel: r.period_label, reportDate: r.report_date,
    progressSummary: null, attitudeSummary: null, nextSteps: null,
    sharedSummary: r.shared_summary, authorName: r.author_name,
    enrollmentId: r.enrollment_id, redacted: true,
  };
}

export function getJourney(p: Principal, studentId: number, types?: string[]) {
  require_(p, PERMISSIONS.ACADEMIC_VIEW, { studentId });
  const canSeeInternal = can(p, PERMISSIONS.NOTE_INTERNAL_VIEW, { studentId });
  let sql = `SELECT j.*, u.full_name AS actor_name, c.code AS class_code
               FROM journey_events j
               LEFT JOIN users u ON u.id = j.created_by
               LEFT JOIN enrollments e ON e.id = j.enrollment_id
               LEFT JOIN classes c ON c.id = e.class_id
              WHERE j.student_id = ?`;
  const params: unknown[] = [studentId];
  if (!canSeeInternal) sql += ` AND j.visibility = 'shared'`;
  if (types?.length) {
    sql += ` AND j.event_type IN (${types.map(() => '?').join(',')})`;
    params.push(...types);
  }
  sql += ' ORDER BY j.event_date DESC, j.id DESC';
  return (db().prepare(sql).all(...params) as any[]).map((e) => ({
    id: e.id,
    eventType: e.event_type,
    eventDate: e.event_date,
    title: e.title,
    detail: e.detail,
    classCode: e.class_code,
    enrollmentId: e.enrollment_id,
    actorName: e.actor_name,
    visibility: e.visibility,
  }));
}

export function getStudentWeekly(p: Principal, studentId: number, weeks = 8) {
  require_(p, PERMISSIONS.ACADEMIC_VIEW, { studentId });
  const from = weekStartOf(addDays(demoToday(), -7 * (weeks - 1)));
  const rows = db()
    .prepare(
      `SELECT w.*, u.full_name AS updated_by_name, c.code AS class_code
         FROM weekly_learning_records w
         LEFT JOIN users u ON u.id = w.updated_by
         JOIN classes c ON c.id = w.class_id
        WHERE w.student_id = ? AND w.week_start >= ?
        ORDER BY w.week_start DESC, w.skill`,
    )
    .all(studentId, from) as any[];
  return rows.map((r) => ({ ...toWeeklyView(r), classCode: r.class_code }));
}

/** Chuyển lớp: đóng enrollment cũ + mở enrollment mới trong cùng transaction, giữ lịch sử. */
export function transferStudent(
  p: Principal,
  studentId: number,
  input: { toClassId: number; effectiveDate: string; reason?: string; keepSkills?: boolean; endStatus?: 'transferred' | 'completed' },
) {
  require_(p, PERMISSIONS.STUDENT_TRANSFER, { studentId }, 'Bạn không có quyền chuyển lớp học viên này.');
  require_(p, PERMISSIONS.STUDENT_TRANSFER, { classId: input.toClassId }, 'Lớp đích nằm ngoài phạm vi bạn được cấp quyền.');

  return tx(() => {
    const conn = db();
    const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
    if (!student) throw notFound('Không tìm thấy học viên');
    const toClass = conn.prepare('SELECT * FROM classes WHERE id = ?').get(input.toClassId) as any;
    if (!toClass) throw notFound('Không tìm thấy lớp đích');

    const currentEnr = conn
      .prepare(
        `SELECT * FROM enrollments WHERE student_id = ? AND status IN ('active','paused')
          ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, id DESC LIMIT 1`,
      )
      .get(studentId) as any;
    if (currentEnr && currentEnr.class_id === input.toClassId) {
      throw badRequest('Học viên đã ở lớp này.');
    }

    const before = currentEnr ? { ...currentEnr } : null;
    if (currentEnr) {
      conn
        .prepare(`UPDATE enrollments SET status = ?, ended_at = ?, end_reason = ? WHERE id = ?`)
        .run(input.endStatus ?? 'transferred', input.effectiveDate, input.reason ?? 'Chuyển lớp', currentEnr.id);
    }

    const priorAttempts = (conn
      .prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ? AND class_id = ?')
      .get(studentId, input.toClassId) as any).n as number;

    const info = conn
      .prepare(
        `INSERT INTO enrollments
          (student_id, class_id, status, attempt_no, enrolled_at, starts_at, transferred_from_enrollment_id, note, created_at)
         VALUES (?,?,'active',?,?,?,?,?,?)`,
      )
      .run(studentId, input.toClassId, priorAttempts + 1, input.effectiveDate, input.effectiveDate,
           currentEnr?.id ?? null, input.reason ?? null, nowIso());
    const newId = Number(info.lastInsertRowid);

    if (currentEnr) {
      conn.prepare('UPDATE enrollments SET transferred_to_enrollment_id = ? WHERE id = ?').run(newId, currentEnr.id);
    }

    // Đăng ký skill cho lần học mới: giữ nguyên đăng ký cũ hoặc lấy theo cấu hình lớp mới.
    const sourceSkills = input.keepSkills && currentEnr
      ? (conn.prepare('SELECT skill, registered, expected_main_sessions_per_week FROM enrollment_skills WHERE enrollment_id = ?').all(currentEnr.id) as any[])
      : (conn.prepare('SELECT skill, 1 AS registered, NULL AS expected_main_sessions_per_week FROM class_skill_config WHERE class_id = ?').all(input.toClassId) as any[]);
    for (const sk of sourceSkills) {
      conn
        .prepare('INSERT INTO enrollment_skills (enrollment_id, skill, registered, expected_main_sessions_per_week) VALUES (?,?,?,?)')
        .run(newId, sk.skill, sk.registered, sk.expected_main_sessions_per_week ?? null);
    }

    conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, studentId);

    addJourneyEvent({
      studentId,
      enrollmentId: newId,
      eventType: 'transfer',
      eventDate: input.effectiveDate,
      title: `Chuyển sang lớp ${toClass.code}`,
      detail: input.reason ?? null,
      createdBy: p.userId,
    });
    writeAudit({
      actorUserId: p.userId,
      action: 'student.transfer',
      entityType: 'student',
      entityId: studentId,
      entityLabel: `${student.student_code} → ${toClass.code}`,
      studentId,
      branchId: toClass.branch_id,
      before,
      after: conn.prepare('SELECT * FROM enrollments WHERE id = ?').get(newId),
    });

    return { newEnrollmentId: newId, closedEnrollmentId: currentEnr?.id ?? null };
  });
}

export function createStudentNote(p: Principal, studentId: number, body: string, visibility: 'internal' | 'shared', skill?: string | null) {
  const enr = db()
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status IN ('active','paused') ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;
  const ctx = { studentId, classId: enr?.class_id ?? null, skill: skill ?? null };
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, ctx) && !can(p, PERMISSIONS.SUMMARY_EDIT, { studentId })) {
    require_(p, PERMISSIONS.SUMMARY_EDIT, { studentId }, 'Bạn không có quyền ghi chú cho học viên này.');
  }
  const info = db()
    .prepare(
      `INSERT INTO teacher_notes (student_id, enrollment_id, class_id, skill, body, visibility, author_user_id, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(studentId, null, enr?.class_id ?? null, skill ?? null, body, visibility, p.userId, nowIso());
  addJourneyEvent({
    studentId, eventType: 'note', eventDate: demoToday(),
    title: 'Ghi chú của giáo viên', detail: visibility === 'internal' ? 'Ghi chú nội bộ' : body.slice(0, 120),
    visibility, createdBy: p.userId, refTable: 'teacher_notes', refId: Number(info.lastInsertRowid),
  });
  return Number(info.lastInsertRowid);
}
