/**
 * BC-PH-KY-NANG (chủ SP 28/11) — khớp `schema.sql`:
 *   · cột `bao_cao_ph_bo_em.phan` (JSON kỹ năng bỏ; NULL = bỏ cả em như cũ) — Head / Quản trị / Admin bỏ từng kỹ năng của em trong một đợt;
 *   · mức tiêu chí thôi bắt buộc (`phanDu` = ô chữ không trống) → tính lại `bao_cao_ph.du` MỘT lần, cùng lúc thêm cột (chạy lặp không làm gì);
 *   · cột `bao_cao_ph.bo_diem` (1 = GV chọn "Không ghi điểm" — tệp xuất để trống ô điểm phần đó; mặc định 0).
 */
import { tx } from '../db.ts';

const coCot = (conn: any, bang: string, cot: string): boolean | null => {
  const cols = conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[];
  return cols.length ? cols.some((c) => c.name === cot) : null;   // null = chưa có bảng
};

export function migratePrBaoCaoPhKyNang(conn: any, applied: string[]) {
  if (coCot(conn, 'bao_cao_ph', 'bo_diem') === false) {
    conn.exec('ALTER TABLE bao_cao_ph ADD COLUMN bo_diem INTEGER NOT NULL DEFAULT 0');
    applied.push('BC-PH-KY-NANG: cột bao_cao_ph.bo_diem — "Không ghi điểm" vào báo cáo PH.');
  }
  if (coCot(conn, 'bao_cao_ph_bo_em', 'phan') !== false) return;
  tx(() => {
    conn.exec('ALTER TABLE bao_cao_ph_bo_em ADD COLUMN phan TEXT');
    const n = conn.prepare(`UPDATE bao_cao_ph SET du = CASE WHEN trim(COALESCE(chu, ''), ' ' || char(9, 10, 13)) <> '' THEN 1 ELSE 0 END
      WHERE du <> CASE WHEN trim(COALESCE(chu, ''), ' ' || char(9, 10, 13)) <> '' THEN 1 ELSE 0 END`).run().changes;
    applied.push(`BC-PH-KY-NANG: cột bao_cao_ph_bo_em.phan (bỏ từng kỹ năng) + tính lại "đủ" Báo cáo PH không cần mức tiêu chí (${n} dòng đổi).`);
  });
}
