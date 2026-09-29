/**
 * PR-YT4 (Ý thức v4, §5.4, H5): CHỈ ĐỔI CẤU TRÚC — hai cột Ghi nhận của vi phạm, ngày QL quyết của lần xử lý, bảng khai bậc.
 * KHÔNG sửa hay chuyển dữ liệu cũ (Q2 — DB được reset trước bản chính). Mỗi bước tự kiểm nên chạy lặp được; lần hai không báo gì.
 */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
const coBang = (conn: any, bang: string) => !!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(bang);

export function migratePrYt4(conn: any, applied: string[]) {
  if (!coCot(conn, 'violations', 'ghi_nhan_luc')) {
    conn.exec('ALTER TABLE violations ADD COLUMN ghi_nhan_luc TEXT');
    applied.push('Vi phạm: thêm ngày GVCN Ghi nhận (Ý thức v4)');
  }
  if (!coCot(conn, 'violations', 'ghi_nhan_boi')) {
    conn.exec('ALTER TABLE violations ADD COLUMN ghi_nhan_boi INTEGER REFERENCES users(id)');
    applied.push('Vi phạm: thêm người Ghi nhận (Ý thức v4)');
  }
  if (!coCot(conn, 'discipline_measures', 'quyet_luc')) {
    conn.exec('ALTER TABLE discipline_measures ADD COLUMN quyet_luc TEXT');
    applied.push('Lần xử lý Ý thức: thêm ngày QL duyệt / từ chối');
  }
  if (!coBang(conn, 'y_thuc_khai_bac')) {
    conn.exec(`CREATE TABLE y_thuc_khai_bac (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  chuoi_cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),
  bac INTEGER NOT NULL, thang TEXT, ghi_chu TEXT NOT NULL,
  khai_boi INTEGER REFERENCES users(id), khai_luc TEXT NOT NULL,
  sua_boi INTEGER REFERENCES users(id), sua_luc TEXT,
  UNIQUE (student_id, chuoi_cycle_id)
)`);
    applied.push('Thêm bảng khai bậc Ý thức trước khi dùng web (H5)');
  }
}
