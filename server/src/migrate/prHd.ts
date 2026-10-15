/**
 * HD-a (chủ SP 15/10): dải "Mới dùng PISA?" ở Tổng quan nhớ theo tài khoản — `users.da_xem_huong_dan` (1 = đã mở Hướng dẫn hoặc bấm Ẩn;
 * NULL = chưa). Chỉ thêm cột (dữ liệu cũ giữ nguyên) — chạy lại không làm gì.
 */
export function migratePrHd(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('users') as any[]).map((c) => c.name as string));
  if (!co.size || co.has('da_xem_huong_dan')) return;
  conn.exec('ALTER TABLE users ADD COLUMN da_xem_huong_dan INTEGER');
  applied.push('HD-a: thêm cột users.da_xem_huong_dan (đã mở Hướng dẫn, NULL = chưa). Dữ liệu cũ giữ nguyên.');
}
