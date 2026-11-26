/**
 * LPB-0 (N73, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md`, sửa bởi `…/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md`),
 * chạy lặp không đổi, khớp `schema.sql`, chỉ THÊM (không đổi dữ liệu — việc chỉ sinh theo lệnh / lần lưu phân công MỚI):
 *   1. `viec_bao_ph.lenh_chuyen_id` + `lenh_mau` (việc TVV "Báo PH · Chuyển lớp").
 *   2. Bảng `viec_nhan_tin` + `viec_nhan_tin_dong` (việc BPXL "Nhận thông tin · Chuyển lớp / Đổi GV").
 */
const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);
const coCot = (conn: any, bang: string, cot: string) => (conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot);

export const BANG_VIEC_NHAN_TIN = `CREATE TABLE IF NOT EXISTS viec_nhan_tin (
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  branch_id INTEGER,
  trang_thai TEXT NOT NULL DEFAULT 'mo',
  han TEXT NOT NULL, han_chon TEXT,
  nguoi_luat INTEGER REFERENCES users(id),
  phu_trach_id INTEGER REFERENCES users(id), giao_boi INTEGER REFERENCES users(id), giao_luc TEXT,
  tao_boi INTEGER REFERENCES users(id), tao_luc TEXT NOT NULL,
  xong_boi INTEGER REFERENCES users(id), xong_luc TEXT, bo_ly_do TEXT, bo_luc TEXT
)`;
export const BANG_VIEC_NHAN_TIN_DONG = `CREATE TABLE IF NOT EXISTS viec_nhan_tin_dong (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viec_id INTEGER NOT NULL REFERENCES viec_nhan_tin(id),
  lenh_id INTEGER, doi_id INTEGER, mau TEXT
)`;
const CHI_MUC: [string, string][] = [
  ['idx_viec_bao_ph_lenh', 'CREATE INDEX IF NOT EXISTS idx_viec_bao_ph_lenh ON viec_bao_ph(lenh_chuyen_id) WHERE lenh_chuyen_id IS NOT NULL'],
  ['idx_viec_nhan_tin_lop', 'CREATE INDEX IF NOT EXISTS idx_viec_nhan_tin_lop ON viec_nhan_tin(class_id, loai, trang_thai)'],
  ['idx_viec_nhan_tin_luat', "CREATE INDEX IF NOT EXISTS idx_viec_nhan_tin_luat ON viec_nhan_tin(nguoi_luat) WHERE trang_thai = 'mo'"],
  ['idx_viec_nhan_tin_giao', 'CREATE INDEX IF NOT EXISTS idx_viec_nhan_tin_giao ON viec_nhan_tin(phu_trach_id) WHERE phu_trach_id IS NOT NULL'],
  ['idx_viec_nhan_tin_xong', 'CREATE INDEX IF NOT EXISTS idx_viec_nhan_tin_xong ON viec_nhan_tin(xong_boi) WHERE xong_boi IS NOT NULL'],
  ['idx_vnt_dong_viec', 'CREATE INDEX IF NOT EXISTS idx_vnt_dong_viec ON viec_nhan_tin_dong(viec_id)'],
  ['idx_vnt_dong_lenh', 'CREATE INDEX IF NOT EXISTS idx_vnt_dong_lenh ON viec_nhan_tin_dong(lenh_id) WHERE lenh_id IS NOT NULL'],
  ['idx_vnt_dong_doi', 'CREATE INDEX IF NOT EXISTS idx_vnt_dong_doi ON viec_nhan_tin_dong(doi_id) WHERE doi_id IS NOT NULL'],
];

export function migratePrLpb0(conn: any, applied: string[]) {
  if (!co(conn, 'viec_bao_ph') || !co(conn, 'classes') || !co(conn, 'users') || !co(conn, 'lenh_chuyen_lop')) return;
  const them: string[] = [];
  for (const cot of ['lenh_chuyen_id INTEGER', 'lenh_mau TEXT']) {
    if (!coCot(conn, 'viec_bao_ph', cot.split(' ')[0])) { conn.exec(`ALTER TABLE viec_bao_ph ADD COLUMN ${cot}`); them.push(`cột viec_bao_ph.${cot.split(' ')[0]}`); }
  }
  if (!co(conn, 'viec_nhan_tin')) { conn.exec(BANG_VIEC_NHAN_TIN); them.push('bảng viec_nhan_tin'); }
  if (!co(conn, 'viec_nhan_tin_dong')) { conn.exec(BANG_VIEC_NHAN_TIN_DONG); them.push('bảng viec_nhan_tin_dong'); }
  for (const [ten, sql] of CHI_MUC) if (!co(conn, ten)) conn.exec(sql);
  if (them.length) applied.push(`LPB-0: ${them.join(', ')}.`);
}
