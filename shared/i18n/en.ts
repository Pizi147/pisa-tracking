/**
 * Từ điển tiếng Anh. KHOÁ = CHÍNH CHỮ VIỆT đang hiện trên web (kể cả `{biến}`): bản Việt không thể lệch khỏi khoá, `t()` có kiểu
 * `keyof typeof EN` nên tsc báo mọi chữ chưa có bản Anh. Mỗi đợt PR-EN một file vùng (`en/a.ts`…) — bốn PR nối tiếp không đè nhau.
 * Chữ theo `thiet-ke/THUAT_NGU_EN_2026-10-07.md`.
 */
import { EN_A } from './en/a.ts';
import { EN_B } from './en/b.ts';

/** null / undefined in ra như chuỗi ghép `${x}` cũ (giữ đúng chữ bản Việt). */
export type Bien = Record<string, string | number | null | undefined>;
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);

export const EN = { ...EN_A, ...EN_B };
