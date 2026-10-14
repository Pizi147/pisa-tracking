/**
 * PR-EN (chủ SP 07/10): ngôn ngữ nhớ theo tài khoản — `users.ngon_ngu` ('vi' | 'en'; NULL = chưa chọn, web theo lựa chọn của máy).
 * Chỉ thêm cột (dữ liệu cũ giữ nguyên) — chạy lại không làm gì.
 */
export function migratePrEn(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('users') as any[]).map((c) => c.name as string));
  if (!co.size || co.has('ngon_ngu')) return;
  conn.exec('ALTER TABLE users ADD COLUMN ngon_ngu TEXT');
  applied.push('PR-EN: thêm cột users.ngon_ngu (ngôn ngữ theo tài khoản, NULL = chưa chọn). Dữ liệu cũ giữ nguyên.');
}
