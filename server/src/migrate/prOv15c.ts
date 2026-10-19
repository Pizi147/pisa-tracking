/**
 * OV-15c (C21): GHI CHÚ LỊCH THI — CHỈ THÊM bảng `ghi_chu_lich_thi` + hai chỉ mục; không đổi dữ liệu nào. Câu CREATE giống hệt cuối `schema.sql`
 * (phép kiểm so cột); chạy lặp không làm gì.
 */
export const DDL_OV15C = `
CREATE TABLE IF NOT EXISTS ghi_chu_lich_thi (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  student_id INTEGER REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  dot TEXT,
  noi_dung TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gcl_hoc_vien ON ghi_chu_lich_thi(student_id, dot);
CREATE INDEX IF NOT EXISTS idx_gcl_lop ON ghi_chu_lich_thi(class_id, student_id);
`;

export function migratePrOv15c(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ghi_chu_lich_thi'`).get()) return;
  conn.exec(DDL_OV15C);
  applied.push('OV-15c: thêm bảng ghi_chu_lich_thi (ghi chú lịch thi theo học viên × lượt và ghi chú lớp). Dữ liệu cũ giữ nguyên.');
}
