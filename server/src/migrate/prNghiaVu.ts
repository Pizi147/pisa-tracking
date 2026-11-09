/**
 * SỔ NGHĨA VỤ (chủ SP 09/11, spec `2026-11-09-so-nghia-vu-design.md` mục 2.1): bảng `nghia_vu` — mỗi bài phải chấm / việc có hạn một dòng, do `ghiSo`
 * (`phanTich/soNghiaVu.ts`) duy trì. Chỉ tạo bảng + chỉ mục (chạy lặp không làm gì). `tuan`: Thứ Hai tuần thi của bài (mốc W4 OCT xét theo tuần thi, spec 1.6).
 */
export const NGHIA_VU_SQL = `CREATE TABLE IF NOT EXISTS nghia_vu (
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL CHECK (loai IN ('bai', 'viec')),
  kieu TEXT NOT NULL,
  khoa TEXT NOT NULL UNIQUE,
  chi_nhanh INTEGER, lop INTEGER, hoc_vien INTEGER,
  nguoi INTEGER,
  s_cheo INTEGER NOT NULL DEFAULT 0,
  han_goc TEXT, han TEXT, tuan TEXT,
  pc_nhap_sau INTEGER NOT NULL DEFAULT 0,
  xong_luc TEXT, nguoi_lam INTEGER,
  khong_tinh TEXT,
  cap_nhat TEXT NOT NULL
)`;

export function migratePrNghiaVu(conn: any, applied: string[]) {
  const co = conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'nghia_vu'`).get();
  conn.exec(NGHIA_VU_SQL);
  conn.exec('CREATE INDEX IF NOT EXISTS idx_nghia_vu_cn_han ON nghia_vu(chi_nhanh, han)');
  conn.exec('CREATE INDEX IF NOT EXISTS idx_nghia_vu_nguoi_han ON nghia_vu(nguoi, han)');
  const coKn = conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ky_nang_lan'`).get();
  conn.exec('CREATE TABLE IF NOT EXISTS ky_nang_lan (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, skill TEXT NOT NULL, tu TEXT NOT NULL, den TEXT)');
  conn.exec('CREATE INDEX IF NOT EXISTS idx_ky_nang_lan ON ky_nang_lan(skill, user_id)');
  conn.exec('CREATE TABLE IF NOT EXISTS nghia_vu_lech (id INTEGER PRIMARY KEY, khoa TEXT NOT NULL, truoc TEXT, sau TEXT, luc TEXT NOT NULL)');
  if (!co) applied.push('SỔ NGHĨA VỤ: tạo bảng nghia_vu (chưa có dòng — nạp ở prNghiaVuNap).');
  if (!coKn) applied.push('SỔ NGHĨA VỤ: tạo bảng ky_nang_lan (lịch sử kỹ năng GV; người chưa có lịch sử đọc kỹ năng hiện tại).');
}
