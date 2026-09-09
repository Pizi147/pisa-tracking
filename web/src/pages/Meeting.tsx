import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Modal } from '../components/Drawer.tsx';
import { usePeriods } from '../components/Filters.tsx';
import { dueLabel, dueTone, fmtDate, taskProgressLabel, taskTypeLabel, unitStatusLabel, unitTone } from '../lib/format.ts';
import { TASK_PROGRESS, TASK_TYPES, UNIT_STATUSES } from '@shared/domain.ts';

type Board = {
  period: { id: number; code: string; range: string };
  units: {
    unitId: number; unitName: string; unitCode: string; kind: string; branchId: number | null;
    cells: { key: string; label: string; hint: string; status: string | null; note: string | null; reporterName: string | null }[];
    reported: number; total: number; canEdit: boolean;
  }[];
  totals: { total: number; ok: number; watch: number; problem: number; notReported: number };
};

type Task = {
  id: number; code: string; title: string; taskType: string;
  unitId: number | null; unitName: string | null; assigneeId: number | null; assigneeName: string | null;
  dueDate: string | null; progress: string; note: string | null; dueState: string;
  periodId: number | null; periodCode: string | null; sourceSosCaseId: number | null; canEdit: boolean;
};

const TASK_VIEWS = [
  { key: '', label: 'Tất cả' },
  { key: 'open', label: 'Chưa xong' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'mine', label: 'Của tôi' },
  { key: 'done', label: 'Đã xong' },
];

