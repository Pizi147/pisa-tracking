/**
 * PHÉP KIỂM SUA-NHO-UI (kế hoạch `docs/superpowers/plans/2026-10-30-sua-nho.md` Task U4): ô "Lớp khác" ở Lộ trình mới — lớp FT sai loại
 * hiện mờ + lý do (không chọn được), lớp đúng loại trước, lớp thường không bao giờ hiện (luật `lopChonLoTrinhMoi`, thuần).
 */
export async function runPrSuaNhoUiTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lop = (id: number, code: string, ft: boolean, route: string | null) => ({ id, code, ft, route, branchCode: 'MB', siSo: 3 });
  const LT110 = lop(1, 'MB FT 110', true, 'LT1'), RF05 = lop(2, 'CP FT RF 05', true, 'RF'), TH12 = lop(3, 'MB FOU 12', false, null), LT112 = lop(4, 'MB FT 112', true, 'LT2');

  check('SNU-1 · lopChonLoTrinhMoi LT2: lớp LT trước (giữ thứ tự), RF sau + "lớp RF", không lớp thường', () => {
    const ds = d.lopChonLoTrinhMoi('LT2', [LT110, RF05, TH12, LT112]);
    assert(JSON.stringify(ds.map((x: any) => x.ma)) === JSON.stringify(['MB FT 110', 'MB FT 112', 'CP FT RF 05']), ds.map((x: any) => x.ma).join(','));
    assert(ds[2].tat === 'lớp RF' && ds[2].phu === 'FT RF', JSON.stringify(ds[2]));
    assert(!ds[0].tat && !ds[1].tat && ds[0].phu === 'FT LT1 · MB · 3 em', JSON.stringify(ds[0]));
  });
  check('SNU-2 · lopChonLoTrinhMoi RF: RF chọn được đứng đầu, lớp LT mờ "lớp LT"', () => {
    const ds = d.lopChonLoTrinhMoi('RF', [LT110, RF05, LT112]);
    assert(ds[0].ma === 'CP FT RF 05' && !ds[0].tat, JSON.stringify(ds[0]));
    assert(ds.slice(1).every((x: any) => x.tat === 'lớp LT'), JSON.stringify(ds));
  });
  check('SNU-3 · mọi lớp sai loại: danh sách không rỗng, mọi dòng tắt', () => {
    const ds = d.lopChonLoTrinhMoi('RF', [LT110, LT112]);
    assert(ds.length === 2 && ds.every((x: any) => !!x.tat), JSON.stringify(ds));
  });
  check('SNU-4 · Khác: mọi lớp FT chọn được, lớp thường bị bỏ', () => {
    const ds = d.lopChonLoTrinhMoi(d.ROUTE_KHAC, [LT110, RF05, TH12]);
    assert(ds.length === 2 && ds.every((x: any) => !x.tat), JSON.stringify(ds));
  });
}
