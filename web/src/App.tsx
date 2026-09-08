import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { DemoBar } from './components/DemoBar.tsx';
import { Header } from './components/Header.tsx';
import { Skeleton } from './components/ui.tsx';
import DashboardPage from './pages/Dashboard.tsx';
import StudentsPage from './pages/Students.tsx';
import StudentDetailPage from './pages/StudentDetail.tsx';
import ClassesPage from './pages/Classes.tsx';
import ClassDetailPage from './pages/ClassDetail.tsx';
import IssuesPage from './pages/Issues.tsx';
import TasksPage from './pages/Tasks.tsx';
import ReportsPage from './pages/Reports.tsx';
import MeetingsPage from './pages/Meetings.tsx';
import AdminPage from './pages/Admin.tsx';
import WelcomePage from './pages/Welcome.tsx';

type NavItem = { to: string; label: string; icon: string; show: (c: Record<string, boolean>) => boolean };

/** Tối đa 8 mục, lọc theo quyền thực tế của tài khoản. */
const NAV: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: '◱', show: () => true },
  { to: '/hoc-vien', label: 'Học viên', icon: '☰', show: (c) => !!c.viewAcademic },
  { to: '/lop-hoc', label: 'Lớp học', icon: '▤', show: (c) => !!c.viewAcademic && !c.isConsultantOnly },
  { to: '/van-de', label: 'Vấn đề', icon: '⚑', show: (c) => !!c.viewIssues },
  { to: '/cong-viec', label: 'Công việc', icon: '✓', show: (c) => !!c.viewTasks },
  { to: '/bao-cao', label: 'Báo cáo', icon: '▦', show: (c) => !!c.viewReports || !!c.viewAcademic },
  { to: '/cuoc-hop', label: 'Cuộc họp', icon: '☷', show: (c) => !!c.viewMeetings },
  { to: '/quan-tri', label: 'Quản trị', icon: '⚙', show: (c) => !!c.admin },
];

export default function App() {
  const { session, loading } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 1100);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Skeleton rows={8} />
      </div>
    );
  }

  if (!session?.authenticated) return <WelcomePage />;

  const caps = session.capabilities ?? {};
  const items = NAV.filter((n) => n.show(caps));

  return (
    <div className="h-full flex flex-col">
      <DemoBar />
      <div className="flex-1 flex min-h-0">
        <nav
          className={`shrink-0 border-r bg-[#0b141d] flex flex-col transition-all ${collapsed ? 'w-14' : 'w-56'}`}
          style={{ borderColor: 'var(--line)' }}
          aria-label="Điều hướng chính"
        >
          <div className={`flex items-center gap-2 px-3 h-14 border-b ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <div className="w-7 h-7 rounded-md bg-teal-500/15 border border-teal-500/40 grid place-items-center text-teal-300 font-bold text-xs shrink-0">P</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 leading-tight">PISA Progress</div>
                <div className="text-[10px] text-slate-500 leading-tight">Bản demo nội bộ</div>
              </div>
            )}
          </div>
          <ul className="flex-1 py-2 space-y-0.5 overflow-y-auto">
            {items.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === '/'}
                  title={n.label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 mx-2 px-2.5 py-2 rounded-lg text-sm no-underline transition-colors ${
                      isActive ? 'bg-teal-500/12 text-teal-200 border border-teal-500/30' : 'text-slate-300 border border-transparent hover:bg-white/5'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  <span aria-hidden className="text-base leading-none">{n.icon}</span>
                  {!collapsed && <span className="truncate">{n.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-sm btn-ghost m-2 justify-center"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? '»' : '« Thu gọn'}
          </button>
        </nav>

        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-5" key={location.pathname.split('/')[1]}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/hoc-vien" element={<StudentsPage />} />
              <Route path="/hoc-vien/:id" element={<StudentDetailPage />} />
              <Route path="/lop-hoc" element={<ClassesPage />} />
              <Route path="/lop-hoc/:id" element={<ClassDetailPage />} />
              <Route path="/van-de" element={<IssuesPage />} />
              <Route path="/cong-viec" element={<TasksPage />} />
              <Route path="/bao-cao" element={<ReportsPage />} />
              <Route path="/cuoc-hop" element={<MeetingsPage />} />
              <Route path="/quan-tri" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
