import { demoToday } from '../demoConfig.ts';
import { MOC_TU_GIU, tapXetLaiChiDoc } from '../normal/xetLai.ts';

/**
 * P9a XET-LAI (N21): bảng `xet_lai_lo_trinh` — quyết định Xét lại lộ trình của QL (Tiếp tục · Học lại · Tạm dừng/ Kết thúc học, cả dòng tự ghi
 * khi hết hạn) và nhận xét của GVCN lớp mới (dòng `quyet_dinh` NULL). Cùng định nghĩa trong `schema.sql`.
 * Cùng lần tạo bảng (một lần): ghi mốc deploy cho luật tự giữ; thẻ "Mini Test chưa đạt" (`bao_len_mini_test`) đang chờ → đóng khi em có dòng (d)
 * của đúng Mini Test đó. Bảng đã có → không làm gì.
 */
export const XET_LAI_SQL = `CREATE TABLE xet_lai_lo_trinh (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  lenh_id INTEGER NOT NULL REFERENCES lenh_chuyen_lop(id),
  lop_id INTEGER REFERENCES classes(id),
  ly_do_ma TEXT,
  moc TEXT,
  quyet_dinh TEXT,
  chu TEXT,
  lenh_moi_id INTEGER REFERENCES lenh_chuyen_lop(id),
  lenh_cu TEXT,
  quyet_cu TEXT,
  ly_do_text TEXT,
  tu_dong INTEGER NOT NULL DEFAULT 0,
  nhan_xet_gvcn_moi TEXT,
  nguoi_id INTEGER REFERENCES users(id),
  luc TEXT NOT NULL
);
CREATE INDEX ix_xet_lai_hv ON xet_lai_lo_trinh (student_id, lenh_id);
CREATE UNIQUE INDEX ux_xet_lai_tu_dong ON xet_lai_lo_trinh (student_id, lenh_id, moc) WHERE tu_dong = 1;`;

export function migratePrXetLai(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'xet_lai_lo_trinh'").get()) return;
  conn.exec(XET_LAI_SQL);
  /* Mốc deploy (cùng lần tạo bảng): mục Xét lại hết hạn TRƯỚC mốc không tự ghi "Tiếp tục" — chỉ mục có hạn từ mốc trở đi. DB dựng bằng mã
     hiện hành (schema.sql) không có mốc = không giới hạn. */
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(MOC_TU_GIU, demoToday(), new Date().toISOString());
  applied.push(`P9a XET-LAI: bảng xet_lai_lo_trinh (quyết định Xét lại lộ trình + nhận xét GVCN lớp mới); mốc tự giữ từ ${demoToday()}.`);
  /* MỘT lần, cùng lần tạo bảng: thẻ "Mini Test chưa đạt" đang chờ → đóng CHỈ khi em có dòng (d) của ĐÚNG Mini Test đó; thẻ khác giữ nguyên. */
  const cho = conn.prepare(`SELECT id, doi_tuong_id FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_loai = 'mini_test' AND trang_thai = 'cho'`).all() as any[];
  if (!cho.length) return;
  const coD = new Set(tapXetLaiChiDoc(demoToday()).map((e) => e.miniTestId).filter((x) => x !== undefined));
  const the = cho.filter((y) => coD.has(y.doi_tuong_id));
  const dong = conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'tu_dong', ly_do_dong = 'Chuyển sang Xét lại lộ trình', xu_ly_luc = ? WHERE id = ? AND trang_thai = 'cho'`);
  for (const y of the) dong.run(new Date().toISOString(), y.id);
  if (the.length) applied.push(`P9a XET-LAI: ${the.length} thẻ "Mini Test chưa đạt" đang chờ → đóng, em hiện ở việc Xét lại lộ trình (dòng (d)).`);
}
