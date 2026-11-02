import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
    /* 6c-2 (critique 375): bàn phím ảo mở (ô lý do autoFocus) → hộp căn giữa phần màn còn thấy, không để chân hộp dưới bàn phím (`--ban-phim` của KhungPanel). */
    <div className={`fixed inset-0 !mt-0 ${z} flex items-center justify-center p-4`} style={{ bottom: 'var(--ban-phim, 0px)' }} role="dialog" aria-modal="true" aria-labelledby={idTen}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={khung} tabIndex={-1} className={`relative w-full ${width} card shadow-2xl max-h-full flex flex-col -outline-offset-2`}>
        <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 id={idTen} className="m-0 text-[17px] font-bold leading-6 text-slate-100">{title}</h2>
          <button className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-0 sm:min-w-0" onClick={onClose} aria-label={t('Đóng')}>✕</button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <footer className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--line)' }}>{footer}</footer>}
      </div>
    </div>
  );
}

/** T16 (mockup `cong-viec.html` `.hop-hoi`): hộp nhỏ, "Ở lại" là nút chính và nhận focus; bỏ chữ là nút thường nói rõ việc sẽ làm. `tieuDe` + `than`: nháp không phải chữ gõ. */
export function HopBoChu({ viec, tieuDe, than, nut, onO, onBo }: { viec?: string; tieuDe?: string; than?: string; nut: string; onO: () => void; onBo: () => void }) {
  const oLai = useRef<HTMLButtonElement>(null);
  useEffect(() => { oLai.current?.focus(); }, []);   // sau effect giữ focus của Modal (con chạy trước) — focus vào "Ở lại"
  return (
    <Modal open onClose={onO} title={tieuDe ?? t('Bỏ chữ đang gõ?')} width="max-w-[420px]" z="z-[70]"
      footer={<>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onBo}>{nut}</button>
        <button ref={oLai} type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onO}>{t('Ở lại')}</button>
      </>}>
      <p className="m-0 text-sm text-slate-300">{than ?? t('{viec} chưa lưu — chữ đang gõ sẽ mất.', { viec })}</p>
    </Modal>
  );
}

/** Xác nhận rõ ràng cho thao tác không dùng autosave (chuyển lớp, cảnh báo, import, đổi quyền). */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = t('Xác nhận'), danger, busy, closeLabel = t('Đóng'), z, confirmDisabled, confirmTitle, daSua, busyLabel = t('Đang xử lý…') }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string;
  body: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
  closeLabel?: string; z?: string;
  /** Nút xác nhận mờ (ví dụ ô lý do bắt buộc còn trống). */
  confirmDisabled?: boolean;
  /** Tooltip nút xác nhận — nói vì sao đang mờ (ví dụ câu lỗi của ô lý do). */
  confirmTitle?: string;
  /** 6c-2 (bảng kê lỗi 5 + 9): hộp có ô lý do đang gõ — Esc / nền / ✕ / Đóng hỏi MỘT lần (`HopBoChu`), không mất chữ âm thầm. */
  daSua?: boolean;
  /** 6c-2: chữ nút xác nhận khi đang chạy — nói đúng việc ("Đang xoá…", "Đang gửi…"). */
  busyLabel?: string;
}) {
  const [hoi, setHoi] = useState(false);
  /* OV-14a (F11): đang chạy thì Esc / bấm nền / ✕ không đóng — hộp là chỗ duy nhất hiện lỗi của thao tác. */
  const dong = busy ? () => {} : daSua ? () => setHoi(true) : onClose;
  return (
    <Modal open={open} onClose={dong} title={title} width="max-w-md" z={z}
      footer={
        <>
          <button className="btn min-h-[44px] sm:min-h-0" onClick={dong} disabled={busy}>{closeLabel}</button>
          <button className={`btn min-h-[44px] sm:min-h-0 ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy || confirmDisabled} title={confirmDisabled ? confirmTitle : undefined}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </>
      }>
      <div className="text-sm text-slate-300 leading-relaxed">{body}</div>
      {hoi && <HopBoChu viec={t('Lý do')} nut={t('Bỏ chữ, đóng')} onO={() => setHoi(false)} onBo={() => { setHoi(false); onClose(); }} />}
    </Modal>
  );
}
