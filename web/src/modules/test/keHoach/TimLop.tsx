import { useEffect, useRef, useState } from 'react';
import { chuanHoaMaLop } from '@shared/domain/index.ts';
import type { LopKH } from './kieu.ts';

/**
 * Ô TÌM LỚP (mockup 14 (1), Q8): gõ → gợi ý tối đa 8 dòng `{mã} · {chi nhánh} · {n} HV` (↑↓ Enter chọn, Esc đóng), ✕ xoá.
 * Lọc PHÍA WEB trên danh sách lớp đã theo chi nhánh và quyền — không có route riêng. Chọn một lớp → chữ = mã lớp, mở lớp đó.
 */
export function TimLop({ lop, value, onChange, onChon, className = '' }: {
  lop: LopKH[]; value: string; onChange: (v: string) => void; onChon: (l: LopKH) => void; className?: string;
}) {
  const [mo, setMo] = useState(false);
  const [dong, setDong] = useState(0);
  const goc = useRef<HTMLDivElement>(null);
  const q = chuanHoaMaLop(value);
  const goiY = q ? lop.filter((l) => chuanHoaMaLop(l.code).includes(q)).slice(0, 8) : [];

  useEffect(() => {
    if (!mo) return;
    const away = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [mo]);
  useEffect(() => { setDong(0); }, [value]);

  const chon = (l: LopKH) => { onChon(l); setMo(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setMo(true); setDong((d) => Math.min(d + 1, goiY.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setDong((d) => Math.max(d - 1, 0)); }
    else if (e.key === 'Enter' && mo && goiY[dong]) { e.preventDefault(); chon(goiY[dong]); }
    else if (e.key === 'Escape' && mo) { e.stopPropagation(); setMo(false); }
  };

  return (
    <div ref={goc} className={`relative ${className}`}>
      <span className="label">Lớp</span>
      <div className="relative">
        <input className="field w-full pr-8" value={value} placeholder="Tìm lớp…" aria-label="Tìm lớp" role="combobox" aria-expanded={mo && goiY.length > 0}
          aria-controls="tim-lop-goi-y" aria-autocomplete="list"
          onChange={(e) => { onChange(e.target.value); setMo(true); }} onFocus={() => setMo(true)} onKeyDown={onKey} />
        {value && (
          <button type="button" aria-label="Xoá chữ tìm" title="Xoá"
            className="absolute right-1 top-1/2 min-h-[32px] min-w-[32px] -translate-y-1/2 appearance-none border-0 bg-transparent text-slate-500 hover:text-slate-200"
            onClick={() => { onChange(''); setMo(false); }}>✕</button>
        )}
      </div>
      {mo && goiY.length > 0 && (
        <ul id="tim-lop-goi-y" role="listbox" aria-label="Lớp gợi ý"
          className="surface-2 absolute left-0 top-full z-30 mt-1 max-h-72 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border p-1 shadow-xl"
          style={{ borderColor: 'var(--line-strong)' }}>
          {goiY.map((l, i) => (
            <li key={l.id} role="option" aria-selected={i === dong}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded px-2 text-xs sm:min-h-[32px] ${i === dong ? 'bg-white/10' : 'hover:bg-white/5'}`}
              onMouseDown={(e) => { e.preventDefault(); chon(l); }} onMouseEnter={() => setDong(i)}>
              <b className="text-slate-100">{l.code}</b>
              <span className="min-w-0 flex-1 truncate text-slate-400">{l.chiNhanh}</span>
              <span className="shrink-0 text-slate-500">{l.soHv} HV</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
