/**
 * HAN-BAO-PH (chủ SP 03/11, 17.1–17.3) — CHỈ THÊM: `viec_bao_ph.han_chon` + `sos_coordination_actions.han_chon` (NULL = hạn mặc định) · bảng
 * `viec_han_lan` (mỗi lần đổi hạn một dòng: hạn hiệu lực cũ → mới) · X04 `viec_bao_ph_lan.khoa` + chỉ mục duy nhất (gửi lại cùng khoá không ghi đôi).
 * Dữ liệu cũ giữ nguyên (dùng mặc định); chạy lặp không làm gì; khớp `schema.sql`. Gọi ĐẦU migrate (myWork đọc các cột này) và
 * lại SAU `migratePrSvYtTvv` (DB cũ chưa có bảng Báo PH: bảng tạo ở đó, cột thêm ở lần gọi sau).
 */
const COT: [string, string, string][] = [['viec_bao_ph', 'han_chon', 'TEXT'], ['sos_coordination_actions', 'han_chon', 'TEXT'], ['viec_bao_ph_lan', 'khoa', 'TEXT']];

export function themCotPrHanBaoPh(conn: any, applied: string[]) {
  const da: string[] = [];
  for (const [bang, ten, kieu] of COT) {
    const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string));
    if (!co.size || co.has(ten)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${ten} ${kieu}`);
    da.push(`${bang}.${ten}`);
  }
  const coBang = conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'viec_han_lan'`).get();
  conn.exec(`CREATE TABLE IF NOT EXISTS viec_han_lan (
    id INTEGER PRIMARY KEY, loai TEXT NOT NULL, viec_id INTEGER NOT NULL, han_cu TEXT, han_moi TEXT NOT NULL,
    mac_dinh INTEGER NOT NULL DEFAULT 0, boi INTEGER REFERENCES users(id), luc TEXT NOT NULL)`);
  conn.exec('CREATE INDEX IF NOT EXISTS idx_viec_han_lan ON viec_han_lan(loai, viec_id)');
  if (da.includes('viec_bao_ph_lan.khoa') || conn.prepare(`SELECT 1 FROM pragma_table_info('viec_bao_ph_lan') WHERE name = 'khoa'`).get()) {
    conn.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_viec_bao_ph_lan_khoa ON viec_bao_ph_lan(khoa)');
  }
  if (!coBang) da.push('bảng viec_han_lan');
  if (da.length) applied.push(`HAN-BAO-PH: thêm ${da.join(', ')} (sửa hạn Báo PH / Meeting CX, chống ghi đôi kết quả). Dữ liệu cũ giữ nguyên.`);
}
