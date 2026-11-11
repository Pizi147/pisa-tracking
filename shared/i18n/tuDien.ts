/**
 * Từ điển cho `index.ts`. Web: vite.config thay tệp này bằng `web/src/lib/tuDienWeb.ts` (TAI-NHANH).
 * KHOI-DONG-LANH (13/11): máy chủ luôn chữ Việt (`NGON_NGU` = 'vi', xuất MT tiếng Anh dịch ở web) — KHÔNG nạp từ điển Anh lúc khởi động:
 * gói hàm Netlify bỏ hẳn ~1 MB từ điển (không ai gọi `napTuDienEn` trong gói). Phép kiểm cần chữ Anh gọi `await napTuDienEn()` trước (run / tocDo / sqld).
 */
import type { Dich } from './en.ts';

export const BANG_EN: Record<string, Dich> = {};
export const KHOA_CHI_T = new Set<string>();
let nap: Promise<void> | null = null;
/** Nạp từ điển Anh vào `BANG_EN` / `KHOA_CHI_T` (một lần). Gọi trước MỌI lời dịch sang 'en' — mẫu dịch (`mau()`) nhớ lần tính đầu. */
export const napTuDienEn = (): Promise<void> => (nap ??= import('./en.ts').then((m) => {
  Object.assign(BANG_EN, m.EN);
  for (const k of m.KHOA_CHI_T) KHOA_CHI_T.add(k);
}));
