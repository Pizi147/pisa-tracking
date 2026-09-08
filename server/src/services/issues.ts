import { db, tx } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, viewScope, type Principal } from '../permissions.ts';
import { writeAudit, notify } from './audit.ts';

function nextIssueCode(): string {
  const row = db().prepare('SELECT COUNT(*) AS n FROM issues').get() as any;
  return padCode('ISS', row.n + 1, 4);
}

export function listIssues(p: Principal, f: { status?: string; branchId?: number; risk?: string; q?: string; studentId?: number; meetingPeriodId?: number } = {}) {
  const scope = viewScope(p, PERMISSIONS.ISSUE_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };

  const scopeClauses: string[] = [];
  const params: unknown[] = [];
  if (scope.all) scopeClauses.push('1=1');
  if (scope.branchIds.length) {
    scopeClauses.push(`i.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.classIds.length) {
    scopeClauses.push(`i.class_id IN (${scope.classIds.map(() => '?').join(',')})`);
    params.push(...scope.classIds);
  }
  if (scope.studentIds.length) {
    scopeClauses.push(`i.student_id IN (${scope.studentIds.map(() => '?').join(',')})`);
    params.push(...scope.studentIds);
  }
  scopeClauses.push('i.owner_user_id = ?');
  params.push(p.userId);

  const where = ['(' + scopeClauses.join(' OR ') + ')'];
  if (f.status) { where.push('i.status = ?'); params.push(f.status); }
  if (f.branchId) { where.push('i.branch_id = ?'); params.push(f.branchId); }
  if (f.risk) { where.push('i.risk_level = ?'); params.push(f.risk); }
  if (f.studentId) { where.push('i.student_id = ?'); params.push(f.studentId); }
  if (f.q) { where.push('(i.title LIKE ? OR i.code LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }
  if (f.meetingPeriodId) {
    where.push('EXISTS (SELECT 1 FROM issue_meeting_links l WHERE l.issue_id = i.id AND l.meeting_period_id = ?)');
    params.push(f.meetingPeriodId);
  }

  const rows = db()
    .prepare(
      `SELECT i.*, u.full_name AS owner_name, b.name AS branch_name, c.code AS class_code,
              s.student_code, s.full_name AS student_name,
              (SELECT COUNT(*) FROM tasks t WHERE t.issue_id = i.id) AS task_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.issue_id = i.id AND t.status != 'completed') AS open_task_count
         FROM issues i
         LEFT JOIN users u ON u.id = i.owner_user_id
         LEFT JOIN branches b ON b.id = i.branch_id
         LEFT JOIN classes c ON c.id = i.class_id
         LEFT JOIN students s ON s.id = i.student_id
        WHERE ${where.join(' AND ')}
        ORDER BY CASE i.status WHEN 'open' THEN 0 WHEN 'discussing' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
                 CASE i.risk_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, i.id DESC`,
    )
    .all(...params) as any[];

  return {
    rows: rows.map((i) => ({
      id: i.id, code: i.code, title: i.title, description: i.description,
      scopeType: i.scope_type, riskLevel: i.risk_level, status: i.status,
      ownerId: i.owner_user_id, ownerName: i.owner_name,
      branchId: i.branch_id, branchName: i.branch_name, classId: i.class_id, classCode: i.class_code,
      studentId: i.student_id, studentCode: i.student_code, studentName: i.student_name,
      sourceType: i.source_type, sourceBranchReportId: i.source_branch_report_id,
      taskCount: i.task_count, openTaskCount: i.open_task_count,
      createdAt: i.created_at, updatedAt: i.updated_at, resolvedAt: i.resolved_at,
      canManage: can(p, PERMISSIONS.ISSUE_MANAGE, { branchId: i.branch_id, classId: i.class_id, studentId: i.student_id }),
    })),
    scopeEmpty: false,
  };
}

export function createIssue(p: Principal, input: any) {
  const ctx = { branchId: input.branchId ?? null, classId: input.classId ?? null, studentId: input.studentId ?? null };
  require_(p, PERMISSIONS.ISSUE_MANAGE, ctx, 'Bạn không có quyền tạo vấn đề trong phạm vi này.');
  if (!input.title?.trim()) throw badRequest('Tiêu đề vấn đề không được để trống.');

  return tx(() => {
    const conn = db();
    let branchId = input.branchId ?? null;
    if (!branchId && input.classId) {
      branchId = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(input.classId) as any)?.branch_id ?? null;
    }
    if (!branchId && input.studentId) {
      branchId = (conn.prepare('SELECT branch_id FROM students WHERE id = ?').get(input.studentId) as any)?.branch_id ?? null;
    }
    const code = nextIssueCode();
    const info = conn
      .prepare(
        `INSERT INTO issues
          (code, title, description, scope_type, branch_id, class_id, student_id, reporting_unit_id,
           risk_level, owner_user_id, status, source_type, source_branch_report_id, created_by, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        code, input.title.trim(), input.description ?? null, input.scopeType ?? 'branch',
        branchId, input.classId ?? null, input.studentId ?? null, input.reportingUnitId ?? null,
        input.riskLevel ?? 'medium', input.ownerUserId ?? null, 'open',
        input.sourceType ?? 'manual', input.branchReportId ?? null, p.userId, nowIso(), nowIso(),
      );
    const id = Number(info.lastInsertRowid);
    if (input.meetingPeriodId) {
      conn.prepare('INSERT OR IGNORE INTO issue_meeting_links (issue_id, meeting_period_id) VALUES (?,?)').run(id, input.meetingPeriodId);
    }
    writeAudit({
      actorUserId: p.userId, action: 'issue.create', entityType: 'issue', entityId: id,
      entityLabel: code, branchId, studentId: input.studentId ?? null,
      after: conn.prepare('SELECT * FROM issues WHERE id = ?').get(id),
    });
    if (input.ownerUserId) {
      notify({
        userId: input.ownerUserId, kind: 'issue_assigned', title: `Bạn được giao xử lý vấn đề ${code}`,
        body: input.title, entityType: 'issue', entityId: id, dedupKey: `issue_assigned:${id}`,
      });
    }
    return conn.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  });
}

