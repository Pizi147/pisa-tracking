import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, ExamPlanText, Info as Tag, Level, Outcome, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import type { ExamPlan } from '../../../../shared/domain/index.ts';
import { ConfirmDialog, Modal } from '../../ui/Drawer.tsx';
import {
  CriteriaButton, DeadlinePill, RawScoreInput, useSaveScore, type Cell,
} from './ScoreEntry.tsx';
import {
  attemptHref, attemptStatusLabel, attemptStatusTone, fmtBand, fmtDate, fmtDateTime,
  progressLabel, progressTone, skillLabel, sosLabel, sosTone,
} from '../../lib/format.ts';
import { CasePanel } from '../cases/CasePanel.tsx';
import { ASSESSED_SKILLS, ASSESSED_SKILL_LABEL } from '@shared/domain/index.ts';
import { usePeriods } from '../../ui/Filters.tsx';

type Detail = {
  id: number;
  /** `mock` với Fast Track; `progress` / `final` là bài của lớp Normal — màn khác hẳn. */
  kind: string;
  student: { id: number; name: string; code: string };
  cycle: { id: number; seq: number; route: string | null; target: number | null; examPlan: ExamPlan };
  classId: number | null; classCode: string | null; branchName: string | null;
  attemptNo: number; targetAtAttempt: number | null; studyWeekHint: number | null;
  period: { id: number; code: string; weekStart: string; weekEnd: string; range: string } | null;
  /** Tuần kế hoạch hoàn tất đã đủ căn cứ chưa, và môn nào đang chặn. */
  completionWeek: { valid: boolean; blocking: string[]; blockingLabels: string[] };
  /** Lịch, phạm vi, trạng thái thi và hạn chấm của TỪNG kỹ năng. */
  skillSchedule: SkillRow[];
  splitWeeks: boolean;
  scheduleHeadline: string;
  scoringMode: 'band' | 'ratio';
  deadlineOverride: { date: string; reason: string | null; at: string | null; by: string | null } | null;
  status: string; cancelReason: string | null; note: string | null;
  result: any; cells: Cell[]; skips: any[];
  history: any[]; sosCase: any; caseSteps: any[]; caseHistory: any[]; tasks: any[];
  viewer: {
    canPlanWeek: boolean; canCancel: boolean;
    canSkipSkill: boolean; canOverrideDeadline: boolean;
    /** Kỹ năng dời lịch/xác nhận thi được — GVCN·GVBM Normal + Quản lý mọi kỹ năng (SCH-01). */
    moveableSkills: string[];
    canEditSos: boolean; editableSkills: string[];
  };
};

type SkillRow = {
  skill: string; label: string;
  required: boolean; scopeReason: string | null;
  periodId: number | null; periodCode: string | null;
  weekStart: string | null; weekRange: string | null;
  planSource: string;
  sitStatus: string; sitNote: string | null;
  deadline: string | null; deadlineSource: string;
  overdue: boolean; scored: boolean; progress: string;
  absenceMoveCount: number;
  /** Đề nghị dời do vắng đang chờ Quản lý trả lời (mục 10.6), nếu có. */
  pendingMove: { id: number; decideBy: string; toWeek: string | null; moveNo: number } | null;
};

