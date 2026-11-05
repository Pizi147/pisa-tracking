/** PR-4 THI-THAT (chủ SP 05/11) — tab Thi thật: Exceed / Đạt / Fail, Theo GV. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_THI_THAT = {
  'HV thi': 'Students sat',
  '{nhan} · {n} HV': (b) => `${b.nhan} · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
} satisfies Record<string, Dich>;
