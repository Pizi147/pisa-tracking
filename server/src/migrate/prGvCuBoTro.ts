/**
 * GV-CU-BO-TRO (chủ SP 13/11, A): chỉ mục một phần cho quyền tạm Người dạy bổ trợ — câu phiên (`COT_PRINCIPAL` `u_bo_tro`, MỖI request) tìm PA Bổ trợ miễn phí
 * đang chạy của người đăng nhập; không chỉ mục thì quét cả `case_interventions`. Chỉ thêm chỉ mục (cùng trong schema.sql), chạy lại không làm gì.
 */
export function migratePrGvCuBoTro(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_iv_nguoi_day_bo_tro'").get()) return;
  conn.exec("CREATE INDEX IF NOT EXISTS idx_iv_nguoi_day_bo_tro ON case_interventions(performer_user_id) WHERE kind = 'bo_tro_mien_phi' AND status IN ('planned', 'started')");
  applied.push('GV-CU-BO-TRO: thêm chỉ mục idx_iv_nguoi_day_bo_tro');
}
