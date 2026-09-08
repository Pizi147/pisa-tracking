import { db, tx } from '../db.ts';
import { PERMISSIONS, type DeadlineState } from '../../../shared/domain.ts';
import { activeSignalPolicy, demoToday } from '../demoConfig.ts';
import { badRequest, diffDays, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, viewScope, type Principal } from '../permissions.ts';
import { notify, writeAudit } from './audit.ts';

/** Deadline state luôn do hệ thống tính, không cho nhập tay. */
export function deadlineState(task: { status: string; deadline: string | null }, today = demoToday()): DeadlineState {
  if (task.status === 'completed') return 'closed';
  if (!task.deadline) return 'no_deadline';
  const d = diffDays(task.deadline, today);
  const policy = activeSignalPolicy();
  if (d < 0) return 'overdue';
  if (d <= policy.due_soon_days) return 'due_soon';
  return 'on_track';
}

export function nextTaskCode(): string {
  const row = db().prepare("SELECT COUNT(*) AS n FROM tasks").get() as any;
  return padCode('TASK', row.n + 1, 4);
}

export type TaskFilters = {
  view?: 'all' | 'mine' | 'overdue' | 'due_soon' | 'in_progress' | 'paused' | 'completed' | 'long_running';
  branchId?: number;
  status?: string;
  assigneeId?: number;
  issueId?: number;
  meetingPeriodId?: number;
  studentId?: number;
  q?: string;
};

