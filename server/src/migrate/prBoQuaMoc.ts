/**
 * BO-QUA-XEP-MT (chủ SP 03/11): QL "Bỏ qua" việc "Xếp lịch MTn cho {em}" / "Nhập dự kiến thi" (`moc:` ở `mywork.ts`) — CHỈ THÊM 3 cột NULL trên
 * `case_interventions`: `bo_qua_moc` (mốc đã bỏ qua: `mt{n}` | `thi` — mốc khác thì việc hiện lại) · `bo_qua_boi` · `bo_qua_luc`. Không đổi dữ liệu;
 * chạy lặp không làm gì; khớp `schema.sql`. Gọi ĐẦU migrate (myWork đọc các cột này).
 */
export const COT_BO_QUA_MOC: [string, string][] = [['bo_qua_moc', 'TEXT'], ['bo_qua_boi', 'INTEGER'], ['bo_qua_luc', 'TEXT']];

export function themCotPrBoQuaMoc(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('case_interventions') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT_BO_QUA_MOC.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE case_interventions ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`BO-QUA-XEP-MT: thêm cột case_interventions.${them.map(([t]) => t).join(', ')} (Bỏ qua việc Xếp lịch MT). Dữ liệu cũ giữ nguyên.`);
}
