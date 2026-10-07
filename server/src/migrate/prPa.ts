/**
 * PR-PA (§8): Số buổi của PA + Số buổi tuần này của Kết quả + nhật ký Sửa PA (số buổi, ngày bắt đầu cũ → mới). CHỈ THÊM CỘT.
 * Điền bù (chỉ dòng `so_buoi IS NULL`): Bổ trợ miễn phí ← `mini_test.so_buoi` cùng nhóm · Tutor kỳ vọng đầu ra ← 10. Chạy lặp được.
 */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

const COT: [string, string, string][] = [
  ['case_interventions', 'so_buoi', 'INTEGER'],
  ['case_followups', 'so_buoi', 'INTEGER'],
  ['case_intervention_revisions', 'old_so_buoi', 'INTEGER'],
  ['case_intervention_revisions', 'new_so_buoi', 'INTEGER'],
  ['case_intervention_revisions', 'old_started_date', 'TEXT'],
  ['case_intervention_revisions', 'new_started_date', 'TEXT'],
];

export function migratePrPa(conn: any, applied: string[]) {
  for (const [bang, cot, kieu] of COT) {
    if (coCot(conn, bang, cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${kieu}`);
    applied.push(`PA đồng bộ: thêm cột ${bang}.${cot}`);
  }
  const mienPhi = conn.prepare(
    `UPDATE case_interventions SET so_buoi = (SELECT mt.so_buoi FROM mini_test mt WHERE mt.nhom_bo_tro = case_interventions.nhom_bo_tro ORDER BY mt.id LIMIT 1)
      WHERE kind = 'bo_tro_mien_phi' AND so_buoi IS NULL
        AND EXISTS (SELECT 1 FROM mini_test mt WHERE mt.nhom_bo_tro = case_interventions.nhom_bo_tro AND mt.so_buoi IS NOT NULL)`,
  ).run().changes;
  if (mienPhi) applied.push(`PA đồng bộ: điền Số buổi cho ${mienPhi} PA Bổ trợ miễn phí`);
  const tutor = conn.prepare(
    `UPDATE case_interventions SET so_buoi = 10
      WHERE kind = 'tutor' AND so_buoi IS NULL
        AND case_id IN (SELECT id FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%')`,
  ).run().changes;
  if (tutor) applied.push(`PA đồng bộ: điền Số buổi 10 cho ${tutor} PA Tutor kỳ vọng đầu ra`);
}
