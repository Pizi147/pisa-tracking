import { db, tx } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, diffDays, notFound, nowIso, weekStartOf } from '../util.ts';
import { can, classScopeSql, isCoreTeacherOf, require_, viewScope, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';
import { classWeekSummary } from './weekly.ts';

export type ResolvedStage = {
  stageKey: string;
  seq: number;
  name: string;
  kind: string;
  weekFrom: number | null;
  weekTo: number | null;
  dueOffsetDays: number | null;
  description: string | null;
  overridden: boolean;
  addedByOverride: boolean;
};

/**
 * Chương trình thực dùng của một lớp = template version của lớp + override riêng lớp.
 * Không đụng vào template gốc, nên lớp khác không bị ảnh hưởng.
 */
export function resolveClassStages(classId: number): ResolvedStage[] {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const base = cls.template_version_id
    ? (conn
        .prepare('SELECT * FROM template_stages WHERE template_version_id = ? ORDER BY seq')
        .all(cls.template_version_id) as any[])
    : [];
  const overrides = conn.prepare('SELECT * FROM class_stage_overrides WHERE class_id = ?').all(classId) as any[];
  const byKey = new Map<string, ResolvedStage>();

  for (const s of base) {
    byKey.set(s.stage_key, {
      stageKey: s.stage_key, seq: s.seq, name: s.name, kind: s.kind,
      weekFrom: s.week_from, weekTo: s.week_to, dueOffsetDays: s.due_offset_days,
      description: s.description, overridden: false, addedByOverride: false,
    });
  }
  for (const o of overrides) {
    if (o.action === 'remove') { byKey.delete(o.stage_key); continue; }
    const existing = byKey.get(o.stage_key);
    const merged: ResolvedStage = {
      stageKey: o.stage_key,
      seq: o.seq ?? existing?.seq ?? 999,
      name: o.name ?? existing?.name ?? o.stage_key,
      kind: o.kind ?? existing?.kind ?? 'stage',
      weekFrom: o.week_from ?? existing?.weekFrom ?? null,
      weekTo: o.week_to ?? existing?.weekTo ?? null,
      dueOffsetDays: o.clear_due === 1 ? null : (o.due_offset_days ?? existing?.dueOffsetDays ?? null),
      description: o.description ?? existing?.description ?? null,
      overridden: true,
      addedByOverride: !existing,
    };
    byKey.set(o.stage_key, merged);
  }
  return [...byKey.values()].sort((a, b) => a.seq - b.seq);
}

export type StageProgressView = ResolvedStage & {
  status: 'not_started' | 'in_progress' | 'done';
  actualDate: string | null;
  note: string | null;
  dueDate: string | null;
  /** null khi không có hạn cấu hình — KHÔNG tự kết luận chậm. */
  scheduleState: 'on_track' | 'late' | 'no_deadline' | 'done';
  daysLate: number | null;
  updatedAt: string | null;
};

export function classProgress(classId: number, today = demoToday()): { stages: StageProgressView[]; summary: any } {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  const stages = resolveClassStages(classId);
  const progressRows = conn.prepare('SELECT * FROM class_stage_progress WHERE class_id = ?').all(classId) as any[];
  const byKey = new Map(progressRows.map((r) => [r.stage_key, r]));

  const views: StageProgressView[] = stages.map((s) => {
    const pr = byKey.get(s.stageKey);
    const status = (pr?.status ?? 'not_started') as StageProgressView['status'];
    const dueDate = s.dueOffsetDays != null && cls.start_date ? addDays(cls.start_date, s.dueOffsetDays) : null;
    let scheduleState: StageProgressView['scheduleState'];
    let daysLate: number | null = null;
    if (status === 'done') scheduleState = 'done';
    else if (!dueDate) scheduleState = 'no_deadline';
    else if (diffDays(today, dueDate) > 0) { scheduleState = 'late'; daysLate = diffDays(today, dueDate); }
    else scheduleState = 'on_track';
    return {
      ...s, status, actualDate: pr?.actual_date ?? null, note: pr?.note ?? null,
      dueDate, scheduleState, daysLate, updatedAt: pr?.updated_at ?? null,
    };
  });

  const withDeadline = views.filter((v) => v.dueDate);
  const lateStages = views.filter((v) => v.scheduleState === 'late');
  const done = views.filter((v) => v.status === 'done').length;
  return {
    stages: views,
    summary: {
      total: views.length,
      done,
      inProgress: views.filter((v) => v.status === 'in_progress').length,
      hasDeadlines: withDeadline.length > 0,
      lateCount: lateStages.length,
      /** Chỉ đánh giá chậm khi chương trình thực sự có mốc hạn. */
      delayed: withDeadline.length > 0 && lateStages.length > 0,
      currentStage: views.find((v) => v.status === 'in_progress')?.name
        ?? views.filter((v) => v.status === 'done').slice(-1)[0]?.name
        ?? null,
    },
  };
}

export function listClasses(p: Principal, f: { branchId?: number; category?: string; q?: string; status?: string } = {}) {
  const scope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);
  if (scope.none) return [];
  const sc = classScopeSql(scope);
  const where = [sc.sql, "c.status != 'archived'"];
  const params: unknown[] = [...sc.params];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.category) { where.push('ct.category = ?'); params.push(f.category); }
  if (f.status) { where.push('c.status = ?'); params.push(f.status); }
  if (f.q) { where.push('(c.code LIKE ? OR c.name LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }

  const rows = db()
    .prepare(
      `SELECT c.*, ct.category, ct.name AS class_type_name, b.name AS branch_name,
              tv.version_no, t.name AS template_name
         FROM classes c
         JOIN class_types ct ON ct.id = c.class_type_id
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN course_template_versions tv ON tv.id = c.template_version_id
         LEFT JOIN course_templates t ON t.id = tv.template_id
        WHERE ${where.join(' AND ')} ORDER BY b.name, c.code`,
    )
    .all(...params) as any[];

  const currentWeek = weekStartOf(demoToday());
  return rows.map((c) => {
    const core = db()
      .prepare(
        `SELECT u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
          WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1`,
      )
      .get(c.id) as any;
    const activeCount = (db()
      .prepare(`SELECT COUNT(DISTINCT student_id) AS n FROM enrollments WHERE class_id = ? AND status = 'active'`)
      .get(c.id) as any).n as number;
    const missing = (db()
      .prepare(
        `SELECT COUNT(*) AS n FROM weekly_learning_records
          WHERE class_id = ? AND week_start = ? AND applicable = 1
            AND attended_main_sessions IS NULL AND expected_main_sessions > 0`,
      )
      .get(c.id, currentWeek) as any).n as number;
    const prog = classProgress(c.id);
    return {
      id: c.id, code: c.code, name: c.name, branchId: c.branch_id, branchName: c.branch_name,
      category: c.category, classTypeName: c.class_type_name, status: c.status,
      startDate: c.start_date, endDate: c.end_date,
      coreTeacher: core ? { id: core.id, name: core.full_name } : null,
      activeStudents: activeCount,
      templateName: c.template_name, templateVersion: c.version_no,
      currentStage: prog.summary.currentStage,
      delayed: prog.summary.delayed,
      hasDeadlines: prog.summary.hasDeadlines,
      missingWeeklyRows: missing,
      myAssignment: myAssignmentInfo(p, c.id),
    };
  });
}

function myAssignmentInfo(p: Principal, classId: number) {
  const today = demoToday();
  const mine = p.teacherAssignments.filter(
    (a) => a.class_id === classId && a.status === 'active' && a.effective_from <= today && (!a.effective_to || a.effective_to >= today),
  );
  if (!mine.length) return null;
  return {
    isCore: mine.some((a) => a.is_core === 1),
    skills: mine.map((a) => a.skill).filter(Boolean) as string[],
  };
}

export function getClassDetail(p: Principal, classId: number) {
  require_(p, PERMISSIONS.ACADEMIC_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const c = conn
    .prepare(
      `SELECT c.*, ct.category, ct.name AS class_type_name, ct.code AS class_type_code,
              b.name AS branch_name, tv.version_no, tv.id AS version_id, t.name AS template_name, t.id AS template_id
         FROM classes c JOIN class_types ct ON ct.id = c.class_type_id JOIN branches b ON b.id = c.branch_id
         LEFT JOIN course_template_versions tv ON tv.id = c.template_version_id
         LEFT JOIN course_templates t ON t.id = tv.template_id
        WHERE c.id = ?`,
    )
    .get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');

  const assignments = conn
    .prepare(
      `SELECT ta.*, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? ORDER BY ta.is_core DESC, ta.skill`,
    )
    .all(classId) as any[];
  const skillConfig = conn.prepare('SELECT skill, expected_main_sessions_per_week FROM class_skill_config WHERE class_id = ?').all(classId) as any[];
  const roster = conn
    .prepare(
      `SELECT e.id AS enrollment_id, e.status, e.attempt_no, s.id AS student_id, s.student_code, s.full_name, s.target_band
         FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status IN ('active','paused') ORDER BY s.full_name`,
    )
    .all(classId) as any[];

  const currentWeek = weekStartOf(demoToday());
  return {
    id: c.id, code: c.code, name: c.name, branchId: c.branch_id, branchName: c.branch_name,
    category: c.category, classTypeName: c.class_type_name, classTypeCode: c.class_type_code,
    status: c.status, startDate: c.start_date, endDate: c.end_date, note: c.note,
    template: c.template_id
      ? { id: c.template_id, name: c.template_name, versionId: c.version_id, versionNo: c.version_no }
      : null,
    skillConfig: TEACHING_SKILLS.map((s) => ({
      skill: s,
      expectedPerWeek: skillConfig.find((k) => k.skill === s)?.expected_main_sessions_per_week ?? null,
    })),
    assignments: assignments.map((a) => ({
      id: a.id, userId: a.user_id, name: a.full_name, skill: a.skill, isCore: a.is_core === 1,
      effectiveFrom: a.effective_from, effectiveTo: a.effective_to, status: a.status,
    })),
    roster: roster.map((r) => ({
      enrollmentId: r.enrollment_id, studentId: r.student_id, studentCode: r.student_code,
      fullName: r.full_name, status: r.status, attemptNo: r.attempt_no, targetBand: r.target_band,
    })),
    weekSummary: classWeekSummary(classId, currentWeek),
    currentWeek,
    viewer: {
      editableSkills: TEACHING_SKILLS.filter((s) => can(p, PERMISSIONS.WEEKLY_EDIT, { classId, skill: s })),
      isCoreTeacher: isCoreTeacherOf(p, classId),
      canEditProgress: can(p, PERMISSIONS.CLASS_PROGRESS_EDIT, { classId }),
      canEditOverride: can(p, PERMISSIONS.CLASS_OVERRIDE_EDIT, { classId }),
      canEditSummary: can(p, PERMISSIONS.SUMMARY_EDIT, { classId }),
      canManageAssignments: can(p, PERMISSIONS.ADMIN_USERS, { classId }),
    },
  };
}

export function updateStageProgress(
  p: Principal,
  classId: number,
  stageKey: string,
  patch: { status?: string; actualDate?: string | null; note?: string | null },
) {
  require_(p, PERMISSIONS.CLASS_PROGRESS_EDIT, { classId }, 'Bạn không có quyền cập nhật tiến độ chương trình của lớp này.');
  const stages = resolveClassStages(classId);
  if (!stages.some((s) => s.stageKey === stageKey)) throw badRequest('Mốc chương trình không tồn tại trong lớp này.');
  return tx(() => {
    const conn = db();
    const before = conn.prepare('SELECT * FROM class_stage_progress WHERE class_id = ? AND stage_key = ?').get(classId, stageKey);
    conn
      .prepare(
        `INSERT INTO class_stage_progress (class_id, stage_key, status, actual_date, note, updated_by, updated_at)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(class_id, stage_key) DO UPDATE SET
           status = COALESCE(excluded.status, class_stage_progress.status),
           actual_date = excluded.actual_date,
           note = excluded.note,
           updated_by = excluded.updated_by,
           updated_at = excluded.updated_at`,
      )
      .run(classId, stageKey, patch.status ?? 'not_started', patch.actualDate ?? null, patch.note ?? null, p.userId, nowIso());
    const after = conn.prepare('SELECT * FROM class_stage_progress WHERE class_id = ? AND stage_key = ?').get(classId, stageKey);
    writeAudit({
      actorUserId: p.userId, action: 'class.progress.update', entityType: 'class', entityId: classId,
      entityLabel: stageKey, before, after,
    });
    return after;
  });
}

export function upsertClassOverride(p: Principal, classId: number, input: any) {
  require_(p, PERMISSIONS.CLASS_OVERRIDE_EDIT, { classId }, 'Bạn không có quyền điều chỉnh chương trình riêng cho lớp này.');
  return tx(() => {
    const conn = db();
    const before = conn.prepare('SELECT * FROM class_stage_overrides WHERE class_id = ? AND stage_key = ?').get(classId, input.stageKey);
    conn
      .prepare(
        `INSERT INTO class_stage_overrides
          (class_id, stage_key, action, name, seq, kind, week_from, week_to, due_offset_days, clear_due, description, reason, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(class_id, stage_key) DO UPDATE SET
           action = excluded.action, name = excluded.name, seq = excluded.seq, kind = excluded.kind,
           week_from = excluded.week_from, week_to = excluded.week_to,
           due_offset_days = excluded.due_offset_days, clear_due = excluded.clear_due,
           description = excluded.description, reason = excluded.reason`,
      )
      .run(
        classId, input.stageKey, input.action ?? 'modify', input.name ?? null, input.seq ?? null,
        input.kind ?? null, input.weekFrom ?? null, input.weekTo ?? null,
        input.dueOffsetDays ?? null, input.clearDue ? 1 : 0, input.description ?? null,
        input.reason ?? null, p.userId, nowIso(),
      );
    const after = conn.prepare('SELECT * FROM class_stage_overrides WHERE class_id = ? AND stage_key = ?').get(classId, input.stageKey);
    writeAudit({
      actorUserId: p.userId, action: 'class.override.upsert', entityType: 'class', entityId: classId,
      entityLabel: input.stageKey, before, after,
    });
    return after;
  });
}

export function removeClassOverride(p: Principal, classId: number, stageKey: string) {
  require_(p, PERMISSIONS.CLASS_OVERRIDE_EDIT, { classId });
  const before = db().prepare('SELECT * FROM class_stage_overrides WHERE class_id = ? AND stage_key = ?').get(classId, stageKey);
  db().prepare('DELETE FROM class_stage_overrides WHERE class_id = ? AND stage_key = ?').run(classId, stageKey);
  writeAudit({
    actorUserId: p.userId, action: 'class.override.remove', entityType: 'class', entityId: classId,
    entityLabel: stageKey, before, after: null,
  });
}
