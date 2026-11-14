/** GD-4 (Overhaul V6, mockup ⑤): bộ thành phần chung — vạch hạn dòng việc, nút Ý thức, thang cấp bậc, badge tab Chấm Speaking. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_GD4 = {
  'Không hạn': 'No due date',
  'Xoá chữ': 'Clear text',
  '{n} bài, {q} quá hạn': (b) => `${b.n} items, ${b.q} overdue`,
} satisfies Record<string, Dich>;
