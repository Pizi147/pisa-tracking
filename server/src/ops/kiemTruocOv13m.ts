/**
 * KIỂM TRƯỚC OV-13m — CHỈ ĐỌC (một câu `SELECT`, cùng tập với việc "Chọn bước tiếp" — `SQL_CHO_BUOC_TIEP`): in số lộ trình FT có kết quả thi thật mà chưa chọn
 * bước tiếp, tách "em đang học / tạm dừng (sẽ hiện việc MỚI sau deploy)" và "em đã Kết thúc học (đã có việc từ OV-8a)". Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov13m`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { SQL_CHO_BUOC_TIEP } from '../loTrinh/buocTiep.ts';

if (process.argv[1] && /kiemTruocOv13m\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov13m] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const ds = db().prepare(`SELECT x.*, s.status AS em_status FROM (${SQL_CHO_BUOC_TIEP}) x JOIN students s ON s.id = x.student_id ORDER BY x.class_code, x.ten`).all() as any[];
    const moi = ds.filter((r) => r.em_status !== 'finished');
    console.log(`\n${moi.length} em đang học / tạm dừng đã có kết quả thi thật mà chưa chọn bước tiếp — sẽ hiện việc "Chọn bước tiếp" MỚI sau deploy${moi.length ? ':' : '.'}`);
    for (const r of moi) console.log(`  ${r.ten} · ${r.class_code ?? '—'} · lộ trình ${r.id} (${r.status === 'active' ? 'còn mở' : 'đã đóng'})`);
    console.log(`${ds.length - moi.length} em đã Kết thúc học chờ chọn (việc đã có từ trước).`);
  } catch (e) {
    console.error(`[kiem-truoc-ov13m] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
