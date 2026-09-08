import { db } from '../db.ts';
import { nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';

export type AuditInput = {
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  entityLabel?: string | null;
  branchId?: number | null;
  studentId?: number | null;
  before?: unknown;
  after?: unknown;
  /** 'restricted' = chỉ người có quyền xem nội bộ mới thấy before/after. */
  sensitivity?: 'normal' | 'restricted';
};

export function writeAudit(input: AuditInput) {
  db()
    .prepare(
      `INSERT INTO audit_logs
        (actor_user_id, action, entity_type, entity_id, entity_label, branch_id, student_id,
         before_json, after_json, sensitivity, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      input.actorUserId,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.entityLabel ?? null,
      input.branchId ?? null,
      input.studentId ?? null,
      input.before === undefined ? null : JSON.stringify(input.before),
      input.after === undefined ? null : JSON.stringify(input.after),
      input.sensitivity ?? 'normal',
      nowIso(),
    );
}

export function addJourneyEvent(e: {
  studentId: number;
  enrollmentId?: number | null;
  eventType: string;
  eventDate: string;
  title: string;
  detail?: string | null;
  refTable?: string | null;
  refId?: number | null;
  visibility?: 'shared' | 'internal';
  createdBy?: number | null;
}) {
  const info = db()
    .prepare(
      `INSERT INTO journey_events
        (student_id, enrollment_id, event_type, event_date, title, detail, ref_table, ref_id, visibility, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      e.studentId, e.enrollmentId ?? null, e.eventType, e.eventDate, e.title,
      e.detail ?? null, e.refTable ?? null, e.refId ?? null,
      e.visibility ?? 'shared', e.createdBy ?? null, nowIso(),
    );
  return Number(info.lastInsertRowid);
}

/** Thông báo có dedup theo (user, dedup_key): render lại không tạo bản sao. */
export function notify(n: {
  userId: number;
  kind: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  source?: string | null;
  dedupKey: string;
}) {
  db()
    .prepare(
      `INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, source, dedup_key, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body`,
    )
    .run(n.userId, n.kind, n.title, n.body ?? null, n.entityType ?? null, n.entityId ?? null, n.source ?? null, n.dedupKey, nowIso());
}

/** Audit đã lọc theo quyền của người xem: không có quyền nội bộ thì không thấy before/after. */
export function auditForEntity(p: Principal, entityType: string, entityId: number, canSeeDetail: boolean) {
  const rows = db()
    .prepare(
      `SELECT a.*, u.full_name AS actor_name FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.entity_type = ? AND a.entity_id = ? ORDER BY a.id DESC LIMIT 50`,
    )
    .all(entityType, entityId) as any[];
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorName: r.actor_name,
    createdAt: r.created_at,
    entityLabel: r.entity_label,
    before: canSeeDetail && r.sensitivity !== 'restricted' ? safeParse(r.before_json) : undefined,
    after: canSeeDetail && r.sensitivity !== 'restricted' ? safeParse(r.after_json) : undefined,
    redacted: !canSeeDetail || r.sensitivity === 'restricted',
  }));
}

function safeParse(s: string | null) {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}
