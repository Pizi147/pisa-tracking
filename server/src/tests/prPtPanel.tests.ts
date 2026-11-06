/**
 * PHÉP KIỂM PT-PANEL (kế hoạch 2026-11-05 PR-1..3): mọi ô số Phân tích mở panel BẢNG có điểm đúng lượt (`bangLuot`), số trên ô = số dòng.
 *   PR-1 — FT: Test + SOS (lượt · Dưới kỳ vọng · HV - Case), Báo cáo HV (Đạt MT, Kết quả MT, Tiến bộ), Phân tích GV + hồ sơ GV (Đạt kỳ vọng, Tiến bộ, HV cần chú ý).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPtPanelTests(t: YThucTestKit & { P: any }) {
  const { check, assert, P } = t;
  console.log('\nPT-PANEL · panel bảng có điểm');
  const { oTongHop, tongHop, luotTrongKhoang, phanLoaiCacLuot } = await import('../phanTich/tongHop.ts');
  const { oBaoCao, baoCao } = await import('../phanTich/baoCao.ts');
  const { oChiSoGv, phanTichGiaoVien, oChiSoHoSoGv, chiSoHoSoGv } = await import('../phanTich/giaoVien.ts');
  const { addDaysIso } = await import('../../../shared/domain/index.ts');
  const { cotSoLieu } = await import('../../../shared/domain/phanTich.ts');
  const { chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const req = <T>(fn: () => T): T => chayTrongRequest('GET', fn);

  const TU = '2026-03-02', DEN = '2026-09-14';
  const f = { ct: 'ft' as const, soTuan: 26, tu: TU, den: DEN, theo: 'tuan' as const };
  const KN = ['l', 'r', 'w1', 'w2', 's'];
  const coDiem = (x: any) => x === null || (typeof x.v === 'number' && 'kq' in x);
  const dongLuot = (r: any, n: number, ten: string) => {
    assert(r.bangLuot === true && r.kieu === 'luot', `${ten}: phải bangLuot kiểu luot (${r.kieu})`);
    assert(r.rows.length === n && r.n === n, `${ten}: ${r.rows.length} dòng ≠ n ${n}`);
    for (const row of r.rows) {
      const l = row.luotDiem;
      assert(l && KN.every((k) => k in l.kn && coDiem(l.kn[k])) && 'ovr' in l && 'kyVong' in l && typeof l.attemptId === 'number', `${ten}: dòng ${row.id} thiếu điểm ${JSON.stringify(l)}`);
    }
  };
  const tong = req(() => tongHop(P.admin, f));

  check('PT-PANEL · ô SOS (Test + SOS FT): rows.length === n, mọi dòng có kn + ovr + kyVong', () => {
    const cot = ['sos3', 'sos2', 'sos1', 'dat'].find((k) => (tong.tong[k] ?? 0) > 0);
    assert(cot, 'demo phải có lượt SOS / Đạt trong khoảng');
    dongLuot(req(() => oTongHop(P.admin, { ...f, khoa: 'tong', cot: cot! })), tong.tong[cot!], cot!);
  });

  check('PT-PANEL · Dưới kỳ vọng · L: dòng là lượt làm em vào ô (mới nhất trong khoảng), cột L nhấn', () => {
    const r: any = req(() => oTongHop(P.admin, { ...f, khoa: 'tong', cot: 'kn:listening' }));
    assert(r.n > 0, 'demo phải có HV dưới kỳ vọng L');
    dongLuot(r, r.n, 'kn:listening');
    assert(r.knNhan === 'L', `knNhan phải "L", ra ${r.knNhan}`);
    /* Kỳ vọng tính độc lập: mọi lượt FT trong khoảng → lượt có L dưới kỳ vọng → mới nhất theo (tuần, id). */
    const luot = req(() => luotTrongKhoang(`c.is_fast_track = 1 AND a.status != 'cancelled' AND rp.week_start >= ? AND rp.week_start <= ?`, [TU, DEN]));
    const pl = req(() => phanLoaiCacLuot(luot));
    const mong = new Map<number, any>();
    let haiLuot = 0;
    for (const a of luot) {
      if (!pl.get(a.id)?.kyNangDuoi.includes('listening')) continue;
      const cu = mong.get(a.student_id);
      if (cu) haiLuot++;
      if (!cu || a.week_start > cu.week_start || (a.week_start === cu.week_start && a.id > cu.id)) mong.set(a.student_id, a);
    }
    assert(haiLuot > 0, 'demo phải có em dưới kỳ vọng L ở hai lượt trong khoảng (Review Focus 1)');
    for (const row of r.rows) assert(row.luotDiem.attemptId === mong.get(row.id)?.id, `em ${row.id}: lượt ${row.luotDiem.attemptId} ≠ lượt làm em vào ô ${mong.get(row.id)?.id}`);
    assert(r.rows.every((row: any) => row.luotDiem.kn.l?.kq === 'duoi'), 'mọi dòng: ô L phải ✗');
  });

  check('PT-PANEL · ô thiếu điểm: kỹ năng chưa có điểm là null (web "—"), không phải { v }', () => {
    const r: any = req(() => oTongHop(P.admin, { ...f, khoa: 'tong', cot: 'chuaDu' }));
    assert(r.n > 0, 'demo phải có lượt thiếu điểm');
    dongLuot(r, r.n, 'chuaDu');
    assert(r.rows.some((row: any) => KN.some((k) => row.luotDiem.kn[k] === null)), 'ô thiếu điểm phải có kỹ năng null');
  });

  check('PT-PANEL · hộp chi tiết: ô W / S có tc (c1–c4), ô L / R có raw [đúng, tổng] khi có', () => {
    const r: any = req(() => oTongHop(P.admin, { ...f, khoa: 'tong', cot: 'luot' }));
    const o = r.rows.flatMap((row: any) => KN.map((k) => [k, row.luotDiem.kn[k]])).filter(([, x]: any) => x);
    assert(o.some(([k, x]: any) => (k === 'w1' || k === 's') && Array.isArray(x.tc) && x.tc.length === 4), 'phải có ô W / S kèm tiêu chí');
    assert(o.every(([k, x]: any) => !x.raw || (['l', 'r'].includes(k) && x.raw.length === 2)), 'raw chỉ ở L / R, dạng [đúng, tổng]');
  });

  check('PT-PANEL · vòng mọi cột FT (trừ cột Case) × hàng Tổng + 2 hàng + 1 hàng con: n === rows.length, mọi dòng có điểm', () => {
    const hang = [{ khoa: 'tong', o: tong.tong }, ...tong.hang.slice(0, 2).flatMap((h: any) => [h, ...(h.con ?? []).slice(0, 1)])];
    let so = 0;
    for (const c of cotSoLieu('ft').filter((c) => c.donVi !== 'case')) {
      for (const h of hang) {
        const n = h.o[c.khoa] ?? 0;
        if (!n) continue;
        dongLuot(req(() => oTongHop(P.admin, { ...f, khoa: h.khoa, cot: c.khoa })), n, `${h.khoa} × ${c.khoa}`);
        so++;
      }
    }
    assert(so >= 8, `quá ít ô có số để kiểm (${so})`);
  });

  /* ---------- Báo cáo HV ---------- */
  const cn = 1;
  const fb = { ct: 'ft' as const, branchId: cn, tu: TU, den: DEN };

  check('PT-PANEL · Báo cáo HV · Tăng / Giữ / Giảm: kiểu tang-giam, chênh = sau − trước, số = dòng', () => {
    const b = req(() => baoCao(P.admin, fb));
    assert(b.tienBo?.length, 'demo phải có Tiến bộ theo kỹ năng');
    let soO = 0;
    for (const h of b.tienBo!) {
      for (const [o, n, dk] of [['tang', h.tang, (x: any) => x.truoc.v < x.sau.v], ['giu', h.tong - h.tang - h.giam, (x: any) => x.truoc.v === x.sau.v], ['giam', h.giam, (x: any) => x.truoc.v > x.sau.v]] as const) {
        if (!n) continue;
        const r: any = req(() => oBaoCao(P.admin, { ...fb, o: `tien-bo:${h.skill}:${o}` }));
        assert(r.bangLuot && r.kieu === 'tang-giam' && r.n === n && r.rows.length === n, `${h.skill}:${o}: ${r.kieu} ${r.rows.length} ≠ ${n}`);
        for (const row of r.rows) {
          const x = row.tangGiam;
          assert(x && dk(x) && Math.abs(x.chenh - (x.sau.v - x.truoc.v)) < 1e-9 && 'kyVong' in x, `${h.skill}:${o} dòng sai ${JSON.stringify(x)}`);
        }
        soO++;
      }
    }
    assert(soO > 0, 'không ô Tiến bộ nào có số');
  });

  check('PT-PANEL · Báo cáo HV · Đạt MT + Kết quả MT: bảng lượt, giữ tab Chưa đạt / Đạt', () => {
    const r: any = req(() => oBaoCao(P.admin, { ...fb, o: 'dat-mt' }));
    assert(r.n > 0, 'demo phải có Đạt MT');
    dongLuot(r, r.n, 'dat-mt');
    assert(r.rows.every((row: any) => row.ketQua === 'dat' || row.ketQua === 'chua'), 'dòng Đạt MT phải có ketQua');
    const kq: any = req(() => oBaoCao(P.admin, { ...fb, o: 'kq-mt:mt1:dat' }));
    dongLuot(kq, kq.n, 'kq-mt:mt1:dat');
  });

  /* ---------- Phân tích GV + hồ sơ GV ---------- */
  const fg = { cn, ct: 'ft' as const, tu: TU, den: DEN };
  const gvKq: any = req(() => phanTichGiaoVien(P.admin, fg));
  const gvTb = gvKq.hang.find((h: any) => h.tienBo?.k === 'so' && h.tienBo.tong > 0);

  check('PT-PANEL · Phân tích GV · Tiến bộ: kiểu tang-giam, ketQua dat ⇔ tăng, số = dòng', () => {
    assert(gvTb, 'demo phải có GV có Tiến bộ');
    const r: any = req(() => oChiSoGv(P.admin, { ...fg, gv: gvTb!.id, cot: 'tien-bo' }));
    assert(r.bangLuot && r.kieu === 'tang-giam' && r.n === gvTb!.tienBo.tong && r.rows.length === r.n, `tien-bo: ${r.kieu} ${r.rows.length} ≠ ${gvTb!.tienBo.tong}`);
    for (const row of r.rows) assert((row.ketQua === 'dat') === (row.tangGiam.sau.v > row.tangGiam.truoc.v), `dòng ${row.id}: ketQua lệch tăng`);
  });

  check('PT-PANEL · Phân tích GV · Đạt kỳ vọng Test + HV cần chú ý: bảng lượt có điểm', () => {
    const h = gvKq.hang.find((x: any) => x.datMt?.k === 'so' && x.datMt.tong > 0);
    assert(h, 'demo phải có GV có Đạt kỳ vọng Test');
    const r: any = req(() => oChiSoGv(P.admin, { ...fg, gv: h!.id, cot: 'dat-mt' }));
    dongLuot(r, h!.datMt.tong, 'dat-mt GV');
    assert(r.rows.every((row: any) => row.luotDiem.knCua?.length), 'dòng Đạt kỳ vọng phải nêu kỹ năng của GV (knCua)');
    const c = gvKq.hang.find((x: any) => x.hvChuY > 0);
    if (c) dongLuot(req(() => oChiSoGv(P.admin, { ...fg, gv: c.id, cot: 'hv-chu-y' })), c.hvChuY, 'hv-chu-y');
  });

  check('PT-PANEL · hồ sơ GV (Tổng quan "HV tiến bộ" + Lớp tôi dạy): kiểu tang-giam, số = dòng', () => {
    /* Hồ sơ GV xem ≤ 13 tuần — tìm một kỳ GV có Tiến bộ. */
    const ky = ['2026-09-14', '2026-08-17', '2026-07-20', '2026-06-22', '2026-05-25'].map((den) => ({ tu: addDaysIso(den, -84), den }))
      .find((k) => { const x: any = req(() => chiSoHoSoGv(P.admin, gvTb!.id, k)).tienBo; return x?.k === 'so' && x.tong > 0; });
    assert(ky, 'GV phải có Tiến bộ trong một kỳ 13 tuần');
    const r: any = req(() => oChiSoHoSoGv(P.admin, gvTb!.id, { cot: 'tien-bo', ...ky! }));
    assert(r.n > 0 && r.bangLuot && r.kieu === 'tang-giam' && r.rows.length === r.n, `tien-bo hồ sơ: ${r.kieu} ${r.rows.length} ≠ ${r.n}`);
    assert(r.rows.every((row: any) => row.tangGiam && row.tangGiam.kn && (row.ketQua === 'dat') === (row.tangGiam.sau.v > row.tangGiam.truoc.v)), 'dòng hồ sơ thiếu tangGiam');
  });

  /* ================= PR-2 PT-LOP-THUONG ================= */
  const { cotExcel, bangXuatTongHop } = await import('../../../shared/domain/phanTich.ts');
  const ft2 = { ...f, ct: 'thuong' as const };
  const th = req(() => tongHop(P.admin, ft2));

  check('PT-LOP-THUONG · cột màn lớp thường bỏ Checkpoint, Mini Test, Xử lý; Excel giữ', () => {
    const k = cotSoLieu('thuong').map((c) => c.khoa);
    assert(!k.some((x) => x.startsWith('cp-') || x.startsWith('mini-')), `còn cột Checkpoint / Mini: ${k.join(',')}`);
    assert(!cotSoLieu('thuong').some((c) => c.nhom === 'xu-ly'), 'còn nhóm Xử lý');
    const e = cotExcel('thuong').map((c) => c.khoa);
    assert(['cp-dat', 'mini-dat', 'choDuyet', 'hvCoCase'].every((x) => e.includes(x)), `Excel thiếu cột cũ: ${e.join(',')}`);
    assert(cotSoLieu('ft').map((c) => c.khoa).join() === cotExcel('ft').map((c) => c.khoa).join(), 'FT không đổi');
  });

  check('PT-LOP-THUONG · Bài kiểm tra = Progress + Final + Thiếu điểm (không Checkpoint)', () => {
    const t0 = th.tong;
    const cong = ['gk-dat', 'gk-1', 'gk-2', 'ck-duoi50', 'ck-50', 'ck-60', 'ck-dat', 'chuaDu'].reduce((n, k) => n + (t0[k] ?? 0), 0);
    assert(t0.luot > 0 && t0.luot === cong, `Bài ${t0.luot} ≠ Σ ${cong}`);
  });

  check('PT-LOP-THUONG · Excel lớp thường còn nhóm Mini Test + Xử lý', () => {
    const x = bangXuatTongHop(th, new Set(['ket-qua', 'ky-nang', 'xu-ly'] as const), 'kiểm');
    const dau = x[2].join('|');
    assert(dau.includes('Mini Test') && dau.includes('Xử lý'), `đầu Excel: ${dau}`);
  });

  check('PT-LOP-THUONG · mọi ô lớp thường (Tổng + 2 hàng + 1 hàng con): bảng bài có điểm, n === rows.length, không bài Checkpoint', () => {
    const hang = [{ khoa: 'tong', o: th.tong }, ...th.hang.slice(0, 2).flatMap((h: any) => [h, ...(h.con ?? []).slice(0, 1)])];
    let so = 0;
    for (const c of cotSoLieu('thuong')) {
      for (const h of hang) {
        const n = h.o[c.khoa] ?? 0;
        if (!n) continue;
        const r: any = req(() => oTongHop(P.admin, { ...ft2, khoa: h.khoa, cot: c.khoa }));
        assert(r.bangLuot && r.kieu === 'bai-thuong' && r.rows.length === n && r.n === n, `${h.khoa} × ${c.khoa}: ${r.kieu} ${r.rows.length} ≠ ${n}`);
        for (const row of r.rows) {
          const b = row.baiThuong;
          assert(b && b.bai !== 'checkpoint' && Object.keys(b.mon).length > 0 && b.chuongTrinh, `${c.khoa}: dòng ${row.id} sai ${JSON.stringify(b)}`);
          for (const o of Object.values(b.mon) as any[]) assert(o === null || (o.dung <= o.tong && o.tong > 0), `ô môn sai ${JSON.stringify(o)}`);
        }
        so++;
      }
    }
    assert(so >= 4, `quá ít ô lớp thường có số (${so})`);
  });

  check('PT-LOP-THUONG · đường cũ cot=cp-dat / mini-dat / choDuyet (lớp thường) vẫn mở panel cũ, không lỗi', () => {
    for (const cot of ['cp-dat', 'mini-dat', 'choDuyet']) {
      const r: any = req(() => oTongHop(P.admin, { ...ft2, khoa: 'tong', cot }));
      assert(r.rows.length === r.n, `${cot}: ${r.n} / ${r.rows.length}`);
    }
  });

  check('PT-LOP-THUONG · Phân tích GV · Đạt Test (lớp thường): bảng bài, số = dòng', () => {
    const g: any = req(() => phanTichGiaoVien(P.admin, { ...fg, ct: 'thuong' as const }));
    const tong = (h: any) => Object.values(h.ketQua ?? {}).reduce((n: number, o: any) => n + (o?.k === 'so' ? o.tong : 0), 0);
    const h = g.hang.find((x: any) => tong(x) > 0);
    assert(h, 'demo phải có GV lớp thường có Đạt Test');
    const r: any = req(() => oChiSoGv(P.admin, { ...fg, ct: 'thuong' as const, gv: h.id, cot: 'ket-qua' }));
    assert(r.bangLuot && r.kieu === 'bai-thuong' && r.rows.length === r.n && r.n === tong(h), `GV thường: ${r.kieu} ${r.rows.length} / ${r.n} / ${tong(h)}`);
    assert(r.rows.every((row: any) => row.baiThuong?.monCua?.length), 'dòng phải nêu môn GV phụ trách (monCua)');
  });

  /* ================= PR-3 PT-VP-PA ================= */
  const { yThucPhanTich, oYThucPhanTich } = await import('../phanTich/yThucPhanTich.ts');
  const { hieuQuaPa, oHieuQuaPa } = await import('../phanTich/hieuQuaPa.ts');
  const fy = { branchId: null, ct: null, from: '2026-03-02', to: '2026-09-14' };
  const fp = { branchId: null, ct: 'ft' as const, soTuan: 26, tu: TU, den: DEN };
  const coDong = (r: any, ten: string, khoa: string[]) => {
    assert(r.rows.length === r.n, `${ten}: ${r.rows.length} ≠ ${r.n}`);
    assert(r.rows.every((row: any) => khoa.some((k) => row[k])), `${ten}: còn dòng chỉ có tên ${JSON.stringify(r.rows.find((row: any) => !khoa.some((k) => row[k])))}`);
  };

  check('PT-VP-PA · thẻ "Lớp có vi phạm" → dòng lớp đủ cột (GVCN, HV có vi phạm / sĩ số, vi phạm, chưa xử lý)', () => {
    const r: any = req(() => oYThucPhanTich(P.admin, { ...fy, dong: 'tong', cot: 'lop' }));
    assert(r.n > 0 && r.bangLuot && r.kieu === 'vi-pham', `kiểu ${r.kieu}, n ${r.n}`);
    coDong(r, 'tong × lop', ['viPhamLop']);
    assert(r.rows.every((row: any) => row.viPhamLop.viPham > 0 && 'gvcn' in row.viPhamLop && 'siSo' in row.viPhamLop && row.viPhamLop.hvViPham > 0), 'dòng lớp thiếu cột');
  });

  check('PT-VP-PA · mọi ô Ý thức (Tổng, mỗi lớp + nhóm, HV cần chú ý): dòng đủ thông tin, số = dòng', () => {
    const y: any = req(() => yThucPhanTich(P.admin, fy));
    const dong = [{ khoa: 'tong' }, ...y.lop.slice(0, 3).flatMap((l: any) => [{ khoa: l.khoa }, ...(l.con ?? []).slice(0, 1).map((c: any) => ({ khoa: c.khoa }))]), ...(y.gom ? [{ khoa: 'gom' }] : [])];
    let so = 0;
    for (const d of dong) for (const cot of ['vi-pham', 'chua-xu-ly', 'hv-co-vi-pham']) {
      const r: any = req(() => oYThucPhanTich(P.admin, { ...fy, dong: d.khoa, cot }));
      if (!r.n) continue;
      coDong(r, `${d.khoa} × ${cot}`, cot === 'hv-co-vi-pham' ? ['viPhamEm'] : ['viPham']);
      if (cot !== 'hv-co-vi-pham') assert(r.rows.every((row: any) => row.viPham.ngay && row.viPham.nhom && row.viPham.trangThai), `${cot}: thiếu ngày / nhóm / trạng thái`);
      so++;
    }
    for (const h of y.hvCanChuY.slice(0, 2)) for (const cot of ['vi-pham', 'chua-xu-ly']) {
      const r: any = req(() => oYThucPhanTich(P.admin, { ...fy, dong: `hv:${h.studentId}`, cot }));
      if (r.n) { coDong(r, `hv × ${cot}`, ['viPham']); so++; }
    }
    if (y.hvCanChuY.length) coDong(req(() => oYThucPhanTich(P.admin, { ...fy, dong: 'hv-can-chu-y', cot: 'hv' })), 'hv-can-chu-y', ['viPhamEm']);
    assert(so >= 4, `quá ít ô Ý thức có số (${so})`);
  });

  check('PT-VP-PA · mọi ô Hiệu quả PA + Báo cáo HV "PA cải thiện": dòng PA có loại · kết quả · người, số = dòng; "PA chưa có kết quả" giữ việc Ghi kết quả', () => {
    const h: any = req(() => hieuQuaPa(P.admin, fp));
    let so = 0;
    for (const d of ['tong', ...h.gvThem.hang.slice(0, 2).map((x: any) => x.khoa), ...h.quyChe.hang.slice(0, 2).map((x: any) => x.khoa)]) {
      for (const cot of ['pa', 'cai-thien', 'hv']) {
        const r: any = req(() => oHieuQuaPa(P.admin, { ...fp, dong: d, cot }));
        if (!r.n) continue;
        assert(r.bangLuot && r.kieu === 'pa', `${d} × ${cot}: kiểu ${r.kieu}`);
        coDong(r, `${d} × ${cot}`, ['pa']);
        assert(r.rows.every((row: any) => row.pa.loaiPa && 'ketQua' in row.pa && 'nguoiPhuTrach' in row.pa && row.pa.lop !== undefined), `${d} × ${cot}: dòng PA thiếu cột`);
        if (cot !== 'hv') assert(r.rows.every((row: any) => row.pa.ketQua), `${d} × ${cot}: PA có kết quả phải có ketQua`);
        so++;
      }
    }
    assert(so >= 3, `quá ít ô Hiệu quả PA có số (${so})`);
    const chua: any = req(() => oHieuQuaPa(P.admin, { ...fp, dong: 'chua-ghi-ket-qua', cot: 'pa' }));
    assert(!chua.n || (chua.rows.some((row: any) => row.viec) && !chua.bangLuot), 'PA chưa có kết quả phải giữ việc Ghi kết quả (XM-4)');
    const bc: any = req(() => oBaoCao(P.admin, { ct: 'ft', branchId: 1, tu: TU, den: DEN, o: 'pa-co-ket-qua' }));
    if (bc.n) { assert(bc.kieu === 'pa', `Báo cáo PA cải thiện: ${bc.kieu}`); coDong(bc, 'pa-co-ket-qua', ['pa']); assert(bc.rows.every((row: any) => row.pa.ketQua), 'PA cải thiện thiếu ketQua'); }
  });

  check('PT-VP-PA · Phân tích GV · PA hiệu quả: dòng PA; Việc đúng hạn + Chấm Test đúng hạn: dòng việc (DEM-QUA-HAN b) — số = dòng', () => {
    let so = 0;
    for (const x of gvKq.hang.slice(0, 7)) for (const cot of ['viec-dung-han', 'cham-diem', 'pa-hieu-qua']) {
      const r: any = req(() => oChiSoGv(P.admin, { ...fg, gv: x.id, cot }));
      if (!r.n) continue;
      const viec = cot !== 'pa-hieu-qua';
      assert(r.kieu === (viec ? 'viec' : 'pa'), `${cot}: kiểu ${r.kieu}`);
      coDong(r, `GV ${x.id} × ${cot}`, [viec ? 'dongViec' : 'pa']);
      if (viec) {
        const ds = r.rows.map((row: any) => row.dongViec);
        assert(ds.every((v: any) => v.ten && v.href && v.han && typeof v.dung === 'boolean' && (cot === 'cham-diem') === (v.tab === 'cham')), `${cot}: dòng việc thiếu trường / sai tab ${JSON.stringify(ds[0])}`);
        /* Đang quá hạn (còn mở) đứng đầu; đã làm: trễ trước đúng hạn. */
        const hang = ds.map((v: any) => (v.mo ? 0 : v.dung ? 2 : 1));
        assert(hang.every((h: number, i: number) => !i || hang[i - 1] <= h), `${cot}: thứ tự ${hang.join('')}`);
        assert(ds.every((v: any) => !v.mo || (!v.ngayXong && !v.dung && v.treNgay > 0)), `${cot}: việc mở phải chưa làm, trễ n ngày`);
        if (cot === 'cham-diem') assert(ds.every((v: any) => /^\/(mock-test|luot-test|hoc-vien)\//.test(v.href)), `cham-diem: href ${ds[0].href}`);
      }
      so++;
    }
    assert(so >= 2, 'demo phải có ô Việc / Chấm Test của GV');
  });
}
