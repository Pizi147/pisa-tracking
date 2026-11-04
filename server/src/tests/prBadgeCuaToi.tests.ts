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
      assert(hs === demDongViec(w.dong).n, `${p.userId}: hồ sơ GV ${hs} ≠ Công việc ${demDongViec(w.dong).n}`);
      if (s.canLamNgay > 0) coBadge++;
    }
    assert(coBadge > 0, 'seed phải có GV có việc cần làm ngay');
    const doc = (f: string) => fs.readFileSync(f, 'utf8');
    assert(/summary\?\.canLamNgay/.test(doc('web/src/App.tsx')), 'badge App đọc summary.canLamNgay');
    assert(/soCuaToi\(dsGoc\)/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')) && /k === 'toi' && hienSoToi \? soToi : null/.test(doc('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'ô Của tôi = soCuaToi, Của GV / Tất cả không số');
    assert(/const so = demDongViec\(goc\)/.test(doc('web/src/modules/congViec/DanhSachViec.tsx')), 'đầu nhóm đếm demDongViec');
  });
}
