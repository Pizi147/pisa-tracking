/** CHUONG-V2 (chủ SP 11/11) — chuông: Việc cần làm theo loại + Cập nhật. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_CHUONG_V2 = {
  'Yêu cầu': 'Request',
  'Trước đó': 'Earlier',
  'Tự duyệt': 'Self-approved',
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
  /* GD-19 (mockup ⑪): thanh theo tab, ✓ đã xem, Đã xem hết, gom vi phạm theo lớp. */
  'Đã xem hết {n} tin': (b) => `Marked ${so(b.n, 'update', 'updates')} as seen`,
  'GVCN không xử lý': 'Homeroom teacher declined',
  'Đã xem: {x}': 'Seen: {x}',
  '{n} vi phạm mới · {lop}: {ten}, {luc}': (b) => `${so(b.n, 'new incident', 'new incidents')} · ${b.lop}: ${b.ten}, ${b.luc}`,
  'Thu gọn {n} vi phạm mới · {lop}': 'Collapse {n} new incidents · {lop}',
  'Mở {n} vi phạm mới · {lop}': 'Expand {n} new incidents · {lop}',
  'Đã xem cả {n} vi phạm mới · {lop}': 'Mark all {n} new incidents · {lop} as seen',
  'Thu gọn {x}': 'Collapse {x}',
  'Mở {n} việc gấp nhất của {x}': 'Show {n} most urgent tasks in {x}',
  '+ {n} việc': '+ {n} more',
  'Đã xem hết': 'Mark all seen',
  'Chưa hoàn tác được — thử lại.': 'Could not undo — try again.',
} satisfies Record<string, Dich>;
