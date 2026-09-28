/**
 * KIỂM SAU KHI XOÁ (PR-XOA, Task 8 của kế hoạch) — CHỈ ĐỌC. Session deploy chạy lệnh này trước và sau MỖI bước dọn dữ liệu thử trên
 * bản chính rồi dán kết quả vào nhật ký. Không ghi gì: chỉ `prepare(...).all/get`.
 *
 * In: (1) 3 học viên thử PISA-000001..3 · (2) lớp thử MB FT THU 01 (so chuẩn hoá: đổi tên hay chưa đều thấy) · (3) mọi tài khoản · (4) PRAGMA foreign_key_check · (5) tệp mồ côi
 * (attachments trỏ bản ghi chủ không còn) · (6) migrate PR-XOA đã chạy chưa (cột users.deleted_at).
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §11.1) rồi `npm run kiem-sau-xoa`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, db } from '../db.ts';
import { chuanHoaMaLop, khoaMaLopSql } from '../../../shared/domain/index.ts';

const conn = db();
console.log(`[kiem-sau-xoa] Database: ${DB_PATH}`);

const HV_THU = ['PISA-000001', 'PISA-000002', 'PISA-000003'];
const LOP_THU = 'MB FT THU 01';
/* So chuẩn hoá (bỏ `-`, khoảng trắng, hoa/thường): tên cũ `MB-FT THU 01` hay tên mới đều ra. */
const LOP_THU_CHUAN = chuanHoaMaLop(LOP_THU);

console.log('\n(1) Học viên thử');
const hv = conn.prepare(
  `SELECT s.id, s.student_code AS ma, s.full_name AS ten, s.status, s.archived_at,
          (SELECT group_concat(c.code, ', ') FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id) AS lop
     FROM students s WHERE s.student_code IN (?, ?, ?) ORDER BY s.student_code`,
).all(...HV_THU) as any[];
if (hv.length) console.table(hv); else console.log('  không còn em nào');

console.log(`\n(2) Lớp ${LOP_THU}`);
const lop = conn.prepare(
  `SELECT c.id, c.code, c.status, c.finished_at,
          (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS so_ghi_danh
     FROM classes c WHERE ${khoaMaLopSql('c.code')} = ?`,
).all(LOP_THU_CHUAN) as any[];
if (lop.length) console.table(lop); else console.log('  không còn lớp');

console.log('\n(3) Tài khoản');
const coCotXoa = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('users') as any[]).some((c) => c.name === 'deleted_at');
console.table(conn.prepare(
  `SELECT id, full_name, email, status, ${coCotXoa ? 'deleted_at' : 'NULL AS deleted_at'} FROM users ORDER BY id`,
).all());

console.log('\n(4) PRAGMA foreign_key_check');
const fk = conn.prepare('PRAGMA foreign_key_check').all() as any[];
console.log(`  foreign_key_check: ${fk.length}`);
if (fk.length) console.table(fk.slice(0, 20));

console.log('\n(5) Tệp mồ côi (attachments trỏ bản ghi chủ không còn)');
const CHU: [string, string][] = [
  ['sos_case', 'sos_cases'], ['case_intervention', 'case_interventions'], ['violation', 'violations'],
  ['discipline_measure', 'discipline_measures'], ['sos_coordination_action', 'sos_coordination_actions'], ['unit_report', 'unit_reports'],
];
let moCoi = 0;
for (const [loai, bang] of CHU) {
  const n = (conn.prepare(
    `SELECT COUNT(*) AS n FROM attachments a WHERE a.owner_type = ? AND NOT EXISTS (SELECT 1 FROM ${bang} x WHERE x.id = a.owner_id)`,
  ).get(loai) as any).n as number;
  moCoi += n;
  if (n) console.log(`  ${loai}: ${n}`);
}
console.log(`  tệp mồ côi: ${moCoi}`);

console.log('\n(6) Migrate PR-XOA');
console.log(`  deleted_at: ${coCotXoa ? 'có' : 'CHƯA — chạy migrate trước'}`);