export function listTasks(p: Principal, f: TaskFilters = {}) {
  const scope = viewScope(p, PERMISSIONS.TASK_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };

  const where: string[] = [];
  const params: unknown[] = [];

  // Scope rộng (branch/global) thấy task trong scope; scope hẹp chỉ thấy task được giao cho mình.
  const scopeClauses: string[] = [];
  if (scope.all) scopeClauses.push('1=1');
  if (scope.branchIds.length) {
    scopeClauses.push(`t.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.unitIds.length) {
    scopeClauses.push(`t.reporting_unit_id IN (${scope.unitIds.map(() => '?').join(',')})`);
    params.push(...scope.unitIds);
  }
  scopeClauses.push('t.assignee_user_id = ?');
  params.push(p.userId);
  where.push('(' + scopeClauses.join(' OR ') + ')');

  if (f.branchId) { where.push('t.branch_id = ?'); params.push(f.branchId); }
  if (f.status) { where.push('t.status = ?'); params.push(f.status); }
  if (f.assigneeId) { where.push('t.assignee_user_id = ?'); params.push(f.assigneeId); }
  if (f.issueId) { where.push('t.issue_id = ?'); params.push(f.issueId); }
  if (f.studentId) { where.push('t.student_id = ?'); params.push(f.studentId); }
  if (f.meetingPeriodId) { where.push('t.source_meeting_period_id = ?'); params.push(f.meetingPeriodId); }
  if (f.q) { where.push('(t.title LIKE ? OR t.code LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }
  if (f.view === 'mine') { where.push('t.assignee_user_id = ?'); params.push(p.userId); }

  const rows = db()
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, b.name AS branch_name, ru.name AS unit_name,
              i.code AS issue_code, i.title AS issue_title,
              s.student_code, s.full_name AS student_name, c.code AS class_code,
              mp.label AS meeting_label, cu.full_name AS creator_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN users cu ON cu.id = t.created_by
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN reporting_units ru ON ru.id = t.reporting_unit_id
         LEFT JOIN issues i ON i.id = t.issue_id
         LEFT JOIN students s ON s.id = t.student_id
         LEFT JOIN classes c ON c.id = t.class_id
         LEFT JOIN meeting_periods mp ON mp.id = t.source_meeting_period_id
        WHERE ${where.join(' AND ')}
        ORDER BY CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END, t.deadline, t.id DESC`,
    )
    .all(...params) as any[];

  const today = demoToday();
  const policy = activeSignalPolicy();
  let mapped = rows.map((t) => ({
    id: t.id, code: t.code, title: t.title, detail: t.detail,
    assigneeId: t.assignee_user_id, assigneeName: t.assignee_name,
    branchId: t.branch_id, branchName: t.branch_name, unitName: t.unit_name,
    priority: t.priority, status: t.status,
    deadline: t.deadline, originalDeadline: t.original_deadline,
    deadlineState: deadlineState(t, today),
    daysOverdue: t.deadline && t.status !== 'completed' ? Math.max(0, diffDays(today, t.deadline)) : 0,
    ageDays: diffDays(today, (t.created_at as string).slice(0, 10)),
    createdAt: t.created_at, completedAt: t.completed_at,
    pausedReason: t.paused_reason,
    creatorName: t.creator_name,
    sourceType: t.source_type,
    issue: t.issue_id ? { id: t.issue_id, code: t.issue_code, title: t.issue_title } : null,
    student: t.student_id ? { id: t.student_id, code: t.student_code, name: t.student_name } : null,
    classCode: t.class_code,
    meetingLabel: t.meeting_label,
    meetingPeriodId: t.source_meeting_period_id,
    canEdit: canEditTask(p, t),
    canManage: canManageTask(p, t),
  }));

  switch (f.view) {
    case 'overdue': mapped = mapped.filter((t) => t.deadlineState === 'overdue'); break;
    case 'due_soon': mapped = mapped.filter((t) => t.deadlineState === 'due_soon'); break;
    case 'in_progress': mapped = mapped.filter((t) => t.status === 'in_progress'); break;
    case 'paused': mapped = mapped.filter((t) => t.status === 'paused'); break;
    case 'completed': mapped = mapped.filter((t) => t.status === 'completed'); break;
    case 'long_running':
      mapped = mapped.filter((t) => t.status !== 'completed' && t.ageDays >= policy.long_running_days);
      break;
  }
  return { rows: mapped, scopeEmpty: false, longRunningDays: policy.long_running_days };
}

function canManageTask(p: Principal, t: any): boolean {
  return can(p, PERMISSIONS.TASK_MANAGE, { branchId: t.branch_id, reportingUnitId: t.reporting_unit_id });
}

/** Assignee cập nhật được task của mình, nhưng chỉ các field được phép. */
function canEditTask(p: Principal, t: any): boolean {
  if (canManageTask(p, t)) return true;
  return t.assignee_user_id === p.userId && p.grants.some((g) => g.permissions.has(PERMISSIONS.TASK_UPDATE_ASSIGNED));
}

const ASSIGNEE_EDITABLE = new Set(['status', 'note', 'pausedReason']);

export function createTask(p: Principal, input: any) {
  const ctx = { branchId: input.branchId ?? null, reportingUnitId: input.reportingUnitId ?? null };
  require_(p, PERMISSIONS.TASK_MANAGE, ctx, 'Bạn không có quyền tạo công việc trong phạm vi này.');
  if (!input.title?.trim()) throw badRequest('Nội dung công việc không được để trống.');

  return tx(() => {
    const conn = db();
    const code = nextTaskCode();
    const info = conn
      .prepare(
        `INSERT INTO tasks
          (code, title, detail, assignee_user_id, branch_id, reporting_unit_id, scope_type, student_id, class_id,
           issue_id, source_type, source_meeting_period_id, source_branch_report_id, priority, status,
           deadline, original_deadline, note, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        code, input.title.trim(), input.detail ?? null, input.assigneeUserId ?? null,
        input.branchId ?? null, input.reportingUnitId ?? null, input.scopeType ?? 'branch',
        input.studentId ?? null, input.classId ?? null, input.issueId ?? null,
        input.sourceType ?? 'manual', input.meetingPeriodId ?? null, input.branchReportId ?? null,
        input.priority ?? 'normal', 'not_started',
        input.deadline ?? null, input.deadline ?? null, input.note ?? null, p.userId, nowIso(),
      );
    const id = Number(info.lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'task.create', entityType: 'task', entityId: id,
      entityLabel: code, branchId: input.branchId ?? null, studentId: input.studentId ?? null,
      after: conn.prepare('SELECT * FROM tasks WHERE id = ?').get(id),
    });
    if (input.assigneeUserId) {
      notify({
        userId: input.assigneeUserId, kind: 'task_assigned', title: `Bạn được giao công việc ${code}`,
        body: input.title, entityType: 'task', entityId: id, source: input.sourceType ?? 'manual',
        dedupKey: `task_assigned:${id}`,
      });
    }
    return conn.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });
}

export function updateTask(p: Principal, taskId: number, patch: any, reason?: string) {
  return tx(() => {
    const conn = db();
    const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!t) throw notFound('Không tìm thấy công việc');
    const manage = canManageTask(p, t);
    if (!manage && !canEditTask(p, t)) {
      require_(p, PERMISSIONS.TASK_MANAGE, { branchId: t.branch_id }, 'Bạn không có quyền cập nhật công việc này.');
    }
    if (!manage) {
      // Assignee không được đổi người giao, scope, owner hoặc liên kết sang đối tượng ngoài quyền.
      const illegal = Object.keys(patch).filter((k) => !ASSIGNEE_EDITABLE.has(k));
      if (illegal.length) {
        throw badRequest('Bạn chỉ được cập nhật trạng thái, ghi chú và lý do tạm dừng của công việc được giao.');
      }
    }

    const map: Record<string, string> = {
      title: 'title', detail: 'detail', assigneeUserId: 'assignee_user_id', branchId: 'branch_id',
      priority: 'priority', status: 'status', deadline: 'deadline', note: 'note',
      pausedReason: 'paused_reason', issueId: 'issue_id', studentId: 'student_id', classId: 'class_id',
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    const before = { ...t };

    for (const [key, value] of Object.entries(patch)) {
      const col = map[key];
      if (!col) continue;
      sets.push(`${col} = ?`);
      params.push(value);
      if (key === 'deadline' && value !== t.deadline) {
        conn
          .prepare('INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)')
          .run(taskId, 'deadline', t.deadline, String(value ?? ''), reason ?? null, p.userId, nowIso());
      }
      if (key === 'status' && value !== t.status) {
        conn
          .prepare('INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)')
          .run(taskId, 'status', t.status, String(value), reason ?? null, p.userId, nowIso());
      }
    }
    if (patch.status === 'completed' && t.status !== 'completed') {
      sets.push('completed_at = ?'); params.push(nowIso());
    }
    if (patch.status && patch.status !== 'completed' && t.status === 'completed') {
      sets.push('completed_at = NULL');
    }
    if (patch.status === 'paused' && !patch.pausedReason && !t.paused_reason) {
      throw badRequest('Cần ghi lý do khi tạm dừng công việc.');
    }
    if (!sets.length) return t;
    sets.push('updated_at = ?'); params.push(nowIso());
    params.push(taskId);
    conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const after = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    writeAudit({
      actorUserId: p.userId, action: 'task.update', entityType: 'task', entityId: taskId,
      entityLabel: t.code, branchId: t.branch_id, before, after,
    });
    return after;
  });
}

export function taskDetail(p: Principal, taskId: number) {
  const t = db()
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, b.name AS branch_name, i.code AS issue_code, i.title AS issue_title,
              s.student_code, s.full_name AS student_name, c.code AS class_code, mp.label AS meeting_label,
              cu.full_name AS creator_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN users cu ON cu.id = t.created_by
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN issues i ON i.id = t.issue_id
         LEFT JOIN students s ON s.id = t.student_id
         LEFT JOIN classes c ON c.id = t.class_id
         LEFT JOIN meeting_periods mp ON mp.id = t.source_meeting_period_id
        WHERE t.id = ?`,
    )
    .get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc');
  if (!canEditTask(p, t) && !can(p, PERMISSIONS.TASK_VIEW, { branchId: t.branch_id }) && t.assignee_user_id !== p.userId) {
    require_(p, PERMISSIONS.TASK_VIEW, { branchId: t.branch_id }, 'Công việc này nằm ngoài phạm vi bạn được xem.');
  }
  const history = db()
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM task_history h LEFT JOIN users u ON u.id = h.actor_user_id
        WHERE h.task_id = ? ORDER BY h.id DESC`,
    )
    .all(taskId) as any[];
  return {
    id: t.id, code: t.code, title: t.title, detail: t.detail, note: t.note,
    assigneeId: t.assignee_user_id, assigneeName: t.assignee_name,
    branchId: t.branch_id, branchName: t.branch_name,
    priority: t.priority, status: t.status, deadline: t.deadline, originalDeadline: t.original_deadline,
    deadlineState: deadlineState(t), createdAt: t.created_at, completedAt: t.completed_at,
    pausedReason: t.paused_reason, creatorName: t.creator_name, sourceType: t.source_type,
    issue: t.issue_id ? { id: t.issue_id, code: t.issue_code, title: t.issue_title } : null,
    student: t.student_id ? { id: t.student_id, code: t.student_code, name: t.student_name } : null,
    classCode: t.class_code,
    meetingLabel: t.meeting_label,
    meetingPeriodId: t.source_meeting_period_id,
    history: history.map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      reason: h.reason, actorName: h.actor_name, createdAt: h.created_at,
    })),
    canEdit: canEditTask(p, t),
    canManage: canManageTask(p, t),
  };
}
