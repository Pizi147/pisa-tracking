/**
 * KIỂM TRƯỚC OV-13a — CHỈ ĐỌC (chỉ `SELECT`): đếm đúng những gì migrate `prOv13a` sẽ đổi khi deploy — (a) Case "Chờ chốt SOS" cũ chưa ai đụng sẽ xoá
 * (in từng Case) · (b) PA "đến lúc thi" chưa có ngày thi → mốc MT cuối · (c) PA quy chế kỹ năng đã đạt → Kết quả cuối · (e) Case tạm cho lượt chưa chốt;
 * kèm (d) prOv1c còn chạy lần cuối không. Chủ sản phẩm chạy trên database bản chính TRƯỚC deploy. Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov13a`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { KHOA_PR_OV1C, kiemTruocOv13a } from '../migrate/prOv13a.ts';
import { kiemTruocOv1c } from '../migrate/prOv1c.ts';

if (process.argv[1] && /kiemTruocOv13a\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov13a] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const conn = db();
    const r = kiemTruocOv13a(conn);
    console.log(`\n(a) ${r.xoaChoChot.length} Case "Chờ chốt SOS" cũ chưa ai đụng sẽ XOÁ HẲN`);
    for (const d of r.dongXoa) console.log(`    ${d}`);
    console.log(`(b) ${r.mocMtCuoi.length} PA "đến lúc thi" chưa có ngày thi → mốc MT cuối của lộ trình`);
    console.log(`(c) ${r.ketQuaCuoi.length} PA quy chế mà kỹ năng đã đạt → "Kết quả cuối"`);
    console.log(`(e) ${r.caseTam.length} Case tạm cho lượt Mock Test chưa chốt`);
    const ov1c = conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_OV1C) ? null : kiemTruocOv1c(conn);
    console.log(ov1c === null ? '(d) prOv1c đã khoá — không chạy nữa' : `(d) prOv1c chạy LẦN CUỐI rồi khoá: ${ov1c.length} Case sẽ đổi (kiem-truoc-ov1c để xem từng Case)`);
  } catch (e) {
    console.error(`[kiem-truoc-ov13a] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
