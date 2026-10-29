/**
 * S1 (giảm dòng đọc Turso): `napBai` của MỘT GV lấy lượt GV đã chấm Speaking (`examiner_user_id`, T18) — chưa chỉ mục → quét cả assessment_scores.
 * Chỉ thêm chỉ mục một phần (cùng trong schema.sql); chạy lại không làm gì.
 */
export const CHI_MUC_S1: [string, string][] = [
  ['idx_score_examiner', 'CREATE INDEX IF NOT EXISTS idx_score_examiner ON assessment_scores(examiner_user_id) WHERE examiner_user_id IS NOT NULL'],
];

export function migratePrS1(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_S1) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`S1: thêm chỉ mục ${ten}`);
  }
}
