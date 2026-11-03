/**
 * PHÉP KIỂM BADGE-CUA-TOI (PTA 04/11, sau UI-CONG-VIEC U01): badge Công việc (`/my-work` → `summary.viec`) = ô "Của tôi" của góc "Tất cả"
 * (`demNguoiViec(dong).toi`) — một số liệu một nguồn. Trước: "Nhập điểm MT cũ" / "Điền Target" góc "toi" gán người xem, góc "tat-ca" gán GVCN lớp
 * → QL demo badge 6, ô "Của tôi" 5.
 */
export async function runPrBadgeCuaToiTests(t: { check: any; assert: any; P: any }) {
  const { check, assert, P } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { demNguoiViec } = await import('../../../shared/domain/index.ts');
  console.log('\nBADGE-CUA-TOI · badge Công việc = ô "Của tôi"');
  check('BCT-1 · QL / QT: summary.viec của "toi" = ô "Của tôi" của "Tất cả"; việc lich-su / target cùng chủ ở hai góc', () => {
    for (const [ten, p] of [['QL', P.mbManager], ['QT', P.admin]] as const) {
      xoaNho();
      const toi = mywork.myWork(p, {});
      xoaNho();
      const tatCa = mywork.myWork(p, { nguoi: 'tat-ca' });
      const o = demNguoiViec(tatCa.dong).toi;
      assert(toi.summary.viec === o, `${ten}: badge ${toi.summary.viec} ≠ ô Của tôi ${o}`);
      const chuTatCa = new Map((tatCa.items as any[]).filter((x) => /^(lich-su|target):/.test(x.key)).map((x) => [x.key, x.ownerId]));
      for (const x of (toi.items as any[]).filter((y) => /^(lich-su|target):/.test(y.key))) {
        if (chuTatCa.has(x.key)) assert(chuTatCa.get(x.key) === x.ownerId, `${ten}: ${x.key} chủ ${x.ownerId} ≠ ${chuTatCa.get(x.key)} (Tất cả)`);
      }
    }
  });
}
