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
  const { loadPrincipal } = await import('../permissions.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const tutors: any = await import('../tutors/trang.ts');
  const rac: any = await import('../platform/khoiPhucRac.ts');
  const mgmt: any = await import('../worklist/mgmttasks.ts');
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

  /* ---------------------------------------------------------------- PR2: tutor · việc · Case */
  const BO2 = new Set([...BO, 'thung_rac']);
  const bang2 = all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).map((r) => r.name as string).filter((b) => !BO2.has(b));
  const chup2 = () => new Map(bang2.map((b) => [b, JSON.stringify(all(`SELECT rowid AS __r, * FROM "${b}" ORDER BY rowid`))]));
  const khac2 = (a: Map<string, string>, b: Map<string, string>) => bang2.filter((x) => a.get(x) !== b.get(x));

  check('R2-C3a · Xoá tutor → Thùng rác; Khôi phục: tutor + nhận xét về y như trước; sai vai 403', () => thu(() => {
    const id = Number(conn.prepare(`INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at) VALUES ('Tutor R2', '0911222333', ?, 0, '["listening"]', '2026-01-01T00:00:00.000Z')`)
      .run(one('SELECT id FROM branches ORDER BY id LIMIT 1').id).lastInsertRowid);
    tutors.ghiNhanXet(P.admin, id, { ketLuan: 'on', noiDung: 'Dạy đều, em tiến bộ.' });
    const truoc = chup2();
    const r = tutors.xoaTutor(P.admin, id);
    assert(r.thungRacId && one('SELECT COUNT(*) n FROM tutors WHERE id = ?', id).n === 0 && one('SELECT COUNT(*) n FROM tutor_nhan_xet WHERE tutor_id = ?', id).n === 0, 'đã xoá mềm');
    assert(ma(() => rac.khoiPhucRac(P.lrTeacher, r.thungRacId)) === 403, 'GV không khôi phục');
    xoaNho();
    rac.khoiPhucRac(P.admin, r.thungRacId);
    const d = khac2(truoc, chup2());
    assert(!d.length, `còn khác sau khôi phục: ${d.join(', ')}`);
    assert(ma(() => rac.khoiPhucRac(P.admin, r.thungRacId)) === 409, 'lần hai 409');
  }));

  check('R2-C3b · Xoá nhận xét tutor (≤ 24 giờ) → Thùng rác, Khôi phục trả nguyên; quá 24 giờ vẫn 400; chỉ người ghi', () => thu(() => {
    const tutor = one('SELECT id FROM tutors LIMIT 1');
    const { id } = tutors.ghiNhanXet(P.admin, tutor.id, { ketLuan: 'can_cai_thien', noiDung: 'Cần chuẩn bị bài kỹ hơn.' });
    const truoc = chup2();
    const r = tutors.xoaNhanXet(P.admin, id);
    assert(r.thungRacId && one('SELECT COUNT(*) n FROM tutor_nhan_xet WHERE id = ?', id).n === 0, 'đã xoá mềm');
    xoaNho();
    rac.khoiPhucRac(P.admin, r.thungRacId);
    assert(!khac2(truoc, chup2()).length, `còn khác: ${khac2(truoc, chup2()).join(', ')}`);
    const cu = Number(conn.prepare(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?, 'on', 'Cũ quá 24 giờ.', ?, '2026-01-01T00:00:00.000Z')`).run(tutor.id, P.admin.userId).lastInsertRowid);
    assert(ma(() => tutors.xoaNhanXet(P.admin, cu)) === 400, 'quá 24 giờ vẫn chặn');
  }));

  check('R2-C9 · Head chi nhánh nơi dạy sửa nhận xét tutor của NGƯỜI KHÁC (có nhật ký trước → sau); Head chi nhánh khác 403; xoá vẫn chỉ người ghi', () => thu(() => {
    const cn = one('SELECT branch_id b FROM classes WHERE id = ?', lop('MB FT 101')).b as number;
    const id = Number(conn.prepare(`INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at) VALUES ('Tutor C9', '0911000999', ?, 0, '["listening"]', '2026-01-01T00:00:00.000Z')`).run(cn).lastInsertRowid);
    const { id: nx } = tutors.ghiNhanXet(P.admin, id, { ketLuan: 'on', noiDung: 'Người ghi đã nghỉ việc.' });
    tutors.suaNhanXet(P.mbManager, nx, { ketLuan: 'can_cai_thien', noiDung: 'Head sửa hộ người ghi.' });
    assert(one('SELECT noi_dung FROM tutor_nhan_xet WHERE id = ?', nx).noi_dung === 'Head sửa hộ người ghi.', 'Head sửa được');
    assert(/Người ghi đã nghỉ/.test(one(`SELECT before_json FROM audit_logs WHERE action = 'tutor.nhan_xet_sua' AND entity_id = ? ORDER BY id DESC LIMIT 1`, nx).before_json), 'nhật ký trước → sau');
    assert(ma(() => tutors.suaNhanXet(P.cpManager, nx, { ketLuan: 'on', noiDung: 'Chi nhánh khác sửa.' })) === 403, 'Head chi nhánh khác 403');
    assert(ma(() => tutors.xoaNhanXet(P.mbManager, nx)) === 403, 'xoá vẫn chỉ người ghi');
  }));

  check('R2-C8 · Xoá việc vận hành chưa có cập nhật → Thùng rác, Khôi phục về y như trước; đã có cập nhật → 400; người ngoài 403', () => thu(() => {
    const truoc = chup2();
    const v = mgmt.createMgmtTask(P.mbManager, { title: 'Giao nhầm việc R2', group: 'teacher', assigneeUserId: P.lrTeacher.userId, due: '2099-01-01' });
    const them = chup2();
    assert(khac2(truoc, them).includes('tasks'), 'tiền đề: việc đã tạo');
    assert(ma(() => mgmt.xoaViec(P.cpManager, v.id)) === 403, 'Head chi nhánh khác 403');
    const r = mgmt.xoaViec(P.mbManager, v.id);
    assert(r.thungRacId && one('SELECT COUNT(*) n FROM tasks WHERE id = ?', v.id).n === 0, 'đã xoá mềm');
    xoaNho();
    rac.khoiPhucRac(P.mbManager, r.thungRacId);
    const d = khac2(them, chup2());
    assert(!d.length, `còn khác sau khôi phục: ${d.join(', ')}`);
    mgmt.updateMgmtTask(P.lrTeacher, v.id, { progress: 'doing', note: 'Đã bắt đầu' });
    assert(ma(() => mgmt.xoaViec(P.mbManager, v.id)) === 400, 'đã có cập nhật → 400');
  }));

  check('R2-C5b (PTA rà #2026) · người khác chỉ có quyền THÊM HV (GVCN) không bỏ được lô của Head; chính GVCN bỏ được lô mình; em đã có dữ liệu → `failed`, không xoá', () => thu(() => {
    const L = lop('MB FT 101');
    const gv = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, L);
    assert(gv, 'tiền đề: lớp có GVCN');
    const GV = loadPrincipal(gv.user_id);
    const them = (p: any, ten: string) => intake.commitIntake(p, { classId: L, rows: [{ fullName: ten, email: emailThu(), dob: '2010-01-01', target: 6.5 }] });
    const rHead = them(P.mbManager, 'R2 Head them');
    assert(ma(() => intake.hoanTacNhap(GV, rHead.nhap)) === 403, 'GVCN không bỏ được lô của Head');
    assert(one('SELECT COUNT(*) n FROM students WHERE id = ?', rHead.studentIds[0]).n === 1, '403 mà DB đổi');
    const rGv = them(GV, 'R2 GVCN them');
    assert(rGv.added === 1, 'tiền đề: GVCN thêm được');
    const k = intake.hoanTacNhap(GV, rGv.nhap);
    assert(k.ok.length === 1 && !k.failed.length, `chính người thêm: ${JSON.stringify(k)}`);
    const rDl = them(P.mbManager, 'R2 Co du lieu');
    conn.prepare(`INSERT INTO violations (student_id, category, occurred_on, reported_on, reported_by, description, created_at) VALUES (?, 'conduct', ?, ?, ?, 'Thử', ?)`).run(rDl.studentIds[0], '2026-11-01', '2026-11-01', P.mbManager.userId, '2026-11-01T00:00:00.000Z');
    const k2 = intake.hoanTacNhap(P.mbManager, rDl.nhap);
    assert(k2.ok.length === 0 && k2.failed.length === 1 && /đã có dữ liệu/.test(k2.failed[0].message), JSON.stringify(k2));
    assert(one('SELECT COUNT(*) n FROM students WHERE id = ?', rDl.studentIds[0]).n === 1, 'em có dữ liệu còn nguyên');
  }));
}
