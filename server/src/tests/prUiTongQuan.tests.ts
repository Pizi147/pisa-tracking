/**
 * PHÉP KIỂM V5 · UI-TONG-QUAN (`08` dòng UI-TONG-QUAN, K6, T20): Tổng quan KHÔNG đếm lại — số = số Báo cáo Phân tích (cùng hàm tập), hàng tổng QT = Σ tử / Σ mẫu,
 * panel Đạt MT / Thi tháng này theo lớp = số ô; quyền: GV không đọc `/tong-quan/v5`, chỉ TVV đọc `/tong-quan/tvv`.
 */
export async function runPrUiTongQuanTests(t: any) {
  const { check, assert, conn, P } = t;
  const v5: any = await import('../worklist/tongQuanV5.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal, can } = await import('../permissions.ts');
  const hv: any = await import('../worklist/hvCuaToi.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nV5 · UI-TONG-QUAN — số Tổng quan = Báo cáo, Σ tử / Σ mẫu theo chi nhánh, panel theo lớp, quyền');
  const ma = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };

  check('UI-TONG-QUAN · QL: Đạt MT, Thi tháng này, Case mở = Báo cáo Phân tích; panel Đạt MT mỗi lớp có đúng mẫu của ô', () => {
    const r = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' });
    const k = d.khoangMacDinh(demoToday());
    const b = bc.baoCao(P.mbManager, { branchId: r.branchId, ct: 'ft', tu: k.tu, den: k.den });
    assert(r.lop && !r.chiNhanh, 'QL một chi nhánh → chế độ lớp');
    assert(r.datMt.dat === b.datMt.dat && r.datMt.mau === b.datMt.mau, `Đạt MT ${JSON.stringify(r.datMt)} ≠ ${JSON.stringify(b.datMt)}`);
    assert(r.thiThangNay === b.chuY.thiThangNay && r.casePa.mo === b.casePa.caseMo && r.casePa.chuaPa === b.chuY.caseChuaChot, 'Thi tháng này / Case lệch Báo cáo');
    for (const l of r.lop.filter((x: any) => x.datMt?.mau)) {
      const o = bc.oBaoCao(P.mbManager, { branchId: r.branchId, ct: 'ft', tu: k.tu, den: k.den, classId: l.id, o: 'dat-mt' });
      assert(o.n === l.datMt.mau, `${l.ma}: panel ${o.n} ≠ ô ${l.datMt.mau}`);
    }
    assert(r.lop.reduce((s: number, l: any) => s + (l.datMt?.mau ?? 0), 0) <= r.datMt.mau, 'Σ lớp vượt tổng');
  });

  check('UI-TONG-QUAN · QT (T20): hàng chi nhánh Σ tử / Σ mẫu = tổng; Case có PA cộng đúng', () => {
    const r = v5.tongQuanV5(P.admin, { branchId: null, ct: 'ft' });
    assert(r.chiNhanh && !r.lop, 'QT chưa chọn chi nhánh → chế độ chi nhánh');
    const dat = r.chiNhanh.reduce((s: number, c: any) => s + c.datMt.dat, 0), mau = r.chiNhanh.reduce((s: number, c: any) => s + c.datMt.mau, 0);
    assert(dat <= r.datMt.dat && mau <= r.datMt.mau, `Σ chi nhánh ${dat}/${mau} > tổng ${r.datMt.dat}/${r.datMt.mau}`);
    assert(r.chiNhanh.reduce((s: number, c: any) => s + c.casePa.mo, 0) === r.casePa.mo, 'Σ Case mở chi nhánh ≠ tổng');
  });

  check('UI-TONG-QUAN · quyền: GV không đọc Tổng quan V5; chỉ TVV đọc /tong-quan/tvv; TVV mẫu 0 Báo PH → tong 0 (web "Chưa có dữ liệu")', () => {
    assert(ma(() => v5.tongQuanV5(P.coreTeacher, { ct: 'ft' })) === 403, 'GV đọc được /tong-quan/v5');
    assert(ma(() => v5.tongQuanTvv(P.mbManager)) === 403 && ma(() => v5.oTongQuanTvv(P.coreTeacher, 'bao-ph')) === 403, 'không phải TVV đọc được Tổng quan TVV');
    const tvvId = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' LIMIT 1`).get() as any)?.id;
    assert(tvvId, 'bộ demo phải có TVV');
    const tvv = loadPrincipal(tvvId);
    const x = v5.tongQuanTvv(tvv);
    const o = v5.oTongQuanTvv(tvv, 'bao-ph');
    assert(o.n === x.baoPh.tong && x.baoPh.dung + x.baoPh.treXong <= x.baoPh.tong, `panel Báo PH ${o.n} ≠ số ${x.baoPh.tong}`);
    assert(ma(() => v5.oTongQuanTvv(tvv, 'khac')) === 400, 'o lạ phải 400');
  });

  check('GD-8a · /tong-quan/tvv/em: em = đúng em của TVV (cùng tập chip HV của tôi), chỉ số = /tong-quan/tvv, trường theo trạng thái; TVV khác / GV 403, QL theo phạm vi', () => {
    const ids = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY ur.user_id`).all() as any[]).map((r) => r.id);
    const tvv = loadPrincipal(ids[0]);
    const r = hv.emCuaTvv(tvv);
    const tap = (xs: number[]) => JSON.stringify([...new Set(xs)].sort((a, b) => a - b));
    const goc = (conn.prepare('SELECT id FROM students WHERE consultant_user_id = ? AND archived_at IS NULL').all(tvv.userId) as any[]).map((x) => x.id);
    assert(r.tvv === tvv.userId && r.em.length > 0 && tap(r.em.map((x: any) => x.id)) === tap(goc), `em ${tap(r.em.map((x: any) => x.id))} ≠ ${tap(goc)}`);
    const chip = hv.chipHocVien(tvv);
    assert(tap(r.em.filter((x: any) => x.status !== 'finished').map((x: any) => x.id)) === tap(chip.tatCa), 'em chưa kết thúc ≠ chip Tất cả');
    assert(tap(r.em.filter((x: any) => x.choKq).map((x: any) => x.id)) === tap(chip.ids['da-thi']), 'choKq ≠ chip Đã thi · chờ KQ');
    assert(tap(r.em.filter((x: any) => x.choBuocTiep).map((x: any) => x.id)) === tap(chip.ids['cho-buoc-tiep']), 'choBuocTiep ≠ chip Chờ bước tiếp');
    assert(tap(r.em.filter((x: any) => x.sos).map((x: any) => x.id)) === tap([...chip.lyDo].filter(([, l]: any) => l.sos).map(([id]: any) => id)), 'SOS ≠ lý do chip');
    assert(JSON.stringify(r.chiSo) === JSON.stringify(v5.tongQuanTvv(tvv)), 'chỉ số ≠ /tong-quan/tvv');
    /* Lời 40: Kết thúc học / đã nhập ngày thi thật → không lịch thi dự kiến; SOS chỉ em đang học. */
    const daThi = new Set((conn.prepare(`SELECT student_id AS id FROM learning_cycles WHERE status = 'active' AND thi_that_ngay IS NOT NULL`).all() as any[]).map((x) => x.id));
    for (const x of r.em) {
      assert(!(x.status === 'finished' || daThi.has(x.id)) || !x.thi, `${x.ten}: đã thi / kết thúc mà còn lịch thi`);
      assert(x.status === 'active' || !x.sos, `${x.ten}: không đang học mà có SOS`);
      assert(!x.thi || Object.keys(x.thi).length === 1, `${x.ten}: lịch thi phải đúng một khoá`);
    }
    assert(r.em.some((x: any) => x.lop.length && x.lop.every((l: any) => l.id && l.ma)), 'em phải có lớp (id + mã)');
    /* Quyền: TVV xem em TVV khác → 403; GV → 403; QL không `tvv` → 400; QL có `tvv` → em trong phạm vi, không chỉ số. */
    const khac = ids[1] ?? P.mbManager.userId;
    assert(ma(() => hv.emCuaTvv(tvv, { tvv: khac })) === 403, 'TVV đọc được em của TVV khác');
    if (ids[1]) assert(ma(() => hv.emCuaTvv(loadPrincipal(ids[1]), { tvv: tvv.userId })) === 403, 'TVV thứ hai đọc được em TVV đầu');
    assert(ma(() => hv.emCuaTvv(P.coreTeacher, { tvv: tvv.userId })) === 403 && ma(() => hv.emCuaTvv(P.coreTeacher)) === 400, 'GV đọc được em TVV');
    assert(ma(() => hv.emCuaTvv(P.mbManager)) === 400, 'QL thiếu tvv phải 400');
    for (const q of [P.mbManager, P.admin]) {
      const x = hv.emCuaTvv(q, { tvv: tvv.userId });
      assert(!x.chiSo && x.em.every((e: any) => goc.includes(e.id) && can(q, d.PERMISSIONS.STUDENT_VIEW, { studentId: e.id })), 'QL / QT: em ngoài TVV / ngoài phạm vi hoặc kèm chỉ số');
    }
  });
}