export function updateIssue(p: Principal, issueId: number, patch: any) {
  return tx(() => {
    const conn = db();
    const i = conn.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as any;
    if (!i) throw notFound('Không tìm thấy vấn đề');
    require_(p, PERMISSIONS.ISSUE_MANAGE, { branchId: i.branch_id, classId: i.class_id, studentId: i.student_id });
    const map: Record<string, string> = {
      title: 'title', description: 'description', riskLevel: 'risk_level',
      status: 'status', ownerUserId: 'owner_user_id',
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (!map[k]) continue;
      sets.push(`${map[k]} = ?`); params.push(v);
    }
    if (patch.status === 'resolved' && i.status !== 'resolved') { sets.push('resolved_at = ?'); params.push(nowIso()); }
    if (patch.status && patch.status !== 'resolved' && i.status === 'resolved') sets.push('resolved_at = NULL');
    if (!sets.length) return i;
    sets.push('updated_at = ?'); params.push(nowIso());
    params.push(issueId);
    conn.prepare(`UPDATE issues SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const after = conn.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
    writeAudit({
      actorUserId: p.userId, action: 'issue.update', entityType: 'issue', entityId: issueId,
      entityLabel: i.code, branchId: i.branch_id, before: i, after,
    });
    return after;
  });
}

export function issueDetail(p: Principal, issueId: number) {
  const conn = db();
  const i = conn
    .prepare(
      `SELECT i.*, u.full_name AS owner_name, b.name AS branch_name, c.code AS class_code,
              s.student_code, s.full_name AS student_name, cu.full_name AS creator_name,
              br.id AS report_id, ru.name AS unit_name, rp.label AS period_label
         FROM issues i
         LEFT JOIN users u ON u.id = i.owner_user_id
         LEFT JOIN users cu ON cu.id = i.created_by
         LEFT JOIN branches b ON b.id = i.branch_id
         LEFT JOIN classes c ON c.id = i.class_id
         LEFT JOIN students s ON s.id = i.student_id
         LEFT JOIN branch_reports br ON br.id = i.source_branch_report_id
         LEFT JOIN reporting_units ru ON ru.id = br.reporting_unit_id
         LEFT JOIN report_periods rp ON rp.id = br.report_period_id
        WHERE i.id = ?`,
    )
    .get(issueId) as any;
  if (!i) throw notFound('Không tìm thấy vấn đề');
  require_(p, PERMISSIONS.ISSUE_VIEW, { branchId: i.branch_id, classId: i.class_id, studentId: i.student_id },
    'Vấn đề này nằm ngoài phạm vi bạn được xem.');

  const notes = conn
    .prepare(
      `SELECT n.*, u.full_name AS author_name FROM issue_notes n LEFT JOIN users u ON u.id = n.author_user_id
        WHERE n.issue_id = ? ORDER BY n.id DESC`,
    )
    .all(issueId) as any[];
  const tasks = conn
    .prepare(
      `SELECT t.id, t.code, t.title, t.status, t.deadline, u.full_name AS assignee_name
         FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id WHERE t.issue_id = ? ORDER BY t.id`,
    )
    .all(issueId) as any[];
  const meetings = conn
    .prepare(
      `SELECT mp.id, mp.label, mp.meeting_date FROM issue_meeting_links l
         JOIN meeting_periods mp ON mp.id = l.meeting_period_id WHERE l.issue_id = ? ORDER BY mp.meeting_date`,
    )
    .all(issueId) as any[];
  const decisions = conn
    .prepare(
      `SELECT d.*, mp.label AS meeting_label, u.full_name AS decided_by_name FROM meeting_decisions d
         JOIN meeting_periods mp ON mp.id = d.meeting_period_id
         LEFT JOIN users u ON u.id = d.decided_by
        WHERE d.issue_id = ? ORDER BY d.id`,
    )
    .all(issueId) as any[];
  const audit = conn
    .prepare(
      `SELECT a.action, a.created_at, u.full_name AS actor_name FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.entity_type = 'issue' AND a.entity_id = ? ORDER BY a.id DESC LIMIT 20`,
    )
    .all(issueId) as any[];

  return {
    id: i.id, code: i.code, title: i.title, description: i.description,
    scopeType: i.scope_type, riskLevel: i.risk_level, status: i.status,
    ownerId: i.owner_user_id, ownerName: i.owner_name, creatorName: i.creator_name,
    branchId: i.branch_id, branchName: i.branch_name,
    classId: i.class_id, classCode: i.class_code,
    studentId: i.student_id, studentCode: i.student_code, studentName: i.student_name,
    sourceType: i.source_type,
    sourceReport: i.report_id ? { id: i.report_id, unitName: i.unit_name, periodLabel: i.period_label } : null,
    createdAt: i.created_at, updatedAt: i.updated_at, resolvedAt: i.resolved_at,
    notes: notes.map((n) => ({ id: n.id, body: n.body, authorName: n.author_name, createdAt: n.created_at })),
    tasks: tasks.map((t) => ({ id: t.id, code: t.code, title: t.title, status: t.status, deadline: t.deadline, assigneeName: t.assignee_name })),
    meetings,
    decisions: decisions.map((d) => ({ id: d.id, decision: d.decision, note: d.note, meetingLabel: d.meeting_label, decidedByName: d.decided_by_name, createdAt: d.created_at })),
    audit,
    canManage: can(p, PERMISSIONS.ISSUE_MANAGE, { branchId: i.branch_id, classId: i.class_id, studentId: i.student_id }),
  };
}

export function addIssueNote(p: Principal, issueId: number, body: string) {
  const i = db().prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as any;
  if (!i) throw notFound();
  require_(p, PERMISSIONS.ISSUE_MANAGE, { branchId: i.branch_id, classId: i.class_id, studentId: i.student_id });
  if (!body?.trim()) throw badRequest('Nội dung ghi chú không được để trống.');
  const info = db()
    .prepare('INSERT INTO issue_notes (issue_id, body, author_user_id, created_at) VALUES (?,?,?,?)')
    .run(issueId, body.trim(), p.userId, nowIso());
  db().prepare('UPDATE issues SET updated_at = ? WHERE id = ?').run(nowIso(), issueId);
  return Number(info.lastInsertRowid);
}

/** Gợi ý dữ liệu điền sẵn khi tạo issue từ màn student/class/branch report. */
export function issuePrefill(p: Principal, source: { studentId?: number; classId?: number; branchReportId?: number }) {
  const conn = db();
  if (source.studentId) {
    const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(source.studentId) as any;
    const enr = conn
      .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status IN ('active','paused') ORDER BY id DESC LIMIT 1`)
      .get(source.studentId) as any;
    const branchId = enr ? (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(enr.class_id) as any)?.branch_id : s?.branch_id;
    return {
      scopeType: 'student', studentId: source.studentId, classId: enr?.class_id ?? null, branchId,
      title: `Vấn đề học tập: ${s?.full_name} (${s?.student_code})`, sourceType: 'student',
    };
  }
  if (source.classId) {
    const c = conn.prepare('SELECT * FROM classes WHERE id = ?').get(source.classId) as any;
    return { scopeType: 'class', classId: source.classId, branchId: c?.branch_id, title: `Vấn đề lớp ${c?.code}`, sourceType: 'class' };
  }
  if (source.branchReportId) {
    const r = conn
      .prepare(
        `SELECT br.*, ru.name AS unit_name, ru.branch_id, rp.label FROM branch_reports br
           JOIN reporting_units ru ON ru.id = br.reporting_unit_id
           JOIN report_periods rp ON rp.id = br.report_period_id WHERE br.id = ?`,
      )
      .get(source.branchReportId) as any;
    return {
      scopeType: 'branch', branchId: r?.branch_id, reportingUnitId: r?.reporting_unit_id,
      branchReportId: source.branchReportId, sourceType: 'branch_report',
      title: `Vấn đề từ báo cáo ${r?.unit_name} — ${r?.label}`,
    };
  }
  return { scopeType: 'branch', sourceType: 'manual', title: '' };
}
