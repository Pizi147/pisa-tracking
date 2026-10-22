/**
 * SV-S-EXPERT: bảng `s_expert` (lượt Speaking với chuyên gia — V5 `10` mục 2, `08` mục 5). CHỈ CẤU TRÚC — cùng định nghĩa trong `schema.sql`. Chạy lại không làm gì.
 */
export function migratePrSvSExpert(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 AS c FROM sqlite_master WHERE type = 'table' AND name = 's_expert'").get()) return migrateXoaMem(conn, applied);
  conn.exec(`CREATE TABLE s_expert (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  tuan TEXT NOT NULL,
  ngay TEXT,
  diem REAL,
  nhan_xet TEXT,
  cham_boi INTEGER REFERENCES users(id),
  cham_luc TEXT,
  them_boi INTEGER REFERENCES users(id),
  them_luc TEXT NOT NULL,
  sua_boi INTEGER REFERENCES users(id),
  sua_luc TEXT,
  xoa_luc TEXT,
  xoa_boi INTEGER REFERENCES users(id)
)`);
  conn.exec('CREATE INDEX idx_s_expert_tuan ON s_expert(tuan, student_id)');
  conn.exec('CREATE INDEX idx_s_expert_hv ON s_expert(student_id)');
  applied.push('SV-S-EXPERT: bảng s_expert (lượt S Expert). Dữ liệu cũ giữ nguyên.');
}

/** SV-LOP (nợ rà #526): xoá mềm lượt S Ex — chỉ thêm 2 cột, dữ liệu cũ giữ nguyên, chạy lại không làm gì. */
function migrateXoaMem(conn: any, applied: string[]) {
  if ((conn.prepare("SELECT name FROM pragma_table_info('s_expert')").all() as any[]).some((c) => c.name === 'xoa_luc')) return;
  conn.exec('ALTER TABLE s_expert ADD COLUMN xoa_luc TEXT');
  conn.exec('ALTER TABLE s_expert ADD COLUMN xoa_boi INTEGER REFERENCES users(id)');
  applied.push('SV-LOP: s_expert thêm xoa_luc, xoa_boi (xoá mềm + khôi phục lượt S Expert).');
}
