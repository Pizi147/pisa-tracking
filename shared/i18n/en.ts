/**
 * Từ điển tiếng Anh. KHOÁ = CHÍNH CHỮ VIỆT đang hiện trên web (kể cả `{biến}`): bản Việt không thể lệch khỏi khoá, `t()` có kiểu
 * `keyof typeof EN` nên tsc báo mọi chữ chưa có bản Anh. Mỗi đợt PR-EN một file vùng (`en/a.ts`…) — bốn PR nối tiếp không đè nhau.
 * Chữ theo `thiet-ke/THUAT_NGU_EN_2026-10-07.md`.
 */
import { EN_A } from './en/a.ts';
import { EN_C } from './en/c.ts';
import { EN_F } from './en/f.ts';
import { EN_D } from './en/d.ts';

/** Giá trị biến: chữ / số, hoặc một chữ máy chủ dựng có khoá riêng (`ChuKhoa`, lồng được) — PR-EN-c. */
export type Bien = Record<string, string | number | ChuKhoa>;
/** PR-EN-c: chữ máy chủ dựng — câu Việt (`chu`) + khoá + biến để web dịch (`dichChu`). Không khoá = câu không biến, dịch theo chính `chu`. */
export type ChuKhoa = { chu: string; khoa?: string; bien?: Bien };
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);

export const EN = { ...EN_A, ...EN_C, ...EN_F, ...EN_D };
