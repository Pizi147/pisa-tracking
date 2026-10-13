/**
 * KIỂM TRƯỚC OV-1b — CHỈ ĐỌC (chỉ `SELECT`): in đúng danh sách ô "-" mà migrate `prOv1b` sẽ đổi khi deploy (em · mã · lớp · lượt · ô · trước → sau),
 * để chủ sản phẩm chạy trên database bản chính TRƯỚC deploy cuối OV. Không ghi câu nào. Ô em đang chờ thi lại (OV-1e) in "→ giữ lịch thi lại W3 OCT".
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov1b`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { kiemTruocOv1b } from '../migrate/prOv1b.ts';

if (process.argv[1] && /kiemTruocOv1b\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov1b] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const ds = kiemTruocOv1b(db());
    if (!ds.length) console.log('\nKhông có ô "-" nào cần dọn.');
    else {
      const giu = ds.filter((d) => d.sau.startsWith('giữ lịch thi lại')).length;
      console.log(`\n${ds.length - giu} ô "-" sẽ đổi khi deploy (migrate prOv1b)${giu ? `, ${giu} ô em đang chờ thi lại giữ nguyên` : ''}:`);
      for (const d of ds) console.log(`  ${d.hocVien} · ${d.ma} · ${d.lop} · ${d.luot} · ${d.o}: ${d.truoc} → ${d.sau}`);
    }
  } catch (e) {
    console.error(`[kiem-truoc-ov1b] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
