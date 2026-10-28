/**
 * PHÉP KIỂM PR-OV3b — Lộ trình tiếp theo: nháp (chỉ QL thấy, không lệnh / MT0 / việc) → chốt (= ra lệnh, xoá nháp cùng tx); GVCN thôi ghi Hướng;
 * hạn mới (nhắc từ thứ Hai tuần Final − 2, chốt hết tuần Final − 2, bàn giao hết tuần Final và ≥ 2 ngày sau chốt; FT 5 ngày); đổi hướng / lớp đích
 * sau chốt → phiếu cần làm lại + một chuông; Kết quả đầu ra (FOU thêm, GVCN đề xuất không chạy gì, QL chốt → Case + Tutor); migrate nháp.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv3bTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const ltt: any = await import('../classes/loTrinhTiep.ts');
  const tr: any = await import('../classes/transition.ts');
  const bg: any = await import('../classes/banGiao.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { migratePrOv3b } = await import('../migrate/prOv3b.ts');
  console.log('\nPR-OV3b · Lộ trình tiếp theo: nháp / chốt, hạn, bàn giao, Kết quả đầu ra');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown) => { try { fn(); return null; } catch (e: any) { return { status: e?.status as number, msg: String(e?.message) }; } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  let seq = 0;
  const lopMoi = (kind: string, ft: boolean, tuanHienTai: number) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * (tuanHienTai - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-OV3B${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 3`, MB).map((r) => r.user_id as number);
  const ganGv = (lop: number, userId: number, skill: string | null, core = 0) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, skill, core, new Date().toISOString());
  const hocVien = (lop: number, ma: string | null) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV3B${seq}`, `Hoc vien OV3b ${seq}`, `hoc vien ov3b ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, NULL, ?, 'active', ?)`)
      .run(sid, ma ? null : 'LT1', ma ?? 'FT', TODAY, now);
    return sid;
  };
  const diemMt0 = (sid: number, b: { L: number; R: number; W: number; S: number } | { L: number }) => {
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, sid);
    assert(!!a, `em ${sid} chưa có MT0`);
    const now = new Date().toISOString();
    const ds = 'R' in b ? [['listening', b.L], ['reading', b.R], ['writing1', b.W], ['writing2', b.W], ['speaking', b.S]] : [['listening', b.L]];
    for (const [k, v] of ds) conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)').run(a.id, k, v, now);
  };
  const chuong = (userId: number, kind: string) => (get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = ?`, userId, kind).n as number);
  const lenhCho = (sid: number) => get(`SELECT * FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, sid);
  const nhapCua = (sid: number) => get(`SELECT * FROM lo_trinh_nhap WHERE student_id = ?`, sid);
  const emPlan = (p: any, lop: number, sid: number) => (tr.transitionPlan(p, lop).students as any[]).find((s) => s.id === sid);

  check('OV3b-1 · hạn (N20): Final tuần 10 → nhắc từ thứ Hai tuần 9, chốt hạn thứ Năm tuần 9, bàn giao hết tuần 10; OV-13l: mọi lệnh ≥ ra lệnh + 7 ngày, GVBM = GVCN', () => {
    const final = '2026-11-16';   // thứ Hai tuần 10
    const m = d.mocLoTrinh(final);
    assert(m.nhacTu === '2026-11-09' && m.hanChot === '2026-11-12' && m.hanBanGiao === '2026-11-22', JSON.stringify(m));
    const h = (ngay: string, o: any = {}) => d.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: final, ngay, ...o });
    assert(JSON.stringify(h('2026-11-05')) === JSON.stringify({ gvbm: '2026-11-22', gvcn: '2026-11-22' }), JSON.stringify(h('2026-11-05')));
    assert(JSON.stringify(h('2026-11-22')) === JSON.stringify({ gvbm: '2026-11-28', gvcn: '2026-11-28' }), `chốt CN tuần 10 → + 7 ngày: ${JSON.stringify(h('2026-11-22'))}`);
    const bay = JSON.stringify({ gvbm: '2026-09-20', gvcn: '2026-09-20' });
    assert(JSON.stringify(h('2026-09-14', { nguonFt: true, boiCanh: 'giua-khoa' })) === bay, 'FT 7 ngày');
    assert(JSON.stringify(h('2026-09-14', { boiCanh: 'giua-khoa' })) === bay, 'giữa khoá 7 ngày');
    assert(JSON.stringify(h('2026-09-14', { tuanFinal: null })) === bay, 'không có tuần Final → 7 ngày');
    assert(d.hanChotLenFt === undefined, 'hanChotLenFt cũ còn');
  });

  /* Lớp BE đang ở tuần 8 (Final tuần 10 = TODAY + 14) + lớp FT + hai lớp ELE đích; GVCN + GVBM Writing. */
  const be = lopMoi('BE', false, 8), ft = lopMoi('FT', true, 1), ele1 = lopMoi('ELE', false, 1), ele2 = lopMoi('ELE', false, 1);
  ganGv(be, GV[0], null, 1); ganGv(be, GV[1], 'writing');
  const GVCN = loadPrincipal(GV[0]), GVBM = loadPrincipal(GV[1]);
  const [A, B, C, D] = [hocVien(be, 'BE'), hocVien(be, 'BE'), hocVien(be, 'BE'), hocVien(be, 'BE')];
  const final = schedule.classProgress(be).finalWeekStart as string;

  check('OV3b-2 · việc QL "Chốt lộ trình" hiện từ thứ Hai tuần trước Final, không trước; hạn = thứ Năm tuần đó (N20)', () => {
    assert(final === t.addDays(d.mondayOfDate(TODAY), 14), `Final ${final}`);
    const m = d.mocLoTrinh(final);
    const cua = (ngay: string) => { xoaNho(); return (lenh.lopChoChotLoTrinh(QL, MB, ngay) as any[]).find((x) => x.classId === be); };
    const co = cua(m.nhacTu);
    assert(co && co.han === m.hanChot && co.tong === 4, JSON.stringify(co));
    assert(!cua(t.addDays(m.nhacTu, -1)), 'hiện trước thứ Hai tuần trước Final');
  });

  check('OV3b-3 · nháp: QL lưu → không lệnh / MT0 / việc / chuông; GV không thấy; GVCN 403; sửa / xoá; lô 3 em 1 lỗi → 2 em lưu', () => {
    const chuongTruoc = get('SELECT COUNT(*) n FROM notifications').n;
    const r = ltt.luuNhap(QL, be, { items: [{ studentId: A, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6, ghiChu: 'nháp' }] });
    assert(r.ok.join() === String(A) && !r.failed.length, JSON.stringify(r));
    assert(!lenhCho(A), 'nháp tạo lệnh');
    assert(!get(`SELECT 1 FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`, A), 'nháp tạo MT0');
    assert(!get(`SELECT 1 FROM lo_trinh_tiep_theo WHERE student_id = ?`, A), 'nháp ghi vào Lộ trình tiếp theo');
    assert(get('SELECT COUNT(*) n FROM notifications').n === chuongTruoc, 'nháp gửi chuông');
    assert(!bg.viecBanGiao(GV[0]).some((v: any) => v.lopId === be), 'nháp mở việc bàn giao');
    const n = emPlan(QL, be, A).nhap;
    assert(n && n.huong === 'fast_track' && n.lopDichId === ft && n.tuan === THU_HAI && n.mucTieu === 6 && n.ghiChu === 'nháp', JSON.stringify(n));
    for (const gv of [GVCN, GVBM]) assert(!('nhap' in emPlan(gv, be, A)) || emPlan(gv, be, A).nhap == null, 'GV thấy nháp');
    assert(maLoi(() => ltt.luuNhap(GVCN, be, { items: [{ studentId: B, huong: 'hoc_lai' }] }))?.status === 403, 'GVCN lưu nháp được');
    ltt.luuNhap(QL, be, { items: [{ studentId: A, huong: 'hoc_lai', toClassId: null, ghiChu: null }] });
    assert(nhapCua(A).huong === 'hoc_lai' && nhapCua(A).lop_dich_id === null, 'sửa nháp');
    ltt.xoaNhap(QL, be, A);
    assert(!nhapCua(A), 'xoá nháp');
    assert(maLoi(() => ltt.xoaNhap(GVCN, be, B))?.status === 403, 'GVCN xoá nháp được');
    const lo = ltt.luuNhap(QL, be, { items: [
      { studentId: A, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6 },
      { studentId: B, huong: 'len_lop', toClassId: ele1 },
      { studentId: 999999, huong: 'len_lop' },
    ] });
    assert(lo.ok.length === 2 && lo.failed.length === 1 && lo.failed[0].studentId === 999999 && lo.failed[0].message, JSON.stringify(lo));
    assert(nhapCua(A) && nhapCua(B), 'dòng đúng phải lưu');
  });

  check('OV3b-4 · chốt từ nháp: lệnh chờ + Lộ trình tiếp theo + MT0 + việc bàn giao; nháp xoá cùng tx; hạn theo mục 4; huỷ như cũ', () => {
    const r = lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null,
      dongs: [{ studentId: A, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6 }] });
    assert(r.ok.join() === String(A), JSON.stringify(r));
    const l = lenhCho(A);
    assert(l && l.huong === 'fast_track', 'thiếu lệnh');
    assert(get(`SELECT huong FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?`, A, be)?.huong === 'fast_track', 'thiếu LTT');
    assert(get(`SELECT 1 FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, A), 'thiếu MT0');
    assert(bg.viecBanGiao(GV[0]).some((v: any) => v.lopId === be && v.loai === 'gvcn'), 'thiếu việc bàn giao GVCN');
    assert(!nhapCua(A), 'nháp còn sau khi chốt');
    const han = d.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: final, ngay: TODAY });
    assert(l.han_gvbm === han.gvbm && l.han_gvcn === han.gvcn && han.gvcn === t.addDays(final, 6), `hạn ${l.han_gvbm}/${l.han_gvcn}`);
    lenh.huyLenh(QL, l.id, 'thử huỷ');
    assert(get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', l.id).trang_thai === 'huy', 'huỷ');
  });

  check('OV3b-5 · GVCN ghi Hướng (một em, cả lớp) → 403; transition không còn coTheGhiHuong', () => {
    assert(maLoi(() => ltt.ghiLoTrinhTiep(GVCN, C, { huong: 'len_lop' }))?.status === 403, 'một em');
    assert(maLoi(() => ltt.ghiLoTrinhTiepCaLop(GVCN, be, { items: [{ studentId: C, huong: 'len_lop' }] }))?.status === 403, 'cả lớp');
    assert(!('coTheGhiHuong' in tr.transitionPlan(GVCN, be)), 'còn coTheGhiHuong');
    assert(!ltt.lopHocCua(GVCN, C, { class_id: be }).quyen.ghiLoTrinhTiep, 'GVCN còn mục Lộ trình tiếp theo để ghi');
  });

  check('OV3b-6 · đổi lớp đích sau chốt → bỏ xác nhận, chữ cũ còn, cần làm lại, đúng một chuông GVCN + GVBM, hạn tính lại; đổi tuần → không chuông', () => {
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: B, huong: 'len_lop', toClassId: ele1, tuan: THU_HAI }] });
    const l = lenhCho(B);
    bg.ghiMon(GVBM, l.id, 'writing', 'Viết ổn, cần thêm từ nối.');
    bg.xacNhanBanGiao(GVCN, l.id, 'Em chăm, theo kịp lớp, nên lên ELE.');
    const truoc = [chuong(GV[0], 'lam_lai_ban_giao'), chuong(GV[1], 'lam_lai_ban_giao')];
    lenh.suaLenh(QL, l.id, { toClassId: ele2 });
    const sau = lenhCho(B);
    assert(sau.id === l.id && sau.lop_dich_id === ele2, 'lệnh chưa đổi đích');
    assert(sau.xac_nhan_luc === null && sau.nhan_xet_chung === 'Em chăm, theo kịp lớp, nên lên ELE.', `xác nhận ${sau.xac_nhan_luc} · nhận xét ${sau.nhan_xet_chung}`);
    const mon = get(`SELECT noi_dung, lam_lai FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'writing'`, l.id);
    assert(mon.noi_dung === 'Viết ổn, cần thêm từ nối.' && mon.lam_lai === 1, JSON.stringify(mon));
    assert(bg.viecBanGiao(GV[1]).some((v: any) => v.lopId === be && v.loai === 'gvbm' && v.mon === 'writing'), 'GVBM không có việc làm lại');
    const phieu = bg.phieuBanGiao(GVCN, { lenhId: l.id }).ds[0];
    assert(phieu.mon.find((m: any) => m.ma === 'writing').noiDung === 'Viết ổn, cần thêm từ nối.' && phieu.mon.find((m: any) => m.ma === 'writing').lamLai, 'phiếu không điền sẵn / không báo làm lại');
    assert(chuong(GV[0], 'lam_lai_ban_giao') === truoc[0] + 1 && chuong(GV[1], 'lam_lai_ban_giao') === truoc[1] + 1, 'phải đúng một chuông mỗi GV');
    const han = d.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: final, ngay: TODAY });
    assert(sau.han_gvcn === han.gvcn, `hạn ${sau.han_gvcn}`);
    lenh.suaLenh(QL, l.id, { tuan: t.addDays(THU_HAI, 7) });
    assert(chuong(GV[0], 'lam_lai_ban_giao') === truoc[0] + 1 && chuong(GV[1], 'lam_lai_ban_giao') === truoc[1] + 1, 'đổi tuần mà có chuông');
    bg.ghiMon(GVBM, l.id, 'writing', 'Viết ổn.');
    assert(get(`SELECT lam_lai FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'writing'`, l.id).lam_lai === 0, 'ghi lại không xoá dấu làm lại');
  });

  check('OV3b-7 · hạn bàn giao (OV-13l): lệnh từ lớp FT và giữa khoá lớp thường đều 7 ngày, GVBM = GVCN', () => thu(() => {
    const ft2 = lopMoi('FT', true, 3), em = hocVien(ft2, null);
    lenh.raLenh(QL, { lopNguonId: ft2, boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: em, huong: 'chuyen_lop', toClassId: ft, tuan: THU_HAI, lyDo: 'gộp lớp' }] });
    const l = lenhCho(em);
    assert(l.han_gvbm === t.addDays(TODAY, 6) && l.han_gvcn === t.addDays(TODAY, 6), `FT ${l.han_gvbm}/${l.han_gvcn}`);
    const be2 = lopMoi('BE', false, 3);
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: D, huong: 'chuyen_lop', toClassId: be2, tuan: THU_HAI, lyDo: 'đổi ca' }] });
    const g = lenhCho(D);
    assert(g.han_gvbm === t.addDays(TODAY, 6) && g.han_gvcn === t.addDays(TODAY, 6), `giữa khoá ${g.han_gvbm}/${g.han_gvcn}`);
  }));

  check('OV3b-8 · Kết quả đầu ra: FOU > 3.5; GVCN đề xuất không tạo Case; GVBM 403; chưa 3/4 → Chờ MT0; QL chốt Không đạt · Trung tâm → Case + Tutor 10 buổi', () => {
    const fou = d.goiYKyVong('FOU', { listening: 4, reading: 4, writing: 4, speaking: 4 });
    assert(fou?.dat === true && fou.overall === 4, `FOU 4.0 ${JSON.stringify(fou)}`);
    assert(d.goiYKyVong('FOU', { listening: 3.5, reading: 3.5, writing: 3.5, speaking: 3.5 })?.dat === false, 'FOU 3.5 phải không đạt');
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [
      { studentId: C, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6 },
      { studentId: D, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6 },
    ] });
    diemMt0(C, { L: 3, R: 3.5, W: 4, S: 4 });
    diemMt0(D, { L: 5 });
    const kC = emPlan(QL, be, C).kqdr;
    assert(kC && kC.mt0?.overall === 3.5 && kC.goiY?.dat === false && kC.nguong === 4 && kC.deXuat === null && kC.chot === null, JSON.stringify(kC));
    const kD = emPlan(GVCN, be, D).kqdr;
    assert(kD && kD.mt0 === null, `D phải Chờ MT0: ${JSON.stringify(kD)}`);
    /* N22 ② (P9b): GVCN không đề xuất Kỳ vọng nữa — chỉ QL đánh (`ghiKetLuanFt` / trang Cuối khoá). Đề xuất cũ `kq_de_xuat_*` chỉ đọc. */
    assert(ck.deXuatKetQua === undefined, 'còn đường GVCN đề xuất Kỳ vọng');
    assert(maLoi(() => ck.ghiKetLuanFt(GVCN, C, { dat: true }))?.status === 403, 'GVCN đánh được Kỳ vọng');
    ck.ghiKetLuanFt(QL, C, { dat: false, nguyenNhan: 'trung_tam', mon: ['listening'] });
    assert(emPlan(QL, be, C).kqdr.chot?.dat === false, 'QL chốt chưa hiện');
    /* Thi hành thứ Hai: em sang FT có kết luận "Trung tâm" → Case + PA Tutor 10 buổi. */
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally { setConfig('demo_date', cu); xoaNho(); }
    const c = get(`SELECT id FROM sos_cases WHERE student_id = ? AND origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'`, C);
    assert(c, 'thiếu Case sau khi QL chốt');
    const pa = get(`SELECT kind, so_buoi FROM case_interventions WHERE case_id = ?`, c.id);
    assert(pa?.kind === 'tutor' && pa.so_buoi === 10, JSON.stringify(pa));
  });

  check('OV3b-9 · migrate prOv3b: Hướng GVCN chưa có lệnh → nháp; có lệnh / Chưa quyết không chép; chạy lần hai không đổi', () => thu(() => {
    const be3 = lopMoi('BE', false, 6);
    const [x, y, z] = [hocVien(be3, 'BE'), hocVien(be3, 'BE'), hocVien(be3, 'BE')];
    const now = new Date().toISOString();
    const chen = (sid: number, huong: string, lop: number | null) => conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, lop_du_kien_id, muc_tieu, ghi_chu, huong_gvcn, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(sid, be3, huong, lop, huong === 'fast_track' ? 6.5 : null, 'ghi của GVCN', huong, now, now);
    chen(x, 'len_lop', ele1); chen(y, 'fast_track', ft); chen(z, 'chua_quyet', null);
    lenh.raLenh(QL, { lopNguonId: be3, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: y, huong: 'fast_track', toClassId: ft, tuan: THU_HAI, mucTieu: 6.5 }] });
    conn.exec('DROP TABLE lo_trinh_nhap');   // DB trước OV-3b
    const lttCu = (conn.prepare("SELECT name FROM pragma_table_info('lo_trinh_tiep_theo')").all() as any[]).length;
    const a1: string[] = [];
    migratePrOv3b(conn, a1);
    const nx = nhapCua(x);
    assert(nx && nx.huong === 'len_lop' && nx.lop_dich_id === ele1 && nx.ghi_chu === 'ghi của GVCN', JSON.stringify(nx));
    assert(!nhapCua(y) && !nhapCua(z), 'chép nhầm em có lệnh / Chưa quyết');
    assert(get(`SELECT COUNT(*) n FROM lo_trinh_tiep_theo WHERE class_id = ?`, be3).n === 3, 'migrate xoá LTT');
    assert((conn.prepare("SELECT name FROM pragma_table_info('lo_trinh_tiep_theo')").all() as any[]).length === lttCu, 'cột LTT đổi trên DB đã có cột');
    const truoc = get('SELECT COUNT(*) n FROM lo_trinh_nhap').n;
    const a2: string[] = [];
    migratePrOv3b(conn, a2);
    assert(get('SELECT COUNT(*) n FROM lo_trinh_nhap').n === truoc && !a2.length, `lần hai: ${a2}`);
  }));
}
