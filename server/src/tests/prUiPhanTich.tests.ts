/**
 * PHÉP KIỂM V5 · UI-PHAN-TICH (`08` dòng 8, `10` mục 1 P9 / mục 5): Báo cáo HV gọi CHÍNH hàm Tổng quan (`tongQuanV5` + kỳ) — không hàm đếm thứ hai;
 * Phân tích GV: Đạt MT + Đạt Target thi thật = tập Kết quả tách theo loại mục, Quá hạn = Trễ chấm Tổng quan, Case có PA = cùng hàm Tổng quan, mỗi ô = số dòng panel;
 * Tiến bộ theo kỹ năng: số = dòng panel; khoảng "Toàn bộ" / không trần 52 tuần.
 */
export async function runPrUiPhanTichTests(t: any) {
  const { check, assert, P } = t;
  const v5: any = await import('../worklist/tongQuanV5.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const gv: any = await import('../phanTich/giaoVien.ts');
  const ql: any = await import('../worklist/tongQuanQl.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nV5 · UI-PHAN-TICH — Báo cáo HV = Tổng quan, Phân tích GV cột mới = panel, Toàn bộ / không trần');
  const homNay = demoToday();
  const k = d.khoangMacDinh(homNay);

  check('UI-PHAN-TICH · Báo cáo HV gọi tongQuanV5 với kỳ: kỳ mặc định = Tổng quan (cùng số); kỳ khác vẫn = baoCao().datMt', () => {
    const a = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' });
    const b = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft', ky: { tu: k.tu, den: k.den } });
    assert(JSON.stringify(a.datMt) === JSON.stringify(b.datMt) && JSON.stringify(a.casePa) === JSON.stringify(b.casePa) && JSON.stringify(a.thiThat) === JSON.stringify(b.thiThat), 'kỳ mặc định lệch Tổng quan');
    const k4 = { tu: d.addDaysIso(k.tu, -28), den: k.den };
    const c = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft', ky: k4 });
    const r = bc.baoCao(P.mbManager, { branchId: c.branchId, ct: 'ft', ...k4 });
    assert(c.datMt.dat === r.datMt.dat && c.datMt.mau === r.datMt.mau && c.ky.tu === k4.tu, `kỳ 6 tuần: ${JSON.stringify(c.datMt)} ≠ ${JSON.stringify(r.datMt)}`);
    assert(r.casePa.paCaiThien <= r.casePa.paKetQua, 'PA cải thiện vượt mẫu');
  });

  check('UI-PHAN-TICH · Tiến bộ theo kỹ năng: mỗi kỹ năng tử ≤ mẫu, số = dòng panel; Lớp thường / không chi nhánh → null', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const kk = { tu: d.addDaysIso(k.tu, -56), den: k.den };
    const r = bc.baoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk });
    assert(Array.isArray(r.tienBo), 'FT một chi nhánh phải có tienBo');
    for (const x of r.tienBo) {
      assert(x.dung <= x.tong, `${x.skill}: ${x.dung} > ${x.tong}`);
      const o = bc.oBaoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk, o: `tien-bo:${x.skill}` });
      assert(o.n === x.tong && o.rows.length === x.tong, `${x.skill}: panel ${o.n} ≠ ${x.tong}`);
    }
    assert(bc.baoCao(P.mbManager, { branchId: cn, ct: 'thuong', ...kk }).tienBo === null, 'Lớp thường không có tienBo');
  });

  check('UI-PHAN-TICH · Phân tích GV: Đạt MT + thi thật = Kết quả gộp; Quá hạn = Trễ chấm; Case có PA = Tổng quan; ô = số dòng panel', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const tq = v5.tongQuanV5(P.mbManager, { branchId: cn, ct: 'ft' });
    const den = d.mondayOfDate(homNay), tu = d.addDaysIso(den, -56);
    const f = { cn, ct: 'ft', tu, den };
    const r = gv.phanTichGiaoVien(P.mbManager, f);
    const tre = ql.treCham(P.mbManager, cn, 'ft').baiCua;
    const so = (o: any) => (o?.k === 'so' ? o : { dung: 0, tong: 0 });
    let dem = 0;
    for (const h of r.hang) {
      const kq = Object.values(h.ketQua).map(so);
      const tong = kq.reduce((s: number, o: any) => s + o.tong, 0), dung = kq.reduce((s: number, o: any) => s + o.dung, 0);
      assert(so(h.datMt).tong + so(h.thiThat).tong === tong && so(h.datMt).dung + so(h.thiThat).dung === dung, `${h.ten}: MT + thi thật ≠ Kết quả`);
      assert(h.quaHan === (tre.get(h.id)?.length ?? 0), `${h.ten}: Quá hạn ${h.quaHan} ≠ Trễ chấm`);
      const cp = tq.caseGv[h.id];
      assert(cp ? h.casePa.k === 'so' && h.casePa.dung === cp.coPa && h.casePa.tong === cp.mo : h.casePa.k === 'rong', `${h.ten}: Case có PA lệch Tổng quan`);
      for (const [cot, o] of [['dat-mt', h.datMt], ['thi-that', h.thiThat]] as const) {
        if (o?.k !== 'so') continue;
        const p = gv.oChiSoGv(P.mbManager, { ...f, gv: h.id, cot });
        assert(p.n === o.tong, `${h.ten} · ${cot}: panel ${p.n} ≠ ${o.tong}`);
        dem++;
      }
      const p = gv.oChiSoGv(P.mbManager, { ...f, gv: h.id, cot: 'hv-chu-y' });
      assert(p.n === h.hvChuY, `${h.ten} · HV cần chú ý: panel ${p.n} ≠ ${h.hvChuY}`);
    }
    assert(r.hang.length > 0, 'bộ demo phải có GV');
  });

  check('UI-PHAN-TICH · P9: "Toàn bộ" đọc từ URL, nhãn "Toàn bộ"; khoảng > 52 tuần không còn lỗi', () => {
    const tb = d.khoangTuUrl({ get: (x: string) => (x === 'kieu' ? 'toan-bo' : null) }, homNay);
    assert(tb.kieu === 'toan-bo' && tb.tu === d.TU_TOAN_BO && tb.den === d.addDaysIso(d.mondayOfDate(homNay), 6), JSON.stringify(tb));
    assert(d.nhanKhoang(tb).chinh === 'Toàn bộ' && JSON.stringify(d.thamSoKhoang(tb, homNay)) === '{"kieu":"toan-bo"}', 'nhãn / tham số Toàn bộ');
    assert(d.loiKhoang({ tu: '2024-01-01', den: homNay }) === null && d.loiKhoangTuan('2024-01-01', d.mondayOfDate(homNay)) === null, 'còn trần 52 tuần');
    const r = bc.baoCao(P.mbManager, { branchId: null, ct: 'ft', tu: tb.tu, den: tb.den });
    assert(r.datMt && r.datMt.mau >= 0, 'Báo cáo Toàn bộ chạy được');
  });
}
