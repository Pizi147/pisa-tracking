/**
 * SV-BAI-LOP-2 (M5): `bai_tren_lop` — tên bài / điểm / thang bỏ NOT NULL + thêm cột `band`. SQLite không bỏ NOT NULL tại chỗ → dựng lại bảng
 * (tạo bảng mới, chép mọi dòng giữ id, xoá bảng cũ, đổi tên, tạo lại chỉ mục). Cùng định nghĩa trong `schema.sql`. Đã có `band` → không làm gì.
 * Chạy trong `migrate.ts` (foreign_keys = OFF, một giao dịch); không bảng nào trỏ khoá ngoài vào `bai_tren_lop`.
 */
export function migratePrSvBaiLop2(conn: any, applied: string[]) {
  const cot = (conn.prepare('PRAGMA table_info(bai_tren_lop)').all() as { name: string }[]).map((c) => c.name);
  if (!cot.length || cot.includes('band')) return;
  conn.exec(`CREATE TABLE bai_tren_lop_moi (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT NOT NULL,
  ten_bai TEXT,
  diem REAL,
  thang REAL,
  band REAL,
  tuan TEXT NOT NULL,
  nhan_xet TEXT,
  ghi_boi INTEGER REFERENCES users(id),
  ghi_luc TEXT NOT NULL,
  sua_boi INTEGER REFERENCES users(id),
  sua_luc TEXT
)`);
  const chep = 'id, student_id, class_id, skill, ten_bai, diem, thang, tuan, nhan_xet, ghi_boi, ghi_luc, sua_boi, sua_luc';
  const n = (conn.prepare('SELECT COUNT(*) AS n FROM bai_tren_lop').get() as { n: number }).n;
  conn.exec(`INSERT INTO bai_tren_lop_moi (${chep}) SELECT ${chep} FROM bai_tren_lop`);
  conn.exec('DROP TABLE bai_tren_lop');
  conn.exec('ALTER TABLE bai_tren_lop_moi RENAME TO bai_tren_lop');
  conn.exec('CREATE INDEX idx_bai_tren_lop_hv ON bai_tren_lop(student_id, tuan)');
  applied.push(`SV-BAI-LOP-2: bai_tren_lop — tên bài / điểm / thang trống được + cột band (dựng lại bảng, giữ ${n} dòng).`);
}
