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
    const n = demTruyVan(() => { kq2 = chay(THU_HAI); });
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
}
