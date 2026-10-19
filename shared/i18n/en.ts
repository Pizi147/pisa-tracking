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
import { EN_OV13O } from './en/ov13o.ts';
import { EN_UX1 } from './en/ux1.ts';
import { EN_UX2 } from './en/ux2.ts';
import { EN_OV13Q } from './en/ov13q.ts';
import { EN_ENE } from './en/ene.ts';
import { EN_OV14A } from './en/ov14a.ts';
import { EN_OV14C } from './en/ov14c.ts';
import { EN_OV15A } from './en/ov15a.ts';
import { EN_OV15E } from './en/ov15e.ts';
import { EN_OV15D } from './en/ov15d.ts';

/** Giá trị biến: chữ / số, hoặc một chữ máy chủ dựng có khoá riêng (`ChuKhoa`, lồng được) — PR-EN-c. null / undefined in ra như chuỗi
 *  ghép `${x}` cũ (giữ đúng chữ bản Việt) — PR-EN-b. */
export type Bien = Record<string, string | number | ChuKhoa | null | undefined>;
/** PR-EN-c: chữ máy chủ dựng — câu Việt (`chu`) + khoá + biến để web dịch (`dichChu`). Không khoá = câu không biến, dịch theo chính `chu`. */
export type ChuKhoa = { chu: string; khoa?: string; bien?: Bien };
/** Chữ thường, hoặc hàm khi cần số ít / số nhiều. */
export type Dich = string | ((b: Bien) => string);

export const EN = { ...EN_A, ...EN_B, ...EN_C, ...EN_F, ...EN_D, ...EN_OV12E, ...EN_HD, ...EN_HDB, ...EN_OV13B, ...EN_OV13C, ...EN_OV13D, ...EN_OV13G, ...EN_OV13J, ...EN_OV13L, ...EN_OV13K, ...EN_OV13M , ...EN_OV13O, ...EN_UX1, ...EN_UX2, ...EN_OV13Q, ...EN_ENE, ...EN_OV14A, ...EN_OV14C, ...EN_OV15A, ...EN_OV15E, ...EN_OV15D };
