/**
 * PR-PHH: bản chụp 4 nội dung Báo phụ huynh lúc xác nhận. CHỈ THÊM một cột — không đổi, không điền ngược dòng nào (dòng `done` cũ giữ NULL,
 * web ghi rõ "chưa lưu"). An toàn trên Turso đang chạy. Chạy lặp được.
 */
export function migratePrPhh(conn: any, applied: string[]) {
  const co = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_coordination_actions') as any[]).some((x) => x.name === 'noi_dung_luc_bao');
  if (co) return;
  conn.exec('ALTER TABLE sos_coordination_actions ADD COLUMN noi_dung_luc_bao TEXT');
  applied.push('PR-PHH: cột sos_coordination_actions.noi_dung_luc_bao');
}
