import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { ErrorState, Field, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { fmtDate } from '../../lib/format.ts';

/**
 * HỘP CHỈ ĐỌC MỘT PHƯƠNG ÁN XỬ LÝ (PR-HV, spec §4.3 — nút `Xem`, việc K2-6 đã hoãn). Dữ liệu từ `GET /measures/:id`.
 * Không sửa gì ở đây, TRỪ ghi chú khi đã thực hiện (YT-10, Q9): GVCN/Quản lý bổ sung được sau khi việc đã xong; riêng
 * tệp/liên kết vẫn bổ sung được sau khi đã thực hiện (B10) — quyền do máy chủ kiểm.
 */
export function XemPhuongAnPanel({ measureId, onClose }: { measureId: number | null; onClose: () => void }) {
  const toast = useToast();
  const { data: d, error, reload } = useApi<any>(measureId !== null ? `/measures/${measureId}` : null, [measureId]);
  const [suaGhiChu, setSuaGhiChu] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSuaGhiChu(false); }, [measureId]);

  if (measureId === null) return null;

  const luuGhiChu = async () => {
    setBusy(true);
    try {
      await api.patch(`/measures/${measureId}`, { note: note.trim() || null });
      toast.push('ok', 'Đã lưu ghi chú');
      setSuaGhiChu(false);
      reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={d ? `${d.kindLabel} · ${d.studentName}` : 'Phương án'}
      footer={<button className="btn" onClick={onClose}>Đóng</button>}>
      {error ? <ErrorState message={error.message} onRetry={reload} /> : !d ? <Skeleton rows={4} /> : (
        <div className="space-y-3 text-sm text-slate-200">
          <Field label="Trạng thái" as="div">{d.statusLabel}</Field>
          <Field label="Ngày thực hiện" as="div">{fmtDate(d.performedOn)}</Field>
          <Field label="Người thực hiện" as="div">{d.performedByName ?? d.performerName ?? '—'}</Field>
          {d.ownerName && <Field label="Phụ trách" as="div">{d.ownerName}</Field>}
          {d.participants && <Field label="Người tham gia" as="div">{d.participants}</Field>}
          <Field label="Lý do / nội dung" as="div">
            {suaGhiChu ? (
              <div className="space-y-2">
                <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setSuaGhiChu(false)}>Huỷ</button>
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={luuGhiChu}>Lưu</button>
                </div>
              </div>
            ) : (
              <>
                <p className="m-0 whitespace-pre-wrap break-words">{d.note ?? '—'}</p>
                {d.status === 'done' && d.canManage && (
                  <button type="button" className="text-xs text-sky-300 hover:underline mt-1"
                    onClick={() => { setNote(d.note ?? ''); setSuaGhiChu(true); }}>
                    Sửa ghi chú
                  </button>
                )}
              </>
            )}
          </Field>
          <Field label={`${(d.violations ?? []).length} vi phạm được xử lý bằng phương án này`} as="div">
            <ul className="list-none p-0 m-0 space-y-0.5 text-xs text-slate-400">
              {(d.violations ?? []).map((v: any) => (
                <li key={v.id} className="break-words">{fmtDate(v.occurredOn)} · {v.categoryLabel} · {v.description}</li>
              ))}
            </ul>
          </Field>
          <Field label="Tệp hoặc liên kết" as="div">
            <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={!!d.canManage} tieuDe="" />
          </Field>
          {d.confirmedByName && (
            <p className="text-[11px] text-slate-500 m-0">Xác nhận bởi {d.confirmedByName} · {fmtDate(d.confirmedAt)}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
