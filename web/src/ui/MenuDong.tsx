import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buocDanhSach } from '@shared/domain/index.ts';

export type MucMenu = {
  key: string; nhan: string; onChon: () => void;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu). */
  keTruoc?: boolean;
  /** Việc khó đảo ngược (xoá) — chữ đỏ, như `danger` của `Menu`. */
  nguyHiem?: boolean;
};

/**
 * NÚT ⋯ / ⋮ VÀ MENU NHỎ (đặc tả §3.7, mockup 06 phương án A; Q16).
 *
 * Menu vẽ RA NGOÀI bảng (portal, `fixed`): bảng cuộn ngang trong thẻ (G-11) sẽ cắt mất menu nếu vẽ bên trong. `z-[60]` — trên thanh
 * dưới điện thoại (z-30) và menu đầu trang (z-40). Đủ chỗ thì mở xuống, không thì mở lên; cuộn hay đổi cỡ màn thì đóng.
 * Không có mục nào thì không vẽ nút (không để nút bấm không làm gì). Tooltip bắt buộc (G-7).
 * Bàn phím (E2): mở → focus mục đầu; ↑/↓/Home/End đi vòng; Enter chọn; Esc/Tab đóng và trả focus về nút ⋯. Esc chỉ đóng menu,
 * không đóng panel chứa nó (pha bắt + chặn lan, như `LichNho`).
 */
export function MenuDong({ muc, nhan = 'Thao tác khác', bieuTuong = '⋯' }: {
  /** `bieuTuong`: ⋯ · ⋮, hoặc chữ ngắn như "+2" (badge còn ẩn của hộp lớp — PR-HVL B4). */
  muc: MucMenu[]; nhan?: string; bieuTuong?: string;
}) {
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null);
  const [dang, setDang] = useState(0);
  const mucDom = () => [...(hop.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  const tro = (i: number) => { setDang(i); mucDom()[i]?.focus({ preventScroll: true }); };   // preventScroll: cuộn là đóng menu
  const dongVeNut = () => { setMo(false); nut.current?.focus(); };

  useLayoutEffect(() => {
    if (!mo || !nut.current) { setViTri(null); return; }
    const r = nut.current.getBoundingClientRect();
    const rong = 216;
    /* Mục cao 44px trên điện thoại (ô bấm), ~36px từ sm. */
    const cao = Math.min(muc.length * (window.innerWidth < 640 ? 46 : 38) + 8, 320);
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
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      setMo(false);
      nut.current?.focus();
    };
    const dong = () => setMo(false);
    document.addEventListener('mousedown', bamNgoai);
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', bamNgoai);
      document.removeEventListener('keydown', phim, true);
      window.removeEventListener('scroll', dong, true);
      window.removeEventListener('resize', dong);
    };
  }, [mo]);

  /* Mở xong (đã có vị trí) → focus mục đầu. */
  const coViTri = viTri !== null;
  useEffect(() => { if (mo && coViTri) tro(0); }, [mo, coViTri]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!muc.length) return null;
  return (
    <>
      <button ref={nut} type="button" title={nhan} aria-label={nhan} aria-haspopup="menu" aria-expanded={mo}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        className="relative inline-grid place-items-center h-7 min-w-7 px-1 rounded-md border bg-transparent text-[11px] font-semibold tabular-nums text-slate-400 hover:text-slate-100 hover:bg-white/5 cursor-pointer after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
        style={{ borderColor: 'var(--line)' }}>
        {bieuTuong}
      </button>
      {mo && createPortal(
        <div ref={hop} role="menu" aria-label={nhan}
          onKeyDown={(e) => {
            const k = buocDanhSach(muc.length, dang, e.key);
            if (k !== null) { e.preventDefault(); tro(k); }
            else if (e.key === 'Tab') { e.preventDefault(); dongVeNut(); }
          }}
          className="fixed z-[60] w-[216px] rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line-strong)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, visibility: viTri ? 'visible' : 'hidden' }}>
          {muc.map((m, i) => (
            <button key={m.key} type="button" role="menuitem" tabIndex={-1} onFocus={() => setDang(i)}
              className={`block min-h-[44px] w-full rounded-md px-3 py-2 text-left text-sm sm:min-h-0 ${m.nguyHiem ? 'text-rose-200' : 'text-slate-200'} bg-transparent border-0 hover:bg-white/5 focus-visible:bg-white/5 cursor-pointer ${
                m.keTruoc ? 'mt-1 rounded-t-none pt-2.5' : ''}`}
              style={m.keTruoc ? { borderTop: '1px solid var(--line)' } : undefined}
              onClick={() => { dongVeNut(); m.onChon(); }}>
              {m.nhan}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
