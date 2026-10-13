/**
 * PR-OV9 (chủ SP 13/10, KCK nhẹ): cột `sos_cases.kck` — 1 = Case nhẹ của em KCK dưới kỳ vọng (không PA quy chế, không hạn, không Phối hợp / chuông).
 * Chỉ thêm cột (mặc định 0 = Case như cũ), không đổi dữ liệu — chạy lại không làm gì. Gọi TRƯỚC mọi bước migrate dùng `LA_CASE_SOS`.
 */
export function migratePrOv9(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_cases') as any[];
  if (!cot.length || cot.some((c) => c.name === 'kck')) return;
  conn.exec('ALTER TABLE sos_cases ADD COLUMN kck INTEGER NOT NULL DEFAULT 0');
  applied.push('PR-OV9: thêm cột sos_cases.kck (Case nhẹ của em KCK). Dữ liệu cũ giữ nguyên.');
}
