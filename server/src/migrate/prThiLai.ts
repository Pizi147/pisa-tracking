/**
 * THI-LAI-1-KN (chủ SP 05/11) — CHỈ THÊM cột `learning_cycles.thi_that_lay_lai` (JSON { kn, ngay }: kỹ năng KQ thi thật lấy điểm lần trước vì em chỉ thi lại
 * kỹ năng khác). Dữ liệu cũ NULL = thi đủ; chạy lặp không làm gì; khớp `schema.sql`. Không đổi điểm em nào — lộ trình đang kẹt tự hết khi người nhập lưu lại.
 */
export function migratePrThiLai(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('learning_cycles')`).all() as any[]).map((c) => c.name as string));
  if (!co.size || co.has('thi_that_lay_lai')) return;
  conn.exec('ALTER TABLE learning_cycles ADD COLUMN thi_that_lay_lai TEXT');
  applied.push('THI-LAI-1-KN: thêm learning_cycles.thi_that_lay_lai — kỹ năng KQ thi thật lấy điểm lần trước (em thi lại một / vài kỹ năng).');
}

/**
 * CHỈ ĐỌC — lộ trình FT đang kẹt "Chờ đủ 4 kỹ năng" (có điểm một phần, không "Không thi", không kết quả cũ) mà em ĐÃ có KQ thi thật đủ 4 kỹ năng ở lộ trình trước:
 * sau PR, mở form là thấy nút lấy điểm lần trước. `thieu` = kỹ năng còn trống.
 */
export function kiemTruocThiLai(conn: any): { id: number; student_id: number; ten: string; thieu: string }[] {
  return (conn.prepare(`SELECT c.id, c.student_id, s.full_name AS ten, c.thi_that_l l, c.thi_that_r r, c.thi_that_w w, c.thi_that_s s
      FROM learning_cycles c JOIN students s ON s.id = c.student_id
     WHERE c.route IS NOT NULL AND c.thi_that_khong_thi = 0 AND c.outcome_score IS NULL AND COALESCE(c.outcome, 'unknown') = 'unknown'
       AND COALESCE(c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s) IS NOT NULL
       AND (c.thi_that_l IS NULL OR c.thi_that_r IS NULL OR c.thi_that_w IS NULL OR c.thi_that_s IS NULL)
       AND EXISTS (SELECT 1 FROM learning_cycles t WHERE t.student_id = c.student_id AND t.seq < c.seq AND t.route IS NOT NULL AND t.thi_that_khong_thi = 0
         AND t.thi_that_l IS NOT NULL AND t.thi_that_r IS NOT NULL AND t.thi_that_w IS NOT NULL AND t.thi_that_s IS NOT NULL)
     ORDER BY c.id`).all() as any[])
    .map((c) => ({ id: c.id, student_id: c.student_id, ten: c.ten, thieu: (['l', 'r', 'w', 's'] as const).filter((k) => c[k] == null).map((k) => k.toUpperCase()).join(' · ') }));
}
