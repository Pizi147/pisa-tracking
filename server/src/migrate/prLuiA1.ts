/** PR-LUI-a1: cột "Vi phạm" ngắn. CHỈ THÊM CỘT — dòng cũ để NULL, đọc thì `tachTenMoTa` tự tách (không đổi dữ liệu). Chạy lặp được. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrLuiA1(conn: any, applied: string[]) {
  if (!coCot(conn, 'violations', 'ten')) {
    conn.exec('ALTER TABLE violations ADD COLUMN ten TEXT');
    applied.push('Vi phạm: thêm ô "Vi phạm" ngắn (dòng cũ tự tách khi đọc)');
  }
}
