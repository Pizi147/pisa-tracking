import { DB_PATH, closeDb } from '../db.ts';
import { runSeed } from './seed.ts';

const force = process.argv.includes('--force');
console.log(`[seed] Đang tạo lại dữ liệu demo tại ${DB_PATH}${force ? ' (--force)' : ''}`);
const summary = runSeed();
console.log('[seed] Hoàn tất. Toàn bộ dữ liệu là dữ liệu giả.');
for (const [k, v] of Object.entries(summary)) console.log(`  - ${k}: ${v}`);
// Đóng kết nối trước khi thoát để native addon dọn dẹp gọn gàng.
closeDb();

console.log('\n[seed] Chạy `npm run dev` rồi mở http://localhost:5173');
