import { db, tx } from '../db.ts';
import { TEACHING_SKILLS, ATTENDED_STATUSES, PERMISSIONS, type TeachingSkill } from '../../../shared/domain.ts';
import { activeSignalPolicy, demoToday } from '../demoConfig.ts';
import { addDays, badRequest, forbidden, notFound, nowIso, pct, weekStartOf } from '../util.ts';
import { can, editableSkills, explainDenial, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';

export type WeeklyRecord = {
  id: number;
  enrollment_id: number;
  student_id: number;
  class_id: number;
  skill: TeachingSkill;
  week_start: string;
  applicable: number;
  expected_main_sessions: number | null;
  expected_source: string;
  attended_main_sessions: number | null;
  supplemental_sessions: number | null;
  homework_assigned: number | null;
  homework_completed: number | null;
  attendance_source: 'aggregate' | 'detail';
  homework_source: 'aggregate' | 'detail';
  note_short: string | null;
  rev: number;
  last_client_seq: number;
  updated_at: string | null;
  updated_by: number | null;
};

/**
 * Số buổi chính kỳ vọng: cấu hình lớp → override theo enrollment/skill → override thủ công
 * đã lưu trên chính weekly record. Không bao giờ suy ra từ tên lớp (FT5/FT10...).
 */
export function resolveExpected(enrollmentId: number, classId: number, skill: string) {
  const es = db()
    .prepare('SELECT registered, expected_main_sessions_per_week FROM enrollment_skills WHERE enrollment_id = ? AND skill = ?')
    .get(enrollmentId, skill) as { registered: number; expected_main_sessions_per_week: number | null } | undefined;

  if (es && es.registered === 0) return { applicable: false, expected: null as number | null, source: 'enrollment' };

  if (es && es.expected_main_sessions_per_week != null) {
    return { applicable: true, expected: es.expected_main_sessions_per_week, source: 'enrollment' };
  }
  const cs = db()
    .prepare('SELECT expected_main_sessions_per_week FROM class_skill_config WHERE class_id = ? AND skill = ?')
    .get(classId, skill) as { expected_main_sessions_per_week: number } | undefined;
  if (!es && !cs) return { applicable: false, expected: null, source: 'class' };
  return { applicable: true, expected: cs?.expected_main_sessions_per_week ?? null, source: 'class' };
}

/** Lấy (hoặc tạo) weekly record cho một enrollment/skill/tuần. Idempotent nhờ UNIQUE. */
export function ensureWeeklyRecord(enrollmentId: number, skill: string, weekStart: string): WeeklyRecord {
  const conn = db();
  const existing = conn
    .prepare('SELECT * FROM weekly_learning_records WHERE enrollment_id = ? AND skill = ? AND week_start = ?')
    .get(enrollmentId, skill, weekStart) as WeeklyRecord | undefined;
  if (existing) return existing;

  const enr = conn.prepare('SELECT id, student_id, class_id FROM enrollments WHERE id = ?').get(enrollmentId) as any;
  if (!enr) throw notFound('Không tìm thấy lần đăng ký học');
  const res = resolveExpected(enrollmentId, enr.class_id, skill);
  conn
    .prepare(
      `INSERT INTO weekly_learning_records
        (enrollment_id, student_id, class_id, skill, week_start, applicable, expected_main_sessions, expected_source, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT (enrollment_id, skill, week_start) DO NOTHING`,
    )
    .run(enrollmentId, enr.student_id, enr.class_id, skill, weekStart, res.applicable ? 1 : 0, res.expected, res.source, nowIso());
  return conn
    .prepare('SELECT * FROM weekly_learning_records WHERE enrollment_id = ? AND skill = ? AND week_start = ?')
    .get(enrollmentId, skill, weekStart) as WeeklyRecord;
}

export type WeeklyView = {
  id: number;
  enrollmentId: number;
  studentId: number;
  classId: number;
  skill: TeachingSkill;
  weekStart: string;
  applicable: boolean;
  expected: number | null;
  expectedSource: string;
  attended: number | null;
  supplemental: number | null;
  homeworkAssigned: number | null;
  homeworkCompleted: number | null;
  attendanceSource: 'aggregate' | 'detail';
  homeworkSource: 'aggregate' | 'detail';
  note: string | null;
  rev: number;
  /** Tổng buổi đã học = buổi chính đã tham dự + buổi bổ trợ. */
  totalSessions: number | null;
  /** Tỷ lệ tham dự buổi chính; null khi chưa nhập hoặc mẫu số = 0. */
  attendanceRate: number | null;
  homeworkRate: number | null;
  dataState: 'not_applicable' | 'not_updated' | 'partial' | 'updated';
  detailCounts: { attendance: number; homework: number; activities: number };
  updatedAt: string | null;
  updatedByName: string | null;
};

export function toWeeklyView(r: WeeklyRecord & { updated_by_name?: string | null }): WeeklyView {
  const applicable = r.applicable === 1;
  const attended = r.attended_main_sessions;
  const supplemental = r.supplemental_sessions;
  const totalSessions = attended == null && supplemental == null ? null : (attended ?? 0) + (supplemental ?? 0);
  const attendanceRate =
    !applicable || attended == null || !r.expected_main_sessions ? null : pct(attended, r.expected_main_sessions);
  const homeworkRate =
    !applicable || r.homework_completed == null || !r.homework_assigned ? null : pct(r.homework_completed, r.homework_assigned);

  const entered = [attended, supplemental, r.homework_assigned, r.homework_completed].filter((v) => v != null).length;
  const dataState: WeeklyView['dataState'] = !applicable
    ? 'not_applicable'
    : entered === 0
      ? 'not_updated'
      : attended == null || r.homework_completed == null
        ? 'partial'
        : 'updated';

  const counts = db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM attendance_records WHERE weekly_record_id = ?) AS att,
         (SELECT COUNT(*) FROM homework_assignments WHERE weekly_record_id = ?) AS hw,
         (SELECT COUNT(*) FROM learning_activities WHERE weekly_record_id = ?) AS act`,
    )
    .get(r.id, r.id, r.id) as any;

  return {
    id: r.id,
    enrollmentId: r.enrollment_id,
    studentId: r.student_id,
    classId: r.class_id,
    skill: r.skill,
    weekStart: r.week_start,
    applicable,
    expected: r.expected_main_sessions,
    expectedSource: r.expected_source,
    attended,
    supplemental,
    homeworkAssigned: r.homework_assigned,
    homeworkCompleted: r.homework_completed,
    attendanceSource: r.attendance_source,
    homeworkSource: r.homework_source,
    note: r.note_short,
    rev: r.rev,
    totalSessions,
    attendanceRate,
    homeworkRate,
    dataState,
    detailCounts: { attendance: counts.att, homework: counts.hw, activities: counts.act },
    updatedAt: r.updated_at,
    updatedByName: r.updated_by_name ?? null,
  };
}

export type WeeklyPatch = Partial<{
  attended: number | null;
  supplemental: number | null;
  homeworkAssigned: number | null;
  homeworkCompleted: number | null;
  note: string | null;
  expected: number | null;
}>;

function validatePatch(current: WeeklyRecord, patch: WeeklyPatch) {
  const next = {
    expected: patch.expected !== undefined ? patch.expected : current.expected_main_sessions,
    attended: patch.attended !== undefined ? patch.attended : current.attended_main_sessions,
    supplemental: patch.supplemental !== undefined ? patch.supplemental : current.supplemental_sessions,
    hwAssigned: patch.homeworkAssigned !== undefined ? patch.homeworkAssigned : current.homework_assigned,
    hwCompleted: patch.homeworkCompleted !== undefined ? patch.homeworkCompleted : current.homework_completed,
  };
  for (const [k, label] of [
    ['expected', 'Số buổi kỳ vọng'], ['attended', 'Buổi chính đã học'],
    ['supplemental', 'Buổi bổ trợ'], ['hwAssigned', 'Bài được giao'], ['hwCompleted', 'Bài hoàn thành'],
  ] as const) {
    const v = (next as any)[k];
    if (v != null && (!Number.isInteger(v) || v < 0)) throw badRequest(`${label} phải là số nguyên không âm.`);
    if (v != null && v > 60) throw badRequest(`${label} vượt quá giới hạn hợp lý (tối đa 60).`);
  }
  if (next.attended != null && next.expected != null && next.attended > next.expected) {
    throw badRequest(
      'Số buổi chính đã học không được vượt số buổi kỳ vọng. Nếu học viên học thêm, hãy ghi vào buổi bổ trợ hoặc sửa số buổi kỳ vọng (cần quyền phù hợp).',
    );
  }
  if (next.hwCompleted != null && next.hwAssigned != null && next.hwCompleted > next.hwAssigned) {
    throw badRequest('Số bài hoàn thành không được vượt số bài được giao.');
  }
  return next;
}

export type SaveResult = { record: WeeklyView; stale?: boolean };

/**
 * Ghi một weekly record. `clientSeq` tăng dần theo từng ô ở client:
 * request cũ đến sau sẽ bị bỏ qua để không ghi đè bản mới.
 */
export function saveWeeklyRecord(
  p: Principal,
  recordId: number,
  patch: WeeklyPatch,
  clientSeq: number | undefined,
): SaveResult {
  const conn = db();
  const current = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(recordId) as WeeklyRecord | undefined;
  if (!current) throw notFound('Không tìm thấy dòng dữ liệu tuần');

  const ctx = { classId: current.class_id, skill: current.skill, studentId: current.student_id };
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, ctx)) {
    throw forbidden('Bạn không có quyền sửa dữ liệu của skill này.', {
      hint: explainDenial(p, PERMISSIONS.WEEKLY_EDIT, ctx),
    });
  }
  if (current.applicable === 0) throw badRequest('Skill này không áp dụng cho học viên, không thể nhập dữ liệu.');

  if (clientSeq != null && clientSeq <= current.last_client_seq) {
    return { record: toWeeklyView(current), stale: true };
  }

  if (patch.expected !== undefined && patch.expected !== current.expected_main_sessions) {
    if (!can(p, PERMISSIONS.SUMMARY_EDIT, { classId: current.class_id, studentId: current.student_id })
        && !can(p, PERMISSIONS.CLASS_PROGRESS_EDIT, { classId: current.class_id })) {
      throw badRequest('Bạn không có quyền sửa số buổi kỳ vọng của học viên này.');
    }
  }
  if (patch.attended !== undefined && current.attendance_source === 'detail') {
    throw badRequest('Chuyên cần của dòng này đang tính từ chi tiết buổi học. Hãy sửa trong phần chi tiết hoặc chuyển lại về nhập tổng hợp.');
  }
  if (patch.homeworkCompleted !== undefined && current.homework_source === 'detail') {
    throw badRequest('Bài tập của dòng này đang tính từ danh sách bài. Hãy sửa trong phần chi tiết hoặc chuyển lại về nhập tổng hợp.');
  }
  if (patch.supplemental !== undefined && countActivities(current.id) > 0) {
    throw badRequest('Buổi bổ trợ đang được tính từ danh sách hoạt động. Hãy sửa trong phần chi tiết.');
  }

  validatePatch(current, patch);

  const before = snapshot(current);
  const sets: string[] = [];
  const params: unknown[] = [];
  const map: Record<keyof WeeklyPatch, string> = {
    attended: 'attended_main_sessions',
    supplemental: 'supplemental_sessions',
    homeworkAssigned: 'homework_assigned',
    homeworkCompleted: 'homework_completed',
    note: 'note_short',
    expected: 'expected_main_sessions',
  };
  for (const key of Object.keys(patch) as (keyof WeeklyPatch)[]) {
    if (patch[key] === undefined) continue;
    sets.push(`${map[key]} = ?`);
    params.push(patch[key]);
  }
  if (patch.expected !== undefined) sets.push(`expected_source = 'manual'`);
  if (!sets.length) return { record: toWeeklyView(current) };

  sets.push('rev = rev + 1', 'updated_by = ?', 'updated_at = ?');
  params.push(p.userId, nowIso());
  if (clientSeq != null) { sets.push('last_client_seq = ?'); params.push(clientSeq); }
  params.push(recordId);

  conn.prepare(`UPDATE weekly_learning_records SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const updated = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(recordId) as WeeklyRecord;

  writeAudit({
    actorUserId: p.userId,
    action: 'weekly.update',
    entityType: 'weekly_learning_record',
    entityId: recordId,
    entityLabel: `${current.skill} · tuần ${current.week_start}`,
    studentId: current.student_id,
    before,
    after: snapshot(updated),
  });
  return { record: toWeeklyView(updated) };
}

