/**
 * TD5 (chủ SP 16/10): giảm dòng đọc Turso — chỉ thêm chỉ mục (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * `sos_cases` chưa có chỉ mục `attempt_id`: mỗi câu "Case mở của lượt" quét cả bảng cho từng lượt (~190 k dòng / lần trên bản chính).
 */
const CHI_MUC: [string, string][] = [
  ['idx_case_attempt', 'sos_cases(attempt_id, status, sos_level, tam)'],
];

export function migratePrTd5(conn: any, applied: string[]) {
  for (const [ten, tren] of CHI_MUC) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(`CREATE INDEX IF NOT EXISTS ${ten} ON ${tren}`);
    applied.push(`TD5: thêm chỉ mục ${ten} ON ${tren}`);
  }
}
