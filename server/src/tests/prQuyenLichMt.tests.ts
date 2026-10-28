/**
 * PHÉP KIỂM QUYEN-LICH-MT (chủ SP 28/10, PTA chốt phạm vi): GVCN lớp đó dời lịch kỹ năng MT tuần ĐÃ QUA (kể cả có điểm) sang tuần đã qua / tuần này;
 * dời sang tuần tới vẫn chỉ Quản lý; GV bộ môn không. Kế hoạch Test: GV thấy lớp mình dạy, CHỈ XEM (ghi vẫn 403).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrQuyenLichMtTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const lich: any = await import('../fasttrack/skillSchedule.ts');
  const at: any = await import('../fasttrack/attempts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nQUYEN-LICH-MT · GVCN dời MT tuần đã qua · GV xem Kế hoạch Test');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a)[0] as any;
  const QL = P.mbManager;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  const nguoi = (n: string) => accounts.createAccount(P.admin, {
    email: `qlmt.${n}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-qlmt', fullName: `Thử QLMT ${n}`, roles: [{ role: 'teacher', branches: ['MB'] }],
  }).userId as number;
  const start = addDays(T2, -7 * 12);
  const l = intake.createClass(P.admin, { code: 'MB QLMT-1', branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  const gvcnId = nguoi('cn'), gvbmId = nguoi('bm');
  const gan = (u: number, core: number, skill: string | null) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,'2026-01-01','active',?)`,
  ).run(u, l, skill, core, NOW);
  gan(gvcnId, 1, null); gan(gvbmId, 0, 'reading');
  xoaNho();
  const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
    .run('PISA-QLMT-1', 'Thử Quyền Lịch', util.normalizeName('Thử Quyền Lịch'), MB, NOW).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, start, NOW);
  conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at)
    VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`).run(sid, tuan(start), start, NOW);
  const cu = addDays(T2, -7 * 5), cu2 = addDays(T2, -7 * 4), toi = addDays(T2, 7 * 3);
  const id = kh.xepMoi(QL, { studentId: sid, attemptNo: 1, tuan: Object.fromEntries(['listening', 'reading', 'writing', 'speaking'].map((k) => [k, tuan(cu)])), force: true }).id as number;
  at.saveScore(QL, id, 'listening', { band: 6 }, TODAY);
  const gvcn = loadPrincipal(gvcnId), gvbm = loadPrincipal(gvbmId);
  const tuanCua = (k: string) => one(`SELECT rp.week_start FROM attempt_skills s JOIN report_periods rp ON rp.id = s.planned_period_id WHERE s.attempt_id = ? AND s.skill = ?`, id, k).week_start;
  const nem = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };

  check('QLMT-1 · gvcnDoiMtCu: tuần cũ đã qua → đích tuần đã qua / tuần này được, tuần tới không; tuần cũ chưa qua thì không', () => {
    assert(d.gvcnDoiMtCu({ tuanCuKetThuc: addDays(cu, 6), tuanMoiBatDau: cu2, homNay: TODAY }), 'qua → qua');
    assert(d.gvcnDoiMtCu({ tuanCuKetThuc: addDays(cu, 6), tuanMoiBatDau: T2, homNay: TODAY }), 'qua → tuần này');
    assert(!d.gvcnDoiMtCu({ tuanCuKetThuc: addDays(cu, 6), tuanMoiBatDau: toi, homNay: TODAY }), 'qua → tuần tới');
    assert(!d.gvcnDoiMtCu({ tuanCuKetThuc: addDays(toi, 6), tuanMoiBatDau: cu2, homNay: TODAY }), 'tuần tới → qua');
    assert(!d.gvcnDoiMtCu({ tuanCuKetThuc: null, tuanMoiBatDau: cu2, homNay: TODAY }), 'chưa xếp');
  });

  check('QLMT-2 · GVCN dời L (đã có điểm) MT tuần đã qua sang tuần đã qua — được, điểm giữ; sang tuần tới → 403; GVBM → 403', () => {
    assert(nem(() => lich.setSkillWeek(gvcn, id, 'listening', tuan(toi), { force: true, today: TODAY })) === 403, 'GVCN → tuần tới phải 403');
    assert(nem(() => lich.setSkillWeek(gvbm, id, 'reading', tuan(cu2), { force: true, today: TODAY })) === 403, 'GVBM phải 403');
    lich.setSkillWeek(gvcn, id, 'listening', tuan(cu2), { force: true, today: TODAY });
    assert(tuanCua('listening') === cu2, `L sang ${cu2}, đang ${tuanCua('listening')}`);
    const diem = one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, id);
    assert(diem?.band === 6, `điểm L giữ 6, đang ${diem?.band}`);
  });

  check('QLMT-3 · thaoTacKyNang: GVCN có "Dời lịch" ở kỹ năng tuần đã qua (có điểm / MT cũ), không ở tuần tới', () => {
    const q = { nhapDiem: false, quanLy: false, gvcn: true, laFt: true, dotHoanTat: false };
    assert(d.thaoTacKyNang('co-diem', { ...q, quaTuan: true }).menu.includes('doi-lich'), 'có điểm, tuần qua');
    assert(d.thaoTacKyNang('lich-su', { ...q, quaTuan: true }).menu.includes('doi-lich'), 'MT cũ chưa điểm');
    assert(!d.thaoTacKyNang('co-diem', { ...q, quaTuan: false }).menu.includes('doi-lich'), 'tuần chưa qua');
    assert(!d.thaoTacKyNang('co-diem', { ...q, gvcn: false, quaTuan: true }).menu.includes('doi-lich'), 'GVBM');
  });

  check('QLMT-4 · Kế hoạch Test: GVBM, GVCN thấy lớp mình dạy (chỉ xem), đọc lưới được; ghi (xếp mới, lưu đợt) vẫn 403; QL không chỉ xem', () => {
    for (const [ten, p] of [['GVBM', gvbm], ['GVCN', gvcn]] as const) {
      const lop = kh.danhSachLop(p, { branchId: MB }).lop.find((x: any) => x.id === l);
      assert(lop && lop.chiXem === true, `${ten} thấy lớp, chỉ xem`);
      assert(kh.luoiFT(p, l, TODAY).chiXem === true, `${ten} đọc lưới`);
      assert(nem(() => kh.luuDot(p, { attemptId: id, kyNang: [{ skill: 'reading', periodId: tuan(cu2) }] })) === 403, `${ten} lưu đợt 403`);
      assert(nem(() => kh.xepMoi(p, { studentId: sid, attemptNo: 2, tuan: { listening: tuan(toi) }, force: true })) === 403, `${ten} xếp mới 403`);
    }
    assert(kh.luoiFT(QL, l, TODAY).chiXem === false, 'QL xếp được');
    const khac = nguoi('khac');
    xoaNho();
    assert(nem(() => kh.luoiFT(loadPrincipal(khac), l, TODAY)) === 403, 'GV không dạy lớp → 403');
    assert(!kh.danhSachLop(loadPrincipal(khac), { branchId: MB }).lop.some((x: any) => x.id === l), 'GV không dạy lớp không thấy');
  });
}
