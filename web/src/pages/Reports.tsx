import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { CreateIssueDialog } from './Issues.tsx';
import { CreateTaskDialog } from './Tasks.tsx';
import { SaveIndicator, type SaveStatus } from '../components/SaveState.tsx';
import { branchStatusLabel, fmtDate } from '../lib/format.ts';
import { BRANCH_REPORT_STATUSES } from '@shared/domain.ts';

export default function ReportsPage() {
  const { session } = useSession();
  const [tab, setTab] = useState<'chi-nhanh' | 'hoc-vien'>(session?.capabilities?.viewReports ? 'chi-nhanh' : 'hoc-vien');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 card p-1 w-fit">
        {session?.capabilities?.viewReports && (
          <button className={`btn btn-sm ${tab === 'chi-nhanh' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('chi-nhanh')}>Báo cáo chi nhánh</button>
        )}
        <button className={`btn btn-sm ${tab === 'hoc-vien' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('hoc-vien')}>Báo cáo tiến độ học viên</button>
      </div>
      <SectionNote>
        Báo cáo chi nhánh và báo cáo tiến độ học viên là hai đối tượng riêng biệt, có biểu mẫu và lịch sử riêng.
      </SectionNote>
      {tab === 'chi-nhanh' ? <BranchReports /> : <StudentProgressReports />}
    </div>
  );
}

function BranchReports() {
  const periods = useApi<any[]>('/ref/report-periods');
  const [periodId, setPeriodId] = useState<string>('');
  const [openUnit, setOpenUnit] = useState<number | null>(null);

  useEffect(() => {
    if (!periodId && periods.data?.length) setPeriodId(String(periods.data[0].id));
  }, [periods.data, periodId]);

  const grid = useApi<any>(periodId ? `/reports/branch?periodId=${periodId}` : null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Kỳ báo cáo</span>
          <select className="field w-64" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {grid.loading && <Skeleton rows={6} />}
      {grid.error && <ErrorState message={grid.error.message} onRetry={grid.reload} />}
      {grid.data && (
        <Card bodyClass="p-0">
          {grid.data.units.length === 0 ? <Empty title="Không có đơn vị báo cáo nào trong phạm vi của bạn" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th sticky-col">Đơn vị báo cáo</th>
                  {grid.data.categories.map((c: any) => <th key={c.key} className="th">{c.label}</th>)}
                  <th className="th">Tình trạng gửi</th><th className="th">Vấn đề</th><th className="th"></th>
                </tr></thead>
                <tbody>
                  {grid.data.units.map((u: any) => (
                    <tr key={u.unitId} className="row-hover">
                      <td className="td sticky-col">
                        <div className="text-slate-100">{u.unitName}</div>
                        <div className="text-[11px] text-slate-500">{u.kind === 'department' ? 'Đơn vị riêng, ngoài chi nhánh' : 'Chi nhánh'}</div>
                      </td>
                      {grid.data.categories.map((c: any) => {
                        const cell = u.categories.find((x: any) => x.key === c.key);
                        const st = cell?.status ?? 'not_reported';
                        return (
                          <td key={c.key} className="td">
                            <Pill tone={st === 'ok' ? 'ok' : st === 'watch' ? 'warn' : st === 'problem' ? 'danger' : 'muted'}>
                              {branchStatusLabel(st)}
                            </Pill>
                          </td>
                        );
                      })}
                      <td className="td">
                        {!u.reportId ? <Pill tone="danger">Chưa gửi</Pill>
                          : u.reportStatus === 'draft' ? <Pill tone="warn">Bản nháp</Pill>
                            : <Pill tone="ok">Đã gửi {fmtDate(u.submittedAt)}</Pill>}
                      </td>
                      <td className="td text-xs">{u.issueCount > 0 ? `${u.issueCount} vấn đề` : '—'}</td>
                      <td className="td text-right">
                        <button className="btn btn-sm" onClick={() => setOpenUnit(u.unitId)}>
                          {u.reportId ? 'Mở báo cáo' : u.canManage ? 'Nhập báo cáo' : 'Xem'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>"Chưa gửi" khác với "Ổn". Đơn vị chưa gửi báo cáo sẽ hiện rõ để quản lý biết còn thiếu dữ liệu.</SectionNote>
          </div>
        </Card>
      )}

      {openUnit && periodId && (
        <BranchReportDrawer unitId={openUnit} periodId={Number(periodId)} onClose={() => setOpenUnit(null)} onChanged={grid.reload} />
      )}
    </div>
  );
}

function BranchReportDrawer({ unitId, periodId, onClose, onChanged }: {
  unitId: number; periodId: number; onClose: () => void; onChanged: () => void;
}) {
  const toast = useToast();
  const detail = useApi<any>(`/reports/branch/detail?unitId=${unitId}&periodId=${periodId}`);
  const [status, setStatus] = useState<Record<string, SaveStatus>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [issueOpen, setIssueOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const r = detail.data;

  const createReport = async () => {
    setBusy(true);
    try {
      await api.post('/reports/branch', { unitId, periodId });
      detail.reload(); onChanged();
      toast.push('ok', 'Đã tạo bản nháp báo cáo');
    } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
    finally { setBusy(false); }
  };

  const saveCategory = async (key: string, patch: any) => {
    setStatus((s) => ({ ...s, [key]: 'saving' }));
    try {
      await api.patch(`/reports/branch/${r.id}/categories/${key}`, patch);
      setStatus((s) => ({ ...s, [key]: 'saved' }));
      detail.reload(); onChanged(); invalidate('/dashboard');
      setTimeout(() => setStatus((s) => ({ ...s, [key]: 'idle' })), 1500);
    } catch (e: any) {
      setStatus((s) => ({ ...s, [key]: 'error' }));
      toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message);
    }
  };

  if (detail.loading) return <Drawer open onClose={onClose} title="Đang tải…"><Skeleton rows={5} /></Drawer>;
  if (detail.error) return <Drawer open onClose={onClose} title="Không mở được"><ErrorState message={detail.error.message} hint={detail.error.hint} /></Drawer>;

  if (r?.empty) {
    return (
      <Drawer open onClose={onClose} title="Chưa có báo cáo cho kỳ này">
        <Empty title="Đơn vị này chưa gửi báo cáo cho kỳ đã chọn"
          hint="Trạng thái này khác với 'Ổn'. Người có quyền có thể tạo bản nháp và nhập trạng thái từng nhóm."
          action={<button className="btn btn-primary" disabled={busy} onClick={createReport}>Tạo bản nháp báo cáo</button>} />
      </Drawer>
    );
  }

  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={`Báo cáo ${r.unitName}`} subtitle={r.periodLabel}
      footer={r.canManage && r.status === 'draft' ? (
        <button className="btn btn-primary" disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post(`/reports/branch/${r.id}/submit`);
            detail.reload(); onChanged(); invalidate('/dashboard');
            toast.push('ok', 'Đã gửi báo cáo');
          } catch (e: any) { toast.push('error', e.message); }
          finally { setBusy(false); }
        }}>Gửi báo cáo</button>
      ) : undefined}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {r.status === 'draft' ? <Pill tone="warn">Bản nháp</Pill> : <Pill tone="ok">Đã gửi {fmtDate(r.submittedAt)}</Pill>}
          <Pill tone="neutral">Bộ nhóm báo cáo v{r.categoryVersion}</Pill>
          {r.previousPeriod && (
            <span className="text-xs text-slate-500">
              Kỳ trước ({r.previousPeriod.label}): {r.previousPeriod.reported ? 'đã có báo cáo' : 'chưa gửi'}
            </span>
          )}
        </div>

        {r.categories.map((c: any) => (
          <div key={c.key} className="card p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-100">{c.label}</h3>
              <SaveIndicator status={status[c.key] ?? 'idle'} />
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {BRANCH_REPORT_STATUSES.map((s) => (
                <button key={s} disabled={!r.canManage}
                  className={`btn btn-sm ${c.status === s ? 'btn-primary' : ''}`}
                  onClick={() => saveCategory(c.key, { status: s })}>
                  {branchStatusLabel(s)}
                </button>
              ))}
            </div>
            <textarea
              className="field" rows={2} disabled={!r.canManage}
              placeholder="Ghi chú cho nhóm này…"
              value={drafts[c.key] ?? c.note ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.key]: e.target.value }))}
              onBlur={(e) => { if (e.target.value !== (c.note ?? '')) void saveCategory(c.key, { note: e.target.value }); }}
            />
            {c.previous && (
              <div className="text-[11px] text-slate-500 mt-1.5">
                Kỳ trước: <span className="text-slate-400">{branchStatusLabel(c.previous.status)}</span>
                {c.previous.note && ` — ${c.previous.note}`}
              </div>
            )}
          </div>
        ))}

        <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Vấn đề và công việc từ báo cáo này</h3>
            {r.canManage && (
              <div className="flex gap-1">
                <button className="btn btn-sm" onClick={() => setIssueOpen(true)}>Tạo vấn đề</button>
                <button className="btn btn-sm" onClick={() => setTaskOpen(true)}>Tạo công việc</button>
              </div>
            )}
          </div>
          {r.issues.length === 0 && r.tasks.length === 0 && (
            <p className="text-xs text-slate-500">Chưa có vấn đề hay công việc nào được tạo từ báo cáo này.</p>
          )}
          <ul className="space-y-1">
            {r.issues.map((i: any) => (
              <li key={i.id} className="text-sm">
                <Link to={`/van-de?open=${i.id}`} className="link">{i.title}</Link>
                <span className="text-xs text-slate-500 ml-2">{i.code} · {i.status}</span>
              </li>
            ))}
            {r.tasks.map((t: any) => (
              <li key={`t${t.id}`} className="text-sm">
                <Link to={`/cong-viec?open=${t.id}`} className="link">{t.title}</Link>
                <span className="text-xs text-slate-500 ml-2">{t.code} · {t.assigneeName ?? 'chưa giao'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <SectionNote>Vấn đề và công việc chỉ được tạo khi bạn chủ động bấm, không tự sinh từ trạng thái báo cáo.</SectionNote>
          </div>
        </section>
      </div>

      {issueOpen && (
        <CreateIssueDialog onClose={() => setIssueOpen(false)}
          onDone={() => { setIssueOpen(false); detail.reload(); }}
          prefill={{ title: `Vấn đề từ báo cáo ${r.unitName} — ${r.periodLabel}`, branchId: r.branchId, reportingUnitId: r.unitId, branchReportId: r.id, sourceType: 'branch_report', scopeType: 'branch' }} />
      )}
      {taskOpen && (
        <CreateTaskDialog onClose={() => setTaskOpen(false)}
          onDone={() => { setTaskOpen(false); detail.reload(); }}
          prefill={{ branchId: r.branchId, reportingUnitId: r.unitId, branchReportId: r.id, sourceType: 'branch_report' }} />
      )}
    </Drawer>
  );
}

function StudentProgressReports() {
  const reports = useApi<any[]>('/reports/student-progress');
  if (reports.loading) return <Skeleton rows={6} />;
  if (reports.error) return <ErrorState message={reports.error.message} onRetry={reports.reload} />;

  return (
    <Card bodyClass="p-0">
      {(reports.data ?? []).length === 0 ? (
        <Empty title="Chưa có báo cáo tiến độ học viên nào"
          hint="Báo cáo tiến độ được viết từ hồ sơ học viên, ở tab 'Báo cáo & ghi nhận'." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th sticky-col">Học viên</th><th className="th">Lớp</th><th className="th">Kỳ</th>
              <th className="th">Ngày</th><th className="th">Nội dung</th><th className="th">Người viết</th>
            </tr></thead>
            <tbody>
              {reports.data!.map((r) => (
                <tr key={r.id} className="row-hover">
                  <td className="td sticky-col">
                    <Link to={`/hoc-vien/${r.studentId}`} className="link">{r.studentName}</Link>
                    <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                  </td>
                  <td className="td text-xs text-slate-400">{r.classCode ?? '—'}</td>
                  <td className="td text-slate-200">{r.periodLabel}</td>
                  <td className="td text-xs text-slate-400">{fmtDate(r.reportDate)}</td>
                  <td className="td max-w-lg">
                    {r.progressSummary && <div className="text-xs text-slate-300">{r.progressSummary}</div>}
                    {r.sharedSummary && <div className="text-xs text-teal-200/80 mt-0.5">Tóm tắt chia sẻ: {r.sharedSummary}</div>}
                    {r.redacted && <Pill tone="info">Bản dành cho tư vấn</Pill>}
                  </td>
                  <td className="td text-xs text-slate-400">{r.authorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
