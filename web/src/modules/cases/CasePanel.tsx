import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Alert, Card, Empty, ErrorState, Field, Info, Level, Outcome, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { caseStatusLabel, caseStatusTone, fmtBand, fmtDate, skillLabel, sosLabel, sosTone } from '../../lib/format.ts';
import {
  CASE_CATEGORY_LABEL, CASE_OUTCOMES, CASE_OUTCOME_LABEL,
  DISPOSITIONS, DISPOSITION_LABEL,
  INTERVENTION_KINDS, INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
  NEXT_STEP_HINT, NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE,
  PROPOSAL_KINDS, SUPPORT_KINDS,
  cycleDeadlineHint, isContactKind, isProposalKind, nextStepsFor, outcomeLabelFor, outcomesFor,
  URGENCY_LABEL,
} from '@shared/domain/index.ts';

/**
 * MỘT VẤN ĐỀ HỌC VỤ, kể theo bốn câu hỏi người đọc thực sự cần:
 *
 *   1. Vì sao đang theo dõi?   → tóm tắt, ai phát hiện, phân loại, bằng chứng
 *   2. Đã làm gì?              → các tác động, ai làm, ngày nào
 *   3. Sau đó quan sát được gì?→ các lần xem lại
 *   4. Bước tiếp theo là gì?   → hướng xử lý, hẹn xem lại
 *
 * Cùng một khung này dùng cho MỌI lối vào — từ điểm số, từ hồ sơ học viên, từ màn quản
 * lý — vì tất cả đều đang nói về đúng một bản ghi.
 */

type CaseDetail = {
  id: number; originKind: string;
  /** `academic` hay `behaviour` — quyết định bộ kết quả và độ dài chu kỳ. */
  track: string;
  /** Còn thiếu gì để hoàn thành case. Rỗng = đủ điều kiện đóng (mục 7.7 [5]). */
  closeBlockers: string[];
  student: { id: number; code: string; name: string; status: string } | null;
  cycle: { id: number; seq: number; route: string | null; target_score: number | null } | null;
  classId: number | null; attemptId: number | null; attemptNo: number | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  /** Tên case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
  title: string | null;
  /** Hạng mục — đơn vị của case từ vòng 4. */
  category: string | null; categoryLabel: string | null;
  /** Case mở song song có chủ ý với một case khác cùng hạng mục. */
  parallel: boolean;
  /** Lớp chấm điểm đạt/tổng (Normal) hay band 0–9 (Fast Track). */
  ratio: boolean;
  /** Các hạng mục hợp lệ để ghi điểm giáo viên tự chấm. */
  categories: { code: string; label: string }[];
  note: string | null;
  /** Hạn BÁO KẾT QUẢ của cả case — khác hạn làm từng phương án. */
  followUntil: string | null; followOverdue: boolean;
  /** Kết quả chung đã chốt. */
  outcome: string | null; outcomeLabel: string | null;
  outcomeNote: string | null; outcomeDecision: string | null; outcomeAt: string | null;
  /** Mọi phương án đã có kết quả chưa — điều kiện để chốt kết quả chung. */
  canFinish: boolean;
  /** Các mốc trong vòng đời case, cũ trước mới sau. */
  milestones: any[];
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  viewer: { canEdit: boolean; canClose: boolean; canApprove: boolean };
};

