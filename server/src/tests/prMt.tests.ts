/** PHÉP KIỂM PR-MT — lịch MT tự tạo, MT lịch sử, đánh số liền mạch, RF, dời do vắng. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-MT · Lịch MT tự tạo, MT lịch sử, đánh số, RF, dời do vắng');

  check('PR-MT (1) · lichMtMacDinh LT1/LT2/RF/null + tuanHocCuaMt ngoài lịch (M1, Q1)', () => {
    const j = (x: unknown) => JSON.stringify(x);
    assert(j(d.lichMtMacDinh('LT1')) === '[6,12,16]' && j(d.lichMtMacDinh('LT2')) === '[6,12,16]', 'LT');
    assert(j(d.lichMtMacDinh('RF')) === '[4,8]' && j(d.lichMtMacDinh(null)) === '[]', 'RF / lớp thường');
    assert(d.tuanHocCuaMt('RF', 3) === 12 && d.tuanHocCuaMt('LT1', 4) === 20 && d.tuanHocCuaMt('LT1', 6) === 28, 'ngoài lịch mặc định');
    assert(d.LUAT_LO_TRINH_HIEN.RF.lichMt === 'Tuần 4 · 8' && d.LUAT_LO_TRINH_HIEN.LT1.lichMt === 'Tuần 6 · 12 · 16', 'một nguồn (K1-49)');
  });
  check('PR-MT (1) · laLichSu so CN tuần thi với ngày tạo; trongCuaSoCase biên đúng 28 ngày (T34, M4)', () => {
    assert(d.laLichSu('2026-09-20', '2026-09-21') === true, 'CN 20/09 < 21/09');
    assert(d.laLichSu('2026-09-20', '2026-09-20') === false, 'cùng ngày: chưa qua');
    assert(d.trongCuaSoCase('2026-08-24', '2026-09-21') === true, 'đúng 28 ngày: trong');
    assert(d.trongCuaSoCase('2026-08-23', '2026-09-21') === false, '29 ngày: ngoài');
    assert(d.luotSinhViec({ lich_su: 0, tuanKetThuc: null, created_at: '2026-09-21' }), 'lượt thường luôn sinh việc');
    assert(!d.luotSinhViec({ lich_su: 1, tuanKetThuc: '2026-07-05', created_at: '2026-09-21' }), 'lịch sử ngoài cửa sổ');
    assert(d.luotSinhViec({ lich_su: 1, tuanKetThuc: '2026-09-13', created_at: '2026-09-21' }), 'lịch sử trong cửa sổ');
  });
  check('PR-MT (1) · kiemSoMtMoi / soMtKeTiep: liền mạch, số huỷ không điểm dùng lại, huỷ còn điểm giữ số (T36, Q-B)', () => {
    const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
    assert(d.kiemSoMtMoi([], 1) === null && d.soMtKeTiep([]) === 1, 'MT1 khi rỗng');
    assert(/Chưa có MT2/.test(d.kiemSoMtMoi([L(1)], 3) ?? ''), 'MT3 khi mới có MT1');
    assert(d.kiemSoMtMoi([L(1), L(2, 'cancelled')], 2) === null && d.soMtKeTiep([L(1), L(2, 'cancelled')]) === 2, 'MT2 huỷ không điểm → dùng lại');
    assert(/không dùng lại/.test(d.kiemSoMtMoi([L(1), L(2, 'cancelled', true)], 2) ?? ''), 'MT2 huỷ còn điểm → chặn');
    assert(d.soMtKeTiep([L(1), L(2, 'cancelled', true)]) === 3, 'huỷ còn điểm giữ số');
    assert(/đã có MT1/.test(d.kiemSoMtMoi([L(1)], 1) ?? ''), 'trùng');
    assert(d.kiemSoMtMoi([], 0) === 'Số MT không hợp lệ.', 'số 0');
  });
  check('PR-MT (1) · cachHuyLuot: lớn nhất chưa điểm → cả lượt; có điểm / ở giữa → phần còn lại (M-12)', () => {
    const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
    const ds = [L(1, 'completed', true), L(2), L(3)];
    assert(d.cachHuyLuot(ds[2], ds) === 'ca-luot', 'MT3 lớn nhất chưa điểm');
    assert(d.cachHuyLuot(ds[1], ds) === 'phan-con-lai', 'MT2 ở giữa');
    const ds2 = [L(1), L(2, 'planned', true)];
    assert(d.cachHuyLuot(ds2[1], ds2) === 'phan-con-lai', 'lớn nhất có điểm');
    assert(d.cachHuyLuot(L(2, 'cancelled'), ds) === null, 'đã huỷ');
  });
  check('PR-MT (1) · hanDuyetDoiLan2 = CN tuần chứa ngày gửi (T42, K4-04)', () => {
    assert(d.hanDuyetDoiLan2('2026-09-28') === '2026-10-04', d.hanDuyetDoiLan2('2026-09-28'));
    assert(d.hanDuyetDoiLan2('2026-10-04') === '2026-10-04', 'CN → chính nó');
  });
  check('PR-MT (1) · kỳ vọng RF = target; PA quy chế hàng MT3, Phối hợp hàng MT4 (M2, T4, Q27-4)', () => {
    assert(d.expectationDelta(1, 'RF') === 0 && d.expectationDelta(2, 'RF') === 0, 'RF');
    assert(d.expectationDelta(1, 'LT1') === 1 && d.expectationDelta(1) === 1 && d.expectationDelta(2, null) === 0.5, 'LT giữ');
    const pa = d.academicSupportFor(1, 2, 'RF');
    assert(pa?.kind === 'tutor' && pa.span === 'until_exam' && pa.description === 'Tutor · đến lúc thi', JSON.stringify(pa));
    assert(d.academicSupportFor(1, 2)?.span === 'one_month', 'LT MT1 giữ Tự học');
    assert(JSON.stringify(d.sosCoordinationFor(1, 3, 'RF')) === JSON.stringify(d.DEFAULT_SOS_COORDINATION[4][3]), 'Phối hợp hàng 4');
  });
  check('PR-MT (1) · mocKeTiep: planned, không lịch sử, từ tuần này, sớm nhất (K2-05, K2-31)', () => {
    const M = (attempt_no: number, weekStart: string, lich_su = 0, status = 'planned') => ({ attempt_no, weekStart, lich_su, status });
    assert(d.mocKeTiep([M(3, '2026-12-14'), M(1, '2026-10-12'), M(2, '2026-11-16')], '2026-09-29')?.attempt_no === 1, 'MT1');
    assert(d.mocKeTiep([M(1, '2026-08-03', 1), M(2, '2026-10-12')], '2026-09-29')?.attempt_no === 2, 'bỏ MT1 lịch sử');
    assert(d.mocKeTiep([M(1, '2026-09-28')], '2026-09-29')?.attempt_no === 1, 'tuần này vẫn tính');
    assert(d.mocKeTiep([M(1, '2026-09-21')], '2026-09-29') === null, 'tuần trước không tính');
  });

  const mig: any = await import('../migrate/prMt.ts');
  const { default: Database } = await import('libsql');
  check('PR-MT (2) · migratePrMt: DB cũ thêm cột lich_su mặc định 0, chạy lại không đổi gì; DB từ schema.sql đã có cột (T78)', () => {
    const mem = new Database(':memory:');
    mem.exec('CREATE TABLE assessment_attempts (id INTEGER PRIMARY KEY, attempt_no INTEGER)');
    mem.exec('INSERT INTO assessment_attempts (attempt_no) VALUES (1)');
    const lan1: string[] = []; mig.migratePrMt(mem, lan1);
    const lan2: string[] = []; mig.migratePrMt(mem, lan2);
    assert(lan1.length === 1 && lan2.length === 0, `${lan1.length}/${lan2.length}`);
    assert((mem.prepare('SELECT lich_su FROM assessment_attempts').get() as any).lich_su === 0, 'dòng cũ = lượt thường');
    mem.close();
    const lan3: string[] = []; mig.migratePrMt(t.conn, lan3);
    assert(lan3.length === 0, 'schema.sql đã có cột');
  });
  check('PR-MT (2) · chạy thử: lotrinhNhaySo bắt lộ trình MT1 + MT3; luotHuyGiua bắt lượt huỷ ở giữa (K4-09 phần báo)', () => {
    const now = '2026-09-29';
    const sid = Number(t.conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, status, created_at)
      VALUES ('PRMT-NHAY', 'Em Nhảy Số', 'em nhay so', 'active', ?)`).run(now).lastInsertRowid);
    const cid = Number(t.conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at)
      VALUES (?, 1, 'LT1', ?, 'completed', ?)`).run(sid, now, now).lastInsertRowid);
    const them = (n: number, status: string) => t.conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, status, created_at)
      VALUES (?,?,?, 'mock', ?, ?)`).run(cid, sid, n, status, now);
    them(1, 'done'); them(2, 'cancelled'); them(3, 'planned');
    const nhay = mig.lotrinhNhaySo(t.conn).find((x: any) => x.hv === 'PRMT-NHAY');
    assert(nhay?.so === 'MT1, MT3', JSON.stringify(nhay));
    const huy = mig.luotHuyGiua(t.conn).filter((x: any) => x.hv === 'PRMT-NHAY');
    assert(huy.length === 1 && huy[0].mt === 'MT2' && !huy[0].coDiem, JSON.stringify(huy));
  });

  // ---------------------------------------------------------------- khối 3: tự tạo MT mặc định
  const { conn, P, TODAY, addDays, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const luat: any = await import('../classes/luatLoTrinh.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const mtMd: any = await import('../fasttrack/mtMacDinh.ts');
  const week: any = await import('../platform/week.ts');
  const { assertThrows } = t;
  /** Lượt MT của lộ trình đang chạy: số, tuần thi (thứ Hai), lịch sử, số kỹ năng cùng tuần đó. */
  const luotCua = (sid: number) => conn.prepare(
    `SELECT a.id, a.attempt_no AS no, p.week_start AS tuan, a.lich_su, a.plan_source, a.cycle_id,
            (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.planned_period_id = a.planned_period_id) AS kn
       FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
       JOIN report_periods p ON p.id = a.planned_period_id
      WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
  const them = (lop: string, ten: string, startWeek: string) => {
    const r = intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, startWeek }], dateFormat: 'iso' });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  const tuanNay = week.mondayOf(TODAY);
  const sA = them('MB FT 101', 'PRMT Em Mới LT1', tuanNay);
  check('PR-MT (3) · Thêm HV lớp FT LT1, tuần bắt đầu tuần này → MT1/2/3 tuần học 6/12/16, lượt thường, 4 kỹ năng cùng tuần (M1, T33)', () => {
    const ds = luotCua(sA);
    const muon = [6, 12, 16].map((w) => addDays(tuanNay, 7 * (w - 1)));
    assert(ds.map((x) => x.no).join() === '1,2,3', JSON.stringify(ds));
    assert(ds.every((x, i) => x.tuan === muon[i] && x.lich_su === 0 && x.kn === 4 && x.plan_source === 'auto'), JSON.stringify(ds));
  });
  check('PR-MT (3) · Thêm HV lớp RF → đúng 2 lượt tuần học 4/8 (M1, Q27-4)', () => {
    const ds = luotCua(them('MB FT RF 12', 'PRMT Em Mới RF', tuanNay));
    assert(ds.map((x) => `${x.no}:${x.tuan}`).join() === `1:${addDays(tuanNay, 21)},2:${addDays(tuanNay, 49)}`, JSON.stringify(ds));
  });
  const sH1 = them('MB FT 101', 'PRMT Em Cũ H1', addDays(tuanNay, -7 * 22));
  check('PR-MT (3) · H1: tuần bắt đầu 22 tuần trước → 3 lượt MT lịch sử; taoMtMacDinh chạy lại → [] (T34, M1)', () => {
    const ds = luotCua(sH1);
    assert(ds.length === 3 && ds.every((x) => x.lich_su === 1), JSON.stringify(ds));
    assert(mtMd.taoMtMacDinh(ds[0].cycle_id, { actorUserId: null }).length === 0, 'chạy lại tạo trùng');
    const j = conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE student_id = ? AND event_type = 'mock_scheduled'`).get(sH1) as any;
    assert(j.n === 1, `một dòng hành trình cho cả lộ trình, đang ${j.n}`);
  });
  check('PR-MT (3) · ngayTao truyền vào là mốc lịch sử (K4-02); daThiToiMt kéo tới MT5; ngoài 0–8 bị chặn', () => {
    const sid = them('MB FT 101', 'PRMT Em Ngày Tạo', tuanNay);
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
    conn.prepare('DELETE FROM attempt_schedule_history WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE cycle_id = ?)').run(cy.id);
    conn.prepare('DELETE FROM attempt_skills WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE cycle_id = ?)').run(cy.id);
    conn.prepare('DELETE FROM assessment_attempts WHERE cycle_id = ?').run(cy.id);
    const kq = mtMd.taoMtMacDinh(cy.id, { actorUserId: null, ngayTao: addDays(tuanNay, 7 * 6), daThiToiMt: 5 });
    assert(kq.map((x: any) => `${x.attemptNo}${x.lichSu ? 'LS' : ''}`).join() === '1LS,2,3,4,5', JSON.stringify(kq));
    assertThrows(() => mtMd.taoMtMacDinh(cy.id, { actorUserId: null, daThiToiMt: 9 }), /0 đến 8/, 'daThiToiMt 9');
  });
  check('PR-MT (3) · Đổi tuần bắt đầu (GVCN sửa): MT1 đã có điểm đứng yên, MT2/MT3 dời; hành trình nói rõ (K2-33, Q6)', () => {
    const ds = luotCua(sA);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 5.5, ?)`).run(ds[0].id, TODAY);
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sA) as any;
    cycles.updateCycle(P.coreTeacher, cy.id, { startPeriodId: week.ensurePeriod(addDays(tuanNay, 7)).id });
    const sau = luotCua(sA);
    assert(sau[0].tuan === ds[0].tuan, 'MT1 có điểm bị dời');
    assert(sau[1].tuan === addDays(ds[1].tuan, 7) && sau[2].tuan === addDays(ds[2].tuan, 7), JSON.stringify(sau));
    const j = conn.prepare(`SELECT detail FROM journey_events WHERE student_id = ? AND title = 'Đổi tuần bắt đầu học' ORDER BY id DESC`).get(sA) as any;
    assert(/^MT2, MT3 dời sang W\d [A-Z]{3}, W\d [A-Z]{3}/.test(j?.detail ?? ''), j?.detail);
  });
  check('PR-MT (3) · Mở lộ trình tay (createCycle) ghi tuần bắt đầu và tạo lịch MT mặc định (Q5)', () => {
    const cy = cycles.createCycle(P.admin, { studentId: sH1, route: 'LT2', targetScore: 7, startedAt: TODAY });
    assert(cy.start_period_id, 'thiếu tuần bắt đầu');
    assert(luotCua(sH1).map((x) => x.no).join() === '1,2,3', JSON.stringify(luotCua(sH1)));
  });
  check('PR-MT (3) · Chuyển em LT1 → lớp RF: lộ trình mới RF có MT1/MT2, Case đang mở đi theo lộ trình mới, không Case trùng (K5-60)', () => {
    const c = conn.prepare(
      `SELECT sc.id, sc.student_id, sc.category, sc.cycle_id FROM sos_cases sc
         JOIN learning_cycles cy ON cy.id = sc.cycle_id AND cy.status = 'active' AND cy.route = 'LT1'
         JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
         JOIN classes cl ON cl.id = e.class_id AND cl.is_fast_track = 1
        WHERE sc.status != 'done' AND sc.dedup_key IS NOT NULL
          AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = sc.student_id AND x.status = 'active') = 1
          AND (SELECT COUNT(*) FROM learning_cycles x WHERE x.student_id = sc.student_id AND x.status = 'active') = 1 LIMIT 1`).get() as any;
    assert(c, 'seed thiếu em FT LT1 có Case mở');
    luat.apDungMotDong(P.admin, { sid: c.student_id, toClassId: classId('MB FT RF 12'), ngay: TODAY, boiCanh: 'giua-khoa' });
    const moi = conn.prepare(`SELECT id, route FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(c.student_id) as any;
    assert(moi.route === 'RF' && moi.id !== c.cycle_id, JSON.stringify(moi));
    assert(luotCua(c.student_id).map((x) => x.no).join() === '1,2', JSON.stringify(luotCua(c.student_id)));
    const sau = conn.prepare('SELECT cycle_id, dedup_key FROM sos_cases WHERE id = ?').get(c.id) as any;
    assert(sau.cycle_id === moi.id && sau.dedup_key === `a:${c.student_id}:${moi.id}:${c.category}`, JSON.stringify(sau));
    const trung = conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND category = ? AND status != 'done'`).get(c.student_id, c.category) as any;
    assert(trung.n === 1, `Case ${c.category} mở: ${trung.n}`);
    assert(conn.prepare(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'route_changed'`).get(c.id), 'thiếu mốc Sang lộ trình');
  });

  // ---------------------------------------------------------------- khối 4: kỳ vọng / PA quy chế / Phối hợp theo lộ trình của lượt
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const scoringSvc: any = await import('../fasttrack/scoring.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const ptLop: any = await import('../classes/phanTichLop.ts');
  const tongHopSvc: any = await import('../phanTich/tongHop.ts');
  /** Em mới có MT1 ĐÚNG tuần này (lượt thường) — chọn tuần bắt đầu lùi (tuần học của MT1 − 1) tuần. */
  const emMt1TuanNay = (lop: string, ten: string, route: string) => {
    const sid = them(lop, ten, addDays(tuanNay, -7 * (d.tuanHocCuaMt(route, 1) - 1)));
    return { sid, a: luotCua(sid)[0] };
  };
  const nhap = (a: any, b: { l: number; r: number; w: number; s: number }) => {
    attemptsSvc.saveScore(P.admin, a.id, 'listening', { rawScore: scoringSvc.LISTENING_BY_RAW.indexOf(b.l) });
    attemptsSvc.saveScore(P.admin, a.id, 'reading', { rawScore: scoringSvc.READING_BY_RAW.indexOf(b.r) });
    for (const k of ['writing1', 'writing2']) attemptsSvc.saveScore(P.admin, a.id, k, { criteria: [b.w, b.w, b.w, b.w] });
    attemptsSvc.saveScore(P.admin, a.id, 'speaking', { criteria: [b.s, b.s, b.s, b.s] });
    return attemptsSvc.attemptDetail(P.admin, a.id).result;
  };
  const rf1 = emMt1TuanNay('MB FT RF 12', 'PRMT RF D1', 'RF');
  const lt1 = emMt1TuanNay('MB FT 101', 'PRMT LT1 so sánh', 'LT1');
  check('PR-MT (4) · RF target 6.5, MT1 L 6.0 → dưới kỳ vọng 6.5, SOS 1; LT1 cùng điểm → kỳ vọng 5.5, đạt (M2, Q27-4)', () => {
    assert(rf1.a.no === 1 && rf1.a.lich_su === 0 && lt1.a.lich_su === 0, JSON.stringify([rf1.a, lt1.a]));
    const r = nhap(rf1.a, { l: 6, r: 7, w: 7, s: 7 });
    assert(r.expectation === 6.5 && r.sosLevel === 1, `RF: kỳ vọng ${r.expectation}, SOS ${r.sosLevel}`);
    const l = nhap(lt1.a, { l: 6, r: 7, w: 7, s: 7 });
    assert(l.expectation === 5.5 && l.sosLevel === 0, `LT1: kỳ vọng ${l.expectation}, SOS ${l.sosLevel}`);
  });
  const rf2 = emMt1TuanNay('MB FT RF 12', 'PRMT RF D1 SOS2', 'RF');
  check('PR-MT (4) · RF MT1 SOS 2 → PA quy chế `Tutor · đến lúc thi` (hàng MT3), Phối hợp theo hàng MT4 (T4, D1)', () => {
    const r = nhap(rf2.a, { l: 6, r: 6, w: 7, s: 7 });
    assert(r.sosLevel === 2, `SOS ${r.sosLevel}`);
    const pa = conn.prepare(
      `SELECT ci.description FROM case_interventions ci JOIN sos_cases sc ON sc.id = ci.case_id
        WHERE sc.student_id = ? AND ci.preset = 1`).all(rf2.sid) as any[];
    assert(pa.length === 2 && pa.every((x) => x.description === 'Tutor · đến lúc thi'), JSON.stringify(pa));
    const ph = (conn.prepare('SELECT kind FROM sos_coordination_actions WHERE attempt_id = ? ORDER BY kind').all(rf2.a.id) as any[]).map((x) => x.kind);
    assert(JSON.stringify(ph) === JSON.stringify([...d.DEFAULT_SOS_COORDINATION[4][2]].sort()), JSON.stringify(ph));
  });
  check('PR-MT (4) · bảng Case, Phân tích lớp, Tổng hợp Test cùng ra kỳ vọng 6.5 cho em RF (K5-49)', () => {
    const row = casesSvc.skillSupportBoard(P.admin, rf1.sid).rows.find((x: any) => x.category === 'listening');
    assert(row?.expectation === 6.5 && row.gap === -0.5, JSON.stringify(row && { e: row.expectation, g: row.gap }));
    const o = ptLop.phanTichLop(P.admin, classId('MB FT RF 12')).o['listening|mt1'];
    assert(o?.tong === 2 && o.dat === 0, JSON.stringify(o));
    const th = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 4, classId: classId('MB FT RF 12'), theo: 'lop' });
    assert(th.tong['kn:listening'] === 2, JSON.stringify(th.tong));
  });

  // ---------------------------------------------------------------- khối 5: MT lịch sử không vào nợ / hạn / độ phủ; mốc kế tiếp
  const cham: any = await import('../cham/canCham.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const clsSvc: any = await import('../classes/classes.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const pulse: any = await import('../worklist/branchpulse.ts');
  const standingSvc: any = await import('../students/standing.ts');
  const danhGia: any = await import('../worklist/danhGia.ts');
  const H1_BAT_DAU = addDays(tuanNay, -7 * 22);
  const tuanMtH1 = [6, 12, 16].map((w) => addDays(H1_BAT_DAU, 7 * (w - 1)));
  const MB101 = classId('MB FT 101');
  /** Mọi con số mà một em cũ (MT lịch sử chưa điểm) KHÔNG được làm đổi (M3, K4-01). */
  const chup = () => JSON.stringify({
    lichTest: tuanMtH1.map((ws) => {
      const r = cham.lichTest(P.mbManager, week.ensurePeriod(ws).id, null, TODAY, { phamVi: 'tat-ca' });
      return { tq: r.tongQuan, no: r.no.length, lop: r.lop.map((l: any) => [l.classCode, l.tong, l.conBai, l.quaHan]) };
    }),
    no: (() => { const c = debt.scoreDebtCells(P.admin, TODAY, null); return [c.length, c.filter((x: any) => x.overdue).length]; })(),
    viec: [P.lrTeacher, P.w1Teacher, P.sTeacher].map((u) => mywork.myWork(u).groups.find((g: any) => g.key === 'score')?.items.length ?? 0),
    badge: clsSvc.listClassSummaries(P.mbManager).rows.find((r: any) => r.id === MB101)?.needScores,
    chiSo: ['bai-qua-han-nhap-diem', 'do-phu-danh-gia'].map((id) => { const m = metrics.metricSet(P.admin, id); return [m.n, m.numeratorIds?.length ?? null, m.denominatorIds?.length ?? null]; }),
    pulse: pulse.branchPulse(P.admin).people.map((x: any) => [x.id, x.mtPending, x.mtOverdue]),
  });
  const truoc = chup();
  const r5 = intake.commitIntake(P.admin, { classId: MB101, dateFormat: 'iso',
    rows: [{ fullName: 'PRMT Em Cũ H1b', target: 6.5, startWeek: H1_BAT_DAU, examMonth: '2027-03' }] });
  const sH1b = r5.studentIds[0] as number;
  conn.prepare("UPDATE learning_cycles SET exam_month = '2027-03' WHERE student_id = ?").run(sH1b);   // Thêm HV không nhận tháng thi từ file
  check('PR-MT (5) · H1: thêm em đã học 22 tuần (MT1–MT3 lịch sử chưa điểm) → Lịch Test, Nợ, Việc cần làm, badge, chỉ số, Theo giáo viên KHÔNG đổi (M3, K4-01)', () => {
    assert(luotCua(sH1b).length === 3 && luotCua(sH1b).every((x) => x.lich_su === 1), JSON.stringify(luotCua(sH1b)));
    const sau = chup();
    assert(sau === truoc, `trước ${truoc}\nsau   ${sau}`);
  });
  check('PR-MT (5) · Mốc kế tiếp: em cũ H1 không bật "Thiếu mốc đánh giá"; em mới hôm nay → MT1 (không phải MT3) (K2-05, K2-31)', () => {
    const hang = clsSvc.classRoster(P.mbManager, MB101);
    const h1 = hang.find((x: any) => x.id === sH1b);
    assert(h1 && !h1.missing.some((m: any) => m.key === 'next_milestone') && h1.next === null, JSON.stringify(h1?.missing));
    const moi = them('MB FT 101', 'PRMT Em Sắp Tới', tuanNay);
    assert(standingSvc.standingFor([moi]).get(moi).nextAttemptNo === 1, 'standing: lượt sắp tới phải là MT1');
    const r = clsSvc.classRoster(P.mbManager, MB101).find((x: any) => x.id === moi);
    assert(r?.next?.attemptNo === 1 && !r.missing.some((m: any) => m.key === 'next_milestone'), JSON.stringify(r?.next));
  });
  check('PR-MT (5) · Em FT chưa có target → việc "Điền target" nhóm Thiếu dữ liệu cho GVCN, không hạn (K5-09)', () => {
    const r = intake.commitIntake(P.admin, { classId: MB101, dateFormat: 'iso', rows: [{ fullName: 'PRMT Em Thiếu Target', startWeek: tuanNay }] });
    const sid = r.studentIds[0];
    const g = mywork.myWork(P.coreTeacher).groups.find((x: any) => x.key === 'missing_data');
    const it = g?.items.find((x: any) => x.key === `target:${sid}`);
    assert(it && it.due === null && it.mine, JSON.stringify(it));
  });
  check('PR-MT (5) · "Mới nhất" = số MT lớn nhất của lộ trình, không theo tuần (K5-54)', () => {
    const sid = them('MB FT 101', 'PRMT Em Mới Nhất', tuanNay);
    const [m1, m2] = luotCua(sid);
    const tuan = (id: number, ws: string) => {
      const pid = week.ensurePeriod(ws).id;
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(pid, id);
      conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(pid, id);
    };
    tuan(m1.id, addDays(tuanNay, -7)); tuan(m2.id, addDays(tuanNay, -14));   // MT2 nằm tuần SỚM hơn MT1
    for (const a of [m1, m2]) conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'speaking', 6, ?)`).run(a.id, TODAY);
    assert(danhGia.latestAttempts([sid], 'valid', TODAY).get(sid)?.attemptNo === 2, 'phải chọn MT2');
  });
}
