import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from './useBamNgoai.ts';

/**
 * ⓘ LUẬT — hộp nổi nhỏ neo dưới nút, thay cho một khối chữ giải thích dưới bảng (G-5).
 * Rc1 dựng đầu tiên cho lưới chấm (trang lưới cũ, nay là Lịch Test tuần); tách ra đây để Kế hoạch Test dùng lại.
 * Esc hoặc bấm ra ngoài thì đóng.
 */
export function NutLuat({ children, label = t('Luật'), phai = false }: {
  children: ReactNode; label?: string;
  /** UX-2 (6): neo mép phải (nút ở cột số căn phải của bảng) — hộp mở sang trái, không tràn khỏi bảng. */
  phai?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const hop = useRef<HTMLSpanElement>(null);
  const noi = useRef<HTMLSpanElement>(null);
  /* UI-HO-SO-HV-2 (critique 375): nút giữa hàng → hộp 22rem tràn mép màn; đo khi mở, lùi vào trong (cách mép 8 px). */
  useLayoutEffect(() => {
    const el = noi.current;
    if (!mo || !el) return;
    const r = el.getBoundingClientRect();
    const lech = r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : r.left < 8 ? 8 - r.left : 0;
    if (lech) el.style.transform = `translateX(${lech}px)`;
  }, [mo]);
  useBamNgoai(mo, () => setMo(false), hop);
  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo]);
  return (
    <span ref={hop} className="relative inline-flex">
      <button type="button" className="-m-[15px] p-[15px] text-slate-500 hover:text-slate-200 text-sm font-normal leading-none sm:m-0 sm:p-0"
        title={label} aria-label={label} aria-expanded={mo} onClick={() => setMo((v) => !v)}>ⓘ</button>
      {mo && (
        <span ref={noi} role="dialog" aria-label={label}
          className={`absolute ${phai ? 'right-0' : 'left-0'} top-full mt-2 z-30 w-[22rem] max-w-[calc(100vw-2rem)] surface-2 rounded-lg border shadow-xl p-3 space-y-2 text-left text-xs font-normal normal-case tracking-normal whitespace-normal text-slate-300 leading-relaxed`}
          style={{ borderColor: 'var(--line-strong)' }}>
          {children}
        </span>
      )}
    </span>
  );
}
