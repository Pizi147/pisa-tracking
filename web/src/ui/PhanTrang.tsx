import { useEffect, useRef, useState, type RefObject } from 'react';
import { CO_TRANG, CO_TRANG_MAC_DINH, catTrang, laCoTrang, type CoTrang } from '@shared/domain/index.ts';
import { useSession } from '../lib/session.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * PHÂN TRANG (OV-15e, mockup 6 khung 7) — mặc định 10 dòng, chọn 20 / 50; thanh trang + cỡ ở ĐẦU và CUỐI bảng, hai thanh cùng một trạng thái
 * (đổi ở thanh dưới → cuộn về đầu bảng). Đổi bộ lọc (`khoa`) → về trang 1, giữ cỡ. Cỡ trang nhớ theo người dùng (máy này). Xuất Excel xuất đủ mọi trang
 * (nơi gọi xuất từ dữ liệu gốc, không từ `hien`). Không áp lưới nhập điểm cả lớp và hàng đợi Công việc.
 *
 *   const pt = usePhanTrang(rows.length, khoaLoc, 'lượt');
 *   <PhanTrang {...pt.thanh} />  …  pt.cat(rows).map(…)  …  <PhanTrang {...pt.thanh} duoi />
 */
const khoaNho = (uid: number | null) => `pisa.phan-trang.co:${uid ?? 0}`;
function docCo(uid: number | null): CoTrang {
  try { const n = Number(localStorage.getItem(khoaNho(uid))); return laCoTrang(n) ? n : CO_TRANG_MAC_DINH; } catch { return CO_TRANG_MAC_DINH; }
}

export type ThanhPhanTrang = {
  tong: number; trang: number; soTrang: number; co: CoTrang; dau: number; cuoi: number; donVi: string;
  onTrang: (n: number) => void; onCo: (n: CoTrang) => void; dauBang: RefObject<HTMLDivElement>;
};

export function usePhanTrang(tong: number, khoa: string, donVi: string) {
  const uid = useSession().session?.user?.id ?? null;
  const [co, setCo] = useState<CoTrang>(() => docCo(uid));
  const [trang, setTrang] = useState(1);
  const dauBang = useRef<HTMLDivElement>(null);
  useEffect(() => { setTrang(1); }, [khoa]);
  const c = catTrang(tong, trang, co);
  const thanh: ThanhPhanTrang = {
    tong, trang: c.trang, soTrang: c.soTrang, co, dau: c.dau, cuoi: c.cuoi, donVi, dauBang,
    onTrang: setTrang,
    onCo: (n) => { setCo(n); setTrang(1); try { localStorage.setItem(khoaNho(uid), String(n)); } catch { /* không nhớ được thì dùng cỡ này đến khi tải lại */ } },
  };
  return { thanh, cat: <T,>(ds: readonly T[]) => ds.slice(c.dau, c.cuoi) };
}

/** Thanh "1–10 / 34 lượt · 1 2 3 4 · Mỗi trang 10 20 50". Ít hơn 11 dòng → không hiện (không có gì để lật). */
export function PhanTrang({ duoi, ...p }: ThanhPhanTrang & { duoi?: boolean }) {
  if (p.tong <= CO_TRANG[0]) return duoi ? null : <div ref={p.dauBang} />;
  const doi = (n: number) => {
    p.onTrang(n);
    if (duoi) p.dauBang.current?.scrollIntoView({ block: 'start' });
  };
  /* Nút số trang: ≤ 7 trang hiện đủ; nhiều hơn → 1 … quanh trang này … cuối. Điện thoại: "n / m". */
  const so = p.soTrang <= 7 ? Array.from({ length: p.soTrang }, (_, i) => i + 1)
    : [...new Set([1, p.trang - 1, p.trang, p.trang + 1, p.soTrang].filter((x) => x >= 1 && x <= p.soTrang))];
  const nut = 'inline-flex min-h-[44px] min-w-[36px] items-center justify-center rounded-md border-0 px-2 text-xs tabular-nums sm:min-h-[30px] sm:min-w-[30px]';
  return (
    <nav ref={duoi ? undefined : p.dauBang} aria-label={duoi ? t('Phân trang cuối bảng') : t('Phân trang')}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 py-1.5 text-xs text-slate-400 print:hidden">
      <span className="tabular-nums text-slate-300">{p.dau + 1}–{p.cuoi} / {p.tong} {p.donVi}</span>
      <span className="flex items-center gap-0.5">
        <button type="button" className={`${nut} bg-transparent text-slate-300 disabled:opacity-40`} disabled={p.trang <= 1} onClick={() => doi(p.trang - 1)} aria-label={t('Trang trước')}>‹</button>
        <span className="tabular-nums sm:hidden">{p.trang} / {p.soTrang}</span>
        {so.map((n, i) => (
          <span key={n} className="hidden items-center sm:inline-flex">
            {i > 0 && n - so[i - 1] > 1 && <span aria-hidden className="px-0.5">…</span>}
            <button type="button" aria-current={n === p.trang ? 'page' : undefined} onClick={() => doi(n)}
              className={`${nut} ${n === p.trang ? 'bg-[color:var(--accent-soft)] font-semibold text-slate-100 shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-transparent text-slate-300 hover:text-slate-100'}`}>{n}</button>
          </span>
        ))}
        <button type="button" className={`${nut} bg-transparent text-slate-300 disabled:opacity-40`} disabled={p.trang >= p.soTrang} onClick={() => doi(p.trang + 1)} aria-label={t('Trang sau')}>›</button>
      </span>
      <span className="flex items-center gap-1">
        <span>{t('Mỗi trang')}</span>
        {CO_TRANG.map((n) => (
          <button key={n} type="button" aria-pressed={n === p.co} onClick={() => p.onCo(n)}
            className={`${nut} ${n === p.co ? 'bg-[color:var(--accent-soft)] font-semibold text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>{n}</button>
        ))}
      </span>
    </nav>
  );
}
