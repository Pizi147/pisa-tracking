/**
 * PHÉP KIỂM PHÂN TÍCH V2 · CHI NHÁNH (đặc tả `2026-11-12-phan-tich-v2-design.md` mục 3, 9, 11, 12): một GET chỉ phần cần — số = CHÍNH hàm tập cũ
 * (Đạt MT `tapDatMt`, Tiến bộ `tienBoTheoKyNang`, Test lớp thường `tongHop`, Thi thật `thiThatTrongKhoang`); Σ hàng ≤ tổng (tổng là tập gốc);
 * ô mới (vào · kết thúc · Chưa có KQ) = số dòng panel; khoảng mặc định = các tuần của tháng; tab mới + link `?goc=` cũ.
 */
export async function runPrPtV2ChiNhanhTests(t: any) {
  const { check, checkAsync, assert, P } = t;
  const cn: any = await import('../phanTich/chiNhanh.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const tt: any = await import('../phanTich/thiThatThongKe.ts');
  const th: any = await import('../phanTich/tongHop.ts');
  const d: any = await import('../../../shared/domain/index.ts');
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
    for (const o of ['vao', 'ket-thuc'] as const) {
      const p = cn.oChiNhanh(P.mbManager, { branchId: r.branchId, ct: 'ft', ...k, o });
      assert(p.n === (o === 'vao' ? r.hv.vao : r.hv.ketThuc), `${o}: ${p.n}`);
    }
  });

  check('PT-V2 · Lớp thường: Đạt Test = Progress "Đạt hết" + Final "Từ 70%" của bảng Test; panel dat-test = số; Cuối khoá = 4 ô Final', () => {
    const r = cn.chiNhanhV2(P.mbManager, { branchId: null, ct: 'thuong', ...k });
    assert(r.datMt === null && r.thiThat === null && r.datTest, 'lớp thường không có Đạt MT / Thi thật');
    const tb = th.tongHop(P.mbManager, { branchId: r.branchId, ct: 'thuong', soTuan: 8, theo: 'lop', ...k });
    assert(r.datTest.dat === (tb.tong['gk-dat'] ?? 0) + (tb.tong['ck-dat'] ?? 0), 'Đạt Test ≠ bảng Test');
    assert(JSON.stringify(r.cuoiKhoa) === JSON.stringify([tb.tong['ck-dat'] ?? 0, tb.tong['ck-60'] ?? 0, tb.tong['ck-50'] ?? 0, tb.tong['ck-duoi50'] ?? 0]), 'Cuối khoá');
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
  /* PR-5 Excel (đặc tả 7): bộ ghi định dạng sẵn + sheet Danh sách Giáo viên. */
  const xd: any = await import('../../../shared/xlsxDep.ts');
  await checkAsync('PT-V2 · Excel: tệp đọc lại được — số là số, % là định dạng %, ngày là ngày, chữ "=…" không thành công thức, ô nhóm gộp, cố định hàng, tiêu đề đậm nền nhạt', async () => {
    const XLSX: any = await import('xlsx');
    const { unzipSync, strFromU8 } = await import('fflate');
    const b = xd.dungXlsx('Giáo viên', 'Monbay · Fast Track', [{ ten: 'Giáo viên', dau: [['Giáo viên', 'Chấm Test', null], [null, 'Đúng hạn', '%']],
      hang: [['=1+1', 8, { v: 0.62, dang: 'pt' }], ['Ngày', { v: '2026-09-09', dang: 'ngay' }, { v: 5, mau: 'chua-dat' }]], tong: [1] }]);
    const wb = XLSX.read(b, { type: 'array', cellNF: true });
    const ws = wb.Sheets['Giáo viên'];
    assert(ws.A1.v === 'Giáo viên' && ws.A2.v === 'Monbay · Fast Track', 'đầu tệp');
    assert(ws.A6.t === 's' && ws.A6.v === '=1+1' && !ws.A6.f, `chữ "=…" phải là chữ: ${JSON.stringify(ws.A6)}`);
    assert(ws.B6.t === 'n' && ws.B6.v === 8, 'số là số');
    assert(ws.C6.t === 'n' && ws.C6.v === 0.62 && /%/.test(ws.C6.z ?? ''), `% là định dạng %: ${JSON.stringify(ws.C6)}`);
    assert(ws.B7.t === 'n' && /dd\/mm\/yyyy/.test(ws.B7.z ?? ''), `ngày là ngày: ${JSON.stringify(ws.B7)}`);
    assert((ws['!merges'] ?? []).some((m: any) => m.s.r === 3 && m.s.c === 1 && m.e.c === 2), 'nhóm "Chấm Test" gộp 2 cột');
    assert((ws['!merges'] ?? []).some((m: any) => m.s.r === 3 && m.e.r === 4 && m.s.c === 0), '"Giáo viên" gộp dọc 2 hàng tiêu đề');
    const z = unzipSync(b);
    const sh = strFromU8(z['xl/worksheets/sheet1.xml']), st = strFromU8(z['xl/styles.xml']);
    assert(/<pane [^>]*ySplit="5"[^>]*state="frozen"/.test(sh) && /<autoFilter /.test(sh), 'cố định tới hết tiêu đề + lọc');
    assert(/<b\/>/.test(st) && /patternType="solid"/.test(st) && /FFA63A2D/.test(st), 'đậm · nền tiêu đề · màu Chưa đạt');
    assert(xd.dungXlsx('X', '', [{ ten: 'a:b/c?*[d]' + 'x'.repeat(40), dau: [['A']], hang: [] }]).length > 0, 'tên sheet lạ / dài không làm hỏng tệp');
  });
  check('PT-V2 · Excel Giáo viên · Danh sách: dòng mỗi GV = Chấm Test + Việc của GV ở bảng (không S chéo chung); S chéo chung một dòng, không lặp theo người', () => {
    for (const p of [P.mbManager, P.admin]) {
      const bang = gv.phanTichGiaoVien(p, { ct: 'ft', ...kGv, v2: true });
      const ds = gv.danhSachSoGv(p, { ct: 'ft', ...kGv });
      for (const h of bang.hang) {
        const cua = ds.rows.filter((r: any) => r.gv === h.ten && !r.dongViec.sChung);
        const n = (o: any) => (o.k === 'so' ? o.tong : 0);
        assert(cua.filter((r: any) => r.dongViec.tab === 'cham').length === n(h.chamDiem), `${h.ten}: bài ${cua.filter((r: any) => r.dongViec.tab === 'cham').length} ≠ ${n(h.chamDiem)}`);
        assert(cua.filter((r: any) => r.dongViec.tab !== 'cham').length === n(h.viecDungHan), `${h.ten}: việc`);
      }
      const chung = ds.rows.filter((r: any) => r.dongViec.sChung);
      assert(chung.every((r: any) => r.gv == null) && new Set(chung.map((r: any) => r.id)).size === chung.length, 'S chéo chung lặp');
    }
    let loi = 0;
    try { gv.danhSachSoGv(P.subjectTeacher, { ct: 'ft', ...kGv }); } catch (e: any) { loi = e.status ?? 403; }
    assert(loi === 403, `GV bộ môn phải bị chặn: ${loi}`);
  });
}
