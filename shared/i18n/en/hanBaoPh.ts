/** UI-1 HAN-BAO-PH — dòng Hạn + Sửa hạn tại chỗ (Báo PH, Meeting CX; chủ SP 03/11 N34). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_HAN_BAO_PH = {
  'Sửa hạn': 'Edit deadline',
  'Lưu hạn': 'Save deadline',
  'mặc định': 'default',
  'đã chỉnh · mặc định {ngay}': 'edited · default {ngay}',
  'Về mặc định {ngay}': 'Back to default {ngay}',
  'Chưa lưu.': 'Not saved.',
  'Ngày bạn gõ vẫn giữ trong ô.': 'The date you typed is kept in the box.',
  'Về hạn mặc định {ngay}': 'Back to default deadline {ngay}',
  'Đổi hạn {cu} → {moi}': 'Deadline {cu} → {moi}',
  'Người lưu': 'Saved by',
  'Lúc lưu': 'Saved at',
  'Ghi chú GVCN': 'Homeroom note',
} satisfies Record<string, Dich>;
