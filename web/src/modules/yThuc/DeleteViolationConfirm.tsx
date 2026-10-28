import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * XOÁ VI PHẠM — hộp xác nhận MỘT DÒNG (rulebook v3, V11′–V14′): không lý do, không gõ chữ.
 * PR-YT4 (V4-12): vi phạm nằm trong lần xử lý đã xong thì lần xử lý vẫn giữ, bậc không lùi.
 */
export function DeleteViolationConfirm({ violationId, onClose, onDone }: {
  violationId: number | null; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data } = useApi<{ measures: any[]; ten?: string | null }>(violationId ? `/violations/${violationId}` : null, [violationId]);
  const n = data?.measures?.length ?? 0;

  const confirm = async () => {
    if (!violationId) return;
    setBusy(true);
    try {
      await api.del(`/violations/${violationId}`);
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', t('Đã xoá vi phạm'));
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* 6c-2 (lỗi 9): mở từ danh sách vi phạm có thể nằm trong panel khác → hộp nhỏ lớp z trên, không ngăn 480 đè panel. */
  return (
    <ConfirmDialog open={violationId !== null} onClose={onClose} onConfirm={() => void confirm()} title={t('Xoá vi phạm này?')} danger busy={busy} z="z-[60]"
      confirmLabel={t('Xoá vi phạm')} busyLabel={t('Đang xoá…')}
      /* 6c-2 (bấm thử): nêu đúng vi phạm bị xoá (tên) rồi hậu quả với lần xử lý. */
      body={<>{data?.ten && <p className="m-0 font-semibold text-slate-100">{data.ten}</p>}
        <p className="m-0">{n > 0 ? t('Vi phạm nằm trong {n} lần xử lý — lần xử lý vẫn giữ, bậc không lùi.', { n }) : t('Vi phạm chưa nằm trong lần xử lý nào.')}</p></>} />
  );
}
