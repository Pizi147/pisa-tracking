/** BAC-Y-THUC (N36, chủ SP 05/11) — ô "Reset bậc vi phạm" khi chuyển lộ trình từ lớp thường. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_BAC_Y_THUC = {
  'Reset bậc vi phạm': 'Reset discipline level',
  'Đang ở {bac}': 'Currently at {bac}',
  '{n} em đang có bậc': '{n} students have a level',
  /* GD-4d — thang dạng vạch (`ThangVach`), panel Xác nhận xử lý ⑤ D1a. */
  'Thang xử lý': 'Action ladder',
  'Thang xử lý: {ds} — {x}': 'Action ladder: {ds} — {x}',
  'đã tới {nhan}': 'reached {nhan}',
  '{nhan} · bậc kế': '{nhan} · next level',
} satisfies Record<string, Dich>;
