import { db } from '../db.ts';
import { nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';

/**
 * LỰA CHỌN HIỂN THỊ RIÊNG CỦA TỪNG NGƯỜI — bộ cột đang xem, chi nhánh xem lần cuối…
 *
 * Cố ý KHÔNG kiểm quyền: đây là sở thích của chính người đang đăng nhập với chính tài khoản
 * của họ, không phải dữ liệu nghiệp vụ. Mất hết cũng không ai sai việc gì.
 *
 * Giá trị lưu dạng chữ và đọc ra kèm giá trị mặc định — người dùng mới chưa có dòng nào thì
 * vẫn phải mở được màn hình, không phải chờ ai đó khởi tạo.
 */
export function getPref(p: Principal, key: string, fallback: string | null = null): string | null {
  if (!p.userId) return fallback;
  const row = db().prepare('SELECT value FROM user_prefs WHERE user_id = ? AND key = ?')
    .get(p.userId, key) as any;
  return row?.value ?? fallback;
}

export function setPref(p: Principal, key: string, value: string | null) {
  if (!p.userId) return { key, value };
  db()
    .prepare(
      `INSERT INTO user_prefs (user_id, key, value, updated_at) VALUES (?,?,?,?)
       ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(p.userId, key, value, nowIso());
  return { key, value };
}

export function allPrefs(p: Principal): Record<string, string> {
  if (!p.userId) return {};
  const out: Record<string, string> = {};
  for (const r of db().prepare('SELECT key, value FROM user_prefs WHERE user_id = ?').all(p.userId) as any[]) {
    if (r.value !== null) out[r.key] = r.value;
  }
  return out;
}
