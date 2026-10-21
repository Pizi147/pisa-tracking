/** LUAT-34 — sửa sau lưu (Luật 3) + "-" Mock Test (Luật 4 sửa 21/10). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_LUAT34 = {
  'Đã huỷ · vắng MT cũ': 'Cancelled · absent (past MT)',
  'Đã huỷ · vắng MT cũ · {mon}{em}': (b) => `Cancelled · absent (past MT) · ${b.mon}${b.em}`,
  'Khôi phục điểm': 'Restore score',
  'Đủ điểm': 'All scored',
  'Đã khôi phục điểm {x}{x2}': (b) => `Score restored ${b.x}${b.x2}`,
  'Mọi kỹ năng đã có điểm — vẫn sửa được.': 'All skills scored — still editable.',
} satisfies Record<string, Dich>;
