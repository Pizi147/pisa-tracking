/**
 * ĐẾM BỘ BỔ TRỢ FINAL BỊ SINH TRÙNG (PR-VN6, F02) — CHỈ ĐỌC: chỉ `prepare(...).all()`, không ghi câu nào. Chủ sản phẩm chạy trên database bản chính.
 *
 * Trước PR-VN6: em sang FT → Mini Test chưa ghi bị đóng (xoá) → sửa điểm Final sau đó sinh lại MỘT BỘ MỚI (Case + PA ở lộ trình FT + Mini Test).
 * Dấu vết: PA Bổ trợ miễn phí còn mang nhóm `mt:{bài Final}` (huỷ bộ thì PA rời nhóm) nằm ở > 1 lộ trình, hoặc một môn (topic Case) có > 1 PA.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run dem-bo-tro-trung`. Không có biến Turso → DB cục bộ.
 * Không có tham số nên không cần chia lô (Turso: ≤ 900 tham số).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';

export type DongTrung = { sid: number; hocVien: string; ma: string; nhom: string; soLoTrinh: number; soPa: number; soMon: number; tao: string };

export function demBoTroTrung(conn: any): DongTrung[] {
  return conn.prepare(
    `SELECT sc.student_id AS sid, s.full_name AS hocVien, s.student_code AS ma, iv.nhom_bo_tro AS nhom,
            COUNT(DISTINCT sc.cycle_id) AS soLoTrinh, COUNT(*) AS soPa, COUNT(DISTINCT sc.topic) AS soMon,
            GROUP_CONCAT(DISTINCT substr(iv.created_at, 1, 10)) AS tao
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN students s ON s.id = sc.student_id
      WHERE iv.nhom_bo_tro LIKE 'mt:%' AND iv.kind = 'bo_tro_mien_phi'
      GROUP BY sc.student_id, iv.nhom_bo_tro
     HAVING COUNT(DISTINCT sc.cycle_id) > 1 OR COUNT(*) > COUNT(DISTINCT sc.topic)
      ORDER BY sc.student_id, iv.nhom_bo_tro`,
  ).all() as DongTrung[];
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /demBoTroTrung\.[jt]s$/.test(process.argv[1])) {
  console.log(`[dem-bo-tro-trung] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  const ra = demBoTroTrung(db());
  closeDb();
  for (const d of ra) console.log(`  ${d.hocVien} (${d.ma}) · bài ${d.nhom} · ${d.soLoTrinh} lộ trình · ${d.soPa} PA / ${d.soMon} môn · tạo ${d.tao}`);
  console.log(`\n[dem-bo-tro-trung] ${new Set(ra.map((d) => d.sid)).size} em có hơn một bộ PA bổ trợ cùng bài Final.`);
}
