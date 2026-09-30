import { useState } from 'react';

/**
 * BADGE "THIẾU THÔNG TIN" — mục 7.5.
 *
 * MỘT badge gom mọi thứ còn thiếu, không phải mỗi thứ một nhãn. Owner nói rõ điều này, và
 * lý do nhìn bảng lớp là thấy: bốn nhãn nhỏ trên một dòng thì dòng nào cũng đầy nhãn, và
 * người đọc thôi nhìn chúng.
 *
 * Bấm vào mới bung ra danh sách. Đây KHÔNG phải việc trong hàng đợi công việc — không có
 * hạn, không ai bị thúc — nên nó không được chiếm chỗ như một việc phải làm.
 */
export function MissingBadge({ items, className = '', gon = false }: {
  items: { key: string; label: string; who: string }[] | null | undefined;
  className?: string;
  /** Dạng gọn cho bảng lớp: "Thiếu {n}"; rê chuột thấy danh sách, bấm mở popover như thường. */
  gon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="appearance-none border-0 bg-transparent p-0 cursor-pointer"
        aria-expanded={open}
        title={items.map((i) => i.label).join(' · ')}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
      >
        {/* G-4: ⚠ chỉ nghĩa là quá hạn — thiếu thông tin là badge chữ (Q12). */}
        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap bg-amber-300/10 text-amber-200 border-amber-300/30">
          {gon ? `Thiếu ${items.length}` : `Thiếu ${items.length} thông tin`}
        </span>
      </button>

      {open && (
        <span
          className="absolute z-20 top-full left-0 mt-1 rounded-lg border p-2.5 shadow-lg min-w-[15rem]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <span className="block text-[11px] text-slate-500 mb-1.5">Cần bổ sung sớm:</span>
          <span className="block space-y-1">
            {items.map((i) => (
              <span key={i.key} className="block">
                <span className="text-xs text-slate-200">{i.label}</span>
                {/* Nói rõ AI điền được, để badge không thành lời trách chung chung. */}
                <span className="block text-xs text-slate-400">{i.who}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
