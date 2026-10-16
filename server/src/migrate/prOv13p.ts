/**
 * OV-13p (chủ SP 16/10): TVV / CX tạo lớp + thêm học viên. `student.add` là quyền MỚI → `migratePermissions` (chạy trước) đã thêm dòng quyền và
 * cấp đúng vai theo `ROLE_PERMISSIONS`. Bước này, ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prQu`): `class.create` (quyền CŨ) + `student.add` cho TVV, CX,
 * và `student.add` cho MỌI vai đang có `student.edit` (kể cả vai Quản trị đã chỉnh tay) — để không ai mất quyền thêm học viên khi intake đổi kiểm.
 * Chỉ INSERT dòng role_permissions còn thiếu; Quản trị gỡ ô ở màn Vai trò thì deploy sau KHÔNG tự cấp lại.
 */
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';

export const KHOA_PR_OV13P = 'pr_ov13p_tvv_cx_tao_lop_at';

export function migratePrOv13p(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('demo_config') || !coBang('role_permissions') || !coBang('permissions') || !coBang('roles')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_OV13P)) return;
  const idQuyen = (k: string) => (conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any)?.id as number | undefined;
  const them = idQuyen(PERMISSIONS.STUDENT_ADD);
  const taoLop = idQuyen(PERMISSIONS.CLASS_CREATE);
  const sua = idQuyen(PERMISSIONS.STUDENT_EDIT);
  const cap: [number, number][] = [];
  for (const k of ['consultant', 'cx']) {
    const vai = conn.prepare('SELECT id FROM roles WHERE key = ?').get(k) as any;
    if (vai) for (const q of [taoLop, them]) if (q) cap.push([vai.id, q]);
  }
  if (sua && them) {
    for (const r of conn.prepare('SELECT role_id FROM role_permissions WHERE permission_id = ?').all(sua) as any[]) cap.push([r.role_id, them]);
  }
  let n = 0;
  for (const [vai, q] of cap) {
    if (conn.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(vai, q)) continue;
    conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vai, q);
    n += 1;
  }
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_OV13P, nowIso(), nowIso());
  if (n) applied.push(`OV-13p: ${n} lượt cấp quyền tạo lớp / thêm học viên (TVV, CX, vai có student.edit). Một lần.`);
}
