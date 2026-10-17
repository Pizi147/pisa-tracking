/** OV-14a — lưu chắc chắn, không mất chữ (audit 17/10). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV14A = {
  'Máy chủ trả dữ liệu lạ — thử lại.': 'The server sent an unexpected reply — try again.',
  'Góp ý chưa lưu được — chữ vẫn giữ.': 'Comment not saved yet — your text is kept.',
} satisfies Record<string, Dich>;
