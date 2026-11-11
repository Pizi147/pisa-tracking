/**
 * RÀ 11/11 G1-02 — CHỈ THÊM `attempt_skills.plan_source_truoc_vang`: nguồn lịch (`auto` / `manual`) của kỹ năng NGAY TRƯỚC lần "-" dời nó, để Bỏ vắng /
 * Hoàn tác trả về đúng như trước (trước đây lần dời đặt `manual` mãi → đổi mốc lớp / MT0 theo Final bỏ sót kỹ năng từng gõ nhầm "-").
 * NULL = chưa có lần dời do "-" nào nhớ (dữ liệu cũ: gỡ "-" giữ nguồn hiện tại như trước). Dữ liệu cũ giữ nguyên; chạy lặp không làm gì; khớp `schema.sql`.
 */
export function themCotPrPlanSourceVang(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('attempt_skills')`).all() as any[]).map((c) => c.name as string));
  if (!co.size || co.has('plan_source_truoc_vang')) return;
  conn.exec('ALTER TABLE attempt_skills ADD COLUMN plan_source_truoc_vang TEXT');
  applied.push('RÀ 11/11 G1-02: thêm attempt_skills.plan_source_truoc_vang (Bỏ vắng / Hoàn tác trả nguyên nguồn lịch). Dữ liệu cũ giữ nguyên.');
}
