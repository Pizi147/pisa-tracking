import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Modal } from '../components/Drawer.tsx';
import { CreateTaskDialog } from './Tasks.tsx';
import { branchStatusLabel, deadlineLabel, fmtDate, taskStatusLabel } from '../lib/format.ts';

export default function MeetingsPage() {
  const [params, setParams] = useSearchParams();
  const periods = useApi<any[]>('/meetings');
  const periodId = params.get('period') ?? '';

  useEffect(() => {
    if (!periodId && periods.data?.length) {
      const next = new URLSearchParams(params);
      next.set('period', String(periods.data[0].id));
      setParams(next, { replace: true });
    }
  }, [periods.data, periodId, params, setParams]);

  const detail = useApi<any>(periodId ? `/meetings/${periodId}` : null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Kỳ họp</span>
          <select className="field w-72" value={periodId}
            onChange={(e) => { const n = new URLSearchParams(params); n.set('period', e.target.value); setParams(n, { replace: true }); }}>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {detail.loading && <Skeleton rows={7} />}
      {detail.error && <ErrorState message={detail.error.message} onRetry={detail.reload} />}
      {detail.data && <MeetingBody m={detail.data} onChanged={detail.reload} />}
    </div>
  );
}

function MeetingBody({ m, onChanged }: { m: any; onChanged: () => void }) {
  const toast = useToast();
  const [decisionOpen, setDecisionOpen] = useState<any>(null);
  const [taskPrefill, setTaskPrefill] = useState<any>(null);
  const [agenda, setAgenda] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-100">{m.label}</h1>
        <Pill tone={m.status === 'done' ? 'ok' : 'info'}>{m.status === 'done' ? 'Đã họp' : 'Sắp họp'}</Pill>
        <span className="text-xs text-slate-500">Ngày họp {fmtDate(m.meetingDate)} · kỳ báo cáo {m.periodLabel}</span>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Báo cáo các đơn vị trong kỳ" bodyClass="p-0">
          {m.reports.length === 0 ? <Empty title="Không có đơn vị nào trong phạm vi" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="th">Đơn vị</th><th className="th">Tình trạng</th><th className="th">Nhóm có vấn đề</th><th className="th"></th></tr></thead>
                <tbody>
                  {m.reports.map((u: any) => {
                    const problems = (u.categories ?? []).filter((c: any) => c.status === 'problem' || c.status === 'watch');
                    return (
                      <tr key={u.unitId} className="row-hover">
                        <td className="td text-slate-100">{u.unitName}</td>
                        <td className="td">
                          {!u.reportId ? <Pill tone="danger">Chưa gửi</Pill>
                            : u.reportStatus === 'draft' ? <Pill tone="warn">Bản nháp</Pill> : <Pill tone="ok">Đã gửi</Pill>}
                        </td>
                        <td className="td">
                          <div className="flex flex-wrap gap-1">
                            {problems.length === 0 && u.reportId && <Pill tone="ok">Không có nhóm cần chú ý</Pill>}
                            {problems.map((c: any) => (
                              <Pill key={c.key} tone={c.status === 'problem' ? 'danger' : 'warn'} title={c.note ?? undefined}>
                                {c.label}: {branchStatusLabel(c.status)}
                              </Pill>
                            ))}
                          </div>
                        </td>
                        <td className="td text-right">
                          <Link to="/bao-cao" className="btn btn-sm">Mở báo cáo</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Nội dung họp" bodyClass="p-4 space-y-3">
          <div>
            <div className="label">Chương trình họp</div>
            {m.agenda.length === 0 ? <p className="text-xs text-slate-500">Chưa có mục nào.</p> : (
              <ol className="list-decimal list-inside text-sm text-slate-300 space-y-0.5">
                {m.agenda.map((a: any) => <li key={a.id}>{a.title}</li>)}
              </ol>
            )}
            {m.canManage && (
              <div className="flex gap-2 mt-2">
                <input className="field" value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Thêm mục họp…" />
                <button className="btn btn-sm" disabled={!agenda.trim()} onClick={async () => {
                  try { await api.post(`/meetings/${m.id}/agenda`, { title: agenda }); setAgenda(''); onChanged(); }
                  catch (e: any) { toast.push('error', e.message); }
                }}>Thêm</button>
              </div>
            )}
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="label">Vấn đề đưa ra thảo luận</div>
            {m.issues.length === 0 ? <p className="text-xs text-slate-500">Chưa có vấn đề nào gắn với kỳ họp này.</p> : (
              <ul className="space-y-1.5">
                {m.issues.map((i: any) => (
                  <li key={i.id} className="text-sm flex flex-wrap items-center gap-2">
                    <Link to={`/van-de?open=${i.id}`} className="link">{i.title}</Link>
                    <span className="text-xs text-slate-500">{i.code} · {i.branchName} · {i.ownerName ?? 'chưa giao'}</span>
                    {m.canManage && <button className="btn btn-sm" onClick={() => setDecisionOpen(i)}>Ghi quyết định</button>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="label">Quyết định</div>
            {m.decisions.length === 0 ? <p className="text-xs text-slate-500">Chưa ghi quyết định nào.</p> : (
              <ul className="space-y-2">
                {m.decisions.map((d: any) => (
                  <li key={d.id} className="text-sm">
                    <div className="text-slate-200">{d.decision}</div>
                    <div className="text-[11px] text-slate-500">
                      {d.issueCode ? `Vấn đề ${d.issueCode} · ` : ''}{d.decidedByName}
                      {m.canManage && (
                        <button className="link ml-2" onClick={() => setTaskPrefill({ meetingPeriodId: m.id, issueId: d.issueId, sourceType: 'meeting', title: '' })}>
                          Tạo công việc từ quyết định
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {m.canManage && (
              <button className="btn btn-sm mt-2" onClick={() => setDecisionOpen({})}>Ghi quyết định không gắn vấn đề</button>
            )}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title={`Công việc tạo trong kỳ này (${m.newTasks.length})`} bodyClass="p-0"
          action={m.canManage ? <button className="btn btn-sm" onClick={() => setTaskPrefill({ meetingPeriodId: m.id, sourceType: 'meeting' })}>Tạo công việc</button> : undefined}>
          {m.newTasks.length === 0 ? <Empty title="Chưa có công việc nào được tạo trong kỳ này" /> : <TaskList rows={m.newTasks} />}
        </Card>

        <Card title={`Việc chưa xong từ kỳ trước (${m.carryOverTasks.length})`} bodyClass="p-0">
          {m.carryOverTasks.length === 0 ? <Empty title="Không còn việc tồn từ kỳ trước" /> : <TaskList rows={m.carryOverTasks} showOrigin />}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              Đây là <strong>chính các công việc cũ</strong> với mã và ngày tạo gốc, không phải bản sao mới. Khi hoàn thành,
              chúng vẫn tra được trong lịch sử kỳ họp đã tạo ra chúng.
            </SectionNote>
          </div>
        </Card>
      </div>

      {m.completedPriorTasks.length > 0 && (
        <Card title="Việc đã hoàn thành từ các kỳ trước" bodyClass="p-0">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Công việc</th><th className="th">Kỳ tạo</th><th className="th">Hoàn thành</th></tr></thead>
            <tbody>
              {m.completedPriorTasks.map((t: any) => (
                <tr key={t.id} className="row-hover">
                  <td className="td"><Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                    <span className="text-[11px] text-slate-500 ml-2">{t.code}</span></td>
                  <td className="td text-xs text-slate-400">{t.origin_meeting}</td>
                  <td className="td text-xs text-slate-400">{fmtDate(t.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {decisionOpen && (
        <DecisionDialog meetingId={m.id} issue={decisionOpen}
          onClose={() => setDecisionOpen(null)}
          onDone={() => { setDecisionOpen(null); onChanged(); invalidate('/issues'); toast.push('ok', 'Đã ghi quyết định'); }} />
      )}
      {taskPrefill && (
        <CreateTaskDialog onClose={() => setTaskPrefill(null)}
          onDone={() => { setTaskPrefill(null); onChanged(); }} prefill={taskPrefill} />
      )}
    </div>
  );
}

function TaskList({ rows, showOrigin }: { rows: any[]; showOrigin?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr>
          <th className="th">Công việc</th><th className="th">Người thực hiện</th><th className="th">Trạng thái</th><th className="th">Hạn</th>
          {showOrigin && <th className="th">Kỳ họp gốc</th>}
        </tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="row-hover">
              <td className="td">
                <Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                <div className="text-[11px] text-slate-500">{t.code}{t.issueCode ? ` · vấn đề ${t.issueCode}` : ''}</div>
              </td>
              <td className="td text-xs text-slate-300">{t.assigneeName ?? 'Chưa giao'}</td>
              <td className="td">
                <Pill tone={t.status === 'completed' ? 'ok' : t.status === 'paused' ? 'warn' : 'info'}>{taskStatusLabel(t.status)}</Pill>
                {t.pausedReason && <div className="text-[11px] text-slate-500 mt-0.5 max-w-[12rem]">{t.pausedReason}</div>}
              </td>
              <td className="td">
                <Pill tone={t.deadlineState === 'overdue' ? 'danger' : t.deadlineState === 'due_soon' ? 'warn' : t.deadlineState === 'no_deadline' ? 'muted' : 'ok'}>
                  {deadlineLabel(t.deadlineState)}
                </Pill>
                {t.deadline && <div className="text-[11px] text-slate-500 mt-0.5">{fmtDate(t.deadline)}</div>}
              </td>
              {showOrigin && <td className="td text-xs text-slate-400">{t.originMeeting}
                <div className="text-[11px] text-slate-600">tạo {fmtDate(t.createdAt)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecisionDialog({ meetingId, issue, onClose, onDone }: { meetingId: number; issue: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title="Ghi quyết định cuộc họp"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!decision.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post(`/meetings/${meetingId}/decisions`, { decision, note, issueId: issue?.id ?? null });
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Lưu quyết định</button>
      </>}>
      <div className="space-y-3">
        {issue?.id && <div className="card p-3 text-xs text-slate-400">Gắn với vấn đề <strong className="text-slate-200">{issue.code}</strong>: {issue.title}</div>}
        <Field label="Nội dung quyết định" required><textarea className="field" rows={4} value={decision} onChange={(e) => setDecision(e.target.value)} /></Field>
        <Field label="Ghi chú"><textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
