import { Component, Suspense, useEffect, useLayoutEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { onHetPhien, onLoiTaiLai, thuLaiNen, useApi } from './lib/useApi.ts';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { LA_BAN_CHINH } from './lib/banChinh.ts';
import { useGhiNguon, useTieuDeTab } from './lib/quayLai.ts';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import { useToast } from './ui/Toast.tsx';
import { CHIP_TRON } from './ui/Nhan.tsx';
import logoPisa from './ui/logo-pisa.png';
import WelcomePage from './modules/platform/WelcomePage.tsx';
import { KhoanhPhanTu } from './modules/huongDan/chiChoToi.tsx';
import { MenuDong } from './ui/MenuDong.tsx';
import { NAV_RONG, chiaMucThanh, chiaThanhDuoi, duongMoi, khuVucCuaDuong, khuVucHienThi, type DemYeuCau, type KhuVuc, type KhuVucMuc } from '@shared/domain/index.ts';
import { NGON_NGU, t } from '@shared/i18n/index.ts';
/* Khoá 'Thêm' của từ điển là "Add" (thêm mới); nút gom menu là "More". */
const THEM = NGON_NGU === 'en' ? 'More' : 'Thêm';
import { lazyTai } from './lib/taiLaiManh.ts';

/**
 * Hotfix 15/10 (L4): lỗi render bất kỳ trong trang → câu lỗi + Tải lại thay vì màn tối; console ghi mã để đối chiếu khi chủ SP gửi ảnh.
 * Đổi đường dẫn (bấm menu, Quay lại) thì bỏ màn lỗi — không kẹt; không dùng `key` để đổi tab không dựng lại trang.
 */
class BatLoiTrang extends Component<{ duong: string; children: ReactNode }, { ma: string | null }> {
  state = { ma: null as string | null };
  static getDerivedStateFromError() { return { ma: `E-${Date.now().toString(36).toUpperCase()}` }; }
  componentDidUpdate(truoc: { duong: string }) { if (this.state.ma && truoc.duong !== this.props.duong) this.setState({ ma: null }); }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(`[PISA] lỗi giao diện ${this.state.ma ?? ''}`, error, info.componentStack); }
  render() {
    if (!this.state.ma) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
        <div className="text-bad font-medium">{t('Trang gặp lỗi khi hiển thị.')}</div>
        <p className="m-0 text-slate-400 text-xs">{t('Mã lỗi: {ma}', { ma: this.state.ma })}</p>
        <button type="button" className="btn btn-sm mt-2 min-h-[44px] sm:min-h-0" onClick={() => window.location.reload()}>{t('Tải lại')}</button>
      </div>
    );
  }
}

/* Tách gói theo trang (PR-TOCDO): trang nào mở mới tải; sau khi mở xong, nạp ngầm các trang còn lại để chuyển trang không phải chờ. */
const OverviewPage = lazyTai(() => import('./modules/worklist/OverviewPage.tsx'));
const MockDetailPage = lazyTai(() => import('./modules/fasttrack/MockDetailPage.tsx'));
const ChamDiemPage = lazyTai(() => import('./modules/cham/ChamDiemPage.tsx'));
const StudentsPage = lazyTai(() => import('./modules/students/StudentsPage.tsx'));
const ClassOverviewPage = lazyTai(() => import('./modules/classes/ClassOverviewPage.tsx'));
const StudentDetailPage = lazyTai(() => import('./modules/students/StudentDetailPage.tsx'));
const LuuTruPage = lazyTai(() => import('./modules/students/LuuTruPage.tsx'));
const CaseRoutePage = lazyTai(() => import('./modules/cases/CaseBoardPage.tsx').then((m) => ({ default: m.CaseRoutePage })));
const TestPage = lazyTai(() => import('./modules/test/TestPage.tsx'));
const CongViecPage = lazyTai(() => import('./modules/congViec/CongViecPage.tsx'));
const AdminPage = lazyTai(() => import('./modules/platform/AdminPage.tsx'));
const ProfilePage = lazyTai(() => import('./modules/platform/ProfilePage.tsx'));
const HoSoGiaoVienPage = lazyTai(() => import('./modules/giaoVien/HoSoGiaoVienPage.tsx').then((m) => ({ default: m.HoSoGiaoVienPage })));
const HuongDanPage = lazyTai(() => import('./modules/huongDan/HuongDanPage.tsx'));
const PhanTichPage = lazyTai(() => import('./modules/phanTich/PhanTichPage.tsx'));
const TutorPage = lazyTai(() => import('./modules/tutor/TutorPage.tsx'));
const NAP_SAN = [() => import('./modules/worklist/OverviewPage.tsx'), () => import('./modules/fasttrack/MockDetailPage.tsx'), () => import('./modules/cham/ChamDiemPage.tsx'), () => import('./modules/students/StudentsPage.tsx'), () => import('./modules/classes/ClassOverviewPage.tsx'), () => import('./modules/students/StudentDetailPage.tsx'), () => import('./modules/students/LuuTruPage.tsx'), () => import('./modules/cases/CaseBoardPage.tsx'), () => import('./modules/test/TestPage.tsx'), () => import('./modules/congViec/CongViecPage.tsx'), () => import('./modules/platform/AdminPage.tsx'), () => import('./modules/platform/ProfilePage.tsx'), () => import('./modules/giaoVien/HoSoGiaoVienPage.tsx'), () => import('./modules/huongDan/HuongDanPage.tsx'), () => import('./modules/phanTich/PhanTichPage.tsx')];

