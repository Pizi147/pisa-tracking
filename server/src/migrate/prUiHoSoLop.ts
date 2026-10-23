/**
 * UI-HO-SO-LOP (V5 `08` 6c, C17): bảng `danh_gia_dau_ra` — nhận xét + đề xuất bước tiếp của GVCN khi đánh giá đầu ra lớp thường.
 * CHỈ CẤU TRÚC — cùng định nghĩa trong `schema.sql`. Chạy lại không làm gì.
 */
export function migratePrUiHoSoLop(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 AS c FROM sqlite_master WHERE type = 'table' AND name = 'danh_gia_dau_ra'").get()) return;
  conn.exec(`CREATE TABLE danh_gia_dau_ra (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  nhan_xet TEXT,
  de_xuat TEXT,
  sua_boi INTEGER REFERENCES users(id),
  sua_luc TEXT NOT NULL,
  UNIQUE (student_id, class_id)
)`);
  conn.exec('CREATE INDEX idx_danh_gia_dau_ra_lop ON danh_gia_dau_ra(class_id)');
  applied.push('UI-HO-SO-LOP: bảng danh_gia_dau_ra (nhận xét + đề xuất bước tiếp của GVCN). Dữ liệu cũ giữ nguyên.');
}
