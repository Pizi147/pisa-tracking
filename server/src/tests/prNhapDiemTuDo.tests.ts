/**
 * NHAP-DIEM-a (chủ SP 14/11, đặc tả `docs/superpowers/specs/2026-11-14-nhap-diem-tu-do-design.md`, cách A): Huỷ điểm = MỘT kỹ năng của
 * một em → "Đã huỷ" (`sit_status = 'cancelled'`), hết nợ ở mọi nơi, Khôi phục trả đủ · gõ điểm đè "-" đã chốt = Bỏ vắng + lưu ·
 * gõ "-" đè điểm = cất + vắng (không hỏi) · xoá ô giữ ngày nhập đầu · nhập sớm tự dời về tuần này.
 * Mỗi ca dựng trạng thái bằng hàm máy chủ thật trong một giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { LUOT_LO_TRINH_CUOI_SQL } from '../students/tamDung.ts';

export async function runPrNhapDiemTuDoTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const lopViec: any = await import('../classes/dongHocVien.ts');
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const perm: any = await import('../permissions.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nNHAP-DIEM-a · Huỷ điểm một kỹ năng = "Đã huỷ" mọi nơi · Khôi phục · nhập / vắng tự do');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const HN = demoToday();
  const WS = d.mondayOfDate(HN), W1S = d.addDaysIso(WS, 7), W2S = d.addDaysIso(WS, 14);
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const lop = classId('MB FT 101');
  const QL = P.mbManager, gvL = P.lrTeacher, gvcn = P.coreTeacher;
  const khac = accounts.createAccount(P.admin, {
    email: `ndt.khac${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ndt', fullName: 'Thử NDT lớp khác',
    roles: [{ role: 'teacher', branches: ['CP'] }], skills: ['listening'],
  }).userId as number;

  const luotMock = () => one(
    `SELECT a.id, a.student_id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 1`, lop);
  /** Một lượt Mock sạch: mọi kỹ năng tuần này, chưa điểm / vắng; lượt khác của lớp rời các tuần dựng ca (không vướng thứ tự). */
  const dung = (): { aid: number; sid: number } => {
    const { id: aid, student_id: sid } = luotMock();
    ss.ensureSkillRows(aid);
    for (const b of ['assessment_scores', 'skill_move_requests', 'attempt_skill_skips', 'ket_qua_huy']) conn.prepare(`DELETE FROM ${b} WHERE attempt_id = ?`).run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL, bo_task = NULL WHERE attempt_id = ?`).run(pid(WS), aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(pid(WS), aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?, ?) AND attempt_id != ?`).run(pid(WS), pid(W1S), pid(W2S), aid);
    xoaNho();
    return { aid, sid };
  };
  const ky = (aid: number, s: string) => one('SELECT k.*, rp.week_start AS ws FROM attempt_skills k LEFT JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?', aid, s);
  const o = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);
  const banMo = (aid: number) => all(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_diem' AND khoi_phuc_luc IS NULL`, aid);

  /** Mọi nguồn đếm "còn phải nhập" (Review Focus 1) — số ô (lượt, kỹ năng) đang nợ ở từng nguồn. */
  const nguonNo = (aid: number, sid: number, skill: string) => {
    xoaNho();
    const r = {
      scoreDebt: debt.scoreDebtCells(QL, HN, null, [lop]).filter((c: any) => c.attemptId === aid && c.skill === skill).length,
      myPending: ((attempts.listAttempts(gvL, { studentId: sid, chiDangHoc: true, chiConO: true }).rows as any[])
        .find((x) => x.id === aid)?.myPendingDetail ?? []).filter((c: any) => c.skill === skill).length,
      viecHv: (lopViec.nhapDiemTheoEm(gvL, [lop], HN, () => lop).get(sid)?.kyNang ?? []).filter((k: string) => k === skill).length,
      lichTest: cham.lichTest(QL, pid(WS), null, HN, { classId: lop }).tongQuan.conPhaiCham as number,
    };
    xoaNho();
    return r;
  };

  check('NDT-0 · luật thuần: conPhaiNhap — đã huỷ / vắng / có điểm / chưa tới tuần không nợ; menu Huỷ điểm ⇄ Khôi phục cho người nhập được ô', () => {
    const c = (progress: string, o2: object = {}) => d.conPhaiNhap({ required: true, scored: false, progress, ...o2 });
    assert(c('due') && c('sat') && !c('cancelled') && !c('absent') && !c('upcoming') && !c('not_scheduled') && !c('lich_su') && !c('skipped'), 'theo tiến độ');
    assert(!c('due', { scored: true }) && !c('due', { noShow: true }) && !c('due', { required: false }), 'có điểm / "-" / ngoài phạm vi');
    const gv = { nhapDiem: true, quanLy: false, gvcn: false, laFt: true, dotHoanTat: false };
    for (const tt of ['chua-toi-tuan', 'dang-thi', 'co-diem', 'lich-su']) assert(d.thaoTacKyNang(tt, gv).menu.includes('huy-diem'), `GV môn Huỷ điểm ở ${tt}`);
    for (const tt of ['da-huy', 'huy-vang']) {
      const m = d.thaoTacKyNang(tt, gv).menu;
      assert(m.includes('khoi-phuc-diem') && !m.includes('huy-diem'), `GV môn Khôi phục ở ${tt}: ${m}`);
    }
    const thuong = { ...gv, laFt: false, khongTuHuy: true, vang: true, huyTay: true };
    for (const tt of ['dang-thi', 'da-huy', 'vang']) {
      const x = d.thaoTacKyNang(tt, thuong);
      assert(![x.chinh, ...x.menu].some((m) => m === 'huy-tay' || m === 'bo-huy-tay') && !x.menu.includes('nhap-diem'), `lớp thường ${tt} không còn Huỷ môn / ⋯ Nhập điểm rỗng: ${JSON.stringify(x)}`);
    }
    assert(d.thaoTacKyNang('dang-thi', { ...gv, gvcn: false }).menu.includes('bao-vang'), 'GV môn có Vắng ở Mock');
    assert(d.CHU_THAO_TAC['khoi-phuc-diem'] === 'Khôi phục', 'một tên: Khôi phục');
  });

  check('NDT-1 · huỷ Mock L có điểm → "Đã huỷ", điểm cất; không còn nợ ở scoreDebt / my-work / việc HV / Lịch Test (xoá ô thường thì còn)', () => thu(() => {
    const { aid, sid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 30 }, HN);
    attempts.saveScore(gvL, aid, 'listening', { rawScore: null }, HN);   // xoá ô thường → nợ quay lại (đúng)
    const noXoa = nguonNo(aid, sid, 'listening');
    assert(noXoa.scoreDebt === 1 && noXoa.myPending === 1 && noXoa.viecHv === 1, `xoá ô thường vẫn nợ: ${JSON.stringify(noXoa)}`);
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 30 }, HN);
    xoaNho(); const s0 = soCauSql();
    absence.huyDiemKn(gvL, aid, 'listening', true, 'nhập nhầm');
    const nHuy = soCauSql() - s0;
    assert(nHuy <= TRAN_GHI_LO.huyDiem, `trần câu Huỷ điểm: ${nHuy} > ${TRAN_GHI_LO.huyDiem}`);
    const k = ky(aid, 'listening');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1 && k.ws === WS, `kỹ năng Đã huỷ, giữ tuần: ${JSON.stringify(k)}`);
    assert(o(aid, 'listening').raw_score === null && o(aid, 'listening').band === null, 'ô trống');
    const ban = banMo(aid);
    assert(ban.length === 1 && JSON.parse(ban[0].diem_json)[0].raw_score === 30, `điểm cất: ${JSON.stringify(ban)}`);
    const noHuy = nguonNo(aid, sid, 'listening');
    assert(noHuy.scoreDebt === 0 && noHuy.myPending === 0 && noHuy.viecHv === 0, `huỷ xong hết nợ: ${JSON.stringify(noHuy)}`);
    assert(noHuy.lichTest === noXoa.lichTest - 1, `Lịch Test bớt một ô: ${noXoa.lichTest} → ${noHuy.lichTest}`);
    const cell = attempts.attemptDetail(gvL, aid).cells.find((c: any) => c.skill === 'listening');
    assert(cell.progress === 'cancelled' && !cell.overdue && !cell.viec && cell.canEdit, `ô hồ sơ: ${JSON.stringify({ p: cell.progress, o: cell.overdue, v: cell.viec, e: cell.canEdit })}`);
    const h = one(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND field = 'listening' ORDER BY id DESC LIMIT 1`, aid);
    assert(h.action === 'skill_huy_tay' && h.actor_user_id === gvL.userId && h.reason === 'nhập nhầm', `lịch sử ai · lý do: ${JSON.stringify(h)}`);
    absence.huyDiemKn(gvL, aid, 'listening', true);   // bấm lại: vô hại
  }));

  check('NDT-2 · Khôi phục → điểm, người nhập, ngày nhập đầu như cũ; kỹ năng về tuần cũ; đã có điểm mới → hỏi', () => thu(() => {
    const { aid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 30 }, d.addDaysIso(WS, 0));
    const truoc = o(aid, 'listening');
    absence.huyDiemKn(gvL, aid, 'listening', true);
    xoaNho(); const s0 = soCauSql();
    absence.huyDiemKn(gvL, aid, 'listening', false);
    const nKp = soCauSql() - s0;
    assert(nKp <= TRAN_GHI_LO.huyDiem, `trần câu Khôi phục: ${nKp} > ${TRAN_GHI_LO.huyDiem}`);
    const sau = o(aid, 'listening'); const k = ky(aid, 'listening');
    assert(sau.raw_score === 30 && sau.band === truoc.band && sau.entered_by === truoc.entered_by && sau.entered_at === truoc.entered_at && sau.nhap_dau_ngay === truoc.nhap_dau_ngay,
      `điểm trả đủ: ${JSON.stringify([truoc, sau])}`);
    assert(k.sit_status !== 'cancelled' && !k.huy_vang && k.ws === WS, `kỹ năng về như cũ: ${JSON.stringify(k)}`);
    assert(banMo(aid).length === 0, 'bản cất đóng');
    assert(loi(() => absence.huyDiemKn(gvL, aid, 'listening', false))?.status === 400, 'không có gì để khôi phục → 400');
    /* Bản cất cũ (xoá ô thường) + ô đã có điểm mới → hỏi (409); đồng ý → điểm mới cất, điểm cũ về. Lối cũ /khoi-phuc-diem = cùng hàm. */
    attempts.saveScore(gvL, aid, 'listening', { rawScore: null }, HN);
    conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_luc = NULL WHERE id = (SELECT MAX(id) FROM ket_qua_huy WHERE attempt_id = ?)').run(aid);
    conn.prepare('UPDATE assessment_scores SET raw_score = 20, band = 5 WHERE attempt_id = ? AND skill = ?').run(aid, 'listening');
    xoaNho();
    assert(loi(() => absence.huyDiemKn(gvL, aid, 'listening', false))?.status === 409, 'ô có điểm mới → hỏi');
  }));

  check('NDT-3 · quyền: GV môn, GVCN, QL huỷ được; GV chi nhánh khác 403; huỷ / khôi phục Writing = cả kỹ năng (W1 + W2)', () => thu(() => {
    const { aid } = dung();
    const k403 = loi(() => absence.huyDiemKn(perm.loadPrincipal(khac), aid, 'listening', true));
    assert(k403?.status === 403, `GV ngoài lớp: ${k403?.status} ${k403?.message}`);
    attempts.saveScore(P.w1Teacher, aid, 'writing1', { criteria: [6, 6, 6, 6] }, HN);
    attempts.saveScore(P.w2Teacher, aid, 'writing2', { criteria: [5, 5, 5, 5] }, HN);
    absence.huyDiemKn(gvcn, aid, 'writing', true);
    assert(ky(aid, 'writing').sit_status === 'cancelled' && o(aid, 'writing1').band === null && o(aid, 'writing2').band === null && banMo(aid).length === 2, 'W1 + W2 cùng huỷ');
    absence.huyDiemKn(P.w2Teacher, aid, 'writing2', false);   // ô nào của kỹ năng cũng chỉ về một kỹ năng
    assert(o(aid, 'writing1').band !== null && o(aid, 'writing2').band !== null && ky(aid, 'writing').sit_status !== 'cancelled', 'Khôi phục cả Writing');
    absence.huyDiemKn(QL, aid, 'reading', true);
    assert(ky(aid, 'reading').sit_status === 'cancelled', 'QL huỷ ô chưa điểm (coi như không làm)');
  }));

  check('NDT-4 · GV nhập ĐIỂM trước tuần Test → kỹ năng tự dời về tuần này (không hỏi), lịch sử ghi', () => thu(() => {
    const { aid } = dung();
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill IN ('listening', 'reading')`).run(pid(W1S), aid);
    xoaNho();
    const cell = attempts.attemptDetail(gvL, aid).cells.find((c: any) => c.skill === 'listening');
    assert(cell.canEdit, 'ô chưa tới tuần vẫn mở cho GV môn');
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 28 }, HN);
    assert(ky(aid, 'listening').ws === WS && o(aid, 'listening').raw_score === 28, `dời về tuần này + lưu: ${JSON.stringify(ky(aid, 'listening'))}`);
    const h = one(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND field = 'listening' AND action = 'skill_week_set' ORDER BY id DESC LIMIT 1`, aid);
    assert(h && h.actor_user_id === gvL.userId && /sớm/.test(h.reason ?? ''), `lịch sử: ${JSON.stringify(h)}`);
  }));

  check('NDT-5 · gõ điểm đè "-" đã chốt → một lần lưu: về tuần gốc, trừ một lần vắng, có điểm; "-" sau đó tính lần 1', () => thu(() => {
    const { aid } = dung();
    const v = attempts.saveScore(gvL, aid, 'listening', { noShow: true }, HN);
    assert(v.vang?.kq === 'doi' && ky(aid, 'listening').ws === W1S && ky(aid, 'listening').absence_move_count === 1, 'lần 1 dời');
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 31 }, HN);
    const k = ky(aid, 'listening'); const s = o(aid, 'listening');
    assert(k.ws === WS && k.absence_move_count === 0 && s.raw_score === 31 && s.no_show_period_id === null, `bỏ vắng + lưu: ${JSON.stringify([k, s])}`);
    attempts.saveScore(gvL, aid, 'listening', { noShow: true }, HN);
    assert(ky(aid, 'listening').absence_move_count === 1 && ky(aid, 'listening').ws === W1S, `"-" sau = lần 1: ${JSON.stringify(ky(aid, 'listening'))}`);
  }));

  check('NDT-6 · gõ "-" đè điểm → điểm cất (Khôi phục được), ghi vắng, không 409', () => thu(() => {
    const { aid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 30 }, HN);
    const r = loi(() => attempts.saveScore(gvL, aid, 'listening', { noShow: true }, HN));
    assert(r === null, `không hỏi: ${r?.status} ${r?.message}`);
    assert(banMo(aid).length === 1 && o(aid, 'listening').raw_score === null && o(aid, 'listening').no_show_period_id !== null, 'cất + vắng');
    attempts.saveScore(P.w1Teacher, aid, 'writing1', { criteria: [6, 6, 6, 6] }, HN);
    const w = loi(() => attempts.saveScore(P.w1Teacher, aid, 'writing1', { noShow: true }, HN));
    assert(w === null, `W "-" đè điểm không hỏi: ${w?.message}`);
  }));

  check('NDT-7 · xoá ô + Lưu = xoá điểm thường, ngày nhập đầu giữ (nhập lại không tính muộn)', () => thu(() => {
    const { aid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 30 }, WS);
    attempts.saveScore(gvL, aid, 'listening', { rawScore: null }, d.addDaysIso(WS, 1));
    assert(o(aid, 'listening').nhap_dau_ngay === WS && ky(aid, 'listening').sit_status !== 'cancelled', `xoá giữ ngày: ${o(aid, 'listening').nhap_dau_ngay}`);
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 29 }, d.addDaysIso(WS, 2));
    assert(o(aid, 'listening').nhap_dau_ngay === WS, 'nhập lại giữ ngày đầu');
  }));

  check('NDT-8 · evaluateAttempt: kỹ năng "Đã huỷ" ra khỏi bộ — 3 kỹ năng còn lại quyết SOS, không Overall, bài chốt', () => thu(() => {
    const e = { listening: null, reading: 8, writing1: 8, writing2: 8, speaking: 3 };
    const r = scoring.evaluateAttempt(6, 1, e, [], null, ['listening']);
    assert(r.overall === null && r.chot && r.failedCount === 1 && r.sosLevel === 1, `hàm thuần: ${JSON.stringify({ o: r.overall, c: r.chot, f: r.failedCount, s: r.sosLevel })}`);
    const { aid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { rawScore: 35 }, HN);
    absence.huyDiemKn(gvL, aid, 'listening', true);
    xoaNho();
    const kq = attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', aid));
    assert(kq.bands.listening === null && kq.overall === null && kq.verdicts.find((v: any) => v.skill === 'listening').passed === null, `lượt thật: ${JSON.stringify(kq.bands)}`);
  }));

  check('NDT-9 · huỷ do vắng lần 2 → Khôi phục về tuần lần 2, số lần vắng giữ, dấu "-" của tuần đó gỡ; "-" sau lại huỷ (N38)', () => thu(() => {
    const { aid } = dung();
    attempts.saveScore(gvL, aid, 'listening', { noShow: true }, HN);
    const r2 = attempts.saveScore(gvL, aid, 'listening', { noShow: true }, d.addDaysIso(HN, 7));
    assert(r2.vang?.kq === 'huy' && ky(aid, 'listening').sit_status === 'cancelled', 'lần 2 huỷ');
    absence.huyDiemKn(gvL, aid, 'listening', false, null, d.addDaysIso(HN, 7));
    const k = ky(aid, 'listening');
    assert(k.sit_status === 'scheduled' && !k.huy_vang && k.ws === W1S && k.absence_move_count === 1 && o(aid, 'listening').no_show_period_id === null,
      `khôi phục: ${JSON.stringify([k, o(aid, 'listening')])}`);
    const r3 = attempts.saveScore(gvL, aid, 'listening', { noShow: true }, d.addDaysIso(HN, 7));
    assert(r3.vang?.kq === 'huy', `vắng tiếp lại huỷ: ${JSON.stringify(r3.vang)}`);
  }));

  /* Lớp thường + MT0 lớp thường — cùng một đường Huỷ điểm / Khôi phục. */
  const LOP = classId('MB FOU 12');
  const emThuong = () => {
    const now = new Date().toISOString();
    const tag = `NDT-${Math.random().toString(36).slice(2, 7)}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, one('SELECT branch_id b FROM classes WHERE id = ?', LOP).b, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, '2026-01-01', now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-01-01', 'active', ?)`)
      .run(sid, now).lastInsertRowid);
    const luot = (kind: string, no: number) => {
      const id = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,?,?,?, 'planned', ?)`)
        .run(cy, sid, no, kind, LOP, pid(WS), now).lastInsertRowid);
      ss.ensureSkillRows(id);
      conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(pid(WS), id);
      return id;
    };
    const mt0 = luot('mt0', 0), fin = luot('final', 2);
    xoaNho();
    return { sid, mt0, fin };
  };

  check('NDT-10 · lớp thường Final: Huỷ điểm môn có điểm → Đã huỷ, cất, % tính trên môn còn lại; Khôi phục trả điểm; nhập điểm vào môn đã huỷ → tự bỏ huỷ', () => thu(() => {
    const e = emThuong();
    const mon: string[] = regular.regularResultOf(e.fin).skills.map((x: any) => x.skill);
    for (const k of mon) regular.saveRegularScore(QL, e.fin, k, { score: 15, total: 20 }, HN);
    absence.huyDiemKn(QL, e.fin, 'listening', true);
    xoaNho();
    const kq = regular.regularResultOf(e.fin);
    assert(ky(e.fin, 'listening').sit_status === 'cancelled' && o(e.fin, 'listening').raw_score === null && kq.daHuy.includes('listening') && kq.complete,
      `huỷ: ${JSON.stringify(kq)}`);
    const dong = regular.regularSheet(QL, LOP).rows.find((r: any) => r.attemptId === e.fin).skillSchedule.find((x: any) => x.skill === 'listening');
    assert(dong.progress === 'cancelled' && !dong.overdue && dong.canEdit, `lưới: ${JSON.stringify(dong)}`);
    absence.huyDiemKn(QL, e.fin, 'listening', false);
    assert(o(e.fin, 'listening').raw_score === 15 && ky(e.fin, 'listening').sit_status !== 'cancelled', 'Khôi phục lớp thường');
    absence.huyDiemKn(QL, e.fin, 'reading', true);
    regular.saveRegularScore(QL, e.fin, 'reading', { score: 12, total: 20 }, HN);
    assert(ky(e.fin, 'reading').sit_status === 'scheduled' && !ky(e.fin, 'reading').huy_vang, `nhập vào môn đã huỷ → bỏ huỷ: ${JSON.stringify(ky(e.fin, 'reading'))}`);
  }));

  check('NDT-11 · lớp thường: "-" đè điểm không hỏi (cất + vắng); điểm đè "-" = bỏ vắng (về tuần gốc) + lưu; xoá điểm giữ ngày nhập đầu; nhập sớm tự dời', () => thu(() => {
    const e = emThuong();
    regular.saveRegularScore(QL, e.fin, 'listening', { score: 15, total: 20 }, WS);
    const r = loi(() => regular.saveRegularScore(QL, e.fin, 'listening', { noShow: true }, HN));
    assert(r === null && o(e.fin, 'listening').raw_score === null && o(e.fin, 'listening').no_show_period_id !== null && ky(e.fin, 'listening').ws === W1S,
      `"-" đè điểm: ${r?.message} ${JSON.stringify(ky(e.fin, 'listening'))}`);
    regular.saveRegularScore(QL, e.fin, 'listening', { score: 16, total: 20 }, HN);
    assert(ky(e.fin, 'listening').ws === WS && o(e.fin, 'listening').no_show_period_id === null && o(e.fin, 'listening').raw_score === 16,
      `điểm đè "-": ${JSON.stringify([ky(e.fin, 'listening'), o(e.fin, 'listening')])}`);
    regular.saveRegularScore(QL, e.fin, 'reading', { score: 10, total: 20 }, WS);
    regular.saveRegularScore(QL, e.fin, 'reading', { score: null }, HN);
    assert(o(e.fin, 'reading').nhap_dau_ngay === WS, 'xoá giữ ngày nhập đầu');
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'writing'`).run(pid(W1S), e.fin);
    xoaNho();
    regular.saveRegularScore(P.normalSubjectTeacher, e.fin, 'writing', { score: 10, total: 20 }, HN);
    assert(ky(e.fin, 'writing').ws === WS, 'nhập sớm tự dời về tuần này');
  }));

  check('NDT-12 · MT0 lớp thường: Huỷ điểm / Khôi phục cùng đường; lối cũ /huy-tay và /khoi-phuc-diem đi cùng hàm', () => thu(() => {
    const e = emThuong();
    attempts.saveScore(QL, e.mt0, 'listening', { band: 5 }, HN);
    absence.huyTay(QL, e.mt0, 'listening', true);
    assert(ky(e.mt0, 'listening').sit_status === 'cancelled' && banMo(e.mt0).length === 1, 'MT0 huỷ qua lối cũ');
    absence.huyDiemKn(QL, e.mt0, 'listening', false);
    assert(o(e.mt0, 'listening').band === 5, 'MT0 khôi phục');
  }));

  /* PTA 14/11: báo trước em vắng (gõ "-" / nút Vắng khi chưa tới tuần Test) KHÔNG kéo bài về tuần này — ghi cho đúng tuần Test đó theo N38. */
  check('NDT-13 · "-" / Vắng TRƯỚC tuần Test → ghi cho đúng tuần Test: Mock lần 1 dời tuần sau tuần Test (không về tuần này); gõ lại vô hại; lớp thường dời tuần sau tuần Test', () => thu(() => {
    const { aid } = dung();
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill IN ('reading', 'speaking')`).run(pid(W1S), aid);
    xoaNho();
    const r = attempts.saveScore(gvL, aid, 'reading', { noShow: true }, HN);
    const k = ky(aid, 'reading');
    assert(r.vang?.kq === 'doi' && k.ws === W2S && k.absence_move_count === 1 && o(aid, 'reading').no_show_period_id === pid(W1S),
      `"-" trước tuần Test: vắng ở tuần Test, dời tuần sau nó: ${JSON.stringify([r.vang, k])}`);
    assert(!all(`SELECT 1 FROM attempt_schedule_history WHERE attempt_id = ? AND field = 'reading' AND action = 'skill_week_set'`, aid).length, 'không có lần dời về tuần này');
    attempts.saveScore(gvL, aid, 'reading', { noShow: true }, HN);
    assert(ky(aid, 'reading').absence_move_count === 1 && ky(aid, 'reading').ws === W2S, 'gõ lại vô hại');
    const b = absence.baoVang(gvcn, aid, 'speaking', 'Em báo nghỉ trước', HN);
    assert(b.daDoi && ky(aid, 'speaking').ws === W2S && ky(aid, 'speaking').absence_move_count === 1, `nút Vắng trước tuần Test: ${JSON.stringify([b, ky(aid, 'speaking')])}`);
    const e = emThuong();
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'listening'`).run(pid(W1S), e.fin);
    xoaNho();
    const rt = regular.saveRegularScore(QL, e.fin, 'listening', { noShow: true }, HN);
    assert(rt.moved && ky(e.fin, 'listening').ws === W2S && o(e.fin, 'listening').no_show_period_id === pid(W1S), `lớp thường: ${JSON.stringify([rt, ky(e.fin, 'listening')])}`);
  }));
}
