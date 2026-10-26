/**
 * PHÉP KIỂM P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md`): thang Cambridge (A2 Key 100–150, B1 Preliminary 120–170),
 * Target + kết quả thi thật KET / PET theo điểm Cambridge, Checkpoint tách R · W · L · S (migrate `prKetPet`).
 */
export async function runPrKetPetTests(t: any) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const week: any = await import('../platform/week.ts');
  const perm: any = await import('../permissions.ts');
  const mig: any = await import('../migrate/prKetPet.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const profile: any = await import('../students/profile.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
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
  const GV_LS = gvPet('listening'); const GV_RW = gvPet('reading');
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
  /** Dữ liệu CŨ (trước P13): PET môn gộp, lớp đang chạy, GV L+S / R+W, em A đã nhập CP1 (→ đã sinh CP2 chưa nhập), em B chưa nhập. */
  const dungCu = () => {
    datMon('PET', ['listening_speaking', 'reading_writing']);
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'PET', so: '09', startPeriodId: week.ensurePeriod(khaiGiang).id,
      slots: [{ skill: 'listening_speaking', userId: GV_LS, isCore: false }, { skill: 'reading_writing', userId: GV_RW, isCore: false }] }) as { id: number; code: string };
    const a = them(lop.id, 'KP2 Em A'); const b = them(lop.id, 'KP2 Em B');
    nhap(cps(a)[0].id, { listening_speaking: [48, 60], reading_writing: [61, 80] });
    regular.sinhCheckpointKeTiep([lop.id], addDays(TODAY, 7));
    xoaNho();
    return { lop, a, b };
  };
  const chup = (lop: number) => JSON.stringify([
    all('SELECT programme_code, skill, seq FROM programme_skills ORDER BY 1, 2'),
    all('SELECT class_id, skill, sessions_per_week FROM class_skills WHERE class_id = ? ORDER BY skill', lop),
    all(`SELECT user_id, skill, is_core, status FROM teacher_assignments WHERE class_id = ? ORDER BY user_id, skill`, lop),
    all(`SELECT k.attempt_id, k.skill, k.planned_period_id, k.required FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id WHERE a.class_id = ? ORDER BY 1, 2`, lop),
    all(`SELECT s.attempt_id, s.skill, s.raw_score, s.raw_total FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id WHERE a.class_id = ? ORDER BY 1, 2`, lop),
  ]);
  console.log('\nP13 KET-PET — thang Cambridge + Checkpoint 4 môn');

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

  check('KP-2a · migrate tách môn: CP1 đã nhập giữ L+S / R+W (điểm nguyên vẹn), CP2 chưa nhập → 4 môn; GV L+S nhập được L và S; lớp + phân công 4 môn', () => thu(() => {
    const { lop, a, b } = dungCu();
    const [cp1a, cp2a] = cps(a); const [cp1b] = cps(b);
    assert(cp2a?.so === 2 && monLuot(cp2a.id) === 'listening_speaking,reading_writing', `dữ liệu cũ: CP2 ${JSON.stringify(cps(a))}`);
    const diemTruoc = JSON.stringify(all('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ? ORDER BY skill', cp1a.id));
    const applied: string[] = [];
    mig.migratePrKetPet(conn, applied); xoaNho();
    assert(monCt('PET') === 'listening,reading,writing,speaking', monCt('PET'));
    assert(JSON.stringify(all('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ? ORDER BY skill', cp1a.id)) === diemTruoc, 'điểm CP1 đổi');
    assert(monLuot(cp1a.id) === 'listening_speaking,reading_writing' && monLuot(cp1b.id) === 'listening_speaking,reading_writing', 'CP1 (đợt đã có điểm) phải giữ môn gộp');
    assert(monLuot(cp2a.id) === 'listening,reading,speaking,writing', `CP2: ${monLuot(cp2a.id)}`);
    const s1 = regular.regularSheet(P.admin, lop.id, 'checkpoint:1', TODAY);
    assert(s1.programme.skills.join() === 'listening_speaking,reading_writing' && s1.monNgan.listening_speaking === 'L+S', `lưới CP1: ${s1.programme.skills}`);
    const r1 = s1.rows.find((r: any) => r.studentId === a);
    assert(r1.result.complete && r1.chip?.chu === 'Đạt' && r1.skillSchedule.map((x: any) => x.skill).join() === 'listening_speaking,reading_writing', JSON.stringify(r1.chip));
    assert(regular.regularResultOf(cp1a.id).complete, 'kết quả CP1 phải đủ (chấm theo môn gộp của lượt)');
    const s2 = regular.regularSheet(P.admin, lop.id, 'checkpoint:2', TODAY);
    assert(s2.programme.skills.join() === 'listening,reading,writing,speaking', `lưới CP2: ${s2.programme.skills}`);
    assert(all('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill', lop.id).map((r) => r.skill).join() === 'listening,reading,speaking,writing', 'class_skills');
    assert(all(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL ORDER BY skill`, lop.id, GV_LS).map((r) => r.skill).join() === 'listening,speaking', 'phân công GV L+S');
    const gv = perm.loadPrincipal(GV_LS);
    for (const k of ['listening', 'speaking', 'listening_speaking']) assert(perm.scoreEditPath(gv, lop.id, k) === 'assigned', `GV L+S không nhập được ${k}`);
    assert(perm.scoreEditPath(gv, lop.id, 'reading') === null, 'GV L+S nhập được R');
    regular.saveRegularScore(gv, cp1b.id, 'listening_speaking', { score: 40, total: 60 }, TODAY);   // ô gộp cũ còn trống: GV vẫn nhập được
    assert(applied.some((x) => /Checkpoint 2/.test(x)) && !applied.some((x) => /Checkpoint 1/.test(x)), applied.join(' | '));
  }));

  check('KP-2b · migrate chạy lần hai: applied rỗng, bảng giống hệt', () => thu(() => {
    const { lop } = dungCu();
    mig.migratePrKetPet(conn, []); xoaNho();
    const truoc = chup(lop.id);
    const applied: string[] = [];
    mig.migratePrKetPet(conn, applied); xoaNho();
    assert(applied.length === 0 && chup(lop.id) === truoc, `lần hai: ${applied.join(' | ')}`);
  }));

  check('KP-2c · Quản trị đã sửa môn KET khác mặc định → migrate không đụng', () => thu(() => {
    datMon('KET', ['listening_speaking', 'reading', 'writing']);
    const applied: string[] = [];
    mig.migratePrKetPet(conn, applied); xoaNho();
    assert(monCt('KET') === 'listening_speaking,reading,writing' && !applied.some((x) => /KET/.test(x)), `${monCt('KET')} · ${applied.join(' | ')}`);
  }));

  check('KP-2d · lớp PET mới: Checkpoint 4 môn, đạt từ 70 % mỗi môn, SOS theo môn; Case PET / KET = L · R · W · S', () => thu(() => {
    assert(monCt('PET') === 'listening,reading,writing,speaking' && monCt('KET') === 'listening,reading,writing,speaking', `seed: ${monCt('PET')} / ${monCt('KET')}`);
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'PET', so: '08', startPeriodId: week.ensurePeriod(khaiGiang).id }) as { id: number };
    const a = them(lop.id, 'KP2d Em');
    const cp = cps(a)[0];
    assert(monLuot(cp.id) === 'listening,reading,speaking,writing', monLuot(cp.id));
    nhap(cp.id, { listening: [21, 30], reading: [27, 40], writing: [28, 40], speaking: [20, 30] });   // 70 % · 67.5 % · 70 % · 66.7 %
    const r = regular.regularResultOf(cp.id);
    const kq = Object.fromEntries(r.skills.map((x: any) => [x.skill, x.outcome]));
    assert(kq.listening === 'pass' && kq.reading === 'fail' && kq.writing === 'pass' && kq.speaking === 'fail' && r.sosLevel === 2, JSON.stringify(kq));
    for (const ct of ['PET', 'KET']) assert(d.caseTopicsFor(true, ct).join() === 'listening,reading,writing,speaking', `${ct}: ${d.caseTopicsFor(true, ct)}`);
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
}
