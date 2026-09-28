import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useGiuFocus } from './giuFocus.ts';

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-2xl' }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode;
  children: ReactNode; footer?: ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative h-full w-full ${width} bg-[#0b141d] border-l flex flex-col shadow-2xl`} style={{ borderColor: 'var(--line-strong)' }}>
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-100 truncate">{title}</h2>
            {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Đóng">✕</button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--line)' }}>{footer}</footer>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return <KhungModal onClose={onClose} title={title} footer={footer} width={width}>{children}</KhungModal>;
}

/** Tách khỏi `Modal` để hook giữ focus chạy đúng lúc mở/đóng (Modal trả `null` khi `open = false`). */
function KhungModal({ onClose, title, children, footer, width }: {
  onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width: string;
}) {
  const khung = useRef<HTMLDivElement>(null);
  useGiuFocus(khung);
  const idTen = useId();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={idTen}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={khung} tabIndex={-1} className={`relative w-full ${width} card shadow-2xl max-h-[88vh] flex flex-col outline-none`}>
        <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 id={idTen} className="text-sm font-semibold text-slate-100">{title}</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Đóng">✕</button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <footer className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--line)' }}>{footer}</footer>}
      </div>
    </div>
  );
}

/** Xác nhận rõ ràng cho thao tác không dùng autosave (chuyển lớp, cảnh báo, import, đổi quyền). */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = 'Xác nhận', danger, busy }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string;
  body: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : confirmLabel}
          </button>
        </>
      }>
      <div className="text-sm text-slate-300 leading-relaxed">{body}</div>
    </Modal>
  );
}
