import { Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { useApi } from './lib/useApi.ts';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { LA_BAN_CHINH } from './lib/banChinh.ts';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import OverviewPage from './modules/worklist/OverviewPage.tsx';
import MockDetailPage from './modules/fasttrack/MockDetailPage.tsx';
import ChamDiemPage from './modules/cham/ChamDiemPage.tsx';
import StudentsPage from './modules/students/StudentsPage.tsx';
import ClassOverviewPage from './modules/classes/ClassOverviewPage.tsx';
import StudentDetailPage from './modules/students/StudentDetailPage.tsx';
import LuuTruPage from './modules/students/LuuTruPage.tsx';
import { CaseRoutePage } from './modules/cases/CaseBoardPage.tsx';
import TestPage from './modules/test/TestPage.tsx';
import CongViecPage from './modules/congViec/CongViecPage.tsx';
import AdminPage from './modules/platform/AdminPage.tsx';
import ProfilePage from './modules/platform/ProfilePage.tsx';
import WelcomePage from './modules/platform/WelcomePage.tsx';
import { NAV_RONG, duongMoi, khuVucCuaDuong, khuVucHienThi, type DemYeuCau, type KhuVucMuc } from '@shared/domain/index.ts';

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
/** PR-DUYET (K1-44, Q10): số thẻ trong hộp Chờ duyệt (= chip "Tất cả", `demHop`) cạnh mục Công việc của QL — đỏ khi có thẻ quá hạn. */
function SoCho({ dem }: { dem?: DemYeuCau | null }) {
  if (!dem?.cho) return null;
  return (
    <>
      <span aria-hidden className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full border px-1 text-[11.5px] font-semibold leading-4 tabular-nums ${
        dem.quaHan ? 'border-late-line bg-late-bg text-late' : 'border-transparent bg-white/10 text-slate-300'}`}>{dem.cho}</span>
      <span className="sr-only">, {dem.cho} thẻ trong hộp Chờ duyệt{dem.quaHan ? `, ${dem.quaHan} quá hạn` : ''}</span>
    </>
  );
}

function NavItem({ muc, active, dem }: { muc: KhuVucMuc; active: boolean; dem?: DemYeuCau | null }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined}
      className={`px-3 py-1.5 rounded-lg text-sm no-underline whitespace-nowrap transition-colors border ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {muc.label}{muc.key === 'cong-viec' && <SoCho dem={dem} />}
    </Link>
  );
}

function NutDay({ muc, active, dem }: { muc: KhuVucMuc; active: boolean; dem?: DemYeuCau | null }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined} title={muc.label}
      className={`flex-1 min-w-0 text-center py-2.5 text-[11px] no-underline truncate ${
        active ? 'text-[color:var(--accent-strong)] font-semibold' : 'text-slate-400'
      }`}>
      {muc.labelNgan}{muc.key === 'cong-viec' && <SoCho dem={dem} />}
    </Link>
  );
}

export default function App() {
  const { session, loading } = useSession();
  const location = useLocation();
  /* Một lần mỗi lần đổi trang (không hỏi lặp theo giờ); chỉ người duyệt được (Q10). */
  const dem = useApi<DemYeuCau>(session?.authenticated && session.nav?.workApprove ? '/yeu-cau/dem' : null, [location.pathname]).data;

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
      <header className="shrink-0 border-b bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
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
            {items.map((m) => <NavItem key={m.key} muc={m} active={dangO === m.key} dem={dem} />)}
          </nav>
          <div className="flex-1 min-w-0" />
          <Header />
        </div>
      </header>

      <main id="noi-dung" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5 outline-none" key={location.pathname.split('/')[1]}>
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
          {ThanhPhanDemo && (
            <Route path="/dev/thanh-phan"
              element={<Suspense fallback={<Skeleton rows={6} />}><ThanhPhanDemo /></Suspense>} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Điện thoại: thanh dưới 4 nút (G-11). z-30 — dưới menu tài khoản/thông báo ở đầu trang (z-40), Drawer/Modal (z-50),
          menu ⋯ của dòng (z-[60]) và Toast (z-[100]). */}
      <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t bg-[color:var(--surface)]"
        style={{ borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map((m) => <NutDay key={m.key} muc={m} active={dangO === m.key} dem={dem} />)}
      </nav>
    </div>
  );
}
