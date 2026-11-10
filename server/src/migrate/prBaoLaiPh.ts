/**
 * YT-BAO-PH (rà toàn bộ 11/11 #7, [XM 1]) — CHỈ THÊM `viec_bao_ph.bao_lai_cua` (id lần xử lý đã thu hồi mà TVV phải báo lại PH; NULL = việc thường)
 * + chỉ mục của nó (G3-14: tab Ý thức lớp đọc việc báo lại theo lần thu hồi, không quét bảng).
 * Dữ liệu cũ giữ nguyên; chạy lặp không làm gì; khớp `schema.sql`. Gọi sau `migratePrSvYtTvv` (bảng phải có rồi).
 */
export function themCotPrBaoLaiPh(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('viec_bao_ph')`).all() as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const da: string[] = [];
  if (!co.has('bao_lai_cua')) {
    conn.exec('ALTER TABLE viec_bao_ph ADD COLUMN bao_lai_cua INTEGER REFERENCES discipline_measures(id)');
    da.push('viec_bao_ph.bao_lai_cua');
  }
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_viec_bao_ph_bao_lai'`).get()) {
    conn.exec('CREATE INDEX IF NOT EXISTS idx_viec_bao_ph_bao_lai ON viec_bao_ph(bao_lai_cua)');
    da.push('chỉ mục idx_viec_bao_ph_bao_lai');
  }
  if (da.length) applied.push(`YT-BAO-PH: thêm ${da.join(', ')} (việc TVV báo lại PH sau khi thu hồi xử lý). Dữ liệu cũ giữ nguyên.`);
}
