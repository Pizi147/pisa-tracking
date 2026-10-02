import { ApiError, api } from './api.ts';

/**
 * NHẮC TẤT CẢ (Q-B): gửi cả lô tới `/my-work/nhac-nhieu`, báo MỘT toast kết quả (+ mỗi dòng lỗi một toast). Trả danh sách khoá đã nhắc
 * (kèm giờ) cho nơi gọi cập nhật dòng; lỗi mạng → toast, trả rỗng.
 */
export async function nhacTatCa(
  dong: { key: string; ownerId: number }[],
  toast: { push: (k: 'ok' | 'error', m: string) => void },
): Promise<{ key: string; daNhacLuc: string }[]> {
  try {
    const r = await api.post<{ ok: { key: string; daNhacLuc: string }[]; loi: { key: string; loi: string }[] }>('/my-work/nhac-nhieu', { dong });
    if (r.ok.length) toast.push('ok', `Đã nhắc ${r.ok.length} việc`);
    for (const l of r.loi) toast.push('error', l.loi);
    return r.ok;
  } catch (e: any) {
    toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối, chưa nhắc được. Thử lại sau.');
    return [];
  }
}
