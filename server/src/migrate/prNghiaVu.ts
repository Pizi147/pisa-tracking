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
  const coKn = conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_skill_lich_su'`).get();
  conn.exec('CREATE TABLE IF NOT EXISTS user_skill_lich_su (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, skill TEXT NOT NULL, tu TEXT NOT NULL, den TEXT)');
  conn.exec('CREATE INDEX IF NOT EXISTS idx_user_skill_lich_su ON user_skill_lich_su(skill, user_id)');
  /* Nạp hiện trạng làm mốc (chủ SP 10/11): kỹ năng đang có coi là có từ trước — lần đổi sau mới ghi ngày. */
  if (!coKn) conn.exec(`INSERT INTO user_skill_lich_su (user_id, skill, tu) SELECT user_id, skill, '2000-01-01' FROM user_skills`);
  /* Chủ SP 10/11 (em chuyển lớp): nhật ký đổi hạn ghi người giữ việc lớp cũ + ngày chuyển. */
  for (const [cot, kieu] of [['nguoi_cu', 'INTEGER'], ['ngay', 'TEXT']]) {
    if (!conn.prepare(`SELECT 1 FROM pragma_table_info('viec_han_lan') WHERE name = ?`).get(cot)) conn.exec(`ALTER TABLE viec_han_lan ADD COLUMN ${cot} ${kieu}`);
  }
  /* PR-2 (Task 7a): bộ đếm lần ghi qua API (`luiMocQuetSauGhi`) — GET đọc sổ việc thấy đổi thì ghi lại sổ việc chi nhánh (`lamMoiViec`). */
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'moc_he_thong'`).get()) conn.exec(`INSERT OR IGNORE INTO moc_he_thong (khoa, so) VALUES ('so-viec', 0)`);
  conn.exec('CREATE TABLE IF NOT EXISTS nghia_vu_lech (id INTEGER PRIMARY KEY, khoa TEXT NOT NULL, truoc TEXT, sau TEXT, luc TEXT NOT NULL)');
  if (!co) applied.push('SỔ NGHĨA VỤ: tạo bảng nghia_vu (chưa có dòng — nạp ở prNghiaVuNap).');
  if (!coKn) applied.push('SỔ NGHĨA VỤ: tạo bảng user_skill_lich_su (lịch sử kỹ năng GV, nạp kỹ năng hiện có làm mốc).');
}
