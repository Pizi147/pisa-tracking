/**
 * LPB-1 (N73 ⑤, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md` mục 4.5): KHUNG việc chung (Phụ trách · Hạn · Theo dõi ·
 * Việc con) cho việc TVV, Bàn giao, việc quản lý của Head — theo mẫu `viec_xu_ly` (BAOPH-0): việc vẫn TÍNH khi đọc như nay; bảng phụ chỉ có dòng khi có người
 * giao / đặt hạn / mô tả / theo dõi (`damBaoDong`). id = đơn vị việc đang có ở Công việc (lộ trình · em · lớp · mốc PA); Bàn giao môn = (lớp, môn) → id riêng.
 * Bàn giao đổi GV dùng cột ngay trên `ban_giao_gv` (đã có dòng mỗi việc). Chỉ THÊM, chạy lặp không đổi, khớp `schema.sql`.
 */
const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);
const coCot = (conn: any, bang: string, cot: string) => (conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot);

/** Bảng phụ id = đơn vị việc (`viec_ban_giao_mon`: id riêng + lớp, môn). */
export const BANG_KHUNG = ['viec_chot_ngay_thi', 'viec_buoc_tiep', 'viec_thi_that', 'viec_bo_sung_ho_so', 'viec_ban_giao', 'viec_chot_lo_trinh', 'viec_xet_lai', 'viec_xep_lich_mt'] as const;
const COT = `trang_thai TEXT NOT NULL DEFAULT 'mo', han_chon TEXT,
  phu_trach_id INTEGER REFERENCES users(id), giao_boi INTEGER REFERENCES users(id), giao_luc TEXT, tao_luc TEXT NOT NULL, xong_luc TEXT`;
export const bangKhung = (ten: string) => `CREATE TABLE IF NOT EXISTS ${ten} (
  id INTEGER PRIMARY KEY,
  ${COT}
)`;
export const BANG_BAN_GIAO_MON = `CREATE TABLE IF NOT EXISTS viec_ban_giao_mon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id INTEGER NOT NULL REFERENCES classes(id), mon TEXT NOT NULL,
  ${COT}
)`;
const chiMuc = (ten: string) => `CREATE INDEX IF NOT EXISTS idx_${ten}_giao ON ${ten}(phu_trach_id) WHERE phu_trach_id IS NOT NULL`;

export function migratePrLpb1(conn: any, applied: string[]) {
  if (!co(conn, 'users') || !co(conn, 'classes') || !co(conn, 'ban_giao_gv')) return;
  const them: string[] = [];
  for (const b of BANG_KHUNG) if (!co(conn, b)) { conn.exec(bangKhung(b)); them.push(b); }
  if (!co(conn, 'viec_ban_giao_mon')) { conn.exec(BANG_BAN_GIAO_MON); them.push('viec_ban_giao_mon'); }
  if (!co(conn, 'uq_viec_ban_giao_mon')) conn.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_viec_ban_giao_mon ON viec_ban_giao_mon(lop_id, mon)');
  for (const b of [...BANG_KHUNG, 'viec_ban_giao_mon']) if (!co(conn, `idx_${b}_giao`)) conn.exec(chiMuc(b));
  for (const cot of ['phu_trach_id INTEGER REFERENCES users(id)', 'giao_boi INTEGER REFERENCES users(id)', 'giao_luc TEXT', 'han_chon TEXT']) {
    const ten = cot.split(' ')[0];
    if (!coCot(conn, 'ban_giao_gv', ten)) { conn.exec(`ALTER TABLE ban_giao_gv ADD COLUMN ${cot}`); them.push(`cột ban_giao_gv.${ten}`); }
  }
  if (!co(conn, 'idx_ban_giao_gv_giao')) conn.exec(chiMuc('ban_giao_gv'));
  if (them.length) applied.push(`LPB-1: ${them.join(', ')}.`);
}
