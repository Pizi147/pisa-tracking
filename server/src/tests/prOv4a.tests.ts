/**
 * PHÉP KIỂM PR-OV4a — Huỷ cả lượt MT giữ điểm ẩn + Khôi phục lượt (đặc tả OV 3.4, 6.5; kế hoạch 2026-10-12-pr-ov4a). Mỗi phép kiểm dựng ca của nó
 * trong một giao dịch rồi cuộn lại (`thu`). Ca thật: Nguyễn Minh Ngọc · CP FT 131 · MT4 (nhóm 3 `kiem-du-lieu-mt`) dựng lại ở OV4a-5.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { chotSan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv4aTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const { voiBanSaoDb } = await import('./banSaoDb.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { kiemDuLieuMt } = await import('../ops/kiemDuLieuMt.ts');
  const { migratePrOv4 } = await import('../migrate/prOv4.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV4a · Huỷ cả lượt giữ điểm ẩn, Khôi phục lượt');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n)).id as number;
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const bonTuan = (n: number) => Object.fromEntries(KN.map((k) => [k, tuan(n)]));
  const admin = loadPrincipal(accounts.createAccount(P.admin, {
    email: `ov4a.admin${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov4a', fullName: 'Thử OV4a Admin', roles: [{ role: 'office_admin', branches: ['MB'] }],
  }).userId);

  let dem = 0;
  const datTuan = (aid: number, w: number) => {
    skillSch.ensureSkillRows(aid);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w), aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w), aid);
  };
  /**
   * Em mới ở MB FT 101: MT1 tuần trước (L 4 · R 4 → 2 Case SOS sinh riêng + PA + 2 Phối hợp chờ), MT2 T+4, MT3 T+8. Thêm Case Writing Task 2 gắn MT1
   * (mốc) với PA Tự học kết quả gần nhất "Chưa đủ dữ liệu" và PA Tutor kết quả "Tiến bộ" — Case này không sinh riêng (đã có kết quả PA).
   */
  const dung = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `OV4a Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    const sid = r.studentIds[0] as number;
    const ds = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((x) => x.id as number);
    [-1, 4, 8].forEach((w, i) => datTuan(ds[i], w));
    chotSan(conn, ds[0]);   // OV-1c: MT1 chỉ có L/R — chốt sẵn để điểm dưới kỳ vọng sinh Case như ca gốc
    attempts.saveScore(P.lrTeacher, ds[0], 'listening', { band: 4 });
    attempts.saveScore(P.lrTeacher, ds[0], 'reading', { band: 4 });
    const cy = one('SELECT cycle_id FROM assessment_attempts WHERE id = ?', ds[0]).cycle_id;
    const luc = `${TODAY}T08:00:00.000Z`;
    const cs = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, status, created_at) VALUES (?, ?, 'writing2', 'writing2', 'in_progress', ?)`)
      .run(sid, cy, luc).lastInsertRowid);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, occurred_on, attempt_id, created_at) VALUES (?, 'opened', ?, ?, ?)`).run(cs, TODAY, ds[0], luc);
    const pa = (kind: string, kq: string) => {
      const id = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, created_at) VALUES (?, ?, 'started', ?)`).run(cs, kind, luc).lastInsertRowid);
      conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, created_at) VALUES (?, ?, ?, ?, ?)`).run(cs, id, TODAY, kq, luc);
      return id;
    };
    return { sid, m1: ds[0], m2: ds[1], m3: ds[2], caseW2: cs, paThieu: pa('self_study', 'insufficient'), paTot: pa('tutor', 'improved') };
  };
  const bo = (r: any, ...k: string[]) => { const x = { ...r }; for (const c of ['id', 'updated_at', 'o_cho_tu', ...k]) delete x[c]; return x; };   // o_cho_tu = cờ suy ra (TD7b), không phải dữ liệu gốc
  /** Mọi thứ huỷ / khôi phục chạm của một em — so trước huỷ với sau khôi phục. */
  const chup = (sid: number, aid: number) => ({
    luot: bo(one('SELECT * FROM assessment_attempts WHERE id = ?', aid)),
    lich: all('SELECT * FROM attempt_skills WHERE attempt_id = ? ORDER BY skill', aid).map((r) => bo(r)),
    diem: all('SELECT * FROM assessment_scores WHERE attempt_id = ? ORDER BY skill', aid).map((r) => bo(r)),
    caseMo: all(`SELECT id, status, system_close_reason, disposition, disposition_note, outcome_note, dedup_key, closed_at FROM sos_cases WHERE student_id = ? ORDER BY id`, sid),
    pa: all(`SELECT iv.id, iv.status, iv.closed_reason FROM case_interventions iv JOIN sos_cases c ON c.id = iv.case_id WHERE c.student_id = ? ORDER BY iv.id`, sid),
    phoiHop: all('SELECT id, status, remove_reason_code FROM sos_coordination_actions WHERE student_id = ? ORDER BY id', sid),
    tinHieu: all('SELECT id, status, withdrawn_reason FROM case_signals WHERE student_id = ? ORDER BY id', sid),
    moc: all(`SELECT m.case_id, m.kind FROM case_milestones m JOIN sos_cases c ON c.id = m.case_id WHERE c.student_id = ? ORDER BY m.id`, sid),
  });
  /** Chỗ lệch đầu tiên (đường dẫn + hai bên) — báo lỗi đọc được. */
  const lech = (x: any, y: any, duong = ''): string | null => {
    if (JSON.stringify(x) === JSON.stringify(y)) return null;
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const l = lech(x[k], y[k], `${duong}.${k}`); if (l) return l; }
    }
    return `${duong} trước=${JSON.stringify(x)?.slice(0, 300)} sau=${JSON.stringify(y)?.slice(0, 300)}`;
  };
  /** Điểm thẳng vào ô (lượt tương lai — nhập qua `saveScore` bị chặn "chưa tới tuần thi"). */
  const diemSql = (aid: number, skill: string, band: number) => conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?, ?, ?)').run(aid, skill, band);
  const diemCo = (aid: number) => all('SELECT skill, band FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL) ORDER BY skill', aid);

  check('OV4a-1 · Huỷ MT1: điểm ẩn (Điểm theo lớp, Overall), Case sinh riêng + PA "Chưa đủ dữ liệu" + Phối hợp đóng, PA có kết quả khác giữ, bản cất đủ', () => thu(() => {
    const e = dung();
    const hq = attempts.heQuaHuyLuot(e.m1);
    assert(hq.lich.soKyNang === 4 && hq.lich.tuan.length === 1 && hq.diem.map((x: any) => x.skill).join() === 'listening,reading', `hệ quả lịch/điểm: ${JSON.stringify(hq)}`);
    assert(hq.caseDong.length === 2 && hq.paDong.map((x: any) => x.id).join() === String(e.paThieu) && hq.paGiu.map((x: any) => x.id).join() === String(e.paTot)
      && hq.phoiHop === 1 && /tự học Writing Task 2/i.test(hq.paDong[0].ten), `hệ quả Case/PA: ${JSON.stringify(hq)}`);
    const caseSinh = hq.caseIds as number[];
    attempts.huyLuot(QL, e.m1, { lyDo: 'Em ốm cả tuần' });
    assert(one('SELECT status FROM assessment_attempts WHERE id = ?', e.m1).status === 'cancelled', 'lượt chưa huỷ');
    assert(all('SELECT 1 FROM assessment_scores WHERE attempt_id = ?', e.m1).length === 0, 'điểm còn trong assessment_scores');
    const sheet = attempts.classScoreSheet(P.admin, LOP, tuan(-1), TODAY) as any;
    assert(!sheet.rows.some((r: any) => r.attemptId === e.m1 && r.cells.some((c: any) => c.band != null)), 'Điểm theo lớp còn thấy điểm lượt huỷ');
    assert(caseSinh.every((id) => one('SELECT status, system_close_reason FROM sos_cases WHERE id = ?', id).system_close_reason === 'luot_da_huy'), 'Case sinh riêng chưa đóng');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', e.paThieu).status === 'cancelled', 'PA Chưa đủ dữ liệu chưa đóng');
    assert(one('SELECT status FROM case_interventions WHERE id = ?', e.paTot).status === 'started', 'PA có kết quả khác bị đóng');
    assert(one('SELECT status FROM sos_cases WHERE id = ?', e.caseW2).status === 'in_progress', 'Case có kết quả PA bị đóng');
    assert(all(`SELECT 1 FROM sos_coordination_actions WHERE attempt_id = ? AND status = 'pending'`, e.m1).length === 0, 'Phối hợp còn chờ');
    assert(all(`SELECT 1 FROM case_signals WHERE attempt_id = ? AND status = 'pending'`, e.m1).length === 0, 'tín hiệu còn chờ');
    const k = one(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_luot'`, e.m1);
    const dong = JSON.parse(k.dong_json);
    assert(JSON.parse(k.diem_json).filter((x: any) => x.band != null).length === 2 && k.so_diem === 2 && JSON.parse(k.lich_json).length === 4, `bản cất điểm/lịch: ${k.so_diem}`);
    assert(dong.case.length === 2 && dong.pa.length === 1 && dong.phoiHop.length === 1 && dong.luot.status !== 'cancelled', `danh sách đóng: ${k.dong_json.slice(0, 300)}`);
    assert(!kiemDuLieuMt(conn).some((x) => x.nhom === 3 && x.luotId === e.m1), 'kiem-du-lieu-mt nhóm 3 báo bản cất huỷ lượt cố ý');
    /* Số MT dùng lại được: điểm đã cất nên MT1 không giữ số. */
    assert(attempts.attemptDetail(QL, e.m1).khoiPhuc.ban.length === 1, 'hồ sơ MT thiếu bản khôi phục');
  }));

  check('OV4a-2 · Khôi phục MT1: lượt, lịch, điểm, Case, PA, Phối hợp, tín hiệu đúng như trước huỷ; lần hai báo "đã khôi phục"', () => thu(() => {
    const e = dung();
    const truoc = chup(e.sid, e.m1);
    attempts.huyLuot(QL, e.m1, { lyDo: '' });
    const r = attempts.reopenAttempt(QL, e.m1);
    assert(r.soDiem === 2 && r.soCase === 2 && r.soPhoiHop === 1 && !r.chuaXep && r.cau.length === 0, JSON.stringify(r));
    const l = lech(truoc, chup(e.sid, e.m1));
    assert(!l, `khác trước huỷ — ${l}`);
    assert(one(`SELECT khoi_phuc_luc FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_luot'`, e.m1).khoi_phuc_luc, 'bản cất chưa đánh dấu');
    const e2 = loi(() => attempts.reopenAttempt(QL, e.m1));
    assert(e2?.status === 400 && /MT1 đã khôi phục/.test(e2.message), `lần hai: ${e2?.message}`);
    assert(diemCo(e.m1).length === 2, 'nhân đôi / mất điểm');
    const nk = one(`SELECT after_json FROM audit_logs WHERE action = 'case.system_reopen' ORDER BY id DESC LIMIT 1`);
    assert(/Khôi phục MT1/.test(nk.after_json), `nhật ký mở lại Case: ${nk.after_json}`);
  }));

  check('OV4a-3 · Đã xếp MT2 mới → chặn đúng câu; huỷ MT2 mới → Khôi phục chọn được bản cũ, điểm cũ về, bản mới vẫn treo', () => thu(() => {
    const e = dung();
    diemSql(e.m2, 'listening', 7);
    attempts.huyLuot(QL, e.m2, { lyDo: 'Đợt cũ' });
    const moi = keHoach.xepMoi(QL, { studentId: e.sid, attemptNo: 2, tuan: bonTuan(5) });
    assert(moi.id === e.m2, 'xếp lại phải dùng lại dòng MT2');
    assert(one(`SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL`, e.m2).n === 1, 'xếp lại đã xoá bản cất');
    const chan = loi(() => attempts.reopenAttempt(QL, e.m2));
    const cau = `Chưa khôi phục được: đã xếp MT2 mới tuần ${d.tuanLich(t.addDays(tuanNay, 35), TODAY)}. Huỷ MT2 mới trước, rồi khôi phục MT2 cũ.`;
    assert(chan?.status === 400 && chan.message === cau, `câu chặn: ${chan?.message}`);
    assert(attempts.attemptDetail(QL, e.m2).khoiPhuc.chan === cau, 'hồ sơ MT thiếu câu chặn');
    diemSql(e.m2, 'reading', 5);
    attempts.huyLuot(QL, e.m2, { lyDo: 'Đợt mới' });
    const ban = attempts.attemptDetail(QL, e.m2).khoiPhuc.ban as any[];
    assert(ban.length === 2 && ban[0].lyDo === 'Đợt mới' && ban[1].lyDo === 'Đợt cũ', JSON.stringify(ban));
    attempts.reopenAttempt(QL, e.m2, { banId: ban[1].id });
    assert(JSON.stringify(diemCo(e.m2)) === JSON.stringify([{ skill: 'listening', band: 7 }]), `điểm bản cũ: ${JSON.stringify(diemCo(e.m2))}`);
    assert(one(`SELECT tuan FROM (SELECT p.week_start tuan FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening')`, e.m2).tuan === t.addDays(tuanNay, 28),
      'lịch bản cũ chưa về');
    assert(one(`SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL`, e.m2).n === 1, 'bản mới phải còn treo');
  }));

  check('OV4a-4 → LUAT-NX-MT · Tuần cũ sau MT1 đã dời → Khôi phục đưa điểm về, GIỮ tuần cũ (giữa các MT không chặn thứ tự)', () => thu(() => {
    const e = dung();
    diemSql(e.m2, 'listening', 7);
    attempts.huyLuot(QL, e.m2, { lyDo: 'x' });
    keHoach.luuDot(QL, { attemptId: e.m1, kyNang: KN.map((skill) => ({ skill, periodId: tuan(5) })) });   // MT1 dời qua tuần cũ của MT2
    const r = attempts.reopenAttempt(QL, e.m2);
    assert(!r.chuaXep, JSON.stringify(r));
    assert(diemCo(e.m2).length === 1, 'mất điểm');
    assert(all('SELECT 1 FROM attempt_skills WHERE attempt_id = ? AND required = 1 AND planned_period_id IS NOT NULL', e.m2).length > 0, 'mất tuần cũ');
  }));

  check('OV4a-5 · Ca MT4 Nguyễn Minh Ngọc (lượt huỷ + bản cất dời vượt treo): Khôi phục đưa điểm về, nhóm 3 hết báo; xếp lại không xoá bản cất', () => thu(() => {
    const e = dung();
    const lich = JSON.stringify(KN.map((skill) => ({ skill, planned_period_id: tuan(4), sit_status: 'sat', plan_source: 'manual' })));
    const cat = (aid: number) => conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc)
      VALUES (?, ?, ?, ?, 1, 'Dời vượt', NULL, '2026-09-01T08:00:00.000Z')`)
      .run(aid, e.m1, JSON.stringify([{ attempt_id: aid, skill: 'speaking', band: 6.5, raw_score: null }]), lich);
    cat(e.m2);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = 'cũ', cancelled_at = '2026-09-02T08:00:00.000Z' WHERE id = ?`).run(e.m2);   // huỷ trước PR
    assert(kiemDuLieuMt(conn).some((x) => x.nhom === 3 && x.luotId === e.m2), 'tiền đề: nhóm 3 phải báo');
    const r = attempts.reopenAttempt(QL, e.m2);
    assert(r.soDiem === 1 && JSON.stringify(diemCo(e.m2)) === JSON.stringify([{ skill: 'speaking', band: 6.5 }]), `${JSON.stringify(r)} ${JSON.stringify(diemCo(e.m2))}`);
    assert(!kiemDuLieuMt(conn).some((x) => x.nhom === 3 && x.luotId === e.m2), 'nhóm 3 còn báo sau Khôi phục');
    /* Xếp lại một lượt đã huỷ còn bản cất dời vượt: bản cất giữ (không còn `ket_qua_huy.bo`). */
    cat(e.m3);
    attempts.huyLuot(QL, e.m3, { lyDo: 'y' });
    keHoach.xepMoi(QL, { studentId: e.sid, attemptNo: 3, tuan: bonTuan(9) });
    assert(one(`SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL`, e.m3).n === 2, 'xếp lại xoá bản cất');
  }));

  check('OV4a-6 · Lượt huỷ trước PR (không bản cất) → Khôi phục ra lượt trống, câu nói rõ; lớp thường huỷ vẫn xoá điểm (không cất)', () => thu(() => {
    const e = dung();
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancelled_at = ? WHERE id = ?`).run(`${TODAY}T08:00:00.000Z`, e.m3);
    const r = attempts.reopenAttempt(QL, e.m3);
    assert(r.soDiem === 0 && /trước 10\/2026: không còn điểm/.test(r.cau.join(' ')) && one('SELECT status FROM assessment_attempts WHERE id = ?', e.m3).status === 'planned', JSON.stringify(r));
    const bai = one(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN programmes pg ON pg.code = c.programme_code
      WHERE pg.scoring_mode = 'ratio' AND a.kind IN ('progress', 'final') AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.raw_score IS NOT NULL) LIMIT 1`);
    assert(attempts.heQuaHuyLuot(bai.id).xoaDiem, 'bài lớp thường phải báo xoá điểm');
    attempts.huyLuot(P.admin, bai.id, { lyDo: 'z' });
    assert(!all('SELECT 1 FROM ket_qua_huy WHERE attempt_id = ?', bai.id).length && !diemCo(bai.id).length, 'lớp thường phải xoá như cũ, không cất');
  }));

  check('OV4a-7 · Admin 403 huỷ + 403 khôi phục; GV 403; không ghi gì', () => thu(() => {
    const e = dung();
    for (const [ai, p] of [['Admin', admin], ['GVCN', P.coreTeacher]] as const) {
      assert(loi(() => attempts.huyLuot(p, e.m1, { lyDo: 'x' }))?.status === 403, `${ai} huỷ`);
      assert(one('SELECT status FROM assessment_attempts WHERE id = ?', e.m1).status !== 'cancelled' && diemCo(e.m1).length === 2, `${ai}: đã ghi`);
    }
    attempts.huyLuot(QL, e.m1, { lyDo: 'x' });
    for (const [ai, p] of [['Admin', admin], ['GVCN', P.coreTeacher]] as const) assert(loi(() => attempts.reopenAttempt(p, e.m1))?.status === 403, `${ai} khôi phục`);
    assert(attempts.attemptDetail(admin, e.m1).viewer.canCancel === false, 'Admin không được có nút Huỷ / Khôi phục');
  }));

  check('OV4a-8 · Kế hoạch Test + Lộ trình: số MT chỉ có lượt đã huỷ hiện ô "Đã huỷ" (không coi là lượt có sẵn)', () => thu(() => {
    const e = dung();
    attempts.huyLuot(QL, e.m2, { lyDo: 'x' });
    const hang = keHoach.luoiFT(QL, LOP).hang.find((h: any) => h.studentId === e.sid);
    assert(hang.dot[2].attemptId === null && hang.dot[2].huy === e.m2, JSON.stringify(hang.dot[2]));
    const cy = one('SELECT cycle_id FROM assessment_attempts WHERE id = ?', e.m2).cycle_id;
    const h2 = keHoach.lichMtLoTrinh(cy).hang.find((h: any) => h.attemptNo === 2);
    assert(h2.luot === null && h2.huy?.attemptId === e.m2 && h2.existingAttemptId === null, JSON.stringify(h2));
  }));

  check('OV4a-9 · migrate PR-OV4a: thêm loai + dong_json, dòng cũ = doi_vuot; chạy lại không đổi gì', () => voiBanSaoDb('ov4a-9', (ban) => {
    /* Bảng như trước PR (PR-MTa) — KIEM-BAN-SAO: đổi tên bảng trên BẢN SAO riêng, không DDL trên DB dùng chung. */
    ban.exec('ALTER TABLE ket_qua_huy RENAME TO ket_qua_huy_ov4a');
    ban.exec(`CREATE TABLE ket_qua_huy (id INTEGER PRIMARY KEY, attempt_id INTEGER NOT NULL, vuot_boi_attempt_id INTEGER, diem_json TEXT NOT NULL, lich_json TEXT NOT NULL,
      so_diem INTEGER NOT NULL, ly_do TEXT NOT NULL, huy_boi INTEGER, huy_luc TEXT NOT NULL, khoi_phuc_boi INTEGER, khoi_phuc_luc TEXT, ly_do_khoi_phuc TEXT)`);
    ban.prepare(`INSERT INTO ket_qua_huy (attempt_id, diem_json, lich_json, so_diem, ly_do, huy_luc) VALUES (1, '[]', '[]', 0, 'cũ', ?)`).run(TODAY);
    const a1: string[] = []; migratePrOv4(ban, a1);
    const a2: string[] = []; migratePrOv4(ban, a2);
    assert(a1.length === 1 && a2.length === 0, JSON.stringify({ a1, a2 }));
    assert((ban.prepare(`SELECT loai, dong_json FROM ket_qua_huy`).all() as any[]).every((r) => r.loai === 'doi_vuot' && r.dong_json === null), 'dòng cũ phải là doi_vuot');
  }));
  /*
   * Mọi lượt Mock còn hiệu lực CÓ điểm trên dữ liệu cuối run.ts (thay VN4-2 "trùng cách cũ"): huỷ rồi khôi phục → mọi thứ huỷ chạm trở lại đúng như trước
   * (lượt, lịch, điểm, Case, PA, Phối hợp, tín hiệu, mốc); số câu SQL của Khôi phục ≤ trần (Turso).
   */
  check(`OV4a-10 · Huỷ rồi Khôi phục mọi lượt Mock có điểm: trở lại đúng như trước; Khôi phục ≤ ${TRAN_GHI_LO.khoiPhucLuot} câu SQL`, () => {
    const ds = all(`SELECT a.id, a.student_id FROM assessment_attempts a WHERE a.status != 'cancelled' AND a.kind = 'mock'
      AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)) ORDER BY a.id`);
    assert(ds.length >= 20, `cần nhiều lượt có điểm: ${ds.length}`);
    const sai: string[] = [];
    let nang = { id: 0, n: 0 };
    for (const a of ds) {
      /* Lượt còn bản dời vượt treo: Khôi phục đưa CẢ bản đó về (OV4a-5) — trạng thái sau khác trước là đúng ý, không so. */
      if (one(`SELECT 1 x FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'doi_vuot' AND khoi_phuc_luc IS NULL`, a.id)) continue;
      thu(() => {
        const truoc = chup(a.student_id, a.id);
        attempts.huyLuot(P.admin, a.id, { lyDo: 'Thử OV4a' });
        const s0 = soCauSql();
        const r = attempts.reopenAttempt(P.admin, a.id);
        const n = soCauSql() - s0;
        if (n > nang.n) nang = { id: a.id, n };
        const l = r.chuaXep ? null : lech(truoc, chup(a.student_id, a.id));
        if (l) sai.push(`lượt ${a.id}: ${l}`);
      });
    }
    console.log('OV4a-10', JSON.stringify({ luot: ds.length, nangNhat: nang }));
    assert(!sai.length, `${sai.length}/${ds.length} lượt khác trước huỷ:\n${sai.slice(0, 3).join('\n')}`);
    assert(nang.n <= TRAN_GHI_LO.khoiPhucLuot, `lượt ${nang.id}: ${nang.n} câu > trần ${TRAN_GHI_LO.khoiPhucLuot}`);
  });
}