function countActivities(recordId: number): number {
  const r = db().prepare('SELECT COUNT(*) AS n FROM learning_activities WHERE weekly_record_id = ?').get(recordId) as any;
  return r.n as number;
}

function snapshot(r: WeeklyRecord) {
  return {
    expected: r.expected_main_sessions,
    attended: r.attended_main_sessions,
    supplemental: r.supplemental_sessions,
    homeworkAssigned: r.homework_assigned,
    homeworkCompleted: r.homework_completed,
    note: r.note_short,
  };
}

/** Áp một giá trị cho nhiều dòng. Mỗi dòng vẫn kiểm tra quyền riêng. */
export function bulkApply(
  p: Principal,
  recordIds: number[],
  patch: WeeklyPatch,
): { applied: number[]; failed: { id: number; reason: string }[] } {
  const applied: number[] = [];
  const failed: { id: number; reason: string }[] = [];
  for (const id of recordIds) {
    try {
      tx(() => saveWeeklyRecord(p, id, patch, undefined));
      applied.push(id);
    } catch (e: any) {
      failed.push({ id, reason: e?.message ?? 'Lỗi không xác định' });
    }
  }
  return { applied, failed };
}

// ---------- nguồn dữ liệu: tổng hợp vs chi tiết ----------

export function recomputeFromDetail(recordId: number, dimension: 'attendance' | 'homework' | 'supplemental') {
  const conn = db();
  if (dimension === 'attendance') {
    const rows = conn.prepare('SELECT status FROM attendance_records WHERE weekly_record_id = ?').all(recordId) as any[];
    const attended = rows.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
    conn.prepare('UPDATE weekly_learning_records SET attended_main_sessions = ?, rev = rev + 1 WHERE id = ?').run(attended, recordId);
  } else if (dimension === 'homework') {
    const rows = conn.prepare('SELECT status, completed FROM homework_assignments WHERE weekly_record_id = ?').all(recordId) as any[];
    const assigned = rows.length;
    const completed = rows.filter((r) => r.completed === 1).length;
    conn
      .prepare('UPDATE weekly_learning_records SET homework_assigned = ?, homework_completed = ?, rev = rev + 1 WHERE id = ?')
      .run(assigned, completed, recordId);
  } else {
    const row = conn.prepare('SELECT COALESCE(SUM(sessions),0) AS n FROM learning_activities WHERE weekly_record_id = ?').get(recordId) as any;
    conn.prepare('UPDATE weekly_learning_records SET supplemental_sessions = ?, rev = rev + 1 WHERE id = ?').run(row.n, recordId);
  }
}

