/**
 * PHÉP KIỂM HOTFIX 15/10 (đặc tả OV-13 §1 L1, L2) — gọi QUA HTTP như bản chính:
 *  · L1: GV đúng kỹ năng ghi nhận xét + nhóm cho ô MT của đợt đã hoàn tất → 200 (route gửi đủ khoá `undefined`); kèm điểm → vẫn 403.
 *  · L2: Sửa Case MT có nguyên nhân từ ô — không gửi Mô tả → 200.
 * Dựng cùng cách prOv12c (lượt sạch, chốt SOS 2) trên một em riêng — KHÔNG bọc giao dịch: mỗi lần gọi API tự cuộn lại giao dịch dở.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrHfTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nHOTFIX 15/10 · nhận xét sau hoàn tất qua HTTP · Sửa Case MT không Mô tả');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager;
  const W = week.ensurePeriod('2026-11-02').id as number;
  week.ensurePeriod('2026-11-09');
  const TRONG = '2026-11-04';

  const sid = (intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: 'HF Em A', target: 7, email: 'hf@demo.test', dob: '2010-01-01' }],
    idempotencyKey: 'hf-a' }).studentIds[0]) as number;
  const luot = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number).pop()!;

  /** Lượt sạch ở tuần W, kỳ vọng 6.5 (như prOv12c `dung`). */
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    for (const sql of ['DELETE FROM assessment_scores WHERE attempt_id = ?', 'DELETE FROM skill_move_requests WHERE attempt_id = ?',
      'DELETE FROM attempt_skill_skips WHERE attempt_id = ?', 'DELETE FROM sos_coordination_actions WHERE attempt_id = ?']) conn.prepare(sql).run(aid);
    conn.prepare(`UPDATE sos_cases SET status = 'done', dedup_key = NULL WHERE student_id = ?`).run(a.student_id);
    conn.prepare('DELETE FROM case_signals WHERE student_id = ?').run(a.student_id);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`)
      .run(W, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), aid);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id = ? AND attempt_id != ?').run(W, aid);
    xoaNho();
  };
  const nhom = (s: string) => dm.issuesForTopic(s).filter((i: any) => !dm.laKhac(i.code)).slice(0, 2).map((i: any) => i.code) as string[];
  const diem = (s: string, band: number) => attempts.saveScore(QL, luot, s,
    { ...(s === 'listening' || s === 'reading' ? { band } : { criteria: [band, band, band, band] }), nhanXet: `Nhận xét ${s}: làm chậm, sai dạng bài quen thuộc.`,
      ...(band < 6.5 ? { nhomNguyenNhan: nhom(s) } : {}) }, TRONG, { tuNguoiDung: true });
  /** L 5 + S 5.5 dưới kỳ vọng → chốt SOS 2: Case L + Case S, nguyên nhân từ ô. */
  const chot = () => { diem('listening', 5); diem('reading', 7); diem('writing1', 7); diem('writing2', 7); diem('speaking', 5.5); };
  const caseL = () => one(`SELECT DISTINCT c.* FROM sos_cases c JOIN case_signals g ON g.case_id = c.id WHERE g.attempt_id = ? AND c.topic = 'listening'`, luot);

  /** Máy chủ thật (mẫu prCl); `ngay` = ngày demo trong lúc gọi. */
  async function voiMayChu(ngay: string, fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try {
      xoaNho(); dung(luot); chot();
      setConfig('demo_date', ngay); xoaNho();
      await fn(goi);
    } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });

  await checkAsync('HF-1 · đợt đã hoàn tất: GV đúng kỹ năng PUT nhận xét + nhóm (ô thiếu nhận xét) → 200; kèm điểm → 403', () => voiMayChu('2026-12-01', async (goi) => {
    conn.prepare(`UPDATE assessment_scores SET comment = NULL, nhom_nguyen_nhan = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(luot);
    xoaNho();
    const gv = P.lrTeacher.userId;
    const ok = await goi(gv, `/attempts/${luot}/scores/listening`, put({ nhanXet: 'Bổ sung: nghe sót số liệu Part 1.', nhomNguyenNhan: [nhom('listening')[0]] }));
    assert(ok.status === 200, `ghi nhận xét: ${ok.status} ${await ok.text()}`);
    assert(one(`SELECT comment FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, luot).comment === 'Bổ sung: nghe sót số liệu Part 1.', 'nhận xét chưa lưu');
    conn.prepare(`UPDATE assessment_scores SET comment = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(luot);
    xoaNho();
    const cam = await goi(gv, `/attempts/${luot}/scores/listening`, put({ band: 7, nhanXet: 'Bổ sung: nghe sót số liệu Part 1.' }));
    assert(cam.status === 403, `kèm điểm phải 403: ${cam.status}`);
  }));

  await checkAsync('HF-2 · Sửa Case MT nguyên nhân từ ô: PATCH chỉ Mức độ + Tên, không Mô tả → 200', () => voiMayChu(TRONG, async (goi) => {
    const c = caseL();
    assert(c && !c.summary, `Case MT phải có, Mô tả trống: ${JSON.stringify(c && { id: c.id, s: c.summary })}`);
    const r = await goi(QL.userId, `/cases/${c.id}`, { method: 'PATCH', body: JSON.stringify({ urgency: 'urgent', title: 'Nghe sót số liệu' }) });
    assert(r.status === 200, `sửa Case MT: ${r.status} ${await r.text()}`);
    const sau = one('SELECT urgency, title, summary FROM sos_cases WHERE id = ?', c.id);
    assert(sau.urgency === 'urgent' && sau.title === 'Nghe sót số liệu' && sau.summary == null, `đã lưu: ${JSON.stringify(sau)}`);
  }));
  /* HOTFIX-2 (chủ SP 15/10): lệnh chỉ nhận xét / nhóm — GV đúng kỹ năng, GVCN, QL sửa MỌI LÚC (ô đã có nhận xét; lớp đã kết thúc). */
  const { sosCaseState } = await import('../cases/sosState.ts');
  const { can, isCoreTeacherOf } = await import('../permissions.ts') as any;
  const { PERMISSIONS } = dm;
  const mb = classId('MB FT 101');
  const khacKyNang = [P.w1Teacher, P.w2Teacher, P.sTeacher].find((x: any) => !can(x, PERMISSIONS.SCORE_EDIT, { classId: mb, skill: 'listening' }) && !isCoreTeacherOf(x, mb))!;
  const nx = (url: string) => one(`SELECT comment FROM assessment_scores WHERE attempt_id = ? AND skill = ?`, luot, url).comment;

  await checkAsync('HF2-1 · đợt đã hoàn tất, ô ĐÃ có nhận xét: GV kỹ năng / GV Speaking / GVCN sửa → 200; GV khác kỹ năng → 403; kèm điểm → 403', () => voiMayChu('2026-12-01', async (goi) => {
    const sua = (u: number, s: string, body: unknown) => goi(u, `/attempts/${luot}/scores/${s}`, put(body));
    const a = await sua(P.lrTeacher.userId, 'listening', { nhanXet: 'Sửa lại: nghe sót số liệu Part 1 và 2.' });
    assert(a.status === 200 && nx('listening') === 'Sửa lại: nghe sót số liệu Part 1 và 2.', `GV L: ${a.status} ${await a.text()}`);
    const b = await sua(P.sTeacher.userId, 'speaking', { nhanXet: 'Sửa lại: trả lời ngắn, thiếu ý mở rộng.', nhomNguyenNhan: [nhom('speaking')[0]] });
    assert(b.status === 200, `GV S: ${b.status} ${await b.text()}`);
    const c = await sua(P.coreTeacher.userId, 'listening', { nhanXet: 'GVCN: em cần luyện nghe số liệu.' });
    assert(c.status === 200, `GVCN: ${c.status} ${await c.text()}`);
    const d = await sua(khacKyNang.userId, 'listening', { nhanXet: 'GV khác kỹ năng sửa nhận xét L.' });
    assert(d.status === 403, `GV khác kỹ năng phải 403: ${d.status}`);
    const e = await sua(P.lrTeacher.userId, 'listening', { band: 7, nhanXet: 'Sửa lại: nghe sót số liệu Part 1 và 2.' });
    assert(e.status === 403, `kèm điểm phải 403: ${e.status}`);
    const f = await sua(P.lrTeacher.userId, 'listening', { nhanXet: 'ngắn' });
    assert(f.status === 400, `nhận xét < 10 ký tự phải 400: ${f.status}`);
  }));

  await checkAsync('HF2-2 · lớp đã kết thúc: GV kỹ năng sửa nhận xét → 200; kèm điểm → 403', () => voiMayChu(TRONG, async (goi) => {
    const cu = one('SELECT status FROM classes WHERE id = ?', mb).status;
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(mb); xoaNho();
    try {
      const a = await goi(P.lrTeacher.userId, `/attempts/${luot}/scores/listening`, put({ nhanXet: 'Lớp đã kết thúc: bổ sung nhận xét L.' }));
      assert(a.status === 200 && nx('listening') === 'Lớp đã kết thúc: bổ sung nhận xét L.', `lớp kết thúc: ${a.status} ${await a.text()}`);
      const b = await goi(P.lrTeacher.userId, `/attempts/${luot}/scores/listening`, put({ band: 7 }));
      assert(b.status === 403, `kèm điểm phải 403: ${b.status}`);
    } finally { conn.prepare('UPDATE classes SET status = ? WHERE id = ?').run(cu, mb); xoaNho(); }
  }));

  await checkAsync('HF2-3 · Case "chờ ghi nhận xét" (ô đã có nhận xét) → GV Lưu → Chờ xác nhận PA; nhật ký người + cũ → mới', () => voiMayChu('2026-12-01', async (goi) => {
    const c = caseL();
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(c.id); xoaNho();
    assert(sosCaseState(c.id).choNhanXet, 'Case phải đang chờ ghi nhận xét');
    const cu = nx('listening');
    const r = await goi(P.lrTeacher.userId, `/attempts/${luot}/scores/listening`, put({ nhanXet: 'Ghi nhận xét: nghe sót số liệu, chép sai chính tả.' }));
    assert(r.status === 200, `ghi nhận xét: ${r.status} ${await r.text()}`);
    const st = sosCaseState(c.id);
    assert(!st.choNhanXet && st.hasCause && st.coPaChoXacNhan, `Case phải sang Chờ xác nhận PA: ${JSON.stringify(st)}`);
    const log = one(`SELECT * FROM audit_logs WHERE action = 'score.nhan_xet' AND entity_id = ? ORDER BY id DESC LIMIT 1`, luot);
    assert(log && log.actor_user_id === P.lrTeacher.userId && JSON.parse(log.before_json).comment === cu
      && JSON.parse(log.after_json).comment === 'Ghi nhận xét: nghe sót số liệu, chép sai chính tả.', `nhật ký: ${JSON.stringify(log)}`);
  }));
}
