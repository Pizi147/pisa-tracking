/** PHÉP KIỂM PR-TK — Tổng kết lộ trình: luật thuần (TK-1), bản chụp (TK-2…TK-4), thi thật (TK-K, TK-L), đường đọc (TK-7). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTkTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-TK · Tổng kết lộ trình');

  // ------------------------------------------------------------------ TK-1 · luật thuần
  check('TK-1 · nhãn lý do đóng đủ 8 khoá, chữ trùng END_KIND_LABEL', () => {
    assert(d.LY_DO_DONG.length === 8 && d.LY_DO_DONG.every((k: string) => typeof d.LY_DO_DONG_NHAN[k] === 'string'), 'đủ 8 khoá');
    for (const [lyDo, endKind] of [['len_lop', 'len_lop'], ['hoc_lai', 'hoc_lai'], ['sang_ft', 'sang_ft'], ['chuyen_lop', 'chuyen_lop'], ['ket_thuc', 'ket_thuc']]) {
      assert(d.LY_DO_DONG_NHAN[lyDo] === d.END_KIND_LABEL[endKind], `${lyDo}: ${d.LY_DO_DONG_NHAN[lyDo]} ≠ ${d.END_KIND_LABEL[endKind]}`);
    }
    assert(d.HUONG_TIEP_TK.every((k: string) => typeof d.HUONG_TIEP_TK_NHAN[k] === 'string'), 'nhãn hướng tiếp đủ');
  });
  check('TK-1 · huongTiep: mọi nhánh', () => {
    assert(d.huongTiep('lo_trinh_moi', 'LT2') === 'len_lt2', 'LT1 → LT2');
    assert(d.huongTiep('lo_trinh_moi', 'LT1') === 'lo_trinh_moi' && d.huongTiep('lo_trinh_moi', null) === 'lo_trinh_moi', 'RF → LT1 / thường');
    assert(d.huongTiep('sang_ft', 'LT1') === 'len_ft' && d.huongTiep('ket_thuc', null) === 'ket_thuc', 'sang_ft / ket_thuc');
    assert(d.huongTiep('hoc_lai', null) === 'hoc_lai' && d.huongTiep('len_lop', null) === 'len_lop' && d.huongTiep('chuyen_lop', null) === 'chuyen_lop', 'giữ nguyên');
    assert(d.huongTiep('sua_tay', null) === 'khong_ro' && d.huongTiep('khong_ro', null) === 'khong_ro', 'không rõ');
  });
  check('TK-1 · ketQuaThiThat: OVR máy tính, so Target; thiếu / không thi / sai điểm', () => {
    const o = { l: 7, r: 6.5, w: 6, s: 6.5, khongThi: false };
    const a = d.ketQuaThiThat(o, 6.5);
    assert(a.ovr === 6.5 && a.ketLuan === 'reached' && a.nhan === 'Đạt Target', JSON.stringify(a));
    const b = d.ketQuaThiThat(o, 7);
    assert(b.ketLuan === 'not_reached' && b.nhan === 'Chưa đạt Target', JSON.stringify(b));
    const c = d.ketQuaThiThat({ ...o, s: null }, 6.5);
    assert(c.ketLuan === 'unknown' && c.nhan === 'Chờ đủ 4 kỹ năng' && c.ovr === null, JSON.stringify(c));
    assert(d.ketQuaThiThat({ l: null, r: null, w: null, s: null, khongThi: false }, 6.5).nhan === 'Chờ kết quả thi thật', 'chưa nhập');
    assert(d.ketQuaThiThat({ ...o, khongThi: true }, 6.5).nhan === 'Không thi', 'không thi bỏ qua điểm');
    assert(d.ketQuaThiThat(o, null).nhan === 'Không có Target' && d.ketQuaThiThat(o, null).ovr === 6.5, 'không cam kết');
    for (const x of [9.5, -1, 6.3]) {
      let loi = false; try { d.ketQuaThiThat({ ...o, l: x }, 6.5); } catch { loi = true; }
      assert(loi, `điểm ${x} phải bị từ chối`);
    }
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6, s: 6.5, khongThi: false }, 6).ovr === 6, '6.125 → 6.0');
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6.5, s: 6.5, khongThi: false }, 6).ovr === 6.5, '6.25 → 6.5 (lên)');
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6.5, s: 6.5, khongThi: false }, 6).ovr === 6.5, '6.25 → 6.5 (lên)');
  });
  check('TK-1 · canChoThiThat: chỉ FT chưa đủ 4 kỹ năng và không "Không thi"', () => {
    const x = { laFt: true, l: null, r: null, w: null, s: null, khongThi: false };
    assert(d.canChoThiThat(x) && d.canChoThiThat({ ...x, l: 6, r: 6, w: 6 }), 'chờ');
    assert(!d.canChoThiThat({ ...x, l: 6, r: 6, w: 6, s: 6 }) && !d.canChoThiThat({ ...x, khongThi: true }) && !d.canChoThiThat({ ...x, laFt: false }), 'hết chờ');
  });
  check('TK-1 · mocNhacThiThat: tháng / tuần / ngày thi / ngày đóng, hạn +4 tuần', () => {
    const m = d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: null, ngayThi: null, ngayDong: null });
    assert(m.tu === '2026-10-05' && m.han === '2026-11-02', JSON.stringify(m));
    assert(d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: '2026-09-21', ngayThi: null, ngayDong: null }).tu === '2026-09-28', 'tuần thi thắng tháng');
    assert(d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: '2026-09-21', ngayThi: '2026-09-10', ngayDong: null }).tu === '2026-09-14', 'ngày thi thắng');
    assert(d.mocNhacThiThat({ thangThi: null, tuanThi: null, ngayThi: null, ngayDong: '2026-09-30' }).tu === '2026-10-05', 'theo ngày đóng');
    assert(d.mocNhacThiThat({ thangThi: null, tuanThi: null, ngayThi: null, ngayDong: null }) === null, 'không có gì → null');
  });
  check('TK-1 · luotDaiDien + khoangTuan', () => {
    assert(d.luotDaiDien([]) === null, 'rỗng');
    const ls = [{ attemptNo: 1, huy: false, overall: 5.5 }, { attemptNo: 2, huy: false, overall: 6 }, { attemptNo: 3, huy: true, overall: null }];
    assert(d.luotDaiDien(ls).attemptNo === 2, 'MT cuối có OVR, bỏ lượt huỷ');
    assert(d.luotDaiDien([ls[2]]).attemptNo === 3, 'không có OVR → MT cuối bất kỳ');
    assert(d.khoangTuan('2026-10-05', null, '2026-10-06') === 'W2 OCT – nay', d.khoangTuan('2026-10-05', null, '2026-10-06'));
    assert(d.khoangTuan(null, null, '2026-10-06') === '—' && /^W\d [A-Z]{3} – W\d [A-Z]{3}$/.test(d.khoangTuan('2026-06-08', '2026-07-20', '2026-10-06')), 'khoảng');
  });

  // ------------------------------------------------------------------ dựng sẵn
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /** Chạy `fn` trong giao dịch rồi ROLLBACK — phép kiểm không để lại dữ liệu cho phép kiểm sau (bất biến ở cuối). */
  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const { ghiBanChup } = await import('../loTrinh/banChup.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const regular: any = await import('../normal/regular.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const NGAY = t.TODAY;
  const banChup = (cycleId: number) => all('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan', cycleId);
  const luotCua = (bcId: number) => all('SELECT * FROM ban_chup_luot WHERE ban_chup_id = ? ORDER BY attempt_no, id', bcId);
  /** Lộ trình FT ĐANG CHẠY có ≥ `n` lượt, trong đó ≥ 1 lượt có điểm. */
  const ftNhieuLuot = (n: number) => get(
    `SELECT a.cycle_id AS id, c.student_id FROM assessment_attempts a JOIN learning_cycles c ON c.id = a.cycle_id
      WHERE c.route IS NOT NULL AND c.status = 'active' AND a.status != 'cancelled' AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
      GROUP BY a.cycle_id HAVING COUNT(*) >= ? ORDER BY COUNT(*) DESC LIMIT 1`, n);

  // ------------------------------------------------------------------ TK-2 · bản chụp
  await checkAsync('TK-2 · FT nhiều lượt (có lượt huỷ, huỷ phần): đủ lượt × kỹ năng; SOS / kỳ vọng / OVR bằng đúng hồ sơ cùng lúc', () => thu(() => {
    const fx = ftNhieuLuot(3) ?? ftNhieuLuot(2);
    assert(fx, 'tiền đề: bộ demo có lộ trình FT ≥ 2 lượt có điểm');
    const luot = all('SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? ORDER BY attempt_no, id', fx.id);
    const huyCa = luot.at(-1).id; const huyPhan = luot[0].id;
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = 'Thử' WHERE id = ?`).run(huyCa);
    conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill = 'speaking'`).run(huyPhan);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'sua_tay', ngay: NGAY });
    const rows = luotCua(bcId);
    assert(rows.length === luot.length * 6, `${luot.length} lượt × (4 kỹ năng + W1 + W2) = ${luot.length * 6}, có ${rows.length}`);
    assert(rows.filter((r) => r.attempt_id === huyCa).every((r) => r.trang_thai === 'cancelled' && r.diem === null && r.ket_qua === 'huy' && r.huy_ly_do === 'Thử'), 'lượt huỷ: không điểm');
    assert(rows.filter((r) => r.attempt_id === huyPhan && r.ky_nang === 'speaking').every((r) => r.bat_buoc === 0 && r.bo_qua === 1), 'huỷ phần S: bỏ qua');
    const hs = (studentProfile(P.admin, fx.student_id, fx.id) as any).attempts;
    for (const a of hs.filter((x: any) => x.id !== huyCa)) {
      const r = rows.find((x) => x.attempt_id === a.id && x.ky_nang === 'listening');
      assert(r && r.ky_vong === a.expectation && r.overall === a.overall && r.sos === a.sosLevel, `MT${a.attemptNo}: ${JSON.stringify([r?.ky_vong, r?.overall, r?.sos])} ≠ ${JSON.stringify([a.expectation, a.overall, a.sosLevel])}`);
      for (const k of ['listening', 'reading', 'writing', 'speaking']) {
        assert(rows.find((x) => x.attempt_id === a.id && x.ky_nang === k).diem === (a.bands?.[k] ?? null), `MT${a.attemptNo} ${k}: điểm lệch hồ sơ`);
      }
    }
    assert(get('SELECT so_luot FROM ban_chup_lo_trinh WHERE id = ?', bcId).so_luot === luot.length, 'so_luot');
  }));
  await checkAsync('TK-2 · lớp thường (FOU…): môn theo chương trình; ty_le_tong / dải khớp cuoiKhoaTheoHocVien', () => thu(() => {
    const fx = get(`SELECT c.id, c.student_id, a.class_id, a.id AS aid FROM learning_cycles c JOIN assessment_attempts a ON a.cycle_id = c.id AND a.kind = 'final' AND a.status != 'cancelled'
                      JOIN enrollments e ON e.student_id = c.student_id AND e.class_id = a.class_id AND e.status = 'active'
                     WHERE c.route IS NULL AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.raw_score IS NOT NULL) LIMIT 1`);
    assert(fx, 'tiền đề: bộ demo có em lớp thường đã có điểm Cuối khoá');
    const prog = regular.programmeOfClass(fx.class_id);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'len_lop', ngay: NGAY });
    const bc = get('SELECT * FROM ban_chup_lo_trinh WHERE id = ?', bcId);
    assert(JSON.parse(bc.mon_json).join() === prog.skills.join() && bc.scoring_mode === 'ratio' && bc.programme_code === prog.code, `môn ${bc.mon_json}`);
    const ck = cuoiKhoa.cuoiKhoaTheoHocVien(fx.class_id, [fx.student_id]).get(fx.student_id);
    assert(ck.tyLe !== null && Math.abs(bc.ty_le_cuoi_khoa - ck.tyLe) < 1e-9, `${bc.ty_le_cuoi_khoa} ≠ ${ck.tyLe}`);
    assert(bc.dai_cuoi_khoa === d.daiCuoiKhoa(ck.tyLe) && bc.huong_tiep === 'len_lop' && bc.ket_luan === null, `${bc.dai_cuoi_khoa} ${bc.huong_tiep}`);
    const moLuot = luotCua(bcId).filter((r) => r.attempt_id === fx.aid);
    assert(moLuot.map((r) => r.ky_nang).join() === prog.skills.join() && moLuot.every((r) => r.ty_le_tong !== null), 'dòng kỹ năng của bài Cuối khoá');
  }));
  await checkAsync('TK-2 · ĐÓNG BĂNG: đổi route / Target / đầu vào / môn chương trình / target_at_attempt sau khi ghi → bản chụp không đổi', () => thu(() => {
    const fx = ftNhieuLuot(1);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'ket_thuc', ngay: NGAY });
    const anh = () => JSON.stringify([get('SELECT * FROM ban_chup_lo_trinh WHERE id = ?', bcId), luotCua(bcId)]);
    const truoc = anh();
    conn.prepare(`UPDATE learning_cycles SET route = CASE route WHEN 'RF' THEN 'LT1' ELSE 'RF' END, target_score = 9, baseline_score = 1, exam_month = '2031-01' WHERE id = ?`).run(fx.id);
    conn.prepare('UPDATE assessment_attempts SET target_at_attempt = 9 WHERE cycle_id = ?').run(fx.id);
    conn.prepare('DELETE FROM programme_skills WHERE rowid IN (SELECT rowid FROM programme_skills LIMIT 1)').run();
    assert(anh() === truoc, 'bản chụp lệch sau khi đổi hồ sơ');
  }));
  await checkAsync('TK-2 · lộ trình không có lượt: so_luot = 0, không dòng ban_chup_luot; gọi hai lần → lan 1 và 2', () => thu(() => {
    const sid = get('SELECT student_id FROM learning_cycles LIMIT 1').student_id;
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, started_at, status, created_at) VALUES (?, 99, ?, 'active', ?)`).run(sid, NGAY, new Date().toISOString()).lastInsertRowid);
    const [a] = ghiBanChup(conn, [cy], { lyDo: 'khong_ro', ngay: NGAY });
    const [b] = ghiBanChup(conn, [cy], { lyDo: 'sua_tay', ngay: NGAY });
    assert(get('SELECT so_luot, lan FROM ban_chup_lo_trinh WHERE id = ?', a).so_luot === 0 && luotCua(a).length === 0, 'rỗng');
    assert(banChup(cy).map((r) => r.lan).join() === '1,2' && b !== a, 'lan 1, 2');
  }));

  // ------------------------------------------------------------------ TK-3 · mọi đường đóng ghi bản chụp (đi qua dịch vụ thật)
  const cyclesSvc: any = await import('../fasttrack/cycles.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const transitionSvc: any = await import('../classes/transition.ts');
  const intake: any = await import('../classes/intake.ts');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let seq = 0;
  const taoLop = (kind: string, ft: boolean): number => {
    seq += 1;
    return intake.createClass(P.admin, { code: `MB-TK-${seq}`, branchId: MB, kind, isFastTrack: ft, startDate: NGAY }).id as number;
  };
  /** Em có ghi danh `active` ở `clsId` + một lộ trình đang chạy (FT: route LT1 + Target). */
  const taoHV = (clsId: number, ma: string | null, ft: boolean, target: number | null = null): { sid: number; cy: number } => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-TK-${seq}`, `Hoc vien TK ${seq}`, `hoc vien tk ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, clsId, NGAY, now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`)
      .run(sid, ft ? 'LT1' : null, ma, target, NGAY, now).lastInsertRowid);
    return { sid, cy };
  };
  const dongCuaCycle = (cy: number) => banChup(cy).at(-1);
  const trangThai = (cy: number) => get('SELECT status FROM learning_cycles WHERE id = ?', cy).status as string;

  await checkAsync('TK-3 · Mở lộ trình mới (POST /students/:id/cycles): bản chụp lộ trình cũ, lý do lo_trinh_moi, hướng Lên LT2', () => thu(() => {
    const fx = ftNhieuLuot(1);
    cyclesSvc.createCycle(P.admin, { studentId: fx.student_id, route: 'LT2', targetScore: 7 });
    const b = dongCuaCycle(fx.id);
    assert(trangThai(fx.id) === 'completed' && b && b.ly_do === 'lo_trinh_moi' && b.huong_tiep === 'len_lt2' && b.nguon === 'luc_dong', JSON.stringify(b));
  }));
  await checkAsync('TK-3 · Chuyển lớp luật đóng-mở → chuyen_lop (lớp cũ); luật giữ lộ trình (FT → FT) KHÔNG có bản chụp', () => thu(() => {
    const ft = taoLop('FT', true); const thuong = taoLop('FOU', false); const ft2 = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    studentsSvc.transferStudent(P.admin, a.sid, thuong, NGAY, 'Xếp lại trình độ', { noNote: true });
    const b = dongCuaCycle(a.cy);
    assert(trangThai(a.cy) === 'completed' && b.ly_do === 'chuyen_lop' && b.class_id === ft, JSON.stringify(b));
    const c = taoHV(ft, 'FT', true, 6.5);
    studentsSvc.transferStudent(P.admin, c.sid, ft2, NGAY, 'Đổi lịch học', { noNote: true });
    assert(trangThai(c.cy) === 'active' && banChup(c.cy).length === 0, 'FT → FT giữ lộ trình: không đóng, không bản chụp');
  }));
  await checkAsync('TK-3 · Chuyển tiếp cả lớp (lên lớp / học lại / sang FT, ≥ 3 em một lô): mỗi em đúng một bản chụp, đúng lý do, lớp cũ', () => thu(() => {
    const cls = taoLop('FOU', false); const be = taoLop('BE', false); const fou = taoLop('FOU', false); const ft = taoLop('FT', true);
    const em = [taoHV(cls, 'FOU', false), taoHV(cls, 'FOU', false), taoHV(cls, 'FOU', false), taoHV(cls, 'FOU', false)];
    const r = transitionSvc.applyTransition(P.admin, { fromClassId: cls, effectiveDate: NGAY, dongs: [
      { studentId: em[0].sid, huong: 'len_lop', toClassId: be }, { studentId: em[1].sid, huong: 'len_lop', toClassId: be },
      { studentId: em[2].sid, huong: 'hoc_lai', toClassId: fou }, { studentId: em[3].sid, huong: 'fast_track', toClassId: ft, mucTieu: 6.5 }] }) as any;
    assert(r.done.length === 4 && r.failed.length === 0, JSON.stringify(r));
    const lyDo = em.map((e) => { const l = banChup(e.cy); assert(l.length === 1 && l[0].class_id === cls, `em ${e.sid}: ${l.length} bản chụp`); return l[0].ly_do; });
    assert(lyDo.join() === 'len_lop,len_lop,hoc_lai,sang_ft', lyDo.join());
  }));
  await checkAsync('TK-3 · Kết thúc học (POST /students/:id/status) và dừng học ở Chuyển tiếp → ket_thuc', () => thu(() => {
    const cls = taoLop('FOU', false);
    const a = taoHV(cls, 'FOU', false);
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ học');
    assert(trangThai(a.cy) === 'abandoned' && dongCuaCycle(a.cy).ly_do === 'ket_thuc' && dongCuaCycle(a.cy).huong_tiep === 'ket_thuc', 'một em');
    const cls2 = taoLop('FOU', false); const x = taoHV(cls2, 'FOU', false);
    transitionSvc.applyTransition(P.admin, { fromClassId: cls2, effectiveDate: NGAY, dongs: [{ studentId: x.sid, huong: 'dung_hoc', lyDo: 'Gia đình chuyển nhà' }] });
    assert(banChup(x.cy).length === 1 && banChup(x.cy)[0].ly_do === 'ket_thuc', 'dừng học');
  }));
  await checkAsync('TK-3 · PATCH /cycles/:id {status:"completed"} → sua_tay; Học lại mở lại rồi Hoàn tác → bản chụp MỚI (lan 2), bản cũ giữ nguyên', () => thu(() => {
    const cls = taoLop('FOU', false);
    const a = taoHV(cls, 'FOU', false);
    cyclesSvc.updateCycle(P.admin, a.cy, { status: 'completed' });
    assert(banChup(a.cy).map((r) => r.ly_do).join() === 'sua_tay', 'sua_tay');
    const b = taoHV(cls, 'FOU', false);
    studentsSvc.setStudentStatus(P.admin, b.sid, 'finished', NGAY, 'Nghỉ');
    const cu = JSON.stringify(banChup(b.cy)[0]);
    studentsSvc.hocLai(P.admin, b.sid, { date: NGAY, moLaiLop: true });
    assert(trangThai(b.cy) === 'active' && JSON.stringify(banChup(b.cy)[0]) === cu, 'Học lại mở lại, bản cũ giữ nguyên');
    studentsSvc.hoanTacHocLai(P.admin, b.sid);
    assert(trangThai(b.cy) === 'abandoned' && banChup(b.cy).map((r) => r.lan).join() === '1,2', `lan ${banChup(b.cy).map((r) => r.lan)}`);
    assert(JSON.stringify(banChup(b.cy)[0]) === cu, 'bản lan 1 vẫn nguyên');
  }));
  await checkAsync('TK-3 · cùng giao dịch: ghi bản chụp lỗi → lộ trình cũ vẫn active (không có lộ trình đóng mà thiếu bản chụp)', () => thu(() => {
    const fx = ftNhieuLuot(1);
    conn.exec('DROP TABLE ban_chup_luot');   // trong giao dịch thử → ghiBanChup ném lỗi ở dòng lượt; ROLLBACK cuối phép kiểm trả bảng về
    let loi = false;
    try { cyclesSvc.createCycle(P.admin, { studentId: fx.student_id, route: 'LT2', targetScore: 7 }); } catch { loi = true; }
    assert(loi, 'createCycle phải lỗi');
    assert(trangThai(fx.id) === 'active', 'lộ trình cũ phải còn active');
  }));
  // ------------------------------------------------------------------ TK-4 · điền ngược (migrate)
  const { migratePrTk } = await import('../migrate/prTk.ts');
  await checkAsync('TK-4 · migratePrTk: lộ trình đóng chưa có bản chụp → nguon dien_nguoc đúng lý do; lần hai không đổi gì; bản đã có không bị ghi thêm', () => thu(() => {
    migratePrTk(conn, []);   // dọn trước (trong giao dịch thử) lộ trình đóng thẳng bằng SQL do phép kiểm khác để lại — chỉ đếm cái của phép kiểm này
    const sid = get('SELECT student_id FROM learning_cycles LIMIT 1').student_id as number;
    const now = new Date().toISOString();
    const them = (seq: number, status: string, batDau: string, ketThuc: string | null) => Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, started_at, ended_at, status, created_at) VALUES (?,?,?,?,?,?)`).run(sid, seq, batDau, ketThuc, status, now).lastInsertRowid);
    const a = them(91, 'abandoned', '2026-01-05', '2026-02-02');
    const b = them(92, 'completed', '2026-02-02', '2026-03-02');
    const c = them(93, 'completed', '2026-03-02', '2026-04-08');
    them(94, 'active', '2026-03-02', null);                       // lộ trình sau bắt đầu cùng ngày b đóng?  KHÔNG — c đóng 04/06; ngày 03/02 là ngày b đóng → b = lo_trinh_moi
    const daCo = them(95, 'completed', '2026-04-06', '2026-05-04');
    ghiBanChup(conn, [daCo], { lyDo: 'sua_tay', ngay: '2026-05-04' });
    const dem = () => (get('SELECT COUNT(*) n FROM ban_chup_lo_trinh').n as number) + (get('SELECT COUNT(*) n FROM ban_chup_luot').n as number) * 1000;
    const lan1: string[] = [];
    migratePrTk(conn, lan1);
    assert(lan1.length === 1 && /điền ngược 3 bản chụp/.test(lan1[0]), lan1.join());
    const lyDo = (id: number) => banChup(id).map((r) => `${r.ly_do}/${r.nguon}`).join();
    assert(lyDo(a) === 'ket_thuc/dien_nguoc' && lyDo(b) === 'lo_trinh_moi/dien_nguoc' && lyDo(c) === 'khong_ro/dien_nguoc', `${lyDo(a)} | ${lyDo(b)} | ${lyDo(c)}`);
    assert(lyDo(daCo) === 'sua_tay/luc_dong', 'bản đã có giữ nguyên');
    const truoc = dem();
    const lan2: string[] = [];
    migratePrTk(conn, lan2);
    assert(lan2.length === 0 && dem() === truoc, `lần hai: ${lan2.join()} ${dem()} ≠ ${truoc}`);
  }));

  // ------------------------------------------------------------------ TK-5 · điểm nhập / sửa sau khi đóng cập nhật bản chụp
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  await checkAsync('TK-5 · em Kết thúc học, MT thiếu S → nhập bù S: bản chụp có S, OVR, SOS mới; kỳ vọng giữ; đổi route rồi sửa tiếp vẫn giữ', () => thu(() => {
    const fx = get(`SELECT c.id, c.student_id FROM learning_cycles c WHERE c.route IS NOT NULL AND c.status = 'active' AND EXISTS (SELECT 1 FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.cycle_id = c.id AND a.status != 'cancelled' AND rp.week_start <= ? AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)) ORDER BY c.id LIMIT 1`, NGAY);
    assert(fx, 'tiền đề: lộ trình FT đang chạy có lượt đã tới tuần thi và có điểm');
    const luot = get(`SELECT a.id FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.cycle_id = ? AND a.status != 'cancelled' AND rp.week_start <= ? AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL) ORDER BY a.attempt_no DESC LIMIT 1`, fx.id, NGAY);
    attemptsSvc.saveScore(P.admin, luot.id, 'speaking', { criteria: [null, null, null, null] });   // thiếu S
    studentsSvc.setStudentStatus(P.admin, fx.student_id, 'finished', NGAY, 'Nghỉ học');
    const dongS = () => get(`SELECT * FROM ban_chup_luot WHERE ban_chup_id = (SELECT MAX(id) FROM ban_chup_lo_trinh WHERE cycle_id = ?) AND attempt_id = ? AND ky_nang = 'speaking'`, fx.id, luot.id);
    const truoc = dongS();
    assert(truoc.diem === null && truoc.overall === null, 'tiền đề: S trống lúc đóng');
    attemptsSvc.saveScore(P.admin, luot.id, 'speaking', { criteria: [7, 7, 7, 7] });
    const sau = dongS();
    assert(sau.diem === 7 && sau.nhap_luc !== null, `S ${sau.diem}`);
    const hs = (studentProfile(P.admin, fx.student_id, fx.id) as any).attempts.find((x: any) => x.id === luot.id);
    assert(sau.overall === hs.overall && sau.sos === hs.sosLevel && sau.ky_vong === truoc.ky_vong, `OVR ${sau.overall}/${hs.overall} SOS ${sau.sos}/${hs.sosLevel}`);
    assert(get('SELECT lam_moi_luc FROM ban_chup_lo_trinh WHERE cycle_id = ?', fx.id).lam_moi_luc !== null, 'lam_moi_luc');
    conn.prepare(`UPDATE learning_cycles SET route = CASE route WHEN 'RF' THEN 'LT1' ELSE 'RF' END WHERE id = ?`).run(fx.id);
    attemptsSvc.saveScore(P.admin, luot.id, 'speaking', { criteria: [6, 6, 6, 6] });
    assert(dongS().diem === 6 && dongS().ky_vong === truoc.ky_vong, 'đổi route về sau: kỳ vọng vẫn giữ');
  }));

  // ------------------------------------------------------------------ TK-K · kết quả thi thật (GVCN nhập, máy so Target)
  const thiThatSvc: any = await import('../loTrinh/thiThat.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const myWork: any = await import('../worklist/mywork.ts');
  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };
  /** Lớp FT có GVCN `userId` (principal nạp lại sau khi gán). */
  const ganGvcn = (clsId: number, userId: number) => {
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, NULL, 1, '2026-01-01', 'active', ?)`)
      .run(userId, clsId, new Date().toISOString());
    return loadPrincipal(userId);
  };
  const em = (cy: number) => get('SELECT * FROM learning_cycles WHERE id = ?', cy);
  const hoSo = (sid: number) => get('SELECT status, archived_at FROM students WHERE id = ?', sid);
  const NHAP4 = { ngayThi: NGAY, l: 7, r: 6.5, w: 6, s: 6.5 };

  await checkAsync('TK-K · GVCN lớp FT nhập 4 kỹ năng → outcome reached, OVR 6.5; thiếu S → unknown; điểm / ngày sai → 400; GVBM, GVCN lớp khác → 403; lớp thường → 400', () => thu(() => {
    const ft = taoLop('FT', true); const ft2 = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    assert(em(a.cy).outcome === 'reached' && em(a.cy).outcome_score === 6.5 && em(a.cy).thi_that_nhap_boi === gvcn.userId, JSON.stringify(em(a.cy)));
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { s: null });
    assert(em(a.cy).outcome === 'unknown' && em(a.cy).outcome_score === null, 'thiếu S');
    for (const [x, ten] of [[{ l: 9.5 }, '9.5'], [{ l: 6.3 }, '6.3'], [{ ngayThi: '2099-01-01' }, 'ngày mai']] as const) {
      assert(maLoi(() => thiThatSvc.datKetQuaThiThat(gvcn, a.cy, x)) === 400, `${ten} phải 400`);
    }
    assert(maLoi(() => thiThatSvc.datKetQuaThiThat(P.normalSubjectTeacher, a.cy, NHAP4)) === 403, 'GVBM 403');
    const gvKhac = ganGvcn(ft2, P.normalSubjectTeacher.userId);
    assert(maLoi(() => thiThatSvc.datKetQuaThiThat(gvKhac, a.cy, NHAP4)) === 403, 'GVCN lớp khác 403');
    const th = taoHV(taoLop('FOU', false), 'FOU', false);
    assert(maLoi(() => thiThatSvc.datKetQuaThiThat(P.admin, th.cy, NHAP4)) === 400, 'lộ trình lớp thường 400');
    assert(em(a.cy).outcome === 'unknown', 'lỗi không ghi dở');
  }));
  await checkAsync('TK-K · ĐÃ Kết thúc học: GVCN lớp cuối vẫn nhập được; bản chụp có điểm thi thật, so Target LÚC ĐÓNG (đổi Target sau không làm lệch)', () => thu(() => {
    const ft = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ học');
    conn.prepare('UPDATE learning_cycles SET target_score = 9 WHERE id = ?').run(a.cy);   // Target hiện tại đổi sau khi đóng
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    const b = dongCuaCycle(a.cy);
    assert(b.thi_that_ovr === 6.5 && b.thi_that_l === 7 && b.thi_that_ngay === NGAY && b.target === 6.5 && b.ket_luan === 'reached' && b.lam_moi_luc !== null, JSON.stringify(b));
    assert(em(a.cy).outcome === 'not_reached', 'số sống so Target hiện tại (9) — khác bản chụp');
  }));
  await checkAsync('TK-K · việc nhắc: hiện từ thứ Hai sau tháng thi, hạn +4 tuần; có kết quả / Không thi → mất; GVCN lớp cuối thấy, GVBM không', () => thu(() => {
    const ft = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    const thang = `${new Date(Date.parse(NGAY) - 40 * 86400000).toISOString().slice(0, 7)}`;   // tháng thi đã qua
    conn.prepare('UPDATE learning_cycles SET exam_month = ?, exam_date = NULL, exam_period_id = NULL WHERE id = ?').run(thang, a.cy);
    const viec = (pr: any) => (myWork.myWork(pr, {}) as any).groups.flatMap((g: any) => g.items ?? []).filter((x: any) => x.group === 'thi_that' && x.studentId === a.sid);
    const v = viec(gvcn);
    assert(v.length === 1 && v[0].tieuDe === 'Cập nhật kết quả thi thật' && v[0].mine && v[0].due !== null && v[0].href.includes('viec=thi-that'), JSON.stringify(v));
    assert(viec(P.normalSubjectTeacher).length === 0, 'GVBM không thấy');
    conn.prepare('UPDATE learning_cycles SET exam_month = ? WHERE id = ?').run(new Date(Date.parse(NGAY) + 40 * 86400000).toISOString().slice(0, 7), a.cy);
    assert(viec(gvcn).length === 0, 'tháng thi còn tương lai → chưa hiện');
    conn.prepare('UPDATE learning_cycles SET exam_month = ? WHERE id = ?').run(thang, a.cy);
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    assert(viec(gvcn).length === 0, 'đủ 4 kỹ năng → mất');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { s: null });
    assert(viec(gvcn).length === 1, 'xoá S → hiện lại');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { khongThi: true });
    assert(viec(gvcn).length === 0, 'Không thi → mất');
  }));

  // ------------------------------------------------------------------ TK-L · Kết thúc học chưa lưu trữ khi FT còn "Chờ kết quả thi thật"
  const luuTruSvc: any = await import('../classes/luuTru.ts');
  const trongLuuTru = (sid: number) => (luuTruSvc.danhSachLuuTru(P.admin, {}) as any).hocVien?.some?.((h: any) => h.id === sid) ?? null;
  await checkAsync('TK-L · (1) FT chưa có kết quả → Kết thúc học: lộ trình đóng, có bản chụp, CHƯA lưu trữ; (2) nhập đủ 4 kỹ năng → tự vào Lưu trữ; (4) thiếu S thì chưa', () => thu(() => {
    const ft = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ học');
    assert(hoSo(a.sid).status === 'finished' && hoSo(a.sid).archived_at === null && trangThai(a.cy) === 'abandoned' && banChup(a.cy).length === 1, JSON.stringify(hoSo(a.sid)));
    assert(trongLuuTru(a.sid) === false, 'chưa ở Lưu trữ');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { ...NHAP4, s: null });
    assert(hoSo(a.sid).archived_at === null, 'thiếu S: chưa lưu trữ');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { s: 6.5 });
    assert(hoSo(a.sid).archived_at === NGAY, `đủ 4: ${hoSo(a.sid).archived_at}`);
    assert(trongLuuTru(a.sid) === true && get(`SELECT 1 x FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.archive'`, a.sid), 'có ở Lưu trữ + nhật ký student.archive');
  }));
  await checkAsync('TK-L · (3) "Không thi" → tự lưu trữ; (5) FT đã có kết quả trước → lưu trữ ngay; (6) lớp thường → lưu trữ ngay', () => thu(() => {
    const ft = taoLop('FT', true);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    const a = taoHV(ft, 'FT', true, 6.5);
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, { khongThi: true });
    assert(hoSo(a.sid).archived_at === NGAY, 'Không thi → lưu trữ');
    const b = taoHV(ft, 'FT', true, 6.5);
    thiThatSvc.datKetQuaThiThat(gvcn, b.cy, NHAP4);
    studentsSvc.setStudentStatus(P.admin, b.sid, 'finished', NGAY, 'Nghỉ');
    assert(hoSo(b.sid).archived_at === NGAY, 'đã có kết quả → lưu trữ ngay');
    const c = taoHV(taoLop('FOU', false), 'FOU', false);
    studentsSvc.setStudentStatus(P.admin, c.sid, 'finished', NGAY, 'Nghỉ');
    assert(hoSo(c.sid).archived_at === NGAY, 'lớp thường → lưu trữ ngay');
  }));
  await checkAsync('TK-L · (7) kết thúc học NHIỀU em trộn FT chờ + FT có kết quả + lớp thường: mỗi em đúng luật; (8) Hoàn tác về đúng trạng thái trước', () => thu(() => {
    const ft = taoLop('FT', true); const th = taoLop('FOU', false);
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    const cho = taoHV(ft, 'FT', true, 6.5); const co = taoHV(ft, 'FT', true, 6.5); const thuong = taoHV(th, 'FOU', false);
    thiThatSvc.datKetQuaThiThat(gvcn, co.cy, NHAP4);
    const r = hangLoat.chay(P.admin, { viec: 'ket-thuc', studentIds: [cho.sid, co.sid, thuong.sid], date: NGAY, lyDo: 'Nghỉ học' }) as any;
    assert(r.ok.length === 3, JSON.stringify(r));
    assert(hoSo(cho.sid).archived_at === null && hoSo(co.sid).archived_at === NGAY && hoSo(thuong.sid).archived_at === NGAY, 'mỗi em đúng luật');
    studentsSvc.hoanTacKetThuc(P.admin, cho.sid);
    assert(hoSo(cho.sid).status === 'active' && hoSo(cho.sid).archived_at === null && trangThai(cho.cy) === 'active', 'Hoàn tác (em chưa bị lưu trữ)');
    studentsSvc.hoanTacKetThuc(P.admin, co.sid);
    assert(hoSo(co.sid).status === 'active' && hoSo(co.sid).archived_at === null, 'Hoàn tác (em đã lưu trữ): trả về học');
    const ql = loadPrincipal(P.mbManager.userId);
    void ql;
  }));

  // ------------------------------------------------------------------ TK-7 · đường đọc
  const tongKetSvc: any = await import('../loTrinh/tongKet.ts');
  /** Lượt `no` của em ở `clsId` có điểm: FT = band cả 4 kỹ năng (W1 = W2); lớp thường = điểm đạt / tổng theo `kind`. */
  const themLuot = (hv: { sid: number; cy: number }, clsId: number, no: number, o: { kind?: string; band?: number; status?: string; ty?: [number, number] } = {}) => {
    const now = new Date().toISOString();
    const kind = o.kind ?? 'mock';
    const a = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, target_at_attempt, created_at) VALUES (?,?,?,?,?,?,6.5,?)`)
      .run(hv.cy, hv.sid, no, kind, clsId, o.status ?? 'done', now).lastInsertRowid);
    if (o.status === 'cancelled') return a;
    const skills = kind === 'mock' ? ['listening', 'reading', 'writing1', 'writing2', 'speaking'] : [...regular.programmeOfClass(clsId).skills];
    for (const k of skills) {
      if (kind === 'mock') conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, raw_total, entered_by, entered_at) VALUES (?,?,?,?,?,?,?)').run(a, k, o.band ?? 6, k === 'listening' || k === 'reading' ? 30 : null, k === 'listening' || k === 'reading' ? 40 : null, P.admin.userId, now);
      else conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at) VALUES (?,?,?,?,?,?)').run(a, k, o.ty![0], o.ty![1], P.admin.userId, now);
    }
    return a;
  };

  await checkAsync('TK-7 · cacLoTrinh: lộ trình mới nhất trước; đang chạy "Đang học" + kết quả sống; đã đóng từ bản chụp + hướng; quyền 403 trước truy vấn', () => thu(() => {
    const ft = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    themLuot(a, ft, 1, { band: 6 });
    cyclesSvc.createCycle(P.admin, { studentId: a.sid, route: 'LT2', targetScore: 7 });
    const ds = tongKetSvc.cacLoTrinh(P.admin, a.sid);
    assert(ds.length === 2 && ds[0].dangHoc && ds[0].ten === 'Fast Track · LT2' && /nay$/.test(ds[0].thoiGian), JSON.stringify(ds[0]));
    assert(!ds[1].dangHoc && ds[1].ten === 'Fast Track · LT1' && ds[1].lyDo === 'lo_trinh_moi' && ds[1].huong === 'Lên LT2' && ds[1].ketQua?.chinh === 'Chờ kết quả thi thật', JSON.stringify(ds[1]));
    assert(maLoi(() => tongKetSvc.cacLoTrinh(P.normalSubjectTeacher, a.sid)) === 403, 'GVBM ngoài phạm vi');
    assert(maLoi(() => tongKetSvc.cacLoTrinh(P.cpManager, a.sid)) === 403, 'QL chi nhánh khác');
    assert(tongKetSvc.cacLoTrinh(P.admin, taoHV(taoLop('FOU', false), 'FOU', false).sid).length === 1, 'một lộ trình vẫn có khối');
  }));
  await checkAsync('TK-7 · tongKetLoTrinh: lộ trình đang chạy → 404; đã đóng → Đích / Kết quả / Hướng tiếp + lượt; GVBM 403', () => thu(() => {
    const ft = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5);
    themLuot(a, ft, 1, { band: 6 }); themLuot(a, ft, 2, { status: 'cancelled' });
    assert(maLoi(() => tongKetSvc.tongKetLoTrinh(P.admin, a.cy)) === 404, 'đang chạy → 404');
    assert(maLoi(() => tongKetSvc.tongKetLoTrinh(P.admin, 999999)) === 404, 'sai id → 404');
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ học');
    const r = tongKetSvc.tongKetLoTrinh(P.admin, a.cy);
    assert(r.loai === 'ft' && r.dich.target === 6.5 && r.ketQua.choNhap === true && r.ketQua.coTheNhap === true && r.huongTiep.nhan === 'Kết thúc' && r.lyDo === 'ket_thuc', JSON.stringify(r.ketQua));
    assert(r.luot.length === 2 && r.luot[0].nhan === 'MT1' && r.luot[0].kyNang.map((k: any) => k.nhan).join('') === 'LRWS' && r.luot[1].trangThai === 'cancelled', JSON.stringify(r.luot));
    assert(maLoi(() => tongKetSvc.tongKetLoTrinh(P.normalSubjectTeacher, a.cy)) === 403, 'GVBM 403');
    assert(maLoi(() => tongKetSvc.tongKetLoTrinh(P.cpManager, a.cy)) === 403, 'QL chi nhánh khác 403');
    const gvcn = ganGvcn(ft, P.normalCoreTeacher.userId);
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    const r2 = tongKetSvc.tongKetLoTrinh(P.admin, a.cy);
    assert(r2.ketQua.ovr === 6.5 && r2.ketQua.nhan === 'Đạt Target' && r2.ketQua.choNhap === false, JSON.stringify(r2.ketQua));
  }));
  await checkAsync('TK-7 · tongKetLop FT: lớp chưa kết thúc → 404; đúng lượt đại diện, lượt cuối huỷ ghi rõ, em chuyển lớp giữ lộ trình → roiSom (không lộ điểm lớp mới)', () => thu(() => {
    const ft = taoLop('FT', true); const ft2 = taoLop('FT', true);
    const a = taoHV(ft, 'FT', true, 6.5); const b = taoHV(ft, 'FT', true, 6.5); const c = taoHV(ft, 'FT', true, 6.5);
    themLuot(a, ft, 1, { band: 5.5 }); themLuot(a, ft, 2, { band: 6.5 });
    themLuot(b, ft, 1, { band: 6 }); themLuot(b, ft, 2, { status: 'cancelled' });
    themLuot(c, ft, 1, { band: 6 });
    assert(maLoi(() => tongKetSvc.tongKetLop(P.admin, ft)) === 404, 'lớp còn học → 404');
    studentsSvc.transferStudent(P.admin, c.sid, ft2, NGAY, 'Đổi lịch học', { noNote: true });   // FT → FT giữ lộ trình
    themLuot(c, ft2, 2, { band: 9 });                                                             // điểm ở LỚP MỚI — không được lộ ở tab lớp cũ
    studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', NGAY, 'Nghỉ học');
    studentsSvc.setStudentStatus(P.admin, b.sid, 'finished', NGAY, 'Nghỉ học');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(NGAY, ft);   // lớp FT hết em đang học (đóng theo lịch ở luồng thật)
    const r = tongKetSvc.tongKetLop(P.admin, ft);
    const hang = (sid: number) => r.dong.find((d: any) => d.studentId === sid);
    assert(r.dong.length === 3 && r.dong.at(-1).studentId === c.sid && hang(c.sid).roiSom && hang(c.sid).luotCuoi === null, JSON.stringify(hang(c.sid)));
    assert(hang(a.sid).luotCuoi.nhan === 'MT2' && hang(a.sid).luotCuoi.overall === 6.5 && hang(a.sid).soLuot === 2, JSON.stringify(hang(a.sid)));
    assert(hang(b.sid).luotCuoi.nhan === 'MT1' && hang(b.sid).luotCuoiHuy === 'MT2' && hang(b.sid).soLuot === 1, JSON.stringify(hang(b.sid)));
    assert(r.dai.hocVien === 2 && r.dai.choKetQua === 2 && r.dai.datTarget === 0, JSON.stringify(r.dai));
    assert(maLoi(() => tongKetSvc.tongKetLop(P.normalSubjectTeacher, ft)) === 403 && maLoi(() => tongKetSvc.tongKetLop(P.cpManager, ft)) === 403, 'quyền lớp');
  }));
  await checkAsync('TK-7 · tongKetLop lớp thường: Giữa khoá / Cuối khoá / hướng đã chốt từ bản chụp', () => thu(() => {
    const cls = taoLop('FOU', false); const be = taoLop('BE', false);
    const a = taoHV(cls, 'FOU', false); const b = taoHV(cls, 'FOU', false);
    themLuot(a, cls, 1, { kind: 'progress', ty: [14, 20] }); themLuot(a, cls, 2, { kind: 'final', ty: [16, 20] });
    themLuot(b, cls, 1, { kind: 'final', ty: [10, 20] });
    transitionSvc.applyTransition(P.admin, { fromClassId: cls, effectiveDate: NGAY, dongs: [{ studentId: a.sid, huong: 'len_lop', toClassId: be }, { studentId: b.sid, huong: 'hoc_lai', toClassId: taoLop('FOU', false) }] });
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(NGAY, cls);
    const r = tongKetSvc.tongKetLop(P.admin, cls);
    const ra = r.dong.find((d: any) => d.studentId === a.sid); const rb = r.dong.find((d: any) => d.studentId === b.sid);
    assert(r.lop.loai === 'thuong' && ra.huongTiep === 'Lên lớp' && rb.huongTiep === 'Học lại' && r.dai.lenLop === 1 && r.dai.hocLai === 1, JSON.stringify(r.dai));
    assert(ra.cuoiKhoa.tyLe === 0.8 && ra.giuaKhoa.tyLe === 0.7 && ra.cuoiKhoa.dai === 'dat' && rb.giuaKhoa === null && rb.cuoiKhoa.tyLe === 0.5, JSON.stringify([ra.cuoiKhoa, ra.giuaKhoa, rb.cuoiKhoa]));
  }));

  // ------------------------------------------------------------------ TK-8 / TK-9 · luật dùng chung của giao diện
  check('TK-8 · duongHoSoHocVien / docThamSoHoSo: tham số tong-ket và viec=thi-that đi và về đúng', () => {
    const u = d.duongHoSoHocVien(7, { tab: 'hanh-trinh', tongKet: 12 });
    assert(u === '/hoc-vien/7?tab=hanh-trinh&tong-ket=12', u);
    const q = new URLSearchParams(u.split('?')[1]);
    const p = d.docThamSoHoSo((k: string) => q.get(k));
    assert(p.tab === 'hanh-trinh' && p.tongKet === 12, JSON.stringify(p));
    const v = d.duongHoSoHocVien(7, { loTrinh: 3, viec: 'thi-that' });
    assert(v === '/hoc-vien/7?lo-trinh=3&viec=thi-that' && d.docThamSoHoSo((k: string) => new URLSearchParams(v.split('?')[1]).get(k)).viec === 'thi-that', v);
    assert(d.docThamSoHoSo((k: string) => (k === 'tong-ket' ? 'abc' : null)).tongKet === undefined, 'tham số lạ bỏ qua');
  });
  check('TK-9 · tab hồ sơ lớp: "Tổng kết" chỉ khi lớp đã kết thúc, đứng đầu và là mặc định; lớp đang học không đổi', () => {
    assert(d.tabHienCuaLop(true).join() === 'tong-ket,hoc-vien,y-thuc,phan-tich' && d.tabHienCuaLop(false).join() === 'hoc-vien,y-thuc,phan-tich', 'danh sách tab');
    assert(d.tabMacDinhLop(null, true) === 'tong-ket' && d.tabMacDinhLop(null, false) === 'hoc-vien', 'mặc định');
    assert(d.tabMacDinhLop('hoc-vien', true) === 'hoc-vien' && d.tabMacDinhLop('phan-tich', true) === 'phan-tich', 'tab ghi rõ trên URL thắng');
    assert(d.tabMacDinhLop('tong-ket', false) === 'hoc-vien' && d.tabMacDinhLop('giao-vien', true) === 'tong-ket', 'tab không hiện / lạ → mặc định');
    assert(d.TAB_HO_SO_LOP_NHAN['tong-ket'] === 'Tổng kết' && d.NHAN_VIEC_QUAN_LY.outcome === 'Kết quả thi thật', 'nhãn');
  });

  // @@BAT-BIEN@@ — luôn ở CUỐI file: soi mọi lộ trình các phép kiểm trước để lại. Thêm phép kiểm mới Ở TRÊN dòng này.
  /* TK-5 bất biến phụ "điểm bản chụp = điểm sống" chỉ kiểm trong phép kiểm TK-5 ở trên: nhiều phép kiểm khác (PR khác) sửa / xoá điểm của lộ trình đã đóng bằng SQL thẳng nên soi toàn DB ở cuối sẽ báo oan. */
  await checkAsync('TK-3 · BẤT BIẾN: mọi lộ trình status <> active đều có ≥ 1 bản chụp (đường đóng mới quên gọi → đỏ)', async () => {
    const thieu = all(`SELECT c.id, c.student_id, c.status FROM learning_cycles c WHERE c.status IN ('completed', 'abandoned')
                        AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id) LIMIT 10`);
    assert(thieu.length === 0, `lộ trình đóng thiếu bản chụp: ${JSON.stringify(thieu)}`);
  });
}
