/**
 * PR-CT (lệnh chuyển lớp do Quản lý quyết + bàn giao, §3.1f): CHỈ ĐỔI CẤU TRÚC — hai bảng mới. KHÔNG chuyển dữ liệu cũ, không lệnh chạy thử
 * (DB được reset trước bản chính). Tự kiểm bảng nên chạy lặp được; lần hai không báo gì. Bảng mới cũng nằm CUỐI `schema.sql`.
 */
const coBang = (conn: any, bang: string) => !!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(bang);

export function migratePrCt(conn: any, applied: string[]) {
  if (!coBang(conn, 'lenh_chuyen_lop')) {
    conn.exec(`CREATE TABLE lenh_chuyen_lop (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  lop_nguon_id INTEGER NOT NULL REFERENCES classes(id),
  lop_dich_id INTEGER REFERENCES classes(id),
  huong TEXT NOT NULL,
  boi_canh TEXT NOT NULL,
  tuan_bat_dau TEXT NOT NULL,
  muc_tieu REAL, khong_cam_ket INTEGER NOT NULL DEFAULT 0, ngay_thi TEXT, ngay_xem_lai TEXT,
  ly_do TEXT, khac_goi_y INTEGER NOT NULL DEFAULT 0,
  nguoi_ra_lenh INTEGER NOT NULL REFERENCES users(id), ngay_ra_lenh TEXT NOT NULL,
  tu_yeu_cau_id INTEGER REFERENCES yeu_cau_duyet(id),
  trang_thai TEXT NOT NULL DEFAULT 'cho',
  thi_hanh_luc TEXT, loi TEXT,
  huy_boi INTEGER REFERENCES users(id), huy_luc TEXT, ly_do_huy TEXT,
  han_gvbm TEXT, han_gvcn TEXT,
  nhan_xet_chung TEXT, tu_dien TEXT,
  xac_nhan_boi INTEGER REFERENCES users(id), xac_nhan_luc TEXT, xac_nhan_thay INTEGER NOT NULL DEFAULT 0,
  tao_luc TEXT NOT NULL, sua_luc TEXT,
  thu_ngay TEXT
)`);
    applied.push('Thêm bảng lệnh chuyển lớp (Quản lý quyết, thi hành đúng Thứ Hai tuần bắt đầu, phiếu bàn giao)');
  } else if (!(conn.prepare('PRAGMA table_info(lenh_chuyen_lop)').all() as any[]).some((c) => c.name === 'thu_ngay')) {
    conn.exec('ALTER TABLE lenh_chuyen_lop ADD COLUMN thu_ngay TEXT');
    applied.push('Lệnh chuyển lớp: thêm ngày thử thi hành bị lỗi (thử lại một lần mỗi ngày)');
  }
  /* PR-S5F-a: chỉ mục tạo bù cả khi bảng đã có (DB dựng dở giữa chừng) — chỉ mục duy nhất là thứ chặn lệnh "cho" thứ hai. */
  const chiMuc = new Set((conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'lenh_chuyen_lop'`).all() as any[]).map((r) => r.name as string));
  const CHI_MUC: [string, string][] = [
    ['ux_lenh_cho_hv', `CREATE UNIQUE INDEX ux_lenh_cho_hv ON lenh_chuyen_lop (student_id) WHERE trang_thai = 'cho'`],
    ['ix_lenh_den_han', 'CREATE INDEX ix_lenh_den_han ON lenh_chuyen_lop (trang_thai, tuan_bat_dau)'],
    ['ix_lenh_nguon', 'CREATE INDEX ix_lenh_nguon ON lenh_chuyen_lop (lop_nguon_id, trang_thai)'],
    ['ix_lenh_dich', 'CREATE INDEX ix_lenh_dich ON lenh_chuyen_lop (lop_dich_id, trang_thai)'],
  ];
  const thieu = CHI_MUC.filter(([ten]) => !chiMuc.has(ten));
  for (const [, sql] of thieu) conn.exec(sql);
  if (thieu.length && chiMuc.size) applied.push(`Lệnh chuyển lớp: tạo bù ${thieu.length} chỉ mục`);
  if (!coBang(conn, 'ban_giao_mon')) {
    conn.exec(`CREATE TABLE ban_giao_mon (
  id INTEGER PRIMARY KEY,
  lenh_id INTEGER NOT NULL REFERENCES lenh_chuyen_lop(id),
  mon TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  nguoi_ghi INTEGER NOT NULL REFERENCES users(id), dien_thay INTEGER NOT NULL DEFAULT 0, ghi_luc TEXT NOT NULL,
  UNIQUE (lenh_id, mon)
)`);
    applied.push('Thêm bảng dòng bàn giao theo môn của giáo viên bộ môn');
  }
}
