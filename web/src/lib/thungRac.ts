import { api, invalidate } from './api.ts';
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

/** Q-RL2b: đường dữ liệu tải lại khi xoá / khôi phục học viên (danh sách, lớp, Lưu trữ, Tổng quan, việc, Case, thùng rác). */
export function lamMoiHocVien() {
  for (const k of ['/students', '/hoc-vien-lop', '/classes', '/tong-quan', '/my-work', '/cases', '/lenh-chuyen', '/thung-rac']) invalidate(k);
}

/**
 * Q-RL2b: Hoàn tác cả lô Xoá học viên — khôi phục lần lượt từng id thùng rác (chỉ em đã xoá mới có id), báo một câu tổng.
 * `lamMoi(daKhoiPhuc)` nhận các id đã khôi phục được (nơi gọi bỏ chúng khỏi lô, Thử lại sau đó không khôi phục trùng).
 */
export function hoanTacXoaLo(toast: ReturnType<typeof useToast>, ids: readonly number[], chu: string, key: string, lamMoi: (daKhoiPhuc: number[]) => void) {
  if (!ids.length) { toast.push('ok', chu, { key }); return; }
  toast.hoanTac(chu, async () => {
    const xong: number[] = []; const loi: string[] = [];
    for (const id of ids) {
      try { await api.post(`/thung-rac/${id}/khoi-phuc`); xong.push(id); } catch (e: any) { loi.push(e?.message ?? t('Chưa hoàn tác được — thử lại.')); }
    }
    lamMoi(xong);
    toast.push(loi.length ? 'error' : 'ok', loi.length
      ? t('Khôi phục {ok}, lỗi {loi}: {ly}', { ok: xong.length, loi: loi.length, ly: loi[0] })
      : t('Đã khôi phục {n} học viên', { n: xong.length }), { key });
  }, { key });
}
