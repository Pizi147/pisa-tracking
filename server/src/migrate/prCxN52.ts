/**
 * N52 (chủ SP 18/11): CX xem mọi thứ trong phạm vi (như Quản lý, cả phần giáo viên) + sửa phía TVV, Ý thức, lớp / chuyển lớp; không học thuật, không bị giao việc.
 * Mọi quyền dưới đây ĐÃ CÓ (vai khác dùng) → `migratePermissions` không cấp cho CX. Bước này, ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prOv13p`):
 * INSERT dòng role_permissions còn thiếu của vai `cx`. Không gỡ quyền nào; Quản trị gỡ ô ở màn Vai trò thì deploy sau KHÔNG tự cấp lại.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_CX_N52 = 'pr_cx_n52_quyen_at';
export const QUYEN_CX_N52 = [
  'class.edit', 'violation.record', 'discipline.manage', 'test.view', 'work.view', 'analysis.view_teacher', 'discipline.stats', 'meeting.view',
] as const;

export function migratePrCxN52(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('demo_config') || !coBang('role_permissions') || !coBang('permissions') || !coBang('roles')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_CX_N52)) return;
  const vai = conn.prepare("SELECT id FROM roles WHERE key = 'cx'").get() as any;
  let n = 0;
  if (vai) {
    for (const k of QUYEN_CX_N52) {
      const q = (conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any)?.id as number | undefined;
      if (!q || conn.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(vai.id, q)) continue;
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vai.id, q);
      n += 1;
    }
  }
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_CX_N52, nowIso(), nowIso());
  if (n) applied.push(`N52: ${n} quyền mới cho vai CX (xem như Quản lý, sửa phía TVV + Ý thức + lớp, không giao việc). Một lần.`);
}
