/**
 * PHÉP KIỂM P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md`): thang Cambridge (A2 Key 100–150, B1 Preliminary 120–170),
 * Target + kết quả thi thật KET / PET theo điểm Cambridge. MON-CT-1311 (chủ SP 13/11): mặc định lại L+S · R+W; phần "tách môn" giờ đi qua đường
 * Quản trị đổi môn (`apDoiMon`) — các phép kiểm lượt cũ / phân công / huỷ dựng dữ liệu gộp rồi đổi PET sang 4 môn (`tachMon`).
 */
export async function runPrKetPetTests(t: any) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  /* TAT-CHECKPOINT: tệp này kiểm Checkpoint TỰ SINH (công tắc bật = như cũ) — bật suốt tệp, trả về tắt ở cuối. */
  d.CONG_TAC_CP.tuSinh = true;
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const week: any = await import('../platform/week.ts');
  const perm: any = await import('../permissions.ts');
  const mig: any = await import('../migrate/prKetPet.ts');
  const doiMonCt: any = await import('../platform/doiMonCt.ts');
  const migMc: any = await import('../migrate/prMonCt1311.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const profile: any = await import('../students/profile.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const luat: any = await import('../classes/luatLoTrinh.ts');
  const schedSvc: any = await import('../fasttrack/skillSchedule.ts');
  const scoreDebt: any = await import('../worklist/scoreDebt.ts');
  const ptLop: any = await import('../classes/phanTichLop.ts');
  const tongKet: any = await import('../loTrinh/tongKet.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e; } return null; };
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const khaiGiang = addDays(week.mondayOf(TODAY), -35);   // tuần học 6 = tuần này → Checkpoint 1 nhập được ngay
  const gvPet = (k: string) => one(`SELECT t.user_id FROM teacher_assignments t JOIN classes c ON c.id = t.class_id WHERE c.code = 'MB PET 01' AND t.skill = ? AND t.status = 'active'`, k).user_id as number;
  const GV_LS = gvPet('listening_speaking'); const GV_RW = gvPet('reading_writing');
  const datMon = (ma: string, mon: string[]) => {
    conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(ma);
    mon.forEach((k, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(ma, k, i));
    xoaNho();
  };
  const monCt = (ma: string) => all('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq', ma).map((r) => r.skill).join();
  const monLuot = (id: number) => all('SELECT skill FROM attempt_skills WHERE attempt_id = ? ORDER BY skill', id).map((r) => r.skill).join();
  const them = (lop: number, ten: string) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, startWeek: khaiGiang, email: emailThu(), dob: '2012-01-01' }] });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  const cps = (sid: number) => all(`SELECT id, attempt_no AS so FROM assessment_attempts WHERE student_id = ? AND kind = 'checkpoint' AND status != 'cancelled' ORDER BY attempt_no`, sid);
  const nhap = (id: number, diem: Record<string, [number, number]>) => {
    for (const [k, [sc, tg]] of Object.entries(diem)) regular.saveRegularScore(P.admin, id, k, { score: sc, total: tg }, TODAY);
    xoaNho();
  };
  /** Dữ liệu CŨ (trước P13): PET môn gộp, lớp đang chạy, GV L+S / R+W; CP1: em A đủ hai môn gộp (→ đã sinh CP2 chưa nhập), em C chỉ L+S,
   *  em B chưa ghi gì (có đề nghị dời lịch môn L+S); CP2 của A chưa nhập. */
  const dungCu = () => {
    datMon('PET', ['listening_speaking', 'reading_writing']);
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'PET', so: '09', startPeriodId: week.ensurePeriod(khaiGiang).id,
      slots: [{ skill: 'listening_speaking', userId: GV_LS, isCore: false }, { skill: 'reading_writing', userId: GV_RW, isCore: false }] }) as { id: number; code: string };
    const a = them(lop.id, 'KP2 Em A'); const b = them(lop.id, 'KP2 Em B'); const c = them(lop.id, 'KP2 Em C');
    nhap(cps(a)[0].id, { listening_speaking: [48, 60], reading_writing: [61, 80] });
    nhap(cps(c)[0].id, { listening_speaking: [40, 60] });
    const cp1b = cps(b)[0].id;
    const tuan = one('SELECT planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND skill = ?', cp1b, 'listening_speaking').p;
    conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, idempotency_key, created_at)
      VALUES (?, 'listening_speaking', 1, ?, ?, ?, ?, 'pending', 'kp2-doi', ?)`).run(cp1b, tuan, tuan, TODAY, TODAY, TODAY);
    regular.sinhCheckpointKeTiep([lop.id], addDays(TODAY, 7));
    xoaNho();
    return { lop, a, b, c };
  };
  /** Migrate P13 bước 3–4 (KCK / Target Cambridge — chạy mỗi lần). */
  const chayMig = (applied: string[]) => mig.migratePrKetPet(conn, applied);
  /** MON-CT-1311: Quản trị đổi PET sang L · R · W · S (đường `apDoiMon` — lượt đã ghi giữ bộ gộp, chưa ghi đổi; phân công môn tách nhận GV môn gộp). */
  const BON = ['listening', 'reading', 'writing', 'speaking'];
  const tachMon = () => { const kq = doiMonCt.apDoiMon(conn, P.admin, 'PET', BON, TODAY); xoaNho(); return kq; };
  const chup = (lop: number) => JSON.stringify([
    all('SELECT programme_code, skill, seq FROM programme_skills ORDER BY 1, 2'),
    all('SELECT class_id, skill, sessions_per_week FROM class_skills WHERE class_id = ? ORDER BY skill', lop),
    all(`SELECT user_id, skill, is_core, status FROM teacher_assignments WHERE class_id = ? ORDER BY user_id, skill`, lop),
    all(`SELECT k.attempt_id, k.skill, k.planned_period_id, k.required FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id WHERE a.class_id = ? ORDER BY 1, 2`, lop),
    all(`SELECT s.attempt_id, s.skill, s.raw_score, s.raw_total FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id WHERE a.class_id = ? ORDER BY 1, 2`, lop),
  ]);
  console.log('\nP13 KET-PET — thang Cambridge + đổi môn gộp ↔ tách (MON-CT-1311)');

  check('KP-1 · kyThi: thang, kiểm điểm, Overall, Grade + CEFR (Cambridge)', () => {
    const KET = d.kyThiCuaChuongTrinh('KET'); const PET = d.kyThiCuaChuongTrinh('PET');
    assert(KET.min === 100 && KET.max === 150 && PET.min === 120 && PET.max === 170, 'thang');
    assert(d.kyThiCuaChuongTrinh('FOU') === null && d.kyThiCuaChuongTrinh(null) === null && d.kyThiCuaChuongTrinh('FT') === null, 'không kỳ thi');
    assert(d.kiemDiemKyThi(KET, 99) && d.kiemDiemKyThi(KET, 151) && d.kiemDiemKyThi(KET, 120.5) && d.kiemDiemKyThi(KET, NaN), 'ngoài thang / số lẻ → lỗi');
    assert(d.kiemDiemKyThi(KET, 99) === 'A2 Key: 100–150', d.kiemDiemKyThi(KET, 99));
    assert(d.kiemDiemKyThi(KET, 150) === null && d.kiemDiemKyThi(KET, 100) === null, 'trong thang → null');
    assert(d.tongKyThi(KET, { l: 140, r: 133, w: 133, s: 150 }) === 139, 'Overall KET');
    assert(d.tongKyThi(PET, { l: 170, r: 160, w: 155, s: 150 }) === 159, 'Overall PET làm tròn 158.75 → 159');
    assert(d.tongKyThi(PET, { l: 170, r: null, w: 155, s: 150 }) === null, 'thiếu môn → null');
    assert(d.gradeKyThi(PET, 160) === 'A' && d.gradeKyThi(PET, 159) === 'B' && d.gradeKyThi(PET, 140) === 'C' && d.gradeKyThi(PET, 139) === null, 'Grade PET');
    assert(d.gradeKyThi(KET, 140) === 'A' && d.gradeKyThi(KET, 133) === 'B' && d.gradeKyThi(KET, 120) === 'C' && d.gradeKyThi(KET, 119) === null, 'Grade KET');
    assert(d.cefrKyThi(PET, 160) === 'B2' && d.cefrKyThi(PET, 159) === 'B1' && d.cefrKyThi(PET, 139) === 'A2' && d.cefrKyThi(PET, 120) === 'A2', 'CEFR PET');
    assert(d.cefrKyThi(KET, 140) === 'B1' && d.cefrKyThi(KET, 120) === 'A2' && d.cefrKyThi(KET, 100) === 'A1', 'CEFR KET');
  });

  check('KP-2a · đổi PET gộp → 4 môn: lượt đã ghi (điểm / đề nghị dời lịch) giữ L+S / R+W (điểm nguyên vẹn), lượt chưa ghi → 4 môn; phân công gộp GIỮ + môn tách nhận GV môn gộp; GV gộp vẫn nhập ô gộp còn trống', () => thu(() => {
    const { lop, a, b, c } = dungCu();
    const [cp1a, cp2a] = cps(a); const [cp1b] = cps(b); const [cp1c] = cps(c);
    assert(cp2a?.so === 2 && monLuot(cp2a.id) === 'listening_speaking,reading_writing', `dữ liệu cũ: CP2 ${JSON.stringify(cps(a))}`);
    const diemTruoc = JSON.stringify(all('SELECT attempt_id, skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id IN (?, ?) ORDER BY 1, 2', cp1a.id, cp1c.id));
    const kq = tachMon();
    assert(monCt('PET') === 'listening,reading,writing,speaking', monCt('PET'));
    assert(kq.luotGiu >= 3 && kq.luotDoi >= 1 && kq.lopChonLaiGv === 0, `kế hoạch: ${JSON.stringify(kq)}`);
    assert(JSON.stringify(all('SELECT attempt_id, skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id IN (?, ?) ORDER BY 1, 2', cp1a.id, cp1c.id)) === diemTruoc, 'điểm đổi');
    assert(monLuot(cp1a.id) === 'listening_speaking,reading_writing' && monLuot(cp1c.id) === 'listening_speaking,reading_writing', 'lượt đã ghi môn gộp phải giữ');
    assert(monLuot(cp1b.id) === 'listening_speaking,reading_writing', `lượt có đề nghị dời lịch phải giữ: ${monLuot(cp1b.id)}`);
    assert(monLuot(cp2a.id) === 'listening,reading,speaking,writing', `lượt chưa ghi: ${monLuot(cp2a.id)}`);
    /* Một luật bộ môn theo lượt (`boMonCuaLuot`, bản chụp `bo_mon`). */
    assert(schedSvc.boMonCuaLuot(conn, cp1c.id).join() === 'listening_speaking,reading_writing' && schedSvc.boMonCuaLuot(conn, cp2a.id).join() === 'listening,reading,writing,speaking', 'boMonCuaLuot');
    const s1 = regular.regularSheet(P.admin, lop.id, 'checkpoint:1', TODAY);
    const dong = (sid: number) => s1.rows.find((r: any) => r.studentId === sid);
    assert(dong(a).result.complete && dong(a).chip?.chu === 'Đạt' && dong(a).skillSchedule.map((x: any) => x.skill).join() === 'listening_speaking,reading_writing', JSON.stringify(dong(a).chip));
    assert(dong(b).skillSchedule.map((x: any) => x.skill).join() === 'listening_speaking,reading_writing', `dòng em B: ${dong(b).skillSchedule.map((x: any) => x.skill)}`);
    assert(s1.monNgan.listening_speaking === 'L+S', JSON.stringify(s1.monNgan));
    assert(regular.regularResultOf(cp1a.id).complete && !regular.regularResultOf(cp1c.id).complete, 'kết quả theo bộ môn của lượt');
    assert(all('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill', lop.id).map((r) => r.skill).join() === 'listening,reading,speaking,writing', 'class_skills');
    const pc = (u: number) => all(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL ORDER BY skill`, lop.id, u).map((r) => r.skill).join();
    assert(pc(GV_LS) === 'listening,listening_speaking,speaking' && pc(GV_RW) === 'reading,reading_writing,writing', `phân công: ${pc(GV_LS)} / ${pc(GV_RW)}`);
    /* Người phụ trách ô gộp cũ (Công việc `ownerOf`, Nợ điểm, Lịch Test) + Phân tích GV tìm được GV. */
    const chu = scoreDebt.phanCongDangHieuLuc([lop.id], TODAY);
    assert(chu.get(`${lop.id}|reading_writing`)?.userId === GV_RW && chu.get(`${lop.id}|reading`)?.userId === GV_RW, 'người phụ trách R+W cũ / R');
    const gvRw = perm.loadPrincipal(GV_RW);
    regular.saveRegularScore(gvRw, cp1c.id, 'reading_writing', { score: 50, total: 80 }, TODAY);   // ô gộp còn trống: GV R+W nhập như cũ
    assert(perm.scoreEditPath(gvRw, lop.id, 'reading') === 'assigned' && perm.scoreEditPath(gvRw, lop.id, 'listening') === null, 'quyền GV R+W');
  }));

  check('KP-2f · đổi môn: lượt có đề nghị dời lịch đang chờ = đã có lịch → giữ bộ gộp, đề nghị không đổi; bỏ đề nghị → lượt đổi 4 môn (dòng lịch chép tuần môn gộp)', () => thu(() => {
    const { b } = dungCu();
    const cp1b = cps(b)[0].id;
    const tuanGop = one(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening_speaking'`, cp1b).p;
    const truoc = JSON.stringify(all('SELECT * FROM skill_move_requests WHERE attempt_id = ? ORDER BY id', cp1b));
    tachMon();
    assert(JSON.stringify(all('SELECT * FROM skill_move_requests WHERE attempt_id = ? ORDER BY id', cp1b)) === truoc, 'đề nghị dời lịch bị đổi');
    assert(monLuot(cp1b) === 'listening_speaking,reading_writing', `lượt có đề nghị phải giữ: ${monLuot(cp1b)}`);
    /* Lượt chưa ghi (không đề nghị): dòng lịch L, S chép từ L+S (cùng tuần). */
    conn.prepare('UPDATE assessment_attempts SET bo_mon = NULL WHERE id = ?').run(cp1b);
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(cp1b);
    datMon('PET', ['listening_speaking', 'reading_writing']);
    tachMon();
    assert(monLuot(cp1b) === 'listening,reading,speaking,writing', `lượt chưa ghi: ${monLuot(cp1b)}`);
    assert(all(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill IN ('listening', 'speaking')`, cp1b).every((r) => r.p === tuanGop), 'tuần môn tách lệch môn gộp');
  }));

  check('KP-2g · Phân tích lớp: lượt đã ghi môn gộp cũ hiện dòng L+S / R+W (theo bộ môn của lượt)', () => thu(() => {
    const { lop } = dungCu();
    tachMon();
    const kq = ptLop.phanTichLop(P.mbManager, lop.id);
    const keys = kq.dong.map((x: any) => x.key);
    assert(keys.includes('listening_speaking') && keys.includes('reading_writing') && keys.includes('listening'), `dòng: ${keys}`);
    assert(kq.o['listening_speaking|checkpoint:1']?.tong === 2 && kq.o['reading_writing|checkpoint:1']?.tong === 1, JSON.stringify(kq.o));
  }));

  check('KP-2b · đổi môn lần hai cùng bộ: không làm gì (null), bảng giống hệt', () => thu(() => {
    const { lop } = dungCu();
    tachMon();
    const truoc = chup(lop.id);
    const kq = tachMon();
    assert(kq === null && chup(lop.id) === truoc, `lần hai: ${JSON.stringify(kq)}`);
  }));

  check('KP-2c · Quản trị đã sửa môn KET khác bộ 4 môn P13 → migrate MON-CT-1311 không đụng; còn đúng 4 môn → L+S, R+W', () => thu(() => {
    datMon('KET', ['listening_speaking', 'reading', 'writing']);
    datMon('PET', BON);
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(migMc.KHOA_PR_MON_CT_1311);
    const applied: string[] = [];
    migMc.migratePrMonCt1311(conn, applied); xoaNho();
    assert(monCt('KET') === 'listening_speaking,reading,writing' && !applied.some((x) => /KET/.test(x)), `${monCt('KET')} · ${applied.join(' | ')}`);
    assert(monCt('PET') === 'listening_speaking,reading_writing' && applied.some((x) => /PET/.test(x)), `${monCt('PET')} · ${applied.join(' | ')}`);
  }));

  check('KP-2d · lớp PET mới (MON-CT-1311): Checkpoint L+S · R+W, đạt từ 70 % mỗi môn, SOS theo môn; Case PET / KET = L+S · R+W', () => thu(() => {
    assert(monCt('PET') === 'listening_speaking,reading_writing' && monCt('KET') === 'listening_speaking,reading_writing', `seed: ${monCt('PET')} / ${monCt('KET')}`);
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'PET', so: '08', startPeriodId: week.ensurePeriod(khaiGiang).id }) as { id: number };
    const a = them(lop.id, 'KP2d Em');
    const cp = cps(a)[0];
    assert(monLuot(cp.id) === 'listening_speaking,reading_writing', monLuot(cp.id));
    nhap(cp.id, { listening_speaking: [42, 60], reading_writing: [54, 80] });   // 70 % · 67.5 %
    const r = regular.regularResultOf(cp.id);
    const kq = Object.fromEntries(r.skills.map((x: any) => [x.skill, x.outcome]));
    assert(kq.listening_speaking === 'pass' && kq.reading_writing === 'fail' && r.sosLevel === 1, JSON.stringify(kq));
    for (const ct of ['PET', 'KET']) assert(d.caseTopicsFor(true, ct).join() === 'listening_speaking,reading_writing', `${ct}: ${d.caseTopicsFor(true, ct)}`);
  }));

  check('KP-3 · Target KET / PET theo điểm Cambridge: số nguyên trong thang, lỗi gắn ô target; liên tục không kỳ thi 400 như cũ; FT band như cũ; thêm em có Target', () => thu(() => {
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'KET', so: '07', startPeriodId: week.ensurePeriod(khaiGiang).id }) as { id: number };
    const r = intake.commitIntake(P.admin, { classId: lop.id, rows: [
      { fullName: 'KP3 Có Target', target: '130', startWeek: khaiGiang, email: emailThu(), dob: '2012-01-01' },
    ] });
    assert(r.added === 1, `thêm em KET có Target: ${JSON.stringify(r.failed)}`);
    const cy = one(`SELECT id, target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`, r.studentIds[0]);
    assert(cy.target_score === 130, `Target lúc thêm em: ${cy.target_score}`);
    cycles.reviseTarget(P.mbManager, cy.id, { newTarget: 135, reason: 'Thi thử tốt' });
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', cy.id).target_score === 135, 'Target 135 không lưu');
    for (const v of [99, 151, 120.5, 'abc', '135 KCK', 'KCK']) {
      const e = loi(() => cycles.reviseTarget(P.mbManager, cy.id, { newTarget: v, reason: 'thử' }));
      assert(e?.status === 400 && e.message === 'A2 Key: 100–150' && e.details?.o === 'target', `${v}: ${e?.status} ${e?.message} ${JSON.stringify(e?.details)}`);
    }
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', cy.id).target_score === 135, 'lỗi mà vẫn ghi');
    cycles.reviseTarget(P.mbManager, cy.id, { newTarget: '', reason: 'Bỏ cam kết' });
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', cy.id).target_score === null, 'Target trống không lưu');
    /* Đề xuất sửa (GV) cùng thang. */
    const dx: any = deXuat;
    assert(dx.kiemGiaTriDeXuat(conn, r.studentIds[0], 'target', '140').moi === 140, 'đề xuất 140');
    const e3 = loi(() => dx.kiemGiaTriDeXuat(conn, r.studentIds[0], 'target', '6.5'));
    assert(e3?.status === 400 && e3.message === 'A2 Key: 100–150' && e3.details?.o === 'target', `đề xuất 6.5: ${e3?.message}`);
    /* Chương trình liên tục KHÔNG có kỳ thi (Quản trị tạo) → như cũ. */
    conn.prepare(`INSERT INTO programmes (code, name, weeks, scoring_mode, nguong_dat, lap_moi_tuan, status, created_at) VALUES ('KPX', 'Thử', NULL, 'ratio', 0.7, 6, 'active', ?)`).run(TODAY);
    conn.prepare(`UPDATE learning_cycles SET programme_code = 'KPX' WHERE id = ?`).run(cy.id); xoaNho();
    const e2 = loi(() => cycles.reviseTarget(P.mbManager, cy.id, { newTarget: 6, reason: 'thử' }));
    assert(e2?.status === 400 && e2.message === 'Chương trình liên tục không có Target.', `liên tục không kỳ thi: ${e2?.status} ${e2?.message}`);
    /* FT: band như cũ. */
    const ft = one(`SELECT c.id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id JOIN classes k ON k.id = e.class_id
      WHERE c.route IS NOT NULL AND c.status = 'active' AND k.code = 'MB FT 101' AND e.status = 'active' LIMIT 1`).id;
    cycles.reviseTarget(P.mbManager, ft, { newTarget: 6.5, reason: 'thử' });
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', ft).target_score === 6.5, 'FT 6.5');
    assert(loi(() => cycles.reviseTarget(P.mbManager, ft, { newTarget: 135, reason: 'thử' }))?.status === 400, 'FT nhận 135');
  }));

  check('KP-3b · thêm em KET: Target ngoài thang / KCK → lỗi tại ô target, không thêm', () => thu(() => {
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'KET', so: '06', startPeriodId: week.ensurePeriod(khaiGiang).id }) as { id: number };
    const r = intake.commitIntake(P.admin, { classId: lop.id, rows: [{ fullName: 'KP3b Sai', target: '6.5', startWeek: khaiGiang, email: emailThu(), dob: '2012-01-01' }] });
    assert(r.added === 0 && JSON.stringify(r.failed).includes('A2 Key: 100–150'), JSON.stringify(r));
  }));

  /* Em PET của demo (MB PET 01) + lộ trình đang chạy. */
  const emPet = () => one(`SELECT cy.id, cy.student_id FROM learning_cycles cy JOIN enrollments e ON e.student_id = cy.student_id JOIN classes k ON k.id = e.class_id
    WHERE k.code = 'MB PET 01' AND cy.status = 'active' AND e.status = 'active' ORDER BY cy.student_id LIMIT 1`);
  const ngayThi = addDays(TODAY, -2);
  const PET_KQ = { ngayThi, r: 160, w: 155, l: 170, s: 150 };

  check('KP-4a · KQ thi thật PET: lưu 4 điểm + thi_that_target; Overall 159 · Grade B · B1 ở hồ sơ; Không thi xoá điểm; ngày sau hôm nay 400', () => thu(() => {
    const c = emPet();
    cycles.reviseTarget(P.mbManager, c.id, { newTarget: 150, reason: 'Target PET' });
    thiThat.datKetQuaThiThat(P.mbManager, c.id, PET_KQ);
    const cy = one('SELECT * FROM learning_cycles WHERE id = ?', c.id);
    assert(cy.thi_that_l === 170 && cy.thi_that_r === 160 && cy.thi_that_w === 155 && cy.thi_that_s === 150 && cy.thi_that_ngay === ngayThi, JSON.stringify(cy));
    assert(cy.thi_that_target === 150 && cy.thi_that_nhap_boi === P.mbManager.userId, `thi_that_target ${cy.thi_that_target}`);
    assert(cy.outcome == null && cy.outcome_score == null, `không lưu kết luận / Overall band: ${cy.outcome} ${cy.outcome_score}`);
    xoaNho();
    const tt = profile.studentProfile(P.mbManager, c.student_id).dauHoSo.thongTin;
    assert(tt.kyThi?.ten === 'B1 Preliminary' && tt.target === 150, JSON.stringify(tt));
    assert(tt.thiThat?.tong === 159 && tt.thiThat.grade === 'B' && tt.thiThat.cefr === 'B1' && tt.thiThat.dat === true, JSON.stringify(tt.thiThat));
    assert(d.chuKetQuaKyThi(tt.thiThat) === '159 · Grade B · B1', d.chuKetQuaKyThi(tt.thiThat));
    assert(all(`SELECT 1 FROM audit_logs WHERE action = 'cycle.thi_that' AND entity_id = ?`, c.id).length === 1, 'nhật ký');
    thiThat.datKetQuaThiThat(P.mbManager, c.id, { khongThi: true });
    const k2 = one('SELECT * FROM learning_cycles WHERE id = ?', c.id);
    assert(k2.thi_that_khong_thi === 1 && k2.thi_that_l === null && k2.thi_that_s === null, 'Không thi phải xoá điểm');
    const e = loi(() => thiThat.datKetQuaThiThat(P.mbManager, c.id, { ...PET_KQ, ngayThi: addDays(TODAY, 1), khongThi: false }));
    assert(e?.status === 400, `ngày sau hôm nay: ${e?.status}`);
  }));

  check('KP-4b · KQ thi thật PET ngoài thang / số lẻ / chữ → 400 đúng ô, không ghi; FT band như cũ', () => thu(() => {
    const c = emPet();
    for (const [k, v] of [['r', 119], ['w', 171], ['l', 160.5], ['s', 'abc']] as const) {
      const e = loi(() => thiThat.datKetQuaThiThat(P.mbManager, c.id, { ...PET_KQ, [k]: v }));
      assert(e?.status === 400 && e.details?.o === k && e.message.includes('B1 Preliminary: 120–170'), `${k}=${v}: ${e?.status} ${e?.message} ${JSON.stringify(e?.details)}`);
    }
    assert(one('SELECT thi_that_l FROM learning_cycles WHERE id = ?', c.id).thi_that_l === null, 'lỗi mà vẫn ghi');
    const ft = one(`SELECT c.id, c.started_at FROM learning_cycles c WHERE c.route IS NOT NULL AND c.status = 'active' AND c.started_at <= ? ORDER BY c.id LIMIT 1`, ngayThi);
    thiThat.datKetQuaThiThat(P.admin, ft.id, { ngayThi, l: 6.5, r: 7, w: 6, s: 6.5 });
    assert(one('SELECT outcome_score FROM learning_cycles WHERE id = ?', ft.id).outcome_score === 6.5, 'FT OVR');
    assert(loi(() => thiThat.datKetQuaThiThat(P.admin, ft.id, { l: 160 }))?.status === 400, 'FT nhận 160');
  }));

  check('KP-4c · sau khi nhập KQ PET: Kết quả thi, Phân tích GV, Báo cáo MT, việc chờ KQ, Bước tiếp KHÔNG đổi (không trộn thang)', () => thu(() => {
    const c = emPet();
    const tu = d.mondayOfDate(addDays(ngayThi, -28)); const den = d.mondayOfDate(addDays(ngayThi, 28));
    const so = () => {
      xoaNho();
      return JSON.stringify([
        kqt.ketQuaThiThatKq(P.admin, { branchId: MB, tu, den: addDays(den, 6) }), kqt.ketQuaThiThatKq(P.admin, { branchId: null, tu, den: addDays(den, 6) }),
        pt.phanTichGiaoVien(P.admin, { cn: MB, ct: 'thuong', tu, den }), pt.phanTichGiaoVien(P.admin, { cn: MB, ct: 'ft', tu, den }),
        bc.ketQuaMt(P.admin, { branchId: MB, ct: 'ft', tu, den }),
        thiThat.loTrinhChoKetQuaThi(TODAY), buocTiep.choBuocTiep(), thiThat.sauThiCuaEm(P.admin, c.student_id),
      ]);
    };
    const truoc = so();
    cycles.reviseTarget(P.mbManager, c.id, { newTarget: 150, reason: 'Target PET' });
    thiThat.datKetQuaThiThat(P.mbManager, c.id, PET_KQ);
    const sau = so();
    assert(sau === truoc, 'báo cáo đổi sau khi nhập KQ PET');
    assert(!sau.includes('"cycleId":' + c.id + ','), 'em PET lọt vào báo cáo');
  }));

  check('KP-3c · mở lộ trình mới: PET → PET giữ Target Cambridge; PET → FOU / FOU → PET không mang Target sang (khác thang); FOU → FOU giữ như cũ', () => thu(() => {
    const c = emPet();
    cycles.reviseTarget(P.mbManager, c.id, { newTarget: 150, reason: 'thử' });
    const cu = one('SELECT * FROM learning_cycles WHERE id = ?', c.id);
    const lopFou = one(`SELECT * FROM classes WHERE code = 'MB FOU 12'`); const lopPet = one(`SELECT * FROM classes WHERE code = 'MB PET 01'`);
    const loai = (l: any) => ({ ma: l.programme_code, ft: !!l.is_fast_track, lt: l.route });
    const mo = (tu: any, den: any, cy: any) => one('SELECT target_score FROM learning_cycles WHERE id = ?',
      luat.moLoTrinhMoi(P.admin, { sid: c.student_id, ngay: TODAY, toClass: den, tuLop: loai(tu), denLop: loai(den), cuCycle: cy }).moiId).target_score;
    assert(mo(lopPet, lopPet, cu) === 150, 'PET → PET phải giữ Target');
    assert(mo(lopPet, lopFou, cu) === null, 'PET → FOU mang Target Cambridge sang lớp band');
    assert(mo(lopFou, lopPet, { ...cu, target_score: 6.5 }) === null, 'FOU → PET mang band sang');
    assert(mo(lopFou, lopFou, { ...cu, target_score: 6.5 }) === 6.5, 'FOU → FOU phải giữ như cũ');
  }));

  check('KP-3d · chuyển lớp: FT (Target 6.5) → PET không mang band sang; PET (Target 150) → FT không điền sẵn 150 làm Target FT', () => thu(() => {
    const pet = one(`SELECT id FROM classes WHERE code = 'MB PET 01'`).id;
    const ft = one(`SELECT c.id, c.student_id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active' JOIN classes k ON k.id = e.class_id
      WHERE k.code = 'MB FT 101' AND c.status = 'active' AND c.route IS NOT NULL
        AND (SELECT COUNT(*) FROM learning_cycles x WHERE x.student_id = c.student_id AND x.status = 'active') = 1 ORDER BY c.id LIMIT 1`);
    cycles.reviseTarget(P.admin, ft.id, { newTarget: 6.5, reason: 'thử' });
    studentsSvc.transferStudent(P.admin, ft.student_id, pet, TODAY, 'Xếp lại trình độ', { noNote: false, note: 'sang PET' });
    const moi = one(`SELECT target_score, khong_cam_ket, programme_code FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1`, ft.student_id);
    assert(moi.programme_code === 'PET' && moi.target_score === null && !moi.khong_cam_ket, `FT → PET: ${JSON.stringify(moi)}`);
    const c = emPet();
    cycles.reviseTarget(P.admin, c.id, { newTarget: 150, reason: 'thử' });
    const lopFt = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id;
    const v = luat.xemChuyenLop(P.mbManager, c.student_id, lopFt);
    assert(v.targetSan == null, `PET → FT điền sẵn Target ${v.targetSan}`);
  }));

  check('KP-2e · đổi môn: GV đã có sẵn môn tách (L) cạnh L+S → không thành hai dòng L trùng; dòng L+S giữ (lượt cũ còn ô); thêm S', () => thu(() => {
    const { lop } = dungCu();
    const t0 = one(`SELECT * FROM teacher_assignments WHERE class_id = ? AND skill = 'listening_speaking' AND status = 'active'`, lop.id);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,?, 'active', ?)`)
      .run(t0.user_id, lop.id, 'listening', t0.effective_from, t0.created_at);
    tachMon();
    const ds = all(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL ORDER BY skill`, lop.id, t0.user_id).map((r) => r.skill);
    assert(ds.join() === 'listening,listening_speaking,speaking', `phân công sau migrate: ${ds}`);
  }));

  check('KP-4d · khoá KET / PET đã đóng: KQ thi thật hiện ở Các lộ trình + Tổng kết lộ trình; Đạt Target theo Target LÚC NHẬP (thi_that_target)', () => thu(() => {
    const c = emPet();
    cycles.reviseTarget(P.admin, c.id, { newTarget: 150, reason: 'thử' });
    thiThat.datKetQuaThiThat(P.mbManager, c.id, PET_KQ);   // Overall 159 ≥ 150 → Đạt
    cycles.reviseTarget(P.admin, c.id, { newTarget: 165, reason: 'đổi sau khi thi' });   // đổi sau: không đổi kết luận
    const lopFou = one(`SELECT id FROM classes WHERE code = 'MB FOU 12'`).id;
    studentsSvc.transferStudent(P.admin, c.student_id, lopFou, TODAY, 'Xếp lại trình độ', { noNote: false, note: 'sang FOU' });
    assert(one('SELECT status FROM learning_cycles WHERE id = ?', c.id).status !== 'active', 'khoá PET phải đóng');
    xoaNho();
    const dong = tongKet.cacLoTrinh(P.admin, c.student_id).find((x: any) => x.id === c.id);
    assert(dong?.ketQua?.chinh === 'Thi thật 159 · Grade B · B1' && dong.ketQua.phu === 'Đạt Target', `Các lộ trình: ${JSON.stringify(dong?.ketQua)}`);
    const tk = tongKet.tongKetLoTrinh(P.admin, c.id);
    assert(tk.kyThi?.ten === 'B1 Preliminary' && tk.thiThatKyThi?.tong === 159 && tk.thiThatKyThi.dat === true, `Tổng kết: ${JSON.stringify([tk.kyThi, tk.thiThatKyThi])}`);
  }));

  check('KP-3e · chuyển tiếp cả lớp (apDungCaLop): FOU → PET không chép Target band / mục tiêu band sang khoá PET; FOU → FOU giữ như cũ', () => thu(() => {
    const fou = one(`SELECT * FROM classes WHERE code = 'MB FOU 12'`); const pet = one(`SELECT * FROM classes WHERE code = 'MB PET 01'`);
    const em = all(`SELECT c.id, c.student_id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active'
      WHERE e.class_id = ? AND c.status = 'active' AND (SELECT COUNT(*) FROM learning_cycles x WHERE x.student_id = c.student_id AND x.status = 'active') = 1 ORDER BY c.id LIMIT 2`, fou.id);
    assert(em.length === 2, 'cần 2 em FOU');
    for (const e of em) conn.prepare('UPDATE learning_cycles SET target_score = 6.5, khong_cam_ket = 1 WHERE id = ?').run(e.id);
    xoaNho();
    luat.apDungCaLop(P.admin, { fromClass: { id: fou.id, code: fou.code }, ngay: TODAY, dongs: [
      { sid: em[0].student_id, huong: 'len_lop', toClassId: pet.id, mucTieu: 7, toClass: { ma: pet.programme_code, ft: false, branchId: pet.branch_id, code: pet.code } },
      { sid: em[1].student_id, huong: 'hoc_lai', toClassId: fou.id, toClass: { ma: fou.programme_code, ft: false, branchId: fou.branch_id, code: fou.code } },
    ] });
    const moi = (sid: number) => one('SELECT target_score, khong_cam_ket, programme_code FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
    const m0 = moi(em[0].student_id); const m1 = moi(em[1].student_id);
    assert(m0.programme_code === 'PET' && m0.target_score === null && m0.khong_cam_ket === 0, `FOU → PET: ${JSON.stringify(m0)}`);
    assert(m1.target_score === 6.5 && m1.khong_cam_ket === 1, `FOU → FOU: ${JSON.stringify(m1)}`);
  }));
  check('KP-2h · KCK: migrate bỏ dấu KCK của khoá KET / PET (Target giữ, ghi applied); Đề xuất sửa / đổi Target bỏ qua cờ KCK', () => thu(() => {
    const c = emPet();
    conn.prepare('UPDATE learning_cycles SET target_score = 140, khong_cam_ket = 1 WHERE id = ?').run(c.id); xoaNho();
    assert(deXuat.kiemGiaTriDeXuat(conn, c.student_id, 'target', '150').moi === 150, 'đề xuất bị chặn vì cờ KCK');
    const gvcn = perm.loadPrincipal(one(`SELECT user_id FROM teacher_assignments t JOIN classes k ON k.id = t.class_id WHERE k.code = 'MB PET 01' AND t.is_core = 1 AND t.status = 'active' LIMIT 1`).user_id);
    assert(cycles.loiDoiTarget(gvcn, one('SELECT * FROM learning_cycles WHERE id = ?', c.id), { kck: false }) === null, 'loiDoiTarget chặn vì cờ KCK');
    const applied: string[] = [];
    chayMig(applied); xoaNho();
    const sau = one('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?', c.id);
    assert(sau.target_score === 140 && sau.khong_cam_ket === 0 && applied.some((x) => /KCK/.test(x)), `${JSON.stringify(sau)} ${applied}`);
  }));

  /* ===== Vòng 2 (PTA Plan 26/10) ===== */
  const cuoiKhoaSvc: any = await import('../normal/cuoiKhoa.ts');
  const standingSvc: any = await import('../students/standing.ts');
  const classSvc: any = await import('../classes/classes.ts');

  check('KP-5a · lượt đã ghi môn gộp cũ: tỷ lệ cuối khoá (tyLeTongLo) + hiện trạng hồ sơ (standingFor) theo bộ môn của lượt (L+S / R+W), không 0/4', () => thu(() => {
    const { a } = dungCu();
    const [cp1a] = cps(a);
    tachMon();
    const tl = cuoiKhoaSvc.tyLeTongLo([cp1a.id]).get(cp1a.id);
    assert(tl?.du === true && tl.required === 2 && tl.scored === 2 && tl.tyLe != null, `tyLeTongLo: ${JSON.stringify(tl)}`);
    const st = standingSvc.standingFor([a]).get(a);
    assert(st?.attemptId === cp1a.id && st.required === 2 && st.scored === 2, `standing: ${JSON.stringify({ id: st?.attemptId, r: st?.required, s: st?.scored })}`);
  }));

  check('KP-5b · phân công sau đổi môn: gửi lại bức tranh có dòng môn gộp → không 400; bỏ dòng gộp khi ô gộp còn trống → GIỮ, ô đã đủ → kết thúc', () => thu(() => {
    const { lop, b, c } = dungCu();
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(cps(b)[0].id);   // em B chưa ghi gì → 4 môn (chỉ ô R+W của em C còn cần)
    tachMon();
    const dang = () => all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, lop.id);
    const slots = dang().map((x) => ({ userId: x.user_id, skill: x.skill, isCore: x.is_core === 1 }));
    const e = loi(() => classSvc.setClassTeachers(P.admin, lop.id, { slots }));
    assert(e === null, `gửi lại bức tranh có môn gộp: ${e?.status} ${e?.message}`);
    xoaNho();
    /* Bỏ hai dòng gộp: R+W của em C còn trống → giữ dòng R+W. */
    const khongGop = slots.filter((x) => x.skill !== 'listening_speaking' && x.skill !== 'reading_writing');
    classSvc.setClassTeachers(P.admin, lop.id, { slots: khongGop }); xoaNho();
    assert(dang().some((x) => x.skill === 'reading_writing' && x.user_id === GV_RW), 'dòng R+W bị kết thúc khi ô còn cần');
    /* Nhập nốt ô R+W → hết việc → kết thúc như mọi dòng. */
    nhap(cps(c)[0].id, { reading_writing: [60, 80] });
    assert(!classSvc.monGopConCan(lop.id).has('reading_writing'), 'R+W hết việc vẫn còn cần');
    classSvc.setClassTeachers(P.admin, lop.id, { slots: khongGop }); xoaNho();
    assert(!dang().some((x) => x.skill === 'reading_writing'), 'R+W hết việc mà không kết thúc');
  }));

  check('KP-5c · migrate: Target khoá KET / PET ngoài thang (band cũ) → NULL, ghi applied', () => thu(() => {
    const c = emPet();
    conn.prepare('UPDATE learning_cycles SET target_score = 6.5 WHERE id = ?').run(c.id); xoaNho();
    const applied: string[] = [];
    chayMig(applied); xoaNho();
    assert(one('SELECT target_score FROM learning_cycles WHERE id = ?', c.id).target_score === null, 'Target 6.5 còn ở khoá PET');
    assert(applied.some((x) => /Target/.test(x)), applied.join(' | '));
  }));

  check('KP-5d · đổi môn: lượt có kết quả huỷ chờ khôi phục giữ bộ gộp; lượt huỷ chưa ghi gì đổi theo bộ mới; case_signals không đụng', () => thu(() => {
    const { a, b } = dungCu();
    const [, cp2a] = cps(a); const cp1b = cps(b)[0].id;
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(cp1b);
    conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, diem_json, lich_json, so_diem, ly_do, huy_luc) VALUES (?, '[]', '[]', 0, 'thử', ?)`).run(cp2a.id, TODAY);
    conn.prepare(`INSERT INTO case_signals (student_id, attempt_id, class_id, skill, category, detected_on, raised_on, verify_due, status, dedup_key, created_at)
      VALUES (?, ?, NULL, 'listening_speaking', 'listening_speaking', ?, ?, ?, 'pending', 'kp5d', ?)`).run(b, cp1b, TODAY, TODAY, TODAY, TODAY);
    const sigTruoc = JSON.stringify(all('SELECT * FROM case_signals ORDER BY id'));
    tachMon();
    assert(monLuot(cp1b) === 'listening,reading,speaking,writing', `lượt huỷ chưa ghi: ${monLuot(cp1b)}`);
    assert(monLuot(cp2a.id) === 'listening_speaking,reading_writing' && schedSvc.boMonCuaLuot(conn, cp2a.id).join() === 'listening_speaking,reading_writing', `lượt có kết quả huỷ bị tách: ${monLuot(cp2a.id)}`);
    assert(JSON.stringify(all('SELECT * FROM case_signals ORDER BY id')) === sigTruoc, 'case_signals đổi');
  }));

  check('KP-5e · ensureSkillRows: lượt giữ bộ gộp (bản chụp) → không chèn thêm 4 môn tách', () => thu(() => {
    const { c } = dungCu();
    const cp1c = cps(c)[0].id;
    tachMon();
    schedSvc.ensureSkillRows(cp1c); xoaNho();
    assert(monLuot(cp1c) === 'listening_speaking,reading_writing', `chèn trùng: ${monLuot(cp1c)}`);
  }));

  /* ===== Vòng 3 (PTA Plan 26/10) ===== */
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const xuatSvc: any = await import('../phanTich/xuatMt.ts');

  check('KP-6a · Huỷ cả lượt Checkpoint đã chấm L+S / R+W (môn theo lượt, không 400) + Khôi phục: lịch gộp giữ, nhập lại L+S / R+W đủ', () => thu(() => {
    const { a } = dungCu();
    const [cp1a] = cps(a);
    tachMon();
    const e = loi(() => attemptsSvc.huyLuot(P.admin, cp1a.id, { lyDo: 'thử huỷ' }));
    assert(e === null, `huỷ lượt gộp: ${e?.status} ${e?.message}`);
    xoaNho();
    assert(one('SELECT status FROM assessment_attempts WHERE id = ?', cp1a.id).status === 'cancelled', 'chưa huỷ');
    assert(all('SELECT 1 FROM assessment_scores WHERE attempt_id = ? AND raw_score IS NOT NULL', cp1a.id).length === 0, 'lớp thường: huỷ lượt xoá điểm (PR-VN4)');
    /* Khôi phục lớp thường: lượt về "planned", lịch gộp giữ, điểm trống (PR-VN4) — bộ môn theo lịch gộp, nhập lại L+S / R+W được. */
    attemptsSvc.reopenAttempt(P.admin, cp1a.id); xoaNho();
    assert(monLuot(cp1a.id) === 'listening_speaking,reading_writing' && schedSvc.boMonCuaLuot(conn, cp1a.id).join() === 'listening_speaking,reading_writing', `khôi phục: ${monLuot(cp1a.id)}`);
    nhap(cp1a.id, { listening_speaking: [48, 60], reading_writing: [61, 80] });
    assert(regular.regularResultOf(cp1a.id).complete, 'nhập lại sau khôi phục');
  }));

  check('KP-6b · lượt huỷ chưa ghi gì (không bản huỷ chờ khôi phục) đổi theo bộ mới; khôi phục → 4 môn, nhập L được, dòng Nhập điểm 4 môn', () => thu(() => {
    const { lop, b } = dungCu();
    const cp1b = cps(b)[0].id;
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(cp1b);
    attemptsSvc.huyLuot(P.admin, cp1b, { lyDo: 'thử huỷ' }); xoaNho();
    tachMon();
    assert(monLuot(cp1b) === 'listening,reading,speaking,writing', `lượt huỷ chưa ghi: ${monLuot(cp1b)}`);
    attemptsSvc.reopenAttempt(P.admin, cp1b); xoaNho();
    assert(schedSvc.boMonCuaLuot(conn, cp1b).join() === 'listening,reading,writing,speaking', `boMonCuaLuot: ${schedSvc.boMonCuaLuot(conn, cp1b)}`);
    const e = loi(() => regular.saveRegularScore(P.admin, cp1b, 'listening', { score: 25, total: 30 }, TODAY));
    assert(e === null, `nhập L: ${e?.status} ${e?.message}`);
    xoaNho();
    const dong = regular.regularSheet(P.admin, lop.id, 'checkpoint:1', TODAY).rows.find((r: any) => r.studentId === b);
    assert(dong?.skillSchedule.map((x: any) => x.skill).join() === 'listening,reading,writing,speaking', `dòng em B: ${dong?.skillSchedule?.map((x: any) => x.skill)}`);
    assert(regular.regularResultOf(cp1b).required === 4, 'kết quả theo bộ mới');
  }));

  check('KP-6c · Xuất Excel PET: CP1 gộp + CP2 4 môn — tiêu đề = hợp môn (chương trình trước), mỗi dòng đúng cột, thiếu để trống', () => thu(() => {
    const { lop, a } = dungCu();
    tachMon();
    const [cp1a, cp2a] = cps(a);
    const tu = week.mondayOf(addDays(khaiGiang, -7)); const den = week.mondayOf(addDays(TODAY, 84));   // CP2 sinh 6 tuần sau CP1
    const kq = xuatSvc.duLieuXuatMt(P.admin, { khung: 'thuong', chiNhanh: [], lop: [lop.id], thoiGian: { kieu: 'tuan', tu, den }, chiDuDiem: false, cot: 'gon' });
    const aoa = kq.sheets.find((x: any) => x.aoa[0].includes('% tổng')).aoa;
    const ten = (k: string) => `${d.tenMon('PET', k)} %`;
    const cot = ['listening', 'reading', 'writing', 'speaking', 'listening_speaking', 'reading_writing'].map(ten);
    assert(JSON.stringify(aoa[0].slice(6, 12)) === JSON.stringify(cot), `tiêu đề: ${JSON.stringify(aoa[0])}`);
    assert(aoa.every((h: any[]) => h.length === aoa[0].length), 'số ô lệch tiêu đề');
    const hang = (bai: string) => aoa.find((h: any[]) => h[0] === 'KP2 Em A' && String(h[4]).includes(bai));
    const h1 = hang('1'); const h2 = hang('2');
    assert(h1 && h1[6] === null && h1[10] === 80 && h1[11] === 76.3, `CP1 gộp: ${JSON.stringify(h1)}`);
    assert(h2 && h2.slice(6, 12).every((x: any) => x === null), `CP2 4 môn (chưa điểm): ${JSON.stringify(h2)}`);
    const hc = aoa.find((h: any[]) => h[0] === 'KP2 Em C');
    assert(hc && hc[6] === null && hc[10] === 66.7 && hc[11] === null, `CP1 em C: ${JSON.stringify(hc)}`);
    void cp1a; void cp2a;
  }));

  check('KP-6d · migrate bước 3–4: mỗi lộ trình đổi KCK / Target một dòng nhật ký (trước → sau, nguồn migrate prKetPet), cả khoá đã đóng', () => thu(() => {
    const c = emPet();
    conn.prepare(`UPDATE learning_cycles SET target_score = 6.5, khong_cam_ket = 1, status = 'completed' WHERE id = ?`).run(c.id); xoaNho();
    const truoc = one('SELECT MAX(id) AS m FROM audit_logs').m ?? 0;
    chayMig([]); xoaNho();
    const nk = all(`SELECT before_json b, after_json f FROM audit_logs WHERE id > ? AND action = 'cycle.update' AND entity_type = 'learning_cycle' AND entity_id = ? ORDER BY id`, truoc, c.id)
      .map((r) => [JSON.parse(r.b), JSON.parse(r.f)]);
    assert(nk.length === 2 && nk.every(([, f]) => f._nguon === 'migrate prKetPet' && f.kyThi === 'PET'), JSON.stringify(nk));
    assert(nk[0][0].khong_cam_ket === 1 && nk[0][1].khong_cam_ket === 0 && nk[1][0].target_score === 6.5 && nk[1][1].target_score === null, JSON.stringify(nk));
    const sau = one('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?', c.id);
    assert(sau.target_score === null && sau.khong_cam_ket === 0, JSON.stringify(sau));
  }));

  check('KP-6e · migrate MON-CT-1311 một lần: khoá pr_mon_ct_1311_at; Quản trị đặt lại 4 môn sau đó → deploy sau không gộp lại', () => thu(() => {
    assert(one('SELECT 1 AS x FROM demo_config WHERE key = ?', migMc.KHOA_PR_MON_CT_1311)?.x === 1, 'không ghi khoá');
    datMon('PET', BON);
    const applied: string[] = [];
    migMc.migratePrMonCt1311(conn, applied); xoaNho();
    assert(monCt('PET') === BON.join() && !applied.length, `${monCt('PET')} · ${applied.join(' | ')}`);
  }));

  check('KP-6f · đổi môn: lớp PET đã kết thúc — class_skills theo bộ mới (Mở lại lớp), phân công đã kết thúc không đụng, lượt đã ghi giữ bộ gộp', () => thu(() => {
    const { lop, c } = dungCu();
    const cp1c = cps(c)[0].id;
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop.id);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE class_id = ? AND is_core = 0`).run(TODAY, lop.id);
    const pc = () => JSON.stringify(all(`SELECT user_id, skill, status, effective_to FROM teacher_assignments WHERE class_id = ? ORDER BY id`, lop.id));
    const pcTruoc = pc();
    const kq = tachMon();
    assert(all('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill', lop.id).map((r) => r.skill).join() === 'listening,reading,speaking,writing', 'class_skills lớp đã kết thúc');
    assert(pc() === pcTruoc, `phân công lớp đã kết thúc đổi: ${pc()}`);
    assert(monLuot(cp1c) === 'listening_speaking,reading_writing', 'lượt đã ghi của lớp đã kết thúc bị tách');
    void kq;
  }));

  check('KP-6g · KQ thi thật KET / PET đọc số nguyên như Target ("150.0", "1e2" → 400); Các lộ trình trả số liệu kyThi cho web', () => thu(() => {
    const c = emPet();
    for (const v of ['160.0', '1.6e2']) {
      const e = loi(() => thiThat.datKetQuaThiThat(P.mbManager, c.id, { ...PET_KQ, r: v }));
      assert(e?.status === 400 && e.details?.o === 'r', `${v}: ${e?.status} ${e?.message}`);
    }
    thiThat.datKetQuaThiThat(P.mbManager, c.id, { ...PET_KQ, r: ' 160 ' }); xoaNho();
    const dong = tongKet.cacLoTrinh(P.admin, c.student_id).find((x: any) => x.id === c.id);
    assert(dong?.ketQua?.kyThi?.tong === 159 && dong.ketQua.kyThi.grade === 'B', JSON.stringify(dong?.ketQua));
  }));
  d.CONG_TAC_CP.tuSinh = false;
}
