/** PHÉP KIỂM PR-VN6 — F03 (MT0 lớp thường hoàn tất theo band) + F05 (nhắc nhóm + con cùng lô → một chuông). F02 nằm ở prCt2 (dùng chung bộ dựng Final). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVn6Tests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const att: any = await import('../fasttrack/attempts.ts');
  const ht: any = await import('../fasttrack/hoanTat.ts');
  const week: any = await import('../platform/week.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-VN6 · MT0 hoàn tất + nhắc một chuông');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('VN6-1 · F03: MT0 lớp FOU đủ band, qua tuần → hoàn tất; GV Writing không sửa được (403); QL sửa được khi có lý do', () => thu(() => {
    /* Em đang học lớp FOU (chấm tỷ lệ) có GV Writing riêng — MT0 chèn thẳng ở tuần đã qua, đủ band 4 kỹ năng. */
    const e = get(`SELECT e.student_id sid, e.class_id cid, lc.id cyc, ta.user_id gv FROM enrollments e
        JOIN classes c ON c.id = e.class_id AND c.programme_code = 'FOU' AND c.is_fast_track = 0
        JOIN learning_cycles lc ON lc.student_id = e.student_id AND lc.status = 'active'
        JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.skill = 'writing' AND ta.is_core = 0 AND ta.status = 'active'
       WHERE e.status = 'active' ORDER BY e.id LIMIT 1`);
    assert(!!e, 'seed có em lớp FOU với GV Writing');
    const pid = week.ensurePeriod(week.mondayOf(addDays(TODAY, -14))).id;
    const now = new Date().toISOString();
    const aid = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, plan_source, status, created_at)
       VALUES (?, ?, 0, 'mt0', ?, ?, 'auto', 'done', ?)`,
    ).run(e.cyc, e.sid, e.cid, pid, now).lastInsertRowid);
    for (const k of ['listening', 'reading', 'writing', 'speaking']) {
      conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at) VALUES (?,?,1,?, 'auto', 'scheduled', ?)`)
        .run(aid, k, pid, now);
    }
    for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(aid, k, 5, addDays(TODAY, -14));
    }
    assert(ht.dotHoanTat(aid, TODAY).hoanTat === true, `MT0 phải hoàn tất: ${JSON.stringify(ht.dotHoanTat(aid, TODAY))}`);
    assertThrows(() => att.saveScore(loadPrincipal(e.gv), aid, 'writing1', { band: 6, lyDo: 'Chấm lại' }, TODAY), /hoàn tất/, 'GV sửa MT0 đã hoàn tất');
    att.saveScore(P.admin, aid, 'writing1', { band: 6, lyDo: 'Chấm lại' }, TODAY);
    assert(get(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`, aid).band === 6, 'QL sửa có lý do');
  }));
}