export default function MeetingPage() {
  const { session } = useSession();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [view, setView] = useState('open');
  const [taskOpen, setTaskOpen] = useState<Task | 'new' | null>(null);

  useEffect(() => {
    if (periodId === null && periods.data?.length) {
      const cur = periods.data.find((p) => p.weekStart <= session!.demoDate && p.weekEnd >= session!.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  const board = useApi<Board>(periodId ? `/meeting/board?periodId=${periodId}` : null);
  const tasksQs = useMemo(() => {
    const p = new URLSearchParams();
    if (periodId) p.set('periodId', String(periodId));
    if (view) p.set('view', view);
    return `/tasks?${p.toString()}`;
  }, [periodId, view]);
  const tasks = useApi<{ rows: Task[]; scopeEmpty: boolean }>(tasksQs);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Họp tuần</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tình hình từng đơn vị và công việc theo dõi — thay cho thao tác trên workbook.</p>
        </div>
        <label className="block">
          <span className="label">Kỳ họp</span>
          <select className="field w-56" value={periodId ?? ''} onChange={(e) => setPeriodId(Number(e.target.value))}>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
      </div>

      {board.loading && <Skeleton rows={6} />}

      {board.data && (
        <Card
          title="Tình hình đơn vị"
          action={
            <span className="text-xs text-slate-400 flex flex-wrap gap-2">
              <Pill tone="muted">Chưa báo cáo {board.data.totals.notReported}</Pill>
              <Pill tone="ok">Ổn {board.data.totals.ok}</Pill>
              <Pill tone="warn">Cần theo dõi {board.data.totals.watch}</Pill>
              <Pill tone="danger">Có vấn đề {board.data.totals.problem}</Pill>
              <span className="text-slate-500">trên {board.data.totals.total} mục</span>
            </span>
          }
          bodyClass="p-0"
        >
          {board.data.units.length === 0 ? (
            <Empty title="Bạn không có đơn vị nào trong phạm vi được cấp" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {board.data.units.map((u) => (
                <UnitRow key={u.unitId} unit={u} periodId={periodId!} onSaved={board.reload} />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card
        title="Công việc"
        action={
          <div className="flex flex-wrap items-center gap-1">
            {TASK_VIEWS.map((v) => (
              <button key={v.key} className={`btn btn-sm ${view === v.key ? 'btn-primary' : ''}`} onClick={() => setView(v.key)}>{v.label}</button>
            ))}
            <button className="btn btn-sm btn-primary ml-2" onClick={() => setTaskOpen('new')}>Thêm việc</button>
          </div>
        }
        bodyClass="p-0"
      >
        {tasks.loading && <div className="p-4"><Skeleton rows={4} /></div>}
        {tasks.data && tasks.data.rows.length === 0 && (
          <Empty title="Không có công việc nào khớp bộ lọc" hint="Chọn “Tất cả” để xem cả việc đã xong." />
        )}
        {tasks.data && tasks.data.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Mã</th>
                  <th className="th">Nội dung</th>
                  <th className="th">Đơn vị</th>
                  <th className="th">Phụ trách</th>
                  <th className="th">Hạn</th>
                  <th className="th">Tiến độ</th>
                  <th className="th">Loại</th>
                  <th className="th">Kỳ</th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.rows.map((t) => (
                  <tr key={t.id} className="row-hover cursor-pointer" onClick={() => setTaskOpen(t)}>
                    <td className="td text-xs text-slate-500 whitespace-nowrap">{t.code}</td>
                    <td className="td text-slate-100">
                      {t.title}
                      {t.sourceSosCaseId && <Pill tone="info">Từ case SOS</Pill>}
                    </td>
                    <td className="td text-slate-300 whitespace-nowrap">{t.unitName ?? '—'}</td>
                    <td className="td text-slate-300 whitespace-nowrap">{t.assigneeName ?? 'Chưa giao'}</td>
                    <td className="td whitespace-nowrap">
                      <span className="text-slate-300">{fmtDate(t.dueDate)}</span>
                      <div><Pill tone={dueTone(t.dueState)}>{dueLabel(t.dueState)}</Pill></div>
                    </td>
                    <td className="td whitespace-nowrap">{taskProgressLabel(t.progress)}</td>
                    <td className="td whitespace-nowrap text-slate-400 text-xs">{taskTypeLabel(t.taskType)}</td>
                    <td className="td whitespace-nowrap text-slate-500 text-xs">{t.periodCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3">
          <SectionNote>
            Việc chưa xong từ kỳ trước giữ nguyên mã và lịch sử, không nhân bản sang tuần mới. Việc dài hạn chưa xong
            và việc quá hạn/sắp đến hạn được xét xuyên kỳ. Việc không có hạn không bao giờ bị tính quá hạn.
          </SectionNote>
        </div>
      </Card>

      {taskOpen && (
        <TaskModal
          task={taskOpen === 'new' ? null : taskOpen}
          periodId={periodId}
          onClose={() => setTaskOpen(null)}
          onSaved={() => { tasks.reload(); invalidate('/overview'); }}
        />
      )}
    </div>
  );
}

function UnitRow({ unit, periodId, onSaved }: { unit: Board['units'][number]; periodId: number; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-wrap items-center gap-3"
        onClick={() => setOpen((o) => !o)}>
        <span className="font-medium text-slate-100 w-40 shrink-0">{unit.unitName}</span>
        {unit.kind !== 'branch' && <Pill tone="neutral">Đơn vị độc lập</Pill>}
        <span className="flex flex-wrap gap-1.5 flex-1">
          {unit.cells.map((c) => (
            <Pill key={c.key} tone={unitTone(c.status)}>{c.label}: {unitStatusLabel(c.status)}</Pill>
          ))}
        </span>
        <span className="text-xs text-slate-500 shrink-0">{unit.reported}/{unit.total} đã báo cáo</span>
        <span className="text-slate-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 md:grid-cols-3">
          {unit.cells.map((c) => (
            <CellEditor key={c.key} unitId={unit.unitId} periodId={periodId} cell={c} canEdit={unit.canEdit} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

function CellEditor({ unitId, periodId, cell, canEdit, onSaved }: {
  unitId: number; periodId: number; cell: Board['units'][number]['cells'][number];
  canEdit: boolean; onSaved: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<string>(cell.status ?? '');
  const [note, setNote] = useState(cell.note ?? '');
  const [busy, setBusy] = useState(false);
  const dirty = status !== (cell.status ?? '') || note !== (cell.note ?? '');

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/meeting/units/${unitId}/reports/${cell.key}`, { periodId, status: status || null, note });
      invalidate('/meeting'); invalidate('/overview');
      onSaved();
      toast.push('ok', `Đã lưu: ${cell.label}`);
    } catch (e: any) {
      toast.push('error', e.message);      // giữ nguyên nội dung đang gõ
    } finally { setBusy(false); }
  };

  return (
    <div className="surface-2 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-slate-100">{cell.label}</strong>
        <Pill tone={unitTone(cell.status)}>{unitStatusLabel(cell.status)}</Pill>
      </div>
      {cell.hint && <p className="text-[11px] text-slate-500 m-0">{cell.hint}</p>}
      <select className="field" value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Chưa báo cáo</option>
        {UNIT_STATUSES.map((s) => <option key={s} value={s}>{unitStatusLabel(s)}</option>)}
      </select>
      <textarea className="field" rows={2} value={note} disabled={!canEdit}
        onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú ngắn, có thông tin cụ thể" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">{cell.reporterName ? `Người báo cáo: ${cell.reporterName}` : 'Chưa có người báo cáo'}</span>
        {canEdit && <button className="btn btn-sm btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</button>}
      </div>
    </div>
  );
}

function TaskModal({ task, periodId, onClose, onSaved }: {
  task: Task | null; periodId: number | null; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const units = useApi<any[]>('/ref/units');
  const users = useApi<any[]>('/ref/users');
  const [title, setTitle] = useState(task?.title ?? '');
  const [unitId, setUnitId] = useState<number | null>(task?.unitId ?? null);
  const [assigneeId, setAssigneeId] = useState<number | null>(task?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [progress, setProgress] = useState(task?.progress ?? 'not_started');
  const [taskType, setTaskType] = useState(task?.taskType ?? 'in_period');
  const [note, setNote] = useState(task?.note ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (task) {
        await api.patch(`/tasks/${task.id}`, { title, unitId, assigneeUserId: assigneeId, dueDate: dueDate || null, progress, taskType, note });
      } else {
        await api.post('/tasks', { title, unitId, assigneeUserId: assigneeId, dueDate: dueDate || null, taskType, note, periodId });
      }
      invalidate('/tasks'); invalidate('/overview');
      onSaved(); onClose();
      toast.push('ok', task ? 'Đã cập nhật công việc' : 'Đã thêm công việc');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const readOnly = !!task && !task.canEdit;

  return (
    <Modal open onClose={onClose} title={task ? `${task.code} · ${task.title}` : 'Thêm công việc'} width="max-w-xl"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        {!readOnly && <button className="btn btn-primary" onClick={submit} disabled={busy || !title.trim()}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>}
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Nội dung</span>
          <input className="field" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Đơn vị</span>
            <select className="field" value={unitId ?? ''} disabled={readOnly} onChange={(e) => setUnitId(Number(e.target.value) || null)}>
              <option value="">Không gắn đơn vị</option>
              {(units.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Người phụ trách</span>
            <select className="field" value={assigneeId ?? ''} disabled={readOnly} onChange={(e) => setAssigneeId(Number(e.target.value) || null)}>
              <option value="">Chưa giao</option>
              {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Hạn</span>
            <input type="date" className="field" value={dueDate ?? ''} disabled={readOnly} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Loại</span>
            <select className="field" value={taskType} disabled={readOnly} onChange={(e) => setTaskType(e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{taskTypeLabel(t)}</option>)}
            </select>
          </label>
          {task && (
            <label className="block">
              <span className="label">Tiến độ</span>
              <select className="field" value={progress} onChange={(e) => setProgress(e.target.value)}>
                {TASK_PROGRESS.map((p) => <option key={p} value={p}>{taskProgressLabel(p)}</option>)}
              </select>
            </label>
          )}
        </div>
        <label className="block">
          <span className="label">Ghi chú</span>
          <textarea className="field" rows={2} value={note ?? ''} onChange={(e) => setNote(e.target.value)} />
        </label>
        {task?.sourceSosCaseId && (
          <SectionNote>Công việc này sinh từ một case SOS và giữ liên kết tới lần Mock gốc.</SectionNote>
        )}
        {readOnly && <SectionNote>Bạn chỉ xem được công việc này. Người được giao và quản lý đơn vị mới cập nhật được.</SectionNote>}
      </div>
    </Modal>
  );
}
