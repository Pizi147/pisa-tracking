/**
 * KIỂM TRƯỚC OV-13n — CHỈ ĐỌC (chỉ `SELECT`): đếm số việc "Trao đổi ngắn với HV" điền sẵn chưa làm của lượt SOS 2–3 mà migrate `prOv13n` sẽ bỏ,
 * theo chi nhánh. Chủ sản phẩm chạy trên database bản chính TRƯỚC deploy. Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov13n`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { kiemTruocOv13n } from '../migrate/prOv13n.ts';

if (process.argv[1] && /kiemTruocOv13n\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov13n] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const dem = kiemTruocOv13n(db());
    const tong = Object.values(dem).reduce((x, y) => x + y, 0);
    console.log(`\n${tong} việc "Trao đổi ngắn với HV" (điền sẵn, chưa làm, lượt SOS 2–3) sẽ BỎ`);
    for (const [cn, n] of Object.entries(dem)) console.log(`    ${cn}: ${n}`);
  } catch (e) {
    console.error(`[kiem-truoc-ov13n] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
