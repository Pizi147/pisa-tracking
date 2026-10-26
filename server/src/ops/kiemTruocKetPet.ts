/**
 * KIỂM TRƯỚC P13 KET-PET — CHỈ ĐỌC (chỉ `SELECT`): số liệu migrate `prKetPet` sẽ đụng khi deploy (lớp / em PET, KET; lượt Checkpoint giữ môn gộp
 * (đã ghi môn gộp) hoặc tách 4 môn; phân công GV môn gộp thêm dòng môn tách; KCK của KET / PET; Case mở theo môn gộp; bộ môn chương trình hiện tại). Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ket-pet`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { kiemTruocKetPet } from '../migrate/prKetPet.ts';

if (process.argv[1] && /kiemTruocKetPet\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ket-pet] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const r = kiemTruocKetPet(db());
    for (const [ma, bo] of Object.entries(r.boMon)) console.log(`  Môn ${ma} (programme_skills): ${bo.join(', ') || '—'}`);
    for (const l of r.lop) console.log(`  Lớp ${l.ma} · ${l.status}: ${l.so}`);
    console.log(`  Em đang học lớp PET / KET: ${r.soEm}`);
    console.log(`  Lượt GIỮ môn gộp (đã có điểm / dấu "-" / nhận xét môn gộp): ${r.luotGiu}`);
    console.log(`  Lượt TÁCH 4 môn (chưa ghi gì ở môn gộp): ${r.luotTach}`);
    console.log(`  Phân công GV môn gộp sẽ thêm dòng môn tách (dòng gộp giữ): ${r.phanCongThem}`);
    console.log(`  Case mở theo môn gộp (giữ nguyên): ${r.caseMoGop}`);
    console.log(`  Lộ trình KET / PET có dấu KCK (sẽ bỏ dấu, Target giữ): ${r.kck}`);
  } catch (e) {
    console.error(`[kiem-truoc-ket-pet] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
