/**
 * OV-13k (chủ SP 15/10): Speaking chấm chéo — GV phụ trách Speaking của lớp xem nhận xét người chấm, ghi thêm nhận xét RIÊNG.
 *   assessment_scores.nhan_xet_phu_trach      nhận xét GV phụ trách (không đè `comment` của người chấm), 1–1000 ký tự
 *   assessment_scores.nhan_xet_phu_trach_by   người lưu lần cuối (GV phụ trách / GVCN / QL làm thay)
 *   assessment_scores.nhan_xet_phu_trach_at   lúc lưu lần cuối
 *   assessment_scores.cho_phu_trach_xem       1 = người chấm chéo vừa lưu nhận xét, GV phụ trách chưa lưu — dòng việc "Xem nhận xét Speaking"
 * Chỉ thêm cột (dữ liệu cũ: NULL / 0 — không sinh việc cho bài cũ); chạy lại không làm gì.
 */
const COT: [string, string][] = [
  ['nhan_xet_phu_trach', 'TEXT'], ['nhan_xet_phu_trach_by', 'INTEGER REFERENCES users(id)'], ['nhan_xet_phu_trach_at', 'TEXT'],
  ['cho_phu_trach_xem', 'INTEGER NOT NULL DEFAULT 0'],
];

export function migratePrOv13k(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE assessment_scores ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`OV-13k: thêm cột assessment_scores.${them.map(([t]) => t).join(', ')} (nhận xét GV phụ trách Speaking). Dữ liệu cũ giữ nguyên.`);
}
