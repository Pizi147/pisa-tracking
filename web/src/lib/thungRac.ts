import { api } from './api.ts';
import type { useToast } from '../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * Q-RL2a THÙNG RÁC: toast "Đã xoá … · Hoàn tác" sau khi máy chủ xoá mềm (trả `thungRacId`). Hoàn tác = `POST /thung-rac/:id/khoi-phuc`;
 * toast sống ở Provider nên panel / trang đã đóng vẫn khôi phục được. Không có `thungRacId` (máy chủ cũ) thì chỉ báo đã xoá.
 */
export function hoanTacXoa(toast: ReturnType<typeof useToast>, thungRacId: number | null | undefined, chu: string, lamMoi: () => void) {
  if (!thungRacId) { toast.push('ok', chu); return; }
  const key = `thung-rac-${thungRacId}`;
  toast.hoanTac(chu, async () => {
    try { await api.post(`/thung-rac/${thungRacId}/khoi-phuc`); lamMoi(); toast.push('ok', t('Đã khôi phục'), { key }); }
    catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
  }, { key });
}
