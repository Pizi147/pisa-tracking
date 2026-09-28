/**
 * `npm run kiem-lop-mo-coi` — CHỈ ĐỌC (T7). Lớp đang học mà không có phân công nào (tạo lớp cũ tách hai bước, bước 2 hỏng).
 * Không có biến Turso → DB cục bộ.
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { lopMoCoi } from '../migrate/prLop.ts';

console.log(`[kiem-lop-mo-coi] CHỈ ĐỌC. Database: ${DB_PATH}`);
if ((!laDbTuXa() && !fs.existsSync(DB_PATH)) || !isInitialised()) {
  console.log('[kiem-lop-mo-coi] Không có database hoặc database trống — không có gì để kiểm.');
  process.exit(0);
}
const ds = lopMoCoi(db());
console.log(`\n${ds.length} lớp đang học không có phân công`);
if (ds.length) {
  console.table(ds);
  console.log('Mỗi lớp: Quản trị mở hồ sơ lớp → ⋮ Sửa phân công, hoặc ⋮ Xoá lớp nếu tạo nhầm');
}
closeDb();
