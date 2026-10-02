import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { useApi } from './lib/useApi.ts';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { LA_BAN_CHINH } from './lib/banChinh.ts';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import WelcomePage from './modules/platform/WelcomePage.tsx';
import { NAV_RONG, duongMoi, khuVucCuaDuong, khuVucHienThi, type DemYeuCau, type KhuVuc, type KhuVucMuc } from '@shared/domain/index.ts';

/* Tách gói theo trang (PR-TOCDO): trang nào mở mới tải; sau khi mở xong, nạp ngầm các trang còn lại để chuyển trang không phải chờ. */
const OverviewPage = lazy(() => import('./modules/worklist/OverviewPage.tsx'));
const MockDetailPage = lazy(() => import('./modules/fasttrack/MockDetailPage.tsx'));
const ChamDiemPage = lazy(() => import('./modules/cham/ChamDiemPage.tsx'));
const StudentsPage = lazy(() => import('./modules/students/StudentsPage.tsx'));
const ClassOverviewPage = lazy(() => import('./modules/classes/ClassOverviewPage.tsx'));
const StudentDetailPage = lazy(() => import('./modules/students/StudentDetailPage.tsx'));
const LuuTruPage = lazy(() => import('./modules/students/LuuTruPage.tsx'));
const CaseRoutePage = lazy(() => import('./modules/cases/CaseBoardPage.tsx').then((m) => ({ default: m.CaseRoutePage })));
const TestPage = lazy(() => import('./modules/test/TestPage.tsx'));
const CongViecPage = lazy(() => import('./modules/congViec/CongViecPage.tsx'));
const AdminPage = lazy(() => import('./modules/platform/AdminPage.tsx'));
const ProfilePage = lazy(() => import('./modules/platform/ProfilePage.tsx'));
const HoSoGiaoVienPage = lazy(() => import('./modules/giaoVien/HoSoGiaoVienPage.tsx').then((m) => ({ default: m.HoSoGiaoVienPage })));
const NAP_SAN = [() => import('./modules/worklist/OverviewPage.tsx'), () => import('./modules/fasttrack/MockDetailPage.tsx'), () => import('./modules/cham/ChamDiemPage.tsx'), () => import('./modules/students/StudentsPage.tsx'), () => import('./modules/classes/ClassOverviewPage.tsx'), () => import('./modules/students/StudentDetailPage.tsx'), () => import('./modules/students/LuuTruPage.tsx'), () => import('./modules/cases/CaseBoardPage.tsx'), () => import('./modules/test/TestPage.tsx'), () => import('./modules/congViec/CongViecPage.tsx'), () => import('./modules/platform/AdminPage.tsx'), () => import('./modules/platform/ProfilePage.tsx'), () => import('./modules/giaoVien/HoSoGiaoVienPage.tsx')];

/**
 * Trang thử thành phần dùng chung (PR-E Step 9) — CHỈ có khi chạy `npm run dev`. Điều kiện đứng
 * ngay ở chỗ `import()`: bản dựng thật thay `import.meta.env.DEV` bằng `false` nên trang này
 * không lọt vào gói gửi cho người dùng.
 */
const ThanhPhanDemo = import.meta.env.DEV ? lazy(() => import('./modules/dev/ThanhPhanDemo.tsx')) : null;

/**
 * BỐN KHU VỰC (PR-O, spec §3.1, mockup 01 phương án A): Tổng quan · Học viên & Lớp · Test · Công việc.
 * Máy tính: thanh ngang trên cùng. Điện thoại: thanh dưới 4 nút (G-11). Khu nào không có quyền thì bỏ hẳn.
 * Mục đang sáng tính theo khu vực của đường dẫn (`khuVucCuaDuong`), nên màn nhập điểm vẫn sáng mục Test.
 */
/**
 * SỐ CẠNH MỤC "CÔNG VIỆC" — Quản lý (PR-DUYET K1-44, Q10): số thẻ trong hộp Chờ duyệt (= chip "Tất cả", `demHop`), đỏ khi có thẻ quá hạn.
 * Giáo viên (PR-VAI-a V2, Q16): số việc QUÁ HẠN của chính mình (`/my-work` → `summary.overdue`, PR-S6F-b D14), luôn đỏ. Thanh trên và thanh dưới cùng một số.
 */
