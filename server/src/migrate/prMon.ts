/**
 * PR-MON (MH1, K5-29, T78): kỹ năng "phụ trách được" chỉ còn L · R · W1 · W2 · S. Mã lớp thường cũ trong `user_skills` đổi sang ô FT.
 * KHÔNG thêm dòng PREFOU/tong_hop (PR-LOP đã làm) và KHÔNG cột nhãn môn (Q1 — tên môn là mã, `tenMon`). Chạy lặp được.
 */
import { tx } from '../db.ts';

const MA_CU = `('writing', 'prep_writing', 'pronunciation')`;

/** Chỉ đọc: GV nào sẽ đổi kỹ năng, cũ → mới (đúng luật của `migratePrMon`). */
export function keHoachDoiKyNang(conn: any): { userId: number; ten: string; cu: string[]; moi: string[] }[] {
  const rows = conn.prepare(
    `SELECT u.id, u.full_name, GROUP_CONCAT(us.skill) AS ds FROM users u JOIN user_skills us ON us.user_id = u.id
      WHERE u.id IN (SELECT user_id FROM user_skills WHERE skill IN ${MA_CU}) GROUP BY u.id ORDER BY u.full_name`,
  ).all() as any[];
  return rows.map((r) => {
    const cu = String(r.ds ?? '').split(',').filter(Boolean).sort();
    const moi = new Set(cu.filter((k) => !['writing', 'prep_writing', 'pronunciation'].includes(k)));
    if (cu.some((k) => k === 'writing' || k === 'prep_writing')) { moi.add('writing1'); moi.add('writing2'); }
    if (cu.includes('pronunciation')) moi.add('speaking');
    return { userId: r.id, ten: r.full_name, cu, moi: [...moi].sort() };
  });
}

/** Chỉ đọc (Q5): Case FOU có nguyên nhân kiểu IELTS (Writing/Speaking) — GIỮ mã, chỉ để biết. */
export function demCaseFouNguyenNhanIelts(conn: any): { soCase: number; mau: { caseId: number; hocVien: string; ma: string }[] } {
  const tu = `FROM case_issues ci JOIN sos_cases sc ON sc.id = ci.case_id JOIN learning_cycles lc ON lc.id = sc.cycle_id
     WHERE lc.programme_code IN ('FOU', 'FOUND') AND (ci.taxonomy_code LIKE 'student.writing.%' OR ci.taxonomy_code LIKE 'student.speaking.%')`;
  const soCase = (conn.prepare(`SELECT COUNT(DISTINCT ci.case_id) AS n ${tu}`).get() as any).n;
  const mau = (conn.prepare(
    `SELECT ci.case_id AS caseId, s.full_name AS hocVien, ci.taxonomy_code AS ma ${tu.replace('WHERE', 'JOIN students s ON s.id = sc.student_id WHERE')}
      ORDER BY ci.case_id LIMIT 20`,
  ).all() as any[]);
  return { soCase, mau };
}

export function migratePrMon(conn: any, applied: string[], dbMoi = false) {
  /* DB mới (khoi_tao_moi_at) không có dữ liệu kiểu cũ — bỏ qua (DEP-2): bộ demo chép kỹ năng phân công lớp thường (`writing`) sang user_skills. */
  if (dbMoi) return;
  tx(() => {
    const truoc = (conn.prepare(`SELECT COUNT(*) AS n FROM user_skills WHERE skill IN ${MA_CU}`).get() as any).n;
    if (!truoc) return;
    for (const moi of ['writing1', 'writing2']) {
      conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) SELECT user_id, ? FROM user_skills WHERE skill IN ('writing', 'prep_writing')`).run(moi);
    }
    conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) SELECT user_id, 'speaking' FROM user_skills WHERE skill = 'pronunciation'`).run();
    conn.prepare(`DELETE FROM user_skills WHERE skill IN ${MA_CU}`).run();
    applied.push(`Đổi kỹ năng phụ trách được của ${truoc} dòng: Writing lớp thường → W1 + W2 (MH1)`);
  });
}
