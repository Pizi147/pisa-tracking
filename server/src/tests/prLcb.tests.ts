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
}
