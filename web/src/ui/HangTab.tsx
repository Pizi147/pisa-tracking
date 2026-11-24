/**
 * HÀNG TAB GẠCH CHÂN — MỘT thanh tab cho toàn web (GD-4c, mockup `thiet-ke/v21/bang-mau.html` H1, `bang-mau-ghi-chu.md` mục 3 R5.9): tab trang, tab hạng mục
 * Công việc và tab con trong khối / panel cùng một dáng (chữ 14 / 600) — tab con phân biệt bằng chỗ đặt, không cỡ chữ riêng (XM-13). Badge viên tròn:
 * đỏ = việc của tôi quá hạn, vàng = hôm nay, mờ = chỉ đếm. Số đếm và chấm vàng ● nằm ngay trên nhãn (A5): nhìn là biết bên nào có việc.
 *
 * Trên 375px hàng tab cuộn ngang BÊN TRONG chính nó (`overflow-x-auto`) — không đẩy cả trang cuộn ngang.
 * PR-KHUNG G5: dưới 640px mép phải mờ + đệm pr-8 (cùng mẫu bộ lọc Học viên & Lớp) — biết là còn tab để vuốt.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BadgeMo, BadgeTabSo, CHIP_TRON } from './Nhan.tsx';
import type { BadgeTab } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/* OV-15d (C03): chấm ● = tab có việc cần xử lý (hồ sơ HV › Ý thức) — không còn "Đã nhắc" (Nhắc thủ công đã bỏ). */
const CAN_XU_LY = t('Cần xử lý');

/** `so` = badge MỜ chỉ đếm; `badge` = badge việc của tôi (đỏ quá hạn · vàng hôm nay · Chấm Speaking: đỏ khi có bài quá hạn, không thì mờ — `BadgeTabSo`); `ngan` = tên ngắn ở 375. */
export type HangTabMuc<K extends string> = { key: K; label: string; ngan?: string; so?: number | null; badge?: BadgeTab | null; canhBao?: boolean;
  /** BAO-CAO-PH (mockup v15 t1, e1): chip nhẹ sau nhãn — "Tháng 11 · hạn 30/11"; `xau` = quá hạn (đỏ; chữ `chu` đã nói "quá hạn" — V22 không biểu tượng). */
  chip?: { chu: string; xau?: boolean } | null;
  /** Phần phụ mờ sau badge (sổ nghĩa vụ: "+n" bài S chéo chung). */
  phu?: ReactNode };

/** TAB-A11Y: ← → Home End chuyển FOCUS giữa các tab (WAI-ARIA tablist, kích hoạt bằng Enter / Space như nút thường). Dùng cho mọi `role="tablist"`. */
export function phimHangTab(e: KeyboardEvent<HTMLElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const ds = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)'));
  const i = ds.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  ds[e.key === 'Home' ? 0 : e.key === 'End' ? ds.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ds.length) % ds.length].focus();
}

const matMep = (m: { t: boolean; p: boolean }) =>
  `linear-gradient(to right, ${m.t ? 'transparent 0, #000 2rem' : '#000 0'}, ${m.p ? '#000 calc(100% - 2rem), transparent 100%' : '#000 100%'})`;