/** Chuyển một chiều dữ liệu sang nguồn chi tiết; aggregate tương ứng thành read-only. */
export function switchToDetailSource(p: Principal, recordId: number, dimension: 'attendance' | 'homework') {
  const conn = db();
  const rec = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(recordId) as WeeklyRecord | undefined;
  if (!rec) throw notFound();
  const col = dimension === 'attendance' ? 'attendance_source' : 'homework_source';
  conn.prepare(`UPDATE weekly_learning_records SET ${col} = 'detail' WHERE id = ?`).run(recordId);
  recomputeFromDetail(recordId, dimension);
  writeAudit({
    actorUserId: p.userId, action: 'weekly.source_switch', entityType: 'weekly_learning_record',
    entityId: recordId, entityLabel: dimension, studentId: rec.student_id,
    before: { source: 'aggregate' }, after: { source: 'detail' },
  });
}

export function switchToAggregateSource(p: Principal, recordId: number, dimension: 'attendance' | 'homework') {
  const conn = db();
  const rec = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(recordId) as WeeklyRecord | undefined;
  if (!rec) throw notFound();
  const col = dimension === 'attendance' ? 'attendance_source' : 'homework_source';
  conn.prepare(`UPDATE weekly_learning_records SET ${col} = 'aggregate' WHERE id = ?`).run(recordId);
  writeAudit({
    actorUserId: p.userId, action: 'weekly.source_switch', entityType: 'weekly_learning_record',
    entityId: recordId, entityLabel: dimension, studentId: rec.student_id,
    before: { source: 'detail' }, after: { source: 'aggregate' },
  });
}

