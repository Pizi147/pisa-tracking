import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invalidate } from '../../lib/api.ts';
import { Card } from '../../ui/ui.tsx';
import { MockPlanPanel } from '../fasttrack/MockPlanPanel.tsx';

/** Test › Kế hoạch Test — khung O2 (chỉ người có quyền xếp tuần). Mở panel xếp lịch đang có; PR-Rc2 làm lại theo 05b. */
export function KeHoachTestTab() {
  const [params] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const classId = params.get('classId') ? Number(params.get('classId')) : null;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card title="Chưa có tuần MT tiếp theo" bodyClass="p-4">
        <p className="text-sm text-slate-400 mt-0 mb-3">Xếp tuần Mock Test cho nhiều học viên một lần.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Xếp lịch hàng loạt…</button>
      </Card>
      {open && (
        <MockPlanPanel branchId={branchId} classId={classId} onClose={() => setOpen(false)}
          onDone={() => { invalidate('/attempts'); invalidate('/classes'); }} />
      )}
    </>
  );
}
