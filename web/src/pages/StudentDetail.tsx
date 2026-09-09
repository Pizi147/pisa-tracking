import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ConfirmDialog } from '../components/Drawer.tsx';
import { fmtBand, fmtDate, mockStatusLabel, sosLabel, sosTone } from '../lib/format.ts';
import { JOURNEY_EVENT_LABEL, JOURNEY_FILTERS } from '@shared/domain.ts';

type Detail = {
  id: number; studentCode: string; fullName: string;
  committedScore: number | null; route: string | null; examDate: string | null; note: string | null;
  currentClass: { id: number; code: string; branchName: string } | null;
  enrollments: any[]; attempts: any[]; nextMock: any; openTasks: any[];
  viewer: { canEdit: boolean; canSchedule: boolean };
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Detail>(id ? `/students/${id}` : null);
  const [filter, setFilter] = useState('all');
  const journey = useApi<any[]>(id ? `/students/${id}/journey?filter=${filter}` : null, [filter]);
  const [transferOpen, setTransferOpen] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const openCase = data.attempts.find((a) => a.caseId && a.caseStatus !== 'done');

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">
            {data.fullName} <span className="text-slate-500 text-sm">· {data.studentCode}</span>
          </h1>
        </div>
        {data.viewer.canEdit && (
          <button className="btn" onClick={() => setTransferOpen(true)}>Chuyển lớp</button>
        )}
      </div>

      <Card title="Hồ sơ">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5 m-0">
          <Info label="Lớp hiện tại">
            {data.currentClass ? `${data.currentClass.code} · ${data.currentClass.branchName}` : '—'}
          </Info>
          <Info label="Lộ trình">{data.route ?? '—'}</Info>
          <Info label="Điểm cam kết">{fmtBand(data.committedScore)}</Info>
          <Info label="Ngày thi thật dự kiến">{fmtDate(data.examDate)}</Info>
          <Info label="Mock tiếp theo">
            {data.nextMock
              ? <Link className="link" to={`/mock-test/${data.nextMock.id}`}>MT{data.nextMock.attemptNo} · {fmtDate(data.nextMock.plannedDate)}</Link>
              : '—'}
          </Info>
        </dl>
        {openCase && (
          <div className="mt-3">
            <Pill tone={sosTone(openCase.sosLevel)}>{sosLabel(openCase.sosLevel)} · MT{openCase.attemptNo} đang xử lý</Pill>
            <Link className="link text-xs ml-2" to={`/mock-test/${openCase.id}`}>Mở chi tiết Mock</Link>
          </div>
        )}
        {data.openTasks.length > 0 && (
          <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="label">Việc đang mở</div>
            <ul className="text-xs space-y-1 list-none p-0 m-0">
              {data.openTasks.map((t) => (
                <li key={t.id} className="text-slate-300">
                  {t.code} · {t.title}
                  <span className="text-slate-500"> · {t.assignee_name ?? 'Chưa giao'} · hạn {fmtDate(t.due_date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Các lần Mock Test" bodyClass="p-0">
        {data.attempts.length === 0 ? (
          <Empty title="Chưa có lịch Mock nào" hint="Lớp không thuộc lộ trình FT thì chưa áp dụng kỳ vọng và SOS." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">MT</th>
                  <th className="th">Lớp tại lần thi</th>
                  <th className="th">Tuần / ngày</th>
                  <th className="th">Trạng thái</th>
                  <th className="th">L</th><th className="th">R</th><th className="th">W</th><th className="th">S</th>
                  <th className="th">Overall</th>
                  <th className="th">Kỳ vọng</th>
                  <th className="th">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a.id} className="row-hover cursor-pointer" onClick={() => navigate(`/mock-test/${a.id}`)}>
                    <td className="td tabular-nums">MT{a.attemptNo}</td>
                    <td className="td text-slate-300">{a.classCode ?? '—'}</td>
                    <td className="td whitespace-nowrap">{a.week.code} <span className="text-slate-500 text-xs">{fmtDate(a.plannedDate)}</span></td>
                    <td className="td"><Pill tone={a.status === 'cancelled' ? 'muted' : a.status === 'completed' ? 'info' : 'neutral'}>{mockStatusLabel(a.status)}</Pill></td>
                    <td className="td tabular-nums">{fmtBand(a.bands.listening)}</td>
                    <td className="td tabular-nums">{fmtBand(a.bands.reading)}</td>
                    <td className="td tabular-nums">{fmtBand(a.bands.writing)}</td>
                    <td className="td tabular-nums">{fmtBand(a.bands.speaking)}</td>
                    <td className="td tabular-nums text-slate-100">{fmtBand(a.overall)}</td>
                    <td className="td tabular-nums">{fmtBand(a.expectation)}</td>
                    <td className="td">
                      <Pill tone={sosTone(a.sosLevel)}>{a.complete ? sosLabel(a.sosLevel) : `Chờ ${4 - a.completed} kỹ năng`}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3"><SectionNote>Lớp ghi ở đây là lớp TẠI THỜI ĐIỂM THI. Chuyển lớp không viết lại lịch sử này.</SectionNote></div>
      </Card>

      <Card title="Hành trình học viên"
        action={
          <div className="flex gap-1">
            {JOURNEY_FILTERS.map((f) => (
              <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        }>
        {journey.loading && <Skeleton rows={4} />}
        {journey.data && journey.data.length === 0 && <Empty title="Chưa có sự kiện nào trong bộ lọc này" />}
        {journey.data && journey.data.length > 0 && (
          <ol className="space-y-2 list-none p-0 m-0">
            {journey.data.map((e) => (
              <li key={e.id} className="flex gap-3 items-start">
                <span className="text-xs text-slate-500 w-20 shrink-0 tabular-nums pt-0.5">{fmtDate(e.eventDate)}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-slate-100">
                    {e.refTable === 'mock_attempts'
                      ? <Link className="link" to={`/mock-test/${e.refId}`}>{e.title}</Link>
                      : e.title}
                    <span className="text-[11px] text-slate-500 ml-2">{JOURNEY_EVENT_LABEL[e.eventType] ?? e.eventType}</span>
                  </span>
                  {e.detail && <span className="block text-xs text-slate-400">{e.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} studentId={data.id}
        currentClassId={data.currentClass?.id ?? null} onDone={() => { reload(); journey.reload(); }} />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</dt>
      <dd className="text-sm text-slate-100 mt-1 m-0">{children}</dd>
    </div>
  );
}

function TransferDialog({ open, onClose, studentId, currentClassId, onDone }: {
  open: boolean; onClose: () => void; studentId: number; currentClassId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const classes = useApi<any[]>(open ? '/ref/classes' : null);
  const [toClassId, setToClassId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <ConfirmDialog
      open={open} onClose={onClose} busy={busy} title="Chuyển lớp" confirmLabel="Chuyển lớp"
      body={
        <div className="space-y-3">
          <label className="block">
            <span className="label">Lớp đích</span>
            <select className="field" value={toClassId ?? ''} onChange={(e) => setToClassId(Number(e.target.value) || null)}>
              <option value="">Chọn lớp…</option>
              {(classes.data ?? []).filter((c) => c.id !== currentClassId).map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.branch_name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Ngày hiệu lực</span>
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Lý do</span>
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <SectionNote>
            Lịch Mock CHƯA thi sẽ chuyển sang lớp mới. Các lần đã thi giữ nguyên lớp cũ để không viết lại lịch sử.
          </SectionNote>
        </div>
      }
      onConfirm={async () => {
        if (!toClassId) { toast.push('error', 'Cần chọn lớp đích.'); return; }
        setBusy(true);
        try {
          await api.post(`/students/${studentId}/transfer`, { toClassId, effectiveDate: date || undefined, reason });
          invalidate('/students'); invalidate('/mocks'); invalidate('/overview');
          onDone(); onClose(); toast.push('ok', 'Đã chuyển lớp');
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}
