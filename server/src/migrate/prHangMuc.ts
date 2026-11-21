/**
 * VH-1b (N62, chủ SP 21/11 — giao việc tay vào hạng mục + Mô tả), chạy lặp không đổi, khớp `schema.sql`, chỉ THÊM (không đổi dữ liệu):
 *   1. Cột `tasks.hang_muc` (NULL = theo nhóm / tab Vận hành — mọi việc cũ giữ nguyên chỗ).
 *   2. Bảng `viec_mo_ta` (mô tả tuỳ chọn của việc N58, khoá (loai, ref_id)).
 * Tự lành: thiếu cột / bảng nào thì thêm cái đó.
 */
const BANG_MO_TA = `CREATE TABLE IF NOT EXISTS viec_mo_ta (
  loai TEXT NOT NULL, ref_id INTEGER NOT NULL, noi_dung TEXT NOT NULL, sua_boi INTEGER REFERENCES users(id), sua_luc TEXT NOT NULL,
  PRIMARY KEY (loai, ref_id)
)`;

const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);

export function migratePrHangMuc(conn: any, applied: string[]) {
  if (!co(conn, 'tasks') || !co(conn, 'users')) return;
  const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info('tasks')`).all() as any[]).map((c) => c.name as string));
  if (!cot.has('hang_muc')) {
    conn.exec('ALTER TABLE tasks ADD COLUMN hang_muc TEXT');
    applied.push('VH-1b: thêm tasks.hang_muc (hạng mục chính thống của việc tay; NULL = tab Vận hành).');
  }
  if (!co(conn, 'viec_mo_ta')) {
    conn.exec(BANG_MO_TA);
    applied.push('VH-1b: bảng viec_mo_ta (mô tả tuỳ chọn của việc có khối giao việc).');
  }
}
