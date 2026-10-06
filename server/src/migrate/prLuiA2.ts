/** PR-LUI-a2: "Người phụ trách" của mỗi lần ghi kết quả PA. CHỈ THÊM CỘT — dòng cũ để NULL. Chạy lặp được. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrLuiA2(conn: any, applied: string[]) {
  if (!coCot(conn, 'case_followups', 'phu_trach_user_id')) {
    conn.exec('ALTER TABLE case_followups ADD COLUMN phu_trach_user_id INTEGER REFERENCES users(id)');
    applied.push('Ghi kết quả PA: thêm cột Người phụ trách (tài khoản)');
  }
  if (!coCot(conn, 'case_followups', 'phu_trach_ten')) {
    conn.exec('ALTER TABLE case_followups ADD COLUMN phu_trach_ten TEXT');
    applied.push('Ghi kết quả PA: thêm cột Người phụ trách (tên ngoài hệ thống)');
  }
}
