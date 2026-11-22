/**
 * SUA-2211-B2 (chủ SP 22/11 "TVV vẫn xem được điểm test tuần"): vai `consultant` thêm `test.view` — ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prTvvPt`).
 * Chỉ XEM Lịch Test tuần (như CX): không có plan.week / điểm → mọi đường ghi vẫn 403. Quản trị gỡ lại ở màn Vai trò thì deploy sau KHÔNG cấp lại.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_TVV_TEST = 'pr_tvv_xem_test_at';

export function migratePrTvvTest(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('demo_config') || !coBang('role_permissions') || !coBang('permissions') || !coBang('roles')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_TVV_TEST)) return;
  const r = conn.prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
     SELECT r.id, p.id FROM roles r, permissions p WHERE r.key = 'consultant' AND p.key = 'test.view'`).run();
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_TVV_TEST, nowIso(), nowIso());
  if (r.changes) applied.push('SUA-2211-B2: vai TVV xem được Lịch Test tuần (thêm test.view, chỉ đọc). Một lần.');
}
