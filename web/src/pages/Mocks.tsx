import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { WeekBranchFilter, usePeriods, type Branch } from '../components/Filters.tsx';
import { Modal } from '../components/Drawer.tsx';
import { fmtBand, fmtDay, mockStatusLabel, skillShort, sosLabel, sosTone } from '../lib/format.ts';
import { PERMISSIONS } from '@shared/domain.ts';

type Row = {
  id: number; studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; branchCode: string | null;
  attemptNo: number; plannedDate: string; firstTestDate: string | null;
  week: { code: string; range: string };
  status: string; expectation: number | null;
  overall: number | null; completed: number; complete: boolean; sosLevel: number | null;
  enteredSkills: number; applicableSkills: number; overdueSkills: number;
  myPendingSkills: string[]; caseStatus: string | null; caseId: number | null;
};

const NEEDS = [
  { key: '', label: 'Tất cả' },
  { key: 'my_scores', label: 'Điểm tôi cần nhập' },
  { key: 'missing_scores', label: 'Thiếu điểm' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'sos_open', label: 'Case SOS chưa xong' },
];

export default function MocksPage() {
  const { session, can } = useSession();
  const [params, setParams] = useSearchParams();
  const periods = usePeriods();
  const navigate = useNavigate();
  const toast = useToast();

  const need = params.get('need') ?? '';
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const [periodId, setPeriodId] = useState<number | null>(params.get('periodId') ? Number(params.get('periodId')) : null);
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Bộ lọc "việc cần làm" xét xuyên tuần: chọn một mục ở đây là bỏ ràng buộc tuần,
  // nếu không việc còn tồn từ tuần trước sẽ biến mất.
  const byWeek = need === '';
  useEffect(() => {
    if (byWeek && periodId === null && periods.data?.length) {
      const cur = periods.data.find((p) => p.weekStart <= session!.demoDate && p.weekEnd >= session!.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session, byWeek]);

  const classes = useApi<any[]>('/ref/classes');
  const branches = useApi<Branch[]>('/ref/branches');
  // Giáo viên chỉ dời/lập lịch được ở lớp mình chủ nhiệm — không bày nút cho GVBM thuần.
  const teacherOnly = (session?.roles ?? []).length === 1 && session?.roles?.[0] === 'teacher';
  const canSchedule = can(PERMISSIONS.MOCK_SCHEDULE)
    && (!teacherOnly || (session?.assignments ?? []).some((a) => a.isCore));

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (byWeek && periodId) p.set('periodId', String(periodId));
    if (need) p.set('need', need);
    if (branchId) p.set('branchId', String(branchId));
    if (classId) p.set('classId', String(classId));
    if (q.trim()) p.set('q', q.trim());
    return `/mocks?${p.toString()}`;
  }, [byWeek, periodId, need, branchId, classId, q]);

  const { data, loading, error, reload } = useApi<{ rows: Row[]; scopeEmpty: boolean }>(qs);
  const rows = data?.rows ?? [];

  const setNeed = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set('need', v); else next.delete('need');
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Mock Test</h1>
          <p className="text-xs text-slate-500 mt-0.5">Lịch thi và kết quả nằm chung một danh sách. Mở một dòng để nhập điểm và ghi nhận xử lý.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {byWeek && (
            <WeekBranchFilter
              periodId={periodId}
              onPeriod={setPeriodId}
              branchId={branchId}
              onBranch={(id) => {
                const next = new URLSearchParams(params);
                if (id) next.set('branchId', String(id)); else next.delete('branchId');
                setParams(next, { replace: true });
              }}
            />
          )}
          {canSchedule && (
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>Lên lịch Mock</button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap gap-1">
          {NEEDS.map((n) => (
            <button
              key={n.key}
              className={`btn btn-sm ${need === n.key ? 'btn-primary' : ''}`}
              onClick={() => setNeed(n.key)}
            >
              {n.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <label className="block">
          <span className="label">Lớp</span>
          <select className="field w-48" value={classId ?? ''} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Tất cả lớp</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Tìm</span>
          <input className="field w-52" placeholder="Tên hoặc mã học viên" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {classId && (
          <Link className="btn no-underline" to={`/mock-test/lop/${classId}${periodId ? `?periodId=${periodId}` : ''}`}>
            Nhập điểm cả lớp
          </Link>
        )}
      </div>

      {!byWeek && (
        <SectionNote>
          Bộ lọc “{NEEDS.find((n) => n.key === need)?.label}” xét xuyên tuần, nên việc còn tồn từ tuần trước vẫn hiện ở đây.
        </SectionNote>
      )}

      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && <Skeleton rows={8} />}

      {data && !loading && (
        <Card bodyClass="p-0">
          {rows.length === 0 ? (
            <Empty
              title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có lượt Mock nào khớp bộ lọc'}
              hint={data.scopeEmpty
                ? 'Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.'
                : byWeek
                  ? 'Tuần đang chọn không có lượt Mock nào trong phạm vi của bạn. Đổi tuần ở trên, hoặc bấm “Điểm tôi cần nhập” để xem xuyên tuần.'
                  : 'Không còn việc nào trong nhóm này. Bấm “Tất cả” để xem toàn bộ lượt Mock của tuần.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Học viên</th>
                    <th className="th">Lớp</th>
                    <th className="th">MT</th>
                    <th className="th">Tuần / ngày</th>
                    <th className="th">Trạng thái</th>
                    <th className="th">Tiến độ điểm</th>
                    <th className="th">Kỳ vọng</th>
                    <th className="th">Overall</th>
                    <th className="th">Kết quả</th>
                    <th className="th">Việc cần làm</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="row-hover cursor-pointer" onClick={() => navigate(`/mock-test/${r.id}`)}>
                      <td className="td">
                        <div className="text-slate-100">{r.studentName}</div>
                        <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                      </td>
                      <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                      <td className="td tabular-nums">MT{r.attemptNo}</td>
                      <td className="td whitespace-nowrap">
                        <div className="text-slate-200">{r.week.code}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.firstTestDate ? `Thi ${fmtDay(r.firstTestDate)}` : `Dự kiến ${fmtDay(r.plannedDate)}`}
                        </div>
                      </td>
                      <td className="td">
                        <Pill tone={r.status === 'cancelled' ? 'muted' : r.status === 'completed' ? 'info' : 'neutral'}>
                          {mockStatusLabel(r.status)}
                        </Pill>
                      </td>
                      <td className="td whitespace-nowrap">
                        {r.status === 'cancelled' ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : (
                          <span className="tabular-nums text-slate-200">
                            {r.enteredSkills}/{r.applicableSkills}
                            {r.overdueSkills > 0 && <Pill tone="danger">Quá hạn {r.overdueSkills}</Pill>}
                          </span>
                        )}
                      </td>
                      <td className="td tabular-nums">{fmtBand(r.expectation)}</td>
                      <td className="td tabular-nums">{fmtBand(r.overall)}</td>
                      <td className="td">
                        {r.status === 'cancelled'
                          ? <span className="text-slate-600 text-xs">—</span>
                          : <Pill tone={sosTone(r.sosLevel)}>{r.complete ? sosLabel(r.sosLevel) : `Chờ ${4 - r.completed} kỹ năng`}</Pill>}
                      </td>
                      <td className="td text-xs text-slate-400">
                        {r.myPendingSkills.length > 0 && (
                          <span className="text-teal-300">Nhập {r.myPendingSkills.map(skillShort).join(', ')}</span>
                        )}
                        {r.myPendingSkills.length === 0 && r.caseId && r.caseStatus !== 'done' && 'Ghi nhận xử lý SOS'}
                        {r.myPendingSkills.length === 0 && !r.caseId && r.status === 'planned' && 'Chờ đến ngày thi'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <CreateMockModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        classes={classes.data ?? []}
        onDone={(id) => { invalidate('/mocks'); invalidate('/overview'); toast.push('ok', 'Đã lên lịch Mock'); navigate(`/mock-test/${id}`); }}
      />
      {branches.data && branches.data.length > 1 && (
        <SectionNote>Bạn được cấp {branches.data.length} chi nhánh nên bộ lọc chi nhánh được bật.</SectionNote>
      )}
    </div>
  );
}

function CreateMockModal({ open, onClose, classes, onDone }: {
  open: boolean; onClose: () => void; classes: any[]; onDone: (id: number) => void;
}) {
  const toast = useToast();
  const [classId, setClassId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [attemptNo, setAttemptNo] = useState(1);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const students = useApi<{ rows: any[] }>(open && classId ? `/students?classId=${classId}` : null);

  const submit = async () => {
    if (busy) return;                       // chặn bấm hai lần tạo trùng bản ghi
    setBusy(true);
    try {
      const r = await api.post<any>('/mocks', { studentId, classId, attemptNo, plannedDate: date });
      onDone(r.id);
      onClose();
    } catch (e: any) {
      toast.push('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Lên lịch Mock Test"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !studentId || !date}>
          {busy ? 'Đang lưu…' : 'Lưu lịch'}
        </button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Lớp</span>
          <select className="field" value={classId ?? ''} onChange={(e) => { setClassId(Number(e.target.value) || null); setStudentId(null); }}>
            <option value="">Chọn lớp…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Học viên</span>
          <select className="field" value={studentId ?? ''} onChange={(e) => setStudentId(Number(e.target.value) || null)} disabled={!classId}>
            <option value="">Chọn học viên…</option>
            {(students.data?.rows ?? []).map((s) => <option key={s.id} value={s.id}>{s.fullName} · {s.studentCode}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Lần Mock</span>
            <select className="field" value={attemptNo} onChange={(e) => setAttemptNo(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>MT{n}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Ngày dự kiến</span>
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <SectionNote>
          Tuần học FT chỉ dùng để gợi ý (MT1 tuần 6, MT2 tuần 12, MT3 tuần 16, MT4 tuần 20, MT5 tuần 24).
          Ngày cụ thể vẫn do quản lý xác nhận.
        </SectionNote>
      </div>
    </Modal>
  );
}
