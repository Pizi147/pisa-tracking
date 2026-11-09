/**
 * PHÉP KIỂM GIAM-DOC-HSGV (trang Hồ sơ GV đọc ít câu hơn) — số TRƯỚC = SAU:
 *  (1) chỉ số theo kỳ + panel: đường gộp (một câu ngữ cảnh, câu lượt UNION ALL, phần nạp theo lượt / em một lượt, một câu sổ bài + việc)
 *      = đường tách từng ngữ cảnh (`tachNguCanhKhiKiem`, như trước) — mọi GV có hồ sơ × người xem (chính mình · Quản trị · QL MB).
 *  (2) Phân tích GV (đọc sổ bài + việc một câu) = đường tách — mọi chi nhánh × khung.
 *  (3) hồ sơ: vai / chi nhánh / kỹ năng (một câu) và ba số yêu cầu (đếm trên dòng gốc) = cách cũ (ba câu riêng + dựng thẻ `theYeuCauCuaGv`).
 */
export async function runPrGiamDocHsgvTests(t: any) {
  const { check, assert, conn, P } = t;
  const pt: any = await import('../phanTich/giaoVien.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const perm: any = await import('../permissions.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const phamVi: any = await import('../giaoVien/phamVi.ts');
  const { ENTRY_SKILLS, ENTRY_SKILL_SHORT, roleLabel }: any = await import('../../../shared/domain/index.ts');
  console.log('\nGIAM-DOC-HSGV · hồ sơ GV đọc ít câu — số trước = sau');

  /* Mỗi lời gọi một bộ nhớ request riêng (như GET thật). Gọi một lượt trước để lượt ghi lại sổ việc (≤ 1 lần / 5 phút / chi nhánh) không rơi vào giữa hai đường. */
  const json = (fn: () => unknown) => { try { return JSON.stringify(nguCanh.trongBoNho(fn)); } catch (e: any) { return `lỗi ${e?.status ?? e?.message}`; } };
  const hai = (fn: () => unknown) => {
    json(fn);
    pt.tachNguCanhKhiKiem.bat = true;
    try { const tach = json(fn); pt.tachNguCanhKhiKiem.bat = false; return [tach, json(fn)]; } finally { pt.tachNguCanhKhiKiem.bat = false; }
  };
  const gvs = (conn.prepare(`SELECT u.id FROM users u WHERE u.status = 'active' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key = 'teacher') ORDER BY u.id`).all() as any[]).map((r) => r.id as number);
  const nguoiXem = (gv: number) => [['chính mình', perm.loadPrincipal(gv)], ['Quản trị', P.admin], ['QL MB', P.mbManager]] as [string, any][];
  const KY = { tu: '2026-03-02', den: '2026-09-14' };

  check('GIAM-DOC-HSGV (1) · chỉ số hồ sơ GV (kỳ mặc định + dài) và panel: đường gộp = đường tách từng ngữ cảnh — mọi GV × chính mình / Quản trị / QL', () => {
    const sai: string[] = [];
    let nhieuNguCanh = 0, coSo = 0;
    for (const gv of gvs) {
      for (const [ai, p] of nguoiXem(gv)) {
        for (const [ten, fn] of [
          ['chi-so', () => pt.chiSoHoSoGv(p, gv, {})], ['chi-so dài', () => pt.chiSoHoSoGv(p, gv, KY)],
          ...['cham-diem', 'viec-dung-han', 'ket-qua', 'tien-bo', 'ghi-pa', 'pa-hieu-qua', 'thi-that'].map((cot) => [`o ${cot}`, () => pt.oChiSoHoSoGv(p, gv, { ...KY, cot })]),
        ] as [string, () => unknown][]) {
          const [tach, gop] = hai(fn);
          if (tach !== gop) sai.push(`GV ${gv} · ${ai} · ${ten}`);
          if (ten === 'chi-so dài' && /"k":"so","dung":\d+,"tong":[1-9]/.test(gop)) coSo++;
        }
      }
      try {
        const khung = new Set(nguCanh.trongBoNho(() => pt.chiSoHoSoGv(P.admin, gv, KY)).hocThuatTheoLop.map((h: any) => h.khung));
        if (khung.size > 1) nhieuNguCanh++;
      } catch { /* GV không mở được hồ sơ */ }
    }
    assert(!sai.length, `lệch ${sai.length}: ${sai.slice(0, 8).join(' | ')}`);
    assert(coSo > 0 && nhieuNguCanh > 0, `phủ: ${coSo} hồ sơ có số · ${nhieuNguCanh} GV dạy cả FT lẫn lớp thường (cần > 0 để đường gộp nhiều ngữ cảnh được kiểm)`);
  });

  check('GIAM-DOC-HSGV (2) · Phân tích GV (sổ bài + việc một câu): đường gộp = đường tách — mọi chi nhánh × FT / lớp thường', () => {
    const sai: string[] = [];
    for (const { id } of conn.prepare(`SELECT id FROM branches ORDER BY id`).all() as any[]) {
      for (const ct of ['ft', 'thuong']) {
        const [tach, gop] = hai(() => pt.phanTichGiaoVien(P.admin, { cn: id, ct }));
        if (tach !== gop) sai.push(`chi nhánh ${id} ${ct}`);
      }
    }
    const [tach, gop] = hai(() => pt.phanTichGiaoVien(P.admin, { ct: 'ft' }));   // "Toàn bộ" (mọi chi nhánh)
    if (tach !== gop) sai.push('Toàn bộ ft');
    assert(!sai.length, `lệch: ${sai.join(' | ')}`);
  });

  check('GIAM-DOC-HSGV (3) · hồ sơ GV: vai · chi nhánh · kỹ năng (một câu) và số yêu cầu (đếm dòng gốc) = ba câu cũ + dựng thẻ `theYeuCauCuaGv`', () => {
    const sai: string[] = [];
    let coYeuCau = 0, coChiNhanh = 0;
    for (const gv of gvs) {
      for (const [ai, p] of nguoiXem(gv)) {
        let r: any;
        try { r = nguCanh.trongBoNho(() => hoSo.hoSoGiaoVien(p, gv)); } catch { continue; }
        const { branchIds } = nguCanh.trongBoNho(() => phamVi.phamViHoSoGv(p, gv));
        const vaiRows = conn.prepare(`SELECT r.key, b.id AS cn, b.name AS chi_nhanh FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
            WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`).all(gv) as any[];
        const daKhai = new Set((conn.prepare(`SELECT skill FROM user_skills WHERE user_id = ?`).all(gv) as any[]).map((x) => x.skill));
        const tenCn = branchIds ? (conn.prepare(`SELECT name FROM branches WHERE id IN (${branchIds.map(() => '?').join(',')}) ORDER BY name`).all(...branchIds) as any[]).map((x) => x.name) : null;
        const cu = {
          ten: (conn.prepare(`SELECT full_name FROM users WHERE id = ?`).get(gv) as any).full_name,
          vai: [...new Set(vaiRows.map((x) => roleLabel(x.key)))], chiNhanh: [...new Set(vaiRows.map((x) => x.chi_nhanh).filter(Boolean))],
          kyNang: ENTRY_SKILLS.filter((k: string) => daKhai.has(k)).map((k: string) => ENTRY_SKILL_SHORT[k]), kyNangMa: ENTRY_SKILLS.filter((k: string) => daKhai.has(k)),
          phamVi: { chiNhanh: r.gv.laChinhMinh ? null : tenCn,
            cn: branchIds?.length === 1 ? branchIds[0] : vaiRows.map((x) => x.cn).find((b) => b != null && (!branchIds || branchIds.includes(b))) ?? null },
        };
        const moi = { ten: r.gv.ten, vai: r.gv.vai, chiNhanh: r.gv.chiNhanh, kyNang: r.gv.kyNang, kyNangMa: r.gv.kyNangMa, phamVi: r.phamVi };
        if (JSON.stringify(cu) !== JSON.stringify(moi)) sai.push(`GV ${gv} · ${ai} · đầu hồ sơ ${JSON.stringify(moi)} ≠ ${JSON.stringify(cu)}`);
        const the = nguCanh.trongBoNho(() => hoSo.theYeuCauCuaGv(p, gv)) as any[];
        const yc = { cho: the.filter((x) => x.trangThai === 'cho').length, choQuaHan: the.filter((x) => x.trangThai === 'cho' && !!x.hanDuyet && x.hanDuyet < r.homNay).length,
          tuChoi: the.filter((x) => x.trangThai === 'tu_choi').length };
        if (JSON.stringify(yc) !== JSON.stringify(r.yeuCau)) sai.push(`GV ${gv} · ${ai} · yêu cầu ${JSON.stringify(r.yeuCau)} ≠ ${JSON.stringify(yc)}`);
        if (yc.cho + yc.tuChoi) coYeuCau++;
        if (tenCn?.length) coChiNhanh++;
      }
    }
    assert(!sai.length, `lệch ${sai.length}: ${sai.slice(0, 5).join(' | ')}`);
    assert(coYeuCau > 0 && coChiNhanh > 0, `phủ: ${coYeuCau} hồ sơ có yêu cầu · ${coChiNhanh} hồ sơ QL có tên chi nhánh (cần > 0)`);
  });
}
