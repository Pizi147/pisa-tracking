/** R2 (rà 24/11) — Hoàn tác các chỗ chặn cứng. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R2_HOAN_TAC = {
  'Đã thêm {n} học viên': 'Added {n} students',
  'Bỏ {ok} học viên, lỗi {loi}: {ly}': 'Removed {ok} students, {loi} failed: {ly}',
  'Đã bỏ {n} học viên vừa thêm': 'Removed {n} just-added students',
  'Không còn lô thêm học viên này.': 'This batch of added students is no longer available.',
  'Đã quá {n} phút — xoá từng em ở danh sách học viên.': 'More than {n} minutes have passed — delete students one by one from the student list.',
  'Thiếu lô cần hoàn tác.': 'Missing the batch to undo.',
} satisfies Record<string, Dich>;
