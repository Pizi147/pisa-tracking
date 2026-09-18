import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { Alert, Card, ErrorState, Info, SectionNote, Skeleton, Status, Task } from '../../ui/ui.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { ClassRoster } from '../students/ClassRoster.tsx';
import { ClassBehaviourBoard } from './ClassBehaviourBoard.tsx';
import { ClassIssueBoard } from './ClassIssueBoard.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { TeacherAssignDialog } from './TeacherAssignPanel.tsx';
import { ClassProgressPanel } from './ClassProgressPanel.tsx';
import { TransitionPanel } from './TransitionPanel.tsx';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { fmtDate, skillLabel } from '../../lib/format.ts';
import { skillShort } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';

type Overview = {
  id: number; code: string; kind: string; route: string | null;
  isFastTrack: boolean; startDate: string | null; note: string | null;
  branchId: number; branchCode: string; branchName: string;
  summary: {
    studentCount: number; needScores: number; openCases: number;
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
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean;
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
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportFor, setReportFor] = useState<number>(0);
  const [infoOpen, setInfoOpen] = useState(false);
  /* HAI DẠNG XEM DANH SÁCH HỌC VIÊN (mục 13.3) — mặc định là Học thuật. */
  const [view, setView] = useState<'academic' | 'behaviour'>('academic');
  const { data, loading, error, reload } = useApi<Overview>(classId ? `/classes/${classId}/overview` : null);
  /* Danh sách em trong lớp, để ô "+ Case" chọn được học viên ngay tại trang lớp. */
  const roster = useApi<any[]>(classId ? `/classes/${classId}/roster` : null, [classId]);

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
    { n: s?.needScores ?? 0, label: 'cần nhập điểm Test', tone: 'warn' as const, view: 'my_scores' },
    { n: s?.openCases ?? 0, label: 'case chưa xong', tone: 'danger' as const, view: 'case_working' },
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

            Với lớp FT thì `progressLabel` chỉ là "Fast Track · LT1", đúng bằng chữ đã có ở
            dòng ngay trên. Nên chỉ vẽ dòng này khi nó nói thêm được điều gì: lớp Normal có
            tuần học, hoặc lớp đang thiếu thông tin gì đó.
          */}
          {(s?.totalWeeks || (s?.missing.length ?? 0) > 0) && (
            <p className="mt-1.5 mb-0 flex flex-wrap items-center gap-1.5">
              {!s?.totalWeeks ? null : s.needsPlacement ? (
                <Alert>{s.progressLabel}</Alert>
              ) : s.phase === 'final_week' || s.phase === 'progress_week' ? (
                <Status kind="doing">{s.progressLabel}</Status>
              ) : s.phase === 'final_soon' || s.phase === 'progress_soon' ? (
                <Status kind="waiting">{s.progressLabel}</Status>
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
                <Info key={k}>{skillShort(k)}</Info>
              ))}
              {data.viewer.isCoreTeacher && <Info>GVCN</Info>}
            </div>
          )}
        </div>
        {/*
          NHẬP ĐIỂM PHẢI DỄ THẤY (mục 5.1). Đó là việc hằng ngày của giáo viên, nên nó giữ
          nguyên chỗ và giữ nguyên hình dạng một cái nút.

          Ba việc quản trị — tiến độ lớp, phân công giáo viên, chuyển tiếp lên lớp sau — gom
          vào "Quản lý lớp". Chúng mỗi khoá làm một lần, không đáng chiếm ba ô ngang hàng
          với việc làm mỗi tuần.
        */}
        <div className="flex flex-wrap gap-2">
          {/* "Nhập điểm test" — gọi đúng việc, vì lớp Normal làm Progress/Final chứ không làm MT. */}
          <Link
            className="btn btn-primary no-underline"
            to={data.programme?.scoringMode === 'ratio'
              ? `/bang-diem-thuong/${data.id}`
              : `/nhap-diem/${data.id}${periodId ? `?periodId=${periodId}` : ''}`}
          >
            Nhập điểm test
          </Link>
          {/*
            +CASE NGAY Ở TRANG LỚP (mục 13.1) — cùng một form với hồ sơ học viên, chỉ thêm ô
            chọn em ở đầu. Dựng một form thứ hai cho trang lớp là cách chắc chắn nhất để hai
            chỗ dần khác nhau về luật.
          */}
          <button className="btn" onClick={() => { setReportFor(0); setReportOpen(true); }}>+ Case</button>
          {data.viewer.canAddStudents && (
            <button className="btn" onClick={() => setIntake(true)}>Thêm học viên</button>
          )}
          {(data.viewer.canEditProgress || data.viewer.canAssign) && (
            <button className="btn" title="Quản lý lớp" aria-label="Quản lý lớp"
              onClick={() => setManageOpen(true)}>⋮</button>
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
            <Task tone={j.tone}>{j.n} {j.label}</Task>
          </Link>
        ))}
        {/*
          Lớp học hết chương trình là việc nặng nhất, và nó không tự xảy ra.
          Bấm vào mở thẳng panel CHUYỂN TIẾP chứ không phải panel tiến độ: người bấm vào đây
          đang muốn xếp lớp cho các em, không phải muốn sửa lại tuần khai giảng.
        */}
        {s?.needsPlacement && (
          <Task tone="danger" as="button" onClick={() => setTransitionOpen(true)}>
            {s.studentCount} học viên cần xếp lớp tiếp
            {s.placementOptions.length ? ` · ${s.placementOptions.map((o) => o.code).join(' hoặc ')}` : ''}
          </Task>
        )}
      </div>

      {/*
        BẢNG PHÂN TÍCH VẤN ĐỀ đặt NGAY SAU box lớp và MẶC ĐỊNH THU GỌN (mục 13.4) — nó trả lời
        câu hỏi của người chủ nhiệm ngồi xem cả lớp, nhưng không được đẩy danh sách học viên
        xuống dưới màn hình với những ai chỉ vào để tìm một em.
      */}
      <ClassIssueBoard classId={data.id} ratio={data.programme?.scoringMode === 'ratio'} />

      {/*
        Học viên lên TRƯỚC: đó là thứ người ta mở trang lớp để xem.

        HAI DẠNG XEM (mục 13.3) dùng CHUNG một danh sách học viên, chỉ đổi cột: Học thuật hỏi
        điểm và tiến độ từng môn, Ý thức hỏi số đợt BTVN/chuyên cần/tham gia và hai con số hành
        động đã làm thật. Tách thành hai trang riêng là cách chắc chắn nhất để hai nơi dần đếm
        khác nhau.
      */}
      <Card title="Học viên" bodyClass="p-3"
        action={
          <div className="flex gap-1">
            <ViewTab active={view === 'academic'} onClick={() => setView('academic')}>Học thuật</ViewTab>
            <ViewTab active={view === 'behaviour'} onClick={() => setView('behaviour')}>Ý thức</ViewTab>
          </div>
        }>
        {view === 'academic'
          ? <ClassRoster classId={data.id} onAddStudents={() => setIntake(true)} />
          : <ClassBehaviourBoard classId={data.id} />}
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
                    ? data.coreTeachers.map((t) => <Info key={t.id}>{t.name}</Info>)
                    : <Alert tone="warn">Chưa có GVCN</Alert>}
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
                      {t ? <span className="text-slate-100">{t.name}</span> : <Alert tone="warn">Chưa phân công</Alert>}
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

      {/*
        MENU QUẢN LÝ LỚP. Panel này chỉ để CHỌN việc; chọn xong nó tự đóng rồi panel của
        việc đó mở ra, nên không bao giờ có hai lớp panel chồng nhau (mục 5.2).
      */}
      <Drawer open={manageOpen} onClose={() => setManageOpen(false)} width="max-w-md"
        title="Quản lý lớp" subtitle={`${data.code} · ${data.branchName}`}>
        <div className="space-y-2">
          {/*
            THÔNG TIN LỚP gộp "Tiến độ lớp" và "Phân công giáo viên" (mục 13.1). Hai mục cũ
            đều trả lời cùng một câu — lớp này được cấu hình thế nào — nên tách ra chỉ bắt
            người dùng đoán xem tuần khai giảng nằm ở mục nào.
          */}
          {(data.viewer.canEditProgress || data.viewer.canAssign) && (
            <ManageItem label="Thông tin lớp"
              hint="Tuần khai giảng, số tuần học, mốc Test, và phân công GVCN/GVBM."
              onClick={() => { setManageOpen(false); setInfoOpen(true); }} />
          )}
          {/*
            CHUYỂN TIẾP LÊN LỚP SAU CHỈ CÓ Ở LỚP NORMAL (mục 13.2).
            Fast Track không có "lớp sau": em học theo lộ trình của riêng mình rồi đi thi.
            Nhu cầu chuyển ngang hoặc đổi chi nhánh vẫn có, và nó nằm ở "Chuyển lớp" trong
            hồ sơ từng em.
          */}
          {data.viewer.canEditProgress && data.programme?.scoringMode === 'ratio' && (
            <ManageItem label="Chuyển tiếp lên lớp sau"
              hint="Mở lớp tiếp theo và chuyển học viên sang. Lớp cũ giữ nguyên lịch sử."
              onClick={() => { setManageOpen(false); setTransitionOpen(true); }} />
          )}
          {data.programme?.scoringMode !== 'ratio' && (
            <SectionNote>
              Lớp Fast Track không có “chuyển tiếp lên lớp sau” — em học theo lộ trình riêng rồi đi
              thi. Chuyển ngang hoặc đổi chi nhánh thì làm ở <strong>Chuyển lớp</strong> trong hồ sơ
              từng em.
            </SectionNote>
          )}
        </div>
      </Drawer>

      <TransitionPanel classId={data.id} open={transitionOpen}
        onClose={() => setTransitionOpen(false)} onDone={reload} />
      {progressOpen && (
        <ClassProgressPanel classId={data.id} classCode={data.code}
          onClose={() => setProgressOpen(false)} onDone={reload} />
      )}

      {/*
        THÔNG TIN LỚP (mục 13.1) — một chỗ cho cả cấu hình lớp lẫn phân công, vì cả hai đều
        trả lời cùng một câu: lớp này được dựng thế nào.
      */}
      <Drawer open={infoOpen} onClose={() => setInfoOpen(false)} width="max-w-md"
        title="Thông tin lớp" subtitle={`${data.code} · ${data.branchName}`}>
        <div className="space-y-2">
          {data.viewer.canEditProgress && (
            <ManageItem label="Tiến độ lớp"
              hint="Tuần khai giảng, số tuần học, tuần Progress Test và Final Test."
              onClick={() => { setInfoOpen(false); setProgressOpen(true); }} />
          )}
          {data.viewer.canAssign && (
            <ManageItem label="Phân công giáo viên"
              hint="Chủ nhiệm và giáo viên từng kỹ năng của lớp này."
              onClick={() => { setInfoOpen(false); setAssign(true); }} />
          )}
        </div>
      </Drawer>

      {/* Cùng form +Case với hồ sơ học viên, chỉ thêm ô chọn em ở đầu (mục 13.1). */}
      <QuickReport
        open={reportOpen} onClose={() => { setReportOpen(false); setReportFor(0); }}
        studentId={reportFor}
        students={(roster.data ?? []).map((r: any) => ({
          id: r.id, name: r.fullName, code: r.studentCode ?? null,
        }))}
        onPickStudent={setReportFor}
        onDone={() => { setReportOpen(false); setReportFor(0); reload(); }}
      />
    </div>
  );
}

/** Nút chuyển giữa hai dạng xem danh sách học viên — cùng kiểu tab với các trang khác. */
function ViewTab({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {children}
    </button>
  );
}

/** Một dòng trong menu Quản lý lớp — tên việc, một câu nói rõ nó làm gì. */
function ManageItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left rounded-lg border px-3 py-2.5 bg-transparent hover:brightness-125"
      style={{ borderColor: 'var(--line)' }}>
      <span className="block text-sm text-slate-100">{label}</span>
      <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>
    </button>
  );
}
