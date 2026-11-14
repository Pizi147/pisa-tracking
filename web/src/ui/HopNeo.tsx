import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useBamNgoai } from './useBamNgoai.ts';

/**
 * HỘP NỔI NEO MỘT Ô (QTV2-TK) — sửa nhỏ ngay tại dòng bảng (đổi vai, kỹ năng). Vẽ RA NGOÀI bảng (portal, `fixed`) như `MenuDong`: bảng cuộn ngang
 * trong thẻ sẽ cắt hộp nếu vẽ bên trong. Đủ chỗ thì mở xuống, không thì mở lên; HVL-TINH-HINH (PTA rà #1708): cả hai phía đều thiếu → mở về phía rộng hơn,
 * ô neo ở mép phải (⋯ cuối dòng) thì đặt CẠNH trái ô neo; không thì hộp thấp lại và cuộn bên trong (không kẹp sát mép trên đè thanh đầu trang / chính ô neo). Cuộn / đổi cỡ màn thì đặt lại vị trí (không đóng — đang gõ dở).
 * Bấm ngoài / Esc → `onNgoai` (nơi gọi quyết: chưa đổi thì đóng, đã đổi thì hỏi). Mở xong focus phần tử bấm được đầu tiên; đóng trả focus về ô neo.
 */
export function HopNeo({ neo, nhan, rong = 420, onNgoai, lop = 'grid gap-3 p-4', mui = false, children }: {
  neo: RefObject<HTMLElement | null>; nhan: string; rong?: number; onNgoai: () => void;
  /** Lớp thân hộp (mặc định lưới đệm 16 px) — hộp Tuần dạy tự kẻ vạch sát mép (`hop-tuan-day`). */ lop?: string;
  /** Mũi nhỏ chỉ vào giữa ô neo (mockup v20) — lật theo hướng mở. */ mui?: boolean; children: ReactNode;
}) {
  const hop = useRef<HTMLDivElement>(null);
  const ngoai = useRef(onNgoai);
  ngoai.current = onNgoai;   // Esc nghe một lần lúc mở — luôn gọi bản mới nhất (biết "đã đổi" chưa)
  const [viTri, setViTri] = useState<{ top: number; left: number; xuong: boolean; muiX: number; maxH: number | null; canh: boolean } | null>(null);
  const datViTri = () => {
    const r = neo.current?.getBoundingClientRect();
    const cao = hop.current?.scrollHeight ?? 0;   // cao THẬT của nội dung (kể cả khi đang bị giới hạn `maxHeight`)
    if (!r) return;
    const cach = mui ? 10 : 6;
    /* Mép trên dùng được = dưới thanh đầu trang (thanh xanh luôn hiện, trang cuộn trong `main`) — hộp không đè thanh đầu (PTA rà #1708). */
    const mepTren = Math.max(8, (document.querySelector('header.thanh-xanh')?.getBoundingClientRect().bottom ?? 0) + 8);
    const duoi = window.innerHeight - 8 - (r.bottom + cach);
    const tren = r.top - cach - mepTren;
    /* Trên / dưới đều thiếu mà bên trái ô neo đủ rộng (⋯ cuối dòng) → đặt CẠNH ô neo, dọc trong khoảng dưới thanh đầu → đáy màn; không thì phía rộng hơn + cuộn trong. */
    const canh = cao > duoi && cao > tren && r.left - cach - rong >= 8 && cao <= window.innerHeight - 8 - mepTren;
    const xuong = cao <= duoi || (cao > tren && duoi >= tren);
    const maxH = canh || cao <= (xuong ? duoi : tren) ? null : Math.max(160, xuong ? duoi : tren);
    const top = canh ? Math.min(Math.max(mepTren, r.top), window.innerHeight - 8 - cao)
      : xuong ? r.bottom + cach : Math.max(mepTren, r.top - cach - Math.min(cao, tren));
    /* GD-17b: hộp nằm trong thẻ chứa ô neo (vùng bảng) — gặp mép phải thẻ thì dịch vào trong, không đè cột bên cạnh (Nhật ký). Thẻ hẹp hơn hộp thì theo màn. */
    const the = neo.current?.closest('.card')?.getBoundingClientRect();
    const vua = !!the && the.width >= rong + 16;
    const trai = vua ? Math.max(8, the.left + 8) : 8;
    const phai = vua ? Math.min(window.innerWidth, the.right) - 8 : window.innerWidth - 8;
    const left = canh ? r.left - cach - rong : Math.max(trai, Math.min(mui ? r.left + r.width / 2 - 70 : r.left, phai - rong));
    const muiX = r.left + r.width / 2 - left - 6;
    setViTri((v) => (v && v.top === top && v.left === left && v.xuong === xuong && v.muiX === muiX && v.maxH === maxH && v.canh === canh ? v : { top, left, xuong, muiX, maxH, canh }));   // không đổi thì giữ object cũ — không vẽ lại vô tận
  };
  useLayoutEffect(datViTri);   // mỗi lần vẽ: nội dung đổi cao (thêm hàng, hiện lỗi) thì hộp vẫn nằm trong màn
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); ngoai.current(); } };
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', datViTri, true);
    window.addEventListener('resize', datViTri);
    /* Nội dung con tự đổi cao (tải xong, đổi kỹ năng) mà HopNeo không vẽ lại → đặt lại vị trí theo cỡ thật. */
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(datViTri);
    if (hop.current) ro?.observe(hop.current);
    hop.current?.querySelector<HTMLElement>('select, button, input')?.focus({ preventScroll: true });
    const o = neo.current;
    return () => {
      document.removeEventListener('keydown', phim, true);
      window.removeEventListener('scroll', datViTri, true);
      window.removeEventListener('resize', datViTri);
      ro?.disconnect();
      o?.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const qua = useBamNgoai(true, onNgoai, hop, neo);
  return createPortal(
    <div ref={hop} role="dialog" aria-label={nhan} {...qua}
      className={`card fixed z-[60] shadow-2xl ${lop}`}
      style={{ width: rong, maxWidth: 'calc(100vw - 16px)', top: viTri?.top ?? -9999, left: viTri?.left ?? 0, borderColor: 'var(--line-strong)',
        ...(viTri?.maxH ? { maxHeight: viTri.maxH, overflowY: 'auto' as const, overscrollBehavior: 'contain' as const } : {}) }}>
      {mui && viTri && !viTri.canh && <span aria-hidden className="hop-mui" style={viTri.xuong ? { left: viTri.muiX, top: -7 } : { left: viTri.muiX, bottom: -7, transform: 'rotate(225deg)' }} />}
      {children}
    </div>,
    document.body,
  );
}
