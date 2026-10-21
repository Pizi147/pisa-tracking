import { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api.ts';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../../ui/useBamNgoai.ts';

export type KetQuaTim = {
  lop: { id: number; code: string; loai: 'ft' | 'thuong'; chiNhanh: string; soHv: number; gvcn: string | null }[];
  hocVien: { studentId: number; ten: string; email: string | null; classId: number; classCode: string; loai: 'ft' | 'thuong' }[];
};
type Muc = { loai: 'lop'; x: KetQuaTim['lop'][number] } | { loai: 'hv'; x: KetQuaTim['hocVien'][number] };

/**
 * Ô "Tìm lớp, học viên hoặc email…" (OV-15c, C18 — mockup 4 khung 3): máy chủ tìm (`/ke-hoach-test/tim`: mã lớp, tên có / không dấu, email không
 * phân biệt hoa thường) sau 200 ms; kết quả chia **Lớp** / **Học viên** (tên · lớp · email để phân biệt trùng tên). ↑ ↓ chọn, Enter mở, Esc đóng.
 * Chọn lớp → mở lớp; chọn em → mở lớp của em + cuộn tới hàng em (nơi gọi lo).
 */
export function TimKeHoach({ branchId, value, onChange, onChonLop, onChonHv, className = '' }: {
  branchId: number | null; value: string; onChange: (v: string) => void;
  onChonLop: (l: KetQuaTim['lop'][number]) => void; onChonHv: (h: KetQuaTim['hocVien'][number]) => void; className?: string;
}) {
  const [mo, setMo] = useState(false);
  const [dong, setDong] = useState(0);
  const [kq, setKq] = useState<{ q: string; r: KetQuaTim } | null>(null);
  const [loi, setLoi] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const q = value.trim();

  useEffect(() => {
    if (!q) { setKq(null); return undefined; }
    let huy = false;
    const h = setTimeout(() => {
      api.get<KetQuaTim>(`/ke-hoach-test/tim?q=${encodeURIComponent(q)}${branchId ? `&branchId=${branchId}` : ''}`)
        .then((r) => { if (!huy) { setKq({ q, r }); setLoi(false); } })
        .catch(() => { if (!huy) setLoi(true); });
    }, 200);
    return () => { huy = true; clearTimeout(h); };
  }, [q, branchId]);
  useBamNgoai(mo, () => setMo(false), goc);
  useEffect(() => { setDong(0); }, [kq]);

  const r = kq?.q === q ? kq.r : null;
  const ds: Muc[] = r ? [...r.lop.map((x) => ({ loai: 'lop' as const, x })), ...r.hocVien.map((x) => ({ loai: 'hv' as const, x }))] : [];
  const chon = (m: Muc) => { if (m.loai === 'lop') onChonLop(m.x); else onChonHv(m.x); setMo(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setMo(true); setDong((d) => Math.min(d + 1, ds.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setDong((d) => Math.max(d - 1, 0)); }
    else if (e.key === 'Enter' && mo && ds[dong]) { e.preventDefault(); chon(ds[dong]); }
    else if (e.key === 'Escape' && mo) { e.stopPropagation(); setMo(false); }
  };
  const dongCls = (i: number) => `flex min-h-[44px] cursor-pointer flex-col justify-center rounded px-2 text-xs sm:min-h-[36px] ${i === dong ? 'bg-white/10' : 'bam'}`;
  const nhom = 'px-2 pb-0.5 pt-1.5 text-[12px] font-bold text-slate-400';

  return (
    <div ref={goc} className={`relative ${className}`}>
      <div className="relative">
        <input className="field w-full pr-8" value={value} placeholder={t('Tìm lớp, học viên hoặc email…')} aria-label={t('Tìm lớp, học viên hoặc email')}
          role="combobox" aria-expanded={mo && !!q} aria-controls="tim-kht-goi-y" aria-autocomplete="list"
          aria-activedescendant={mo && ds[dong] ? `tim-kht-${dong}` : undefined}
          onChange={(e) => { onChange(e.target.value); setMo(true); }} onFocus={() => setMo(true)} onKeyDown={onKey} />
        {value && (
          <button type="button" aria-label={t('Xoá chữ tìm')} title={t('Xoá')}
            className="absolute right-1 top-1/2 min-h-[32px] min-w-[32px] -translate-y-1/2 appearance-none border-0 bg-transparent text-slate-500 hover:text-slate-200"
            onClick={() => { onChange(''); setMo(false); }}>✕</button>
        )}
      </div>
      {mo && q && (
        <div id="tim-kht-goi-y" role="listbox" aria-label={t('Kết quả tìm')}
          className="surface-2 absolute left-0 top-full z-30 mt-1 max-h-80 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border p-1 shadow-xl"
          style={{ borderColor: 'var(--line-strong)' }}>
          {loi ? <p className="m-0 p-2 text-xs text-bad">{t('Chưa tìm được — thử lại.')}</p>
            : !r ? <p className="m-0 p-2 text-xs text-slate-400">{t('Đang tìm…')}</p>
              : !ds.length ? <p className="m-0 p-2 text-xs text-slate-400">{t('Không có lớp hoặc học viên khớp')}</p>
                : (
                  <>
                    <div className={nhom}>{t('Lớp')}{r.lop.length ? ` · ${r.lop.length}` : ''}</div>
                    {!r.lop.length && <div className="px-2 pb-1 text-xs text-slate-500">{t('Không có lớp khớp “{q}”', { q })}</div>}
                    {r.lop.map((l, i) => (
                      <div key={`l${l.id}`} id={`tim-kht-${i}`} role="option" aria-selected={i === dong} className={dongCls(i)}
                        onMouseDown={(e) => { e.preventDefault(); chon({ loai: 'lop', x: l }); }} onMouseEnter={() => setDong(i)}>
                        <b className="text-slate-100">{l.code}</b>
                        <span className="truncate text-slate-400">
                          {[l.loai === 'ft' ? 'Fast Track' : t('Lớp thường'), `${l.soHv} HV`, l.gvcn ? `GVCN ${l.gvcn}` : null].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    ))}
                    <div className={nhom}>{t('Học viên')}{r.hocVien.length ? ` · ${r.hocVien.length}` : ''}</div>
                    {!r.hocVien.length && <div className="px-2 pb-1 text-xs text-slate-500">{t('Không có học viên khớp “{q}”', { q })}</div>}
                    {r.hocVien.map((h, j) => {
                      const i = r.lop.length + j;
                      return (
                        <div key={`h${h.studentId}-${h.classId}`} id={`tim-kht-${i}`} role="option" aria-selected={i === dong} className={dongCls(i)}
                          onMouseDown={(e) => { e.preventDefault(); chon({ loai: 'hv', x: h }); }} onMouseEnter={() => setDong(i)}>
                          <b className="text-slate-100">{h.ten}</b>
                          <span className="truncate text-slate-400">{[h.classCode, h.email].filter(Boolean).join(' · ')}</span>
                        </div>
                      );
                    })}
                  </>
                )}
        </div>
      )}
    </div>
  );
}
