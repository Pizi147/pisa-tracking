import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useBamNgoai } from './useBamNgoai.ts';

/**
 * HỘP NỔI NEO MỘT Ô (QTV2-TK) — sửa nhỏ ngay tại dòng bảng (đổi vai, kỹ năng). Vẽ RA NGOÀI bảng (portal, `fixed`) như `MenuDong`: bảng cuộn ngang
 * trong thẻ sẽ cắt hộp nếu vẽ bên trong. Đủ chỗ thì mở xuống, không thì mở lên; cuộn / đổi cỡ màn thì đặt lại vị trí (không đóng — đang gõ dở).
 * Bấm ngoài / Esc → `onNgoai` (nơi gọi quyết: chưa đổi thì đóng, đã đổi thì hỏi). Mở xong focus phần tử bấm được đầu tiên; đóng trả focus về ô neo.
 */
export function HopNeo({ neo, nhan, rong = 420, onNgoai, children }: {
  neo: RefObject<HTMLElement | null>; nhan: string; rong?: number; onNgoai: () => void; children: ReactNode;
}) {
  const hop = useRef<HTMLDivElement>(null);
  const ngoai = useRef(onNgoai);
  ngoai.current = onNgoai;   // Esc nghe một lần lúc mở — luôn gọi bản mới nhất (biết "đã đổi" chưa)
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null);
  const datViTri = () => {
    const r = neo.current?.getBoundingClientRect();
    const cao = hop.current?.offsetHeight ?? 0;
    if (!r) return;
    const xuong = r.bottom + 6 + cao <= window.innerHeight - 8;
    const top = xuong ? r.bottom + 6 : Math.max(8, r.top - 6 - cao);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - rong - 8));
    setViTri((v) => (v && v.top === top && v.left === left ? v : { top, left }));   // không đổi thì giữ object cũ — không vẽ lại vô tận
  };
  useLayoutEffect(datViTri);   // mỗi lần vẽ: nội dung đổi cao (thêm hàng, hiện lỗi) thì hộp vẫn nằm trong màn
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); ngoai.current(); } };
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', datViTri, true);
    window.addEventListener('resize', datViTri);
    hop.current?.querySelector<HTMLElement>('select, button, input')?.focus({ preventScroll: true });
    const o = neo.current;
    return () => {
      document.removeEventListener('keydown', phim, true);
      window.removeEventListener('scroll', datViTri, true);
      window.removeEventListener('resize', datViTri);
      o?.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const qua = useBamNgoai(true, onNgoai, hop, neo);
  return createPortal(
    <div ref={hop} role="dialog" aria-label={nhan} {...qua}
      className="card fixed z-[60] grid gap-3 p-4 shadow-2xl"
      style={{ width: rong, maxWidth: 'calc(100vw - 16px)', top: viTri?.top ?? -9999, left: viTri?.left ?? 0, borderColor: 'var(--line-strong)' }}>
      {children}
    </div>,
    document.body,
  );
}
