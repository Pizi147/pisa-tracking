import { api, invalidate } from '../../../lib/api.ts';
import type { useToast } from '../../../ui/Toast.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * XOÁ / KHÔI PHỤC MỘT MT (chủ SP 06/11) — MỘT đường, MỘT hành vi ở Kế hoạch Test (⋯ hộp một đợt, ô "Đã xoá") và hồ sơ MT (⋯ đầu trang, dải
 * "Đã xoá"). Xoá không hỏi lại: ô vẫn ở đó, mờ "Đã xoá" + Khôi phục bấm ngay, toast Hoàn tác (CLAUDE.md: xác nhận chỉ khi hậu quả lớn).
 */
type Toast = ReturnType<typeof useToast>;
type Mt = { attemptId: number; nhan: string; tenHv: string; onXong: () => void };

const lamMoi = () => { for (const k of ['/ke-hoach-test', '/attempts', '/cham', '/cycles', '/tong-quan', '/my-work']) invalidate(k); };

export async function xoaMt(toast: Toast, o: Mt): Promise<boolean> {
  try {
    const r = await api.post<{ kyNang: string[] }>(`/attempts/${o.attemptId}/xoa`, {});
    lamMoi(); o.onXong();
    toast.hoanTac(t('Đã xoá {dot} · {ten}', { dot: o.nhan, ten: o.tenHv }), () => void khoiPhucMt(toast, { ...o, kyNang: r.kyNang }));
    return true;
  } catch (e: any) {
    toast.push('error', e?.message ?? t('Chưa xoá được — thử lại.'));
    return false;
  }
}

/** `kyNang` (Hoàn tác): chỉ các kỹ năng vừa xoá; trống = mọi kỹ năng đã xoá / huỷ của MT. */
export async function khoiPhucMt(toast: Toast, o: Mt & { kyNang?: string[] }): Promise<boolean> {
  try {
    await api.post(`/attempts/${o.attemptId}/dua-lai-ca-luot`, o.kyNang ? { kyNang: o.kyNang } : {});
    lamMoi(); o.onXong();
    toast.push('ok', t('Đã khôi phục {dot} · {ten}', { dot: o.nhan, ten: o.tenHv }));
    return true;
  } catch (e: any) {
    toast.push('error', e?.message ?? t('Chưa khôi phục được — thử lại.'));
    return false;
  }
}
