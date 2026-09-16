import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Info, Level, Outcome, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import { Drawer, Modal } from '../../ui/Drawer.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { CasePanel } from '../cases/CasePanel.tsx';
import { SkillBoard } from '../cases/SkillBoard.tsx';
import { StudentCases } from '../cases/StudentCases.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { ProgressChart } from './ProgressChart.tsx';
import { StudentManagePanel } from './StudentManagePanel.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import {
  attemptHref,
  attemptStatusLabel, fmtBand, fmtDate, skillLabel, sosLabel, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import { JOURNEY_EVENT_LABEL } from '@shared/domain/index.ts';

type Profile = any;

/**
 * HỒ SƠ HỌC VIÊN.
 *
 * Trang này phải trả lời được trong khoảng ba mươi giây: em bắt đầu ở đâu, đang ở đâu,
 * đích ở đâu, có đang theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì.
 *
 * BA TẦNG, theo đúng thứ tự người ta muốn biết (owner duyệt 13/09/2026):
 *
 *   Tầng 1  EM NÀY LÀ AI            thẻ tên dính trên đầu khi cuộn
 *   Tầng 2  YẾU CHỖ NÀO, ĐÃ LÀM GÌ  bảng sáu hạng mục — trái tim của trang
 *   Tầng 3  SỐ LIỆU THÔ            hai thẻ: điểm qua các lượt · nhật ký
 *
 * Bản trước là BẢY cái hộp xếp chồng, trong đó ba hộp — "Đang cần chú ý", "Đường đi từng kỹ
 * năng" và bảng "Vấn đề học vụ" — nói cùng một chuyện bằng ba cách khác nhau, nên đọc hết
 * trang vẫn phải tự ghép lại mới ra kết luận. Owner gọi đúng tên nó: "vừa rối mắt vừa sơ sài".
 *
 * Ai chỉ cần liếc nhanh thì dừng ở tầng 1–2 và không phải cuộn dòng nào.
 *
 * Toàn bộ dữ liệu thuộc về MỘT lộ trình. Đổi lộ trình ở đầu trang là đổi cả trang — không
 * bao giờ trộn hai lộ trình vào một khung nhìn, vì mục tiêu và thang điểm của chúng khác nhau.
 */
