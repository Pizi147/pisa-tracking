/**
 * OV-15f: Học viên & Lớp › Lịch thi — kết luận họp + ghi chú họp nằm ở học viên × lộ trình: CHỈ THÊM 5 cột NULL trên `learning_cycles`
 * (`lich_thi_ket_luan` · `lich_thi_thang` tháng lúc kết luận · `lich_thi_ghi_chu` · `…_boi` người ghi chú · `…_luc` lúc ghi chú). Không đổi dữ liệu nào;
 * chạy lặp không làm gì; khớp `schema.sql`. Gọi ĐẦU migrate (bài học #420: mã đọc cột này có thể chạy trong bước trước).
 */
export const COT_PR_OV15F: [string, string][] = [
  ['lich_thi_ket_luan', 'TEXT'], ['lich_thi_thang', 'TEXT'], ['lich_thi_ghi_chu', 'TEXT'], ['lich_thi_ghi_chu_boi', 'INTEGER'], ['lich_thi_ghi_chu_luc', 'TEXT'],
];

export function themCotPrOv15f(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT_PR_OV15F.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`OV-15f: thêm cột learning_cycles.${them.map(([t]) => t).join(', ')} (kết luận + ghi chú họp Lịch thi). Dữ liệu cũ giữ nguyên.`);
}
