/**
 * TD-QUET (17/11, đợt TOC-DO-1711): hai chỉ mục cho câu đang QUÉT CẢ BẢNG ở đường hay mở (đo trên bản chép 12/11 — do-it.py):
 *   · `sos_case_history(case_id)` — Lịch sử Case (GET /cases/:id, ~170 lần / ngày) và câu con "lần đóng gần nhất" (`caseDongDoXoaSql`) quét ~1 100 dòng.
 *   · `case_signals(class_id)` — "Lớp đã có dữ liệu" (GET /classes/:id/xoa-ket-thuc, `tinhTrangLop`) quét ~1 100 dòng.
 * Mọi câu lọc theo hai cột này đều có ORDER BY id hoặc là COUNT — thứ tự dòng không đổi. Chỉ thêm chỉ mục (cùng trong schema.sql), chạy lại không làm gì.
 */
const CHI_MUC: [string, string][] = [
  ['idx_case_history_case', 'CREATE INDEX IF NOT EXISTS idx_case_history_case ON sos_case_history(case_id)'],
  ['idx_signal_class', 'CREATE INDEX IF NOT EXISTS idx_signal_class ON case_signals(class_id)'],
];

export function migratePrTdQuet(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TD-QUET: thêm chỉ mục ${ten}`);
  }
}
