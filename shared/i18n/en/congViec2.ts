/** CONG-VIEC-2 — Công việc ba tầng (mockup `thiet-ke/v7/cong-viec-2.html`, chủ SP duyệt #621). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_CONG_VIEC_2 = {
  'Mở hồ sơ {ten}': 'Open profile of {ten}',
  '+ {n} việc ở {nhom}': '+ {n} task(s) in {nhom}',
  'Hết việc {nhom} của bạn': 'No more {nhom} tasks for you',
  'Còn: {nhom} · {n} việc': 'Left: {nhom} · {n} task(s)',
  'Đã xong phần của bạn': 'Your part is done',
  '{n} yêu cầu': '{n} request(s)',
  'Đã lưu {n} việc trong nhóm này hôm nay.': '{n} task(s) in this group saved today.',
  '‹ Xem lại việc vừa lưu': '‹ Review the task just saved',
} satisfies Record<string, Dich>;
