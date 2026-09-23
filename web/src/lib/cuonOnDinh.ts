/**
 * Cuộn `layDich()` vào giữa màn, rồi cuộn lại mỗi khi `theoDoi` đổi cỡ (bảng phía trên tải xong làm trang cao thêm,
 * đích trôi khỏi giữa màn) — tối đa `ms`, dừng ngay khi người dùng tự cuộn (wheel/touchmove/keydown). Trả hàm dọn.
 */
const SU_KIEN = ['wheel', 'touchmove', 'keydown'] as const;

export function cuonOnDinh(layDich: () => HTMLElement | null, theoDoi: HTMLElement | null, ms = 3000): () => void {
  const cuon = () => layDich()?.scrollIntoView({ block: 'center' });
  const raf = requestAnimationFrame(cuon);
  const ro = theoDoi && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(cuon) : null;
  if (ro && theoDoi) ro.observe(theoDoi);
  let t = 0;
  const dung = () => {
    ro?.disconnect();
    for (const e of SU_KIEN) window.removeEventListener(e, dung);
    window.clearTimeout(t);
  };
  for (const e of SU_KIEN) window.addEventListener(e, dung, { passive: true });
  t = window.setTimeout(dung, ms);
  return () => { cancelAnimationFrame(raf); dung(); };
}
