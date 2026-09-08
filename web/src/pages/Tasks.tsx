import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Drawer, Modal } from '../components/Drawer.tsx';
import { deadlineLabel, fmtDate, fmtDateTime, priorityLabel, taskStatusLabel } from '../lib/format.ts';
import { PRIORITIES, TASK_STATUSES } from '@shared/domain.ts';

const VIEWS = [
  { key: '', label: 'Tất cả' },
  { key: 'mine', label: 'Của tôi' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'due_soon', label: 'Sắp đến hạn' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'paused', label: 'Tạm dừng' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'long_running', label: 'Công việc kéo dài' },
];

export default function TasksPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const [layout, setLayout] = useState<'table' | 'board'>('table');
  const [createOpen, setCreateOpen] = useState(false);

  const view = params.get('view') ?? '';
  const branchId = params.get('branchId') ?? '';
  const openId = params.get('open');

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (view) qs.set('view', view);
  if (branchId) qs.set('branchId', branchId);

  const tasks = useApi<any>(`/tasks?${qs}`);
  const branches = useApi<any[]>('/ref/branches');
  const canCreate = !!session?.capabilities?.manageTasks;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {VIEWS.map((v) => (
            <button key={v.key} className={`btn btn-sm ${view === v.key ? 'btn-primary' : ''}`} onClick={() => set('view', v.key)}>{v.label}</button>
          ))}
        </div>
        <div className="flex-1" />
        <select className="field w-44" value={branchId} onChange={(e) => set('branchId', e.target.value)}>
          <option value="">Tất cả chi nhánh</option>
          {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex gap-1 card p-0.5">
          <button className={`btn btn-sm ${layout === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLayout('table')}>Bảng</button>
          <button className={`btn btn-sm ${layout === 'board' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLayout('board')}>Cột trạng thái</button>
        </div>
        {canCreate && <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>Tạo công việc</button>}
      </div>

      {tasks.loading && <Skeleton rows={7} />}
      {tasks.error && <ErrorState message={tasks.error.message} onRetry={tasks.reload} />}
      {tasks.data && (tasks.data.rows.length === 0 ? (
        <Card><Empty title="Không có công việc nào khớp bộ lọc"
          hint={view === 'long_running' ? `Ngưỡng "kéo dài" hiện là ${tasks.data.longRunningDays} ngày kể từ ngày tạo, cấu hình được trong Quản trị.` : undefined} /></Card>
      ) : layout === 'table' ? (
        <Card bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th sticky-col">Công việc</th><th className="th">Người thực hiện</th><th className="th">Hạn</th>
                <th className="th">Trạng thái</th><th className="th">Ưu tiên</th><th className="th">Nguồn</th><th className="th">Chi nhánh</th>
              </tr></thead>
              <tbody>
                {tasks.data.rows.map((t: any) => (
                  <tr key={t.id} className="row-hover">
                    <td className="td sticky-col">
                      <button className="link text-left" onClick={() => set('open', String(t.id))}>{t.title}</button>
                      <div className="text-[11px] text-slate-500">{t.code}
                        {t.ageDays >= tasks.data.longRunningDays && t.status !== 'completed' && <span className="text-amber-400 ml-1">· kéo dài {t.ageDays} ngày</span>}
                      </div>
                    </td>
                    <td className="td text-slate-300 text-xs">{t.assigneeName ?? <span className="text-slate-600">Chưa giao</span>}</td>
                    <td className="td">
                      <Pill tone={t.deadlineState === 'overdue' ? 'danger' : t.deadlineState === 'due_soon' ? 'warn' : t.deadlineState === 'closed' ? 'neutral' : t.deadlineState === 'no_deadline' ? 'muted' : 'ok'}>
                        {deadlineLabel(t.deadlineState)}
                      </Pill>
                      {t.deadline && <div className="text-[11px] text-slate-500 mt-0.5">{fmtDate(t.deadline)}</div>}
                    </td>
                    <td className="td">
                      <Pill tone={t.status === 'completed' ? 'ok' : t.status === 'paused' ? 'warn' : t.status === 'in_progress' ? 'info' : 'neutral'}>
                        {taskStatusLabel(t.status)}
                      </Pill>
                      {t.pausedReason && <div className="text-[11px] text-slate-500 mt-0.5 max-w-[14rem]">{t.pausedReason}</div>}
                    </td>
                    <td className="td text-xs">{priorityLabel(t.priority)}</td>
                    <td className="td text-xs text-slate-400">
                      {t.issue ? <button className="link" onClick={() => set('open', String(t.id))}>Vấn đề {t.issue.code}</button>
                        : t.meetingLabel ? 'Cuộc họp' : 'Nhập tay'}
                      {t.student && <div><Link to={`/hoc-vien/${t.student.id}`} className="link">{t.student.name}</Link></div>}
                    </td>
                    <td className="td text-xs text-slate-400">{t.branchName ?? t.unitName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {TASK_STATUSES.map((st) => {
            const rows = tasks.data.rows.filter((t: any) => t.status === st);
            return (
              <Card key={st} title={<span>{taskStatusLabel(st)} <span className="text-slate-500 font-normal">({rows.length})</span></span>} bodyClass="p-2 space-y-2">
                {rows.length === 0 && <div className="text-xs text-slate-500 p-2">Không có công việc.</div>}
                {rows.map((t: any) => (
                  <button key={t.id} className="w-full text-left card p-2.5 hover:border-teal-500/40" onClick={() => set('open', String(t.id))}>
                    <div className="text-sm text-slate-100">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{t.code} · {t.assigneeName ?? 'chưa giao'}</div>
                    <div className="mt-1.5">
                      <Pill tone={t.deadlineState === 'overdue' ? 'danger' : t.deadlineState === 'due_soon' ? 'warn' : t.deadlineState === 'no_deadline' ? 'muted' : 'ok'}>
                        {deadlineLabel(t.deadlineState)}{t.deadline ? ` · ${fmtDate(t.deadline)}` : ''}
                      </Pill>
                    </div>
                  </button>
                ))}
              </Card>
            );
          })}
        </div>
      ))}

      <SectionNote>
        Trạng thái hạn (Quá hạn / Sắp đến hạn / Trong hạn) do hệ thống tính theo ngày nghiệp vụ Asia/Ho_Chi_Minh, không nhập tay.
        "Công việc kéo dài" là bộ lọc theo ngưỡng cấu hình, không phải một trạng thái nghiệp vụ mới.
      </SectionNote>

      {openId && <TaskDrawer taskId={Number(openId)} onClose={() => set('open', '')} onChanged={tasks.reload} />}
      {createOpen && <CreateTaskDialog onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); tasks.reload(); }} />}
    </div>
  );
}

function TaskDrawer({ taskId, onClose, onChanged }: { taskId: number; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const detail = useApi<any>(`/tasks/${taskId}`);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [deadlineReason, setDeadlineReason] = useState('');

  if (detail.loading) return <Drawer open onClose={onClose} title="Đang tải…"><Skeleton rows={5} /></Drawer>;
  if (detail.error) return <Drawer open onClose={onClose} title="Không mở được"><ErrorState message={detail.error.message} hint={detail.error.hint} /></Drawer>;
  const t = detail.data!;

  const save = async (patch: any, okMsg: string) => {
    setBusy(true);
    try {
      await api.patch(`/tasks/${taskId}`, patch);
      invalidate('/tasks'); invalidate('/dashboard'); invalidate('/meetings');
      detail.reload(); onChanged();
      toast.push('ok', okMsg);
    } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
    finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={t.title} subtitle={`${t.code} · ${t.branchName ?? ''}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <Pill tone={t.status === 'completed' ? 'ok' : t.status === 'paused' ? 'warn' : 'info'}>{taskStatusLabel(t.status)}</Pill>
          <Pill tone={t.deadlineState === 'overdue' ? 'danger' : t.deadlineState === 'due_soon' ? 'warn' : t.deadlineState === 'no_deadline' ? 'muted' : 'ok'}>
            {deadlineLabel(t.deadlineState)}
          </Pill>
          <span className="text-xs text-slate-400">Người thực hiện: {t.assigneeName ?? 'chưa giao'}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><div className="label">Hạn hiện tại</div><div className="text-slate-200">{t.deadline ? fmtDate(t.deadline) : 'Chưa có hạn'}</div></div>
          <div><div className="label">Hạn ban đầu</div><div className="text-slate-200">{t.originalDeadline ? fmtDate(t.originalDeadline) : 'Chưa có hạn'}</div></div>
          <div><div className="label">Ngày tạo</div><div className="text-slate-200">{fmtDate(t.createdAt)} · {t.creatorName}</div></div>
          <div><div className="label">Nguồn</div><div className="text-slate-200">
            {t.issue ? <button className="link">Vấn đề {t.issue.code}</button> : t.meetingLabel ? `Cuộc họp ${t.meetingLabel}` : 'Nhập tay'}
          </div></div>
          {t.completedAt && <div><div className="label">Hoàn thành lúc</div><div className="text-slate-200">{fmtDateTime(t.completedAt)}</div></div>}
        </div>

        {t.canEdit && (
          <section className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--line)' }}>
            <div>
              <div className="label">Cập nhật trạng thái</div>
              <div className="flex flex-wrap gap-1">
                {TASK_STATUSES.map((s) => (
                  <button key={s} className={`btn btn-sm ${t.status === s ? 'btn-primary' : ''}`} disabled={busy}
                    onClick={() => {
                      if (s === 'paused' && !t.pausedReason) { setPauseReason(' '); return; }
                      void save({ status: s }, `Đã chuyển sang: ${taskStatusLabel(s)}`);
                    }}>
                    {taskStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {pauseReason !== '' && (
              <Field label="Lý do tạm dừng" required>
                <div className="flex gap-2">
                  <input className="field" value={pauseReason.trim()} onChange={(e) => setPauseReason(e.target.value || ' ')} />
                  <button className="btn btn-sm btn-primary" disabled={!pauseReason.trim() || busy}
                    onClick={() => { void save({ status: 'paused', pausedReason: pauseReason.trim() }, 'Đã tạm dừng công việc'); setPauseReason(''); }}>Lưu</button>
                  <button className="btn btn-sm" onClick={() => setPauseReason('')}>Huỷ</button>
                </div>
              </Field>
            )}

            <Field label="Ghi chú">
              <div className="flex gap-2">
                <textarea className="field" rows={2} value={note ?? t.note ?? ''} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-sm" disabled={note === null || busy} onClick={() => { void save({ note }, 'Đã lưu ghi chú'); setNote(null); }}>Lưu</button>
              </div>
            </Field>

            {t.canManage && (
              <Field label="Đổi hạn" hint="Mỗi lần đổi hạn được ghi lại kèm hạn cũ, hạn mới và lý do.">
                <div className="flex flex-wrap gap-2">
                  <input type="date" className="field w-40" value={deadline ?? t.deadline ?? ''} onChange={(e) => setDeadline(e.target.value)} />
                  <input className="field flex-1 min-w-[10rem]" placeholder="Lý do đổi hạn" value={deadlineReason} onChange={(e) => setDeadlineReason(e.target.value)} />
                  <button className="btn btn-sm" disabled={deadline === null || busy}
                    onClick={() => { void save({ deadline, reason: deadlineReason }, 'Đã đổi hạn'); setDeadline(null); setDeadlineReason(''); }}>Lưu hạn</button>
                </div>
              </Field>
            )}

            {!t.canManage && (
              <SectionNote>
                Bạn là người được giao công việc này nên chỉ cập nhật được trạng thái, ghi chú và lý do tạm dừng.
                Việc đổi người thực hiện, phạm vi hay hạn thuộc về người quản lý công việc.
              </SectionNote>
            )}
          </section>
        )}

        <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Lịch sử thay đổi</h3>
          {t.history.length === 0 ? <p className="text-xs text-slate-500">Chưa có thay đổi nào được ghi lại.</p> : (
            <ul className="space-y-1.5">
              {t.history.map((h: any) => (
                <li key={h.id} className="text-xs text-slate-400">
                  <span className="text-slate-300">{h.field === 'deadline' ? 'Đổi hạn' : 'Đổi trạng thái'}</span>:{' '}
                  {h.oldValue || '—'} → {h.newValue || '—'}
                  {h.reason && <span className="text-slate-500"> · {h.reason}</span>}
                  <span className="text-slate-600"> · {h.actorName} · {fmtDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

export function CreateTaskDialog({ onClose, onDone, prefill }: { onClose: () => void; onDone: () => void; prefill?: any }) {
  const toast = useToast();
  const users = useApi<any[]>('/ref/users');
  const branches = useApi<any[]>('/ref/branches');
  const [form, setForm] = useState({
    title: prefill?.title ?? '', detail: '', assigneeUserId: '', deadline: '', priority: 'normal',
    branchId: prefill?.branchId ? String(prefill.branchId) : '',
  });
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title="Tạo công việc" width="max-w-xl"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!form.title.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/tasks', {
              ...form,
              branchId: form.branchId ? Number(form.branchId) : prefill?.branchId ?? null,
              assigneeUserId: form.assigneeUserId ? Number(form.assigneeUserId) : null,
              deadline: form.deadline || null,
              issueId: prefill?.issueId ?? null,
              studentId: prefill?.studentId ?? null,
              classId: prefill?.classId ?? null,
              meetingPeriodId: prefill?.meetingPeriodId ?? null,
              branchReportId: prefill?.branchReportId ?? null,
              reportingUnitId: prefill?.reportingUnitId ?? null,
              sourceType: prefill?.sourceType ?? 'manual',
            });
            invalidate('/tasks'); invalidate('/dashboard'); invalidate('/meetings');
            toast.push('ok', 'Đã tạo công việc');
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Tạo công việc</button>
      </>}>
      <div className="space-y-3">
        <Field label="Nội dung" required><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Mô tả"><textarea className="field" rows={2} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Người thực hiện">
            <select className="field" value={form.assigneeUserId} onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}>
              <option value="">— Chưa giao —</option>
              {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </Field>
          <Field label="Chi nhánh">
            <select className="field" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">— Chọn —</option>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Hạn" hint="Để trống nếu chưa có hạn."><input type="date" className="field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          <Field label="Ưu tiên">
            <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
