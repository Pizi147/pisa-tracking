/** BPXL-2 (N57, mockup `thiet-ke/v22/bpxl-trang-dau.html`): dải số lặng Kế hoạch Test, ô số hàng lớp, ô MT vắng (N38), tin chuông vắng gộp. */
import type { Dich } from '../en.ts';

export const EN_BPXL2 = {
  'Số cần xếp': 'Scheduling numbers',
  'Chưa đủ lịch MT': 'MT schedule incomplete',   // N63 ⑥: em chưa đủ MT của lộ trình (xếp MT1 xong vẫn đếm nếu còn thiếu)
  'Chưa đủ lịch MT · {n} em': (b) => `MT schedule incomplete · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'Vắng tuần này': 'Absent this week',
  'Vắng · {n} em': (b) => `Absent · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'Chỉ lớp Fast Track.': 'Fast Track classes only.',   // B2-12: ⓘ phạm vi "Bài chưa nhập điểm" ở dải BPXL
  'Lọc: {x}': 'Filter: {x}',
  'Bỏ lọc {x}': 'Clear filter {x}',
  'Không lớp nào khớp "{x}"': 'No class matches "{x}"',
  'Vắng · dời {tuan}': 'Absent · moved to {tuan}',
  '{x} vắng · dời {tuan}': '{x} absent · moved to {tuan}',
  'Đã huỷ · vắng 2 lần': 'Cancelled · absent twice',
  '{x} đã huỷ · vắng 2 lần': '{x} cancelled · absent twice',
  '{x} vắng': '{x} absent',
  '{n} em vắng': '{n} absent',
  'cả {n} đã dời sang {tuan}': 'all {n} moved to {tuan}',
  '{n} đã dời': '{n} moved',
  '{n} đã huỷ': '{n} cancelled',
  'vắng lần 2 · đã huỷ': 'absent twice · cancelled',
  '{x} vắng · đã dời sang {tuan}': '{x} absent · moved to {tuan}',
  'Mở {x}': 'Expand {x}',
  'đã huỷ': 'cancelled',
} satisfies Record<string, Dich>;
