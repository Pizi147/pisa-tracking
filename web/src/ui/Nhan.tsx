import type { ReactNode } from 'react';
import { nhanQuaHan } from '@shared/domain/index.ts';

/**
 * "⚠ quá hạn 15 ngày" — chữ đỏ cam đậm, KHÔNG nền, KHÔNG khung (B-3). ⚠ chỉ nghĩa quá hạn (G-4).
 * `gon` bỏ chữ "quá hạn" ("⚠ 15 ngày") cho chỗ đã có tiêu đề nói rõ.
 */
export function QuaHan({ ngay, gon }: { ngay: number | null; gon?: boolean }) {
  return <span className="whitespace-nowrap font-bold text-late">⚠ {nhanQuaHan(ngay, gon)}</span>;
}

export type ToneNhan = 'ok' | 'done' | 'bad' | 'soon' | 'doing' | 'wait' | 'muted';

const NHAN: Record<ToneNhan, string> = {
  ok: 'bg-ok-bg text-ok', done: 'bg-done-bg text-done', bad: 'bg-bad-bg text-bad', soon: 'bg-soon-bg text-soon',
  doing: 'bg-doing-bg text-doing', wait: 'bg-wait-bg text-wait', muted: 'bg-muted-bg text-muted',
};

/**
 * MỘT BADGE = MỘT TRẠNG THÁI NGẮN (≤ 3 từ + số; B-1). Xanh dương = đang chạy · vàng = chờ / cần chú ý ·
 * xám = chưa bắt đầu, thông tin · xanh lá = ổn · đỏ = chỉ SOS 3 và "Chưa đạt" · viền đứt (`dut`) = số tạm.
 * Có `onClick` thì là nút (≥ 28px cao); không thì chỉ là chữ.
 */
export function Nhan({ tone, dut, title, onClick, children }: {
  tone: ToneNhan; dut?: boolean; title?: string; onClick?: () => void; children: ReactNode;
}) {
  const cls = `inline-flex items-center rounded-full px-[7px] text-[10.5px] font-bold leading-4 whitespace-nowrap ${NHAN[tone]} ${
    dut ? 'bg-transparent border border-dashed border-current' : ''}`;
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={`${cls} min-h-[28px] hover:brightness-125`}>{children}</button>
    );
  }
  return <span title={title} className={cls}>{children}</span>;
}
