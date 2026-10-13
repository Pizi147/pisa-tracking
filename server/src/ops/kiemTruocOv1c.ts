/**
 * KIỂM TRƯỚC OV-1c — CHỈ ĐỌC (chỉ `SELECT`): in đúng danh sách Case SOS MT mà migrate `prOv1c` sẽ đóng / ghi mốc khi deploy
 * (em · mã · lớp · lượt · Case · việc), để chủ sản phẩm chạy trên database bản chính TRƯỚC deploy cuối OV. Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov1c`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { kiemTruocOv1c } from '../migrate/prOv1c.ts';

if (process.argv[1] && /kiemTruocOv1c\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov1c] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const ds = kiemTruocOv1c(db());
    if (!ds.length) console.log('\nKhông có Case SOS MT nào cần dọn.');
    else {
      console.log(`\n${ds.length} Case SOS MT sẽ đổi khi deploy (migrate prOv1c):`);
      for (const d of ds) console.log(`  ${d.hocVien} · ${d.ma} · ${d.lop} · ${d.luot} · ${d.case}: ${d.viec}`);
    }
  } catch (e) {
    console.error(`[kiem-truoc-ov1c] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
