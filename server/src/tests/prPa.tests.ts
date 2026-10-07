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
  check('PA2 · migratePrPa: thêm 6 cột, chạy hai lần không lỗi; điền bù bo_tro_mien_phi ← mini_test.so_buoi và Tutor kỳ vọng ← 10 (chỉ dòng NULL)', () => {
    const coCot = (c: any, bang: string, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((x) => x.name === cot);
    const tam = new SqliteDb(':memory:');
    tam.exec(`CREATE TABLE sos_cases (id INTEGER PRIMARY KEY, origin_kind TEXT, title TEXT);
      CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER, kind TEXT, nhom_bo_tro TEXT);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY);
      CREATE TABLE case_intervention_revisions (id INTEGER PRIMARY KEY);
      CREATE TABLE mini_test (id INTEGER PRIMARY KEY, nhom_bo_tro TEXT, so_buoi INTEGER);
      INSERT INTO sos_cases VALUES (1, 'chuyen_cap', 'Kỳ vọng đầu ra chưa đạt · Reading'), (2, 'chuyen_cap', 'Final Test BE · W không đạt'), (3, 'mock', 'Kỳ vọng đầu ra x');
      INSERT INTO mini_test VALUES (1, 'mt:7', 4);
      INSERT INTO case_interventions VALUES (1, 1, 'tutor', NULL), (2, 2, 'tutor', NULL), (3, 3, 'tutor', NULL), (4, 2, 'bo_tro_mien_phi', 'mt:7'), (5, 2, 'bo_tro_mien_phi', 'mt:9');`);
    const a: string[] = []; migratePrPa(tam, a);
    const cot: [string, string][] = [['case_interventions', 'so_buoi'], ['case_followups', 'so_buoi'], ['case_intervention_revisions', 'old_so_buoi'],
      ['case_intervention_revisions', 'new_so_buoi'], ['case_intervention_revisions', 'old_started_date'], ['case_intervention_revisions', 'new_started_date']];
    assert(cot.every(([b, c]) => coCot(tam, b, c)), `thiếu cột: ${a.join('; ')}`);
    const so = () => (tam.prepare('SELECT id, so_buoi FROM case_interventions ORDER BY id').all() as any[]).map((r) => r.so_buoi).join();
    assert(so() === '10,,,4,', `điền bù: ${so()}`);
    tam.prepare('UPDATE case_interventions SET so_buoi = 7 WHERE id = 1').run();
    const b: string[] = []; migratePrPa(tam, b);
    assert(b.length === 0 && so() === '7,,,4,', `lần 2: ${b.join('; ')} · ${so()}`);
    tam.close();
    /* DB thật (schema.sql đã có cột): xoá số buổi của PA vừa tạo ở PA1e/PA1f → migrate điền lại. */
    assert(cot.every(([bg, c]) => coCot(conn, bg, c)), 'schema.sql thiếu cột PR-PA');
    const moi = [...ids.mienPhi, ...ids.tutor];
    assert(moi.length >= 3, 'PA1e/PA1f chưa chạy');
    const truoc = moi.map((id) => get('SELECT so_buoi FROM case_interventions WHERE id = ?', id).so_buoi).join();
    conn.prepare(`UPDATE case_interventions SET so_buoi = NULL WHERE id IN (${moi.map(() => '?').join(',')})`).run(...moi);
    const c: string[] = []; migratePrPa(conn, c);
    const sau = moi.map((id) => get('SELECT so_buoi FROM case_interventions WHERE id = ?', id).so_buoi).join();
    assert(sau === truoc && c.length > 0, `DB thật: ${truoc} → ${sau} · ${c.join('; ')}`);
    const e: string[] = []; migratePrPa(conn, e);
    assert(e.length === 0, `lần 2 DB thật: ${e.join('; ')}`);
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
}
