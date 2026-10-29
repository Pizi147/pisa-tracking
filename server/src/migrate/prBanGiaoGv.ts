/**
 * PR-B BÀN GIAO ĐỔI GV: ba bảng mới (không đụng `ban_giao_mon` của chuyển lớp — khoá theo lệnh một em, khác hẳn).
 * `ban_giao_gv` một việc (lớp, GV cũ, hiệu lực) · `ban_giao_gv_mon` mỗi cột (kỹ năng hoặc 'gvcn') một người nhận, trỏ dòng `doi_phan_cong`
 * · `ban_giao_gv_em` góp ý mỗi em mỗi cột. Chỉ thêm bảng, chạy lặp được. Cùng định nghĩa trong `schema.sql`.
 */
export const BAN_GIAO_GV_SQL = `CREATE TABLE ban_giao_gv (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  nguoi_cu INTEGER NOT NULL REFERENCES users(id),
  nguoi_lam INTEGER REFERENCES users(id),
  hieu_luc TEXT NOT NULL,
  han TEXT NOT NULL,
  trang_thai TEXT NOT NULL,
  nhan_xet_chung TEXT,
  tu_dien TEXT,
  tao_luc TEXT NOT NULL,
  tao_boi INTEGER NOT NULL REFERENCES users(id),
  xong_luc TEXT,
  xong_boi INTEGER,
  xong_thay INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ix_bg_gv_lop ON ban_giao_gv (class_id, trang_thai);
CREATE INDEX ix_bg_gv_cu ON ban_giao_gv (nguoi_cu, trang_thai);
CREATE TABLE ban_giao_gv_mon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ban_giao_id INTEGER NOT NULL REFERENCES ban_giao_gv(id),
  mon TEXT NOT NULL,
  nguoi_moi INTEGER NOT NULL REFERENCES users(id),
  doi_id INTEGER NOT NULL REFERENCES doi_phan_cong(id),
  trang_thai TEXT NOT NULL
);
CREATE INDEX ix_bg_gv_mon_doi ON ban_giao_gv_mon (doi_id);
CREATE INDEX ix_bg_gv_mon_bg ON ban_giao_gv_mon (ban_giao_id);
CREATE TABLE ban_giao_gv_em (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ban_giao_id INTEGER NOT NULL REFERENCES ban_giao_gv(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  mon TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  nguoi_ghi INTEGER NOT NULL REFERENCES users(id),
  dien_thay INTEGER NOT NULL DEFAULT 0,
  ghi_luc TEXT NOT NULL,
  UNIQUE (ban_giao_id, student_id, mon)
);`;

export function migratePrBanGiaoGv(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ban_giao_gv'").get()) return;
  conn.exec(BAN_GIAO_GV_SQL);
  applied.push('PR-B: bảng ban_giao_gv · ban_giao_gv_mon · ban_giao_gv_em (việc bàn giao khi đổi GV).');
}
