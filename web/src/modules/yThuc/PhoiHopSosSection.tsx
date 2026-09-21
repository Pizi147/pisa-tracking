import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, Skeleton, Status } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import {
  COORDINATION_KINDS, COORDINATION_KIND_LABEL, COORDINATION_USER_REMOVE_REASONS, COORDINATION_REMOVE_REASON_LABEL,
  type CoordinationKind,
} from '@shared/domain/index.ts';
import { fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { Level } from '../../ui/ui.tsx';

type CoordAction = {
  id: number; kind: string; kindLabel: string; customName: string | null; name: string;
  preset: boolean; status: 'pending' | 'done' | 'removed'; statusLabel: string;
  performedOn: string | null; performerName: string | null; note: string | null;
  removeReasonLabel: string | null; attachmentCount: number;
};
export type CoordTurn = {
  attemptId: number; attemptNo: number; studentId: number; studentName: string;
  classCode: string | null; sosLevel: number | null; skillLabels: string[];
  summary: { done: number; active: number; label: string; complete: boolean };
  actions: CoordAction[]; canAct: boolean;
};

/**
 * DANH SÁCH `Phối hợp SOS` (§7.2/§7.3) — dùng chung cho tab lớp (nhiều học viên) và tab hồ sơ học viên
 * (một em, ẩn tên). Mỗi lượt gấp lại mặc định trừ khi `defaultOpenAttemptId` khớp.
 */
export function PhoiHopSosSection({ turns, loading, showStudentName = true, onChanged }: {
  turns: CoordTurn[] | null; loading?: boolean; showStudentName?: boolean; onChanged?: () => void;
}) {
  if (loading || !turns) return <Skeleton rows={3} />;
  if (!turns.length) return <Empty title="Không có lượt Phối hợp SOS nào" />;
  return (
    <ul className="list-none p-0 m-0 space-y-2">
      {turns.map((t) => (
        <TurnRow key={t.attemptId} t={t} showStudentName={showStudentName} onChanged={onChanged} />
      ))}
    </ul>
  );
}

function TurnRow({ t, showStudentName, onChanged }: { t: CoordTurn; showStudentName: boolean; onChanged?: () => void }) {
  const [open, setOpen] = useState(!t.summary.complete);
  const [adding, setAdding] = useState(false);

  return (
    <li className="rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full text-left appearance-none bg-transparent border-0 px-3 py-2.5 cursor-pointer flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-slate-500 text-xs select-none" aria-hidden
            style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>›</span>
          <span className="text-sm text-slate-100">
            {showStudentName && `${t.studentName} · `}MT{t.attemptNo}
            {t.classCode && showStudentName ? ` · ${t.classCode}` : ''}
            {t.sosLevel !== null && <> · <Level tone={sosTone(t.sosLevel)}>{sosLabel(t.sosLevel)}</Level></>}
            {t.skillLabels.length > 0 && <span className="text-slate-400"> · {t.skillLabels.join(' + ')}</span>}
          </span>
        </span>
        <Status kind={t.summary.complete ? 'done' : 'doing'}>{t.summary.label} hoàn thành</Status>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11px] text-slate-500 m-0">Hỗ trợ học thuật xem ở bảng kỹ năng.</p>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {t.actions.map((a) => (
              <ActionRow key={a.id} a={a} canAct={t.canAct} onChanged={onChanged} />
            ))}
          </ul>
          {t.canAct && !adding && (
            <button type="button" className="btn btn-sm" onClick={() => setAdding(true)}>+ Thêm việc</button>
          )}
          {adding && (
            <AddCoordinationForm attemptId={t.attemptId} existing={t.actions.map((a) => a.kind)}
              onClose={() => setAdding(false)} onChanged={onChanged} />
          )}
        </div>
      )}
    </li>
  );
}

