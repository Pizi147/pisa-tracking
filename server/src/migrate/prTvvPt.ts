/**
 * SUA-2211-B (chủ SP 22/11 ý 14 "TVV không để xem phân tích đâu nhé"): vai `consultant` gỡ `analysis.view` — ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prCxN52`).
 * Vai kiêm khác (CX, Head…) giữ quyền theo vai đó (quyền gắn theo vai). Quản trị cấp lại ở màn Vai trò thì deploy sau KHÔNG tự gỡ nữa.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_TVV_PT = 'pr_tvv_bo_phan_tich_at';

export function migratePrTvvPt(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('demo_config') || !coBang('role_permissions') || !coBang('permissions') || !coBang('roles')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_TVV_PT)) return;
  const r = conn.prepare(`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE key = 'consultant')
     AND permission_id IN (SELECT id FROM permissions WHERE key = 'analysis.view')`).run();
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_TVV_PT, nowIso(), nowIso());
  if (r.changes) applied.push('SUA-2211-B: vai TVV không còn xem Phân tích (gỡ analysis.view). Một lần.');
}
