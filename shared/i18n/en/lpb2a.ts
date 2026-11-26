/** LPB-2a (N73, mockup v28 L3 / L4): panel BPXL "Nhận thông tin" — Chuyển lớp / Đổi GV. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_LPB2A = {
  'Đổi GV': 'Teacher change',
  'vào {tuan}': (b) => `from ${b.tuan}`,
  'Đã xác nhận · {lop} · {ngCanh}': (b) => `Confirmed · ${b.lop} · ${b.ngCanh}`,
  'Xác nhận đã nhận': 'Confirm received',
  'bấm lại': 'tap again',
  'Việc đã đóng': 'Task closed',
  'lịch đổi GV đã huỷ': 'teacher change cancelled',
  'không còn em chuyển vào lớp': 'no students moving into this class',
  'Không còn em nào trong việc này.': 'No students left in this task.',
  'Học viên chuyển lớp': 'Students changing class',
  'Lịch Mock đã xếp': 'Mock tests scheduled',
  'Mở tuyến của {ten}': (b) => `Open the track of ${b.ten}`,
  'Đóng tuyến của {ten}': (b) => `Close the track of ${b.ten}`,
  'đã huỷ chuyển': 'move cancelled',
  'đã đổi lớp đích': 'target class changed',
  'đi theo em': 'moves with the student',
  'ở lại lớp cũ': 'stays in the old class',
  'Giáo viên đổi': 'Teachers changed',
  'Môn / kỹ năng': 'Subject / skill',
} satisfies Record<string, Dich>;
