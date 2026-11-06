import { useCallback } from 'react';
import { useSession } from '../../lib/session.tsx';
import { api } from '../../lib/api.ts';

/* TAI-NHANH-0611: tệp riêng (không nằm cạnh nội dung Hướng dẫn) — thanh trên cần chấm "chưa xem" mà không kéo ~90 KB chữ hướng dẫn vào gói chính. */
/** Ghi "đã mở Hướng dẫn" một lần cho tài khoản (hết chấm trên nút "?"). Trả false khi lưu lỗi. */
export function useDaXemHd() {
  const { session, reload } = useSession();
  const chuaXem = !!session?.authenticated && session.daXemHuongDan === false;
  return {
    chuaXem,
    ghi: useCallback(async () => {
      try { await api.patch('/me/profile', { daXemHuongDan: true }); await reload(); return true; } catch { return false; }
    }, [reload]),
  };
}
