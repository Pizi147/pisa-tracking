/** PHÉP KIỂM PR-Dọn-a — quyền, an toàn, một luật cho một khái niệm, xoá mã chết, tốc độ (kế hoạch 2026-10-01-pr-don-ma-thua-quyen, Task 1–10). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDonATests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const { loadPrincipal } = await import('../permissions.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const mgmt: any = await import('../worklist/mgmttasks.ts');
  const timNguoiSvc: any = await import('../platform/timNguoi.ts');
  const { createApp } = await import('../app.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const cyclesSvc: any = await import('../fasttrack/cycles.ts');
  const week: any = await import('../platform/week.ts');
  const hl: any = await import('../worklist/highlights.ts');
  const meeting: any = await import('../worklist/meeting.ts');

  const cn = (code: string) => get('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB');
  const CP = cn('CP');
  const gvcnCua = (lop: string) => loadPrincipal(get('SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = \'active\' LIMIT 1', classId(lop)).user_id);
  let seq = 0;
  /** Em mới vào lớp `lop` qua đường Thêm HV thật; trả id em + lộ trình đang chạy. */
  const emMoi = (lop: string) => {
    const ten = `DONA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `dona-${seq}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    return { sid: st.id as number, cy: cy?.id as number };
  };

  /** Máy chủ thật + phiên demo theo người dùng — phép kiểm quyền đi qua đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number | null, url: string, init?: RequestInit) => Promise<{ status: number; json: any }>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number | null, url: string, init: RequestInit = {}) => {
      if (userId !== null && !phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
        ...init, headers: { 'content-type': 'application/json', ...(userId !== null ? { cookie: phien.get(userId)! } : {}), ...(init.headers ?? {}) },
      });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân JSON */ }
      return { status: res.status, json };
    };
    try { await fn(goi); } finally { may.close(); }
  }

  // ------------------------------------------------------------------ khối 1 · quyền đã biết (quét #6, #7, #8, #11, #25, helpName)
  console.log('\nPR-Dọn-a · (1) Quyền đã biết: /ref/nguoi, duyetNhieu, listCases, nhập bù, helpName');
  const emCp = emMoi('CP FT 110');
  /* GV chỉ thuộc CP (không có vai ở MB) — để đối chứng phạm vi của /ref/nguoi. */
  const gvChiCp = get(
    `SELECT u.id, u.full_name FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
      WHERE u.status = 'active' AND ur.branch_id = ?
        AND NOT EXISTS (SELECT 1 FROM user_roles x WHERE x.user_id = u.id AND x.status = 'active' AND (x.branch_id IS NULL OR x.branch_id != ?)) LIMIT 1`, CP, CP);

  await checkAsync('Dọn-a (1a) · /ref/nguoi?studentId={HV CP}: QL MB → 403; QL CP → 200 có người; không gửi trongPhamVi QL MB vẫn KHÔNG thấy GV chỉ thuộc CP (Q2)', async () => {
    assert(gvChiCp, 'dữ liệu demo: cần một GV chỉ thuộc CP');
    await voiMayChu(async (goi) => {
      const mb = await goi(P.mbManager.userId, `/ref/nguoi?nhom=giao_vien&studentId=${emCp.sid}`);
      assert(mb.status === 403 && !JSON.stringify(mb.json).includes(gvChiCp.full_name), `QL MB hỏi em CP: ${mb.status} ${JSON.stringify(mb.json).slice(0, 200)}`);
      const cp = await goi(P.cpManager.userId, `/ref/nguoi?nhom=giao_vien&studentId=${emCp.sid}`);
      assert(cp.status === 200 && Array.isArray(cp.json) && cp.json.length > 0, `QL CP: ${cp.status}`);
      const tim = await goi(P.mbManager.userId, `/ref/nguoi?nhom=giao_vien&q=${encodeURIComponent(gvChiCp.full_name)}`);
      assert(tim.status === 200 && !tim.json.some((x: any) => x.id === gvChiCp.id), `QL MB thấy GV chỉ thuộc CP: ${JSON.stringify(tim.json)}`);
      const qt = await goi(P.admin.userId, `/ref/nguoi?nhom=giao_vien&q=${encodeURIComponent(gvChiCp.full_name)}`);
      assert(qt.status === 200 && qt.json.some((x: any) => x.id === gvChiCp.id), 'khẳng định: Quản trị (toàn hệ thống) vẫn thấy');
    });
    /* GV MB (không dạy lớp CP) cũng không thấy GV chỉ thuộc CP. */
    assert(!timNguoiSvc.timNguoi(P.w1Teacher, { q: gvChiCp.full_name, nhom: 'giao_vien' }).some((x: any) => x.id === gvChiCp.id), 'GV MB thấy GV chỉ thuộc CP');
  });

  /* Một thẻ Đề xuất PA đang chờ ở MB (loại duyệt hàng loạt được). */
  const theDeXuatMb = () => {
    const { sid } = emMoi('MB FT 101');
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: `Case thử Dọn-a ${seq}`,
      summary: 'Case dựng riêng cho phép kiểm duyệt nhiều.', primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-case-${seq}` });
    const r = cases.recordIntervention(P.lrTeacher, c.id, { kind: 'tutor', description: 'Tutor 1-1 hai buổi mỗi tuần', status: 'planned', needsApproval: true });
    const ivId = r.interventions[r.interventions.length - 1].id;
    return get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, ivId).id as number;
  };
  check('Dọn-a (1b) · duyetNhieu([\'abc\', id]): GV → 403 (không phải 400); QL → mã sai dạng lỗi riêng, mã đúng vẫn duyệt (Q1)', () => {
    const id = theDeXuatMb();
    assert(maLoi(() => yc.duyetNhieu(P.coreTeacher, ['abc', id])) === 403, `GV: ${maLoi(() => yc.duyetNhieu(P.coreTeacher, ['abc', id]))}`);
    assert(maLoi(() => yc.duyetNhieu(P.coreTeacher, 'khong-phai-mang')) === 403, 'GV gửi thân sai dạng vẫn phải 403');
    const r = yc.duyetNhieu(P.mbManager, ['abc', id]);
    assert(r.ok.length === 1 && r.ok[0] === id && r.loi.length === 1 && r.loi[0].id === 'abc', JSON.stringify(r));
  });

  check('Dọn-a (1c) · listCases: em chuyển MB → CP, Case cũ gắn lượt lớp MB: lọc lớp CP → QL CP và GVCN CP thấy, branchId = CP; QL MB lọc lớp CP không thấy (Q5)', () => {
    const { sid } = emMoi('MB FT 101');
    const luot = get(`SELECT id FROM assessment_attempts WHERE student_id = ? ORDER BY id LIMIT 1`, sid);
    assert(luot, 'em FT mới phải có lượt MT tự tạo');
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case cũ trước khi chuyển chi nhánh',
      summary: 'Case gắn lượt ở lớp cũ, em đã chuyển chi nhánh.', primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-1c-${sid}` });
    /* Dựng tay: Case gắn lượt của lớp MB; em chuyển sang CP FT 110 (ghi danh cũ `transferred`). */
    conn.prepare('UPDATE sos_cases SET attempt_id = ? WHERE id = ?').run(luot.id, c.id);
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(TODAY, sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId('CP FT 110'), TODAY, new Date().toISOString());
    conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(CP, sid);
    const cpLop = classId('CP FT 110');
    const cuaCp = cases.listCases(P.cpManager, { classId: cpLop }).rows.find((r: any) => r.id === c.id);
    assert(cuaCp && cuaCp.branchId === CP, `QL CP lọc lớp CP: ${JSON.stringify(cuaCp && { branchId: cuaCp.branchId })}`);
    assert(cases.listCases(gvcnCua('CP FT 110'), { classId: cpLop }).rows.some((r: any) => r.id === c.id), 'GVCN lớp mới phải thấy Case cũ');
    assert(cases.listCases(P.cpManager, { branchId: CP }).rows.some((r: any) => r.id === c.id), 'QL CP lọc chi nhánh CP');
    assert(!cases.listCases(P.mbManager, { classId: cpLop }).rows.some((r: any) => r.id === c.id), 'phủ định: QL MB lọc lớp CP vẫn thấy Case');
    assert(!cases.listCases(P.mbManager, {}).rows.some((r: any) => r.id === c.id), 'phủ định: QL MB vẫn thấy Case của em đã sang CP');
  });

  const nhapBu = (p: any, studentId: number, khoa?: string) => cases.backfillCase(p, {
    studentId, topic: 'listening', primaryCode: d.issuesForTopic('listening')[0].code,
    title: 'Nhập bù thử Dọn-a', summary: 'Case nhập bù dùng cho phép kiểm Dọn-a.',
    fromDate: '2026-08-01', toDate: '2026-08-10',
    actions: [{ ketQua: 'partial', description: 'Tutor ngoài kèm hai buổi', performerName: 'Tutor ngoài Lan', fromDate: '2026-08-01', toDate: '2026-08-10' }],
    outcome: 'improved', note: 'Hai buổi hỗ trợ, ghi lại đủ.', ...(khoa ? { idempotencyKey: khoa } : {}),
  });
  check('Dọn-a (1d) · nhập bù hai lần cùng idempotencyKey → MỘT Case, lần hai trả id cũ (Q3)', () => {
    const { sid } = emMoi('MB FT 101');
    const a = nhapBu(P.mbManager, sid, `dona-bf-${sid}`);
    const b = nhapBu(P.mbManager, sid, `dona-bf-${sid}`);
    const n = get(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND origin_kind = 'backfill'`, sid).n;
    assert(a.id === b.id && n === 1, `hai lần: ${a.id} / ${b.id}, số Case ${n}`);
  });
  check('Dọn-a (1d) · GV MB nhập bù cho em CP (đã có Case nhập bù trùng khoảng) → 403, thân lỗi KHÔNG có duplicateBackfill (quét #6)', () => {
    nhapBu(P.cpManager, emCp.sid, `dona-bf-cp-${emCp.sid}`);
    const e = loiCua(() => nhapBu(P.w1Teacher, emCp.sid));
    assert(e && e.status === 403 && !JSON.stringify(e.details ?? {}).includes('duplicateBackfill') && !/trùng khoảng/.test(e.message),
      `GV MB: ${e?.status} ${e?.message} ${JSON.stringify(e?.details ?? {})}`);
  });

  check('Dọn-a (1e) · Tạm ngưng việc Vận hành: helpName 121 ký tự → 400 "Tối đa 120 ký tự"; 120 → ok; helpName: 42 → 400 (không phải 500)', () => {
    const v = mgmt.createMgmtTask(P.mbManager, { title: 'Việc thử helpName Dọn-a', group: 'teacher', branchId: MB });
    const tamNgung = (helpName: unknown) => mgmt.updateMgmtTask(P.mbManager, v.id, { progress: 'paused', reason: 'Chờ người hỗ trợ.', reviewOn: TODAY, helpName });
    const e = loiCua(() => tamNgung('a'.repeat(121)));
    assert(e?.status === 400 && /Tối đa 120 ký tự/.test(e.message), `121: ${e?.status} ${e?.message}`);
    assert(maLoi(() => tamNgung(42)) === 400, `42: ${maLoi(() => tamNgung(42))}`);
    tamNgung('b'.repeat(120));
    assert(get('SELECT help_name FROM tasks WHERE id = ?', v.id).help_name === 'b'.repeat(120), 'lưu đủ 120 ký tự');
  });

  // ------------------------------------------------------------------ khối 2 · quét an toàn: quyền và phạm vi (quét #1, #3, #5, #9, #10, #12, #19, #20)
  console.log('\nPR-Dọn-a · (2) Quét an toàn — quyền và phạm vi ở các route giữ lại');
  const tuanNay = week.mondayOf(TODAY);
  const luotCua = (cycleId: number) => all('SELECT id, class_id, note, status, planned_period_id FROM assessment_attempts WHERE cycle_id = ? ORDER BY id', cycleId);
  check('Dọn-a (2a) · #1 createAttempt(QL MB, HV MB, lộ trình của HV CP) → 400 "Lộ trình không thuộc học viên này"; lượt HV CP không đổi; lớp lượt mới = lớp đang học dù gửi classId khác (Q26)', () => {
    const emMb = emMoi('MB FT 101');
    const truoc = JSON.stringify(luotCua(emCp.cy));
    const e = loiCua(() => svc.createAttempt(P.mbManager, { studentId: emMb.sid, cycleId: emCp.cy, attemptNo: 1, periodId: week.ensurePeriod(tuanNay).id, note: 'ghi đè' }));
    assert(e?.status === 400 && /Lộ trình không thuộc học viên này/.test(e.message), `lộ trình em khác: ${e?.status} ${e?.message}`);
    assert(JSON.stringify(luotCua(emCp.cy)) === truoc, 'lượt của HV CP bị đổi');
    const moi = svc.createAttempt(P.mbManager, { studentId: emMb.sid, cycleId: emMb.cy, classId: classId('MB FOU 12'), periodId: week.ensurePeriod(t.addDays(tuanNay, 56)).id });
    assert(moi.class_id === classId('MB FT 101'), `lớp lượt mới: ${moi.class_id}`);
  });

  check('Dọn-a (2b) · #3 highlights: GV thuần chỉ thấy lớp mình dạy; ?branchId=CP → không lớp nào; QL MB vẫn thấy mọi lớp MB đang mở', () => {
    const gv = P.subjectTeacher;
    const day = new Set(gv.assignments.map((a: any) => a.classId));
    const lop = hl.visibleClasses(gv, null) as any[];
    assert(lop.length > 0 && lop.every((c) => day.has(c.id)), `GV thấy lớp ngoài phân công: ${lop.filter((c) => !day.has(c.id)).map((c) => c.code).join(', ')}`);
    assert((hl.visibleClasses(gv, CP) as any[]).length === 0, 'GV hỏi chi nhánh CP vẫn ra lớp');
    const ql = hl.visibleClasses(P.mbManager, null) as any[];
    const mbMo = get(`SELECT COUNT(*) n FROM classes WHERE branch_id = ? AND status = 'active'`, MB).n;
    assert(ql.length === mbMo && ql.every((c) => c.branch_id === MB), `QL MB: ${ql.length} / ${mbMo}`);
  });

  const caseCp = cases.reportIssue(P.cpManager, { studentId: emCp.sid, topic: 'listening', title: 'Case CP thử phạm vi việc',
    summary: 'Case chi nhánh CP dùng cho phép kiểm Dọn-a.', primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-cp-${emCp.sid}` });
  check('Dọn-a (2c) · #5 việc Vận hành: QL MB gắn Case CP → 403 (không tạo việc); việc cha của CP → 403; 51 Case → 400; QT gắn Case CP được', () => {
    const chaCp = mgmt.createMgmtTask(P.admin, { title: 'Việc cha CP Dọn-a', group: 'teacher', branchId: CP });
    const truoc = get('SELECT COUNT(*) n FROM tasks').n;
    assert(maLoi(() => mgmt.createMgmtTask(P.mbManager, { title: 'Việc gắn Case CP', group: 'teacher', branchId: MB, caseIds: [caseCp.id] })) === 403, 'Case CP');
    assert(maLoi(() => mgmt.createMgmtTask(P.mbManager, { title: 'Việc con CP', group: 'teacher', branchId: MB, parentTaskId: chaCp.id })) === 403, 'cha CP');
    assert(maLoi(() => mgmt.createMgmtTask(P.mbManager, { title: 'Việc con CP', group: 'teacher', parentTaskId: chaCp.id })) === 403, 'cha CP, không gửi branchId');
    assert(maLoi(() => mgmt.createMgmtTask(P.mbManager, { title: 'Nhiều Case', group: 'teacher', branchId: MB, caseIds: Array.from({ length: 51 }, (_, i) => i + 1) })) === 400, '51 Case');
    assert(get('SELECT COUNT(*) n FROM tasks').n === truoc, 'bị từ chối mà vẫn tạo việc');
    const v = mgmt.createMgmtTask(P.admin, { title: 'Việc QT gắn Case CP', group: 'teacher', branchId: CP, caseIds: [caseCp.id, caseCp.id] });
    assert(v.cases.length === 1 && v.cases[0].id === caseCp.id, 'khẳng định: QT gắn Case CP, bỏ trùng');
  });

  await checkAsync('Dọn-a (2d, 2e) · #9 /ref/teachers?branchId=CP và /ref/users của QL MB không ra GV chỉ thuộc CP; #10 progress / suggested-mocks / admin/routes 403, /ref/routes 401 khi chưa đăng nhập và không có inUse', async () => {
    await voiMayChu(async (goi) => {
      const gvCp = await goi(P.mbManager.userId, `/ref/teachers?branchId=${CP}`);
      assert(gvCp.status === 200 && !gvCp.json.some((x: any) => x.id === gvChiCp.id), `ref/teachers CP: ${JSON.stringify(gvCp.json).slice(0, 200)}`);
      const gvMb = await goi(P.mbManager.userId, '/ref/teachers');
      assert(gvMb.json.length > 0 && !gvMb.json.some((x: any) => x.id === gvChiCp.id), 'ref/teachers không gửi chi nhánh vẫn ra GV CP');
      const qtCp = await goi(P.admin.userId, `/ref/teachers?branchId=${CP}`);
      assert(qtCp.json.some((x: any) => x.id === gvChiCp.id), 'khẳng định: QT thấy GV CP');
      const users = await goi(P.mbManager.userId, '/ref/users');
      assert(users.status === 200 && users.json.some((x: any) => x.id === P.coreTeacher.userId) && !users.json.some((x: any) => x.id === gvChiCp.id),
        `ref/users QL MB: ${users.json.length} dòng`);
      const pr = await goi(P.w1Teacher.userId, `/classes/${classId('CP FT 110')}/progress`);
      assert(pr.status === 403, `progress lớp khác: ${pr.status}`);
      assert((await goi(P.w1Teacher.userId, `/classes/${classId('MB FT 101')}/progress`)).status === 200, 'khẳng định: GV xem lớp mình dạy');
      assert((await goi(P.mbManager.userId, `/cycles/${emCp.cy}/suggested-mocks`)).status === 403, 'suggested-mocks em CP');
      assert((await goi(P.cpManager.userId, `/cycles/${emCp.cy}/suggested-mocks`)).status === 200, 'khẳng định: QL CP');
      assert((await goi(P.w1Teacher.userId, '/admin/routes')).status === 403, 'admin/routes GV');
      assert((await goi(null, '/ref/routes')).status === 401, '/ref/routes chưa đăng nhập');
      const r = await goi(P.w1Teacher.userId, '/ref/routes');
      assert(r.status === 200 && r.json.length > 0 && r.json.every((x: any) => !('inUse' in x)), `/ref/routes còn inUse: ${JSON.stringify(r.json[0])}`);
      const a = await goi(P.admin.userId, '/admin/routes');
      assert(a.status === 200 && a.json.every((x: any) => typeof x.inUse === 'number'), 'khẳng định: QT có inUse');
    });
  });

  check('Dọn-a (2f) · #12 từ chối quyền trả 403 (không phải 400): dời / khôi phục / hiệu chỉnh vắng thi, đóng Case, việc Vận hành, người theo dõi', () => {
    const luotMb = get(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, classId('MB FT 101')).id;
    const ma: Record<string, number | string> = {
      requestAbsenceMove: maLoi(() => absence.requestAbsenceMove(P.cpManager, luotMb, ['listening'], {})),
      restoreCancelledSkill: maLoi(() => absence.restoreCancelledSkill(P.cpManager, luotMb, 'listening', week.ensurePeriod(tuanNay).id)),
      resolveLateNoShow: maLoi(() => absence.resolveLateNoShow(P.cpManager, luotMb, 'listening', 'confirm')),
    };
    const yc = get(`SELECT r.id FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id JOIN classes c ON c.id = a.class_id WHERE c.branch_id = ? LIMIT 1`, MB);
    if (yc) ma.decideAbsenceMove = maLoi(() => absence.decideAbsenceMove(P.cpManager, yc.id, { approve: false, note: 'Thử quyền' }));
    const { sid } = emMoi('MB FT 101');
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case MB thử 403', summary: 'Case MB dùng cho phép kiểm 403 Dọn-a.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-403-${sid}` });
    ma.closeCaseOutcome = maLoi(() => cases.closeCaseOutcome(P.cpManager, c.id, { outcome: 'improved', note: 'Thử quyền đóng Case' }));
    ma.setDisposition = maLoi(() => cases.setDisposition(P.cpManager, c.id, { status: 'done', note: 'Thử quyền đóng Case' }));
    const v = mgmt.createMgmtTask(P.mbManager, { title: 'Việc thử 403 Dọn-a', group: 'teacher', branchId: MB });
    ma.mgmtTaskDetail = maLoi(() => mgmt.mgmtTaskDetail(P.w1Teacher, v.id));
    ma.updateMgmtTask = maLoi(() => mgmt.updateMgmtTask(P.w1Teacher, v.id, { progress: 'doing' }));
    const tk = get(`SELECT t.id, t.assignee_user_id FROM tasks t WHERE t.assignee_user_id IS NOT NULL AND t.kind != 'branch_ops'
                     AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = t.assignee_user_id AND ur.status = 'active' AND r.key != 'teacher') LIMIT 1`);
    if (tk) ma.updateTask = maLoi(() => meeting.updateTask(loadPrincipal(tk.assignee_user_id), tk.id, { followerIds: [] }));
    const sai = Object.entries(ma).filter(([, m]) => m !== 403);
    assert(sai.length === 0 && Object.keys(ma).length >= 7, `không phải 403: ${JSON.stringify(ma)}`);
  });

  check('Dọn-a (2g) · #19 detectedAt ngày mai → 400; resultDate ngày mai → 400', () => {
    const { sid } = emMoi('MB FT 101');
    const e = loiCua(() => cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case ngày tương lai', summary: 'Ngày phát hiện ở tương lai phải bị chặn.',
      primaryCode: d.issuesForTopic('listening')[0].code, detectedAt: t.addDays(TODAY, 1) }));
    assert(e?.status === 400 && /tương lai/.test(e.message), `detectedAt: ${e?.status} ${e?.message}`);
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? ORDER BY id LIMIT 1`, sid).id;
    const e2 = loiCua(() => svc.saveScore(P.admin, a, 'listening', { rawScore: 30, resultDate: t.addDays(TODAY, 1) }));
    assert(e2?.status === 400 && /tương lai/.test(e2.message), `resultDate: ${e2?.status} ${e2?.message}`);
  });

  check('Dọn-a (2h) · #20 createCycle route "XX" → 400; route có trong danh mục → được', () => {
    const { sid } = emMoi('MB FT 101');
    assert(maLoi(() => cyclesSvc.createCycle(P.mbManager, { studentId: sid, route: 'XX', targetScore: 6.5 })) === 400, 'route XX');
    const cy = cyclesSvc.createCycle(P.mbManager, { studentId: sid, route: 'RF', targetScore: 6.5, startedAt: TODAY });
    assert(cy.route === 'RF', 'khẳng định: RF');
  });
}
