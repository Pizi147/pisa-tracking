/** CV-TAB — Công việc chia tab hạng mục, badge, mục theo loại việc (chủ SP 06/11, mockup `thiet-ke/v17-nhap/`). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_CV_TAB = {
  'Bài thi Speaking': 'Speaking tests',
  'Progress / Final Test': 'Progress / final tests',
  'Checkpoint': 'Checkpoints',
  'Xem vi phạm': 'Review incidents',
  'Ghi đã thực hiện': 'Record as done',
  'Thiếu dữ liệu': 'Missing data',
  'Hạng mục việc': 'Task categories',
  '{n} việc gần hạn': '{n} tasks due soon',
} satisfies Record<string, Dich>;
