import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Pill, SectionNote, Skeleton } from './ui.tsx';
import { Modal } from './Drawer.tsx';
import { caseStatusLabel, caseStatusTone, fmtDate, skillLabel, sosLabel, sosTone } from '../lib/format.ts';
import {
  DISPOSITIONS, DISPOSITION_LABEL, FOLLOWUP_OUTCOMES, FOLLOWUP_OUTCOME_LABEL,
  INTERVENTION_KINDS, INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
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
  summary: string | null; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  viewer: { canEdit: boolean; canClose: boolean };
};

export function CasePanel({ caseId, compact = false }: { caseId: number; compact?: boolean }) {
  const { data, loading, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [addAction, setAddAction] = useState(false);
  const [addFollowup, setAddFollowup] = useState<number | 'case' | null>(null);
  const [close, setClose] = useState(false);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;

  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const secondary = data.issues.filter((i) => i.role === 'secondary');
  const context = data.issues.filter((i) => i.role === 'context');
  const followupsOf = (ivId: number) => data.followups.filter((f) => f.interventionId === ivId);
  const loose = data.followups.filter((f) => !f.interventionId);

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------- 1. vì sao đang theo dõi */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={caseStatusTone(data.status)}>{caseStatusLabel(data.status)}</Pill>
          {/*
            Case từ điểm có MỨC SOS (số kỹ năng dưới kỳ vọng). Case giáo viên báo có MỨC ĐỘ
            GẤP — nhận định của người báo. Hai thứ khác hẳn nhau nên không dùng chung nhãn.
          */}
          {data.sosLevel !== null && <Pill tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Pill>}
          {data.urgency && data.urgency !== 'normal' && (
            <Pill tone={data.urgency === 'urgent' ? 'danger' : 'warn'}>
              {URGENCY_LABEL[data.urgency as keyof typeof URGENCY_LABEL]}
            </Pill>
          )}
          <Pill tone="muted">
            {data.originKind === 'teacher_report' ? 'Giáo viên báo' : 'Sinh từ điểm'}
          </Pill>
          {data.cycle && <Pill tone="muted">{data.cycle.route ?? `Lộ trình ${data.cycle.seq}`}</Pill>}
        </div>

        <p className="text-sm text-slate-100 mt-2 mb-1">{data.summary || 'Chưa có tóm tắt'}</p>
        <p className="text-xs text-slate-500 m-0">
          Ghi nhận {fmtDate(data.detectedAt)}
          {data.reportedBy && ` · ${data.reportedBy}`}
          {data.attemptNo && ' · '}
          {data.attemptId && data.attemptNo && (
            <Link className="link" to={`/mock-test/${data.attemptId}`}>MT{data.attemptNo}</Link>
          )}
          {data.student && !compact && (
            <> · <Link className="link" to={`/hoc-vien/${data.student.id}`}>{data.student.name}</Link></>
          )}
        </p>

        {(primary || secondary.length > 0 || context.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {primary && <Pill tone="info" title={primary.observation ?? undefined}>{primary.label}</Pill>}
            {secondary.map((i) => <Pill key={i.id} tone="neutral" title={i.observation ?? undefined}>{i.label}</Pill>)}
            {context.map((i) => (
              <Pill key={i.id} tone="muted" title={i.observation ?? undefined}>Bối cảnh: {i.label}</Pill>
            ))}
          </div>
        )}
        {!primary && data.originKind !== 'teacher_report' && (
          <SectionNote>
            Chưa phân loại. Case sinh từ điểm chỉ biết kỹ năng nào dưới kỳ vọng — vì sao thì
            phải có người dạy nhận định, hệ thống không tự chẩn đoán.
          </SectionNote>
        )}
      </section>

      {/* ---------------------------------------------------- 2 và 3. đã làm gì, quan sát gì */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-200 m-0">Đã làm gì và quan sát được gì</h3>
          {data.viewer.canEdit && (
            <button className="btn btn-sm" onClick={() => setAddAction(true)}>+ Ghi một việc đã làm</button>
          )}
        </div>

        {data.interventions.length === 0 && loose.length === 0 ? (
          <Empty title="Chưa ghi việc nào"
            hint="Trao đổi với học viên, điều chỉnh cách dạy, xếp tự học — ghi lại để lần sau còn biết đã thử gì." />
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {data.interventions.map((iv) => (
              <li key={iv.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-100">
                    {INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}
                  </span>
                  <Pill tone={iv.status === 'completed' ? 'ok' : iv.status === 'cancelled' ? 'muted' : 'info'}>
                    {INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}
                  </Pill>
                  {iv.overdue && <Pill tone="warn">Quá hạn xem lại</Pill>}
                </div>
                {iv.description && <p className="text-sm text-slate-300 mt-1 mb-0">{iv.description}</p>}
                <p className="text-xs text-slate-500 mt-1 mb-0">
                  {iv.performer ? `Người làm: ${iv.performer}` : 'Chưa rõ người làm'}
                  {/* Người ghi khác người làm thì nói rõ, để không đọc nhầm ai đã làm việc đó. */}
                  {iv.byProxy && iv.recordedBy && ` · ${iv.recordedBy} nhập hộ`}
                  {iv.completedDate && ` · xong ${fmtDate(iv.completedDate)}`}
                  {!iv.completedDate && iv.startedDate && ` · bắt đầu ${fmtDate(iv.startedDate)}`}
                  {!iv.completedDate && !iv.startedDate && iv.plannedDate && ` · dự kiến ${fmtDate(iv.plannedDate)}`}
                  {iv.followupDue && ` · hẹn xem lại ${fmtDate(iv.followupDue)}`}
                </p>

                {followupsOf(iv.id).map((f) => (
                  <div key={f.id} className="mt-2 pl-3 border-l" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-xs text-slate-300">
                      {fmtDate(f.observedOn)} · {FOLLOWUP_OUTCOME_LABEL[f.outcome as keyof typeof FOLLOWUP_OUTCOME_LABEL] ?? f.outcome}
                      {f.observerName && ` · ${f.observerName}`}
                    </span>
                    {f.note && <p className="text-xs text-slate-400 m-0">{f.note}</p>}
                  </div>
                ))}

                {data.viewer.canEdit && (
                  <button className="btn btn-sm btn-ghost mt-2" onClick={() => setAddFollowup(iv.id)}>
                    + Ghi lại kết quả xem lại
                  </button>
                )}
              </li>
            ))}
            {loose.map((f) => (
              <li key={`f${f.id}`} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
                <span className="text-xs text-slate-300">
                  {fmtDate(f.observedOn)} · Theo dõi chung ·{' '}
                  {FOLLOWUP_OUTCOME_LABEL[f.outcome as keyof typeof FOLLOWUP_OUTCOME_LABEL] ?? f.outcome}
                  {f.observerName && ` · ${f.observerName}`}
                </span>
                {f.note && <p className="text-xs text-slate-400 m-0">{f.note}</p>}
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

      {/* ---------------------------------------------------- 4. bước tiếp theo */}
      <section className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold text-slate-200 m-0 mb-1">Bước tiếp theo</h3>
        {data.disposition ? (
          <p className="text-sm text-slate-100 m-0">
            {DISPOSITION_LABEL[data.disposition as keyof typeof DISPOSITION_LABEL] ?? data.disposition}
            {data.dispositionNote && <span className="text-slate-400"> — {data.dispositionNote}</span>}
          </p>
        ) : (
          <p className="text-sm text-slate-400 m-0">Chưa ai định hướng xử lý.</p>
        )}
        {data.closedAt && <p className="text-xs text-slate-500 mt-1 mb-0">Đã kết thúc theo dõi {fmtDate(data.closedAt)}</p>}
        {data.viewer.canEdit && (
          <div className="flex flex-wrap gap-2 mt-2">
            <button className="btn btn-sm" onClick={() => setClose(true)}>
              {data.status === 'done' ? 'Đổi hướng xử lý' : 'Chọn hướng xử lý'}
            </button>
          </div>
        )}
        {!data.viewer.canClose && data.status !== 'done' && (
          <SectionNote>
            Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới kết thúc theo dõi được. Bạn vẫn
            ghi được việc đã làm và kết quả xem lại.
          </SectionNote>
        )}
      </section>

      <ActionDialog open={addAction} onClose={() => setAddAction(false)} caseId={caseId} onDone={reload} />
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
      <Card title="Vấn đề học vụ">
        <CasePanel caseId={caseId} />
      </Card>
    </div>
  );
}

// ==================================================================== hộp thoại

function ActionDialog({ open, onClose, caseId, onDone }: {
  open: boolean; onClose: () => void; caseId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState('talk_student');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('completed');
  const [performerName, setPerformerName] = useState('');
  const [bySomeoneElse, setBySomeoneElse] = useState(false);
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [followupDue, setFollowupDue] = useState('');
  const [busy, setBusy] = useState(false);

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
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      onDone(); onClose();
      setDescription(''); setPerformerName(''); setCompletedDate(''); setFollowupDue('');
      toast.push('ok', 'Đã ghi lại');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ghi một việc đã làm"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>Lưu</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Việc gì">
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {INTERVENTION_KINDS.map((k) => (
              <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k]}</option>
            ))}
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
