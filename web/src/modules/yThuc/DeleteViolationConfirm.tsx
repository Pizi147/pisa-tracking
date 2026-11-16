import { api, invalidate } from '../../lib/api.ts';
import { hoanTacXoa } from '../../lib/thungRac.ts';
import type { useToast } from '../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * XOÁ VI PHẠM — MỘT đường cho mọi nơi (Sửa vi phạm › Xoá, Chi tiết vi phạm): xoá thẳng + làm mới + toast Hoàn tác (Thùng rác 30 ngày). DUONG-LUI-2 (B1-10):
 * bỏ hộp "Xoá vi phạm này?" — đã có Hoàn tác (như Xoá Case / PA); hậu quả với lần xử lý (PR-YT4 V4-12: lần xử lý vẫn giữ, bậc không lùi) nói trong toast.
 * Lỗi để nơi gọi xử lý. `imLang`: Hoàn tác của lần TẠO (RecordViolationPanel) — không toast xoá thứ hai, nơi gọi tự báo "Đã hoàn tác".
 */
export async function xoaViPham(toast: ReturnType<typeof useToast>, violationId: number, imLang = false): Promise<void> {
  const r = await api.del<{ thungRacId?: number; removedFromMeasures?: number }>(`/violations/${violationId}`);
  const lamMoi = () => { invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc'); };
  lamMoi();
  if (!imLang) hoanTacXoa(toast, r?.thungRacId, r?.removedFromMeasures ? t('Đã xoá vi phạm · lần xử lý vẫn giữ, bậc không lùi') : t('Đã xoá vi phạm'), lamMoi);
}
