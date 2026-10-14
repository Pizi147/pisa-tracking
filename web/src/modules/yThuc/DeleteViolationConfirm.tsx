import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
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
  const { data } = useApi<{ measures: any[] }>(violationId ? `/violations/${violationId}` : null, [violationId]);
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

  /* I4 (PR-SL): khung panel chung. Mở từ danh sách vi phạm có thể nằm trong panel khác → `longTrong`, lớp z trên. */
  if (violationId === null) return null;
  return (
    <KhungPanel tieuDe={t('Xoá vi phạm này?')} longTrong z="z-[60]" onDong={() => !busy && onClose()}
      chan={{
        huy: { onClick: onClose, disabled: busy },
        chinh: (
          <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" onClick={() => void confirm()} disabled={busy}>
            {busy ? t('Đang xoá…') : t('Xoá vi phạm')}
          </button>
        ),
      }}>
      <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">
        {n > 0 ? t('Vi phạm nằm trong {n} lần xử lý — lần xử lý vẫn giữ, bậc không lùi.', { n }) : t('Vi phạm chưa nằm trong lần xử lý nào.')}
      </p>
    </KhungPanel>
  );
}
