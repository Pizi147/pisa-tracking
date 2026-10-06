/**
 * PR-MTa: CHỈ CẤU TRÚC — cột `attempt_skills.huy_vang` (T3, vắng lần 2), `assessment_scores.no_show_cu` (T23, "-" ở MT cũ) và bảng
 * `ket_qua_huy` (T2, điểm MT bị dời vượt). Không điền ngược:
 * cờ MT cũ (`lich_su`) của lượt có sẵn giữ nguyên, đề nghị dời lần 2 đang chờ giữ nguyên (Quản lý vẫn duyệt / từ chối như cũ).
 * Tự kiểm cột / bảng nên chạy lặp được; lần hai không báo gì. Cùng định nghĩa nằm trong `schema.sql`.
 */
export function migratePrMta(conn: any, applied: string[]) {
  const coCot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('attempt_skills') as any[]).some((x) => x.name === 'huy_vang');
  if (!coCot) {
    conn.exec('ALTER TABLE attempt_skills ADD COLUMN huy_vang INTEGER NOT NULL DEFAULT 0');
    applied.push('PR-MTa: cột attempt_skills.huy_vang');
  }
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).some((x) => x.name === 'no_show_cu')) {
    conn.exec('ALTER TABLE assessment_scores ADD COLUMN no_show_cu INTEGER NOT NULL DEFAULT 0');
    applied.push('PR-MTa: cột assessment_scores.no_show_cu');
  }
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ket_qua_huy'").get()) {
    conn.exec(`CREATE TABLE ket_qua_huy (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  vuot_boi_attempt_id INTEGER REFERENCES assessment_attempts(id),
  diem_json TEXT NOT NULL,
  lich_json TEXT NOT NULL,
  so_diem INTEGER NOT NULL,
  ly_do TEXT NOT NULL,
  huy_boi INTEGER REFERENCES users(id), huy_luc TEXT NOT NULL,
  khoi_phuc_boi INTEGER REFERENCES users(id), khoi_phuc_luc TEXT, ly_do_khoi_phuc TEXT
)`);
    conn.exec('CREATE INDEX idx_ket_qua_huy_attempt ON ket_qua_huy(attempt_id)');
    applied.push('PR-MTa: bảng ket_qua_huy');
  }
}
