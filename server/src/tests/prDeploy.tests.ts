/** PHÉP KIỂM PR-DEPLOY — chuẩn bị reset bản chính (kế hoạch 2026-10-02-pr-deploy-reset-ban-chinh). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDeployTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const meeting: any = await import('../worklist/meeting.ts');
  const { createApp } = await import('../app.ts');
  const MB = get("SELECT id FROM branches WHERE code = 'MB'").id as number;
  const CP = get("SELECT id FROM branches WHERE code = 'CP'").id as number;

  /** Máy chủ thật + phiên demo theo người dùng — đi đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<{ status: number; json: any }>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân JSON */ }
      return { status: res.status, json };
    };
    try { await fn(goi); } finally { may.close(); }
  }

  // ------------------------------------------------------------------ Task 0b-1 · POST /tasks không ghi sang chi nhánh khác (P0)
  console.log('\nPR-DEPLOY · (0b-1) Giao việc cho giáo viên: máy chủ tự suy chi nhánh từ lớp, kiểm quyền từng lớp / học viên');
  const lopCp = classId('CP FT 110');
  const lopMb = classId('MB FT 102');
  const dem = () => ({
    cases: get('SELECT COUNT(*) n FROM sos_cases').n as number,
    pa: get('SELECT COUNT(*) n FROM case_interventions').n as number,
    links: get('SELECT COUNT(*) n FROM task_students').n as number,
    tasks: get('SELECT COUNT(*) n FROM tasks').n as number,
  });
  const emCua = (lop: number, n = 1) => all(
    `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id LIMIT ?`, lop, n).map((r) => r.id as number);
  const khongDoi = (truoc: ReturnType<typeof dem>, msg: string) => {
    const sau = dem();
    assert(JSON.stringify(sau) === JSON.stringify(truoc), `${msg}: ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
  };

  check('0b-1a · QL MB giao việc cho lớp CP (gửi branchId = MB) → 403, không sinh Case / PA / việc', () => {
    const truoc = dem();
    const e = loiCua(() => meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lopCp, topic: 'listening', title: 'Việc chéo chi nhánh 0b-1a', branchId: MB }));
    assert(e?.status === 403, `kỳ vọng 403, được ${e?.status ?? 'không ném'}`);
    khongDoi(truoc, 'dữ liệu đổi sau 403');
  });
  check('0b-1b · bỏ hẳn branchId (Toàn hệ thống) vẫn 403 với lớp CP — chi nhánh suy từ lớp, không tin thân yêu cầu', () => {
    const truoc = dem();
    const e = loiCua(() => meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lopCp, topic: 'listening', title: 'Việc chéo chi nhánh 0b-1b' }));
    assert(e?.status === 403, `kỳ vọng 403, được ${e?.status ?? 'không ném'}`);
    khongDoi(truoc, 'dữ liệu đổi sau 403');
  });
  check('0b-1c · lớp MB nhưng studentIds có em lớp CP → 400, không ghi gì (mọi em phải thuộc lớp của việc)', () => {
    const truoc = dem();
    const e = loiCua(() => meeting.createTask(P.mbManager, {
      kind: 'teacher_task', classId: lopMb, topic: 'reading', title: 'Việc lẫn em chi nhánh khác 0b-1c', studentIds: [...emCua(lopMb), ...emCua(lopCp)],
    }));
    assert(e?.status === 400, `kỳ vọng 400, được ${e?.status ?? 'không ném'}`);
    khongDoi(truoc, 'dữ liệu đổi sau 400');
  });
  check('0b-1d · studentIds bỏ trùng; quá 500 → 400; id không phải số bị từ chối, không bị lặng lẽ bỏ', () => {
    const [a, b] = emCua(lopMb, 2);
    const truoc = dem();
    const tr = meeting.createTask(P.mbManager, {
      kind: 'teacher_task', classId: lopMb, topic: 'reading', title: 'Việc bỏ trùng 0b-1d', studentIds: [a, a, b, a],
    }) as any;
    assert(get('SELECT COUNT(*) n FROM task_students WHERE task_id = ?', tr.id).n === 2, 'trùng id phải gộp còn 2 em');
    const sau = dem();
    assert(sau.links === truoc.links + 2, 'đúng 2 liên kết em');
    const e1 = loiCua(() => meeting.createTask(P.mbManager, {
      kind: 'teacher_task', classId: lopMb, topic: 'reading', title: 'Việc quá trần 0b-1d', studentIds: Array.from({ length: 501 }, (_, i) => i + 1),
    }));
    assert(e1?.status === 400, `501 em: kỳ vọng 400, được ${e1?.status ?? 'không ném'}`);
    const e2 = loiCua(() => meeting.createTask(P.mbManager, {
      kind: 'teacher_task', classId: lopMb, topic: 'reading', title: 'Việc id rác 0b-1d', studentIds: [a, 'abc'],
    }));
    assert(e2?.status === 400, `id rác: kỳ vọng 400, được ${e2?.status ?? 'không ném'}`);
  });
  check('0b-1e · đường đúng vẫn chạy: QL MB giao cả lớp MB FT 102 → branch_id = MB (từ lớp), mỗi em một Case/PA', () => {
    const truoc = dem();
    const tr = meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lopMb, topic: 'speaking', title: 'Việc đường đúng 0b-1e' }) as any;
    assert(tr.branch_id === MB, `branch_id ${tr.branch_id}`);
    const si = all(`SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status='active' AND s.status='active' AND s.archived_at IS NULL`, lopMb).length;
    assert(dem().links === truoc.links + si, 'số em được giao khác sĩ số');
  });
  check('0b-1f · Quản trị gửi branchId lệch chi nhánh của lớp → 400; việc chi nhánh của QL MB không branchId được gắn MB, của Quản trị giữ Toàn hệ thống', () => {
    const e = loiCua(() => meeting.createTask(P.admin, { kind: 'teacher_task', classId: lopCp, topic: 'reading', title: 'Việc lệch chi nhánh 0b-1f', branchId: MB }));
    assert(e?.status === 400, `kỳ vọng 400, được ${e?.status ?? 'không ném'}`);
    const ql = meeting.createTask(P.mbManager, { kind: 'branch_ops', title: 'Việc chi nhánh không branchId 0b-1f' }) as any;
    assert(ql.branch_id === MB, `QL MB: branch_id ${ql.branch_id}`);
    const qt = meeting.createTask(P.admin, { kind: 'branch_ops', title: 'Việc toàn hệ thống 0b-1f' }) as any;
    assert(qt.branch_id === null, `Quản trị: branch_id ${qt.branch_id}`);
  });
  check('0b-1g · followerIds chỉ nhận người trong phạm vi chi nhánh của việc (QL CP không được thêm vào việc MB; QL MB khác thì có)', () => {
    const tr = meeting.createTask(P.mbManager, {
      kind: 'branch_ops', title: 'Việc người theo dõi 0b-1g', followerIds: [P.cpManager.userId, 999999],
    }) as any;
    const ds = all('SELECT user_id FROM task_followers WHERE task_id = ?', tr.id).map((r) => r.user_id as number);
    assert(!ds.includes(P.cpManager.userId), 'QL CP lọt vào người theo dõi việc MB');
    assert(ds.includes(P.mbManager.userId), 'QL MB phải có sẵn (tự thêm theo chi nhánh)');
  });

  await checkAsync('0b-1h · POST /ref/periods/resolve chặn ngày ngoài ±3 năm (0001-01-01, 9999-12-27) — không ghi báo cáo tuần rác', async () => {
    const truoc = get('SELECT COUNT(*) n FROM report_periods').n;
    await voiMayChu(async (goi) => {
      for (const ngay of ['0001-01-01', '9999-12-27']) {
        const r = await goi(P.coreTeacher.userId, '/ref/periods/resolve', { method: 'POST', body: JSON.stringify({ weekStart: ngay }) });
        assert(r.status === 400, `${ngay}: kỳ vọng 400, được ${r.status}`);
      }
      const ok = await goi(P.coreTeacher.userId, '/ref/periods/resolve', { method: 'POST', body: JSON.stringify({ weekStart: t.TODAY }) });
      assert(ok.status === 200 && ok.json?.id > 0, `ngày hôm nay phải resolve được: ${ok.status}`);
    });
    assert(get('SELECT COUNT(*) n FROM report_periods').n === truoc, 'có hàng report_periods rác');
  });

  // ------------------------------------------------------------------ Task 0b-2 · Case của em đã chuyển lớp: thấy ở danh sách thì mở được, đóng được (P1)
  console.log('\nPR-DEPLOY · (0b-2) Case của em đã chuyển lớp: một biểu thức lớp cho danh sách, chi tiết, đóng Case');
  const cases: any = await import('../cases/cases.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const gvcnCuaLop = (lopId: number) => loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, lopId).user_id);
  const maLoi = (fn: () => unknown): number | string => { const e = loiCua(fn); return e ? (e.status ?? String(e.message)) : 'không ném'; };
  /** Case còn mở, có lượt, em đang học đúng lớp của lượt, lớp Fast Track — ứng viên chuyển lớp. */
  const caseCoLuot = (cn: number, bo: number[] = []) => get(
    `SELECT sc.id AS caseId, sc.student_id AS sid, a.class_id AS tu FROM sos_cases sc
       JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN classes cl ON cl.id = a.class_id
       JOIN enrollments e ON e.student_id = sc.student_id AND e.class_id = a.class_id AND e.status = 'active'
      WHERE sc.status != 'done' AND cl.is_fast_track = 1 AND cl.branch_id = ?
        AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = sc.student_id AND x.status = 'active') = 1   -- phép kiểm trước có thể để em ở nhiều lớp
        AND sc.id NOT IN (${bo.concat(0).map(() => '?').join(',')})
      ORDER BY sc.id LIMIT 1`, cn, ...bo.concat(0));
  const chuyenEm = (sid: number, tu: number, den: number) => {
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(sid, tu);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, den, t.TODAY, new Date().toISOString());
    conn.prepare('UPDATE students SET branch_id = (SELECT branch_id FROM classes WHERE id = ?) WHERE id = ?').run(den, sid);   // như luatLoTrinh.ts khi chuyển
  };
  const lopKhacCungCn = (tu: number) => get(`SELECT id FROM classes WHERE branch_id = (SELECT branch_id FROM classes WHERE id = ?) AND is_fast_track = 1 AND status = 'active' AND id != ? ORDER BY id LIMIT 1`, tu, tu).id as number;
  let caseA: any = null;
  check('0b-2a · em MB FT chuyển sang lớp MB khác: GVCN lớp mới mở được Case (không 403), danh sách và chi tiết khớp; QL MB có nút Hoàn thành và đóng không bị 403; người ngoài chi nhánh 403', () => {
    caseA = caseCoLuot(MB);
    assert(caseA, 'seed không có Case có lượt của em lớp MB FT');
    const den = lopKhacCungCn(caseA.tu);
    chuyenEm(caseA.sid, caseA.tu, den);
    const gv = gvcnCuaLop(den);
    const ds = cases.listCases(gv, { classId: den }).rows as any[];
    assert(ds.some((r) => r.id === caseA.caseId), 'GVCN lớp mới không thấy Case ở danh sách (Q5)');
    assert(maLoi(() => cases.caseDetail(gv, caseA.caseId)) === 'không ném', `GVCN lớp mới mở Case: ${maLoi(() => cases.caseDetail(gv, caseA.caseId))}`);
    const ql = cases.caseDetail(P.mbManager, caseA.caseId);
    assert(ql.viewer?.canClose === true, 'QL MB: nút Hoàn thành phải bật (cùng luật với máy chủ)');
    const dong = maLoi(() => cases.closeCaseOutcome(P.mbManager, caseA.caseId, { outcome: 'improved', note: 'Đóng thử sau chuyển lớp 0b-2a' }));
    assert(dong !== 403, 'QL MB đóng Case của em đã chuyển lớp bị 403 dù nút bật');
    assert(maLoi(() => cases.caseDetail(P.cpManager, caseA.caseId)) === 403, 'QL CP (ngoài phạm vi) phải 403');
  });
  check('0b-2b · em chuyển sang CHI NHÁNH khác (MB → CP): QL CP mở Case, nút bật, đóng được; QL MB cũ không còn quyền (403) — danh sách và chi tiết khớp nhau', () => {
    const c = caseCoLuot(MB, [caseA?.caseId ?? 0]);
    assert(c, 'seed không có Case thứ hai');
    chuyenEm(c.sid, c.tu, lopCp);
    const ds = cases.listCases(P.cpManager, { classId: lopCp }).rows as any[];
    const caseRow = get('SELECT student_id, attempt_id, status FROM sos_cases WHERE id = ?', c.caseId);
    const ghiDanh = all(`SELECT class_id, status FROM enrollments WHERE student_id = ?`, c.sid);
    assert(ds.some((r) => r.id === c.caseId), `QL CP không thấy Case ở danh sách: case ${JSON.stringify(caseRow)} · em ${c.sid} ghi danh ${JSON.stringify(ghiDanh)} · danh sách không lọc lớp: ${(cases.listCases(P.cpManager, {}).rows as any[]).some((r) => r.id === c.caseId)}`);
    const ct = cases.caseDetail(P.cpManager, c.caseId);
    assert(ct.viewer?.canClose === true && ct.classId === lopCp, `QL CP: canClose ${ct.viewer?.canClose}, classId ${ct.classId}`);
    assert(maLoi(() => cases.closeCaseOutcome(P.cpManager, c.caseId, { outcome: 'improved', note: 'Đóng thử sau chuyển chi nhánh 0b-2b' })) !== 403, 'QL CP đóng Case bị 403');
    assert(maLoi(() => cases.caseDetail(P.mbManager, c.caseId)) === 403, 'QL MB cũ phải mất quyền (khớp danh sách ẩn)');
    assert(!(cases.listCases(P.mbManager, {}).rows as any[]).some((r) => r.id === c.caseId), 'QL MB cũ vẫn thấy Case ở danh sách');
  });

  // ------------------------------------------------------------------ Task 0b-3 · Case nhớ lớp + chương trình gốc (P1, R5-5)
  console.log('\nPR-DEPLOY · (0b-3) Case nhớ lớp + chương trình gốc lúc mở; lần trượt ở chương trình mới mở Case mới');
  check('0b-3a · sos_cases có goc_class_id + goc_programme_code; mọi Case có lượt: lớp gốc = lớp của lượt, chương trình gốc = chương trình lớp đó', () => {
    const cot = all('PRAGMA table_info(sos_cases)').map((c) => c.name);
    assert(cot.includes('goc_class_id') && cot.includes('goc_programme_code'), 'thiếu cột');
    const lech = all(`SELECT sc.id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN classes c ON c.id = a.class_id
      WHERE sc.goc_class_id IS NOT a.class_id OR sc.goc_programme_code IS NOT c.programme_code LIMIT 5`);
    assert(lech.length === 0, `Case lệch lớp gốc: ${lech.map((r) => r.id)}`);
    assert(get('SELECT COUNT(*) n FROM sos_cases WHERE goc_class_id IS NULL').n === 0, 'Case không có lớp gốc (kể cả Case tay / giao việc)');
  });
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const transitionSvc: any = await import('../classes/transition.ts');
  let seq = 0;
  const taoEm = (lop: string) => {
    const ten = `DEPLOY HV ${++seq}`;
    const cid = classId(lop);
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: 'hv@demo.test' }], idempotencyKey: `deploy-${seq}` });
    regular.planRegularTests(P.admin, cid);
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const luot = (kind: string, cls?: number) => get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = ? ${cls ? 'AND class_id = ?' : ''} ORDER BY id DESC`, ...(cls ? [st.id, kind, cls] : [st.id, kind]))?.id as number | undefined;
    return { sid: st.id as number, luot };
  };
  const nhap = (aid: number, dd: Record<string, number>) => { for (const [k, v] of Object.entries(dd)) regular.saveRegularScore(P.admin, aid, k, { score: v, total: 20, lyDo: 'Phép kiểm 0b-3' }); };
  check('0b-3b · em FOU có Case G+V → lên BE → trượt Writing Giữa khoá BE ⇒ 2 Case; Case G+V vẫn ghi "G+V" ở mọi chỗ (bảng kỹ năng, Ngăn Case, danh sách); Case Writing BE ghi "Writing"', () => {
    const em = taoEm('MB FOU 12');
    nhap(em.luot('progress')!, { listening: 18, reading: 18, writing: 11, speaking: 18 });
    const gv = all('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', em.sid);
    assert(gv.length === 1 && gv[0].category === 'writing', `FOU: phải đúng 1 Case writing (${gv.length})`);
    const caseGv = gv[0];
    assert(caseGv.goc_programme_code === 'FOU' && caseGv.goc_class_id === classId('MB FOU 12'), `lớp gốc ${caseGv.goc_class_id}/${caseGv.goc_programme_code}`);
    const be = get(`SELECT id FROM classes WHERE programme_code = 'BE' AND branch_id = ? AND status = 'active' ORDER BY id LIMIT 1`, MB).id as number;
    const r = transitionSvc.applyTransition(P.admin, { fromClassId: classId('MB FOU 12'), effectiveDate: t.TODAY, dongs: [{ studentId: em.sid, huong: 'len_lop', toClassId: be }] });
    assert(r.done.length === 1, `không chuyển được em: ${JSON.stringify(r)}`);
    const sau = get('SELECT * FROM sos_cases WHERE id = ?', caseGv.id);
    assert(sau.goc_programme_code === 'FOU' && sau.goc_class_id === caseGv.goc_class_id, 'lớp gốc đổi sau khi chuyển lớp');
    regular.planRegularTests(P.admin, be, { studentIds: [em.sid], kinds: ['progress'] });   // Giữa khoá BE có thể đã qua lúc em vào — QL xếp bù (như pb2bSeed)
    const luotBe = em.luot('progress', be);
    assert(luotBe, 'em chưa có bài Giữa khoá ở BE');
    nhap(luotBe!, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const cs = all('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', em.sid);
    assert(cs.length === 2, `phải 2 Case (G+V của FOU, Writing của BE): ${cs.length}`);
    const cu = cs.find((c) => c.id === caseGv.id)!;
    const moi = cs.find((c) => c.id !== caseGv.id)!;
    assert(cu.status !== 'done' && cu.attempt_id === caseGv.attempt_id, 'Case G+V bị đụng (nối lần trượt BE / đổi lượt)');
    assert(moi.goc_programme_code === 'BE' && moi.goc_class_id === be, `Case mới: ${moi.goc_class_id}/${moi.goc_programme_code}`);
    const b = cases.skillSupportBoard(P.admin, em.sid);
    const nhom = (b.rows as any[]).find((x) => x.tuLopTruoc && x.cases.some((c: any) => c.id === cu.id));
    assert(nhom && nhom.short === d.tenMonNgan('FOU', 'writing'), `bảng kỹ năng: ${nhom?.short}`);
    const hangW = (b.rows as any[]).find((x) => x.category === 'writing' && !x.tuLopTruoc);
    assert(hangW && hangW.cases.some((c: any) => c.id === moi.id) && !hangW.cases.some((c: any) => c.id === cu.id), 'hàng Writing BE phải chỉ có Case Writing của BE');
    const ctCu = cases.caseDetail(P.admin, cu.id);
    assert(ctCu.chuongTrinh === 'FOU' && ctCu.categoryLabel === d.tenMon('FOU', 'writing') && ctCu.topicLabel === d.tenMon('FOU', ctCu.topic), `Ngăn Case G+V: ${ctCu.chuongTrinh}/${ctCu.categoryLabel}/${ctCu.topicLabel}`);
    const ctMoi = cases.caseDetail(P.admin, moi.id);
    assert(ctMoi.chuongTrinh === 'BE' && ctMoi.categoryLabel === d.tenMon('BE', 'writing'), `Ngăn Case Writing BE: ${ctMoi.chuongTrinh}/${ctMoi.categoryLabel}`);
    const ds = cases.listCases(P.admin, {}).rows as any[];
    assert(ds.find((x) => x.id === cu.id)?.categoryLabel === d.tenMon('FOU', 'writing'), 'danh sách Case: Case G+V phải ghi G+V');
    assert(ds.find((x) => x.id === moi.id)?.categoryLabel === d.tenMon('BE', 'writing'), 'danh sách Case: Case BE phải ghi Writing');
    const tong = (b.rows as any[]).reduce((n, x) => n + x.cases.length, 0);
    assert(tong === 2, `Σ Case trên bảng kỹ năng phải 2: ${tong}`);
  });
  check('0b-3c · GV báo tay Case Writing (QuickReport) cho em đã lên BE khi còn Case G+V của FOU mở → Case mới của BE, không bị chặn "đang có Case" và không gộp vào G+V', () => {
    const em = taoEm('MB FOU 12');
    nhap(em.luot('progress')!, { listening: 18, reading: 18, writing: 11, speaking: 18 });
    const caseGv = get('SELECT * FROM sos_cases WHERE student_id = ? AND category = ?', em.sid, 'writing');
    const be = get(`SELECT id FROM classes WHERE programme_code = 'BE' AND branch_id = ? AND status = 'active' ORDER BY id LIMIT 1`, MB).id as number;
    const r = transitionSvc.applyTransition(P.admin, { fromClassId: classId('MB FOU 12'), effectiveDate: t.TODAY, dongs: [{ studentId: em.sid, huong: 'len_lop', toClassId: be }] });
    assert(r.done.length === 1, 'không chuyển được em');
    const nn = d.issuesForTopic('writing', 'BE').find((x: any) => !d.laKhac?.(x.code))?.code ?? d.issuesForTopic('writing', 'BE')[0].code;
    const co = cases.reportIssue(P.admin, { studentId: em.sid, topic: 'writing', primaryCode: nn, observation: 'Phép kiểm 0b-3c', title: 'GV báo tay Writing BE 0b-3c', summary: 'Em viết sai cấu trúc câu phức nhiều lần ở bài BE', idempotencyKey: `deploy-tay-${em.sid}` });
    assert(co.id !== caseGv.id, 'Case tay bị gộp vào Case G+V của FOU');
    assert(get('SELECT goc_programme_code AS g FROM sos_cases WHERE id = ?', co.id).g === 'BE', 'Case tay phải mang chương trình gốc BE');
    assert(get('SELECT goc_programme_code AS g FROM sos_cases WHERE id = ?', caseGv.id).g === 'FOU', 'Case G+V vẫn FOU');
  });

  // ------------------------------------------------------------------ Task 1–2 · DEP-1 / DEP-2: database mới → migrate không đổi dòng nào
  console.log('\nPR-DEPLOY · (1–2) DEP-1, DEP-2: init / seed bằng mã hiện hành → migrate (nhánh Turso) không đổi dòng nào; schema.sql = migrate');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const pathMod = await import('node:path');
  const cp = await import('node:child_process');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const { default: Database } = await import('libsql');
  const { SCHEMA_PATH } = await import('../db.ts');
  const { initBanChinh } = await import('../ops/initBanChinh.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const migrateLibJs = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/migrate.js')).href;
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const urlFile = (f: string) => 'file:' + f.replace(/\\/g, '/');
  const O = { adminEmail: 'tapduot.pisa@gmail.com', adminPassword: 'MatKhauTapDuot2026', chiNhanh: [{ code: 'MB', name: 'Monbay' }, { code: 'BC', name: 'Bãi Cháy' }], now: '2026-10-02T00:00:00Z', schemaSql };
  const thuMuc = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'deploy-'));
  let soFile = 0;
  /** DB tạm dựng bằng `initBanChinh` (đúng lệnh bản chính) → đường file. `sua` chạy thêm trên kết nối trước khi đóng. */
  const dbInit = (sua?: (c: any) => void) => {
    const f = pathMod.join(thuMuc, `init-${++soFile}.sqlite`);
    const c = new Database(f);
    initBanChinh(c, O);
    sua?.(c);
    c.close();
    return f;
  };
  /** `migrate()` qua NHÁNH TURSO (URL `file:` — như bản chính, Q3) trong tiến trình con → danh sách bước đã làm. */
  const migrateTurso = (f: string): string[] => {
    const r = cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(migrateLibJs)}); console.log('@@' + JSON.stringify(m.migrate().applied));`], {
      env: { ...process.env, TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: 'x', BAN_CHINH: '', PISA_DB: '' }, encoding: 'utf8', timeout: 300_000,
    });
    if (r.status !== 0) throw new Error(`migrate lỗi (${r.status}): ${String(r.stderr).slice(-400)}`);
    return JSON.parse(String(r.stdout).split('@@').pop()!.trim());
  };
  /** Ảnh chụp: mọi đối tượng sqlite_master + cột từng bảng + MỌI dòng MỌI bảng (theo rowid). Bỏ đúng dòng `case_engine_migrated_at` (Q4). */
  const chup = (f: string) => {
    const c = new Database(f, { readonly: true });
    try {
      const bang = (c.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as any[]).map((r) => r.name as string);
      const out: Record<string, string> = {
        master: JSON.stringify(c.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all()),
      };
      for (const b of bang) {
        out[`cot:${b}`] = JSON.stringify(c.prepare(`PRAGMA table_info("${b}")`).all());
        const dong = c.prepare(`SELECT * FROM "${b}" ORDER BY rowid`).all() as any[];
        out[`dong:${b}`] = JSON.stringify(b === 'demo_config' ? dong.filter((r) => r.key !== 'case_engine_migrated_at') : dong);
      }
      return out;
    } finally { c.close(); }
  };
  /** So hai ảnh: trả các khoá lệch (bảng + phần lệch đầu tiên) — đỏ ở bảng nào là bước migrate đó đè dữ liệu của mã hiện hành. */
  const lech = (a: Record<string, string>, b: Record<string, string>) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((k) => a[k] !== b[k])
    .map((k) => {
      const x = a[k] ?? '', y = b[k] ?? '';
      let i = 0; while (i < x.length && x[i] === y[i]) i++;
      return `${k} @${i}: …${x.slice(Math.max(0, i - 80), i + 80)}… ⇒ …${y.slice(Math.max(0, i - 80), i + 80)}…`;
    });

  check('DEPLOY-1a · initBanChinh → demo_config có khoá xoa_du_lieu_backfill_at và dấu DB mới khoi_tao_moi_at', () => {
    const c = new Database(dbInit(), { readonly: true });
    try {
      const k = (c.prepare('SELECT key FROM demo_config').all() as any[]).map((r) => r.key);
      assert(k.includes('xoa_du_lieu_backfill_at') && k.includes('khoi_tao_moi_at'), `khoá: ${k}`);
    } finally { c.close(); }
  });
  check('DEPLOY-1b · init → em thôi học đã "Bỏ lưu trữ" (status finished, archived_at NULL) → migrate → em VẪN ngoài Lưu trữ', () => {
    const f = dbInit((c) => {
      c.prepare(`INSERT INTO students (student_code, full_name, normalized_name, status, finished_at, archived_at, created_at) VALUES ('PISA-900001', 'Em đã bỏ lưu trữ', 'em da bo luu tru', 'finished', '2026-09-30', NULL, '2026-09-01')`).run();
    });
    migrateTurso(f);
    const c = new Database(f, { readonly: true });
    try {
      const r = c.prepare("SELECT archived_at FROM students WHERE student_code = 'PISA-900001'").get() as any;
      assert(r && r.archived_at === null, `migrate lưu trữ lại em QL đã Bỏ lưu trữ: ${JSON.stringify(r)}`);
    } finally { c.close(); }
  });
  check('DEPLOY-1c · init → migrate (nhánh Turso) HAI lần: applied = [] cả hai lần, ảnh chụp mọi bảng + cấu trúc giống hệt (trừ case_engine_migrated_at)', () => {
    const f = dbInit();
    const truoc = chup(f);
    const a1 = migrateTurso(f);
    const sau1 = chup(f);
    const a2 = migrateTurso(f);
    const sau2 = chup(f);
    assert(a1.length === 0 && a2.length === 0, `migrate còn việc: ${JSON.stringify(a1)} | ${JSON.stringify(a2)}`);
    const l1 = lech(truoc, sau1), l2 = lech(sau1, sau2);
    assert(!l1.length && !l2.length, `đổi sau migrate: ${[...l1, ...l2].slice(0, 4).join(' ‖ ')}`);
  });
  check('DEPLOY-2a · bộ demo dựng bằng mã hiện hành (seed vào file tạm) → migrate (nhánh Turso) không đổi dòng nào, không đổi cấu trúc', () => {
    const f = pathMod.join(thuMuc, 'seed.sqlite');
    const r = cp.spawnSync(process.execPath, [pathMod.join(REPO, 'dist-server/server/src/seed/run.js')], {
      env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BAN_CHINH: '', PISA_DB: f }, encoding: 'utf8', timeout: 600_000,
    });
    assert(r.status === 0, `seed lỗi: ${String(r.stderr).slice(-300)}`);
    /* (2b) bẫy cho các dòng nghi ngờ của bảng rà: PA đang chạy hạn đặt tay rơi Chủ nhật; Case đóng mà chưa ghi hướng xử lý. */
    const c = new Database(f);
    try {
      const pa = c.prepare(`SELECT id FROM case_interventions WHERE status IN ('planned','started') ORDER BY id LIMIT 1`).get() as any;
      if (pa) c.prepare(`UPDATE case_interventions SET action_due = '2026-10-04', followup_due = '2026-10-04' WHERE id = ?`).run(pa.id);
      const xong = c.prepare(`SELECT id FROM sos_cases WHERE status = 'done' ORDER BY id LIMIT 1`).get() as any;
      if (xong) c.prepare('UPDATE sos_cases SET disposition = NULL, disposition_note = NULL WHERE id = ?').run(xong.id);
    } finally { c.close(); }
    const truoc = chup(f);
    const a = migrateTurso(f);
    const sau = chup(f);
    const l = lech(truoc, sau);
    assert(!l.length, `migrate đổi dữ liệu do mã hiện hành ghi (applied ${JSON.stringify(a).slice(0, 300)}): ${l.slice(0, 4).join(' ‖ ')}`);
    assert(a.length === 0, `migrate còn việc trên DB mới: ${JSON.stringify(a)}`);
  });
  check('DEPLOY-2c · schema.sql = migrate, TOÀN BỘ: DB dựng từ schema.sql (init) → migrate → mọi bảng, cột (PRAGMA table_info), chỉ mục, trigger không đổi', () => {
    const f = dbInit();
    const lay = (x: Record<string, string>) => Object.fromEntries(Object.entries(x).filter(([k]) => k === 'master' || k.startsWith('cot:')));
    const truoc = lay(chup(f));
    migrateTurso(f);
    const l = lech(truoc, lay(chup(f)));
    assert(!l.length, `cấu trúc đổi: ${l.slice(0, 3).join(' ‖ ')}`);
  });
  check('DEPLOY-2d · DB dựng bằng initBanChinh có ba cột Pb2-b (nhap_dau_ngay, han_xu_ly, phan_hoi_ngay) + hai cột lớp gốc Case + trigger trg_sos_cases_goc', () => {
    const c = new Database(dbInit(), { readonly: true });
    try {
      const co = (b: string, cot: string) => (c.prepare(`PRAGMA table_info(${b})`).all() as any[]).some((x) => x.name === cot);
      for (const [b, cot] of [['assessment_scores', 'nhap_dau_ngay'], ['violations', 'han_xu_ly'], ['violations', 'phan_hoi_ngay'], ['sos_cases', 'goc_class_id'], ['sos_cases', 'goc_programme_code']]) {
        assert(co(b, cot), `thiếu ${b}.${cot}`);
      }
      assert(c.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_sos_cases_goc'").get(), 'thiếu trigger');
    } finally { c.close(); }
  });
  check('DEPLOY-2e · DB cũ (không có dấu khoi_tao_moi_at) vẫn chạy bước chuyển dữ liệu cũ: PA đang chạy hạn Chủ nhật được dời Thứ Hai (migratePrN1)', () => {
    const f = dbInit((c) => {
      c.prepare("DELETE FROM demo_config WHERE key = 'khoi_tao_moi_at'").run();
      const st = Number(c.prepare(`INSERT INTO students (student_code, full_name, normalized_name, status, created_at) VALUES ('PISA-900002', 'Em DB cũ', 'em db cu', 'active', '2026-09-01')`).run().lastInsertRowid);
      const cs = Number(c.prepare(`INSERT INTO sos_cases (student_id, topic, category, origin_kind, status, created_at) VALUES (?, 'listening', 'listening', 'teacher_report', 'in_progress', '2026-09-01')`).run(st).lastInsertRowid);
      c.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, action_due, created_at) VALUES (?, 'teaching_adjust', 'PA cũ', 'started', '2026-10-04', '2026-09-01')`).run(cs);
    });
    migrateTurso(f);
    const c = new Database(f, { readonly: true });
    try {
      const r = c.prepare(`SELECT action_due FROM case_interventions WHERE description = 'PA cũ'`).get() as any;
      assert(r.action_due === '2026-10-05', `DB cũ phải dời hạn Chủ nhật: ${r.action_due}`);
    } finally { c.close(); }
  });

  check('DEPLOY-2f · migrate KHÔNG cấp lại quyền Quản trị đã gỡ khỏi vai (chỉ cấp quyền VỪA thêm); ngày thi dự kiến (exam_date, T9) còn nguyên sau migrate', () => {
    let vaiQuyen: any = null;
    const f = dbInit((c) => {
      vaiQuyen = c.prepare(`SELECT rp.role_id, rp.permission_id FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.key = 'manager' ORDER BY rp.permission_id LIMIT 1`).get();
      c.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(vaiQuyen.role_id, vaiQuyen.permission_id);
      const st = Number(c.prepare(`INSERT INTO students (student_code, full_name, normalized_name, status, created_at) VALUES ('PISA-900003', 'Em có ngày thi', 'em co ngay thi', 'active', '2026-09-01')`).run().lastInsertRowid);
      c.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, exam_date, created_at) VALUES (?, 1, 'LT1', '2026-09-01', 'active', '2026-12-12', '2026-09-01')`).run(st);
    });
    const a = migrateTurso(f);
    const c = new Database(f, { readonly: true });
    try {
      assert(!c.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(vaiQuyen.role_id, vaiQuyen.permission_id), `migrate cấp lại quyền đã gỡ: ${JSON.stringify(a)}`);
      const r = c.prepare(`SELECT exam_date FROM learning_cycles WHERE student_id = (SELECT id FROM students WHERE student_code = 'PISA-900003')`).get() as any;
      assert(r?.exam_date === '2026-12-12', `migrate xoá ngày thi dự kiến: ${JSON.stringify(r)} · ${JSON.stringify(a)}`);
    } finally { c.close(); }
  });

  // ------------------------------------------------------------------ Task 3a · cron chot-vang trên DB mới từ init
  console.log('\nPR-DEPLOY · (3) Chốt an toàn: cron chot-vang trên DB mới');
  check('DEPLOY-3a · chotVangDinhKy trên DB mới từ init (chưa lớp, chưa lệnh) → daChot 0, daChuyen 0, boQua null, không ném', () => {
    const f = dbInit();
    const js = pathToFileURL(pathMod.join(REPO, 'dist-server/server/src/ops/chotVangDinhKy.js')).href;
    const r = cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(js)}); const k = await m.chotVangDinhKy({ ngay: '2026-10-05' }); console.log('@@' + JSON.stringify(k));`], {
      env: { ...process.env, TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: 'x', BAN_CHINH: '1', PISA_DB: '' }, encoding: 'utf8', timeout: 120_000,
    });
    assert(r.status === 0, `cron lỗi: ${String(r.stderr).slice(-400)}`);
    const k = JSON.parse(String(r.stdout).split('@@').pop()!.trim());
    assert(k.daChot === 0 && k.daChuyen === 0 && k.boQua === null, JSON.stringify(k));
  });

  // ------------------------------------------------------------------ Task 4 · kiem-sau-init (chỉ đọc)
  console.log('\nPR-DEPLOY · (4) npm run kiem-sau-init — chỉ đọc');
  const kiemJs = pathMod.join(REPO, 'dist-server/server/src/ops/kiemSauInit.js');
  const chayKiem = (f: string) => cp.spawnSync(process.execPath, [kiemJs], {
    env: { ...process.env, TURSO_DATABASE_URL: urlFile(f), TURSO_AUTH_TOKEN: 'tok-bi-mat-khong-in', BAN_CHINH: '', PISA_DB: '' }, encoding: 'utf8', timeout: 120_000,
  });
  const { hashPassword } = await import('../platform/accounts.ts');
  const bam = (f: string) => (cp.spawnSync('sha256sum', [f], { encoding: 'utf8' }).stdout || fs.readFileSync(f).toString('base64')).split(' ')[0];
  check('DEPLOY-4a · DB vừa init → mã 0, "Đạt.", đủ chi nhánh (có dấu), không in token; file DB giữ nguyên từng byte (chỉ đọc)', () => {
    const f = dbInit();
    const truoc = bam(f);
    const r = chayKiem(f);
    const ra = String(r.stdout) + String(r.stderr);
    assert(r.status === 0 && /\[kiem-sau-init\] Đạt\./.test(ra), `mã ${r.status}: ${ra.slice(-500)}`);
    assert(/MB · Monbay/.test(ra) && /BC · Bãi Cháy/.test(ra), 'thiếu chi nhánh');
    assert(!ra.includes('tok-bi-mat-khong-in'), 'in token ra màn');
    assert(bam(f) === truoc, 'lệnh chỉ đọc đã đổi file DB');
  });
  check('DEPLOY-4b · DB init rồi một tài khoản mang mật khẩu demo pisa2026 → mã 1, "mật khẩu demo"; bảng ngoài nền có dòng khi chưa có học viên → CÓ VẤN ĐỀ', () => {
    const { hash, salt } = hashPassword('pisa2026');
    const f = dbInit((c) => c.prepare('UPDATE users SET password_hash = ?, password_salt = ?').run(hash, salt));
    const r = chayKiem(f);
    assert(r.status === 1 && /CÓ VẤN ĐỀ/.test(r.stdout) && /mật khẩu demo/.test(r.stdout), `mã ${r.status}: ${String(r.stdout).slice(-400)}`);
    const g = dbInit((c) => c.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (1, 'x', 'thông báo lạ', 'k', '2026-10-02')`).run());
    const r2 = chayKiem(g);
    assert(r2.status === 1 && /notifications=1/.test(r2.stdout), `bảng lạ: mã ${r2.status}: ${String(r2.stdout).slice(-400)}`);
  });

  // ------------------------------------------------------------------ Task 5b · xoa-kho-tep (kho giả)
  console.log('\nPR-DEPLOY · (5b) npm run xoa-kho-tep — kho giả');
  const { xoaSachKho, demTepKho } = await import('../ops/xoaKhoTep.ts');
  const khoGia = (khoa: string[]) => {
    const m = new Set(khoa);
    return { m, kho: { async list() { return { blobs: [...m].map((key) => ({ key })) }; }, async delete(k: string) { m.delete(k); } } };
  };
  await checkAsync('DEPLOY-5b · xoa-kho-tep: gõ lại sai tên / kho demo / kho cục bộ → từ chối, không xoá gì; đúng tên → xoá hết, kho còn 0', async () => {
    const ten = 'bang-chung-pisatracking-pizi147';
    const g = khoGia(['violation/a.pdf', 'sos_case/b.png', 'case_intervention/c.jpg']);
    for (const [o, mau] of [
      [{ ten, xacNhan: 'bang-chung-pisatracking' }, /không khớp/],
      [{ ten: 'bang-chung-pisatracking-demo-pizi147', xacNhan: 'bang-chung-pisatracking-demo-pizi147' }, /THỬ/],
      [{ ten: 'bang-chung-cuc-bo', xacNhan: 'bang-chung-cuc-bo' }, /cục bộ/],
    ] as const) {
      let loi: any = null;
      try { await xoaSachKho(g.kho, o); } catch (e) { loi = e; }
      assert(loi && mau.test(loi.message), `${o.ten}: ${loi?.message ?? 'không từ chối'}`);
      assert(g.m.size === 3, `${o.ten}: đã xoá tệp dù từ chối`);
    }
    const r = await xoaSachKho(g.kho, { ten, xacNhan: `  ${ten} ` });
    assert(r.daXoa === 3 && r.conLai === 0 && (await demTepKho(g.kho)) === 0, JSON.stringify(r));
    const d2 = khoGia(['x']);
    const r2 = await xoaSachKho(d2.kho, { ten: 'bang-chung-pisatracking-demo-x', xacNhan: 'bang-chung-pisatracking-demo-x', choPhepDemo: true });
    assert(r2.daXoa === 1, 'có cờ --cho-phep-demo thì xoá được kho demo');
  });
  check('DEPLOY-5b · package.json có xoa-kho-tep + kiem-sau-init; init-ban-chinh có cảnh báo kho tệp còn tệp', () => {
    const pkg = JSON.parse(fs.readFileSync(pathMod.join(REPO, 'package.json'), 'utf8'));
    assert(/ops\/xoaKhoTep\.js$/.test(pkg.scripts?.['xoa-kho-tep'] ?? '') && /ops\/kiemSauInit\.js$/.test(pkg.scripts?.['kiem-sau-init'] ?? ''), 'thiếu script');
    assert(/CẢNH BÁO: kho tệp/.test(fs.readFileSync(pathMod.join(REPO, 'server/src/ops/runInit.ts'), 'utf8')), 'runInit thiếu cảnh báo kho tệp');
  });

  // ------------------------------------------------------------------ Task 5 · DEP-5: D18 có PA GV thêm có kết quả; tài liệu khớp lệnh
  console.log('\nPR-DEPLOY · (5) DEP-5: D18 "PA hiệu quả" + tài liệu khớp lệnh / tên lớp mới');
  const pt: any = await import('../phanTich/giaoVien.ts');
  check('DEPLOY-5a · Phân tích › Giáo viên (QL Monbay, FT, 09/2026): Đỗ Thu Hương và Võ Mỹ Duyên có ô "PA hiệu quả" ≥ 1 (PA GV thêm có kết quả cuối W1–W3 SEP)', () => {
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', thang: '2026-09' });
    for (const ten of ['Đỗ Thu Hương', 'Võ Mỹ Duyên']) {
      const h = (b.hang as any[]).find((x) => x.ten === ten);
      assert(h && h.paHieuQua?.k === 'so' && h.paHieuQua.tong >= 1, `${ten}: ${JSON.stringify(h?.paHieuQua)}`);
    }
  });
  const docTep = (rel: string) => fs.readFileSync(pathMod.join(REPO, rel), 'utf8');
  check('DEPLOY-5b · mọi `npm run <x>` trong TRIEN_KHAI.md, README.md, DEMO.md có trong package.json (bắt lệnh đã xoá như kiem-sau-xoa)', () => {
    const lenh = new Set(Object.keys(JSON.parse(docTep('package.json')).scripts ?? {}));
    const thieu: string[] = [];
    for (const tep of ['TRIEN_KHAI.md', 'README.md', 'DEMO.md']) {
      for (const m of docTep(tep).matchAll(/npm run ([a-z0-9:-]+)/g)) if (!lenh.has(m[1])) thieu.push(`${tep}: ${m[1]}`);
    }
    assert(!thieu.length, `lệnh không có trong package.json: ${[...new Set(thieu)].join(', ')}`);
  });
  check('DEPLOY-5c · DEMO.md, README.md không còn tên lớp kiểu cũ "MB-FT 101" (gạch nối giữa chi nhánh và chương trình)', () => {
    const cu: string[] = [];
    for (const tep of ['DEMO.md', 'README.md']) for (const m of docTep(tep).matchAll(/\b[A-Z]{2}-(FT|FOU|BE|ELE|Pre)\b/g)) cu.push(`${tep}: ${m[0]}`);
    assert(!cu.length, `tên lớp cũ: ${[...new Set(cu)].join(', ')}`);
  });

  // ------------------------------------------------------------------ Task 8 · DEP-4: TRIEN_KHAI.md mục Reset bản chính
  check('DEPLOY-8a · TRIEN_KHAI.md có mục "Reset bản chính" đủ chữ khoá; đầu file và bảng §1 không còn PR-Z2a / PR-Z2c / Session Z2c', () => {
    const tk = docTep('TRIEN_KHAI.md');
    const i = tk.search(/^#+ .*Reset bản chính/m);
    assert(i >= 0, 'thiếu tiêu đề Reset bản chính');
    const sau = tk.slice(i);
    const muc = sau.slice(0, (sau.slice(1).search(/^## /m) + 1) || sau.length);
    const thieu = ['sao-luu', 'pisatracking', 'init-ban-chinh', 'CHI_NHANH', '--context production', 'netlify deploy --build', '--prod', 'Vào nhanh', '[chot-vang]', 'kiem-sau-init', 'xoa-kho-tep']
      .filter((k) => !muc.includes(k));
    assert(!thieu.length, `mục Reset bản chính thiếu: ${thieu.join(', ')}`);
    const dau = tk.slice(0, tk.search(/^## 2\b/m) > 0 ? tk.search(/^## 2\b/m) : 4000);
    const cu = ['PR-Z2a', 'PR-Z2c', 'Session Z2c'].filter((k) => dau.includes(k));
    assert(!cu.length, `đầu file / bảng §1 còn: ${cu.join(', ')}`);
  });

  try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch { /* lần sau dọn */ }
}
