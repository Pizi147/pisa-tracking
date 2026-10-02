/**
 * PR-DEPLOY (0b-3, R5-5): LỚP + CHƯƠNG TRÌNH GỐC của Case — hai cột `sos_cases.goc_class_id`, `goc_programme_code` và trigger `trg_sos_cases_goc` ghi chúng
 * khi INSERT (một chỗ, mọi đường mở Case). Cột nằm CUỐI bảng trong `schema.sql`. Tự kiểm nên chạy lặp được; lần hai không báo gì.
 * Chỉ khi VỪA thêm cột (DB cũ — DB THỬ / máy dev) mới chép lớp gốc cho Case có sẵn; DB reset không có gì để chép.
 */
const TRIGGER_GOC = `
CREATE TRIGGER trg_sos_cases_goc AFTER INSERT ON sos_cases WHEN NEW.goc_class_id IS NULL
BEGIN
  UPDATE sos_cases SET goc_class_id = COALESCE(
    (SELECT a.class_id FROM assessment_attempts a WHERE a.id = NEW.attempt_id),
    (SELECT e.class_id FROM enrollments e
      WHERE e.student_id = COALESCE(NEW.student_id, (SELECT a.student_id FROM assessment_attempts a WHERE a.id = NEW.attempt_id)) AND e.status = 'active'
      ORDER BY e.id DESC LIMIT 1))
  WHERE id = NEW.id;
  UPDATE sos_cases SET goc_programme_code = (SELECT c.programme_code FROM classes c WHERE c.id = sos_cases.goc_class_id)
  WHERE id = NEW.id AND goc_class_id IS NOT NULL;
END`;

export function migratePrDeploy(conn: any, applied: string[]) {
  const cot = (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).map((c) => c.name as string);
  if (!cot.includes('goc_class_id') || !cot.includes('goc_programme_code')) {
    const moi = !cot.includes('goc_class_id');
    if (moi) conn.exec('ALTER TABLE sos_cases ADD COLUMN goc_class_id INTEGER');
    if (!cot.includes('goc_programme_code')) conn.exec('ALTER TABLE sos_cases ADD COLUMN goc_programme_code TEXT');
    if (moi) {
      conn.exec(`UPDATE sos_cases SET goc_class_id = COALESCE(
        (SELECT a.class_id FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id),
        (SELECT e.class_id FROM enrollments e WHERE e.student_id = COALESCE(sos_cases.student_id, (SELECT a.student_id FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id)) AND e.status = 'active' ORDER BY e.id DESC LIMIT 1))`);
      conn.exec('UPDATE sos_cases SET goc_programme_code = (SELECT c.programme_code FROM classes c WHERE c.id = sos_cases.goc_class_id) WHERE goc_class_id IS NOT NULL');
    }
    applied.push('Case: lớp + chương trình gốc lúc mở (R5-5)');
  }
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_sos_cases_goc'").get()) {
    conn.exec(TRIGGER_GOC);
    applied.push('Case: trigger ghi lớp + chương trình gốc khi mở Case');
  }
}
