/** PHÉP KIỂM PR-SOS — SOS v4: PA quy chế chờ xác nhận, Xác nhận Case → Xác nhận PA, Không cần theo dõi qua Quản lý. Harness do `run.ts` truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function runPrSosTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  const libsqlMod: any = await import('libsql');
  console.log('\nPR-SOS · SOS v4');

  // ------------------------------------------------------------------ Task 1 · luật thuần
  check('SOS (1) · hanXacNhan: 3 ngày tính cả ngày đầu', () => {
    assert(d.hanXacNhan('2026-09-14') === '2026-09-16', d.hanXacNhan('2026-09-14'));
  });
  check('SOS (1) · laLanGhiCuoi: 5 ca (T22, K5-25, M-17)', () => {
    const ca: [boolean, string | null, string | null, string, boolean][] = [
      [false, '2026-09-27', '2026-09-28', '2026-09-28', false],   // PA thường
      [true, '2026-09-27', '2026-09-28', '2026-09-22', true],     // tuần đang ghi chứa mốc CN 27/09
      [true, '2026-10-04', '2026-09-28', '2026-09-22', false],    // mốc tuần sau
      [true, '2026-09-27', '2026-09-21', '2026-09-29', true],     // ghi sau mốc
      [true, null, '2026-09-28', '2026-09-22', false],            // chưa có mốc
    ];
    for (const [preset, followupDue, actionDue, ngay, mong] of ca) {
      assert(d.laLanGhiCuoi({ preset, followupDue, actionDue }, ngay) === mong, `${preset} ${followupDue} ${actionDue} ${ngay}`);
    }
  });
  check('SOS (1) · quyetDinhChoPa: PA quy chế không Thay / Kết thúc; lần cuối không có quyết định (T63)', () => {
    const q = d.quyetDinhChoPa({ preset: true }, false);
    assert(!q.includes('replace') && !q.includes('end') && q.includes('keep') && q.includes('ask_manager'), q.join());
    assert(d.quyetDinhChoPa({ preset: false }, false).join() === d.PLAN_DECISIONS.join(), 'PA thường đủ 5');
    assert(d.quyetDinhChoPa({ preset: true }, true).length === 0, 'lần cuối rỗng');
  });
  check('SOS (1) · trangThaiCaseV4: đủ 7 dòng bảng + quá hạn, một nhãn', () => {
    const goc = { status: 'open' as const, fromSos: true, hasCause: false, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: true, hanXacNhan: '2026-09-16' };
    const k = (x: object, hom = '2026-09-15') => d.trangThaiCaseV4({ ...goc, ...x }, hom);
    assert(k({ systemClosed: true, dismissed: true, lyDoHeThong: 'Lượt Test đã huỷ' }).k === 'he-thong-dong' && k({ systemClosed: true, lyDoHeThong: 'Lượt Test đã huỷ' }).chu === 'Hệ thống đóng · Lượt Test đã huỷ', 'hệ thống đóng');
    assert(k({ dismissed: true, status: 'done' }).chu === 'Đã huỷ · không cần theo dõi' && k({ dismissed: true }).t === 'da-huy', 'huỷ');
    assert(k({ status: 'done', hasCause: true }).k === 'xong', 'xong');
    const cd = k({ choDuyetKhongTheoDoi: true });
    assert(cd.k === 'cho-duyet-khong-theo-doi' && cd.t === 'cho-duyet' && cd.chu === 'Chờ Quản lý duyệt · không theo dõi', 'chờ duyệt');
    const cn = k({});
    assert(cn.k === 'cho-nguyen-nhan' && cn.t === 'can-lam' && cn.han === '2026-09-16' && cn.chu === 'Chờ xác nhận nguyên nhân', JSON.stringify(cn));
    assert(k({}, '2026-09-17').t === 'qua-han' && k({}, '2026-09-16').t === 'can-lam', 'quá hạn khi hôm nay > hạn');
    assert(k({ hasCause: true }).k === 'cho-xac-nhan-pa' && k({ hasCause: true }).chu === 'Chờ xác nhận PA', 'chờ xác nhận PA');
    assert(k({ hasCause: true, coPaChoXacNhan: false, status: 'in_progress' }).k === 'dang-lam', 'đang làm');
    assert(k({ fromSos: false, hasCause: false, coPaChoXacNhan: false }).k === 'dang-lam', 'Case tay');
  });
  check('SOS (1) · viecTiepCuaCase: thứ tự nguyên nhân → chờ duyệt → Xác nhận PA → Ghi kết quả cuối → Ghi kết quả PA → Hoàn thành → Thêm PA', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: false, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: true, hanXacNhan: '2026-09-16' };
    const pa = (x: object) => ({ id: 1, ten: 'Tutor', batBuoc: true, choXacNhan: false, xong: false, actionDue: '2026-09-28', followupDue: '2026-10-18', ...x });
    const hom = '2026-09-22';
    assert(d.viecTiepCuaCase(c, [pa({ choXacNhan: true })], hom)?.chu === 'Xác nhận nguyên nhân', 'nguyên nhân');
    assert(d.viecTiepCuaCase({ ...c, choDuyetKhongTheoDoi: true }, [], hom)?.han === null, 'chờ duyệt không hạn');
    const xn = d.viecTiepCuaCase({ ...c, hasCause: true }, [pa({ choXacNhan: true })], hom);
    assert(xn?.chu === 'Xác nhận PA Tutor' && xn.han === '2026-09-16' && xn.loaiHan === 'xac-minh-sos' && xn.paId === 1, JSON.stringify(xn));
    const chay = { ...c, hasCause: true, coPaChoXacNhan: false, status: 'in_progress' as const };
    assert(d.viecTiepCuaCase(chay, [pa({ followupDue: '2026-09-27' })], hom)?.chu === 'Ghi kết quả cuối Tutor', 'lần cuối');
    const g = d.viecTiepCuaCase(chay, [pa({ id: 2, ten: 'A', batBuoc: false, followupDue: null, actionDue: '2026-09-21' }), pa({})], hom);
    assert(g?.chu === 'Ghi kết quả PA A' && g.loaiHan === 'cap-nhat-pa' && g.han === '2026-09-21', JSON.stringify(g));
    assert(d.viecTiepCuaCase(chay, [pa({ xong: true })], hom)?.chu === 'Hoàn thành Case', 'hoàn thành');
    assert(d.viecTiepCuaCase({ ...chay, fromSos: false }, [], hom)?.loaiHan === 'lap-pa', 'Thêm PA');
    assert(d.viecTiepCuaCase({ ...chay, status: 'done' }, [], hom) === null, 'xong → không việc');
    const cu = JSON.stringify([d.viecTiepCuaCase(c, [], hom), xn, g]);
    assert(!/Xác minh SOS|gợi ý|Chờ QL/.test(cu), cu);
  });
  check('SOS (1) · chanHoanThanh: PA bắt buộc chưa khép → ẩn nút + câu; PA thường → lý do', () => {
    const r = d.chanHoanThanh([{ batBuoc: true, xong: false, choDuyet: false, followupDue: null, mocChu: 'đến MT2 · W2 OCT' }]);
    assert(r.an && r.dong === 'Hoàn thành được sau khi PA theo quy chế kết thúc (đến MT2 · W2 OCT)', JSON.stringify(r));
    const t2 = d.chanHoanThanh([{ batBuoc: false, xong: false, choDuyet: true, followupDue: null, mocChu: '' }, { batBuoc: true, xong: true, choDuyet: false, followupDue: null, mocChu: '' }]);
    assert(!t2.an && t2.dong === null && t2.ly_do.join().includes('chờ Quản lý duyệt'), JSON.stringify(t2));
    assert(d.chanHoanThanh([]).ly_do.length === 1, 'chưa PA');
  });
  check('SOS (1) · mocQuyChe tính từ ngày xác nhận (dùng lại sosPlanEndDate: +30 ngày → Chủ nhật đầu tiên sau)', () => {
    /* 17/09 + 30 = 17/10 (thứ Bảy) → Chủ nhật đầu tiên sau = 18/10. */
    assert(d.mocQuyChe('one_month', { ngayXacNhan: '2026-09-17' }) === '2026-10-18', String(d.mocQuyChe('one_month', { ngayXacNhan: '2026-09-17' })));
    assert(d.mocQuyChe('until_next_mt', { ngayXacNhan: '2026-09-17' }) === null && d.mocQuyChe('until_exam', { ngayXacNhan: '2026-09-17', examDate: '2027-01-10' }) === '2027-01-10', 'chưa lịch → null');
  });
  check('SOS (1) · MT5+ = Tutor · đến lúc thi (Câu 1 = A); tên Case SOS ghép chip', () => {
    assert(d.academicSupportFor(5, 2)?.description === 'Tutor · đến lúc thi', 'MT5');
    assert(d.tenCaseSos({ mt: 1, giua: 'Reading không đạt', sos: 3 }) === '[MT1] Reading không đạt [SOS 3]', 'tên');
  });

  // ------------------------------------------------------------------ Task 2 · migrate
  const { migratePrSos } = await import('../migrate/prSos.ts');
  const migN1: any = await import('../migrate/prN1.ts');
  check('SOS (2) · migratePrSos trên libsql: thêm hai cột, chạy lần 2 không báo gì; schema.sql có cả hai cột', () => {
    const { default: SqliteDb } = libsqlMod;
    const mem = new SqliteDb(':memory:');
    mem.exec('CREATE TABLE sos_cases (id INTEGER PRIMARY KEY); CREATE TABLE case_interventions (id INTEGER PRIMARY KEY)');
    const a1: string[] = []; migratePrSos(mem, a1);
    const a2: string[] = []; migratePrSos(mem, a2);
    const cot = (b: string) => (mem.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c) => c.name);
    assert(a1.length === 2 && a2.length === 0, `${a1.join()} | ${a2.join()}`);
    assert(cot('sos_cases').includes('han_xac_nhan') && cot('case_interventions').includes('moc_quy_che'), 'thiếu cột');
    mem.close();
    const cotThat = (b: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c: any) => c.name);
    assert(cotThat('sos_cases').includes('han_xac_nhan') && cotThat('case_interventions').includes('moc_quy_che'), 'DB mới (schema.sql) thiếu cột');
  });
  check('SOS (2) · migratePrN1 không còn đổi PA chờ xác nhận (R6, M1)', () => {
    const c = conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' LIMIT 1`).get() as any;
    const id = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, preset, cycle_no, needs_approval, created_at)
      VALUES (?, 'tutor', 'Tutor · đến MT2', 'planned', 1, 1, 0, ?)`).run(c.id, new Date().toISOString()).lastInsertRowid);
    migN1.migratePrN1(conn, []);
    const iv = conn.prepare('SELECT status, confirmed_at FROM case_interventions WHERE id = ?').get(id) as any;
    conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(id);
    assert(iv.status === 'planned' && iv.confirmed_at === null, JSON.stringify(iv));
  });

  // ------------------------------------------------------------------ dữ liệu thử dùng chung (dựng qua hàm dịch vụ, như sosV3.tests.ts)
  const { P, TODAY, addDays, assertThrows } = t;
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const hanhTrinhSvc: any = await import('../students/hanhTrinh.ts');
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const { loadPrincipal: loadP } = await import('../permissions.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const CLASS = t.classId('MB FT 101');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const makeStudent = (name: string): { id: number; cycleId: number; name: string } => {
    intake.commitIntake(P.admin, { classId: CLASS, rows: [{ fullName: `SOS4 ${name}`, target: 7, email: 'hv@demo.test' }], idempotencyKey: `sos4-${name}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `SOS4 ${name}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    return { id: st.id, cycleId: cy.id, name: `SOS4 ${name}` };
  };
  const PAST_WEEK = weekSvc.mondayOf(addDays(TODAY, -14));
  const mkAttempt = (st: { id: number; cycleId: number }, no: number): any => luotThu(conn, attemptsSvc.createAttempt, P.admin, {
    studentId: st.id, cycleId: st.cycleId, classId: CLASS, no, periodId: weekSvc.ensurePeriod(PAST_WEEK).id });
  const enter = (a: any, skill: string, band: number) => attemptsSvc.saveScore(P.admin, a.id, skill, {
    ...(skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) }
      : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
      : { criteria: [band, band, band, band] }),
    lyDo: 'Phép kiểm: sửa điểm nguồn',
  });
  const caseOf = (sid: number, category: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND category = ? ORDER BY id DESC LIMIT 1', sid, category);
  const plansOf = (caseId: number) => all('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id', caseId);
  /** GVBM đang dạy đúng kỹ năng; chưa phân công ai thì GVCN (đúng luật `suggestCaseOwner`). */
  const gvKyNang = (skill: string): number => (get("SELECT user_id n FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1", CLASS, skill)
    ?? get("SELECT user_id n FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1", CLASS)).n;
  const gvcn = () => get("SELECT user_id n FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1", CLASS).n as number;
  /** MT1 SOS3: L, R, S 5.0 — ba Case, PA `Tutor · đến MT2`. */
  const mt1Sos3 = (name: string) => { const st = makeStudent(name); const a = mkAttempt(st, 1); for (const k of ['listening', 'reading', 'speaking']) enter(a, k, 5); return { st, a }; };
  /** Ghi nguyên nhân bằng SQL (Task 3 chưa có Xác nhận Case). */
  const ghiNguyenNhan = (caseId: number) => conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?, 'primary', ?, ?)`)
    .run(caseId, d.issuesForTopic('listening', null)[0].code, new Date().toISOString());

  // ------------------------------------------------------------------ Task 3 · Case tự tạo v4
  check('SOS (3) · MT1 SOS3: Case + PA quy chế CHỜ XÁC NHẬN (planned, không hạn, không mốc, moc_quy_che), hạn xác nhận 3 ngày; không có việc Ghi kết quả', () => {
    const { st } = mt1Sos3('T3a');
    const c = caseOf(st.id, 'listening');
    const iv = plansOf(c.id)[0];
    assert(plansOf(c.id).length === 1 && iv.preset === 1 && iv.kind === 'tutor' && iv.description === 'Tutor · đến MT2' && iv.status === 'planned'
      && iv.confirmed_at === null && iv.confirmed_by === null && iv.action_due === null && iv.followup_due === null && iv.started_date === null
      && iv.moc_quy_che === 'until_next_mt', JSON.stringify(iv));
    assert(c.status === 'open' && c.han_xac_nhan === d.hanXacNhan(TODAY), JSON.stringify(c));
    const s = sosState.sosCaseState(c.id);
    assert(s.dueOn === c.han_xac_nhan && s.awaitingCause && s.coPaChoXacNhan && s.choDuyetKhongTheoDoi === null, JSON.stringify(s));
    const keys = (myworkSvc.myWork(P.admin, { nguoi: 'tat-ca' }).items as any[]).map((i: any) => i.key as string);
    assert(!keys.includes(`action:${iv.id}`) && !keys.includes(`review:${iv.id}`), 'PA chờ xác nhận sinh việc Ghi kết quả');
  });
  check('SOS (3) · Thông báo: GVBM một "Xác nhận nguyên nhân Listening · em · lớp" (thân "Case mới sau MT1: …") + hạn; GVCN "SOS 3 · {tên}"; GV W1 không nhận gì', () => {
    const { st, a } = mt1Sos3('T3b');
    const c = caseOf(st.id, 'listening');
    /* Mức SOS trong tên là mức LÚC Case ra đời (nhập L trước → SOS 1); Speaking nhập sau cùng → SOS 3. */
    const nL = all(`SELECT * FROM notifications WHERE entity_type = 'sos_case' AND entity_id = ?`, c.id);
    /* PR-VAI-a (K1-42, Q20): tiêu đề = việc + em + lớp; thân "Case mới sau MT1: [MT1] Listening không đạt [SOS n] · hạn dd/mm". */
    assert(nL.length === 1 && nL[0].user_id === gvKyNang('listening') && /^Xác nhận nguyên nhân Listening · /.test(nL[0].title)
      && /^Case mới sau MT1: \[MT1\] Listening không đạt \[SOS \d\] · hạn /.test(nL[0].body) && nL[0].body.endsWith(d.ngay(d.hanXacNhan(TODAY), TODAY)), JSON.stringify(nL));
    const nS = all(`SELECT * FROM notifications WHERE entity_type = 'sos_case' AND entity_id = ?`, caseOf(st.id, 'speaking').id);
    assert(nS.length === 1 && nS[0].title.startsWith('Xác nhận nguyên nhân Speaking · ') && nS[0].body.includes('[MT1] Speaking không đạt [SOS 3]'), JSON.stringify(nS));
    /* GVCN nhận một thông báo mỗi lần mức SOS của lượt lên (khoá theo mức, có sẵn) — chỉ GVCN. */
    const nA = all(`SELECT * FROM notifications WHERE entity_type = 'assessment_attempt' AND entity_id = ? ORDER BY id`, a.id);
    assert(nA.length >= 1 && nA.every((n: any) => n.user_id === gvcn()) && nA[nA.length - 1].title === `SOS 3 · ${st.name}`, JSON.stringify(nA));
    const w1 = P.w1Teacher.userId;
    const cuaW1 = all(`SELECT n.id FROM notifications n WHERE n.user_id = ? AND ((n.entity_type = 'assessment_attempt' AND n.entity_id = ?)
      OR (n.entity_type = 'sos_case' AND n.entity_id IN (SELECT id FROM sos_cases WHERE student_id = ?)))`, w1, a.id, st.id);
    assert(w1 !== gvcn() && cuaW1.length === 0, `GV W1 nhận ${cuaW1.length}`);
  });
  check('SOS (3) · MT2 trượt lại, Case ĐÃ có nguyên nhân → mốc repeat + một PA quy chế mới chờ xác nhận theo hàng MT2 + hạn xác nhận đặt lại; PA cũ giữ nguyên', () => {
    const { st } = mt1Sos3('T3c');
    const c = caseOf(st.id, 'listening');
    ghiNguyenNhan(c.id);
    conn.prepare(`UPDATE case_interventions SET status = 'started', started_date = ?, confirmed_at = ?, confirmed_by = ? WHERE case_id = ?`)
      .run(TODAY, new Date().toISOString(), gvKyNang('listening'), c.id);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(addDays(TODAY, -10), c.id);
    const cu = JSON.stringify(plansOf(c.id)[0]);
    const a2 = mkAttempt(st, 2);
    for (const k of ['listening', 'reading', 'speaking']) enter(a2, k, 5);
    const ivs = plansOf(c.id);
    assert(ivs.length === 2 && JSON.stringify(ivs[0]) === cu, JSON.stringify(ivs));
    assert(ivs[1].status === 'planned' && ivs[1].confirmed_at === null && ivs[1].description === 'Tutor · đến MT3' && ivs[1].moc_quy_che === 'until_next_mt', JSON.stringify(ivs[1]));
    assert(get('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?', c.id).h === d.hanXacNhan(TODAY), 'hạn chưa đặt lại');
    assert(all(`SELECT kind FROM case_milestones WHERE case_id = ? AND attempt_id = ?`, c.id, a2.id).some((m: any) => m.kind === 'repeat'), 'thiếu mốc repeat');
    /* Lưu lại điểm (chạy lặp) không thêm PA thứ ba. */
    enter(a2, 'listening', 5);
    assert(plansOf(c.id).length === 2, 'chạy lặp nhân đôi PA');
  });
  check('SOS (3) · + Case cùng kỹ năng đang chờ xác nhận nguyên nhân → 400, không gộp (K3-23)', () => {
    const { st } = mt1Sos3('T3d');
    const c = caseOf(st.id, 'listening');
    assertThrows(() => cases.reportIssue(P.mbManager, { studentId: st.id, cycleId: st.cycleId, topic: 'listening', primaryCode: d.issuesForTopic('listening', null)[0].code,
      title: 'Báo thêm', summary: 'Em nghe chưa bắt được ý chính ở phần 3, cần xem lại.', mergeIntoExisting: true }),
      /Listening đang có Case chờ xác nhận nguyên nhân \(MT1 · SOS 3\) — mở Case để xác nhận\./, 'gộp vào Case chờ nguyên nhân');
    assert(get('SELECT COUNT(*) n FROM case_issues WHERE case_id = ?', c.id).n === 0, 'đã gộp nguyên nhân');
  });

  // ------------------------------------------------------------------ Task 4 · Xác nhận Case + Xác nhận PA
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const L_CODE = d.issuesForTopic('listening', null)[0].code;
  const XN = { primaryCode: L_CODE, urgency: 'attention', moTa: 'Em nghe sót số và tên riêng ở Part 1–2.' };
  const MO_TA = 'Tutor Listening hai buổi mỗi tuần, cô Hà chữa bài nghe.';
  check('SOS (4) · Xác nhận Case: thiếu nguyên nhân / mức gấp / mô tả < 15 → 400; đủ → nguyên nhân, mức gấp, mô tả, tên giữa, mốc xac_nhan_case; Case vẫn open; lần hai → 400', () => {
    const { st } = mt1Sos3('T4a');
    const c = caseOf(st.id, 'listening');
    const gv = P.admin;
    assertThrows(() => sosAuto.xacNhanCase(gv, c.id, { ...XN, primaryCode: '' }), /Chọn nhóm nguyên nhân/, 'thiếu nguyên nhân');
    assertThrows(() => sosAuto.xacNhanCase(gv, c.id, { ...XN, urgency: '' }), /mức độ gấp/, 'thiếu mức gấp');
    assertThrows(() => sosAuto.xacNhanCase(gv, c.id, { ...XN, moTa: 'ngắn quá' }), /ít nhất 15/, 'mô tả ngắn');
    sosAuto.xacNhanCase(gv, c.id, { ...XN, tenGiua: 'Listening Part 1–2 không đạt' });
    const sau = get('SELECT * FROM sos_cases WHERE id = ?', c.id);
    assert(sau.status === 'open' && sau.urgency === 'attention' && sau.summary === XN.moTa && sau.title === 'Listening Part 1–2 không đạt', JSON.stringify(sau));
    assert(get(`SELECT taxonomy_code t FROM case_issues WHERE case_id = ? AND role = 'primary'`, c.id).t === L_CODE, 'nguyên nhân');
    assert(get(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'xac_nhan_case'`, c.id).n === 1, 'mốc');
    assert(cases.caseTitleOf(sau) === '[MT1] Listening Part 1–2 không đạt [SOS 3]', cases.caseTitleOf(sau));
    assertThrows(() => sosAuto.xacNhanCase(gv, c.id, XN), /đã xác nhận nguyên nhân rồi/, 'lần hai');
  });
  check('SOS (4) · Xác nhận PA: chưa nguyên nhân → 400; mô tả < 15 → 400; đủ → started hôm nay, hạn T2, mốc từ ngày xác nhận, người đổi được, Case in_progress; lần hai → 400; GV W1 → 403', () => {
    const { st } = mt1Sos3('T4b');
    const c = caseOf(st.id, 'reading');
    const iv = plansOf(c.id)[0];
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.admin, iv.id, { description: MO_TA }), /Xác nhận nguyên nhân/, 'chưa nguyên nhân');
    sosAuto.xacNhanCase(P.admin, c.id, { ...XN, primaryCode: d.issuesForTopic('reading', null)[0].code });
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.admin, iv.id, { description: 'ngắn' }), /ít nhất 15/, 'mô tả ngắn');
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.w1Teacher, iv.id, { description: MO_TA }), /phân công/, 'GV W1');
    sosAuto.xacNhanPaQuyChe(P.admin, iv.id, { description: MO_TA, performerUserId: P.coreTeacher.userId });
    const sau = get('SELECT * FROM case_interventions WHERE id = ?', iv.id);
    assert(sau.status === 'started' && sau.started_date === TODAY && sau.cycle_started_on === TODAY && sau.cycle_no === 1
      && sau.action_due === d.weeklyUpdateDue(TODAY) && sau.followup_due === null /* until_next_mt, chưa có lịch MT2 */
      && sau.confirmed_by === P.admin.userId && sau.performer_user_id === P.coreTeacher.userId && sau.description === MO_TA, JSON.stringify(sau));
    assert(get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'in_progress', 'Case in_progress');
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.admin, iv.id, { description: MO_TA }), /đã được xác nhận rồi/, 'lần hai');
    const pa = (cases.caseDetail(P.admin, c.id) as any).interventions.find((x: any) => x.id === iv.id);
    assert(pa.batBuoc && pa.mocChu === 'đến MT2 · chưa có lịch' && pa.lanCuoi === false && !pa.awaitingConfirmation, JSON.stringify(pa));
  });

  // ------------------------------------------------------------------ Task 5 · Không cần theo dõi = thẻ Chờ duyệt; Báo QL đọc han_xac_nhan
  const yc: any = await import('../duyet/yeuCau.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  const theKtd = (caseId: number) => get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, caseId);
  const coViec = (who: any, key: string, nguoi?: string) => (myworkSvc.myWork(who, nguoi ? { nguoi } : {}).items as any[]).some((i: any) => i.key === key);
  /** MT2: W1 đạt, W2 + Speaking dưới → Case W2 của GVBM W2 (đúng kỹ năng — C02). */
  const mt2W2 = (name: string) => { const st = makeStudent(name); const a = mkAttempt(st, 2); enter(a, 'writing1', 7); enter(a, 'writing2', 5.5); enter(a, 'speaking', 5); return { st, a }; };
  const cvL = (st: any) => caseOf(st.id, 'writing2');
  check('SOS (5) · GVBM gửi → thẻ khong_theo_doi Học thuật, hạn 5 ngày; Case chưa đóng, trạng thái "Chờ Quản lý duyệt · không theo dõi"; việc cause biến; gửi lần hai / Case có nguyên nhân → 400', () => {
    const { st } = mt2W2('T5a');
    const c = cvL(st);
    const owner = P.w2Teacher;
    assert(coViec(owner, `cause:${c.id}`), 'trước khi gửi phải có việc cause');
    sosAuto.guiKhongTheoDoi(owner, c.id, { reasonCode: 'single_incident' });
    const the = theKtd(c.id);
    assert(the && the.trang_thai === 'cho' && the.phan_loai === 'hoc-thuat' && the.han_duyet === d.hanTheoNgay(TODAY, 5) && the.nguoi_xin === owner.userId, JSON.stringify(the));
    const dto = cases.caseDetail(owner, c.id) as any;
    assert(dto.status !== 'done' && dto.sos.choDuyetKhongTheoDoi && dto.yeuCauCase?.id === the.id, 'Case chưa đóng + thẻ trong caseDetail');
    const s = d.trangThaiCaseV4({ status: dto.status, fromSos: true, hasCause: false, dismissed: false, systemClosed: false,
      choDuyetKhongTheoDoi: !!dto.sos.choDuyetKhongTheoDoi, coPaChoXacNhan: dto.sos.coPaChoXacNhan, hanXacNhan: dto.sos.dueOn }, TODAY);
    assert(s.k === 'cho-duyet-khong-theo-doi', s.k);
    assert(!coViec(owner, `cause:${c.id}`), 'việc cause còn sau khi gửi');
    assertThrows(() => sosAuto.guiKhongTheoDoi(owner, c.id, { reasonCode: 'single_incident' }), /đang chờ Quản lý duyệt/, 'gửi lần hai');
    assertThrows(() => sosAuto.xacNhanCase(owner, c.id, XN), /chờ Quản lý duyệt/, 'xác nhận khi đang chờ thẻ');
    const c2 = caseOf(st.id, 'speaking');
    sosAuto.xacNhanCase(P.admin, c2.id, { ...XN, primaryCode: d.issuesForTopic('speaking', null)[0].code });
    assertThrows(() => sosAuto.guiKhongTheoDoi(P.admin, c2.id, { reasonCode: 'single_incident' }), /Case đã xác nhận nguyên nhân — kết thúc bằng Hoàn thành Case\./, 'có nguyên nhân');
  });
  check('SOS (5) · Quản lý Duyệt → Case done + dismiss_reason, PA chờ xác nhận cancelled khong_theo_doi, không vào hiệu quả; 3 mốc lịch sử', () => {
    const { st } = mt2W2('T5b');
    const c = cvL(st);
    sosAuto.guiKhongTheoDoi(P.w2Teacher, c.id, { reasonCode: 'other', reasonText: 'Em ốm cả tuần thi' });
    yc.duyetYeuCau(P.mbManager, theKtd(c.id).id);
    const sau = get('SELECT * FROM sos_cases WHERE id = ?', c.id);
    assert(sau.status === 'done' && sau.dismiss_reason_code === 'other' && sau.dismiss_reason_text === 'Em ốm cả tuần thi' && sau.closed_by === P.mbManager.userId, JSON.stringify(sau));
    const iv = plansOf(c.id)[0];
    assert(iv.status === 'cancelled' && iv.closed_reason === 'khong_theo_doi', JSON.stringify(iv));
    assert(!effectiveness.planOutcomes({ studentIds: [st.id] }).some((r: any) => r.id === iv.id), 'vào hiệu quả');
    const moc = all('SELECT kind FROM case_milestones WHERE case_id = ? ORDER BY id', c.id).map((m: any) => m.kind);
    assert(['xin_khong_theo_doi', 'ql_duyet_khong_theo_doi', 'closed'].every((k) => moc.includes(k)), moc.join());
    assert(theKtd(c.id).trang_thai === 'duyet', 'thẻ chưa chốt');
  });
  check('SOS (5) · Quản lý Từ chối (lý do bắt buộc) → Case mở, hạn mới 3 ngày, mốc + lý do, người xin nhận "Quản lý từ chối"', () => {
    const { st } = mt2W2('T5c');
    const c = cvL(st);
    const owner = P.w2Teacher;
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(addDays(TODAY, -5), c.id);
    sosAuto.guiKhongTheoDoi(owner, c.id, { reasonCode: 'single_incident' });
    const the = theKtd(c.id);
    assertThrows(() => yc.tuChoiYeuCau(P.mbManager, the.id, ''), /lý do/, 'thiếu lý do');
    yc.tuChoiYeuCau(P.mbManager, the.id, 'Em trượt hai kỹ năng, cần theo dõi');
    const sau = get('SELECT * FROM sos_cases WHERE id = ?', c.id);
    assert(sau.status === 'open' && sau.han_xac_nhan === d.hanXacNhan(TODAY), JSON.stringify(sau));
    assert(get(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'ql_tu_choi_khong_theo_doi'`, c.id)?.note === 'Em trượt hai kỹ năng, cần theo dõi', 'mốc từ chối');
    assert(all(`SELECT title FROM notifications WHERE user_id = ? AND entity_type = 'yeu_cau_duyet' AND entity_id = ?`, owner.userId, the.id)
      .some((n: any) => /Bị từ chối: Em trượt/.test(n.title)), 'GVBM không nhận thông báo từ chối');
    assert(sosState.sosCaseState(c.id).awaitingCause, 'về chờ nguyên nhân');
  });
  check('SOS (5) · Case đóng vì lý do khác (sửa điểm thành đạt) → thẻ tự đóng (S4-7); Báo QL: quá hạn → thẻ; đang chờ thẻ không theo dõi → không thẻ; có nguyên nhân → tự đóng', () => {
    const { st, a } = mt1Sos3('T5d');
    const cS = caseOf(st.id, 'speaking');
    sosAuto.guiKhongTheoDoi(P.admin, cS.id, { reasonCode: 'single_incident' });
    enter(a, 'speaking', 7);                                   // sửa điểm Speaking thành đạt → Case tự huỷ
    yc.quetYeuCau(TODAY);
    assert(theKtd(cS.id).trang_thai === 'tu_dong', `thẻ: ${theKtd(cS.id).trang_thai} · case ${get('SELECT status FROM sos_cases WHERE id = ?', cS.id).status}`);
    const cL = caseOf(st.id, 'listening'), cR = caseOf(st.id, 'reading');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id IN (?, ?)').run(addDays(TODAY, -1), cL.id, cR.id);
    sosAuto.guiKhongTheoDoi(P.admin, cR.id, { reasonCode: 'single_incident' });
    yc.quetYeuCau(TODAY);
    const baoLen = (id: number) => get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'bao_len_nguyen_nhan' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, id);
    assert(baoLen(cL.id)?.trang_thai === 'cho' && baoLen(cL.id).han_duyet === addDays(TODAY, -1), 'Case quá hạn thiếu thẻ Báo QL');
    assert(!baoLen(cR.id), 'Case đang chờ thẻ không theo dõi vẫn bị Báo QL');
    ghiNguyenNhan(cL.id);
    yc.quetYeuCau(TODAY);
    assert(baoLen(cL.id).trang_thai === 'tu_dong', 'Báo QL chưa tự đóng khi có nguyên nhân');
  });

  // ------------------------------------------------------------------ Task 6 · PA bắt buộc: Ghi kết quả cuối, khoá Thay/Kết thúc, mốc, Hoàn thành
  const W2_CODE = d.issuesForTopic('writing2', null)[0].code;
  /** Case W2 + PA quy chế `Tự học · 1 tháng` ĐÃ xác nhận (đang chạy). */
  const w2DangChay = (name: string) => {
    const { st, a } = mt2W2(name);
    const c = cvL(st);
    const iv = plansOf(c.id)[0];
    sosAuto.xacNhanCase(P.w2Teacher, c.id, { primaryCode: W2_CODE, urgency: 'attention', moTa: 'Em viết lạc đề ở Task 2, lập luận yếu.' });
    sosAuto.xacNhanPaQuyChe(P.w2Teacher, iv.id, { description: 'Tự học Writing Task 2, viết hai bài mỗi tuần.' });
    return { st, a, c, iv: get('SELECT * FROM case_interventions WHERE id = ?', iv.id) };
  };
  const KQ = { outcome: 'partial', note: 'Em viết đủ ý hơn, còn lỗi mạch lạc.' };
  check('SOS (6) · PA quy chế chưa tới mốc: Thay / Kết thúc → 400; Điều chỉnh chỉ nhận người + mô tả (gửi ngày bị bỏ qua, mốc giữ)', () => {
    const { iv } = w2DangChay('T6a');
    for (const decision of ['replace', 'end']) {
      assertThrows(() => cases.updateResult(P.w2Teacher, iv.id, { ...KQ, decision, decisionNote: 'Thử đổi phương án khác', newPlan: { kind: 'tutor', description: 'Tutor Writing' } }),
        /PA theo quy chế — không thay, không kết thúc sớm\./, decision);
    }
    assertThrows(() => cases.updateResult(P.w2Teacher, iv.id, { ...KQ, mode: 'end', nextStep: 'complete' }), /không kết thúc sớm/, 'mode end kiểu cũ');
    cases.updateResult(P.w2Teacher, iv.id, { ...KQ, decision: 'adjust', decisionNote: 'Tăng số bài viết mỗi tuần',
      adjust: { description: 'Tự học Writing Task 2, ba bài mỗi tuần', followupDue: addDays(TODAY, 60) } });
    const sau = get('SELECT * FROM case_interventions WHERE id = ?', iv.id);
    assert(sau.description === 'Tự học Writing Task 2, ba bài mỗi tuần' && sau.followup_due === iv.followup_due && sau.status === 'started', JSON.stringify(sau));
  });
  check('SOS (6) · Lần cuối (chạm mốc) → PA completed het_moc, không cần quyết định; "Chưa đủ dữ liệu" cần lý do ≥ 8', () => {
    const { iv, c } = w2DangChay('T6b');
    conn.prepare('UPDATE case_interventions SET followup_due = ? WHERE id = ?').run(addDays(iv.action_due, -1), iv.id);   // tuần đang ghi chứa mốc
    assert((cases.caseDetail(P.w2Teacher, c.id) as any).interventions.find((x: any) => x.id === iv.id).lanCuoi === true, 'DTO lanCuoi');
    assertThrows(() => cases.updateResult(P.w2Teacher, iv.id, { outcome: 'insufficient', note: 'Em nghỉ ốm cả tuần cuối.' }), /Lý do/, 'insufficient thiếu lý do');
    cases.updateResult(P.w2Teacher, iv.id, { outcome: 'insufficient', note: 'Em nghỉ ốm cả tuần cuối.', decisionNote: 'Em ốm, không đủ bài để đánh giá' });
    const sau = get('SELECT * FROM case_interventions WHERE id = ?', iv.id);
    assert(sau.status === 'completed' && sau.closed_reason === 'het_moc' && sau.completed_date === TODAY, JSON.stringify(sau));
  });
  check('SOS (6) · PA thường: followup_due luôn NULL (thêm, duyệt, ghi kết quả); Hoàn thành bị chặn khi PA quy chế chưa khép', () => {
    const { c } = w2DangChay('T6c');
    const dto = cases.recordIntervention(P.w2Teacher, c.id, { kind: 'tutor', description: 'Tutor Writing Task 2 hai buổi', status: 'started', performerSelf: true, followupDue: addDays(TODAY, 30) }) as any;
    const tay = dto.interventions.find((x: any) => !x.preset);
    assert(tay.followupDue === null, `PA thường có ngày: ${tay.followupDue}`);
    cases.updateResult(P.w2Teacher, tay.id, { ...KQ, decision: 'keep' });
    assert(get('SELECT followup_due f FROM case_interventions WHERE id = ?', tay.id).f === null, 'Giữ nguyên đặt ngày mặc định');
    const ht = (cases.caseDetail(P.mbManager, c.id) as any).hoanThanh;
    assert(ht.an && /^Hoàn thành được sau khi PA theo quy chế kết thúc \(1 tháng · đến /.test(ht.dong), JSON.stringify(ht));
    assertThrows(() => cases.closeCaseOutcome(P.mbManager, c.id, { outcome: 'improved', note: 'Em tiến bộ rõ ở Task 2.' }), /PA theo quy chế kết thúc/, 'Hoàn thành sớm');
    assertThrows(() => cases.closeCaseOutcome(P.mbManager, c.id, { note: 'Em tiến bộ rõ ở Task 2.' }), /Mức độ thành công/, 'thiếu kết quả (K3-19)');
  });
  check('SOS (6) · until_exam chưa có ngày thi → PA chạy, mốc NULL, "đến lúc thi · chưa có ngày thi", QL có việc Nhập ngày thi; có ngày thi rồi mở Case → mốc tự điền', () => {
    const st = makeStudent('T6d'); const a = mkAttempt(st, 3); enter(a, 'writing1', 7); enter(a, 'writing2', 5.5);
    const c = cvL(st);
    const iv = plansOf(c.id)[0];
    assert(iv.moc_quy_che === 'until_exam', iv.moc_quy_che);
    conn.prepare('UPDATE learning_cycles SET exam_period_id = NULL, exam_month = NULL, exam_date = NULL WHERE id = ?').run(st.cycleId);
    sosAuto.xacNhanCase(P.w2Teacher, c.id, { primaryCode: W2_CODE, urgency: 'attention', moTa: 'Em viết lạc đề ở Task 2, lập luận yếu.' });
    sosAuto.xacNhanPaQuyChe(P.w2Teacher, iv.id, { description: 'Tutor Writing Task 2 tới lúc thi, hai buổi mỗi tuần.' });
    const pa = (cases.caseDetail(P.w2Teacher, c.id) as any).interventions.find((x: any) => x.id === iv.id);
    assert(pa.status === 'started' && pa.followupDue === null && pa.mocChu === 'đến lúc thi · chưa có ngày thi', JSON.stringify(pa));
    const viec = (myworkSvc.myWork(P.mbManager, {}).items as any[]).find((x: any) => x.key === `moc:${iv.id}`);
    assert(viec && viec.tieuDe === `Nhập dự kiến thi · ${st.name}`, JSON.stringify(viec));
    const tuanThi = weekSvc.mondayOf(addDays(TODAY, 70));
    conn.prepare('UPDATE learning_cycles SET exam_period_id = ? WHERE id = ?').run(weekSvc.ensurePeriod(tuanThi).id, st.cycleId);
    cases.caseDetail(P.w2Teacher, c.id);
    assert(get('SELECT followup_due f FROM case_interventions WHERE id = ?', iv.id).f === addDays(tuanThi, 6), 'mốc chưa tự điền');
    assert(!(myworkSvc.myWork(P.mbManager, {}).items as any[]).some((x: any) => x.key === `moc:${iv.id}`), 'việc Nhập ngày thi còn');
  });
  check('SOS (6) · Chuyển lớp FT → FT: PA quy chế chưa khép đổi người sang GVBM đúng kỹ năng lớp mới, ghi lịch sử (K3-44)', () => {
    const { st, c, iv } = w2DangChay('T6e');
    const lopMoi = get(`SELECT c.id, ta.user_id FROM classes c JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.skill = 'writing2' AND ta.status = 'active'
      WHERE c.is_fast_track = 1 AND c.status = 'active' AND c.id != ? AND ta.user_id != ? LIMIT 1`, CLASS, iv.performer_user_id);
    assert(lopMoi, 'Bộ thử thiếu lớp FT khác có GV W2 khác');
    sosAuto.banGiaoPaQuyChe(st.id, lopMoi.id, P.admin.userId);
    assert(get('SELECT performer_user_id u FROM case_interventions WHERE id = ?', iv.id).u === lopMoi.user_id, 'chưa đổi người');
    assert(get(`SELECT new_value v FROM sos_case_history WHERE case_id = ? AND field = 'pa_performer'`, c.id)?.v.includes(' → '), 'thiếu lịch sử bàn giao');
    assert(/banGiaoPaQuyChe\(/.test(fs.readFileSync(path.join(REPO, 'server/src/classes/luatLoTrinh.ts'), 'utf8')), 'Chuyển lớp chưa gọi bàn giao');
  });

  // ------------------------------------------------------------------ Task 7 · Việc cần làm, Tạm dừng, số liệu
  const studentsSvc: any = await import('../students/students.ts');
  const profileSvc: any = await import('../students/profile.ts');
  const viecCua = (who: any) => myworkSvc.myWork(who, {}).items as any[];
  check('SOS (7) · Việc GVBM: "Xác nhận nguyên nhân Writing Task 2 · {HV}" → sau Xác nhận Case: "Xác nhận PA · … · {HV}" cùng hạn, nhóm Case học thuật; PA chờ xác nhận không sinh Ghi kết quả', () => {
    const { st } = mt2W2('T7a');
    const c = cvL(st);
    const iv = plansOf(c.id)[0];
    const cause = viecCua(P.w2Teacher).find((i) => i.key === `cause:${c.id}`);
    assert(cause && cause.tieuDe === `Xác nhận nguyên nhân Writing Task 2 · ${st.name}` && cause.due === c.han_xac_nhan && cause.actionLabel === 'Xác nhận nguyên nhân', JSON.stringify(cause));
    /* PR-VAI-b (Q5): `headline.next` → `dauHoSo.viec.cuaBan` — GVBM W2 thấy "Xác nhận nguyên nhân Writing Task 2" là việc của mình. */
    assert(profileSvc.studentProfile(P.w2Teacher, st.id).dauHoSo.viec.cuaBan[0]?.chu === 'Xác nhận nguyên nhân Writing Task 2', 'đầu hồ sơ chưa dùng việc tiếp v4');
    sosAuto.xacNhanCase(P.w2Teacher, c.id, { primaryCode: W2_CODE, urgency: 'attention', moTa: 'Em viết lạc đề ở Task 2, lập luận yếu.' });
    const ds = viecCua(P.w2Teacher);
    const xn = ds.find((i) => i.key === `xnpa:${iv.id}`);
    assert(xn && xn.group === 'xac_nhan_pa' && xn.tieuDe === `Xác nhận PA · Writing Task 2 · ${st.name}` && xn.due === c.han_xac_nhan, JSON.stringify(xn));
    assert(!ds.some((i) => i.key === `cause:${c.id}` || i.key === `action:${iv.id}`), 'còn dòng cause hoặc Ghi kết quả cho PA chờ xác nhận');
    assert(d.nhomViecCua('xac_nhan_pa') === 'case-hoc-thuat' && d.LOAI_HAN_CUA_VIEC.xac_nhan_pa === 'xac-minh-sos', 'nhóm / loại hạn');
  });
  check('SOS (7) · Em Tạm dừng: không dòng cause / Xác nhận PA / Ghi kết quả, không Báo QL; Quay lại → hạn tính lại từ ngày quay lại (K3-41)', () => {
    const { st } = mt2W2('T7b');
    const c = cvL(st); const cS = caseOf(st.id, 'speaking');
    const { iv } = (() => {
      sosAuto.xacNhanCase(P.admin, cS.id, { primaryCode: d.issuesForTopic('speaking', null)[0].code, urgency: 'attention', moTa: 'Em nói ngắn, thiếu ý mở rộng.' });
      sosAuto.xacNhanPaQuyChe(P.admin, plansOf(cS.id)[0].id, { description: 'Tự học Speaking, ghi âm mỗi tuần một bài.' });
      return { iv: plansOf(cS.id)[0] };
    })();
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(addDays(TODAY, -3), c.id);
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, -3), iv.id);
    studentsSvc.setStudentStatus(P.admin, st.id, 'inactive', TODAY, 'Nghỉ ốm dài ngày');
    const khoa = (myworkSvc.myWork(P.admin, { nguoi: 'tat-ca' }).items as any[]).map((i: any) => i.key as string);
    assert(!khoa.includes(`cause:${c.id}`) && !khoa.includes(`action:${iv.id}`), 'em Tạm dừng còn dòng việc Case');
    yc.quetYeuCau(TODAY);
    assert(!get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_nguyen_nhan' AND doi_tuong_id = ? AND trang_thai = 'cho'`, c.id), 'em Tạm dừng bị Báo QL');
    studentsSvc.setStudentStatus(P.admin, st.id, 'active', TODAY, 'Quay lại học');
    assert(get('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?', c.id).h === d.hanXacNhan(TODAY), 'hạn xác nhận chưa tính lại');
    assert(get('SELECT action_due h FROM case_interventions WHERE id = ?', iv.id).h === d.weeklyUpdateDue(TODAY), 'hạn ghi kết quả chưa tính lại');
  });
  check('SOS (7) · Hiệu quả PA: PA huỷ không theo dõi, PA chờ xác nhận, PA hệ thống đóng không vào N; cột Xử lý Tổng hợp theo trạng thái v4 (K1-20, K1-23, K5-55)', () => {
    const { st } = mt2W2('T7c');
    const c = cvL(st);
    sosAuto.guiKhongTheoDoi(P.w2Teacher, c.id, { reasonCode: 'single_incident' });
    yc.duyetYeuCau(P.mbManager, theKtd(c.id).id);
    const ids = new Set((effectiveness.planOutcomes({ studentIds: [st.id] }) as any[]).map((r: any) => r.id));
    for (const iv of all('SELECT id FROM case_interventions WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)', st.id)) {
      assert(!ids.has(iv.id), `PA ${iv.id} vào hiệu quả`);
    }
    const map = d.COT_XU_LY_V4;
    assert(map['cho-nguyen-nhan'] === 'choNguyenNhan' && map['cho-xac-nhan-pa'] === 'dangLam' && map['huy-khong-theo-doi'] === 'xongHuy'
      && map['cho-duyet-khong-theo-doi'] === 'choDuyet', JSON.stringify(map));
    const cot = d.cotTongHopFor('ft').filter((x: any) => x.nhom === 'xu-ly').map((x: any) => x.nhan('ft'));
    assert(cot.join('|') === 'HV có Case|Case|Chờ nguyên nhân|Chờ Quản lý duyệt|Đang làm|Xong/Huỷ', cot.join('|'));
  });

  // ------------------------------------------------------------------ Task 8 · HangCase / HangPA (quét nguồn + luật)
  const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const hamCua = (src: string, ten: string) => /* thân một hàm cấp cao nhất: từ `function ten` tới hàm kế tiếp */
    (new RegExp(`function ${ten}\\b[\\s\\S]*?(?=\\r?\\n(?:export )?function |$)`).exec(src) ?? [''])[0];
  check('SOS (8) · SkillBoard: HangCase + HangPA, không HangCaseVaPa / "Xác minh SOS" / "Chờ QL" / du-kien-ket-thuc; SOS chỉ trong chip tên; NhanTrangThai; nextStepOf đọc việc tiếp v4', () => {
    const sb = doc('web/src/modules/cases/SkillBoard.tsx');
    assert(/function HangCase\b/.test(sb) && /function HangPA\b/.test(sb) && !/HangCaseVaPa|function HangPa\b/.test(sb), 'thiếu HangCase/HangPA');
    assert(!/Xác minh SOS|Chờ QL|du-kien-ket-thuc/.test(sb), 'còn chữ cũ');
    const hangCase = hamCua(sb, 'HangCase');
    assert(!/<Level/.test(hangCase) && /<NhanTrangThai/.test(hangCase) && /<TenCase/.test(hangCase), 'hàng Case: SOS chỉ trong chip tên, một nhãn trạng thái');
    assert(!/followupDue/.test(hamCua(sb, 'HangPA')), 'HangPA còn hiện dự kiến kết thúc');
    /* PR-VAI-b (Task 6): `nextStepOf` → hàm thuần `viecTiepHang` (shared), vẫn đọc việc tiếp v4. */
    const hs = doc('shared/domain/hoSoHocVien.ts');
    assert(/viecTiepHang\(row\.cases/.test(sb) && /viecTiep/.test(hs.slice(hs.indexOf('export function viecTiepHang'))), 'nextStepOf chưa dùng việc tiếp v4');
    assert(/Chưa đạt · không mở Case/.test(sb) && /Không theo dõi \(Quản lý duyệt/.test(sb), 'CotCase thiếu chữ K3-06');
    assert((sb.match(/<CotPhai/g) ?? []).length >= 4 && /khoiSos/.test(sb), 'cột phải / khoiSos');
  });
  check('SOS (8) · Hành trình: trangThaiHop nhãn §7.3 (K3-29); viecTiepPhuongAn có Chờ xác nhận / Ghi kết quả cuối', () => {
    const h = d.trangThaiHop({ caseMo: [{ mo: '2026-08-01', soPa: 1, choNguyenNhan: true }], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: null }, '2026-09-22');
    assert(h?.chu === 'Cần làm · chờ nguyên nhân', JSON.stringify(h));
    const pa = { status: 'planned', lastOutcome: null, preset: true, confirmedAt: null, pendingApproval: false, approvalDue: null, actionDue: null, actionOverdue: false, completedOn: null };
    assert(d.viecTiepPhuongAn({ ...pa, choXacNhan: true }).loai === 'cho-xac-nhan', 'chờ xác nhận');
    assert(d.viecTiepPhuongAn({ ...pa, status: 'started', lanCuoi: true, actionDue: '2026-09-28' }).text === 'Ghi kết quả cuối', 'ghi cuối');
  });
  check('SOS (8) · Hành trình: PA quy chế chờ xác nhận (chưa ngày bắt đầu) không thành khối PA có `tu` null (bấm thử: tab trắng); tên Case dạng T21', () => {
    const { st } = mt1Sos3('T8hj');
    const r = hanhTrinhSvc.hanhTrinhHocVien(P.admin, st.id, null) as any;
    const pas = (r.hop as any[]).flatMap((h: any) => (h.vanDe ?? []).flatMap((v: any) => v.pa ?? []));
    const hopL = (r.hop as any[]).find((h: any) => h.kyNang === 'listening');
    assert(hopL?.caseMo?.length === 1 && pas.every((p: any) => typeof p.tu === 'string'), JSON.stringify(pas));
    assert(hopL.vanDe[0]?.ten === '[MT1] Listening không đạt [SOS 3]', `tên Case ở hành trình (T21): ${hopL.vanDe[0]?.ten}`);
  });

  // ------------------------------------------------------------------ Task 9 · Ngăn Case (quét nguồn)
  check('SOS (9) · CaseSosControls: XacNhanCasePanel / XacNhanPaPanel / KhongTheoDoiForm; không PresetPlanActions, /confirm, /replace, Dự kiến kết thúc, Bằng chứng', () => {
    const f = doc('web/src/modules/yThuc/CaseSosControls.tsx');
    for (const ten of ['XacNhanCasePanel', 'XacNhanPaPanel', 'KhongTheoDoiForm']) assert(new RegExp(`export function ${ten}\\b`).test(f), ten);
    assert(!/PresetPlanActions|CauseDeterminationPanel|\/confirm|\/replace|Dự kiến kết thúc|Bằng chứng/.test(f), 'còn thứ cũ');
    assert(/\/xac-nhan`/.test(f) && /\/xac-nhan-pa`/.test(f) && /useLoiForm\(/.test(f) && /<OKhac/.test(f) && /GOI_Y_MO_TA_PA/.test(f), 'thiếu đường / thành phần');
  });
  check('SOS (9) · MILESTONE_TITLE có nhãn cho MỌI kind mốc máy chủ ghi (K3-21); NganCase nút chính theo việc tiếp, ẩn Hoàn thành khi PA quy chế chưa khép', () => {
    const cp = doc('web/src/modules/cases/CasePanel.tsx');
    const bang = /const MILESTONE_TITLE[\s\S]*?\n};/.exec(cp)?.[0] ?? '';
    const kinds = new Set<string>();
    for (const f of fs.readdirSync(path.join(REPO, 'server/src/cases')).filter((x) => x.endsWith('.ts'))) {
      for (const m of doc(`server/src/cases/${f}`).matchAll(/kind: '([a-z_]+)'/g)) kinds.add(m[1]);
      for (const m of doc(`server/src/cases/${f}`).matchAll(/ghiMoc\(caseId, '([a-z_]+)'/g)) kinds.add(m[1]);
    }
    const mocs = [...kinds].filter((k) => (d.MILESTONE_KINDS as readonly string[]).includes(k) && k !== 'opened');
    const thieu = mocs.filter((k) => !new RegExp(`\\b${k}:`).test(bang));
    assert(mocs.includes('xac_nhan_case') && thieu.length === 0, `thiếu nhãn: ${thieu.join()}`);
    const nc = doc('web/src/modules/students/NganCase.tsx');
    assert(/viecTiep/.test(nc) && /ht\?\.an/.test(nc) && /XacNhanCasePanel/.test(nc) && /TheYeuCau gon yc=\{data\.yeuCauCase\}/.test(nc), 'NganCase chưa theo việc tiếp v4');
    assert(!/<Level/.test(nc), 'Ngăn Case còn nhãn SOS ở ngữ cảnh (SOS đã ở tên)');
  });

  // ------------------------------------------------------------------ Task 10 · form PA
  check('SOS (10) · 4 form không còn "Dự kiến kết thúc" / followupDue; gợi ý mô tả + kết quả PA; Điều chỉnh không có ChonTuan; Hoàn thành không chọn sẵn', () => {
    const f4 = ['web/src/modules/cases/ThaoTacCase.tsx', 'web/src/modules/cases/CapNhatTuan.tsx', 'web/src/modules/cases/QuickReport.tsx', 'web/src/modules/yThuc/CaseSosControls.tsx'];
    for (const f of f4) assert(!/Dự kiến kết thúc|followupDue/.test(doc(f)), `${f} còn dự kiến kết thúc`);
    const cnt = doc('web/src/modules/cases/CapNhatTuan.tsx');
    assert(/GOI_Y_MO_TA_PA/.test(doc(f4[0])) && /GOI_Y_MO_TA_PA/.test(cnt) && /GOI_Y_MO_TA_PA/.test(doc(f4[2])), 'thiếu gợi ý mô tả PA');
    assert(/GOI_Y_KET_QUA_PA/.test(cnt) && /quyetDinhChoPa/.test(cnt) && /Ghi kết quả cuối/.test(cnt) && !/ChonTuan/.test(cnt), 'Ghi kết quả chưa theo v4');
    assert(!/useState<string>\('improved'\)/.test(doc(f4[0])), 'Hoàn thành còn chọn sẵn');
    assert(/Ghi một PA đã làm trước đây/.test(doc(f4[0])) && /PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm\./.test(doc(f4[0])), 'Thêm PA thiếu chữ K3-18');
    const qr = doc(f4[2]);
    assert(/Mở form Xác nhận Case/.test(qr) && /Việc tiếp:/.test(qr) && /Kết quả PA/.test(qr) && /ketQua/.test(qr), 'QuickReport thiếu K3-23 / K3-24 / YC-12.5.3');
  });
  check('SOS (10) · Nhập bù: PA thiếu Kết quả PA → 400 "Dòng PA 2: chọn Kết quả PA."; đủ → PA completed + một dòng theo dõi (bảng kỹ năng hiện kết quả)', () => {
    const st = makeStudent('T10a');
    const base = {
      studentId: st.id, cycleId: st.cycleId, topic: 'reading', primaryCode: d.issuesForTopic('reading', null)[0].code,
      title: 'Nhập bù Reading', summary: 'Em sai nhiều dạng True/False/Not Given.', fromDate: '2026-07-01', toDate: '2026-07-20',
      outcome: 'improved', note: 'Em đã tiến bộ rõ sau ba tuần.',
    };
    const pa = (ketQua: string | undefined) => ({ description: 'Luyện dạng T/F/NG', performerSelf: true, fromDate: '2026-07-01', toDate: '2026-07-10', ketQua });
    assertThrows(() => cases.backfillCase(P.admin, { ...base, actions: [pa('partial'), pa(undefined)] }), /Dòng PA 2: chọn Kết quả PA\./, 'thiếu kết quả PA');
    const c = cases.backfillCase(P.admin, { ...base, actions: [pa('partial')] }) as any;
    const iv = plansOf(c.id)[0];
    const fu = all('SELECT * FROM case_followups WHERE intervention_id = ?', iv.id);
    assert(iv.status === 'completed' && fu.length === 1 && fu[0].outcome === 'partial' && fu[0].observed_on === '2026-07-10' && fu[0].next_step === 'complete' && fu[0].note === 'Nhập bù', JSON.stringify(fu));
    const bang = cases.skillSupportBoard(P.admin, st.id) as any;
    const plan = bang.rows.flatMap((r: any) => r.cases).flatMap((x: any) => x.plans).find((p: any) => p.id === iv.id);
    assert(plan?.lastOutcome === 'partial', `bảng kỹ năng: ${JSON.stringify(plan?.lastOutcome)}`);
    assert(cases.caseTopicsOf(P.admin, st.id).choNguyenNhan && typeof cases.caseTopicsOf(P.admin, st.id).choNguyenNhan === 'object', 'case-topics thiếu choNguyenNhan');
  });

  // ------------------------------------------------------------------ Task 11 · demo D7, D8 (soi bộ demo đã dựng)
  check('SOS (11) · D7: Case SOS ở MB FT 101 đủ trạng thái v4; D8: PA hạn hết T2 đúng ngày demo, PA quá hạn 1 tuần (hạn Thứ Hai), PA ở tuần mốc; không còn Case đóng kiểu cũ', () => {
    const caseCua = (ten: string, kn: string) => get(`SELECT sc.* FROM sos_cases sc JOIN students s ON s.id = sc.student_id
      WHERE s.full_name = ? AND sc.category = ? ORDER BY sc.id DESC LIMIT 1`, ten, kn);
    const k = (ten: string, kn: string) => (cases.caseDetail(P.admin, caseCua(ten, kn).id) as any).trangThaiV4.k as string;
    const ds = all(`SELECT sc.id FROM sos_cases sc JOIN students s ON s.id = sc.student_id WHERE sc.origin_kind = 'mock'
      AND s.full_name IN ('Đỗ Minh Khôi', 'Vũ Ngọc Lan', 'Bùi Thảo Vy', 'Trịnh Gia Bảo', 'Lý Minh Châu', 'Hoàng Bảo Ngọc')`)
      .map((r: any) => (cases.caseDetail(P.admin, r.id) as any).trangThaiV4.k as string);
    for (const tt of ['cho-nguyen-nhan', 'cho-duyet-khong-theo-doi', 'huy-khong-theo-doi', 'dang-lam', 'cho-xac-nhan-pa']) assert(ds.includes(tt), `thiếu ${tt}: ${ds.join()}`);
    assert(k('Vũ Ngọc Lan', 'reading') === 'cho-duyet-khong-theo-doi' && k('Vũ Ngọc Lan', 'speaking') === 'huy-khong-theo-doi', 'Lan R/S');
    assert(k('Bùi Thảo Vy', 'speaking') === 'cho-xac-nhan-pa' && k('Đỗ Minh Khôi', 'speaking') === 'dang-lam', 'Vy / Khôi Speaking');
    const bao = caseCua('Trịnh Gia Bảo', 'listening');
    assert(k('Trịnh Gia Bảo', 'listening') === 'cho-nguyen-nhan' && bao.han_xac_nhan === d.hanXacNhan(TODAY)
      && get(`SELECT 1 x FROM case_milestones WHERE case_id = ? AND kind = 'ql_tu_choi_khong_theo_doi'`, bao.id), 'Bảo: Quản lý từ chối, hạn mới');
    const paCua = (ten: string, kn: string) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1 AND status = 'started'`, caseCua(ten, kn).id);
    assert(paCua('Đỗ Minh Khôi', 'speaking').action_due === TODAY, 'D8: hạn hết T2 đúng ngày demo');
    assert(paCua('Lý Minh Châu', 'reading').action_due === addDays(TODAY, -7), 'D8: quá hạn 1 tuần');   // PR-Dọn (10a): hạn PA rơi Thứ Hai
    const ngoc = paCua('Hoàng Bảo Ngọc', 'listening');
    assert(d.laLanGhiCuoi({ preset: true, followupDue: ngoc.followup_due, actionDue: ngoc.action_due }, TODAY), `D8: tuần mốc ${JSON.stringify(ngoc)}`);
    assert(!get(`SELECT 1 x FROM case_interventions WHERE closed_reason = 'dismissed'`), 'còn PA huỷ kiểu cũ "GVBM tự đóng"');
  });
}
