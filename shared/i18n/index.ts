/**
 * PR-EN — HAI TIẾNG KHÔNG THƯ VIỆN (chủ SP 07/10). Từ điển `VI` / `EN` (mỗi đợt một file vùng `vi/<đợt>.ts`, `en/<đợt>.ts`) + `t()`.
 * Ngôn ngữ của trang = `<html lang>`: script nội dòng ở `index.html` đặt nó từ `localStorage` (`NGON_NGU_KHOA`) TRƯỚC khi nạp mã,
 * nên hằng nhãn tính lúc nạp mô-đun đã đúng tiếng. Đổi tiếng = lưu + tải lại trang. Máy chủ không có `document` → luôn chữ Việt.
 */
import { VI } from './vi.ts';
import { EN, type Bien } from './en.ts';

export type { Bien };
export type NgonNgu = 'vi' | 'en';
export type Khoa = keyof typeof VI;

/** Khoá `localStorage` (cạnh `CHE_DO_KHOA` = 'pisa-giao-dien'). Cùng chữ trong script của `index.html`. */
export const NGON_NGU_KHOA = 'pisa-ngon-ngu';
export const laNgonNgu = (v: unknown): v is NgonNgu => v === 'vi' || v === 'en';

export const NGON_NGU: NgonNgu = (globalThis as { document?: { documentElement?: { lang?: string } } }).document?.documentElement?.lang === 'en' ? 'en' : 'vi';

const thay = (s: string, bien?: Bien) => (bien ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in bien ? String(bien[k]) : m)) : s);

/** Chữ của `khoa` ở tiếng `nn`, thay `{biến}`. Khoá lạ (dữ liệu cũ, máy chủ mới hơn web) → trả nguyên khoá, không ném. */
export function dichSang(nn: NgonNgu, khoa: Khoa, bien?: Bien): string {
  if (nn === 'en') {
    const e = (EN as Record<string, string | ((b: Bien) => string)>)[khoa];
    if (typeof e === 'function') return e(bien ?? {});
    if (e !== undefined) return thay(e, bien);
  }
  const v = (VI as Record<string, string>)[khoa];
  return v === undefined ? String(khoa) : thay(v, bien);
}

/** Chữ theo tiếng của trang. */
export const t = (khoa: Khoa, bien?: Bien): string => dichSang(NGON_NGU, khoa, bien);

/** Khoá do máy chủ gửi (chuỗi bất kỳ): có trong từ điển → chữ theo tiếng trang; không → `null` (nơi gọi hiện chữ Việt máy chủ gửi kèm). */
export const dichKhoa = (khoa: unknown, bien?: Bien): string | null =>
  typeof khoa === 'string' && khoa in VI ? t(khoa as Khoa, bien) : null;
