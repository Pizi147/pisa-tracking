/**
 * BO-BAO-CAO-PH (chủ SP 26/11) — CHỈ THÊM bảng `bao_cao_ph_bo_em` (+ khoá chính em × đợt), khớp `schema.sql`. Chạy lặp không làm gì; không đổi dữ liệu cũ.
 */
export function migratePrBaoCaoPhBoEm(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bao_cao_ph_bo_em'").get()) return;
  conn.exec(`CREATE TABLE bao_cao_ph_bo_em (
  student_id INTEGER NOT NULL REFERENCES students(id),
  dot TEXT NOT NULL,
  class_id INTEGER NOT NULL,
  nguoi INTEGER REFERENCES users(id),
  luc TEXT NOT NULL,
  PRIMARY KEY (student_id, dot)
)`);
  applied.push('BO-BAO-CAO-PH: thêm bảng bao_cao_ph_bo_em — Head / Quản trị / Admin bỏ Báo cáo PH của từng em trong một đợt.');
}