export function HangTab<K extends string>({ tabs, value, onChange, ariaLabel, panelId, className = '', thuGon = false }: {
  /** TAB-A11Y: id của vùng nội dung (`role="tabpanel"`) mà hàng tab điều khiển → `aria-controls`. Không truyền = trang chưa có vùng riêng. */
  panelId?: string;
  tabs: readonly HangTabMuc<K>[]; value: K; onChange: (k: K) => void; ariaLabel: string;
  /** Lề âm hết bề ngang khối cha (tab hạng mục Công việc, mockup `.tabs` margin 0 -24px); tab con trong khối / panel không truyền (`.tabs.trong`). */
  className?: string;
  /** HAI-BEN (chủ SP 25/11): hàng hẹp (Công việc khi panel mở) — tab không vừa dồn vào "Thêm ▾" (cuối hàng), KHÔNG cắt chữ giữa chừng, KHÔNG cuộn. */
  thuGon?: boolean;
}) {
  const hang = useRef<HTMLDivElement>(null);
  const [an, setAn] = useState<ReadonlySet<string>>(new Set());
  const [moThem, setMoThem] = useState(false);
  /** Lề trái nút "Thêm ▾" = mép phải tab còn hiện cuối cùng + 4 px (nút nằm ngay sau tab, không trôi sát mép phải hàng để hở khoảng trống ở giữa). */
  const [traiThem, setTraiThem] = useState<number | null>(null);
  const nutThem = useRef<HTMLButtonElement>(null);
  const menuThem = useRef<HTMLUListElement>(null);
  const [viTriThem, setViTriThem] = useState<{ top: number; right: number } | null>(null);
  /* Menu "Thêm": Esc hoặc bấm ra ngoài thì đóng (bàn phím + chuột cùng có lối ra). */
  useEffect(() => {
    if (!moThem) return undefined;
    const dong = (e: Event) => { if (!hang.current?.contains(e.target as Node) && !menuThem.current?.contains(e.target as Node)) setMoThem(false); };
    /* Esc chỉ đóng menu (không lan sang panel bên dưới), focus về nút "Thêm". */
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setMoThem(false); nutThem.current?.focus(); } };
    document.addEventListener('keydown', esc, true);
    document.addEventListener('pointerdown', dong);
    return () => { document.removeEventListener('keydown', esc, true); document.removeEventListener('pointerdown', dong); };
  }, [moThem]);
  /* Badge "Thêm": cộng số các tab trong menu — cùng nghĩa số từng tab (Chấm Speaking: bài quá hạn hoặc tổng bài). Đỏ khi có tab quá hạn, vàng khi hạn hôm nay, còn lại mờ. */
  const soThem = tabs.filter((x) => an.has(x.key)).reduce((a, x) => {
    const b = x.badge;
    return { so: a.so + (b ? (b.bai ? b.bai.quaHan || b.bai.n : b.so) : 0) + (x.so ?? 0), quaHan: a.quaHan + (b ? b.quaHan + (b.bai?.quaHan ?? 0) : 0), homNay: a.homNay + (b?.homNay ?? 0) };
  }, { so: 0, quaHan: 0, homNay: 0 });
  const khoaTab = tabs.map((x) => `${x.key}${x.so ?? ''}${x.badge?.so ?? ''}`).join('|');
  useLayoutEffect(() => {
    const h = hang.current;
    if (!thuGon || !h) { setAn((a) => (a.size ? new Set() : a)); return undefined; }
    const tinh = () => {
      const nut = Array.from(h.querySelectorAll<HTMLElement>('[role="tab"]'));
      const goc = h.getBoundingClientRect().left;
      /* ỔN ĐỊNH (chủ SP 25/11): thanh cuộn của <main> hiện / ẩn theo độ dài danh sách từng tab → bề rộng hàng đổi 10 px → tab "Ý thức" lúc có lúc không.
         Luôn tính như đang CÓ thanh cuộn: bề rộng chỉ đổi theo cửa sổ + panel, không theo tab chọn. */
      const sc = h.closest('main');
      const rong = h.clientWidth - (sc && sc.offsetWidth === sc.clientWidth ? 10 : 0);   // ponytail: 10 = bề rộng ::-webkit-scrollbar (index.css), Firefox khác vài px
      const het = nut.length ? nut[nut.length - 1].getBoundingClientRect().right - goc : 0;
      const gioiHan = het <= rong ? rong : rong - 124;   // 124 = nút "Thêm ▾" + badge (chỗ dành sẵn, có badge hay không cũng vậy)
      const ra = new Set(nut.filter((n) => n.getBoundingClientRect().right - goc > gioiHan).map((n) => n.dataset.tab!));
      setAn((a) => (a.size === ra.size && [...ra].every((k) => a.has(k)) ? a : ra));
      const conHien = nut.filter((n) => !ra.has(n.dataset.tab!));
      const cuoi = conHien.length ? Math.round(conHien[conHien.length - 1].getBoundingClientRect().right - goc) + 4 : null;
      setTraiThem((x) => (x === cuoi ? x : cuoi));
    };
    tinh();
    const ro = new ResizeObserver(tinh);
    ro.observe(h);
    return () => ro.disconnect();
  }, [thuGon, khoaTab]);   // eslint-disable-line react-hooks/exhaustive-deps -- tinh chỉ đọc ref
  /* PTA rà #1690: hàng tab tràn (375) mờ MÉP còn tab — trái khi đã cuộn qua tab đầu, phải khi còn tab sau — để không tưởng mất tab. Đệm phải 32 px
     (chỗ cho vùng mờ phải) chỉ khi còn tab bên phải: cuộn tới cuối thì tab đầu còn ló dưới vùng mờ trái. */
  const [mep, setMep] = useState({ t: false, p: false });
  const doMep = () => {
    const h = hang.current;
    if (!h) return;
    const t = h.scrollLeft > 1, p = h.scrollLeft + h.clientWidth < h.scrollWidth - 1;
    setMep((m) => (m.t === t && m.p === p ? m : { t, p }));
  };
  /* NHẸ HƠN: hàng tab đổi bề rộng mà không đổi tab (panel Công việc mở → đầu trang vào cột trái, đổi cỡ cửa sổ) → tính lại mép mờ. */
  useEffect(() => {
    const h = hang.current;
    if (!h || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(doMep);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- doMep chỉ đọc ref
  /* Không tab nào chọn (Hướng dẫn đang tìm): tab đầu nhận focus Tab — tablist luôn vào được bằng bàn phím. */
  const coChon = tabs.some((x) => x.key === value);
  /* Mở trang với tab ở cuối hàng (ví dụ `?tab=y-thuc`) thì tab đang chọn tự cuộn vào giữa hàng, không bị khuất. Chỉ đặt
     scrollLeft của CHÍNH hàng tab: `scrollIntoView` kéo cả <main> xuống hàng tab (Hồ sơ HV 375 vừa mở không đứng đầu trang). */
  useEffect(() => {
    const tab = hang.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    const h = hang.current;
    if (!tab || !h) return;
    /* getBoundingClientRect, không `offsetLeft`: hàng tab không phải offsetParent của nút nên offsetLeft tính từ tổ tiên khác. */
    const lech = tab.getBoundingClientRect().left - h.getBoundingClientRect().left;
    h.scrollLeft = Math.max(0, h.scrollLeft + lech - (h.clientWidth - tab.offsetWidth) / 2);
    doMep();
  }, [value, tabs.map((x) => `${x.key}${x.so ?? ''}${x.badge?.so ?? ''}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps -- số tab về sau làm tab rộng ra → canh lại
  return (
    /* `relative`: chữ `sr-only` (absolute) của badge bám vào hàng tab, không kéo <main> trượt ngang ở 375 (RA-GD-0711). */
    <div ref={hang} role="tablist" aria-label={ariaLabel} onKeyDown={phimHangTab} onScroll={doMep}
      className={`relative flex gap-1 border-b max-sm:[scrollbar-width:none] ${thuGon ? 'overflow-x-clip overflow-y-visible' : 'overflow-x-auto overflow-y-hidden'} ${mep.p ? 'max-sm:pr-8' : ''} ${className}`}
      style={{ borderColor: 'var(--line)', ...(mep.t || mep.p ? { maskImage: matMep(mep), WebkitMaskImage: matMep(mep) } : {}) }}>
      {tabs.map((t, i) => {
        const active = t.key === value;
        return (
          /* GD-4c (mockup v21 H1 `.tab`): MỘT dáng — 14 / 600 mọi trạng thái, chọn = chữ chính + gạch 2 px nhấn; 1440 đệm 11 14 12, 375 đệm 12 10, cao ≥ 44. */
          <button key={t.key} type="button" role="tab" data-tab={t.key} aria-selected={active} aria-controls={panelId} tabIndex={active || (i === 0 && !coChon) ? 0 : -1} aria-hidden={an.has(t.key) || undefined} onClick={() => onChange(t.key)}
            className={`-mb-px inline-flex min-h-[44px] shrink-0 cursor-pointer appearance-none items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-2.5 py-3 text-sm font-semibold sm:px-3.5 sm:pb-3 sm:pt-[11px] ${an.has(t.key) ? 'invisible pointer-events-none ' : ''}${
              active ? 'border-[color:var(--accent)] text-[color:var(--text)]' : 'border-transparent text-dim hover:text-[color:var(--text)]'}`}>
            {/* A3-18: nhãn đủ vẫn là tên truy cập (sr-only ở 375), chỉ nhãn ngắn hiện. */}
            {t.ngan ? <><span aria-hidden className="sm:hidden">{t.ngan}</span><span className="max-sm:sr-only">{t.label}</span></> : t.label}
            {t.canhBao && <span className="text-soon" role="img" aria-label={CAN_XU_LY} title={CAN_XU_LY}>●</span>}
            {t.chip && (
              <span className={`${CHIP_TRON} !font-medium tabular-nums ${t.chip.xau ? 'bg-late-bg text-late' : 'surface-2 text-slate-400'}`}>{t.chip.chu}</span>
            )}
            {t.badge && <BadgeTabSo b={t.badge} />}
            {/* Badge mờ = chỉ đếm (lời 35: chỉ số, không đơn vị); 0 → không vẽ. */}
            {!!t.so && t.so > 0 && <BadgeMo so={t.so} />}
            {t.phu}
          </button>
        );
      })}
      {thuGon && an.size > 0 && (
        /* Không vòng focus: hàng tab cắt (overflow-x-clip) nên vòng chỉ lộ MÉP TRÁI thành một sọc (chủ SP 25/11); focus bàn phím = nền nhấn như mục menu. */
        <span className={`absolute inset-y-0 flex items-stretch ${traiThem == null ? 'right-0' : ''}`} style={{ background: 'var(--bg)', ...(traiThem == null ? {} : { left: traiThem }) }}>
          <button type="button" aria-haspopup="menu" aria-expanded={moThem} ref={nutThem} onClick={() => { const r = nutThem.current?.getBoundingClientRect(); if (r) setViTriThem({ top: r.bottom + 4, right: window.innerWidth - r.right }); setMoThem(!moThem); }}
            className={`-mb-px inline-flex min-h-[44px] cursor-pointer appearance-none items-center gap-1.5 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 text-sm font-semibold focus-visible:bg-[color:var(--accent-soft)] focus-visible:outline-none ${an.has(value) ? 'border-[color:var(--accent)] text-[color:var(--text)]' : 'border-transparent text-dim hover:text-[color:var(--text)]'}`}>
            {t('Thêm')}
            {soThem.so > 0 && (soThem.quaHan || soThem.homNay
              ? <BadgeTabSo b={{ so: soThem.so, n: soThem.so, quaHan: soThem.quaHan, homNay: soThem.homNay }} />
              : <BadgeMo so={soThem.so} />)}
            <span aria-hidden>▾</span>
          </button>
          {/* Menu qua portal ra <body>: danh sách (isolate) và panel 720 không che / cắt được. */}
          {moThem && viTriThem && createPortal(
            <ul ref={menuThem} role="menu" className="fixed z-[80] m-0 grid min-w-[200px] list-none gap-0.5 rounded-lg border p-1 shadow-lg" style={{ top: viTriThem.top, right: viTriThem.right, background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
              {tabs.filter((x) => an.has(x.key)).map((x) => (
                <li key={x.key} role="none">
                  <button type="button" role="menuitem" onClick={() => { setMoThem(false); onChange(x.key); }}
                    className={`flex min-h-[40px] w-full cursor-pointer appearance-none items-center gap-2 rounded-md border-0 bg-transparent px-3 text-left text-sm font-semibold hover:bg-[color:var(--accent-soft)] ${x.key === value ? 'bg-[color:var(--accent-soft)] text-[color:var(--text)]' : 'text-dim'}`} aria-current={x.key === value || undefined}>
                    {x.label}{x.badge && <BadgeTabSo b={x.badge} />}{!!x.so && x.so > 0 && <BadgeMo so={x.so} />}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )}
        </span>
      )}
    </div>
  );
}
