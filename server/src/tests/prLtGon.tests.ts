/**
 * PR-LTGON (chủ sản phẩm chốt 08/10) — lớp thường:
 *  LTG-a  QL đổi tuần Progress/Final của lớp → bài chưa có điểm của các em dời theo (không hỏi); em đã có điểm giữ nguyên; MT0 chưa thi đi theo Final.
 *  LTG-b  GV gõ "-" mà tuần dời tới trùng tuần Final → hoà vào tuần Final (lưu, không 400).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLtGonTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const schedule: any = await import('../classes/schedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const LOP = classId('MB FOU 12');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  let dem = 0;
  console.log('\nPR-LTGON · lớp thường: đổi mốc dời bài theo; "-" trùng Final hoà vào Final');

  /** Em mới vào lớp thường với bài Progress + Final ở tuần mốc hiện tại của lớp (đủ bốn môn). */
  const emMoi = () => {
    const tag = `LTG${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    const branch = get('SELECT branch_id AS b FROM classes WHERE id = ?', LOP).b;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, '2026-01-01', now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-01-01', 'active', ?)`)
      .run(sid, now).lastInsertRowid);
    const cp = schedule.classProgress(LOP);
    const ids: Record<string, number> = {};
    [['progress', cp.progressWeekStart], ['final', cp.finalWeekStart]].forEach(([kind, w], i) => {
      const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,?,?,?, 'planned', ?)`)
        .run(cy, sid, i + 1, kind, LOP, week.ensurePeriod(w as string).id, now).lastInsertRowid);
      skillSch.ensureSkillRows(aid);
      ids[kind as string] = aid;
    });
    return { sid, cy, progress: ids.progress, final: ids.final };
  };
  const tuanCua = (aid: number) => all(
    `SELECT DISTINCT p.week_start w FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.required = 1 AND k.sit_status != 'cancelled'`, aid).map((r) => r.w);
  const tuanLuot = (aid: number) => get(`SELECT p.week_start w FROM assessment_attempts a JOIN report_periods p ON p.id = a.planned_period_id WHERE a.id = ?`, aid).w;

  check('LTG-a · đổi tuần Final: 2 em chưa điểm dời theo, em có điểm giữ nguyên; Progress tương tự; MT0 chưa thi đi theo Final', () => {
    const cp0 = schedule.classProgress(LOP);
    const [a, b, c] = [emMoi(), emMoi(), emMoi()];
    /* MT0 chưa thi của em a, tuần Final cũ, chưa ai dời tay. */
    const m0 = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,0,'mt0',?,?, 'planned', ?)`)
      .run(a.cy, a.sid, LOP, week.ensurePeriod(cp0.finalWeekStart).id, new Date().toISOString()).lastInsertRowid);
    skillSch.ensureSkillRows(m0);
    regular.saveRegularScore(P.admin, c.final, 'listening', { score: 15, total: 20 });
    const wF = tuanCua(c.final);
    assert(wF.length === 1 && wF[0] === cp0.finalWeekStart, `tiền đề: ${wF}`);

    schedule.setClassProgress(P.mbManager, LOP, { finalWeek: cp0.finalWeek - 1 });
    const moi = schedule.classProgress(LOP).finalWeekStart;
    assert(moi === t.addDays(cp0.finalWeekStart, -7), `mốc mới ${moi}`);
    for (const e of [a, b]) {
      assert(tuanCua(e.final).join() === moi && tuanLuot(e.final) === moi, `em chưa điểm phải dời: ${tuanCua(e.final)} / ${tuanLuot(e.final)}`);
      assert(tuanCua(e.progress).join() === cp0.progressWeekStart, 'Progress không đổi khi chỉ đổi Final');
    }
    assert(tuanCua(c.final).join() === cp0.finalWeekStart, 'em đã có điểm giữ nguyên');
    assert(tuanCua(m0).join() === moi, `MT0 theo Final: ${tuanCua(m0)}`);

    schedule.setClassProgress(P.mbManager, LOP, { progressWeek: cp0.progressWeek - 1 });
    const pm = schedule.classProgress(LOP).progressWeekStart;
    assert(tuanCua(a.progress).join() === pm && tuanCua(b.progress).join() === pm, 'Progress chưa điểm dời theo');
    assert(tuanLuot(a.progress) === pm, 'tuần của bài dời theo');
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.progress.doi_bai' AND entity_id = ?`, LOP).n >= 1, 'có nhật ký');
  });

  check('LTG-b · GV gõ "-" Progress, tuần sau trùng tuần Final → lưu, kỹ năng chuyển sang tuần Final', () => {
    const cp = schedule.classProgress(LOP);
    schedule.setClassProgress(P.mbManager, LOP, { progressWeek: cp.finalWeek - 1, finalWeek: cp.finalWeek });
    const e = emMoi();
    const f = schedule.classProgress(LOP).finalWeekStart;
    assert(tuanCua(e.progress).join() === t.addDays(f, -7), `tiền đề ${tuanCua(e.progress)}`);
    const r = regular.reportRegularNoShow(P.admin, e.progress, 'listening', true, t.addDays(f, -6)) as any;
    assert(r.moved === true, JSON.stringify(r));
    const w = get(`SELECT p.week_start w FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening'`, e.progress).w;
    assert(w === f, `phải hoà vào tuần Final ${f}, được ${w}`);
  });
}
