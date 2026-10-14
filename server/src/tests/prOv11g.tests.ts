/**
 * PHÉP KIỂM PR-OV11g — Học viên & Lớp · hồ sơ lớp (đặc tả rà soát 14/10 mục 3: Q3, Q4, Q11):
 *   (1) Q3/HL-2: em thiếu ngày sinh hoặc email vào "Thiếu thông tin" — chip Học viên & Lớp = ô Tổng quan TVV / CX (cùng hàm);
 *       Thêm HV / Sửa cả lớp thiếu ngày sinh, email → lưu được (gõ sai dạng vẫn lỗi);
 *   (2) Q11/HL-19: em Kết thúc học chưa Lưu trữ có trong `/hoc-vien-lop` (chỉ "Tất cả") + roster `kemKetThuc` ở lớp cuối; không vào chip việc;
 *   (3) Q4/HL-10: GV ghi điểm lớp `finished` → 403 (lớp thường + FT), QL → 200 + nhật ký; bảng điểm GV chỉ đọc;
 *   (4) HL-4: đầu hồ sơ lớp "Final Test a/b" = `duDiem / coLich` của khối điểm; (5) HL-1: seed lớp 1, 2 `finished`, Lưu trữ có 2 lớp;
 *   (6) HL-8 / HL-14 / HL-12 / CA2-4 / CA2-12: badge Admin, "+ Học viên" khi tìm không ra, lớp cùng chi nhánh lên đầu, câu chặn Kết thúc lớp.
 * Mỗi ca cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11gTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const hvl: any = await import('../classes/hocVienLop.ts');
  const hvCuaToi: any = await import('../worklist/hvCuaToi.ts');
  const classes: any = await import('../classes/classes.ts');
  const intake: any = await import('../classes/intake.ts');
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const regular: any = await import('../normal/regular.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const diemLuot: any = await import('../cham/diemTheoLuot.ts');
  const luuTru: any = await import('../classes/luuTru.ts');
  const transition: any = await import('../classes/transition.ts');
  const xoaKetThuc: any = await import('../classes/xoaKetThucLop.ts');
  const students: any = await import('../students/students.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV11g · Học viên & Lớp · hồ sơ lớp: Thiếu thông tin, em Kết thúc học, lớp đã kết thúc, một mẫu số');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const QL = P.mbManager;
  const mb = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const FT101 = classId('MB FT 101'), FOU12 = classId('MB FOU 12');
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov11g.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov11g', fullName: `Thử OV11g ${seq}`, roles }).userId as number;
  };
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const idAdmin = tao([{ role: 'office_admin', branches: ['MB'] }]);
  const emDangHoc = (lop: number) => all(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id`, lop).map((r) => r.id as number);
  const trangQl = () => hvl.danhSachHocVienLop(QL, { phamVi: 'chi-nhanh', branchId: mb });

  check('OV11g-1 · Q3: em thiếu email (hoặc ngày sinh) vào "Thiếu thông tin" — chip Học viên & Lớp QL = ô Tổng quan CX cùng chi nhánh', () => thu(() => {
    const [a, b] = emDangHoc(FT101);
    run(`UPDATE students SET email = NULL, dob = '2008-01-01' WHERE id = ?`, a);
    run(`UPDATE students SET email = 'b@gmail.com', dob = NULL WHERE id = ?`, b);
    xoaNho();
    const tr = trangQl();
    const thieu = new Set(tr.hocVien.filter((h: any) => h.loc.includes('thieu_tt')).map((h: any) => h.id));
    assert(thieu.has(a) && thieu.has(b), `chip Thiếu thông tin thiếu em ${a} (không email) / ${b} (không ngày sinh)`);
    const keys = (id: number) => classes.classRoster(QL, FT101).find((r: any) => r.id === id).missing.map((m: any) => m.key);
    assert(keys(a).includes('email') && keys(b).includes('dob'), `badge dòng: ${keys(a)} | ${keys(b)}`);
    const cx = hvCuaToi.chipHocVien(loadPrincipal(idCx), { branchId: mb });
    assert(cx.ids.thieu_tt.includes(a) && cx.ids.thieu_tt.includes(b), 'ô "Thiếu thông tin" CX thiếu em');
    assert(cx.ids.thieu_tt.length === tr.dem.thieu_tt, `ô CX ${cx.ids.thieu_tt.length} ≠ chip QL ${tr.dem.thieu_tt}`);
  }));

  check('OV11g-1b · Q3: Thêm HV (lưới + dán Excel) và Sửa cả lớp thiếu ngày sinh, email → lưu được; ngày sinh / email sai dạng vẫn lỗi đúng ô', () => thu(() => {
    const r = intake.previewIntake(QL, { classId: FT101, rows: [{ fullName: 'OV11g Không NS' }, { fullName: 'OV11g Sai', dob: '31/02/2010', email: 'abc' }] });
    const loiO = (row: number, f: string) => r.issues.some((i: any) => i.row === row && i.field === f && i.muc === 'loi');
    assert(!r.issues.some((i: any) => i.row === 1 && i.muc === 'loi'), `dòng thiếu ngày sinh + email bị chặn: ${JSON.stringify(r.issues)}`);
    assert(loiO(2, 'dob') && loiO(2, 'email'), `sai dạng phải lỗi: ${JSON.stringify(r.issues)}`);
    const dan = intake.parsePaste('Họ và tên\tNgày sinh\tEmail\nOV11g Dán\t\t', { classId: FT101 });
    assert(!intake.previewIntake(QL, { classId: FT101, rows: dan.rows }).issues.some((i: any) => i.muc === 'loi' && (i.field === 'dob' || i.field === 'email')), 'dán Excel thiếu ngày sinh bị chặn');
    intake.commitIntake(QL, { classId: FT101, rows: [{ fullName: 'OV11g Không NS' }] });
    assert(one(`SELECT dob, email FROM students WHERE full_name = 'OV11g Không NS'`)?.dob === null, 'không thêm được em thiếu ngày sinh');
    assert(!d.cotLuoiNhap(false).find((x: any) => x.key === 'dob')?.batBuoc, 'cột Ngày sinh còn dấu *');
    const em = emDangHoc(FT101)[0];
    run('UPDATE students SET dob = NULL, email = NULL WHERE id = ?', em);
    const ten = one('SELECT full_name FROM students WHERE id = ?', em).full_name;
    const xt = suaCaLop.xemTruocSuaCaLop(QL, FT101, { rows: [{ studentId: em, fullName: `${ten} X` }] });
    assert(!xt.rows[0].issues.length, `Sửa cả lớp chặn em thiếu ngày sinh: ${JSON.stringify(xt.rows[0].issues)}`);
    suaCaLop.luuSuaCaLop(QL, FT101, { rows: [{ studentId: em, fullName: `${ten} X` }] });
    assert(one('SELECT full_name FROM students WHERE id = ?', em).full_name === `${ten} X`, 'Sửa cả lớp không lưu');
  }));

  check('OV11g-2 · Q11: em Kết thúc học chưa Lưu trữ — có trong /hoc-vien-lop (chỉ "Tất cả"), roster kemKetThuc ở lớp cuối (mờ), không vào chip việc; em Kết thúc học CX thấy thì QL cùng chi nhánh thấy', () => thu(() => {
    /* Em chỉ một dòng lớp (bộ kiểm trước có thể để lại em nhiều dòng) — lớp cuối = MB FT 101. */
    const em = emDangHoc(FT101).find((id) => one('SELECT COUNT(*) n FROM enrollments WHERE student_id = ?', id).n === 1)!;
    students.setStudentStatus(QL, em, 'finished', TODAY);
    run('UPDATE students SET archived_at = NULL WHERE id = ?', em);   // em FT chờ kết quả thi thật (OV-8a) — chưa lưu trữ
    xoaNho();
    const tr = trangQl();
    const h = tr.hocVien.find((x: any) => x.id === em);
    assert(h && h.classId === FT101 && h.loc.join() === 'tat-ca', `em kết thúc học: ${JSON.stringify(h)}`);
    const ro = classes.classRoster(QL, FT101, undefined, true).find((r: any) => r.id === em);
    assert(ro?.status === 'finished', 'roster kemKetThuc thiếu em');
    assert(!classes.classRoster(QL, FT101).some((r: any) => r.id === em), 'roster thường (bảng khác của lớp) có em kết thúc học');
    assert(hvl.danhSachHocVienLop(QL, { phamVi: 'chi-nhanh', branchId: mb, q: one('SELECT full_name FROM students WHERE id = ?', em).full_name }).hocVien.some((x: any) => x.id === em), 'tìm tên không ra em');
    const cx = hvCuaToi.chipHocVien(loadPrincipal(idCx), { branchId: mb });
    assert(cx.tatCa.includes(em), 'CX không có em');
    /* Em Kết thúc học (chưa Lưu trữ) CX thấy thì QL cùng chi nhánh cũng thấy (HL-19). Em Tạm dừng / chưa xếp lớp do bộ kiểm trước để lại
       nằm ngoài OV-11g — DB demo: QL = CX (đã đo 14/10: 100 = 100). */
    const coQl = new Set(tr.hocVien.map((x: any) => x.id));
    const lech = cx.tatCa.filter((id: number) => !coQl.has(id) && one(`SELECT s.status = 'finished' AND c.status = 'active' AS co FROM students s
        JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id) JOIN classes c ON c.id = e.class_id WHERE s.id = ?`, id)?.co);
    assert(!lech.length, `em Kết thúc học CX thấy mà QL không: ${lech}`);
    /* Lưu trữ → rời danh sách; Bỏ lưu trữ (Hoàn tác) → về lại. */
    students.archiveStudent(QL, em);
    assert(!trangQl().hocVien.some((x: any) => x.id === em), 'đã lưu trữ vẫn hiện');
  }));

  check('OV11g-3 · Q4: lớp đã kết thúc — GV ghi điểm 403 (lớp thường + FT, kể cả nhận xét), QL 200 + nhật ký; bảng điểm GV chỉ đọc, QL sửa được', () => thu(() => {
    const a = one(`SELECT a.id, a.class_id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = a.id AND k.skill = 'listening' AND rp.week_start <= ?)
      ORDER BY a.id LIMIT 1`, FOU12, TODAY);
    assert(!!a, 'không có bài lớp thường để thử');
    const gv = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active'`, FOU12).user_id;
    run(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`, TODAY, FOU12);
    xoaNho();
    const pGv = loadPrincipal(gv);
    assert(loi(() => regular.saveRegularScore(pGv, a.id, 'listening', { score: 20, total: 40 }))?.status === 403, 'GV ghi điểm lớp kết thúc phải 403');
    assert(loi(() => regular.saveRegularScore(pGv, a.id, 'listening', { nhanXet: 'x' }))?.status === 403, 'GV ghi nhận xét lớp kết thúc phải 403');
    const nk = () => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'regular.score.override' AND actor_user_id = ?`, QL.userId).n;
    const truoc = nk();
    regular.saveRegularScore(QL, a.id, 'listening', { score: 21, total: 40, lyDo: 'Sửa sau kết thúc lớp' });
    assert(one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a.id).raw_score === 21, 'QL không ghi được');
    assert(nk() === truoc + 1, 'thiếu nhật ký "regular.score.override"');
    const bangGv = diemLuot.bangTheoLuot(pGv, FOU12, 'thuong:final');
    const bangQl = diemLuot.bangTheoLuot(QL, FOU12, 'thuong:final');
    const oSua = (b: any) => b.thuong.rows.some((r: any) => r.skillSchedule.some((k: any) => k.canEdit));
    assert(!oSua(bangGv) && !bangGv.thuong.editableSkills.length, 'GV còn ô sửa được ở lớp kết thúc');
    assert(oSua(bangQl), 'QL không còn ô sửa được');
    /* FT: cùng luật ở `saveScore`. */
    const m = one(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.attempt_no LIMIT 1`, FT101);
    const gvL = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active'`, FT101).user_id;
    run(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`, TODAY, FT101);
    xoaNho();
    assert(loi(() => attempts.saveScore(loadPrincipal(gvL), m.id, 'listening', { rawScore: 30 }))?.status === 403, 'GV FT ghi điểm lớp kết thúc phải 403');
  }));

  check('OV11g-3b · rà #379: lớp đã kết thúc — Báo vắng / "-" bị chặn (GV 403, QL 400, cả FT lẫn lớp thường); có lý do → lưu, KHÔNG tự tạo Case / tín hiệu; sửa ô đã có điểm thiếu lý do 400', () => thu(() => {
    /* (1)(3) FT: Báo vắng + "-" — GVCN 403, QL 400; không ghi gì. */
    const k = one(`SELECT a.id, k.skill FROM assessment_attempts a JOIN attempt_skills k ON k.attempt_id = a.id JOIN report_periods rp ON rp.id = k.planned_period_id
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0 AND k.required = 1 AND k.sit_status = 'scheduled'
          AND k.skill IN ('listening', 'reading') AND rp.week_start <= ?
          AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = k.skill)
        ORDER BY a.id LIMIT 1`, FT101, TODAY);
    assert(!!k, 'không có ô FT chờ thi để thử Báo vắng');
    const gvcn = loadPrincipal(one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`, FT101).user_id);
    run(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id IN (?, ?)`, TODAY, FT101, FOU12);
    xoaNho();
    assert(loi(() => absence.baoVang(gvcn, k.id, k.skill, 'ốm', TODAY))?.status === 403, 'GVCN Báo vắng lớp kết thúc phải 403');
    assert(loi(() => absence.baoVang(QL, k.id, k.skill, 'ốm', TODAY))?.status === 400, 'QL Báo vắng lớp kết thúc phải 400');
    assert(loi(() => attempts.saveScore(QL, k.id, k.skill, { noShow: true }, TODAY))?.status === 400, 'QL "-" FT lớp kết thúc phải 400');
    assert(!one('SELECT 1 FROM assessment_scores WHERE attempt_id = ? AND skill = ?', k.id, k.skill), 'đã ghi vắng dù bị chặn');
    /* (3)(4)(2) lớp thường: "-" QL 400 · thiếu lý do 400 · có lý do → lưu + nhật ký, không Case / tín hiệu mới. */
    const g = one(`SELECT a.id, a.student_id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'progress' AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = a.id AND k.skill = 'listening' AND rp.week_start <= ?)
      ORDER BY a.id LIMIT 1`, FOU12, TODAY);
    assert(!!g, 'không có bài Giữa khoá để thử');
    assert(loi(() => regular.saveRegularScore(QL, g.id, 'listening', { noShow: true }))?.status === 400, 'QL "-" lớp thường kết thúc phải 400');
    const dem = () => [one('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', g.student_id).n,
      one('SELECT COUNT(*) n FROM case_signals WHERE student_id = ?', g.student_id).n].join('/');
    const truoc = dem();
    regular.saveRegularScore(QL, g.id, 'listening', { score: 3, total: 40, lyDo: 'Nhập sai, sửa lại' });
    assert(one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, g.id).raw_score === 3, 'QL có lý do không lưu được');
    assert(dem() === truoc, `tự tạo Case / tín hiệu ở lớp đã kết thúc: ${truoc} → ${dem()}`);
    /* (4) Sửa ô đã có điểm thiếu lý do → 400 (nhập lần đầu — Final về muộn, Q30-4 — không đòi). */
    assert(loi(() => regular.saveRegularScore(QL, g.id, 'listening', { score: 4, total: 40 }))?.status === 400, 'sửa điểm thiếu lý do phải 400');
  }));

  check('OV11g-4 · HL-4: đầu hồ sơ lớp thường "Final Test a/b em có đủ điểm" = duDiem / coLich của khối điểm (danhSachLuot)', () => thu(() => {
    const ov = classes.classOverview(QL, FOU12);
    const f = diemLuot.danhSachLuot(QL, FOU12).luot.find((l: any) => l.ma === 'thuong:final');
    assert(!!ov.cuoiKhoa && !!f, `thiếu dữ liệu: ${JSON.stringify(ov.cuoiKhoa)} · ${JSON.stringify(f)}`);
    assert(ov.cuoiKhoa.du === f.duDiem && ov.cuoiKhoa.tong === f.coLich, `đầu trang ${ov.cuoiKhoa.du}/${ov.cuoiKhoa.tong} ≠ khối điểm ${f.duDiem}/${f.coLich}`);
  }));

  check('OV11g-5 · HL-1: seed — MB FOU 03, MB BE 08 `finished` + finished_at; Lưu trữ có 2 lớp này', () => {
    for (const ma of ['MB FOU 03', 'MB BE 08']) {
      const c = one('SELECT status, finished_at FROM classes WHERE code = ?', ma);
      assert(c.status === 'finished' && !!c.finished_at, `${ma}: ${JSON.stringify(c)}`);
    }
    const lt = luuTru.danhSachLuuTru(QL, { branchId: mb }).lop.map((l: any) => l.code);
    assert(lt.includes('MB FOU 03') && lt.includes('MB BE 08'), `Lưu trữ: ${lt}`);
  });

  check('OV11g-6 · HL-8 / HL-14 / HL-12 / CA2-4 / CA2-12: badge Admin, "+ Học viên" khi tìm không ra, lớp cùng chi nhánh lên đầu, câu chặn Kết thúc lớp', () => thu(() => {
    for (const k of ['qua-han', 'cho-duyet', 'xep-lop']) assert(!d.badgeHienTheoVai('admin', k) && d.badgeHienTheoVai(null, k), `badge ${k}`);
    assert(d.badgeHienTheoVai('admin', 'thieu-tt') && d.badgeHienTheoVai('admin', 'cham') && !d.badgeHienTheoVai('tvv', 'cham'), 'badge thông tin');
    assert(!d.chipViecTheoVai('admin', 'can-lam') && d.chipViecTheoVai('admin', 'thieu_tt') && d.chipViecTheoVai(null, 'can-lam'), 'chip Admin');
    const adm = hvl.danhSachHocVienLop(loadPrincipal(idAdmin), { phamVi: 'chi-nhanh', branchId: mb });
    assert(adm.rows.length > 0, 'Admin không thấy lớp');
    const tim = hvl.danhSachHocVienLop(QL, { phamVi: 'chi-nhanh', branchId: mb, q: 'khongcoaitenvay' });
    assert(tim.rows.length === 0 && tim.coTheThemHocVien === true, `"+ Học viên" mất khi tìm không ra: ${tim.coTheThemHocVien}`);
    assert(trangQl().coTheThemHocVien === true, 'QL không có "+ Học viên"');
    for (const gv of [P.subjectTeacher, P.coreTeacher]) {
      assert(hvl.danhSachHocVienLop(gv, { q: 'khongcoaitenvay' }).coTheThemHocVien === hvl.danhSachHocVienLop(gv, {}).coTheThemHocVien, 'cờ "+ Học viên" của GV đổi theo ô tìm');
    }
    /* HL-12: lớp cùng chi nhánh lên đầu ô Lớp chuyển đến (lớp thường). */
    const kh = transition.transitionPlan(QL, FOU12);
    const cn = kh.candidates.map((c: any) => c.branchId === mb);
    assert(cn.length > 0 && cn.indexOf(false) === -1 || cn.lastIndexOf(true) < cn.indexOf(false), `thứ tự lớp: ${kh.candidates.map((c: any) => c.code)}`);
    assert(d.kiemDongLenh({ huong: 'len_lop', lopDichId: 1, lopDichFt: false, nguonFt: false, tuan: null, homNay: TODAY, lyDo: null, khacGoiY: false, mucTieu: null, ngayXemLai: null }) === 'Chọn tuần bắt đầu.', 'ô tuần trống');
    /* CA2-4 / CA2-12: Kết thúc lớp còn em — lớp thường nói "chưa chốt Lộ trình tiếp theo", FT giữ câu chuyển lớp. */
    const n = emDangHoc(FOU12).length;
    const tt = xoaKetThuc.xemXoaKetThuc(QL, FOU12);
    assert(new RegExp(`^Còn \\d+ em (chưa chốt Lộ trình tiếp theo|chờ tới tuần chuyển lớp)\\.$`).test(tt.lyDoChanKetThuc ?? '') && n > 0, `lớp thường: ${tt.lyDoChanKetThuc}`);
    assert(/chuyển lớp từng em/.test(xoaKetThuc.xemXoaKetThuc(QL, FT101).lyDoChanKetThuc ?? ''), 'FT');
    assert(d.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 0, needScoresTitle: null, phase: 'running', missingCount: 0, soChuaLoTrinhTiep: 4 })
      .hien.some((b: any) => b.nhan === '4 HV chưa chốt lộ trình'), 'badge "n HV chưa chốt lộ trình"');
  }));
}
