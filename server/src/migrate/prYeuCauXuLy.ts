/**
 * LG-12 VI-PHAM-YEU-CAU-XU-LY (chủ SP lời 47, 48; `13-thiet-ke-dot-4.md` mục 3) — CHỈ THÊM CỘT, chạy lặp không làm gì, khớp `schema.sql`:
 *   `violations.yeu_cau_xu_ly` (1 = người ghi yêu cầu GVCN xử lý) · `khong_xu_ly_luc` / `_boi` / `_ly_do` (GVCN "Không xử lý" + lý do; NULL = chưa / đã Hoàn tác).
 * Dữ liệu cũ = 0 / NULL (không vi phạm cũ nào đổi trạng thái).
 */
const COT: [string, string][] = [
  ['yeu_cau_xu_ly', 'INTEGER NOT NULL DEFAULT 0'],
  ['khong_xu_ly_luc', 'TEXT'],
  ['khong_xu_ly_boi', 'INTEGER REFERENCES users(id)'],
  ['khong_xu_ly_ly_do', 'TEXT'],
];

export function migratePrYeuCauXuLy(conn: any, applied: string[]) {
  const co = new Set((conn.prepare(`SELECT name FROM pragma_table_info('violations')`).all() as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE violations ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`LG-12: thêm violations.${them.map(([t]) => t).join(', ')} (Yêu cầu GVCN xử lý · Không xử lý). Dữ liệu cũ giữ.`);
}
