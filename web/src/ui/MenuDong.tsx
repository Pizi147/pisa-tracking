import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { buocDanhSach } from '@shared/domain/index.ts';
import { CHIP_TRON } from './Nhan.tsx';
import { IconGap } from './BieuTuong.tsx';
import { useBamNgoai } from './useBamNgoai.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * NÚT ⋯ ĐẦU TRANG (chủ SP 07/11 "cho cân đối"): ô vuông cùng khung nút cạnh, ký tự ⋯ căn giữa, 17 px (thang chữ). Nơi gọi chỉ thêm cỡ ô
 * (`h-9 w-9` cạnh nút `btn`, …) — hồ sơ lớp, hồ sơ HV, Kế hoạch Test dùng chung.
 */
export const NUT_BA_CHAM_DAU = 'btn shrink-0 justify-center !px-0 text-[17px] leading-none';
/* B11 (audit-ui 08/11, mockup `.nut`): nút hàng đầu hồ sơ lớp + hồ sơ HV một dáng — cao 36, điện thoại 44; ⋯ vuông cùng cỡ. */
export const NUT_DAU_HO_SO = 'btn h-9 justify-center max-sm:h-11';
export const NUT_BA_CHAM = `${NUT_BA_CHAM_DAU} h-9 w-9 max-sm:h-11 max-sm:w-11`;

export type MucMenu = {
  key: string; nhan: string; onChon: () => void;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu). PR-VAI-b: `dam` vạch đậm · `do` vạch đỏ (trước Xoá). */
  keTruoc?: boolean | 'dam' | 'do';
  /** Việc khó đảo ngược (xoá) — chữ đỏ. */
  nguyHiem?: boolean;
  /** Mục chưa làm được: vẫn hiện, mờ, không bấm được; `title` nói vì sao — GD-4c (⑤ H2): lý do ghi NGAY DƯỚI mục, không chỉ tooltip. */
  tat?: boolean; title?: string;
  /** GD-4c (gộp `Menu`): một dòng nói rõ việc này làm gì — hiện dưới nhãn (12 / 400 mờ). */
  goi?: string;
  /** Dòng chữ đầu nhóm ("Cột hiện") — không bấm được, không vào vòng ↑/↓. */
  tieuDe?: boolean;
  /** Ô tick (☑ / ☐): bấm là đổi, menu GIỮ MỞ để tick tiếp (PR-HK2: "Cột hiện" của Tổng hợp). */
  chon?: boolean;
  /** GD-4a (mockup ⑤ F1, [XM-7]): biểu tượng 16 px màu nhấn trước chữ (menu "+ Task") — nút-chip thì không có biểu tượng (lời 20). */
  bieuTuong?: ReactNode;
};

/** Dòng phụ dưới nhãn: `goi`, hoặc lý do của mục tắt (⑤ H2). */
const dongPhu = (m: MucMenu) => m.goi ?? (m.tat ? m.title : undefined);

