/**
 * PHÉP KIỂM PR-OV11i — giao diện chung (a11y · 375 · tương phản). Chỉ một hàm thuần: tiêu đề tab theo màn (P1-3, Q14).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11iTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV11i · giao diện chung');

  check('OV11i-1 · P1-3: tiêu đề tab "{tên màn} · PISA Tracking" — theo tenNguon; tên không rõ / trống → "PISA Tracking"', () => {
    const tab = (url: string) => d.tieuDeTab(d.tenNguon(url).ten);
    const ds = ['/', '/hoc-vien', '/test/lich', '/cong-viec/cho-duyet', '/quan-tri'].map(tab);
    assert(new Set(ds).size === ds.length && ds.every((x: string) => x.endsWith(' · PISA Tracking')), JSON.stringify(ds));
    assert(tab('/') === 'Tổng quan · PISA Tracking' && tab('/test/lich') === 'Lịch Test tuần · PISA Tracking', JSON.stringify(ds));
    assert(d.tieuDeTab('MB FT 101') === 'MB FT 101 · PISA Tracking', 'hồ sơ lớp: mã lớp');
    assert(d.tieuDeTab(null) === 'PISA Tracking' && d.tieuDeTab('  ') === 'PISA Tracking' && tab('/khong-co') === 'PISA Tracking', 'không rõ tên');
  });
}
