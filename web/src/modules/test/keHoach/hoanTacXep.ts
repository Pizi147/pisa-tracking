import { api, invalidate } from '../../../lib/api.ts';
import type { useToast } from '../../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * R2 C2: toast "Đã xếp … · Hoàn tác" sau lần lưu lịch nhiều em — máy chủ trả `dao` (bản chụp), Hoàn tác = `POST /ke-hoach-test/hoan-tac` (về y như trước;
 * đã đổi tiếp / quá 15 phút → câu lỗi của máy chủ). Không có `dao` (không em nào lưu) thì chỉ báo như cũ.
 */
export function baoXepCoHoanTac(toast: ReturnType<typeof useToast>, dao: readonly (number | undefined)[], kind: 'ok' | 'error', chu: string, lamMoi: () => void) {
  const ids = dao.filter((x): x is number => !!x);
  if (!ids.length || kind === 'error') { toast.push(kind, chu); return; }
  const key = `xep-lich-${ids[0]}`;
  toast.hoanTac(chu, async () => {
    try {
      await api.post('/ke-hoach-test/hoan-tac', { dao: ids });
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham'); invalidate('/cycles');
      lamMoi();
      toast.push('ok', t('Đã hoàn tác'), { key });
    } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
  }, { key });
}
