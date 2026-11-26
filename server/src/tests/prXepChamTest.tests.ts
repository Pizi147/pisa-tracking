/**
 * PHÉP KIỂM XEP-CHAM-TEST (chủ SP 16/11, plan.md #1771): mọi danh sách chấm Test cùng luật với Chấm Speaking — lớp thường có bài lên đầu →
 * mã lớp số nhỏ trước (`soSanhLopCham`) → trong lớp tuần gần nhất lên đầu. Chỉ đổi thứ tự (0 câu đọc thêm).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

export async function runPrXepChamTestTests(t: YThucTestKit) {
  const { check, assert } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nXEP-CHAM-TEST · thứ tự danh sách chấm Test: lớp thường có bài → mã lớp → tuần gần nhất');

  const V = (key: string, classCode: string | null, khung: 'ft' | 'thuong', tuanThi: string, extra: Record<string, unknown> = {}) => ({
    key, group: 'score', urgency: 'normal', due: '2026-09-30', studentId: null, studentName: '', classId: 1, classCode, khung, ownerId: 1,
    tieuDe: 'Nhập điểm', contextLabel: null, count: null, href: '/', actionLabel: '', kind: khung === 'ft' ? 'mock' : 'mt0', tuanThi, ...extra,
  });

  check('XCT-1 · soSanhViecCham: lớp thường lên đầu; FT 9 trước FT 101 (số, không chữ); trong lớp tuần mới trên; dòng gộp theo lớp đầu của nó', () => {
    const gop = V('gop', null, 'ft', '2026-09-07', { con: [V('a', 'MB FT 102', 'ft', '2026-09-07'), V('b', 'MB FT 9', 'ft', '2026-09-07')] });
    const ds = [V('105', 'MB FT 105', 'ft', '2026-09-07'), V('101-cu', 'MB FT 101', 'ft', '2026-08-31'), V('fou', 'MB FOU 12', 'thuong', '2026-08-17'),
      V('101-moi', 'MB FT 101', 'ft', '2026-09-14'), gop].sort(d.soSanhViecCham).map((x: any) => x.key);
    assert(ds.join() === 'fou,gop,101-moi,101-cu,105', `thứ tự: ${ds}`);
  });

  check('XCT-2 · chiaMucTab: vạch hạn giữ (Quá hạn · Hạn đến CN · Hạn sau CN); TRONG vạch lớp → tuần; mục khác giữ quá hạn trước', () => {
    const qh = (key: string, lop: string) => ({ ...V(key, lop, 'ft', '2026-08-31'), urgency: 'overdue', due: '2026-09-01' });
    const han = (key: string, lop: string, due: string) => ({ ...V(key, lop, 'ft', '2026-09-07'), due });
    /* homNay T2 14/09 → CN 20/09: 16/09 "Hạn đến", 23/09 "Hạn sau". */
    const ds = [han('sau-101', 'MB FT 101', '2026-09-23'), qh('qh-105', 'MB FT 105'), han('den-105', 'MB FT 105', '2026-09-16'), qh('qh-9', 'MB FT 9'), han('den-101', 'MB FT 101', '2026-09-16')];
    const muc = d.chiaMucTab(ds, false, '2026-09-14').find((m: any) => m.key === 'mock');
    assert(muc.items.map((x: any) => x.key).join() === 'qh-9,qh-105,den-101,den-105,sau-101', `mục Mock: ${muc.items.map((x: any) => x.key)}`);
    const pa = (key: string, urgency: string, due: string) => ({ key, group: 'no_plan', urgency, due, studentId: 1, kind: null });
    const p = d.chiaMucTab([pa('sau', 'normal', '2026-09-30'), pa('qh', 'overdue', '2026-09-01')]).find((m: any) => m.key === 'pa');
    assert(p.items[0].key === 'qh', 'mục PA mất thứ tự quá hạn trước');
  });

  check('XCT-3 · gopViecTheoLop: lớp con của dòng Nhập điểm theo thứ tự chấm (panel nhiều lớp + "Lớp tiếp" đi theo)', () => {
    const ds = [V('c105', 'MB FT 105', 'ft', '2026-09-14'), V('c9', 'MB FT 9', 'ft', '2026-09-14'), V('c101', 'MB FT 101', 'ft', '2026-09-14')];
    const dong = d.gopViecTheoLop(ds, () => 'Nhập điểm').find((x: any) => x.con?.length);
    assert(dong && dong.con.map((x: any) => x.key).join() === 'c9,c101,c105', `lớp con: ${dong?.con?.map((x: any) => x.key)}`);
  });

  check('XCT-5 · web: Công việc truyền homNay vào chiaMucTab (vạch hạn khớp DanhSachViec)', () => {
    const f = docSach('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert((f.match(/chiaMucTab\(dongCuaTab\([^)]*\), tabTvv, homNay\)/g) ?? []).length === 2, 'chiaMucTab thiếu homNay');
  });

  check('XCT-4 · Test › Chấm Test: ba danh sách (nợ chấm, bảng lớp, chấm tuần này) dùng xepLopCham (soSanhLopCham + khungDong)', () => {
    const f = docSach('server/src/cham/canCham.ts');
    assert((f.match(/xepLopCham\(x, y\)|sort\(xepLopCham\)/g) ?? []).length === 3, 'thiếu danh sách dùng xepLopCham');
    assert(/thuong: khungDong\(x\) === 'thuong'/.test(f), 'lớp thường không theo khungDong (MT0 = lớp thường)');
  });
}
