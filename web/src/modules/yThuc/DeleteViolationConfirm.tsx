import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';

/**
 * XOÁ VI PHẠM — hộp xác nhận MỘT DÒNG (rulebook v3, V11′–V14′): không lý do, không gõ chữ.
 * `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} biện pháp.`
 */
export function DeleteViolationConfirm({ violationId, onClose, onDone }: {
  violationId: number | null; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data } = useApi<{ measures: any[] }>(violationId ? `/violations/${violationId}` : null, [violationId]);
  const n = data?.measures?.length ?? 0;

  const confirm = async () => {
    if (!violationId) return;
    setBusy(true);
    try {
      await api.del(`/violations/${violationId}`);
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã xoá vi phạm');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <ConfirmDialog open={violationId !== null} onClose={onClose} onConfirm={confirm} busy={busy} danger
      title="Xoá vi phạm này?"
      body={n > 0 ? `Nó sẽ bị gỡ khỏi ${n} biện pháp.` : 'Vi phạm này chưa nằm trong biện pháp nào.'} />
  );
}
