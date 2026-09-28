import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * ⓘ LUẬT — hộp nổi nhỏ neo dưới nút, thay cho một khối chữ giải thích dưới bảng (G-5).
 * Rc1 dựng đầu tiên cho lưới chấm (`ChamDiemPage`); tách ra đây để Kế hoạch Test dùng lại.
 * Esc hoặc bấm ra ngoài thì đóng.
 */
export function NutLuat({ children, label = 'Luật' }: { children: ReactNode; label?: string }) {
  const [mo, setMo] = useState(false);
  const hop = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!mo) return;
    const away = (e: MouseEvent) => { if (hop.current && !hop.current.contains(e.target as Node)) setMo(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [mo]);
  return (
    <span ref={hop} className="relative inline-flex">
      <button type="button" className="-m-[15px] p-[15px] text-slate-500 hover:text-slate-200 text-sm font-normal leading-none sm:m-0 sm:p-0"
        title={label} aria-label={label} aria-expanded={mo} onClick={() => setMo((v) => !v)}>ⓘ</button>
      {mo && (
        <span role="dialog" aria-label={label}
          className="absolute left-0 top-full mt-2 z-30 w-[22rem] max-w-[calc(100vw-2rem)] surface-2 rounded-lg border shadow-xl p-3 space-y-2 text-xs font-normal text-slate-300 leading-relaxed"
          style={{ borderColor: 'var(--line-strong)' }}>
          {children}
        </span>
      )}
    </span>
  );
}
