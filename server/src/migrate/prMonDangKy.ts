/**
 * P8 MON-DANG-KY (plan.md 1.6 N13): cột `learning_cycles.mon_dang_ky` (JSON môn đã học, NULL = đủ) + `attempt_skills.bo_task`
 * ('writing1' | 'writing2' | NULL — task Writing không học). Chỉ thêm cột; dữ liệu cũ NULL = đủ môn. Chạy hai lần không đổi thêm.
 */
import { tx } from '../db.ts';

/* Bảng chưa có (DB rất cũ: `attempt_skills` dựng ở bước sau) → không thêm; `migrate` gọi lại sau bước dựng bảng. */
const thieuCot = (conn: any, bang: string, cot: string) => {
  const cols = conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[];
  return cols.length > 0 && !cols.some((c) => c.name === cot);
};

export function migratePrMonDangKy(conn: any, applied: string[]) {
  tx(() => {
    if (thieuCot(conn, 'learning_cycles', 'mon_dang_ky')) {
      conn.exec('ALTER TABLE learning_cycles ADD COLUMN mon_dang_ky TEXT');
      applied.push('P8: cột learning_cycles.mon_dang_ky (môn đăng ký FT, NULL = đủ môn)');
    }
    if (thieuCot(conn, 'attempt_skills', 'bo_task')) {
      conn.exec('ALTER TABLE attempt_skills ADD COLUMN bo_task TEXT');
      applied.push('P8: cột attempt_skills.bo_task (task Writing không học)');
    }
  });
}
