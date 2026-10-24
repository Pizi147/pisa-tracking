/** CV-LOI — Công việc chạy đúng (Phân công GV môn thiếu, Kết quả PA ở khung phải). Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_CV_LOI = {
  'GV {mon}': '{mon} teacher',
  'Đã phân công {nhan}': 'Assigned {nhan}',
  'Môn này vừa được giao cho {ten}.': 'This subject was just assigned to {ten}.',
  'Lớp vừa có GVCN: {ten}.': 'The class now has a homeroom teacher: {ten}.',
  '{nhan}: chọn giáo viên': '{nhan}: pick a teacher',
  '— Chưa chọn —': '— Not chosen —',
  'Giao': 'Assign',
  'Phân công': 'Assign',
  'Phân công GV {tenMon}': 'Assign {tenMon} teacher',
  'Phân công GVCN': 'Assign homeroom teacher',
  '{head} — lớp chưa có {thieu}': '{head} — class has no {thieu}',
  'Lớp chưa có GV dạy môn của Case (hoặc chưa có GVCN). Phân công xong thì Case tự về người đó.':
    'The class has no teacher for this case’s skill (or no homeroom teacher). Once assigned, the case goes to that person.',
} satisfies Record<string, Dich>;
