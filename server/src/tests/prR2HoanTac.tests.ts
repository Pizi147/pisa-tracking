/**
 * R2 (rà 24/11 "chặn cứng / không Hoàn tác"): mỗi Hoàn tác máy chủ — về y như trước (so CẢ DB trừ nhật ký / chuông), lần hai / đổi sau → 409, sai vai → 403.
 * Mỗi ca ghi trong giao dịch rồi cuộn lại.
 */
export async function runPrR2HoanTacTests(t: any) {
  const { check, assert, conn, P } = t;
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const htl: any = await import('../keHoach/hoanTacLich.ts');
  const week: any = await import('../platform/week.ts');
  const sch: any = await import('../classes/schedule.ts');
  const scl: any = await import('../classes/suaCaLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nR2 HOÀN TÁC · xếp lịch Test nhiều em');

  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };
  const lop = (code: string) => one('SELECT id FROM classes WHERE code = ?', code).id as number;
  const emLop = (code: string, n: number) => all(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id
    WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' ORDER BY e.student_id LIMIT ?`, lop(code), n).map((r) => r.id as number);
  const BO = new Set(['audit_logs', 'ghi_dao', 'notifications', 'demo_config']);
  const bang = all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).map((r) => r.name as string).filter((b) => !BO.has(b));
  const chup = () => new Map(bang.map((b) => [b, JSON.stringify(all(`SELECT rowid AS __r, * FROM "${b}" ORDER BY rowid`))]));
  const khac = (a: Map<string, string>, b: Map<string, string>) => bang.filter((x) => a.get(x) !== b.get(x));
  const t4 = (pid: number) => Object.fromEntries(['listening', 'reading', 'writing', 'speaking'].map((k) => [k, pid]));
  const xa = week.ensurePeriod('2029-08-06').id, xa2 = week.ensurePeriod('2029-09-03').id;

  check('R2-C2a · Xếp lịch Test lô "MT mới" 2 em → Hoàn tác: lượt vừa tạo mất, DB y như trước; lần hai 409', () => thu(() => {
    const sids = emLop('MB FT 101', 2);
    const truoc = chup();
    const r = kh.xepHangLoat(P.mbManager, { classId: lop('MB FT 101'), attemptNo: 'moi', studentIds: sids, tuan: t4(xa), force: true });
    assert(r.daLuu === 2 && r.dao, JSON.stringify({ daLuu: r.daLuu, dao: r.dao }));
    xoaNho();
    htl.hoanTacXep(P.mbManager, r.dao);
    const d = khac(truoc, chup());
    assert(!d.length, `còn khác sau Hoàn tác: ${d.join(', ')}`);
    assert(ma(() => htl.hoanTacXep(P.mbManager, r.dao)) === 409, 'lần hai 409');
  }));

  check('R2-C2b · lô DỜI tuần lượt đã có (FT + lớp thường) → Hoàn tác về tuần cũ, DB y như trước', () => thu(() => {
    const sids = emLop('MB FT 101', 2);
    const r0 = kh.xepHangLoat(P.mbManager, { classId: lop('MB FT 101'), attemptNo: 'moi', studentIds: sids, tuan: t4(xa), force: true });
    const so = one('SELECT attempt_no n FROM assessment_attempts WHERE id = (SELECT MAX(id) FROM assessment_attempts WHERE student_id = ?)', sids[0]).n;
    assert(r0.daLuu === 2 && so, 'tiền đề');
    const truoc = chup();
    const r = kh.xepHangLoat(P.mbManager, { classId: lop('MB FT 101'), attemptNo: so, studentIds: sids, tuan: t4(xa2), force: true });
    assert(r.daLuu >= 1 && r.dao, JSON.stringify(r));
    xoaNho();
    htl.hoanTacXep(P.mbManager, r.dao);
    assert(!khac(truoc, chup()).length, `FT còn khác: ${khac(truoc, chup()).join(', ')}`);
    const th = emLop('MB BE 03', 2);
    const truoc2 = chup();
    const r2 = kh.xepHangLoat(P.mbManager, { classId: lop('MB BE 03'), kind: 'final', studentIds: th, tuan: t4(xa2), force: true });
    assert(r2.daLuu > 0 && r2.dao, 'lớp thường: tiền đề có bài dời');
    {
      xoaNho();
      htl.hoanTacXep(P.mbManager, r2.dao);
      assert(!khac(truoc2, chup()).length, `lớp thường còn khác: ${khac(truoc2, chup()).join(', ')}`);
    }
  }));

  check('R2-C2c · Hoàn tác lô: GV 403 · đổi tiếp sau đó 409 (không đảo nửa chừng) · quá 15 phút 409 · /xep-moi một em có `dao` khi xin', () => thu(() => {
    const sids = emLop('MB FT 101', 2);
    const r = kh.xepHangLoat(P.mbManager, { classId: lop('MB FT 101'), attemptNo: 'moi', studentIds: sids, tuan: t4(xa), force: true });
    assert(ma(() => htl.hoanTacXep(P.lrTeacher, r.dao)) === 403, 'GV 403');
    const g = one('SELECT luc FROM ghi_dao WHERE id = ?', r.dao);
    assert(ma(() => htl.hoanTacXep(P.mbManager, r.dao, new Date(Date.parse(g.luc) + 16 * 60_000).toISOString())) === 409, 'quá 15 phút 409');
    const luot = one('SELECT id FROM assessment_attempts WHERE id = (SELECT MAX(id) FROM assessment_attempts WHERE student_id = ?)', sids[1]).id;
    conn.prepare('UPDATE assessment_attempts SET note = ? WHERE id = ?').run('đổi sau', luot);
    assert(ma(() => htl.hoanTacXep(P.mbManager, r.dao)) === 409, 'đổi sau 409');
    assert(one('SELECT COUNT(*) n FROM assessment_attempts WHERE id = ?', luot).n === 1, 'không đảo nửa chừng');
    const [s3] = emLop('MB FT 102', 1);
    const truoc = chup();
    const x = htl.emCoHoanTac(P.mbManager, true, { studentId: s3 }, () => kh.xepMoi(P.mbManager, { studentId: s3, tuan: t4(xa), force: true }));
    assert(x.dao && !htl.emCoHoanTac(P.mbManager, undefined, { studentId: s3 }, () => ({})).dao, 'chỉ chụp khi xin');
    xoaNho();
    htl.hoanTacXep(P.mbManager, [x.dao]);
    assert(!khac(truoc, chup()).length, `một em còn khác: ${khac(truoc, chup()).join(', ')}`);
  }));

  check('R2-C7 · Áp lịch đề xuất (một em) có `dao` → Hoàn tác: lượt vừa tạo / dời về như trước', () => thu(() => {
    const cy = one(`SELECT c.id, c.student_id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active'
      WHERE c.status = 'active' AND c.start_period_id IS NOT NULL AND e.class_id = ? ORDER BY c.id LIMIT 1`, lop('MB FT 101'));
    /* Tiền đề: lượt MT chưa thi về "chưa có lịch" (lịch đề xuất mới có cái để áp). */
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'auto', planned_period_id = NULL WHERE cycle_id = ? AND status = 'planned'`).run(cy.id);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE cycle_id = ? AND status = 'planned')`).run(cy.id);
    const truoc = chup();
    const r = htl.emCoHoanTac(P.mbManager, true, { studentId: cy.student_id }, () => sch.applySuggestedMockWeeks(P.mbManager, cy.id));
    assert(r.dao && r.created + r.moved > 0, `tiền đề có lượt tạo / dời: ${JSON.stringify(r)}`);
    xoaNho();
    htl.hoanTacXep(P.mbManager, r.dao);
    assert(!khac(truoc, chup()).length, `còn khác: ${khac(truoc, chup()).join(', ')}`);
  }));

  /* C1 / C4: Hoàn tác web gửi lại giá trị cũ qua đường sẵn có — kiểm đường đó đối xứng (bài / lượt về đúng tuần cũ). */
  const tuanBai = (cls: number) => JSON.stringify(all(`SELECT a.id, a.planned_period_id, s.skill, s.planned_period_id sp, a.status FROM assessment_attempts a
    LEFT JOIN attempt_skills s ON s.attempt_id = a.id WHERE a.class_id = ? ORDER BY a.id, s.skill`, cls));
  check('R2-C1 · đổi mốc lớp rồi gửi lại mốc cũ (Hoàn tác) → bài cả lớp về đúng tuần cũ, mốc về như cũ', () => thu(() => {
    const L = lop('MB BE 03');
    const cu = sch.classProgress(L);
    const bai0 = tuanBai(L);
    const moi = Math.min((cu.finalWeek ?? 8) + 1, cu.totalWeeks ?? 10);
    sch.setClassProgress(P.mbManager, L, { startPeriodId: cu.startPeriodId, progressWeek: cu.progressOverridden ? cu.progressWeek : null, finalWeek: moi === cu.finalWeek ? moi - 1 : moi });
    assert(tuanBai(L) !== bai0, 'tiền đề: bài đã dời');
    sch.setClassProgress(P.mbManager, L, { startPeriodId: cu.startPeriodId, progressWeek: cu.progressOverridden ? cu.progressWeek : null, finalWeek: cu.finalOverridden ? cu.finalWeek : null });
    const sau = sch.classProgress(L);
    assert(tuanBai(L) === bai0 && sau.finalWeek === cu.finalWeek && sau.finalOverridden === cu.finalOverridden, `bài / mốc chưa về: ${sau.finalWeek} vs ${cu.finalWeek}`);
  }));

  check('R2-C4 · Sửa cả lớp (SĐT + tuần bắt đầu) rồi gửi lại bản trước (Hoàn tác) → hồ sơ + lịch về như cũ', () => thu(() => {
    const L = lop('MB FT 101');
    const goc = scl.duLieuSuaCaLop(P.mbManager, L).rows.slice(0, 2);
    const bai0 = tuanBai(L);
    const tuanMoi = week.ensurePeriod('2026-08-31').week_start;
    scl.luuSuaCaLop(P.mbManager, L, { rows: goc.map((g: any) => ({ studentId: g.studentId, phone: '0900000999', startWeek: tuanMoi })) });
    assert(one('SELECT phone FROM students WHERE id = ?', goc[0].studentId).phone === '0900000999', 'tiền đề');
    scl.luuSuaCaLop(P.mbManager, L, { rows: goc.map((g: any) => ({ studentId: g.studentId, phone: g.phone ?? null, startWeek: g.startWeek ?? null })) });
    const sau = scl.duLieuSuaCaLop(P.mbManager, L).rows.slice(0, 2);
    assert(JSON.stringify(sau.map((g: any) => [g.phone, g.startWeek])) === JSON.stringify(goc.map((g: any) => [g.phone, g.startWeek])), 'hồ sơ về');
    assert(tuanBai(L) === bai0, 'lịch về như cũ');
  }));

  check('R2-C5 · Thêm HV rồi Hoàn tác (id lô) → cả lô vào Thùng rác; người ngoài lớp 403; quá 15 phút 409; lần hai không xoá trùng', () => thu(() => {
    const L = lop('MB FT 101');
    const r = intake.commitIntake(P.mbManager, { classId: L, rows: ['R2 An', 'R2 Binh'].map((ten) => ({ fullName: ten, email: emailThu(), dob: '2010-01-01', target: 6.5 })) });
    assert(r.added === 2 && r.nhap, JSON.stringify(r));
    assert(ma(() => intake.hoanTacNhap(P.cpManager, r.nhap)) === 403, 'QL chi nhánh khác 403');
    const luc = one('SELECT created_at FROM audit_logs WHERE id = ?', r.nhap).created_at;
    assert(ma(() => intake.hoanTacNhap(P.mbManager, r.nhap, new Date(Date.parse(luc) + 16 * 60_000).toISOString())) === 409, 'quá 15 phút');
    const k = intake.hoanTacNhap(P.mbManager, r.nhap);
    assert(k.ok.length === 2 && k.thungRac.length === 2 && !k.failed.length, JSON.stringify(k));
    assert(one('SELECT COUNT(*) n FROM students WHERE id IN (?, ?)', ...r.studentIds).n === 0, 'đã xoá mềm');
    assert(one(`SELECT COUNT(*) n FROM thung_rac WHERE id IN (?, ?)`, ...k.thungRac).n === 2, 'có trong Thùng rác');
    assert(intake.hoanTacNhap(P.mbManager, r.nhap).ok.length === 0, 'lần hai không xoá gì');
  }));
}
