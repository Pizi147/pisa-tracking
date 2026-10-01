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
    const r = intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, startWeek, email: 'hv@demo.test' }] });
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
    assert(o?.tong >= 2 && o.dat === 0, JSON.stringify(o));   // bộ demo có thêm em RF Đặng Quốc Bảo (MT1 L 6.0 — cũng dưới 6.5)
    const th = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 4, classId: classId('MB FT RF 12'), theo: 'lop' });
    assert(th.tong['kn:listening'] >= 2 && th.tong.dat === 0, JSON.stringify(th.tong));   // + em RF Đặng Quốc Bảo của bộ demo
  });

  // ---------------------------------------------------------------- khối 5: MT lịch sử không vào nợ / hạn / độ phủ; mốc kế tiếp
  const cham: any = await import('../cham/canCham.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const clsSvc: any = await import('../classes/classes.ts');
  const metrics: any = await import('../worklist/metrics.ts');
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
  });
  const truoc = chup();
  const r5 = intake.commitIntake(P.admin, { classId: MB101,
    rows: [{ fullName: 'PRMT Em Cũ H1b', target: 6.5, startWeek: H1_BAT_DAU, email: 'hv@demo.test' }] });
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
    const r = intake.commitIntake(P.admin, { classId: MB101, rows: [{ fullName: 'PRMT Em Thiếu Target', startWeek: tuanNay, email: 'hv@demo.test' }] });
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

  // ---------------------------------------------------------------- khối 6: GVCN nhập MT lịch sử, R11 7 ngày, không "-", cửa sổ Case
  const perm: any = await import('../permissions.ts');
  const hoanTatSvc: any = await import('../fasttrack/hoanTat.ts');
  const GVCN = P.coreTeacher;
  const monKhongDay = d.ENTRY_SKILLS.find((k: string) => !perm.mySkills(GVCN, MB101, [k]).length && k === 'speaking') ?? 'speaking';
  const mt2H1 = luotCua(sH1b)[1];
  const tieuChi = (b: number) => ({ criteria: [b, b, b, b] });
  check('PR-MT (6) · GVCN nhập ô TRỐNG môn mình không dạy của MT lịch sử → được (nhật ký score.lich_su); sửa lại → từ chối; QL sửa có lý do → được (K5-31, Q8, T34)', () => {
    assert(!perm.mySkills(GVCN, MB101, [monKhongDay]).length, `tiền đề: GVCN không dạy ${monKhongDay}`);
    attemptsSvc.saveScore(GVCN, mt2H1.id, monKhongDay, tieuChi(5));
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? ORDER BY id DESC`).get(mt2H1.id) as any;
    assert(nk?.action === 'score.lich_su' && d.nhanHanhDongNhatKy('score.lich_su') === 'Nhập điểm MT lịch sử', JSON.stringify(nk));
    assertThrows(() => attemptsSvc.saveScore(GVCN, mt2H1.id, monKhongDay, { ...tieuChi(6), lyDo: 'Gõ nhầm tiêu chí khi nhập bù' }),
      /phân công/, 'GVCN sửa ô đã có điểm của MT lịch sử');
    attemptsSvc.saveScore(P.mbManager, mt2H1.id, monKhongDay, { ...tieuChi(6.5), lyDo: 'Gõ nhầm tiêu chí khi nhập bù' });
    const cells = attemptsSvc.attemptDetail(GVCN, mt2H1.id).cells;
    assert(cells.filter((c: any) => c.skill !== monKhongDay).every((c: any) => c.canEdit) && cells.every((c: any) => c.progress === 'lich_su' || c.band !== null),
      'GVCN thấy ô trống cả 4 kỹ năng mở, tiến độ "lịch sử"');
  });
  check('PR-MT (6) · Lượt thường: GVCN không dạy môn đó vẫn bị từ chối như cũ', () => {
    assertThrows(() => attemptsSvc.saveScore(GVCN, luotCua(sA)[1].id, monKhongDay, tieuChi(6)), /phân công/, 'lượt thường');
  });
  check('PR-MT (6) · MT lịch sử không nhận dấu "-" (K4-20)', () => {
    assertThrows(() => attemptsSvc.saveScore(P.mbManager, mt2H1.id, 'listening', { noShow: true }),
      /MT lịch sử không nhận dấu "-" — để trống ô nếu không có dữ liệu\./, 'dấu "-" trên MT lịch sử');
  });
  check('PR-MT (6) · H2: MT2 lịch sử cách 10+ tuần, đủ 4 kỹ năng SOS 2 → KHÔNG Case, không tín hiệu, không Phối hợp (M4, M-14)', () => {
    attemptsSvc.saveScore(P.mbManager, mt2H1.id, 'listening', { rawScore: scoringSvc.LISTENING_BY_RAW.indexOf(5) });
    attemptsSvc.saveScore(P.mbManager, mt2H1.id, 'reading', { rawScore: scoringSvc.READING_BY_RAW.indexOf(5) });
    for (const k of ['writing1', 'writing2']) attemptsSvc.saveScore(P.mbManager, mt2H1.id, k, tieuChi(7));
    const r = attemptsSvc.attemptDetail(P.mbManager, mt2H1.id).result;
    assert(r.sosLevel === 2, `SOS ${r.sosLevel}`);
    const n = (sql: string) => (conn.prepare(sql).get(mt2H1.id) as any).n;
    assert(n('SELECT COUNT(*) n FROM case_signals WHERE attempt_id = ?') === 0, 'có tín hiệu');
    assert(n('SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ?') === 0, 'có Phối hợp');
    assert((conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?').get(sH1b) as any).n === 0, 'có Case');
  });
  const studentsSvc: any = await import('../students/students.ts');
  const profileSvc: any = await import('../students/profile.ts');
  check('PR-MT (6) · M-14: MT lịch sử ngoài 4 tuần có SOS 2 KHÔNG làm "SOS hiện tại" — bảng HV lớp, bộ đếm, đầu hồ sơ, kết quả gần nhất; mốc tiếp theo bỏ MT lịch sử', () => {
    const st = standingSvc.standingFor([sH1b]).get(sH1b);
    assert(st.attemptId === null && st.sosLevel === null, `standing ${JSON.stringify({ a: st.attemptId, sos: st.sosLevel })}`);
    assert(studentsSvc.latestResult(sH1b) === null, 'latestResult lấy MT lịch sử ngoài cửa sổ');
    const hs = profileSvc.studentProfile(P.mbManager, sH1b);
    assert(hs.attempts.find((a: any) => a.id === mt2H1.id)?.sinhViec === false, 'hồ sơ: cờ sinhViec của MT2 lịch sử');
    assert(d.ketQuaTestGanNhat(hs.attempts, TODAY) === null, 'đầu hồ sơ: "Kết quả Test gần nhất" lấy MT lịch sử ngoài cửa sổ');
    assert(hs.nextCheckpoint === null, `mốc tiếp theo = ${JSON.stringify(hs.nextCheckpoint)}`);
  });
  check('PR-MT (6) · R11 MT lịch sử: nhập ô cuối hôm nay → chưa khoá; hôm nay + 8 → khoá (K5-21, K4-20)', () => {
    conn.prepare('UPDATE assessment_scores SET entered_at = ? WHERE attempt_id = ?').run(`${TODAY}T03:00:00.000Z`, mt2H1.id);
    assert(hoanTatSvc.dotHoanTat(mt2H1.id, TODAY).hoanTat === false, 'hôm nay đã khoá');
    assert(hoanTatSvc.dotHoanTat(mt2H1.id, addDays(TODAY, 8)).hoanTat === true, 'sau 8 ngày chưa khoá');
  });
  const sH3 = them('MB FT 101', 'PRMT Em H3', addDays(tuanNay, -7 * (16 - 1) - 14));
  check('PR-MT (6) · H3: MT3 lịch sử cách 2 tuần có SOS → Case + PA quy chế + Phối hợp, ngày phát hiện = hôm nay (M4, Q7)', () => {
    const mt3 = luotCua(sH3)[2];
    assert(mt3.no === 3 && mt3.lich_su === 1, JSON.stringify(mt3));
    nhap(mt3, { l: 5, r: 5, w: 7, s: 7 });
    const cs = conn.prepare('SELECT id, detected_at FROM sos_cases WHERE student_id = ?').all(sH3) as any[];
    assert(cs.length === 2 && cs.every((c) => String(c.detected_at).slice(0, 10) === TODAY), JSON.stringify(cs));
    assert((conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ? AND preset = 1').get(cs[0].id) as any).n === 1, 'PA quy chế');
    assert((conn.prepare('SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ?').get(mt3.id) as any).n > 0, 'Phối hợp');
  });

  // ---------------------------------------------------------------- khối 7: đánh số liền mạch, huỷ cả lượt / huỷ phần còn lại (D6)
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const QL = P.mbManager;
  const t4 = (id: number) => ({ listening: id, reading: id, writing: id, speaking: id });
  const tuanXa = (n: number) => week.ensurePeriod(addDays(tuanNay, 7 * n)).id;
  const s7 = them('MB FT 101', 'PRMT Em Đánh Số', tuanNay);
  const [m1, m2, m3] = luotCua(s7);
  check('PR-MT (7) · Huỷ cả lượt chỉ với lượt lớn nhất chưa điểm; MT3 huỷ rồi tạo lại → CÙNG id, số MT3 (Q-B, M-12)', () => {
    assertThrows(() => attemptsSvc.huyLuot(QL, m2.id, { lyDo: 'Thử huỷ ở giữa', cach: 'ca-luot' }), /Chỉ huỷ cả lượt được với MT cuối cùng/, 'MT2 khi còn MT3');
    const kq = attemptsSvc.huyLuot(QL, m3.id, { lyDo: 'Em xin hoãn MT3' });
    assert(kq.cach === 'ca-luot', JSON.stringify(kq));
    const lai = attemptsSvc.createAttempt(QL, { studentId: s7, periodId: tuanXa(20) });
    assert(lai.id === m3.id && lai.attempt_no === 3 && lai.status === 'planned', JSON.stringify(lai));
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? ORDER BY id DESC`).get(m3.id) as any;
    assert(nk.action === 'attempt.recreate', nk.action);
  });
  check('PR-MT (7) · MT3 khi mới có MT1 → chặn ở MỘT chốt: POST /attempts, Kế hoạch Test xếp mới, xếp hàng loạt (K4-08, YC-13.3)', () => {
    attemptsSvc.huyLuot(QL, m3.id, { lyDo: 'Huỷ để thử đánh số' });
    attemptsSvc.huyLuot(QL, m2.id, { lyDo: 'Huỷ để thử đánh số' });
    assertThrows(() => attemptsSvc.createAttempt(QL, { studentId: s7, attemptNo: 3, periodId: tuanXa(20) }), /Chưa có MT2/, 'POST /attempts');
    assertThrows(() => keHoach.xepMoi(QL, { studentId: s7, attemptNo: 3, tuan: t4(tuanXa(20)), force: true }), /Chưa có MT2/, 'xep-moi');
    const xt = keHoach.xepHangLoat(QL, { classId: MB101, attemptNo: 3, studentIds: [s7], tuan: t4(tuanXa(20)), xemTruoc: true });
    assert(xt.dong[0].hanhDong === 'loi' && /Chưa có MT2/.test(xt.dong[0].loi), JSON.stringify(xt.dong[0]));
    const luu = keHoach.xepHangLoat(QL, { classId: MB101, attemptNo: 3, studentIds: [s7], tuan: t4(tuanXa(20)), force: true });
    assert(luu.daLuu === 0 && luotCua(s7).length === 1, 'hàng loạt đã tạo MT3');
    assert(keHoach.luoiFT(QL, MB101).hang.find((h: any) => h.studentId === s7).soKeTiep === 2, 'lưới: "+ xếp" chỉ ở MT2');
  });
  check('PR-MT (7) · Huỷ phần còn lại MT2 có L R → W S huỷ, số và trạng thái giữ; Case có điểm thật KHÔNG đóng (Q12, Q13)', () => {
    const sid = them('MB FT 101', 'PRMT Em Huỷ Phần', tuanNay);
    const mt2 = luotCua(sid)[1];
    attemptsSvc.saveScore(P.admin, mt2.id, 'listening', { rawScore: scoringSvc.LISTENING_BY_RAW.indexOf(5) });
    attemptsSvc.saveScore(P.admin, mt2.id, 'reading', { rawScore: scoringSvc.READING_BY_RAW.indexOf(6) });
    const cid = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, status, created_at) VALUES (?, ?, 'listening', 'open', ?)`)
      .run(sid, mt2.cycle_id, TODAY).lastInsertRowid);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, 'opened', ?, 2, ?, ?)`)
      .run(cid, mt2.id, TODAY, TODAY);
    assert(attemptsSvc.attemptDetail(QL, mt2.id).viewer.huyLuot.cachDuoc === 'phan-con-lai', 'MT2 ở giữa, có điểm');
    const kq = attemptsSvc.huyLuot(QL, mt2.id, { lyDo: 'Em nghỉ phần còn lại' });
    assert(kq.cach === 'phan-con-lai' && kq.kyNangHuy.sort().join() === 'speaking,writing', JSON.stringify(kq));
    const sau = conn.prepare('SELECT attempt_no, status FROM assessment_attempts WHERE id = ?').get(mt2.id) as any;
    assert(sau.attempt_no === 2 && sau.status === 'planned', JSON.stringify(sau));
    assert((conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(cid) as any).status === 'open', 'Case có điểm thật bị đóng');
  });
  check('PR-MT (7) · Huỷ cả lượt: Phối hợp mở + Case chỉ sinh từ lượt đó → đóng "Lượt đã huỷ"; hộp nói trước đúng số (T67, K4-10)', () => {
    const sid = them('MB FT 101', 'PRMT Em Huỷ Cả Lượt', tuanNay);
    const mt3 = luotCua(sid)[2];
    conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'talk_student', 1, 'pending', ?)`)
      .run(mt3.id, sid, TODAY);
    const cid = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, status, created_at) VALUES (?, ?, 'reading', 'open', ?)`)
      .run(sid, mt3.cycle_id, TODAY).lastInsertRowid);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, 'opened', ?, 3, ?, ?)`)
      .run(cid, mt3.id, TODAY, TODAY);
    const hq = attemptsSvc.attemptDetail(QL, mt3.id).viewer.huyLuot;
    assert(hq.cachDuoc === 'ca-luot' && hq.case === 1 && hq.phoiHop === 1, JSON.stringify(hq));
    attemptsSvc.huyLuot(QL, mt3.id, { lyDo: 'Em chuyển sang học lịch khác' });
    const ph = conn.prepare('SELECT status, remove_reason_code FROM sos_coordination_actions WHERE attempt_id = ?').get(mt3.id) as any;
    assert(ph.status === 'removed' && ph.remove_reason_code === 'system_luot_huy', JSON.stringify(ph));
    const c = conn.prepare('SELECT status, system_close_reason FROM sos_cases WHERE id = ?').get(cid) as any;
    assert(c.status === 'done' && c.system_close_reason === 'luot_da_huy' && d.SYSTEM_CLOSE_REASON_LABEL.luot_da_huy === 'Lượt đã huỷ', JSON.stringify(c));
  });

  // ---------------------------------------------------------------- khối 8: dời do vắng — đi từ dấu "-" (K4-04)
  const absence: any = await import('../fasttrack/absence.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const demoCfg: any = await import('../demoConfig.ts');
  const s8 = them('MB FT 101', 'PRMT Em Vắng', tuanNay);
  const a8 = luotCua(s8)[0];
  {
    const w = week.ensurePeriod('2026-09-07').id;   // tuần thi đã qua (07–13/09)
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(w, a8.id);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(w, a8.id);
  }
  const lich = (skill: string) => conn.prepare(
    `SELECT ask.sit_status, ask.absence_move_count AS lan, p.week_start AS tuan FROM attempt_skills ask
       JOIN report_periods p ON p.id = ask.planned_period_id WHERE ask.attempt_id = ? AND ask.skill = ?`).get(a8.id, skill) as any;
  check('PR-MT (8) · GVBM gõ "-" L R W1 W2 tuần 07/09 → chốt thứ Hai → MÁY tự dời sang tuần kế tiếp, vắng lần 1; báo GVCN + GVBM đúng kỹ năng (Q-A, K4-03)', () => {
    attemptsSvc.saveScore(P.lrTeacher, a8.id, 'listening', { noShow: true }, '2026-09-09');
    attemptsSvc.saveScore(P.lrTeacher, a8.id, 'reading', { noShow: true }, '2026-09-09');
    attemptsSvc.saveScore(P.w1Teacher, a8.id, 'writing1', { noShow: true }, '2026-09-09');
    attemptsSvc.saveScore(P.w2Teacher, a8.id, 'writing2', { noShow: true }, '2026-09-09');
    absence.settleNoShows(TODAY);
    for (const k of ['listening', 'reading', 'writing']) {
      const l = lich(k);
      assert(l.sit_status === 'scheduled' && l.lan === 1 && l.tuan === '2026-09-14', `${k}: ${JSON.stringify(l)}`);
    }
    const tb = conn.prepare(`SELECT body FROM notifications WHERE user_id = ? AND entity_id = ? AND body LIKE 'Đã tự dời Writing%'`).get(P.w2Teacher.userId, a8.id) as any;
    assert(tb?.body === 'Đã tự dời Writing của PRMT Em Vắng · MT1 sang W3 SEP (vắng lần 1).', JSON.stringify(tb));
    assert(conn.prepare(`SELECT 1 FROM audit_logs WHERE action = 'attempt.absence_auto_move' AND entity_id = ?`).get(a8.id), 'thiếu nhật ký máy tự dời');
  });
  check('PR-MT (8) · Lần 2 → đề nghị chờ QL: hạn hết CN tuần gửi, tuần đích = tuần chưa bắt đầu gần nhất; chữ thẻ cho PR-DUYET (T42, K4-04)', () => {
    attemptsSvc.saveScore(P.lrTeacher, a8.id, 'listening', { noShow: true }, '2026-09-16');
    absence.settleNoShows('2026-09-21');
    const r = conn.prepare(`SELECT r.*, p.week_start AS dich FROM skill_move_requests r JOIN report_periods p ON p.id = r.to_period_id
      WHERE r.attempt_id = ? AND r.skill = 'listening' AND r.status = 'pending'`).get(a8.id) as any;
    assert(r && r.move_no === 2 && r.requested_by === null && r.decide_by === '2026-09-27' && r.dich === '2026-09-28', JSON.stringify(r));
    assert(lich('listening').sit_status === 'absent', 'lịch giữ nguyên tới khi QL duyệt');
    /* PR-Dọn (Q14): `moTaDoiLan2` (chỉ phép kiểm gọi) đã xoá — gọi thẳng `chuTheDoiLan2`, như thẻ Chờ duyệt. */
    const mo = absence.chuTheDoiLan2({ skill: r.skill, attemptNo: 1, moveNo: r.move_no, tuanDich: r.dich, homNay: TODAY });
    assert(mo === 'Dời L · MT1 · lần 2 · Duyệt = L thi W1 OCT', mo);
  });
  check('PR-MT (8) · Hết Chủ nhật mà QL chưa trả lời → đề nghị hết hạn, huỷ phần thi (C09)', () => {
    demoCfg.setConfig('demo_date', '2026-09-28');
    try {
      assert(absence.sweepExpiredMoves() >= 1, 'không quét được đề nghị hết hạn');
    } finally { demoCfg.setConfig('demo_date', TODAY); }
    const r = conn.prepare(`SELECT status FROM skill_move_requests WHERE attempt_id = ? AND skill = 'listening' ORDER BY id DESC`).get(a8.id) as any;
    assert(r.status === 'expired' && lich('listening').sit_status === 'cancelled', `${r.status} · ${lich('listening').sit_status}`);
  });
  check('PR-MT (8) · QL đổi tuần một kỹ năng đang vắng = dời do vắng (+1); lần vắng sau thành lần 2 chờ duyệt (K4-12, Q10)', () => {
    skillSch.setSitStatus(P.mbManager, a8.id, 'speaking', 'absent', 'Em vắng buổi Speaking');
    skillSch.setSkillWeek(P.mbManager, a8.id, 'speaking', week.ensurePeriod('2026-10-05').id, { force: true });
    const l = lich('speaking');
    assert(l.sit_status === 'scheduled' && l.lan === 1 && l.tuan === '2026-10-05', JSON.stringify(l));
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_week_moved_absence' AND field = 'speaking'`).get(a8.id) as any;
    assert(h?.reason === 'Quản lý xếp trực tiếp', JSON.stringify(h));
    skillSch.setSitStatus(P.mbManager, a8.id, 'speaking', 'absent', 'Em lại vắng');
    const kq = absence.requestAbsenceMove(P.coreTeacher, a8.id, ['speaking']);
    assert(kq.outcomes[0].result === 'pending' && kq.outcomes[0].moveNo === 2, JSON.stringify(kq.outcomes[0]));
  });

  // ---------------------------------------------------------------- khối 9: web — nhãn lịch sử, dòng nhắc, không hạn (T34, K2-32)
  const { docSach } = await import('./panelUx3.tests.ts');
  check('PR-MT (9) · Dòng nhắc "MT lịch sử chưa nhập" ở Lịch Test (GVCN lớp) + việc xám không hạn ở Việc cần làm — cùng một hàm (K2-32)', () => {
    const lt = cham.lichTest(GVCN, week.ensurePeriod(tuanNay).id, null, TODAY, { phamVi: 'tat-ca' });
    const n = lt.nhacLichSu.find((x: any) => x.classId === MB101);
    assert(n && n.soEm >= 1 && n.href.startsWith(`/nhap-diem/${MB101}?periodId=`), JSON.stringify(lt.nhacLichSu));
    const viec = mywork.myWork(GVCN).groups.find((g: any) => g.key === 'missing_data')?.items.find((x: any) => x.key === `lich-su:${MB101}`);
    assert(viec && viec.due === null && viec.urgency === 'normal' && viec.count === n.soEm && viec.reason === `Nhập MT lịch sử · ${n.soEm} em · không tính hạn`,
      JSON.stringify(viec));
    assert(!cham.lichTest(P.sTeacher, week.ensurePeriod(tuanNay).id, null, TODAY, { phamVi: 'tat-ca' }).nhacLichSu.length, 'GVBM không phải GVCN mà thấy dòng nhắc');
  });
  check('PR-MT (9) · Quét mã: hồ sơ Mock không vẽ hạn cho MT lịch sử; ô "lich_su" ra "Nhập bù, không có hạn"; không chữ "lich_su" lọt ra màn', () => {
    const mock = docSach('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(/prog !== 'scored' && !d\.lichSu && <div><DeadlinePill/.test(mock), 'MockDetailPage vẽ DeadlinePill cho MT lịch sử');
    assert(/d\.lichSu && <> <ChipLichSu \/>/.test(mock), 'đầu trang thiếu nhãn "lịch sử" cạnh MT');
    assert(/progress === 'lich_su'\) return <Info pending>Nhập bù, không có hạn<\/Info>/.test(docSach('web/src/modules/fasttrack/ScoreEntry.tsx')), 'DeadlinePill thiếu nhánh lịch sử');
    for (const f of ['web/src/modules/test/lichTest/KhoiNo.tsx', 'web/src/modules/test/LichTestTab.tsx', 'web/src/modules/fasttrack/MockDetailPage.tsx',
      'web/src/modules/test/keHoach/ChipKyNang.tsx', 'web/src/modules/students/StudentDetailPage.tsx', 'web/src/ui/Nhan.tsx']) {
      assert(!/>[^<{]*lich_su[^<]*</.test(docSach(f)), `${f}: chữ "lich_su" lọt vào JSX`);
    }
    assert(d.SKILL_PROGRESS_LABEL.lich_su === 'Nhập bù, không có hạn' && !d.awaitingScore('lich_su'), 'nhãn / không nợ');
  });

  // ---------------------------------------------------------------- khối 10: sửa theo rà PR #119
  const signalsSvc: any = await import('../worklist/signals.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const soThieuDiem = () => (signalsSvc.signalsFor(P.admin) as any[]).filter((x) => x.kind === 'missing_scores').reduce((n, x) => n + x.count, 0);
  check('PR-MT (10) · Rà #119 mục 3: "bài Test còn thiếu điểm" và bộ lọc need=missing_scores bỏ MT lịch sử (T34)', () => {
    const truoc = soThieuDiem();
    const sid = them('MB FT 101', 'PRMT Em Rà Thiếu Điểm', addDays(tuanNay, -7 * 22));
    const mt1 = luotCua(sid)[0];
    assert(mt1.lich_su === 1, 'tiền đề: MT1 lịch sử');
    attemptsSvc.saveScore(P.admin, mt1.id, 'listening', { rawScore: scoringSvc.LISTENING_BY_RAW.indexOf(6) });
    assert(soThieuDiem() === truoc, `tín hiệu thiếu điểm ${truoc} → ${soThieuDiem()}`);
    assert(!attemptsSvc.listAttempts(P.admin, { need: 'missing_scores' }).rows.some((r: any) => r.id === mt1.id), 'bộ lọc thiếu điểm có MT lịch sử');
  });
  check('PR-MT (10) · Rà #119 mục 5: xếp MT mới vào tuần đã kết thúc → MT lịch sử ngay lúc tạo; tuần tới → lượt thường', () => {
    const sid = them('MB FT 101', 'PRMT Em Rà Tuần Cũ', tuanNay);
    boLichTuTao(conn, luotCua(sid)[0].cycle_id);
    const cu = attemptsSvc.createAttempt(QL, { studentId: sid, periodId: week.ensurePeriod(addDays(tuanNay, -14)).id });
    assert(cu.attempt_no === 1 && cu.lich_su === 1, JSON.stringify({ no: cu.attempt_no, ls: cu.lich_su }));
    const moi = attemptsSvc.createAttempt(QL, { studentId: sid, periodId: week.ensurePeriod(addDays(tuanNay, 21)).id });
    assert(moi.attempt_no === 2 && moi.lich_su === 0, JSON.stringify({ no: moi.attempt_no, ls: moi.lich_su }));
  });
  check('PR-MT (10) · Rà #119 mục 6: xem trước Thêm HV — lớp FT canPlanWeeks = true, lớp thường false', () => {
    const xt = (lop: number) => intake.previewIntake(P.admin, { classId: lop, rows: [{ fullName: 'PRMT Xem Trước' }] }).canPlanWeeks;
    assert(xt(MB101) === true && xt(classId('MB FOU 12')) === false, `FT ${xt(MB101)} · thường ${xt(classId('MB FOU 12'))}`);
  });
  check('PR-MT (10) · Rà #119 mục 7: MT cuối có kỹ năng đã thi chưa chấm → chỉ "Huỷ phần còn lại"', () => {
    const sid = them('MB FT 101', 'PRMT Em Rà Đã Thi', tuanNay);
    const m3 = luotCua(sid)[2];
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill = 'listening'`).run(m3.id);
    assert(attemptsSvc.attemptDetail(QL, m3.id).viewer.huyLuot.cachDuoc === 'phan-con-lai', 'hộp huỷ vẫn cho huỷ cả lượt');
    assertThrows(() => attemptsSvc.huyLuot(QL, m3.id, { lyDo: 'Thử huỷ', cach: 'ca-luot' }), /chưa thi kỹ năng nào/, 'huỷ cả lượt khi đã thi');
  });
  check('PR-MT (10) · Rà #119 mục 2, 8: huỷ cả lượt rút đề nghị dời; lượt huỷ không lên Việc cần làm / không duyệt được; xếp lại cùng id không bị quét hết hạn huỷ phần thi; created_at = lúc xếp lại', () => {
    const sid = them('MB FT 101', 'PRMT Em Rà Huỷ Đề Nghị', tuanNay);
    const m3 = luotCua(sid)[2];
    const tuan = (conn.prepare('SELECT planned_period_id AS p FROM assessment_attempts WHERE id = ?').get(m3.id) as any).p;
    const deNghi = (lan: number) => Number(conn.prepare(
      `INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
       VALUES (?, 'speaking', ?, ?, ?, ?, ?, 'pending', ?)`).run(m3.id, lan, tuan, tuan, TODAY, TODAY, TODAY).lastInsertRowid);
    const r1 = deNghi(2);
    conn.prepare(`UPDATE assessment_attempts SET created_at = '2026-01-01T00:00:00.000Z' WHERE id = ?`).run(m3.id);
    attemptsSvc.huyLuot(QL, m3.id, { lyDo: 'Em xin hoãn MT3' });
    const tt = (id: number) => (conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(id) as any).status;
    assert(tt(r1) === 'withdrawn', `đề nghị sau huỷ cả lượt: ${tt(r1)}`);
    const r2 = deNghi(3);   // dữ liệu cũ: đề nghị còn treo trên lượt đã huỷ
    /* Hộp Chờ duyệt (PR-DUYET): thẻ Lịch thi của lượt đã huỷ tự đóng ở lần quét, không hiện. */
    yeuCau.taoYeuCau(conn, { loai: 'lich_thi', doiTuongLoai: 'skill_move', doiTuongId: r2, hocVienId: sid, lopId: MB101, nguoiXin: null, hanDuyet: TODAY });
    assert(!yeuCau.hopChoDuyet(QL).the.some((x: any) => x.loai === 'lich_thi' && x.hocVienId === sid), 'hộp Chờ duyệt có thẻ dời của lượt đã huỷ');
    assertThrows(() => absence.decideAbsenceMove(QL, r2, { approve: true }), /Lượt này đã huỷ/, 'duyệt dời của lượt đã huỷ');
    const lai = attemptsSvc.createAttempt(QL, { studentId: sid, periodId: tuanXa(20) });
    assert(lai.id === m3.id && lai.created_at > '2026-06-01' && tt(r2) === 'withdrawn', JSON.stringify({ id: lai.id, c: lai.created_at, r2: tt(r2) }));
    demoCfg.setConfig('demo_date', addDays(TODAY, 14));
    try { absence.sweepExpiredMoves(); } finally { demoCfg.setConfig('demo_date', TODAY); }
    const sp = conn.prepare(`SELECT sit_status FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`).get(m3.id) as any;
    assert(sp.sit_status === 'scheduled', `Speaking của MT3 xếp lại bị huỷ: ${sp.sit_status}`);
  });
  check('PR-MT (10) · Rà #119 mục 4: hai tiến trình chốt "-" cùng lúc (danh sách đọc trước) → chỉ chốt MỘT lần, không đề nghị "lần 2" giả', () => {
    const sid = them('MB FT 101', 'PRMT Em Rà Chạy Đua', tuanNay);
    const a = luotCua(sid)[0];
    const w = week.ensurePeriod('2026-09-07').id;
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(w, a.id);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(w, a.id);
    attemptsSvc.saveScore(P.lrTeacher, a.id, 'listening', { noShow: true }, '2026-09-09');
    const k = conn.prepare(`SELECT k.id, rp.week_end, rp.code FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
      WHERE k.attempt_id = ? AND k.skill = 'listening'`).get(a.id) as any;
    const sc = conn.prepare(`SELECT id FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.id) as any;
    absence.settleNoShows(TODAY);   // tiến trình 1: chốt + máy tự dời sang tuần kế tiếp (bài về "scheduled")
    const lai = absence.settleGroup(conn, a.id, k.id, 'listening', k.week_end, k.code, [sc.id], null, 'Không dự thi', TODAY);   // tiến trình 2, danh sách cũ
    absence.settleNoShows(TODAY);   // chạy lại: vô hại
    const l = conn.prepare('SELECT sit_status, absence_move_count AS lan FROM attempt_skills WHERE id = ?').get(k.id) as any;
    assert(lai === false && l.sit_status === 'scheduled' && l.lan === 1, JSON.stringify({ lai, l }));
    assert(!conn.prepare(`SELECT 1 FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`).get(a.id), 'đề nghị "lần 2" giả');
  });
}
