/**
 * PR-OV12b (chủ SP 14/10): cột `assessment_scores.nhom_nguyen_nhan` — JSON mảng mã nhóm nguyên nhân theo thứ tự chọn (1 = chính), chỉ ở ô MT
 * dưới kỳ vọng. Chỉ thêm cột (NULL = chưa chọn / không cần), không đổi dữ liệu — chạy lại không làm gì.
 */
export function migratePrOv12b(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[];
  if (!cot.length || cot.some((c) => c.name === 'nhom_nguyen_nhan')) return;
  conn.exec('ALTER TABLE assessment_scores ADD COLUMN nhom_nguyen_nhan TEXT');
  applied.push('PR-OV12b: thêm cột assessment_scores.nhom_nguyen_nhan (nhóm nguyên nhân của ô MT dưới kỳ vọng). Dữ liệu cũ giữ nguyên.');
}
