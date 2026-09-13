import { Pill } from './ui.tsx';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error?: string; onRetry?: () => void }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <Pill tone="info">Đang lưu…</Pill>;
  if (status === 'saved') return <Pill tone="ok">Đã lưu</Pill>;
  return (
    <span className="inline-flex items-center gap-1">
      <Pill tone="danger" title={error}>Lưu lỗi</Pill>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Thử lại</button>}
    </span>
  );
}
