import { NavLink, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { DemoBar } from './components/DemoBar.tsx';
import { Header } from './components/Header.tsx';
import { Skeleton } from './components/ui.tsx';
import OverviewPage from './pages/Overview.tsx';
import MockDetailPage from './pages/MockDetail.tsx';
import ScoreSheetPage from './pages/ScoreSheet.tsx';
import RegularSheetPage from './pages/RegularSheet.tsx';
import WeeklyRollupPage from './pages/WeeklyRollup.tsx';
import StudentsPage from './pages/Students.tsx';
import ClassOverviewPage from './pages/ClassOverview.tsx';
import StudentDetailPage from './pages/StudentDetail.tsx';
import MeetingPage from './pages/Meeting.tsx';
import AdminPage from './pages/Admin.tsx';
import WelcomePage from './pages/Welcome.tsx';

/**
 * Ba mục nghiệp vụ. Quản trị hệ thống là lối vào phụ trong menu tài khoản.
 *
 * Mock Test không còn là mục riêng: tiến độ, lịch và điểm đều là các cách xem của HỌC VIÊN,
 * và mọi đường dẫn đổ về cùng một Student Detail. SOS, báo cáo, công việc cũng không có menu
 * riêng — chúng nằm ngay nơi phát sinh.
 */
const NAV = [
  { to: '/', label: 'Tổng quan', key: 'overview' as const },
  { to: '/tien-trinh', label: 'Tiến trình công việc', key: 'meeting' as const },
  { to: '/hoc-vien', label: 'Học viên', key: 'students' as const },
];

function LegacySheetRedirect() {
  const { classId } = useParams();
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={`/nhap-diem/${classId}${qs ? `?${qs}` : ''}`} replace />;
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm no-underline whitespace-nowrap transition-colors border ${
          isActive
            ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
            : 'text-slate-300 border-transparent hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return <div className="p-8 max-w-4xl mx-auto"><Skeleton rows={8} /></div>;
  if (!session?.authenticated) return <WelcomePage />;

  const nav = session.nav ?? { overview: true, mocks: false, students: false, meeting: false, admin: false };
  const items = NAV.filter((n) => nav[n.key]);

  return (
    <div className="h-full flex flex-col">
      <DemoBar />
      {/*
        Màn hẹp: xếp thành hai hàng — nhận diện + tài khoản ở trên, điều hướng cuộn ngang ở dưới.
        Ép cả ba khối vào một hàng ở 390px sẽ làm tràn ngang toàn trang.
      */}
      <header className="shrink-0 border-b bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md border grid place-items-center font-bold text-xs"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-slate-100">PISA Progress</div>
              <div className="text-[10px] text-slate-500">Bản demo nội bộ</div>
            </div>
          </div>
          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto">
            {items.map((n) => <NavItem key={n.to} to={n.to} label={n.label} />)}
          </nav>
          <div className="flex-1 min-w-0" />
          <Header />
        </div>
        <nav aria-label="Điều hướng chính" className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {items.map((n) => <NavItem key={n.to} to={n.to} label={n.label} />)}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-5" key={location.pathname.split('/')[1]}>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/hoc-vien" element={<StudentsPage />} />
          <Route path="/hoc-vien/lop/:classId" element={<ClassOverviewPage />} />
          <Route path="/hoc-vien/:id" element={<StudentDetailPage />} />
          <Route path="/nhap-diem/:classId" element={<ScoreSheetPage />} />
          {/* Lớp thường chấm theo số câu đúng nên có bảng điểm riêng, không dùng bảng band IELTS. */}
          <Route path="/bang-diem-thuong/:classId" element={<RegularSheetPage />} />
          {/* Tổng hợp theo tuần cho Quản lý — thay cho sheet cùng tên trong workbook. */}
          <Route path="/tong-hop-tuan" element={<WeeklyRollupPage />} />
          <Route path="/mock-test/:id" element={<MockDetailPage />} />
          <Route path="/tien-trinh" element={<MeetingPage />} />
          <Route path="/quan-tri" element={<AdminPage />} />
          {/* Đường dẫn cũ vẫn mở được để link đã lưu không gãy. */}
          <Route path="/mock-test" element={<Navigate to="/hoc-vien" replace />} />
          <Route path="/mock-test/lop/:classId" element={<LegacySheetRedirect />} />
          <Route path="/hop-tuan" element={<Navigate to="/tien-trinh" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
