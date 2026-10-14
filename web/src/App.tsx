import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { useApi } from './lib/useApi.ts';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { LA_BAN_CHINH } from './lib/banChinh.ts';
import { useGhiNguon, useTieuDeTab } from './lib/quayLai.ts';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import { useToast } from './ui/Toast.tsx';
import { CHIP_TRON } from './ui/Nhan.tsx';
import WelcomePage from './modules/platform/WelcomePage.tsx';
import { NAV_RONG, duongMoi, khuVucCuaDuong, khuVucHienThi, type DemYeuCau, type KhuVuc, type KhuVucMuc } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

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
 * SỐ CẠNH MỤC "CÔNG VIỆC" — Quản lý (PR-DUYET K1-44, Q10): số thẻ PHẢI QUYẾT (= chip "Tất cả" tab Chờ duyệt, `demHop`; PR-GVb J5b: không gồm tab Nhắc việc), đỏ khi có thẻ quá hạn.
 * Giáo viên (PR-VAI-a V2, Q16): số việc QUÁ HẠN của chính mình (`/my-work` → `summary.overdue`, PR-S6F-b D14), luôn đỏ. Thanh trên và thanh dưới cùng một số.
 */
type SoBadge = { n: number; quaHan: boolean; sr: string } | null;
function SoCho({ so, className = 'ml-1.5' }: { so: SoBadge; className?: string }) {
  if (!so?.n) return null;
  return (
    <>
      <span aria-hidden className={`${className} ${CHIP_TRON} min-w-[1.25rem] justify-center tabular-nums ${
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
  const { session, loading, reload, doiGocNhin } = useSession();
  const toast = useToast();
  const location = useLocation();
  useGhiNguon();   // PR-OV5b: nguồn của nút "‹ Quay lại" ở mọi hồ sơ
  useTieuDeTab(!!session?.authenticated);   // OV-11i (P1-3): tiêu đề tab theo màn
  /* PR-PH / HK2: bấm "Thử lại" ở dải Mất kết nối → nút khoá, chữ "Đang thử…" tới khi tải xong. */
  const [dangThu, setDangThu] = useState(false);
  const thuLai = async () => { setDangThu(true); try { await reload(); } finally { setDangThu(false); } };
  /*
   * Chỉ người duyệt được (Q10). PR-TD2-c (chủ sản phẩm 07/10): đổi trang chỉ hỏi lại khi lần trước đã quá 60 s — huy hiệu trễ tối đa 60 s
   * khi NGƯỜI KHÁC gửi yêu cầu; việc của chính mình gọi `invalidate('/yeu-cau')` nên cập nhật ngay. Không hỏi lặp theo giờ.
   */
  const [lanDem, setLanDem] = useState(() => Date.now());
  useEffect(() => { if (Date.now() - lanDem > 60_000) setLanDem(Date.now()); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const dem = useApi<DemYeuCau>(session?.authenticated && session.nav?.workApprove ? '/yeu-cau/dem' : null, [lanDem]).data;
  /*
   * Q16: giáo viên đọc MỘT lần (deps rỗng) — tự tải lại khi `/my-work` bị làm mới (`invalidate` theo tiền tố). D14: chính `/my-work` (Tổng quan,
   * Công việc cũng đọc — `useApi` gộp GET đang bay, máy chủ tính `myWork` một lần).
   */
  const viecGv = useApi<{ summary: { overdue: number } }>(session?.authenticated && !session.nav?.workApprove && session.nav?.workSupport ? '/my-work' : null, []).data;
  const gv = viecGv ? { quaHan: viecGv.summary?.overdue ?? 0 } : null;
  const so: SoBadge = dem?.cho ? { n: dem.cho, quaHan: !!dem.quaHan, sr: t('{n} thẻ cần duyệt', { n: dem.cho }) + (dem.quaHan ? t(', {n} quá hạn', { n: dem.quaHan }) : '') }
    : gv?.quaHan ? { n: gv.quaHan, quaHan: true, sr: t('{n} việc quá hạn', { n: gv.quaHan }) } : null;

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
  const gocNhin = session.gocNhin;

  return (
    <div className="h-full flex flex-col">
      <a href="#noi-dung" onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[110] btn btn-sm">{t('Bỏ qua tới nội dung')}</a>
      {!banChinh && <DemoBar />}
      {/* PR-PH: mất kết nối khi tải lại phiên KHÔNG phải đăng xuất — giữ nguyên màn, chỉ báo và cho thử lại. */}
      {session.loiKetNoi && (
        <div role="status" className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 sm:px-4 py-2 text-xs"
          style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))', color: 'rgb(var(--soon-rgb))' }}>
          <span>{t('Mất kết nối tới máy chủ — dữ liệu trên màn có thể chưa mới. Bạn vẫn đang đăng nhập.')}</span>
          <button type="button" className="btn btn-sm" disabled={dangThu} onClick={() => { void thuLai(); }}>{dangThu ? t('Đang thử…') : t('Thử lại')}</button>
        </div>
      )}
      <header className="relative shrink-0 border-b bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
        {/* D7 (mockup 23C): điện thoại cao 52 px, chữ PISA thay ô "P", nút sát nhau; máy tính giữ nguyên. */}
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14 max-sm:h-[52px] max-sm:gap-0.5 max-sm:pl-4 max-sm:pr-1.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="sm:hidden text-[15px] font-bold tracking-[0.06em] text-slate-100">PISA</span>
            <div className="w-7 h-7 rounded-md border hidden sm:grid place-items-center font-bold text-xs"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-slate-100">PISA Tracking</div>
              {!banChinh && <div className="text-xs text-slate-500">{t('Bản demo nội bộ')}</div>}
            </div>
          </div>
          <nav aria-label={t('Điều hướng chính')} className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto">
            {items.map((m) => <NavItem key={m.key} muc={m} active={dangO === m.key} so={so} />)}
          </nav>
          <div className="flex-1 min-w-0" />
          <Header />
        </div>
      </header>
      {/* PR-OV2a (mockup overhaul-3 §2): đang ở một góc nhìn → dải mỏng luôn nói vai + phạm vi, có lối về vai gốc. */}
      {gocNhin?.dangChon && (() => {
        const vai = gocNhin.coThe.find((v) => v.role === gocNhin.dangChon);
        const goc = gocNhin.coThe.find((v) => v.role === gocNhin.vaiGoc);
        return (
          <div role="status" className="shrink-0 flex items-center gap-x-2.5 gap-y-1 border-b px-4 sm:px-5 py-1.5 text-[12.5px] text-slate-300 min-w-0"
            style={{ borderColor: 'rgb(var(--wait-line-rgb))', background: 'rgb(var(--wait-bg-rgb))' }}>
            <b className="shrink-0 font-semibold" style={{ color: 'rgb(var(--wait-rgb))' }}>{t('Góc nhìn: {vai}', { vai: vai?.nhan ?? gocNhin.dangChon })}</b>
            {vai?.phamVi && <span className="hidden sm:inline min-w-0 truncate" title={vai.phamVi}>· {vai.phamVi}</span>}
            <span className="flex-1" />
            <button type="button" className="shrink-0 min-h-[32px] max-sm:min-h-[44px] border-0 bg-transparent p-0 text-[12.5px] cursor-pointer text-[color:var(--accent)] hover:underline"
              onClick={() => { doiGocNhin(null).catch((e) => toast.push('error', e instanceof Error ? e.message : t('Không đổi được góc nhìn.'))); }}>{t('Về {vai}', { vai: goc?.nhan ?? t('vai gốc') })}</button>
          </div>
        );
      })()}

      <main id="noi-dung" tabIndex={-1} className="relative flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5 outline-none" key={location.pathname.split('/')[1]}>
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
          {/* OV-11i (TE-12): TVV / CX (không `nav.test`) mở thẳng lưới nhập điểm → Tổng quan, như `/test`. */}
          <Route path="/nhap-diem/:classId" element={nav.test ? <ChamDiemPage /> : <Navigate to="/" replace />} />
          <Route path="/bang-diem-thuong/:classId" element={nav.test ? <ChamDiemPage /> : <Navigate to="/" replace />} />
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
      <nav aria-label={t('Điều hướng chính')} className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t bg-[color:var(--surface)]"
        style={{ borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map((m) => <NutDay key={m.key} muc={m} active={dangO === m.key} so={so} />)}
      </nav>
    </div>
  );
}
