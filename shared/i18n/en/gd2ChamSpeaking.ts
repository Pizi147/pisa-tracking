/** GD-2 (overhaul V6, panel Chấm Speaking gom tuần → lớp). */
import type { Dich } from '../en.ts';

export const EN_GD2_CHAM_SPEAKING = {
  'Việc chung · Chấm Speaking': 'Shared task · Speaking marking',
  'Tuần cũ hơn': 'Older weeks',
  'GV chấm: {ten}': 'Marker: {ten}',
  'Đã lưu {n} bài': (b) => `Saved ${b.n} ${Number(b.n) === 1 ? 'paper' : 'papers'}`,
} satisfies Record<string, Dich>;
