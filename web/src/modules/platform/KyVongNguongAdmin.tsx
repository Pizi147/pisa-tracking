import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { t } from '@shared/i18n/index.ts';

type GiaTri = Record<string, number>;
type Xem = { id: number; v: GiaTri; goc: GiaTri; suaDuoc: boolean };
type Truong = { k: string; nhan: string; hien: (n: number) => string; min: number; max: number; buoc: number; donVi: string; luat?: string };

const hienKyVong = (n: number) => (n === 0 ? '= Target' : `Target − ${n.toFixed(1)}`);   // tên riêng + số: EN giống VI
const pt = (n: number) => `${n} %`;

const KY_VONG: Truong[] = [
  { k: 'mt1', nhan: 'MT1', hien: hienKyVong, min: 0, max: 3, buoc: 0.5, donVi: '' },
  { k: 'mt2', nhan: 'MT2', hien: hienKyVong, min: 0, max: 3, buoc: 0.5, donVi: '' },
  { k: 'mt3', nhan: t('MT3 trở đi'), hien: hienKyVong, min: 0, max: 3, buoc: 0.5, donVi: '', luat: t('Học lại trong cùng lộ trình làm số MT tăng tiếp (MT6, MT7…) — cùng mức này.') },
  { k: 'rf', nhan: t('Lộ trình RF (mọi MT)'), hien: hienKyVong, min: 0, max: 3, buoc: 0.5, donVi: '' },
];
const NGUONG: Truong[] = [
  { k: 'hocLai', nhan: t('Học lại dưới'), hien: pt, min: 1, max: 100, buoc: 1, donVi: '%', luat: t('Final lớp thường, % tổng chưa làm tròn. Dưới mức này: gợi ý học lại, Báo PH kết quả Test.') },
  { k: 'len', nhan: t('Lên từ'), hien: pt, min: 1, max: 100, buoc: 1, donVi: '%', luat: t('Từ mức này tới dưới "Đạt từ": lên lớp kèm bổ trợ miễn phí. Giữa "Học lại dưới" và mức này: Quản lý cân nhắc.') },
  { k: 'miniTest', nhan: t('Mini Test đạt từ'), hien: pt, min: 1, max: 100, buoc: 1, donVi: '%', luat: t('Mini Test sau bổ trợ Final: đạt thì Case tự Hoàn thành; chưa đạt thì Xét lại lộ trình.') },
];

/**
 * QUẢN TRỊ › BAND & NGƯỠNG (QTV2-BAND, đặc tả mục 5.5): hai khối trên Bảng quy đổi — Kỳ vọng MT Fast Track, Ngưỡng lớp thường. Quản trị sửa tại ô
 * (Enter lưu, Esc khi đã đổi thì hỏi), Quản lý xem. Mỗi lần lưu = một phiên bản, CHỈ ÁP CHO CÁI SINH SAU (lượt MT tạo sau · Final nhập điểm sau);
 * Hoàn tác chỉ đảo đúng ô đó. Ô khác gốc: "gốc: … · Về gốc".
 */
export function KyVongNguongAdmin() {
  const phien = useSession();
  const cap = () => { invalidate('/admin/nhat-ky'); void phien.reload(); };   // phiên mang các bản — màn khác tính theo bản mới ngay
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <KhoiCauHinh duong="/admin/cau-hinh/ky-vong-ft" tieuDe={t('Kỳ vọng MT Fast Track')} truong={KY_VONG} sauLuu={cap}
        apDung={t('Áp cho lộ trình mở từ nay')} giaiThich={t('Kỳ vọng của một lượt = Target − mức trừ theo lần MT trong lộ trình. Lượt MT tạo một lần khi mở lộ trình, nên mức mới chỉ áp cho lộ trình mở từ lúc lưu; MT sắp tới của lộ trình đang chạy giữ mức cũ, sửa điểm sau cũng vậy. SOS = số kỹ năng dưới kỳ vọng.')} />
      <KhoiCauHinh duong="/admin/cau-hinh/nguong-thuong" tieuDe={t('Ngưỡng lớp thường')} truong={NGUONG} sauLuu={cap}
        apDung={t('Áp cho lớp mở từ nay')} giaiThich={t('Bài Final tạo một lần khi mở lớp, nên ngưỡng mới chỉ áp cho lớp mở từ lúc lưu; lớp đang học giữ ngưỡng cũ. Mini Test theo ngày làm. Xét lại và gợi ý sau Final dùng cùng bản.')}
        them={(v) => (
          <>
            <DongChiXem nhan={t('Cân nhắc')} gia={`${v.hocLai}–${v.len - 1} %`} />
            <DongChiXem nhan={t('Đạt từ')} gia={<Link to="/quan-tri?tab=catalog" className="text-accent">{t('theo chương trình')} ›</Link>} />
          </>
        )} />
      <p className="m-0 flex items-center gap-1.5 text-[13px] text-slate-400 md:col-span-2">
        {t('KET 100–150 · PET 120–170 (thang Cambridge)')}
        <NutLuat label={t('Thang Cambridge')}>{t('Thang điểm và mốc grade / CEFR của Cambridge — không phải luật của trung tâm, nên không sửa ở đây.')}</NutLuat>
      </p>
    </div>
  );
}