/**
 * Trang thử thành phần dùng chung (PR-E Step 9) — CHỈ có khi chạy `npm run dev`. Điều kiện đứng
 * ngay ở chỗ `import()`: bản dựng thật thay `import.meta.env.DEV` bằng `false` nên trang này
 * không lọt vào gói gửi cho người dùng.
 */
const ThanhPhanDemo = import.meta.env.DEV ? lazyTai(() => import('./modules/dev/ThanhPhanDemo.tsx')) : null;

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
      <span aria-hidden title={so.sr} className={`${className} ${CHIP_TRON} min-w-[1.25rem] justify-center tabular-nums ${
        so.quaHan ? 'border-late-line bg-late-bg text-late' : 'border-transparent bg-white/15 text-slate-100'}`}>{so.n}</span>
      <span className="sr-only">, {so.sr}</span>
    </>
  );
}

/* NEN-V5 (`.dh` của mockup V5): mục thanh xanh cao bằng thanh, chữ 14 / 500; đang mở = chữ trắng đậm + vạch hồng 3 px ở đáy. */
const lopNav = (active: boolean) => `inline-flex h-14 shrink-0 items-center border-b-[3px] px-3 text-sm no-underline whitespace-nowrap transition-colors ${
  active
    ? 'border-[color:var(--hong)] font-bold text-[color:var(--dieu-huong-chu-mo)]'
    : 'border-transparent font-medium text-[color:var(--dieu-huong-chu)] hover:bg-[color:var(--dieu-huong-hover)] hover:text-[color:var(--dieu-huong-chu-mo)]'
}`;

/** `bang`: bản đo (vô hình, không `data-hd`, không nhận focus). */
function NavItem({ muc, active, so, soTutor, bang }: { muc: KhuVucMuc; active: boolean; so: SoBadge; soTutor: SoBadge; bang?: boolean }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined} data-hd={bang ? undefined : `nav-${muc.key}`} tabIndex={bang ? -1 : undefined}
      className={lopNav(active)}>
      {muc.label}{muc.key === 'cong-viec' && <SoCho so={so} />}{muc.key === 'tutor' && <SoCho so={soTutor} />}
    </Link>
  );
}

/** Số của nút "Thêm": số của mục bị gom (Công việc trước, rồi Tutor). */
const soCuaThem = (them: readonly KhuVucMuc[], so: SoBadge, soTutor: SoBadge): SoBadge =>
  (them.some((m) => m.key === 'cong-viec') && so) || (them.some((m) => m.key === 'tutor') && soTutor) || null;
const mucThem = (them: readonly KhuVucMuc[], di: (to: string) => void, so: SoBadge, soTutor: SoBadge) => them.map((m) => {
  const n = m.key === 'cong-viec' ? so?.n : m.key === 'tutor' ? soTutor?.n : 0;
  return { key: m.key, nhan: n ? `${m.label} · ${n}` : m.label, onChon: () => di(m.to) };
});

/**
 * THANH TRÊN KHÔNG BỊ CẮT (KHUNG-LOI, A1-05): đo chỗ thật của khung menu (ResizeObserver — đúng cả khi zoom 125 %) và rộng từng mục (bản đo
 * vô hình); mục không vừa dồn từ cuối vào "Thêm ▾" (`chiaMucThanh`). Trước đây khung cuộn ngang ẩn: 1 280 px mất "Tutor", 1 100 px mất số Công việc.
 */
