import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Pill, Skeleton } from '../components/ui.tsx';
import type { Branch } from '../components/Filters.tsx';
import { fmtBand, fmtDate, sosLabel, sosTone } from '../lib/format.ts';

type Row = {
  id: number; studentCode: string; fullName: string;
  committedScore: number | null; route: string | null; examDate: string | null;
  classCode: string | null; branchName: string | null;
  latest: { attemptNo: number; overall: number | null; sosLevel: number | null } | null;
  nextMock: { attempt_no: number; planned_date: string; week: { code: string } } | null;
  openCase: { id: number; sos_level: number; status: string } | null;
};

export default function StudentsPage() {
  const { branchCount } = useSession();
  const [q, setQ] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [attention, setAttention] = useState(false);

  const branches = useApi<Branch[]>('/ref/branches');
  const classes = useApi<any[]>('/ref/classes');

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (branchId) p.set('branchId', String(branchId));
    if (classId) p.set('classId', String(classId));
    if (attention) p.set('need', 'attention');
    return `/students?${p.toString()}`;
  }, [q, branchId, classId, attention]);

  const { data, loading, error, reload } = useApi<{ rows: Row[]; scopeEmpty: boolean }>(qs);
  const rows = data?.rows ?? [];
  const showBranch = (branches.data?.length ?? 0) > 1 && branchCount > 1;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Học viên</h1>
          <p className="text-xs text-slate-500 mt-0.5">Chỉ hiện học viên thuộc phạm vi bạn được cấp quyền.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="label">Tìm</span>
            <input className="field w-56" placeholder="Tên (có/không dấu) hoặc mã HV" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {showBranch && (
            <label className="block">
              <span className="label">Chi nhánh</span>
              <select className="field w-40" value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Tất cả</option>
                {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="label">Lớp</span>
            <select className="field w-44" value={classId ?? ''} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Tất cả lớp</option>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
          <button className={`btn ${attention ? 'btn-primary' : ''}`} onClick={() => setAttention((a) => !a)}>
            Đang có case SOS
          </button>
        </div>
      </div>

      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && <Skeleton rows={8} />}

      {data && !loading && (
        <Card bodyClass="p-0">
          {rows.length === 0 ? (
            <Empty
              title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không tìm thấy học viên nào'}
              hint={data.scopeEmpty ? 'Tài khoản này chưa có chi nhánh hoặc phân công lớp.' : 'Thử bỏ bớt bộ lọc.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Học viên</th>
                    <th className="th">Lớp</th>
                    <th className="th">Lộ trình / cam kết</th>
                    <th className="th">Kết quả gần nhất</th>
                    <th className="th">Mock tiếp theo</th>
                    <th className="th">Case đang mở</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="row-hover">
                      <td className="td">
                        <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                        <div className="text-[11px] text-slate-500">{s.studentCode}</div>
                      </td>
                      <td className="td whitespace-nowrap">
                        <div className="text-slate-200">{s.classCode ?? '—'}</div>
                        <div className="text-[11px] text-slate-500">{s.branchName ?? ''}</div>
                      </td>
                      <td className="td whitespace-nowrap">
                        {s.route ?? '—'} <span className="text-slate-500">· {fmtBand(s.committedScore)}</span>
                      </td>
                      <td className="td whitespace-nowrap">
                        {s.latest
                          ? <>MT{s.latest.attemptNo} · <span className="tabular-nums">{fmtBand(s.latest.overall)}</span>{' '}
                              <Pill tone={sosTone(s.latest.sosLevel)}>{sosLabel(s.latest.sosLevel)}</Pill></>
                          : <span className="text-slate-500">Chưa có kết quả đủ điểm</span>}
                      </td>
                      <td className="td whitespace-nowrap text-slate-300">
                        {s.nextMock ? `MT${s.nextMock.attempt_no} · ${s.nextMock.week.code} · ${fmtDate(s.nextMock.planned_date)}` : '—'}
                      </td>
                      <td className="td">
                        {s.openCase
                          ? <Pill tone={sosTone(s.openCase.sos_level)}>{sosLabel(s.openCase.sos_level)}</Pill>
                          : <span className="text-slate-600">—</span>}
                      </td>
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
