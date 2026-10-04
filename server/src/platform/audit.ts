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

/**
 * Ghi một sự kiện vào HÀNH TRÌNH HỌC của học viên.
 *
 * `eventDate` là NGÀY SỰ VIỆC XẢY RA, khác `created_at` là lúc ghi vào hệ thống — ghi bù
 * một buổi tuần trước thì hai mốc này khác nhau, và người đọc cần thấy mốc thứ nhất.
 *
 * `dedupKey` để lưu/thử lại nhiều lần chỉ để lại MỘT sự kiện. Không có khoá thì mỗi lần
 * bấm lưu lại thêm một dòng và hành trình biến thành nhật ký kỹ thuật.
 */
export function addJourney(e: {
  studentId: number; eventType: string; eventDate: string; title: string;
  cycleId?: number | null;
  detail?: string | null; refTable?: string | null; refId?: number | null; createdBy?: number | null;
  dedupKey?: string | null;
}) {
  const info = db()
    .prepare(
      `INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail,
                                   ref_table, ref_id, dedup_key, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       -- Chỉ số dedup là chỉ số MỘT PHẦN nên mệnh đề WHERE phải khớp đúng, nếu không
       -- SQLite không nhận đây là đích xử lý trùng.
       ON CONFLICT(dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING`,
    )
    .run(e.studentId, e.cycleId ?? null, e.eventType, e.eventDate, e.title, e.detail ?? null,
         e.refTable ?? null, e.refId ?? null, e.dedupKey ?? null, e.createdBy ?? null, nowIso());
  return Number(info.lastInsertRowid);
}

/** Thông báo có dedup theo (user, dedup_key) nên render lại không tạo bản sao. */
export function notify(n: {
  userId: number; kind: string; title: string; body?: string | null;
  entityType?: string | null; entityId?: number | null; dedupKey: string;
  /** PR-DUYET (K5-12): đường mở riêng — Nhắc trỏ đúng dòng việc. Không có thì chuông suy từ `entityType`. */
  duong?: string | null;
}) {
  db()
    .prepare(
      `INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body`,
    )
    .run(n.userId, n.kind, n.title, n.body ?? null, n.entityType ?? null, n.entityId ?? null, n.dedupKey, nowIso(), n.duong ?? null);
}

/** Quản lý của một chi nhánh (kể cả Quản lý toàn hệ thống) còn hoạt động — người nhận thông báo "để biết" (PR-QU: GVCN phân công, GV đóng Case). */
export function quanLyCuaChiNhanh(branchId: number): number[] {
  return (db().prepare(
    `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'manager' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL
        AND (ur.branch_id IS NULL OR ur.branch_id = ?)`,
  ).all(branchId) as any[]).map((r) => r.id as number);
}