function ThanhTren({ items, dangO, so, soTutor }: { items: KhuVucMuc[]; dangO: KhuVuc | null; so: SoBadge; soTutor: SoBadge }) {
  const navigate = useNavigate();
  const khung = useRef<HTMLElement>(null);
  const bangDo = useRef<HTMLDivElement>(null);
  const [doDuoc, setDo] = useState<{ co: number; rong: number[]; them: number }>({ co: 0, rong: [], them: 0 });
  useLayoutEffect(() => {
    const el = khung.current;
    if (!el) return undefined;
    const doLai = () => {
      const con = [...(bangDo.current?.children ?? [])] as HTMLElement[];
      const r = con.map((c) => c.getBoundingClientRect().width + 4);   // + gap-1
      setDo({ co: el.clientWidth, rong: r.slice(0, -1), them: r.at(-1) ?? 0 });
    };
    doLai();
    const ro = new ResizeObserver(doLai);
    ro.observe(el);
    if (bangDo.current) ro.observe(bangDo.current);
    void document.fonts?.ready.then(doLai);   // phông tải xong → rộng chữ đổi
    return () => ro.disconnect();
  }, []);
  const { hien, them } = doDuoc.rong.length === items.length ? chiaMucThanh(items, doDuoc.rong, doDuoc.co, doDuoc.them) : { hien: items, them: [] };
  return (
    <nav ref={khung} aria-label={t('Điều hướng chính')} className="relative hidden md:flex flex-1 items-center gap-1 min-w-0 self-stretch">
      {hien.map((m) => <NavItem key={m.key} muc={m} active={dangO === m.key} so={so} soTutor={soTutor} />)}
      {them.length > 0 && (
        <MenuDong nhan={THEM} muc={mucThem(them, navigate, so, soTutor)} lopNut={lopNav(them.some((m) => m.key === dangO))}
          mat={<>{THEM} ▾<SoCho so={soCuaThem(them, so, soTutor)} /></>} />
      )}
      {/* Bản đo: khung 0 × 0 cắt tràn — không làm thanh "cuộn ngang"; con giữ rộng thật (`w-max`). */}
      <div aria-hidden {...{ inert: '' }} className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <div ref={bangDo} className="flex w-max">
          {items.map((m) => <NavItem key={m.key} muc={m} active={false} so={so} soTutor={soTutor} bang />)}
          <span className={lopNav(false)}>{THEM} ▾<SoCho so={soCuaThem(items, so, soTutor)} /></span>
        </div>
      </div>
    </nav>
  );
}

/** Biểu tượng nét mảnh 20 px của thanh dưới — đường vẽ chép từ mockup 23 màn C (`#i-home` … `#i-work`). */
const BIEU_TUONG: Record<KhuVuc, ReactNode> = {
  'tong-quan': <path d="M3.5 9.5 10 4l6.5 5.5M5 8.5V16h3.5v-4h3v4H15V8.5" />,
  'hoc-vien': <><circle cx="7.5" cy="7" r="2.6" /><path d="M2.8 16c.6-2.7 2.4-4.1 4.7-4.1s4.1 1.4 4.7 4.1" /><circle cx="14" cy="7.6" r="2" /><path d="M13.6 11.9c1.8 0 3.1 1.2 3.6 3.4" /></>,
  test: <><rect x="4.5" y="3.8" width="11" height="13" rx="1.6" /><path d="M8 3.8V3h4v.8M7.5 9h5M7.5 12.2h5" /></>,
  'cong-viec': <path d="m3.8 6.2 1.5 1.5L8 5M3.8 12.2l1.5 1.5L8 11M10.8 6.5h5.4M10.8 12.5h5.4" />,
  'phan-tich': <path d="M3.5 16.5h13M6 14v-4M10 14V6M14 14V8.5" />,
  tutor: <><circle cx="10" cy="6.5" r="2.8" /><path d="M4.5 16.5c.8-3.1 2.9-4.7 5.5-4.7s4.7 1.6 5.5 4.7M14.5 4.5l2-1M15.2 7h2.2" /></>,
};

/* Chữ 12 px (KHUNG-LOI, 04 "Thanh dưới 375"; trước 11,5). */
const lopDay = (active: boolean) => `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-xs no-underline ${
  active ? 'text-[color:var(--accent-strong)] font-semibold' : 'text-slate-400'
}`;

