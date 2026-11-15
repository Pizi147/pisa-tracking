/**
 * LICH-THI-NOI-THI (Việc để sau GD-13b, mockup ⑥ K4 "Nơi thi IDP / BC"): CHỈ THÊM cột `learning_cycles.noi_thi` TEXT NULL — nơi thi thật (chữ ngắn, vd "IDP",
 * "BC"). Không đổi dữ liệu nào; chạy lặp không làm gì; khớp `schema.sql`. Gọi ĐẦU migrate (mã đọc danh sách Lịch thi có thể chạy trong bước sau).
 */
export function themCotPrNoiThi(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((c) => c.name as string));
  if (!co.size || co.has('noi_thi')) return;
  conn.exec('ALTER TABLE learning_cycles ADD COLUMN noi_thi TEXT');
  applied.push('LICH-THI-NOI-THI: thêm cột learning_cycles.noi_thi (nơi thi thật, chữ ngắn). Dữ liệu cũ giữ nguyên.');
}
