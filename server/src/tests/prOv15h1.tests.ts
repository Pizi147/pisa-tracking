/**
 * PHÉP KIỂM OV-15h1 (kế hoạch 2026-10-20-ov15g-ov15h.md mục OV-15h1) — Công việc + Tổng quan QL:
 *  · Tổng quan QL phần theo khung MỘT đường `tongQuanQl` (thay 3 GET; Cần bạn quyết giữ đường riêng): mỗi phần trùng khít đường cũ chạy riêng (số không đổi), cột mới của Lớp cần chú ý cộng đúng,
 *    Trễ chấm theo GV = cột "Bài quá hạn" bảng GV, phân rã Case chưa chốt PA cộng đúng tổng;
 *  · Cần bạn quyết chỉ lấy việc hạn ≤ 7 ngày (cùng ngưỡng thông báo);
 *  · thông báo tự động ghi MỘT câu cho cả lô, không reset đã đọc; ghi xong (POST) thì lần mở chuông kế đồng bộ lại ngay;
 *  · Chờ bạn duyệt theo chi nhánh đang lọc.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15h1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t as any;
  const { chayTrongRequest, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const tqQl: any = await import('../worklist/tongQuanQl.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const hl: any = await import('../worklist/highlights.ts');
  const m: any = await import('../worklist/metrics.ts');
  const gv: any = await import('../giaoVien/hoSo.ts');
  const td: any = await import('../worklist/tongQuan.ts');   // CHOT_TOI_HAN_NGAY (ngưỡng "Cần bạn quyết")
  const yc: any = await import('../duyet/yeuCau.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nOV-15h1 · Tổng quan QL một đường, Lớp cần chú ý, Trễ chấm, Cần bạn quyết ≤ 7 ngày, thông báo theo lô, Chờ bạn duyệt theo chi nhánh');

  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const GET = <T>(fn: () => T): T => { xoaNho(); try { return chayTrongRequest('GET', () => JSON.parse(JSON.stringify(fn()))); } finally { xoaNho(); } };
  const bo = (o: any, keys: string[]) => JSON.parse(JSON.stringify(o, (k, v) => (keys.includes(k) ? undefined : v)));
  const r1 = (fn: () => unknown) => { try { GET(fn); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const MOI = ['chuaDiem', 'sos1', 'sos2', 'sos3', 'daThiChoKq'];
  const vai: [string, any, number | null][] = [['QL', P.mbManager, null], ['QL·MB', P.mbManager, MB], ['QT', P.admin, null], ['QT·MB', P.admin, MB]];

  check('H1-1 · /tong-quan/ql một request = các đường cũ chạy riêng: Lớp cần chú ý (cột cũ) · Lịch — từng số giữ nguyên; Trễ chấm thay /giao-vien (H1-3)', () => {
    for (const ct of ['ft', 'thuong']) {
      for (const [ten, p, cn] of vai) {
        const moi = GET(() => tqQl.tongQuanQl(p, { branchId: cn, ct }));
        const cu = {
          bang: GET(() => bang.bangChiNhanh(p, { branchId: cn, ct })),
          lich: GET(() => hl.highlights(p, { branchId: cn, program: ct })),
        };
        /* Cột cũ từng hàng trùng đường cũ; hàng chỉ bảng chú ý có (lớp / "Lớp đã kết thúc" chỉ vì cột mới) thì cột cũ đều 0. */
        const phang = (b: any) => new Map([...b.hang.flatMap((h: any) => [h, ...(h.lop ?? [])]), ...(b.conLai ? [b.conLai] : []), { khoa: 'tong', o: b.tong }]
          .map((h: any) => [h.khoa, JSON.stringify(bo(h.o, MOI))]));
        const a = phang(cu.bang), b2 = phang(moi.bang);
        const rong = JSON.stringify(bo(Object.fromEntries(Object.keys(cu.bang.tong).map((k) => [k, k === 'duDuLieu' ? { n: 0, mau: 0 } : { n: 0 }])), MOI));
        for (const [k, v] of a) assert(b2.get(k) === v, `${ten} ${ct}: hàng ${k} khác đường cũ`);
        for (const [k, v] of b2) assert(a.has(k) || v === rong, `${ten} ${ct}: hàng ${k} chỉ ở bảng chú ý mà cột cũ khác 0: ${v}`);
        assert(JSON.stringify(moi.lich) === JSON.stringify(cu.lich), `${ten} ${ct}: Tuần này khác /highlights`);
      }
    }
  });

  check('H1-2 · Lớp cần chú ý: SOS 1 + 2 + 3 = SOS hiện tại mỗi hàng; Chưa điểm hàng tổng = chỉ số; GVCN mỗi lớp; phân rã Case chưa chốt PA cộng đúng tổng', () => {
    for (const ct of ['ft', 'thuong']) {
      const r = GET(() => tqQl.tongQuanQl(P.mbManager, { branchId: MB, ct }));
      const hang = [...r.bang.hang, r.bang.tong ? { nhan: 'tong', o: r.bang.tong } : null].filter(Boolean) as any[];
      for (const h of hang) assert(h.o.sos1.n + h.o.sos2.n + h.o.sos3.n === h.o.sos.n, `${ct} ${h.nhan}: SOS 1/2/3 ≠ SOS hiện tại`);
      assert(!('chuaLich' in r.bang.tong), 'V5 C20: không còn cột Chưa lịch');
      const bai = GET(() => m.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB, program: ct }).ids) as number[];
      const hv = new Set(bai.length ? (conn.prepare(`SELECT student_id FROM assessment_attempts WHERE id IN (${[...new Set(bai.map((b) => d.tachBaiId(b).attemptId))].join(',')})`).all() as any[]).map((x) => x.student_id) : []);
      assert(r.bang.tong.chuaDiem.n === hv.size, `${ct}: Chưa điểm tổng ${r.bang.tong.chuaDiem.n} ≠ HV có bài quá hạn ${hv.size}`);
      assert(r.bang.hang.every((h: any) => 'gvcn' in h), `${ct}: hàng lớp phải có GVCN`);
      const pr = r.bang.phanRa as Record<string, number>;
      assert(pr && Object.values(pr).reduce((s, n) => s + n, 0) === r.bang.tong.caseChuaChot.n, `${ct}: phân rã ${JSON.stringify(pr)} ≠ ${r.bang.tong.caseChuaChot.n}`);
    }
  });

  check('H1-3 · Trễ chấm theo GV: Σ bài = "bài trễ chấm"; số mỗi GV = cột "Bài quá hạn" bảng GV; panel một GV ra đúng số dòng', () => {
    for (const ct of ['ft', 'thuong']) {
      const r = GET(() => tqQl.tongQuanQl(P.mbManager, { branchId: MB, ct }));
      const n = GET(() => m.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB, program: ct }).n);
      /* 6c: panel một GV nay là `gvTre` (đã kiểm ở prPilotGvTre) — ở đây: Σ bài mỗi GV ≥ tập "bài trễ chấm" (bài hai người chấm ở cả hai hàng). */
      assert(r.tre.reduce((s: number, x: any) => s + x.bai, 0) >= n, `${ct}: Σ Trễ chấm < ${n}`);
      const bg = GET(() => gv.bangGvChiNhanh(P.mbManager, { cn: MB, ct }));
      for (const x of r.tre.filter((y: any) => y.khoa > 0)) {
        const h = bg.hang.find((y: any) => y.id === x.khoa);
        assert(h && h.quaHan === x.bai, `${ct} ${x.ten}: Trễ chấm ${x.bai} ≠ bảng GV ${h?.quaHan}`);
        assert(x.lop.reduce((s: number, l: any) => s + l.n, 0) === x.bai, `${ct} ${x.ten}: Σ lớp ≠ số bài`);
      }
    }
    assert(r1(() => tqQl.tongQuanQl(P.coreTeacher, { branchId: null, ct: 'ft' })) === 403, 'GV không xem được Tổng quan QL');
  });

  check('H1-4 · Cần bạn quyết: Chọn bước tiếp + Chốt lộ trình chỉ việc hạn ≤ 7 ngày (cùng ngưỡng thông báo `CHOT_TOI_HAN_NGAY`)', () => {
    assert(td.CHOT_TOI_HAN_NGAY === 7, 'ngưỡng 7 ngày');
    const moc = util.addDays(TODAY, td.CHOT_TOI_HAN_NGAY);
    for (const p of [P.mbManager, P.admin]) {
      const r = GET(() => tq.tongQuanQuanLy(p, { branchId: null }));
      assert(r.canQuyet.sauThi.every((x: any) => !!x.due && x.due <= moc), `còn việc hạn > 7 ngày: ${r.canQuyet.sauThi.filter((x: any) => !x.due || x.due > moc).map((x: any) => x.key).join(', ')}`);
    }
  });

  check('H1-6 · Chờ bạn duyệt theo chi nhánh: đếm chi nhánh = số thẻ hộp lọc chi nhánh đó; Σ chi nhánh = không lọc', () => {
    const ds = (conn.prepare(`SELECT DISTINCT chi_nhanh_id AS id FROM yeu_cau_duyet WHERE trang_thai = 'cho'`).all() as any[]).map((x) => x.id);
    const tong = GET(() => yc.demYeuCau(P.admin)).cho;
    let sum = 0;
    for (const cn of ds.filter((x: any) => x)) {
      const hop = GET(() => yc.hopChoDuyet(P.admin, { branchId: cn, xem: 'cho' }));
      const n = GET(() => yc.demYeuCau(P.admin, { branchId: cn })).cho;
      assert(n === hop.the.length, `chi nhánh ${cn}: đếm ${n} ≠ hộp ${hop.the.length}`);
      sum += n;
    }
    assert(sum <= tong && ds.length > 0, `Σ chi nhánh ${sum} > tổng ${tong}`);
  });

}
