/**
 * GIAM-DOC-0611 (06/11): giảm dòng đọc Turso — chỉ thêm chỉ mục một phần (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * Việc "Báo PH kết quả Test" (Công việc mọi vai, chuông, Học viên & Lớp) `WHERE x.kind = ? AND x.status = 'pending'` trước SCAN cả `sos_coordination_actions`
 * (bản chính 29/10: 436 dòng, 117 đang chờ, 21 Báo PH) — bảng chỉ tăng (việc xong / gỡ vẫn giữ).
 */
export function migratePrGiamDoc0611(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_sca_cho'").get()) return;
  conn.exec("CREATE INDEX IF NOT EXISTS idx_sca_cho ON sos_coordination_actions(kind) WHERE status = 'pending'");
  applied.push('GIAM-DOC-0611: thêm chỉ mục idx_sca_cho');
}
