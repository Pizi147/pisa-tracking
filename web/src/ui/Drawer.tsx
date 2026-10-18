import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useGiuFocus } from './giuFocus.ts';
import { t } from '@shared/i18n/index.ts';

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg', z = 'z-50' }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string;
  /** Lớp z — hộp mở TRÊN một popover `z-[60]` (HopKyNang) cần cao hơn. */
  z?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return <KhungModal onClose={onClose} title={title} footer={footer} width={width} z={z}>{children}</KhungModal>;
}

/** Tách khỏi `Modal` để hook giữ focus chạy đúng lúc mở/đóng (Modal trả `null` khi `open = false`). */
function KhungModal({ onClose, title, children, footer, width, z }: {
  onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width: string; z: string;
}) {
  const khung = useRef<HTMLDivElement>(null);
  useGiuFocus(khung);
  const idTen = useId();
  return (
    <div className={`fixed inset-0 !mt-0 ${z} flex items-center justify-center p-4`} role="dialog" aria-modal="true" aria-labelledby={idTen}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={khung} tabIndex={-1} className={`relative w-full ${width} card shadow-2xl max-h-[88vh] flex flex-col -outline-offset-2`}>
        <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 id={idTen} className="text-sm font-semibold text-slate-100">{title}</h2>
          <button className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-0 sm:min-w-0" onClick={onClose} aria-label={t('Đóng')}>✕</button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <footer className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--line)' }}>{footer}</footer>}
      </div>
    </div>
  );
}

/** Xác nhận rõ ràng cho thao tác không dùng autosave (chuyển lớp, cảnh báo, import, đổi quyền). */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = t('Xác nhận'), danger, busy, closeLabel = t('Đóng'), z, confirmDisabled, confirmTitle }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string;
  body: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
  closeLabel?: string; z?: string;
  /** Nút xác nhận mờ (ví dụ ô lý do bắt buộc còn trống). */
  confirmDisabled?: boolean;
  /** Tooltip nút xác nhận — nói vì sao đang mờ (ví dụ câu lỗi của ô lý do). */
  confirmTitle?: string;
}) {
  /* OV-14a (F11): đang chạy thì Esc / bấm nền / ✕ không đóng — hộp là chỗ duy nhất hiện lỗi của thao tác. */
  const dong = busy ? () => {} : onClose;
  return (
    <Modal open={open} onClose={dong} title={title} width="max-w-md" z={z}
      footer={
        <>
          <button className="btn min-h-[44px] sm:min-h-0" onClick={dong} disabled={busy}>{closeLabel}</button>
          <button className={`btn min-h-[44px] sm:min-h-0 ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy || confirmDisabled} title={confirmDisabled ? confirmTitle : undefined}>
            {busy ? t('Đang xử lý…') : confirmLabel}
          </button>
        </>
      }>
      <div className="text-sm text-slate-300 leading-relaxed">{body}</div>
    </Modal>
  );
}
