/**
 * PHOI-HOP-V2 (chủ SP 11/11, mockup #1368) — CHỈ THÊM `viec_bao_ph.phoi_hop_id`: việc TVV báo gia đình / sắp họp / báo kết quả sinh khi GVCN xác nhận
 * Meeting CX/GĐCN (sau Mock) — cùng bảng, cùng luật với Báo PH Ý thức. NULL = việc Báo PH ý thức. Dữ liệu cũ giữ nguyên; chạy lặp không làm gì; khớp `schema.sql`.
 * ponytail: không khoá ngoại (giữ bao đóng xoá học viên như cũ — dòng xoá theo `student_id`); thêm FK khi bảng phối hợp có xoá cứng riêng.
 */
export function themCotPrPhoiHopTvv(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('viec_bao_ph')`).all() as any[]).map((c) => c.name as string));
  if (!co.size || co.has('phoi_hop_id')) return;
  conn.exec('ALTER TABLE viec_bao_ph ADD COLUMN phoi_hop_id INTEGER');
  conn.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_viec_bao_ph_phoi_hop ON viec_bao_ph(phoi_hop_id) WHERE phoi_hop_id IS NOT NULL');
  applied.push('PHOI-HOP-V2: thêm viec_bao_ph.phoi_hop_id (việc TVV sau Meeting CX/GĐCN). Dữ liệu cũ giữ nguyên.');
}
