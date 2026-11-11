/**
 * TURSO-1211 (chủ SP 12/11, đo trên bản chép bản chính — docs/superpowers/specs/2026-11-12-turso-toc-do/ra.md mục A): chỉ thêm chỉ mục (cùng trong schema.sql);
 * chạy lại không làm gì. Câu không đổi — điều kiện chỉ mục một phần chép NGUYÊN điều kiện của câu (SQLite chỉ dùng chỉ mục một phần khi câu có đúng các vế đó).
 * Câu Công việc không ORDER BY: hai chỉ mục PA không lọc khoảng khoá theo `id` (đọc theo `id` = thứ tự cũ, SCAN theo rowid); Ghi kết quả PA lọc khoảng hạn
 * (`action_due`) rồi xếp lại theo `id` ở mywork.ts → JSON Công việc y hệt.
 */
export const CHI_MUC_TURSO_1211: [string, string][] = [
  /* Công việc · Ghi kết quả PA (`mywork.ts` 2b, `action_due <= ?`): trước SCAN mọi PA, nay chỉ PA tới hạn. */
  ['idx_iv_ghi_kq', "CREATE INDEX IF NOT EXISTS idx_iv_ghi_kq ON case_interventions(action_due) WHERE status IN ('planned', 'started') AND action_due IS NOT NULL"],
  /* Công việc · Xác nhận PA (`UNCONFIRMED_PRESET` + `status = 'planned'`): trước SCAN mọi PA. */
  ['idx_iv_cho_xac_nhan', "CREATE INDEX IF NOT EXISTS idx_iv_cho_xac_nhan ON case_interventions(id) WHERE preset = 1 AND confirmed_at IS NULL AND status = 'planned'"],
  /* Công việc · Mốc PA quy chế (`SQL_MOC`): trước SCAN mọi PA. */
  ['idx_iv_moc_cho', "CREATE INDEX IF NOT EXISTS idx_iv_moc_cho ON case_interventions(id) WHERE preset = 1 AND status = 'started' AND followup_due IS NULL"],
  /* `SQL_CHO_KET_QUA_THI`: lộ trình chờ kết quả thi đã qua ngày thi — trước đọc mọi lộ trình chờ kết quả (bản chính 683, 591 chưa có ngày), nay khoảng `< hôm nay`. */
  ['idx_cycle_cho_kq_ngay', 'CREATE INDEX IF NOT EXISTS idx_cycle_cho_kq_ngay ON learning_cycles(COALESCE(thi_that_ngay, exam_date, ended_at)) WHERE route IS NOT NULL AND thi_that_khong_thi = 0 AND outcome_score IS NULL'],
  /* Kết quả PA cuối (`fu.intervention_id = iv.id`, effectiveness / hồ sơ HV / Hiệu quả PA): câu con trước SCAN case_followups mỗi PA. */
  ['idx_followup_iv', 'CREATE INDEX IF NOT EXISTS idx_followup_iv ON case_followups(intervention_id)'],
  /* `SQL_THI_THAT` cột WL2 (`dm.cycle_id = c.id`): câu con trước SCAN discipline_measures mỗi lộ trình. */
  ['idx_dm_cycle', 'CREATE INDEX IF NOT EXISTS idx_dm_cycle ON discipline_measures(cycle_id)'],
  /* `chipHocVien` vi phạm 7 ngày (`occurred_on >= ?`): trước SCAN violations. */
  ['idx_violation_ngay', 'CREATE INDEX IF NOT EXISTS idx_violation_ngay ON violations(occurred_on)'],
];

export function migratePrTurso1211(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_TURSO_1211) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TURSO-1211: thêm chỉ mục ${ten}`);
  }
}