function DongChiXem({ nhan, gia }: { nhan: string; gia: ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[15px] text-slate-300">{nhan}</span>
      <span className="text-[15px] tabular-nums text-slate-300">{gia}</span>
    </li>
  );
}

function KhoiCauHinh({ duong, tieuDe, truong, apDung, giaiThich, them, sauLuu }: {
  duong: string; tieuDe: string; truong: Truong[]; apDung: string; giaiThich: string; them?: (v: GiaTri) => ReactNode; sauLuu: () => void;
}) {
  const r = useApi<Xem>(duong);
  const toast = useToast();
  const [sua, setSua] = useState<string | null>(null);
  /* Bản vừa lưu — lưu / Hoàn tác liền nhau không đợi GET tải lại (khỏi 409 giả với chính mình). */
  const vuaLuu = useRef<{ id: number; v: GiaTri } | null>(null);
  if (r.error) return <section className="card min-w-0 p-4"><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></section>;
  if (!r.data) return <section className="card min-w-0 p-4"><Skeleton rows={4} /></section>;
  const d = r.data;
  const hienTai = () => (vuaLuu.current && vuaLuu.current.id >= d.id ? vuaLuu.current : { id: d.id, v: d.v });
  /* Ghép MỘT ô lên bản mới nhất — lưu, Về gốc, Hoàn tác chỉ đổi đúng ô đó. */
  const gui = async (k: string, n: number, khoiPhucTu?: number) => {
    const cur = hienTai();
    const giaTri = { ...cur.v, [k]: n };
    const x = await api.put<{ id: number; truocId: number; truocGiaTri: GiaTri; doi: unknown[] }>(duong, { giaTri, tuPhienBan: cur.id, khoiPhucTu });
    vuaLuu.current = { id: x.id, v: giaTri };
    r.reload(); sauLuu();
    return x;
  };
  const luu = async (q: Truong, n: number) => {
    const x = await gui(q.k, n);
    if (!x.doi.length) return;
    toast.hoanTac(t('Đã lưu {ten}: {gia}', { ten: q.nhan, gia: q.hien(n) }), () => {
      gui(q.k, x.truocGiaTri[q.k], x.truocId).then(() => toast.push('ok', t('Đã hoàn tác'))).catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
    }, { key: `${duong}-${q.k}` });
  };
  const v = hienTai().v;
  return (
    <section className="card min-w-0" aria-label={tieuDe}>
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="h-khoi m-0 text-base font-bold text-slate-100">{tieuDe}</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[13px] text-slate-400">{apDung}<NutLuat label={apDung}>{giaiThich}</NutLuat></span>
      </header>
      <ul className="m-0 list-none p-0">
        {truong.map((q) => {
          const n = v[q.k], g = d.goc[q.k];
          const khacGoc = n !== g;
          return (
            <li key={q.k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
              <span className="inline-flex min-w-0 items-center gap-1 text-[15px] text-slate-100">{q.nhan}{q.luat && <NutLuat label={q.nhan}>{q.luat}</NutLuat>}</span>
              <span className="grid justify-items-end">
                {sua === q.k ? (
                  <SuaO q={q} n={n} onThoi={() => setSua(null)} onLuu={async (moi) => { await luu(q, moi); setSua(null); }} />
                ) : d.suaDuoc ? (
                  <button type="button" aria-label={`${t('Sửa')} ${q.nhan}`} onClick={() => setSua(q.k)}
                    className={`inline-flex min-h-[32px] items-center rounded-md border px-2.5 text-[15px] font-semibold tabular-nums hover:border-[color:var(--accent)] max-sm:min-h-[44px] ${khacGoc ? 'text-accent' : 'text-slate-100'}`}
                    style={{ borderColor: 'var(--line-strong)' }}>{q.hien(n)}</button>
                ) : <span className={`text-[15px] font-semibold tabular-nums ${khacGoc ? 'text-accent' : 'text-slate-100'}`}>{q.hien(n)}</span>}
                {khacGoc && sua !== q.k && (
                  <span className="mt-0.5 text-xs text-slate-400">{t('gốc: {g}', { g: q.hien(g) })}
                    {d.suaDuoc && <button type="button" className="ml-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-accent" onClick={() => void luu(q, g).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được')))}>{t('Về gốc')}</button>}
                  </span>
                )}
              </span>
            </li>
          );
        })}
        {them?.(v)}
      </ul>
    </section>
  );
}

/** Ô sửa một giá trị tại chỗ: Enter lưu, Esc thôi (đã đổi thì hỏi một lần). Kiểm ở web như máy chủ; lỗi máy chủ (vd "Lên từ" ≤ "Học lại dưới") báo tại ô. */
function SuaO({ q, n, onThoi, onLuu }: { q: Truong; n: number; onThoi: () => void; onLuu: (n: number) => Promise<void> }) {
  const [x, setX] = useState(String(n));
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hoiBo, setHoiBo] = useState(false);
  /* Lỗi máy chủ: ô bị tắt lúc lưu nên mất focus — trả focus về ô đầu để Esc / sửa tiếp được bằng phím. */
  const khung = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (!busy && loi) khung.current?.querySelector<HTMLElement>('input, select')?.focus(); }, [busy, loi]);
  const so = Number(x.replace(',', '.'));
  const daDoi = so !== n;
  const ngoai = () => { if (busy) return; if (daDoi) setHoiBo(true); else onThoi(); };
  const luu = async () => {
    if (busy) return;
    if (x.trim() === '' || !Number.isFinite(so) || so < q.min || so > q.max || !Number.isInteger(so / q.buoc)) {
      setLoi(q.buoc === 1 ? t('Số nguyên từ {a} đến {b}', { a: q.min, b: q.max }) : t('Từ {a} đến {b}, bước {s}', { a: q.min, b: q.max, s: q.buoc })); return;
    }
    if (!daDoi) { onThoi(); return; }
    setBusy(true); setLoi(null);
    try { await onLuu(so); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const phim = (e: KeyboardEvent) => {
    const o = (e.target as HTMLElement).tagName;
    if (e.key === 'Enter' && o === 'INPUT') { e.preventDefault(); void luu(); }   // Enter ở nút = bấm nút đó
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ngoai(); }
  };
  return (
    <span className="grid justify-items-end gap-1.5" onKeyDown={phim} ref={khung}>
      <label className="inline-flex items-center gap-1 text-[13px] text-slate-400">
        {q.buoc !== 1 && 'Target −'}
        <input autoFocus type="number" inputMode="decimal" step={q.buoc} min={q.min} max={q.max} className="field w-20 text-center tabular-nums max-sm:min-h-[44px]"
          aria-label={q.nhan} aria-invalid={!!loi} value={x} disabled={busy} onChange={(e) => setX(e.target.value)} />
        {q.donVi}
      </label>
      {loi && <span className="text-xs text-late" role="alert">{loi}</span>}
      {hoiBo ? (
        <span className="flex flex-wrap items-center justify-end gap-1.5" role="status">
          <span className="text-xs text-slate-300">{t('Chưa lưu thay đổi')}</span>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => setHoiBo(false)}>{t('Ở lại')}</button>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={onThoi}>{t('Bỏ thay đổi')}</button>
        </span>
      ) : (
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={ngoai}>{daDoi ? t('Huỷ thay đổi') : t('Đóng')}</button>
          <button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        </span>
      )}
    </span>
  );
}
