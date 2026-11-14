import { HOAN_TAC_VANG_MS } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { api, invalidate } from '../../lib/api.ts';

type Toast = { push: (kind: 'ok' | 'error', text: string, opts?: { key?: string; ms?: number; demLui?: boolean; hanhDong?: { nhan: string; onBam: () => void } }) => void };

/**
 * LG-9 (chủ SP 15/11): "Huỷ" / "Khôi phục" một môn bài lớp thường (gồm MT0 lớp thường) đang vắng — MỘT bấm, không hộp xác nhận;
 * Huỷ có Hoàn tác 10 giây như "-". Cùng một hàm cho lưới lớp thường, trang bài lớp thường và trang MT0.
 */
export async function guiHuyTay(toast: Toast, o: { attemptId: number; skill: string; mon: string; tenHv?: string | null; huy: boolean; onDone?: () => void }) {
  try {
    await api.post(`/attempts/${o.attemptId}/skills/${o.skill}/huy-tay`, { huy: o.huy });
  } catch (e: any) { toast.push('error', e.message); return; }
  invalidate('/regular'); invalidate('/classes'); invalidate('/attempts'); invalidate('/students'); invalidate('/my-work');
  o.onDone?.();
  const ai = o.tenHv ? ` · ${o.tenHv}` : '';
  toast.push('ok', o.huy ? t('Đã huỷ {mon}{ai}', { mon: o.mon, ai }) : t('Đã khôi phục {mon}{ai}', { mon: o.mon, ai }), {
    key: `huy-tay:${o.attemptId}:${o.skill}`,
    ...(o.huy ? { ms: HOAN_TAC_VANG_MS, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: () => void guiHuyTay(toast, { ...o, huy: false }) } } : {}),
  });
}
