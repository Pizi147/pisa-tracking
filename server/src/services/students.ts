import { db, tx } from '../db.ts';
import { JOURNEY_GROUP, PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from './audit.ts';
import { entryBandsOf, scoresOf } from './mock.ts';
import { evaluateMock } from './scoring.ts';
import { weekInfo } from './week.ts';

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

export function listStudents(p: Principal, f: { q?: string; branchId?: number; classId?: number; needAttention?: boolean } = {}) {
  const scope = scopeFor(p, PERMISSIONS.STUDENT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const cs = classScopeSql(scope, 'c');
  const where = [
    `EXISTS (SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
              WHERE e.student_id = s.id AND ${cs.sql})`,
    "s.status != 'archived'",
  ];
  const params: unknown[] = [...cs.params];
  if (f.q) {
    where.push('(s.normalized_name LIKE ? OR s.full_name LIKE ? OR s.student_code LIKE ?)');
    params.push(`%${normalizeName(f.q)}%`, `%${f.q}%`, `%${f.q.toUpperCase()}%`);
  }
  if (f.branchId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                 WHERE e2.student_id = s.id AND c2.branch_id = ? AND e2.status='active')`);
    params.push(f.branchId);
  }
  if (f.classId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments e3 WHERE e3.student_id = s.id AND e3.class_id = ? AND e3.status='active')`);
    params.push(f.classId);
  }

  const rows = conn.prepare(`SELECT s.* FROM students s WHERE ${where.join(' AND ')} ORDER BY s.full_name`).all(...params) as any[];
  const mapped = rows.map((s) => {
    const cur = conn
      .prepare(
        `SELECT c.id, c.code, c.branch_id, b.name AS branch_name FROM enrollments e
           JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
          WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`,
      )
      .get(s.id) as any;
    const latest = latestResult(s.id);
    const next = conn
      .prepare(
        `SELECT id, attempt_no, planned_date, status FROM mock_attempts
          WHERE student_id = ? AND status = 'planned' ORDER BY planned_date LIMIT 1`,
      )
      .get(s.id) as any;
    const openCase = conn
      .prepare(
        `SELECT sc.id, sc.sos_level, sc.status FROM sos_cases sc JOIN mock_attempts a ON a.id = sc.attempt_id
          WHERE a.student_id = ? AND sc.sos_level > 0 AND sc.status != 'done' ORDER BY sc.id DESC LIMIT 1`,
      )
      .get(s.id) as any;
    return {
      id: s.id, studentCode: s.student_code, fullName: s.full_name,
      committedScore: s.committed_score, route: s.route, examDate: s.exam_date,
      classId: cur?.id ?? null, classCode: cur?.code ?? null, branchName: cur?.branch_name ?? null,
      latest, nextMock: next ? { ...next, week: weekInfo(next.planned_date) } : null,
      openCase: openCase ?? null,
    };
  });
  return {
    rows: f.needAttention ? mapped.filter((m) => m.openCase) : mapped,
    scopeEmpty: false,
  };
}

/** Kết quả Mock gần nhất đã chốt đủ bốn kỹ năng. */
export function latestResult(studentId: number) {
  const attempts = db()
    .prepare(`SELECT * FROM mock_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no DESC`)
    .all(studentId) as any[];
  for (const a of attempts) {
    const r = evaluateMock(a.committed_score_at_test, a.attempt_no, entryBandsOf(scoresOf(a.id)));
    if (r.complete) {
      return { attemptId: a.id, attemptNo: a.attempt_no, overall: r.overall, sosLevel: r.sosLevel, expectation: r.expectation };
    }
  }
  return null;
}

export function studentDetail(p: Principal, studentId: number) {
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const enrollments = conn
    .prepare(
      `SELECT e.*, c.code AS class_code, c.kind AS class_kind, b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? ORDER BY e.started_at DESC, e.id DESC`,
    )
    .all(studentId) as any[];

  const attempts = (conn
    .prepare(
      `SELECT a.*, c.code AS class_code FROM mock_attempts a LEFT JOIN classes c ON c.id = a.class_id
        WHERE a.student_id = ? ORDER BY a.attempt_no`,
    )
    .all(studentId) as any[]).map((a) => {
      const rows = scoresOf(a.id);
      const result = evaluateMock(a.committed_score_at_test, a.attempt_no, entryBandsOf(rows));
      const sos = conn.prepare('SELECT id, sos_level, status FROM sos_cases WHERE attempt_id = ?').get(a.id) as any;
      return {
        id: a.id, attemptNo: a.attempt_no, plannedDate: a.planned_date, status: a.status,
        classCode: a.class_code,        // lớp tại thời điểm thi, không đổi khi HS chuyển lớp
        week: weekInfo(a.planned_date),
        expectation: result.expectation, bands: result.bands, overall: result.overall,
        completed: result.completed, complete: result.complete, sosLevel: result.sosLevel,
        caseId: sos?.id ?? null, caseStatus: sos?.status ?? null,
      };
    });

  const openTasks = conn
    .prepare(
      `SELECT t.id, t.code, t.title, t.due_date, t.progress, u.full_name AS assignee_name
         FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
         JOIN sos_cases sc ON sc.id = t.source_sos_case_id
         JOIN mock_attempts a ON a.id = sc.attempt_id
        WHERE a.student_id = ? AND t.progress != 'done'`,
    )
    .all(studentId) as any[];

  const current = enrollments.find((e) => e.status === 'active') ?? null;
  const nextMock = attempts.find((a) => a.status === 'planned') ?? null;

  return {
    id: s.id, studentCode: s.student_code, fullName: s.full_name, dob: s.dob,
    committedScore: s.committed_score, route: s.route, examDate: s.exam_date, note: s.note,
    currentClass: current ? { id: current.class_id, code: current.class_code, branchName: current.branch_name } : null,
    enrollments: enrollments.map((e) => ({
      id: e.id, classId: e.class_id, classCode: e.class_code, branchName: e.branch_name,
      status: e.status, startedAt: e.started_at, endedAt: e.ended_at, endReason: e.end_reason,
    })),
    attempts,
    nextMock,
    openTasks,
    viewer: {
      canEdit: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      canSchedule: can(p, PERMISSIONS.MOCK_SCHEDULE, { studentId }),
    },
  };
}

