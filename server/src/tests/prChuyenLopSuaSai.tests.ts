/**
 * PHÉP KIỂM #8 bản rà 11/11 — Chuyển lớp sửa sai một bấm, bàn giao một phiếu (chủ SP "Theo hết 10 đề xuất"; G4-05…G4-08, G4-14):
 * Huỷ quyết định không cần lý do · "Ngay hôm nay" có Hoàn tác (em về y như trước — so CẢ DB) · một người nhiều môn = một việc bàn giao, môn của mình ghi "Viết" ·
 * ô "Lớp chuyển đến" cùng chi nhánh / cùng loại trước. Mỗi ca ghi trong giao dịch rồi cuộn lại.
 */
export async function runPrChuyenLopSuaSaiTests(t: any) {
  const { check, assert, conn, P } = t;
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const llt: any = await import('../classes/luatLoTrinh.ts');
  const htcn: any = await import('../classes/hoanTacChuyenNgay.ts');
  const banGiao: any = await import('../classes/banGiao.ts');
  const dai: any = await import('../classes/daiChuyenLop.ts');
  const hl: any = await import('../students/hangLoat.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const { xepLopDich } = await import('../../../shared/domain/chuyenLop.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\n#8 CHUYỂN LỚP SỬA SAI · Huỷ một bấm · Hoàn tác "Ngay hôm nay" · bàn giao một phiếu · xếp lớp chuyển đến');

  const thuLong = <T>(fn: () => T): T => { conn.exec('SAVEPOINT do_khong'); try { return fn(); } finally { conn.exec('ROLLBACK TO do_khong'); conn.exec('RELEASE do_khong'); xoaNho(); } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };
  const today = demoToday();
  const lop = (code: string) => one('SELECT id FROM classes WHERE code = ?', code).id as number;
  const emCua = (code: string) => one(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active'
    AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho') ORDER BY e.student_id LIMIT 1`, lop(code)).id as number;
  /** Như POST /students/:id/transfer với tuần = hôm nay (cùng ghép hàm của route). */
  const chuyenNgay = (p: any, sid: number, den: string) => {
    const enr = llt.lopHienTaiCua(sid);
    const dich = llt.lopDichHopLe(lop(den), enr.class_id);
    const { boiCanh, huong } = llt.huongChuyenMotEm(enr, dich, today, llt.tuCuoiKhoaCua(enr, today, undefined));
    const raLenh = () => lenh.raLenh(p, { lopNguonId: enr.class_id, boiCanh, tuanChung: today,
      dongs: [lenh.dongTuBody({ studentId: sid, huong, toClassId: dich.id, lyDo: 'Thử chuyển ngay', mucTieu: 6.5 })] });
    return htcn.chuyenNgayCoHoanTac(p, sid, [enr.class_id, dich.id], raLenh, (x: any) => x.daChuyen.includes(sid));
  };
  const BO = new Set(['audit_logs', 'ghi_dao', 'notifications']);
  const bang = all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).map((r) => r.name as string).filter((b) => !BO.has(b));
  const chup = () => new Map(bang.map((b) => [b, JSON.stringify(all(`SELECT rowid AS __r, * FROM "${b}" ORDER BY rowid`))]));
  const khac = (a: Map<string, string>, b: Map<string, string>) => bang.filter((x) => a.get(x) !== b.get(x));

  check('CLSS-1 · Huỷ quyết định (G4-08): không lý do vẫn huỷ (ly_do_huy trống), hàng loạt cũng vậy; Khôi phục (Hoàn tác) trả lệnh về chờ', () => thu(() => {
    const ft = lop('MB FT 101');
    const [a, b] = all(`SELECT student_id id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 2`, ft).map((r) => r.id as number);
    const tuan = llt.xemChuyenLop(P.mbManager, a).tuanChon[1];
    lenh.raLenh(P.mbManager, { lopNguonId: ft, boiCanh: 'giua-khoa', tuanChung: tuan, dongs: [a, b].map((s) => lenh.dongTuBody({ studentId: s, huong: 'chuyen_lop', toClassId: lop('MB FT 102'), lyDo: 'Thử' })) });
    const id = (s: number) => one(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, s)?.id as number | undefined;
    const la = id(a)!;
    lenh.huyLenh(P.mbManager, la);
    const l = one('SELECT trang_thai, ly_do_huy FROM lenh_chuyen_lop WHERE id = ?', la);
    assert(l.trang_thai === 'huy' && l.ly_do_huy === null, JSON.stringify(l));
    const kq = hl.chay(P.mbManager, { viec: 'khoi-phuc-lenh', studentIds: [a] });
    assert(kq.ok.length === 1 && id(a) === la, `Khôi phục: ${JSON.stringify(kq)}`);
    const k2 = hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: [b] });
    assert(k2.ok.length === 1 && !id(b), `hàng loạt không lý do: ${JSON.stringify(k2)}`);
  }));

  for (const [ten, tu, den] of [['FT → FT', 'MB FT 101', 'MB FT 102'], ['FT → RF', 'MB FT 101', 'MB FT RF 12'], ['thường → thường', 'MB BE 03', 'MB BE 04'],
    ['thường → FT', 'MB BE 03', 'MB FT 101'], ['FT → thường', 'MB FT 102', 'MB BE 04']] as const) {
    check(`CLSS-2 · "Ngay hôm nay" ${ten} → Hoàn tác: em về y như trước (so mọi bảng trừ nhật ký / chuông), chuông của em gỡ; lần hai 409`, () => thu(() => {
      const sid = emCua(tu);
      const chuong0 = one(`SELECT COUNT(*) n FROM notifications WHERE entity_type = 'student' AND entity_id = ?`, sid).n;
      const truoc = chup();
      const r = chuyenNgay(P.mbManager, sid, den);
      assert(r.daChuyen.includes(sid) && r.dao, JSON.stringify(r));
      assert(one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id === lop(den), 'đã sang lớp mới');
      xoaNho();
      htcn.hoanTacChuyenNgay(P.mbManager, sid, r.dao);
      const d = khac(truoc, chup());
      assert(!d.length, `còn khác sau Hoàn tác: ${d.join(', ')}`);
      assert(one(`SELECT COUNT(*) n FROM notifications WHERE entity_type = 'student' AND entity_id = ?`, sid).n === chuong0, 'chuông của em');
      assert(ma(() => htcn.hoanTacChuyenNgay(P.mbManager, sid, r.dao)) === 409, 'Hoàn tác lần hai phải 409');
    }));
  }

  check('CLSS-3 · Hoàn tác chuyển ngay: GVCN / QL chi nhánh khác 403; đã có thay đổi sau (đổi lớp lượt) → 409, không đảo nửa chừng; tuần sau không có `dao`', () => thu(() => {
    const sid = emCua('MB FT 101');
    const r = chuyenNgay(P.mbManager, sid, 'MB FT 102');
    assert(ma(() => htcn.hoanTacChuyenNgay(P.coreTeacher, sid, r.dao)) === 403, 'GVCN 403');
    assert(ma(() => htcn.hoanTacChuyenNgay(P.cpManager, sid, r.dao)) === 403, 'QL chi nhánh khác 403');
    assert(ma(() => htcn.hoanTacChuyenNgay(P.mbManager, sid + 1, r.dao)) === 404, 'em khác 404');
    const luot = one(`SELECT id, class_id FROM assessment_attempts WHERE student_id = ? AND status = 'planned' AND class_id = ? LIMIT 1`, sid, lop('MB FT 102'));
    assert(luot, 'tiền đề: có lượt chưa thi đi theo em');
    conn.prepare('UPDATE assessment_attempts SET updated_at = ? WHERE id = ?').run('2099-01-01T00:00:00Z', luot.id);
    assert(ma(() => htcn.hoanTacChuyenNgay(P.mbManager, sid, r.dao)) === 409, 'đã đổi sau → 409');
    assert(one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id === lop('MB FT 102'), 'không đảo nửa chừng');
    const s2 = emCua('MB FT 101');
    const tuan = llt.xemChuyenLop(P.mbManager, s2).tuanChon[1];
    const enr = llt.lopHienTaiCua(s2);
    const r2 = htcn.chuyenNgayCoHoanTac(P.mbManager, s2, [enr.class_id, lop('MB FT 102')], () => lenh.raLenh(P.mbManager, { lopNguonId: enr.class_id, boiCanh: 'giua-khoa', tuanChung: tuan,
      dongs: [lenh.dongTuBody({ studentId: s2, huong: 'chuyen_lop', toClassId: lop('MB FT 102'), lyDo: 'Tuần sau' })] }), (x: any) => x.daChuyen.includes(s2));
    assert(!r2.dao && !one(`SELECT 1 x FROM ghi_dao WHERE loai = 'lenh.chuyen_ngay' AND doi_tuong_id = ?`, s2), 'lệnh tuần sau không chụp');
  }));

  check('CLSS-4 · bàn giao (G4-06, G4-07): GVCN dạy luôn môn → chỉ MỘT việc "Bàn giao" (không thêm "Bàn giao môn"); GVBM hai môn → MỘT việc "L · R"; phiếu ghi "Viết" cho môn của mình', () => thu(() => {
    const ft = lop('MB FT 101');
    const gvcn = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, ft).id as number;
    const gv2 = one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`, ft).id as number;
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill IN ('listening', 'reading') AND status = 'active'`).run(gvcn, ft);
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill IN ('writing1', 'writing2') AND status = 'active'`).run(gv2, ft);
    xoaNho();
    const sid = emCua('MB FT 101');
    const tuan = llt.xemChuyenLop(P.mbManager, sid).tuanChon[1];
    lenh.raLenh(P.mbManager, { lopNguonId: ft, boiCanh: 'giua-khoa', tuanChung: tuan, dongs: [lenh.dongTuBody({ studentId: sid, huong: 'chuyen_lop', toClassId: lop('MB FT 102'), lyDo: 'Thử' })] });
    xoaNho();
    const vc = banGiao.viecBanGiao(gvcn).filter((v: any) => v.lopId === ft);
    assert(vc.length === 1 && vc[0].loai === 'gvcn', `GVCN: ${JSON.stringify(vc.map((v: any) => [v.loai, v.mon]))}`);
    const v2 = banGiao.viecBanGiao(gv2).filter((v: any) => v.lopId === ft);
    /* gv2 dạy W1 · W2 · S ở lớp nguồn (S có thể cùng GV ở lớp mới → không cần bàn giao): một việc gom mọi môn còn cần. */
    assert(v2.length === 1 && v2[0].tung?.length >= 2 && v2[0].mon === v2[0].tung.map((x: any) => x.mon).join(',') && v2[0].monNgan === v2[0].tung.map((x: any) => x.monNgan).join(' · '), `GV nhiều môn: ${JSON.stringify(v2)}`);
    /* Dải hồ sơ lớp + hồ sơ HV cùng luật: GVCN không có dải / nút "Bàn giao môn"; GV nhiều môn một dải, một nút mở mọi môn. */
    const pr = { phase: 'running', finalWeekStart: null, startWeekStart: null, totalWeeks: 16 };
    const dc = dai.daiLop(loadPrincipal(gvcn), ft, { pr, ft: true, ct: 'FT' });
    assert(dc.banGiao && dc.banGiaoMon.length === 0, `dải GVCN: ${JSON.stringify(dc.banGiaoMon)}`);
    const d2 = dai.daiLop(loadPrincipal(gv2), ft, { pr, ft: true, ct: 'FT' });
    assert(d2.banGiaoMon.length === 1 && d2.banGiaoMon[0].mon === v2[0].mon, `dải GV nhiều môn: ${JSON.stringify(d2.banGiaoMon)}`);
    const hc = dai.daiHocVien(loadPrincipal(gvcn), sid);
    assert(hc.nut.includes('ban-giao') && !hc.nut.includes('ban-giao-mon'), `hồ sơ HV GVCN: ${hc.nut}`);
    const h2 = dai.daiHocVien(loadPrincipal(gv2), sid);
    assert(h2.nut.includes('ban-giao-mon') && h2.mon.ma === v2[0].mon, `hồ sơ HV GV nhiều môn: ${JSON.stringify(h2.mon)}`);
    const ph = banGiao.phieuBanGiao(loadPrincipal(gvcn), { lopNguonId: ft });
    assert(JSON.stringify(ph.nguoiXem.monDay) === '["listening","reading"]' && ph.nguoiXem.monGhi.length === 5, JSON.stringify(ph.nguoiXem));
  }));

  check('CLSS-5 · "Lớp chuyển đến" (G4-05): cùng chi nhánh → cùng loại (FT cùng lộ trình) → mã theo số; không bỏ lớp nào', () => thu(() => {
    const x = (code: string, cn: number, ft: boolean, route: string | null, maCt: string | null = ft ? 'FT' : 'BE') => ({ code, chiNhanhId: cn, ft, route, ma: maCt });
    const ds = [x('CP FT 101', 2, true, 'LT1'), x('MB BE 03', 1, false, null), x('MB FT RF 12', 1, true, 'RF'), x('MB FT 110', 1, true, 'LT1'), x('MB FT 102', 1, true, 'LT1')];
    const xep = xepLopDich(ds, { chiNhanhId: 1, ft: true, route: 'LT1', ma: 'FT' }).map((l) => l.code);
    assert(xep.join() === 'MB FT 102,MB FT 110,MB FT RF 12,MB BE 03,CP FT 101', xep.join());
    const sid = emCua('MB FT 101');
    const lopDs = llt.lopDichChoChuyen(P.mbManager, sid).lop;
    const cn = one('SELECT branch_id b FROM classes WHERE id = ?', lop('MB FT 101')).b;
    const dauKhac = lopDs.findIndex((l: any) => l.chiNhanhId !== cn);
    assert(dauKhac === -1 || lopDs.slice(dauKhac).every((l: any) => l.chiNhanhId !== cn), 'cùng chi nhánh phải lên trước');
    assert(lopDs[0].ft && lopDs[0].route === 'LT1', JSON.stringify(lopDs[0]));
  }));

  check('CLSS-6 · đo câu SQL: chuyển ngay KHÔNG chụp vs CÓ chụp (FT → FT) · Hoàn tác', () => thu(() => {
    const sid = emCua('MB FT 101');
    xoaNho(); let s0 = soCauSql(); let d0 = soDongSql();
    const r = chuyenNgay(P.mbManager, sid, 'MB FT 102');
    const n = soCauSql() - s0, dong = soDongSql() - d0;
    xoaNho(); s0 = soCauSql(); d0 = soDongSql();
    htcn.hoanTacChuyenNgay(P.mbManager, sid, r.dao);
    const h = soCauSql() - s0, dh = soDongSql() - d0;
    const khong = thuLong(() => { const s2 = emCua('MB FT 101'); const enr = llt.lopHienTaiCua(s2); const dich = llt.lopDichHopLe(lop('MB FT 102'), enr.class_id);
      const { boiCanh, huong } = llt.huongChuyenMotEm(enr, dich, today, llt.tuCuoiKhoaCua(enr, today, undefined));
      xoaNho(); const c0 = soCauSql(); const r0 = soDongSql();
      lenh.raLenh(P.mbManager, { lopNguonId: enr.class_id, boiCanh, tuanChung: today, dongs: [lenh.dongTuBody({ studentId: s2, huong, toClassId: dich.id, lyDo: 'Đo', mucTieu: 6.5 })] });
      return `${soCauSql() - c0} câu ${soDongSql() - r0} dòng`; });
    console.log(`    (đo: chuyển ngay KHÔNG chụp ${khong} · CÓ chụp ${n} câu ${dong} dòng · Hoàn tác ${h} câu ${dh} dòng)`);
    assert(n <= TRAN_GHI_LO.chuyenNgay && h <= TRAN_GHI_LO.hoanTacChuyenNgay, `${n} / ${h}`);
    assert(dong <= 2000 && dh <= 2000, `dòng ${dong} / ${dh} — vượt ngưỡng cảnh báo CLAUDE.md`);
  }));

  for (const [ten, tuanCua] of [['Ngay hôm nay', () => today], ['tuần sau', (sid: number) => llt.xemChuyenLop(P.mbManager, sid).tuanChon[1]]] as const) {
    check(`CLSS-7 · Duyệt đề xuất chuyển lớp (${ten}) → "Huỷ quyết định" của thẻ: thẻ về Chờ duyệt, em + lệnh y như trước (so mọi bảng trừ nhật ký / chuông)`, () => thu(() => {
      const sid = emCua('MB FT 101');
      const tuan = (tuanCua as any)(sid);
      const gvcn = loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, lop('MB FT 101')).id);
      const { id } = lenh.guiDeXuatChuyenLop(gvcn, sid, { toClassId: lop('MB FT 102'), tuan, lyDo: 'Đổi lịch học' });
      xoaNho();
      const truoc = chup();
      yeuCau.duyetYeuCau(P.mbManager, id, { duLieu: { lopDichId: lop('MB FT 102'), tuan, lyDo: 'Đổi lịch học' } });
      const daSang = one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id === lop('MB FT 102');
      assert(daSang === (ten === 'Ngay hôm nay'), `chuyển ngay: ${daSang}`);
      xoaNho();
      yeuCau.huyQuyetDinh(P.mbManager, id);
      const d = khac(truoc, chup());
      assert(!d.length, `còn khác sau Huỷ quyết định: ${d.join(', ')}`);
    }));
  }
}
