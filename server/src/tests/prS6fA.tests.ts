/** PHÉP KIỂM PR-S6F-a — sửa sau rà đợt 6 lượt 1, phần máy chủ / dữ liệu (kế hoạch 2026-10-01-pr-s6f-sua-sau-ra-dot-6, Task 1–4, 10, 11). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrS6fATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  /** Chạy `fn` với ngày nghiệp vụ `ngay` (demo_date), trả lại ngày cũ sau đó. */
  const voiNgay = <T>(ngay: string, fn: () => T): T => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', ngay);
    try { return fn(); } finally { setConfig('demo_date', cu); }
  };
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const toi = path.dirname(fileURLToPath(import.meta.url));
  /* Chạy từ dist-server (npm run check) hoặc thẳng từ nguồn — tìm gốc repo theo package.json. */
  const REPO = ['../../..', '../../../..'].map((x) => path.resolve(toi, x)).find((x) => fs.existsSync(path.join(x, 'package.json')))!;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `S6FA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s6fa-${seq}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    /* Vào lớp từ đầu tháng 8: MT các tuần tháng 9 không bị coi là MT lịch sử (trước ngày vào lớp). */
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(st.id);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    return { sid: st.id as number, cy: cy?.id as number };
  };
  const o = (aid: number, skill: string) => get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);
  const MB = get(`SELECT branch_id FROM classes WHERE id = ?`, classId('MB FT 101')).branch_id as number;
  const tuanNay = week.mondayOf(TODAY);
  /** Dòng Chấm điểm của bảng GV (mọi GV) tại ngày `ngay`, khoảng một tuần `tuan`. */
  const dongCham = (ngay: string, tuan = tuanNay) => voiNgay(ngay, () => {
    const c = pt.nguCanhPtGv(P.mbManager, { ct: 'ft', tu: tuan, den: tuan });
    return pt.tapChamDiem(c, pt.napBai(P.mbManager, c)).dong as Map<number, any>;
  });

  // ------------------------------------------------------------------ khối 1 · P0 "lần nhập đầu" chỉ khi ô có điểm thật (Q18)
  console.log('\nPR-S6F-a · (1) Lần nhập đầu chỉ tính khi ô có điểm thật');
  /* Em mới MB FT 101, MT1 tuần W3 SEP; hạn Writing đặt đè 22/09 (Thứ Ba sau tuần thi). */
  const e1 = emMoi('MB FT 101');
  boLichTuTao(conn, e1.cy);
  const a1 = luotThu(conn, svc.createAttempt, P.admin, { studentId: e1.sid, cycleId: e1.cy, classId: classId('MB FT 101'), no: 1, periodId: week.ensurePeriod(tuanNay).id });
  conn.prepare(`UPDATE attempt_skills SET deadline_override = '2026-09-22' WHERE attempt_id = ? AND skill = 'writing'`).run(a1.id);

  check('S6F-a (1a) · W1 gõ 1/4 tiêu chí 20/09 → nhap_dau_ngay NULL; đủ 4 tiêu chí 28/09 → 28/09 → bảng GV tính TRỄ', () => {
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6, null, null, null] }, '2026-09-20');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === null, `một tiêu chí đã chốt ngày: ${o(a1.id, 'writing1').nhap_dau_ngay}`);
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6, 6, 6, 6] }, '2026-09-28');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === '2026-09-28', `đủ tiêu chí: ${o(a1.id, 'writing1').nhap_dau_ngay}`);
    const r = dongCham('2026-09-28').get(d.baiId(a1.id, 'writing1'));
    assert(r && !r.dung && r.nhapDau === '2026-09-28', `dòng Chấm điểm: ${JSON.stringify(r)}`);
  });
  check('S6F-a (1b) · bỏ bớt tiêu chí làm band về NULL → nhap_dau_ngay NULL; sửa điểm (band vẫn có) giữ ngày đầu', () => {
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6.5, 6, 6, 6], lyDo: 'Chấm lại tiêu chí 1' }, '2026-09-29');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === '2026-09-28', 'sửa sau phải giữ ngày đầu');
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6.5, 6, null, null], lyDo: 'Nhập nhầm hai tiêu chí cuối' }, '2026-09-29');
    assert(o(a1.id, 'writing1').band === null && o(a1.id, 'writing1').nhap_dau_ngay === null, JSON.stringify(o(a1.id, 'writing1')));
  });
  check('S6F-a (1c) · lớp thường (khoá lại): lưu điểm ngày D → D; xoá điểm → NULL', () => {
    const { sid } = emMoi('MB FOU 12');
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, sid);
    regular.saveRegularScore(P.admin, a.id, 'reading', { score: 20, total: 40 }, TODAY);
    assert(o(a.id, 'reading').nhap_dau_ngay === TODAY, 'lần đầu');
    regular.saveRegularScore(P.admin, a.id, 'reading', { score: null, total: null, lyDo: 'Nhập nhầm em' }, TODAY);
    assert(o(a.id, 'reading').nhap_dau_ngay === null, 'xoá điểm phải NULL');
  });
  check('S6F-a (1d) · HAI ĐƯỜNG: ô W2 1/4 tiêu chí quá hạn nằm trong CẢ scoreDebtCells(...).overdue VÀ tập "chưa nhập & trễ" của bảng GV', () => {
    svc.saveScore(P.admin, a1.id, 'writing2', { criteria: [6, null, null, null] }, '2026-09-20');
    const no = voiNgay('2026-09-28', () => debt.scoreDebtCells(P.admin, '2026-09-28', [MB]) as any[]);
    assert(no.some((x) => x.attemptId === a1.id && x.skill === 'writing2' && x.overdue), 'Nợ điểm không có ô W2');
    const r = dongCham('2026-09-28').get(d.baiId(a1.id, 'writing2'));
    assert(r && !r.dung && r.nhapDau === null && r.tre === 6, `bảng GV: ${JSON.stringify(r)}`);
  });

  // ------------------------------------------------------------------ khối 2 · một luật "em đang học" (Q2)
  console.log('\nPR-S6F-a · (2) Một luật "em đang học": badge, Lịch Test, Phân tích GV, vi phạm');
  const classes: any = await import('../classes/classes.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const MB_FT = classId('MB FT 101');
  const tuanW1 = '2026-08-31';
  /* Em X: MT1 tuần W1 SEP (đã qua, hạn qua) — năm ô chưa nhập, quá hạn. */
  const eX = emMoi('MB FT 101');
  boLichTuTao(conn, eX.cy);
  /* Tạo lượt NGAY tuần đó (T34: lượt tạo sau khi tuần thi đã hết là MT lịch sử, không nợ). */
  const aX = voiNgay(tuanW1, () => luotThu(conn, svc.createAttempt, P.admin, { studentId: eX.sid, cycleId: eX.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanW1).id }));
  const badge = () => {
    const n = (classes.listClassSummaries(P.mbManager).rows as any[]).find((r) => r.id === MB_FT).needScores as number;
    /* Số = danh sách: badge bằng danh sách "cần chấm" nó mở ra (listAttempts need my_scores). */
    const ds = (svc.listAttempts(P.mbManager, { classId: MB_FT, need: 'my_scores', scope: 'managed' }).rows as any[]).reduce((s, r) => s + r.pendingSkills.length, 0);
    if (ds !== n) throw new Error(`badge ${n} ≠ danh sách cần chấm ${ds}`);
    return n;
  };
  const lt = () => {
    const r = canCham.lichTest(P.mbManager, week.ensurePeriod(tuanW1).id, MB, TODAY, { phamVi: 'tat-ca' });
    /* PR-LT3: ô "Quá hạn" cũ bỏ — bài quá hạn của tuần cũ nằm ở khối 1 (`tongQuan.no.bai`). */
    return { conBai: r.lop.find((l: any) => l.classId === MB_FT)?.conBai ?? 0, quaHan: r.tongQuan.no.bai };
  };

  check('S6F-a (2a) · em Tạm dừng → badge "n bài chờ chấm" và Lịch Test tuần cũ (conBai, tongQuan.quaHan) cùng giảm đúng số ô của em; Quay lại học → tăng lại', () => {
    const soO = (svc.skillCells(P.admin, get('SELECT * FROM assessment_attempts WHERE id = ?', aX.id), svc.scoresOf(aX.id), [], TODAY,
      svc.loadBundle([aX.id]).skillRows.get(aX.id)) as any[]).filter((c) => c.required && c.band === null).length;
    assert(soO >= 4, `em X chỉ có ${soO} ô chưa nhập`);
    const b0 = badge(); const l0 = lt();
    studentsSvc.setStudentStatus(P.mbManager, eX.sid, 'inactive', TODAY, 'Tạm nghỉ');
    const b1 = badge(); const l1 = lt();
    studentsSvc.setStudentStatus(P.mbManager, eX.sid, 'active', TODAY, 'Đi học lại');
    const b2 = badge(); const l2 = lt();
    assert(b0 - b1 === soO && b2 === b0, `badge ${b0} → ${b1} → ${b2} (ô của em: ${soO})`);
    assert(l0.conBai - l1.conBai === soO && l2.conBai === l0.conBai, `Lịch Test conBai ${l0.conBai} → ${l1.conBai} → ${l2.conBai}`);
    assert(l0.quaHan - l1.quaHan === soO && l2.quaHan === l0.quaHan, `Lịch Test quá hạn ${l0.quaHan} → ${l1.quaHan} → ${l2.quaHan}`);
  });
  check('S6F-a (2b) · em Kết thúc học / đã lưu trữ có MT2 planned quá hạn → không ở Chấm điểm bảng GV, không ở scoreDebtCells; còn học → có', () => {
    const eY = emMoi('MB FT 101');
    boLichTuTao(conn, eY.cy);
    const aY = luotThu(conn, svc.createAttempt, P.admin, { studentId: eY.sid, cycleId: eY.cy, classId: MB_FT, no: 2, periodId: week.ensurePeriod(tuanNay).id });
    const L = d.baiId(aY.id, 'listening');
    /* Xem ở 28/09: tuần W3 SEP đã hết, hạn đã qua — ô L quá hạn. */
    const coMat = () => ({
      gv: dongCham('2026-09-28').has(L),
      no: voiNgay('2026-09-28', () => (debt.scoreDebtCells(P.admin, '2026-09-28', [MB]) as any[]).some((x) => x.attemptId === aY.id && x.skill === 'listening' && x.overdue)),
    });
    const truoc = coMat();
    assert(truoc.gv && truoc.no, `em đang học phải có mặt: ${JSON.stringify(truoc)}`);
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(eY.sid);
    const thoi = coMat();
    conn.prepare(`UPDATE students SET status = 'active', archived_at = '2026-09-10T00:00:00Z' WHERE id = ?`).run(eY.sid);
    const luu = coMat();
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(eY.sid);
    assert(!thoi.gv && !thoi.no, `em Kết thúc học: ${JSON.stringify(thoi)}`);
    assert(!luu.gv && !luu.no, `em lưu trữ: ${JSON.stringify(luu)}`);
  });
  check('S6F-a (2c) · Xử lý vi phạm: 3 vi phạm hạn chốt 10/09, em Tạm dừng, hôm nay 20/09 → không mục trễ nào; em Kết thúc học → cũng không; em học lại → có', () => {
    const { sid } = emMoi('MB FT 101');
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(sid);
    const ids = ['2026-09-03', '2026-09-04', '2026-09-05'].map((ngay) =>
      (viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', description: 'Vi phạm ghi cho phép kiểm S6F-a', occurredOn: ngay }) as any).violation.id as number);
    conn.prepare(`UPDATE violations SET han_xu_ly = '2026-09-10', phan_hoi_ngay = NULL WHERE id IN (${ids.join(',')})`).run();
    const tre = () => voiNgay('2026-09-20', () => {
      const tap = pt.tapXuLyViPham(pt.nguCanhPtGv(P.mbManager, { ct: 'ft', tu: '2026-09-07', den: '2026-09-07' }));
      return ids.filter((v) => [...tap.values()].some((x: any) => x.tong.includes(v) && !x.dung.includes(v))).length;
    });
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid);
    const tamDung = tre();
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(sid);
    const ketThuc = tre();
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid);
    const dangHoc = tre();
    assert(tamDung === 0 && ketThuc === 0 && dangHoc === 3, `trễ: Tạm dừng ${tamDung} · Kết thúc ${ketThuc} · đang học ${dangHoc}`);
  });
  check('S6F-a (2d) · HAI ĐƯỜNG: ô Nợ điểm quá hạn (có người phụ trách) trong khoảng bảng GV ⊆ tập "chưa nhập & trễ" của bảng GV (theo baiId)', () => {
    const kh = { ct: 'ft', tu: '2026-08-17', den: tuanNay };
    const c = pt.nguCanhPtGv(P.mbManager, kh);
    const nap = pt.napBai(P.mbManager, c);
    const trongKhoang = new Set(nap.o.map((x: any) => x.id));
    const tre = new Set([...pt.tapChamDiem(c, nap).dong.values()].filter((r: any) => !r.dung && !r.nhapDau).map((r: any) => r.id));
    const no = (debt.scoreDebtCells(P.mbManager, TODAY, [MB]) as any[])
      .filter((x) => x.overdue && x.userId !== null).map((x) => d.baiId(x.attemptId, x.skill)).filter((id) => trongKhoang.has(id));
    const thieu = no.filter((id) => !tre.has(id));
    assert(no.length > 0 && thieu.length === 0, `${no.length} ô nợ quá hạn, thiếu ở bảng GV: ${thieu.slice(0, 10).join(', ')}`);
  });
  check('S6F-a (2e) · quét chuỗi: điều kiện "em đang học" của nợ điểm / bảng GV chỉ qua HV_DANG_HOC_SQL (không viết tay)', () => {
    const goc = path.join(REPO, 'server/src');
    const tep = ['worklist/scoreDebt.ts', 'fasttrack/attempts.ts', 'worklist/signals.ts', 'classes/classes.ts', 'cham/canCham.ts', 'phanTich/giaoVien.ts'];
    const viTay = tep.filter((f) => /s\.status\s*=\s*'active'/.test(fs.readFileSync(path.join(goc, f), 'utf8')));
    assert(viTay.length === 0, `còn viết tay: ${viTay.join(', ')}`);
    assert(/HV_DANG_HOC_SQL/.test(fs.readFileSync(path.join(goc, 'students/tamDung.ts'), 'utf8')), 'thiếu HV_DANG_HOC_SQL');
  });
  // ------------------------------------------------------------------ khối 3 · một luật quá hạn nhập điểm (Q6)
  console.log('\nPR-S6F-a · (3) Một luật quá hạn nhập điểm: Việc, cột Việc tiếp theo, bảng GV');
  const mw: any = await import('../worklist/mywork.ts');
  const dhv: any = await import('../classes/dongHocVien.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const gvL = () => loadPrincipal(P.lrTeacher.userId);
  /* Em W: MT6 tuần W3 SEP (đang chạy — hôm nay 14/09 Thứ Hai), hạn L / R đặt đè 13/09. MT6 để nhóm việc chỉ có em W. */
  const eW = emMoi('MB FT 101');
  boLichTuTao(conn, eW.cy);
  const aW = luotThu(conn, svc.createAttempt, P.admin, { studentId: eW.sid, cycleId: eW.cy, classId: MB_FT, no: 6, periodId: week.ensurePeriod(tuanNay).id });
  conn.prepare(`UPDATE attempt_skills SET deadline_override = '2026-09-13' WHERE attempt_id = ? AND skill IN ('listening', 'reading')`).run(aW.id);
  /* Em V: MT5 tuần W1 SEP (đã hết), hạn mặc định đã qua. */
  const eV = emMoi('MB FT 101');
  boLichTuTao(conn, eV.cy);
  const aV = voiNgay(tuanW1, () => luotThu(conn, svc.createAttempt, P.admin, { studentId: eV.sid, cycleId: eV.cy, classId: MB_FT, no: 5, periodId: week.ensurePeriod(tuanW1).id }));
  const viecL = (aid: number) => (mw.myWork(gvL()).groups as any[]).flatMap((g) => g.items)
    .find((it: any) => it.group === 'score' && it.attemptId === aid);

  check('S6F-a (3a) · quaHanNhapDiem giữ kết quả 6 ca cũ; mocTreNhapDiem = max(hạn, Chủ nhật tuần thi)', () => {
    const ca: [string | null, string | null, string, boolean][] = [
      [null, '2026-09-07', '2026-09-30', false], ['2026-09-10', null, '2026-09-30', false],
      ['2026-09-13', '2026-09-14', '2026-09-14', false], ['2026-09-13', '2026-09-14', '2026-09-21', true],
      ['2026-09-22', '2026-09-14', '2026-09-22', false], ['2026-09-22', '2026-09-14', '2026-09-23', true],
    ];
    for (const [han, tuan, hom, ky] of ca) assert(week.quaHanNhapDiem(han, tuan, hom) === ky, `${han} · ${tuan} · ${hom}`);
    assert(week.mocTreNhapDiem?.('2026-09-13', '2026-09-16') === '2026-09-20' && week.mocTreNhapDiem('2026-09-22', '2026-09-14') === '2026-09-22', 'mocTreNhapDiem');
  });
  check('S6F-a (3b) · tuần thi CHƯA hết, hạn đè đã qua: việc "Nhập điểm L" của GV không "Quá hạn", không vào summary.overdue; cột Việc tiếp theo không đỏ', () => {
    const it = viecL(aW.id);
    assert(it && it.urgency !== 'overdue', `việc: ${JSON.stringify(it && { urgency: it.urgency, due: it.due })}`);
    const nd = dhv.nhapDiemTheoEm(gvL(), [MB_FT], TODAY, () => MB_FT).get(eW.sid);
    assert(nd && !nd.quaHan, `nhapDiemTheoEm: ${JSON.stringify(nd)}`);
    const v = d.viecTiepCuaEm({ nhapDiem: nd, cases: [], yThuc: null, homNay: TODAY })[0];
    assert(v && v.tone !== 'danger' && v.quaHanNgay === null && !/quá hạn/.test(v.title), `Việc tiếp theo: ${JSON.stringify(v)}`);
  });
  check('S6F-a (3c) · bảng GV: ô tuần chưa hết chưa tính; nhập 19/09 (còn trong tuần) → đúng hạn; nhập 21/09 → trễ 1 ngày (đếm từ Chủ nhật 20/09)', () => {
    assert(!dongCham(TODAY).has(d.baiId(aW.id, 'listening')), 'ô tuần đang chạy đã bị tính');
    svc.saveScore(P.admin, aW.id, 'listening', { rawScore: 30 }, '2026-09-19');
    const L = dongCham('2026-09-19').get(d.baiId(aW.id, 'listening'));
    assert(L?.dung && L.tre === null, `L: ${JSON.stringify(L)}`);
    svc.saveScore(P.admin, aW.id, 'reading', { rawScore: 30 }, '2026-09-21');
    const R = dongCham('2026-09-21').get(d.baiId(aW.id, 'reading'));
    assert(R && !R.dung && R.tre === 1 && R.han === '2026-09-13', `R: ${JSON.stringify(R)}`);
  });
  check('S6F-a (3d) · tuần thi ĐÃ hết, qua hạn: cả bốn đường quá hạn (Việc, Việc tiếp theo, Nợ điểm, bảng GV)', () => {
    const it = viecL(aV.id);
    assert(it?.urgency === 'overdue', `việc: ${JSON.stringify(it && { urgency: it.urgency, due: it.due })}`);
    const nd = dhv.nhapDiemTheoEm(gvL(), [MB_FT], TODAY, () => MB_FT).get(eV.sid);
    assert(nd?.quaHan && d.viecTiepCuaEm({ nhapDiem: nd, cases: [], yThuc: null, homNay: TODAY })[0].tone === 'danger', `nhapDiemTheoEm: ${JSON.stringify(nd)}`);
    assert((debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).some((x) => x.attemptId === aV.id && x.skill === 'listening' && x.overdue), 'Nợ điểm');
    const r = dongCham(TODAY, tuanW1).get(d.baiId(aV.id, 'listening'));
    assert(r && !r.dung, `bảng GV: ${JSON.stringify(r)}`);
  });
  /* PR-Dọn (Q9): Việc nhập điểm dùng CÙNG luật Nợ điểm (bỏ lớp đã kết thúc) — phép kiểm không còn tự lọc "lớp đang hoạt động". */
  check('S6F-a (3e) · HAI ĐƯỜNG: (lớp, đợt) của việc nhập điểm "Quá hạn" của GV = (lớp, đợt) có ô Nợ điểm quá hạn của GV (mọi lớp)', () => {
    const g = gvL();
    const viec = new Set((mw.myWork(g).groups as any[]).flatMap((x) => x.items)
      .filter((it: any) => it.group === 'score' && it.mine && it.urgency === 'overdue').map((it: any) => `${it.classId}|${it.attemptNo}|${it.contextLabel}`));
    const luot = new Map((conn.prepare(`SELECT id, class_id, attempt_no, kind FROM assessment_attempts`).all() as any[]).map((a) => [a.id, a]));
    const no = new Set((debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue && x.userId === g.userId).map((x) => {
      const a = luot.get(x.attemptId);
      return `${a.class_id}|${a.attempt_no}|${a.kind && a.kind !== 'mock' ? d.ATTEMPT_KIND_SHORT[a.kind] : `MT${a.attempt_no}`}`;
    }));
    const lech = [...viec].filter((k) => !no.has(k)).concat([...no].filter((k) => !viec.has(k)));
    assert(no.size > 0 && lech.length === 0, `Việc ${viec.size} · Nợ ${no.size} · lệch: ${lech.join(' ; ')}`);
  });
  // ------------------------------------------------------------------ khối 4 · Phân tích GV — đúng người, đúng tập
  console.log('\nPR-S6F-a · (4) Phân tích GV: người dạy lúc thi, đúng tập, PA hiệu quả khớp Hiệu quả PA, chặn dò tên');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const hq: any = await import('../phanTich/hieuQuaPa.ts');
  const eff: any = await import('../cases/effectiveness.ts');
  const now = () => new Date().toISOString();
  const lopMoi = (code: string) => (intake.createClass(P.admin, {
    code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: '2026-08-24', startPeriodId: week.ensurePeriod('2026-08-24').id,
  }) as any).id as number;
  const emVaoLop = (lop: number) => {
    const ten = `S6FA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `s6fa-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(sid);
    return { sid, cy: get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number };
  };
  const kq28 = (gv: number) => voiNgay('2026-09-28', () => (pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay }).hang as any[]).find((h) => h.id === gv));

  /* Em T: MB FT 101, MT3 tuần W3 SEP — L nhập 14/09 (đúng hạn), W2 chưa nhập. Chuyển lớp GIỮ khoá sang lớp Y (không phân công) từ W4 SEP. */
  const eT = emVaoLop(MB_FT);
  boLichTuTao(conn, eT.cy);
  const aT = luotThu(conn, svc.createAttempt, P.admin, { studentId: eT.sid, cycleId: eT.cy, classId: MB_FT, no: 3, periodId: week.ensurePeriod(tuanNay).id });
  svc.saveScore(P.admin, aT.id, 'listening', { rawScore: 30 }, TODAY);
  const lopY = lopMoi('MB FT S6FA Y');

  check('S6F-a (4a) · em chuyển lớp giữ khoá sau MT: ô L đúng hạn + Kết quả L vẫn tính cho GV lớp cũ; ô W2 trễ tính cho GV W2 lớp cũ; không ai ở lớp mới', () => {
    const c0 = voiNgay('2026-09-28', () => pt.nguCanhPtGv(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay }));
    const hanL = dongCham('2026-09-28').get(d.baiId(aT.id, 'listening'))?.han;
    const gvA = c0.nguoiLuc(MB_FT, 'listening', hanL ?? TODAY);
    const kqTruoc = kq28(gvA)?.ketQua.listening;
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = '2026-09-21' WHERE student_id = ? AND status = 'active'`).run(eT.sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-09-21', ?)`).run(eT.sid, lopY, now());
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE cycle_id = ? AND status = 'planned'`).run(lopY, eT.cy);
    const dong = dongCham('2026-09-28');
    const L = dong.get(d.baiId(aT.id, 'listening'));
    const W2 = dong.get(d.baiId(aT.id, 'writing2'));
    assert(gvA && L?.gv === gvA && L.dung && L.lop === 'MB FT 101', `L: ${JSON.stringify(L)} · GV A ${gvA}`);
    assert(W2 && W2.gv === c0.nguoiLuc(MB_FT, 'writing2', W2.han) && !W2.dung && W2.lop === 'MB FT 101', `W2: ${JSON.stringify(W2)}`);
    const kqSau = kq28(gvA)?.ketQua.listening;
    assert(kqTruoc?.k === 'so' && kqSau?.tong === kqTruoc.tong && kqSau.lop.includes(MB_FT), `Kết quả L của A: ${JSON.stringify(kqTruoc)} → ${JSON.stringify(kqSau)}`);
  });
  check('S6F-a (4b) · vắng đã xác nhận / lượt huỷ / MT lịch sử → không ở Chấm điểm; (4c) ô tuần sau "đến", chưa nhập → không ở Chấm điểm', () => {
    const e = emVaoLop(MB_FT);
    boLichTuTao(conn, e.cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: e.sid, cycleId: e.cy, classId: MB_FT, no: 3, periodId: week.ensurePeriod(tuanNay).id });
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'reading'`).run(a.id);
    const lichSu = get(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND lich_su = 1 ORDER BY id LIMIT 1`, e.cy).id as number;
    const h = emVaoLop(MB_FT);
    boLichTuTao(conn, h.cy);
    const huy = luotThu(conn, svc.createAttempt, P.admin, { studentId: h.sid, cycleId: h.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanNay).id });
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(huy.id);
    const dong = dongCham('2026-09-28');
    assert(dong.has(d.baiId(a.id, 'listening')), 'ô L thường phải có mặt (đối chứng)');
    assert(!dong.has(d.baiId(a.id, 'reading')), 'vắng đã xác nhận vẫn tính');
    assert(!dong.has(d.baiId(lichSu, 'listening')), 'MT lịch sử vẫn tính');
    assert(!dong.has(d.baiId(huy.id, 'listening')), 'lượt huỷ vẫn tính');
    assert(!dongCham('2026-09-28', '2026-09-07').has(d.baiId(a.id, 'listening')), 'ô tuần sau "đến" vẫn tính');
  });
  check('S6F-a (4d) · Case FT GV báo, CHƯA có lỗi chính, 1 PA tự thêm có kết quả: ô "PA hiệu quả" = Hiệu quả PA lọc gv; Σ hàng = tóm tắt', () => {
    const e = emVaoLop(MB_FT);
    const gv = P.w2Teacher.userId;
    const ca = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, owner_user_id, created_at)
      VALUES (?, ?, 'listening', 'listening', 'teacher_report', 'in_progress', ?, ?)`).run(e.sid, e.cy, gv, now()).lastInsertRowid);
    const iv = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, preset, started_date, completed_date, created_at)
      VALUES (?, 'tutor', 'completed', 0, '2026-08-27', '2026-09-10', ?)`).run(ca, now()).lastInsertRowid);
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, created_at) VALUES (?, ?, '2026-09-10', 'improved', ?)`).run(ca, iv, now());
    const kh = { tu: '2026-08-24', den: tuanNay };
    const o = (pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', ...kh }).hang as any[]).find((h) => h.id === gv)?.paHieuQua;
    const r = hq.hieuQuaPa(P.mbManager, { branchId: MB, ct: 'ft', soTuan: 4, gv, ...kh });
    assert(o?.k === 'so' && o.tong === r.gvThem.tomTat.paCoKetQua && o.dung === r.gvThem.tomTat.caiThien, `ô ${JSON.stringify(o)} ≠ Hiệu quả PA ${JSON.stringify(r.gvThem.tomTat)}`);
    const hang = [...r.gvThem.hang, ...(r.gvThem.gom?.hang ?? [])];
    assert(hang.reduce((n: number, x: any) => n + x.soPa, 0) === r.gvThem.tomTat.paCoKetQua, `Σ hàng ≠ tóm tắt ${r.gvThem.tomTat.paCoKetQua}`);
    const cpl = hang.find((x: any) => x.nhan === 'Case chưa chọn nhóm nguyên nhân');
    assert(cpl && cpl.soPa >= 1 && hq.oHieuQuaPa(P.mbManager, { branchId: MB, ct: 'ft', soTuan: 4, gv, ...kh, dong: cpl.khoa, cot: 'pa' }).rows.some((x: any) => x.id === iv),
      `hàng "Case chưa chọn nhóm nguyên nhân": ${JSON.stringify(cpl)}`);
  });
  check('S6F-a (4e) · PHỦ ĐỊNH: panel Chấm điểm với gv không có lớp ở chi nhánh → 404, không lộ tên', () => {
    let loi: any = null;
    try { pt.oChamDiemGv(P.cpManager, { ct: 'ft', gv: P.lrTeacher.userId }); } catch (e) { loi = e; }
    assert(loi?.status === 404 && /không có lớp ở chi nhánh này/.test(loi.message), `${loi?.status} ${loi?.message}`);
  });
  check('S6F-a (4f) · KHÔNG N+1: thêm 2 lớp FT có em + lượt có điểm → số câu SQL của bảng không đổi', () => {
    const dem = () => { const a = nguCanh.soCauSql(); nguCanh.trongBoNho(() => pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay })); return nguCanh.soCauSql() - a; };
    dem();
    const truoc = dem();
    for (const i of [1, 2]) {
      const lop = lopMoi(`MB FT S6FA N${i}`);
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?, 'listening', 0, '2026-08-24', 'active', ?)`).run(P.lrTeacher.userId, lop, now());
      const e = emVaoLop(lop);
      boLichTuTao(conn, e.cy);
      const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: e.sid, cycleId: e.cy, classId: lop, no: 1, periodId: week.ensurePeriod(tuanNay).id });
      svc.saveScore(P.admin, a.id, 'listening', { rawScore: 28 }, TODAY);
    }
    const sau = dem();
    assert(sau === truoc, `${truoc} → ${sau} câu`);
  });
  check('S6F-a (4g) · queryPlans chia lô: 1 000 học viên → ≥ 3 câu (lô ≤ 400), không một câu IN 1 000 tham số', () => {
    const ids = Array.from({ length: 1000 }, (_, i) => i + 1);
    const a = nguCanh.soCauSql();
    nguCanh.trongBoNho(() => eff.planOutcomes({ studentIds: ids }));
    const n = nguCanh.soCauSql() - a;
    assert(n >= 3, `${n} câu`);
  });
  check('S6F-a (4h) · Hiệu quả PA quy chế: hàng con theo thứ tự cố định (khoá INTERVENTION_KIND_LABEL), không theo số PA', () => {
    const thu = Object.keys(d.INTERVENTION_KIND_LABEL);
    for (const kh of [{ tu: '2026-06-15', den: tuanNay }, { tu: '2026-08-24', den: tuanNay }]) {
      const r = hq.hieuQuaPa(P.mbManager, { branchId: MB, ct: 'ft', soTuan: 4, ...kh });
      for (const h of r.quyChe.hang) {
        const vt = (h.con ?? []).map((c: any) => thu.indexOf(c.khoa.split('|')[1]));
        assert(vt.every((v: number, i: number) => i === 0 || vt[i - 1] <= v), `${h.nhan}: ${(h.con ?? []).map((c: any) => c.khoa).join(', ')}`);
      }
    }
  });
  check('S6F-a (4i) · panel Chấm điểm: ngày "sửa" đổi giờ nhật ký UTC sang ngày VN (20:00Z → hôm sau)', () => {
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, after_json, created_at)
      VALUES (?, 'score.edit', 'assessment_attempt', ?, 'listening', '{"lyDo":"Chấm lại"}', '2026-09-22T20:00:00.000Z')`).run(P.admin.userId, aW.id);
    const gv = voiNgay('2026-09-28', () => pt.nguCanhPtGv(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay }).nguoiLuc(MB_FT, 'listening', '2026-09-20'));
    const dong = voiNgay('2026-09-28', () => pt.oChamDiemGv(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay, gv }).rows as any[]).find((r) => r.id === d.baiId(aW.id, 'listening'));
    assert(dong?.sua === '2026-09-23', `sửa: ${JSON.stringify(dong)}`);
  });
  // ------------------------------------------------------------------ khối 10 · chuông + Phối hợp SOS (Q11, Q12)
  console.log('\nPR-S6F-a · (10) Chuông: Báo QL ở Cần làm; Phối hợp SOS chỉ lượt Mock FT');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const tb: any = await import('../platform/thongBao.ts');
  const tbMoi = (userId: number, kind: string, entityType: string, entityId: number) =>
    Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, read_at, created_at)
      VALUES (?,?,?,?,?,?,?,NULL,?)`).run(userId, kind, `thử ${kind}`, null, entityType, entityId, `s6fa:${kind}:${entityId}:${Math.random()}`, now()).lastInsertRowid);
  const nhomCua = (userId: number, id: number) => {
    const r = (tb.thongBaoCua(userId) as any[]).find((x) => x.id === id);
    if (!r) throw new Error(`thông báo ${id} không có trong chuông`);
    return d.nhomThongBao(r);
  };
  const theMoi = (o: { loai: string; doiTuongLoai: string; doiTuongId: number; hv: number | null; lop: number | null; nguoiXin: number; trangThai: string }) =>
    Number(conn.prepare(`INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, lop_id, chi_nhanh_id, nguoi_xin, trang_thai, tao_luc)
      VALUES (?, 'duyet', ?, ?, ?, ?, ?, ?, ?, ?)`).run(o.loai, o.doiTuongLoai, o.doiTuongId, o.hv, o.lop, MB, o.nguoiXin, o.trangThai, now()).lastInsertRowid);
  const coLop = (p: any, lop: number) => (phoiHop.myCoordinationLines(loadPrincipal(p.userId)) as any[]).some((l) => l.classId === lop);

  check('S6F-a (10a) · GVCN lớp thường có "Báo PH qua TVV" chờ của bài Progress Test → KHÔNG có Phối hợp SOS; lượt Mock FT chưa xong → vẫn có', () => {
    const FOU = classId('MB FOU 12');
    const em = get(`SELECT e.student_id AS sid, a.id AS aid FROM enrollments e JOIN assessment_attempts a ON a.student_id = e.student_id AND a.class_id = e.class_id
                     WHERE e.class_id = ? AND e.status = 'active' AND a.status != 'cancelled' AND COALESCE(a.kind, 'mock') != 'mock' ORDER BY a.id LIMIT 1`, FOU);
    assert(em, 'MB FOU 12 không có bài lớp thường nào');
    conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at) VALUES (?, ?, 'bao_ph_tvv', 'pending', ?)`).run(em.aid, em.sid, now());
    assert(!coLop(P.normalCoreTeacher, FOU), 'lớp thường vẫn có dòng Phối hợp SOS');
    const viec = (mw.myWork(loadPrincipal(P.normalCoreTeacher.userId)).groups as any[]).flatMap((g) => g.items).filter((it: any) => it.group === 'phoi_hop_sos');
    assert(!viec.some((it: any) => it.classId === FOU), JSON.stringify(viec.map((it: any) => it.key)));
    conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at) VALUES (?, ?, 'bao_ph_tvv', 'pending', ?)`).run(aW.id, eW.sid, now());
    assert(coLop(P.coreTeacher, MB_FT), 'lượt Mock FT chưa xong phải còn dòng Phối hợp SOS');
  });
  check('S6F-a (10b) · thông báo Báo QL: thẻ đang chờ → Cần làm; thẻ đã xử lý → Để biết', () => {
    const the = theMoi({ loai: 'khong_theo_doi', doiTuongLoai: 'sos_case', doiTuongId: 999001, hv: eW.sid, lop: MB_FT, nguoiXin: P.coreTeacher.userId, trangThai: 'cho' });
    const id = tbMoi(P.mbManager.userId, 'bao_len', 'yeu_cau_duyet', the);
    const cho = nhomCua(P.mbManager.userId, id);
    conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'duyet' WHERE id = ?`).run(the);
    assert(cho === 'can-lam' && nhomCua(P.mbManager.userId, id) === 'de-biet', `chờ: ${cho}`);
  });
  check('S6F-a (10c) · "Quản lý từ chối": thẻ còn bị từ chối → Cần làm; đã sửa gửi lại → Để biết; thẻ đóng → Để biết', () => {
    const o = { loai: 'y_thuc', doiTuongLoai: 'discipline_measure', hv: eW.sid, lop: MB_FT, nguoiXin: P.coreTeacher.userId };
    const the = theMoi({ ...o, doiTuongId: 999002, trangThai: 'tu_choi' });
    const id = tbMoi(P.coreTeacher.userId, 'duyet_tu_choi', 'yeu_cau_duyet', the);
    const truoc = nhomCua(P.coreTeacher.userId, id);
    theMoi({ ...o, doiTuongId: 999003, trangThai: 'cho' });
    const guiLai = nhomCua(P.coreTeacher.userId, id);
    const the2 = theMoi({ ...o, hv: eV.sid, doiTuongId: 999004, trangThai: 'tu_choi' });
    const id2 = tbMoi(P.coreTeacher.userId, 'duyet_tu_choi', 'yeu_cau_duyet', the2);
    conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'dong' WHERE id = ?`).run(the2);
    assert(truoc === 'can-lam' && guiLai === 'de-biet' && nhomCua(P.coreTeacher.userId, id2) === 'de-biet', `từ chối: ${truoc} · gửi lại: ${guiLai}`);
  });
  check('S6F-a (10d) · Case SOS chờ nguyên nhân → Cần làm; đã gửi thẻ "Không cần theo dõi" (chờ QL) → Để biết (cùng luật awaitingCauseCaseIds)', () => {
    const ca = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, owner_user_id, sos_level, created_at)
      VALUES (?, ?, 'reading', 'reading', 'mock', 'open', ?, 1, ?)`).run(eW.sid, eW.cy, P.lrTeacher.userId, now()).lastInsertRowid);
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, preset, created_at) VALUES (?, 'tutor', 'planned', 1, ?)`).run(ca, now());
    const id = tbMoi(P.lrTeacher.userId, 'sos', 'sos_case', ca);
    const truoc = nhomCua(P.lrTeacher.userId, id);
    theMoi({ loai: 'khong_theo_doi', doiTuongLoai: 'sos_case', doiTuongId: ca, hv: eW.sid, lop: MB_FT, nguoiXin: P.lrTeacher.userId, trangThai: 'cho' });
    assert(truoc === 'can-lam' && nhomCua(P.lrTeacher.userId, id) === 'de-biet', `trước thẻ: ${truoc}`);
  });
  check('S6F-a (10e) · "Đọc hết" đúng 1 câu SQL', () => {
    const a = nguCanh.soCauSql();
    nguCanh.trongBoNho(() => tb.docHet(P.coreTeacher.userId, TODAY));
    assert(nguCanh.soCauSql() - a === 1, `${nguCanh.soCauSql() - a} câu`);
  });
  // ------------------------------------------------------------------ khối 11 · chuyển lớp + phân công FOU (Q1, Q3, Q23)
  console.log('\nPR-S6F-a · (11) Chuyển lớp chốt lại hạn xử lý; phân công FOU không tự gán G+V trống; khác gợi ý Progress Test');
  const ltt: any = await import('../classes/luatLoTrinh.ts');
  const tt: any = await import('../yThuc/trangThai.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');

  check('S6F-a (11a) · thi hành chuyển lớp: vi phạm bắt buộc chưa phản hồi chốt lại han_xu_ly = hạn màn Ý thức sau chuyển; vi phạm đã phản hồi giữ nguyên', () => {
    const { sid } = emMoi('MB FT 101');
    const ids = ['2026-09-08', '2026-09-09', '2026-09-10'].map((ngay) =>
      (viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', description: 'Vi phạm ghi cho phép kiểm S6F-a (11)', occurredOn: ngay }) as any).violation.id as number);
    const daPh = (viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', description: 'Vi phạm đã phản hồi S6F-a (11)', occurredOn: '2026-09-10' }) as any).violation.id as number;
    conn.prepare(`UPDATE violations SET han_xu_ly = '2026-09-01', phan_hoi_ngay = '2026-09-02' WHERE id = ?`).run(daPh);
    const hanCu = get('SELECT han_xu_ly FROM violations WHERE id = ?', ids[0]).han_xu_ly;
    assert(hanCu, 'vi phạm bắt buộc phải có hạn chốt trước khi chuyển');
    /* Thi hành lệnh Thứ Hai 21/09 (quyết định chuyển lớp chạy đầu tuần): mốc vào lớp mới sau mốc bắt buộc → hạn dời. */
    const em = voiNgay('2026-09-21', () => {
      ltt.apDungMotDong(P.mbManager, { sid, toClassId: lopY, ngay: '2026-09-21', boiCanh: 'giua-khoa', lyDo: 'Chuyển lớp cho phép kiểm' });
      return tt.trangThaiYThuc([sid]).get(sid);
    });
    assert(em.viPham.get(ids[0]).han !== hanCu, `hạn màn Ý thức không đổi sau chuyển (${hanCu}) — phép kiểm không phân biệt được`);
    const lech = ids.filter((v) => get('SELECT han_xu_ly FROM violations WHERE id = ?', v).han_xu_ly !== em.viPham.get(v).han);
    assert(lech.length === 0, `hạn chốt ≠ màn Ý thức: ${lech.map((v) => `${get('SELECT han_xu_ly FROM violations WHERE id = ?', v).han_xu_ly} ≠ ${em.viPham.get(v).han}`).join(', ')} (trước: ${hanCu})`);
    assert(get('SELECT han_xu_ly FROM violations WHERE id = ?', daPh).han_xu_ly === '2026-09-01', 'vi phạm đã phản hồi bị đổi hạn');
  });
  check('S6F-a (11b) · nenTachFou: {L,R cùng người} → tách · {L,R,G+V cùng người} → gộp · {} → gộp · {L,R khác G+V} → tách; ở chế độ tách lưu không sinh dòng G+V', () => {
    const fou = (o: Record<string, number>) => Object.entries(o).map(([skill, userId]) => ({ skill, userId }));
    assert(d.nenTachFou('FOU', fou({ listening: 7, reading: 7 })) === true, 'L, R cùng người, G+V trống');
    assert(d.nenTachFou('FOU', fou({ listening: 7, reading: 7, writing: 7 })) === false, 'ba môn cùng người');
    assert(d.nenTachFou('FOU', []) === false, 'cả ba trống');
    assert(d.nenTachFou('FOU', fou({ listening: 7, reading: 8, writing: 7 })) === true, 'khác người');
    const skills = [...d.PROGRAMME_TEMPLATES.FOU.skills] as string[];
    const slots = d.slotsTuO(d.oPhanCong('FOU', skills, { tach: true }), { gvcn: 9, listening: 7, reading: 7 });
    assert(!slots.some((s: any) => s.skill === 'writing'), JSON.stringify(slots));
  });
  check('S6F-a (11c) · gợi ý ứng viên lớp FOU: ô gộp "L, R, G+V", ô P "P" (không W1, S); lớp FT giữ W1', () => {
    const oFou = d.oPhanCong('FOU', [...d.PROGRAMME_TEMPLATES.FOU.skills], { tach: false });
    const gop = oFou.find((o: any) => o.gop); const p = oFou.find((o: any) => o.skill === 'speaking');
    assert(d.nhanDayDuoc?.('FOU', gop, ['listening', 'reading', 'writing1']).join(', ') === 'L, R, G+V', String(d.nhanDayDuoc?.('FOU', gop, ['listening', 'reading', 'writing1'])));
    assert(d.nhanDayDuoc('FOU', p, ['speaking', 'writing2']).join(', ') === 'P', 'ô P');
    assert(d.nhanDayDuoc('FT', { khoa: 'writing1', skill: 'writing1', laGvcn: false, nhan: 'W1' }, ['writing1']).join() === 'W1', 'FT');
    const goc = path.join(REPO, 'web/src/modules/classes/ClassCreatePanel.tsx');
    assert(!/map\(skillShort\)/.test(fs.readFileSync(goc, 'utf8')), 'ClassCreatePanel còn ghép mã kỹ năng FT');
  });
  check('S6F-a (11d) · em lớp thường đã hết khoá, gợi ý "Lên", panel một em (Progress Test) chuyển ngang: không lý do → "Ghi lý do ngắn"; có lý do → khac_goi_y = 1', () => {
    const be04 = classId('MB BE 04');
    /* Em Pass (gợi ý "Lên") mà panel một em chọn chuyển NGANG sang lớp thường khác = khác gợi ý (khacGoiY). */
    const hocLai = [...(ck.cuoiKhoaTheoHocVien(be04) as Map<number, any>)].find(([, e]) => e.goiY?.huong === 'len');
    if (!hocLai) throw new Error('MB BE 04 không có em nào được gợi ý lên lớp');
    const tuan = (d.tuanChonDuoc(TODAY) as string[])[0];
    const ra = (lyDo?: string) => lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'giua-khoa', tuanChung: tuan,
      dongs: [{ studentId: hocLai[0], huong: 'chuyen_lop', toClassId: classId('MB BE 03'), lyDo: lyDo ?? null }] });
    const r1 = ra();
    const l1 = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, hocLai[0]);
    if (l1) lenh.huyLenh(P.mbManager, l1.id, 'Dọn phép kiểm');
    assert(r1.failed[0]?.message === 'Ghi lý do ngắn', `không lý do: ${JSON.stringify(r1)}`);
    const r2 = ra('Phụ huynh xin học lớp buổi khác');
    const l2 = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, hocLai[0]);
    if (l2) lenh.huyLenh(P.mbManager, l2.id, 'Dọn phép kiểm');
    assert(r2.ok.length === 1 && l2?.khac_goi_y === 1, `có lý do: ${JSON.stringify(r2)} · ${JSON.stringify(l2)}`);
  });
  /* PR-Dọn (Q6): quyết định chuyển lớp tối đa 500 dòng — phép kiểm gửi đúng trần (không còn 1 000). */
  check('S6F-a (11e) · raLenh 500 dòng (trần Q6, đa số không thuộc lớp) → "Học viên không thuộc lớp này", không câu SQL nào quá 900 tham số', () => {
    const be04 = classId('MB BE 04');
    const tuan = (d.tuanChonDuoc(TODAY) as string[])[0];
    const goc = conn.prepare;
    let maxThamSo = 0;
    conn.prepare = function (sql: string) { maxThamSo = Math.max(maxThamSo, (sql.match(/\?/g) ?? []).length); return goc.call(conn, sql); };
    let r: any;
    try {
      r = lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'cuoi-khoa', tuanChung: tuan,
        dongs: Array.from({ length: 500 }, (_, i) => ({ studentId: 900000 + i, huong: 'hoc_lai', toClassId: classId('MB BE 03') })) });
    } finally { conn.prepare = goc; }
    assert(r.failed.length === 500 && r.failed.every((f: any) => f.message === 'Học viên không thuộc lớp này.'), JSON.stringify(r.failed.slice(0, 2)));
    assert(maxThamSo <= 900, `câu SQL ${maxThamSo} tham số`);
  });
}
