/**
 * SL1 (chuông N1): CHỈ THÊM CỘT `notifications.han` — hạn của việc mà thông báo trỏ tới (thông báo tự động, Case giao người phụ trách) để Cần làm
 * sắp theo hạn. NULL được; không đổi dòng cũ (dòng tự động được đồng bộ ghi lại hạn ở lần mở chuông kế). Chạy lặp không làm gì.
 */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrSl1(conn: any, applied: string[]) {
  if (!coCot(conn, 'notifications', 'han')) {
    conn.exec('ALTER TABLE notifications ADD COLUMN han TEXT');
    applied.push('Thông báo: thêm hạn của việc (chuông Cần làm sắp theo hạn — SL1)');
  }
}
