import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ConfirmDialog, Drawer, Modal } from '../components/Drawer.tsx';
import { CheckinPanel } from '../components/CheckinPanel.tsx';
import { CasePanel } from '../components/CasePanel.tsx';
import { QuickReport } from '../components/QuickReport.tsx';
import { ContactPanel } from '../components/ContactPanel.tsx';
import {
  attemptStatusLabel, attemptStatusTone, caseStatusLabel, caseStatusTone,
  fmtBand, fmtDate, fmtSlot, skillLabel, sosLabel, sosTone, studentStatusLabel,
} from '../lib/format.ts';
import { BASELINE_SOURCES, BASELINE_SOURCE_LABEL, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, JOURNEY_EVENT_LABEL } from '@shared/domain.ts';

type Profile = any;

/**
 * HỒ SƠ HỌC VIÊN.
 *
 * Trang này phải trả lời được trong khoảng ba mươi giây: em bắt đầu ở đâu, đang ở đâu,
 * đích ở đâu, có đang theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì.
 *
 * Vì thế thứ tự các khối KHÔNG phải ngẫu nhiên:
 *   1. Đầu vào → hiện tại → mục tiêu   (ba con số, một dòng)
 *   2. So với mốc gần nhất + đang vướng gì
 *   3. Từng kỹ năng: đi được bao xa, còn cách đích bao nhiêu
 *   4. Vấn đề đang theo dõi
 *   5. Các lần đánh giá
 *   6. Hành trình, gom thành chương
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
  const [reportOpen, setReportOpen] = useState(false);
  const [openCase, setOpenCase] = useState<number | null>(null);
  const [cycleEdit, setCycleEdit] = useState<'baseline' | 'target' | 'outcome' | null>(null);

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
      {/* ============================================== nhận diện */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100 flex flex-wrap items-center gap-2">
            {data.fullName} <span className="text-slate-500 text-sm">· {data.studentCode}</span>
            <Pill tone={data.status === 'active' ? 'ok' : data.status === 'inactive' ? 'warn' : 'muted'}>
              {studentStatusLabel(data.status)}
            </Pill>
            {data.archivedAt && <Pill tone="muted">Đã lưu trữ</Pill>}
          </h1>
          <p className="text-xs text-slate-500 m-0">
            {data.currentClass
              ? <>Lớp {data.currentClass.code} · {data.currentClass.branchName}</>
              : 'Chưa xếp lớp'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.viewer.canReport && (
            <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Nội dung cần hỗ trợ</button>
          )}
          {data.viewer.canEdit && <button className="btn" onClick={() => setTransferOpen(true)}>Chuyển lớp</button>}
        </div>
      </div>

      {/* ============================================== chọn lộ trình */}
      {data.cycles.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
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

      {!cy ? (
        <Empty title="Học viên chưa có lộ trình nào" hint="Mở lộ trình để bắt đầu theo dõi mục tiêu và các mốc đánh giá." />
      ) : (
        <>
          {/* ============================================== 1. đầu vào → hiện tại → đích */}
          <Card title={cy.label} action={
            <div className="flex flex-wrap gap-1">
              {data.viewer.canEdit && !cy.ratio && <button className="btn btn-sm" onClick={() => setCycleEdit('baseline')}>Điểm đầu vào</button>}
              {data.viewer.canEdit && !cy.ratio && <button className="btn btn-sm" onClick={() => setCycleEdit('target')}>Đổi mục tiêu</button>}
              {data.viewer.canEdit && <button className="btn btn-sm" onClick={() => setCycleEdit('outcome')}>Kết luận</button>}
            </div>
          }>
            {/*
              Lớp thường KHÔNG có band, không có mục tiêu IELTS và không có ngày thi — dựng
              ba ô "Đầu vào → Hiện tại → Mục tiêu" cho một khoá Foundation là bịa ra ba con
              số không tồn tại. Nên khoá tỷ lệ có bộ ba của riêng nó.
            */}
            {cy.ratio ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Milestone label="Khoá học" value={cy.label}
                  sub={`Bắt đầu ${fmtDate(cy.startedAt)}`} />
                <Milestone label="Bài đã làm"
                  value={String(data.attempts.filter((a: any) => a.scored > 0).length)}
                  sub={`trên ${data.attempts.length} bài của khoá`} />
                <Milestone label="Kết quả gần nhất"
                  value={data.checkpoint
                    ? (data.checkpoint.status === 'met' ? 'Đạt' : 'Có phần chưa đạt')
                    : 'Chưa có'}
                  sub={data.checkpoint ? `${data.checkpoint.coverage} phần đã chấm` : 'Chưa chấm bài nào'}
                  muted={!data.checkpoint} />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <Milestone label="Điểm đầu vào"
                  value={cy.baseline?.score !== null && cy.baseline?.score !== undefined ? fmtBand(cy.baseline.score) : 'Chưa rõ'}
                  sub={cy.baseline?.sourceLabel ?? 'Chưa ghi điểm xuất phát'}
                  muted={!cy.baseline} />
                <Milestone label="Hiện tại"
                  value={data.current.overall !== null ? fmtBand(data.current.overall) : '—'}
                  sub={data.current.overallFrom
                    ? `Overall ở MT${data.current.overallFrom}`
                    : 'Chưa có lượt nào đủ bốn kỹ năng'} />
                <Milestone label="Mục tiêu"
                  value={cy.target !== null ? fmtBand(cy.target) : 'Chưa có'}
                  sub={cy.examDate
                    ? `Thi ${fmtDate(cy.examDate)}${cy.daysToExam !== null ? ` · còn ${cy.daysToExam} ngày` : ''}`
                    : 'Chưa có ngày thi'}
                  muted={cy.target === null} />
              </div>
            )}

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
          </Card>

          {/* ============================================== 2. so với mốc + đang vướng gì */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="So với mốc gần nhất">
              {!data.checkpoint ? (
                <Empty title="Chưa có mốc nào kết luận được"
                  hint={data.nextCheckpoint
                    ? `Mốc tiếp theo: MT${data.nextCheckpoint.attemptNo}${data.nextCheckpoint.periodCode ? ` · ${data.nextCheckpoint.periodCode}` : ''}`
                    : 'Chưa có lượt đánh giá nào được lên kế hoạch.'} />
              ) : (
                <CheckpointView cp={data.checkpoint} />
              )}
              {data.nextCheckpoint && (
                <p className="text-xs text-slate-500 mt-3 mb-0">
                  Mốc tiếp theo:{' '}
                  <Link className="link" to={`/mock-test/${data.nextCheckpoint.id}`}>
                    MT{data.nextCheckpoint.attemptNo}
                  </Link>
                  {' · '}{data.nextCheckpoint.periodCode ?? 'chưa có tuần'}
                  {data.nextCheckpoint.needsDate ? ' · chưa có ngày' : ` · ${fmtSlot(data.nextCheckpoint.scheduledAt)}`}
                </p>
              )}
            </Card>

            {/*
              LIÊN HỆ đứng TRƯỚC danh sách vấn đề: khi một em vừa có SOS, việc đầu tiên là
              báo cho em và cho gia đình, trước cả khi bàn tới tutor hay tự học.
            */}
            <ContactPanel studentId={data.id} canEdit={data.viewer.canReport} />

            <Card title="Đang cần chú ý">
              {openCases.length === 0 ? (
                <Empty title="Không có vấn đề nào đang theo dõi"
                  hint="Không có cảnh báo KHÔNG có nghĩa là đang theo kịp — hai điều đó khác nhau." />
              ) : (
                <ul className="space-y-2 list-none p-0 m-0">
                  {openCases.slice(0, 4).map((c: any) => (
                    <li key={c.id}>
                      <button className="w-full text-left appearance-none bg-transparent border-0 p-0"
                        onClick={() => setOpenCase(c.id)}>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {c.sosLevel !== null && <Pill tone={sosTone(c.sosLevel)}>{sosLabel(c.sosLevel)}</Pill>}
                          {c.urgency && c.urgency !== 'normal' && (
                            <Pill tone={c.urgency === 'urgent' ? 'danger' : 'warn'}>
                              {c.urgency === 'urgent' ? 'Gấp' : 'Cần chú ý'}
                            </Pill>
                          )}
                          {c.primaryLabel && <Pill tone="info">{c.primaryLabel}</Pill>}
                          {c.dueOverdue && <Pill tone="warn">Quá hạn xem lại</Pill>}
                          {/* Vấn đề của lộ trình trước KHÔNG bị giấu đi, nhưng phải dán nhãn rõ. */}
                          {c.carriedOver && <Pill tone="muted">Từ {c.route ?? `lộ trình ${c.cycleSeq}`}</Pill>}
                        </span>
                        <span className="block text-sm text-slate-200 mt-0.5">{c.headline}</span>
                        <span className="block text-xs text-slate-500">
                          {fmtDate(c.detectedAt)}
                          {c.reporterName && ` · ${c.reporterName}`}
                          {' · '}
                          {c.interventionCount > 0
                            ? `${c.interventionCount} việc đã ghi`
                            : 'chưa làm'}
                          {c.nextDue && ` · hẹn xem lại ${fmtDate(c.nextDue)}`}
                        </span>
                      </button>
                    </li>
                  ))}
                  {openCases.length > 4 && (
                    <li className="text-xs text-slate-500">và {openCases.length - 4} vấn đề nữa ở dưới</li>
                  )}
                </ul>
              )}
            </Card>
          </div>

          {/* ============================================== 3. từng kỹ năng */}
          {data.trajectory.length > 0 && (
            <Card title="Đường đi từng kỹ năng" bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Kỹ năng</th>
                      <th className="th">Các mốc</th>
                      <th className="th text-right">Hiện tại</th>
                      <th className="th text-right">Đã tăng</th>
                      <th className="th text-right">Còn cách đích</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trajectory.map((t: any) => (
                      <tr key={t.skill} className="row-hover">
                        <td className="td text-slate-200 whitespace-nowrap">{t.label}</td>
                        <td className="td">
                          {t.points.length === 0 ? <span className="text-slate-600">chưa có điểm nào</span> : (
                            <span className="flex flex-wrap items-center gap-1">
                              {t.points.map((pt: any, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1">
                                  {i > 0 && <span className="text-slate-600">→</span>}
                                  <span className="tabular-nums text-slate-200" title={pt.detail ?? undefined}>
                                    {fmtBand(pt.band)}
                                  </span>
                                  <span className="text-[10px] text-slate-500">{pt.label}</span>
                                </span>
                              ))}
                            </span>
                          )}
                        </td>
                        <td className="td text-right tabular-nums text-slate-100">
                          {t.current ? fmtBand(t.current.band) : '—'}
                        </td>
                        {/* Cả hai cột đều là PHÉP TRỪ, không phải nhãn tốt/xấu — nên không tô màu. */}
                        <td className="td text-right tabular-nums text-slate-300">
                          {t.gain === null ? '—' : t.gain > 0 ? `+${t.gain}` : String(t.gain)}
                        </td>
                        <td className="td text-right tabular-nums text-slate-300">
                          {t.gapToTarget === null ? '—' : fmtBand(t.gapToTarget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3">
                <SectionNote>
                  “Đã tăng” cần có điểm đầu vào mới tính được, “Còn cách đích” cần có mục tiêu — thiếu
                  căn cứ thì để trống chứ không điền số 0. Các mốc chỉ nối trong CÙNG một lộ trình.
                </SectionNote>
              </div>
            </Card>
          )}

          {/* ============================================== ghi nhận của giáo viên */}
          <Card title="Điểm chính thức và ghi nhận của giáo viên"
            action={<span className="text-xs text-slate-500">Hai nguồn khác nhau, đặt cạnh nhau để so</span>}
            bodyClass="p-0">
            <CheckinPanel studentId={Number(id)} cycleId={cy.id} canEditSkills={data.viewer.checkinSkills ?? []} />
          </Card>

          {/* ============================================== 4. vấn đề đang theo dõi */}
          {data.cases.length > 0 && (
            <Card title="Vấn đề học vụ" bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Ghi nhận</th>
                      <th className="th">Nội dung</th>
                      <th className="th">Phân loại</th>
                      <th className="th">Đã làm</th>
                      <th className="th">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cases.map((c: any) => (
                      <tr key={c.id} className="row-hover cursor-pointer" onClick={() => setOpenCase(c.id)}>
                        <td className="td whitespace-nowrap text-slate-400 text-xs">
                          {fmtDate(c.detectedAt)}
                          <div className="text-[10px] text-slate-500">
                            {c.originKind === 'teacher_report' ? 'GV báo' : 'Từ điểm'}
                          </div>
                        </td>
                        <td className="td text-slate-200">
                          {c.headline}
                          {c.carriedOver && (
                            <div className="text-[10px] text-slate-500">Thuộc {c.route ?? `lộ trình ${c.cycleSeq}`}</div>
                          )}
                        </td>
                        <td className="td">{c.primaryLabel ?? <span className="text-slate-600">chưa phân loại</span>}</td>
                        <td className="td text-slate-300 text-xs">
                          {c.interventionCount > 0 ? `${c.interventionCount} việc` : '—'}
                          {c.lastIntervention && <div className="text-[10px] text-slate-500 truncate max-w-[16rem]">{c.lastIntervention}</div>}
                        </td>
                        <td className="td">
                          <Pill tone={caseStatusTone(c.status)}>{caseStatusLabel(c.status)}</Pill>
                          {c.sosLevel !== null && <div className="text-[10px] text-slate-500">{sosLabel(c.sosLevel)}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/*
            ============================================== 5 và 6. đánh giá · hành trình

            Ở màn rất rộng thì XẾP CẠNH NHAU thay vì kéo dài một cột. Hành trình là khối
            nhiều chữ nhất của trang; để nó chiếm hết 1920px thì mỗi dòng dài quá tầm mắt,
            và người đọc phải quét sang phải rồi tìm lại đầu dòng kế tiếp.
          */}
          <div className="grid gap-4 2xl:grid-cols-2 items-start">
          <Card title="Các lần đánh giá" bodyClass="p-0">
            {data.attempts.length === 0 ? (
              <Empty title="Chưa có lượt đánh giá nào trong lộ trình này" />
            ) : cy.ratio ? <RatioAttempts attempts={data.attempts} onOpen={(a) => navigate(`/mock-test/${a}`)} />
              : <IeltsAttempts attempts={data.attempts} onOpen={(a) => navigate(`/mock-test/${a}`)} />}
            <div className="p-3">
              <SectionNote>
                Lớp ghi ở đây là lớp TẠI LÚC ĐÁNH GIÁ — chuyển lớp không viết lại lịch sử này.
                Số MT đánh lại từ 1 khi sang lộ trình mới, học tiếp trong cùng lộ trình thì tăng tiếp.
              </SectionNote>
            </div>
          </Card>

          <Card title="Hành trình học">
            {data.episodes.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
              <ol className="space-y-3 list-none p-0 m-0">
                {data.episodes.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={setOpenCase} />)}
              </ol>
            )}
          </Card>
          </div>
        </>
      )}

      {/* ============================================== hộp thoại */}
      <QuickReport open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={data.id} studentName={data.fullName} cycleId={cy?.id ?? null}
        onDone={(cid) => { reload(); setOpenCase(cid); }} />

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề học vụ"
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
            <th className="th">Tuần · lịch</th>
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
                <div className="text-slate-500 text-xs">{a.lrwScheduledAt ? fmtSlot(a.lrwScheduledAt) : 'chưa có ngày'}</div>
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
            <th className="th">Tuần · lịch</th>
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
                <div className="text-slate-500 text-xs">{a.lrwScheduledAt ? fmtSlot(a.lrwScheduledAt) : 'chưa có ngày'}</div>
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
