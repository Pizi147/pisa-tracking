import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../../../lib/api.ts';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../../ui/useBamNgoai.ts';
import { ToKhop } from '../../../ui/ToKhop.tsx';

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
  /* GD-5 (R5.2 #58, mockup ⑤ A): cùng dáng ô chọn có tìm chung — `.oc` (kính lúp · ô gõ · ✕ xoá chữ) + danh sách `.oc-ds` (nhóm có nhãn + số, mục hai hàng,
     tô chữ khớp, tải / rỗng / lỗi). Giữ ô gõ ĐIỀU KHIỂN bởi nơi gọi: chữ gõ còn lọc lưới Kế hoạch (`khopMa`), không phải ô chọn thuần. */
  const muc = (i: number, m: Muc, t1: ReactNode, p: string) => (
    <button key={m.loai === 'lop' ? `l${m.x.id}` : `h${m.x.studentId}-${m.x.classId}`} id={`tim-kht-${i}`} type="button" tabIndex={-1} role="option" aria-selected={i === dong}
      className={`oc-muc${i === dong ? ' re' : ''}`} onMouseDown={(e) => { e.preventDefault(); chon(m); }} onMouseEnter={() => setDong(i)}>
      <span className="t">{t1}</span>{p && <span className="p">{p}</span>}
    </button>
  );

  return (
    <div ref={goc} className={`oc-vung ${className}`}>
      <div className="oc gon" onClick={() => goc.current?.querySelector('input')?.focus()}>
        <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-none stroke-current text-faint" strokeWidth={1.5} strokeLinecap="round"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        <input value={value} placeholder={t('Tìm lớp, học viên hoặc email')} aria-label={t('Tìm lớp, học viên hoặc email')} autoComplete="off" spellCheck={false}
          role="combobox" aria-expanded={mo && !!q} aria-controls="tim-kht-goi-y" aria-autocomplete="list"
          aria-activedescendant={mo && ds[dong] ? `tim-kht-${dong}` : undefined}
          onChange={(e) => { onChange(e.target.value); setMo(true); }} onFocus={() => setMo(true)} onKeyDown={onKey} />
        {value && (
          <button type="button" className="bo" aria-label={t('Xoá chữ tìm')} title={t('Xoá')} onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); onChange(''); setMo(false); }}>✕</button>
        )}
      </div>
      {mo && q && (
        <div id="tim-kht-goi-y" role="listbox" aria-label={t('Kết quả tìm')} aria-busy={!r && !loi ? true : undefined} className="oc-ds w-80 max-w-[calc(100vw-2rem)] !right-auto">
          {loi ? <div className="oc-loi" role="alert"><span><b>{t('Không tải được')}</b></span></div>
            : !r ? <div className="oc-tai" role="status"><span className="chu">{t('Đang tìm…')}</span>{[0, 1].map((k) => <span key={k} className="xd"><i /><i /></span>)}</div>
              : !ds.length ? <div className="oc-rong" role="status"><b>{t('Không có lớp hoặc học viên khớp')}</b></div>
                : (
                  <>
                    <div role="presentation" className="oc-nhom">{t('Lớp')} <span className="so">{r.lop.length}</span></div>
                    {!r.lop.length && <div className="oc-rong !py-1.5 text-[13px]">{t('Không có lớp khớp “{q}”', { q })}</div>}
                    {r.lop.map((l, i) => muc(i, { loai: 'lop', x: l }, l.code,
                      [l.loai === 'ft' ? 'Fast Track' : t('Lớp thường'), t('{n} HV', { n: l.soHv }), l.gvcn ? `GVCN ${l.gvcn}` : null].filter(Boolean).join(' · ')))}
                    <div role="presentation" className="oc-nhom">{t('Học viên')} <span className="so">{r.hocVien.length}</span></div>
                    {!r.hocVien.length && <div className="oc-rong !py-1.5 text-[13px]">{t('Không có học viên khớp “{q}”', { q })}</div>}
                    {r.hocVien.map((h, j) => muc(r.lop.length + j, { loai: 'hv', x: h }, <ToKhop chu={h.ten} q={q} />, [h.classCode, h.email].filter(Boolean).join(' · ')))}
                  </>
                )}
        </div>
      )}
    </div>
  );
}