/** So sánh tổng hợp hiện tại với số tính từ chi tiết, để cảnh báo chênh lệch trước khi chuyển nguồn. */
export function detailDelta(recordId: number) {
  const conn = db();
  const rec = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(recordId) as WeeklyRecord;
  const att = conn.prepare('SELECT status FROM attendance_records WHERE weekly_record_id = ?').all(recordId) as any[];
  const hw = conn.prepare('SELECT completed FROM homework_assignments WHERE weekly_record_id = ?').all(recordId) as any[];
  return {
    attendance: {
      aggregate: rec.attended_main_sessions,
      fromDetail: att.length ? att.filter((r) => ATTENDED_STATUSES.includes(r.status)).length : null,
      detailRows: att.length,
    },
    homework: {
      aggregateAssigned: rec.homework_assigned,
      aggregateCompleted: rec.homework_completed,
      fromDetailAssigned: hw.length || null,
      fromDetailCompleted: hw.length ? hw.filter((r) => r.completed === 1).length : null,
    },
  };
}

// ---------- tín hiệu cần chú ý ----------

export type StudentSignal = {
  studentId: number;
  attendance: { attended: number; expected: number; rate: number | null; concern: boolean };
  homework: { completed: number; assigned: number; rate: number | null; concern: boolean };
  missingUpdates: number;
  concern: boolean;
  reasons: string[];
  periodLabel: string;
  policyVersion: number;
  policyExperimental: boolean;
};

