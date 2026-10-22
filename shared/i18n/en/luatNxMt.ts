/** LUAT-NX-MT (chủ SP 22/10, V5 `10` mục 7): nhận xét chỉ nhắc, lệch thứ tự MT chỉ nhắc, ghi chú vắng, S Ex ở Hành trình. */
import type { Dich } from '../en.ts';

export const EN_LUAT_NX_MT = {
  'Nên có nhận xét — dùng làm mô tả vấn đề trên Case': 'Add a comment — it becomes the problem description on the Case',
  'Nên chọn nhóm nguyên nhân': 'Pick a cause group',
  'nên có nhận xét': 'add a comment',
  'nên chọn nguyên nhân': 'pick a cause group',   // NEN-SUA: cùng chữ hộp chấm ("Pick a cause group")
  'Vấn đề học thuật của kỹ năng — không ghi ý thức, chuyện ngoài bài': 'Academic issues in this skill — not conduct or off-test matters',
  'vắng {tuan}': 'absent {tuan}',
  '{ten} sau MT{n}': '{ten} after MT{n}',
  'S Expert {tuan} — chỉ hiện, không tính điểm': 'Expert S {tuan} — shown only, not counted',
} satisfies Record<string, Dich>;
