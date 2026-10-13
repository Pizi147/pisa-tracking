/**
 * PHÉP KIỂM PR-LCa — luồng cuối khoá lớp thường → lộ trình tiếp: mỗi quyết định nhập MỘT lần (kế hoạch 2026-10-07-pr-luong-chuyen-giao, LCa-0).
 * Lộ trình tiếp theo (`lo_trinh_tiep_theo`) là nguồn DUY NHẤT của Hướng + Target trước khi thi hành; Lên FT ở Lộ trình tiếp theo hoặc quyết định Cuối khoá đều có MT0.
 * Lớp nguồn: FOU tuần Final (tuần 8/8), khoá Target 6.0. Lớp chuyển đến: một FT, một BE (lên lớp), một FOU (học lại) — đầu khoá.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLcTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  console.log('\nPR-LCa · luồng cuối khoá → lộ trình tiếp (mỗi quyết định nhập một lần)');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const transition: any = await import('../classes/transition.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const migrate: any = await import('../migrate/prLc.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];   // tuần sau — tuần hợp lệ sớm nhất của lệnh

  /* Lớp chuyển đến: khai giảng tuần này (tuần 1) → là ứng viên hợp lệ của `transitionPlan`, còn chạy lúc thi hành. */
  const lopDich = (code: string, kind: string, ft = false) => (intake.createClass(P.admin, {
    code, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: thu2(1), startPeriodId: week.ensurePeriod(thu2(1)).id,
  }) as any).id as number;
  const FT = lopDich('MB FT LCA1', 'FT', true);
  const BE = lopDich('MB BE LCA1', 'BE');
  const FOU = lopDich('MB FOU LCA1', 'FOU');

  let seq = 0;
  /** Lớp FOU đang ở tuần `tuan` (8 = tuần Final), `soEm` em có ghi danh + khoá Target `target` — mẫu `taoLop` của prMt0. */
  const taoLop = (soEm: number, target: number | null = 6, tuan = 8) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB LCA-${seq}`, branchId: MB, kind: 'FOU', isFastTrack: false, startDate: thu2(tuan), startPeriodId: week.ensurePeriod(thu2(tuan)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `LCA-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(tuan), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, ?, 'active', ?)`)
        .run(sid, target, thu2(tuan), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, sids };
  };

  /** GV thứ `n` của MB làm GVCN lớp `classId` — mẫu `ganGv` / `gvKhac` của prMt0. */
  const gvcnCua = (classId: number, n: number) => {
    const uid = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1, '2026-01-01', 'active', ?)`)
      .run(uid, classId, new Date().toISOString());
    return loadPrincipal(uid);
  };
  const ltt = (sid: number, classId: number) => get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', sid, classId);
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  const mt0Cua = (sid: number) => conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`).all(sid) as any[];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const hanhTrinh = (sid: number) => get(`SELECT title FROM journey_events WHERE student_id = ? AND event_type = 'next_step' ORDER BY id DESC LIMIT 1`, sid)?.title as string | undefined;
  const ra = (lop: number, dongs: any[]) => lenh.raLenh(QL, { lopNguonId: lop, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs });
  const raDu = (lop: number, dongs: any[]) => {
    const r = ra(lop, dongs);
    assert(!r.failed.length, `tiền đề: ra quyết định không lỗi — ${JSON.stringify(r.failed)}`);
    return r;
  };
  const demCau = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  /**
   * Thi hành lệnh đến hạn của lớp `lop` vào Thứ Hai tuần sau ("hôm nay" = ngày đó, như prS5fA `chay`). Lệnh `cho` của lớp khác tạm đặt
   * `thu_ngay` = ngày chạy để lượt quét bỏ qua (40 nhóm/lượt), xong trả lại nguyên giá trị cũ — không huỷ dữ liệu của bộ kiểm khác.
   */
  const thiHanh = (lop: number) => {
    const khac = conn.prepare(`SELECT id, thu_ngay FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND lop_nguon_id != ?`).all(lop) as any[];
    const dat = conn.prepare('UPDATE lenh_chuyen_lop SET thu_ngay = ? WHERE id = ?');
    for (const x of khac) dat.run(THU_HAI, x.id);
    const cu = getConfig('demo_date');
    setConfig('demo_date', THU_HAI);
    try { lenh.thiHanhLenhDenHan(THU_HAI); } finally {
      setConfig('demo_date', cu);
      for (const x of khac) dat.run(x.thu_ngay ?? null, x.id);
    }
  };

  // ------------------------------------------------------------------ (a) Lên FT chỉ quyết ở Chuyển tiếp → vẫn có MT0 + LTT (L1)
  check('LC-a · QL ra lệnh Lên FT cho em chưa có Lộ trình tiếp theo → MT0 chờ ở tuần Final + LTT hướng Lên FT', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: 6 }]);
    const ds = mt0Cua(sid);
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    assert(ds.length === 1 && ds[0].status === 'planned', `MT0: ${JSON.stringify(ds)}`);
    const tuan = get('SELECT week_start w FROM report_periods WHERE id = ?', ds[0].planned_period_id)?.w;
    assert(tuan === tuanFinal, `tuần MT0 ${tuan} · tuần Final ${tuanFinal}`);
    assert(ltt(sid, l.classId)?.huong === 'fast_track', `LTT: ${JSON.stringify(ltt(sid, l.classId))}`);
  });

  // ------------------------------------------------------------------ (b) Target Lên FT lấy từ khoá khi lệnh không gửi (T2)
  check('LC-b · Lên FT không Target: khoá 6.0 → lệnh 6; khoá KCK → lệnh KCK; không Target nào → "Ghi Target (hoặc KCK)"', () => {
    const l = taoLop(3);
    const [co6, kck, trong] = l.sids;
    conn.prepare(`UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 1 WHERE student_id = ? AND status = 'active'`).run(kck);
    conn.prepare(`UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 0 WHERE student_id = ? AND status = 'active'`).run(trong);
    const r = ra(l.classId, l.sids.map((sid) => ({ studentId: sid, huong: 'fast_track', toClassId: FT })));
    assert(!r.failed.some((f: any) => f.studentId === co6 || f.studentId === kck), `em có Target khoá không lỗi: ${JSON.stringify(r.failed)}`);
    assert(lenhCua(co6)?.muc_tieu === 6 && !lenhCua(co6)?.khong_cam_ket, `khoá 6.0: ${JSON.stringify(lenhCua(co6))}`);
    assert(lenhCua(kck)?.khong_cam_ket === 1 && lenhCua(kck)?.muc_tieu == null, `khoá KCK: ${JSON.stringify(lenhCua(kck))}`);
    const f = r.failed.find((x: any) => x.studentId === trong);
    assert(f?.message === 'Ghi Target (hoặc KCK)', `không Target: ${JSON.stringify(r.failed)}`);
    assert(!lenhCua(trong), 'không Target → không lệnh');
  });

  // ------------------------------------------------------------------ (c) Target ghi ở LTT thắng Target khoá
  check('LC-c · LTT Lên FT Target 6.5 → lệnh Lên FT không gửi Target mang 6.5', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track', mucTieu: 6.5 });
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT }]);
    assert(lenhCua(sid)?.muc_tieu === 6.5, `lệnh: ${JSON.stringify(lenhCua(sid))}`);
  });

  // ------------------------------------------------------------------ (d) lệnh đổi hướng → MT0 theo ngay; sửa lại → cùng MT0 (L5, R3)
  check('LC-d · LTT Lên FT → lệnh Học lại: MT0 huỷ ngay, LTT Học lại; sửa lệnh về Lên FT → CÙNG MT0 mở lại; huỷ lệnh không đổi LTT', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const m = mt0Cua(sid)[0]?.id as number;
    assert(!!m, 'tiền đề: ghi Lên FT có MT0');
    raDu(l.classId, [{ studentId: sid, huong: 'hoc_lai', toClassId: FOU }]);
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', m).status === 'cancelled', 'lệnh Học lại → MT0 chưa điểm huỷ ngay');
    assert(ltt(sid, l.classId)?.huong === 'hoc_lai', `LTT sau lệnh Học lại: ${ltt(sid, l.classId)?.huong}`);
    assert(hanhTrinh(sid)?.startsWith('QL quyết: ') && hanhTrinh(sid)!.includes('(GVCN: '), `Hành trình nêu hướng GVCN (R9): ${hanhTrinh(sid)}`);
    const id = lenhCua(sid).id as number;
    lenh.suaLenh(QL, id, { huong: 'fast_track', toClassId: FT, mucTieu: 6 });
    const ds = mt0Cua(sid);
    assert(ds.length === 1 && ds[0].id === m && ds[0].status === 'planned', `sửa về Lên FT: ${JSON.stringify(ds.map((x) => [x.id, x.status]))} (MT0 cũ ${m})`);
    assert(ltt(sid, l.classId)?.huong === 'fast_track', `LTT sau sửa: ${ltt(sid, l.classId)?.huong}`);
    lenh.huyLenh(QL, id, 'Đổi ý');
    assert(ltt(sid, l.classId)?.huong === 'fast_track', `huỷ lệnh không đổi LTT: ${ltt(sid, l.classId)?.huong}`);
  });

  // ------------------------------------------------------------------ (e) thi hành không xoá chi tiết LTT (L3)
  check('LC-e · LTT Lên lớp (ghi chú "x", lớp dự kiến BE) → lệnh → thi hành: ghi chú + lớp dự kiến còn nguyên, có da_ap_dung_luc', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop', lopDuKienId: BE, ghiChu: 'x' });
    raDu(l.classId, [{ studentId: sid, huong: 'len_lop', toClassId: BE }]);
    thiHanh(l.classId);
    const lc = lenhCua(sid);
    assert(lc.trang_thai === 'da_chuyen', `tiền đề: lệnh đã thi hành — ${lc.trang_thai} ${lc.loi ?? ''}`);
    const r = ltt(sid, l.classId);
    assert(r?.ghi_chu === 'x', `ghi chú: ${r?.ghi_chu}`);
    assert(r?.lop_du_kien_id === BE, `lớp dự kiến: ${r?.lop_du_kien_id}`);
    assert(!!r?.da_ap_dung_luc, 'da_ap_dung_luc');
  });

  // ------------------------------------------------------------------ (f) thi hành Lên FT: Target lệnh vào lộ trình FT và MT0
  check('LC-f · LTT Lên FT (khoá 6.0) + lệnh Target 6.5 → thi hành: lộ trình FT 6.5, đầu vào MT0, MT0 target_at_attempt 6.5', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const m = mt0Cua(sid)[0]?.id as number;
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: 6.5 }]);
    /* MT0 Target cũ (dữ liệu trước PR-LCa) → lúc thi hành vẫn lấy Target lộ trình FT (LCa-3). */
    conn.prepare('UPDATE assessment_attempts SET target_at_attempt = 6 WHERE id = ?').run(m);
    thiHanh(l.classId);
    const lc = lenhCua(sid);
    assert(lc.trang_thai === 'da_chuyen', `tiền đề: lệnh đã thi hành — ${lc.trang_thai} ${lc.loi ?? ''}`);
    const ft = get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(ft?.route && ft.target_score === 6.5 && ft.baseline_source === 'mt0' && ft.baseline_attempt_id === m,
      `lộ trình FT: ${JSON.stringify({ route: ft?.route, target: ft?.target_score, nguon: ft?.baseline_source, dauVao: ft?.baseline_attempt_id, m })}`);
    const a = get('SELECT cycle_id, target_at_attempt FROM assessment_attempts WHERE id = ?', m);
    assert(a.cycle_id === ft.id && a.target_at_attempt === 6.5, `MT0: ${JSON.stringify(a)}`);
  });

  // ------------------------------------------------------------------ (m) thi hành Lên FT KCK: không số tạm vào LTT
  check('LC-m · lệnh Lên FT KCK → thi hành: LTT muc_tieu trống (không số tạm), lộ trình FT KCK', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: 'KCK' }]);
    thiHanh(l.classId);
    const lc = lenhCua(sid);
    assert(lc.trang_thai === 'da_chuyen', `tiền đề: lệnh đã thi hành — ${lc.trang_thai} ${lc.loi ?? ''}`);
    const ft = get(`SELECT route, target_score, khong_cam_ket FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(ft?.route && ft.khong_cam_ket === 1 && ft.target_score == null, `lộ trình FT: ${JSON.stringify(ft)}`);
    assert(ltt(sid, l.classId)?.muc_tieu == null, `LTT muc_tieu: ${ltt(sid, l.classId)?.muc_tieu}`);
  });

  // ------------------------------------------------------------------ OV-9: lệnh Lên FT mang Target + KCK (KCK là dấu riêng, Target giữ)
  check('OV9 · lệnh Lên FT "6.5 KCK" → lưu muc_tieu 6.5 + khong_cam_ket 1; thi hành: lộ trình FT Target 6.5 + KCK, lượt MT có Target, LTT giữ 6.5', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: '6.5 KCK' }]);
    assert(lenhCua(sid)?.muc_tieu === 6.5 && lenhCua(sid)?.khong_cam_ket === 1, `lệnh: ${JSON.stringify(lenhCua(sid))}`);
    thiHanh(l.classId);
    assert(lenhCua(sid).trang_thai === 'da_chuyen', `tiền đề: lệnh đã thi hành — ${lenhCua(sid).trang_thai} ${lenhCua(sid).loi ?? ''}`);
    const ft = get(`SELECT id, route, target_score, khong_cam_ket FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(ft?.route && ft.khong_cam_ket === 1 && ft.target_score === 6.5, `lộ trình FT: ${JSON.stringify(ft)}`);
    assert(!get(`SELECT 1 FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND (target_at_attempt IS NULL OR target_at_attempt != 6.5)`, ft.id), 'lượt MT mất Target');
    assert(ltt(sid, l.classId)?.muc_tieu === 6.5, `LTT muc_tieu: ${ltt(sid, l.classId)?.muc_tieu}`);
  });

  // ------------------------------------------------------------------ (g) transitionPlan điền sẵn từ LTT dù chưa lớp dự kiến
  check('LC-g · transitionPlan `dienSan`: LTT Lên FT chưa lớp dự kiến → { fast_track, Target khoá, lớp FT duy nhất | null }; có lớp dự kiến → lớp đó; không LTT → null', () => {
    const l = taoLop(3);
    const [chuaLop, khongLtt, coLop] = l.sids;
    loTrinh.ghiLoTrinhTiep(QL, chuaLop, { huong: 'fast_track' });
    loTrinh.ghiLoTrinhTiep(QL, coLop, { huong: 'fast_track', lopDuKienId: FT });
    const r = transition.transitionPlan(QL, l.classId);
    const ftUngVien = (r.candidates as any[]).filter((c) => c.ft);
    const duyNhat = ftUngVien.length === 1 ? ftUngVien[0].id : null;
    const em = (sid: number) => r.students.find((x: any) => x.id === sid);
    const a = em(chuaLop)?.dienSan;
    assert(a && a.huong === 'fast_track' && a.mucTieu === 6 && a.lopDichId === duyNhat, `chưa lớp dự kiến: ${JSON.stringify(a)} (FT duy nhất ${duyNhat})`);
    const c = em(coLop)?.dienSan;
    assert(c && c.huong === 'fast_track' && c.mucTieu === 6 && c.lopDichId === FT, `có lớp dự kiến: ${JSON.stringify(c)}`);
    assert(em(khongLtt)?.dienSan === null, `không LTT: ${JSON.stringify(em(khongLtt)?.dienSan)}`);
  });

  // ------------------------------------------------------------------ (h) một việc QL mỗi lớp mỗi lúc (T3)
  /* PR-LCb (đảo): hai việc gộp thành MỘT "Chốt lộ trình" — vẫn một việc QL mỗi lớp mỗi lúc. */
  check('LC-h · tuần Final, em chưa quyết: Công việc QL có đúng MỘT việc "Chốt lộ trình" cùng lớp, KHÔNG có "Chuyển tiếp lớp"', () => {
    const l = taoLop(2);
    const items = mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items).filter((i: any) => i.classId === l.classId);
    assert(items.filter((i: any) => i.group === 'chot_len_ft').length === 1, `một Chốt lộ trình: ${items.map((i: any) => i.group).join()}`);
    assert(!items.some((i: any) => i.group === 'placement'), `không Chuyển tiếp lớp: ${items.map((i: any) => i.group).join()}`);
  });

  // ------------------------------------------------------------------ (i) số câu SQL ra lệnh không tăng theo số em
  check('LC-i · ra lệnh Lên lớp + Lên FT (Target từ khoá) 3 em và 30 em: cùng số câu SQL, không dòng lỗi', () => {
    const it = taoLop(3);
    const nhieu = taoLop(30);
    const dongs = (l: { sids: number[] }, soFt: number) => l.sids.map((sid, i) => (i < soFt
      ? { studentId: sid, huong: 'fast_track', toClassId: FT } : { studentId: sid, huong: 'len_lop', toClassId: BE }));
    let ra3: any, ra30: any;
    const a = demCau(() => { ra3 = ra(it.classId, dongs(it, 1)); });
    const b = demCau(() => { ra30 = ra(nhieu.classId, dongs(nhieu, 10)); });
    assert(a === b, `3 em ${a} câu · 30 em ${b} câu`);
    assert(!ra3.failed.length && !ra30.failed.length, `dòng lỗi: ${JSON.stringify([...ra3.failed, ...ra30.failed].slice(0, 3))}`);
  });

  // ------------------------------------------------------------------ (j) GVCN mở được dữ liệu panel gộp, không phần của QL
  check('LC-j · GVCN transitionPlan lớp thường: OV-3b không còn coTheGhiHuong (laGvcn), không coTheRaLenh, không ứng viên / lớp mới / tuần; QL có', () => {
    const l = taoLop(1);
    const gvcn = gvcnCua(l.classId, 4);
    const e = loi(() => transition.transitionPlan(gvcn, l.classId));
    assert(!e, `GVCN mở được: ${e?.message}`);
    const r = transition.transitionPlan(gvcn, l.classId);
    assert(!('coTheGhiHuong' in r) && r.laGvcn === true && r.coTheRaLenh === false, `cờ GVCN: ${JSON.stringify({ g: r.laGvcn, r: r.coTheRaLenh })}`);
    assert(!(r.candidates?.length) && r.goiYLopMoi == null && !(r.tuanChon?.length),
      `GVCN không nhận phần QL: ${JSON.stringify({ c: r.candidates?.length, m: r.goiYLopMoi, t: r.tuanChon })}`);
    const q = transition.transitionPlan(QL, l.classId);
    assert(q.coTheRaLenh === true && q.candidates?.length > 0, `QL: ${JSON.stringify({ r: q.coTheRaLenh, c: q.candidates?.length })}`);
  });

  // ------------------------------------------------------------------ (k) QL đã quyết → không đổi Hướng ở LTT (QM2, R2)
  check('LC-k · em có lệnh chờ: đổi Hướng ở LTT (một em / cả lớp) → 409, không lưu dòng nào; cùng Hướng + ghi chú được; đổi Target Lên FT (GVCN, QL) → 409; QL sửa lệnh → LTT theo', () => {
    const l = taoLop(2);
    const [sid, ban] = l.sids;
    const gvcn = gvcnCua(l.classId, 5);
    raDu(l.classId, [{ studentId: sid, huong: 'len_lop', toClassId: BE }]);
    /* OV-3b: GVCN thôi ghi Hướng → 403 trước mọi luật khác; luật 409 kiểm bằng Quản lý. */
    const e1 = loi(() => loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'hoc_lai' }));
    assert(e1?.status === 403, `GVCN một em → 403: ${e1?.status ?? 'không ném'} ${e1?.message ?? ''}`);
    const e2 = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: ban, huong: 'len_lop' }, { studentId: sid, huong: 'hoc_lai' }] }));
    assert(e2?.status === 409, `cả lớp → 409: ${e2?.status ?? 'không ném'} ${e2?.message ?? ''}`);
    assert(!ltt(ban, l.classId) && ltt(sid, l.classId)?.huong !== 'hoc_lai', 'cả lớp 409 → không lưu dòng nào');
    const e3 = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'hoc_lai' }));
    assert(e3?.status === 409, `QL đổi Hướng ở LTT cũng 409 (sửa qua lệnh): ${e3?.status ?? 'không ném'}`);
    const e4 = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop', ghiChu: 'g' }));
    assert(!e4, `cùng Hướng + ghi chú được: ${e4?.message}`);
    assert(ltt(sid, l.classId)?.ghi_chu === 'g', 'ghi chú đã lưu');
    lenh.suaLenh(QL, lenhCua(sid).id, { huong: 'fast_track', toClassId: FT, mucTieu: 6 });
    assert(lenhCua(sid).huong === 'fast_track' && ltt(sid, l.classId)?.huong === 'fast_track',
      `QL sửa lệnh: lệnh ${lenhCua(sid).huong} · LTT ${ltt(sid, l.classId)?.huong}`);
    assert(hanhTrinh(sid)?.startsWith('QL quyết: ') && !hanhTrinh(sid)!.includes('(GVCN:'), `hướng cũ là của QL → không "(GVCN: …)" (R9): ${hanhTrinh(sid)}`);
    const e6 = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', ghiChu: 'h' }] }));
    assert(!e6 && ltt(sid, l.classId)?.muc_tieu === 6, `GVCN cả lớp giữ Target lệnh được: ${e6?.message} · ${ltt(sid, l.classId)?.muc_tieu}`);
    const e7 = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track', mucTieu: 7 }));
    assert(e7?.status === 409 && ltt(sid, l.classId)?.muc_tieu === 6, `GVCN Target 7 ≠ lệnh 6 → 409: ${e7?.status ?? 'không ném'} · ${ltt(sid, l.classId)?.muc_tieu}`);
    /* R11: Quản lý cũng không đổi Target của quyết định Lên FT ở LTT (sửa quyết định); gửi lại đúng Target đó được. */
    const e7q = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', mucTieu: 7 }] }));
    assert(e7q?.status === 409 && ltt(sid, l.classId)?.muc_tieu === 6, `QL Target 7 ≠ lệnh 6 → 409: ${e7q?.status ?? 'không ném'} · ${ltt(sid, l.classId)?.muc_tieu}`);
    const e7r = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', mucTieu: 6 }] }));
    assert(!e7r && ltt(sid, l.classId)?.muc_tieu === 6, `QL gửi lại Target 6 được: ${e7r?.status ?? ''} ${e7r?.message ?? ''}`);
    /* QL đổi Lên FT → Lên lớp: lệnh còn Target cũ — Target chỉ so khi lệnh Lên FT, GVCN sửa ghi chú vẫn được. */
    lenh.suaLenh(QL, lenhCua(sid).id, { huong: 'len_lop', toClassId: BE });
    assert(lenhCua(sid).huong === 'len_lop', `tiền đề: lệnh Lên lớp — ${lenhCua(sid).huong}`);
    const e8 = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop', ghiChu: 'k' }));
    assert(!e8 && ltt(sid, l.classId)?.ghi_chu === 'k', `Lên lớp (Target lệnh ${lenhCua(sid).muc_tieu}): GVCN sửa ghi chú được — ${e8?.status ?? ''} ${e8?.message ?? ''}`);
  });

  // ------------------------------------------------------------------ (l) Target trên bảng cả lớp: chỉ Quản lý (R5)
  check('LC-l · PUT /classes/:id/lo-trinh-tiep có mucTieu: GVCN → 403, không lưu; QL → Target ghi đè; không gửi → giữ Target cũ', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    const gvcn = gvcnCua(l.classId, 6);
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track', mucTieu: 6 });
    const e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: sid, huong: 'fast_track', mucTieu: 7 }] }));
    assert(e?.status === 403 && ltt(sid, l.classId)?.muc_tieu === 6, `GVCN gửi Target: ${e?.status ?? 'không ném'} · ${ltt(sid, l.classId)?.muc_tieu}`);
    loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', mucTieu: 7 }] });
    assert(ltt(sid, l.classId)?.muc_tieu === 7, `QL ghi Target: ${ltt(sid, l.classId)?.muc_tieu}`);
    const e2 = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', mucTieu: 6.3 }] }));
    assert(e2?.status === 400 && ltt(sid, l.classId)?.muc_tieu === 7, `Target 6.3 → 400 (R10): ${e2?.status ?? 'không ném'} ${e2?.message ?? ''}`);
    loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: sid, huong: 'fast_track', ghiChu: 'n' }] });
    assert(ltt(sid, l.classId)?.muc_tieu === 7, `không gửi Target → giữ: ${ltt(sid, l.classId)?.muc_tieu}`);
  });

  // ------------------------------------------------------------------ (n) Migrate: quyết định `cho` có từ trước PR-LCa
  check('LC-n · migrate prLc: lệnh chờ Lên FT (dữ liệu cũ) mà LTT Lên lớp → LTT Lên FT + Target lệnh, giữ ghi chú, một MT0; chạy lại không đổi gì', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop', lopDuKienId: BE, ghiChu: 'gc' });
    /* Lệnh ghi thẳng như trước PR-LCa — không đi qua raLenh nên LTT chưa theo lệnh, chưa có MT0. */
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, muc_tieu, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, ?, 'fast_track', 'cuoi-khoa', ?, 6.5, ?, ?, 'cho', ?)`).run(sid, l.classId, FT, THU_HAI, QL.userId, TODAY, new Date().toISOString());
    assert(ltt(sid, l.classId)?.huong === 'len_lop' && !mt0Cua(sid).length, 'tiền đề: LTT Lên lớp, chưa MT0');
    const soHanhTrinh = () => get(`SELECT COUNT(*) AS n FROM journey_events WHERE student_id = ? AND event_type = 'next_step'`, sid).n as number;
    const a1: string[] = [];
    migrate.migratePrLc(conn, a1);
    const t1 = ltt(sid, l.classId);
    assert(t1?.huong === 'fast_track' && t1.lop_du_kien_id === FT && t1.muc_tieu === 6.5 && t1.ghi_chu === 'gc',
      `LTT theo lệnh, giữ ghi chú: ${JSON.stringify({ h: t1?.huong, lop: t1?.lop_du_kien_id, mt: t1?.muc_tieu, gc: t1?.ghi_chu })}`);
    const m1 = mt0Cua(sid);
    assert(m1.length === 1 && m1[0].status === 'planned' && m1[0].target_at_attempt === 6.5, `một MT0 chờ, Target 6.5: ${JSON.stringify(m1.map((m) => [m.status, m.target_at_attempt]))}`);
    assert(hanhTrinh(sid)?.startsWith('QL quyết: '), `Hành trình "QL quyết": ${hanhTrinh(sid)}`);
    assert(a1.length === 1 && /^PR-LC: /.test(a1[0]), `báo đúng một dòng PR-LC: ${a1.join(' | ')}`);
    const n1 = soHanhTrinh();
    const a2: string[] = [];
    migrate.migratePrLc(conn, a2);
    assert(!a2.length && soHanhTrinh() === n1 && mt0Cua(sid).length === 1, `lần hai: ${JSON.stringify({ a2, hanhTrinh: [n1, soHanhTrinh()], mt0: mt0Cua(sid).length })}`);
  });

  // ------------------------------------------------------------------ (o) Migrate: đủ các nhánh "lệch", hai lớp một lượt
  check('LC-o · migrate prLc: chưa LTT (Lên lớp; Lên FT → MT0), Lên FT chỉ lệch Target, Lên FT KCK (chưa LTT → Target trống; LTT có số → giữ, không chọn), em đã khớp không đụng; hai lớp, hai người ra lệnh một lượt; lần hai không đổi gì', () => {
    const a = taoLop(4);
    const b = taoLop(2);
    const [lenLop, lenFt, lechTarget, khop] = a.sids;
    const [kck, kckSo] = b.sids;
    const lopCua = (sid: number) => (b.sids.includes(sid) ? b.classId : a.classId);
    loTrinh.ghiLoTrinhTiep(QL, lechTarget, { huong: 'fast_track', mucTieu: 7 });
    loTrinh.ghiLoTrinhTiep(QL, kckSo, { huong: 'fast_track', mucTieu: 6 });
    raDu(a.classId, [{ studentId: khop, huong: 'len_lop', toClassId: BE }]);
    /* Lệnh ghi thẳng như trước PR-LCa (không qua raLenh). Lớp b: người ra lệnh khác (Quản trị). */
    const tho = conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, muc_tieu, khong_cam_ket, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, ?, ?, 'cuoi-khoa', ?, ?, ?, ?, ?, 'cho', ?)`);
    const luc = new Date().toISOString();
    tho.run(lenLop, a.classId, BE, 'len_lop', THU_HAI, null, 0, QL.userId, TODAY, luc);
    tho.run(lenFt, a.classId, FT, 'fast_track', THU_HAI, 6.5, 0, QL.userId, TODAY, luc);
    tho.run(lechTarget, a.classId, FT, 'fast_track', THU_HAI, 6.5, 0, QL.userId, TODAY, luc);
    tho.run(kck, b.classId, FT, 'fast_track', THU_HAI, null, 1, P.admin.userId, TODAY, luc);
    tho.run(kckSo, b.classId, FT, 'fast_track', THU_HAI, null, 1, P.admin.userId, TODAY, luc);
    assert(!ltt(lenLop, a.classId) && !ltt(lenFt, a.classId) && !mt0Cua(lenFt).length, 'tiền đề: hai em chưa có LTT, chưa MT0');
    /** Ảnh một em: số Hành trình next_step, số nhật ký LTT, số MT0, giờ sửa LTT. */
    const anh = (sid: number) => JSON.stringify([
      get(`SELECT COUNT(*) AS n FROM journey_events WHERE student_id = ? AND event_type = 'next_step'`, sid).n,
      get(`SELECT COUNT(*) AS n FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.next_step'`, sid).n,
      mt0Cua(sid).length, ltt(sid, lopCua(sid))?.updated_at ?? null,
    ]);
    const tatCa = () => [...a.sids, ...b.sids].map(anh).join();
    const khop0 = anh(khop);
    const kckSo0 = anh(kckSo);
    const hanhTrinhLech0 = get(`SELECT COUNT(*) AS n FROM journey_events WHERE student_id = ? AND event_type = 'next_step'`, lechTarget).n;

    const a1: string[] = [];
    migrate.migratePrLc(conn, a1);
    assert(a1.length === 1 && a1[0].includes('theo 4 quyết định'), `đúng 4 lệnh lệch (em khớp không chọn): ${a1.join(' | ')}`);
    const t0 = ltt(lenLop, a.classId);
    assert(t0?.huong === 'len_lop' && t0.lop_du_kien_id === BE, `chưa LTT → Lên lớp: ${JSON.stringify({ h: t0?.huong, lop: t0?.lop_du_kien_id })}`);
    assert(hanhTrinh(lenLop)?.startsWith('QL quyết: ') && !hanhTrinh(lenLop)!.includes('(GVCN:'), `Hành trình "QL quyết" không "(GVCN: …)": ${hanhTrinh(lenLop)}`);
    const t1 = ltt(lenFt, a.classId);
    const m1 = mt0Cua(lenFt);
    assert(t1?.huong === 'fast_track' && t1.lop_du_kien_id === FT && t1.muc_tieu === 6.5, `chưa LTT → Lên FT 6.5: ${JSON.stringify({ h: t1?.huong, lop: t1?.lop_du_kien_id, mt: t1?.muc_tieu })}`);
    assert(m1.length === 1 && m1[0].status === 'planned' && m1[0].target_at_attempt === 6.5, `MT0 chờ 6.5: ${JSON.stringify(m1.map((m) => [m.status, m.target_at_attempt]))}`);
    const m2 = mt0Cua(lechTarget);
    assert(ltt(lechTarget, a.classId)?.muc_tieu === 6.5 && m2.length === 1 && m2[0].target_at_attempt === 6.5,
      `lệch Target 7 → 6.5 (LTT + MT0): ${ltt(lechTarget, a.classId)?.muc_tieu} · ${JSON.stringify(m2.map((m) => m.target_at_attempt))}`);
    assert(get(`SELECT COUNT(*) AS n FROM journey_events WHERE student_id = ? AND event_type = 'next_step'`, lechTarget).n === hanhTrinhLech0, 'cùng Hướng → không thêm Hành trình');
    const t3 = ltt(kck, b.classId);
    assert(t3?.huong === 'fast_track' && t3.muc_tieu == null, `KCK → LTT Target trống: ${JSON.stringify({ h: t3?.huong, mt: t3?.muc_tieu })}`);
    assert(get(`SELECT actor_user_id AS u FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.next_step' ORDER BY id DESC LIMIT 1`, kck).u === P.admin.userId,
      'nhật ký ghi đúng người ra lệnh lớp b');
    assert(anh(khop) === khop0, `em đã khớp không đụng: ${khop0} → ${anh(khop)}`);
    assert(anh(kckSo) === kckSo0 && ltt(kckSo, b.classId)?.muc_tieu === 6, `lệnh KCK, LTT 6 → không chọn, giữ 6 (I3): ${anh(kckSo)} · ${ltt(kckSo, b.classId)?.muc_tieu}`);

    const sau1 = tatCa();
    const a2: string[] = [];
    migrate.migratePrLc(conn, a2);
    assert(!a2.length && tatCa() === sau1, `lần hai không ghi gì: ${JSON.stringify({ a2, truoc: sau1, sau: tatCa() })}`);
  });

  // ------------------------------------------------------------------ (p) khôi phục quyết định → LTT + MT0 theo lại (I1)
  check('LC-p · lệnh Lên FT → huỷ → GVCN ghi Lên lớp (MT0 huỷ) → khôi phục lệnh: LTT Lên FT + Target lệnh, CÙNG MT0 chờ lại, Hành trình "QL quyết: … (GVCN: …)"', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    const gvcn = gvcnCua(l.classId, 4);
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: 6.5 }]);
    const m = mt0Cua(sid)[0]?.id as number;
    const id = lenhCua(sid).id as number;
    assert(lenh.huyNhieuLenh(QL, [id], 'Đổi ý').ok.includes(id), 'tiền đề: huỷ được');
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop' });   // OV-3b: chỉ Quản lý ghi Hướng (khôi phục vẫn coi Hướng ghi sau khi huỷ là không phải quyết định chờ)
    assert(ltt(sid, l.classId)?.huong === 'len_lop' && get('SELECT status FROM assessment_attempts WHERE id = ?', m).status === 'cancelled',
      'tiền đề: hết lệnh chờ → ghi Lên lớp, MT0 huỷ');
    const kp = lenh.khoiPhucLenh(QL, [id]);
    assert(kp.ok.includes(id), `khôi phục: ${JSON.stringify(kp.failed)}`);
    const t = ltt(sid, l.classId);
    assert(t?.huong === 'fast_track' && t.muc_tieu === 6.5 && t.lop_du_kien_id === FT, `LTT theo lệnh: ${JSON.stringify({ h: t?.huong, mt: t?.muc_tieu, lop: t?.lop_du_kien_id })}`);
    const ds = mt0Cua(sid);
    assert(ds.length === 1 && ds[0].id === m && ds[0].status === 'planned' && ds[0].target_at_attempt === 6.5,
      `cùng MT0 chờ lại: ${JSON.stringify(ds.map((x) => [x.id, x.status, x.target_at_attempt]))} (MT0 cũ ${m})`);
    assert(hanhTrinh(sid)?.startsWith('QL quyết: ') && hanhTrinh(sid)!.includes('(GVCN: '), `Hành trình: ${hanhTrinh(sid)}`);
  });

  // ------------------------------------------------------------------ (q) đề xuất Lên FT duyệt trong tuần Final → lệnh cuối khoá, có MT0 (planning 08/10)
  check('LC-q · GVCN đề xuất Lên FT, QL duyệt: tuần Final dời sớm (tuần 7/8, chưa hết khoá) → lệnh cuối khoá Lên FT, LTT Lên FT, một MT0 ở tuần Final; tuần 5 → vẫn giữa khoá', () => {
    const { duyetYeuCau } = yeuCau;
    /* Tuần Final mặc định là tuần cuối (đã "hết khoá") — chỉ khi QL dời Final sớm mới có tuần Final mà chưa hết khoá. */
    const l = taoLop(1, 6, 7);
    conn.prepare('UPDATE classes SET final_week_override = 7 WHERE id = ?').run(l.classId);
    const sid = l.sids[0];
    const gvcn = gvcnCua(l.classId, 5);
    const yc = lenh.guiDeXuatChuyenLop(gvcn, sid, { toClassId: FT, lyDo: 'Em đủ sức lên FT' });
    duyetYeuCau(QL, yc.id, { duLieu: { lopDichId: FT, tuan: THU_HAI } });   // không Target → Target khoá 6.0
    const lc = lenhCua(sid);
    assert(lc?.boi_canh === 'cuoi-khoa' && lc.huong === 'fast_track' && lc.lop_dich_id === FT, `lệnh: ${JSON.stringify(lc)}`);
    assert(ltt(sid, l.classId)?.huong === 'fast_track', `LTT: ${JSON.stringify(ltt(sid, l.classId))}`);
    const ds = mt0Cua(sid);
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    assert(ds.length === 1 && ds[0].status === 'planned', `MT0: ${JSON.stringify(ds)}`);
    const tuan = get('SELECT week_start w FROM report_periods WHERE id = ?', ds[0].planned_period_id)?.w;
    assert(tuan === tuanFinal, `tuần MT0 ${tuan} · tuần Final ${tuanFinal}`);

    const l5 = taoLop(1, 6, 5);
    const s5 = l5.sids[0];
    const yc5 = lenh.guiDeXuatChuyenLop(gvcnCua(l5.classId, 6), s5, { toClassId: FT, lyDo: 'Em đủ sức lên FT' });
    duyetYeuCau(QL, yc5.id, { duLieu: { lopDichId: FT, tuan: THU_HAI, mucTieu: 6 } });
    const l5c = lenhCua(s5);
    assert(l5c?.boi_canh === 'giua-khoa' && l5c.huong === 'fast_track', `tuần 5: ${JSON.stringify(l5c)}`);
  });

  // ------------------------------------------------------------------ (r) quyết định QL không xoá Ngày xem lại; Bảo lưu mang ngày của lệnh (I2)
  check('LC-r · LTT Chưa quyết + Ngày xem lại → QL ra lệnh Lên lớp: ngày còn nguyên; lệnh Bảo lưu ngày X → LTT ngày X; huỷ + khôi phục → vẫn X', () => {
    const l = taoLop(2);
    const [a, b] = l.sids;
    const xemLai = addDays(TODAY, 10);
    const X = addDays(TODAY, 60);
    loTrinh.ghiLoTrinhTiep(QL, a, { huong: 'chua_quyet', ngayXemLai: xemLai });
    raDu(l.classId, [{ studentId: a, huong: 'len_lop', toClassId: BE }, { studentId: b, huong: 'bao_luu', ngayXemLai: X, lyDo: 'Gia đình đi xa' }]);
    assert(ltt(a, l.classId)?.huong === 'len_lop' && ltt(a, l.classId)?.ngay_xem_lai === xemLai, `em a: ${JSON.stringify(ltt(a, l.classId))}`);
    assert(ltt(b, l.classId)?.huong === 'bao_luu' && ltt(b, l.classId)?.ngay_xem_lai === X, `em b: ${JSON.stringify(ltt(b, l.classId))}`);
    const id = lenhCua(b).id as number;
    lenh.huyNhieuLenh(QL, [id], 'Đổi ý');
    conn.prepare('UPDATE lo_trinh_tiep_theo SET ngay_xem_lai = NULL WHERE student_id = ? AND class_id = ?').run(b, l.classId);
    assert(lenh.khoiPhucLenh(QL, [id]).ok.includes(id), 'tiền đề: khôi phục được');
    assert(ltt(b, l.classId)?.ngay_xem_lai === X, `khôi phục → ngày của lệnh: ${ltt(b, l.classId)?.ngay_xem_lai}`);
  });

  // ------------------------------------------------------------------ (s) lệnh hướng khác không xoá Target LTT; quay về Lên FT lấy lại Target đó (I3)
  check('LC-s · LTT Lên FT 6.5 (khoá 6.0) → lệnh Học lại: LTT Target vẫn 6.5; sửa lệnh về Lên FT không gửi Target → lệnh 6.5; ghi lại cùng Target → được', () => {
    const l = taoLop(1);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track', mucTieu: 6.5 });
    raDu(l.classId, [{ studentId: sid, huong: 'hoc_lai', toClassId: FOU }]);
    assert(ltt(sid, l.classId)?.huong === 'hoc_lai' && ltt(sid, l.classId)?.muc_tieu === 6.5, `sau Học lại: ${JSON.stringify(ltt(sid, l.classId))}`);
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT }]);
    assert(lenhCua(sid)?.muc_tieu === 6.5 && ltt(sid, l.classId)?.muc_tieu === 6.5, `về Lên FT: lệnh ${lenhCua(sid)?.muc_tieu} · LTT ${ltt(sid, l.classId)?.muc_tieu}`);
    /* Lệnh KCK: LTT giữ 6.5; ghi lại LTT với Target đang lưu không bị chặn "Quản lý đã quyết". */
    raDu(l.classId, [{ studentId: sid, huong: 'fast_track', toClassId: FT, mucTieu: 'KCK' }]);
    assert(ltt(sid, l.classId)?.muc_tieu === 6.5, `lệnh KCK giữ Target LTT: ${ltt(sid, l.classId)?.muc_tieu}`);
    const e = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track', mucTieu: 6.5, ghiChu: 'Ổn' }));
    assert(!e, `ghi lại cùng Target: ${e?.message}`);
  });
}
