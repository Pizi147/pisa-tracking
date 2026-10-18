/**
 * TD7 (chủ SP 19/10, Turso Top Queries): chỉ thêm chỉ mục một phần (cùng trong schema.sql); chạy lại không làm gì.
 */
export const CHI_MUC_TD7: [string, string][] = [
  /* "MT lịch sử chưa nhập" (`mtLichSuChuaNhap`) — trước đi idx_attempt_class: đọc MỌI lượt của mọi lớp đang chạy, mỗi lần ~5,5 k dòng. */
  ['idx_attempt_lich_su_cho', "CREATE INDEX IF NOT EXISTS idx_attempt_lich_su_cho ON assessment_attempts(class_id) WHERE lich_su = 1 AND status = 'planned'"],
  /* Lộ trình FT có kết quả, chưa chọn bước tiếp (`SQL_CHO_BUOC_TIEP`) — trước SCAN cả learning_cycles. Điều kiện = `CO_KET_QUA` của buocTiep.ts (giữ y hệt). */
  ['idx_cycle_cho_buoc_tiep', "CREATE INDEX IF NOT EXISTS idx_cycle_cho_buoc_tiep ON learning_cycles(student_id) WHERE route IS NOT NULL AND buoc_tiep IS NULL AND (thi_that_khong_thi = 1 OR (thi_that_l IS NOT NULL AND thi_that_r IS NOT NULL AND thi_that_w IS NOT NULL AND thi_that_s IS NOT NULL) OR outcome_score IS NOT NULL OR COALESCE(outcome, 'unknown') != 'unknown')"],
  /* Lộ trình FT chưa có kết quả thi thật (`SQL_CHO_KET_QUA_THI`) — trước SCAN cả learning_cycles; lộ trình đã có kết quả / lớp thường không còn đọc. */
  ['idx_cycle_cho_kq', 'CREATE INDEX IF NOT EXISTS idx_cycle_cho_kq ON learning_cycles(student_id) WHERE route IS NOT NULL AND thi_that_khong_thi = 0 AND outcome_score IS NULL'],
];

export function migratePrTd7(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_TD7) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TD7: thêm chỉ mục ${ten}`);
  }
}
