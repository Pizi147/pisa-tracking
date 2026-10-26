/** R1-LUU-TIEP — Lưu · bài tiếp / việc tiếp (thiết kế deploy-ux 26/10 mục 4.1). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R1_LUU_TIEP = {
  'Lưu · bài tiếp ›': 'Save & next ›',
  'Lưu · việc tiếp ›': 'Save & next task ›',
  'Lưu · em tiếp ›': 'Save & next student ›',
  'Lưu · đóng': 'Save & close',
  'Bài tiếp ›': 'Next ›',
  'Em tiếp ›': 'Next student ›',
  'Lớp tiếp: {lop} ›': 'Next class: {lop} ›',
  '✓ Đã lưu': '✓ Saved',
  'Đã xong phần của bạn · {phamVi}: đã lưu {n} bài': 'Your part is done · {phamVi}: {n} saved',
  'Tiếp: {x}': 'Next: {x}',
  'Ô còn trống — nhập điểm hoặc Vắng': 'Empty — enter a score or mark Absent',
  '‹ Về {x}': '‹ Back to {x}',
  'Lưu điểm · đóng': 'Save score & close',
  'Ô này đang lưu — chờ một chút rồi bấm lại.': 'This cell is still saving — wait a moment and try again.',
} satisfies Record<string, Dich>;
