import { db, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, PERMISSIONS, TASK_PROGRESS, TASK_TYPES,
  TUTOR_REPORT_CATEGORIES, UNIT_STATUSES, type DueState,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, diffDays, isIsoDate, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, scopeFor, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';
import { periodById } from './week.ts';

export const DUE_SOON_DAYS = 3;

/** Nhóm báo cáo phụ thuộc loại đơn vị. Tutor part-time có bộ nhóm riêng. */
export function categoriesFor(unit: { kind: string }) {
  return unit.kind === 'branch' ? BRANCH_REPORT_CATEGORIES : TUTOR_REPORT_CATEGORIES;
}

export function visibleUnits(p: Principal) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return [];
  const conn = db();
  const all = conn.prepare(`SELECT * FROM reporting_units WHERE status='active' ORDER BY seq, name`).all() as any[];
  if (scope.all) return all;
  return all.filter((u) => u.branch_id === null || scope.branchIds.includes(u.branch_id));
}

/** Tình hình các đơn vị trong một kỳ. Ô trống = CHƯA BÁO CÁO, khác hẳn "Ổn". */
export function meetingBoard(p: Principal, periodId: number) {
  require_(p, PERMISSIONS.MEETING_VIEW, { anyScope: true }, 'Bạn không có quyền xem họp tuần.');
  const period = periodById(periodId);
  if (!period) throw notFound('Không tìm thấy kỳ họp');
  const conn = db();
  const units = visibleUnits(p);

  const unitRows = units.map((u) => {
    const cats = categoriesFor(u);
    const saved = conn
      .prepare('SELECT * FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ?')
      .all(u.id, periodId) as any[];
    const cells = cats.map((c) => {
      const r = saved.find((x) => x.category_key === c.key);
      return {
        key: c.key, label: c.label, hint: c.hint,
        status: r?.status ?? null,          // null = chưa báo cáo
        note: r?.note ?? null,
        reporterName: r?.reporter_user_id
          ? (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(r.reporter_user_id) as any)?.full_name ?? null
          : null,
        updatedAt: r?.updated_at ?? null,
        reportId: r?.id ?? null,
      };
    });
    return {
      unitId: u.id, unitName: u.name, unitCode: u.code, kind: u.kind, branchId: u.branch_id,
      cells,
      reported: cells.filter((c) => c.status !== null).length,
      total: cells.length,
      canEdit: can(p, PERMISSIONS.MEETING_EDIT, { branchId: u.branch_id, anyScope: u.branch_id === null }),
    };
  });

  const totals = unitRows.reduce(
    (acc, u) => {
      for (const c of u.cells) {
        acc.total += 1;
        if (c.status === null) acc.notReported += 1;
        else if (c.status === 'problem') acc.problem += 1;
        else if (c.status === 'watch') acc.watch += 1;
        else acc.ok += 1;
      }
      return acc;
    },
    { total: 0, ok: 0, watch: 0, problem: 0, notReported: 0 },
  );

  return { period, units: unitRows, totals };
}

export function saveUnitReport(
  p: Principal, unitId: number, periodId: number, categoryKey: string,
  patch: { status?: string | null; note?: string | null },
) {
  const conn = db();
  const unit = conn.prepare('SELECT * FROM reporting_units WHERE id = ?').get(unitId) as any;
  if (!unit) throw notFound('Không tìm thấy đơn vị');
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: unit.branch_id, anyScope: unit.branch_id === null },
    'Bạn không có quyền cập nhật báo cáo của đơn vị này.');
  const cat = categoriesFor(unit).find((c) => c.key === categoryKey);
  if (!cat) throw badRequest('Nhóm báo cáo không thuộc đơn vị này.');
  if (patch.status && !(UNIT_STATUSES as readonly string[]).includes(patch.status)) {
    throw badRequest('Tình trạng không hợp lệ.');
  }

  const before = conn
    .prepare('SELECT * FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?')
    .get(unitId, periodId, categoryKey);

  conn
    .prepare(
      `INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(reporting_unit_id, period_id, category_key) DO UPDATE SET
         status = CASE WHEN excluded.status IS NOT NULL OR ? THEN excluded.status ELSE unit_reports.status END,
         note = CASE WHEN ? THEN excluded.note ELSE unit_reports.note END,
         reporter_user_id = excluded.reporter_user_id,
         updated_at = excluded.updated_at`,
    )
    .run(unitId, periodId, categoryKey, cat.label,
         patch.status ?? null, patch.note ?? null, p.userId, nowIso(),
         patch.status !== undefined ? 1 : 0, patch.note !== undefined ? 1 : 0);

  const after = conn
    .prepare('SELECT * FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?')
    .get(unitId, periodId, categoryKey);
  writeAudit({ actorUserId: p.userId, action: 'unit_report.save', entityType: 'unit_report',
    entityId: (after as any).id, entityLabel: `${unit.name} · ${cat.label}`, before, after });
  return after;
}

