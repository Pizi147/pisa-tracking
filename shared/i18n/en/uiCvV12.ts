/** UI-CV-V12 (mockup `thiet-ke/v12/cong-viec.html`, chủ SP 05/11) — Công việc gọn: badge việc cần làm ngay (S11), nút ngắn (S5), khung chờ (S7). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_UI_CV_V12 = {
  '{n} việc cần làm ngay': (b) => `${so(b.n, 'task', 'tasks')} to do now`,
  'Chấm': 'Mark',
  'Chọn một việc ở danh sách.': 'Pick a task from the list.',
} satisfies Record<string, Dich>;
