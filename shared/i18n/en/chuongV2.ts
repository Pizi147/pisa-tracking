/** CHUONG-V2 (chủ SP 11/11) — chuông: Việc cần làm theo loại + Cập nhật. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_CHUONG_V2 = {
  'Yêu cầu': 'Request',
  'Trước đó': 'Earlier',
  'Tự duyệt': 'Self-approved',
  'Duyệt dời lịch': 'Approve reschedule',
  'Lịch lớp': 'Class schedule',
  'Xem tất cả': 'See all',
  '{n} chưa đọc': '{n} unread',
  'Không còn việc nào': 'No tasks left',
  '{n} mới': '{n} new',
  '{n} hôm nay': '{n} due today',
  'Về Việc cần làm': 'Back to tasks',
  ', {n} việc cần làm ngay': (b) => `, ${so(b.n, 'task due now', 'tasks due now')}`,
  'Không tải được cập nhật.': 'Could not load updates.',
  'tài khoản': 'accounts',
} satisfies Record<string, Dich>;
