import { NavLink, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import OverviewPage from './modules/worklist/OverviewPage.tsx';
import MockDetailPage from './modules/fasttrack/MockDetailPage.tsx';
import ScoreSheetPage from './modules/fasttrack/ScoreSheetPage.tsx';
import RegularSheetPage from './modules/normal/RegularSheetPage.tsx';
import WeeklyRollupPage from './modules/worklist/WeeklyRollupPage.tsx';
import StudentsPage from './modules/students/StudentsPage.tsx';
import ClassOverviewPage from './modules/classes/ClassOverviewPage.tsx';
import StudentDetailPage from './modules/students/StudentDetailPage.tsx';
import AcademicPage, { CaseRoutePage } from './modules/cases/CaseBoardPage.tsx';
import MeetingPage from './modules/worklist/MeetingPage.tsx';
import MgmtTasksPage from './modules/worklist/MgmtTasksPage.tsx';
import AdminPage from './modules/platform/AdminPage.tsx';
import ProfilePage from './modules/platform/ProfilePage.tsx';
import WelcomePage from './modules/platform/WelcomePage.tsx';

/**
 * HAI MỤC, KHÔNG HƠN.
 *
 * Trước đây bốn mục là bốn cách nghĩ khác nhau — theo TUẦN, theo LỚP, theo VẤN ĐỀ, theo ĐƠN
 * VỊ — và học viên, thứ đáng lẽ là tâm của cả phần mềm, lại không có mục nào. Muốn xem một
 * em phải đi ba bước qua hai cách nghĩ.
 *
 * Nay chỉ còn hai câu hỏi thường ngày:
 *   Tổng quan — việc của tôi hôm nay là gì?
 *   Học viên  — em nào, lớp nào, đang thế nào?
 *
 * Tổng hợp tuần, báo cáo tuần và quản trị là những màn mở thỉnh thoảng nên chuyển vào menu
 * tài khoản. Màn Học thuật cũ trở thành một tab của Tổng quan cho Quản lý.
 */
const NAV = [
  { to: '/', label: 'Tổng quan', key: 'overview' as const },
  { to: '/hoc-vien', label: 'Học viên', key: 'students' as const },
  /*
   * Mục thứ ba chỉ hiện với Quản trị hệ thống và Quản lý chi nhánh. Với mọi người khác,
   * danh sách điều hướng vẫn đúng hai mục như cũ.
   */
  { to: '/tien-do-cong-viec', label: 'Tiến độ công việc', key: 'mgmtTasks' as const },
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

  const nav = session.nav ?? { overview: true, mocks: false, students: false, meeting: false, academic: false, mgmtTasks: false, admin: false };
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
          {/*
            Học thuật: nơi nhìn thấy VẤN ĐỀ theo chi nhánh / nhóm / kỹ năng. Một vấn đề có
            trang riêng để gửi đường dẫn được, và mở dạng ngăn kéo khi đang ở màn khác —
            cả hai đều là cùng một bản ghi.
          */}
          <Route path="/hoc-thuat" element={<AcademicPage />} />
          <Route path="/hoc-thuat/case/:id" element={<CaseRoutePage />} />
          <Route path="/nhap-diem/:classId" element={<ScoreSheetPage />} />
          {/* Lớp Normal chấm theo điểm đạt/tổng điểm nên có bảng điểm riêng, không dùng bảng band IELTS. */}
          <Route path="/bang-diem-thuong/:classId" element={<RegularSheetPage />} />
          {/* Tổng hợp theo tuần cho Quản lý — thay cho sheet cùng tên trong workbook. */}
          <Route path="/tong-hop-tuan" element={<WeeklyRollupPage />} />
          <Route path="/mock-test/:id" element={<MockDetailPage />} />
          <Route path="/tien-trinh" element={<MeetingPage />} />
          {/*
            Bảng việc quản lý: cũng chỉ gắn khi người xem có quyền, để người không có quyền
            không thấy trang tải rồi mới báo từ chối.
          */}
          <Route path="/tien-do-cong-viec"
            element={nav.mgmtTasks ? <MgmtTasksPage /> : <Navigate to="/" replace />} />
          {/*
            MÀN QUẢN TRỊ CHỈ GẮN VÀO KHI NGƯỜI XEM CÓ QUYỀN.

            Máy chủ vẫn chặn đúng nếu ai đó gọi thẳng API. Nhưng nếu vẫn gắn màn cho mọi
            người thì giáo viên gõ địa chỉ đó sẽ thấy trang tải rồi mới báo từ chối, và bảng
            điều khiển của trình duyệt ghi một lỗi đỏ 403 — lâu dần người ta hết tin vào
            những lỗi đỏ khác. Không có quyền thì đưa thẳng về Tổng quan.
          */}
          <Route path="/quan-tri"
            element={nav.admin ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="/ho-so-ca-nhan" element={<ProfilePage />} />
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
