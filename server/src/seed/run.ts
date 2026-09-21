import { DB_PATH, closeDb, laDbTuXa } from '../db.ts';
import { runSeed } from './seed.ts';

/*
 * `npm run seed` XOÁ SẠCH database — chỉ dành cho máy dev. Đang trỏ tới Turso thì từ chối.
 * Ngoại lệ duy nhất: database THỬ, khi PISA_CHO_PHEP_SEED_TURSO có giá trị VÀ URL chứa đúng chuỗi đó
 * (ví dụ `pisa-thu-nghiem`) — không bao giờ là bản chính.
 */
const choPhep = process.env.PISA_CHO_PHEP_SEED_TURSO;
if (laDbTuXa() && !(choPhep && DB_PATH.includes(choPhep))) {
  console.error('[seed] TỪ CHỐI: đang trỏ tới Turso. `npm run seed` XOÁ SẠCH database và chỉ dùng cho máy dev.');
  process.exit(1);
}

const force = process.argv.includes('--force');
console.log(`[seed] Đang tạo lại dữ liệu demo tại ${DB_PATH}${force ? ' (--force)' : ''}`);
const summary = runSeed();
console.log('[seed] Hoàn tất. Toàn bộ dữ liệu là dữ liệu giả.');
for (const [k, v] of Object.entries(summary)) console.log(`  - ${k}: ${v}`);
// Đóng kết nối trước khi thoát để native addon dọn dẹp gọn gàng.
closeDb();

console.log('\n[seed] Chạy `npm run dev` rồi mở http://localhost:5173');
