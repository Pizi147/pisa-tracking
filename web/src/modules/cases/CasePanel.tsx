import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Alert, Card, Empty, ErrorState, Field, Info, Level, Outcome, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { CHUA_CO_PHUONG_AN, GOI_Y_THEM_PHUONG_AN } from '../../ui/chu.ts';
import { caseStatusLabel, caseStatusTone, fmtBand, fmtDate, skillLabel, sosLabel, sosTone } from '../../lib/format.ts';
import {
  CASE_CATEGORY_LABEL, CASE_OUTCOMES, CASE_OUTCOME_LABEL, FOLLOWUP_OUTCOMES,
  INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
  NEXT_STEP_HINT, NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL, RESULT_MODES, RESULT_MODE_LABEL,
  canEndWithOutcome, componentsAreCounts, componentsFor, interventionKindsFor,
  isProposalKind, outcomeLabelFor, stepsForMode,
  type NextStep,
} from '@shared/domain/index.ts';

/**
 * MỘT VẤN ĐỀ HỌC VỤ, kể theo bốn câu hỏi người đọc thực sự cần:
 *
 *   1. Vì sao đang theo dõi?   → tóm tắt, ai phát hiện, phân loại, bằng chứng
 *   2. Đã áp dụng phương án nào? → các tác động, ai thực hiện, ngày nào
 *   3. Sau đó quan sát được gì?→ các lần xem lại
 *   4. Bước tiếp theo là gì?   → hướng xử lý, hẹn xem lại
 *
 * Cùng một khung này dùng cho MỌI lối vào — từ điểm số, từ hồ sơ học viên, từ màn quản
 * lý — vì tất cả đều đang nói về đúng một bản ghi.
 */

type CaseDetail = {
  id: number; originKind: string;
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
  /** Các mốc trong vòng đời case. Giao diện xếp MỚI NHẤT LÊN ĐẦU (mục 4.3). */
  milestones: any[];
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  viewer: { canEdit: boolean; canClose: boolean; canApprove: boolean };
};

