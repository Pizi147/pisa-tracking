import { Fragment, useEffect, useRef, useState } from 'react';
import { buocDanhSach } from '@shared/domain/index.ts';
import { IconGap } from './BieuTuong.tsx';
import { useBamNgoai } from './useBamNgoai.ts';

export type MenuItem = {
  label: string;
  onClick: () => void;
  /** Việc khó đảo ngược (huỷ, bỏ khỏi phạm vi) — tô đỏ để không bấm nhầm như một việc thường. */
  danger?: boolean;
  /** Một dòng nói rõ việc này làm gì — hiện dưới nhãn. */
  hint?: string;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu) — như `MenuDong`. PR-VAI-b: `dam` vạch đậm · `do` vạch đỏ (trước Xoá). */
  keTruoc?: boolean | 'dam' | 'do';
  /** PR-VAI-b (K3-48): tên nhóm — đổi nhóm thì vẽ tiêu đề nhóm 11 px chữ hoa mờ + vạch mảnh. */
  nhom?: string;
};

/**
 * MENU THAO TÁC PHỤ (PR-I Step 6) — nơi để các ngoại lệ, để mỗi dòng chỉ còn MỘT nút chính.
 *
 * Chỉ vẽ những mục truyền vào: quyền và tình trạng do nơi gọi quyết định, và máy chủ vẫn kiểm lại — ẩn một mục
 * không phải là chặn nó. Không có mục nào thì không vẽ gì (không để một nút "Thêm" rỗng).
 * `Esc` hoặc bấm ra ngoài thì đóng. Bàn phím (KHUNG-LOI, V4C-03 — như `MenuDong`): mở → focus mục đầu; ↑/↓/Home/End đi vòng;
 * Esc / Tab đóng và trả focus về nút (Esc không đóng panel chứa menu).
 */
export function Menu({ label, items, align = 'right', className = 'btn btn-sm btn-ghost' }: {
  label: string;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const mucDom = () => [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  const dongVeNut = () => { setOpen(false); nut.current?.focus(); };

  useBamNgoai(open, () => setOpen(false), ref);
  useEffect(() => {
    if (!open) return undefined;
    mucDom()[0]?.focus();
    /* Pha bắt + chặn lan: Esc chỉ đóng menu, focus về nút (trước đây focus rơi về `body`). */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation(); e.preventDefault();
      dongVeNut();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative inline-block">
      <button ref={nut} type="button" className={className} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        {label} <IconGap mo={open} size={10} />
      </button>
      {open && (
        <div role="menu"
          onKeyDown={(e) => {
            const ds = mucDom();
            const k = buocDanhSach(ds.length, ds.indexOf(document.activeElement as HTMLElement), e.key);
            if (k !== null) { e.preventDefault(); ds[k]?.focus(); }
            else if (e.key === 'Tab') { e.preventDefault(); dongVeNut(); }
          }}
          className="absolute z-30 mt-1 min-w-[13rem] rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line)', [align]: 0 }}>
          {items.map((it, i) => {
            const dauNhom = !!it.nhom && it.nhom !== items[i - 1]?.nhom;
            const vach = it.keTruoc === 'do' ? '1px solid rgb(var(--bad-rgb))' : it.keTruoc === 'dam' ? '2px solid var(--line-strong)' : it.keTruoc ? '1px solid var(--line)' : null;
            return (
              <Fragment key={`${i}-${it.label}`}>
                {dauNhom && (
                  <div role="presentation" className={`px-3 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-[.05em] text-slate-400 ${i > 0 ? 'mt-1' : ''}`}
                    style={i > 0 ? { borderTop: '1px solid var(--line)' } : undefined}>{it.nhom}</div>
                )}
                <button type="button" role="menuitem" tabIndex={-1}
                  className={`block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-white/5 ${it.danger ? 'text-rose-200' : 'text-slate-200'} ${
                    vach && !dauNhom ? 'mt-1 rounded-t-none pt-2' : ''}`}
                  style={vach && !dauNhom ? { borderTop: vach } : undefined}
                  onClick={() => { setOpen(false); it.onClick(); }}>
                  {it.label}
                  {it.hint && <span className="block text-[11.5px] text-slate-400">{it.hint}</span>}
                </button>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
