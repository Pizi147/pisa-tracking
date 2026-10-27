/**
 * PHÉP KIỂM HOAN-TAC-XN (luật N3 "luôn Hoàn tác ngắn + khôi phục được, có lịch sử"; panel việc 6b-3 "✓ Đã xác nhận … · Hoàn tác"):
 *   (1) Hoàn tác Xác nhận PA (một PA · cả lô): PA về đúng như trước (chờ xác nhận, mô tả / người / số buổi / hạn cũ), bỏ bản lịch sử "sửa lúc xác nhận"
 *       + mốc Hành trình; việc "Xác nhận PA" hiện lại cùng hạn, việc "Ghi kết quả" mất; nhật ký `case.preset.confirm_undo`.
 *   (2) Hoàn tác Xác nhận Case (Progress): nhóm nguyên nhân gỡ, mức / mô tả / tên về cũ, PA Bổ trợ về chờ (người, số buổi cũ), mốc + Hành trình gỡ.
 *   (3) Hoàn tác Xác nhận Case Speaking chấm chéo: mô tả / nhóm / nguồn về cũ, cờ chờ bật lại → việc "Xác nhận Case" hiện lại cùng hạn.
 *   Chặn: người không quyền / người khác 403 · quá `HOAN_TAC_PA_MS` (+5 s) 409 · bị đè (đã có kết quả, sửa sau, xác nhận PA sau, hoàn tác lần hai) 409.
 * Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 * HOAN-TAC-XN-WEB (HTXN-W*): nháp của việc trả lại được sau khi xoá (`xoaNhapViec`) · mỗi chỗ xác nhận trên web gắn Hoàn tác vào đúng đường đảo: dải panel việc /
 *   chân "✓ Đã lưu" (Xác nhận PA, Xác nhận Case · việc tiếp ›), toast 10 s (Xác nhận Case, Case S khi không có dải), hộp xác nhận lô, dòng Số liệu.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import { emailThu } from '../seed/emailThu.ts';
import { duXacNhan } from './luotThu.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');

export async function runPrHoanTacXnTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { loadPrincipal, lopFtChoGvSpeaking } = await import('../permissions.ts');
  const { phanCongDangHieuLuc } = await import('../worklist/scoreDebt.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nHOAN-TAC-XN · Hoàn tác Xác nhận PA (một · lô) · Xác nhận Case · Xác nhận Case Speaking');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const ma = (fn: () => unknown): number => { try { fn(); return 0; } catch (e: any) { return e?.status ?? -1; } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const MB = one('SELECT branch_id FROM classes WHERE id = ?', LOP).branch_id as number;
  const tuanNay = week.mondayOf(TODAY);
  /** Việc của một Case ở Công việc QL (mọi người) — nhóm · hạn · tiêu đề, để so trước / sau. */
  const viec = (caseId: number, p?: any) => { xoaNho(); return ((p ? mywork.myWork(p) : mywork.myWork(QL, { nguoi: 'tat-ca' })).items as any[]).filter((x) => x.caseId === caseId).map((x) => `${x.group}|${x.due}|${x.tieuDe}`).sort().join(' ; '); };
  const nhatKy = (action: string, id: number) => one('SELECT * FROM audit_logs WHERE action = ? AND entity_id = ? ORDER BY id DESC LIMIT 1', action, id);
  /** Lùi giờ của dòng nhật ký xác nhận mới nhất → quá cửa sổ hoàn tác. */
  const quaGio = (action: string, id: number) => run('UPDATE audit_logs SET created_at = ? WHERE id = ?', new Date(Date.now() - d.HOAN_TAC_PA_MS - 6000).toISOString(), nhatKy(action, id).id);

  /* ---------------------------------------------------------------- dữ liệu: em MT ở MB FT 101 (mẫu prSvNxCase) */
  const nguoiS = () => {
    let gvPT = phanCongDangHieuLuc([LOP], TODAY).get(`${LOP}|speaking`)?.userId as number | undefined;
    if (!gvPT) {
      gvPT = one(`SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.skill = 'speaking' AND ta.status = 'active'
          AND c.branch_id = ? ORDER BY ta.id LIMIT 1`, MB).user_id as number;
      run(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, 'speaking', 0, '2000-01-01', 'active', ?)`,
        gvPT, LOP, new Date().toISOString());
      xoaNho();
    }
    const gvCheo = all(`SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.skill = 'speaking' AND ta.status = 'active' AND c.branch_id = ? AND ta.user_id != ?
          AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY ta.user_id`, MB, gvPT, LOP)
      .map((r) => r.user_id as number).find((u) => lopFtChoGvSpeaking(loadPrincipal(u), TODAY).includes(LOP));
    assert(gvCheo, 'dữ liệu demo: phải có GV Speaking chi nhánh MB ngoài MB FT 101');
    return { gvPT: loadPrincipal(gvPT), gvCheo: loadPrincipal(gvCheo!) };
  };
  let dem = 0;
  const emMt = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `HTXN Em ${++dem}`, target: 7, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = all(`SELECT id, attempt_no FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY attempt_no`, sid);
    [-1, 0, 4].forEach((w, i) => {
      const pid = week.ensurePeriod(addDays(tuanNay, 7 * w)).id;
      skillSch.ensureSkillRows(ds[i].id);
      const a = one('SELECT * FROM assessment_attempts WHERE id = ?', ds[i].id);
      run(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', lich_su = 0, target_at_attempt = ? WHERE id = ?`,
        pid, 6.5 + d.expectationDelta(a.attempt_no, svc.routeCuaLuot(a)), ds[i].id);
      run(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual', sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`, pid, ds[i].id);
    });
    xoaNho();
    return ds[0].id as number;
  };
  const NX = 'Part 2 dừng sau 1 phút, ít từ nối, phát âm đuôi -ed chưa rõ.';
  /** Lượt chốt: L R W1 W2 đạt, S 5 (người lưu S tuỳ chọn) → Case S. */
  const caseS = (nguoiLuuS: any) => {
    const aid = emMt();
    for (const k of ['listening', 'reading']) svc.saveScore(QL, aid, k, { band: 6.5, nhanXet: 'Ổn, giữ nhịp làm bài.' }, TODAY);
    for (const k of ['writing1', 'writing2']) svc.saveScore(QL, aid, k, { criteria: tieuChiThu(6.5), nhanXet: 'Ổn, giữ nhịp làm bài.' }, TODAY);
    svc.saveScore(nguoiLuuS, aid, 'speaking', { criteria: tieuChiThu(5), nhanXet: NX }, TODAY);
    xoaNho();
    const c = one(`SELECT * FROM sos_cases WHERE attempt_id = ? AND topic = 'speaking' AND status != 'done'`, aid);
    assert(c, 'phải có Case S');
    return c;
  };
  const paCho = (caseId: number) => one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1 AND status = 'planned' AND kind != 'bo_tro' ORDER BY id LIMIT 1`, caseId);
  const COT_PA = ['description', 'performer_user_id', 'performer_name', 'so_buoi', 'status', 'started_date', 'cycle_no', 'cycle_started_on', 'action_due', 'followup_due', 'confirmed_by', 'confirmed_at'];
  const anhPa = (id: number) => { const r = one('SELECT * FROM case_interventions WHERE id = ?', id); return JSON.stringify(COT_PA.map((k) => r?.[k] ?? null)); };
  /** Case S có mô tả (GV phụ trách lưu) + PA chờ xác nhận. */
  const coPaCho = () => {
    const { gvPT } = nguoiS();
    const c = caseS(gvPT);
    const pa = paCho(c.id);
    assert(pa, 'Case S phải có PA chờ xác nhận');
    return { c, pa, gvPT };
  };
  const xacNhanPa = (p: any, id: number) => sosAuto.xacNhanPaQuyChe(p, id, duXacNhan(conn, id, { description: 'Luyện Part 2 nói đủ 2 phút, 3 buổi mỗi tuần với GV.' }));

  // ---------------------------------------------------------------- (1) Xác nhận PA
  check('HTXN-1 · Hoàn tác Xác nhận PA: PA về chờ như cũ (mô tả, người, hạn), bản "sửa lúc xác nhận" + mốc Hành trình gỡ, việc như trước xác nhận; nhật ký; trả Case', () => thu(() => {
    const { c, pa } = coPaCho();
    const truoc = { pa: anhPa(pa.id), viec: viec(c.id), status: one('SELECT status FROM sos_cases WHERE id = ?', c.id).status };
    xacNhanPa(QL, pa.id);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', pa.id).status === 'started', 'PA chạy sau xác nhận');
    assert(one(`SELECT COUNT(*) n FROM case_intervention_revisions WHERE intervention_id = ? AND source = 'confirm_edit'`, pa.id).n === 1, 'có bản sửa lúc xác nhận');
    assert(viec(c.id) !== truoc.viec, 'việc phải đổi sau xác nhận');
    const r = sosAuto.hoanTacXacNhanPa(QL, pa.id);
    assert(r && r.id === c.id, `trả Case ${r?.id}`);
    assert(anhPa(pa.id) === truoc.pa, `PA về như cũ: ${anhPa(pa.id)} ≠ ${truoc.pa}`);
    assert(one(`SELECT COUNT(*) n FROM case_intervention_revisions WHERE intervention_id = ?`, pa.id).n === 0, 'bản sửa lúc xác nhận phải gỡ');
    assert(!one(`SELECT 1 c FROM journey_events WHERE dedup_key = ?`, `preset-confirm:${pa.id}`), 'mốc Hành trình phải gỡ');
    assert(one('SELECT status FROM sos_cases WHERE id = ?', c.id).status === truoc.status, 'Case về trạng thái cũ');
    assert(viec(c.id) === truoc.viec, `việc như trước xác nhận:\n${viec(c.id)}\n≠\n${truoc.viec}`);
    const nk = nhatKy('case.preset.confirm_undo', pa.id);
    assert(nk && nk.actor_user_id === QL.userId && nk.entity_type === 'case_intervention', `nhật ký ${JSON.stringify(nk)}`);
    assert(d.nhanHanhDongNhatKy('case.preset.confirm_undo') === 'Hoàn tác xác nhận PA', 'nhãn nhật ký');
    /* Xác nhận lại được sau hoàn tác. */
    xacNhanPa(QL, pa.id);
    assert(one('SELECT status FROM case_interventions WHERE id = ?', pa.id).status === 'started', 'xác nhận lại được');
  }));

  check('HTXN-2 · chặn Hoàn tác Xác nhận PA: QL chi nhánh khác 403 · người khác (có quyền) 403 · quá giờ 409 · đã có kết quả 409 · sửa PA sau 409 · lần hai 409 · không có PA 404', () => thu(() => {
    const { c, pa, gvPT } = coPaCho();
    xacNhanPa(QL, pa.id);
    assert(ma(() => sosAuto.hoanTacXacNhanPa(P.cpManager, pa.id)) === 403, 'QL chi nhánh khác → 403');
    assert(ma(() => sosAuto.hoanTacXacNhanPa(gvPT, pa.id)) === 403, 'GV phụ trách (không phải người xác nhận) → 403');
    quaGio('case.preset.confirm', pa.id);
    assert(ma(() => sosAuto.hoanTacXacNhanPa(QL, pa.id)) === 409, 'quá giờ → 409');
    run('UPDATE audit_logs SET created_at = ? WHERE id = ?', new Date().toISOString(), nhatKy('case.preset.confirm', pa.id).id);
    run(`INSERT INTO case_followups (case_id, intervention_id, observed_on, created_at) VALUES (?, ?, ?, ?)`, c.id, pa.id, TODAY, new Date().toISOString());
    assert(ma(() => sosAuto.hoanTacXacNhanPa(QL, pa.id)) === 409, 'đã có kết quả → 409');
    run('DELETE FROM case_followups WHERE intervention_id = ?', pa.id);
    cases.suaPa(QL, pa.id, { description: 'Sửa sau khi xác nhận: luyện Part 2 + Part 3 mỗi tuần.' });
    assert(ma(() => sosAuto.hoanTacXacNhanPa(QL, pa.id)) === 409, 'sửa PA sau xác nhận → 409');
    assert(ma(() => sosAuto.hoanTacXacNhanPa(gvPT, pa.id)) === 403, 'người khác vẫn 403 (không phải 409) dù PA đã đổi');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', pa.id).status === 'started', 'PA giữ nguyên khi bị chặn');
    assert(ma(() => sosAuto.hoanTacXacNhanPa(QL, 987654)) === 404, 'không có PA → 404');
  }));

  check('HTXN-2b · Hoàn tác lần hai (PA đã về chờ) → 409, PA giữ', () => thu(() => {
    const { pa } = coPaCho();
    xacNhanPa(QL, pa.id);
    sosAuto.hoanTacXacNhanPa(QL, pa.id);
    const sau = anhPa(pa.id);
    assert(ma(() => sosAuto.hoanTacXacNhanPa(QL, pa.id)) === 409, 'lần hai → 409');
    assert(anhPa(pa.id) === sau, 'PA giữ');
  }));

  check('HTXN-3 · Hoàn tác Xác nhận PA cả lô: mỗi PA một giao dịch; PA về chờ; mã sai / PA chưa xác nhận báo riêng, PA khác vẫn xong', () => thu(() => {
    const a = coPaCho(), b = coPaCho();
    const truoc = [anhPa(a.pa.id), anhPa(b.pa.id)];
    const lo = sosAuto.xacNhanPaNhieu(QL, { chung: { description: 'Luyện Part 2 nói đủ 2 phút, 3 buổi mỗi tuần với GV.' },
      ds: [a.pa, b.pa].map((x) => duXacNhan(conn, x.id, { id: x.id })) });
    assert(lo.ok.length === 2, `lô xác nhận ${JSON.stringify(lo)}`);
    const c = coPaCho();   // PA chưa xác nhận
    const r = sosAuto.hoanTacXacNhanPaNhieu(QL, { ids: [a.pa.id, b.pa.id, c.pa.id, 'x'] });
    assert(r.ok.length === 2 && r.ok.includes(a.pa.id) && r.ok.includes(b.pa.id), `ok ${JSON.stringify(r)}`);
    assert(r.loi.length === 2 && r.loi.some((x: any) => x.id === c.pa.id && x.ma === 409) && r.loi.some((x: any) => x.ma === 400), `lỗi ${JSON.stringify(r.loi)}`);
    assert(anhPa(a.pa.id) === truoc[0] && anhPa(b.pa.id) === truoc[1], 'PA về chờ như cũ');
    assert(ma(() => sosAuto.hoanTacXacNhanPaNhieu(QL, { ids: [] })) === 400, 'lô rỗng → 400');
  }));

  // ---------------------------------------------------------------- (2) Xác nhận Case (Progress lớp thường)
  const emTruot = (ten: string, lop: string, diem: Record<string, number>) => {
    const cid = classId(lop);
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `htxn-${ten}` });
    regular.planRegularTests(P.admin, cid);
    const sid = one('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const pt = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'`, sid).id as number;
    for (const [k, v] of Object.entries({ listening: 18, reading: 18, writing: 18, speaking: 18, ...diem })) {
      regular.saveRegularScore(P.admin, pt, k, { score: v, total: 20, lyDo: 'Phép kiểm HTXN' });
    }
    xoaNho();
    return sid;
  };
  const gvOf = (lop: string, skill: string) => loadPrincipal(one(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u);
  const COT_CASE = ['urgency', 'summary', 'title', 'status', 'han_xac_nhan'];
  const anhCase = (id: number) => { const r = one('SELECT * FROM sos_cases WHERE id = ?', id); return JSON.stringify(COT_CASE.map((k) => r?.[k] ?? null)); };
  const caseBe = () => {
    const sid = emTruot(`HTXN BE ${++dem}`, 'MB BE 04', { writing: 10 });
    const c = one(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'writing' ORDER BY id DESC`, sid);
    const bt = one(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' ORDER BY id LIMIT 1`, c.id);
    assert(c && bt && bt.status === 'planned', 'Case Progress Writing + PA Bổ trợ chờ');
    return { c, bt, gv: gvOf('MB BE 04', 'writing') };
  };
  const ct = () => one('SELECT programme_code ct FROM classes WHERE id = ?', classId('MB BE 04')).ct;
  const XN = () => ({ nhom: d.issuesForTopic('writing', ct()).filter((i: any) => !d.laKhac(i.code)).slice(0, 2).map((i: any) => i.code),
    urgency: 'urgent', tenGiua: 'Writing thiếu ý', moTa: 'Viết thiếu ý, sai thì động từ ở đoạn 2.', pa: { soBuoi: 3 } });

  check('HTXN-4 · Hoàn tác Xác nhận Case: nhóm nguyên nhân gỡ, mức / mô tả / tên về cũ, PA Bổ trợ về chờ (số buổi cũ), mốc + Hành trình gỡ, việc như trước; nhật ký; trả Case', () => thu(() => {
    const { c, bt, gv } = caseBe();
    const truoc = { c: anhCase(c.id), pa: anhPa(bt.id), viec: viec(c.id) };
    sosAuto.xacNhanCase(gv, c.id, XN());
    assert(one('SELECT status, so_buoi FROM case_interventions WHERE id = ?', bt.id).status === 'started', 'PA Bổ trợ chạy');
    assert(all('SELECT 1 FROM case_issues WHERE case_id = ?', c.id).length === 2, 'có 2 nhóm');
    const r = sosAuto.hoanTacXacNhanCase(gv, c.id);
    assert(r && r.id === c.id, `trả Case ${r?.id}`);
    assert(!all('SELECT 1 FROM case_issues WHERE case_id = ?', c.id).length, 'nhóm nguyên nhân phải gỡ');
    assert(anhCase(c.id) === truoc.c, `Case về cũ: ${anhCase(c.id)} ≠ ${truoc.c}`);
    assert(anhPa(bt.id) === truoc.pa, `PA Bổ trợ về chờ: ${anhPa(bt.id)} ≠ ${truoc.pa}`);
    assert(!one(`SELECT 1 c FROM case_intervention_revisions WHERE intervention_id = ?`, bt.id), 'bản Sửa PA lúc xác nhận phải gỡ');
    assert(!one(`SELECT 1 c FROM case_milestones WHERE dedup_key = ?`, `xac_nhan_case:${c.id}`), 'mốc xác nhận phải gỡ');
    assert(!one(`SELECT 1 c FROM journey_events WHERE dedup_key IN (?, ?)`, `case-confirm:${c.id}`, `bo-tro-chay:${bt.id}`), 'Hành trình phải gỡ');
    assert(viec(c.id) === truoc.viec, `việc như trước:\n${viec(c.id)}\n≠\n${truoc.viec}`);
    const nk = nhatKy('case.confirm_undo', c.id);
    assert(nk && nk.actor_user_id === gv.userId && nk.entity_type === 'sos_case', `nhật ký ${JSON.stringify(nk)}`);
    assert(d.nhanHanhDongNhatKy('case.confirm_undo') === 'Hoàn tác xác nhận Case', 'nhãn nhật ký');
    sosAuto.xacNhanCase(gv, c.id, XN());
    assert(one('SELECT status FROM case_interventions WHERE id = ?', bt.id).status === 'started', 'xác nhận lại được');
  }));

  check('HTXN-4b · FOU nhóm chung: xác nhận G+V rồi P → hoàn tác G+V chỉ trả PA G+V; PA P vẫn chạy, mốc P giữ, Case P vẫn đã xác nhận', () => thu(() => {
    const sid = emTruot(`HTXN FOU ${++dem}`, 'MB FOU 12', { writing: 11, speaking: 12 });
    const ctF = one('SELECT programme_code ct FROM classes WHERE id = ?', classId('MB FOU 12')).ct;
    const xn = (topic: string) => ({ primaryCode: d.issuesForTopic(topic, ctF)[0].code, urgency: 'attention', moTa: 'Em mất điểm ở phần này, thiếu nền tảng cơ bản.' });
    const cGv = one(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'writing'`, sid), cP = one(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'speaking'`, sid);
    const bt = (caseId: number) => one(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' ORDER BY id LIMIT 1`, caseId);
    assert(cGv && cP && bt(cGv.id).nhom_bo_tro === bt(cP.id).nhom_bo_tro, 'hai Case cùng nhóm Bổ trợ');
    const gvW = gvOf('MB FOU 12', 'writing'), gvS = gvOf('MB FOU 12', 'speaking');
    const truocGv = anhPa(bt(cGv.id).id);
    sosAuto.xacNhanCase(gvW, cGv.id, xn('writing'));
    assert(bt(cP.id).status === 'planned', 'PA P còn chờ sau xác nhận G+V');
    sosAuto.xacNhanCase(gvS, cP.id, xn('speaking'));
    const sauP = anhPa(bt(cP.id).id);
    assert(bt(cP.id).status === 'started', 'PA P chạy sau xác nhận P');
    sosAuto.hoanTacXacNhanCase(gvW, cGv.id);
    assert(anhPa(bt(cGv.id).id) === truocGv, 'PA G+V về chờ');
    assert(anhPa(bt(cP.id).id) === sauP, `PA P giữ nguyên: ${anhPa(bt(cP.id).id)}`);
    assert(one('SELECT 1 c FROM journey_events WHERE dedup_key = ?', `bo-tro-chay:${bt(cP.id).id}`), 'mốc PA P giữ');
    assert(all(`SELECT 1 FROM case_issues WHERE case_id = ? AND role = 'primary'`, cP.id).length === 1, 'Case P vẫn đã xác nhận');
  }));

  check('HTXN-4c · PA của nhóm mà lần xác nhận đổi, bị lần khác đổi tiếp (không nhật ký) → 409, không ghi', () => thu(() => {
    const { c, bt, gv } = caseBe();
    sosAuto.xacNhanCase(gv, c.id, XN());
    run(`UPDATE case_interventions SET performer_name = 'Đổi ngầm', performer_user_id = NULL WHERE id = ?`, bt.id);
    assert(ma(() => sosAuto.hoanTacXacNhanCase(gv, c.id)) === 409, 'PA đổi sau → 409');
    assert(all('SELECT 1 FROM case_issues WHERE case_id = ?', c.id).length === 2, 'không ghi gì');
  }));

  check('HTXN-5 · chặn Hoàn tác Xác nhận Case: GVBM môn khác 403 · QL (không phải người xác nhận) 403 · quá giờ 409 · PA Bổ trợ đã có kết quả 409 · lần hai 409', () => thu(() => {
    const { c, bt, gv } = caseBe();
    sosAuto.xacNhanCase(gv, c.id, XN());
    assert(ma(() => sosAuto.hoanTacXacNhanCase(gvOf('MB BE 04', 'speaking'), c.id)) === 403, 'GVBM môn khác → 403');
    assert(ma(() => sosAuto.hoanTacXacNhanCase(QL, c.id)) === 403, 'QL không phải người xác nhận → 403');
    quaGio('case.confirm', c.id);
    assert(ma(() => sosAuto.hoanTacXacNhanCase(gv, c.id)) === 409, 'quá giờ → 409');
    run('UPDATE audit_logs SET created_at = ? WHERE id = ?', new Date().toISOString(), nhatKy('case.confirm', c.id).id);
    run(`INSERT INTO case_followups (case_id, intervention_id, observed_on, created_at) VALUES (?, ?, ?, ?)`, c.id, bt.id, TODAY, new Date().toISOString());
    assert(ma(() => sosAuto.hoanTacXacNhanCase(gv, c.id)) === 409, 'PA Bổ trợ đã có kết quả → 409');
    run('DELETE FROM case_followups WHERE intervention_id = ?', bt.id);
    sosAuto.hoanTacXacNhanCase(gv, c.id);
    assert(ma(() => sosAuto.hoanTacXacNhanCase(gv, c.id)) === 409, 'lần hai → 409');
  }));

  // ---------------------------------------------------------------- (3) Xác nhận Case Speaking chấm chéo
  const nhom = (caseId: number) => JSON.stringify(all('SELECT id, role, taxonomy_code, observation, created_by FROM case_issues WHERE case_id = ? ORDER BY id', caseId));
  const co = (caseId: number) => one(`SELECT s.cho_phu_trach_xem n FROM assessment_scores s JOIN sos_cases c ON c.attempt_id = s.attempt_id WHERE c.id = ? AND s.skill = 'speaking'`, caseId).n;

  check('HTXN-6 · Hoàn tác Xác nhận Case S (dùng nhận xét · viết mô tả khác): mô tả / nhóm / nguồn về cũ, cờ chờ bật lại, việc "Xác nhận Case" như trước; nhật ký', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    for (const cach of ['dung', 'viet'] as const) {
      const c = caseS(gvCheo);
      const truoc = { nhom: nhom(c.id), nguon: one('SELECT mo_ta_attempt_id m FROM sos_cases WHERE id = ?', c.id).m, viec: viec(c.id, gvPT) };
      assert(co(c.id) === 1 && /Xác nhận Case Speaking/.test(truoc.viec), `chờ xác nhận: ${truoc.viec}`);
      cases.xacNhanCaseS(gvPT, c.id, cach === 'dung' ? { cach } : { cach, moTa: 'Em ngại nói trước lớp, Part 2 dừng sớm.' });
      assert(co(c.id) === 0 && nhom(c.id) !== truoc.nhom, `${cach}: đã xác nhận`);
      const r = cases.hoanTacXacNhanCaseS(gvPT, c.id);
      assert(r && r.id === c.id, `trả Case ${r?.id}`);
      assert(nhom(c.id) === truoc.nhom, `${cach}: nhóm về cũ ${nhom(c.id)} ≠ ${truoc.nhom}`);
      assert(one('SELECT mo_ta_attempt_id m FROM sos_cases WHERE id = ?', c.id).m === truoc.nguon, `${cach}: nguồn mô tả về cũ`);
      assert(co(c.id) === 1, `${cach}: cờ chờ bật lại`);
      assert(viec(c.id, gvPT) === truoc.viec, `${cach}: việc như trước:\n${viec(c.id, gvPT)}\n≠\n${truoc.viec}`);
      const nk = nhatKy('case.xac_nhan_s_undo', c.id);
      assert(nk && nk.actor_user_id === gvPT.userId, `nhật ký ${JSON.stringify(nk)}`);
      const ls = one('SELECT field, old_value, new_value FROM sos_case_history WHERE case_id = ? ORDER BY id DESC LIMIT 1', c.id);
      assert(ls?.field === 'observation' && ls.old_value && ls.new_value === null, `${cach}: lịch sử Case có dòng mô tả đảo lại ${JSON.stringify(ls)}`);
    }
    assert(d.nhanHanhDongNhatKy('case.xac_nhan_s_undo') === 'Hoàn tác xác nhận Case Speaking', 'nhãn nhật ký');
  }));

  check('HTXN-7 · chặn Hoàn tác Xác nhận Case S: người chấm chéo 403 · quá giờ 409 · đã xác nhận PA sau đó 409 · lần hai 409', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    const c = caseS(gvCheo);
    cases.xacNhanCaseS(gvPT, c.id, { cach: 'dung' });
    assert(ma(() => cases.hoanTacXacNhanCaseS(gvCheo, c.id)) === 403, 'người chấm chéo → 403');
    quaGio('case.xac_nhan_s', c.id);
    assert(ma(() => cases.hoanTacXacNhanCaseS(gvPT, c.id)) === 409, 'quá giờ → 409');
    run('UPDATE audit_logs SET created_at = ? WHERE id = ?', new Date().toISOString(), nhatKy('case.xac_nhan_s', c.id).id);
    const pa = paCho(c.id);
    xacNhanPa(gvPT, pa.id);
    assert(ma(() => cases.hoanTacXacNhanCaseS(gvPT, c.id)) === 409, 'đã xác nhận PA sau đó → 409');
    sosAuto.hoanTacXacNhanPa(gvPT, pa.id);
    cases.hoanTacXacNhanCaseS(gvPT, c.id);
    assert(ma(() => cases.hoanTacXacNhanCaseS(gvPT, c.id)) === 409, 'lần hai → 409');
  }));

  check('HTXN-7b · Case S có kết quả PA ghi TRƯỚC lần xác nhận → vẫn hoàn tác được', () => thu(() => {
    const { gvPT, gvCheo } = nguoiS();
    const c = caseS(gvCheo);
    const pa = paCho(c.id);
    run(`INSERT INTO case_followups (case_id, intervention_id, observed_on, created_at) VALUES (?, ?, ?, ?)`, c.id, pa.id, TODAY, new Date(Date.now() - 60_000).toISOString());
    cases.xacNhanCaseS(gvPT, c.id, { cach: 'dung' });
    assert(ma(() => cases.hoanTacXacNhanCaseS(gvPT, c.id)) === 0, 'kết quả cũ không chặn');
    assert(co(c.id) === 1, 'cờ chờ bật lại');
  }));

  // ---------------------------------------------------------------- trần câu SQL · đường
  check(`HTXN-8 · trần câu SQL: PA ≤ ${TRAN_GHI_LO.hoanTacXacNhanPa} · Case ≤ ${TRAN_GHI_LO.hoanTacXacNhanCase} · Case S ≤ ${TRAN_GHI_LO.hoanTacXacNhanCaseS}`, () => thu(() => {
    const dem = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); fn(); return soCauSql() - s0; };
    const { pa } = coPaCho();
    xacNhanPa(QL, pa.id);
    const nPa = dem(() => sosAuto.hoanTacXacNhanPa(QL, pa.id));
    const b = caseBe();
    sosAuto.xacNhanCase(b.gv, b.c.id, XN());
    const nCase = dem(() => sosAuto.hoanTacXacNhanCase(b.gv, b.c.id));
    const { gvPT, gvCheo } = nguoiS();
    const s = caseS(gvCheo);
    cases.xacNhanCaseS(gvPT, s.id, { cach: 'dung' });
    const nS = dem(() => cases.hoanTacXacNhanCaseS(gvPT, s.id));
    console.log(`    hoàn tác xác nhận PA ${nPa} · Case ${nCase} · Case S ${nS} câu`);
    assert(nPa <= TRAN_GHI_LO.hoanTacXacNhanPa && nCase <= TRAN_GHI_LO.hoanTacXacNhanCase && nS <= TRAN_GHI_LO.hoanTacXacNhanCaseS, `${nPa} · ${nCase} · ${nS}`);
  }));

  // ---------------------------------------------------------------- HOAN-TAC-XN-WEB
  check('HTXN-W1 · xoaNhapViec trả hàm ghi lại đúng nháp vừa xoá (chữ về lại ô sau Hoàn tác); việc khác không đụng; kho null không lỗi', () => {
    const m = new Map<string, string>();
    const kho = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); },
      key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } };
    d.ghiNhap(kho, 'case:1', 'mo-ta', 'Em sai thì động từ', false);
    d.ghiNhap(kho, 'case:1', 'pa', { soBuoi: '3' }, false);
    d.ghiNhap(kho, 'case:2', 'mo-ta', 'Việc khác', false);
    const traLai = d.xoaNhapViec(kho, 'case:1');
    assert(d.docNhap(kho, 'case:1', 'mo-ta') === undefined && d.docNhap(kho, 'case:2', 'mo-ta') === 'Việc khác', 'xoá đúng việc');
    traLai();
    assert(d.docNhap(kho, 'case:1', 'mo-ta') === 'Em sai thì động từ' && d.docNhap(kho, 'case:1', 'pa').soBuoi === '3' && m.size === 3, `trả lại ${JSON.stringify([...m])}`);
    d.xoaNhapViec(null, 'x')();
  });

  const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const ham = (src: string, ten: string) => { const i = src.indexOf(`export function ${ten}`); assert(i >= 0, `thiếu ${ten}`); return src.slice(i, src.indexOf('\nexport function', i + 10)); };
  check('HTXN-W2 · Ngăn Case: Xác nhận PA / Case / Case S gắn Hoàn tác đúng đường đảo + trả nháp; không dải thì toast 10 s (HOAN_TAC_PA_MS)', () => {
    const cs = doc('web/src/modules/yThuc/CaseSosControls.tsx');
    const pa = ham(cs, 'XacNhanPaPanel'), ca = ham(cs, 'XacNhanCasePanel'), s = ham(cs, 'XacNhanSPanel');
    assert(/const traNhap = xoaNhap\(\)/.test(pa) && /hoanTac: async \(\) => \{\s*await api\.post\(`\/interventions\/\$\{pa\.id\}\/hoan-tac-xac-nhan`\);\s*traNhap\(\)/.test(pa), 'Xác nhận PA: dải thiếu Hoàn tác / trả nháp');
    assert(/api\.post\(`\/cases\/\$\{caseId\}\/hoan-tac-xac-nhan`\);\s*traNhap\(\)/.test(ca) && /tiep\.lam\(\{ chu, hoanTac \}\)/.test(ca) && /toastHoanTac\(toast, chu, hoanTac\)/.test(ca),
      'Xác nhận Case: dải / toast thiếu Hoàn tác');
    assert(/toastHoanTac\(/.test(s) && /\/cases\/\$\{data\.id\}\/hoan-tac-xac-nhan-s/.test(s) && /traNhap\(\)/.test(s), 'Xác nhận Case S: toast thiếu Hoàn tác');
    assert(/function toastHoanTac[\s\S]{0,200}ms: HOAN_TAC_PA_MS, demLui: true/.test(cs), 'toast Hoàn tác không 10 s đếm lùi');
    assert(/choLaiS[\s\S]{0,120}data\.choXacNhanS\?\.coTheXacNhan/.test(doc('web/src/modules/students/NganCase.tsx')), 'Hoàn tác Case S ở bước Xác nhận PA: không hiện lại Xác nhận Case');
    assert(/const traLai = xoaNhapViec\(/.test(doc('web/src/ui/KhungPanel.tsx')), 'useXoaNhap không đưa hàm trả lại nháp');
    /* Ngoài panel việc (Ngăn Case, hồ sơ HV, toast): Hoàn tác đặt lại nội dung vừa gửi, ô gắn lại điền sẵn một lần (`traLaiO` → `useNhap`). */
    const kp = doc('web/src/ui/KhungPanel.tsx');
    assert(/\?\? \(traLaiNgoai\.get\(o\) as T \| undefined\) \?\? dau/.test(kp) && /traLaiNgoai\.delete\(o\)/.test(kp), 'useNhap không đọc nội dung trả lại khi Hoàn tác');
    assert(/traLaiO\(o\.nhom, nhom\); traLaiO\(o\.moTa, moTa\); traLaiO\(o\.sua, sua\); traLaiO\(o\.pa, v\)/.test(ca)
      && /useNhap<string\[\]>\(o\.nhom/.test(ca) && /useNhap\(o\.moTa/.test(ca), 'Xác nhận Case: Hoàn tác không trả nhóm / mô tả / PA sửa');
    assert(/traLaiO\(`xac-nhan-pa:\$\{pa\.id\}`, v\); traLaiO\(`xac-nhan-pa-bat-dau:\$\{pa\.id\}`, batDau\)/.test(pa) && /useNhap\(`xac-nhan-pa-bat-dau:/.test(pa), 'Xác nhận PA: Hoàn tác không trả nội dung / ngày');
    assert(/traLaiO\(`xac-nhan-s-cach-\$\{data\.id\}`, cach\); traLaiO\(`xac-nhan-s-\$\{data\.id\}`, moTa\)/.test(s) && /useNhap<'dung' \| 'giu' \| 'viet'>/.test(s), 'Xác nhận Case S: Hoàn tác không trả cách / mô tả');
  });

  check('HTXN-W3 · hộp Xác nhận PA cùng lúc + dòng Số liệu: dải "✓ Đã xác nhận …" có Hoàn tác (lô: ids của lần gửi gần nhất)', () => {
    const lo = doc('web/src/modules/congViec/XacNhanPaLo.tsx');
    assert(/api\.post<[^>]+>\('\/interventions\/hoan-tac-xac-nhan-pa-lo', \{ ids: vuaXn\.ids \}\)/.test(lo) && /setVuaXn\(\(v\) => \(\{ lan: [^}]+, ids: okLan \}\)\)/.test(lo), 'lô: Hoàn tác không gửi đúng PA vừa xác nhận');
    assert(/<DaiVuaLuu key=\{vuaXn\?\.lan \?\? 0\}[\s\S]{0,240}hoanTac: hoanTacLo/.test(lo), 'lô: dải không có nút Hoàn tác');
    const sl = doc('web/src/ui/SoLieu.tsx');
    assert(/\/interventions\/\$\{v\.paId\}\/hoan-tac-xac-nhan/.test(sl) && /<NutHoanTac key=\{vuaXong\.lan\} hoanTac=\{vuaXong\.hoanTac\}/.test(sl), 'Số liệu: Xác nhận PA thiếu Hoàn tác');
    const kv = doc('web/src/ui/KhuonViec.tsx');
    assert((kv.match(/<NutHoanTac /g) ?? []).length >= 2 && /export function NutHoanTac[\s\S]{0,200}useHoanTac\(hoanTac, onHoanTac\)/.test(kv), 'dải + chân "Đã lưu" không dùng chung NutHoanTac');
  });

  check('HTXN-9 · đường máy chủ: 4 đường hoàn tác xác nhận (PA, lô PA, Case, Case S)', () => {
    const src = fs.readFileSync(path.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    for (const duong of ['/interventions/:id/hoan-tac-xac-nhan', '/interventions/hoan-tac-xac-nhan-pa-lo', '/cases/:id/hoan-tac-xac-nhan', '/cases/:id/hoan-tac-xac-nhan-s']) {
      assert(src.includes(`api.post('${duong}'`), `thiếu ${duong}`);
    }
  });
}
