/**
 * PHÉP KIỂM LG-8 (Overhaul V6): `testSapToiCuaGv` — "Test sắp tới" từng lớp GV đang dạy (khối "Lớp của tôi" ở trang đầu GV), phục vụ `/my-work`.
 * Cùng nguồn `lopToiDay` (FT: lượt mốc kế tiếp; lớp thường: Progress / Final kế tiếp); lớp chưa có lịch → null; người không phân công → [].
 * Vai nào được gắn trường vào JSON `/my-work` + số câu (+3 câu vai GV, trần `tocDoDuong`): đo ở `tocDo.run.ts` (đường `GVCN /my-work` …).
 */
export async function runPrMyWorkTestSapToiTests(t: any) {
  const { check, assert, conn, P } = t;
  const tq: any = await import('../worklist/tongQuan.ts');
  const perm: any = await import('../permissions.ts');
  console.log('\nLG-8 · /my-work: Test sắp tới từng lớp của GV');

  /** Hàng `lopToiDay` của mọi lớp (FT + thường) → classId → { testKeTiep, testTuanNay }. */
  const theoV4 = (p: any) => new Map<number, any>(['ft', 'thuong'].flatMap((ct) =>
    tq.lopToiDay(p, { ct }).rows.map((r: any) => [r.classId, { testKeTiep: r.testKeTiep, testTuanNay: r.testTuanNay }])));

  check('LG-8 · lớp FT / lớp thường: mỗi lớp đang dạy một dòng, Test sắp tới = đúng `lopToiDay` (V4)', () => {
    let ft = 0, thuong = 0;
    for (const p of [P.coreTeacher, P.subjectTeacher, P.normalCoreTeacher, P.normalSubjectTeacher]) {
      const r = tq.testSapToiCuaGv(p) as any[];
      const v4 = theoV4(p);
      assert(r.length === v4.size, `${p.fullName}: ${r.length} dòng ≠ ${v4.size} lớp V4`);
      for (const x of r) {
        const o = v4.get(x.classId);
        assert(o && o.testKeTiep === x.testKeTiep && o.testTuanNay === x.testTuanNay, `${p.fullName} lớp ${x.classId}: ${JSON.stringify(x)} ≠ V4 ${JSON.stringify(o)}`);
        if (x.testKeTiep) (/^MT\d+ · /.test(x.testKeTiep) ? ft++ : thuong++);
      }
    }
    assert(ft > 0, 'demo: phải có lớp FT với MT kế tiếp');
    assert(thuong > 0, 'demo: phải có lớp thường với Progress / Final kế tiếp');
  });

  check('LG-8 · mọi GV có phân công trong DB: khớp V4, lớp chưa có lịch → null + testTuanNay false, không lớp trùng', () => {
    const ids = conn.prepare(`SELECT DISTINCT user_id u FROM teacher_assignments WHERE status = 'active'`).all().map((r: any) => r.u as number);
    let chuaLich = 0;
    for (const id of ids) {
      const p = perm.loadPrincipal(id);
      const r = tq.testSapToiCuaGv(p) as any[];
      const v4 = theoV4(p);
      assert(new Set(r.map((x) => x.classId)).size === r.length, `GV ${id}: lớp trùng`);
      assert(r.length === v4.size, `GV ${id}: ${r.length} dòng ≠ ${v4.size} lớp V4`);
      for (const x of r) {
        const o = v4.get(x.classId);
        assert(o && o.testKeTiep === x.testKeTiep && o.testTuanNay === x.testTuanNay, `GV ${id} lớp ${x.classId}: ${JSON.stringify(x)} ≠ V4`);
        if (x.testKeTiep === null) { chuaLich++; assert(x.testTuanNay === false, `GV ${id} lớp ${x.classId}: chưa lịch mà testTuanNay`); }
      }
    }
    console.log(`    (${ids.length} GV, ${chuaLich} lớp chưa có lịch)`);
  });

  check('LG-8 · người không phân công lớp nào (QL) → []', () => {
    const r = tq.testSapToiCuaGv(P.mbManager);
    assert(Array.isArray(r) && r.length === 0, `QL: ${JSON.stringify(r)}`);
  });
}
