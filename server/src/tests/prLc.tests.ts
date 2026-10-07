/**
 * PHÉP KIỂM PR-LCa — luồng cuối khoá lớp thường → lộ trình tiếp: mỗi quyết định nhập MỘT lần (kế hoạch 2026-10-07-pr-luong-chuyen-giao, LCa-0).
 * Lộ trình tiếp theo (`lo_trinh_tiep_theo`) là nguồn DUY NHẤT của Hướng + Target trước khi thi hành; Lên FT ở đâu cũng có MT0.
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
    thiHanh(l.classId);
    const lc = lenhCua(sid);
    assert(lc.trang_thai === 'da_chuyen', `tiền đề: lệnh đã thi hành — ${lc.trang_thai} ${lc.loi ?? ''}`);
    const ft = get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(ft?.route && ft.target_score === 6.5 && ft.baseline_source === 'mt0' && ft.baseline_attempt_id === m,
      `lộ trình FT: ${JSON.stringify({ route: ft?.route, target: ft?.target_score, nguon: ft?.baseline_source, dauVao: ft?.baseline_attempt_id, m })}`);
    const a = get('SELECT cycle_id, target_at_attempt FROM assessment_attempts WHERE id = ?', m);
    assert(a.cycle_id === ft.id && a.target_at_attempt === 6.5, `MT0: ${JSON.stringify(a)}`);
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
  check('LC-h · tuần Final, em chưa quyết: Công việc QL có "Chuyển tiếp lớp" và KHÔNG có "Chốt lên FT" cùng lớp', () => {
    const l = taoLop(2);
    const items = mywork.myWork(QL, { branchId: MB }).groups.flatMap((g: any) => g.items).filter((i: any) => i.classId === l.classId);
    assert(items.some((i: any) => i.group === 'placement'), `có Chuyển tiếp lớp: ${items.map((i: any) => i.group).join()}`);
    assert(!items.some((i: any) => i.group === 'chot_len_ft'), `không Chốt lên FT: ${items.map((i: any) => i.group).join()}`);
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
  check('LC-j · GVCN transitionPlan lớp thường: coTheGhiHuong, không coTheRaLenh, không ứng viên / lớp mới / tuần; QL có', () => {
    const l = taoLop(1);
    const gvcn = gvcnCua(l.classId, 4);
    const e = loi(() => transition.transitionPlan(gvcn, l.classId));
    assert(!e, `GVCN mở được: ${e?.message}`);
    const r = transition.transitionPlan(gvcn, l.classId);
    assert(r.coTheGhiHuong === true && r.coTheRaLenh === false, `cờ GVCN: ${JSON.stringify({ g: r.coTheGhiHuong, r: r.coTheRaLenh })}`);
    assert(!(r.candidates?.length) && r.goiYLopMoi == null && !(r.tuanChon?.length),
      `GVCN không nhận phần QL: ${JSON.stringify({ c: r.candidates?.length, m: r.goiYLopMoi, t: r.tuanChon })}`);
    const q = transition.transitionPlan(QL, l.classId);
    assert(q.coTheRaLenh === true && q.candidates?.length > 0, `QL: ${JSON.stringify({ r: q.coTheRaLenh, c: q.candidates?.length })}`);
  });

  // ------------------------------------------------------------------ (k) QL đã quyết → không đổi Hướng ở LTT (QM2, R2)
  check('LC-k · em có lệnh chờ: đổi Hướng ở LTT (một em / cả lớp) → 409, không lưu dòng nào; cùng Hướng + ghi chú được; QL sửa lệnh → LTT theo', () => {
    const l = taoLop(2);
    const [sid, ban] = l.sids;
    const gvcn = gvcnCua(l.classId, 5);
    raDu(l.classId, [{ studentId: sid, huong: 'len_lop', toClassId: BE }]);
    const e1 = loi(() => loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'hoc_lai' }));
    assert(e1?.status === 409, `GVCN một em → 409: ${e1?.status ?? 'không ném'} ${e1?.message ?? ''}`);
    const e2 = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: ban, huong: 'len_lop' }, { studentId: sid, huong: 'hoc_lai' }] }));
    assert(e2?.status === 409, `GVCN cả lớp → 409: ${e2?.status ?? 'không ném'} ${e2?.message ?? ''}`);
    assert(!ltt(ban, l.classId) && ltt(sid, l.classId)?.huong !== 'hoc_lai', 'cả lớp 409 → không lưu dòng nào');
    const e3 = loi(() => loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'hoc_lai' }));
    assert(e3?.status === 409, `QL đổi Hướng ở LTT cũng 409 (sửa qua lệnh): ${e3?.status ?? 'không ném'}`);
    const e4 = loi(() => loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'len_lop', ghiChu: 'g' }));
    assert(!e4, `cùng Hướng + ghi chú được: ${e4?.message}`);
    assert(ltt(sid, l.classId)?.ghi_chu === 'g', 'ghi chú đã lưu');
    lenh.suaLenh(QL, lenhCua(sid).id, { huong: 'fast_track', toClassId: FT, mucTieu: 6 });
    assert(lenhCua(sid).huong === 'fast_track' && ltt(sid, l.classId)?.huong === 'fast_track',
      `QL sửa lệnh: lệnh ${lenhCua(sid).huong} · LTT ${ltt(sid, l.classId)?.huong}`);
  });
}
