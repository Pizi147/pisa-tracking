/**
 * OV-13m (chủ SP 15/10, chạy lặp được): Bước tiếp sau thi — CHỈ THÊM cột `learning_cycles.buoc_tiep_hen` (Thứ Hai "Hẹn bắt đầu" của Lộ trình mới;
 * NULL = không hẹn / đã bắt đầu). Cùng định nghĩa trong `schema.sql`. Không đổi dữ liệu.
 */
export function migratePrOv13m(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((x) => x.name as string));
  if (!co.size || co.has('buoc_tiep_hen')) return;
  conn.exec('ALTER TABLE learning_cycles ADD COLUMN buoc_tiep_hen TEXT');
  applied.push('OV-13m: cột learning_cycles.buoc_tiep_hen (Hẹn bắt đầu lộ trình mới sau thi)');
}
