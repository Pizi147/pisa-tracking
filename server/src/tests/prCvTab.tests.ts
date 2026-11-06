/**
 * PHÉP KIỂM CV-TAB (chủ SP 06/11, mockup `thiet-ke/v17-nhap/`): Công việc chia tab hạng mục — mỗi dòng việc vào đúng MỘT tab và MỘT mục,
 * badge = trạng thái gấp nhất (đỏ quá hạn · vàng gần hạn · trắng tổng), tổng dòng các tab = số dòng đầu trang, tab mặc định = tab đầu có quá hạn.
 * Chỉ hàm thuần đọc dữ liệu `/my-work` đã trả — không thêm câu đọc.
 */
export async function runPrCvTabTests(t: { check: any; assert: any; P: any; TODAY: string }) {
  const { check, assert, P, TODAY } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nCV-TAB · Công việc chia tab hạng mục');

  check('CVT-1 · hàm thuần: badge đỏ > vàng > trắng; mục "Quá hạn" đứng đầu, mục rỗng ẩn; tab mặc định = tab đầu có quá hạn', () => {
    const v = (key: string, group: string, urgency: string, due: string | null, kind?: string) => ({ key, group, urgency, due, kind, studentId: 1 });
    const homNay = '2026-11-06';
    const ds = [v('a', 'cause', 'overdue', '2026-11-01'), v('b', 'no_plan', 'normal', '2026-11-08'), v('c', 'ghi_ket_qua_pa', 'normal', '2026-11-30')];
    const b = d.badgeTab(ds, homNay);
    assert(b.mau === 'do' && b.so === 1 && b.n === 3 && b.ganHan === 1, JSON.stringify(b));
    assert(d.badgeTab(ds.slice(1), homNay).mau === 'vang' && d.badgeTab(ds.slice(2), homNay).mau === 'trang', 'vàng / trắng');
    assert(d.badgeTab(ds.slice(2), homNay).so === 1, 'trắng = tổng');
    const muc = d.chiaMucTab(ds);
    assert(muc.map((m: any) => m.key).join('|') === 'qua-han|pa|kq-pa' && muc[1].label === 'Phương án', muc.map((m: any) => m.key).join('|'));
    const sc = d.chiaMucTab([v('s1', 'score', 'normal', '2026-11-20', 'mock'), v('s2', 'score', 'normal', '2026-11-20', 'final'), v('s3', 'score', 'normal', '2026-11-20', 'checkpoint')]);
    assert(sc.map((m: any) => m.label).join('|') === 'Mock Test|Progress / Final Test|Checkpoint', 'mục Chấm điểm theo loại bài');
    assert(d.tabMacDinh([{ key: 'x', badge: null }, { key: 'y', badge: { quaHan: 2 } }]) === 'y' && d.tabMacDinh([{ key: 'x', badge: null }]) === 'x', 'tab mặc định');
    assert(d.tabCuaViec({ group: 'score', key: d.KHOA_CHAM_SPEAKING }) === 'cham-cheo' && d.tabCuaViec({ group: 'ban_giao', key: 'k' }) === 'van-hanh', 'tab chấm chéo / bàn giao');
  });

  check('CVT-2 · /my-work thật (GV, QL Tất cả, TVV): mỗi dòng một tab có trong thứ tự cố định + một mục ≠ "Khác"; tổng dòng tab (trừ chấm chéo) = demDongViec', () => {
    const vai: [string, any, any, boolean][] = [['GVCN', P.coreTeacher, {}, false], ['QL', P.mbManager, { nguoi: 'tat-ca' }, false]];
    if (P.tvv) vai.push(['TVV', P.tvv, {}, true]);
    for (const [ten, p, q, tvv] of vai) {
      xoaNho();
      const w = mywork.myWork(p, q);
      const thuTu: readonly string[] = tvv ? d.NHOM_CV_TVV : d.TAB_CV;
      let tong = 0;
      for (const k of thuTu) {
        const dong = d.dongTab((w.dong as any[]).filter((x) => d.tabCuaViec(x, tvv) === k));
        for (const x of dong) assert(d.mucCuaViec(x, tvv) !== 'khac', `${ten}: ${x.group} ${x.key} rơi vào "Khác"`);
        const muc = d.chiaMucTab(dong, tvv);
        assert(muc.reduce((n: number, m: any) => n + m.items.length, 0) === dong.length, `${ten} ${k}: mục mất dòng`);
        if (k !== 'cham-cheo') tong += d.badgeTab(dong, TODAY).n;
      }
      for (const x of w.dong as any[]) assert(thuTu.includes(d.tabCuaViec(x, tvv)), `${ten}: ${x.group} không có tab`);
      assert(tong === d.demDongViec(w.dong).n, `${ten}: tổng tab ${tong} ≠ demDongViec ${d.demDongViec(w.dong).n}`);
    }
  });
}
