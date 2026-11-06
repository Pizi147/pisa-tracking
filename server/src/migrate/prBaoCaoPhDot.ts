/**
 * BC-DOT-QL (chủ SP 06/11) — CHỈ THÊM bảng `bao_cao_ph_dot` (+ chỉ mục), khớp `schema.sql`. Chạy lặp không làm gì; không đổi dữ liệu cũ.
 */
export function migratePrBaoCaoPhDot(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bao_cao_ph_dot'").get()) return;
  conn.exec(`CREATE TABLE bao_cao_ph_dot (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  ma TEXT,
  loai TEXT NOT NULL CHECK (loai IN ('bo', 'them')),
  ten TEXT, mo TEXT, han TEXT,
  nguoi INTEGER REFERENCES users(id),
  luc TEXT NOT NULL,
  xoa_luc TEXT,
  UNIQUE (class_id, ma)
)`);
  conn.exec('CREATE INDEX IF NOT EXISTS idx_bcph_dot_lop ON bao_cao_ph_dot(class_id)');
  applied.push('BC-DOT-QL: thêm bảng bao_cao_ph_dot — QL / Admin bỏ đợt hoặc thêm đợt Báo cáo PH theo lớp.');
}
