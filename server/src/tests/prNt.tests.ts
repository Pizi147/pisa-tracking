/** PHÉP KIỂM PR-NT — Target + Dự kiến thi lớp thường (chủ sản phẩm 04/10), không tác dụng phụ FT, dán không cần tiêu đề. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNtTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  console.log('\nPR-NT · Target + Dự kiến thi lớp thường');
  /* MB FOU 12: lớp thường có GVCN riêng trong harness (`P.normalCoreTeacher`) — dùng cho việc "Thiếu Target" và quyền GVCN. */
  const thuong = t.classId('MB FOU 12');
  const lt = conn.prepare(`SELECT c.status, c.start_date, pg.scoring_mode FROM classes c JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`).get(thuong) as any;
  assert(lt?.scoring_mode === 'ratio' && lt.status === 'active' && lt.start_date, `seed: MB FOU 12 phải là lớp thường đang chạy: ${JSON.stringify(lt)}`);

  check('NT-1 · cotLuoiNhap: lớp thường 6 cột có Target + Dự kiến thi; FT giữ 12 cột cũ', () => {
    const th = d.cotLuoiNhap(true).map((c) => c.key).join(',');
    assert(th === 'fullName,dob,email,target,examDate,startWeek', th);
    const f = d.cotLuoiNhap(false).map((c) => c.key).join(',');
    assert(f === 'fullName,dob,email,baselineScore,entryListening,entryReading,entryWriting,entrySpeaking,target,examDate,daThiToiMt,startWeek', f);
  });

  check('NT-1 · previewIntake lớp thường: nhận Target/KCK/ngày/tháng thi; band + Đã thi tới MT vẫn "Bỏ qua"', () => {
    const pv = intake.previewIntake(P.admin, { classId: thuong, rows: [
      { fullName: 'NT A', dob: '2010-01-01', email: 'nt-a@demo.test', target: '6.5', examDate: '05/2027', baselineScore: '5', daThiToiMt: '2' },
      { fullName: 'NT B', dob: '2010-01-01', email: 'nt-b@demo.test', target: 'KCK', examDate: '15/06/2027' },
      { fullName: 'NT C', dob: '2010-01-01', email: 'nt-c@demo.test', target: '6.3' },
      { fullName: 'NT D', dob: '2010-01-01', email: 'nt-d@demo.test', examDate: '13/2027' },
    ] });
    const [a, b, c, dd] = pv.rows;
    assert(a.target === 6.5 && a.examDate === '2027-05', JSON.stringify(a));
    assert(a.baselineScore === null && a.issues.some((i: any) => i.field === 'baselineScore' && i.muc === 'luu_y'), 'band vẫn bỏ qua');
    assert(a.issues.some((i: any) => i.field === 'daThiToiMt' && i.muc === 'luu_y'), 'daThiToiMt vẫn bỏ qua');
    assert(!a.issues.some((i: any) => i.field === 'target' || i.field === 'examDate'), JSON.stringify(a.issues));
    assert(b.target === 'KCK' && b.examDate === '2027-06-15', JSON.stringify(b));
    assert(c.issues.some((i: any) => i.field === 'target' && i.muc === 'loi'), 'band lẻ phải lỗi');
    assert(dd.issues.some((i: any) => i.field === 'examDate' && i.muc === 'loi'), 'tháng 13 phải lỗi');
    assert(!dd.issues.some((i: any) => i.field === 'target'), 'lớp thường để trống Target không có lưu ý kỳ vọng');
  });

  check('NT-1 · commitIntake lớp thường ghi target_score / khong_cam_ket / exam_* lên learning_cycles', () => {
    const r = intake.commitIntake(P.admin, { classId: thuong, idempotencyKey: 'nt-1-ghi', rows: [
      { fullName: 'NT Ghi 1', dob: '2010-01-01', email: 'nt-ghi1@demo.test', target: '6', examDate: '20/05/2027' },
      { fullName: 'NT Ghi 2', dob: '2010-01-01', email: 'nt-ghi2@demo.test', target: 'KCK', examDate: '07/2027' },
    ] });
    assert(r.added === 2, JSON.stringify(r));
    const cy = (email: string) => conn.prepare(`SELECT cy.* FROM learning_cycles cy JOIN students s ON s.id = cy.student_id WHERE s.email = ?`).get(email) as any;
    const c1 = cy('nt-ghi1@demo.test'), c2 = cy('nt-ghi2@demo.test');
    assert(c1.target_score === 6 && c1.khong_cam_ket === 0 && c1.exam_date === '2027-05-20' && c1.exam_month === '2027-05' && c1.exam_period_id, JSON.stringify(c1));
    assert(c2.target_score === null && c2.khong_cam_ket === 1 && c2.exam_month === '2027-07' && c2.exam_date === null, JSON.stringify(c2));
    assert(c1.route === null, 'lớp thường không có route — điều kiện chặn FT ở NT-2 dựa vào đây');
  });

  // ------------------------------------------------------------------ NT-2: không tác dụng phụ FT
  const em = conn.prepare(`SELECT s.id AS sid, cy.id AS cid FROM students s JOIN learning_cycles cy ON cy.student_id = s.id WHERE s.email = 'nt-ghi1@demo.test'`).get() as any;
  const prof: any = await import('../students/profile.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const plt: any = await import('../classes/phanTichLop.ts');
  const sch: any = await import('../classes/schedule.ts');
  const dg: any = await import('../worklist/danhGia.ts');
  const ptGv: any = await import('../phanTich/giaoVien.ts');
  const soLuotCua = (cid: number, sql: string) => (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND ${sql}`).get(cid) as any).n as number;
  const soLuot = (sql: string) => soLuotCua(em.cid, sql);

  check('NT-2 · em lớp thường có Target: không lượt MT, không target_at_attempt, không Case tự động', () => {
    assert(soLuot('1 = 1') > 0, 'em lớp thường phải có bài Progress/Final Test (PR-LT2a)');
    assert(soLuot(`kind = 'mock'`) === 0, 'có lượt MT cho em lớp thường');
    assert(soLuot('target_at_attempt IS NOT NULL') === 0, 'lượt lớp thường bị chụp target');
    assert((conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?').get(em.sid) as any).n === 0, 'không Case tự động');
  });

  check('NT-2 · hồ sơ em lớp thường: không kỳ vọng MT; badge thiếu thông tin không đòi Target', () => {
    const h = JSON.stringify(prof.studentProfile(P.admin, em.sid));
    assert(!/"kyVong":\s*\d/.test(h), 'kyVong phải null');
    const m = sch.missingForStudent({ cycle: { start_period_id: 1, target_score: null, khong_cam_ket: 0 }, student: null, isFastTrack: false });
    assert(!m.some((x: any) => x.key === 'target'), JSON.stringify(m));
  });

  check('NT-2 · danhGiaMon lượt lớp thường không đọc target', () => {
    const prog = { scoringMode: 'ratio', skills: ['L', 'R'], code: 'FOU' } as any;
    const a = { kind: 'progress', attempt_no: 1, route: null };
    assert(JSON.stringify(plt.danhGiaMon(a, [], prog, 6.5)) === JSON.stringify(plt.danhGiaMon(a, [], prog, null)), 'target đổi kết quả lớp thường');
  });

  check('NT-2 · Công việc GVCN lớp thường: em thiếu Target KHÔNG thành việc "Điền Target"', () => {
    conn.prepare('UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 0 WHERE id = ?').run(em.cid);
    try {
      const w = mw.myWork(P.normalCoreTeacher, {});
      const items: any[] = w.items ?? w;
      assert(Array.isArray(items), 'myWork phải trả danh sách việc');
      assert(!items.some((x) => x.key === `target:${em.sid}`), 'em lớp thường lọt vào việc Điền Target');
    } finally { conn.prepare('UPDATE learning_cycles SET target_score = 6 WHERE id = ?').run(em.cid); }
  });

  check('NT-2 · PA lớp thường không lấy ngày thi làm mốc; "đến lúc thi" chỉ có ở lượt Mock FT', () => {
    const ctx = { ngayXacNhan: '2026-10-05', nextMtSunday: null, examDate: '2027-05-20' };
    for (const span of ['den_cuoi_khoa', 'mini_test']) assert(d.mocQuyChe(span as any, ctx) !== ctx.examDate, `${span} lấy ngày thi`);
    const n = (conn.prepare(`SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
                               JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.moc_quy_che = 'until_exam' AND a.kind != 'mock'`).get() as any).n;
    assert(n === 0, `${n} PA "đến lúc thi" sinh từ lượt không phải Mock`);
  });

  check('NT-2 · em lớp thường KCK vẫn nằm trong mẫu số Tổng hợp Test lớp thường (luotKck chỉ cho lượt Mock)', () => {
    /* OV-11e (Q8): `luotKck` = `kckCuaLuot` — dấu của lượt (`kck_at_attempt`), chưa có thì cờ lộ trình (`cy_kck`). */
    assert(dg.luotKck({ cy_kck: 1, kck_at_attempt: null, kind: 'mock' }), 'Mock KCK phải ngoài mẫu số');
    for (const kind of ['progress', 'final']) assert(!dg.luotKck({ cy_kck: 1, kck_at_attempt: null, kind }), `${kind} KCK bị loại khỏi mẫu số`);
  });

  check('NT-2 · Phân tích giáo viên (lớp thường): em đổi sang KCK vẫn tính ở Kết quả môn — số liệu không đổi', () => {
    const bai = conn.prepare(`SELECT a.cycle_id, k.planned_period_id, rp.week_start, cl.branch_id FROM assessment_attempts a
        JOIN classes cl ON cl.id = a.class_id JOIN programmes pg ON pg.code = cl.programme_code
        JOIN attempt_skills k ON k.attempt_id = a.id JOIN report_periods rp ON rp.id = k.planned_period_id
        JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.raw_score IS NOT NULL
        JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.khong_cam_ket = 0
       WHERE pg.scoring_mode = 'ratio' AND a.status != 'cancelled' AND cl.branch_id = (SELECT branch_id FROM classes WHERE id = ?) LIMIT 1`).get(thuong) as any;
    assert(bai, 'seed: cần một bài lớp thường có điểm ở chi nhánh MB');
    const goi = () => JSON.stringify(ptGv.phanTichGiaoVien(P.mbManager, { ct: 'thuong', tu: bai.week_start, den: bai.week_start }));
    const truoc = goi();
    conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 1 WHERE id = ?').run(bai.cycle_id);
    try { assert(goi() === truoc, 'em lớp thường KCK bị bỏ khỏi Phân tích giáo viên'); }
    finally { conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 0 WHERE id = ?').run(bai.cycle_id); }
  });

  // ------------------------------------------------------------------ NT-3: dán không cần tiêu đề
  const { assertThrows } = t;
  const ft = t.classId('MB FT 101');
  check('NT-3 · có tiêu đề: đọc theo tên như cũ, thứ tự tuỳ ý', () => {
    const r = intake.parsePaste('Email\tHọ và tên\tTarget\nx@y.vn\tAn\t6.5', { classId: thuong });
    assert(r.cach.coTieuDe && r.cach.daDoan && r.rows.length === 1 && r.rows[0].fullName === 'An' && r.rows[0].target === '6.5', JSON.stringify(r));
  });
  check('NT-3 · không tiêu đề, lớp FT: theo thứ tự 12 cột lưới', () => {
    const r = intake.parsePaste('Lê An\t12/05/2008\tan@x.vn\t5\t5\t5.5\t5\t5\t6.5\t05/2027\t0\t2026-10-05', { classId: ft });
    assert(!r.cach.coTieuDe && r.cach.daDoan && r.rows.length === 1 && r.cach.thua === 0 && r.cach.thieu === 0, JSON.stringify(r.cach));
    const x = r.rows[0];
    assert(x.fullName === 'Lê An' && x.email === 'an@x.vn' && x.baselineScore === '5' && x.entryReading === '5.5' && x.target === '6.5'
      && x.examDate === '05/2027' && x.daThiToiMt === '0', JSON.stringify(x));
  });
  check('NT-3 · không tiêu đề, lớp thường: mẫu Excel chung (thứ tự FT, PR-SL 04/10) — bỏ cột band, đọc Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần', () => {
    const r = intake.parsePaste('Trần Bình\t01/02/2012\tb@x.vn\t\t\t\t\t\t5.5\t06/2027\nĐỗ Chi\t\tc@x.vn\t\t\t\t\t\tKCK\t', { classId: thuong });
    assert(r.rows.length === 2 && r.rows[0].target === '5.5' && r.rows[0].examDate === '06/2027' && r.rows[1].target === 'KCK', JSON.stringify(r.rows));
    assert(r.cach.thuTu.join(',') === 'fullName,dob,email,target,examDate,startWeek', r.cach.thuTu.join(','));
  });
  check('NT-3 · dòng đầu là tên người (kể cả "Họ Thị Tên", "Email Nguyễn", "Tên") không bị nuốt làm tiêu đề', () => {
    for (const ten of ['Nguyễn Văn An', 'Họ Thị Tên', 'Email Nguyễn', 'Tên']) {
      const r = intake.parsePaste(`${ten}\t\ta@x.vn\nBé Hai\t\tb@x.vn`, { classId: thuong });
      assert(r.rows.length === 2 && r.rows[0].fullName === ten, `${ten}: ${JSON.stringify(r.rows)}`);
    }
    assert(!d.laDongTieuDe(['Họ và tên', 'Email', 'a@x.vn']) && d.laDongTieuDe(['STT', 'Họ và tên', 'Ngày sinh']) && d.laDongTieuDe(['Email', 'Target']),
      'laDongTieuDe');
  });
  check('NT-3 · người dùng ép cách đọc: coTieuDe=false giữ dòng đầu; coTieuDe=true bỏ dòng đầu', () => {
    const txt = 'Họ và tên\tEmail\nAn\ta@x.vn';
    assert(intake.parsePaste(txt, { classId: thuong }).rows.length === 1, 'tự đoán: có tiêu đề');
    const ep = intake.parsePaste(txt, { classId: thuong, coTieuDe: false });
    assert(ep.rows.length === 2 && !ep.cach.coTieuDe && !ep.cach.daDoan, 'ép không tiêu đề');
    /* Tiêu đề có ô trông như dữ liệu ("2026") → tự đoán là học viên (chống mất dữ liệu); ép coTieuDe=true thì bỏ dòng đầu. */
    const txt2 = 'Họ và tên\tEmail\t2026\nAn\ta@x.vn';
    assert(intake.parsePaste(txt2, { classId: thuong }).rows.length === 2, 'tự đoán phải nghiêng về học viên');
    const ep2 = intake.parsePaste(txt2, { classId: thuong, coTieuDe: true });
    assert(ep2.rows.length === 1 && ep2.rows[0].fullName === 'An' && ep2.cach.coTieuDe && !ep2.cach.daDoan, JSON.stringify(ep2));
    assertThrows(() => intake.parsePaste('An\t\ta@x.vn\nBình\t\tb@x.vn', { classId: thuong, coTieuDe: true }), /Họ và tên/, 'ép tiêu đề mà không có cột Họ tên');
  });
  check('NT-3 · số cột lệch lưới: thừa thì báo số ô bị bỏ, thiếu thì báo cột trống — không lặng lẽ', () => {
    const thua = intake.parsePaste('An\t\ta@x.vn\t\t\t\t\t\t6\t05/2027\t\t2026-10-05\tô lạ\tô lạ 2', { classId: thuong });
    assert(thua.cach.thua === 2 && thua.rows[0].fullName === 'An', JSON.stringify(thua.cach));
    const thieu = intake.parsePaste('An\t\ta@x.vn\t\t', { classId: thuong });
    assert(thieu.cach.thieu === 3 && thieu.rows[0].email === 'a@x.vn', JSON.stringify(thieu.cach));
  });
  check('NT-3 · không tiêu đề và không có classId: báo rõ "Chọn lớp trước…"', () => {
    assertThrows(() => intake.parsePaste('An\t\ta@x.vn'), /Chọn lớp/, 'phải báo chọn lớp');
  });

  // ------------------------------------------------------------------ NT-4: Thông tin HV lớp thường — Target (lý do, cycle.edit) + Dự kiến thi
  const cyc: any = await import('../fasttrack/cycles.ts');
  check('NT-4 · đổi Target lộ trình lớp thường: cần CYCLE_EDIT + lý do, ghi revision + Hành trình; GVCN bị chặn; không chụp target vào bài lớp thường', () => {
    assertThrows(() => cyc.updateCycle(P.admin, em.cid, { targetScore: 6.5 }), /lý do/, 'thiếu lý do');
    assertThrows(() => cyc.updateCycle(P.normalCoreTeacher, em.cid, { targetScore: 6.5, lyDo: 'Em muốn thi sớm hơn dự kiến' }), /Quản lý|quyền/i, 'GVCN không sửa Target');
    cyc.updateCycle(P.admin, em.cid, { targetScore: 6.5, lyDo: 'Phụ huynh đổi mục tiêu' });
    const rv = conn.prepare('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC').get(em.cid) as any;
    assert(rv && rv.new_target === 6.5 && rv.reason === 'Phụ huynh đổi mục tiêu', JSON.stringify(rv));
    assert(conn.prepare(`SELECT id FROM journey_events WHERE ref_table = 'cycle_target_revisions' AND ref_id = ?`).get(rv.id), 'thiếu dòng Hành trình');
    assert(soLuot(`kind = 'mock'`) === 0, 'đổi Target không xếp MT');
    assert(soLuot('target_at_attempt IS NOT NULL') === 0, 'đổi Target chụp target vào bài Progress/Final Test lớp thường');
  });
  check('NT-4 · Dự kiến thi lớp thường: GVCN (student.edit) sửa được; ngày → ngày + tháng + tuần; tháng → chỉ tháng; trống → xoá', () => {
    const doc = () => conn.prepare('SELECT exam_month, exam_date, exam_period_id FROM learning_cycles WHERE id = ?').get(em.cid) as any;
    cyc.updateCycle(P.normalCoreTeacher, em.cid, { examDate: '12/06/2027' });
    let c = doc();
    assert(c.exam_month === '2027-06' && c.exam_date === '2027-06-12' && c.exam_period_id, JSON.stringify(c));
    cyc.updateCycle(P.admin, em.cid, { examDate: '10/2027' });
    c = doc();
    assert(c.exam_month === '2027-10' && c.exam_date === null, JSON.stringify(c));
    cyc.updateCycle(P.admin, em.cid, { examDate: '' });
    c = doc();
    assert(c.exam_month === null && c.exam_date === null, JSON.stringify(c));
  });

  // ------------------------------------------------------------------ NT-5: đầu hồ sơ
  check('NT-5 · đầu hồ sơ lớp thường: có Target + thi IELTS dự kiến, vẫn giữ Final Test', () => {
    conn.prepare("UPDATE learning_cycles SET target_score = 6.5, khong_cam_ket = 0, exam_month = '2027-05', exam_date = NULL, exam_period_id = NULL WHERE id = ?").run(em.cid);
    const tt = prof.studentProfile(P.admin, em.sid).dauHoSo.thongTin;
    assert(tt.target === 6.5, JSON.stringify(tt));
    assert(tt.thiDuKien === null || tt.thiDuKien.nhan === 'Final Test', 'Final Test giữ nguyên: ' + JSON.stringify(tt.thiDuKien));
    assert(tt.thiIelts === '05/2027', JSON.stringify(tt));   // NEN-V5 P5: mm/yyyy   // OV-11d (CA2-9): tháng dự kiến một dạng với Học viên & Lớp
    conn.prepare("UPDATE learning_cycles SET khong_cam_ket = 1, target_score = NULL, exam_month = NULL WHERE id = ?").run(em.cid);
    const kck = prof.studentProfile(P.admin, em.sid).dauHoSo.thongTin;
    assert(kck.target === null && kck.kck === true && kck.thiIelts === null, JSON.stringify(kck));   // OV-9: Target và dấu KCK tách ("— · KCK")
  });

  // ------------------------------------------------------------------ NT-6 (chủ sản phẩm 04/10): lên lớp thường mang Target + Dự kiến thi
  /* Đặt CUỐI: hai em rời MB FOU 12. */
  const llt: any = await import('../classes/luatLoTrinh.ts');
  const dich = conn.prepare(`SELECT c.id, c.code, c.programme_code, c.branch_id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
                              WHERE pg.scoring_mode = 'ratio' AND c.status = 'active' AND c.programme_code != (SELECT programme_code FROM classes WHERE id = ?)
                                AND c.branch_id = (SELECT branch_id FROM classes WHERE id = ?) LIMIT 1`).get(thuong, thuong) as any;
  const em2 = conn.prepare(`SELECT s.id AS sid, cy.id AS cid FROM students s JOIN learning_cycles cy ON cy.student_id = s.id WHERE s.email = 'nt-ghi2@demo.test'`).get() as any;
  const khoaMoi = (sid: number) => conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;

  check('NT-6 · chuyển một em lớp thường → lớp thường (mở khoá mới): giữ Target + ngày thi', () => {
    assert(dich, 'seed: cần lớp thường khác chương trình cùng chi nhánh');
    conn.prepare(`UPDATE learning_cycles SET target_score = 6.5, khong_cam_ket = 0, exam_month = '2027-05', exam_date = '2027-05-20', exam_period_id = ? WHERE id = ?`)
      .run((conn.prepare('SELECT exam_period_id FROM learning_cycles WHERE id = ?').get(em.cid) as any).exam_period_id, em.cid);
    const cu = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(em.cid) as any;
    const r = llt.apDungMotDong(P.admin, { sid: em.sid, toClassId: dich.id, ngay: t.TODAY, lyDo: 'Xếp lại trình độ', boiCanh: 'giua-khoa' });
    assert(r.luat?.khoa === 'dong-mo', JSON.stringify(r.luat));
    const m = khoaMoi(em.sid);
    assert(m.id !== em.cid && m.target_score === 6.5 && m.khong_cam_ket === 0, JSON.stringify(m));
    assert(m.exam_month === '2027-05' && m.exam_date === '2027-05-20' && m.exam_period_id === cu.exam_period_id, JSON.stringify(m));
    assert(soLuotCua(m.id, `kind = 'mock'`) === 0 && soLuotCua(m.id, 'target_at_attempt IS NOT NULL') === 0, 'khoá mới không được bật FT');
  });

  check('NT-6 · Chuyển tiếp cả lớp (lên lớp thường): giữ KCK + tháng thi', () => {
    llt.apDungCaLop(P.admin, { fromClass: { id: thuong, code: 'MB FOU 12' }, ngay: t.TODAY, dongs: [
      { sid: em2.sid, huong: 'len_lop', toClassId: dich.id, toClass: { ma: dich.programme_code, ft: false, branchId: dich.branch_id, code: dich.code } },
    ] });
    const m = khoaMoi(em2.sid);
    assert(m.id !== em2.cid && m.target_score === null && m.khong_cam_ket === 1 && m.exam_month === '2027-07' && m.exam_date === null, JSON.stringify(m));
  });
}
