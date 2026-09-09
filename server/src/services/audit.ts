import { db } from '../db.ts';
import { nowIso } from '../util.ts';

export function writeAudit(a: {
  actorUserId: number | null; action: string; entityType: string;
  entityId?: number | null; entityLabel?: string | null; before?: unknown; after?: unknown;
}) {
  db()
    .prepare(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(a.actorUserId, a.action, a.entityType, a.entityId ?? null, a.entityLabel ?? null,
         a.before === undefined ? null : JSON.stringify(a.before),
         a.after === undefined ? null : JSON.stringify(a.after), nowIso());
}

export function addJourney(e: {
  studentId: number; eventType: string; eventDate: string; title: string;
  detail?: string | null; refTable?: string | null; refId?: number | null; createdBy?: number | null;
}) {
  const info = db()
    .prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(e.studentId, e.eventType, e.eventDate, e.title, e.detail ?? null,
         e.refTable ?? null, e.refId ?? null, e.createdBy ?? null, nowIso());
  return Number(info.lastInsertRowid);
}

/** Thông báo có dedup theo (user, dedup_key) nên render lại không tạo bản sao. */
export function notify(n: {
  userId: number; kind: string; title: string; body?: string | null;
  entityType?: string | null; entityId?: number | null; dedupKey: string;
}) {
  db()
    .prepare(
      `INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body`,
    )
    .run(n.userId, n.kind, n.title, n.body ?? null, n.entityType ?? null, n.entityId ?? null, n.dedupKey, nowIso());
}