function NutDay({ muc, active, so, soTutor }: { muc: KhuVucMuc; active: boolean; so: SoBadge; soTutor: SoBadge }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined} title={muc.label} data-hd={`nav-${muc.key}`}
      className={`min-h-[56px] ${lopDay(active)}`}>
      {active && <span aria-hidden className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b bg-[color:var(--accent)]" />}
      <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {BIEU_TUONG[muc.key]}
      </svg>
      <span className="max-w-full truncate">{muc.labelNgan}</span>
      {(muc.key === 'cong-viec' || muc.key === 'tutor') && <SoCho so={muc.key === 'tutor' ? soTutor : so} className="absolute top-[5px] left-[calc(50%+5px)] ml-0" />}
    </Link>
  );
}
export default function App() {
  const { session, loading, reload, doiGocNhin } = useSession();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  useGhiNguon();   // PR-OV5b: nguồn của nút "‹ Quay lại" ở mọi hồ sơ
  useTieuDeTab(!!session?.authenticated);   // OV-11i (P1-3): tiêu đề tab theo màn
  /* HOTFIX-3: đã có dữ liệu mà tải lại nền lỗi → giữ bảng, báo nhỏ (một toast cho mọi khối). */
  useEffect(() => onLoiTaiLai(() => toast.push('error', t('Chưa tải lại được'), {
    key: 'tai-lai-loi', ms: 10_000, hanhDong: { nhan: t('Thử lại'), onBam: thuLaiNen },
  })), [toast]);
  /* OV-14a (F09): tải gặp 401 → hỏi lại phiên MỘT lần (nhiều khối cùng 401 không gọi chồng); hết thật thì về màn đăng nhập, ô đang gõ tự gửi lưu / giữ nháp. */
  const dangHoiPhien = useRef(false);
  useEffect(() => onHetPhien(() => {
    if (dangHoiPhien.current) return;
    dangHoiPhien.current = true;
    void reload().finally(() => { dangHoiPhien.current = false; });
  }), [reload]);
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
  const so: SoBadge = dem?.cho ? { n: dem.cho, quaHan: !!dem.quaHan, sr: t('{n} thẻ cần duyệt', { n: dem.cho }) + (dem.quaHan ? t(', {n} quá hạn', { n: dem.quaHan }) : '') + t(' · mọi chi nhánh') }   // SL2: badge cố ý khác phạm vi trang — ghi rõ
    : gv?.quaHan ? { n: gv.quaHan, quaHan: true, sr: t('{n} việc quá hạn', { n: gv.quaHan }) } : null;
  /* TU-b: "Tutor n" = số tutor Cần chú ý — chỉ Head tutor / Quản trị (`tutor.manage`); ghi nhận xét / gộp gọi `invalidate('/tutors')` nên số đổi ngay. */
  const demTutor = useApi<{ n: number }>(session?.authenticated && session.nav?.tutorSua ? '/tutors/dem' : null, [lanDem]).data;
  const soTutor: SoBadge = demTutor?.n ? { n: demTutor.n, quaHan: false, sr: t('{n} tutor cần chú ý', { n: demTutor.n }) } : null;

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
  const items = khuVucHienThi(nav, dem?.cho ?? 0);
  const dangO = khuVucCuaDuong(location.pathname);
  const duoi = chiaThanhDuoi(items);
  const banChinh = LA_BAN_CHINH || !!session.banChinh;
  const gocNhin = session.gocNhin;

  return (
    <div className="h-full flex flex-col">
      <a href="#noi-dung" onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[110] btn btn-sm">{t('Bỏ qua tới nội dung')}</a>
      {!banChinh && <div className="contents print:hidden"><DemoBar /></div>}
      {/* PR-PH: mất kết nối khi tải lại phiên KHÔNG phải đăng xuất — giữ nguyên màn, chỉ báo và cho thử lại. */}
      {session.loiKetNoi && (
        <div role="status" className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 sm:px-4 py-2 text-xs"
          style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))', color: 'rgb(var(--soon-rgb))' }}>
          <span>{t('Mất kết nối tới máy chủ — dữ liệu trên màn có thể chưa mới. Bạn vẫn đang đăng nhập.')}</span>
          <button type="button" className="btn btn-sm" disabled={dangThu} onClick={() => { void thuLai(); }}>{dangThu ? t('Đang thử…') : t('Thử lại')}</button>
        </div>
      )}
      {/* NEN-V5: thanh xanh màu logo (`.thanh-xanh`, token đổi tại chỗ) + logo PISA hồng; điện thoại cao 52 px. */}
      <header className="thanh-xanh relative shrink-0 print:hidden">
        <div className="flex items-center gap-3 px-3 sm:px-5 h-14 max-sm:h-[52px] max-sm:gap-0.5 max-sm:pl-4 max-sm:pr-1.5 min-w-0">
          <Link to="/" className="mr-3 flex shrink-0 items-center gap-2 no-underline max-sm:mr-1" aria-label={t('PISA — Tổng quan')}>
            <img src={logoPisa} alt="PISA" width={76} height={24} className="h-6 w-auto" />
            {!banChinh && <span className="hidden text-xs text-[color:var(--dieu-huong-chu)] lg:inline">{t('Bản demo nội bộ')}</span>}
          </Link>
          <ThanhTren items={items} dangO={dangO} so={so} soTutor={soTutor} />
          <div className="flex-1 min-w-0 md:hidden" />
          <Header />
        </div>
      </header>
      {/* PR-OV2a (mockup overhaul-3 §2): đang ở một góc nhìn → dải mỏng luôn nói vai + phạm vi, có lối về vai gốc. */}
      {gocNhin?.dangChon && (() => {
        const vai = gocNhin.coThe.find((v) => v.role === gocNhin.dangChon);
        const goc = gocNhin.coThe.find((v) => v.role === gocNhin.vaiGoc);
        return (
          <div role="status" className="shrink-0 flex items-center gap-x-2.5 gap-y-1 border-b px-4 sm:px-5 py-1.5 text-[13px] text-slate-300 min-w-0"
            style={{ borderColor: 'rgb(var(--muted-line-rgb))', background: 'rgb(var(--muted-bg-rgb))' }}>
            <b className="shrink-0 font-semibold" style={{ color: 'rgb(var(--muted-rgb))' }}>{t('Góc nhìn: {vai}', { vai: vai?.nhan ?? gocNhin.dangChon })}</b>
            {vai?.phamVi && <span className="hidden sm:inline min-w-0 truncate" title={vai.phamVi}>· {vai.phamVi}</span>}
            <span className="flex-1" />
            <button type="button" className="shrink-0 min-h-[32px] max-sm:min-h-[44px] border-0 bg-transparent p-0 text-[13px] cursor-pointer text-[color:var(--accent)] hover:underline"
              onClick={() => { doiGocNhin(null).catch((e) => toast.push('error', e instanceof Error ? e.message : t('Không đổi được góc nhìn.'))); }}>{t('Về {vai}', { vai: goc?.nhan ?? t('vai gốc') })}</button>
          </div>
        );
      })()}

      <main id="noi-dung" tabIndex={-1} className="relative flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5 max-md:scroll-pb-20 outline-none print:overflow-visible print:p-0" key={location.pathname.split('/')[1]}>
        <BatLoiTrang duong={location.pathname}>
        <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Skeleton rows={8} /></div>}>
        <Routes>
          {/* TU-a: Head tutor (chỉ có trang Tutor) mở `/` → `/tutor`. */}
          <Route path="/" element={nav.tutor && !nav.overview ? <Navigate to="/tutor" replace /> : <OverviewPage />} />
          <Route path="/tutor" element={nav.tutor ? <TutorPage /> : <Navigate to="/" replace />} />
          <Route path="/phan-tich" element={nav.analysis ? <PhanTichPage /> : <Navigate to="/" replace />} />
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
          <Route path="/huong-dan" element={<HuongDanPage />} />
          {ThanhPhanDemo && (
            <Route path="/dev/thanh-phan"
              element={<Suspense fallback={<Skeleton rows={6} />}><ThanhPhanDemo /></Suspense>} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </BatLoiTrang>
      </main>

      {/* Điện thoại: thanh dưới 4 nút (G-11). z-30 — dưới menu tài khoản/thông báo ở đầu trang (z-40), Drawer/Modal (z-50),
          menu ⋯ của dòng (z-[60]) và Toast (z-[100]). */}
      <KhoanhPhanTu />
      {/* KHUNG-LOI (A1-05): ≤ 5 nút — QL / QT: 4 + "Thêm" (Phân tích, Tutor); Head tutor (1 mục) không vẽ thanh. */}
      {duoi.hien.length > 0 && (
        <nav aria-label={t('Điều hướng chính')} className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t bg-[color:var(--surface)] print:hidden"
          style={{ borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {duoi.hien.map((m) => <NutDay key={m.key} muc={m} active={dangO === m.key} so={so} soTutor={soTutor} />)}
          {duoi.them.length > 0 && (
            <MenuDong nhan={THEM} muc={mucThem(duoi.them, navigate, so, soTutor)}
              lopNut={`min-h-[56px] ${lopDay(duoi.them.some((m) => m.key === dangO))} border-0 bg-transparent cursor-pointer`}
              mat={<>
                <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="4.5" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.5" cy="10" r="1.5" /></svg>
                <span className="max-w-full truncate">{THEM}</span>
                <SoCho so={soCuaThem(duoi.them, so, soTutor)} className="absolute top-[5px] left-[calc(50%+5px)] ml-0" />
              </>} />
          )}
        </nav>
      )}
    </div>
  );
}
