/**
 * PHÉP KIỂM CHAN-ROI-NHAP (luật không mất chữ đang gõ; [XM] PR-C rà sâu #726): góc Phân công GV còn nháp → rời góc hỏi một lần.
 *   CRN-1 `conTrongGocPc`: đổi URL trong góc (tìm, lọc khung) không hỏi; đổi trang / đổi góc / đổi chi nhánh là rời.
 *   CRN-2 dùng router THẬT (`createMemoryRouter`, cùng dạng route `*` của `main.tsx`), không cần DOM: link + Back bị giữ, "Rời đi" đi tiếp đúng đích, "Ở lại" giữ nguyên chỗ.
 *   CRN-3 nguồn: app chạy data router (`useBlocker` cần) · một đường hỏi, không còn `window.confirm` / `beforeunload` riêng ở góc.
 * Không mở database.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8');

export async function runPrChanRoiNhapTests(t: YThucTestKit) {
  const { check, checkAsync, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const GOC = '/hoc-vien?view=phan-cong&cn=2';
  const url = (u: string) => { const [pathname, s] = u.split('?'); return { pathname, search: s ? `?${s}` : '' }; };
  const trong = (den: string, tu = GOC) => d.conTrongGocPc(url(tu), url(den));

  check('CRN-1 đổi URL trong góc (tìm, khung, mở hàng) không phải rời góc', () => {
    assert(trong('/hoc-vien?view=phan-cong&cn=2&tim=an'), 'tìm');
    assert(trong('/hoc-vien?view=phan-cong&cn=2&khung=ft'), 'khung');
  });
  check('CRN-1 đổi trang, đổi góc, đổi chi nhánh / phạm vi là rời góc', () => {
    assert(!trong('/hoc-vien/lop/7'), 'hồ sơ lớp');
    assert(!trong('/phan-tich/giao-vien/3'), 'hồ sơ GV');
    assert(!trong('/hoc-vien'), 'menu Học viên & Lớp cùng đường dẫn');
    assert(!trong('/hoc-vien?view=sos&cn=2'), 'đổi góc');
    assert(!trong('/hoc-vien?view=phan-cong&cn=3'), 'đổi chi nhánh');
    assert(!trong('/hoc-vien?view=phan-cong&cn=2&phamVi=tat-ca'), 'đổi phạm vi');
  });

  await checkAsync('CRN-2 router thật: link và Back bị giữ tới khi trả lời', async () => {
    const { createMemoryRouter } = await import('react-router-dom');
    const router = createMemoryRouter([{ path: '*', element: null }], { initialEntries: ['/cong-viec', GOC], initialIndex: 1 });
    const nho = { co: true };
    const chan = ({ currentLocation, nextLocation }: any) => nho.co && !d.conTrongGocPc(currentLocation, nextLocation);
    router.getBlocker('k', chan);
    const cho = () => router.state.blockers.get('k');
    const dang = () => router.state.location.pathname + router.state.location.search;

    await router.navigate('/hoc-vien?view=phan-cong&cn=2&tim=an', { replace: true });
    assert(dang() === '/hoc-vien?view=phan-cong&cn=2&tim=an' && cho()?.state !== 'blocked', 'tìm trong góc đi thẳng');

    await router.navigate('/hoc-vien/lop/7');
    assert(cho()?.state === 'blocked', 'link mã lớp bị giữ');
    assert(dang().startsWith('/hoc-vien?view=phan-cong'), 'chưa rời');
    cho()!.reset!();
    assert(dang().startsWith('/hoc-vien?view=phan-cong'), 'Ở lại giữ nguyên chỗ');

    await router.navigate('/hoc-vien/lop/7');
    cho()!.proceed!();
    await new Promise((r) => setTimeout(r, 0));
    assert(dang() === '/hoc-vien/lop/7', 'Rời đi tới đúng đích');

    nho.co = false;   // đã rời: góc gỡ, nháp mất cùng góc
    await router.navigate(-1);
    await new Promise((r) => setTimeout(r, 0));
    assert(dang().startsWith('/hoc-vien?view=phan-cong'), 'Back từ hồ sơ về góc (Quay lại đúng nguồn)');

    nho.co = true;
    await router.navigate(-1);
    await new Promise((r) => setTimeout(r, 0));
    assert(cho()?.state === 'blocked' && dang().startsWith('/hoc-vien?view=phan-cong'), 'Back rời góc bị giữ');
    cho()!.reset!();

    nho.co = false;   // lưu xong: hết nháp
    await router.navigate('/hoc-vien/lop/7');
    assert(dang() === '/hoc-vien/lop/7', 'hết nháp không hỏi');
    router.dispose();
  });

  check('CRN-3 app chạy data router; route gốc giữ một lần cả app', () => {
    const main = doc('web/src/main.tsx');
    assert(main.includes('createBrowserRouter') && main.includes('<RouterProvider'), 'main.tsx cần data router');
    assert(!main.includes('<BrowserRouter'), 'bỏ BrowserRouter');
  });
  check('CRN-3 góc chỉ hỏi qua hook chung', () => {
    const goc = doc('web/src/modules/students/GocPhanCongGv.tsx');
    const trang = doc('web/src/modules/students/StudentsPage.tsx');
    assert(goc.includes('useChanRoiNhap('), 'góc dùng hook');
    assert(!goc.includes("'beforeunload'"), 'beforeunload nằm trong hook');
    assert(!trang.includes('window.confirm'), 'không còn hộp trình duyệt ở trang');
    assert(goc.includes('{hopRoi}<ErrorState'), 'màn lỗi vẫn có hộp hỏi — không kẹt');
  });
}
