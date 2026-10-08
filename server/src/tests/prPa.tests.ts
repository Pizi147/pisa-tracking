/**
 * PR-PA (§8, X1) — PA đồng bộ một mẫu. Task 1: migrate `so_buoi` + cột nhật ký, luật thuần `paDongBo`, MỘT hàm tạo PA (`chenPa`) cho mọi đường.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPaTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const taoPa: any = await import('../cases/taoPa.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const week: any = await import('../platform/week.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { migratePrPa } = await import('../migrate/prPa.ts');
  const { default: SqliteDb } = await import('libsql');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nPR-PA · PA đồng bộ một mẫu — Task 1 (migrate, luật thuần, chenPa)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): { status: number | null; msg: string } => {
    try { fn(); return { status: null, msg: 'không ném' }; } catch (e: any) { return { status: e?.status ?? null, msg: String(e?.message ?? e) }; }
  };
  /** Cùng dạng: không cả tài khoản lẫn tên; Tự học không người; số buổi chỉ ở loại có số buổi, trong 1–60. */
  const cungDang = (iv: any) => !(iv.performer_user_id && iv.performer_name)
    && (iv.kind !== 'self_study' || (iv.performer_user_id === null && iv.performer_name === null))
    && (iv.so_buoi === null || (d.coSoBuoi(iv.kind) && iv.so_buoi >= 1 && iv.so_buoi <= 60));

  check('PA0 · luật thuần: coSoBuoi / coNguoiDay / nhanNguoiDay · kiemSoBuoiPa · kiemSoBuoiTuan · demBuoi', () => {
    assert(['tutor', 'self_study', 'bo_tro', 'bo_tro_mien_phi'].every(d.coSoBuoi) && !d.coSoBuoi('teaching_adjust') && !d.coSoBuoi('extra_support'), 'coSoBuoi');
    assert(!d.coNguoiDay('self_study') && d.coNguoiDay('tutor') && d.coNguoiDay('teaching_adjust'), 'coNguoiDay');
    assert(d.nhanNguoiDay('tutor') === 'Người dạy' && d.nhanNguoiDay('bo_tro') === 'Người dạy' && d.nhanNguoiDay('bo_tro_mien_phi') === 'Người dạy'
      && d.nhanNguoiDay('teaching_adjust') === 'Người thực hiện', 'nhanNguoiDay');
    const L = 'Từ 1 đến 60 buổi, hoặc để trống';
    assert(d.kiemSoBuoiPa(null) === null && d.kiemSoBuoiPa('') === null && d.kiemSoBuoiPa(1) === null && d.kiemSoBuoiPa('60') === null, 'hợp lệ');
    assert([0, 61, 2.5, 'abc', -1].every((v) => d.kiemSoBuoiPa(v) === L), 'ngoài 1–60');
    assert(d.kiemSoBuoiPa(2, 3) === 'Đã dạy 3 buổi — Số buổi từ 3 trở lên, hoặc để trống' && d.kiemSoBuoiPa(3, 3) === null && d.kiemSoBuoiPa(null, 3) === null, 'nhỏ hơn đã dạy');
    assert(d.kiemSoBuoiTuan(0) === null && d.kiemSoBuoiTuan('60') === null && [null, '', 61, -1, 1.5].every((v) => d.kiemSoBuoiTuan(v) !== null), 'kiemSoBuoiTuan');
    const k = (a: number, b: number) => JSON.stringify(d.demBuoi(a, b));
    assert(k(5, 10) === JSON.stringify({ da: 5, tong: 10, con: 5, tt: 'chua' }) && k(10, 10) === JSON.stringify({ da: 10, tong: 10, con: 0, tt: 'du' })
      && k(12, 10) === JSON.stringify({ da: 12, tong: 10, con: 0, tt: 'vuot' }), 'demBuoi');
  });

  // ------------------------------------------------------------------ PA1 · chenPa + mọi đường cùng dạng
  const caseThu = (ten: string) => {
    const cid = classId('MB FT 101');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: `PA ${ten}`, target: 7, email: 'hv@demo.test' }], idempotencyKey: `pa-${ten}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', `PA ${ten}`).id;
    const c = cases.reportIssue(P.lrTeacher, {
      title: `PA thử ${ten}`, primaryCode: 'student.listening.technique', studentId: sid, topic: 'listening',
      summary: 'Case dựng cho phép kiểm PR-PA.', idempotencyKey: `pa-case-${ten}`, parallel: true,
    }) as any;
    return c.id as number;
  };

  check('PA1a · chenPa: chèn theo lô trả id đúng thứ tự; số buổi NULL với loại không có số buổi; Tự học bỏ người; ngoài 1–60 / cả tài khoản lẫn tên → 400', () => {
    const c = caseThu('LO');
    const base = { caseId: c, status: 'planned' };
    const ids: number[] = taoPa.chenPa(conn, [
      { ...base, kind: 'tutor', description: 'PA lô 1', soBuoi: 10, performerUserId: P.lrTeacher.userId },
      { ...base, kind: 'teaching_adjust', description: 'PA lô 2', soBuoi: 5, performerName: 'Cô Lan' },
      { ...base, kind: 'self_study', description: 'PA lô 3', soBuoi: 8, performerUserId: P.lrTeacher.userId },
    ]);
    assert(ids.length === 3 && ids[0] < ids[1] && ids[1] < ids[2], `id: ${ids}`);
    const r = ids.map((id) => get('SELECT * FROM case_interventions WHERE id = ?', id));
    assert(r.map((x) => x.description).join() === 'PA lô 1,PA lô 2,PA lô 3', 'thứ tự id ≠ thứ tự dòng');
    assert(r[0].so_buoi === 10 && r[0].performer_user_id === P.lrTeacher.userId && r[0].performer_name === null, JSON.stringify(r[0]));
    assert(r[1].so_buoi === null && r[1].performer_name === 'Cô Lan' && r[1].performer_user_id === null, JSON.stringify(r[1]));
    assert(r[2].so_buoi === 8 && r[2].performer_user_id === null && r[2].performer_name === null, JSON.stringify(r[2]));
    assert(r.every(cungDang), 'dạng');
    for (const so of [0, 61]) {
      const e = maLoi(() => taoPa.chenPa(conn, [{ ...base, kind: 'tutor', description: 'PA sai', soBuoi: so }]));
      assert(e.status === 400 && e.msg.includes('Từ 1 đến 60 buổi'), `số buổi ${so}: ${JSON.stringify(e)}`);
    }
    const e2 = maLoi(() => taoPa.chenPa(conn, [{ ...base, kind: 'tutor', description: 'PA sai', performerUserId: P.lrTeacher.userId, performerName: 'Cô Lan' }]));
    assert(e2.status === 400, `cả hai người: ${JSON.stringify(e2)}`);
    assert(!get(`SELECT 1 FROM case_interventions WHERE description = 'PA sai'`), 'dòng sai vẫn được ghi');
  });

  check('PA1b · tay: recordIntervention Tutor 10 buổi lưu so_buoi; Điều chỉnh cách dạy không số buổi', () => {
    const c = caseThu('TAY');
    cases.recordIntervention(P.lrTeacher, c, { kind: 'tutor', description: 'Tutor nghe chép 10 buổi', soBuoi: '10', performerName: 'Tutor ngoài', status: 'started', startedDate: TODAY });
    cases.recordIntervention(P.lrTeacher, c, { kind: 'teaching_adjust', description: 'Đổi cách chữa bài nghe', performerSelf: true, status: 'started', startedDate: TODAY });
    const r = all('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id', c);
    assert(r.length === 2 && r[0].so_buoi === 10 && r[0].performer_name === 'Tutor ngoài' && r[1].so_buoi === null && r[1].performer_user_id === P.lrTeacher.userId, JSON.stringify(r));
    assert(r.every(cungDang), 'dạng');
  });

  check('PA1c · quy chế SOS (Mock FT): PA điền sẵn cùng dạng — Tự học không người, không số buổi', () => {
    const cid = classId('MB FT 101');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: 'PA SOS', target: 7, email: 'hv@demo.test' }], idempotencyKey: 'pa-sos' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', 'PA SOS').id;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id;
    boLichTuTao(conn, cy);
    const a: any = luotThu(conn, attemptsSvc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: cid, no: 1,
      periodId: week.ensurePeriod(week.mondayOf(t.addDays(TODAY, -14))).id });
    attemptsSvc.saveScore(P.admin, a.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(5) });
    const pa = all(`SELECT iv.* FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id = ? AND iv.preset = 1`, sid);
    assert(pa.length === 1 && pa[0].kind === 'self_study' && pa[0].so_buoi === null && cungDang(pa[0]), JSON.stringify(pa));
    /* Lượt lên SOS 3 → PA chờ xác nhận đổi sang Tutor: có lại Người dạy (GVBM đúng kỹ năng), vẫn cùng dạng. */
    for (const k of ['reading', 'speaking']) attemptsSvc.saveScore(P.admin, a.id, k, k === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(5) } : { criteria: [5, 5, 5, 5] });
    const sau = get('SELECT * FROM case_interventions WHERE id = ?', pa[0].id);
    assert(sau.kind === 'tutor' && sau.performer_user_id === P.lrTeacher.userId && cungDang(sau), JSON.stringify(sau));
  });

  check('PA1d · bổ trợ Giữa khoá (BE Progress Test trượt W): PA bo_tro cùng dạng, người dạy là tài khoản', () => {
    const cid = classId('MB BE 08');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: 'PA BE GK', email: 'hv@demo.test' }], idempotencyKey: 'pa-be-gk' });
    regular.planRegularTests(P.admin, cid);
    const sid = get('SELECT id FROM students WHERE full_name = ?', 'PA BE GK').id;
    const pt = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'`, sid).id;
    for (const [k, v] of Object.entries({ listening: 18, reading: 18, writing: 10, speaking: 18 })) regular.saveRegularScore(P.admin, pt, k, { score: v, total: 20, lyDo: 'PR-PA' });
    const pa = all(`SELECT iv.* FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id = ? AND iv.kind = 'bo_tro'`, sid);
    assert(pa.length === 1 && pa[0].performer_user_id !== null && pa[0].so_buoi === null && cungDang(pa[0]), JSON.stringify(pa));
  });

  // Chuyển lớp Cuối khoá (khuôn prS5fA): lớp mới, học viên, bài Final, lệnh chuyển.
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  let seq = 0;
  const lopMoi = (kind: string, ft: boolean, tuanHienTai: number) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-PA${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const ganGv = (lop: number, userId: number, skill: string) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?, 0, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, skill, new Date().toISOString()).lastInsertRowid as number;
  const hocVien = (lop: number, ma: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-PA${seq}`, `Hoc vien PA${seq}`, `hoc vien pa${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`)
      .run(sid, ma, TODAY, now);
    return sid;
  };
  const cuoiKhoa = (lop: number, sid: number, diem: number[]) => {
    regular.planRegularTests(P.admin, lop, { studentIds: [sid], kinds: ['final'] });
    const a = get(`SELECT * FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid, lop);
    ['listening', 'reading', 'writing', 'speaking'].forEach((k, i) => regular.saveRegularScore(P.admin, a.id, k, { score: diem[i], total: 25 }));
  };
  const chuyen = (nguon: number, sid: number, huong: string, dich: number, o: Record<string, unknown> = {}) => {
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE trang_thai = 'cho'`).run();
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong, toClassId: dich, tuan: THU_HAI, ...o }] });
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally { setConfig('demo_date', cu); }
    assert(get(`SELECT trang_thai FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, sid).trang_thai === 'da_chuyen', 'chưa chuyển');
  };
  const GV = (conn.prepare(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 2`).all(MB) as any[]).map((r) => r.user_id as number);
  const paCuaEm = (sid: number, kind: string) => all(`SELECT iv.* FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id = ? AND iv.kind = ?`, sid, kind);
  const ids: { mienPhi: number[]; tutor: number[] } = { mienPhi: [], tutor: [] };

  check('PA1e · bổ trợ miễn phí (FOU 64% → BE): so_buoi = số buổi Mini Test, cùng dạng', () => {
    const nguon = lopMoi('FOU', false, 9), dich = lopMoi('BE', false, 1);
    const sid = hocVien(nguon, 'FOU');
    cuoiKhoa(nguon, sid, [16, 16, 16, 16]);
    chuyen(nguon, sid, 'len_lop', dich);
    const pa = paCuaEm(sid, 'bo_tro_mien_phi');
    const mt = get('SELECT so_buoi, nhom_bo_tro FROM mini_test WHERE student_id = ?', sid);
    assert(pa.length >= 1 && mt && pa.every((x) => x.so_buoi === mt.so_buoi && x.nhom_bo_tro === mt.nhom_bo_tro && cungDang(x)), `${JSON.stringify(pa)} · ${JSON.stringify(mt)}`);
    ids.mienPhi = pa.map((x) => x.id);
  });

  check('PA1f · Tutor kỳ vọng đầu ra (BE → FT, Trung tâm): so_buoi 10, Người dạy = GV cũ dạy kỹ năng đó ở lớp BE (phân công đang hiệu lực); hết phân công → NULL (X1)', () => {
    const chay = (conPhanCong: boolean) => {
      const be = lopMoi('BE', false, 11), ft = lopMoi('FT', true, 1);
      const pc = ganGv(be, GV[0], 'reading');
      ganGv(be, GV[1], 'listening');
      if (!conPhanCong) conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE id = ?`).run(t.addDays(TODAY, -30), pc);
      const sid = hocVien(be, 'BE');
      cuoiKhoa(be, sid, [20, 20, 20, 20]);
      ck.ghiKetLuanFt(P.mbManager, sid, { dat: false, nguyenNhan: 'trung_tam', mon: ['reading'] });
      chuyen(be, sid, 'fast_track', ft, { mucTieu: 6 });
      return paCuaEm(sid, 'tutor');
    };
    const co = chay(true);
    assert(co.length === 1 && co[0].so_buoi === 10 && co[0].performer_user_id === GV[0] && co[0].performer_name === null && cungDang(co[0]), JSON.stringify(co));
    const het = chay(false);
    assert(het.length === 1 && het[0].so_buoi === 10 && het[0].performer_user_id === null && het[0].performer_name === null, JSON.stringify(het));
    ids.tutor = [co[0].id, het[0].id];
  });

  // ------------------------------------------------------------------ PA2 · migrate
  check('PA2 · migratePrPa: thêm 6 cột, chạy hai lần không lỗi; điền bù bo_tro_mien_phi ← mini_test.so_buoi và Tutor kỳ vọng ← 10 CHỈ lần vừa thêm cột; lần sau Số buổi đã xoá giữ trống', () => {
    const coCot = (c: any, bang: string, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((x) => x.name === cot);
    const tam = new SqliteDb(':memory:');
    tam.exec(`CREATE TABLE sos_cases (id INTEGER PRIMARY KEY, origin_kind TEXT, title TEXT);
      CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER, kind TEXT, nhom_bo_tro TEXT);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY);
      CREATE TABLE case_intervention_revisions (id INTEGER PRIMARY KEY);
      CREATE TABLE mini_test (id INTEGER PRIMARY KEY, nhom_bo_tro TEXT, so_buoi INTEGER);
      INSERT INTO sos_cases VALUES (1, 'chuyen_cap', 'Kỳ vọng đầu ra chưa đạt · Reading'), (2, 'chuyen_cap', 'Final Test BE · W không đạt'), (3, 'mock', 'Kỳ vọng đầu ra x');
      INSERT INTO mini_test VALUES (1, 'mt:7', 4);
      INSERT INTO case_interventions VALUES (1, 1, 'tutor', NULL), (2, 2, 'tutor', NULL), (3, 3, 'tutor', NULL), (4, 2, 'bo_tro_mien_phi', 'mt:7'), (5, 2, 'bo_tro_mien_phi', 'mt:9'), (6, 1, 'tutor', NULL);`);
    const a: string[] = []; migratePrPa(tam, a);
    const cot: [string, string][] = [['case_interventions', 'so_buoi'], ['case_followups', 'so_buoi'], ['case_intervention_revisions', 'old_so_buoi'],
      ['case_intervention_revisions', 'new_so_buoi'], ['case_intervention_revisions', 'old_started_date'], ['case_intervention_revisions', 'new_started_date']];
    assert(cot.every(([b, c]) => coCot(tam, b, c)), `thiếu cột: ${a.join('; ')}`);
    const so = () => (tam.prepare('SELECT id, so_buoi FROM case_interventions ORDER BY id').all() as any[]).map((r) => r.so_buoi).join();
    assert(so() === '10,,,4,,', `điền bù (chỉ PA Tutor đầu tiên của Case kỳ vọng = nguonTao ky_vong): ${so()}`);
    /* Lần 2 (cột đã có): người dùng xoá Số buổi (Sửa PA "để trống") → migrate KHÔNG điền lại. */
    tam.prepare('UPDATE case_interventions SET so_buoi = NULL WHERE id IN (1, 4)').run();
    const b: string[] = []; migratePrPa(tam, b);
    assert(b.length === 0 && so() === ',,,,,', `lần 2: ${b.join('; ')} · ${so()}`);
    tam.close();
    /* DB thật (schema.sql đã có cột): xoá số buổi của PA vừa tạo ở PA1e/PA1f → migrate không đổi gì, vẫn trống. */
    assert(cot.every(([bg, c]) => coCot(conn, bg, c)), 'schema.sql thiếu cột PR-PA');
    const moi = [...ids.mienPhi, ...ids.tutor];
    assert(moi.length >= 3, 'PA1e/PA1f chưa chạy');
    conn.prepare(`UPDATE case_interventions SET so_buoi = NULL WHERE id IN (${moi.map(() => '?').join(',')})`).run(...moi);
    const c: string[] = []; migratePrPa(conn, c);
    const sau = moi.map((id) => get('SELECT so_buoi FROM case_interventions WHERE id = ?', id).so_buoi);
    assert(c.length === 0 && sau.every((x) => x === null), `DB thật: ${JSON.stringify(sau)} · ${c.join('; ')}`);
  });

  // ------------------------------------------------------------------ PA3 · recordIntervention: người không bắt buộc, số buổi
  check('PA3 · recordIntervention không người vẫn lưu; số buổi 0 / 61 / với loại không có số buổi → 400', () => {
    const c = caseThu('PA3');
    cases.recordIntervention(P.lrTeacher, c, { kind: 'tutor', description: 'Tutor chưa chọn người dạy', status: 'started', startedDate: TODAY });
    const r = get('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1', c);
    assert(r && r.performer_user_id === null && r.performer_name === null && r.so_buoi === null, JSON.stringify(r));
    const ghi = (kind: string, soBuoi: unknown) => maLoi(() => cases.recordIntervention(P.lrTeacher, c, { kind, description: 'PA thử số buổi sai', soBuoi, performerSelf: true, status: 'started', startedDate: TODAY }));
    for (const so of [0, 61, '2.5']) {
      const e = ghi('tutor', so);
      assert(e.status === 400 && e.msg.includes('Từ 1 đến 60 buổi, hoặc để trống'), `tutor ${so}: ${JSON.stringify(e)}`);
    }
    const e = ghi('teaching_adjust', 5);
    assert(e.status === 400, `loại không có số buổi: ${JSON.stringify(e)}`);
    assert(!get(`SELECT 1 FROM case_interventions WHERE case_id = ? AND description = 'PA thử số buổi sai'`, c), 'PA sai vẫn được ghi');
  });

  // ------------------------------------------------------------------ Task 2 · Kết quả có số buổi, Sửa PA, Điều chỉnh cùng ô
  console.log('\nPR-PA · Task 2 (Kết quả có số buổi, Sửa PA, Điều chỉnh)');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const { can } = await import('../permissions.ts');
  const KQ = { decision: 'keep', outcome: 'partial', note: 'Em nghe chép đều hơn tuần trước' };
  const GV_L = P.lrTeacher.userId;
  /** Case mới + PA Tutor 10 buổi, Người dạy = GV Listening, bắt đầu 3 tuần trước. */
  const tutor10 = (ten: string, o: Record<string, unknown> = {}) => {
    const c = caseThu(ten);
    const dto = cases.recordIntervention(P.lrTeacher, c, {
      kind: 'tutor', description: 'Tutor nghe chép 10 buổi', soBuoi: 10, performerUserId: GV_L, status: 'started', startedDate: t.addDays(TODAY, -21), ...o,
    }) as any;
    return { c, iv: Math.max(...dto.interventions.map((x: any) => x.id)) as number };
  };
  const paDto = (c: number, iv: number) => (cases.caseDetail(P.lrTeacher, c) as any).interventions.find((x: any) => x.id === iv);
  const fuCua = (iv: number) => all('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id', iv);
  const revCua = (iv: number) => all('SELECT * FROM case_intervention_revisions WHERE intervention_id = ? ORDER BY id', iv);

  check('PA4 · Kết quả: PA có Số buổi → "Số buổi tuần này" bắt buộc 0–60; Người dạy tuần này không bắt buộc (PR-CT2); đếm 3 + 3 + 2 + 0 = 8/10 qua 4 tuần', () => {
    const { c, iv } = tutor10('KQ');
    const thieu = maLoi(() => cases.updateResult(P.lrTeacher, iv, { ...KQ, nguoiDay: { performerUserId: GV_L } }));
    assert(thieu.status === 400 && thieu.msg.includes('Số buổi tuần này'), `thiếu số buổi: ${JSON.stringify(thieu)}`);
    const vuot = maLoi(() => cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 61, nguoiDay: { performerUserId: GV_L } }));
    assert(vuot.status === 400 && vuot.msg.includes('Từ 0 đến 60 buổi'), `61: ${JSON.stringify(vuot)}`);
    assert(fuCua(iv).length === 0, 'lỗi mà vẫn ghi');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 3, observedOn: t.addDays(TODAY, -21) });   // PR-CT2: 3 buổi không người dạy → lưu
    assert(fuCua(iv)[0].so_buoi === 3 && fuCua(iv)[0].phu_trach_user_id === null && fuCua(iv)[0].phu_trach_ten === null, 'không người dạy');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 3, nguoiDay: { performerUserId: GV_L }, observedOn: t.addDays(TODAY, -14) });
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: '2', nguoiDay: { performerName: 'Tutor ngoài Hà' }, observedOn: t.addDays(TODAY, -7) });
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 0, nguoiDay: null });   // 0 = em nghỉ: không cần người dạy
    const f = fuCua(iv);
    assert(f.map((x) => x.so_buoi).join() === '3,3,2,0', `so_buoi: ${f.map((x) => x.so_buoi)}`);
    assert(f[1].phu_trach_user_id === GV_L && f[2].phu_trach_ten === 'Tutor ngoài Hà' && f[3].phu_trach_user_id === null && f[3].phu_trach_ten === null, JSON.stringify(f));
    const pa = paDto(c, iv);
    assert(pa.soBuoi === 10 && pa.daDay === 8, `DTO: soBuoi ${pa.soBuoi} daDay ${pa.daDay}`);
    const ten = get('SELECT full_name FROM users WHERE id = ?', GV_L).full_name;
    const fd = (cases.caseDetail(P.lrTeacher, c) as any).followups.filter((x: any) => x.interventionId === iv);
    assert(fd.length === 4 && fd.every((x: any) => 'soBuoi' in x && 'nguoiDay' in x && !('phuTrach' in x)), JSON.stringify(fd));
    assert(fd.find((x: any) => x.soBuoi === 3).nguoiDay === ten && fd.find((x: any) => x.soBuoi === 2).nguoiDay === 'Tutor ngoài Hà', JSON.stringify(fd));
    /* PA không có Số buổi: không bắt; Tự học (có Số buổi) không có người dạy — gửi kèm bị bỏ qua, không bắt người. */
    const thuong = cases.recordIntervention(P.lrTeacher, c, { kind: 'teaching_adjust', description: 'Đổi cách chữa bài nghe', status: 'started', startedDate: TODAY }) as any;
    const ta = Math.max(...thuong.interventions.map((x: any) => x.id));
    cases.updateResult(P.lrTeacher, ta, KQ);
    assert(fuCua(ta)[0].so_buoi === null && paDto(c, ta).soBuoi === null && paDto(c, ta).daDay === 0, 'PA không số buổi');
    const tu = cases.recordIntervention(P.lrTeacher, c, { kind: 'self_study', description: 'Tự học nghe chép 8 buổi', soBuoi: 8, status: 'started', startedDate: TODAY }) as any;
    const ss = Math.max(...tu.interventions.map((x: any) => x.id));
    cases.updateResult(P.lrTeacher, ss, { ...KQ, soBuoi: 2, nguoiDay: { performerUserId: GV_L } });
    const fs = fuCua(ss)[0];
    assert(fs.so_buoi === 2 && fs.phu_trach_user_id === null && fs.phu_trach_ten === null, `Tự học: ${JSON.stringify(fs)}`);
  });

  check('PA5 · Sửa PA: Số buổi < đã dạy → 400; Ngày bắt đầu khoá sau Kết quả; Loại không đổi; nhật ký sua_pa cũ → mới + audit; không đổi gì → không ghi; PA kết thúc → 400; người ngoài quyền → 403', () => {
    const { c, iv } = tutor10('SUA');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 5, nguoiDay: { performerUserId: GV_L } });
    const nho = maLoi(() => cases.suaPa(P.lrTeacher, iv, { soBuoi: 4 }));
    assert(nho.status === 400 && nho.msg.includes('Đã dạy 5 buổi'), `số buổi < đã dạy: ${JSON.stringify(nho)}`);
    const ngay = maLoi(() => cases.suaPa(P.lrTeacher, iv, { startedDate: t.addDays(TODAY, -20) }));
    assert(ngay.status === 400 && ngay.msg.includes('Ngày bắt đầu'), `ngày bắt đầu sau kết quả: ${JSON.stringify(ngay)}`);
    const loai = maLoi(() => cases.suaPa(P.lrTeacher, iv, { kind: 'self_study' }));
    assert(loai.status === 400, `đổi loại: ${JSON.stringify(loai)}`);
    assert(revCua(iv).length === 0, 'lỗi mà vẫn ghi nhật ký');
    const ra = cases.suaPa(P.lrTeacher, iv, { description: 'Tutor nghe chép 12 buổi, thêm Section 4', soBuoi: 12, performerName: 'Tutor ngoài Lan' }) as any;
    const r = revCua(iv);
    assert(r.length === 1 && r[0].source === 'sua_pa' && r[0].old_so_buoi === 10 && r[0].new_so_buoi === 12
      && r[0].old_performer_user_id === GV_L && r[0].new_performer_name === 'Tutor ngoài Lan' && r[0].new_performer_user_id === null
      && r[0].old_description === 'Tutor nghe chép 10 buổi' && r[0].new_description === 'Tutor nghe chép 12 buổi, thêm Section 4'
      && r[0].old_started_date === t.addDays(TODAY, -21) && r[0].new_started_date === t.addDays(TODAY, -21), JSON.stringify(r));
    const row = get('SELECT * FROM case_interventions WHERE id = ?', iv);
    assert(row.so_buoi === 12 && row.performer_name === 'Tutor ngoài Lan' && row.performer_user_id === null && row.kind === 'tutor', JSON.stringify(row));
    const pa = ra.interventions.find((x: any) => x.id === iv);
    assert(pa.daDay === 5 && pa.revisions.length === 1 && pa.revisions[0].source === 'sua_pa'
      && pa.revisions[0].before.soBuoi === 10 && pa.revisions[0].after.soBuoi === 12
      && pa.revisions[0].before.startedDate === t.addDays(TODAY, -21), JSON.stringify(pa.revisions));
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'intervention.edit' AND entity_id = ?`, iv).n === 1, 'audit intervention.edit');
    /* Không đổi gì → trả Case, không ghi. Để trống Số buổi được (null = xoá) — vẫn ≥ đã dạy không áp. */
    cases.suaPa(P.lrTeacher, iv, { description: 'Tutor nghe chép 12 buổi, thêm Section 4', soBuoi: 12 });
    assert(revCua(iv).length === 1, 'không đổi mà vẫn ghi');
    cases.suaPa(P.lrTeacher, iv, { soBuoi: null });
    assert(get('SELECT so_buoi FROM case_interventions WHERE id = ?', iv).so_buoi === null && revCua(iv).length === 2 && revCua(iv)[1].new_so_buoi === null, 'xoá số buổi');
    /* PA chưa có Kết quả: đổi Ngày bắt đầu được, nhật ký cũ → mới. */
    const moi = tutor10('SUA2', { startedDate: TODAY });
    cases.suaPa(P.lrTeacher, moi.iv, { startedDate: t.addDays(TODAY, -3) });
    const r2 = revCua(moi.iv);
    assert(get('SELECT started_date FROM case_interventions WHERE id = ?', moi.iv).started_date === t.addDays(TODAY, -3)
      && r2.length === 1 && r2[0].old_started_date === TODAY && r2[0].new_started_date === t.addDays(TODAY, -3), JSON.stringify(r2));
    /* Người ngoài quyền (GV Speaking, Case Listening) → 403. */
    assert(!can(P.sTeacher, 'sos.edit', { classId: classId('MB FT 101'), skill: 'listening' }), 'GV Speaking có quyền Listening?');
    const q = maLoi(() => cases.suaPa(P.sTeacher, moi.iv, { soBuoi: 11 }));
    assert(q.status === 403, `quyền: ${JSON.stringify(q)}`);
    /* Tự học: gửi người bị bỏ qua (không có ô người). */
    const tu = cases.recordIntervention(P.lrTeacher, moi.c, { kind: 'self_study', description: 'Tự học nghe chép mỗi ngày', status: 'started', startedDate: TODAY }) as any;
    const ss = Math.max(...tu.interventions.map((x: any) => x.id));
    cases.suaPa(P.lrTeacher, ss, { soBuoi: 6, performerUserId: GV_L });
    const sr = get('SELECT * FROM case_interventions WHERE id = ?', ss);
    assert(sr.so_buoi === 6 && sr.performer_user_id === null && sr.performer_name === null, `Tự học: ${JSON.stringify(sr)}`);
    /* PA đã kết thúc → 400. */
    cases.updateResult(P.lrTeacher, moi.iv, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết', soBuoi: 1, nguoiDay: { performerUserId: GV_L } });
    const ket = maLoi(() => cases.suaPa(P.lrTeacher, moi.iv, { soBuoi: 11 }));
    assert(ket.status === 400, `PA đã kết thúc: ${JSON.stringify(ket)}`);
  });

  check('PA6 · Điều chỉnh đổi Số buổi: ghi revisions adjust cũ → mới; nhỏ hơn đã dạy (tính cả tuần này) → 400', () => {
    const { c, iv } = tutor10('DC');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 4, nguoiDay: { performerUserId: GV_L } });
    const nho = maLoi(() => cases.updateResult(P.lrTeacher, iv, { ...KQ, decision: 'adjust', decisionNote: 'Rút ngắn số buổi', soBuoi: 2, nguoiDay: { performerUserId: GV_L }, adjust: { soBuoi: 5 } }));
    assert(nho.status === 400 && nho.msg.includes('Đã dạy 6 buổi'), `nhỏ hơn đã dạy: ${JSON.stringify(nho)}`);
    cases.updateResult(P.lrTeacher, iv, { ...KQ, decision: 'adjust', decisionNote: 'Em cần thêm buổi chép chính tả', soBuoi: 2, nguoiDay: { performerUserId: GV_L }, adjust: { soBuoi: 14 } });
    const r = revCua(iv);
    assert(r.length === 1 && r[0].source === 'adjust' && r[0].old_so_buoi === 10 && r[0].new_so_buoi === 14 && r[0].followup_id !== null, JSON.stringify(r));
    const pa = paDto(c, iv);
    assert(pa.soBuoi === 14 && pa.daDay === 6 && pa.revisions[0].before.soBuoi === 10 && pa.revisions[0].after.soBuoi === 14, JSON.stringify(pa));
  });

  check('PA7 · Bổ trợ nhóm: Kết quả chép Số buổi + Người dạy tuần này sang dòng anh em; Điều chỉnh Số buổi áp cả nhóm', () => {
    const NHOM = 'mt:pa7';
    const ids: number[] = taoPa.chenPa(conn, [caseThu('NHOM1'), caseThu('NHOM2')].map((caseId) => ({
      caseId, kind: 'bo_tro_mien_phi', description: 'Bổ trợ miễn phí nhóm thử', status: 'started', soBuoi: 6, nhomBoTro: NHOM,
      startedDate: TODAY, cycleStartedOn: TODAY, actionDue: d.weeklyUpdateDue(TODAY),
    })));
    cases.updateResult(P.lrTeacher, ids[0], { ...KQ, soBuoi: 2, nguoiDay: { performerName: 'Cô Hà ngoài' } });
    const anh = fuCua(ids[1]);
    assert(anh.length === 1 && anh[0].so_buoi === 2 && anh[0].phu_trach_ten === 'Cô Hà ngoài', `anh em: ${JSON.stringify(anh)}`);
    cases.updateResult(P.lrTeacher, ids[0], { ...KQ, decision: 'adjust', decisionNote: 'Nhóm cần thêm buổi', soBuoi: 1, nguoiDay: { performerName: 'Cô Hà ngoài' }, adjust: { soBuoi: 8 } });
    assert(ids.every((id) => get('SELECT so_buoi FROM case_interventions WHERE id = ?', id).so_buoi === 8), 'Điều chỉnh chưa áp cả nhóm');
    assert(revCua(ids[1]).length === 1 && revCua(ids[1])[0].new_so_buoi === 8, 'nhật ký dòng anh em');
  });

  check('PA8 · Xác nhận PA quy chế nhận Số buổi (1–60); Tự học bỏ người ở Xác nhận PA + bàn giao', () => {
    const c = caseThu('XN');
    const [tut, tu] = taoPa.chenPa(conn, [
      { caseId: c, kind: 'tutor', description: 'Tutor theo quy chế', status: 'planned', preset: true, mocQuyChe: 'one_month' },
      { caseId: c, kind: 'self_study', description: 'Tự học theo quy chế', status: 'planned', preset: true, mocQuyChe: 'one_month' },
    ]);
    const MO_TA = 'Tutor Listening hai buổi mỗi tuần, cô Hà chữa bài nghe.';
    const sai = maLoi(() => sosAuto.xacNhanPaQuyChe(P.lrTeacher, tut, { description: MO_TA, soBuoi: 61 }));
    assert(sai.status === 400 && sai.msg.includes('Từ 1 đến 60 buổi'), `61: ${JSON.stringify(sai)}`);
    sosAuto.xacNhanPaQuyChe(P.lrTeacher, tut, { description: MO_TA, soBuoi: 8, performerSelf: true });
    const r = get('SELECT * FROM case_interventions WHERE id = ?', tut);
    assert(r.so_buoi === 8 && r.status === 'started' && r.performer_user_id === GV_L, JSON.stringify(r));
    assert(revCua(tut).length === 1 && revCua(tut)[0].new_so_buoi === 8, 'nhật ký xác nhận có số buổi');
    sosAuto.xacNhanPaQuyChe(P.lrTeacher, tu, { description: 'Tự học Listening, nghe chép mỗi ngày 15 phút.', performerUserId: GV_L });
    const s = get('SELECT * FROM case_interventions WHERE id = ?', tu);
    assert(s.performer_user_id === null && s.performer_name === null && s.status === 'started', `Tự học xác nhận: ${JSON.stringify(s)}`);
    const sid = get('SELECT student_id FROM sos_cases WHERE id = ?', c).student_id;
    sosAuto.banGiaoPaQuyChe(sid, classId('MB FT 101'), P.admin.userId);
    assert(get('SELECT performer_user_id u FROM case_interventions WHERE id = ?', tu).u === null, 'bàn giao gán người cho Tự học');
    /* Nhập bù không người: form.tests (F3-BF). */
  });

  check('PA9 · Sửa PA: PA đang chờ Quản lý duyệt → 400; PA quy chế chưa xác nhận → 400 (sửa lúc Xác nhận PA)', () => {
    const c = caseThu('CHAN');
    const dx = cases.recordIntervention(P.lrTeacher, c, { kind: 'extra_support', description: 'Học kèm 1-1 với Tutor 2 buổi/tuần', status: 'planned' }) as any;
    const cho = dx.interventions.find((x: any) => x.approvalState === 'pending').id;
    const e1 = maLoi(() => cases.suaPa(P.lrTeacher, cho, { description: 'Học kèm 1-1 với Tutor 3 buổi/tuần' }));
    assert(e1.status === 400 && e1.msg.includes('chờ Quản lý duyệt'), `chờ duyệt: ${JSON.stringify(e1)}`);
    const [ps] = taoPa.chenPa(conn, [{ caseId: c, kind: 'tutor', description: 'Tutor theo quy chế', status: 'planned', preset: true, mocQuyChe: 'one_month' }]);
    const e2 = maLoi(() => cases.suaPa(P.lrTeacher, ps, { soBuoi: 8 }));
    assert(e2.status === 400 && e2.msg.includes('Xác nhận PA'), `chưa xác nhận: ${JSON.stringify(e2)}`);
    assert(revCua(cho).length === 0 && revCua(ps).length === 0 && get('SELECT so_buoi FROM case_interventions WHERE id = ?', ps).so_buoi === null, 'lỗi mà vẫn ghi');
  });

  check('PA10 · Sửa PA bổ trợ nhóm: áp mọi dòng đang chạy của nhóm, mỗi dòng một nhật ký; Số buổi kiểm theo đã dạy của TỪNG dòng', () => {
    const NHOM = 'mt:pa10';
    const ids: number[] = taoPa.chenPa(conn, [caseThu('N10A'), caseThu('N10B')].map((caseId) => ({
      caseId, kind: 'bo_tro_mien_phi', description: 'Bổ trợ miễn phí nhóm thử', status: 'started', soBuoi: 6, nhomBoTro: NHOM,
      startedDate: TODAY, cycleStartedOn: TODAY, actionDue: d.weeklyUpdateDue(TODAY),
    })));
    cases.updateResult(P.lrTeacher, ids[0], { ...KQ, soBuoi: 4, nguoiDay: { performerName: 'Cô Hà ngoài' } });   // chép sang dòng 2: cả hai đã dạy 4
    /* Dòng 2 đã dạy thêm 3 (7) → Số buổi 5 hợp lệ với dòng 1 (4) nhưng không với dòng 2 → 400, không dòng nào đổi. */
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, note, next_step, cycle_no, late, created_at, so_buoi)
      SELECT case_id, id, ?, 'partial', 'Buổi riêng', 'continue', 1, 0, ?, 3 FROM case_interventions WHERE id = ?`).run(TODAY, new Date().toISOString(), ids[1]);
    const e = maLoi(() => cases.suaPa(P.lrTeacher, ids[0], { soBuoi: 5 }));
    assert(e.status === 400 && e.msg.includes('Đã dạy 7 buổi'), `đã dạy của dòng anh em: ${JSON.stringify(e)}`);
    assert(ids.every((id) => get('SELECT so_buoi FROM case_interventions WHERE id = ?', id).so_buoi === 6 && revCua(id).length === 0), 'lỗi mà vẫn ghi');
    cases.suaPa(P.lrTeacher, ids[0], { soBuoi: 9, description: 'Bổ trợ miễn phí nhóm, thêm ba buổi' });
    const r = ids.map((id) => get('SELECT so_buoi, description FROM case_interventions WHERE id = ?', id));
    assert(r.every((x) => x.so_buoi === 9 && x.description === 'Bổ trợ miễn phí nhóm, thêm ba buổi'), `cả nhóm: ${JSON.stringify(r)}`);
    assert(ids.every((id) => revCua(id).length === 1 && revCua(id)[0].source === 'sua_pa' && revCua(id)[0].old_so_buoi === 6 && revCua(id)[0].new_so_buoi === 9),
      `nhật ký từng dòng: ${JSON.stringify(ids.map(revCua))}`);
    /* Rà cuối #2: dòng chính tài khoản, dòng anh em chỉ tên → đổi sang tài khoản khác: anh em nhận CẢ HAI ô (không còn tên cũ). */
    conn.prepare('UPDATE case_interventions SET performer_user_id = ?, performer_name = NULL WHERE id = ?').run(GV_L, ids[0]);
    conn.prepare(`UPDATE case_interventions SET performer_user_id = NULL, performer_name = 'Cô Hà ngoài' WHERE id = ?`).run(ids[1]);
    const gvMoi = GV.find((u) => u !== GV_L)!;
    cases.suaPa(P.admin, ids[0], { performerUserId: gvMoi });
    const ng = ids.map((id) => get('SELECT performer_user_id u, performer_name n FROM case_interventions WHERE id = ?', id));
    assert(ng.every((x) => x.u === gvMoi && x.n === null), `người cả nhóm: ${JSON.stringify(ng)}`);
    /* Rà cuối M4: Mô tả ngắn tối đa 2000 ký tự — Sửa PA và Thêm PA cùng giới hạn. */
    const dai = 'x'.repeat(2001);
    const e1 = maLoi(() => cases.suaPa(P.admin, ids[0], { description: dai }));
    const e2 = maLoi(() => cases.recordIntervention(P.lrTeacher, caseThu('N10C'), { kind: 'tutor', description: dai, status: 'started', startedDate: TODAY }));
    assert(e1.status === 400 && e1.msg.includes('2000') && e2.status === 400 && e2.msg.includes('2000'), `2000: ${JSON.stringify([e1, e2])}`);
  });
  // ------------------------------------------------------------------ Task 3 · người giữ việc Kết quả (không mồ côi)
  console.log('\nPR-PA · Task 3 (người giữ việc Kết quả)');
  const { loadPrincipal } = await import('../permissions.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const { viecCuaHocVien } = await import('../students/viecHocVien.ts');
  const GV4 = (conn.prepare(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`).all(MB) as any[]).map((r) => r.user_id as number);
  const ganGvcn = (lop: number, userId: number) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?, NULL, 1, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, new Date().toISOString());
  /** Em ở lớp A, Case Listening gắn lượt Final ở lớp A (chủ Case = `chu`), PA quá hạn Kết quả; rồi em chuyển sang lớp B. */
  const emChuyenLop = (ten: string, o: { chu: number; topic?: string; kind?: string; nhom?: string | null; sauChuyen: (b: number) => void }) => {
    const a = lopMoi('BE', false, 3), b = lopMoi('BE', false, 3);
    ganGv(a, GV4[0], 'listening');
    const sid = hocVien(a, 'BE');
    regular.planRegularTests(P.admin, a, { studentIds: [sid], kinds: ['final'] });
    const luot = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? ORDER BY id DESC LIMIT 1`, sid, a).id;
    const c = (cases.reportIssue(P.admin, {
      title: `Giữ việc ${ten}`, primaryCode: 'student.listening.technique', studentId: sid, topic: 'listening',
      summary: 'Case dựng cho phép kiểm người giữ việc.', idempotencyKey: `pa-giu-${ten}`, parallel: true,
    }) as any).id as number;
    conn.prepare('UPDATE sos_cases SET attempt_id = ?, owner_user_id = ?, topic = ? WHERE id = ?').run(luot, o.chu, o.topic ?? 'listening', c);
    const [iv] = taoPa.chenPa(conn, [{
      caseId: c, kind: o.kind ?? 'tutor', description: 'Tutor nghe chép 10 buổi', status: 'started', soBuoi: 10, performerUserId: GV4[0],
      nhomBoTro: o.nhom ?? null, startedDate: t.addDays(TODAY, -14), cycleStartedOn: t.addDays(TODAY, -14), actionDue: t.addDays(TODAY, -1),
    }]);
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(TODAY, sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, b, TODAY, new Date().toISOString());
    o.sauChuyen(b);
    return { c, iv: iv as number, a, b };
  };
  const dongKq = (userId: number, iv: number) => (mw.myWork(loadPrincipal(userId)).groups as any[]).flatMap((g) => g.items).find((it: any) => it.key === `action:${iv}`);
  const nguoiChiSo = (iv: number) => metrics.metricSet(P.admin, 'pa-can-cap-nhat', {}).chiTiet?.get(iv)?.nguoi?.[0] ?? null;
  const KQ1 = { ...KQ, soBuoi: 1, nguoiDay: { performerName: 'Tutor ngoài' } };

  check('PA11 · em chuyển lớp → việc Kết quả về GVBM môn đó ở lớp MỚI: thấy ở Công việc (của mình), chỉ số cùng người, ghi được; GV lớp cũ không còn giữ; bảng kỹ năng + tab Việc cùng người', () => {
    const { c, iv, b } = emChuyenLop('MOI', { chu: GV4[0], sauChuyen: (b) => { ganGv(b, GV4[1], 'listening'); ganGv(b, GV4[2], 'reading'); } });
    const dong = dongKq(GV4[1], iv);
    assert(dong && dong.mine && dong.ownerId === GV4[1], `GVBM lớp mới: ${JSON.stringify(dong && { mine: dong.mine, ownerId: dong.ownerId })}`);
    assert(dong.href.startsWith('/hoc-vien/') && dong.reason === 'Tutor nghe chép 10 buổi', `GVBM xem được hồ sơ → href hồ sơ: ${dong.href} · ${dong.reason}`);
    assert(!dongKq(GV4[0], iv)?.mine, 'GV lớp cũ vẫn giữ việc');
    assert(nguoiChiSo(iv) === GV4[1], `chỉ số pa-can-cap-nhat: ${nguoiChiSo(iv)}`);
    const pa = (p: number) => (cases.caseDetail(loadPrincipal(p), c) as any).interventions.find((x: any) => x.id === iv);
    assert(pa(GV4[1]).ghiDuoc === true && pa(GV4[2]).ghiDuoc === false && (cases.caseDetail(P.admin, c) as any).interventions.find((x: any) => x.id === iv).ghiDuoc === true,
      `ghiDuoc: GVBM ${pa(GV4[1]).ghiDuoc} · GV môn khác ${pa(GV4[2]).ghiDuoc}`);
    /* Rà cuối #1: bảng kỹ năng + tab Việc của hồ sơ cùng người giữ việc (không còn "người dạy ?? chủ Case"); nút Kết quả theo ghiDuoc từng PA. */
    const sid = get('SELECT student_id FROM sos_cases WHERE id = ?', c).student_id;
    const theCua = (u: number) => (cases.skillSupportBoard(loadPrincipal(u), sid) as any);
    const plBang = (u: number) => theCua(u).rows.flatMap((r: any) => r.cases).find((x: any) => x.id === c)?.plans.find((x: any) => x.id === iv);
    const pl1 = plBang(GV4[1]);
    assert(pl1?.nguoiId === GV4[1] && !!pl1.nguoiTen && pl1.ghiDuoc === true && plBang(GV4[2])?.ghiDuoc === false,
      `bảng kỹ năng: ${JSON.stringify(pl1 && { nguoiId: pl1.nguoiId, ghiDuoc: pl1.ghiDuoc })} · môn khác ${plBang(GV4[2])?.ghiDuoc}`);
    const viec = viecCuaHocVien(loadPrincipal(GV4[1]), sid, theCua(GV4[1]), { trangThaiEm: 'active', lopId: b, chuongTrinh: null, yThuc: null, miniTest: null, dai: null });
    const vk = viec.cuaBan.find((x) => x.key === `action:${iv}`);
    assert(vk?.nguoi.id === GV4[1], `tab Việc: ${JSON.stringify(vk ?? viec.nguoiKhac.find((x) => x.key === `action:${iv}`)?.nguoi)}`);
    cases.updateResult(loadPrincipal(GV4[1]), iv, KQ1);
    assert(fuCua(iv).length === 1, 'GVBM lớp mới chưa ghi được');
  });

  check('PA12 · lớp mới chưa phân công môn → chủ Case giữ việc: thấy dòng, ghi được Kết quả và Sửa PA dù không dạy lớp mới; người ngoài vẫn 403', () => {
    const { c, iv } = emChuyenLop('CHU', { chu: GV4[3], sauChuyen: () => {} });
    const dong = dongKq(GV4[3], iv);
    assert(dong && dong.mine && dong.ownerId === GV4[3], `chủ Case: ${JSON.stringify(dong && { mine: dong.mine, ownerId: dong.ownerId })}`);
    /* Chủ Case không xem được hồ sơ HV (em đã sang lớp khác) → Ngăn Case đứng riêng, mở thẳng Kết quả. */
    assert(dong.href === `/hoc-thuat/case/${c}?pa=${iv}&viec=ghi-ket-qua` && d.duongCaseRieng(c, { paId: iv, viec: 'ghi-ket-qua' }) === dong.href, `href: ${dong.href}`);
    const qlDong = (mw.myWork(P.admin, { nguoi: 'tat-ca' }).groups as any[]).flatMap((g) => g.items).find((it: any) => it.key === `action:${iv}`);
    assert(qlDong && qlDong.href.startsWith('/hoc-vien/') && qlDong.reason.endsWith(' — chưa ghi'), `Quản trị (không giữ việc): ${qlDong?.href} · ${qlDong?.reason}`);
    assert(nguoiChiSo(iv) === GV4[3], `chỉ số: ${nguoiChiSo(iv)}`);
    const chu = loadPrincipal(GV4[3]);
    assert((cases.caseDetail(chu, c) as any).interventions.find((x: any) => x.id === iv).ghiDuoc === true, 'ghiDuoc của chủ Case');
    cases.updateResult(chu, iv, KQ1);
    cases.suaPa(chu, iv, { soBuoi: 12 });
    assert(fuCua(iv).length === 1 && get('SELECT so_buoi FROM case_interventions WHERE id = ?', iv).so_buoi === 12, 'chủ Case chưa ghi / sửa được');
    const e = maLoi(() => cases.updateResult(loadPrincipal(GV4[1]), iv, KQ1));
    assert(e.status === 403, `người ngoài: ${JSON.stringify(e)}`);
    /* Rà cuối M1: PA đã khép → chủ Case (chỉ là người giữ dự phòng) không còn quyền xem Case qua đường người giữ việc. */
    conn.prepare(`UPDATE case_interventions SET status = 'completed' WHERE id = ?`).run(iv);
    const xem = maLoi(() => cases.caseDetail(chu, c));
    assert(xem.status === 403, `PA đã khép vẫn mở quyền xem: ${JSON.stringify(xem)}`);
  });

  check('PA13 · PA Bổ trợ nhóm chung (gk:{lượt}), Bổ trợ miễn phí (mt:{lượt}) và Case tong_hop → GVCN lớp hiện tại giữ việc (không phải GVBM môn)', () => {
    for (const [ten, o] of [['GK', { kind: 'bo_tro', nhom: 'gk:990013' }], ['MT', { kind: 'bo_tro_mien_phi', nhom: 'mt:990013' }], ['TH', { topic: 'tong_hop' }]] as const) {
      const { iv } = emChuyenLop(`GVCN-${ten}`, { chu: GV4[0], ...o, sauChuyen: (b) => { ganGv(b, GV4[1], 'listening'); ganGv(b, GV4[2], 'reading'); ganGvcn(b, GV4[2]); } });
      const dong = dongKq(GV4[2], iv);
      assert(dong && dong.mine && dong.ownerId === GV4[2], `${ten} GVCN: ${JSON.stringify(dong && { mine: dong.mine, ownerId: dong.ownerId })}`);
      assert(!dongKq(GV4[1], iv)?.mine && nguoiChiSo(iv) === GV4[2], `${ten}: GVBM vẫn giữ / chỉ số ${nguoiChiSo(iv)}`);
      cases.updateResult(loadPrincipal(GV4[2]), iv, KQ1);
      assert(fuCua(iv).length === 1, `${ten}: GVCN chưa ghi được`);
    }
  });
  check('PA14 · form PA (luật thuần web): lỗi theo Loại; Sửa PA chỉ kiểm + gửi ô đã đổi; đổi người gửi đủ ba khoá; xoá Số buổi → null', () => {
    const tutor = { ...d.paMoi('tutor'), description: 'Tutor 1-1 Writing Task 2', soBuoi: '10' };
    assert(d.paMoi('tutor').nguoi === null && d.paMoi('teaching_adjust').nguoi?.kieu === 'toi', 'người mặc định theo loại');
    assert(d.loiFormPa(tutor).length === 0, 'PA đủ ô');
    const khoa = (v: any, o?: any) => d.loiFormPa(v, o).map((l: any) => l.khoa).join();
    assert(khoa({ ...tutor, soBuoi: '0', description: 'ngắn' }) === 'noi-dung,so-buoi', 'nội dung < 8 + Số buổi 0');
    assert(khoa({ ...tutor, kind: 'teaching_adjust', soBuoi: 'abc' }) === '', 'loại không Số buổi: bỏ qua ô Số buổi');
    assert(khoa({ ...tutor, description: 'Mười bốn ký tự' }, { toiThieu: 15 }) === 'noi-dung', 'Xác nhận PA ≥ 15');
    assert(khoa({ ...tutor, kind: 'other_proposal' }) === 'ghi-ro', 'PA Khác cần Tên đề xuất');
    /* Sửa PA: PA vượt buổi (10 < đã dạy 12), mô tả cũ ngắn — sửa ô khác vẫn được; đổi Số buổi xuống dưới đã dạy → lỗi. */
    const goc = { ...tutor, description: 'ngắn', nguoi: { kieu: 'tai_khoan', id: 7, ten: 'GV cũ' } };
    assert(khoa({ ...goc, nguoi: null }, { daDay: 12, goc }) === '', 'ô không đổi không kiểm');
    assert(khoa({ ...goc, soBuoi: '11' }, { daDay: 12, goc }) === 'so-buoi', 'Số buổi mới < đã dạy');
    assert(JSON.stringify(d.thanSuaPa(goc, goc, { moi: '2026-10-01', cu: '2026-10-01' })) === '{}', 'không đổi → thân rỗng');
    const b = d.thanSuaPa({ ...goc, soBuoi: ' ', nguoi: null }, goc, { moi: '2026-10-02', cu: '2026-10-01' });
    assert(b.soBuoi === null && b.performerSelf === false && b.performerUserId === null && b.performerName === null && b.startedDate === '2026-10-02'
      && !('description' in b), `thân Sửa PA: ${JSON.stringify(b)}`);
    assert(d.thanSuaPa({ ...goc, nguoi: { kieu: 'ngoai', ten: 'Cô Lan' } }, goc, { moi: '', cu: null }).performerName === 'Cô Lan', 'người ngoài');
    const pl = d.paPayload({ ...tutor, kind: 'self_study', nguoi: { kieu: 'toi' } });
    assert(pl.soBuoi === 10 && !('performerSelf' in pl), 'Tự học: có Số buổi, không người');
    assert(d.paPayload({ ...tutor, kind: 'teaching_adjust' }).soBuoi === null, 'loại không Số buổi → null');
  });
  check('PA15 · Xác nhận PA: gửi khoá người = đặt lại (cả ba trống → xoá người); không gửi khoá nào → giữ người máy gán', () => {
    const c = caseThu('XN2');
    const [a, b] = taoPa.chenPa(conn, ['A', 'B'].map((x) => ({
      caseId: c, kind: 'tutor', description: `Tutor theo quy chế ${x}`, status: 'planned', preset: true, mocQuyChe: 'one_month', performerName: 'Cô cũ đã nghỉ',
    })));
    const MO_TA = 'Tutor Listening hai buổi mỗi tuần, chữa bài nghe Section 3.';
    sosAuto.xacNhanPaQuyChe(P.lrTeacher, a, { description: MO_TA, performerSelf: false, performerUserId: null, performerName: null });
    sosAuto.xacNhanPaQuyChe(P.lrTeacher, b, { description: MO_TA });
    const ra = get('SELECT performer_user_id u, performer_name n, status FROM case_interventions WHERE id = ?', a);
    const rb = get('SELECT performer_user_id u, performer_name n FROM case_interventions WHERE id = ?', b);
    assert(ra.u === null && ra.n === null && ra.status === 'started', `xoá người: ${JSON.stringify(ra)}`);
    assert(rb.u === null && rb.n === 'Cô cũ đã nghỉ', `giữ người: ${JSON.stringify(rb)}`);
  });

  check('PA16 · caseDetail.nguonTao (ky_vong · he_thong · null) + Nhật ký PA: Tạo · Kết quả · Sửa PA, mới nhất lên trên', () => {
    const kv = caseThu('KV');
    conn.prepare("UPDATE sos_cases SET origin_kind = 'chuyen_cap', title = 'Kỳ vọng đầu ra chưa đạt · Listening' WHERE id = ?").run(kv);
    const [t1, t2] = taoPa.chenPa(conn, [1, 2].map((n) => ({
      caseId: kv, kind: 'tutor', description: `Tutor 10 buổi thử ${n}`, status: 'started', soBuoi: 10, recordedBy: P.admin.userId, startedDate: TODAY,
    })));
    const [q] = taoPa.chenPa(conn, [{ caseId: kv, kind: 'self_study', description: 'Tự học theo quy chế', status: 'planned', preset: true, mocQuyChe: 'one_month' }]);
    const nguon = (iv: number) => paDto(kv, iv).nguonTao;
    assert(nguon(t1) === 'ky_vong' && nguon(t2) === null && nguon(q) === 'he_thong', `nguonTao: ${nguon(t1)} ${nguon(t2)} ${nguon(q)}`);

    const pa = { id: 1, kind: 'tutor', soBuoi: 8, performer: 'Phạm Thu Trang', createdAt: '2026-09-29T02:00:00.000Z', recordedBy: 'Quản lý', nguonTao: 'ky_vong',
      revisions: [{ id: 5, on: '2026-10-08', source: 'sua_pa', by: 'Ngô Bảo Nam', reason: 'Sửa PA',
        before: { description: 'a', performer: 'Phạm Thu Trang', soBuoi: 10, startedDate: '2026-09-29' },
        after: { description: 'b', performer: 'Phạm Thu Trang', soBuoi: 8, startedDate: '2026-09-29' } }] };
    const kq = [{ id: 3, interventionId: 1, observedOn: '2026-10-06', observerName: 'Phạm Thu Trang', cycleDue: '2026-10-05', soBuoi: 3 },
      { id: 4, interventionId: 2, observedOn: '2026-10-07', observerName: 'X', soBuoi: 1 }];
    const nk = d.nhatKyPa(pa, kq, TODAY);
    const tuan = d.tuanLich(d.tuanKetQuaCuaHan('2026-10-05'), TODAY);
    assert(nk.map((x: any) => `${x.ngay}|${x.ai}|${x.chu}`).join('\n') === [
      '2026-10-08|Ngô Bảo Nam|Sửa PA · Số buổi 10 → 8 · Nội dung đổi',
      `2026-10-06|Phạm Thu Trang|Kết quả ${tuan} · dạy 3 buổi`,
      '2026-09-29|Web|Tạo "Học Tutor" · 10 buổi · dạy Phạm Thu Trang',
    ].join('\n'), `nhật ký: ${JSON.stringify(nk)}`);
    assert(d.soDongNhatKyPa(pa, kq) === 3, 'đếm nhật ký');
    const tayKhongNguoi = d.nhatKyPa({ id: 9, kind: 'tutor', performer: null, recordedBy: 'Lê Minh Khoa', createdAt: '2026-10-01T03:00:00Z' }, [], TODAY);
    assert(tayKhongNguoi.length === 1 && tayKhongNguoi[0].ai === 'Lê Minh Khoa' && tayKhongNguoi[0].chu === 'Tạo "Học Tutor" · người dạy trống', JSON.stringify(tayKhongNguoi));
  });

  check('PA17 · Kết quả (luật thuần web): đếm sau khi lưu còn / đủ / vượt; lỗi + thân khối đếm; không người dạy lưu được (PR-CT2); Điều chỉnh xoá Người dạy', () => {
    const k = (a: number, b: number, tuan: string) => { const x = d.demSauKetQua(a, b, tuan); return `${x.truoc}>${x.da}/${x.tong}·${x.con}·${x.tt}·${x.vuot}`; };
    assert(k(3, 10, '2') === '3>5/10·5·chua·0' && k(8, 10, '2') === '8>10/10·0·du·0' && k(10, 10, '1') === '10>11/10·0·vuot·1'
      && k(3, 10, '') === '3>3/10·7·chua·0' && k(3, 10, 'x') === '3>3/10·7·chua·0', 'demSauKetQua');
    const tutor = { kind: 'tutor', soBuoi: 10 };
    const khoa = (pa: any, tuan: string, ng: any) => d.loiKetQuaTuan(pa, tuan, ng).map((l: any) => `${l.khoa}:${l.lyDo}`).join('|');
    assert(khoa(tutor, '2', null) === '' && khoa(tutor, '0', null) === '' && khoa(tutor, '', null) === 'so-buoi-tuan:Từ 0 đến 60 buổi'
      && khoa(tutor, '1', { kieu: 'ngoai', ten: 'A' }).startsWith('nguoi-day:Gõ tên') && khoa({ kind: 'tutor', soBuoi: null }, '', null) === ''
      && khoa({ kind: 'self_study', soBuoi: 8 }, '2', null) === '', `loiKetQuaTuan: ${khoa(tutor, '2', null)}`);
    assert(JSON.stringify(d.thanKetQuaTuan(tutor, '0', null)) === '{"soBuoi":0,"nguoiDay":{}}'
      && JSON.stringify(d.thanKetQuaTuan({ kind: 'self_study', soBuoi: 8 }, '2', { kieu: 'tai_khoan', id: 5, ten: 'X' })) === '{"soBuoi":2}'
      && JSON.stringify(d.thanKetQuaTuan({ kind: 'teaching_adjust', soBuoi: null }, '1', null)) === '{"nguoiDay":{}}', 'thanKetQuaTuan');
    /* Máy chủ nhận đúng thân web gửi: 0 buổi hay 2 buổi không người dạy → đều lưu (PR-CT2). */
    const { c, iv } = tutor10('KQ0');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, ...d.thanKetQuaTuan(tutor, '2', null), observedOn: t.addDays(TODAY, -7) });
    cases.updateResult(P.lrTeacher, iv, { ...KQ, ...d.thanKetQuaTuan(tutor, '0', null) });
    const f = fuCua(iv);
    assert(f.length === 2 && f.map((x) => x.so_buoi).join() === '2,0' && f.every((x) => x.phu_trach_user_id === null && x.phu_trach_ten === null), JSON.stringify(f));
    /* Điều chỉnh (thân = thanSuaPa như Sửa PA): đổi người → đặt lại; xoá người (cả ba khoá trống) → PA không còn người dạy. */
    const goc = { kind: 'tutor', description: 'Tutor nghe chép 10 buổi', soBuoi: '10', nguoi: { kieu: 'tai_khoan', id: GV_L, ten: 'GV' }, ghiRo: '' };
    const dc = (nguoi: any) => d.thanSuaPa({ ...goc, nguoi }, goc, { moi: '', cu: null });
    assert(JSON.stringify(dc(null)) === '{"performerSelf":false,"performerUserId":null,"performerName":null}', JSON.stringify(dc(null)));
    cases.updateResult(P.lrTeacher, iv, { ...KQ, decision: 'adjust', decisionNote: 'Đổi tutor', ...d.thanKetQuaTuan(tutor, '0', null), adjust: dc({ kieu: 'ngoai', ten: 'Tutor Hà' }) });
    assert(paDto(c, iv).performer === 'Tutor Hà', `đổi người: ${paDto(c, iv).performer}`);
    cases.updateResult(P.lrTeacher, iv, { ...KQ, decision: 'adjust', decisionNote: 'Chưa có tutor', ...d.thanKetQuaTuan(tutor, '0', null), adjust: dc(null) });
    const sau = get('SELECT performer_user_id, performer_name FROM case_interventions WHERE id = ?', iv);
    assert(sau.performer_user_id === null && sau.performer_name === null, `xoá người: ${JSON.stringify(sau)}`);
    assert(revCua(iv).length === 2, 'mỗi lần Điều chỉnh một nhật ký');
  });
  check('PA18 · dòng PA (Task 6): nút Kết quả + ⋯ Sửa PA chỉ khi ghi được và PA đang chạy (cùng chặn máy chủ); Xoá PA cho QL, không PA hệ thống', () => {
    const chay = { kind: 'tutor', status: 'started', preset: false, confirmedAt: null, approvalState: null, ghiDuoc: true };
    const xem = { canApprove: false, caseXong: false };
    const n = (o: Record<string, unknown>, x: Record<string, unknown> = {}) => d.nutDongPa({ ...chay, ...o }, { ...xem, ...x });
    assert(JSON.stringify(n({})) === '{"ketQua":true,"sua":true,"xoa":false}', JSON.stringify(n({})));
    assert(!n({ ghiDuoc: false }).sua && !n({ ghiDuoc: false }).ketQua, 'không ghi được → không Sửa PA / Kết quả');
    for (const o of [{ status: 'completed' }, { status: 'cancelled' }, { approvalState: 'pending' }, { preset: true, confirmedAt: null, status: 'planned' }])
      assert(!n(o).sua && !n(o).ketQua, `PA chưa chạy / đã khép: ${JSON.stringify(o)}`);
    assert(n({ preset: true, confirmedAt: '2026-10-01', status: 'planned' }).sua, 'PA quy chế đã xác nhận → Sửa PA');
    assert(n({}, { canApprove: true }).xoa && !n({}, { canApprove: true, caseXong: true }).xoa, 'Xoá PA: QL, Case chưa xong');
    for (const o of [{ preset: true, confirmedAt: '2026-10-01' }, { kind: 'bo_tro' }, { kind: 'bo_tro_mien_phi' }])
      assert(!n(o, { canApprove: true }).xoa, `PA hệ thống sinh không xoá: ${JSON.stringify(o)}`);
    /* Máy chủ chặn đúng những PA web ẩn nút: PA kết thúc → Sửa PA 400. */
    const { c, iv } = tutor10('DONG');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 3, nguoiDay: { performerUserId: GV_L } });
    const dto = paDto(c, iv);
    assert(d.nutDongPa(dto, xem).sua === true, JSON.stringify({ ghiDuoc: dto.ghiDuoc, status: dto.status }));
    cases.updateResult(P.lrTeacher, iv, { ...KQ, decision: 'end', soBuoi: 1, nguoiDay: { performerUserId: GV_L } });
    const xong = paDto(c, iv);
    assert(xong.status === 'completed' && !d.nutDongPa(xong, xem).sua, JSON.stringify({ status: xong.status }));
    const loi = maLoi(() => cases.suaPa(P.lrTeacher, iv, { description: 'Tutor nghe chép 12 buổi' }));
    assert(loi.status === 400, JSON.stringify(loi));
  });

  check('PA19 · bảng kỹ năng: PA có Số buổi mang soBuoi + daDay (dòng phụ "3/10 buổi"); kết quả tuần nói nguoiDay (không còn phuTrach)', () => {
    const { c, iv } = tutor10('BANG');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 3, nguoiDay: { performerUserId: GV_L } });
    const sid = get('SELECT student_id FROM sos_cases WHERE id = ?', c).student_id;
    const card = (cases.skillSupportBoard(P.lrTeacher, sid) as any).rows.flatMap((r: any) => r.cases).find((x: any) => x.id === c);
    const pl = card?.plans.find((x: any) => x.id === iv);
    assert(pl && pl.soBuoi === 10 && pl.daDay === 3, JSON.stringify(pl && { soBuoi: pl.soBuoi, daDay: pl.daDay }));
    assert(pl.updates.length === 1 && pl.updates[0].nguoiDay && !('phuTrach' in pl.updates[0]), JSON.stringify(pl.updates));
  });
}
