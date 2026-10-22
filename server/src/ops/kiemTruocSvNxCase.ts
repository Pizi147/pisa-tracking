/**
 * KIỂM TRƯỚC SV-NX-CASE — CHỈ ĐỌC (chỉ `SELECT`): in đúng danh sách migrate `prSvNxCase` sẽ đụng khi deploy (Case MT gắn nguồn mô tả — nội dung giữ
 * nguyên; ô S chấm chéo: hạ cờ / thành việc Xác nhận Case / chờ Case). Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-sv-nx-case`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { kiemTruocSvNxCase } from '../migrate/prSvNxCase.ts';

if (process.argv[1] && /kiemTruocSvNxCase\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-sv-nx-case] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const ds = kiemTruocSvNxCase(db());
    if (!ds.length) console.log('\nKhông có dòng nào cần đổi.');
    else {
      for (const p of ['A', 'B-ha-co', 'B-xac-nhan-case', 'B-chua-co-case'] as const) console.log(`  ${p}: ${ds.filter((d) => d.phan === p).length}`);
      for (const d of ds) console.log(`  [${d.phan}] #${d.id} · ${d.hocVien} · ${d.luot}: ${d.ghi}`);
    }
  } catch (e) {
    console.error(`[kiem-truoc-sv-nx-case] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
