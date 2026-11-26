/**
 * VAI-0 (N74–N77, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md`), chạy lặp không đổi, khớp `schema.sql`:
 *   1. Vai `branch_director` (GĐCN) + `lead_consultant` (Lead TVV) — tạo MỘT lần khi chưa có, chép quyền HIỆN TẠI của vai Head / CX trong DB (Quản trị gỡ ô
 *      ở màn Vai trò thì deploy sau không cấp lại — như `prBpxl.ts`).
 *   2. Bảng `lop_xep_lich` (CVXL nhận lớp — N77) + cột `meeting_phan.nguoi_luat` (người nhận theo luật, chốt lúc sinh — N74).
 *   3. Phần Meeting còn mở chưa có `nguoi_luat` → chốt một người theo N74 (`chotNguoiLuatMeeting`).
 */
import { ROLES } from '../seed/data.ts';
import { chotNguoiLuatMeeting } from '../worklist/giaoViec.ts';

export const BANG_LOP_XEP_LICH = `CREATE TABLE IF NOT EXISTS lop_xep_lich (
  class_id INTEGER PRIMARY KEY REFERENCES classes(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  gan_boi INTEGER REFERENCES users(id),
  gan_luc TEXT NOT NULL
)`;
export const CHI_MUC_LOP_XEP_LICH = 'CREATE INDEX IF NOT EXISTS idx_lop_xep_lich_nguoi ON lop_xep_lich(user_id)';
export const CHI_MUC_NGUOI_LUAT = `CREATE INDEX IF NOT EXISTS idx_meeting_phan_luat ON meeting_phan(nguoi_luat) WHERE trang_thai = 'mo' AND nguoi_luat IS NOT NULL`;

const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);
const coCot = (conn: any, bang: string, cot: string) => (conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot);

export function migratePrVaiMoi(conn: any, applied: string[]) {
  if (!co(conn, 'roles') || !co(conn, 'role_permissions') || !co(conn, 'meeting_phan') || !co(conn, 'classes')) return;
  const them: string[] = [];
  for (const [key, goc] of [['branch_director', 'manager'], ['lead_consultant', 'cx']] as const) {
    if (conn.prepare('SELECT 1 FROM roles WHERE key = ?').get(key)) continue;
    const ten = ROLES.find((r) => r.key === key)!.name;
    const id = Number(conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?, ?, 'active')").run(key, ten).lastInsertRowid);
    const n = conn.prepare(`INSERT INTO role_permissions (role_id, permission_id) SELECT ?, rp.permission_id FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
        WHERE r.key = ?`).run(id, goc).changes;
    them.push(`vai ${ten} (${n} quyền như ${goc === 'manager' ? 'Head' : 'CX'})`);
  }
  if (!co(conn, 'lop_xep_lich')) { conn.exec(BANG_LOP_XEP_LICH); them.push('bảng lop_xep_lich'); }
  if (!co(conn, 'idx_lop_xep_lich_nguoi')) conn.exec(CHI_MUC_LOP_XEP_LICH);
  if (!coCot(conn, 'meeting_phan', 'nguoi_luat')) { conn.exec('ALTER TABLE meeting_phan ADD COLUMN nguoi_luat INTEGER REFERENCES users(id)'); them.push('cột meeting_phan.nguoi_luat'); }
  if (!co(conn, 'idx_meeting_phan_luat')) conn.exec(CHI_MUC_NGUOI_LUAT);
  const chot = chotNguoiLuatMeeting();
  if (chot) them.push(`chốt người theo luật cho ${chot} phần Meeting đang mở`);
  if (them.length) applied.push(`VAI-0: ${them.join(', ')}.`);
}
