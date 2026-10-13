/**
 * OV-10b (chủ SP 13/10): Liên hệ của học viên — SĐT em, phụ huynh (tên, quan hệ, SĐT). Không bắt buộc, trống = NULL.
 * Chỉ thêm cột (dữ liệu cũ giữ nguyên) — chạy lại không làm gì.
 */
const COT = ['phone', 'parent_name', 'parent_relation', 'parent_phone'] as const;

export function migratePrOv10b(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('students') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const thieu = COT.filter((c) => !co.has(c));
  for (const c of thieu) conn.exec(`ALTER TABLE students ADD COLUMN ${c} TEXT`);
  if (thieu.length) applied.push(`OV-10b: thêm cột liên hệ students.${thieu.join(', ')} (không bắt buộc). Dữ liệu cũ giữ nguyên.`);
}