// ---------------------------------------------------------------- công việc

export function dueState(t: { progress: string; due_date: string | null }, today = demoToday()): DueState {
  if (t.progress === 'done') return 'closed';
  if (!t.due_date) return 'no_due';
  const d = diffDays(t.due_date, today);
  if (d < 0) return 'overdue';
  if (d <= DUE_SOON_DAYS) return 'due_soon';
  return 'on_track';
}

export type TaskFilters = { periodId?: number; view?: string; assigneeId?: number; unitId?: number; q?: string };

/**
 * Việc trong kỳ lọc theo kỳ. Việc dài hạn chưa xong và việc quá hạn/sắp đến hạn xét XUYÊN KỲ,
 * để đổi tuần không làm biến mất việc còn tồn.
 */
export function listTasks(p: Principal, f: TaskFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const where: string[] = [];
  const params: unknown[] = [];

  if (!scope.all) {
    const parts = ['t.assignee_user_id = ?'];
    params.push(p.userId);
    if (scope.branchIds.length) {
      parts.push(`t.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
      params.push(...scope.branchIds);
      parts.push('t.branch_id IS NULL');
    }
    where.push('(' + parts.join(' OR ') + ')');
  }
  if (f.assigneeId) { where.push('t.assignee_user_id = ?'); params.push(f.assigneeId); }
  if (f.unitId) { where.push('t.reporting_unit_id = ?'); params.push(f.unitId); }
  if (f.q) { where.push('(t.title LIKE ? OR t.code LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }

  const rows = conn
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, ru.name AS unit_name, pr.code AS period_code,
              pr.week_start AS period_start
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN reporting_units ru ON ru.id = t.reporting_unit_id
         LEFT JOIN report_periods pr ON pr.id = t.period_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date, t.id DESC`,
    )
    .all(...params) as any[];

  const today = demoToday();
  const period = f.periodId ? periodById(f.periodId) : null;
  let mapped = rows.map((t) => ({
    id: t.id, code: t.code, title: t.title, taskType: t.task_type,
    unitId: t.reporting_unit_id, unitName: t.unit_name, branchId: t.branch_id,
    assigneeId: t.assignee_user_id, assigneeName: t.assignee_name,
    dueDate: t.due_date, progress: t.progress, note: t.note,
    dueState: dueState(t, today),
    periodId: t.period_id, periodCode: t.period_code, periodStart: t.period_start,
    sourceType: t.source_type, sourceSosCaseId: t.source_sos_case_id,
    createdAt: t.created_at, completedAt: t.completed_at,
    canEdit: can(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: t.branch_id === null })
             || t.assignee_user_id === p.userId,
  }));

  if (period) {
    // Giữ lại: việc của kỳ này, việc dài hạn chưa xong, và mọi việc quá hạn/sắp đến hạn.
    mapped = mapped.filter((t) =>
      t.periodId === period.id ||
      (t.taskType === 'long_term' && t.progress !== 'done') ||
      t.dueState === 'overdue' || t.dueState === 'due_soon');
  }
  switch (f.view) {
    case 'mine': mapped = mapped.filter((t) => t.assigneeId === p.userId); break;
    case 'overdue': mapped = mapped.filter((t) => t.dueState === 'overdue'); break;
    case 'open': mapped = mapped.filter((t) => t.progress !== 'done'); break;
    case 'done': mapped = mapped.filter((t) => t.progress === 'done'); break;
  }
  return { rows: mapped, scopeEmpty: false };
}

export function createTask(p: Principal, input: any) {
  const conn = db();
  const branchId = input.branchId ?? (input.unitId
    ? (conn.prepare('SELECT branch_id FROM reporting_units WHERE id = ?').get(input.unitId) as any)?.branch_id ?? null
    : null);
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId, anyScope: branchId === null }, 'Bạn không có quyền tạo công việc.');
  if (!input.title?.trim()) throw badRequest('Cần nội dung công việc.');
  if (input.dueDate && !isIsoDate(input.dueDate)) throw badRequest('Hạn không hợp lệ.');
  const taskType = (TASK_TYPES as readonly string[]).includes(input.taskType) ? input.taskType : 'in_period';

  return tx(() => {
    const n = (conn.prepare('SELECT COUNT(*) AS n FROM tasks').get() as any).n as number;
    const code = padCode('CV', n + 1, 4);
    const info = conn
      .prepare(
        `INSERT INTO tasks (code, period_id, task_type, title, reporting_unit_id, branch_id, assignee_user_id,
                            due_date, progress, note, source_type, source_unit_report_id, source_sos_case_id,
                            created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'not_started', ?,?,?,?,?,?)`,
      )
      .run(code, input.periodId ?? null, taskType, input.title.trim(), input.unitId ?? null, branchId,
           input.assigneeUserId ?? null, input.dueDate ?? null, input.note ?? null,
           input.sourceType ?? 'manual', input.sourceUnitReportId ?? null, input.sourceSosCaseId ?? null,
           p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'task.create', entityType: 'task', entityId: id,
      entityLabel: code, after: { title: input.title, dueDate: input.dueDate } });
    return conn.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });
}

