/**
 * LOP-CU (chủ SP 11/11) — điểm của lượt thuộc LỚP CŨ / KHOÁ CŨ:
 *   A) lớp tự kết thúc khi em cuối chuyển đi: lượt đã tới tuần thi TRƯỚC khi lớp kết thúc mà còn ô trống vẫn là việc của GV lớp lúc thi
 *      (Công việc, Nợ điểm, Lịch Test, sổ nghĩa vụ) tới khi nhập xong; lượt xếp SAU ngày kết thúc thì không.
 *   B) em lên khoá lớp thường mới: Final / Progress khoá cũ đã tới tuần thi TRƯỚC khi khoá mới bắt đầu vẫn ở việc + lưới lớp cũ.
 *   C) Hành trình: GV / GVCN lớp em ĐANG học mở được hồ sơ lượt lớp cũ — CHỈ XEM (nhập / sửa vẫn theo lớp của lượt).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopCuTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  console.log('\nLOP-CU · việc nhập điểm + xem lượt của lớp / khoá cũ');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const conOCho: any = await import('../fasttrack/conOCho.ts');
  const perms: any = await import('../permissions.ts');
  const myWork: any = await import('../worklist/mywork.ts');
  const scoreDebt: any = await import('../worklist/scoreDebt.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const so: any = await import('../phanTich/soNghiaVu.ts');
  const dtl: any = await import('../cham/diemTheoLuot.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const FT101 = t.classId('MB FT 101');
  const ctFt = get('SELECT programme_code FROM classes WHERE id = ?', FT101).programme_code as string;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  const now = new Date().toISOString();
  const M = thu2(2);   // ngày lớp cũ kết thúc / khoá mới bắt đầu (thứ Hai tuần trước)

  const taoLop = (code: string, start: string) => intake.createClass(P.admin, { code, branchId: MB, kind: 'BE', isFastTrack: false, startDate: start, startPeriodId: week.ensurePeriod(start).id });
  const L1 = taoLop('MB LOPCU-1', thu2(10));   // A) sẽ kết thúc
  const L3 = taoLop('MB LOPCU-3', thu2(10));   // B) còn học (F ở lại)
  const L2 = taoLop('MB LOPCU-2', M);          // B) khoá mới của B, E
  const taoEm = (x: string, lop: number) => {
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-LOPCU-${x}`, `Học viên LOPCU ${x}`, `hoc vien lopcu ${x.toLowerCase()}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, thu2(10), now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'BE', 6, ?, 'active', ?)`).run(sid, thu2(10), now);
    return sid;
  };
  const [A, D] = ['A', 'D'].map((x) => taoEm(x, L1.id));
  const [B, E, F] = ['B', 'E', 'F'].map((x) => taoEm(x, L3.id));
  regular.planRegularTests(P.admin, L1.id);
  regular.planRegularTests(P.admin, L3.id);
  loTrinh.ghiLoTrinhTiep(QL, A, { huong: 'fast_track' });   // MT0 của A ở lớp L1
  const luot = (sid: number, kind: string) => get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = ? AND status != 'cancelled'`, sid, kind).id as number;
  const [fA, fD, fB, fE, fF, m0A] = [luot(A, 'final'), luot(D, 'final'), luot(B, 'final'), luot(E, 'final'), luot(F, 'final'), luot(A, 'mt0')];
  const datTuan = (aid: number, thu: string) => {
    const pid = week.ensurePeriod(thu).id;
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(pid, aid);
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(pid, aid);
    conOCho.capNhatConOCho([aid]);
  };
  /* Thi TRƯỚC ngày M (2 tuần trước, đã quá hạn nhập) — còn nợ. D, E: thi SAU ngày M (tuần này) — lớp / khoá đã sang trang, không nợ. */
  for (const aid of [fA, fB, fF, m0A]) datTuan(aid, thu2(3));
  for (const aid of [fD, fE]) datTuan(aid, thu2(1));

  /* GV lớp lúc thi: một GV giữ mọi môn + chủ nhiệm L1, L3. GV lớp mới của B, E (L2): GV khác, không dạy L1 / L3 / FT 101. */
  const gv1Id = P.w1Teacher.userId as number;
  const gv2Id = get(`SELECT DISTINCT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
     WHERE c.branch_id = ? AND ta.status = 'active' AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) AND ta.user_id != ? ORDER BY ta.user_id LIMIT 1`,
  MB, FT101, gv1Id).id as number;
  const pc = (u: number, lop: number) => {
    for (const k of ['listening', 'reading', 'writing', 'speaking', null]) {
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?,'active',?)`).run(u, lop, k, k === null ? 1 : 0, thu2(12), now);
    }
  };
  pc(gv1Id, L1.id); pc(gv1Id, L3.id); pc(gv2Id, L2.id);

  /* Chuyển đi (ngày M): A, D sang FT 101 (lộ trình FT); B, E lên khoá lớp thường mới L2; F ở lại L3. L1 hết em → kết thúc ngày M. */
  const chuyen = (sid: number, toClass: number, route: string | null, ct: string) => {
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(M, sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, toClass, M, now);
    conn.prepare(`UPDATE learning_cycles SET status = 'ended', ended_at = ? WHERE student_id = ? AND seq = 1`).run(M, sid);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 2, ?, ?, 6, ?, 'active', ?)`).run(sid, route, ct, M, now);
  };
  chuyen(A, FT101, 'LT1', ctFt); chuyen(D, FT101, 'LT1', ctFt);
  chuyen(B, L2.id, null, 'BE'); chuyen(E, L2.id, null, 'BE');
  conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(M, L1.id);

  const gv1 = perms.loadPrincipal(gv1Id), gv2 = perms.loadPrincipal(gv2Id);
  const lr = perms.loadPrincipal(P.lrTeacher.userId), gvcnFt = perms.loadPrincipal(P.coreTeacher.userId);
  const no = (p: any, lop: number) => new Set(scoreDebt.scoreDebtCells(p, TODAY, null, [lop]).map((c: any) => c.attemptId));
  const noCuaGv = (lop: number) => new Set(scoreDebt.scoreDebtCells(QL, TODAY, null, [lop]).filter((c: any) => c.userId === gv1Id).map((c: any) => c.attemptId));
  /* Em có trong việc Nhập điểm (dòng một em: `studentId`; dòng nhiều em: `emIds`). */
  const viec = (p: any, kind?: string) => new Set((myWork.myWork(p, {}).items ?? []).filter((i: any) => i.group === 'score' && (!kind || i.kind === kind)).flatMap((i: any) => [i.studentId, ...(i.emIds ?? [])]));
  const lichTest = (p: any, lop: number) => {
    const r = canCham.noQuaHan(p, { classIds: new Set([lop]), lopCuaToi: new Set([lop]) });
    return new Set([...r.dong.flatMap((d: any) => d.attemptIds), ...r.hanRieng.map((h: any) => h.attemptId)]);
  };

  check('LOP-CU-A1 · lớp kết thúc (em cuối chuyển đi): Final + MT0 thi trước ngày kết thúc còn trống vẫn là nợ / việc / Lịch Test của GV lớp lúc thi', () => {
    assert(get('SELECT status FROM classes WHERE id = ?', L1.id).status === 'finished', 'tiền đề: L1 đã kết thúc');
    const n = noCuaGv(L1.id);
    assert(n.has(fA) && n.has(m0A), `Nợ điểm L1 của GV: ${[...n]} (cần ${fA}, ${m0A})`);
    assert(viec(gv1, 'final').has(A), 'Công việc GV lớp lúc thi không có bài của A');
    assert(lichTest(gv1, L1.id).has(fA), `Lịch Test L1: ${[...lichTest(gv1, L1.id)]}`);
    /* Đường nhập: Lịch Test → Điểm theo lớp `thuong:final` của lớp đã kết thúc — GV đúng môn sửa được ô (RKC). */
    const r = dtl.bangTheoLuot(gv1, L1.id, 'thuong:final').thuong?.rows.find((x: any) => x.attemptId === fA);
    assert(r && r.skillSchedule.some((k: any) => k.canEdit), `Điểm theo lớp L1 (GV): ${JSON.stringify(r?.skillSchedule?.map((k: any) => [k.skill, k.canEdit]))}`);
    const dong = so.tinhBai(fA);
    assert(dong.length > 0 && dong.every((d: any) => d.khongTinh === null && d.nguoi === gv1Id && d.lop === L1.id), `sổ nghĩa vụ: ${JSON.stringify(dong)}`);
  });

  check('LOP-CU-A2 · lớp kết thúc: lượt xếp SAU ngày kết thúc (D) không kéo lại; GV lớp mới (FT 101) không nhận việc của lớp cũ', () => {
    assert(!no(QL, L1.id).has(fD), 'Final của D (thi sau khi lớp kết thúc) thành nợ');
    assert(!viec(gv1, 'final').has(D), 'Công việc có Final của D');   // Progress của D (thi trước ngày kết thúc) vẫn là việc — đúng luật
    assert(!viec(lr).has(A) && !viec(gvcnFt).has(A), 'GV lớp FT nhận việc lớp cũ');
  });

  check('LOP-CU-B1 · em lên khoá mới: Final khoá cũ thi trước khi khoá mới bắt đầu vẫn ở nợ / việc / Lịch Test / lưới lớp cũ', () => {
    const n = noCuaGv(L3.id);
    assert(n.has(fB) && n.has(fF), `Nợ điểm L3 của GV: ${[...n]} (cần ${fB}, ${fF})`);
    assert(viec(gv1, 'final').has(B), 'Công việc GV lớp cũ không có bài của B');
    assert(lichTest(gv1, L3.id).has(fB), `Lịch Test L3: ${[...lichTest(gv1, L3.id)]}`);
    const luoi = regular.regularSheet(QL, L3.id, 'final').rows.map((r: any) => r.attemptId);
    assert(luoi.includes(fB) && luoi.includes(fF), `lưới Final L3: ${luoi}`);
    assert(so.tinhBai(fB).every((d: any) => d.khongTinh === null && d.nguoi === gv1Id), `sổ nghĩa vụ B: ${JSON.stringify(so.tinhBai(fB))}`);
  });

  check('LOP-CU-B3 · "bài của khoá hiện tại" không lấy bài nợ khoá cũ: MT sắp tới ở hồ sơ, em chưa có bài ở Kế hoạch Test', () => {
    const hv = studentsSvc.listStudents(QL, { classId: L2.id }).rows.find((x: any) => x.id === B);
    const cu = new Set(conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id WHERE a.student_id = ? AND cy.seq = 1`).all(B).map((r: any) => r.id));
    assert(hv && !cu.has(hv.nextMock?.id), `MT sắp tới của B là bài khoá cũ: ${JSON.stringify(hv?.nextMock)}`);
    assert(regular.regularSheet(QL, L3.id, 'final').rows.some((r: any) => r.attemptId === fB), 'tiền đề: Final khoá cũ của B còn ở lưới L3');
  });

  check('LOP-CU-B2 · khoá cũ: lượt xếp SAU khi khoá mới bắt đầu (E) không kéo lại; GV khoá mới không nhận việc khoá cũ', () => {
    assert(!no(QL, L3.id).has(fE), 'Final của E thành nợ');
    assert(!regular.regularSheet(QL, L3.id, 'final').rows.some((r: any) => r.attemptId === fE), 'lưới L3 có Final của E');
    assert(!viec(gv2).has(B), 'GV khoá mới nhận việc khoá cũ');
  });

  check('LOP-CU-C1 · Hành trình: GV / GVCN lớp em đang học mở hồ sơ lượt lớp cũ — chỉ xem', () => {
    for (const [ten, p] of [['GVBM FT 101', lr], ['GVCN FT 101', gvcnFt]] as const) {
      const d = regular.regularAttemptDetail(p, fA);
      assert(d.dong?.attemptId === fA, `${ten}: lượt Final lớp cũ`);
      const mon = d.dong.skillSchedule ?? [];
      assert(mon.length > 0 && mon.every((s: any) => !s.canEdit && !s.nhanXetDuoc && !s.goDau) && !d.canCancel && !d.canPlan, `${ten}: Final sửa được ${JSON.stringify(mon)}`);
      const m = attempts.attemptDetail(p, m0A);
      assert(m.id === m0A && m.cells.every((c: any) => !c.canEdit), `${ten}: MT0 sửa được ${JSON.stringify(m.cells.map((c: any) => [c.skill, c.canEdit]))}`);
    }
    const dB = regular.regularAttemptDetail(gv2, fB);
    assert(dB.dong?.attemptId === fB, 'GV khoá mới: Final khoá cũ của B');
  });

  check('LOP-CU-C2 · quyền: nhập / sửa vẫn theo lớp của lượt; GV không dạy em hiện tại vẫn bị chặn', () => {
    assertThrows(() => regular.saveRegularScore(lr, fA, 'listening', { score: 5, total: 10 }), /quyền|phạm vi|không được|phân công/i, 'GV lớp FT nhập điểm Final lớp cũ');
    assertThrows(() => attempts.saveScore(lr, m0A, 'listening', { band: 5 }), /quyền|phạm vi|không được|phân công/i, 'GV lớp FT nhập điểm MT0 lớp cũ');
    assertThrows(() => regular.regularAttemptDetail(gv2, fA), /phạm vi|quyền/i, 'GV không dạy A xem Final của A');
    assertThrows(() => attempts.attemptDetail(gv2, m0A), /phạm vi|quyền/i, 'GV không dạy A xem MT0 của A');
    assertThrows(() => regular.regularAttemptDetail(lr, fB), /phạm vi|quyền/i, 'GV FT 101 xem Final của B (không dạy B)');
    /* Quản lý chỉ xem qua grant chi nhánh của lớp lượt — không có lối "đang dạy em" (không phân công). */
    assert(!perms.xemLuotQuaLopDangHoc(QL, A), 'Quản lý được mở qua "đang dạy em"');
  });

  check('LOP-CU-A3 · GV lớp lúc thi nhập xong (lớp đã kết thúc / khoá cũ) → hết nợ, hết việc', () => {
    const mon = regular.regularSheet(QL, L1.id, 'final').programme.skills as string[];
    for (const aid of [fA, fB]) for (const k of mon) regular.saveRegularScore(gv1, aid, k, { score: 8, total: 10 });
    assert(!noCuaGv(L1.id).has(fA) && !noCuaGv(L3.id).has(fB), 'còn nợ sau khi nhập đủ');
    const v = viec(gv1, 'final');
    assert(!v.has(A) && !v.has(B), 'còn việc sau khi nhập đủ');
    assert(so.tinhBai(fA).every((d: any) => d.xongLuc), `sổ chưa ghi xong: ${JSON.stringify(so.tinhBai(fA))}`);
  });
}
