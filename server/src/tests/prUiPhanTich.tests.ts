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
    /* "Thi đợt này": có kỳ → ngày thi trong kỳ, = panel `o=thi-dot-nay`. */
    const o = bc.oBaoCao(P.mbManager, { branchId: c.branchId, ct: 'ft', ...k4, o: 'thi-dot-nay' });
    assert(o.n === c.thiThangNay, `Thi đợt này ${c.thiThangNay} ≠ panel ${o.n}`);
  });

  check('UI-PHAN-TICH · Tiến bộ theo kỹ năng: mỗi kỹ năng tử ≤ mẫu, số = dòng panel; Lớp thường / không chi nhánh → null', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const kk = { tu: d.addDaysIso(k.tu, -56), den: k.den };
    const r = bc.baoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk });
    assert(Array.isArray(r.tienBo), 'FT một chi nhánh phải có tienBo');
    for (const x of r.tienBo) {
      assert(x.tang + x.giam <= x.tong, `${x.skill}: ${x.tang}+${x.giam} > ${x.tong}`);
      const o = bc.oBaoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk, o: `tien-bo:${x.skill}` });
      assert(o.n === x.tong && o.rows.length === x.tong, `${x.skill}: panel ${o.n} ≠ ${x.tong}`);
    }
    assert(bc.baoCao(P.mbManager, { branchId: cn, ct: 'thuong', ...kk }).tienBo === null, 'Lớp thường không có tienBo');
  });

  check('RA-LOI-WEB · Tiến bộ theo kỹ năng: ô Tăng / Giữ nguyên / Giảm mở đúng các lượt của ô (số = dòng panel)', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const kk = { tu: d.addDaysIso(k.tu, -56), den: k.den };
    let co = 0;
    for (const x of bc.baoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk }).tienBo) {
      for (const [o, so] of [['tang', x.tang], ['giu', x.tong - x.tang - x.giam], ['giam', x.giam]] as const) {
        const r = bc.oBaoCao(P.mbManager, { branchId: cn, ct: 'ft', ...kk, o: `tien-bo:${x.skill}:${o}` });
        assert(r.n === so && r.rows.length === so && r.rows.every((d: any) => d.xuHuong?.huong === o), `${x.skill} ${o}: ô ${so} ≠ panel ${r.n} (${r.rows.map((d: any) => d.xuHuong?.huong).join(',')})`);
        co += so;
      }
    }
    assert(co > 0, 'demo không có lượt Tiến bộ nào để kiểm');
  });

  check('UI-PHAN-TICH · Phân tích GV: Đạt MT + thi thật = Kết quả gộp; Case có PA = Tổng quan; ô = số dòng panel', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const tq = v5.tongQuanV5(P.mbManager, { branchId: cn, ct: 'ft' });
    const den = d.mondayOfDate(homNay), tu = d.addDaysIso(den, -56);
    const f = { cn, ct: 'ft', tu, den };
    const r = gv.phanTichGiaoVien(P.mbManager, f);
    const so = (o: any) => (o?.k === 'so' ? o : { dung: 0, tong: 0 });
    let dem = 0;
    for (const h of r.hang) {
      const kq = Object.values(h.ketQua).map(so);
      const tong = kq.reduce((s: number, o: any) => s + o.tong, 0), dung = kq.reduce((s: number, o: any) => s + o.dung, 0);
      assert(so(h.datMt).tong <= tong && so(h.datMt).dung <= dung, `${h.ten}: Đạt kỳ vọng Test vượt Kết quả gộp`);
      /* XM-5 (24/10): Pass Target theo lần thi = hồ sơ GV (cùng `thiThatCuaGv`) khi GV chỉ dạy chi nhánh này. */
      if (h.thiThat?.k === 'so') {
        const hs = gv.chiSoHoSoGv(P.mbManager, h.id, { tu, den });
        assert(hs.thiThat.k === 'so' && hs.thiThat.tong >= h.thiThat.tong, `${h.ten}: Pass Target ${JSON.stringify(h.thiThat)} lệch hồ sơ ${JSON.stringify(hs.thiThat)}`);
      }
      const cp = tq.caseGv[h.id];
      assert(cp ? h.casePa.k === 'so' && h.casePa.dung === cp.coPa && h.casePa.tong === cp.mo : h.casePa.k === 'rong', `${h.ten}: Case có PA lệch Tổng quan`);
      for (const [cot, o] of [['dat-mt', h.datMt]] as const) {
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

  const m: any = await import('../worklist/metrics.ts');
  const dg: any = await import('../worklist/danhGia.ts');
  const hs: any = await import('../giaoVien/hoSo.ts');
  const { listCases } = await import('../cases/cases.ts');
  const { chiTietCaseMo } = await import('../cases/caseLop.ts');
  /* DOC-PT: hai đường đọc ít hơn của Phân tích GV phải cho CÙNG tập với đường đủ cũ. */
  check('DOC-PT · HV cần chú ý trên tập em = chỉ số hv-sos-hien-tai đủ ∩ tập; Case có PA theo người = đường chi tiết Case cũ', () => {
    const cn = v5.tongQuanV5(P.mbManager, { branchId: null, ct: 'ft' }).branchId;
    const em = dg.studentsInScope(P.mbManager, cn) as number[];
    for (const ct of ['ft', 'thuong']) {
      const du = new Set(m.metricSet(P.mbManager, 'hv-sos-hien-tai', { branchId: cn, program: ct }).ids);
      assert(du.size > 0 || ct === 'thuong', 'bộ demo phải có em SOS FT');
      for (const tap of [em, em.filter((_, i) => i % 2), em.slice(0, 7)]) {
        const con = [...m.hvSosHienTaiTrong(P.mbManager, cn, ct, new Set(tap))].sort((a: number, b: number) => a - b).join();
        const mong = tap.filter((s) => du.has(s)).sort((a, b) => a - b).join();
        assert(con === mong, `${ct} · ${tap.length} em: ${con} ≠ ${mong}`);
      }
      const rows = listCases(P.mbManager, { branchId: cn }).rows.filter((c: any) => c.ownerUserId !== null && c.state !== 'done'
        && (c.homeBranchId ?? c.branchId) === cn && (c.classKind === 'ft' ? 'ft' : 'thuong') === ct);
      const chiTiet = chiTietCaseMo(rows);
      const cu = new Map<number, number[]>();
      for (const c of rows) if (chiTiet.has(c.id)) cu.set(c.ownerUserId!, [...(cu.get(c.ownerUserId!) ?? []), c.id]);
      const moi = hs.caseMoTheoChu(P.mbManager, cn, ct) as Map<number, number[]>;
      const chuoi = (x: Map<number, number[]>) => JSON.stringify([...x].map(([g, ids]) => [g, [...ids].sort((a, b) => a - b)]).sort((a: any, b: any) => a[0] - b[0]));
      assert(chuoi(moi) === chuoi(cu), `${ct} · Case theo người: ${chuoi(moi)} ≠ ${chuoi(cu)}`);
      assert(cu.size > 0 || ct === 'thuong', 'bộ demo phải có Case FT có người phụ trách');
    }
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
