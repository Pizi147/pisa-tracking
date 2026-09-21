import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { MEASURE_REQUIRED_FIELDS, measureMissing, type MeasureKind } from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';

type MeasureDetail = {
  id: number; studentName: string; kind: string; kindLabel: string; customName: string | null;
  violations: { id: number; occurredOn: string; categoryLabel: string }[];
  attachmentCount: number; canManage: boolean;
};

/**
 * PANEL `XÁC NHẬN ĐÃ THỰC HIỆN` (Y_THUC §7.5, giữ nguyên theo plan.md K1). Ô bắt buộc đổi theo loại biện
 * pháp (§5.4) — dùng ĐÚNG `measureMissing` mà máy chủ dùng để từ chối, nên nút mờ và câu từ chối không
 * bao giờ nói hai điều khác nhau (B13). Không hỏi tiến bộ, không mức kết quả (B15).
 */
export function ConfirmMeasurePanel({ open, onClose, measureId, onDone }: {
  open: boolean; onClose: () => void; measureId: number | null; onDone?: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const today = session?.demoDate ?? new Date().toISOString().slice(0, 10);
  const { data } = useApi<MeasureDetail>(open && measureId ? `/measures/${measureId}` : null, [open, measureId]);
  const [performedOn, setPerformedOn] = useState(today);
  const [performerName, setPerformerName] = useState('');
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPerformedOn(today); setPerformerName(''); setNote(''); setParticipants('');
  }, [open, measureId]);

  if (!data) return open ? <Modal open onClose={onClose} title="Xác nhận đã thực hiện"><p>Đang tải…</p></Modal> : null;

  const spec = MEASURE_REQUIRED_FIELDS[data.kind as MeasureKind];
  const missing = measureMissing(data.kind as MeasureKind, {
    performedOn: performedOn || null, content: note, attachments: data.attachmentCount,
    customName: data.customName, performer: !!(performerName.trim() || session?.user?.id),
  });

  const submit = async () => {
    if (!measureId) return;
    setBusy(true);
    try {
      await api.post(`/measures/${measureId}/confirm`, {
        performedOn, performerName: performerName.trim() || undefined,
        /* Bỏ trống người thực hiện = chính bạn làm — máy chủ không tự suy ra, phải gửi rõ ID của mình. */
        performedBy: performerName.trim() ? undefined : session?.user?.id,
        note: note.trim() || undefined, participants: participants.trim() || undefined,
      });
      invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', `Đã lưu. ${data.studentName}: ${data.violations.length} vi phạm chuyển sang Đã xử lý.`);
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={`Xác nhận đã thực hiện · ${data.kindLabel} · ${data.studentName}`}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !!missing} title={missing ?? undefined} onClick={submit}>
            Xác nhận đã thực hiện
          </button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Ngày thực hiện" required>
          <input type="date" className="field" value={performedOn} max={today}
            onChange={(e) => setPerformedOn(e.target.value)} />
        </Field>

        <Field label="Người thực hiện" hint="Bỏ trống nếu chính bạn làm.">
          <input className="field" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
            placeholder="Ví dụ: cô Thu (GVCN)" />
        </Field>

        {spec?.participants === 'optional' && (
          <Field label="Người tham gia" hint="Dùng cho CX / GĐCN meeting với HS / PH.">
            <input className="field" value={participants} onChange={(e) => setParticipants(e.target.value)} />
          </Field>
        )}

        <Field label="Lý do / nội dung" required>
          <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <Field label={spec?.attachment === 'required' ? 'Tệp hoặc liên kết' : 'Tệp hoặc liên kết (tuỳ chọn)'}
          required={spec?.attachment === 'required'} as="div">
          <BangChung ownerType="discipline_measure" ownerId={data.id} canEdit={data.canManage} tieuDe="" />
        </Field>

        <Field label={`${data.violations.length} vi phạm được xử lý bằng biện pháp này`} as="div">
          <p className="text-xs text-slate-400 m-0">
            {data.violations.map((v) => `${fmtDate(v.occurredOn)} ${v.categoryLabel}`).join(' · ')}
          </p>
        </Field>

        {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      </div>
    </Modal>
  );
}
