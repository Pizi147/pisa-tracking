/**
 * YT-BAO-PH (rà toàn bộ 11/11 #7, [XM 1]) — CHỈ THÊM `viec_bao_ph.bao_lai_cua` (id lần xử lý đã thu hồi mà TVV phải báo lại PH; NULL = việc thường).
 * Dữ liệu cũ giữ nguyên; chạy lặp không làm gì; khớp `schema.sql`. Gọi sau `migratePrSvYtTvv` (bảng phải có rồi).
 */
export function themCotPrBaoLaiPh(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('viec_bao_ph')`).all() as any[]).map((c) => c.name as string));
  if (!co.size || co.has('bao_lai_cua')) return;
  conn.exec('ALTER TABLE viec_bao_ph ADD COLUMN bao_lai_cua INTEGER REFERENCES discipline_measures(id)');
  applied.push('YT-BAO-PH: thêm viec_bao_ph.bao_lai_cua (việc TVV báo lại PH sau khi thu hồi xử lý). Dữ liệu cũ giữ nguyên.');
}
