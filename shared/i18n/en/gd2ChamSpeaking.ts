/** GD-2 (overhaul V6) · S-CHEO-CN (16/11): panel Chấm Speaking gom theo lớp, tuần dưới tên em. */
import type { Dich } from '../en.ts';

export const EN_GD2_CHAM_SPEAKING = {
  'Việc · Chấm Speaking': 'Task · Speaking marking',
  'GV chấm: {ten}': 'Marker: {ten}',
  'Đã lưu {n} bài': (b) => `Saved ${b.n} ${Number(b.n) === 1 ? 'paper' : 'papers'}`,
} satisfies Record<string, Dich>;
