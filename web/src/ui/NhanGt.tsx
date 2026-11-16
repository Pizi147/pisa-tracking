import type { ReactNode } from 'react';

/* TD-NGUOI-2: tách khỏi `DauTrangLop.tsx` — hồ sơ HV dùng mà không kéo cả đầu trang lớp vào mảnh của nó. */
/** Nhãn nhỏ xám trên, giá trị đậm dưới (mockup `.nhan-gt`, P2) — hồ sơ lớp + hồ sơ HV. */
export function NhanGt({ n, g }: { n: ReactNode; g: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-px">
      <span className="text-xs font-medium text-slate-500">{n}</span>
      <span className="text-[15px] font-bold text-slate-100">{g}</span>
    </span>
  );
}
