/**
 * PR-OV4a (đặc tả OV 3.4): `ket_qua_huy` thêm `loai` (bản cất do 'doi_vuot' — dời vượt PR-MTa · 'huy_luot' — Huỷ cả lượt giữ điểm ẩn) và
 * `dong_json` (danh sách lần huỷ đã đóng + lượt trước huỷ, để Khôi phục mở lại đúng). CHỈ THÊM CỘT, dòng cũ = 'doi_vuot'; chạy lặp được.
 * Lượt huỷ trước PR này: điểm đã xoá (chỉ còn nhật ký) — không dựng lại. Cùng định nghĩa nằm ở `schema.sql`.
 */
export function migratePrOv4(conn: any, applied: string[]) {
  const cot = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('ket_qua_huy') as any[]).map((x) => x.name as string));
  const da: string[] = [];
  if (!cot.has('loai')) {
    conn.exec(`ALTER TABLE ket_qua_huy ADD COLUMN loai TEXT NOT NULL DEFAULT 'doi_vuot'`);
    da.push('ket_qua_huy.loai');
  }
  if (!cot.has('dong_json')) {
    conn.exec('ALTER TABLE ket_qua_huy ADD COLUMN dong_json TEXT');
    da.push('ket_qua_huy.dong_json');
  }
  if (da.length) applied.push(`PR-OV4a: ${da.join(', ')}.`);
}
