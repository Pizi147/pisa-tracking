/**
 * PR-OV12g: bảng `gop_y_tuan` (Góp ý hàng tuần ở hồ sơ lớp). CHỈ CẤU TRÚC — cùng định nghĩa trong `schema.sql`. Chạy lại không làm gì.
 */
export function migratePrOv12g(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 AS c FROM sqlite_master WHERE type = 'table' AND name = 'gop_y_tuan'").get()) return;
  conn.exec(`CREATE TABLE gop_y_tuan (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  period_id INTEGER NOT NULL REFERENCES report_periods(id),
  skill TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  ghi_boi INTEGER REFERENCES users(id),
  ghi_luc TEXT NOT NULL,
  UNIQUE (student_id, class_id, period_id, skill)
)`);
  conn.exec('CREATE INDEX idx_gop_y_tuan_lop ON gop_y_tuan(class_id, period_id)');
  applied.push('PR-OV12g: bảng gop_y_tuan (Góp ý hàng tuần). Dữ liệu cũ giữ nguyên.');
}
