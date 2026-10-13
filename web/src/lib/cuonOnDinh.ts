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

/**
 * PR-OV5b: về lại trang nguồn → đặt `el.scrollTop = top`, đặt lại mỗi khung hình trong `ms` (bảng tải xong làm trang cao dần mới cuộn
 * tới được) — dừng ngay khi người dùng tự cuộn / bấm. Trả hàm dọn.
 */
export function cuonVeViTri(el: HTMLElement, top: number, ms = 3000): () => void {
  const het = Date.now() + ms;
  let raf = 0;
  const dat = () => {
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTop = top;
    raf = Date.now() < het ? requestAnimationFrame(dat) : 0;
  };
  const dung = () => {
    cancelAnimationFrame(raf);
    for (const e of [...SU_KIEN, 'pointerdown'] as const) window.removeEventListener(e, dung);
  };
  for (const e of [...SU_KIEN, 'pointerdown'] as const) window.addEventListener(e, dung, { passive: true });
  raf = requestAnimationFrame(dat);
  return dung;
}
