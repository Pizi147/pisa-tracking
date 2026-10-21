/**
 * PHÉP KIỂM SL2 (kế hoạch `docs/superpowers/plans/2026-10-21-pr-sl2.md`) — một phạm vi một trang (9.1-4): Tổng quan QL theo công tắc khung,
 * MỘT "SOS hiện tại" (`hv-sos-hien-tai`) cho Tổng quan · Đang SOS · Báo cáo, PA có kết quả cùng hàm Hiệu quả PA, Chờ duyệt lọc lớp.
 * Nghiệm thu a7 §2.1 (dòng 4, 5, 6, 8): so cùng hàm, cùng tập — không so chuỗi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSl2Tests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const tqQl: any = await import('../worklist/tongQuanQl.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const hvSos: any = await import('../classes/hocVienSos.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const kqThi: any = await import('../phanTich/ketQuaThi.ts');
  const hq: any = await import('../phanTich/hieuQuaPa.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { lopCuaTap } = await import('../worklist/chuongTrinh.ts');
  console.log('\nSL2 · một phạm vi một trang · một SOS hiện tại');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const KHUNG = ['ft', 'thuong'] as const;
  const tap = (xs: Iterable<number>) => JSON.stringify([...new Set(xs)].sort((a, b) => a - b));
  const ms = (p: any, id: string, f: object) => { xoaNho(); return metrics.metricSet(p, id, f); };
  const viecCanQuyet = (r: any) => r.canQuyet.caseQuaHan.length + r.canQuyet.sauThi.length;

  check('SL2-1 · Tổng quan QL: Cần bạn quyết + dải theo công tắc khung (dải = khối Trễ chấm), khung kia báo số việc', () => {
    const ql = P.mbManager;
    const theo: Record<string, any> = {};
    for (const ct of KHUNG) {
      xoaNho();
      const r = tq.tongQuanQuanLy(ql, { branchId: MB, ct });
      theo[ct] = r;
      const dong = (id: string) => r.canXuLy.find((x: any) => x.metricId === id);
      for (const id of ['bai-qua-han-nhap-diem', 'case-xac-dinh-nguyen-nhan-qua-han']) {
        const m = ms(ql, id, { branchId: MB, program: ct });
        assert((dong(id)?.n ?? 0) === m.n, `${ct} ${id}: dải ${dong(id)?.n ?? 0} ≠ chỉ số khung ${m.n}`);
      }
      /* a7 dòng 5: số GV của dải = hàng GV có tên ở khối Trễ chấm (cùng `treCham`, cùng khung). */
      xoaNho();
      const tre = tqQl.tongQuanQl(ql, { branchId: MB, ct }).tre as any[];
      const bai = dong('bai-qua-han-nhap-diem');
      const gvDai = bai && bai.nguoi !== 'ban' ? bai.nguoi.ids.length : 0;
      assert(gvDai === tre.filter((x) => x.khoa > 0).length, `${ct}: dải ${gvDai} GV ≠ khối ${tre.filter((x) => x.khoa > 0).length} GV`);
      assert(tap(r.canQuyet.caseQuaHan.map((x: any) => x.id)) === tap(ms(ql, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId: MB, program: ct }).ids),
        `${ct}: Case quá hạn ở Cần bạn quyết ≠ chỉ số khung`);
      const lop = lopCuaTap('lop', r.canQuyet.sauThi.map((x: any) => x.classId).filter(Boolean));
      for (const x of r.canQuyet.sauThi) {
        if (x.classId) assert(lop.get(x.classId)?.isFt === (ct === 'ft'), `${ct}: việc ${x.key} của lớp ${x.classCode} khác khung`);
      }
    }
    for (const ct of KHUNG) {
      const kia = ct === 'ft' ? 'thuong' : 'ft';
      assert(theo[ct].khungKhac?.ct === kia && theo[ct].khungKhac.n === viecCanQuyet(theo[kia]),
        `${ct}: khungKhac ${JSON.stringify(theo[ct].khungKhac)} ≠ ${viecCanQuyet(theo[kia])} việc ở ${kia}`);
    }
    const n = (ct: string) => theo[ct].canXuLy.find((x: any) => x.metricId === 'case-xac-dinh-nguyen-nhan-qua-han')?.n ?? 0;
    assert(n('ft') + n('thuong') === ms(ql, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId: MB }).n, 'FT + thường = gộp');
  });

  check('SL2-2 · Đang SOS = SOS hiện tại: cùng tập chỉ số + cột SOS Tổng quan, một em một dòng, không lọc tuần', () => {
    const ql = P.mbManager;
    xoaNho();
    const r = hvSos.dangSos(ql, { phamVi: 'chi-nhanh', branchId: MB });
    const em = r.rows.map((x: any) => x.studentId);
    const sos = ms(ql, 'hv-sos-hien-tai', { branchId: MB });
    assert(em.length === new Set(em).size, `một em một dòng: ${em.length} dòng / ${new Set(em).size} em`);
    assert(tap(em) === tap(sos.ids), `Đang SOS ${new Set(em).size} em ≠ SOS hiện tại ${sos.n}`);
    for (const ct of KHUNG) {
      xoaNho();
      const b = bang.bangChiNhanh(ql, { branchId: MB, ct, chuY: true });
      const dongKhung = r.rows.filter((x: any) => x.ft === (ct === 'ft')).map((x: any) => x.studentId);
      assert(tap(dongKhung) === tap(ms(ql, 'hv-sos-hien-tai', { branchId: MB, program: ct }).ids), `${ct}: dòng khung ≠ chỉ số khung`);
      assert(new Set(dongKhung).size === b.tong.sos.n, `${ct}: Đang SOS ${new Set(dongKhung).size} ≠ cột SOS hiện tại Tổng quan ${b.tong.sos.n}`);
    }
    xoaNho();
    const cu = hvSos.dangSos(ql, { phamVi: 'chi-nhanh', branchId: MB, tuan: d.mondayOfDate(TODAY) });
    assert(tap(cu.rows.map((x: any) => x.studentId)) === tap(em), 'link cũ có `tuan` → cùng danh sách (không lọc tuần, không 400)');
    for (const x of r.rows) {
      const tam = sos.splits.tamThoi.includes(x.studentId);
      assert(x.tam === tam, `${x.ten}: cờ tạm ${x.tam} ≠ chỉ số ${tam}`);
    }
  });

  check('SL2-3 · Đang SOS theo phạm vi trang: TVV "HV của tôi" chỉ em mình tư vấn; GV "Lớp tôi dạy" chỉ lớp mình', () => {
    const tvvId = one(`SELECT s.consultant_user_id AS u FROM students s WHERE s.consultant_user_id IS NOT NULL
      GROUP BY s.consultant_user_id ORDER BY COUNT(*) DESC LIMIT 1`)?.u;
    if (tvvId) {
      xoaNho();
      const r = hvSos.dangSos(loadPrincipal(tvvId), { phamVi: 'cua-toi' });
      for (const x of r.rows) assert(one(`SELECT consultant_user_id AS u FROM students WHERE id = ?`, x.studentId).u === tvvId, `TVV thấy em ngoài phạm vi: ${x.ten}`);
    }
    const gv = P.coreTeacher;
    xoaNho();
    const r = hvSos.dangSos(gv, { phamVi: 'toi' });
    const lopToi = new Set(gv.assignments.map((a: any) => a.classId));
    assert(r.rows.length > 0, 'GVCN MB FT 101 phải thấy em SOS của lớp mình (demo)');
    for (const x of r.rows) assert(lopToi.has(x.classId), `GV thấy lớp ngoài phân công: ${x.classCode}`);
  });

  check('SL2-4 · Báo cáo: "SOS hiện tại" (tại hôm nay) = chỉ số sổ, không theo kỳ; SOS trong kỳ = Kết quả thi cùng kỳ (gồm tạm)', () => {
    const ql = P.mbManager;
    const t2 = d.mondayOfDate(TODAY);
    const f = { branchId: MB, ct: 'ft', tu: d.addDaysIso(t2, -14), den: d.addDaysIso(t2, -1) };
    xoaNho();
    const r = bc.baoCao(ql, f);
    const sosNay = ms(ql, 'hv-sos-hien-tai', { branchId: MB, program: 'ft' }).n;
    assert(r.chuY.sosHienTai === sosNay, `Báo cáo SOS hiện tại ${r.chuY.sosHienTai} ≠ ${sosNay}`);
    xoaNho();
    assert(bc.baoCao(ql, { ...f, tu: '2026-01-05', den: '2026-01-18' }).chuY.sosHienTai === sosNay, 'khối tại hôm nay không theo kỳ');
    /* a7 dòng 8: Báo cáo SOS trong kỳ (HV, mức cao nhất) và tab Kết quả thi cùng kỳ cùng tập lượt + cùng luật SOS tạm. */
    xoaNho();
    const kq = kqThi.ketQuaMockKq(ql, { branchId: MB, tu: f.tu, den: f.den });
    const muc = new Map<number, number>();
    for (const x of kq.rows) if (x.sos) muc.set(x.studentId, Math.max(muc.get(x.studentId) ?? 0, x.sos));
    for (const m of [1, 2, 3]) {
      const k = [...muc.values()].filter((v) => v === m).length;
      assert(r.sos.tong[`sos${m}`] === k, `SOS ${m}: Báo cáo ${r.sos.tong[`sos${m}`]} HV ≠ Kết quả thi ${k} HV`);
    }
    const tam = new Set(kq.rows.filter((x: any) => x.sosTam).map((x: any) => x.studentId));
    assert(r.sos.tong.tam === [...muc.keys()].filter((s) => tam.has(s) && !kq.rows.some((x: any) => x.studentId === s && x.sos && !x.sosTam)).length,
      `Báo cáo "n tạm" ${r.sos.tong.tam} ≠ số HV chỉ có SOS tạm`);
    assert(kq.tong.sosTam === kq.rows.filter((x: any) => x.sosTam).length, 'Kết quả thi: tổng lượt SOS tạm');
  });

  check('SL2-5 · PA có kết quả trong kỳ: Báo cáo = Hiệu quả PA cùng chi nhánh + khung + kỳ (một luật khung F03)', () => {
    const qt = P.admin;
    const t2 = d.mondayOfDate(TODAY);
    const tu = d.addDaysIso(t2, -7 * 25), den = d.addDaysIso(t2, 6);
    const soSanh = () => {
      for (const ct of KHUNG) {
        const ky = ms(qt, 'pa-co-ket-qua', { branchId: MB, program: ct, from: tu, to: den });
        xoaNho();
        const pa = hq.paCoKetQua({ branchIds: [MB], ct, tu: d.mondayOfDate(tu), den: d.mondayOfDate(den) });
        assert(tap(ky.ids) === tap(pa.map((x: any) => x.id)), `${ct}: Báo cáo ${ky.n} PA ≠ Hiệu quả PA ${pa.length} PA`);
      }
    };
    soSanh();
    /* Em đổi khung SAU khi làm PA (lượt sinh Case nay nằm ở lớp thường): PA vẫn thuộc khung nơi em học lúc làm PA, ở cả hai nơi. */
    const ky = ms(qt, 'pa-co-ket-qua', { branchId: MB, program: 'ft', from: tu, to: den });
    assert(ky.n > 0, 'demo phải có PA Fast Track có kết quả');
    const luot = one(`SELECT a.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE iv.id = ?`, ky.ids[0])?.id;
    const lopThuong = one(`SELECT id FROM classes WHERE branch_id = ? AND is_fast_track = 0 AND status = 'active' LIMIT 1`, MB).id;
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE id = ?`).run(lopThuong, luot);
      soSanh();
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('SL2-6 · Chờ duyệt lọc theo lớp: không báo "thẻ ở chi nhánh khác" (thẻ của lớp chỉ ở chi nhánh của lớp)', () => {
    const qt = P.admin;
    const lop = one(`SELECT lop_id AS id, chi_nhanh_id AS cn FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND lop_id IS NOT NULL LIMIT 1`)
      ?? { id: one(`SELECT id FROM classes WHERE branch_id = ? LIMIT 1`, MB).id, cn: MB };
    xoaNho();
    const r = yc.hopChoDuyet(qt, { branchId: lop.cn, classId: lop.id });
    assert(!r.khacChiNhanh, `lọc lớp mà vẫn báo ${r.khacChiNhanh} thẻ ở chi nhánh khác`);
  });
}
