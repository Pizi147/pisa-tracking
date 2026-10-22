/** V5 UI-CONG-VIEC — trang Công việc theo mockup V5: đầu trang đếm việc, vạch hạn, theo dõi / làm thay. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_UI_CONG_VIEC = {
  'nhóm': 'groups',
  'Bài thi Speaking tuần này': 'Speaking tests this week',
  'BÀI THI SPEAKING': 'SPEAKING TESTS',
  '⚠ {n} hạn hôm nay': '⚠ {n} due today',
  'Hạn đến {ngay}': 'Due by {ngay}',
  'Hạn sau {ngay}': 'Due after {ngay}',
  'Mọi hạn': 'Any due date',
  'Lọc theo hạn': 'Filter by due date',
  'Nhập hộ': 'Enter for them',
  'Làm thay': 'Do it for them',
  'THEO DÕI': 'WATCHING',
  'Em này còn:': 'Also for this student:',
  'Đang xem việc của': 'Viewing tasks of',
  '— chế độ theo dõi.': '— watch mode.',
  'Bạn không có việc đang mở.': 'You have no open tasks.',
  'Không còn việc đang mở': 'No open tasks left',
  'Chọn một việc ở danh sách để làm tại đây.': 'Pick a task from the list to work on it here.',
  'người phụ trách': 'the owner',
  'mở {ngan}': 'opened {ngan}',
  'Đang làm thay {ai}.': 'Working on behalf of {ai}.',
  'Việc của {ai} — chỉ theo dõi.': 'Task of {ai} — watch only.',
} satisfies Record<string, Dich>;
