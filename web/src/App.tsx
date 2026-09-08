import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { DemoBar } from './components/DemoBar.tsx';
import { Header } from './components/Header.tsx';
import { Skeleton } from './components/ui.tsx';
import OverviewPage from './pages/Overview.tsx';
import MocksPage from './pages/Mocks.tsx';
import MockDetailPage from './pages/MockDetail.tsx';
import ScoreSheetPage from './pages/ScoreSheet.tsx';
import StudentsPage from './pages/Students.tsx';
import StudentDetailPage from './pages/StudentDetail.tsx';
import MeetingPage from './pages/Meeting.tsx';
import AdminPage from './pages/Admin.tsx';
import WelcomePage from './pages/Welcome.tsx';

/**
 * Bốn mục nghiệp vụ, không hơn. Quản trị là lối vào phụ, chỉ hiện với người có quyền.
 * SOS, báo cáo, công việc KHÔNG có menu riêng — chúng nằm ngay nơi phát sinh.
 */
const NAV = [
  { to: '/', label: 'Tổng quan', key: 'overview' as const },
  { to: '/mock-test', label: 'Mock Test', key: 'mocks' as const },
  { to: '/hoc-vien', label: 'Học viên', key: 'students' as const },
  { to: '/hop-tuan', label: 'Họp tuần', key: 'meeting' as const },
];

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
      <header className="shrink-0 border-b bg-[#0b141d]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-teal-500/15 border border-teal-500/40 grid place-items-center text-teal-300 font-bold text-xs">P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-slate-100">PISA Progress</div>
              <div className="text-[10px] text-slate-500">Bản demo nội bộ</div>
            </div>
          </div>
          <nav aria-label="Điều hướng chính" className="flex items-center gap-1 overflow-x-auto">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm no-underline whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-teal-500/12 text-teal-200 border border-teal-500/30'
                      : 'text-slate-300 border border-transparent hover:bg-white/5'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex-1" />
          <Header />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-5" key={location.pathname.split('/')[1]}>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/mock-test" element={<MocksPage />} />
          <Route path="/mock-test/lop/:classId" element={<ScoreSheetPage />} />
          <Route path="/mock-test/:id" element={<MockDetailPage />} />
          <Route path="/hoc-vien" element={<StudentsPage />} />
          <Route path="/hoc-vien/:id" element={<StudentDetailPage />} />
          <Route path="/hop-tuan" element={<MeetingPage />} />
          <Route path="/quan-tri" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
