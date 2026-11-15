import { useCallback } from 'react';
import { useSession } from '../../lib/session.tsx';
import { api } from '../../lib/api.ts';
import { PHIEN_BAN_HD } from '@shared/huongDan/kieu.ts';

/* TAI-NHANH-0611: tệp riêng (không nằm cạnh nội dung Hướng dẫn) — thanh trên cần chấm "chưa xem" mà không kéo ~90 KB chữ hướng dẫn vào gói chính. */
/**
 * HD3-1 "Có gì mới" (15 mục 4.8, [XM-6]): tài khoản nhớ SỐ PHIÊN BẢN nội dung đã xem (0 = chưa mở lần nào). Nhỏ hơn `PHIEN_BAN_HD` → chấm trên "?".
 * `ghi` lưu phiên bản hiện tại (hết chấm). Trả false khi lưu lỗi.
 */
export function useDaXemHd() {
  const { session, reload } = useSession();
  const daXem = session?.daXemHuongDan ?? 0;
  return {
    daXem,
    chuaXem: !!session?.authenticated && daXem < PHIEN_BAN_HD,
    ghi: useCallback(async () => {
      try { await api.patch('/me/profile', { daXemHuongDan: PHIEN_BAN_HD }); await reload(); return true; } catch { return false; }
    }, [reload]),
  };
}
