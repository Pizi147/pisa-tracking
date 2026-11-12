/**
 * TINH-HINH (chủ SP 12/11, đặc tả `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/dac-ta.md` mục 2) — CHỈ THÊM, chạy lặp không làm gì, khớp `schema.sql`:
 *   1. `violations.chi_nhac` — "Chỉ nhắc nhở" (1): không vào luật 3 vi phạm / 2 tuần, bậc, việc, số vi phạm. Dữ liệu cũ = 0.
 *   2. Bảng `tinh_hinh_hoc_tap` — GV báo tình hình cho TVV (`gv_tvv`) · TVV hỏi GVCN (`tvv_gvcn`, hạn 3 ngày).
 *   3. `viec_bao_ph.tinh_hinh_id` — việc TVV "Báo PH · Tình hình học tập" (cùng bảng, cùng luật Báo PH).
 */
const BANG = `
  CREATE TABLE IF NOT EXISTS tinh_hinh_hoc_tap (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    chieu TEXT NOT NULL,
    noi_dung TEXT NOT NULL,
    nguoi_gui INTEGER NOT NULL REFERENCES users(id),
    tao_luc TEXT NOT NULL,
    sua_luc TEXT,
    han TEXT,
    tra_loi TEXT, tra_loi_boi INTEGER REFERENCES users(id), tra_loi_luc TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    rut_boi INTEGER REFERENCES users(id), rut_luc TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tinh_hinh_hv ON tinh_hinh_hoc_tap(student_id, trang_thai);
  CREATE INDEX IF NOT EXISTS idx_tinh_hinh_cho ON tinh_hinh_hoc_tap(chieu, trang_thai);`;

export function migratePrTinhHinh(conn: any, applied: string[]) {
  const cotVp = new Set((conn.prepare(`SELECT name FROM pragma_table_info('violations')`).all() as any[]).map((c) => c.name as string));
  if (cotVp.size && !cotVp.has('chi_nhac')) {
    conn.exec('ALTER TABLE violations ADD COLUMN chi_nhac INTEGER NOT NULL DEFAULT 0');
    applied.push('TINH-HINH: thêm violations.chi_nhac ("Chỉ nhắc nhở" — không tính luật, bậc, việc). Dữ liệu cũ = vi phạm.');
  }
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'tinh_hinh_hoc_tap'`).get() && cotVp.size) {
    conn.exec(BANG);
    applied.push('TINH-HINH: bảng tinh_hinh_hoc_tap (GV báo tình hình cho TVV · TVV hỏi GVCN).');
  }
  const cotBp = new Set((conn.prepare(`SELECT name FROM pragma_table_info('viec_bao_ph')`).all() as any[]).map((c) => c.name as string));
  if (cotBp.size && !cotBp.has('tinh_hinh_id')) {
    conn.exec('ALTER TABLE viec_bao_ph ADD COLUMN tinh_hinh_id INTEGER');
    conn.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_viec_bao_ph_tinh_hinh ON viec_bao_ph(tinh_hinh_id) WHERE tinh_hinh_id IS NOT NULL');
    applied.push('TINH-HINH: thêm viec_bao_ph.tinh_hinh_id (việc TVV báo PH tình hình học tập).');
  }
}
