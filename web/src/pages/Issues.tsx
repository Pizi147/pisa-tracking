import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Drawer, Modal } from '../components/Drawer.tsx';
import { fmtDate, fmtDateTime, issueStatusLabel, riskLabel } from '../lib/format.ts';
import { ISSUE_STATUSES, RISK_LEVELS } from '@shared/domain.ts';

export default function IssuesPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const status = params.get('status') ?? '';
  const risk = params.get('risk') ?? '';
  const branchId = params.get('branchId') ?? '';
  const openId = params.get('open');

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (risk) qs.set('risk', risk);
  if (branchId) qs.set('branchId', branchId);

  const issues = useApi<any>(`/issues?${qs}`);
  const branches = useApi<any[]>('/ref/branches');
  const canCreate = !!session?.capabilities?.manageIssues;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Trạng thái</span>
          <select className="field w-44" value={status} onChange={(e) => set('status', e.target.value)}>
            <option value="">Tất cả</option>
            {ISSUE_STATUSES.map((s) => <option key={s} value={s}>{issueStatusLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Mức rủi ro</span>
          <select className="field w-36" value={risk} onChange={(e) => set('risk', e.target.value)}>
            <option value="">Tất cả</option>
            {RISK_LEVELS.map((r) => <option key={r} value={r}>{riskLabel(r)}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Chi nhánh</span>
          <select className="field w-44" value={branchId} onChange={(e) => set('branchId', e.target.value)}>
            <option value="">Tất cả trong phạm vi</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        {canCreate && <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>Tạo vấn đề</button>}
      </div>

      {issues.loading && <Skeleton rows={6} />}
      {issues.error && <ErrorState message={issues.error.message} onRetry={issues.reload} />}
      {issues.data && (
        <Card bodyClass="p-0">
          {issues.data.rows.length === 0 ? (
            <Empty title="Không có vấn đề nào trong phạm vi của bạn"
              hint="Vấn đề được tạo bằng thao tác rõ ràng của người có quyền — hệ thống không tự sinh vấn đề từ tín hiệu học tập." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th sticky-col">Vấn đề</th><th className="th">Phạm vi</th><th className="th">Rủi ro</th>
                  <th className="th">Người xử lý</th><th className="th">Trạng thái</th><th className="th">Liên kết</th>
                  <th className="th">Công việc</th><th className="th">Cập nhật</th>
                </tr></thead>
                <tbody>
                  {issues.data.rows.map((i: any) => (
                    <tr key={i.id} className="row-hover">
                      <td className="td sticky-col">
                        <button className="link text-left" onClick={() => set('open', String(i.id))}>{i.title}</button>
                        <div className="text-[11px] text-slate-500">{i.code}</div>
                      </td>
                      <td className="td text-xs text-slate-400">
                        {{ branch: 'Chi nhánh', class: 'Lớp', student: 'Học viên', system: 'Hệ thống' }[i.scopeType as string] ?? i.scopeType}
                        <div>{i.branchName}</div>
                      </td>
                      <td className="td"><Pill tone={i.riskLevel === 'high' ? 'danger' : i.riskLevel === 'medium' ? 'warn' : 'neutral'}>{riskLabel(i.riskLevel)}</Pill></td>
                      <td className="td text-slate-300 text-xs">{i.ownerName ?? 'Chưa giao'}</td>
                      <td className="td">
                        <Pill tone={i.status === 'resolved' ? 'ok' : i.status === 'in_progress' ? 'info' : i.status === 'discussing' ? 'warn' : 'danger'}>
                          {issueStatusLabel(i.status)}
                        </Pill>
                      </td>
                      <td className="td text-xs">
                        {i.classCode && <Link to={`/lop-hoc/${i.classId}`} className="link block">{i.classCode}</Link>}
                        {i.studentId && <Link to={`/hoc-vien/${i.studentId}`} className="link block">{i.studentName}</Link>}
                        {i.sourceType === 'branch_report' && <span className="text-slate-500">Từ báo cáo chi nhánh</span>}
                      </td>
                      <td className="td text-xs">{i.taskCount > 0 ? `${i.openTaskCount}/${i.taskCount} chưa xong` : <span className="text-slate-600">—</span>}</td>
                      <td className="td text-xs text-slate-500">{fmtDate(i.updatedAt ?? i.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {openId && <IssueDrawer issueId={Number(openId)} onClose={() => set('open', '')} onChanged={issues.reload} />}
      {createOpen && <CreateIssueDialog onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); issues.reload(); }} />}
    </div>
  );
}

function IssueDrawer({ issueId, onClose, onChanged }: { issueId: number; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const detail = useApi<any>(`/issues/${issueId}`);
  const [note, setNote] = useState('');
  const [taskOpen, setTaskOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (detail.loading) return <Drawer open onClose={onClose} title="Đang tải…"><Skeleton rows={5} /></Drawer>;
  if (detail.error) return <Drawer open onClose={onClose} title="Không mở được"><ErrorState message={detail.error.message} hint={detail.error.hint} /></Drawer>;
  const i = detail.data!;

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await api.patch(`/issues/${issueId}`, { status });
      invalidate('/issues'); invalidate('/dashboard');
      detail.reload(); onChanged();
      toast.push('ok', `Đã chuyển sang: ${issueStatusLabel(status)}`);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={i.title} subtitle={`${i.code} · ${i.branchName ?? ''}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <Pill tone={i.riskLevel === 'high' ? 'danger' : i.riskLevel === 'medium' ? 'warn' : 'neutral'}>Rủi ro {riskLabel(i.riskLevel)}</Pill>
          <Pill tone={i.status === 'resolved' ? 'ok' : 'info'}>{issueStatusLabel(i.status)}</Pill>
          <span className="text-xs text-slate-400">Người xử lý: {i.ownerName ?? 'chưa giao'}</span>
          <span className="text-xs text-slate-500">Tạo bởi {i.creatorName} · {fmtDate(i.createdAt)}</span>
        </div>

        {i.canManage && (
          <div className="flex flex-wrap gap-1">
            {ISSUE_STATUSES.map((s) => (
              <button key={s} className={`btn btn-sm ${i.status === s ? 'btn-primary' : ''}`} disabled={busy} onClick={() => setStatus(s)}>
                {issueStatusLabel(s)}
              </button>
            ))}
          </div>
        )}

        {i.description && <p className="text-sm text-slate-300">{i.description}</p>}

        <section>
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Liên kết nguồn</h3>
          <ul className="text-sm space-y-1">
            {i.classCode && <li>Lớp: <Link to={`/lop-hoc/${i.classId}`} className="link">{i.classCode}</Link></li>}
            {i.studentId && <li>Học viên: <Link to={`/hoc-vien/${i.studentId}`} className="link">{i.studentName} ({i.studentCode})</Link></li>}
            {i.sourceReport && <li>Báo cáo: <Link to="/bao-cao" className="link">{i.sourceReport.unitName} — {i.sourceReport.periodLabel}</Link></li>}
            {i.meetings.map((m: any) => <li key={m.id}>Kỳ họp: <Link to={`/cuoc-hop?period=${m.id}`} className="link">{m.label}</Link></li>)}
            {!i.classCode && !i.studentId && !i.sourceReport && i.meetings.length === 0 && <li className="text-slate-500 text-xs">Không có liên kết nguồn.</li>}
          </ul>
        </section>

        <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Công việc</h3>
            {i.canManage && <button className="btn btn-sm" onClick={() => setTaskOpen(true)}>Tạo công việc từ vấn đề này</button>}
          </div>
          {i.tasks.length === 0 ? <p className="text-xs text-slate-500">Chưa có công việc nào gắn với vấn đề này.</p> : (
            <ul className="space-y-1">
              {i.tasks.map((t: any) => (
                <li key={t.id} className="text-sm flex items-center gap-2">
                  <Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                  <span className="text-xs text-slate-500">{t.code} · {t.assigneeName ?? 'chưa giao'} · {t.deadline ? fmtDate(t.deadline) : 'chưa có hạn'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {i.decisions.length > 0 && (
          <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Quyết định trong cuộc họp</h3>
            <ul className="space-y-2">
              {i.decisions.map((d: any) => (
                <li key={d.id} className="text-sm text-slate-300">
                  <div className="text-xs text-slate-500">{d.meetingLabel} · {d.decidedByName}</div>
                  {d.decision}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Ghi chú & lịch sử</h3>
          {i.canManage && (
            <div className="flex gap-2 mb-3">
              <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thêm ghi chú…" />
              <button className="btn btn-sm" disabled={!note.trim() || busy} onClick={async () => {
                setBusy(true);
                try { await api.post(`/issues/${issueId}/notes`, { body: note }); setNote(''); detail.reload(); }
                catch (e: any) { toast.push('error', e.message); }
                finally { setBusy(false); }
              }}>Thêm</button>
            </div>
          )}
          <ul className="space-y-2">
            {i.notes.map((n: any) => (
              <li key={n.id} className="text-sm">
                <div className="text-xs text-slate-500">{n.authorName} · {fmtDateTime(n.createdAt)}</div>
                <div className="text-slate-300">{n.body}</div>
              </li>
            ))}
            {i.audit.map((a: any, k: number) => (
              <li key={`a${k}`} className="text-[11px] text-slate-600">{a.actor_name} · {a.action} · {fmtDateTime(a.created_at)}</li>
            ))}
          </ul>
        </section>
      </div>

      {taskOpen && (
        <CreateTaskFromIssue issue={i} onClose={() => setTaskOpen(false)}
          onDone={() => { setTaskOpen(false); detail.reload(); onChanged(); invalidate('/tasks'); toast.push('ok', 'Đã tạo công việc, giữ liên kết với vấn đề.'); }} />
      )}
    </Drawer>
  );
}

function CreateTaskFromIssue({ issue, onClose, onDone }: { issue: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const users = useApi<any[]>('/ref/users');
  const [form, setForm] = useState({ title: '', assigneeUserId: '', deadline: '', priority: 'normal' });
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title="Tạo công việc từ vấn đề"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!form.title.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/tasks', {
              title: form.title, assigneeUserId: form.assigneeUserId ? Number(form.assigneeUserId) : null,
              deadline: form.deadline || null, priority: form.priority,
              branchId: issue.branchId, classId: issue.classId, studentId: issue.studentId,
              issueId: issue.id, sourceType: 'issue',
            });
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Tạo công việc</button>
      </>}>
      <div className="space-y-3">
        <div className="card p-3 text-xs text-slate-400">
          Công việc mới giữ liên kết tới vấn đề <strong className="text-slate-200">{issue.code}</strong> và các đối tượng liên quan,
          nên vẫn tra được nguồn gốc về sau.
        </div>
        <Field label="Nội dung công việc" required><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Người thực hiện">
            <select className="field" value={form.assigneeUserId} onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}>
              <option value="">— Chưa giao —</option>
              {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </Field>
          <Field label="Hạn"><input type="date" className="field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}

export function CreateIssueDialog({ onClose, onDone, prefill }: { onClose: () => void; onDone: () => void; prefill?: any }) {
  const toast = useToast();
  const branches = useApi<any[]>('/ref/branches');
  const users = useApi<any[]>('/ref/users');
  const [form, setForm] = useState({
    title: prefill?.title ?? '', description: '', riskLevel: 'medium',
    branchId: prefill?.branchId ? String(prefill.branchId) : '',
    ownerUserId: '', scopeType: prefill?.scopeType ?? 'branch',
  });
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title="Tạo vấn đề" width="max-w-xl"
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={!form.title.trim() || busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/issues', {
              ...form,
              branchId: form.branchId ? Number(form.branchId) : prefill?.branchId ?? null,
              ownerUserId: form.ownerUserId ? Number(form.ownerUserId) : null,
              classId: prefill?.classId ?? null, studentId: prefill?.studentId ?? null,
              reportingUnitId: prefill?.reportingUnitId ?? null,
              branchReportId: prefill?.branchReportId ?? null,
              sourceType: prefill?.sourceType ?? 'manual',
              meetingPeriodId: prefill?.meetingPeriodId ?? null,
            });
            invalidate('/issues'); invalidate('/dashboard');
            toast.push('ok', 'Đã tạo vấn đề');
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); }
        }}>Tạo vấn đề</button>
      </>}>
      <div className="space-y-3">
        {prefill && (
          <div className="card p-3 text-xs text-slate-400">
            Liên kết nguồn đã được điền sẵn từ màn hình bạn vừa mở. Vấn đề chỉ được tạo khi bạn bấm xác nhận.
          </div>
        )}
        <Field label="Tiêu đề" required><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Mô tả"><textarea className="field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chi nhánh">
            <select className="field" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">— Chọn —</option>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Mức rủi ro">
            <select className="field" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{riskLabel(r)}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Người xử lý">
          <select className="field" value={form.ownerUserId} onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })}>
            <option value="">— Chưa giao —</option>
            {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </Field>
        <SectionNote>Vấn đề luôn do người có quyền tạo bằng thao tác rõ ràng. Hệ thống không tự sinh vấn đề từ tín hiệu học tập.</SectionNote>
      </div>
    </Modal>
  );
}
