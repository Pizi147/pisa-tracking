/** SL2 — một phạm vi một trang · một "SOS hiện tại" · đơn vị cạnh số. Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_SL2 = {
  'hiện tại': 'now',
  'Không có học viên SOS': 'No students in SOS',
  'cả hai khung': 'both tracks',
  '{khung}: {n} việc': (b) => `${b.khung}: ${b.n} task${b.n === 1 ? '' : 's'}`,
  'SOS trong kỳ': 'SOS in period',
  'trong đó {n} tạm': (b) => `incl. ${b.n} provisional`,
  '{n} tạm': (b) => `${b.n} provisional`,
  ' · mọi chi nhánh': ' · all branches',
} satisfies Record<string, Dich>;
