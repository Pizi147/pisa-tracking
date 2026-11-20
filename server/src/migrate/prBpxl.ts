/**
 * BPXL-1 — N57 (chủ SP 20/11): vai `scheduler` (Chuyên viên Xếp lịch) + quyền của vai. CHỈ THÊM, đúng khuôn `prTu.ts`: `migratePermissions` không chèn vai mới
 * và mọi quyền của BPXL đã có sẵn (vai khác dùng) → bước này tạo vai + cấp quyền MỘT lần, khi vai chưa có. Vai đã có thì không làm gì — Quản trị gỡ ô ở màn
 * Vai trò thì deploy sau KHÔNG tự cấp lại. Chạy lặp không đổi.
 */
import { ROLES, ROLE_PERMISSIONS } from '../seed/data.ts';

export function migratePrBpxl(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('roles') || !coBang('permissions') || !coBang('role_permissions')) return;
  if (conn.prepare(`SELECT 1 FROM roles WHERE key = 'scheduler'`).get()) return;
  const roleId = Number(conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES ('scheduler', ?, 'active')")
    .run(ROLES.find((r) => r.key === 'scheduler')!.name).lastInsertRowid);
  for (const k of ROLE_PERMISSIONS.scheduler) {
    const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any;
    if (!perm) throw new Error(`BPXL-1: thiếu quyền ${k} — migratePermissions phải chạy trước.`);
    conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(roleId, perm.id);
  }
  applied.push(`BPXL-1: vai Chuyên viên Xếp lịch + ${ROLE_PERMISSIONS.scheduler.length} quyền (xếp / dời lịch MT, lịch lớp thường; chỉ xem phần còn lại).`);
}
