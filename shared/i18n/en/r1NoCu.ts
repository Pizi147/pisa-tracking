/** R1-NO-CU — đổi người phụ trách Case (đặc tả 27/10 mục 4.5, D17). Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_R1_NO_CU = {
  'Chọn người phụ trách.': 'Pick an owner.',
  'Thiếu người phụ trách hiện tại — tải lại.': 'Current owner is missing — reload.',
  'Chỉ Quản lý hoặc GVCN của lớp em đổi được người phụ trách Case.': 'Only the class manager or homeroom teacher can change the case owner.',
  'Case đã đóng.': 'The case is closed.',
  'Case tạm chưa là việc — chưa đổi người được.': 'Provisional case — the owner can’t be changed yet.',
  'Người phụ trách vừa đổi — tải lại.': 'The owner was just changed — reload.',
  'Người này đang phụ trách Case.': 'This person already owns the case.',
  'Chỉ chọn GV dạy kỹ năng của Case ở lớp em hoặc GVCN.': 'Pick a teacher of this skill in the class, or the homeroom teacher.',
  'phụ trách: {ten}': 'owner: {ten}',
  'Đổi người…': 'Change owner…',
  'Đã đổi người phụ trách: {ten}': 'Owner changed: {ten}',
  'Chưa chọn được người ở đây — mở hồ sơ em.': 'No one to pick here — open the student profile.',
  'Hồ sơ em ›': 'Student profile ›',
  'Đổi người phụ trách Case': 'Change case owner',
  'Mở Case → <b>Đổi người…</b> ở dải đầu → chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.':
    'Open the case → <b>Change owner…</b> in the top strip → pick a teacher of the case’s skill or the homeroom teacher → <b>Save & close</b>.',
  'Việc <b>Chọn người phụ trách</b> ở Công việc mở đúng hộp này.': 'The <b>Pick an owner</b> task in Tasks opens this same box.',
  'GVCN lớp em: mở Case → <b>Đổi người…</b> ở dải đầu → chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.':
    'Homeroom teacher of the student’s class: open the case → <b>Change owner…</b> in the top strip → pick a teacher of the case’s skill or the homeroom teacher → <b>Save & close</b>.',
} satisfies Record<string, Dich>;
