/**
 * TD7a (chủ SP 17/10): "Xem nhận xét Speaking" (OV-13k) đọc ~225 k dòng / lần trên Turso — `cho_phu_trach_xem` không chỉ mục → quét cả
 * assessment_scores, NOT EXISTS quét case_milestones cho từng lượt. Chỉ thêm chỉ mục (cùng trong schema.sql); chạy lại không làm gì.
 */
export const CHI_MUC_TD7A: [string, string][] = [
  /* Ô S Mock chờ GV phụ trách xem — chỉ mục một phần, khớp đúng vế WHERE của câu xem_nx_s (vài dòng). */
  ['idx_score_cho_phu_trach', "CREATE INDEX IF NOT EXISTS idx_score_cho_phu_trach ON assessment_scores(attempt_id) WHERE skill = 'speaking' AND cho_phu_trach_xem = 1"],
  /* Mốc của một lượt (`m.attempt_id = a.id`, NOT EXISTS PA đã xác nhận) — trước đây chỉ có chỉ mục theo Case. */
  ['idx_milestone_attempt', 'CREATE INDEX IF NOT EXISTS idx_milestone_attempt ON case_milestones(attempt_id, kind)'],
];

export function migratePrTd7a(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_TD7A) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TD7a: thêm chỉ mục ${ten}`);
  }
}
