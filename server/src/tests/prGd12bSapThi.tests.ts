/**
 * GD-12b-a (Phân tích › Thi thật, mockup ⑨ C1 / C4–C6, lời 37): ô "Sắp thi · tới hết T{tháng sau} · còn SOS" — số ô = số dòng panel (cùng `tapSapThiSos`);
 * định nghĩa: em trong phạm vi · lộ trình đang chạy chưa thi · ngày chốt từ hôm nay tới hết tháng sau HOẶC tháng dự kiến là tháng này / tháng sau · đang SOS ở lượt mới nhất.
 * Đã chốt ngày trước, dự kiến cuối; chip SOS n = lọc mức; lọc lớp = lớp em đang học; vai không có Phân tích → 403.
 */
export async function runPrGd12bSapThiTests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  const st: any = await import('../phanTich/sapThiSos.ts');
  const tt: any = await import('../phanTich/thiThatThongKe.ts');
  const dg: any = await import('../worklist/danhGia.ts');
  const ct0: any = await import('../worklist/chuongTrinh.ts');
  console.log('\nGD-12b-a · Sắp thi · còn SOS (máy chủ)');
  const k = { branchId: null, tu: '2026-07-06', den: '2026-09-27' };

  check('GD-12b-a · thangSau: 11 → 12, 12 → 01 năm sau', () => {
    assert(st.thangSau('2026-11') === '2026-12' && st.thangSau('2026-12') === '2027-01', 'thangSau');
  });

  check('GD-12b-a · ô = panel; chia SOS và chốt / dự kiến cộng đủ; chip SOS n = lọc mức; định nghĩa đúng (tập tính lại độc lập)', () => {
    const den = st.thangSau(TODAY.slice(0, 7));
    /* Bộ demo có thể không có em sắp thi đúng cửa sổ: dựng hai em SOS (một chốt ngày, một tháng dự kiến) rồi trả lại như cũ. */
    const sos = dg.hvSosHienTai(P.mbManager, null, TODAY);
    const cy = conn.prepare(`SELECT id, student_id, exam_date, exam_month FROM learning_cycles WHERE status = 'active' AND thi_that_khong_thi = 0 AND thi_that_ngay IS NULL AND outcome_score IS NULL AND student_id IN (${sos.ids.map(() => '?').join(',') || 'NULL'}) ORDER BY id LIMIT 2`).all(...sos.ids) as any[];
    assert(cy.length === 2, 'bộ demo cần ít nhất hai em SOS có lộ trình đang chạy');
    const cu = cy.map((c) => ({ ...c }));
    const ngay = `${den}-05`;
    try {
      conn.prepare('UPDATE learning_cycles SET exam_date = ?, exam_month = ? WHERE id = ?').run(ngay, den, cy[0].id);
      conn.prepare('UPDATE learning_cycles SET exam_date = NULL, exam_month = ? WHERE id = ?').run(TODAY.slice(0, 7), cy[1].id);
      const o = st.sapThiSos(P.mbManager, k);
      const pn = st.oSapThiSos(P.mbManager, { ...k, o: 'sap-thi' });
      assert(o.n === pn.n && o.n === pn.rows.length && o.n >= 2, `ô ${o.n} · panel ${pn.n}`);
      assert(o.sos[0] + o.sos[1] + o.sos[2] === o.n && o.chot + o.duKien === o.n && o.den === den, JSON.stringify(o));
      for (const m of [1, 2, 3]) assert(st.oSapThiSos(P.mbManager, { ...k, o: `sap-thi:${m}` }).n === o.sos[m - 1], `chip SOS ${m}`);
      assert(pn.rows.some((r: any) => r.id === cy[0].student_id && r.lichThi.ngay === ngay) && pn.rows.some((r: any) => r.id === cy[1].student_id && !r.lichThi.ngay), 'hai em dựng phải có');
      /* Tập tính lại độc lập: em trong phạm vi ∩ SOS hiện tại ∩ lộ trình đang chạy có lịch trong cửa sổ. */
      const hv = new Set(dg.studentsInScope(P.mbManager, null));
      const coLich = new Set((conn.prepare(`SELECT student_id FROM learning_cycles WHERE status = 'active' AND thi_that_khong_thi = 0 AND thi_that_ngay IS NULL AND outcome_score IS NULL
        AND ((exam_date >= ? AND exam_date <= ?) OR (exam_date IS NULL AND exam_month IN (?, ?)))`).all(TODAY, `${den}-31`, TODAY.slice(0, 7), den) as any[]).map((r) => r.student_id));
      const mong = dg.hvSosHienTai(P.mbManager, null, TODAY).ids.filter((id: number) => hv.has(id) && coLich.has(id)).sort((a: number, b: number) => a - b);
      const co = pn.rows.map((r: any) => r.id).sort((a: number, b: number) => a - b);
      assert(JSON.stringify(mong) === JSON.stringify(co), `tập: mong ${mong} · có ${co}`);
      /* Đã chốt ngày trước, dự kiến cuối. */
      const dau = pn.rows.findIndex((r: any) => !r.lichThi.ngay);
      assert(dau < 0 || pn.rows.slice(dau).every((r: any) => !r.lichThi.ngay), 'dự kiến phải ở cuối');
      assert(pn.rows.every((r: any) => r.sos.muc >= 1 && r.sos.muc <= 3 && r.href === `/hoc-vien/${r.id}`), 'dòng: mức SOS 1–3, link hồ sơ');
      /* Tab Thi thật kèm ô — cùng số. */
      assert(tt.thiThatTab(P.mbManager, k).sapThi.n === o.n, 'thiThatTab.sapThi');
      /* Lọc lớp = lớp em đang học. */
      const lop = ct0.lopCuaTap('hoc-vien', [cy[0].student_id]).get(cy[0].student_id);
      if (lop?.classId) {
        const ol = st.oSapThiSos(P.mbManager, { ...k, classId: lop.classId, o: 'sap-thi' });
        assert(ol.rows.some((r: any) => r.id === cy[0].student_id) && ol.rows.every((r: any) => r.classId === lop.classId), 'lọc lớp');
      }
      /* Lịch đã qua (trước hôm nay) hoặc ngoài cửa sổ → không vào. */
      conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = ?').run(`${st.thangSau(den)}-05`, cy[0].id);
      assert(!st.oSapThiSos(P.mbManager, { ...k, o: 'sap-thi' }).rows.some((r: any) => r.id === cy[0].student_id), 'ngày sau tháng sau không vào');
    } finally {
      for (const c of cu) conn.prepare('UPDATE learning_cycles SET exam_date = ?, exam_month = ? WHERE id = ?').run(c.exam_date, c.exam_month, c.id);
    }
  });

  check('GD-12b-a · vai không có Phân tích → 403; o sai → 400', () => {
    let ma = 0;
    try { st.sapThiSos(P.subjectTeacher, k); } catch (e: any) { ma = e.status; }
    assert(ma === 403, `GVBM: ${ma}`);
    ma = 0;
    try { st.oSapThiSos(P.mbManager, { ...k, o: 'sap-thi:4' }); } catch (e: any) { ma = e.status; }
    assert(ma === 400, `o sai: ${ma}`);
  });
}
