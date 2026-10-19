/**
 * TD7b (chủ SP 19/10, Turso Top Queries): cờ "còn ô chờ điểm" `assessment_attempts.o_cho_tu` + chỉ mục một phần (cùng trong schema.sql).
 * Thêm cột (dòng cũ = '' = chưa tính, luôn được đọc), thêm chỉ mục, tính lại cờ của MỌI lượt bằng chính hàm các đường ghi dùng
 * (`conOCho.ts`). Chạy lặp được: cột / chỉ mục đã có thì bỏ qua; tính lại chỉ ghi dòng đang lệch (lần hai không ghi gì, không báo gì).
 */
import { capNhatConOChoTatCa, demLuotLechCo } from '../fasttrack/conOCho.ts';

export const CHI_MUC_TD7B: [string, string][] = [
  ['idx_attempt_o_cho', "CREATE INDEX IF NOT EXISTS idx_attempt_o_cho ON assessment_attempts(o_cho_tu) WHERE o_cho_tu IS NOT NULL AND status != 'cancelled'"],
  ['idx_attempt_o_cho_lop', "CREATE INDEX IF NOT EXISTS idx_attempt_o_cho_lop ON assessment_attempts(class_id, o_cho_tu) WHERE o_cho_tu IS NOT NULL AND status != 'cancelled'"],
];

export function migratePrTd7b(conn: any, applied: string[]) {
  const coCot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[]).some((c) => c.name === 'o_cho_tu');
  if (!coCot) {
    conn.exec("ALTER TABLE assessment_attempts ADD COLUMN o_cho_tu TEXT DEFAULT ''");
    applied.push('TD7b: cột assessment_attempts.o_cho_tu (tuần sớm nhất của ô chờ điểm)');
  }
  for (const [ten, sql] of CHI_MUC_TD7B) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TD7b: thêm chỉ mục ${ten}`);
  }
  const lech = demLuotLechCo(conn);
  if (lech) {
    capNhatConOChoTatCa(conn);
    applied.push(`TD7b: tính lại cờ ô chờ điểm cho ${lech} lượt`);
  }
}
