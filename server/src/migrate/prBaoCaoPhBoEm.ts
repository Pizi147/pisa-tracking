/**
 * BO-BAO-CAO-PH (chủ SP 26/11) — CHỈ THÊM bảng `bao_cao_ph_bo_em` (+ khoá chính em × lớp × đợt, chỉ mục lớp × đợt), khớp `schema.sql`. Chạy lặp không làm gì; không đổi dữ liệu cũ.
 */
export function migratePrBaoCaoPhBoEm(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bao_cao_ph_bo_em'").get()) return;
  conn.exec(`CREATE TABLE bao_cao_ph_bo_em (
  student_id INTEGER NOT NULL REFERENCES students(id),
  dot TEXT NOT NULL,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  nguoi INTEGER REFERENCES users(id),
  luc TEXT NOT NULL,
  PRIMARY KEY (student_id, class_id, dot)
)`);
  conn.exec('CREATE INDEX IF NOT EXISTS idx_bcph_bo_em_lop ON bao_cao_ph_bo_em(class_id, dot)');
  applied.push('BO-BAO-CAO-PH: thêm bảng bao_cao_ph_bo_em — Head / Quản trị / Admin bỏ Báo cáo PH của từng em trong một đợt.');
}