export function CasePanel({ caseId, compact = false, hideHeader = false, onChanged }: {
  caseId: number; compact?: boolean;
  /**
   * Báo cho khối bên ngoài biết case này vừa đổi, để bảng tóm tắt ở trên nạp lại.
   * Không có nó thì bấm "Hoàn thành case" xong, dòng kỹ năng phía trên vẫn ghi "đang xử lý".
   */
  onChanged?: () => void;
  /**
   * Bỏ phần đầu case khi panel nằm TRONG một khối đã có sẵn tên và trạng thái ở trên
   * (danh sách case của một em). Hiện hai lần cùng một dòng tiêu đề chỉ làm người đọc
   * tưởng mình đang xem hai case khác nhau.
   */
  hideHeader?: boolean;
}) {
  const { session } = useSession();
  const todayIso = session?.demoDate ?? '';
  const { data, loading, error, reload: reloadOnly } = useApi<CaseDetail>(`/cases/${caseId}`);
  /* Nạp lại case NÀY, rồi báo ra ngoài để bảng tóm tắt ở trên cũng nói đúng. */
  const reload = () => { reloadOnly(); onChanged?.(); };
  const [addAction, setAddAction] = useState(false);
  const [resultFor, setResultFor] = useState<any | null>(null);
  const [respondTo, setRespondTo] = useState<any | null>(null);
  const [outcome, setOutcome] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reloadOnly} />;
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
    onResult: setResultFor,
  });

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════════ đầu case */}
      <section>
        {/*
          KHỐI CASE Ở HỒ SƠ ĐÃ CÓ TÊN VÀ TRẠNG THÁI trên đầu khối rồi, nên ở đó panel này bỏ
          phần nhận diện đi. Hiện hai lần liền nhau cùng một dòng tiêu đề khiến người đọc
          tưởng mình đang xem hai case khác nhau xếp chồng.
        */}
        {!hideHeader && (
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
          {/*
            KHÔNG CÓ BADGE "GẤP" Ở ĐÂY NỮA (mục 6.1).
            Mức độ ưu tiên là một con số được suy ra lúc case sinh, và nó không đổi theo việc thực
            tế đang chạy nhanh hay chậm. Đặt nó cạnh tên case thì mọi case SOS 3 đều đỏ rực
            ngay từ đầu, kể cả những case đang được xử lý đúng hạn — nên cái đỏ ấy mất nghĩa.
            Cái người đọc cần là QUÁ HẠN THẬT, và nó nằm ở đúng phương án đang trễ, bên dưới.
          */}
          {data.parallel && <Info>Case riêng, song song</Info>}
        </h3>
        )}

        {!hideHeader && (
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
        )}

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
          <Empty title={CHUA_CO_PHUONG_AN} hint={GOI_Y_THEM_PHUONG_AN} />
        ) : (
          <ol className="list-none p-0 m-0 relative pl-6"
              style={{ borderLeft: '2px solid var(--line-strong)', marginLeft: '5px' }}>
            {timeline.map((ev) => (
              <li key={ev.key} className="relative pb-4 last:pb-1">
                {/* Chấm mốc: đặc = chuyện xảy ra với em, rỗng = việc mình làm. */}
                <span className="absolute rounded-full"
                      style={{
                        left: '-31px', top: '4px', width: '12px', height: '12px',
                        background: ev.dotFill, border: `2px solid ${ev.dotEdge}`,
                      }} />
                <span className="text-[11px] text-slate-500 tabular-nums tracking-wide">
                  {fmtDate(ev.on)}{ev.attemptNo ? ` · MT${ev.attemptNo}` : ''}
                </span>
                {ev.card ? (
                  <div className="rounded-lg border mt-1 px-3 py-2.5 surface-2"
                       style={{ borderColor: 'var(--line)' }}>
                    <p className="text-sm font-semibold text-slate-100 m-0 flex flex-wrap items-center gap-2">
                      {ev.title}
                      {ev.badge}
                    </p>
                    {ev.body}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-100 mt-0.5 mb-0 flex flex-wrap items-center gap-2">
                      {ev.title}
                      {ev.badge}
                    </p>
                    {ev.body}
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ══════════════════════════════════════════════════ bước tiếp theo */}
      <section className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
        {/* Case đã hoàn thành mà không còn hướng xử lý (outcome rỗng) — vẫn là đã kết luận, không phải "đang xử lý". */}
        {data.outcome || data.status === 'done' ? (
          <p className="text-sm text-slate-100 m-0">
            Đã kết luận{data.outcomeLabel && <>: <strong>{data.outcomeLabel}</strong></>}
            {data.outcomeNote && <span className="text-slate-400"> — {data.outcomeNote}</span>}
          </p>
        ) : (
          /*
            NÓI ĐÚNG CÁI ĐANG THIẾU. Câu cũ là "chưa có phương án hỗ trợ", nhưng khối này nói
            về KẾT LUẬN CHUNG của case — nó hiện ngay cả khi case đã có hai phương án đang
            chạy ở trên, và người đọc thì thấy hai việc rành rành rồi lại đọc "chưa có".
          */
          <p className="text-sm text-slate-400 m-0">
            {(data.interventions?.length ?? 0) === 0
              ? `${CHUA_CO_PHUONG_AN}.`
              : 'Case đang xử lý, chưa kết luận.'}
          </p>
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

      {/* BẰNG CHỨNG CỦA CASE (CASE-04, PR-N) — cùng khối với thẻ case ở hồ sơ học viên. */}
      <BangChung ownerType="sos_case" ownerId={caseId} canEdit={data.viewer.canEdit} tieuDe="Bằng chứng của case" />

      <OutcomeDialog open={outcome} onClose={() => setOutcome(false)} caseId={caseId}
        category={data.category} categoryLabel={data.categoryLabel}
        ratio={!!data.ratio} onDone={reload} />
      <ActionDialog open={addAction} onClose={() => setAddAction(false)} caseId={caseId} onDone={reload} />
      <ApprovalDialog open={respondTo !== null} onClose={() => setRespondTo(null)}
        intervention={respondTo} onDone={reload} />
      <ResultDialog iv={resultFor}
        onClose={() => setResultFor(null)} onDone={reload} />
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
  /**
   * PHƯƠNG ÁN ĐƯỢC ĐÓNG KHUNG, MỐC THÌ KHÔNG.
   *
   * Một phương án là một VẬT có nhiều phần — mô tả, người làm, hạn, các chu kỳ kết quả, và
   * một cái nút. Không có khung thì các phần ấy trôi lẫn vào mốc đứng ngay dưới, và người
   * đọc phải tự đoán câu nào thuộc việc nào. Mốc thì ngược lại: nó là một câu, đóng khung
   * chỉ làm nó nặng bằng một việc phải làm trong khi nó không phải.
   */
  card?: boolean;
  /** Thứ tự phụ trong cùng một ngày: chuyện xảy ra trước, việc mình làm sau. */
  rank: number;
};

const MILESTONE_TITLE: Record<string, string> = {
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
  /** "Cập nhật kết quả" — gộp ba nút cũ thành một (mục 7.9). */
  onResult: (iv: any) => void;
};

function buildTimeline(data: any, act: TimelineActions): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const m of data.milestones ?? []) {
    /*
     * BỎ NODE "MỞ CASE" (mục 7.6). Ngày mở và người tạo đã nằm ngay đầu case; lặp lại thành
     * một mốc trong dòng thời gian chỉ đẩy mọi thứ khác xuống một dòng mà không thêm gì.
     * Lọc ở đây chứ không xoá dữ liệu: case cũ trong máy vẫn giữ mốc đó, và trên HÀNH TRÌNH
     * TOÀN HỌC VIÊN thì "phát sinh case" vẫn là một mốc đáng kể.
     */
    if (m.kind === 'opened') continue;
    const bad = m.kind === 'repeat' || m.kind === 'recurrence';
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
      key: `i${iv.id}`, on, attemptNo: null, rank: 1, card: true,
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
            {outcomeLabelFor(f.outcome)}
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

  /*
   * ĐANG CHỜ GÌ — mốc rỗng ruột, chỉ có khi case còn mở. Không có nó thì dòng thời gian
   * cụt lủn và người đọc không biết bước tiếp theo là chờ ai.
   */
  if (data.status !== 'done' && data.followUntil) {
    items.push({
      key: 'wait', on: data.followUntil, attemptNo: null, rank: 9,
      dotFill: 'var(--bg)', dotEdge: 'var(--line-strong)',
      title: <span className="text-slate-400 font-normal">Đang chờ kết quả — hạn báo {fmtDate(data.followUntil)}</span>,
      badge: null, body: null,
    });
  }

  /*
   * MỚI NHẤT LÊN ĐẦU (chủ sản phẩm chốt 17/09/2026), và mục 4.3 nói cùng một điều: phương
   * án hiện tại và cập nhật mới nhất đứng TRÊN những gì đã xong, lịch sử cũ thu gọn ở dưới.
   *
   * Người mở một case đang chạy hỏi "giờ đang thế nào", không hỏi "ba tháng trước bắt đầu ra
   * sao". Xếp cũ trước thì câu trả lời nằm ở cuối, và với case kéo dài thì nó nằm sau mười
   * lăm dòng không ai đọc.
   */
  items.sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '') || b.rank - a.rank || b.key.localeCompare(a.key));
  return items;
}

/** Phần thân của một phương án trong dòng thời gian: ai làm, khi nào, và kết quả ra sao. */
/**
 * ĐIỂM GIÁO VIÊN TỰ CHẤM hiện ngay tại dòng cập nhật sinh ra nó, và LUÔN CÓ CHỮ "cô chấm"
 * đi kèm. Một con số 6.5 đứng trơ trong lịch sử case sẽ bị đọc nhầm thành điểm mock trong
 * vòng vài tuần — nhãn đó là thứ duy nhất ngăn chuyện đó.
 */
function MetricPills({ metrics }: {
  metrics?: { skill: string; component?: string | null; score: number; total: number | null }[] | null;
}) {
  if (!metrics?.length) return null;
  return (
    <>
      {metrics.map((m) => (
        <Info key={`${m.skill}:${m.component ?? ''}`}>
          {/* Có thành phần thì nói thẳng thành phần — "cô chấm Listening 6.0" và "Section 3
              đạt 5/10" là hai câu khác nhau, gộp lại thì không ai đọc ra. */}
          cô chấm {m.component
            ?? (CASE_CATEGORY_LABEL[m.skill as keyof typeof CASE_CATEGORY_LABEL] ?? m.skill)}{' '}
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
        {iv.performer ? `Người thực hiện: ${iv.performer}` : 'Chưa có người thực hiện'}
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
        MỘT KHỐI CHO MỖI CHU KỲ ĐÃ KHÉP, KHÔNG PHẢI MỘT DÒNG NHỒI BẢY THỨ.
        
        Bản trước xếp ngày · chu kỳ · kết quả · bước tiếp · "cập nhật trễ" · người ghi · ghi
        chú vào cùng một dòng chảy chữ. Ở màn hẹp nó xuống dòng ở chỗ ngẫu nhiên, và câu ghi
        chú — phần duy nhất do người thật viết — bị đẩy thành cái đuôi sau một dấu gạch.
        
        Nay mỗi chu kỳ là một khối ba tầng: NGÀY và KẾT QUẢ ở tầng trên, BƯỚC TIẾP THEO ở
        tầng giữa, CÂU CỦA NGƯỜI DẠY đứng riêng một tầng và được đọc như một câu.
        
        Màu và dấu theo bảng ở mục 7.10 — trạng thái và KẾT QUẢ là hai thông tin khác nhau,
        nên một phương án "đã hoàn thành" với kết quả "Kém hơn" vẫn hiện màu đỏ. Tô xanh mọi
        thứ đã xong là nói dối.
      */}
      {followups.length > 0 && (
        <ul className="list-none p-0 m-0 mt-2 space-y-1.5">
          {followups.map((f) => (
            <li key={f.id} className="pl-2.5 border-l" style={{ borderColor: 'var(--accent-line)' }}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {fmtDate(f.observedOn)}{f.cycleNo ? ` · chu kỳ ${f.cycleNo}` : ''}
                </span>
                <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>
                  {outcomeLabelFor(f.outcome)}
                </Outcome>
                {f.late && <Alert tone="warn">cập nhật trễ</Alert>}
              </div>
              {(f.nextStep || f.observerName) && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {f.nextStep && <>→ {NEXT_STEP_LABEL[f.nextStep as keyof typeof NEXT_STEP_LABEL] ?? f.nextStep}</>}
                  {f.nextStep && f.observerName && ' · '}
                  {f.observerName && <>{f.observerName} ghi</>}
                </div>
              )}
              {/* CÂU CỦA NGƯỜI DẠY đứng riêng — đó là phần duy nhất máy không viết được. */}
              {f.note && <p className="text-xs text-slate-300 mt-1 mb-0 leading-relaxed">{f.note}</p>}
              {f.metrics?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1"><MetricPills metrics={f.metrics} /></div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/*
        Nút nằm NGAY DƯỚI phương án nó tác động tới, không gom xuống cuối trang: gom lại thì
        người dùng phải nhớ mình đang nói về việc nào trong năm việc.
      */}
      {/*
        MỘT NÚT CHO MỘT VIỆC (mục 7.9). Trước vòng 5 chỗ này có ba nút — "Đánh dấu đã làm",
        "Ghi quan sát", "Hướng xử lý" — cho cùng một hành động, và người dùng phải nhớ thứ
        tự bấm. Nay gộp thành "Cập nhật kết quả": kết quả · ghi chú · bước tiếp theo.
        (Trước 21/09/2026 việc trao đổi của case Ý thức có nút ngắn riêng — Ý thức không còn là case.)
      */}
      <div className="flex flex-wrap gap-2 mt-1.5">
        {canEdit && openStatus && !waiting && (
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

// ==================================================================== hộp thoại

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL (mục 9.3).
 *
 * Trước vòng 7 khối này có hai nút ra: "Kết thúc hẳn" và "Kéo dài theo dõi + thêm phương
 * án". Cái thứ hai không đóng gì cả — nó chỉ ghi một dòng rồi để case mở tiếp — nên người
 * dùng bấm "chốt kết quả" xong vẫn thấy case nằm nguyên trong danh sách và tưởng đã hỏng.
 * Việc "làm tiếp một tuần nữa" nay nằm đúng chỗ của nó: tab "Tiếp tục theo dõi" của từng
 * phương án.
 *
 * Ba câu hỏi, đúng thứ tự người ta nghĩ:
 *   1. Sau cả đợt, em tiến bộ đến đâu?   → bốn mức, bấm một cái
 *   2. Kết luận là gì?                    → BẮT BUỘC, đây là thứ người đọc hồ sơ cần
 *   3. Xong ngày nào?                     → ngày thật, không nhận ngày mai
 *
 * Ghi chú từ nay BẮT BUỘC. Bốn cái nhãn "tiến bộ đến đâu" không nói được đã làm gì cho em
 * và vì sao dừng ở đây; ba tháng sau chính người viết cũng không đọc lại được.
 */
export function OutcomeDialog({ open, onClose, caseId, category, categoryLabel, ratio, onDone }: {
  open: boolean; onClose: () => void; caseId: number;
  category: string | null; categoryLabel: string | null;
  ratio: boolean;
  onDone: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [outcome, setOutcome] = useState<string>('improved');
  const [note, setNote] = useState('');
  const [closedOn, setClosedOn] = useState(today);
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const [busy, setBusy] = useState(false);

  const components = componentsFor(category, ratio ? 'ratio' : 'band');
  const counts = componentsAreCounts(category);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/outcome`, {
        outcome, note, closedOn: closedOn || undefined,
        metrics: componentsPayload(category, metrics, counts),
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', 'Đã hoàn thành case');
      onDone(); onClose(); setNote(''); setMetrics({});
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hoàn thành case">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-300 m-0 mb-2">Sau cả đợt hỗ trợ, em tiến bộ đến đâu?</p>
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

        <Field label="Kết luận" hint="Bắt buộc — đã làm gì cho em, kết quả ra sao, vì sao dừng ở đây.">
          <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Em đã nghe đều hơn, bắt được số và tên riêng. Còn vướng câu hỏi dạng matching." />
        </Field>

        <Field label="Ngày hoàn thành" hint="Ngày thật đã kết luận. Không nhận ngày ở tương lai.">
          <input className="field max-w-[12rem]" type="date" value={closedOn} max={today}
            onChange={(e) => setClosedOn(e.target.value)} />
        </Field>

        {/*
          ĐÁNH GIÁ CHI TIẾT là TUỲ CHỌN và CHỈ ĐÚNG KỸ NĂNG CỦA CASE (mục 9.3). Bản cũ mời
          chấm cả năm kỹ năng kể cả khi case chỉ về Listening — bốn ô trống vô nghĩa, hoặc
          bốn con số điền cho đủ form.
        */}
        {components.length > 0 && (
          <ComponentsField label={categoryLabel ?? ''} components={components} counts={counts}
            value={metrics} onChange={setMetrics} />
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className="btn btn-primary"
            disabled={busy || note.trim().length < 10} onClick={submit}>
            Hoàn thành case
          </button>
          {note.trim().length < 10 && (
            <span className="text-xs text-slate-500">Cần viết kết luận trước khi hoàn thành.</span>
          )}
        </div>
        <SectionNote>
          Hoàn thành KHÔNG phải là xoá: MT sau em trượt lại hạng mục này thì chính case này mở lại, kèm một mốc tái phát — không sinh case mới.
        </SectionNote>
      </div>
    </Modal>
  );
}

/**
 * GHI CHI TIẾT THEO THÀNH PHẦN CỦA KỸ NĂNG (mục 9.3) — luôn TUỲ CHỌN, và chỉ hiện đúng bộ
 * của kỹ năng case đang nói tới: Section 1–4 cho Listening, bốn tiêu chí band cho Speaking.
 *
 * L/R ghi ĐẠT/TỔNG chứ không ghi band: "Section 3: 5.0" sẽ bị đọc thành band 5 ở Section 3,
 * một con số không tồn tại trong IELTS.
 */
function ComponentsField({ label, components, counts, value, onChange }: {
  label: string; components: readonly string[]; counts: boolean;
  value: Record<string, { score: string; total: string }>;
  onChange: (v: Record<string, { score: string; total: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (key: string, part: 'score' | 'total', v: string) => {
    const cur = value[key] ?? { score: '', total: '' };
    onChange({ ...value, [key]: { ...cur, [part]: v } });
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        + Ghi chi tiết {label} (không bắt buộc)
      </button>
    );
  }
  return (
    <div className="surface-2 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label m-0">Chi tiết {label}</span>
        <button type="button" className="btn btn-sm btn-ghost"
          onClick={() => { setOpen(false); onChange({}); }}>
          Bỏ phần này
        </button>
      </div>
      <div className="space-y-1.5">
        {components.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <span className="text-xs text-slate-300 w-52 shrink-0">{c}</span>
            <input className="field max-w-[6rem]" type="number" inputMode="decimal"
              step={counts ? 1 : 0.5} min={0} max={counts ? undefined : 9}
              placeholder={counts ? 'đạt' : 'band'}
              value={value[c]?.score ?? ''} onChange={(e) => set(c, 'score', e.target.value)} />
            {counts && (
              <>
                <span className="text-slate-500">/</span>
                <input className="field max-w-[6rem]" type="number" min={1} placeholder="tổng"
                  value={value[c]?.total ?? ''} onChange={(e) => set(c, 'total', e.target.value)} />
              </>
            )}
          </div>
        ))}
      </div>
      <SectionNote>
        Chỉ điền phần bạn thật sự đánh giá — để trống phần không xem tới. Đây là quan sát của
        bạn, không ghi đè điểm Test chính thức và không đổi mức SOS.
      </SectionNote>
    </div>
  );
}

/** Đổi các ô chi tiết đã nhập thành danh sách gửi lên máy chủ; ô để trống thì bỏ qua. */
function componentsPayload(
  category: string | null,
  v: Record<string, { score: string; total: string }>,
  counts: boolean,
) {
  if (!category) return undefined;
  const out = Object.entries(v)
    .filter(([, m]) => m.score !== '' && m.score !== undefined)
    .map(([component, m]) => ({
      skill: category, component,
      score: Number(m.score),
      total: counts && m.total !== '' ? Number(m.total) : null,
    }));
  return out.length ? out : undefined;
}

/**
 * FORM THÊM PHƯƠNG ÁN (mục 8.2).
 *
 * Bốn thay đổi so với bản trước, và mỗi cái sửa một chỗ nói dối:
 *
 *   · "Việc gì" → **Phương án**, và danh mục bày đúng bộ của nhóm case đang mở. Bày cả
 *     "Xếp tự học" cho một case về chuyện nghỉ học là mời người ta chọn sai.
 *   · Tình trạng chỉ còn **Đang theo dõi / Đã xong**, mặc định Đang theo dõi. Ba trạng thái
 *     cũ có "Đã lên kế hoạch" — một phương án đã lên kế hoạch mà chưa ai bắt đầu thì trên
 *     màn hình trông như đã có người lo.
 *   · Bỏ ô "Người khác làm, tôi nhập hộ". Người nhập và người thực hiện vẫn được lưu riêng,
 *     nhưng đó là hai ô dữ liệu, không phải một câu hỏi cho người dùng. Quản lý giao việc
 *     cho giáo viên thì không được ghi Quản lý thành người đã làm.
 *   · "Hẹn xem lại" → **Dự kiến kết thúc phương án**. Đây là hạn HOÀN THÀNH, không phải một
 *     cái nhắc; bỏ trống thì lấy Chủ nhật tuần tiếp theo.
 */
export function ActionDialog({ open, onClose, caseId, onDone }: {
  open: boolean; onClose: () => void; caseId: number; onDone: () => void;
}) {
  const toast = useToast();
  const catalogue = interventionKindsFor();
  const [kind, setKind] = useState<string>(catalogue.selfServe[0]);
  const [description, setDescription] = useState('');
  /* Mặc định ĐANG THEO DÕI: phương án vừa lập thì đang chạy, không phải đã xong. */
  const [status, setStatus] = useState('started');
  const [performerName, setPerformerName] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [followupDue, setFollowupDue] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<string>('real_exam');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Đổi nhóm case thì danh mục đổi theo, và lựa chọn cũ có thể không còn hợp lệ. */
  useEffect(() => {
    if (!open) return;
    const all = [...catalogue.selfServe, ...catalogue.proposals] as string[];
    if (!all.includes(kind)) setKind(catalogue.selfServe[0]);
  }, [open]);

  /*
   * Chỉ ĐỀ XUẤT mới gửi duyệt được — việc đã làm rồi thì không còn gì để duyệt.
   * Đổi trạng thái sang "đã xong" thì bỏ luôn ô chọn, không để lại một cờ vô nghĩa.
   */
  const canPropose = status === 'planned';
  /* Nhóm Đề xuất luôn phải có Quản lý trả lời — không hỏi lại một câu đã trả lời sẵn. */
  const alwaysNeedsApproval = isProposalKind(kind);

  const submit = async () => {
    if (description.trim().length < 8) {
      toast.push('error', 'Hãy mô tả ngắn phương án — một câu đủ để người khác hiểu sẽ làm gì.');
      return;
    }
    if (status === 'completed' && !completedDate) {
      toast.push('error', 'Ghi "Đã xong" thì phải có ngày hoàn thành thực tế.');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/interventions`, {
        kind, description, status,
        performerSelf: !performerName.trim(),
        performerName: performerName.trim() || undefined,
        completedDate: status === 'completed' ? completedDate || undefined : undefined,
        startedDate: startedDate || undefined,
        followupDue: followupDue || undefined,
        rescheduleTarget: kind === 'reschedule_mt' ? rescheduleTarget : undefined,
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
        <Field label="Phương án" required>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            <optgroup label="Bạn tự làm được">
              {catalogue.selfServe.map((k: string) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>
              ))}
            </optgroup>
            <optgroup label="Cần Quản lý duyệt">
              {catalogue.proposals.map((k: string) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>
              ))}
            </optgroup>
          </select>
        </Field>

        {/*
          "Lùi lịch thi" phải nói rõ LÙI CÁI GÌ (mục 8.1): kế hoạch thi thật của em, hay một
          phần thi trong đợt MT. Hai thứ có quy tắc và người quyết khác nhau; không nói rõ
          thì người duyệt không biết mình đang đồng ý với chuyện gì.
        */}
        {kind === 'reschedule_mt' && (
          <Field label="Lùi cái gì" required>
            <div className="flex gap-1 flex-wrap">
              {RESCHEDULE_TARGETS.map((t) => (
                <button key={t} type="button"
                  className={`btn btn-sm ${rescheduleTarget === t ? 'btn-primary' : ''}`}
                  onClick={() => setRescheduleTarget(t)}>
                  {RESCHEDULE_TARGET_LABEL[t]}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Mô tả ngắn" required hint="Một câu đủ để người khác hiểu sẽ làm gì cho em.">
          <input className="field" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Mỗi buổi 10 phút chữa câu và từ nối, kèm hai bài viết lại mỗi tuần" />
        </Field>
        <Field label="Tình trạng" required
          hint="Hai lựa chọn. Vừa lập thì là đang theo dõi; chỉ chọn Đã xong khi nhập một việc đã diễn ra.">
          <div className="flex gap-1 flex-wrap">
            <button type="button" className={`btn btn-sm ${status === 'started' ? 'btn-primary' : ''}`}
              onClick={() => setStatus('started')}>Đang theo dõi</button>
            <button type="button" className={`btn btn-sm ${status === 'completed' ? 'btn-primary' : ''}`}
              onClick={() => setStatus('completed')}>Đã xong</button>
          </div>
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
        {/*
          NGƯỜI THỰC HIỆN — một ô, không phải một câu hỏi.
          Bỏ trống nghĩa là chính bạn làm. Điền tên nghĩa là người đó làm còn bạn ghi lại —
          hai vai luôn được lưu riêng, nên Quản lý giao việc cho giáo viên thì không bị ghi
          thành người đã làm.
        */}
        <Field label="Người thực hiện"
          hint="Bỏ trống nếu chính bạn làm. Điền tên nếu bạn đang ghi lại việc của người khác.">
          <input className="field" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
            placeholder="Ví dụ: cô Trang (GV Speaking)" />
        </Field>
        <Field label="Dự kiến kết thúc phương án"
          hint="Đây là hạn HOÀN THÀNH, không phải một cái nhắc. Bỏ trống thì lấy Chủ nhật tuần tiếp theo.">
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
            Hạn trả lời suy từ mức độ ưu tiên của vấn đề: 7 ngày (bình thường) · 5 ngày (cần chú ý) ·
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
 * CẬP NHẬT KẾT QUẢ MỘT PHƯƠNG ÁN — HAI TAB (mục 9.1).
 *
 * Bản cũ bắt mọi lần ghi kết quả phải kèm một "bước tiếp theo". Nghe thì chặt chẽ, nhưng
 * tuần nào cũng phải khai một quyết định không có thật: người dạy chỉ muốn nói "tuần này em
 * khá hơn một chút, tôi làm tiếp" mà phải chọn giữa "kết thúc phương án" và "theo dõi
 * thêm". Ai chọn nhầm ô đầu là phương án bị khép lại, và case theo đó đóng sớm.
 *
 * Nay tách đúng hai việc:
 *
 *   · TIẾP TỤC THEO DÕI — kết quả + ghi chú, lưu là xong. Phương án vẫn chạy, hạn cập nhật
 *     chuyển sang Chủ nhật kế tiếp.
 *   · KẾT THÚC PHƯƠNG ÁN — thêm NGÀY HOÀN THÀNH THẬT và một bước tiếp theo.
 *
 * "Chưa đủ dữ liệu" chỉ ở được tab theo dõi: chưa có bài mới để nhìn thì đó là câu trả lời
 * trung thực, nhưng nó không phải một kết luận để khép việc lại.
 */
export function ResultDialog({ iv, startMode = 'monitor', onClose, onDone }: {
  iv: any | null;
  /** Tab mở sẵn — dùng khi đi từ ô ghi nhanh sang đây vì kết quả chưa tốt phải chọn cách đi tiếp. */
  startMode?: 'monitor' | 'end';
  onClose: () => void; onDone: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [mode, setMode] = useState<'monitor' | 'end'>(startMode);
  useEffect(() => { if (iv) setMode(startMode); }, [iv?.id, startMode]);
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [observedOn, setObservedOn] = useState(today);
  const [completedOn, setCompletedOn] = useState(today);
  const [newKind, setNewKind] = useState('tutor');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState<string>('real_exam');
  const [busy, setBusy] = useState(false);

  const outcomes = FOLLOWUP_OUTCOMES.filter((o) => mode !== 'end' || canEndWithOutcome(o));
  const steps = outcome ? stepsForMode(mode, outcome) : [];
  const noteOk = note.trim().length >= 8;
  const ready = !!outcome && noteOk && (mode === 'monitor' || !!nextStep)
    && (nextStep !== 'propose' || newDesc.trim().length >= 8);

  const close = () => {
    onClose(); setMode(startMode); setOutcome(''); setNote(''); setNextStep('');
    setNewDesc('');
  };

  const pickMode = (m: 'monitor' | 'end') => {
    setMode(m); setNextStep('');
    // "Chưa đủ dữ liệu" không kết thúc được phương án — bỏ chọn khi đổi sang tab kết thúc.
    if (m === 'end' && outcome && !canEndWithOutcome(outcome)) setOutcome('');
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/result`, {
        mode, outcome, note, observedOn: observedOn || undefined,
        nextStep: mode === 'end' ? nextStep : undefined,
        completedOn: mode === 'end' ? (completedOn || undefined) : undefined,
        newPlan: mode === 'end' && nextStep === 'propose'
          ? {
            kind: newKind, description: newDesc,
            rescheduleTarget: newKind === 'reschedule_mt' ? newTarget : null,
          }
          : null,
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', mode === 'end' ? 'Đã kết thúc phương án' : 'Đã cập nhật, phương án vẫn đang chạy');
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
        <button className="btn btn-primary" disabled={busy || !ready} onClick={submit}>
          {busy ? 'Đang lưu…' : mode === 'end' ? 'Kết thúc phương án' : 'Lưu, tiếp tục theo dõi'}
        </button>
      </>}
    >
      {iv && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 m-0">
            {INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}
            {iv.description ? ` · ${iv.description}` : ''}
            {iv.cycleNo > 1 ? ` · chu kỳ ${iv.cycleNo}` : ''}
            {iv.actionDue ? ` · hạn cập nhật ${fmtDate(iv.actionDue)}` : ''}
            {iv.followupDue ? ` · dự kiến kết thúc ${fmtDate(iv.followupDue)}` : ''}
          </p>

          {/* HAI TAB — chọn trước, vì nó quyết định form hỏi gì. */}
          <div className="flex gap-1.5">
            {RESULT_MODES.map((m) => (
              <button key={m} type="button"
                className={`btn btn-sm ${mode === m ? 'btn-primary' : ''}`}
                onClick={() => pickMode(m)}>
                {RESULT_MODE_LABEL[m]}
              </button>
            ))}
          </div>

          <Field label="1. Kết quả sau chu kỳ vừa rồi">
            <div className="flex flex-wrap gap-1.5">
              {outcomes.map((o) => (
                <button key={o} type="button"
                  className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`}
                  onClick={() => { setOutcome(o); setNextStep(''); }}>
                  {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(o)}
                </button>
              ))}
            </div>
            {mode === 'end' && (
              <p className="text-[11px] text-slate-500 mt-1 mb-0">
                “Chưa đủ dữ liệu” không kết thúc được phương án — chọn “Tiếp tục theo dõi”.
              </p>
            )}
          </Field>

          <Field label="2. Ghi chú" hint="Bắt buộc — tiến bộ ở đâu, còn kẹt chỗ nào, tuần tới làm gì.">
            <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: em có làm bài nhưng chưa đều, còn sai dạng T/F/NG." />
          </Field>

          <Field label="Ngày cập nhật">
            <input type="date" className="field" value={observedOn} max={today}
              onChange={(e) => setObservedOn(e.target.value)} />
          </Field>

          {mode === 'monitor' ? (
            <SectionNote>
              Phương án <strong>vẫn đang chạy</strong>. Lần cập nhật sau đến hạn vào Chủ nhật kế
              tiếp; ngày dự kiến kết thúc giữ nguyên, không bị đẩy lùi vì theo dõi thêm một tuần.
            </SectionNote>
          ) : (
            <>
              <Field label="Ngày hoàn thành thực tế"
                hint="Ngày phương án thật sự xong. Không nhận ngày ở tương lai.">
                <input type="date" className="field" value={completedOn} max={today}
                  onChange={(e) => setCompletedOn(e.target.value)} />
              </Field>

              <Field
                label="3. Bước tiếp theo"
                hint={outcome && !['improved', 'partial'].includes(outcome)
                  ? 'Kết quả chưa tốt thì không khép lại suông — phải nói rõ đi tiếp thế nào.'
                  : 'Không cần hỗ trợ thêm, hay thay bằng phương án khác?'}
              >
                {!outcome ? (
                  <p className="text-xs text-slate-500 m-0">Chọn kết quả ở trên trước.</p>
                ) : (
                  <div className="space-y-1.5">
                    {steps.map((st: NextStep) => (
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
                    <select className="field w-full" value={newKind}
                      onChange={(e) => setNewKind(e.target.value)}>
                      <optgroup label="Bạn tự làm được">
                        {interventionKindsFor().selfServe.map((k) => (
                          <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Cần Quản lý duyệt">
                        {interventionKindsFor().proposals.map((k) => (
                          <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>
                        ))}
                      </optgroup>
                    </select>
                  </Field>
                  {newKind === 'reschedule_mt' && (
                    <Field label="Lùi cái gì">
                      <select className="field w-full" value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}>
                        {RESCHEDULE_TARGETS.map((t) => (
                          <option key={t} value={t}>{RESCHEDULE_TARGET_LABEL[t]}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Mô tả" hint="Bắt buộc — làm gì, bao nhiêu buổi, đến khi nào.">
                    <input className="field w-full" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Ví dụ: học tutor Reading hai buổi mỗi tuần, đến hết MT3" />
                  </Field>
                  <SectionNote>
                    Phương án cũ được khép lại với lý do <strong>“Được thay thế”</strong> — KHÔNG đánh dấu là
                    đã hoàn thành thành công, vì nó không thành công, đó là cả lý do phải thay. Kết quả kém
                    của nó vẫn giữ nguyên trong lịch sử.
                  </SectionNote>
                </div>
              )}

              {nextStep === 'ask_manager' && (
                <SectionNote>
                  Phương án chuyển sang <strong>chờ Quản lý</strong>. Chu kỳ thực hiện dừng ở đây và chỉ chạy
                  lại khi có quyết định — thời gian chờ tính cho Quản lý, không tính là bạn đã có thời gian làm.
                  Phương án kế tiếp CHƯA chạy cho tới khi được duyệt.
                </SectionNote>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}


export { skillLabel };
