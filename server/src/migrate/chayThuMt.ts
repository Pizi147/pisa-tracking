/**
 * `npm run chay-thu:mt` — CHẠY THỬ CHỈ ĐỌC trước bước migrate của PR-MT (K5-22, K5-67, K4-09 phần báo).
 *
 * Mở cùng database như `migrate/run.ts` nhưng KHÔNG gọi `migrate()` và không ghi gì. Không đọc cột `lich_su` nên chạy được cả trước
 * migrate. In: (1) cột `lich_su` đã có chưa · (2) em FT đang học chưa có lượt MT nào · (3) em FT thiếu tuần bắt đầu (không lập được
 * lịch MT mặc định) · (4) lộ trình nhảy số · (5) lượt huỷ ở giữa (kiểu cũ).
 * Planning 29/09: bỏ lệnh `bo-sung-mt-mac-dinh` (database reset trước deploy) nên không in danh sách bổ sung.
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { lotrinhNhaySo, luotHuyGiua } from './prMt.ts';

const bang = (rows: any[]) => { if (rows.length) console.table(rows); else console.log('    (không có)'); };

console.log(`[chay-thu:mt] CHỈ ĐỌC — không nâng cấp, không ghi. Database: ${DB_PATH}`);

if (!laDbTuXa() && !fs.existsSync(DB_PATH)) {
  console.log('[chay-thu:mt] Không có file database ở đường dẫn trên — không có gì để chạy thử.');
  process.exit(0);
}
if (!isInitialised()) {
  console.log('[chay-thu:mt] Database chưa có bảng nào — không có gì để chạy thử.');
  closeDb();
  process.exit(0);
}

const conn = db();
const coCot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[]).some((c) => c.name === 'lich_su');
console.log(`\n(1) Cột assessment_attempts.lich_su: ${coCot ? 'đã có' : 'CHƯA có — migrate sẽ thêm (dữ liệu cũ = lượt thường)'}`);

const emFt = `SELECT s.student_code AS "Mã HV", s.full_name AS "Tên", cy.route AS "Lộ trình",
       (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
         WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS "Lớp"
  FROM learning_cycles cy JOIN students s ON s.id = cy.student_id
 WHERE cy.status = 'active' AND cy.route IS NOT NULL AND s.status = 'active'`;

const khongLuot = conn.prepare(`${emFt} AND NOT EXISTS (SELECT 1 FROM assessment_attempts a
  WHERE a.cycle_id = cy.id AND a.kind = 'mock' AND a.status != 'cancelled') ORDER BY s.student_code`).all() as any[];
console.log(`\n(2) ${khongLuot.length} em FT đang học chưa có lượt MT nào (sau PR-MT, Thêm HV tự tạo — danh sách này nên rỗng)`);
bang(khongLuot);

const thieuTuan = conn.prepare(`${emFt} AND cy.start_period_id IS NULL ORDER BY s.student_code`).all() as any[];
console.log(`\n(3) ${thieuTuan.length} em FT thiếu tuần bắt đầu — không lập được lịch MT mặc định`);
bang(thieuTuan);

const nhay = lotrinhNhaySo(conn);
console.log(`\n(4) ${nhay.length} lộ trình có số MT không liền mạch (tạo trước chốt đánh số)`);
bang(nhay);

const huy = luotHuyGiua(conn);
console.log(`\n(5) ${huy.length} lượt đã huỷ ở giữa lộ trình (kiểu cũ — nay chỉ huỷ cả lượt được với MT cuối cùng của lộ trình)`);
bang(huy);

console.log('\n[chay-thu:mt] Xong — database không bị đổi.');
closeDb();