export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const cycleParam = params.get('lo-trinh');
  const q = cycleParam ? `?cycleId=${cycleParam}` : '';
  const { data, loading, error, reload } = useApi<Profile>(id ? `/students/${id}${q}` : null, [cycleParam]);
  const [manageOpen, setManageOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  /** Tín hiệu đang được xác minh — mở form case với đầu mục và kỹ năng điền sẵn. */
  const [verify, setVerify] = useState<any | null>(null);
  const [openCase, setOpenCase] = useState<number | null>(null);
  /*
   * HẠNG MỤC ĐANG LỌC — một state duy nhất nối bảng kỹ năng với khối case bên dưới.
   * Bấm "Reading" ở bảng trên là khối dưới chỉ còn case Reading; bấm lại thì bỏ lọc.
   */
  const [skillPick, setSkillPick] = useState<string | null>(null);
  /* Tầng 3 mặc định mở bảng điểm: đó là thứ người ta mở hồ sơ để xem nhiều nhất. */
  const [tier3, setTier3] = useState<'scores' | 'journey'>('scores');

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;

  const setCycle = (cid: number) => {
    const next = new URLSearchParams(params);
    if (cid === data.cycles.find((c: any) => c.status === 'active')?.id) next.delete('lo-trinh');
    else next.set('lo-trinh', String(cid));
    setParams(next, { replace: true });
  };

  return (
    <div className="page space-y-4">
      {/* ══════════════════════════════════════════ A — EM NÀY LÀ AI */}
      {/*
        ĐẦU HỒ SƠ CUỘN BÌNH THƯỜNG, KHÔNG DÍNH TRÊN ĐẦU (mục 6.1).
        Bản trước ghim khối này lại khi cuộn. Ý định thì tốt — biết đang xem em nào — nhưng
        cái giá là một dải chiếm chỗ vĩnh viễn ở mọi màn hình, và trên laptop thì phần nội
        dung thật chỉ còn hơn nửa màn. Tên em đã ở ngay đầu trang; cuộn xuống đọc bảng điểm
        thì cái cần thấy là bảng điểm.
      */}
      <div>
        <button className="btn btn-sm btn-ghost mb-1.5" onClick={() => navigate(-1)}>← Quay lại</button>
        <div className="rounded-xl border p-3 sm:p-4"
             style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-100 flex flex-wrap items-center gap-2 m-0">
                {data.fullName}
                <span className="text-slate-500 text-sm font-normal">· {data.studentCode}</span>
                <MissingBadge items={data.missing} />
                {data.status !== 'active' && <Info>{studentStatusLabel(data.status)}</Info>}
                {data.archivedAt && <Info>Đã lưu trữ</Info>}
              </h1>

              {/* Lớp · chi nhánh · chương trình · GVCN — bốn thứ nhận diện chỗ đứng của em. */}
              <p className="text-xs text-slate-400 mt-1 mb-0">
                {data.currentClass
                  ? <>Lớp {data.currentClass.code} · {data.currentClass.branchName}
                      {data.currentClass.programme && <> · {data.currentClass.programme}</>}
                      {data.currentClass.coreTeacher && <> · GVCN {data.currentClass.coreTeacher}</>}</>
                  : 'Chưa xếp lớp'}
              </p>

              {/*
                TÌNH TRẠNG HỌC THUẬT HIỆN TẠI — một câu, dựng ở máy chủ (mục 2.1).
                "MT2 đạt kỳ vọng · còn 2 case đang theo dõi" nói đủ ba việc mà trước đây phải
                đọc ba chỗ mới ra: kết quả bài gần nhất, mức SOS của chính bài đó, và số case.
              */}
              {data.standing && (
                <p className="text-sm mt-1.5 mb-0 flex flex-wrap items-center gap-2">
                  {data.standing.sosLevel !== null && data.standing.sosLevel > 0 ? (
                    <Level tone={sosTone(data.standing.sosLevel)}>
                      {sosLabel(data.standing.sosLevel)}{data.standing.provisional ? ' tạm thời' : ''}
                    </Level>
                  ) : data.standing.sosLevel === 0 ? (
                    <Outcome tone="ok" mark="✓">Đạt kỳ vọng</Outcome>
                  ) : (
                    <Info pending>Chưa có kết quả</Info>
                  )}
                  <span className="text-slate-300">{data.standingLine}</span>
                </p>
              )}

              {/* Đầu vào · target · dự kiến thi — chỉ lớp Fast Track mới có ba thứ này. */}
              <p className="text-xs text-slate-400 mt-1.5 mb-0">
                {cy && !cy.ratio && (
                  <>
                    {cy.baseline?.score !== null && cy.baseline?.score !== undefined
                      ? <>Đầu vào {fmtBand(cy.baseline.score)}</>
                      : <span className="text-amber-300">Chưa ghi đầu vào</span>}
                    {cy.target !== null && <> · Target {fmtBand(cy.target)}</>}
                    {' · '}Vào học {cy.startWeek ? cy.startWeek.code
                      : <span className="text-amber-300">chưa khai tuần</span>}
                    {/*
                      DỰ KIẾN THI nói đúng mức chắc chắn đang có. Biết mỗi tháng mà hiện
                      "còn 134 ngày" là bịa ra một độ chính xác không ai bảo đảm; biết tuần
                      thì nói "còn khoảng N tuần", không quy về ngày (mục 6.4).
                    */}
                    {cy.examPlan && cy.examPlan.confidence !== 'none' && (
                      <> · Dự kiến thi {cy.examPlan.label}
                        {cy.examPlan.confidence === 'week' && cy.daysToExam !== null && (
                          <span className="text-slate-500"> (còn khoảng {Math.max(0, Math.round(cy.daysToExam / 7))} tuần)</span>
                        )}</>
                    )}
                  </>
                )}
                {cy?.ratio && (
                  <>{cy.label} · bắt đầu {fmtDate(cy.startedAt)} ·{' '}
                    {data.attempts.filter((a: any) => a.scored > 0).length}/{data.attempts.length} bài đã chấm</>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              {data.viewer.canReport && (
                <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              {/* Menu ⋮ — bốn việc quản trị, gom lại để không chiếm chỗ của việc hằng ngày. */}
              <button className="btn" title="Quản lý học viên" aria-label="Quản lý học viên"
                onClick={() => setManageOpen(true)}>⋮</button>
            </div>
          </div>

          {/*
            DẢI HÀNH TRÌNH NGẮN (mục 6.2 A) — chỉ để NHẬN BIẾT em đã đi qua những chương
            trình nào, không phải chỗ đọc lịch sử. Bấm một chặng là xem chặng đó.
          */}
          {data.journeyStrip?.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t"
                 style={{ borderColor: 'var(--line)' }}>
              <span className="text-[11px] text-slate-500 mr-1">Hành trình</span>
              {data.journeyStrip.map((j: any, i: number) => (
                <span key={j.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-700" aria-hidden>→</span>}
                  <button
                    className={`btn btn-sm ${j.id === cy?.id ? 'btn-primary' : ''}`}
                    onClick={() => setCycle(j.id)}>
                    {j.label}
                    {j.current && <span className="opacity-70 ml-1">· đang học</span>}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!cy ? (
        <Empty title="Học viên chưa có lộ trình nào" hint="Mở lộ trình để bắt đầu theo dõi mục tiêu và các mốc đánh giá." />
      ) : (
        <>
          {/* ══════════════════════════════════════ B — TIẾN ĐỘ HIỆN TẠI */}
          {/* ══════════════════════════════ B0 — TÍN HIỆU CHỜ XÁC MINH */}
          <PendingSignals
            signals={data.pendingSignals ?? []}
            studentName={data.fullName}
            onVerify={(sg) => setVerify(sg)}
            onDone={reload}
          />

          {/*
            BẢNG TÓM TẮT, KHÔNG PHẢI CHỖ MỞ CASE (mục 6.2 B).
            Bấm một dòng thì LỌC khối case bên dưới theo hạng mục đó. Trước vòng này dòng
            giãn ra dựng nguyên một CasePanel, trong khi chính case ấy lại nằm lần nữa ở khối
            bên dưới — một case hiện hai lần trên cùng một trang.
          */}
          <Card title="Tiến độ hiện tại"
            action={
              <span className="flex items-center gap-2">
                {skillPick && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setSkillPick(null)}>
                    Bỏ lọc {skillPick}
                  </button>
                )}
                <span className="text-xs text-slate-500">Bấm một dòng để lọc case bên dưới</span>
              </span>
            }
            bodyClass="p-0">
            <SkillBoard studentId={data.id} cycleId={cy.id}
              selected={skillPick}
              onPick={setSkillPick}
              onReport={() => setReportOpen(true)} />
          </Card>

          {/* ══════════════════════════════ C — CASE VÀ KẾT QUẢ HỖ TRỢ */}
          {/*
            Bảng phía trên tóm tắt THEO KỸ NĂNG và chỉ trỏ được vào MỘT case đại diện mỗi
            hạng mục. Em có hai case Reading song song thì cái thứ hai không có đường nào vào.

            Nên đây là DANH SÁCH CASE THẬT: mỗi case một khối riêng, mở đóng độc lập, xem
            được cả case của lộ trình trước.
          */}
          <Card title="Case và kết quả hỗ trợ"
            action={<span className="text-xs text-slate-500">Mỗi case mở đóng riêng</span>}>
            <StudentCases studentId={data.id} cycleId={cy.id} cycleLabel={cy.label}
              category={skillPick} onCategory={setSkillPick} />
          </Card>

          {/* ══════════════════════════════ TẦNG 3 — KẾT QUẢ VÀ HÀNH TRÌNH */}
          {/*
            Hai tab chứ không phải hai khối xếp chồng: bảng kết quả và hành trình đều dài,
            và hiếm khi ai cần đọc cả hai cùng lúc. Ai chỉ cần liếc nhanh thì dừng ở tầng
            1–2 và không phải cuộn thêm dòng nào.

            TÊN TAB GỌI ĐÚNG THEO CHƯƠNG TRÌNH (mục 7.11): lớp Fast Track là "Mock Test",
            lớp Normal là "Kết quả kiểm tra". Cụm "Điểm qua các lượt" đã bỏ — nó không phải
            tiếng Việt ai dùng, và nó đúng với cả hai loại lớp nên chẳng nói được gì.
          */}
          <Card title={
            <span className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${tier3 === 'scores' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTier3('scores')}>{cy.ratio ? 'Kết quả kiểm tra' : 'Mock Test'}</button>
              <button className={`btn btn-sm ${tier3 === 'journey' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTier3('journey')}>Hành trình học tập</button>
            </span>
          } bodyClass="p-0">
            {tier3 === 'scores' ? (
              <>
                {data.attempts.length === 0 ? (
                  <div className="p-4"><Empty title="Chưa có lượt đánh giá nào trong lộ trình này" /></div>
                ) : cy.ratio ? <RatioAttempts attempts={data.attempts} onOpen={(a) => navigate(attemptHref(a))} />
                  : <IeltsAttempts attempts={data.attempts} onOpen={(a) => navigate(attemptHref(a))} />}
                <div className="p-3">
                  <SectionNote>
                    Lớp ghi ở đây là lớp TẠI LÚC ĐÁNH GIÁ — chuyển lớp không viết lại lịch sử này.
                    Số MT đánh lại từ 1 khi sang lộ trình mới, học tiếp trong cùng lộ trình thì tăng tiếp.
                  </SectionNote>
                  {cy.targetRevisions.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2 mb-0">
                      Mục tiêu đã đổi {cy.targetRevisions.length} lần — lần gần nhất {fmtDate(cy.targetRevisions[0].effectiveFrom)}:
                      {' '}{fmtBand(cy.targetRevisions[0].oldTarget)} → {fmtBand(cy.targetRevisions[0].newTarget)}
                      {cy.targetRevisions[0].reason && ` (${cy.targetRevisions[0].reason})`}.
                      {' '}Các lượt đã chốt vẫn giữ kỳ vọng tính theo mục tiêu lúc đó.
                    </p>
                  )}
                  {cy.outcome && (
                    <p className="text-sm text-slate-200 mt-2 mb-0">
                      Kết luận lộ trình: <strong>{cy.outcome.label}</strong>
                      {cy.outcome.score !== null && ` · ${fmtBand(cy.outcome.score)}`}
                      {cy.outcome.note && <span className="text-slate-400"> — {cy.outcome.note}</span>}
                    </p>
                  )}
                  {!cy.baseline && !cy.ratio && (
                    <SectionNote>
                      Chưa ghi điểm đầu vào nên chưa tính được đã tiến bộ bao nhiêu. Hệ thống KHÔNG lấy
                      MT1 làm điểm đầu vào — hai thứ đó khác nhau.
                    </SectionNote>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 space-y-4">
                {/*
                  BIỂU ĐỒ TRƯỚC, DÒNG THỜI GIAN SAU (mục 7.12).
                  "Em có đang tiến bộ không" là câu hỏi đầu tiên ai mở tab này cũng hỏi, và
                  một hình nhỏ trả lời nó nhanh hơn mười dòng chữ. Dòng thời gian trả lời
                  câu thứ hai: vì sao lại thành ra như thế.
                */}
                {data.progress && data.progress.skills.length > 0 && (
                  <ProgressChart data={data.progress} />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Các mốc đã qua</h3>
                  {data.episodes.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
                    <ol className="space-y-3 list-none p-0 m-0">
                      {data.episodes.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={setOpenCase} />)}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ============================================== hộp thoại */}
      {planOpen && cy && (
        <StudentPlanPanel
          cycleId={cy.id}
          studentName={data.fullName}
          ratio={!!cy.ratio}
          onClose={() => setPlanOpen(false)}
          onDone={reload}
        />
      )}

      <QuickReport open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={data.id} studentName={data.fullName} cycleId={cy?.id ?? null}
        onDone={(cid) => { reload(); setOpenCase(cid); }} />

      {/* Mở case ĐỂ TRẢ LỜI một tín hiệu: đầu mục và kỹ năng điền sẵn, nhận định do người viết. */}
      <QuickReport open={!!verify} onClose={() => setVerify(null)}
        studentId={data.id} studentName={data.fullName} cycleId={cy?.id ?? null}
        signal={verify}
        onDone={(cid) => { setVerify(null); reload(); setOpenCase(cid); }} />

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề - Case"
        subtitle={data.fullName}
        footer={openCase !== null
          ? <Link className="btn" to={`/hoc-thuat/case/${openCase}`}>Mở trang riêng</Link>
          : null}>
        {openCase !== null && <CasePanel caseId={openCase} compact />}
      </Drawer>

      <StudentManagePanel
        open={manageOpen} onClose={() => setManageOpen(false)}
        student={{
          id: data.id, name: data.fullName, classId: data.currentClass?.id ?? null,
          dob: data.dob ?? null, consultantName: data.consultantName ?? null, note: data.note ?? null,
        }}
        cycle={cy} attempts={data.attempts} canEdit={data.viewer.canEdit}
        onOpenPlan={() => setPlanOpen(true)} onDone={reload}
      />
    </div>
  );
}

// ==================================================================== khối nhỏ

function IeltsAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (a: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <Th hint="Số thứ tự lượt Mock Test trong lộ trình này.">MT</Th>
            <Th hint="Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.">Lớp lúc đánh giá</Th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Lượt đã chấm xong, đang chờ, hay đã huỷ.">Trạng thái</Th>
            <Th hint="Band Listening">L</Th><Th hint="Band Reading">R</Th><Th hint="Band Writing — gộp từ W1 và W2">W</Th><Th hint="Band Speaking">S</Th>
            <Th hint="Band tổng của lượt, tính theo quy tắc IELTS. Thiếu một kỹ năng thì chưa có Overall.">Overall</Th>
            <Th hint="Mức mong đợi của chính lượt đó, tính theo mục tiêu tại thời điểm ấy. Đổi mục tiêu không chấm lại quá khứ.">Kỳ vọng</Th>
            <Th hint="Số kỹ năng dưới kỳ vọng ở lượt đó — đó chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a)}>
              <td className="td tabular-nums">MT{a.attemptNo}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Info pending>Chưa có tuần</Info>}
              </td>
              <td className="td">
                <Status kind={a.status === 'done' ? 'done' : a.status === 'cancelled' ? 'idle' : 'doing'}>
                  {attemptStatusLabel(a.status)}
                </Status>
              </td>
              <td className="td tabular-nums">{fmtBand(a.bands?.listening)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.reading)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.writing)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.speaking)}</td>
              <td className="td tabular-nums text-slate-100">{fmtBand(a.overall)}</td>
              <td className="td tabular-nums">{fmtBand(a.expectation)}</td>
              <td className="td">
                <Level tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} kỹ năng` : sosLabel(a.sosLevel)}
                </Level>
                {a.provisional && <div className="text-[10px] text-slate-500">mới {a.scored}/{a.required} kỹ năng</div>}
                {a.scopeNote && <div className="text-[10px] text-slate-500">{a.scopeNote}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Lớp Normal chấm theo ĐIỂM ĐẠT / TỔNG ĐIỂM — không có band, không có Overall, không có
 * kỳ vọng IELTS. Bấm một dòng ở đây mở BẢNG ĐIỂM LỚP NORMAL, không phải màn Mock Test.
 */
function RatioAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (a: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <Th hint="Progress Test (giữa khoá) hay Final Test (cuối khoá) của chương trình lớp.">Bài</Th>
            <th className="th">Lớp</th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Điểm đạt trên tổng điểm của từng môn. Lớp Normal không quy ra band.">Điểm từng phần</Th>
            <Th hint="Số kỹ năng dưới kỳ vọng ở lượt đó — đó chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a)}>
              <td className="td whitespace-nowrap">{a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Info pending>Chưa có tuần</Info>}
              </td>
              <td className="td">
                <span className="flex flex-wrap gap-1">
                  {(a.skills ?? []).map((s: any) => (
                    <Outcome key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'ok' : 'warn'}>
                      {s.label} {s.score !== null ? `${s.score}/${s.total}` : '—'}
                    </Outcome>
                  ))}
                </span>
              </td>
              <td className="td">
                <Level tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} phần` : sosLabel(a.sosLevel)}
                </Level>
                {a.provisional && <div className="text-[10px] text-slate-500">mới {a.scored}/{a.required} phần</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * MỘT CHƯƠNG của hành trình.
 *
 * Chương có nhiều sự kiện thì mặc định gấp lại, chỉ hiện dòng mở đầu và số việc bên trong —
 * người đọc quét cả năm tháng trong một màn hình, mở ra khi thực sự muốn xem chi tiết.
 */
function Episode({ ep, onOpenCase }: { ep: any; onOpenCase: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const many = ep.events.length > 1;
  const caseId = ep.kind === 'case' ? Number(String(ep.link).split('/').pop()) : null;

  return (
    <li className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-xs text-slate-500 tabular-nums">
          {ep.from === ep.to ? fmtDate(ep.from) : `${fmtDate(ep.from)} → ${fmtDate(ep.to)}`}
        </span>
        <span className="text-sm text-slate-100 min-w-0">{ep.title}</span>
        {many && <Info>{ep.events.length} mốc</Info>}
      </div>

      {/*
        Chương một sự kiện: tiêu đề ĐÃ LÀ nội dung, chỉ hiện thêm phần chi tiết nếu có.
        Lặp lại y hệt tiêu đề ngay bên dưới chỉ làm hành trình dài gấp đôi mà không thêm gì.
      */}
      {!many && ep.events[0].detail && (
        <p className="text-xs text-slate-400 mt-1 mb-0">{ep.events[0].detail}</p>
      )}
      {open && many && (
        <ol className="mt-2 space-y-1 list-none p-0 m-0">
          {ep.events.map((e: any) => (
            <li key={e.id} className="flex gap-3 items-start">
              <span className="text-[11px] text-slate-500 w-20 shrink-0 tabular-nums pt-0.5">{fmtDate(e.eventDate)}</span>
              <span className="min-w-0">
                <span className="block text-sm text-slate-200">
                  {e.title}
                  <span className="text-[11px] text-slate-500 ml-2">
                    {JOURNEY_EVENT_LABEL[e.eventType] ?? e.eventType}
                  </span>
                </span>
                {e.detail && <span className="block text-xs text-slate-400">{e.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2 mt-1">
        {many && (
          <button className="btn btn-sm btn-ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Thu gọn' : `Xem ${ep.events.length} mốc`}
          </button>
        )}
        {caseId && (
          <button className="btn btn-sm btn-ghost" onClick={() => onOpenCase(caseId)}>Mở vấn đề</button>
        )}
      </div>
    </li>
  );
}

export { skillLabel };

/**
 * TÍN HIỆU CHỜ XÁC MINH — khối riêng, đặt TRƯỚC bảng tiến độ và danh sách case.
 *
 * Đây là thứ chặn đầu chuỗi: chừng nào chưa ai xem, chưa ai biết vấn đề thật là gì, nên
 * không có phương án nào để làm và không có kết quả nào để cập nhật.
 *
 * Nó cố ý KHÔNG nằm chung với danh sách case. Một tín hiệu chưa ai xác minh không phải một
 * vấn đề đã được xác định; để lẫn vào nhau là cách chắc chắn nhất để con số "em này đang có
 * mấy vấn đề" nói quá sự thật.
 *
 * Hai lối ra, cả hai đều hợp lệ:
 *   · mở case — khi xem lại bài thấy có vấn đề thật
 *   · ghi nhận đã xem — khi không có vấn đề thật, và phải viết ra vì sao
 */
function PendingSignals({ signals, studentName, onVerify, onDone }: {
  signals: any[]; studentName: string;
  onVerify: (sg: any) => void; onDone: () => void;
}) {
  const toast = useToast();
  const [noteFor, setNoteFor] = useState<any | null>(null);
  if (!signals.length) return null;

  const overdue = signals.filter((s) => s.overdue).length;
  return (
    <>
      <Card title="Tín hiệu chờ xác minh"
        action={<span className="text-xs text-slate-500">
          {signals.length} tín hiệu{overdue > 0 ? ` · ${overdue} quá hạn` : ''}
        </span>}>
        <ul className="space-y-2 list-none p-0 m-0">
          {signals.map((sg) => (
            <li key={sg.id} className="surface-2 rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-100">
                  {sg.label}
                  {sg.band !== null && sg.expectation !== null && (
                    <span className="text-slate-400"> · {fmtBand(sg.band)} so với kỳ vọng {fmtBand(sg.expectation)}</span>
                  )}
                  {sg.attemptNo && <span className="text-slate-500 text-xs"> · MT{sg.attemptNo}</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {sg.track === 'behaviour'
                    ? 'Em vừa có SOS — xem tình hình chung. Đây KHÔNG phải kết luận em thiếu ý thức.'
                    : 'Hệ thống mới chỉ đọc được con số. Xem lại bài rồi quyết định.'}
                </div>
                <div className="text-xs mt-1">
                  {sg.overdue
                    ? <span className="text-rose-300">Quá hạn xác minh {fmtDate(sg.verifyDue)}</span>
                    : <span className="text-slate-400">Hạn xác minh {fmtDate(sg.verifyDue)}</span>}
                  {sg.ownerName && <span className="text-slate-500"> · {sg.ownerName}</span>}
                </div>
              </div>
              {sg.canResolve && (
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => onVerify(sg)}>Mở case</button>
                  <button className="btn btn-sm" onClick={() => setNoteFor(sg)}>Đã xem, không mở case</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <SectionNote>
          Điểm dưới kỳ vọng chỉ sinh <strong>tín hiệu</strong>, không tự mở case và không tự
          sinh phương án hỗ trợ: máy đọc được con số nhưng không biết vì sao, và cũng không xếp
          được tutor thay người. Hạn xác minh là <strong>ba ngày</strong> kể từ lúc tín hiệu được
          ghi nhận, tính cả ngày đầu.
        </SectionNote>
      </Card>

      <NoteSignalDialog
        signal={noteFor} studentName={studentName}
        onClose={() => setNoteFor(null)}
        onSaved={() => { setNoteFor(null); onDone(); toast.push('ok', 'Đã ghi nhận'); }}
      />
    </>
  );
}

/** Ghi nhận đã xem mà không mở case. Bắt buộc viết nhận định — bấm cho xong thì không được. */
function NoteSignalDialog({ signal, studentName, onClose, onSaved }: {
  signal: any | null; studentName: string; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={!!signal} onClose={onClose} width="max-w-md"
      title={`Đã xem · ${signal?.label ?? ''} · ${studentName}`}
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || note.trim().length < 10}
          onClick={async () => {
            if (!signal) return;
            setBusy(true);
            try {
              await api.post(`/signals/pending/${signal.id}/note`, { note });
              invalidate('/students'); invalidate('/overview'); invalidate('/signals');
              setNote(''); onSaved();
            } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
          }}>
          {busy ? 'Đang lưu…' : 'Ghi nhận'}
        </button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Bạn thấy gì khi xem lại?</span>
          <textarea className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: em mất điểm ở một dạng bài lạ, không phải vấn đề kéo dài. Sẽ theo dõi ở đợt sau." />
        </label>
        <SectionNote>
          Ghi nhận đã xem là một kết thúc hợp lệ của tín hiệu, ngang hàng với việc mở case —
          nhưng phải viết ra nhận định. Không ép tạo một nguyên nhân giả chỉ để xoá nợ.
        </SectionNote>
      </div>
    </Modal>
  );
}
