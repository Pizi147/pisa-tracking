/** PHÉP KIỂM PR-SO — số liệu một nguồn & dọn mã máy chủ (kế hoạch 2026-10-04-pr-so-so-lieu-don-ma, SO-1 → SO-4). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSoTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const itemsCua = (p: any, f: any = {}) => (mw.myWork(p, f).groups as any[]).flatMap((x) => x.items);
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `PRSO HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `prso-${seq}` });
    return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };

  // ------------------------------------------------------------------ SO-1 · D2 một hàm chọn PA đại diện nhóm Bổ trợ
  console.log('\nPR-SO · (1) D2: PA đại diện nhóm Bổ trợ — Tổng quan và Công việc cùng một hàm');
  check('SO-1a · daiDienNhomBoTro: hạn sớm nhất (null cuối), hoà → id nhỏ; dòng không nhóm giữ nguyên, giữ thứ tự', () => {
    const r = (id: number, nhom: string | null, han: string | null, kind = 'bo_tro') => ({ id, kind, nhom_bo_tro: nhom, action_due: han });
    const ra = d.daiDienNhomBoTro([r(5, 'g1', '2026-09-20'), r(6, 'g1', '2026-09-10'), r(7, 'g1', null), r(8, null, '2026-09-01', 'tutor')]);
    assert(ra.map((x: any) => x.id).join() === '6,8', ra.map((x: any) => x.id).join());
    const hoa = d.daiDienNhomBoTro([r(9, 'g2', '2026-09-10'), r(3, 'g2', '2026-09-10'), r(4, 'g3', null), r(2, 'g3', null)]);
    assert(hoa.map((x: any) => x.id).join() === '3,2', hoa.map((x: any) => x.id).join());
  });

  check('SO-1b · nhóm Bổ trợ: PA id nhỏ hạn ngày mai, PA id lớn quá hạn 3 ngày → chỉ số QL có id lớn, Công việc QL có đúng dòng đó (quá hạn); số khớp', () => {
    const sid = emMoi('MB FOU 12');
    const moCase = (topic: string, parallel: boolean) => cases.reportIssue(P.normalCoreTeacher, { studentId: sid, topic, title: `Case bổ trợ SO-1b ${topic}`,
      summary: 'Case dùng cho phép kiểm PA đại diện nhóm.', primaryCode: d.issuesForTopic(topic)[0].code, idempotencyKey: `prso-1b-${topic}-${sid}`, parallel });
    const nhom = `prso-nhom-${sid}`;
    const pa = (caseId: number, han: string) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, action_due, cycle_no, nhom_bo_tro, created_at)
       VALUES (?, 'bo_tro', 'Bổ trợ chung SO-1b', NULL, ?, 'started', ?, ?, 1, ?, ?)`).run(caseId, P.normalCoreTeacher.userId, addDays(TODAY, -21), han, nhom, new Date().toISOString()).lastInsertRowid);
    const nho = pa(moCase('reading', false).id, addDays(TODAY, 1));
    const lon = pa(moCase('listening', true).id, addDays(TODAY, -3));
    assert(nho < lon, 'dựng dữ liệu: id nhỏ trước');
    const ql = P.mbManager;
    const cs = (metrics.metricSet(ql, 'pa-can-cap-nhat', {}).ids as number[]).filter((id) => id === nho || id === lon);
    const v = itemsCua(ql, { nguoi: 'tat-ca' }).filter((i: any) => i.group === 'ghi_ket_qua_pa' && (i.key === `action:${nho}` || i.key === `action:${lon}`));
    assert(cs.join() === String(lon), `chỉ số: ${cs.join()} (mong ${lon})`);
    assert(v.length === 1 && v[0].key === `action:${lon}` && v[0].urgency === 'overdue', `Công việc: ${JSON.stringify(v.map((i: any) => [i.key, i.urgency]))}`);
  });

  // ------------------------------------------------------------------ SO-2 · cấm cấp riêng plan.week cho người chỉ có vai GV; D5 cờ hồ sơ
  console.log('\nPR-SO · (2) Quyền: plan.week không cấp riêng cho người chỉ có vai GV; cờ hồ sơ khớp quyền route (D5)');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { tx } = await import('../db.ts');
  check('SO-2a · lyDoCamCapRieng: chỉ GV → lý do SCH-01; GV + Quản lý → null; không vai → null; quyền khác → null', () => {
    assert(/SCH-01/.test(d.lyDoCamCapRieng(['teacher'], 'plan.week') ?? ''), 'chỉ GV phải bị cấm');
    assert(d.lyDoCamCapRieng(['teacher', 'teacher'], 'plan.week'), 'hai dòng vai GV vẫn chỉ là GV');
    assert(d.lyDoCamCapRieng(['teacher', 'manager'], 'plan.week') === null, 'GV + QL');
    assert(d.lyDoCamCapRieng([], 'plan.week') === null, 'không vai');
    assert(d.lyDoCamCapRieng(['teacher'], 'student.view') === null, 'quyền khác');
  });

  check('SO-2b · Quản trị cấp riêng plan.week: tài khoản chỉ có vai GV → 400, user_permissions không đổi; tài khoản Quản lý → lưu được', () => {
    const gv = get(`SELECT u.id FROM users u WHERE u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key = 'teacher')
      AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key != 'teacher') LIMIT 1`).id;
    const quyenCua = (uid: number) => JSON.stringify(conn.prepare('SELECT permission_id, branch_id FROM user_permissions WHERE user_id = ? ORDER BY 1, 2').all(uid));
    const truoc = quyenCua(gv);
    let loi: any = null;
    try { accounts.setUserPermissions(P.admin, gv, [{ permission: 'plan.week', branchCode: 'MB' }], 'Thử SO-2b'); } catch (e) { loi = e; }
    assert(loi?.status === 400 && /SCH-01/.test(loi.message), `GV: ${loi?.status} ${loi?.message}`);
    assert(quyenCua(gv) === truoc, 'user_permissions của GV bị đổi');
    const ql = P.mbManager.userId;
    const truocQl = conn.prepare('SELECT * FROM user_permissions WHERE user_id = ?').all(ql) as any[];
    accounts.setUserPermissions(P.admin, ql, [{ permission: 'plan.week', branchCode: 'CP' }], 'Thử SO-2b');
    assert(get(`SELECT 1 x FROM user_permissions up JOIN permissions p ON p.id = up.permission_id WHERE up.user_id = ? AND p.key = 'plan.week'`, ql), 'QL không lưu được');
    conn.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(ql);
    for (const r of truocQl) conn.prepare('INSERT INTO user_permissions (user_id, permission_id, branch_id, note, granted_by, created_at) VALUES (?,?,?,?,?,?)')
      .run(r.user_id, r.permission_id, r.branch_id, r.note, r.granted_by, r.created_at);
  });

  check('SO-2c (D5) · cờ ⋮ hồ sơ (chuyenLop, tamDung, ketThuc, luuTru, ghiLoTrinhTiep) = hàm ghi không ném lỗi quyền — QT, QL, GVCN, GVBM × em đang học / đã kết thúc (đã bỏ lưu trữ)', () => {
    const { lopHocCua } = loTrinh;
    const lop = classId('MB FOU 12');
    const dangHoc = emMoi('MB FOU 12');
    const daXong = emMoi('MB FOU 12');
    studentsSvc.setStudentStatus(P.admin, daXong, 'finished', TODAY, 'Kết thúc thử SO-2c');
    /* Kết thúc học tự vào Lưu trữ → hồ sơ chỉ xem, mọi cờ tắt theo thiết kế (PR-XOA §2). Bỏ lưu trữ để soi cờ theo QUYỀN. */
    assert(Object.entries(loTrinh.lopHocCua(P.admin, daXong, null).quyen).every(([k, v]) => k === 'boLuuTru' || k === 'hocLai' || v === false), 'em trong Lưu trữ còn cờ ghi');
    studentsSvc.unarchiveStudent(P.admin, daXong);
    /* Gọi trong giao dịch rồi cuộn lại: chỉ cần biết hàm ghi có ném lỗi QUYỀN (403) không. */
    const CUON = new Error('cuộn lại');
    const thu = (fn: () => unknown): any => { try { tx(() => { fn(); throw CUON; }); } catch (e: any) { return e === CUON ? null : e; } return null; };
    const lech: string[] = [];
    for (const [ten, p] of [['QT', P.admin], ['QL', P.mbManager], ['GVCN', P.normalCoreTeacher], ['GVBM', P.normalSubjectTeacher]] as const) {
      for (const [loai, sid] of [['đang học', dangHoc], ['đã kết thúc', daXong]] as const) {
        const cur = loai === 'đang học' ? { class_id: lop } : null;
        const q = lopHocCua(p, sid, cur).quyen;
        const khongQuyen = (fn: () => unknown) => thu(fn)?.status === 403;
        const hanh: [string, boolean, boolean][] = [
          ['tamDung', q.tamDung, !khongQuyen(() => studentsSvc.setStudentStatus(p, sid, 'inactive', TODAY, 'thử'))],
          ['ketThuc', q.ketThuc, !khongQuyen(() => studentsSvc.setStudentStatus(p, sid, 'finished', TODAY, 'thử'))],
          ['luuTru', q.luuTru, thu(() => studentsSvc.archiveStudent(p, sid)) === null],
          ['hocLai', !!q.hocLai, thu(() => studentsSvc.hocLai(p, sid, { moLaiLop: true })) === null],   // PR-LUI-b
        ];
        if (cur) hanh.push(
          ['chuyenLop', q.chuyenLop, !khongQuyen(() => lenh.raLenh(p, { lopNguonId: lop, boiCanh: 'giua-khoa', tuanChung: null, dongs: [] }))],
          ['ghiLoTrinhTiep', q.ghiLoTrinhTiep, !khongQuyen(() => loTrinh.ghiLoTrinhTiep(p, sid, { huong: 'chua_ro' }))],
        );
        for (const [co, flag, duoc] of hanh) if (flag !== duoc) lech.push(`${ten}/${loai}/${co}: cờ ${flag} · hàm ${duoc}`);
      }
    }
    assert(lech.length === 0, lech.join('; '));
  });

  // ------------------------------------------------------------------ SO-3 · D4 xoá completeIntervention, tín hiệu, dọn khoá gửi
  console.log('\nPR-SO · (3) D4 xoá completeIntervention · tín hiệu em đã kết thúc · dọn khoá gửi cũ');
  const signals: any = await import('../cases/signals.ts');
  check('SO-3a (D4) · cases.ts không còn completeIntervention; khép PA quy chế trước mốc qua updateResult vẫn bị chặn, PA còn chạy', () => {
    assert(!('completeIntervention' in cases), 'completeIntervention còn export');
    const sid = emMoi('MB FT 101');
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case SO-3a', summary: 'Case dùng cho phép kiểm khép PA quy chế sớm.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `prso-3a-${sid}` });
    const iv = Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, action_due, followup_due, preset, confirmed_at, cycle_no, created_at)
       VALUES (?, 'tutor', 'PA quy chế SO-3a', ?, ?, 'started', ?, ?, ?, 1, ?, 1, ?)`).run(c.id, P.lrTeacher.userId, P.lrTeacher.userId, addDays(TODAY, -7), addDays(TODAY, 7),
      addDays(TODAY, 28), new Date().toISOString(), new Date().toISOString()).lastInsertRowid);
    let loi: any = null;
    try { cases.updateResult(P.admin, iv, { decision: 'end', outcome: 'improved', note: 'Em nghe tốt hơn hẳn sau hai tuần' }); } catch (e) { loi = e; }
    assert(loi?.status === 400 && /không kết thúc sớm/.test(loi.message), `updateResult end: ${loi?.status} ${loi?.message}`);
    assert(get('SELECT status FROM case_interventions WHERE id = ?', iv).status === 'started', 'PA bị khép');
  });

  check('SO-3b · em đã kết thúc học, tín hiệu đã thu hồi; raiseSignal lại cùng khoá (sửa điểm xuống dưới kỳ vọng) → vẫn withdrawn, case_id giữ', () => {
    const sid = emMoi('MB FT 101');
    const at = get('SELECT id, cycle_id, class_id FROM assessment_attempts WHERE student_id = ? ORDER BY id LIMIT 1', sid)
      ?? get(`SELECT id, cycle_id, class_id FROM assessment_attempts WHERE cycle_id = (SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id LIMIT 1) ORDER BY id LIMIT 1`, sid);
    assert(at, 'dựng dữ liệu: em cần một lượt thi');
    const goi = () => signals.raiseSignal({ actorUserId: null, studentId: sid, cycleId: at.cycle_id, attemptId: at.id, classId: at.class_id, skill: 'listening',
      category: 'listening', band: 4, expectation: 5.5, detectedOn: TODAY, silent: true });
    const sg = goi();
    const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: 'Case SO-3b', summary: 'Case dùng cho phép kiểm tín hiệu em đã kết thúc.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `prso-3b-${sid}` });
    studentsSvc.setStudentStatus(P.admin, sid, 'finished', TODAY, 'Kết thúc thử SO-3b');
    conn.prepare(`UPDATE case_signals SET status = 'withdrawn', case_id = ?, withdrawn_reason = 'Điểm đã sửa' WHERE id = ?`).run(c.id, sg.id);
    const sau = goi();
    assert(sau.id === sg.id && sau.status === 'withdrawn' && sau.case_id === c.id, JSON.stringify({ status: sau.status, case_id: sau.case_id }));
  });

  check('SO-3c · tạo lớp hàng loạt: khoá bulkclass:/intake: cũ > 7 ngày bị dọn; khoá mới 1 ngày và khoá cấu hình còn', () => {
    const iso = (ngay: number) => new Date(Date.now() - ngay * 864e5).toISOString();
    const ghi = (k: string, ngay: number) => conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?, ?, ?)').run(k, '{}', iso(ngay));
    ghi('bulkclass:1:x', 8); ghi('intake:1:2:y', 8); ghi('bulkclass:1:moi', 1);
    const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id;
    const cauHinh = (conn.prepare(`SELECT key FROM demo_config WHERE key NOT LIKE 'bulkclass:%' AND key NOT LIKE 'intake:%'`).all() as any[]).map((x) => x.key);
    assert(cauHinh.length > 0, 'dựng dữ liệu: cần khoá cấu hình');
    const r = intake.taoLopHangLoat(P.mbManager, { rows: [{ branchId: MB, chuongTrinh: 'FT', loTrinh: 'LT1', so: '9861' }], idempotencyKey: 'prso-3c' });
    assert(r.ok, JSON.stringify(r));
    const con = (k: string) => !!get('SELECT 1 x FROM demo_config WHERE key = ?', k);
    assert(!con('bulkclass:1:x') && !con('intake:1:2:y'), 'khoá cũ còn');
    assert(con('bulkclass:1:moi') && con(`bulkclass:${P.mbManager.userId}:prso-3c`), 'khoá mới mất');
    assert(cauHinh.every(con), 'khoá cấu hình mất');
  });

  // ------------------------------------------------------------------ SO-4 · DEP-gỡ: gỡ mã chuyển dữ liệu cũ (DB cũ đã xoá)
  console.log('\nPR-SO · (4) DEP-gỡ: không còn lệnh chạy thử DB cũ; DB init → migrate hai lần không đổi gì');
  const fs = await import('node:fs');
  const pathMod = await import('node:path');
  const os = await import('node:os');
  const cp = await import('node:child_process');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const { default: Database } = await import('libsql');
  const { SCHEMA_PATH } = await import('../db.ts');
  const { initBanChinh } = await import('../ops/initBanChinh.ts');
  check('SO-4b · DB dựng bằng initBanChinh → migrate (nhánh Turso) hai lần: applied rỗng cả hai lần, số dòng mọi bảng không đổi', () => {
    const thuMuc = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'prso-'));
    try {
      const f = pathMod.join(thuMuc, 'init.sqlite');
      const c0 = new Database(f);
      initBanChinh(c0, { adminEmail: 'prso.pisa@gmail.com', adminPassword: 'MatKhauPrSo2026', chiNhanh: [{ code: 'MB', name: 'Monbay' }],
        now: '2026-10-04T00:00:00Z', schemaSql: fs.readFileSync(SCHEMA_PATH, 'utf8') });
      c0.close();
      const lib = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/migrate.js')).href;
      const chay = (): string[] => {
        const r = cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(lib)}); console.log('@@' + JSON.stringify(m.migrate().applied));`], {
          env: { ...process.env, TURSO_DATABASE_URL: 'file:' + f.replace(/\\/g, '/'), TURSO_AUTH_TOKEN: 'x', BAN_CHINH: '', PISA_DB: '' }, encoding: 'utf8', timeout: 300_000 });
        if (r.status !== 0) throw new Error(`migrate lỗi: ${String(r.stderr).slice(-400)}`);
        return JSON.parse(String(r.stdout).split('@@').pop()!.trim());
      };
      const dem = () => {
        const c = new Database(f, { readonly: true });
        try {
          return JSON.stringify((c.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as any[])
            /* `case_engine_migrated_at` là mốc lần chạy migrate (như DEPLOY-1c), không phải dữ liệu. */
            .map((b) => [b.name, (c.prepare(`SELECT COUNT(*) n FROM "${b.name}"${b.name === 'demo_config' ? " WHERE key != 'case_engine_migrated_at'" : ''}`).get() as any).n]));
        } finally { c.close(); }
      };
      const truoc = dem();
      const a1 = chay(); const a2 = chay();
      assert(a1.length === 0 && a2.length === 0, `${JSON.stringify(a1)} | ${JSON.stringify(a2)}`);
      assert(dem() === truoc, 'số dòng đổi sau migrate');
    } finally {
      /* Windows: file DB vừa đóng ở tiến trình con có thể chưa nhả khoá — thử lại; lỗi dọn thư mục tạm không được che kết quả phép kiểm. */
      try { fs.rmSync(thuMuc, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* bỏ qua */ }
    }
  });
}
