import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { useBaoDangSua } from '../../ui/KhungPanel.tsx';
import type { TuDien } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * KHUNG BÀN GIAO DÙNG CHUNG (PR-B, đặc tả phân công GV mục 2.8): bàn giao chuyển lớp (`BanGiaoPanel`, mẫu F) và bàn giao khi đổi GV
 * (`BanGiaoGvPanel`) cùng ba thành phần — danh sách em (listbox ↑/↓), phần tự điền chỉ đọc, ô góp ý lưu khi rời ô (không mất chữ).
 */

const TONE: Record<'du' | 'thieu' | 'chua' | 'muted', ToneNhan> = { du: 'ok', thieu: 'soon', chua: 'muted', muted: 'muted' };

/** Danh sách em bên trái: chip trạng thái (chữ, không chỉ màu) + dòng phụ; ↑ / ↓ đi từng em, focus theo em đang chọn. */
export function DsEmBanGiao<T extends { id: number; ten: string }>({ ds, chon, onChon, trangThai, phu, nhan }: {
  ds: T[]; chon: number; onChon: (id: number) => void;
  trangThai?: (e: T) => { khoa: 'du' | 'thieu' | 'chua' | 'muted'; nhan: string } | null;
  phu?: (e: T) => ReactNode; nhan: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const phim = (ev: KeyboardEvent<HTMLUListElement>) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    ev.preventDefault();
    const i = ds.findIndex((x) => x.id === chon);
    const j = Math.max(0, Math.min(ds.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)));
    onChon(ds[j].id);
    ref.current?.querySelectorAll<HTMLElement>('[role="option"]')[j]?.focus();
  };
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px] font-semibold text-slate-500">
        <span className="tabular-nums">{t('Học viên · {n} em', { n: ds.length })}</span>
        <span className="font-normal max-md:hidden"><kbd>↑</kbd> <kbd>↓</kbd> {t('đi từng em')}</span>
      </div>
      <ul ref={ref} role="listbox" aria-label={nhan} onKeyDown={phim}
        className="m-0 list-none divide-y rounded-lg p-0 surface-2" style={{ borderColor: 'var(--line)' }}>
        {ds.map((e) => {
          const tt = trangThai?.(e) ?? null;
          return (
            <li key={e.id} role="option" aria-selected={e.id === chon} tabIndex={e.id === chon ? 0 : -1}
              onClick={() => onChon(e.id)} onFocus={() => onChon(e.id)}
              className={`cursor-pointer px-3 py-2 outline-none ${e.id === chon ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]' : 'bam'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-slate-100" title={e.ten}>{e.ten}</span>
                {tt && <Nhan tone={TONE[tt.khoa]}>{tt.nhan}</Nhan>}
              </div>
              {phu && <div className="flex items-center justify-between gap-2 text-xs text-slate-500">{phu(e)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Phần "Tự điền · chỉ đọc" (kết quả, Case đang mở, ý thức, việc còn dở) — `daChup`: đọc bản chụp lúc xác nhận. */
export function TuDienEm({ tuDien, daChup }: { tuDien: TuDien | null; daChup: boolean }) {
  return (
    <section aria-label={t('Hệ thống tự điền')} className="surface-2 rounded-lg p-3">
      <h4 className="mb-2 mt-0 text-[12px] font-semibold text-slate-500">{t('Tự điền · chỉ đọc')}{daChup && ` · ${t('chụp lúc xác nhận')}`}</h4>
      {tuDien ? (
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
          <span className="text-slate-500">{t('Kết quả')}</span><span className="text-slate-200">{dich(tuDien.ketQua)}</span>
          <span className="text-slate-500">{t('Case đang mở')}</span>
          <span className="text-slate-200">
            {tuDien.caseMo.length ? tuDien.caseMo.map((c) => `${dich(c.ten)}${c.nguoiNhan ? ` · ${t('người nhận gợi ý: {ten}', { ten: c.nguoiNhan })}` : ''}`).join(' · ') : t('Không có')}
          </span>
          <span className="text-slate-500">{t('Ý thức')}</span><span className="text-slate-200">{dich(tuDien.yThuc)}</span>
          <span className="text-slate-500">{t('Việc còn dở')}</span><span className="text-slate-200">{dich(tuDien.viecConDo)}</span>
        </div>
      ) : <p className="m-0 text-sm text-slate-400">{t('Chưa có dữ liệu tự điền.')}</p>}
    </section>
  );
}

/**
 * MỘT Ô GÓP Ý — lưu khi rời ô: "● Đang gõ · lưu khi rời ô" → "Đang lưu…" → "✓ Đã lưu"; lỗi giữ nguyên chữ + câu lỗi, rời ô lần sau thử lại.
 * `docThoi`: chỉ đọc (chữ + "— người, ngày"). Ô 44 px chữ 16 ở 375 do `.field` chung (index.css OV-14b).
 */
export function OGopY({ id, nhan, ky, batBuoc, giaTri, docThoi, aiGhi, placeholder, rows = 5, onLuu }: {
  id?: string; nhan: string; ky?: string; batBuoc: boolean; giaTri: string; docThoi?: boolean; aiGhi?: string | null; placeholder?: string; rows?: number;
  onLuu: (chu: string) => Promise<void>;
}) {
  const [chu, setChu] = useState(giaTri);
  const [tt, setTt] = useState<'yen' | 'go' | 'luu' | 'da' | 'loi'>('yen');
  const [loi, setLoi] = useState<string | null>(null);
  /* Bản đã lưu đổi (tải lại sau lưu / người khác sửa) → nhận giá trị mới, trừ khi đang gõ dở hoặc lưu lỗi (không mất chữ). Đổi em: nơi gọi đặt `key`. */
  useEffect(() => { if (tt !== 'go' && tt !== 'loi' && tt !== 'luu') setChu(giaTri); }, [giaTri]); // eslint-disable-line react-hooks/exhaustive-deps
  useBaoDangSua(tt === 'go' || tt === 'loi');
  const luu = async () => {
    if (chu.trim() === giaTri.trim()) { if (tt === 'go') setTt('yen'); return; }
    if (batBuoc && !chu.trim()) { setTt('loi'); setLoi(t('Viết góp ý cho em này.')); return; }
    setTt('luu');
    try { await onLuu(chu.trim()); setTt('da'); setLoi(null); } catch (e: any) { setTt('loi'); setLoi(e?.message ?? t('Không lưu được — chữ vẫn giữ, thử lại khi rời ô.')); }
  };
  const nhanEl = (
    <span className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-slate-200">
      {ky && <span className="rounded bg-[color:var(--surface-2)] px-1.5 text-[12px] font-bold text-slate-300">{ky}</span>}
      <span>{nhan}</span>
      {batBuoc && !docThoi && <><span aria-hidden="true" className="text-late">*</span><span className="text-[12px] font-normal text-slate-500">{t('bắt buộc')}</span></>}
    </span>
  );
  if (docThoi) {
    return (
      <div className="min-w-0">
        {nhanEl}
        {giaTri ? <p className="m-0 whitespace-pre-wrap break-words rounded-lg surface-2 px-3 py-2 text-sm text-slate-200">{giaTri}{aiGhi && <span className="mt-1 block text-xs text-slate-500">— {aiGhi}</span>}</p>
          : <p className="m-0 text-sm text-slate-500">{t('Chưa có')}</p>}
      </div>
    );
  }
  return (
    <label className="block min-w-0">
      {nhanEl}
      <textarea id={id} className="field w-full" rows={rows} value={chu} placeholder={placeholder}
        aria-invalid={tt === 'loi'} aria-required={batBuoc}
        onChange={(e) => { setChu(e.target.value); setTt('go'); }} onBlur={() => void luu()} />
      <span className="mt-0.5 flex items-center justify-between gap-2 text-xs" aria-live="polite">
        <span className={tt === 'da' ? 'text-done' : tt === 'loi' ? 'text-late' : 'text-slate-500'}>
          {tt === 'go' ? t('● Đang gõ · lưu khi rời ô') : tt === 'luu' ? t('Đang lưu…') : tt === 'da' ? t('✓ Đã lưu') : tt === 'loi' ? loi : ''}
        </span>
        {aiGhi && tt !== 'go' && <span className="text-slate-500">— {aiGhi}</span>}
      </span>
    </label>
  );
}
