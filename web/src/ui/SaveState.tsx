import { Alert, Status } from './ui.tsx';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error?: string; onRetry?: () => void }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <Status kind="doing">Đang lưu…</Status>;
  /* "Đã lưu" là việc xong, không phải điểm tốt — nên xám, không xanh lá (mục 2.2). */
  if (status === 'saved') return <Status kind="done">Đã lưu</Status>;
  return (
    <span className="inline-flex items-center gap-1">
      <Alert title={error}>Lưu lỗi</Alert>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Thử lại</button>}
    </span>
  );
}
