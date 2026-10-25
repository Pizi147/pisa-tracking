/**
 * P14 DICH (N19): bộ nhớ bản dịch `ban_dich` + lượt gọi dịch `dich_luot` (trần / ngày / người). CHỈ THÊM BẢNG — cùng định nghĩa trong
 * `schema.sql`. Chạy lặp không làm gì.
 */
export const SQL_DICH = `CREATE TABLE IF NOT EXISTS ban_dich (
  khoa TEXT PRIMARY KEY,
  den TEXT NOT NULL,
  ban_dich TEXT NOT NULL,
  tao_luc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dich_luot (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  ngay TEXT NOT NULL,
  luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dich_luot_ngay ON dich_luot(ngay, user_id);`;

export function migratePrDich(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 AS c FROM sqlite_master WHERE type = 'table' AND name = 'dich_luot'").get()) return;
  conn.exec(SQL_DICH);
  applied.push('P14 DICH: bảng ban_dich (bộ nhớ bản dịch) + dich_luot (lượt dịch theo ngày). Dữ liệu cũ giữ nguyên.');
}
