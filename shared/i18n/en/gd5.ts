/** GD-5 (Overhaul V6, mockup ⑤ khu A): ô chọn có tìm chung — nhóm liên quan trước, chọn nhiều, trạng thái tải / rỗng / lỗi. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_GD5 = {
  'GV của lớp': 'Class teachers',
  'GV Speaking của lớp': 'Speaking teachers of the class',
  'GV Speaking chi nhánh': 'Speaking teachers of the branch',
  'Cùng chi nhánh': 'Same branch',
  'Chi nhánh khác': 'Other branches',
  'Không tải được': 'Could not load',
  'Không thấy “{chu}”': (b) => `Nothing matches “${b.chu}”`,
  'Chỉ tìm {ai} có vai trong phạm vi của bạn': (b) => `Only ${b.ai} with a role in your scope are searched`,
  'Chưa có ai để chọn': 'Nothing to choose yet',
  'Gõ để tìm thêm': 'Type to find more',
  'Tối đa {n} {dv} một lần': (b) => `At most ${b.n} ${b.dv} at a time`,
  '✓ đã chọn': '✓ selected',
  'bỏ bớt một {dv}': (b) => `remove one ${b.dv} first`,
  'Xong · {n} {dv}': (b) => `Done · ${b.n} ${b.dv}`,
  'Gõ mã lớp…': 'Type a class code…',
  'Gõ ít nhất 2 chữ của tên em': 'Type at least 2 letters of the name',
  'Gõ tên để tìm': 'Type a name to search',
  'mục': 'items',
  'Gõ tên TVV…': 'Type a consultant name…',
  'TVV chi nhánh': 'Branch consultants',
  'Đang chạy': 'Running',
  'Gõ tên tutor…': 'Type a tutor name…',
  'Tên gần giống': 'Similar names',
  'Chưa xong': 'Not done',
} satisfies Record<string, Dich>;
