/**
 * PHÉP KIỂM DON-LUONG (kế hoạch 2026-10-30-don.md · PR DON-LUONG): luồng còn sót ra-luong K6 · K8 · K14 · K23 · K39b · K42a + OV-11 A6 · A8
 * + chủ SP 30/10 câu 1 (dòng "đã vắng · khôi phục" ở hồ sơ lượt).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runDonLuongTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  console.log('\nDON-LUONG · Luồng còn sót');
  const att: any = await import('../fasttrack/attempts.ts');
  const week: any = await import('../platform/week.ts');
  const mig: any = await import('../migrate/donLuong.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const NOW = new Date().toISOString();
  const cong7 = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10);

  /* ---------------------------------------------------------------- K6 */
  /** Lượt Mock của lớp FT đang học, đủ 4 kỹ năng ở tuần kế hoạch, chưa có ô điểm nào. */
  const luotFt = () => one(
    `SELECT a.id, a.class_id, a.planned_period_id AS w FROM assessment_attempts a JOIN classes c ON c.id = a.class_id AND c.is_fast_track = 1 AND c.status = 'active'
      WHERE a.kind = 'mock' AND a.status != 'cancelled' AND a.planned_period_id IS NOT NULL
        AND (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1 AND k.planned_period_id = a.planned_period_id) = 4
        AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id)
      ORDER BY a.id LIMIT 1`);
  /** Dời các kỹ năng `mon` sang tuần sau vì vắng (dấu "-" ở tuần gốc, đã chốt); dời đủ 4 → tuần của lượt cũng dời. */
  const doiVang = (a: any, mon: string[]) => {
    const w3 = week.ensurePeriod(cong7(one('SELECT week_start FROM report_periods WHERE id = ?', a.w).week_start)).id as number;
    const o: Record<string, string[]> = { listening: ['listening'], reading: ['reading'], writing: ['writing1', 'writing2'], speaking: ['speaking'] };
    for (const k of mon) {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled' WHERE attempt_id = ? AND skill = ?`).run(w3, a.id, k);
      for (const s of o[k]) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at, no_show_settled_at) VALUES (?,?,?,?,?)`).run(a.id, s, a.w, NOW, NOW);
      }
    }
    if (mon.length === 4) conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?`).run(w3, a.id);
    return w3;
  };
  const hang = (a: any, w: number) => att.classScoreSheet(P.mbManager, a.class_id, w).rows.filter((r: any) => r.attemptId === a.id);

  check('K6 · migrate chỉ mục hai lần không lỗi', () => {
    mig.migrateDonLuong(conn, []); mig.migrateDonLuong(conn, []);
    assert(!!one(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_scores_no_show'`), 'có chỉ mục');
  });
  check('K6 · em dời đủ 4 kỹ năng vì vắng: lưới tuần gốc VẪN có hàng em; tuần mới vẫn có hàng', () => thu(() => {
    const a = luotFt();
    assert(a, 'seed cần một lượt Mock FT đủ 4 kỹ năng chưa có điểm');
    const w3 = doiVang(a, ['listening', 'reading', 'writing', 'speaking']);
    assert(hang(a, a.w).length === 1, `tuần gốc: ${hang(a, a.w).length} hàng`);
    assert(hang(a, w3).length === 1, 'tuần mới giữ hàng');
  }));
  check('K6 · em dời một phần: một hàng (không trùng) ở tuần gốc', () => thu(() => {
    const a = luotFt();
    doiVang(a, ['writing']);
    assert(hang(a, a.w).length === 1, `${hang(a, a.w).length} hàng`);
  }));
  check('K6 · câu tìm dấu "-" theo tuần đi chỉ mục idx_scores_no_show', () => {
    const plan = all(`EXPLAIN QUERY PLAN SELECT sc.attempt_id FROM assessment_scores sc WHERE sc.no_show_period_id = ?`, 1).map((r) => r.detail).join(' | ');
    assert(/idx_scores_no_show/.test(plan), plan);
  });
}
