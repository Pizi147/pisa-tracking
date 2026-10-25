/**
 * PHÉP KIỂM PR-BV (bản 2, chủ sản phẩm chốt 06/10) — xoá "-" trả lại như cũ + đường lui điểm.
 * R (bài lớp thường xoá điểm về chưa xong) · S (Lịch sử ô lớp thường) · C (nhập lại điểm mở lại đúng Case) ·
 * V (xoá "-" đã chốt ở Mock) · L (xoá "-" lớp thường). Mỗi rủi ro (1)–(5) của chủ sản phẩm một phép kiểm (V5, V6, V8, V9, V10, L2).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import { chotSan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrBvTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const regular: any = await import('../normal/regular.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const LOP_THUONG = classId('MB FOU 12');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loiCua = (fn: () => unknown): any => {
    try { fn(); } catch (e) { return e; }
    assert(false, 'mong có lỗi mà không có');
  };

  let dem = 0;
  /** Em mới ở MB FT 101: MT1, MT2, MT3 ở tuần `w` (so với tuần này), chưa điểm, lịch Quản lý chốt. */
  const emMoi = (w: [number, number, number] = [0, 4, 8], target = 7) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRBV Em ${++dem}`, target, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no`, sid);
    w.forEach((n, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', lich_su = 0 WHERE id = ?`).run(tuan(n).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(n).id, ds[i].id);
    });
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  /* OV-1c: các ca C dựng Case từ MT1 dở (L/R/S) — lượt chốt sẵn (`chotSan`: kỹ năng chưa điểm coi như đã dời tuần). */
  const emMoiChot = () => { const a = emMoi(); for (const id of [a.m1, a.m2, a.m3]) chotSan(conn, id); return a; };
  const luot = (id: number) => get('SELECT * FROM assessment_attempts WHERE id = ?', id);
  const kyNang = (id: number, skill: string) => get(
    `SELECT k.*, p.week_start, p.code FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`, id, skill);
  const dau = (id: number, skill: string) => get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', id, skill);
  /** Nhập band FT: L/R qua số câu, W/S qua bốn tiêu chí. */
  const nhapFt = (who: any, id: number, skill: string, band: number | null, today?: string) => attemptsSvc.saveScore(who, id, skill,
    band === null ? (skill === 'listening' || skill === 'reading' ? { rawScore: null } : { criteria: [null, null, null, null] })
      : skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
        : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
          : { criteria: tieuChiThu(band) }, ...(today ? [today] : []));
  /** Bài Giữa khoá lớp thường (MB FOU 12) ở tuần `n`, đủ bốn môn. */
  const baiThuong = (n: number) => {
    const tag = `PRBV-T${++dem}`;
    const branch = get('SELECT branch_id AS b FROM classes WHERE id = ?', LOP_THUONG).b;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP_THUONG, t.addDays(tuanNay, -42), now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`)
      .run(sid, t.addDays(tuanNay, -42), now).lastInsertRowid);
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'progress',?,?, 'planned', ?)`)
      .run(cy, sid, LOP_THUONG, tuan(n).id, now).lastInsertRowid);
    skillSch.ensureSkillRows(aid);
    return { sid, aid };
  };
  const nhapThuong = (who: any, aid: number, dd: Record<string, number | null>, today?: string) => {
    for (const [k, v] of Object.entries(dd)) regular.saveRegularScore(who, aid, k, { score: v, total: v === null ? null : 20 }, ...(today ? [today] : []));
  };
  const BON = ['listening', 'reading', 'writing', 'speaking'];

  // ------------------------------------------------------------------ R · bài lớp thường xoá điểm về "chưa xong" (Task 1)
  console.log('\nPR-BV · R bài lớp thường xoá điểm về chưa xong');

  check('BV R1 + R2 · Progress Test đủ môn (done) → xoá một môn → planned; nhập lại đủ → done', () => {
    const b = baiThuong(0);
    nhapThuong(P.admin, b.aid, Object.fromEntries(BON.map((k) => [k, 18])));
    assert(luot(b.aid).status === 'done', `đủ môn phải done: ${luot(b.aid).status}`);
    nhapThuong(P.admin, b.aid, { reading: null });
    assert(luot(b.aid).status === 'planned', `xoá một môn phải planned: ${luot(b.aid).status}`);
    nhapThuong(P.admin, b.aid, { reading: 17 });
    assert(luot(b.aid).status === 'done', `nhập lại phải done: ${luot(b.aid).status}`);
  });

  check('BV R3 · bài lớp thường đã huỷ → tính lại không đổi trạng thái', () => {
    const b = baiThuong(0);
    nhapThuong(P.admin, b.aid, { listening: 18 });
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(b.aid);
    regular.refreshRegularOutcome(P.admin, b.aid);
    assert(luot(b.aid).status === 'cancelled', luot(b.aid).status);
  });

  // ------------------------------------------------------------------ S · Lịch sử ô lớp thường (Task 2)
  console.log('\nPR-BV · S Lịch sử ô lớp thường hiện điểm cũ');

  check('BV S1 · lớp thường 16/20 → 15/20 → xoá: attemptDetail.scoreHistory có 3 dòng Nghe, có người và giờ', () => {
    const b = baiThuong(0);
    nhapThuong(P.admin, b.aid, { listening: 16 });
    regular.saveRegularScore(P.admin, b.aid, 'listening', { score: 15, total: 20, lyDo: 'Chấm lại câu 12' });
    nhapThuong(P.admin, b.aid, { listening: null });
    const ls = attemptsSvc.attemptDetail(P.admin, b.aid).scoreHistory.filter((h: any) => h.skill === 'listening');
    const chu = ls.map((h: any) => `${h.before} → ${h.after}`);
    assert(ls.length === 3, `phải 3 dòng: ${JSON.stringify(chu)}`);
    assert(chu[0] === '15/20 → Trống' && chu[1] === '16/20 → 15/20' && chu[2] === 'Chưa có → 16/20', JSON.stringify(chu));
    assert(ls.every((h: any) => h.actorName && h.createdAt && h.skillLabel), 'thiếu người / giờ');
    assert(ls[1].lyDo === 'Chấm lại câu 12', `lý do: ${ls[1].lyDo}`);
  });

  check('BV S2 · dấu "-" lớp thường (ghi, gỡ) hiện ở Lịch sử, kind no_show', () => {
    const b = baiThuong(0);
    regular.reportRegularNoShow(P.admin, b.aid, 'reading', true);
    regular.reportRegularNoShow(P.admin, b.aid, 'reading', false);
    const ls = attemptsSvc.attemptDetail(P.admin, b.aid).scoreHistory.filter((h: any) => h.skill === 'reading');
    assert(ls.length === 2 && ls.every((h: any) => h.kind === 'no_show'), JSON.stringify(ls));
  });

  check('BV S3 · Lịch sử FT không đổi: nhập rồi xoá L → hai dòng score.edit', () => {
    const a = emMoi();
    nhapFt(QL, a.m1, 'listening', 6);
    nhapFt(QL, a.m1, 'listening', null);
    const ls = attemptsSvc.attemptDetail(QL, a.m1).scoreHistory.filter((h: any) => h.skill === 'listening');
    assert(ls.length === 2 && ls[0].after === 'Trống' && ls.every((h: any) => h.kind === 'override'), JSON.stringify(ls));
  });

  // ------------------------------------------------------------------ C · nhập lại điểm sau khi xoá mở lại đúng Case (Task 3)
  console.log('\nPR-BV · C nhập lại điểm sau khi xoá → mở lại đúng Case');
  const caseL = (sid: number, cat = 'listening') => all('SELECT * FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id', sid, cat);
  const paCua = (caseId: number) => all('SELECT id, status, closed_reason FROM case_interventions WHERE case_id = ? ORDER BY id', caseId);

  check('BV C1 · FT: L trượt → Case + PA; xoá L → Case đóng; nhập lại vẫn trượt → CÙNG Case mở lại, PA về như cũ, có lịch sử + nhật ký', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    assert(c && c.status !== 'done', `chưa có Case L: ${JSON.stringify(c)}`);
    const paTruoc = paCua(c.id);
    assert(paTruoc.length >= 1, 'Case chưa có PA');
    nhapFt(QL, a.m1, 'listening', null);
    const dong = get('SELECT * FROM sos_cases WHERE id = ?', c.id);
    assert(dong.status === 'done' && dong.dedup_key === null, JSON.stringify(dong));
    assert(paCua(c.id).every((x) => x.status === 'cancelled' || paTruoc.find((y) => y.id === x.id)?.status !== 'planned'), 'PA chưa huỷ');
    nhapFt(QL, a.m1, 'listening', 5);
    const ds = caseL(a.sid);
    assert(ds.length === 1, `phải đúng một Case L, có ${ds.length}`);
    const mo = ds[0];
    assert(mo.id === c.id && mo.status === c.status && mo.closed_at === null && mo.closed_by === null && mo.outcome_note === null, JSON.stringify(mo));
    assert(mo.dedup_key === c.dedup_key, `khoá chống trùng: ${mo.dedup_key} ≠ ${c.dedup_key}`);
    assert(JSON.stringify(paCua(c.id).map((x) => [x.id, x.status])) === JSON.stringify(paTruoc.map((x) => [x.id, x.status])), `PA: ${JSON.stringify(paCua(c.id))} ≠ ${JSON.stringify(paTruoc)}`);
    assert(!get('SELECT 1 FROM sos_cases WHERE previous_case_id = ?', c.id), 'không có Case nối');
    assert(get(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'status' AND old_value = 'done' AND new_value = ?`, c.id, c.status), 'thiếu lịch sử done → mở');
    assert(get(`SELECT 1 FROM audit_logs WHERE action = 'case.mo_lai_xoa_diem' AND entity_id = ?`, c.id), 'thiếu nhật ký');
    assert(get(`SELECT status, case_id FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`, a.m1).case_id === c.id, 'tín hiệu chưa nối lại');
  });

  check('BV C2 · xoá L rồi nhập lại ĐẠT → Case giữ đóng, không Case mới', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    nhapFt(QL, a.m1, 'listening', null);
    nhapFt(QL, a.m1, 'listening', 8.5);
    const ds = caseL(a.sid);
    assert(ds.length === 1 && ds[0].status === 'done' && ds[0].id === c.id, JSON.stringify(ds.map((x) => [x.id, x.status])));
  });

  check('BV C3 · Case đóng vì SỬA THÀNH ĐẠT rồi sửa lại trượt → Case mới (luật cũ)', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    nhapFt(QL, a.m1, 'listening', 8.5);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done', 'sửa thành đạt chưa đóng Case');
    nhapFt(QL, a.m1, 'listening', 5);
    const ds = caseL(a.sid);
    assert(ds.length === 2 && ds[1].id !== c.id && ds[1].status !== 'done' && ds[0].status === 'done', JSON.stringify(ds.map((x) => [x.id, x.status])));
  });

  check('BV C4 · Case đóng do xoá L của MT1, rồi MT2 L trượt → Case mới (chỉ mở lại khi cùng lượt + kỹ năng)', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    nhapFt(QL, a.m1, 'listening', null);
    const cn2 = t.addDays(tuan(4).weekStart, 6);
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m2, k, 5, cn2);
    const ds = caseL(a.sid);
    assert(ds.length === 2 && get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done' && ds[1].status !== 'done', JSON.stringify(ds.map((x) => [x.id, x.status, x.attempt_id])));
  });

  check('BV C5 · lớp thường Progress Test: Nghe trượt → Case + PA bổ trợ; xoá → đóng; nhập lại trượt → cùng Case, PA cũ', () => {
    const b = baiThuong(0);
    nhapThuong(P.admin, b.aid, { listening: 10, reading: 18, writing: 18, speaking: 18 });
    const [c] = caseL(b.sid);
    assert(c && c.status !== 'done', `chưa có Case Nghe: ${JSON.stringify(c)}`);
    const paTruoc = paCua(c.id);
    nhapThuong(P.admin, b.aid, { listening: null });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done', 'xoá chưa đóng Case');
    nhapThuong(P.admin, b.aid, { listening: 10 });
    const ds = caseL(b.sid);
    assert(ds.length === 1 && ds[0].id === c.id && ds[0].status === c.status, JSON.stringify(ds.map((x) => [x.id, x.status])));
    assert(JSON.stringify(paCua(c.id).map((x) => [x.id, x.status])) === JSON.stringify(paTruoc.map((x) => [x.id, x.status])), `PA: ${JSON.stringify(paCua(c.id))}`);
  });

  check('BV C6 · Case có PA đã làm (có kết quả tuần) → xoá L không đóng; nhập lại → cùng Case, PA giữ nguyên', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    const iv = paCua(c.id)[0];
    conn.prepare(`UPDATE case_interventions SET status = 'started' WHERE id = ?`).run(iv.id);
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observer_user_id, observed_on, note, created_at) VALUES (?,?,?,?,?,?)`)
      .run(c.id, iv.id, QL.userId, TODAY, 'PRBV C6', new Date().toISOString());
    nhapFt(QL, a.m1, 'listening', null);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status !== 'done', 'Case có việc thật không được đóng');
    nhapFt(QL, a.m1, 'listening', 5);
    const ds = caseL(a.sid);
    assert(ds.length === 1 && paCua(c.id).find((x) => x.id === iv.id)!.status === 'started', JSON.stringify(paCua(c.id)));
  });

  /* Thi lại (xoá để thi lại) rồi trượt → Case MỚI: phép kiểm cũ S3F (1) "Thi lại L" giữ nguyên, canh luật này. */

  // ------------------------------------------------------------------ V · xoá "-" đã chốt ở Mock (Task 4)
  console.log('\nPR-BV · V xoá "-" đã chốt (Mock) trả lại như trước khi gõ');
  const perm: any = await import('../permissions.ts');
  const lop = (sql: string, ...a: unknown[]) => (get(sql, ...a)?.u ?? null) as number | null;
  const coreIds = `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`;
  /** GV chấm L không kiêm GVCN (nếu lớp không có thì lấy GV L). */
  const gvL = perm.loadPrincipal(lop(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' AND user_id NOT IN (${coreIds}) LIMIT 1`, LOP, LOP)
    ?? P.lrTeacher.userId);
  /** GV không chấm L, không là GVCN. */
  const gvKhac = perm.loadPrincipal(lop(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (${coreIds}) AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active') LIMIT 1`, LOP, LOP, LOP));
  const GVCN = P.coreTeacher;
  const go = (who: any, id: number, skill: string, today?: string) => attemptsSvc.saveScore(who, id, skill, { noShow: false }, ...(today ? [today] : []));
  const goVao = (who: any, id: number, skill: string, today?: string) => attemptsSvc.saveScore(who, id, skill, { noShow: true }, ...(today ? [today] : []));
  const deNghi = (id: number, skill = 'listening') => all('SELECT * FROM skill_move_requests WHERE attempt_id = ? AND skill = ? ORDER BY id', id, skill);
  const theCua = (reqId: number) => get(`SELECT * FROM yeu_cau_duyet WHERE doi_tuong_loai = 'skill_move' AND doi_tuong_id = ? ORDER BY id DESC`, reqId);
  /** Thứ Tư của tuần `n` — "-" gõ TRONG tuần thi (OV-1b: gõ sau tuần thi là "Không dự thi", không còn là vắng). */
  const thu4 = (n: number) => t.addDays(tuan(n).weekStart, 2);
  /** Em có MT1 ở tuần `n`; QL gõ "-" L trong tuần thi → chốt ngay (lần 1 tự dời, lần 2 huỷ vắng). */
  const vangL = (n: number, lanTruoc = 0) => {
    const a = emMoi([n, 4, 8]);
    if (lanTruoc) conn.prepare(`UPDATE attempt_skills SET absence_move_count = ? WHERE attempt_id = ? AND skill = 'listening'`).run(lanTruoc, a.m1);
    goVao(QL, a.m1, 'listening', thu4(n));
    assert(dau(a.m1, 'listening')?.no_show_settled_at, 'dấu "-" chưa chốt');
    return a;
  };
  /**
   * VẮNG CHỜ QUẢN LÝ (lần 1 chuyển QL): OV-1b chỉ còn ở dữ liệu cũ (chốt muộn) hoặc khi lần dời bị chặn — dựng đúng trạng thái đó: dấu "-" ở
   * tuần đang xếp của L rồi chốt muộn hôm nay (`settleGroup`, tuần kế tiếp đã hết → chuyển QL).
   */
  const choQL = (aid: number) => {
    const k = get(`SELECT k.id, k.planned_period_id AS p, rp.week_end, rp.code FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
      WHERE k.attempt_id = ? AND k.skill = 'listening'`, aid);
    const s0 = dau(aid, 'listening');
    const scId = s0
      ? (conn.prepare('UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0, no_show_settled_at = NULL, no_show_cu = 0 WHERE id = ?')
        .run(k.p, QL.userId, new Date().toISOString(), s0.id), s0.id as number)
      : Number(conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at) VALUES (?, ?, ?, ?, ?)')
        .run(aid, 'listening', k.p, QL.userId, new Date().toISOString()).lastInsertRowid);
    absence.settleGroup(conn, aid, k.id, 'listening', k.week_end, k.code, [scId], null, 'Vắng (dựng dữ liệu cũ)', TODAY);
  };
  const vangCho = (n: number) => { const a = emMoi([n, 4, 8]); choQL(a.m1); return a; };
  const han = (n: number) => t.addDays(tuan(n).weekStart, 9);   // hết thứ Tư sau tuần thi gốc

  check('BV V1 · tự dời (vắng lần 1) → QL xoá "-" → về tuần gốc, lần vắng 0, ô hết "-", nhập điểm được ngay', () => {
    const a = vangL(-1);
    let k = kyNang(a.m1, 'listening');
    assert(k.planned_period_id === tuan(0).id && k.absence_move_count === 1 && k.sit_status === 'scheduled', `chưa tự dời: ${JSON.stringify(k)}`);
    const r = go(QL, a.m1, 'listening');
    k = kyNang(a.m1, 'listening');
    assert(k.planned_period_id === tuan(-1).id && k.absence_move_count === 0 && k.sit_status === 'scheduled' && k.huy_vang === 0, JSON.stringify(k));
    assert(dau(a.m1, 'listening').no_show_period_id === null && dau(a.m1, 'listening').no_show_settled_at === null, 'còn dấu');
    assert(r.goVang?.tuanVe === d.tuanLich(tuan(-1).weekStart, TODAY) && r.goVang.giuLich === false && r.goVang.lanVang === 0, JSON.stringify(r.goVang));
    nhapFt(QL, a.m1, 'listening', 6.5);
    assert(dau(a.m1, 'listening').band === 6.5, 'nhập điểm');
  });

  check('BV V2 · sau V1 gõ "-" lại → vẫn vắng lần 1 (tự dời), không "huỷ vắng 2 lần"', () => {
    const a = vangL(-1);
    go(QL, a.m1, 'listening');
    goVao(QL, a.m1, 'listening', thu4(-1));
    const k = kyNang(a.m1, 'listening');
    assert(k.planned_period_id === tuan(0).id && k.absence_move_count === 1 && k.sit_status === 'scheduled' && k.huy_vang === 0, JSON.stringify(k));
  });

  check('BV V3 · vắng chờ duyệt (lần 1 trễ) → xoá "-" → đề nghị rút, thẻ tự đóng; vắng lại (chuyển QL) → có đề nghị mới', () => {
    const a = vangCho(-3);
    const [rq] = deNghi(a.m1);
    assert(kyNang(a.m1, 'listening').sit_status === 'absent' && rq?.status === 'pending' && theCua(rq.id)?.trang_thai === 'cho', 'chưa chờ duyệt');
    go(QL, a.m1, 'listening');
    const k = kyNang(a.m1, 'listening');
    assert(k.sit_status === 'scheduled' && k.planned_period_id === tuan(-3).id && k.absence_move_count === 0, JSON.stringify(k));
    assert(deNghi(a.m1)[0].status === 'withdrawn' && theCua(rq.id).trang_thai === 'tu_dong', 'đề nghị / thẻ chưa rút');
    choQL(a.m1);
    const cho = deNghi(a.m1).filter((x) => x.status === 'pending');
    /* Dùng lại dòng đã rút (UNIQUE lượt + kỹ năng + lần dời) — thẻ mới đang chờ. */
    assert(cho.length === 1 && theCua(cho[0].id)?.trang_thai === 'cho', `gõ lại: ${JSON.stringify(deNghi(a.m1))}`);
  });

  check('BV V4 · huỷ vắng 2 lần + thẻ Xin dời đang chờ → xoá "-" → về tuần gốc, huy_vang 0, thẻ rút, lần vắng giữ 1', () => {
    const a = vangL(-1, 1);
    assert(kyNang(a.m1, 'listening').huy_vang === 1, 'chưa huỷ vắng');
    const x = absence.xinDoi(P.mbManager, a.m1, 'listening');
    go(QL, a.m1, 'listening');
    const k = kyNang(a.m1, 'listening');
    assert(k.sit_status === 'scheduled' && k.huy_vang === 0 && k.planned_period_id === tuan(-1).id && k.absence_move_count === 1, JSON.stringify(k));
    assert(deNghi(a.m1)[0].status === 'withdrawn' && theCua(x.requestId).trang_thai === 'tu_dong', 'thẻ chưa rút');
  });

  check('BV V5 (2) · thẻ ĐÃ DUYỆT → xoá "-": lịch giữ, lần vắng −1, thẻ giữ "duyet" + "vắng đã gỡ"; ĐÃ TỪ CHỐI → giữ huỷ, thẻ giữ', () => {
    const a = vangCho(-3);
    const [rq] = deNghi(a.m1);
    yeuCau.duyetYeuCau(QL, theCua(rq.id).id);
    const truoc = kyNang(a.m1, 'listening');
    assert(truoc.absence_move_count === 1 && truoc.sit_status === 'scheduled', JSON.stringify(truoc));
    const r = go(QL, a.m1, 'listening');
    const k = kyNang(a.m1, 'listening');
    assert(k.planned_period_id === truoc.planned_period_id && k.sit_status === 'scheduled' && k.absence_move_count === 0, JSON.stringify(k));
    assert(r.goVang?.giuLich === true && r.goVang.tuanVe === d.tuanLich(truoc.week_start, TODAY), JSON.stringify(r.goVang));
    const the = theCua(rq.id);
    assert(the.trang_thai === 'duyet' && the.ly_do_dong === 'vắng đã gỡ', JSON.stringify(the));
    const b = vangCho(-3);
    const [rq2] = deNghi(b.m1);
    yeuCau.tuChoiYeuCau(QL, theCua(rq2.id).id, 'x');
    const tc = kyNang(b.m1, 'listening');
    go(QL, b.m1, 'listening');
    const k2 = kyNang(b.m1, 'listening');
    assert(k2.sit_status === tc.sit_status && k2.sit_status === 'cancelled' && k2.absence_move_count === 0, JSON.stringify(k2));
    assert(theCua(rq2.id).trang_thai === 'tu_choi' && theCua(rq2.id).ly_do_dong === 'vắng đã gỡ', JSON.stringify(theCua(rq2.id)));
  });

  check('BV V6 (1) · tự dời rồi nhập điểm ở tuần mới → lịch tuần mới + lần vắng 1 giữ, không còn "-" để xoá', () => {
    const a = vangL(-1);
    nhapFt(QL, a.m1, 'listening', 6);
    const k = kyNang(a.m1, 'listening');
    assert(k.planned_period_id === tuan(0).id && k.absence_move_count === 1 && dau(a.m1, 'listening').no_show_period_id === null, JSON.stringify(k));
    const o = attemptsSvc.attemptDetail(QL, a.m1).cells.find((c: any) => c.skill === 'listening');
    assert(o.daChot === null, JSON.stringify(o.daChot));
  });

  /* OV-1b (3.3) đổi khung gỡ: bài ĐÃ DỜI vì vắng → "Bỏ vắng" không theo hạn tuần cũ (GV đúng kỹ năng / GVCN / QL); bài chưa dời (vắng chờ QL)
     vẫn hết thứ Tư sau tuần gốc như PR-BV. */
  /* OV-13h (chủ SP 15/10): bỏ hạn gỡ — vắng chờ QL cũng gỡ được mọi lúc bởi GV chấm L / GVCN. */
  check('BV V7 · khung gỡ: đã dời → GV chấm L / GVCN Bỏ vắng được cả sau hạn tuần cũ; vắng chờ QL → GV chấm L / GVCN gỡ cả sau thứ Tư (OV-13h); GV kỹ năng khác 403; QL 3 tuần sau được', () => {
    const a = vangL(-1);
    assert(loiCua(() => go(gvKhac, a.m1, 'listening', han(-1))).status === 403, 'GV kỹ năng khác');
    go(gvL, a.m1, 'listening', t.addDays(han(-1), 1));
    assert(kyNang(a.m1, 'listening').planned_period_id === tuan(-1).id, 'GV L Bỏ vắng sau hạn tuần cũ');
    const b = vangL(-1);
    go(GVCN, b.m1, 'listening', t.addDays(han(-1), 1));
    assert(kyNang(b.m1, 'listening').absence_move_count === 0, 'GVCN Bỏ vắng');
    for (const who of [gvL, GVCN]) {
      const c = vangCho(-3);
      go(who, c.m1, 'listening', t.addDays(han(-3), 1));
      assert(kyNang(c.m1, 'listening').sit_status === 'scheduled', 'GV / GVCN gỡ sau thứ Tư');
    }
    const c = vangCho(-3);
    go(QL, c.m1, 'listening', t.addDays(han(-3), 21));
    assert(kyNang(c.m1, 'listening').sit_status === 'scheduled', 'QL 3 tuần sau');
  });

  check('BV V8 (3) · xoá "-" sau tự dời: không thêm chuông nào, chuông tự dời cũ còn', () => {
    const a = vangL(-1);
    const n = (get('SELECT COUNT(*) n FROM notifications').n) as number;
    const cu = get(`SELECT COUNT(*) n FROM notifications WHERE kind = 'tu_doi_lich' AND entity_id = ?`, a.m1).n as number;
    go(QL, a.m1, 'listening');
    assert(get('SELECT COUNT(*) n FROM notifications').n === n, 'có chuông mới');
    assert(cu > 0 && get(`SELECT COUNT(*) n FROM notifications WHERE kind = 'tu_doi_lich' AND entity_id = ?`, a.m1).n === cu, 'chuông cũ bị đụng');
  });

  check('BV V9 (4) · nhật ký: lịch "skill_absence_undone" cũ → mới + người; audit score.no_show_cleared trước/sau đủ trường', () => {
    const a = vangL(-1);
    go(QL, a.m1, 'listening');
    const h = get(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_absence_undone' ORDER BY id DESC`, a.m1);
    assert(h && h.field === 'listening' && h.old_value === tuan(0).code && h.new_value === tuan(-1).code && h.actor_user_id === QL.userId, JSON.stringify(h));
    const l = get(`SELECT * FROM audit_logs WHERE action = 'score.no_show_cleared' AND entity_id = ? ORDER BY id DESC`, a.m1);
    const tr = JSON.parse(l.before_json), sa = JSON.parse(l.after_json);
    assert(tr.week === tuan(0).code && tr.moveCount === 1 && tr.sitStatus === 'scheduled' && tr.huyVang === false, l.before_json);
    assert(sa.week === tuan(-1).code && sa.moveCount === 0 && sa.sitStatus === 'scheduled' && sa.huyVang === false && sa.giuLich === false, l.after_json);
  });

  check('BV V10 (5) · MT cũ: "-" (no_show_cu) → xoá: chỉ gỡ dấu, không đụng lịch / lần vắng', () => {
    const a = emMoi([-1, 4, 8]);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a.m1);
    goVao(QL, a.m1, 'listening');
    assert(dau(a.m1, 'listening').no_show_cu === 1, 'chưa ghi "-" MT cũ');
    go(QL, a.m1, 'listening');
    const k = kyNang(a.m1, 'listening');
    assert(dau(a.m1, 'listening').no_show_period_id === null && k.planned_period_id === tuan(-1).id && k.absence_move_count === 0, JSON.stringify(k));
    assert(!get(`SELECT 1 FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_absence_undone'`, a.m1), 'không được ghi gỡ vắng');
  });

  /* OV-1b: "-" chưa chốt chỉ còn ở buổi Writing mới một task "-" (L/R/S "-" trong tuần chốt ngay). */
  check('BV V11 · "-" chưa chốt (W1 một mình, trong tuần thi) → xoá: như nay, lịch không đổi', () => {
    const a = emMoi([0, 4, 8]);
    goVao(QL, a.m1, 'writing1');
    assert(!dau(a.m1, 'writing1').no_show_settled_at, 'đã chốt');
    go(QL, a.m1, 'writing1');
    assert(dau(a.m1, 'writing1').no_show_period_id === null && kyNang(a.m1, 'writing').planned_period_id === tuan(0).id, 'đổi lịch');
  });

  check('BV V12 · Writing: W1 + W2 "-" chốt → xoá "-" ở W1 → về tuần gốc, gỡ cả hai dấu', () => {
    const a = emMoi([-1, 4, 8]);
    goVao(QL, a.m1, 'writing1', thu4(-1));
    goVao(QL, a.m1, 'writing2', thu4(-1));
    assert(kyNang(a.m1, 'writing').planned_period_id === tuan(0).id && kyNang(a.m1, 'writing').absence_move_count === 1, 'W chưa tự dời');
    go(QL, a.m1, 'writing1');
    const k = kyNang(a.m1, 'writing');
    assert(k.planned_period_id === tuan(-1).id && k.absence_move_count === 0, JSON.stringify(k));
    assert(dau(a.m1, 'writing1').no_show_period_id === null && dau(a.m1, 'writing2').no_show_period_id === null, 'còn dấu W');
  });

  check('BV V13 · ô đã chốt hiện "-" (daChot): đã dời → doiSang mã tuần mới; Bỏ vắng (OV-1b) không theo hạn tuần cũ: GV L goDuoc cả sau hạn, không hạn; GV kỹ năng khác false', () => {
    const a = vangL(-1);
    const o = (who: any, today: string) => attemptsSvc.skillCells(who, luot(a.m1), attemptsSvc.scoresOf(a.m1), attemptsSvc.skipsOf(a.m1), today,
      skillSch.ensureSkillRows(a.m1)).find((c: any) => c.skill === 'listening');
    const ql = o(QL, han(-1));
    /* OV-13h: không còn hạn gỡ — ô không mang `hanGo`. */
    assert(ql.daChot && ql.daChot.doiSang === d.tuanLich(tuan(0).weekStart, han(-1)) && ql.daChot.goDuoc === true && !('hanGo' in ql.daChot), JSON.stringify(ql.daChot));
    assert(o(gvL, han(-1)).daChot.goDuoc === true, 'GV trong khung');
    assert(o(gvL, t.addDays(han(-1), 1)).daChot.goDuoc === true, 'GV sau hạn tuần cũ vẫn Bỏ vắng được');
    assert(o(gvKhac, han(-1)).daChot.goDuoc === false, 'GV kỹ năng khác');
    assert(ql.noShow === null, 'ô đã dời vẫn là việc nhập điểm ở tuần mới (không phải "-")');
  });

  /* Rà độc lập (#1): đề nghị đã duyệt / hết hạn giữ số lần dời cũ — vắng lại sau khi gỡ không được vỡ UNIQUE (attempt, skill, move_no). */
  check('BV V14 · đã duyệt → xoá "-" (lần vắng 0) → vắng lại, lại chuyển QL: có đề nghị mới, thẻ cũ vẫn "lần 1"; hết hạn → xoá → vắng lại: cũng vậy', () => {
    const a = vangCho(-3);
    const [rq] = deNghi(a.m1);
    yeuCau.duyetYeuCau(QL, theCua(rq.id).id);
    go(QL, a.m1, 'listening');
    skillSch.setSkillWeek(QL, a.m1, 'listening', tuan(-3).id, {});
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.m1);   // dời về tuần đã qua làm lượt thành MT cũ — giữ MT thường như emMoi
    choQL(a.m1);
    const cho = deNghi(a.m1).filter((x) => x.status === 'pending');
    assert(cho.length === 1 && cho[0].move_no === 1 && theCua(cho[0].id)?.trang_thai === 'cho', JSON.stringify(deNghi(a.m1)));
    /* Thẻ đọc lần dời bằng `move_no % 100` (loaiYeuCau) — dòng đã cất vẫn ra "lần 1". */
    assert(get('SELECT move_no % 100 AS n FROM skill_move_requests WHERE id = ?', rq.id).n === 1, 'thẻ đã duyệt phải vẫn là lần 1');
    const b = vangCho(-3);
    const [rq2] = deNghi(b.m1);
    conn.prepare('UPDATE skill_move_requests SET decide_by = ? WHERE id = ?').run(t.addDays(TODAY, -1), rq2.id);
    absence.sweepExpiredMoves();
    go(QL, b.m1, 'listening');
    assert(kyNang(b.m1, 'listening').sit_status === 'scheduled' && kyNang(b.m1, 'listening').planned_period_id === tuan(-3).id, 'hết hạn (máy) → về tuần gốc');
    choQL(b.m1);
    assert(deNghi(b.m1).filter((x) => x.status === 'pending').length === 1, JSON.stringify(deNghi(b.m1)));
  });

  /* Rà độc lập (#4): đổi hạn chấm không phải quyết định về lịch / vắng. */
  check('BV V15 · tự dời → QL đổi hạn chấm kỹ năng → xoá "-" vẫn về tuần gốc', () => {
    const a = vangL(-1);
    skillSch.setSkillDeadline(QL, a.m1, 'listening', t.addDays(TODAY, 20), null);
    const r = go(QL, a.m1, 'listening');
    assert(kyNang(a.m1, 'listening').planned_period_id === tuan(-1).id && r.goVang.giuLich === false, JSON.stringify(r.goVang));
  });

  /* Rà độc lập (#2): Case đóng vì thi lại TRƯỚC PR-BV (không có mã `dong_do_xoa`) — không được mở lại (dữ liệu cũ). */
  check('BV C7 · Case đóng không có mã "đóng do xoá" (thi lại / dữ liệu trước PR) → nhập điểm trượt tạo Case mới', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    nhapFt(QL, a.m1, 'listening', null);
    conn.prepare(`DELETE FROM sos_case_history WHERE case_id = ? AND field = 'dong_do_xoa'`).run(c.id);
    nhapFt(QL, a.m1, 'listening', 5);
    const ds = caseL(a.sid);
    assert(ds.length === 2 && get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done', JSON.stringify(ds.map((x) => [x.id, x.status])));
  });

  /* Rà planning #228 (2): nhận "đóng do xoá" bằng MÃ MÁY — chữ outcome_note đổi (vd PR-EN dịch) vẫn mở lại đúng Case. */
  check('BV C8 · xoá L → đổi chữ outcome_note → nhập lại trượt vẫn mở lại CÙNG Case; người đóng lại sau khi mở → không mở lại', () => {
    const a = emMoiChot();
    for (const k of ['listening', 'reading', 'speaking']) nhapFt(QL, a.m1, k, 5);
    const [c] = caseL(a.sid);
    nhapFt(QL, a.m1, 'listening', null);
    conn.prepare('UPDATE sos_cases SET outcome_note = ? WHERE id = ?').run('Score was cleared', c.id);
    nhapFt(QL, a.m1, 'listening', 5);
    const ds = caseL(a.sid);
    assert(ds.length === 1 && ds[0].id === c.id && ds[0].status !== 'done', JSON.stringify(ds.map((x) => [x.id, x.status])));
  });

  check('BV V16 · câu 403: QL chi nhánh khác → "Bạn không có quyền với lớp này."; GV lớp khác kỹ năng → câu nêu ai gỡ được', () => {
    const a = vangL(-1);
    const e1 = loiCua(() => go(P.cpManager ?? perm.loadPrincipal(lop(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id WHERE r.key = 'manager' AND b.code = 'CP' LIMIT 1`)), a.m1, 'listening', han(-1)));
    assert(e1.status === 403 && e1.message === 'Bạn không có quyền với lớp này.', `${e1.status} ${e1.message}`);
    const e2 = loiCua(() => go(gvKhac, a.m1, 'listening', han(-1)));
    assert(e2.status === 403 && /GVCN hoặc Quản lý/.test(e2.message), e2.message);
  });

  // ------------------------------------------------------------------ L · xoá "-" lớp thường (Task 5)
  console.log('\nPR-BV · L xoá "-" lớp thường');
  const coreThuong = `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`;
  const gvNghe = perm.loadPrincipal(lop(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' AND user_id NOT IN (${coreThuong}) LIMIT 1`, LOP_THUONG, LOP_THUONG)
    ?? lop(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' LIMIT 1`, LOP_THUONG));
  const vangThuong = (who: any, aid: number, bat: boolean, today?: string) => regular.reportRegularNoShow(who, aid, 'listening', bat, ...(today ? [today] : []));

  check('BV L1 · "-" Nghe → dời; xoá "-" → tuần cũ; "-" lần sau vẫn là lần 1 (không chuông "lần 2")', () => {
    const b = baiThuong(0);
    vangThuong(P.admin, b.aid, true);
    assert(kyNang(b.aid, 'listening').planned_period_id === tuan(1).id, 'chưa dời');
    vangThuong(P.admin, b.aid, false);
    assert(kyNang(b.aid, 'listening').planned_period_id === tuan(0).id, 'chưa về');
    vangThuong(P.admin, b.aid, true);
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ?`, `vang-thuong:${b.aid}:listening:%`).n === 0, 'chuông "lần 2" oan');
  });

  check('BV L2 (1) · tuần mới đã có điểm → xoá "-" ở ô tuần cũ → được: gỡ dấu, lịch giữ tuần có điểm, điểm giữ', () => {
    const b = baiThuong(0);
    vangThuong(P.admin, b.aid, true);
    const tuanMoi = tuan(1).weekStart;
    regular.saveRegularScore(P.admin, b.aid, 'listening', { score: 15, total: 20 }, tuanMoi);
    const r = vangThuong(P.admin, b.aid, false, tuanMoi);
    const s = dau(b.aid, 'listening');
    assert(s.no_show_period_id === null && s.raw_score === 15 && kyNang(b.aid, 'listening').planned_period_id === tuan(1).id, JSON.stringify(s));
    assert(r.giuLich === true && r.tuanMoi === d.tuanLich(tuanMoi, tuanMoi), JSON.stringify(r));
  });

  check('BV L3 · khung gỡ lớp thường: GV chấm Nghe / GVCN gỡ cả sau thứ Tư sau tuần gốc (OV-13h); QL mọi lúc', () => {
    for (const who of [gvNghe, P.normalCoreTeacher]) {
      const b = baiThuong(0);
      vangThuong(P.admin, b.aid, true);
      vangThuong(who, b.aid, false, t.addDays(han(0), 1));
      assert(dau(b.aid, 'listening').no_show_period_id === null && kyNang(b.aid, 'listening').planned_period_id === tuan(0).id, 'sau thứ Tư vẫn gỡ được');
    }
    const c = baiThuong(0);
    vangThuong(P.admin, c.aid, true);
    vangThuong(QL, c.aid, false, t.addDays(han(0), 21));
    assert(dau(c.aid, 'listening').no_show_period_id === null, 'QL');
  });

  check('BV L4 · nhật ký regular.no_show_cleared ghi giuLich', () => {
    const b = baiThuong(0);
    vangThuong(P.admin, b.aid, true);
    vangThuong(P.admin, b.aid, false);
    const l = get(`SELECT after_json FROM audit_logs WHERE action = 'regular.no_show_cleared' AND entity_id = ? ORDER BY id DESC`, b.aid);
    assert(JSON.parse(l.after_json).giuLich === false, l.after_json);
  });
}
