/**
 * PR-GVa (F01 = D13): khoá gửi mỗi lần mở form. CHỈ THÊM — không đổi dòng nào, an toàn trên Turso đang chạy. Chạy lặp được.
 * Index chỉ phủ dòng CÓ khoá nên dòng cũ (NULL) không thể vi phạm. Khoá gắn theo người tạo (cột thứ hai của mỗi cặp).
 */
const BANG: [bang: string, nguoi: string][] = [['tasks', 'created_by'], ['case_interventions', 'recorded_by'], ['case_followups', 'observer_user_id']];

export function migratePrGva(conn: any, applied: string[]) {
  const coCot = (b: string, c: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).some((x) => x.name === c);
  for (const [b, nguoi] of BANG) {
    if (!coCot(b, 'idempotency_key')) { conn.exec(`ALTER TABLE ${b} ADD COLUMN idempotency_key TEXT`); applied.push(`PR-GVa: cột ${b}.idempotency_key`); }
    conn.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_${b}_khoa_gui ON ${b}(${nguoi}, idempotency_key) WHERE idempotency_key IS NOT NULL`);
  }
}
