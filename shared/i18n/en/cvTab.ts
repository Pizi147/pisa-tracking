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
  /* CV-TAB b — GV nhiều chi nhánh, QL xem một GV. */
  'Tất cả CN': 'All branches',
  'việc ở {cn}': 'tasks in {cn}',
  '{gv} dạy cả {cn} — việc ở đó do QL {cn} theo dõi, không hiện ở đây.': '{gv} also teaches at {cn} — tasks there are followed by the {cn} manager and are not shown here.',
} satisfies Record<string, Dich>;
