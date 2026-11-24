/** N71 (chủ SP 25/11) — đường vào lớp đã kết thúc: dòng "Đã kết thúc" ở Lớp của tôi, link hồ sơ lớp cũ ở Hành trình. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_N71 = {
  'Kết thúc {ngay}': (b) => `Finished ${b.ngay}`,
  'Hồ sơ lớp ›': 'Class profile ›',
  'chỉ xem; việc còn của bạn vẫn làm được': 'view only; your open tasks can still be done',
  'Lưu là Case hoàn thành — không thêm PA, không chuyển việc.': 'Saving completes the Case — no more plans, no handover.',
  'Lưu là PA kết thúc': 'Saving ends this plan',
} satisfies Record<string, Dich>;
