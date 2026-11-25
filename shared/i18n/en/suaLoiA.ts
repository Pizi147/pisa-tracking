/** SUA-LOI-A (rà ngoài 25/11) — trạng thái lỗi + Thử lại: đếm trước Báo cáo PH, ô Quá hạn chấm. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_SUA_LOI_A = {
  'Chưa đếm được.': 'Could not count.',
  'Chưa tải được số quá hạn. Thử lại': 'Could not load the overdue count. Retry',
} satisfies Record<string, Dich>;