/**
 * Tín hiệu chỉ tính trên các dòng ĐÃ NHẬP và có mẫu số > 0.
 * Dòng chưa cập nhật không bị gắn concern — chỉ đưa vào "Cần cập nhật".
 */
export function computeSignals(studentIds: number[], today = demoToday()): Map<number, StudentSignal> {
  const policy = activeSignalPolicy();
  const result = new Map<number, StudentSignal>();
  if (!studentIds.length) return result;

  const fromWeek = weekStartOf(addDays(today, -7 * policy.lookback_weeks));
  const toWeek = weekStartOf(today);
  const ph = studentIds.map(() => '?').join(',');
  const rows = db()
    .prepare(
      `SELECT student_id, applicable, expected_main_sessions, attended_main_sessions,
              homework_assigned, homework_completed
         FROM weekly_learning_records
        WHERE student_id IN (${ph}) AND week_start >= ? AND week_start <= ?`,
    )
    .all(...studentIds, fromWeek, toWeek) as any[];

  const periodLabel = `${policy.lookback_weeks} tuần gần nhất (từ ${fromWeek})`;
  for (const id of studentIds) {
    result.set(id, {
      studentId: id,
      attendance: { attended: 0, expected: 0, rate: null, concern: false },
      homework: { completed: 0, assigned: 0, rate: null, concern: false },
      missingUpdates: 0,
      concern: false,
      reasons: [],
      periodLabel,
      policyVersion: policy.version,
      policyExperimental: policy.is_experimental === 1,
    });
  }

  for (const r of rows) {
    const s = result.get(r.student_id);
    if (!s || r.applicable === 0) continue;
    const hasAttendance = r.attended_main_sessions != null && r.expected_main_sessions > 0;
    const hasHomework = r.homework_completed != null && r.homework_assigned > 0;
    if (hasAttendance) {
      s.attendance.attended += r.attended_main_sessions;
      s.attendance.expected += r.expected_main_sessions;
    }
    if (hasHomework) {
      s.homework.completed += r.homework_completed;
      s.homework.assigned += r.homework_assigned;
    }
    if (r.attended_main_sessions == null && r.expected_main_sessions > 0) s.missingUpdates += 1;
  }

  for (const s of result.values()) {
    s.attendance.rate = s.attendance.expected > 0 ? s.attendance.attended / s.attendance.expected : null;
    s.homework.rate = s.homework.assigned > 0 ? s.homework.completed / s.homework.assigned : null;
    if (s.attendance.rate != null && s.attendance.rate < policy.attendance_min_rate) {
      s.attendance.concern = true;
      s.reasons.push(
        `Chuyên cần ${Math.round(s.attendance.rate * 1000) / 10}% (${s.attendance.attended}/${s.attendance.expected} buổi chính), dưới ngưỡng ${Math.round(policy.attendance_min_rate * 100)}%`,
      );
    }
    if (s.homework.rate != null && s.homework.rate < policy.homework_min_rate) {
      s.homework.concern = true;
      s.reasons.push(
        `Bài tập ${Math.round(s.homework.rate * 1000) / 10}% (${s.homework.completed}/${s.homework.assigned} bài), dưới ngưỡng ${Math.round(policy.homework_min_rate * 100)}%`,
      );
    }
    s.concern = s.attendance.concern || s.homework.concern;
  }
  return result;
}

