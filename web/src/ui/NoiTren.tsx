import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
 * HỘP NỔI LỚP TRÊN CÙNG (SUA-2211-A, chủ SP 22/11 ý 5 + 7): ⓘ, tooltip, hộp chi tiết, danh sách ô chọn… vẽ qua portal vào `body`, `position: fixed`
 * theo ô neo — khung cha `overflow` (bảng cuộn ngang, thân panel, thẻ) không cắt được. Đủ chỗ thì mở xuống, không thì phía rộng hơn (thấp lại + cuộn
 * trong); ngang thì dịch vào trong màn (cách mép 8 px); không đè thanh đầu trang. Cuộn / đổi cỡ màn / nội dung đổi cao → đặt lại.
 * Đóng / Esc / bấm ngoài để nơi gọi lo (`useBamNgoai` nhận thêm ref hộp — bấm trong portal là "trong" theo cây React).
 */
export type CanhNoi = 'trai' | 'phai';

export function useViTriNoi(neo: RefObject<HTMLElement | null>, hop: RefObject<HTMLElement | null>, mo: boolean,
  { canh = 'trai', cach = 6, rongNeo = false }: { canh?: CanhNoi; cach?: number; /** rộng bằng ô neo (danh sách ô chọn), tối thiểu 240. */ rongNeo?: boolean } = {}): CSSProperties {
  const [vt, setVt] = useState<{ top: number; left: number; maxH: number | null; w: number | null } | null>(null);
  useLayoutEffect(() => {
    if (!mo) { setVt(null); return undefined; }
    const dat = () => {
      const r = neo.current?.getBoundingClientRect();
      const el = hop.current;
      if (!r || !el) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = rongNeo ? Math.min(Math.max(240, r.width), vw - 16) : null;
      const rong = w ?? el.offsetWidth;
      const cao = el.scrollHeight;
      const mepTren = Math.max(8, (document.querySelector('header.thanh-xanh')?.getBoundingClientRect().bottom ?? 0) + 8);
      const duoi = vh - 8 - (r.bottom + cach);
      const tren = r.top - cach - mepTren;
      const xuong = cao <= duoi || duoi >= tren;
      const cho = Math.max(120, xuong ? duoi : tren);
      const maxH = cao > cho ? cho : null;
      const top = xuong ? r.bottom + cach : r.top - cach - Math.min(cao, cho);
      const left = Math.max(8, Math.min(canh === 'phai' ? r.right - rong : r.left, vw - 8 - rong));
      setVt((v) => (v && v.top === top && v.left === left && v.maxH === maxH && v.w === w ? v : { top, left, maxH, w }));
    };
    dat();
    window.addEventListener('scroll', dat, true);
    window.addEventListener('resize', dat);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(dat);
    if (hop.current) ro?.observe(hop.current);
    return () => { window.removeEventListener('scroll', dat, true); window.removeEventListener('resize', dat); ro?.disconnect(); };
  }, [mo, canh, cach, rongNeo]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    position: 'fixed', zIndex: 80, top: vt?.top ?? -9999, left: vt?.left ?? 0, maxWidth: 'calc(100vw - 16px)',
    ...(vt?.w ? { width: vt.w } : {}),
    ...(vt?.maxH ? { maxHeight: vt.maxH, overflowY: 'auto' as const, overscrollBehavior: 'contain' as const } : {}),
  };
}

/** Hộp nổi neo `neo`, vẽ ra `body`. Mọi thuộc tính khác (role, aria, className, onMouseDown…) chuyền thẳng vào khung.
 *  `taiCho`: vẽ tại chỗ như `div` thường (danh sách ô chọn nằm trong hộp / màn 375) — nơi gọi không phải rẽ hai nhánh JSX. */
export const NoiTren = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & {
  neo: RefObject<HTMLElement | null>; canh?: CanhNoi; cach?: number; rongNeo?: boolean; taiCho?: boolean;
}>(function NoiTren({ neo, canh, cach, rongNeo, taiCho = false, style, ...p }, ref) {
  const hop = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => hop.current as HTMLDivElement);
  const vt = useViTriNoi(neo, hop, !taiCho, { canh, cach, rongNeo });
  if (taiCho) return <div ref={hop} {...p} style={style} />;
  return createPortal(<div ref={hop} data-noi-tren="" {...p} style={{ ...style, ...vt }} />, document.body);
});
