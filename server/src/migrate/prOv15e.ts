/**
 * OV-15e (19/10): Phân tích › Kết quả thi › Thi thật lọc lộ trình theo ngày thi thật trong khoảng — cột lọc mới cần chỉ mục (luật dòng đọc Turso).
 * Chỉ thêm chỉ mục một phần (cùng trong schema.sql); chạy lại không làm gì.
 */
export const CHI_MUC_OV15E: [string, string][] = [
  ['idx_cycle_thi_that_ngay', 'CREATE INDEX IF NOT EXISTS idx_cycle_thi_that_ngay ON learning_cycles(thi_that_ngay) WHERE thi_that_ngay IS NOT NULL'],
];

export function migratePrOv15e(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_OV15E) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`OV-15e: thêm chỉ mục ${ten}`);
  }
}
