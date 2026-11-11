/** NHAP-KQ-PA (chủ SP 13/11): Lưu nháp kết quả PA trên máy chủ. */
import type { Dich } from '../en.ts';

export const EN_NHAP_KQ_PA = {
  'Lưu nháp': 'Save draft',
  'Có nháp': 'Draft',
  'Nháp lưu {ngay} · {ten}': 'Draft saved {ngay} · {ten}',
  'Đã lưu nháp · chưa chốt': 'Draft saved · not final',
  'Phương án này đã khép — không lưu nháp được.': 'This plan is closed — cannot save a draft.',
} satisfies Record<string, Dich>;
