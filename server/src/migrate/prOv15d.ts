/**
 * OV-15d (rà #463): thông báo tự động "Case chưa chốt PA quá hạn" đọc Case đang mở của MỘT người phụ trách mỗi lần đồng bộ chuông — trước quét cả
 * sos_cases. Chỉ thêm chỉ mục (cùng trong schema.sql); chạy lại không làm gì.
 */
export function migratePrOv15d(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_case_owner'").get()) return;
  conn.exec('CREATE INDEX IF NOT EXISTS idx_case_owner ON sos_cases(owner_user_id, status)');
  applied.push('OV-15d: thêm chỉ mục idx_case_owner');
}
