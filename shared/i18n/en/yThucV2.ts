/** Y-THUC-V2 (mockup 11/11, chủ SP duyệt) — tab Ý thức hồ sơ lớp / HV: một lần = một khối, GV đọc Nội dung Báo PH. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_Y_THUC_V2 = {
  'GVCN xử lý': 'Homeroom action',
  'TVV báo PH': 'Consultant → parent',
  'Xảy ra': 'Happened',
  'Bấm để mở · Sửa · Xoá': 'Click to open · Edit · Delete',
  'ghi {ngay}': 'logged {ngay}',
  'Xem đủ · {n} lần ghi': 'See all · {n} entries',
  'Xem đủ': 'See all',
  'Chờ {vai}': 'Waiting for {vai}',
  'Đề xuất {nhan} · chờ QL': 'Proposed {nhan} · awaiting manager',
  'QL trả lời trước {ngay}': 'Manager replies by {ngay}',
  'Báo PH sinh khi nào': 'When the parent-report task appears',
  'GVCN lưu xử lý (kể cả đề xuất chờ QL) → TVV của em có việc Báo PH, hạn 5 ngày. TVV ghi Nội dung: đã báo gì, PH nói gì.':
    'When the homeroom teacher saves an action (including a proposal awaiting the manager), the student\'s consultant gets a parent-report task due in 5 days. The consultant writes the Content: what was told and what the parent said.',
  'Xong · 7 ngày': 'Done · 7 days',
  'Thang · {ten}': 'Ladder · {ten}',
  'Không còn vi phạm nào cần làm': 'No violations left to handle',
} satisfies Record<string, Dich>;
