import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import { MEASURE_KINDS, MEASURE_KIND_LABEL, type MeasureKind } from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';

type KindRow = { kind: MeasureKind; label: string; available: boolean; reason: string | null };

/**
 * PANEL `TẠO BIỆN PHÁP XỬ LÝ` (Y_THUC §7.4, giữ nguyên theo plan.md K1). GVCN/QL gom một hay nhiều vi phạm
 * CỦA ĐÚNG MỘT học viên vào một biện pháp. Chín loại xếp nhẹ → nặng để ĐỌC (B05); chuỗi Thư cảnh cáo khoá
 * đúng dòng kèm lý do NGAY TẠI DÒNG (B06) — không để bấm rồi mới báo lỗi.
 */
export function CreateMeasurePanel({
  open, onClose, studentId, studentName, violations, onDone, onConfirmNow,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName: string;
  /** Vi phạm đang gom, đủ để hiện lại danh sách và bỏ bớt từng dòng. */
  violations: { id: number; occurredOn: string; categoryLabel: string; description: string }[];
  onDone?: () => void;
  /** Bấm "Xác nhận đã làm luôn" → mở thẳng panel Xác nhận với biện pháp vừa tạo (7.4 → 7.5 một mạch). */
  onConfirmNow?: (measureId: number) => void;
}) {
  const toast = useToast();
  const kinds = useApi<{ rows: KindRow[] }>(open && studentId ? `/students/${studentId}/measure-kinds` : null, [open, studentId]);
  const [kind, setKind] = useState<string>('talk_short');
  const [customName, setCustomName] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind('talk_short'); setCustomName(''); setNote('');
    setPicked(new Set(violations.map((v) => v.id)));
  }, [open]);

  const list = violations.filter((v) => picked.has(v.id));
  const availability = kinds.data?.rows ?? [];
  const isLocked = (k: string) => availability.find((r) => r.kind === k)?.available === false;
  const lockReason = (k: string) => availability.find((r) => r.kind === k)?.reason ?? null;
  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !list.length ? 'Cần ít nhất một vi phạm để tạo biện pháp.'
    : kind === 'other' && !customName.trim() ? 'Loại "Khác" cần ghi tên biện pháp.'
    : null;

  const create = async (confirmNow: boolean) => {
    if (missing) return;
    setBusy(true);
    try {
      const m = await api.post<any>('/measures', {
        studentId, kind, customName: kind === 'other' ? customName.trim() : null,
        violationIds: list.map((v) => v.id), note: note.trim() || null,
        idempotencyKey: `measure:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      });
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      if (confirmNow) {
        onClose(); onConfirmNow?.(m.id);
      } else {
        toast.push('ok', 'Đã lưu — Đang chuẩn bị');
        onClose(); onDone?.();
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tạo biện pháp xử lý · ${studentName}`}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn" disabled={busy || !!missing} title={missing ?? undefined} onClick={() => create(false)}>Lưu — Đang chuẩn bị</button>
          <button className="btn btn-primary" disabled={busy || !!missing} title={missing ?? undefined} onClick={() => create(true)}>Xác nhận đã làm luôn →</button>
        </>
      }>
      <div className="space-y-3">
        <Field label={`Đang gom ${list.length} vi phạm`} as="div">
          {list.length === 0 ? (
            <p className="text-xs text-amber-200/90 m-0">Không còn vi phạm nào được chọn.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-1">
              {list.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 text-xs text-slate-300">
                  <span>{fmtDate(v.occurredOn)} · {v.categoryLabel} · {v.description.slice(0, 60)}</span>
                  <button type="button" className="btn btn-sm btn-ghost"
                    onClick={() => setPicked((s) => { const n = new Set(s); n.delete(v.id); return n; })}>
                    Bỏ
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Field label="Loại biện pháp" required hint="nhẹ ─────────────────────────── nặng · chọn thẳng cái nào cũng được (B05)">
          <div className="space-y-1">
            {MEASURE_KINDS.map((k) => {
              const locked = isLocked(k);
              return (
                <label key={k}
                  className={`flex items-center gap-2 text-sm ${locked ? 'opacity-50' : 'cursor-pointer'}`}>
                  <input type="radio" name="measure-kind" disabled={locked} checked={kind === k}
                    onChange={() => setKind(k)} />
                  <span className={kind === k ? 'text-slate-100' : 'text-slate-300'}>{MEASURE_KIND_LABEL[k]}</span>
                  {locked && <span className="text-[11px] text-amber-200/80">[khoá] {lockReason(k)}</span>}
                </label>
              );
            })}
          </div>
        </Field>

        {kind === 'other' && (
          <Field label="Tên biện pháp" required>
            <input className="field" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </Field>
        )}

        <Field label="Ghi chú">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <SectionNote>
          Người phụ trách mặc định là giáo viên chủ nhiệm của lớp em đang học. `Lưu — Đang chuẩn bị` dùng cho
          việc cần vài ngày (Report, Thư cảnh cáo); `Xác nhận đã làm luôn` dùng cho việc vừa làm tại chỗ.
        </SectionNote>

        {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      </div>
    </Modal>
  );
}
