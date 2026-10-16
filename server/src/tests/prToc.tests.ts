/** PHÉP KIỂM PR-TOC — Thêm học viên ghi theo lô (giữ nguyên luật lịch MT) + kiểm dữ liệu nhập ở biên. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTocTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const { taoMtMacDinhLo } = await import('../fasttrack/mtMacDinh.ts');
  const { ensurePeriod, ensurePeriods } = await import('../platform/week.ts');
  const dbMod = await import('../db.ts');
  const { chenNhieuDong } = dbMod;
  const cp = await import('node:child_process');
  const { ensureSkillRows } = await import('../fasttrack/skillSchedule.ts');
  const { updateStudent } = await import('../students/students.ts');
  const { updateCycle } = await import('../fasttrack/cycles.ts');
  console.log('\nPR-TOC · Thêm học viên theo lô, kiểm dữ liệu nhập');
  const ft = classId('MB FT 101');
  const nam = Number(TODAY.slice(0, 4));
  const loiO = (pv: any, field: string) => pv.rows[0].issues.find((i: any) => i.field === field && i.muc === 'loi')?.message ?? null;
  const ma400 = (fn: () => unknown, re: RegExp, msg: string) => {
    let e: any = null;
    try { fn(); } catch (x) { e = x; }
    assert(e?.status === 400 && re.test(e.message), `${msg}: ${e?.status} ${e?.message}`);
  };

  // ------------------------------------------------------------------ (1) ghi theo lô, luật giữ nguyên

  check('TOC (1) · chenNhieuDong chia lô theo trần 900 tham số — 300 dòng × 7 cột (2100 tham số) vào đủ, đúng thứ tự', () => {
    conn.exec('CREATE TEMP TABLE IF NOT EXISTS _toc (a, b, c, d, e, f, g)');
    conn.exec('DELETE FROM _toc');
    chenNhieuDong('INSERT INTO _toc (a, b, c, d, e, f, g)', Array.from({ length: 300 }, (_, i) => [i, 'x', null, i * 2, 'y', 'z', i]));
    const r = conn.prepare('SELECT COUNT(*) n, SUM(a) s, MIN(rowid) lo, MAX(rowid) hi FROM _toc').get() as any;
    assert(r.n === 300 && r.s === 299 * 300 / 2, JSON.stringify(r));
    assert((conn.prepare('SELECT a FROM _toc ORDER BY rowid LIMIT 1 OFFSET 250').get() as any).a === 250, 'lệch thứ tự');
    conn.exec('DROP TABLE _toc');
  });

  check('TOC (1) · ensurePeriods = ensurePeriod từng ngày (ngày giữa tuần, tuần đã có, tuần mới, trùng tuần)', () => {
    const ngay = ['2031-03-04', '2031-03-06', '2026-09-29', '2031-03-13', '2031-03-09'];
    const lo = ensurePeriods(ngay);
    for (const d of ngay) {
      const mot = ensurePeriod(d);
      const x = lo.get(d)!;
      assert(x.id === mot.id && x.weekStart === mot.weekStart && x.code === mot.code, `${d}: ${JSON.stringify(x)} ≠ ${JSON.stringify(mot)}`);
    }
    assert(lo.get('2031-03-04')!.id === lo.get('2031-03-06')!.id, 'hai ngày cùng tuần phải cùng một dòng tuần');
  });

  check('TOC (1) · Thêm 3 em FT một lô: đủ lượt, 4 kỹ năng/lượt, 1 dòng nhật ký lịch/lượt, 1 hành trình + 1 audit/lộ trình; chạy lại không tạo trùng', () => {
    const r = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'toc-1-lo', rows: [
      { fullName: 'Tốc Lô Một', dob: '2010-01-01', email: 'tl1@demo.test' },
      { fullName: 'Tốc Lô Hai', dob: '2010-01-01', email: 'tl2@demo.test', daThiToiMt: '5' },
      { fullName: 'Tốc Lô Ba', dob: '2010-01-01', email: 'tl3@demo.test', startWeek: '2026-09-28' },
    ] });
    assert(r.added === 3 && r.mt.soEm === 3, JSON.stringify(r));
    const cyc = conn.prepare(`SELECT id, student_id FROM learning_cycles WHERE student_id IN (${r.studentIds.join(',')}) ORDER BY student_id`).all() as any[];
    const soLuot = cyc.map((c) => (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(c.id) as any).n);
    assert(JSON.stringify(soLuot) === '[3,5,3]', `lượt theo em: ${soLuot}`);
    for (const c of cyc) {
      const ds = conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? ORDER BY attempt_no').all(c.id) as any[];
      assert(ds.every((a, i) => a.attempt_no === i + 1 && a.status === 'planned' && a.plan_source === 'auto' && a.class_id === ft
        && a.student_id === c.student_id && a.created_by === P.admin.userId), `lượt sai: ${JSON.stringify(ds[0])}`);
      for (const a of ds) {
        const k = conn.prepare(`SELECT skill, required, planned_period_id, plan_source, sit_status FROM attempt_skills WHERE attempt_id = ? ORDER BY id`).all(a.id) as any[];
        assert(k.map((x) => x.skill).join() === 'listening,reading,writing,speaking'
          && k.every((x) => x.required === 1 && x.planned_period_id === a.planned_period_id && x.plan_source === 'auto' && x.sit_status === 'scheduled'),
        `kỹ năng MT${a.attempt_no}: ${JSON.stringify(k)}`);
        const h = conn.prepare(`SELECT h.new_value, p.code FROM attempt_schedule_history h JOIN report_periods p ON p.id = ? WHERE h.attempt_id = ?`).all(a.planned_period_id, a.id) as any[];
        assert(h.length === 1 && h[0].new_value === h[0].code, `nhật ký lịch MT${a.attempt_no}: ${JSON.stringify(h)}`);
      }
      const j = (conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE cycle_id = ? AND event_type = 'mock_scheduled'`).get(c.id) as any).n;
      const au = (conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_type = 'learning_cycle' AND entity_id = ? AND action = 'schedule.autoplan'`).get(c.id) as any).n;
      assert(j === 1 && au === 1, `lộ trình ${c.id}: hành trình ${j}, audit ${au}`);
    }
    const lai = taoMtMacDinhLo(cyc.map((c) => ({ cycleId: c.id, daThiToiMt: 5 })), { actorUserId: P.admin.userId });
    const moi = [...lai.values()].flat().length;
    /* Em 1, 3 chưa có MT4–5 → được thêm (daThiToiMt kéo dài lịch); em 2 đã đủ → 0. Không số nào bị tạo hai lần. */
    const trung = (conn.prepare(`SELECT COUNT(*) n FROM (SELECT cycle_id, attempt_no FROM assessment_attempts
      WHERE cycle_id IN (${cyc.map((c) => c.id).join(',')}) GROUP BY cycle_id, attempt_no HAVING COUNT(*) > 1)`).get() as any).n;
    assert(moi === 4 && trung === 0 && (lai.get(cyc[1].id) ?? []).length === 0, `chạy lại: tạo ${moi}, trùng ${trung}`);
  });

  // ------------------------------------------------------------------ (3) kiểm dữ liệu nhập

  check(`TOC (3) · Ngày sinh: 1900 → hôm nay; trước 1900 là lỗi tại ô`, () => {
    const pv = (dob: string) => intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Ns', email: 'ns@demo.test', dob }] });
    assert(/1900/.test(loiO(pv('31/12/1899'), 'dob') ?? ''), `1899: ${loiO(pv('31/12/1899'), 'dob')}`);
    assert(!!loiO(pv('12/05/0208'), 'dob'), 'năm 0208 phải lỗi');
    assert(loiO(pv('01/01/1900'), 'dob') === null, '1900 hợp lệ');
    assert(!!loiO(pv(`01/01/${nam + 1}`), 'dob'), 'sau hôm nay vẫn lỗi');
  });

  check(`TOC (3) · Tuần bắt đầu, dự kiến thi trong năm nay −3 … +3 (${nam - 3}–${nam + 3}); ngoài khoảng là lỗi, kể cả tuần cả lô`, () => {
    const pv = (r: any, extra: any = {}) => intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Nk', dob: '2010-01-01', email: 'nk@demo.test', ...r }], ...extra });
    assert(!!loiO(pv({ startWeek: `05/01/${nam - 4}` }), 'startWeek'), 'tuần bắt đầu năm −4');
    assert(!!loiO(pv({ startWeek: `05/01/${nam + 4}` }), 'startWeek'), 'tuần bắt đầu năm +4');
    assert(loiO(pv({ startWeek: `05/01/${nam - 3}` }), 'startWeek') === null, 'năm −3 hợp lệ');
    assert(!!loiO(pv({ examDate: `05/${nam + 4}` }), 'examDate'), 'thi tháng năm +4');
    assert(!!loiO(pv({ examDate: `15/01/${nam + 4}` }), 'examDate'), 'thi ngày năm +4');
    assert(loiO(pv({ examDate: `12/${nam + 3}` }), 'examDate') === null, 'thi 12/năm+3 hợp lệ');
    const lo = pv({}, { defaultStartWeek: `05/01/${nam + 5}` });
    assert(lo.issues.some((i: any) => i.row === 0 && i.field === 'startWeek'), 'tuần cả lô ngoài khoảng phải báo ở dòng 0');
  });

  check('TOC (3) · Ô chữ không phải chuỗi → 400 (không 500, không lưu "[object Object]"); ô số nhận cả số', () => {
    for (const [k, v] of [['fullName', { a: 1 }], ['fullName', ['A']], ['email', 5], ['dob', true], ['startWeek', {}], ['consultant', []]] as const) {
      ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'X', dob: '2010-01-01', email: 'x@y.vn', [k]: v }] }), /Dòng 1/, `xem trước ${k}=${JSON.stringify(v)}`);
      ma400(() => intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName: 'X', dob: '2010-01-01', email: 'x@y.vn', [k]: v }] }), /Dòng 1/, `ghi ${k}=${JSON.stringify(v)}`);
    }
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: { fullName: 'X' } }), /danh sách dòng/, 'rows không phải mảng');
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [null] }), /danh sách dòng/, 'dòng null');
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [{ target: { x: 1 } }] }), /Target|target/, 'ô số là object');
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Số', dob: '2010-01-01', email: 's@y.vn', target: 6.5, baselineScore: 5, daThiToiMt: 2 }] });
    assert(pv.rows[0].target === 6.5 && pv.rows[0].baselineScore === 5 && pv.rows[0].daThiToiMt === 2, JSON.stringify(pv.rows[0]));
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name LIKE '[object%'`).get(), 'có tên "[object …]" trong database');
  });

  check('TOC (3) · Thêm vào lớp ngoài phạm vi → 403, không ghi gì', () => {
    let e: any = null;
    try {
      intake.commitIntake(P.mbManager, { classId: classId('CP FT 110'), idempotencyKey: 'toc-3-pv', rows: [{ fullName: 'Tốc Ngoài', dob: '2010-01-01', email: 'tn@demo.test' }] });
    } catch (x) { e = x; }
    assert(e?.status === 403, `phải 403: ${e?.status} ${e?.message}`);
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name = 'Tốc Ngoài'`).get(), 'đã ghi học viên');
    assert(!conn.prepare(`SELECT key FROM demo_config WHERE key LIKE 'intake:%toc-3-pv'`).get(), 'đã lưu khoá idempotency');
    assertThrows(() => intake.commitIntake(P.admin, { classId: 999999, rows: [] }), /Không tìm thấy lớp/, 'lớp không tồn tại → 404');
  });

  check('TOC (3) · Thông tin HV: ô chữ sai kiểu → 400, ngày sinh trước 1900 → 400; tuần bắt đầu / dự kiến thi ngoài khoảng → 400', () => {
    const sid = (conn.prepare(`SELECT id FROM students WHERE full_name = 'Tốc Lô Một'`).get() as any).id;
    const cy = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(sid) as any;
    for (const [k, v] of [['fullName', { a: 1 }], ['note', ['x']], ['email', 1], ['consultantName', {}]] as const) {
      ma400(() => updateStudent(P.admin, sid, { [k]: v }), /không hợp lệ/, `HV ${k}`);
    }
    ma400(() => updateStudent(P.admin, sid, { dob: '1899-12-31' }), /Ngày sinh.*1900/, 'ngày sinh 1899');
    assert((updateStudent(P.admin, sid, { dob: '1900-01-01' }) as any).dob === '1900-01-01', 'ngày sinh 1900 hợp lệ');
    ma400(() => updateCycle(P.admin, cy.id, { startWeek: `${nam + 4}-01-05` }), /Tuần bắt đầu/, 'tuần năm +4');
    ma400(() => updateCycle(P.admin, cy.id, { examDate: `${nam + 4}-05` }), /Dự kiến thi/, 'thi năm +4');
    ma400(() => updateCycle(P.admin, cy.id, { startWeek: { x: 1 } }), /Tuần bắt đầu/, 'tuần là object');
    /* Lộ trình cũ ngoài khoảng: gửi lại ĐÚNG giá trị đang lưu thì không bị chặn (panel/API gửi cả ô không sửa). */
    const cu = ensurePeriod(`${nam - 5}-03-02`);
    const thiCu = ensurePeriod(`${nam - 5}-06-10`);
    conn.prepare(`UPDATE learning_cycles SET start_period_id = ?, exam_date = ?, exam_month = ?, exam_period_id = ? WHERE id = ?`)
      .run(cu.id, `${nam - 5}-06-10`, `${nam - 5}-06`, thiCu.id, cy.id);
    updateCycle(P.admin, cy.id, { startWeek: cu.weekStart, examDate: `${nam - 5}-06-10` });
    /* Rà #121 (5): id tuần / tháng gửi THẲNG (StudentPlanPanel) cũng qua cận năm, cũng chỉ khi đổi. */
    updateCycle(P.admin, cy.id, { startPeriodId: cu.id, examPeriodId: thiCu.id, examMonth: `${nam - 5}-06` });
    ma400(() => updateCycle(P.admin, cy.id, { startPeriodId: ensurePeriod(`${nam + 4}-03-04`).id }), /Tuần bắt đầu/, 'startPeriodId năm +4');
    ma400(() => updateCycle(P.admin, cy.id, { examPeriodId: ensurePeriod(`${nam - 4}-03-04`).id }), /Dự kiến thi/, 'examPeriodId năm −4');
    ma400(() => updateCycle(P.admin, cy.id, { examMonth: `${nam + 4}-02` }), /Dự kiến thi/, 'examMonth năm +4');
    updateCycle(P.admin, cy.id, { startPeriodId: ensurePeriod(`${nam}-03-02`).id, examMonth: `${nam + 1}-02` });
  });

  // ------------------------------------------------------------------ rà #121

  check('TOC rà (2) · lô 901 em FT (> 900 tham số mỗi câu IN): đủ lượt + đủ dòng kỹ năng; bộ môn theo chương trình lớp (PR-MON) = ensureSkillRows', () => {
    const XONG = new Error('cuộn lại dữ liệu thử');
    try {
      dbMod.tx(() => {
        /*
         * PR-Dọn (Q6): Thêm HV tối đa 200 dòng một lần — thêm 901 em qua 5 lần, xoá lịch tự tạo rồi dựng lại lịch MT cho CẢ 901 lộ trình
         * trong MỘT lời gọi `taoMtMacDinhLo` (đường chia lô > 900 tham số mỗi câu IN, ý cũ của phép kiểm).
         */
        let them = 0;
        for (let k = 0; k < 901; k += 200) {
          const rows = Array.from({ length: Math.min(200, 901 - k) }, (_, i) => ({ fullName: `Lô Lớn ${k + i + 1}`, dob: '2010-01-01', email: `ll${k + i + 1}@demo.test`, startWeek: '2026-09-28' }));
          them += intake.commitIntake(P.admin, { classId: ft, rows }).added;
        }
        const ds = `SELECT id FROM assessment_attempts WHERE student_id IN (SELECT id FROM students WHERE full_name LIKE 'Lô Lớn %')`;
        const cys = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id IN (SELECT id FROM students WHERE full_name LIKE 'Lô Lớn %')`).all() as any[]).map((c) => c.id);
        conn.prepare(`DELETE FROM attempt_schedule_history WHERE attempt_id IN (${ds})`).run();
        conn.prepare(`DELETE FROM attempt_skills WHERE attempt_id IN (${ds})`).run();
        conn.prepare(`DELETE FROM assessment_attempts WHERE id IN (${ds})`).run();
        const lo = taoMtMacDinhLo(cys.map((cycleId) => ({ cycleId })), { actorUserId: P.admin.userId });
        assert(them === 901 && cys.length === 901 && lo.size === 901, `thêm ${them}, lộ trình ${cys.length}, có lịch ${lo.size}`);
        const luot = (conn.prepare(`SELECT COUNT(*) n FROM (${ds})`).get() as any).n;
        const kn = (conn.prepare(`SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id IN (${ds})`).get() as any).n;
        assert(luot === 901 * 3 && kn === 901 * 3 * 4, `lượt ${luot}/${901 * 3}, kỹ năng ${kn}/${901 * 12}`);
        /* Lượt của lớp Pre FOU (một ô `tong_hop`, PR-MON): bộ môn theo chương trình lớp, đúng như ensureSkillRows. Đổi tạm lớp — cuộn lại. */
        conn.prepare(`UPDATE classes SET programme_code = 'PREFOU' WHERE id = ?`).run(classId('MB FOU 12'));
        const th = intake.commitIntake(P.admin, { classId: classId('MB FOU 12'), rows: [{ fullName: 'Lô Lớn Thường', dob: '2010-01-01', email: 'llt@demo.test' }] });
        const cyTh = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ?').get(th.studentIds[0]) as any).id;
        conn.prepare(`UPDATE learning_cycles SET route = 'LT1' WHERE id = ?`).run(cyTh);
        const [l1] = taoMtMacDinhLo([{ cycleId: cyTh }], { actorUserId: P.admin.userId }).get(cyTh)!;
        const truoc = (conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(l1.attemptId) as any).n;
        const bo = ensureSkillRows(l1.attemptId).map((x) => x.skill);
        assert(truoc === bo.length && !bo.includes('listening'), `lớp thường: ${truoc} dòng, ensureSkillRows ${bo.join(',')}`);
        throw XONG;
      });
    } catch (e) { if (e !== XONG) throw e; }
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name LIKE 'Lô Lớn %'`).get(), 'dữ liệu thử chưa cuộn lại');
  });

  check('TOC rà (3) · khoá idempotency gắn người + lớp: người khác / lớp khác gửi cùng khoá không nhận lại kết quả lô cũ', () => {
    const bcFt = (conn.prepare(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id
      WHERE b.code = 'BC' AND c.is_fast_track = 1 AND c.status = 'active' ORDER BY c.id LIMIT 1`).get() as any).id;
    const dong = (ten: string) => [{ fullName: ten, dob: '2010-01-01', email: `khoa.${ten.slice(-1).toLowerCase()}@demo.test` }];   // OV-13f: email không trùng
    const a = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'toc-ra-3', rows: dong('Khoá A') });
    const a2 = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'toc-ra-3', rows: dong('Khoá A') });
    assert(a.added === 1 && JSON.stringify(a2.studentIds) === JSON.stringify(a.studentIds), 'cùng người, cùng lớp: phải trả kết quả cũ');
    const b = intake.commitIntake(P.bcManager, { classId: bcFt, idempotencyKey: 'toc-ra-3', rows: dong('Khoá B') });
    assert(b.added === 1 && !b.studentIds.some((x: number) => a.studentIds.includes(x)), `QL BC nhận lại lô MB: ${JSON.stringify(b)}`);
    const c = intake.commitIntake(P.admin, { classId: bcFt, idempotencyKey: 'toc-ra-3', rows: dong('Khoá C') });
    assert(c.added === 1 && !c.studentIds.some((x: number) => a.studentIds.includes(x)), `lớp khác nhận lại lô cũ: ${JSON.stringify(c)}`);
  });

  await checkAsync('TOC rà (4) · hai lời gọi song song cùng khoá: lời gọi sau đọc lại khoá TRONG giao dịch → trả kết quả lời gọi trước, không ghi lần hai', async () => {
    const khoa = `intake:${P.admin.userId}:${ft}:toc-ra-4`;
    const truoc = { added: 1, skipped: 0, failed: [], studentIds: [-4], hangDaThem: [1], mt: { soEm: 0, soLuotLichSu: 0, soEmCoLichSu: 0, luotLichSuDau: null } };
    /* Tiến trình khác = "hàm Netlify thứ nhất": giữ khoá ghi, ghi khoá idempotency, 700 ms sau mới COMMIT (cùng mẫu giuKhoa của anToan). */
    const con = cp.spawn(process.execPath, ['-e', [
      "const D = require('libsql'); const d = new D(process.argv[1]);",
      "d.exec('BEGIN IMMEDIATE');",
      "d.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(process.argv[2], process.argv[3], 'x');",
      "process.stdout.write('giu' + String.fromCharCode(10));",
      "setTimeout(() => { d.exec('COMMIT'); d.close(); }, 700);",
    ].join('\n'), dbMod.DB_PATH, khoa, JSON.stringify(truoc)], { stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise<void>((ok, loi) => { con.stdout!.once('data', () => ok()); con.once('exit', (c) => loi(new Error(`tiến trình con thoát sớm (${c})`))); });
    const xong = new Promise<void>((ok) => { if (con.exitCode !== null) ok(); else con.once('exit', () => ok()); });
    /* Lời gọi thứ hai: đọc khoá NGOÀI giao dịch chưa thấy (chưa COMMIT) → tx() chờ khoá → phải đọc lại và trả kết quả cũ. */
    const r = intake.commitIntake(P.admin, { classId: ft, idempotencyKey: 'toc-ra-4', rows: [{ fullName: 'Song Song', dob: '2010-01-01', email: 'ss@demo.test' }] });
    await xong;
    assert(JSON.stringify(r.studentIds) === '[-4]', `phải trả kết quả của lời gọi trước: ${JSON.stringify(r)}`);
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name = 'Song Song'`).get(), 'lời gọi thứ hai vẫn ghi học viên');
  });
}
