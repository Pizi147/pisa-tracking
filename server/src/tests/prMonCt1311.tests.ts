/**
 * PHÉP KIỂM MON-CT-1311 (chủ SP 13/11, plan.md mục 4 "13/11 … chương trình"): Quản trị sửa Môn của MỌI chương trình lớp thường (kể cả gốc, đang có lớp).
 * Đổi môn áp lớp mở sau + bài Test chưa ghi của lớp đang chạy; bài đã ghi giữ bộ cũ (`assessment_attempts.bo_mon`); phân công môn gộp nhận GV khi các môn
 * thành phần cùng một GV; có lớp đang học → hỏi trước (409 canXacNhan); nhật ký; chỉ Quản trị (QL 403); FT / Pre FOU khoá, lý do tại ô.
 */
export async function runPrMonCt1311Tests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const regular: any = await import('../normal/regular.ts');
  const schedSvc: any = await import('../fasttrack/skillSchedule.ts');
  const classSvc: any = await import('../classes/classes.ts');
  const { voiXacNhan, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e; } return null; };
  const monCt = (ma: string) => all('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq', ma).map((r) => r.skill).join();
  const monLuot = (id: number) => all('SELECT skill FROM attempt_skills WHERE attempt_id = ? ORDER BY skill', id).map((r) => r.skill).join();
  const ct = (ma: string) => sysconfig.listProgrammes(P.admin).find((x: any) => x.code === ma);
  /** Gửi như panel Sửa chương trình: giữ tên / độ dài / mốc, chỉ đổi môn. */
  const luu = (ma: string, skills: unknown, p = P.admin) => {
    const c = ct(ma);
    const moc = (k: string) => c.checkpoints.find((x: any) => x.kind === k)?.studyWeek ?? null;
    return sysconfig.saveProgramme(p, { code: ma, name: c.name, weeks: c.weeks, progressWeek: moc('progress'), finalWeek: moc('final'), skills });
  };
  const MOI = ['listening_speaking', 'reading', 'writing'];
  console.log('\nMON-CT-1311 — Quản trị sửa Môn mọi chương trình lớp thường');

  /** Lớp BE đang chạy: A (L, S cùng một GV), B (L, S hai GV khác nhau). */
  const dungLop = () => {
    const lop = all(`SELECT c.id FROM classes c WHERE c.programme_code = 'BE' AND c.status = 'active'
      AND EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = c.id AND t.skill = 'listening' AND t.status = 'active')
      AND EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = c.id AND t.skill = 'speaking' AND t.status = 'active') ORDER BY c.id LIMIT 2`).map((r) => r.id as number);
    assert(lop.length === 2, `cần 2 lớp BE đang chạy có GV L và S (có ${lop.length})`);
    const gv = (id: number, k: string) => one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active'`, id, k).user_id as number;
    const [A, B] = lop;
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`).run(gv(A, 'listening'), A);
    if (gv(B, 'listening') === gv(B, 'speaking')) {
      const khac = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND user_id != ? AND status = 'active' LIMIT 1`, B, gv(B, 'listening'))?.user_id;
      assert(khac, 'lớp B cần GV khác cho S');
      conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`).run(khac, B);
    }
    xoaNho();
    return { A, B, gvA: gv(A, 'listening') };
  };
  /** Lượt chưa ghi (lịch tự sinh, không điểm) / đã ghi (có điểm) của lớp. */
  const luotChuaGhi = (lop: number) => one(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.status != 'cancelled'
      AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id)
      AND NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND (k.plan_source != 'auto' OR k.sit_status != 'scheduled'))
      AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id) ORDER BY a.id LIMIT 1`, lop)?.id as number | undefined;
  const luotDaGhi = (lop: number) => one(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.status != 'cancelled'
      AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id) ORDER BY a.id LIMIT 1`, lop)?.id as number | undefined;

  check('MC-1 · BE (chương trình gốc, đang có lớp) L R W S → L+S R W: chưa xác nhận → 409 nêu số lớp / bài / phân công, chưa ghi; xác nhận → lưu + nhật ký', () => thu(() => {
    const { A, B, gvA } = dungLop();
    assert(ct('BE').khoaMon === null, 'BE khoá môn');
    const hoi = loi(() => luu('BE', MOI));
    assert(hoi?.status === 409 && hoi.details?.canXacNhan && /lớp đang học/.test(hoi.message) && /phân công cần chọn lại ở \d+ lớp/.test(hoi.message), `hỏi: ${hoi?.status} ${hoi?.message}`);
    assert(monCt('BE') === 'listening,reading,writing,speaking', 'hỏi mà đã ghi');
    const truoc = one('SELECT MAX(id) m FROM audit_logs').m ?? 0;
    voiXacNhan(() => luu('BE', MOI)); xoaNho();
    assert(monCt('BE') === MOI.join(), monCt('BE'));
    const nk = one(`SELECT before_json b, after_json f FROM audit_logs WHERE id > ? AND action = 'programme_updated' AND entity_label = 'BE' ORDER BY id DESC LIMIT 1`, truoc);
    assert(nk && JSON.parse(nk.b).mon?.join() === 'listening,reading,writing,speaking' && JSON.parse(nk.f).mon?.join() === MOI.join(), `nhật ký: ${JSON.stringify(nk)}`);
    /* Phân công: A (L, S cùng GV) → L+S nhận GV đó; B (khác GV) → Chưa phân công. */
    const pc = (lop: number) => all(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening_speaking' AND status = 'active'`, lop).map((r) => r.user_id);
    assert(pc(A).join() === String(gvA), `lớp A L+S: ${pc(A)}`);
    assert(pc(B).length === 0, `lớp B L+S phải chưa phân công: ${pc(B)}`);
    assert(all('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill', A).map((r) => r.skill).join() === 'listening_speaking,reading,writing', 'class_skills');
  }));

  check('MC-2 · đổi môn: bài Test chưa ghi đổi theo bộ mới (Nhập điểm theo bộ mới); bài đã ghi giữ bộ cũ (bản chụp, kết quả không đổi, không chèn môn mới)', () => thu(() => {
    const lop = all(`SELECT id FROM classes WHERE programme_code = 'BE' AND status = 'active' ORDER BY id`).map((r) => r.id as number);
    const lopMoi = lop.find((id) => luotChuaGhi(id) && luotDaGhi(id)) ?? lop.find((id) => luotChuaGhi(id));
    assert(lopMoi, 'cần lớp BE có lượt chưa ghi');
    const cg = luotChuaGhi(lopMoi!)!;
    const dg = lop.map(luotDaGhi).find(Boolean);
    assert(dg, 'cần một lượt BE đã có điểm');
    const kqTruoc = JSON.stringify(regular.regularResultOf(dg));
    const lichDg = monLuot(dg!);
    voiXacNhan(() => luu('BE', MOI)); xoaNho();
    assert(monLuot(cg) === 'listening_speaking,reading,writing', `lượt chưa ghi: ${monLuot(cg)}`);
    assert(schedSvc.boMonCuaLuot(conn, cg).join() === MOI.join(), `boMonCuaLuot chưa ghi: ${schedSvc.boMonCuaLuot(conn, cg)}`);
    const chup = one('SELECT bo_mon FROM assessment_attempts WHERE id = ?', dg).bo_mon;
    assert(chup === JSON.stringify(['listening', 'reading', 'writing', 'speaking']), `bản chụp: ${chup}`);
    assert(monLuot(dg!) === lichDg && JSON.stringify(regular.regularResultOf(dg)) === kqTruoc, 'lượt đã ghi đổi lịch / kết quả');
    schedSvc.ensureSkillRows(dg); xoaNho();
    assert(monLuot(dg!) === lichDg, `ensureSkillRows chèn môn mới vào lượt đã ghi: ${monLuot(dg!)}`);
    /* Đổi lại đúng bộ cũ → bản chụp bỏ (lượt theo chương trình như trước). */
    voiXacNhan(() => luu('BE', ['listening', 'reading', 'writing', 'speaking'])); xoaNho();
    assert(one('SELECT bo_mon FROM assessment_attempts WHERE id = ?', dg).bo_mon === null, 'bản chụp còn khi bộ trùng');
    assert(monLuot(cg) === 'listening,reading,speaking,writing', `đổi lại: ${monLuot(cg)}`);
  }));

  check('MC-3 · chỉ đổi thứ tự môn: không hỏi, lượt / phân công không đổi; thứ tự mới lưu', () => thu(() => {
    const lich = JSON.stringify(all(`SELECT k.attempt_id, k.skill FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id JOIN classes c ON c.id = a.class_id WHERE c.programme_code = 'BE' ORDER BY 1, 2`));
    const pc = JSON.stringify(all(`SELECT t.id, t.status FROM teacher_assignments t JOIN classes c ON c.id = t.class_id WHERE c.programme_code = 'BE' ORDER BY t.id`));
    luu('BE', ['speaking', 'listening', 'reading', 'writing']); xoaNho();
    assert(monCt('BE') === 'speaking,listening,reading,writing', monCt('BE'));
    assert(JSON.stringify(all(`SELECT k.attempt_id, k.skill FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id JOIN classes c ON c.id = a.class_id WHERE c.programme_code = 'BE' ORDER BY 1, 2`)) === lich, 'lịch đổi');
    assert(JSON.stringify(all(`SELECT t.id, t.status FROM teacher_assignments t JOIN classes c ON c.id = t.class_id WHERE c.programme_code = 'BE' ORDER BY t.id`)) === pc, 'phân công đổi');
  }));

  check('MC-4 · quyền + luật: QL 403 (không ghi); môn gộp đi cùng môn thành phần / rỗng / ngoài danh sách → 400 ô Môn; Pre FOU, FT khoá (lý do tại ô); gửi lại đúng bộ Pre FOU không lỗi', () => thu(() => {
    assert(loi(() => luu('BE', MOI, P.mbManager))?.status === 403 && monCt('BE') === 'listening,reading,writing,speaking', 'QL sửa được môn');
    for (const sai of [['listening', 'listening_speaking'], [], ['tong_hop'], ['writing1']]) {
      const e = loi(() => luu('BE', sai));
      assert(e?.status === 400 && e.details?.o === 'mon', `${JSON.stringify(sai)} → ${e?.status} ${e?.details?.o}`);
    }
    const pf = ct('PREFOU');
    assert(/Pre FOU/.test(pf.khoaMon ?? ''), `Pre FOU khoaMon: ${pf.khoaMon}`);
    const e = loi(() => luu('PREFOU', ['listening']));
    assert(e?.status === 400 && e.details?.o === 'mon' && e.message === pf.khoaMon, `Pre FOU đổi môn: ${e?.status} ${e?.message}`);
    assert(loi(() => luu('PREFOU', ['tong_hop'])) === null && monCt('PREFOU') === 'tong_hop', 'gửi lại bộ Pre FOU lỗi');
    assert(ct('FT').khoaMon && loi(() => luu('FT', ['listening']))?.details?.o === 'mon', 'FT đổi môn');
  }));

  check('MC-5 · phân công sau đổi môn: GV môn bỏ còn ô chưa chấm ở bài cũ → dòng môn bỏ GIỮ; gửi lại bức tranh có dòng đó không 400', () => thu(() => {
    const { A } = dungLop();
    voiXacNhan(() => luu('BE', MOI)); xoaNho();
    const can = classSvc.monGopConCan(A) as Set<string>;
    const dang = all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, A);
    for (const k of ['listening', 'speaking']) {
      assert(can.has(k) === dang.some((x) => x.skill === k), `${k}: còn cần ${can.has(k)} · còn dòng ${dang.some((x) => x.skill === k)}`);
    }
    const e = loi(() => classSvc.setClassTeachers(P.admin, A, { slots: dang.map((x) => ({ userId: x.user_id, skill: x.skill, isCore: x.is_core === 1 })) }));
    assert(e === null, `gửi lại bức tranh có môn cũ: ${e?.status} ${e?.message}`);
  }));
  void TODAY;
}
