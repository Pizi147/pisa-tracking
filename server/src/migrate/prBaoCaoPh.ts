/**
 * BAO-CAO-PH (chủ SP 05–06/11) — CHỈ THÊM bảng `bao_cao_ph` (+ chỉ mục), khớp `schema.sql`. Chạy lặp không làm gì; không đổi dữ liệu cũ.
 */
export function migratePrBaoCaoPh(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bao_cao_ph'").get()) return;
  conn.exec(`CREATE TABLE bao_cao_ph (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  dot TEXT NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(id),
  phan TEXT NOT NULL,
  muc TEXT, dat_san TEXT, chu TEXT, diem_sua REAL,
  du INTEGER NOT NULL DEFAULT 0,
  sua_boi INTEGER REFERENCES users(id),
  sua_luc TEXT NOT NULL,
  UNIQUE (dot, student_id, phan)
)`);
  conn.exec('CREATE INDEX IF NOT EXISTS idx_bcph_lop_dot ON bao_cao_ph(class_id, dot)');
  applied.push('BAO-CAO-PH: thêm bảng bao_cao_ph — báo cáo gửi phụ huynh theo (đợt, em, phần).');
}
