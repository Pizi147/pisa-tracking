import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from './ui.tsx';
import { Modal } from './Drawer.tsx';
import { caseStatusLabel, caseStatusTone, fmtBand, fmtDate, skillLabel, sosLabel, sosTone } from '../lib/format.ts';
import {
  CASE_OUTCOMES, CASE_OUTCOME_LABEL,
  DISPOSITIONS, DISPOSITION_LABEL, FOLLOWUP_OUTCOMES, FOLLOWUP_OUTCOME_LABEL,
  INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL, PROPOSAL_KINDS, SUPPORT_KINDS,
  isProposalKind,
  URGENCY_LABEL,
} from '@shared/domain.ts';

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
  const [addFollowup, setAddFollowup] = useState<number | 'case' | null>(null);
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
    onFollowup: setAddFollowup,
    onRespond: setRespondTo,
    onComplete: setCompleting,
  });

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════════ đầu case */}
      <section>
        <h3 className="text-base font-semibold text-slate-100 m-0 flex flex-wrap items-center gap-2">
          {data.title ?? data.headline}
          <Pill tone={caseStatusTone(data.status)}>{caseStatusLabel(data.status)}</Pill>
          {data.sosLevel !== null && data.status !== 'done' && (
            <Pill tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Pill>
          )}
          {data.urgency && data.urgency !== 'normal' && data.status !== 'done' && (
            <Pill tone={data.urgency === 'urgent' ? 'danger' : 'warn'}>
              {URGENCY_LABEL[data.urgency as keyof typeof URGENCY_LABEL]}
            </Pill>
          )}
          {data.parallel && <Pill tone="muted">Case riêng, song song</Pill>}
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
            {primary && <Pill tone="info" title={primary.observation ?? undefined}>{primary.label}</Pill>}
            {secondary.map((i) => <Pill key={i.id} tone="neutral" title={i.observation ?? undefined}>{i.label}</Pill>)}
            {context.map((i) => (
              <Pill key={i.id} tone="muted" title={i.observation ?? undefined}>Bối cảnh: {i.label}</Pill>
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
        {data.viewer.canEdit && data.status !== 'done' && (
          <button className="btn btn-sm btn-ghost mt-2" onClick={() => setAddFollowup('case')}>
            + Ghi quan sát mà không gắn với việc nào
          </button>
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
              <button className="btn btn-sm btn-primary" disabled={!data.canFinish || !data.viewer.canClose}
                title={!data.viewer.canClose
                  ? 'Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới chốt được kết quả case.'
                  : !data.canFinish ? 'Còn phương án chưa có kết quả.' : undefined}
                onClick={() => setOutcome(true)}>
                Chốt kết quả case
              </button>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => setClose(true)}>
              {data.status === 'done' ? 'Đổi hướng xử lý' : 'Chọn hướng xử lý'}
            </button>
          </div>
        )}
        {/*
          Nói RÕ VÌ SAO nút mờ, ngay tại chỗ. Một cái nút mờ không giải thích là cách chắc
          chắn nhất để người dùng nghĩ phần mềm hỏng.
        */}
        {data.viewer.canEdit && data.status !== 'done' && !data.canFinish && (
          <SectionNote>
            Chưa chốt được kết quả chung vì còn phương án chưa có kết quả. Cập nhật xong từng
            phương án ở dòng thời gian bên trên rồi nút sẽ sáng lên.
          </SectionNote>
        )}
        {!data.viewer.canClose && data.status !== 'done' && (
          <SectionNote>
            Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới chốt kết quả được. Bạn vẫn ghi được
            việc đã làm và kết quả xem lại.
          </SectionNote>
        )}
      </section>

      <OutcomeDialog open={outcome} onClose={() => setOutcome(false)} caseId={caseId} onDone={reload} />
      <CompleteDialog iv={completing} onClose={() => setCompleting(null)} onDone={reload} />
      <ActionDialog open={addAction} onClose={() => setAddAction(false)} caseId={caseId} onDone={reload} />
      <ApprovalDialog open={respondTo !== null} onClose={() => setRespondTo(null)}
        intervention={respondTo} onDone={reload} />
      <FollowupDialog open={addFollowup !== null} onClose={() => setAddFollowup(null)} caseId={caseId}
        interventionId={typeof addFollowup === 'number' ? addFollowup : null} onDone={reload} />
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
  onFollowup: (id: number | 'case') => void;
  onRespond: (iv: any) => void;
  onComplete: (iv: any) => void;
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
            <Pill tone={m.expectation !== null && m.band < m.expectation ? 'danger' : 'ok'}>
              {fmtBand(m.band)}{m.expectation !== null ? ` · kỳ vọng ${fmtBand(m.expectation)}` : ''}
            </Pill>
          )}
          {m.sosLevel ? <Pill tone={sosTone(m.sosLevel)}>{sosLabel(m.sosLevel)}</Pill> : null}
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
          <Pill tone={iv.status === 'completed' ? 'ok' : iv.status === 'cancelled' ? 'muted' : 'info'}>
            {INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}
          </Pill>
          {iv.approvalState === 'pending' && (
            <Pill tone="warn">Chờ Quản lý duyệt{iv.approvalDue ? ` · hạn ${fmtDate(iv.approvalDue)}` : ''}</Pill>
          )}
          {iv.approvalState === 'approved' && <Pill tone="ok">Đã duyệt</Pill>}
          {iv.approvalState === 'declined' && <Pill tone="muted">Không duyệt</Pill>}
          {iv.overdue && <Pill tone="warn">Quá hạn cập nhật kết quả</Pill>}
        </>
      ),
      body: <InterventionBody iv={iv} followups={mine} data={data} act={act} />,
    });
  }

  for (const f of (data.followups ?? []).filter((x: any) => !x.interventionId)) {
    items.push({
      key: `f${f.id}`, on: f.observedOn, attemptNo: null, rank: 2,
      dotFill: 'var(--surface)', dotEdge: 'var(--line-strong)',
      title: 'Theo dõi chung',
      badge: f.outcome
        ? <Pill tone="neutral">{FOLLOWUP_OUTCOME_LABEL[f.outcome as keyof typeof FOLLOWUP_OUTCOME_LABEL] ?? f.outcome}</Pill>
        : null,
      body: f.note ? <p className="text-xs text-slate-400 mt-1 mb-0">{f.note}</p> : null,
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
      {followups.map((f) => (
        <p key={f.id} className="text-xs mt-1 mb-0 pl-3 border-l" style={{ borderColor: 'var(--accent-line)' }}>
          <span className="text-slate-300">
            {fmtDate(f.observedOn)} · {FOLLOWUP_OUTCOME_LABEL[f.outcome as keyof typeof FOLLOWUP_OUTCOME_LABEL] ?? f.outcome}
            {f.observerName && ` · ${f.observerName}`}
          </span>
          {f.note && <span className="text-slate-400"> — {f.note}</span>}
        </p>
      ))}

      {/*
        Nút nằm NGAY DƯỚI phương án nó tác động tới, không gom xuống cuối trang: gom lại thì
        người dùng phải nhớ mình đang nói về việc nào trong năm việc.
      */}
      <div className="flex flex-wrap gap-2 mt-1.5">
        {canEdit && openStatus && !waiting && (
          <button className="btn btn-sm" onClick={() => act.onComplete(iv)}>Đánh dấu đã làm</button>
        )}
        {canEdit && !waiting && iv.status !== 'cancelled' && (
          <button className="btn btn-sm btn-ghost" onClick={() => act.onFollowup(iv.id)}>+ Cập nhật kết quả</button>
        )}
        {waiting && data.viewer?.canApprove && (
          <button className="btn btn-sm" onClick={() => act.onRespond(iv)}>Trả lời đề xuất</button>
        )}
        {waiting && !data.viewer?.canApprove && (
          <span className="text-xs text-slate-500 self-center">
            Đang chờ Quản lý trả lời — làm xong rồi mới ghi kết quả được.
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
function OutcomeDialog({ open, onClose, caseId, onDone }: {
  open: boolean; onClose: () => void; caseId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [outcome, setOutcome] = useState<string>('improved');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (decision: 'end' | 'extend') => {
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/outcome`, { outcome, note, decision });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', decision === 'end'
        ? 'Đã chốt kết thúc case'
        : 'Đã chốt đợt này, case vẫn theo dõi tiếp');
      onDone(); onClose(); setNote('');
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

function FollowupDialog({ open, onClose, caseId, interventionId, onDone }: {
  open: boolean; onClose: () => void; caseId: number; interventionId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const [outcome, setOutcome] = useState('partial');
  const [note, setNote] = useState('');
  const [observedOn, setObservedOn] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Xem lại sau khi hỗ trợ"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api.post(`/cases/${caseId}/followups`, {
                interventionId: interventionId ?? undefined, outcome, note, observedOn: observedOn || undefined,
              });
              invalidate('/cases'); invalidate('/students');
              onDone(); onClose(); setNote('');
              toast.push('ok', 'Đã ghi lại');
            } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
          }}>Lưu</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Quan sát được gì">
          <select className="field" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {FOLLOWUP_OUTCOMES.map((o) => <option key={o} value={o}>{FOLLOWUP_OUTCOME_LABEL[o]}</option>)}
          </select>
        </Field>
        <Field label="Ghi chú">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Đã nộp bài đủ hai tuần liên tiếp" />
        </Field>
        <Field label="Ngày quan sát">
          <input type="date" className="field" value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
        </Field>
        <SectionNote>
          Đây là QUAN SÁT SAU HỖ TRỢ, không phải khẳng định việc hỗ trợ đã tạo ra thay đổi.
          Điểm lên cũng không tự kết thúc theo dõi.
        </SectionNote>
      </div>
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
