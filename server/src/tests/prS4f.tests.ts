/** PHÉP KIỂM PR-S4F — sửa sau rà cuối đợt 4 (mỗi mục một phép kiểm tái hiện đúng tình huống rà; quyền: gọi API bằng vai sai → 403). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { duXacNhan } from './luotThu.ts';

export async function runPrS4fTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const { createApp } = await import('../app.ts');
  console.log('\nPR-S4F · Sửa sau rà cuối đợt 4');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];

  /** Máy chủ thật + phiên demo theo người dùng — phép kiểm quyền đi qua đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
        });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, {
        ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) },
      });
    };
    try { await fn(goi); } finally { may.close(); }
  }

  // ------------------------------------------------------------------ 1 · issue-board/o (và hai route anh em) phải là ATTEMPT_VIEW
  await checkAsync('S4F (1) · GV không dạy MB FOU 12 gọi issue-board/o · issue-board · needs-evaluation → 403; GV lớp → 200', async () => {
    const fou = classId('MB FOU 12');
    const gv = 10;
    assert(!get(`SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = 'active'`, gv, fou), 'dữ liệu demo: GV 10 không dạy MB FOU 12');
    await voiMayChu(async (goi) => {
      for (const url of [
        `/classes/${fou}/issue-board/o?category=reading&cot=hv`,
        `/classes/${fou}/issue-board/o?category=reading&cot=pa-dang&kind=tutor`,
        `/classes/${fou}/issue-board?category=reading`,
        `/classes/${fou}/issue-board/needs-evaluation?category=reading`,
      ]) {
        const r = await goi(gv, url);
        assert(r.status === 403, `${url}: ${r.status}`);
      }
      const ok = await goi(P.normalCoreTeacher.userId, `/classes/${fou}/issue-board/o?category=reading&cot=hv`);
      assert(ok.status === 200, `GVCN lớp: ${ok.status}`);
    });
  });

  // ------------------------------------------------------------------ 2 · GV Speaking chấm chéo: chỉ mở hai đường chấm
  await checkAsync('S4F (2) · GV Speaking chấm chéo MB FT 102: Case · roster · phân tích lớp · cần hỗ trợ · tệp Case → 403; lượt MT + bảng chấm → 200', async () => {
    const ft102 = classId('MB FT 102');
    const trang = P.sTeacher.userId;
    const pc = get(`SELECT id FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND skill = 'speaking' AND status = 'active'`, trang, ft102);
    assert(pc, 'dữ liệu demo: Trang dạy S ở MB FT 102');
    const caseId = get(`SELECT sc.id FROM sos_cases sc JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' WHERE e.class_id = ? LIMIT 1`, ft102)?.id;
    const luot = get(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' LIMIT 1`, ft102)?.id;
    assert(caseId && luot, `dữ liệu demo lớp 102: case ${caseId} · lượt ${luot}`);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id = ?`).run(pc.id);
    try {
      await voiMayChu(async (goi) => {
        for (const url of [
          `/cases/${caseId}`, `/classes/${ft102}/roster`, `/classes/${ft102}/phan-tich-lop`,
          `/classes/${ft102}/can-ho-tro`, `/attachments?ownerType=sos_case&ownerId=${caseId}`,
        ]) {
          const r = await goi(trang, url);
          assert(r.status === 403, `${url}: ${r.status}`);
        }
        for (const url of [`/attempts/${luot}`, `/classes/${ft102}/cham`]) {
          const r = await goi(trang, url);
          assert(r.status === 200, `${url}: ${r.status} ${await r.text()}`);
        }
      });
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id = ?`).run(pc.id);
    }
  });

  // ------------------------------------------------------------------ 3 · Lớp thường xoá điểm môn trượt
  await checkAsync('S4F (3) · Lớp thường: xoá điểm R trượt (API) → Case chỉ dựng trên điểm đó đóng, không mốc "đã đạt"; sửa lên đạt cũng không mốc; lượt sau đạt → có mốc (Case Progress Test tự tạo — PR-LT2a)', async () => {
    const fou = classId('MB FOU 12');
    const taoEm = (ten: string) => {
      intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s4f-${ten}` });
      regular.planRegularTests(P.admin, fou);
      const st = get('SELECT id FROM students WHERE full_name = ?', ten);
      const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, st.id);
      const luot = (kind: string) => get('SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = ?', st.id, kind)?.id;
      return { id: st.id as number, cycleId: cy?.id ?? null, pt: luot('progress') as number, ft: luot('final') as number };
    };
    const skills = regular.programmeOfClass(fou).skills as string[];
    const nhap = (aid: number, rTruot: boolean) => skills.forEach((k) =>
      regular.saveRegularScore(P.admin, aid, k, { score: k === 'reading' && rTruot ? 10 : 36, total: 40, lyDo: 'Phép kiểm S4F' }));
    /* PR-LT2a: Giữa khoá trượt R TỰ TẠO Case Reading (không còn "Tạo Case từ tín hiệu") — lấy đúng Case đó. */
    const moCaseR = (em: { id: number; cycleId: number | null }, _aid: number) =>
      get(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = 'reading' ORDER BY id DESC LIMIT 1`, em.id).id as number;
    const mocDat = (caseId: number) => all(`SELECT dedup_key FROM case_milestones WHERE case_id = ? AND kind = 'passed'`, caseId);

    /* Tình huống rà: xoá ô R trượt qua đúng route PUT → Case (chỉ căn cứ điểm đó) đóng, tín hiệu rút, KHÔNG mốc passed. */
    const a = taoEm('S4F Xoá R');
    nhap(a.pt, true);
    const caseA = moCaseR(a, a.pt);
    await voiMayChu(async (goi) => {
      const r = await goi(P.admin.userId, `/regular/attempts/${a.pt}/scores/reading`, {
        method: 'PUT', body: JSON.stringify({ score: null, total: null, lyDo: 'Nhập nhầm bài của em khác' }),
      });
      assert(r.status === 200, `PUT xoá điểm: ${r.status} ${await r.text()}`);
    });
    const sauA = get('SELECT status, sos_level FROM sos_cases WHERE id = ?', caseA);
    assert(sauA.status === 'done', `Case phải đóng khi điểm nguồn bị xoá: ${JSON.stringify(sauA)}`);
    assert(!mocDat(caseA).length, `không được ghi mốc "đã đạt": ${JSON.stringify(mocDat(caseA))}`);
    assert(get(`SELECT status FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`, a.pt).status === 'withdrawn', 'tín hiệu R chưa rút');

    /* Đối chứng mục 9.4: sửa R lên đạt trên CHÍNH lượt đó = sửa điểm, không phải tiến bộ → không mốc passed. */
    const b = taoEm('S4F Sửa R');
    nhap(b.pt, true);
    const caseB = moCaseR(b, b.pt);
    regular.saveRegularScore(P.admin, b.pt, 'reading', { score: 36, total: 40, lyDo: 'Cộng sót điểm' });
    assert(!mocDat(caseB).length, `sửa điểm không phải tiến bộ: ${JSON.stringify(mocDat(caseB))}`);

    /* Lượt SAU (Cuối khoá) đạt R → tiến bộ thật → có mốc passed, hạ mức. */
    const c = taoEm('S4F Tiến bộ R');
    nhap(c.pt, true);
    const caseC = moCaseR(c, c.pt);
    /* Case còn PA/căn cứ khác không quan trọng ở đây — lượt Cuối khoá khác lượt nguồn. */
    if (c.ft) {
      const mucTruoc = get('SELECT sos_level FROM sos_cases WHERE id = ?', caseC).sos_level;   // OV-12c: nhãn SOS theo số môn trượt của Progress Test
      nhap(c.ft, false);
      assert(mocDat(caseC).some((m: any) => m.dedup_key === `mt:${c.ft}:${caseC}:passed`), `lượt sau đạt phải có mốc: ${JSON.stringify(mocDat(caseC))}`);
      assert(mucTruoc >= 1 && get('SELECT sos_level FROM sos_cases WHERE id = ?', caseC).sos_level === mucTruoc, 'Case Progress Test: nhãn SOS của Progress Test — lượt sau đạt không đổi mức');
    } else {
      assert(false, 'dữ liệu: em mới không có bài Final Test');
    }
  });

  // ------------------------------------------------------------------ 4 · badge "n HV quá hạn việc" = số dòng của bộ lọc qua-han
  const d = await import('../../../shared/domain/index.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const fs = await import('node:fs');
  const docWeb = (f: string) => fs.readFileSync(new URL(`../../../../web/src/${f}`, import.meta.url), 'utf8');
  check('S4F (4) · soEmQuaHan của mỗi lớp = số em có cờ qua-han (cùng viecHocVienTheoLop); hai badge trỏ view=qua-han&classId=', () => {
    let coSo = 0;
    for (const p of [P.coreTeacher, P.mbManager, P.admin]) {
      const r = hvl.danhSachHocVienLop(p, { phamVi: 'tat-ca' });
      for (const lop of r.rows) {
        /* Màn hình lọc bằng Set id (StudentsPage `idsTheoLop`) — đếm em, không đếm bản ghi. */
        const dong = new Set(r.hocVien.filter((h: any) => h.classId === lop.id && h.loc.includes('qua-han')).map((h: any) => h.id)).size;
        assert(lop.soEmQuaHan === dong, `${lop.code}: badge ${lop.soEmQuaHan} ≠ ${dong} dòng`);
        if (dong) coSo += 1;
        assert(r.hocVien.every((h: any) => !h.loc.includes('qua-han') || h.loc.includes('can-lam')), `${lop.code}: qua-han phải ⊂ can-lam`);
      }
    }
    assert(coSo > 0, 'dữ liệu demo: phải có lớp có em quá hạn việc');
    assert(d.docThamSoLoc('qua-han').hasOwnProperty('loc') && (d.docThamSoLoc('qua-han') as any).loc === 'qua-han', 'view=qua-han');
    assert(!d.chipHienLoc('qua-han', 'tat-ca') && d.chipHienLoc('qua-han', 'qua-han') && d.chipHienLoc('can-lam', null), 'chip qua-han chỉ hiện khi đang lọc');
    assert(docWeb('modules/students/StudentsPage.tsx').includes("x.key === 'qua-han' ? `/hoc-vien?view=qua-han&classId=${lop.id}`"), 'badge hộp lớp');
    assert(docWeb('modules/classes/DauTrangLop.tsx').includes("x.key === 'qua-han' ? () => navigate(`/hoc-vien?view=qua-han&classId=${data.id}`)"), 'badge đầu hồ sơ lớp');
  });

  // ------------------------------------------------------------------ 5 · Cần hỗ trợ "Chỉ kỹ năng tôi dạy" + badge chờ duyệt lọc đúng lớp
  const canHoTro: any = await import('../classes/canHoTro.ts');
  check('S4F (5) · Cần hỗ trợ bật "Chỉ kỹ năng tôi dạy": em không Case kỹ năng đó bị bỏ; dòng tổng + cột trái đếm SAU lọc', () => {
    const cs = (id: number, topic: string | null, quaHan = false) => ({ id, topic, quaHan, trangThai: { k: 'x' }, pas: [] });
    const r0 = d.locCanHoTro({ ct: 'FT', chiKyNang: ['speaking'], em: [
      { ten: 'An', cases: [cs(1, 'listening', true), cs(2, 'reading')] },
      { ten: 'Bình', cases: [cs(3, 'speaking'), cs(4, 'listening', true)] },
    ] });
    assert(r0.em.length === 1 && r0.em[0].ten === 'Bình' && r0.em[0].cases.map((c: any) => c.id).join() === '3', JSON.stringify(r0.em.map((e: any) => [e.ten, e.cases.map((c: any) => c.id)])));
    assert(r0.tong.soEm === 1 && r0.tong.soCase === 1 && r0.tong.quaHan === 0, `tổng sau lọc: ${JSON.stringify(r0.tong)}`);
    assert(!r0.em[0].hang.some((h: any) => h.kind === 'hang' && !h.cases.length && h.khoa === 'speaking'), 'khối S rỗng');
    /* Dữ liệu thật: GVBM 9 ở MB FT 101 — mọi em còn lại có ≥ 1 Case hiện, tổng = máy chủ khi tắt công tắc. */
    const gv = P.sTeacher;
    const r = canHoTro.canHoTroLop(gv, classId('MB FT 101'));
    const tat = d.locCanHoTro({ ct: r.ct, em: r.em, chiKyNang: null });
    assert(tat.tong.soEm === r.tong.soEm && tat.tong.soCase === r.tong.soCase && tat.tong.quaHan === r.tong.quaHan && tat.tong.choDuyet === r.tong.choDuyet,
      `tắt công tắc phải khớp máy chủ: ${JSON.stringify([tat.tong, r.tong])}`);
    const bat = d.locCanHoTro({ ct: r.ct, em: r.em, chiKyNang: r.kyNangToi });
    assert(bat.em.every((e: any) => e.cases.length > 0 && e.cases.every((c: any) => c.topic === null || r.kyNangToi.includes(c.topic)
      || (c.topic === 'writing' && r.kyNangToi.some((k: string) => k.startsWith('writing'))))), 'còn em/Case ngoài kỹ năng');
    assert(bat.tong.soCase === bat.em.reduce((n: number, e: any) => n + e.cases.length, 0), 'soCase');
  });
  await checkAsync('S4F (5) · badge "n chờ duyệt" của lớp: /yeu-cau?hop=cho-duyet&lop= ra đúng n thẻ; GV gọi hộp → 403', async () => {
    const r = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'tat-ca' });
    const coThe = r.rows.filter((l: any) => l.soChoDuyet > 0);
    assert(coThe.length > 0, 'dữ liệu demo: phải có lớp có thẻ chờ duyệt');
    await voiMayChu(async (goi) => {
      for (const lop of coThe) {
        const h = await (await goi(P.mbManager.userId, `/yeu-cau?hop=cho-duyet&lop=${lop.id}`)).json() as any;
        assert(h.the.length === lop.soChoDuyet && h.lopDangLoc?.id === lop.id, `${lop.code}: badge ${lop.soChoDuyet} ≠ hộp ${h.the.length}`);
      }
      const gv = await goi(P.coreTeacher.userId, `/yeu-cau?hop=cho-duyet&lop=${coThe[0].id}`);
      assert(gv.status === 403, `GV mở hộp chờ duyệt: ${gv.status}`);
    });
    for (const f of ['modules/students/StudentsPage.tsx', 'modules/classes/DauTrangLop.tsx']) {
      assert(/cho-duyet\?lop=\$\{/.test(docWeb(f)), `${f}: badge chờ duyệt phải kèm ?lop=`);
    }
  });

  // ------------------------------------------------------------------ 9–14 · dữ liệu nhập, chữ, hình
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const standing: any = await import('../students/standing.ts');
  const xm: any = await import('../phanTich/xuatMt.ts');
  const { boLichTuTao, luotThu, nhanXetCaseThu } = await import('./luotThu.ts');
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const FT = classId('MB FT 101');
  const emFt = (ten: string) => {
    intake.commitIntake(P.admin, { classId: FT, rows: [{ fullName: `S4F ${ten}`, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s4f-ft-${ten}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `S4F ${ten}`);
    const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, st.id);
    boLichTuTao(conn, cy.id);
    const a = luotThu(conn, attemptsSvc.createAttempt, P.admin, { chot: true, studentId: st.id, cycleId: cy.id, classId: FT, no: 1, periodId: weekSvc.ensurePeriod(weekSvc.mondayOf(t.TODAY)).id });
    return { sid: st.id as number, aid: a.id as number };
  };
  const nhapBand = (aid: number, skill: string, band: number) => attemptsSvc.saveScore(P.admin, aid, skill, {
    ...(skill === 'listening' ? { rawScore: scoring.LISTENING_BY_RAW.indexOf(band) } : skill === 'reading' ? { rawScore: scoring.READING_BY_RAW.indexOf(band) }
      : { criteria: [band, band, band, band] }), lyDo: 'Phép kiểm S4F' });

  await checkAsync('S4F (9) · Xác nhận PA quy chế: body thiếu description (API) → 400, không lấy mô tả máy gán; gửi mô tả → 200', async () => {
    const e = emFt('Xác nhận PA');
    for (const k of ['listening', 'reading', 'speaking']) nhapBand(e.aid, k, 5);
    const c = get(`SELECT id FROM sos_cases WHERE student_id = ? AND category = 'listening'`, e.sid);
    assert(c, 'chưa có Case L tự tạo');
    nhanXetCaseThu(conn, attemptsSvc.saveScore, P.admin, c.id, { primaryCode: d.issuesForTopic('listening', null)[0].code, urgency: 'attention', moTa: 'Em nghe sót số và tên riêng ở Part 1–2.' });
    const iv = get('SELECT id FROM case_interventions WHERE case_id = ? AND preset = 1', c.id);
    await voiMayChu(async (goi) => {
      for (const body of [{}, { description: '' }, { description: '   ' }, { description: null }]) {
        const r = await goi(P.admin.userId, `/interventions/${iv.id}/xac-nhan-pa`, { method: 'POST', body: JSON.stringify(body) });
        assert(r.status === 400, `${JSON.stringify(body)}: ${r.status}`);
      }
      assert(get('SELECT confirmed_at FROM case_interventions WHERE id = ?', iv.id).confirmed_at === null, 'PA không được xác nhận khi thiếu mô tả');
      const ok = await goi(P.admin.userId, `/interventions/${iv.id}/xac-nhan-pa`, { method: 'POST', body: JSON.stringify(duXacNhan(conn, iv.id, { description: 'Tutor Listening hai buổi mỗi tuần, cô Hà chữa bài nghe.' })) });
      assert(ok.status === 200, `có mô tả: ${ok.status}`);
    });
  });

  check('S4F (10) · gvCham false/0/"" → 400 (xoá phải null); tiêu chí "abc" / 6.3 / 9.5 → 400, 6.5 → lưu; web: khoá nhớ GV chấm có userId, ô điểm cùng chiều cao, chip "Dưới kỳ vọng: …"', () => {
    const e = emFt('HSM nhập');
    for (const g of [false, 0, '', 'Trang', [1]]) {
      assert(maLoi(() => attemptsSvc.saveScore(P.admin, e.aid, 'speaking', { gvCham: g }, t.TODAY)) === 400, `gvCham ${JSON.stringify(g)}`);
    }
    for (const c of [['abc', 6, 6, 6], [6.3, 6, 6, 6], [9.5, 6, 6, 6], [-0.5, 6, 6, 6]]) {
      assert(maLoi(() => attemptsSvc.saveScore(P.admin, e.aid, 'speaking', { criteria: c }, t.TODAY)) === 400, `tiêu chí ${JSON.stringify(c)}`);
    }
    assert(get(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.aid)?.band == null, 'không được lưu band từ tiêu chí hỏng');
    attemptsSvc.saveScore(P.admin, e.aid, 'speaking', { criteria: [6.5, 6, 6, 7], gvCham: { performerSelf: true } }, t.TODAY);
    assert(get(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.aid).band === 6.5, 'tiêu chí hợp lệ phải lưu');
    attemptsSvc.saveScore(P.admin, e.aid, 'speaking', { gvCham: null }, t.TODAY);
    assert(get(`SELECT examiner_user_id u FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.aid).u === null, 'null = xoá GV chấm');
    const gc = docWeb('modules/cham/GvCham.tsx'), od = docWeb('modules/fasttrack/ODiemLon.tsx');
    assert(gc.includes('`pisa:gv-cham:${userId}:${classId}:${dot}`') && gc.includes('khoaGvChamCot(session?.user?.id'), 'khoá localStorage GV chấm phải gắn userId');
    assert(od.includes('const vo = `flex min-w-0 flex-col') && od.includes('col-span-2 flex min-w-0 flex-col'), 'ô nút và ô chỉ đọc/Overall cùng flex-col');
    assert(od.includes("title: t('GV chấm: {ten}', { ten: bai[0].gvCham.ten })") && od.includes('duoiKyVong='), 'title GV chấm + chip Dưới kỳ vọng');
    assert(docWeb('ui/KetQuaDot.tsx').includes("t('Dưới kỳ vọng: {ds}', { ds: duoiKyVong.join"), 'KetQuaDot liệt kê kỹ năng dưới kỳ vọng');
    assert(docWeb('modules/fasttrack/MockDetailPage.tsx').includes("t('Người nhập điểm: {enteredByName}', { enteredByName: c.enteredByName })"), '"Người nhập điểm: X"');
  });

  check('S4F (11) · Kết quả gần nhất bỏ lượt chỉ có W1 lẻ; web: tên có title + ưu tiên chỗ, dòng Kết quả chỉ xuống dòng ở "·", nhãn thẻ theo baseline, Tỷ lệ tabular', () => {
    const e = emFt('W1 lẻ');
    nhapBand(e.aid, 'writing1', 6);
    const s = standing.standingFor([e.sid]).get(e.sid);
    assert(s.attemptId === null, `lượt chỉ có W1 không phải kết quả gần nhất: ${JSON.stringify({ a: s.attemptId, sc: s.scored })}`);
    nhapBand(e.aid, 'listening', 6);
    assert(standing.standingFor([e.sid]).get(e.sid).attemptId === e.aid, 'đủ một kỹ năng (L) thì là kết quả gần nhất');
    const b = docWeb('modules/students/BangHocVienLop.tsx');
    assert(b.includes('link max-w-full truncate font-semibold" title={s.fullName}') && b.includes('flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5'), 'tên: title + badge xuống dòng');
    assert(b.includes('<DongCham chu={k.dong1}')   /* UXF-b: thêm lienKet (link tên lượt) */ && b.slice(b.indexOf('function DongCham')).includes('whitespace-nowrap'), 'DongCham');
    assert(docWeb('ui/TheDong.tsx').includes('grid-cols-[5.5rem_minmax(0,1fr)] items-baseline'), 'TheDong items-baseline');
    assert(docWeb('modules/classes/ClassIssueBoard.tsx').includes('td text-right tabular-nums"><TyLe'), 'Tỷ lệ tabular-nums');
    assert(docWeb('modules/classes/BangCanHoTro.tsx').includes('Case chờ Quản lý duyệt'), '"n Case chờ Quản lý duyệt"');
  });

  check('S4F (12) · Xuất: sheet "Pre FOU · …"; dòng xếp theo TÊN rồi họ; vượt trần cỡ → 400 "Thu hẹp phạm vi"; xem trước không cắt chữ', () => {
    assert(d.tenSheetThuong('PREFOU') === 'Pre FOU · Progress–Final Test' && d.tenSheetThuong('FOU') === 'FOU · Progress–Final Test', d.tenSheetThuong('PREFOU'));
    const ds = ['Vũ Thị An', 'Nguyễn Văn Bình', 'Trần Minh An', 'Đỗ Hà'].sort(d.soTenVi);
    assert(ds.join('|') === 'Trần Minh An|Vũ Thị An|Nguyễn Văn Bình|Đỗ Hà', ds.join('|'));
    const f = d.docBoLocXuatMt({ tg: 'dot', dot: 'mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8', lop: String(FT), cot: 'day-du' });
    assert(typeof f !== 'string', String(f));
    const r = xm.duLieuXuatMt(P.mbManager, f);
    const ten = r.sheets[0].aoa.slice(1).map((h: any[]) => String(h[1]));
    assert(ten.length > 3, `ít dòng: ${ten.length}`);
    for (let i = 1; i < ten.length; i++) assert(d.soTenVi(ten[i - 1], ten[i]) <= 0, `sai thứ tự: ${ten[i - 1]} → ${ten[i]}`);
    assert(maLoi(() => xm.xuatExcel(P.mbManager, f, 1000)) === 400, 'vượt trần cỡ phải 400');
    let cau = ''; try { xm.xuatExcel(P.mbManager, f, 1000); } catch (e: any) { cau = e.message; }
    assert(/Thu hẹp phạm vi/.test(cau) && /cột Gọn/.test(cau), cau);
    assert(xm.xuatExcel(P.mbManager, f).sheets.length >= 2, 'dưới trần vẫn xuất');
    assert(docWeb('modules/test/NganXuatMt.tsx').includes('break-words text-[12.5px]'), 'dòng xem trước xuống dòng');
  });

  check('S4F (13) · web/src không dùng biến CSS không tồn tại (--card, --surface-1, --soon-bg…); mũi tên hàng lớn là SVG; việc tiếp không lấn lề ô', () => {
    const goc = new URL('../../../../web/src/', import.meta.url);
    const tep: { ten: string; s: string }[] = [];
    const duyet = (dir: URL) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
        if (e.isDirectory()) duyet(u);
        else if (/\.(tsx?|css)$/.test(e.name)) tep.push({ ten: e.name, s: fs.readFileSync(u, 'utf8') });
      }
    };
    duyet(goc);
    const co = new Set<string>();
    for (const { s } of tep) for (const m of s.matchAll(/['"]?(--[\w-]+)['"]?\s*:/g)) co.add(m[1]);
    const hong = new Set<string>();
    for (const { ten, s } of tep) for (const m of s.matchAll(/var\((--[\w-]+)\)/g)) if (!co.has(m[1])) hong.add(`${ten}: ${m[1]}`);
    assert(hong.size === 0, [...hong].join(' · '));
    const hn = docWeb('ui/HangNhom.tsx');
    const mt = hn.slice(hn.indexOf('export function MuiTenMo'), hn.indexOf('function boQuaNutCon'));
    assert(mt.includes('<svg') && !/[▸▾]/.test(mt.replace(/\/\*[\s\S]*?\*\//g, '')), 'MuiTenMo phải vẽ SVG');
    const vt = docWeb('ui/ViecTiep.tsx');
    assert(vt.includes('block max-w-full') && vt.includes('<span className="break-words">') && vt.includes("<QuaHan ngay={v.quaHanNgay} /></span>{' '}"), 'ViecTiep: chữ việc chạy liền không cắt, quá hạn luôn đủ một cụm (dấu cách thường sau cụm hạn, không &nbsp;: rà #235)');   // PR-DH 04/10 J8 line-clamp-2 → PR-KHUNG G3 không cắt
  });
}
