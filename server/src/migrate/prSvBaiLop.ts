/**
 * SV-BAI-LOP: bảng `bai_tren_lop` (Bài trên lớp ở hồ sơ HV — V5 C11, T18). CHỈ CẤU TRÚC — cùng định nghĩa trong `schema.sql`. Chạy lại không làm gì.
 */
export function migratePrSvBaiLop(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 AS c FROM sqlite_master WHERE type = 'table' AND name = 'bai_tren_lop'").get()) return;
  conn.exec(`CREATE TABLE bai_tren_lop (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT NOT NULL,
  ten_bai TEXT NOT NULL,
  diem REAL NOT NULL,
  thang REAL NOT NULL,
  tuan TEXT NOT NULL,
  nhan_xet TEXT,
  ghi_boi INTEGER REFERENCES users(id),
  ghi_luc TEXT NOT NULL,
  sua_boi INTEGER REFERENCES users(id),
  sua_luc TEXT
)`);
  conn.exec('CREATE INDEX idx_bai_tren_lop_hv ON bai_tren_lop(student_id, tuan)');
  applied.push('SV-BAI-LOP: bảng bai_tren_lop (Bài trên lớp). Dữ liệu cũ giữ nguyên.');
}
