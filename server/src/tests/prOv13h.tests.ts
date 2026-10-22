/**
 * PHÉP KIỂM OV-13h (chủ SP 15/10) — gỡ chặn cứng người đúng nhiệm vụ, gọi QUA HTTP như bản chính. Mỗi mục: đúng vai 200, sai vai 403, nhật ký có dòng;
 * kèm các chặn GIỮ (sửa điểm đã có, "-" ở lớp kết thúc, chưa tới tuần thi, Case hệ thống đóng, hồ sơ Lưu trữ ngoài thi thật).
 *  1 · nhập ô TRỐNG sau hoàn tất / lớp đã kết thúc (FT + lớp thường) · 2 · gỡ "-" sau hạn · 3 · mở lại Case (ai hoàn thành được)
 *  4 · bàn giao sau ngày chuyển lớp · 5 · báo cáo tuần quá hạn = "nộp muộn" · 6 · góp ý tuần lớp đã kết thúc · 7 · thi thật em Lưu trữ, đề xuất sửa em Tạm dừng.
 * Không bọc giao dịch (mỗi lần gọi API tự mở giao dịch) — trạng thái dùng chung (lớp, em) trả lại trong `finally`; chạy cuối `run.ts`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13hTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const bg: any = await import('../classes/banGiao.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { dotHoanTat } = await import('../fasttrack/hoanTat.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13h · gỡ chặn cứng người đúng nhiệm vụ (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const QL = P.mbManager;
  const FT101 = classId('MB FT 101'), FOU12 = classId('MB FOU 12');
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const nk = (action: string, actor: number, entityId?: number) =>
    one(`SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND actor_user_id = ?${entityId === undefined ? '' : ' AND entity_id = ?'}`,
      ...(entityId === undefined ? [action, actor] : [action, actor, entityId])).n as number;
  const gvMon = (lop: number, skill: string) => one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`, lop, skill).user_id as number;
  /* Cuối run.ts: GV L của MB FT 101 cũng là GVCN; GV W1 chỉ dạy W1 (phép kiểm trước có thể đã kết thúc phân công Speaking). */
  const gvL = gvMon(FT101, 'listening'), gvW = gvMon(FT101, 'writing1');
  assert(gvL !== gvW && !one(`SELECT 1 x FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND (is_core = 1 OR skill = 'listening')`, FT101, gvW),
    'GV W1 của MB FT 101 phải chỉ dạy W1');
  /** GV chi nhánh MB không dạy MB FT 101 / MB FOU 12. */
  const gvNgoai = one(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'teacher' AND ur.status = 'active' AND b.code = 'MB'
        AND ur.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id IN (?, ?) AND status = 'active') ORDER BY ur.user_id LIMIT 1`, FT101, FOU12).user_id as number;

  /** Máy chủ thật (mẫu prHf): `ngay` = ngày demo trong lúc gọi; trả `goi(userId, url, init)`. */
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
    try { setConfig('demo_date', ngay); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });
  const post = (body: unknown = {}) => ({ method: 'POST', body: JSON.stringify(body) });
  const ma = async (r: Response, mong: number, viec: string) => { const s = r.status; const txt = s === mong ? '' : await r.text(); assert(s === mong, `${viec}: ${s} (mong ${mong}) ${txt}`); };

  let seq = 0;
  /** Em mới ở MB FT 101 + lượt Mock sạch, mọi kỹ năng ở tuần `w` (mẫu prHf `dung`). */
  const emFt = (w: string) => {
    seq += 1;
    const sid = intake.commitIntake(P.admin, { classId: FT101, rows: [{ fullName: `OV13h Em ${seq}`, target: 7, email: `ov13h${seq}@demo.test`, dob: '2010-01-01' }],
      idempotencyKey: `ov13h-${seq}` }).studentIds[0] as number;
    const aid = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number).pop()!;
    const W = week.ensurePeriod(w).id as number;
    week.ensurePeriod(addDays(w, 7)); week.ensurePeriod(addDays(w, 14));
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    run('DELETE FROM assessment_scores WHERE attempt_id = ?', aid);
    run(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0, absent_from_no_show = 0,
      deadline_override = NULL WHERE attempt_id = ?`, W, aid);
    run(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`,
      W, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), aid);
    run('UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id = ? AND attempt_id != ?', W, aid);
    xoaNho();
    return { sid, aid, cy: one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id as number };
  };
  const nx = 'Làm bài ổn định, cần luyện thêm dạng bài mới.';
  const diemQl = (aid: number, s: string, ngay: string) => attempts.saveScore(QL, aid, s,
    { ...(s === 'listening' || s === 'reading' ? { band: 8 } : { criteria: [8, 8, 8, 8] }), nhanXet: nx }, ngay);
  const lopTam = (id: number, fn: () => Promise<void>) => async () => {
    const cu = one('SELECT status, finished_at FROM classes WHERE id = ?', id);
    run(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`, TODAY, id); xoaNho();
    try { await fn(); } finally { run('UPDATE classes SET status = ?, finished_at = ? WHERE id = ?', cu.status, cu.finished_at, id); xoaNho(); }
  };

  // ------------------------------------------------------------------ 1 · nhập ô trống
  {
    const W = '2026-11-16', TRONG = '2026-11-18', SAU = '2026-12-15';
    const x = emFt(W);
    await checkAsync('OV13h-1a · chưa tới tuần thi: GV đúng môn nhập ô trống → 400 (GIỮ)', () => voiMayChu('2026-11-09', async (goi) => {
      await ma(await goi(gvL, `/attempts/${x.aid}/scores/listening`, put({ band: 8, nhanXet: nx })), 400, 'chưa tới tuần thi');
    }));
    for (const s of ['reading', 'writing2', 'speaking']) diemQl(x.aid, s, TRONG);
    /* Đợt FT chỉ hoàn tất khi mọi ô có điểm hoặc "-": L và W1 "-" nhập bù sau tuần thi = Không dự thi → ô chưa có điểm của đợt đã hoàn tất. */
    /* LUAT-34: "-" ghi muộn nay dời — dựng ô "Không dự thi" CŨ thẳng (dữ liệu trước luật 4 sửa, không migrate) để đợt Đủ điểm. */
    for (const s of ['listening', 'writing1']) {
      run(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu)
        VALUES (?, ?, ?, ?, '2026-11-25T00:00:00.000Z', 1, '2026-11-25T00:00:00.000Z', 1)`, x.aid, s, week.ensurePeriod(W).id, QL.userId);
    }
    xoaNho();
    await checkAsync('OV13h-1b · FT đợt đã hoàn tất (L, W1 "-" Không dự thi): GV L nhập ô L → 200 + nhật ký score.edit; sửa ô đã có → 403; GV L vào ô W1 (không dạy) → 403; cờ ô khớp', () => voiMayChu(SAU, async (goi) => {
      assert(dotHoanTat(x.aid, SAU).hoanTat, 'lượt chưa hoàn tất');
      const o = async (u: number, k: string) => ((await (await goi(u, `/attempts/${x.aid}`)).json()) as any).cells.find((c: any) => c.skill === k);
      assert((await o(gvL, 'listening')).canEdit === true && (await o(gvL, 'reading')).canEdit === true, 'cờ ô GV L (LUAT-34: Đủ điểm không khoá)');
      const truoc = nk('score.edit', gvL, x.aid);
      await ma(await goi(gvL, `/attempts/${x.aid}/scores/listening`, put({ band: 8, nhanXet: nx })), 200, 'GV L nhập ô trống');
      assert(one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, x.aid).band === 8, 'chưa lưu điểm');
      assert(nk('score.edit', gvL, x.aid) === truoc + 1, 'thiếu nhật ký score.edit');
      await ma(await goi(gvL, `/attempts/${x.aid}/scores/listening`, put({ band: 7.5, nhanXet: nx })), 200, 'GV sửa điểm đã có (LUAT-34)');
      await ma(await goi(gvL, `/attempts/${x.aid}/scores/writing1`, put({ criteria: [8, 8, 8, 8], nhanXet: nx })), 403, 'GV L vào ô W1');
    }));
    await checkAsync('OV13h-1c · FT lớp đã kết thúc: GV W1 nhập ô W1 ("-", chưa điểm) → 200 + nhật ký; sửa lại → 403; "-" → 400 câu "không ghi vắng" + cờ ô khongVang (GIỮ, rà #410); QL vẫn sửa', lopTam(FT101, () => voiMayChu(SAU, async (goi) => {
      const vang = await goi(gvW, `/attempts/${x.aid}/scores/writing1`, put({ noShow: true }));
      assert(vang.status === 400 && (await vang.text()).includes('không ghi vắng'), `GV "-" lớp kết thúc: ${vang.status}`);
      const oW = ((await (await goi(gvW, `/attempts/${x.aid}`)).json()) as any).cells.find((c: any) => c.skill === 'writing1');
      assert(oW.canEdit === true && /không ghi vắng/.test(oW.khongVang ?? ''), `cờ ô W1: ${JSON.stringify({ e: oW.canEdit, v: oW.khongVang })}`);
      const truoc = nk('score.edit', gvW, x.aid);
      await ma(await goi(gvW, `/attempts/${x.aid}/scores/writing1`, put({ criteria: [8, 8, 8, 8], nhanXet: nx })), 200, 'GV W1 nhập ô trống lớp kết thúc');
      assert(nk('score.edit', gvW, x.aid) === truoc + 1, 'thiếu nhật ký');
      await ma(await goi(gvW, `/attempts/${x.aid}/scores/writing1`, put({ criteria: [7, 7, 7, 7], nhanXet: nx })), 403, 'GV W1 sửa điểm đã có');
      await ma(await goi(QL.userId, `/attempts/${x.aid}/scores/writing1`, put({ criteria: [7.5, 7.5, 7.5, 7.5], nhanXet: nx, lyDo: 'Chấm lại' })), 200, 'QL sửa');
    })));
    await checkAsync('OV13h-1d · lớp thường đã kết thúc: GV đúng môn nhập ô trống → 200 + nhật ký regular.score; sửa lại → 403; GV khác môn → 403; rà #410: ô đã khoá điểm vẫn ghi nhận xét (200 + nhật ký), "-" → 400 đúng câu, cờ nhanXetDuoc / khongVang', lopTam(FOU12, () => voiMayChu(TODAY, async (goi) => {
      const a = one(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled'
          AND EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = a.id AND k.skill = 'listening' AND rp.week_start <= ?)
        ORDER BY a.id LIMIT 1`, FOU12, TODAY);
      run(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a.id); xoaNho();
      const gv = gvMon(FOU12, 'listening');
      const khac = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND user_id NOT IN
        (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND (skill = 'listening' OR is_core = 1) AND status = 'active') LIMIT 1`, FOU12, FOU12)?.user_id;
      if (khac) await ma(await goi(khac, `/regular/attempts/${a.id}/scores/listening`, put({ score: 20, total: 40 })), 403, 'GV khác môn');
      const truoc = nk('regular.score', gv);   // nhật ký theo dòng điểm (`assessment_score`)
      await ma(await goi(gv, `/regular/attempts/${a.id}/scores/listening`, put({ score: 20, total: 40 })), 200, 'GV nhập ô trống lớp kết thúc');
      assert(nk('regular.score', gv) === truoc + 1, 'thiếu nhật ký regular.score');
      await ma(await goi(gv, `/regular/attempts/${a.id}/scores/listening`, put({ score: 25, total: 40 })), 403, 'GV sửa điểm đã có');
      const truocNx = nk('score.nhan_xet', gv, a.id);
      await ma(await goi(gv, `/regular/attempts/${a.id}/scores/listening`, put({ nhanXet: 'Nghe ý chính tốt, sót số liệu.' })), 200, 'GV nhận xét ô đã khoá');
      assert(nk('score.nhan_xet', gv, a.id) === truocNx + 1, 'thiếu nhật ký score.nhan_xet');
      if (khac) await ma(await goi(khac, `/regular/attempts/${a.id}/scores/listening`, put({ nhanXet: 'GV khác môn' })), 403, 'GV khác môn nhận xét');
      const vang = await goi(gv, `/regular/attempts/${a.id}/scores/listening`, put({ noShow: true }));
      assert(vang.status === 400 && (await vang.text()).includes('không ghi vắng'), `GV "-" lớp thường kết thúc: ${vang.status}`);
      const kind = one('SELECT kind, attempt_no FROM assessment_attempts WHERE id = ?', a.id);
      const sheet = (await (await goi(gv, `/regular/classes/${FOU12}/sheet?kind=${kind.kind === 'checkpoint' ? `checkpoint:${kind.attempt_no}` : kind.kind}`)).json()) as any;
      const oL = sheet.rows.find((r: any) => r.attemptId === a.id)?.skillSchedule.find((k: any) => k.skill === 'listening');
      assert(oL && oL.canEdit === false && oL.nhanXetDuoc === true && /không ghi vắng/.test(oL.khongVang ?? ''), `cờ ô L: ${JSON.stringify(oL && { e: oL.canEdit, nx: oL.nhanXetDuoc, v: oL.khongVang })}`);
    })));
  }

  // ------------------------------------------------------------------ 2 · gỡ "-" sau hạn
  {
    const W = '2026-11-30';
    const x = emFt(W);
    /* "-" CHƯA dời (vắng chờ QL — mẫu prBv `choQL`): "-" ở tuần thi của L, chốt muộn khi tuần kế đã hết. Luật cũ: GV / GVCN hết thứ Tư sau tuần gốc. */
    const k = one(`SELECT k.id, k.planned_period_id AS p, rp.week_end, rp.code FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
      WHERE k.attempt_id = ? AND k.skill = 'listening'`, x.aid);
    const scId = Number(run('INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at) VALUES (?, ?, ?, ?, ?)',
      x.aid, 'listening', k.p, QL.userId, new Date().toISOString()).lastInsertRowid);
    absence.settleGroup(conn, x.aid, k.id, 'listening', k.week_end, k.code, [scId], null, 'Vắng (dựng dữ liệu)', addDays(W, 30));
    xoaNho();
    assert(one(`SELECT no_show_settled_at FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, x.aid)?.no_show_settled_at
      && one(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`, x.aid).p === k.p, 'dấu "-" chưa chốt / đã dời');
    await checkAsync('OV13h-2a · FT "-" đã chốt chưa dời, quá hạn chấm 3 tuần: GV W1 (khác môn) → 403; GV L gỡ → 200 + nhật ký; ô không còn "-"', () => voiMayChu(addDays(W, 30), async (goi) => {
      await ma(await goi(gvW, `/attempts/${x.aid}/scores/listening`, put({ noShow: false })), 403, 'GV khác môn gỡ "-"');
      const truoc = all(`SELECT id FROM audit_logs WHERE actor_user_id = ? AND entity_id = ?`, gvL, x.aid).length;
      await ma(await goi(gvL, `/attempts/${x.aid}/scores/listening`, put({ noShow: false })), 200, 'GV L gỡ "-" sau hạn');
      assert(!one(`SELECT no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, x.aid)?.no_show_period_id, 'còn "-"');
      assert(all(`SELECT id FROM audit_logs WHERE actor_user_id = ? AND entity_id = ?`, gvL, x.aid).length > truoc, 'thiếu nhật ký gỡ "-"');
    }));
    await checkAsync('OV13h-2b · lớp thường "-" quá hạn: GVCN gỡ → 200 + nhật ký; GV ngoài lớp → 403', async () => {
      const a = all(`SELECT a.id, rp.week_start ws FROM assessment_attempts a JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening'
          JOIN report_periods rp ON rp.id = k.planned_period_id WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled' AND rp.week_start <= ?
          ORDER BY a.id`, FOU12, TODAY)[1];
      run(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a.id); xoaNho();
      regular.reportRegularNoShow(P.admin, a.id, 'listening', true, addDays(a.ws, 2));
      const gvcn = P.normalCoreTeacher.userId;
      await voiMayChu(addDays(a.ws, 40), async (goi) => {
        await ma(await goi(gvNgoai, `/regular/attempts/${a.id}/scores/listening`, put({ noShow: false })), 403, 'GV ngoài lớp');
        const truoc = all(`SELECT id FROM audit_logs WHERE actor_user_id = ? AND entity_id = ?`, gvcn, a.id).length;
        await ma(await goi(gvcn, `/regular/attempts/${a.id}/scores/listening`, put({ noShow: false })), 200, 'GVCN gỡ "-" sau hạn');
        assert(!one(`SELECT no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a.id)?.no_show_period_id, 'còn "-"');
        assert(all(`SELECT id FROM audit_logs WHERE actor_user_id = ? AND entity_id = ?`, gvcn, a.id).length > truoc, 'thiếu nhật ký');
      });
    });
  }

  // ------------------------------------------------------------------ 3 · mở lại Case
  await checkAsync('OV13h-3 · Case L do QL hoàn thành: GV L (hoàn thành được) mở lại → 200 + nhật ký case.reopen; GV W1 → 403; Case hệ thống đóng → 400 (GIỮ)', () => voiMayChu(TODAY, async (goi) => {
    /* Lớp của Case = lớp ghi danh `active` mới nhất của em (`loadCase`) — phải là MB FT 101. */
    const ca = all(`SELECT c.id FROM sos_cases c WHERE c.topic = 'listening' AND c.status != 'done' AND c.system_close_reason IS NULL
      AND (SELECT e.class_id FROM enrollments e WHERE e.student_id = c.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) = ? ORDER BY c.id`, FT101);
    assert(ca.length >= 2, `seed thiếu Case L mở ở MB FT 101: ${ca.length}`);
    const dong = (id: number, heThong: string | null) => run(`UPDATE sos_cases SET status = 'done', closed_by = ?, closed_at = ?, system_close_reason = ? WHERE id = ?`,
      QL.userId, new Date().toISOString(), heThong, id);
    dong(ca[0].id, null); dong(ca[1].id, 'student_finished'); xoaNho();
    await ma(await goi(gvW, `/cases/${ca[0].id}/mo-lai`, post()), 403, 'GV W1 mở lại Case L');
    await ma(await goi(gvL, `/cases/${ca[0].id}/mo-lai`, post()), 200, 'GV L mở lại');
    assert(one('SELECT status FROM sos_cases WHERE id = ?', ca[0].id).status !== 'done' && nk('case.reopen', gvL, ca[0].id) === 1, 'chưa mở lại / thiếu nhật ký');
    await ma(await goi(gvL, `/cases/${ca[1].id}/mo-lai`, post()), 400, 'Case hệ thống đóng');
  }));

  // ------------------------------------------------------------------ 4 · bàn giao sau ngày chuyển lớp
  await checkAsync('OV13h-4 · bàn giao đã xác nhận, đã qua ngày chuyển lớp: GVBM L ghi câu môn → 200, GVCN sửa nhận xét chung → 200 (nhật ký); GVBM môn khác / GV lớp đích → 403', async () => {
    const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
       WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB).map((r) => r.user_id as number);
    const lop = (kind: string, tuanHienTai: number) => {
      seq += 1;
      const bat = dm.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
      return intake.createClass(P.admin, { code: `MB-OV13H${seq}`, branchId: MB, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
    };
    const nguon = lop('FOU', 8), dich = lop('BE', 1);
    const gan = (l: number, u: number, skill: string | null, core: boolean) => run(
      `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
      u, l, skill, core ? 1 : 0, new Date().toISOString());
    gan(nguon, GV[0], null, true); gan(nguon, GV[1], 'listening', false); gan(nguon, GV[2], 'reading', false); gan(dich, GV[3], null, true);
    const now = new Date().toISOString();
    seq += 1;
    const sid = Number(run(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      `PISA-OV13H${seq}`, `Hoc vien OV13H${seq}`, `hoc vien ov13h${seq}`, MB, now).lastInsertRowid);
    run(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`, sid, nguon, TODAY, now);
    run(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`, sid, TODAY, now);
    const r = lenh.raLenh(QL, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: dich, tuan: dm.tuanChonDuoc(TODAY)[0] }] });
    assert(r.ok.length === 1, JSON.stringify(r.failed));
    const l = one('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid).id as number;
    bg.xacNhanBanGiao(loadPrincipal(GV[0]), l, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    run('UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE id = ?', addDays(TODAY, -7), l);   // đã qua ngày thi hành
    await voiMayChu(TODAY, async (goi) => {
      await ma(await goi(GV[2], `/lenh-chuyen/${l}/ban-giao-mon`, put({ mon: 'listening', noiDung: 'Ghi môn người khác' })), 403, 'GVBM môn khác');
      await ma(await goi(GV[1], `/lenh-chuyen/${l}/ban-giao-mon`, put({ mon: 'listening', noiDung: 'Nghe ý chính tốt, cần luyện điền bản đồ.' })), 200, 'GVBM L sau ngày chuyển');
      assert(nk('ban_giao.ghi_mon', GV[1], sid) === 1, 'thiếu nhật ký ban_giao.ghi_mon');
      await ma(await goi(GV[3], `/lenh-chuyen/${l}/ban-giao`, put({ nhanXetChung: 'GV lớp đích sửa nhận xét chung.' })), 403, 'GV lớp đích');
      await ma(await goi(GV[0], `/lenh-chuyen/${l}/ban-giao`, put({ nhanXetChung: 'Em chăm, đã mạnh dạn hơn khi nói. Mẹ theo sát qua Zalo.' })), 200, 'GVCN sau ngày chuyển');
      assert(nk('ban_giao.sua', GV[0], sid) === 1, 'thiếu nhật ký ban_giao.sua');
      const ph = (await (await goi(GV[0], `/lenh-chuyen/ban-giao?lop=${nguon}`)).json()) as any;
      assert(ph.ds?.[0]?.suaDuoc === true, `phiếu GVCN phải còn sửa được: ${JSON.stringify(ph.ds?.[0]?.suaDuoc)}`);
    });
  });

  // ------------------------------------------------------------------ 5 · báo cáo tuần nộp muộn
  await checkAsync('OV13h-5 · tuần đã quá hạn: QL nộp → 200, ô "nộp muộn", nhật ký unit_report.save; Lưu sau khi nộp giữ đã nộp (rà #410); GV → 403; đường Quản trị mở lại đã bỏ (404)', () => voiMayChu(TODAY, async (goi) => {
    const old = one('SELECT * FROM report_periods WHERE week_end < ? ORDER BY week_end DESC LIMIT 1', addDays(TODAY, -7));
    const trongHan = one('SELECT * FROM report_periods WHERE week_end < ? AND week_end >= ? ORDER BY week_end DESC LIMIT 1', TODAY, addDays(TODAY, -3));   // tuần trước, còn hạn tới thứ Tư
    const unit = one(`SELECT id FROM reporting_units WHERE kind = 'branch' AND branch_id = ?`, MB).id as number;
    await ma(await goi(gvL, `/meeting/units/${unit}/reports/students`, put({ periodId: old.id, status: 'ok', note: 'GV thử', nop: true })), 403, 'GV nộp báo cáo');
    const truoc = nk('unit_report.save', QL.userId);
    await ma(await goi(QL.userId, `/meeting/units/${unit}/reports/students`, put({ periodId: old.id, status: 'watch', note: 'Nộp muộn thử', nop: true })), 200, 'QL nộp muộn');
    assert(nk('unit_report.save', QL.userId) === truoc + 1, 'thiếu nhật ký unit_report.save');
    const o = async (pid: number) => ((await (await goi(QL.userId, `/meeting/board?periodId=${pid}`)).json()) as any).units.find((u: any) => u.unitId === unit).cells.find((c: any) => c.key === 'students');
    const muon = await o(old.id);
    assert(muon.trangThai === 'da-nop' && muon.nopMuon === true, `ô quá hạn: ${JSON.stringify({ t: muon.trangThai, m: muon.nopMuon })}`);
    /* Rà #410: "Lưu" trên báo cáo đã nộp = sửa bản đã nộp — vẫn đã nộp, giữ nhãn nộp muộn. */
    await ma(await goi(QL.userId, `/meeting/units/${unit}/reports/students`, put({ periodId: old.id, status: 'problem', note: 'Sửa sau khi nộp' })), 200, 'QL sửa bản đã nộp');
    const sua = await o(old.id);
    assert(sua.trangThai === 'da-nop' && sua.nopMuon === true && sua.status === 'problem', `sửa bản đã nộp về nháp: ${JSON.stringify({ t: sua.trangThai, m: sua.nopMuon, s: sua.status })}`);
    await ma(await goi(QL.userId, `/meeting/units/${unit}/reports/students`, put({ periodId: trongHan.id, status: 'ok', note: 'Trong hạn', nop: true })), 200, 'QL nộp trong hạn');
    assert((await o(trongHan.id)).nopMuon === false, 'nộp trong hạn bị gắn nộp muộn');
    await ma(await goi(P.admin.userId, `/meeting/periods/${old.id}/unlock`, post({ unlocked: true })), 404, 'đường mở lại');
  }));

  // ------------------------------------------------------------------ 6 · góp ý tuần lớp đã kết thúc
  await checkAsync('OV13h-6 · lớp đã kết thúc: GV L ghi góp ý L → 200 + nhật ký gop_y_tuan.ghi; GV W1 ghi cột L → 403', lopTam(FT101, () => voiMayChu(TODAY, async (goi) => {
    const em = one(`SELECT student_id FROM enrollments WHERE class_id = ? ORDER BY id LIMIT 1`, FT101).student_id as number;
    const than = (noiDung: string) => put({ tuan: TODAY, skill: 'listening', studentId: em, noiDung });
    await ma(await goi(gvW, `/classes/${FT101}/gop-y`, than('GV W1 ghi cột L')), 403, 'GV khác môn');
    await ma(await goi(gvL, `/classes/${FT101}/gop-y`, than('Nghe sót số liệu, cần luyện Part 1.')), 200, 'GV L ghi góp ý lớp kết thúc');
    assert(nk('gop_y_tuan.ghi', gvL, em) >= 1, 'thiếu nhật ký gop_y_tuan.ghi');
  })));

  // ------------------------------------------------------------------ 7 · thi thật em Lưu trữ · đề xuất sửa em Tạm dừng
  {
    const x = emFt('2026-12-14');
    await checkAsync('OV13h-7a · em Lưu trữ: QL nhập thi thật → 200 + nhật ký cycle.thi_that; QL chi nhánh khác → 403; sửa điểm xuất phát → 400 (GIỮ)', async () => {
      run('UPDATE students SET archived_at = ? WHERE id = ?', new Date().toISOString(), x.sid); xoaNho();
      try {
        await voiMayChu(TODAY, async (goi) => {
          await ma(await goi(P.cpManager.userId, `/cycles/${x.cy}/outcome`, put({ l: 7, r: 7, w: 6.5, s: 6.5 })), 403, 'QL chi nhánh khác');
          await ma(await goi(QL.userId, `/cycles/${x.cy}/outcome`, put({ l: 7, r: 7, w: 6.5, s: 6.5 })), 200, 'QL nhập thi thật em Lưu trữ');
          assert(one('SELECT thi_that_l FROM learning_cycles WHERE id = ?', x.cy).thi_that_l === 7 && nk('cycle.thi_that', QL.userId, x.cy) === 1, 'chưa lưu / thiếu nhật ký');
          await ma(await goi(QL.userId, `/cycles/${x.cy}/baseline`, put({ source: 'mt1' })), 400, 'sửa lộ trình em Lưu trữ');
        });
      } finally { run('UPDATE students SET archived_at = NULL WHERE id = ?', x.sid); xoaNho(); }
    });
    await checkAsync('OV13h-7b · em Tạm dừng: GVCN gửi đề xuất sửa → 200 + nhật ký request.create; GV lớp khác → 403; em Lưu trữ → 400 (GIỮ)', async () => {
      run(`UPDATE students SET status = 'inactive' WHERE id = ?`, x.sid);
      run(`UPDATE enrollments SET status = 'paused' WHERE student_id = ? AND status = 'active'`, x.sid); xoaNho();
      const gvcn = P.coreTeacher.userId;
      const ngoai = gvNgoai;
      const than = post({ truong: 'khac', moi: 'Cập nhật thông tin thử OV13h', lyDo: 'PH báo đổi' });
      try {
        await voiMayChu(TODAY, async (goi) => {
          await ma(await goi(ngoai, `/students/${x.sid}/de-xuat-sua`, than), 403, 'GV lớp khác');
          await ma(await goi(gvcn, `/students/${x.sid}/de-xuat-sua`, than), 200, 'GVCN đề xuất em Tạm dừng');
          assert(nk('request.create', gvcn) >= 1 && one(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE hoc_vien_id = ? AND loai = 'sua_thong_tin'`, x.sid).n === 1, 'chưa có thẻ / nhật ký');
          run('UPDATE students SET archived_at = ? WHERE id = ?', new Date().toISOString(), x.sid); xoaNho();
          await ma(await goi(gvcn, `/students/${x.sid}/de-xuat-sua`, post({ truong: 'khac', moi: 'Lần hai', lyDo: 'Thử' })), 400, 'em Lưu trữ');
        });
      } finally {
        run(`UPDATE students SET status = 'active', archived_at = NULL WHERE id = ?`, x.sid);
        run(`UPDATE enrollments SET status = 'active' WHERE student_id = ? AND status = 'paused'`, x.sid); xoaNho();
      }
    });
  }
}
