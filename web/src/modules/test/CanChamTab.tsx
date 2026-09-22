import { useSearchParams } from 'react-router-dom';
import { BranchFilter } from '../../ui/Filters.tsx';
import { WorkQueue } from '../students/StudentsPage.tsx';
import { WORK_SCOPES, WORK_SCOPE_HINT, WORK_SCOPE_LABEL, type WorkScope } from '@shared/domain/index.ts';

/** Test › Cần chấm — khung O2. Bọc hàng đợi chấm đang có; PR-Rc1 làm lại theo 05a2. */
export function CanChamTab() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const raw = params.get('scope');
  const scope: WorkScope | null = (WORK_SCOPES as readonly string[]).includes(raw ?? '') ? (raw as WorkScope) : null;
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="flex flex-wrap gap-1">
          {WORK_SCOPES.map((s) => (
            <button key={s} type="button" title={WORK_SCOPE_HINT[s]}
              className={`btn btn-sm ${scope === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => set('scope', s)}>{WORK_SCOPE_LABEL[s]}</button>
          ))}
        </span>
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={(id) => set('branchId', id ? String(id) : null)} />
      </div>
      <WorkQueue view="my_scores" branchId={branchId} q="" scope={scope} />
    </div>
  );
}
