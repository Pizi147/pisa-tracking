/** UX-2 — tiếp đánh giá UX 16/10 (chủ SP). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_UX2 = {
  'Case chưa chốt PA quá hạn': 'Overdue cases with PA not confirmed',
  'Fast Track: em có ít nhất một kỹ năng có band dưới kỳ vọng của CHÍNH em ở đợt Test mới nhất hợp lệ (kỳ vọng tính từ Target: MT1 = Target − 1.0, MT2 = Target − 0.5…). Khác "Chưa đạt" của lớp thường: lớp thường so với một ngưỡng chung, không theo Target.':
    'Fast Track: the student has at least one skill with a band below THEIR OWN expected band in the latest valid Test (expected from Target: MT1 = Target − 1.0, MT2 = Target − 0.5…). Unlike "Not passed" in regular classes, which compares against one shared threshold, not Target.',
  'Lớp thường: em có ít nhất một môn dưới {pct}% số câu đúng ở bài Test mới nhất hợp lệ — ngưỡng chung cho mọi em, không theo Target. Khác "Dưới kỳ vọng" của Fast Track: FT so band với kỳ vọng riêng từng em.':
    (b) => `Regular classes: the student has at least one subject below ${b.pct}% correct in the latest valid Test — one threshold for everyone, not Target. Unlike "Below expected" in Fast Track, which compares bands with each student's own expected band.`,
} satisfies Record<string, Dich>;
