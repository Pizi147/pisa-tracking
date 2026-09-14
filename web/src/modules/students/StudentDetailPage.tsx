import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Field, Level, Pill, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { ConfirmDialog, Drawer, Modal } from '../../ui/Drawer.tsx';
import { CasePanel } from '../cases/CasePanel.tsx';
import { SkillBoard } from '../cases/SkillBoard.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import {
  attemptStatusLabel, attemptStatusTone, caseStatusLabel, caseStatusTone,
  fmtBand, fmtDate, fmtSlot, skillLabel, sosLabel, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import {
  BASELINE_SOURCES, BASELINE_SOURCE_LABEL, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL,
  JOURNEY_EVENT_LABEL, fmtExamMonth,
} from '@shared/domain/index.ts';

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
  const [transferOpen, setTransferOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [openCase, setOpenCase] = useState<number | null>(null);
  const [cycleEdit, setCycleEdit] = useState<'baseline' | 'target' | 'outcome' | null>(null);
  /* Tầng 3 mặc định mở bảng điểm: đó là thứ người ta mở hồ sơ để xem nhiều nhất. */
  const [tier3, setTier3] = useState<'scores' | 'journey'>('scores');

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;
  const openCases = data.cases.filter((c: any) => c.status !== 'done');

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
                  <Pill tone={data.status === 'inactive' ? 'warn' : 'muted'}>{studentStatusLabel(data.status)}</Pill>
                )}
                {data.archivedAt && <Pill tone="muted">Đã lưu trữ</Pill>}
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
              {data.viewer.canReport && (
                <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              {data.viewer.canEdit && (
                <button className="btn" onClick={() => setPlanOpen(true)}>Kế hoạch học</button>
              )}
              {data.viewer.canEdit && <button className="btn" onClick={() => setTransferOpen(true)}>Chuyển lớp</button>}
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

          {/* ══════════════════════════════ TẦNG 3 — SỐ LIỆU THÔ, AI CẦN THÌ MỞ */}
          {/*
            Hai thẻ chứ không phải hai khối xếp chồng: bảng điểm và nhật ký đều dài, và hiếm
            khi ai cần đọc cả hai cùng lúc. Ai chỉ cần liếc nhanh thì dừng ở tầng 1–2 và
            không phải cuộn thêm dòng nào.
          */}
          <Card title={
            <span className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${tier3 === 'scores' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTier3('scores')}>Điểm qua các lượt</button>
              <button className={`btn btn-sm ${tier3 === 'journey' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTier3('journey')}>Nhật ký</button>
            </span>
          } action={
            <div className="flex flex-wrap gap-1">
              {data.viewer.canEdit && !cy.ratio && <button className="btn btn-sm" onClick={() => setCycleEdit('baseline')}>Điểm đầu vào</button>}
              {data.viewer.canEdit && !cy.ratio && <button className="btn btn-sm" onClick={() => setCycleEdit('target')}>Đổi mục tiêu</button>}
              {data.viewer.canEdit && <button className="btn btn-sm" onClick={() => setCycleEdit('outcome')}>Kết luận lộ trình</button>}
            </div>
          } bodyClass="p-0">
            {tier3 === 'scores' ? (
              <>
                {data.attempts.length === 0 ? (
                  <div className="p-4"><Empty title="Chưa có lượt đánh giá nào trong lộ trình này" /></div>
                ) : cy.ratio ? <RatioAttempts attempts={data.attempts} onOpen={(a) => navigate(`/mock-test/${a}`)} />
                  : <IeltsAttempts attempts={data.attempts} onOpen={(a) => navigate(`/mock-test/${a}`)} />}
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
              <div className="p-4">
                {data.episodes.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
                  <ol className="space-y-3 list-none p-0 m-0">
                    {data.episodes.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={setOpenCase} />)}
                  </ol>
                )}
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

      {cy && (
        <CycleDialog kind={cycleEdit} onClose={() => setCycleEdit(null)} cycle={cy}
          attempts={data.attempts} onDone={reload} />
      )}

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} studentId={data.id}
        currentClassId={data.currentClass?.id ?? null} onDone={reload} />
    </div>
  );
}

// ==================================================================== khối nhỏ

function Milestone({ label, value, sub, muted }: {
  label: string; value: string; sub: string; muted?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className={`text-2xl tabular-nums mt-1 ${muted ? 'text-slate-500' : 'text-slate-100'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

/**
 * VỊ TRÍ SO VỚI MỐC — chỉ nói đúng một điều: từng kỹ năng có đạt kỳ vọng ĐÃ CHỐT của mốc
 * đó không. Không dựng một nhãn tổng hợp kiểu "đang ổn / có nguy cơ", vì chưa có quy tắc
 * nào được chốt cho một nhãn như thế.
 */
function CheckpointView({ cp }: { cp: any }) {
  const headline = cp.status === 'above' ? 'Vượt kỳ vọng ở mọi kỹ năng'
    : cp.status === 'met' ? 'Đạt kỳ vọng'
    : cp.status === 'no_target' ? 'Đã đủ điểm nhưng chưa có mục tiêu để so'
    : 'Có kỹ năng dưới kỳ vọng';
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-100">{headline}</span>
        <Pill tone="muted">{cp.mode === 'ratio' ? `Bài ${cp.kind === 'final' ? 'cuối khoá' : 'giữa khoá'}` : `MT${cp.attemptNo}`}</Pill>
        {cp.date && <span className="text-xs text-slate-500">{fmtDate(cp.date)}</span>}
      </div>
      {cp.provisional && (
        <p className="text-xs text-amber-200/80 mt-1 mb-0">
          Mới có {cp.coverage} kỹ năng — kết luận này còn có thể đổi khi các kỹ năng còn lại vào điểm.
        </p>
      )}
      {cp.expectation !== null && (
        <p className="text-xs text-slate-500 mt-1 mb-0">Kỳ vọng của mốc này: {fmtBand(cp.expectation)}</p>
      )}
      <ul className="flex flex-wrap gap-1.5 list-none p-0 mt-2 mb-0">
        {cp.skills.map((s: any) => (
          <li key={s.skill}>
            <Pill tone={s.verdict === null ? 'muted' : s.verdict ? 'ok' : 'warn'}>
              {s.label}
              {' '}
              {cp.mode === 'ratio'
                ? (s.score !== null ? `${s.score}/${s.total}` : '—')
                : fmtBand(s.band)}
            </Pill>
          </li>
        ))}
      </ul>
    </>
  );
}

function IeltsAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">MT</th>
            <th className="th">Lớp lúc đánh giá</th>
            <th className="th">Tuần</th>
            <th className="th">Trạng thái</th>
            <th className="th">L</th><th className="th">R</th><th className="th">W</th><th className="th">S</th>
            <th className="th">Overall</th>
            <th className="th">Kỳ vọng</th>
            <th className="th">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a.id)}>
              <td className="td tabular-nums">MT{a.attemptNo}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Pill tone="muted">Chưa có tuần</Pill>}
              </td>
              <td className="td"><Pill tone={attemptStatusTone(a.status)}>{attemptStatusLabel(a.status)}</Pill></td>
              <td className="td tabular-nums">{fmtBand(a.bands?.listening)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.reading)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.writing)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.speaking)}</td>
              <td className="td tabular-nums text-slate-100">{fmtBand(a.overall)}</td>
              <td className="td tabular-nums">{fmtBand(a.expectation)}</td>
              <td className="td">
                <Pill tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} kỹ năng` : sosLabel(a.sosLevel)}
                </Pill>
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

/** Lớp thường chấm theo TỶ LỆ SỐ CÂU ĐÚNG — không có band, không có Overall, không có kỳ vọng IELTS. */
function RatioAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Bài</th>
            <th className="th">Lớp</th>
            <th className="th">Tuần</th>
            <th className="th">Điểm từng phần</th>
            <th className="th">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a.id)}>
              <td className="td whitespace-nowrap">{a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Pill tone="muted">Chưa có tuần</Pill>}
              </td>
              <td className="td">
                <span className="flex flex-wrap gap-1">
                  {(a.skills ?? []).map((s: any) => (
                    <Pill key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'ok' : 'warn'}>
                      {s.label} {s.score !== null ? `${s.score}/${s.total}` : '—'}
                    </Pill>
                  ))}
                </span>
              </td>
              <td className="td">
                <Pill tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} phần` : sosLabel(a.sosLevel)}
                </Pill>
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
        {many && <Pill tone="muted">{ep.events.length} mốc</Pill>}
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

