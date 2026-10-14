import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buocDanhSach } from '@shared/domain/index.ts';
import { CHIP_TRON } from './Nhan.tsx';
import { t } from '@shared/i18n/index.ts';

export type MucMenu = {
  key: string; nhan: string; onChon: () => void;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu). */
  keTruoc?: boolean;
  /** Việc khó đảo ngược (xoá) — chữ đỏ, như `danger` của `Menu`. */
  nguyHiem?: boolean;
  /** Mục chưa làm được: vẫn hiện, mờ, không bấm được; `title` nói vì sao (mockup test-MT phần 2 "mục chưa làm được thì mờ"). */
  tat?: boolean; title?: string;
  /** Dòng chữ đầu nhóm ("Cột hiện") — không bấm được, không vào vòng ↑/↓. */
  tieuDe?: boolean;
  /** Ô tick (☑ / ☐): bấm là đổi, menu GIỮ MỞ để tick tiếp (PR-HK2: "Cột hiện" của Tổng hợp). */
  chon?: boolean;
};

/**
 * NÚT ⋯ / ⋮ VÀ MENU NHỎ (đặc tả §3.7, mockup 06 phương án A; Q16).
 *
 * Menu vẽ RA NGOÀI bảng (portal, `fixed`): bảng cuộn ngang trong thẻ (G-11) sẽ cắt mất menu nếu vẽ bên trong. `z-[60]` — trên thanh
 * dưới điện thoại (z-30) và menu đầu trang (z-40). Đủ chỗ thì mở xuống, không thì mở lên; cuộn hay đổi cỡ màn thì đóng.
 * Không có mục nào thì không vẽ nút (không để nút bấm không làm gì) — trừ `luonHien` (PR-MTb: nút luôn hiện, mục chưa làm được thì mờ).
 * Mục `tat`: `aria-disabled` (không dùng `disabled` để vẫn nhận focus ↑/↓ — đọc được tooltip `title`), chữ mờ, bấm / Enter / Space không làm
 * gì và menu giữ mở. Tooltip bắt buộc (G-7).
 * Bàn phím (E2): mở → focus mục đầu; ↑/↓/Home/End đi vòng; Enter chọn; Esc/Tab đóng và trả focus về nút ⋯. Esc chỉ đóng menu,
 * không đóng panel chứa nó (pha bắt + chặn lan, như `LichNho`).
 */