/** Bảng nhập tuần của một lớp: mỗi dòng một học viên, đúng skill đang chọn. */
export function classWeeklyTable(p: Principal, classId: number, skill: string, weekStart: string) {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const monday = weekStartOf(weekStart);

  const enrollments = conn
    .prepare(
      `SELECT e.id, e.student_id, e.status, e.attempt_no, s.full_name, s.student_code, s.target_band
         FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status IN ('active','paused')
          AND (e.ended_at IS NULL OR e.ended_at >= ?)
          AND COALESCE(e.starts_at, e.enrolled_at) <= ?
        ORDER BY s.full_name`,
    )
    .all(classId, monday, addDays(monday, 6)) as any[];

  const canEdit = can(p, PERMISSIONS.WEEKLY_EDIT, { classId, skill });
  const rows = enrollments.map((e) => {
    const rec = ensureWeeklyRecord(e.id, skill, monday);
    const withName = conn
      .prepare(
        `SELECT w.*, u.full_name AS updated_by_name FROM weekly_learning_records w
           LEFT JOIN users u ON u.id = w.updated_by WHERE w.id = ?`,
      )
      .get(rec.id) as any;
    const est = conn
      .prepare(
        `SELECT band FROM teacher_estimates
          WHERE enrollment_id = ? AND teaching_skill = ? AND week_start = ? ORDER BY id DESC LIMIT 1`,
      )
      .get(e.id, skill, monday) as any;
    return {
      ...toWeeklyView(withName),
      studentName: e.full_name,
      studentCode: e.student_code,
      enrollmentStatus: e.status,
      attemptNo: e.attempt_no,
      targetBand: e.target_band,
      estimate: est?.band ?? null,
    };
  });

  return {
    classId,
    weekStart: monday,
    skill,
    canEdit,
    editableSkills: editableSkills(p, classId, TEACHING_SKILLS),
    rows,
  };
}

/** Tổng hợp toàn bộ skill của lớp trong tuần — chỉ đọc, dùng để đối chiếu. */
export function classWeekSummary(classId: number, weekStart: string) {
  const monday = weekStartOf(weekStart);
  const rows = db()
    .prepare(
      `SELECT skill,
              SUM(CASE WHEN applicable = 1 THEN 1 ELSE 0 END) AS applicable_rows,
              SUM(CASE WHEN applicable = 1 AND attended_main_sessions IS NULL THEN 1 ELSE 0 END) AS missing_rows,
              SUM(COALESCE(attended_main_sessions,0)) AS attended,
              SUM(CASE WHEN attended_main_sessions IS NOT NULL THEN COALESCE(expected_main_sessions,0) ELSE 0 END) AS expected,
              SUM(COALESCE(homework_completed,0)) AS hw_done,
              SUM(CASE WHEN homework_completed IS NOT NULL THEN COALESCE(homework_assigned,0) ELSE 0 END) AS hw_assigned,
              SUM(COALESCE(supplemental_sessions,0)) AS supplemental
         FROM weekly_learning_records
        WHERE class_id = ? AND week_start = ?
        GROUP BY skill`,
    )
    .all(classId, monday) as any[];
  return TEACHING_SKILLS.map((skill) => {
    const r = rows.find((x) => x.skill === skill);
    return {
      skill,
      applicableRows: r?.applicable_rows ?? 0,
      missingRows: r?.missing_rows ?? 0,
      attendanceRate: r && r.expected > 0 ? pct(r.attended, r.expected) : null,
      homeworkRate: r && r.hw_assigned > 0 ? pct(r.hw_done, r.hw_assigned) : null,
      supplemental: r?.supplemental ?? 0,
    };
  });
}
