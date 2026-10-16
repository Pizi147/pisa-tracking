/**
 * Từ điển tiếng Anh. KHOÁ = CHÍNH CHỮ VIỆT đang hiện trên web (kể cả `{biến}`): bản Việt không thể lệch khỏi khoá, `t()` có kiểu
 * `keyof typeof EN` nên tsc báo mọi chữ chưa có bản Anh. Mỗi đợt PR-EN một file vùng (`en/a.ts`…) — bốn PR nối tiếp không đè nhau.
 * Chữ theo `thiet-ke/THUAT_NGU_EN_2026-10-07.md`.
 */
import { EN_A } from './en/a.ts';
import { EN_B } from './en/b.ts';
import { EN_C } from './en/c.ts';
import { EN_F } from './en/f.ts';
import { EN_D } from './en/d.ts';
import { EN_OV12E } from './en/ov12e.ts';
import { EN_HD } from './en/hd.ts';
import { EN_HDB } from './en/hdb.ts';
import { EN_OV13B } from './en/ov13b.ts';
import { EN_OV13C } from './en/ov13c.ts';
import { EN_OV13G } from './en/ov13g.ts';
import { EN_OV13K } from './en/ov13k.ts';
import { EN_OV13D } from './en/ov13d.ts';
import { EN_OV13J } from './en/ov13j.ts';
import { EN_OV13L } from './en/ov13l.ts';
import { EN_OV13M } from './en/ov13m.ts';

/** Giá trị biến: chữ / số, hoặc một chữ máy chủ dựng có khoá riêng (`ChuKhoa`, lồng được) — PR-EN-c. null / undefined in ra như chuỗi
 *  ghép `${x}` cũ (giữ đúng chữ bản Việt) — PR-EN-b. */
export type Bien = Record<string, string | number | ChuKhoa | null | undefined>;
/** PR-EN-c: chữ máy chủ dựng — câu Việt (`chu`) + khoá + biến để web dịch (`dichChu`). Không khoá = câu không biến, dịch theo chính `chu`. */
export type ChuKhoa = { chu: string; khoa?: string; bien?: Bien };
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);

export const EN = { ...EN_A, ...EN_B, ...EN_C, ...EN_F, ...EN_D, ...EN_OV12E, ...EN_HD, ...EN_HDB, ...EN_OV13B, ...EN_OV13C, ...EN_OV13D, ...EN_OV13G, ...EN_OV13J, ...EN_OV13L, ...EN_OV13K, ...EN_OV13M };
