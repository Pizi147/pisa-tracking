import { useEffect, useRef, useState } from 'react';

export type MenuItem = {
  label: string;
  onClick: () => void;
  /** Việc khó đảo ngược (huỷ, bỏ khỏi phạm vi) — tô đỏ để không bấm nhầm như một việc thường. */
  danger?: boolean;
  /** Một dòng nói rõ việc này làm gì — hiện dưới nhãn. */
  hint?: string;
  /** Đường kẻ NGAY TRÊN mục này (tách nhóm việc hiếm/nặng ở cuối menu) — như `MenuDong`. */
  keTruoc?: boolean;
};

/**
 * MENU THAO TÁC PHỤ (PR-I Step 6) — nơi để các ngoại lệ, để mỗi dòng chỉ còn MỘT nút chính.
 *
 * Chỉ vẽ những mục truyền vào: quyền và tình trạng do nơi gọi quyết định, và máy chủ vẫn kiểm lại — ẩn một mục
 * không phải là chặn nó. Không có mục nào thì không vẽ gì (không để một nút "Thêm" rỗng).
 * `Esc` hoặc bấm ra ngoài thì đóng.
 */
export function Menu({ label, items, align = 'right', className = 'btn btn-sm btn-ghost' }: {
  label: string;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        {label} <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <div role="menu"
          className="absolute z-30 mt-1 min-w-[13rem] rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line)', [align]: 0 }}>
          {items.map((it) => (
            <button key={it.label} type="button" role="menuitem"
              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-white/5 ${it.danger ? 'text-rose-200' : 'text-slate-200'} ${
                it.keTruoc ? 'mt-1 rounded-t-none pt-2' : ''}`}
              style={it.keTruoc ? { borderTop: '1px solid var(--line)' } : undefined}
              onClick={() => { setOpen(false); it.onClick(); }}>
              {it.label}
              {it.hint && <span className="block text-[11px] text-slate-500">{it.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
