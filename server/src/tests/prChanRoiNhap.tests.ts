/**
 * PHÉP KIỂM CHAN-ROI-NHAP (luật không mất chữ đang gõ; [XM] PR-C rà sâu #726): góc Phân công GV còn nháp → rời góc hỏi một lần.
 *   CRN-1 `conTrongGocPc`: đổi URL trong góc (tìm, lọc khung) không hỏi; đổi trang / đổi góc / đổi chi nhánh là rời.
 *   CRN-2 dùng router THẬT (`createMemoryRouter`, cùng dạng route `*` của `main.tsx`), không cần DOM: link + Back bị giữ, "Rời đi" đi tiếp đúng đích, "Ở lại" giữ nguyên chỗ.
 *   CRN-3 nguồn: app chạy data router (`useBlocker` cần) · một đường hỏi, không còn `window.confirm` / `beforeunload` riêng ở góc.
 *   CRN-4..7 (CHAN-ROI-NHAP-2): một bộ chặn cho cả app (router chỉ giữ MỘT blocker) + kho nguồn nháp `taoKhoRoiNhap` — Cuối khoá lớp, Lịch Test,
 *   panel đang sửa (cơ chế `KhungPanel`), đổi tài khoản / đăng xuất / đổi góc nhìn khi còn nháp.
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
    assert(!goc.includes('{hopRoi}'), 'hộp vẽ ở gốc app (mọi nhánh), góc không tự vẽ');
  });

  check('CRN-4 kho nguồn nháp: chỉ giữ khi có nguồn sẽ mất ở URL mới', () => {
    const kho = d.taoKhoRoiNhap();
    const a = url('/hoc-vien/lop/7?xem=cuoi-khoa'), b = url('/hoc-vien/lop/7');
    assert(kho.giu(a, b) === null, 'không nguồn → đi thẳng');
    kho.dat('ck', { moTa: 'x', conTrong: d.conTrongCuoiKhoa });
    assert(kho.giu(a, b)?.moTa === 'x', 'rời trang con Cuối khoá bị giữ');
    assert(kho.giu(a, url('/hoc-vien/lop/7?xem=cuoi-khoa&em=3')) === null, 'thêm / bỏ ?em= vẫn trong trang con');
    kho.dat('p', { moTa: 'panel', conTrong: () => false });
    assert(kho.giu(a, b)?.moTa === 'panel', 'nguồn mở sau hỏi trước (panel trên trang)');
    kho.dat('ck', null);
    /* Panel đang sửa (chữ chỉ ở state): app tự đổi URL cùng trang thì panel tự lo; Back của trình duyệt (POP) đóng panel → hỏi. */
    kho.dat('p', { moTa: 'panel', conTrong: (x: any, y: any, kieu: string) => kieu !== 'POP' && x.pathname === y.pathname });
    assert(kho.giu(url('/cong-viec?viec=1'), url('/cong-viec?viec=2'), 'PUSH') === null, 'đổi việc trong trang');
    assert(kho.giu(url('/cong-viec?viec=1'), url('/cong-viec'), 'POP')?.moTa === 'panel', 'Back đóng panel');
    kho.dat('p', null);
    assert(kho.giu(a, b) === null, 'lưu xong / gỡ → không hỏi');
  });
  check('CRN-4 Lịch Test: đổi tuần / chi nhánh / phạm vi / lớp là rời, mở hàng (kn, loai) thì không', () => {
    const g = '/test/lich?periodId=5&cn=2';
    const lt = (den: string) => d.conTrongLichTest(url(g), url(den));
    assert(lt('/test/lich?periodId=5&cn=2&kn=W') && lt('/test/lich?periodId=5&cn=2&loai=mt'), 'mở hàng / lọc loại');
    assert(!lt('/test/lich?periodId=6&cn=2') && !lt('/test/lich?periodId=5&cn=3') && !lt('/test/lich?periodId=5&cn=2&classId=9'), 'đổi dữ liệu');
    assert(!lt('/test/cham') && !lt('/cong-viec'), 'đổi trang');
  });
  await checkAsync('CRN-5 đổi tài khoản / đăng xuất: hỏi TRƯỚC khi làm, "Ở lại" không làm gì, "Bỏ nháp" làm và không bị giữ lần nữa', async () => {
    const kho = d.taoKhoRoiNhap();
    let lam = 0;
    assert(await kho.xin(async () => { lam++; }) === true && lam === 1, 'không nháp → làm ngay');
    kho.dat('ck', { moTa: '3 em', conTrong: () => true });   // chỉ nháp ở máy: rời trang không mất, đổi chủ thì mất
    const p = kho.xin(async () => { lam++; assert(kho.giu(url('/a'), url('/b')) === null, 'đang làm: không giữ điều hướng của chính việc đó'); });
    assert(kho.dangXin()?.moTa === '3 em' && lam === 1, 'hỏi, chưa làm');
    kho.tra(false);
    assert(await p === false && lam === 1 && kho.dangXin() === null, 'Ở lại');
    const q = kho.xin(async () => { lam++; });
    kho.tra(true);
    assert(await q === true && lam === 2, 'Bỏ nháp → làm');
  });
  await checkAsync('CRN-7 lưu rồi đi tiếp cùng lần bấm ("Lưu · em tiếp ›"): bị giữ một nhịp, nguồn gỡ → tự đi tiếp, không hộp', async () => {
    const { createMemoryRouter } = await import('react-router-dom');
    const kho = d.taoKhoRoiNhap();
    const router = createMemoryRouter([{ path: '*', element: null }], { initialEntries: ['/mock-test/1'] });
    router.getBlocker('k', ({ currentLocation, nextLocation, historyAction }: any) => !!kho.giu(currentLocation, nextLocation, historyAction));
    const cho = () => router.state.blockers.get('k');
    kho.dat('hop', { moTa: 'điểm', conTrong: (a: any, b: any, kieu: string) => kieu !== 'POP' && a.pathname === b.pathname, hoi: () => {} });
    await router.navigate('/mock-test/2', { replace: true });   // lưu xong, form chưa kịp về "hết sửa"
    assert(cho()?.state === 'blocked', 'nhịp đầu: nguồn còn → giữ');
    kho.dat('hop', null);   // form về "hết sửa", gỡ nguồn
    assert(kho.giu(router.state.location, cho()!.location!, 'REPLACE') === null, 'đọc lại kho: không còn gì để mất');
    cho()!.proceed!();      // bộ chặn gốc: `!nGiu` → proceed, không hộp
    await new Promise((r) => setTimeout(r, 0));
    assert(router.state.location.pathname === '/mock-test/2', 'tới em tiếp');
    kho.dat('hop', { moTa: 'điểm', conTrong: (a: any, b: any, kieu: string) => kieu !== 'POP' && a.pathname === b.pathname, hoi: () => {} });
    await router.navigate('/mock-test/2?kn=R', { replace: true });
    assert(cho()?.state !== 'blocked', '"Lưu · bài tiếp ›" cùng trang: không giữ');
    router.dispose();
  });
  check('CRN-7 bộ chặn gốc chờ một nhịp rồi đọc lại kho trước khi hỏi', () => {
    const h = doc('web/src/ui/chanRoiNhap.tsx');
    assert(h.includes('setTimeout(() => setChin(viTri)') && h.includes("if (giu.state === 'blocked' && !nGiu) giu.proceed()"), 'chờ nhịp + tự đi tiếp khi nguồn gỡ');
  });
  check('CRN-6 áp vào màn: Cuối khoá, Lịch Test, panel, phiên — một đường hỏi', () => {
    const ck = doc('web/src/modules/classes/CuoiKhoaLop.tsx');
    assert(ck.includes('useChanRoiNhap(') && !ck.includes('window.confirm') && !ck.includes("'beforeunload'"), 'Cuối khoá dùng hook, bỏ hộp trình duyệt');
    assert(doc('web/src/modules/test/LichTestTab.tsx').includes('useChanRoiNhap('), 'Lịch Test dùng hook');
    const kp = doc('web/src/ui/KhungPanel.tsx');
    assert(kp.includes('khoRoiNhap.dat('), 'panel đang sửa ghi vào kho');
    assert(doc('web/src/modules/fasttrack/HopNhapDiem.tsx').includes('khoRoiNhap.dat('), 'hộp điểm đã gõ (Lịch Test, Chấm Test) ghi vào kho');
    const ss = doc('web/src/lib/session.tsx');
    assert((ss.match(/quaRoiNhap\(/g) ?? []).length >= 3, 'đổi tài khoản, đăng xuất, đổi góc nhìn hỏi trước');
    const app = doc('web/src/App.tsx');
    assert(app.includes('<ChanRoiNhapGoc'), 'gốc app vẽ bộ chặn duy nhất');
    const hook = doc('web/src/ui/chanRoiNhap.tsx');
    assert((hook.match(/useBlocker\(/g) ?? []).length === 1, 'một useBlocker cả app');
  });
}
