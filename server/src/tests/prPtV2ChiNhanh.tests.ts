/**
 * PHÉP KIỂM PHÂN TÍCH V2 · CHI NHÁNH (đặc tả `2026-11-12-phan-tich-v2-design.md` mục 3, 9, 11, 12): một GET chỉ phần cần — số = CHÍNH hàm tập cũ
 * (Đạt MT `tapDatMt`, Tiến bộ `tienBoTheoKyNang`, Test lớp thường `tongHop`, Thi thật `thiThatTrongKhoang`); Σ hàng ≤ tổng (tổng là tập gốc);
 * ô mới (vào · kết thúc · Chưa có KQ) = số dòng panel; khoảng mặc định = các tuần của tháng; tab mới + link `?goc=` cũ.
 */
export async function runPrPtV2ChiNhanhTests(t: any) {
  const { check, assert, P } = t;
  const cn: any = await import('../phanTich/chiNhanh.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const tt: any = await import('../phanTich/thiThatThongKe.ts');
  const th: any = await import('../phanTich/tongHop.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const sx: any = await import('../loTrinh/thiThat.ts'), dg: any = await import('../worklist/danhGia.ts'), ct0: any = await import('../worklist/chuongTrinh.ts'), dc: any = await import('../demoConfig.ts');
  console.log('\nPhân tích V2 · Chi nhánh — một GET, số = hàm cũ, ô mới = panel, tháng mặc định, tab mới');
  const k = { tu: '2026-07-06', den: '2026-09-27' };

  check('PT-V2 · khoảng mặc định Chi nhánh = mọi tuần của tháng chứa hôm nay (W1 → tuần cuối), kiểu "mặc định của tab"', () => {
    const m = d.khoangChiNhanhMacDinh('2026-11-12');
    assert(m.tu === '2026-11-02' && m.den === '2026-11-29' && m.kieu === '2-tuan', JSON.stringify(m));
    assert(Object.keys(d.thamSoKhoang(m, '2026-11-12', m)).length === 0, 'URL phải trống khi đúng mặc định');
  });

  check('PT-V2 · tab: Chi nhánh · Thi thật · SOS đầu; khoá URL cũ giữ (link ?goc= cũ vào đúng báo cáo)', () => {
    assert(d.GOC_NHIN[0] === 'bao-cao' && d.GOC_NHIN[1] === 'ket-qua-thi' && d.GOC_NHIN[2] === 'tong-hop', [...d.GOC_NHIN].join(','));
    assert(d.GOC_NHIN_LABEL['bao-cao'] === 'Chi nhánh' && d.GOC_NHIN_LABEL['giao-vien'] === 'Giáo viên', 'nhãn');
    for (const g of ['bao-cao', 'tong-hop', 'ket-qua-thi', 'giao-vien']) assert(d.gocNhinTuThamSo({ get: (x: string) => (x === 'goc' ? g : null) }).goc === g, g);
  });

  check('PT-V2 · FT một chi nhánh: Đạt MT = tapDatMt, Tiến bộ = Σ kỹ năng; Σ hàng ≤ tổng; HV tổng = dân số chỉ số', () => {
    const r = cn.chiNhanhV2(P.mbManager, { branchId: null, ct: 'ft', ...k });
    assert(r.cheDo === 'lop' && r.branchId, 'QL một chi nhánh → chế độ lớp');
    const dm = bc.tapDatMt(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k });
    assert(r.datMt.dat === dm.dat.size && r.datMt.mau === dm.mau.size && r.datMt.chuaDu === dm.chuaDu.size, `Đạt MT ${JSON.stringify(r.datMt)}`);
    const sum = (f: (h: any) => number) => r.hang.reduce((a: number, h: any) => a + f(h), 0);
    assert(sum((h) => h.datMt.dat) <= r.datMt.dat && sum((h) => h.datMt.mau) <= r.datMt.mau, 'Σ hàng Đạt MT vượt tổng');
    assert(r.tienBo.mau === r.tienBoKn.reduce((a: number, x: any) => a + x.tong, 0) && r.tienBo.dat === r.tienBoKn.reduce((a: number, x: any) => a + x.tang, 0), 'Tiến bộ ≠ Σ kỹ năng');
    assert(sum((h) => h.tienBo.mau) <= r.tienBo.mau, 'Σ hàng Tiến bộ vượt tổng');
    assert(sum((h) => h.hv) >= 0 && r.tong.hv === r.hv.dangHoc, 'HV tổng');
    /* Ô Tiến bộ (mọi kỹ năng) và một lớp = dòng panel. */
    const o = bc.oBaoCao(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k, o: 'tien-bo:tat-ca' });
    assert(o.n === r.tienBo.mau, `panel Tiến bộ ${o.n} ≠ ${r.tienBo.mau}`);
    const h = r.hang.find((x: any) => x.tienBo.mau > 0);
    if (h) {
      const ol = bc.oBaoCao(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k, classId: h.id, o: 'tien-bo:tat-ca' });
      assert(ol.n === h.tienBo.mau, `panel Tiến bộ lớp ${h.ten}: ${ol.n} ≠ ${h.tienBo.mau}`);
    }
  });

  check('PT-V2 · Thi thật ở Chi nhánh = tập Thi thật (trừ KCK); Em thi = panel tong:thi; co-target = mẫu Đạt Target; Chưa có KQ = panel', () => {
    const r = cn.chiNhanhV2(P.mbManager, { branchId: null, ct: 'ft', ...k });
    const x = r.thiThat;
    const f = { branchId: r.branchId, tu: k.tu, den: k.den };
    const thi = tt.oThiThat(P.mbManager, { ...f, o: 'tong:thi' });
    assert(thi.n === x.emThi, `Em thi ${x.emThi} ≠ panel ${thi.n}`);
    const mau = tt.oThiThat(P.mbManager, { ...f, o: 'tong:co-target' });
    assert(mau.n === x.vuot + x.dat + x.chuaDat, `mẫu Đạt Target ${x.vuot + x.dat + x.chuaDat} ≠ panel ${mau.n}`);
    for (const [o, n] of [['exceed', x.vuot], ['dat', x.dat], ['fail', x.chuaDat]] as const) assert(tt.oThiThat(P.mbManager, { ...f, o: `tong:${o}` }).n === n, o);
    const kq = cn.oChiNhanh(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k, o: 'chua-co-kq' });
    assert(kq.n === x.chuaCoKq, `Chưa có KQ ${x.chuaCoKq} ≠ panel ${kq.n}`);
    /* PTA rà #1410: câu đếm thẳng (chỉ mục chờ KQ) = cách cũ — nhãn "Đã thi · chờ KQ" của mọi em FT trong phạm vi (`sauThiTheoEm`). */
    const cu = [...sx.sauThiTheoEm(ct0.locTheoChuongTrinh('hoc-vien', dg.studentsInScope(P.mbManager, r.branchId), 'ft'), dc.demoToday())]
      .filter(([, z]: any) => z.giaiDoan === 'da_thi_cho_kq').map(([sid]: any) => sid).sort((a2: number, b2: number) => a2 - b2);
    assert(JSON.stringify(cn.tapChuaCoKq(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k })) === JSON.stringify(cu), `Chưa có KQ: câu mới ≠ cách cũ (${cu.length})`);
    for (const o of ['vao', 'ket-thuc'] as const) {
      const p = cn.oChiNhanh(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k, o });
      assert(p.n === (o === 'vao' ? r.hv.vao : r.hv.ketThuc), `${o}: ${p.n}`);
    }
  });

  check('PT-V2 · Lớp thường: Đạt Test = Progress "Đạt hết" + Final "Từ 70%" của bảng Test; panel dat-test = số; Cuối khoá = số EM theo dải % tổng, panel = số', () => {
    const r = cn.chiNhanhV2(P.mbManager, { branchId: null, ct: 'thuong', ...k });
    assert(r.datMt === null && r.thiThat === null && r.datTest, 'lớp thường không có Đạt MT / Thi thật');
    const tb = th.tongHop(P.mbManager, { branchId: r.branchId, ct: 'thuong', soTuan: 8, theo: 'lop', ...k });
    assert(r.datTest.dat === (tb.tong['gk-dat'] ?? 0) + (tb.tong['ck-dat'] ?? 0), 'Đạt Test ≠ bảng Test');
    /* PTA rà #1408: Cuối khoá đếm EM (Final đủ môn, bài mới nhất, theo % tổng) — mỗi em đúng một dải; ≤ số bài của bảng Test. */
    const baiCk = (tb.tong['ck-dat'] ?? 0) + (tb.tong['ck-60'] ?? 0) + (tb.tong['ck-50'] ?? 0) + (tb.tong['ck-duoi50'] ?? 0);
    const emCk = r.cuoiKhoa.reduce((a: number, x: number) => a + x, 0);
    assert(emCk > 0 && emCk <= baiCk, `Cuối khoá ${emCk} em / ${baiCk} bài`);
    const daThay = new Set<number>();
    ['ck-dat', 'ck-60', 'ck-50', 'ck-duoi50'].forEach((o, i) => {
      const pn = cn.oCuoiKhoaChiNhanh(P.mbManager, { branchId: r.branchId, ct: 'thuong', ...k, o, khoa: 'tong' });
      assert(pn.n === r.cuoiKhoa[i] && pn.rows.length === pn.n, `panel ${o}: ${pn.n} ≠ ${r.cuoiKhoa[i]}`);
      for (const row of pn.rows as any[]) {
        assert(row.baiThuong && row.baiThuong.tong != null, `${o}: dòng không có % tổng`);
        assert(!daThay.has(row.baiThuong.studentId), `${o}: em ${row.baiThuong.studentId} ở hai dải`);
        daThay.add(row.baiThuong.studentId);
      }
    });
    const lop0 = r.hang.find((h: any) => h.cuoiKhoa);
    if (lop0) assert(cn.oCuoiKhoaChiNhanh(P.mbManager, { branchId: r.branchId, ct: 'thuong', ...k, o: 'ck-dat', khoa: lop0.khoa }).n === lop0.cuoiKhoa[0], 'panel một lớp');
    const o = th.oTongHop(P.mbManager, { branchId: r.branchId, ct: 'thuong', soTuan: 8, theo: 'lop', ...k, khoa: 'tong', cot: 'dat-test' });
    assert(o.n === r.datTest.dat, `panel Đạt Test ${o.n} ≠ ${r.datTest.dat}`);
  });

  check('PT-V2 · QT Tất cả chi nhánh: hàng = chi nhánh, Σ Đạt MT hàng ≤ tổng; GV / TVV không có Phân tích → 403', () => {
    const r = cn.chiNhanhV2(P.admin, { branchId: null, ct: 'ft', ...k });
    assert(r.cheDo === 'chi-nhanh' && r.hang.every((h: any) => h.khoa.startsWith('cn:')), 'chế độ chi nhánh');
    assert(r.hang.reduce((a: number, h: any) => a + h.datMt.mau, 0) <= r.datMt.mau, 'Σ chi nhánh vượt tổng');
    let loi = 0;
    try { cn.chiNhanhV2(P.subjectTeacher, { branchId: null, ct: 'ft', ...k }); } catch (e: any) { loi = e.status ?? 403; }
    assert(loi === 403, `GV phải bị chặn: ${loi}`);
  });
  /* PR-4 Giáo viên (đặc tả 6, mockup D1–D2): `v2` chỉ bỏ cột không còn dùng — sổ nghĩa vụ + Đạt kỳ vọng = CHÍNH bảng cũ; tổng = Σ chi nhánh. */
  const gv: any = await import('../phanTich/giaoVien.ts');
  const kGv = { tu: '2026-03-02', den: '2026-09-14' };
  check('PT-V2 · Giáo viên một chi nhánh: v2 = bảng cũ ở Chấm Test · Việc · Đạt kỳ vọng · Chưa phân công; bỏ Tiến bộ / PA / Thi thật', () => {
    for (const ct of ['ft', 'thuong']) {
      const cu = gv.phanTichGiaoVien(P.mbManager, { ct, ...kGv }), moi = gv.phanTichGiaoVien(P.mbManager, { ct, ...kGv, v2: true });
      assert(moi.hang.length === cu.hang.length, `${ct}: số GV ${moi.hang.length} ≠ ${cu.hang.length}`);
      for (const h of moi.hang) {
        const c = cu.hang.find((x: any) => x.id === h.id);
        for (const k of ['chamDiem', 'viecDungHan', 'datMt', 'ketQua']) assert(JSON.stringify(h[k]) === JSON.stringify(c[k]), `${ct} ${h.ten} ${k}`);
        assert(h.tienBo == null && h.paHieuQua == null && h.thiThat == null, `${ct} ${h.ten}: v2 còn cột bỏ`);
      }
      assert(JSON.stringify(moi.chuaPhanCong) === JSON.stringify(cu.chuaPhanCong), `${ct}: Chưa phân công`);
    }
  });
  check('PT-V2 · Giáo viên tất cả chi nhánh: Đạt kỳ vọng, Chưa phân công = Σ chi nhánh; panel gv=0 = số hàng tổng', () => {
    const r = gv.phanTichGiaoVien(P.admin, { ct: 'ft', ...kGv, v2: true });
    assert(r.cn == null && r.hang.length > 0, 'chế độ tổng');
    let coDat = 0;
    for (const h of r.hang) {
      const ds = h.chiNhanh ?? [];
      const so = ds.map((x: any) => x.datMt).filter((o: any) => o?.k === 'so');
      if (so.length) { coDat++; assert(h.datMt.k === 'so' && h.datMt.tong === so.reduce((a: number, o: any) => a + o.tong, 0) && h.datMt.dung === so.reduce((a: number, o: any) => a + o.dung, 0), `${h.ten} Đạt kỳ vọng`); }
      const bai = ds.map((x: any) => x.chamDiem).filter((o: any) => o.k === 'so');
      if (bai.length) assert(h.chamDiem.k === 'so' && h.chamDiem.tong === bai.reduce((a: number, o: any) => a + o.tong, 0), `${h.ten}: Chấm Test tổng ≠ Σ chi nhánh`);
    }
    assert(coDat > 0, 'seed phải có GV có Đạt kỳ vọng');
    const cp = r.chuaPhanCong;
    if (cp) {
      const n = (o: any) => (o.k === 'so' ? o.tong : 0);
      assert(n(cp.chamDiem) === cp.chiNhanh.reduce((a: number, x: any) => a + n(x.chamDiem), 0), 'Chưa phân công ≠ Σ chi nhánh');
      const o = gv.oChiSoGv(P.admin, { ct: 'ft', ...kGv, gv: 0, cot: 'cham-diem' });
      assert(o.n === n(cp.chamDiem), `panel gv=0 ${o.n} ≠ ${n(cp.chamDiem)}`);
    }
  });
}
