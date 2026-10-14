/** Từ điển tiếng Việt = chữ hiện tại của web, giữ từng chữ. Mỗi đợt PR-EN thêm một file vùng (`vi/a.ts`…) — bốn PR nối tiếp không đè nhau. */
import { VI_A } from './vi/a.ts';

export const VI = { ...VI_A } as const;
