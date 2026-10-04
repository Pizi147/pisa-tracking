/**
 * PR-GVa (giao việc: dữ liệu + form) — kế hoạch docs/superpowers/plans/2026-10-03-pr-gva-giao-viec.md.
 *   GVa-1 · F01 = D13: khoá gửi mỗi lần mở form thay chặn trùng 10 giây theo tiêu đề; migrate chỉ thêm.
 *   GVa-2 · web gửi khoá, mỗi lần mở form một mã (quét nguồn — web chưa có trình chạy React test).
 *   GVa-3 · F04 máy chủ: không lưu việc giao GV thiếu kỳ; kỳ rác → 400, không tạo dở.
 *   GVa-4 · F03 + F04 web: giá trị đầu form theo ngữ cảnh lúc mở, khoá nút Giao khi chưa rõ kỳ.
 */
import type { AnToanTestKit } from './anToan.tests.ts';

export async function runPrGvaTests(t: AnToanTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P } = t;
  console.log('\nPR-GVa · Giao việc: khoá gửi, kỳ của việc giao GV, form mở theo ngữ cảnh');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const doc = (rel: string) => fsMod.readFileSync(pathMod.join(REPO, rel), 'utf8');
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (mẫu anToan.tests.ts). */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { if (k === 'then') return undefined; throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
  const mg: any = await import('../worklist/mgmttasks.ts');
  const mt: any = await import('../worklist/meeting.ts');
  const caseSvc: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const kg: any = await load('../../../shared/domain/khoaGui.ts');
  const cv: any = await import('../../../shared/domain/congViec.ts');
  const dem = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as any).n as number;
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const lopMb = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;

  // ================================================================== GVa-1 · khoá gửi ở máy chủ (F01 = D13)

  check('GVa-1 · chuanKhoaGui: trống/ngắn/dài/ký tự lạ → null; hợp lệ giữ nguyên (trim); moiKhoaGui mỗi lần một mã hợp lệ', () => {
    assert(kg.chuanKhoaGui('') === null && kg.chuanKhoaGui('abc') === null && kg.chuanKhoaGui('x'.repeat(101)) === null, 'khoá xấu phải null');
    assert(kg.chuanKhoaGui(42) === null && kg.chuanKhoaGui(null) === null && kg.chuanKhoaGui(undefined) === null, 'không phải chuỗi phải null');
    assert(kg.chuanKhoaGui("mgmt-1'; DROP") === null, 'ký tự lạ phải null');
    assert(kg.chuanKhoaGui(' mgmt-171-abc123 ') === 'mgmt-171-abc123', 'trim');
    const a = kg.moiKhoaGui('mgmt'); const b = kg.moiKhoaGui('mgmt');
    assert(a !== b, 'mỗi lần mở một mã');
    assert(kg.chuanKhoaGui(a) === a && a.startsWith('mgmt-'), `mã mới phải hợp lệ: ${a}`);
    assert(d.chuanKhoaGui === kg.chuanKhoaGui && d.moiKhoaGui === kg.moiKhoaGui, 'phải re-export qua shared/domain/index.ts');
  });

  check('GVa-1 · F01 tái hiện: hai việc khác group/note/watcher cùng tiêu đề trong 10 giây là HAI việc, không mất dữ liệu', () => {
    const goc = { title: 'GVa trùng tên', branchId: MB, assigneeUserId: null, due: null, parentTaskId: null };
    const a = mg.createMgmtTask(P.admin, { ...goc, group: 'curriculum', note: 'A', idempotencyKey: 'gva-khac-0001' });
    const b = mg.createMgmtTask(P.admin, { ...goc, group: 'teacher', note: 'B', watcherUserId: P.mbManager.userId, idempotencyKey: 'gva-khac-0002' });
    assert(a.id !== b.id, 'khác khoá phải là hai việc');
    const rb = conn.prepare('SELECT group_key, note, watcher_user_id FROM tasks WHERE id = ?').get(b.id) as any;
    assert(rb.group_key === 'teacher' && rb.note === 'B' && rb.watcher_user_id === P.mbManager.userId, 'group/note/watcher của việc thứ hai không được mất');
    /* Không gửi khoá (client cũ) → luôn là việc mới, không còn gộp theo tiêu đề. */
    const c = mg.createMgmtTask(P.admin, { ...goc, group: 'curriculum', note: 'A' });
    const e = mg.createMgmtTask(P.admin, { ...goc, group: 'curriculum', note: 'A' });
    assert(c.id !== e.id, 'không khoá thì không gộp');
  });

  check('GVa-1 · cùng khoá gửi lại → cùng dòng; liên kết Case + báo cáo đơn vị + audit đúng một lần', () => {
    const caseId = (conn.prepare('SELECT id FROM sos_cases ORDER BY id LIMIT 1').get() as any).id;
    const v = { title: 'GVa retry', group: 'curriculum', branchId: null, caseIds: [caseId], idempotencyKey: 'gva-retry-0001' };
    const a = mg.createMgmtTask(P.admin, v);
    const b = mg.createMgmtTask(P.admin, v);
    assert(a.id === b.id, 'cùng khoá phải trả cùng việc');
    assert(dem('SELECT COUNT(*) n FROM task_case_links WHERE task_id = ?', a.id) === 1, 'liên kết Case một lần');
    assert(dem("SELECT COUNT(*) n FROM audit_logs WHERE action = 'mgmt_task.create' AND entity_id = ?", a.id) === 1, 'audit một lần');
    assert(dem("SELECT COUNT(*) n FROM tasks WHERE idempotency_key = 'gva-retry-0001'") === 1, 'một dòng');
  });

  check('GVa-1 · khoá gắn người tạo: người khác gửi đúng khoá đó → việc MỚI của họ, không đọc được việc người kia', () => {
    const a = mg.createMgmtTask(P.admin, { title: 'GVa của admin', group: 'curriculum', branchId: MB, idempotencyKey: 'gva-nguoi-0001' });
    const b = mg.createMgmtTask(P.mbManager, { title: 'GVa của QL', group: 'curriculum', branchId: MB, idempotencyKey: 'gva-nguoi-0001' });
    assert(a.id !== b.id, 'khoá theo người tạo');
    assert(b.title === 'GVa của QL', 'trả đúng việc của người gửi');
  });

  check('GVa-1 · kiểm quyền TRƯỚC khi tra khoá: QL chi nhánh khác gửi khoá của việc đã có → vẫn bị từ chối', () => {
    mg.createMgmtTask(P.mbManager, { title: 'GVa quyền trước', group: 'curriculum', branchId: MB, idempotencyKey: 'gva-quyen-0001' });
    assertThrows(() => mg.createMgmtTask(P.cpManager, { title: 'GVa quyền trước', group: 'curriculum', branchId: MB, idempotencyKey: 'gva-quyen-0001' }),
      /Quản lý|quyền/, 'QL CP tạo việc ở MB');
  });

  check('GVa-1 · /tasks (teacher_task): cùng khoá → một việc, PA toả ra một lần; khác khoá cùng tiêu đề → hai việc', () => {
    const v = { kind: 'teacher_task', title: 'GVa giao GV', classId: lopMb, topic: 'listening', idempotencyKey: 'gva-task-0001' };
    const a = mt.createTask(P.admin, v); const b = mt.createTask(P.admin, v);
    assert(a.id === b.id, 'cùng khoá một việc');
    const pa = dem("SELECT COUNT(*) n FROM task_students WHERE task_id = ?", a.id);
    mt.createTask(P.admin, v);
    assert(dem('SELECT COUNT(*) n FROM task_students WHERE task_id = ?', a.id) === pa, 'PA không nhân đôi');
    assert(dem("SELECT COUNT(*) n FROM audit_logs WHERE action = 'task.create' AND entity_id = ?", a.id) === 1, 'audit một lần');
    const c = mt.createTask(P.admin, { ...v, idempotencyKey: 'gva-task-0002' });
    assert(c.id !== a.id, 'khác khoá là hai việc');
  });

  let seq = 0;
  const caseMoi = () => {
    const ten = `GVA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lopMb, rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `gva-hv-${seq}` });
    const sid = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id;
    return caseSvc.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case GVa', summary: 'Case dùng cho phép kiểm khoá gửi.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `gva-case-${seq}` }).id as number;
  };

  check('GVa-1 · PA và lần xem lại: cùng khoá một dòng; khác khoá cùng mô tả hai dòng; không khoá không gộp', () => {
    const caseId = caseMoi();
    const pa = { kind: 'tutor', description: 'Kèm 1-1 hai buổi một tuần', status: 'started', startedDate: TODAY, performerSelf: true };
    const nPa = () => dem('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', caseId);
    const pa0 = nPa();
    caseSvc.recordIntervention(P.lrTeacher, caseId, { ...pa, idempotencyKey: 'gva-pa-00001' });
    caseSvc.recordIntervention(P.lrTeacher, caseId, { ...pa, idempotencyKey: 'gva-pa-00001' });
    assert(nPa() === pa0 + 1, `cùng khoá một PA: ${nPa() - pa0}`);
    caseSvc.recordIntervention(P.lrTeacher, caseId, { ...pa, idempotencyKey: 'gva-pa-00002' });
    assert(nPa() === pa0 + 2, 'khác khoá cùng mô tả → hai PA');
    const fu = { outcome: null, note: 'GVa em tiến bộ ở dạng điền từ.' };
    const nFu = () => dem('SELECT COUNT(*) n FROM case_followups WHERE case_id = ? AND note = ?', caseId, fu.note);
    caseSvc.recordFollowUp(P.lrTeacher, caseId, { ...fu, idempotencyKey: 'gva-fu-00001' });
    caseSvc.recordFollowUp(P.lrTeacher, caseId, { ...fu, idempotencyKey: 'gva-fu-00001' });
    assert(nFu() === 1, `cùng khoá một lần xem lại: ${nFu()}`);
    caseSvc.recordFollowUp(P.lrTeacher, caseId, { ...fu, idempotencyKey: 'gva-fu-00002' });
    caseSvc.recordFollowUp(P.lrTeacher, caseId, fu);
    assert(nFu() === 3, 'khác khoá / không khoá → dòng mới');
  });

  await checkAsync('GVa-1 · migratePrGva trên libsql thiếu cột: thêm cột + index, chạy lần 2 không báo gì, dòng cũ giữ nguyên; schema.sql có đủ', async () => {
    const { migratePrGva } = await load('../migrate/prGva.ts');
    const { default: SqliteDb } = await import('libsql');
    const mem = new SqliteDb(':memory:');
    mem.exec(`CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, created_by INTEGER);
              CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, description TEXT, recorded_by INTEGER);
              CREATE TABLE case_followups (id INTEGER PRIMARY KEY, note TEXT, observer_user_id INTEGER);
              INSERT INTO tasks VALUES (1, 'cũ', 7); INSERT INTO tasks VALUES (2, 'cũ', 7);
              INSERT INTO case_interventions VALUES (1, 'cũ', 7); INSERT INTO case_followups VALUES (1, 'cũ', 7);`);
    const a1: string[] = []; migratePrGva(mem, a1);
    const a2: string[] = []; migratePrGva(mem, a2);
    assert(a1.length === 3 && a2.length === 0, `${a1.join()} | ${a2.join()}`);
    for (const b of ['tasks', 'case_interventions', 'case_followups']) {
      assert((mem.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).some((c) => c.name === 'idempotency_key'), `${b} thiếu cột`);
      assert(mem.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?`).get(`ux_${b}_khoa_gui`), `${b} thiếu index`);
    }
    const cu = mem.prepare('SELECT id, title, created_by, idempotency_key FROM tasks ORDER BY id').all() as any[];
    assert(cu.length === 2 && cu.every((r) => r.title === 'cũ' && r.created_by === 7 && r.idempotency_key === null), 'dòng cũ phải giữ nguyên');
    mem.prepare(`UPDATE tasks SET idempotency_key = 'k-00000001' WHERE id = 1`).run();
    let trung = false;
    try { mem.prepare(`UPDATE tasks SET idempotency_key = 'k-00000001' WHERE id = 2`).run(); } catch { trung = true; }
    assert(trung, 'cùng người cùng khoá phải vấp unique index');
    mem.close();
    for (const [b, nguoi] of [['tasks', 'created_by'], ['case_interventions', 'recorded_by'], ['case_followups', 'observer_user_id']]) {
      assert((conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).some((c: any) => c.name === 'idempotency_key'), `DB mới (schema.sql) thiếu cột ${b}`);
      const sql = (conn.prepare(`SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?`).get(`ux_${b}_khoa_gui`) as any)?.sql ?? '';
      assert(new RegExp(`UNIQUE INDEX ux_${b}_khoa_gui ON ${b}\\(${nguoi}, idempotency_key\\) WHERE idempotency_key IS NOT NULL`).test(sql), `schema.sql thiếu index ${b}: ${sql}`);
    }
  });

  await checkAsync('GVa-1 · laTrungKhoa chỉ nhận lỗi unique của khoá gửi', async () => {
    const dbMod: any = await import('../db.ts');
    assert(dbMod.laTrungKhoa(new Error('UNIQUE constraint failed: tasks.created_by, tasks.idempotency_key')), 'lỗi khoá');
    assert(!dbMod.laTrungKhoa(new Error('UNIQUE constraint failed: tasks.code')), 'lỗi mã việc không phải lỗi khoá');
    assert(!('vuaGhi' in dbMod), 'vuaGhi phải xoá khi không còn ai gọi');
  });

  // ================================================================== GVa-3 · máy chủ không lưu việc giao GV thiếu kỳ (F04)

  const kyNay = () => week.ensurePeriod(TODAY).id as number;
  const demTao = () => [dem('SELECT COUNT(*) n FROM tasks'), dem('SELECT COUNT(*) n FROM sos_cases'), dem('SELECT COUNT(*) n FROM case_interventions'),
    dem('SELECT COUNT(*) n FROM task_students')];

  check('GVa-3 · F04 tái hiện: teacher_task không gửi periodId → vẫn có kỳ = tuần hiện tại, hiện trong danh sách tuần đó', () => {
    const r = mt.createTask(P.admin, { kind: 'teacher_task', title: 'GVa thiếu kỳ', classId: lopMb, topic: 'reading', idempotencyKey: 'gva-ky-00001' });
    assert(r.period_id === kyNay(), `period_id phải là ${kyNay()}, đang ${r.period_id}`);
    assert(mt.listTasks(P.admin, { periodId: kyNay() }).rows.some((x: any) => x.id === r.id), 'phải hiện ở danh sách tuần');
  });

  check('GVa-3 · periodId không tồn tại / không phải số nguyên dương → 400, KHÔNG có task / Case / PA nào mới', () => {
    for (const periodId of [999999, -1, 1.5, 'abc', 0]) {
      const truoc = demTao();
      assertThrows(() => mt.createTask(P.admin, { kind: 'teacher_task', title: 'GVa kỳ rác', classId: lopMb, topic: 'reading', periodId,
        idempotencyKey: `gva-ky-rac-${String(periodId).replace(/\W/g, '')}` }), /Kỳ không hợp lệ — tải lại trang rồi giao lại\./, `kỳ ${periodId}`);
      assert(JSON.stringify(truoc) === JSON.stringify(demTao()), `kỳ ${periodId}: không được tạo dở`);
    }
  });

  check('GVa-3 · periodId hợp lệ giữ nguyên; gửi lại cùng khoá không nhân đôi; việc Vận hành (branch_ops) không tự gắn kỳ', () => {
    const ky = week.ensurePeriod(util.addDays(TODAY, -7)).id;
    const v = { kind: 'teacher_task', title: 'GVa kỳ đúng', classId: lopMb, topic: 'writing1', periodId: ky, idempotencyKey: 'gva-ky-00003' };
    const a = mt.createTask(P.admin, v); const b = mt.createTask(P.admin, v);
    assert(a.period_id === ky && a.id === b.id, `giữ kỳ ${ky}: ${a.period_id}; cùng khoá một việc`);
    assert(dem("SELECT COUNT(*) n FROM tasks WHERE idempotency_key = 'gva-ky-00003'") === 1, 'một dòng');
    const ops = mt.createTask(P.admin, { kind: 'branch_ops', title: 'GVa vận hành', branchId: MB, idempotencyKey: 'gva-ky-00004' });
    assert(ops.period_id === null, `branch_ops giữ period_id như cũ (NULL): ${ops.period_id}`);
  });

  // ================================================================== GVa-2 · web gửi khoá, mỗi lần mở form một mã

  check('GVa-2 · (quét nguồn — web chưa có trình chạy React test) mọi POST /mgmt-tasks, /tasks, /cases/:id/interventions gửi khoá tạo MỘT lần mỗi lần mở form', () => {
    const tep = (dir: string): string[] => fsMod.readdirSync(pathMod.join(REPO, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? tep(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
    const loi: string[] = [];
    let soCho = 0;
    for (const f of tep('web/src')) {
      const src = doc(f);
      let o = 0;
      const re = /api\.post(?:<[^>]*>)?\((?:'\/mgmt-tasks'|'\/tasks'|`\/cases\/\$\{caseId\}\/interventions`)\s*,\s*\{([\s\S]*?)\}\);/g;
      for (const m of src.matchAll(re)) {
        soCho++; o++;
        if (!/idempotencyKey:\s*\w+\.current/.test(m[1])) loi.push(`${f}: ${m[0].slice(0, 60)}… không gửi idempotencyKey: <ref>.current`);
      }
      if (o && /idempotencyKey/.test(src) && !/useRef\(moiKhoaGui\(|useMemo\(\(\) => moiKhoaGui\(/.test(src)) loi.push(`${f}: khoá phải tạo bằng useRef(moiKhoaGui(…)) — không sinh trong hàm tao/luu`);
      if (/const (?:tao|luu) = async[\s\S]{0,1500}?moiKhoaGui\(/.test(src)) loi.push(`${f}: sinh khoá trong hàm gửi → thử lại sau lỗi mạng ra mã mới`);
    }
    assert(soCho >= 3, `phải thấy ít nhất 3 chỗ gửi (2 ở form Giao việc, 1 ở Thêm PA), thấy ${soCho}`);
    assert(loi.length === 0, loi.join(' | '));
  });

  // ================================================================== GVa-4 · form mở theo ngữ cảnh (F03) + khoá gửi khi chưa có kỳ (F04 web)

  check('GVa-4 · giaTriDauGiaoViec: "Tất cả" → rỗng; A → A; việc cha thắng bộ lọc; nhóm mặc định; hạn con = hạn cha − 1, quá khứ thì trống', () => {
    assert(cv.giaTriDauGiaoViec({ branchId: null }, '2026-10-03').branch === '', 'tất cả');
    assert(cv.giaTriDauGiaoViec({ branchId: 2 }, '2026-10-03').branch === '2', 'A');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { branchId: 3, group: 'teacher' } }, '2026-10-03').branch === '3', 'cha thắng');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { branchId: null } }, '2026-10-03').branch === '', 'cha Toàn hệ thống thắng bộ lọc A');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { branchId: 3, group: 'teacher' } }, '2026-10-03').group === 'teacher', 'nhóm theo cha');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, defaultGroup: 'tutor' }, '2026-10-03').group === 'tutor', 'nhóm biết trước');
    assert(cv.giaTriDauGiaoViec({ branchId: 2 }, '2026-10-03').group === 'curriculum', 'nhóm mặc định');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { due: '2026-10-10' } }, '2026-10-03').due === '2026-10-09', 'hạn cha − 1');
    assert(cv.giaTriDauGiaoViec({ branchId: 2, parent: { due: '2026-10-03' } }, '2026-10-03').due === '', 'hạn cha − 1 đã qua → trống');
    assert(d.giaTriDauGiaoViec === cv.giaTriDauGiaoViec && d.trangThaiKyGiao === cv.trangThaiKyGiao && d.duocGiao === cv.duocGiao, 're-export');
  });

  check('GVa-4 · trangThaiKyGiao + duocGiao: đang tải / lỗi 503 / không neo → không cho giao; neo id null vẫn cho (sẽ resolve)', () => {
    assert(cv.trangThaiKyGiao({ loading: true, error: null, data: null }).loai === 'dang-tai', 'tải');
    assert(cv.trangThaiKyGiao({ loading: false, error: { status: 503 }, data: null }).loai === 'loi', 'lỗi');
    assert(cv.trangThaiKyGiao({ loading: false, error: { status: 503 }, data: [{ id: 1, weekStart: '2026-09-28', isAnchor: true }] }).loai === 'loi', 'lỗi thắng dữ liệu cũ');
    assert(cv.trangThaiKyGiao({ loading: false, error: null, data: [{ id: 1, weekStart: '2026-09-28', isAnchor: false }] }).loai === 'khong-neo', 'không neo');
    const k = cv.trangThaiKyGiao({ loading: false, error: null, data: [{ id: null, weekStart: '2026-09-28', code: 'W5 SEP 2026', isAnchor: true }] });
    assert(k.loai === 'co' && k.id === null && k.weekStart === '2026-09-28' && cv.duocGiao(k, false) && !cv.duocGiao(k, true), 'neo không id vẫn giao, busy thì không');
    for (const loai of ['dang-tai', 'loi', 'khong-neo']) assert(!cv.duocGiao({ loai }, false), `${loai} không cho giao`);
  });

  check('GVa-4 · (quét nguồn, bất đắc dĩ) CreateTask mount lại theo key mỗi lần mở; state đầu từ giaTriDauGiaoViec; nút Giao theo duocGiao', () => {
    const src = doc('web/src/modules/worklist/MgmtTasksPage.tsx');
    assert(!src.includes('useState(String(parent?.branchId ?? branchId'), 'còn state chi nhánh tính một lần lúc trang dựng (F03)');
    assert(/<CreateTaskForm key=\{/.test(src), 'CreateTaskForm phải có key= (mỗi lần mở một lần mount)');
    assert(/giaTriDauGiaoViec\(/.test(src) && /trangThaiKyGiao\(/.test(src) && /duocGiao\(/.test(src), 'form phải dùng luật chung');
    assert(!/if \(!open\) return null;/.test(src.slice(src.indexOf('function CreateTaskForm'))), 'thân form không còn tự ẩn — vỏ quyết định');
  });

  // ------------------------------------------------------------------ HTTP: gửi đồng thời cùng khoá
  const accounts: any = await import('../platform/accounts.ts');
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, o: { body?: unknown; ip?: string; cookie?: string } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.ip) headers['x-nf-client-connection-ip'] = o.ip;
    if (o.cookie) headers.cookie = o.cookie;
    if (o.ip) process.env.BAN_CHINH = '1';
    try {
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân JSON */ }
      return { status: res.status, json, setCookie: res.headers.get('set-cookie') };
    } finally { if (o.ip) delete process.env.BAN_CHINH; }
  };
  const IP = '203.0.113.171';
  /** QL chi nhánh MB: role 'manager', branches ['MB']. */
  const taoTaiKhoanQl = (ten: string) => {
    const email = `${ten}${accounts.EMAIL_SUFFIX}`;
    const password = 'matkhau-gva1';
    accounts.createAccount(P.admin, { email, password, fullName: `Thử ${ten}`, roles: [{ role: 'manager', branches: ['MB'] }] });
    return { email, password };
  };
  const dangNhap = (tk: { email: string; password: string }) => goi('POST', '/auth/login', { ip: IP, body: { email: tk.email, password: tk.password } });

  try {
    const tk = taoTaiKhoanQl('gva.dongthoi');
    const ck = ((await dangNhap(tk)).setCookie ?? '').split(';')[0];

    await checkAsync('GVa-1 · gửi đồng thời cùng khoá (hai POST /api/mgmt-tasks) → hai phản hồi 200 cùng id, một dòng', async () => {
      assert(ck, 'chưa đăng nhập được');
      const body = { title: 'GVa đồng thời', group: 'curriculum', branchId: MB, idempotencyKey: 'gva-dong-0001' };
      const [r1, r2] = await Promise.all([goi('POST', '/mgmt-tasks', { body, cookie: ck }), goi('POST', '/mgmt-tasks', { body, cookie: ck })]);
      assert(r1.status === 200 && r2.status === 200 && r1.json.id === r2.json.id, `cùng id: ${r1.status}/${r2.status} ${JSON.stringify(r1.json)}`);
      assert(dem("SELECT COUNT(*) n FROM tasks WHERE idempotency_key = 'gva-dong-0001'") === 1, 'một dòng');
    });

    await checkAsync('GVa-1 · gửi đồng thời cùng khoá (hai POST /api/tasks giao GV) → hai phản hồi 200 cùng id, một dòng, PA không nhân đôi', async () => {
      const body = { kind: 'teacher_task', title: 'GVa đồng thời GV', classId: lopMb, topic: 'reading', idempotencyKey: 'gva-dong-0002' };
      const [r1, r2] = await Promise.all([goi('POST', '/tasks', { body, cookie: ck }), goi('POST', '/tasks', { body, cookie: ck })]);
      assert(r1.status === 200 && r2.status === 200 && r1.json.id === r2.json.id, `cùng id: ${r1.status}/${r2.status} ${JSON.stringify(r1.json)}`);
      assert(dem("SELECT COUNT(*) n FROM tasks WHERE idempotency_key = 'gva-dong-0002'") === 1, 'một dòng');
      const nEm = dem('SELECT COUNT(*) n FROM task_students WHERE task_id = ?', r1.json.id);
      const nPa = dem('SELECT COUNT(*) n FROM task_students WHERE task_id = ? AND intervention_id IS NOT NULL', r1.json.id);
      assert(nEm === nPa, `mỗi em một PA: ${nEm}/${nPa}`);
    });
  } finally {
    try { conn.prepare('DELETE FROM auth_attempts').run(); } catch { /* bảng chưa có */ }
    may.close();
  }
}
