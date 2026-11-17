/**
 * PHÉP KIỂM N52 (chủ SP 18/11) — CX xem mọi thứ trong phạm vi (như Quản lý, cả phần GV); sửa phía TVV (như vai TVV) + Ý thức + lớp / chuyển lớp; KHÔNG học thuật
 * (điểm, Case / PA, lịch Test), KHÔNG bị giao việc. Qua HTTP thật: CX chi nhánh CP sửa em CP, không đụng em MB (403); CX toàn hệ thống sửa mọi chi nhánh; /my-work
 * của CX không có việc "của tôi", "Tất cả" = danh sách QL cùng phạm vi, không dòng nào `mine`; hồ sơ em không có "Việc của bạn"; không Quản trị / phân công GV /
 * Case; xem Phân tích phần GV. Migrate prCxN52: DB cũ → đủ quyền, lần hai không đổi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrCxN52Tests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, P } = t;
  const accounts: any = await import('../platform/accounts.ts');
  const { migratePrCxN52, KHOA_PR_CX_N52, QUYEN_CX_N52 } = await import('../migrate/prCxN52.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { loadPrincipal, can, coQuyenBuocTiep, duyetYThuc, duocSuaLichLop } = await import('../permissions.ts');
  const { quyenBanGiao } = await import('../classes/banGiao.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const { duocDoiMon } = await import('../fasttrack/monDangKy.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nN52 · CX xem như Quản lý, sửa mọi thứ về học viên, không bị giao việc');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `cxn52.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-cxn52', fullName: `Thử CX N52 ${seq}`, roles }).userId as number;
  };
  const idCxCp = tao([{ role: 'cx', branches: ['CP'] }]);
  const idCxAll = tao([{ role: 'cx', branches: [] }]);
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const CP = cn('CP'); const MB = cn('MB');
  const emCua = (b: number) => one(`SELECT e.student_id id, e.class_id lop FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
      WHERE c.branch_id = ? AND c.status = 'active' AND e.status = 'active' AND s.status = 'active' ORDER BY e.student_id LIMIT 1`, b);
  const emCp = emCua(CP); const emMb = emCua(MB);
  const QUYEN_HV = [PERMISSIONS.STUDENT_EDIT_INFO, PERMISSIONS.STUDENT_EDIT_MORE, PERMISSIONS.VIOLATION_RECORD, PERMISSIONS.DISCIPLINE_MANAGE];
  const KHONG = ['class.assign', 'admin.config', 'student.edit', 'cycle.edit', 'sos.report', 'sos.edit', 'case.close', 'case.approve', 'request.approve', 'plan.week', 'schedule.move', 'attempt.cancel', 'attempt.skip_skill', 'deadline.override',
    'score.edit', 'score.override', 'meeting.edit', 'tutor.view', 'tutor.manage'];

  check('N52-0 · seed: CX có đủ quyền N52, không học thuật (Case / PA, điểm, lịch Test), không quyền hệ thống / phân công GV', () => {
    assert(emCp?.id && emMb?.id, JSON.stringify({ emCp, emMb }));
    const q = ROLE_PERMISSIONS.cx;
    const thieu = QUYEN_CX_N52.filter((k) => !q.includes(k));
    assert(!thieu.length, `thiếu ${thieu.join(', ')}`);
    const thua = KHONG.filter((k) => q.includes(k));
    assert(!thua.length, `bị nới ${thua.join(', ')}`);
  });

  await checkAsync('N52-1 · migrate prCxN52: DB cũ → CX đủ quyền N52, vai khác không đổi; lần hai không đổi', async () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare(`DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE key = 'cx')
          AND permission_id IN (SELECT id FROM permissions WHERE key IN (${QUYEN_CX_N52.map(() => '?').join(',')}))`).run(...QUYEN_CX_N52);
      conn.prepare('DELETE FROM demo_config WHERE key = ?').run(KHOA_PR_CX_N52);
      const khac = () => all(`SELECT rp.role_id, rp.permission_id FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.key != 'cx' ORDER BY 1, 2`).map((x) => `${x.role_id}:${x.permission_id}`).join();
      const truocKhac = khac();
      const lan1: string[] = [];
      migratePrCxN52(conn, lan1);
      const cua = all(`SELECT p.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'cx'`).map((x) => x.key as string);
      assert(QUYEN_CX_N52.every((k) => cua.includes(k)), `CX sau migrate: ${cua.join(',')}`);
      assert(lan1.length === 1 && lan1[0].includes(`${QUYEN_CX_N52.length} quyền`), `lần 1: ${lan1.join(' | ')}`);
      assert(khac() === truocKhac, 'vai khác bị đổi');
      const sau = all('SELECT 1 FROM role_permissions').length;
      const lan2: string[] = [];
      migratePrCxN52(conn, lan2);
      assert(!lan2.length && all('SELECT 1 FROM role_permissions').length === sau, `lần 2 vẫn đổi: ${lan2.join(' | ')}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('N52-2 · quyền theo chi nhánh: CX CP sửa em / lớp CP (phía TVV, Ý thức, sửa lớp), không MB; CX toàn hệ thống cả hai; không ai có học thuật / phân công GV', () => {
    const cxCp = loadPrincipal(idCxCp); const cxAll = loadPrincipal(idCxAll);
    const sai: string[] = [];
    const tvv = (x: any, sid: number) => coQuyenBuocTiep(x, sid) && duocDoiMon(x, { studentId: sid });   // phía TVV: Bước tiếp, đổi môn / Tuần bắt đầu
    for (const q of QUYEN_HV) {
      if (!can(cxCp, q, { studentId: emCp.id })) sai.push(`CX CP thiếu ${q} em CP`);
      if (can(cxCp, q, { studentId: emMb.id })) sai.push(`CX CP có ${q} em MB`);
      if (!can(cxAll, q, { studentId: emMb.id }) || !can(cxAll, q, { studentId: emCp.id })) sai.push(`CX toàn hệ thống thiếu ${q}`);
    }
    if (!tvv(cxCp, emCp.id) || tvv(cxCp, emMb.id) || !tvv(cxAll, emMb.id)) sai.push('phía TVV (Bước tiếp, đổi môn) sai phạm vi');
    if (!can(cxCp, PERMISSIONS.CLASS_EDIT, { classId: emCp.lop }) || can(cxCp, PERMISSIONS.CLASS_EDIT, { classId: emMb.lop })) sai.push('sửa lớp sai phạm vi');
    for (const q of [PERMISSIONS.CLASS_ASSIGN, PERMISSIONS.ADMIN_CONFIG, PERMISSIONS.PLAN_WEEK, PERMISSIONS.SOS_REPORT, PERMISSIONS.SOS_EDIT, PERMISSIONS.CASE_APPROVE, PERMISSIONS.SCORE_OVERRIDE])
      for (const [ten, x] of [['CP', cxCp], ['toàn hệ thống', cxAll]] as const) if (can(x, q, { classId: emCp.lop, studentId: emCp.id })) sai.push(`CX ${ten} có ${q}`);
    assert(!sai.length, sai.join(' | '));
  });

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
    });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };

  try {
    const cxCp = await vao(idCxCp); const cxAll = await vao(idCxAll); const ql = await vao(P.cpManager.userId);
    /* `/my-work` gửi DÒNG (`dong`, dòng gộp kèm `con`), không gửi `items`. */
    const phang = (w: any): any[] => (w?.dong ?? []).flatMap((d: any) => [d, ...(d.con ?? [])]);
    const ghiChu = (id: number) => (one('SELECT note FROM students WHERE id = ?', id)?.note ?? '') as string;

    await checkAsync('N52-3 · sửa HV qua HTTP: CX CP em CP 200, em MB 403 (cả xem); CX toàn hệ thống em MB 200', async () => {
      let r = await goi('PATCH', `/students/${emCp.id}`, cxCp, { note: `${ghiChu(emCp.id)} · N52` });
      assert(r.status === 200, `CX CP sửa em CP: ${r.status} ${r.json?.error}`);
      r = await goi('PATCH', `/students/${emMb.id}`, cxCp, { note: 'N52 ngoài chi nhánh' });
      assert(r.status === 403, `CX CP sửa em MB: ${r.status}`);
      r = await goi('GET', `/students/${emMb.id}`, cxCp);
      assert(r.status === 403 || r.status === 404, `CX CP xem em MB: ${r.status}`);
      r = await goi('PATCH', `/students/${emMb.id}`, cxAll, { note: `${ghiChu(emMb.id)} · N52` });
      assert(r.status === 200, `CX toàn hệ thống sửa em MB: ${r.status} ${r.json?.error}`);
    });

    await checkAsync('N52-4 · không giao việc: /my-work của CX rỗng; "Tất cả" có việc nhưng không dòng nào của CX; hồ sơ em không có "Việc của bạn"', async () => {
      for (const [ten, ck] of [['CP', cxCp], ['toàn hệ thống', cxAll]] as const) {
        const toi = await goi('GET', '/my-work', ck);
        assert(toi.status === 200 && !(toi.json.dong ?? []).length && toi.json.summary.mine === 0 && toi.json.summary.overdue === 0
          && !toi.json.summary.canLamNgay, `CX ${ten} Của tôi: ${toi.status} ${JSON.stringify(toi.json?.summary)}`);
        const tat = await goi('GET', '/my-work?nguoi=tat-ca', ck);
        assert(tat.status === 200 && phang(tat.json).length > 0, `CX ${ten} Tất cả: ${tat.status} ${phang(tat.json).length}`);
        const cua = phang(tat.json).filter((it) => it.mine || it.ownerId === (ten === 'CP' ? idCxCp : idCxAll));
        assert(!cua.length, `CX ${ten} có việc của mình: ${cua.slice(0, 3).map((x) => x.key).join(', ')}`);
      }
      /* Cùng phạm vi, QL CP có việc "chưa ai giữ mà mình làm được" → với CX CP các việc đó không thành của CX. */
      const tql = await goi('GET', `/my-work?nguoi=tat-ca&branchId=${CP}`, ql);
      const tcx = await goi('GET', `/my-work?nguoi=tat-ca&branchId=${CP}`, cxCp);
      const khoaQl = new Set(phang(tql.json).map((x) => x.key));
      const khoaCx = phang(tcx.json).map((x) => x.key);
      assert(khoaCx.every((k) => khoaQl.has(k)), `CX CP thấy việc ngoài phạm vi QL CP: ${khoaCx.filter((k) => !khoaQl.has(k)).slice(0, 3).join(', ')}`);
      const hs = await goi('GET', `/students/${emCp.id}`, cxCp);
      assert(hs.status === 200 && !(hs.json.viec?.cuaBan ?? []).length, `hồ sơ em CP: ${hs.status} ${JSON.stringify(hs.json?.viec?.cuaBan?.map((x: any) => x.key))}`);
    });

    await checkAsync('N52-5 · điều hướng + chặn: CX có Test, Công việc (không hộp Chờ duyệt), Phân tích GV; không Quản trị, không phân công GV, không báo Case', async () => {
      for (const [ten, ck] of [['CP', cxCp], ['toàn hệ thống', cxAll]] as const) {
        const s = await goi('GET', '/demo/session', ck);
        const n = s.json?.nav ?? {};
        assert(n.test && n.work && n.workCx && n.phanTichGv && n.analysis && n.students && !n.admin && !n.workApprove && !n.workOps,
          `CX ${ten} nav: ${JSON.stringify(n)}`);
        let r = await goi('GET', '/admin/permissions/matrix', ck);
        assert(r.status === 403, `CX ${ten} Quản trị: ${r.status}`);
        r = await goi('PUT', `/classes/${emCp.lop}/teachers`, ck, { slots: [] });
        assert(r.status === 403, `CX ${ten} phân công GV: ${r.status}`);
        r = await goi('POST', '/cases/report', ck, { studentId: emCp.id, summary: 'N52 thử báo Case' });
        assert(r.status === 403, `CX ${ten} báo Case: ${r.status}`);
        r = await goi('GET', '/phan-tich/giao-vien', ck);
        assert(r.status === 200, `CX ${ten} Phân tích GV: ${r.status} ${r.json?.error}`);
      }
    });

    await checkAsync('N52-6 · phía TVV + Ý thức + lớp qua HTTP: CX CP đổi Target em CP 200, em MB 403; duyệt / áp thẳng Ý thức em CP, không MB, không duyệt loại khác; tạo lớp + thêm HV CP 200, MB 403; lưu điểm, thêm PA 403', async () => {
      const cy = (sid: number) => one(`SELECT id, target_score t FROM learning_cycles WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, sid);
      const cyCp = cy(emCp.id); const cyMb = cy(emMb.id);
      assert(cyCp && cyMb, JSON.stringify({ cyCp, cyMb }));
      const moi = (c: any) => ((c.t ?? 6.5) >= 8.5 ? 6.5 : (c.t ?? 6.5) + 0.5);
      let r = await goi('POST', `/cycles/${cyCp.id}/target-revision`, cxCp, { newTarget: moi(cyCp), reason: 'N52 CX đổi Target' });
      assert(r.status === 200, `CX CP đổi Target em CP: ${r.status} ${r.json?.error}`);
      r = await goi('POST', `/cycles/${cyMb.id}/target-revision`, cxCp, { newTarget: moi(cyMb), reason: 'N52 CX đổi Target ngoài' });
      assert(r.status === 403, `CX CP đổi Target em MB: ${r.status}`);
      /* Ý thức: CX duyệt / áp thẳng như Head trong phạm vi (`duyetYThuc`); loại thẻ khác (Kỳ vọng, Cuối khoá…) vẫn chỉ `request.approve`. */
      const p = loadPrincipal(idCxCp);
      assert(duyetYThuc(p, { studentId: emCp.id }) && !duyetYThuc(p, { studentId: emMb.id }) && !can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: emCp.id }),
        'Ý thức CX: duyệt em CP, không MB, không request.approve chung');
      /* Tạo lớp + thêm HV: chi nhánh mình 200, chi nhánh khác 403. */
      let so = 990;
      const lopMoi = (b: number) => ({ branchId: b, chuongTrinh: 'FT', loTrinh: 'LT1', so: String(++so) });
      r = await goi('POST', '/classes', cxCp, lopMoi(CP));
      assert(r.status === 200 && r.json?.id, `CX CP tạo lớp CP: ${r.status} ${r.json?.error}`);
      const lopCp = r.json.id as number;
      r = await goi('POST', '/classes', cxCp, lopMoi(MB));
      assert(r.status === 403, `CX CP tạo lớp MB: ${r.status}`);
      const mot = (ten: string) => ({ rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }] });
      r = await goi('POST', '/intake/commit', cxCp, { classId: lopCp, ...mot('N52 Thêm HV'), idempotencyKey: 'n52-them-1' });
      assert(r.status === 200, `CX CP thêm HV lớp CP: ${r.status} ${r.json?.error}`);
      r = await goi('POST', '/intake/commit', cxCp, { classId: emMb.lop, ...mot('N52 Ngoài') });
      assert(r.status === 403, `CX CP thêm HV lớp MB: ${r.status}`);
      /* Học thuật: lưu điểm, thêm PA → 403. */
      const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, emCp.id)?.id;
      const cs = one(`SELECT id FROM sos_cases WHERE student_id = ? ORDER BY id LIMIT 1`, emCp.id)?.id;
      if (luot) { r = await goi('PUT', `/attempts/${luot}/scores/listening`, cxCp, { rawScore: 20, rawTotal: 40 }); assert(r.status === 403, `CX lưu điểm: ${r.status}`); }
      if (cs) { r = await goi('POST', `/cases/${cs}/interventions`, cxCp, { kind: 'tutor', note: 'N52' }); assert(r.status === 403, `CX thêm PA: ${r.status}`); }
      assert(luot || cs, 'demo cần lượt hoặc Case của em CP');
    });

    await checkAsync('N52-7 · rà bảo mật #1841: CX có class.edit nhưng KHÔNG quyết Xét lại lộ trình (lưu / hoàn tác 403, xem được chỉ xem), KHÔNG bàn giao thay GV, KHÔNG đổi lịch lớp (tiến độ = lịch Test)', async () => {
      const lop = emCp.lop as number;
      let r = await goi('POST', `/classes/${lop}/xet-lai`, cxCp, { items: [{ studentId: emCp.id, quyetDinh: 'tiep_tuc' }] });
      assert(r.status === 403, `CX lưu Xét lại: ${r.status} ${r.json?.error}`);
      r = await goi('POST', `/classes/${lop}/xet-lai/hoan-tac`, cxCp, { ids: [1] });
      assert(r.status === 403, `CX hoàn tác Xét lại: ${r.status} ${r.json?.error}`);
      r = await goi('GET', `/classes/${lop}/xet-lai`, cxCp);
      assert(r.status === 200 && r.json?.chiXem === true, `CX xem Xét lại: ${r.status} ${JSON.stringify(r.json?.chiXem)}`);
      r = await goi('PATCH', `/classes/${lop}/progress`, cxCp, { startWeek: '2026-09-07' });
      assert(r.status === 403, `CX đổi tiến độ lớp: ${r.status} ${r.json?.error}`);
      const p = loadPrincipal(idCxCp);
      assert(!duocSuaLichLop(p, lop), 'CX không sửa lịch lớp');
      const q = quyenBanGiao(p, { lop_nguon_id: lop, han_gvcn: null }, 'listening');
      assert(!q.ghiMon && !q.xacNhan && !q.xacNhanThay, `CX bàn giao thay: ${JSON.stringify(q)}`);
      const bg = one(`SELECT b.id FROM ban_giao_gv b JOIN classes c ON c.id = b.class_id WHERE c.branch_id = ? ORDER BY b.id LIMIT 1`, CP)?.id;
      if (bg) { r = await goi('PUT', `/ban-giao-gv/${bg}/gop-y`, cxCp, { gopY: 'N52 thử' }); assert(r.status === 403, `CX góp ý bàn giao GV: ${r.status} ${r.json?.error}`); }
    });
  } finally {
    may.close();
    xoaNho();
  }
}
