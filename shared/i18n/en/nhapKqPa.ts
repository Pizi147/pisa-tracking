/** NHAP-KQ-PA (chủ SP 13/11): Lưu nháp kết quả PA trên máy chủ. AUDIT-1454: xung đột hai phiên, kỳ đã chốt. */
import type { Dich } from '../en.ts';

export const EN_NHAP_KQ_PA = {
  'Lưu nháp': 'Save draft',
  'Có nháp': 'Draft',
  'Nháp lưu {luc} · {ten}': 'Draft saved {luc} · {ten}',
  'Đã lưu nháp · chưa chốt': 'Draft saved · not final',
  'Đang lưu nháp…': 'Saving draft…',
  'Chưa lưu · có bản nháp mới hơn': 'Not saved · a newer draft exists',
  'Bản nháp mới hơn · {luc} · {ten}': 'Newer draft · {luc} · {ten}',
  'Nháp vừa bị xoá ở phiên khác': 'The draft was just cleared in another session',
  'Bản của bạn chưa lưu, vẫn ở các ô dưới.': 'Your version is not saved — it is still in the fields below.',
  'Dùng bản mới': 'Use newer version',
  'Lưu bản của tôi': 'Save my version',
  'Vẫn lưu bản của tôi': 'Save my version anyway',
  'Phương án này đã khép — không lưu nháp được.': 'This plan is closed — cannot save a draft.',
  'Kết quả kỳ này đã được lưu — tải lại để xem, cần đổi thì bấm Sửa': 'This period’s result is already saved — reload to see it; use Edit to change it',
  'Có bản nháp mới hơn — bản của bạn chưa lưu.': 'A newer draft exists — your version was not saved.',
  'Kỳ không hợp lệ.': 'Invalid period.',
  'Bản gốc của nháp không hợp lệ.': 'Invalid draft base.',
} satisfies Record<string, Dich>;
