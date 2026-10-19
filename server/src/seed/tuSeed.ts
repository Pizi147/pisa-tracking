/**
 * BỘ DEMO TU-a (đặc tả Tutor mục 9): danh sách 8 tutor ở 4 chi nhánh + 1 Chỉ online + 1 thiếu SĐT / nơi dạy (dựng TRƯỚC bộ demo ghi kết quả PA Tutor —
 * pb2b, duyệt — để buổi trỏ được tutor); tài khoản Head tutor toàn hệ thống + 1 kết luận "Ngừng hợp tác" (dựng CUỐI: id người dùng cũ không đổi).
 * Tên, SĐT GIẢ. "Ms Mai", "Mr Long" của pb2b / duyệt cố ý là tên gõ tay (chưa có trong danh sách — TU-b gộp).
 */
import crypto from 'node:crypto';
import { DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { padCode } from '../util.ts';
import { DEMO_DATE } from './data.ts';

const NOW = `${DEMO_DATE}T08:00:00.000Z`;
/** [tên, SĐT, mã chi nhánh | 'online' | null, kỹ năng] */
const TUTORS: [string, string | null, string | null, string][] = [
  ['Nguyễn Thu Lan', '0912345908', 'MB', 'L,R'],
  ['Phạm Đức Long', '0983220117', 'MB', 'L,S'],
  ['Vũ Thanh Hằng', '0904556231', 'MB', 'W1,W2'],
  ['Lê Lan Hương', '0936118115', 'BC', 'W1,W2,S'],
  ['Trần Mai Anh', '0912345678', 'CP', 'R,W1,W2'],
  ['Đặng Thu Hà', '0977402553', 'HD', 'L,R'],
  ['Hồ Ngọc Lan', '0965771442', 'online', 'R'],
  ['Bùi Quang Minh', null, null, 'S'],
];

export function buildTutorDs(conn: any, adminId: number): void {
  const cn = new Map((conn.prepare('SELECT id, code FROM branches').all() as any[]).map((b) => [b.code as string, b.id as number]));
  for (const [ten, sdt, noi, kn] of TUTORS) {
    conn.prepare(`INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by) VALUES (?,?,?,?,?,?,?)`)
      .run(ten, sdt, noi && noi !== 'online' ? cn.get(noi)! : null, noi === 'online' ? 1 : 0, kn, NOW, adminId);
  }
}

export const idTutor = (conn: any, ten: string): number => (conn.prepare('SELECT id FROM tutors WHERE ten = ?').get(ten) as any).id;

/** Head tutor (toàn hệ thống) + kết luận "Ngừng hợp tác" về Đặng Thu Hà (bỏ khỏi ô chọn tutor). CUỐI seed. */
export function buildHeadTutor(conn: any): number {
  const n = (conn.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM users').get() as any).n as number;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
  const id = Number(conn.prepare(
    `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, approval_state, status, created_at)
     VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`).run(padCode('NV', n, 3), 'Hoàng Thị Hà', `ha.hoang${EMAIL_SUFFIX}`, 'Head tutor', hash, salt, NOW).lastInsertRowid);
  const roleId = (conn.prepare(`SELECT id FROM roles WHERE key = 'head_tutor'`).get() as any).id as number;
  conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,NULL,'active',?)`).run(id, roleId, NOW);
  conn.prepare(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?, 'ngung', ?, ?, ?)`)
    .run(idTutor(conn, 'Đặng Thu Hà'), 'Ba buổi liền không gửi feedback, đã nhắc hai lần — dừng hợp tác từ tháng 9.', id, `${DEMO_DATE}T02:00:00.000Z`);
  return id;
}