type SoBadge = { n: number; quaHan: boolean; sr: string } | null;
function SoCho({ so, className = 'ml-1.5' }: { so: SoBadge; className?: string }) {
  if (!so?.n) return null;
  return (
    <>
      <span aria-hidden className={`${className} inline-flex min-w-[1.25rem] justify-center rounded-full border px-1 text-[11.5px] font-semibold leading-4 tabular-nums ${
        so.quaHan ? 'border-late-line bg-late-bg text-late' : 'border-transparent bg-white/10 text-slate-300'}`}>{so.n}</span>
      <span className="sr-only">, {so.sr}</span>
    </>
  );
}

function NavItem({ muc, active, so }: { muc: KhuVucMuc; active: boolean; so: SoBadge }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined}
      className={`px-3 py-1.5 rounded-lg text-sm no-underline whitespace-nowrap transition-colors border ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {muc.label}{muc.key === 'cong-viec' && <SoCho so={so} />}
    </Link>
  );
}

/** Biểu tượng nét mảnh 20 px của thanh dưới — đường vẽ chép từ mockup 23 màn C (`#i-home` … `#i-work`). */
const BIEU_TUONG: Record<KhuVuc, ReactNode> = {
  'tong-quan': <path d="M3.5 9.5 10 4l6.5 5.5M5 8.5V16h3.5v-4h3v4H15V8.5" />,
  'hoc-vien': <><circle cx="7.5" cy="7" r="2.6" /><path d="M2.8 16c.6-2.7 2.4-4.1 4.7-4.1s4.1 1.4 4.7 4.1" /><circle cx="14" cy="7.6" r="2" /><path d="M13.6 11.9c1.8 0 3.1 1.2 3.6 3.4" /></>,
  test: <><rect x="4.5" y="3.8" width="11" height="13" rx="1.6" /><path d="M8 3.8V3h4v.8M7.5 9h5M7.5 12.2h5" /></>,
  'cong-viec': <path d="m3.8 6.2 1.5 1.5L8 5M3.8 12.2l1.5 1.5L8 11M10.8 6.5h5.4M10.8 12.5h5.4" />,
};

function NutDay({ muc, active, so }: { muc: KhuVucMuc; active: boolean; so: SoBadge }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined} title={muc.label}
      className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-[11.5px] no-underline ${
        active ? 'text-[color:var(--accent-strong)] font-semibold' : 'text-slate-400'
      }`}>
      {active && <span aria-hidden className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b bg-[color:var(--accent)]" />}
      <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {BIEU_TUONG[muc.key]}
      </svg>
      <span className="max-w-full truncate">{muc.labelNgan}</span>
      {muc.key === 'cong-viec' && <SoCho so={so} className="absolute top-[5px] left-[calc(50%+5px)] ml-0" />}
    </Link>
  );
}
export default function App() {
  const { session, loading } = useSession();
  const location = useLocation();
  /* Một lần mỗi lần đổi trang (không hỏi lặp theo giờ); chỉ người duyệt được (Q10). */
  const dem = useApi<DemYeuCau>(session?.authenticated && session.nav?.workApprove ? '/yeu-cau/dem' : null, [location.pathname]).data;
  /*
   * Q16: giáo viên đọc MỘT lần (deps rỗng) — tự tải lại khi `/my-work` bị làm mới (`invalidate` theo tiền tố). D14: chính `/my-work` (Tổng quan,
   * Công việc cũng đọc — `useApi` gộp GET đang bay, máy chủ tính `myWork` một lần).
   */
  const viecGv = useApi<{ summary: { overdue: number } }>(session?.authenticated && !session.nav?.workApprove && session.nav?.workSupport ? '/my-work' : null, []).data;
  const gv = viecGv ? { quaHan: viecGv.summary?.overdue ?? 0 } : null;
  const so: SoBadge = dem?.cho ? { n: dem.cho, quaHan: !!dem.quaHan, sr: `${dem.cho} thẻ trong hộp Chờ duyệt${dem.quaHan ? `, ${dem.quaHan} quá hạn` : ''}` }
    : gv?.quaHan ? { n: gv.quaHan, quaHan: true, sr: `${gv.quaHan} việc quá hạn` } : null;

  const daDangNhap = !!session?.authenticated;
  useEffect(() => {
    if (!daDangNhap) return;
    const t = setTimeout(() => NAP_SAN.forEach((nap) => { nap().catch(() => {}); }), 1500);
    return () => clearTimeout(t);
  }, [daDangNhap]);

  if (loading) return <div className="p-8 max-w-4xl mx-auto"><Skeleton rows={8} /></div>;
  if (!session?.authenticated) return <WelcomePage />;

  /* Đường dẫn cũ (link đã lưu, thông báo, link máy chủ sinh ra) → chỗ mới. Một bảng luật: shared/domain/dieuHuong.ts. */
  const moi = duongMoi(location.pathname, location.search);
  if (moi) return <Navigate to={moi} replace />;

  const nav = session.nav ?? NAV_RONG;
  const items = khuVucHienThi(nav);
  const dangO = khuVucCuaDuong(location.pathname);
  const banChinh = LA_BAN_CHINH || !!session.banChinh;

  return (
    <div className="h-full flex flex-col">
      <a href="#noi-dung" onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[110] btn btn-sm">Bỏ qua tới nội dung</a>
      {!banChinh && <DemoBar />}
      <header className="relative shrink-0 border-b bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md border grid place-items-center font-bold text-xs"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-slate-100">Pisa Tracking</div>
              {!banChinh && <div className="text-[11px] text-slate-500">Bản demo nội bộ</div>}
            </div>
          </div>
          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto">
            {items.map((m) => <NavItem key={m.key} muc={m} active={dangO === m.key} so={so} />)}
          </nav>
          <div className="flex-1 min-w-0" />
          <Header />
        </div>
      </header>

      <main id="noi-dung" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5 outline-none" key={location.pathname.split('/')[1]}>
        <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Skeleton rows={8} /></div>}>
        <Routes>
          <Route path="/" element={<OverviewPage tab="tong-quan" />} />
          <Route path="/phan-tich"
            element={nav.analysis ? <OverviewPage tab="phan-tich" /> : <Navigate to="/" replace />} />
          <Route path="/hoc-vien" element={<StudentsPage />} />
          <Route path="/hoc-vien/lop/:classId" element={<ClassOverviewPage />} />
          <Route path="/hoc-vien/luu-tru" element={<LuuTruPage />} />
          <Route path="/hoc-vien/:id" element={<StudentDetailPage />} />
          {/* Trang riêng của một Case — máy chủ sinh link này trong thông báo và Việc cần làm, nên phải giữ. */}
          <Route path="/hoc-thuat/case/:id" element={<CaseRoutePage />} />
          <Route path="/test/:tab?" element={nav.test ? <TestPage /> : <Navigate to="/" replace />} />
          {/* Một trang lưới cho cả hai loại lớp — máy chủ trả `mode`, trang chọn lưới đúng (đặc tả §3.5, §6). */}
          <Route path="/nhap-diem/:classId" element={<ChamDiemPage />} />
          <Route path="/bang-diem-thuong/:classId" element={<ChamDiemPage />} />
          <Route path="/mock-test/:id" element={<MockDetailPage />} />
          <Route path="/cong-viec/:tab?" element={nav.work ? <CongViecPage /> : <Navigate to="/" replace />} />
          {/*
            MÀN QUẢN TRỊ CHỈ GẮN VÀO KHI NGƯỜI XEM CÓ QUYỀN. Máy chủ vẫn chặn API; không có quyền thì đưa thẳng về
            Tổng quan thay vì để trang tải rồi báo 403.
          */}
          <Route path="/quan-tri" element={nav.admin ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="/ho-so-ca-nhan" element={<ProfilePage />} />
          <Route path="/giao-vien/:id" element={<HoSoGiaoVienPage />} />
          {ThanhPhanDemo && (
            <Route path="/dev/thanh-phan"
              element={<Suspense fallback={<Skeleton rows={6} />}><ThanhPhanDemo /></Suspense>} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>

      {/* Điện thoại: thanh dưới 4 nút (G-11). z-30 — dưới menu tài khoản/thông báo ở đầu trang (z-40), Drawer/Modal (z-50),
          menu ⋯ của dòng (z-[60]) và Toast (z-[100]). */}
      <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t bg-[color:var(--surface)]"
        style={{ borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map((m) => <NutDay key={m.key} muc={m} active={dangO === m.key} so={so} />)}
      </nav>
    </div>
  );
}
