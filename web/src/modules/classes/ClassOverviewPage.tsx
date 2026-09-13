import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { Card, ErrorState, Pill, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { ClassRoster } from '../students/ClassRoster.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { TeacherAssignDialog } from './TeacherAssignPanel.tsx';
import { ClassProgressPanel } from './ClassProgressPanel.tsx';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { fmtDate, skillLabel } from '../../lib/format.ts';
import { skillShort } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';

type Overview = {
  id: number; code: string; kind: string; route: string | null;
  isFulltime: boolean; startDate: string | null; note: string | null;
  branchId: number; branchCode: string; branchName: string;
  summary: {
    studentCount: number; needScores: number; openCases: number; needsDate: number;
    /* Tiến độ lớp và những thứ còn thiếu — dùng chung một bộ với danh sách lớp. */
    progressLabel: string | null; phase: string; phaseLabel: string;
    currentWeek: number | null; totalWeeks: number | null;
    needsPlacement: boolean; placementOptions: { code: string; name: string }[];
    missing: { key: string; label: string; who: string }[];
    missingSkills: string[];
  } | null;
  skills: { skill: string; sessionsPerWeek: number }[];
  coreTeachers: { id: number; name: string }[];
  skillTeachers: { skill: string; id: number; name: string }[];
  programme: { code: string; name: string; weeks: number | null; scoringMode: string } | null;
  viewer: {
    canPlanWeek: boolean; canSetDate: boolean; canAddStudents: boolean; canAssign: boolean;
    canEditProgress: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
  };
};

/**
 * TRANG MỘT LỚP — làm lại ở vòng 4 (mục 8.6).
 *
 * Owner nói trang cũ "vừa rối mắt vừa sơ sài" và giao tự đề xuất. Ba thứ đã đổi, và lý do:
 *
 * 1. BỐN Ô SỐ TO thành MỘT DẢI VIỆC, và dải đó chỉ hiện thứ KHÁC KHÔNG. Bốn ô cũ chiếm
 *    nguyên một tầng màn hình để nói "0 · 0 · 0 · 0" ở phần lớn lớp đang chạy êm — tốn chỗ
 *    đúng bằng lúc có việc, nên mắt thôi nhìn chúng. Lớp không có việc gì thì nói đúng một
 *    câu như vậy.
 *
 * 2. PHÂN CÔNG thành BẢNG MỘT KỸ NĂNG MỘT DÒNG, và dòng thiếu người tô vàng ngay tại chỗ.
 *    Hai đám pill "GVCN" và "GVBM" của bản cũ không trả lời được câu hỏi hay gặp nhất —
 *    "ai dạy Writing lớp này?" — mà phải đọc hết cả đám mới tìm ra, hoặc không tìm ra vì
 *    kỹ năng đó đang trống.
 *
 * 3. DANH SÁCH HỌC VIÊN LÊN TRƯỚC phân công. Đó là thứ người ta mở trang lớp để xem; phân
 *    công là việc sửa vài tháng một lần.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [intake, setIntake] = useState(false);
  const [assign, setAssign] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
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
  /* Chỉ những việc THỰC SỰ đang tồn mới được chiếm chỗ trên màn hình. */
  const jobs = [
    { n: s?.needScores ?? 0, label: 'cần nhập điểm MT', tone: 'warn' as const, view: 'my_scores' },
    { n: s?.openCases ?? 0, label: 'case chưa xong', tone: 'danger' as const, view: 'case_working' },
    { n: s?.needsDate ?? 0, label: 'cần cập nhật ngày MT', tone: 'info' as const, view: 'need_date' },
  ].filter((j) => j.n > 0);

  /* Một dòng cho mỗi kỹ năng của chương trình lớp — kể cả kỹ năng chưa có ai dạy. */
  const teacherOf = (skill: string) => data.skillTeachers.find((t) => t.skill === skill) ?? null;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">{data.code}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.branchName} · {data.programme?.name ?? data.kind}{data.route ? ` · ${data.route}` : ''}
            {' · '}{s?.studentCount ?? 0} học viên
            {data.startDate && ` · khai giảng ${fmtDate(data.startDate)}`}
          </p>
          {/*
            TIẾN ĐỘ LỚP ngay dưới tên lớp — với lớp Normal đây là câu quan trọng nhất của
            trang: đang ở tuần thứ mấy, sắp thi gì, hay đã hết chương trình.

            Với lớp FT thì `progressLabel` chỉ là "Fulltime · LT1", đúng bằng chữ đã có ở
            dòng ngay trên. Nên chỉ vẽ dòng này khi nó nói thêm được điều gì: lớp Normal có
            tuần học, hoặc lớp đang thiếu thông tin gì đó.
          */}
          {(s?.totalWeeks || (s?.missing.length ?? 0) > 0) && (
            <p className="mt-1.5 mb-0 flex flex-wrap items-center gap-1.5">
              {!s?.totalWeeks ? null : s.needsPlacement ? (
                <Pill tone="danger">{s.progressLabel}</Pill>
              ) : s.phase === 'final_week' || s.phase === 'progress_week' ? (
                <Pill tone="warn">{s.progressLabel}</Pill>
              ) : s.phase === 'final_soon' || s.phase === 'progress_soon' ? (
                <Pill tone="info">{s.progressLabel}</Pill>
              ) : (
                <span className="text-xs text-slate-400">{s.progressLabel}</span>
              )}
              <MissingBadge items={(s?.missing ?? []).filter((m: any) => m.key !== 'teachers')} />
            </p>
          )}
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
          {data.viewer.canEditProgress && (
            <button className="btn" onClick={() => setProgressOpen(true)}>Tiến độ lớp</button>
          )}
          {data.viewer.canAddStudents && (
            <button className="btn btn-primary" onClick={() => setIntake(true)}>Thêm học viên</button>
          )}
        </div>
      </div>

      {/*
        DẢI VIỆC: một dòng, chỉ hiện thứ khác không, mỗi cái bấm được và mở đúng danh sách
        tạo nên con số đó. Lớp đang êm thì nói đúng một câu, không bày bốn số 0.
      */}
      <div className="flex flex-wrap items-center gap-2">
        {jobs.length === 0 ? (
          <span className="text-xs text-slate-500">Lớp này không có việc nào đang tồn.</span>
        ) : jobs.map((j) => (
          <Link key={j.view} className="no-underline" to={`/hoc-vien?view=${j.view}&classId=${data.id}&open=${data.id}`}>
            <Pill tone={j.tone}>{j.n} {j.label}</Pill>
          </Link>
        ))}
        {/* Lớp học hết chương trình là việc nặng nhất, và nó không tự xảy ra. */}
        {s?.needsPlacement && (
          <button className="appearance-none bg-transparent border-0 p-0" onClick={() => setProgressOpen(true)}>
            <Pill tone="danger">
              {s.studentCount} học viên cần xếp lớp tiếp
              {s.placementOptions.length ? ` · ${s.placementOptions.map((o) => o.code).join(' hoặc ')}` : ''}
            </Pill>
          </button>
        )}
      </div>

      {/* Học viên lên TRƯỚC: đó là thứ người ta mở trang lớp để xem. */}
      <Card title="Học viên" bodyClass="p-3">
        <ClassRoster classId={data.id} onAddStudents={() => setIntake(true)} />
      </Card>

      <Card title="Phân công giáo viên"
        action={data.viewer.canAssign
          ? <button className="btn btn-sm" onClick={() => setAssign(true)}>Sửa phân công</button>
          : undefined}>
        <div className="surface-2 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="row-hover">
                <td className="td w-44 text-slate-400 whitespace-nowrap">Chủ nhiệm</td>
                <td className="td">
                  {data.coreTeachers.length
                    ? data.coreTeachers.map((t) => <Pill key={t.id} tone="info">{t.name}</Pill>)
                    : <Pill tone="warn">Chưa có GVCN</Pill>}
                </td>
              </tr>
              {/*
                MỘT DÒNG MỖI KỸ NĂNG, kể cả kỹ năng chưa ai dạy. Chỗ trống phải NHÌN THẤY
                ĐƯỢC: bản cũ chỉ liệt kê người đã phân công, nên kỹ năng thiếu giáo viên
                lặng lẽ không xuất hiện ở đâu cả.
              */}
              {data.skills.map((x) => {
                const t = teacherOf(x.skill);
                return (
                  <tr key={x.skill} className="row-hover">
                    <td className="td w-44 text-slate-400 whitespace-nowrap">{skillLabel(x.skill)}</td>
                    <td className="td">
                      {t ? <span className="text-slate-100">{t.name}</span> : <Pill tone="warn">Chưa phân công</Pill>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <SectionNote>
          Mỗi kỹ năng đúng <strong>một giáo viên</strong>, và một giáo viên dạy được nhiều kỹ năng.
          Lớp có đúng <strong>một GVCN</strong>, và GVCN phải dạy ít nhất một kỹ năng ở chính lớp này.
          Kỹ năng của lớp đi theo chương trình ({data.programme?.name ?? data.kind}), không suy từ tên lớp.
        </SectionNote>
      </Card>

      <TeacherAssignDialog open={assign} onClose={() => setAssign(false)}
        classId={data.id} classCode={data.code} onDone={reload} />

      {intake && (
        <IntakePanel
          defaultClass={{ id: data.id, code: data.code }}
          onClose={() => setIntake(false)}
          onDone={() => { invalidate('/classes'); reload(); }}
        />
      )}

      {progressOpen && (
        <ClassProgressPanel classId={data.id} classCode={data.code}
          onClose={() => setProgressOpen(false)} onDone={reload} />
      )}
    </div>
  );
}
