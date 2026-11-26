/**
 * MT-QUA-THI (chủ SP 26/11): Head "Bỏ qua" việc "MT sau ngày thi" (`mt-thi:` ở `mywork.ts`) — CHỈ THÊM 3 cột NULL trên `learning_cycles`:
 * `mt_thi_bo_qua` (dấu đã bỏ qua: ngày thi + các MT — đổi ngày thi / dời thêm MT thì việc hiện lại) · `mt_thi_bo_qua_boi` · `mt_thi_bo_qua_luc`.
 * Không đổi dữ liệu; chạy lặp không làm gì; khớp `schema.sql`. Gọi ĐẦU migrate (myWork đọc các cột này).
 */
export const COT_MT_THI: [string, string][] = [['mt_thi_bo_qua', 'TEXT'], ['mt_thi_bo_qua_boi', 'INTEGER'], ['mt_thi_bo_qua_luc', 'TEXT']];

export function themCotPrMtQuaThi(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT_MT_THI.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`MT-QUA-THI: thêm cột learning_cycles.${them.map(([t]) => t).join(', ')} (Bỏ qua việc MT sau ngày thi). Dữ liệu cũ giữ nguyên.`);
}
