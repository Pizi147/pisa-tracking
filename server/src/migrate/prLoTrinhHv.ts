/**
 * LO-TRINH-THEO-HV (chủ SP 11/11): cột `assessment_attempts.route_at_attempt` — lộ trình lúc lượt đã có điểm khi em ĐỔI lộ trình (NULL = theo lộ trình
 * hiện tại của `cycle_id`, như trước). Chỉ thêm cột, không đổi dữ liệu; chạy lặp được.
 */
export function migratePrLoTrinhHv(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[];
  if (!cot.length || cot.some((c) => String(c.name).toLowerCase() === 'route_at_attempt')) return;
  conn.exec('ALTER TABLE assessment_attempts ADD COLUMN route_at_attempt TEXT');
  applied.push('LO-TRINH-THEO-HV: thêm cột assessment_attempts.route_at_attempt (lộ trình lúc thi khi em đổi lộ trình).');
}
