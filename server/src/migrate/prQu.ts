/**
 * PR-QU (chủ sản phẩm 04/10): giáo viên được đóng Case của môn mình phụ trách → cấp `case.close` cho vai `teacher` (quyền CŨ, nên
 * `migratePermissions` không tự cấp — nó chỉ cấp quyền VỪA THÊM). Chạy ĐÚNG MỘT LẦN, đánh dấu bằng khoá `demo_config` (cùng mẫu
 * `migrateXoaDuLieu`): Quản trị gỡ ô này ở màn Vai trò thì lần deploy sau KHÔNG tự cấp lại. Chỉ INSERT, không xoá, không đổi dòng cũ.
 * (`class.create` cho Quản lý + Quản trị là quyền MỚI → `migratePermissions` đã cấp đúng vai theo `ROLE_PERMISSIONS`.)
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_QU_CASE_CLOSE = 'pr_qu_case_close_gv_at';

export function migratePrQu(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('demo_config') || !coBang('role_permissions')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_QU_CASE_CLOSE)) return;
  const vai = conn.prepare("SELECT id FROM roles WHERE key = 'teacher'").get() as any;
  const quyen = conn.prepare("SELECT id FROM permissions WHERE key = 'case.close'").get() as any;
  let cap = 0;
  if (vai && quyen && !conn.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(vai.id, quyen.id)) {
    conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vai.id, quyen.id);
    cap = 1;
  }
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_QU_CASE_CLOSE, nowIso(), nowIso());
  if (cap) applied.push('PR-QU: cấp quyền đóng Case cho vai Giáo viên (siết theo môn phụ trách / GVCN). Một lần.');
}