export function CasePanel({ caseId, compact = false }: { caseId: number; compact?: boolean }) {
  const { session } = useSession();
  const todayIso = session?.demoDate ?? '';
  const { data, loading, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [addAction, setAddAction] = useState(false);
  const [resultFor, setResultFor] = useState<any | null>(null);
  const [respondTo, setRespondTo] = useState<any | null>(null);
  const [close, setClose] = useState(false);
  const [outcome, setOutcome] = useState(false);
  const [completing, setCompleting] = useState<any | null>(null);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;

  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const secondary = data.issues.filter((i) => i.role === 'secondary');
  const context = data.issues.filter((i) => i.role === 'context');

  /*
   * MỘT DÒNG THỜI GIAN, KHÔNG PHẢI NĂM CÁI HỘP.
   *
   * Case nay sống suốt khoá, nên câu hỏi người dùng mang tới đây luôn là một câu chuyện:
   * trượt → đã làm gì → có ăn thua không → lại trượt → đang làm gì. Bản trước xếp bốn hộp
   * rời (vấn đề · phương án · xem lại · hướng xử lý), nên thứ tự trước sau — thứ duy nhất
   * trả lời được câu hỏi ấy — lại là thứ duy nhất không nhìn thấy.
   *
   * Ba loại việc trộn chung theo NGÀY, mỗi loại một hình dạng riêng để vẫn phân biệt được:
   *   mốc        chuyện xảy ra VỚI EM   (trượt, trượt lại, tái phát, đã đạt, chốt)
   *   phương án  việc MÌNH LÀM cho em
   *   quan sát   kết quả sau khi làm
   */
  const timeline = buildTimeline(data, {
    onRespond: setRespondTo,
    onComplete: setCompleting,
    onResult: setResultFor,
  });

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════════ đầu case */}
      <section>
        <h3 className="text-base font-semibold text-slate-100 m-0 flex flex-wrap items-center gap-2">
          {data.title ?? data.headline}
          {/*
            MỘT TRẠNG THÁI CHÍNH ở đầu case (mục 7.10), và nó là trạng thái CÔNG VIỆC —
            màu xanh lá dành riêng cho kết quả học tập, không dùng cho "đã xong việc".
          */}
          <Status kind={data.status === 'done' ? 'done' : data.status === 'open' ? 'idle' : 'doing'}>
            {caseStatusLabel(data.status)}
          </Status>
          {data.sosLevel !== null && data.status !== 'done' && (
            <Level tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Level>
          )}
          {data.urgency && data.urgency !== 'normal' && data.status !== 'done' && (
            <Alert tone={data.urgency === 'urgent' ? 'danger' : 'warn'}>
              {URGENCY_LABEL[data.urgency as keyof typeof URGENCY_LABEL]}
            </Alert>
          )}
          {data.parallel && <Info>Case riêng, song song</Info>}
        </h3>

        <p className="text-xs text-slate-500 mt-1 mb-0">
          {data.student && !compact && (
            <><Link className="link" to={`/hoc-vien/${data.student.id}`}>{data.student.name}</Link> · </>
          )}
          {data.categoryLabel && <>{data.categoryLabel} · </>}
          mở từ {fmtDate(data.detectedAt)}
          {data.reportedBy && ` · ${data.reportedBy} báo`}
          {mtCount(data) > 1 && ` · đã kéo qua ${mtCount(data)} lượt MT`}
          {data.cycle && ` · ${data.cycle.route ?? `Lộ trình ${data.cycle.seq}`}`}
        </p>

        {/*
          HẠN BÁO KẾT QUẢ của cả case — khác hạn làm từng phương án, nên đứng riêng một dòng
          ở đầu case chứ không lẫn vào danh sách việc.
        */}
        {data.followUntil && data.status !== 'done' && (
          <p className={`text-xs mt-1 mb-0 ${data.followOverdue ? 'text-rose-300' : 'text-slate-400'}`}>
            {data.followOverdue ? '⚠ Quá hạn báo kết quả: ' : 'Hạn báo kết quả: '}
            <strong>{fmtDate(data.followUntil)}</strong>
            <span className="text-slate-500"> — hết tuần có MT kế tiếp</span>
          </p>
        )}

        {(primary || secondary.length > 0 || context.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {primary && <Info title={primary.observation ?? undefined}>{primary.label}</Info>}
            {secondary.map((i) => <Info key={i.id} title={i.observation ?? undefined}>{i.label}</Info>)}
            {context.map((i) => (
              <Info key={i.id} pending title={i.observation ?? undefined}>Bối cảnh: {i.label}</Info>
            ))}
          </div>
        )}
        {data.summary && <p className="text-sm text-slate-300 mt-2 mb-0">{data.summary}</p>}
        {data.note && <p className="text-xs text-slate-400 mt-1 mb-0">{data.note}</p>}
      </section>

      {/* ══════════════════════════════════════════════════ dòng thời gian */}
      <section>
        {timeline.length === 0 ? (
          <Empty title="Chưa có gì diễn ra"
            hint="Ghi lại phương án đầu tiên để lần sau còn biết đã thử gì cho em." />
        ) : (
          <ol className="list-none p-0 m-0 relative pl-6"
              style={{ borderLeft: '2px solid var(--line-strong)', marginLeft: '5px' }}>
            {timeline.map((ev) => (
              <li key={ev.key} className="relative pb-5 last:pb-1">
                {/* Chấm mốc: đặc = chuyện xảy ra với em, rỗng = việc mình làm. */}
                <span className="absolute rounded-full"
                      style={{
                        left: '-31px', top: '4px', width: '12px', height: '12px',
                        background: ev.dotFill, border: `2px solid ${ev.dotEdge}`,
                      }} />
                <span className="text-[11px] text-slate-500 tabular-nums tracking-wide">
                  {fmtDate(ev.on)}{ev.attemptNo ? ` · MT${ev.attemptNo}` : ''}
                </span>
                <p className="text-sm font-semibold text-slate-100 mt-0.5 mb-0 flex flex-wrap items-center gap-2">
                  {ev.title}
                  {ev.badge}
                </p>
                {ev.body}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ══════════════════════════════════════════════════ bước tiếp theo */}
      <section className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
        {data.outcome ? (
          <p className="text-sm text-slate-100 m-0">
            Đã chốt: <strong>{data.outcomeLabel}</strong>
            {data.outcomeDecision === 'extend' && <span className="text-slate-400"> · kéo dài theo dõi</span>}
            {data.outcomeNote && <span className="text-slate-400"> — {data.outcomeNote}</span>}
          </p>
        ) : data.disposition ? (
          <p className="text-sm text-slate-100 m-0">
            Hướng xử lý: {DISPOSITION_LABEL[data.disposition as keyof typeof DISPOSITION_LABEL] ?? data.disposition}
            {data.dispositionNote && <span className="text-slate-400"> — {data.dispositionNote}</span>}
          </p>
        ) : (
          <p className="text-sm text-slate-400 m-0">Chưa có phương án hỗ trợ — chưa ai định hướng xử lý.</p>
        )}
        {data.closedAt && <p className="text-xs text-slate-500 mt-1 mb-0">Đã kết thúc theo dõi {fmtDate(data.closedAt)}</p>}

        {data.viewer.canEdit && (
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            <button className="btn btn-sm" onClick={() => setAddAction(true)}>+ Thêm phương án</button>
            {data.status !== 'done' && (
              <button
                className="btn btn-sm btn-primary"
                disabled={(data.closeBlockers?.length ?? 0) > 0 || !data.viewer.canClose}
                title={!data.viewer.canClose
                  ? 'Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới hoàn thành được case.'
                  : undefined}
                onClick={() => setOutcome(true)}>
                Hoàn thành case
              </button>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => setClose(true)}>
              {data.status === 'done' ? 'Đổi hướng xử lý' : 'Chọn hướng xử lý'}
            </button>
          </div>
        )}
        {/*
          NÓI RÕ CÒN THIẾU GÌ, ngay tại chỗ (mục 7.7 [5]). Một cái nút mờ không giải thích là
          cách chắc chắn nhất để người dùng nghĩ phần mềm hỏng.
        */}
        {data.viewer.canEdit && data.status !== 'done' && (data.closeBlockers?.length ?? 0) > 0 && (
          <SectionNote>
            <strong>Chưa hoàn thành case được.</strong>
            <ul className="list-disc pl-5 mt-1 mb-0">
              {data.closeBlockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </SectionNote>
        )}
        {!data.viewer.canClose && data.status !== 'done' && (
          <SectionNote>
            Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới hoàn thành case được. Bạn vẫn cập
            nhật được kết quả của từng phương án.
          </SectionNote>
        )}
      </section>

      <OutcomeDialog open={outcome} onClose={() => setOutcome(false)} caseId={caseId}
        ratio={!!data.ratio} categories={data.categories ?? []} onDone={reload} />
      <CompleteDialog iv={completing} onClose={() => setCompleting(null)} onDone={reload} />
      <ActionDialog open={addAction} onClose={() => setAddAction(false)} caseId={caseId} onDone={reload} />
      <ApprovalDialog open={respondTo !== null} onClose={() => setRespondTo(null)}
        intervention={respondTo} onDone={reload} />
      <ResultDialog iv={resultFor} track={data.track ?? 'academic'}
        ratio={!!data.ratio} categories={data.categories ?? []}
        onClose={() => setResultFor(null)} onDone={reload} />
      <DispositionDialog open={close} onClose={() => setClose(false)} caseId={caseId}
        canClose={data.viewer.canClose} current={data.disposition} onDone={reload} />
    </div>
  );
}

/** Trang riêng cho một vấn đề — chia sẻ được, mở từ mọi nơi về cùng một bản ghi. */
export function CasePage({ caseId }: { caseId: number }) {
  return (
    <div className="max-w-[900px]">
      <Card title="Vấn đề - Case">
        <CasePanel caseId={caseId} />
      </Card>
    </div>
  );
}

/** Số lượt MT đã chạm vào case — đếm từ mốc, vì mốc là chỗ ghi lại từng lần trượt. */
function mtCount(data: any): number {
  return new Set((data.milestones ?? []).filter((m: any) => m.attemptNo).map((m: any) => m.attemptNo)).size;
}

type TimelineItem = {
  key: string; on: string; attemptNo: number | null;
  title: ReactNode; badge: ReactNode; body: ReactNode;
  dotFill: string; dotEdge: string;
  /** Thứ tự phụ trong cùng một ngày: chuyện xảy ra trước, việc mình làm sau. */
  rank: number;
};

const MILESTONE_TITLE: Record<string, string> = {
  opened: 'Mở case',
  repeat: 'Trượt lại',
  recurrence: 'Tái phát sau khi đã chốt kết thúc',
  passed: 'Đã đạt kỳ vọng',
  closed: 'Chốt kết thúc',
  extended: 'Chốt đợt này, kéo dài theo dõi',
};

/**
 * TRỘN MỐC, PHƯƠNG ÁN VÀ QUAN SÁT VÀO MỘT DÒNG THỜI GIAN.
 *
 * Quan sát KHÔNG đứng riêng một mốc mà nằm lồng dưới đúng phương án nó nói về: "có tiến bộ"
 * mà không biết tiến bộ sau việc gì thì không dùng được vào đâu. Chỉ quan sát chung không
 * gắn phương án nào mới đứng thành một mốc riêng.
 *
 * Trong cùng một ngày, chuyện xảy ra với em (mốc) xếp trước việc mình làm — vì đó đúng thứ
 * tự nhân quả, và đọc ngược lại thì câu chuyện vô nghĩa.
 */
type TimelineActions = {
  onRespond: (iv: any) => void;
  onComplete: (iv: any) => void;
  /** "Cập nhật kết quả" — gộp ba nút cũ thành một (mục 7.9). */
  onResult: (iv: any) => void;
};

function buildTimeline(data: any, act: TimelineActions): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const m of data.milestones ?? []) {
    const bad = m.kind === 'repeat' || m.kind === 'recurrence' || m.kind === 'opened';
    items.push({
      key: `m${m.id}`, on: m.occurredOn, attemptNo: m.attemptNo, rank: 0,
      dotFill: bad ? 'var(--danger)' : m.kind === 'passed' ? 'var(--ok)' : 'var(--surface)',
      dotEdge: bad ? 'var(--danger)' : m.kind === 'passed' ? 'var(--ok)' : 'var(--line-strong)',
      title: MILESTONE_TITLE[m.kind] ?? m.kind,
      badge: (
        <>
          {m.band !== null && m.band !== undefined && (
            <Outcome tone={m.expectation !== null && m.band < m.expectation ? 'danger' : 'ok'}>
              {fmtBand(m.band)}{m.expectation !== null ? ` · kỳ vọng ${fmtBand(m.expectation)}` : ''}
            </Outcome>
          )}
          {m.sosLevel ? <Level tone={sosTone(m.sosLevel)}>{sosLabel(m.sosLevel)}</Level> : null}
        </>
      ),
      body: m.note ? <p className="text-xs text-slate-400 mt-1 mb-0">{m.note}</p> : null,
    });
  }

  for (const iv of data.interventions ?? []) {
    const on = iv.completedDate ?? iv.startedDate ?? iv.plannedDate ?? iv.actionDue ?? data.detectedAt;
    const mine = (data.followups ?? []).filter((f: any) => f.interventionId === iv.id);
    items.push({
      key: `i${iv.id}`, on, attemptNo: null, rank: 1,
      dotFill: 'var(--surface)',
      dotEdge: iv.status === 'completed' ? 'var(--accent)' : 'var(--line-strong)',
      title: (
        <>
          {INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}
        </>
      ),
      badge: (
        <>
          {/*
            TRẠNG THÁI CÔNG VIỆC, KHÔNG PHẢI KẾT QUẢ (mục 2.2). "Đã hoàn thành" ở đây chỉ
            nghĩa là việc đã làm xong — ăn thua đến đâu là nhãn kết quả ở dòng dưới nói.
          */}
          <Status kind={iv.status === 'completed' ? 'done'
            : iv.status === 'cancelled' ? 'idle'
            : iv.status === 'planned' ? 'waiting' : 'doing'}>
            {INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}
          </Status>
          {iv.approvalState === 'pending' && (
            <Status kind="waiting">Chờ Quản lý duyệt{iv.approvalDue ? ` · hạn ${fmtDate(iv.approvalDue)}` : ''}</Status>
          )}
          {iv.approvalState === 'approved' && <Status kind="done">Đã duyệt</Status>}
          {iv.approvalState === 'declined' && <Status kind="idle">Không duyệt</Status>}
          {iv.overdue && <Alert>Quá hạn cập nhật kết quả</Alert>}
        </>
      ),
      body: <InterventionBody iv={iv} followups={mine} data={data} act={act} />,
    });
  }

  for (const f of (data.followups ?? []).filter((x: any) => !x.interventionId)) {
    items.push({
      key: `f${f.id}`, on: f.observedOn, attemptNo: null, rank: 2,
      dotFill: 'var(--surface)', dotEdge: 'var(--line-strong)',
      title: f.metrics?.length ? 'Điểm giáo viên tự chấm' : 'Theo dõi chung',
      badge: f.outcome
        ? (
          <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>
            {outcomeLabelFor(data.track ?? 'academic', f.outcome)}
          </Outcome>
        )
        : null,
      body: (
        <>
          {f.note && <p className="text-xs text-slate-400 mt-1 mb-0">{f.note}</p>}
          <MetricPills metrics={f.metrics} />
        </>
      ),
    });
  }

  items.sort((a, b) => (a.on ?? '').localeCompare(b.on ?? '') || a.rank - b.rank || a.key.localeCompare(b.key));

  /*
   * ĐANG CHỜ GÌ — mốc cuối cùng, rỗng ruột, chỉ có khi case còn mở. Không có nó thì dòng
   * thời gian kết thúc lửng lơ và người đọc không biết bước tiếp theo là chờ ai.
   */
  if (data.status !== 'done' && data.followUntil) {
    items.push({
      key: 'wait', on: data.followUntil, attemptNo: null, rank: 9,
      dotFill: 'var(--bg)', dotEdge: 'var(--line-strong)',
      title: <span className="text-slate-400 font-normal">Đang chờ kết quả — hạn báo {fmtDate(data.followUntil)}</span>,
      badge: null, body: null,
    });
  }
  return items;
}

/** Phần thân của một phương án trong dòng thời gian: ai làm, khi nào, và kết quả ra sao. */
/**
 * ĐIỂM GIÁO VIÊN TỰ CHẤM hiện ngay tại dòng cập nhật sinh ra nó, và LUÔN CÓ CHỮ "cô chấm"
 * đi kèm. Một con số 6.5 đứng trơ trong lịch sử case sẽ bị đọc nhầm thành điểm mock trong
 * vòng vài tuần — nhãn đó là thứ duy nhất ngăn chuyện đó.
 */
function MetricPills({ metrics }: { metrics?: { skill: string; score: number; total: number | null }[] | null }) {
  if (!metrics?.length) return null;
  return (
    <>
      {metrics.map((m) => (
        <Info key={m.skill}>
          cô chấm {CASE_CATEGORY_LABEL[m.skill as keyof typeof CASE_CATEGORY_LABEL] ?? m.skill}{' '}
          {m.total ? `${m.score}/${m.total}` : fmtBand(m.score)}
        </Info>
      ))}
    </>
  );
}

function InterventionBody({ iv, followups, data, act }: {
  iv: any; followups: any[]; data: any; act: TimelineActions;
}) {
  const canEdit = data.viewer?.canEdit;
  const waiting = iv.approvalState === 'pending';
  const openStatus = iv.status === 'planned' || iv.status === 'started';
  return (
    <>
      {iv.description && <p className="text-sm text-slate-300 mt-1 mb-0">{iv.description}</p>}
      <p className="text-xs text-slate-500 mt-1 mb-0">
        {iv.performer ? `Người làm: ${iv.performer}` : 'Chưa có người thực hiện'}
        {iv.byProxy && iv.recordedBy && ` · ${iv.recordedBy} nhập hộ`}
        {iv.completedDate && ` · xong ${fmtDate(iv.completedDate)}`}
        {!iv.completedDate && iv.startedDate && ` · bắt đầu ${fmtDate(iv.startedDate)}`}
        {!iv.completedDate && iv.actionDue && (
          <span className={iv.actionOverdue ? 'text-amber-300' : undefined}>
            {iv.actionOverdue ? ' · ⚠ quá hạn làm ' : ' · hạn làm '}{fmtDate(iv.actionDue)}
          </span>
        )}
        {iv.followupDue && ` · hẹn xem lại ${fmtDate(iv.followupDue)}`}
      </p>
      {iv.approvalNote && (
        <p className="text-xs mt-1 mb-0 pl-3 border-l text-slate-300" style={{ borderColor: 'var(--line)' }}>
          Quản lý{iv.approvedBy ? ` (${iv.approvedBy})` : ''}: {iv.approvalNote}
        </p>
      )}
      {/*
        MỘT DÒNG CHO MỖI CHU KỲ ĐÃ KHÉP. Màu và dấu theo bảng ở mục 7.10 — trạng thái và
        KẾT QUẢ là hai thông tin khác nhau, nên một phương án "đã hoàn thành" với kết quả
        "Kém hơn" vẫn hiện màu đỏ. Tô xanh mọi thứ đã xong là nói dối.
      */}
      {followups.map((f) => (
        <p key={f.id} className="text-xs mt-1 mb-0 pl-3 border-l flex flex-wrap items-baseline gap-1.5"
           style={{ borderColor: 'var(--accent-line)' }}>
          <span className="text-slate-500 tabular-nums">{fmtDate(f.observedOn)}</span>
          {f.cycleNo && <span className="text-slate-600">chu kỳ {f.cycleNo}</span>}
          <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>
            {outcomeLabelFor(data.track ?? 'academic', f.outcome)}
          </Outcome>
          {f.nextStep && (
            <span className="text-slate-500">→ {NEXT_STEP_LABEL[f.nextStep as keyof typeof NEXT_STEP_LABEL] ?? f.nextStep}</span>
          )}
          {f.late && <Alert tone="warn">cập nhật trễ</Alert>}
          {f.observerName && <span className="text-slate-500">· {f.observerName}</span>}
          {f.note && <span className="text-slate-400">— {f.note}</span>}
          <MetricPills metrics={f.metrics} />
        </p>
      ))}

      {/*
        Nút nằm NGAY DƯỚI phương án nó tác động tới, không gom xuống cuối trang: gom lại thì
        người dùng phải nhớ mình đang nói về việc nào trong năm việc.
      */}
      {/*
        MỘT NÚT CHO MỘT VIỆC (mục 7.9). Trước vòng 5 chỗ này có ba nút — "Đánh dấu đã làm",
        "Ghi quan sát", "Hướng xử lý" — cho cùng một hành động, và người dùng phải nhớ thứ
        tự bấm. Nay gộp thành "Cập nhật kết quả": kết quả · ghi chú · bước tiếp theo.

        Việc TRAO ĐỔI (gặp em, gọi phụ huynh) giữ nút ngắn riêng: nó không có kết quả
        chuyên môn để ghi, chỉ cần xác nhận đã diễn ra.
      */}
      <div className="flex flex-wrap gap-2 mt-1.5">
        {canEdit && openStatus && !waiting && isContactKind(iv.kind) && (
          <button className="btn btn-sm" onClick={() => act.onComplete(iv)}>Xác nhận đã trao đổi</button>
        )}
        {canEdit && openStatus && !waiting && !isContactKind(iv.kind) && (
          <button className="btn btn-sm btn-primary" onClick={() => act.onResult(iv)}>Cập nhật kết quả</button>
        )}
        {waiting && data.viewer?.canApprove && (
          <button className="btn btn-sm" onClick={() => act.onRespond(iv)}>Trả lời đề xuất</button>
        )}
        {waiting && !data.viewer?.canApprove && (
          <span className="text-xs text-slate-500 self-center">
            Đang chờ Quản lý trả lời — chu kỳ thực hiện chưa bắt đầu, thời gian chờ tính cho Quản lý.
          </span>
        )}
      </div>
    </>
  );
}

/**
 * ĐÁNH DẤU MỘT PHƯƠNG ÁN ĐÃ LÀM — mục 7.15.
 *
 * Phương án thuộc case Ý thức/Khác thường chỉ cần đúng hai thứ: đã hoàn thành và NGÀY THỰC
 * HIỆN. Ghi chú tuỳ chọn. Nên hộp thoại này cố tình ngắn — thêm ô là thêm một lý do để
 * người ta để đó mai làm.
 */
function CompleteDialog({ iv, onClose, onDone }: {
  iv: any | null; onClose: () => void; onDone: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [doneOn, setDoneOn] = useState(today);
  const [note, setNote] = useState('');
  const [self, setSelf] = useState(true);
  const [who, setWho] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/complete`, {
        doneOn, note, performerSelf: self, performerName: self ? null : (who.trim() || null),
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', 'Đã ghi nhận');
      onDone(); onClose(); setNote(''); setWho('');
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={iv !== null} onClose={onClose}
      title={iv ? (INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind) : ''}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !doneOn} onClick={submit}>Đã làm xong</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Ngày thực hiện" hint="Ngày việc đó THỰC SỰ diễn ra, không phải hôm nay nhập máy.">
          <input type="date" className="field" value={doneOn} max={today}
            onChange={(e) => setDoneOn(e.target.value)} />
        </Field>
        {/*
          NGƯỜI GHI KHÁC NGƯỜI LÀM. Admin ghi hộ việc bộ phận CS gọi phụ huynh thì người làm
          là CS — mặc định gán cho người đang gõ là ghi sai lịch sử.
        */}
        <Field label="Ai làm việc này?">
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" className={`btn btn-sm ${self ? 'btn-primary' : ''}`}
              onClick={() => setSelf(true)}>Chính tôi</button>
            <button type="button" className={`btn btn-sm ${!self ? 'btn-primary' : ''}`}
              onClick={() => setSelf(false)}>Người khác</button>
            {!self && (
              <input className="field flex-1 min-w-[10rem]" value={who} placeholder="Ví dụ: Chị Hương (CS)"
                onChange={(e) => setWho(e.target.value)} />
            )}
          </div>
        </Field>
        <Field label="Ghi chú" hint="Không bắt buộc.">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: PH nắm được tình hình, hứa nhắc em làm bài buổi tối." />
        </Field>
      </div>
    </Modal>
  );
}

// ==================================================================== hộp thoại

/**
 * CHỐT KẾT QUẢ CẢ CASE — mục 7.14, owner chọn bốn mức bấm nhanh ngày 13/09/2026.
 *
 * Hai câu hỏi, hỏi theo đúng thứ tự người ta nghĩ:
 *   1. Đợt hỗ trợ vừa rồi ăn thua đến đâu?   → bốn mức, bấm một cái
 *   2. Rồi sau đó?                            → kết thúc hẳn, hay kéo dài theo dõi
 *
 * Ghi chú KHÔNG bắt buộc. Bắt viết mỗi lần chốt thì người ta gõ cho xong, và một ô toàn
 * chữ "ok" còn tệ hơn ô trống.
 */
function OutcomeDialog({ open, onClose, caseId, ratio, categories, onDone }: {
  open: boolean; onClose: () => void; caseId: number;
  ratio: boolean; categories: { code: string; label: string }[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [outcome, setOutcome] = useState<string>('improved');
  const [note, setNote] = useState('');
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (decision: 'end' | 'extend') => {
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/outcome`, {
        outcome, note, decision, metrics: metricsPayload(metrics, ratio),
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', decision === 'end'
        ? 'Đã chốt kết thúc case'
        : 'Đã chốt đợt này, case vẫn theo dõi tiếp');
      onDone(); onClose(); setNote(''); setMetrics({});
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chốt kết quả case">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-300 m-0 mb-2">Sau đợt hỗ trợ vừa rồi, em tiến bộ đến đâu?</p>
          <div className="flex flex-wrap gap-2">
            {CASE_OUTCOMES.map((o) => (
              <button key={o} type="button"
                className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`}
                onClick={() => setOutcome(o)}>
                {CASE_OUTCOME_LABEL[o]}
              </button>
            ))}
          </div>
        </div>

        <Field label="Ghi chú" hint="Không bắt buộc — viết khi có điều đáng nói cho người đọc sau.">
          <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Em đã nghe đều hơn, bắt được số và tên riêng. Còn vướng câu hỏi dạng matching." />
        </Field>

        {/*
          GHI CHI TIẾT THEO KỸ NĂNG là TUỲ CHỌN (mục 7.7 [5] Option 2). Mặc định chỉ cần
          một câu ngắn; ai muốn ghi con số mình tự chấm thì mở thêm ô này ra.
        */}
        {categories.length > 0 && (
          <MetricsField ratio={ratio} categories={categories} value={metrics} onChange={setMetrics} />
        )}

        <div>
          <p className="text-sm text-slate-300 m-0 mb-2">Rồi sau đó?</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" disabled={busy} onClick={() => submit('end')}>
              Kết thúc hẳn
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit('extend')}>
              Kéo dài theo dõi + thêm phương án
            </button>
          </div>
          <SectionNote>
            “Kết thúc hẳn” không phải là xoá: MT sau em trượt lại hạng mục này thì chính case
            này mở lại, kèm một mốc tái phát — không sinh case mới.
          </SectionNote>
        </div>
      </div>
    </Modal>
  );
}

function ActionDialog({ open, onClose, caseId, onDone }: {
  open: boolean; onClose: () => void; caseId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState('self_study');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('completed');
  const [performerName, setPerformerName] = useState('');
  const [bySomeoneElse, setBySomeoneElse] = useState(false);
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [followupDue, setFollowupDue] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [busy, setBusy] = useState(false);

  /*
   * Chỉ ĐỀ XUẤT mới gửi duyệt được — việc đã làm rồi thì không còn gì để duyệt.
   * Đổi trạng thái sang "đã xong" thì bỏ luôn ô chọn, không để lại một cờ vô nghĩa.
   */
  const canPropose = status === 'planned';
  /* Nhóm Đề xuất luôn phải có Quản lý trả lời — không hỏi lại một câu đã trả lời sẵn. */
  const alwaysNeedsApproval = isProposalKind(kind);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/interventions`, {
        kind, description, status,
        performerSelf: !bySomeoneElse,
        performerName: bySomeoneElse ? performerName : undefined,
        completedDate: status === 'completed' ? completedDate || undefined : undefined,
        startedDate: startedDate || undefined,
        followupDue: followupDue || undefined,
        needsApproval: alwaysNeedsApproval || (canPropose && needsApproval),
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      onDone(); onClose();
      setDescription(''); setPerformerName(''); setCompletedDate(''); setFollowupDue('');
      toast.push('ok', alwaysNeedsApproval || (canPropose && needsApproval)
        ? 'Đã gửi Quản lý duyệt' : 'Đã ghi lại');
      setNeedsApproval(false);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Phương án hỗ trợ"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {alwaysNeedsApproval || (canPropose && needsApproval) ? 'Gửi duyệt' : 'Lưu'}
          </button>
        </>
      }>
      <div className="space-y-3">
        {/*
          HAI HỌ VIỆC, tách bạch ngay trong ô chọn. Chọn một mục trong "Đề xuất" TỨC LÀ đang
          xin ý kiến Quản lý — nên ô tick "cần duyệt" bên dưới tự ẩn đi, bớt một quyết định.
        */}
        <Field label="Việc gì">
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            <optgroup label="Phương án hỗ trợ — bạn tự làm được">
              {SUPPORT_KINDS.map((k) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k]}</option>
              ))}
            </optgroup>
            <optgroup label="Đề xuất — Quản lý phải trả lời">
              {PROPOSAL_KINDS.map((k) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k]}</option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Mô tả ngắn" hint="Một câu đủ để người khác hiểu đã làm gì.">
          <input className="field" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Trao đổi với em về việc bỏ bài nghe ở nhà" />
        </Field>
        <Field label="Tình trạng">
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="planned">Đã lên kế hoạch</option>
            <option value="started">Đang thực hiện</option>
            <option value="completed">Đã xong</option>
          </select>
        </Field>
        {status === 'completed' && (
          <Field label="Ngày đã làm" required hint="Ghi 'đã xong' thì phải có ngày thực tế, không lấy ngày nhập thay thế.">
            <input type="date" className="field" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </Field>
        )}
        {status === 'started' && (
          <Field label="Ngày bắt đầu">
            <input type="date" className="field" value={startedDate} onChange={(e) => setStartedDate(e.target.value)} />
          </Field>
        )}
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input type="checkbox" className="mt-1" checked={bySomeoneElse}
            onChange={(e) => setBySomeoneElse(e.target.checked)} />
          <span>
            Người khác làm, tôi nhập hộ
            <span className="block text-xs text-slate-500">
              Ví dụ CS gọi phụ huynh. Giữ tên người thực sự làm, không để mặc định thành người nhập.
            </span>
          </span>
        </label>
        {bySomeoneElse && (
          <Field label="Tên người làm" required>
            <input className="field" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
              placeholder="CS Ngọc Diệp" />
          </Field>
        )}
        <Field label="Hẹn xem lại" hint="Bỏ trống nếu chỉ theo dõi — không hẹn thì không bao giờ bị coi là quá hạn.">
          <input type="date" className="field" value={followupDue} onChange={(e) => setFollowupDue(e.target.value)} />
        </Field>
        {/*
          CHÍNH GIÁO VIÊN quyết định phương án của mình có cần Quản lý duyệt hay không.
          Trao đổi với em sau buổi học thì tự làm; xếp tutor hay lùi lịch thi thì phải có
          người quyết. Bắt duyệt hết là biến phần mềm thành cửa xin phép; không duyệt gì thì
          việc tốn tiền lại không ai chịu trách nhiệm.
        */}
        {canPropose && !alwaysNeedsApproval && (
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" className="mt-1" checked={needsApproval}
              onChange={(e) => setNeedsApproval(e.target.checked)} />
            <span>
              Cần Quản lý duyệt trước khi làm
              <span className="block text-xs text-slate-500">
                Quản lý phải trả lời trong 3 ngày (case nặng hoặc gấp) hoặc 7 ngày. Trong lúc
                chờ thì chưa cập nhật kết quả được.
              </span>
            </span>
          </label>
        )}
        {alwaysNeedsApproval && (
          <SectionNote>
            Đây là một ĐỀ XUẤT nên Quản lý luôn phải trả lời — không cần tick thêm gì.
            Hạn trả lời suy từ mức gấp của vấn đề: 7 ngày (bình thường) · 5 ngày (cần chú ý) ·
            3 ngày (gấp).
          </SectionNote>
        )}
        {!canPropose && !alwaysNeedsApproval && (
          <SectionNote>
            Đang ghi một việc ĐÃ làm hoặc ĐANG làm nên không gửi duyệt được. Muốn xin ý kiến
            Quản lý trước thì chọn tình trạng “Đã lên kế hoạch”.
          </SectionNote>
        )}
      </div>
    </Modal>
  );
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ XUẤT.
 *
 * Ba lựa chọn, và chỉ "góp ý" là không kết thúc việc chờ — Quản lý vẫn nợ một câu trả lời,
 * nên đề xuất vẫn nằm trong danh sách việc cho tới khi duyệt hoặc không duyệt.
 * Không duyệt thì BẮT BUỘC ghi lý do: bác một phương án mà không nói vì sao thì giáo viên
 * không biết nên làm gì tiếp.
 */
function ApprovalDialog({ open, onClose, intervention, onDone }: {
  open: boolean; onClose: () => void; intervention: any | null; onDone: () => void;
}) {
  const toast = useToast();
  const [decision, setDecision] = useState<'approved' | 'declined' | 'comment'>('approved');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!intervention) return null;

  const needNote = decision !== 'approved';

  return (
    <Modal open={open} onClose={onClose} title="Trả lời đề xuất"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || (needNote && !note.trim())}
            onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/interventions/${intervention.id}/respond`, { decision, note });
                invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
                onDone(); onClose(); setNote(''); setDecision('approved');
                toast.push('ok', 'Đã trả lời');
              } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
            }}>Gửi</button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-slate-300 m-0">
          {INTERVENTION_KIND_LABEL[intervention.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? intervention.kind}
          {intervention.description && <span className="text-slate-400"> — {intervention.description}</span>}
        </p>
        <Field label="Quyết định">
          <select className="field" value={decision} onChange={(e) => setDecision(e.target.value as any)}>
            <option value="approved">Duyệt — cứ làm</option>
            <option value="declined">Không duyệt</option>
            <option value="comment">Góp ý thêm, chưa quyết</option>
          </select>
        </Field>
        <Field label={decision === 'approved' ? 'Ghi chú' : 'Lý do'} required={needNote}
          hint={decision === 'declined' ? 'Nói rõ vì sao, và nên làm gì thay thế.' : undefined}>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={decision === 'declined' ? 'Lớp đang thiếu giáo viên, tạm xếp tự học có kèm' : 'Đồng ý, ưu tiên Listening trước'} />
        </Field>
        {decision === 'comment' && (
          <SectionNote>
            Góp ý KHÔNG kết thúc việc chờ — đề xuất vẫn nằm trong danh sách việc của bạn cho
            tới khi bạn duyệt hoặc không duyệt.
          </SectionNote>
        )}
      </div>
    </Modal>
  );
}

/**
 * CẬP NHẬT KẾT QUẢ — MỘT PANEL cho cả một chu kỳ xử lý (mục 7.7 [3], 7.9).
 *
 * Gộp ba nút cũ ("Đánh dấu đã làm" · "Ghi quan sát" · "Hướng xử lý") thành một luồng hỏi
 * đúng ba câu, theo đúng thứ tự người ta nghĩ:
 *
 *   1. Đợt vừa rồi kết quả ra sao?
 *   2. Ghi chú (không bắt buộc — bắt viết mỗi lần thì người ta gõ "ok" cho xong)
 *   3. Rồi sao nữa?
 *
 * LUẬT NẰM Ở CÂU 3: kết quả TỐT thì được khép lại hoặc theo dõi thêm; kết quả CHƯA TỐT thì
 * BẮT BUỘC chọn một trong ba đường đi tiếp. Không có đường "ghi nhận rồi thôi" — một kết
 * quả "Kém hơn" mà không ai phải làm gì tiếp là một kết quả sẽ bị quên.
 */
/**
 * ĐIỂM GIÁO VIÊN TỰ CHẤM — ô TUỲ CHỌN, mặc định gấp lại (mục 7.7 [5] Option 2).
 *
 * Mặc định người ta chỉ ghi một câu ngắn, và bắt ai cũng phải nhìn một bảng điểm rỗng mỗi
 * lần cập nhật là cách nhanh nhất khiến họ ngại cập nhật. Ai muốn ghi kỹ thì mở ra.
 *
 * Con số ở đây KHÔNG phải điểm chính thức: nó không ghi đè điểm mock/test, không đổi mức
 * SOS, và trên biểu đồ tiến bộ nó là một ký hiệu riêng đứng rời.
 */
function MetricsField({ ratio, categories, value, onChange }: {
  ratio: boolean;
  categories: { code: string; label: string }[];
  value: Record<string, { score: string; total: string }>;
  onChange: (v: Record<string, { score: string; total: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (code: string, part: 'score' | 'total', v: string) => {
    const cur = value[code] ?? { score: '', total: '' };
    onChange({ ...value, [code]: { ...cur, [part]: v } });
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        + Ghi thêm điểm bạn tự chấm (không bắt buộc)
      </button>
    );
  }
  return (
    <div className="surface-2 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label m-0">Điểm bạn tự chấm</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setOpen(false); onChange({}); }}>
          Bỏ phần này
        </button>
      </div>
      <div className="space-y-1.5">
        {categories.map((c) => (
          <div key={c.code} className="flex items-center gap-2">
            <span className="text-xs text-slate-300 w-24 shrink-0">{c.label}</span>
            <input className="field max-w-[6rem]" type="number" inputMode="decimal"
              step={ratio ? 1 : 0.5} min={0} max={ratio ? undefined : 9}
              placeholder={ratio ? 'đạt' : 'band'}
              value={value[c.code]?.score ?? ''} onChange={(e) => set(c.code, 'score', e.target.value)} />
            {ratio && (
              <>
                <span className="text-slate-500">/</span>
                <input className="field max-w-[6rem]" type="number" min={1} placeholder="tổng"
                  value={value[c.code]?.total ?? ''} onChange={(e) => set(c.code, 'total', e.target.value)} />
              </>
            )}
          </div>
        ))}
      </div>
      <SectionNote>
        Đây là ĐÁNH GIÁ CỦA BẠN, để riêng với điểm entrance/mock/test. Nó không ghi đè điểm
        chính thức và không làm đổi mức SOS.
      </SectionNote>
    </div>
  );
}

/** Đổi các ô đã nhập thành danh sách gửi lên máy chủ; ô để trống thì bỏ qua. */
function metricsPayload(
  v: Record<string, { score: string; total: string }>,
  ratio: boolean,
) {
  const out = Object.entries(v)
    .filter(([, m]) => m.score !== '' && m.score !== undefined)
    .map(([skill, m]) => ({
      skill,
      score: Number(m.score),
      total: ratio && m.total !== '' ? Number(m.total) : null,
    }));
  return out.length ? out : undefined;
}

function ResultDialog({ iv, track, ratio, categories, onClose, onDone }: {
  iv: any | null; track: string;
  ratio: boolean; categories: { code: string; label: string }[];
  onClose: () => void; onDone: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [observedOn, setObservedOn] = useState(today);
  const [newKind, setNewKind] = useState('tutor');
  const [newDesc, setNewDesc] = useState('');
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const [busy, setBusy] = useState(false);

  const outcomes = outcomesFor(track);
  const steps = outcome ? nextStepsFor(outcome) : [];

  const close = () => {
    onClose(); setOutcome(''); setNote(''); setNextStep(''); setNewDesc(''); setMetrics({});
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/result`, {
        outcome, note: note || null, nextStep, observedOn: observedOn || undefined,
        newPlan: nextStep === 'propose' ? { kind: newKind, description: newDesc || null } : null,
        metrics: metricsPayload(metrics, ratio),
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', 'Đã cập nhật kết quả');
      onDone(); close();
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };

  return (
    <Modal
      open={iv !== null} onClose={close} width="max-w-lg"
      title="Cập nhật kết quả"
      footer={<>
        <button className="btn" onClick={close} disabled={busy}>Huỷ</button>
        <button className="btn btn-primary" disabled={busy || !outcome || !nextStep} onClick={submit}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
      </>}
    >
      {iv && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 m-0">
            {INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}
            {iv.description ? ` · ${iv.description}` : ''}
            {iv.cycleNo > 1 ? ` · chu kỳ ${iv.cycleNo}` : ''}
            {iv.actionDue ? ` · hạn ${fmtDate(iv.actionDue)}` : ''}
          </p>

          <Field label="1. Kết quả sau chu kỳ vừa rồi">
            <div className="flex flex-wrap gap-1.5">
              {outcomes.map((o) => (
                <button key={o} type="button"
                  className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`}
                  onClick={() => { setOutcome(o); setNextStep(''); }}>
                  {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(track, o)}
                </button>
              ))}
            </div>
          </Field>

          <Field label="2. Ghi chú" hint="Không bắt buộc.">
            <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: em có làm bài nhưng chưa đều, còn sai dạng T/F/NG." />
          </Field>

          <Field label="Ngày cập nhật">
            <input type="date" className="field" value={observedOn} max={today}
              onChange={(e) => setObservedOn(e.target.value)} />
          </Field>

          {track === 'academic' && categories.length > 0 && (
            <MetricsField ratio={ratio} categories={categories} value={metrics} onChange={setMetrics} />
          )}

          <Field
            label="3. Bước tiếp theo"
            hint={outcome && !['improved', 'partial'].includes(outcome)
              ? 'Kết quả chưa tốt thì BẮT BUỘC chọn một đường đi tiếp — không có đường "ghi nhận rồi thôi".'
              : 'Chọn khép lại phương án, hoặc mở thêm một chu kỳ theo dõi.'}
          >
            {!outcome ? (
              <p className="text-xs text-slate-500 m-0">Chọn kết quả ở trên trước.</p>
            ) : (
              <div className="space-y-1.5">
                {steps.map((st) => (
                  <button key={st} type="button"
                    className={`btn btn-sm w-full justify-start text-left ${nextStep === st ? 'btn-primary' : ''}`}
                    onClick={() => setNextStep(st)}>
                    <span className="flex flex-col items-start">
                      <span>{NEXT_STEP_LABEL[st]}</span>
                      <span className="text-[11px] opacity-70">{NEXT_STEP_HINT[st]}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Field>

          {nextStep === 'propose' && (
            <div className="surface-2 rounded-lg p-3 space-y-2">
              <Field label="Phương án mới">
                <select className="field w-full" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
                  {INTERVENTION_KINDS.map((k) => (
                    <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mô tả">
                <input className="field w-full" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ví dụ: học tutor Reading hai buổi mỗi tuần" />
              </Field>
              <SectionNote>
                Phương án cũ được khép lại với lý do <strong>“Được thay thế”</strong> — KHÔNG đánh dấu là
                đã hoàn thành thành công, vì nó không thành công, đó là cả lý do phải thay.
              </SectionNote>
            </div>
          )}

          {nextStep === 'ask_manager' && (
            <SectionNote>
              Phương án chuyển sang <strong>chờ Quản lý</strong>. Chu kỳ thực hiện dừng ở đây và chỉ chạy
              lại khi có quyết định — thời gian chờ tính cho Quản lý, không tính là bạn đã có thời gian làm.
            </SectionNote>
          )}

          {(nextStep === 'monitor' || nextStep === 'continue') && (
            <SectionNote>{cycleDeadlineHint(track)}</SectionNote>
          )}
        </div>
      )}
    </Modal>
  );
}

function DispositionDialog({ open, onClose, caseId, canClose, current, onDone }: {
  open: boolean; onClose: () => void; caseId: number; canClose: boolean;
  current: string | null; onDone: () => void;
}) {
  const toast = useToast();
  const [disposition, setDisposition] = useState(current ?? 'monitor');
  const [note, setNote] = useState('');
  const [alsoClose, setAlsoClose] = useState(false);
  const [busy, setBusy] = useState(false);

  // "Chỉ theo dõi" nghĩa là VẪN CÒN MỞ. Cho đóng ở đây là tự mâu thuẫn.
  const closable = canClose && disposition !== 'monitor';

  return (
    <Modal open={open} onClose={onClose} title="Hướng xử lý"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api.patch(`/cases/${caseId}/disposition`, {
                disposition, note, status: alsoClose && closable ? 'done' : undefined,
              });
              invalidate('/cases'); invalidate('/students'); invalidate('/overview');
              onDone(); onClose(); toast.push('ok', 'Đã lưu');
            } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
          }}>Lưu</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Hướng xử lý">
          <select className="field" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            {DISPOSITIONS.map((d) => <option key={d} value={d}>{DISPOSITION_LABEL[d]}</option>)}
          </select>
        </Field>
        <Field label="Ghi chú ngắn">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Đã trao đổi, em ổn định lại" />
        </Field>
        {closable && (
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" className="mt-1" checked={alsoClose} onChange={(e) => setAlsoClose(e.target.checked)} />
            <span>Kết thúc theo dõi luôn</span>
          </label>
        )}
        {disposition === 'monitor' && (
          <SectionNote>“Chỉ theo dõi” nghĩa là vấn đề VẪN CÒN MỞ, nên không kết thúc theo dõi được.</SectionNote>
        )}
      </div>
    </Modal>
  );
}

export { skillLabel };
