/** PHÉP KIỂM UI-HO-SO-GV — Hồ sơ GV V5: thi thật (ô, theo kỹ năng, panel có điểm), lọc Đạt / Chưa đạt, Case theo trạng thái. */
export async function runPrUiHoSoGvTests(t: any) {
  const { check, assert, conn, P } = t;
  const pt: any = await import('../phanTich/giaoVien.ts');
  const hs: any = await import('../giaoVien/hoSo.ts');
  const d: any = await import('../../../shared/domain/index.ts');

  /* GV dạy ít nhất một kỹ năng của em có thi thật (lớp FT cuối trước ngày thi) — kỳ phủ ngày thi. */
  const thi = conn.prepare(
    `SELECT cy.thi_that_ngay AS ngay, ta.user_id AS gv FROM learning_cycles cy
       JOIN enrollments e ON e.student_id = cy.student_id JOIN classes k ON k.id = e.class_id AND k.is_fast_track = 1
       JOIN teacher_assignments ta ON ta.class_id = k.id AND ta.skill IS NOT NULL AND ta.status = 'active'
      WHERE cy.thi_that_ngay IS NOT NULL AND cy.outcome IN ('reached', 'not_reached') ORDER BY cy.thi_that_ngay LIMIT 1`).get() as any;

  check('UIHSGV-1 · thi thật: ô = số dòng panel, Chưa đạt trước, mỗi dòng 4 điểm + kỹ năng GV nổi bật + Target; lọc Đạt + Chưa đạt = cả tập', () => {
    assert(thi, 'seed phải có ít nhất một kết quả thi thật đã kết luận');
    const ky = { tu: d.mondayOfDate(d.addDaysIso(thi.ngay, -14)), den: d.mondayOfDate(d.addDaysIso(thi.ngay, 14)) };
    const cs = pt.chiSoHoSoGv(P.admin, thi.gv, ky);
    assert(cs.thiThat.k === 'so' && cs.thiThat.tong >= 1, JSON.stringify(cs.thiThat));
    const p = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that' });
    assert(p.n === cs.thiThat.tong && p.rows.filter((r: any) => r.ketQua === 'dat').length === cs.thiThat.dung, `${p.n} dòng ≠ ${JSON.stringify(cs.thiThat)}`);
    const thuTu = p.rows.map((r: any) => r.ketQua).join(',');
    assert(!/dat,chua/.test(thuTu), `Chưa đạt phải lên trước: ${thuTu}`);
    for (const r of p.rows) {
      assert(r.diemHv?.kn.length === 4 && r.diemHv.kn.some((x: any) => x.cua) && r.soVoi?.nhan === 'Target' && typeof r.soVoi.v === 'number', JSON.stringify(r));
    }
    const dat = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', loc: 'dat' }).n;
    const chua = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', loc: 'chua' }).n;
    assert(dat === cs.thiThat.dung && dat + chua === p.n, `lọc ${dat} + ${chua} ≠ ${p.n}`);
    let loi = '';
    try { pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', loc: 'x' }); } catch (e: any) { loi = e.message; }
    assert(/Lọc phải/.test(loi), 'loc lạ → 400');
    /* Vượt Target: Overall > Target, tập con của Đạt; ô = panel `loc=vuot`. */
    const vuot = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', loc: 'vuot' });
    assert(vuot.n === cs.thiThatVuot && vuot.rows.every((r: any) => r.ketQua === 'dat' && r.diemHv.overall > r.soVoi.v), JSON.stringify({ n: vuot.n, o: cs.thiThatVuot }));
    /* Theo kỹ năng: mỗi kỹ năng = panel `thi-that-ky:<kỹ năng>` (số đạt / số dòng). */
    assert(cs.thiThatTheoKyNang.length >= 1, 'có ít nhất một kỹ năng thi thật');
    for (const k of cs.thiThatTheoKyNang) {
      const q = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: `thi-that-ky:${k.skill}` });
      assert(q.n === k.o.tong && q.rows.filter((r: any) => r.ketQua === 'dat').length === k.o.dung, `${k.skill}: ${q.n} ≠ ${JSON.stringify(k.o)}`);
      assert(q.rows.filter((r: any) => r.vuot).length === k.vuot && k.vuot <= k.o.dung, `${k.skill}: vượt ${k.vuot}`);
    }
    /* Hàng lớp bảng Học thuật: cột Thi thật = panel `thi-that-lop:<lớp>`; Σ các lớp = ô. */
    let tong = 0;
    for (const h of cs.hocThuatTheoLop.filter((x: any) => x.thiThat.k === 'so')) {
      tong += h.thiThat.tong;
      assert(pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: `thi-that-lop:${h.classId}` }).n === h.thiThat.tong, `${h.ma}: thi thật theo lớp`);
    }
    assert(tong === cs.thiThat.tong, `Σ lớp ${tong} ≠ ô ${cs.thiThat.tong}`);
  });

  check('6C-NHO · Pass Target Phân tích GV: panel `thi-that&cn=` chỉ chi nhánh đang chọn — số dòng = ô của hàng GV', () => {
    assert(thi, 'seed phải có ít nhất một kết quả thi thật đã kết luận');
    const ky = { tu: d.mondayOfDate(d.addDaysIso(thi.ngay, -14)), den: d.mondayOfDate(d.addDaysIso(thi.ngay, 14)) };
    const cnGv = (conn.prepare(`SELECT DISTINCT c.branch_id AS cn FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.user_id = ?`).all(thi.gv) as any[]).map((r) => r.cn);
    for (const cn of cnGv) {
      const h = pt.phanTichGiaoVien(P.admin, { cn, ct: 'ft', ...ky }).hang.find((x: any) => x.id === thi.gv);
      const o = pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', cn });
      const tong = h?.thiThat?.k === 'so' ? h.thiThat.tong : 0;
      assert(o.n === tong, `chi nhánh ${cn}: panel ${o.n} dòng ≠ ô ${tong}`);
    }
    const khac = conn.prepare(`SELECT id FROM branches WHERE id NOT IN (${cnGv.map(() => '?').join(',') || 'NULL'}) LIMIT 1`).get(...cnGv) as any;
    if (khac) assert(pt.oChiSoHoSoGv(P.admin, thi.gv, { ...ky, cot: 'thi-that', cn: khac.id }).n === 0, 'chi nhánh GV không dạy phải 0 dòng');
  });

  check('UIHSGV-2 · Case theo trạng thái: Σ các nhóm `tt` = Case đang phụ trách; `tt` lạ → 400', () => {
    const gv = conn.prepare(`SELECT owner_user_id AS gv FROM sos_cases WHERE owner_user_id IS NOT NULL AND status != 'done' GROUP BY owner_user_id ORDER BY COUNT(*) DESC LIMIT 1`).get() as any;
    assert(gv, 'seed có Case đang mở');
    const h = hs.hoSoGiaoVien(P.admin, gv.gv);
    const n = d.TRANG_THAI.reduce((a: number, tt: string) => a + hs.oHoSoGv(P.admin, gv.gv, { cot: 'case-mo', tt }).n, 0);
    assert(n === h.caseMo.length && n === hs.oHoSoGv(P.admin, gv.gv, { cot: 'case-mo' }).n, `${n} ≠ ${h.caseMo.length}`);
    let loi = '';
    try { hs.oHoSoGv(P.admin, gv.gv, { cot: 'case-mo', tt: 'abc' }); } catch (e: any) { loi = e.message; }
    assert(/Trạng thái không hợp lệ/.test(loi), 'tt lạ → 400');
    assert(h.caseMo.every((c: any) => typeof c.coPa === 'boolean'), 'mỗi Case có cờ coPa');
  });
}
