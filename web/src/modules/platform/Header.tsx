import { useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { Info, LoiTaiNho } from '../../ui/ui.tsx';
import { CongTacGiaoDien } from '../../ui/CongTacGiaoDien.tsx';
import { NutNgonNgu } from '../../ui/NutNgonNgu.tsx';
import { PanelHuongDanManNay } from '../huongDan/NutHuongDan.tsx';
import { useManHinh } from '../../ui/TheDong.tsx';
import { skillShort } from '../../lib/format.ts';
import { buocDanhSach, chuanHoaMaLop, dongChuong, duongThongBao, loaiHanThongBao, moDuocThongBao, ngayTheoGioVN, nhanPhamVi, noiDenThongBao, thoiGianThongBao } from '@shared/domain/index.ts';
import { Han } from '../../ui/Han.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { boDau } from '@shared/huongDan/index.ts';

type SearchHit = { id: number; fullName: string; email: string | null; classCode: string | null; openCase?: { sos_level: number } | null };
type GvHit = { id: number; fullName: string };

/** UI-CON-LAI k1: tô chữ khớp (không dấu, không hoa thường) bằng màu hồng nhận diện — chuỗi dựng sẵn NFC nên mỗi ký tự bỏ dấu vẫn là một ký tự. */
function ToKhop({ chu, q }: { chu: string; q: string }) {
  const kim = boDau(q.trim()).toLowerCase();
  const ky = [...chu];
  const rom = ky.map((c) => boDau(c).toLowerCase()).join('');
  /* Chuỗi NFD (dấu tách rời) làm lệch vị trí → không tô, vẫn hiện tên. */
  const i = kim && rom.length === ky.length ? rom.indexOf(kim) : -1;
  if (i < 0) return <>{chu}</>;
  return <>{ky.slice(0, i).join('')}<mark className="tim-khop">{ky.slice(i, i + kim.length).join('')}</mark>{ky.slice(i + kim.length).join('')}</>;
}

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
export function Header() {
  const { session, signOut, doiGocNhin } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState<null | 'account' | 'notif'>(null);
  /** OV-15a (C11): panel Hướng dẫn của màn đang đứng — mở từ menu Tài khoản, sống ngoài menu (menu đóng khi bấm). */
  const [moHd, setMoHd] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  /** UI-CON-LAI k1: nhóm Giáo viên — chỉ vai xem được hồ sơ GV người khác (máy chủ lọc lại theo `phamViHoSoGv`). */
  const [gvs, setGvs] = useState<GvHit[]>([]);
  /** Lượt tìm cuối đã trả về (để "Không tìm thấy…" không hiện khi đang chờ). */
  const [daTim, setDaTim] = useState(false);
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
  const notifications = useApi<any[]>('/notifications');
  const { homNay, nhan } = useNgayNghiepVu();
  /* Danh sách lớp trong phạm vi: đọc một lần (useApi nhớ sẵn), lọc tại chỗ theo mã chuẩn hoá — gõ "ft101" ra MB FT 101. */
  const lopRef = useApi<LopRef[]>('/ref/classes');
  const timGv = !!session?.nav?.analysis;
  const timDu = q.trim().length >= 2;
  const khoaLop = chuanHoaMaLop(q);
  const lops = timDu && khoaLop
    ? (lopRef.data ?? []).filter((l) => chuanHoaMaLop(l.code).includes(khoaLop)).slice(0, 4)
    : [];

  useEffect(() => {
    setDaTim(false);                                   // lượt mới: chưa trả về thì không báo "Không tìm thấy", Enter không mở kết quả cũ
    if (!timDu) { setHits([]); setGvs([]); setDong(-1); return; }
    const t = setTimeout(() => {
      const k = encodeURIComponent(q);
      Promise.all([
        api.get<{ rows: SearchHit[] }>(`/students?q=${k}`),
        timGv ? api.get<GvHit[]>(`/tim/giao-vien?q=${k}`).catch(() => [] as GvHit[]) : Promise.resolve([] as GvHit[]),
      ])
        .then(([d, g]) => { setHits((d.rows ?? []).slice(0, 6)); setGvs(g); setDaTim(true); setDong(-1); })
        .catch(() => { setHits([]); setGvs([]); setDaTim(false); setDong(-1); });
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
  const khongThay = moTim && timDu && daTim && den.length === 0;
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

  const moMuc = (i: number) => { navigate(den[i]); setQ(''); setHits([]); setGvs([]); setDaTim(false); setMoTim(false); setMoTimDt(false); setDong(-1); };
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

  /*
   * OV-11f (CA1-2, Q9): ở Góc nhìn khác vai gốc, chuông chỉ hiện thông báo vai đang chọn MỞ ĐƯỢC (`moDuocThongBao` theo `nav`); về vai gốc thấy lại.
   * Bấm thông báo không mở được thì không đánh dấu đọc (không mất nhắc việc).
   */
  const gn = session?.gocNhin;
  const gocKhac = !!gn?.dangChon && gn.dangChon !== gn.vaiGoc;
  const moDuoc = (n: any) => moDuocThongBao(n, session?.nav ?? {});
  const dsThongBao = useMemo(() => (notifications.data ?? []).filter((n) => !gocKhac || moDuocThongBao(n, session?.nav ?? {})), [notifications.data, gocKhac, session?.nav]);
  /* SL1 (chuông N1): hai nhóm Cần làm / Để biết (một Case một dòng). V5 SV-SO1 (brief 7): số trên nút = tin chưa đọc — số việc ở badge Công việc. */
  const chuong = useMemo(() => dongChuong(dsThongBao), [dsThongBao]);
  const unread = chuong.soNut;   // một số cho nút chuông và dòng "n chưa đọc" trong hộp
  /* OV-11f (TQ-15): chỉ lớp đang mở (`/ref/classes` = lớp đang hoạt động trong phạm vi) — lớp đã kết thúc không còn ở menu tài khoản. */
  const lopMo = lopRef.data ? new Set(lopRef.data.map((l) => l.id)) : null;
  const lopDangMo = (a: { classId: number }) => !lopMo || lopMo.has(a.classId);
  const core = (session?.assignments ?? []).filter((a) => a.isCore && lopDangMo(a));
  const skills = (session?.assignments ?? []).filter((a) => a.skill && lopDangMo(a));
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
            {h.classCode && <span className="ml-auto shrink-0 text-xs text-slate-500">{h.classCode}</span>}
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
          } else if (e.key === 'Enter' && coDs && daTim) {
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

      <div className="sm:relative">
        <button ref={nutThongBao} className="btn btn-sm relative min-h-[44px] min-w-[44px] justify-center border-0 bg-transparent sm:min-h-[36px] sm:min-w-[36px]"
          onClick={() => { if (openMenu !== 'notif') notifications.reload(); setOpenMenu(openMenu === 'notif' ? null : 'notif'); setMoTimDt(false); }}
          aria-label={t('Thông báo') + (chuong.soNut ? t(', {n} tin chưa đọc', { n: chuong.soNut }) : '')} aria-expanded={openMenu === 'notif'}>
          {/* UI-CON-LAI k4: chuông nét mảnh mọi bề rộng; số = tin CHƯA ĐỌC, chấm tròn nền trắng chữ xanh — khác dáng badge việc ở mục Công việc. */}
          <svg aria-hidden width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11L4 11ZM6.5 14a1.5 1.5 0 0 0 3 0" strokeLinejoin="round" /></svg>
          {chuong.soNut > 0 && <span aria-hidden className="cham-chuong">{chuong.soNut > 99 ? '99+' : chuong.soNut}</span>}
        </button>
        {openMenu === 'notif' && (
          /*
           * PR-VAI-a (mockup 23 màn D, T76, UX-D6): hai nhóm Cần làm / Để biết, giờ, dòng "bấm tới đâu", Đọc hết. Máy tính: thả dưới nút.
           * Điện thoại (< 640 px): neo HAI MÉP ngay dưới ĐÁY `<header>` (CSS: header `relative`, khung bọc nút chỉ `sm:relative`), cao tối đa 70 vh, cuộn trong — có DemoBar hay không đều đúng.
           */
          <div role="dialog" aria-label={t('Thông báo')}
            className="card absolute inset-x-2 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto shadow-2xl sm:inset-x-auto sm:right-0 sm:max-h-[32rem] sm:w-[min(26rem,calc(100vw-2rem))]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-3.5 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
              <h2 className="m-0 text-sm font-semibold text-slate-100">{t('Thông báo')} <span className="font-normal text-slate-500">· <span className="tabular-nums">{unread}</span> {t('chưa đọc')}</span></h2>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!unread}
                onClick={async () => {
                  /* Góc nhìn khác: chỉ đánh dấu những thông báo đang thấy (vai này mở được) — thông báo của vai gốc giữ chưa đọc. */
                  try {
                    if (gocKhac) {
                      /* Lô ≤ 20 yêu cầu song song (đường sẵn có `/notifications/:id/read`) — không dồn 40+ yêu cầu một lúc. */
                      const ids = dsThongBao.filter((n) => !n.read_at).map((n) => n.id);
                      for (let i = 0; i < ids.length; i += 20) await Promise.all(ids.slice(i, i + 20).map((id) => api.post(`/notifications/${id}/read`)));
                    }
                    else await api.post('/notifications/doc-het');
                    notifications.reload();
                  }
                  catch (e: any) { toast.push('error', e?.message || t('Chưa đánh dấu đã đọc được — thử lại.')); }
                }}>{t('Đánh dấu đã đọc')}</button>
            </div>
            {notifications.error ? <LoiTaiNho chu={t('Không tải được thông báo.')} onRetry={notifications.reload} />
              : dsThongBao.length === 0 && <div className="px-3.5 py-2.5 text-[13px] text-slate-500">{t('Chưa có thông báo mới')}</div>}
            {(['can-lam', 'de-biet'] as const).map((nhom) => {
              const ds = nhom === 'can-lam' ? chuong.canLam : chuong.deBiet;
              if (!ds.length) return null;
              return (
                <div key={nhom}>
                  <div className="flex items-baseline gap-2 border-b px-3.5 py-1.5 text-xs font-semibold text-slate-400"
                    style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                    {nhom === 'can-lam' ? t('Cần làm') : t('Để biết')} <span className="tabular-nums">{ds.length}</span>
                  </div>
                  {ds.map((n) => {
                    const toi = noiDenThongBao(n);
                    return (
                      <button key={n.id} type="button"
                        className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 border-b px-3.5 py-2.5 text-left bam"
                        style={{ borderColor: 'var(--line)' }}
                        onClick={async () => {
                          if (!moDuoc(n)) { toast.push('error', t('Mở ở vai gốc (đổi Góc nhìn trong menu tài khoản).')); return; }
                          await api.post(`/notifications/${n.id}/read`);
                          notifications.reload();
                          /* Mỗi loại thông báo về đúng chỗ làm được việc của nó (R8, Q12) — một quy ước duy nhất. */
                          const den = duongThongBao(n);
                          if (den) navigate(den);
                          setOpenMenu(null);
                        }}>
                        <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 rounded-full ${n.read_at ? '' : 'bg-[color:var(--accent)]'}`} />
                        <span className={`text-[13px] leading-snug text-slate-100 ${n.read_at ? 'font-normal' : 'font-semibold'}`}>
                          {!n.read_at && <span className="sr-only">{t('Chưa đọc: ')}</span>}{dich(n.title)}
                        </span>
                        <time className="whitespace-nowrap pt-px text-xs tabular-nums text-slate-500" title={nhan(homNay, n.created_at)}>{thoiGianThongBao(n.created_at, homNay)}</time>
                        {n.body && <span className="col-start-2 text-xs text-slate-400">{dich(n.body)}</span>}
                        {nhom === 'can-lam' && n.han && <span className="col-start-2 text-xs"><Han loai={loaiHanThongBao(n)} han={n.han} /></span>}
                        {toi && (
                          <span className="col-start-2 inline-flex items-center gap-1 text-xs text-[color:var(--accent)]">
                            {toi}
                            <svg aria-hidden width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OV-15a (C11, mockup OV-14 1 §2a): thanh trên chỉ còn Tìm · Thông báo · Tài khoản — Hướng dẫn, Giao diện, Ngôn ngữ ở menu Tài khoản. */}
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
            <div className="text-sm font-medium text-slate-100">{session?.user?.fullName}</div>
            <div className="text-xs text-slate-500 mb-3">{session?.user?.title && dich(session.user.title)}</div>

            {/* PR-OV2a (mockup overhaul-3 §2): đổi góc nhìn — chỉ vai tài khoản đang nắm; chọn vai gốc = về làm việc bằng mọi vai. */}
            {session?.gocNhin && (
              <div role="group" aria-label={t('Góc nhìn')} className="mb-3 space-y-1">
                <div className="label">{t('Góc nhìn')}</div>
                {session.gocNhin.coThe.map((v) => {
                  const g = session.gocNhin!;
                  const dangO = (g.dangChon ?? g.vaiGoc) === v.role;
                  return (
                    <button key={v.role} type="button" aria-pressed={dangO}
                      onClick={() => { setOpenMenu(null); if (!dangO) void doiGocNhin(v.role === g.vaiGoc ? null : v.role).catch((e) => toast.push('error', e instanceof Error ? e.message : t('Không đổi được góc nhìn.'))); }}
                      className={`flex w-full min-h-[40px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-sm ${dangO
                        ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] font-medium'
                        : 'border-transparent text-slate-200 bam'}`}>
                      <span className="shrink-0">{dich(v.nhan)}</span>
                      <span className="min-w-0 truncate text-xs font-normal text-slate-500" title={v.phamVi}>· {v.phamVi}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="label">{t('Phạm vi được cấp')}</div>
            <ul className="space-y-1 mb-3 list-none p-0">
              {/* OV-11b (QT-6): quyền cấp riêng có tên ("Cấp riêng: … · Monbay"), không mã "granted"; mọi grant cấp riêng cùng id -1 → key theo chỉ số. */}
              {(session?.grants ?? []).map((g, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-center gap-1 [&>span]:whitespace-normal">
                  <Info>{nhanPhamVi(g)}</Info>
                </li>
              ))}
            </ul>

            {core.length > 0 && (
              <>
                <div className="label">{t('GVCN')}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {core.map((c) => <Info key={c.classId}>{t('GVCN {lop}', { lop: c.classCode ?? '' })}</Info>)}
                </div>
              </>
            )}
            {skills.length > 0 && (
              <>
                <div className="label">{t('Kỹ năng được phân công')}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {skills.map((c, i) => (
                    <Info key={i}>{c.classCode} · {c.nhanMon ? dich(c.nhanMon) : skillShort(c.skill!)}</Info>
                  ))}
                </div>
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
              <Link to="/ho-so-ca-nhan" className="btn btn-sm w-full justify-center no-underline"
                onClick={() => setOpenMenu(null)}>{t('Hồ sơ cá nhân')}</Link>
              {/* Hướng dẫn của màn đang đứng (panel, không chuyển trang); trang Hướng dẫn đầy đủ ở cuối panel. */}
              <button type="button" className="btn btn-sm w-full justify-center" onClick={() => { setOpenMenu(null); setMoHd(true); }}>{t('Hướng dẫn')}</button>
              {/* Hồ sơ giáo viên (PR-GV, G-12) — chỉ người có vai Giáo viên; không thuộc bốn khu vực. */}
              {session?.user && session.roles?.includes('teacher') && (
                <Link to={`/giao-vien/${session.user.id}`} className="btn btn-sm w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>{t('Hồ sơ giáo viên')}</Link>
              )}
              {session?.nav?.admin && (
                <Link to="/quan-tri" className="btn btn-sm w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>{t('Quản trị hệ thống')}</Link>
              )}
            </div>
            <div className="border-t pt-1 mb-2" style={{ borderColor: 'var(--line)' }}>
              <CongTacGiaoDien />
              <NutNgonNgu kieu="menu" />
            </div>
            <div className="sticky bottom-0 -mx-3 px-3 pb-3 pt-1" style={{ background: 'var(--surface)' }}>
              <button className="btn btn-sm w-full justify-center" onClick={signOut}>{t('Đăng xuất')}</button>
            </div>
          </div>
        )}
      </div>
      {moHd && <PanelHuongDanManNay onDong={() => setMoHd(false)} />}
    </div>
  );
}