export function MenuDong({ muc, nhan = t('Thao tác khác'), bieuTuong = '⋯', luonHien = false, kieu }: {
  /** `bieuTuong`: ⋯ · ⋮, hoặc chữ ngắn như "+2" (badge còn ẩn của hộp lớp — PR-HVL B4). `luonHien`: vẽ nút kể cả khi không có mục / mọi mục `tat`. */
  muc: MucMenu[]; nhan?: string; bieuTuong?: string; luonHien?: boolean;
  /** `chip`: mặt nút là chip họ tròn xám ("+2" cạnh các badge lớp, PR-HK2) thay cho ô vuông viền. */
  kieu?: 'chip';
}) {
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number; cao: number } | null>(null);
  const [dang, setDang] = useState(0);
  const mucDom = () => [...(hop.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
  const bam = muc.filter((m) => !m.tieuDe);   // vòng ↑/↓ chỉ qua mục bấm được; `chiSo` = vị trí trong vòng đó
  const chiSo = new Map(bam.map((m, i) => [m.key, i]));
  const tro = (i: number) => { setDang(i); mucDom()[i]?.focus({ preventScroll: true }); };   // preventScroll: cuộn là đóng menu
  const dongVeNut = () => { setMo(false); nut.current?.focus(); };

  useLayoutEffect(() => {
    if (!mo || !nut.current) { setViTri(null); return; }
    const r = nut.current.getBoundingClientRect();
    const rong = 216;
    /* Mục cao 44px trên điện thoại (ô bấm), ~36px từ sm. */
    /* Menu dài (⋯ hồ sơ lớp có tiêu đề nhóm, PR-OV3a): không cao quá màn — phần thừa cuộn trong menu. */
    const cao = Math.min(muc.length * (window.innerWidth < 640 ? 46 : 38) + 8, window.innerHeight - 80);
    /* Chừa 64px dưới đáy cho thanh 4 nút trên điện thoại. */
    const moXuong = r.bottom + 4 + cao <= window.innerHeight - 64;
    setViTri({
      top: moXuong ? r.bottom + 4 : Math.max(8, r.top - 4 - cao),
      left: Math.max(8, Math.min(r.right - rong, window.innerWidth - rong - 8)),
      cao,
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
    /* Cuộn TRONG menu (menu dài) không đóng menu. */
    const cuon = (e: Event) => { if (!(e.target instanceof Node && hop.current?.contains(e.target))) setMo(false); };
    document.addEventListener('mousedown', bamNgoai);
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', cuon, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', bamNgoai);
      document.removeEventListener('keydown', phim, true);
      window.removeEventListener('scroll', cuon, true);
      window.removeEventListener('resize', dong);
    };
  }, [mo]);

  /* Mở xong (đã có vị trí) → focus mục đầu. */
  const coViTri = viTri !== null;
  useEffect(() => { if (mo && coViTri) tro(0); }, [mo, coViTri]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!muc.length && !luonHien) return null;
  return (
    <>
      <button ref={nut} type="button" title={nhan} aria-label={nhan} aria-haspopup="menu" aria-expanded={mo}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        /* Vùng bấm 44px ở điện thoại: `after` neo theo mép TRONG viền 1px nên 28 - 2 + 18 = 44 (-inset-2 chỉ ra 42). Chip `+n` (rộng ~30px):
           `after` 44×44 đặt giữa chip (rộng hơn nếu chip rộng hơn) — hình chip không đổi (VIEC-NHO 4). */
        className={kieu === 'chip'
          ? `${CHIP_TRON} relative min-h-[28px] bg-muted-bg text-muted tabular-nums cursor-pointer hover:brightness-125 max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:min-w-full max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']`
          : "relative inline-grid place-items-center h-7 min-w-7 px-1 rounded-md border bg-transparent text-[11px] font-semibold tabular-nums text-slate-400 hover:text-slate-100 hover:bg-white/5 cursor-pointer after:absolute after:-inset-[9px] after:content-[''] sm:after:hidden"}
        style={kieu === 'chip' ? undefined : { borderColor: 'var(--line)' }}>
        {bieuTuong}
      </button>
      {mo && createPortal(
        <div ref={hop} role="menu" aria-label={nhan}
          onKeyDown={(e) => {
            const k = buocDanhSach(bam.length, dang, e.key);
            if (k !== null) { e.preventDefault(); tro(k); }
            else if (e.key === 'Tab') { e.preventDefault(); dongVeNut(); }
          }}
          className="fixed z-[60] w-[216px] overflow-y-auto overscroll-contain rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line-strong)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, maxHeight: viTri?.cao, visibility: viTri ? 'visible' : 'hidden' }}>
          {muc.map((m) => m.tieuDe ? (
            <div key={m.key} role="presentation" className="px-3 pb-1 pt-2 text-xs text-slate-400">{m.nhan}</div>
          ) : (
            <button key={m.key} type="button" role={m.chon === undefined ? 'menuitem' : 'menuitemcheckbox'} aria-checked={m.chon} tabIndex={-1}
              onFocus={() => setDang(chiSo.get(m.key) ?? 0)}
              title={m.title} aria-disabled={m.tat ? 'true' : undefined}
              className={`block min-h-[44px] w-full rounded-md px-3 py-2 text-left text-sm sm:min-h-0 bg-transparent border-0 focus-visible:bg-white/5 ${
                m.tat ? 'text-slate-500 cursor-not-allowed' : `${m.nguyHiem ? 'text-rose-200' : 'text-slate-200'} hover:bg-white/5 cursor-pointer`} ${
                m.keTruoc ? 'mt-1 rounded-t-none pt-2.5' : ''}`}
              style={m.keTruoc ? { borderTop: '1px solid var(--line)' } : undefined}
              onClick={(e) => { if (m.tat) { e.stopPropagation(); return; } if (m.chon === undefined) dongVeNut(); m.onChon(); }}>
              {m.chon !== undefined && <span aria-hidden>{m.chon ? '☑' : '☐'} </span>}{m.nhan}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
