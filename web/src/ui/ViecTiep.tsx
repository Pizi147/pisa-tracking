import type { ViecTiepTheo } from '@shared/domain/index.ts';
import { QuaHan } from './Nhan.tsx';

/**
 * MỘT VIỆC Ở CỘT "VIỆC TIẾP THEO" (PR-UX3, B-2/B-3): chữ việc không khung, sau đó hoặc "⚠ quá hạn 3 ngày" đỏ (quá hạn; PR-N1 A6
 * luôn đủ chữ, không dạng gọn) hoặc "· hết T2 14/09" mờ. Câu đầy đủ ở tooltip. Không badge — việc là chữ, badge dành cho trạng thái.
 */
export function ViecTiep({ v }: { v: ViecTiepTheo }) {
  return (
    <span className="block truncate text-xs text-slate-200" title={v.title}>
      {v.viec}
      {v.quaHanNgay !== null ? <> <QuaHan ngay={v.quaHanNgay} /></>
        : v.han ? <span className="text-slate-500"> · {v.han}</span> : null}
    </span>
  );
}

/** Tối đa 2 việc, phần còn lại gom "+n việc" (tooltip liệt kê). */
export function DanhSachViecTiep({ viec }: { viec: readonly ViecTiepTheo[] }) {
  if (viec.length === 0) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-col items-start gap-0.5">
      {viec.slice(0, 2).map((v) => <ViecTiep key={v.viec} v={v} />)}
      {viec.length > 2 && (
        <span className="text-[10px] text-slate-500" title={viec.slice(2).map((v) => v.title).join(' · ')}>+{viec.length - 2} việc</span>
      )}
    </span>
  );
}
