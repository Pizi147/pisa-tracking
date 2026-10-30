/**
 * TL-NAPBAI: CHI NHÁNH của lịch kỹ năng — cột `attempt_skills.branch_id` (= chi nhánh lớp của lượt) + chỉ mục (chi nhánh, tuần), (lớp, tuần) để `napBai` cả chi nhánh
 * đi thẳng từ ô kỹ năng của chi nhánh trong kỳ (không đọc ô mọi chi nhánh — bài học #724). Cột giữ bằng trigger: thêm lịch, lượt đổi lớp, lớp đổi chi nhánh —
 * mọi đường ghi (API, seed, ops, phép kiểm) đều trúng. Chạy lặp được; dữ liệu cũ chỉ điền khi vừa thêm cột / thiếu trigger (migrate cục bộ trước khôi phục).
 */
/** (chi nhánh, tuần) cho ô kỹ năng · (lớp, tuần) cho vế lượt KHÔNG lịch kỹ năng — `idx_attempt_period` đọc lượt trong kỳ của mọi chi nhánh. */
export const CHI_MUC_TL_NAPBAI: [string, string][] = [
  ['idx_attempt_skills_cn_tuan', 'CREATE INDEX idx_attempt_skills_cn_tuan ON attempt_skills(branch_id, planned_period_id, attempt_id)'],
  ['idx_attempt_lop_tuan', 'CREATE INDEX idx_attempt_lop_tuan ON assessment_attempts(class_id, planned_period_id)'],
];
export const TRIGGER_TL_NAPBAI: [string, string][] = [
  ['trg_attempt_skills_cn', `
CREATE TRIGGER trg_attempt_skills_cn AFTER INSERT ON attempt_skills
BEGIN
  UPDATE attempt_skills SET branch_id = (SELECT c.branch_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = NEW.attempt_id)
  WHERE id = NEW.id;
END`],
  ['trg_attempt_doi_lop_cn', `
CREATE TRIGGER trg_attempt_doi_lop_cn AFTER UPDATE OF class_id ON assessment_attempts WHEN NEW.class_id IS NOT OLD.class_id
BEGIN
  UPDATE attempt_skills SET branch_id = (SELECT c.branch_id FROM classes c WHERE c.id = NEW.class_id) WHERE attempt_id = NEW.id;
END`],
  ['trg_lop_doi_cn', `
CREATE TRIGGER trg_lop_doi_cn AFTER UPDATE OF branch_id ON classes WHEN NEW.branch_id IS NOT OLD.branch_id
BEGIN
  UPDATE attempt_skills SET branch_id = NEW.branch_id WHERE attempt_id IN (SELECT a.id FROM assessment_attempts a WHERE a.class_id = NEW.id);
END`],
];

export function migratePrTlNapBai(conn: any, applied: string[]) {
  const cot = (conn.prepare('PRAGMA table_info(attempt_skills)').all() as any[]).map((c) => c.name as string);
  if (!cot.length) return;
  const done: string[] = [];
  let dien = false;
  if (!cot.includes('branch_id')) {
    conn.exec('ALTER TABLE attempt_skills ADD COLUMN branch_id INTEGER');
    done.push('cột attempt_skills.branch_id');
    dien = true;
  }
  for (const [ten, sql] of CHI_MUC_TL_NAPBAI) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    done.push(`chỉ mục ${ten}`);
  }
  for (const [ten, sql] of TRIGGER_TL_NAPBAI) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    done.push(`trigger ${ten}`);
    dien = true;
  }
  /* Thiếu cột / trigger nghĩa là có thể đã ghi lịch mà không giữ cột — điền lại một lần theo lớp của lượt (lượt không lớp → NULL). */
  if (dien) {
    conn.exec(`UPDATE attempt_skills SET branch_id = (SELECT c.branch_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
                WHERE a.id = attempt_skills.attempt_id)`);
  }
  if (done.length) applied.push(`TL-NAPBAI: ${done.join(', ')}.`);
}
