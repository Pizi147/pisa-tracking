/**
 * PR-EN — HAI TIẾNG KHÔNG THƯ VIỆN (chủ SP 07/10). `t('chữ Việt', { biến })`: trang tiếng Việt → chính chữ đó; tiếng Anh → `EN[chữ]`.
 * Ngôn ngữ của trang = `<html lang>`: script nội dòng ở `index.html` đặt nó từ `localStorage` (`NGON_NGU_KHOA`) TRƯỚC khi nạp mã,
 * nên hằng nhãn tính lúc nạp mô-đun đã đúng tiếng. Đổi tiếng = lưu + tải lại trang. Máy chủ không có `document` → luôn chữ Việt.
 */
import { EN, type Bien, type Dich } from './en.ts';

export type { Bien };
export type NgonNgu = 'vi' | 'en';
/** Mọi chữ Việt đã có bản Anh. */
export type Khoa = keyof typeof EN;

/** Khoá `localStorage` (cạnh `CHE_DO_KHOA` = 'pisa-giao-dien'). Cùng chữ trong script của `index.html`. */
export const NGON_NGU_KHOA = 'pisa-ngon-ngu';
export const laNgonNgu = (v: unknown): v is NgonNgu => v === 'vi' || v === 'en';

export const NGON_NGU: NgonNgu = (globalThis as { document?: { documentElement?: { lang?: string } } }).document?.documentElement?.lang === 'en' ? 'en' : 'vi';

const BANG = EN as Record<string, Dich>;
const thay = (s: string, bien?: Bien) => (bien ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in bien ? String(bien[k]) : m)) : s);

/**
 * Chữ `vi` (chữ Việt, có thể kèm `{biến}`) ở tiếng `nn`. Chữ chưa có bản Anh → chữ Việt (không vỡ). Ở EN, biến là chữ Việt có trong
 * từ điển (vd tên ô "Họ tên" máy chủ gửi kèm lỗi) cũng được dịch.
 */
export function dichSang(nn: NgonNgu, vi: string, bien?: Bien): string {
  if (nn !== 'en') return thay(vi, bien);
  const b = bien && Object.fromEntries(Object.entries(bien).map(([k, v]) => [k, typeof v === 'string' && typeof BANG[v] === 'string' ? BANG[v] as string : v]));
  const e = BANG[vi];
  if (typeof e === 'function') return e(b ?? {});
  return thay(e ?? vi, b);
}

/** Chữ theo tiếng của trang — `khoa` phải có bản Anh (tsc kiểm). */
export const t = (khoa: Khoa, bien?: Bien): string => dichSang(NGON_NGU, khoa, bien);

/** Chữ đến từ máy chủ / dữ liệu (không biết trước): có bản Anh thì dịch, không thì giữ nguyên chữ Việt. */
export const dich = (vi: string, bien?: Bien): string => dichSang(NGON_NGU, vi, bien);
