/**
 * OV-13e (chủ SP 15/10): cột `users.requested_role` — vai người tự đăng ký đề nghị (GV · QL · TVV · CX · Admin); hộp duyệt điền sẵn.
 * Chỉ thêm cột (NULL = tài khoản cũ / tạo tay), không đổi dữ liệu — chạy lại không làm gì.
 */
export function migratePrOv13e(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('users') as any[];
  if (!cot.length || cot.some((c) => c.name === 'requested_role')) return;
  conn.exec('ALTER TABLE users ADD COLUMN requested_role TEXT');
  applied.push('OV-13e: thêm cột users.requested_role (vai đề nghị khi tự đăng ký). Dữ liệu cũ giữ nguyên.');
}
