import type { ReactNode } from 'react';

/** U01 #5 / #11 (khung A3) · N64: dải vàng "đang làm thay" đầu panel (chữ do nơi gọi soạn) — không nút: mở là làm. */
export function DaiLamThay({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2 text-sm" role="status" style={{ background: 'rgb(var(--soon-bg-rgb))', borderColor: 'rgb(var(--soon-line-rgb))' }}>
      <b className="font-semibold text-soon">{children}</b>
    </div>
  );
}
