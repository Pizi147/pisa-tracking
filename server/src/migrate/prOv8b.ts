/**
 * PR-OV8b (chủ SP 13/10): quyền hẹp `student.edit_more` (Target, ghi chú, Tạm dừng / Quay lại / Thôi học, kết quả thi thật) cho vai TVV và CX.
 * Quyền MỚI → `migratePermissions` (chạy trước) đã thêm dòng quyền và cấp đúng vai theo `ROLE_PERMISSIONS`. Bước này chỉ tự kiểm (mẫu `prOv2`):
 * dòng quyền còn thiếu thì thêm + cấp TVV, CX. Đã có dòng quyền thì KHÔNG đụng — Quản trị gỡ ô ở màn Vai trò thì deploy sau không tự cấp lại.
 * Chạy lại không đổi gì; không nới quyền vai khác.
 */
import { PERMISSIONS, PERMISSION_LABEL } from '../../../shared/domain/index.ts';

const VAI = ['consultant', 'cx'] as const;

export function migratePrOv8b(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!coBang('role_permissions') || !coBang('permissions') || !coBang('roles')) return;
  const key = PERMISSIONS.STUDENT_EDIT_MORE;
  if (conn.prepare('SELECT 1 FROM permissions WHERE key = ?').get(key)) return;
  const pid = Number(conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, PERMISSION_LABEL[key]).lastInsertRowid);
  const cap: string[] = [];
  for (const k of VAI) {
    const vai = conn.prepare('SELECT id FROM roles WHERE key = ?').get(k) as any;
    if (!vai) continue;
    conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vai.id, pid);
    cap.push(k);
  }
  applied.push(`PR-OV8b: thêm quyền ${key}${cap.length ? ` cho vai ${cap.join(', ')}` : ''}.`);
}
