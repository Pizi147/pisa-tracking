/**
 * P9a XET-LAI (N21): bảng `xet_lai_lo_trinh` — quyết định Xét lại lộ trình của QL (Tiếp tục · Học lại · Tạm dừng/ Kết thúc học, cả dòng tự ghi
 * khi hết hạn) và nhận xét của GVCN lớp mới (dòng `quyet_dinh` NULL). Cùng định nghĩa trong `schema.sql`.
 * Thẻ "Mini Test chưa đạt" (`bao_len_mini_test`) đang chờ → tự đóng: Mini Test < 70 % giờ là dòng (d) của Xét lại (tính khi đọc, không cần sinh).
 * Chạy lại không làm gì.
 */
export const XET_LAI_SQL = `CREATE TABLE xet_lai_lo_trinh (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  lenh_id INTEGER NOT NULL REFERENCES lenh_chuyen_lop(id),
  ly_do_ma TEXT,
  moc TEXT,
  quyet_dinh TEXT,
  lenh_moi_id INTEGER REFERENCES lenh_chuyen_lop(id),
  lenh_cu TEXT,
  ly_do_text TEXT,
  tu_dong INTEGER NOT NULL DEFAULT 0,
  nhan_xet_gvcn_moi TEXT,
  nguoi_id INTEGER REFERENCES users(id),
  luc TEXT NOT NULL
);
CREATE INDEX ix_xet_lai_hv ON xet_lai_lo_trinh (student_id, lenh_id);
CREATE UNIQUE INDEX ux_xet_lai_tu_dong ON xet_lai_lo_trinh (student_id, lenh_id, moc) WHERE tu_dong = 1;`;

export function migratePrXetLai(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'xet_lai_lo_trinh'").get()) {
    conn.exec(XET_LAI_SQL);
    applied.push('P9a XET-LAI: bảng xet_lai_lo_trinh (quyết định Xét lại lộ trình + nhận xét GVCN lớp mới).');
  }
  const n = conn.prepare(
    `UPDATE yeu_cau_duyet SET trang_thai = 'tu_dong', ly_do_dong = 'Chuyển sang Xét lại lộ trình', xu_ly_luc = ? WHERE loai = 'bao_len_mini_test' AND trang_thai = 'cho'`,
  ).run(new Date().toISOString()).changes as number;
  if (n) applied.push(`P9a XET-LAI: ${n} thẻ "Mini Test chưa đạt" đang chờ → đóng, em hiện ở việc Xét lại lộ trình.`);
}