/**
 * MỘT MENU THẢ (GD-4c, `.menu-tha` v21: nền surface, viền line-strong, bo 10, bóng `--bong-noi`) — `Menu.tsx` cũ đã gộp vào đây.
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
export function MenuDong({ muc, nhan = t('Thao tác khác'), bieuTuong = '⋯', luonHien = false, kieu, mat, lopNut, chu, canhTrai = false, tieuDeDay }: {
  /** `bieuTuong`: ⋯ · ⋮, hoặc chữ ngắn như "+2" (badge còn ẩn của hộp lớp — PR-HVL B4). `luonHien`: vẽ nút kể cả khi không có mục / mọi mục `tat`. */
  muc: MucMenu[]; nhan?: string; bieuTuong?: string; luonHien?: boolean;
  /** `chip`: mặt nút là chip họ tròn xám ("+2" cạnh các badge lớp, PR-HK2) thay cho ô vuông viền. */
  kieu?: 'chip';
  /** KHUNG-LOI: mặt nút riêng (nút "Thêm" của thanh trên / thanh dưới) + lớp của nút — thay ô ⋯. */
  mat?: ReactNode; lopNut?: string;
  /** GD-4c (gộp `Menu`): nút CHỮ có mũi tên gập ("Chỉnh lịch", "+ MT", "Các bước (n)" + IconGap) — chữ là tên đọc, không cần `nhan`. */
  chu?: string;
  /** GD-3 (mockup v21 K2b): nút ⋯ ở mép TRÁI hàng nút — menu canh mép trái nút, không chìa ra ngoài hộp. */
  canhTrai?: boolean;
  /** GD-4a (mockup ⑤ F4): < 640 px menu NEO ĐÁY màn (tấm dưới có tiêu đề này, nền mờ phía sau, mục cao 48) thay vì thả cạnh nút. */
  tieuDeDay?: string;
}) {
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number; cao: number; day?: boolean } | null>(null);
  const [dang, setDang] = useState(0);
  const mucDom = () => [...(hop.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
  const bam = muc.filter((m) => !m.tieuDe);   // vòng ↑/↓ chỉ qua mục bấm được; `chiSo` = vị trí trong vòng đó
  const chiSo = new Map(bam.map((m, i) => [m.key, i]));
  const tro = (i: number) => { setDang(i); mucDom()[i]?.focus({ preventScroll: true }); };   // preventScroll: cuộn là đóng menu
  const dongVeNut = () => { setMo(false); nut.current?.focus(); };

  useLayoutEffect(() => {
    if (!mo || !nut.current) { setViTri(null); return; }
    if (tieuDeDay && window.innerWidth < 640) { setViTri({ top: 0, left: 0, cao: window.innerHeight - 80, day: true }); return; }
    const r = nut.current.getBoundingClientRect();
    const rong = 220;   // `.menu-tha` min-width 220
    /* Mục cao 44px trên điện thoại (ô bấm), ~36px từ sm. */
    /* Menu dài (⋯ hồ sơ lớp có tiêu đề nhóm, PR-OV3a): không cao quá màn — phần thừa cuộn trong menu. */
    /* GD-4c: mục có dòng phụ (`goi` / lý do mục tắt) cao thêm một dòng 12 px. */
    const cao = Math.min(muc.reduce((n, m) => n + (window.innerWidth < 640 ? 50 : 42) + (dongPhu(m) ? 18 : 0), 8), window.innerHeight - 80);   // P3: mục ≥ 36 / 44 px + vạch nhóm
    /* Chừa 64px dưới đáy cho thanh 4 nút trên điện thoại. */
    const moXuong = r.bottom + 4 + cao <= window.innerHeight - 64;
    setViTri({
      top: moXuong ? r.bottom + 4 : Math.max(8, r.top - 4 - cao),
      left: Math.max(8, Math.min(canhTrai ? r.left : r.right - rong, window.innerWidth - rong - 8)),
      cao,
    });
  }, [mo, muc.length]);

  useBamNgoai(mo, () => setMo(false), hop, nut);
  useEffect(() => {
    if (!mo) return undefined;
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
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', cuon, true);
    window.addEventListener('resize', dong);
    return () => {
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
      <button ref={nut} type="button" title={chu ? undefined : nhan} aria-label={chu ? undefined : nhan} aria-haspopup="menu" aria-expanded={mo}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        /* Vùng bấm 44px ở điện thoại: `after` neo theo mép TRONG viền 1px nên 28 - 2 + 18 = 44 (-inset-2 chỉ ra 42). Chip `+n` (rộng ~30px):
           `after` 44×44 đặt giữa chip (rộng hơn nếu chip rộng hơn) — hình chip không đổi (VIEC-NHO 4). */
        className={lopNut ?? (kieu === 'chip'
          ? `${CHIP_TRON} relative min-h-[28px] bg-muted-bg text-muted tabular-nums cursor-pointer hover:brightness-125 max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:min-w-full max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']`
          : "relative inline-grid place-items-center h-7 min-w-7 px-1 rounded-md border bg-transparent text-[12px] font-semibold tabular-nums text-slate-400 hover:text-slate-100 bam cursor-pointer after:absolute after:-inset-[9px] after:content-[''] sm:after:hidden")}
        style={kieu === 'chip' || lopNut ? undefined : { borderColor: 'var(--line)' }}>
        {chu ? <>{chu} <IconGap mo={mo} size={10} /></> : mat ?? bieuTuong}
      </button>
      {mo && createPortal(<>
        {viTri?.day && <div aria-hidden className="fixed inset-0 z-[59] bg-black/60" />}
        <div ref={hop} role="menu" aria-label={chu ?? nhan}
          onKeyDown={(e) => {
            const k = buocDanhSach(bam.length, dang, e.key);
            if (k !== null) { e.preventDefault(); tro(k); }
            else if (e.key === 'Tab') { e.preventDefault(); dongVeNut(); }
          }}
          className={viTri?.day
            ? 'menu-hop fixed inset-x-0 bottom-0 z-[60] overflow-y-auto overscroll-contain rounded-t-[14px] border-t px-2 pb-[max(18px,env(safe-area-inset-bottom))] pt-2 [&_.menu-muc]:min-h-12'
            : 'menu-hop fixed z-[60] overflow-y-auto overscroll-contain w-[220px] rounded-[10px] border p-1'}
          style={viTri?.day ? { borderColor: 'var(--line-strong)', maxHeight: viTri.cao }
            : { borderColor: 'var(--line-strong)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, maxHeight: viTri?.cao, visibility: viTri ? 'visible' : 'hidden' }}>
          {viTri?.day && <div role="presentation" className="px-3 pb-1.5 pt-2 text-[15px] font-bold">{tieuDeDay}</div>}
          {muc.map((m, i) => { const ke = i === 0 || muc[i - 1]?.tieuDe ? '' : m.keTruoc === 'do' || (m.nguyHiem && !muc[i - 1]?.nguyHiem) ? 'menu-muc-nguy' : m.keTruoc ? 'menu-muc-ke' : ''; return m.tieuDe ? (
            <div key={m.key} role="presentation" className="menu-nhom">{m.nhan}</div>
          ) : (
            <button key={m.key} type="button" role={m.chon === undefined ? 'menuitem' : 'menuitemcheckbox'} aria-checked={m.chon} tabIndex={-1}
              onFocus={() => setDang(chiSo.get(m.key) ?? 0)}
              title={m.title} aria-disabled={m.tat ? 'true' : undefined}
              /* P3 UI-CHUNG: việc nguy hiểm có vạch đỏ ngay trên (không chỉ màu chữ); `dam` = vạch 2 px. */
              className={`menu-muc ${m.tat ? 'text-slate-500 cursor-not-allowed' : `${m.nguyHiem ? 'text-rose-200' : 'text-slate-200'} bam`} ${ke}`}
              style={m.keTruoc === 'dam' && ke === 'menu-muc-ke' ? { borderTop: '2px solid var(--line-strong)' } : undefined}
              onClick={(e) => { if (m.tat) { e.stopPropagation(); return; } if (m.chon === undefined) dongVeNut(); m.onChon(); }}>
              {m.chon !== undefined && <span aria-hidden>{m.chon ? '☑' : '☐'} </span>}
              {m.bieuTuong ? <span className="flex items-center gap-2.5"><span aria-hidden className="text-[color:var(--accent)]">{m.bieuTuong}</span>{m.nhan}</span> : m.nhan}
              {dongPhu(m) && <span className="menu-muc-goi">{dongPhu(m)}</span>}
            </button>
          ); })}
        </div>
      </>, document.body,
      )}
    </>
  );
}
