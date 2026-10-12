/**
 * PHÉP KIỂM PR-OV6b1 — Quản trị › Chương trình: sửa cấu hình chương trình đang có, chép vào lớp lúc tạo (số tuần, mốc, tuần MT FT, ngưỡng
 * đạt), lớp đang chạy giữ lịch; tuần MT FT đọc bản chụp của lớp; migrate điền bản chụp cho mọi lớp cũ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv6b1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const intake: any = await import('../classes/intake.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const week: any = await import('../platform/week.ts');
  const mig: any = await import('../migrate/prOv6b1.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV6b1 · Quản trị › Chương trình: cấu hình, bản chụp lớp, tuần MT FT, ngưỡng đạt, migrate');

  /* Mỗi phép kiểm ghi trong một giao dịch rồi cuộn lại — cấu hình LT1/BE không lọt sang phép kiểm khác. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const tuanNay = week.mondayOf(TODAY);
  let so = 960;
  const lopMoi = (kind: string, route: string | null, startWeek: string) => intake.createClass(P.admin, {
    code: `MB OV6B ${so++}`, branchId: MB, kind, route, isFastTrack: kind === 'FT', startDate: startWeek, startPeriodId: week.ensurePeriod(startWeek).id,
  }) as any;
  const them = (lop: number, ten: string, startWeek: string) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, startWeek, email: 'hv@demo.test', dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  /** Tuần (thứ Hai) của MT1, MT2… còn hiệu lực của em. */
  const tuanMt = (sid: number) => all(
    `SELECT p.week_start AS tuan FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
       JOIN report_periods p ON p.id = a.planned_period_id WHERE a.student_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.attempt_no`, sid,
  ).map((r) => r.tuan as string);
  const theoTuanHoc = (bd: string, ws: number[]) => ws.map((w) => addDays(bd, 7 * (w - 1)));
  const route = (code: string) => sysconfig.listRoutes(true).find((r: any) => r.code === code);
  const ct = (code: string) => sysconfig.listProgrammes(P.admin).find((r: any) => r.code === code);
  const loi400 = (fn: () => unknown): any => {
    try { fn(); } catch (e: any) { return e; }
    return null;
  };

  check('OV6b1-1 · sửa LT1 thành MT tuần 5/10/15 → lớp FT MỚI MT 5/10/15; lớp FT đang chạy giữ 6/12/16, đổi tuần bắt đầu vẫn 6/12/16', () => thu(() => {
    const r = route('LT1');
    sysconfig.saveRoute(P.admin, { code: 'LT1', name: r.name, note: r.note, status: r.status, lichMt: [5, 10, 15] });
    assert(JSON.stringify(route('LT1').lichMt) === '[5,10,15]', `cấu hình ${JSON.stringify(route('LT1').lichMt)}`);
    const moi = lopMoi('FT', 'LT1', tuanNay);
    assert(moi.lich_mt === '[5,10,15]', `bản chụp lớp mới ${moi.lich_mt}`);
    const a = them(moi.id, 'OV6B FT Mới', tuanNay);
    assert(tuanMt(a).join() === theoTuanHoc(tuanNay, [5, 10, 15]).join(), `lớp mới: ${tuanMt(a)}`);
    const cu = classId('MB FT 101');
    assert(one('SELECT lich_mt FROM classes WHERE id = ?', cu).lich_mt === '[6,12,16]', 'lớp đang chạy đổi bản chụp');
    const b = them(cu, 'OV6B FT Cũ', tuanNay);
    assert(tuanMt(b).join() === theoTuanHoc(tuanNay, [6, 12, 16]).join(), `lớp đang chạy: ${tuanMt(b)}`);
    const cy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, b).id;
    cycles.updateCycle(P.admin, cy, { startPeriodId: week.ensurePeriod(addDays(tuanNay, 7)).id });
    assert(tuanMt(b).join() === theoTuanHoc(addDays(tuanNay, 7), [6, 12, 16]).join(), `đổi tuần bắt đầu: ${tuanMt(b)}`);
    /* Câu báo trước "MT sẽ dời" (web) đọc cùng bản chụp: hàm chung nhận danh sách tuần của lớp. */
    assert(d.tuanHocCuaMt([5, 10, 15], 2) === 10 && d.tuanHocCuaMt([5, 10, 15], 4) === 19 && d.tuanHocCuaMt([4, 8], 3) === 12, 'tuanHocCuaMt theo danh sách');
  }));

  check('OV6b1-2 · sửa BE Progress tuần 6 → lớp BE mới tuần 6; lớp BE đang chạy giữ tuần 5', () => thu(() => {
    const be = ct('BE');
    sysconfig.saveProgramme(P.admin, { code: 'BE', name: be.name, weeks: be.weeks, progressWeek: 6, finalWeek: be.weeks, status: be.status, nguongDat: be.nguongDat });
    const moi = lopMoi('BE', null, tuanNay);
    assert(moi.tuan_giua_khoa === 6 && moi.so_tuan === 10, `lớp mới ${moi.so_tuan}/${moi.tuan_giua_khoa}`);
    assert(schedule.classProgress(moi.id).progressWeek === 6, 'lớp mới đọc tuần 6');
    assert(schedule.classProgress(classId('MB BE 08')).progressWeek === 5, `lớp đang chạy ${schedule.classProgress(classId('MB BE 08')).progressWeek}`);
  }));

  check('OV6b1-3 · RF giữ [4,8]; XONG_MT_CUOI_SQL đọc bản chụp của lớp (RF: MT2 là cuối; lớp LT1 [5,10,15]: MT2 chưa phải cuối)', () => thu(() => {
    assert(JSON.stringify(route('RF').lichMt) === '[4,8]', JSON.stringify(route('RF').lichMt));
    const xong = (sid: number) => one(
      `SELECT ${schedule.XONG_MT_CUOI_SQL('cy', 'c')} AS x FROM learning_cycles cy JOIN enrollments e ON e.student_id = cy.student_id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id WHERE cy.student_id = ? AND cy.status = 'active'`, sid).x;
    const diem = (sid: number, no: number) => conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at)
      SELECT id, 'listening', 5.5, ? FROM assessment_attempts WHERE student_id = ? AND attempt_no = ? AND kind = 'mock' AND status != 'cancelled'`).run(TODAY, sid, no);
    const rf = them(classId('MB FT RF 12'), 'OV6B RF', tuanNay);
    diem(rf, 1);
    assert(xong(rf) === 0, 'RF chỉ MT1 → chưa xong');
    diem(rf, 2);
    assert(xong(rf) === 1, 'RF MT2 → xong MT cuối');
    const r = route('LT1');
    sysconfig.saveRoute(P.admin, { code: 'LT1', name: r.name, note: r.note, status: r.status, lichMt: [5, 10, 15, 20] });
    const lt = them(lopMoi('FT', 'LT1', tuanNay).id, 'OV6B LT 4 MT', tuanNay);
    diem(lt, 1); diem(lt, 2); diem(lt, 3);
    assert(xong(lt) === 0, 'lớp 4 MT, có MT3 → chưa xong');
    diem(lt, 4);
    assert(xong(lt) === 1, 'MT4 → xong');
  }));

  check('OV6b1-4 · "Đạt từ" BE = 75 % → lớp BE mới 72 % không đạt; lớp BE cũ 72 % vẫn đạt', () => thu(() => {
    const be = ct('BE');
    assert(be.nguongDat === 70, `mặc định ${be.nguongDat}`);
    sysconfig.saveProgramme(P.admin, { code: 'BE', name: be.name, weeks: be.weeks, progressWeek: 5, finalWeek: be.weeks, status: be.status, nguongDat: 75 });
    const moi = lopMoi('BE', null, tuanNay);
    assert(moi.nguong_dat === 0.75, `bản chụp ${moi.nguong_dat}`);
    const cu = classId('MB BE 08');
    const ketQua = (lop: number) => {
      const sid = them(lop, `OV6B BE ${lop}`, tuanNay);
      const cy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id;
      const id = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, class_id, attempt_no, kind, status, created_at)
        VALUES (?, ?, ?, 99, 'progress', 'planned', ?)`).run(cy, sid, lop, TODAY).lastInsertRowid);
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?, 'listening', 18, 25, ?)`).run(id, TODAY);
      xoaNho();
      const r = regular.regularResultOf(id);
      return { mon: r.skills.find((s: any) => s.skill === 'listening').outcome, nguong: r.passThreshold };
    };
    const m = ketQua(moi.id);
    assert(m.mon === 'fail' && m.nguong === 0.75, `lớp mới: ${JSON.stringify(m)}`);
    const c = ketQua(cu);
    assert(c.mon === 'pass' && c.nguong === 0.7, `lớp cũ: ${JSON.stringify(c)}`);
    /* Dải Cuối khoá đọc cùng ngưỡng: 72 % ở lớp 75 % là dải dưới Pass. */
    assert(d.daiCuoiKhoa(0.72, 0.75) !== 'dat' && d.daiCuoiKhoa(0.72) === 'dat', 'daiCuoiKhoa theo ngưỡng');
  }));

  check('OV6b1-5 · kiểm dữ liệu: mốc > số tuần, mốc giảm dần, Progress ≥ Final, ngưỡng ngoài 1–100 → 400 đúng ô; QL / GV → 403', () => thu(() => {
    const be = ct('BE');
    const goc = { code: 'BE', name: be.name, weeks: 10, progressWeek: 5, finalWeek: 10, status: be.status, nguongDat: 70 };
    const ca = [
      [{ ...goc, progressWeek: 12 }, 'moc'], [{ ...goc, finalWeek: 11 }, 'moc'], [{ ...goc, progressWeek: 10, finalWeek: 10 }, 'moc'],
      [{ ...goc, nguongDat: 0 }, 'nguong'], [{ ...goc, nguongDat: 101 }, 'nguong'], [{ ...goc, weeks: 0 }, 'so-tuan'], [{ ...goc, name: ' ' }, 'ten'],
    ] as const;
    for (const [vao, o] of ca) {
      const e = loi400(() => sysconfig.saveProgramme(P.admin, vao));
      assert(e?.status === 400 && e.details?.o === o, `${JSON.stringify(vao)} → ${e?.status} ${e?.details?.o} ${e?.message}`);
    }
    const r = route('LT1');
    const lt = { code: 'LT1', name: r.name, note: r.note, status: r.status };
    for (const lich of [[12, 6, 16], [6, 6], [], [0, 6], [6, 12, 16, 20, 24, 28, 32, 36, 40], [6, 'x']]) {
      const e = loi400(() => sysconfig.saveRoute(P.admin, { ...lt, lichMt: lich }));
      assert(e?.status === 400 && e.details?.o === 'moc', `${JSON.stringify(lich)} → ${e?.status} ${e?.details?.o} ${e?.message}`);
    }
    assert(JSON.stringify(route('LT1').lichMt) === '[6,12,16]', 'lỗi vẫn ghi');
    for (const p of [P.mbManager, P.coreTeacher]) {
      assert(loi400(() => sysconfig.saveProgramme(p, goc))?.status === 403, 'saveProgramme không 403');
      assert(loi400(() => sysconfig.saveRoute(p, { ...lt, lichMt: [6, 12, 16] }))?.status === 403, 'saveRoute không 403');
      assert(loi400(() => sysconfig.listProgrammes(p))?.status === 403, 'listProgrammes không 403');
    }
  }));

  check('OV6b1-6 · cột "Lớp đang chạy" chỉ đếm lớp đang chạy (chương trình và lộ trình FT)', () => thu(() => {
    const dem = (sql: string, ...a: unknown[]) => one(sql, ...a).n as number;
    assert(ct('BE').lopDangChay === dem(`SELECT COUNT(*) n FROM classes WHERE programme_code = 'BE' AND status = 'active'`), 'BE');
    assert(route('LT1').lopDangChay === dem(`SELECT COUNT(*) n FROM classes WHERE is_fast_track = 1 AND route = 'LT1' AND status = 'active'`), 'LT1');
    const truoc = ct('BE').lopDangChay;
    const lop = lopMoi('BE', null, tuanNay);
    assert(ct('BE').lopDangChay === truoc + 1, 'lớp mới không đếm');
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(lop.id);
    assert(ct('BE').lopDangChay === truoc, 'lớp đã kết thúc vẫn đếm');
  }));

  check('OV6b1-7 · migrate: điền bản chụp cho mọi lớp cũ theo hằng số hiện hành; chạy lại không đổi gì; lịch MT mọi em như luật cũ', () => thu(() => {
    const lich = () => JSON.stringify(all('SELECT id, planned_period_id FROM assessment_attempts ORDER BY id'));
    const truoc = lich();
    const tenLopThuong = all(`SELECT id FROM classes WHERE is_fast_track = 0 AND programme_code IS NOT NULL ORDER BY id LIMIT 1`)[0].id;
    conn.exec(`UPDATE classes SET lich_mt = NULL, nguong_dat = NULL; UPDATE routes SET lich_mt = NULL; UPDATE programmes SET nguong_dat = NULL;`);
    conn.prepare('UPDATE classes SET so_tuan = NULL, tuan_giua_khoa = NULL, tuan_cuoi_khoa = NULL WHERE id = ?').run(tenLopThuong);
    const a1: string[] = [];
    mig.migratePrOv6b1(conn, a1);
    xoaNho();
    assert(a1.some((x) => /\d+ lớp/.test(x)), `thiếu dòng số lớp: ${JSON.stringify(a1)}`);
    const ftSai = all(`SELECT code, route, lich_mt FROM classes WHERE is_fast_track = 1`)
      .filter((c) => c.lich_mt !== JSON.stringify(c.route === 'RF' ? [4, 8] : [6, 12, 16]));
    assert(!ftSai.length, `lớp FT: ${JSON.stringify(ftSai.slice(0, 3))}`);
    assert(!one(`SELECT 1 x FROM classes c JOIN programmes p ON p.code = c.programme_code WHERE p.scoring_mode = 'ratio' AND (c.nguong_dat IS NULL OR c.nguong_dat != 0.7)`), 'ngưỡng lớp thường');
    assert(one('SELECT so_tuan FROM classes WHERE id = ?', tenLopThuong).so_tuan !== null, 'lớp thường thiếu số tuần');
    assert(JSON.stringify(all(`SELECT code, lich_mt FROM routes ORDER BY code`).map((r) => [r.code, r.lich_mt]))
      === JSON.stringify(all(`SELECT code FROM routes ORDER BY code`).map((r) => [r.code, r.code === 'RF' ? '[4,8]' : '[6,12,16]'])), 'routes.lich_mt');
    assert(!one(`SELECT 1 x FROM programmes WHERE scoring_mode = 'ratio' AND nguong_dat IS NULL`), 'programmes.nguong_dat');
    const chup = JSON.stringify(all('SELECT id, lich_mt, nguong_dat, so_tuan FROM classes ORDER BY id'));
    const a2: string[] = [];
    mig.migratePrOv6b1(conn, a2);
    assert(!a2.length && chup === JSON.stringify(all('SELECT id, lich_mt, nguong_dat, so_tuan FROM classes ORDER BY id')), `chạy lại: ${JSON.stringify(a2)}`);
    assert(lich() === truoc, 'migrate đổi lịch lượt');
    /* Lịch đề xuất của MỌI em FT (đọc bản chụp lớp) = luật cũ viết cứng theo lộ trình của em (LT 6/12/16, RF 4/8). */
    const cy = all(`SELECT cy.id, cy.route FROM learning_cycles cy WHERE cy.status = 'active' AND cy.route IS NOT NULL AND cy.start_period_id IS NOT NULL`);
    assert(cy.length > 10, `ít lộ trình FT: ${cy.length}`);
    const lech = cy.filter((c) => schedule.suggestedMockWeeks(c.id).map((s: any) => s.studyWeek).join() !== (c.route === 'RF' ? '4,8' : '6,12,16'));
    assert(!lech.length, `lệch: ${JSON.stringify(lech.slice(0, 3).map((c) => [c.id, c.route, schedule.suggestedMockWeeks(c.id).map((s: any) => s.studyWeek)]))}`);
  }));
}
