import type { MouseEvent, ReactNode } from 'react';

/**
 * HÀNG LỚN / HÀNG CON (PR-UX0, N-2 — mockup 17 phương án A). Kiểu dáng nằm ở `index.css` (`.hang-lon`, `.hang-con`,
 * `.khoi-nhom-*`), màu ở token `--hang-*`. Mũi tên ▸/▾ ở cột riêng 16px, có tooltip "Mở" / "Thu gọn" (G-7).
 * `<details>` nhỏ trong panel KHÔNG dùng thứ này — nó không phải hàng.
 */

/** Nút mũi tên 16px: aria-expanded, tooltip "Mở"/"Thu gọn". */
export function MuiTenMo({ mo, onMo, nhan }: { mo: boolean; onMo: () => void; nhan: string }) {
  const chu = mo ? 'Thu gọn' : 'Mở';
  return (
    <button type="button" title={chu} aria-label={`${chu} ${nhan}`} aria-expanded={mo}
      onClick={(e) => { e.stopPropagation(); onMo(); }}
      className="max-sm:relative max-sm:before:absolute max-sm:before:-inset-3.5 max-sm:before:content-[''] inline-flex h-4 w-4 shrink-0 appearance-none items-center justify-center border-0 bg-transparent p-0 leading-none text-slate-400 hover:text-slate-100">
      {/* PR-S4F #13: SVG 8 px — ký tự ▸/▾ ở cỡ nhỏ (Be Vietnam Pro/Inter) chỉ còn như một dấu chấm. */}
      <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`transition-transform ${mo ? 'rotate-90' : ''}`}>
        <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Bấm vào chỗ trống trên hàng thì mở/đóng; bấm vào liên kết/nút con thì để yên. */
function boQuaNutCon(e: MouseEvent<HTMLElement>, lam: () => void) {
  const nut = (e.target as HTMLElement).closest('a,button');
  if (nut && nut !== e.currentTarget) return;
  lam();
}

/** Hàng lớn của bảng: `<tr>`; ô đầu = mũi tên + tiêu đề, `children` là các `<td>` còn lại. */
export function HangNhom({ mo, onMo, nhan, tieuDe, children, className = '', soCotDau = 1 }: {
  mo: boolean; onMo: () => void; nhan: string; tieuDe: ReactNode; children?: ReactNode; className?: string;
  /** Ô đầu trải mấy cột (tiêu đề dài chiếm nhiều cột đầu). */
  soCotDau?: number;
}) {
  return (
    <tr className={`hang-lon cursor-pointer ${mo ? '' : 'dong'} ${className}`} onClick={(e) => boQuaNutCon(e, onMo)}>
      <td className="px-3" colSpan={soCotDau}>
        <span className="flex min-w-0 items-center gap-2">
          <MuiTenMo mo={mo} onMo={onMo} nhan={nhan} />
          <span className="min-w-0 flex-1">{tieuDe}</span>
        </span>
      </td>
      {children}
    </tr>
  );
}

/** Hàng con của bảng: `<tr>` các `<td>`; ô đầu tự thụt sau cột mũi tên (CSS `.hang-con`). */
export function HangCon({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return <tr className={`hang-con ${className}`} title={title}>{children}</tr>;
}

/**
 * Khối nhóm cho DANH SÁCH (không phải bảng): đầu nhóm là hàng lớn, thân chỉ có khi mở.
 * `dem` là số việc (pill `tabular-nums`; `demMau="late"` tô đỏ cam), `phu` là dòng chữ mờ sau đó.
 * `rong` (PR-LT3 D1): khối không có gì — đầu tĩnh, không mũi tên, không mở; vị trí khối không nhảy.
 * `phang`: thân không thụt (bảng trải hết bề ngang khối — Lịch Test).
 */
export function KhoiNhom({ mo, onMo, nhan, tieuDe, dem, demMau, phu, children, id, rong, phang }: {
  mo: boolean; onMo: () => void; nhan: string; tieuDe: ReactNode; dem?: number; demMau?: 'late'; phu?: ReactNode; children?: ReactNode; id: string;
  rong?: boolean; phang?: boolean;
}) {
  const demCls = demMau ? 'bg-late-bg text-late' : 'text-slate-300';
  if (rong) {
    return (
      <section>
        <div className={`khoi-nhom-dau dong rong ${phang ? 'max-sm:min-h-[44px]' : ''}`}>
          <span className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-slate-400">{tieuDe}</span>
          {dem !== undefined && <span className="rounded-full px-1.5 text-xs font-bold tabular-nums text-slate-400" style={{ background: 'var(--surface-2)' }}>{dem}</span>}
        </div>
      </section>
    );
  }
  return (
    <section>
      <div className={`khoi-nhom-dau ${mo ? '' : 'dong'} ${phang ? 'max-sm:min-h-[44px]' : ''}`} onClick={(e) => boQuaNutCon(e, onMo)}>
        <MuiTenMo mo={mo} onMo={onMo} nhan={nhan} />
        <span className="text-slate-100">{tieuDe}</span>
        {dem !== undefined && <span className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${demCls}`} style={demMau ? undefined : { background: 'var(--surface-2)' }}>{dem}</span>}
        {phu && <span className="text-[11px] font-normal text-slate-500">{phu}</span>}
      </div>
      {mo && <div id={id} className={phang ? '' : 'khoi-nhom-con'}>{children}</div>}
    </section>
  );
}