// ==================================================================== hộp thoại lộ trình

function CycleDialog({ kind, onClose, cycle, attempts, onDone }: {
  kind: 'baseline' | 'target' | 'outcome' | null; onClose: () => void;
  cycle: any; attempts: any[]; onDone: () => void;
}) {
  const toast = useToast();
  const [source, setSource] = useState(cycle.baseline?.source ?? 'entrance');
  const [score, setScore] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [note, setNote] = useState('');
  const [newTarget, setNewTarget] = useState(cycle.target !== null ? String(cycle.target) : '');
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [outcome, setOutcome] = useState(cycle.outcome?.outcome ?? 'unknown');
  const [busy, setBusy] = useState(false);

  const done = attempts.filter((a) => a.status !== 'cancelled');

  const submit = async () => {
    setBusy(true);
    try {
      if (kind === 'baseline') {
        await api.put(`/cycles/${cycle.id}/baseline`, {
          source, note,
          attemptId: attemptId ? Number(attemptId) : undefined,
          score: attemptId ? undefined : score,
        });
      } else if (kind === 'target') {
        await api.post(`/cycles/${cycle.id}/target-revision`, {
          newTarget: newTarget === '' ? null : Number(newTarget), reason, effectiveFrom: effectiveFrom || undefined,
        });
      } else {
        await api.put(`/cycles/${cycle.id}/outcome`, {
          outcome, note, attemptId: attemptId ? Number(attemptId) : undefined,
          score: attemptId ? undefined : score || undefined,
        });
      }
      invalidate('/students'); onDone(); onClose(); toast.push('ok', 'Đã lưu');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const title = kind === 'baseline' ? 'Điểm đầu vào của lộ trình'
    : kind === 'target' ? 'Đổi mục tiêu' : 'Kết luận lộ trình';

  return (
    <Modal open={kind !== null} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>Lưu</button>
        </>
      }>
      {kind === 'baseline' && (
        <div className="space-y-3">
          <Field label="Điểm này lấy từ đâu" required>
            <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              {BASELINE_SOURCES.map((s) => <option key={s} value={s}>{BASELINE_SOURCE_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Chọn một bài đã có" hint="Hoặc bỏ trống và nhập điểm bên dưới nếu điểm đến từ ngoài hệ thống.">
            <select className="field" value={attemptId} onChange={(e) => setAttemptId(e.target.value)}>
              <option value="">Không lấy từ bài nào</option>
              {done.map((a) => (
                <option key={a.id} value={a.id}>
                  MT{a.attemptNo}{a.overall !== null ? ` · Overall ${a.overall}` : ''}
                </option>
              ))}
            </select>
          </Field>
          {!attemptId && (
            <Field label="Điểm đầu vào" required>
              <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
                value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Điểm IELTS thi tại BC tháng 3/2026" />
          </Field>
          <SectionNote>
            Hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào. “Em vào học ở mức nào” là câu hỏi khác
            hẳn “bài Mock đầu tiên được mấy điểm”.
          </SectionNote>
        </div>
      )}

      {kind === 'target' && (
        <div className="space-y-3">
          <Field label="Mục tiêu mới" required>
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
          </Field>
          <Field label="Lý do" required hint="Vài tháng sau, đây là thứ duy nhất giải thích vì sao mục tiêu đổi.">
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Gia đình lùi kế hoạch du học sang năm sau" />
          </Field>
          <Field label="Có hiệu lực từ ngày">
            <input type="date" className="field" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
          <SectionNote>
            Các lượt đã chốt GIỮ NGUYÊN kỳ vọng tính theo mục tiêu lúc đó. Đổi mục tiêu không
            chấm lại quá khứ.
          </SectionNote>
        </div>
      )}

      {kind === 'outcome' && (
        <div className="space-y-3">
          <Field label="Kết luận" required>
            <select className="field" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {CYCLE_OUTCOMES.map((o) => <option key={o} value={o}>{CYCLE_OUTCOME_LABEL[o]}</option>)}
            </select>
          </Field>
          <Field label="Dựa trên bài nào">
            <select className="field" value={attemptId} onChange={(e) => setAttemptId(e.target.value)}>
              <option value="">Không lấy từ bài nào</option>
              {done.map((a) => (
                <option key={a.id} value={a.id}>
                  MT{a.attemptNo}{a.overall !== null ? ` · Overall ${a.overall}` : ''}
                </option>
              ))}
            </select>
          </Field>
          {!attemptId && (
            <Field label="Điểm cuối" hint="Ví dụ điểm IELTS chính thức em báo về.">
              <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
                value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <SectionNote>
            Đóng lộ trình chỉ nói “không học theo lộ trình này nữa”. Có đạt mục tiêu hay không là
            kết luận riêng, và “chưa có căn cứ” là một câu trả lời hợp lệ.
          </SectionNote>
        </div>
      )}
    </Modal>
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
            Lượt chưa xong sẽ chuyển sang lớp mới. Lượt đã xong giữ nguyên lớp cũ để không viết lại lịch sử.
          </SectionNote>
        </div>
      }
      onConfirm={async () => {
        if (!toClassId) { toast.push('error', 'Cần chọn lớp đích.'); return; }
        setBusy(true);
        try {
          await api.post(`/students/${studentId}/transfer`, { toClassId, effectiveDate: date || undefined, reason });
          invalidate('/students'); invalidate('/attempts'); invalidate('/overview');
          onDone(); onClose(); toast.push('ok', 'Đã chuyển lớp');
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}

export { skillLabel };
