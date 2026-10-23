/**
 * PHÉP KIỂM V5 · UI-TONG-QUAN (`08` dòng UI-TONG-QUAN, K6, T20): Tổng quan KHÔNG đếm lại — số = số Báo cáo Phân tích (cùng hàm tập), hàng tổng QT = Σ tử / Σ mẫu,
 * panel Đạt MT / Thi tháng này theo lớp = số ô; quyền: GV không đọc `/tong-quan/v5`, chỉ TVV đọc `/tong-quan/tvv`.
 */
export async function runPrUiTongQuanTests(t: any) {
  const { check, assert, conn, P } = t;
  const v5: any = await import('../worklist/tongQuanV5.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
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
}
