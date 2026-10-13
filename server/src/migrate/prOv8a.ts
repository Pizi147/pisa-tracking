/**
 * OV-8a (kế hoạch `2026-10-13-pr-ov8a-buoc-tiep-sau-thi.md`, chạy lặp được): Bước tiếp sau thi thật — CHỈ THÊM bốn cột ở `learning_cycles`
 * (lựa chọn của QL, ngày, người, dữ liệu để hoàn tác đúng). Cùng định nghĩa trong `schema.sql`.
 */
const COT: [string, string][] = [['buoc_tiep', 'TEXT'], ['buoc_tiep_luc', 'TEXT'], ['buoc_tiep_boi', 'INTEGER'], ['buoc_tiep_json', 'TEXT']];

export function migratePrOv8a(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((x) => x.name as string));
  if (!co.size) return;
  const them = COT.filter(([c]) => !co.has(c));
  for (const [c, kieu] of them) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${c} ${kieu}`);
  if (them.length) applied.push(`OV-8a: ${them.length} cột Bước tiếp sau thi ở learning_cycles`);
}
