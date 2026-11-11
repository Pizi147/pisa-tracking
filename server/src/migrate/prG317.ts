/**
 * G3-17 (chủ SP 13/11): việc lớp thường "Báo phụ huynh qua TVV" đổi tên "Báo PH kết quả Test" (người làm vẫn là GVCN, luật N6).
 * Chuông đã gửi lưu sẵn chữ cũ → đổi chữ MỘT lần (chạy lại không làm gì: không còn dòng khớp).
 */
export function migratePrG317(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'notifications'").get()) return;
  const r = conn.prepare(`UPDATE notifications SET title = 'Báo PH kết quả Test' || substr(title, length('Báo phụ huynh qua TVV') + 1) WHERE title LIKE 'Báo phụ huynh qua TVV%'`).run();
  if (r.changes) applied.push(`G3-17: đổi tên ${r.changes} chuông "Báo phụ huynh qua TVV" → "Báo PH kết quả Test"`);
}
