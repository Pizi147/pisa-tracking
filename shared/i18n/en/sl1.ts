/** SL1 — số liệu đúng + chuông N1. Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_SL1 = {
  '(tiếp)': '(cont.)',
  ', {n} việc cần làm': (b) => `, ${b.n} to-do${b.n === 1 ? '' : 's'}`,
  ', có tin chưa đọc': ', unread updates',
  ', {n} tin chưa đọc': (b) => `, ${b.n} unread`,
} satisfies Record<string, Dich>;