export default function MockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Detail>(id ? `/attempts/${id}` : null);
  const { save } = useSaveScore(Number(id), reload);
  const [showHistory, setShowHistory] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  /*
   * CHẶN CỬA: bài của lớp Normal KHÔNG được dựng bằng màn này.
   *
   * Màn Mock Test gọi mọi lượt là "MT{n}", chấm theo band và so với kỳ vọng target — cả ba
   * thứ đó đều sai với một bài Progress Test. Mọi đường dẫn trong hệ thống đã trỏ đúng màn,
   * nhưng đường dẫn cũ, thông báo cũ và link người dùng lưu lại thì vẫn còn, nên chặn ngay
   * ở đây thay vì tin rằng không ai vào được.
   */
  if (data.kind && data.kind !== 'mock') {
    return <Navigate to={attemptHref({ id: data.id, kind: data.kind, classId: data.classId })} replace />;
  }

  const d = data;
  const raw = d.cells.filter((c) => c.skill === 'listening' || c.skill === 'reading');
  const crit = d.cells.filter((c) => c.skill !== 'listening' && c.skill !== 'reading');

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">
            {d.student.name} <span className="text-slate-500 text-sm">· {d.student.code}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MT{d.attemptNo} · Lớp lúc đánh giá: {d.classCode ?? '—'} · {d.branchName ?? '—'}
            {d.cycle.route && ` · Lộ trình ${d.cycle.route}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn no-underline" to={`/hoc-vien/${d.student.id}`}>Hồ sơ học viên</Link>
          {d.classId && (
            <Link className="btn no-underline" to={`/nhap-diem/${d.classId}`}>Nhập điểm cả lớp</Link>
          )}
          {d.viewer.canPlanWeek && d.status !== 'cancelled' && (
            <button className="btn" onClick={() => setWeekOpen(true)}>Xếp cả đợt một tuần</button>
          )}
          {d.viewer.canCancel && d.status === 'planned' && (
            <button className="btn btn-danger" onClick={() => setCancelOpen(true)}>Huỷ lượt MT</button>
          )}
          {d.viewer.canCancel && d.status === 'cancelled' && (
            <button className="btn" onClick={async () => {
              await api.post(`/attempts/${d.id}/reopen`);
              invalidate('/attempts'); reload(); toast.push('ok', 'Đã mở lại lượt MT');
            }}>Mở lại</button>
          )}
        </div>
      </div>

      {/* 1. Nhận diện, lịch và target */}
      <Card title="Kế hoạch MT">
        <p className="text-sm text-slate-200 mt-0 mb-3">{d.scheduleHeadline}</p>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 m-0">
          <Info label="Trạng thái">
            <Status kind={d.status === 'done' ? 'done' : d.status === 'cancelled' ? 'idle' : 'doing'}>
              {attemptStatusLabel(d.status)}
            </Status>
          </Info>
          <Info label="Tuần hoàn tất">
            {d.period
              ? <>{d.period.code} <span className="text-slate-500 text-xs">({d.period.range})</span></>
              : <Tag pending>Chưa chốt tuần</Tag>}
          </Info>
          <Info label="Dự kiến thi">
            <ExamPlanText plan={d.cycle.examPlan} />
          </Info>
          <Info label="Target lúc đánh giá">{fmtBand(d.targetAtAttempt)}</Info>
          <Info label="Kỳ vọng MT này">{fmtBand(d.result.expectation)}</Info>
        </dl>
        {d.cancelReason && <p className="text-xs text-rose-200 mt-3">Đã huỷ: {d.cancelReason}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {d.deadlineOverride ? (
            <Tag title={d.deadlineOverride.reason ?? undefined}>
              Hạn riêng cả đợt {fmtDate(d.deadlineOverride.date)}{d.deadlineOverride.by ? ` · ${d.deadlineOverride.by}` : ''}
            </Tag>
          ) : (
            <span className="text-xs text-slate-500">
              Hạn chấm mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần thi môn đó.
            </span>
          )}
          {d.viewer.canOverrideDeadline && (
            <button className="btn btn-sm" onClick={() => setDeadlineOpen(true)}>
              {d.deadlineOverride ? 'Sửa hạn riêng' : 'Đặt hạn riêng'}
            </button>
          )}
        </div>
        <SectionNote>
          Tuần ở trên là <strong>tuần hoàn tất theo kế hoạch</strong> — tuần của môn thi muộn nhất,
          dùng để xếp đợt này vào đúng một dòng trong các bảng theo tuần. Nó không phải ngày thi
          và cũng không phải ngày đã hoàn thành thật.
          {d.studyWeekHint && <>
            {' '}Mốc gợi ý cho MT{d.attemptNo} là <strong>tuần học</strong> FT {d.studyWeekHint};
            tuần học của chương trình và mã tuần lịch là hai khái niệm khác nhau.
          </>}
        </SectionNote>
      </Card>

      {/* 1b. Lịch thi từng kỹ năng — nơi đọc và sửa lịch thật */}
      <SkillScheduleCard d={d} onDone={reload} />

      {/* 2. Điểm từng kỹ năng */}
      <Card title="Điểm theo kỹ năng"
        action={<span className="text-xs text-slate-500">
          Đã nhập {d.result.scoredRequired}/{d.result.required.length} kỹ năng bắt buộc
          {d.result.skipped.length > 0 && ` · ${d.result.skipped.length} kỹ năng ngoài phạm vi`}
        </span>}>
        {d.cells.length === 0 ? (
          <Empty title="Lớp này chưa cấu hình kỹ năng nào" />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th hint="Năm ô của Fast Track: L · R · W1 · W2 · S. W1 và W2 chấm riêng từng task.">Kỹ năng</Th>
                    <Th hint="Listening và Reading nhập số câu đúng; Writing và Speaking nhập điểm bốn tiêu chí.">Số câu đúng / tiêu chí</Th>
                    <Th hint="Band quy đổi từ ô bên trái. Không gõ tay được — để hai người cùng chấm ra cùng một số.">Band</Th>
                    <Th hint="Kỹ năng này đã nhập điểm chưa, và có nằm trong lượt này không.">Tiến độ</Th>
                    <Th hint="Hạn chấm tính từ tuần thi của CHÍNH môn đó. Môn chưa đến lịch thì chưa nợ điểm.">Hạn nhập</Th>
                    <Th hint="Ai nhập ô điểm này và nhập lúc nào — để tra lại khi có thắc mắc.">Người nhập</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...raw, ...crit].map((c) => (
                    <tr key={c.skill} className={c.required ? '' : 'row-muted'}>
                      <td className="td text-slate-200 whitespace-nowrap">{skillLabel(c.skill)}</td>
                      <td className="td">
                        {!c.required
                          ? <span className="text-slate-500 text-xs">—</span>
                          : c.skill === 'listening' || c.skill === 'reading'
                            ? <RawScoreInput cell={c} onSave={(p) => save(c.skill, p)} />
                            : <CriteriaButton cell={c} onSave={(p) => save(c.skill, p)} />}
                      </td>
                      <td className="td tabular-nums text-slate-100">{fmtBand(c.band)}</td>
                      <td className="td">
                        <Status kind={c.progress === 'scored' ? 'done'
                          : c.progress === 'skipped' || c.progress === 'not_scheduled' ? 'idle'
                          : c.progress === 'due' ? 'doing' : 'waiting'}>
                          {progressLabel(c.progress)}
                        </Status>
                      </td>
                      <td className="td"><DeadlinePill cell={c} /></td>
                      <td className="td text-xs text-slate-500">
                        {c.enteredByName ?? '—'}
                        {c.enteredAt && <div>{fmtDateTime(c.enteredAt)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
              {ASSESSED_SKILLS.map((key) => {
                const v = d.result.verdicts.find((x: any) => x.skill === key);
                const skipped = d.result.skipped.includes(key);
                return (
                  <div key={key} className={`surface-2 rounded-lg p-3 ${skipped ? 'opacity-80' : ''}`}>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                      {ASSESSED_SKILL_LABEL[key]}
                    </div>
                    <div className="text-xl tabular-nums mt-1 text-slate-100">{fmtBand(v?.band)}</div>
                    <div className="mt-1">
                      {skipped
                        ? <Tag pending>Ngoài phạm vi</Tag>
                        : v?.passed === null
                          ? <Tag pending>Chưa đủ điểm</Tag>
                          : v?.passed
                            ? <Outcome tone="ok" mark="✓">Đạt kỳ vọng</Outcome>
                            : <Outcome tone="danger" mark="↓">Dưới kỳ vọng</Outcome>}
                    </div>
                    {/*
                      * Phạm vi yêu cầu được sửa ở bảng "Lịch thi theo kỹ năng" phía trên, cùng
                      * chỗ với tuần thi và hạn chấm. Trước đây nút này nằm ở đây, tách khỏi lịch,
                      * nên người dùng đổi phạm vi mà không nhìn thấy lịch mình đang đổi.
                      */}
                  </div>
                );
              })}
              <div className="surface-2 rounded-lg p-3 border border-sky-300/25">
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Overall</div>
                <div className="text-xl tabular-nums mt-1 text-slate-100">{fmtBand(d.result.overall)}</div>
                <div className="mt-1"><Level tone={sosTone(d.result.sosLevel)}>{sosLabel(d.result.sosLevel)}</Level></div>
              </div>
            </div>

            {d.result.scopeDetail && (
              <SectionNote>
                {d.result.scopeDetail}. Kỹ năng <strong>không được yêu cầu</strong> ở lượt này không tính vào
                mẫu số SOS và không bị coi là thiếu điểm — khác hẳn kỹ năng có yêu cầu mà chưa có điểm.
                Vì lượt này không còn đủ bốn kỹ năng nên không có Overall IELTS.
              </SectionNote>
            )}
            {!d.result.complete && (
              <SectionNote>
                Chưa chốt kết quả vì còn thiếu kỹ năng bắt buộc. Mỗi kỹ năng có tuần thi và hạn
                chấm riêng — xem bảng lịch phía trên. Ô trống là chưa nhập, không phải điểm 0, và
                cũng không có nghĩa là học viên đã vắng.
              </SectionNote>
            )}
            {d.result.complete && !d.result.evaluable && (
              <SectionNote>
                Đã đủ điểm các kỹ năng bắt buộc nhưng lộ trình chưa có target, nên chưa tính được kỳ vọng và SOS.
              </SectionNote>
            )}
          </div>
        )}
      </Card>

      {/*
        3–4. VẤN ĐỀ HỌC VỤ.
        Hiện bất cứ khi nào bài này ĐANG CÓ một vấn đề — kể cả khi điểm sau đó đã sửa lên
        thành đạt. Giấu nó đi thì mọi việc đã làm để hỗ trợ em cũng biến mất khỏi màn hình,
        trong khi đó chính là phần đáng đọc nhất.
      */}
      {d.sosCase ? (
        <Card title="Vấn đề - Case">
          {d.result.evaluable && d.result.sosLevel === 0 && (
            <p className="text-xs text-slate-400 mt-0 mb-3">
              Điểm hiện tại đã đạt kỳ vọng ở mọi kỹ năng. Vấn đề này vẫn còn đây để tra lại đã
              hỗ trợ những gì — người có quyền quyết định có kết thúc theo dõi hay không.
            </p>
          )}
          <CasePanel caseId={d.sosCase.id} compact />
          {d.caseSteps.length > 0 && <Playbook steps={d.caseSteps} />}
          {d.tasks.length > 0 && (
            <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--line)' }}>
              <div className="label">Công việc gắn với vấn đề này</div>
              <ul className="text-xs space-y-1 list-none p-0 m-0">
                {d.tasks.map((t) => (
                  <li key={t.id} className="text-slate-300">
                    <Link className="link" to="/tien-trinh">{t.code}</Link> · {t.title}
                    <span className="text-slate-500"> · {t.assignee_name ?? 'Chưa giao'} · hạn {fmtDate(t.due_date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : d.result.evaluable && d.result.sosLevel === 0 ? (
        <Card title="Kết quả"><Empty title={`Đạt kỳ vọng ở cả ${d.result.required.length} kỹ năng được đánh giá`}
          hint="Không phát sinh vấn đề nào cần theo dõi." /></Card>
      ) : null}

      {/* 5. Lịch sử */}
      <Card title="Lịch sử thay đổi"
        action={<button className="btn btn-sm" onClick={() => setShowHistory((s) => !s)}>{showHistory ? 'Thu gọn' : 'Mở'}</button>}>
        {!showHistory ? (
          <SectionNote>{d.history.length} thay đổi lịch · {d.caseHistory.length} thay đổi xử lý.</SectionNote>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="label">Lịch và phạm vi</div>
              <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                {d.history.map((h) => (
                  <li key={h.id} className="text-slate-400">
                    <span className="text-slate-200">{actionLabel(h.action)}</span>
                    {h.oldValue && <> {h.oldValue} →</>} {h.newValue && <> {h.newValue}</>}
                    {h.reason && <> · {h.reason}</>}
                    <span className="text-slate-600"> · {h.actorName ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label">Xử lý sau Mock</div>
              {d.caseHistory.length === 0 ? <p className="text-xs text-slate-500">Chưa có thay đổi nào.</p> : (
                <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                  {d.caseHistory.map((h) => (
                    <li key={h.id} className="text-slate-400">
                      <span className="text-slate-200">{fieldLabel(h.field)}</span>: {h.oldValue ?? '—'} → {h.newValue ?? '—'}
                      <span className="text-slate-600"> · {h.actorName ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      <WeekModal open={weekOpen} onClose={() => setWeekOpen(false)} attemptId={d.id}
        currentPeriodId={d.period?.id ?? null} onDone={reload} />
      <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} detail={d} onDone={reload} />
      <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} attemptId={d.id} onDone={reload} />
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

// ---------------------------------------------------------------- lịch thi từng kỹ năng

/**
 * LỊCH THI THEO TỪNG KỸ NĂNG — bảng mà người xếp lịch thực sự làm việc trên đó.
 *
 * Bốn cột trả lời bốn câu hỏi khác nhau, và cố tình KHÔNG gộp: thi tuần nào · đang ở đâu ·
 * hạn chấm ngày nào · làm gì tiếp. Đây là chỗ nhìn ra ngay chuyện R/L/W thi tuần này còn
 * Speaking tuần sau, và vì sao Speaking chưa bị đòi điểm trong khi R/L/W thì có.
 */
function SkillScheduleCard({ d, onDone }: { d: Detail; onDone: () => void }) {
  const [weekFor, setWeekFor] = useState<SkillRow | null>(null);
  const [deadlineFor, setDeadlineFor] = useState<SkillRow | null>(null);
  const [moveFor, setMoveFor] = useState<SkillRow | null>(null);
  const [restoreFor, setRestoreFor] = useState<SkillRow | null>(null);
  const [decideFor, setDecideFor] = useState<SkillRow | null>(null);
  const toast = useToast();
  const editable = d.status !== 'cancelled';

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone();
      toast.push('ok', okMsg);
    } catch (e: any) { toast.push('error', e.message); }
  };

  return (
    <Card title="Lịch thi theo kỹ năng"
      action={d.splitWeeks
        ? <Tag>Đợt này thi ở nhiều tuần</Tag>
        : <span className="text-xs text-slate-500">Cả đợt thi trong một tuần</span>}>
      {!d.completionWeek.valid && (
        <p className="text-xs text-amber-200 mt-0 mb-3">
          Chưa có kế hoạch hoàn tất hợp lệ: {d.completionWeek.blockingLabels.join(', ')} chưa có tuần thi
          hoặc đã bị huỷ phần thi. Đợt vẫn chưa đủ kết quả cho tới khi Quản lý xếp lại.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th hint="Bốn kỹ năng đánh giá. Writing là MỘT môn thi — W1 và W2 chấm riêng nhưng làm cùng buổi.">Kỹ năng</Th>
              <Th hint="Tuần thi của CHÍNH kỹ năng này. Các kỹ năng trong một đợt có thể ở các tuần khác nhau.">Tuần thi</Th>
              <Th hint="Đã đến lịch chưa, đã thi chưa, hay đã xác nhận vắng. Ô điểm trống không đủ để kết luận là vắng.">Tình trạng</Th>
              <Th hint="Hạn chấm tính từ tuần thi của chính môn đó: hết thứ Tư tuần kế tiếp với Fast Track, hết Chủ nhật cùng tuần với lớp Normal.">Hạn chấm</Th>
              <Th>Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {d.skillSchedule.map((r) => (
              <tr key={r.skill} className={r.required ? '' : 'row-muted'}>
                <td className="td text-slate-200 whitespace-nowrap">
                  {r.label}
                  {r.planSource === 'manual' && (
                    <span className="text-slate-500 text-[11px] block">đã xếp riêng</span>
                  )}
                </td>
                <td className="td whitespace-nowrap">
                  {!r.required ? <span className="text-slate-500 text-xs">—</span>
                    : r.periodCode
                      ? <>{r.periodCode} <span className="text-slate-500 text-xs">({r.weekRange})</span></>
                      : <Tag pending>Chưa xếp tuần</Tag>}
                </td>
                <td className="td">
                  <Status kind={r.progress === 'scored' ? 'done'
                    : r.progress === 'skipped' || r.progress === 'cancelled' || r.progress === 'not_scheduled' ? 'idle'
                    : r.progress === 'due' || r.progress === 'sat' ? 'doing' : 'waiting'}>
                    {progressLabel(r.progress)}
                  </Status>
                  {r.absenceMoveCount > 0 && (
                    <div className="text-[11px] text-amber-200 mt-1">
                      Đã dời do vắng {r.absenceMoveCount} lần
                    </div>
                  )}
                  {/*
                    ĐANG CHỜ AI, ĐẾN NGÀY NÀO. Một dòng "chờ duyệt dời" mà không nói hạn thì
                    người xem không biết còn bao lâu nữa phần thi bị huỷ.
                  */}
                  {r.pendingMove && (
                    <div className="text-[11px] text-amber-200 mt-1">
                      Đề nghị dời sang {r.pendingMove.toWeek ?? 'tuần kế tiếp'} (lần {r.pendingMove.moveNo})
                      — Quản lý cần trả lời trước {fmtDate(r.pendingMove.decideBy)}, quá hạn thì huỷ phần thi.
                    </div>
                  )}
                  {!r.required && r.scopeReason && (
                    <div className="text-[11px] text-slate-500 mt-1">{r.scopeReason}</div>
                  )}
                  {r.sitNote && <div className="text-[11px] text-slate-500 mt-1">{r.sitNote}</div>}
                </td>
                <td className="td whitespace-nowrap">
                  {!r.required || r.progress === 'cancelled' ? <span className="text-slate-500 text-xs">—</span>
                    /* Đã chấm rồi thì hạn không còn là việc phải làm, nhưng vẫn để đọc lại được. */
                    : r.scored ? <span className="text-slate-500 text-xs">đã chấm · hạn {fmtDate(r.deadline)}</span>
                    : r.progress === 'upcoming' ? <span className="text-slate-400 text-xs">Sau khi thi · {fmtDate(r.deadline)}</span>
                    : r.overdue ? <span className="text-rose-200">Quá hạn {fmtDate(r.deadline)}</span>
                    : r.deadline ? <span className="text-slate-300">{fmtDate(r.deadline)}</span>
                    : <Tag pending>Chưa có hạn</Tag>}
                  {r.deadlineSource === 'skill_override' && (
                    <span className="text-[11px] text-slate-500 block">hạn riêng môn này</span>
                  )}
                </td>
                <td className="td">
                  <div className="flex flex-wrap gap-1.5">
                    {d.viewer.moveableSkills.includes(r.skill) && editable && r.required && !r.scored && r.progress !== 'cancelled' && (
                      <button className="btn btn-sm" onClick={() => setWeekFor(r)}>Đổi tuần</button>
                    )}
                    {d.viewer.moveableSkills.includes(r.skill) && editable && r.required && !r.scored
                      && r.progress !== 'cancelled' && r.periodCode && (
                      <>
                        {r.sitStatus !== 'sat' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => act(
                            () => api.post(`/attempts/${d.id}/skills/${r.skill}/sit`, { status: 'sat' }),
                            `Đã ghi nhận ${r.label}: học viên đã thi`,
                          )}>Đã thi</button>
                        )}
                        {r.sitStatus !== 'absent' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => act(
                            () => api.post(`/attempts/${d.id}/skills/${r.skill}/sit`, {
                              status: 'absent', note: 'GVCN xác minh học viên vắng buổi này',
                            }),
                            `Đã ghi nhận ${r.label}: học viên vắng`,
                          )}>Xác nhận vắng</button>
                        )}
                        {r.sitStatus !== 'scheduled' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => act(
                            () => api.post(`/attempts/${d.id}/skills/${r.skill}/sit`, { status: 'scheduled' }),
                            `Đã bỏ xác nhận cho ${r.label}`,
                          )}>Bỏ xác nhận</button>
                        )}
                      </>
                    )}
                    {/*
                      XỬ LÝ VẮNG là một đường RIÊNG, không phải "đổi tuần" (mục 10.6): nó có
                      bộ đếm, có người duyệt và có hạn trả lời. Chỉ hiện khi đã xác nhận vắng
                      — ô điểm trống chưa đủ để kết luận em không đi thi.
                    */}
                    {editable && r.required && !r.scored && r.sitStatus === 'absent' && !r.pendingMove && (
                      <button className="btn btn-sm btn-primary" onClick={() => setMoveFor(r)}>
                        Xử lý vắng
                      </button>
                    )}
                    {/* Chỉ Quản lý trả lời được — và trả lời TRƯỚC khi tuần mới bắt đầu. */}
                    {d.viewer.canPlanWeek && editable && r.pendingMove && (
                      <button className="btn btn-sm btn-primary" onClick={() => setDecideFor(r)}>
                        Trả lời đề nghị
                      </button>
                    )}
                    {d.viewer.canPlanWeek && editable && r.required
                      && (r.progress === 'cancelled' || (!r.periodCode && !r.scored)) && (
                      <button className="btn btn-sm btn-primary" onClick={() => setRestoreFor(r)}>
                        Khôi phục và đặt tuần
                      </button>
                    )}
                    {d.viewer.canOverrideDeadline && editable && r.required && (
                      <button className="btn btn-sm btn-ghost" onClick={() => setDeadlineFor(r)}>Hạn riêng</button>
                    )}
                    {d.viewer.canSkipSkill && editable && d.scoringMode === 'band' && (
                      <button className="btn btn-sm btn-ghost" onClick={() => act(
                        () => api.post(`/attempts/${d.id}/skills/${r.skill}/skip`, {
                          skipped: r.required,
                          reason: r.required ? 'Quản lý chốt trước: đợt này không yêu cầu kỹ năng đó' : undefined,
                        }),
                        r.required ? `${r.label} đã ra khỏi phạm vi yêu cầu` : `${r.label} đã trở lại phạm vi yêu cầu`,
                      )}>
                        {r.required ? 'Bỏ khỏi phạm vi' : 'Đưa lại vào phạm vi'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SectionNote>
        Mỗi kỹ năng mang lịch và hạn chấm của riêng nó, nên dời Speaking chỉ đổi hạn Speaking —
        các môn đã thi tuần trước giữ nguyên hạn cũ. Môn <strong>chưa đến lịch</strong> thì chưa
        nợ điểm và không bao giờ bị tính quá hạn.
        {d.scoringMode === 'ratio'
          ? ' Lớp Normal luôn phải đủ bốn môn — không có thao tác miễn môn.'
          : ' Bỏ một môn khỏi phạm vi là quyết định chốt TRƯỚC khi thi, không dùng để hợp thức hoá một đợt học viên đã vắng.'}
      </SectionNote>

      <SkillWeekModal
        open={!!weekFor} row={weekFor} attemptId={d.id}
        onClose={() => setWeekFor(null)} onDone={onDone}
      />
      <SkillDeadlineModal
        open={!!deadlineFor} row={deadlineFor} attemptId={d.id}
        onClose={() => setDeadlineFor(null)} onDone={onDone}
      />
      <AbsenceMoveModal
        open={!!moveFor} row={moveFor} detail={d}
        onClose={() => setMoveFor(null)} onDone={onDone}
      />
      <RestoreModal
        open={!!restoreFor} row={restoreFor} detail={d}
        onClose={() => setRestoreFor(null)} onDone={onDone}
      />
      <DecideMoveModal
        open={!!decideFor} row={decideFor} detail={d}
        onClose={() => setDecideFor(null)} onDone={onDone}
      />
    </Card>
  );
}

/** Đổi TUẦN THI của đúng một kỹ năng. Cảnh báo về khoảng cách giữa các đợt cần xác nhận lại. */
function SkillWeekModal({ open, row, attemptId, onClose, onDone }: {
  open: boolean; row: SkillRow | null; attemptId: number; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  /* Cảnh báo cần người xác nhận lại; lần bấm thứ hai mới gửi kèm dấu đã xác nhận. */
  const [warning, setWarning] = useState<string | null>(null);

  const close = () => {
    setPeriodId(null); setReason(''); setWarning(null); onClose();
  };

  const submit = async (force: boolean) => {
    if (!row || !periodId) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/skills/${row.skill}/week`, { periodId, reason, force });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone(); close();
      toast.push('ok', `Đã đổi tuần thi ${row.label}`);
    } catch (e: any) {
      if (/Xác nhận lại/.test(e.message)) setWarning(e.message);
      else toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Tuần thi · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId}
          onClick={() => submit(!!warning)}>
          {busy ? 'Đang lưu…' : warning ? 'Vẫn xếp vào tuần này' : 'Lưu'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          Đang thi {row?.periodCode ? `${row.periodCode} (${row.weekRange})` : 'chưa xếp tuần'}.
          Chỉ kỹ năng này đổi lịch; các kỹ năng khác của đợt giữ nguyên tuần và hạn chấm.
        </p>
        <label className="block">
          <span className="label">Tuần thi mới</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => { setPeriodId(Number(e.target.value) || null); setWarning(null); }}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
        {/* PREVIEW "tuần cũ → tuần mới" TRƯỚC KHI LƯU — sổ §D/T07: thấy rõ đang đổi gì, không đoán. */}
        {periodId && (() => {
          const next = (periods.data ?? []).find((p) => p.id === periodId);
          return next ? (
            <p className="text-sm text-slate-200 m-0">
              {row?.periodCode ?? 'chưa có tuần'} <strong>→</strong> {next.code} · {next.range}
            </p>
          ) : null;
        })()}
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: trùng lịch phòng thi Speaking" />
        </label>
        {warning && <p className="text-xs text-amber-200 m-0">{warning}</p>}
        <SectionNote>
          Đây là <strong>dời chủ động</strong>: xếp lại phòng thi, tách R/L/W với Speaking, đổi theo
          lịch học. Nó KHÔNG tiêu lượt dời nào của em. Em vắng buổi thi thì dùng nút{' '}
          <strong>“Xử lý vắng”</strong> — ở đó mới có bộ đếm, người duyệt và hạn trả lời.
          Đổi tuần sửa chính đợt này, không tạo đợt mới và không đổi số MT. Phần thi đã có điểm
          thì không đổi lịch được — lịch sử thực tế sai là một hiệu chỉnh riêng, không phải một lần dời.
        </SectionNote>
      </div>
    </Modal>
  );
}

