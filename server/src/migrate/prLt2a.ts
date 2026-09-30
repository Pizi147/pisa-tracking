/** PR-LT2a (M-03, M-05): nhóm PA bổ trợ + hạn nộp kế hoạch. KHÔNG đổi dòng nào (DB reset trước bản chính). Chạy lặp được. */
export function migratePrLt2a(conn: any, applied: string[]) {
  const coCot = (bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
  if (!coCot('case_interventions', 'nhom_bo_tro')) { conn.exec('ALTER TABLE case_interventions ADD COLUMN nhom_bo_tro TEXT'); applied.push('PR-LT2a: cột case_interventions.nhom_bo_tro'); }
  if (!coCot('case_interventions', 'han_ke_hoach')) { conn.exec('ALTER TABLE case_interventions ADD COLUMN han_ke_hoach TEXT'); applied.push('PR-LT2a: cột case_interventions.han_ke_hoach'); }
  conn.exec('CREATE INDEX IF NOT EXISTS idx_ci_nhom_bo_tro ON case_interventions(nhom_bo_tro)');
}
