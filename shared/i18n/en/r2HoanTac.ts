/** R2 (rà 24/11) — Hoàn tác các chỗ chặn cứng. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R2_HOAN_TAC = {
  'Đã thêm {n} học viên': 'Added {n} students',
  'Bỏ {ok} học viên, lỗi {loi}: {ly}': 'Removed {ok} students, {loi} failed: {ly}',
  'Đã bỏ {n} học viên vừa thêm': 'Removed {n} just-added students',
} satisfies Record<string, Dich>;
