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
  const { oChiSoGv, phanTichGiaoVien, oChiSoHoSoGv } = await import('../phanTich/giaoVien.ts');
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
          assert(x && dk(x) && Math.abs(x.chenh - (x.sau.v - x.truoc.v)) < 1e-9 && x.truoc.mt < x.sau.mt && 'kyVong' in x, `${h.skill}:${o} dòng sai ${JSON.stringify(x)}`);
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
    const r: any = req(() => oChiSoHoSoGv(P.admin, gvTb!.id, { cot: 'tien-bo', tu: TU, den: '2026-05-25' }));
    assert(r.bangLuot && r.kieu === 'tang-giam' && r.rows.length === r.n, `tien-bo hồ sơ: ${r.kieu} ${r.rows.length} ≠ ${r.n}`);
    assert(r.rows.every((row: any) => row.tangGiam && row.tangGiam.kn && (row.ketQua === 'dat') === (row.tangGiam.sau.v > row.tangGiam.truoc.v)), 'dòng hồ sơ thiếu tangGiam');
  });
}
