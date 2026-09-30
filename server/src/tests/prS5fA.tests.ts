/** PHÉP KIỂM PR-S5F-a — sửa sau rà cuối đợt 5: chuyển lớp, bàn giao, Cuối khoá (đặc tả §3.1f, §6.3–6.4, T70, M-01). Mỗi mục MỘT phép tái hiện. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrS5fATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  console.log('\nPR-S5F-a · Sửa sau rà cuối đợt 5 — chuyển lớp, bàn giao, Cuối khoá');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const TUAN = d.tuanChonDuoc(TODAY) as string[];
  const THU_HAI = TUAN[0];
  let seq = 0;
  const lopMoi = (o: { kind: string; ft?: boolean; route?: string | null; tuanHienTai?: number }) => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -7 * ((o.tuanHienTai ?? 1) - 1)));
    return (intake.createClass(P.admin, {
      code: `MB-S5F${seq}`, branchId: MB, kind: o.kind, isFastTrack: !!o.ft, route: o.route ?? null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const ganGv = (lop: number, userId: number, skill: string | null, core: boolean) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, skill, core ? 1 : 0, new Date().toISOString());
  const hocVien = (lop: number, ma: string | null, ft: boolean, target: number | null = null) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-S5F${seq}`, `Hoc vien S5F${seq}`, `hoc vien s5f${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`)
      .run(sid, ft ? 'LT1' : null, ma, target, TODAY, now).lastInsertRowid);
    return { sid, cyc };
  };
  const dongCua = (sid: number, huong: string, toClassId: number | null, o: Record<string, unknown> = {}) => ({ studentId: sid, huong, toClassId, tuan: THU_HAI, ...o });
  const lenhCua = (sid: number) => get(`SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, sid);
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  /** Chạy `fn` với "hôm nay" = `ngay` (luật cũ đọc ngày demo). */
  const vaoNgay = <T>(ngay: string, fn: () => T): T => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', ngay);
    try { return fn(); } finally { setConfig('demo_date', cu); }
  };
  const chay = (ngay: string) => vaoNgay(ngay, () => lenh.thiHanhLenhDenHan(ngay));
  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const demNhatKy = (lop: number) => get(`SELECT COUNT(*) n FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action IN ('lenh_chuyen.thi_hanh', 'class.transition')`, lop).n as number;

  // ------------------------------------------------------------------ (1) lệnh bị luật từ chối không kẹt
  /* Lệnh còn chờ của các bộ kiểm trước (và bộ demo) đến hạn cùng Thứ Hai — dọn để số đếm chỉ tính lệnh của khối này. */
  conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE trang_thai = 'cho'`).run();
  check('S5F-a (1) · lệnh bị luật từ chối ("chương trình kế tiếp"): đọc trang cùng ngày không ghi DB/nhật ký; GVCN đề xuất được; QL sửa sang tuần mới → chuyển; huỷ được; KCK không cần vai người ra lệnh', () => {
    const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const dich2 = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(nguon, P.normalCoreTeacher.userId, null, true);
    const gvcn = loadPrincipal(P.normalCoreTeacher.userId);
    const [e1, e2] = [hocVien(nguon, 'FOU', false).sid, hocVien(nguon, 'FOU', false).sid];
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(e1, 'len_lop', dich), dongCua(e2, 'len_lop', dich)] });
    assert(r.ok.length === 2, JSON.stringify(r));
    conn.prepare(`UPDATE classes SET programme_code = 'FOU' WHERE id = ?`).run(dich);   // lớp đích đổi chương trình trước Thứ Hai
    const kq = chay(THU_HAI);
    assert(kq.daChuyen === 0 && /chương trình kế tiếp/.test(lenhCua(e1).loi) && lenhCua(e1).thu_ngay === THU_HAI, `${JSON.stringify(kq)} ${JSON.stringify(lenhCua(e1))}`);
    assert(demNhatKy(nguon) === 0, `không em nào chuyển → không nhật ký, có ${demNhatKy(nguon)}`);
    /* Đọc trang lần nữa cùng ngày: chỉ MỘT câu đọc, không mở tx, không ghi. */
    let kq2: any;
    const n = demTruyVan(() => { kq2 = lenh.thiHanhLenhDenHan(THU_HAI); });   // không đổi ngày demo: không có gì để làm
    assert(n === 1 && kq2.daChuyen === 0 && kq2.loi === 0, `${n} câu · ${JSON.stringify(kq2)}`);
    /* GVCN gửi Đề xuất chuyển lớp dù em đang có lệnh lỗi. */
    const thu = vaoNgay(t.addDays(THU_HAI, 2), () => maLoi(() => lenh.guiDeXuatChuyenLop(gvcn, e2, { lyDo: 'Lớp đích không mở, xin xếp lớp khác cho em' })));
    assert(thu === 'không ném', `GVCN đề xuất: ${thu}`);
    /* Thứ Tư: QL sửa lệnh e1 sang tuần sau + lớp đích đúng chương trình; huỷ lệnh e2. */
    const THU_TU = t.addDays(THU_HAI, 2);
    vaoNgay(THU_TU, () => {
      assert(maLoi(() => lenh.suaLenh(P.mbManager, lenhCua(e1).id, { lyDo: 'giữ tuần cũ' })) === 400, 'giữ tuần đã qua → 400');
      lenh.suaLenh(P.mbManager, lenhCua(e1).id, { toClassId: dich2, tuan: TUAN[1] });
      lenh.huyLenh(P.mbManager, lenhCua(e2).id, 'Chờ lớp mới mở');
    });
    const l1 = lenhCua(e1);
    assert(l1.trang_thai === 'cho' && l1.loi === null && l1.thu_ngay === null && l1.tuan_bat_dau === TUAN[1] && lenhCua(e2).trang_thai === 'huy', JSON.stringify(l1));
    const kq3 = chay(TUAN[1]);
    assert(kq3.daChuyen === 1 && get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, e1).class_id === dich2, JSON.stringify(kq3));
    assert(demNhatKy(nguon) >= 1, 'có chuyển → có nhật ký');

    /* KCK: người ra lệnh đã mất vai Quản lý (thay bằng GV không có cycle.edit) → vẫn chuyển, Target KCK, KHÔNG có "Đổi mục tiêu 5 → KCK". */
    const nguonFt = lopMoi({ kind: 'BE', tuanHienTai: 10 });
    const ft = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 1 });
    const k = hocVien(nguonFt, 'BE', false).sid;
    lenh.raLenh(P.mbManager, { lopNguonId: nguonFt, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(k, 'fast_track', ft, { mucTieu: 'KCK', tuan: TUAN[1] })] });
    conn.prepare('UPDATE lenh_chuyen_lop SET nguoi_ra_lenh = ? WHERE id = ?').run(P.normalCoreTeacher.userId, lenhCua(k).id);
    assert(chay(TUAN[1]).daChuyen === 1 && lenhCua(k).trang_thai === 'da_chuyen', `KCK: ${JSON.stringify(lenhCua(k))}`);
    const cy = get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, k);
    assert(cy.khong_cam_ket === 1 && cy.target_score === null, JSON.stringify(cy));
    assert(!get(`SELECT 1 FROM journey_events WHERE student_id = ? AND title LIKE 'Đổi mục tiêu%'`, k), 'không ghi số tạm ra Hành trình');
  });

  // ------------------------------------------------------------------ dựng chung cho (2)–(10)
  const bg: any = await import('../classes/banGiao.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const reg: any = await import('../normal/regular.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const dai: any = await import('../classes/daiChuyenLop.ts');
  const sched: any = await import('../classes/schedule.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { quyenBoTro } = await import('../cases/boTro.ts');
  const fs = await import('node:fs');
  const GV = (conn.prepare(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`).all(MB) as any[]).map((r) => r.user_id as number);
  assert(GV.length === 4, `cần 4 giáo viên MB, có ${GV.length}`);
  /** Bài Cuối khoá của em ở lớp: `d` = số câu đúng / 25 theo L R W S (`null` = chưa có điểm môn đó). */
  const cuoiKhoa = (lop: number, sid: number, d: (number | null)[]) => {
    reg.planRegularTests(P.admin, lop, { studentIds: [sid], kinds: ['final'] });
    const a = get(`SELECT * FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid, lop);
    ['listening', 'reading', 'writing', 'speaking'].forEach((k, i) => { if (d[i] !== null) reg.saveRegularScore(P.admin, a.id, k, { score: d[i], total: 25 }); });
    return a;
  };
  /** Thi hành tới `ngay` rồi khẳng định lệnh CỦA EM này đã chuyển (không đếm toàn cục — khối khác có thể còn lệnh cùng Thứ Hai). */
  const daChuyen = (sid: number, ngay: string) => {
    const kq = chay(ngay);
    assert(lenhCua(sid).trang_thai === 'da_chuyen', `chưa chuyển: ${JSON.stringify(kq)} ${JSON.stringify(lenhCua(sid))}`);
  };
  const moCase = (sid: number, cyc: number, category: string, owner: number | null) => Number(conn.prepare(
    `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, owner_user_id, detected_at, created_at)
     VALUES (?,?,?,?, 'teacher_report', 'in_progress', NULL, ?, ?, ?)`,
  ).run(sid, cyc, category, category, owner, TODAY, new Date().toISOString()).lastInsertRowid);

  check('S5F-a (2) · lớp thường phân công ô "writing" (G+V): GVBM ghi được bàn giao môn, có việc, có tên ở phiếu (không bị loại vì so W1/W2)', () => {
    const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(nguon, GV[0], null, true);
    ganGv(nguon, GV[1], 'writing', false);
    const e = hocVien(nguon, 'FOU', false).sid;
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(e, 'len_lop', dich)] });
    const gv = loadPrincipal(GV[1]);
    const viecLop = () => bg.viecBanGiao(GV[1]).filter((v: any) => v.lopId === nguon && v.loai === 'gvbm');
    assert(viecLop().length === 1 && viecLop()[0].mon === 'writing', `GVBM G+V có việc: ${JSON.stringify(viecLop())}`);
    assert(maLoi(() => bg.ghiMon(gv, lenhCua(e).id, 'writing', 'Còn sai thì hiện tại hoàn thành.')) === 'không ném', 'GVBM G+V ghi môn writing');
    assert(viecLop().length === 0, 'đã ghi hết → hết việc');
    const phieu = bg.phieuBanGiao(P.mbManager, { lopNguonId: nguon });
    assert(phieu.ds[0].mon.find((m: any) => m.ma === 'writing').gvbm.length === 1, JSON.stringify(phieu.ds[0].mon));
    assert(d.kyNangPhuTrach('FOU', 'writing').join() === 'writing' && d.kyNangPhuTrach('FT', 'writing').join() === 'writing1,writing2', 'lớp FT vẫn tách W1/W2');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE student_id = ?`).run(e);   // không lẫn vào số đếm thi hành của khối sau
  });

  check('S5F-a (3)(4) · phiếu lớp thường: Kết quả = "Cuối khoá n%" (không SOS); Việc còn dở có PA bổ trợ Giữa khoá; chuyển xong: chủ Case = GV đúng môn lớp mới, PA giữ người dạy cũ', () => {
    const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(nguon, GV[0], null, true);
    ganGv(nguon, GV[1], 'reading', false);
    ganGv(dich, GV[2], 'reading', false);
    ganGv(dich, GV[3], null, true);
    const { sid: e, cyc } = hocVien(nguon, 'FOU', false);
    cuoiKhoa(nguon, e, [17, 12, 17, 17]);   // 63% — Reading trượt
    const caseId = moCase(e, cyc, 'reading', GV[1]);
    const ivId = Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, needs_approval, preset, created_at)
       VALUES (?, 'bo_tro', 'Bổ trợ Giữa khoá Reading', ?, ?, 'started', ?, 0, 0, ?)`,
    ).run(caseId, GV[1], GV[1], t.addDays(TODAY, -14), new Date().toISOString()).lastInsertRowid);
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(e, 'len_lop', dich)] });
    const td = bg.phieuBanGiao(P.mbManager, { lopNguonId: nguon }).ds[0].tuDien;
    assert(/^Cuối khoá 63%/.test(td.ketQua) && !/SOS/.test(td.ketQua), td.ketQua);
    assert(/PA bổ trợ Giữa khoá .* chờ ghi kết quả cuối/.test(td.viecConDo), td.viecConDo);
    daChuyen(e, THU_HAI);
    const c = get('SELECT owner_user_id, cycle_id FROM sos_cases WHERE id = ?', caseId);
    assert(c.owner_user_id === GV[2] && c.cycle_id !== cyc, `chủ Case: ${JSON.stringify(c)}`);
    assert(get(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'owner' AND new_value = 'bàn giao khi chuyển lớp'`, caseId), 'lịch sử đổi chủ');
    const iv = get('SELECT performer_user_id, status FROM case_interventions WHERE id = ?', ivId);
    assert(iv.performer_user_id === GV[1] && iv.status === 'started' && quyenBoTro(loadPrincipal(GV[1]), { performer_user_id: GV[1], case_id: caseId }), `PA cũ: ${JSON.stringify(iv)}`);
    /* Việc tiếp của Case: ưu tiên PA ở lớp mới; PA lớp cũ ghi rõ "(lớp cũ)". */
    const pa = (o: Record<string, unknown>) => ({ id: 1, ten: 'Bổ trợ', batBuoc: false, choXacNhan: false, xong: false, actionDue: '2026-10-05', followupDue: null, ...o });
    const v4 = { status: 'in_progress', fromSos: false, hasCause: true, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false, coPaChoXacNhan: false, hanXacNhan: null, boTro: null };
    const hai = d.viecTiepCuaCase(v4, [pa({ id: 1, lopCu: true, actionDue: '2026-09-01' }), pa({ id: 2, ten: 'Bổ trợ miễn phí' })], TODAY);
    const mot = d.viecTiepCuaCase(v4, [pa({ id: 1, lopCu: true })], TODAY);
    assert(hai?.paId === 2 && / \(lớp cũ\)$/.test(mot?.chu ?? ''), `${JSON.stringify(hai)} ${JSON.stringify(mot)}`);
  });

  check('S5F-a (5)(6) · điểm Cuối khoá nhập muộn → PA bổ trợ + Mini Test tính từ hôm nay (không quá hạn ngay); sửa điểm em đã sang FT không tạo lại Case Tutor đã Hoàn thành', () => {
    const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const e = hocVien(nguon, 'FOU', false).sid;
    const a = cuoiKhoa(nguon, e, [16, 16, 16, null]);   // thiếu P lúc chuyển
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(e, 'len_lop', dich)] });
    daChuyen(e, THU_HAI);
    const MUON = t.addDays(THU_HAI, 21);
    vaoNgay(MUON, () => reg.saveRegularScore(P.admin, a.id, 'speaking', { score: 16, total: 25 }));
    const mt = get('SELECT * FROM mini_test WHERE student_id = ?', e);
    assert(mt && mt.ngay_du_kien > MUON && mt.han > MUON, `Mini Test: ${JSON.stringify(mt)} · nhập ${MUON}`);

    /* (6) BE → FT, Kỳ vọng đầu ra "Trung tâm · Reading" → Case Tutor; Case Hoàn thành; sửa điểm → không có Case thứ hai. */
    const be = lopMoi({ kind: 'BE', tuanHienTai: 11 });
    const ft = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 1 });
    const f = hocVien(be, 'BE', false).sid;
    const af = cuoiKhoa(be, f, [20, 20, 20, 20]);
    ck.ghiKetLuanFt(P.mbManager, f, { dat: false, nguyenNhan: 'trung_tam', mon: ['reading'] });
    lenh.raLenh(P.mbManager, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(f, 'fast_track', ft, { mucTieu: 6 })] });
    daChuyen(f, THU_HAI);
    const dem = () => get(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND title LIKE 'Kỳ vọng đầu ra%'`, f).n as number;
    assert(dem() === 1, `Case Tutor: ${dem()}`);
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE student_id = ? AND title LIKE 'Kỳ vọng đầu ra%'`).run(f);
    ck.capNhatCuoiKhoaSauChuyen(P.admin, get('SELECT id, student_id, class_id FROM assessment_attempts WHERE id = ?', af.id));
    assert(dem() === 1, `sửa điểm sau khi Case đã Hoàn thành tạo thêm Case: ${dem()}`);
  });

  check('S5F-a (7) · Case hạng mục ngoài ô chuẩn (Pre FOU "Tổng hợp") của em đang học FOU vẫn có dòng ở bảng kỹ năng', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 2 });
    const { sid, cyc } = hocVien(lop, 'FOU', false);
    const id = moCase(sid, cyc, 'tong_hop', null);
    const rows = casesSvc.skillSupportBoard(P.admin, sid, cyc).rows as any[];
    const r = rows.find((x) => x.category === 'tong_hop');
    assert(r && r.cases.some((c: any) => c.id === id) && rows.slice(0, 4).map((x) => x.category).join() === 'listening,reading,writing,speaking', rows.map((x) => x.category).join());
  });

  check('S5F-a (8) · panel Chuyển lớp đọc kỳ vọng đầu ra bằng chuHopKetLuan (không trường ketLuanFt.nhan không tồn tại)', () => {
    const src = fs.readFileSync(new URL('../../../../web/src/modules/classes/TransitionPanel.tsx', import.meta.url), 'utf8');
    assert(!/ketLuanFt\.nhan/.test(src) && /chuHopKetLuan\(/.test(src), 'TransitionPanel');
  });

  check('S5F-a (9) · Quản lý dời Cuối khoá sớm (tuần 6/8): tuần 8 (chặng "running") vẫn có dải Kết thúc khoá + việc "Chuyển lớp cả lớp"', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    conn.prepare('UPDATE classes SET final_week_override = 6 WHERE id = ?').run(lop);
    hocVien(lop, 'FOU', false);
    const pr = sched.classProgressMany([lop]).get(lop);
    assert(pr.phase === 'running', `chặng ${pr.phase}`);
    const x = dai.daiLop(P.mbManager, lop, { pr, ft: false, ct: 'FOU' });
    assert(x.ketThucKhoa?.soChuaLenh === 1 && x.ketThucKhoa.do === true, JSON.stringify(x.ketThucKhoa));
    const viec = (myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items.find((i: any) => i.key === `class:${lop}`);
    assert(viec?.group === 'placement', `việc: ${JSON.stringify(viec ?? null)}`);
  });

  check('S5F-a (10) · GVCN đề xuất chuyển em lớp thường ĐÃ HẾT KHOÁ → duyệt ra lệnh hướng cuối khoá (lên lớp), không "giữa khoá / chuyển lớp"', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(lop, GV[0], null, true);
    const e = hocVien(lop, 'FOU', false).sid;
    const yc = lenh.guiDeXuatChuyenLop(loadPrincipal(GV[0]), e, { toClassId: dich, lyDo: 'Phụ huynh xin lên lớp buổi tối' });
    lenh.apDungDeXuatChuyenLop(P.mbManager, { id: yc.id, hoc_vien_id: e, ly_do: 'Phụ huynh xin lên lớp buổi tối' }, { lopDichId: dich, tuan: THU_HAI });
    const l = lenhCua(e);
    assert(l.huong === 'len_lop' && l.boi_canh === 'cuoi-khoa' && l.lop_dich_id === dich, JSON.stringify(l));
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE id = ?`).run(l.id);   // không lẫn vào số đếm thi hành của khối sau
  });

  // ------------------------------------------------------------------ (11)–(13) sửa nhỏ
  const src = (duong: string) => fs.readFileSync(new URL(`../../../../${duong}`, import.meta.url), 'utf8');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrCt } = await import('../migrate/prCt.ts');
  const { studentProfile } = await import('../students/profile.ts');

  check('S5F-a (11) · cột "Web gợi ý" ghi HƯỚNG (Lên BE · Lên BE + bổ trợ · Quản lý cân nhắc · Học lại FOU), không "→ Pass"; hồ sơ lớp có dải Kết thúc khoá thì bỏ chip "cần xếp lớp tiếp"', () => {
    const h = (tyLe: number, truot: string[] = []) => d.goiYCuoiKhoa({ ct: 'FOU', tyLe, monTruot: truot }).nhanHuong;
    assert(h(0.8) === 'Lên BE' && h(0.65, ['reading']) === 'Lên BE + bổ trợ' && h(0.55, ['reading']) === 'Quản lý cân nhắc' && h(0.4) === 'Học lại FOU',
      [h(0.8), h(0.65, ['reading']), h(0.55, ['reading']), h(0.4)].join(' | '));
    assert(!/goiY\.nhanNgan/.test(src('web/src/modules/classes/TransitionPanel.tsx')), 'TransitionPanel không còn nhanNgan (→ Pass)');
    assert(/ketThucKhoa \? ds\.filter\(\(x\) => x\.key !== 'xep-lop'\)/.test(src('web/src/modules/classes/DauTrangLop.tsx')), 'DauTrangLop bỏ chip xep-lop khi có dải');
  });

  check('S5F-a (12) · migrate tạo bù chỉ mục thiếu · nguoiNhanCuaLop ≤ 3 câu cho cả lô · QL xác nhận thay theo hạn dòng CHƯA xác nhận · nút Xác nhận tắt khi nhận xét trống', () => {
    const m = new SqliteDb(':memory:');
    m.exec(src('server/src/schema.sql').replace(/\r\n/g, '\n'));
    m.exec('DROP INDEX ux_lenh_cho_hv');
    const a: string[] = []; migratePrCt(m, a);
    assert(a.some((x) => /tạo bù 1 chỉ mục/.test(x)) && m.prepare(`SELECT 1 FROM sqlite_master WHERE name = 'ux_lenh_cho_hv'`).get(), a.join(' | '));
    const lops = [lopMoi({ kind: 'BE' }), lopMoi({ kind: 'BE' }), lopMoi({ kind: 'BE' })];
    const n = demTruyVan(() => { lenh.nguoiNhanCuaLop(lops, [MB]); });
    assert(n <= 3, `${n} câu`);
    /* Lớp có GVCN: dòng A đã xác nhận (hạn cũ đã qua) + dòng B chưa xác nhận (còn hạn) → QL KHÔNG xác nhận thay. */
    const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const dich = lopMoi({ kind: 'BE' });
    ganGv(nguon, GV[0], null, true);
    const [x, y] = [hocVien(nguon, 'FOU', false).sid, hocVien(nguon, 'FOU', false).sid];
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(x, 'len_lop', dich), dongCua(y, 'len_lop', dich)] });
    conn.prepare(`UPDATE lenh_chuyen_lop SET han_gvcn = ?, xac_nhan_luc = ?, xac_nhan_boi = ? WHERE id = ?`).run(t.addDays(TODAY, -5), TODAY, GV[0], lenhCua(x).id);
    assert(bg.phieuBanGiao(P.mbManager, { lopNguonId: nguon }).nguoiXem.xacNhan === false, 'QL không được xác nhận thay khi dòng chưa xác nhận còn hạn');
    assert(/disabled=\{busy \|\| !nhap\.trim\(\)\}/.test(src('web/src/modules/classes/BanGiaoPanel.tsx')), 'nút Xác nhận bàn giao');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE lop_nguon_id = ?`).run(nguon);
  });

  check('S5F-a (13) · Cuối khoá sau chuyển: hồ sơ vẫn thấy %, thẻ Test gần nhất ghi %, tên Case giữ môn gốc, việc tiếp không nhồi mô tả PA, kết luận FT cần bài Cuối khoá, Trung tâm thiếu điểm → Case Tutor khi điểm về, Báo PH có GVCN', () => {
    /* Hồ sơ HV sau chuyển FOU → BE: vẫn thấy % Cuối khoá của lớp vừa rời. */
    const fou = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const be = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(be, GV[3], null, true);
    const { sid: e } = hocVien(fou, 'FOU', false);
    const aFou = cuoiKhoa(fou, e, [17, 16, 17, 16]);   // 66%
    lenh.raLenh(P.mbManager, { lopNguonId: fou, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(e, 'len_lop', be)] });
    daChuyen(e, THU_HAI);
    const hs = studentProfile(P.admin, e);
    assert(hs.cuoiKhoa?.daChuyen === true && Math.round((hs.cuoiKhoa.tyLe ?? 0) * 100) === 66, JSON.stringify(hs.cuoiKhoa));
    /* Thẻ "Kết quả Test gần nhất": Cuối khoá đủ điểm → %, không "n/4 môn đạt". */
    const kq = d.ketQuaTestGanNhat([{ id: 1, attemptNo: 2, kind: 'final', status: 'done', periodCode: null, weekStart: null, mode: 'ratio', scored: 4, required: 4, complete: true, overall: null, expectation: null, sosLevel: 2, tyLeTong: 0.66 }]);
    assert(kq?.phanTram === 66, JSON.stringify(kq));
    /* Tên Case giữ môn gốc: mốc đầu ở bài FOU (G+V), mốc sau ở bài Giữa khoá BE → vẫn "G+V". */
    const cyBe = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, e).id;
    const aBe = get(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND kind = 'progress'`, cyBe);
    assert(aBe, 'lộ trình BE có bài Giữa khoá mặc định');
    const cId = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, detected_at, created_at) VALUES (?,?, 'writing', 'writing', 'mock', 'in_progress', ?, ?)`)
      .run(e, cyBe, TODAY, new Date().toISOString()).lastInsertRowid);
    const moc = conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    moc.run(cId, 'opened', aFou.id, 1, TODAY, new Date().toISOString());
    moc.run(cId, 'repeat', aBe.id, 99, TODAY, new Date().toISOString());
    const ten = casesSvc.caseTitleOf({ id: cId, category: 'writing', topic: 'writing', origin_kind: 'mock', title: null });
    assert(/G\+V/.test(ten) && !/Writing/.test(ten), ten);
    /* Việc tiếp không nhồi mô tả dài của PA hệ thống. */
    assert(d.tenPaViecTiep('bo_tro_mien_phi', '1 buổi miễn phí (P) · 1 tuần · Mini Test sau buổi cuối · không tính phí học sinh') === 'Bổ trợ miễn phí'
      && d.tenPaViecTiep('tutor', 'Kèm 1-1 Reading') === 'Kèm 1-1 Reading', 'tenPaViecTiep');
    assert(/homNay >= mt\.ngayDuKien/.test(src('web/src/modules/students/KetLuanKhoa.tsx')), 'nút Ghi Mini Test chỉ từ ngày buổi cuối');

    /* ket-luan-ft: em BE chưa có bài Cuối khoá → 400, không chèn dòng Lộ trình tiếp theo. */
    const be2 = lopMoi({ kind: 'BE', tuanHienTai: 11 });
    const chua = hocVien(be2, 'BE', false).sid;
    assert(maLoi(() => ck.ghiKetLuanFt(P.mbManager, chua, { dat: true })) === 400 && !get('SELECT 1 FROM lo_trinh_tiep_theo WHERE student_id = ?', chua), 'chưa có bài Cuối khoá');
    /* Trung tâm + thiếu điểm lúc chuyển → Case Tutor tạo khi điểm về. */
    const ft = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 1 });
    const f = hocVien(be2, 'BE', false).sid;
    const af = cuoiKhoa(be2, f, [20, 12, 20, null]);
    ck.ghiKetLuanFt(P.mbManager, f, { dat: false, nguyenNhan: 'trung_tam', mon: ['reading'] });
    lenh.raLenh(P.mbManager, { lopNguonId: be2, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(f, 'fast_track', ft, { mucTieu: 6, khacGoiY: true, lyDo: 'Phụ huynh xin lên FT' })] });
    daChuyen(f, THU_HAI);
    const tutor = () => get(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND title LIKE 'Kỳ vọng đầu ra%'`, f).n as number;
    assert(tutor() === 0, 'chưa đủ điểm: chưa có Case Tutor');
    vaoNgay(t.addDays(THU_HAI, 7), () => reg.saveRegularScore(P.admin, af.id, 'speaking', { score: 20, total: 25 }));
    assert(tutor() === 1, `điểm về → Case Tutor: ${tutor()}`);

    /* Báo PH Giữa khoá: Quản lý xem "Tất cả" thấy GVCN lớp em đang học, không "chưa ai phụ trách". */
    reg.planRegularTests(P.admin, be, { studentIds: [e], kinds: ['progress'] });
    const aGk = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'progress' ORDER BY id DESC LIMIT 1`, e, be) ?? aBe;
    const bp = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?,?, 'bao_ph_tvv', 1, 'pending', ?)`)
      .run(aGk.id, e, new Date().toISOString()).lastInsertRowid);
    const viec = (myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items.find((i: any) => i.key === `baoph:${bp}`);
    assert(viec && viec.ownerId === GV[3] && viec.owner, `Báo PH: ${JSON.stringify(viec ?? null)}`);
  });
}
