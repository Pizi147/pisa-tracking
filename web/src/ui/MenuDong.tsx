import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type MucMenu = {
  key: string; nhan: string; onChon: () => void;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu). */
  keTruoc?: boolean;
};

/**
 * NÚT ⋯ / ⋮ VÀ MENU NHỎ (đặc tả §3.7, mockup 06 phương án A; Q16).
 *
 * Menu vẽ RA NGOÀI bảng (portal, `fixed`): bảng cuộn ngang trong thẻ (G-11) sẽ cắt mất menu nếu vẽ bên trong. `z-[60]` — trên thanh
 * dưới điện thoại (z-30) và menu đầu trang (z-40). Đủ chỗ thì mở xuống, không thì mở lên; cuộn hay đổi cỡ màn thì đóng.
 * Không có mục nào thì không vẽ nút (không để nút bấm không làm gì). Tooltip bắt buộc (G-7).
 */
export function MenuDong({ muc, nhan = 'Thêm thao tác', bieuTuong = '⋯' }: {
  muc: MucMenu[]; nhan?: string; bieuTuong?: '⋯' | '⋮';
}) {
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!mo || !nut.current) { setViTri(null); return; }
    const r = nut.current.getBoundingClientRect();
    const rong = 216;
    const cao = Math.min(muc.length * 38 + 8, 320);
    /* Chừa 64px dưới đáy cho thanh 4 nút trên điện thoại. */
    const moXuong = r.bottom + 4 + cao <= window.innerHeight - 64;
    setViTri({
      top: moXuong ? r.bottom + 4 : Math.max(8, r.top - 4 - cao),
      left: Math.max(8, Math.min(r.right - rong, window.innerWidth - rong - 8)),
    });
  }, [mo, muc.length]);

  useEffect(() => {
    if (!mo) return undefined;
    const bamNgoai = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!hop.current?.contains(t) && !nut.current?.contains(t)) setMo(false);
    };
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    const dong = () => setMo(false);
    document.addEventListener('mousedown', bamNgoai);
    document.addEventListener('keydown', phim);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', bamNgoai);
      document.removeEventListener('keydown', phim);
      window.removeEventListener('scroll', dong, true);
      window.removeEventListener('resize', dong);
    };
  }, [mo]);

  if (!muc.length) return null;
  return (
    <>
      <button ref={nut} type="button" title={nhan} aria-label={nhan} aria-haspopup="menu" aria-expanded={mo}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        className="inline-grid place-items-center w-7 h-7 rounded-md border bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5 cursor-pointer"
        style={{ borderColor: 'var(--line)' }}>
        {bieuTuong}
      </button>
      {mo && createPortal(
        <div ref={hop} role="menu" className="fixed z-[60] w-[216px] rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line-strong)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, visibility: viTri ? 'visible' : 'hidden' }}>
          {muc.map((m) => (
            <button key={m.key} type="button" role="menuitem"
              className={`block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 bg-transparent border-0 hover:bg-white/5 cursor-pointer ${
                m.keTruoc ? 'mt-1 rounded-t-none pt-2.5' : ''}`}
              style={m.keTruoc ? { borderTop: '1px solid var(--line)' } : undefined}
              onClick={() => { setMo(false); m.onChon(); }}>
              {m.nhan}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
