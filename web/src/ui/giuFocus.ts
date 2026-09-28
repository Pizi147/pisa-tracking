import { useEffect, useState, type RefObject } from 'react';
import { buocVongFocus, traFocusVe } from '@shared/domain/index.ts';

/** Những gì Tab dừng lại được trong khung — bỏ mọi phần tử tabIndex -1 (ô lịch roving, mục menu/danh sách). */
const O = ['a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]'].map((x) => `${x}:not([tabindex="-1"])`).join(',');

/** Chỗ trả focus của từng khung — khung sau mở đè/thay khung trước thì mượn được chỗ trả của khung trước (`traFocusVe`). */
const DICH = new WeakMap<HTMLElement, HTMLElement | null>();

/**
 * GIỮ FOCUS TRONG KHUNG (E2, Q18) — dùng cho lịch `LichNho` và panel (Task 4).
 * Focus vào khung (khung có tabIndex=-1, không bật bàn phím ảo trên điện thoại); Tab/Shift+Tab vòng bên trong; đóng thì trả focus.
 */
export function useGiuFocus(ref: RefObject<HTMLElement>) {
  /* Nhớ ô đang focus NGAY LÚC VẼ ĐẦU: effect của con (vd. ChonNguoi tự focus ô gõ) chạy trước effect này. */
  const [truoc] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    /* Lúc vẽ, focus đã rơi về <body> (nút Lưu bị khoá khi đang lưu → trình duyệt bỏ focus) mà panel cũ vừa đóng đã trả focus
       về nút mở ban đầu (dọn effect cũ chạy trước effect mới) → lấy chỗ đó, để đóng panel xong focus không rơi về <body>. */
    const hienTai = document.activeElement;
    const dich = truoc && truoc !== document.body ? truoc
      : hienTai instanceof HTMLElement && hienTai !== document.body && !el.contains(hienTai) ? hienTai : truoc;
    el.dataset.giuFocus = '';
    DICH.set(el, dich);
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
    return () => {
      el.removeEventListener('keydown', phim);
      /* Phần tử đã gỡ vẫn giữ cây cha của nó → `closest` tìm được khung cũ (đã gỡ) để mượn chỗ trả. */
      traFocusVe<HTMLElement>(dich, (x) => x.isConnected, (x) => x.closest<HTMLElement>('[data-giu-focus]'), (k) => DICH.get(k) ?? null)
        ?.focus({ preventScroll: true });
    };
  }, [ref, truoc]);
}
