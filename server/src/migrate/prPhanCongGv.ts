/**
 * PC-GV-A: bảng `doi_phan_cong` — mỗi dòng một ô đổi người của một lớp (`khoa` = 'gvcn' | kỹ năng), có hiệu lực: `da_ap` (đã ghi vào
 * teacher_assignments), `cho` (từ tuần sau — quét tới hạn như `lenh_chuyen_lop`), `huy`. `lo` = id dòng đầu của lần lưu (khoá Hoàn tác).
 * `xem_den`: GV cũ chỉ xem lớp tới ngày này. Chỉ thêm bảng, chạy lặp được. Cùng định nghĩa trong `schema.sql`.
 */
export const DOI_PHAN_CONG_SQL = `CREATE TABLE doi_phan_cong (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lo INTEGER,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  khoa TEXT NOT NULL,
  nguoi_cu INTEGER REFERENCES users(id),
  nguoi_moi INTEGER REFERENCES users(id),
  hieu_luc TEXT NOT NULL,
  trang_thai TEXT NOT NULL,
  tao_ban_giao INTEGER NOT NULL DEFAULT 0,
  xem_den TEXT,
  tao_boi INTEGER NOT NULL REFERENCES users(id),
  tao_luc TEXT NOT NULL,
  ap_luc TEXT,
  huy_luc TEXT,
  huy_boi INTEGER,
  ly_do_huy TEXT,
  loi TEXT,
  thu_ngay TEXT
);
CREATE INDEX ix_doi_pc_lop ON doi_phan_cong (class_id, trang_thai);
CREATE INDEX ix_doi_pc_cu ON doi_phan_cong (nguoi_cu, trang_thai);
CREATE INDEX ix_doi_pc_cho ON doi_phan_cong (trang_thai, hieu_luc);`;

export function migratePrPhanCongGv(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'doi_phan_cong'").get()) return;
  conn.exec(DOI_PHAN_CONG_SQL);
  applied.push('PC-GV-A: bảng doi_phan_cong (đổi phân công có hiệu lực, lịch đổi tương lai, GV cũ chỉ xem có hạn).');
}
