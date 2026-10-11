/**
 * BỘ DEMO PR-OV2a — một tài khoản mỗi vai mới: Admin (Cẩm Phả), Tư vấn viên (Cẩm Phả), CX (toàn hệ thống). TVV được gán 4 em đang học ở Cẩm Phả
 * (`students.consultant_user_id`) để Tổng quan "Học viên của tôi" có số; bản chính chưa gán ai cho tới OV-2b (ô chọn TVV). Tên GIẢ.
 * Dựng CUỐI seed: id người dùng cũ không đổi (DEMO.md, phép kiểm gọi theo id).
 */
import crypto from 'node:crypto';
import { DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { padCode } from '../util.ts';
import { DEMO_DATE } from './data.ts';

export function buildOv2aDemo(conn: any): { tvv: number; soHv: number } {
  const now = `${DEMO_DATE}T09:00:00.000Z`;
  const cp = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
  const taiKhoan = (ten: string, email: string, title: string, vai: string, branchId: number | null) => {
    const n = (conn.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM users').get() as any).n as number;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    const id = Number(conn.prepare(
      `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, approval_state, status, created_at)
       VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`).run(padCode('NV', n, 3), ten, `${email}${EMAIL_SUFFIX}`, title, hash, salt, now).lastInsertRowid);
    const roleId = (conn.prepare('SELECT id FROM roles WHERE key = ?').get(vai) as any).id as number;
    conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)').run(id, roleId, branchId, 'active', now);
    return id;
  };
  taiKhoan('Đào Minh Ngọc', 'ngoc.dao', 'Admin Cẩm Phả', 'office_admin', cp);
  const tvv = taiKhoan('Nguyễn Thu Hương', 'huong.nguyen', 'Tư vấn viên Cẩm Phả', 'consultant', cp);
  taiKhoan('Vũ Thanh Tâm', 'tam.vu', 'CX', 'cx', null);
  /* Bốn trong năm em đang học ở Cẩm Phả (bộ demo chỉ có CP FT 110) — để "HV của tôi" và "Chi nhánh" khác nhau. */
  const em = (conn.prepare(
    `SELECT DISTINCT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
      WHERE c.branch_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY c.is_fast_track DESC, s.id`,
  ).all(cp) as any[]).slice(0, 4);
  for (const r of em) conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv, r.id);
  return { tvv, soHv: em.length };
}
