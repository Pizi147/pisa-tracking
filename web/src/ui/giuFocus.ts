import { useEffect, useState, type RefObject } from 'react';
import { buocVongFocus } from '@shared/domain/index.ts';

/** Những gì Tab dừng lại được trong khung — bỏ mọi phần tử tabIndex -1 (ô lịch roving, mục menu/danh sách). */
const O = ['a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]'].map((x) => `${x}:not([tabindex="-1"])`).join(',');

/**
 * GIỮ FOCUS TRONG KHUNG (E2, Q18) — dùng cho lịch `LichNho` và panel (Task 4).
 * Focus vào khung (khung có tabIndex=-1, không bật bàn phím ảo trên điện thoại); Tab/Shift+Tab vòng bên trong; đóng thì trả focus.
 */
export function useGiuFocus(ref: RefObject<HTMLElement>) {
  /* Nhớ ô đang focus NGAY LÚC VẼ ĐẦU: effect của con (vd. ChonNguoi tự focus ô gõ) chạy trước effect này. */
  const [truoc] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    el.focus({ preventScroll: true });
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return;          // modal lồng trong panel đã tự vòng Tab
      const ds = [...el.querySelectorAll<HTMLElement>(O)].filter((x) => x.getClientRects().length > 0);
      if (!ds.length) { e.preventDefault(); return; }
      const i = ds.indexOf(document.activeElement as HTMLElement);
      const cuoi = e.shiftKey ? i <= 0 : i === ds.length - 1;
      if (i === -1 || cuoi) {
        e.preventDefault();
        const k = buocVongFocus(ds.length, i, e.shiftKey);
        if (k >= 0) ds[k].focus();
      }
    };
    el.addEventListener('keydown', phim);
    return () => { el.removeEventListener('keydown', phim); if (truoc?.isConnected) truoc.focus({ preventScroll: true }); };
  }, [ref, truoc]);
}
