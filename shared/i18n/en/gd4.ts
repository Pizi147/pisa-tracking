/** GD-4 (Overhaul V6, mockup ⑤): bộ thành phần chung — vạch hạn dòng việc, nút Ý thức, thang cấp bậc, badge tab Chấm Speaking. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_GD4 = {
  'Không hạn': 'No due date',
  'Xoá chữ': 'Clear text',
  '{n} bài, {q} quá hạn': (b) => `${b.n} items, ${b.q} overdue`,
  /* GD-4d (dòng 40d): hộp Tình hình học tập một bước. */
  'Hạn TVV': 'Consultant due',
  'Chọn em trước': 'Pick a student first',
  /* GD-4d (dòng 40b): hộp nhập Writing — công thức vào ⓘ. */
  'Task {x} chưa có': (b) => `Task ${b.x} not entered yet`,
  'Cách tính Writing': 'How Writing is calculated',
  'Đã xem · việc tiếp ›': 'Seen · next task ›',
  '<b>Tình hình học tập</b>: chọn em (tối đa 8) và gõ nội dung ngay trong một hộp, rồi <b>Gửi TVV</b>.': '<b>Learning situation</b>: pick students (up to 8) and type the message in one box, then <b>Send to consultant</b>.',
} satisfies Record<string, Dich>;
