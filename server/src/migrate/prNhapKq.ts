/**
 * NHAP-KQ-PA (chủ SP 13/11): cột `case_interventions.nhap_ket_qua` — bản nháp Ghi kết quả PA của kỳ đang chạy (JSON `{ outcome, note, luc, boiId, boi }`).
 * NULL = không có nháp. Chốt kết quả thì xoá. Chỉ thêm cột, chạy lặp được.
 */
export function migratePrNhapKq(conn: any, applied: string[]) {
  const cols = (conn.prepare('PRAGMA table_info(case_interventions)').all() as any[]).map((c: any) => c.name);
  if (!cols.length || cols.includes('nhap_ket_qua')) return;
  conn.exec('ALTER TABLE case_interventions ADD COLUMN nhap_ket_qua TEXT');
  applied.push('NHAP-KQ-PA: cột case_interventions.nhap_ket_qua (nháp kết quả PA).');
}