/** Hành trình chỉ có ba lựa chọn lọc: Tất cả · Assessment · Warning/WL. */
export function journey(p: Principal, studentId: number, filter?: string) {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId });
  const rows = db()
    .prepare(
      `SELECT j.*, u.full_name AS actor_name FROM journey_events j LEFT JOIN users u ON u.id = j.created_by
        WHERE j.student_id = ? ORDER BY j.event_date DESC, j.id DESC`,
    )
    .all(studentId) as any[];
  const mapped = rows.map((e) => ({
    id: e.id, eventType: e.event_type, eventDate: e.event_date, title: e.title,
    detail: e.detail, refTable: e.ref_table, refId: e.ref_id, actorName: e.actor_name,
    group: JOURNEY_GROUP[e.event_type] ?? 'other',
  }));
  if (filter === 'assessment') return mapped.filter((e) => e.group === 'assessment');
  if (filter === 'warning') return mapped.filter((e) => e.group === 'warning');
  return mapped;
}

export function transferStudent(p: Principal, studentId: number, toClassId: number, effectiveDate: string, reason?: string) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId }, 'Bạn không có quyền chuyển lớp học viên này.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: toClassId }, 'Lớp đích nằm ngoài phạm vi bạn được cấp quyền.');
  if (!isIsoDate(effectiveDate)) throw badRequest('Ngày hiệu lực không hợp lệ.');
  return tx(() => {
    const conn = db();
    const toClass = conn.prepare('SELECT * FROM classes WHERE id = ?').get(toClassId) as any;
    if (!toClass) throw notFound('Không tìm thấy lớp đích');
    const cur = conn
      .prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
      .get(studentId) as any;
    if (cur?.class_id === toClassId) throw badRequest('Học viên đã ở lớp này.');
    if (cur) {
      conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
        .run(effectiveDate, reason ?? 'Chuyển lớp', cur.id);
    }
    const info = conn
      .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(studentId, toClassId, effectiveDate, nowIso());
    conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, studentId);
    // Lịch Mock CHƯA thi chuyển sang lớp mới; lần đã thi giữ nguyên lớp cũ để không viết lại lịch sử.
    conn.prepare(`UPDATE mock_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClassId, studentId);
    addJourney({ studentId, eventType: 'transfer', eventDate: effectiveDate,
      title: `Chuyển sang lớp ${toClass.code}`, detail: reason ?? null, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: studentId,
      entityLabel: toClass.code, before: cur, after: { classId: toClassId, effectiveDate } });
    return { newEnrollmentId: Number(info.lastInsertRowid), closedEnrollmentId: cur?.id ?? null };
  });
}

export function setEnrollmentStatus(p: Principal, studentId: number, status: 'paused' | 'active', date: string, reason?: string) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  const conn = db();
  const cur = conn
    .prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status IN ('active','paused') ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;
  if (!cur) throw badRequest('Học viên chưa có lớp đang học.');
  conn.prepare('UPDATE enrollments SET status = ? WHERE id = ?').run(status, cur.id);
  addJourney({
    studentId, eventType: status === 'paused' ? 'pause' : 'resume', eventDate: date,
    title: status === 'paused' ? 'Tạm dừng học' : 'Quay lại học', detail: reason ?? null, createdBy: p.userId,
  });
  writeAudit({ actorUserId: p.userId, action: 'student.enrollment_status', entityType: 'student', entityId: studentId,
    before: { status: cur.status }, after: { status } });
  return conn.prepare('SELECT * FROM enrollments WHERE id = ?').get(cur.id);
}

export function updateStudent(p: Principal, studentId: number, patch: any) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound();
  const map: Record<string, string> = {
    fullName: 'full_name', committedScore: 'committed_score', route: 'route', examDate: 'exam_date', note: 'note', dob: 'dob',
  };
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    sets.push(`${map[k]} = ?`); params.push(v);
    if (k === 'fullName') { sets.push('normalized_name = ?'); params.push(normalizeName(String(v))); }
  }
  if (!sets.length) return s;
  params.push(studentId);
  conn.prepare(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  writeAudit({ actorUserId: p.userId, action: 'student.update', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: s, after: conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}
