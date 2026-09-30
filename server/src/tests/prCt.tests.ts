/** PHÉP KIỂM PR-CT — lệnh chuyển lớp do Quản lý quyết + bàn giao (đặc tả §3.1f Q30-1…Q30-4, kế hoạch 2026-09-30-pr-ct). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrCtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-CT · Chuyển lớp do Quản lý quyết + Bàn giao');

  // ------------------------------------------------------------------ khối 1 · luật thuần chuyenLop.ts
  const HOM_NAY = '2026-09-30';   // Thứ Tư; Thứ Hai tuần này = 2026-09-28
  const dong = (o: Record<string, unknown> = {}) => ({
    huong: 'len_lop', lopDichId: 5, lopDichFt: false, nguonFt: false, tuan: '2026-10-05', homNay: HOM_NAY,
    lyDo: null, khacGoiY: false, mucTieu: null, ngayXemLai: null, ...o,
  });

  check('CT (1a) · tuanChonDuoc từ Thứ Tư / Thứ Hai / Chủ nhật: không bao giờ ra tuần hiện tại, đủ 6 Thứ Hai liên tiếp', () => {
    for (const hn of ['2026-09-30', '2026-09-28', '2026-10-04']) {
      const ds: string[] = d.tuanChonDuoc(hn);
      assert(ds.length === 6, `${hn}: ${ds.length} tuần`);
      assert(ds[0] === '2026-10-05', `${hn}: tuần đầu ${ds[0]}`);
      assert(ds.every((x, i) => d.tuanHopLe(x, hn) && (i === 0 || Date.parse(x) - Date.parse(ds[i - 1]) === 7 * 86_400_000)), `${hn}: ${ds}`);
    }
    assert(d.tuanChonDuoc('2026-10-05', 2).join() === '2026-10-12,2026-10-19', 'n = 2 từ Thứ Hai');
  });
  check('CT (1b) · tuanHopLe: Thứ Hai tuần này / ngày không phải Thứ Hai / rỗng / sai dạng → false; Thứ Hai tuần sau → true', () => {
    assert(!d.tuanHopLe('2026-09-28', HOM_NAY), 'tuần hiện tại');
    assert(!d.tuanHopLe('2026-10-06', HOM_NAY), 'Thứ Ba');
    assert(!d.tuanHopLe(null, HOM_NAY) && !d.tuanHopLe('', HOM_NAY) && !d.tuanHopLe('05/10/2026', HOM_NAY), 'rỗng / sai dạng');
    assert(!d.tuanHopLe('2026-09-21', HOM_NAY), 'tuần đã qua');
    assert(d.tuanHopLe('2026-10-05', HOM_NAY), 'Thứ Hai tuần sau');
  });
  check('CT (1c) · hanBanGiao tính cả ngày ra lệnh: 30/09 → GVBM 01/10, GVCN 02/10', () => {
    const h = d.hanBanGiao('2026-09-30');
    assert(h.gvbm === '2026-10-01' && h.gvcn === '2026-10-02', JSON.stringify(h));
  });
  check('CT (1d) · coPhieu: mọi hướng trừ Dừng học · canLopDich: trừ Bảo lưu và Dừng học', () => {
    for (const h of d.HUONG_LENH) {
      assert(d.coPhieu(h) === (h !== 'dung_hoc'), `coPhieu ${h}`);
      assert(d.canLopDich(h) === (h !== 'dung_hoc' && h !== 'bao_luu'), `canLopDich ${h}`);
    }
  });
  check('CT (1e) · kiemDongLenh: dòng đủ → null; thiếu hướng → "Chọn hướng cho em"; thiếu lớp đích → "Chọn lớp đích"', () => {
    assert(d.kiemDongLenh(dong()) === null, 'dòng đủ');
    assert(d.kiemDongLenh(dong({ huong: null })) === 'Chọn hướng cho em', 'thiếu hướng');
    assert(d.kiemDongLenh(dong({ lopDichId: null })) === 'Chọn lớp đích', 'thiếu lớp đích');
    assert(d.kiemDongLenh(dong({ huong: 'bao_luu', lopDichId: null, lyDo: 'đi xa', ngayXemLai: '2026-11-02' })) === null, 'bảo lưu không cần lớp đích');
  });
  check('CT (1f) · kiemDongLenh: tuần hiện tại / trống / không phải Thứ Hai → "Tuần bắt đầu phải từ tuần sau trở đi"', () => {
    for (const tuan of ['2026-09-28', null, '2026-10-06']) {
      assert(d.kiemDongLenh(dong({ tuan })) === 'Tuần bắt đầu phải từ tuần sau trở đi', `tuần ${tuan}`);
    }
  });
  check('CT (1g) · kiemDongLenh: chọn khác gợi ý hoặc Chuyển lớp / Bảo lưu / Dừng học mà lý do < 3 ký tự → "Ghi lý do ngắn"', () => {
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: 'ab' })) === 'Ghi lý do ngắn', 'khác gợi ý');
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: '   ' })) === 'Ghi lý do ngắn', 'lý do toàn dấu cách');
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: 'abc' })) === null, 'đủ 3 ký tự');
    assert(d.kiemDongLenh(dong({ huong: 'chuyen_lop' })) === 'Ghi lý do ngắn', 'chuyển lớp');
    assert(d.kiemDongLenh(dong({ huong: 'dung_hoc', lopDichId: null })) === 'Ghi lý do ngắn', 'dừng học');
    assert(d.kiemDongLenh(dong()) === null, 'lên lớp theo gợi ý không cần lý do');
  });
  check('CT (1h) · kiemDongLenh: lên FT thiếu / sai Target → "Ghi Target (hoặc KCK)"; số hợp lệ và KCK qua; FT → FT không cần Target', () => {
    const ft = { huong: 'fast_track', lopDichFt: true };
    assert(d.kiemDongLenh(dong(ft)) === 'Ghi Target (hoặc KCK)', 'thiếu');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 9.5 })) === 'Ghi Target (hoặc KCK)', '9.5');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 6.3 })) === 'Ghi Target (hoặc KCK)', 'không bước .5');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 6 })) === null && d.kiemDongLenh(dong({ ...ft, mucTieu: 'KCK' })) === null, '6.0 và KCK');
    assert(d.kiemDongLenh(dong({ huong: 'chuyen_lop', lopDichFt: true, nguonFt: true, lyDo: 'gộp lớp' })) === null, 'FT → FT');
  });
  check('CT (1i) · kiemDongLenh: bảo lưu thiếu tuần xem lại → "Chọn tuần xem lại"', () => {
    assert(d.kiemDongLenh(dong({ huong: 'bao_luu', lopDichId: null, lyDo: 'đi xa' })) === 'Chọn tuần xem lại', 'thiếu tuần xem lại');
  });
  check('CT (1j) · Q30-4: kiemDongLenh không có nhánh "thiếu điểm Cuối khoá" — dòng cùng dữ liệu vẫn null (mọi tham số đều không nhắc điểm)', () => {
    assert(d.kiemDongLenh(dong()) === null, 'em thiếu điểm P vẫn chuyển được');
    assert(!/điểm/i.test(String(d.kiemDongLenh(dong({ huong: null })))), 'câu lỗi không nói điểm');
  });
  check('CT (1k) · tomTatLenh: đúng 5 câu mockup C — 4 lên BE · 1 lên FT · 1 học lại · 1 bảo lưu · "Chưa gửi"', () => {
    const cau: string[] = d.tomTatLenh([
      { ten: 'Vũ Gia An', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Ngô Minh Huy', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05', ghiChu: 'có PA bổ trợ miễn phí P, 2 buổi, và Mini Test' },
      { ten: 'Lê Hải Mai', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Trịnh Đức Long', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Đỗ Bảo Linh', huong: 'fast_track', lopDich: 'MB FT 105 · LT1', tuan: '2026-10-05', mucTieu: 6 },
      { ten: 'Hoàng Khánh Vy', huong: 'hoc_lai', lopDich: 'MB FOU 14', tuan: '2026-10-12' },
      { ten: 'Phan Quang Nam', huong: 'bao_luu', tuan: '2026-10-05', ngayXemLai: '2026-10-26' },
      { ten: 'Bùi Thu Trang', huong: null },
    ], HOM_NAY);
    assert(cau.length === 5, `${cau.length} câu: ${cau.join(' | ')}`);
    assert(cau[0].startsWith('4 em lên MB BE 04 từ W2 OCT (Vũ Gia An, Ngô Minh Huy, Lê Hải Mai, Trịnh Đức Long).'), cau[0]);
    assert(cau[0].includes('Ngô Minh Huy có PA bổ trợ miễn phí P'), cau[0]);
    assert(cau[1] === '1 em lên Fast Track MB FT 105 · LT1 từ W2 OCT (Đỗ Bảo Linh, target 6).', cau[1]);
    assert(cau[2] === '1 em học lại MB FOU 14 từ W3 OCT (Hoàng Khánh Vy).', cau[2]);
    assert(cau[3] === '1 em bảo lưu, xem lại W5 OCT (Phan Quang Nam).', cau[3]);
    assert(cau[4] === 'Chưa gửi: Bùi Thu Trang (chưa quyết).', cau[4]);
  });
  check('CT (1l) · tomTatLenh: cùng lớp đích khác tuần tách hai câu; danh sách rỗng → không câu nào', () => {
    const cau: string[] = d.tomTatLenh([
      { ten: 'A', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'B', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-12' },
    ], HOM_NAY);
    assert(cau.length === 2 && cau[0].includes('W2 OCT') && cau[1].includes('W3 OCT'), cau.join(' | '));
    assert(d.tomTatLenh([], HOM_NAY).length === 0, 'rỗng');
  });
  check('CT (1m) · trangThaiPhieu: Đã xác nhận · Môn a/m · Chưa làm', () => {
    assert(d.trangThaiPhieu({ soMonDaGhi: 4, soMon: 4, daXacNhan: true }).nhan === 'Đã xác nhận', 'đã xác nhận (kể cả đủ môn)');
    const mon = d.trangThaiPhieu({ soMonDaGhi: 3, soMon: 4, daXacNhan: false });
    assert(mon.khoa === 'mon' && mon.nhan === 'Môn 3/4', JSON.stringify(mon));
    const chua = d.trangThaiPhieu({ soMonDaGhi: 0, soMon: 4, daXacNhan: false });
    assert(chua.khoa === 'chua-lam' && chua.nhan === 'Chưa làm', JSON.stringify(chua));
  });

  // ------------------------------------------------------------------ khối 2 · migrate cấu trúc (Task 2)
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrCt } = await import('../migrate/prCt.ts');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
  const cot = (db: any, bang: string) => (db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`);
  /** DB thời trước PR-CT: chữ schema.sql cắt từ khối chú thích của PR-CT (luôn nằm CUỐI file) trở đi. */
  const truocCt = () => {
    const i = SCHEMA.indexOf('/*\n * LỆNH CHUYỂN LỚP + BÀN GIAO (PR-CT');
    if (i < 0) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm CT (2)');
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA.slice(0, i));
    return m;
  };

  check('CT (2a) · migrate chạy lặp được: lần một tạo 2 bảng, lần hai không báo gì; DB dựng từ schema.sql không bị đổi', () => {
    const m = truocCt();
    const a: string[] = []; migratePrCt(m, a);
    const b: string[] = []; migratePrCt(m, b);
    assert(a.length === 2 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const c: string[] = []; migratePrCt(t.conn, c);
    assert(c.length === 0, `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
  });
  check('CT (2b) · DB migrate có cột GIỐNG HỆT DB dựng từ schema.sql (tên, kiểu, NOT NULL, thứ tự) và cùng chỉ mục', () => {
    const m = truocCt();
    migratePrCt(m, []);
    const moi = new SqliteDb(':memory:');
    moi.exec(SCHEMA);
    for (const b of ['lenh_chuyen_lop', 'ban_giao_mon']) {
      assert(JSON.stringify(cot(m, b)) === JSON.stringify(cot(moi, b)), `${b}:\n  ${cot(m, b).join(',')}\n  ${cot(moi, b).join(',')}`);
    }
    const chiMuc = (db: any) => (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'lenh_chuyen_lop' AND name LIKE '%lenh%' ORDER BY name`).all() as any[]).map((x) => x.name).join();
    assert(chiMuc(m) === chiMuc(moi) && chiMuc(m).includes('ux_lenh_cho_hv'), `${chiMuc(m)} ‖ ${chiMuc(moi)}`);
  });
  check('CT (2c) · chỉ mục chặn lệnh "cho" thứ hai của cùng em (lệnh đã chuyển / huỷ thì không chặn) · UNIQUE (lệnh, môn) chặn dòng môn thứ hai', () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec('PRAGMA foreign_keys = OFF');
    const lenh = (tt: string) => m.prepare(
      `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
       VALUES (1, 1, 'bao_luu', 'cuoi-khoa', '2026-10-05', 1, '2026-09-30', ?, '2026-09-30')`).run(tt);
    const loi = (fn: () => void) => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };
    lenh('huy'); lenh('da_chuyen'); lenh('cho');
    assert(/UNIQUE/i.test(loi(() => lenh('cho'))), 'lệnh cho thứ hai phải bị chặn');
    const mon = () => m.prepare(`INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, ghi_luc) VALUES (3, 'reading', 'x', 1, '2026-09-30')`).run();
    mon();
    assert(/UNIQUE/i.test(loi(mon)), 'dòng môn thứ hai của cùng lệnh phải bị chặn');
  });
  check('CT (2d) · nhãn nhật ký tiếng Việt cho 6 mã mới', () => {
    for (const ma of ['lenh_chuyen.tao', 'lenh_chuyen.sua', 'lenh_chuyen.huy', 'lenh_chuyen.thi_hanh', 'ban_giao.ghi_mon', 'ban_giao.xac_nhan']) {
      assert(d.nhanHanhDongNhatKy(ma) !== 'Thao tác hệ thống', `thiếu nhãn ${ma}`);
    }
  });

  // ------------------------------------------------------------------ dựng dữ liệu dùng chung cho các khối máy chủ
  const { TODAY, P, conn, checkAsync } = t;
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const intake: any = await import('../classes/intake.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const transitionSvc: any = await import('../classes/transition.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const CP = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const TUAN = d.tuanChonDuoc(TODAY) as string[];   // các Thứ Hai hợp lệ: TUAN[0] = tuần sau
  const mondayNow = d.mondayOfDate(TODAY) as string;
  let seq = 0;
  const week: any = await import('../platform/week.ts');
  const lopMoi = (o: { branchId?: number; kind: string; ft?: boolean; route?: string | null; tuanHienTai?: number }) => {
    seq += 1;
    const cn = (get('SELECT code FROM branches WHERE id = ?', o.branchId ?? MB)).code as string;
    const bat = o.tuanHienTai !== undefined ? d.mondayOfDate(t.addDays(TODAY, -7 * (o.tuanHienTai - 1))) : TODAY;
    return (intake.createClass(P.admin, {
      code: `${cn}-CT${seq}`, branchId: o.branchId ?? MB, kind: o.kind, isFastTrack: !!o.ft, route: o.route ?? null,
      startDate: bat, startPeriodId: o.tuanHienTai !== undefined ? week.ensurePeriod(bat).id : undefined,
    }) as any).id as number;
  };
  const ganGv = (lop: number, userId: number, skill: string | null, core: boolean) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, lop, skill, core ? 1 : 0, new Date().toISOString());
  const hocVien = (lop: number, ma: string | null, ft: boolean, target: number | null = null) => {
    seq += 1;
    const now = new Date().toISOString();
    const cn = get('SELECT branch_id FROM classes WHERE id = ?', lop).branch_id;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-CT${seq}`, `Hoc vien CT${seq}`, `hoc vien ct${seq}`, cn, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`)
      .run(sid, ft ? 'LT1' : null, ma, target, TODAY, now).lastInsertRowid);
    return { sid, cyc };
  };
  const dongCua = (sid: number, huong: string, toClassId: number | null, o: Record<string, unknown> = {}) => ({ studentId: sid, huong, toClassId, tuan: TUAN[0], ...o });
  const lenhCua = (sid: number) => get(`SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, sid);
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };

  /** Máy chủ thật + phiên demo theo người dùng — phép kiểm quyền đi qua đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { await fn(goi); } finally { may.close(); }
  }

  // ------------------------------------------------------------------ khối 3 · ra / sửa / huỷ lệnh + đổi quyền (Task 3)
  console.log('\nPR-CT · Ra / sửa / huỷ lệnh chuyển lớp (chỉ Quản lý lớp nguồn)');
  const nguon = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
  const beDich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
  const fouLai = lopMoi({ kind: 'FOU', tuanHienTai: 1 });
  const ftDich = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 3 });
  const gvcnNguon = ganGv(nguon, P.normalCoreTeacher.userId, null, true) && loadPrincipal(P.normalCoreTeacher.userId);
  ganGv(beDich, P.normalSubjectTeacher.userId, null, true);
  const em = Array.from({ length: 8 }, () => hocVien(nguon, 'FOU', false).sid);
  const dongsMau = [
    ...em.slice(0, 4).map((s) => dongCua(s, 'len_lop', beDich)),
    dongCua(em[4], 'fast_track', ftDich, { mucTieu: 'KCK', ngayThi: '2027-06' }),
    dongCua(em[5], 'hoc_lai', fouLai, { tuan: TUAN[1] }),
    dongCua(em[6], 'bao_luu', null, { lyDo: 'đi xa', ngayXemLai: TUAN[3] }),
  ];   // em[7] "Chưa chọn": không gửi

  check('CT (3a) · QL ra lệnh cho 8 em → 7 dòng, đủ hướng; em chưa chọn không có lệnh; hạn bàn giao đúng; KCK ghi khong_cam_ket', () => {
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: dongsMau });
    assert(r.ok.length === 7 && r.failed.length === 0, JSON.stringify(r));
    assert(!lenhCua(em[7]), 'em chưa chọn không có lệnh');
    const l = lenhCua(em[0]);
    const h = d.hanBanGiao(TODAY);
    assert(l.trang_thai === 'cho' && l.tuan_bat_dau === TUAN[0] && l.han_gvbm === h.gvbm && l.han_gvcn === h.gvcn && l.nguoi_ra_lenh === P.mbManager.userId, JSON.stringify(l));
    const kck = lenhCua(em[4]);
    assert(kck.khong_cam_ket === 1 && kck.muc_tieu === null && kck.ngay_thi === '2027-06', JSON.stringify(kck));
    const bl = lenhCua(em[6]);
    assert(bl.lop_dich_id === null && bl.ngay_xem_lai === TUAN[3] && bl.han_gvcn, JSON.stringify(bl));
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'lenh_chuyen.tao' AND entity_id = ?`, nguon).n === 1, 'một dòng nhật ký cho cả lô');
  });
  check('CT (3b) · Q30-4: em thiếu điểm Cuối khoá vẫn có lệnh (không dòng nào bị khoá vì điểm) — cả 7 em đều chưa có điểm nào', () => {
    assert(get(`SELECT COUNT(*) n FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id WHERE a.student_id IN (${em.join(',')})`).n === 0, 'dữ liệu: chưa em nào có điểm');
    assert(get(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE lop_nguon_id = ?`, nguon).n === 7, 'đủ 7 lệnh');
  });
  check('CT (3c) · ra lại cho em có lệnh → SỬA lệnh cũ (không dòng thứ hai, giữ hạn bàn giao cũ), nhật ký "sửa"', () => {
    const truoc = lenhCua(em[0]);
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(em[0], 'hoc_lai', fouLai, { tuan: TUAN[2] })] });
    assert(r.ok.length === 1, JSON.stringify(r));
    assert(get(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id = ?`, em[0]).n === 1, 'vẫn một lệnh');
    const sau = lenhCua(em[0]);
    assert(sau.id === truoc.id && sau.huong === 'hoc_lai' && sau.lop_dich_id === fouLai && sau.tuan_bat_dau === TUAN[2] && sau.han_gvcn === truoc.han_gvcn && sau.sua_luc, JSON.stringify(sau));
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'lenh_chuyen.sua' AND entity_id = ?`, nguon).n === 1, 'nhật ký sửa');
  });
  check('CT (3d) · dòng sai vào failed, dòng đúng vẫn ghi: tuần hiện tại · thiếu lớp đích · lớp đích sai chương trình · lên FT thiếu Target · em không thuộc lớp', () => {
    const lo = hocVien(nguon, 'FOU', false).sid;
    const ngoai = hocVien(fouLai, 'FOU', false).sid;
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [
      dongCua(em[1], 'len_lop', beDich, { tuan: mondayNow }),
      dongCua(em[2], 'len_lop', null),
      dongCua(em[3], 'len_lop', fouLai),
      dongCua(em[5], 'fast_track', ftDich),
      dongCua(ngoai, 'len_lop', beDich),
      dongCua(lo, 'len_lop', beDich),
    ] });
    const msg = (s: number) => r.failed.find((x: any) => x.studentId === s)?.message ?? '';
    assert(r.ok.length === 1 && r.ok[0] === lo, JSON.stringify(r));
    assert(/từ tuần sau trở đi/.test(msg(em[1])) && msg(em[2]) === 'Chọn lớp đích' && /chương trình kế tiếp/.test(msg(em[3]))
      && /Target/.test(msg(em[5])) && /không thuộc lớp/.test(msg(ngoai)), JSON.stringify(r.failed));
    assert(lenhCua(em[1]).tuan_bat_dau === TUAN[0], 'lệnh cũ của dòng sai giữ nguyên');
  });
  check('CT (3e) · 403: GVCN lớp nguồn · GVBM · QL chi nhánh khác · QL chi nhánh ĐÍCH đều không ra / sửa / huỷ được lệnh', () => {
    const gvbm = loadPrincipal(P.subjectTeacher.userId);
    ganGv(nguon, gvbm.userId, 'listening', false);
    const gvbm2 = loadPrincipal(P.subjectTeacher.userId);
    const cpDich = lopMoi({ branchId: CP, kind: 'BE', tuanHienTai: 1 });
    const l = lenhCua(em[1]);
    for (const [ten, who] of [['GVCN', gvcnNguon], ['GVBM', gvbm2], ['QL chi nhánh khác/đích', P.cpManager]] as const) {
      assert(maLoi(() => lenh.raLenh(who, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(em[1], 'len_lop', beDich)] })) === 403, `${ten} ra lệnh phải 403`);
      assert(maLoi(() => lenh.suaLenh(who, l.id, { tuan: TUAN[2] })) === 403, `${ten} sửa lệnh phải 403`);
      assert(maLoi(() => lenh.huyLenh(who, l.id, 'thử huỷ')) === 403, `${ten} huỷ lệnh phải 403`);
    }
    /* QL chi nhánh đích (CP) ra lệnh từ lớp nguồn MB cho lớp đích CP: vẫn 403 — quyền theo lớp NGUỒN. */
    assert(maLoi(() => lenh.raLenh(P.cpManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(em[1], 'len_lop', cpDich)] })) === 403, 'QL chi nhánh đích phải 403');
    assert(maLoi(() => studentsSvc.transferStudent(gvcnNguon, em[1], beDich, TODAY, 'Đổi lịch học', { noNote: true })) === 403, 'transferStudent bởi GVCN phải 403');
    assert(maLoi(() => transitionSvc.applyTransition(gvcnNguon, { fromClassId: nguon, effectiveDate: TODAY, dongs: [] })) === 403, 'applyTransition bởi GVCN phải 403');
    assert(maLoi(() => luatLoTrinh.lopDichChoChuyen(gvcnNguon, em[1])) === 403 && maLoi(() => luatLoTrinh.xemChuyenLop(gvcnNguon, em[1])) === 403, 'GVCN mở panel chuyển lớp một em phải 403');
    assert(!luatLoTrinh.coTheChuyenLop(gvcnNguon, em[1]) && !!luatLoTrinh.coTheChuyenLop(P.mbManager, em[1]), 'coTheChuyenLop: QL có, GVCN không');
  });
  check('CT (3f) · sửa / huỷ đúng luật: huỷ cần lý do ≥ 3 ký tự; huỷ xong → em có thể có lệnh mới; huỷ hai lần → 409; sau tuần bắt đầu → 400', () => {
    const l = lenhCua(em[2]);
    assert(maLoi(() => lenh.huyLenh(P.mbManager, l.id, 'ab')) === 400, 'lý do ngắn');
    lenh.huyLenh(P.mbManager, l.id, 'Phụ huynh xin ở lại');
    const sau = lenhCua(em[2]);
    assert(sau.trang_thai === 'huy' && sau.huy_boi === P.mbManager.userId && sau.ly_do_huy === 'Phụ huynh xin ở lại', JSON.stringify(sau));
    assert(maLoi(() => lenh.huyLenh(P.mbManager, l.id, 'huỷ lần hai')) === 409, 'huỷ hai lần phải 409');
    assert(maLoi(() => lenh.suaLenh(P.mbManager, l.id, { tuan: TUAN[2] })) === 409, 'sửa lệnh đã huỷ phải 409');
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(em[2], 'len_lop', beDich)] });
    assert(r.ok.length === 1 && lenhCua(em[2]).trang_thai === 'cho', 'sau huỷ ra lệnh mới được (chỉ mục chỉ chặn lệnh "cho")');
    /* tuần bắt đầu đã tới (đặt lại bằng SQL) → không sửa / huỷ được, ra lại cũng bị chặn */
    const den = lenhCua(em[3]);
    conn.prepare('UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE id = ?').run(mondayNow, den.id);
    assert(maLoi(() => lenh.suaLenh(P.mbManager, den.id, { lyDo: 'đổi ý' })) === 400, 'sửa sau tuần bắt đầu phải 400');
    assert(maLoi(() => lenh.huyLenh(P.mbManager, den.id, 'muộn rồi')) === 400, 'huỷ sau tuần bắt đầu phải 400');
    conn.prepare('UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE id = ?').run(TUAN[0], den.id);
  });
  check('CT (3g) · suaLenh đổi được tuần / lớp đích / lý do và giữ phần còn lại; sai thì báo lỗi rõ', () => {
    const l = lenhCua(em[3]);
    lenh.suaLenh(P.mbManager, l.id, { tuan: TUAN[2], huong: 'len_lop', toClassId: beDich });
    const sau = lenhCua(em[3]);
    assert(sau.tuan_bat_dau === TUAN[2] && sau.lop_dich_id === beDich && sau.huong === 'len_lop', JSON.stringify(sau));
    assert(maLoi(() => lenh.suaLenh(P.mbManager, l.id, { tuan: mondayNow })) === 400, 'sửa sang tuần hiện tại phải 400');
    assert(lenhCua(em[3]).tuan_bat_dau === TUAN[2], 'lỗi thì không đổi gì');
  });
  check('CT (3h) · thông báo "Sắp nhận": MỘT thông báo mỗi lớp đích cho GVCN lớp đích; ra lệnh thêm cùng ngày chỉ cập nhật số, không nhân đôi', () => {
    const gvcnDich = P.normalSubjectTeacher.userId;
    const dem = () => get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'sap_nhan' AND entity_id = ?`, gvcnDich, beDich).n;
    assert(dem() === 1, `GVCN lớp đích phải có đúng 1 thông báo: ${dem()}`);
    const them = hocVien(nguon, 'FOU', false).sid;
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [dongCua(them, 'len_lop', beDich)] });
    assert(dem() === 1, `vẫn 1 thông báo sau khi thêm em: ${dem()}`);
    const tb = get(`SELECT title, duong FROM notifications WHERE user_id = ? AND kind = 'sap_nhan' AND entity_id = ?`, gvcnDich, beDich);
    assert(/Sắp nhận \d+ em/.test(tb.title) && tb.duong === `/hoc-vien/lop/${beDich}`, JSON.stringify(tb));
  });
  check('CT (3i) · transitionPlan trả thêm lenh, cheDo, tuanChon, tuanCuoiKhoa, tuanKetThuc; canEdit theo lớp nguồn; lớp FT: cheDo "ft" + lớp đích FT mọi lộ trình', () => {
    const plan = transitionSvc.transitionPlan(P.mbManager, nguon);
    const s0 = plan.students.find((x: any) => x.id === em[0]);
    assert(plan.cheDo === 'thuong' && plan.canEdit === true && plan.tuanChon[0] === TUAN[0] && plan.tuanChon.length === 6, JSON.stringify({ c: plan.cheDo, e: plan.canEdit, t: plan.tuanChon }));
    assert(s0.lenh?.huong === 'hoc_lai' && s0.lenh.tuan === TUAN[2] && s0.lenh.lopDichId === fouLai, JSON.stringify(s0.lenh));
    assert(plan.students.find((x: any) => x.id === em[7]).lenh === null, 'em chưa quyết: lenh null');
    assert(plan.tuanKetThuc && plan.tuanCuoiKhoa && plan.tuanKetThuc >= plan.tuanCuoiKhoa, `${plan.tuanKetThuc} / ${plan.tuanCuoiKhoa}`);
    const kck = plan.students.find((x: any) => x.id === em[4]).lenh;
    assert(kck.mucTieu === 'KCK', JSON.stringify(kck));
    const ft2 = lopMoi({ kind: 'FT', ft: true, route: 'LT2', tuanHienTai: 5 });
    const planFt = transitionSvc.transitionPlan(P.mbManager, ftDich);
    assert(planFt.cheDo === 'ft' && planFt.candidates.some((c: any) => c.id === ft2 && c.route === 'LT2'), 'lớp FT: lớp đích gồm cả lộ trình khác');
    assert(transitionSvc.transitionPlan(gvcnNguon, nguon).canEdit === false, 'GVCN: canEdit false');
  });
  await checkAsync('CT (3j) · qua HTTP: GVCN / GVBM gọi POST /classes/:id/transition · POST /students/:id/transfer · PATCH /lenh-chuyen/:id · huỷ → 403; QL ra lệnh 200 và POST transfer một em thành lệnh (chưa chuyển)', async () => {
    const l = lenhCua(em[3]);
    const gvbm = P.subjectTeacher.userId;
    await voiMayChu(async (goi) => {
      for (const uid of [P.normalCoreTeacher.userId, gvbm]) {
        const a = await goi(uid, `/classes/${nguon}/transition`, { method: 'POST', body: JSON.stringify({ dongs: [dongCua(em[3], 'len_lop', beDich)] }) });
        const b = await goi(uid, `/students/${em[3]}/transfer`, { method: 'POST', body: JSON.stringify({ toClassId: beDich, reasonCode: 'khac', reasonNote: 'thử nghiệm' }) });
        const c = await goi(uid, `/lenh-chuyen/${l.id}`, { method: 'PATCH', body: JSON.stringify({ tuan: TUAN[2] }) });
        const h = await goi(uid, `/lenh-chuyen/${l.id}/huy`, { method: 'POST', body: JSON.stringify({ lyDo: 'thử huỷ' }) });
        assert([a, b, c, h].every((r) => r.status === 403), `user ${uid}: ${[a, b, c, h].map((r) => r.status).join('/')}`);
      }
      const tuoi = hocVien(nguon, 'FOU', false).sid;
      const ok = await goi(P.mbManager.userId, `/classes/${nguon}/transition`, { method: 'POST', body: JSON.stringify({ tuanChung: TUAN[1], dongs: [{ studentId: tuoi, huong: 'len_lop', toClassId: beDich }] }) });
      const j: any = await ok.json();
      assert(ok.status === 200 && j.ok?.[0] === tuoi && lenhCua(tuoi).tuan_bat_dau === TUAN[1], `${ok.status} ${JSON.stringify(j)}`);
      const mot = hocVien(nguon, 'FOU', false).sid;
      const tf = await goi(P.mbManager.userId, `/students/${mot}/transfer`, { method: 'POST', body: JSON.stringify({ toClassId: fouLai, tuan: TUAN[0], reasonCode: 'khac', reasonNote: 'đổi lịch học' }) });
      assert(tf.status === 200 && lenhCua(mot).trang_thai === 'cho', `transfer QL: ${tf.status}`);
      assert(get('SELECT class_id FROM enrollments WHERE student_id = ? AND status = ?', mot, 'active').class_id === nguon, 'transfer chỉ RA LỆNH, em vẫn ở lớp nguồn');
    });
  });
  // ------------------------------------------------------------------ khối 4 · thi hành đúng Thứ Hai tuần bắt đầu (Task 4)
  console.log('\nPR-CT · Thi hành lệnh đúng Thứ Hai tuần bắt đầu (cron + quét khi đọc, chạy lặp an toàn)');
  /* Dọn lệnh còn chờ của khối 3 để số đếm của khối này chỉ tính lệnh do chính nó dựng. */
  conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE trang_thai = 'cho'`).run();
  const THU_HAI = TUAN[0];
  const THU_TU = t.addDays(THU_HAI, 2);
  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  /** Giả lập "hôm nay = ngày chạy": luật cũ (vd. Kết thúc học) cấm ngày hiệu lực sau hôm nay của bộ demo. */
  const chay = (ngay: string) => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', ngay);
    try { return lenh.thiHanhLenhDenHan(ngay); } finally { setConfig('demo_date', cu); }
  };
  const enrHienTai = (sid: number) => get(`SELECT * FROM enrollments WHERE student_id = ? AND status = 'active'`, sid);
  const chuKyHienTai = (sid: number) => get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const ra = (who: any, lop: number, boiCanh: 'cuoi-khoa' | 'giua-khoa', dongs: any[]) => {
    const r = lenh.raLenh(who, { lopNguonId: lop, boiCanh, tuanChung: null, dongs });
    assert(!r.failed.length, `ra lệnh: ${JSON.stringify(r.failed)}`);
  };

  const nA = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
  const dA = lopMoi({ kind: 'BE', tuanHienTai: 1 });
  const [a1, a2] = [hocVien(nA, 'FOU', false).sid, hocVien(nA, 'FOU', false).sid];
  ra(P.mbManager, nA, 'cuoi-khoa', [dongCua(a1, 'len_lop', dA), dongCua(a2, 'len_lop', dA)]);

  check('CT (4a) · chưa tới tuần bắt đầu → không làm gì và KHÔNG mở giao dịch (chỉ một câu đọc)', () => {
    let kq: any;
    const n = demTruyVan(() => { kq = lenh.thiHanhLenhDenHan(TODAY); });
    assert(kq.daChuyen === 0 && kq.huy === 0 && kq.loi === 0, JSON.stringify(kq));
    assert(n === 1, `phải đúng 1 câu đọc, được ${n}`);
    assert(lenhCua(a1).trang_thai === 'cho' && enrHienTai(a1).class_id === nA, 'em vẫn ở lớp nguồn');
  });
  check('CT (4b) · tới Thứ Hai → chuyển, lệnh da_chuyen, ngày ghi danh lớp mới = Thứ Hai (M-08: hạn Ý thức đặt lại từ ngày này)', () => {
    const kq = chay(THU_HAI);
    assert(kq.daChuyen === 2 && kq.huy === 0 && kq.loi === 0, JSON.stringify(kq));
    const l = lenhCua(a1);
    assert(l.trang_thai === 'da_chuyen' && l.thi_hanh_luc && l.loi === null, JSON.stringify(l));
    assert(enrHienTai(a1).class_id === dA && enrHienTai(a1).started_at === THU_HAI, JSON.stringify(enrHienTai(a1)));
    assert(get(`SELECT ended_at, end_kind FROM enrollments WHERE student_id = ? AND class_id = ?`, a1, nA).ended_at === THU_HAI, 'ghi danh cũ đóng vào Thứ Hai');
    assert(get(`SELECT status FROM classes WHERE id = ?`, nA).status === 'finished', 'lớp hết khoá không còn em → kết thúc (dongLopNeuHet)');
    assert(get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'lenh_chuyen.thi_hanh' AND entity_id = ?`, nA).n === 1, 'một dòng nhật ký thi hành');
  });
  check('CT (4c) · gọi HAI lần liền → lần hai không làm gì (0 kết quả, một câu đọc, không chuyển đôi)', () => {
    let kq: any;
    const n = demTruyVan(() => { kq = lenh.thiHanhLenhDenHan(THU_HAI); });   // không có việc → không đụng ngày demo, không mở giao dịch
    assert(kq.daChuyen === 0 && kq.huy === 0 && kq.loi === 0 && n === 1, `${JSON.stringify(kq)} · ${n} câu`);
    assert(get(`SELECT COUNT(*) n FROM enrollments WHERE student_id = ? AND class_id = ?`, a1, dA).n === 1, 'không nhân đôi ghi danh');
  });
  check('CT (4d) · quét muộn (Thứ Tư) → ngày hiệu lực VẪN là Thứ Hai của lệnh', () => {
    const nB = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const b1 = hocVien(nB, 'FOU', false).sid;
    ra(P.mbManager, nB, 'cuoi-khoa', [dongCua(b1, 'hoc_lai', lopMoi({ kind: 'FOU', tuanHienTai: 1 }))]);
    const kq = chay(THU_TU);
    assert(kq.daChuyen === 1, JSON.stringify(kq));
    assert(enrHienTai(b1).started_at === THU_HAI, `started_at ${enrHienTai(b1).started_at}`);
  });
  check('CT (4e) · em đã Kết thúc học trước khi thi hành → lệnh "huy" (lý do hệ thống), báo người ra lệnh; em khác cùng nhóm vẫn chuyển', () => {
    const nC = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dC = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const [c1, c2] = [hocVien(nC, 'FOU', false).sid, hocVien(nC, 'FOU', false).sid];
    ra(P.mbManager, nC, 'cuoi-khoa', [dongCua(c1, 'len_lop', dC), dongCua(c2, 'len_lop', dC)]);
    conn.prepare(`UPDATE enrollments SET status = 'completed', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(TODAY, c1);
    const kq = chay(THU_HAI);
    assert(kq.huy === 1 && kq.daChuyen === 1, JSON.stringify(kq));
    const l = lenhCua(c1);
    assert(l.trang_thai === 'huy' && /không còn học lớp nguồn/.test(l.ly_do_huy) && enrHienTai(c2).class_id === dC, JSON.stringify(l));
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, P.mbManager.userId, `lenh_huy:${l.id}`).n === 1, 'người ra lệnh được báo');
  });
  check('CT (4f) · lớp đích bị kết thúc trước Thứ Hai → lệnh giữ "cho" + ghi lỗi, em khác cùng nhóm vẫn chuyển; quét lại không sập', () => {
    const nD = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dOk = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const dHong = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const [e1, e2] = [hocVien(nD, 'FOU', false).sid, hocVien(nD, 'FOU', false).sid];
    ra(P.mbManager, nD, 'cuoi-khoa', [dongCua(e1, 'len_lop', dHong), dongCua(e2, 'len_lop', dOk)]);
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(dHong);
    const kq = chay(THU_HAI);
    assert(kq.daChuyen === 1 && kq.loi === 0, JSON.stringify(kq));
    const l = lenhCua(e1);
    assert(l.trang_thai === 'cho' && /Lớp đích không hợp lệ/.test(l.loi) && enrHienTai(e1).class_id === nD, JSON.stringify(l));
    assert(enrHienTai(e2).class_id === dOk, 'em cùng nhóm vẫn chuyển');
    assert(chay(THU_HAI).daChuyen === 0 && lenhCua(e1).trang_thai === 'cho', 'quét lại: vẫn lỗi, không mất lệnh');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, P.mbManager.userId, `lenh_loi:${l.id}`).n === 1, 'người ra lệnh được báo, một lần');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE id = ?`).run(l.id);
  });

  const nE = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
  const dBe = lopMoi({ kind: 'BE', tuanHienTai: 1 });
  const dLai = lopMoi({ kind: 'FOU', tuanHienTai: 1 });
  const dFt = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 2 });
  const s8 = Array.from({ length: 8 }, () => hocVien(nE, 'FOU', false).sid);
  check('CT (4g) · lớp thường 8 em cuối khoá (lên BE · lên FT có MT1–MT3 · KCK · học lại · bảo lưu · dừng) → đúng luật cũ; em thiếu điểm Cuối khoá vẫn chuyển (Q30-4)', () => {
    ra(P.mbManager, nE, 'cuoi-khoa', [
      dongCua(s8[0], 'len_lop', dBe), dongCua(s8[1], 'len_lop', dBe), dongCua(s8[2], 'len_lop', dBe),
      dongCua(s8[3], 'fast_track', dFt, { mucTieu: 6.5, ngayThi: '2027-03' }), dongCua(s8[4], 'fast_track', dFt, { mucTieu: 'KCK' }),
      dongCua(s8[5], 'hoc_lai', dLai, { tuan: TUAN[1] }),
      dongCua(s8[6], 'bao_luu', null, { lyDo: 'đi du lịch', ngayXemLai: TUAN[4] }),
      dongCua(s8[7], 'dung_hoc', null, { lyDo: 'chuyển nhà' }),
    ]);
    const kq = chay(THU_HAI);
    assert(kq.daChuyen === 7 && kq.loi === 0, `Thứ Hai đầu chuyển 7 em (em học lại từ tuần sau): ${JSON.stringify(kq)}`);
    for (const i of [0, 1, 2]) assert(enrHienTai(s8[i]).class_id === dBe && chuKyHienTai(s8[i]).programme_code === 'BE', `em ${i} lên BE`);
    const ft = chuKyHienTai(s8[3]);
    assert(enrHienTai(s8[3]).class_id === dFt && ft.route === 'LT1' && ft.target_score === 6.5 && ft.exam_month === '2027-03', JSON.stringify(ft));
    assert(get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?`, ft.id).n >= 3, 'MT1–MT3 mặc định');
    const kck = chuKyHienTai(s8[4]);
    assert(kck.khong_cam_ket === 1 && kck.target_score === null, JSON.stringify(kck));
    assert(get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND target_at_attempt IS NOT NULL`, kck.id).n === 0, 'KCK: MT không có kỳ vọng');
    assert(enrHienTai(s8[5]).class_id === nE && lenhCua(s8[5]).trang_thai === 'cho', 'em học lại: tuần sau mới chuyển');
    assert(!enrHienTai(s8[6]) && get(`SELECT huong, ngay_xem_lai FROM lo_trinh_tiep_theo WHERE student_id = ?`, s8[6]).huong === 'bao_luu', 'bảo lưu');
    assert(get(`SELECT status FROM students WHERE id = ?`, s8[7]).status === 'finished', 'dừng học = Kết thúc học');
    assert(get(`SELECT status FROM classes WHERE id = ?`, nE).status === 'active', 'còn em học lại → lớp chưa kết thúc');
    const kq2 = chay(TUAN[1]);
    assert(kq2.daChuyen === 1 && enrHienTai(s8[5]).class_id === dLai && enrHienTai(s8[5]).started_at === TUAN[1], JSON.stringify(kq2));
    assert(get(`SELECT status FROM classes WHERE id = ?`, nE).status === 'finished', 'em cuối cùng đi → lớp kết thúc');
  });

  check('CT (4h) · FT tách 2 em cùng lộ trình (giữa khoá): lộ trình GIỮ NGUYÊN, Case đi theo em, người nhận = GV cùng môn lớp mới (M-04)', () => {
    const ftA = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 5 });
    const ftB = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 5 });
    const gvW = P.w1Teacher ?? P.normalCoreTeacher;
    ganGv(ftB, gvW.userId, 'writing1', false);
    const [f1, f2] = [hocVien(ftA, 'FT', true, 6.5), hocVien(ftA, 'FT', true, 7)];
    const caseId = Number(conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, owner_user_id, detected_at, created_at)
       VALUES (?,?, 'writing1', 'writing1', 'teacher_report', 'open', 1, NULL, ?, ?)`,
    ).run(f1.sid, f1.cyc, TODAY, new Date().toISOString()).lastInsertRowid);
    ra(P.mbManager, ftA, 'giua-khoa', [dongCua(f1.sid, 'chuyen_lop', ftB, { lyDo: 'tách lớp đông' }), dongCua(f2.sid, 'chuyen_lop', ftB, { lyDo: 'tách lớp đông' })]);
    const kq = chay(THU_HAI);
    assert(kq.daChuyen === 2, JSON.stringify(kq));
    assert(chuKyHienTai(f1.sid).id === f1.cyc && enrHienTai(f1.sid).class_id === ftB && enrHienTai(f1.sid).started_at === THU_HAI, 'lộ trình giữ nguyên id');
    const c = get('SELECT status, owner_user_id FROM sos_cases WHERE id = ?', caseId);
    assert(c.status === 'open' && c.owner_user_id === gvW.userId, `Case: ${JSON.stringify(c)}`);
    assert(get(`SELECT status FROM classes WHERE id = ?`, ftA).status === 'active', 'lớp FT rút hết em vẫn không tự kết thúc (Q21)');
  });
  check('CT (4i) · FT LT → RF: lộ trình MỚI theo lớp đích (M-20), lượt MT mặc định đánh lại từ MT1', () => {
    const ftLt = lopMoi({ kind: 'FT', ft: true, route: 'LT1', tuanHienTai: 5 });
    const ftRf = lopMoi({ kind: 'FT', ft: true, route: 'RF', tuanHienTai: 1 });
    const g = hocVien(ftLt, 'FT', true, 6.5);
    ra(P.mbManager, ftLt, 'giua-khoa', [dongCua(g.sid, 'chuyen_lop', ftRf, { lyDo: 'đổi lộ trình' })]);
    assert(chay(THU_HAI).daChuyen === 1, 'chuyển');
    const moi = chuKyHienTai(g.sid);
    assert(moi.id !== g.cyc && moi.route === 'RF' && moi.target_score === 6.5, JSON.stringify(moi));
    assert(get(`SELECT status FROM learning_cycles WHERE id = ?`, g.cyc).status === 'completed', 'lộ trình cũ đóng');
    assert(get(`SELECT MIN(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?`, moi.id).m === 1, 'MT đánh lại từ MT1');
  });
  await checkAsync('CT (4j) · chotVangDinhKy trả daChuyen; lỗi chuyển lớp KHÔNG làm hỏng daChot', async () => {
    const chot: any = await import('../ops/chotVangDinhKy.ts');
    const nF = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const dF = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const f = hocVien(nF, 'FOU', false).sid;
    ra(P.mbManager, nF, 'cuoi-khoa', [dongCua(f, 'len_lop', dF)]);
    setConfig('demo_date', THU_HAI);
    const a = chot.chotVangDinhKy({ ngay: THU_HAI, chot: () => 7, daKhoiTao: () => true });
    assert(a.daChot === 7 && a.daChuyen === 1 && enrHienTai(f).class_id === dF, JSON.stringify(a));
    const b = chot.chotVangDinhKy({ ngay: THU_HAI, chot: () => 4, daKhoiTao: () => true, chuyen: () => { throw new Error('hỏng giả'); } });
    assert(b.daChot === 4 && b.daChuyen === 0, JSON.stringify(b));
    assert(chot.chotVangDinhKy({ ngay: THU_HAI, daKhoiTao: () => false }).daChuyen === 0, 'chưa khởi tạo: bỏ qua');
    setConfig('demo_date', t.TODAY);
  });
  check('CT (4k) · nhóm thứ 41 để lượt sau: 41 nhóm (41 tuần khác nhau) → lượt một chuyển 40, lượt hai chuyển nốt 1', () => {
    const nG = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const ems = Array.from({ length: 41 }, () => hocVien(nG, 'FOU', false).sid);
    const now = new Date().toISOString();
    ems.forEach((sid, i) => conn.prepare(
      `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, ly_do, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
       VALUES (?,?, 'dung_hoc', 'cuoi-khoa', ?, 'chuyển nhà', ?, ?, 'cho', ?)`,
    ).run(sid, nG, t.addDays(t.addDays(THU_HAI, -7 * 45), 7 * i), P.mbManager.userId, TODAY, now));
    const kq1 = chay(THU_HAI);
    const kq2 = chay(THU_HAI);
    assert(kq1.daChuyen === 40 && kq2.daChuyen === 1, `${kq1.daChuyen} + ${kq2.daChuyen}`);
    assert(get(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'da_chuyen'`, nG).n === 41, 'đủ 41');
  });

  // ------------------------------------------------------------------ khối 5 · bàn giao: phiếu, dòng môn GVBM, GVCN xác nhận (Task 5)
  console.log('\nPR-CT · Bàn giao — phiếu tự điền, dòng môn GVBM, GVCN xác nhận');
  const bg: any = await import('../classes/banGiao.ts');
  /* Năm giáo viên KHÁC NHAU (vai Giáo viên) — bộ demo dùng chung một người cho nhiều vai P.* nên không dùng P.* ở khối này. */
  const GV = (all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 5`, MB) as any[]).map((r) => ({ userId: r.user_id as number }));
  assert(GV.length === 5, `Cần 5 giáo viên chi nhánh MB, có ${GV.length}`);
  const n5 = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
  const d5 = lopMoi({ kind: 'BE', tuanHienTai: 1 });
  ganGv(n5, GV[0].userId, null, true);
  ganGv(n5, GV[1].userId, 'listening', false);
  ganGv(n5, GV[2].userId, 'speaking', false);
  ganGv(d5, GV[3].userId, null, true);
  const gvcn5 = loadPrincipal(GV[0].userId);
  const gvbmL = loadPrincipal(GV[1].userId);
  const gvbmS = loadPrincipal(GV[2].userId);
  const gvDich = loadPrincipal(GV[3].userId);
  const em5 = Array.from({ length: 4 }, () => hocVien(n5, 'FOU', false).sid);
  ra(P.mbManager, n5, 'cuoi-khoa', [
    dongCua(em5[0], 'len_lop', d5), dongCua(em5[1], 'len_lop', d5), dongCua(em5[2], 'len_lop', d5),
    dongCua(em5[3], 'dung_hoc', null, { lyDo: 'chuyển nhà' }),
  ]);
  const monL = 'listening', monR = 'reading';
  check('CT (5a) · GVBM ghi đúng môn mình (UPSERT, sửa được); môn khác → 403; GVCN điền thay → dien_thay 1; rỗng / > 300 ký tự → 400', () => {
    const l = lenhCua(em5[0]);
    bg.ghiMon(gvbmL, l.id, monL, 'Nghe ý chính tốt, còn yếu dạng điền bản đồ.');
    bg.ghiMon(gvbmL, l.id, monL, 'Nghe tốt, cần luyện dạng điền bản đồ.');
    const m = get(`SELECT * FROM ban_giao_mon WHERE lenh_id = ? AND mon = ?`, l.id, monL);
    assert(m.noi_dung.startsWith('Nghe tốt') && m.dien_thay === 0 && m.nguoi_ghi === gvbmL.userId && all('SELECT id FROM ban_giao_mon WHERE lenh_id = ?', l.id).length === 1, JSON.stringify(m));
    assert(maLoi(() => bg.ghiMon(gvbmL, l.id, monR, 'Đọc chậm.')) === 403, 'GVBM môn khác phải 403');
    bg.ghiMon(gvcn5, l.id, monR, 'Đọc chậm với bài dài.');
    assert(get(`SELECT dien_thay FROM ban_giao_mon WHERE lenh_id = ? AND mon = ?`, l.id, monR).dien_thay === 1, 'GVCN điền thay');
    assert(maLoi(() => bg.ghiMon(gvbmL, l.id, monL, '   ')) === 400 && maLoi(() => bg.ghiMon(gvbmL, l.id, monL, 'x'.repeat(301))) === 400, 'rỗng / quá dài');
    assert(maLoi(() => bg.ghiMon(gvcn5, l.id, 'khong_co_mon', 'x')) === 400, 'môn không có ở lớp nguồn');
    assert(maLoi(() => bg.ghiMon(gvDich, l.id, monL, 'GV lớp đích ghi')) === 403 && maLoi(() => bg.ghiMon(P.mbManager, l.id, monL, 'QL ghi')) === 403, 'GV lớp đích, QL (chưa quá hạn) → 403');
    assert(maLoi(() => bg.ghiMon(gvcn5, lenhCua(em5[3]).id, monL, 'dừng học')) === 400, 'lệnh Dừng học không có phiếu');
  });
  check('CT (5b) · đọc phiếu: GV lớp đích trước xác nhận → 403; QL đọc 200; QL chi nhánh khác / GV không dạy → 403; phiếu cả lớp trả 3 em (Dừng học không có phiếu)', () => {
    const lop = bg.phieuBanGiao(gvcn5, { lopNguonId: n5 });
    assert(lop.tong === 3 && lop.ds.length === 3 && lop.daXacNhan === 0 && lop.lop.mon.length === 4, JSON.stringify({ t: lop.tong, m: lop.lop.mon.length }));
    const e0 = lop.ds.find((x: any) => x.studentId === em5[0]);
    assert(e0.soMonDaGhi === 2 && e0.phieu.nhan === 'Môn 2/4' && e0.tuDien && !e0.tuDienDaChup && e0.mon.find((m: any) => m.ma === monR).dienThay, JSON.stringify(e0.phieu));
    assert(lop.nguoiXem.gvcn && lop.nguoiXem.xacNhan && lop.nguoiXem.monGhi.length === 4, JSON.stringify(lop.nguoiXem));
    assert(bg.phieuBanGiao(gvbmL, { lopNguonId: n5 }).nguoiXem.monGhi.join() === monL, 'GVBM L chỉ ghi được môn L');
    assert(bg.phieuBanGiao(P.mbManager, { lopNguonId: n5 }).nguoiXem.xacNhan === false, 'QL chưa quá hạn: không xác nhận');
    assert(maLoi(() => bg.phieuBanGiao(gvDich, { lopNguonId: n5 })) === 403, 'GV lớp đích trước xác nhận → 403');
    assert(maLoi(() => bg.phieuBanGiao(gvDich, { lenhId: lenhCua(em5[0]).id })) === 403, 'GV lớp đích (một phiếu) → 403');
    assert(maLoi(() => bg.phieuBanGiao(P.cpManager, { lopNguonId: n5 })) === 403, 'QL chi nhánh khác → 403');
    assert(maLoi(() => bg.phieuBanGiao(loadPrincipal(GV[4].userId), { lopNguonId: n5 })) === 403, 'GV không dạy lớp → 403');
  });
  check('CT (5c) · xác nhận: nhận xét 14 ký tự → 400; đủ → chụp phần tự điền, "GVBM chưa bàn giao", Hành trình; xác nhận hai lần → 409; GVBM / GV lớp đích → 403', () => {
    const l = lenhCua(em5[0]);
    assert(maLoi(() => bg.xacNhanBanGiao(gvcn5, l.id, 'a'.repeat(14))) === 400, '14 ký tự');
    assert(maLoi(() => bg.xacNhanBanGiao(gvbmL, l.id, 'Em chăm, ngại nói trước lớp.')) === 403 && maLoi(() => bg.xacNhanBanGiao(gvDich, l.id, 'Em chăm, ngại nói trước lớp.')) === 403, 'GVBM / GV đích 403');
    bg.xacNhanBanGiao(gvcn5, l.id, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    const sau = lenhCua(em5[0]);
    const chup = JSON.parse(sau.tu_dien);
    assert(sau.xac_nhan_boi === gvcn5.userId && sau.xac_nhan_thay === 0 && sau.nhan_xet_chung.startsWith('Em chăm'), JSON.stringify(sau));
    assert(chup.tuDien.ketQua && chup.gvbmChuaBanGiao.length === 2, `chưa bàn giao: ${chup.gvbmChuaBanGiao}`);
    assert(get(`SELECT COUNT(*) n FROM journey_events WHERE student_id = ? AND ref_table = 'lenh_chuyen_lop' AND ref_id = ?`, em5[0], l.id).n === 1, 'một sự kiện Hành trình');
    assert(maLoi(() => bg.xacNhanBanGiao(gvcn5, l.id, 'Xác nhận lần hai của GVCN.')) === 409, 'xác nhận hai lần → 409');
    assert(maLoi(() => bg.ghiMon(gvbmL, l.id, monL, 'Ghi sau khi xác nhận')) === 400, 'phiếu đã xác nhận không ghi thêm');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, gvDich.userId, `ban_giao:${l.id}`).n === 1, 'báo GVCN lớp đích');
    /* Sau xác nhận GV lớp đích đọc được (chỉ đọc) */
    const doc = bg.phieuBanGiao(gvDich, { lenhId: l.id });
    assert(doc.ds.length === 1 && doc.ds[0].tuDienDaChup && doc.ds[0].xacNhan && doc.nguoiXem.xemTuNguon === false && doc.nguoiXem.monGhi.length === 0, 'đọc phiếu đã xác nhận, không ghi được');
    assert(maLoi(() => bg.ghiMon(gvDich, l.id, monL, 'x')) === 403, 'GV lớp đích ghi → 403');
    const ca = bg.phieuBanGiao(gvDich, { lopNguonId: n5 });
    assert(ca.ds.length === 1, `GV lớp đích chỉ thấy phiếu đã xác nhận: ${ca.ds.length}`);
  });
  check('CT (5d) · xác nhận SAU khi lệnh đã chuyển vẫn được (lệnh chạy đúng tuần, bàn giao theo sau)', () => {
    const l = lenhCua(em5[1]);
    assert(chay(THU_HAI).daChuyen >= 3, 'thi hành cả nhóm');
    assert(lenhCua(em5[1]).trang_thai === 'da_chuyen', 'đã chuyển');
    bg.xacNhanBanGiao(gvcn5, l.id, 'Em học đều, cần nhắc nộp bài đúng hạn.');
    assert(lenhCua(em5[1]).xac_nhan_luc, 'xác nhận sau chuyển');
    assert(bg.phieuBanGiao(gvDich, { lenhId: l.id }).ds[0].trangThaiLenh === 'da_chuyen', 'GV lớp đích đọc phiếu của em đã chuyển');
    const daChuyenChuaXacNhan = lenhCua(em5[2]);
    assert(bg.phieuBanGiao(gvDich, { lenhId: daChuyenChuaXacNhan.id }).ds.length === 1, 'em đã chuyển mà chưa xác nhận: GV lớp đích đọc được');
  });
  check('CT (5e) · Pre FOU: chỉ một ô "Tổng hợp" — GVBM (kỹ năng) không ghi được, GVCN ghi được', () => {
    const pre = lopMoi({ kind: 'PREFOU', tuanHienTai: 5 });
    const fou = lopMoi({ kind: 'FOU', tuanHienTai: 1 });
    ganGv(pre, GV[0].userId, null, true);
    ganGv(pre, GV[1].userId, 'listening', false);
    const gCn = loadPrincipal(GV[0].userId), gBm = loadPrincipal(GV[1].userId);
    const e = hocVien(pre, 'PREFOU', false).sid;
    ra(P.mbManager, pre, 'cuoi-khoa', [dongCua(e, 'len_lop', fou)]);
    const l = lenhCua(e);
    const dto = bg.phieuBanGiao(gCn, { lopNguonId: pre });
    assert(dto.lop.mon.length === 1 && dto.lop.mon[0].ma === 'tong_hop' && dto.lop.mon[0].ten === 'Tổng hợp', JSON.stringify(dto.lop.mon));
    assert(maLoi(() => bg.ghiMon(gBm, l.id, 'tong_hop', 'GVBM ghi Tổng hợp')) === 403, 'GVBM không ghi được ô Tổng hợp');
    bg.ghiMon(gCn, l.id, 'tong_hop', 'Học ổn, cần theo sát bài tập về nhà.');
    assert(bg.phieuBanGiao(gCn, { lopNguonId: pre }).ds[0].phieu.nhan === 'Môn 1/1', 'GVCN ghi ô Tổng hợp');
  });
  check('CT (5f) · Câu 1 = A: lớp KHÔNG có GVCN, hoặc quá hạn 3 ngày → Quản lý điền thay và xác nhận thay ("Quản lý xác nhận thay"); chưa quá hạn mà có GVCN → 403', () => {
    const kg = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const kgDich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    const e = hocVien(kg, 'FOU', false).sid;
    ra(P.mbManager, kg, 'cuoi-khoa', [dongCua(e, 'len_lop', kgDich)]);
    const l = lenhCua(e);
    bg.ghiMon(P.mbManager, l.id, monL, 'QL điền thay khi lớp chưa có GVCN.');
    assert(get(`SELECT dien_thay FROM ban_giao_mon WHERE lenh_id = ?`, l.id).dien_thay === 1, 'QL điền thay');
    bg.xacNhanBanGiao(P.mbManager, l.id, 'Quản lý xác nhận thay: lớp chưa có GVCN.');
    assert(lenhCua(e).xac_nhan_thay === 1 && bg.phieuBanGiao(P.mbManager, { lenhId: l.id }).ds[0].xacNhan.thay, 'ghi "xác nhận thay"');
    /* Lớp có GVCN: QL chỉ thay được khi quá hạn 3 ngày */
    const e2 = hocVien(n5, 'FOU', false).sid;
    ra(P.mbManager, n5, 'cuoi-khoa', [dongCua(e2, 'len_lop', d5)]);
    const l2 = lenhCua(e2);
    assert(maLoi(() => bg.xacNhanBanGiao(P.mbManager, l2.id, 'QL xác nhận sớm không được phép.')) === 403, 'chưa quá hạn → 403');
    conn.prepare('UPDATE lenh_chuyen_lop SET han_gvcn = ? WHERE id = ?').run(t.addDays(TODAY, -1), l2.id);
    bg.xacNhanBanGiao(P.mbManager, l2.id, 'Quá hạn 3 ngày, Quản lý xác nhận thay.');
    assert(lenhCua(e2).xac_nhan_thay === 1, 'quá hạn → QL thay được');
    assert(maLoi(() => bg.xacNhanBanGiao(P.cpManager, lenhCua(e).id, 'QL chi nhánh khác không được xác nhận.')) === 403, 'QL chi nhánh khác 403');
  });
  check('CT (5g) · Nhắc: GVCN nhắc GVBM môn còn thiếu → thông báo đúng người, dedup mỗi ngày; GVBM / QL chưa quá hạn nhắc → 403', () => {
    const l = lenhCua(em5[2]);
    const r = bg.nhacGvbm(gvcn5, l.id, monL);
    assert(r.soNguoi === 1, JSON.stringify(r));
    bg.nhacGvbm(gvcn5, l.id, monL);
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'nhac_ban_giao'`, gvbmL.userId).n === 1, 'một thông báo mỗi ngày');
    assert(maLoi(() => bg.nhacGvbm(gvbmL, l.id, monL)) === 403 && maLoi(() => bg.nhacGvbm(gvDich, l.id, monL)) === 403, 'GVBM / GV lớp đích nhắc → 403');
  });
  check('CT (5h) · số câu SQL của phiếu cả lớp KHÔNG tăng theo số em (3 em vs 30 em)', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(lop, GV[0].userId, null, true);
    const g = loadPrincipal(GV[0].userId);
    const them = (k: number) => {
      const ss = Array.from({ length: k }, () => hocVien(lop, 'FOU', false).sid);
      ra(P.mbManager, lop, 'cuoi-khoa', ss.map((s) => dongCua(s, 'len_lop', dich)));
    };
    them(3);
    const it = demTruyVan(() => { bg.phieuBanGiao(g, { lopNguonId: lop }); });
    them(27);
    const nhieu = demTruyVan(() => { bg.phieuBanGiao(g, { lopNguonId: lop }); });
    assert(bg.phieuBanGiao(g, { lopNguonId: lop }).ds.length === 30, 'đủ 30 em');
    assert(it === nhieu, `số câu đổi theo số em: ${it} → ${nhieu}`);
    console.log(`      (phiếu cả lớp: ${it} câu cho 3 em, ${nhieu} câu cho 30 em)`);
  });
  await checkAsync('CT (5i) · qua HTTP: GET ban-giao (GVCN 200, GVBM 200, GV không dạy 403) · PUT ban-giao-mon · POST xac-nhan · POST nhac', async () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const dich = lopMoi({ kind: 'BE', tuanHienTai: 1 });
    ganGv(lop, GV[0].userId, null, true);
    ganGv(lop, GV[1].userId, 'listening', false);
    const e = hocVien(lop, 'FOU', false).sid;
    ra(P.mbManager, lop, 'cuoi-khoa', [dongCua(e, 'len_lop', dich)]);
    const l = lenhCua(e);
    await voiMayChu(async (goi) => {
      const cn = GV[0].userId, bm = GV[1].userId, la = GV[4].userId;
      assert((await goi(cn, `/lenh-chuyen/ban-giao?lop=${lop}`)).status === 200 && (await goi(bm, `/lenh-chuyen/ban-giao?lop=${lop}&mon=listening`)).status === 200, 'GVCN / GVBM đọc');
      assert((await goi(la, `/lenh-chuyen/ban-giao?lop=${lop}`)).status === 403 && (await goi(la, `/lenh-chuyen/${l.id}/ban-giao`)).status === 403, 'GV không dạy → 403');
      const put = await goi(bm, `/lenh-chuyen/${l.id}/ban-giao-mon`, { method: 'PUT', body: JSON.stringify({ mon: 'listening', noiDung: 'Nghe tốt.' }) });
      const sai = await goi(bm, `/lenh-chuyen/${l.id}/ban-giao-mon`, { method: 'PUT', body: JSON.stringify({ mon: 'reading', noiDung: 'Đọc tốt.' }) });
      assert(put.status === 200 && sai.status === 403, `PUT ${put.status}/${sai.status}`);
      const ngan = await goi(cn, `/lenh-chuyen/${l.id}/xac-nhan`, { method: 'POST', body: JSON.stringify({ nhanXetChung: 'ngắn' }) });
      const gvbmXn = await goi(bm, `/lenh-chuyen/${l.id}/xac-nhan`, { method: 'POST', body: JSON.stringify({ nhanXetChung: 'Em chăm chỉ và cẩn thận.' }) });
      const nhac = await goi(cn, `/lenh-chuyen/${l.id}/nhac`, { method: 'POST', body: JSON.stringify({ mon: 'reading' }) });
      const ok = await goi(cn, `/lenh-chuyen/${l.id}/xac-nhan`, { method: 'POST', body: JSON.stringify({ nhanXetChung: 'Em chăm chỉ và cẩn thận.' }) });
      assert(ngan.status === 400 && gvbmXn.status === 403 && nhac.status === 200 && ok.status === 200, `${ngan.status}/${gvbmXn.status}/${nhac.status}/${ok.status}`);
    });
  });

  // ------------------------------------------------------------------ khối 6 · việc, Báo lên, Đề xuất chuyển lớp (Task 6)
  console.log('\nPR-CT · Việc bàn giao gộp theo lớp, Báo lên, Đề xuất chuyển lớp');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const viecBg = (who: any, lop: number) => ((myWork(who) as any).items ?? []).filter((i: any) => i.group === 'ban_giao' && i.classId === lop);
  const theBl = (loai: string, lop: number) => get(`SELECT * FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, loai, lop);
  const n6 = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
  const d6 = lopMoi({ kind: 'BE', tuanHienTai: 1 });
  ganGv(n6, GV[0].userId, null, true);
  ganGv(n6, GV[1].userId, 'listening', false);
  ganGv(n6, GV[2].userId, 'speaking', false);
  const g6 = loadPrincipal(GV[0].userId), l6 = loadPrincipal(GV[1].userId), s6 = loadPrincipal(GV[2].userId);
  const em6 = Array.from({ length: 7 }, () => hocVien(n6, 'FOU', false).sid);
  ra(P.mbManager, n6, 'cuoi-khoa', em6.map((s) => dongCua(s, 'len_lop', d6)));

  check('CT (6a) · GVCN: MỘT việc "Bàn giao 7 em · lớp" cho cả lớp; GVBM: MỘT việc mỗi môn; hạn theo <Han> (GVCN 3 ngày, GVBM 2 ngày, tính cả ngày ra lệnh)', () => {
    const cn = viecBg(g6, n6);
    assert(cn.length === 1 && cn[0].tieuDe === `Bàn giao 7 em · ${get('SELECT code FROM classes WHERE id = ?', n6).code}`, JSON.stringify(cn.map((i: any) => i.tieuDe)));
    assert(cn[0].key === `ban_giao:${n6}` && cn[0].due === d.hanBanGiao(TODAY).gvcn && cn[0].contextLabel.startsWith('GVCN · 0/7 đã xác nhận') && cn[0].href === `/hoc-vien/lop/${n6}?viec=ban-giao`, JSON.stringify(cn[0]));
    const bm = viecBg(l6, n6);
    assert(bm.length === 1 && bm[0].key === `ban_giao_mon:${n6}:listening` && bm[0].due === d.hanBanGiao(TODAY).gvbm && bm[0].contextLabel === 'GVBM · 0/7 em' && bm[0].href.endsWith('&mon=listening'), JSON.stringify(bm));
    assert(bm[0].tieuDe.startsWith('Bàn giao môn '), bm[0].tieuDe);
    assert(viecBg(P.mbManager, n6).length === 0 && viecBg(loadPrincipal(GV[4].userId), n6).length === 0, 'QL và GV không dạy lớp: không có việc bàn giao');
  });
  check('CT (6b) · việc GVBM biến mất khi ghi đủ 7 em; việc GVCN biến mất khi xác nhận hết; lệnh "huy" → việc tự bớt', () => {
    const lenhs = em6.map((s) => lenhCua(s));
    for (const l of lenhs.slice(0, 6)) bg.ghiMon(l6, l.id, 'listening', 'Nghe ổn.');
    assert(viecBg(l6, n6)[0].contextLabel === 'GVBM · 6/7 em', viecBg(l6, n6)[0].contextLabel);
    bg.ghiMon(l6, lenhs[6].id, 'listening', 'Nghe ổn.');
    assert(viecBg(l6, n6).length === 0, 'ghi đủ → hết việc');
    assert(viecBg(g6, n6)[0].contextLabel.includes('chờ môn'), viecBg(g6, n6)[0].contextLabel);
    lenh.huyLenh(P.mbManager, lenhs[6].id, 'Em ở lại lớp');
    assert(viecBg(g6, n6)[0].tieuDe.includes('6 em'), `huỷ 1 lệnh → còn 6: ${viecBg(g6, n6)[0].tieuDe}`);
    for (const l of lenhs.slice(0, 6)) bg.xacNhanBanGiao(g6, l.id, 'Em học đều, cần nhắc nộp bài đúng hạn.');
    assert(viecBg(g6, n6).length === 0, 'xác nhận hết → hết việc');
  });
  check('CT (6c) · một em: việc ghi rõ "Bàn giao {tên} → {lớp đích}"', () => {
    const n = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    ganGv(n, GV[3].userId, null, true);
    const e = hocVien(n, 'FOU', false).sid;
    ra(P.mbManager, n, 'cuoi-khoa', [dongCua(e, 'len_lop', d6)]);
    const v = viecBg(loadPrincipal(GV[3].userId), n);
    assert(v.length === 1 && /^Bàn giao Hoc vien CT\d+ → /.test(v[0].tieuDe), v[0]?.tieuDe);
  });
  check('CT (6d) · Báo lên bàn giao: sinh đúng NGÀY THỨ 4 (quá han_gvcn), một thẻ mỗi lớp, ownerId = GVCN, đóng khi xác nhận hết', () => {
    const n = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    ganGv(n, GV[4].userId, null, true);
    const gvn = loadPrincipal(GV[4].userId);
    const [a, b] = [hocVien(n, 'FOU', false).sid, hocVien(n, 'FOU', false).sid];
    ra(P.mbManager, n, 'cuoi-khoa', [dongCua(a, 'len_lop', d6), dongCua(b, 'len_lop', d6)]);
    const han = d.hanBanGiao(TODAY).gvcn;
    yc.quetYeuCau(han);
    assert(!theBl('bao_len_ban_giao', n), 'ngày thứ 3 (còn trong hạn): chưa có thẻ');
    yc.quetYeuCau(t.addDays(han, 1));
    yc.quetYeuCau(t.addDays(han, 1));
    const the = theBl('bao_len_ban_giao', n);
    assert(the && the.trang_thai === 'cho' && the.phan_loai === 'bao-len' && the.han_duyet === han, JSON.stringify(the));
    assert(JSON.parse(the.du_lieu).ownerId === GV[4].userId && get(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_ban_giao' AND doi_tuong_id = ?`, n).n === 1, 'một thẻ mỗi lớp, chủ = GVCN');
    bg.xacNhanBanGiao(gvn, lenhCua(a).id, 'Em học đều, cần nhắc nộp bài đúng hạn.');
    yc.quetYeuCau(t.addDays(han, 1));
    assert(theBl('bao_len_ban_giao', n).trang_thai === 'cho', 'còn một em chưa xác nhận → thẻ còn');
    bg.xacNhanBanGiao(gvn, lenhCua(b).id, 'Em học đều, cần nhắc nộp bài đúng hạn.');
    yc.quetYeuCau(t.addDays(han, 1));
    assert(theBl('bao_len_ban_giao', n).trang_thai === 'tu_dong', 'xác nhận hết → thẻ tự đóng');
    /* hộp Chờ duyệt của QL thấy thẻ Báo lên khi còn treo */
    const n2 = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    ganGv(n2, GV[4].userId, null, true);
    ra(P.mbManager, n2, 'cuoi-khoa', [dongCua(hocVien(n2, 'FOU', false).sid, 'len_lop', d6)]);
    conn.prepare('UPDATE lenh_chuyen_lop SET han_gvcn = ? WHERE lop_nguon_id = ?').run(t.addDays(TODAY, -1), n2);
    const hop = yc.hopChoDuyet(P.mbManager, {});
    const t2 = hop.the.find((x: any) => x.loai === 'bao_len_ban_giao' && x.lopId === n2);
    assert(t2 && t2.kieuNut === 'nhac' && t2.tieuDe.startsWith('Bàn giao quá hạn') && t2.duLieu.ownerId === GV[4].userId && t2.dong[0].includes('1 em'), JSON.stringify(t2));
    lenh.huyLenh(P.mbManager, lenhCua(get('SELECT student_id FROM lenh_chuyen_lop WHERE lop_nguon_id = ?', n2).student_id).id, 'Em ở lại lớp');
    yc.quetYeuCau(TODAY);
    assert(theBl('bao_len_ban_giao', n2).trang_thai === 'tu_dong', 'lệnh huỷ → thẻ tự đóng');
  });
  check('CT (6e) · Báo lên "Lớp hết khoá còn em chưa có lệnh": sinh khi lớp thường hết tuần kết thúc, một thẻ/lớp, đóng khi đủ lệnh; lớp chưa hết không có', () => {
    const het = lopMoi({ kind: 'FOU', tuanHienTai: 9 });
    const chua = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    const [h1, h2] = [hocVien(het, 'FOU', false).sid, hocVien(het, 'FOU', false).sid];
    hocVien(chua, 'FOU', false);
    yc.quetYeuCau(TODAY);
    yc.quetYeuCau(TODAY);
    const the = theBl('bao_len_chua_lenh', het);
    assert(the && the.trang_thai === 'cho' && !theBl('bao_len_chua_lenh', chua), 'chỉ lớp đã hết');
    assert(get(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_chua_lenh' AND doi_tuong_id = ?`, het).n === 1, 'một thẻ mỗi lớp');
    ra(P.mbManager, het, 'cuoi-khoa', [dongCua(h1, 'len_lop', d6)]);
    yc.quetYeuCau(TODAY);
    assert(theBl('bao_len_chua_lenh', het).trang_thai === 'cho', 'còn 1 em chưa có lệnh');
    ra(P.mbManager, het, 'cuoi-khoa', [dongCua(h2, 'len_lop', d6)]);
    yc.quetYeuCau(TODAY);
    assert(theBl('bao_len_chua_lenh', het).trang_thai === 'tu_dong', 'đủ lệnh → thẻ tự đóng');
  });
  check('CT (6f) · việc của Quản lý: từ tuần Cuối khoá đếm em CHƯA CÓ LỆNH ("n em chưa có lệnh chuyển"); GVCN hết đếm em đã có lệnh vào "chưa có lộ trình tiếp theo"', () => {
    const cuoi = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    ganGv(cuoi, GV[3].userId, null, true);
    const ds = [hocVien(cuoi, 'FOU', false).sid, hocVien(cuoi, 'FOU', false).sid, hocVien(cuoi, 'FOU', false).sid];
    const pl = () => (myWork(P.mbManager) as any).items.find((i: any) => i.group === 'placement' && i.classId === cuoi);
    assert(pl().reason === '3 em chưa có lệnh chuyển' && pl().tieuDe === 'Chuyển lớp cả lớp' && pl().href === `/hoc-vien/lop/${cuoi}?viec=chuyen-tiep`, JSON.stringify(pl()));
    ra(P.mbManager, cuoi, 'cuoi-khoa', [dongCua(ds[0], 'len_lop', d6)]);
    assert(pl().reason === '2 em chưa có lệnh chuyển', pl().reason);
    const ns = (myWork(loadPrincipal(GV[3].userId)) as any).items.find((i: any) => i.group === 'next_step' && i.classId === cuoi);
    assert(ns && ns.reason === '2 HV chưa có lộ trình tiếp theo', ns?.reason);
    ra(P.mbManager, cuoi, 'cuoi-khoa', [dongCua(ds[1], 'len_lop', d6), dongCua(ds[2], 'len_lop', d6)]);
    assert(!pl(), 'đủ lệnh → hết việc');
    const giua = lopMoi({ kind: 'FOU', tuanHienTai: 3 });
    hocVien(giua, 'FOU', false);
    assert(!(myWork(P.mbManager) as any).items.some((i: any) => i.group === 'placement' && i.classId === giua), 'chưa tới tuần Cuối khoá: chưa có việc');
  });
  check('CT (6g) · Đề xuất chuyển lớp: GVCN lớp em gửi được; GVBM / GVCN lớp khác / lý do < 15 ký tự → lỗi; gửi trùng → 400; "lớp" bị bỏ khỏi Đề xuất sửa', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 4 });
    ganGv(lop, GV[0].userId, null, true);
    ganGv(lop, GV[1].userId, 'listening', false);
    const gCn = loadPrincipal(GV[0].userId), gBm = loadPrincipal(GV[1].userId), gKhac = loadPrincipal(GV[2].userId);
    const e = hocVien(lop, 'FOU', false).sid;
    const dichKhac = lopMoi({ kind: 'FOU', tuanHienTai: 4 });
    const v = { toClassId: dichKhac, tuan: TUAN[0], lyDo: 'Phụ huynh xin chuyển sang lớp khác giờ học.' };
    assert(maLoi(() => lenh.guiDeXuatChuyenLop(gBm, e, v)) === 403 && maLoi(() => lenh.guiDeXuatChuyenLop(gKhac, e, v)) === 403, 'GVBM / GVCN lớp khác → 403');
    assert(maLoi(() => lenh.guiDeXuatChuyenLop(gCn, e, { ...v, lyDo: 'ngắn' })) === 400, 'lý do ngắn');
    assert(maLoi(() => lenh.guiDeXuatChuyenLop(gCn, e, { ...v, tuan: mondayNow })) === 400, 'tuần hiện tại');
    const r = lenh.guiDeXuatChuyenLop(gCn, e, v);
    const the = get('SELECT * FROM yeu_cau_duyet WHERE id = ?', r.id);
    assert(the.loai === 'de_xuat_chuyen_lop' && the.phan_loai === 'thong-tin-hv' && the.han_duyet === d.hanTheoNgay(TODAY, 5) && the.nguoi_xin === gCn.userId, JSON.stringify(the));
    assert(maLoi(() => lenh.guiDeXuatChuyenLop(gCn, e, v)) === 400, 'gửi trùng');
    assert(maLoi(() => yc.duyetYeuCau(gCn, r.id)) === 403, 'GVCN không duyệt');
    const hop = yc.hopChoDuyet(P.mbManager, {});
    const t1 = hop.the.find((x: any) => x.id === r.id);
    assert(t1.tieuDe.startsWith(`Đề xuất chuyển lớp · ${get('SELECT code FROM classes WHERE id = ?', dichKhac).code} · từ `) && t1.duLieu.moPanelChuyenLop === true && t1.duLieu.lopDichId === dichKhac, JSON.stringify(t1));
    assert(t1.neuDuyet === 'Mở panel ra lệnh — sửa được lớp, tuần.', t1.neuDuyet);
  });
  check('CT (6h) · Duyệt đề xuất với duLieu QL sửa lớp / tuần → lệnh đúng giá trị QL sửa, có tu_yeu_cau_id, thẻ Đã duyệt; QL tự gửi rồi tự duyệt → "tự duyệt"', () => {
    const lop = lopMoi({ kind: 'FOU', tuanHienTai: 4 });
    ganGv(lop, GV[0].userId, null, true);
    const gCn = loadPrincipal(GV[0].userId);
    const dichA = lopMoi({ kind: 'FOU', tuanHienTai: 4 }), dichB = lopMoi({ kind: 'FOU', tuanHienTai: 4 });
    const e = hocVien(lop, 'FOU', false).sid;
    const r = lenh.guiDeXuatChuyenLop(gCn, e, { toClassId: dichA, tuan: TUAN[0], lyDo: 'Phụ huynh xin chuyển sang lớp khác giờ học.' });
    assert(maLoi(() => yc.duyetYeuCau(P.mbManager, r.id, {})) === 400, 'duyệt mà chưa có lớp đích trong duLieu → 400');
    yc.duyetYeuCau(P.mbManager, r.id, { duLieu: { lopDichId: dichB, tuan: TUAN[2] } });
    const l = lenhCua(e);
    assert(l.lop_dich_id === dichB && l.tuan_bat_dau === TUAN[2] && l.tu_yeu_cau_id === r.id && l.trang_thai === 'cho' && l.boi_canh === 'giua-khoa' && l.huong === 'chuyen_lop', JSON.stringify(l));
    assert(get('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', r.id).trang_thai === 'duyet', 'thẻ Đã duyệt');
    assert(l.ly_do.startsWith('Phụ huynh xin'), 'lý do lấy từ thẻ');
    /* QL tự gửi rồi tự duyệt */
    const e2 = hocVien(lop, 'FOU', false).sid;
    const r2 = lenh.guiDeXuatChuyenLop(P.mbManager, e2, { toClassId: dichA, tuan: TUAN[1], lyDo: 'Quản lý tự đề xuất chuyển lớp cho em.' });
    yc.duyetYeuCau(P.mbManager, r2.id, { duLieu: { lopDichId: dichA, tuan: TUAN[1] } });
    assert(get('SELECT tu_duyet FROM yeu_cau_duyet WHERE id = ?', r2.id).tu_duyet === 1, 'tự duyệt');
    /* đã có lệnh cho từ đường khác → thẻ mới không gửi được; thẻ cũ tự đóng */
    const e3 = hocVien(lop, 'FOU', false).sid;
    const r3 = lenh.guiDeXuatChuyenLop(gCn, e3, { toClassId: dichA, tuan: TUAN[0], lyDo: 'Phụ huynh xin chuyển sang lớp khác giờ học.' });
    ra(P.mbManager, lop, 'cuoi-khoa', [dongCua(e3, 'hoc_lai', lopMoi({ kind: 'FOU', tuanHienTai: 1 }))]);
    yc.quetYeuCau(TODAY);
    assert(get('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', r3.id).trang_thai === 'tu_dong', 'em có lệnh từ đường khác → thẻ đề xuất tự đóng');
  });
  check('CT (6i) · quetYeuCau không có gì để tạo / đóng → KHÔNG mở giao dịch', () => {
    yc.quetYeuCau(TODAY);
    let begin = 0;
    const goc = conn.exec.bind(conn);
    (conn as any).exec = (sql: string) => { if (/^(BEGIN|SAVEPOINT)/i.test(String(sql))) begin += 1; return goc(sql); };
    try { yc.quetYeuCau(TODAY); } finally { (conn as any).exec = goc; }
    assert(begin === 0, `quét lần hai mở ${begin} giao dịch`);
  });
  await checkAsync('CT (6j) · Nhắc: QL nhắc GVCN qua việc bàn giao (khoá ban_giao:{lớp}) — nhacViec tìm đúng dòng', async () => {
    /* dựng lệnh cho lớp có GVCN GV[0] (n6 ở khối 6a đã xác nhận hết → dựng lớp mới) */
    const n = lopMoi({ kind: 'FOU', tuanHienTai: 8 });
    ganGv(n, GV[0].userId, null, true);
    ra(P.mbManager, n, 'cuoi-khoa', [dongCua(hocVien(n, 'FOU', false).sid, 'len_lop', d6)]);
    const { nhacViec } = await import('../worklist/nhacViec.ts');
    const r = nhacViec(P.mbManager, { key: `ban_giao:${n}`, ownerId: GV[0].userId });
    assert(r.daNhacLuc, 'đã nhắc');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'nhac_viec' AND dedup_key = ?`, GV[0].userId, `nhac:ban_giao:${n}:${TODAY}`).n === 1, 'thông báo nhắc');
  });

}
