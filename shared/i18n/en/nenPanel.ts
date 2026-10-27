/** NEN-PANEL — khung panel V5: dòng loại, hộp "Bỏ chữ đang gõ?", chân lưu thống nhất. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_NEN_PANEL = {
  'VIỆC': 'TASK',
  /* M6 6b-1: nút ‹ {view trước} ở đầu panel. */
  'Quay lại {x}': (b) => `Back to ${b.x}`,
  'BÁO CÁO · CHỈ ĐỌC': 'REPORT · READ-ONLY',
  'Bỏ chữ đang gõ?': 'Discard what you typed?',
  'Bỏ chữ, đóng': 'Discard and close',
  'Bỏ chữ, sang việc khác': 'Discard and open the other task',
  'Bỏ chữ, quay lại': 'Discard and go back',
  '{viec} chưa lưu — chữ đang gõ sẽ mất.': '{viec} is not saved — what you typed will be lost.',
  'Chữ đang gõ vẫn giữ.': 'Your text is kept.',
} satisfies Record<string, Dich>;
