import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ChiChoToi } from '@shared/huongDan/index.ts';
import { ChuDam } from '../../ui/ui.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * HD-a — "CHỈ CHO TÔI" (mockup OV-13 §5b): mở đúng trang nếu cần, phủ tối, khoanh phần tử `data-hd` đang hiện + một dòng chú thích.
 * Bấm ra ngoài / Esc tắt; bấm trúng phần tử khoanh thì tắt và bấm luôn phần tử đó. Không thấy phần tử sau 8 s (trang chậm, Turso) → "Chưa có việc nào ở đây".
 */
let dang: ChiChoToi | null = null;
const nghe = new Set<() => void>();
export function chiChoToi(c: ChiChoToi | null) { dang = c; nghe.forEach((f) => f()); }
const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f); }; };

const thay = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
const VIEN = 6;

export function KhoanhPhanTu() {
  const chi = useSyncExternalStore(dangKy, () => dang);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [khung, setKhung] = useState<DOMRect | null>(null);
  const [khongThay, setKhongThay] = useState(false);
  const el = useRef<Element | null>(null);
  const chu = useRef<HTMLDivElement>(null);
  const tat = () => { el.current = null; setKhung(null); setKhongThay(false); chiChoToi(null); };

  /* Trang khác → mở trang đó trước (giữ đúng một bước lịch sử: Quay lại về trang vừa đứng). */
  useEffect(() => {
    if (chi?.duong && pathname !== chi.duong) navigate(chi.duong);
  }, [chi]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Đợi trang vẽ xong rồi tìm phần tử đang hiện (máy tính / điện thoại có thể là hai phần tử cùng `data-hd`). */
  useEffect(() => {
    if (!chi) return undefined;
    setKhung(null); setKhongThay(false);
    let lan = 0;
    let truoc = NaN;
    const id = window.setInterval(() => {
      const x = [...document.querySelectorAll([chi.hd].flat().map((h) => `[data-hd="${h}"]`).join(','))].find(thay);
      /* HD-CHI: đợi phần tử đứng yên một nhịp — khối phía trên còn tải (Yêu cầu của tôi trên "Lớp tôi dạy") sẽ đẩy nó ra ngoài màn sau khi cuộn. */
      const top = x ? x.getBoundingClientRect().top : NaN;
      const yen = top === truoc;
      truoc = top;
      if (x && yen) {
        window.clearInterval(id);
        el.current = x;
        x.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        requestAnimationFrame(() => setKhung(x.getBoundingClientRect()));
      } else if (++lan > 80) { window.clearInterval(id); setKhongThay(true); }
    }, 100);
    return () => window.clearInterval(id);
  }, [chi, pathname]);

  /* Cuộn / đổi cỡ: khoanh bám theo phần tử. */
  const coKhung = !!khung;
  useEffect(() => {
    if (!coKhung) return undefined;
    const cap = () => { if (el.current) setKhung(el.current.getBoundingClientRect()); };
    window.addEventListener('scroll', cap, true);
    window.addEventListener('resize', cap);
    return () => { window.removeEventListener('scroll', cap, true); window.removeEventListener('resize', cap); };
  }, [coKhung]);

  useEffect(() => {
    if (!chi) return undefined;
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tat(); } };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [chi]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (khung || khongThay) chu.current?.focus({ preventScroll: true }); }, [coKhung, khongThay]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!chi) return null;
  const k = khung && { top: khung.top - VIEN, left: khung.left - VIEN, width: khung.width + 2 * VIEN, height: khung.height + 2 * VIEN };
  /* Chú thích dưới phần tử nếu còn chỗ, không thì trên; điện thoại rộng hết hai mép 16 px. */
  const duoi = !k || k.top + k.height + 84 < window.innerHeight;
  const hep = window.innerWidth < 640;
  const viTri = !k ? { top: '40%', left: 16, right: 16, margin: '0 auto' }
    : { ...(duoi ? { top: k.top + k.height + 10 } : { bottom: window.innerHeight - k.top + 10 }),
      ...(hep ? { left: 16, right: 16 } : { left: Math.max(16, Math.min(k.left, window.innerWidth - 376)) }) };
  return (
    <div className="fixed inset-0 z-[95] print:hidden" data-chi-cho-toi=""
      onClick={(e) => {
        const trung = khung && e.clientX >= khung.left && e.clientX <= khung.right && e.clientY >= khung.top && e.clientY <= khung.bottom;
        const { clientX: x, clientY: y } = e;
        tat();
        if (trung) requestAnimationFrame(() => (document.elementFromPoint(x, y) as HTMLElement | null)?.click());
      }}>
      {/* Phủ tối = bốn khối quanh lỗ (cùng mức `bg-black/60` của panel) + viền nhấn quanh phần tử. */}
      {k ? (
        <>
          {[{ top: 0, left: 0, right: 0, height: Math.max(0, k.top) },
            { top: k.top + k.height, left: 0, right: 0, bottom: 0 },
            { top: k.top, height: k.height, left: 0, width: Math.max(0, k.left) },
            { top: k.top, height: k.height, left: k.left + k.width, right: 0 }].map((o, i) => <div key={i} aria-hidden className="fixed bg-black/60" style={o} />)}
          <div aria-hidden className="pointer-events-none fixed rounded-[10px] ring-[3px] ring-[color:var(--accent)]" style={k} />
        </>
      ) : <div aria-hidden className="fixed inset-0 bg-black/60" />}
      {(k || khongThay) && (
        <div ref={chu} tabIndex={-1} role="status" className="fixed flex max-w-[360px] items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[14px] text-slate-100 shadow-2xl outline-none"
          style={{ ...viTri, ...(hep ? { maxWidth: 'none' } : {}), background: 'var(--surface)', borderColor: 'var(--accent-line)' }}>
          <span className="min-w-0 flex-1"><ChuDam chu={k ? t(chi.chu) : t('Chưa có việc nào ở đây')} /></span>
          <span className="shrink-0 text-xs text-slate-500">Esc</span>
        </div>
      )}
    </div>
  );
}
