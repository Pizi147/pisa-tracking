/**
 * MT0-THEO-EM (chủ SP 06/11): chỉ thêm chỉ mục một phần (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * Lớp FT hiện MT0 của em (`MT0_THEO_EM_SQL`) — tra MT0 theo em đọc ~1 dòng / em thay vì mọi lượt của em (`idx_attempt_student`).
 */
export function migratePrMt0Em(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_attempt_mt0'").get()) return;
  conn.exec("CREATE INDEX IF NOT EXISTS idx_attempt_mt0 ON assessment_attempts(student_id) WHERE kind = 'mt0'");
  applied.push('MT0-THEO-EM: thêm chỉ mục idx_attempt_mt0');
}