function ActionRow({ a, canAct, onChanged }: { a: CoordAction; canAct: boolean; onChanged?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <li className="rounded-md border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-200">{a.name}</span>
        {a.status === 'done' ? (
          <span className="text-xs text-slate-400">{fmtDate(a.performedOn)} · Đã xong{a.performerName ? ` · ${a.performerName}` : ''}</span>
        ) : a.status === 'removed' ? (
          <span className="text-xs text-slate-500">Đã bỏ · {a.removeReasonLabel}</span>
        ) : canAct ? (
          <span className="flex gap-1.5">
            <button type="button" className="btn btn-sm" onClick={() => setConfirming(!confirming)}>Xác nhận</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setRemoving(!removing)}>Bỏ ▾</button>
          </span>
        ) : (
          <span className="text-xs text-amber-200/80">Cần xử lý</span>
        )}
      </div>
      {confirming && <ConfirmCoordinationForm actionId={a.id} onClose={() => setConfirming(false)} onChanged={onChanged} />}
      {removing && <RemoveCoordinationForm actionId={a.id} onClose={() => setRemoving(false)} onChanged={onChanged} />}
    </li>
  );
}

function ConfirmCoordinationForm({ actionId, onClose, onChanged }: {
  actionId: number; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const today = session?.demoDate ?? new Date().toISOString().slice(0, 10);
  const [performedOn, setPerformedOn] = useState(today);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/confirm`, { performedOn, note: note.trim() || undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã lưu');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mt-2 rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Ngày thực hiện
          <input type="date" className="field" style={{ width: '9.5rem' }} value={performedOn} max={today}
            onChange={(e) => setPerformedOn(e.target.value)} />
        </label>
      </div>
      <textarea className="field w-full" rows={2} placeholder="Ghi chú (tuỳ chọn)" value={note}
        onChange={(e) => setNote(e.target.value)} />
      <BangChung ownerType="sos_coordination_action" ownerId={actionId} canEdit tieuDe="" />
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !performedOn} onClick={save}>Lưu</button>
      </div>
    </div>
  );
}

function RemoveCoordinationForm({ actionId, onClose, onChanged }: {
  actionId: number; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!reason) { toast.push('error', 'Hãy chọn một lý do.'); return; }
    if (reason === 'other' && !text.trim()) { toast.push('error', 'Chọn "Khác" thì phải ghi rõ lý do.'); return; }
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/remove`, { reasonCode: reason, reasonText: text.trim() || undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã bỏ việc này');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mt-2 rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_USER_REMOVE_REASONS.map((r) => (
          <button key={r} type="button" className={`btn btn-sm ${reason === r ? 'btn-primary' : ''}`}
            onClick={() => setReason(r)}>
            {COORDINATION_REMOVE_REASON_LABEL[r]}
          </button>
        ))}
      </div>
      {reason === 'other' && (
        <input className="field" placeholder="Lý do" value={text} onChange={(e) => setText(e.target.value)} />
      )}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={save}>Bỏ việc này</button>
      </div>
    </div>
  );
}

function AddCoordinationForm({ attemptId, existing, onClose, onChanged }: {
  attemptId: number; existing: string[]; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!kind) { toast.push('error', 'Hãy chọn loại việc.'); return; }
    if (kind === 'other' && !customName.trim()) { toast.push('error', 'Việc loại "Khác" cần ghi tên việc.'); return; }
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/phoi-hop-sos`, { kind, customName: kind === 'other' ? customName.trim() : undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã thêm việc');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_KINDS.map((k) => (
          <button key={k} type="button" className={`btn btn-sm ${kind === k ? 'btn-primary' : ''}`}
            disabled={k !== 'other' && existing.includes(k)}
            onClick={() => setKind(k)}>
            {COORDINATION_KIND_LABEL[k as CoordinationKind]}
          </button>
        ))}
      </div>
      {kind === 'other' && (
        <input className="field" placeholder="Tên việc" value={customName} onChange={(e) => setCustomName(e.target.value)} />
      )}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={save}>Thêm</button>
      </div>
    </div>
  );
}
