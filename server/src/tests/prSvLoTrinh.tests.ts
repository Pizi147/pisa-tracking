/**
 * PHÉP KIỂM P7 SV-LO-TRINH (plan.md 1.6 N11, N12, N22 ⑤; thiết kế 24/10 mục 3.1–3.3, E1–E3, E9, E10):
 *  · một nút "Tạm dừng/ Kết thúc học" mọi nơi, cả hai vào Lưu trữ, Quay lại học từ Lưu trữ;
 *  · Bước tiếp sau thi còn 2 hướng; Lộ trình mới LT1 / LT2 / RF / Khác, đầu vào = KQ thi thật, Case / PA cũ đóng "Kết thúc lộ trình".
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvLoTrinhTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrSvLoTrinh } = await import('../migrate/prSvLoTrinh.ts');
  const { xoaNho, soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  console.log('\nP7 SV-LO-TRINH — một nút Tạm dừng/ Kết thúc học, Quay lại học, Bước tiếp 2 hướng, Lộ trình mới');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Chạy trong giao dịch rồi cuộn lại — phép kiểm không để dấu trên DB chung. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const keys = (ds: any[]) => ds.map((m) => m.key).join();

  // ------------------------------------------------------------------ Task 1: luật thuần
  const QUYEN_QL = { ghiLoTrinhTiep: false, chuyenLop: true, tamDung: true, quayLai: true, ketThuc: true, luuTru: true, boLuuTru: false, hocLai: true };
  check('SV-1 · menu ⋯: MỘT mục "Tạm dừng/ Kết thúc học" (đang học / tạm dừng); Quay lại học cho em tạm dừng hoặc đã kết thúc; không còn Lưu trữ / Bỏ lưu trữ / Học lại', () => {
    const dang = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: QUYEN_QL }, cycle: { ratio: false }, status: 'active' });
    assert(dang.slice(0, 3).map((m: any) => m.key).join() === 'info,chuyen-lop,tam-dung-ket-thuc', keys(dang));
    assert(dang.find((m: any) => m.key === 'tam-dung-ket-thuc').nhan === 'Tạm dừng/ Kết thúc học', 'đúng chữ chủ SP');
    for (const k of ['luu-tru', 'bo-luu-tru', 'hoc-lai', 'tam-dung-thoi-hoc']) assert(!keys(dang).split(',').includes(k), `còn ${k}`);
    assert(!keys(dang).includes('quay-lai'), 'đang học: không Quay lại học');
    const dung = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { chiXem: true, quyen: QUYEN_QL }, cycle: { ratio: false }, status: 'inactive' });
    assert(keys(dung).includes('tam-dung-ket-thuc') && keys(dung).includes('quay-lai'), `tạm dừng: ${keys(dung)}`);
    /* [ĐX] em tạm dừng (Lưu trữ) vẫn Sửa thông tin liên hệ — TVV gọi mời học lại. */
    assert(keys(dung).split(',')[0] === 'info' && !keys(dung).split(',').includes('lo-trinh') && !keys(dung).includes('outcome') && !keys(dung).includes('chuyen-lop'), `tạm dừng chỉ xem trừ 3 việc: ${keys(dung)}`);
    const xong = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { chiXem: true, quyen: { ...QUYEN_QL, tamDung: false, ketThuc: false } }, cycle: { ratio: false }, status: 'finished' });
    assert(keys(xong) === 'quay-lai,lich-su-sua', `kết thúc + lưu trữ: ${keys(xong)}`);
    assert(d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: { ...QUYEN_QL, hocLai: false } }, cycle: null, status: 'finished' }).every((m: any) => m.key !== 'quay-lai'), 'không quyền Học lại → không Quay lại học');
    assert(d.NHAN_VIEC_QUAN_LY['quay-lai'] === 'Quay lại học', 'nhãn Quay lại học');
    const vai = (status: string) => keys(d.mucDongTheoVai({ suaThongTin: true, suaThem: true, ft: true, status }));
    assert(vai('active') === 'info,tam-dung-ket-thuc,outcome', `⋯ theo vai: ${vai('active')}`);
    assert(d.coTheTamDungKetThuc(QUYEN_QL, 'active').tamDung && d.coTheTamDungKetThuc(QUYEN_QL, 'active').ketThuc, 'đang học: cả hai');
    assert(!d.coTheTamDungKetThuc(QUYEN_QL, 'inactive').tamDung && d.coTheTamDungKetThuc(QUYEN_QL, 'inactive').ketThuc, 'tạm dừng: chỉ Kết thúc học');
    assert(!d.coTheTamDungKetThuc(QUYEN_QL, 'finished').ketThuc, 'đã kết thúc: không');
  });

  check('SV-2 · Bước tiếp 2 hướng: goiYSauThi Đạt → "dung", chưa đạt / Không thi → Lộ trình mới, không Target → null; không trả hoc_lai (E9)', () => {
    assert(d.HUONG_SAU_THI.join() === 'dung,lo_trinh_moi', 'hai hướng trên web');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'reached' }) === 'dung', 'Đạt');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'not_reached' }) === 'lo_trinh_moi', 'Chưa đạt');
    assert(d.goiYSauThi({ khongThi: true, ketLuan: 'unknown' }) === 'lo_trinh_moi', 'Không thi');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'unknown' }) === null, 'không Target');
    assert(d.NHAN_HUONG_SAU_THI.dung === 'Tạm dừng/ Kết thúc học' && d.NHAN_SAU_THI.ket_thuc === 'Kết thúc học', 'nhãn');
    /* dữ liệu cũ vẫn đọc được */
    assert(['hoc_tiep', 'hoc_lai', 'tam_dung', 'ket_thuc', 'lo_trinh_moi'].every((k) => typeof d.NHAN_SAU_THI[k] === 'string'), 'đủ nhãn dữ liệu cũ');
  });

  check('SV-3a · route Khác: ROUTES + ROUTE_NAME, tên hiển thị dùng route_ten; lý do đóng Case "Kết thúc lộ trình"', () => {
    assert(d.ROUTES.includes('KHAC') && d.ROUTE_NAME.KHAC === 'Khác', 'route KHAC');
    assert(d.tenRoute({ route: 'KHAC', route_ten: 'Luyện Speaking 1–1' }) === 'Luyện Speaking 1–1' && d.tenRoute({ route: 'KHAC' }) === 'Khác' && d.tenRoute({ route: 'LT2' }) === 'LT2', 'tên');
    assert(d.SYSTEM_CLOSE_REASON_LABEL.ket_thuc_lo_trinh === 'Kết thúc lộ trình', 'lý do Case');
  });

  check('SV-3b · migrate prSvLoTrinh: em Tạm dừng cũ → archived_at = ngày pause gần nhất (không có → updated_at / hôm nay); chạy hai lần không đổi thêm; cột route_ten, route KHAC (ngừng — không mở lớp)', () => thu(() => {
    const sid = get(`SELECT s.id FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).id;
    const sid2 = get(`SELECT s.id FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL AND s.id != ? ORDER BY s.id LIMIT 1`, sid).id;
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = NULL WHERE id IN (?, ?)`).run(sid, sid2);
    conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'pause', '2026-08-03', 'Tạm dừng học', ?), (?, 'pause', '2026-09-01', 'Tạm dừng học', ?)`)
      .run(sid, TODAY, sid, TODAY);
    conn.prepare(`DELETE FROM journey_events WHERE student_id = ? AND event_type = 'pause'`).run(sid2);
    const lan1: string[] = [];
    migratePrSvLoTrinh(conn, lan1);
    assert(get('SELECT archived_at FROM students WHERE id = ?', sid).archived_at === '2026-09-01', 'ngày pause gần nhất');
    const a2 = get('SELECT archived_at FROM students WHERE id = ?', sid2).archived_at as string | null;
    assert(!!a2 && /^\d{4}-\d{2}-\d{2}$/.test(a2), `không có pause → có ngày: ${a2}`);
    assert(lan1.some((x) => /Tạm dừng/.test(x)), `lần 1 in dòng: ${lan1.join(' | ')}`);
    assert((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).some((c) => c.name === 'route_ten'), 'cột route_ten');
    const khac = get(`SELECT status FROM routes WHERE code = 'KHAC'`);
    assert(khac?.status === 'inactive', 'route KHAC ngừng (không chọn khi mở lớp)');
    const truoc = JSON.stringify(conn.prepare(`SELECT id, archived_at FROM students ORDER BY id`).all());
    const lan2: string[] = [];
    migratePrSvLoTrinh(conn, lan2);
    assert(lan2.length === 0 && JSON.stringify(conn.prepare(`SELECT id, archived_at FROM students ORDER BY id`).all()) === truoc, `lần 2 không đổi: ${lan2.join(' | ')}`);
  }));

  // ------------------------------------------------------------------ Task 2: máy chủ — trạng thái, Quay lại học, Lưu trữ
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const thv: any = await import('../students/trangThaiHv.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const profile: any = await import('../students/profile.ts');
  const luuTru: any = await import('../classes/luuTru.ts');
  const bt: any = await import('../loTrinh/buocTiep.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const { ngungHocCua } = await import('../fasttrack/attempts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  let seq = 0;
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const nguoi = (role: string, branches: string[]) => {
    seq += 1;
    return loadPrincipal(accounts.createAccount(P.admin, { email: `p7sv.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-p7sv', fullName: `Thử P7 ${seq}`, roles: [{ role, branches }] }).userId);
  };
  const lop = (route = 'LT1', tuanTruoc = 10) => {
    seq += 1;
    const start = t.addDays(T2, -7 * tuanTruoc);
    return intake.createClass(P.admin, { code: `MB P7-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route, startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  };
  /** Em đang học lớp FT, lộ trình `route` Target 6.5 bắt đầu 10 tuần trước, MT1 có điểm L (điểm cũ phải ở lại lộ trình cũ). */
  const em = (classId: number, route = 'LT1') => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-P7-${seq}`, `Học viên P7 ${seq}`, `hoc vien p7 ${seq}`, MB, NOW).lastInsertRowid);
    const bd = t.addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_month, start_period_id, started_at, status, created_at) VALUES (?,1,?,'FT',6.5,'2026-08',?,?, 'active', ?)`)
      .run(sid, route, week.ensurePeriod(bd).id, bd, NOW).lastInsertRowid);
    const a = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'mock',?,?,'completed',?)`)
      .run(cy, sid, classId, week.ensurePeriod(t.addDays(T2, -7 * 4)).id, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 6, ?)`).run(a, NOW);
    return { sid, cy, mt1: a };
  };
  const hs = (sid: number) => get('SELECT * FROM students WHERE id = ?', sid);
  const QL = P.mbManager;

  check('SV-4a · Tạm dừng → Lưu trữ (giữ lớp, ghi danh paused, lộ trình đứng yên); Hoàn tác xoá archived_at (E10); Kết thúc học → Lưu trữ', () => thu(() => {
    const L = lop(); const { sid, cy } = em(L);
    students.setStudentStatus(QL, sid, 'inactive', TODAY, 'Nghỉ hè');
    assert(hs(sid).status === 'inactive' && hs(sid).archived_at === TODAY, `tạm dừng vào Lưu trữ: ${JSON.stringify(hs(sid))}`);
    assert(get(`SELECT status FROM enrollments WHERE student_id = ?`, sid).status === 'paused' && get('SELECT status FROM learning_cycles WHERE id = ?', cy).status === 'active', 'giữ lớp + lộ trình');
    students.hoanTacTamDung(QL, sid);
    assert(hs(sid).status === 'active' && hs(sid).archived_at === null, 'Hoàn tác: hết lưu trữ (E10)');
    /* em tạm dừng (Lưu trữ) → Kết thúc học được, vẫn ở Lưu trữ */
    students.setStudentStatus(QL, sid, 'inactive', TODAY);
    students.setStudentStatus(QL, sid, 'finished', TODAY, 'Thôi hẳn');
    assert(hs(sid).status === 'finished' && !!hs(sid).archived_at, `tạm dừng → kết thúc vẫn lưu trữ: ${JSON.stringify(hs(sid))}`);
  }));

  check('SV-4b · hồ sơ em tạm dừng (Lưu trữ): chỉ xem trừ Quay lại học · Kết thúc học · Sửa thông tin liên hệ ([ĐX]); lưới FT vẫn nhập bù', () => thu(() => {
    const L = lop(); const { sid } = em(L);
    students.setStudentStatus(QL, sid, 'inactive', TODAY);
    students.updateStudent(QL, sid, { phone: '0912345678', parentName: 'Mẹ Lan' });
    assert(hs(sid).phone === '0912345678', 'sửa liên hệ em tạm dừng');
    assert(loi(() => students.updateStudent(QL, sid, { note: 'x' }))?.message === d.CAU_LUU_TRU, 'sửa trường khác → 400');
    const h = profile.studentProfile(QL, sid);
    assert(h.lopHoc.chiXem && h.lopHoc.quyen.quayLai && h.lopHoc.quyen.ketThuc && !h.lopHoc.quyen.tamDung && !h.lopHoc.quyen.chuyenLop, `cờ quyền: ${JSON.stringify(h.lopHoc)}`);
    assert(JSON.stringify(ngungHocCua('inactive', TODAY)) === '{"nhan":"Tạm dừng","khoa":null}', 'lưới FT: em tạm dừng hàng mờ, không khoá');
    assert(ngungHocCua('finished', TODAY)?.khoa, 'em kết thúc + lưu trữ khoá như cũ');
  }));

  check('SV-4c · "Khi lưu, web sẽ" do máy chủ tính: tạm dừng (Lưu trữ · giữ chỗ · Case dừng hạn) / kết thúc (rời lớp · đóng Case); lệnh chuyển lớp chờ → chặn, nói đúng câu', () => thu(() => {
    const L = lop(); const { sid, cy } = em(L);
    conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, title, status, created_at, updated_at) VALUES (?,?,'reading','reading','Case P7','open',?,?)`).run(sid, cy, NOW, NOW);
    const td = thv.xemTruocTrangThai(QL, sid, false);
    assert(td.chan === null && td.dong[0] === 'Đưa em vào Lưu trữ · Tạm dừng' && td.dong.some((x: string) => /Giữ chỗ ở MB P7-\d+ · lộ trình LT1 đứng yên/.test(x))
      && td.dong.some((x: string) => x === '1 Case dừng hạn'), JSON.stringify(td));
    const kt = thv.xemTruocTrangThai(QL, sid, true);
    assert(kt.dong.some((x: string) => /Rời MB P7-\d+ · kết thúc lộ trình LT1/.test(x)) && kt.dong.some((x: string) => /^Đóng 1 Case/.test(x)), JSON.stringify(kt));
    const L2 = lop();
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc) VALUES (?,?,?,'chuyen_lop','giua-khoa',?,?,?,?)`)
      .run(sid, L, L2, t.addDays(T2, 14), QL.userId, TODAY, NOW);
    const chan = thv.xemTruocTrangThai(QL, sid, false).chan as string;
    assert(/quyết định chuyển lớp chờ W\d [A-Z]{3}/.test(chan) && /Chuyển lớp…/.test(chan), chan);
    assert(loi(() => thv.doiTrangThai(QL, sid, { status: 'inactive', date: TODAY }))?.message === chan, 'đổi trạng thái → 400 đúng câu');
  }));

  check('SV-5a · Quay lại học: lớp cũ còn chạy → một bấm (hết lưu trữ, đang học, mốc resume) + Hoàn tác về Lưu trữ', () => thu(() => {
    const L = lop(); const { sid } = em(L);
    students.setStudentStatus(QL, sid, 'inactive', t.addDays(TODAY, -7));
    const tt = thv.thongTinQuayLai(QL, sid);
    assert(tt.huong === 'lop-cu' && tt.lopCu.id === L, JSON.stringify(tt));
    thv.quayLaiHoc(QL, sid, {});
    assert(hs(sid).status === 'active' && hs(sid).archived_at === null && get(`SELECT status FROM enrollments WHERE student_id = ?`, sid).status === 'active', 'đang học lại');
    assert(get(`SELECT COUNT(*) n FROM journey_events WHERE student_id = ? AND event_type = 'resume'`, sid).n === 1, 'mốc resume');
    thv.hoanTacQuayLai(QL, sid);
    assert(hs(sid).status === 'inactive' && !!hs(sid).archived_at, 'Hoàn tác → về Lưu trữ');
  }));

  check('SV-5b · Quay lại học: lớp cũ đã kết thúc → gợi ý lớp đang chạy cùng chương trình cùng chi nhánh (N22 ⑤), đổi được, Bắt đầu; TVV 403', () => thu(() => {
    const L = lop(); const { sid } = em(L);
    students.setStudentStatus(QL, sid, 'inactive', t.addDays(TODAY, -7));
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, L);
    const L2 = lop();
    const tt = thv.thongTinQuayLai(QL, sid);
    assert(tt.huong === 'chon-lop' && tt.lopCu.daKetThuc && tt.goiYId !== null, JSON.stringify({ ...tt, lop: tt.lop.length }));
    const goiY = tt.lop.find((l: any) => l.id === tt.goiYId);
    assert(goiY.chiNhanhId === MB && goiY.ft && !tt.lop.some((l: any) => l.id === L), 'gợi ý cùng chi nhánh, FT, không lớp cũ');
    const TVV = nguoi('consultant', ['MB']);
    assert(loi(() => thv.quayLaiHoc(TVV, sid, { lopMoiId: L2 }))?.status === 403, 'TVV không xếp lớp mới');
    assert(tt.lop.every((l: any) => l.siSo !== undefined) && thv.thongTinQuayLai(TVV, sid).lop.every((l: any) => l.siSo === undefined), 'sĩ số chỉ cho Quản lý');
    thv.quayLaiHoc(QL, sid, { lopMoiId: L2 });
    assert(hs(sid).status === 'active' && hs(sid).archived_at === null && get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id === L2, 'đang học lớp mới');
  }));

  check('SV-5c · Quay lại học: lộ trình đã đóng (tạm dừng sau thi) / em kết thúc có KQ thi thật → mở panel Lộ trình mới; em kết thúc giữa khoá → đường Học lại', () => thu(() => {
    const L = lop(); const a = em(L); const b = em(L); const c = em(L);
    conn.prepare(`UPDATE learning_cycles SET thi_that_l = 7, thi_that_r = 7, thi_that_w = 6.5, thi_that_s = 6.5, thi_that_ngay = ? WHERE id IN (?, ?)`).run(t.addDays(TODAY, -3), a.cy, b.cy);
    bt.chonBuocTiep(QL, a.cy, { chon: 'tam_dung' });
    const ta = thv.thongTinQuayLai(QL, a.sid);
    assert(ta.huong === 'lo-trinh-moi' && ta.cycleId === a.cy, JSON.stringify(ta));
    bt.chonBuocTiep(QL, b.cy, { chon: 'ket_thuc' });
    const tb = thv.thongTinQuayLai(QL, b.sid);
    assert(hs(b.sid).archived_at && tb.huong === 'lo-trinh-moi' && tb.cycleId === b.cy, JSON.stringify(tb));
    students.setStudentStatus(QL, c.sid, 'finished', TODAY, 'Thôi');
    assert(thv.thongTinQuayLai(QL, c.sid).huong === 'hoc-lai', 'kết thúc giữa khoá → Học lại');
  }));

  check('SV-6 · hàng loạt "tam-dung": 3 em, 1 em có lệnh chuyển lớp chờ → lưu 2, em lỗi giữ lý do; xem trước có "Khi lưu, web sẽ"; Hoàn tác hàng loạt', () => thu(() => {
    const L = lop(); const ds = [em(L), em(L), em(L)];
    const L2 = lop();
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc) VALUES (?,?,?,'chuyen_lop','giua-khoa',?,?,?,?)`)
      .run(ds[2].sid, L, L2, t.addDays(T2, 14), QL.userId, TODAY, NOW);
    const ids = ds.map((x) => x.sid);
    const xem = hangLoat.xemTruoc(QL, { viec: 'tam-dung', studentIds: ids });
    assert(xem.tong.duoc === 2 && /quyết định chuyển lớp/.test(xem.rows[2].lyDoBo) && xem.tong.tomTat?.[0] === 'Đưa 2 em vào Lưu trữ · Tạm dừng', JSON.stringify(xem.tong));
    const kq = hangLoat.chay(QL, { viec: 'tam-dung', studentIds: ids, date: TODAY });
    assert(kq.ok.length === 2 && kq.failed.length === 1 && /quyết định chuyển lớp/.test(kq.failed[0].message), JSON.stringify(kq));
    assert(ids.slice(0, 2).every((id) => hs(id).archived_at === TODAY), 'hai em vào Lưu trữ');
    const nguoc = hangLoat.chay(QL, { viec: d.VIEC_NGUOC['tam-dung'], studentIds: kq.ok });
    assert(nguoc.ok.length === 2 && ids.slice(0, 2).every((id) => hs(id).status === 'active' && !hs(id).archived_at), 'Hoàn tác hàng loạt');
  }));

  check('SV-6b · trang Lưu trữ: em tạm dừng có nhãn "Tạm dừng · Có thể quay lại" + lớp giữ chỗ; em kết thúc "Kết thúc học"; một cờ Quay lại học', () => thu(() => {
    const L = lop(); const a = em(L); const b = em(L);
    students.setStudentStatus(QL, a.sid, 'inactive', TODAY);
    conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(b.cy);   // lộ trình FT đang chạy → Kết thúc học chờ KQ thi thật, chưa lưu trữ (TK-L)
    students.setStudentStatus(QL, b.sid, 'finished', TODAY, 'Thôi');
    const r = luuTru.danhSachLuuTru(QL, {});
    const ra = r.hocVien.find((x: any) => x.id === a.sid); const rb = r.hocVien.find((x: any) => x.id === b.sid);
    assert(ra?.trangThai === 'tam-dung' && /^MB P7-\d+$/.test(ra.lopCuoi) && ra.coTheQuayLai, JSON.stringify(ra ?? r.hocVien.length));
    assert(rb?.trangThai === 'ket-thuc' && rb.coTheQuayLai, JSON.stringify(rb ?? 'không có em kết thúc'));
  }));

  // ------------------------------------------------------------------ Task 3: máy chủ — Bước tiếp + Lộ trình mới
  /** Em có KQ thi thật (L 7 R 7 W 6.5 S 6.5 → OVR 7.0), một Case S mở + PA đang chạy của lộ trình đó. */
  const emThiXong = (classId: number, o: { khongThi?: boolean } = {}) => {
    const x = em(classId);
    if (o.khongThi) conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE id = ?`).run(x.cy);
    else conn.prepare(`UPDATE learning_cycles SET thi_that_l = 7, thi_that_r = 7, thi_that_w = 6.5, thi_that_s = 6.5, thi_that_ngay = ? WHERE id = ?`).run(t.addDays(TODAY, -3), x.cy);
    const caseId = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, title, status, created_at, updated_at) VALUES (?,?,'speaking','speaking','Case S P7','open',?,?)`)
      .run(x.sid, x.cy, NOW, NOW).lastInsertRowid);
    const paId = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, created_at, updated_at) VALUES (?, 'tutor', 'started', ?, ?)`).run(caseId, NOW, NOW).lastInsertRowid);
    return { ...x, caseId, paId };
  };
  const cyMoi = (sid: number) => get(`SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1`, sid);
  const soMt = (cy: number) => get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND status != 'cancelled'`, cy).n as number;

  check('SV-7a · Lộ trình mới LT2 (Giữ lớp, LT1 xong → LT2 chọn sẵn): MT1–MT3, không ngày thi cũ (E1), đầu vào = KQ thi thật (E3), Case / PA cũ đóng "Kết thúc lộ trình"; Hoàn tác mở lại', () => thu(() => {
    const L = lop(); const a = emThiXong(L);
    const xem = bt.xemTruocLoTrinhMoi(QL, a.cy, {});
    assert(xem.routeGoiY === 'LT2' && xem.loi === null, JSON.stringify(xem));
    assert(xem.dong.some((x: string) => /^Tạo MT1–MT3: W\d [A-Z]{3} · W\d [A-Z]{3} · W\d [A-Z]{3}$/.test(x)), `tóm tắt MT: ${xem.dong.join(' | ')}`);
    assert(xem.dong.some((x: string) => /^Đầu vào = KQ thi \d\d\/\d\d: L 7\.0 · R 7\.0 · W 6\.5 · S 6\.5$/.test(x)), `tóm tắt đầu vào: ${xem.dong.join(' | ')}`);
    assert(xem.dong.some((x: string) => /^Kết thúc LT1 · đóng 1 Case \(S\) — Kết thúc lộ trình$/.test(x)) && xem.dong.some((x: string) => x === 'Dừng 1 PA — Dừng · kết thúc lộ trình'), `tóm tắt Case: ${xem.dong.join(' | ')}`);
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi' });
    const m = cyMoi(a.sid);
    assert(m.seq === 2 && m.route === 'LT2' && m.status === 'active', `lộ trình mới: ${JSON.stringify(m)}`);
    assert(m.exam_month === null && m.exam_date === null && m.exam_period_id === null, 'E1: không chép ngày thi');
    assert(m.baseline_listening === 7 && m.baseline_reading === 7 && m.baseline_writing === 6.5 && m.baseline_speaking === 6.5 && m.baseline_score === 7 && /KQ thi thật/.test(m.baseline_note ?? ''), `E3 đầu vào: ${JSON.stringify(m)}`);
    assert(soMt(m.id) === 3 && get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', a.mt1).cycle_id === a.cy, 'MT1–MT3 mới, điểm cũ ở lại');
    const c = get('SELECT status, system_close_reason FROM sos_cases WHERE id = ?', a.caseId);
    const pa = get('SELECT status, closed_reason FROM case_interventions WHERE id = ?', a.paId);
    assert(c.status === 'done' && c.system_close_reason === 'ket_thuc_lo_trinh' && pa.status === 'cancelled' && pa.closed_reason === 'ket_thuc_lo_trinh', `Case / PA: ${JSON.stringify({ c, pa })}`);
    bt.boChonBuocTiep(QL, a.cy);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', a.caseId).status !== 'done' && get('SELECT status FROM case_interventions WHERE id = ?', a.paId).status === 'started', 'Hoàn tác mở lại Case + PA');
  }));

  check('SV-7b · Lộ trình mới RF ở lớp RF (em đang học → đường Chuyển lớp "Ngay bây giờ"): MT1–MT2, không ngày thi cũ, đầu vào thi thật, Case đóng "Kết thúc lộ trình"', () => thu(() => {
    const L = lop(); const RF = lop('RF'); const a = emThiXong(L);
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'RF', lopMoiId: RF });
    const m = cyMoi(a.sid);
    assert(m.route === 'RF' && soMt(m.id) === 2 && m.exam_month === null && m.baseline_score === 7, `RF: ${JSON.stringify(m)} · MT ${soMt(m.id)}`);
    assert(get('SELECT system_close_reason FROM sos_cases WHERE id = ?', a.caseId).system_close_reason === 'ket_thuc_lo_trinh', 'Case cũ đóng Kết thúc lộ trình');
  }));

  check('SV-7c · Lộ trình "Khác": ô Tên bắt buộc (400 tại ô), Bỏ Target → không Target, 0 MT (không nhắc xếp MT), tên hiện ở lộ trình', () => thu(() => {
    const L = lop(); const a = emThiXong(L);
    assert(/tên lộ trình/i.test(loi(() => bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'KHAC', routeTen: '  ' }))?.message ?? ''), 'thiếu tên → 400');
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'KHAC', routeTen: 'Luyện Speaking 1–1', boTarget: true });
    const m = cyMoi(a.sid);
    assert(m.route === 'KHAC' && m.route_ten === 'Luyện Speaking 1–1' && m.target_score === null && !m.khong_cam_ket && soMt(m.id) === 0, `Khác: ${JSON.stringify(m)}`);
    assert(schedule.lichMtCua({ route: 'LT1', lich_mt: '[6,12,16]' }, 'KHAC').length === 0, 'lịch MT của lộ trình Khác rỗng → không nhắc xếp MT');
  }));

  check('SV-7d · không có KQ thi thật (Không thi) → đầu vào = MT có Overall gần nhất, ghi nguồn; không ghép điểm nhiều lần thi', () => thu(() => {
    const L = lop(); const a = emThiXong(L, { khongThi: true });
    for (const [k, b] of [['reading', 6.5], ['writing1', 6], ['writing2', 6], ['speaking', 6]] as const) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)`).run(a.mt1, k, b, NOW);
    }
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'LT1' });
    const m = cyMoi(a.sid);
    assert(m.baseline_attempt_id === a.mt1 && /MT1/.test(m.baseline_note ?? '') && m.baseline_listening === null, `đầu vào MT: ${JSON.stringify(m)}`);
  }));

  check('SV-8 · lớp sai loại → 400 nói rõ (RF khi giữ lớp LT; LT2 vào lớp RF); Giữ lớp đã kết thúc → máy chủ tự mở lại lớp (E2)', () => thu(() => {
    const L = lop(); const RF = lop('RF'); const a = emThiXong(L);
    const loiRf = bt.xemTruocLoTrinhMoi(QL, a.cy, { route: 'RF' }).loi as string;
    assert(/là lớp LT — lộ trình RF cần lớp RF/.test(loiRf), loiRf);
    assert(loi(() => bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'RF' }))?.message === loiRf, 'chọn → 400 cùng câu');
    assert(/là lớp RF — lộ trình LT2 cần lớp LT/.test(loi(() => bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'LT2', lopMoiId: RF }))?.message ?? ''), 'LT2 vào lớp RF → 400');
    /* E2: tạm dừng sau thi → lớp kết thúc → Lộ trình mới "Giữ lớp" */
    bt.chonBuocTiep(QL, a.cy, { chon: 'tam_dung' });
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, L);
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'LT2' });
    assert(get('SELECT status FROM classes WHERE id = ?', L).status === 'active' && cyMoi(a.sid).route === 'LT2' && hs(a.sid).status === 'active', 'E2: mở lại lớp, không 400');
  }));

  check('SV-9 · Bước tiếp "Tạm dừng/ Kết thúc học" trong panel: ô tắt → ket_thuc + Lưu trữ, ô bật → tam_dung + Lưu trữ; ngày + lý do của hộp được ghi; Hoàn tác', () => thu(() => {
    const L = lop(); const a = emThiXong(L); const b = emThiXong(L);
    bt.chonBuocTiep(QL, a.cy, { chon: 'ket_thuc', lyDo: 'Đi du học' });
    assert(hs(a.sid).status === 'finished' && !!hs(a.sid).archived_at, 'Kết thúc học + Lưu trữ');
    assert(get(`SELECT detail FROM journey_events WHERE student_id = ? AND event_type = 'finish' ORDER BY id DESC LIMIT 1`, a.sid)?.detail === 'Đi du học', 'lý do của hộp');
    bt.chonBuocTiep(QL, b.cy, { chon: 'tam_dung' });
    assert(hs(b.sid).status === 'inactive' && !!hs(b.sid).archived_at, 'Tạm dừng + Lưu trữ');
    bt.boChonBuocTiep(QL, b.cy);
    assert(hs(b.sid).status === 'active' && !hs(b.sid).archived_at, 'Hoàn tác');
  }));

  check('SV-9b · trần câu SQL đường mới (không theo số học viên): xem trước Lộ trình mới ≤ 20 · Quay lại học (Lộ trình mới ≤ 20 / chọn lớp ≤ 26) · xem trước Tạm dừng ≤ 12', () => thu(() => {
    const L = lop(); const a = emThiXong(L); const b = em(L);
    /* Như một GET thật (`chayTrongRequest`: nhớ trong request, nạp trước phạm vi) — cùng cách đo `tocDo.run.ts`. */
    const do_ = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); chayTrongRequest('GET', fn); return soCauSql() - s0; };
    const ltm = do_(() => bt.xemTruocLoTrinhMoi(QL, a.cy, { route: 'RF' }));
    bt.chonBuocTiep(QL, a.cy, { chon: 'tam_dung' });
    const qlLtm = do_(() => thv.thongTinQuayLai(QL, a.sid));
    students.setStudentStatus(QL, b.sid, 'inactive', t.addDays(TODAY, -7));
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(L);
    const qlLop = do_(() => thv.thongTinQuayLai(QL, b.sid));
    const td = do_(() => thv.xemTruocTrangThai(QL, a.sid, true));
    console.log(`      (đo: xem trước Lộ trình mới ${ltm} · Quay lại học → Lộ trình mới ${qlLtm} · → chọn lớp ${qlLop} · xem trước Tạm dừng ${td} câu)`);
    assert(ltm <= 20 && qlLtm <= 20 && qlLop <= 26 && td <= 12, `vượt trần: ${ltm} / ${qlLtm} / ${qlLop} / ${td}`);
  }));

  // ------------------------------------------------------------------ Rà sâu PTA Plan #582
  const fs = await import('node:fs');
  check('SV-10 · (rà 1) Hoàn tác Tạm dừng MỘT em: TVV (student.edit_more) hoàn tác được qua /hoan-tac-tam-dung; hàng loạt giữ cycle.edit (TVV 403); web một em gọi đường riêng', () => thu(() => {
    const L = lop(); const { sid } = em(L); const b = em(L);
    const TVV = nguoi('consultant', ['MB']);
    students.setStudentStatus(TVV, sid, 'inactive', TODAY);
    students.hoanTacTamDung(TVV, sid);
    assert(hs(sid).status === 'active' && hs(sid).archived_at === null, 'TVV hoàn tác một em');
    students.setStudentStatus(QL, b.sid, 'inactive', TODAY);
    assert(loi(() => hangLoat.chay(TVV, { viec: 'hoan-tac-tam-dung', studentIds: [b.sid] }))?.status === 403 && hs(b.sid).status === 'inactive', 'hàng loạt: TVV 403');
    const web = fs.readFileSync('web/src/modules/students/HopTamDungKetThuc.tsx', 'utf8');
    assert(/mot && !ketThuc[\s\S]{0,200}\/hoan-tac-tam-dung`/.test(web), 'web một em Tạm dừng → POST /students/:id/hoan-tac-tam-dung');
  }));

  check('SV-11 · (rà 2) Hoàn tác Kết thúc học của em đang Tạm dừng → về Tạm dừng, giữ ngày Lưu trữ cũ (không NULL); em đang học → hết Lưu trữ', () => thu(() => {
    const L = lop(); const { sid } = em(L);
    const ngayDung = t.addDays(TODAY, -9);
    students.setStudentStatus(QL, sid, 'inactive', ngayDung);
    students.setStudentStatus(QL, sid, 'finished', TODAY, 'Thôi hẳn');
    students.hoanTacKetThuc(QL, sid);
    assert(hs(sid).status === 'inactive' && hs(sid).archived_at === ngayDung, `về Tạm dừng, Lưu trữ ${ngayDung}: ${JSON.stringify(hs(sid))}`);
    const b = em(lop());
    conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(b.cy);
    students.setStudentStatus(QL, b.sid, 'finished', TODAY, 'Thôi');
    students.hoanTacKetThuc(QL, b.sid);
    assert(hs(b.sid).status === 'active' && hs(b.sid).archived_at === null, 'đang học → ra khỏi Lưu trữ');
  }));

  check('SV-12 · (rà 3) em Tạm dừng (Lưu trữ) có KQ thi thật vẫn có việc "Chọn bước tiếp"; migrate không làm mất việc; em Kết thúc học đã lưu trữ thì không', () => thu(() => {
    const L = lop(); const a = emThiXong(L); const b = emThiXong(L); const c = emThiXong(L);
    students.setStudentStatus(QL, a.sid, 'inactive', TODAY);
    xoaNho();
    assert(hs(a.sid).archived_at && bt.choBuocTiep(a.sid).length === 1, 'tạm dừng (Lưu trữ) → còn việc');
    /* em tạm dừng TRƯỚC P7 (chưa lưu trữ) → migrate lưu trữ → việc còn */
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = NULL WHERE id = ?`).run(b.sid);
    xoaNho();
    assert(bt.choBuocTiep(b.sid).length === 1, 'trước migrate có việc');
    migratePrSvLoTrinh(conn, []);
    xoaNho();
    assert(hs(b.sid).archived_at && bt.choBuocTiep(b.sid).length === 1, 'sau migrate vẫn có việc');
    conn.prepare(`UPDATE students SET status = 'finished', archived_at = ? WHERE id = ?`).run(TODAY, c.sid);
    xoaNho();
    assert(bt.choBuocTiep(c.sid).length === 0, 'kết thúc + lưu trữ → không việc');
  }));

  check('SV-13 · (rà 4) hướng tiếp theo lộ trình đã chọn: LT2 Giữ lớp (lớp LT) → "Lên LT2" ở Tổng kết', () => thu(() => {
    const L = lop(); const a = emThiXong(L);
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi', route: 'LT2' });
    const h = get(`SELECT huong_tiep FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1`, a.cy)?.huong_tiep;
    assert(h === 'len_lt2', `hướng: ${h}`);
  }));

  check('SV-14 · (rà 5) Lộ trình mới khi em Tạm dừng → Hoàn tác trả Tạm dừng đúng ngày cũ (không hôm nay)', () => thu(() => {
    const L = lop(); const a = emThiXong(L);
    const ngayDung = t.addDays(TODAY, -5);
    bt.chonBuocTiep(QL, a.cy, { chon: 'tam_dung', date: ngayDung });
    assert(hs(a.sid).archived_at === ngayDung, `tạm dừng ${ngayDung}: ${hs(a.sid).archived_at}`);
    bt.chonBuocTiep(QL, a.cy, { chon: 'lo_trinh_moi' });
    assert(hs(a.sid).status === 'active' && !hs(a.sid).archived_at, 'Lộ trình mới: đang học');
    bt.boChonBuocTiep(QL, a.cy);
    assert(hs(a.sid).status === 'inactive' && hs(a.sid).archived_at === ngayDung, `Hoàn tác: ${JSON.stringify({ s: hs(a.sid).status, a: hs(a.sid).archived_at })}`);
  }));

  check('SV-15 · (rà 6, 7, 8) câu báo theo trạng thái thật (em FT còn lộ trình chạy → chưa Lưu trữ); xem trước Lộ trình mới: lớp ngoài phạm vi 403, tuần sai 400; xem trước Tạm dừng chỉ đếm Case của em được tính', () => thu(() => {
    const L = lop(); const a = em(L);
    const r = thv.doiTrangThai(QL, a.sid, { status: 'finished', date: TODAY, reason: 'Thôi' });
    assert(!r.archived_at && /chờ KQ thi thật/.test(r.thongBao), `TK-L: ${r.thongBao}`);
    const b = em(L);
    assert(thv.doiTrangThai(QL, b.sid, { status: 'inactive', date: TODAY }).thongBao === 'Đã vào Lưu trữ · Tạm dừng', 'tạm dừng');
    const x = emThiXong(lop());
    const cnKhac = get(`SELECT id, code FROM branches WHERE code != 'MB' ORDER BY id LIMIT 1`);
    const start = t.addDays(T2, -70);
    const lopHn = intake.createClass(P.admin, { code: `${cnKhac.code} P7-${++seq}`, branchId: cnKhac.id, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id;
    assert(loi(() => bt.xemTruocLoTrinhMoi(QL, x.cy, { lopMoiId: lopHn }))?.status === 403, 'lớp chi nhánh khác → 403');
    assert(loi(() => bt.xemTruocLoTrinhMoi(QL, x.cy, { batDau: 'abc' }))?.status === 400, 'tuần sai → 400');
    /* Case của em đã tạm dừng không tính vào "n Case dừng hạn" khi tạm dừng cả lô */
    const c = emThiXong(lop());
    students.setStudentStatus(QL, c.sid, 'inactive', TODAY);
    const d2 = emThiXong(lop());
    const tt = thv.tomTatTrangThai([c.sid, d2.sid], false);
    assert(tt.soCase === 1 && tt.dong.includes('1 Case dừng hạn'), JSON.stringify(tt));
  }));
}
