/** PHÉP KIỂM PR-TOC — Thêm học viên ghi theo lô (giữ nguyên luật lịch MT) + kiểm dữ liệu nhập ở biên. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTocTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const { taoMtMacDinhLo } = await import('../fasttrack/mtMacDinh.ts');
  const { ensurePeriod, ensurePeriods } = await import('../platform/week.ts');
  const { chenNhieuDong } = await import('../db.ts');
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
      { fullName: 'Tốc Lô Một', email: 'tl1@demo.test' },
      { fullName: 'Tốc Lô Hai', email: 'tl2@demo.test', daThiToiMt: '5' },
      { fullName: 'Tốc Lô Ba', email: 'tl3@demo.test', startWeek: '2026-09-28' },
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

  check(`TOC (3) · Tuần bắt đầu, thi dự kiến trong năm nay −3 … +3 (${nam - 3}–${nam + 3}); ngoài khoảng là lỗi, kể cả tuần cả lô`, () => {
    const pv = (r: any, extra: any = {}) => intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Nk', email: 'nk@demo.test', ...r }], ...extra });
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
      ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'X', email: 'x@y.vn', [k]: v }] }), /Dòng 1/, `xem trước ${k}=${JSON.stringify(v)}`);
      ma400(() => intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName: 'X', email: 'x@y.vn', [k]: v }] }), /Dòng 1/, `ghi ${k}=${JSON.stringify(v)}`);
    }
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: { fullName: 'X' } }), /danh sách dòng/, 'rows không phải mảng');
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [null] }), /danh sách dòng/, 'dòng null');
    ma400(() => intake.previewIntake(P.admin, { classId: ft, rows: [{ target: { x: 1 } }] }), /Target|target/, 'ô số là object');
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'Số', email: 's@y.vn', target: 6.5, baselineScore: 5, daThiToiMt: 2 }] });
    assert(pv.rows[0].target === 6.5 && pv.rows[0].baselineScore === 5 && pv.rows[0].daThiToiMt === 2, JSON.stringify(pv.rows[0]));
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name LIKE '[object%'`).get(), 'có tên "[object …]" trong database');
  });

  check('TOC (3) · Thêm vào lớp ngoài phạm vi → 403, không ghi gì', () => {
    let e: any = null;
    try {
      intake.commitIntake(P.mbManager, { classId: classId('CP FT 110'), idempotencyKey: 'toc-3-pv', rows: [{ fullName: 'Tốc Ngoài', email: 'tn@demo.test' }] });
    } catch (x) { e = x; }
    assert(e?.status === 403, `phải 403: ${e?.status} ${e?.message}`);
    assert(!conn.prepare(`SELECT id FROM students WHERE full_name = 'Tốc Ngoài'`).get(), 'đã ghi học viên');
    assert(!conn.prepare(`SELECT key FROM demo_config WHERE key = 'intake:toc-3-pv'`).get(), 'đã lưu khoá idempotency');
    assertThrows(() => intake.commitIntake(P.admin, { classId: 999999, rows: [] }), /Không tìm thấy lớp/, 'lớp không tồn tại → 404');
  });

  check('TOC (3) · Thông tin HV: ô chữ sai kiểu → 400, ngày sinh trước 1900 → 400; tuần bắt đầu / thi dự kiến ngoài khoảng → 400', () => {
    const sid = (conn.prepare(`SELECT id FROM students WHERE full_name = 'Tốc Lô Một'`).get() as any).id;
    const cy = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(sid) as any;
    for (const [k, v] of [['fullName', { a: 1 }], ['note', ['x']], ['email', 1], ['consultantName', {}]] as const) {
      ma400(() => updateStudent(P.admin, sid, { [k]: v }), /không hợp lệ/, `HV ${k}`);
    }
    ma400(() => updateStudent(P.admin, sid, { dob: '1899-12-31' }), /Ngày sinh.*1900/, 'ngày sinh 1899');
    assert((updateStudent(P.admin, sid, { dob: '1900-01-01' }) as any).dob === '1900-01-01', 'ngày sinh 1900 hợp lệ');
    ma400(() => updateCycle(P.admin, cy.id, { startWeek: `${nam + 4}-01-05` }), /Tuần bắt đầu/, 'tuần năm +4');
    ma400(() => updateCycle(P.admin, cy.id, { examDate: `${nam + 4}-05` }), /Thi dự kiến/, 'thi năm +4');
    ma400(() => updateCycle(P.admin, cy.id, { startWeek: { x: 1 } }), /Tuần bắt đầu/, 'tuần là object');
    /* Lộ trình cũ ngoài khoảng: gửi lại ĐÚNG giá trị đang lưu thì không bị chặn (panel/API gửi cả ô không sửa). */
    const cu = ensurePeriod(`${nam - 5}-03-02`);
    conn.prepare(`UPDATE learning_cycles SET start_period_id = ?, exam_date = ?, exam_month = ? WHERE id = ?`)
      .run(cu.id, `${nam - 5}-06-10`, `${nam - 5}-06`, cy.id);
    updateCycle(P.admin, cy.id, { startWeek: cu.weekStart, examDate: `${nam - 5}-06-10` });
  });
}
