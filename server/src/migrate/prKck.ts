/**
 * PR-KCK (Q29-1): Target "không cam kết" — cột `learning_cycles.khong_cam_ket` + hai đầu KCK của `cycle_target_revisions`.
 * Chỉ thêm cột (mặc định 0 = như cũ), không đổi dữ liệu — chạy lại không làm gì.
 */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrKck(conn: any, applied: string[]) {
  const them: string[] = [];
  for (const [bang, cot] of [['learning_cycles', 'khong_cam_ket'], ['cycle_target_revisions', 'old_khong_cam_ket'],
    ['cycle_target_revisions', 'new_khong_cam_ket']] as const) {
    if (coCot(conn, bang, cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} INTEGER NOT NULL DEFAULT 0`);
    them.push(`${bang}.${cot}`);
  }
  if (them.length) applied.push(`PR-KCK: thêm cột ${them.join(', ')} (Target "không cam kết"). Dữ liệu cũ giữ nguyên.`);
}
