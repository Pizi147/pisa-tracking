import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { invalidate } from '../lib/api.ts';
import { Card, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ClassRoster } from '../components/ClassRoster.tsx';
import { IntakePanel } from '../components/IntakePanel.tsx';
import { usePeriods } from '../components/Filters.tsx';
import { fmtDate, skillLabel } from '../lib/format.ts';
import { skillShort } from '@shared/domain.ts';
import { useSession } from '../lib/session.tsx';

type Overview = {
  id: number; code: string; kind: string; route: string | null;
  isFulltime: boolean; startDate: string | null; note: string | null;
  branchId: number; branchCode: string; branchName: string;
  summary: { studentCount: number; needScores: number; openCases: number; needsDate: number } | null;
  skills: { skill: string; sessionsPerWeek: number }[];
  coreTeachers: { id: number; name: string }[];
  skillTeachers: { skill: string; id: number; name: string }[];
  programme: { code: string; name: string; weeks: number | null; scoringMode: string } | null;
  viewer: {
    canPlanWeek: boolean; canSetDate: boolean; canAddStudents: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
  };
};

/** Trang một lớp: thông tin lớp, phân công, việc cần chú ý và danh sách học viên. */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [intake, setIntake] = useState(false);
  const { data, loading, error, reload } = useApi<Overview>(classId ? `/classes/${classId}/overview` : null);

  useEffect(() => {
    if (periodId === null && periods.data?.length && session) {
      const cur = periods.data.find((p) => p.weekStart <= session.demoDate && p.weekEnd >= session.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;

  const s = data.summary;
  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">{data.code}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.branchName} · {data.programme?.name ?? data.kind}{data.route ? ` · ${data.route}` : ''}
            {data.programme?.weeks ? ` · khoá ${data.programme.weeks} tuần` : ''}
            {data.startDate && ` · khai giảng ${fmtDate(data.startDate)}`}
          </p>
          {/* Nhắc ngay ở đầu trang: bạn phụ trách gì ở chính lớp này. */}
          {(data.viewer.editableSkills.length > 0 || data.viewer.isCoreTeacher) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-slate-500">Bạn phụ trách:</span>
              {data.viewer.editableSkills.map((k) => (
                <Pill key={k} tone="info">{skillShort(k)}</Pill>
              ))}
              {data.viewer.isCoreTeacher && <Pill tone="neutral">GVCN</Pill>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Lớp thường chấm theo số câu đúng nên có bảng điểm riêng. */}
          <Link
            className="btn no-underline"
            to={data.programme?.scoringMode === 'ratio'
              ? `/bang-diem-thuong/${data.id}`
              : `/nhap-diem/${data.id}${periodId ? `?periodId=${periodId}` : ''}`}
          >
            Nhập điểm cả lớp
          </Link>
          {data.viewer.canAddStudents && (
            <button className="btn btn-primary" onClick={() => setIntake(true)}>Thêm học viên</button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Sĩ số</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{s?.studentCount ?? 0}</div>
        </div>
        <Link className="card p-4 no-underline hover:border-[color:var(--accent-line)]"
          to={`/hoc-vien?view=my_scores&classId=${data.id}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Cần nhập điểm</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${s?.needScores ? 'text-amber-200' : 'text-slate-100'}`}>
            {s?.needScores ?? 0}
          </div>
        </Link>
        <Link className="card p-4 no-underline hover:border-[color:var(--accent-line)]"
          to={`/hoc-vien?view=sos_open&classId=${data.id}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Case SOS chưa xong</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${s?.openCases ? 'text-rose-200' : 'text-slate-100'}`}>
            {s?.openCases ?? 0}
          </div>
        </Link>
        <Link className="card p-4 no-underline hover:border-[color:var(--accent-line)]"
          to={`/hoc-vien?view=need_date&classId=${data.id}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Cần cập nhật ngày</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${s?.needsDate ? 'text-sky-200' : 'text-slate-100'}`}>
            {s?.needsDate ?? 0}
          </div>
        </Link>
      </div>

      <Card title="Phân công và kỹ năng">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="label">Giáo viên chủ nhiệm</div>
            <div className="flex flex-wrap gap-1">
              {data.coreTeachers.length
                ? data.coreTeachers.map((t) => <Pill key={t.id} tone="info">{t.name}</Pill>)
                : <span className="text-xs text-slate-500">Chưa phân công</span>}
            </div>
          </div>
          <div>
            <div className="label">Giáo viên bộ môn</div>
            <div className="flex flex-wrap gap-1">
              {data.skillTeachers.length
                ? data.skillTeachers.map((t, i) => (
                    <Pill key={i} tone="neutral">{skillLabel(t.skill)}: {t.name}</Pill>
                  ))
                : <span className="text-xs text-slate-500">Chưa phân công</span>}
            </div>
          </div>
        </div>
        <SectionNote>
          Kỹ năng lớp học do quản lý cấu hình ({data.skills.map((x) => skillLabel(x.skill)).join(' · ') || 'chưa cấu hình'}),
          không suy từ tên lớp. Giáo viên chỉ sửa được kỹ năng mình được phân công.
        </SectionNote>
      </Card>

      <Card title="Học viên" bodyClass="p-3">
        <ClassRoster classId={data.id} onAddStudents={() => setIntake(true)} />
      </Card>

      {intake && (
        <IntakePanel
          defaultClass={{ id: data.id, code: data.code }}
          onClose={() => setIntake(false)}
          onDone={() => { invalidate('/classes'); reload(); }}
        />
      )}
    </div>
  );
}
