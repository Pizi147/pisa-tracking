import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { chuChipSos, giaiThichSos, type VaoChipSos } from '@shared/domain/index.ts';

/**
 * DÁNG CHIP SOS — MỘT CHỖ (OV-15a, C08): chỉ VIỀN vàng / cam / đỏ, không nền; bậc đọc được cả khi không phân biệt màu:
 * viền 1 → 1,5 → 2,5 px, SOS 3 thêm vòng ngoài (viền đôi); tạm = viền đứt. `SCORE_CHIP` (ô kết quả) dùng lại lớp này.
 */
export function lopSos(muc: number, tam?: boolean): string {
  const vien = muc <= 1 ? 'border border-sos1 text-sos1-chu'
    : muc === 2 ? 'border-[1.5px] border-sos2 text-sos2-chu'
    : 'mx-[2.5px] border-[2.5px] border-sos3 text-sos3-chu outline outline-1 outline-offset-[1.5px] outline-sos3';
  return `bg-transparent ${vien} ${tam ? `border-dashed ${muc >= 3 ? 'outline-dashed' : ''}` : ''}`;
}
const CHIP = 'inline-flex h-[22px] min-w-[30px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 text-[12px] font-bold leading-none tabular-nums';

/**
 * CHIP SOS — mọi màn (Học viên & Lớp, lưới điểm, Case, hồ sơ…). Bấm chip = hộp "Vì sao SOS n" ngay cạnh (tiêu đề → kết luận đậm → số → việc),
 * KHÔNG nút `?` cạnh (chủ SP 19/10). Esc / bấm ra ngoài / cuộn thì đóng. Hộp vẽ qua portal, vị trí cố định — không bị khung cuộn của bảng cắt.
 */
export function ChipSos({ muc, kyNang, hienKyNang = true, tam, dot, ten, thuong, soLieu, viec, tinh }: VaoChipSos & {
  /** Đã có cột kỹ năng riêng cạnh chip → chip chỉ "SOS n"; hộp giải thích vẫn đếm kỹ năng. */
  hienKyNang?: boolean;
  /** Dòng số trong hộp: [nhãn, giá trị] — vd ["Kỳ vọng MT3", "6.5"], ["L", "6.0"]. */
  soLieu?: Array<[string, string]>;
  /** Việc có thể làm (link "Mở hồ sơ MT3 ›"). */
  viec?: ReactNode;
  /** Chip nằm trong một nút / link khác (tên Case bấm mở Case): chỉ vẽ, không mở hộp — không lồng nút trong nút. */
  tinh?: boolean;
}) {
  const [cho, setCho] = useState<CSSProperties | null>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!cho) return;
    const dong = () => setCho(null);
    const ngoai = (e: MouseEvent) => { if (!hop.current?.contains(e.target as Node) && !nut.current?.contains(e.target as Node)) dong(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { dong(); nut.current?.focus(); } };
    document.addEventListener('mousedown', ngoai);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', ngoai); document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', dong, true); window.removeEventListener('resize', dong);
    };
  }, [cho]);
  if (muc <= 0) return null;
  const vao = { muc, kyNang, tam, dot, ten, thuong };
  if (tinh) return <span className={`${CHIP} ${lopSos(muc, tam)}`}>{chuChipSos(hienKyNang ? vao : { muc, tam })}</span>;
  const g = giaiThichSos(vao);
  const mo = () => {
    const r = nut.current!.getBoundingClientRect();
    const rong = Math.min(300, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - rong - 8));
    setCho(r.bottom + 240 > window.innerHeight && r.top > 240
      ? { left, width: rong, bottom: window.innerHeight - r.top + 8 } : { left, width: rong, top: r.bottom + 8 });
  };
  return (
    <>
      <button ref={nut} type="button" aria-haspopup="dialog" aria-expanded={!!cho} onClick={() => (cho ? setCho(null) : mo())}
        className={`${CHIP} ${lopSos(muc, tam)} relative cursor-pointer hover:bg-[color:var(--accent-soft)] max-sm:after:absolute max-sm:after:-inset-y-3 max-sm:after:inset-x-0 max-sm:after:content-['']`}>
        {chuChipSos(hienKyNang ? vao : { muc, tam })}
      </button>
      {cho && createPortal(
        <span ref={hop} role="dialog" aria-label={g.tieuDe} style={cho}
          className="fixed z-50 flex flex-col gap-1.5 rounded-[10px] border border-[color:var(--line-strong)] bg-[color:var(--surface)] px-3.5 py-3 text-left text-[13px] font-normal normal-case leading-[1.45] tracking-normal text-dim shadow-xl">
          <span className="text-[13px] font-bold text-slate-100">{g.tieuDe}</span>
          <span className="text-[14px] font-semibold text-slate-100">{g.ketLuan}</span>
          {g.phu && <span>{g.phu}</span>}
          {soLieu?.length ? (
            <span className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 tabular-nums">
              {soLieu.map(([nhan, gt]) => <span key={nhan} className="contents"><span>{nhan}</span><b className="text-right text-slate-100">{gt}</b></span>)}
            </span>
          ) : <span className="text-[12px]">{g.luat}</span>}
          {viec && <span className="font-semibold">{viec}</span>}
        </span>,
        document.body,
      )}
    </>
  );
}
