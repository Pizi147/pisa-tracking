/**
 * PHÉP KIỂM BPXL-1 (N57, chủ SP 20/11) — vai Chuyên viên Xếp lịch (`scheduler`): xếp / dời MT và lịch lớp thường; chỉ xem phần còn lại; không bị giao việc.
 *  BX-0 seed đúng 6 quyền, không quyền cấm · BX-1 migrate prBpxl: DB chưa có vai → vai + quyền, lần hai không đổi · BX-2 phạm vi (MB / toàn hệ thống)
 *  · BX-3 xếp / dời MT (chi nhánh mình được, chi nhánh khác 403) · BX-4 lịch lớp thường được, FT 403 · BX-5 khoá cuối tuần N15 như Admin (hỏi trước)
 *  · BX-6 từng đường sửa điểm / HV / chuyển lớp / Case / Ý thức / khôi phục lượt / Phân tích → 403 · BX-7 /my-work rỗng, điều hướng, Tổng quan MT.
 */
export async function runPrBpxlTests(t: any) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const { migratePrBpxl } = await import('../migrate/prBpxl.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { loadPrincipal, can, duocSuaLichLop } = await import('../permissions.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const { createApp } = await import('../app.ts');
  const sEx: any = await import('../cham/sExpert.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const { KHOA_MO_SUA_LICH_TEST } = await import('../platform/moSuaLichTest.ts');
  console.log('\nBPXL-1 · Chuyên viên Xếp lịch: xếp / dời MT + lịch lớp thường, chỉ xem phần còn lại, không bị giao việc');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loi = (fn: () => unknown): string | null => { try { fn(); return null; } catch (e: any) { return e?.message ?? String(e); } };
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  let seq = 0;
  const tao = (branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `bpxl.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-bpxl', fullName: `Thử BPXL ${seq}`, roles: [{ role: 'scheduler', branches }] }).userId as number;
  };
  const idMb = tao(['MB']);
  const idAll = tao([]);
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB');
  /* Lớp thường đang mở ở MB / ở chi nhánh khác MB (bộ demo CP không có lớp thường). */
  const lopThuong = (b: number, khac: boolean) => one(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
      WHERE ${khac ? 'c.branch_id != ?' : 'c.branch_id = ?'} AND c.status = 'active' AND pg.scoring_mode = 'ratio' ORDER BY c.id LIMIT 1`, b)?.id as number;
  const MB_FT = classId('MB FT 101'); const CP_FT = classId('CP FT 110');
  const MB_THUONG = lopThuong(MB, false); const KHAC_THUONG = lopThuong(MB, true);
  const emCua = (lop: number) => one(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' ORDER BY e.student_id LIMIT 1`, lop)?.id as number;
  const emMb = emCua(MB_FT); const emCp = emCua(CP_FT);
  const CAM = ['score.edit', 'score.override', 'student.edit_info', 'student.edit', 'student.edit_more', 'student.add', 'class.edit', 'class.create', 'class.assign', 'case.view',
    'sos.report', 'sos.edit', 'case.close', 'case.approve', 'analysis.view', 'analysis.view_teacher', 'attempt.cancel', 'violation.record', 'discipline.manage', 'discipline.stats',
    'cycle.edit', 'request.approve', 'admin.config', 'meeting.edit', 'tutor.view'];

  check('BX-0 · seed: BPXL đúng 6 quyền N57, không quyền sửa điểm / HV / lớp / Case / Ý thức / Phân tích / huỷ lượt', () => {
    assert(MB_THUONG && KHAC_THUONG && MB_FT && CP_FT && emMb && emCp, JSON.stringify({ MB_THUONG, KHAC_THUONG, MB_FT, CP_FT, emMb, emCp }));
    const q = [...ROLE_PERMISSIONS.scheduler].sort().join();
    assert(q === ['attempt.view', 'test.view', 'plan.week', 'schedule.move', 'student.view', 'work.view'].sort().join(), q);
    const db = all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'scheduler'`).map((x) => x.key).sort().join();
    assert(db === q, `DB: ${db}`);
    const thua = CAM.filter((k) => q.split(',').includes(k));
    assert(!thua.length, `bị nới ${thua.join(', ')}`);
  });

  check('BX-1 · migrate prBpxl: DB chưa có vai → vai + 6 quyền, vai khác không đổi; lần hai không đổi', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare(`DELETE FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE key = 'scheduler')`).run();
      conn.prepare(`DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE key = 'scheduler')`).run();
      conn.prepare(`DELETE FROM roles WHERE key = 'scheduler'`).run();
      const khac = () => all(`SELECT role_id, permission_id FROM role_permissions WHERE role_id NOT IN (SELECT id FROM roles WHERE key = 'scheduler') ORDER BY 1, 2`)
        .map((x) => `${x.role_id}:${x.permission_id}`).join();
      const truoc = khac();
      const lan1: string[] = [];
      migratePrBpxl(conn, lan1);
      const vai = one(`SELECT id, name_vi, status FROM roles WHERE key = 'scheduler'`);
      const q = all('SELECT p.key FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?', vai?.id).map((x) => x.key).sort().join();
      assert(vai?.name_vi === 'Chuyên viên Xếp lịch' && vai.status === 'active', JSON.stringify(vai));
      assert(q === [...ROLE_PERMISSIONS.scheduler].sort().join(), `quyền: ${q}`);
      assert(lan1.length === 1 && khac() === truoc, `lần 1: ${lan1.join(' | ')}`);
      const sau = all('SELECT 1 FROM role_permissions').length;
      const lan2: string[] = [];
      migratePrBpxl(conn, lan2);
      assert(!lan2.length && all('SELECT 1 FROM role_permissions').length === sau && all(`SELECT 1 FROM roles WHERE key = 'scheduler'`).length === 1, `lần 2 vẫn đổi: ${lan2.join(' | ')}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('BX-2 · phạm vi: BPXL MB xếp lịch / sửa lịch lớp thường MB, không CP; bỏ trống = toàn hệ thống; lớp FT không sửa lịch lớp; không quyền cấm', () => {
    const g = all(`SELECT ur.branch_id b FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.key = 'scheduler'`, idAll);
    assert(g.length === 1 && g[0].b === null, `toàn hệ thống: ${JSON.stringify(g)}`);
    const mb = loadPrincipal(idMb); const tat = loadPrincipal(idAll);
    const sai: string[] = [];
    if (!can(mb, PERMISSIONS.PLAN_WEEK, { classId: MB_FT }) || can(mb, PERMISSIONS.PLAN_WEEK, { classId: CP_FT })) sai.push('plan.week sai phạm vi');
    if (!can(tat, PERMISSIONS.PLAN_WEEK, { classId: CP_FT }) || !can(tat, PERMISSIONS.PLAN_WEEK, { classId: MB_FT })) sai.push('toàn hệ thống thiếu plan.week');
    if (!duocSuaLichLop(mb, MB_THUONG) || duocSuaLichLop(mb, KHAC_THUONG) || !duocSuaLichLop(tat, KHAC_THUONG)) sai.push('lịch lớp thường sai phạm vi');
    if (duocSuaLichLop(mb, MB_FT) || duocSuaLichLop(tat, CP_FT)) sai.push('sửa được lịch lớp FT');
    for (const k of CAM) if (can(tat, k, { classId: MB_FT, studentId: emMb })) sai.push(`có ${k}`);
    assert(!sai.length, sai.join(' | '));
  });

  /* Em mới lớp `lop` (lịch tự tạo bỏ); `luot(no, tuan)` tạo MT ở tuần đó bằng Quản trị. Giao dịch cuộn lại. */
  const thu = <T>(fn: (doiNgay: (n: string) => void) => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn((n) => { setConfig('demo_date', n); xoaNho(); }); }
    finally { conn.exec('ROLLBACK'); setConfig('demo_date', cu); xoaNho(); }
  };
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const em = (lop: number) => {
    const ten = `BPXL HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `bpxl-${seq}` });
    const sid = one('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = one("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    return { sid, cy, luot: (no: number, w: string) => svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: no, periodId: pid(w) }).id as number };
  };

  check('BX-3 · xếp / dời MT: BPXL MB tạo MT, dời một kỹ năng, đổi tuần lượt ở MB; lớp CP 403; toàn hệ thống xếp được CP', () => thu(() => {
    const mb = loadPrincipal(idMb); const tat = loadPrincipal(idAll);
    const a = em(MB_FT);
    const e1 = loi(() => svc.createAttempt(mb, { studentId: a.sid, cycleId: a.cy, attemptNo: 1, periodId: pid('2026-10-05') }));
    assert(e1 === null, `BPXL tạo MT: ${e1}`);
    const m1 = one('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 1', a.cy).id as number;
    const e2 = loi(() => ss.setSkillWeek(mb, m1, 'listening', pid('2026-10-12'), {}));
    assert(e2 === null, `BPXL dời kỹ năng: ${e2}`);
    const e3 = loi(() => svc.setPlanningWeek(mb, m1, pid('2026-10-19'), null, { force: true }));
    assert(e3 === null, `BPXL đổi tuần lượt: ${e3}`);
    const b = em(CP_FT); const n1 = b.luot(1, '2026-10-05');
    assert(ma(() => ss.setSkillWeek(mb, n1, 'listening', pid('2026-10-12'), {})) === 403, 'BPXL MB dời MT lớp CP phải 403');
    assert(ma(() => svc.createAttempt(mb, { studentId: b.sid, cycleId: b.cy, attemptNo: 2, periodId: pid('2026-10-26') })) === 403, 'BPXL MB tạo MT lớp CP phải 403');
    const e4 = loi(() => ss.setSkillWeek(tat, n1, 'reading', pid('2026-10-12'), {}));
    assert(e4 === null, `BPXL toàn hệ thống dời CP: ${e4}`);
    /* Huỷ / khôi phục lượt: không (`attempt.cancel`). */
    assert(ma(() => svc.huyLuot(mb, m1, {})) === 403, 'BPXL huỷ lượt phải 403');
  }));

  check('BX-5 · khoá cuối tuần N15 như Admin: T6 dời MT tuần này → hỏi "Vẫn đổi lịch"; tuần +3 → được', () => thu((doiNgay) => {
    const mb = loadPrincipal(idMb);
    const a = em(MB_FT); const m1 = a.luot(1, '2026-09-14');
    const b = em(MB_FT); const n1 = b.luot(1, '2026-10-12');
    doiNgay('2026-09-18');
    assert(loi(() => ss.setSkillWeek(mb, m1, 'listening', pid('2026-10-05'), {})) === 'Đang khoá đổi lịch MT cuối tuần (T6 – CN) — vẫn đổi lịch?', 'BPXL phải gặp câu hỏi khoá cuối tuần');
    const e = loi(() => ss.setSkillWeek(mb, n1, 'listening', pid('2026-10-05'), {}));
    assert(e === null, `tuần +3 → +4: ${e}`);
  }));

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };

  try {
    const ck = await vao(idMb);

    await checkAsync('BX-4 · lịch lớp qua HTTP: PATCH /classes/:id/progress lớp thường MB 200 (lưu y nguyên); lớp FT MB, lớp thường chi nhánh khác 403', async () => {
      let r = await goi('PATCH', `/classes/${MB_THUONG}/progress`, ck, {});
      assert(r.status === 200, `lớp thường MB: ${r.status} ${r.json?.error}`);
      r = await goi('PATCH', `/classes/${MB_FT}/progress`, ck, {});
      assert(r.status === 403, `lớp FT MB: ${r.status}`);
      r = await goi('PATCH', `/classes/${KHAC_THUONG}/progress`, ck, {});
      assert(r.status === 403, `lớp thường chi nhánh khác: ${r.status}`);
    });

    await checkAsync('BX-6 · chỉ xem: sửa điểm, sửa HV, thêm HV, chuyển lớp, báo Case, ghi vi phạm, khôi phục lượt, Phân tích → 403; xem em CP → 403 / 404', async () => {
      const luot = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY id LIMIT 1`, MB_FT)?.id;
      const luotThuong = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, MB_THUONG)?.id;
      const toi = one(`SELECT id FROM classes WHERE branch_id = ? AND status = 'active' AND id != ? AND is_fast_track = 1 ORDER BY id LIMIT 1`, MB, MB_FT)?.id;
      assert(luot && toi && luotThuong, JSON.stringify({ luot, toi, luotThuong }));
      const duong: [string, string, unknown?][] = [
        ['PUT', `/attempts/${luot}/scores/listening`, { rawScore: 20, rawTotal: 40 }],
        ['PUT', `/attempts/${luot}/scores/listening`, { noShow: true }],
        ['PUT', `/regular/attempts/${luotThuong}/scores/listening`, { score: 5, total: 10 }],
        ['PATCH', `/students/${emMb}`, { note: 'BPXL thử' }],
        ['POST', '/intake/commit', { classId: MB_FT, rows: [{ fullName: 'BPXL Ngoài', target: 7, email: emailThu(), dob: '2010-01-01' }] }],
        ['POST', `/students/${emMb}/transfer`, { toClassId: toi, lyDo: 'BPXL thử' }],
        ['POST', '/cases/report', { studentId: emMb, summary: 'BPXL thử báo Case' }],
        ['POST', '/violations', { studentId: emMb, category: 'khac', description: 'BPXL thử', occurredOn: '2026-09-14' }],
        ['GET', '/phan-tich/tong-hop'],
        ['GET', '/phan-tich/giao-vien'],
      ];
      const sai: string[] = [];
      for (const [m, u, b] of duong) {
        const r = await goi(m, u, ck, b);
        if (r.status !== 403) sai.push(`${m} ${u}: ${r.status} ${r.json?.error ?? ''}`);
      }
      const r = await goi('GET', `/students/${emCp}`, ck);
      if (r.status !== 403 && r.status !== 404) sai.push(`xem em CP: ${r.status}`);
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-7 · /my-work rỗng (không việc theo luật); nav Test · Học viên & Lớp · Công việc, trang đầu Kế hoạch Test; Tổng quan MT đọc được', async () => {
      const w = await goi('GET', '/my-work', ck);
      assert(w.status === 200 && !(w.json.dong ?? []).length && !(w.json.groups ?? []).length && w.json.summary.mine === 0, `my-work: ${w.status} ${JSON.stringify(w.json?.summary)}`);
      const s = await goi('GET', '/demo/session', ck);
      const n = s.json?.nav ?? {};
      assert(n.trangDauTest && !n.overview && n.test && n.testPlan && n.students && n.work && !n.analysis && !n.tutor && !n.admin && !n.workApprove && !n.workChamDiem,
        `nav: ${JSON.stringify(n)}`);
      const dh: any = await import('../../../shared/domain/dieuHuong.ts');
      const keys = dh.khuVucHienThi(n).map((k: any) => k.key).join();
      assert(keys === 'test,hoc-vien,cong-viec', keys);
      const tq = await goi('GET', `/tong-quan/mock-test?branchId=${MB}`, ck);
      assert(tq.status === 200 && typeof tq.json?.chuaXepLich === 'number' && tq.json.oChuaNhap.so === 0, `tong-quan/mock-test: ${tq.status} ${tq.json?.error}`);
      const kh = await goi('GET', '/ke-hoach-test/lop', ck);
      assert(kh.status === 200, `Kế hoạch Test: ${kh.status} ${kh.json?.error}`);
    });

    /* ---------------------------------------------------------------- PTA rà #1923 */
    const HOI = 'Đang khoá đổi lịch MT cuối tuần (T6 – CN) — vẫn đổi lịch?';
    const knCua = (k: string) => (k.startsWith('writing') ? 'writing' : k);
    const coDiem = one(`SELECT s.attempt_id a, s.skill k FROM assessment_scores s JOIN assessment_attempts t ON t.id = s.attempt_id
        WHERE t.class_id = ? AND t.kind = 'mock' AND t.status != 'cancelled' AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL) ORDER BY s.id LIMIT 1`, MB_FT);
    const luotMb = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY id LIMIT 1`, MB_FT)?.id as number;
    const luotThuongMb = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, MB_THUONG)?.id as number;
    const sai403 = async (ds: [string, string, unknown?][], ckX = ck) => {
      const sai: string[] = [];
      for (const [m, u, b] of ds) {
        const x = await goi(m, u, ckX, b);
        if (x.status !== 403) sai.push(`${m} ${u}: ${x.status} ${x.json?.error ?? ''}`);
      }
      return sai;
    };

    await checkAsync('BX-8 · (1) "-" / huỷ điểm hai chiều / vắng lớp thường qua HTTP → 403 (canRequest = qlDiem)', async () => {
      assert(coDiem && luotMb && luotThuongMb, JSON.stringify({ coDiem, luotMb, luotThuongMb }));
      const sai = await sai403([
        ['POST', `/attempts/${luotMb}/skills/listening/bao-vang`, { lyDo: 'BPXL thử' }],
        ['POST', `/attempts/${coDiem.a}/skills/${knCua(coDiem.k)}/huy-diem`, { huy: true, lyDo: 'BPXL thử' }],
        ['POST', `/attempts/${coDiem.a}/skills/${knCua(coDiem.k)}/huy-diem`, { huy: false }],
        ['PUT', `/regular/attempts/${luotThuongMb}/scores/listening`, { noShow: true, lyDo: 'BPXL thử' }],
      ]);
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-9 · (2)(4) S Ex: tạo lượt trống 200; tạo kèm điểm / nhận xét, chấm, chi nhánh khác 403; xoá / khôi phục lượt trống 200, lượt đã chấm 403', async () => {
      const tuan = '2026-09-14';   // tuần demo (thứ Hai — ngoài khoá N15); điểm chỉ nhận tới tuần này
      const sai = await sai403([
        ['POST', '/s-expert', { studentId: emMb, tuan, diem: 6.5 }],
        ['POST', '/s-expert', { studentId: emMb, tuan, nhanXet: 'BPXL thử' }],
        ['POST', '/s-expert', { studentId: emCp, tuan }],
      ]);
      let x = await goi('POST', '/s-expert', ck, { studentId: emMb, tuan });
      if (x.status !== 200 || !x.json?.id) sai.push(`tạo lượt trống: ${x.status} ${x.json?.error}`);
      const id = x.json?.id;
      if (id) {
        sai.push(...await sai403([['PUT', `/s-expert/${id}`, { diem: 6.5 }]]));
        x = await goi('DELETE', `/s-expert/${id}`, ck);
        if (x.status !== 200) sai.push(`xoá lượt trống: ${x.status} ${x.json?.error}`);
        x = await goi('POST', `/s-expert/${id}/khoi-phuc`, ck);
        if (x.status !== 200) sai.push(`khôi phục lượt trống: ${x.status} ${x.json?.error}`);
      }
      const chamRoi = sEx.themSEx(P.admin, { studentId: emMb, tuan, diem: 6.5 }).id as number;
      sai.push(...await sai403([['DELETE', `/s-expert/${chamRoi}`]]));
      sEx.xoaSEx(P.admin, chamRoi);
      sai.push(...await sai403([['POST', `/s-expert/${chamRoi}/khoi-phuc`]]));
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-10 · (3) khôi phục lượt / kết quả MT: 403 cả khi công tắc "Mở sửa lịch Test" TẮT lẫn BẬT', async () => {
      const a = em(MB_FT); const m = a.luot(1, '2026-10-19');
      svc.huyLuot(P.admin, m, {});
      const sai = await sai403([['POST', `/attempts/${m}/reopen`, {}], ['POST', `/attempts/${m}/khoi-phuc-ket-qua`, {}]]);
      const cu = getConfig(KHOA_MO_SUA_LICH_TEST);
      setConfig(KHOA_MO_SUA_LICH_TEST, JSON.stringify({ bat: true, nguoi: 'Thử', luc: '2026-09-14T00:00:00.000Z' })); xoaNho();
      try {
        sai.push(...(await sai403([['POST', `/attempts/${m}/reopen`, {}], ['POST', `/attempts/${m}/khoi-phuc-ket-qua`, {}]])).map((y) => `BẬT: ${y}`));
        if (ma(() => svc.reopenAttempt(loadPrincipal(idMb), m)) !== 403) sai.push('BẬT: reopenAttempt (dịch vụ) không 403');
      } finally { setConfig(KHOA_MO_SUA_LICH_TEST, cu ?? JSON.stringify({ bat: false })); xoaNho(); }
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-11 · đường ghi điểm / nhận xét / hạn / bỏ kỹ năng / HV / lớp / Ý thức / duyệt / chi nhánh khác → 403', async () => {
      const cy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, emMb)?.id;
      const xuLy = one(`SELECT m.id FROM discipline_measures m JOIN enrollments e ON e.student_id = m.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
          WHERE c.branch_id = ? ORDER BY m.id LIMIT 1`, MB)?.id;
      const yc = one(`SELECT id FROM yeu_cau_duyet WHERE trang_thai = 'cho' ORDER BY id LIMIT 1`)?.id;
      assert(cy && xuLy && yc, `thiếu dữ liệu: ${JSON.stringify({ cy, xuLy, yc })}`);
      const sai = await sai403([
        ['PUT', `/attempts/${luotMb}/scores/speaking/phu-trach`, { nhanXetPhuTrach: 'BPXL thử' }],
        ['PUT', `/attempts/${luotMb}/scores/writing1`, { nhanXet: 'BPXL thử nhận xét' }],
        ['PUT', '/cham/gv-cham-cot', { classId: MB_FT, dot: 'mt1', gv: P.admin.userId }],
        ['POST', `/attempts/${luotMb}/skills/listening/deadline`, { deadline: '2026-10-30', reason: 'BPXL thử' }],
        ['POST', `/attempts/${luotMb}/deadline`, { deadline: '2026-10-30', reason: 'BPXL thử' }],
        ['POST', `/attempts/${luotMb}/skills/speaking/skip`, { skipped: true, reason: 'BPXL thử' }],
        ['POST', `/students/${emMb}/status`, { status: 'inactive', reason: 'BPXL thử' }],
        ['POST', `/students/${emMb}/xoa`, {}],
        ['PATCH', `/cycles/${cy}`, { targetScore: 7 }],
        ['PATCH', `/classes/${MB_FT}/thong-tin`, {}],
        ['PUT', `/classes/${MB_FT}/teachers`, { slots: [] }],
        ['POST', '/classes', { branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '991' }],
        ['POST', `/y-thuc/xu-ly/${xuLy}/gui`, {}],
        ['POST', `/yeu-cau/${yc}/duyet`, {}],
        ['GET', `/ke-hoach-test/ft/${CP_FT}`],
      ]);
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-12 · (5) Case + Kết quả đầu ra: /cases rỗng, /cases/:id 403, /classes/:FT/ket-qua-dau-ra 403', async () => {
      const cs = one(`SELECT id FROM sos_cases WHERE goc_class_id = ? ORDER BY id LIMIT 1`, MB_FT)?.id;
      assert(cs, 'demo cần Case ở MB FT 101');
      const ds = await goi('GET', '/cases', ck);
      const sai: string[] = [];
      if (ds.status !== 200 || (ds.json?.rows ?? []).length) sai.push(`/cases: ${ds.status} ${(ds.json?.rows ?? []).length} dòng`);
      sai.push(...await sai403([['GET', `/cases/${cs}`], ['GET', `/classes/${MB_FT}/ket-qua-dau-ra`]]));
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-13 · (6) thi lại / xoá MT đã có điểm: 403 ngay (trước câu hỏi), không ghi gì', async () => {
      const dem = () => one('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL)', coDiem.a).n as number;
      const truoc = dem();
      const sai = await sai403([
        ['POST', '/ke-hoach-test/thi-lai', { attemptId: coDiem.a, skills: [knCua(coDiem.k)], periodId: pid('2026-10-26') }],
        ['POST', `/attempts/${coDiem.a}/xoa`, {}],
      ]);
      if (dem() !== truoc) sai.push(`điểm đổi ${truoc} → ${dem()}`);
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('BX-14 · vai ghép GV lớp A + BPXL: ghi điểm / "-" lớp B 403; /my-work giữ việc của vai GV; không trang đầu Kế hoạch Test', async () => {
      const id = accounts.createAccount(P.admin, { email: `bpxl.gv${accounts.EMAIL_SUFFIX}`, password: 'matkhau-bpxl', fullName: 'Thử BPXL GV',
        roles: [{ role: 'teacher', branches: ['MB'] }, { role: 'scheduler', branches: ['MB'] }] }).userId as number;
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,'2026-01-01','active',?)`)
        .run(id, MB_FT, 'listening', '2026-09-14T00:00:00.000Z');
      xoaNho();
      const lopB = one(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE c.branch_id = ? AND c.id != ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, MB, MB_FT)?.id;
      assert(lopB, 'thiếu lượt lớp B');
      const ckGv = await vao(id);
      const sai = await sai403([['PUT', `/attempts/${lopB}/scores/listening`, { rawScore: 20, rawTotal: 40 }], ['POST', `/attempts/${lopB}/skills/listening/bao-vang`, { lyDo: 'thử' }]], ckGv);
      const w = await goi('GET', '/my-work', ckGv);
      if (w.status !== 200 || !(w.json?.dong ?? []).length) sai.push(`/my-work GV + BPXL: ${w.status} ${(w.json?.dong ?? []).length} dòng`);
      const s = await goi('GET', '/demo/session', ckGv);
      if (s.json?.nav?.trangDauTest) sai.push('GV + BPXL vẫn trang đầu Kế hoạch Test');
      assert(!sai.length, sai.join(' | '));
    });

    check('BX-15 · N15 như Admin: T6 xếp mới MT, hàng loạt, thêm S Ex tuần này → câu hỏi "Vẫn đổi lịch"', () => thu((doiNgay) => {
      const mb = loadPrincipal(idMb);
      const a = em(MB_FT); a.luot(1, '2026-09-14');
      const b = em(MB_FT);
      doiNgay('2026-09-18');
      const tuan = Object.fromEntries(['listening', 'reading', 'writing', 'speaking'].map((k) => [k, pid('2026-09-21')]));
      assert(loi(() => kh.xepMoi(mb, { studentId: b.sid, attemptNo: 1, tuan, force: true })) === HOI, 'xếp mới');
      let kq: any = null;
      const e = loi(() => { kq = kh.xepHangLoat(mb, { classId: MB_FT, attemptNo: 2, studentIds: [a.sid], tuan, force: true }, '2026-09-18'); });
      assert(e === HOI || JSON.stringify(kq ?? {}).includes(HOI), `hàng loạt: ${e} ${JSON.stringify(kq)?.slice(0, 200)}`);
      assert(loi(() => sEx.themSEx(mb, { studentId: a.sid, tuan: '2026-09-14' })) === HOI, 'thêm S Ex');
    }));

    await checkAsync('BX-16 · đăng ký vai Chuyên viên Xếp lịch (không chi nhánh) → chờ duyệt, chưa có vai', async () => {
      const email = `bpxl.dk${accounts.EMAIL_SUFFIX}`;
      const x = await goi('POST', '/auth/register', '', { email, password: 'matkhau-bpxl-dk', fullName: 'Thử BPXL Đăng ký', role: 'scheduler', branches: [] });
      assert(x.status === 200 && x.json?.pending, `đăng ký: ${x.status} ${x.json?.error}`);
      const u = one('SELECT id, approval_state s, requested_role r FROM users WHERE email = ?', email);
      const g = one('SELECT COUNT(*) n FROM user_roles WHERE user_id = ?', u?.id).n;
      assert(u?.s === 'pending' && u.r === 'scheduler' && g === 0, JSON.stringify({ u, g }));
    });
  } finally {
    may.close();
    xoaNho();
  }
}
