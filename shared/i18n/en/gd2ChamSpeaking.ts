/** GD-2 (overhaul V6) · S-CHEO-CN (16/11): panel Chấm Speaking gom lớp → tuần. */
import type { Dich } from '../en.ts';

export const EN_GD2_CHAM_SPEAKING = {
  'Việc · Chấm Speaking': 'Task · Speaking marking',
  'Tuần tiếp: {tuan} ›': 'Next week: {tuan} ›',   // S-CHEO-CN (16/11): ngăn kế cùng lớp
  'GV chấm: {ten}': 'Marker: {ten}',
  'Đã lưu {n} bài': (b) => `Saved ${b.n} ${Number(b.n) === 1 ? 'paper' : 'papers'}`,
} satisfies Record<string, Dich>;
