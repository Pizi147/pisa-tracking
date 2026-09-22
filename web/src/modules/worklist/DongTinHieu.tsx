import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import type { WorkItem } from './WorkList.tsx';

/** Vô hiệu cache các khối đọc tín hiệu để chúng tự tải lại sau khi xử lý. */
const lamMoi = () => { invalidate('/my-work'); invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/signals'); };

/**
 * DÒNG TÍN HIỆU SOS LỚP THƯỜNG (§3.10, mockup 10b §5). Mỗi môn chưa đạt là một dòng riêng, hai nút:
 *   Tạo Case — mở form Case ĐÚNG MÔN, điền sẵn điểm (QuickReport, có idempotencyKey, gửi fromSignalId).
 *   Bỏ qua   — một bấm là xong; ô lý do nhỏ bên cạnh, không bắt buộc (quyết định S1 của chủ sản phẩm).
 * Nút nào hiện do máy chủ quyết (`signal.actions`) — người xem không xử lý được thì không có nút.
 */
export function DongTinHieu({ it }: { it: WorkItem }) {
  const toast = useToast();
  const [moForm, setMoForm] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  if (!it.signal) return null;   // hook ở trên để thứ tự hook không đổi giữa các lần render
  const s = it.signal;
  const boQua = async () => {
    setBusy(true);
    try {
      await api.post(`/signals/pending/${s.id}/dismiss`, { reason: lyDo.trim() || null });
      toast.push('ok', 'Đã bỏ qua');
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
      {s.actions.includes('create_case') && it.studentId !== null && (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setMoForm(true)}>Tạo Case</button>
      )}
      {s.actions.includes('dismiss') && (
        <>
          <input className="field h-7 text-xs w-36" value={lyDo} maxLength={200} onChange={(e) => setLyDo(e.target.value)}
            placeholder="Lý do (không bắt buộc)" aria-label="Lý do bỏ qua (không bắt buộc)" />
          <button type="button" className="btn btn-sm" disabled={busy} onClick={boQua}>Bỏ qua</button>
        </>
      )}
      {it.studentId !== null && (
        <QuickReport open={moForm} onClose={() => setMoForm(false)} studentId={it.studentId} studentName={it.studentName}
          signal={{ id: s.id, skill: s.skill, label: s.skillLabel, kind: s.kind,
            scoreText: s.score !== null && s.total !== null ? `${s.score}/${s.total}` : null, contextLabel: it.contextLabel }}
          onDone={lamMoi} />
      )}
    </div>
  );
}
