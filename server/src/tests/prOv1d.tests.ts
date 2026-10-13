/**
 * PHÉP KIỂM PR-OV1d — lưới chấm FT: ô đã dời vì vắng ở lưới TUẦN GỐC có đủ dữ liệu để mở hộp + Bỏ vắng tại chỗ; em không còn đang học
 * (Kết thúc học / Lưu trữ) → hàng có cờ `ngungHoc`, ô không là việc; chỉ Lưu trữ chỉ đọc + máy chủ chặn ghi (400). Em Tạm dừng như đang học. Mỗi ca cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv1dTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV1d · lưới chấm FT: Bỏ vắng từ tuần gốc, em không còn đang học chỉ đọc');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const QL = P.mbManager, gvL = P.lrTeacher, gvS = P.sTeacher;
  /* Cùng khung tuần với OV-1b: W1 NOV (02–08/11) thi, "-" thứ Tư 04/11 → dời sang W2 NOV; xem lại thứ Sáu 13/11. */
  const WS = '2026-11-02', WS1 = '2026-11-09', TRONG = '2026-11-04', THU6 = '2026-11-13';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;

  const luot = all(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 2`, lop).map((r) => r.id as number);

  /** Lượt sạch ở tuần `W`: chưa điểm, chưa vắng; lượt khác của lớp rời W / W1 (hàng lớp chỉ có ca dựng). */
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(W, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, ...luot);
    xoaNho();
  };
  const hang = (aid: number, p: any, pid: number, today: string) =>
    (attempts.classScoreSheet(p, lop, pid, today) as any).rows.find((r: any) => r.attemptId === aid);
  const o = (aid: number, s: string, p: any, pid: number, today: string) => hang(aid, p, pid, today)?.cells.find((c: any) => c.skill === s);
  const ky = (aid: number, s: string) => one('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', aid, s);
  const sid = (aid: number) => one('SELECT student_id FROM assessment_attempts WHERE id = ?', aid).student_id as number;

  check('OV1d-0 · tiền đề: đủ 2 lượt MT cuối sạch ở MB FT 101', () => {
    assert(luot.length === 2, `cần 2 lượt, có ${luot.length}`);
  });

  check('OV1d-1 · lưới TUẦN GỐC: ô đã dời vì vắng mang daChot (doiSang, goDuoc) → Bỏ vắng về tuần gốc, lần vắng −1; GV kỹ năng khác không nút / 403', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    assert(ky(a, 'listening').planned_period_id === W1, 'tiền đề: Listening đã dời sang W2 NOV');
    const c = o(a, 'listening', gvL, W, THU6);
    assert(c && c.weekStart === WS1 && c.daChot?.doiSang && c.daChot.goDuoc === true,
      `lưới tuần gốc phải có ô dời mở được: ${JSON.stringify({ weekStart: c?.weekStart, daChot: c?.daChot })}`);
    const cS = o(a, 'listening', gvS, W, THU6);
    assert(cS?.daChot?.goDuoc === false, 'GV Speaking không được có nút Bỏ vắng ô L');
    const e = loi(() => attempts.saveScore(gvS, a, 'listening', { noShow: false }, THU6));
    assert(e?.status === 403, `GV Speaking Bỏ vắng L: ${e?.status} ${e?.message}`);
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, THU6);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 0, `Bỏ vắng: ${JSON.stringify(k)}`);
    assert(!o(a, 'listening', gvL, W, THU6).daChot, 'sau Bỏ vắng ô về tuần gốc, không còn dấu dời');
  }));

  check('OV1d-2 · em Lưu trữ: cờ ngungHoc, ô chỉ đọc (cả Bỏ vắng), ghi → 400; em Kết thúc học chưa lưu trữ: cờ, ô không là việc nhưng vẫn ghi được (PR-TK); em Tạm dừng như đang học; trở lại học → ghi được', () => thu(() => {
    const a = luot[1], s = sid(a);
    dung(a);
    attempts.saveScore(gvL, a, 'reading', { noShow: true }, TRONG);   // ô dời vì vắng — Bỏ vắng cũng phải khoá khi Lưu trữ
    const dat = (sql: string) => { conn.prepare(`UPDATE students SET ${sql} WHERE id = ?`).run(s); xoaNho(); };
    dat(`archived_at = '2026-10-01T00:00:00Z'`);
    let r = hang(a, QL, W, THU6);
    assert(r?.ngungHoc === 'Lưu trữ', `Lưu trữ: cờ hàng = ${JSON.stringify(r?.ngungHoc)}`);
    assert(r.cells.every((c: any) => !c.canEdit && !c.viec && !c.overdue && !c.daChot?.goDuoc),
      `Lưu trữ: ô phải chỉ đọc: ${JSON.stringify(r.cells.map((c: any) => [c.skill, c.canEdit, c.viec, c.overdue, c.daChot?.goDuoc]))}`);
    for (const [k, patch] of [['listening', { rawScore: 30 }], ['reading', { noShow: false }], ['speaking', { nhanXet: 'x' }]] as const) {
      const e = loi(() => attempts.saveScore(QL, a, k, patch, THU6));
      assert(e?.status === 400 && /Bỏ lưu trữ/.test(e.message), `Lưu trữ ghi ${k}: ${e?.status} ${e?.message}`);
    }
    /* Kết thúc học chưa lưu trữ (FT chờ thi thật / Bước tiếp): hàng mờ, không việc / quá hạn, nhưng ô vẫn mở — nhập bù vào bản chụp (PR-TK). */
    dat(`archived_at = NULL, status = 'finished'`);
    r = hang(a, QL, W, THU6);
    assert(r?.ngungHoc === 'Đã kết thúc học' && r.cells.every((c: any) => !c.viec && !c.overdue)
      && r.cells.find((c: any) => c.skill === 'listening').canEdit && r.cells.find((c: any) => c.skill === 'reading').daChot?.goDuoc === true,
      `Kết thúc học: ${JSON.stringify(r?.ngungHoc)} ${JSON.stringify(r?.cells.map((c: any) => [c.skill, c.canEdit, c.viec, c.overdue, c.daChot?.goDuoc]))}`);
    attempts.saveScore(QL, a, 'speaking', { nhanXet: 'nhập bù sau Kết thúc học' }, THU6);
    dat(`status = 'active'`);
    /* Em Tạm dừng (thi xong rồi mới dừng): hàng KHÔNG mờ, vẫn nhập điểm / Bỏ vắng như thường (chủ SP 13/10). */
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(s);
    xoaNho();
    const td = hang(a, QL, W, THU6);
    assert(!td.ngungHoc && td.cells.find((c: any) => c.skill === 'reading').daChot?.goDuoc === true, `em Tạm dừng: ${JSON.stringify(td.ngungHoc)}`);
    attempts.saveScore(gvL, a, 'reading', { noShow: false }, THU6);
    attempts.saveScore(gvL, a, 'reading', { rawScore: 25 }, THU6);
    assert(one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'reading'`, a).raw_score === 25, 'em Tạm dừng: ghi được');
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(s);
    xoaNho();
    const r = hang(a, QL, W, THU6);
    assert(!r.ngungHoc && r.cells.some((c: any) => c.canEdit), 'em học lại: hàng bình thường');
    attempts.saveScore(QL, a, 'listening', { rawScore: 30 }, THU6);
    assert(one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a).raw_score === 30, 'học lại: ghi được');
  }));

  check('OV1d-3 · số đếm không đổi: hàng lớp Lịch Test không tính em lưu trữ (khớp S6F-a 2b), lưới vẫn giữ hàng (mờ) với điểm cũ', () => thu(() => {
    const [a, b] = luot;
    dung(a); dung(b);
    attempts.saveScore(QL, b, 'listening', { rawScore: 30 }, TRONG);
    const con = () => (canCham.lichTest(QL, W, null, THU6, { phamVi: 'tat-ca' }) as any).lop.find((l: any) => l.classId === lop)?.conBai ?? 0;
    const truoc = con();
    conn.prepare(`UPDATE students SET archived_at = '2026-10-01T00:00:00Z' WHERE id = ?`).run(sid(b));
    xoaNho();
    assert(con() < truoc, `Lịch Test vẫn đếm em lưu trữ: ${truoc} → ${con()}`);
    const r = hang(b, QL, W, THU6);
    assert(r?.ngungHoc === 'Lưu trữ' && r.cells.find((c: any) => c.skill === 'listening').rawScore === 30, 'hàng em lưu trữ phải còn, điểm cũ giữ');
  }));
}
