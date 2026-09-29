/** PR-SOS (K5-06, Q28-3, K3-14): hai cột. KHÔNG đổi dòng nào (DB reset trước bản chính). Chạy lặp được. */
export function migratePrSos(conn: any, applied: string[]) {
  const coCot = (bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
  if (!coCot('sos_cases', 'han_xac_nhan')) {
    conn.exec('ALTER TABLE sos_cases ADD COLUMN han_xac_nhan TEXT');   // hạn Xác nhận nguyên nhân + Xác nhận PA (3 ngày, tính cả ngày đầu)
    applied.push('PR-SOS: cột sos_cases.han_xac_nhan');
  }
  if (!coCot('case_interventions', 'moc_quy_che')) {
    conn.exec('ALTER TABLE case_interventions ADD COLUMN moc_quy_che TEXT');   // one_month | until_next_mt | until_exam — chỉ PA quy chế
    applied.push('PR-SOS: cột case_interventions.moc_quy_che');
  }
}
