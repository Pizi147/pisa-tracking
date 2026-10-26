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
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const { demLuotLechCo, capNhatConOCho } = await import('../fasttrack/conOCho.ts');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
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
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
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
    assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ninh.id).m === JSON.stringify(KHONG_S) && dong(ninh.mt(4).id, 'speaking').scope_reason === 'Không học', 'Ninh');
  });

  // ------------------------------------------------------------------ Task 2: áp môn vào lượt + chấm + nợ
  check('MDK-3a · không học S: MT chưa thi S → required 0 "Không học"; MT đã có điểm S giữ; ô S không chờ / không nợ; Overall null + "Không đủ bộ môn"; SOS không xét S', () => {
    thu(() => {
      const ha = em('Trần Thu Hà');
      const mt1 = ha.mt(1), mt3 = ha.mt(3);
      const kq = mdk.apMonDangKy(P.mbManager, ha.id, KHONG_S);
      assert(get('SELECT mon_dang_ky m FROM learning_cycles WHERE id = ?', ha.id).m === JSON.stringify(KHONG_S), 'lưu môn');
      const s3 = dong(mt3.id, 'speaking');
      assert(s3.required === 0 && s3.scope_reason === 'Không học', `MT3 S: ${s3.required} ${s3.scope_reason}`);
      assert(dong(mt1.id, 'speaking').required === 1, 'MT1 đã có điểm S: giữ');
      assert(get(`SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking' AND band IS NOT NULL`, mt1.id).n === 1, 'điểm S cũ còn');
      assert(kq.boKhoiDot >= 1 && kq.giuDaCham >= 1, `tóm tắt: ${JSON.stringify(kq)}`);
      assert(demLuotLechCo() === 0, 'cờ ô chờ khớp');
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
      const huy = em('Lê Quang Huy');
      const mt1 = huy.mt(1), mt3 = huy.mt(3);
      const kq = mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      assert(kq.writing === 'W2' && kq.khongDuBoMon, `tóm tắt ${JSON.stringify(kq)}`);   // mockup k4: Writing = W2 · Overall Không đủ bộ môn
      assert(dong(mt3.id, 'writing').bo_task === 'writing1' && dong(mt3.id, 'writing').required === 1, 'MT3: bỏ task W1, Writing vẫn học');
      assert(dong(mt1.id, 'writing').bo_task === null, 'MT1 đã chấm: không đổi');
      const cells = attempts.skillCells(P.admin, mt3, [], attempts.skipsOf(mt3.id), TODAY, skillSchedule.ensureSkillRows(mt3.id));
      assert(cells.find((c: any) => c.skill === 'writing1').progress === 'skipped' && cells.find((c: any) => c.skill === 'writing1').khongHoc && cells.find((c: any) => c.skill === 'writing2').required, 'ô W1 Không học, W2 bắt buộc');
      assertThrows(() => attempts.saveScore(P.admin, mt3.id, 'writing1', { band: 6 }, addDays(TODAY, 200)), /không học/, 'nhập W1 bị chặn');
      assert(demLuotLechCo() === 0, 'cờ ô chờ khớp');
      diem(mt3.id, { listening: 6, reading: 6, writing2: 7, speaking: 6 });
      capNhatConOCho([mt3.id]);
      assert(get('SELECT o_cho_tu FROM assessment_attempts WHERE id = ?', mt3.id).o_cho_tu === null, 'đủ L R W2 S → không còn ô chờ (W1 không chờ)');
      const r = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt3.id));
      assert(r.bands.writing === 7 && r.overall === null && r.chot && r.khongDuBoMon, `Writing ${r.bands.writing}, Overall ${r.overall}`);
      const s1 = all('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?', mt1.id);
      const b = (k: string) => s1.find((x) => x.skill === k).band;
      const r1 = attempts.resultOf(get('SELECT * FROM assessment_attempts WHERE id = ?', mt1.id));
      assert(r1.bands.writing === Math.round(((b('writing1') + b('writing2') * 2) / 3) * 2) / 2, 'MT1 giữ công thức W1 + W2');
    });
  });

  check('MDK-3c · bỏ S khi Case S mở + PA chạy → Case đóng "Không còn học môn", PA cancelled (không vào Hiệu quả PA); bật lại S → lượt chưa thi required 1, Case không mở lại', () => {
    thu(() => {
      const ha = em('Trần Thu Hà');
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
      const huy = em('Lê Quang Huy');
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
      const ha = em('Trần Thu Hà');
      mdk.apMonDangKy(P.mbManager, ha.id, ['listening', 'reading', 'writing1']);
      const mt3 = ha.mt(3);
      const moi = attempts.createAttempt(P.admin, { studentId: ha.sid, cycleId: ha.id, attemptNo: 4, periodId: mt3.planned_period_id });
      const s = dong(moi.id, 'speaking'), w = dong(moi.id, 'writing');
      assert(s.required === 0 && s.scope_reason === 'Không học', `MT4 S: ${s.required}`);
      assert(w.required === 1 && w.bo_task === 'writing2', `MT4 W: ${w.required} ${w.bo_task}`);
      assert(demLuotLechCo() === 0, 'cờ ô chờ khớp');
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
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const bt: any = await import('../loTrinh/buocTiep.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
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

  check('MDK-4a · Sửa thông tin HV: xem trước trả tóm tắt đúng số; lưu ghi nhật ký trước → sau; Lịch sử hiện "Môn học: Đủ môn → L · R · W2 · S"', () => {
    thu(() => {
      const huy = em('Lê Quang Huy');
      const xem = mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2, { xemTruoc: true });
      const chuaThiW = get(`SELECT COUNT(*) n FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id WHERE a.cycle_id = ? AND a.status != 'cancelled' AND k.skill = 'writing'
        AND NOT EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id AND x.skill IN ('writing1','writing2') AND x.band IS NOT NULL) AND k.sit_status IN ('scheduled','absent')`, huy.id).n;
      assert(xem.truoc === 'Đủ môn' && xem.sau === 'L · R · W2 · S' && xem.writing === 'W2' && xem.boKhoiDot === 0 && xem.giuDaCham === 0 && chuaThiW >= 1, `xem trước: ${JSON.stringify(xem)}`);
      const huyMt3 = huy.mt(3).attempt_no;
      assert(xem.dong.join(' | ') === `Bỏ W1 khỏi MT${huyMt3} (chưa có điểm) · lịch sử giữ | MT1, MT2 đã chấm giữ nguyên | Writing = W2 · Overall: Không đủ bộ môn`, `dòng: ${xem.dong.join(' | ')}`);
      mdk.apMonDangKy(P.mbManager, huy.id, CHI_W2);
      const ls = JSON.stringify(lichSu.lichSuSua(P.mbManager, huy.sid, {}));
      assert(/Môn học/.test(ls) && ls.includes('Đủ môn') && ls.includes('L · R · W2 · S'), `Lịch sử: ${ls.slice(0, 400)}`);
      /* Quyền như Sửa thông tin (mockup k4): GVCN lớp đổi được môn kể cả khi có bài chưa thi phải bỏ khỏi đợt. */
      const ha = em('Trần Thu Hà');
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
}
