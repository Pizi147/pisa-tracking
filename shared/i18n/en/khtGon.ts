/** KHT-GON (chủ SP duyệt mockup `thiet-ke/v7/ke-hoach-test.html` #659, 28/10): Kế hoạch Test bản gọn. */
import type { Dich } from '../en.ts';

export const EN_KHT_GON = {
  'xếp lại {x}': 'reschedule {x}',
  'không thi {x}': 'not taking {x}',
  '{x} riêng · {tuan}': '{x} separate · {tuan}',
  'vắng {x} · {tuan}': 'absent {x} · {tuan}',
  'Xếp MT{n}': 'Schedule MT{n}',
  'Xếp {tuan}': 'Schedule {tuan}',
  'có điểm': 'scored',
  'Bấm để xem / khôi phục': 'Click to view / restore',
  'Đợt này không có kỹ năng nào': 'No skill in this round',
  'không thi trong đợt': 'not in this round',
  'Đã xong — Overall, ✓ đạt / ✗ chưa đạt kỳ vọng; không có Overall ghi "xong"': 'Done — Overall, ✓ met / ✗ below expectation; without Overall it says "done"',
  'Đã xếp, chưa tới tuần': 'Scheduled, week not reached yet',
  'Đang làm bài tuần này': 'Sitting this week',
  'Qua hạn chấm, còn bài chưa có điểm': 'Past marking deadline, some papers unscored',
  'Ô đặc = có điểm · viền đứt = chưa có điểm · chữ gạch = không thi trong đợt': 'Filled = scored · dashed = not scored · struck = not in this round',
  'Đã vắng, đã dời — hết ghi khi đủ điểm; chữ vàng "xếp lại" = Quản lý cần xếp lại': 'Was absent, moved — gone once all scored; amber "reschedule" = manager must reschedule',
} satisfies Record<string, Dich>;
