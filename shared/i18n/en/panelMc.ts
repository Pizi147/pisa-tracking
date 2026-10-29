/** PANEL-MC — dòng điểm HV (đọc màn hình / rê số), Lịch sử yêu cầu. Khoá = chữ Việt. */
import type { Dich } from '../en.ts';

export const EN_PANEL_MC = {
  '{k} chưa có điểm': (b) => `${b.k} not scored yet`,
  '{goc}, dưới kỳ vọng {moc}': (b) => `${b.goc}, below expectation ${b.moc}`,
  '{goc}, dưới Target {moc}': (b) => `${b.goc}, below Target ${b.moc}`,
  '{goc}, dưới ngưỡng {moc}': (b) => `${b.goc}, below pass mark ${b.moc}`,
  'chấm chéo': 'cross-marking',
  /* Lịch sử yêu cầu (`/lich-su?loai=yeu-cau`). */
  'Gửi yêu cầu': 'Request sent',
  'Rút yêu cầu': 'Request withdrawn',
  'Sửa yêu cầu': 'Request edited',
  'Trả lời': 'Answered',
  'Sửa trả lời': 'Answer edited',
} satisfies Record<string, Dich>;
