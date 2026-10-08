/**
 * PR-CT2 (§8, chủ sản phẩm 08/10) — chế tài cuối khoá. Task 1: Người dạy tuần này không bắt buộc · điền bù buổi đã dạy Tutor kỳ vọng · bộ đếm ký tự ẩn khi đạt.
 * Task 3: bỏ nộp / duyệt kế hoạch bổ trợ — PA Bổ trợ Giữa khoá chạy ngay sau Xác nhận Case.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');

export async function runPrCt2Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const { migratePrCt2 } = await import('../migrate/prCt2.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-CT2 · chế tài cuối khoá — Task 1 (Người dạy không bắt buộc, điền bù buổi, bộ đếm)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const KQ = { decision: 'keep', outcome: 'partial', note: 'Em nghe chép đều hơn tuần trước' };

  check('CT2-0 · Kết quả PA Tutor 10 buổi: 2 buổi không người dạy → lưu, phu_trach_* NULL; loiKetQuaTuan không lỗi nguoi-day; tên ngoài 1 ký tự vẫn lỗi', () => {
    const cid = classId('MB FT 101');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: 'CT2 KQ', target: 7, email: 'hv@demo.test' }], idempotencyKey: 'ct2-kq' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', 'CT2 KQ').id;
    const c = cases.reportIssue(P.lrTeacher, {
      title: 'CT2 thử Kết quả', primaryCode: 'student.listening.technique', studentId: sid, topic: 'listening',
      summary: 'Case dựng cho phép kiểm PR-CT2.', idempotencyKey: 'ct2-case-kq', parallel: true,
    }) as any;
    const dto = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'tutor', description: 'Tutor nghe chép 10 buổi', soBuoi: 10, status: 'started', startedDate: t.addDays(TODAY, -7),
    }) as any;
    const iv = Math.max(...dto.interventions.map((x: any) => x.id));
    cases.updateResult(P.lrTeacher, iv, { ...KQ, ...d.thanKetQuaTuan({ kind: 'tutor', soBuoi: 10 }, '2', null) });
    const f = all('SELECT * FROM case_followups WHERE intervention_id = ?', iv);
    assert(f.length === 1 && f[0].so_buoi === 2 && f[0].phu_trach_user_id === null && f[0].phu_trach_ten === null, JSON.stringify(f));
    const khoa = (tuan: string, ng: any) => d.loiKetQuaTuan({ kind: 'tutor', soBuoi: 10 }, tuan, ng).map((l: any) => l.khoa).join();
    assert(khoa('2', null) === '' && khoa('10', null) === '', `không người: ${khoa('2', null)}`);
    assert(khoa('2', { kieu: 'ngoai', ten: 'A' }) === 'nguoi-day', 'tên ngoài 1 ký tự phải lỗi');
    let loi: any = null;
    try { cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 1, nguoiDay: { performerName: 'A' } }); } catch (e: any) { loi = e; }
    assert(loi?.status === 400 && /người dạy tuần này/i.test(String(loi?.message)), `máy chủ vẫn kiểm tên ngoài: ${loi?.message}`);
    assert(all('SELECT 1 FROM case_followups WHERE intervention_id = ?', iv).length === 1, 'lỗi mà vẫn ghi');
  });

  check('CT2-0b · migratePrCt2: Tutor kỳ vọng Kết quả so_buoi NULL → 1 (0 giữ); một lần nhờ khoá; Bổ trợ miễn phí giữ NULL; không bảng demo_config thì thoát', () => {
    const tam = new SqliteDb(':memory:');
    tam.exec(`CREATE TABLE sos_cases (id INTEGER PRIMARY KEY, origin_kind TEXT, title TEXT);
      CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER, kind TEXT, so_buoi INTEGER);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY, intervention_id INTEGER, so_buoi INTEGER);`);
    tam.exec(`INSERT INTO sos_cases VALUES (1, 'chuyen_cap', 'Kỳ vọng đầu ra · Listening'), (2, 'chuyen_cap', 'Kỳ vọng đầu ra · Reading');
      INSERT INTO case_interventions VALUES (10, 1, 'tutor', 10), (20, 2, 'bo_tro_mien_phi', 4);
      INSERT INTO case_followups VALUES (1, 10, NULL), (2, 10, NULL), (3, 10, 0), (4, 20, NULL);`);
    const so = () => (tam.prepare('SELECT so_buoi FROM case_followups ORDER BY id').all() as any[]).map((x) => x.so_buoi ?? '').join();
    const x: string[] = []; migratePrCt2(tam, x);
    assert(x.length === 0 && so() === ',,0,', `không demo_config: ${so()}`);
    tam.exec('CREATE TABLE demo_config (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)');
    const a: string[] = []; migratePrCt2(tam, a);
    assert(so() === '1,1,0,' && a.length === 1 && a[0].includes('2'), `lần 1: ${so()} · ${a.join('; ')}`);
    tam.exec('UPDATE case_followups SET so_buoi = NULL WHERE id = 1');   // dòng mới không so_buoi từ đường khác: lần sau không đụng
    const b: string[] = []; migratePrCt2(tam, b);
    assert(b.length === 0 && so() === ',1,0,', `lần 2: ${so()} · ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrCt2(conn, c);
    assert(c.length === 0 && !!get("SELECT 1 FROM demo_config WHERE key = 'pr_ct2_dien_buoi'"), `DB thật: ${c.join('; ')}`);
  });

  check('CT2-0c · Truong: bộ đếm co/can chỉ hiện khi co < can', () => {
    const khung = fs.readFileSync(path.join(REPO, 'web/src/ui/KhungPanel.tsx'), 'utf8');
    assert(/\{dem && dem\.co < dem\.can && <span/.test(khung), 'Truong còn hiện bộ đếm khi đã đạt');
  });

  check('CT2-1 · số buổi bổ trợ theo dải × chương trình; ELE không bổ trợ; coBoTroFinal', () => {
    const bo = (ct: string, tyLe: number, monTruot: string[]) => d.goiYCuoiKhoa({ ct, tyLe, monTruot })?.boTroNeuLen ?? null;
    const s = (b: any) => b && `${b.soBuoi}·${b.soTuan}`;
    assert(s(bo('PREFOU', 0.55, [])) === '4·2' && s(bo('PREFOU', 0.65, [])) === '2·1', `Pre FOU ${s(bo('PREFOU', 0.55, []))} ${s(bo('PREFOU', 0.65, []))}`);
    assert(s(bo('FOU', 0.55, ['listening', 'writing'])) === '4·2', `FOU 55% ${s(bo('FOU', 0.55, ['listening', 'writing']))}`);
    assert(s(bo('FOU', 0.65, ['listening', 'writing'])) === '2·1', `FOU 65% ${s(bo('FOU', 0.65, ['listening', 'writing']))}`);
    assert(s(bo('BE', 0.55, ['reading'])) === '2·2', `BE 55% ${s(bo('BE', 0.55, ['reading']))}`);
    assert(bo('ELE', 0.55, ['reading']) === null && bo('ELE', 0.65, ['reading']) === null, 'ELE phải không bổ trợ');
    assert(!d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.65, monTruot: ['reading'] }).nhan.includes('bổ trợ'), 'nhãn ELE còn "bổ trợ"');
    for (const ct of ['PREFOU', 'FOU', 'BE', 'ELE']) {
      assert(bo(ct, 0.45, ['reading']) === null && bo(ct, 0.72, []) === null, `${ct} < 50 / ≥ 70`);
    }
    const hop = d.chuHopKetLuan({ ct: 'ELE', tyLe: 0.55, scored: 4, required: 4, mon: [], goiY: d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.55, monTruot: ['reading'] }), quyetDinh: { huong: 'len_lop', luc: '2026-10-05' }, ketLuanFt: null });
    assert(!hop.nhan.includes('bổ trợ'), `hộp Kết luận ELE: ${hop.nhan}`);
    assert(d.coBoTroFinal('BE', true) === false && d.coBoTroFinal('ELE', true) === false, 'BE/ELE → FT');
    assert(d.coBoTroFinal('BE', false) === true && d.coBoTroFinal('FOU', true) === true && d.coBoTroFinal('PREFOU', false) === true, 'còn lại');
  });

  check('CT2-2 · hạn chấm MT0 = thứ Tư tuần sau tuần thi', () => {
    assert(d.hanChamMt0('2026-10-19') === '2026-10-28' && d.hanChamMt0('2026-10-22') === '2026-10-28', d.hanChamMt0('2026-10-19'));
  });

  // ------------------------------------------------------------------ Task 3 · bỏ nộp / duyệt kế hoạch bổ trợ
  const regular: any = await import('../normal/regular.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  /** Thêm em vào lớp thường, xếp bài, nhập điểm Progress Test /20 → id em. */
  const emTruot = (ten: string, lop: string, diem: Record<string, number>) => {
    const cid = classId(lop);
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: 'hv@demo.test' }], idempotencyKey: `ct2-${ten}` });
    regular.planRegularTests(P.admin, cid);
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const pt = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'`, sid).id as number;
    for (const [k, v] of Object.entries({ listening: 18, reading: 18, writing: 18, speaking: 18, ...diem })) {
      regular.saveRegularScore(P.admin, pt, k, { score: v, total: 20, lyDo: 'Phép kiểm CT2' });
    }
    return sid;
  };
  const gvOf = (lop: string, skill: string) => loadPrincipal(get(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u);
  const caseMon = (sid: number, topic: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC', sid, topic);
  const paBt = (caseId: number) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status != 'cancelled' ORDER BY id LIMIT 1`, caseId);
  const XN = (topic: string, ct: string) => ({ primaryCode: d.issuesForTopic(topic, ct)[0].code, urgency: 'attention', moTa: 'Em mất điểm ở phần này, thiếu nền tảng cơ bản.' });

  check('CT2-3 · BE trượt S → Xác nhận Case (không kế hoạch) → PA chạy ngay, hạn T2 tuần sau; không thẻ kế hoạch; Công việc không có nhóm đó; việc tiếp Kết quả', () => {
    const sid = emTruot('CT2 BE S', 'MB BE 08', { speaking: 10 });
    const c = caseMon(sid, 'speaking'), gv = gvOf('MB BE 08', 'speaking');
    sosAuto.xacNhanCase(gv, c.id, XN('speaking', 'BE'));
    const pa = paBt(c.id);
    assert(pa.status === 'started' && pa.action_due === d.weeklyUpdateDue(TODAY) && pa.started_date === TODAY && pa.confirmed_by === gv.userId, JSON.stringify(pa));
    assert(!get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND hoc_vien_id = ?`, sid), 'không còn thẻ kế hoạch');
    for (const who of [gv, P.normalCoreTeacher, P.mbManager]) {
      assert(!((mywork.myWork(who) as any).items as any[]).some((x) => x.group === 'ke_hoach_bo_tro'), 'Công việc còn nhóm Nộp kế hoạch');
    }
    const dt = cases.caseDetail(gv, c.id) as any;
    assert(/^Kết quả/.test(dt.viecTiep?.chu ?? '') && dt.trangThaiV4.k === 'dang-lam', JSON.stringify([dt.viecTiep, dt.trangThaiV4]));
    assert(dt.boTro && !('phaiGuiKem' in dt.boTro) && !('keHoach' in dt.boTro) && !('coTheNop' in dt.boTro), JSON.stringify(dt.boTro));
  });

  await t.checkAsync('CT2-3b · FOU nhóm chung: xác nhận G+V → chỉ PA G+V chạy; Sửa PA đổi người dạy; xác nhận P sau → PA P chạy với người dạy đó; route nộp kế hoạch → 404', async () => {
    const sid = emTruot('CT2 FOU GP', 'MB FOU 12', { writing: 11, speaking: 12 });
    const cGv = caseMon(sid, 'writing'), cP = caseMon(sid, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    assert(paBt(cGv.id).status === 'started' && paBt(cP.id).status === 'planned', `G+V ${paBt(cGv.id).status} · P ${paBt(cP.id).status}`);
    cases.suaPa(P.normalCoreTeacher, paBt(cGv.id).id, { performerUserId: trang.userId });   // GVCN đổi người dạy nhóm (cùng chi nhánh)
    assert(paBt(cGv.id).performer_user_id === trang.userId, 'Sửa PA đổi người dạy');
    sosAuto.xacNhanCase(trang, cP.id, XN('speaking', 'FOU'));
    assert(paBt(cP.id).status === 'started' && paBt(cP.id).confirmed_by === trang.userId && paBt(cP.id).performer_user_id === trang.userId, JSON.stringify(paBt(cP.id)));
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const ss = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: P.normalCoreTeacher.userId }) });
      const ck = (ss.headers.get('set-cookie') ?? '').split(';')[0];
      const r = await fetch(`http://127.0.0.1:${cong}/api/bo-tro/${paBt(cGv.id).id}/ke-hoach`, {
        method: 'POST', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify({ noiDungYeu: 'x'.repeat(20), keHoach: 'y'.repeat(20) }),
      });
      assert(r.status === 404, `route nộp kế hoạch: ${r.status}`);
    } finally { may.close(); }
  });

  check('CT2-4 · migrate B: nhóm có thẻ chờ + nhóm "chờ nộp" → PA chạy, thẻ tu_dong; duyệt thẻ cũ → 409; chạy lần hai không ghi gì', () => {
    /* Dựng trạng thái CŨ: Case đã có nguyên nhân, PA bổ trợ còn planned (đường cũ chờ kế hoạch). */
    const veCu = (caseId: number) => conn.prepare(`UPDATE case_interventions SET status = 'planned', started_date = NULL, cycle_started_on = NULL, action_due = NULL,
      confirmed_at = NULL, confirmed_by = NULL WHERE case_id = ? AND kind = 'bo_tro'`).run(caseId);
    const s1 = emTruot('CT2 MIG A', 'MB FOU 12', { writing: 11 }), s2 = emTruot('CT2 MIG B', 'MB BE 08', { writing: 10 });
    const c1 = caseMon(s1, 'writing'), c2 = caseMon(s2, 'writing');
    const khoaFou = gvOf('MB FOU 12', 'writing'), khoaBe = gvOf('MB BE 08', 'writing');
    sosAuto.xacNhanCase(khoaFou, c1.id, XN('writing', 'FOU'));
    sosAuto.xacNhanCase(khoaBe, c2.id, XN('writing', 'BE'));
    veCu(c1.id); veCu(c2.id);
    const ha = P.normalCoreTeacher;
    const minId = get('SELECT MIN(id) m FROM case_interventions WHERE nhom_bo_tro = ?', paBt(c1.id).nhom_bo_tro).m;
    const theId = yc.taoYeuCau(conn, { loai: 'ke_hoach_bo_tro', doiTuongLoai: 'nhom_bo_tro', doiTuongId: minId, hocVienId: s1, nguoiXin: ha.userId,
      lyDo: 'Kế hoạch cũ', duLieu: { nhom: paBt(c1.id).nhom_bo_tro, noiDungYeu: 'a', keHoach: 'b' } });
    let ma = 0; try { yc.duyetYeuCau(P.mbManager, theId); } catch (e: any) { ma = e.status; }
    assert(ma === 409 && get('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', theId).trang_thai === 'cho', `duyệt thẻ cũ: ${ma}`);
    const a: string[] = []; migratePrCt2(conn, a);
    const p1 = paBt(c1.id), p2 = paBt(c2.id);
    assert(p1.status === 'started' && p1.confirmed_by === ha.userId && p1.action_due === d.weeklyUpdateDue(TODAY), `nhóm có thẻ: ${JSON.stringify(p1)}`);
    assert(p2.status === 'started' && p2.confirmed_by === khoaBe.userId, `nhóm chờ nộp: ${JSON.stringify(p2)}`);
    const the = get('SELECT * FROM yeu_cau_duyet WHERE id = ?', theId);
    assert(the.trang_thai === 'tu_dong' && /Bỏ bước duyệt kế hoạch/.test(the.ly_do_dong ?? ''), JSON.stringify(the));
    assert(a.length >= 1, `applied: ${a.join('; ')}`);
    const b: string[] = []; migratePrCt2(conn, b);
    assert(b.length === 0, `lần hai: ${b.join('; ')}`);
  });

  // ------------------------------------------------------------------ Task 4 · chế tài Final sinh khi đủ điểm + có quyết định
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const week: any = await import('../platform/week.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const { nguoiGiuKetQua } = await import('../cases/giuKetQua.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  console.log('PR-CT2 · Task 4 — chế tài Final sinh khi đủ điểm');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const THU_HAI = d.tuanChonDuoc(TODAY)[0] as string;
  const GV = all(`SELECT DISTINCT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB).map((r) => r.u as number);
  assert(GV.length === 4, `cần 4 giáo viên MB, có ${GV.length}`);
  let seq = 0;
  const lop = (kind: string, tuanHienTai = 1, ft = false) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-QCT${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const ganGv = (l: number, userId: number, skill: string | null) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, l, skill, skill ? 0 : 1, new Date().toISOString());
  const hocVien = (l: number, ma: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-CT2-${seq}`, `Hoc vien CT2 ${seq}`, `hoc vien ct2 ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, TODAY, now);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`)
      .run(sid, ma, TODAY, now).lastInsertRowid);
    regular.planRegularTests(P.admin, l, { studentIds: [sid], kinds: ['final'] });
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid, l).id as number;
    return { sid, cyc, a };
  };
  /** Nhập / sửa / xoá (null) điểm Final Test qua đường thật `saveRegularScore` → `refreshRegularOutcome`. */
  const nhap = (a: number, diem: Record<string, number | null>, tong = 25) => {
    for (const [k, v] of Object.entries(diem)) regular.saveRegularScore(P.admin, a, k, { score: v, total: v === null ? null : tong, lyDo: 'Phép kiểm CT2' });
  };
  const ra = (nguon: number, sid: number, huong: string, dich: number, o: Record<string, unknown> = {}) =>
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong, toClassId: dich, tuan: THU_HAI, ...o }] });
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  const chay = (sid: number) => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally { setConfig('demo_date', cu); }
    assert(lenhCua(sid).trang_thai === 'da_chuyen', `chưa chuyển: ${JSON.stringify(lenhCua(sid))}`);
  };
  const mts = (sid: number) => all('SELECT * FROM mini_test WHERE student_id = ?', sid);
  /** PA Bổ trợ miễn phí còn sống của nhóm `mt:{lượt}` + Case. */
  const paMt = (a: number) => all(
    `SELECT iv.*, sc.cycle_id, sc.owner_user_id, sc.topic, sc.status AS case_status, sc.system_close_reason FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.nhom_bo_tro = ? AND iv.status != 'cancelled' ORDER BY sc.topic`, `mt:${a}`);
  const chuKy = (ds: any[]) => ds.map((x) => `${x.topic}:${x.so_buoi}:${x.performer_user_id}`).join(' ');
  /** FOU 9 tuần, GV cũ: G+V = GV[1], P = GV[2]; lớp BE đích: GVCN GV[3], G+V/P GV[0]. */
  const dungFou = () => {
    const nguon = lop('FOU', 9), dich = lop('BE');
    ganGv(nguon, GV[0], null); ganGv(nguon, GV[1], 'writing'); ganGv(nguon, GV[2], 'speaking');
    ganGv(dich, GV[3], null); ganGv(dich, GV[0], 'writing'); ganGv(dich, GV[0], 'speaking');
    return { nguon, dich, ...hocVien(nguon, 'FOU') };
  };

  check('CT2-5 · Final đủ điểm + lệnh lên → sinh ngay, trước thứ Hai: FOU 55% 2 môn → 4 buổi, Người dạy GV cũ, lộ trình FOU, 1 Mini Test; Pre FOU 65% → tong_hop 2 buổi; BE 62% → ELE 1 buổi/môn', () => {
    const f = dungFou();
    nhap(f.a, { listening: 18, reading: 18, writing: 10 });
    ra(f.nguon, f.sid, 'len_lop', f.dich);
    assert(mts(f.sid).length === 0 && paMt(f.a).length === 0, 'chưa đủ điểm mà đã sinh');
    nhap(f.a, { speaking: 9 });   // 55/100, trượt G+V và P
    assert(lenhCua(f.sid).trang_thai === 'cho', 'lệnh phải còn chờ');
    const pa = paMt(f.a);
    assert(chuKy(pa) === `speaking:4:${GV[2]} writing:4:${GV[1]}`, `PA: ${chuKy(pa)}`);
    assert(pa.every((x) => x.cycle_id === f.cyc && x.status === 'started' && x.kind === 'bo_tro_mien_phi'), JSON.stringify(pa.map((x) => [x.cycle_id, x.status])));
    const m = mts(f.sid);
    assert(m.length === 1 && m[0].cycle_id === f.cyc && m[0].so_buoi === 4 && m[0].tu_attempt_id === f.a, JSON.stringify(m));

    const pre = lop('PREFOU', 6), fou = lop('FOU');
    const p = hocVien(pre, 'PREFOU');
    ra(pre, p.sid, 'len_lop', fou);
    nhap(p.a, { tong_hop: 26 }, 40);   // 65%
    const pp = paMt(p.a);
    assert(pp.length === 1 && pp[0].topic === 'tong_hop' && pp[0].so_buoi === 2, `Pre FOU: ${chuKy(pp)}`);

    const be = lop('BE', 11), ele = lop('ELE');
    const b = hocVien(be, 'BE');
    ra(be, b.sid, 'len_lop', ele);
    nhap(b.a, { listening: 18, reading: 18, writing: 13, speaking: 13 });   // 62%
    const bp = paMt(b.a);
    assert(bp.length === 2 && bp.every((x) => x.so_buoi === 2) && mts(b.sid).length === 1, `BE → ELE: ${chuKy(bp)}`);
  });

  check('CT2-6 · một lần: sửa ô Final không đổi số; xoá rồi nhập lại không nhân đôi; thi hành thứ Hai không thêm PA, Case + Mini Test sang lộ trình mới, chủ Case GV lớp mới, Người dạy giữ GV cũ, Kết quả về GVCN lớp mới', () => {
    const f = dungFou();
    ra(f.nguon, f.sid, 'len_lop', f.dich);
    nhap(f.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    const truoc = chuKy(paMt(f.a));
    nhap(f.a, { writing: 11 });   // 56%, vẫn trượt hai môn
    assert(chuKy(paMt(f.a)) === truoc && mts(f.sid).length === 1, `sửa ô: ${chuKy(paMt(f.a))}`);
    nhap(f.a, { speaking: null });
    assert(chuKy(paMt(f.a)) === truoc && mts(f.sid).length === 1, `xoá ô: ${chuKy(paMt(f.a))}`);
    nhap(f.a, { speaking: 9 });
    assert(chuKy(paMt(f.a)) === truoc && mts(f.sid).length === 1, `nhập lại: ${chuKy(paMt(f.a))}`);
    chay(f.sid);
    const moi = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, f.sid).id as number;
    const pa = paMt(f.a);
    assert(chuKy(pa) === truoc, `thi hành thêm / đổi PA: ${chuKy(pa)}`);
    assert(pa.every((x) => x.cycle_id === moi && x.owner_user_id === GV[0]), `Case sau thi hành: ${JSON.stringify(pa.map((x) => [x.cycle_id, x.owner_user_id]))} · mới ${moi}`);
    const m = mts(f.sid);
    assert(m.length === 1 && m[0].cycle_id === moi, `Mini Test: ${JSON.stringify(m)}`);
    const giu = nguoiGiuKetQua(pa.map((x) => ({ id: x.id, topic: x.topic, nhomBoTro: x.nhom_bo_tro, classId: f.dich, ownerUserId: x.owner_user_id })), THU_HAI);
    assert(pa.every((x) => giu.get(x.id) === GV[3]), `người giữ Kết quả: ${JSON.stringify([...giu])}`);
    assert(ck.emConMiniTest([f.sid]).get(f.sid)?.gv === GV[3], `người giữ Ghi Mini Test: ${JSON.stringify(ck.emConMiniTest([f.sid]).get(f.sid))}`);
    /* Mini Test 58% → thẻ Báo QL về người giữ việc (GVCN lớp mới), không về Người dạy (GV cũ). */
    const cu = getConfig('demo_date');
    setConfig('demo_date', m[0].ngay_du_kien);
    try { ck.ghiMiniTest(loadPrincipal(GV[3]), m[0].id, { tyLe: 58, ngay: m[0].ngay_du_kien }); } finally { setConfig('demo_date', cu); }
    const the = get(`SELECT du_lieu FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ?`, m[0].id);
    assert(the && JSON.parse(the.du_lieu).ownerId === GV[3], `thẻ Báo QL: ${the?.du_lieu}`);
  });

  check('CT2-7 · BE/ELE → FT: không Case / PA / Mini Test theo Final, cả lúc đủ điểm lẫn lúc thi hành; BE 60% lên ELE → có', () => {
    for (const [kind, ma] of [['BE', 'BE'], ['ELE', 'ELE']]) {
      const nguon = lop(kind, 11), ft = lop('FT', 1, true);
      const e = hocVien(nguon, ma);
      ra(nguon, e.sid, 'fast_track', ft, { mucTieu: 6 });
      nhap(e.a, { listening: 18, reading: 18, writing: 13, speaking: 13 });
      assert(mts(e.sid).length === 0 && paMt(e.a).length === 0, `${kind} đủ điểm: ${mts(e.sid).length}`);
      chay(e.sid);
      assert(mts(e.sid).length === 0 && paMt(e.a).length === 0, `${kind} thi hành: ${mts(e.sid).length}`);
    }
    const be = lop('BE', 11), ele = lop('ELE');
    const b = hocVien(be, 'BE');
    ra(be, b.sid, 'len_lop', ele);
    nhap(b.a, { listening: 15, reading: 15, writing: 15, speaking: 15 });
    assert(mts(b.sid).length === 1 && paMt(b.a).length === 4, `BE 60% lên ELE: ${mts(b.sid).length} · ${paMt(b.a).length}`);
  });

  check('CT2-8 · quyết định: đủ điểm chưa lệnh → không gì; ra lệnh → sinh; đổi học lại → huỷ (Case mở bởi lần sinh đóng "Đổi quyết định lộ trình", Case Giữa khoá giữ, chỉ huỷ PA + mốc); ra lại → đúng một bộ; đã có Kết quả → huỷ lệnh không huỷ gì', () => {
    const f = dungFou();
    /* Case Giữa khoá G+V còn mở (đúng khoá chống trùng) → nhận PA. */
    const gk = Number(conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, owner_user_id, detected_at, dedup_key, created_at)
       VALUES (?,?, 'writing', 'writing', 'teacher_report', 'in_progress', ?, ?, ?, ?)`,
    ).run(f.sid, f.cyc, GV[1], TODAY, d.caseDedupKey({ category: 'writing', studentId: f.sid, cycleId: f.cyc }), new Date().toISOString()).lastInsertRowid);
    nhap(f.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    assert(mts(f.sid).length === 0 && paMt(f.a).length === 0, 'chưa có quyết định mà đã sinh');
    ra(f.nguon, f.sid, 'len_lop', f.dich);
    const pa = paMt(f.a);
    assert(pa.length === 2 && mts(f.sid).length === 1 && pa.some((x) => x.case_id === gk), `ra lệnh: ${chuKy(pa)}`);
    const caseMoi = pa.find((x) => x.case_id !== gk).case_id as number;
    assert(get('SELECT 1 FROM case_milestones WHERE dedup_key = ?', `cuoi-khoa:${f.a}:${gk}`), 'mốc Final ở Case Giữa khoá');
    const fou = lop('FOU');
    lenh.suaLenh(P.mbManager, lenhCua(f.sid).id, { huong: 'hoc_lai', toClassId: fou });
    assert(mts(f.sid).length === 0 && paMt(f.a).length === 0, `đổi học lại: ${mts(f.sid).length} · ${chuKy(paMt(f.a))}`);
    const cm = get('SELECT status, system_close_reason FROM sos_cases WHERE id = ?', caseMoi);
    assert(cm.status === 'done' && cm.system_close_reason === 'doi_quyet_dinh', `Case mở bởi lần sinh: ${JSON.stringify(cm)}`);
    assert(d.SYSTEM_CLOSE_REASON_LABEL.doi_quyet_dinh === 'Đổi quyết định lộ trình', 'nhãn lý do');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', gk).status !== 'done', 'Case Giữa khoá phải còn mở');
    assert(!get('SELECT 1 FROM case_milestones WHERE dedup_key = ?', `cuoi-khoa:${f.a}:${gk}`), 'mốc Final ở Case Giữa khoá phải xoá');
    assert(get(`SELECT closed_reason FROM case_interventions WHERE case_id = ? AND nhom_bo_tro = ?`, gk, `mt:${f.a}`).closed_reason === 'system_closed', 'PA ở Case Giữa khoá huỷ');
    lenh.suaLenh(P.mbManager, lenhCua(f.sid).id, { huong: 'len_lop', toClassId: f.dich });
    const lai = paMt(f.a);
    assert(lai.length === 2 && mts(f.sid).length === 1, `ra lại: ${chuKy(lai)} · ${mts(f.sid).length}`);
    const hanh = all(`SELECT title FROM journey_events WHERE student_id = ? AND title LIKE 'Final Test%bổ trợ miễn phí%'`, f.sid);
    assert(hanh.length === 1 && hanh[0].title.includes(d.ngay(mts(f.sid)[0].han, TODAY)), `Hành trình sau ra lại: ${JSON.stringify(hanh)}`);
    /* Đã có Kết quả → huỷ quyết định không huỷ gì. */
    const iv = lai[0];
    cases.updateResult(loadPrincipal(iv.performer_user_id), iv.id, { ...KQ, ...d.thanKetQuaTuan({ kind: 'bo_tro_mien_phi', soBuoi: 4 }, '1', null) });
    lenh.huyLenh(P.mbManager, lenhCua(f.sid).id, 'Đổi ý');
    assert(paMt(f.a).length === 2 && mts(f.sid).length === 1, `đã có Kết quả mà vẫn huỷ: ${chuKy(paMt(f.a))} · ${mts(f.sid).length}`);

    /* Sửa điểm thành Pass sau khi sinh (chưa ai đụng) → tự huỷ. */
    const g = dungFou();
    ra(g.nguon, g.sid, 'len_lop', g.dich);
    nhap(g.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    assert(mts(g.sid).length === 1, 'sinh trước khi sửa');
    nhap(g.a, { writing: 18, speaking: 18 });   // 72% Pass
    assert(mts(g.sid).length === 0 && paMt(g.a).length === 0, `sửa thành Pass: ${mts(g.sid).length} · ${chuKy(paMt(g.a))}`);

    /* Huỷ quyết định → huỷ; khôi phục → sinh lại; Mini Test đã ghi → huỷ quyết định không huỷ gì. */
    const h = dungFou();
    ra(h.nguon, h.sid, 'len_lop', h.dich);
    nhap(h.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    const idL = lenhCua(h.sid).id;
    lenh.huyLenh(P.mbManager, idL, 'Đổi ý');
    assert(mts(h.sid).length === 0 && paMt(h.a).length === 0, 'huỷ quyết định');
    const kp = lenh.khoiPhucLenh(P.mbManager, [idL]);
    assert(kp.ok.length === 1 && mts(h.sid).length === 1 && paMt(h.a).length === 2, `khôi phục: ${JSON.stringify(kp)} · ${mts(h.sid).length}`);
    conn.prepare('UPDATE mini_test SET ty_le = 0.8, ngay_lam = ? WHERE student_id = ?').run(TODAY, h.sid);   // Mini Test đã ghi
    lenh.huyLenh(P.mbManager, idL, 'Đổi ý lần hai');
    assert(mts(h.sid).length === 1 && paMt(h.a).length === 2, `Mini Test đã ghi mà vẫn huỷ: ${mts(h.sid).length} · ${chuKy(paMt(h.a))}`);
  });

  check('CT2-9 · FOU 55% lên FT: không sinh sớm; thi hành → bổ trợ ở lộ trình FT như cũ', () => {
    const nguon = lop('FOU', 9), ft = lop('FT', 1, true);
    ganGv(nguon, GV[1], 'writing');
    const e = hocVien(nguon, 'FOU');
    ra(nguon, e.sid, 'fast_track', ft, { mucTieu: 6 });
    nhap(e.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    assert(mts(e.sid).length === 0 && paMt(e.a).length === 0, 'FOU → FT sinh sớm');
    chay(e.sid);
    const moi = get(`SELECT id, route FROM learning_cycles WHERE student_id = ? AND status = 'active'`, e.sid);
    const pa = paMt(e.a);
    assert(moi.route && pa.length === 2 && pa.every((x) => x.cycle_id === moi.id && x.so_buoi === 4), `FT: ${chuKy(pa)} · ${JSON.stringify(moi)}`);
    assert(pa.some((x) => x.topic === 'writing2' && x.performer_user_id === GV[1]), `Writing 2 giữ GV cũ: ${chuKy(pa)}`);
    assert(mts(e.sid).length === 1 && mts(e.sid)[0].cycle_id === moi.id, JSON.stringify(mts(e.sid)));
  });
  check('CT2-10 · migrate C: em đủ điểm Final + lệnh chờ lên, chưa Mini Test (dữ liệu trước PR-CT2) → đủ bộ, người ra lệnh ghi; lần hai applied rỗng; em đã chuyển có bổ trợ → không đổi', () => {
    /* Em đã chuyển (bổ trợ sinh sẵn) — ảnh chụp trước migrate. */
    const g = dungFou();
    ra(g.nguon, g.sid, 'len_lop', g.dich);
    nhap(g.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    chay(g.sid);
    const anh = () => JSON.stringify([paMt(g.a).map((x) => [x.id, x.case_id, x.cycle_id, x.so_buoi, x.performer_user_id, x.status]), mts(g.sid)]);
    const truocG = anh();
    /* Dữ liệu cũ: lệnh học lại (không sinh) → nhập đủ điểm → đổi hướng thẳng bằng SQL như lệnh ra trước PR-CT2. */
    const f = dungFou();
    ra(f.nguon, f.sid, 'hoc_lai', lop('FOU'));
    nhap(f.a, { listening: 18, reading: 18, writing: 10, speaking: 9 });
    conn.prepare('UPDATE lenh_chuyen_lop SET huong = ?, lop_dich_id = ? WHERE id = ?').run('len_lop', f.dich, lenhCua(f.sid).id);
    assert(mts(f.sid).length === 0 && paMt(f.a).length === 0, 'dựng sai: đã có bổ trợ trước migrate');
    const x: string[] = [];
    migratePrCt2(conn, x);
    const pa = paMt(f.a);
    assert(chuKy(pa) === `speaking:4:${GV[2]} writing:4:${GV[1]}` && pa.every((y) => y.cycle_id === f.cyc && y.recorded_by === lenhCua(f.sid).nguoi_ra_lenh), `PA: ${chuKy(pa)}`);
    assert(mts(f.sid).length === 1 && mts(f.sid)[0].so_buoi === 4, JSON.stringify(mts(f.sid)));
    assert(x.some((s) => /PR-CT2/.test(s) && /bổ trợ Final/.test(s)), `applied: ${JSON.stringify(x)}`);
    assert(anh() === truocG, `em đã chuyển bị đổi: ${anh()} ≠ ${truocG}`);
    const y: string[] = [];
    migratePrCt2(conn, y);
    assert(y.length === 0 && paMt(f.a).length === 2 && mts(f.sid).length === 1, `lần hai: ${JSON.stringify(y)}`);
  });
}
