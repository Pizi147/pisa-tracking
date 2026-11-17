/**
 * PHÉP KIỂM BADGE-CUA-TOI (PTA 04/11, sau UI-CONG-VIEC U01; S11 UI-CV-V12 05/11): badge Công việc (`/my-work` → `summary.canLamNgay`) = ô "Của tôi"
 * của góc "Tất cả" (`soCuaToi(dong)` — cùng hàm web) — một số liệu một nguồn. Trước: "Nhập điểm MT cũ" / "Điền Target" góc "toi" gán người xem, góc "tat-ca" gán GVCN lớp
 * → QL demo badge 6, ô "Của tôi" 5.
 */
export async function runPrBadgeCuaToiTests(t: { check: any; assert: any; P: any }) {
  const { check, assert, P } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { soCuaToi, demDongViec, gomNhomViec } = await import('../../../shared/domain/index.ts');
  const fs = await import('node:fs');
  console.log('\nBADGE-CUA-TOI · badge Công việc = ô "Của tôi"');
  check('BCT-1 · QL / QT: badge (summary.canLamNgay) của "toi" = ô "Của tôi" của "Tất cả" (soCuaToi); việc lich-su / target cùng chủ ở hai góc', () => {
    for (const [ten, p] of [['QL', P.mbManager], ['QT', P.admin]] as const) {
      xoaNho();
      const toi = mywork.myWork(p, {});
      xoaNho();
      const tatCa = mywork.myWork(p, { nguoi: 'tat-ca' });
      const o = soCuaToi(tatCa.dong);
      assert(toi.summary.canLamNgay === o, `${ten}: badge ${toi.summary.canLamNgay} ≠ ô Của tôi ${o}`);
      const chuTatCa = new Map((tatCa.items as any[]).filter((x) => /^(lich-su|target):/.test(x.key)).map((x) => [x.key, x.ownerId]));
      for (const x of (toi.items as any[]).filter((y) => /^(lich-su|target):/.test(y.key))) {
        if (chuTatCa.has(x.key)) assert(chuTatCa.get(x.key) === x.ownerId, `${ten}: ${x.key} chủ ${x.ownerId} ≠ ${chuTatCa.get(x.key)} (Tất cả)`);
      }
    }
  });

  /* S11 (UI-CV-V12, chủ SP 05/11): MỘT dòng = 1 · badge = dòng CỦA TÔI quá hạn + hôm nay · cùng một hàm, cùng số ở badge, ô "Của tôi", đầu nhóm,
     Tổng quan "Việc của tôi" (`summary.viec`) và hồ sơ GV. */
  check('BCT-2 (S11) · GV: badge = soCuaToi = quá hạn + hôm nay ≤ viec; viec = tổng đầu nhóm Công việc = hồ sơ GV; web đọc đúng hàm', () => {
    let coBadge = 0;
    for (const p of [P.coreTeacher, P.subjectTeacher, P.lrTeacher, P.w1Teacher, P.sTeacher]) {
      xoaNho();
      const w = mywork.myWork(p, {});
      const s = w.summary, toi = (w.dong as any[]).filter((x) => x.mine);
      assert(s.canLamNgay === soCuaToi(w.dong) && s.canLamNgay === s.viecQuaHan + demDongViec(toi).homNay && s.canLamNgay <= s.viec, `${p.userId}: ${JSON.stringify(s)}`);
      const dauNhom = gomNhomViec(toi).reduce((n: number, g: any) => n + demDongViec(g.items).n, 0);
      assert(s.viec === dauNhom, `${p.userId}: summary.viec ${s.viec} ≠ tổng đầu nhóm ${dauNhom}`);
      xoaNho();
      const hs = hoSo.viecCuaGv(p, p.userId).reduce((n: number, x: any) => n + x.n, 0);
      /* AUDIT-1611 P1-03: hồ sơ GV = việc CỦA TÔI (đầu trang, badge) — dòng làm thay không vào. */
      assert(hs === s.viec, `${p.userId}: hồ sơ GV ${hs} ≠ Công việc (của tôi) ${s.viec}`);
      if (s.canLamNgay > 0) coBadge++;
    }
    assert(coBadge > 0, 'seed phải có GV có việc cần làm ngay');
    const doc = (f: string) => fs.readFileSync(f, 'utf8');
    assert(/summary\?\.canLamNgay/.test(doc('web/src/App.tsx')), 'badge App đọc summary.canLamNgay');
    assert(/soCuaToi\(dsGoc\)/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')) && /k === 'toi' && hienSoToi \? soToi : null/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'ô Của tôi = soCuaToi, Của GV / Tất cả không số');
    /* CV-TAB: đầu trang đếm demDongViec(items); badge tab đếm dòng nhìn thấy (badgeTab ∘ dongTab — CVT-2 so tổng với demDongViec). */
    assert(/demDongViec\(items\)/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')) && /badgeTab\(dongCuaTab\(cuaBan\(items\), k\)/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'đầu nhóm đếm demDongViec');
  });

  /*
   * DEM-VIEC (chủ SP 18/11, QT + QL CP: "thấy ghi có việc quá hạn nhưng vào xem không thấy gì"). Gốc: (1) badge / ô Tổng quan đọc `/my-work` mọi chi nhánh, Công việc
   * đọc chi nhánh đang chọn; (2) Quản trị giữ MỌI việc của QL chi nhánh (em chưa có TVV, Chốt lộ trình, Kỳ vọng…) ở mọi chi nhánh — QL chi nhánh đó cũng giữ.
   */
  const { db, tx } = await import('../db.ts');
  const { dongCuaToi } = await import('../../../shared/domain/index.ts');
  const KHOA_QL = /^(kyvong|chotft|xetlai|owner|moc|thi_that|chot-ngay-thi|buoc_tiep|bao-ph):/;
  const cnCoQl = () => {
    const ds = (db().prepare(`SELECT DISTINCT COALESCE(ur.branch_id, 0) AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'manager' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL`).all() as any[]).map((r) => r.b as number);
    return (b: number | null) => b !== null && (ds.includes(0) || ds.includes(b));
  };
  check('BCT-3 (DEM-VIEC) · Quản trị: việc QL chi nhánh ở chi nhánh CÓ QL không vào "Của tôi" (badge, ô Tổng quan) — "Tất cả" vẫn có dòng, làm thay được; chi nhánh không còn QL → Quản trị giữ', () => {
    const coQl = cnCoQl();
    xoaNho();
    const toi = mywork.myWork(P.admin, {});
    for (const x of (toi.items as any[]).filter((y) => KHOA_QL.test(y.key))) assert(!coQl(x.cn ?? null), `Quản trị "Của tôi" còn ${x.key} ở chi nhánh ${x.cn} (có QL)`);
    xoaNho();
    const tatCa = (mywork.myWork(P.admin, { nguoi: 'tat-ca' }).items as any[]).filter((y) => KHOA_QL.test(y.key) && coQl(y.cn ?? null) && y.ownerId === null);
    assert(tatCa.length > 0 && tatCa.every((y) => !y.mine), `"Tất cả" phải còn việc QL chi nhánh, không của Quản trị: ${tatCa.length}`);
    /* QL chi nhánh đó vẫn giữ đúng các việc này. */
    xoaNho();
    const qlMb = new Set((mywork.myWork(P.mbManager, {}).items as any[]).map((y) => y.key));
    const cuaMb = tatCa.filter((y) => y.cn === P.mbManager.grants.find((g: any) => g.roleKey === 'manager').branchId && !/^(thi_that|chot-ngay-thi|buoc_tiep|bao-ph):/.test(y.key));
    for (const y of cuaMb) assert(qlMb.has(y.key), `QL MB không còn giữ ${y.key}`);
    /* Chi nhánh không còn QL nào (thử trong giao dịch, trả lại) → việc về Quản trị. */
    const cn = tatCa[0].cn as number;
    let coLai = false;
    try {
      tx(() => {
        db().prepare(`UPDATE user_roles SET status = 'inactive' WHERE role_id IN (SELECT id FROM roles WHERE key = 'manager') AND (branch_id = ? OR branch_id IS NULL)`).run(cn);
        xoaNho();
        coLai = (mywork.myWork(P.admin, {}).items as any[]).some((y) => y.key === tatCa[0].key && y.mine);
        throw new Error('tra-lai');
      });
    } catch (e: any) { if (e.message !== 'tra-lai') throw e; }
    xoaNho();
    assert(coLai, `chi nhánh ${cn} không còn QL: Quản trị phải giữ ${tatCa[0].key}`);
  });

  check('BCT-4 (DEM-VIEC) · mọi vai × chi nhánh: số ô / badge (summary) = số dòng Công việc "Của tôi" cùng đường (dòng `mine`); quá hạn = dòng quá hạn; web một đường', () => {
    for (const p of [P.admin, P.mbManager, P.cpManager, P.bcManager, P.coreTeacher, P.subjectTeacher, P.sTeacher]) {
      const cns = [null, ...new Set(p.grants.map((g: any) => g.branchId).filter((b: any) => b !== null))];
      for (const branchId of cns) {
        xoaNho();
        const w = mywork.myWork(p, { branchId });
        const ds = demDongViec((w.dong as any[]).filter((d) => d.mine));
        assert(w.summary.viec === ds.n && w.summary.viecQuaHan === ds.quaHan && w.summary.canLamNgay === ds.canLamNgay
          && demDongViec(dongCuaToi(w.dong as any[]) as any).n === ds.n, `${p.userId} cn ${branchId}: summary ${JSON.stringify(w.summary)} ≠ dòng Của tôi ${JSON.stringify(ds)}`);
        if (branchId !== null) assert((w.dong as any[]).every((d) => d.cn == null || d.cn === branchId), `${p.userId}: việc chi nhánh khác lọt vào chi nhánh ${branchId}`);
      }
    }
    const doc = (f: string) => fs.readFileSync(f, 'utf8');
    assert(/useApi<[^>]+>\(duongViec, \[lanViec\]/.test(doc('web/src/App.tsx')) && /useDuongViecCuaToi\(\)/.test(doc('web/src/modules/students/StudentsPage.tsx')),
      'badge App + HV & Lớp đọc đường useDuongViecCuaToi');
    assert(/laQuanLy && nguoi !== 'toi'/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'Công việc "Của tôi" đọc đường của tôi (không nguoi=tat-ca)');
    assert(/nguoi=toi/.test(doc('web/src/modules/worklist/TongQuanV5.tsx')) && /loc=qua-han/.test(doc('web/src/modules/worklist/TongQuanV5.tsx')), 'ô Việc của tôi mở Của tôi, "n quá hạn" mở lọc Quá hạn');
  });
}
