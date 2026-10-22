/**
 * PHÉP KIỂM LUAT-34 — MỘT BẢNG → MỘT TỆP: bảng chuyển trạng thái Mock Test (05 mục 4.3, 13 trạng thái × 31 chuyển T01–T31) theo Luật 3 + Luật 4
 * sửa 21/10, cộng hàm thuần `chuyenVang` (12 ca ngày + ca 21/10) và Hoàn tác 10 s. Mỗi dòng dựng trạng thái TRƯỚC bằng hàm máy chủ thật trong
 * một giao dịch rồi cuộn lại (`thu`); kỳ vọng trạng thái sau · đếm · thẻ · chuông · Case.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runMtTrangThaiTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const hoanTat: any = await import('../fasttrack/hoanTat.ts');
  const ketQuaHuy: any = await import('../fasttrack/ketQuaHuy.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const tutors: any = await import('../tutors/trang.ts');
  const week: any = await import('../platform/week.ts');
  const permissions: any = await import('../permissions.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLUAT-34 · bảng chuyển trạng thái Mock Test T01–T31 + chuyenVang + Luật 3');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const QL = P.mbManager, gvL = P.lrTeacher, gvS = P.sTeacher, gvcn = P.coreTeacher, gvW1 = P.w1Teacher, gvW2 = P.w2Teacher;
  /* Tuần thi dựng ca: W = W1 NOV 2026 (02–08/11). TRONG = thứ Tư tuần thi; BU = thứ Tư tuần kế (W+1); QUA = thứ Tư W+2 (tuần kế đã hết hẳn). */
  const WS = '2026-11-02';
  const TRONG = '2026-11-04', BU = '2026-11-11', QUA = '2026-11-18';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod('2026-11-09').id as number;
  const W2 = week.ensurePeriod('2026-11-16').id as number, W3 = week.ensurePeriod('2026-11-23').id as number;
  const W0 = week.ensurePeriod('2026-10-26').id as number;

  /* Lượt MT CUỐI của mỗi em đang học MB FT 101 — không có lượt sau để luật thứ tự đợt (T15) chặn lần dời. */
  const luot = all(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 4`, lop).map((r) => r.id as number);

  /** Trạng thái sạch: mọi kỹ năng bắt buộc ở tuần `pid`, chưa điểm, chưa vắng; `lichSu` = MT cũ. Lượt khác của lớp rời các tuần dựng ca. */
  const dung = (aid: number, o: { pid?: number; lichSu?: boolean } = {}) => {
    const pid = o.pid ?? W;
    skillSchedule.ensureSkillRows(aid);
    for (const b of ['assessment_scores', 'skill_move_requests', 'attempt_skill_skips', 'ket_qua_huy']) conn.prepare(`DELETE FROM ${b} WHERE attempt_id = ?`).run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(pid, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = ?, planned_period_id = ?, deadline_override = NULL WHERE id = ?`)
      .run(o.lichSu ? 1 : 0, pid, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?, ?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, W2, W3, ...luot);
    xoaNho();
  };
  const ky = (aid: number, s: string) => one('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', aid, s);
  const dau = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);
  const o = (aid: number, s: string, pid: number, today: string, p = P.admin) => (attempts.classScoreSheet(p, lop, pid, today) as any)
    .rows.find((r: any) => r.attemptId === aid)?.cells.find((c: any) => c.skill === s);
  const choDuyet = (aid: number) => all(`SELECT * FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`, aid);
  const chuong = (u: any, khoa: string) => (one('SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key LIKE ?', u.userId, khoa).n as number);
  const soCase = () => (one('SELECT COUNT(*) n FROM sos_cases').n as number);
  const banCat = (aid: number) => all(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_diem' AND khoi_phuc_luc IS NULL`, aid);
  /** Ghi điểm đủ mọi ô của lượt ở tuần W (L/R số câu, W1/W2/S tiêu chí) — dựng "Đủ điểm". */
  const duDiem = (aid: number) => {
    for (const s of ['listening', 'reading']) attempts.saveScore(QL, aid, s, { rawScore: 30 }, TRONG);
    for (const s of ['writing1', 'writing2', 'speaking']) attempts.saveScore(QL, aid, s, { criteria: [6, 6, 6, 6] }, TRONG);
  };
  /** Đẩy lần ghi "-" về quá khứ (> 10 s) — qua cửa sổ Hoàn tác. */
  const quaHoanTac = (aid: number, s: string) => conn.prepare(`UPDATE assessment_scores SET no_show_at = '2026-01-01T00:00:00.000Z' WHERE attempt_id = ? AND skill = ?`).run(aid, s);

  check('LUAT34-0 · tiền đề: đủ 4 lượt MT cuối sạch ở MB FT 101', () => {
    assert(luot.length === 4, `cần 4 lượt, có ${luot.length}`);
  });

  // ---------------------------------------------------------------- hàm thuần

  check('LUAT34-CV · chuyenVang: 12 ca ngày (CN 23:59 / T2 00:00, tuần kế còn chạy / hết hẳn, MT cũ 2 / 3 tuần, vướng, MT0) + ca 21/10', () => {
    const cv = (x: Partial<{ lan: number; tuanThi: string; homNay: string; mtCu: boolean; vuong: boolean }>) =>
      dm.chuyenVang({ lan: 0, tuanThi: WS, homNay: TRONG, mtCu: false, vuong: false, ...x });
    const ca: Array<[string, any, string, string | null]> = [
      ['1 trong tuần thi', {}, 'doi', '2026-11-09'],
      ['2 CN tuần thi 23:59', { homNay: '2026-11-08' }, 'doi', '2026-11-09'],
      ['3 T2 tuần kế 00:00 (ghi muộn)', { homNay: '2026-11-09' }, 'doi', '2026-11-09'],
      ['4 giữa tuần kế', { homNay: BU }, 'doi', '2026-11-09'],
      ['5 CN tuần kế (còn thi được)', { homNay: '2026-11-15' }, 'doi', '2026-11-09'],
      ['6 T2 sau tuần kế (hết hẳn)', { homNay: '2026-11-16' }, 'the-ql', null],
      ['7 vướng MT sau', { vuong: true }, 'the-ql', null],
      ['8 MT0 vượt hạn chót (vướng)', { vuong: true, homNay: '2026-11-08' }, 'the-ql', null],
      ['9 MT cũ cách 2 tuần', { mtCu: true, tuanThi: '2026-10-19' }, 'huy', null],
      ['10 MT cũ cách 3 tuần', { mtCu: true, tuanThi: '2026-10-12' }, 'huy', null],
      ['11 lần 2 (tuần đã dời tới)', { lan: 1, tuanThi: '2026-11-09', homNay: BU }, 'huy', null],
      ['12 lần 2 ghi muộn', { lan: 1, tuanThi: '2026-11-09', homNay: QUA }, 'huy', null],
      ['21/10 sau Khôi phục (chuỗi đặt lại)', { lan: 0 }, 'doi', '2026-11-09'],
      ['21/10 sau QL duyệt thêm (+1)', { lan: 1 }, 'huy', null],
    ];
    for (const [ten, vao, kq, tuan] of ca) {
      const r = cv(vao);
      assert(r.kq === kq && (r.tuanDich ?? null) === tuan, `ca ${ten}: ${JSON.stringify(r)}`);
    }
    const ghi = '2026-11-04T03:00:00.000Z', ms = Date.parse(ghi);
    assert(dm.HOAN_TAC_VANG_MS === 10000, 'Hoàn tác 10 s');
    assert(dm.duocHoanTacVang(ghi, ms + 9900) && !dm.duocHoanTacVang(ghi, ms + 16000) && !dm.duocHoanTacVang(null, ms), 'cửa sổ Hoàn tác (10 s + 5 s mạng)');
  });

  // ---------------------------------------------------------------- T01–T31

  check('T01 · S1 → S2/S3: Xếp lịch (QL); tuần đã qua chỉ QL', () => thu(() => {
    const a = luot[0];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(a);
    xoaNho();
    const e = loi(() => skillSchedule.setSkillWeek(gvcn, a, 'listening', W0, { today: BU, force: true }));
    assert(e && e.status >= 400, 'GVCN không xếp tuần đã qua');
    skillSchedule.setSkillWeek(QL, a, 'listening', W0, { today: BU, force: true });
    assert(ky(a, 'listening').planned_period_id === W0, 'QL xếp được tuần đã qua');
  }));

  check('T02 · S3 → tuần mới: Dời lịch (QL) — đếm giữ, không thẻ', () => thu(() => {
    const a = luot[0];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET absence_move_count = 1 WHERE attempt_id = ? AND skill = 'reading'`).run(a);
    skillSchedule.setSkillWeek(QL, a, 'reading', W1, { today: TRONG, force: true });
    const k = ky(a, 'reading');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && !choDuyet(a).length, JSON.stringify(k));
  }));

  check('T03 · S2 → S3: tới T2 tuần thi', () => {
    const tt = (homNay: string) => dm.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-11-09', coDiem: false, sit: 'scheduled', choDuyet: false, lichSu: false, homNay });
    assert(tt(TRONG) === 'chua-toi-tuan' && tt('2026-11-09') === 'dang-thi', `${tt(TRONG)} / ${tt('2026-11-09')}`);
  });

  check('T04 · S3 → S8 / S9: "-" trong tuần thi — lần 1 máy dời + chuông GVCN; lần 2 (tuần đã dời tới) huỷ + chuông QL', () => thu(() => {
    const a = luot[0];
    dung(a);
    const r = attempts.saveScore(QL, a, 'listening', { noShow: true }, TRONG);   // QL gõ: GVCN (cũng dạy L ở bộ demo) nhận chuông
    let k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled' && r.vang?.kq === 'doi', `lần 1: ${JSON.stringify(k)}`);
    assert(chuong(gvcn, `no_show:${a}:listening:%`) === 1, 'chuông GVCN "Đã dời bài vắng"');
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    k = ky(a, 'listening');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1, `lần 2: ${JSON.stringify(k)}`);
    assert(chuong(QL, `huy_vang:${a}:listening:%`) === 1, 'chuông QL vắng 2 lần');
  }));

  check('T05 · SỬA: "-" ghi sau tuần thi (MT hiện tại) — tuần kế của lịch còn thi được → dời; hết hẳn → thẻ QL; không còn Không dự thi', () => thu(() => {
    const a = luot[0];
    dung(a);
    const sos0 = soCase();
    const r = attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `ghi muộn tuần kế còn chạy phải dời W+1: ${JSON.stringify(k)}`);
    assert(dau(a, 'listening').no_show_cu === 0 && r.vang?.kq === 'doi', `không phải Không dự thi: ${JSON.stringify(r.vang)}`);
    const r2 = attempts.saveScore(QL, a, 'reading', { noShow: true }, QUA);
    const k2 = ky(a, 'reading');
    assert(k2.sit_status === 'absent' && k2.planned_period_id === W && choDuyet(a).some((q) => q.skill === 'reading'), `tuần kế hết hẳn → thẻ QL: ${JSON.stringify(k2)}`);
    assert(r2.vang?.kq === 'cho-ql' && dau(a, 'reading').no_show_cu === 0, `kq: ${JSON.stringify(r2.vang)}`);
    assert(soCase() >= sos0, 'Case không mất');
  }));

  check('T06 · SỬA: "-" ở MT cũ → Đã huỷ ngay (S13): không dời, không thẻ, chuông QL "để biết", không Case', () => thu(() => {
    const a = luot[1];
    dung(a, { lichSu: true });
    const sos0 = soCase();
    const r = attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    const k = ky(a, 'listening');
    assert(dau(a, 'listening').no_show_cu === 1 && k.planned_period_id === W && k.absence_move_count === 0 && !choDuyet(a).length, `S13: ${JSON.stringify(k)}`);
    assert(r.vang?.kq === 'huy-cu', `kq phải huy-cu: ${JSON.stringify(r.vang)}`);
    assert(o(a, 'listening', W, TRONG)?.noShow?.state === 'da-huy', `ô hiện "Đã huỷ": ${JSON.stringify(o(a, 'listening', W, TRONG)?.noShow)}`);
    assert(chuong(QL, `huy_vang_cu:${a}:listening`) === 1, 'chuông QL để biết');
    assert(soCase() === sos0, 'không tạo Case');
  }));

  check('T07 · SỬA: Writing — MT hiện tại task kia có điểm → dời cả W (điểm đi theo); MT cũ một task "-" → chỉ ô đó Đã huỷ, giữ điểm task kia', () => thu(() => {
    const [a, b, c] = luot;
    dung(a);
    attempts.saveScore(gvW1, a, 'writing1', { criteria: [6, 6, 6, 6] }, TRONG);
    attempts.saveScore(gvW2, a, 'writing2', { noShow: true }, TRONG);
    let k = ky(a, 'writing');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && dau(a, 'writing1').band === 6, `W1 điểm + W2 "-": ${JSON.stringify(k)}`);
    dung(b);
    attempts.saveScore(gvW2, b, 'writing2', { noShow: true }, TRONG);
    assert(ky(b, 'writing').planned_period_id === W, 'W2 "-" một mình: chờ ô kia (S4)');
    attempts.saveScore(gvW1, b, 'writing1', { criteria: [6, 6, 6, 6] }, TRONG);
    k = ky(b, 'writing');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1, `W2 "-" rồi W1 điểm → dời: ${JSON.stringify(k)}`);
    dung(c, { lichSu: true });
    attempts.saveScore(gvW1, c, 'writing1', { criteria: [6, 6, 6, 6] }, TRONG);
    attempts.saveScore(gvW2, c, 'writing2', { noShow: true }, TRONG);
    assert(dau(c, 'writing2').no_show_cu === 1 && dau(c, 'writing1').band === 6 && ky(c, 'writing').sit_status !== 'cancelled', 'MT cũ: chỉ W2 huỷ');
    const c2 = o(c, 'writing2', W, TRONG);
    assert(c2?.noShow?.state === 'da-huy' && !c2?.overdue, `W2 MT cũ: ${JSON.stringify(c2?.noShow)}`);
  }));

  check('T08 · S3/S8 → S5: Nhập điểm (đã tới tuần); "-" cũ hết hiệu lực', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    assert(dau(a, 'listening').band !== null && ky(a, 'listening').sit_status === 'sat', 'S3 → S5');
    attempts.saveScore(QL, a, 'reading', { noShow: true }, TRONG);
    attempts.saveScore(QL, a, 'reading', { rawScore: 30 }, BU);
    assert(dau(a, 'reading').band !== null && dau(a, 'reading').no_show_period_id === null, 'S8 → S5');
  }));

  check('T09 · Gỡ "-": S8 trả như trước · S9 Hoàn tác 10 s người vừa gõ, sau đó chỉ QL · SỬA S13: người có quyền sửa ô gỡ + nhật ký + chuông QL', () => thu(() => {
    const [a, b, c] = luot;
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, BU);
    let k = ky(a, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 0, `S8 gỡ: ${JSON.stringify(k)}`);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    assert(ky(a, 'listening').sit_status === 'cancelled', 'tiền đề S9');
    assert(chuong(QL, `huy_vang:${a}:listening:%`) === 1, 'tiền đề: chuông QL vắng 2 lần');
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, BU);   // Hoàn tác ngay
    k = ky(a, 'listening');
    assert(k.sit_status === 'scheduled' && k.planned_period_id === W1 && k.absence_move_count === 1, `S9 Hoàn tác về S8: ${JSON.stringify(k)}`);
    assert(chuong(QL, `huy_vang:${a}:listening:%`) === 0, 'Hoàn tác vắng 2 lần rút chuông QL');
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    quaHoanTac(a, 'listening');
    const e = loi(() => attempts.saveScore(gvL, a, 'listening', { noShow: false }, BU));
    assert(e?.status === 403, `S9 sau 10 s GV gỡ: ${e?.status} ${e?.message}`);
    /* S13 */
    dung(b, { lichSu: true });
    attempts.saveScore(gvL, b, 'listening', { noShow: true }, TRONG);
    quaHoanTac(b, 'listening');
    attempts.saveScore(gvL, b, 'listening', { noShow: false }, TRONG);
    assert(dau(b, 'listening').no_show_period_id === null && dau(b, 'listening').no_show_cu === 0, 'S13 gỡ → như trước khi gõ');
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.no_show_cleared' AND entity_id = ?`, b).n >= 1, 'nhật ký gỡ');
    assert(chuong(QL, `go_huy_cu:${b}:listening:%`) === 1, 'chuông QL để biết khi gỡ S13');
    dung(c, { lichSu: true });
    attempts.saveScore(gvL, c, 'listening', { noShow: true }, TRONG);
    attempts.saveScore(gvL, c, 'listening', { noShow: false }, TRONG);   // Hoàn tác trong 10 s
    assert(chuong(QL, `huy_vang_cu:${c}:listening`) === 0 && chuong(QL, `go_huy_cu:${c}:listening:%`) === 0, 'Hoàn tác: rút chuông, không chuông mới');
    /* Rà #503 (1): W1 có điểm từ trước + W2 "-" nhầm → cả W dời; Hoàn tác trả W về tuần cũ, đếm 0. */
    const d = luot[3];
    dung(d);
    attempts.saveScore(gvW1, d, 'writing1', { criteria: [6, 6, 6, 6] }, TRONG);
    attempts.saveScore(gvW2, d, 'writing2', { noShow: true }, TRONG);
    assert(ky(d, 'writing').planned_period_id === W1, 'tiền đề: W dời');
    attempts.saveScore(gvW2, d, 'writing2', { noShow: false }, TRONG);
    k = ky(d, 'writing');
    assert(k.planned_period_id === W && k.absence_move_count === 0 && dau(d, 'writing1').band === 6, `Hoàn tác W2 "-": ${JSON.stringify(k)}`);
  }));

  check('T10 · S6 → S8: QL Duyệt thẻ (+1 lần) — vắng tiếp ở tuần đích → huỷ', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, QUA);
    const req = choDuyet(a)[0];
    assert(req && ky(a, 'listening').sit_status === 'absent', 'tiền đề S6');
    absence.decideAbsenceMove(QL, req.id, { approve: true });
    const k = ky(a, 'listening');
    assert(k.sit_status === 'scheduled' && k.absence_move_count === 1 && k.planned_period_id === req.to_period_id, `duyệt: ${JSON.stringify(k)}`);
    const tuan = one('SELECT week_start FROM report_periods WHERE id = ?', k.planned_period_id).week_start as string;
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, t.addDays(tuan, 2));
    assert(ky(a, 'listening').sit_status === 'cancelled', 'vắng tiếp → huỷ');
  }));

  check('T11 · S6 → S10: QL Từ chối (lý do bắt buộc)', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, QUA);
    const req = choDuyet(a)[0];
    assert(loi(() => absence.decideAbsenceMove(QL, req.id, { approve: false }))?.status === 400, 'thiếu lý do → 400');
    absence.decideAbsenceMove(QL, req.id, { approve: false, note: 'Em nghỉ dài' });
    const k = ky(a, 'listening');
    assert(k.sit_status === 'cancelled' && !k.huy_vang, JSON.stringify(k));
  }));

  check('T12 · S6 → S10: thẻ hết hạn', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, QUA);
    conn.prepare(`UPDATE skill_move_requests SET decide_by = '2000-01-01' WHERE attempt_id = ?`).run(a);
    absence.sweepExpiredMoves();
    assert(ky(a, 'listening').sit_status === 'cancelled' && !choDuyet(a).length, 'hết hạn → huỷ');
  }));

  check('T13 · S7 → S8: Xếp lại (QL) +1 · nút chỉ hiện cho vai máy chủ cho (sửa H15: GVCN FT)', () => thu(() => {
    const a = luot[0];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'listening'`).run(a);
    xoaNho();
    const nut = dm.thaoTacKyNang('vang', { nhapDiem: false, quanLy: false, gvcn: true, laFt: true, dotHoanTat: false });
    assert(nut.chinh === null, `GVCN FT không thấy "Xếp lại bài vắng": ${JSON.stringify(nut)}`);
    assert(loi(() => skillSchedule.setSkillWeek(gvcn, a, 'listening', W1, { today: TRONG, force: true }))?.status === 403, 'máy chủ 403 GVCN');
    skillSchedule.setSkillWeek(QL, a, 'listening', W1, { today: TRONG, force: true });
    const k = ky(a, 'listening');
    assert(k.sit_status === 'scheduled' && k.absence_move_count === 1 && k.planned_period_id === W1, JSON.stringify(k));
  }));

  check('T14–15 · SỬA: QL Khôi phục [Đặt tuần ▾ / Chưa xếp] — chuỗi đặt lại (được dời lại), nhận cả S13', () => thu(() => {
    const [a, b, c] = luot;
    const s9 = (x: number) => { dung(x); attempts.saveScore(gvL, x, 'listening', { noShow: true }, TRONG); attempts.saveScore(gvL, x, 'listening', { noShow: true }, BU); };
    s9(a);
    absence.restoreCancelledSkill(QL, a, 'listening', null);
    let k = ky(a, 'listening');
    assert(k.planned_period_id === null && k.sit_status === 'scheduled' && k.absence_move_count === 0, `Khôi phục → Chưa xếp: ${JSON.stringify(k)}`);
    s9(b);
    absence.restoreCancelledSkill(QL, b, 'listening', W2);
    attempts.saveScore(gvL, b, 'listening', { noShow: true }, QUA);
    k = ky(b, 'listening');
    assert(k.sit_status === 'scheduled' && k.planned_period_id === W3 && k.absence_move_count === 1, `sau Khôi phục "-" lại dời: ${JSON.stringify(k)}`);
    dung(c, { lichSu: true });
    attempts.saveScore(gvL, c, 'listening', { noShow: true }, TRONG);
    assert(loi(() => absence.restoreCancelledSkill(gvL, c, 'listening', W))?.status === 403, 'GV không Khôi phục');
    absence.restoreCancelledSkill(QL, c, 'listening', W);
    assert(dau(c, 'listening').no_show_cu === 0 && dau(c, 'listening').no_show_period_id === null && ky(c, 'listening').absence_move_count === 0, 'S13 Khôi phục');
  }));

  check('T16 · S9 / S13 → S12: Giữ huỷ (= Không mock lại)', () => thu(() => {
    const [a, b] = luot;
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    absence.khongMockLai(QL, a, 'listening');
    assert(ky(a, 'listening').required === 0, 'S9 → S12');
    dung(b, { lichSu: true });
    attempts.saveScore(gvL, b, 'listening', { noShow: true }, TRONG);
    absence.khongMockLai(QL, b, 'listening');
    assert(ky(b, 'listening').required === 0, 'S13 → S12');
  }));

  check('T17 · S9 → S6: "Xin dời" (route còn — khớp)', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    absence.xinDoi(QL, a, 'listening', { today: BU });
    assert(choDuyet(a).length === 1, 'có thẻ chờ');
  }));

  check('T18 · SỬA: Bỏ khỏi đợt có điểm → CẤT điểm (không xoá), nhận xét giữ', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30, nhanXet: 'Nghe tốt, cần luyện phần 4.' }, TRONG);
    attempts.setSkillSkip(QL, a, 'listening', true, null, { xoaDiem: true });
    assert(ky(a, 'listening').required === 0, 'S12');
    assert(banCat(a).length === 1, 'có bản cất điểm');
    assert(dau(a, 'listening').comment === 'Nghe tốt, cần luyện phần 4.', 'nhận xét giữ');
  }));

  check('T19 · S12 → S3: Đưa lại vào đợt (QL) — điểm cất trả bằng "Khôi phục điểm"', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    attempts.setSkillSkip(QL, a, 'listening', true, null, { xoaDiem: true });
    attempts.setSkillSkip(QL, a, 'listening', false, null);
    assert(ky(a, 'listening').required === 1, 'đưa lại');
    ketQuaHuy.khoiPhucDiem(QL, a, 'listening', TRONG);
    assert(dau(a, 'listening').raw_score === 30, 'điểm cũ về');
  }));

  check('T20 · SỬA: Huỷ điểm (GVBM sau "Đủ điểm") → điểm cất, nhận xét + nhóm + GV chấm giữ; SOS / Case tính lại', () => thu(() => {
    const a = luot[0];
    dung(a);
    duDiem(a);
    attempts.saveScore(QL, a, 'speaking', { nhanXet: 'Nói trôi chảy, phát âm cần sửa.' }, TRONG);
    assert(hoanTat.dotHoanTat(a, QUA).hoanTat, 'tiền đề: đợt đủ điểm');
    attempts.saveScore(gvL, a, 'listening', { rawScore: null, lyDo: 'nhập nhầm' }, QUA);
    assert(dau(a, 'listening').raw_score === null && banCat(a).length === 1, 'GVBM huỷ được, điểm cất');
    keHoach.huyDiem(QL, { attemptId: a, skill: 'speaking' });
    const s = dau(a, 'speaking');
    assert(s.band === null && s.comment === 'Nói trôi chảy, phát âm cần sửa.', `Huỷ điểm giữ nhận xét: ${JSON.stringify(s)}`);
    assert(one('SELECT status FROM assessment_attempts WHERE id = ?', a).status === 'planned', 'lượt tính lại (chưa đủ điểm)');
  }));

  check('T20b · Khôi phục điểm (1 bấm) — hết hiệu lực khi đã nhập điểm mới', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { rawScore: null }, TRONG);
    const goc = dau(a, 'listening');   // dòng đã huỷ: người / ngày nhập đầu chưa đổi khi cất
    assert(loi(() => ketQuaHuy.khoiPhucDiem(gvS, a, 'listening', TRONG))?.status === 403, 'GV khác môn không khôi phục (quyền trước)');
    conn.prepare(`UPDATE ket_qua_huy SET diem_json = json_set(diem_json, '$[0].nhap_dau_ngay', '2026-11-03', '$[0].entered_at', '2026-11-03T02:00:00.000Z') WHERE attempt_id = ?`).run(a);
    ketQuaHuy.khoiPhucDiem(QL, a, 'listening', TRONG);
    const sau = dau(a, 'listening');
    assert(sau.raw_score === 30 && !banCat(a).length, 'khôi phục');
    assert(sau.nhap_dau_ngay === '2026-11-03' && sau.entered_at === '2026-11-03T02:00:00.000Z' && sau.entered_by === gvL.userId,
      `giữ người nhập / ngày nhập đầu của bản cất: ${JSON.stringify({ n: sau.nhap_dau_ngay, a: sau.entered_at, b: sau.entered_by, goc: goc.entered_by })}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.khoi_phuc' AND entity_id = ?`, a).n === 1, 'nhật ký khôi phục');
    assert(loi(() => ketQuaHuy.khoiPhucDiem(gvL, a, 'listening', TRONG))?.status === 400, 'không còn gì để khôi phục');
    attempts.saveScore(gvL, a, 'listening', { rawScore: null }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 25 }, TRONG);
    assert(!banCat(a).length, 'nhập điểm mới đóng bản cất');
    assert(loi(() => ketQuaHuy.khoiPhucDiem(gvL, a, 'listening', TRONG))?.status === 400, 'đã có điểm mới → 400');
  }));

  check('T21 · SỬA: Sửa điểm — GVBM đúng ô mọi lúc (sau Đủ điểm, MT cũ quá 7 ngày); GV khác môn 403; lớp kết thúc chỉ QL', () => thu(() => {
    const [a, b] = luot;
    dung(a);
    duDiem(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 31 }, QUA);
    assert(dau(a, 'listening').raw_score === 31, 'GVBM sửa sau Đủ điểm');
    const nk = one(`SELECT after_json FROM audit_logs WHERE entity_id = ? AND entity_label = 'listening' ORDER BY id DESC LIMIT 1`, a);
    assert(/sauHoanTat/.test(nk?.after_json ?? ''), 'nhật ký ghi sauHoanTat');
    assert(loi(() => attempts.saveScore(gvS, a, 'listening', { rawScore: 32 }, QUA))?.status === 403, 'GV khác môn 403');
    dung(b, { lichSu: true });
    attempts.saveScore(gvL, b, 'listening', { rawScore: 30 }, TRONG);
    attempts.saveScore(gvL, b, 'listening', { rawScore: 29 }, '2026-12-20');
    assert(dau(b, 'listening').raw_score === 29, 'MT cũ quá 7 ngày GVBM sửa được');
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(lop);
    xoaNho();
    assert(loi(() => attempts.saveScore(gvL, a, 'listening', { rawScore: 33 }, QUA))?.status === 403, 'lớp kết thúc: GV 403');
    attempts.saveScore(QL, a, 'listening', { rawScore: 33, lyDo: 'QL hiệu chỉnh' }, QUA);
    assert(dau(a, 'listening').raw_score === 33, 'lớp kết thúc: QL sửa');
  }));

  check('T22 · S5 → tuần mới: Dời lịch (QL) — điểm đi theo', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    skillSchedule.setSkillWeek(QL, a, 'listening', W1, { today: TRONG, force: true });
    assert(ky(a, 'listening').planned_period_id === W1 && dau(a, 'listening').raw_score === 30, 'điểm giữ');
  }));

  check('T23 · S5 → S2/S3: Thi lại (QL) — ô trống, điểm cũ vào Lịch sử (không thành bản cất)', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    keHoach.thiLai(QL, { attemptId: a, skills: ['listening'], periodId: W1, force: true });
    const k = ky(a, 'listening');
    assert(dau(a, 'listening').raw_score === null && k.planned_period_id === W1 && k.sit_status === 'scheduled' && !banCat(a).length, JSON.stringify(k));
  }));

  check('T24 · Xóa lịch (QL): chặn khi có điểm; không điểm → mọi kỹ năng Chưa xếp', () => thu(() => {
    const [a, b] = luot;
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    assert(loi(() => skillSchedule.boTuanLuot(QL, a, {}))?.status === 400, 'có điểm → chặn');
    dung(b);
    skillSchedule.boTuanLuot(QL, b, {});
    assert(all('SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND required = 1', b).every((r) => r.planned_period_id === null), 'Chưa xếp');
  }));

  check('T25 · Huỷ MT{n} đã bỏ khỏi web', () => thu(() => {
    const a = luot[0];
    dung(a);
    assert(loi(() => attempts.huyLuot(QL, a, { quaWeb: true }))?.status === 400, 'quaWeb → 400');
  }));

  check('T26 → LUAT-NX-MT · Dời MT trước vượt MT sau: KHÔNG chặn', () => thu(() => {
    const a = luot[0];
    dung(a);
    const truoc = one(`SELECT x.id FROM assessment_attempts x JOIN assessment_attempts a ON a.cycle_id = x.cycle_id
      WHERE a.id = ? AND x.kind = 'mock' AND x.attempt_no = a.attempt_no - 1 AND x.status != 'cancelled'`, a);
    assert(truoc, 'tiền đề: có MT trước');
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`).run(truoc.id);
    xoaNho();
    skillSchedule.setSkillWeek(QL, truoc.id, 'listening', W3, { today: TRONG, force: true });   // không ném = không chặn
  }));

  check('T27 · mọi xếp / dời (cả QL duyệt thẻ dời do vắng) → cờ MT cũ tính lại', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, QUA);
    absence.decideAbsenceMove(QL, choDuyet(a)[0].id, { approve: true });
    assert(one('SELECT lich_su FROM assessment_attempts WHERE id = ?', a).lich_su === 0, 'tuần mới → không MT cũ');
  }));

  check('T28 · SỬA: đủ điểm + qua CN = chỉ trạng thái "Đủ điểm", KHÔNG khoá GVBM', () => thu(() => {
    const a = luot[0];
    dung(a);
    duDiem(a);
    assert(hoanTat.dotHoanTat(a, QUA).hoanTat, 'tiền đề');
    assert(o(a, 'listening', W, QUA, gvL)?.canEdit === true, 'ô GVBM vẫn sửa được');
    const tt = dm.thaoTacKyNang('co-diem', { nhapDiem: true, quanLy: false, gvcn: false, laFt: true, dotHoanTat: true });
    assert(tt.chinh === 'sua-diem' && tt.menu.includes('huy-diem'), `menu GVBM sau Đủ điểm: ${JSON.stringify(tt)}`);
  }));

  check('T29 · lớp kết thúc: không ghi "-" (giữ); sửa điểm chỉ QL', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, TRONG);
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(lop);
    xoaNho();
    assert(loi(() => attempts.saveScore(QL, a, 'reading', { noShow: true }, TRONG))?.status === 400, '"-" → 400');
    assert(loi(() => attempts.saveScore(gvL, a, 'listening', { rawScore: 31 }, TRONG))?.status === 403, 'GV 403');
  }));

  check('T30 · S11 (dữ liệu cũ "Không dự thi"): MT hiện tại giữ chữ cũ, gỡ được; MT cũ hiện "Đã huỷ", QL Khôi phục được', () => thu(() => {
    const [a, b] = luot;
    const cu = (x: number) => conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu)
      VALUES (?, 'listening', ?, ?, '2026-01-01T00:00:00.000Z', 1, '2026-01-01T00:00:00.000Z', 1)`).run(x, W, gvL.userId);
    dung(a);
    cu(a);
    xoaNho();
    assert(o(a, 'listening', W, QUA)?.noShow?.state === 'khong-du-thi', 'MT hiện tại: Không dự thi (dữ liệu cũ)');
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, QUA);
    assert(dau(a, 'listening').no_show_period_id === null, 'gỡ được');
    dung(b, { lichSu: true });
    cu(b);
    xoaNho();
    assert(o(b, 'listening', W, QUA)?.noShow?.state === 'da-huy', 'MT cũ: hiện Đã huỷ');
    absence.restoreCancelledSkill(QL, b, 'listening', W);
    assert(dau(b, 'listening').no_show_cu === 0, 'QL Khôi phục ô cũ');
  }));

  check('T31 · đếm theo tuần: gõ lại / sửa "-" trong cùng tuần không tính thêm; lần 2 chỉ ở tuần đã dời tới (chốt lúc lưu, như hiện nay)', () => thu(() => {
    const a = luot[0];
    dung(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    assert(loi(() => attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG))?.status === 400, 'gõ lại trong tuần cũ: tuần đích chưa tới → không ghi');
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    let k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `sửa "-" cùng tuần vẫn lần 1: ${JSON.stringify(k)}`);
    attempts.saveScore(gvW1, a, 'writing1', { noShow: true }, TRONG);
    attempts.saveScore(gvW1, a, 'writing1', { noShow: true }, TRONG);
    assert(ky(a, 'writing').absence_move_count === 0, 'gõ lại cùng tuần vô hại');
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    k = ky(a, 'listening');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1, `lần 2 ở tuần đã dời tới → huỷ: ${JSON.stringify(k)}`);
  }));

  // ---------------------------------------------------------------- Luật 3 ngoài bảng MT

  check('LUAT34-L3a · lớp thường: GVBM huỷ điểm (qua tuần thi) → cất; Khôi phục điểm một bấm (R11 lớp thường: keHoachTest R11(c))', () => thu(() => {
    const r = one(`SELECT a.id, s.skill, s.raw_score, ta.user_id, (SELECT MAX(rp.week_end) FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
          WHERE k.attempt_id = a.id) AS het
        FROM assessment_attempts a JOIN classes c ON c.id = a.class_id AND c.status != 'finished'
        JOIN programmes pg ON pg.code = c.programme_code AND pg.scoring_mode = 'ratio'
        JOIN assessment_scores s ON s.attempt_id = a.id AND s.raw_score IS NOT NULL
        JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.skill = s.skill AND ta.status = 'active' AND ta.is_core = 0
       WHERE a.status = 'done' AND a.kind != 'mt0' ORDER BY a.id LIMIT 1`);
    assert(r?.het, 'tiền đề: có bài lớp thường đủ điểm');
    const gv = permissions.loadPrincipal(r.user_id);
    const homNay = t.addDays(String(r.het).slice(0, 10), 10);
    regular.saveRegularScore(gv, r.id, r.skill, { score: null }, homNay);
    assert(dau(r.id, r.skill).raw_score === null && banCat(r.id).length === 1, 'GVBM huỷ được, điểm cất');
    ketQuaHuy.khoiPhucDiem(gv, r.id, r.skill, homNay);
    assert(dau(r.id, r.skill).raw_score === r.raw_score, 'Khôi phục điểm lớp thường');
  }));

  check('LUAT34-L3b · Tutor: người ghi sửa nhận xét quá 24 giờ (có trước → sau); xoá vẫn 24 giờ', () => thu(() => {
    const tutor = one('SELECT id FROM tutors LIMIT 1');
    assert(tutor, 'tiền đề: có tutor');
    const id = Number(conn.prepare(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?, 'on', 'Dạy đều, em tiến bộ.', ?, '2026-01-01T00:00:00.000Z')`)
      .run(tutor.id, P.admin.userId).lastInsertRowid);
    tutors.suaNhanXet(P.admin, id, { ketLuan: 'can_cai_thien', noiDung: 'Cần chuẩn bị bài kỹ hơn.' });
    assert(one('SELECT noi_dung FROM tutor_nhan_xet WHERE id = ?', id).noi_dung === 'Cần chuẩn bị bài kỹ hơn.', 'sửa quá 24 giờ');
    const nk = one(`SELECT before_json FROM audit_logs WHERE action = 'tutor.nhan_xet_sua' AND entity_id = ? ORDER BY id DESC LIMIT 1`, id);
    assert(/Dạy đều/.test(nk?.before_json ?? ''), 'nhật ký trước → sau');
    assert(loi(() => tutors.xoaNhanXet(P.admin, id))?.status === 400, 'xoá quá 24 giờ vẫn chặn');
  }));
}
