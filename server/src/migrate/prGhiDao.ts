/**
 * Q-RL2c GHI-DAO (N24 ②, chủ SP 29/10): bảng `ghi_dao` — nhật ký để HOÀN TÁC thao tác đổi trạng thái (Kết thúc PA, Bỏ việc Báo PH / Phối hợp SOS,
 * Duyệt / Từ chối ở Chờ duyệt): dòng bị sửa (trước + sau) và dòng thêm (`platform/ghiDao.ts`). Chỉ thêm bảng, chạy lặp được. Cùng định nghĩa trong `schema.sql`.
 */
export const GHI_DAO_SQL = `CREATE TABLE ghi_dao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loai TEXT NOT NULL,
  bang TEXT NOT NULL,
  doi_tuong_id INTEGER NOT NULL,
  du_lieu TEXT NOT NULL,
  nguoi INTEGER,
  luc TEXT NOT NULL,
  dao_boi INTEGER,
  dao_luc TEXT
);
CREATE INDEX ix_ghi_dao_doi_tuong ON ghi_dao (bang, doi_tuong_id, loai);`;

export function migratePrGhiDao(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ghi_dao'").get()) return;
  conn.exec(GHI_DAO_SQL);
  applied.push('Q-RL2c GHI-DAO: bảng ghi_dao (nhật ký để Hoàn tác thao tác đổi trạng thái).');
}
