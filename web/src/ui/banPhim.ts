import { useEffect } from 'react';
import { banPhimChe } from '@shared/domain/index.ts';

const O_GO = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]), textarea, select, [contenteditable="true"]';

/**
 * T21 · U03 (chủ SP 13/11 "Ẩn, không mockup"): bàn phím ảo che phần dưới vùng nhìn — đo bằng `visualViewport` MỘT nơi cho mọi trang (gắn ở `App`),
 * đặt `--ban-phim` (px bị che) + `data-ban-phim` lên <html>: thanh tab dưới ẩn (`index.css`), panel phủ / hộp co lên, chân lưu dính ngay trên bàn phím.
 * Chỉ điện thoại (< 768) + ô nhập đang focus (`banPhimChe`); 1440 không đổi gì.
 */
export function useBanPhim() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const goc = document.documentElement;
    const bo = () => { delete goc.dataset.banPhim; goc.style.removeProperty('--ban-phim'); };
    const doi = () => {
      const o = document.activeElement as HTMLElement | null;
      const che = banPhimChe({ cao: window.innerHeight, vvCao: vv.height, vvTren: vv.offsetTop, rong: window.innerWidth, dangGo: !!o?.matches(O_GO) });
      if (!che) { bo(); return; }
      const moi = goc.dataset.banPhim === undefined;
      goc.dataset.banPhim = ''; goc.style.setProperty('--ban-phim', `${che}px`);
      /* UI-CON-LAI k8: bàn phím vừa mở → ô đang gõ cuộn vào giữa phần màn còn thấy (không bị chân Lưu / bàn phím che). Khung cuộn có thể là cả cửa sổ
         (cao như khi chưa có bàn phím) → `scroll-margin-bottom` = phần bị che, để "giữa" là giữa phần còn thấy. */
      if (moi && o) {
        requestAnimationFrame(() => { o.style.scrollMarginBottom = `${che}px`; o.scrollIntoView({ block: 'center' }); o.style.scrollMarginBottom = ''; });
      }
    };
    /* Rời ô: đợi focus sang ô kế (focusout chạy trước focusin) rồi mới đo — chuyển ô không làm thanh dưới nháy. */
    const sau = () => requestAnimationFrame(doi);
    doi();
    vv.addEventListener('resize', doi); vv.addEventListener('scroll', doi);
    document.addEventListener('focusin', doi); document.addEventListener('focusout', sau);
    return () => {
      vv.removeEventListener('resize', doi); vv.removeEventListener('scroll', doi);
      document.removeEventListener('focusin', doi); document.removeEventListener('focusout', sau);
      bo();
    };
  }, []);
}
