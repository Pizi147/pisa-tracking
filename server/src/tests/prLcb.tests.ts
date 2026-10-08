/**
 * PHÉP KIỂM PR-LCb — panel "Lộ trình tiếp theo" (lớp thường) + việc "Chốt lộ trình" + "Xét lại lộ trình" (kế hoạch .superpowers/sdd/lcb/plan.md, B5).
 * T1: MỘT việc Quản lý "Chốt lộ trình · {lớp}" cho MỌI lớp thường đang mở (thay "Chốt lên FT" + "Chuyển tiếp lớp"), hạn Chủ nhật trước tuần Final,
 * không hết hạn — xong khi mọi em đang học có quyết định chuyển lớp đang chờ. Theo hành vi trên DB kiểm, không khớp chuỗi nguồn.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLcbTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  console.log('\nPR-LCb · Chốt lộ trình (một việc mỗi lớp thường) · Xét lại lộ trình · panel Lộ trình tiếp theo');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const tongQuan: any = await import('../worklist/tongQuan.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  const NOW = new Date().toISOString();

  /** Chi nhánh riêng (chỉ lớp của bộ kiểm này) — để Tổng quan có đúng MỘT lớp và đếm câu SQL không lẫn lớp seed. */
  const chiNhanh = (code: string) => Number(conn.prepare(`INSERT INTO branches (code, name, created_at) VALUES (?, ?, ?)`).run(code, `Chi nhánh ${code}`, NOW).lastInsertRowid);

  let seq = 0;
  /** Lớp thường `kind` đang ở tuần `tuan`, `soEm` em có ghi danh + khoá Target 6.0 — mẫu `taoLop` của prMt0 / prLc. */
  const taoLop = (kind: 'FOU' | 'BE' | 'ELE' | 'PREFOU' | 'FT', tuan: number, soEm: number, branchId = MB) => {
    seq += 1;
    const ft = kind === 'FT';
    const start = thu2(tuan);
    const lop = intake.createClass(P.admin, {
      code: `${get('SELECT code FROM branches WHERE id = ?', branchId).code} LCB-${seq} ${kind}`, branchId, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: start, startPeriodId: week.ensurePeriod(start).id,
    });
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `LCB-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branchId, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, start, NOW);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, 6, ?, 'active', ?)`)
        .run(sid, ft ? 'LT1' : null, ft ? null : kind, start, NOW);
      sids.push(sid);
    }
    if (!ft && soEm) regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, code: lop.code as string, sids, start };
  };
  /** Hạn đúng luật: Chủ nhật trước tuần Final (tuần `final` tính từ tuần khai giảng `start`). */
  const hanTuan = (start: string, final: number) => addDays(start, 7 * (final - 1) - 1);
  const ganGv = (classId: number, n: number, skill: string | null, core = false) => {
    const uid = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`)
      .run(uid, classId, skill, core ? 1 : 0, NOW);
    return loadPrincipal(uid);
  };
  const items = (p: any, branchId: number | null = MB) => mywork.myWork(p, branchId ? { branchId } : {}).groups.flatMap((g: any) => g.items) as any[];
  const viecChot = (p: any, classId: number, branchId: number | null = MB) => items(p, branchId).filter((i) => i.group === 'chot_len_ft' && i.classId === classId);
  const demCau = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const BE_DICH = (intake.createClass(P.admin, { code: 'MB LCB BE DICH', branchId: MB, kind: 'BE', isFastTrack: false, startDate: thu2(1), startPeriodId: week.ensurePeriod(thu2(1)).id }) as any).id as number;

  // ------------------------------------------------------------------ (a) cửa sổ + hạn + vai
  check('LCb-a · FOU tuần 6 (thứ Hai = hạn − 13): QL có đúng MỘT việc "Chốt lộ trình · {lớp}", hạn = CN tuần 7, chưa quá hạn; tuần 5 → không; GVCN, GVBM → không', () => {
    const l = taoLop('FOU', 6, 2);
    const v = viecChot(QL, l.classId);
    const han = hanTuan(l.start, 8);
    assert(v.length === 1 && v[0].tieuDe === `Chốt lộ trình · ${l.code}` && v[0].due === han && v[0].urgency !== 'overdue', JSON.stringify(v));
    assert(han === d.hanChotLenFt(schedule.classProgress(l.classId).finalWeekStart), `hạn ${han} ≠ hanChotLenFt`);
    assert(v[0].href === `/hoc-vien/lop/${l.classId}?viec=lo-trinh-ca-lop` && v[0].actionLabel === 'Lộ trình tiếp theo' && v[0].count === 2, JSON.stringify(v[0]));
    const som = taoLop('FOU', 5, 1);
    assert(!viecChot(QL, som.classId).length, 'tuần 5 (hạn − 20) chưa có việc');
    const gvcn = ganGv(l.classId, 7, null, true);
    const gvbm = ganGv(l.classId, 8, 'reading');
    assert(!viecChot(gvcn, l.classId, null).length && !viecChot(gvbm, l.classId, null).length, 'GVCN, GVBM không có việc');
  });

  // ------------------------------------------------------------------ (b) tuần Final: một việc, đỏ, xong khi đủ lệnh
  check('LCb-b · FOU tuần Final: MỘT việc quá hạn, không "placement"; đủ hướng chưa lệnh → "4 em · đủ hướng, chưa xác nhận"; ra lệnh đủ → hết; huỷ một → "1 em chưa xác nhận"', () => {
    const l = taoLop('FOU', 8, 4);
    const cuaLop = () => items(QL).filter((i) => i.classId === l.classId);
    let v = cuaLop();
    assert(v.length === 1 && v[0].group === 'chot_len_ft' && v[0].urgency === 'overdue', JSON.stringify(v.map((i) => [i.group, i.urgency])));
    assert(!items(QL).some((i) => i.group === 'placement'), 'còn nhóm placement');
    assert(v[0].reason === '4 em chưa có hướng', v[0].reason);
    for (const sid of l.sids) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'len_lop' });
    v = viecChot(QL, l.classId);
    assert(v.length === 1 && v[0].reason === '4 em · đủ hướng, chưa xác nhận' && v[0].contextLabel === v[0].reason && v[0].count === 4, JSON.stringify(v));
    const r = lenh.raLenh(QL, { lopNguonId: l.classId, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: l.sids.map((sid) => ({ studentId: sid, huong: 'len_lop', toClassId: BE_DICH })) });
    assert(!r.failed.length, JSON.stringify(r.failed));
    assert(!viecChot(QL, l.classId).length, 'đủ lệnh → hết việc');
    const id = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, l.sids[0]).id;
    lenh.huyLenh(QL, id, 'LCb-b huỷ');
    v = viecChot(QL, l.classId);
    assert(v.length === 1 && v[0].reason === '1 em chưa xác nhận' && v[0].count === 1, JSON.stringify(v));
  });

  // ------------------------------------------------------------------ (c) mọi lớp thường; hạn theo tuần Final thật
  check('LCb-c · Pre FOU: có việc, hạn CN tuần 4; BE: CN tuần 9; FOU Final dời tuần 6 → CN tuần 5; lớp FT → không', () => {
    const pf = taoLop('PREFOU', 3, 1);
    const be = taoLop('BE', 8, 1);
    const fou = taoLop('FOU', 4, 1);
    conn.prepare('UPDATE classes SET final_week_override = 6 WHERE id = ?').run(fou.classId);
    const ft = taoLop('FT', 3, 1);
    const due = (l: { classId: number }) => viecChot(QL, l.classId).map((i) => i.due);
    assert(JSON.stringify(due(pf)) === JSON.stringify([hanTuan(pf.start, 5)]), `Pre FOU: ${due(pf)} · ${hanTuan(pf.start, 5)}`);
    assert(JSON.stringify(due(be)) === JSON.stringify([hanTuan(be.start, 10)]), `BE: ${due(be)}`);
    assert(JSON.stringify(due(fou)) === JSON.stringify([hanTuan(fou.start, 6)]), `FOU dời Final: ${due(fou)}`);
    assert(!items(QL).some((i) => i.classId === ft.classId && i.group === 'chot_len_ft'), 'lớp FT không có');
  });

  // ------------------------------------------------------------------ (d) chữ dòng việc
  check('LCb-d · chuViecChotLoTrinh: chưa hướng / GVCN đề xuất / đủ hướng / xác nhận một phần / chờ duyệt', () => {
    const c = (tong: number, chuaLenh: number, chuaHuong: number, deXuat: number, choDuyet: number) => d.chuViecChotLoTrinh({ tong, chuaLenh, chuaHuong, deXuat, choDuyet });
    const bang: [string, string][] = [
      [c(8, 8, 2, 6, 0), '8 em · 2 em chưa có hướng · GVCN đã đề xuất 6'],
      [c(7, 7, 7, 0, 0), '7 em chưa có hướng'],
      [c(6, 6, 0, 6, 0), '6 em · đủ hướng, chưa xác nhận'],
      [c(4, 1, 0, 1, 0), '1 em chưa xác nhận'],
      [c(4, 2, 0, 0, 2), '2 em chờ duyệt đề xuất'],
      [c(1, 1, 0, 0, 1), '1 em chờ duyệt đề xuất'],
      [c(3, 3, 2, 0, 1), '3 em · 2 em chưa có hướng · 1 em chờ duyệt đề xuất'],
      [c(5, 3, 0, 2, 1), '2 em chưa xác nhận · 1 em chờ duyệt đề xuất'],
      [c(6, 6, 0, 5, 1), '6 em · đủ hướng, chưa xác nhận · 1 em chờ duyệt đề xuất'],
    ];
    for (const [co, can] of bang) assert(co === can, `"${co}" ≠ "${can}"`);
  });

  // ------------------------------------------------------------------ (e) hai đường: chỉ số + Tổng quan = Công việc
  check('LCb-e · metricSet(lop-chua-chot-len-ft) = lớp của việc myWork; Tổng quan MỘT dòng "Chốt lộ trình · {lớp}" (quá hạn khi qua hạn); hv-chua-co-lenh-chuyen → 404', () => {
    const ids = metrics.metricSet(QL, 'lop-chua-chot-len-ft', { branchId: MB }).ids as number[];
    const lop = [...new Set(items(QL).filter((i) => i.group === 'chot_len_ft').map((i) => i.classId as number))].sort((a, b) => a - b);
    assert(JSON.stringify(ids) === JSON.stringify(lop), `chỉ số ${ids} · việc ${lop}`);
    const cn = chiNhanh('LCBE');
    const l = taoLop('FOU', 6, 1, cn);
    let dong = (tongQuan.tongQuanQuanLy(P.admin, { branchId: cn }).canXuLy as any[]).filter((x) => x.metricId === 'lop-chua-chot-len-ft');
    assert(dong.length === 1 && dong[0].truoc === `Chốt lộ trình · ${l.code}` && dong[0].han?.ngay === hanTuan(l.start, 8) && dong[0].han?.loai === 'chot-len-ft'
      && dong[0].trangThai !== 'qua-han' && dong[0].den === `/hoc-vien/lop/${l.classId}?viec=lo-trinh-ca-lop` && dong[0].nut === 'Lộ trình tiếp theo', JSON.stringify(dong));
    conn.prepare('UPDATE classes SET final_week_override = 6 WHERE id = ?').run(l.classId);   // Final = tuần này → hạn đã qua
    dong = (tongQuan.tongQuanQuanLy(P.admin, { branchId: cn }).canXuLy as any[]).filter((x) => x.metricId === 'lop-chua-chot-len-ft');
    assert(dong.length === 1 && dong[0].trangThai === 'qua-han', JSON.stringify(dong));
    const tatCa = tongQuan.tongQuanQuanLy(QL, { branchId: MB }).canXuLy as any[];
    assert(!tatCa.some((x) => x.metricId === 'hv-chua-co-lenh-chuyen') && tatCa.filter((x) => x.metricId === 'lop-chua-chot-len-ft').length === 1, tatCa.map((x) => x.metricId).join());
    let ma: number | null = null;
    try { metrics.metricSet(QL, 'hv-chua-co-lenh-chuyen', { branchId: MB }); } catch (e: any) { ma = e.status ?? -1; }
    assert(ma === 404, `hv-chua-co-lenh-chuyen phải 404: ${ma}`);
    assert(!(d.METRICS as any[]).some((m) => m.id === 'hv-chua-co-lenh-chuyen'), 'sổ chỉ số còn hv-chua-co-lenh-chuyen');
  });

  // ------------------------------------------------------------------ (m) số câu SQL không theo số lớp (phần Chốt)
  check('LCb-m · lopChoChotLoTrinh: 3 lớp và 12 lớp (cùng chi nhánh) — cùng số câu SQL', () => {
    const cn = chiNhanh('LCBM');
    for (let i = 0; i < 3; i++) taoLop(i % 2 ? 'BE' : 'FOU', i % 2 ? 8 : 6, 2, cn);
    let a3: any[] = [];
    /* Trong bộ nhớ request (như GET thật): `demoToday`, bảng lớp đọc một lần. */
    const a = demCau(() => trongBoNho(() => { a3 = lenh.lopChoChotLoTrinh(P.admin, cn, TODAY); }));
    for (let i = 0; i < 9; i++) taoLop(i % 3 === 0 ? 'PREFOU' : 'FOU', i % 3 === 0 ? 3 : 7, 2, cn);
    let a12: any[] = [];
    const b = demCau(() => trongBoNho(() => { a12 = lenh.lopChoChotLoTrinh(P.admin, cn, TODAY); }));
    assert(a3.length === 3 && a12.length === 12, `số lớp ${a3.length} · ${a12.length}`);
    assert(a === b, `3 lớp ${a} câu · 12 lớp ${b} câu`);
  });

  // ================================================================== T3 · API panel + dữ liệu (B3, B4)
  const transition: any = await import('../classes/transition.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const migLcb: any = await import('../migrate/prLcb.ts');
  const fs = await import('node:fs');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const lopMB = (code: string, kind: string, ft = false, branchId = MB) => (intake.createClass(P.admin, {
    code, branchId, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: thu2(1), startPeriodId: week.ensurePeriod(thu2(1)).id,
  }) as any).id as number;
  const FT_DICH = lopMB('MB LCB FT DICH', 'FT', true);
  const ltt = (sid: number, classId: number) => get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', sid, classId);
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  /** Thi hành lệnh lớp `lop` ở thứ Hai tuần sau (mẫu `thiHanh` của prLc): lệnh lớp khác tạm đặt `thu_ngay` để lượt quét bỏ qua, xong trả lại. */
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

  // ------------------------------------------------------------------ (h) transitionPlan: lớp chuyển đến mọi chi nhánh, mã lớp + ngày ra lệnh
  check('LCb-h · transitionPlan: lenh.lopDichMa + ngayRaLenh; candidates có lớp chi nhánh khác + branchCode; GVCN không candidates; dienSan ưu tiên lớp cùng chi nhánh', () => {
    /* Lớp nguồn ở chi nhánh riêng có đúng MỘT lớp BE → điền sẵn lớp đó dù ứng viên BE mọi chi nhánh nhiều hơn một. */
    const cn = chiNhanh('LCBH');
    const l = taoLop('FOU', 8, 1, cn);
    const BE_CN = lopMB('LCBH BE 01', 'BE', false, cn);
    loTrinh.ghiLoTrinhTiep(P.admin, l.sids[0], { huong: 'len_lop' });   // chưa lớp dự kiến
    const r = transition.transitionPlan(P.admin, l.classId);
    const cand = r.candidates as any[];
    assert(cand.find((c) => c.id === BE_DICH)?.branchCode === 'MB', `ứng viên chi nhánh khác: ${JSON.stringify(cand.find((c) => c.id === BE_DICH))}`);
    assert(cand.find((c) => c.id === BE_CN)?.branchCode === 'LCBH', `ứng viên cùng chi nhánh: ${JSON.stringify(cand.find((c) => c.id === BE_CN))}`);
    assert(cand.filter((c) => !c.ft && c.programmeCode === 'BE').length > 1, 'tiền đề: nhiều lớp BE (mọi chi nhánh)');
    assert(r.students[0]?.dienSan?.lopDichId === BE_CN, `dienSan ưu tiên cùng chi nhánh: ${JSON.stringify(r.students[0]?.dienSan)}`);

    /* Lớp MB: QL ra lệnh sang lớp chi nhánh khác → GVCN (không ứng viên) vẫn đọc mã lớp chuyển đến + ngày ra lệnh. */
    const m = taoLop('FOU', 8, 1);
    const r0 = lenh.raLenh(QL, { lopNguonId: m.classId, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: m.sids[0], huong: 'len_lop', toClassId: BE_CN }] });
    assert(!r0.failed.length, `tiền đề: lệnh sang lớp chi nhánh khác — ${JSON.stringify(r0.failed)}`);
    assert((transition.transitionPlan(QL, m.classId).candidates as any[]).some((c) => c.id === BE_CN), 'QL MB thấy ứng viên chi nhánh khác');
    const gvcn = ganGv(m.classId, 9, null, true);
    const rg = transition.transitionPlan(gvcn, m.classId);
    const lb = rg.students[0]?.lenh;
    assert(!(rg.candidates as any[]).length, `GVCN: ${rg.candidates.length} ứng viên`);
    assert(lb?.lopDichMa === 'LCBH BE 01' && lb?.ngayRaLenh === TODAY, `lenh: ${JSON.stringify(lb)}`);
    /* Lớp dự kiến LTT = lớp chi nhánh khác (từ lệnh): GVCN sửa ghi chú vẫn lưu được — giá trị đang lưu không bị kiểm "cùng chi nhánh" lại. */
    const e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, m.classId, { items: [{ studentId: m.sids[0], huong: 'len_lop', ghiChu: 'Ghi chú sau lệnh' }] }));
    assert(!e && ltt(m.sids[0], m.classId)?.ghi_chu === 'Ghi chú sau lệnh' && ltt(m.sids[0], m.classId)?.lop_du_kien_id === BE_CN, `GVCN sửa ghi chú: ${e?.message}`);
    /* Lớp dự kiến MỚI ở chi nhánh khác vẫn bị chặn như cũ. */
    const e2 = loi(() => loTrinh.ghiLoTrinhTiep(P.admin, l.sids[0], { huong: 'len_lop', lopDuKienId: BE_DICH }));
    assert(e2 && /lớp dự kiến/.test(e2.message), `lớp dự kiến mới chi nhánh khác: ${e2?.message}`);
  });

  // ------------------------------------------------------------------ (i) huongGvcn: đề xuất GVCN còn sau quyết định của Quản lý
  check('LCb-i · GVCN ghi Học lại → QL ra lệnh Lên FT: LTT fast_track, huongGvcn hoc_lai; GVCN sửa ghi chú → vẫn hoc_lai; QL "Lưu hướng" em khác → huongGvcn không đổi', () => {
    const l = taoLop('FOU', 8, 3);
    const [a, b, c] = l.sids;
    const gvcn = ganGv(l.classId, 10, null, true);
    loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: a, huong: 'hoc_lai' }, { studentId: b, huong: 'len_lop' }] });
    assert(ltt(a, l.classId)?.huong_gvcn === 'hoc_lai' && ltt(b, l.classId)?.huong_gvcn === 'len_lop', `GVCN ghi: ${ltt(a, l.classId)?.huong_gvcn} · ${ltt(b, l.classId)?.huong_gvcn}`);
    const r = lenh.raLenh(QL, { lopNguonId: l.classId, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: a, huong: 'fast_track', toClassId: FT_DICH }] });
    assert(!r.failed.length, JSON.stringify(r.failed));
    assert(ltt(a, l.classId)?.huong === 'fast_track' && ltt(a, l.classId)?.huong_gvcn === 'hoc_lai', `sau lệnh: ${JSON.stringify(ltt(a, l.classId))}`);
    loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: a, huong: 'fast_track', ghiChu: 'Em cố gắng' }] });
    assert(ltt(a, l.classId)?.ghi_chu === 'Em cố gắng' && ltt(a, l.classId)?.huong_gvcn === 'hoc_lai', `GVCN sửa ghi chú: ${JSON.stringify(ltt(a, l.classId))}`);
    loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [{ studentId: b, huong: 'hoc_lai' }, { studentId: c, huong: 'len_lop' }] });
    assert(ltt(b, l.classId)?.huong === 'hoc_lai' && ltt(b, l.classId)?.huong_gvcn === 'len_lop' && ltt(c, l.classId)?.huong_gvcn == null,
      `QL Lưu hướng: ${ltt(b, l.classId)?.huong_gvcn} · ${ltt(c, l.classId)?.huong_gvcn}`);
    const plan = transition.transitionPlan(QL, l.classId);
    const v = (sid: number) => plan.students.find((x: any) => x.id === sid)?.loTrinhTiep?.huongGvcn ?? null;
    assert(v(a) === 'hoc_lai' && v(b) === 'len_lop' && v(c) === null, `API huongGvcn: ${v(a)} · ${v(b)} · ${v(c)}`);
    assert(loTrinh.layLoTrinhTiep(QL, a).banGhi?.huongGvcn === 'hoc_lai', 'layLoTrinhTiep.banGhi.huongGvcn');
  });

  // ------------------------------------------------------------------ (j) Minor (b): đề xuất GVCN duyệt trong tuần Final dời sớm sang lớp thường
  check('LCb-j · FOU Final dời tuần 6 (nay tuần 7): duyệt đề xuất sang FOU khác → cuối khoá Học lại; sang BE → Lên lớp; sang ELE / Pre FOU → lỗi, không lệnh, thẻ còn chờ; không dời (tuần 5) → giữa khoá', () => {
    const FOU2 = lopMB('MB LCB FOU DICH', 'FOU');
    const ELE = lopMB('MB LCB ELE DICH', 'ELE');
    const PF = lopMB('MB LCB PREFOU DICH', 'PREFOU');
    const l = taoLop('FOU', 7, 4);
    conn.prepare('UPDATE classes SET final_week_override = 6 WHERE id = ?').run(l.classId);
    const gvcn = ganGv(l.classId, 11, null, true);
    const deXuat = (sid: number, toClassId: number) => {
      const yc = lenh.guiDeXuatChuyenLop(gvcn, sid, { toClassId, lyDo: 'LCb-j' });
      return { yc, e: loi(() => yeuCau.duyetYeuCau(QL, yc.id, { duLieu: { lopDichId: toClassId, tuan: THU_HAI } })) };
    };
    const [a, b, c, e] = l.sids;
    const ra = deXuat(a, FOU2).e ?? deXuat(b, BE_DICH).e;
    assert(!ra, `tiền đề: duyệt FOU / BE không lỗi — ${ra?.message}`);
    const la = lenhCua(a); const lb = lenhCua(b);
    assert(la?.boi_canh === 'cuoi-khoa' && la.huong === 'hoc_lai' && ltt(a, l.classId)?.huong === 'hoc_lai', `FOU: ${JSON.stringify([la?.boi_canh, la?.huong, ltt(a, l.classId)?.huong])}`);
    assert(lb?.boi_canh === 'cuoi-khoa' && lb.huong === 'len_lop' && ltt(b, l.classId)?.huong === 'len_lop', `BE: ${JSON.stringify([lb?.boi_canh, lb?.huong, ltt(b, l.classId)?.huong])}`);
    for (const [sid, dich] of [[c, ELE], [e, PF]] as const) {
      const { yc, e: err } = deXuat(sid, dich);
      assert(err && /chương trình kế tiếp/.test(String(err.message)), `lệch bậc phải lỗi: ${err?.message}`);
      assert(!lenhCua(sid) && get('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', yc.id).trang_thai === 'cho' && !ltt(sid, l.classId), `không lệnh / thẻ chờ / LTT: ${sid}`);
    }
    const l5 = taoLop('FOU', 5, 1);
    const g5 = ganGv(l5.classId, 12, null, true);
    const yc5 = lenh.guiDeXuatChuyenLop(g5, l5.sids[0], { toClassId: BE_DICH, lyDo: 'LCb-j tuần 5' });
    yeuCau.duyetYeuCau(QL, yc5.id, { duLieu: { lopDichId: BE_DICH, tuan: THU_HAI } });
    assert(lenhCua(l5.sids[0])?.boi_canh === 'giua-khoa', `tuần 5: ${lenhCua(l5.sids[0])?.boi_canh}`);
  });

  // ------------------------------------------------------------------ (k) Dự kiến thi giữ như cũ khi Lên FT (§7)
  check('LCb-k · Lên FT không gửi Dự kiến thi: khoá exam_month 2027-03 → lộ trình FT 2027-03; LTT thang_thi 2027-05 → lệnh ngay_thi 2027-05 → FT 2027-05', () => {
    const l = taoLop('FOU', 8, 2);
    const [a, b] = l.sids;
    conn.prepare(`UPDATE learning_cycles SET exam_month = '2027-03' WHERE status = 'active' AND student_id IN (?, ?)`).run(a, b);
    loTrinh.ghiLoTrinhTiep(QL, b, { huong: 'fast_track', thangThi: '2027-05' });
    const r = lenh.raLenh(QL, { lopNguonId: l.classId, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [a, b].map((sid) => ({ studentId: sid, huong: 'fast_track', toClassId: FT_DICH })) });
    assert(!r.failed.length, JSON.stringify(r.failed));
    assert(lenhCua(a).ngay_thi == null && lenhCua(b).ngay_thi === '2027-05', `lệnh ngay_thi: ${lenhCua(a).ngay_thi} · ${lenhCua(b).ngay_thi}`);
    thiHanh(l.classId);
    assert(lenhCua(a).trang_thai === 'da_chuyen' && lenhCua(b).trang_thai === 'da_chuyen', `tiền đề thi hành: ${lenhCua(a).trang_thai} ${lenhCua(a).loi ?? ''}`);
    const ft = (sid: number) => get(`SELECT route, exam_month FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(ft(a)?.route && ft(a).exam_month === '2027-03', `em a: ${JSON.stringify(ft(a))}`);
    assert(ft(b)?.route && ft(b).exam_month === '2027-05', `em b: ${JSON.stringify(ft(b))}`);
  });

  // ------------------------------------------------------------------ (l) migrate prLcb: thêm cột + điền bù dòng GVCN ghi; chạy lặp được
  /* Phán quyết R-B1: migratePrLcb chạy TRƯỚC migratePrLc; điền bù huong_gvcn = huong cho dòng LTT của em KHÔNG có lệnh cuối khoá đang chờ
     (dòng đó là của GVCN — kể cả GVCN đã đổi người); em có lệnh chờ để trống (hướng có thể đã là của Quản lý). */
  check('LCb-l · migrate prLcb (chạy trước prLc): thêm cột huong_gvcn; dòng em không có lệnh chờ được điền (cả khi GVCN đã đổi); em có lệnh chờ để trống; chạy lần hai không đổi gì', () => {
    const mg = fs.readFileSync(new URL('../../../../server/src/migrate.ts', import.meta.url), 'utf8');
    assert(mg.indexOf('migratePrLcb(conn, applied)') > 0 && mg.indexOf('migratePrLcb(conn, applied)') < mg.indexOf('migratePrLc(conn, applied)'), 'migratePrLcb phải chạy trước migratePrLc');
    const l = taoLop('FOU', 8, 2);
    const [a, b] = l.sids;
    const gvcn = ganGv(l.classId, 13, null, true);
    loTrinh.ghiLoTrinhTiep(gvcn, a, { huong: 'hoc_lai' });
    loTrinh.ghiLoTrinhTiep(gvcn, b, { huong: 'hoc_lai' });
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND user_id = ?`).run(l.classId, gvcn.userId);   // GVCN đã đổi người
    const r0 = lenh.raLenh(QL, { lopNguonId: l.classId, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: b, huong: 'len_lop', toClassId: BE_DICH }] });
    assert(!r0.failed.length, `tiền đề lệnh: ${JSON.stringify(r0.failed)}`);
    conn.exec('ALTER TABLE lo_trinh_tiep_theo DROP COLUMN huong_gvcn');   // DB trước PR-LCb
    const cot = () => (conn.prepare('SELECT name FROM pragma_table_info(?)').all('lo_trinh_tiep_theo') as any[]).some((x) => x.name === 'huong_gvcn');
    assert(!cot(), 'tiền đề: chưa có cột');
    const lan1: string[] = [];
    migLcb.migratePrLcb(conn, lan1);
    assert(cot() && lan1.length > 0, `lần 1: ${JSON.stringify(lan1)}`);
    assert(ltt(a, l.classId)?.huong_gvcn === 'hoc_lai' && ltt(b, l.classId)?.huong_gvcn == null, `điền bù (a không lệnh, b có lệnh chờ): ${ltt(a, l.classId)?.huong_gvcn} · ${ltt(b, l.classId)?.huong_gvcn}`);
    const truoc = JSON.stringify(conn.prepare('SELECT id, huong_gvcn FROM lo_trinh_tiep_theo ORDER BY id').all());
    const lan2: string[] = [];
    migLcb.migratePrLcb(conn, lan2);
    assert(!lan2.length && JSON.stringify(conn.prepare('SELECT id, huong_gvcn FROM lo_trinh_tiep_theo ORDER BY id').all()) === truoc, `lần 2: ${JSON.stringify(lan2)}`);
  });

  // ------------------------------------------------------------------ (n) classProgressMany theo lô (Turso ≤ 900 tham số) — R-B2
  check('LCb-n · classProgressMany 1000 id: không câu nào quá 900 tham số; lớp thật vẫn có tiến độ', () => {
    const l = taoLop('FOU', 3, 1);
    const ids = [l.classId, ...Array.from({ length: 999 }, (_, i) => 9_000_000 + i)];
    let maxTs = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { maxTs = Math.max(maxTs, (sql.match(/\?/g) ?? []).length); return goc(sql); };
    let m: Map<number, any>;
    try { m = schedule.classProgressMany(ids); } finally { (conn as any).prepare = goc; }
    assert(maxTs <= 900, `câu có ${maxTs} tham số`);
    assert(m!.get(l.classId)?.currentWeek === 3 && m!.size === 1, `tiến độ: ${m!.size} lớp`);
  });

  // ------------------------------------------------------------------ (o) panel FT giữ lớp chuyển đến CÙNG chi nhánh — R-B3
  check('LCb-o · transitionPlan lớp FT: ứng viên chỉ cùng chi nhánh (như cũ); lớp thường: mọi chi nhánh', () => {
    const cn = chiNhanh('LCBO');
    const ftNguon = lopMB('LCBO FT 01', 'FT', true, cn);
    const ftCung = lopMB('LCBO FT 02', 'FT', true, cn);
    const c = transition.transitionPlan(P.admin, ftNguon).candidates as any[];
    assert(c.some((x) => x.id === ftCung) && c.every((x) => x.branchCode === 'LCBO'), `FT: ${c.map((x) => x.code).join()}`);
    const thuong = taoLop('FOU', 8, 1, cn);
    assert((transition.transitionPlan(P.admin, thuong.classId).candidates as any[]).some((x) => x.id === FT_DICH), 'lớp thường thấy lớp FT chi nhánh khác');
  });

  // ------------------------------------------------------------------ (p) lớp cũ programme_code NULL (chương trình theo kind) vẫn có "Chốt lộ trình"
  check('LCb-p · lớp FOU programme_code NULL (cũ, theo kind) tuần 6 → vẫn có việc "Chốt lộ trình" như việc placement cũ', () => {
    const l = taoLop('FOU', 6, 1);
    conn.prepare('UPDATE classes SET programme_code = NULL WHERE id = ?').run(l.classId);
    assert(viecChot(QL, l.classId).length === 1, 'thiếu việc cho lớp programme_code NULL');
  });

  // ------------------------------------------------------------------ (w) web: panel Lộ trình tiếp theo (lớp thường) + lối vào — đọc nguồn
  const web = (f: string) => fs.readFileSync(new URL(`../../../../web/src/${f}`, import.meta.url), 'utf8');
  const coTep = (f: string) => fs.existsSync(new URL(`../../../../web/src/${f}`, import.meta.url));
  check('LCb-w · lớp thường: chuyen-tiep + lo-trinh-ca-lop mở PanelCuoiKhoa, FT chuyen-tiep mở TransitionPanel; ⋮ một mục "Lộ trình tiếp theo…"; panel cũ đã xoá; PanelCuoiKhoa dùng ChonNguoi ds, OTuan, hanChotLenFt, không placeholder 6.0', () => {
    const ov = web('modules/classes/ClassOverviewPage.tsx');
    assert(/viec === 'lo-trinh-ca-lop' \|\| \(viec === 'chuyen-tiep' && thuong\)\) && <PanelCuoiKhoa/.test(ov), 'lớp thường: hai lối cùng PanelCuoiKhoa');
    assert(/open=\{viec === 'chuyen-tiep' && !thuong\}/.test(ov), 'lớp FT: TransitionPanel');
    assert(!/LoTrinhTiepCaLopPanel/.test(ov) && !coTep('modules/classes/LoTrinhTiepCaLopPanel.tsx'), 'panel cả lớp cũ đã gỡ');
    const dt = web('modules/classes/DauTrangLop.tsx');
    assert((dt.match(/nhan: 'Lộ trình tiếp theo…'/g) ?? []).length === 1 && !dt.includes('Ghi lộ trình tiếp theo cả lớp'), '⋮ lớp thường đúng một mục');
    assert(/!thuong && data\.dai\?\.viewer\.coTheChuyenNhieuEm \? \[\{ key: 'chuyen-tiep', nhan: 'Chuyển tiếp lớp…'/.test(dt), 'FT giữ Chuyển tiếp lớp…');
    assert(web('modules/classes/DaiChuyenLop.tsx').includes('(v.laGvcn || v.coTheRaLenh)') && web('modules/classes/DaiChuyenLop.tsx').includes('Lộ trình tiếp theo…'), 'dải Kết thúc khoá');
    assert(web('modules/classes/ClassProgressPanel.tsx').includes('Lộ trình tiếp theo…'), 'Lịch Test');
    const pn = web('modules/classes/PanelCuoiKhoa.tsx');
    for (const chu of ['<ChonNguoi', 'ds={', '<OTuan', 'hanChotLenFt(', 'Lộ trình tiếp theo · ', '>1 Soạn</BuocSo> › <BuocSo', '>2 Xác nhận<', 'aria-current="step"', 'Lưu hướng', 'Tiếp tục · ', 'Xác nhận · ', 'Gõ tên lớp…', 'Chọn ở hàng nhóm', 'Không có lớp khớp', 'Quản lý đã xác nhận', 'Hướng khoá', 'Bạn đề xuất: ', 'GVCN: chưa đề xuất', 'Quản lý đã quyết', 'Lớp chưa có học viên đang học.', 'không chờ điểm Final']) {
      assert(pn.includes(chu), `PanelCuoiKhoa thiếu: ${chu}`);
    }
    /* T5 (rà T4 m1, m2 + audit): nút gửi khoá tới khi nạp lại xong; thẻ 375 không ô trống; link chữ 44px ở điện thoại; hàng nhóm xong thì ẩn. */
    assert(pn.includes('const khoaGui = busy || refreshing;') && (pn.match(/disabled=\{khoaGui/g) ?? []).length === 4, 'nút gửi khoá khi nạp lại');
    assert(pn.includes('{(loiHang || (laQl && s.lenh)) && <div role="cell" className="space-y-1">{duoi}</div>}'), 'thẻ 375: ô dưới chỉ khi có nội dung');
    assert((pn.match(/\$\{CHAM_375\}/g) ?? []).length === 2 && pn.includes('.filter((x) => x.n > 0 && !x.xong)'), 'link 44px · ẩn hàng nhóm đã xong');
    assert(!pn.includes('placeholder="6.0"') && !/Dự kiến thi/.test(pn), 'không ô Target mờ 6.0, không ô Dự kiến thi');
  });
  check('LCb-w2 · transitionPlan: em có cờ kck (Target khoá KCK) — panel biết em đã có Target, không hỏi lại', () => {
    const l = taoLop('FOU', 8, 1);
    conn.prepare(`UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 1 WHERE student_id = ?`).run(l.sids[0]);
    const s0 = transition.transitionPlan(QL, l.classId).students[0];
    assert(s0.kck === true && s0.target === null, JSON.stringify({ kck: s0.kck, target: s0.target }));
  });
}
