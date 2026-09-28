import { useEffect, useId, useRef, type ReactNode } from 'react';
import { taoKhoPanel } from '@shared/domain/index.ts';
import { NutLuat } from './NutLuat.tsx';
import { DongCanSua, type MucThieu } from './loiForm.tsx';
import { useGiuFocus } from './giuFocus.ts';

/** Kho dùng chung toàn web: mở panel này thì panel đang mở phải đóng (G-8, N-4). */
export const khoPanelChung = taoKhoPanel();

/**
 * KHUÔN PANEL CHUNG (PR-UX0, N-4 — mockup 15 (1)). Ngăn phải 560px (form dạng bảng `rong` = 720px), 375px toàn màn.
 * Đầu 52px MỘT dòng: tiêu đề · tên HV · lớp (mờ, cắt "…") · ✕; tab (nếu có) dính dưới đầu; ngữ cảnh ≤ 1 dòng.
 * Thân chia KHỐI (`Khoi`, tiêu đề nhỏ, luật dài vào ⓘ), nhãn TRÊN ô (`Truong`), ≤ 2 ô một hàng (`Hang2`).
 * Chân CỐ ĐỊNH: trái Huỷ / Xoá (viền đỏ), phải nút phụ + MỘT nút chính; dòng xám "n ô cần sửa ↑" trên chân (PR-N1,
 * `DongCanSua`) — chỉ truyền `conThieu` SAU khi bấm Lưu; lý do từng ô nằm dưới ô (`Truong loi`). CHỈ thân cuộn, trang sau khoá cuộn. Mở việc khác thì THAY nội dung, không
 * chồng panel (`khoPanelChung`). Không chữ dev; chữ mẫu bắt đầu "Ví dụ:".
 */
export function KhungPanel({ tieuDe, hocVien, lop, rong = 'hep', tabs, ngCanh, quayLai, chan, onDong, children }: {
  tieuDe: string; hocVien?: string | null; lop?: string | null; rong?: 'hep' | 'rong';
  tabs?: ReactNode; ngCanh?: ReactNode; quayLai?: { nhan: string; onClick: () => void };
  chan?: {
    huy?: { nhan?: string; onClick: () => void }; xoa?: { onClick: () => void; nhan?: string };
    phu?: ReactNode; chinh?: ReactNode; conThieu?: (string | MucThieu)[];
  };
  onDong: () => void; children: ReactNode;
}) {
  const id = useId();
  const dongRef = useRef(onDong);
  dongRef.current = onDong;

  useEffect(() => {
    khoPanelChung.mo(id, () => dongRef.current());
    return () => khoPanelChung.dong(id);
  }, [id]);

  useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = cu; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) dongRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const ngu = [hocVien, lop].filter(Boolean).join(' · ');
  const huy = chan?.huy ?? { onClick: onDong };
  const khung = useRef<HTMLDivElement>(null);
  useGiuFocus(khung);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className="absolute inset-0 bg-black/60" onClick={onDong} />
      <div ref={khung} tabIndex={-1} className={`relative flex h-full w-full flex-col border-l shadow-2xl outline-none ${rong === 'rong' ? 'sm:w-[720px]' : 'sm:w-[560px]'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b px-4" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 whitespace-nowrap text-sm font-extrabold text-slate-100">{tieuDe}</h2>
          {ngu && <span className="min-w-0 flex-1 truncate text-xs text-slate-400" title={ngu}>{ngu}</span>}
          {!ngu && <span className="flex-1" />}
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px]" onClick={onDong} aria-label="Đóng">✕</button>
        </header>
        {quayLai && (
          <div className="shrink-0 border-b px-4 py-1.5 text-xs" style={{ borderColor: 'var(--line)' }}>
            <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={quayLai.onClick}>← {quayLai.nhan}</button>
          </div>
        )}
        {tabs && <div className="shrink-0 border-b px-4" style={{ borderColor: 'var(--line)' }}>{tabs}</div>}
        {ngCanh && <div className="shrink-0 truncate px-4 pt-2 text-xs text-slate-400">{ngCanh}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {chan && (
          <footer className="shrink-0 border-t" style={{ borderColor: 'var(--line)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={huy.onClick}>{huy.nhan ?? 'Huỷ'}</button>
              {chan.xoa && <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" onClick={chan.xoa.onClick}>{chan.xoa.nhan ?? 'Xoá'}</button>}
              <span className="flex-1" />
              {chan.phu}
              {chan.chinh}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

/** Một KHỐI trong thân panel: tiêu đề nhỏ (luật dài vào ⓘ), khối sau có vạch trên. */
export function Khoi({ tieuDe, luat, children }: { tieuDe: string; luat?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-3.5 border-t pt-3.5 first:mt-0 first:border-t-0 first:pt-3.5" style={{ borderColor: 'var(--line)' }}>
      <h3 className="mb-2.5 mt-0 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.06em] text-slate-500">
        {tieuDe}{luat && <NutLuat>{luat}</NutLuat>}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Một TRƯỜNG: nhãn ở TRÊN ô, `*` khi bắt buộc, chữ phụ ≤ 1 dòng, `loi` chỉ khi người gọi truyền (sau khi bấm Lưu / rời ô).
 * Có `loi` → ô viền đỏ + lý do dưới ô (YC-12.5.2; người gọi đặt `aria-invalid` lên ô). `dem` = bộ đếm ký tự `8/15` bên phải.
 */
export function Truong({ nhan, batBuoc, tuyChon, phu, loi, dem, as = 'label', children }: {
  nhan: string; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string | null; dem?: { co: number; can: number };
  as?: 'label' | 'div'; children: ReactNode;
}) {
  const Vo = as;
  return (
    <Vo className="block min-w-0">
      <span className="mb-1 flex items-baseline gap-2 text-[11.5px] font-bold text-slate-200">
        <span className="min-w-0 flex-1">
          {nhan}{batBuoc && <span className="text-bad"> *</span>}
          {tuyChon && <span className="font-normal text-slate-500"> (không bắt buộc)</span>}
        </span>
        {dem && <span className={`text-[10.5px] font-normal tabular-nums ${dem.co < dem.can ? 'text-slate-500' : 'text-slate-400'}`}>{dem.co}/{dem.can}</span>}
      </span>
      {loi ? <div className="[&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40">{children}</div> : children}
      {phu && <span className="mt-1 block truncate text-[10.5px] text-slate-500">{phu}</span>}
      {loi && <span className="mt-1 block text-[11px] text-late">{loi}</span>}
    </Vo>
  );
}

/** Hai ô một hàng khi thật ngắn: 2 cột từ sm, 1 cột dưới sm. */
export function Hang2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
