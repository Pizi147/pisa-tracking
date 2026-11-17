/**
 * HOC-TIEP (N51, chủ SP 18/11) — CHỈ THÊM bảng `thi_that_lich_su` + 2 chỉ mục (cùng trong schema.sql); chạy lặp không làm gì, không đổi dòng nào.
 * Một lộ trình giữ MỘT KQ thi thật (cột `learning_cycles.thi_that_*`). Bước tiếp "Học tiếp" = cùng lộ trình chạy tiếp: KQ lần này + dự kiến thi chép vào
 * đây rồi xoá khỏi lộ trình (lần thi sau ghi như thường). Phân tích Kết quả thi đọc thêm bảng này (cùng câu); Hoàn tác trả nguyên từ `cot_json`.
 */
export const DDL_HOC_TIEP = `CREATE TABLE IF NOT EXISTS thi_that_lich_su (
  id INTEGER PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER,                    -- lớp lúc thi (lớp đang học lúc chọn Học tiếp); không FK như bản chụp
  ngay_thi TEXT,                       -- ngày Phân tích đọc: ngày thi thật, "Không thi" → ngày thi dự kiến
  thi_that_l REAL, thi_that_r REAL, thi_that_w REAL, thi_that_s REAL, thi_that_khong_thi INTEGER NOT NULL DEFAULT 0, thi_that_lay_lai TEXT,
  outcome TEXT, outcome_score REAL, target REAL, khong_cam_ket INTEGER NOT NULL DEFAULT 0,
  cot_json TEXT NOT NULL,              -- mọi cột lộ trình đã xoá lúc Học tiếp (Hoàn tác trả nguyên)
  chon_luc TEXT NOT NULL, chon_boi INTEGER REFERENCES users(id), created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ttls_cycle ON thi_that_lich_su(cycle_id);
CREATE INDEX IF NOT EXISTS idx_ttls_ngay ON thi_that_lich_su(ngay_thi);`;

export function migratePrHocTiep(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'thi_that_lich_su'").get()) return;
  conn.exec(DDL_HOC_TIEP);
  applied.push('HOC-TIEP: thêm bảng thi_that_lich_su — KQ thi thật lần trước của lộ trình Học tiếp (chỉ thêm bảng).');
}
