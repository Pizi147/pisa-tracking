/** R1-NO-CU — đổi người phụ trách Case (đặc tả 27/10 mục 4.5, D17). Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_R1_NO_CU = {
  'Chọn người phụ trách.': 'Pick an owner.',
  'Thiếu người phụ trách hiện tại — tải lại.': 'Current owner is missing — reload.',
  'Chỉ Quản lý hoặc GVCN của lớp em đổi được người phụ trách Case.': 'Only the class manager or homeroom teacher can change the case owner.',
  'Case đã đóng.': 'The case is closed.',
  'Người phụ trách vừa đổi — tải lại.': 'The owner was just changed — reload.',
  'Người này đang phụ trách Case.': 'This person already owns the case.',
  'Chỉ chọn GV dạy kỹ năng của Case ở lớp em hoặc GVCN.': 'Pick a teacher of this skill in the class, or the homeroom teacher.',
} satisfies Record<string, Dich>;
