import { lazy, type ComponentType } from 'react';

/**
 * HOTFIX-3: sau deploy, tab cũ xin mảnh JS đã bị thay → Netlify trả index.html → "Failed to fetch dynamically imported module" → màn đen.
 * Bắt lỗi tải mảnh (`vite:preloadError` + lỗi import của `lazy`) → tự tải lại trang MỘT lần; lần thứ hai trong CHAN_MS (sessionStorage)
 * thì để lỗi rơi xuống `BatLoiTrang` (lưới đỡ cuối, có nút Tải lại) — không lặp tải lại vô tận.
 */
const KHOA = 'pisa-tai-lai-manh';
const CHAN_MS = 5 * 60_000;
let dangTai = false;

/** true = đã gọi tải lại (hoặc đang tải lại); false = vừa tải lại trong CHAN_MS → không tải nữa. */
export function taiLaiMotLan(): boolean {
  if (dangTai) return true;
  try {
    if (Date.now() - Number(sessionStorage.getItem(KHOA) ?? 0) < CHAN_MS) return false;
    sessionStorage.setItem(KHOA, String(Date.now()));
  } catch { return false; }
  dangTai = true;
  window.location.reload();
  return true;
}

/** `lazy` có bắt lỗi tải mảnh: tải lại được thì treo lời hứa (trang đang tải lại), không thì ném cho `BatLoiTrang`. */
export function lazyTai<T extends ComponentType<any>>(nap: () => Promise<{ default: T }>) {
  return lazy(() => nap().catch((e) => {
    if (taiLaiMotLan()) return new Promise<never>(() => {});
    throw e;
  }));
}

window.addEventListener('vite:preloadError', (e) => { if (taiLaiMotLan()) e.preventDefault(); });
