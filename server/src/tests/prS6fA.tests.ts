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
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `s6fa-${seq}` });
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
  const badge = () => (classes.listClassSummaries(P.mbManager).rows as any[]).find((r) => r.id === MB_FT).needScores as number;
  const lt = () => {
    const r = canCham.lichTest(P.mbManager, week.ensurePeriod(tuanW1).id, MB, TODAY, { phamVi: 'tat-ca' });
    return { conBai: r.lop.find((l: any) => l.classId === MB_FT)?.conBai ?? 0, quaHan: r.tongQuan.quaHan };
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
}
