import { Suspense, useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { Info, LoiTaiNho } from '../../ui/ui.tsx';
import { CongTacGiaoDien } from '../../ui/CongTacGiaoDien.tsx';
import { NutNgonNgu } from '../../ui/NutNgonNgu.tsx';
import { lazyTai } from '../../lib/taiLaiManh.ts';
import { useDaXemHd } from '../huongDan/daXemHd.ts';
import { useManHinh } from '../../ui/TheDong.tsx';
import { buocDanhSach, chuanHoaMaLop, ngayTheoGioVN, nhanPhamVi, type DemYeuCau } from '@shared/domain/index.ts';
import { HopChuong, type ViecChuong } from './HopChuong.tsx';
export type { ViecChuong };
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { ToKhop } from '../../ui/ToKhop.tsx';

type SearchHit = { id: number; fullName: string; email: string | null; classCode: string | null; archived?: boolean; openCase?: { sos_level: number } | null };
type GvHit = { id: number; fullName: string };

/* TAI-NHANH-0611: nội dung Hướng dẫn (~90 KB chữ mọi vai) chỉ tải khi bấm nút "?" — không nằm trong gói chính. */
const PanelHuongDanManNay = lazyTai(() => import('../huongDan/NutHuongDan.tsx').then((m) => ({ default: m.PanelHuongDanManNay })));

/** Phím mở ô tìm: "/" (ngoài ô nhập) hoặc Ctrl / ⌘ K. */
const laPhimTim = (e: KeyboardEvent) => {
  if (document.querySelector('[aria-modal="true"]')) return false;   // hộp / panel phủ đang mở: không mở ô tìm sau lưng nó
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') return true;
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return false;
  const el = e.target as HTMLElement | null;
  return !(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
};

type LopRef = { id: number; code: string; student_count: number };

/** Thanh phải: tìm học viên + lớp (K1-43), thông báo, tài khoản. Không lặp lại điều hướng chính. */

export function Header({ viec, dem, so }: { viec: ViecChuong | null | undefined; dem: DemYeuCau | null | undefined; so: { n: number; quaHan: boolean; sr: string } | null }) {
  const { session, signOut, doiGocNhin } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState<null | 'account' | 'notif'>(null);
  /** OV-15a (C11): panel Hướng dẫn của màn đang đứng — mở từ menu Tài khoản, sống ngoài menu (menu đóng khi bấm). */
  const [moHd, setMoHd] = useState(false);
  const { chuaXem: chuaXemHd } = useDaXemHd();
  const [hits, setHits] = useState<SearchHit[]>([]);
  /** UI-CON-LAI k1: nhóm Giáo viên — chỉ vai xem được hồ sơ GV người khác (máy chủ lọc lại theo `phamViHoSoGv`). */
  const [gvs, setGvs] = useState<GvHit[]>([]);
  /** Câu của lượt tìm cuối đã trả về — khác câu đang gõ = đang chờ: không báo "Không thấy…", Enter không mở kết quả cũ. */
  const [daTim, setDaTim] = useState<string | null>(null);
  /** Danh sách kết quả đang hiện (bấm ra ngoài / Esc thì ẩn, gõ hoặc vào lại ô thì hiện). */
  const [moTim, setMoTim] = useState(false);
  /** Chỉ số dòng đang sáng khi đi bằng mũi tên, đếm chung học viên rồi lớp (−1 = chưa chọn). */
  const [dong, setDong] = useState(-1);
  /** Điện thoại (< 640 px, VN33): ô tìm là nút kính lúp; bấm thì ô mở neo hai mép ngay dưới thanh trên. */
  /* KHUNG-LOI (A1-05, 04 "Thanh trên"): dưới 1 440 px ô tìm cũng thu thành nút kính lúp — nhường chỗ cho 6 mục menu. */
  const timGon = useManHinh('(max-width: 1439px)');
  const [moTimDt, setMoTimDt] = useState(false);
  const nutTim = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const oTim = useRef<HTMLInputElement>(null);
  const nutThongBao = useRef<HTMLButtonElement>(null);
  const nutTaiKhoan = useRef<HTMLButtonElement>(null);
  const idDs = useId();
  const { homNay, nhan } = useNgayNghiepVu();
  const timGv = !!session?.nav?.analysis;
  const timDu = q.trim().length >= 2;
  /* Danh sách lớp trong phạm vi: đọc khi bắt đầu gõ tìm (TAI-NHANH: không đọc ở mỗi lần mở trang), useApi nhớ sẵn; lọc tại chỗ theo mã chuẩn hoá — gõ "ft101" ra MB FT 101. */
  const lopRef = useApi<LopRef[]>(timDu ? '/ref/classes' : null);
  const khoaLop = chuanHoaMaLop(q);
  const lops = timDu && khoaLop
    ? (lopRef.data ?? []).filter((l) => chuanHoaMaLop(l.code).includes(khoaLop)).slice(0, 4)
    : [];

  useEffect(() => {
    if (!timDu) { setHits([]); setGvs([]); setDong(-1); return; }
    const t = setTimeout(() => {
      const k = encodeURIComponent(q);
      Promise.all([
        api.get<{ rows: SearchHit[] }>(`/students?q=${k}`),
        timGv ? api.get<GvHit[]>(`/tim/giao-vien?q=${k}`).catch(() => [] as GvHit[]) : Promise.resolve([] as GvHit[]),
      ])
        .then(([d, g]) => { setHits((d.rows ?? []).slice(0, 6)); setGvs(g); setDaTim(q); setDong(-1); })
        .catch(() => { setHits([]); setGvs([]); setDaTim(null); setDong(-1); });
    }, 250);
    return () => clearTimeout(t);
  }, [q, timDu, timGv]);

  /* k1: "/" hoặc Ctrl K mở ô tìm từ mọi màn (màn hẹp: mở ô neo dưới thanh trên). */
  useEffect(() => {
    if (!session?.nav?.students) return undefined;
    const phim = (e: KeyboardEvent) => {
      if (!laPhimTim(e)) return;
      e.preventDefault();
      setOpenMenu(null);
      if (timGon) setMoTimDt(true);
      else { oTim.current?.focus(); oTim.current?.select(); setMoTim(true); }
    };
    document.addEventListener('keydown', phim);
    return () => document.removeEventListener('keydown', phim);
  }, [timGon, session?.nav?.students]);

  useBamNgoai(true, () => { setMoTim(false); setOpenMenu(null); setMoTimDt(false); }, boxRef);

  /* Một danh sách cho bàn phím: học viên trước, lớp sau. */
  const den = [...hits.map((h) => `/hoc-vien/${h.id}`), ...lops.map((l) => `/hoc-vien/lop/${l.id}`), ...gvs.map((g) => `/giao-vien/${g.id}`)];
  const coDs = moTim && timDu && den.length > 0;
  /* Danh sách lớp (`/ref/classes`) tải lần đầu chậm hơn lượt tìm học viên → chờ cả hai, không nháy "Không thấy" rồi mới ra lớp. */
  const khongThay = moTim && timDu && daTim === q && !lopRef.loading && den.length === 0;
  const dangMo = coDs || khongThay || openMenu !== null || moTimDt;

  /* Esc đóng menu/danh sách đang mở và trả focus về nút/ô đã mở nó — pha bắt + chặn lan (cùng mẫu MenuDong).
     CHỈ khi focus đang ở trong đầu trang: menu bỏ ngỏ không được giành Esc của panel/hộp thoại mở sau. */
  useEffect(() => {
    if (!dangMo) return undefined;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !boxRef.current?.contains(document.activeElement)) return;
      e.stopPropagation();
      e.preventDefault();
      const ve = openMenu === 'notif' ? nutThongBao.current : openMenu === 'account' ? nutTaiKhoan.current : moTimDt ? nutTim.current : oTim.current;
      setOpenMenu(null); setMoTim(false); setMoTimDt(false); setDong(-1);
      ve?.focus();
    };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [dangMo, openMenu, moTimDt]);

  const moMuc = (i: number) => { navigate(den[i]); setQ(''); setHits([]); setGvs([]); setDaTim(null); setMoTim(false); setMoTimDt(false); setDong(-1); };
  /** Thuộc tính chung của một dòng kết quả (học viên hay lớp) — `i` đếm chung cả hai nhóm. */
  const nutMuc = (i: number) => ({
    id: `${idDs}-${i}`,
    type: 'button' as const,
    role: 'option',
    'aria-selected': i === dong,
    tabIndex: -1,
    className: `w-full min-h-[44px] sm:min-h-0 text-left px-3 py-2 text-sm ${i === dong ? 'bg-white/5' : 'bam'}`,
    onMouseEnter: () => setDong(i),
    onMouseDown: (e: ReactMouseEvent) => e.preventDefault(),
    onClick: () => moMuc(i),
  });

  /* Chữ cái đầu của TÊN GỌI (chữ cuối của họ tên: "Nguyễn Khánh Vy" → V) cho vòng tròn tài khoản trên điện thoại. */
  const hoTen = session?.user?.fullName ?? '';
  const chuCaiDau = [...(hoTen.trim().split(/\s+/).pop() ?? '')][0]?.toUpperCase() ?? '';
  /** Danh sách kết quả: máy tính thả dưới ô; điện thoại nằm trong khung ô tìm đã neo hai mép. */
  const lopDs = timGon ? 'mt-1 w-full' : 'absolute z-40 mt-1 w-[min(28rem,calc(100vw-2rem))] right-0 shadow-2xl';

  const nhomTim = [
    { key: 'hv', ten: t('Học viên'), so: hits.length, dong: hits.map((h, i) => (
      <li key={`hv${h.id}`} role="none">
        <button {...nutMuc(i)}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate font-semibold text-slate-100"><ToKhop chu={h.fullName} q={q} /></span>
            {h.openCase?.sos_level ? <ChipSos muc={h.openCase.sos_level} hienKyNang={false} tinh /> : null}
            {/* NGHI-HOC-LUU-TRU: em Lưu trữ xếp cuối (máy chủ), ghi chữ "Lưu trữ" thay mã lớp — vẫn mở hồ sơ. */}
            {(h.archived || h.classCode) && <span className="ml-auto shrink-0 text-xs text-slate-500">{h.archived ? t('Lưu trữ') : h.classCode}</span>}
          </span>
        </button>
      </li>
    )) },
    { key: 'lop', ten: t('Lớp'), so: lops.length, dong: lops.map((l, j) => (
      <li key={`lop${l.id}`} role="none">
        <button {...nutMuc(hits.length + j)}>
          <span className="font-semibold text-slate-100">{l.code}</span>
          <span className="text-slate-500 text-xs ml-2 tabular-nums">· {t('{n} HV', { n: l.student_count })}</span>
        </button>
      </li>
    )) },
    ...(timGv ? [{ key: 'gv', ten: t('Giáo viên'), so: gvs.length, dong: gvs.map((g, k) => (
      <li key={`gv${g.id}`} role="none">
        <button {...nutMuc(hits.length + lops.length + k)}>
          <span className="font-semibold text-slate-100"><ToKhop chu={g.fullName} q={q} /></span>
        </button>
      </li>
    )) }] : []),
  ];

  const oTimVaKetQua = (
    <>
      <input
        ref={oTim}
        autoFocus={timGon}
        className={`field ${timGon ? '' : 'pr-14'}`}
        placeholder={timGv ? t('Tìm học viên, lớp, GV…') : t('Tìm học viên, lớp…')}
        value={q}
        onChange={(e) => { setQ(e.target.value); setMoTim(true); }}
        onFocus={() => setMoTim(true)}
        onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setMoTim(false); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ (như ô chọn người)
            if (!den.length) return;
            e.preventDefault();
            setMoTim(true);
            const k = buocDanhSach(den.length, dong, e.key);
            if (k !== null) setDong(k);
          } else if (e.key === 'Enter' && coDs && daTim === q) {
            e.preventDefault();
            moMuc(dong >= 0 && dong < den.length ? dong : 0);
          }
        }}
        role="combobox"
        aria-expanded={coDs}
        aria-controls={idDs}
        aria-activedescendant={coDs && dong >= 0 ? `${idDs}-${dong}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        aria-label={t('Tìm học viên, lớp trong phạm vi được cấp quyền')}
        aria-keyshortcuts="Control+K /"
      />
      {!timGon && !q && <kbd aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-500">Ctrl&nbsp;K</kbd>}
      {coDs && (
        <ul id={idDs} role="listbox" aria-label={t('Kết quả tìm học viên, lớp')}
          className={`${lopDs} card overflow-hidden list-none p-0 m-0`}>
          {/* k1: đầu nhóm có số; nhóm rỗng gom một dòng ("Lớp · 0 · Giáo viên · 0"). */}
          {nhomTim.filter((n) => n.so > 0).map((n) => (
            <li key={n.key} role="none" className="contents">
              <span aria-hidden className="block px-3 pt-2 pb-1 text-[12px] font-semibold text-slate-500">{n.ten} · <span className="tabular-nums">{n.so}</span></span>
              <ul role="none" className="list-none m-0 p-0">{n.dong}</ul>
            </li>
          ))}
          {nhomTim.some((n) => n.so === 0) && (
            <li role="none" aria-hidden className="px-3 pt-2 pb-2 text-[12px] font-semibold text-slate-500">
              {nhomTim.filter((n) => n.so === 0).map((n) => `${n.ten} · 0`).join(' · ')}
            </li>
          )}
          {!timGon && (
            <li role="none" aria-hidden className="flex flex-wrap justify-between gap-x-3 border-t px-3 py-1.5 text-[12px] text-slate-500" style={{ borderColor: 'var(--line)' }}>
              <span>{t('↑ ↓ chọn · Enter mở · Esc đóng')}</span><span>{t('Trong phạm vi bạn xem được')}</span>
            </li>
          )}
        </ul>
      )}
      {khongThay && (
        <div role="status" className={`${lopDs} card px-3 py-2 text-[13px] text-slate-400`}>
          {t('Không thấy “{q}” trong phạm vi của bạn.', { q: q.trim() })}{' '}
          <Link to={`/hoc-vien/luu-tru?q=${encodeURIComponent(q.trim())}`} className="link"
            onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); setMoTim(false); setMoTimDt(false); }}>{t('Tìm trong HV lưu trữ ›')}</Link>
        </div>
      )}
    </>
  );

  return (
    <div className="flex items-center gap-2 max-sm:gap-0.5 min-w-0" ref={boxRef}>
      {/* TU-b (đặc tả Tutor mục 4): không có quyền xem học viên (Head tutor) → không ô tìm học viên. */}
      {!session?.nav?.students ? null : timGon ? (
        <>
          <button ref={nutTim} type="button" data-hd="tim-hv" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center border-0 bg-transparent" aria-label={t('Tìm học viên, lớp')}
            aria-expanded={moTimDt} onClick={() => { setMoTimDt((v) => !v); setOpenMenu(null); }}>
            <svg aria-hidden width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
          </button>
          {moTimDt && <div className="card absolute inset-x-2 top-full z-40 mt-1 p-2 shadow-2xl sm:left-auto sm:w-[min(26rem,calc(100vw-2rem))]">{oTimVaKetQua}</div>}
        </>
      ) : (
        <div className="relative w-52 lg:w-64 shrink" data-hd="tim-hv">{oTimVaKetQua}</div>
      )}

      {/* HD-V2 (đặc tả 3.1, mockup v14 F0): "?" cạnh chuông, mọi trang mọi vai — chấm trắng tới lần mở đầu (không tự mở, không phím tắt). */}
      <button type="button" data-hd="nut-hd" title={t('Hướng dẫn')} aria-label={chuaXemHd ? t('Hướng dẫn, chưa mở lần nào') : t('Hướng dẫn')} aria-expanded={moHd}
        onClick={() => { setOpenMenu(null); setMoTimDt(false); setMoHd(true); }}
        className="btn btn-sm relative min-h-[44px] min-w-[44px] justify-center border-0 bg-transparent sm:min-h-[36px] sm:min-w-[36px] aria-expanded:bg-white/15">
        <span aria-hidden className="grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] border-current text-[13px] font-bold leading-none">?</span>
        {chuaXemHd && <span aria-hidden className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full sm:right-1.5 sm:top-1.5" style={{ background: 'var(--dieu-huong-chu-mo)', boxShadow: '0 0 0 2px var(--dieu-huong-nen)' }} />}
      </button>

      <div className="sm:relative">
        <button ref={nutThongBao} className="btn btn-sm relative min-h-[44px] min-w-[44px] justify-center border-0 bg-transparent sm:min-h-[36px] sm:min-w-[36px]"
          onClick={() => { setOpenMenu(openMenu === 'notif' ? null : 'notif'); setMoTimDt(false); }}
          aria-label={t('Thông báo') + (so ? `, ${so.sr}` : '')} aria-expanded={openMenu === 'notif'}>
          {/* UI-CON-LAI k4: chuông nét mảnh mọi bề rộng. */}
          <svg aria-hidden width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11L4 11ZM6.5 14a1.5 1.5 0 0 0 3 0" strokeLinejoin="round" /></svg>
          {/* CHUONG-V2 (chủ SP 11/11 "Dùng số chung"): số = badge Công việc (việc cần làm ngay); có quá hạn → cùng dáng đỏ của badge. */}
          {so && <span aria-hidden className={`cham-chuong${so.quaHan ? ' chv-qua' : ''}`}>{so.n > 99 ? '99+' : so.n}</span>}
        </button>
        {openMenu === 'notif' && <HopChuong viec={viec} dem={dem} onDong={() => setOpenMenu(null)} />}
      </div>

      {/* OV-15a (C11): Giao diện, Ngôn ngữ ở menu Tài khoản. HD-V2 thay C11 cho Hướng dẫn: nút "?" trên thanh, menu không còn mục Hướng dẫn. */}
      <div className="relative">
        <button ref={nutTaiKhoan} data-hd="tai-khoan" className="btn btn-sm max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:justify-center max-sm:border-0 max-sm:bg-transparent" onClick={() => { setOpenMenu(openMenu === 'account' ? null : 'account'); setMoTimDt(false); }}
          aria-label={t('Tài khoản {ten}', { ten: hoTen })} aria-expanded={openMenu === 'account'}>
          <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-full text-[13px] font-bold sm:hidden"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{chuCaiDau}</span>
          <span className="hidden max-w-[10rem] truncate text-slate-200 sm:inline">{hoTen}</span>
        </button>
        {openMenu === 'account' && (
          /* KHUNG-LOI (B-09): không cao quá màn — cuộn trong menu, "Đăng xuất" dính đáy (trước: trang cuộn, Đăng xuất ra ngoài màn ở 375). */
          <div role="dialog" aria-label={t('Tài khoản {ten}', { ten: hoTen })} className="absolute right-0 mt-1 w-[min(20rem,calc(100vw-2rem))] max-h-[70dvh] sm:max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain card p-3 pb-0 z-40 shadow-2xl">
            {/* U09 #6 (G3, mockup v11 khu F): tên · vai — khối GVCN + Kỹ năng được phân công đã sang Hồ sơ GV. */}
            <div className="text-[15px] font-bold text-slate-100">{session?.user?.fullName}</div>
            <div className="mb-3 text-[13px] text-dim">{session?.user?.title && dich(session.user.title)}</div>

            {/* PR-OV2a (mockup overhaul-3 §2): đổi góc nhìn — chỉ vai tài khoản đang nắm; chọn vai gốc = về làm việc bằng mọi vai. */}
            {session?.gocNhin && (
              <div role="group" aria-label={t('Góc nhìn')} className="mb-3 space-y-1">
                <div className="text-xs text-faint">{t('Góc nhìn')}</div>
                {session.gocNhin.coThe.map((v) => {
                  const g = session.gocNhin!;
                  const dangO = (g.dangChon ?? g.vaiGoc) === v.role;
                  /* Chủ SP 07/11: dòng Giáo viên gọn "{chi nhánh} · {n} lớp" (nhiều chi nhánh: "2 CN · 11 lớp"); dữ liệu đã nạp cùng phiên. */
                  const phamVi = v.soLop != null
                    ? [v.chiNhanh?.length ? (v.chiNhanh.length > 1 ? t('{n} CN', { n: v.chiNhanh.length }) : v.chiNhanh[0]) : null, t('{n} lớp', { n: v.soLop })].filter(Boolean).join(' · ')
                    : v.phamVi;
                  return (
                    <button key={v.role} type="button" aria-pressed={dangO}
                      onClick={() => { setOpenMenu(null); if (!dangO) void doiGocNhin(v.role === g.vaiGoc ? null : v.role).catch((e) => toast.push('error', e instanceof Error ? e.message : t('Không đổi được góc nhìn.'))); }}
                      className={`flex w-full min-h-[36px] max-sm:min-h-[44px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${dangO
                        ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] font-bold text-[color:var(--text)]'
                        : 'border-transparent font-medium text-slate-200 bam'}`}>
                      <span className="shrink-0">{dich(v.nhan)}</span>
                      <span className="min-w-0 truncate text-xs font-normal text-faint" title={phamVi}>{phamVi}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Một vai (không có Góc nhìn): phạm vi được cấp một dòng mỗi quyền; nhiều vai: phạm vi đã ghi ở từng dòng Góc nhìn. */}
            {!session?.gocNhin && (
              <>
                <div className="text-xs text-faint">{t('Phạm vi được cấp')}</div>
                <ul className="mb-3 mt-1 list-none space-y-1 p-0">
                  {/* OV-11b (QT-6): quyền cấp riêng có tên ("Cấp riêng: … · Monbay"), không mã "granted"; mọi grant cấp riêng cùng id -1 → key theo chỉ số. */}
                  {(session?.grants ?? []).map((g, i) => (
                    <li key={i} className="flex items-center gap-1 text-xs text-slate-300 [&>span]:whitespace-normal">
                      <Info>{nhanPhamVi(g)}</Info>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/*
              LỐI PHỤ. Điều hướng chính chỉ còn hai mục vì đó là hai việc thường ngày;
              những màn dưới đây mở thỉnh thoảng nên không cần chiếm chỗ trên thanh menu.
            */}
            <div className="border-t pt-2 mb-2 space-y-1" style={{ borderColor: 'var(--line)' }}>
              {/*
                "Tổng hợp theo tuần" và "Báo cáo tuần" ĐÃ RỜI THANH ĐIỀU HƯỚNG ở vòng 4.

                Bảng theo tuần nay là chế độ xem thứ hai của Thực trạng (mục 10.5), nên để
                thêm một lối vào riêng là hai cửa dẫn vào cùng một chỗ. Báo cáo tuần thì owner
                bỏ tạm (mục 12). Hai địa chỉ cũ vẫn mở được, chỉ không còn nút dẫn tới.
              */}
              {/* Hồ sơ cá nhân (mục 7.2) — ai cũng có, nên đứng trước lối vào quản trị. */}
              <Link to="/ho-so-ca-nhan" className="btn w-full justify-center no-underline"
                onClick={() => setOpenMenu(null)}>{t('Hồ sơ cá nhân')}</Link>
              {/* U09 (mockup v11 F): Hồ sơ cá nhân · Hồ sơ giáo viên · Quản trị (HD-V2: Hướng dẫn lên nút "?"). Hồ sơ giáo viên (PR-GV, G-12) — chỉ người có vai Giáo viên; không thuộc bốn khu vực. */}
              {session?.user && session.roles?.includes('teacher') && (
                <Link to={`/giao-vien/${session.user.id}`} className="btn w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>{t('Hồ sơ giáo viên')}</Link>
              )}
              {/* Chủ SP 07/11: "Đã xoá" không còn nút ở menu — là tab trong trang Quản trị (`/quan-tri?tab=da-xoa`, cùng cờ admin || bangQuyDoi). */}
              {session?.nav?.admin ? (
                <Link to="/quan-tri" className="btn w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>{t('Quản trị hệ thống')}</Link>
              ) : session?.nav?.bangQuyDoi && (
                /* BAND-QUY-DOI: Quản lý xem bảng quy đổi (chỉ đọc) — trang Quản trị chỉ có tab này. */
                /* QTV2-CAU-HINH: Quản lý xem cấu hình hệ thống (chương trình, chi nhánh, bảng quy đổi — chỉ đọc) + Đã xoá. */
                <Link to="/quan-tri" className="btn w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>{t('Cấu hình hệ thống')}</Link>
              )}
            </div>
            <div className="border-t pt-1 mb-2" style={{ borderColor: 'var(--line)' }}>
              <CongTacGiaoDien />
              <NutNgonNgu kieu="menu" />
            </div>
            <div className="sticky bottom-0 -mx-3 px-3 pb-3 pt-1" style={{ background: 'var(--surface)' }}>
              <button className="btn w-full justify-center" onClick={signOut}>{t('Đăng xuất')}</button>
            </div>
          </div>
        )}
      </div>
      {moHd && <Suspense fallback={null}><PanelHuongDanManNay onDong={() => setMoHd(false)} /></Suspense>}
    </div>
  );
}
