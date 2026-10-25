/**
 * KIỂM TIÊU CHÍ LẺ — CHỈ ĐỌC (chỉ `SELECT`). P1 (chủ SP 24/10): tiêu chí W1 / W2 / S từ nay chỉ số nguyên; dữ liệu cũ KHÔNG sửa.
 * Lệnh này đếm ô cũ có tiêu chí lẻ (vd 6.5) để chủ SP biết trước deploy. Không ghi câu nào.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) hoặc `PISA_DB` rồi `npm run kiem-tieu-chi-le`. Không có biến → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';

const LE = `s.skill IN ('writing1', 'writing2', 'speaking')
  AND (s.c1 <> ROUND(s.c1) OR s.c2 <> ROUND(s.c2) OR s.c3 <> ROUND(s.c3) OR s.c4 <> ROUND(s.c4))`;

/** Số ô / số lượt có ít nhất một tiêu chí không nguyên, theo kỹ năng. */
export function demTieuChiLe(conn: any): { kyNang: string; soO: number; soLuot: number }[] {
  return conn.prepare(`SELECT s.skill AS kyNang, COUNT(*) AS soO, COUNT(DISTINCT s.attempt_id) AS soLuot
    FROM assessment_scores s WHERE ${LE} GROUP BY s.skill ORDER BY s.skill`).all() as any[];
}

if (process.argv[1] && /kiemTieuChiLe\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-tieu-chi-le] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const conn = db();
    const ds = demTieuChiLe(conn);
    if (!ds.length) console.log('\nKhông có ô nào có tiêu chí lẻ.');
    else {
      console.log('\nKỹ năng · số ô · số lượt');
      for (const r of ds) {
        console.log(`  ${r.kyNang} · ${r.soO} · ${r.soLuot}`);
        const vd = conn.prepare(`SELECT st.student_code AS ma, a.kind, a.attempt_no AS so, s.c1, s.c2, s.c3, s.c4
          FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id JOIN students st ON st.id = a.student_id
          WHERE ${LE} AND s.skill = ? ORDER BY s.id LIMIT 5`).all(r.kyNang) as any[];
        for (const v of vd) console.log(`    ${v.ma} · ${v.kind === 'mock' ? `MT${v.so}` : `${v.kind} ${v.so}`} · ${v.c1} ${v.c2} ${v.c3} ${v.c4}`);
      }
    }
  } catch (e) {
    console.error(`[kiem-tieu-chi-le] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
