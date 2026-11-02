/**
 * DOC-IT-5 (02/11): giảm dòng đọc Turso — chỉ thêm chỉ mục một phần (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * Danh sách Lưu trữ (`danhSachLuuTru`, Học viên & Lớp mọi vai) `WHERE s.archived_at IS NOT NULL ORDER BY s.archived_at DESC` trước SCAN cả `students`.
 */
export function migratePrDocIt5(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_student_luu_tru'").get()) return;
  conn.exec('CREATE INDEX IF NOT EXISTS idx_student_luu_tru ON students(archived_at) WHERE archived_at IS NOT NULL');
  applied.push('DOC-IT-5: thêm chỉ mục idx_student_luu_tru');
}
