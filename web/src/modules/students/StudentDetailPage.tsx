import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Info, Level, Outcome, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
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
  const [openCase, setOpenCase] = useState<number | null>(null);
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
      {/* ══════════════════════════════════════════ TẦNG 1 — EM NÀY LÀ AI */}
      {/*
        Thẻ tên DÍNH TRÊN ĐẦU khi cuộn: xuống tới bảng điểm mà quên đang xem em nào là
        chuyện xảy ra thật, nhất là khi mở liền mấy em.
      */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 backdrop-blur"
           style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}>
        <button className="btn btn-sm btn-ghost mb-1.5" onClick={() => navigate(-1)}>← Quay lại</button>
        <div className="rounded-xl border p-3 sm:p-4"
             style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-100 flex flex-wrap items-center gap-2 m-0">
                {data.fullName}
                <span className="text-slate-500 text-sm font-normal">· {data.studentCode}</span>
                {data.concerns.maxSos > 0 && (
                  <Level tone={sosTone(data.concerns.maxSos)}>{sosLabel(data.concerns.maxSos)}</Level>
                )}
                <MissingBadge items={data.missing} />
                {data.status !== 'active' && (
                  <Info>{studentStatusLabel(data.status)}</Info>
                )}
                {data.archivedAt && <Info>Đã lưu trữ</Info>}
              </h1>
              {/*
                MỘT DÒNG NHẬN DIỆN, không phải ba ô số to.
                Ba ô "Đầu vào → Hiện tại → Mục tiêu" của bản cũ chiếm gần một màn hình để nói
                ba con số; gộp vào một dòng thì phần quan trọng hơn — em đang vướng gì — được
                nhìn thấy mà không phải cuộn.
              */}
              <p className="text-xs text-slate-400 mt-1 mb-0">
                {data.currentClass
                  ? <>Lớp {data.currentClass.code} · {data.currentClass.branchName}</>
                  : 'Chưa xếp lớp'}
                {cy && !cy.ratio && cy.target !== null && <> · Target {fmtBand(cy.target)}</>}
                {/*
                  TUẦN BẮT ĐẦU HỌC đứng trước dự kiến thi, vì nó là mốc gốc: lịch MT của em
                  tính ra từ đây. Thiếu thì nói thẳng "chưa khai" chứ không để trống im lặng.
                */}
                {cy && <> · Vào học {cy.startWeek ? cy.startWeek.code : <span className="text-amber-300">chưa khai tuần</span>}</>}
                {/*
                  ĐẾM NGƯỢC CHỈ KHI ĐÃ CHỐT TUẦN THI. Mới biết tháng thì nói đúng là mới biết
                  tháng — thêm "còn 134 ngày" vào một cái tháng là bịa ra độ chính xác.
                */}
                {cy && !cy.ratio && cy.examPlan && cy.examPlan.confidence !== 'none' && (
                  <> · Dự kiến thi {cy.examPlan.label}
                    {cy.daysToExam !== null && <span className="text-slate-500"> (còn {cy.daysToExam} ngày)</span>}</>
                )}
              </p>
              {cy && !cy.ratio && (
                <p className="text-xs text-slate-400 mt-1 mb-0">
                  Overall gần nhất{' '}
                  <strong className="text-slate-100 tabular-nums">
                    {data.current.overall !== null ? fmtBand(data.current.overall) : '—'}
                  </strong>
                  {data.current.overallFrom && <span className="text-slate-500"> · MT{data.current.overallFrom}</span>}
                  {cy.baseline?.score !== null && cy.baseline?.score !== undefined && (
                    <span className="text-slate-500"> · đầu vào {fmtBand(cy.baseline.score)}</span>
                  )}
                  {data.nextCheckpoint && (
                    <span className="text-slate-500">
                      {' · '}MT{data.nextCheckpoint.attemptNo} tới:{' '}
                      {data.nextCheckpoint.periodCode ?? 'chưa có tuần'}
                    </span>
                  )}
                </p>
              )}
              {cy?.ratio && (
                <p className="text-xs text-slate-400 mt-1 mb-0">
                  {cy.label} · bắt đầu {fmtDate(cy.startedAt)} ·{' '}
                  {data.attempts.filter((a: any) => a.scored > 0).length}/{data.attempts.length} bài đã chấm
                  {data.checkpoint && (
                    <span className="text-slate-500">
                      {' · '}gần nhất {data.checkpoint.status === 'met' ? 'Đạt' : 'có phần chưa đạt'}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/*
                HAI NÚT, KHÔNG PHẢI SÁU (mục 5.1). "+ Case" là việc hằng ngày nên đứng riêng
                và nổi bật; năm việc quản trị còn lại — kế hoạch học, điểm đầu vào, mục tiêu,
                chuyển lớp, kết luận lộ trình — mỗi năm làm một lần nên gom vào một panel.
              */}
              {data.viewer.canReport && (
                <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              <button className="btn" onClick={() => setManageOpen(true)}>Quản lý học viên</button>
            </div>
          </div>

          {/* Chọn lộ trình — chỉ hiện khi em có nhiều hơn một, nên đa số em không thấy dòng này. */}
          {data.cycles.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <span className="text-xs text-slate-500">Lộ trình:</span>
              {data.cycles.map((c: any) => (
                <button key={c.id}
                  className={`btn btn-sm ${c.id === cy?.id ? 'btn-primary' : ''}`}
                  onClick={() => setCycle(c.id)}>
                  {c.label}
                  <span className="text-[10px] opacity-70 ml-1">
                    {c.target ? `· ${fmtBand(c.target)}` : ''}{c.status !== 'active' ? ' · đã đóng' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!cy ? (
        <Empty title="Học viên chưa có lộ trình nào" hint="Mở lộ trình để bắt đầu theo dõi mục tiêu và các mốc đánh giá." />
      ) : (
        <>
          {/* ══════════════════════════════════ TẦNG 2 — YẾU CHỖ NÀO, ĐÃ LÀM GÌ */}
          {/*
            TRÁI TIM CỦA TRANG. Sáu hạng mục, mỗi hạng mục một dòng, bấm là giãn ra xem lịch sử.
            Khối này thay cho BA khu rời rạc của bản cũ — "Đang cần chú ý", "Đường đi từng kỹ
            năng" và bảng "Vấn đề học vụ" — vốn nói cùng một chuyện bằng ba cách khác nhau,
            khiến người đọc phải tự ghép lại mới ra kết luận.
          */}
          <Card title="Theo dõi hỗ trợ theo kỹ năng"
            action={<span className="text-xs text-slate-500">Bấm một dòng để xem lịch sử</span>}
            bodyClass="p-0">
            <SkillBoard studentId={data.id} cycleId={cy.id}
              onOpenCase={setOpenCase}
              onReport={() => setReportOpen(true)} />
          </Card>

          {/* ══════════════════════════════════ TẦNG 2B — TỪNG CASE MỘT KHỐI */}
          {/*
            Bảng phía trên tóm tắt THEO KỸ NĂNG: mỗi hạng mục một dòng, và dòng đó chỉ trỏ
            được vào MỘT case đại diện. Em có hai case Reading song song thì cái thứ hai
            không có đường nào vào, và một case Ý thức mới mở làm case cũ trông như biến mất.

            Nên phía dưới là DANH SÁCH CASE THẬT: mỗi case một khối riêng, mở đóng độc lập,
            xem được cả case của lộ trình trước. Hai khối trả lời hai câu khác nhau —
            "kỹ năng nào đang có chuyện" và "cụ thể đang có những case nào".
          */}
          <Card title="Các case của em"
            action={<span className="text-xs text-slate-500">Mỗi case mở đóng riêng</span>}>
            <StudentCases studentId={data.id} cycleId={cy.id} cycleLabel={cy.label} />
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

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề - Case"
        subtitle={data.fullName}
        footer={openCase !== null
          ? <Link className="btn" to={`/hoc-thuat/case/${openCase}`}>Mở trang riêng</Link>
          : null}>
        {openCase !== null && <CasePanel caseId={openCase} compact />}
      </Drawer>

      <StudentManagePanel
        open={manageOpen} onClose={() => setManageOpen(false)}
        student={{ id: data.id, name: data.fullName, classId: data.currentClass?.id ?? null }}
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
