import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { WorkList, type WorkGroup, type WorkItem } from '../worklist/WorkList.tsx';

type Work = {
  summary: { total: number; overdue: number; today: number; approval: number; mine: number };
  items: WorkItem[];
  groups: WorkGroup[];
  scopeEmpty: boolean;
};

/** Công việc › Hỗ trợ học viên — khung R1. Nội dung giữ như danh sách việc ở Tổng quan; PR-Ra làm lại theo §3.4. */
export function HoTroHocVienTab() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const workGroup = params.get('viec');
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const { data, loading, error, reload } = useApi<Work>(`/my-work${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
      </div>
      {loading && <Skeleton rows={8} />}
      {data && (data.scopeEmpty || data.summary.total === 0) && (
        <Card>
          <Empty title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'} />
        </Card>
      )}
      {data && data.summary.total > 0 && (
        <WorkList key={workGroup ?? 'all'} data={data} defaultGroup={workGroup} onGroup={(g) => setParam('viec', g)} />
      )}
    </div>
  );
}
