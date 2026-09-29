/** PR-HSM (YC-13.5, T39): nhận xét W/S + GV chấm Speaking trên từng bài nhập. Chỉ thêm cột, không đổi dữ liệu — chạy lại không làm gì. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrHsm(conn: any, applied: string[]) {
  const them: string[] = [];
  for (const [cot, kieu] of [['comment', 'TEXT'], ['examiner_user_id', 'INTEGER REFERENCES users(id)'], ['examiner_name', 'TEXT']] as const) {
    if (coCot(conn, 'assessment_scores', cot)) continue;
    conn.exec(`ALTER TABLE assessment_scores ADD COLUMN ${cot} ${kieu}`);
    them.push(`assessment_scores.${cot}`);
  }
  if (them.length) applied.push(`PR-HSM: thêm cột ${them.join(', ')} (nhận xét W/S, GV chấm Speaking). Dữ liệu cũ giữ nguyên.`);
}
