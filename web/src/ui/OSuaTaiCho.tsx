import { useId, useRef, useState } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô SỬA TẠI CHỖ (mẫu chung tab cấu hình QTV2, spec mục 5.0: "ô có viền = bấm là sửa ngay tại dòng") — một trường chữ ngắn.
 * Bấm → ô nhập + Huỷ thay đổi / Đóng · Lưu; Enter lưu, Esc thôi. Lỗi máy chủ: giữ chữ đang gõ, báo dưới ô (`aria-describedby`), focus lại ô.
 * `chiXem`: chữ thường, không bấm được (Quản lý xem cấu hình).
 */
export function OSuaTaiCho({ giaTri, nhan, rong = 'w-full', toiDa = 300, chiXem = false, trong, onLuu }: {
  giaTri: string | null; nhan: string; rong?: string; toiDa?: number; chiXem?: boolean;
  /** Chữ khi ô trống (vd "+ SĐT"). */
  trong?: string;
  /** `gocMo` = giá trị lúc bấm sửa — máy chủ so để không đè lần sửa của người khác trong lúc đang gõ (N04). */
  onLuu: (v: string, gocMo: string) => Promise<void>;
}) {
  const [sua, setSua] = useState(false);
  const [v, setV] = useState('');
  const [gocMo, setGocMo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  /* Esc / Đóng khi đã gõ khác → hỏi MỘT lần "Bỏ thay đổi · Ở lại" (cùng phản hồi với `SuaTaiDong`), không mất chữ đang gõ. */
  const [hoiBo, setHoiBo] = useState(false);
  const o = useRef<HTMLInputElement>(null);
  const idLoi = useId();
  const goc = giaTri ?? '';
  if (chiXem) return <span className={goc ? 'text-slate-100' : 'text-slate-500'}>{goc || t('Chưa có')}</span>;
  const thoi = () => { setSua(false); setLoi(null); setHoiBo(false); };
  const ngoai = () => { if (busy) return; if (v !== goc) setHoiBo(true); else thoi(); };
  const luu = async () => {
    if (busy) return;
    if (v.trim() === goc.trim()) { thoi(); return; }
    setBusy(true); setLoi(null);
    try { await onLuu(v.trim(), gocMo); thoi(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); o.current?.focus(); } finally { setBusy(false); }
  };
  if (!sua) {
    return (
      <button type="button" aria-label={`${t('Sửa')} ${nhan}`} title={t('Sửa')} onClick={() => { setV(goc); setGocMo(goc); setSua(true); }}
        className={`group -ml-1 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-sm hover:border-[color:var(--accent)] max-sm:min-h-[44px] ${goc ? 'text-slate-100' : 'border-dashed text-accent'}`}
        style={{ borderColor: 'var(--line-strong)' }}>
        <span className="min-w-0 break-words">{goc || trong || t('Chưa có')}</span>
        <span aria-hidden className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">✎</span>
      </button>
    );
  }
  return (
    <span className="grid gap-1.5">
      <input ref={o} autoFocus className={`field ${rong}`} aria-label={nhan} value={v} maxLength={toiDa} disabled={busy}
        aria-invalid={!!loi} aria-describedby={loi ? idLoi : undefined}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); void luu(); }
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ngoai(); }
        }} />
      {loi && <span id={idLoi} className="text-xs text-late" role="alert">{loi}</span>}
      {hoiBo ? (
        <span className="flex flex-wrap items-center gap-1.5" role="status">
          <span className="text-xs text-slate-300">{t('Chưa lưu thay đổi')}</span>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => { setHoiBo(false); o.current?.focus(); }}>{t('Ở lại')}</button>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={thoi}>{t('Bỏ thay đổi')}</button>
        </span>
      ) : (
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={ngoai}>{v !== goc ? t('Huỷ thay đổi') : t('Đóng')}</button>
          <button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        </span>
      )}
    </span>
  );
}
