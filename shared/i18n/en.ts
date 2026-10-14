/** Từ điển tiếng Anh — kiểu ép đủ mọi khoá của `VI` (tsc báo thiếu). Chữ theo `thiet-ke/THUAT_NGU_EN_2026-10-07.md`. */
import type { VI } from './vi.ts';
import { EN_A } from './en/a.ts';

export type Bien = Record<string, string | number>;
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);
export type BangEn<T> = { [K in keyof T]: Dich };

export const EN: BangEn<typeof VI> = { ...EN_A };
