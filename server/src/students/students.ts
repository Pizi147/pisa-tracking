import { db, tx } from '../db.ts';
import { ARCHIVE_AFTER_DAYS, ENTRY_SKILLS, JOURNEY_GROUP, PERMISSIONS, STUDENT_STATUSES } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, isIsoDate, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { entryBandsOf, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { evaluateAttempt } from '../fasttrack/scoring.ts';
import { currentCycle, cyclesOf, examPlanOf } from '../fasttrack/cycles.ts';

import { weekInfo } from '../platform/week.ts';

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
    const cycle = currentCycle(s.id);
    const latest = latestResult(s.id);
    const next = conn
      .prepare(
        `SELECT a.id, a.attempt_no, a.status, pr.code AS period_code, pr.week_start
           FROM assessment_attempts a LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.student_id = ? AND a.status = 'planned' ORDER BY pr.week_start, a.attempt_no LIMIT 1`,
      )
      .get(s.id) as any;
    const openCase = conn
      .prepare(
        `SELECT sc.id, sc.sos_level, sc.status FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.student_id = ? AND sc.sos_level > 0 AND sc.status != 'done' ORDER BY sc.id DESC LIMIT 1`,
      )
      .get(s.id) as any;
    return {
      id: s.id, studentCode: s.student_code, fullName: s.full_name, status: s.status,
      cycleId: cycle?.id ?? null, route: cycle?.route ?? null,
      target: cycle?.target_score ?? null, examPlan: examPlanOf(cycle),
      classId: cur?.id ?? null, classCode: cur?.code ?? null, branchName: cur?.branch_name ?? null,
      latest,
      nextMock: next
        ? { id: next.id, attemptNo: next.attempt_no, periodCode: next.period_code,
            weekStart: next.week_start ?? null }
        : null,
      openCase: openCase ?? null,
    };
  });
  return {
    rows: f.needAttention ? mapped.filter((m) => m.openCase) : mapped,
    scopeEmpty: false,
  };
}

/**
 * Kết quả gần nhất đã đủ căn cứ kết luận.
 * Sắp theo lộ trình rồi mới tới số lần, vì số MT được đánh lại từ đầu ở lộ trình mới.
 */
export function latestResult(studentId: number) {
  const attempts = db()
    .prepare(
      `SELECT a.*, cy.seq AS cycle_seq, cy.route FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.student_id = ? AND a.status != 'cancelled'
        ORDER BY cy.seq DESC, a.attempt_no DESC`,
    )
    .all(studentId) as any[];
  for (const a of attempts) {
    const r = evaluateAttempt(a.target_at_attempt, a.attempt_no, entryBandsOf(scoresOf(a.id)), skipsOf(a.id));
    if (r.evaluable) {
      return {
        attemptId: a.id, attemptNo: a.attempt_no, route: a.route, cycleSeq: a.cycle_seq,
        overall: r.overall, sosLevel: r.sosLevel, expectation: r.expectation, scopeNote: r.scopeNote,
      };
    }
  }
  return null;
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
    // Lượt CHƯA xong chuyển sang lớp mới; lượt đã xong giữ nguyên lớp cũ để không viết lại lịch sử.
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClassId, studentId);
    addJourney({ studentId, eventType: 'transfer', eventDate: effectiveDate,
      title: `Chuyển sang lớp ${toClass.code}`, detail: reason ?? null, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: studentId,
      entityLabel: toClass.code, before: cur, after: { classId: toClassId, effectiveDate } });
    return { newEnrollmentId: Number(info.lastInsertRowid), closedEnrollmentId: cur?.id ?? null };
  });
}

/**
 * Trạng thái học viên chỉ có ba: active đang học · inactive tạm dừng · finished dừng hẳn.
 * Lưu trữ (archive) là cách ẩn khỏi danh sách, KHÔNG phải trạng thái thứ tư, và không
 * tự đóng lịch hay case còn dở.
 */
export function setStudentStatus(
  p: Principal, studentId: number, status: 'active' | 'inactive' | 'finished', date: string, reason?: string,
) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  if (!(STUDENT_STATUSES as readonly string[]).includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status === status) return s;

  return tx(() => {
    conn.prepare('UPDATE students SET status = ?, finished_at = ?, archived_at = NULL WHERE id = ?')
      .run(status, status === 'finished' ? date : null, studentId);
    // Enrollment đi theo nhưng vẫn giữ nguyên lịch sử lớp.
    const enrollmentStatus = status === 'active' ? 'active' : status === 'inactive' ? 'paused' : 'completed';
    conn.prepare(`UPDATE enrollments SET status = ? WHERE student_id = ? AND status IN ('active','paused')`)
      .run(enrollmentStatus, studentId);
    addJourney({
      studentId, eventType: status === 'inactive' ? 'pause' : status === 'active' ? 'resume' : 'finish',
      eventDate: date,
      title: status === 'inactive' ? 'Tạm dừng học' : status === 'active' ? 'Quay lại học' : 'Kết thúc học',
      detail: reason ?? null, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'student.status', entityType: 'student', entityId: studentId,
      entityLabel: s.student_code, before: { status: s.status }, after: { status, date, reason } });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * Học viên đã kết thúc thì sau ARCHIVE_AFTER_DAYS ngày được đưa vào lưu trữ.
 * Chỉ ẩn khỏi danh sách mặc định, không xoá dữ liệu và không đóng việc còn dở.
 * Mốc chính xác và quyền khôi phục vẫn chờ quyết định — xem O08.
 */
export function archiveDueStudents(today = demoToday()): number {
  const cutoff = addDays(today, -ARCHIVE_AFTER_DAYS);
  const info = db()
    .prepare(
      `UPDATE students SET archived_at = ?
        WHERE status = 'finished' AND archived_at IS NULL AND finished_at IS NOT NULL AND finished_at <= ?`,
    )
    .run(today, cutoff);
  return info.changes;
}

export function updateStudent(p: Principal, studentId: number, patch: any) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound();
  // Target và ngày thi IELTS nằm ở LỘ TRÌNH, sửa qua updateCycle chứ không qua hồ sơ.
  const map: Record<string, string> = {
    fullName: 'full_name', note: 'note', dob: 'dob', consultantName: 'consultant_name',
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
