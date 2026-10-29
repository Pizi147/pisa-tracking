/**
 * PHÉP KIỂM SV-TQ-GV (XM-5): Tổng quan GV hai khối — số KHÔNG đếm lại: hàng = `lopToiDay` V4, Đạt / Tiến bộ = `chiSoHoSoGv` (hồ sơ GV),
 * Thi tháng này = `tapThiThangNayLop` (Phân tích); mỗi ô = số dòng panel; chỉ lớp của chính GV (lớp khác / hồ sơ GV khác → 403).
 */
export async function runPrSvTqGvTests(t: any) {
  const { check, assert, conn, P } = t;
  const tq: any = await import('../worklist/tongQuan.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const perm: any = await import('../permissions.ts');
  const { demoToday }: any = await import('../demoConfig.ts');
  const fs = await import('node:fs');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
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
        if (khung === 'ft') {
          /* SOS theo mức: Σ mức = SOS V4, mỗi mức = số dòng panel `sos<n>`. */
          assert(c.sosMuc.reduce((x: number, y: number) => x + y, 0) === c.sos, `${c.code}: Σ mức SOS ${c.sosMuc} ≠ ${c.sos}`);
          c.sosMuc.forEach((n: number, i: number) => assert(tq.oLopToiDay(P.coreTeacher, { ct: 'ft', classId: c.classId, cot: `sos${i + 1}` }).n === n, `${c.code}: panel SOS ${i + 1} ≠ ${n}`));
        } else assert(c.sosMuc === null, 'lớp thường không SOS');
      }
      for (const d of r.day.filter((x: any) => x.khung === khung)) {
        const o: any = v4.get(d.classId);
        assert(o && (o.kyNang.length || o.baiCho) && o.baiCho === d.baiCho && o.baiQuaHan === d.baiQuaHan, `${d.code}: dạy ≠ V4`);
        assert(!d.hanCham || d.baiCho > 0, `${d.code}: có hạn chấm ${d.hanCham} mà 0 bài`);
      }
    }
  });

  check('SV-TQ-GV · GV Speaking: "Kỹ năng tôi dạy" · Chờ chấm = bài của chính GV, KHÔNG bài S chấm chéo (SUA-CHAM-LAI L4, T02–T03)', () => {
    const p = perm.loadPrincipal(P.sTeacher.userId);
    const r = tq.lopToiDayHaiKhoi(p);
    assert(r.day.length > 0, 'dữ liệu demo: GV S phải có lớp dạy');
    for (const d of r.day) {
      const cn = conn.prepare('SELECT branch_id b FROM classes WHERE id = ?').get(d.classId).b;
      const minh = hoSo.noDiemCuaGv(p, p.userId, demoToday(), [{ id: d.classId, branchId: cn }]);
      assert(minh.every((x: any) => !x.chamCheo && x.userId === p.userId), `${d.code}: còn bài không phải của GV`);
      assert(d.baiCho === minh.length, `${d.code}: Chờ chấm ${d.baiCho} ≠ bài của GV ${minh.length}`);
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

  /* S1 (giảm dòng đọc Turso): Tổng quan GV tính `chiSoHoSoGv` MỘT lần — `/hai-khoi` trả `chiSo`, web thôi GET `/giao-vien/:id/chi-so` ở trang này. */
  check('S1 · Tổng quan GV: `/hai-khoi` chạy `chiSoHoSoGv` đúng MỘT lần, `chiSo` = `/giao-vien/:id/chi-so` kỳ mặc định; web không gọi thêm `/chi-so`', () => {
    let hep = '';
    for (const p of [P.coreTeacher, P.subjectTeacher, P.sTeacher, P.normalCoreTeacher]) {
      const goc = conn.prepare;
      let n = 0;
      /* Câu ngữ cảnh của `nguCanhCuaGv` — mỗi lần `chiSoHoSoGv` chạy đúng một lần. */
      conn.prepare = function (this: unknown, sql: string) {
        if (/SELECT DISTINCT c\.branch_id, c\.is_fast_track FROM teacher_assignments ta/.test(sql)) n++;
        if (/sc\.examiner_user_id = \?\)\)/.test(sql)) hep = sql;
        return goc.call(this, sql);
      };
      let r: any;
      try { r = tq.lopToiDayHaiKhoi(p); } finally { conn.prepare = goc; }
      assert(n === 1, `${p.fullName}: chiSoHoSoGv chạy ${n} lần trong /hai-khoi`);
      const cs = pt.chiSoHoSoGv(p, p.userId, {});
      assert(JSON.stringify(r.chiSo) === JSON.stringify({ tu: cs.tu, den: cs.den, ketQua: cs.ketQua, tienBo: cs.tienBo }), `${p.fullName}: chiSo ≠ /chi-so`);
    }
    /* `napBai` thu hẹp đi MULTI-INDEX OR (lớp · em · GV chấm qua idx_score_examiner), không quét lượt cả chi nhánh. */
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${hep}`).all(...Array((hep.match(/\?/g) ?? []).length).fill(1)) as any[]).map((x) => x.detail as string);
    assert(hep && plan.includes('MULTI-INDEX OR') && plan.some((d) => d.includes('idx_score_examiner')), `kế hoạch napBai thu hẹp: ${plan.join(' | ')}`);
    const web = fs.readFileSync(new URL('../../../../web/src/modules/worklist/TongQuanV5.tsx', import.meta.url), 'utf8');
    const gv = web.slice(web.indexOf('export function TongQuanGvV5'), web.indexOf('export function TongQuanTvvV5'));
    assert(gv.includes(`'/tong-quan/lop-toi-day/hai-khoi'`) && !gv.includes('/chi-so`'), 'TongQuanGvV5 còn GET /giao-vien/:id/chi-so');
  });

  /* S1: `napBai` của MỘT GV chỉ nạp lượt gán được cho GV (lớp GV phân công · em từng ghi danh lớp đó · ô GV đã chấm) — số, panel KHÔNG đổi so với đường đủ. */
  check('S1 · GV nhiều lượt nhất (10 toàn hệ thống, 3 mỗi chi nhánh + khung): chỉ số hồ sơ GV + panel (hồ sơ, Phân tích GV, Chấm điểm) đường thu hẹp = đường đủ (cả chi nhánh + khung)', () => {
    const loi: string[] = [];
    const json = (fn: () => unknown) => { try { return JSON.stringify(fn()); } catch (e: any) { loi.push(String(e?.message)); return `lỗi ${e?.status ?? e?.message}`; } };
    /* Mỗi lời gọi một bộ nhớ request riêng (như GET thật) — không đọc lại cùng tập trong một lời gọi, không dùng chung giữa hai đường. */
    const hai = (fn: () => unknown) => { pt.napDayDuKhiKiem.bat = true; try { const du = json(() => nguCanh.trongBoNho(fn)); pt.napDayDuKhiKiem.bat = false; return [du, json(() => nguCanh.trongBoNho(fn))]; } finally { pt.napDayDuKhiKiem.bat = false; } };
    const sai: string[] = [];
    let coSo = 0;
    const KY = { tu: '2026-03-02', den: '2026-09-14' };
    /*
     * Check đầy đủ (#707): DB nhóm 1 đã phình (phép kiểm trước thêm GV / lớp) — so MỌI GV × hai đường đủ làm run.js chết (0xC0000409) sau 25 phút.
     * Chỉ so GV có nhiều lượt nhất (lớp của GV), đủ phủ GVCN / GVBM / Speaking của demo; tình huống biên ở phép kiểm dưới.
     */
    /* Chỉ tài khoản mở được hồ sơ GV (`phamViHoSoGv`: đang hoạt động + vai giáo viên) — phép kiểm trước có thể khoá / bỏ vai GV. */
    const GV_HANG = `SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN assessment_attempts a ON a.class_id = ta.class_id
      JOIN users u ON u.id = ta.user_id AND u.status = 'active'
      WHERE ta.status IN ('active', 'ended') AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ta.user_id AND ur.status = 'active' AND r.key = 'teacher')
        %s GROUP BY ta.user_id ORDER BY COUNT(DISTINCT a.id) DESC, ta.user_id LIMIT ?`;
    const gvs = (conn.prepare(GV_HANG.replace('%s', '')).all(10) as any[]).map((x) => x.user_id as number);
    for (const gv of gvs) {
      const p = perm.loadPrincipal(gv);
      for (const [ten, fn] of [
        ['chi-so', () => pt.chiSoHoSoGv(p, gv, {})], ['chi-so dài', () => pt.chiSoHoSoGv(p, gv, KY)],
        ...['cham-diem', 'ket-qua', 'tien-bo', 'thi-that'].map((cot) => [`o ${cot}`, () => pt.oChiSoHoSoGv(p, gv, { ...KY, cot })]),
      ] as [string, () => unknown][]) {
        const [du, hep] = hai(fn);
        if (du !== hep) sai.push(`GV ${gv} ${ten}`);
        if (ten === 'chi-so dài' && /"k":"so","dung":\d+,"tong":[1-9]/.test(hep)) coSo++;
      }
    }
    for (const { cn, ft } of conn.prepare(`SELECT c.branch_id AS cn, c.is_fast_track AS ft FROM classes c JOIN assessment_attempts a ON a.class_id = c.id GROUP BY 1, 2 ORDER BY COUNT(*) DESC LIMIT 4`).all() as any[]) {
      const f = { cn, ct: ft ? 'ft' : 'thuong', ...KY };
      const gvCn = (conn.prepare(GV_HANG.replace('%s', 'AND c.branch_id = ? AND c.is_fast_track = ?')).all(cn, ft, 3) as any[]).map((x) => x.user_id);
      for (const gv of gvCn) {
        for (const cot of ['cham-diem', 'ket-qua', 'tien-bo', ...(ft ? ['dat-mt'] : [])]) {
          const [du, hep] = hai(() => pt.oChiSoGv(P.admin, { ...f, gv, cot }));
          if (du !== hep) sai.push(`Phân tích GV cn ${cn} ${f.ct} GV ${gv} ${cot}`);
        }
        const [du, hep] = hai(() => pt.oChamDiemGv(P.admin, { ...f, gv }));
        if (du !== hep) sai.push(`Chấm điểm cn ${cn} ${f.ct} GV ${gv}`);
      }
    }
    assert(!loi.length && coSo >= 5, `lỗi ${loi.slice(0, 3).join(' | ')} · GV có số ${coSo}`);
    assert(!sai.length, `đường thu hẹp ≠ đường đủ: ${sai.join(' | ')}`);
  });

  /*
   * S1: demo không có lượt nào chỉ vào được qua vế "em từng ghi danh lớp GV" hoặc "GV đã chấm" — dựng hai tình huống (cuộn lại sau kiểm):
   * (a) lượt dời sang lớp khác cùng chi nhánh, em vẫn ghi danh lớp GV lúc thi → ô vẫn của GV; (b) GV ngoài lớp chấm Speaking Mock → ô của người chấm.
   */
  check('S1 · đường thu hẹp giữ ô qua ghi danh lúc thi (lượt ở lớp khác) và ô Speaking GV chấm chéo ngoài lớp', () => {
    const { xoaNho } = nguCanh;
    const KY = { tu: '2026-03-02', den: '2026-09-14' };
    const c = pt.nguCanhPtGv(P.admin, { cn: conn.prepare(`SELECT branch_id FROM classes WHERE code = 'MB FT 101'`).get().branch_id, ct: 'ft', ...KY });
    const nap = pt.napBai(P.admin, c);
    const dong = pt.tapChamDiem(c, nap).dong;
    const coPc = (gv: number, lop: number) => c.pc.some((a: any) => a.gv === gv && a.lop === lop);
    const ghiDanh = (sid: number) => new Set((conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ?`).all(sid) as any[]).map((r) => r.class_id));
    const oCua = (gv: number, id: number, hep: boolean) => {
      pt.napDayDuKhiKiem.bat = !hep;
      try { xoaNho(); return pt.oChiSoHoSoGv(perm.loadPrincipal(gv), gv, { ...KY, cot: 'cham-diem' }).rows.some((r: any) => r.id === id); } catch { return false; } finally { pt.napDayDuKhiKiem.bat = false; }
    };
    const lopLuot = (id: number) => conn.prepare(`SELECT class_id FROM assessment_attempts WHERE id = ?`).get(id).class_id;
    /*
     * Thử từng ứng viên trong SAVEPOINT (cuộn lại mỗi lần): ứng viên nào sau khi đổi mà đường ĐỦ vẫn thấy ô của GV (dữ liệu nhóm kiểm đã phình có
     * ô mà ghi danh / phân công khác demo) thì đường thu hẹp phải thấy y hệt. Cần ít nhất một ứng viên như vậy cho mỗi tình huống.
     */
    const thu = (ten: string, ds: { gv: number; id: number; doi: () => void }[]) => {
      let co = 0;
      for (const u of ds.slice(0, 15)) {
        conn.exec('SAVEPOINT s1thu');
        try {
          u.doi();
          if (!oCua(u.gv, u.id, false)) continue;
          co++;
          assert(oCua(u.gv, u.id, true), `${ten}: ô ${u.id} của GV ${u.gv} — đường đủ thấy, thu hẹp KHÔNG`);
        } finally { conn.exec('ROLLBACK TO s1thu; RELEASE s1thu'); xoaNho(); }
        if (co >= 3) break;
      }
      assert(co > 0, `${ten}: không ứng viên nào đường đủ còn thấy ô sau khi đổi`);
    };
    /* (a) ô thường (không chấm chéo) của GV G0 ở lớp L em ghi danh; lượt dời sang L2 cùng chi nhánh mà G0 không phân công. */
    thu('(a) ghi danh lúc thi', nap.o.filter((x: any) => x.skill !== 'speaking' && dong.get(x.id) && x.classId === lopLuot(x.attemptId) && ghiDanh(x.studentId).has(x.classId))
      .flatMap((a: any) => {
        const g0 = dong.get(a.id).gv;
        const l2 = [...c.lop.keys()].find((l) => l !== a.classId && !coPc(g0, l));
        return l2 ? [{ gv: g0, id: a.id, doi: () => conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE id = ?`).run(l2, a.attemptId) }] : [];
      }));
    /* (b) ô Speaking Mock đã ghi người chấm; đổi người chấm sang X — có phân công ở chi nhánh + khung, không ở lớp lúc thi / lớp lượt, em không ghi danh lớp nào của X. */
    thu('(b) GV chấm chéo', nap.o.filter((x: any) => x.kind === 'mock' && x.skill === 'speaking' && x.examinerUserId && dong.get(x.id))
      .flatMap((b: any) => {
        const lopB = lopLuot(b.attemptId);
        const x = [...new Set(c.pc.map((p: any) => p.gv))].find((gv: any) => gv !== b.examinerUserId && !coPc(gv, b.classId) && !coPc(gv, lopB)
          && ![...ghiDanh(b.studentId)].some((l) => coPc(gv, l))) as number | undefined;
        return x ? [{ gv: x, id: b.id, doi: () => conn.prepare(`UPDATE assessment_scores SET examiner_user_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(x, b.attemptId) }] : [];
      }));
  });
}
