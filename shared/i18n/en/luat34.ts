/** LUAT-34 — sửa sau lưu (Luật 3) + "-" Mock Test (Luật 4 sửa 21/10). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_LUAT34 = {
  'Đã huỷ · vắng MT cũ': 'Cancelled · absent (past MT)',
  'Đã huỷ · vắng MT cũ · {mon}{em}': (b) => `Cancelled · absent (past MT) · ${b.mon}${b.em}`,
  'Khôi phục điểm': 'Restore score',
  'Đủ điểm': 'All scored',
  'Đã khôi phục điểm {x}{x2}': (b) => `Score restored ${b.x}${b.x2}`,
  'Mọi kỹ năng đã có điểm hoặc "-" — vẫn sửa được.': 'All skills scored or "-" — still editable.',
  'Ghi "-" cho {mon} và chốt ngay. Lần đầu máy tự dời sang tuần kế tiếp (tuần đó đã qua thì gửi Quản lý); lần 2 huỷ phần thi này.': (b) => `Record "-" for ${b.mon} and settle now. First time it moves to the next week (if that week has passed, it goes to the Manager); second time cancels this part.`,
  'Ô điểm trở về trống; nhận xét giữ. Lấy lại bằng ⋯ "Khôi phục điểm".': 'The score cell is cleared; the comment stays. Bring it back with ⋯ "Restore score".',
} satisfies Record<string, Dich>;