const ASSIGNEE_EDITABLE = new Set(['progress', 'note']);

export function updateTask(p: Principal, taskId: number, patch: any) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc');
  const manage = can(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: t.branch_id === null });
  if (!manage) {
    if (t.assignee_user_id !== p.userId) {
      require_(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id }, 'Bạn không có quyền cập nhật công việc này.');
    }
    const illegal = Object.keys(patch).filter((k) => !ASSIGNEE_EDITABLE.has(k));
    if (illegal.length) throw badRequest('Bạn chỉ cập nhật được tiến độ và ghi chú của công việc được giao.');
  }
  if (patch.progress && !(TASK_PROGRESS as readonly string[]).includes(patch.progress)) {
    throw badRequest('Tiến độ không hợp lệ.');
  }
  if (patch.dueDate && !isIsoDate(patch.dueDate)) throw badRequest('Hạn không hợp lệ.');

  const map: Record<string, string> = {
    title: 'title', progress: 'progress', dueDate: 'due_date', note: 'note',
    assigneeUserId: 'assignee_user_id', taskType: 'task_type', unitId: 'reporting_unit_id',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    if (t[map[k]] === v) continue;
    sets.push(`${map[k]} = ?`);
    params.push(v);
    conn.prepare('INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(taskId, map[k], t[map[k]] === null ? null : String(t[map[k]]), v === null ? null : String(v), p.userId, nowIso());
  }
  if (patch.progress === 'done' && t.progress !== 'done') { sets.push('completed_at = ?'); params.push(nowIso()); }
  if (patch.progress && patch.progress !== 'done' && t.progress === 'done') sets.push('completed_at = NULL');
  if (!sets.length) return t;
  sets.push('updated_at = ?');
  params.push(nowIso(), taskId);
  conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const after = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  writeAudit({ actorUserId: p.userId, action: 'task.update', entityType: 'task', entityId: taskId,
    entityLabel: t.code, before: t, after });
  return after;
}

export function taskHistory(taskId: number) {
  return db()
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM task_history h LEFT JOIN users u ON u.id = h.actor_user_id
        WHERE h.task_id = ? ORDER BY h.id DESC`,
    )
    .all(taskId) as any[];
}
