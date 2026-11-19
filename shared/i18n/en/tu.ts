/** TU-a — Tutor: Ghi kết quả PA Tutor (3 ô, đánh giá), ô chọn tutor, lịch sử Case, vai Head tutor. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_TU = {
  'Có chuẩn bị bài': 'Prepared the lesson',
  'Xin tài liệu đúng hạn': 'Asked for materials on time',
  'Gửi feedback về HV cho GV': 'Sent student feedback to the teacher',
  'Chuẩn bị': 'Prepared',
  'Tài liệu': 'Materials',
  'Feedback GV': 'Teacher feedback',
  'Tutor khác': 'Other tutor',
  'Hình thức': 'Mode',
  'Tutor buổi này': 'Tutor this session',
  'Cả 3 Có': 'All 3 Yes',
  'Đánh giá tutor': 'Rate tutor',
  'tuỳ chọn': 'optional',
  'Đánh giá': 'Rating',
  'Nhận xét về tutor': 'Comment on the tutor',
  'Về tutor: {nx}': (b) => `On the tutor: ${b.nx}`,
  'Chưa có nơi dạy': 'No teaching location yet',
  'Gợi ý': 'Suggested',
  'Nhân viên': 'Staff',
} satisfies Record<string, Dich>;
