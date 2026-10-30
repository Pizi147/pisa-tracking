/**
 * DON-LUONG K6: chỉ mục một phần `assessment_scores(no_show_period_id)` — lưới tuần gốc tìm em có dấu "-" của tuần đó dù mọi kỹ năng đã dời
 * (`classScoreSheet`, vế UNION theo chỉ mục). Chỉ thêm chỉ mục, chạy lặp được. Cùng câu cuối `schema.sql`.
 */
export const IDX_SCORES_NO_SHOW_SQL = 'CREATE INDEX IF NOT EXISTS idx_scores_no_show ON assessment_scores (no_show_period_id) WHERE no_show_period_id IS NOT NULL';

export function migrateDonLuong(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_scores_no_show'").get()) return;
  conn.exec(IDX_SCORES_NO_SHOW_SQL);
  applied.push('DON-LUONG: chỉ mục idx_scores_no_show (em vắng dời hết vẫn có hàng ở lưới tuần gốc).');
}
