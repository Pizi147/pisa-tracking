/**
 * PHÉP KIỂM SV-TQ-GV (XM-5): Tổng quan GV hai khối — số KHÔNG đếm lại: hàng = `lopToiDay` V4, Đạt / Tiến bộ = `chiSoHoSoGv` (hồ sơ GV),
 * Thi tháng này = `tapThiThangNayLop` (Phân tích); mỗi ô = số dòng panel; chỉ lớp của chính GV (lớp khác / hồ sơ GV khác → 403).
 */
export async function runPrSvTqGvTests(t: any) {
  const { check, assert, conn, P } = t;
  const tq: any = await import('../worklist/tongQuan.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  console.log('\nSV-TQ-GV · Tổng quan GV hai khối');
  const ma = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };

  check('SV-TQ-GV · GVCN: Kỹ năng tôi dạy = lớp có kỹ năng, Lớp tôi chủ nhiệm = lớp GVCN; cột V4 trùng `lopToiDay`', () => {
    const r = tq.lopToiDayHaiKhoi(P.coreTeacher);
    assert(r.chuNhiem.length >= 1 && r.chuNhiem.some((x: any) => x.code === 'MB FT 101'), `chủ nhiệm: ${JSON.stringify(r.chuNhiem.map((x: any) => x.code))}`);
    for (const khung of ['ft', 'thuong']) {
      const v4 = new Map(tq.lopToiDay(P.coreTeacher, { ct: khung }).rows.map((x: any) => [x.classId, x]));
      for (const c of r.chuNhiem.filter((x: any) => x.khung === khung)) {
        const o: any = v4.get(c.classId);
        assert(o?.gvcn && o.duoiKyVong === c.duoiKyVong && o.sos === c.sos && o.caseMo === c.caseMo, `${c.code}: chủ nhiệm ≠ V4`);
      }
      for (const d of r.day.filter((x: any) => x.khung === khung)) {
        const o: any = v4.get(d.classId);
        assert(o && (o.kyNang.length || o.baiCho) && o.baiCho === d.baiCho && o.baiQuaHan === d.baiQuaHan, `${d.code}: dạy ≠ V4`);
      }
    }
  });

  check('SV-TQ-GV · Đạt / Tiến bộ theo lớp = hồ sơ GV (`hocThuatTheoLop`) và = số dòng panel `ket-qua-lop` / `tien-bo-lop`', () => {
    for (const p of [P.coreTeacher, P.subjectTeacher, P.normalSubjectTeacher]) {
      const r = tq.lopToiDayHaiKhoi(p);
      const cs = pt.chiSoHoSoGv(p, p.userId, {});
      assert(r.ky.tu === cs.tu && r.ky.den === cs.den, 'kỳ khác hồ sơ GV');
      const ht = new Map(cs.hocThuatTheoLop.map((h: any) => [h.classId, h]));
      for (const d of r.day) {
        const h: any = ht.get(d.classId);
        assert(JSON.stringify(d.ketQua) === JSON.stringify(h?.ketQua ?? null), `${d.code}: Đạt ${JSON.stringify(d.ketQua)} ≠ hồ sơ`);
        if (d.ketQua?.k === 'so') assert(pt.oChiSoHoSoGv(p, p.userId, { cot: `ket-qua-lop:${d.classId}` }).rows.length <= d.ketQua.tong, `${d.code}: panel Đạt vượt ô`);
        if (d.tienBo?.k === 'so') assert(pt.oChiSoHoSoGv(p, p.userId, { cot: `tien-bo-lop:${d.classId}` }).n === d.tienBo.tong, `${d.code}: panel Tiến bộ ≠ ô`);
        if (d.khung === 'thuong') assert(d.tienBo === null, 'lớp thường không Tiến bộ');
      }
    }
  });

  check('SV-TQ-GV · Thi tháng này theo lớp chủ nhiệm = `tapThiThangNayLop` (QL cùng chi nhánh) = số dòng panel', () => {
    let co = 0;
    for (const p of [P.coreTeacher, P.normalCoreTeacher]) {
      const r = tq.lopToiDayHaiKhoi(p);
      for (const c of r.chuNhiem) {
        const ql = [...bc.tapThiThangNayLop(P.mbManager, { ct: c.khung }).values()].filter((x: any) => x.lop === c.classId).length;
        assert(c.thiThangNay === ql, `${c.code}: ${c.thiThangNay} ≠ Phân tích ${ql}`);
        const o = tq.oLopToiDay(p, { ct: c.khung, classId: c.classId, cot: 'thi-thang-nay' });
        assert(o.n === c.thiThangNay && o.rows.length === o.n, `${c.code}: panel ${o.n} ≠ ô ${c.thiThangNay}`);
        co += c.thiThangNay;
      }
    }
    void co;
  });

  check('SV-TQ-GV · GVBM không chủ nhiệm → khối chủ nhiệm rỗng; tài khoản không phân công → hai khối rỗng, không lỗi', () => {
    const r = tq.lopToiDayHaiKhoi(P.subjectTeacher);
    assert(r.day.length >= 1 && r.chuNhiem.every((x: any) => x.classId !== conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get().id), 'GVBM thấy MB FT 101 ở chủ nhiệm');
    const ql = tq.lopToiDayHaiKhoi(P.mbManager);
    assert(!ql.day.length && !ql.chuNhiem.length && ql.ky === null, JSON.stringify(ql));
  });

  check('SV-TQ-GV · quyền: lớp không dạy → 403 (cả Thi tháng này); hồ sơ GV khác → 403; cột lạ → 400', () => {
    const lopKhac = (conn.prepare(`SELECT c.id FROM classes c WHERE c.status = 'active' AND c.id NOT IN (SELECT class_id FROM teacher_assignments WHERE user_id = ?) LIMIT 1`).get(P.subjectTeacher.userId) as any).id;
    assert(ma(() => tq.oLopToiDay(P.subjectTeacher, { ct: 'ft', classId: lopKhac, cot: 'thi-thang-nay' })) === 403, 'lớp không dạy đọc được Thi tháng này');
    assert(ma(() => pt.oChiSoHoSoGv(P.subjectTeacher, P.coreTeacher.userId, { cot: 'ket-qua' })) === 403, 'GV đọc được hồ sơ GV khác');
    const lop = tq.lopToiDayHaiKhoi(P.coreTeacher).chuNhiem[0];
    assert(ma(() => tq.oLopToiDay(P.coreTeacher, { ct: lop.khung, classId: lop.classId, cot: 'x' })) === 400, 'cột lạ không 400');
  });
}
