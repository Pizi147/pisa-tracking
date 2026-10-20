/** OV-15h2 — Học viên & Lớp + xuất + dọn (chọn HV để xuất, chốt lịch thi, Bộ lọc thêm, Dán từ Excel lớp thường). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15H2 = {
  'chốt {ngay}': (b) => `set ${b.ngay}`,
  'Bạn không được phân công môn này': 'You are not assigned to this subject',
  'Ô đang "-" (đã dời tuần) — gỡ dấu ở lưới trước': 'Cell is "-" (moved to another week) — clear the mark in the grid first',
  'Số câu đúng là số nguyên (vd 24 hoặc 24/40)': 'Correct answers must be a whole number (e.g. 24 or 24/40)',
  'Chưa có tổng câu — dán dạng 24/40': 'No total yet — paste as 24/40',
  'Tổng câu phải lớn hơn 0': 'Total must be greater than 0',
  'Đợt đã hoàn tất — chỉ Quản lý sửa được điểm': 'Round completed — only a Manager can change scores',
  'Điểm = số câu đúng (24 — tổng lấy từ cột) hoặc 24/40; "-" = em không làm bài (môn dời sang tuần sau). Ô trống được bỏ qua, không thành 0.':
    'Score = correct answers (24 — total taken from the column) or 24/40; "-" = did not sit (subject moves to next week). Empty cells are skipped, never 0.',
  'Bài này không có môn này': 'This test has no such subject',
  'Lớp thường: cột theo môn của lớp; điểm = số câu đúng (tổng lấy từ cột) hoặc <b>24/40</b>; <b>-</b> = em không làm bài (môn dời sang tuần sau).':
    'Normal classes: one column per subject of the class; score = correct answers (total taken from the column) or <b>24/40</b>; <b>-</b> = did not sit (subject moves to next week).',
  'Số câu đúng ({a}) lớn hơn tổng ({b})': (b) => `Correct answers (${b.a}) exceed the total (${b.b})`,
} satisfies Record<string, Dich>;
