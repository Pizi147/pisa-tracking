import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, resolveWeek, usePeriodWindow } from '../../ui/Filters.tsx';
import { attemptStatusLabel } from '../../lib/format.ts';
import { tuanLich } from '@shared/domain/index.ts';

type Dong = {
  id: number; studentId: number; studentName: string; studentCode: string; classCode: string | null;
  kind: 'mock' | 'progress' | 'final'; attemptNo: number | null; status: string;
  period: { weekStart: string } | null;
};

const tenBai = (r: Dong) => (r.kind === 'mock' ? `MT${r.attemptNo}` : r.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá');

/** Test › Lịch Test — khung O2: các lượt Test của một tuần, trong phạm vi được xem. Chỉ đọc. */
export function LichTestTab() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const [periodId, setPeriodId] = useState<number | null>(null);
  const win = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId !== null || !win.data?.length) return;
    const cur = win.data.find((p) => p.isAnchor);
    if (!cur) return;
    if (cur.id !== null) { setPeriodId(cur.id); return; }
    let cancelled = false;
    void resolveWeek(cur.weekStart).then((r) => { if (!cancelled) setPeriodId(r.id); });
    return () => { cancelled = true; };
  }, [win.data, periodId]);

  const { data, loading, error, reload } = useApi<{ rows: Dong[]; scopeEmpty: boolean }>(
    periodId ? `/attempts?periodId=${periodId}${branchId ? `&branchId=${branchId}` : ''}` : null, [periodId, branchId],
  );
  const setBranch = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('branchId', String(id)); else next.delete('branchId');
    setParams(next, { replace: true });
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần" />
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={setBranch} />
      </div>
      {(loading || !periodId) && <Skeleton rows={6} />}
      {data && (
        <Card bodyClass="p-0">
          {data.rows.length === 0 ? (
            <Empty title="Tuần này không có lượt Test nào" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 560 }}>
                <colgroup><col /><col style={{ width: 120 }} /><col style={{ width: 96 }} /><col style={{ width: 96 }} /><col style={{ width: 140 }} /></colgroup>
                <thead>
                  <tr>
                    <th className="th">Học viên</th><th className="th">Lớp</th><th className="th">Bài</th>
                    <th className="th">Tuần</th><th className="th">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td">
                        <Link className="link" to={`/hoc-vien/${r.studentId}`}>{r.studentName}</Link>
                        <span className="ml-1.5 text-[11px] text-slate-500 tabular-nums">{r.studentCode}</span>
                      </td>
                      <td className="td whitespace-nowrap text-slate-300">{r.classCode ?? '—'}</td>
                      <td className="td whitespace-nowrap tabular-nums" title={r.kind === 'mock' ? 'Mock Test' : undefined}>{tenBai(r)}</td>
                      <td className="td whitespace-nowrap tabular-nums text-slate-300">{tuanLich(r.period?.weekStart, session?.demoDate)}</td>
                      <td className="td whitespace-nowrap text-slate-300">{attemptStatusLabel(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
