/** PR-4 THI-THAT (chủ SP 05/11) — tab Thi thật: Exceed / Đạt / Fail, Theo GV. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_THI_THAT = {
  'HV thi': 'Students sat',
  '{nhan} · {n} HV': (b) => `${b.nhan} · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'tuần dạy {a}/{b}': 'taught {a}/{b} weeks',
  '{nhan} · {ai} · {dung}/{tong} lượt kỹ năng': '{nhan} · {ai} · {dung}/{tong} skill results',
} satisfies Record<string, Dich>;
