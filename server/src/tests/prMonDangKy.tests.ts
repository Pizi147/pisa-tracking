/**
 * PHÉP KIỂM P8 MON-DANG-KY (plan.md 1.6 N13, N22 ④ — chỉ Fast Track; thiết kế 24/10 mục 3.4):
 *  · lộ trình FT có môn đăng ký L · R · W1 · W2 · S (NULL = đủ môn);
 *  · môn không học không thành việc / nợ / nhắc / SOS; Overall "Không đủ bộ môn"; chỉ W1 hoặc W2 → Writing = task đã học.
 */
export async function runPrMonDangKyTests(t: { check: any; checkAsync: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrMonDangKy } = await import('../migrate/prMonDangKy.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const mdk = await import('../fasttrack/monDangKy.ts');
  const dtlMod: any = await import('../cham/diemTheoLuot.ts');
  const khMod: any = await import('../keHoach/keHoachTest.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const { O_CHO_TU_SQL, capNhatConOCho } = await import('../fasttrack/conOCho.ts');
  /** Cờ "còn ô chờ" đang lưu khớp cách tính lại — chỉ các lượt của em này (bộ kiểm khác ghi SQL thẳng có thể để lệch lượt của chúng). */
  const coLech = (cycleId: number) => (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts a WHERE a.cycle_id = ? AND a.o_cho_tu IS NOT ${O_CHO_TU_SQL}`).get(cycleId) as any).n as number;
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const hoanTat: any = await import('../fasttrack/hoanTat.ts');
  const cls: any = await import('../classes/classes.ts');
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /** Lộ trình FT đang học của em (theo tên trong bộ demo) + lượt MT theo số. */
  const em = (ten: string) => {
    const cy = get(`SELECT c.id, c.student_id sid FROM learning_cycles c JOIN students s ON s.id = c.student_id WHERE s.full_name = ? AND c.route IS NOT NULL AND c.status = 'active' ORDER BY c.id DESC LIMIT 1`, ten);
    assert(cy, `seed thiếu ${ten}`);
    return { ...cy, mt: (no: number) => get(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND kind = 'mock'`, cy.id, no) };
  };
  const dong = (attemptId: number, skill: string) => get('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', attemptId, skill);
  /** Ghi thẳng điểm (phép kiểm chấm, không qua luật nhập). */
  const diem = (attemptId: number, bands: Record<string, number>) => {
    for (const [k, b] of Object.entries(bands)) {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(attemptId, k);
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)').run(attemptId, k, b, TODAY);
    }
    xoaNho();
  };
  const KHONG_S = ['listening', 'reading', 'writing1', 'writing2'];
  const CHI_W2 = ['listening', 'reading', 'writing2', 'speaking'];
  console.log('\nP8 MON-DANG-KY — môn đăng ký L · R · W1 · W2 · S theo lộ trình FT');
  /** Chạy trong giao dịch rồi cuộn lại — phép kiểm không để dấu trên DB chung. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    /* Lớp thử tạo trong giao dịch cuộn lại → id lớp dùng lại; bỏ cách chấm đã nhớ theo id lớp của bộ kiểm trước. */
    try { xoaNho(); skillSchedule.clearScoringModeCache(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); skillSchedule.clearScoringModeCache(); }
  };

  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const bt: any = await import('../loTrinh/buocTiep.ts');
  const intake: any = await import('../classes/intake.ts');
  const lichSu: any = await import('../students/lichSuSua.ts');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  let seq = 0;
  const lop = () => {
    seq += 1;
    const start = addDays(T2, -70);
    return intake.createClass(P.admin, { code: `MB P8-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  };
  /** Em đang học lớp `classId`, lộ trình `route` (null = lớp thường) bắt đầu 10 tuần trước. */
  const emMoi = (classId: number, route: string | null = 'LT1') => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-P8-${seq}`, `Học viên P8 ${seq}`, `hoc vien p8 ${seq}`, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -70);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at) VALUES (?,1,?,?,6.5,?,?, 'active', ?)`)
      .run(sid, route, route ? 'FT' : 'FOU', week.ensurePeriod(bd).id, bd, NOW).lastInsertRowid);
    return { sid, cy };
  };
  /**
   * Em FT RIÊNG cho phép kiểm (không dựa bộ demo — các bộ kiểm chạy trước đổi trạng thái em demo): MT1 đã thi đủ 5 ô, MT3 tuần này chưa thi;
   * tuỳ chọn Case S / Case W2 đang mở + một PA đang chạy. `lop` = lớp có sẵn (mặc định một lớp FT mới).
   */
  const emDu = (o: { caseS?: boolean; caseW2?: boolean; lop?: number } = {}) => {
    const L = o.lop ?? lop();
    const x = emMoi(L);
    const luot = (no: number, tuan: string, st: string) => Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, target_at_attempt, created_at)
      VALUES (?,?,?,'mock',?,?,?,6.5,?)`).run(x.cy, x.sid, no, L, week.ensurePeriod(tuan).id, st, NOW).lastInsertRowid);
    const a1 = luot(1, addDays(T2, -28), 'done'), a3 = luot(3, T2, 'planned');
    skillSchedule.ensureSkillRows(a1); skillSchedule.ensureSkillRows(a3);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ?`).run(a1);
    diem(a1, { listening: 6, reading: 6, writing1: 5, writing2: 6, speaking: 5 });
    for (const [co, kn] of [[o.caseS, 'speaking'], [o.caseW2, 'writing2']] as const) {
      if (!co) continue;
      const c = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, attempt_id, category, topic, title, status, created_at, updated_at) VALUES (?,?,?,?,?,?, 'open', ?, ?)`)
        .run(x.sid, x.cy, a1, kn, kn, `Case ${kn} P8`, NOW, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, created_at, updated_at) VALUES (?, 'tutor', 'started', ?, ?)`).run(c, NOW, NOW);
    }
    capNhatConOCho([a1, a3]); xoaNho();
    return { id: x.cy, sid: x.sid, L, mt: (no: number) => get(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND kind = 'mock'`, x.cy, no) };
  };

  // ------------------------------------------------------------------ Task 1: hàm thuần + dữ liệu
  check('MDK-1 · hàm thuần: NULL = đủ; chỉ W2 → bỏ task W1, không bỏ kỹ năng; bỏ W1 + W2 → Writing không học; rỗng / lạ → lỗi; chữ theo thứ tự L R W1 W2 S', () => {
    assert(d.laDuMon(null) && d.chuanMon(null).size === 5, 'NULL = đủ môn');
    const w2 = ['speaking', 'writing2', 'reading', 'listening'];
    assert(d.kyNangKhongHoc(w2).length === 0 && d.boTaskCua(w2) === 'writing1', 'chỉ W2: không bỏ kỹ năng, bỏ task W1');
    assert(d.boTaskCua(['writing1']) === 'writing2' && d.boTaskCua(null) === null, 'bỏ task W2 / đủ');
    assert(d.kyNangKhongHoc(['listening', 'reading', 'speaking']).join() === 'writing', 'bỏ cả W1 + W2 → Writing không học');
    assert(d.boTaskCua(['listening', 'reading', 'speaking']) === null, 'bỏ cả hai task: không đánh dấu task');
    assert(d.kyNangKhongHoc(['listening', 'reading', 'writing1', 'writing2']).join() === 'speaking', 'không học S');
    assert(d.monThieu(w2).join() === 'writing1', 'môn thiếu');
    assert(d.chuMon(w2) === 'L · R · W2 · S' && d.chuMon(null) === 'Đủ môn', `chữ: ${d.chuMon(w2)}`);
    assert(d.chuMon(JSON.stringify(w2)) === 'L · R · W2 · S', 'đọc được JSON từ DB');
    assertThrows(() => d.chuanMon([]), /ít nhất một môn/, 'rỗng → lỗi');
    assertThrows(() => d.chuanMon(['writing']), /không hợp lệ/, 'giá trị lạ → lỗi');
    assert(d.luuMon([...d.ENTRY_SKILLS]) === null, 'đủ 5 môn lưu NULL');
    assert(d.luuMon(w2) === JSON.stringify(['listening', 'reading', 'writing2', 'speaking']), `lưu theo thứ tự chuẩn: ${d.luuMon(w2)}`);
  });

  check('MDK-2 · migrate hai lần: lần hai không đổi; DB hiện có: mọi lộ trình NULL (đủ môn), mọi dòng lịch bo_task NULL', () => {
    thu(() => {
      conn.exec('ALTER TABLE learning_cycles DROP COLUMN mon_dang_ky');
      conn.exec('ALTER TABLE attempt_skills DROP COLUMN bo_task');
      const a1: string[] = []; migratePrMonDangKy(conn, a1);
      const a2: string[] = []; migratePrMonDangKy(conn, a2);
      assert(a1.length === 2 && a2.length === 0, `lần 1: ${a1.length}, lần 2: ${a2.length}`);
    });
    const a: string[] = []; migratePrMonDangKy(conn, a);
    assert(a.length === 0, 'schema.sql đã có cột');
  });

  check('MDK-5 · seed theo mockup: Lý Tuấn Bình chỉ W2 (MT4 bỏ task W1), Bùi Thu Ninh không học S (MT4 S "Không học") — CP FT 110', () => {
    const binh = em('Lý Tuấn Bình'), ninh = em('Bùi Thu Ninh');
    assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', binh.id).m === JSON.stringify(CHI_W2) && dong(binh.mt(4).id, 'writing').bo_task === 'writing1', 'Bình');
    assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ninh.id).m === JSON.stringify(KHONG_S) && dong(ninh.mt(4).id, 'speaking').scope_reason === d.LY_DO_KHONG_HOC, 'Ninh');
  });

  // ------------------------------------------------------------------ Task 2: áp môn vào lượt + chấm + nợ
  check('MDK-3a · không học S: MT chưa thi S → required 0 "Không học"; MT đã có điểm S giữ; ô S không chờ / không nợ; Overall null + "Không đủ bộ môn"; SOS không xét S', () => {
    thu(() => {
      const ha = emDu({ caseS: true });
      const mt1 = ha.mt(1), mt3 = ha.mt(3);
      const kq = mdk.apMonDangKy(P.mbManager, ha.id, KHONG_S);
      assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ha.id).m === JSON.stringify(KHONG_S), 'lưu môn');
      const s3 = dong(mt3.id, 'speaking');
      assert(s3.required === 0 && s3.scope_reason === d.LY_DO_KHONG_HOC, `MT3 S: ${s3.required} ${s3.scope_reason}`);
      assert(dong(mt1.id, 'speaking').required === 1, 'MT1 đã có điểm S: giữ');
      assert(get(`SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking' AND band IS NOT NULL`, mt1.id).n === 1, 'điểm S cũ còn');
      assert(kq.boKhoiDot >= 1 && kq.giuDaCham >= 1, `tóm tắt: ${JSON.stringify(kq)}`);
      assert(coLech(ha.id) === 0, 'cờ ô chờ khớp');
      const cells = attempts.skillCells(P.admin, mt3, [], [], TODAY, skillSchedule.ensureSkillRows(mt3.id));
      assert(cells.find((c: any) => c.skill === 'speaking').progress === 'skipped' && cells.find((c: any) => c.skill === 'speaking').khongHoc, 'ô S MT3: Không học');
      const no = scoreDebtCells(P.admin, addDays(TODAY, 200), null).filter((c) => c.attemptId === mt3.id);
      assert(!no.some((c) => c.skill === 'speaking'), 'không nợ S');
      diem(mt3.id, { listening: 6, reading: 6, writing1: 6, writing2: 6 });
      const r = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt3.id));
      assert(r.overall === null && r.khongDuBoMon && r.chot, `Overall ${r.overall}, khongDuBoMon ${r.khongDuBoMon}, chot ${r.chot}`);
      assert(r.verdicts.find((v: any) => v.skill === 'speaking').required === false, 'SOS không xét S');
    });
  });

  check('MDK-3b · chỉ W2: MT chưa thi bo_task = W1, Writing = W2, Overall Không đủ bộ môn; MT đã chấm giữ công thức cũ; ô W1 không là thiếu, nhập W1 bị chặn', () => {
    thu(() => {
      const huy = emDu({ caseW2: true });
      const mt1 = huy.mt(1), mt3 = huy.mt(3);
      const kq = mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      assert(kq.writing === 'W2' && kq.khongDuBoMon, `tóm tắt ${JSON.stringify(kq)}`);   // mockup k4: Writing = W2 · Overall Không đủ bộ môn
      assert(dong(mt3.id, 'writing').bo_task === 'writing1' && dong(mt3.id, 'writing').required === 1, 'MT3: bỏ task W1, Writing vẫn học');
      assert(dong(mt1.id, 'writing').bo_task === null, 'MT1 đã chấm: không đổi');
      const cells = attempts.skillCells(P.admin, mt3, [], attempts.skipsOf(mt3.id), TODAY, skillSchedule.ensureSkillRows(mt3.id));
      assert(cells.find((c: any) => c.skill === 'writing1').progress === 'skipped' && cells.find((c: any) => c.skill === 'writing1').khongHoc && cells.find((c: any) => c.skill === 'writing2').required, 'ô W1 Không học, W2 bắt buộc');
      assertThrows(() => attempts.saveScore(P.admin, mt3.id, 'writing1', { band: 6 }, addDays(TODAY, 200)), /không học/, 'nhập W1 bị chặn');
      assert(coLech(huy.id) === 0, 'cờ ô chờ khớp');
      diem(mt3.id, { listening: 6, reading: 6, writing2: 7, speaking: 6 });
      capNhatConOCho([mt3.id]);
      assert(get('SELECT o_cho_tu FROM assessment_attempts WHERE id = ?', mt3.id).o_cho_tu === null, 'đủ L R W2 S → không còn ô chờ (W1 không chờ)');
      const r = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt3.id));
      assert(r.bands.writing === 7 && r.overall === null && r.chot && r.khongDuBoMon, `Writing ${r.bands.writing}, Overall ${r.overall}`);
      /* Lượt đủ L R W2 S là "đủ điểm" (không chờ W1) — cùng luật hoàn tất của bảng điểm. */
      assert(hoanTat.dotHoanTatMany([mt3.id], addDays(TODAY, 200)).get(mt3.id)?.hoanTat, 'đủ L R W2 S → hoàn tất');
      const s1 = all('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?', mt1.id);
      const b = (k: string) => s1.find((x) => x.skill === k).band;
      const r1 = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt1.id));
      assert(r1.bands.writing === Math.round(((b('writing1') + b('writing2') * 2) / 3) * 2) / 2, 'MT1 giữ công thức W1 + W2');
    });
  });

  check('MDK-3e · badge "n bài chờ chấm" = ba khối Lịch Test khi lớp có em chỉ học W2 (ô W1 không là bài chờ chấm)', () => {
    thu(() => {
      const huy = emDu({ caseW2: true });
      mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      const lop = huy.L;
      const tom = cls.listClassSummaries(P.mbManager, { scope: 'managed' });
      const s = ((Array.isArray(tom) ? tom : tom.classes ?? tom.rows ?? []) as any[]).find((c: any) => c.id === lop);
      const r = cham.lichTest(P.mbManager, week.ensurePeriod(week.mondayOf(TODAY)).id, null, TODAY, { classId: lop, phamVi: 'tat-ca' });
      const k = r.no.reduce((n: number, x: any) => n + x.conBai, 0) + (r.chamTuanNay ?? []).reduce((n: number, l: any) => n + l.conBai, 0) + r.lop.reduce((n: number, l: any) => n + l.conBai, 0);
      assert(k === s.needScores, `ba khối ${k} ≠ badge ${s.needScores}`);
    });
  });

  check('MDK-6 · chỉ học W2: W2 dưới kỳ vọng → có tín hiệu / Case W2 (dù W1 không có điểm); sửa điểm kỹ năng khác không rút tín hiệu W2', () => {
    thu(() => {
      const x = emDu();
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2);
      const mt3 = x.mt(3);
      attempts.saveScore(P.admin, mt3.id, 'listening', { rawScore: 40 }, TODAY);
      attempts.saveScore(P.admin, mt3.id, 'reading', { rawScore: 40 }, TODAY);
      attempts.saveScore(P.admin, mt3.id, 'speaking', { criteria: [9, 9, 9, 9] }, TODAY);
      attempts.saveScore(P.admin, mt3.id, 'writing2', { criteria: [4, 4, 4, 4] }, TODAY);
      const coW2 = () => get(`SELECT (SELECT COUNT(*) FROM case_signals WHERE attempt_id = ? AND skill = 'writing2' AND status != 'withdrawn')
        + (SELECT COUNT(*) FROM sos_cases WHERE attempt_id = ? AND topic = 'writing2' AND status != 'done') n`, mt3.id, mt3.id).n as number;
      assert(coW2() >= 1, 'W2 4.0 dưới kỳ vọng phải có tín hiệu / Case W2');
      attempts.saveScore(P.admin, mt3.id, 'listening', { rawScore: 39 }, TODAY);
      assert(coW2() >= 1, 'sửa điểm L không rút tín hiệu W2');
    });
  });

  check('MDK-7 · chỉ học W2, lượt đủ L R W2 S: Điểm theo lượt "đủ điểm" (không ô trống W1), Kế hoạch Test ô W xong, hồ sơ MT Writing đã có điểm', () => {
    thu(() => {
      const x = emDu();
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2);
      const mt3 = x.mt(3);
      for (const [k, b] of [['listening', { rawScore: 40 }], ['reading', { rawScore: 40 }], ['speaking', { criteria: [9, 9, 9, 9] }], ['writing2', { criteria: [9, 9, 9, 9] }]] as const) attempts.saveScore(P.admin, mt3.id, k, b as any, TODAY);
      const l3 = dtlMod.danhSachLuot(P.mbManager, x.L).luot.find((l: any) => l.ma === 'mt:3');
      assert(l3.duDiem === 1 && l3.oTrong === 0, `Điểm theo lượt MT3: ${JSON.stringify(l3)}`);
      const o = khMod.luoiFT(P.mbManager, x.L).hang.find((h: any) => h.studentId === x.sid).dot['3'].kn.writing;
      assert(o.trangThai === 'xong', `Kế hoạch Test ô W: ${o.trangThai}`);
      const w = attempts.attemptDetail(P.mbManager, mt3.id).skillSchedule.find((r: any) => r.skill === 'writing');
      assert(w.progress === 'scored', `hồ sơ MT Writing: ${w.progress}`);
    });
  });

  check('MDK-3c · bỏ S khi Case S mở + PA chạy → Case đóng "Không còn học môn", PA cancelled (không vào Hiệu quả PA); bật lại S → lượt chưa thi required 1, Case không mở lại', () => {
    thu(() => {
      const ha = emDu({ caseS: true });
      const c = get(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = 'speaking' AND status != 'done'`, ha.sid);
      assert(c, 'seed: Case S mở');
      const paMo = all(`SELECT id FROM case_interventions WHERE case_id = ? AND status IN ('planned','started')`, c.id).map((x) => x.id);
      assert(paMo.length, 'seed: PA đang chạy');
      assert(mdk.apMonDangKy(P.mbManager, ha.id, KHONG_S, { xemTruoc: true }).caseDong === 1, 'xem trước: 1 Case đóng');
      assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ha.id).m === null, 'xem trước không ghi');
      mdk.apMonDangKy(P.mbManager, ha.id, KHONG_S);
      const sau = get('SELECT status, system_close_reason r FROM sos_cases WHERE id = ?', c.id);
      assert(sau.status === 'done' && sau.r === 'khong_con_hoc_mon', `Case: ${sau.status} ${sau.r}`);
      assert(d.SYSTEM_CLOSE_REASON_LABEL.khong_con_hoc_mon === 'Không còn học môn', 'nhãn');
      for (const id of paMo) {
        const pa = get('SELECT status, closed_reason FROM case_interventions WHERE id = ?', id);
        assert(pa.status === 'cancelled' && pa.closed_reason === 'khong_con_hoc_mon', `PA ${pa.status} ${pa.closed_reason}`);
      }
      const huy = emDu({ caseW2: true });
      const caseW2 = get(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = 'writing2' AND status != 'done'`, huy.sid);
      mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      assert(get('SELECT status FROM sos_cases WHERE id = ?', caseW2.id).status !== 'done', 'Case W2 của em chỉ học W2: giữ mở');
      const bat = mdk.apMonDangKy(P.mbManager, ha.id, null);
      const s3 = dong(ha.mt(3).id, 'speaking');
      assert(s3.required === 1 && s3.scope_reason === null && bat.batLai >= 1, `bật lại: ${s3.required} ${s3.scope_reason}`);
      assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ha.id).m === null, 'đủ môn → NULL');
      assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'done', 'Case không mở lại');
      const nk = all(`SELECT before_json b, after_json a FROM audit_logs WHERE entity_type = 'learning_cycle' AND entity_id = ? AND action = 'cycle.mon_dang_ky' ORDER BY id`, ha.id);
      assert(nk.length === 2 && JSON.parse(nk[0].b).monDangKy === 'Đủ môn' && JSON.parse(nk[0].a).monDangKy === 'L · R · W1 · W2', `nhật ký: ${JSON.stringify(nk)}`);
    });
  });

  check('MDK-3d · MT mới sinh sau theo môn đăng ký; lộ trình lớp thường gửi môn → 400; môn rỗng / lạ → 400; đổi phạm vi lớp thường vẫn 400', () => {
    thu(() => {
      const ha = emDu({ caseS: true });
      mdk.apMonDangKy(P.mbManager, ha.id, ['listening', 'reading', 'writing1']);
      const mt3 = ha.mt(3);
      const moi = attempts.createAttempt(P.admin, { studentId: ha.sid, cycleId: ha.id, attemptNo: 4, periodId: mt3.planned_period_id });
      const s = dong(moi.id, 'speaking'), w = dong(moi.id, 'writing');
      assert(s.required === 0 && s.scope_reason === d.LY_DO_KHONG_HOC, `MT4 S: ${s.required}`);
      assert(w.required === 1 && w.bo_task === 'writing2', `MT4 W: ${w.required} ${w.bo_task}`);
      assert(coLech(ha.id) === 0, 'cờ ô chờ khớp');
      /* Lượt đã huỷ rồi tạo lại cùng số (hồi sinh) cũng theo môn đăng ký hiện tại. */
      conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(moi.id);
      mdk.apMonDangKy(P.mbManager, ha.id, ['listening', 'reading', 'writing1', 'writing2']);
      conn.prepare(`UPDATE attempt_skills SET required = 1, scope_reason = NULL, bo_task = NULL WHERE attempt_id = ?`).run(moi.id);   // như lượt huỷ trước khi đổi môn
      const lai = attempts.createAttempt(P.admin, { studentId: ha.sid, cycleId: ha.id, attemptNo: 4, periodId: mt3.planned_period_id });
      assert(lai.id === moi.id && dong(moi.id, 'speaking').required === 0 && dong(moi.id, 'writing').bo_task === null, `hồi sinh: S ${dong(moi.id, 'speaking').required}`);
      const thuong = get(`SELECT id FROM learning_cycles WHERE route IS NULL AND status = 'active' LIMIT 1`);
      assertThrows(() => mdk.apMonDangKy(P.admin, thuong.id, KHONG_S), /Fast Track/, 'lớp thường → 400');
      assertThrows(() => mdk.apMonDangKy(P.mbManager, ha.id, []), /ít nhất một môn/, 'rỗng → 400');
      assertThrows(() => mdk.apMonDangKy(P.mbManager, ha.id, ['writing']), /không hợp lệ/, 'lạ → 400');
      const luotThuong = get(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN programmes p ON p.code = c.programme_code
        WHERE p.scoring_mode = 'ratio' AND a.kind != 'mt0' AND a.status = 'planned' AND NOT EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id) LIMIT 1`);
      const k = skillSchedule.ensureSkillRows(luotThuong.id)[0].skill;
      assertThrows(() => skillSchedule.setSkillScope(P.admin, luotThuong.id, k, false, 'x', { khongMockLai: true }), /Lớp thường/, 'setSkillScope lớp thường 400');
    });
  });

  // ------------------------------------------------------------------ Task 3: API 3 nơi sửa + xem trước

  check('MDK-4a · Sửa thông tin HV: xem trước trả tóm tắt đúng số; lưu ghi nhật ký trước → sau; Lịch sử hiện "Môn học: Đủ môn → L · R · W2 · S"', () => {
    thu(() => {
      const huy = emDu({ caseW2: true });
      const xem = mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2, { xemTruoc: true });
      const chuaThiW = get(`SELECT COUNT(*) n FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id WHERE a.cycle_id = ? AND a.status != 'cancelled' AND k.skill = 'writing'
        AND NOT EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id AND x.skill IN ('writing1','writing2') AND x.band IS NOT NULL) AND k.sit_status IN ('scheduled','absent')`, huy.id).n;
      assert(xem.truoc === 'Đủ môn' && xem.sau === 'L · R · W2 · S' && xem.writing === 'W2' && xem.boKhoiDot === 0 && xem.giuDaCham === 0 && chuaThiW >= 1, `xem trước: ${JSON.stringify(xem)}`);
      const huyMt3 = huy.mt(3).attempt_no;
      assert(xem.dong.join(' | ') === `Bỏ W1 khỏi MT${huyMt3} (chưa có điểm) · lịch sử giữ | MT1 đã chấm giữ nguyên | Writing = W2 · Overall: Không đủ bộ môn`, `dòng: ${xem.dong.join(' | ')}`);
      mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      const ls = JSON.stringify(lichSu.lichSuSua(P.mbManager, huy.sid, {}));
      assert(/Môn học/.test(ls) && ls.includes('Đủ môn') && ls.includes('L · R · W2 · S'), `Lịch sử: ${ls.slice(0, 400)}`);
      /* Quyền như Sửa thông tin (mockup k4): GVCN lớp đổi được môn kể cả khi có bài chưa thi phải bỏ khỏi đợt. */
      const ha = emDu({ lop: t.classId('MB FT 101') });
      assert(mdk.apMonDangKy(P.coreTeacher, ha.id, KHONG_S).boKhoiDot >= 1, 'GVCN đổi môn');
    });
  });

  check('MDK-4b · Sửa cả lớp: 3 em, 1 em lộ trình không phải FT → lỗi tại dòng, 2 em lưu; rỗng môn → lỗi tại ô', () => {
    thu(() => {
      const L = lop();
      const a = emMoi(L), b = emMoi(L), c = emMoi(L, null);
      const du = suaCaLop.duLieuSuaCaLop(P.mbManager, L);
      const ra = du.rows.find((r: any) => r.studentId === a.sid), rc = du.rows.find((r: any) => r.studentId === c.sid);
      assert(du.coMonHoc && ra.monDangKy === null && ra.laFt && !rc.laFt, `dữ liệu panel: ${JSON.stringify({ coMonHoc: du.coMonHoc, ra, rc })}`);
      const rows = [a, b, c].map((x) => ({ studentId: x.sid, monDangKy: KHONG_S }));
      const xem = suaCaLop.xemTruocSuaCaLop(P.mbManager, L, { rows });
      const loi = xem.rows.filter((r: any) => r.issues.length);
      assert(loi.length === 1 && loi[0].studentId === c.sid && loi[0].issues[0].field === 'monDangKy' && /Fast Track/.test(loi[0].issues[0].message), `xem trước: ${JSON.stringify(xem.rows)}`);
      assert(xem.monHoc?.length === 2 && xem.monHoc.every((m: any) => m.sau === 'L · R · W1 · W2'), `tóm tắt môn: ${JSON.stringify(xem.monHoc)}`);
      const r = suaCaLop.luuSuaCaLop(P.mbManager, L, { rows: rows.slice(0, 2) });
      assert(r.daSua === 2, `lưu: ${JSON.stringify(r)}`);
      assert([a, b].every((x) => get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', x.cy).m === JSON.stringify(KHONG_S)), 'đã lưu 2 em');
      const rong = suaCaLop.xemTruocSuaCaLop(P.mbManager, L, { rows: [{ studentId: a.sid, monDangKy: [] }] });
      assert(/ít nhất một môn/.test(rong.rows[0].issues[0]?.message ?? ''), 'rỗng → lỗi tại ô');
    });
  });

  check('MDK-4c · Lộ trình mới: LT2 mặc định môn LT1; đổi môn → lộ trình mới có môn đó, MT1–MT3 theo môn; Hoàn tác không để lại dòng thừa', () => {
    thu(() => {
      const L = lop();
      const a = emMoi(L);
      conn.prepare(`UPDATE learning_cycles SET mon_dang_ky = ?, thi_that_l = 7, thi_that_r = 7, thi_that_w = 6.5, thi_that_s = 6.5, thi_that_ngay = ? WHERE id = ?`)
        .run(JSON.stringify(KHONG_S), addDays(TODAY, -3), a.cy);
      const xem = bt.xemTruocLoTrinhMoi(P.mbManager, a.cy, {});
      assert(JSON.stringify(xem.monDangKy) === JSON.stringify(KHONG_S) && / · L · R · W1 · W2 · Target /.test(xem.dong[0]), `mặc định LT1: ${JSON.stringify(xem)}`);
      const xem2 = bt.xemTruocLoTrinhMoi(P.mbManager, a.cy, { monDangKy: [] });
      assert(/ít nhất một môn/.test(xem2.loi ?? ''), 'rỗng → lỗi ở xem trước');
      bt.chonBuocTiep(P.mbManager, a.cy, { chon: 'lo_trinh_moi', monDangKy: CHI_W2 });
      const m = get(`SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1`, a.sid);
      assert(m.seq === 2 && m.mon_dang_ky === JSON.stringify(CHI_W2), `lộ trình mới: ${m.mon_dang_ky}`);
      const w = all(`SELECT k.bo_task, k.required FROM attempt_skills k JOIN assessment_attempts x ON x.id = k.attempt_id WHERE x.cycle_id = ? AND k.skill = 'writing'`, m.id);
      assert(w.length === 3 && w.every((x) => x.bo_task === 'writing1' && x.required === 1), `MT1–MT3 theo môn: ${JSON.stringify(w)}`);
      bt.boChonBuocTiep(P.mbManager, a.cy);
      const thua = get(`SELECT COUNT(*) n FROM attempt_skills k JOIN assessment_attempts x ON x.id = k.attempt_id WHERE x.cycle_id = ? AND x.status != 'cancelled' AND (k.required = 0 OR k.bo_task IS NOT NULL)`, m.id).n;
      assert(thua === 0, `Hoàn tác còn ${thua} dòng thừa`);
      assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', a.cy).m === JSON.stringify(KHONG_S), 'lộ trình cũ giữ môn');
    });
  });

  // ------------------------------------------------------------------ Rà PTA #595 (mục 3–13)
  const absence: any = await import('../fasttrack/absence.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const nguoiVai = (vai: string, cn: string | null) => {
    const r = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND ur.status = 'active' AND ${cn ? 'b.code = ?' : 'ur.branch_id IS NULL'} ORDER BY ur.user_id LIMIT 1`, ...(cn ? [vai, cn] : [vai]));
    assert(r, `seed thiếu ${vai} ${cn ?? ''}`);
    return loadPrincipal(r.id);
  };

  check('MDK-8 · bỏ W1 khi W2 đã chấm, W1 chưa: gắn bo_task W1 (không nợ W1 mãi), tóm tắt nói đúng; W1 đã chấm thì giữ', () => {
    thu(() => {
      const x = emDu();
      const mt3 = x.mt(3);
      attempts.saveScore(P.admin, mt3.id, 'writing2', { criteria: [6, 6, 6, 6] }, TODAY);
      const xem = mdk.apMonDangKy(P.mbManager, x.id, CHI_W2, { xemTruoc: true });
      assert(xem.dong.some((l: string) => l.startsWith('Bỏ W1 khỏi MT3')), `tóm tắt: ${xem.dong.join(' | ')}`);
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2);
      assert(dong(mt3.id, 'writing').bo_task === 'writing1', `MT3 bo_task ${dong(mt3.id, 'writing').bo_task}`);
      const y = emDu();
      attempts.saveScore(P.admin, y.mt(3).id, 'writing1', { criteria: [6, 6, 6, 6] }, TODAY);
      mdk.apMonDangKy(P.mbManager, y.id, CHI_W2);
      assert(dong(y.mt(3).id, 'writing').bo_task === null, 'W1 đã có điểm: không đánh dấu bỏ');
    });
  });

  check('MDK-9 · lượt mới: dòng đã có điểm không bị tắt; MT0 không áp môn (ledger)', () => {
    thu(() => {
      const x = emDu();
      conn.prepare('UPDATE learning_cycles SET mon_dang_ky = ? WHERE id = ?').run(JSON.stringify(KHONG_S), x.id);
      skillSchedule.apMonChoLuotMoi([x.mt(1).id]);
      assert(dong(x.mt(1).id, 'speaking').required === 1, 'MT1 S đã có điểm giữ bắt buộc');
      conn.prepare('UPDATE learning_cycles SET mon_dang_ky = NULL WHERE id = ?').run(x.id);
      const mt0 = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,0,'mt0',?,?, 'planned', ?)`)
        .run(x.id, x.sid, x.L, x.mt(3).planned_period_id, NOW).lastInsertRowid);
      skillSchedule.ensureSkillRows(mt0);
      mdk.apMonDangKy(P.mbManager, x.id, KHONG_S);
      assert(dong(mt0, 'speaking').required === 1, 'MT0 không áp môn');
    });
  });

  check('MDK-10 · lượt QL "Huỷ kỹ năng" cũ (không phải môn đăng ký): Overall "—", KHÔNG "Không đủ bộ môn"', () => {
    thu(() => {
      const x = emDu();
      const mt3 = x.mt(3);
      skillSchedule.setSkillScope(P.mbManager, mt3.id, 'speaking', false, 'Không học', { khongMockLai: true });   // QL gõ đúng chữ "Không học"
      diem(mt3.id, { listening: 6, reading: 6, writing1: 6, writing2: 6 });
      const r = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt3.id));
      assert(r.overall === null && !r.khongDuBoMon, `khongDuBoMon ${r.khongDuBoMon}`);
      const cells = attempts.skillCells(P.admin, mt3, [], [], TODAY, skillSchedule.ensureSkillRows(mt3.id));
      assert(!cells.find((c: any) => c.skill === 'speaking').khongHoc, 'ô QL huỷ không vẽ "Không học"');
    });
  });

  check('MDK-11 · lộ trình đã kết thúc → 400; JSON hỏng → câu tiếng Việt; Lộ trình mới sang lớp thường gửi môn → lỗi; chỉ đóng Case môn VỪA bỏ', () => {
    thu(() => {
      const x = emDu({ caseS: true });
      conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(x.id);
      assertThrows(() => mdk.apMonDangKy(P.mbManager, x.id, KHONG_S), /đã kết thúc/, 'lộ trình đã kết thúc');
      conn.prepare(`UPDATE learning_cycles SET status = 'active' WHERE id = ?`).run(x.id);
      assertThrows(() => mdk.apMonDangKy(P.mbManager, x.id, '{hỏng' as any), /Môn học không hợp lệ/, 'JSON hỏng');
      mdk.apMonDangKy(P.mbManager, x.id, KHONG_S);   // đóng Case S
      const moi = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, title, status, created_at, updated_at) VALUES (?,?,'speaking','speaking','S mở sau','open',?,?)`).run(x.sid, x.id, NOW, NOW).lastInsertRowid);
      const xem = mdk.apMonDangKy(P.mbManager, x.id, ['listening', 'reading', 'writing2'], { xemTruoc: true });
      assert(xem.caseDong === 0, `Case S mở sau lần bỏ trước không đóng lại: ${xem.caseDong}`);
      mdk.apMonDangKy(P.mbManager, x.id, ['listening', 'reading', 'writing2']);
      assert(get('SELECT status FROM sos_cases WHERE id = ?', moi).status !== 'done', 'Case S mới còn mở');
      const thuong = get(`SELECT c.id FROM classes c JOIN programmes p ON p.code = c.programme_code WHERE p.scoring_mode = 'ratio' AND c.status = 'active' AND c.branch_id = ? LIMIT 1`, MB);
      conn.prepare(`UPDATE learning_cycles SET thi_that_l = 7, thi_that_r = 7, thi_that_w = 6.5, thi_that_s = 6.5, thi_that_ngay = ? WHERE id = ?`).run(addDays(TODAY, -3), x.id);
      const lt = bt.xemTruocLoTrinhMoi(P.mbManager, x.id, { lopMoiId: thuong.id, monDangKy: KHONG_S });
      assert(/Fast Track|lớp/.test(lt.loi ?? '') && !lt.dong.some((l: string) => /đủ 5 môn/.test(l)), `lớp thường: ${lt.loi} · ${lt.dong[0]}`);
    });
  });

  check('MDK-12 · quyền đổi môn: QL, GVCN, TVV đổi được; GV bộ môn, CX 403; Sửa cả lớp: TVV chỉ cột Môn học', () => {
    thu(() => {
      const lopMb = t.classId('MB FT 101');
      const x = emDu({ lop: lopMb });
      const tvv = nguoiVai('consultant', 'MB'), cx = nguoiVai('cx', null);
      const gvbm = loadPrincipal(get(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
        AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) LIMIT 1`, lopMb, lopMb).id);
      assert(mdk.apMonDangKy(tvv, x.id, KHONG_S).doi, 'TVV đổi được');
      for (const [ai, ng] of [['GV bộ môn', gvbm], ['CX', cx]] as const) {
        let ma: any = null; try { mdk.apMonDangKy(ng, x.id, CHI_W2); } catch (e: any) { ma = e.status; }
        assert(ma === 403, `${ai}: ${ma}`);
      }
      const du = suaCaLop.duLieuSuaCaLop(tvv, lopMb);
      assert(du.coTheDoiMon && du.chiThongTin, 'TVV: mở cột Môn học, các cột ngoài thông tin vẫn khoá');
      assert(suaCaLop.xemTruocSuaCaLop(tvv, lopMb, { rows: [{ studentId: x.sid, monDangKy: CHI_W2 }] }).rows[0].issues.length === 0, 'TVV sửa cột Môn học');
      let ma: any = null; try { suaCaLop.xemTruocSuaCaLop(tvv, lopMb, { rows: [{ studentId: x.sid, startWeek: T2 }] }); } catch (e: any) { ma = e.status; }
      assert(ma === 403, `TVV Tuần bắt đầu vẫn 403: ${ma}`);
    });
  });

  check('MDK-13 · task Writing không học: chốt vắng "-" chỉ xét task đã học (kyNangXongThieu), báo vắng không ghi "-" vào task bỏ', () => {
    const k = [{ skill: 'writing', required: 1, sit_status: 'scheduled', absence_move_count: 0, bo_task: 'writing1' }];
    assert(d.kyNangXongThieu(k, [{ skill: 'writing2', band: null, no_show_cu: 1 }]).join() === 'writing', 'W2 "-" MT cũ → Writing xong thiếu');
    thu(() => {
      const x = emDu();
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2);
      absence.baoVang(P.admin, x.mt(3).id, 'writing', null, TODAY);
      const o = all(`SELECT skill FROM assessment_scores WHERE attempt_id = ? AND no_show_period_id IS NOT NULL`, x.mt(3).id).map((r) => r.skill);
      assert(o.join() === 'writing2', `ô "-": ${o.join()}`);
    });
  });
  check('MDK-14 · đổi môn bỏ task W1 khi W2 đã có điểm dưới kỳ vọng → tín hiệu / Case W2 ngay; xem trước không sinh; lưu lại không thêm; Sửa cả lớp 2 em mỗi em một', () => {
    thu(() => {
      /* Lượt MT3 đủ L R S + W2 thấp, W1 chưa chấm → chưa có tín hiệu W2 (lượt chưa đủ điểm). */
      const chuanBi = (x: any) => {
        const mt3 = x.mt(3);
        attempts.saveScore(P.admin, mt3.id, 'listening', { rawScore: 40 }, TODAY);
        attempts.saveScore(P.admin, mt3.id, 'reading', { rawScore: 40 }, TODAY);
        attempts.saveScore(P.admin, mt3.id, 'speaking', { criteria: [9, 9, 9, 9] }, TODAY);
        attempts.saveScore(P.admin, mt3.id, 'writing2', { criteria: [4, 4, 4, 4] }, TODAY);
        return mt3.id as number;
      };
      const soTH = (a: number) => get(`SELECT COUNT(*) n FROM case_signals WHERE attempt_id = ? AND skill = 'writing2' AND status != 'withdrawn'`, a).n as number;
      const soCase = (a: number) => get(`SELECT COUNT(*) n FROM sos_cases WHERE attempt_id = ? AND topic = 'writing2' AND status != 'done'`, a).n as number;
      const x = emDu();
      const a = chuanBi(x);
      assert(soTH(a) + soCase(a) === 0, `trước đổi môn chưa có tín hiệu W2: ${soTH(a)} / ${soCase(a)}`);
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2, { xemTruoc: true });
      assert(soTH(a) + soCase(a) === 0, 'xem trước không sinh tín hiệu / Case');
      mdk.apMonDangKy(P.mbManager, x.id, CHI_W2);
      const th = soTH(a), ca = soCase(a);
      assert(th + ca >= 1 && ca <= 1, `sau đổi môn phải có tín hiệu / Case W2: ${th} / ${ca}`);
      attempts.saveScore(P.admin, a, 'writing2', { criteria: [4, 4, 4, 4] }, TODAY);
      assert(soTH(a) === th && soCase(a) === ca, `lưu lại W2 không thêm: ${soTH(a)} / ${soCase(a)}`);
      /* Sửa cả lớp: hai em cùng lô. */
      const L = lop();
      const e1 = emDu({ lop: L }), e2 = emDu({ lop: L });
      const ds = [e1, e2].map(chuanBi);
      suaCaLop.luuSuaCaLop(P.mbManager, L, { rows: [e1, e2].map((e) => ({ studentId: e.sid, monDangKy: CHI_W2 })) });
      for (const id of ds) assert(soTH(id) + soCase(id) >= 1 && soCase(id) <= 1, `Sửa cả lớp lượt ${id}: ${soTH(id)} / ${soCase(id)}`);
    });
  });
}
