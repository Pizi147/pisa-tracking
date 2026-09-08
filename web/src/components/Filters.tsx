import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';

export type Period = { id: number; code: string; weekStart: string; weekEnd: string; range: string };
export type Branch = { id: number; code: string; name: string };

export function usePeriods() {
  return useApi<Period[]>('/ref/periods');
}

/**
 * Bộ lọc mặc định là TUẦN. Bộ lọc chi nhánh chỉ xuất hiện khi tài khoản thật sự
 * có nhiều hơn một chi nhánh — không đặt dropdown thừa trên mọi trang.
 */
export function WeekBranchFilter({ periodId, onPeriod, branchId, onBranch, children }: {
  periodId: number | null; onPeriod: (id: number) => void;
  branchId?: number | null; onBranch?: (id: number | null) => void;
  children?: React.ReactNode;
}) {
  const periods = usePeriods();
  const branches = useApi<Branch[]>(onBranch ? '/ref/branches' : null);
  const { branchCount } = useSession();
  const showBranch = !!onBranch && (branches.data?.length ?? 0) > 1 && branchCount > 1;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="label">Tuần</span>
        <select className="field w-56" value={periodId ?? ''} onChange={(e) => onPeriod(Number(e.target.value))}>
          {(periods.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.code} · {p.range}</option>
          ))}
        </select>
      </label>
      {showBranch && (
        <label className="block">
          <span className="label">Chi nhánh</span>
          <select className="field w-44" value={branchId ?? ''} onChange={(e) => onBranch!(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Tất cả chi nhánh</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}
      {children}
    </div>
  );
}
