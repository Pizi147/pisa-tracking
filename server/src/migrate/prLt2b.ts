/**
 * PR-LT2b (T49, M-05, T78): kỳ vọng đầu ra BE/ELE lên FT, dấu Quản lý quyết, Mini Test. CHỈ đổi cấu trúc — chạy lặp không làm gì,
 * không sửa dữ liệu cũ (DB reset trước bản chính).
 */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

const COT_LO_TRINH_TIEP: readonly [string, string][] = [
  ['quyet_boi', 'INTEGER REFERENCES users(id)'],   // Quản lý đã quyết hướng (ghi khi thi hành lệnh chuyển 50–59%)
  ['quyet_luc', 'TEXT'],
  ['ky_vong_dat', 'INTEGER'],                      // T49: 1 đạt · 0 không đạt · NULL chưa đánh dấu
  ['ky_vong_nguyen_nhan', 'TEXT'],                 // 'trung_tam' | 'hoc_sinh'
  ['ky_vong_mon', 'TEXT'],                         // JSON ô chuẩn lớp cũ Quản lý chọn (mặc định môn < 70%)
  ['ky_vong_ghi_chu', 'TEXT'],                     // Học sinh: phương án case-by-case (chữ tự do)
];

export function migratePrLt2b(conn: any, applied: string[]) {
  const them: string[] = [];
  for (const [cot, kieu] of COT_LO_TRINH_TIEP) {
    if (coCot(conn, 'lo_trinh_tiep_theo', cot)) continue;
    conn.exec(`ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ${cot} ${kieu}`);
    them.push(`lo_trinh_tiep_theo.${cot}`);
  }
  const coBang = (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'mini_test'`).get() as any) !== undefined;
  if (!coBang) {
    conn.exec(`CREATE TABLE mini_test (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id), cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),  -- lộ trình MỚI
      tu_attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),   -- bài Cuối khoá sinh ra nó
      nhom_bo_tro TEXT NOT NULL, so_buoi INTEGER NOT NULL, ngay_du_kien TEXT NOT NULL, han TEXT NOT NULL,
      ty_le REAL, ngay_lam TEXT, ghi_boi INTEGER REFERENCES users(id), ghi_luc TEXT,
      UNIQUE (student_id, tu_attempt_id))`);
    them.push('bảng mini_test');
  }
  if (them.length) applied.push(`PR-LT2b: thêm ${them.join(', ')} (Mini Test, kỳ vọng đầu ra). Dữ liệu cũ giữ nguyên.`);
}
