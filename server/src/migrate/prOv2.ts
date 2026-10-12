/**
 * PR-OV2a (đặc tả OV mục 2): ba vai mới + cột TVV của học viên + góc nhìn của phiên. CHỈ THÊM, tự kiểm nên chạy lặp được (lần hai không báo gì).
 * - `roles` + `role_permissions` của `office_admin`, `consultant`, `cx` khi chưa có — `migratePermissions` không chèn vai mới (nó chỉ cấp
 *   quyền mới cho vai đã có; năm quyền mới của PR này đi đường đó cho Quản trị, QL, GV theo `ROLE_PERMISSIONS`).
 * - `students.consultant_user_id` (TVV = người; `consultant_name` giữ để đọc) + index · `demo_sessions.goc_nhin`.
 * Cùng định nghĩa nằm ở `schema.sql`.
 */
import { ROLES, ROLE_PERMISSIONS } from '../seed/data.ts';

const VAI_MOI = ['office_admin', 'consultant', 'cx'] as const;

export function migratePrOv2(conn: any, applied: string[]) {
  const cot = (b: string) => new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((x) => x.name as string));
  const da: string[] = [];
  for (const key of VAI_MOI) {
    if (conn.prepare('SELECT 1 FROM roles WHERE key = ?').get(key)) continue;
    const ten = ROLES.find((r) => r.key === key)!.name;
    const roleId = Number(conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'active')").run(key, ten).lastInsertRowid);
    for (const k of ROLE_PERMISSIONS[key]) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any;
      if (!perm) throw new Error(`PR-OV2: thiếu quyền ${k} — migratePermissions phải chạy trước.`);
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(roleId, perm.id);
    }
    da.push(`vai ${ten}`);
  }
  if (!cot('students').has('consultant_user_id')) {
    conn.exec('ALTER TABLE students ADD COLUMN consultant_user_id INTEGER REFERENCES users(id)');
    da.push('students.consultant_user_id');
  }
  conn.exec('CREATE INDEX IF NOT EXISTS idx_student_consultant ON students(consultant_user_id)');
  if (!cot('demo_sessions').has('goc_nhin')) {
    conn.exec('ALTER TABLE demo_sessions ADD COLUMN goc_nhin TEXT');
    da.push('demo_sessions.goc_nhin');
  }
  if (da.length) applied.push(`PR-OV2: ${da.join(', ')}.`);
}
