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

  // ------------------------------------------------------------------ khối 3 · chia lô, trần mảng, trần chữ, chống gửi đôi, ROLLBACK
  console.log('\nPR-Dọn-a · (3) Quét an toàn — chia lô, trần mảng và chữ tự do, chống gửi đôi, ROLLBACK');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const toi = path.dirname(fileURLToPath(import.meta.url));
  const REPO = ['../../..', '../../../..'].map((x) => path.resolve(toi, x)).find((x) => fs.existsSync(path.join(x, 'package.json')))!;
  const docNguon = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const viPham: any = await import('../yThuc/violations.ts');
  const hieuQua: any = await import('../cases/effectiveness.ts');
  const { tx } = await import('../db.ts');
  const { chayTrongRequest, nho } = await import('../platform/nguCanhRequest.ts');

  check('Dọn-a (3a) · #14 xếp lịch hàng loạt: 1 200 id (600 em khác nhau) → 400 "Tối đa 500"; 600 id trùng thành 300 em → không báo trần; IN chia lô', () => {
    const mot = Array.from({ length: 600 }, (_, k) => k + 1);
    const x = { classId: classId('MB FT 101'), attemptNo: 2, tuan: { listening: week.ensurePeriod(tuanNay).id }, xemTruoc: true };
    const e = loiCua(() => keHoach.xepHangLoat(P.mbManager, { ...x, studentIds: [...mot, ...mot] }));
    assert(e?.status === 400 && /Tối đa 500/.test(e.message), `1 200 id: ${e?.status} ${e?.message}`);
    const e2 = loiCua(() => keHoach.xepHangLoat(P.mbManager, { ...x, studentIds: [...mot.slice(0, 300), ...mot.slice(0, 300)] }));
    assert(!e2 || !/Tối đa/.test(e2.message), `600 id trùng: ${e2?.message}`);
    assert(!/phOf\(i\.studentIds\.length\)/.test(docNguon('server/src/keHoach/keHoachTest.ts')), 'còn IN thô theo studentIds');
  });

  check('Dọn-a (3b) · #16 trần mảng: Thêm HV 201 dòng → 400; quyết định chuyển lớp 501 dòng → 400; nhập bù 51 dòng PA → 400', () => {
    const e = loiCua(() => intake.previewIntake(P.mbManager, { classId: classId('MB FOU 12'), rows: Array.from({ length: 201 }, (_, k) => ({ fullName: `Em ${k}` })) }));
    assert(e?.status === 400 && /Tối đa 200/.test(e.message), `201 dòng: ${e?.status} ${e?.message}`);
    const e2 = loiCua(() => lenh.raLenh(P.mbManager, { lopNguonId: classId('MB FOU 12'), boiCanh: 'cuoi-khoa', tuanChung: null,
      dongs: Array.from({ length: 501 }, (_, k) => ({ studentId: k + 1, huong: 'len_lop' })) }));
    assert(e2?.status === 400 && /Tối đa 500/.test(e2.message), `501 dòng: ${e2?.status} ${e2?.message}`);
    const { sid } = emMoi('MB FT 101');
    const pa = { ketQua: 'partial', description: 'Tutor ngoài kèm', performerName: 'Tutor ngoài Lan', fromDate: '2026-08-01', toDate: '2026-08-10' };
    const e3 = loiCua(() => cases.backfillCase(P.mbManager, { studentId: sid, topic: 'listening', primaryCode: d.issuesForTopic('listening')[0].code,
      title: 'Nhập bù quá nhiều dòng', summary: 'Case nhập bù có 51 dòng PA.', fromDate: '2026-08-01', toDate: '2026-08-10',
      actions: Array.from({ length: 51 }, () => pa), outcome: 'improved', note: 'Quá nhiều dòng PA.' }));
    assert(e3?.status === 400 && /Tối đa 50/.test(e3.message), `51 PA: ${e3?.status} ${e3?.message}`);
  });

  check('Dọn-a (3c) · #23 đăng ký: họ tên 101 ký tự → 400; phone: {} → 400 (không phải 500)', () => {
    const goc = { email: 'dona.thu.pisa@gmail.com', password: 'matkhau123', branches: ['MB'] };
    assert(maLoi(() => accounts.register({ ...goc, fullName: 'A'.repeat(101) })) === 400, 'tên 101');
    assert(maLoi(() => accounts.register({ ...goc, fullName: 'Người Thử', phone: {} })) === 400, 'phone {}');
    assert(maLoi(() => accounts.register({ ...goc, fullName: 'Người Thử', note: 'x'.repeat(501) })) === 400, 'ghi chú 501');
  });

  check('Dọn-a (3d) · #24 chữ tự do qua chuTuDo (quét chuỗi) + gọi thật: lý do từ chối 2 001 → 400; mô tả vi phạm 2 001 → 400; tên Case 201 → 400', () => {
    const phai: [string, RegExp][] = [
      ['server/src/worklist/mgmttasks.ts', /chuTuDo\(input\.title, 'Tên công việc', 200\)/],
      ['server/src/worklist/mgmttasks.ts', /chuTuDo\(input\.helpName, 'Cần ai hỗ trợ', 120\)/],
      ['server/src/worklist/mgmttasks.ts', /chuTuDo\(input\.reason, 'Lý do', 2000\)/],
      ['server/src/cases/cases.ts', /chuTuDo\(input\.title, 'Tên Case', 200\)/],
      ['server/src/cases/cases.ts', /chuTuDo\(input\.summary, 'Mô tả', 2000\)/],
      ['server/src/cases/cases.ts', /const closeNote = chuTuDo\(input\.note, 'Kết luận', 2000\)/],
      ['server/src/yThuc/violations.ts', /chuTuDo\(description, 'Mô tả vi phạm', 2000\)/],
      ['server/src/duyet/yeuCau.ts', /chuTuDo\(v\.ghiChu, 'Ghi chú', 2000\)/],
      ['server/src/duyet/yeuCau.ts', /chuTuDo\(lyDo, 'Lý do', 2000\)/],
      ['server/src/duyet/yeuCau.ts', /chuTuDo\(traLoi, 'Câu trả lời', 2000\)/],
      ['server/src/classes/lenhChuyen.ts', /chuTuDo\(d\?\.lyDo, 'Lý do', 2000\)/],
      ['server/src/routes/index.ts', /chuTuDo\(req\.body\.lyDo, 'Lý do chuyển lớp', 2000\)/],
      ['server/src/fasttrack/attempts.ts', /chuTuDo\(patch\.note, 'Ghi chú', 2000\)/],
      ['server/src/platform/accounts.ts', /chuTuDo\(input\.phone, 'Điện thoại', 20\)/],
    ];
    const thieu = phai.filter(([f, re]) => !re.test(docNguon(f))).map(([f, re]) => `${f} ${re}`);
    assert(!thieu.length, `chưa qua chuTuDo:\n${thieu.join('\n')}`);
    const id = theDeXuatMb();
    const e = loiCua(() => yc.tuChoiYeuCau(P.mbManager, id, 'x'.repeat(2001)));
    assert(e?.status === 400 && /Tối đa 2000/.test(e.message), `lý do từ chối: ${e?.status} ${e?.message}`);
    const { sid } = emMoi('MB FT 101');
    const e2 = loiCua(() => viPham.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', description: 'x'.repeat(2001), occurredOn: TODAY }));
    assert(e2?.status === 400 && /Tối đa 2000/.test(e2.message), `mô tả vi phạm: ${e2?.status} ${e2?.message}`);
    const e3 = loiCua(() => cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'T'.repeat(201), summary: 'Tên Case quá dài phải bị chặn.',
      primaryCode: d.issuesForTopic('listening')[0].code }));
    assert(e3?.status === 400 && /Tối đa 200/.test(e3.message), `tên Case: ${e3?.status} ${e3?.message}`);
  });

  check('Dọn-a (3e) · #26 bấm đúp (cùng người, cùng khoá gửi — PR-GVa thay chặn 10 giây) → MỘT PA, MỘT lần xem lại, MỘT việc Vận hành, MỘT việc /tasks', () => {
    const { sid } = emMoi('MB FT 101');
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case thử bấm đúp', summary: 'Case dùng cho phép kiểm bấm đúp.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-dup-${sid}` });
    const pa = { kind: 'tutor', description: 'Kèm 1-1 hai buổi một tuần', status: 'started', startedDate: TODAY, performerSelf: true };
    cases.recordIntervention(P.lrTeacher, c.id, { ...pa, idempotencyKey: `dona-pa-${sid}` });
    cases.recordIntervention(P.lrTeacher, c.id, { ...pa, idempotencyKey: `dona-pa-${sid}` });
    const nPa = get('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', c.id).n;
    const fu = { outcome: null, note: 'Em tiến bộ ở dạng điền từ.', idempotencyKey: `dona-fu-${sid}` };
    cases.recordFollowUp(P.lrTeacher, c.id, fu);
    cases.recordFollowUp(P.lrTeacher, c.id, fu);
    const nFu = get(`SELECT COUNT(*) n FROM case_followups WHERE case_id = ? AND note = ?`, c.id, fu.note).n;
    const viec = { title: `Việc bấm đúp Dọn-a ${sid}`, group: 'teacher', branchId: MB, idempotencyKey: `dona-viec-${sid}` };
    const v1 = mgmt.createMgmtTask(P.mbManager, viec);
    const v2 = mgmt.createMgmtTask(P.mbManager, viec);
    const t1 = meeting.createTask(P.mbManager, { title: `Việc /tasks bấm đúp ${sid}`, kind: 'branch_ops', branchId: MB, idempotencyKey: `dona-task-${sid}` });
    const t2 = meeting.createTask(P.mbManager, { title: `Việc /tasks bấm đúp ${sid}`, kind: 'branch_ops', branchId: MB, idempotencyKey: `dona-task-${sid}` });
    assert(nPa === 1 && nFu === 1 && v1.id === v2.id && t1.id === t2.id, JSON.stringify({ nPa, nFu, v: [v1.id, v2.id], t: [t1.id, t2.id] }));
    /* Lần mở form mới (không khoá / khoá khác) → bản ghi mới (không chặn nhầm). */
    cases.recordIntervention(P.lrTeacher, c.id, { ...pa, description: 'Kèm 1-1 ba buổi một tuần' });
    assert(get('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', c.id).n === 2, 'PA khác nội dung bị chặn nhầm');
  });

  check('Dọn-a (3f) · #27 ROLLBACK / ROLLBACK TO xoá bộ nhớ request: giá trị nhớ trong giao dịch đã cuộn lại được đọc lại từ DB (Q7)', () => {
    chayTrongRequest('GET', () => {
      let n = 0;
      try { tx(() => { nho('dona-k', () => ++n); throw new Error('cuộn lại'); }); } catch { /* cố ý */ }
      assert(nho('dona-k', () => ++n) === 2, 'ROLLBACK: vẫn đọc giá trị nhớ cũ');
      let m = 0;
      tx(() => {
        try { tx(() => { nho('dona-k2', () => ++m); throw new Error('cuộn savepoint'); }); } catch { /* cố ý */ }
        assert(nho('dona-k2', () => ++m) === 2, 'ROLLBACK TO: vẫn đọc giá trị nhớ cũ');
      });
    });
  });

  check('Dọn-a (3g) · #17 bảng vấn đề theo kỹ năng nhận 1 200 em không lỗi; câu IN theo em chia lô', () => {
    const ids = all('SELECT id FROM students ORDER BY id LIMIT 1200').map((r) => r.id);
    while (ids.length < 1200) ids.push(900000 + ids.length);
    const b = hieuQua.issueBoard({ studentIds: ids }, 'listening');
    assert(b && Array.isArray(b.rows), 'issueBoard 1 200 em');
    assert(!/\.all\(\.\.\.sids\) as any\[\];\s*const mine/.test(docNguon('server/src/cases/effectiveness.ts')), 'còn IN thô theo sids');
  });

  // ------------------------------------------------------------------ khối 4 · lộ trình và ngày (VN10, VN15, VN20, VN21, VN25, Q11)
  console.log('\nPR-Dọn-a · (4) Lộ trình và ngày');
  const hanhTrinh: any = await import('../students/hanhTrinh.ts');
  const profileSvc: any = await import('../students/profile.ts');
  const luatLt: any = await import('../classes/luatLoTrinh.ts');
  const transitionSvc: any = await import('../classes/transition.ts');

  check('Dọn-a (4a) · VN10 đề nghị dời của MT lịch sử → decideAbsenceMove 400, cùng câu với đường xin dời', () => {
    const { sid } = emMoi('MB FT 101');
    const a = get(`SELECT id, planned_period_id FROM assessment_attempts WHERE student_id = ? ORDER BY id LIMIT 1`, sid);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a.id);
    const id = Number(conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, reason, requested_by, requested_on, decide_by, status, created_at)
      VALUES (?, 'listening', 1, ?, ?, 'Ốm', ?, ?, ?, 'pending', ?)`).run(a.id, a.planned_period_id, week.ensurePeriod(t.addDays(tuanNay, 7)).id, P.coreTeacher.userId, TODAY, t.addDays(TODAY, 6), new Date().toISOString()).lastInsertRowid);
    const e = loiCua(() => absence.decideAbsenceMove(P.mbManager, id, { approve: true }));
    assert(e?.status === 400 && /MT cũ không vào luồng vắng/.test(e.message), `MT cũ (PR-MTa): ${e?.status} ${e?.message}`);
  });

  check('Dọn-a (4b) · VN15 dự kiến thi ngày 07/12/2026 → tháng 01/2027: exam_period_id NULL, examPlanOf là tháng; chọn tuần khác cho tháng thì giữ (Q16)', () => {
    const { cy } = emMoi('MB FT 101');
    cyclesSvc.updateCycle(P.mbManager, cy, { examDate: '2026-12-07' });
    const truoc = get('SELECT exam_period_id FROM learning_cycles WHERE id = ?', cy);
    assert(truoc.exam_period_id, 'ngày thi phải có tuần');
    /* Panel Kế hoạch gửi lại tuần cũ trong state — vẫn phải bỏ. */
    cyclesSvc.updateCycle(P.mbManager, cy, { examDate: '2027-01', examPeriodId: truoc.exam_period_id });
    const sau = get('SELECT * FROM learning_cycles WHERE id = ?', cy);
    assert(sau.exam_period_id === null && sau.exam_month === '2027-01' && sau.exam_date === null, JSON.stringify({ p: sau.exam_period_id, m: sau.exam_month, d: sau.exam_date }));
    assert(cyclesSvc.examPlanOf(sau).confidence === 'month', `examPlanOf: ${JSON.stringify(cyclesSvc.examPlanOf(sau))}`);
    const tuanThang = week.ensurePeriod('2027-01-11').id;
    cyclesSvc.updateCycle(P.mbManager, cy, { examDate: '2027-01', examPeriodId: tuanThang });
    assert(get('SELECT exam_period_id FROM learning_cycles WHERE id = ?', cy).exam_period_id === tuanThang, 'khẳng định: tháng + tuần chọn thì giữ tuần');
  });

  check('Dọn-a (4c) · VN20 docONgay("01/01/0208", ngày, tối thiểu 1900) → câu cận năm "Không được trước …", không phải "Ngày không có thật"', () => {
    const r = d.docONgay('01/01/0208', 'ngay', TODAY, { toiThieu: '1900-01-01' });
    assert(r.iso === null && /Không được trước/.test(r.loi ?? ''), JSON.stringify(r));
    assert(d.docONgay('31/02/2026', 'ngay', TODAY).loi === 'Ngày không có thật', 'khẳng định: ngày không có thật vẫn báo đúng');
  });

  check('Dọn-a (4d) · VN21 lớp thường khai giảng 05/09/2022: Thêm HV với tuần khai giảng → không lỗi dòng 0; tuần khác ngoài cận năm → vẫn lỗi (Q17)', () => {
    const lop = classId('MB FOU 12');
    const cu = get('SELECT start_date FROM classes WHERE id = ?', lop).start_date;
    conn.prepare(`UPDATE classes SET start_date = '2022-09-05' WHERE id = ?`).run(lop);
    try {
      const xem = (w: string) => intake.previewIntake(P.mbManager, { classId: lop, rows: [{ fullName: 'Em Dọn-a VN21' }], defaultStartWeek: w })
        .issues.filter((x: any) => x.row === 0 && x.field === 'startWeek');
      assert(xem('2022-09-05').length === 0, `tuần khai giảng bị chặn: ${JSON.stringify(xem('2022-09-05'))}`);
      assert(xem('2022-09-12').length === 1, 'tuần khác ngoài cận năm phải bị chặn');
    } finally { conn.prepare('UPDATE classes SET start_date = ? WHERE id = ?').run(cu, lop); }
  });

  check('Dọn-a (4e) · VN25 updateCycle đổi target: thiếu lyDo → 400; có lyDo → một dòng cycle_target_revisions + Hành trình target_change; GVCN → 403 (Q15)', () => {
    const { sid, cy } = emMoi('MB FT 101');
    const e = loiCua(() => cyclesSvc.updateCycle(P.mbManager, cy, { targetScore: 7 }));
    assert(e?.status === 400 && /lý do/i.test(e.message), `thiếu lý do: ${e?.status} ${e?.message}`);
    assert(maLoi(() => cyclesSvc.updateCycle(P.coreTeacher, cy, { targetScore: 7, lyDo: 'Thử' })) === 403, 'GVCN');
    cyclesSvc.updateCycle(P.mbManager, cy, { targetScore: 7, lyDo: 'Em tiến bộ nhanh', note: 'ghi chú' });
    const rev = all('SELECT * FROM cycle_target_revisions WHERE cycle_id = ?', cy);
    const ht = all(`SELECT * FROM journey_events WHERE student_id = ? AND event_type = 'target_change'`, sid);
    const c = get('SELECT target_score, note FROM learning_cycles WHERE id = ?', cy);
    assert(rev.length === 1 && rev[0].reason === 'Em tiến bộ nhanh' && ht.length === 1 && c.target_score === 7 && c.note === 'ghi chú', JSON.stringify({ rev: rev.length, ht: ht.length, c }));
  });

  check('Dọn-a (4f) · Q11 em FT vào lớp từ 03/08 (LT1), QL mở RF không chuyển lớp → Hành trình, đầu hồ sơ, xemChuyenLop, transitionPlan cùng tuanHoc', () => {
    const lop = classId('MB FT 101');
    const { sid, cy } = emMoi('MB FT 101');
    conn.prepare(`UPDATE learning_cycles SET started_at = '2026-08-03', start_period_id = ? WHERE id = ?`).run(week.ensurePeriod('2026-08-03').id, cy);
    conn.prepare(`UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?`).run(sid);
    cyclesSvc.createCycle(P.mbManager, { studentId: sid, route: 'RF', targetScore: 6.5, startedAt: TODAY });
    const ht = hanhTrinh.hanhTrinhHocVien(P.mbManager, sid, null).chuong.find((c: any) => c.classId === lop && c.dangHoc)?.tuanHoc?.tu;
    const dau = profileSvc.studentProfile(P.mbManager, sid).dauHoSo.thongTin.tuanHoc?.tuan;
    const xem = luatLt.xemChuyenLop(P.mbManager, sid).hienTai.tuanHoc?.tuan;
    const ca = transitionSvc.transitionPlan(P.mbManager, lop).students.find((s: any) => s.id === sid)?.tuanHoc?.tuan;
    assert(dau != null && ht === dau && xem === dau && ca === dau, JSON.stringify({ hanhTrinh: ht, dauHoSo: dau, xemChuyenLop: xem, transitionPlan: ca }));
  });

  // ------------------------------------------------------------------ khối 5 · một luật "em đang học" (Q8), việc nhập điểm theo luật Nợ điểm (Q9), VN18
  console.log('\nPR-Dọn-a · (5) Một luật "em đang học"; việc nhập điểm = Nợ điểm; chương trình đã ngưng');
  const mw: any = await import('../worklist/mywork.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const regular: any = await import('../normal/regular.ts');
  const { HV_DANG_HOC_SQL } = await import('../students/tamDung.ts');

  check('Dọn-a (5a, 5b) · không còn điều kiện "em đang học" viết tay ở server/src (cả hai thứ tự, cùng bí danh); HV_DANG_HOC_SQL giữ đúng chữ cũ (số không đổi — Q8)', () => {
    const cungBiDanh = [/\b(\w+)\.status\s*=\s*'active'\s+AND\s+\1\.archived_at IS NULL/, /\b(\w+)\.archived_at IS NULL\s+AND\s+\1\.status\s*=\s*'active'/];
    const goc = path.join(REPO, 'server/src');
    const con: string[] = [];
    const duyet = (thuMuc: string) => {
      for (const ten of fs.readdirSync(thuMuc)) {
        const p = path.join(thuMuc, ten);
        if (fs.statSync(p).isDirectory()) { if (ten !== 'tests') duyet(p); continue; }
        if (!ten.endsWith('.ts') || ten === 'tamDung.ts') continue;
        fs.readFileSync(p, 'utf8').split('\n').forEach((dong, i) => {
          if (cungBiDanh.some((re) => re.test(dong)) && !/cố ý:/.test(dong)) con.push(`${path.relative(goc, p)}:${i + 1}`);
        });
      }
    };
    duyet(goc);
    assert(!con.length, `còn ${con.length} chỗ viết tay:\n${con.join('\n')}`);
    assert(HV_DANG_HOC_SQL('s') === `s.status = 'active' AND s.archived_at IS NULL`,
      `HV_DANG_HOC_SQL đổi chữ: ${HV_DANG_HOC_SQL('s')}`);
  });

  /* Vế "(lớp, đợt) hai đường bằng nhau trên mọi lớp" đã khoá ở S6F-a (3e) (sửa kỳ vọng ở Task 5). */
  check('Dọn-a (5c) · Q9 lớp đã kết thúc còn ô trống của GV L: /my-work nhóm score KHÔNG có lớp đó, Nợ điểm cũng không', () => {
    const gv = P.lrTeacher;
    const viecScore = () => (mw.myWork(gv).groups as any[]).flatMap((x) => x.items).filter((it: any) => it.group === 'score' && it.mine);
    const lop = viecScore()[0]?.classId;
    assert(lop, 'dữ liệu demo: GV L cần ít nhất một việc nhập điểm');
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(lop);
    try {
      assert(!viecScore().some((it: any) => it.classId === lop), 'Công việc vẫn có việc nhập điểm của lớp đã kết thúc');
      assert(!(debt.scoreDebtCells(P.admin, TODAY, null) as any[]).some((x) => x.classId === lop), 'Nợ điểm vẫn có lớp đã kết thúc');
    } finally { conn.prepare(`UPDATE classes SET status = 'active' WHERE id = ?`).run(lop); }
  });

  await checkAsync('Dọn-a (5d) · VN18 chương trình BE đã ngưng: lớp BE vẫn chấm theo tỷ lệ (allProgrammes / programmeOfClass); /ref/programmes không còn BE', async () => {
    const lopBe = get(`SELECT id FROM classes WHERE programme_code = 'BE' AND status = 'active' LIMIT 1`)?.id;
    assert(lopBe, 'dữ liệu demo: cần một lớp BE');
    conn.prepare(`UPDATE programmes SET status = 'inactive' WHERE code = 'BE'`).run();
    try {
      assert(regular.allProgrammes().get('BE')?.scoringMode === 'ratio' && regular.programmeOfClass(lopBe)?.scoringMode === 'ratio', 'lớp BE mất chương trình');
      await voiMayChu(async (goi) => {
        const r = await goi(P.mbManager.userId, '/ref/programmes');
        assert(r.status === 200 && !r.json.some((x: any) => x.code === 'BE') && r.json.some((x: any) => x.code === 'FOU'), `/ref/programmes: ${r.json.map((x: any) => x.code)}`);
      });
    } finally { conn.prepare(`UPDATE programmes SET status = 'active' WHERE code = 'BE'`).run(); }
  });

  // ------------------------------------------------------------------ khối 6 · việc và người làm: mỗi cặp một nguồn
  console.log('\nPR-Dọn-a · (6) Việc và người làm — mỗi cặp một nguồn');
  const metrics: any = await import('../worklist/metrics.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const thongBao: any = await import('../platform/thongBao.ts');
  const itemsCua = (p: any, f: any = {}) => (mw.myWork(p, f).groups as any[]).flatMap((x) => x.items);

  check('Dọn-a (6a) · Q10 "Thêm PA": người làm = người phụ trách Case (A) ở Công việc của A (mine), của B (không mine) và ở hồ sơ em — cùng khoá support:{caseId}', () => {
    const { sid } = emMoi('MB FT 101');
    const A = P.lrTeacher;
    /* B: một GV khác cũng dạy lớp này (GV L có thể kiêm GVCN). */
    const B = loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND user_id != ? LIMIT 1`, classId('MB FT 101'), A.userId).user_id);
    const c = cases.reportIssue(B, { studentId: sid, topic: 'listening', title: 'Case chưa có PA Dọn-a', summary: 'Case chưa có PA dùng cho phép kiểm Q10.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-q10-${sid}` });
    conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ?').run(A.userId, c.id);
    const k = `support:${c.id}`;
    const cuaA = itemsCua(A).find((i: any) => i.key === k);
    assert(cuaA && cuaA.mine === true && cuaA.ownerId === A.userId, `A: ${JSON.stringify(cuaA && { mine: cuaA.mine, ownerId: cuaA.ownerId })}`);
    const cuaB = itemsCua(B).find((i: any) => i.key === k);
    assert(!cuaB || (cuaB.mine === false && cuaB.ownerId === A.userId), `B: ${JSON.stringify(cuaB && { mine: cuaB.mine, ownerId: cuaB.ownerId })}`);
    const v = profileSvc.studentProfile(A, sid).dauHoSo.viec;
    const hs = [...(v.cuaBan ?? []), ...(v.nguoiKhac ?? [])].find((x: any) => x.key === k);
    assert(hs && (hs.nguoi?.id ?? hs.nguoiId) === A.userId, `hồ sơ: ${JSON.stringify(hs)}`);
  });

  check('Dọn-a (6b) · kỳ vọng đầu ra: em có HAI ghi danh đang học → đúng MỘT dòng ky_vong:{id}; số dòng = chỉ số; lớp trên dòng = lớp nguồn của lệnh', () => {
    /* Dựng tay: em lớp BE (có bài Cuối khoá tự tạo) có lệnh lên Fast Track đang chờ. */
    const lopBe = 'MB BE 04';
    const { sid, cy } = emMoi(lopBe);
    if (!get(`SELECT 1 FROM assessment_attempts WHERE student_id = ? AND kind = 'final'`, sid)) {
      conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?, ?, 99, 'final', ?, 'planned', ?)`)
        .run(cy, sid, classId(lopBe), new Date().toISOString());
    }
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, ?, 'fast_track', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(sid, classId(lopBe), classId('MB FT 101'), t.addDays(tuanNay, 7), P.mbManager.userId, TODAY, new Date().toISOString());
    const ds = metrics.hvLenFtChuaKyVong({ all: true, branchIds: [], classIds: [], none: false }, null) as any[];
    const em = ds.find((r) => r.id === sid);
    assert(em && em.lopNguonId === classId(lopBe), `hvLenFtChuaKyVong: ${JSON.stringify(em)}`);
    const lopKhac = get(`SELECT id FROM classes WHERE status = 'active' AND id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) LIMIT 1`, em.lopNguonId, em.lopNguonId).id;
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(em.id, lopKhac, TODAY, new Date().toISOString());
    const ql = loadPrincipal(get(`SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' AND ur.status = 'active'
      AND ur.branch_id = (SELECT branch_id FROM classes WHERE id = ?) LIMIT 1`, em.lopNguonId).user_id);
    const dong = itemsCua(ql).filter((i: any) => i.group === 'ky_vong_dau_ra');
    const cuaEm = dong.filter((i: any) => i.key === `ky_vong:${em.id}`);
    assert(cuaEm.length === 1 && cuaEm[0].classId === em.lopNguonId, `dòng của em: ${JSON.stringify(cuaEm.map((i: any) => i.classId))} · lớp nguồn ${em.lopNguonId}`);
    assert(dong.length === metrics.metricSet(ql, 'hv-len-ft-chua-ky-vong', {}).n, `số dòng ${dong.length} ≠ chỉ số`);
  });

  check('Dọn-a (6c) · pa-can-cap-nhat = Ghi kết quả PA: nhóm 3 PA bổ trợ chung quá hạn → 1; cùng người giữ việc; em Tạm dừng → không có ở cả hai', () => {
    const { sid } = emMoi('MB FOU 12');
    const c = cases.reportIssue(P.normalCoreTeacher, { studentId: sid, topic: 'reading', title: 'Case bổ trợ chung Dọn-a', summary: 'Case dùng cho phép kiểm PA bổ trợ chung.',
      primaryCode: d.issuesForTopic('reading')[0].code, idempotencyKey: `dona-6c-${sid}` });
    const han = t.addDays(tuanNay, -7);
    const ivIds = ['listening', 'reading', 'writing'].map((mon) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, action_due, cycle_no, nhom_bo_tro, created_at)
       VALUES (?, 'bo_tro', ?, NULL, ?, 'started', ?, ?, 1, ?, ?)`).run(c.id, `Bổ trợ chung ${mon}`, P.normalCoreTeacher.userId, t.addDays(han, -14), han, `dona-nhom-${sid}`, new Date().toISOString()).lastInsertRowid));
    const ql = P.mbManager;
    const chiSo = () => metrics.metricSet(ql, 'pa-can-cap-nhat', {});
    const viec = () => itemsCua(ql, { nguoi: 'tat-ca' }).filter((i: any) => i.group === 'ghi_ket_qua_pa' && i.caseId === c.id);
    const cs = chiSo();
    const cuaCs = cs.ids.filter((id: number) => ivIds.includes(id));
    const v = viec();
    assert(cuaCs.length === 1 && v.length === 1 && cuaCs[0] === Math.min(...ivIds) && v[0].key === `action:${cuaCs[0]}`, JSON.stringify({ chiSo: cuaCs, viec: v.map((i: any) => i.key) }));
    const nguoiCs = cs.chiTiet?.get(cuaCs[0])?.nguoi?.[0] ?? null;
    assert(nguoiCs === v[0].ownerId, `người giữ việc: chỉ số ${nguoiCs} · Công việc ${v[0].ownerId}`);
    studentsSvc.setStudentStatus(P.admin, sid, 'inactive', TODAY, 'Tạm dừng thử Dọn-a');
    assert(!chiSo().ids.some((id: number) => ivIds.includes(id)) && viec().length === 0, 'em Tạm dừng vẫn còn ở chỉ số / Công việc');
  });

  check('Dọn-a (6d) · Q13 lớp/môn có hai phân công, một hiệu lực từ tương lai → Nợ điểm, GV chấm (Lịch Test) và "người khác" (Công việc) ra cùng người', () => {
    const lop = classId('MB FT 101');
    const hienTai = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' ORDER BY id LIMIT 1`, lop).user_id;
    const sau = P.w2Teacher.userId === hienTai ? P.w1Teacher.userId : P.w2Teacher.userId;
    const idSau = Number(conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'listening', 0, 'active', ?, ?)`)
      .run(lop, sau, t.addDays(TODAY, 30), new Date().toISOString()).lastInsertRowid);
    try {
      const ten = get('SELECT full_name FROM users WHERE id = ?', hienTai).full_name;
      const no = (debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).filter((x) => x.classId === lop && x.skill === 'listening');
      const lich = (svc.listAttempts(P.mbManager, { classId: lop }).rows as any[]).filter((a) => a.pendingOwners && 'listening' in a.pendingOwners);
      const khac = itemsCua(P.mbManager, { nguoi: 'tat-ca' }).filter((i: any) => i.group === 'score' && i.classId === lop && /Listening|L\b/.test(`${i.tieuDe} ${i.reason}`));
      assert(no.length > 0 && no.every((x) => x.userId === hienTai), `Nợ điểm: ${[...new Set(no.map((x) => x.userId))]}`);
      assert(lich.length > 0 && lich.every((a) => a.pendingOwners.listening === ten), `Lịch Test: ${[...new Set(lich.map((a) => a.pendingOwners.listening))]}`);
      assert(khac.every((i: any) => i.ownerId === hienTai), `Công việc: ${[...new Set(khac.map((i: any) => i.ownerId))]}`);
    } finally { conn.prepare('DELETE FROM teacher_assignments WHERE id = ?').run(idSau); }
  });

  check('Dọn-a (6e) · thông báo "bị từ chối" của thẻ Case A vẫn còn việc sau khi cùng người gửi thẻ cùng loại cho Case B của cùng em', () => {
    const { sid } = emMoi('MB FT 101');
    const moCase = (ten: string) => cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: ten, summary: 'Case dùng cho phép kiểm thông báo từ chối.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-6e-${ten}-${sid}` });
    const deXuat = (caseId: number, moTa: string) => {
      const r = cases.recordIntervention(P.lrTeacher, caseId, { kind: 'tutor', description: moTa, status: 'planned', needsApproval: true, performerSelf: true });
      return get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ?`, r.interventions[r.interventions.length - 1].id).id as number;
    };
    const a = moCase('Case A Dọn-a');
    const b = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case B Dọn-a', summary: 'Case dùng cho phép kiểm thông báo từ chối.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `dona-6e-B-${sid}`, parallel: true });
    const theA = deXuat(a.id, 'Tutor 1-1 cho Case A');
    yc.tuChoiYeuCau(P.mbManager, theA, 'Chưa đủ căn cứ cho PA này');
    deXuat(b.id, 'Tutor 1-1 cho Case B');
    const tb = (thongBao.thongBaoCua(P.lrTeacher.userId) as any[]).find((x) => x.kind === 'duyet_tu_choi' && x.entity_id === theA);
    assert(tb && tb.con_viec === 1, `thông báo từ chối Case A: ${JSON.stringify(tb && { con_viec: tb.con_viec })}`);
  });

  check('Dọn-a (6f) · khai bậc: em mới Tạm dừng → coTheKhai false ở hồ sơ và Công việc không có việc khai bậc của em', () => {
    const lop = 'MB FT 101';
    const { sid } = emMoi(lop);
    const gvcn = gvcnCua(lop);
    const truoc = xuLy.yThucHocVien(gvcn, sid).coTheKhai;
    studentsSvc.setStudentStatus(P.admin, sid, 'inactive', TODAY, 'Tạm dừng thử khai bậc');
    const sau = xuLy.yThucHocVien(gvcn, sid).coTheKhai;
    const coViec = itemsCua(gvcn).some((i: any) => i.group === 'khai_bac' && (i.studentId === sid || String(i.href).includes(`hv=${sid}`)));
    assert(truoc === true && sau === false && !coViec, JSON.stringify({ truoc, sau, coViec }));
    assert(/khaiDuoc\(em\)/.test(docNguon('server/src/worklist/mywork.ts')) && /coTheKhai: canManage && khaiDuoc\(em\)/.test(docNguon('server/src/yThuc/xuLy.ts')), 'hai đường không gọi chung khaiDuoc');
  });

  check('Dọn-a (6g) · 8 hạn Thứ Hai liên tiếp: chữ tuần ở Cần xử lý (tuanCuaHanGhiKetQua) = tuần ở tiêu đề form Ghi kết quả (nhanTuanGhiKetQua)', () => {
    for (let k = 0; k < 8; k++) {
      const han = t.addDays('2026-09-07', 7 * k);
      const a = d.tuanCuaHanGhiKetQua(han, han);
      const b = d.nhanTuanGhiKetQua(han, han).tieuDe.replace(/^Kết quả /, '');
      assert(a === b && d.tuanKetQuaCuaHan(han) === t.addDays(han, -7), `${han}: "${a}" ≠ "${b}"`);
    }
  });

  // ------------------------------------------------------------------ khối 7 · xoá đường API web không gọi và hàm chết (Q14)
  console.log('\nPR-Dọn-a · (7) Xoá đường API web không còn gọi và hàm không ai gọi');
  check('Dọn-a (7a) · 21 route đã xoá khỏi routes/index.ts (Tổng quan cũ, dời lịch cửa thứ hai, quét an toàn #1 #2 #4 #10 #13 #22, không ai gọi)', () => {
    const idx = docNguon('server/src/routes/index.ts');
    const routes = [
      "get('/overview'", "get('/summary'", "get('/branch-pulse'", "get('/move-requests'", "post('/move-requests/:id/decide'",
      "post('/attempts'", "post('/attempts/bulk-plan'", "get('/tasks/:id/history'", "put('/cases/:id/owner'", "get('/prefs'", "put('/prefs/:key'",
      "get('/classes/:id/suggested-weeks'", "get('/weekly-rollup'", "get('/weekly-rollup/ids'", "get('/attempts/no-plan'", "get('/classes/:id/score-sheet'",
      "get('/mgmt-tasks/mine'", "put('/cases/:id/issues'", "post('/interventions/:id/respond'", "post('/interventions/:id/complete'",
      "post('/attempts/:id/skills/:skill/sit'", "get('/ref/issue-taxonomy'",
    ];
    const con = routes.filter((r) => idx.includes(`api.${r}`));
    assert(!con.length, `còn route: ${con.join(', ')}`);
  });
  check('Dọn-a (7b) · tệp và hàm chết không còn trong server/src (trừ phép kiểm này), web/src, shared', () => {
    const tep = ['server/src/worklist/dashboard.ts', 'server/src/worklist/summary.ts', 'server/src/worklist/branchpulse.ts', 'server/src/platform/prefs.ts',
      'server/src/worklist/weekly.ts', 'server/src/fasttrack/planning.ts'];
    const conTep = tep.filter((f) => fs.existsSync(path.join(REPO, f)));
    const ten = ['branchSummary', 'summaryColumns', 'SUMMARY_PRESETS', 'branchPulse', 'peopleOf', 'openMoveRequests', 'moTaDoiLan2', 'bulkPlan', 'noPlanQueue',
      'taskHistory', 'setCaseOwner', 'allPrefs', 'setPref', 'getPref', 'weeklyRollup', 'weeklyDrill', 'issueSkillRows', 'issueBoardCases', 'classAlerts',
      'demCanQuanLyTheoLop', 'WorkQueue', 'suggestMockWeeks', 'setIssues'];
    const re = new RegExp(`\\b(${ten.join('|')})\\b`);
    const con: string[] = [];
    const duyet = (thuMuc: string) => {
      for (const x of fs.readdirSync(thuMuc)) {
        const p = path.join(thuMuc, x);
        if (fs.statSync(p).isDirectory()) { if (x !== 'node_modules') duyet(p); continue; }
        if (!/\.(ts|tsx)$/.test(x) || x === 'prDonA.tests.ts') continue;
        /* Bỏ chú thích (nhắc tên cũ để giải thích lịch sử là được) — chỉ bắt MÃ còn gọi. */
        const ma = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        const m = ma.match(new RegExp(re.source, 'g'));
        if (m) con.push(`${path.relative(REPO, p)}: ${[...new Set(m)].join(', ')}`);
      }
    };
    for (const g of ['server/src', 'web/src', 'shared']) duyet(path.join(REPO, g));
    assert(!conTep.length && !con.length, `còn tệp: ${conTep.join(', ')}\ncòn tên:\n${con.slice(0, 40).join('\n')}`);
  });
  /* Ý còn đúng của các phép kiểm Tổng quan cũ đã xoá ("QL chỉ thấy chi nhánh mình") — chuyển sang bảng sống `/tong-quan/chi-nhanh`. */
  const bangCn: any = await import('../worklist/bangChiNhanh.ts');
  check('Dọn-a (7c) · bảng chi nhánh (đường sống thay /summary, /branch-pulse): QL MB chỉ có lớp MB; hỏi chi nhánh CP không ra lớp CP', () => {
    const lopCp = new Set(all('SELECT id FROM classes WHERE branch_id = ?', CP).map((r) => r.id));
    const mb = bangCn.bangChiNhanh(P.mbManager, { ct: 'ft' });
    assert(mb.hang.length > 0 && mb.hang.every((h: any) => h.loai === 'lop' && !lopCp.has(h.id)), 'QL MB thấy lớp CP');
    const e = loiCua(() => bangCn.bangChiNhanh(P.mbManager, { branchId: CP, ct: 'ft' }));
    const r = e ? null : bangCn.bangChiNhanh(P.mbManager, { branchId: CP, ct: 'ft' });
    assert(e?.status === 403 || (r && !r.hang.some((h: any) => lopCp.has(h.id) || (h.lop ?? []).some((l: any) => lopCp.has(l.id)))), `QL MB hỏi CP: ${e?.status ?? JSON.stringify(r?.hang?.map((h: any) => h.nhan))}`);
  });

  // ------------------------------------------------------------------ khối 8 · gọn mã không đổi hành vi (Dn1, Dn10, Dn11, Dn12, CaseRoutePage)
  console.log('\nPR-Dọn-a · (8) Gọn mã — hằng/bí danh thừa, đường newClass, builtin, TruongDeXuat một bản, Case luôn mở ở hồ sơ HV');
  check('Dọn-a (8a) · không còn ACADEMIC_SUPPORTS / OPS_POLICIES; bí danh canQl ở cuoiKhoa.ts; newClass ở transition.ts; builtin ở sysconfig.ts; TruongDeXuat một bản', () => {
    const sai: string[] = [];
    if (/ACADEMIC_SUPPORTS|OPS_POLICIES/.test(docNguon('shared/domain/cases.ts'))) sai.push('cases.ts: hằng thừa');
    if (/\bcanQl\b/.test(docNguon('shared/domain/cuoiKhoa.ts'))) sai.push('cuoiKhoa.ts: canQl');
    if (/newClass|toNewClass/.test(docNguon('server/src/classes/transition.ts')) || /toNewClass/.test(docNguon('shared/domain/lenLop.ts'))) sai.push('transition: newClass');
    if (/builtin/.test(docNguon('server/src/platform/sysconfig.ts'))) sai.push('sysconfig: builtin');
    if (/programmes\?:/.test(docNguon('server/src/classes/schedule.ts'))) sai.push('schedule: programmes?');
    if (/code\?: unknown|input\.route/.test(docNguon('server/src/classes/thongTinLop.ts'))) sai.push('thongTinLop: code/route kiểu cũ');
    if (/type TruongDeXuat =/.test(docNguon('server/src/duyet/deXuatSua.ts') + docNguon('web/src/modules/duyet/DeXuatSuaPanel.tsx'))) sai.push('TruongDeXuat còn hai bản');
    if (/export const HAN_XAC_NHAN_NGAY/.test(docNguon('shared/domain/sosV4.ts'))) sai.push('HAN_XAC_NHAN_NGAY còn export');
    assert(!sai.length, sai.join('; '));
  });
  check('Dọn-a (8b) · bộ demo: mọi Case đều có học viên (khoá cho bước bỏ đường dự phòng /hoc-thuat/case/)', () => {
    const n = get(`SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.id <= ? AND COALESCE(sc.student_id, a.student_id) IS NULL`, t.seedMax.sos_cases ?? 1e9).n;
    assert(n === 0, `${n} Case không có học viên`);
  });
  check('Dọn-a (8c) · máy chủ không sinh href /hoc-thuat/case/; duongCase luôn dẫn về hồ sơ HV; CaseRoutePage chỉ chuyển hướng', () => {
    assert(!/hoc-thuat\/case\//.test(docNguon('server/src/worklist/mywork.ts')), 'mywork.ts còn /hoc-thuat/case/');
    assert(d.duongCase(12, 34) === d.duongHoSoHocVien(12, { caseId: 34 }) && !/export const duongCase[^;]*hoc-thuat/.test(docNguon('shared/domain/duongHoSo.ts')), `duongCase: ${d.duongCase(12, 34)}`);
    const rt = docNguon('web/src/modules/cases/CaseBoardPage.tsx');
    assert(!/NganCase|<nav/.test(rt) && /<Navigate replace to=\{duongHoSoHocVien\(/.test(rt) && /hoc-thuat\/case\/:id/.test(docNguon('web/src/App.tsx')), 'CaseRoutePage');
  });

  // ------------------------------------------------------------------ khối 9 · tốc độ (phần đo số câu nằm ở tocDo.run.ts: 9a, 9c, 9d)
  console.log('\nPR-Dọn-a · (9) Tốc độ — tải trang đầu bắt route mới, VN31, khoá nhớ latestAttempts');
  const { TAI_TRANG } = await import('./tocDoDuong.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const { phamViXuatMt } = await import('../phanTich/xuatMt.ts');
  const danhGia: any = await import('../worklist/danhGia.ts');
  const { createHash } = await import('node:crypto');
  /**
   * Đường GET gọi KHÔNG phải lúc mở trang Tổng quan — mỗi đường một lý do. Đường mới xuất hiện trong cây Tổng quan mà không có ở
   * `TAI_TRANG` cũng không có ở đây → phép (9e) đỏ, buộc người sửa đo lại trần tải trang.
   */
  const GOI_KHI_BAM: Record<string, string> = {
    '/ref/periods': 'Filters.tsx — bộ lọc tuần, Tổng quan không vẽ', '/ref/current-period': 'Filters.tsx — như trên', '/ref/period-window': 'Filters.tsx — như trên',
    '/phan-tich/hieu-qua-pa': 'tab Phân tích — khi bấm tab', '/phan-tich/giao-vien': 'tab Phân tích', '/phan-tich/giao-vien/cham-diem': 'tab Phân tích',
    '/phan-tich/tong-hop': 'tab Phân tích', '/phan-tich/van-de-hv': 'tab Phân tích', '/phan-tich/y-thuc': 'tab Phân tích', '/xuat-mt/xem-truoc': 'tab Phân tích › Xuất',
    '/giao-vien': 'bảng Theo giáo viên — tab Phân tích', '/metrics/': 'SoLieu / SoLieuO — mở danh sách khi bấm ô (ô số lúc mở trang kiểm riêng ở dưới)',
    '/yeu-cau': 'Yêu cầu của tôi — chỉ khi đã có thẻ', '/students': 'ô tìm học viên ở thanh trên — khi gõ',
  };
  check('Dọn-a (9e) · tải trang đầu Tổng quan bắt được route mới: mọi GET trong cây OverviewPage (+ App, Header) có trong TAI_TRANG hoặc trong danh sách "gọi khi bấm"', () => {
    const tep = new Set<string>();
    const di = (f: string, deQuy: boolean) => {
      const p = path.resolve(f);
      if (tep.has(p) || !fs.existsSync(p)) return;
      tep.add(p);
      if (deQuy) for (const m of fs.readFileSync(p, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) di(path.resolve(path.dirname(p), m[1]), true);
    };
    di(path.join(REPO, 'web/src/modules/worklist/OverviewPage.tsx'), true);
    di(path.join(REPO, 'web/src/App.tsx'), false);
    di(path.join(REPO, 'web/src/modules/platform/Header.tsx'), false);
    const goc = (u: string) => u.split(/[?$]/)[0];
    const coTrang = new Set(Object.values(TAI_TRANG).flatMap((x) => x.urls.map(goc)));
    const thieu: string[] = [];
    for (const p of tep) {
      const ma = fs.readFileSync(p, 'utf8');
      for (const m of ma.matchAll(/(?:useApi|api\.get)\s*(?:<[^>]*(?:<[^>]*>[^>]*)*>)?\(\s*([^;]+?)(?:,\s*\[|\);|\)\s*;)/g)) {
        for (const l of m[1].matchAll(/['`](\/[^'`?$]*)/g)) {
          const g = l[1];
          if (!coTrang.has(g) && !(g in GOI_KHI_BAM)) thieu.push(`${path.relative(REPO, p)}: ${g}`);
        }
      }
    }
    /* Sáu ô số của Quản lý gọi `/metrics/{id}` lúc mở trang — id ghi trong MetricTiles.tsx. */
    const o = [...docNguon('web/src/modules/worklist/MetricTiles.tsx').matchAll(/<(?:O|SoPhu) id="([^"]+)"/g)].map((m) => `/metrics/${m[1]}`);
    for (const u of o) if (!TAI_TRANG['QL trang Tổng quan'].urls.some((x) => goc(x) === u)) thieu.push(`MetricTiles: ${u}`);
    assert(tep.size > 20 && o.length >= 4 && !thieu.length, `GET lúc mở trang chưa có trong TAI_TRANG:\n${[...new Set(thieu)].join('\n')}`);
  });

  check('Dọn-a (9f) · VN31 khoá lại: phamViXuatMt (nav "Xuất") không chạy câu SQL nào trong request', () => {
    nguCanh.chayTrongRequest('GET', () => {
      phamViXuatMt(P.coreTeacher);   // lượt đầu: ngày nghiệp vụ được nhớ trong request
      const truoc = nguCanh.soCauSql();
      for (const p of [P.coreTeacher, P.mbManager, P.admin]) phamViXuatMt(p);
      assert(nguCanh.soCauSql() === truoc, `phamViXuatMt chạy ${nguCanh.soCauSql() - truoc} câu`);
    });
  });

  check('Dọn-a (9g) · latestAttempts: khoá nhớ ≤ 80 ký tự với 2 000 id; kết quả như gọi ngoài request', () => {
    const ids = Array.from({ length: 2000 }, (_, k) => k + 1);
    const khoa = `luot-moi:valid:${TODAY}:${createHash('sha1').update(ids.join(',')).digest('hex')}`;
    nguCanh.chayTrongRequest('GET', () => {
      const trong = danhGia.latestAttempts(ids, 'valid', TODAY) as Map<number, any>;
      assert(nguCanh.coKhoa(khoa) && khoa.length <= 80, `khoá dài ${khoa.length} hoặc không đúng khoá băm`);
      const ngoai = danhGia.latestAttempts(ids, 'valid', TODAY);   // vẫn trong request: đọc từ bộ nhớ, cùng đối tượng
      assert(trong === ngoai && trong.size > 0, 'không đọc lại từ bộ nhớ');
    });
    assert(!/luot-moi:\$\{pick\}:\$\{today\}:\$\{studentIds\.join/.test(docNguon('server/src/worklist/danhGia.ts')), 'khoá còn ghép thô cả mảng id');
  });

  // ------------------------------------------------------------------ khối 10 · seed demo và badge "em chưa có quyết định chuyển lớp" (Câu 2 = B)
  console.log('\nPR-Dọn-a · (10) Seed hạn Thứ Hai, câu demo không hàm ý ca học; badge lớp = em chưa có quyết định chuyển lớp');
  const lenhSvc: any = await import('../classes/lenhChuyen.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  check('Dọn-a (10a) · bộ demo: mọi hạn ghi kết quả PA (action_due) là Thứ Hai', () => {
    const sai = all(`SELECT id, action_due FROM case_interventions WHERE action_due IS NOT NULL AND id <= ? AND strftime('%w', action_due) != '1'`,
      t.seedMax.case_interventions ?? 1e9);
    assert(!sai.length, `PA có hạn không phải Thứ Hai: ${sai.map((r) => `${r.id}:${r.action_due}`).join(', ')}`);
  });
  check('Dọn-a (10b) · câu demo không hàm ý ca học cố định (Q27): seed không còn "buổi sáng", "buổi chiều", "ca tối", "đổi ca"', () => {
    const con = fs.readdirSync(path.join(REPO, 'server/src/seed')).filter((f) => f.endsWith('.ts'))
      .filter((f) => /buổi sáng|buổi chiều|ca tối|đổi ca/.test(docNguon(`server/src/seed/${f}`)));
    assert(!con.length, `còn ở: ${con.join(', ')}`);
  });
  check('Dọn-a (10c) · Q28 khoá lại: không có lượt Giữa khoá (kind = progress) nào thuộc lớp Pre FOU', () => {
    const n = get(`SELECT COUNT(*) n FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE c.programme_code = 'PREFOU' AND a.kind = 'progress'`).n;
    assert(n === 0, `${n} lượt Giữa khoá ở lớp Pre FOU`);
  });
  check('Dọn-a (10d) · Câu 2 = B: badge "n HV chưa có quyết định chuyển lớp" của lớp = số em của dòng Cần xử lý (lopChoLenhChuyen) = số em có cờ ở bảng học viên; em có lệnh chờ → không cờ', () => {
    const lop = lenhSvc.lopChoLenhChuyen(P.mbManager, MB, TODAY) as any[];
    assert(lop.length > 0, 'dữ liệu demo: cần một lớp thường đã tới Cuối khoá còn em chưa có lệnh');
    const tom = classesSvc.listClassSummaries(P.mbManager, { branchId: MB }).rows as any[];
    for (const x of lop) {
      const r = tom.find((c) => c.id === x.classId);
      const roster = classesSvc.classRoster(P.mbManager, x.classId) as any[];
      const coCo = roster.filter((s) => s.chuaLoTrinh).map((s) => s.id).sort((a: number, b: number) => a - b);
      assert(r && r.soChuaLoTrinhTiep === x.emIds.length && JSON.stringify(coCo) === JSON.stringify([...x.emIds].sort((a: number, b: number) => a - b)),
        `${x.code}: badge ${r?.soChuaLoTrinhTiep} · Cần xử lý ${x.emIds.length} · cờ ${coCo.length}`);
    }
    const b = d.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, soChuaLoTrinhTiep: 3, missingSkills: [], soBaiChoCham: 0, needScoresTitle: null, phase: 'running', missingCount: 0 });
    const x = [...b.hien, ...b.an].find((y: any) => y.key === 'xep-lop');
    assert(x?.nhan === '3 HV chưa có quyết định chuyển lớp' && x.title === 'Quản lý quyết định ở ⋮ Chuyển tiếp lớp', JSON.stringify(x));
  });
}