/** Hạn chấm riêng cho ĐÚNG một kỹ năng, đè lên hạn riêng của cả đợt và hạn mặc định. */
function SkillDeadlineModal({ open, row, attemptId, onClose, onDone }: {
  open: boolean; row: SkillRow | null; attemptId: number; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (value: string | null) => {
    if (!row) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/skills/${row.skill}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/overview');
      onDone(); onClose(); setDate(''); setReason('');
      toast.push('ok', value ? `Đã đặt hạn riêng cho ${row.label}` : `${row.label} quay lại hạn mặc định`);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Hạn chấm · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        {row?.deadlineSource === 'skill_override' && (
          <button className="btn" disabled={busy} onClick={() => submit(null)}>Dùng lại hạn mặc định</button>
        )}
        <button className="btn btn-primary" disabled={busy || !date} onClick={() => submit(date)}>
          {busy ? 'Đang lưu…' : 'Lưu hạn riêng'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          Hạn đang áp dụng: {row?.deadline ? fmtDate(row.deadline) : 'chưa có'}.
        </p>
        <label className="block">
          <span className="label">Hạn riêng cho kỹ năng này</span>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giáo viên Writing nghỉ phép" />
        </label>
        <SectionNote>
          Hạn riêng đặt ở đây chỉ áp cho kỹ năng này, không đụng tới các kỹ năng khác của đợt.
          Hết ngày hạn mới tính quá hạn.
        </SectionNote>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- vấn đề học vụ

/**
 * HƯỚNG DẪN PHỐI HỢP theo lần MT × mức SOS, lấy từ quy trình của trung tâm.
 *
 * Đây là GỢI Ý, không phải việc đã làm. Trước đây hai thứ này nằm chung một chỗ: điền tên
 * vào ô hướng dẫn là case trông như đã xử lý xong, dù chưa ai làm gì. Nay việc đã làm nằm
 * ở phần trên — có người thực hiện, có ngày thật, có lần xem lại — còn đây chỉ nhắc nên
 * làm gì tiếp.
 */
function Playbook({ steps }: { steps: any[] }) {
  return (
    <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--line)' }}>
      <div className="label">Quy trình gợi ý cho mức này</div>
      <ul className="mt-1 space-y-1 list-none p-0 m-0">
        {steps.map((s: any) => (
          <li key={s.key} className="text-xs text-slate-400">
            <span className="text-slate-200">{s.label}</span>
            {!s.required && <span className="text-slate-500"> (theo từng trường hợp)</span>}
            {' — '}{s.detail}
          </li>
        ))}
      </ul>
      <SectionNote>
        Hệ thống không tự cấp buổi học, không tự lùi lịch thi và không tự kết thúc theo dõi.
        Trao đổi phụ huynh do CS thực hiện ngoài hệ thống — ghi lại tên người làm và ngày thật.
      </SectionNote>
    </div>
  );
}

// ---------------------------------------------------------------- thao tác lịch

/** Đổi TUẦN kế hoạch — việc của Quản lý. Ngày cũ ngoài tuần mới sẽ bị bỏ để xếp lại. */
function WeekModal({ open, onClose, attemptId, currentPeriodId, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; currentPeriodId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(currentPeriodId);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Xếp cả đợt vào một tuần" width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId || periodId === currentPeriodId} onClick={async () => {
          setBusy(true);
          try {
            const r = await api.post<any>(`/attempts/${attemptId}/week`, { periodId, reason, force: true });
            invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
            onDone(); onClose();
            toast.push('ok', r?.keptInPlace?.length
              ? `Đã đổi tuần ${r.moved.length} kỹ năng. Giữ nguyên lịch của ${r.keptInPlace.length} kỹ năng đã thi hoặc đã có điểm.`
              : `Đã đổi tuần ${r?.moved?.length ?? ''} kỹ năng`);
          } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
        }}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Tuần mới</span>
          <select className="field" value={periodId ?? ''} onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: trùng lịch phòng thi" />
        </label>
        <SectionNote>
          Đây là lối tắt: nó xếp <strong>mọi kỹ năng còn dời được</strong> vào cùng một tuần.
          Kỹ năng đã thi hoặc đã có điểm giữ nguyên lịch thật của nó. Muốn tách R/L/W với Speaking
          thì dùng nút "Đổi tuần" của từng kỹ năng ở bảng lịch.
          Đổi tuần cập nhật chính lượt MT này, không tạo lượt mới và không tăng số MT.
        </SectionNote>
      </div>
    </Modal>
  );
}


/** Hạn nhập điểm riêng, thay hạn mặc định. Chỉ một hạn có hiệu lực tại một thời điểm. */
function DeadlineModal({ open, onClose, detail, onDone }: {
  open: boolean; onClose: () => void; detail: Detail; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(detail.deadlineOverride?.date ?? '');
  const [reason, setReason] = useState(detail.deadlineOverride?.reason ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (value: string | null) => {
    setBusy(true);
    try {
      await api.post(`/attempts/${detail.id}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/overview');
      onDone(); onClose();
      toast.push('ok', value ? 'Đã đặt hạn riêng' : 'Đã quay lại hạn mặc định');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hạn nhập điểm" width="max-w-md"
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        {detail.deadlineOverride && (
          <button className="btn" disabled={busy} onClick={() => submit(null)}>Dùng lại hạn mặc định</button>
        )}
        <button className="btn btn-primary" disabled={busy || !date} onClick={() => submit(date)}>
          {busy ? 'Đang lưu…' : 'Lưu hạn riêng'}
        </button>
      </>}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Hạn riêng</span>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason ?? ''} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giáo viên Writing nghỉ phép" />
        </label>
        <SectionNote>
          Hạn mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần thi môn đó
          (lớp Normal là hết Chủ nhật của chính tuần thi). Hạn đặt ở đây áp cho CẢ ĐỢT; muốn đặt
          cho một môn thôi thì dùng nút "Hạn riêng" của môn đó ở bảng lịch. Hết ngày hạn mới tính quá hạn.
        </SectionNote>
      </div>
    </Modal>
  );
}

function CancelDialog({ open, onClose, attemptId, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <ConfirmDialog
      open={open} onClose={onClose} danger busy={busy} title="Huỷ lượt Mock Test" confirmLabel="Huỷ lượt"
      body={
        <div className="space-y-2">
          <p>Huỷ vẫn giữ nguyên lịch sử và không đổi số MT. Lượt đã huỷ không tính vào “đã xong” hay “thiếu điểm”.</p>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do huỷ (bắt buộc)" />
        </div>
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.post(`/attempts/${attemptId}/cancel`, { reason });
          invalidate('/attempts'); invalidate('/overview');
          onDone(); onClose(); toast.push('ok', 'Đã huỷ lượt MT');
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}

const actionLabel = (a: string) =>
  ({
    created: 'Tạo kế hoạch', week_set: 'Đổi tuần', lrw_set: 'Chốt buổi chính',
    speaking_set: 'Chốt buổi Speaking', cancelled: 'Huỷ lượt', reopened: 'Mở lại',
    skill_skipped: 'Bỏ khỏi phạm vi', skill_restored: 'Đưa lại vào phạm vi',
    deadline_set: 'Đặt hạn riêng cả đợt', deadline_cleared: 'Bỏ hạn riêng cả đợt',
    skill_week_set: 'Đổi tuần thi', skill_week_moved_absence: 'Dời do vắng',
    skill_sit_status: 'Trạng thái thi', completion_week: 'Tuần hoàn tất theo kế hoạch',
    skill_deadline_set: 'Đặt hạn riêng cho môn', skill_deadline_cleared: 'Bỏ hạn riêng của môn',
  }[a] ?? a);

/*
 * Nhãn cho cột `field` của lịch sử vấn đề. Những tên cũ (trao đổi HS/PH, chính sách vận
 * hành…) GIỮ LẠI dù các cột đó đã bỏ: các dòng lịch sử ghi từ trước vẫn còn, và đọc lại
 * thấy "talk_parent_date" thì không ai hiểu.
 */
const fieldLabel = (f: string) =>
  ({
    track: 'Đầu mục', topic: 'Kỹ năng',
    sos_level: 'Mức SOS', status: 'Trạng thái', talk_student_person: 'Người trao đổi HS',
    talk_student_date: 'Ngày trao đổi HS', talk_parent_person: 'Người trao đổi PH',
    talk_parent_date: 'Ngày trao đổi PH', academic_support: 'Hỗ trợ học thuật',
    academic_person: 'Người phụ trách học thuật', academic_start_date: 'Ngày bắt đầu hỗ trợ',
    ops_policy: 'Chính sách vận hành', ops_date: 'Ngày áp dụng', meeting_kind: 'Meeting',
    meeting_date: 'Ngày meeting', head_confirmed: 'Head xác nhận', note: 'Ghi chú',
  }[f] ?? f);

/**
 * XỬ LÝ VẮNG MỘT BUỔI THI (mục 10.6).
 *
 * Form này cố tình KHÔNG cho chọn tuần. Luật nói rõ: lần đầu dời đúng TUẦN KẾ TIẾP của lịch
 * đang có. Bày một ô chọn tuần ra đây là mời người dùng làm đúng cái việc mà luật cấm — và
 * một GVCN xử lý muộn ba tuần sẽ chọn tuần hiện tại, âm thầm cho em thêm hai tuần.
 *
 * Buổi R/L/W là MỘT lần vắng của nhiều kỹ năng, nên tick được nhiều môn. Nhưng máy chủ vẫn
 * xét TỪNG MÔN riêng: môn đã dời một lần thì đi xin duyệt, môn chưa dời thì đổi được ngay.
 */
function AbsenceMoveModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);

  /* Các môn khác cũng đang mang dấu vắng — nhiều khả năng là cùng một buổi. */
  const alsoAbsent = detail.skillSchedule.filter(
    (r) => r.required && !r.scored && r.sitStatus === 'absent' && !r.pendingMove && r.skill !== row?.skill,
  );
  const skills = [row?.skill, ...picked].filter(Boolean) as string[];

  const close = () => { setPicked([]); setReason(''); setResult(null); onClose(); };

  const submit = async () => {
    if (!row) return;
    setBusy(true);
    try {
      const res: any = await api.post(`/attempts/${detail.id}/absence-move`, {
        skills, reason,
        /* Bấm hai lần hay mạng chập không được thành hai lần dời. */
        idempotencyKey: `${detail.id}:${skills.join('+')}:${reason}`,
      });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes'); invalidate('/my-work');
      onDone();
      setResult(res.outcomes ?? []);
      toast.push('ok', 'Đã xử lý việc vắng');
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Xử lý vắng · ${row?.label ?? ''}`} width="max-w-md"
      footer={result
        ? <button className="btn btn-primary" onClick={close}>Đóng</button>
        : <>
          <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? 'Đang xử lý…' : 'Xử lý việc vắng'}
          </button>
        </>}>
      {result ? (
        <div className="space-y-2">
          {result.map((o: any) => (
            <p key={o.skill} className={`text-sm m-0 ${o.result === 'moved' ? 'text-slate-200' : 'text-amber-200'}`}>
              {o.message}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 m-0">
            {row?.label} đang xếp {row?.periodCode} ({row?.weekRange}), đã xác nhận vắng.
            {(row?.absenceMoveCount ?? 0) > 0 && ` Môn này đã dời do vắng ${row?.absenceMoveCount} lần.`}
          </p>

          {alsoAbsent.length > 0 && (
            <div>
              <span className="label">Cùng buổi thi này còn môn nào vắng?</span>
              <div className="space-y-1 mt-1">
                {alsoAbsent.map((r) => (
                  <label key={r.skill} className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={picked.includes(r.skill)}
                      onChange={(e) => setPicked(
                        e.target.checked ? [...picked, r.skill] : picked.filter((x) => x !== r.skill),
                      )} />
                    <span>{r.label} <span className="text-slate-500 text-xs">({r.periodCode})</span></span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 mb-0">
                Tick các môn thi CÙNG buổi. Mỗi môn vẫn được xét riêng: môn đã dời một lần thì
                phải xin Quản lý duyệt, môn chưa dời lần nào thì đổi được ngay.
              </p>
            </div>
          )}

          <label className="block">
            <span className="label">Lý do</span>
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: em ốm, gia đình đã báo trước" />
          </label>

          <SectionNote>
            {(row?.absenceMoveCount ?? 0) === 0 ? (
              <>
                Đây là <strong>lần dời thứ nhất</strong>: lịch chuyển sang đúng tuần kế tiếp của
                lịch đang có — không chọn tuỳ ý, và không lấy tuần hiện tại để nhảy nhiều tuần
                khi xử lý muộn.
              </>
            ) : (
              <>
                Môn này đã dời do vắng rồi, nên lần này là <strong>đề nghị cần Quản lý duyệt</strong>.
                Lịch giữ nguyên cho tới khi có quyết định. Quản lý phải trả lời TRƯỚC khi tuần mới bắt
                đầu; từ chối hoặc hết hạn thì phần thi bị huỷ và chỉ Quản lý mới khôi phục được.
              </>
            )}
          </SectionNote>
        </div>
      )}
    </Modal>
  );
}

/**
 * KHÔI PHỤC PHẦN THI ĐÃ HUỶ và ĐẶT TUẦN MỚI — trong CÙNG một thao tác (mục 10.6).
 *
 * Tách làm hai bước thì sẽ có những phần được khôi phục mà không có tuần, nằm im ở đúng
 * trạng thái mà cả mục này sinh ra để dọn. Nên form này không có nút "khôi phục thôi".
 */
function RestoreModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => { setPeriodId(null); setReason(''); onClose(); };

  const submit = async () => {
    if (!row || !periodId) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${detail.id}/skills/${row.skill}/restore`, { periodId, reason });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes');
      onDone(); close();
      toast.push('ok', `Đã khôi phục ${row.label} và đặt tuần mới`);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Khôi phục · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !periodId} onClick={submit}>
          {busy ? 'Đang lưu…' : 'Khôi phục và đặt tuần'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400 m-0">
          {detail.scoringMode === 'ratio'
            ? 'Lớp Normal: lịch hẹn đã bị huỷ nhưng em vẫn phải thi đủ bốn môn. Xếp lại tuần cho môn này.'
            : 'Phần thi này đã bị huỷ. Đợt vẫn chưa đủ kết quả cho tới khi em thi bù xong.'}
        </p>
        <label className="block">
          <span className="label">Tuần thi mới</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Chọn tuần…</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Lý do</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: xếp cho em thi bù cùng lớp khác" />
        </label>
        <SectionNote>
          Khôi phục KHÔNG đặt lại bộ đếm dời do vắng — những lần em vắng trước đó vẫn đã xảy ra.
          Tuần mới phải là một tuần <strong>chưa tới</strong>: xếp vào một tuần đã bắt đầu là ghi vào
          hệ thống một buổi thi không thể diễn ra.
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ NGHỊ DỜI DO VẮNG (mục 10.6).
 *
 * Hai nút, và cái thứ hai phải nói rõ hậu quả: TỪ CHỐI KHÔNG PHẢI LÀ "giữ nguyên lịch cũ",
 * mà là HUỶ phần thi (Fast Track) hoặc huỷ lịch hẹn (Normal). Một cái nút "Từ chối" trơ
 * trọi sẽ được bấm bởi người tưởng mình chỉ đang nói "không dời nữa".
 *
 * Ô chọn tuần chỉ dùng khi tuần được đề nghị đã trôi qua — đồng ý một lịch đã qua là ghi
 * vào hệ thống một buổi thi không thể diễn ra.
 */
function DecideMoveModal({ open, row, detail, onClose, onDone }: {
  open: boolean; row: SkillRow | null; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const periods = usePeriods();
  const [note, setNote] = useState('');
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setNote(''); setPeriodId(null); onClose(); };

  const decide = async (approve: boolean) => {
    if (!row?.pendingMove) return;
    setBusy(true);
    try {
      await api.post(`/move-requests/${row.pendingMove.id}/decide`, {
        approve, note, periodId: approve ? periodId : null,
      });
      invalidate('/attempts'); invalidate('/overview'); invalidate('/classes'); invalidate('/my-work');
      onDone(); close();
      toast.push('ok', approve ? `Đã duyệt dời ${row.label}` : `Đã từ chối — phần thi ${row.label} bị huỷ`);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={close} title={`Đề nghị dời · ${row?.label ?? ''}`} width="max-w-md"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Để sau</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => decide(false)}>
          Từ chối và huỷ phần thi
        </button>
        <button className="btn btn-primary" disabled={busy} onClick={() => decide(true)}>
          {busy ? 'Đang lưu…' : 'Đồng ý dời'}
        </button>
      </>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-200 m-0">
          GVCN đề nghị dời {row?.label} sang tuần <strong>{row?.pendingMove?.toWeek ?? '—'}</strong>.
          Đây là lần dời do vắng thứ {row?.pendingMove?.moveNo}.
        </p>
        <p className="text-xs text-amber-200 m-0">
          Bạn cần trả lời trước {fmtDate(row?.pendingMove?.decideBy ?? null)} — tức là trước khi tuần mới
          bắt đầu. Quá hạn mà chưa có quyết định thì hệ thống tự huỷ như một lần từ chối.
        </p>

        <label className="block">
          <span className="label">Đổi sang tuần khác (không bắt buộc)</span>
          <select className="field" value={periodId ?? ''}
            onChange={(e) => setPeriodId(Number(e.target.value) || null)}>
            <option value="">Giữ tuần GVCN đề nghị</option>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
          <span className="block text-[11px] text-slate-500 mt-1">
            Chỉ cần khi tuần được đề nghị đã bắt đầu — lúc đó phải chọn một tuần chưa tới.
          </span>
        </label>

        <label className="block">
          <span className="label">Ghi chú quyết định</span>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: đồng ý lần cuối, lần sau xếp thi cùng lớp khác" />
        </label>

        <SectionNote>
          <strong>Từ chối không phải là giữ nguyên lịch cũ.</strong>{' '}
          {detail.scoringMode === 'ratio'
            ? 'Lớp Normal: lịch hẹn bị huỷ, nhưng em vẫn phải thi đủ bốn môn — môn này chuyển sang chờ bạn xếp lại.'
            : 'Fast Track: phần thi chưa thi bị huỷ, điểm các phần đã xong giữ nguyên. Đợt này chưa đủ kết quả cho tới khi bạn khôi phục và đặt tuần mới.'}
        </SectionNote>
      </div>
    </Modal>
  );
}
