import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, INTERVENTION_KIND_LABEL, issuesForTopic,
  interventionKindsFor, reasonNeedsText, type CaseDismissReason,
} from '@shared/domain/index.ts';

const invalidateCases = () => { invalidate('/cases'); invalidate('/students'); invalidate('/overview'); invalidate('/my-work'); };

/**
 * `XÁC ĐỊNH NGUYÊN NHÂN` (§7.5, S04) — mở đúng ô phân loại đang có trong form case (`issuesForTopic`,
 * dùng chung với QuickReport lúc tạo case) nhưng cho case ĐÃ TỒN TẠI, qua `PUT /cases/:id/issues`.
 */
export function CauseDeterminationPanel({ caseId, topic, currentCode, onClose, onDone }: {
  caseId: number; topic: string | null; currentCode: string | null; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState(currentCode ?? '');
  const [busy, setBusy] = useState(false);
  const causes = topic ? issuesForTopic(topic) : [];

  const save = async () => {
    if (!code) { toast.push('error', 'Chọn phân loại vấn đề.'); return; }
    setBusy(true);
    try {
      await api.put(`/cases/${caseId}/issues`, { primaryCode: code });
      invalidateCases();
      toast.push('ok', 'Đã chọn nguyên nhân');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-1 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      {causes.length === 0 ? (
        <p className="text-xs text-amber-200/90 m-0">Chủ đề này chưa có danh mục nguyên nhân để chọn.</p>
      ) : (
        <div className="flex gap-1 flex-wrap">
          {causes.map((i) => (
            <button key={i.code} type="button" title={i.hint}
              className={`btn btn-sm ${code === i.code ? 'btn-primary' : ''}`}
              onClick={() => setCode(i.code)}>
              {i.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        {causes.length > 0 && (
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !code} onClick={save}>Lưu</button>
        )}
      </div>
    </div>
  );
}

type Mode = null | 'confirm' | 'edit' | 'replace';

/**
 * PHƯƠNG ÁN ĐIỀN SẴN CHỜ XÁC NHẬN (§7.5, S04, S06) — ba nút `Xác nhận` · `Sửa` · `Thay`. `Xác nhận` chạy
 * ngay với nội dung điền sẵn; `Sửa` mở ô mô tả để chỉnh rồi xác nhận trong MỘT thao tác (PR-T); `Thay` đổi
 * hẳn loại phương án — kết thúc phương án điền sẵn, tạo phương án mới đã xác nhận.
 */
export function PresetPlanActions({ interventionId, description, followupDue, onDone }: {
  interventionId: number; description: string; followupDue: string | null; onDone?: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState(description);
  const [due, setDue] = useState(followupDue ?? '');
  const catalogue = interventionKindsFor();
  const [kind, setKind] = useState<string>(catalogue.selfServe[0]);
  const [performerName, setPerformerName] = useState('');

  const confirmNow = async (patch: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      await api.post(`/interventions/${interventionId}/confirm`, patch);
      invalidateCases();
      toast.push('ok', 'Đã xác nhận phương án');
      setMode(null); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const replaceMissing = desc.trim().length < 8 ? 'Mô tả phương án mới cần ít nhất 8 ký tự.' : null;

  const replace = async () => {
    if (replaceMissing) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${interventionId}/replace`, {
        kind, description: desc, performerSelf: !performerName.trim(),
        performerName: performerName.trim() || undefined, followupDue: due || undefined,
      });
      invalidateCases();
      toast.push('ok', 'Đã thay phương án');
      setMode(null); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (mode === null) {
    return (
      <span className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => confirmNow()}>Xác nhận</button>
        <button type="button" className="btn btn-sm" onClick={() => setMode('edit')}>Sửa</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('replace')}>Thay</button>
      </span>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="rounded-lg mt-2 p-2.5 space-y-2 w-full" style={{ background: 'var(--surface-1)' }}>
        <textarea className="field w-full" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Dự kiến kết thúc
          <input type="date" className="field" style={{ width: '9.5rem' }} value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <div className="flex gap-1.5">
          <button type="button" className="btn btn-sm" onClick={() => setMode(null)} disabled={busy}>Huỷ</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy}
            onClick={() => confirmNow({ description: desc, followupDue: due || null })}>
            Xác nhận
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg mt-2 p-2.5 space-y-2 w-full" style={{ background: 'var(--surface-1)' }}>
      <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
        <optgroup label="Bạn tự làm được">
          {catalogue.selfServe.map((k: string) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>)}
        </optgroup>
        <optgroup label="Cần Quản lý duyệt">
          {catalogue.proposals.map((k: string) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>)}
        </optgroup>
      </select>
      <textarea className="field w-full" rows={2} placeholder="Mô tả phương án mới" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <input className="field" placeholder="Người thực hiện (bỏ trống nếu chính bạn)" value={performerName}
        onChange={(e) => setPerformerName(e.target.value)} />
      <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
        Dự kiến kết thúc
        <input type="date" className="field" style={{ width: '9.5rem' }} value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      {replaceMissing && <p className="text-xs text-amber-200/90 m-0">{replaceMissing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={() => setMode(null)} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!replaceMissing} title={replaceMissing ?? undefined} onClick={replace}>Thay phương án</button>
      </div>
    </div>
  );
}

/** `KHÔNG CẦN THEO DÕI` (S05, Q-V3-4) — ba lý do chọn nhanh tại chỗ; chỉ `Khác` cần ô chữ. */
export function DismissCaseForm({ caseId, onClose, onDone }: { caseId: number; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !reason ? 'Chọn một lý do.'
    : reasonNeedsText(reason) && !text.trim() ? 'Chọn "Khác" thì phải ghi rõ lý do.'
    : null;

  const save = async () => {
    if (missing) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/dismiss`, { reasonCode: reason, reasonText: text.trim() || undefined });
      invalidateCases();
      toast.push('ok', 'Case đã đóng — Không cần theo dõi');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-2 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {CASE_DISMISS_REASONS.map((r) => (
          <button key={r} type="button" className={`btn btn-sm ${reason === r ? 'btn-primary' : ''}`}
            onClick={() => setReason(r)}>
            {CASE_DISMISS_REASON_LABEL[r as CaseDismissReason]}
          </button>
        ))}
      </div>
      {reasonNeedsText(reason) && (
        <input className="field" placeholder="Lý do" value={text} onChange={(e) => setText(e.target.value)} />
      )}
      {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-danger" disabled={busy || !!missing} title={missing ?? undefined} onClick={save}>Không cần theo dõi</button>
      </div>
    </div>
  );
}
