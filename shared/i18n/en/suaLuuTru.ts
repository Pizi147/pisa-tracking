/** SUA-LUU-TRU (chủ SP 07/11) — sửa HV lưu trữ: thi thật · Hoàn tác · Khôi phục bản trước · đổi bước tiếp. Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_SUA_LUU_TRU = {
  'Kết quả đã đổi — xem lại bước tiếp?': 'Result changed — review next step?',
  'Đã lưu kết quả thi thật': 'Real exam result saved',
  'Đã hoàn tác kết quả thi thật': 'Real exam result undone',
  'Đã khôi phục bản trước': 'Previous version restored',
  'Khôi phục bản trước': 'Restore previous version',
  'Bản trước không hợp lệ.': 'Invalid previous version.',
  'Không tìm thấy bản trước.': 'Previous version not found.',
  'Bản này ghi trước khi có Khôi phục — sửa tay ở Kết quả thi thật.': 'This entry predates Restore — edit it by hand in Real exam result.',
  'Đã có người sửa kết quả sau lần lưu này — mở Lịch sử để khôi phục đúng bản.': 'Someone edited the result after this save — open History to restore the right version.',
  /* SUA-LUU-TRU b */
  'Tạm dừng · ở Lưu trữ — lộ trình chỉ xem': 'Paused · in Archive — learning path view only',
  'Học viên đã lưu trữ{ngay} — lộ trình chỉ xem': 'Student archived{ngay} — learning path view only',
} satisfies Record<string, Dich>;
