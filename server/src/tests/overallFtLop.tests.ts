/**
 * PHÉP KIỂM V8-HSL-2 (mockup `thiet-ke/v8/ho-so-lop.html` khung D): dòng "Overall" đầu bảng FT tab Phân tích lớp — `dat` = em có Overall ≥ kỳ vọng đợt,
 * `tong` = em đủ Overall (cùng `danhGiaMon`), em thiếu kỹ năng / KCK ngoài mẫu; ô mở đúng em của ô (dòng điểm đúng lượt); đường vẽ bảng +0 câu.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runOverallFtLopTests(t: YThucTestKit & { P: any; TODAY: string; classId: (c: string) => number }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  console.log('\nV8-HSL-2 · dòng Overall bảng Phân tích FT hồ sơ lớp');
  const ptl: any = await import('../classes/phanTichLop.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const { chayTrongRequest, soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const doCau = <T>(fn: () => T): { kq: T; cau: number } => chayTrongRequest('GET', () => { const a = soCauSql(); const kq = fn(); return { kq, cau: soCauSql() - a }; });
  const MB_FT = classId('MB FT 101');
  const O1 = 'overall|mt1';
  const bang = () => { xoaNho(); return ptl.phanTichLop(P.admin, MB_FT); };
  let seq = 0;
  /** Em mới MB FT 101, Target 6.5 → MT1 kỳ vọng 5.5; `bands` rỗng = chưa điểm. */
  const emMt1 = (bands: Record<string, number>) => {
    const ten = `OVFT HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `ovft-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(week.mondayOf(TODAY)).id });
    for (const [k, b] of Object.entries(bands)) conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, ?, 20, 40, ?, ?)`).run(a.id, k, b, TODAY);
    return { sid, cy, attemptId: a.id as number };
  };
  const DU = (b: number) => ({ listening: b, reading: b, writing1: b, writing2: b, speaking: b });

  check('OV-FT · lớp MB FT 101: hàng overall MT1 = đếm tay từ evaluateAttempt; em thiếu kỹ năng ngoài mẫu; KCK ngoài mẫu', () => {
    const p = bang();
    assert(p.loai === 'ft' && p.dong[0].key === 'overall' && p.dong[0].nhan === 'Overall' && p.dong[0].moRong === false, `dòng đầu ${JSON.stringify(p.dong[0])}`);
    assert(p.dong.slice(1).map((x: any) => x.key).join() === 'listening,reading,writing1,writing2,speaking', 'năm kỹ năng giữ thứ tự');

    /* Đếm tay: em đang học + lộ trình đang chạy + MT1 chưa huỷ, không KCK, đủ Overall. */
    let dat = 0, tong = 0;
    for (const a of conn.prepare(
      `SELECT a.id, a.attempt_no, a.kck_at_attempt, a.target_at_attempt, cy.route, cy.khong_cam_ket
         FROM enrollments e JOIN students s ON s.id = e.student_id JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
         JOIN assessment_attempts a ON a.cycle_id = cy.id AND a.kind = 'mock' AND a.attempt_no = 1 AND a.status != 'cancelled'
        WHERE e.class_id = ? AND e.status = 'active' AND s.archived_at IS NULL`,
    ).all(MB_FT) as any[]) {
      if (a.kck_at_attempt ?? a.khong_cam_ket) continue;
      const kv = scoring.expectationFor(a.target_at_attempt, 1, a.route);
      const ovr = scoring.evaluateAttempt(null, 1, svc.entryBandsOf(svc.scoresOf(a.id)), svc.skipsOf(a.id)).overall;
      if (kv === null || ovr === null) continue;
      tong += 1;
      if (ovr >= kv) dat += 1;
    }
    assert(tong > 0, 'seed phải có MT1 đủ Overall');
    assert(p.o[O1]?.dat === dat && p.o[O1]?.tong === tong, `đếm tay ${dat}/${tong}, bảng ${JSON.stringify(p.o[O1])}`);

    thu(() => {
      const dat0 = emMt1(DU(6.0));   // Overall 6.0 ≥ 5.5
      const chua0 = emMt1(DU(5.0));
      const sau = bang();
      assert(sau.o[O1].tong === tong + 2 && sau.o[O1].dat === dat + 1, `thêm 1 đạt + 1 chưa: ${JSON.stringify(sau.o[O1])}`);
      assert(sau.ds[O1].dat.includes(dat0.sid) && sau.ds[O1].chua.includes(chua0.sid), 'ds ô overall');
      const thieu = emMt1({ listening: 6.0, reading: 6.0 });
      const bo = bang();
      assert(bo.o[O1].tong === tong + 2, 'thiếu kỹ năng phải ngoài mẫu');
      assert(!bo.ds[O1].chua.includes(thieu.sid) && !bo.ds[O1].dat.includes(thieu.sid), 'em thiếu không trong ds');
      const kck = emMt1(DU(5.0));
      conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 1 WHERE id = ?').run(kck.cy);
      assert(bang().o[O1].tong === tong + 2, 'KCK phải ngoài mẫu');
    });
  });

  check('OV-FT (chủ SP 02/11) · em đổi Target sau lượt → ô Overall, ô kỹ năng, panel vẫn so Target LÚC LƯỢT', () => thu(() => {
    const em = emMt1(DU(5.5));   // Target lúc lượt 6.5 → kỳ vọng 5.5, Overall 5.5 đạt
    const truoc = bang();
    assert(truoc.ds[O1].dat.includes(em.sid) && truoc.ds['reading|mt1'].dat.includes(em.sid), 'trước khi đổi Target em đạt');
    conn.prepare('UPDATE learning_cycles SET target_score = 7.5 WHERE id = ?').run(em.cy);   // đổi sau lượt: kỳ vọng hiện tại 6.5
    const sau = bang();
    assert(sau.ds[O1].dat.includes(em.sid), 'Overall phải so Target lúc lượt');
    assert(sau.ds['reading|mt1'].dat.includes(em.sid), 'kỹ năng phải so Target lúc lượt');
    xoaNho();
    const dong = ptl.oPhanTichLop(P.admin, MB_FT, 'overall', 'overall', 'mt1').rows.find((r: any) => r.id === em.sid);
    assert(dong?.ketQua === 'dat' && dong.diemHv.soVoi.v === 5.5, `panel: ${JSON.stringify(dong?.diemHv?.soVoi)}`);
  }));

  check('OV-FT · thiếu Target lúc lượt → ngoài mẫu, như resultOf (không lấy Target hiện tại)', () => thu(() => {
    const em = emMt1(DU(6.0));
    conn.prepare('UPDATE assessment_attempts SET target_at_attempt = NULL WHERE id = ?').run(em.attemptId);
    const p = bang();
    assert(!p.ds[O1].dat.includes(em.sid) && !p.ds[O1].chua.includes(em.sid), 'em không có Target lúc lượt phải ngoài mẫu');
  }));

  check('OV-FT · lớp thường không có hàng Overall', () => {
    const lop = (conn.prepare(`SELECT c.id FROM classes c JOIN programmes pr ON pr.code = c.programme_code WHERE pr.scoring_mode = 'ratio' LIMIT 1`).get() as any).id as number;
    const p = ptl.phanTichLop(P.admin, lop);
    assert(p.loai === 'thuong' && !p.dong.some((x: any) => x.key === 'overall') && !Object.keys(p.o).some((k) => k.startsWith('overall|')), JSON.stringify(p.dong));
  });

  check('OV-FT · /classes/:id/phan-tich-lop không thêm câu (trần 24/25/23 giữ)', () => {
    const { cau } = doCau(() => ptl.phanTichLop(P.admin, MB_FT));
    assert(cau === 8, `đo trước PR 8 câu, nay ${cau}`);
  });

  check('OV-FT · ô overall mở đúng em', () => {
    const p = bang();
    const { kq: o, cau } = doCau(() => ptl.oPhanTichLop(P.admin, MB_FT, 'overall', 'overall', 'mt1'));
    const x = p.ds[O1];
    assert(o.n === p.o[O1].tong && o.rows.length === o.n, `số ${p.o[O1].tong}, panel ${o.n}`);
    assert(o.rows.every((r: any) => r.ketQua === (x.dat.includes(r.id) ? 'dat' : 'chua')), 'kết luận lệch ô');
    assert([...o.rows.map((r: any) => r.id)].sort().join() === [...x.dat, ...x.chua].sort().join(), 'tập em lệch ô');
    assert(o.rows.every((r: any) => r.diemHv?.luot === 'MT1' && r.diemHv.overall !== null && r.diemHv.soVoi?.nhan === 'KV' && r.diemHv.tuan && r.href === `/hoc-vien/${r.id}`), JSON.stringify(o.rows[0]));
    assert(o.rows.every((r: any) => (r.ketQua === 'dat') === (r.diemHv.overall >= r.diemHv.soVoi.v)), 'dòng điểm phải giải thích được kết luận');
    assert(cau <= 9, `mở panel ${cau} câu`);
    assert(ptl.oPhanTichLop(P.admin, MB_FT, 'overall', 'overall', 'mt9').n === 0, 'đợt chưa có → rỗng');
    let loi: any = null;
    try { ptl.oPhanTichLop(P.admin, MB_FT, 'overall', 'overall', 'x'); } catch (e) { loi = e; }
    assert(loi?.status === 400, 'kind lạ phải 400');
    let cam: any = null;
    try { ptl.oPhanTichLop(P.cpManager, MB_FT, 'overall', 'overall', 'mt1'); } catch (e) { cam = e; }
    assert(cam?.status === 403, 'ngoài chi nhánh phải 403');
  });
}
