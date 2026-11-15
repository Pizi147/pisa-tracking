import { useEffect, useRef, useState } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * GD-21 (mockup ⑬ H9, lời 51 / 15/11): "Sao chép" = MỘT biểu tượng hai tờ giấy — không chữ, không khung nút (vuông trong suốt 36 px, 375: 44 px, như ✕ / ⓘ).
 * Chép `chu` (chữ thuần, không tên học viên) vào bộ nhớ tạm; xong đổi ✓ xanh 2 giây + vùng `aria-live` báo "Đã chép". Trình duyệt chặn chép (XM-8) →
 * hộp nhỏ ⚠ có chữ bôi đen sẵn để người dùng tự Ctrl + C. `ten` = tên người / nhóm cho `aria-label` và `title`.
 */
export function NutSaoChep({ chu, ten }: { chu: string; ten: string }) {
  const [xong, setXong] = useState(false);
  const [chan, setChan] = useState(false);
  const hop = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!xong) return undefined; const h = setTimeout(() => setXong(false), 2000); return () => clearTimeout(h); }, [xong]);
  useEffect(() => { if (chan) hop.current?.select(); }, [chan]);
  const nhan = xong ? t('Đã chép') : t('Sao chép việc quá hạn của {gv} để nhắn', { gv: ten });
  const chep = async () => {
    try { await navigator.clipboard.writeText(chu); setChan(false); setXong(true); } catch { setChan(true); }
  };
  return (
    <span className="relative inline-flex shrink-0 font-normal">
      <button type="button" onClick={chep} aria-label={nhan} title={nhan}
        className={`inline-flex h-9 w-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0 hover:bg-[color:var(--accent-soft)] max-sm:h-11 max-sm:w-11 ${xong ? 'text-ok' : 'text-[color:var(--text-dim)]'}`}>
        {xong
          ? <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 8.5l3.2 3.2L13 5" /></svg>
          : <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" /></svg>}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{xong ? t('Đã chép') : ''}</span>
      {chan && (
        <span role="alert" className="absolute right-0 top-full z-20 mt-1 block w-[min(20rem,calc(100vw-2rem))] rounded-lg border p-2 text-[13px] text-late shadow-lg" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <span className="mb-1 block">⚠ {t('Không chép được — bôi đen rồi nhấn Ctrl + C')}</span>
          <textarea ref={hop} readOnly rows={4} defaultValue={chu} className="w-full resize-none rounded border p-1.5 text-[13px] text-[color:var(--text)]" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }} />
          <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setChan(false)}>{t('Đóng')}</button>
        </span>
      )}
    </span>
  );
}
