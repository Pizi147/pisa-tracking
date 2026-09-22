import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, JOURNEY_GROUP, NO_HANDOVER_NOTE, PERMISSIONS, STUDENT_STATUSES,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { NOT_UNCONFIRMED_PRESET } from '../cases/sosState.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
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

/**
 * NHỮNG THỨ CÒN DỞ khi một em sắp chuyển lớp — để màn hình bày sẵn, người chuyển không phải
 * chép tay (mục 6.4).
 *
 * Trước vòng này, chuyển lớp xong là case còn mở rơi vào khoảng trống: giáo viên cũ không
 * còn dạy em, giáo viên mới không biết em đang dở chuyện gì. Nay chuyển lớp BẮT BUỘC có
 * thông tin bàn giao, và đây là nguồn để viết thông tin đó.
 */
export function handoverBrief(studentId: number) {
  const conn = db();
  const cases = conn
    .prepare(
      `SELECT sc.id, sc.title, sc.category, sc.status,
              u.full_name AS owner_name,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status IN ('planned','started')
                  AND ${NOT_UNCONFIRMED_PRESET('iv')}) AS open_plans,
              (SELECT MIN(iv.action_due) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status IN ('planned','started')
                  AND ${NOT_UNCONFIRMED_PRESET('iv')}
                  AND iv.action_due IS NOT NULL) AS next_due
         FROM sos_cases sc LEFT JOIN users u ON u.id = sc.owner_user_id
        WHERE sc.student_id = ? AND sc.status != 'done'
        ORDER BY sc.id DESC`,
    )
    .all(studentId) as any[];
  return {
    cases: cases.map((c) => ({
      id: c.id, title: c.title, category: c.category,
      ownerName: c.owner_name ?? null, openPlans: c.open_plans as number,
      nextDue: c.next_due as string | null,
    })),
    openPlans: cases.reduce((n, c) => n + (c.open_plans as number), 0),
  };
}

export function transferStudent(p: Principal, studentId: number, toClassId: number, effectiveDate: string, reason: string, handover?: {
  /** Ghi chú bàn giao — BẮT BUỘC khi em còn case chưa xong. */
  note?: string | null;
  /** Chọn rõ "Không có lưu ý" (RB-3) — chỉ nhận khi em không còn case dở. */
  noNote?: boolean;
  /** Người tiếp nhận: đổi người phụ trách của các case còn mở sang người này. */
  receiverUserId?: number | null;
}) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId }, 'Bạn không có quyền chuyển lớp học viên này.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: toClassId }, 'Lớp đích nằm ngoài phạm vi bạn được cấp quyền.');
  if (!isIsoDate(effectiveDate)) throw badRequest('Ngày hiệu lực không hợp lệ.');

  const why = String(reason ?? '').trim();
  if (!why) throw badRequest('Chọn lý do chuyển lớp.');
  /*
   * LƯU Ý BÀN GIAO BẮT BUỘC, có lựa chọn "Không có lưu ý" (RB-3). Còn Case dở thì KHÔNG được chọn "Không có lưu ý": người nhận lớp
   * đọc đúng dòng này để biết em đang vướng gì (mục 6.4) — plan PR-S1 Q10.
   */
  const brief = handoverBrief(studentId);
  const typed = (handover?.note ?? '').trim();
  if (brief.cases.length > 0 && !typed) {
    throw badRequest(
      `Em còn ${brief.cases.length} case chưa xong. Ghi thông tin bàn giao để người nhận lớp `
      + 'biết em đang vướng gì và đang làm dở đến đâu.',
    );
  }
  if (!typed && !handover?.noNote) throw badRequest(`Ghi lưu ý bàn giao, hoặc chọn "${NO_HANDOVER_NOTE}".`);
  const handoverNote = typed || NO_HANDOVER_NOTE;
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
        .run(effectiveDate, why, cur.id);
    }
    const info = conn
      .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(studentId, toClassId, effectiveDate, nowIso());
    conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, studentId);
    // Lượt CHƯA xong chuyển sang lớp mới; lượt đã xong giữ nguyên lớp cũ để không viết lại lịch sử.
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClassId, studentId);
    /*
     * BÀN GIAO CASE CÒN MỞ. Đổi người phụ trách sang người nhận nếu có chỉ định — nhưng
     * KHÔNG viết lại lịch sử: ai đã làm gì trước đó vẫn nguyên trong từng phương án.
     */
    if (handover?.receiverUserId) {
      for (const c of brief.cases) {
        const before = c.ownerName;
        conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ?')
          .run(handover.receiverUserId, nowIso(), c.id);
        conn
          .prepare(
            `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
             VALUES (?, 'owner', ?, ?, ?, ?)`,
          )
          .run(c.id, before, 'bàn giao khi chuyển lớp', p.userId, nowIso());
      }
    }
    addJourney({
      studentId, eventType: 'transfer', eventDate: effectiveDate,
      title: `Chuyển sang lớp ${toClass.code}`,
      detail: [why, handoverNote].join(' — '),
      createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: studentId,
      entityLabel: toClass.code, before: cur, after: { classId: toClassId, effectiveDate } });
    return { newEnrollmentId: Number(info.lastInsertRowid), closedEnrollmentId: cur?.id ?? null };
  });
}

/**
 * Trạng thái học viên chỉ có ba: active đang học · inactive tạm dừng · finished dừng hẳn.
 * Lưu trữ (archive) là cách ẩn khỏi danh sách, KHÔNG phải trạng thái thứ tư, và không đóng gì.
 * Kết thúc học (`finished`) thì Case còn mở được hệ thống tự đóng theo S16.
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
    /* S16: em KẾT THÚC học → Case còn mở của em hệ thống tự đóng "Học viên kết thúc khoá". Tạm dừng thì không. */
    if (status === 'finished') {
      closeCasesBySystem({ actorUserId: p.userId, studentId, reason: 'course_ended', on: date });
    }
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
 * LƯU TRỮ HỌC VIÊN — CHỈ KHI QUẢN LÝ BẤM (RB-9, quyết định 4.17 ngày 22/09/2026).
 *
 * Không có tác vụ ngầm "sau N ngày tự lưu trữ" (hàm `archiveDueStudents` cũ đã gỡ — nó chưa từng được gọi ở đâu ngoài phép kiểm).
 * Lưu trữ chỉ ẩn khỏi danh sách mặc định: không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Chỉ em đã kết thúc học.
 */
export function archiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ lưu trữ được học viên đã kết thúc học.');
  if (s.archived_at) return s;
  const on = demoToday();
  conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(on, studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.archive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: null }, after: { archivedAt: on } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

export function unarchiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới bỏ lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (!s.archived_at) return s;
  conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.unarchive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: s.archived_at }, after: { archivedAt: null } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
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
