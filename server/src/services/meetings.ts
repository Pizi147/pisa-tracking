import { db, tx } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { can, require_, viewScope, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';
import { deadlineState } from './tasks.ts';
import { branchReportGrid } from './reports.ts';

export function listMeetingPeriods() {
  return db()
    .prepare(
      `SELECT mp.*, rp.label AS period_label, rp.period_start, rp.period_end
         FROM meeting_periods mp JOIN report_periods rp ON rp.id = mp.report_period_id
        ORDER BY mp.meeting_date DESC`,
    )
    .all() as any[];
}

/**
 * Một kỳ họp: báo cáo liên quan, issue thảo luận, quyết định, task mới
 * và việc chưa xong từ kỳ trước (carry-over = chính task cũ, không nhân bản).
 */
export function meetingDetail(p: Principal, meetingPeriodId: number) {
  const conn = db();
  const mp = conn
    .prepare(
      `SELECT mp.*, rp.label AS period_label, rp.period_start, rp.period_end, rp.id AS report_period_id
         FROM meeting_periods mp JOIN report_periods rp ON rp.id = mp.report_period_id WHERE mp.id = ?`,
    )
    .get(meetingPeriodId) as any;
  if (!mp) throw notFound('Không tìm thấy kỳ họp');
  require_(p, PERMISSIONS.MEETING_VIEW, { scopeLevel: true }, 'Bạn không có quyền xem cuộc họp.');

  const scope = viewScope(p, PERMISSIONS.MEETING_VIEW);
  const reports = branchReportGrid(p, mp.report_period_id);

  const agenda = conn
    .prepare('SELECT * FROM meeting_agenda_items WHERE meeting_period_id = ? ORDER BY seq')
    .all(meetingPeriodId) as any[];

  const issues = conn
    .prepare(
      `SELECT i.id, i.code, i.title, i.status, i.risk_level, i.branch_id, b.name AS branch_name,
              u.full_name AS owner_name
         FROM issue_meeting_links l JOIN issues i ON i.id = l.issue_id
         LEFT JOIN branches b ON b.id = i.branch_id
         LEFT JOIN users u ON u.id = i.owner_user_id
        WHERE l.meeting_period_id = ? ORDER BY i.id`,
    )
    .all(meetingPeriodId) as any[];

  const decisions = conn
    .prepare(
      `SELECT d.*, i.code AS issue_code, i.title AS issue_title, u.full_name AS decided_by_name
         FROM meeting_decisions d LEFT JOIN issues i ON i.id = d.issue_id
         LEFT JOIN users u ON u.id = d.decided_by
        WHERE d.meeting_period_id = ? ORDER BY d.id`,
    )
    .all(meetingPeriodId) as any[];

  const newTasks = conn
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, i.code AS issue_code FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN issues i ON i.id = t.issue_id
        WHERE t.source_meeting_period_id = ? ORDER BY t.id`,
    )
    .all(meetingPeriodId) as any[];

  // Carry-over: task từ các kỳ trước còn chưa hoàn thành — truy vấn theo ID gốc.
  const priorPeriods = conn
    .prepare(
      `SELECT mp2.id FROM meeting_periods mp2 JOIN report_periods rp2 ON rp2.id = mp2.report_period_id
        WHERE rp2.period_start < ?`,
    )
    .all(mp.period_start) as any[];
  const priorIds = priorPeriods.map((r) => r.id);
  const carryOver = priorIds.length
    ? (conn
        .prepare(
          `SELECT t.*, u.full_name AS assignee_name, mp3.label AS origin_meeting, i.code AS issue_code
             FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
             LEFT JOIN meeting_periods mp3 ON mp3.id = t.source_meeting_period_id
             LEFT JOIN issues i ON i.id = t.issue_id
            WHERE t.source_meeting_period_id IN (${priorIds.map(() => '?').join(',')})
              AND t.status != 'completed'
            ORDER BY CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END, t.deadline`,
        )
        .all(...priorIds) as any[])
    : [];

  // Việc đã hoàn thành từ kỳ trước vẫn tra được trong lịch sử kỳ đó.
  const completedPrior = priorIds.length
    ? (conn
        .prepare(
          `SELECT t.id, t.code, t.title, t.completed_at, mp3.label AS origin_meeting
             FROM tasks t LEFT JOIN meeting_periods mp3 ON mp3.id = t.source_meeting_period_id
            WHERE t.source_meeting_period_id IN (${priorIds.map(() => '?').join(',')}) AND t.status = 'completed'
            ORDER BY t.completed_at DESC LIMIT 20`,
        )
        .all(...priorIds) as any[])
    : [];

  const inScope = (branchId: number | null) =>
    scope.all || branchId == null || scope.branchIds.includes(branchId);

  const mapTask = (t: any, carried = false) => ({
    id: t.id, code: t.code, title: t.title, status: t.status, deadline: t.deadline,
    originalDeadline: t.original_deadline, deadlineState: deadlineState(t),
    assigneeName: t.assignee_name, createdAt: t.created_at, issueCode: t.issue_code,
    originMeeting: t.origin_meeting ?? mp.label, carriedOver: carried,
    branchId: t.branch_id, pausedReason: t.paused_reason,
  });

  return {
    id: mp.id, label: mp.label, meetingDate: mp.meeting_date, status: mp.status, note: mp.note,
    reportPeriodId: mp.report_period_id, periodLabel: mp.period_label,
    periodStart: mp.period_start, periodEnd: mp.period_end,
    reports: reports.units,
    reportCategories: reports.categories,
    agenda,
    issues: issues.filter((i) => inScope(i.branch_id)),
    decisions: decisions.map((d) => ({
      id: d.id, decision: d.decision, note: d.note, issueId: d.issue_id,
      issueCode: d.issue_code, issueTitle: d.issue_title, decidedByName: d.decided_by_name, createdAt: d.created_at,
    })),
    newTasks: newTasks.filter((t) => inScope(t.branch_id)).map((t) => mapTask(t, false)),
    carryOverTasks: carryOver.filter((t) => inScope(t.branch_id)).map((t) => mapTask(t, true)),
    completedPriorTasks: completedPrior,
    canManage: can(p, PERMISSIONS.MEETING_MANAGE, { scopeLevel: true }),
  };
}

export function addDecision(p: Principal, meetingPeriodId: number, input: { decision: string; note?: string; issueId?: number }) {
  require_(p, PERMISSIONS.MEETING_MANAGE, { scopeLevel: true }, 'Bạn không có quyền ghi quyết định cuộc họp.');
  if (!input.decision?.trim()) throw badRequest('Nội dung quyết định không được để trống.');
  return tx(() => {
    const conn = db();
    const info = conn
      .prepare('INSERT INTO meeting_decisions (meeting_period_id, issue_id, decision, note, decided_by, created_at) VALUES (?,?,?,?,?,?)')
      .run(meetingPeriodId, input.issueId ?? null, input.decision.trim(), input.note ?? null, p.userId, nowIso());
    if (input.issueId) {
      conn.prepare('INSERT OR IGNORE INTO issue_meeting_links (issue_id, meeting_period_id) VALUES (?,?)').run(input.issueId, meetingPeriodId);
      conn.prepare(`UPDATE issues SET status = CASE WHEN status = 'open' THEN 'discussing' ELSE status END, updated_at = ? WHERE id = ?`)
        .run(nowIso(), input.issueId);
    }
    const id = Number(info.lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'meeting.decision.create', entityType: 'meeting_period',
      entityId: meetingPeriodId, entityLabel: input.decision.slice(0, 80), after: { decisionId: id },
    });
    return conn.prepare('SELECT * FROM meeting_decisions WHERE id = ?').get(id);
  });
}

export function linkIssueToMeeting(p: Principal, meetingPeriodId: number, issueId: number) {
  require_(p, PERMISSIONS.MEETING_MANAGE, { scopeLevel: true });
  db().prepare('INSERT OR IGNORE INTO issue_meeting_links (issue_id, meeting_period_id) VALUES (?,?)').run(issueId, meetingPeriodId);
  writeAudit({
    actorUserId: p.userId, action: 'meeting.issue.link', entityType: 'meeting_period',
    entityId: meetingPeriodId, after: { issueId },
  });
}

export function addAgendaItem(p: Principal, meetingPeriodId: number, title: string, note?: string) {
  require_(p, PERMISSIONS.MEETING_MANAGE, { scopeLevel: true });
  if (!title?.trim()) throw badRequest('Tiêu đề mục họp không được để trống.');
  const seq = ((db().prepare('SELECT MAX(seq) AS m FROM meeting_agenda_items WHERE meeting_period_id = ?').get(meetingPeriodId) as any)?.m ?? 0) + 1;
  const info = db()
    .prepare('INSERT INTO meeting_agenda_items (meeting_period_id, seq, title, note, created_by, created_at) VALUES (?,?,?,?,?,?)')
    .run(meetingPeriodId, seq, title.trim(), note ?? null, p.userId, nowIso());
  return Number(info.lastInsertRowid);
}

export function currentMeetingPeriod(): any {
  const today = demoToday();
  const conn = db();
  const active = conn
    .prepare(
      `SELECT mp.* FROM meeting_periods mp JOIN report_periods rp ON rp.id = mp.report_period_id
        WHERE rp.period_start <= ? AND rp.period_end >= ? LIMIT 1`,
    )
    .get(today, today) as any;
  if (active) return active;
  return conn.prepare('SELECT * FROM meeting_periods ORDER BY meeting_date DESC LIMIT 1').get() as any;
}
