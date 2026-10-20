/**
 * OV-15i1 (20/10): Lịch sử › Góp ý tuần của lớp đọc nhật ký góp ý theo (loại, việc, em) — chỉ mục cũ `idx_audit_entity` (loại, em) đọc MỌI dòng nhật ký
 * của mọi em trong lớp rồi mới lọc việc. Chỉ thêm chỉ mục (cùng trong schema.sql); chạy lại không làm gì.
 */
export const CHI_MUC_OV15I1: [string, string][] = [
  ['idx_audit_viec', 'CREATE INDEX IF NOT EXISTS idx_audit_viec ON audit_logs(entity_type, action, entity_id)'],
];

export function migratePrOv15i1(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_OV15I1) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`OV-15i1: thêm chỉ mục ${ten}`);
  }
}
