/**
 * `npm run chay-thu:lop` — CHẠY THỬ CHỈ ĐỌC trước bước migrate của PR-LOP (T2, T7, K5-68).
 *
 * Mở cùng database như `migrate/run.ts` (`db()`: file cục bộ, hoặc Turso khi có TURSO_DATABASE_URL) nhưng KHÔNG gọi `migrate()` và
 * không ghi gì — chỉ SELECT. Không đọc cột mới (`so_tuan`…) nên chạy được cả trước migrate. In 5 bảng:
 *   (1) lớp sẽ đổi tên cũ → mới · (2) va chạm (giữ tên) · (3) không theo mẫu (giữ tên) · (4) lớp không phân công (T7) ·
 *   (5) lớp FT có em ở lộ trình khác lộ trình lớp (chuẩn bị K5-60).
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { keHoachDoiTenLop, lopFtLechLoTrinh, lopMoCoi } from './prLop.ts';

const LY_DO: Record<string, string> = {
  'khong-tien-to': 'không có mã chi nhánh đầu tên',
  'khong-theo-mau': 'phần sau không phải kiểu + số',
  'lech-chuong-trinh': 'tên nói kiểu khác chương trình của lớp',
};
const bang = (rows: any[]) => { if (rows.length) console.table(rows); else console.log('    (không có)'); };

console.log(`[chay-thu:lop] CHỈ ĐỌC — không nâng cấp, không ghi. Database: ${DB_PATH}`);

/* File cục bộ chưa có thì db() sẽ TẠO file rỗng — chạy thử không được để lại dấu vết, nên dừng trước khi mở. */
if (!laDbTuXa() && !fs.existsSync(DB_PATH)) {
  console.log('[chay-thu:lop] Không có file database ở đường dẫn trên — không có gì để chạy thử.');
  process.exit(0);
}
if (!isInitialised()) {
  console.log('[chay-thu:lop] Database chưa có bảng nào — không có gì để chạy thử.');
  closeDb();
  process.exit(0);
}

const conn = db();
const kh = keHoachDoiTenLop(conn);

console.log(`\n(1) ${kh.doi.length} lớp sẽ đổi tên`);
bang(kh.doi.map((x) => ({ 'cũ → mới': `${x.cu} → ${x.moi}` })));

console.log(`\n(2) ${kh.vaCham.length} lớp va chạm (trùng khi bỏ "-", khoảng trắng, hoa/thường) — giữ nguyên tên, chưa khoá trùng`);
bang(kh.vaCham.map((x) => ({ 'cũ': x.cu, 'trùng với': x.trungVoi })));

console.log(`\n(3) ${kh.khongTheoMau.length} lớp không theo mẫu — giữ nguyên tên`);
bang(kh.khongTheoMau.map((x) => ({ 'cũ': x.cu, 'lý do': LY_DO[x.lyDo] ?? x.lyDo })));

const coi = lopMoCoi(conn);
console.log(`\n(4) ${coi.length} lớp đang học không có phân công (T7)`);
bang(coi);

const lech = lopFtLechLoTrinh(conn);
console.log(`\n(5) ${lech.length} dòng lớp FT có em đang ở lộ trình khác lộ trình lớp`);
bang(lech);

console.log('\n[chay-thu:lop] Xong — database không bị đổi.');
closeDb();
