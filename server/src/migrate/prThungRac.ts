/**
 * Q-RL2a THÙNG RÁC (N24 ②, chủ SP 29/10): bảng `thung_rac` — bản chụp các dòng mà thao tác xoá (Case, PA, vi phạm, tệp bằng chứng…) xoá / đặt NULL,
 * để Hoàn tác và Khôi phục (Quản trị › Đã xoá) trong `GIU_NGAY` ngày. Chỉ thêm bảng, chạy lặp được. Cùng định nghĩa trong `schema.sql`.
 */
export const THUNG_RAC_SQL = `CREATE TABLE thung_rac (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loai TEXT NOT NULL,
  doi_tuong_id INTEGER NOT NULL,
  nhan TEXT NOT NULL,
  hoc_vien_id INTEGER,
  class_id INTEGER,
  branch_id INTEGER,
  du_lieu TEXT NOT NULL,
  xoa_boi INTEGER,
  xoa_luc TEXT NOT NULL,
  khoi_phuc_boi INTEGER,
  khoi_phuc_luc TEXT,
  het_han_luc TEXT
);
CREATE INDEX ix_thung_rac_luc ON thung_rac (xoa_luc);
CREATE INDEX ix_thung_rac_doi_tuong ON thung_rac (loai, doi_tuong_id);`;

export function migratePrThungRac(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'thung_rac'").get()) return;
  conn.exec(THUNG_RAC_SQL);
  applied.push('Q-RL2a THUNG-RAC: bảng thung_rac (bản chụp mục đã xoá — Hoàn tác / Khôi phục 30 ngày).');
}
