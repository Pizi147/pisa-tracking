/** PHOI-HOP-SOS-INFO — thẻ kết quả SOS (lượt · Overall so kỳ vọng · kỹ năng trượt). Khoá = chữ Việt. */
import type { Dich } from '../en.ts';

export const EN_SOS_THE = {
  'trượt {kn}': (b) => `failed ${b.kn}`,
  '+{n} lượt nữa': (b) => `+${b.n} more`,
} satisfies Record<string, Dich>;
