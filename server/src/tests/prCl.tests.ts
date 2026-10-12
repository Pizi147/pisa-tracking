/**
 * PHÉP KIỂM PR-CL — Chuyển lớp làm lại (kế hoạch .superpowers/sdd/cl/plan.md, B9). T1 (máy chủ): FT → Thường khi thi hành (B4), một luật
 * hướng + bối cảnh cho Chuyển lớp một em (B1), danh sách lớp chuyển đến (B2), xem trước "Khi chuyển, web sẽ" (B3), migrate prLcb cuộn lại (B7).
 * Theo hành vi trên DB kiểm và qua HTTP thật, không khớp chuỗi nguồn.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrClTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays } = t;
  console.log('\nPR-CL · Chuyển lớp làm lại (FT → Thường, Cuối khoá, lớp chuyển đến, Khi chuyển)');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const mt0: any = await import('../fasttrack/mt0.ts');
  const hanhTrinh: any = await import('../students/hanhTrinh.ts');
  const migLcb: any = await import('../migrate/prLcb.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const CP = get(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  const NOW = new Date().toISOString();

  let seq = 0;
  /** Lớp đang ở tuần `tuan` (FT: lộ trình LT1). */
  const lop = (kind: 'FOU' | 'BE' | 'ELE' | 'PREFOU' | 'FT', tuan = 1, branchId = MB, route: string | null = kind === 'FT' ? 'LT1' : null) => {
    seq += 1;
    const ft = kind === 'FT';
    const start = thu2(tuan);
    const c = intake.createClass(P.admin, {
      code: `${get('SELECT code FROM branches WHERE id = ?', branchId).code} CL-${seq} ${kind}`, branchId, kind, isFastTrack: ft, route, startDate: start, startPeriodId: week.ensurePeriod(start).id,
    });
    return { id: c.id as number, code: c.code as string, start };
  };
  /** Em ghi danh `active` ở lớp `classId` + một khoá / lộ trình đang chạy. */
  const em = (classId: number, o: { ft?: boolean; ma?: string | null; target?: number | null; route?: string | null; batDau?: string; seqKhoa?: number } = {}) => {
    seq += 1;
    const cn = get('SELECT branch_id FROM classes WHERE id = ?', classId).branch_id;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-CL${seq}`, `Học viên CL${seq}`, `hoc vien cl${seq}`, cn, NOW).lastInsertRowid);
    const bd = o.batDau ?? thu2(1);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId, bd, NOW);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at) VALUES (?,?,?,?,?,?,?, 'active', ?)`)
      .run(sid, o.seqKhoa ?? 1, o.ft ? (o.route ?? 'LT1') : null, o.ft ? null : (o.ma ?? null), o.target === undefined ? 6 : o.target, week.ensurePeriod(week.mondayOf(bd)).id, bd, NOW).lastInsertRowid);
    return { sid, cyc };
  };
  const ganGv = (classId: number, n: number, skill: string | null, core = false) => {
    const uid = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`)
      .run(uid, classId, skill, core ? 1 : 0, NOW);
    return loadPrincipal(uid);
  };
  const diem = (attemptId: number, skill: string, band = 6) =>
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)`).run(attemptId, skill, band, NOW);
  const taoMt0 = (cycleId: number, sid: number, classId: number) => Number(conn.prepare(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, plan_source, created_at) VALUES (?,?,0,'mt0',?, 'planned', 'auto', ?)`,
  ).run(cycleId, sid, classId, NOW).lastInsertRowid);
  const taoMock = (cycleId: number, sid: number, classId: number, no: number) => Number(conn.prepare(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?,?,'mock',?, 'planned', ?)`,
  ).run(cycleId, sid, no, classId, NOW).lastInsertRowid);
  const taoCase = (sid: number, cycleId: number) => Number(conn.prepare(
    `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at) VALUES (?,?, 'listening', 'listening', 'teacher_report', 'open', 1, ?, ?)`,
  ).run(sid, cycleId, TODAY, NOW).lastInsertRowid);
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  const khoaChay = (sid: number) => get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const demCau = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  /** Thi hành lệnh lớp nguồn `nguon` ở thứ Hai tuần sau: lệnh lớp khác tạm đặt `thu_ngay` để lượt quét bỏ qua, xong trả lại (mẫu prLcb). */
  const thiHanh = (nguon: number) => {
    const khac = all(`SELECT id, thu_ngay FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND lop_nguon_id != ?`, nguon);
    const dat = conn.prepare('UPDATE lenh_chuyen_lop SET thu_ngay = ? WHERE id = ?');
    for (const x of khac) dat.run(THU_HAI, x.id);
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally {
      setConfig('demo_date', cu);
      for (const x of khac) dat.run(x.thu_ngay ?? null, x.id);
    }
  };
  /** Máy chủ thật + phiên demo theo người dùng (mẫu prCt). */
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
  const post = (goi: any, uid: number, url: string, body: unknown) => goi(uid, url, { method: 'POST', body: JSON.stringify(body) });
  const thuong = (r: Response) => r.json().catch(() => ({}));

  /** Em lớp ELE đã Lên FT (MT0 có điểm L, R): MT0 thành đầu vào lộ trình FT, lộ trình FT có Mock mặc định. */
  const emDaLenFt = (ftLop: number, o: { mt0Diem?: boolean; ngay?: string } = {}) => {
    const ele = lop('ELE', 10);
    const { sid, cyc } = em(ele.id, { ma: 'ELE' });
    conn.prepare(`UPDATE learning_cycles SET exam_month = '2027-03' WHERE id = ?`).run(cyc);
    const mt0Id = taoMt0(cyc, sid, ele.id);
    luatLoTrinh.apDungMotDong(QL, { sid, toClassId: ftLop, ngay: o.ngay ?? week.mondayOf(TODAY), mucTieu: 6.5, boiCanh: 'cuoi-khoa' });
    const ft = khoaChay(sid);
    if (o.mt0Diem !== false) { diem(mt0Id, 'listening'); diem(mt0Id, 'reading'); }
    return { sid, khoaEle: cyc, ft, mt0Id, ele };
  };

  // ------------------------------------------------------------------ (a) FT → Thường khi thi hành (B4)
  const FT_A = lop('FT', 3);
  const ELE_DICH = lop('ELE', 2);
  await checkAsync('CL-a · FT → Thường thi hành: lộ trình FT đóng; khoá ELE mới giữ Target FT + Dự kiến thi; MT0 có điểm → khoá ELE cũ ("không dùng", Hành trình); baseline trống; Mock chưa điểm huỷ + lịch sử; MT3 điểm một phần giữ; số điểm không đổi; Case FT đóng', async () => {
    const x = emDaLenFt(FT_A.id);
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', x.mt0Id).cycle_id === x.ft.id && x.ft.baseline_attempt_id === x.mt0Id, 'tiền đề: MT0 là đầu vào lộ trình FT');
    assert(x.ft.target_score === 6.5 && x.ft.exam_month === '2027-03', `tiền đề lộ trình FT: ${JSON.stringify([x.ft.target_score, x.ft.exam_month])}`);
    const mock = all(`SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? AND kind != 'mt0' AND status = 'planned' ORDER BY attempt_no`, x.ft.id);
    assert(mock.length >= 3, `tiền đề: ≥ 3 Mock mặc định, có ${mock.length}`);
    const mt3 = mock.find((m) => m.attempt_no === 3)!;
    diem(mt3.id, 'listening');
    const huyDuKien = mock.filter((m) => m.id !== mt3.id).map((m) => m.id as number);
    const caseId = taoCase(x.sid, x.ft.id);
    const soDiem = () => get('SELECT COUNT(*) n FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id WHERE a.student_id = ?', x.sid).n;
    const diemTruoc = soDiem();
    /* Xem trước = việc làm (B3 ↔ B4). */
    const xem = luatLoTrinh.xemChuyenLop(QL, x.sid, ELE_DICH.id);
    assert(xem.canhBao === true && xem.veThuong?.mockHuy?.length === huyDuKien.length && xem.veThuong?.mt0?.coDiem === true, `xem trước: ${JSON.stringify(xem.veThuong)}`);
    await voiMayChu(async (goi) => {
      const r = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ELE_DICH.id, tuan: THU_HAI, lyDo: 'Học lại ELE' });
      assert(r.status === 200, `transfer: ${r.status} ${JSON.stringify(await thuong(r))}`);
    });
    const l = lenhCua(x.sid);
    assert(l?.trang_thai === 'cho' && l.boi_canh === 'giua-khoa' && l.huong === 'chuyen_lop' && l.muc_tieu == null, `lệnh: ${JSON.stringify(l)}`);
    thiHanh(FT_A.id);
    assert(lenhCua(x.sid).trang_thai === 'da_chuyen', `thi hành: ${lenhCua(x.sid).trang_thai} ${lenhCua(x.sid).loi ?? ''}`);
    assert(get('SELECT status FROM learning_cycles WHERE id = ?', x.ft.id).status === 'completed', 'lộ trình FT completed');
    const moi = khoaChay(x.sid);
    assert(moi && moi.route == null && moi.programme_code === 'ELE' && moi.target_score === 6.5 && moi.exam_month === '2027-03', `khoá ELE mới: ${JSON.stringify(moi)}`);
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', x.mt0Id).cycle_id === x.khoaEle, 'MT0 về khoá ELE cũ');
    assert(mt0.mt0TheoHocVien([x.sid]).get(x.sid)?.trangThai === 'khong_dung', `MT0: ${JSON.stringify(mt0.mt0TheoHocVien([x.sid]).get(x.sid))}`);
    assert(JSON.stringify(hanhTrinh.hanhTrinhHocVien(QL, x.sid, null)).includes('"nhanNgan":"MT0 · không dùng"'), 'Hành trình: MT0 · không dùng');
    const ftSau = get('SELECT baseline_attempt_id, baseline_source FROM learning_cycles WHERE id = ?', x.ft.id);
    assert(ftSau.baseline_attempt_id == null && ftSau.baseline_source == null, `baseline: ${JSON.stringify(ftSau)}`);
    for (const id of huyDuKien) {
      const a = get('SELECT status, cancel_reason FROM assessment_attempts WHERE id = ?', id);
      assert(a.status === 'cancelled' && a.cancel_reason === 'Học lại lớp thường', `Mock ${id}: ${JSON.stringify(a)}`);
    }
    const ls = get(`SELECT COUNT(*) n FROM attempt_schedule_history WHERE action = 'cancelled' AND reason = 'Học lại lớp thường' AND attempt_id IN (${huyDuKien.join(',')})`).n;
    assert(ls === huyDuKien.length, `lịch sử huỷ: ${ls}/${huyDuKien.length}`);
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', mt3.id).status === 'planned', 'MT3 (điểm một phần) giữ trạng thái');
    assert(soDiem() === diemTruoc, `số điểm: ${soDiem()} ≠ ${diemTruoc}`);
    const c = get('SELECT status, system_close_reason FROM sos_cases WHERE id = ?', caseId);
    assert(c.status === 'done' && c.system_close_reason === 'moved_to_normal', `Case FT: ${JSON.stringify(c)}`);
    /* Fix I1 (R-C1): bản chụp lộ trình FT = trạng thái lúc đóng — còn đầu vào MT0 và dòng MT0 có điểm; Mock chưa điểm đã huỷ. */
    const bc = get('SELECT id, dau_vao_nguon, dau_vao_l, dau_vao_r FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY id DESC LIMIT 1', x.ft.id);
    assert(bc && bc.dau_vao_nguon === 'mt0' && bc.dau_vao_l === 6 && bc.dau_vao_r === 6, `bản chụp FT đầu vào: ${JSON.stringify(bc)}`);
    const dongMt0 = all('SELECT trang_thai FROM ban_chup_luot WHERE ban_chup_id = ? AND attempt_id = ?', bc.id, x.mt0Id);
    assert(dongMt0.length > 0 && dongMt0.every((r) => r.trang_thai === 'khong_dung'), `bản chụp FT dòng MT0: ${JSON.stringify(dongMt0)}`);
    const dongMock = all('SELECT DISTINCT trang_thai FROM ban_chup_luot WHERE ban_chup_id = ? AND attempt_id = ?', bc.id, huyDuKien[0]);
    assert(dongMock.length === 1 && dongMock[0].trang_thai === 'cancelled', `bản chụp FT Mock huỷ: ${JSON.stringify(dongMock)}`);
  });

  // ------------------------------------------------------------------ (b) biến thể: MT0 chưa điểm; vào thẳng FT; không giới hạn thời gian
  check('CL-b · MT0 chưa điểm → huỷ "Học lại lớp thường"; em vào thẳng FT 20 tuần trước (không khoá thường) → không lỗi, Mock chưa điểm vẫn huỷ', () => {
    const x = emDaLenFt(FT_A.id, { mt0Diem: false });
    luatLoTrinh.apDungMotDong(QL, { sid: x.sid, toClassId: ELE_DICH.id, ngay: THU_HAI, lyDo: 'CL-b', boiCanh: 'giua-khoa' });
    const a = get('SELECT status, cancel_reason, cycle_id FROM assessment_attempts WHERE id = ?', x.mt0Id);
    assert(a.status === 'cancelled' && a.cancel_reason === 'Học lại lớp thường', `MT0 chưa điểm: ${JSON.stringify(a)}`);
    assert(get('SELECT baseline_attempt_id FROM learning_cycles WHERE id = ?', x.ft.id).baseline_attempt_id == null, 'baseline trống');

    const ftLop = lop('FT', 21);
    const y = em(ftLop.id, { ft: true, batDau: thu2(21) });
    const m1 = taoMock(y.cyc, y.sid, ftLop.id, 7);
    const m2 = taoMock(y.cyc, y.sid, ftLop.id, 8);
    diem(m2, 'reading');
    const e = loi(() => luatLoTrinh.apDungMotDong(QL, { sid: y.sid, toClassId: ELE_DICH.id, ngay: THU_HAI, lyDo: 'CL-b thẳng FT', boiCanh: 'giua-khoa' }));
    assert(!e, `vào thẳng FT: ${e?.message}`);
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', m1).status === 'cancelled', 'Mock chưa điểm huỷ (20 tuần sau vẫn áp)');
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', m2).status === 'planned', 'Mock có điểm giữ');
    assert(khoaChay(y.sid)?.target_score === 6, `Target FT giữ: ${khoaChay(y.sid)?.target_score}`);
  });

  // ------------------------------------------------------------------ (c) Thường → FT giữa khoá: Target từ LTT → khoá → hỏi
  const FT_C = lop('FT', 2);
  await checkAsync('CL-c · Thường → FT giữa khoá không gửi Target: khoá Target → lệnh muc_tieu = khoá; LTT có Target → LTT; không Target nào → 400 "Ghi Target (hoặc KCK)"; targetSan / nguonTarget khớp', async () => {
    const fou = lop('FOU', 3);
    const a = em(fou.id, { ma: 'FOU', target: 6 });
    const b = em(fou.id, { ma: 'FOU', target: 6 });
    const c = em(fou.id, { ma: 'FOU', target: null });
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, muc_tieu, created_at, updated_at) VALUES (?,?, 'fast_track', 7, ?, ?)`).run(b.sid, fou.id, NOW, NOW);
    const xa = luatLoTrinh.xemChuyenLop(QL, a.sid, FT_C.id);
    const xb = luatLoTrinh.xemChuyenLop(QL, b.sid, FT_C.id);
    const xc = luatLoTrinh.xemChuyenLop(QL, c.sid, FT_C.id);
    assert(xa.targetSan === 6 && xa.nguonTarget === 'khoa', `a: ${xa.targetSan} ${xa.nguonTarget}`);
    assert(xb.targetSan === 7 && xb.nguonTarget === 'gvcn', `b: ${xb.targetSan} ${xb.nguonTarget}`);
    assert(xc.targetSan === null && xc.nguonTarget === null, `c: ${xc.targetSan} ${xc.nguonTarget}`);
    assert(xa.huong === 'fast_track' && xa.boiCanh === 'giua-khoa', `hướng: ${xa.huong} ${xa.boiCanh}`);
    await voiMayChu(async (goi) => {
      for (const [x, mong] of [[a, 6], [b, 7]] as const) {
        const r = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: FT_C.id, tuan: THU_HAI, lyDo: 'Lên FT giữa khoá' });
        assert(r.status === 200 && lenhCua(x.sid)?.muc_tieu === mong && lenhCua(x.sid)?.huong === 'fast_track', `${x.sid}: ${r.status} ${JSON.stringify(lenhCua(x.sid))}`);
      }
      const r = await post(goi, QL.userId, `/students/${c.sid}/transfer`, { toClassId: FT_C.id, tuan: THU_HAI, lyDo: 'Lên FT giữa khoá' });
      const j: any = await thuong(r);
      assert(r.status === 400 && /Ghi Target \(hoặc KCK\)/.test(String(j?.error ?? j?.message ?? '')) && !lenhCua(c.sid), `c: ${r.status} ${JSON.stringify(j)}`);
    });
  });

  // ------------------------------------------------------------------ (d) FT → FT: chỉ Lý do
  await checkAsync('CL-d · FT → FT: chỉ Lý do (không Target) → lệnh; thiếu Lý do → 400 "Ghi lý do ngắn"', async () => {
    const ft2 = lop('FT', 2);
    const x = em(FT_C.id, { ft: true });
    await voiMayChu(async (goi) => {
      const r0 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft2.id, tuan: THU_HAI, lyDo: '' });
      const j: any = await thuong(r0);
      assert(r0.status === 400 && /Ghi lý do ngắn/.test(String(j?.error ?? j?.message ?? '')) && !lenhCua(x.sid), `thiếu lý do: ${r0.status} ${JSON.stringify(j)}`);
      const r = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft2.id, tuan: THU_HAI, lyDo: 'Gộp lớp' });
      assert(r.status === 200 && lenhCua(x.sid)?.huong === 'chuyen_lop' && lenhCua(x.sid)?.boi_canh === 'giua-khoa', `${r.status} ${JSON.stringify(lenhCua(x.sid))}`);
    });
  });

  // ------------------------------------------------------------------ (e) /transfer ở Cuối khoá (B1)
  const FOU2 = lop('FOU', 1);
  const BE2 = lop('BE', 1);
  const ELE2 = lop('ELE', 1);
  const PF2 = lop('PREFOU', 1);
  await checkAsync('CL-e · /transfer lớp FOU tuần 8/8: → FT cuoi-khoa fast_track (LTT + MT0); → FOU khác hoc_lai, thi hành mở khoá mới; → BE len_lop; → ELE 400 "chương trình kế tiếp"; tuần 5 → giua-khoa chuyen_lop; lệnh cuối khoá chờ → sửa đúng lệnh đó', async () => {
    const fou = lop('FOU', 8);
    const [a, b, c, e, f] = [1, 2, 3, 4, 5].map(() => em(fou.id, { ma: 'FOU' }));
    regular.planRegularTests(P.admin, fou.id);
    const fou5 = lop('FOU', 5);
    const g = em(fou5.id, { ma: 'FOU' });
    await voiMayChu(async (goi) => {
      const tf = (sid: number, toClassId: number) => post(goi, QL.userId, `/students/${sid}/transfer`, { toClassId, tuan: THU_HAI, lyDo: 'CL-e' });
      assert((await tf(a.sid, FT_C.id)).status === 200, 'a → FT');
      const la = lenhCua(a.sid);
      assert(la.boi_canh === 'cuoi-khoa' && la.huong === 'fast_track' && la.muc_tieu === 6, `a: ${JSON.stringify([la.boi_canh, la.huong, la.muc_tieu])}`);
      assert(get('SELECT huong FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', a.sid, fou.id)?.huong === 'fast_track', 'a: LTT fast_track');
      assert(get(`SELECT 1 FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, a.sid), 'a: MT0 đã tạo');
      assert((await tf(b.sid, FOU2.id)).status === 200 && lenhCua(b.sid).boi_canh === 'cuoi-khoa' && lenhCua(b.sid).huong === 'hoc_lai', `b: ${JSON.stringify(lenhCua(b.sid))}`);
      assert((await tf(c.sid, BE2.id)).status === 200 && lenhCua(c.sid).huong === 'len_lop', `c: ${JSON.stringify(lenhCua(c.sid))}`);
      const re = await tf(e.sid, ELE2.id);
      const je: any = await thuong(re);
      assert(re.status === 400 && /chương trình kế tiếp/.test(JSON.stringify(je)) && !lenhCua(e.sid), `e → ELE: ${re.status} ${JSON.stringify(je)}`);
      assert((await tf(g.sid, BE2.id)).status === 200 && lenhCua(g.sid).boi_canh === 'giua-khoa' && lenhCua(g.sid).huong === 'chuyen_lop', `g tuần 5: ${JSON.stringify(lenhCua(g.sid))}`);
      /* Lệnh cuối khoá đang chờ → /transfer sửa CHÍNH lệnh đó. */
      const r0 = lenh.raLenh(QL, { lopNguonId: fou.id, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: f.sid, huong: 'len_lop', toClassId: BE2.id }] });
      assert(!r0.failed.length, JSON.stringify(r0.failed));
      const id0 = lenhCua(f.sid).id;
      assert((await tf(f.sid, FOU2.id)).status === 200, 'f sửa');
      const ds = all('SELECT id, huong, lop_dich_id FROM lenh_chuyen_lop WHERE student_id = ?', f.sid);
      assert(ds.length === 1 && ds[0].id === id0 && ds[0].huong === 'hoc_lai' && ds[0].lop_dich_id === FOU2.id, `f: ${JSON.stringify(ds)}`);
    });
    const khoaB = khoaChay(b.sid).id;
    thiHanh(fou.id);
    assert(lenhCua(b.sid).trang_thai === 'da_chuyen', `b thi hành: ${lenhCua(b.sid).trang_thai} ${lenhCua(b.sid).loi ?? ''}`);
    const mb = khoaChay(b.sid);
    assert(mb.id !== khoaB && mb.programme_code === 'FOU' && get('SELECT status FROM learning_cycles WHERE id = ?', khoaB).status === 'completed', `b học lại mở khoá mới: ${JSON.stringify(mb)}`);
    assert(get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, b.sid).class_id === FOU2.id, 'b sang FOU khác');
  });

  // ------------------------------------------------------------------ (f) lớp chuyển đến (B2)
  check('CL-f · lop-dich: QL thấy lớp chi nhánh khác + branchCode + siSo; GVCN không siSo; nguồn Cuối khoá FOU: không ELE / Pre FOU, có FT + FOU + BE; lớp nguồn và lớp finished không có', () => {
    const cpLop = lop('BE', 1, CP);
    const xong = lop('BE', 1);
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(xong.id);
    const giua = lop('FOU', 3);
    const x = em(giua.id, { ma: 'FOU' });
    em(cpLop.id, { ma: 'BE' });
    const r = luatLoTrinh.lopDichChoChuyen(QL, x.sid);
    const c = r.lop.find((l: any) => l.id === cpLop.id);
    assert(c && c.branchCode === 'CP' && c.siSo === 1, `lớp CP: ${JSON.stringify(c)}`);
    assert(!r.lop.some((l: any) => l.id === giua.id || l.id === xong.id), 'không lớp nguồn / finished');
    assert(r.lop.some((l: any) => l.id === ELE2.id) && r.nguon?.ft === false && r.nguon?.tuCuoiKhoa === false, `giữa khoá: mọi lớp active — ${JSON.stringify(r.nguon)}`);
    const gvcn = ganGv(giua.id, 3, null, true);
    const rg = luatLoTrinh.lopDichChoChuyen(gvcn, x.sid);
    assert(rg.lop.length && rg.lop.every((l: any) => !('siSo' in l)) && rg.lop.find((l: any) => l.id === cpLop.id)?.branchCode === 'CP', 'GVCN: không siSo');
    const ck = lop('FOU', 8);
    const y = em(ck.id, { ma: 'FOU' });
    const rc = luatLoTrinh.lopDichChoChuyen(QL, y.sid);
    const co = (id: number) => rc.lop.some((l: any) => l.id === id);
    assert(rc.nguon?.tuCuoiKhoa === true, `nguồn: ${JSON.stringify(rc.nguon)}`);
    assert(!co(ELE2.id) && !co(PF2.id) && co(FT_C.id) && co(FOU2.id) && co(BE2.id) && co(cpLop.id), `cuối khoá: ${JSON.stringify(rc.lop.map((l: any) => l.code))}`);
  });

  // ------------------------------------------------------------------ (g) xem trước "Khi chuyển, web sẽ" + bảng thuần dongKhiChuyen
  check('CL-g · xemChuyenLop: FT → thường canhBao + dòng Mock / MT0 / điểm; thường → FT dòng MT0 + Target nguồn; FT → FT cùng LT "Giữ lộ trình FT LT1"; đổi chi nhánh "Sắp nhận"; tuLopThuong', () => {
    const x = emDaLenFt(FT_A.id);
    const mock = all(`SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? AND kind != 'mt0' AND status = 'planned' ORDER BY attempt_no`, x.ft.id);
    diem(mock[0].id, 'listening');
    /* Fix M1: Case FT (đóng "moved_to_normal") + Case khoá ELE cũ (lớp thường — KHÔNG đóng) → chỉ đếm 1. */
    const caseFt = taoCase(x.sid, x.ft.id);
    const caseThuong = taoCase(x.sid, x.khoaEle);
    const v = luatLoTrinh.xemChuyenLop(QL, x.sid, ELE_DICH.id);
    assert(v.khiChuyen.includes('1 Case FT tự đóng'), `Case: ${JSON.stringify(v.khiChuyen)}`);
    const seDong = (id: number) => v.caseMo.find((c: any) => c.id === id)?.seDong;
    assert(seDong(caseFt) === true && seDong(caseThuong) === false, `seDong: ${JSON.stringify(v.caseMo)}`);
    const n = mock.length - 1;
    const ten = mock.slice(1).map((m) => `MT${m.attempt_no}`).join(', ');
    assert(v.canhBao === true, 'canhBao');
    assert(v.khiChuyen[0] === 'Đóng lộ trình FT LT1', `dòng 1: ${v.khiChuyen[0]}`);
    assert(v.khiChuyen.includes('MT0 → “MT0 · không dùng”'), `MT0: ${JSON.stringify(v.khiChuyen)}`);
    assert(v.khiChuyen.includes(`Huỷ ${n} bài Mock chưa có điểm (${ten})`), `Mock: ${JSON.stringify(v.khiChuyen)}`);
    assert(v.khiChuyen.includes(`Giữ điểm đã có (MT0 L, R; MT${mock[0].attempt_no} L)`), `điểm: ${JSON.stringify(v.khiChuyen)}`);
    assert(JSON.stringify(v.veThuong.mt0) === JSON.stringify({ coDiem: true, kyNang: ['L', 'R'] }) && v.veThuong.mockHuy.length === n, JSON.stringify(v.veThuong));
    assert(v.tuLopThuong === x.ele.code, `tuLopThuong: ${v.tuLopThuong}`);
    assert(v.huong === 'chuyen_lop' && v.luat?.dongCase === 'normal', `hướng: ${v.huong} ${JSON.stringify(v.luat)}`);

    const ftLt1 = lop('FT', 2);
    const z = em(FT_C.id, { ft: true });
    const vz = luatLoTrinh.xemChuyenLop(QL, z.sid, ftLt1.id);
    assert(vz.canhBao === false && vz.khiChuyen[0] === 'Giữ lộ trình FT LT1' && vz.khiChuyen.includes('MT chưa thi chuyển sang lớp mới'), JSON.stringify(vz.khiChuyen));
    assert(vz.tuLopThuong === null, 'vào thẳng FT: không tuLopThuong');

    const ck = lop('FOU', 8);
    const y = em(ck.id, { ma: 'FOU', target: 6.5 });
    const cpFt = lop('FT', 2, CP);
    const vy = luatLoTrinh.xemChuyenLop(QL, y.sid, cpFt.id);
    const fw = vy.mt0?.tuXep;
    assert(vy.boiCanh === 'cuoi-khoa' && vy.huong === 'fast_track' && fw, `cuối khoá: ${vy.boiCanh} ${vy.huong} ${JSON.stringify(vy.mt0)}`);
    assert(vy.khiChuyen[0] === 'Đóng lộ trình FOU, mở lộ trình FT LT1', `dòng 1: ${vy.khiChuyen[0]}`);
    assert(vy.khiChuyen.includes(`MT0 làm đầu vào, tự xếp ${fw}`) && vy.khiChuyen.includes('Target 6.5 (khoá)'), JSON.stringify(vy.khiChuyen));
    assert(vy.khiChuyen.includes('Quản lý chi nhánh mới và GVCN lớp mới được báo “Sắp nhận”') && vy.canhBao === false, JSON.stringify(vy.khiChuyen));
  });

  check('CL-g2 · dongKhiChuyen (bảng thuần): mọi nhánh, dòng rỗng bỏ; phuLopDich', () => {
    const goc = { nguonFt: false, dichFt: false, khoa: 'dong-mo', routeNguon: null, routeDich: null, maNguon: 'FOU', mt0: null, target: null, veThuong: null, soCase: 0, dongCase: null, goiYNhan: null, doiChiNhanh: false };
    const k = (o: any) => d.dongKhiChuyen({ ...goc, ...o });
    const ca: [any, string[], boolean][] = [
      [{ dichFt: true, routeDich: 'LT1', mt0: { tuXep: 'W4 SEP' }, target: { giaTri: 6, nguon: 'gvcn' }, soCase: 2, dongCase: 'ft' },
        ['Đóng lộ trình FOU, mở lộ trình FT LT1', 'MT0 làm đầu vào, tự xếp W4 SEP', 'Target 6.0 (GVCN ghi)', '2 Case đang mở tự đóng “Lên FT”'], false],
      [{ dichFt: true, routeDich: 'LT2', mt0: { tuXep: null }, target: { giaTri: 'KCK', nguon: 'khoa' } }, ['Đóng lộ trình FOU, mở lộ trình FT LT2', 'MT0 làm đầu vào', 'Target KCK (khoá)'], false],
      [{ dichFt: true, routeDich: 'LT1' }, ['Đóng lộ trình FOU, mở lộ trình FT LT1'], false],
      [{ nguonFt: true, dichFt: true, khoa: 'giu', routeNguon: 'LT1', routeDich: 'LT1', soCase: 1, goiYNhan: 'Trần Ngọc Hà' },
        ['Giữ lộ trình FT LT1', 'MT chưa thi chuyển sang lớp mới', '1 Case đang mở đi theo em, người nhận gợi ý: Trần Ngọc Hà'], false],
      [{ nguonFt: true, dichFt: true, routeNguon: 'LT1', routeDich: 'LT2', doiChiNhanh: true },
        ['Đóng lộ trình cũ và mở lộ trình mới theo lớp chuyển đến', 'Bài chưa làm ở lại lớp cũ', 'Quản lý chi nhánh mới và GVCN lớp mới được báo “Sắp nhận”'], false],
      [{}, ['Đóng lộ trình cũ và mở lộ trình mới theo lớp chuyển đến', 'Bài chưa làm ở lại lớp cũ'], false],
      [{ khoa: 'giu' }, ['Giữ khoá FOU', 'Bài chưa làm chuyển sang lớp mới'], false],
      [{ nguonFt: true, routeNguon: 'LT1', soCase: 3, dongCase: 'normal', veThuong: { mt0: { coDiem: true, kyNang: ['L', 'R'] }, mockHuy: ['MT1', 'MT2'], giuDiem: ['MT0 L', 'MT0 R'] } },
        ['Đóng lộ trình FT LT1', 'MT0 → “MT0 · không dùng”', 'Huỷ 2 bài Mock chưa có điểm (MT1, MT2)', 'Giữ điểm đã có (MT0 L, R)', '3 Case FT tự đóng'], true],
      [{ nguonFt: true, routeNguon: 'LT1', veThuong: { mt0: { coDiem: false, kyNang: [] }, mockHuy: [], giuDiem: [] } }, ['Đóng lộ trình FT LT1', 'Huỷ MT0 chưa có điểm'], true],
      [{ nguonFt: true, routeNguon: 'LT1', veThuong: { mt0: null, mockHuy: [], giuDiem: [] } }, ['Đóng lộ trình FT LT1'], true],
    ];
    for (const [o, mong, cb] of ca) {
      const r = k(o);
      assert(JSON.stringify(r.khiChuyen) === JSON.stringify(mong) && r.canhBao === cb, `${JSON.stringify(o)} → ${JSON.stringify(r)}`);
    }
    assert(d.phuLopDich({ ft: true, route: 'LT1', ma: null, branchCode: 'CP', siSo: 9 }, true) === 'FT LT1 · CP · 9 em', 'FT có sĩ số');
    assert(d.phuLopDich({ ft: false, route: null, ma: 'ELE', branchCode: 'CP', siSo: 4 }, false) === 'ELE · CP', 'GVCN không sĩ số');
    assert(d.huongMotEm({ ft: false, ma: 'FOU' }, { ft: true, ma: null }, false) === 'fast_track' && d.huongMotEm({ ft: true, ma: null }, { ft: false, ma: 'FOU' }, false) === 'chuyen_lop'
      && d.huongMotEm({ ft: false, ma: 'FOU' }, { ft: false, ma: 'FOU' }, true) === 'hoc_lai' && d.huongMotEm({ ft: false, ma: 'FOU' }, { ft: false, ma: 'BE' }, true) === 'len_lop', 'huongMotEm');
  });

  // ------------------------------------------------------------------ (k) số câu SQL lop-dich không theo số lớp
  check('CL-k · /chuyen-lop/lop-dich: 3 lớp và 12 lớp thêm — cùng số câu SQL (nguồn Cuối khoá có lọc)', () => {
    const ck = lop('FOU', 8);
    const y = em(ck.id, { ma: 'FOU' });
    const dem = () => trongBoNho(() => demCau(() => luatLoTrinh.lopDichChoChuyen(QL, y.sid)));
    for (let i = 0; i < 3; i++) lop('BE', 1);
    const n3 = dem();
    for (let i = 0; i < 9; i++) lop(i % 2 ? 'FT' : 'BE', 1);
    const n12 = dem();
    assert(n3 === n12, `3 lớp: ${n3} câu · 12 lớp: ${n12} câu`);
  });

  // ------------------------------------------------------------------ (l) migrate prLcb cuộn lại khi điền bù lỗi (B7)
  check('CL-l · migratePrLcb: điền bù lỗi → ném lỗi VÀ cột không có (cuộn lại); chạy lại → cột có + điền bù; lần ba không đổi gì', () => {
    const cot = () => (conn.prepare('SELECT name FROM pragma_table_info(?)').all('lo_trinh_tiep_theo') as any[]).some((x) => x.name === 'huong_gvcn');
    const fou = lop('FOU', 8);
    const x = em(fou.id, { ma: 'FOU' });
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, created_at, updated_at) VALUES (?,?, 'hoc_lai', ?, ?)`).run(x.sid, fou.id, NOW, NOW);
    conn.exec('ALTER TABLE lo_trinh_tiep_theo DROP COLUMN huong_gvcn');
    let nem: any = null;
    conn.exec('ALTER TABLE lenh_chuyen_lop RENAME TO lenh_chuyen_lop_tam');
    try { nem = loi(() => migLcb.migratePrLcb(conn, [])); } finally { conn.exec('ALTER TABLE lenh_chuyen_lop_tam RENAME TO lenh_chuyen_lop'); }
    assert(nem && !cot(), `lần lỗi: ${nem?.message ?? 'không ném'} · cột ${cot()}`);
    const lan2: string[] = [];
    migLcb.migratePrLcb(conn, lan2);
    assert(cot() && lan2.length && get('SELECT huong_gvcn FROM lo_trinh_tiep_theo WHERE student_id = ?', x.sid)?.huong_gvcn === 'hoc_lai', `lần 2: ${JSON.stringify(lan2)}`);
    const truoc = JSON.stringify(all('SELECT id, huong_gvcn FROM lo_trinh_tiep_theo ORDER BY id'));
    const lan3: string[] = [];
    migLcb.migratePrLcb(conn, lan3);
    assert(!lan3.length && JSON.stringify(all('SELECT id, huong_gvcn FROM lo_trinh_tiep_theo ORDER BY id')) === truoc, `lần 3: ${JSON.stringify(lan3)}`);
  });

  // ------------------------------------------------------------------ (m) quyền qua HTTP
  await checkAsync('CL-m · HTTP: GVCN / GVBM POST /students/:id/transfer → 403; QT → 200; GVCN GET lop-dich 200 không siSo', async () => {
    const fou = lop('FOU', 3);
    const x = em(fou.id, { ma: 'FOU' });
    const gvcn = ganGv(fou.id, 4, null, true);
    const gvbm = ganGv(fou.id, 5, 'reading');
    await voiMayChu(async (goi) => {
      for (const uid of [gvcn.userId, gvbm.userId]) {
        const r = await post(goi, uid, `/students/${x.sid}/transfer`, { toClassId: FOU2.id, tuan: THU_HAI, lyDo: 'CL-m' });
        assert(r.status === 403 && !lenhCua(x.sid), `user ${uid}: ${r.status}`);
      }
      const ld = await goi(gvcn.userId, `/chuyen-lop/lop-dich?studentId=${x.sid}`);
      const j: any = await thuong(ld);
      assert(ld.status === 200 && j.lop?.length && j.lop.every((l: any) => !('siSo' in l)), `GVCN lop-dich: ${ld.status}`);
      const qt = await post(goi, P.admin.userId, `/students/${x.sid}/transfer`, { toClassId: FOU2.id, tuan: THU_HAI, lyDo: 'CL-m QT' });
      assert(qt.status === 200 && lenhCua(x.sid)?.trang_thai === 'cho', `QT: ${qt.status}`);
    });
  });
  // ================================================================== T2 · Xét lại lộ trình (B5, B6)
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const permissions: any = await import('../permissions.ts');
  check('CL-h · khongPhuHopLoTrinh: Lên lớp / Lên FT < 0.5 → true, 0.5 → false; Học lại 0.6999 → false, 0.7 → true; hướng khác / null → false', () => {
    const k = d.khongPhuHopLoTrinh;
    const ca: [string, number | null, boolean][] = [
      ['len_lop', 0.4999, true], ['fast_track', 0.4999, true], ['len_lop', 0.5, false], ['fast_track', 0.5, false],
      ['hoc_lai', 0.6999, false], ['hoc_lai', 0.7, true], ['hoc_lai', 0.95, true], ['bao_luu', 0.1, false], ['chuyen_lop', 0.1, false],
      ['len_lop', null, false], ['hoc_lai', null, false],
    ];
    for (const [h, t, mong] of ca) assert(k(h, t) === mong, `${h} ${t} → ${k(h, t)}`);
  });

  /** Ghi Final lớp FOU: mọi môn `pct`/100; `null` = chỉ một môn (thiếu môn). */
  const tyLeFou = (attemptId: number, pct: number | null) => {
    const skills: string[] = regular.allProgrammes().get('FOU').skills;
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(attemptId);
    skills.forEach((sk, i) => {
      if (pct === null && i > 0) return;
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?)').run(attemptId, sk, pct ?? 80, 100, NOW);
    });
  };
  /** Lớp FOU tuần 8: 4 em có Final (46% Lên BE · 72% Học lại · 55% Lên FT · thiếu môn Lên BE) → quyết định cuối khoá → thi hành. */
  const dungXetLai = () => {
    const fou = lop('FOU', 8);
    const ds = [1, 2, 3, 4].map(() => em(fou.id, { ma: 'FOU' }));
    regular.planRegularTests(P.admin, fou.id);
    const fin = ds.map((x) => get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' AND status != 'cancelled' ORDER BY id DESC LIMIT 1`, x.sid, fou.id).id as number);
    [46, 72, 55, null].forEach((pct, i) => tyLeFou(fin[i], pct));
    const r = lenh.raLenh(QL, { lopNguonId: fou.id, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [
      { studentId: ds[0].sid, huong: 'len_lop', toClassId: BE2.id, lyDo: 'CL-i' },
      { studentId: ds[1].sid, huong: 'hoc_lai', toClassId: FOU2.id, lyDo: 'CL-i' },
      { studentId: ds[2].sid, huong: 'fast_track', toClassId: FT_C.id, lyDo: 'CL-i' },
      { studentId: ds[3].sid, huong: 'len_lop', toClassId: BE2.id, lyDo: 'CL-i' },
    ] });
    assert(!r.failed.length, `raLenh: ${JSON.stringify(r.failed)}`);
    thiHanh(fou.id);
    for (const x of ds) assert(lenhCua(x.sid).trang_thai === 'da_chuyen', `thi hành ${x.sid}: ${lenhCua(x.sid).trang_thai} ${lenhCua(x.sid).loi ?? ''}`);
    return { fou, ds, fin };
  };
  const XL = dungXetLai();
  const viecXetLai = (p: any, branchId: number | null = MB) =>
    (mywork.myWork(p, branchId ? { branchId } : {}).groups.flatMap((g: any) => g.items) as any[]).filter((it) => it.group === 'xet_lai_lo_trinh');
  /* Em của lớp nguồn XL.fou trong mọi nhóm (gom theo lớp HIỆN TẠI: a → BE2, b → FOU2). */
  const XL_SID = new Set(XL.ds.map((x) => x.sid));
  const emCua = (homNay = TODAY, p: any = QL) => (ck.emXetLaiLoTrinh(p, null, homNay) as any[]).flatMap((g) => g.em).map((e: any) => e.studentId).filter((id: number) => XL_SID.has(id)).sort();

  check('CL-i · Xét lại: một việc mỗi lớp HIỆN TẠI "Xét lại lộ trình · {lớp hiện tại} · n em" (46% Lên BE → BE2, 72% Học lại → FOU2; 55% Lên FT và thiếu môn không); +13 còn, +14 mất; lệnh mới → 1 em, huỷ → 2; thôi học / rời lớp mới / lệnh giữa khoá mới hơn / nguồn FT → mất; sửa Final 55% → mất; QL CP / GVCN / GVBM không có', () => {
    const [a, b, c] = XL.ds;
    const v = viecXetLai(QL);
    assert(!v.some((it) => it.key === `xetlai:${XL.fou.id}`), 'không còn dòng theo lớp nguồn');
    for (const [lopHt, pct] of [[BE2, '46%'], [FOU2, '72%']] as const) {
      const it = v.find((x) => x.key === `xetlai:${lopHt.id}`);
      assert(it && it.tieuDe === `Xét lại lộ trình · ${lopHt.code} · ${it.count} em` && it.reason === 'Kết quả không phù hợp lộ trình' && it.due === null && it.urgency === 'normal'
        && it.classId === lopHt.id && it.actionLabel === 'Chuyển lớp…' && it.href === `/hoc-vien/lop/${lopHt.id}?viec=xet-lai` && it.ownerId === null, JSON.stringify(it));
      assert(it.contextLabel.includes(pct), `contextLabel: ${it.contextLabel}`);
    }
    assert(v.filter((x) => x.key === `xetlai:${FOU2.id}`).length === 1, 'một việc mỗi lớp hiện tại');
    assert(JSON.stringify(emCua()) === JSON.stringify([a.sid, b.sid].sort()), `em: ${JSON.stringify(emCua())}`);
    assert(d.nhomViecCua('xet_lai_lo_trinh') === 'van-hanh', 'nhóm Vận hành');
    /* Hết Chủ nhật tuần 2 ở lớp mới. */
    assert(emCua(addDays(THU_HAI, 13)).length === 2 && emCua(addDays(THU_HAI, 14)).length === 0, `+13 / +14: ${emCua(addDays(THU_HAI, 13))} / ${emCua(addDays(THU_HAI, 14))}`);
    /* Em có quyết định mới → bỏ; huỷ quyết định mới → lại có. */
    const r = lenh.raLenh(QL, { lopNguonId: BE2.id, boiCanh: 'giua-khoa', tuanChung: THU_HAI, dongs: [{ studentId: a.sid, huong: 'chuyen_lop', toClassId: FOU2.id, lyDo: 'Xét lại' }] });
    assert(!r.failed.length, JSON.stringify(r.failed));
    assert(JSON.stringify(emCua()) === JSON.stringify([b.sid]), `lệnh mới: ${JSON.stringify(emCua())}`);
    lenh.huyLenh(QL, lenhCua(a.sid).id, 'Giữ BE');
    assert(emCua().length === 2, `huỷ lệnh mới: ${JSON.stringify(emCua())}`);
    /* Thôi học (`finished` — `inactive` là Tạm dừng) → mất (khôi phục lại cho các phép kiểm sau). */
    const st = get('SELECT status FROM students WHERE id = ?', b.sid).status;
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(b.sid);
    assert(JSON.stringify(emCua()) === JSON.stringify([a.sid]), `thôi học: ${JSON.stringify(emCua())}`);
    conn.prepare('UPDATE students SET status = ? WHERE id = ?').run(st, b.sid);
    /* T5 (rà T2): em rời lớp mới (ghi danh không còn active) → mất. */
    conn.prepare(`UPDATE enrollments SET status = 'completed' WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(b.sid, FOU2.id);
    assert(JSON.stringify(emCua()) === JSON.stringify([a.sid]), `rời lớp mới: ${JSON.stringify(emCua())}`);
    conn.prepare(`UPDATE enrollments SET status = 'active' WHERE student_id = ? AND class_id = ? AND status = 'completed'`).run(b.sid, FOU2.id);
    /* T5: lệnh giữa khoá MỚI HƠN đã thi hành → mất (B5.1: mọi lệnh id lớn hơn chưa huỷ). */
    const moi = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?,?,?, 'chuyen_lop', 'giua-khoa', ?, ?, ?, 'da_chuyen', ?)`).run(a.sid, BE2.id, BE2.id, THU_HAI, QL.userId, TODAY, NOW).lastInsertRowid);
    assert(JSON.stringify(emCua()) === JSON.stringify([b.sid]), `lệnh giữa khoá mới: ${JSON.stringify(emCua())}`);
    conn.prepare('DELETE FROM lenh_chuyen_lop WHERE id = ?').run(moi);
    /* T5: lớp nguồn FT → không phải Xét lại (FT → FT không ra dòng). */
    conn.prepare('UPDATE classes SET is_fast_track = 1 WHERE id = ?').run(XL.fou.id);
    assert(emCua().length === 0, `nguồn FT: ${JSON.stringify(emCua())}`);
    conn.prepare('UPDATE classes SET is_fast_track = 0 WHERE id = ?').run(XL.fou.id);
    assert(emCua().length === 2, `khôi phục: ${JSON.stringify(emCua())}`);
    /* Sửa Final thành 55% → hết lệch. */
    tyLeFou(XL.fin[1], 55);
    assert(JSON.stringify(emCua()) === JSON.stringify([a.sid]), `sửa Final: ${JSON.stringify(emCua())}`);
    assert(!viecXetLai(QL).some((x) => x.key === `xetlai:${FOU2.id}` && /72%/.test(x.contextLabel)), 'việc FOU2 không còn em 72%');
    tyLeFou(XL.fin[1], 72);
    assert(c && !emCua().includes(c.sid), 'Lên FT 55% không');
    /* Người khác không có. */
    assert(!viecXetLai(P.cpManager, CP).length && !viecXetLai(P.cpManager, null).some((x) => x.key === `xetlai:${BE2.id}` || x.key === `xetlai:${FOU2.id}`), 'QL CP không có');
    assert(!emCua(TODAY, P.cpManager).length, 'QL CP: hàm không trả em');
    const gvcn = ganGv(BE2.id, 6, null, true);
    const gvbm = ganGv(BE2.id, 7, 'reading');
    assert(!viecXetLai(gvcn, null).length && !viecXetLai(gvbm, null).length, 'GVCN / GVBM không có');
    assert(viecXetLai(P.admin, null).some((x) => x.key === `xetlai:${BE2.id}`), 'QT có');
  });

  await checkAsync('CL-j · GET /classes/:id/xet-lai-lo-trinh (lớp HIỆN TẠI): cùng em với việc + huong, tyLe, lopHienTai; lớp nguồn finished vẫn trả; lớp nguồn → em: []; GVCN → em: []', async () => {
    const [a, b] = XL.ds;
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(XL.fou.id);
    const gvcn = ganGv(BE2.id, 8, null, true);
    try {
      await voiMayChu(async (goi) => {
        const r = await goi(QL.userId, `/classes/${BE2.id}/xet-lai-lo-trinh`);
        const j: any = await thuong(r);
        assert(r.status === 200 && j.lop?.id === BE2.id && j.lop?.code === BE2.code, `${r.status} ${JSON.stringify(j)}`);
        const ea = j.em.find((e: any) => e.studentId === a.sid);
        assert(ea && !j.em.some((e: any) => e.studentId === b.sid), JSON.stringify(j.em));
        assert(ea.huong === 'len_lop' && Math.abs(ea.tyLe - 0.46) < 1e-9 && ea.lopHienTai?.id === BE2.id && ea.lopHienTai?.code === BE2.code && typeof ea.ten === 'string', JSON.stringify(ea));
        const jb: any = await thuong(await goi(QL.userId, `/classes/${FOU2.id}/xet-lai-lo-trinh`));
        const eb = jb.em.find((e: any) => e.studentId === b.sid);
        assert(eb && eb.huong === 'hoc_lai' && Math.abs(eb.tyLe - 0.72) < 1e-9 && eb.lopHienTai?.id === FOU2.id, JSON.stringify(jb));
        const jn: any = await thuong(await goi(QL.userId, `/classes/${XL.fou.id}/xet-lai-lo-trinh`));
        assert(jn.em.length === 0, `lớp nguồn: ${JSON.stringify(jn)}`);
        const viec = viecXetLai(QL).find((x) => x.key === `xetlai:${BE2.id}`);
        assert(viec?.count === j.em.length, `việc ${viec?.count} ≠ GET ${j.em.length}`);
        const g = await goi(gvcn.userId, `/classes/${BE2.id}/xet-lai-lo-trinh`);
        const jg: any = await thuong(g);
        assert(g.status === 200 && Array.isArray(jg.em) && jg.em.length === 0, `GVCN: ${g.status} ${JSON.stringify(jg)}`);
      });
    } finally { conn.prepare(`UPDATE classes SET status = 'active' WHERE id = ?`).run(XL.fou.id); }
  });

  check('CL-k · emXetLaiLoTrinh: 3 và 12 lớp (nguồn + hiện tại) — cùng số câu SQL (≤ 4)', () => {
    /* Thêm lớp nguồn có em lệch: chèn thẳng lệnh đã thi hành + Final (đủ để đếm câu, không lặp lại cả luồng thi hành). */
    const them = () => {
      const nguon = lop('FOU', 8);
      const dich = lop('BE', 1);
      const { sid, cyc } = em(dich.id, { ma: 'BE' });
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'transferred', ?, ?)`).run(sid, nguon.id, nguon.start, NOW);
      conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
        VALUES (?,?,?, 'len_lop', 'cuoi-khoa', ?, ?, ?, 'da_chuyen', ?)`).run(sid, nguon.id, dich.id, THU_HAI, QL.userId, TODAY, NOW);
      const fid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?, 1, 'final', ?, 'planned', ?)`).run(cyc, sid, nguon.id, NOW).lastInsertRowid);
      tyLeFou(fid, 40);
    };
    /* Bảng chương trình + bảng lớp là bảng chung đã nhớ trong request (myWork nạp sẵn) — nạp trước, đếm phần riêng của hàm. */
    const dem = () => trongBoNho(() => { regular.allProgrammes(); permissions.bangLop(); return demCau(() => ck.emXetLaiLoTrinh(QL, null, TODAY)); });
    for (let i = 0; i < 3; i++) them();
    const n3 = dem();
    assert((ck.emXetLaiLoTrinh(QL, null, TODAY) as any[]).length >= 5, 'tiền đề: ≥ 5 lớp hiện tại');
    for (let i = 0; i < 9; i++) them();
    const n12 = dem();
    assert(n3 === n12 && n12 <= 4, `3 lớp: ${n3} câu · 12 lớp: ${n12} câu`);
  });

  // ---------------------------------------------------------------- T3 · web (C1, C2)
  check('CL-w1 · nhiều em (bảng thuần): tomTatChuyenEm chữ thường đầu, giữ MT0; chonGuiNhieuEm đếm Chuyển / Bỏ qua; chuTyLeXetLai làm tròn xuống', () => {
    const cases: [string, boolean, boolean, string[], string][] = [
      ['Trần Gia Huy', true, false, ['Đóng lộ trình FT LT1', 'MT0 → “MT0 · không dùng”', 'Huỷ 2 bài Mock chưa có điểm (MT1, MT2)', 'Giữ điểm đã có (MT0 L, R)'],
        'Trần Gia Huy · FT → Thường: đóng lộ trình FT LT1 · MT0 → “MT0 · không dùng” · huỷ 2 bài Mock chưa có điểm (MT1, MT2) · giữ điểm đã có (MT0 L, R)'],
      ['Vũ Thu Hà', false, true, ['Đóng lộ trình ELE, mở lộ trình FT LT1', 'Target 6.0 (GVCN ghi)'], 'Vũ Thu Hà · Thường → FT: đóng lộ trình ELE, mở lộ trình FT LT1 · target 6.0 (GVCN ghi)'],
      ['A', true, true, ['Giữ lộ trình FT LT1', '2 Case FT tự đóng'], 'A · FT → FT: giữ lộ trình FT LT1 · 2 Case FT tự đóng'],
      ['B', false, false, [], 'B · Thường → Thường: '],
    ];
    for (const [ten, nf, df, kc, mong] of cases) { const r = d.tomTatChuyenEm(ten, nf, df, kc); assert(r === mong, `${ten}: ${r}`); }
    const rows = [{ chon: true, lop: 5 }, { chon: true, lop: null }, { chon: false, lop: 7 }, { chon: true, lop: 9, xong: true }, { chon: false, lop: null }];
    const k = d.chonGuiNhieuEm(rows);
    assert(k.gui.length === 1 && k.gui[0] === rows[0] && k.boQua === 1, JSON.stringify(k));
    assert(d.chonGuiNhieuEm([]).gui.length === 0 && d.TOI_DA_NHIEU_EM === 50, 'rỗng / trần');
    for (const [nf, df, t, mong] of [[false, true, null, true], [false, true, 6, false], [false, true, 'KCK', false], [true, true, null, false], [false, false, null, false], [false, true, undefined, false]] as const) {
      assert(d.canHoiTarget(nf, df, t) === mong, `canHoiTarget(${nf}, ${df}, ${t})`);
    }
    for (const [t, mong] of [[0.4996, '49%'], [0.46, '46%'], [0.57, '57%'], [0.7, '70%'], [0.72, '72%'], [1, '100%']] as const) {
      assert(d.chuTyLeXetLai(t) === mong, `${t} → ${d.chuTyLeXetLai(t)}`);
    }
  });

  check('CL-w3 · ô Target (audit T5): "6,5" = 6.5, kck = KCK; trống "Chưa điền"; ngoài 0–9 / lẻ bước 0,5 / chữ → lỗi (cùng luật máy chủ)', () => {
    for (const [v, gt, loi] of [['6,5', 6.5, null], ['6.0', 6, null], [' kck ', 'KCK', null], ['0', 0, null], ['9', 9, null],
      ['', undefined, 'Chưa điền'], ['  ', undefined, 'Chưa điền'], ['12', undefined, 'band'], ['6.3', undefined, 'band'], ['abc', undefined, 'band'], ['-1', undefined, 'band']] as const) {
      const r = d.docOTarget(v);
      assert(r.giaTri === gt && (loi === null ? r.loi === null : !!r.loi?.includes(loi)), `"${v}" → ${JSON.stringify(r)}`);
    }
  });

  await checkAsync('CL-w2 · web: ChuyenLopPanel một ô gõ tên lớp (ChonNguoi ds + phuLopDich), không <select / ChonThang / PATCH, khối Khi chuyển từ máy chủ; nhiều em qua /transfer; ClassOverviewPage ?viec=xet-lai', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
    const doc = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
    const s = doc('web/src/modules/students/ChuyenLopPanel.tsx');
    assert(!/<select/.test(s) && !/ChonThang/.test(s) && !/api\.patch\(`\/lenh-chuyen/.test(s) && !/ngayThi/.test(s), 'còn select / ChonThang / PATCH / ngayThi');
    assert(/<ChonNguoi[\s\S]{0,200}ds=\{/.test(s) && /phuLopDich\(/.test(s) && /\.khiChuyen/.test(s) && /canhBao/.test(s), 'thiếu ô gõ tên lớp / khối Khi chuyển máy chủ');
    assert(/export function ChuyenLopNhieuEm/.test(s) && /xet-lai-lo-trinh/.test(s) && /chonGuiNhieuEm\(/.test(s) && /TOI_DA_NHIEU_EM/.test(s), 'thiếu panel nhiều em');
    assert(/ponytail:/.test(s), 'nhiều em: chú thích ponytail (mỗi em một lời gọi)');
    assert(/v === 'xet-lai'/.test(doc('web/src/modules/classes/ClassOverviewPage.tsx')), 'ClassOverviewPage chưa mở ?viec=xet-lai');
    /* OV-3b: PanelCuoiKhoa đã xoá (lớp thường dùng cách xem "Lộ trình tiếp theo"); TransitionPanel chỉ còn lớp FT; OTuan, OMt0 vẫn export cho BangLoTrinhTiep / ChuyenLopPanel. */
    const tp = doc('web/src/modules/classes/TransitionPanel.tsx');
    assert(!/cheDo|LUOI_THUONG|NORMAL_LADDER|deXuatGvcn|loTrinhTiep|Hệ thống gợi ý|Dự kiến thi|kieu="thang"|chuHopKetLuan|'Lên FT'|ATTEMPT_KIND_SHORT|[^.\w]ft \?|!ft\b/.test(tp), 'TransitionPanel còn nhánh lớp thường');
    assert(/export function OTuan/.test(tp) && /export function OMt0/.test(tp) && /'Chuyển lớp FT'/.test(tp) && /'Đổi lộ trình'/.test(tp), 'TransitionPanel FT: thiếu OTuan / OMt0 / hai hướng FT');
  });

  // ---------------------------------------------------------------- T3 vòng sửa 1 (R-C3, R-C4)
  await checkAsync('CL-n · R-C3: sửa lệnh `cho` qua /transfer KHÔNG gửi mucTieu / ngayThi → giữ muc_tieu, khong_cam_ket, ngay_thi của lệnh; gửi thì ghi giá trị mới', async () => {
    const ele = lop('ELE', 3);
    const ft2 = lop('FT', 2);
    const ft3 = lop('FT', 2);
    const x = em(ele.id, { ma: 'ELE' });
    const y = em(ele.id, { ma: 'ELE' });
    await voiMayChu(async (goi) => {
      const r1 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft2.id, tuan: THU_HAI, lyDo: 'R-C3', mucTieu: 6.5, ngayThi: '2027-03' });
      assert(r1.status === 200 && lenhCua(x.sid)?.muc_tieu === 6.5 && lenhCua(x.sid)?.ngay_thi === '2027-03', `tạo: ${r1.status} ${JSON.stringify(lenhCua(x.sid))}`);
      const r2 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft3.id, tuan: THU_HAI, lyDo: 'R-C3 sửa lớp' });
      const l = lenhCua(x.sid);
      assert(r2.status === 200 && l.lop_dich_id === ft3.id && l.muc_tieu === 6.5 && !l.khong_cam_ket && l.ngay_thi === '2027-03', `sửa không gửi: ${r2.status} ${JSON.stringify(l)}`);
      await post(goi, QL.userId, `/students/${y.sid}/transfer`, { toClassId: ft2.id, tuan: THU_HAI, lyDo: 'R-C3', mucTieu: 'KCK' });
      await post(goi, QL.userId, `/students/${y.sid}/transfer`, { toClassId: ft3.id, tuan: THU_HAI, lyDo: 'R-C3 sửa' });
      assert(lenhCua(y.sid).khong_cam_ket === 1 && lenhCua(y.sid).muc_tieu == null, `KCK giữ: ${JSON.stringify(lenhCua(y.sid))}`);
      const r3 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft3.id, tuan: THU_HAI, lyDo: 'R-C3 đổi', mucTieu: 7, ngayThi: '2027-05' });
      assert(r3.status === 200 && lenhCua(x.sid).muc_tieu === 7 && lenhCua(x.sid).ngay_thi === '2027-05', `gửi mới: ${JSON.stringify(lenhCua(x.sid))}`);
    });
  });

  await checkAsync('CL-o · lớp hiện tại: em chuyển từ lớp nguồn MB sang lớp CP → QL CP có việc "Xét lại lộ trình · {lớp CP}" + GET trả em; QL MB không', async () => {
    const nguon = lop('FOU', 8);
    const dichCp = lop('BE', 1, CP);
    const { sid, cyc } = em(dichCp.id, { ma: 'BE' });
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'transferred', ?, ?)`).run(sid, nguon.id, nguon.start, NOW);
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?,?,?, 'len_lop', 'cuoi-khoa', ?, ?, ?, 'da_chuyen', ?)`).run(sid, nguon.id, dichCp.id, THU_HAI, QL.userId, TODAY, NOW);
    const fid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?, 1, 'final', ?, 'planned', ?)`).run(cyc, sid, nguon.id, NOW).lastInsertRowid);
    tyLeFou(fid, 40);
    const co = (p: any) => (ck.emXetLaiLoTrinh(p, null, TODAY) as any[]).some((g) => g.lopId === dichCp.id && g.em.some((e: any) => e.studentId === sid));
    assert(co(P.cpManager) && co(P.admin), 'QL CP (lớp hiện tại) / QT phải có');
    assert(!co(QL), 'QL MB (lớp nguồn) không có');
    const it = viecXetLai(P.cpManager, null).find((x) => x.key === `xetlai:${dichCp.id}`);
    assert(it?.tieuDe === `Xét lại lộ trình · ${dichCp.code} · 1 em` && it.href === `/hoc-vien/lop/${dichCp.id}?viec=xet-lai`, JSON.stringify(it));
    assert(!viecXetLai(QL, null).some((x) => x.key === `xetlai:${dichCp.id}`), 'QL MB: không dòng việc');
    await voiMayChu(async (goi) => {
      const r = await goi(P.cpManager.userId, `/classes/${dichCp.id}/xet-lai-lo-trinh`);
      const j: any = await thuong(r);
      assert(r.status === 200 && j.lop?.id === dichCp.id && j.em.some((e: any) => e.studentId === sid), `QL CP GET: ${r.status} ${JSON.stringify(j)}`);
      const m: any = await thuong(await goi(QL.userId, `/classes/${dichCp.id}/xet-lai-lo-trinh`));
      assert(!(m.em ?? []).some((e: any) => e.studentId === sid), `QL MB GET: ${JSON.stringify(m)}`);
    });
  });

  // ---------------------------------------------------------------- Rà cuối (M1 / R-C6, M2, M3)
  check('CL-p · R-C6: em có lệnh `cho` Lên FT → xem trước dùng Target của lệnh "(đã quyết)"; chỉ LTT có Target (chưa lệnh) → "(GVCN ghi)"', () => {
    const ele = lop('ELE', 3);
    const ft = lop('FT', 2);
    const x = em(ele.id, { ma: 'ELE' });
    const r = lenh.raLenh(QL, { lopNguonId: ele.id, boiCanh: 'giua-khoa', tuanChung: THU_HAI, dongs: [{ studentId: x.sid, huong: 'fast_track', toClassId: ft.id, lyDo: 'R-C6', mucTieu: 7 }] });
    assert(!r.failed.length, JSON.stringify(r.failed));
    const v = luatLoTrinh.xemChuyenLop(QL, x.sid, ft.id);
    assert(v.targetSan === 7 && v.khiChuyen.includes('Target 7.0 (đã quyết)'), `lệnh: ${v.targetSan} ${JSON.stringify(v.khiChuyen)}`);
    const y = em(ele.id, { ma: 'ELE' });
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, muc_tieu, created_at, updated_at) VALUES (?,?, 'fast_track', 6.5, ?, ?)`).run(y.sid, ele.id, NOW, NOW);
    const vy = luatLoTrinh.xemChuyenLop(QL, y.sid, ft.id);
    assert(vy.khiChuyen.includes('Target 6.5 (GVCN ghi)'), `LTT: ${JSON.stringify(vy.khiChuyen)}`);
  });

  check('CL-q · M2: tỷ lệ 0.4996 → dòng việc "Xét lại" và panel cùng chữ (chuTyLeXetLai, 49%)', () => {
    const [a] = XL.ds;
    conn.prepare('UPDATE assessment_scores SET raw_score = 49.96 WHERE attempt_id = ?').run(XL.fin[0]);
    try {
      const e = ((ck.emXetLaiLoTrinh(QL, null, TODAY) as any[]).find((g) => g.lopId === BE2.id)?.em ?? []).find((z: any) => z.studentId === a.sid);
      const chu = d.chuTyLeXetLai(e.tyLe);
      assert(chu === '49%', `panel: ${chu} (${e.tyLe})`);
      const it = viecXetLai(QL).find((z) => z.key === `xetlai:${BE2.id}`);
      assert(it.contextLabel.includes(chu) && !it.contextLabel.includes('50%'), `việc: ${it.contextLabel}`);
    } finally { tyLeFou(XL.fin[0], 46); }
  });

  await checkAsync('CL-r · M3: sửa lệnh Lên FT (KCK) → lớp thường không gửi Target → KHÔNG mang Target / KCK; ngày thi vẫn giữ', async () => {
    const ele = lop('ELE', 3);
    const ft = lop('FT', 2);
    const ele2 = lop('ELE', 3);
    const x = em(ele.id, { ma: 'ELE' });
    await voiMayChu(async (goi) => {
      const r1 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ft.id, tuan: THU_HAI, lyDo: 'M3', mucTieu: 'KCK', ngayThi: '2027-03' });
      assert(r1.status === 200 && lenhCua(x.sid).khong_cam_ket === 1, `tạo: ${r1.status} ${JSON.stringify(lenhCua(x.sid))}`);
      const r2 = await post(goi, QL.userId, `/students/${x.sid}/transfer`, { toClassId: ele2.id, tuan: THU_HAI, lyDo: 'M3 về thường' });
      const l = lenhCua(x.sid);
      assert(r2.status === 200 && l.lop_dich_id === ele2.id && l.huong !== 'fast_track' && !l.khong_cam_ket && l.muc_tieu == null && l.ngay_thi === '2027-03', `sửa: ${r2.status} ${JSON.stringify(l)}`);
    });
  });
}
