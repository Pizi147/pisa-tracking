/** LPB-2b (N73, mockup v28 L1 / L2): dòng + bối cảnh Báo PH · Chuyển lớp, "Sau khi lưu · việc tự giao", ô tích Lưu phân công. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_LPB2B = {
  'Sau khi lưu · việc tự giao': 'After saving · tasks created',
  'Chuyển lớp · máy điền sẵn': 'Class transfer · auto-filled',
  'Huỷ chuyển lớp · máy điền sẵn': 'Transfer cancelled · auto-filled',
  'thứ Hai {ngay}': (b) => `Monday ${b.ngay}`,
  'GVCN {ten} + GV bộ môn': (b) => `Homeroom ${b.ten} + subject teachers`,
  'GV bộ môn': 'Subject teachers',
  'Chuyển ngay hôm nay: không giao việc Báo PH (TVV) và Nhận thông tin (BPXL).': 'Moving today: no Parent update (consultant) or Information (scheduler) task is created.',
  'Tạo việc bàn giao · báo BPXL': 'Create handover task · tell the scheduler',
  'Không tạo việc nào cho cặp này': 'No task is created for this pair',
  'Bàn giao · hạn {ngay}': (b) => `Handover · due ${b.ngay}`,
  'BPXL nhận thông tin · hạn {ngay}': (b) => `Scheduler receives info · due ${b.ngay}`,
} satisfies Record<string, Dich>;
